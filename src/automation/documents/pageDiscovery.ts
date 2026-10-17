import { toRaw } from 'vue';

import {
  ElementType,
  type NoteElement,
  type ScoreElement,
} from '@/models/Element';
import type { Page } from '@/models/Page';
import type { Score } from '@/models/Score';
import { getDisplayedPageNumber } from '@/utils/PageNumbering';
import { resolveRunningMarkerPageMetadata } from '@/utils/runningMarkers';

import { matchesElement } from '../contracts/elementPredicates';
import type { PageElementQuery } from '../contracts/pageSchemas';
import {
  type ElementCollection,
  type ElementDiscovery,
} from './elementDiscovery';

type Occurrence = {
  elementRef: string;
  elementType: ElementType;
  collection: ElementCollection;
  index: number;
  region: 'staff' | 'header' | 'footer';
  lineIndex?: number;
};
export function discoverPages(
  source: Score,
  copy: Score,
  pages: Page[],
  sources: Map<ScoreElement, ScoreElement>,
  discovery: ElementDiscovery,
) {
  const locations = new Map(
    [...discovery.entries(source)].map(({ element, collection, index }) => [
      toRaw(element),
      {
        elementRef: discovery.reference(element),
        elementType: element.elementType,
        collection,
        index,
      },
    ]),
  );
  const originalElements = new Map<string, ScoreElement>();
  const geometry: unknown[] = [];
  const markers = resolveRunningMarkerPageMetadata(pages);
  const result = pages.map((page, pageIndex) => {
    const occurrences: Occurrence[] = [];
    function add(
      element: ScoreElement,
      region: Occurrence['region'],
      lineIndex?: number,
    ) {
      const original = sources.get(toRaw(element))!;
      const location = locations.get(original)!;
      occurrences.push({
        ...location,
        region,
        ...(lineIndex === undefined ? {} : { lineIndex }),
      });
      originalElements.set(location.elementRef, original);
      geometry.push([
        location.elementRef,
        element.x,
        element.y,
        element.width,
        'height' in element ? element.height : null,
      ]);
    }
    if (copy.pageSetup.showHeader) {
      add(
        copy.getHeaderForPage(
          page.physicalPageNumber,
          markers[pageIndex].isChapterOpening,
        ).elements[0],
        'header',
      );
    }
    for (const [lineIndex, line] of page.lines.entries()) {
      for (const element of line.elements) {
        add(element, 'staff', lineIndex);
        if (element.elementType === ElementType.Note) {
          const note = element as NoteElement;
          for (const annotation of note.annotations) {
            add(annotation, 'staff', lineIndex);
          }
          for (const alternate of note.alternateLines) {
            add(alternate, 'staff', lineIndex);
            for (const child of alternate.elements) {
              if (child.elementType === ElementType.Note) {
                add(child, 'staff', lineIndex);
              }
            }
          }
        }
      }
    }
    if (copy.pageSetup.showFooter) {
      add(
        copy.getFooterForPage(
          page.physicalPageNumber,
          markers[pageIndex].isChapterOpening,
        ).elements[0],
        'footer',
      );
    }
    return {
      pageNumber: pageIndex + 1,
      displayedPageNumber: getDisplayedPageNumber(
        copy.pageSetup,
        page.physicalPageNumber,
      ),
      lineCount: page.lines.length,
      occurrenceCount: occurrences.length,
      occurrences,
    };
  });
  return { pages: result, geometry, originalElements };
}
export type DiscoveredPages = ReturnType<typeof discoverPages>;
export function readPages(
  layout: DiscoveredPages,
  query: { offset: number; limit: number },
) {
  const selected = pageSlice(layout.pages, query);
  return {
    offset: selected.offset,
    nextOffset: selected.nextOffset,
    pages: selected.values.map(pageSummary),
  };
}
export function readPageElements(
  layout: DiscoveredPages,
  query: PageElementQuery,
) {
  const page = layout.pages[query.pageNumber - 1];
  if (page === undefined) {
    throw new Error('INVALID_PAGE_NUMBER');
  }
  const matches = page.occurrences.filter(
    (occurrence) =>
      query.regions.includes(occurrence.region) &&
      (query.elementTypes === undefined ||
        query.elementTypes.includes(occurrence.elementType)) &&
      (query.where === undefined ||
        matchesElement(
          layout.originalElements.get(occurrence.elementRef)!,
          query.where,
        )),
  );
  const selected = pageSlice(matches, query);
  return {
    offset: selected.offset,
    nextOffset: selected.nextOffset,
    page: pageSummary(page),
    occurrences: selected.values,
  };
}
function pageSummary(page: DiscoveredPages['pages'][number]) {
  return {
    pageNumber: page.pageNumber,
    displayedPageNumber: page.displayedPageNumber,
    lineCount: page.lineCount,
    occurrenceCount: page.occurrenceCount,
  };
}
function pageSlice<T>(values: T[], query: { offset: number; limit: number }) {
  if (query.offset > values.length) {
    throw new Error('INVALID_ELEMENT_RANGE');
  }
  const end = Math.min(query.offset + query.limit, values.length);
  return {
    offset: query.offset,
    nextOffset: end < values.length ? end : null,
    values: values.slice(query.offset, end),
  };
}
export async function fingerprintLayout(layout: DiscoveredPages) {
  const bytes = new TextEncoder().encode(
    JSON.stringify({ pages: layout.pages, geometry: layout.geometry }),
  );
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
