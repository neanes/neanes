import { describe, expect, it } from 'vitest';

import { TextBoxElement } from '@/models/Element';
import { Score } from '@/models/Score';

import { LayoutReconciliation } from './layoutReconciliation';

describe('detached layout reconciliation', () => {
  it('aggregates repeated template heights and retains their maximum across passes', () => {
    const score = new Score();
    const header = score.headers.default.elements[0] as TextBoxElement;
    const body = new TextBoxElement();
    score.staff.elements.unshift(body);
    const state = new LayoutReconciliation();
    expect(
      state.apply(score, [
        { element: header, height: 60 },
        { element: header, height: 100 },
        { element: body, height: 80 },
      ]),
    ).toBe(true);
    expect(header.height).toBe(100);
    expect(body.height).toBe(80);
    expect(
      state.apply(score, [
        { element: header, height: 50 },
        { element: body, height: 80.001 },
      ]),
    ).toBe(false);
    expect(header.height).toBe(100);
    expect(
      state.apply(score, [
        { element: header, height: 110 },
        { element: body, height: 70 },
      ]),
    ).toBe(true);
    expect(body.height).toBe(70);
  });

  it('bounds oscillating layout passes and accepts convergence within the limit', () => {
    const score = new Score();
    const body = new TextBoxElement();
    const state = new LayoutReconciliation();
    for (let i = 0; i < 11; i++) {
      expect(state.apply(score, [{ element: body, height: 100 + i }])).toBe(
        true,
      );
    }
    expect(state.apply(score, [{ element: body, height: 110 }])).toBe(false);
    expect(() => state.apply(score, [{ element: body, height: 111 }])).toThrow(
      'LAYOUT_DID_NOT_SETTLE',
    );
  });
});
