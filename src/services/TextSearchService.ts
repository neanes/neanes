import { Parser } from 'htmlparser2';

import { ElementType, type ScoreElement } from '@/models/Element';
import { TATWEEL } from '@/utils/constants';
import {
  normalizeSearchRun,
  normalizeSearchText,
} from '@/utils/searchNormalization';

// Extract rich text without creating DOM nodes or consulting rendered pages.
export function searchPlainText(html: string) {
  let text = '';
  let suppressed = 0;
  const blocks = new Set([
    'p',
    'div',
    'br',
    'li',
    'tr',
    'td',
    'th',
    'hr',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
  ]);
  const parser = new Parser(
    {
      onopentag(name) {
        if (name === 'script' || name === 'style') {
          suppressed++;
        }
        if (!suppressed && blocks.has(name)) {
          text += ' ';
        }
      },
      ontext(value) {
        if (!suppressed) {
          text += value;
        }
      },
      onclosetag(name) {
        if (name === 'script' || name === 'style') {
          suppressed--;
        }
        if (!suppressed && blocks.has(name)) {
          text += ' ';
        }
      },
    },
    { decodeEntities: true },
  );
  parser.end(html);
  return text;
}

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
export interface CollectionTextMatch {
  text: string;
  start: number;
  end: number;
  parts: TextSearchPart[];
}

type RunPart = TextSearchPart & { text: string };
function* matchRun(
  parts: RunPart[],
  query: string,
  caseSensitive = false,
  lyrics = false,
): Generator<CollectionTextMatch> {
  const { text, ranges } = normalizeSearchRun(parts, { caseSensitive, lyrics });
  let firstRange = 0;
  for (
    let start = text.indexOf(query);
    start !== -1;
    start = text.indexOf(query, start + 1)
  ) {
    const end = start + query.length;
    while (firstRange < ranges.length && ranges[firstRange].end <= start) {
      firstRange++;
    }
    const matchingParts: TextSearchPart[] = [];
    for (let i = firstRange; i < ranges.length && ranges[i].start < end; i++) {
      const { element, index, field } = ranges[i].part;
      matchingParts.push({ element, index, field });
    }
    yield {
      text,
      start,
      end,
      parts: matchingParts,
    };
  }
}

// A run may pass over notation without lyrics, but never over a text box or
// into a different collection. Each text-box panel is an independent run.
export function* matchTextInCollection(
  elements: ScoreElement[],
  query: string,
  options: { caseSensitive?: boolean; fields?: SearchableTextField[] } = {},
): Generator<CollectionTextMatch> {
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

export class TextSearchService {
  findTextInElements(
    query: string,
    elements: ScoreElement[],
    index = 0,
    reverse = false,
  ): ScoreElement | null {
    let first: number | undefined;
    let last: number | undefined;
    let previous: number | undefined;
    for (const occurrence of matchTextInCollection(elements, query)) {
      const match = occurrence.parts[0].index;
      first ??= match;
      last = match;
      if (!reverse && match > index) {
        return elements[match];
      }
      if (reverse && match < index) {
        previous = match;
      }
    }
    const match = reverse ? (previous ?? last) : first;
    return match == null ? null : elements[match];
  }
}
