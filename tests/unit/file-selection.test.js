import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { ERROR_CODES } from '../../src/shared/errors.js';
import { selectSingleFile } from '../../src/tools/image-compressor/file-selection.js';

const compressorMarkup = readFileSync(
  new URL('../../image-compressor.html', import.meta.url),
  'utf8',
);

test('selects the first file for normal single-file picker behavior', () => {
  const first = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
  const second = new File(['b'], 'b.jpg', { type: 'image/jpeg' });

  const result = selectSingleFile([first, second]);

  assert.equal(result.ok, true);
  assert.equal(result.file, first);
});

test('rejects multiple dropped files explicitly', () => {
  const first = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
  const second = new File(['b'], 'b.jpg', { type: 'image/jpeg' });

  const result = selectSingleFile([first, second], { rejectMultiple: true });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.TOO_MANY_FILES);
});

test('reports no-file selections without selecting a fallback', () => {
  const result = selectSingleFile([], { rejectMultiple: true });

  assert.equal(result.ok, false);
  assert.equal(result.code, ERROR_CODES.NO_FILE);
});

test('keeps the native picker out of the tab sequence while exposing the visible upload control', () => {
  assert.match(
    compressorMarkup,
    /<input[\s\S]*?data-file-input[\s\S]*?tabindex="-1"[\s\S]*?>/,
  );
  assert.match(
    compressorMarkup,
    /<button[\s\S]*?data-choose-file[\s\S]*?aria-describedby="upload-help privacy-note"[\s\S]*?>/,
  );
});

test('provides programmatic focus targets for processing, result, and error states', () => {
  assert.match(compressorMarkup, /data-processing-heading[^>]*tabindex="-1"/);
  assert.match(compressorMarkup, /data-result-heading[^>]*tabindex="-1"/);
  assert.match(compressorMarkup, /data-error-title[^>]*tabindex="-1"/);
});
