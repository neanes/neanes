import { fontCatalog } from '@/services/FontCatalog';

import { DEFAULT_FONT_STYLE } from './fontConstants';
import {
  buildStyleFromAxes,
  fontStyleTokenKey,
  matchStyle,
  normalizeDocumentFontStyle,
  parseStyleAxes,
  preferNamedWeightOverBold,
  resolveAxisToggle,
  type StyleAxis,
} from './fontStyleAxes';

export interface ResolvedFontStyle {
  cssFontFamily: string;
  cssFontWeight: string;
  cssFontStyle: string;
}

const LEGACY_WEIGHT_VARIANTS: Record<number, string> = {
  100: 'Thin',
  200: 'Extra Light',
  300: 'Light',
  400: DEFAULT_FONT_STYLE,
  500: 'Medium',
  600: 'Semibold',
  700: 'Bold',
  800: 'Extra Bold',
  900: 'Black',
};

export function fontStyleFromLegacyCssStyle(
  fontWeight: string | null | undefined,
  cssFontStyle: string | null | undefined,
) {
  const weightVariant = legacyWeightVariant(fontWeight);
  const axes = parseStyleAxes(weightVariant);
  axes.italic = isCssItalicStyle(cssFontStyle);

  return buildStyleFromAxes(axes);
}

// Rebuild a font style from a face/style name plus legacy CSS weight/slant
// markers. This preserves named weights such as Semibold, Extra Bold, and Black
// instead of collapsing them to the Bold axis.
export function applyLegacyStyle(
  baseStyle: string | null | undefined,
  legacy: {
    bold?: boolean;
    italic?: boolean;
    weight?: string | null;
    cssFontStyle?: string | null;
  },
  availableStyles: string[],
): string {
  const base = parseStyleAxes(baseStyle);
  const fromWeight = parseStyleAxes(
    fontStyleFromLegacyCssStyle(
      legacy.weight ?? null,
      legacy.cssFontStyle ?? (legacy.italic ? 'italic' : 'normal'),
    ),
  );

  const rest: string[] = [];
  const seen = new Set<string>();

  for (const token of [...base.rest, ...fromWeight.rest]) {
    const key = fontStyleTokenKey(token);

    if (!seen.has(key)) {
      seen.add(key);
      rest.push(token);
    }
  }

  const built = buildStyleFromAxes(
    preferNamedWeightOverBold({
      bold: Boolean(legacy.bold) || fromWeight.bold || base.bold,
      italic: Boolean(legacy.italic) || fromWeight.italic || base.italic,
      rest,
    }),
  );

  return matchStyle(built, availableStyles) ?? built;
}

export function resolveFontStyle(
  fontFamily: string,
  fontStyle: string | null | undefined,
): ResolvedFontStyle {
  const resolved = fontCatalog.resolveFace(
    fontFamily,
    normalizeFontStyle(fontStyle),
  );

  return {
    cssFontFamily: resolved.cssFamily,
    cssFontWeight: normalizeCssFontWeight(resolved.cssFontWeight),
    cssFontStyle: resolved.cssFontStyle ?? 'normal',
  };
}

export function getFontStyleOptions(fontFamily: string) {
  return fontFamily.trim() === ''
    ? [DEFAULT_FONT_STYLE]
    : fontCatalog.getStyles(fontFamily);
}

export function remapFontStyleForFamily(
  currentStyle: string | null | undefined,
  fontFamily: string,
) {
  return remapFontStyleForOptions(
    currentStyle,
    getFontStyleOptions(fontFamily),
  );
}

export function remapFontStyleForOptions(
  currentStyle: string | null | undefined,
  available: string[],
) {
  const normalized = normalizeFontStyle(currentStyle);
  const exact = matchStyle(normalized, available);

  if (exact != null) {
    return exact;
  }

  return remapFontStyleAxesForOptions(normalized, available);
}

export function remapFontStyleAxesForOptions(
  currentStyle: string | null | undefined,
  available: string[],
) {
  const normalized = normalizeFontStyle(currentStyle);
  const axes = parseStyleAxes(normalized);
  const axisOnly = matchStyle(
    buildStyleFromAxes({ bold: axes.bold, italic: axes.italic, rest: [] }),
    available,
  );

  return axisOnly ?? DEFAULT_FONT_STYLE;
}

export function toggleFontStyleAxis(
  fontFamily: string,
  currentStyle: string | null | undefined,
  axis: StyleAxis,
) {
  return resolveAxisToggle(
    normalizeFontStyle(currentStyle),
    axis,
    getFontStyleOptions(fontFamily),
  );
}

export function normalizeFontStyle(fontStyle: string | null | undefined) {
  return normalizeDocumentFontStyle(fontStyle);
}

function legacyWeightVariant(fontWeight: string | null | undefined) {
  const weight = fontWeight?.trim().toLowerCase();

  if (weight == null || weight === '' || weight === 'normal') {
    return DEFAULT_FONT_STYLE;
  }

  if (weight === 'bold' || weight === 'bolder') {
    return 'Bold';
  }

  const numeric = Number(weight);

  if (Number.isFinite(numeric)) {
    const rounded = Math.round(numeric / 100) * 100;
    return LEGACY_WEIGHT_VARIANTS[rounded] ?? DEFAULT_FONT_STYLE;
  }

  return DEFAULT_FONT_STYLE;
}

export function isCssItalicStyle(fontStyle: string | null | undefined) {
  const style = fontStyle?.trim().toLowerCase();
  return style === 'italic' || style === 'oblique';
}

export function isRegularCssFontWeight(fontWeight: string | null | undefined) {
  const weight = fontWeight?.trim().toLowerCase();
  return (
    weight == null || weight === '' || weight === '400' || weight === 'normal'
  );
}

export function isNormalCssFontStyle(fontStyle: string | null | undefined) {
  const style = fontStyle?.trim().toLowerCase();
  return style == null || style === '' || style === 'normal';
}

export function normalizeCssFontWeight(fontWeight: string | null | undefined) {
  const weight = fontWeight?.trim().toLowerCase();

  if (weight == null || weight === '' || weight === 'normal') {
    return '400';
  }

  if (weight === 'bold' || weight === 'bolder') {
    return '700';
  }

  return fontWeight!;
}
