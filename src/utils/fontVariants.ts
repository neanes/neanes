import type { ComponentValue } from '@csstools/css-parser-algorithms';
import { isFunctionNode } from '@csstools/css-parser-algorithms';

import {
  cssIdentifier,
  parseCssComponentValues,
  singleCssIdentifier,
  singleCssIdentifierOf,
  splitCssComponentValuesOnComma,
  topLevelCssIdentifiers,
} from './cssValues';
import { escapeFontName } from './fontFamily';

// Pure helpers for the OpenType font-variant model shared by the CKEditor
// OpenType plugin, the paragraph-style model, the properties panes, layout,
// and export. Free of CKEditor imports on purpose.
//
// Everywhere in the app a font-variant field maps to one CSS
// font-variant-* longhand and stores that property's canonical owned value.

// The four font-variant property names. Each name is simultaneously the
// CKEditor command/attribute name, the ParagraphStyleOverrides key, the
// TextBoxElement field, and the save-format field, so this one vocabulary is
// shared by every layer (e.g. the properties pane drives CKEditor via
// execForOwner(owner, FONT_VARIANT_NUMERIC, ...)).
export const FONT_VARIANT_NUMERIC = 'fontVariantNumeric';
export const FONT_VARIANT_LIGATURES = 'fontVariantLigatures';
export const FONT_VARIANT_CAPS = 'fontVariantCaps';
export const FONT_VARIANT_ALTERNATES = 'fontVariantAlternates';

export type FontVariantProperty =
  | typeof FONT_VARIANT_CAPS
  | typeof FONT_VARIANT_NUMERIC
  | typeof FONT_VARIANT_LIGATURES
  | typeof FONT_VARIANT_ALTERNATES;

// Canonical enumeration (in CSS emission order) and the CSS longhand each
// property renders to.
export const FONT_VARIANT_PROPERTIES: readonly FontVariantProperty[] = [
  FONT_VARIANT_CAPS,
  FONT_VARIANT_NUMERIC,
  FONT_VARIANT_LIGATURES,
  FONT_VARIANT_ALTERNATES,
];

export const FONT_VARIANT_CSS_NAMES: Record<FontVariantProperty, string> = {
  [FONT_VARIANT_CAPS]: 'font-variant-caps',
  [FONT_VARIANT_NUMERIC]: 'font-variant-numeric',
  [FONT_VARIANT_LIGATURES]: 'font-variant-ligatures',
  [FONT_VARIANT_ALTERNATES]: 'font-variant-alternates',
};

// The explicit "no features" value, owned for all four properties so a run
// (or element) can defeat a non-normal paragraph-style value. A stored/model
// value of 'normal' is an explicit override; an absent value inherits.
const FONT_VARIANT_NORMAL = 'normal';

export function isFontVariantNormal(value: string) {
  return singleCssIdentifier(value)?.toLowerCase() === FONT_VARIANT_NORMAL;
}

// Decide what a recomposed control value writes back as an explicit override.
// An empty (or normal) composition needs an explicit 'normal' only to defeat
// a non-normal inherited value; otherwise it returns null so the caller can
// clear the override back to inheritance.
export function composeExplicitFontVariant(
  composed: string,
  inheritedValue: string | null,
): string | null {
  if (composed !== '' && !isFontVariantNormal(composed)) {
    return composed;
  }

  return inheritedValue != null && !isFontVariantNormal(inheritedValue)
    ? FONT_VARIANT_NORMAL
    : null;
}

// Emit the four font-variant longhand declarations, in canonical order, for a
// resolved style. A null (or absent) value folds to an explicit 'normal' so
// the emitted rule defeats any inherited value.
export function fontVariantCssDeclarations(
  values: Partial<Record<FontVariantProperty, string | null>>,
): string[] {
  return FONT_VARIANT_PROPERTIES.map(
    (property) =>
      `${FONT_VARIANT_CSS_NAMES[property]}: ${values[property] ?? FONT_VARIANT_NORMAL};`,
  );
}

