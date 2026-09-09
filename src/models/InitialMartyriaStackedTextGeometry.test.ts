import { describe, expect, it } from 'vitest';

import {
  getInitialMartyriaStackedTextGeometry,
  type StackedTextRowBounds,
} from '@/models/InitialMartyriaStackedTextGeometry';

const row = (overrides: Partial<StackedTextRowBounds> = {}) => ({
  advanceWidth: 10,
  inkLeft: 1,
  inkRight: 9,
  inkTop: -8,
  inkBottom: 2,
  lineAscent: 10,
  lineDescent: 3,
  ...overrides,
});

describe('initial martyria stacked text geometry', () => {
  it('anchors the bottom row painted ink top at zero', () => {
    const geometry = getInitialMartyriaStackedTextGeometry(
      row(),
      row({ inkTop: -6 }),
    );

    expect(geometry.top + geometry.rows[1].top + 10 - 6).toBe(0);
  });

  it('uses painted ink and stroke overflow for outer extents', () => {
    const geometry = getInitialMartyriaStackedTextGeometry(
      row({ strokeWidth: 4 }),
      row({ strokeWidth: 4 }),
    );

    expect(geometry.top).toBe(-14);
    expect(geometry.bottom).toBe(14);
  });

  it('stacks the top row painted ink directly on the bottom row', () => {
    const geometry = getInitialMartyriaStackedTextGeometry(
      row(),
      row({ lineAscent: 7, lineDescent: 4 }),
    );

    const topRowPaintedBottom = geometry.top + geometry.rows[0].top + 10 + 2;
    const bottomRowPaintedTop = geometry.top + geometry.rows[1].top + 7 - 8;

    expect(bottomRowPaintedTop - topRowPaintedBottom).toBe(0);
  });

  it('handles asymmetric contents', () => {
    const geometry = getInitialMartyriaStackedTextGeometry(
      row({ inkLeft: -3, inkRight: 12, advanceWidth: 8 }),
      row({ inkLeft: 2, inkRight: 7, advanceWidth: 14 }),
    );

    expect(geometry.width).toBe(17);
    expect(geometry.rows[0].left).toBe(3);
    expect(geometry.bottom).toBeGreaterThan(geometry.top);
  });

  it('raises only the top row by the requested offset', () => {
    const baseline = getInitialMartyriaStackedTextGeometry(row(), row());
    const raised = getInitialMartyriaStackedTextGeometry(row(), row(), 0.8);

    expect(raised.top + raised.rows[0].top).toBe(
      baseline.top + baseline.rows[0].top - 0.8,
    );
    expect(raised.top + raised.rows[1].top).toBe(
      baseline.top + baseline.rows[1].top,
    );
  });
});
