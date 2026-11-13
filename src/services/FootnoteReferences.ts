import {
  FootnoteAnchorElement,
  RichTextBoxElement,
  type ScoreElement,
} from '@/models/Element';
import type { Footnote } from '@/models/Footnote';
import type { Score } from '@/models/Score';
import { isSectionMarker } from '@/utils/runningMarkers';

import { automaticFootnoteMarker } from './FootnoteMarker';
import { richTextBoxFootnoteIds } from './RichTextFootnotes';

export function elementFootnoteIds(element: ScoreElement): string[] {
  return element instanceof FootnoteAnchorElement
    ? element.footnoteId === null
      ? []
      : [element.footnoteId]
    : element instanceof RichTextBoxElement
      ? richTextBoxFootnoteIds(element)
      : [];
}

// Before pagination, count through each run between explicit page breaks.
// This bounds the label ordinal before any automatic page breaks are known.
export function orderedFootnotes(score: Score, beforePagination = false) {
  const byId = new Map(
    score.footnotes.map((footnote) => [footnote.id, footnote]),
  );
  const seen = new Set<string>();
  const result: {
    footnote: Footnote;
    reference: ScoreElement;
    number: number | null;
    automaticMarker: string;
    marker: string;
  }[] = [];
  let nextNumber = score.pageSetup.firstFootnoteNumber;
  let previousPage: number | null = null;
  for (const element of score.staff.elements) {
    if (
      score.pageSetup.footnoteNumbering === 'section' &&
      isSectionMarker(element)
    ) {
      nextNumber = score.pageSetup.firstFootnoteNumber;
    }
    for (const id of elementFootnoteIds(element)) {
      const footnote = byId.get(id);
      if (footnote === undefined || seen.has(footnote.id)) {
        throw new Error('INVALID_FOOTNOTE_REFERENCE');
      }
      seen.add(footnote.id);
      if (
        score.pageSetup.footnoteNumbering === 'page' &&
        !beforePagination &&
        element.page !== previousPage
      ) {
        nextNumber = score.pageSetup.firstFootnoteNumber;
      }
      previousPage = element.page;
      const automaticMarker = automaticFootnoteMarker(
        nextNumber,
        score.pageSetup,
      );
      result.push({
        footnote,
        reference: element,
        number: footnote.marker === null ? nextNumber : null,
        automaticMarker,
        marker: footnote.marker ?? automaticMarker,
      });
      if (footnote.marker === null) {
        nextNumber++;
      }
    }
    if (
      beforePagination &&
      score.pageSetup.footnoteNumbering === 'page' &&
      element.pageBreak
    ) {
      nextNumber = score.pageSetup.firstFootnoteNumber;
    }
  }
  return result;
}
