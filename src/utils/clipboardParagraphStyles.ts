import type {
  NoteElement,
  ScoreElement,
  TextBoxElement,
} from '@/models/Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  getTextBoxParagraphStyleFallbackId,
  type ParagraphStyle,
} from '@/models/ParagraphStyle';

import { planParagraphStyleReferenceRemap } from './paragraphStyleReferences';

function createParagraphStyleMap(paragraphStyles: ParagraphStyle[]) {
  return new Map(paragraphStyles.map((style) => [style.id, style]));
}

function createCustomParagraphStyleNameMap(paragraphStyles: ParagraphStyle[]) {
  const customParagraphStyleByName = new Map<string, ParagraphStyle>();

  for (const style of paragraphStyles) {
    if (style.builtIn) {
      continue;
    }

    const trimmedDisplayName = style.displayName.trim();

    if (!customParagraphStyleByName.has(trimmedDisplayName)) {
      customParagraphStyleByName.set(trimmedDisplayName, style);
    }
  }

  return customParagraphStyleByName;
}

function collectParagraphStyleIdsFromElement(
  element: ScoreElement,
  paragraphStyleIds: Set<string>,
) {
  const resolvers = {
    resolveStyleId(styleId: string) {
      paragraphStyleIds.add(styleId);
      return null;
    },
    resolveRichTextStyleId(styleId: string) {
      paragraphStyleIds.add(styleId);
      return null;
    },
  };

  for (const remap of planParagraphStyleReferenceRemap(element, resolvers)) {
    void remap;
  }
}

function collectCustomParagraphStylesFromIds(
  styleIds: Iterable<string>,
  paragraphStyles: ParagraphStyle[],
) {
  const paragraphStylesById = createParagraphStyleMap(paragraphStyles);
  const collectedParagraphStyles = new Map<string, ParagraphStyle>();
  const visiting = new Set<string>();

  function collect(styleId: string) {
    if (collectedParagraphStyles.has(styleId) || visiting.has(styleId)) {
      return;
    }

    const style = paragraphStylesById.get(styleId);

    if (style == null || style.builtIn) {
      return;
    }

    visiting.add(styleId);

    if (style.parentStyleId != null) {
      collect(style.parentStyleId);
    }

    visiting.delete(styleId);

    if (!collectedParagraphStyles.has(styleId)) {
      collectedParagraphStyles.set(styleId, style.clone());
    }
  }

  for (const styleId of styleIds) {
    collect(styleId);
  }

  return [...collectedParagraphStyles.values()];
}

export function collectClipboardParagraphStylesFromElements(
  elements: ScoreElement[],
  paragraphStyles: ParagraphStyle[],
) {
  const paragraphStyleIds = new Set<string>();

  for (const element of elements) {
    collectParagraphStyleIdsFromElement(element, paragraphStyleIds);
  }

  return collectCustomParagraphStylesFromIds(
    paragraphStyleIds,
    paragraphStyles,
  );
}

export function collectClipboardParagraphStylesFromPasteElements(
  elements: ScoreElement[],
  includeLyrics: boolean,
  paragraphStyles: ParagraphStyle[],
) {
  return collectClipboardParagraphStylesFromElements(
    elements.map((element) => element.clone({ includeLyrics })),
    paragraphStyles,
  );
}

export function collectClipboardParagraphStylesFromStyleIds(
  styleIds: Iterable<string>,
  paragraphStyles: ParagraphStyle[],
) {
  return collectCustomParagraphStylesFromIds(styleIds, paragraphStyles);
}

export interface ResolvedClipboardParagraphStyles {
  importedParagraphStyles: ParagraphStyle[];
  styleIdRemap: Map<string, string>;
}

