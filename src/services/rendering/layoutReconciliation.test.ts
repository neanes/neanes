import { describe, expect, it } from 'vitest';

import { RichTextBoxElement, TextBoxElement } from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import { Score } from '@/models/Score';

import { buildContentPages } from './buildContentPages';
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

  it('retains page-capped heights across pages at the same width in scores with footnotes', () => {
    const score = new Score();
    score.footnotes.push(new Footnote());
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

  it('allows page-capped boxes to shrink and repaginate in scores without footnotes', () => {
    const score = new Score();
    const boxes = [10, 30, 30].map((height) => {
      const box = new RichTextBoxElement();
      box.height = height;
      box.width = 200;
      return box;
    });
    score.staff.elements.unshift(...boxes);
    const naturalHeights = [50, 90, 90];
    const innerPageHeight = 100;
    const reservations = [20, 80, 80, 80].map((extraHeaderHeightPx) => ({
      extraHeaderHeightPx,
      extraFooterHeightPx: 0,
    }));
    const state = new LayoutReconciliation();
    while (true) {
      const pages = buildContentPages(
        boxes.map(({ height }) => ({
          height,
          pageBreak: false,
          footnoteIds: [],
          additionalHeight: 0,
          continuationLines: 0,
        })),
        new Map(),
        { innerPageHeight, footnoteSpacing: 8, reservations },
      );
      const heights = pages.flatMap(({ lines, reservation }) =>
        lines.map(({ index, top }) => ({
          element: boxes[index],
          width: boxes[index].width,
          height: Math.min(
            naturalHeights[index],
            innerPageHeight - reservation.extraHeaderHeightPx - top,
          ),
        })),
      );
      if (!state.apply(score, heights)) {
        expect(
          pages.map(({ lines }) => lines.map(({ index }) => index)),
        ).toEqual([[0, 1], [2]]);
        break;
      }
    }
  });
});
