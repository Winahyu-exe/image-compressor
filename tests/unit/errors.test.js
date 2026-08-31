import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ERROR_CODES, getValidationMessage } from '../../src/shared/errors.js';

test('formats actionable copy for PNG extension with JPEG content', () => {
  const message = getValidationMessage(ERROR_CODES.MISMATCHED_TYPE, {
    declaredExtension: 'png',
    declaredFormat: 'image/png',
    detectedFormat: 'image/jpeg',
  });

  assert.equal(message.title, "File format doesn't match its extension");
  assert.equal(
    message.message,
    'This file is named .png, but its actual format appears to be JPEG. Rename it to .jpg and try again.',
  );
});

test('does not claim a detected format when mismatch metadata is unknown', () => {
  const message = getValidationMessage(ERROR_CODES.MISMATCHED_TYPE, {
    declaredExtension: 'png',
    detectedFormat: 'application/octet-stream',
  });

  assert.equal(message.title, "This image doesn't match its declared format.");
  assert.equal(message.message.includes('application/octet-stream'), false);
});

test('describes the fixed pixel limit without blaming the device', () => {
  const message = getValidationMessage(ERROR_CODES.TOO_MANY_PIXELS);

  assert.equal(message.title, "This image exceeds the tool's supported dimensions.");
  assert.equal(message.message, 'Resize it to fewer pixels, then try again.');
  assert.equal(`${message.title} ${message.message}`.includes('device'), false);
});

test('gives an unavailable encoder a different-format recovery instead of retry advice', () => {
  const message = getValidationMessage(ERROR_CODES.UNSUPPORTED_BROWSER);

  assert.equal(
    message.message,
    'Choose another available output format, or use a different modern browser.',
  );
  assert.equal(message.message.toLowerCase().includes('retry'), false);
});
