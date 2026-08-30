import '../../styles/base.css';
import '../../styles/components.css';

import { getValidationMessage } from '../../shared/errors.js';
import { formatBytes } from '../../shared/format-bytes.js';
import { createResourceManager } from '../../shared/resource-manager.js';
import { processImage } from './process-image.js';
import { validateImage } from './validate-image.js';
import { getResultPresentation } from './view.js';

const root = document.querySelector('[data-compressor-root]');
const fileInput = document.querySelector('[data-file-input]');
const dropZone = document.querySelector('[data-drop-zone]');
const chooseFileButton = document.querySelector('[data-choose-file]');
const compressButton = document.querySelector('[data-compress]');
const statusLine = document.querySelector('[data-status]');
const stateBadge = document.querySelector('[data-state-badge]');
const fileName = document.querySelector('[data-file-name]');
const fileSize = document.querySelector('[data-file-size]');
const fileDimensions = document.querySelector('[data-file-dimensions]');
const fileFormat = document.querySelector('[data-file-format]');
const errorTitle = document.querySelector('[data-error-title]');
const errorMessage = document.querySelector('[data-error-message]');
const outputFormat = document.querySelector('[data-output-format]');
const qualityInput = document.querySelector('input[type="range"]');
const resultPreview = document.querySelector('[data-result-preview]');
const resultHeading = document.querySelector('[data-result-heading]');
const resultNote = document.querySelector('[data-result-note]');
const resultName = document.querySelector('[data-result-name]');
const resultOriginalSize = document.querySelector('[data-result-original-size]');
const resultOutputSize = document.querySelector('[data-result-output-size]');
const resultChange = document.querySelector('[data-result-change]');
const resultFormat = document.querySelector('[data-result-format]');
const resultDimensions = document.querySelector('[data-result-dimensions]');
const downloadLink = document.querySelector('[data-download]');
const presetHelp = {
  balanced: document.querySelector('[data-preset-help="balanced"]'),
  better: document.querySelector('[data-preset-help="better"]'),
  smaller: document.querySelector('[data-preset-help="smaller"]'),
};
const qualityHelp = document.querySelector('[data-quality-help]');

const stateLabels = {
  idle: 'Idle',
  validating: 'Validating',
  ready: 'Ready',
  processing: 'Processing',
  success: 'Success',
  error: 'Error',
};

const stateStatus = {
  idle: 'Waiting for an image.',
  validating: 'Checking image...',
  ready: 'Image selected. Choose settings, then compress.',
  processing: 'Compressing image...',
  success: 'Result ready.',
  error: 'Review the message and choose the next action.',
};

let selectedFile = null;
let selectedMetadata = null;
let currentValidationId = 0;
let currentProcessId = 0;
const resources = createResourceManager();

function setState(nextState) {
  if (!root || !statusLine || !stateBadge) {
    return;
  }

  root.dataset.state = nextState;
  stateBadge.textContent = stateLabels[nextState];
  statusLine.textContent = stateStatus[nextState];

  document.querySelectorAll('[data-view]').forEach((view) => {
    view.hidden = view.dataset.view !== nextState;
  });

  if (compressButton) {
    compressButton.disabled = nextState !== 'ready';
  }
}

function clearFileFacts() {
  if (fileName) {
    fileName.textContent = 'No file selected';
  }

  if (fileSize) {
    fileSize.textContent = 'Not available';
  }

  if (fileDimensions) {
    fileDimensions.textContent = 'Not available';
  }

  if (fileFormat) {
    fileFormat.textContent = 'Not available';
  }
}

function clearResult() {
  if (downloadLink) {
    downloadLink.removeAttribute('href');
    downloadLink.removeAttribute('download');
    downloadLink.textContent = 'Download image';
  }

  if (resultPreview) {
    resultPreview.removeAttribute('src');
    resultPreview.hidden = true;
  }

  if (resultHeading) {
    resultHeading.textContent = 'Result ready';
  }

  if (resultNote) {
    resultNote.textContent = '';
    resultNote.hidden = true;
  }

  if (resultChange) {
    resultChange.classList.remove('positive', 'neutral', 'warning');
  }
}

function presentValidationError(code, details) {
  const validationMessage = getValidationMessage(code, details);

  if (errorTitle) {
    errorTitle.textContent = validationMessage.title;
  }

  if (errorMessage) {
    errorMessage.textContent = validationMessage.message;
  }

  setState('error');
}

async function presentFile(file) {
  const validationId = currentValidationId + 1;
  currentValidationId = validationId;
  currentProcessId += 1;
  resources.cleanup();
  clearResult();
  selectedFile = file;
  selectedMetadata = null;
  setState('validating');

  const result = await validateImage(file);

  if (currentValidationId !== validationId) {
    return;
  }

  if (!result.ok) {
    selectedFile = null;
    selectedMetadata = null;
    clearFileFacts();
    presentValidationError(result.code, result.details);
    return;
  }

  const { metadata } = result;
  selectedFile = file;
  selectedMetadata = metadata;

  if (fileName) {
    fileName.textContent = metadata.name || 'Unnamed image';
  }

  if (fileSize) {
    fileSize.textContent = formatBytes(metadata.size);
  }

  if (fileDimensions) {
    fileDimensions.textContent = `${metadata.width} x ${metadata.height}`;
  }

  if (fileFormat) {
    fileFormat.textContent = metadata.mimeType.replace('image/', '').toUpperCase();
  }

  updateFormatGuidance();
  setState('ready');
}

