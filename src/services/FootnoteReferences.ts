import {
  NoteElement,
  RichTextBoxElement,
  type ScoreElement,
} from '@/models/Element';
import type { Footnote } from '@/models/Footnote';
import type { Score } from '@/models/Score';

import { richTextBoxFootnoteIds } from './RichTextFootnotes';

export function elementFootnoteIds(element: ScoreElement): string[] {
  return element instanceof NoteElement
    ? element.footnoteId === null
      ? []
      : [element.footnoteId]
    : element instanceof RichTextBoxElement
      ? richTextBoxFootnoteIds(element)
      : [];
}

export function orderedFootnotes(score: Score) {
  const byId = new Map(
    score.footnotes.map((footnote) => [footnote.id, footnote]),
  );
  const seen = new Set<string>();
  const result: {
    footnote: Footnote;
    reference: ScoreElement;
    number: number | null;
    automaticNumber: number;
    marker: string;
  }[] = [];
  let nextNumber = score.pageSetup.firstFootnoteNumber;
  for (const element of score.staff.elements) {
    for (const id of elementFootnoteIds(element)) {
      const footnote = byId.get(id);
      if (footnote === undefined || seen.has(footnote.id)) {
        throw new Error('INVALID_FOOTNOTE_REFERENCE');
      }
      seen.add(footnote.id);
      result.push({
        footnote,
        reference: element,
        number: footnote.marker === null ? nextNumber : null,
        automaticNumber: nextNumber,
        marker: footnote.marker ?? String(nextNumber),
      });
      if (footnote.marker === null) {
        nextNumber++;
      }
    }
  }
  return result;
}
