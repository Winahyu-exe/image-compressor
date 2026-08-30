import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ERROR_CODES } from '../../src/shared/errors.js';
import {
  IMAGE_VALIDATION_LIMITS,
  validateImage,
} from '../../src/tools/image-compressor/validate-image.js';

const FIXTURES = {
  jpeg: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/ASP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/ASP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Al//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQQAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z',
  png: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  webp: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
};

function bytesFromBase64(base64) {
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

function fileFromFixture(format, options = {}) {
  const mimeTypes = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };

  return new File([bytesFromBase64(FIXTURES[format])], options.name || `image.${format}`, {
    type: options.type ?? mimeTypes[format],
  });
}

function makeDecodeImage(dimensions = { width: 1, height: 1 }) {
  return async () => dimensions;
}

test('accepts a valid JPEG by content and decode result', async () => {
  const result = await validateImage(fileFromFixture('jpeg'), {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.metadata.mimeType, 'image/jpeg');
  assert.equal(result.metadata.width, 1);
  assert.equal(result.metadata.height, 1);
});

test('accepts a valid PNG by content and decode result', async () => {
  const result = await validateImage(fileFromFixture('png'), {
    decodeImage: makeDecodeImage({ width: 2, height: 3 }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.metadata.mimeType, 'image/png');
  assert.equal(result.metadata.width, 2);
  assert.equal(result.metadata.height, 3);
});

test('accepts a valid WebP by content and decode result', async () => {
  const result = await validateImage(fileFromFixture('webp'), {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, true);
  assert.equal(result.metadata.mimeType, 'image/webp');
});

test('does not reject a valid image only because the extension is unsupported', async () => {
  const result = await validateImage(
    fileFromFixture('jpeg', {
      name: 'renamed.gif',
      type: 'image/jpeg',
    }),
    { decodeImage: makeDecodeImage() },
  );

  assert.equal(result.ok, true);
  assert.equal(result.metadata.mimeType, 'image/jpeg');
});

test('rejects unsupported content even when a filename has an image extension', async () => {
  const file = new File([Buffer.from('GIF89a')], 'image.gif', { type: 'image/gif' });
  const result = await validateImage(file, {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.UNSUPPORTED_TYPE);
});

test('rejects mismatched MIME type and content signature', async () => {
  const result = await validateImage(fileFromFixture('png', { type: 'image/jpeg' }), {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.MISMATCHED_TYPE);
});

test('rejects .png filename with JPEG content and reports detected format', async () => {
  const result = await validateImage(fileFromFixture('jpeg', { name: 'editorial.png' }), {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.MISMATCHED_TYPE);
  assert.equal(result.details.declaredExtension, 'png');
  assert.equal(result.details.declaredFormat, 'image/png');
  assert.equal(result.details.detectedFormat, 'image/jpeg');
});

test('rejects .jpg filename with PNG content and reports detected format', async () => {
  const result = await validateImage(fileFromFixture('png', { name: 'image.jpg' }), {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.MISMATCHED_TYPE);
  assert.equal(result.details.declaredExtension, 'jpg');
  assert.equal(result.details.declaredFormat, 'image/jpeg');
  assert.equal(result.details.detectedFormat, 'image/png');
});

test('rejects .jpeg filename with PNG content and reports detected format', async () => {
  const result = await validateImage(fileFromFixture('png', { name: 'image.jpeg' }), {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.MISMATCHED_TYPE);
  assert.equal(result.details.declaredExtension, 'jpeg');
  assert.equal(result.details.declaredFormat, 'image/jpeg');
  assert.equal(result.details.detectedFormat, 'image/png');
});

test('rejects .webp filename with JPEG content and reports detected format', async () => {
  const result = await validateImage(fileFromFixture('jpeg', { name: 'image.webp' }), {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.MISMATCHED_TYPE);
  assert.equal(result.details.declaredExtension, 'webp');
  assert.equal(result.details.declaredFormat, 'image/webp');
  assert.equal(result.details.detectedFormat, 'image/jpeg');
});

test('rejects .webp filename with PNG content and reports detected format', async () => {
  const result = await validateImage(fileFromFixture('png', { name: 'image.webp' }), {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.MISMATCHED_TYPE);
  assert.equal(result.details.declaredExtension, 'webp');
  assert.equal(result.details.declaredFormat, 'image/webp');
  assert.equal(result.details.detectedFormat, 'image/png');
});

test('rejects unknown or malformed content without detected-format metadata', async () => {
  const file = new File([Uint8Array.from([0x00, 0x01, 0x02, 0x03])], 'broken.png', {
    type: 'image/png',
  });
  const result = await validateImage(file, {
    decodeImage: makeDecodeImage(),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.UNSUPPORTED_TYPE);
  assert.equal(result.details, undefined);
});

test('rejects oversized files before decoding', async () => {
  let decoded = false;
  const file = new File(
    [bytesFromBase64(FIXTURES.jpeg), new Uint8Array(IMAGE_VALIDATION_LIMITS.maxBytes + 1)],
    'large.jpg',
    { type: 'image/jpeg' },
  );

  const result = await validateImage(file, {
    decodeImage: async () => {
      decoded = true;
      return { width: 1, height: 1 };
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.FILE_TOO_LARGE);
  assert.equal(decoded, false);
});

test('rejects malformed or corrupted images when decoding fails', async () => {
  const file = new File([Uint8Array.from([0xff, 0xd8, 0xff, 0x00])], 'broken.jpg', {
    type: 'image/jpeg',
  });

  const result = await validateImage(file, {
    decodeImage: async () => {
      throw new Error('decode failed');
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.DECODE_FAILED);
});

test('rejects excessively large dimensions', async () => {
  const result = await validateImage(fileFromFixture('jpeg'), {
    decodeImage: makeDecodeImage({ width: 8000, height: 6000 }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.TOO_MANY_PIXELS);
});

test('rejects empty or invalid input', async () => {
  const noFile = await validateImage(null);
  const empty = await validateImage(new File([], 'empty.jpg', { type: 'image/jpeg' }));

  assert.equal(noFile.ok, false);
  assert.equal(noFile.code, ERROR_CODES.NO_FILE);
  assert.equal(empty.ok, false);
  assert.equal(empty.code, ERROR_CODES.EMPTY_FILE);
});
