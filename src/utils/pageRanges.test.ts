import { describe, expect, it } from 'vitest';

import { normalizePageRanges, parsePageRanges } from './pageRanges';

describe('parsePageRanges', () => {
  it('parses pages and ranges in page order', () => {
    expect(parsePageRanges('5, 1-3, 3, 8-10', 12)).toEqual({
      pageNumbers: [1, 2, 3, 5, 8, 9, 10],
      error: null,
    });
  });

  it.each(['', '1,', '1--3', '3-1', 'page 1'])(
    'rejects invalid syntax: %s',
    (value) => {
      expect(parsePageRanges(value, 10)).toEqual({
        pageNumbers: null,
        error: 'format',
      });
    },
  );

  it.each(['0', '1-11', '12'])(
    'rejects pages outside the document: %s',
    (value) => {
      expect(parsePageRanges(value, 10)).toEqual({
        pageNumbers: null,
        error: 'outOfRange',
      });
    },
  );
});

describe('normalizePageRanges', () => {
  it.each([
    ['1-10', 9, '1-9'],
    ['1, 2, 10', 9, '1-2'],
    ['1-3, 8-10', 9, '1-3, 8-9'],
    ['3, 1-2, 2, 5', 9, '1-3, 5'],
  ])('intersects %s with %i pages', (value, pageCount, expected) => {
    expect(normalizePageRanges(value, pageCount)).toBe(expected);
  });

  it('clears a range when none of its pages remain', () => {
    expect(normalizePageRanges('8-10', 7)).toBe('');
  });

  it.each(['', '1,', '1--3', '3-1', 'page 1', '0-2'])(
    'leaves malformed input untouched: %s',
    (value) => {
      expect(normalizePageRanges(value, 10)).toBeNull();
    },
  );
});
