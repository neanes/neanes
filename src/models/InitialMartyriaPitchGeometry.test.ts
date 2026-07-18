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

    expect(geometry.fthora?.top).toBe(-2);
    expect(geometry.quantitative?.top).toBe(16);
  });

  it('moves a colliding quantitative attachment above the fthora', () => {
    const geometry = getInitialMartyriaPitchGeometry(atom(), atom(), atom());

    expect(geometry.quantitative!.top).toBeLessThan(geometry.fthora!.top);
  });

  it('converts each atom baseline to its line-box top', () => {
    const geometry = getInitialMartyriaPitchGeometry(
      atom({ lineAscent: 10 }),
      atom({ lineAscent: 20 }),
    );

    expect(geometry.text.top).toBe(10);
    expect(geometry.fthora!.top).toBe(-12);
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

  it('moves text and attachments together for a nonzero baseline shift', () => {
    const unshifted = getInitialMartyriaPitchGeometry(atom(), atom());
    const shifted = getInitialMartyriaPitchGeometry(
      atom(),
      atom(),
      undefined,
      0,
      5,
    );

    expect(shifted.top - unshifted.top).toBe(-5);
    expect(shifted.bottom - unshifted.bottom).toBe(-5);

    const textInkTop =
      shifted.top + shifted.text.top + atom().lineAscent + atom().inkTop;
    const fthoraInkBottom =
      shifted.top + shifted.fthora!.top + atom().lineAscent + atom().inkBottom;
    expect(textInkTop - fthoraInkBottom).toBe(2);
  });

  it('keeps the painted two pixel gap with outlined atoms', () => {
    const geometry = getInitialMartyriaPitchGeometry(
      atom({ strokeWidth: 4 }),
      atom({ strokeWidth: 4 }),
    );
    const paintedTextInkTop = geometry.top + geometry.text.top + 10 - 10;
    const paintedFthoraInkBottom = geometry.top + geometry.fthora!.top + 10 + 4;

    expect(paintedTextInkTop - paintedFthoraInkBottom).toBe(2);
  });
});
