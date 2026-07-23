import type { ScoreElement } from '@/models/Element';
import {
  AcceptsLyricsOption,
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  ElementType,
  EmptyElement,
  ImageBoxElement,
  LineBreakType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import type { Footer } from '@/models/Footer';
import type { Header } from '@/models/Header';
import { LyricSetup } from '@/models/LyricSetup';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { QuantitativeNeume } from '@/models/Neumes';
import { MelismaStyle, PageSetup, pageSizes } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  createDefaultParagraphStyles,
  getRequiredParagraphStyleById,
  getTextBoxParagraphStyleFallbackId,
  ParagraphStyle,
  type ParagraphStyleOverrides,
  type ResolvedParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import type { ScoreElement as ScoreElement_v1 } from '@/models/save/v1/Element';
import {
  AlternateLineElement as AlternateLineElement_v1,
  AnnotationElement as AnnotationElement_v1,
  DropCapElement as DropCapElement_v1,
  ElementType as ElementType_v1,
  EmptyElement as EmptyElement_v1,
  ImageBoxElement as ImageBoxElement_v1,
  MartyriaElement as MartyriaElement_v1,
  ModeKeyElement as ModeKeyElement_v1,
  NoteElement as NoteElement_v1,
  RichTextBoxElement as RichTextBoxElement_v1,
  TempoElement as TempoElement_v1,
  TextBoxElement as TextBoxElement_v1,
} from '@/models/save/v1/Element';
import type { Footer as Footer_v1 } from '@/models/save/v1/Footer';
import type { Header as Header_v1 } from '@/models/save/v1/Header';
import {
  type MelismaStyle as MelismaStyle_v1,
  PageSetup as PageSetup_v1,
} from '@/models/save/v1/PageSetup';
import {
  DocumentProperties as DocumentProperties_v1,
  type LyricSetup as LyricSetup_v1,
  Score as Score_v1,
  Staff as Staff_v1,
} from '@/models/save/v1/Score';
import {
  type ParagraphStyle as ParagraphStyle_v1,
  ParagraphStyle as ParagraphStyleSave_v1,
} from '@/models/save/v1/Style';
import { DocumentProperties, Score } from '@/models/Score';
import { Staff } from '@/models/Staff';
import { fontCatalog } from '@/services/FontCatalog';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { applyLegacyStyle, normalizeFontStyle } from '@/utils/fontStyle';
import { applyAxes } from '@/utils/fontStyleAxes';

interface IScore {
  version: string;
}

interface LegacySectionNameCompatibility {
  sectionName?: string | null;
}

interface LegacyTextBoxCssFontCompatibility {
  fontStyle?: string | null;
}

function readLegacyCssFontStyle(fontStyle: string | null | undefined) {
  const trimmed = fontStyle?.trim();

  if (trimmed == null || trimmed === '') {
    return undefined;
  }

  if (trimmed === 'normal' || trimmed === 'italic' || trimmed === 'oblique') {
    return trimmed;
  }

  return undefined;
}

function normalizeSavedFontSubfamily(fontSubfamily: string | null | undefined) {
  const trimmed = fontSubfamily?.trim();

  return trimmed == null || trimmed === ''
    ? undefined
    : normalizeFontStyle(trimmed);
}

type RichTextLanguageFields = {
  languageCode?: string | null;
  textDirection?: 'ltr' | 'rtl' | null;
};

function saveRichTextLanguage(
  target: { languageCode?: string; textDirection?: 'ltr' | 'rtl' },
  source: RichTextLanguageFields,
) {
  const languageCode = source.languageCode?.trim();

  if (
    languageCode == null ||
    languageCode === '' ||
    !isTextDirection(source.textDirection)
  ) {
    return;
  }

  target.languageCode = languageCode;
  target.textDirection = source.textDirection;
}

function loadRichTextLanguage(
  target: { languageCode: string | null; textDirection: 'ltr' | 'rtl' | null },
  source: RichTextLanguageFields,
) {
  const languageCode = source.languageCode?.trim();

  if (
    languageCode == null ||
    languageCode === '' ||
    !isTextDirection(source.textDirection)
  ) {
    return;
  }

  target.languageCode = languageCode;
  target.textDirection = source.textDirection;
}

function isTextDirection(value: unknown): value is 'ltr' | 'rtl' {
  return value === 'ltr' || value === 'rtl';
}

function normalizeLegacySectionName(value: string | null | undefined) {
  const trimmed = value?.trim();

  return trimmed == null || trimmed === '' ? null : trimmed;
}

function hasLegacyPageSetupStyleDefaults(pageSetup: PageSetup_v1) {
  return [
    pageSetup.textBoxDefaultFontFamily,
    pageSetup.textBoxDefaultFontSize,
    pageSetup.textBoxDefaultFontSubfamily,
    pageSetup.textBoxDefaultFontStyle,
    pageSetup.textBoxDefaultFontWeight,
    pageSetup.textBoxDefaultColor,
    pageSetup.textBoxDefaultStrokeWidth,
    pageSetup.textBoxDefaultLineHeight,
    pageSetup.lyricsDefaultFontFamily,
    pageSetup.lyricsDefaultFontSize,
    pageSetup.lyricsDefaultFontSubfamily,
    pageSetup.lyricsDefaultFontStyle,
    pageSetup.lyricsDefaultFontWeight,
    pageSetup.lyricsDefaultColor,
    pageSetup.lyricsDefaultStrokeWidth,
    pageSetup.dropCapDefaultFontFamily,
    pageSetup.dropCapDefaultFontSize,
    pageSetup.dropCapDefaultFontSubfamily,
    pageSetup.dropCapDefaultFontStyle,
    pageSetup.dropCapDefaultFontWeight,
    pageSetup.dropCapDefaultColor,
    pageSetup.dropCapDefaultStrokeWidth,
    pageSetup.dropCapDefaultLineHeight,
  ].some((value) => value != null);
}

function loadFontFaceFromWeightFields({
  savedFontFamily,
  fallbackFontFamily,
  fontSubfamily,
  legacyFontWeight,
  legacyCssFontStyle,
  fallbackStyle = DEFAULT_FONT_STYLE,
}: {
  savedFontFamily: string | null | undefined;
  fallbackFontFamily: string;
  fontSubfamily?: string | null;
  legacyFontWeight?: string | null;
  legacyCssFontStyle?: string | null;
  fallbackStyle?: string;
}) {
  const face = splitSavedFontFamily(savedFontFamily, fallbackFontFamily);
  const savedStyle = normalizeSavedFontSubfamily(fontSubfamily);
  const cssFontStyle = readLegacyCssFontStyle(legacyCssFontStyle);

  if (savedStyle != null) {
    return { fontFamily: face.fontFamily, fontStyle: savedStyle };
  }

  if (legacyFontWeight != null || cssFontStyle != null) {
    return {
      fontFamily: face.fontFamily,
      fontStyle: applyLegacyStyle(
        face.fontStyle,
        { weight: legacyFontWeight, cssFontStyle },
        fontCatalog.getStyles(face.fontFamily),
      ),
    };
  }

  return {
    fontFamily: face.fontFamily,
    fontStyle:
      face.fontStyle !== DEFAULT_FONT_STYLE
        ? face.fontStyle
        : normalizeFontStyle(fallbackStyle),
  };
}

function createParagraphStylesFromLegacyPageSetupDefaults(
  pageSetup: PageSetup_v1,
) {
  const styles = createDefaultParagraphStyles();
  const defaultText = getRequiredParagraphStyleById(
    styles,
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
  );
  const annotation = getRequiredParagraphStyleById(
    styles,
    BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation,
  );
  const lyrics = getRequiredParagraphStyleById(
    styles,
    BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
  );
  const dropCap = getRequiredParagraphStyleById(
    styles,
    BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
  );

  const textBoxDefaultFont = loadFontFaceFromWeightFields({
    savedFontFamily: pageSetup.textBoxDefaultFontFamily,
    fallbackFontFamily: 'Source Serif',
    fontSubfamily: pageSetup.textBoxDefaultFontSubfamily,
    legacyFontWeight: pageSetup.textBoxDefaultFontWeight,
    legacyCssFontStyle: pageSetup.textBoxDefaultFontStyle,
  });
  const lyricsDefaultFont = loadFontFaceFromWeightFields({
    savedFontFamily: pageSetup.lyricsDefaultFontFamily,
    fallbackFontFamily: 'Source Serif',
    fontSubfamily: pageSetup.lyricsDefaultFontSubfamily,
    legacyFontWeight: pageSetup.lyricsDefaultFontWeight,
    legacyCssFontStyle: pageSetup.lyricsDefaultFontStyle,
  });
  const dropCapDefaultFont = loadFontFaceFromWeightFields({
    savedFontFamily: pageSetup.dropCapDefaultFontFamily,
    fallbackFontFamily: 'Source Serif',
    fontSubfamily: pageSetup.dropCapDefaultFontSubfamily,
    legacyFontWeight: pageSetup.dropCapDefaultFontWeight,
    legacyCssFontStyle: pageSetup.dropCapDefaultFontStyle,
  });

  const defaultTextInherited = resolveParagraphStyle(
    styles,
    defaultText.parentStyleId,
  );

  applyGeneratedParagraphStyleOverrides(defaultText, defaultTextInherited, {
    fontFamily: textBoxDefaultFont.fontFamily,
    fontSize: pageSetup.textBoxDefaultFontSize,
    fontStyle: textBoxDefaultFont.fontStyle,
    color: pageSetup.textBoxDefaultColor,
    strokeWidth: pageSetup.textBoxDefaultStrokeWidth,
    lineHeight: pageSetup.textBoxDefaultLineHeight,
  });

  const annotationInherited = resolveParagraphStyle(
    styles,
    annotation.parentStyleId,
  );

  applyGeneratedParagraphStyleOverride(
    annotation,
    annotationInherited,
    'fontSize',
    pageSetup.lyricsDefaultFontSize,
  );

  const lyricsInherited = resolveParagraphStyle(styles, lyrics.parentStyleId);

  applyGeneratedParagraphStyleOverrides(lyrics, lyricsInherited, {
    fontFamily: lyricsDefaultFont.fontFamily,
    fontSize: pageSetup.lyricsDefaultFontSize,
    fontStyle: lyricsDefaultFont.fontStyle,
    color: pageSetup.lyricsDefaultColor,
    strokeWidth: pageSetup.lyricsDefaultStrokeWidth,
  });

  const dropCapInherited = resolveParagraphStyle(styles, dropCap.parentStyleId);

  applyGeneratedParagraphStyleOverrides(dropCap, dropCapInherited, {
    fontFamily: dropCapDefaultFont.fontFamily,
    fontSize: pageSetup.dropCapDefaultFontSize,
    fontStyle: dropCapDefaultFont.fontStyle,
    color: pageSetup.dropCapDefaultColor,
    strokeWidth: pageSetup.dropCapDefaultStrokeWidth,
    lineHeight: pageSetup.dropCapDefaultLineHeight,
  });

  return styles;
}

function applyGeneratedParagraphStyleOverrides(
  style: ParagraphStyle,
  inherited: ResolvedParagraphStyle,
  values: ParagraphStyleOverrides,
) {
  for (const key of Object.keys(values) as Array<
    keyof ParagraphStyleOverrides
  >) {
    applyGeneratedParagraphStyleOverride(style, inherited, key, values[key]);
  }
}

function applyGeneratedParagraphStyleOverride<
  K extends keyof ParagraphStyleOverrides,
>(
  style: ParagraphStyle,
  inherited: ResolvedParagraphStyle,
  key: K,
  value: ParagraphStyleOverrides[K] | undefined,
) {
  if (value === undefined) {
    return;
  }

  if (Object.is(value, inherited[key])) {
    delete style.overrides[key];
    return;
  }

  style.overrides[key] = value;
}

function shouldKeepMigratedParagraphStyleOverride(
  inherited: ResolvedParagraphStyle,
  key: keyof ParagraphStyleOverrides,
  value: unknown,
) {
  return !Object.is(value, inherited[key]);
}

function migrateLegacyParagraphStyleOverrides(
  score: Score_v1,
  paragraphStyles: ParagraphStyle[],
) {
  const resolvedFallbackStyles = new Map<string, ResolvedParagraphStyle>();
  const resolveFallbackStyle = (styleId: string) => {
    let resolved = resolvedFallbackStyles.get(styleId);

    if (resolved == null) {
      resolved = resolveParagraphStyle(paragraphStyles, styleId);
      resolvedFallbackStyles.set(styleId, resolved);
    }

    return resolved;
  };

  const headerFooterGroups: Array<[Header_v1 | Footer_v1 | undefined, string]> =
    [
      [score.headers?.default, BUILT_IN_PARAGRAPH_STYLE_IDS.Header],
      [score.headers?.chapterOpening, BUILT_IN_PARAGRAPH_STYLE_IDS.Header],
      [score.headers?.even, BUILT_IN_PARAGRAPH_STYLE_IDS.Header],
      [score.headers?.odd, BUILT_IN_PARAGRAPH_STYLE_IDS.Header],
      [score.headers?.firstPage, BUILT_IN_PARAGRAPH_STYLE_IDS.Header],
      [score.footers?.default, BUILT_IN_PARAGRAPH_STYLE_IDS.Footer],
      [score.footers?.chapterOpening, BUILT_IN_PARAGRAPH_STYLE_IDS.Footer],
      [score.footers?.even, BUILT_IN_PARAGRAPH_STYLE_IDS.Footer],
      [score.footers?.odd, BUILT_IN_PARAGRAPH_STYLE_IDS.Footer],
      [score.footers?.firstPage, BUILT_IN_PARAGRAPH_STYLE_IDS.Footer],
    ];

  for (const [headerOrFooter, defaultParagraphStyleId] of headerFooterGroups) {
    const element = headerOrFooter?.elements[0];

    if (element?.elementType === ElementType_v1.TextBox) {
      migrateLegacyTextBoxParagraphStyleOverrides(
        score.version,
        element as TextBoxElement_v1,
        defaultParagraphStyleId,
        resolveFallbackStyle(defaultParagraphStyleId),
      );
    }
  }

  for (const element of score.staff.elements) {
    switch (element.elementType) {
      case ElementType_v1.DropCap:
        migrateLegacyDropCapParagraphStyleOverrides(
          element as DropCapElement_v1,
          resolveFallbackStyle(BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap),
        );
        break;
      case ElementType_v1.Note:
        migrateLegacyNoteLyricsParagraphStyleOverrides(
          element as NoteElement_v1,
          resolveFallbackStyle(BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics),
        );
        break;
      case ElementType_v1.TextBox: {
        const fallbackStyleId = getTextBoxParagraphStyleFallbackId(
          (element as TextBoxElement_v1).inline === true,
        );

        migrateLegacyTextBoxParagraphStyleOverrides(
          score.version,
          element as TextBoxElement_v1,
          fallbackStyleId,
          resolveFallbackStyle(fallbackStyleId),
        );
        break;
      }
    }
  }
}

function migrateLegacyDropCapParagraphStyleOverrides(
  element: DropCapElement_v1,
  fallbackStyle: ResolvedParagraphStyle,
) {
  if (element.paragraphStyleId != null) {
    return;
  }

  const hasExplicitDropCapOverrides =
    element.fontFamily != null ||
    element.fontSubfamily != null ||
    element.fontWeight != null ||
    element.fontStyle != null ||
    element.fontSize != null ||
    element.lineHeight !== undefined ||
    element.strokeWidth != null ||
    element.color != null;
  const usesLegacyDefaultStyle =
    element.useDefaultStyle === true || !hasExplicitDropCapOverrides;

  element.paragraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap;

  if (usesLegacyDefaultStyle) {
    clearLegacyDropCapParagraphStyleOverrides(element);
    return;
  }

  const font = loadFontFaceFromWeightFields({
    savedFontFamily: element.fontFamily,
    fallbackFontFamily: fallbackStyle.fontFamily,
    fontSubfamily: element.fontSubfamily,
    legacyFontWeight: element.fontWeight,
    legacyCssFontStyle: element.fontStyle,
    fallbackStyle: fallbackStyle.fontStyle,
  });
  const hasFontStyleOverride =
    element.fontStyle != null ||
    element.fontSubfamily != null ||
    element.fontWeight != null ||
    (element.fontFamily != null && font.fontStyle !== fallbackStyle.fontStyle);
  const color = element.color;
  const fontFamily = element.fontFamily;
  const fontSize = element.fontSize;
  const lineHeight = element.lineHeight;
  const strokeWidth = element.strokeWidth;

  clearLegacyDropCapParagraphStyleOverrides(element);

  if (
    fontFamily != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'fontFamily',
      font.fontFamily,
    )
  ) {
    element.fontFamily = font.fontFamily;
  }

  if (
    color != null &&
    shouldKeepMigratedParagraphStyleOverride(fallbackStyle, 'color', color)
  ) {
    element.color = color;
  }

  if (
    fontSize != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'fontSize',
      fontSize,
    )
  ) {
    element.fontSize = fontSize;
  }

  if (
    lineHeight !== undefined &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'lineHeight',
      lineHeight ?? null,
    )
  ) {
    element.lineHeight = lineHeight;
  }

  if (
    hasFontStyleOverride &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'fontStyle',
      font.fontStyle,
    )
  ) {
    element.fontSubfamily = font.fontStyle;
  }

  if (
    strokeWidth != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'strokeWidth',
      strokeWidth,
    )
  ) {
    element.strokeWidth = strokeWidth;
  }
}

