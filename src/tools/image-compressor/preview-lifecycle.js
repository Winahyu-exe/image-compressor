export function clearPreviewSource(preview) {
  if (!preview) {
    return;
  }

  preview.removeAttribute('src');
  preview.hidden = true;
}

export function setPreviewSource(preview, file, resources, urlApi = globalThis.URL) {
  if (!preview || !file || !resources || typeof urlApi?.createObjectURL !== 'function') {
    return null;
  }

  const objectUrl = resources.trackObjectUrl(urlApi.createObjectURL(file));
  preview.src = objectUrl;
  preview.hidden = false;

  return objectUrl;
}
