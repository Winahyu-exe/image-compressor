import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ERROR_CODES } from '../../src/shared/errors.js';
import {
  QUALITY_PRESETS,
  processImage,
} from '../../src/tools/image-compressor/process-image.js';

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

function createValidatedInput(format, overrides = {}) {
  const file = fileFromFixture(format, overrides);

  return {
    file,
    metadata: {
      height: overrides.height || 1,
      mimeType: file.type,
      name: file.name,
      size: overrides.size || file.size,
      width: overrides.width || 1,
    },
  };
}

function createProcessingApis(options = {}) {
  const calls = {
    bitmapClosed: 0,
    drawImage: 0,
    fillRect: 0,
    lastQuality: undefined,
    lastType: undefined,
  };
  const canvas = {
    height: 0,
    width: 0,
    getContext: () => ({
      drawImage: () => {
        calls.drawImage += 1;
      },
      fillRect: () => {
        calls.fillRect += 1;
      },
      fillStyle: '',
    }),
    toBlob: (callback, type, quality) => {
      calls.lastQuality = quality;
      calls.lastType = type;
      callback(options.blob === null ? null : new Blob(['encoded'], { type: options.blobType || type }));
    },
  };

  return {
    apis: {
      createCanvas: (width, height) => {
        canvas.width = width;
        canvas.height = height;
        return canvas;
      },
      createImageBitmap: async () => {
        if (options.decodeError) {
          throw new Error('decode failed');
        }

        return {
          close: () => {
            calls.bitmapClosed += 1;
          },
          height: options.height || 1,
          width: options.width || 1,
        };
      },
      encodeCanvas: options.encodeCanvas,
    },
    calls,
    canvas,
  };
}