function clearLegacyDropCapParagraphStyleOverrides(element: DropCapElement_v1) {
  element.color = undefined;
  element.fontFamily = undefined;
  element.fontSize = undefined;
  element.fontStyle = undefined;
  element.fontSubfamily = undefined;
  element.fontWeight = undefined;
  element.lineHeight = undefined;
  element.strokeWidth = undefined;
}

function migrateLegacyNoteLyricsParagraphStyleOverrides(
  element: NoteElement_v1,
  fallbackStyle: ResolvedParagraphStyle,
) {
  if (element.lyricsParagraphStyleId != null) {
    return;
  }

  element.lyricsParagraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics;

  const hasExplicitLyricsOverrides =
    element.lyricsFontFamily != null ||
    element.lyricsFontSubfamily != null ||
    element.lyricsFontWeight != null ||
    element.lyricsFontStyle != null ||
    element.lyricsFontSize != null ||
    element.lyricsColor != null ||
    element.lyricsStrokeWidth != null ||
    element.lyricsTextDecoration != null;
  const usesLegacyDefaultLyrics =
    element.lyricsUseDefaultStyle === true || !hasExplicitLyricsOverrides;

  if (usesLegacyDefaultLyrics) {
    clearLegacyNoteLyricsParagraphStyleOverrides(element);
    migrateLegacyAlternateLineParagraphStyleOverrides(element, fallbackStyle);
    return;
  }

  const lyricsFont = loadFontFaceFromWeightFields({
    savedFontFamily: element.lyricsFontFamily,
    fallbackFontFamily: fallbackStyle.fontFamily,
    fontSubfamily: element.lyricsFontSubfamily,
    legacyFontWeight: element.lyricsFontWeight,
    legacyCssFontStyle: element.lyricsFontStyle,
    fallbackStyle: fallbackStyle.fontStyle,
  });
  const hasFontStyleOverride =
    element.lyricsFontStyle != null ||
    element.lyricsFontSubfamily != null ||
    element.lyricsFontWeight != null ||
    (element.lyricsFontFamily != null &&
      lyricsFont.fontStyle !== fallbackStyle.fontStyle);
  const lyricsColor = element.lyricsColor;
  const lyricsFontFamily = element.lyricsFontFamily;
  const lyricsFontSize = element.lyricsFontSize;
  const lyricsStrokeWidth = element.lyricsStrokeWidth;
  const lyricsTextDecoration = element.lyricsTextDecoration;

  clearLegacyNoteLyricsParagraphStyleOverrides(element);

  if (
    lyricsFontFamily != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'fontFamily',
      lyricsFont.fontFamily,
    )
  ) {
    element.lyricsFontFamily = lyricsFont.fontFamily;
  }

  if (
    lyricsColor != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'color',
      lyricsColor,
    )
  ) {
    element.lyricsColor = lyricsColor;
  }

  if (
    lyricsFontSize != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'fontSize',
      lyricsFontSize,
    )
  ) {
    element.lyricsFontSize = lyricsFontSize;
  }

  if (
    hasFontStyleOverride &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'fontStyle',
      lyricsFont.fontStyle,
    )
  ) {
    element.lyricsFontSubfamily = lyricsFont.fontStyle;
  }

  if (lyricsTextDecoration != null) {
    const textDecoration =
      lyricsTextDecoration === 'underline' ? 'underline' : null;

    if (
      shouldKeepMigratedParagraphStyleOverride(
        fallbackStyle,
        'textDecoration',
        textDecoration,
      )
    ) {
      element.lyricsTextDecoration = lyricsTextDecoration;
    }
  }

  if (
    lyricsStrokeWidth != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackStyle,
      'strokeWidth',
      lyricsStrokeWidth,
    )
  ) {
    element.lyricsStrokeWidth = lyricsStrokeWidth;
  }

  migrateLegacyAlternateLineParagraphStyleOverrides(element, fallbackStyle);
}

function clearLegacyNoteLyricsParagraphStyleOverrides(element: NoteElement_v1) {
  element.lyricsColor = undefined;
  element.lyricsFontFamily = undefined;
  element.lyricsFontSize = undefined;
  element.lyricsFontStyle = undefined;
  element.lyricsFontSubfamily = undefined;
  element.lyricsFontWeight = undefined;
  element.lyricsStrokeWidth = undefined;
  element.lyricsTextDecoration = undefined;
}

function migrateLegacyAlternateLineParagraphStyleOverrides(
  element: NoteElement_v1,
  fallbackStyle: ResolvedParagraphStyle,
) {
  if (element.alternateLines == null) {
    return;
  }

  for (const alternateLine of element.alternateLines) {
    for (const child of alternateLine.elements) {
      if (child.elementType !== ElementType_v1.Note) {
        continue;
      }

      migrateLegacyNoteLyricsParagraphStyleOverrides(
        child as NoteElement_v1,
        fallbackStyle,
      );
    }
  }
}

function migrateLegacyTextBoxParagraphStyleOverrides(
  scoreVersion: string,
  element: TextBoxElement_v1,
  defaultParagraphStyleId: string,
  fallbackParagraphStyle: ResolvedParagraphStyle,
) {
  if (element.paragraphStyleId != null) {
    return;
  }

  const legacyCssFontStyle = readLegacyCssFontStyle(
    (element as TextBoxElement_v1 & LegacyTextBoxCssFontCompatibility)
      .fontStyle,
  );
  const usesInheritedParagraphStyle =
    scoreVersion === '1.0'
      ? element.inline === true && element.useDefaultStyle === true
      : element.useDefaultStyle === true;

  element.paragraphStyleId = defaultParagraphStyleId;

  const alignment = element.alignment;

  if (
    alignment != null &&
    !shouldKeepMigratedParagraphStyleOverride(
      fallbackParagraphStyle,
      'alignment',
      alignment,
    )
  ) {
    element.alignment = undefined;
  }

  if (usesInheritedParagraphStyle) {
    clearLegacyTextBoxParagraphStyleOverrides(element);
    return;
  }

  const savedFontFamily = element.fontFamily?.trim();
  const hasSavedFontFamily = savedFontFamily != null && savedFontFamily !== '';
  const savedFontStyle = normalizeSavedFontSubfamily(element.fontSubfamily);
  const hasLegacyStyleFlags = element.bold != null || element.italic != null;
  const parsedFace = hasSavedFontFamily
    ? splitSavedFontFamily(savedFontFamily, fallbackParagraphStyle.fontFamily)
    : null;
  const color = element.color;
  const fontSize = element.fontSize;
  const lineHeight = element.lineHeight;
  const strokeWidth = element.strokeWidth;
  const baseStyle = parsedFace?.fontStyle ?? DEFAULT_FONT_STYLE;
  let fontStyleOverride: string;

  if (savedFontStyle != null) {
    fontStyleOverride = savedFontStyle;
  } else if (legacyCssFontStyle != null) {
    fontStyleOverride = applyAxes(
      baseStyle,
      {
        bold: element.bold || undefined,
        italic: legacyCssFontStyle !== 'normal',
      },
      fontCatalog.getStyles(
        parsedFace?.fontFamily ?? fallbackParagraphStyle.fontFamily,
      ),
    );
  } else if (hasLegacyStyleFlags) {
    fontStyleOverride = applyAxes(
      baseStyle,
      { bold: element.bold || undefined, italic: element.italic || undefined },
      fontCatalog.getStyles(
        parsedFace?.fontFamily ?? fallbackParagraphStyle.fontFamily,
      ),
    );
  } else {
    fontStyleOverride = baseStyle;
  }

  clearLegacyTextBoxParagraphStyleOverrides(element);

  if (
    parsedFace != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackParagraphStyle,
      'fontFamily',
      parsedFace.fontFamily,
    )
  ) {
    element.fontFamily = parsedFace.fontFamily;
  }

  if (
    shouldKeepMigratedParagraphStyleOverride(
      fallbackParagraphStyle,
      'fontStyle',
      fontStyleOverride,
    )
  ) {
    element.fontSubfamily = fontStyleOverride;
  }

  if (
    fontSize != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackParagraphStyle,
      'fontSize',
      fontSize,
    )
  ) {
    element.fontSize = fontSize;
  }

  if (
    color != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackParagraphStyle,
      'color',
      color,
    )
  ) {
    element.color = color;
  }

  if (
    strokeWidth != null &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackParagraphStyle,
      'strokeWidth',
      strokeWidth,
    )
  ) {
    element.strokeWidth = strokeWidth;
  }

  if (
    lineHeight !== undefined &&
    shouldKeepMigratedParagraphStyleOverride(
      fallbackParagraphStyle,
      'lineHeight',
      lineHeight ?? null,
    )
  ) {
    element.lineHeight = lineHeight;
  }
}

