import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { Unit } from '@/utils/Unit';

import type { TextBoxAlignment } from './Element';
import type { PageSetup } from './PageSetup';

export type TextStyleAlignment = TextBoxAlignment;

export const BUILT_IN_TEXT_STYLE_IDS = {
  DefaultText: 'default-text',
  Annotation: 'annotation',
  Title: 'title',
  Subtitle: 'subtitle',
  Chapter: 'chapter',
  Section: 'section',
  Header: 'header',
  Footer: 'footer',
  Lyrics: 'lyrics',
  DropCap: 'drop-cap',
} as const;

export type BuiltInTextStyleId =
  (typeof BUILT_IN_TEXT_STYLE_IDS)[keyof typeof BUILT_IN_TEXT_STYLE_IDS];

export interface TextStyleOverrides {
  alignment?: TextStyleAlignment;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  color?: string;
  strokeWidth?: number;
  lineHeight?: number | null;
}

export interface ResolvedTextStyle {
  alignment: TextStyleAlignment;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  color: string;
  strokeWidth: number;
  lineHeight: number | null;
}

export class TextStyle {
  public id: string = crypto.randomUUID();
  public displayName: string = 'Text Style';
  public builtIn: boolean = false;
  public parentStyleId: string | null = null;
  public overrides: TextStyleOverrides = {};

  public clone() {
    const clone = new TextStyle();
    clone.id = this.id;
    clone.displayName = this.displayName;
    clone.builtIn = this.builtIn;
    clone.parentStyleId = this.parentStyleId;
    clone.overrides = { ...this.overrides };
    return clone;
  }
}

export function createTextStyleFallback(): ResolvedTextStyle {
  return {
    alignment: 'left' as TextBoxAlignment,
    fontFamily: 'Source Serif',
    fontSize: Unit.fromPt(12),
    fontStyle: DEFAULT_FONT_STYLE,
    color: '#000000',
    strokeWidth: 0,
    lineHeight: null,
  };
}

export function createTextStylesFromPageSetup(pageSetup: PageSetup) {
  return createTextStylesFromDefaults(pageSetup, {});
}

export interface LegacyStyleDefaults {
  textBoxDefaultFontFamily?: string | null;
  textBoxDefaultFontSize?: number | null;
  textBoxDefaultFontStyle?: string | null;
  textBoxDefaultColor?: string | null;
  textBoxDefaultStrokeWidth?: number | null;
  textBoxDefaultLineHeight?: number | null;
  dropCapDefaultFontFamily?: string | null;
  dropCapDefaultFontSize?: number | null;
  dropCapDefaultFontStyle?: string | null;
  dropCapDefaultColor?: string | null;
  dropCapDefaultStrokeWidth?: number | null;
  dropCapDefaultLineHeight?: number | null;
  lyricsDefaultFontFamily?: string | null;
  lyricsDefaultFontSize?: number | null;
  lyricsDefaultFontStyle?: string | null;
  lyricsDefaultColor?: string | null;
  lyricsDefaultStrokeWidth?: number | null;
  lyricsDefaultLineHeight?: number | null;
}

