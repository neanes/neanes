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

export type FootnotePageAssignments = ReadonlyMap<ScoreElement, number>;

// With null assignments, count through each run between explicit page breaks.
// This bounds the label ordinal before any automatic page breaks are known.
export function orderedFootnotes(
  score: Score,
  pageAssignments?: FootnotePageAssignments | null,
) {
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
    const page = pageAssignments?.get(element) ?? element.page;
    for (const id of elementFootnoteIds(element)) {
      const footnote = byId.get(id);
      if (footnote === undefined || seen.has(footnote.id)) {
        throw new Error('INVALID_FOOTNOTE_REFERENCE');
      }
      seen.add(footnote.id);
      if (
        score.pageSetup.footnoteNumbering === 'page' &&
        pageAssignments !== null &&
        page !== previousPage
      ) {
        nextNumber = score.pageSetup.firstFootnoteNumber;
      }
      previousPage = page;
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
      pageAssignments === null &&
      score.pageSetup.footnoteNumbering === 'page' &&
      element.pageBreak
    ) {
      nextNumber = score.pageSetup.firstFootnoteNumber;
    }
  }
  return result;
}
