// Shared command names and pure mapping helpers for the OpenType plugin. Kept
// free of CKEditor imports so they can be reused by the properties-pane UI.

// Model attribute keys. Each maps to one CSS property of the same name, and the
// model value is that property's value verbatim. Commands are registered under
// these names, so the properties pane drives them via
// execForOwner(owner, FONT_VARIANT_NUMERIC, ...).
export const FONT_VARIANT_NUMERIC = 'fontVariantNumeric';
export const FONT_VARIANT_LIGATURES = 'fontVariantLigatures';
export const FONT_VARIANT_CAPS = 'fontVariantCaps';

// The four figure x spacing combinations the properties pane exposes as one
// button group. Purely a presentation grouping: the data model stores the two
// axes independently (see NumericVariant) so a partial value is not upcast.
export type NumericKey =
  | 'lining-tabular'
  | 'oldstyle-tabular'
  | 'oldstyle-proportional'
  | 'lining-proportional';

export type CapsKey = 'small-caps' | 'all-small-caps';

export function isNumericKey(value: unknown): value is NumericKey {
  return (
    value === 'lining-tabular' ||
    value === 'oldstyle-tabular' ||
    value === 'oldstyle-proportional' ||
    value === 'lining-proportional'
  );
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

export function isCapsKey(value: unknown): value is CapsKey {
  return value === 'small-caps' || value === 'all-small-caps';
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
  const tokens = style.toLowerCase().split(/\s+/).filter(Boolean);
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
// order, or null when it carries none of the tokens we manage (i.e. it is
// `normal`-equivalent). The plugin models every non-default token of this
// property, so a null result means there is nothing worth owning.
export function normalizeNumericStyle(style: string): string | null {
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
  const tokens = style.toLowerCase().split(/\s+/).filter(Boolean);

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
// null for `normal`, empty, or any non-standard value, which carry no feature
// worth owning.
export function parseFontVariantCaps(value: string): string | null {
  const normalized = value.trim().toLowerCase();

  return OWNED_CAPS_VALUES.includes(normalized) ? normalized : null;
}
