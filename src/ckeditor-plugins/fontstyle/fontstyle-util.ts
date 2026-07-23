import type { Editor } from 'ckeditor5';

import { fontCatalog } from '@/services/FontCatalog';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import {
  firstFontFamilyToken,
  fontFamilyListContains,
  isNeumeFontFamily,
  normalizeFontFamily,
  quoteFontFamily,
  splitFontFamilyList,
  toRichTextFontFamilyModelValue,
} from '@/utils/fontFamily';
import { isCssItalicStyle, normalizeCssFontWeight } from '@/utils/fontStyle';
import {
  cssFontWeight,
  fontStyleNeedsExplicitFamily,
  parseStyleAxes,
} from '@/utils/fontStyleAxes';

export function getEditorDefaultFontFamily(editor: Editor): string | null {
  const family = editor.config.get('insertNeume.defaultFontFamily') as
    string | undefined;

  return family != null && family.trim() !== '' ? family : null;
}

export function toEditorFontFamilyModelValue(
  editor: Editor,
  family: string,
): string | null {
  const neumeFallback = editor.config.get(
    'insertNeume.neumeDefaultFontFamily',
  ) as string | undefined;

  return neumeFallback != null && neumeFallback.trim() !== ''
    ? (toRichTextFontFamilyModelValue(family, neumeFallback) ?? null)
    : normalizeFontFamily(family);
}

export function getEditorDefaultFontFamilyModelValue(
  editor: Editor,
): string | null {
  const family = getEditorDefaultFontFamily(editor);

  return family == null ? null : toEditorFontFamilyModelValue(editor, family);
}

function explicitFontStyleCss(
  fontStyle: string,
  face?: { cssFontWeight?: string; cssFontStyle?: string },
): string {
  const axes = parseStyleAxes(fontStyle);
  const weight = face?.cssFontWeight ?? cssFontWeight(fontStyle);
  const style = face?.cssFontStyle ?? (axes.italic ? 'italic' : undefined);

  return [
    `font-weight:${normalizeCssFontWeight(weight)};`,
    `font-style:${isCssItalicStyle(style) ? 'italic' : 'normal'};`,
  ].join('');
}

export function composeFontFamilyCss(
  family: string | null | undefined,
  fontStyle: string | null | undefined,
  neumeFallback: string | null | undefined,
): string {
  if (family == null || family === '') {
    return '';
  }

  const explicitFontStyle = fontStyle?.trim();

  if (explicitFontStyle == null || explicitFontStyle === '') {
    return `font-family:${family};`;
  }

  const baseFamily = firstFontFamilyToken(family);

  // FontCatalog also uses explicit aliases for enumerated basic system faces.
  // Resolve every explicit style rather than limiting this to optical and
  // other non-weight styles.
  const face = fontCatalog.resolveFace(baseFamily, explicitFontStyle);
  const familyList = composeStyleFamilyList(
    face.cssFamily,
    family,
    baseFamily,
    neumeFallback,
  );

  return `font-family:${familyList};`;
}

export function composeFontStyleCssDeclaration(
  family: string | null | undefined,
  fontStyle: string | null | undefined,
): string {
  const explicitFontStyle = fontStyle?.trim();

  if (explicitFontStyle == null || explicitFontStyle === '') {
    return '';
  }

  if (!fontStyleNeedsExplicitFamily(explicitFontStyle)) {
    return explicitFontStyleCss(explicitFontStyle);
  }

  const baseFamily =
    family != null && family !== '' ? firstFontFamilyToken(family) : '';
  const face =
    baseFamily !== ''
      ? fontCatalog.resolveFace(baseFamily, explicitFontStyle)
      : { cssFontWeight: undefined, cssFontStyle: undefined };

  return baseFamily !== '' ? explicitFontStyleCss(explicitFontStyle, face) : '';
}

// Compose the inline CSS for a (family, style) pair so it renders in a plain
// browser (editor view, page, print, raw-HTML export). A present fontStyle is an
// explicit face override, so it always pins both weight and slant axes.
export function composeFontStyleCss(
  family: string | null | undefined,
  fontStyle: string | null | undefined,
  neumeFallback: string | null | undefined,
): string {
  if (family == null || family === '') {
    return composeFontStyleCssDeclaration(family, fontStyle);
  }

  return (
    composeFontFamilyCss(family, fontStyle, neumeFallback) +
    composeFontStyleCssDeclaration(family, fontStyle)
  );
}

function composeStyleFamilyList(
  cssFamily: string,
  family: string,
  baseFamily: string,
  neumeFallback: string | null | undefined,
) {
  let familyList =
    cssFamily === baseFamily
      ? family
      : `${quoteFontFamily(cssFamily)}, ${family}`;

  if (
    neumeFallback != null &&
    neumeFallback !== '' &&
    !fontFamilyListContains(familyList, neumeFallback) &&
    baseFamily !== neumeFallback &&
    !isNeumeFontFamily(baseFamily)
  ) {
    familyList += `, ${quoteFontFamily(neumeFallback)}`;
  }

  return familyList;
}

// Fold a downcast-produced family list back to its model form: the inverse of
// composeStyleFamilyList. The list may lead with a derived face alias
// ("Minion Pro Regular") followed by the base family it was derived from; drop
// the alias when that pattern is present. The duplicated-base check must run
// before the Regular early return below: Regular faces are aliased too, so
// alias-led lists have to fold even when the split style is the default.
export function normalizeFamilyListForSplitFace(
  fontFamily: string,
  split: { family: string; style: string },
) {
  const families = splitFontFamilyList(fontFamily)
    .map((family) => family.trim())
    .filter((family) => family !== '');
  const rest = families.slice(1);

  if (rest.length > 0 && normalizeFontFamily(rest[0]) === split.family) {
    return rest.join(',');
  }

  if (split.style === DEFAULT_FONT_STYLE) {
    return fontFamily;
  }

  return [split.family, ...rest].join(',');
}
