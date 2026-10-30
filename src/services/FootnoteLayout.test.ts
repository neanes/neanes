import { describe, expect, it } from 'vitest';

import { PageSetup } from '@/models/PageSetup';
import { resolvePageMargins } from '@/utils/PageMargins';

import {
  FOOTNOTE_RULE_THICKNESS,
  FOOTNOTE_SECTION_SPACING,
  FOOTNOTE_SPACING,
  footnotePageSetup,
  footnoteSectionHeight,
} from './FootnoteLayout';

describe('footnote area geometry', () => {
  it('reserves the separator once and no space on pages without footnotes', () => {
    expect(footnoteSectionHeight([], true)).toBe(0);
    expect(footnoteSectionHeight([100, 50], false)).toBe(
      150 + FOOTNOTE_SPACING + FOOTNOTE_SECTION_SPACING,
    );
    expect(
      footnoteSectionHeight([100, 50], true) -
        footnoteSectionHeight([100, 50], false),
    ).toBeCloseTo(FOOTNOTE_RULE_THICKNESS + FOOTNOTE_SPACING);
  });

  it('keeps body width stable while respecting facing pages and RTL label gutters', () => {
    const setup = new PageSetup();
    setup.facingPages = true;
    setup.leftMargin = 30;
    setup.rightMargin = 60;
    const first = resolvePageMargins(footnotePageSetup(setup, 20, 1), 1);
    const second = resolvePageMargins(footnotePageSetup(setup, 20, 2), 2);
    expect(first.contentWidth).toBe(second.contentWidth);
    expect(second.left).toBe(80);
    expect(second.right).toBe(30);
    setup.melkiteRtl = true;
    const rtl = resolvePageMargins(footnotePageSetup(setup, 20, 2), 2);
    expect(rtl.contentWidth).toBe(first.contentWidth);
    expect(rtl.left).toBe(60);
    expect(rtl.right).toBe(50);
  });
});
