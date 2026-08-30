import assert from 'node:assert/strict';
import { test } from 'node:test';

import { ERROR_CODES } from '../../src/shared/errors.js';
import { selectSingleFile } from '../../src/tools/image-compressor/file-selection.js';

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
