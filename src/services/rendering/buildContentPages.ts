export interface PaginationLine {
  height: number;
  pageBreak: boolean;
  footnoteIds: string[];
  chapterMarker: string | null;
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
    getReservation: (
      physicalPageNumber: number,
      isChapterOpening: boolean,
    ) => PageReservation;
  },
): ContentPage[] {
  const pages: ContentPage[] = [];
  const createPage = (): ContentPage => ({
    lines: [],
    footnoteIds: [],
    footnoteOverflow: false,
    reservation: constraints.getReservation(pages.length + 1, false),
  });
  let page = createPage();
  pages.push(page);
  let height = 0;
  // A drop cap can extend below the last line placed on the page.
  let contentBottom = 0;
  let ids = new Set<string>();
  let explicitBreak = false;
  let previousChapter = '';
  let firstChapter: string | null = null;
  const reserveForChapter = (chapter: string | null) =>
    firstChapter != null || chapter == null || chapter === previousChapter
      ? page.reservation
      : constraints.getReservation(pages.length, true);
  const availableHeight = (reservation: PageReservation) =>
    constraints.innerPageHeight -
    reservation.extraHeaderHeightPx -
    reservation.extraFooterHeightPx;
  const sectionHeight = (ids: Set<string>) =>
    ids.size === 0
      ? 0
      : [...ids].reduce((sum, id) => sum + footnoteHeights.get(id)!, 0) +
        constraints.footnoteSpacing;
  const fits = (
    candidate: PaginationLine,
    groupIds: string[],
    chapter: string | null,
  ) => {
    const requiredIds = new Set([...ids, ...groupIds]);
    const candidateBottom =
      height + candidate.height + candidate.additionalHeight;
    const fitBottom =
      requiredIds.size > 0
        ? Math.max(contentBottom, candidateBottom)
        : candidateBottom;
    return (
      fitBottom + sectionHeight(requiredIds) <=
      availableHeight(reserveForChapter(chapter))
    );
  };
  for (let index = 0; index < lines.length;) {
    const candidate = lines[index];
    const group = lines.slice(index, index + candidate.continuationLines + 1);
    const breakIndex = group.findIndex((line) => line.pageBreak);
    if (breakIndex !== -1) {
      group.length = breakIndex + 1;
    }
    const groupIds = group.flatMap((line) => line.footnoteIds);
    const groupChapter =
      group.find((line) => line.chapterMarker != null)?.chapterMarker ?? null;
    let groupFits: boolean =
      !explicitBreak && fits(candidate, groupIds, groupChapter);
    if (explicitBreak || (page.lines.length > 0 && !groupFits)) {
      previousChapter = firstChapter ?? previousChapter;
      firstChapter = null;
      page = createPage();
      pages.push(page);
      height = 0;
      contentBottom = 0;
      ids = new Set();
      groupFits = fits(candidate, groupIds, groupChapter);
    }

    // Place fitting continuation lines with the reservation they were tested
    // against. If the group is too tall on an empty page, place one line and
    // let the remaining lines paginate normally.
    const chapter = groupFits ? groupChapter : candidate.chapterMarker;
    if (firstChapter == null && chapter != null) {
      page.reservation = reserveForChapter(chapter);
      firstChapter = chapter;
    }
    for (const line of groupFits ? group : [candidate]) {
      page.lines.push({ index, top: height });
      index++;
      line.footnoteIds.forEach((id) => ids.add(id));
      height += line.height;
      contentBottom = Math.max(contentBottom, height + line.additionalHeight);
      explicitBreak = line.pageBreak;
    }
    page.footnoteIds = [...ids];
    page.footnoteOverflow =
      ids.size > 0 &&
      contentBottom + sectionHeight(ids) > availableHeight(page.reservation);
  }
  return pages;
}