function resetTool() {
  currentValidationId += 1;
  currentProcessId += 1;
  resources.cleanup();
  clearResult();
  selectedFile = null;
  selectedMetadata = null;

  if (fileInput) {
    fileInput.value = '';
  }

  clearFileFacts();
  setState('idle');
}

function getCompressionSettings() {
  const preset = document.querySelector('input[name="quality-preset"]:checked')?.value || 'balanced';
  const quality = qualityInput?.dataset.customQuality === 'true' ? Number(qualityInput.value) / 100 : undefined;

  return {
    outputFormat: outputFormat?.value || 'original',
    preset,
    quality,
  };
}

function formatMimeType(mimeType) {
  return String(mimeType || '').replace('image/', '').toUpperCase();
}

function getResolvedOutputFormat() {
  const requestedOutput = outputFormat?.value || 'original';

  if (requestedOutput === 'original') {
    return selectedMetadata?.mimeType || null;
  }

  return requestedOutput;
}

function updateFormatGuidance() {
  const isPngOutput = getResolvedOutputFormat() === 'image/png';

  if (presetHelp.smaller) {
    presetHelp.smaller.textContent = isPngOutput
      ? 'Attempts a smaller PNG; reduction is not guaranteed.'
      : 'Lower quality, smaller file.';
  }

  if (presetHelp.balanced) {
    presetHelp.balanced.textContent = isPngOutput
      ? 'Keeps PNG lossless while trying a clean re-save.'
      : 'Recommended starting point.';
  }

  if (presetHelp.better) {
    presetHelp.better.textContent = isPngOutput
      ? 'Keeps PNG output lossless; size may stay the same or grow.'
      : 'Less aggressive compression.';
  }

  if (qualityHelp) {
    qualityHelp.textContent = isPngOutput
      ? 'For PNG, this app keeps the image lossless. The quality slider does not directly control PNG file size.'
      : 'Quality affects JPEG and WebP output. Lower values usually create smaller files.';
  }
}

function presentResultNote(result) {
  const presentation = getResultPresentation(result);

  if (resultHeading) {
    resultHeading.textContent = presentation.heading;
  }

  if (!resultNote) {
    return;
  }

  resultNote.textContent = presentation.note;
  resultNote.hidden = presentation.noteHidden;
}

function presentResultChange(result) {
  if (!resultChange) {
    return;
  }

  const presentation = getResultPresentation(result);

  resultChange.textContent = presentation.change;
  resultChange.classList.toggle('positive', presentation.tone === 'positive');
  resultChange.classList.toggle('neutral', presentation.tone === 'neutral');
  resultChange.classList.toggle('warning', presentation.tone === 'warning');
}

function presentResult(result) {
  const objectUrl = resources.trackObjectUrl(URL.createObjectURL(result.blob));

  if (resultPreview) {
    resultPreview.src = objectUrl;
    resultPreview.hidden = false;
  }

  if (downloadLink) {
    downloadLink.href = objectUrl;
    downloadLink.download = result.downloadName;
    downloadLink.textContent = `Download ${formatMimeType(result.outputMimeType)} (${formatBytes(result.outputSize)})`;
  }

  if (resultName) {
    resultName.textContent = result.originalName || 'Unnamed image';
  }

  if (resultOriginalSize) {
    resultOriginalSize.textContent = formatBytes(result.originalSize);
  }

  if (resultOutputSize) {
    resultOutputSize.textContent = formatBytes(result.outputSize);
  }

  presentResultNote(result);
  presentResultChange(result);

  if (resultFormat) {
    resultFormat.textContent = formatMimeType(result.outputMimeType);
  }

  if (resultDimensions) {
    resultDimensions.textContent = `${result.width} x ${result.height}`;
  }

  setState('success');
}

async function compressSelectedImage() {
  if (!selectedFile || !selectedMetadata) {
    return;
  }

  const processId = currentProcessId + 1;
  currentProcessId = processId;
  resources.cleanup();
  clearResult();
  setState('processing');

  const result = await processImage(
    {
      file: selectedFile,
      metadata: selectedMetadata,
    },
    getCompressionSettings(),
  );

  if (currentProcessId !== processId) {
    return;
  }

  if (!result.ok) {
    clearResult();
    presentValidationError(result.code, result.details);
    return;
  }

  presentResult(result.result);
}

function handleFiles(files) {
  const [file] = Array.from(files || []);

  if (!file) {
    return;
  }

  presentFile(file);
}

if (chooseFileButton && fileInput) {
  chooseFileButton.addEventListener('click', () => {
    fileInput.click();
  });
}

if (fileInput) {
  fileInput.addEventListener('change', (event) => {
    handleFiles(event.target.files);
  });
}

if (dropZone) {
  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropZone.classList.add('is-drag-active');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('is-drag-active');
    });
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  });
}

if (compressButton) {
  compressButton.addEventListener('click', () => {
    compressSelectedImage();
  });
}

if (qualityInput) {
  qualityInput.addEventListener('input', () => {
    qualityInput.dataset.customQuality = 'true';
  });
}

if (outputFormat) {
  outputFormat.addEventListener('change', updateFormatGuidance);
}

document
  .querySelectorAll('[data-reset], [data-reset-processing], [data-reset-success], [data-reset-error]')
  .forEach((button) => {
    button.addEventListener('click', resetTool);
  });

document.querySelectorAll('[data-retry]').forEach((button) => {
  button.addEventListener('click', () => {
    if (selectedFile) {
      setState('ready');
    } else {
      setState('idle');
    }
  });
});

setState('idle');
updateFormatGuidance();

window.addEventListener('pagehide', () => {
  resources.cleanup();
});
