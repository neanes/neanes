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
    footnoteSpacing: number;
    breaksBefore?: ReadonlySet<number>;
    onOverflowBreak?: (index: number, first: number, excess: number) => void;
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
    ids.size === 0
      ? 0
      : [...ids].reduce((sum, id) => sum + footnoteHeights.get(id)!, 0) +
        constraints.footnoteSpacing;
  for (const [index, candidate] of lines.entries()) {
    const groupedIds = lines
      .slice(index, index + candidate.continuationLines + 1)
      .flatMap((line) => line.footnoteIds);
    const requiredIds = new Set([...ids, ...groupedIds]);
    const availableHeight = () =>
      constraints.innerPageHeight -
      page.reservation.extraHeaderHeightPx -
      page.reservation.extraFooterHeightPx;
    const excess =
      height +
      candidate.height +
      candidate.additionalHeight +
      sectionHeight(requiredIds) -
      availableHeight();
    const first = page.lines[0];
    const remembered = constraints.breaksBefore?.has(index);
    if (explicitBreak || (first && (remembered || excess > 0))) {
      if (first && !explicitBreak && !remembered) {
        constraints.onOverflowBreak?.(index, first.index, excess);
      }
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
