import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyOutputFormatAvailability,
  detectCanvasEncoderSupport,
  getOutputFormatAvailability,
  markOutputFormatUnavailable,
} from '../../src/tools/image-compressor/browser-capabilities.js';

function createCanvas(supportedTypes) {
  return {
    height: 0,
    width: 0,
    toDataURL: (mimeType) =>
      supportedTypes.has(mimeType) ? `data:${mimeType};base64,ok` : 'data:image/png;base64,ok',
  };
}

function createSelect(options, value = options[0]?.value) {
  return {
    options,
    selectedOptions: options.filter((option) => option.value === value),
    value,
  };
}

test('detects encoder support from a tiny canvas data URL probe', () => {
  const canvas = createCanvas(new Set(['image/png', 'image/jpeg']));

  assert.equal(detectCanvasEncoderSupport('image/jpeg', { canvas }), true);
  assert.equal(detectCanvasEncoderSupport('image/webp', { canvas }), false);
  assert.equal(canvas.width, 0);
  assert.equal(canvas.height, 0);
});

test('collects JPEG, PNG, and WebP encoder availability', () => {
  const availability = getOutputFormatAvailability({
    document: {
      createElement: () => createCanvas(new Set(['image/png', 'image/webp'])),
    },
  });

  assert.deepEqual(availability, {
    'image/jpeg': false,
    'image/png': true,
    'image/webp': true,
  });
});

test('disables unavailable output options and falls back from an unavailable selection', () => {
  const options = [
    { disabled: false, hidden: false, value: 'original' },
    { disabled: false, hidden: false, value: 'image/webp' },
    { disabled: false, hidden: false, value: 'image/jpeg' },
    { disabled: false, hidden: false, value: 'image/png' },
  ];
  const select = createSelect(options, 'image/webp');

  applyOutputFormatAvailability(
    select,
    {
      'image/jpeg': true,
      'image/png': true,
      'image/webp': false,
    },
    'image/png',
  );

  assert.equal(options[1].disabled, true);
  assert.equal(options[1].hidden, true);
  assert.equal(select.value, 'original');
});

test('marks keep-original unavailable when the selected input MIME cannot be encoded', () => {
  const options = [
    { disabled: false, hidden: false, value: 'original' },
    { disabled: false, hidden: false, value: 'image/png' },
  ];
  const select = createSelect(options, 'original');

  applyOutputFormatAvailability(
    select,
    {
      'image/png': true,
      'image/webp': false,
    },
    'image/webp',
  );

  assert.equal(options[0].disabled, true);
  assert.equal(select.value, 'image/png');
});

test('removes an encoder that becomes unavailable during processing and selects a safe fallback', () => {
  const options = [
    { disabled: false, hidden: false, value: 'original' },
    { disabled: false, hidden: false, value: 'image/webp' },
    { disabled: false, hidden: false, value: 'image/jpeg' },
  ];
  const select = createSelect(options, 'image/webp');
  const availability = {
    'image/jpeg': true,
    'image/png': true,
    'image/webp': true,
  };

  const unavailableMimeType = markOutputFormatUnavailable(
    select,
    availability,
    'image/webp',
    'image/jpeg',
  );

  assert.equal(unavailableMimeType, 'image/webp');
  assert.equal(availability['image/webp'], false);
  assert.equal(options[1].disabled, true);
  assert.equal(options[1].hidden, true);
  assert.equal(select.value, 'original');
});
