import { footnoteSectionHeight } from '@/services/FootnoteLayout';

export interface PaginationLine {
  height: number;
  pageBreak: boolean;
  footnoteIds: string[];
  // The first line of a multiline drop cap reserves its continuation span.
  additionalHeight: number;
  continuationLines: number;
}

export interface PageReservation {
  extraHeaderHeightPx: number;
  extraFooterHeightPx: number;
}

export interface ContentPage {
  lines: { index: number; top: number }[];
  footnoteIds: string[];
  footnoteOverflow: boolean;
  reservation: PageReservation;
}

// Select pages using prepared dimensions only. Element coordinates and previous
// element.page assignments are neither inputs nor outputs of this calculation.
export function buildContentPages(
  lines: readonly PaginationLine[],
  footnoteHeights: ReadonlyMap<string, number>,
  constraints: {
    innerPageHeight: number;
    showFootnoteHorizontalRule: boolean;
    // Indexed by physical page minus one, with enough entries for every line
    // to start a page (and the initial empty page when there are no lines).
    reservations: readonly PageReservation[];
  },
): ContentPage[] {
  const pages: ContentPage[] = [];
  const createPage = (): ContentPage => ({
    lines: [],
    footnoteIds: [],
    footnoteOverflow: false,
    reservation: constraints.reservations[pages.length],
  });
  let page = createPage();
  pages.push(page);
  let height = 0;
  let ids = new Set<string>();
  let explicitBreak = false;
  const sectionHeight = (ids: Set<string>) =>
    footnoteSectionHeight(
      [...ids].map((id) => footnoteHeights.get(id)!),
      constraints.showFootnoteHorizontalRule,
    );
  for (const [index, candidate] of lines.entries()) {
    const groupedIds = lines
      .slice(index, index + candidate.continuationLines + 1)
      .flatMap((line) => line.footnoteIds);
    const requiredIds = new Set([...ids, ...groupedIds]);
    const availableHeight = () =>
      constraints.innerPageHeight -
      page.reservation.extraHeaderHeightPx -
      page.reservation.extraFooterHeightPx;
    if (
      (page.lines.length > 0 &&
        height +
          candidate.height +
          candidate.additionalHeight +
          sectionHeight(requiredIds) >
          availableHeight()) ||
      explicitBreak
    ) {
      page = createPage();
      pages.push(page);
      height = 0;
      ids = new Set();
    }
    page.lines.push({ index, top: height });
    candidate.footnoteIds.forEach((id) => ids.add(id));
    height += candidate.height;
    page.footnoteIds = [...ids];
    page.footnoteOverflow =
      ids.size > 0 && height + sectionHeight(ids) > availableHeight();
    explicitBreak = candidate.pageBreak;
  }
  return pages;
}
