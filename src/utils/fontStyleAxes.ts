// Utilities for reasoning about font "style" strings (the per-face descriptor
// reported by queryLocalFonts / the bundled font registry, e.g. "Bold",
// "Semibold Italic", "Bold Italic Caption", "Light Display").
//
// A style decomposes into three things:
//   - the bold axis  (the standalone "Bold" weight, i.e. 700)
//   - the italic axis ("Italic"/"Oblique")
//   - the remaining tokens (other weights like "Semibold"/"Light" and
//     optical-size names like "Caption"/"Display"/"SmText"/"Subhead")
//
// The Bold/Italic toolbar buttons toggle the bold/italic axes. They preserve
// optical-size tokens, and Bold-on may replace a named weight like Semibold
// when the exact "Semibold Bold" target does not exist.

export interface StyleAxes {
  bold: boolean;
  italic: boolean;
  // Non-axis tokens, in their original casing and order (weights, optical
  // sizes). A compound weight written with a space ("Extra Bold") is kept as a
  // single token so it is not mistaken for the bold axis.
  rest: string[];
}

export type StyleAxis = 'bold' | 'italic';

const DEFAULT_STYLE_NAME = 'Regular';

// Words that combine with a following weight word to form a distinct weight
// ("Extra Bold", "Extra Light", "Semi Bold", ...). When "Bold" follows one of
// these it is part of the weight name, not the bold axis.
const WEIGHT_MODIFIERS: Record<string, Set<string>> = {
  demi: new Set(['bold']),
  extra: new Set(['bold', 'light']),
  semi: new Set(['bold', 'light']),
  ultra: new Set(['bold', 'light']),
};

// Named weights -> numeric rank, used only for ordering. Keys are compared with
// spaces/hyphens removed so "Extra Bold", "ExtraBold" and "extrabold" all match.
const WEIGHT_RANKS: Record<string, number> = {
  thin: 100,
  hairline: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  semilight: 350,
  book: 380,
  regular: 400,
  normal: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  black: 900,
  heavy: 900,
};

function isWeightToken(token: string): boolean {
  return token.toLowerCase().replace(/[\s-]/g, '') in WEIGHT_RANKS;
}

export function fontStyleTokenKey(token: string): string {
  const lower = token.toLowerCase();
  return isWeightToken(token) ? lower.replace(/[\s-]/g, '') : lower;
}

function isCompoundWeight(previous: string, current: string): boolean {
  return WEIGHT_MODIFIERS[previous.toLowerCase()]?.has(current) === true;
}

export function hasNonWeightStyleToken(
  style: string | null | undefined,
): boolean {
  return parseStyleAxes(style).rest.some((token) => !isWeightToken(token));
}

export function fontStyleNeedsExplicitFamily(
  style: string | null | undefined,
): boolean {
  return parseStyleAxes(style).rest.length > 0;
}

export function parseStyleAxes(style: string | null | undefined): StyleAxes {
  const tokens = (style ?? '')
    .trim()
    .split(/\s+/)
    .filter((t) => t !== '');

  let bold = false;
  let italic = false;
  const rest: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    const previous = rest.length > 0 ? rest[rest.length - 1] : null;

    if (previous != null && isCompoundWeight(previous, lower)) {
      // "Extra Bold" and friends are weights, not the bold axis.
      rest[rest.length - 1] = `${previous} ${token}`;
    } else if (lower === 'bold') {
      bold = true;
    } else if (lower === 'italic' || lower === 'oblique') {
      italic = true;
    } else if (lower === 'regular' || lower === 'normal') {
      // The absence of a font style; contributes nothing.
    } else {
      rest.push(token);
    }
  }

  return { bold, italic, rest };
}

// A canonical, order-insensitive identity for a style so two styles that mean
// the same face compare equal regardless of token order ("Bold Italic" vs
// "Italic Bold"). The empty key represents Regular / no explicit font style.
function styleKey(axes: StyleAxes): string {
  const tokens = axes.rest.map(fontStyleTokenKey);

  if (axes.bold) {
    tokens.push('bold');
  }

  if (axes.italic) {
    tokens.push('italic');
  }

  return tokens.sort().join('\0');
}

// The canonical key of a style string; see styleKey.
export function fontStyleKey(style: string | null | undefined): string {
  return styleKey(parseStyleAxes(style));
}

function matchStyleAxes(
  axes: StyleAxes,
  availableStyles: string[],
): string | null {
  const targetKey = styleKey(axes);

  for (const style of availableStyles) {
    if (styleKey(parseStyleAxes(style)) === targetKey) {
      return style;
    }
  }

  return null;
}

// Flip one axis of `currentStyle` and return the existing style from
// `availableStyles` that matches, or null when no such face exists (the caller
// disables the corresponding button).
export function resolveAxisToggle(
  currentStyle: string | null | undefined,
  axis: StyleAxis,
  availableStyles: string[],
): string | null {
  const target = parseStyleAxes(currentStyle);

  if (axis === 'bold') {
    target.bold = !target.bold;
  } else {
    target.italic = !target.italic;
  }

  const exact = matchStyleAxes(target, availableStyles);

  if (exact != null) {
    return exact;
  }

  if (axis === 'bold' && target.bold) {
    const withoutCurrentWeight = {
      ...target,
      rest: target.rest.filter((token) => !isWeightToken(token)),
    };

    if (withoutCurrentWeight.rest.length !== target.rest.length) {
      return matchStyleAxes(withoutCurrentWeight, availableStyles);
    }
  }

  return null;
}