// The four figure x spacing combinations the properties pane exposes as one
// button group, in display order. Purely a presentation grouping: the data
// model stores the two axes independently (see NumericVariant) so a partial
// value is not upcast. The key types, guards, and UI option lists all derive
// from these arrays so the vocabulary has one spelling.
export const NUMERIC_KEYS = [
  'lining-tabular',
  'oldstyle-tabular',
  'oldstyle-proportional',
  'lining-proportional',
] as const;

export type NumericKey = (typeof NUMERIC_KEYS)[number];

// The caps keywords the controls offer, in display order. parseFontVariantCaps
// recognizes the wider OWNED_CAPS_VALUES set.
export const CAPS_KEYS = ['small-caps', 'all-small-caps'] as const;

export type CapsKey = (typeof CAPS_KEYS)[number];

export function isNumericKey(value: unknown): value is NumericKey {
  return NUMERIC_KEYS.includes(value as NumericKey);
}

// Split a UI button id into its two axes. Safe because neither axis value
// contains a hyphen, so the key has exactly one separator.
export function splitNumericKey(key: NumericKey): {
  figure: 'lining' | 'oldstyle';
  spacing: 'tabular' | 'proportional';
} {
  const [figure, spacing] = key.split('-') as [
    'lining' | 'oldstyle',
    'tabular' | 'proportional',
  ];

  return { figure, spacing };
}

// Inverse of splitNumericKey: the button-group key when both axes are set,
// otherwise undefined (a partially specified value shows no selection but
// still survives recompose).
export function toNumericKey(variant: NumericVariant): NumericKey | undefined {
  const { figure, spacing } = variant;

  return figure && spacing ? `${figure}-${spacing}` : undefined;
}

// Apply a button-group selection to a variant: a key sets both axes, anything
// else (the group reporting deselection) clears both. The fractions, ordinal,
// and slashed-zero flags carry over unchanged.
export function applyNumericKey(
  variant: NumericVariant,
  value: unknown,
): NumericVariant {
  return {
    ...variant,
    ...(isNumericKey(value)
      ? splitNumericKey(value)
      : { figure: null, spacing: null }),
  };
}

export function isCapsKey(value: unknown): value is CapsKey {
  return CAPS_KEYS.includes(value as CapsKey);
}

// ---------------------------------------------------------------------------
// font-variant-numeric
// ---------------------------------------------------------------------------

// The independent axes of the `font-variant-numeric` property that the UI
// composes into one declaration: the figure and spacing axes (one button group),
// the fraction axis, plus the ordinal and slashed-zero switches. figure and
// spacing are tracked separately, and each is null when absent, so a partially
// specified authored value round-trips faithfully rather than being upcast.
//
// The fraction axis has two mutually exclusive CSS values. The UI switch only
// toggles `diagonal`, but an authored `stacked` value is preserved verbatim on
// round trip (the switch shows it as on, and only an explicit toggle replaces it).
export interface NumericVariant {
  figure: 'lining' | 'oldstyle' | null;
  spacing: 'tabular' | 'proportional' | null;
  fractions: 'diagonal' | 'stacked' | null;
  ordinal: boolean;
  slashedZero: boolean;
}

// Parse a `font-variant-numeric` value into its independent axes. Token-order
// independent so styles authored elsewhere (e.g. "tabular-nums lining-nums") are
// still recognized. An absent axis stays null rather than being defaulted, so we
// never invent the missing half (e.g. "tabular-nums" does not gain "lining-nums").
export function parseNumericVariant(style: string): NumericVariant {
  const tokens = topLevelCssIdentifiers(style).map((token) =>
    token.toLowerCase(),
  );
  const hasLining = tokens.includes('lining-nums');
  const hasOldstyle = tokens.includes('oldstyle-nums');
  const hasTabular = tokens.includes('tabular-nums');
  const hasProportional = tokens.includes('proportional-nums');

  let figure: NumericVariant['figure'] = null;
  if (hasOldstyle) {
    figure = 'oldstyle';
  } else if (hasLining) {
    figure = 'lining';
  }

  let spacing: NumericVariant['spacing'] = null;
  if (hasProportional) {
    spacing = 'proportional';
  } else if (hasTabular) {
    spacing = 'tabular';
  }

  // diagonal and stacked fractions are mutually exclusive; prefer diagonal if a
  // malformed value somehow lists both.
  let fractions: NumericVariant['fractions'] = null;
  if (tokens.includes('diagonal-fractions')) {
    fractions = 'diagonal';
  } else if (tokens.includes('stacked-fractions')) {
    fractions = 'stacked';
  }

  return {
    figure,
    spacing,
    fractions,
    ordinal: tokens.includes('ordinal'),
    slashedZero: tokens.includes('slashed-zero'),
  };
}

