import { describe, expect, it } from 'vitest';

import {
  applyNumericKey,
  composeExplicitFontVariant,
  composeLigatureVariant,
  composeNumericVariant,
  fontVariantCssDeclarations,
  normalizeLigatureStyle,
  normalizeNumericStyle,
  parseFontVariantCaps,
  parseLigatureVariant,
  parseNumericVariant,
  toNumericKey,
} from './fontVariants';

describe('fontVariants', () => {
  it('round-trips numeric values in canonical token order', () => {
    expect(normalizeNumericStyle('tabular-nums lining-nums')).toBe(
      'lining-nums tabular-nums',
    );
    expect(normalizeNumericStyle('slashed-zero')).toBe('slashed-zero');
    expect(normalizeNumericStyle('unrecognized')).toBeNull();
    expect(
      composeNumericVariant(parseNumericVariant('oldstyle-nums ordinal')),
    ).toBe('oldstyle-nums ordinal');
  });

  it('owns explicit normal for all three properties', () => {
    expect(normalizeNumericStyle('normal')).toBe('normal');
    expect(normalizeNumericStyle(' Normal ')).toBe('normal');
    expect(normalizeLigatureStyle('normal')).toBe('normal');
    expect(parseFontVariantCaps('normal')).toBe('normal');
    expect(parseFontVariantCaps('small-caps')).toBe('small-caps');
    expect(parseFontVariantCaps('unrecognized')).toBeNull();
  });

  it('parses normal to the default feature set', () => {
    expect(parseNumericVariant('normal')).toEqual({
      figure: null,
      spacing: null,
      fractions: null,
      ordinal: false,
      slashedZero: false,
    });
    expect(parseLigatureVariant('normal')).toEqual({
      common: true,
      discretionary: false,
      historical: false,
      contextual: true,
    });
  });

  it('round-trips the figure/spacing button key against the variant', () => {
    expect(
      toNumericKey(parseNumericVariant('oldstyle-nums tabular-nums')),
    ).toBe('oldstyle-tabular');
    expect(toNumericKey(parseNumericVariant('tabular-nums'))).toBeUndefined();

    // Selecting a key sets both axes and preserves the flags; deselecting
    // clears both axes and still preserves the flags.
    const selected = applyNumericKey(
      parseNumericVariant('slashed-zero'),
      'lining-proportional',
    );
    expect(composeNumericVariant(selected)).toBe(
      'lining-nums proportional-nums slashed-zero',
    );
    expect(composeNumericVariant(applyNumericKey(selected, undefined))).toBe(
      'slashed-zero',
    );
  });

  it('maps ligature none to every switch off', () => {
    expect(composeLigatureVariant(parseLigatureVariant('none'))).toBe(
      'no-common-ligatures no-contextual',
    );
    expect(normalizeLigatureStyle('discretionary-ligatures')).toBe(
      'discretionary-ligatures',
    );
  });

  it('emits the longhand declarations in canonical order, folding null to normal', () => {
    expect(
      fontVariantCssDeclarations({
        fontVariantCaps: 'small-caps',
        fontVariantNumeric: null,
        fontVariantLigatures: 'no-common-ligatures',
      }),
    ).toEqual([
      'font-variant-caps: small-caps;',
      'font-variant-numeric: normal;',
      'font-variant-ligatures: no-common-ligatures;',
    ]);
  });

  it('writes explicit normal only to defeat a non-normal inherited value', () => {
    expect(composeExplicitFontVariant('small-caps', null)).toBe('small-caps');
    expect(composeExplicitFontVariant('', null)).toBeNull();
    expect(composeExplicitFontVariant('', 'normal')).toBeNull();
    expect(composeExplicitFontVariant('', 'small-caps')).toBe('normal');
    expect(composeExplicitFontVariant('normal', 'small-caps')).toBe('normal');
    expect(composeExplicitFontVariant('normal', null)).toBeNull();
  });
});
