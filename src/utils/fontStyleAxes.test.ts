import { describe, expect, it } from 'vitest';

import {
  applyAxes,
  compareFontStyles,
  cssFontWeight,
  fontStyleNeedsExplicitFamily,
  hasNonWeightStyleToken,
  isRegularStyle,
  matchStyle,
  normalizeDocumentFontStyle,
  parseStyleAxes,
  resolveAxisToggle,
} from './fontStyleAxes';

describe('parseStyleAxes', () => {
  it('treats Regular and empty input as no axes', () => {
    expect(parseStyleAxes('Regular')).toEqual({
      bold: false,
      italic: false,
      rest: [],
    });
    expect(parseStyleAxes('')).toEqual({
      bold: false,
      italic: false,
      rest: [],
    });
    expect(parseStyleAxes(undefined)).toEqual({
      bold: false,
      italic: false,
      rest: [],
    });
  });

  it('detects the bold and italic axes', () => {
    expect(parseStyleAxes('Bold')).toMatchObject({ bold: true, italic: false });
    expect(parseStyleAxes('Italic')).toMatchObject({
      bold: false,
      italic: true,
    });
    expect(parseStyleAxes('Bold Italic')).toMatchObject({
      bold: true,
      italic: true,
      rest: [],
    });
    expect(parseStyleAxes('Oblique')).toMatchObject({ italic: true });
  });

  it('keeps non-axis weights and optical sizes in rest', () => {
    expect(parseStyleAxes('Semibold')).toEqual({
      bold: false,
      italic: false,
      rest: ['Semibold'],
    });
    expect(parseStyleAxes('Semibold Italic')).toEqual({
      bold: false,
      italic: true,
      rest: ['Semibold'],
    });
    expect(parseStyleAxes('Bold Italic Caption')).toEqual({
      bold: true,
      italic: true,
      rest: ['Caption'],
    });
    expect(parseStyleAxes('Light Display')).toEqual({
      bold: false,
      italic: false,
      rest: ['Light', 'Display'],
    });
  });

  it('does not treat a compound weight as the bold axis', () => {
    expect(parseStyleAxes('Extra Bold')).toEqual({
      bold: false,
      italic: false,
      rest: ['Extra Bold'],
    });
    expect(parseStyleAxes('Semi Bold Italic')).toEqual({
      bold: false,
      italic: true,
      rest: ['Semi Bold'],
    });
    expect(parseStyleAxes('Extra Light Italic')).toEqual({
      bold: false,
      italic: true,
      rest: ['Extra Light'],
    });
  });
});

describe('isRegularStyle', () => {
  it('is true only for the default face', () => {
    expect(isRegularStyle('Regular')).toBe(true);
    expect(isRegularStyle('')).toBe(true);
    expect(isRegularStyle(undefined)).toBe(true);
    expect(isRegularStyle('Bold')).toBe(false);
    expect(isRegularStyle('Semibold')).toBe(false);
  });
});

describe('resolveAxisToggle', () => {
  const basic = ['Regular', 'Bold', 'Italic', 'Bold Italic'];

  it('toggles the bold axis to an existing face', () => {
    expect(resolveAxisToggle('Regular', 'bold', basic)).toBe('Bold');
    expect(resolveAxisToggle('Bold', 'bold', basic)).toBe('Regular');
    expect(resolveAxisToggle('Italic', 'bold', basic)).toBe('Bold Italic');
  });

  it('replaces a named weight when toggling bold on', () => {
    expect(
      resolveAxisToggle('Semibold', 'bold', ['Regular', 'Semibold', 'Bold']),
    ).toBe('Bold');
    expect(
      resolveAxisToggle('Semibold Italic', 'bold', [
        'Regular',
        'Semibold Italic',
        'Bold Italic',
      ]),
    ).toBe('Bold Italic');
  });

  it('toggles the italic axis preserving other axes', () => {
    const arno = ['Semibold', 'Semibold Italic', 'Regular'];
    expect(resolveAxisToggle('Semibold', 'italic', arno)).toBe(
      'Semibold Italic',
    );

    const caption = ['Italic Caption', 'Bold Italic Caption', 'Caption'];
    expect(resolveAxisToggle('Bold Italic Caption', 'bold', caption)).toBe(
      'Italic Caption',
    );
  });

  it('matches order-insensitively', () => {
    expect(resolveAxisToggle('Italic', 'bold', ['Italic Bold'])).toBe(
      'Italic Bold',
    );
  });

  it('returns null when the toggled face does not exist', () => {
    expect(
      resolveAxisToggle('Semibold Italic', 'bold', [
        'Semibold Italic',
        'Bold',
        'Regular',
      ]),
    ).toBeNull();
  });
});