function clearLegacyTextBoxParagraphStyleOverrides(element: TextBoxElement_v1) {
  element.bold = undefined;
  element.color = undefined;
  element.fontFamily = undefined;
  element.fontSize = undefined;
  element.fontSubfamily = undefined;
  (element as TextBoxElement_v1 & LegacyTextBoxCssFontCompatibility).fontStyle =
    undefined;
  element.italic = undefined;
  element.lineHeight = undefined;
  element.strokeWidth = undefined;
}

function splitSavedFontFamily(
  fontFamily: string | null | undefined,
  fallbackFontFamily: string,
) {
  const family = fontFamily?.trim() || fallbackFontFamily;
  const split = fontCatalog.splitFace(family);

  return {
    fontFamily: split.family || family,
    fontStyle: normalizeFontStyle(split.style),
  };
}

export class SaveService {
  public static LoadScoreFromJson(s: IScore) {
    let score: Score = new Score();

    if (s.version == null || typeof s.version !== 'string') {
      throw new Error('File is missing file version.');
    }

    if (s.version.startsWith('1.')) {
      score = this.LoadScore_v1(s as Score_v1);
    } else {
      throw new Error(`Unrecognized file version: ${s.version}`);
    }

    return score;
  }

  public static SaveScoreToJson(s: Score) {
    const score = new Score_v1();

    score.staff = new Staff_v1();
    score.staff.elements = [];
    score.documentProperties = new DocumentProperties_v1();

    score.pageSetup = new PageSetup_v1();

    this.SaveDocumentProperties(score.documentProperties, s.documentProperties);
    if (
      score.documentProperties.title == null &&
      score.documentProperties.author == null
    ) {
      score.documentProperties = undefined;
    }
    this.SavePageSetup(score.pageSetup, s.pageSetup);
    score.paragraphStyles = s.paragraphStyles.map((style) =>
      this.SaveParagraphStyle(style),
    );
    this.SaveLyricSetup(score.staff.lyrics, s.staff.lyrics);

    this.SaveHeader(score.headers.default, s.headers.default);
    this.SaveHeader(score.headers.chapterOpening, s.headers.chapterOpening);
    this.SaveHeader(score.headers.even, s.headers.even);
    this.SaveHeader(score.headers.odd, s.headers.odd);
    this.SaveHeader(score.headers.firstPage, s.headers.firstPage);

    this.SaveFooter(score.footers.default, s.footers.default);
    this.SaveFooter(score.footers.chapterOpening, s.footers.chapterOpening);
    this.SaveFooter(score.footers.even, s.footers.even);
    this.SaveFooter(score.footers.odd, s.footers.odd);
    this.SaveFooter(score.footers.firstPage, s.footers.firstPage);

    for (const e of s.staff.elements) {
      let element: ScoreElement_v1 = new EmptyElement_v1();

      switch (e.elementType) {
        case ElementType.DropCap:
          element = new DropCapElement_v1();
          this.SaveDropCap(element as DropCapElement_v1, e as DropCapElement);
          break;
        case ElementType.Empty:
          element = new EmptyElement_v1();
          break;
        case ElementType.Martyria:
          element = new MartyriaElement_v1();
          this.SaveMartyria(
            element as MartyriaElement_v1,
            e as MartyriaElement,
          );
          break;
        case ElementType.Tempo:
          element = new TempoElement_v1();
          this.SaveTempo(element as TempoElement_v1, e as TempoElement);
          break;
        case ElementType.Note:
          element = new NoteElement_v1();
          this.SaveNote(element as NoteElement_v1, e as NoteElement);
          break;
        case ElementType.TextBox:
          element = new TextBoxElement_v1();
          this.SaveTextBox(element as TextBoxElement_v1, e as TextBoxElement);
          break;
        case ElementType.RichTextBox:
          element = new RichTextBoxElement_v1();
          this.SaveRichTextBox(
            element as RichTextBoxElement_v1,
            e as RichTextBoxElement,
          );
          break;
        case ElementType.ModeKey:
          element = new ModeKeyElement_v1();
          this.SaveModeKey(element as ModeKeyElement_v1, e as ModeKeyElement);
          break;
        case ElementType.ImageBox:
          element = new ImageBoxElement_v1();
          this.SaveImageBox(
            element as ImageBoxElement_v1,
            e as ImageBoxElement,
          );
          break;
        default:
          console.warn('Unrecognized element in score', e.elementType);
      }

      element.id = e.id ?? undefined;
      element.lineBreak = e.lineBreak || undefined;

      if (e.lineBreak) {
        element.lineBreakType = e.lineBreakType || undefined;
      }

      element.pageBreak = e.pageBreak || undefined;

      score.staff.elements.push(element);
    }

    return score;
  }

  public static SavePageSetup(pageSetup: PageSetup_v1, p: PageSetup) {
    pageSetup.bottomMargin = p.bottomMargin;

    pageSetup.leftMargin = p.leftMargin;
    pageSetup.facingPages = p.facingPages || undefined;
    pageSetup.direction =
      p.facingPages && p.direction !== 'ltr' ? p.direction : undefined;
    pageSetup.lineHeight = p.lineHeight;

    pageSetup.lyricsVerticalOffset = p.lyricsVerticalOffset;
    pageSetup.lyricsMinimumSpacing = p.lyricsMinimumSpacing;
    pageSetup.lyricsMelismaCutoffWidth = p.lyricsMelismaCutoffWidth;

    pageSetup.martyriaDefaultColor = p.martyriaDefaultColor;
    pageSetup.martyriaDefaultStrokeWidth = p.martyriaDefaultStrokeWidth;
    pageSetup.tempoDefaultColor = p.tempoDefaultColor;
    pageSetup.tempoDefaultStrokeWidth = p.tempoDefaultStrokeWidth;

    pageSetup.neumeDefaultColor = p.neumeDefaultColor;
    pageSetup.neumeDefaultFontFamily = p.neumeDefaultFontFamily;
    pageSetup.neumeDefaultStrokeWidth = p.neumeDefaultStrokeWidth;
    pageSetup.neumeDefaultFontSize = p.neumeDefaultFontSize;
    pageSetup.neumeDefaultSpacing = p.neumeDefaultSpacing;

    pageSetup.alternateLineDefaultColor = p.alternateLineDefaultColor;
    pageSetup.alternateLineDefaultFontSize = p.alternateLineDefaultFontSize;

    pageSetup.modeKeyDefaultColor = p.modeKeyDefaultColor;
    pageSetup.modeKeyDefaultStrokeWidth = p.modeKeyDefaultStrokeWidth;
    pageSetup.modeKeyDefaultFontSize = p.modeKeyDefaultFontSize;
    pageSetup.modeKeyDefaultHeightAdjustment = p.modeKeyDefaultHeightAdjustment;

    pageSetup.pageHeight = p.pageHeight;
    pageSetup.pageWidth = p.pageWidth;

    if (p.pageSize === 'Custom') {
      pageSetup.pageHeightCustom = p.pageHeightCustom;
      pageSetup.pageWidthCustom = p.pageWidthCustom;
    }

    pageSetup.rightMargin = p.rightMargin;
    pageSetup.topMargin = p.topMargin;

    pageSetup.melkiteRtl = p.melkiteRtl || undefined;

    pageSetup.headerMargin = p.headerMargin;
    pageSetup.footerMargin = p.footerMargin;
    pageSetup.headerDifferentFirstPage =
      p.headerDifferentFirstPage || undefined;
    pageSetup.headerDifferentOddEven = p.headerDifferentOddEven || undefined;
    pageSetup.headerFooterDifferentChapterOpening =
      p.headerFooterDifferentChapterOpening === false ? false : undefined;

    pageSetup.showHeader = p.showHeader || undefined;
    pageSetup.showFooter = p.showFooter || undefined;
    pageSetup.richHeaderFooter = p.richHeaderFooter || undefined;

    if (p.showHeaderHorizontalRule) {
      pageSetup.showHeaderHorizontalRule = p.showHeaderHorizontalRule;
      pageSetup.excludeHeaderHorizontalRuleChapterOpening =
        p.excludeHeaderHorizontalRuleChapterOpening;
      pageSetup.excludeHeaderHorizontalRuleEvenPage =
        p.excludeHeaderHorizontalRuleEvenPage;
      pageSetup.excludeHeaderHorizontalRuleFirstPage =
        p.excludeHeaderHorizontalRuleFirstPage;
      pageSetup.excludeHeaderHorizontalRuleOddPage =
        p.excludeHeaderHorizontalRuleOddPage;
      pageSetup.headerHorizontalRuleMarginTop = p.headerHorizontalRuleMarginTop;
      pageSetup.headerHorizontalRuleMarginBottom =
        p.headerHorizontalRuleMarginBottom;
      pageSetup.headerHorizontalRuleThickness = p.headerHorizontalRuleThickness;
      pageSetup.headerHorizontalRuleColor = p.headerHorizontalRuleColor;
    }

    if (p.showFooterHorizontalRule) {
      pageSetup.showFooterHorizontalRule = p.showFooterHorizontalRule;
      pageSetup.excludeFooterHorizontalRuleChapterOpening =
        p.excludeFooterHorizontalRuleChapterOpening;
      pageSetup.excludeFooterHorizontalRuleEvenPage =
        p.excludeFooterHorizontalRuleEvenPage;
      pageSetup.excludeFooterHorizontalRuleFirstPage =
        p.excludeFooterHorizontalRuleFirstPage;
      pageSetup.excludeFooterHorizontalRuleOddPage =
        p.excludeFooterHorizontalRuleOddPage;
      pageSetup.footerHorizontalRuleMarginTop = p.footerHorizontalRuleMarginTop;
      pageSetup.footerHorizontalRuleMarginBottom =
        p.footerHorizontalRuleMarginBottom;
      pageSetup.footerHorizontalRuleThickness = p.footerHorizontalRuleThickness;
      pageSetup.footerHorizontalRuleColor = p.footerHorizontalRuleColor;
    }

    pageSetup.firstPageNumber = p.firstPageNumber;
    pageSetup.numerals =
      p.numerals !== 'westernArabic' ? p.numerals : undefined;

    pageSetup.accidentalDefaultColor = p.accidentalDefaultColor;
    pageSetup.accidentalDefaultStrokeWidth = p.accidentalDefaultStrokeWidth;
    pageSetup.fthoraDefaultColor = p.fthoraDefaultColor;
    pageSetup.fthoraDefaultStrokeWidth = p.fthoraDefaultStrokeWidth;
    pageSetup.heteronDefaultColor = p.heteronDefaultColor;
    pageSetup.heteronDefaultStrokeWidth = p.heteronDefaultStrokeWidth;
    pageSetup.gorgonDefaultColor = p.gorgonDefaultColor;
    pageSetup.gorgonDefaultStrokeWidth = p.gorgonDefaultStrokeWidth;
    pageSetup.measureBarDefaultColor = p.measureBarDefaultColor;
    pageSetup.measureBarDefaultStrokeWidth = p.measureBarDefaultStrokeWidth;
    pageSetup.measureNumberDefaultColor = p.measureNumberDefaultColor;
    pageSetup.measureNumberDefaultStrokeWidth =
      p.measureNumberDefaultStrokeWidth;
    pageSetup.noteIndicatorDefaultColor = p.noteIndicatorDefaultColor;
    pageSetup.noteIndicatorDefaultStrokeWidth =
      p.noteIndicatorDefaultStrokeWidth;
    pageSetup.isonDefaultColor = p.isonDefaultColor;
    pageSetup.isonDefaultStrokeWidth = p.isonDefaultStrokeWidth;
    pageSetup.breathDefaultColor = p.breathDefaultColor;
    pageSetup.breathDefaultStrokeWidth = p.breathDefaultStrokeWidth;
    pageSetup.crossDefaultColor = p.crossDefaultColor;
    pageSetup.crossDefaultStrokeWidth = p.crossDefaultStrokeWidth;
    pageSetup.koronisDefaultColor = p.koronisDefaultColor;
    pageSetup.koronisDefaultStrokeWidth = p.koronisDefaultStrokeWidth;

    pageSetup.pageSize = p.pageSize;
    pageSetup.pageSizeUnit = p.pageSizeUnit;
    pageSetup.landscape = p.landscape || undefined;
    pageSetup.dropCapDefaultLineSpan = p.dropCapDefaultLineSpan;

    pageSetup.hyphenSpacing = p.hyphenSpacing;
    pageSetup.minimumSyllableToHyphenClearance =
      p.minimumSyllableToHyphenClearance;
    pageSetup.martyriaVerticalOffset = p.martyriaVerticalOffset;

    pageSetup.chrysanthineAccidentals = p.chrysanthineAccidentals;
    pageSetup.noFthoraRestrictions = p.noFthoraRestrictions || undefined;
    pageSetup.melismaStyle =
      p.melismaStyle !== MelismaStyle.Auto
        ? (p.melismaStyle as MelismaStyle_v1)
        : undefined;
    pageSetup.alignIsonIndicators = p.alignIsonIndicators || undefined;
    pageSetup.ignorePunctuationWhenPositioningLyrics =
      p.ignorePunctuationWhenPositioningLyrics || undefined;
    pageSetup.useOptionalDiatonicFthoras =
      p.useOptionalDiatonicFthoras || undefined;
  }

