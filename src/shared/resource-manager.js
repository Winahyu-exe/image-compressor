export function createResourceManager() {
  const objectUrls = new Set();
  const closeables = new Set();

  function trackObjectUrl(url) {
    if (typeof url === 'string') {
      objectUrls.add(url);
    }

    return url;
  }

  function revokeObjectUrl(url) {
    if (!objectUrls.has(url)) {
      return;
    }

    URL.revokeObjectURL(url);
    objectUrls.delete(url);
  }

  function trackCloseable(resource) {
    if (resource && typeof resource.close === 'function') {
      closeables.add(resource);
    }

    return resource;
  }

  function releaseCloseable(resource) {
    if (!closeables.has(resource)) {
      return;
    }

    resource.close();
    closeables.delete(resource);
  }

  function cleanup() {
    closeables.forEach((resource) => {
      resource.close();
    });
    closeables.clear();

    objectUrls.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    objectUrls.clear();
  }

  return Object.freeze({
    cleanup,
    releaseCloseable,
    revokeObjectUrl,
    trackCloseable,
    trackObjectUrl,
  });
}
