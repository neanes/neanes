import { describe, expect, it } from 'vitest';

import {
  areStyleDisplayNamesValid,
  getNextAvailableStyleName,
} from '@/utils/styleNames';

describe('style names', () => {
  it('requires non-empty names that remain unique after trimming', () => {
    expect(areStyleDisplayNamesValid(['First', 'Second'])).toBe(true);
    expect(areStyleDisplayNamesValid(['First', ' First '])).toBe(false);
    expect(areStyleDisplayNamesValid(['First', '   '])).toBe(false);
  });

  it('compares names case-sensitively', () => {
    expect(areStyleDisplayNamesValid(['Style', 'style'])).toBe(true);
  });

  it('uses the first available numbered name', () => {
    expect(
      getNextAvailableStyleName('Style Copy', [
        'Style Copy',
        'Style Copy 2',
        'Style Copy 4',
      ]),
    ).toBe('Style Copy 3');
  });
});