// Compose axes back into a canonical, space-joined `font-variant-numeric` value
// ('' when nothing is set, so the caller can clear the attribute). Each axis
// emits its own token, so a lone figure or spacing survives the round trip.
export function composeNumericVariant(variant: NumericVariant): string {
  const tokens: string[] = [];

  if (variant.figure) {
    tokens.push(`${variant.figure}-nums`);
  }
  if (variant.spacing) {
    tokens.push(`${variant.spacing}-nums`);
  }
  if (variant.fractions === 'diagonal') {
    tokens.push('diagonal-fractions');
  } else if (variant.fractions === 'stacked') {
    tokens.push('stacked-fractions');
  }
  if (variant.ordinal) {
    tokens.push('ordinal');
  }
  if (variant.slashedZero) {
    tokens.push('slashed-zero');
  }

  return tokens.join(' ');
}

// Normalize an arbitrary `font-variant-numeric` value to our canonical token
// order, or null when it carries none of the tokens we manage. An explicit
// `normal` is owned (it must survive as an override that can defeat a
// paragraph-style value); a token-less non-normal value is not ours.
export function normalizeNumericStyle(style: string): string | null {
  if (isFontVariantNormal(style)) {
    return FONT_VARIANT_NORMAL;
  }

  const composed = composeNumericVariant(parseNumericVariant(style));

  return composed === '' ? null : composed;
}

// ---------------------------------------------------------------------------
// font-variant-ligatures
// ---------------------------------------------------------------------------

// The independent axes of the `font-variant-ligatures` property that the four
// ligature switches compose into one declaration. Common ligatures and
// contextual alternates are on by default (CSS `normal`), so they emit a
// negative token ("no-...") only when switched off; discretionary and
// historical ligatures default off and emit a positive token only when on.
export interface LigatureVariant {
  common: boolean;
  discretionary: boolean;
  historical: boolean;
  contextual: boolean;
}

export function parseLigatureVariant(style: string): LigatureVariant {
  const tokens = topLevelCssIdentifiers(style).map((token) =>
    token.toLowerCase(),
  );

  // `none` disables every ligature type, so it maps to all four switches off. It
  // composes back to "no-common-ligatures no-contextual" (discretionary and
  // historical are off by default), which renders identically to `none`.
  if (tokens.includes('none')) {
    return {
      common: false,
      discretionary: false,
      historical: false,
      contextual: false,
    };
  }

  return {
    common: !tokens.includes('no-common-ligatures'),
    discretionary: tokens.includes('discretionary-ligatures'),
    historical: tokens.includes('historical-ligatures'),
    contextual: !tokens.includes('no-contextual'),
  };
}

export function composeLigatureVariant(variant: LigatureVariant): string {
  const tokens: string[] = [];

  if (!variant.common) {
    tokens.push('no-common-ligatures');
  }
  if (variant.discretionary) {
    tokens.push('discretionary-ligatures');
  }
  if (variant.historical) {
    tokens.push('historical-ligatures');
  }
  if (!variant.contextual) {
    tokens.push('no-contextual');
  }

  return tokens.join(' ');
}

