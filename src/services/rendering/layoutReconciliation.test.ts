import { describe, expect, it } from 'vitest';

import { RichTextBoxElement, TextBoxElement } from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import { Score } from '@/models/Score';

import { LayoutReconciliation } from './layoutReconciliation';

describe('detached layout reconciliation', () => {
  it('aggregates repeated template heights and retains their maximum across passes', () => {
    const score = new Score();
    const footnote = new Footnote();
    score.footnotes.push(footnote);
    const header = score.headers.default.elements[0] as TextBoxElement;
    const body = new TextBoxElement();
    footnote.staff.elements.unshift(body);
    const state = new LayoutReconciliation();
    expect(
      state.apply(score, [
        { element: header, width: header.width, height: 60 },
        { element: header, width: header.width, height: 100 },
        { element: body, width: body.width, height: 80 },
      ]),
    ).toBe(true);
    expect(header.height).toBe(100);
    expect(body.height).toBe(80);
    expect(
      state.apply(score, [
        { element: header, width: header.width, height: 50 },
        { element: body, width: body.width, height: 80.001 },
      ]),
    ).toBe(false);
    expect(header.height).toBe(100);
    expect(
      state.apply(score, [
        { element: header, width: header.width, height: 110 },
        { element: body, width: body.width, height: 70 },
      ]),
    ).toBe(true);
    expect(body.height).toBe(70);
  });

  it('retains page-capped heights across pages at the same width', () => {
    const score = new Score();
    const box = new RichTextBoxElement();
    score.staff.elements.unshift(box);
    box.width = 200;
    box.height = 30;
    const state = new LayoutReconciliation();

    expect(state.apply(score, [{ element: box, width: 200, height: 50 }])).toBe(
      true,
    );
    expect(state.apply(score, [{ element: box, width: 200, height: 40 }])).toBe(
      false,
    );
    expect(box.height).toBe(50);

    box.width = 300;
    expect(state.apply(score, [{ element: box, width: 300, height: 40 }])).toBe(
      true,
    );
    expect(box.height).toBe(40);
  });

  it('bounds oscillating layout passes and accepts convergence within the limit', () => {
    const score = new Score();
    const body = new TextBoxElement();
    const state = new LayoutReconciliation();
    for (let i = 0; i < 11; i++) {
      expect(
        state.apply(score, [
          { element: body, width: body.width, height: 100 + i },
        ]),
      ).toBe(true);
    }
    expect(
      state.apply(score, [{ element: body, width: body.width, height: 110 }]),
    ).toBe(false);
    expect(() =>
      state.apply(score, [{ element: body, width: body.width, height: 111 }]),
    ).toThrow('LAYOUT_DID_NOT_SETTLE');
  });
});
