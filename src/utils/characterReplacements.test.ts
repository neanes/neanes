import { describe, expect, it } from 'vitest';

import { findCharacterReplacement } from './characterReplacements';

describe('findCharacterReplacement', () => {
  const replacements = [
    { from: "'", to: '’' },
    { from: '"', to: '”' },
  ];

  it('returns the replacement for a mapped character', () => {
    expect(findCharacterReplacement(replacements, "'")).toBe('’');
    expect(findCharacterReplacement(replacements, '"')).toBe('”');
  });

  it('returns undefined for an unmapped character', () => {
    expect(findCharacterReplacement(replacements, 'a')).toBeUndefined();
  });

  it('returns undefined when the map is empty', () => {
    expect(findCharacterReplacement([], "'")).toBeUndefined();
  });

  it('ignores entries with an empty typed character', () => {
    expect(findCharacterReplacement([{ from: '', to: 'x' }], '')).toBe(
      undefined,
    );
  });

  it('ignores entries with an empty inserted character', () => {
    expect(findCharacterReplacement([{ from: "'", to: '' }], "'")).toBe(
      undefined,
    );
  });

  it('uses the first matching entry', () => {
    expect(
      findCharacterReplacement(
        [
          { from: "'", to: '’' },
          { from: "'", to: 'ʼ' },
        ],
        "'",
      ),
    ).toBe('’');
  });
});