export function normalizeLigatureStyle(style: string): string | null {
  if (isFontVariantNormal(style)) {
    return FONT_VARIANT_NORMAL;
  }

  const composed = composeLigatureVariant(parseLigatureVariant(style));

  return composed === '' ? null : composed;
}

// ---------------------------------------------------------------------------
// font-variant-caps
// ---------------------------------------------------------------------------

// The standard non-normal `font-variant-caps` keywords the plugin owns. The UI
// exposes only small-caps and all-small-caps (see CapsKey); the rest are not
// surfaced in the controls but are still owned so they round-trip faithfully
// instead of leaking to GeneralHtmlSupport and producing a competing declaration
// on the next edit.
const OWNED_CAPS_VALUES = [
  'small-caps',
  'all-small-caps',
  'petite-caps',
  'all-petite-caps',
  'titling-caps',
  'unicase',
];

// CSS `font-variant-caps` value -> model value (identical to the CSS value), or
// null for empty or any non-standard value, which carry no feature worth
// owning. An explicit `normal` is owned like the keyword values.
export function parseFontVariantCaps(value: string): string | null {
  const normalized = singleCssIdentifier(value)?.toLowerCase();

  if (normalized === FONT_VARIANT_NORMAL) {
    return FONT_VARIANT_NORMAL;
  }

  return normalized != null && OWNED_CAPS_VALUES.includes(normalized)
    ? normalized
    : null;
}

// ---------------------------------------------------------------------------
// font-variant-alternates
// ---------------------------------------------------------------------------

// The `font-variant-alternates` vocabulary, owned outright like the numeric
// and ligature values: the plain `historical-forms` keyword (the hist
// OpenType feature), `styleset()` and `character-variant()` notations whose
// idents are raw feature tags (ss01-ss20, cv01-cv99), and the four
// single-alternate notations stylistic(), swash(), ornaments(), and
// annotation() (salt, swsh/cswh, ornm, nalt) whose ident is the notation's
// own name plus a 1-based alternate index (e.g. swash-2). These idents keep
// stored values font-independent and future proof: the app generates
// @font-feature-values rules mapping every ident to its number for every
// known family (fontFeatureValuesCss), so `styleset(ss05)` always means
// "OpenType feature ss05" and `swash(swash-2)` always means "swash
// alternate 2" no matter which font renders it or what that font calls the
// glyphs.
const HISTORICAL_FORMS = 'historical-forms';

const STYLISTIC_SET_COUNT = 20;
const CHARACTER_VARIANT_COUNT = 99;
const STYLISTIC_SET_TAG = /^ss([0-9]{2})$/;
const CHARACTER_VARIANT_TAG = /^cv([0-9]{2})$/;

function parseFeatureNumber(
  ident: string,
  pattern: RegExp,
  maximum: number,
): number | null {
  const match = pattern.exec(ident);
  const value = match ? Number(match[1]) : 0;

  return value >= 1 && value <= maximum ? value : null;
}

export function parseStylisticSetTag(ident: string): number | null {
  return parseFeatureNumber(ident, STYLISTIC_SET_TAG, STYLISTIC_SET_COUNT);
}

export function parseCharacterVariantTag(ident: string): number | null {
  return parseFeatureNumber(
    ident,
    CHARACTER_VARIANT_TAG,
    CHARACTER_VARIANT_COUNT,
  );
}

function stylisticSetTag(value: number): string {
  return `ss${String(value).padStart(2, '0')}`;
}

function characterVariantTag(value: number): string {
  return `cv${String(value).padStart(2, '0')}`;
}

// The notations that select a single numbered alternate of one OpenType
// feature: stylistic() (salt), swash() (swsh/cswh), ornaments() (ornm), and
// annotation() (nalt). OpenType puts no bound on how many alternates a glyph
// may offer, so unlike ss01-ss20 and cv01-cv99 the shared index range is the
// app's own choice. The switches only ever write the first alternate; the
// wider owned range keeps values that name a later alternate rendering and
// intact across edits.
const SINGLE_ALTERNATE_NOTATIONS = [
  'stylistic',
  'swash',
  'ornaments',
  'annotation',
] as const;

