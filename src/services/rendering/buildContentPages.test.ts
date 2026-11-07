import { describe, expect, it } from 'vitest';

import { buildContentPages, type PaginationLine } from './buildContentPages';

function line(height: number, footnoteIds: string[] = []): PaginationLine {
  return {
    height,
    pageBreak: false,
    footnoteIds,
    additionalHeight: 0,
    continuationLines: 0,
  };
}

const footnoteSpacing = 19;

function paginate(
  lines: PaginationLine[],
  heights = new Map<string, number>(),
  innerPageHeight = 100,
) {
  return buildContentPages(lines, heights, {
    innerPageHeight,
    footnoteSpacing,
    reservations: Array.from({ length: lines.length + 1 }, () => ({
      extraHeaderHeightPx: 0,
      extraFooterHeightPx: 0,
    })),
  });
}

const membership = (pages: ReturnType<typeof paginate>) =>
  pages.map((page) => page.lines.map((line) => line.index));

describe('whole-footnote page selection', () => {
  it('is deterministic and does not mutate prepared inputs', () => {
    const lines = [line(60), line(30, ['body']), line(20)];
    const heights = new Map([['body', 25]]);
    const input = JSON.stringify(lines);
    const first = paginate(lines, heights);
    expect(paginate(lines, heights)).toEqual(first);
    expect(membership(first)).toEqual([[0], [1, 2]]);
    expect(JSON.stringify(lines)).toBe(input);
  });

  it('retains the initial empty page for empty prepared content', () => {
    const pages = paginate([]);
    expect(membership(pages)).toEqual([[]]);
    expect(pages[0].footnoteIds).toEqual([]);
    expect(pages[0].footnoteOverflow).toBe(false);
  });

  it('includes already owned footnotes when testing the next candidate', () => {
    const pages = paginate([line(20, ['a']), line(60)], new Map([['a', 10]]));
    expect(membership(pages)).toEqual([[0], [1]]);
    expect(pages.map((page) => page.footnoteIds)).toEqual([['a'], []]);
  });

  it('moves the candidate together with all of its whole footnotes', () => {
    const lines = [line(55), line(25, ['a', 'b'])];
    const pages = paginate(
      lines,
      new Map([
        ['a', 10],
        ['b', 10],
      ]),
    );
    expect(membership(pages)).toEqual([[0], [1]]);
    expect(pages.map((page) => page.footnoteIds)).toEqual([[], ['a', 'b']]);
    expect(pages[1].footnoteOverflow).toBe(false);
  });

  it('counts a referenced body once and accepts an exact fit including separators', () => {
    const heights = new Map([['a', 10]]);
    const total = 50 + 10 + footnoteSpacing;
    const pages = paginate([line(25, ['a']), line(25, ['a'])], heights, total);
    expect(membership(pages)).toEqual([[0, 1]]);
    expect(pages[0].footnoteIds).toEqual(['a']);
    expect(pages[0].footnoteOverflow).toBe(false);
  });

  it('keeps impossible content editable and reports whole-footnote overflow', () => {
    const pages = paginate([line(30, ['a']), line(20)], new Map([['a', 100]]));
    expect(membership(pages)).toEqual([[0], [1]]);
    expect(pages[0].footnoteOverflow).toBe(true);
    expect(pages[0].footnoteIds).toEqual(['a']);
  });

  it('honors explicit breaks without adding a trailing empty page', () => {
    const lines = [line(10), line(10), line(10)];
    lines[0].pageBreak = true;
    lines[2].pageBreak = true;
    expect(membership(paginate(lines))).toEqual([[0], [1, 2]]);
  });

  it('reports overflow breaks and honors remembered boundaries on a later pass', () => {
    const overflow: number[][] = [];
    const constraints = {
      innerPageHeight: 100,
      footnoteSpacing,
      reservations: Array.from({ length: 4 }, () => ({
        extraHeaderHeightPx: 0,
        extraFooterHeightPx: 0,
      })),
      onOverflowBreak: (index: number, first: number, excess: number) =>
        overflow.push([index, first, excess]),
    };
    const last = line(5);
    const candidate = line(50);
    candidate.pageBreak = true;
    const lines = [line(60), candidate, last];
    expect(
      membership(buildContentPages(lines, new Map(), constraints)),
    ).toEqual([[0], [1], [2]]);
    expect(overflow).toEqual([[1, 0, 10]]);

    candidate.height = 30;
    overflow.length = 0;
    expect(
      membership(
        buildContentPages(lines, new Map(), {
          ...constraints,
          breaksBefore: new Set([0, 1]),
        }),
      ),
    ).toEqual([[0], [1], [2]]);
    expect(overflow).toEqual([]);
  });

  it('reserves continuation heights and their footnotes before starting a drop cap', () => {
    const lines = [line(45), line(20), line(20, ['a'])];
    lines[1].continuationLines = 1;
    lines[1].additionalHeight = 20;
    const pages = paginate(lines, new Map([['a', 10]]));
    expect(membership(pages)).toEqual([[0], [1, 2]]);
    expect(pages[1].footnoteIds).toEqual(['a']);
    expect(pages[1].lines.map((line) => line.top)).toEqual([0, 20]);
  });

  it('retains explicit breaks even within a required drop-cap span', () => {
    const lines = [line(20), line(20)];
    lines[0].continuationLines = 1;
    lines[0].additionalHeight = 20;
    lines[0].pageBreak = true;
    expect(membership(paginate(lines))).toEqual([[0], [1]]);
  });

  it('subtracts measured header and footer reservations on each physical page', () => {
    const pages = buildContentPages([line(60), line(30)], new Map(), {
      innerPageHeight: 100,
      footnoteSpacing: 8,
      reservations: Array.from({ length: 3 }, () => ({
        extraHeaderHeightPx: 10,
        extraFooterHeightPx: 10,
      })),
    });
    expect(membership(pages)).toEqual([[0], [1]]);
    expect(pages.map((page) => page.reservation.extraFooterHeightPx)).toEqual([
      10, 10,
    ]);
  });
});
