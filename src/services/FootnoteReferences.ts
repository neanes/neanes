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

export function captureFootnotePageAssignments(
  score: Score,
): FootnotePageAssignments {
  return new Map(
    score.staff.elements.map((element) => [element, element.page]),
  );
}

// Existing UI and discovery callers default to the current assignments. Layout
// supplies a snapshot so preparation cannot observe partially updated pages.
export function orderedFootnotes(
  score: Score,
  pageAssignments: FootnotePageAssignments = captureFootnotePageAssignments(
    score,
  ),
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
    for (const id of elementFootnoteIds(element)) {
      const footnote = byId.get(id);
      if (footnote === undefined || seen.has(footnote.id)) {
        throw new Error('INVALID_FOOTNOTE_REFERENCE');
      }
      seen.add(footnote.id);
      if (
        score.pageSetup.footnoteNumbering === 'page' &&
        pageAssignments.get(element)! !== previousPage
      ) {
        nextNumber = score.pageSetup.firstFootnoteNumber;
      }
      previousPage = pageAssignments.get(element)!;
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
  }
  return result;
}