export type SingleAlternateNotation =
  (typeof SINGLE_ALTERNATE_NOTATIONS)[number];

function isSingleAlternateNotation(
  value: string,
): value is SingleAlternateNotation {
  return (SINGLE_ALTERNATE_NOTATIONS as readonly string[]).includes(value);
}

const SINGLE_ALTERNATE_COUNT = 99;

// The owned ident of a single-alternate notation is the notation's own name
// plus the 1-based alternate index (swash-1..swash-99 and so on).
function singleAlternateIdent(
  notation: SingleAlternateNotation,
  alternate: number,
): string {
  return `${notation}-${alternate}`;
}

function parseSingleAlternateIdent(
  notation: SingleAlternateNotation,
  ident: string,
): number | null {
  if (!ident.startsWith(`${notation}-`)) {
    return null;
  }

  const index = ident.slice(notation.length + 1);

  // A bare 1-based index; singleAlternateIdent emits no padding, so leading
  // zeros are not ours. The range itself is bounded below, not in the shape.
  if (!/^[1-9][0-9]*$/.test(index)) {
    return null;
  }

  const alternate = Number(index);

  return alternate <= SINGLE_ALTERNATE_COUNT ? alternate : null;
}

// The independent axes of the `font-variant-alternates` values: the
// historical-forms switch, the enabled stylistic sets and character variants
// (ascending feature numbers), and the selected alternate of each
// single-alternate notation (1-based; null when off). The recompose path
// preserves axes that the current font does not advertise, so a value
// authored with another font survives edits.
export interface AlternatesVariant {
  historicalForms: boolean;
  stylisticSets: number[];
  characterVariants: number[];
  stylistic: number | null;
  swash: number | null;
  ornaments: number | null;
  annotation: number | null;
}

// Collect the owned feature numbers of a styleset()/character-variant()
// argument list into `tags`. Each comma-separated group must be exactly one
// ident naming an owned tag; other groups are dropped.
function collectFeatureTags(
  values: ComponentValue[],
  parseTag: (ident: string) => number | null,
  tags: Set<number>,
): void {
  for (const group of splitCssComponentValuesOnComma(values)) {
    const ident = singleCssIdentifierOf(group);
    const tag = ident != null ? parseTag(ident.toLowerCase()) : null;

    if (tag != null) {
      tags.add(tag);
    }
  }
}

// Parse a `font-variant-alternates` value into its axes. Like the
// numeric/ligature parsers this is lossy: tokens the app does not own
// (unknown notations and keywords, idents outside the owned ranges) are
// dropped, and a repeated notation merges its tags or keeps its last
// alternate instead of invalidating the value.
export function parseAlternatesVariant(style: string): AlternatesVariant {
  const variant: AlternatesVariant = {
    historicalForms: false,
    stylisticSets: [],
    characterVariants: [],
    stylistic: null,
    swash: null,
    ornaments: null,
    annotation: null,
  };

  const stylisticSets = new Set<number>();
  const characterVariants = new Set<number>();

  for (const value of parseCssComponentValues(style)) {
    if (!isFunctionNode(value)) {
      // A bare identifier: only the historical-forms keyword is ours.
      variant.historicalForms ||=
        cssIdentifier(value)?.toLowerCase() === HISTORICAL_FORMS;
      continue;
    }

    const notation = value.getName().toLowerCase();

    if (notation === 'styleset') {
      collectFeatureTags(value.value, parseStylisticSetTag, stylisticSets);
    } else if (notation === 'character-variant') {
      collectFeatureTags(
        value.value,
        parseCharacterVariantTag,
        characterVariants,
      );
    } else if (isSingleAlternateNotation(notation)) {
      // These take one ident per the grammar, so a comma-separated list
      // simply fails the ident parse and is dropped.
      const ident = singleCssIdentifierOf(value.value);
      const alternate =
        ident == null
          ? null
          : parseSingleAlternateIdent(notation, ident.toLowerCase());

      if (alternate != null) {
        variant[notation] = alternate;
      }
    }
  }

  variant.stylisticSets = [...stylisticSets].sort((a, b) => a - b);
  variant.characterVariants = [...characterVariants].sort((a, b) => a - b);

  return variant;
}

