import type { Namespace, SelectorParam, TFunction } from 'i18next';

import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { Unit } from '@/utils/Unit';

export enum TextBoxAlignment {
  Center = 'center',
  Justify = 'justify',
  Left = 'left',
  Right = 'right',
}

export function isTextBoxAlignment(value: unknown): value is TextBoxAlignment {
  return Object.values(TextBoxAlignment).includes(value as TextBoxAlignment);
}

export const BUILT_IN_PARAGRAPH_STYLE_IDS = {
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

export type BuiltInParagraphStyleId =
  (typeof BUILT_IN_PARAGRAPH_STYLE_IDS)[keyof typeof BUILT_IN_PARAGRAPH_STYLE_IDS];

type ParagraphStyleNameSelector = SelectorParam<'dialog'>;

const BUILT_IN_PARAGRAPH_STYLE_NAME_SELECTORS: Record<
  BuiltInParagraphStyleId,
  ParagraphStyleNameSelector
> = {
  [BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText]: ($) =>
    $.dialog.paragraphStyles.builtIn.defaultText,
  [BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation]: ($) =>
    $.dialog.paragraphStyles.builtIn.annotation,
  [BUILT_IN_PARAGRAPH_STYLE_IDS.Title]: ($) =>
    $.dialog.paragraphStyles.builtIn.title,
  [BUILT_IN_PARAGRAPH_STYLE_IDS.Subtitle]: ($) =>
    $.dialog.paragraphStyles.builtIn.subtitle,
  [BUILT_IN_PARAGRAPH_STYLE_IDS.Chapter]: ($) =>
    $.dialog.paragraphStyles.builtIn.chapter,
  [BUILT_IN_PARAGRAPH_STYLE_IDS.Section]: ($) =>
    $.dialog.paragraphStyles.builtIn.section,
  [BUILT_IN_PARAGRAPH_STYLE_IDS.Header]: ($) =>
    $.dialog.paragraphStyles.builtIn.header,
  [BUILT_IN_PARAGRAPH_STYLE_IDS.Footer]: ($) =>
    $.dialog.paragraphStyles.builtIn.footer,
  [BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics]: ($) =>
    $.dialog.paragraphStyles.builtIn.lyrics,
  [BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap]: ($) =>
    $.dialog.paragraphStyles.builtIn.dropCap,
};

const builtInParagraphStyleIds = new Set<string>(
  Object.values(BUILT_IN_PARAGRAPH_STYLE_IDS),
);

export interface ParagraphStyleOverrides {
  alignment?: TextBoxAlignment;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  color?: string;
  strokeWidth?: number;
  strokeColor?: string;
  lineHeight?: number | null;
  textDecoration?: 'underline' | null;
  // OpenType feature values, one per CSS font-variant-* longhand, stored as
  // that property's value verbatim (the same shape the rich-text model
  // attributes use). undefined inherits; null is an explicit "normal".
  fontVariantCaps?: string | null;
  fontVariantNumeric?: string | null;
  fontVariantLigatures?: string | null;
}

export type ResolvedParagraphStyle = Required<ParagraphStyleOverrides>;

const PARAGRAPH_STYLE_OVERRIDE_KEYS: Array<keyof ParagraphStyleOverrides> = [
  'alignment',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'color',
  'strokeWidth',
  'strokeColor',
  'lineHeight',
  'textDecoration',
  'fontVariantCaps',
  'fontVariantNumeric',
  'fontVariantLigatures',
];

export function hasParagraphStyleOverrides(overrides: ParagraphStyleOverrides) {
  return Object.values(overrides).some((value) => value !== undefined);
}

export class ParagraphStyle {
  public id: string = crypto.randomUUID();
  public displayName: string = 'Paragraph Style';
  public parentStyleId: string | null =
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
  public overrides: ParagraphStyleOverrides = {};

  public get builtIn() {
    return isBuiltInParagraphStyleId(this.id);
  }

  public clone() {
    const clone = new ParagraphStyle();
    clone.id = this.id;
    clone.displayName = this.displayName;
    clone.parentStyleId = this.parentStyleId;
    clone.overrides = { ...this.overrides };
    return clone;
  }
}

export function createParagraphStyleFallback(): ResolvedParagraphStyle {
  return {
    alignment: TextBoxAlignment.Left,
    fontFamily: 'Source Serif',
    fontSize: Unit.fromPt(12),
    fontStyle: DEFAULT_FONT_STYLE,
    color: '#000000',
    strokeWidth: 0,
    strokeColor: 'currentcolor',
    lineHeight: null,
    textDecoration: null,
    fontVariantCaps: null,
    fontVariantNumeric: null,
    fontVariantLigatures: null,
  };
}

export function pruneParentlessParagraphStyleRootFallbackOverrides(
  style: ParagraphStyle,
) {
  if (style.id !== BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText) {
    return;
  }

  if (style.parentStyleId != null) {
    return;
  }

  const fallback = createParagraphStyleFallback();

  for (const key of PARAGRAPH_STYLE_OVERRIDE_KEYS) {
    if (
      style.overrides[key] !== undefined &&
      Object.is(style.overrides[key], fallback[key])
    ) {
      delete style.overrides[key];
    }
  }
}

export function createDefaultBuiltInParagraphStyle(
  id: BuiltInParagraphStyleId,
) {
  return getRequiredParagraphStyleById(createDefaultParagraphStyles(), id);
}

export function isBuiltInParagraphStyleId(
  styleId: string,
): styleId is BuiltInParagraphStyleId {
  return builtInParagraphStyleIds.has(styleId);
}

export function getTextBoxParagraphStyleFallbackId(inline: boolean) {
  return inline
    ? BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics
    : BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
}

export function getBuiltInParagraphStyleNameSelector(
  styleId: string | null | undefined,
) {
  if (styleId == null || !isBuiltInParagraphStyleId(styleId)) {
    return null;
  }

  return BUILT_IN_PARAGRAPH_STYLE_NAME_SELECTORS[styleId];
}

// Built-in styles display their localized names; custom styles display the
// user-entered name. Both the style selects and the dialog's name validation
// must agree on this resolution, so it lives here.
export function getParagraphStyleDisplayName(
  style: ParagraphStyle,
  t: TFunction<Namespace>,
) {
  const selector = getBuiltInParagraphStyleNameSelector(style.id);

  return selector == null ? style.displayName : t(selector, { ns: 'dialog' });
}

function getParagraphStyleById(
  styles: ParagraphStyle[],
  styleId: string | null | undefined,
) {
  return styles.find((style) => style.id === styleId) ?? null;
}

export function getRequiredParagraphStyleById(
  styles: ParagraphStyle[],
  styleId: string,
) {
  const style = getParagraphStyleById(styles, styleId);

  if (style == null) {
    throw new Error(`Unknown paragraph style id: ${styleId}`);
  }

  return style;
}

export function resolveParagraphStyle(
  styles: ParagraphStyle[],
  styleId: string | null | undefined,
  elementOverrides?: ParagraphStyleOverrides,
): ResolvedParagraphStyle {
  const visited = new Set<string>();
  const resolved = createParagraphStyleFallback();
  const chain: ParagraphStyle[] = [];

  let style = getParagraphStyleById(styles, styleId);

  if (style == null && styleId != null) {
    style = getParagraphStyleById(
      styles,
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
  }

  while (style != null && !visited.has(style.id)) {
    visited.add(style.id);
    chain.unshift(style);
    style = getParagraphStyleById(styles, style.parentStyleId);
  }

  for (const item of chain) {
    applyParagraphStyleOverrides(resolved, item.overrides);
  }

  applyParagraphStyleOverrides(resolved, elementOverrides);

  return resolved;
}

export function wouldCreateParagraphStyleCycle(
  styles: ParagraphStyle[],
  styleId: string,
  parentStyleId: string | null,
) {
  const visited = new Set<string>();
  let currentId: string | null = parentStyleId;

  while (currentId != null && !visited.has(currentId)) {
    if (currentId === styleId) {
      return true;
    }

    visited.add(currentId);
    currentId = getParagraphStyleById(styles, currentId)?.parentStyleId ?? null;
  }

  return false;
}

export function getAvailableParagraphStyleParents(
  styles: ParagraphStyle[],
  styleId: string,
) {
  return styles.filter(
    (candidate) =>
      !wouldCreateParagraphStyleCycle(styles, styleId, candidate.id),
  );
}

function createBuiltInStyle(
  id: BuiltInParagraphStyleId,
  displayName: string,
  parentStyleId: string | null,
  overrides: ParagraphStyleOverrides = {},
) {
  const style = new ParagraphStyle();
  style.id = id;
  style.displayName = displayName;
  style.parentStyleId = parentStyleId;
  style.overrides = overrides;
  return style;
}

export function createDefaultParagraphStyles() {
  const defaultText = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    'Default Text',
    null,
  );

  const annotation = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation,
    'Annotation',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
  );

  const title = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Title,
    'Title',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      alignment: TextBoxAlignment.Center,
      fontSize: Unit.fromPt(28),
    },
  );
  const subtitle = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Subtitle,
    'Subtitle',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      alignment: TextBoxAlignment.Center,
      fontSize: Unit.fromPt(22),
    },
  );
  const chapter = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Chapter,
    'Chapter',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      alignment: TextBoxAlignment.Center,
      fontSize: Unit.fromPt(24),
    },
  );
  const section = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Section,
    'Section',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      fontSize: Unit.fromPt(20),
    },
  );
  const header = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Header,
    'Header',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      alignment: TextBoxAlignment.Center,
    },
  );
  const footer = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Footer,
    'Footer',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      alignment: TextBoxAlignment.Center,
    },
  );
  const lyrics = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    'Lyrics',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
  );
  const dropCap = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
    'Drop Cap',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      fontSize: Unit.fromPt(60),
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

function applyParagraphStyleOverrides(
  target: ResolvedParagraphStyle,
  overrides?: ParagraphStyleOverrides,
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

  if (overrides.strokeColor != null) {
    target.strokeColor = overrides.strokeColor;
  }

  if (overrides.lineHeight !== undefined) {
    target.lineHeight = overrides.lineHeight;
  }

  if (overrides.textDecoration !== undefined) {
    target.textDecoration = overrides.textDecoration;
  }

  if (overrides.fontVariantCaps !== undefined) {
    target.fontVariantCaps = overrides.fontVariantCaps;
  }

  if (overrides.fontVariantNumeric !== undefined) {
    target.fontVariantNumeric = overrides.fontVariantNumeric;
  }

  if (overrides.fontVariantLigatures !== undefined) {
    target.fontVariantLigatures = overrides.fontVariantLigatures;
  }
}
