import { ERROR_CODES } from '../../shared/errors.js';

export const QUALITY_PRESETS = Object.freeze({
  smaller: 0.6,
  balanced: 0.78,
  better: 0.88,
});

export const OUTPUT_EXTENSIONS = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
});

export const MEMORY_GUARD = Object.freeze({
  bytesPerPixel: 4,
  // Source bitmap + destination canvas + encoder scratch space can coexist briefly.
  overheadMultiplier: 3,
  maxEstimatedBytes: 512 * 1024 * 1024,
});

export function estimateCanvasMemoryBytes(width, height) {
  const pixels = Number(width) * Number(height);

  if (!Number.isFinite(pixels) || pixels <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return pixels * MEMORY_GUARD.bytesPerPixel * MEMORY_GUARD.overheadMultiplier;
}

export function isCanvasMemorySafe(width, height) {
  return estimateCanvasMemoryBytes(width, height) <= MEMORY_GUARD.maxEstimatedBytes;
}

function waitForIdleBoundary() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function mapProcessingError(error, stage) {
  const message = String(error?.message || '').toLowerCase();
  const name = String(error?.name || '').toLowerCase();

  if (message.includes('memory') || message.includes('quota') || name.includes('quota')) {
    return ERROR_CODES.OUT_OF_MEMORY;
  }

  if (message.includes('browser') || message.includes('mime')) {
    return ERROR_CODES.UNSUPPORTED_BROWSER;
  }

  if (stage === 'decode') {
    return ERROR_CODES.DECODE_FAILED;
  }

  return ERROR_CODES.ENCODE_FAILED;
}

function getQuality(settings) {
  if (typeof settings.quality === 'number') {
    return Math.min(0.95, Math.max(0.4, settings.quality));
  }

  return QUALITY_PRESETS[settings.preset] ?? QUALITY_PRESETS.balanced;
}

function getOutputMimeType(inputMimeType, requestedOutput) {
  if (!requestedOutput || requestedOutput === 'original') {
    return inputMimeType;
  }

  if (OUTPUT_EXTENSIONS[requestedOutput]) {
    return requestedOutput;
  }

  throw new Error('Unsupported browser MIME request.');
}

function getDownloadName(inputName, outputMimeType) {
  const extension = OUTPUT_EXTENSIONS[outputMimeType] || 'png';
  const baseName = String(inputName || 'compressed-image')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/[\u0000-\u001f\u007f]/g, '-')
    .replace(/\.[^.]*$/, '')
    .trim()
    .slice(0, 120);

  return `${baseName || 'compressed-image'}-compressed.${extension}`;
}

async function decodeBitmap(file, apis) {
  const createImageBitmapImpl = apis.createImageBitmap || globalThis.createImageBitmap;

  if (typeof createImageBitmapImpl === 'function') {
    try {
      const bitmap = await createImageBitmapImpl(file, { imageOrientation: 'from-image' });

      return {
        close: () => {
          if (typeof bitmap.close === 'function') {
            bitmap.close();
          }
        },
        drawable: bitmap,
        height: bitmap.height,
        width: bitmap.width,
      };
    } catch (error) {
      if (!apis.Image && !globalThis.Image) {
        throw error;
      }
    }
  }

  const ImageConstructor = apis.Image || globalThis.Image;
  const urlApi = apis.URL || globalThis.URL;

  if (!ImageConstructor || !urlApi?.createObjectURL || !urlApi?.revokeObjectURL) {
    throw new Error('Browser image decoding is unavailable.');
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
      close: () => {
        image.onload = null;
        image.onerror = null;
        urlApi.revokeObjectURL(objectUrl);
      },
      drawable: image,
      height: image.naturalHeight || image.height,
      width: image.naturalWidth || image.width,
    };
  } catch (error) {
    urlApi.revokeObjectURL(objectUrl);
    throw error;
  }
}

function createCanvas(width, height, apis) {
  if (apis.createCanvas) {
    return apis.createCanvas(width, height);
  }

  const documentRef = apis.document || globalThis.document;
  const canvas = documentRef?.createElement?.('canvas');

  if (!canvas) {
    throw new Error('Browser canvas is unavailable.');
  }

  canvas.width = width;
  canvas.height = height;

  return canvas;
}

async function encodeCanvas(canvas, outputMimeType, quality, apis) {
  if (apis.encodeCanvas) {
    return apis.encodeCanvas(canvas, outputMimeType, quality);
  }

  if (typeof canvas.toBlob !== 'function') {
    throw new Error('Browser encoder is unavailable.');
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Image encoding failed.'));
        }
      },
      outputMimeType,
      outputMimeType === 'image/png' ? undefined : quality,
    );
  });
}

export async function processImage(validatedInput, settings = {}, apis = {}) {
  const file = validatedInput?.file;
  const metadata = validatedInput?.metadata;

  if (!file || !metadata?.mimeType || !metadata?.width || !metadata?.height) {
    return {
      ok: false,
      code: ERROR_CODES.DECODE_FAILED,
    };
  }

  let outputMimeType;
  let quality;
  let decoded;
  let canvas;
  let stage = 'decode';

  try {
    outputMimeType = getOutputMimeType(metadata.mimeType, settings.outputFormat);
    quality = getQuality(settings);
    await waitForIdleBoundary();
    decoded = await decodeBitmap(file, apis);
    stage = 'draw';

    if (!isCanvasMemorySafe(metadata.width, metadata.height)) {
      return {
        ok: false,
        code: ERROR_CODES.OUT_OF_MEMORY,
        details: {
          estimatedBytes: estimateCanvasMemoryBytes(metadata.width, metadata.height),
          maxEstimatedBytes: MEMORY_GUARD.maxEstimatedBytes,
        },
      };
    }

    canvas = createCanvas(metadata.width, metadata.height, apis);

    const context = canvas.getContext?.('2d', { alpha: outputMimeType !== 'image/jpeg' });

    if (!context) {
      throw new Error('Browser canvas context is unavailable.');
    }

    if (outputMimeType === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, metadata.width, metadata.height);
    }

    context.drawImage(decoded.drawable, 0, 0, metadata.width, metadata.height);

    stage = 'encode';
    const blob = await encodeCanvas(canvas, outputMimeType, quality, apis);

    if (!blob || blob.size <= 0) {
      return {
        ok: false,
        code: ERROR_CODES.ENCODE_FAILED,
      };
    }

    if (blob.type !== outputMimeType) {
      return {
        ok: false,
        code: ERROR_CODES.UNSUPPORTED_BROWSER,
      };
    }

    const bytesChanged = metadata.size - blob.size;
    const ratio = metadata.size > 0 ? bytesChanged / metadata.size : 0;
    const resultStatus =
      bytesChanged > 0 ? 'reduced' : bytesChanged === 0 ? 'unchanged' : 'larger';

    return {
      ok: true,
      result: {
        blob,
        bytesChanged,
        downloadName: getDownloadName(metadata.name, outputMimeType),
        height: metadata.height,
        inputMimeType: metadata.mimeType,
        originalName: metadata.name,
        originalSize: metadata.size,
        outputMimeType,
        outputSize: blob.size,
        preset: settings.preset || 'balanced',
        quality: outputMimeType === 'image/png' ? null : quality,
        reductionPercent: ratio * 100,
        resultStatus,
        width: metadata.width,
      },
    };
  } catch (error) {
    return {
      ok: false,
      code: mapProcessingError(error, stage),
    };
  } finally {
    if (decoded) {
      decoded.close();
    }

    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}