// Compose axes back into a canonical `font-variant-alternates` value ('' when
// nothing is set, so the caller can clear the attribute), with the notations
// in the CSS grammar's order: stylistic(), historical-forms, styleset() and
// character-variant() with the tags in ascending order, then swash(),
// ornaments(), and annotation().
export function composeAlternatesVariant(variant: AlternatesVariant): string {
  const tokens: string[] = [];

  const singleAlternate = (notation: SingleAlternateNotation) => {
    const alternate = variant[notation];

    if (alternate != null) {
      tokens.push(`${notation}(${singleAlternateIdent(notation, alternate)})`);
    }
  };

  singleAlternate('stylistic');

  if (variant.historicalForms) {
    tokens.push(HISTORICAL_FORMS);
  }

  if (variant.stylisticSets.length > 0) {
    const tags = [...variant.stylisticSets]
      .sort((a, b) => a - b)
      .map(stylisticSetTag);

    tokens.push(`styleset(${tags.join(', ')})`);
  }

  if (variant.characterVariants.length > 0) {
    const tags = [...variant.characterVariants]
      .sort((a, b) => a - b)
      .map(characterVariantTag);

    tokens.push(`character-variant(${tags.join(', ')})`);
  }

  singleAlternate('swash');
  singleAlternate('ornaments');
  singleAlternate('annotation');

  return tokens.join(' ');
}

// Normalize an arbitrary `font-variant-alternates` value to our canonical
// notation and token order, or null when it carries none of the features we
// manage. This deliberately drops unknown keywords, notations, and idents on
// upcast, matching the numeric and ligature properties. An explicit `normal`
// remains owned so it can defeat a paragraph-style value.
export function normalizeAlternatesStyle(style: string): string | null {
  if (isFontVariantNormal(style)) {
    return FONT_VARIANT_NORMAL;
  }

  const composed = composeAlternatesVariant(parseAlternatesVariant(style));

  return composed === '' ? null : composed;
}

// The @font-feature-values rule that gives the owned idents their meaning:
// every styleset and character-variant tag maps to its feature number and
// every single-alternate ident to its alternate index. The mapping blocks are
// font-independent; FontCatalog pairs them with the full editor family list or
// the restricted family list used by serialized exports. Activating a feature
// a font does not have is a no-op, so the uniform blocks are harmless.
function identMappings(count: number, ident: (value: number) => string) {
  return Array.from(
    { length: count },
    (_, index) => `${ident(index + 1)}: ${index + 1};`,
  ).join(' ');
}

function singleAlternateBlock(notation: SingleAlternateNotation) {
  return `@${notation} { ${identMappings(SINGLE_ALTERNATE_COUNT, (alternate) =>
    singleAlternateIdent(notation, alternate),
  )} }`;
}

// The blocks themselves name no family, so they are the same few hundred
// mappings every time; only the family list in the prelude varies.
const FONT_FEATURE_VALUE_BLOCKS = [
  singleAlternateBlock('stylistic'),
  `@styleset { ${identMappings(STYLISTIC_SET_COUNT, stylisticSetTag)} }`,
  `@character-variant { ${identMappings(
    CHARACTER_VARIANT_COUNT,
    characterVariantTag,
  )} }`,
  singleAlternateBlock('swash'),
  singleAlternateBlock('ornaments'),
  singleAlternateBlock('annotation'),
].join(' ');

export function fontFeatureValuesCss(families: string[]): string {
  if (families.length === 0) {
    return '';
  }

  const names = families
    .map((family) => `"${escapeFontName(family)}"`)
    .join(', ');

  return `@font-feature-values ${names} { ${FONT_FEATURE_VALUE_BLOCKS} }`;
}
