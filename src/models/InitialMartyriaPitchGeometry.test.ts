import { describe, expect, it } from 'vitest';

import {
  getInitialMartyriaPitchGeometry,
  type PitchAtomBounds,
} from '@/models/InitialMartyriaPitchGeometry';

const atom = (overrides: Partial<PitchAtomBounds> = {}): PitchAtomBounds => ({
  advanceWidth: 10,
  inkLeft: 1,
  inkRight: 9,
  inkTop: -8,
  inkBottom: 2,
  lineAscent: 10,
  lineDescent: 3,
  ...overrides,
});

describe('initial martyria pitch geometry', () => {
  it('centers an attachment using asymmetric ink bounds', () => {
    const geometry = getInitialMartyriaPitchGeometry(
      atom({ inkLeft: -2, inkRight: 8 }),
      atom({ inkLeft: 4, inkRight: 14 }),
    );

    expect(geometry.fthora?.left).toBe(-4);
  });

  it('includes text overhang in the cell width', () => {
    const geometry = getInitialMartyriaPitchGeometry(
      atom({ advanceWidth: 10, inkLeft: -4, inkRight: 13 }),
    );

    expect(geometry.width).toBe(17);
  });

  it('keeps non-overlapping attachments on the same tier', () => {
    const geometry = getInitialMartyriaPitchGeometry(
      atom(),
      atom({ inkTop: -8, inkBottom: -2 }),
      atom({ inkTop: -20, inkBottom: -20 }),
    );

    expect(geometry.fthora?.baseline).toBe(-8);
    expect(geometry.quantitative?.baseline).toBe(10);
  });

  it('moves a colliding quantitative attachment above the fthora', () => {
    const geometry = getInitialMartyriaPitchGeometry(atom(), atom(), atom());

    expect(geometry.quantitative!.baseline).toBeLessThan(
      geometry.fthora!.baseline,
    );
  });

  it('places attachments relative to the text baseline regardless of line metrics', () => {
    const geometry = getInitialMartyriaPitchGeometry(
      atom({ lineAscent: 10 }),
      atom({ lineAscent: 20 }),
    );

    expect(geometry.fthora!.baseline).toBe(-12);
  });

  it('uses painted ink rather than the full line box for outer extents', () => {
    const geometry = getInitialMartyriaPitchGeometry(atom());

    expect(geometry.top).toBe(-8);
    expect(geometry.bottom).toBe(2);
  });

  it('includes stroke expansion in the union bounds', () => {
    const withoutStroke = getInitialMartyriaPitchGeometry(atom());
    const withStroke = getInitialMartyriaPitchGeometry(
      atom(),
      undefined,
      undefined,
      2,
    );

    expect(withStroke.width).toBe(withoutStroke.width + 4);
    expect(withStroke.top).toBe(withoutStroke.top - 2);
    expect(withStroke.bottom).toBe(withoutStroke.bottom + 2);
  });

  it('keeps the painted two pixel gap with outlined atoms', () => {
    const geometry = getInitialMartyriaPitchGeometry(
      atom({ strokeWidth: 4 }),
      atom({ strokeWidth: 4 }),
    );
    // The text sits on baseline 0.
    const paintedTextInkTop = -8 - 2;
    const paintedFthoraInkBottom = geometry.fthora!.baseline + 2 + 2;

    expect(paintedTextInkTop - paintedFthoraInkBottom).toBe(2);
  });
});