// True when a style has no explicit weight/italic/optical tokens (it is the
// family's default face).
export function isRegularStyle(style: string | null | undefined): boolean {
  return fontStyleKey(style) === '';
}

// Build a display style string from axes: rest tokens, then Bold, then Italic.
// Empty axes render as "Regular".
export function buildStyleFromAxes(axes: StyleAxes): string {
  const tokens = [...axes.rest];

  if (axes.bold) {
    tokens.push('Bold');
  }

  if (axes.italic) {
    tokens.push('Italic');
  }

  return tokens.length > 0 ? tokens.join(' ') : DEFAULT_STYLE_NAME;
}

// A named weight token (Semibold, Extra Bold, Black, ...) and the Bold axis both
// specify weight, so they cannot coexist on one face. When folding legacy data
// produces both, the explicit named weight is the more specific signal and wins:
// the Bold axis is dropped so we never build an impossible "Semibold Bold" (which
// would also silently collapse 600/800/900 to 700). Live Bold toggles take a
// different path through resolveAxisToggle, which instead replaces the named
// weight with Bold.
export function preferNamedWeightOverBold(axes: StyleAxes): StyleAxes {
  return axes.bold && axes.rest.some(isWeightToken)
    ? { ...axes, bold: false }
    : axes;
}

// Canonicalize style names before they become document state. In particular,
// lowercase CSS keywords are legacy serialized slant values in score JSON, so
// system/imported face names must never be saved as bare `normal`, `italic`, or
// `oblique`.
export function normalizeDocumentFontStyle(
  style: string | null | undefined,
): string {
  const tokens = (style ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .filter((token) => token !== '');
  const normalized: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    const previous =
      normalized.length > 0 ? normalized[normalized.length - 1] : null;

    if (previous != null && isCompoundWeight(previous, lower)) {
      normalized[normalized.length - 1] = `${previous} ${token}`;
    } else if (lower === 'regular' || lower === 'normal') {
      // Regular/Normal is represented by the absence of style axes.
    } else if (lower === 'bold') {
      normalized.push('Bold');
    } else if (lower === 'italic') {
      normalized.push('Italic');
    } else if (lower === 'oblique') {
      normalized.push('Oblique');
    } else {
      normalized.push(token);
    }
  }

  return normalized.length > 0 ? normalized.join(' ') : DEFAULT_STYLE_NAME;
}

// Return the entry of `availableStyles` that means the same face as `style`
// (order-insensitive), or null when none matches.
export function matchStyle(
  style: string,
  availableStyles: string[],
): string | null {
  return matchStyleAxes(parseStyleAxes(style), availableStyles);
}

// Set the given axes on `baseStyle` (leaving unspecified axes untouched), then
// resolve to the matching existing face name, falling back to a built string
// when the family has no such face (e.g. bold/italic on the default font).
export function applyAxes(
  baseStyle: string | null | undefined,
  overrides: { bold?: boolean; italic?: boolean },
  availableStyles: string[],
): string {
  const axes = parseStyleAxes(baseStyle);

  if (overrides.bold !== undefined) {
    axes.bold = overrides.bold;
  }

  if (overrides.italic !== undefined) {
    axes.italic = overrides.italic;
  }

  const built = buildStyleFromAxes(preferNamedWeightOverBold(axes));
  return matchStyle(built, availableStyles) ?? built;
}

// The CSS font-weight for a style, or undefined for the normal (400) weight so
// callers only emit an explicit weight when it differs from normal.
export function cssFontWeight(
  style: string | null | undefined,
): string | undefined {
  const weight = styleWeight(parseStyleAxes(style));
  return weight === 400 ? undefined : String(weight);
}

function styleWeight(axes: StyleAxes): number {
  if (axes.bold) {
    return 700;
  }

  for (const token of axes.rest) {
    if (isWeightToken(token)) {
      return WEIGHT_RANKS[token.toLowerCase().replace(/[\s-]/g, '')];
    }
  }

  return 400;
}

// Optical-size / non-weight remainder, used as a tiebreak when ordering.
function opticalKey(axes: StyleAxes): string {
  return axes.rest
    .filter((token) => !isWeightToken(token))
    .map((token) => token.toLowerCase())
    .sort()
    .join(' ');
}

// Order styles for the font style dropdown: Regular first, then the weight ladder
// (Thin..Black), upright before italic within a weight, then optical sizes
// alphabetically.
export function compareFontStyles(a: string, b: string): number {
  const aAxes = parseStyleAxes(a);
  const bAxes = parseStyleAxes(b);

  const aRegular = styleKey(aAxes) === '' ? 0 : 1;
  const bRegular = styleKey(bAxes) === '' ? 0 : 1;

  if (aRegular !== bRegular) {
    return aRegular - bRegular;
  }

  const weightDelta = styleWeight(aAxes) - styleWeight(bAxes);

  if (weightDelta !== 0) {
    return weightDelta;
  }

  const italicDelta = (aAxes.italic ? 1 : 0) - (bAxes.italic ? 1 : 0);

  if (italicDelta !== 0) {
    return italicDelta;
  }

  const opticalDelta = opticalKey(aAxes).localeCompare(opticalKey(bAxes));

  if (opticalDelta !== 0) {
    return opticalDelta;
  }

  return a.localeCompare(b);
}
