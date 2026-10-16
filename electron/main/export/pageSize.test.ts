import { describe, expect, it } from 'vitest';

import { getNativePrintPageSize, getPageSize } from './pageSize';

describe('export paper dimensions', () => {
  it('keeps named paper sizes for both Electron printing APIs', () => {
    expect(getPageSize('A4', 6, 9)).toBe('A4');
    expect(
      getNativePrintPageSize({
        pageSize: 'A4',
        pageWidthInches: 6,
        pageHeightInches: 9,
      }),
    ).toBe('A4');
  });

  it('uses inches for PDF and microns for native custom paper, without rotating', () => {
    expect(getPageSize('Custom', 6, 9)).toEqual({ width: 6, height: 9 });
    expect(
      getNativePrintPageSize({
        pageSize: 'Custom',
        pageWidthInches: 6,
        pageHeightInches: 9,
      }),
    ).toEqual({ width: 152400, height: 228600 });
  });

  it.each([
    ['Half-Letter', 5.5],
    ['Half-Legal', 7],
  ] as const)(
    'converts %s dimensions for native printing',
    (pageSize, width) => {
      expect(getPageSize(pageSize, 6, 9)).toEqual({ width, height: 8.5 });
      expect(
        getNativePrintPageSize({
          pageSize,
          pageWidthInches: 6,
          pageHeightInches: 9,
        }),
      ).toEqual({ width: width * 25400, height: 215900 });
    },
  );
});
