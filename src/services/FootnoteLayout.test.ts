import { describe, expect, it } from 'vitest';

import { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
} from '@/models/ParagraphStyle';
import { resolvePageMargins } from '@/utils/PageMargins';
import { Unit } from '@/utils/Unit';

import {
  footnoteBodyGutter,
  footnoteBodyMarkerGap,
  footnoteBodyMarkerText,
  footnoteMarkerText,
  footnotePageSetup,
  positionFootnoteMarker,
  resolveFootnoteSpacing,
} from './FootnoteLayout';

describe('footnote area geometry', () => {
  it('adds a period to numeric body markers and leaves symbols unchanged', () => {
    expect(footnoteBodyMarkerText(1)).toBe('1.');
    expect(footnoteBodyMarkerText('123')).toBe('123.');
    expect(footnoteBodyMarkerText('*')).toBe('*');
    expect(footnoteBodyMarkerText('**')).toBe('**');
  });

  it('optionally wraps musical markers in parentheses', () => {
    expect(footnoteMarkerText('*')).toBe('(*)');
    expect(footnoteMarkerText('*', false)).toBe('*');
    expect(footnoteMarkerText(12, false)).toBe('12');
  });

  it('uses the configured spacing and omits hidden rule dimensions', () => {
    const setup = new PageSetup();
    expect(resolveFootnoteSpacing(setup)).toEqual({
      above: Unit.fromPt(6),
      below: Unit.fromPt(2.6),
      thickness: Unit.fromPt(1),
    });

    setup.footnoteSpaceAboveRule = 10;
    setup.footnoteSpaceBelowRule = 5;
    setup.footnoteRuleThickness = 2;
    expect(resolveFootnoteSpacing(setup)).toEqual({
      above: 10,
      below: 5,
      thickness: 2,
    });

    setup.showFootnoteHorizontalRule = false;
    expect(resolveFootnoteSpacing(setup)).toEqual({
      above: 10,
      below: 0,
      thickness: 0,
    });
  });

  it('scales the fixed gutter with body marker typography', () => {
    const styles = createDefaultParagraphStyles();
    const markerStyle = styles.find(
      ({ id }) => id === BUILT_IN_PARAGRAPH_STYLE_IDS.FootnoteBodyMarker,
    )!;
    markerStyle.overrides.fontSize = 20;
    expect(footnoteBodyGutter(styles)).toBeCloseTo(44);
    expect(footnoteBodyMarkerGap(styles)).toBe(8);
    markerStyle.overrides.fontSize = 10;
    expect(footnoteBodyGutter(styles)).toBeCloseTo(22);
    expect(footnoteBodyMarkerGap(styles)).toBe(4);
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

describe('musical footnote marker placement', () => {
  const base = { left: 0, right: 40, top: -20, bottom: 0 };
  const mark = { left: 15, right: 25, top: -40, bottom: -22 };
  const defaultBottom = -20;

  it('starts at the same baseline-relative height for different base ink bounds', () => {
    for (const top of [-5, -15]) {
      const glyph = { ...base, top };
      expect(
        positionFootnoteMarker(
          [glyph],
          [glyph],
          10,
          10,
          defaultBottom,
          0,
          0,
          2,
        ),
      ).toEqual({ left: 15, top: -30 });
    }
  });

  it('keeps different marker heights at the same default ink bottom', () => {
    for (const height of [5, 10, 20]) {
      expect(
        positionFootnoteMarker([base], [], 10, height, defaultBottom, 0, 0, 2),
      ).toEqual({ left: 15, top: defaultBottom - height });
    }
  });

  it('raises only as needed to clear the base and attached marks', () => {
    expect(
      positionFootnoteMarker([base], [base], 10, 10, defaultBottom, 0, 0, 2),
    ).toEqual({ left: 15, top: -32 });
    expect(
      positionFootnoteMarker(
        [base],
        [base, mark],
        10,
        10,
        defaultBottom,
        0,
        0,
        2,
      ),
    ).toEqual({ left: 15, top: -52 });
  });

  it('applies horizontal offsets before deciding which marks to clear', () => {
    expect(
      positionFootnoteMarker([base], [mark], 10, 10, defaultBottom, 20, 0, 2),
    ).toEqual({ left: 35, top: -30 });
  });

  it('applies vertical offsets before clearance and never lowers a raised marker', () => {
    expect(
      positionFootnoteMarker([base], [mark], 10, 10, defaultBottom, 0, 5, 2),
    ).toEqual({ left: 15, top: -52 });
    expect(
      positionFootnoteMarker([base], [mark], 10, 10, defaultBottom, 0, -30, 2),
    ).toEqual({ left: 15, top: -60 });
  });

  it('ignores the tall right region of a compound base unless the marker overlaps it', () => {
    const oligon = { left: 0, right: 60, top: -5, bottom: 0 };
    const ypsili = { left: 50, right: 60, top: -40, bottom: -5 };
    const regions = [oligon, ypsili];
    expect(
      positionFootnoteMarker(regions, regions, 10, 10, defaultBottom, 0, 0, 2),
    ).toEqual({ left: 25, top: -30 });
    expect(
      positionFootnoteMarker(regions, regions, 10, 10, defaultBottom, 25, 0, 2),
    ).toEqual({ left: 50, top: -52 });
    expect(
      positionFootnoteMarker(regions, regions, 10, 10, defaultBottom, 0, -3, 2),
    ).toEqual({ left: 25, top: -33 });
  });

  it('includes nearby base regions within the clearance and uses the default height outside the glyph', () => {
    const regions = [
      { left: 0, right: 40, top: -5, bottom: 0 },
      { left: 26, right: 40, top: -40, bottom: -5 },
    ];
    expect(
      positionFootnoteMarker(regions, regions, 10, 10, defaultBottom, 0, 0, 2),
    ).toEqual({ left: 15, top: -52 });
    expect(
      positionFootnoteMarker(regions, regions, 10, 10, defaultBottom, 60, 0, 2),
    ).toEqual({ left: 75, top: -30 });
  });

  it('retains the default position when an obstacle is already above the marker', () => {
    const upper = { left: 15, right: 25, top: -55, bottom: -40 };
    expect(
      positionFootnoteMarker([base], [upper], 10, 10, defaultBottom, 0, 0, 2),
    ).toEqual({ left: 15, top: -30 });
  });

  it('clears stacked obstacles regardless of their input order', () => {
    const upper = { left: 15, right: 25, top: -55, bottom: -45 };
    expect(
      positionFootnoteMarker(
        [base],
        [upper, mark],
        10,
        10,
        defaultBottom,
        0,
        0,
        2,
      ),
    ).toEqual({ left: 15, top: -67 });
    expect(
      positionFootnoteMarker(
        [base],
        [mark, upper],
        10,
        10,
        defaultBottom,
        0,
        0,
        2,
      ),
    ).toEqual({ left: 15, top: -67 });
  });
});
