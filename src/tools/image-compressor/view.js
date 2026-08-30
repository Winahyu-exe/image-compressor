function formatPercent(value) {
  const absolute = Math.abs(value);

  return Math.round(absolute * 10) / 10;
}

export function getResultPresentation(result) {
  if (result.bytesChanged > 0) {
    return {
      change: `Saved ${formatPercent(result.reductionPercent)}%`,
      heading: 'Result ready',
      note: '',
      noteHidden: true,
      tone: 'positive',
    };
  }

  if (result.bytesChanged === 0) {
    return {
      change: 'No size reduction',
      heading: 'No size reduction',
      note:
        result.outputMimeType === 'image/png'
          ? 'PNG uses lossless browser re-encoding, and this image could not be reduced further without changing format.'
          : 'The compressed copy is not smaller than the original. You can try another preset or format.',
      noteHidden: false,
      tone: 'neutral',
    };
  }

  return {
    change: `Result is ${formatPercent(result.reductionPercent)}% larger`,
    heading: 'No size reduction',
    note:
      result.outputMimeType === 'image/png'
        ? 'Lossless PNG re-encoding can sometimes produce a larger file.'
        : 'The compressed copy is larger than the original. You can try another preset or format.',
    noteHidden: false,
    tone: 'warning',
  };
}
