import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createResourceManager } from '../../src/shared/resource-manager.js';
import {
  clearPreviewSource,
  setPreviewSource,
} from '../../src/tools/image-compressor/preview-lifecycle.js';

test('sets original preview through a tracked object URL and cleanup revokes it', () => {
  const revoked = [];
  const previousUrlApi = globalThis.URL;

  globalThis.URL = {
    createObjectURL: () => 'blob:original-preview',
    revokeObjectURL: (url) => {
      revoked.push(url);
    },
  };

  try {
    const resources = createResourceManager();
    const preview = {
      hidden: true,
      removeAttribute: () => {},
      src: '',
    };

    const url = setPreviewSource(preview, new File(['x'], 'x.jpg'), resources, globalThis.URL);

    assert.equal(url, 'blob:original-preview');
    assert.equal(preview.src, 'blob:original-preview');
    assert.equal(preview.hidden, false);

    resources.cleanup();

    assert.deepEqual(revoked, ['blob:original-preview']);
  } finally {
    globalThis.URL = previousUrlApi;
  }
});

test('clears preview element state without creating another URL', () => {
  const removed = [];
  const preview = {
    hidden: false,
    removeAttribute: (attribute) => {
      removed.push(attribute);
    },
    src: 'blob:old',
  };

  clearPreviewSource(preview);

  assert.deepEqual(removed, ['src']);
  assert.equal(preview.hidden, true);
});
