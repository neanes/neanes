import type { ScoreElement } from '@/models/Element';
import {
  matchTextInCollection,
  type SearchableTextField,
  type TextSearchPart,
} from '@/services/TextSearchService';

export interface TextSearchMatch {
  snippet: string;
  // UTF-16 offsets within the normalized snippet, not stored HTML or lyrics.
  matchStart: number;
  matchEnd: number;
  parts: TextSearchPart[];
}

export function* findTextMatches(
  elements: ScoreElement[],
  query: string,
  options: { caseSensitive?: boolean; fields?: SearchableTextField[] } = {},
): Generator<TextSearchMatch> {
  for (const { text, start, end, parts } of matchTextInCollection(
    elements,
    query,
    options,
  )) {
    let left = Math.max(0, start - 60);
    let right = Math.min(text.length, end + 60);
    // Do not cut a surrogate pair at a snippet boundary.
    if (left > 0 && /[\uDC00-\uDFFF]/u.test(text[left])) {
      left--;
    }
    if (right < text.length && /[\uDC00-\uDFFF]/u.test(text[right])) {
      right++;
    }
    yield {
      snippet: text.slice(left, right),
      matchStart: start - left,
      matchEnd: end - left,
      parts,
    };
  }
}