  public static SaveLyricSetup(lyricSetup: LyricSetup_v1, l: LyricSetup) {
    lyricSetup.locked = l.locked || undefined;
    lyricSetup.text = l.text;
  }

  public static SaveDocumentProperties(
    documentProperties: DocumentProperties_v1,
    p: DocumentProperties,
  ) {
    const title = p.title.trim();
    const author = p.author.trim();

    documentProperties.title = title === '' ? undefined : title;
    documentProperties.author = author === '' ? undefined : author;
  }

  public static SaveParagraphStyle(style: ParagraphStyle) {
    const saved = new ParagraphStyleSave_v1();
    saved.id = style.id;
    saved.displayName = style.displayName;
    saved.parentStyleId = style.parentStyleId ?? undefined;
    saved.alignment = style.overrides.alignment;
    saved.fontFamily = style.overrides.fontFamily;
    saved.fontSize = style.overrides.fontSize;
    saved.fontSubfamily = style.overrides.fontStyle;
    saved.color = style.overrides.color;
    saved.strokeWidth = style.overrides.strokeWidth;
    saved.strokeColor = style.overrides.strokeColor;
    saved.lineHeight = style.overrides.lineHeight;
    saved.textDecoration = style.overrides.textDecoration;
    saved.fontVariantCaps = style.overrides.fontVariantCaps;
    saved.fontVariantNumeric = style.overrides.fontVariantNumeric;
    saved.fontVariantLigatures = style.overrides.fontVariantLigatures;
    saved.fontVariantAlternates = style.overrides.fontVariantAlternates;
    return saved;
  }

  public static SaveHeader(header: Header_v1, h: Header) {
    // Currently, headers only support a single element
    const e = h.elements[0];

    if (e.elementType === ElementType.TextBox) {
      const element = new TextBoxElement_v1();

      this.SaveTextBox(
        element,
        e as TextBoxElement,
        BUILT_IN_PARAGRAPH_STYLE_IDS.Header,
      );

      header.elements[0] = element;
    } else if (e.elementType === ElementType.RichTextBox) {
      const element = new RichTextBoxElement_v1();

      this.SaveRichTextBox(element, e as RichTextBoxElement);

      header.elements[0] = element;
    }
  }

  public static SaveFooter(footer: Footer_v1, f: Footer) {
    // Currently, footers only support a single element
    const e = f.elements[0];

    if (e.elementType === ElementType.TextBox) {
      const element = new TextBoxElement_v1();

      this.SaveTextBox(
        element,
        e as TextBoxElement,
        BUILT_IN_PARAGRAPH_STYLE_IDS.Footer,
      );

      footer.elements[0] = element;
    } else if (e.elementType === ElementType.RichTextBox) {
      const element = new RichTextBoxElement_v1();

      this.SaveRichTextBox(element, e as RichTextBoxElement);

      footer.elements[0] = element;
    }
  }

  public static SaveDropCap(element: DropCapElement_v1, e: DropCapElement) {
    if (e.paragraphStyleId !== BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap) {
      element.paragraphStyleId = e.paragraphStyleId;
    }
    element.content = e.content;
    element.customWidth = e.customWidth ?? undefined;
    element.lineSpan = e.lineSpan;

    element.color = e.color ?? undefined;
    element.fontFamily = e.fontFamily ?? undefined;
    element.fontSize = e.fontSize ?? undefined;
    element.fontSubfamily = e.fontStyle ?? undefined;
    element.lineHeight = e.lineHeight;
    element.strokeWidth = e.strokeWidth ?? undefined;
    element.strokeColor = e.strokeColor ?? undefined;
    element.fontVariantCaps = e.fontVariantCaps ?? undefined;
    element.fontVariantNumeric = e.fontVariantNumeric ?? undefined;
    element.fontVariantLigatures = e.fontVariantLigatures ?? undefined;
    element.fontVariantAlternates = e.fontVariantAlternates ?? undefined;
  }

  public static SaveImageBox(element: ImageBoxElement_v1, e: ImageBoxElement) {
    element.imageHeight = e.imageHeight;
    element.imageWidth = e.imageWidth;
    element.alignment = e.alignment;
    element.data = e.data;
    element.inline = e.inline || undefined;
    element.lockAspectRatio = e.lockAspectRatio || undefined;
  }

  public static SaveMartyria(element: MartyriaElement_v1, e: MartyriaElement) {
    element.auto = e.auto || undefined;
    element.note = e.note;
    element.rootSign = e.rootSign;
    element.rootSignOverride = e.rootSignOverride || undefined;
    element.scale = e.scale;
    element.fthora = e.fthora || undefined;
    element.chromaticFthoraNote = e.chromaticFthoraNote || undefined;
    element.tempoLeft = e.tempoLeft || undefined;
    element.tempo = e.tempo || undefined;
    element.tempoRight = e.tempoRight || undefined;
    element.quantitativeNeume = e.quantitativeNeume || undefined;
    element.measureBarLeft = e.measureBarLeft || undefined;
    element.measureBarRight = e.measureBarRight || undefined;
    element.alignRight = e.alignRight || undefined;

    if (e.tempo != null || e.tempoLeft != null || e.tempoRight != null) {
      element.bpm = e.bpm;
    }

    element.spaceAfter = e.spaceAfter || undefined;
    element.verticalOffset = e.verticalOffset || undefined;
  }

  public static SaveTempo(element: TempoElement_v1, e: TempoElement) {
    element.neume = e.neume;
    element.bpm = e.bpm;
    element.spaceAfter = e.spaceAfter || undefined;
  }

  public static SaveNote(element: NoteElement_v1, e: NoteElement) {
    if (e.lyricsParagraphStyleId !== BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics) {
      element.lyricsParagraphStyleId = e.lyricsParagraphStyleId;
    }
    element.quantitativeNeume = e.quantitativeNeume;
    element.spaceAfter = e.spaceAfter || undefined;

    if (e.timeNeume != null) {
      element.timeNeume = e.timeNeume;
      element.timeNeumeOffsetX = e.timeNeumeOffsetX || undefined;
      element.timeNeumeOffsetY = e.timeNeumeOffsetY || undefined;
    }

    if (e.gorgonNeume != null) {
      element.gorgonNeume = e.gorgonNeume;
      element.gorgonNeumeOffsetX = e.gorgonNeumeOffsetX || undefined;
      element.gorgonNeumeOffsetY = e.gorgonNeumeOffsetY || undefined;
    }

    if (e.secondaryGorgonNeume != null) {
      element.secondaryGorgonNeume = e.secondaryGorgonNeume;
      element.secondaryGorgonNeumeOffsetX =
        e.secondaryGorgonNeumeOffsetX || undefined;
      element.secondaryGorgonNeumeOffsetY =
        e.secondaryGorgonNeumeOffsetY || undefined;
    }

    if (e.fthora != null) {
      element.fthora = e.fthora;
      element.fthoraOffsetX = e.fthoraOffsetX || undefined;
      element.fthoraOffsetY = e.fthoraOffsetY || undefined;
    }

    if (e.secondaryFthora != null) {
      element.secondaryFthora = e.secondaryFthora;
      element.secondaryFthoraOffsetX = e.secondaryFthoraOffsetX || undefined;
      element.secondaryFthoraOffsetY = e.secondaryFthoraOffsetY || undefined;
    }

    if (e.tertiaryFthora != null) {
      element.tertiaryFthora = e.tertiaryFthora;
      element.tertiaryFthoraOffsetX = e.tertiaryFthoraOffsetX || undefined;
      element.tertiaryFthoraOffsetY = e.tertiaryFthoraOffsetY || undefined;
    }

    element.chromaticFthoraNote = e.chromaticFthoraNote ?? undefined;
    element.secondaryChromaticFthoraNote =
      e.secondaryChromaticFthoraNote ?? undefined;
    element.tertiaryChromaticFthoraNote =
      e.tertiaryChromaticFthoraNote ?? undefined;

    if (e.accidental != null) {
      element.accidental = e.accidental;
      element.accidentalOffsetX = e.accidentalOffsetX || undefined;
      element.accidentalOffsetY = e.accidentalOffsetY || undefined;
    }

    if (e.secondaryAccidental != null) {
      element.secondaryAccidental = e.secondaryAccidental;
      element.secondaryAccidentalOffsetX =
        e.secondaryAccidentalOffsetX || undefined;
      element.secondaryAccidentalOffsetY =
        e.secondaryAccidentalOffsetY || undefined;
    }

    if (e.tertiaryAccidental != null) {
      element.tertiaryAccidental = e.tertiaryAccidental;
      element.tertiaryAccidentalOffsetX =
        e.tertiaryAccidentalOffsetX || undefined;
      element.tertiaryAccidentalOffsetY =
        e.tertiaryAccidentalOffsetY || undefined;
    }

    if (e.vocalExpressionNeume != null) {
      element.vocalExpressionNeume = e.vocalExpressionNeume;
      element.vocalExpressionNeumeOffsetX =
        e.vocalExpressionNeumeOffsetX || undefined;
      element.vocalExpressionNeumeOffsetY =
        e.vocalExpressionNeumeOffsetY || undefined;
    }

    if (e.measureBarLeft != null) {
      element.measureBarLeft = e.measureBarLeft;
      element.measureBarLeftOffsetX = e.measureBarLeftOffsetX || undefined;
      element.measureBarLeftOffsetY = e.measureBarLeftOffsetY || undefined;
    }

    if (e.measureBarRight != null) {
      element.measureBarRight = e.measureBarRight;
      element.measureBarRightOffsetX = e.measureBarRightOffsetX || undefined;
      element.measureBarRightOffsetY = e.measureBarRightOffsetY || undefined;
    }

    if (e.measureNumber != null) {
      element.measureNumber = e.measureNumber;
      element.measureNumberOffsetX = e.measureNumberOffsetX || undefined;
      element.measureNumberOffsetY = e.measureNumberOffsetY || undefined;
    }

    if (e.noteIndicator != null) {
      element.noteIndicatorOffsetX = e.noteIndicatorOffsetX || undefined;
      element.noteIndicatorOffsetY = e.noteIndicatorOffsetY || undefined;
    }

    if (e.ison != null) {
      element.ison = e.ison;
      element.isonOffsetX = e.isonOffsetX || undefined;
      element.isonOffsetY = e.isonOffsetY || undefined;
    }

    if (e.tie != null) {
      element.tie = e.tie;
      element.tieOffsetX = e.tieOffsetX || undefined;
      element.tieOffsetY = e.tieOffsetY || undefined;
    }

    if (e.vareia) {
      element.vareiaOffsetX = e.vareiaOffsetX || undefined;
      element.vareiaOffsetY = e.vareiaOffsetY || undefined;
    }

    if (e.koronis) {
      element.koronisOffsetX = e.koronisOffsetX || undefined;
      element.koronisOffsetY = e.koronisOffsetY || undefined;
    }

    if (e.stavros) {
      element.stavrosOffsetX = e.stavrosOffsetX || undefined;
      element.stavrosOffsetY = e.stavrosOffsetY || undefined;
    }

    element.vareia = e.vareia || undefined;
    element.noteIndicator = e.noteIndicator || undefined;
    element.koronis = e.koronis || undefined;
    element.stavros = e.stavros || undefined;

    element.lyrics = e.lyrics !== '' ? e.lyrics : undefined;
    element.isMelisma = e.isMelisma || undefined;
    element.isMelismaStart = e.isMelismaStart || undefined;
    element.isHyphen = e.isHyphen || undefined;

    element.lyricsColor = e.lyricsColor ?? undefined;
    element.lyricsFontSubfamily = e.lyricsFontStyle ?? undefined;
    element.lyricsFontFamily = e.lyricsFontFamily ?? undefined;
    element.lyricsFontSize = e.lyricsFontSize ?? undefined;
    element.lyricsTextDecoration = e.lyricsTextDecoration ?? undefined;
    element.lyricsStrokeWidth = e.lyricsStrokeWidth ?? undefined;
    element.lyricsStrokeColor = e.lyricsStrokeColor ?? undefined;
    element.lyricsFontVariantCaps = e.lyricsFontVariantCaps ?? undefined;
    element.lyricsFontVariantNumeric = e.lyricsFontVariantNumeric ?? undefined;
    element.lyricsFontVariantLigatures =
      e.lyricsFontVariantLigatures ?? undefined;
    element.lyricsFontVariantAlternates =
      e.lyricsFontVariantAlternates ?? undefined;

    element.ignoreAttractions = e.ignoreAttractions || undefined;

    if (e.acceptsLyrics !== AcceptsLyricsOption.Default) {
      element.acceptsLyrics = e.acceptsLyrics;
    }

    if (e.annotations.length > 0) {
      element.annotations = e.annotations
        .filter((x) => x.text?.trim() !== '')
        .map((a) => {
          const annotation = new AnnotationElement_v1();
          annotation.x = a.x;
          annotation.y = a.y;
          annotation.text = a.text;
          saveRichTextLanguage(annotation, a);
          return annotation;
        });
    }

    if (e.alternateLines.length > 0) {
      element.alternateLines = e.alternateLines
        .filter((x) => x.elements.length > 0)
        .map((a) => {
          const alternateLine = new AlternateLineElement_v1();
          alternateLine.x = a.x;
          alternateLine.y = a.y;

          // Only note elements are supported in alternate lines
          alternateLine.elements = a.elements
            .filter((x) => x.elementType === ElementType.Note)
            .map((x) => {
              const e = new NoteElement_v1();
              this.SaveNote(e, x as NoteElement);
              return e;
            });
          return alternateLine;
        });
    }
  }

