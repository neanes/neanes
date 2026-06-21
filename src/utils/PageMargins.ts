import type { PageSetup } from '@/models/PageSetup';

export interface ResolvedPageMargins {
  top: number;
  bottom: number;
  // Physical page margins after resolving inside/outside for this page.
  left: number;
  right: number;
  // Saved horizontal margin values. When facing pages is enabled, leftMargin is
  // treated as inside and rightMargin as outside.
  inside: number;
  outside: number;
  // Absolute page-space content bounds. contentLeft/contentRight are x
  // coordinates, not margin widths, even though contentLeft is numerically
  // equal to the resolved left margin.
  contentLeft: number;
  contentRight: number;
  contentWidth: number;
  contentHeight: number;
  isFacingPage: boolean;
}

// Resolves the saved inside/outside margin pair into the physical page margins
// for one concrete page number, then also exposes the absolute content bounds
// derived from those margins.
export function resolvePageMargins(
  pageSetup: PageSetup,
  pageNumber: number,
): ResolvedPageMargins {
  const inside = pageSetup.leftMargin;
  const outside = pageSetup.rightMargin;
  const isFacingPage = pageSetup.facingPages;
  const isOddPage = pageNumber % 2 !== 0;
  const left = isFacingPage && !isOddPage ? outside : inside;
  const right = isFacingPage && !isOddPage ? inside : outside;

  return {
    top: pageSetup.topMargin,
    bottom: pageSetup.bottomMargin,
    left,
    right,
    inside,
    outside,
    contentLeft: left,
    contentRight: pageSetup.pageWidth - right,
    contentWidth: pageSetup.pageWidth - left - right,
    contentHeight:
      pageSetup.pageHeight - pageSetup.topMargin - pageSetup.bottomMargin,
    isFacingPage,
  };
}
