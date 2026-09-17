import { isTokenNode } from '@csstools/css-parser-algorithms';
import { isTokenString } from '@csstools/css-tokenizer';

import {
  cssComponentValuesToString,
  cssIdentifier,
  parseCssCommaSeparatedComponentValues,
  parseCssComponentValues,
  significantCssComponentValues,
} from './cssValues';
import { RICH_TEXT_DEFAULT_FONT_FAMILY } from './fontConstants';

// Quote a CSS font-family token only when it is not a bare identifier, matching
// the app's existing rich-text serialization (e.g. `'GFS Didot'`).
export function quoteFontFamily(name: string): string {
  return /^[A-Za-z][A-Za-z0-9-]*$/.test(name)
    ? name
    : `'${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

// Escape a font name for use inside a double-quoted CSS string (@font-face
// local() sources, @font-feature-values family lists).
export function escapeFontName(name: string): string {
  return name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function normalizeFontFamily(fontFamily: string): string {
  const values = significantCssComponentValues(
    parseCssComponentValues(fontFamily),
  );

  if (
    values.length === 1 &&
    isTokenNode(values[0]) &&
    isTokenString(values[0].value)
  ) {
    return values[0].value[4].value;
  }

  const identifiers = values.map(cssIdentifier);

  if (identifiers.length > 0 && identifiers.every((value) => value != null)) {
    return identifiers.join(' ');
  }

  // Keep malformed or functional values as raw text. Callers use this helper
  // for UI and comparison as well as valid font-family grammar, so preserving
  // an unfamiliar value is safer than silently turning it into another name.
  return fontFamily.trim().replace(/^['"]|['"]$/g, '');
}

export function splitFontFamilyList(value: string): string[] {
  return parseCssCommaSeparatedComponentValues(value).map(
    cssComponentValuesToString,
  );
}

// The first family in a CSS font-family list, unquoted. Handles a quoted first
// token (which may itself contain commas) and a bare token.
export function firstFontFamilyToken(value: string): string {
  const first = splitFontFamilyList(value)[0];
  return first != null ? normalizeFontFamily(first) : '';
}

export function fromRichTextFontFamilyModelValue(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    return RICH_TEXT_DEFAULT_FONT_FAMILY;
  }

  const fontFamilies = splitFontFamilyList(value)
    .map((fontFamily) => normalizeFontFamily(fontFamily))
    .filter((fontFamily) => fontFamily !== '');

  return fontFamilies[0] ?? RICH_TEXT_DEFAULT_FONT_FAMILY;
}

export function toRichTextFontFamilyModelValue(
  fontFamily: string,
): string | undefined {
  const normalizedFontFamily = normalizeFontFamily(fontFamily);

  if (normalizedFontFamily === RICH_TEXT_DEFAULT_FONT_FAMILY) {
    return undefined;
  }

  return normalizedFontFamily;
}
