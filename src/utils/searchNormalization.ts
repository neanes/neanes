import { TATWEEL } from '@/utils/constants';

export interface SearchNormalizationOptions {
  caseSensitive?: boolean;
  lyrics?: boolean;
}

export function normalizeSearchText(
  text: string,
  { caseSensitive = false, lyrics = false }: SearchNormalizationOptions = {},
) {
  const normalized = text
    .normalize('NFC')
    .replaceAll(TATWEEL, '')
    .replace(/\s+/gu, lyrics ? '' : ' ');
  // Final sigma must compare equally even when a lyric word spans elements.
  return (
    caseSensitive ? normalized : normalized.toLowerCase().replaceAll('ς', 'σ')
  ).normalize('NFC');
}

const graphemes = new Intl.Segmenter('und', { granularity: 'grapheme' });

export function normalizeSearchRun<Part extends { text: string }>(
  parts: readonly Part[],
  options: SearchNormalizationOptions = {},
) {
  let sourceOffset = 0;
  const ranges = parts.map((part) => {
    const sourceStart = sourceOffset;
    sourceOffset += part.text.length;
    return { part, sourceStart, sourceEnd: sourceOffset, start: -1, end: 0 };
  });
  const source = parts.map((part) => part.text).join('');
  const text = normalizeSearchText(source, options);
  if (ranges.length === 1) {
    ranges[0].start = 0;
    ranges[0].end = text.length;
  } else {
    let normalizedOffset = 0;
    let firstRange = 0;
    // Grapheme boundaries are normalization-safe. A composed character can
    // belong to multiple elements when its base and marks were split.
    for (const { segment, index } of graphemes.segment(source)) {
      const end =
        normalizedOffset + normalizeSearchText(segment, options).length;
      while (
        firstRange < ranges.length &&
        ranges[firstRange].sourceEnd <= index
      ) {
        firstRange++;
      }
      for (
        let i = firstRange;
        i < ranges.length && ranges[i].sourceStart < index + segment.length;
        i++
      ) {
        const range = ranges[i];
        if (range.start === -1) {
          range.start = normalizedOffset;
        }
        range.end = end;
      }
      normalizedOffset = end;
    }
  }
  return { text, ranges };
}
