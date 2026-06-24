import type { PageSetup } from '@/models/PageSetup';

export function getDisplayedPageNumber(
  pageSetup: PageSetup,
  physicalPageNumber: number,
): number {
  return physicalPageNumber + pageSetup.firstPageNumber - 1;
}

export function isDisplayedPageNumberOdd(
  pageSetup: PageSetup,
  physicalPageNumber: number,
): boolean {
  return getDisplayedPageNumber(pageSetup, physicalPageNumber) % 2 !== 0;
}

export function isRightHandPage(
  pageSetup: PageSetup,
  physicalPageNumber: number,
): boolean {
  if (!pageSetup.facingPages) {
    return true;
  }

  const isOddPage = isDisplayedPageNumberOdd(pageSetup, physicalPageNumber);

  return pageSetup.direction === 'rtl' ? !isOddPage : isOddPage;
}
