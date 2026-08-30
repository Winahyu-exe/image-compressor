import { ERROR_CODES } from '../../shared/errors.js';

export function selectSingleFile(files, options = {}) {
  const list = Array.from(files || []);

  if (options.rejectMultiple && list.length > 1) {
    return {
      ok: false,
      code: ERROR_CODES.TOO_MANY_FILES,
    };
  }

  const [file] = list;

  if (!file) {
    return {
      ok: false,
      code: ERROR_CODES.NO_FILE,
    };
  }

  return {
    ok: true,
    file,
  };
}