  public static SaveTextBox(
    element: TextBoxElement_v1,
    e: TextBoxElement,
    defaultParagraphStyleId: string = getTextBoxParagraphStyleFallbackId(
      e.inline,
    ),
  ) {
    if (e.paragraphStyleId !== defaultParagraphStyleId) {
      element.paragraphStyleId = e.paragraphStyleId;
    }
    element.alignment = e.alignment ?? undefined;
    element.color = e.color ?? undefined;
    element.content = e.content;
    if (e.multipanel) {
      element.contentLeft = e.contentLeft;
      element.contentCenter = e.contentCenter;
      element.contentRight = e.contentRight;
      element.multipanel = true;
    }

    if (e.inline) {
      element.inline = e.inline;
      element.contentBottom = e.contentBottom;
    }

    element.fontFamily = e.fontFamily ?? undefined;
    element.fontSize = e.fontSize ?? undefined;
    element.strokeWidth = e.strokeWidth ?? undefined;
    element.strokeColor = e.strokeColor ?? undefined;
    element.fontSubfamily = e.fontStyle ?? undefined;
    element.underline = e.underline ?? undefined;
    element.lineHeight = e.lineHeight;
    element.fontVariantCaps = e.fontVariantCaps ?? undefined;
    element.fontVariantNumeric = e.fontVariantNumeric ?? undefined;
    element.fontVariantLigatures = e.fontVariantLigatures ?? undefined;
    element.fontVariantAlternates = e.fontVariantAlternates ?? undefined;
    element.height = e.height;
    element.customWidth = e.customWidth ?? undefined;
    element.fillWidth = e.fillWidth || undefined;
    element.customHeight = e.customHeight ?? undefined;
    element.marginTop = e.marginTop ?? undefined;
    element.marginBottom = e.marginBottom ?? undefined;
    element.runningMarkerRole = e.runningMarkerRole ?? undefined;
    element.runningMarkerText = e.runningMarkerText?.trim() || undefined;
  }

  public static SaveRichTextBox(
    element: RichTextBoxElement_v1,
    e: RichTextBoxElement,
  ) {
    element.content = e.content;

    if (e.multipanel) {
      element.contentLeft = e.contentLeft;
      element.contentCenter = e.contentCenter;
      element.contentRight = e.contentRight;
      element.multipanel = true;
    }

    if (e.inline) {
      element.inline = e.inline;
      element.contentBottom = e.contentBottom;
      element.centerOnPage = e.centerOnPage;
      element.offsetYBottom = e.offsetYBottom || undefined;
      element.offsetYTop = e.offsetYTop || undefined;
    }

    if (e.modeChange) {
      element.modeChange = e.modeChange;
      element.modeChangePhysicalNote = e.modeChangePhysicalNote;
      element.modeChangeScale = e.modeChangeScale;
      element.modeChangeVirtualNote = e.modeChangeVirtualNote ?? undefined;
      element.modeChangeBpm = e.modeChangeBpm;
      element.modeChangeIgnoreAttractions =
        e.modeChangeIgnoreAttractions ?? undefined;
      element.modeChangePermanentEnharmonicZo =
        e.modeChangePermanentEnharmonicZo ?? undefined;
    }

    element.height = e.height;
    element.customWidth = e.customWidth ?? undefined;
    element.marginTop = e.marginTop ?? undefined;
    element.marginBottom = e.marginBottom ?? undefined;
    saveRichTextLanguage(element, e);
    element.scrollable = e.scrollable || undefined;
    element.runningMarkerRole = e.runningMarkerRole ?? undefined;
    element.runningMarkerText = e.runningMarkerText?.trim() || undefined;
  }

  public static SaveModeKey(element: ModeKeyElement_v1, e: ModeKeyElement) {
    element.templateId = e.templateId || undefined;
    element.alignment = e.alignment;
    element.mode = e.mode;
    element.scale = e.scale;
    element.scaleNote = e.scaleNote;
    element.fthora = e.fthora || undefined;
    element.tempo = e.tempo || undefined;
    element.tempoAlignRight = e.tempoAlignRight || undefined;
    element.note = e.note || undefined;
    element.note2 = e.note2 || undefined;
    element.fthoraAboveNote = e.fthoraAboveNote || undefined;
    element.fthoraAboveNote2 = e.fthoraAboveNote2 || undefined;
    element.fthoraAboveQuantitativeNeumeRight =
      e.fthoraAboveQuantitativeNeumeRight || undefined;
    element.quantitativeNeumeAboveNote =
      e.quantitativeNeumeAboveNote || undefined;
    element.quantitativeNeumeAboveNote2 =
      e.quantitativeNeumeAboveNote2 || undefined;
    element.quantitativeNeumeRight = e.quantitativeNeumeRight || undefined;
    element.martyria = e.martyria;
    element.color = e.color;
    element.fontSize = e.fontSize;
    element.strokeWidth = e.strokeWidth;
    element.height = e.height;
    element.heightAdjustment = e.heightAdjustment;
    element.marginTop = e.marginTop ?? undefined;
    element.marginBottom = e.marginBottom ?? undefined;
    element.bpm = e.bpm;
    element.ignoreAttractions = e.ignoreAttractions || undefined;
    element.showAmbitus = e.showAmbitus || undefined;
    element.useDefaultStyle = e.useDefaultStyle || undefined;
    element.permanentEnharmonicZo = e.permanentEnharmonicZo || undefined;
  }

  public static LoadScore_v1(s: Score_v1) {
    const score = new Score();

    score.staff = new Staff();
    score.staff.elements = [];
    score.documentProperties = new DocumentProperties();

    score.pageSetup = new PageSetup();

    this.LoadDocumentProperties_v1(
      score.documentProperties,
      s.documentProperties ?? new DocumentProperties_v1(),
    );
    this.LoadPageSetup_v1(score.pageSetup, s.pageSetup);
    const hasLegacyStyleDefaults = hasLegacyPageSetupStyleDefaults(s.pageSetup);
    score.paragraphStyles = this.LoadParagraphStyles_v1(
      s.paragraphStyles ?? [],
      hasLegacyStyleDefaults
        ? createParagraphStylesFromLegacyPageSetupDefaults(s.pageSetup)
        : createDefaultParagraphStyles(),
    );
    if (hasLegacyStyleDefaults) {
      migrateLegacyParagraphStyleOverrides(s, score.paragraphStyles);
    }
    this.LoadLyricSetup_v1(
      score.staff.lyrics,
      s.staff.lyrics ?? new LyricSetup(),
    );

    if (s.headers) {
      const savedChapterOpeningHeader =
        s.headers.chapterOpening?.elements[0] != null
          ? s.headers.chapterOpening
          : s.headers.default;

      this.LoadHeader_v1(score.headers.default, s.headers.default);
      this.LoadHeader_v1(
        score.headers.chapterOpening,
        savedChapterOpeningHeader,
      );
      this.LoadHeader_v1(score.headers.even, s.headers.even);
      this.LoadHeader_v1(score.headers.odd, s.headers.odd);
      this.LoadHeader_v1(score.headers.firstPage, s.headers.firstPage);
    }

    if (s.footers) {
      const savedChapterOpeningFooter =
        s.footers.chapterOpening?.elements[0] != null
          ? s.footers.chapterOpening
          : s.footers.default;

      this.LoadFooter_v1(score.footers.default, s.footers.default);
      this.LoadFooter_v1(
        score.footers.chapterOpening,
        savedChapterOpeningFooter,
      );
      this.LoadFooter_v1(score.footers.even, s.footers.even);
      this.LoadFooter_v1(score.footers.odd, s.footers.odd);
      this.LoadFooter_v1(score.footers.firstPage, s.footers.firstPage);
    }

    for (const e of s.staff.elements) {
      let element: ScoreElement = new EmptyElement();

      switch (e.elementType) {
        case ElementType_v1.DropCap:
          element = new DropCapElement();
          this.LoadDropCap_v1(
            element as DropCapElement,
            e as DropCapElement_v1,
            score.pageSetup,
          );
          break;
        case ElementType_v1.Empty:
          element = new EmptyElement();
          break;
        case ElementType_v1.Martyria:
          element = new MartyriaElement();
          this.LoadMartyria_v1(
            element as MartyriaElement,
            e as MartyriaElement_v1,
          );
          break;
        case ElementType_v1.Tempo:
          element = new TempoElement();
          this.LoadTempo_v1(element as TempoElement, e as TempoElement_v1);
          break;
        case ElementType_v1.Note:
          element = new NoteElement();
          this.LoadNote_v1(element as NoteElement, e as NoteElement_v1);
          break;
        case ElementType_v1.TextBox:
          element = new TextBoxElement();
          this.LoadTextBox_v1(
            element as TextBoxElement,
            e as TextBoxElement_v1,
          );
          break;
        case ElementType_v1.RichTextBox:
          element = new RichTextBoxElement();
          this.LoadRichTextBox_v1(
            element as RichTextBoxElement,
            e as RichTextBoxElement_v1,
          );
          break;
        case ElementType_v1.ModeKey:
          element = new ModeKeyElement();
          this.LoadModeKey_v1(
            element as ModeKeyElement,
            e as ModeKeyElement_v1,
          );
          break;

        case ElementType_v1.ImageBox:
          element = new ImageBoxElement();
          this.LoadImageBox_v1(
            element as ImageBoxElement,
            e as ImageBoxElement_v1,
          );
          break;
        default:
          console.warn(
            'Unrecognized element in score file',
            'v1',
            e.elementType,
          );
      }

      const legacyElement = e as ScoreElement_v1 &
        LegacySectionNameCompatibility;

      element.id = e.id ?? null;
      element.lineBreak = e.lineBreak === true;
      element.lineBreakType = e.lineBreakType ?? LineBreakType.Left;
      element.pageBreak = e.pageBreak === true;
      this.applyLegacySectionNameToRunningMarker(
        element,
        normalizeLegacySectionName(legacyElement.sectionName),
      );

      score.staff.elements.push(element);
    }

    return score;
  }

