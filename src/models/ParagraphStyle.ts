import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { Unit } from '@/utils/Unit';

import type { TextBoxAlignment } from './Element';

export type ParagraphStyleAlignment = TextBoxAlignment;

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

export interface ParagraphStyleOverrides {
  alignment?: ParagraphStyleAlignment;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  color?: string;
  strokeWidth?: number;
  lineHeight?: number | null;
  textDecoration?: 'underline' | null;
}

export interface ResolvedParagraphStyle {
  alignment: ParagraphStyleAlignment;
  fontFamily: string;
  fontSize: number;
  fontStyle: string;
  color: string;
  strokeWidth: number;
  lineHeight: number | null;
  textDecoration: 'underline' | null;
}

export class ParagraphStyle {
  public id: string = crypto.randomUUID();
  public displayName: string = 'Paragraph Style';
  public builtIn: boolean = false;
  public parentStyleId: string | null = null;
  public overrides: ParagraphStyleOverrides = {};

  public clone() {
    const clone = new ParagraphStyle();
    clone.id = this.id;
    clone.displayName = this.displayName;
    clone.builtIn = this.builtIn;
    clone.parentStyleId = this.parentStyleId;
    clone.overrides = { ...this.overrides };
    return clone;
  }
}

export function createParagraphStyleFallback(): ResolvedParagraphStyle {
  return {
    alignment: 'left' as TextBoxAlignment,
    fontFamily: 'Source Serif',
    fontSize: Unit.fromPt(12),
    fontStyle: DEFAULT_FONT_STYLE,
    color: '#000000',
    strokeWidth: 0,
    lineHeight: null,
    textDecoration: null,
  };
}

export function createDefaultBuiltInParagraphStyle(
  id: BuiltInParagraphStyleId,
) {
  const style = getParagraphStyleById(createDefaultParagraphStyles(), id);

  if (style == null) {
    throw new Error(`Unknown built-in paragraph style id: ${id}`);
  }

  return style.clone();
}

export function getParagraphStyleById(
  styles: ParagraphStyle[],
  styleId: string | null | undefined,
) {
  return styles.find((style) => style.id === styleId) ?? null;
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
    currentId = getParagraphStyleById(styles, currentId)?.parentStyleId ?? null;
  }

  return false;
}

export function getAvailableParagraphStyleParents(
  styles: ParagraphStyle[],
  styleId: string,
) {
  return styles.filter((candidate) => {
    return (
      candidate.id !== styleId &&
      !wouldCreateParagraphStyleCycle(styles, styleId, candidate.id)
    );
  });
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
  style.builtIn = true;
  style.parentStyleId = parentStyleId;
  style.overrides = overrides;
  return style;
}

export function createDefaultParagraphStyles() {
  const defaultText = new ParagraphStyle();
  defaultText.id = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
  defaultText.displayName = 'Default Text';
  defaultText.builtIn = true;
  defaultText.parentStyleId = null;

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
      alignment: 'center' as TextBoxAlignment,
      fontSize: Unit.fromPt(28),
    },
  );
  const subtitle = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Subtitle,
    'Subtitle',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      alignment: 'center' as TextBoxAlignment,
      fontSize: Unit.fromPt(22),
    },
  );
  const chapter = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Chapter,
    'Chapter',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      alignment: 'center' as TextBoxAlignment,
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
      alignment: 'center' as TextBoxAlignment,
    },
  );
  const footer = createBuiltInStyle(
    BUILT_IN_PARAGRAPH_STYLE_IDS.Footer,
    'Footer',
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    {
      alignment: 'center' as TextBoxAlignment,
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

  if (overrides.lineHeight !== undefined) {
    target.lineHeight = overrides.lineHeight;
  }

  if (overrides.textDecoration !== undefined) {
    target.textDecoration = overrides.textDecoration;
  }
}
