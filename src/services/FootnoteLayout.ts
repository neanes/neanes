import { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { resolveFontCss } from '@/utils/fontStyle';
import { resolvePageMargins } from '@/utils/PageMargins';
import { Unit } from '@/utils/Unit';

const FOOTNOTE_MARKER_GAP_EM = 0.4;

export const FOOTNOTE_SPACING = Unit.fromPt(6);
export const FOOTNOTE_SECTION_SPACING = Unit.fromPt(8);
export const FOOTNOTE_RULE_THICKNESS = Unit.fromPt(0.5);
export const FOOTNOTE_OVERFLOW_NOTICE_HEIGHT = 64;

export function footnoteMarkerStyle(
  styles: ParagraphStyle[],
  role: 'reference' | 'body' = 'reference',
) {
  return resolveParagraphStyle(
    styles,
    role === 'body'
      ? BUILT_IN_PARAGRAPH_STYLE_IDS.FootnoteBodyMarker
      : BUILT_IN_PARAGRAPH_STYLE_IDS.FootnoteReference,
  );
}

export function footnoteMarkerFont(
  styles: ParagraphStyle[],
  role: 'reference' | 'body' = 'reference',
) {
  return resolveFontCss(footnoteMarkerStyle(styles, role));
}

export function footnoteBodyMarkerGap(styles: ParagraphStyle[]) {
  return FOOTNOTE_MARKER_GAP_EM * footnoteMarkerStyle(styles, 'body').fontSize;
}

// Body width depends on typography, never on the current marker or pagination.
export function footnoteBodyGutter(styles: ParagraphStyle[]) {
  return (
    (1.8 + FOOTNOTE_MARKER_GAP_EM) *
    footnoteMarkerStyle(styles, 'body').fontSize
  );
}

export function footnoteBodyMarkerText(marker: string | number) {
  return /^\p{Decimal_Number}+$/u.test(String(marker))
    ? `${marker}.`
    : String(marker);
}

export function footnoteMarkerText(
  marker: string | number,
  parentheses = true,
) {
  return parentheses ? `(${marker})` : String(marker);
}

export function footnoteSectionHeight(heights: number[], showRule: boolean) {
  if (heights.length === 0) {
    return 0;
  }
  return (
    heights.reduce((sum, height) => sum + height, 0) +
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

interface MarkerObstacle {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

// Coordinates are physical pixels relative to the musical baseline.
export function positionFootnoteMarker(
  base: Pick<MarkerObstacle, 'left' | 'right'>[],
  obstacles: MarkerObstacle[],
  width: number,
  height: number,
  defaultBottom: number,
  offsetX: number,
  offsetY: number,
  clearance: number,
) {
  const left =
    (Math.min(...base.map((box) => box.left)) +
      Math.max(...base.map((box) => box.right)) -
      width) /
      2 +
    offsetX;
  let top = defaultBottom - height + offsetY;
  // Visit lower obstacles first so raising past one can reveal another above it.
  for (const box of [...obstacles].sort((a, b) => b.bottom - a.bottom)) {
    if (
      left < box.right + clearance &&
      left + width > box.left - clearance &&
      top < box.bottom + clearance &&
      top + height > box.top - clearance
    ) {
      top = box.top - clearance - height;
    }
  }
  return { left, top };
}
