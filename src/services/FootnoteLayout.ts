import { PageSetup } from '@/models/PageSetup';
import { resolvePageMargins } from '@/utils/PageMargins';
import { Unit } from '@/utils/Unit';

export const FOOTNOTE_SPACING = Unit.fromPt(6);
export const FOOTNOTE_SECTION_SPACING = Unit.fromPt(8);
export const FOOTNOTE_RULE_THICKNESS = Unit.fromPt(0.5);
export const FOOTNOTE_OVERFLOW_NOTICE_HEIGHT = 64;

export function footnoteMarkerFontSize(pageSetup: PageSetup) {
  return pageSetup.neumeDefaultFontSize * 0.65;
}

export function footnoteMarkerFont(pageSetup: PageSetup) {
  return `${footnoteMarkerFontSize(pageSetup)}px serif`;
}

export function footnoteMarkerText(marker: string | number) {
  return `(${marker})`;
}

export function footnoteSectionHeight(heights: number[], showRule: boolean) {
  if (heights.length === 0) {
    return 0;
  }
  return (
    heights.reduce((sum, height) => sum + height, 0) +
    (heights.length - 1) * FOOTNOTE_SPACING +
    FOOTNOTE_SECTION_SPACING +
    (showRule ? FOOTNOTE_RULE_THICKNESS + FOOTNOTE_SPACING : 0)
  );
}

export function footnotePageSetup(
  base: PageSetup,
  gutter: number,
  physicalPageNumber: number,
) {
  const margins = resolvePageMargins(base, physicalPageNumber);
  return Object.assign(new PageSetup(), base, {
    facingPages: false,
    leftMargin: margins.left + (base.melkiteRtl ? 0 : gutter),
    rightMargin: margins.right + (base.melkiteRtl ? gutter : 0),
  });
}
