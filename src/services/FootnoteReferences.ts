import {
  FootnoteAnchorElement,
  RICH_TEXT_BOX_CONTENT_KEYS,
  RichTextBoxElement,
  type ScoreElement,
} from '@/models/Element';
import type { Footnote } from '@/models/Footnote';
import type { Score } from '@/models/Score';
import { isSectionMarker } from '@/utils/runningMarkers';

import { automaticFootnoteMarker } from './FootnoteMarker';
import {
  activeRichTextContentKeys,
  removeRichTextFootnotes,
  richTextBoxFootnoteIds,
} from './RichTextFootnotes';

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

// A file is untrusted input. Drop each reference that layout or editing would
// reject, so a damaged score still opens and the next save writes it clean.
// Each body keeps its first main-staff reference in score order; references
// anywhere else are unsupported. Removing a reference removes its body, so a
// body left without a reference is dropped too.
export function repairFootnoteReferences(score: Score) {
  const bodies = new Set(score.footnotes.map((footnote) => footnote.id));
  const seen = new Set<string>();
  const keep = (id: string) => {
    if (!bodies.has(id) || seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  };
  let repaired = false;
  for (const element of score.staff.elements) {
    repaired = repairElementFootnoteReferences(element, keep) || repaired;
  }
  const referenced = score.footnotes.filter((footnote) =>
    seen.has(footnote.id),
  );
  if (referenced.length !== score.footnotes.length) {
    score.footnotes = referenced;
    repaired = true;
  }
  for (const element of [
    ...score.headersAndFooters,
    ...score.footnotes.flatMap((footnote) => footnote.staff.elements),
  ]) {
    repaired = repairElementFootnoteReferences(element, rejectAll) || repaired;
  }
  return repaired;
}

const rejectAll = () => false;

function repairElementFootnoteReferences(
  element: ScoreElement,
  keep: (id: string) => boolean,
) {
  if (element instanceof FootnoteAnchorElement) {
    if (element.footnoteId === null || keep(element.footnoteId)) {
      return false;
    }
    element.footnoteId = null;
    return true;
  }
  if (!(element instanceof RichTextBoxElement)) {
    return false;
  }
  // Active keys are a subsequence of RICH_TEXT_BOX_CONTENT_KEYS, so this visits
  // them in the order elementFootnoteIds reads them.
  const active = new Set(activeRichTextContentKeys(element));
  let repaired = false;
  for (const key of RICH_TEXT_BOX_CONTENT_KEYS) {
    const html = removeRichTextFootnotes(
      element[key],
      active.has(key) ? keep : rejectAll,
    );
    if (html !== element[key]) {
      element[key] = html;
      repaired = true;
    }
  }
  return repaired;
}