  public static LoadPageSetup_v1(pageSetup: PageSetup, p: PageSetup_v1) {
    pageSetup.pageHeight = p.pageHeight;
    pageSetup.pageWidth = p.pageWidth;

    pageSetup.pageHeightCustom =
      p.pageHeightCustom ?? pageSetup.pageHeightCustom;
    pageSetup.pageWidthCustom = p.pageWidthCustom ?? pageSetup.pageWidthCustom;

    pageSetup.topMargin = p.topMargin;
    pageSetup.bottomMargin = p.bottomMargin;
    pageSetup.leftMargin = p.leftMargin;
    pageSetup.rightMargin = p.rightMargin;
    pageSetup.facingPages = p.facingPages === true;
    pageSetup.direction =
      p.facingPages === true && p.direction === 'rtl' ? 'rtl' : 'ltr';

    if (p.headerMargin != null) {
      pageSetup.headerMargin = p.headerMargin;
    }

    if (p.footerMargin != null) {
      pageSetup.footerMargin = p.footerMargin;
    }

    pageSetup.melkiteRtl = p.melkiteRtl === true;

    pageSetup.headerDifferentFirstPage = p.headerDifferentFirstPage === true;
    pageSetup.headerDifferentOddEven = p.headerDifferentOddEven === true;
    pageSetup.headerFooterDifferentChapterOpening =
      p.headerFooterDifferentChapterOpening !== false;
    pageSetup.showHeader = p.showHeader === true;
    pageSetup.showFooter = p.showFooter === true;
    pageSetup.richHeaderFooter = p.richHeaderFooter === true;
    pageSetup.firstPageNumber = p.firstPageNumber ?? pageSetup.firstPageNumber;
    pageSetup.numerals =
      p.numerals === 'easternArabic' ? 'easternArabic' : 'westernArabic';

    if (p.showHeaderHorizontalRule === true) {
      pageSetup.showHeaderHorizontalRule = p.showHeaderHorizontalRule;
      pageSetup.excludeHeaderHorizontalRuleChapterOpening =
        p.excludeHeaderHorizontalRuleChapterOpening === true;
      pageSetup.excludeHeaderHorizontalRuleEvenPage =
        p.excludeHeaderHorizontalRuleEvenPage === true;
      pageSetup.excludeHeaderHorizontalRuleFirstPage =
        p.excludeHeaderHorizontalRuleFirstPage === true;
      pageSetup.excludeHeaderHorizontalRuleOddPage =
        p.excludeHeaderHorizontalRuleOddPage === true;
      pageSetup.headerHorizontalRuleMarginTop =
        p.headerHorizontalRuleMarginTop ??
        pageSetup.headerHorizontalRuleMarginTop;
      pageSetup.headerHorizontalRuleMarginBottom =
        p.headerHorizontalRuleMarginBottom ??
        pageSetup.headerHorizontalRuleMarginBottom;
      pageSetup.headerHorizontalRuleThickness =
        p.headerHorizontalRuleThickness ??
        pageSetup.headerHorizontalRuleThickness;
      pageSetup.headerHorizontalRuleColor =
        p.headerHorizontalRuleColor ?? pageSetup.headerHorizontalRuleColor;
    }

    if (p.showFooterHorizontalRule === true) {
      pageSetup.showFooterHorizontalRule = p.showFooterHorizontalRule;
      pageSetup.excludeFooterHorizontalRuleChapterOpening =
        p.excludeFooterHorizontalRuleChapterOpening === true;
      pageSetup.excludeFooterHorizontalRuleEvenPage =
        p.excludeFooterHorizontalRuleEvenPage === true;
      pageSetup.excludeFooterHorizontalRuleFirstPage =
        p.excludeFooterHorizontalRuleFirstPage === true;
      pageSetup.excludeFooterHorizontalRuleOddPage =
        p.excludeFooterHorizontalRuleOddPage === true;
      pageSetup.footerHorizontalRuleMarginTop =
        p.footerHorizontalRuleMarginTop ??
        pageSetup.footerHorizontalRuleMarginTop;
      pageSetup.footerHorizontalRuleMarginBottom =
        p.footerHorizontalRuleMarginBottom ??
        pageSetup.footerHorizontalRuleMarginBottom;
      pageSetup.footerHorizontalRuleThickness =
        p.footerHorizontalRuleThickness ??
        pageSetup.footerHorizontalRuleThickness;
      pageSetup.footerHorizontalRuleColor =
        p.footerHorizontalRuleColor ?? pageSetup.footerHorizontalRuleColor;
    }

    pageSetup.lineHeight = p.lineHeight;
    pageSetup.dropCapDefaultLineSpan =
      p.dropCapDefaultLineSpan ?? pageSetup.dropCapDefaultLineSpan;
    pageSetup.lyricsVerticalOffset = p.lyricsVerticalOffset;
    pageSetup.lyricsMinimumSpacing =
      p.lyricsMinimumSpacing ?? pageSetup.lyricsMinimumSpacing;
    pageSetup.lyricsMelismaCutoffWidth =
      p.lyricsMelismaCutoffWidth ?? pageSetup.lyricsMelismaCutoffWidth;

    pageSetup.martyriaDefaultColor =
      p.martyriaDefaultColor ?? pageSetup.martyriaDefaultColor;
    pageSetup.martyriaDefaultStrokeWidth =
      p.martyriaDefaultStrokeWidth ?? pageSetup.martyriaDefaultStrokeWidth;
    pageSetup.tempoDefaultColor =
      p.tempoDefaultColor ?? pageSetup.tempoDefaultColor;
    pageSetup.tempoDefaultStrokeWidth =
      p.tempoDefaultStrokeWidth ?? pageSetup.tempoDefaultStrokeWidth;

    pageSetup.neumeDefaultColor =
      p.neumeDefaultColor ?? pageSetup.neumeDefaultColor;
    pageSetup.neumeDefaultFontFamily =
      p.neumeDefaultFontFamily ?? pageSetup.neumeDefaultFontFamily;
    pageSetup.neumeDefaultFontSize = p.neumeDefaultFontSize;
    pageSetup.neumeDefaultStrokeWidth =
      p.neumeDefaultStrokeWidth ?? pageSetup.neumeDefaultStrokeWidth;
    pageSetup.neumeDefaultSpacing = p.neumeDefaultSpacing;

    pageSetup.alternateLineDefaultColor =
      p.alternateLineDefaultColor ?? pageSetup.alternateLineDefaultColor;
    pageSetup.alternateLineDefaultFontSize =
      p.alternateLineDefaultFontSize ?? pageSetup.alternateLineDefaultFontSize;

    pageSetup.modeKeyDefaultColor =
      p.modeKeyDefaultColor ?? pageSetup.modeKeyDefaultColor;
    pageSetup.modeKeyDefaultStrokeWidth =
      p.modeKeyDefaultStrokeWidth ?? pageSetup.modeKeyDefaultStrokeWidth;
    pageSetup.modeKeyDefaultFontSize =
      p.modeKeyDefaultFontSize ?? pageSetup.modeKeyDefaultFontSize;
    pageSetup.modeKeyDefaultHeightAdjustment =
      p.modeKeyDefaultHeightAdjustment ??
      pageSetup.modeKeyDefaultHeightAdjustment;

    pageSetup.accidentalDefaultColor =
      p.accidentalDefaultColor ?? pageSetup.accidentalDefaultColor;
    pageSetup.accidentalDefaultStrokeWidth =
      p.accidentalDefaultStrokeWidth ?? pageSetup.accidentalDefaultStrokeWidth;
    pageSetup.fthoraDefaultColor =
      p.fthoraDefaultColor ?? pageSetup.fthoraDefaultColor;
    pageSetup.fthoraDefaultStrokeWidth =
      p.fthoraDefaultStrokeWidth ?? pageSetup.fthoraDefaultStrokeWidth;
    pageSetup.heteronDefaultColor =
      p.heteronDefaultColor ?? pageSetup.heteronDefaultColor;
    pageSetup.heteronDefaultStrokeWidth =
      p.heteronDefaultStrokeWidth ?? pageSetup.heteronDefaultStrokeWidth;
    pageSetup.gorgonDefaultColor =
      p.gorgonDefaultColor ?? pageSetup.gorgonDefaultColor;
    pageSetup.gorgonDefaultStrokeWidth =
      p.gorgonDefaultStrokeWidth ?? pageSetup.gorgonDefaultStrokeWidth;
    pageSetup.measureBarDefaultColor =
      p.measureBarDefaultColor ?? pageSetup.measureBarDefaultColor;
    pageSetup.measureBarDefaultStrokeWidth =
      p.measureBarDefaultStrokeWidth ?? pageSetup.measureBarDefaultStrokeWidth;
    pageSetup.measureNumberDefaultColor =
      p.measureNumberDefaultColor ?? pageSetup.measureNumberDefaultColor;
    pageSetup.measureNumberDefaultStrokeWidth =
      p.measureNumberDefaultStrokeWidth ??
      pageSetup.measureNumberDefaultStrokeWidth;
    pageSetup.noteIndicatorDefaultColor =
      p.noteIndicatorDefaultColor ?? pageSetup.noteIndicatorDefaultColor;
    pageSetup.noteIndicatorDefaultStrokeWidth =
      p.noteIndicatorDefaultStrokeWidth ??
      pageSetup.noteIndicatorDefaultStrokeWidth;
    pageSetup.isonDefaultColor =
      p.isonDefaultColor ?? pageSetup.isonDefaultColor;
    pageSetup.isonDefaultStrokeWidth =
      p.isonDefaultStrokeWidth ?? pageSetup.isonDefaultStrokeWidth;
    pageSetup.breathDefaultColor =
      p.breathDefaultColor ?? pageSetup.breathDefaultColor;
    pageSetup.breathDefaultStrokeWidth =
      p.breathDefaultStrokeWidth ?? pageSetup.breathDefaultStrokeWidth;
    pageSetup.crossDefaultColor =
      p.crossDefaultColor ?? pageSetup.crossDefaultColor;
    pageSetup.crossDefaultStrokeWidth =
      p.crossDefaultStrokeWidth ?? pageSetup.crossDefaultStrokeWidth;
    pageSetup.koronisDefaultColor =
      p.koronisDefaultColor ?? pageSetup.koronisDefaultColor;
    pageSetup.koronisDefaultStrokeWidth =
      p.koronisDefaultStrokeWidth ?? pageSetup.koronisDefaultStrokeWidth;

    pageSetup.pageSize = p.pageSize ?? pageSetup.pageSize;
    pageSetup.pageSizeUnit = p.pageSizeUnit ?? pageSetup.pageSizeUnit;
    pageSetup.landscape = p.landscape === true;

    pageSetup.hyphenSpacing = p.hyphenSpacing;
    pageSetup.minimumSyllableToHyphenClearance =
      p.minimumSyllableToHyphenClearance ?? (pageSetup.hyphenSpacing * 4) / 15;
    pageSetup.martyriaVerticalOffset = p.martyriaVerticalOffset ?? 0; // for old files, use 0 so that we don't change the them

    pageSetup.chrysanthineAccidentals =
      p.chrysanthineAccidentals === true ||
      p.chrysanthineAccidentals === undefined;
    pageSetup.noFthoraRestrictions = p.noFthoraRestrictions === true;
    const savedMelismaStyle = p.melismaStyle as MelismaStyle;

    if (Object.values(MelismaStyle).includes(savedMelismaStyle)) {
      pageSetup.melismaStyle = savedMelismaStyle;
    } else if (p.disableGreekMelismata === true) {
      pageSetup.melismaStyle = MelismaStyle.Western;
    } else {
      pageSetup.melismaStyle = MelismaStyle.Auto;
    }
    pageSetup.alignIsonIndicators = p.alignIsonIndicators === true;
    pageSetup.ignorePunctuationWhenPositioningLyrics =
      p.ignorePunctuationWhenPositioningLyrics === true;
    pageSetup.useOptionalDiatonicFthoras =
      p.useOptionalDiatonicFthoras === true;

    // Fix pageWidth and pageHeight
    // Due to bug #71, A-series paper sizes had incorrect width and height
    if (pageSetup.pageSize !== 'Custom') {
      const pageSize = pageSizes.find((x) => x.name === pageSetup.pageSize);
      if (pageSize) {
        if (pageSetup.landscape) {
          pageSetup.pageWidth = pageSize.height;
          pageSetup.pageHeight = pageSize.width;
        } else {
          pageSetup.pageWidth = pageSize.width;
          pageSetup.pageHeight = pageSize.height;
        }
      }
    }
  }

