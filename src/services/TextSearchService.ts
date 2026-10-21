import { Parser } from 'htmlparser2';

import type {
  DropCapElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TextBoxElement,
} from '@/models/Element';
import { ElementType } from '@/models/Element';
import { TATWEEL } from '@/utils/constants';

// Extract rich text without creating DOM nodes or consulting rendered pages.
function searchPlainText(html: string) {
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

function normalizeSearchText(text: string, lyrics = false) {
  const normalized = text
    .normalize('NFC')
    .replaceAll(TATWEEL, '')
    .replace(/\s+/gu, lyrics ? '' : ' ');
  // Final sigma must compare equally even when a lyric word spans elements.
  return normalized.toLowerCase().replaceAll('ς', 'σ').normalize('NFC');
}

type RunPart = { index: number; text: string };
const graphemes = new Intl.Segmenter('und', { granularity: 'grapheme' });

function normalizeLyricRun(parts: RunPart[]) {
  let sourceOffset = 0;
  const ranges = parts.map((part) => {
    const sourceStart = sourceOffset;
    sourceOffset += part.text.length;
    return { part, sourceStart, sourceEnd: sourceOffset, end: 0 };
  });
  const source = parts.map((part) => part.text).join('');
  const text = normalizeSearchText(source, true);
  if (ranges.length === 1) {
    ranges[0].end = text.length;
  } else {
    let normalizedOffset = 0;
    let firstRange = 0;
    // Grapheme boundaries are normalization-safe. A composed character can
    // belong to multiple elements when its base and marks were split.
    for (const { segment, index } of graphemes.segment(source)) {
      const end = normalizedOffset + normalizeSearchText(segment, true).length;
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
        range.end = end;
      }
      normalizedOffset = end;
    }
  }
  return { text, ranges };
}

function* matchLyrics(parts: RunPart[], query: string) {
  const { text, ranges } = normalizeLyricRun(parts);
  let firstRange = 0;
  for (
    let start = text.indexOf(query);
    start !== -1;
    start = text.indexOf(query, start + 1)
  ) {
    while (ranges[firstRange].end <= start) {
      firstRange++;
    }
    yield ranges[firstRange].part.index;
  }
}

function activeTextPanels(element: TextBoxElement | RichTextBoxElement) {
  if (element.multipanel) {
    return [element.contentLeft, element.contentCenter, element.contentRight];
  }
  return element.inline
    ? [element.content, element.contentBottom]
    : [element.content];
}

function* matchingIndices(elements: ScoreElement[], query: string) {
  const ordinaryQuery = normalizeSearchText(query).trim();
  const lyricQuery = normalizeSearchText(query, true);
  if (!ordinaryQuery || !lyricQuery) {
    return;
  }

  let lyrics: RunPart[] = [];
  for (const [index, element] of elements.entries()) {
    if (
      element.elementType === ElementType.Note ||
      element.elementType === ElementType.DropCap
    ) {
      const text =
        element.elementType === ElementType.Note
          ? (element as NoteElement).lyrics
          : (element as DropCapElement).content;
      // Strip ignored characters before joining so a base and its combining
      // marks can compose even when they are stored in different elements.
      const searchable = searchPlainText(text)
        .replaceAll(TATWEEL, '')
        .replace(/\s+/gu, '');
      if (searchable) {
        lyrics.push({ index, text: searchable });
      }
    } else if (
      element.elementType === ElementType.TextBox ||
      element.elementType === ElementType.RichTextBox
    ) {
      // Text boxes end lyric runs. Each visible panel is searched separately.
      yield* matchLyrics(lyrics, lyricQuery);
      lyrics = [];
      const panels = activeTextPanels(
        element as TextBoxElement | RichTextBoxElement,
      );
      if (
        panels.some((panel) =>
          normalizeSearchText(searchPlainText(panel)).includes(ordinaryQuery),
        )
      ) {
        yield index;
      }
    }
  }
  yield* matchLyrics(lyrics, lyricQuery);
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
    for (const match of matchingIndices(elements, query)) {
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