describe('matchStyle', () => {
  it('matches equivalent compact and spaced weight names', () => {
    expect(matchStyle('Extra Light', ['Regular', 'ExtraLight'])).toBe(
      'ExtraLight',
    );
    expect(matchStyle('Caption Extra Light', ['Caption ExtraLight'])).toBe(
      'Caption ExtraLight',
    );
  });
});

describe('applyAxes', () => {
  it('sets an axis and resolves to an existing face', () => {
    expect(applyAxes('Regular', { bold: true }, ['Regular', 'Bold'])).toBe(
      'Bold',
    );
    expect(applyAxes('Bold', { italic: true }, ['Bold', 'Bold Italic'])).toBe(
      'Bold Italic',
    );
  });

  it('leaves unspecified axes untouched', () => {
    expect(applyAxes('Italic', { bold: true }, ['Italic', 'Bold Italic'])).toBe(
      'Bold Italic',
    );
  });

  it('does not combine the bold axis with a named weight', () => {
    // Regression: a legacy bold marker/boolean folded onto a base that already
    // carries a named weight must not emit an impossible "Semibold Bold" (which
    // would silently collapse the weight to 700); the named weight wins.
    expect(applyAxes('Semibold', { bold: true }, ['Regular', 'Semibold'])).toBe(
      'Semibold',
    );
    expect(
      applyAxes('Caption Semibold', { bold: true }, ['Caption Semibold']),
    ).toBe('Caption Semibold');
    // An optical-only base has no competing weight, so bold still applies.
    expect(
      applyAxes('Caption', { bold: true }, ['Caption', 'Caption Bold']),
    ).toBe('Caption Bold');
  });

  it('falls back to the built name when the family lacks the face', () => {
    expect(applyAxes('Regular', { bold: true }, ['Regular'])).toBe('Bold');
  });
});

describe('normalizeDocumentFontStyle', () => {
  it('canonicalizes lowercase CSS keywords before they become document state', () => {
    expect(normalizeDocumentFontStyle('normal')).toBe('Regular');
    expect(normalizeDocumentFontStyle('regular')).toBe('Regular');
    expect(normalizeDocumentFontStyle('italic')).toBe('Italic');
    expect(normalizeDocumentFontStyle('oblique')).toBe('Oblique');
    expect(normalizeDocumentFontStyle('bold italic')).toBe('Bold Italic');
  });
});

describe('cssFontWeight', () => {
  it('maps named weights and omits the normal weight', () => {
    expect(cssFontWeight('Regular')).toBeUndefined();
    expect(cssFontWeight('Italic')).toBeUndefined();
    expect(cssFontWeight('Extra Light')).toBe('200');
    expect(cssFontWeight('ExtraLight')).toBe('200');
    expect(cssFontWeight('Light')).toBe('300');
    expect(cssFontWeight('Semibold')).toBe('600');
    expect(cssFontWeight('Bold')).toBe('700');
    expect(cssFontWeight('Bold Italic')).toBe('700');
  });
});

describe('hasNonWeightStyleToken', () => {
  it('is false for styles representable with weight and slant CSS', () => {
    expect(hasNonWeightStyleToken('Semibold')).toBe(false);
    expect(hasNonWeightStyleToken('Light Italic')).toBe(false);
    expect(hasNonWeightStyleToken('Extra Bold')).toBe(false);
  });

  it('is true for optical or width styles needing an exact face', () => {
    expect(hasNonWeightStyleToken('Caption')).toBe(true);
    expect(hasNonWeightStyleToken('Bold Italic Display')).toBe(true);
    expect(hasNonWeightStyleToken('Condensed')).toBe(true);
  });
});

describe('fontStyleNeedsExplicitFamily', () => {
  it('is true for styles that cannot safely inherit an arbitrary family', () => {
    expect(fontStyleNeedsExplicitFamily('Regular')).toBe(false);
    expect(fontStyleNeedsExplicitFamily('Bold Italic')).toBe(false);
    expect(fontStyleNeedsExplicitFamily('Semibold')).toBe(true);
    expect(fontStyleNeedsExplicitFamily('Caption')).toBe(true);
  });
});

describe('compareFontStyles', () => {
  it('orders Regular first, then the weight ladder, then italics', () => {
    const styles = [
      'Bold',
      'Regular',
      'Italic',
      'Bold Italic',
      'Semibold',
      'Light',
    ];
    expect([...styles].sort(compareFontStyles)).toEqual([
      'Regular',
      'Light',
      'Italic',
      'Semibold',
      'Bold',
      'Bold Italic',
    ]);
  });
});
