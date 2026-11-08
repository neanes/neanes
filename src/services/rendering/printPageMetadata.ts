import type { Page } from '@/models/Page';
import type { Workspace } from '@/models/Workspace';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import { getDisplayedPageNumber } from '@/utils/PageNumbering';
import { resolveRunningMarkerPageMetadata } from '@/utils/runningMarkers';

export function getPrintPageMetadata(workspace: Workspace, pages: Page[]) {
  const { score, filePath, tempFileName } = workspace;
  const { pageSetup, documentProperties } = score;
  const numberOfPages = getDisplayedPageNumber(
    pageSetup,
    pages.at(-1)?.physicalPageNumber ?? 0,
  );
  return resolveRunningMarkerPageMetadata(pages).map((marker, index) => ({
    pageNumber: getDisplayedPageNumber(
      pageSetup,
      pages[index].physicalPageNumber,
    ),
    numberOfPages,
    numerals: pageSetup.numerals,
    fileName: filePath == null ? tempFileName : getFileNameFromPath(filePath),
    filePath: filePath ?? '',
    ...documentProperties,
    ...marker,
  }));
}
