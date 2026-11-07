import { FootnoteAnchorElement, type ScoreElement } from '@/models/Element';
import type { Footnote } from '@/models/Footnote';
import type { Score } from '@/models/Score';
import { isSectionMarker } from '@/utils/runningMarkers';

import { automaticFootnoteMarker } from './FootnoteMarker';

export function elementFootnoteIds(element: ScoreElement): string[] {
  return element instanceof FootnoteAnchorElement && element.footnoteId !== null
    ? [element.footnoteId]
    : [];
}

export function orderedFootnotes(score: Score) {
  const byId = new Map(
    score.footnotes.map((footnote) => [footnote.id, footnote]),
  );
  const seen = new Set<string>();
  const result: {
    footnote: Footnote;
    reference: FootnoteAnchorElement;
    number: number | null;
    automaticMarker: string;
    marker: string;
  }[] = [];
  let nextNumber = score.pageSetup.firstFootnoteNumber;
  for (const element of score.staff.elements) {
    if (
      score.pageSetup.footnoteNumbering === 'section' &&
      isSectionMarker(element)
    ) {
      nextNumber = score.pageSetup.firstFootnoteNumber;
    }
    if (
      !(element instanceof FootnoteAnchorElement) ||
      element.footnoteId === null
    ) {
      continue;
    }
    const footnote = byId.get(element.footnoteId);
    if (footnote === undefined || seen.has(footnote.id)) {
      throw new Error('INVALID_FOOTNOTE_REFERENCE');
    }
    seen.add(footnote.id);
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
  return result;
}
