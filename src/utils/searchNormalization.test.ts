import { describe, expect, it } from 'vitest';

import { normalizeSearchRun, normalizeSearchText } from './searchNormalization';

describe('search normalization', () => {
  it('keeps accents while folding case and sigma, with explicit case-sensitive and lyric modes', () => {
    const source = 'Α\u0313\u0301\tΛΟـΓΟΣ  ς';
    expect(normalizeSearchText(source)).toBe('ἄ λογοσ σ');
    expect(normalizeSearchText(source, { caseSensitive: true })).toBe(
      'Ἄ ΛΟΓΟΣ ς',
    );
    expect(normalizeSearchText(source, { lyrics: true })).toBe('ἄλογοσσ');
    expect(
      normalizeSearchText(source, { caseSensitive: true, lyrics: true }),
    ).toBe('ἌΛΟΓΟΣς');
  });

  it('maps a composed lyric grapheme to every contributing part and retains caller metadata', () => {
    const parts = [
      { text: 'Α', field: 'content', index: 3 },
      { text: '\u0313\u0301', field: 'lyrics', index: 4 },
      { text: 'ξιον', field: 'lyrics', index: 6 },
    ];
    const { text, ranges } = normalizeSearchRun(parts, { lyrics: true });
    expect(text).toBe('ἄξιον');
    expect(ranges.map(({ start, end }) => [start, end])).toEqual([
      [0, 1],
      [0, 1],
      [1, 5],
    ]);
    ranges.forEach((range, index) => expect(range.part).toBe(parts[index]));
  });

  it('maps UTF-16 offsets after case expansion and supplementary characters', () => {
    const parts = [{ text: 'İ' }, { text: '😀' }, { text: 'Σ' }];
    const folded = normalizeSearchRun(parts);
    expect(folded.text).toBe('i\u0307😀σ');
    expect(folded.ranges.map(({ start, end }) => [start, end])).toEqual([
      [0, 2],
      [2, 4],
      [4, 5],
    ]);
    const sensitive = normalizeSearchRun(parts, { caseSensitive: true });
    expect(sensitive.text).toBe('İ😀Σ');
    expect(sensitive.ranges.map(({ start, end }) => [start, end])).toEqual([
      [0, 1],
      [1, 3],
      [3, 4],
    ]);
  });
});
