import { describe, expect, it } from 'vitest';

import {
  getInitialMartyriaStackedCharactersGeometry,
  type StackedCharacterBounds,
} from '@/models/InitialMartyriaStackedCharactersGeometry';

const row = (overrides: Partial<StackedCharacterBounds> = {}) => ({
  advanceWidth: 10,
  inkLeft: 1,
  inkRight: 9,
  inkTop: -8,
  inkBottom: 2,
  lineAscent: 10,
  lineDescent: 3,
  ...overrides,
});

describe('initial martyria stacked-character geometry', () => {
  it('anchors the bottom row painted ink top at zero', () => {
    const geometry = getInitialMartyriaStackedCharactersGeometry(
      row(),
      row({ inkTop: -6 }),
    );

    expect(geometry.top + geometry.bottomRow.top + 10 - 6).toBe(0);
  });

  it('uses painted ink and stroke overflow for outer extents', () => {
    const geometry = getInitialMartyriaStackedCharactersGeometry(
      row({ strokeWidth: 4 }),
      row({ strokeWidth: 4 }),
    );

    expect(geometry.top).toBe(-14);
    expect(geometry.bottom).toBe(14);
  });

  it('stacks the top row painted ink directly on the bottom row', () => {
    const geometry = getInitialMartyriaStackedCharactersGeometry(
      row(),
      row({ lineAscent: 7, lineDescent: 4 }),
    );

    const topRowPaintedBottom = geometry.top + geometry.topRow.top + 10 + 2;
    const bottomRowPaintedTop = geometry.top + geometry.bottomRow.top + 7 - 8;

    expect(bottomRowPaintedTop - topRowPaintedBottom).toBe(0);
  });

  it('reserves symmetric width for asymmetric characters', () => {
    const geometry = getInitialMartyriaStackedCharactersGeometry(
      row({ inkLeft: -3, inkRight: 12, advanceWidth: 8 }),
      row({ inkLeft: 2, inkRight: 7, advanceWidth: 14 }),
    );

    expect(geometry.width).toBe(16);
    expect(geometry.bottom).toBeGreaterThan(geometry.top);
  });

  it('raises only the top row by the requested offset', () => {
    const baseline = getInitialMartyriaStackedCharactersGeometry(row(), row());
    const raised = getInitialMartyriaStackedCharactersGeometry(
      row(),
      row(),
      0.8,
    );

    expect(raised.top + raised.topRow.top).toBe(
      baseline.top + baseline.topRow.top - 0.8,
    );
    expect(raised.top + raised.bottomRow.top).toBe(
      baseline.top + baseline.bottomRow.top,
    );
  });
});