  public static LoadParagraphStyle_v1(saved: ParagraphStyle_v1) {
    const style = new ParagraphStyle();
    style.id = saved.id;
    style.displayName = saved.displayName;
    style.parentStyleId = saved.parentStyleId ?? null;
    const overrides: ParagraphStyleOverrides = {};

    if (saved.alignment !== undefined) {
      overrides.alignment = saved.alignment;
    }

    if (saved.fontFamily !== undefined) {
      overrides.fontFamily = saved.fontFamily;
    }

    if (saved.fontSize !== undefined) {
      overrides.fontSize = saved.fontSize;
    }

    if (saved.fontSubfamily !== undefined) {
      overrides.fontStyle = saved.fontSubfamily;
    }

    if (saved.color !== undefined) {
      overrides.color = saved.color;
    }

    if (saved.strokeWidth !== undefined) {
      overrides.strokeWidth = saved.strokeWidth;
    }

    if (saved.strokeColor !== undefined) {
      overrides.strokeColor = saved.strokeColor;
    }

    if (saved.lineHeight !== undefined) {
      overrides.lineHeight = saved.lineHeight;
    }

    if (saved.textDecoration !== undefined) {
      overrides.textDecoration = saved.textDecoration;
    }

    if (saved.fontVariantCaps !== undefined) {
      overrides.fontVariantCaps = saved.fontVariantCaps;
    }

    if (saved.fontVariantNumeric !== undefined) {
      overrides.fontVariantNumeric = saved.fontVariantNumeric;
    }

    if (saved.fontVariantLigatures !== undefined) {
      overrides.fontVariantLigatures = saved.fontVariantLigatures;
    }

    if (saved.fontVariantAlternates !== undefined) {
      overrides.fontVariantAlternates = saved.fontVariantAlternates;
    }

    style.overrides = overrides;
    return style;
  }

  private static LoadParagraphStyles_v1(
    savedParagraphStyles: ParagraphStyle_v1[],
    defaultParagraphStyles: ParagraphStyle[],
  ) {
    if (savedParagraphStyles.length === 0) {
      return defaultParagraphStyles;
    }

    const loadedParagraphStyles = savedParagraphStyles.map((style) =>
      this.LoadParagraphStyle_v1(style),
    );
    const builtInStyleIds = new Set(
      defaultParagraphStyles.map((style) => style.id),
    );
    const savedBuiltIns = new Map<string, ParagraphStyle>();
    const customStyles = new Map<string, ParagraphStyle>();

    for (const style of loadedParagraphStyles) {
      const target = builtInStyleIds.has(style.id)
        ? savedBuiltIns
        : customStyles;

      if (!target.has(style.id)) {
        target.set(style.id, style);
      }
    }

    return [
      ...defaultParagraphStyles.map(
        (defaultStyle) => savedBuiltIns.get(defaultStyle.id) ?? defaultStyle,
      ),
      ...customStyles.values(),
    ];
  }

  public static LoadLyricSetup_v1(lyricSetup: LyricSetup, l: LyricSetup_v1) {
    lyricSetup.locked = l.locked === true;
    lyricSetup.text = l.text;
  }

  public static LoadHeader_v1(header: Header, h: Header_v1) {
    // Currently, headers only support a single element
    const e = h.elements[0];

    if (e.elementType === ElementType.TextBox) {
      const element = new TextBoxElement();

      this.LoadTextBox_v1(
        element,
        e as TextBoxElement_v1,
        BUILT_IN_PARAGRAPH_STYLE_IDS.Header,
      );

      header.elements[0] = element;
    } else if (e.elementType === ElementType.RichTextBox) {
      const element = new RichTextBoxElement();

      this.LoadRichTextBox_v1(element, e as RichTextBoxElement_v1);

      header.elements[0] = element;
    }
  }

  public static LoadFooter_v1(footer: Footer, f: Footer_v1) {
    // Currently, footers only support a single element
    const e = f.elements[0];

    if (e.elementType === ElementType.TextBox) {
      const element = new TextBoxElement();

      this.LoadTextBox_v1(
        element,
        e as TextBoxElement_v1,
        BUILT_IN_PARAGRAPH_STYLE_IDS.Footer,
      );

      footer.elements[0] = element;
    } else if (e.elementType === ElementType.RichTextBox) {
      const element = new RichTextBoxElement();

      this.LoadRichTextBox_v1(element, e as RichTextBoxElement_v1);

      footer.elements[0] = element;
    }
  }

  public static LoadDropCap_v1(
    element: DropCapElement,
    e: DropCapElement_v1,
    pageSetup: PageSetup,
  ) {
    element.content = e.content;
    element.customWidth = e.customWidth ?? null;
    element.lineSpan = e.lineSpan ?? pageSetup.dropCapDefaultLineSpan;
    element.paragraphStyleId =
      e.paragraphStyleId ?? BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap;
    element.fontFamily = e.fontFamily ?? null;
    element.color = e.color ?? null;
    element.fontSize = e.fontSize ?? null;
    element.lineHeight = e.lineHeight;
    element.fontStyle = normalizeSavedFontSubfamily(e.fontSubfamily) ?? null;
    element.strokeWidth = e.strokeWidth ?? null;
    element.strokeColor = e.strokeColor ?? null;
    element.fontVariantCaps = e.fontVariantCaps ?? null;
    element.fontVariantNumeric = e.fontVariantNumeric ?? null;
    element.fontVariantLigatures = e.fontVariantLigatures ?? null;
    element.fontVariantAlternates = e.fontVariantAlternates ?? null;
  }

  public static LoadImageBox_v1(
    element: ImageBoxElement,
    e: ImageBoxElement_v1,
  ) {
    element.imageHeight = e.imageHeight;
    element.imageWidth = e.imageWidth;
    element.alignment = e.alignment ?? null;
    element.data = e.data;
    element.inline = e.inline === true;
    element.lockAspectRatio = e.lockAspectRatio === true;
  }

  public static LoadMartyria_v1(
    element: MartyriaElement,
    e: MartyriaElement_v1,
  ) {
    element.auto = e.auto === true;
    element.alignRight = e.alignRight === true;
    element.note = e.note;
    element.scale = e.scale;
    element.rootSign = e.rootSign;
    element.rootSignOverride = e.rootSignOverride || null;
    element.spaceAfter = e.spaceAfter ?? 0;
    element.verticalOffset = e.verticalOffset ?? 0;

    if (e.fthora != null) {
      element.fthora = e.fthora;
    }

    if (e.chromaticFthoraNote != null) {
      element.chromaticFthoraNote = e.chromaticFthoraNote;
    }

    if (e.tempoLeft != null) {
      element.tempoLeft = e.tempoLeft;
      element.bpm = e.bpm ?? TempoElement.getDefaultBpm(element.tempoLeft);
    }

    if (e.tempo != null) {
      element.tempo = e.tempo;
      element.bpm = e.bpm ?? TempoElement.getDefaultBpm(element.tempo);
    }

    if (e.tempoRight != null) {
      element.tempoRight = e.tempoRight;
      element.bpm = e.bpm ?? TempoElement.getDefaultBpm(element.tempoRight);
    }

    if (e.measureBarLeft != null) {
      element.measureBarLeft = e.measureBarLeft;
    }

    if (e.measureBar != null) {
      element.measureBarRight = e.measureBar;
    }

    if (e.measureBarRight != null) {
      element.measureBarRight = e.measureBarRight ?? e.measureBar;
    }

    element.quantitativeNeume = e.quantitativeNeume ?? null;
  }

  public static LoadTempo_v1(element: TempoElement, e: TempoElement_v1) {
    element.neume = e.neume;
    element.bpm = e.bpm ?? TempoElement.getDefaultBpm(element.neume);
    element.spaceAfter = e.spaceAfter ?? 0;
  }

