import { ERROR_CODES } from '../../shared/errors.js';

export const IMAGE_VALIDATION_LIMITS = Object.freeze({
  maxBytes: 20 * 1024 * 1024,
  maxPixels: 40_000_000,
  maxSide: 16_384,
});

export const SUPPORTED_IMAGE_TYPES = Object.freeze({
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
});

const SUPPORTED_EXTENSIONS = Object.freeze({
  jpeg: SUPPORTED_IMAGE_TYPES.jpeg,
  jpg: SUPPORTED_IMAGE_TYPES.jpeg,
  png: SUPPORTED_IMAGE_TYPES.png,
  webp: SUPPORTED_IMAGE_TYPES.webp,
});

const SIGNATURE_BYTES = 16;

function isFileLike(file) {
  return (
    file &&
    typeof file === 'object' &&
    typeof file.size === 'number' &&
    typeof file.slice === 'function'
  );
}

function detectSignature(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return SUPPORTED_IMAGE_TYPES.jpeg;
  }

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return SUPPORTED_IMAGE_TYPES.png;
  }

  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return SUPPORTED_IMAGE_TYPES.webp;
  }

  return null;
}

function getSupportedMimeType(mimeType) {
  return Object.values(SUPPORTED_IMAGE_TYPES).includes(mimeType) ? mimeType : null;
}

function getDeclaredFormat(file) {
  const extension = String(file.name || '')
    .split('.')
    .pop()
    ?.toLowerCase();
  const mimeType = getSupportedMimeType(file.type);

  return {
    extension: extension && SUPPORTED_EXTENSIONS[extension] ? extension : null,
    extensionMimeType: extension && SUPPORTED_EXTENSIONS[extension] ? SUPPORTED_EXTENSIONS[extension] : null,
    mimeType,
  };
}

function getMismatchDetails(declaredFormat, detectedFormat) {
  if (declaredFormat.extensionMimeType && declaredFormat.extensionMimeType !== detectedFormat) {
    return {
      declaredExtension: declaredFormat.extension,
      declaredFormat: declaredFormat.extensionMimeType,
      detectedFormat,
    };
  }

  if (declaredFormat.mimeType && declaredFormat.mimeType !== detectedFormat) {
    return {
      declaredExtension: null,
      declaredFormat: declaredFormat.mimeType,
      detectedFormat,
    };
  }

  return null;
}

async function readSignature(file) {
  const buffer = await file.slice(0, SIGNATURE_BYTES).arrayBuffer();

  return detectSignature(new Uint8Array(buffer));
}

function assertDimensions(decoded) {
  const width = Number(decoded?.width);
  const height = Number(decoded?.height);

  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > IMAGE_VALIDATION_LIMITS.maxSide ||
    height > IMAGE_VALIDATION_LIMITS.maxSide ||
    width * height > IMAGE_VALIDATION_LIMITS.maxPixels
  ) {
    return {
      code: ERROR_CODES.TOO_MANY_PIXELS,
    };
  }

  return {
    height,
    width,
  };
}

async function decodeWithImageBitmap(file, createImageBitmapImpl) {
  const bitmap = await createImageBitmapImpl(file);

  try {
    return {
      height: bitmap.height,
      width: bitmap.width,
    };
  } finally {
    if (typeof bitmap.close === 'function') {
      bitmap.close();
    }
  }
}

async function decodeWithImageElement(file, browserApis) {
  const { Image: ImageConstructor, URL: urlApi } = browserApis;

  if (!ImageConstructor || !urlApi?.createObjectURL || !urlApi?.revokeObjectURL) {
    throw new Error('No supported image decoder is available.');
  }

  const image = new ImageConstructor();
  const objectUrl = urlApi.createObjectURL(file);

  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = objectUrl;
    });

    return {
      height: image.naturalHeight || image.height,
      width: image.naturalWidth || image.width,
    };
  } finally {
    image.onload = null;
    image.onerror = null;
    urlApi.revokeObjectURL(objectUrl);
  }
}

async function decodeImage(file, options) {
  if (options.decodeImage) {
    return options.decodeImage(file);
  }

  const createImageBitmapImpl = options.createImageBitmap || globalThis.createImageBitmap;

  if (typeof createImageBitmapImpl === 'function') {
    try {
      return await decodeWithImageBitmap(file, createImageBitmapImpl);
    } catch (error) {
      if (!options.Image && !globalThis.Image) {
        throw error;
      }
    }
  }

  return decodeWithImageElement(file, {
    Image: options.Image || globalThis.Image,
    URL: options.URL || globalThis.URL,
  });
}

export async function validateImage(file, options = {}) {
  if (!isFileLike(file)) {
    return {
      ok: false,
      code: ERROR_CODES.NO_FILE,
    };
  }

  if (file.size <= 0) {
    return {
      ok: false,
      code: ERROR_CODES.EMPTY_FILE,
    };
  }

  if (file.size > IMAGE_VALIDATION_LIMITS.maxBytes) {
    return {
      ok: false,
      code: ERROR_CODES.FILE_TOO_LARGE,
    };
  }

  let signatureType;

  try {
    signatureType = await readSignature(file);
  } catch {
    return {
      ok: false,
      code: ERROR_CODES.DECODE_FAILED,
    };
  }

  if (!signatureType) {
    return {
      ok: false,
      code: ERROR_CODES.UNSUPPORTED_TYPE,
    };
  }

  const declaredFormat = getDeclaredFormat(file);
  const mismatchDetails = getMismatchDetails(declaredFormat, signatureType);

  if (mismatchDetails) {
    return {
      ok: false,
      code: ERROR_CODES.MISMATCHED_TYPE,
      details: mismatchDetails,
    };
  }

  if (!declaredFormat.extensionMimeType && !declaredFormat.mimeType && file.type && file.type !== signatureType) {
    return {
      ok: false,
      code: ERROR_CODES.MISMATCHED_TYPE,
    };
  }

  let decoded;

  try {
    decoded = await decodeImage(file, options);
  } catch {
    return {
      ok: false,
      code: ERROR_CODES.DECODE_FAILED,
    };
  }

  const dimensions = assertDimensions(decoded);

  if (dimensions.code) {
    return {
      ok: false,
      code: dimensions.code,
    };
  }

  return {
    ok: true,
    metadata: {
      height: dimensions.height,
      mimeType: signatureType,
      name: file.name || '',
      size: file.size,
      width: dimensions.width,
    },
  };
}
