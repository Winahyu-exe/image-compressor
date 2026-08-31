import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { getResultPresentation } from '../../src/tools/image-compressor/view.js';

const compressorController = readFileSync(
  new URL('../../src/tools/image-compressor/index.js', import.meta.url),
  'utf8',
);
const compressorMarkup = readFileSync(
  new URL('../../image-compressor.html', import.meta.url),
  'utf8',
);

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

test('moves focus to each meaningful workflow destination', () => {
  assert.match(compressorController, /focusStateTarget\(processingHeading\)/);
  assert.match(compressorController, /focusStateTarget\(resultHeading\)/);
  assert.match(compressorController, /focusStateTarget\(errorTitle\)/);
  assert.match(compressorController, /focusStateTarget\(chooseFileButton\)/);
});

test('switches from custom quality back to an exact selected preset', () => {
  assert.doesNotMatch(compressorController, /customQuality/);
  assert.match(
    compressorController,
    /qualityPresetInputs\.forEach\(\(input\) => \{\s*input\.checked = false;/,
  );
  assert.match(
    compressorController,
    /qualityInput\.value = String\(Math\.round\(QUALITY_PRESETS\[input\.value\] \* 100\)\)/,
  );
});

test('reset restores balanced preset mode and its slider value', () => {
  assert.match(
    compressorController,
    /input\.checked = input\.value === DEFAULT_QUALITY_PRESET/,
  );
  assert.match(
    compressorController,
    /QUALITY_PRESETS\[DEFAULT_QUALITY_PRESET\] \* 100/,
  );
  assert.match(compressorController, /resetQualityControls\(\);/);
});

test('disables ineffective quality controls for lossless PNG output', () => {
  assert.match(compressorController, /qualityPresetGroup\.disabled = isPngOutput/);
  assert.match(compressorController, /qualityInput\.disabled = isPngOutput/);
  assert.match(compressorController, /Not used for lossless PNG/);
});

test('presents the sanitized downloadable filename in the result summary', () => {
  assert.match(
    compressorController,
    /resultName\.textContent = result\.downloadName \|\| 'Not available'/,
  );
  assert.doesNotMatch(compressorController, /resultName\.textContent = result\.originalName/);
});

test('uses format recovery copy after a processing-time encoder failure', () => {
  assert.match(compressorController, /markOutputFormatUnavailable\(/);
  assert.match(compressorController, /'Change output format' : 'Try again'/);
  assert.match(compressorController, /focusStateTarget\(outputFormat\)/);
});

test('stop waiting invalidates stale work without claiming browser processing was aborted', () => {
  assert.match(compressorMarkup, />\s*Stop waiting\s*</);
  assert.match(compressorMarkup, /work\s+already started may finish in the background/);
  assert.doesNotMatch(compressorMarkup, />\s*Cancel\s*</);
  assert.match(compressorController, /currentProcessId \+= 1/);
  assert.match(
    compressorController,
    /const result = await processImage[\s\S]*if \(currentProcessId !== processId\) \{\s*return;/,
  );
});
