import type { Editor } from 'ckeditor5';

import { fontCatalog } from '@/services/FontCatalog';
import {
  firstFontFamilyToken,
  fontFamilyListContains,
  isNeumeFontFamily,
  normalizeFontFamily,
  quoteFontFamily,
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

  const baseFamily = firstFontFamilyToken(family);
  if (!fontStyleNeedsExplicitFamily(fontStyle)) {
    return `font-family:${family};`;
  }

  const face = fontCatalog.resolveFace(baseFamily, fontStyle);
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