function resolveClipboardParagraphStyleReference(
  styleId: string,
  targetParagraphStyleIds: Set<string>,
  styleIdRemap: Map<string, string>,
  fallbackStyleId: string,
) {
  const remappedStyleId = styleIdRemap.get(styleId);

  if (remappedStyleId != null) {
    return remappedStyleId === styleId ? null : remappedStyleId;
  }

  return targetParagraphStyleIds.has(styleId) ? null : fallbackStyleId;
}

function resolveClipboardImportedStyleParentId(
  parentStyleId: string | null,
  targetParagraphStyleIds: Set<string>,
  targetCustomStylesByName: Map<string, ParagraphStyle>,
  clipboardStylesById: Map<string, ParagraphStyle>,
  styleIdRemap: Map<string, string>,
  resolvingStyleIds: Set<string>,
  importedParagraphStyles: ParagraphStyle[],
) {
  if (parentStyleId == null) {
    return BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
  }

  const remappedStyleId = styleIdRemap.get(parentStyleId);

  if (remappedStyleId != null) {
    return remappedStyleId;
  }

  if (targetParagraphStyleIds.has(parentStyleId)) {
    return parentStyleId;
  }

  const parentStyle = clipboardStylesById.get(parentStyleId);

  if (parentStyle == null || resolvingStyleIds.has(parentStyleId)) {
    return BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
  }

  return resolveClipboardParagraphStyle(
    parentStyle,
    targetParagraphStyleIds,
    targetCustomStylesByName,
    clipboardStylesById,
    styleIdRemap,
    resolvingStyleIds,
    importedParagraphStyles,
  );
}

function resolveClipboardParagraphStyle(
  clipboardStyle: ParagraphStyle,
  targetParagraphStyleIds: Set<string>,
  targetCustomStylesByName: Map<string, ParagraphStyle>,
  clipboardStylesById: Map<string, ParagraphStyle>,
  styleIdRemap: Map<string, string>,
  resolvingStyleIds: Set<string>,
  importedParagraphStyles: ParagraphStyle[],
) {
  const remappedStyleId = styleIdRemap.get(clipboardStyle.id);

  if (remappedStyleId != null) {
    return remappedStyleId;
  }

  if (targetParagraphStyleIds.has(clipboardStyle.id)) {
    styleIdRemap.set(clipboardStyle.id, clipboardStyle.id);
    return clipboardStyle.id;
  }

  const targetCustomStyle = targetCustomStylesByName.get(
    clipboardStyle.displayName.trim(),
  );

  if (targetCustomStyle != null) {
    styleIdRemap.set(clipboardStyle.id, targetCustomStyle.id);
    return targetCustomStyle.id;
  }

  if (resolvingStyleIds.has(clipboardStyle.id)) {
    const fallbackStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    styleIdRemap.set(clipboardStyle.id, fallbackStyleId);
    return fallbackStyleId;
  }

  resolvingStyleIds.add(clipboardStyle.id);

  const importedStyle = clipboardStyle.clone();
  importedStyle.id = crypto.randomUUID();
  importedStyle.parentStyleId = resolveClipboardImportedStyleParentId(
    clipboardStyle.parentStyleId,
    targetParagraphStyleIds,
    targetCustomStylesByName,
    clipboardStylesById,
    styleIdRemap,
    resolvingStyleIds,
    importedParagraphStyles,
  );

  resolvingStyleIds.delete(clipboardStyle.id);

  styleIdRemap.set(clipboardStyle.id, importedStyle.id);
  importedParagraphStyles.push(importedStyle);

  return importedStyle.id;
}

