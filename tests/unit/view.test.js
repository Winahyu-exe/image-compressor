import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getResultPresentation } from '../../src/tools/image-compressor/view.js';

test('presents reduced PNG results as successful savings', () => {
  const presentation = getResultPresentation({
    bytesChanged: 300,
    outputMimeType: 'image/png',
    reductionPercent: 30,
  });

  assert.equal(presentation.heading, 'Result ready');
  assert.equal(presentation.change, 'Saved 30%');
  assert.equal(presentation.noteHidden, true);
  assert.equal(presentation.tone, 'positive');
});

test('presents unchanged PNG results without Saved 0%', () => {
  const presentation = getResultPresentation({
    bytesChanged: 0,
    outputMimeType: 'image/png',
    reductionPercent: 0,
  });

  assert.equal(presentation.heading, 'No size reduction');
  assert.equal(presentation.change, 'No size reduction');
  assert.equal(presentation.change.includes('Saved 0%'), false);
  assert.equal(presentation.note.includes('lossless browser re-encoding'), true);
  assert.equal(presentation.tone, 'neutral');
});

test('presents larger PNG results as an honest increase', () => {
  const presentation = getResultPresentation({
    bytesChanged: -400,
    outputMimeType: 'image/png',
    reductionPercent: -23.5,
  });

  assert.equal(presentation.heading, 'No size reduction');
  assert.equal(presentation.change, 'Result is 23.5% larger');
  assert.equal(presentation.change.includes('Saved'), false);
  assert.equal(presentation.note.includes('larger file'), true);
  assert.equal(presentation.tone, 'warning');
});
