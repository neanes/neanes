import {
  ElementType,
  type NoteElement,
  type ScoreElement,
} from '@/models/Element';
import type { Page } from '@/models/Page';
import type { Score } from '@/models/Score';
import { resolveRunningMarkerPageMetadata } from '@/utils/runningMarkers';

// Compare independently settled renderings without live object identities.
export function renderGeometry(score: Score, pages: Page[]) {
  function geometry(element: ScoreElement): unknown {
    const children: unknown[] = [];
    if (element.elementType === ElementType.Note) {
      const note = element as NoteElement;
      // Match the non-rendering children omitted by SaveService.SaveNote.
      children.push(
        ...note.annotations
          .filter((annotation) => annotation.text?.trim() !== '')
          .map(geometry),
      );
      for (const alternate of note.alternateLines.filter(
        (alternate) => alternate.elements.length > 0,
      )) {
        children.push(geometry(alternate), alternate.elements.map(geometry));
      }
    }
    return [
      element.elementType,
      element.x,
      element.y,
      element.width,
      'height' in element ? element.height : null,
      children,
    ];
  }
  const markers = resolveRunningMarkerPageMetadata(pages);
  return JSON.stringify([
    score.pageSetup.pageWidth,
    score.pageSetup.pageHeight,
    pages.map((page, index) => [
      page.physicalPageNumber,
      score.pageSetup.showHeader
        ? geometry(
            score.getHeaderForPage(
              page.physicalPageNumber,
              markers[index].isChapterOpening,
            ).elements[0],
          )
        : null,
      page.lines.map((line) => line.elements.map(geometry)),
      score.pageSetup.showFooter
        ? geometry(
            score.getFooterForPage(
              page.physicalPageNumber,
              markers[index].isChapterOpening,
            ).elements[0],
          )
        : null,
    ]),
  ]);
}
