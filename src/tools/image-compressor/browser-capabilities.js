import { OUTPUT_EXTENSIONS } from './process-image.js';

export const REQUIRED_OUTPUT_TYPES = Object.freeze(Object.keys(OUTPUT_EXTENSIONS));

export function detectCanvasEncoderSupport(mimeType, apis = {}) {
  const documentRef = apis.document || globalThis.document;
  const canvas = apis.canvas || documentRef?.createElement?.('canvas');

  if (!canvas || typeof canvas.toDataURL !== 'function') {
    return false;
  }

  canvas.width = 1;
  canvas.height = 1;

  try {
    return canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`);
  } catch {
    return false;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export function getOutputFormatAvailability(apis = {}) {
  return Object.fromEntries(
    REQUIRED_OUTPUT_TYPES.map((mimeType) => [
      mimeType,
      detectCanvasEncoderSupport(mimeType, apis),
    ]),
  );
}

export function applyOutputFormatAvailability(select, availability, originalMimeType = null) {
  if (!select) {
    return;
  }

  Array.from(select.options || []).forEach((option) => {
    if (option.value === 'original') {
      const isOriginalAvailable = !originalMimeType || availability[originalMimeType] === true;
      option.disabled = !isOriginalAvailable;
      option.hidden = false;
      return;
    }

    const isAvailable = availability[option.value] === true;
    option.disabled = !isAvailable;
    option.hidden = !isAvailable;
  });

  const selectedOption = select.selectedOptions?.[0];

  if (selectedOption?.disabled) {
    const fallback = Array.from(select.options || []).find((option) => !option.disabled);
    select.value = fallback?.value || 'original';
  }
}

export function markOutputFormatUnavailable(
  select,
  availability,
  requestedOutput,
  originalMimeType = null,
) {
  const unavailableMimeType =
    requestedOutput === 'original' ? originalMimeType : requestedOutput;

  if (unavailableMimeType && unavailableMimeType in availability) {
    availability[unavailableMimeType] = false;
  }

  applyOutputFormatAvailability(select, availability, originalMimeType);

  return unavailableMimeType;
}