test('compresses JPEG with browser-style Blob output and metadata', async () => {
  const { apis, calls, canvas } = createProcessingApis();
  const result = await processImage(createValidatedInput('jpeg'), { preset: 'balanced' }, apis);

  assert.equal(result.ok, true);
  assert.equal(result.result.outputMimeType, 'image/jpeg');
  assert.equal(result.result.downloadName, 'image-compressed.jpg');
  assert.equal(result.result.quality, QUALITY_PRESETS.balanced);
  assert.equal(result.result.width, 1);
  assert.equal(result.result.height, 1);
  assert.equal(calls.drawImage, 1);
  assert.equal(calls.fillRect, 1);
  assert.equal(calls.bitmapClosed, 1);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test('handles PNG as lossless output without JPEG-style quality', async () => {
  const { apis } = createProcessingApis();
  const result = await processImage(createValidatedInput('png'), { preset: 'smaller' }, apis);

  assert.equal(result.ok, true);
  assert.equal(result.result.outputMimeType, 'image/png');
  assert.equal(result.result.quality, null);
  assert.equal(['larger', 'reduced', 'unchanged'].includes(result.result.resultStatus), true);
});

test('reports a smaller PNG result from actual Blob sizes', async () => {
  const input = createValidatedInput('png', { size: 1000 });
  const { apis } = createProcessingApis({
    encodeCanvas: async () => new Blob([new Uint8Array(700)], { type: 'image/png' }),
  });
  const result = await processImage(input, { preset: 'smaller' }, apis);

  assert.equal(result.ok, true);
  assert.equal(result.result.outputMimeType, 'image/png');
  assert.equal(result.result.outputSize, 700);
  assert.equal(result.result.originalSize, 1000);
  assert.equal(result.result.bytesChanged, 300);
  assert.equal(result.result.reductionPercent, 30);
  assert.equal(result.result.resultStatus, 'reduced');
});

test('reports an unchanged PNG result without fake savings', async () => {
  const input = createValidatedInput('png', { size: 306 });
  const { apis } = createProcessingApis({
    encodeCanvas: async () => new Blob([new Uint8Array(306)], { type: 'image/png' }),
  });
  const result = await processImage(input, { preset: 'smaller' }, apis);

  assert.equal(result.ok, true);
  assert.equal(result.result.outputMimeType, 'image/png');
  assert.equal(result.result.outputSize, 306);
  assert.equal(result.result.originalSize, 306);
  assert.equal(result.result.bytesChanged, 0);
  assert.equal(result.result.reductionPercent, 0);
  assert.equal(result.result.resultStatus, 'unchanged');
});

test('reports a larger PNG result as an increase without fake savings', async () => {
  const input = createValidatedInput('png', { size: 1700 });
  const { apis } = createProcessingApis({
    encodeCanvas: async () => new Blob([new Uint8Array(2100)], { type: 'image/png' }),
  });
  const result = await processImage(input, { preset: 'smaller' }, apis);

  assert.equal(result.ok, true);
  assert.equal(result.result.outputMimeType, 'image/png');
  assert.equal(result.result.outputSize, 2100);
  assert.equal(result.result.originalSize, 1700);
  assert.equal(result.result.bytesChanged, -400);
  assert.equal(Math.round(Math.abs(result.result.reductionPercent) * 10) / 10, 23.5);
  assert.equal(result.result.resultStatus, 'larger');
});

test('handles WebP output where the browser encoder supports it', async () => {
  const { apis } = createProcessingApis();
  const result = await processImage(createValidatedInput('webp'), { preset: 'better' }, apis);

  assert.equal(result.ok, true);
  assert.equal(result.result.outputMimeType, 'image/webp');
  assert.equal(result.result.quality, QUALITY_PRESETS.better);
});

test('applies documented preset qualities', async () => {
  const smaller = createProcessingApis();
  const better = createProcessingApis();

  await processImage(createValidatedInput('jpeg'), { preset: 'smaller' }, smaller.apis);
  await processImage(createValidatedInput('jpeg'), { preset: 'better' }, better.apis);

  assert.equal(smaller.calls.lastQuality, QUALITY_PRESETS.smaller);
  assert.equal(better.calls.lastQuality, QUALITY_PRESETS.better);
});

test('supports explicit output generation metadata', async () => {
  const { apis } = createProcessingApis();
  const result = await processImage(
    createValidatedInput('jpeg', { name: '<bad/name>.jpg', width: 4, height: 5 }),
    { outputFormat: 'image/webp', preset: 'balanced' },
    apis,
  );

  assert.equal(result.ok, true);
  assert.equal(result.result.outputMimeType, 'image/webp');
  assert.equal(result.result.downloadName, '-bad-name--compressed.webp');
  assert.equal(result.result.width, 4);
  assert.equal(result.result.height, 5);
  assert.equal(typeof result.result.reductionPercent, 'number');
});

test('classifies unchanged and larger outputs without claiming savings', async () => {
  const unchanged = createProcessingApis({
    encodeCanvas: async () => new Blob([new Uint8Array(createValidatedInput('png').metadata.size)], { type: 'image/png' }),
  });
  const larger = createProcessingApis({
    encodeCanvas: async () => new Blob([new Uint8Array(createValidatedInput('png').metadata.size + 1)], { type: 'image/png' }),
  });

  const unchangedResult = await processImage(createValidatedInput('png'), { preset: 'smaller' }, unchanged.apis);
  const largerResult = await processImage(createValidatedInput('png'), { preset: 'smaller' }, larger.apis);

  assert.equal(unchangedResult.ok, true);
  assert.equal(unchangedResult.result.resultStatus, 'unchanged');
  assert.equal(unchangedResult.result.bytesChanged, 0);
  assert.equal(largerResult.ok, true);
  assert.equal(largerResult.result.resultStatus, 'larger');
  assert.equal(largerResult.result.bytesChanged, -1);
});

test('returns a safe error when decoding fails', async () => {
  const { apis, calls } = createProcessingApis({ decodeError: true });
  const result = await processImage(createValidatedInput('jpeg'), { preset: 'balanced' }, apis);

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.DECODE_FAILED);
  assert.equal(calls.bitmapClosed, 0);
});

test('returns a safe error when encoding fails', async () => {
  const { apis, calls, canvas } = createProcessingApis({ blob: null });
  const result = await processImage(createValidatedInput('jpeg'), { preset: 'balanced' }, apis);

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.ENCODE_FAILED);
  assert.equal(calls.bitmapClosed, 1);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test('cleans up after failed canvas encoding exceptions', async () => {
  const { calls, canvas } = createProcessingApis();
  const result = await processImage(
    createValidatedInput('jpeg'),
    { preset: 'balanced' },
    {
      createCanvas: () => canvas,
      createImageBitmap: async () => ({
        close: () => {
          calls.bitmapClosed += 1;
        },
        height: 1,
        width: 1,
      }),
      encodeCanvas: async () => {
        throw new Error('encode failed');
      },
    },
  );

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.ENCODE_FAILED);
  assert.equal(calls.bitmapClosed, 1);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});
