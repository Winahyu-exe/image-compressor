export const ERROR_CODES = Object.freeze({
  NO_FILE: 'NO_FILE',
  EMPTY_FILE: 'EMPTY_FILE',
  UNSUPPORTED_TYPE: 'UNSUPPORTED_TYPE',
  MISMATCHED_TYPE: 'MISMATCHED_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  TOO_MANY_PIXELS: 'TOO_MANY_PIXELS',
  DECODE_FAILED: 'DECODE_FAILED',
  ENCODE_FAILED: 'ENCODE_FAILED',
  OUT_OF_MEMORY: 'OUT_OF_MEMORY',
  UNSUPPORTED_BROWSER: 'UNSUPPORTED_BROWSER',
});

export const VALIDATION_MESSAGES = Object.freeze({
  [ERROR_CODES.NO_FILE]: {
    title: 'Choose an image to continue.',
    message: 'No file was selected. Choose one JPEG, PNG, or WebP image.',
  },
  [ERROR_CODES.EMPTY_FILE]: {
    title: 'This file is empty.',
    message: 'Choose a JPEG, PNG, or WebP image that contains image data.',
  },
  [ERROR_CODES.UNSUPPORTED_TYPE]: {
    title: "This image format isn't supported.",
    message: 'Choose a JPEG, PNG, or WebP image.',
  },
  [ERROR_CODES.MISMATCHED_TYPE]: {
    title: "This image doesn't match its declared format.",
    message: 'Choose a normal JPEG, PNG, or WebP image file.',
  },
  [ERROR_CODES.FILE_TOO_LARGE]: {
    title: 'This image is over the 20 MB limit.',
    message: 'Choose a smaller image before trying again.',
  },
  [ERROR_CODES.TOO_MANY_PIXELS]: {
    title: "This image's dimensions are too large for this device.",
    message: 'Resize it first or choose a smaller image.',
  },
  [ERROR_CODES.DECODE_FAILED]: {
    title: "We couldn't read this image.",
    message: 'Try another copy of the image or save it as JPEG, PNG, or WebP.',
  },
  [ERROR_CODES.ENCODE_FAILED]: {
    title: "We couldn't compress this image.",
    message: 'Retry or choose another output format.',
  },
  [ERROR_CODES.OUT_OF_MEMORY]: {
    title: 'This image is too large to process on this device.',
    message: 'Close other tabs or choose a smaller image.',
  },
  [ERROR_CODES.UNSUPPORTED_BROWSER]: {
    title: "Your browser doesn't support this output format.",
    message: 'Use JPEG, PNG, WebP, or another modern browser.',
  },
});

const SAFE_FORMAT_LABELS = Object.freeze({
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
});

const SAFE_FORMAT_EXTENSIONS = Object.freeze({
  jpeg: 'jpg',
  jpg: 'jpg',
  png: 'png',
  webp: 'webp',
});

function getMismatchMessage(details = {}) {
  const detectedLabel = SAFE_FORMAT_LABELS[details.detectedFormat];

  if (!detectedLabel) {
    return VALIDATION_MESSAGES[ERROR_CODES.MISMATCHED_TYPE];
  }

  const declaredExtension = SAFE_FORMAT_EXTENSIONS[String(details.declaredExtension || '').toLowerCase()];

  if (declaredExtension) {
    return {
      title: "File format doesn't match its extension",
      message: `This file is named .${declaredExtension}, but its actual format appears to be ${detectedLabel}. Rename it to .${detectedLabel === 'JPEG' ? 'jpg' : detectedLabel.toLowerCase()} and try again.`,
    };
  }

  const declaredLabel = SAFE_FORMAT_LABELS[details.declaredFormat];

  if (declaredLabel) {
    return {
      title: "File format doesn't match its extension",
      message: `This file is declared as ${declaredLabel}, but its actual format appears to be ${detectedLabel}. Rename it to .${detectedLabel === 'JPEG' ? 'jpg' : detectedLabel.toLowerCase()} and try again.`,
    };
  }

  return VALIDATION_MESSAGES[ERROR_CODES.MISMATCHED_TYPE];
}

export function getValidationMessage(code, details = {}) {
  if (code === ERROR_CODES.MISMATCHED_TYPE) {
    return getMismatchMessage(details);
  }

  return VALIDATION_MESSAGES[code] || VALIDATION_MESSAGES[ERROR_CODES.DECODE_FAILED];
}
