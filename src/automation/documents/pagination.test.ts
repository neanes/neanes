import { describe, expect, it } from 'vitest';

import { elementPageEntrySize } from '../contracts/responseBudget';
import { collectPage } from './pagination';

describe('budgeted pagination', () => {
  it('skips projection outside the requested page and stops after lookahead', () => {
    function* candidates() {
      yield 0;
      yield 1;
      yield 2;
      throw new Error('Read past the lookahead candidate.');
    }
    expect(
      collectPage(candidates(), { offset: 1, limit: 1 }, (value) => {
        if (value !== 1) {
          throw new Error('Projected an entry outside the requested page.');
        }
        return value * 10;
      }),
    ).toEqual({ offset: 1, nextOffset: 2, values: [10] });
  });

  it('distinguishes the exact end from an invalid offset, including empty input', () => {
    for (const values of [[], [1, 2]]) {
      expect(
        collectPage(
          values,
          { offset: values.length, limit: 1 },
          (value) => value,
        ),
      ).toEqual({ offset: values.length, nextOffset: null, values: [] });
      expect(() =>
        collectPage(
          values,
          { offset: values.length + 1, limit: 1 },
          (value) => value,
        ),
      ).toThrow('INVALID_ELEMENT_RANGE');
    }
  });

  it('resumes at an excluded oversized entry and preserves the element error policy', () => {
    const entries = [
      { elementRef: 'small' },
      { elementRef: 'large', content: 'x'.repeat(24_000) },
    ];
    expect(
      collectPage(
        entries,
        { offset: 0, limit: 10 },
        (value) => value,
        elementPageEntrySize,
      ),
    ).toEqual({ offset: 0, nextOffset: 1, values: [entries[0]] });
    expect(() =>
      collectPage(
        entries,
        { offset: 1, limit: 10 },
        (value) => value,
        elementPageEntrySize,
      ),
    ).toThrow('One element exceeds the page budget.');
    expect(
      collectPage(entries, { offset: 1, limit: 10 }, (value) => value),
    ).toEqual({ offset: 1, nextOffset: 1, values: [] });
  });
});