export function createTextStylesFromDefaults(
  pageSetup: PageSetup,
  legacyStyleDefaults: LegacyStyleDefaults,
) {
  const defaultText = new TextStyle();
  defaultText.id = BUILT_IN_TEXT_STYLE_IDS.DefaultText;
  defaultText.displayName = 'Default Text';
  defaultText.builtIn = true;
  defaultText.overrides = {
    alignment: 'left' as TextBoxAlignment,
    fontFamily: legacyStyleDefaults.textBoxDefaultFontFamily ?? 'Source Serif',
    fontSize: legacyStyleDefaults.textBoxDefaultFontSize ?? Unit.fromPt(12),
    fontStyle:
      legacyStyleDefaults.textBoxDefaultFontStyle ?? DEFAULT_FONT_STYLE,
    color: legacyStyleDefaults.textBoxDefaultColor ?? '#000000',
    strokeWidth: legacyStyleDefaults.textBoxDefaultStrokeWidth ?? 0,
    lineHeight: legacyStyleDefaults.textBoxDefaultLineHeight ?? null,
  };

  const annotation = createBuiltInStyle(
    BUILT_IN_TEXT_STYLE_IDS.Annotation,
    'Annotation',
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    {
      fontSize: Unit.fromPt(12),
    },
  );

  const title = createBuiltInStyle(
    BUILT_IN_TEXT_STYLE_IDS.Title,
    'Title',
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    {
      alignment: 'center' as TextBoxAlignment,
      fontSize: Unit.fromPt(28),
    },
  );
  const subtitle = createBuiltInStyle(
    BUILT_IN_TEXT_STYLE_IDS.Subtitle,
    'Subtitle',
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    {
      alignment: 'center' as TextBoxAlignment,
      fontSize: Unit.fromPt(22),
    },
  );
  const chapter = createBuiltInStyle(
    BUILT_IN_TEXT_STYLE_IDS.Chapter,
    'Chapter',
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    {
      alignment: 'center' as TextBoxAlignment,
      fontSize: Unit.fromPt(24),
    },
  );
  const section = createBuiltInStyle(
    BUILT_IN_TEXT_STYLE_IDS.Section,
    'Section',
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    {
      fontSize: Unit.fromPt(20),
    },
  );
  const header = createBuiltInStyle(
    BUILT_IN_TEXT_STYLE_IDS.Header,
    'Header',
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    {
      alignment: 'center' as TextBoxAlignment,
    },
  );
  const footer = createBuiltInStyle(
    BUILT_IN_TEXT_STYLE_IDS.Footer,
    'Footer',
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    {
      alignment: 'center' as TextBoxAlignment,
    },
  );
  const lyrics = createBuiltInStyle(
    BUILT_IN_TEXT_STYLE_IDS.Lyrics,
    'Lyrics',
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    {
      fontFamily: legacyStyleDefaults.lyricsDefaultFontFamily ?? 'Source Serif',
      fontSize: legacyStyleDefaults.lyricsDefaultFontSize ?? Unit.fromPt(12),
      fontStyle:
        legacyStyleDefaults.lyricsDefaultFontStyle ?? DEFAULT_FONT_STYLE,
      color: legacyStyleDefaults.lyricsDefaultColor ?? '#000000',
      strokeWidth: legacyStyleDefaults.lyricsDefaultStrokeWidth ?? 0,
    },
  );
  const dropCap = createBuiltInStyle(
    BUILT_IN_TEXT_STYLE_IDS.DropCap,
    'Drop Cap',
    BUILT_IN_TEXT_STYLE_IDS.DefaultText,
    {
      fontFamily:
        legacyStyleDefaults.dropCapDefaultFontFamily ?? 'Source Serif',
      fontSize: legacyStyleDefaults.dropCapDefaultFontSize ?? Unit.fromPt(60),
      fontStyle:
        legacyStyleDefaults.dropCapDefaultFontStyle ?? DEFAULT_FONT_STYLE,
      color: legacyStyleDefaults.dropCapDefaultColor ?? '#000000',
      strokeWidth: legacyStyleDefaults.dropCapDefaultStrokeWidth ?? 0,
      lineHeight: legacyStyleDefaults.dropCapDefaultLineHeight ?? null,
    },
  );

  return [
    defaultText,
    annotation,
    title,
    subtitle,
    chapter,
    section,
    header,
    footer,
    lyrics,
    dropCap,
  ];
}

export function getTextStyleById(
  styles: TextStyle[],
  styleId: string | null | undefined,
) {
  return styles.find((style) => style.id === styleId) ?? null;
}

export function resolveTextStyle(
  styles: TextStyle[],
  styleId: string | null | undefined,
  elementOverrides?: TextStyleOverrides,
): ResolvedTextStyle {
  const visited = new Set<string>();
  const resolved = createTextStyleFallback();
  const chain: TextStyle[] = [];

  let style = getTextStyleById(styles, styleId);

  while (style != null && !visited.has(style.id)) {
    visited.add(style.id);
    chain.unshift(style);
    style = getTextStyleById(styles, style.parentStyleId);
  }

  for (const item of chain) {
    applyTextStyleOverrides(resolved, item.overrides);
  }

  applyTextStyleOverrides(resolved, elementOverrides);

  return resolved;
}

export function wouldCreateTextStyleCycle(
  styles: TextStyle[],
  styleId: string,
  parentStyleId: string | null,
) {
  if (parentStyleId == null) {
    return false;
  }

  if (parentStyleId === styleId) {
    return true;
  }

  const visited = new Set<string>();
  let currentId: string | null = parentStyleId;

  while (currentId != null && !visited.has(currentId)) {
    if (currentId === styleId) {
      return true;
    }

    visited.add(currentId);
    currentId = getTextStyleById(styles, currentId)?.parentStyleId ?? null;
  }

  return false;
}

export function getAvailableTextStyleParents(
  styles: TextStyle[],
  styleId: string,
) {
  return styles.filter((candidate) => {
    return (
      candidate.id !== styleId &&
      !wouldCreateTextStyleCycle(styles, styleId, candidate.id)
    );
  });
}

function createBuiltInStyle(
  id: BuiltInTextStyleId,
  displayName: string,
  parentStyleId: string | null,
  overrides: TextStyleOverrides = {},
) {
  const style = new TextStyle();
  style.id = id;
  style.displayName = displayName;
  style.builtIn = true;
  style.parentStyleId = parentStyleId;
  style.overrides = overrides;
  return style;
}

function applyTextStyleOverrides(
  target: ResolvedTextStyle,
  overrides?: TextStyleOverrides,
) {
  if (overrides == null) {
    return;
  }

  if (overrides.fontFamily != null) {
    target.fontFamily = overrides.fontFamily;
  }

  if (overrides.alignment != null) {
    target.alignment = overrides.alignment;
  }

  if (overrides.fontSize != null) {
    target.fontSize = overrides.fontSize;
  }

  if (overrides.fontStyle != null) {
    target.fontStyle = overrides.fontStyle;
  }

  if (overrides.color != null) {
    target.color = overrides.color;
  }

  if (overrides.strokeWidth != null) {
    target.strokeWidth = overrides.strokeWidth;
  }

  if (overrides.lineHeight !== undefined) {
    target.lineHeight = overrides.lineHeight;
  }
}
