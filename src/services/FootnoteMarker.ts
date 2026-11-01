export function normalizeFootnoteMarker(marker: string | null) {
  if (marker === null) {
    return null;
  }
  const text = marker.trim();
  if (
    text.length === 0 ||
    [...text].length > 16 ||
    /[\u0000-\u001f\u007f]/u.test(marker)
  ) {
    throw new Error('INVALID_FOOTNOTE_MARKER');
  }
  return text;
}
