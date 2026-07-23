import { describe, expect, it } from 'vitest';

import {
  applyNumericKey,
  composeAlternatesVariant,
  composeExplicitFontVariant,
  composeLigatureVariant,
  composeNumericVariant,
  fontFeatureValuesCss,
  fontVariantCssDeclarations,
  normalizeAlternatesStyle,
  normalizeLigatureStyle,
  normalizeNumericStyle,
  parseAlternatesVariant,
  parseFontVariantCaps,
  parseLigatureVariant,
  parseNumericVariant,
  toNumericKey,
} from './fontVariants';

// The round trip every alternates control performs: parse the effective
// value into its axes and recompose them, dropping whatever the app does
// not own ('' when nothing owned is left).
function canonicalizeAlternates(style: string) {
  return composeAlternatesVariant(parseAlternatesVariant(style));
}

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

  it('parses numeric and ligature identifiers with CSS syntax', () => {
    expect(normalizeNumericStyle('oldstyle-nums/**/tabular-nums')).toBe(
      'oldstyle-nums tabular-nums',
    );
    expect(normalizeNumericStyle('oldstyle-\\6e ums')).toBe('oldstyle-nums');
    expect(
      normalizeLigatureStyle('discretionary-\\6c igatures/**/no-contextual'),
    ).toBe('discretionary-ligatures no-contextual');
  });

  it('does not promote numeric or ligature values nested in functions', () => {
    expect(normalizeNumericStyle('var(--numeric, ordinal )')).toBeNull();
    expect(normalizeLigatureStyle('var(--ligatures, none )')).toBeNull();
    expect(normalizeNumericStyle('var(--numeric, ordinal ) slashed-zero')).toBe(
      'slashed-zero',
    );
  });

  it('owns explicit normal for all four properties', () => {
    expect(normalizeNumericStyle('normal')).toBe('normal');
    expect(normalizeNumericStyle(' Normal ')).toBe('normal');
    expect(normalizeLigatureStyle('normal')).toBe('normal');
    expect(normalizeLigatureStyle('/**/n\\6f rmal')).toBe('normal');
    expect(parseFontVariantCaps('normal')).toBe('normal');
    expect(parseFontVariantCaps('/**/normal/**/')).toBe('normal');
    expect(parseFontVariantCaps('small-caps')).toBe('small-caps');
    expect(parseFontVariantCaps('small-\\63 aps')).toBe('small-caps');
    expect(parseFontVariantCaps('unrecognized')).toBeNull();
    expect(parseFontVariantCaps('var(--caps, small-caps)')).toBeNull();
    expect(normalizeAlternatesStyle('normal')).toBe('normal');
    expect(normalizeAlternatesStyle('n\\6f rmal')).toBe('normal');
  });

  it('canonicalizes owned alternates values and drops unsupported values', () => {
    expect(normalizeAlternatesStyle('')).toBeNull();
    expect(normalizeAlternatesStyle('Swash(flowing)')).toBeNull();
    expect(
      normalizeAlternatesStyle(
        'styleset(ss06, flowing, ss01) historical-forms annotation(circled)',
      ),
    ).toBe('historical-forms styleset(ss01, ss06)');
    expect(normalizeAlternatesStyle(' Normal ')).toBe('normal');
    expect(normalizeAlternatesStyle('INITIAL')).toBeNull();
    expect(normalizeAlternatesStyle('/**/\\69 nitial/**/')).toBeNull();
    expect(normalizeAlternatesStyle('inherit')).toBeNull();
    expect(normalizeAlternatesStyle('in\\68 erit')).toBeNull();
    expect(normalizeAlternatesStyle(' UnSeT ')).toBeNull();
    expect(normalizeAlternatesStyle('ReVeRt')).toBeNull();
    expect(normalizeAlternatesStyle('revert-layer')).toBeNull();
    expect(
      normalizeAlternatesStyle(
        'annotation(annotation-3) historical-forms swash(swash-2)',
      ),
    ).toBe('historical-forms swash(swash-2) annotation(annotation-3)');
  });

  it('owns historical-forms and tag-ident styleset alternates values', () => {
    expect(canonicalizeAlternates('historical-forms')).toBe('historical-forms');
    expect(canonicalizeAlternates(' Historical-Forms ')).toBe(
      'historical-forms',
    );
    expect(canonicalizeAlternates('styleset(ss01)')).toBe('styleset(ss01)');
    // Canonical order: historical-forms first, sets ascending and deduped.
    expect(
      canonicalizeAlternates('styleset(ss06,SS01, ss06) historical-forms'),
    ).toBe('historical-forms styleset(ss01, ss06)');
    // A repeated notation merges its tags; a repeated keyword is idempotent.
    expect(canonicalizeAlternates('styleset(ss01) styleset(ss02)')).toBe(
      'styleset(ss01, ss02)',
    );
    expect(canonicalizeAlternates('historical-forms historical-forms')).toBe(
      'historical-forms',
    );
    // A value with no owned feature left is not ours.
    expect(canonicalizeAlternates('styleset(flowing)')).toBe('');
    expect(canonicalizeAlternates('styleset(ss21)')).toBe('');
    expect(canonicalizeAlternates('styleset()')).toBe('');
  });

  it('owns cv-tag character-variant alternates values', () => {
    expect(canonicalizeAlternates('character-variant(cv01)')).toBe(
      'character-variant(cv01)',
    );
    // Canonical order per the CSS grammar, variants ascending and deduped.
    expect(
      canonicalizeAlternates(
        'character-variant(cv27,CV03, cv27) historical-forms',
      ),
    ).toBe('historical-forms character-variant(cv03, cv27)');
    expect(
      canonicalizeAlternates('character-variant(cv99) styleset(ss01)'),
    ).toBe('styleset(ss01) character-variant(cv99)');
    expect(
      canonicalizeAlternates('character-variant(cv01) character-variant(cv02)'),
    ).toBe('character-variant(cv01, cv02)');
    // Non-tag, out-of-range, and unpadded idents are dropped.
    expect(canonicalizeAlternates('character-variant(flowing)')).toBe('');
    expect(canonicalizeAlternates('character-variant(cv00)')).toBe('');
    expect(canonicalizeAlternates('character-variant(cv100)')).toBe('');
    expect(canonicalizeAlternates('character-variant(cv1)')).toBe('');
    expect(canonicalizeAlternates('character-variant()')).toBe('');
  });

  it('owns stylistic-ident stylistic alternates values', () => {
    expect(canonicalizeAlternates('stylistic(stylistic-1)')).toBe(
      'stylistic(stylistic-1)',
    );
    // Canonical order: stylistic() leads per the CSS grammar.
    expect(
      canonicalizeAlternates('historical-forms STYLISTIC(stylistic-2)'),
    ).toBe('stylistic(stylistic-2) historical-forms');
    expect(
      canonicalizeAlternates('swash(swash-1) stylistic(stylistic-3)'),
    ).toBe('stylistic(stylistic-3) swash(swash-1)');
    // A repeated single-alternate notation keeps the last alternate.
    expect(
      canonicalizeAlternates('stylistic(stylistic-1) stylistic(stylistic-2)'),
    ).toBe('stylistic(stylistic-2)');
    // Non-owned idents, out-of-range indices, and multi-ident lists are
    // dropped (the notation takes a single ident per the grammar).
    expect(canonicalizeAlternates('stylistic(fancy)')).toBe('');
    expect(canonicalizeAlternates('stylistic(stylistic-0)')).toBe('');
    expect(canonicalizeAlternates('stylistic(stylistic-99)')).toBe(
      'stylistic(stylistic-99)',
    );
    expect(canonicalizeAlternates('stylistic(stylistic-100)')).toBe('');
    expect(canonicalizeAlternates('stylistic()')).toBe('');
    expect(canonicalizeAlternates('stylistic(stylistic-1, stylistic-2)')).toBe(
      '',
    );
  });

  it('owns swash-ident swash alternates values', () => {
    expect(canonicalizeAlternates('swash(swash-1)')).toBe('swash(swash-1)');
    // Canonical order: historical-forms, styleset(), swash().
    expect(canonicalizeAlternates('swash(SWASH-2) historical-forms')).toBe(
      'historical-forms swash(swash-2)',
    );
    expect(canonicalizeAlternates('swash(swash-3) styleset(ss01)')).toBe(
      'styleset(ss01) swash(swash-3)',
    );
    expect(canonicalizeAlternates('swash(swash-1) swash(swash-2)')).toBe(
      'swash(swash-2)',
    );
    expect(canonicalizeAlternates('swash(flowing)')).toBe('');
    expect(canonicalizeAlternates('swash(swash-0)')).toBe('');
    expect(canonicalizeAlternates('swash(swash-99)')).toBe('swash(swash-99)');
    expect(canonicalizeAlternates('swash(swash-100)')).toBe('');
    expect(canonicalizeAlternates('swash()')).toBe('');
    expect(canonicalizeAlternates('swash(swash-1, swash-2)')).toBe('');
  });

  it('owns ornaments-ident and annotation-ident alternates values', () => {
    expect(canonicalizeAlternates('ornaments(ornaments-1)')).toBe(
      'ornaments(ornaments-1)',
    );
    expect(canonicalizeAlternates('annotation(ANNOTATION-4)')).toBe(
      'annotation(annotation-4)',
    );
    // Canonical order: ornaments() and annotation() close the value.
    expect(
      canonicalizeAlternates(
        'annotation(annotation-1) ornaments(ornaments-2) swash(swash-3)',
      ),
    ).toBe('swash(swash-3) ornaments(ornaments-2) annotation(annotation-1)');
    expect(canonicalizeAlternates('ornaments(fleurons)')).toBe('');
    expect(canonicalizeAlternates('annotation(circled)')).toBe('');
    expect(canonicalizeAlternates('ornaments(ornaments-99)')).toBe(
      'ornaments(ornaments-99)',
    );
    expect(canonicalizeAlternates('ornaments(ornaments-100)')).toBe('');
    expect(canonicalizeAlternates('annotation()')).toBe('');
  });

  it('drops unowned tokens and keeps the owned remainder', () => {
    // Unknown keywords, unknown functional notations, and idents outside the
    // owned ranges are dropped, like unknown numeric/ligature tokens.
    expect(canonicalizeAlternates('ornaments(fleurons) historical-forms')).toBe(
      'historical-forms',
    );
    expect(canonicalizeAlternates('styleset(ss01, flowing) fancy')).toBe(
      'styleset(ss01)',
    );
    expect(canonicalizeAlternates('character-variant(cv1, cv03)')).toBe(
      'character-variant(cv03)',
    );
    expect(canonicalizeAlternates('swash(x) styleset(ss01)')).toBe(
      'styleset(ss01)',
    );
    expect(canonicalizeAlternates('fancy(a, b) whatever')).toBe('');
  });

  it('does not promote values nested inside unowned functions', () => {
    expect(canonicalizeAlternates('var(--alternates, styleset(ss01))')).toBe(
      '',
    );
    expect(
      canonicalizeAlternates(
        'var(--alternates, styleset(ss01)) historical-forms',
      ),
    ).toBe('historical-forms');
  });

  it('parses comments and CSS escapes without weakening argument grammar', () => {
    expect(canonicalizeAlternates('styleset(ss01/**/, ss02)')).toBe(
      'styleset(ss01, ss02)',
    );
    expect(canonicalizeAlternates('styleset(s\\73 01)')).toBe('styleset(ss01)');
    expect(canonicalizeAlternates('styleset(ss01 ss02)')).toBe('');
  });

  it('recomposes alternates axes while preserving unmanaged sets', () => {
    const variant = parseAlternatesVariant(
      'stylistic(stylistic-4) historical-forms styleset(ss05) character-variant(cv07) swash(swash-2) ornaments(ornaments-9) annotation(annotation-11)',
    );

    expect(variant).toEqual({
      historicalForms: true,
      stylisticSets: [5],
      characterVariants: [7],
      stylistic: 4,
      swash: 2,
      ornaments: 9,
      annotation: 11,
    });

    expect(
      composeAlternatesVariant({
        ...variant,
        stylisticSets: [...variant.stylisticSets, 1],
      }),
    ).toBe(
      'stylistic(stylistic-4) historical-forms styleset(ss01, ss05) character-variant(cv07) swash(swash-2) ornaments(ornaments-9) annotation(annotation-11)',
    );
    expect(
      composeAlternatesVariant({
        ...variant,
        stylistic: null,
        swash: null,
        ornaments: null,
        annotation: null,
      }),
    ).toBe('historical-forms styleset(ss05) character-variant(cv07)');
    expect(
      composeAlternatesVariant({
        historicalForms: false,
        stylisticSets: [],
        characterVariants: [],
        stylistic: null,
        swash: null,
        ornaments: null,
        annotation: null,
      }),
    ).toBe('');
  });

  it('emits the alternates ident mappings for the given families', () => {
    expect(fontFeatureValuesCss([])).toBe('');

    const css = fontFeatureValuesCss(['Old Standard', 'My "Quoted" Font']);

    expect(css).toContain(
      '@font-feature-values "Old Standard", "My \\"Quoted\\" Font"',
    );
    expect(css).toContain('@stylistic { stylistic-1: 1;');
    expect(css).toContain('stylistic-99: 99; }');
    expect(css).toContain('@styleset { ss01: 1;');
    expect(css).toContain('ss20: 20; }');
    expect(css).toContain('@character-variant { cv01: 1;');
    expect(css).toContain('cv99: 99; }');
    expect(css).toContain('@swash { swash-1: 1;');
    expect(css).toContain('@ornaments { ornaments-1: 1;');
    expect(css).toContain('@annotation { annotation-1: 1;');
    expect(css).toContain('annotation-99: 99; } }');
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
        fontVariantAlternates: 'historical-forms',
      }),
    ).toEqual([
      'font-variant-caps: small-caps;',
      'font-variant-numeric: normal;',
      'font-variant-ligatures: no-common-ligatures;',
      'font-variant-alternates: historical-forms;',
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
