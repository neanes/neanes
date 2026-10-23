import { ElementType, type ScoreElement } from '@/models/Element';
import { searchPlainText } from '@/services/TextSearchService';
import { TATWEEL } from '@/utils/constants';
import {
  normalizeSearchRun,
  normalizeSearchText,
} from '@/utils/searchNormalization';

export const searchableTextFields = [
  'lyrics',
  'content',
  'contentBottom',
  'contentLeft',
  'contentCenter',
  'contentRight',
  'text',
] as const;
export type SearchableTextField = (typeof searchableTextFields)[number];

export function elementSearchTexts(
  element: ScoreElement,
): { field: SearchableTextField; text: string; lyric: boolean }[] {
  let fields: readonly SearchableTextField[];
  const lyric =
    element.elementType === ElementType.Note ||
    element.elementType === ElementType.DropCap;
  switch (element.elementType) {
    case ElementType.Note:
      fields = ['lyrics'];
      break;
    case ElementType.DropCap:
      fields = ['content'];
      break;
    case ElementType.Annotation:
      fields = ['text'];
      break;
    case ElementType.TextBox:
    case ElementType.RichTextBox:
      fields = Reflect.get(element, 'multipanel')
        ? ['contentLeft', 'contentCenter', 'contentRight']
        : Reflect.get(element, 'inline')
          ? ['content', 'contentBottom']
          : ['content'];
      break;
    default:
      return [];
  }
  return fields.map((field) => ({
    field,
    text: searchPlainText(Reflect.get(element, field) as string),
    lyric,
  }));
}

export interface TextSearchPart {
  element: ScoreElement;
  index: number;
  field: SearchableTextField;
}
export interface TextSearchMatch {
  snippet: string;
  // UTF-16 offsets within the normalized snippet, not stored HTML or lyrics.
  matchStart: number;
  matchEnd: number;
  parts: TextSearchPart[];
}

type RunPart = TextSearchPart & { text: string };
function* matchRun(
  parts: RunPart[],
  query: string,
  caseSensitive = false,
  lyrics = false,
): Generator<TextSearchMatch> {
  const { text, ranges } = normalizeSearchRun(parts, { caseSensitive, lyrics });
  let firstRange = 0;
  for (
    let start = text.indexOf(query);
    start !== -1;
    start = text.indexOf(query, start + 1)
  ) {
    const end = start + query.length;
    let left = Math.max(0, start - 60);
    let right = Math.min(text.length, end + 60);
    // Do not cut a surrogate pair at a snippet boundary.
    if (left > 0 && /[\uDC00-\uDFFF]/u.test(text[left])) {
      left--;
    }
    if (right < text.length && /[\uDC00-\uDFFF]/u.test(text[right])) {
      right++;
    }
    while (firstRange < ranges.length && ranges[firstRange].end <= start) {
      firstRange++;
    }
    const matchingParts: TextSearchPart[] = [];
    for (let i = firstRange; i < ranges.length && ranges[i].start < end; i++) {
      const { element, index, field } = ranges[i].part;
      matchingParts.push({ element, index, field });
    }
    yield {
      snippet: text.slice(left, right),
      matchStart: start - left,
      matchEnd: end - left,
      parts: matchingParts,
    };
  }
}

// A run may pass over notation without lyrics, but never over a text box or
// into a different collection. Each text-box panel is an independent run.
export function* findTextMatches(
  elements: ScoreElement[],
  query: string,
  options: { caseSensitive?: boolean; fields?: SearchableTextField[] } = {},
): Generator<TextSearchMatch> {
  const ordinaryQuery = normalizeSearchText(query, {
    caseSensitive: options.caseSensitive,
  }).trim();
  const lyricQuery = normalizeSearchText(query, {
    caseSensitive: options.caseSensitive,
    lyrics: true,
  });
  if (!ordinaryQuery || !lyricQuery) {
    return;
  }
  let run: (TextSearchPart & { text: string })[] = [];
  for (const [index, element] of elements.entries()) {
    const texts = elementSearchTexts(element);
    if (texts.some((entry) => !entry.lyric)) {
      yield* matchRun(run, lyricQuery, options.caseSensitive, true);
      run = [];
    }
    for (const { field, text, lyric } of texts) {
      if (options.fields && !options.fields.includes(field)) {
        continue;
      }
      const part = {
        element,
        index,
        field,
        // Remove ignored lyric characters before joining, so they cannot
        // interrupt composition across element boundaries.
        text: lyric ? text.replaceAll(TATWEEL, '').replace(/\s+/gu, '') : text,
      };
      if (lyric) {
        if (part.text.length > 0) {
          run.push(part);
        }
      } else {
        yield* matchRun([part], ordinaryQuery, options.caseSensitive);
      }
    }
  }
  yield* matchRun(run, lyricQuery, options.caseSensitive, true);
}