  public static LoadNote_v1(element: NoteElement, e: NoteElement_v1) {
    element.lyricsParagraphStyleId =
      e.lyricsParagraphStyleId ?? BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics;
    element.quantitativeNeume = Object.values(QuantitativeNeume).includes(
      e.quantitativeNeume,
    )
      ? e.quantitativeNeume
      : QuantitativeNeume.Ison;

    if (e.timeNeume != null) {
      element.timeNeume = e.timeNeume;
      element.timeNeumeOffsetX = e.timeNeumeOffsetX ?? null;
      element.timeNeumeOffsetY = e.timeNeumeOffsetY ?? null;
    }

    if (e.gorgonNeume != null) {
      element.gorgonNeume = e.gorgonNeume;
      element.gorgonNeumeOffsetX = e.gorgonNeumeOffsetX ?? null;
      element.gorgonNeumeOffsetY = e.gorgonNeumeOffsetY ?? null;
    }

    if (e.secondaryGorgonNeume != null) {
      element.secondaryGorgonNeume = e.secondaryGorgonNeume;
      element.secondaryGorgonNeumeOffsetX =
        e.secondaryGorgonNeumeOffsetX ?? null;
      element.secondaryGorgonNeumeOffsetY =
        e.secondaryGorgonNeumeOffsetY ?? null;
    }

    if (e.fthora != null) {
      element.fthora = e.fthora;
      element.fthoraOffsetX = e.fthoraOffsetX ?? null;
      element.fthoraOffsetY = e.fthoraOffsetY ?? null;
    }

    if (e.secondaryFthora != null) {
      element.secondaryFthora = e.secondaryFthora;
      element.secondaryFthoraOffsetX = e.secondaryFthoraOffsetX ?? null;
      element.secondaryFthoraOffsetY = e.secondaryFthoraOffsetY ?? null;
    }

    if (e.tertiaryFthora != null) {
      element.tertiaryFthora = e.tertiaryFthora;
      element.tertiaryFthoraOffsetX = e.tertiaryFthoraOffsetX ?? null;
      element.tertiaryFthoraOffsetY = e.tertiaryFthoraOffsetY ?? null;
    }

    element.chromaticFthoraNote = e.chromaticFthoraNote ?? null;
    element.secondaryChromaticFthoraNote =
      e.secondaryChromaticFthoraNote ?? null;
    element.tertiaryChromaticFthoraNote = e.tertiaryChromaticFthoraNote ?? null;

    if (e.accidental != null) {
      element.accidental = e.accidental;
      element.accidentalOffsetX = e.accidentalOffsetX ?? null;
      element.accidentalOffsetY = e.accidentalOffsetY ?? null;
    }

    if (e.secondaryAccidental != null) {
      element.secondaryAccidental = e.secondaryAccidental;
      element.secondaryAccidentalOffsetX = e.secondaryAccidentalOffsetX ?? null;
      element.secondaryAccidentalOffsetY = e.secondaryAccidentalOffsetY ?? null;
    }

    if (e.tertiaryAccidental != null) {
      element.tertiaryAccidental = e.tertiaryAccidental;
      element.tertiaryAccidentalOffsetX = e.tertiaryAccidentalOffsetX ?? null;
      element.tertiaryAccidentalOffsetY = e.tertiaryAccidentalOffsetY ?? null;
    }

    if (e.vocalExpressionNeume != null) {
      element.vocalExpressionNeume = e.vocalExpressionNeume;
      element.vocalExpressionNeumeOffsetX =
        e.vocalExpressionNeumeOffsetX ?? null;
      element.vocalExpressionNeumeOffsetY =
        e.vocalExpressionNeumeOffsetY ?? null;
    }

    if (e.measureBarLeft != null) {
      element.measureBarLeft = e.measureBarLeft;
      element.measureBarLeftOffsetX = e.measureBarLeftOffsetX ?? null;
      element.measureBarLeftOffsetY = e.measureBarLeftOffsetY ?? null;
    }

    if (e.measureBar != null) {
      element.measureBarRight = e.measureBar;
    }

    if (e.measureBarRight != null) {
      element.measureBarRight = e.measureBarRight;
      element.measureBarRightOffsetX = e.measureBarRightOffsetX ?? null;
      element.measureBarRightOffsetY = e.measureBarRightOffsetY ?? null;
    }

    if (e.measureNumber != null) {
      element.measureNumber = e.measureNumber;
      element.measureNumberOffsetX = e.measureNumberOffsetX ?? null;
      element.measureNumberOffsetY = e.measureNumberOffsetY ?? null;
    }

    // For backwards compatibility, noteIndicator used to be a string | undefined
    element.noteIndicator =
      e.noteIndicator !== undefined && e.noteIndicator !== false;

    if (element.noteIndicator) {
      element.noteIndicatorOffsetX = e.noteIndicatorOffsetX ?? null;
      element.noteIndicatorOffsetY = e.noteIndicatorOffsetY ?? null;
    }

    if (e.ison != null) {
      element.ison = e.ison;
      element.isonOffsetX = e.isonOffsetX ?? null;
      element.isonOffsetY = e.isonOffsetY ?? null;
    }

    if (e.tie != null) {
      element.tie = e.tie;
      element.tieOffsetX = e.tieOffsetX ?? null;
      element.tieOffsetY = e.tieOffsetY ?? null;
    }

    if (e.lyrics != null) {
      element.lyrics = e.lyrics;
    }

    if (e.vareia === true) {
      element.vareiaOffsetX = e.vareiaOffsetX ?? null;
      element.vareiaOffsetY = e.vareiaOffsetY ?? null;
    }

    if (e.koronis === true) {
      element.koronisOffsetX = e.koronisOffsetX ?? null;
      element.koronisOffsetY = e.koronisOffsetY ?? null;
    }

    if (e.stavros === true) {
      element.stavrosOffsetX = e.stavrosOffsetX ?? null;
      element.stavrosOffsetY = e.stavrosOffsetY ?? null;
    }

    element.vareia = e.vareia === true;
    element.koronis = e.koronis === true;
    element.stavros = e.stavros === true;

    element.isMelisma = e.isMelisma === true;
    element.isMelismaStart = e.isMelismaStart === true;
    element.isHyphen = e.isHyphen === true;
    element.ignoreAttractions = e.ignoreAttractions === true;
    element.spaceAfter = e.spaceAfter ?? 0;

    element.lyricsFontFamily = e.lyricsFontFamily ?? null;
    element.lyricsColor = e.lyricsColor ?? null;
    element.lyricsFontSize = e.lyricsFontSize ?? null;
    element.lyricsFontStyle =
      normalizeSavedFontSubfamily(e.lyricsFontSubfamily) ?? null;
    element.lyricsTextDecoration = e.lyricsTextDecoration ?? null;
    element.lyricsStrokeWidth = e.lyricsStrokeWidth ?? null;
    element.lyricsStrokeColor = e.lyricsStrokeColor ?? null;
    element.lyricsFontVariantCaps = e.lyricsFontVariantCaps ?? null;
    element.lyricsFontVariantNumeric = e.lyricsFontVariantNumeric ?? null;
    element.lyricsFontVariantLigatures = e.lyricsFontVariantLigatures ?? null;
    element.lyricsFontVariantAlternates = e.lyricsFontVariantAlternates ?? null;

    if (e.acceptsLyrics !== undefined) {
      element.acceptsLyrics = e.acceptsLyrics;
    } else {
      element.acceptsLyrics = AcceptsLyricsOption.Default;
    }

    try {
      if (e.annotations) {
        element.annotations = e.annotations.map((a) => {
          const annotation = new AnnotationElement();
          annotation.text = a.text;
          annotation.x = a.x;
          annotation.y = a.y;
          loadRichTextLanguage(annotation, a);

          return annotation;
        });
      }
    } catch (error) {
      console.warn('Error loading annotations:', error);
      element.annotations = [];
    }

    try {
      if (e.alternateLines) {
        element.alternateLines = e.alternateLines.map((a) => {
          const alternateLine = new AlternateLineElement();
          alternateLine.x = a.x;
          alternateLine.y = a.y;

          alternateLine.elements = a.elements
            .filter((x) => x.elementType === ElementType.Note)
            .map((x) => {
              const e = new NoteElement();
              this.LoadNote_v1(e, x as NoteElement_v1);
              return e;
            });

          return alternateLine;
        });
      }
    } catch (error) {
      console.warn('Error loading alternate lines:', error);
      element.alternateLines = [];
    }
  }

  public static LoadTextBox_v1(
    element: TextBoxElement,
    e: TextBoxElement_v1,
    defaultParagraphStyleId: string = getTextBoxParagraphStyleFallbackId(
      e.inline === true,
    ),
  ) {
    element.paragraphStyleId = e.paragraphStyleId ?? defaultParagraphStyleId;
    element.content = e.content;

    if (e.multipanel) {
      element.contentLeft = e.contentLeft;
      element.contentCenter = e.contentCenter;
      element.contentRight = e.contentRight;
    }

    if (e.inline) {
      element.contentBottom = e.contentBottom;
    }

    element.multipanel = e.multipanel === true;
    element.inline = e.inline === true;
    element.underline = e.underline ?? null;
    element.height = e.height;
    element.customWidth = e.customWidth ?? null;
    element.fillWidth = e.fillWidth === true;
    element.customHeight = e.customHeight ?? null;
    element.marginTop = e.marginTop ?? 0;
    element.marginBottom = e.marginBottom ?? 0;
    element.runningMarkerRole = e.runningMarkerRole ?? null;
    element.runningMarkerText = e.runningMarkerText?.trim() || null;
    element.alignment = e.alignment ?? null;
    element.fontFamily = e.fontFamily ?? null;
    element.fontStyle = normalizeSavedFontSubfamily(e.fontSubfamily) ?? null;
    element.fontSize = e.fontSize ?? null;
    element.color = e.color ?? null;
    element.strokeWidth = e.strokeWidth ?? null;
    element.strokeColor = e.strokeColor ?? null;
    element.lineHeight = e.lineHeight;
    element.fontVariantCaps = e.fontVariantCaps ?? null;
    element.fontVariantNumeric = e.fontVariantNumeric ?? null;
    element.fontVariantLigatures = e.fontVariantLigatures ?? null;
    element.fontVariantAlternates = e.fontVariantAlternates ?? null;
  }

  public static LoadRichTextBox_v1(
    element: RichTextBoxElement,
    e: RichTextBoxElement_v1,
  ) {
    element.content = e.content;
    element.height = e.height;
    element.marginTop = e.marginTop ?? 0;
    element.marginBottom = e.marginBottom ?? 0;

    if (e.multipanel) {
      element.contentLeft = e.contentLeft;
      element.contentCenter = e.contentCenter;
      element.contentRight = e.contentRight;
    }

    if (e.inline) {
      element.contentBottom = e.contentBottom;
      element.centerOnPage = e.centerOnPage === true;
      element.offsetYBottom = e.offsetYBottom ?? 0;
      element.offsetYTop = e.offsetYTop ?? 0;
    }

    if (e.modeChange) {
      element.modeChangePhysicalNote = e.modeChangePhysicalNote;
      element.modeChangeScale = e.modeChangeScale;
      element.modeChangeVirtualNote = e.modeChangeVirtualNote ?? null;
      element.modeChangeBpm = e.modeChangeBpm;
      element.modeChangeIgnoreAttractions =
        e.modeChangeIgnoreAttractions === true;
      element.modeChangePermanentEnharmonicZo =
        e.modeChangePermanentEnharmonicZo === true;
    }

    element.customWidth = e.customWidth ?? null;

    element.modeChange = e.modeChange === true;
    element.inline = e.inline === true;
    element.multipanel = e.multipanel === true;
    element.scrollable = e.scrollable === true;

    loadRichTextLanguage(element, e);

    if (
      element.languageCode == null &&
      (e as RichTextBoxElement_v1 & { rtl?: boolean }).rtl === true
    ) {
      element.languageCode = 'ar';
      element.textDirection = 'rtl';
    }

    element.runningMarkerRole = e.runningMarkerRole ?? null;
    element.runningMarkerText = e.runningMarkerText?.trim() || null;
  }

  private static applyLegacySectionNameToRunningMarker(
    element: ScoreElement,
    legacySectionName: string | null,
  ) {
    if (legacySectionName == null) {
      return;
    }

    if (
      element.elementType !== ElementType.TextBox &&
      element.elementType !== ElementType.RichTextBox
    ) {
      return;
    }

    const runningMarkerElement = element as TextBoxElement | RichTextBoxElement;
    runningMarkerElement.runningMarkerRole = 'section';

    if ((runningMarkerElement.runningMarkerText?.trim() ?? '') === '') {
      runningMarkerElement.runningMarkerText = legacySectionName;
    }
  }

  public static LoadDocumentProperties_v1(
    documentProperties: DocumentProperties,
    p: DocumentProperties_v1,
  ) {
    documentProperties.title = p.title?.trim() ?? '';
    documentProperties.author = p.author?.trim() ?? '';
  }

  public static LoadModeKey_v1(element: ModeKeyElement, e: ModeKeyElement_v1) {
    element.templateId = e.templateId ?? null;
    element.alignment = e.alignment;
    element.mode = e.mode;
    element.scale = e.scale;
    element.scaleNote = e.scaleNote;
    element.tempo = e.tempo ?? null;
    element.tempoAlignRight = e.tempoAlignRight === true;
    element.note = e.note ?? null;
    element.note2 = e.note2 ?? null;
    element.fthoraAboveNote = e.fthoraAboveNote ?? null;
    element.fthoraAboveNote2 = e.fthoraAboveNote2 ?? null;
    element.fthoraAboveQuantitativeNeumeRight =
      e.fthoraAboveQuantitativeNeumeRight ?? null;
    element.quantitativeNeumeAboveNote = e.quantitativeNeumeAboveNote ?? null;
    element.quantitativeNeumeAboveNote2 = e.quantitativeNeumeAboveNote2 ?? null;
    element.quantitativeNeumeRight = e.quantitativeNeumeRight ?? null;
    element.martyria = e.martyria;
    element.color = e.color;
    element.fontSize = e.fontSize;
    element.strokeWidth = e.strokeWidth ?? element.strokeWidth;
    element.heightAdjustment = e.heightAdjustment ?? 0;
    element.marginTop = e.marginTop ?? 0;
    element.marginBottom = e.marginBottom ?? 0;
    element.bpm = e.bpm ?? 120;
    element.ignoreAttractions = e.ignoreAttractions === true;
    element.showAmbitus = e.showAmbitus === true;
    element.useDefaultStyle = e.useDefaultStyle === true;
    element.permanentEnharmonicZo = e.permanentEnharmonicZo === true;

    // For backwards compatibility, we check the current mode key templates
    // to fill out the fthora if it is missing.
    if (e.fthora == null) {
      const template = modeKeyTemplates.find((x) => x.id === e.templateId);

      element.fthora = template?.fthora ?? null;
    } else {
      element.fthora = e.fthora;
    }
  }
}