export function resolveClipboardParagraphStyles(
  clipboardParagraphStyles: ParagraphStyle[],
  targetParagraphStyles: ParagraphStyle[],
): ResolvedClipboardParagraphStyles {
  const targetParagraphStyleIds = new Set(
    targetParagraphStyles.map((style) => style.id),
  );
  const targetCustomStylesByName = createCustomParagraphStyleNameMap(
    targetParagraphStyles,
  );
  const clipboardStylesById = createParagraphStyleMap(clipboardParagraphStyles);
  const styleIdRemap = new Map<string, string>();
  const importedParagraphStyles: ParagraphStyle[] = [];
  const resolvingStyleIds = new Set<string>();

  for (const clipboardStyle of clipboardParagraphStyles) {
    if (styleIdRemap.has(clipboardStyle.id)) {
      continue;
    }

    if (targetParagraphStyleIds.has(clipboardStyle.id)) {
      styleIdRemap.set(clipboardStyle.id, clipboardStyle.id);
      continue;
    }

    if (clipboardStyle.builtIn) {
      styleIdRemap.set(clipboardStyle.id, clipboardStyle.id);
      continue;
    }

    const matchingTargetStyle = targetCustomStylesByName.get(
      clipboardStyle.displayName.trim(),
    );

    if (matchingTargetStyle != null) {
      styleIdRemap.set(clipboardStyle.id, matchingTargetStyle.id);
      continue;
    }

    const importedStyle = clipboardStyle.clone();
    importedStyle.id = crypto.randomUUID();
    importedStyle.parentStyleId = resolveClipboardImportedStyleParentId(
      clipboardStyle.parentStyleId,
      targetParagraphStyleIds,
      targetCustomStylesByName,
      clipboardStylesById,
      styleIdRemap,
      resolvingStyleIds,
      importedParagraphStyles,
    );

    styleIdRemap.set(clipboardStyle.id, importedStyle.id);
    importedParagraphStyles.push(importedStyle);
  }

  return {
    importedParagraphStyles,
    styleIdRemap,
  };
}

// Pasted content may reference styles the destination score does not have,
// so every unknown id -- in direct fields and rich text classes alike --
// falls back to the surface's built-in default.
export function rewriteClipboardElementParagraphStyleIds(
  element: ScoreElement,
  paragraphStyles: ParagraphStyle[],
  styleIdRemap: Map<string, string>,
) {
  const paragraphStyleIds = new Set(paragraphStyles.map((style) => style.id));
  const resolveStyleId = (styleId: string, fallbackStyleId: string) =>
    resolveClipboardParagraphStyleReference(
      styleId,
      paragraphStyleIds,
      styleIdRemap,
      fallbackStyleId,
    );

  for (const remap of planParagraphStyleReferenceRemap(element, {
    resolveStyleId,
    resolveRichTextStyleId: resolveStyleId,
  })) {
    Object.assign(remap.target, remap.newValues);
  }
}

export function rewriteClipboardTextBoxFormatParagraphStyleId(
  format: Partial<TextBoxElement>,
  paragraphStyles: ParagraphStyle[],
  styleIdRemap: Map<string, string>,
  target?: TextBoxElement,
) {
  if (format.paragraphStyleId == null) {
    return format;
  }

  const paragraphStyleIds = new Set(paragraphStyles.map((style) => style.id));
  const paragraphStyleId = resolveClipboardParagraphStyleReference(
    format.paragraphStyleId,
    paragraphStyleIds,
    styleIdRemap,
    getTextBoxParagraphStyleFallbackId(
      format.inline ?? target?.inline ?? false,
    ),
  );

  return paragraphStyleId == null
    ? format
    : {
        ...format,
        paragraphStyleId,
      };
}

export function rewriteClipboardNoteFormatParagraphStyleId(
  format: Partial<NoteElement>,
  paragraphStyles: ParagraphStyle[],
  styleIdRemap: Map<string, string>,
) {
  if (format.lyricsParagraphStyleId == null) {
    return format;
  }

  const paragraphStyleIds = new Set(paragraphStyles.map((style) => style.id));
  const lyricsParagraphStyleId = resolveClipboardParagraphStyleReference(
    format.lyricsParagraphStyleId,
    paragraphStyleIds,
    styleIdRemap,
    BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
  );

  return lyricsParagraphStyleId == null
    ? format
    : {
        ...format,
        lyricsParagraphStyleId,
      };
}
