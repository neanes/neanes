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

function createParagraphStyleIdSet(paragraphStyles: ParagraphStyle[]) {
  return new Set(paragraphStyles.map((style) => style.id));
}

function resolveClipboardParagraphStyleId(
  styleId: string,
  paragraphStyleIds: Set<string>,
  fallbackStyleId: string,
) {
  return paragraphStyleIds.has(styleId) ? styleId : fallbackStyleId;
}

// Pasted content may reference styles the destination score does not have,
// so every unknown id -- in direct fields and rich text classes alike --
// falls back to the surface's built-in default.
export function sanitizeClipboardElementParagraphStyleIds(
  element: ScoreElement,
  paragraphStyles: ParagraphStyle[],
) {
  const paragraphStyleIds = createParagraphStyleIdSet(paragraphStyles);
  const resolveStyleId = (styleId: string, fallbackStyleId: string) =>
    paragraphStyleIds.has(styleId) ? null : fallbackStyleId;

  for (const remap of planParagraphStyleReferenceRemap(element, {
    resolveStyleId,
    resolveRichTextStyleId: resolveStyleId,
  })) {
    Object.assign(remap.target, remap.newValues);
  }
}

export function sanitizeClipboardTextBoxFormatParagraphStyleId(
  format: Partial<TextBoxElement>,
  paragraphStyles: ParagraphStyle[],
  target?: TextBoxElement,
) {
  if (format.paragraphStyleId == null) {
    return format;
  }

  const paragraphStyleIds = createParagraphStyleIdSet(paragraphStyles);

  return {
    ...format,
    paragraphStyleId: resolveClipboardParagraphStyleId(
      format.paragraphStyleId,
      paragraphStyleIds,
      getTextBoxParagraphStyleFallbackId(
        format.inline ?? target?.inline ?? false,
      ),
    ),
  };
}

export function sanitizeClipboardNoteFormatParagraphStyleId(
  format: Partial<NoteElement>,
  paragraphStyles: ParagraphStyle[],
) {
  if (format.lyricsParagraphStyleId == null) {
    return format;
  }

  const paragraphStyleIds = createParagraphStyleIdSet(paragraphStyles);

  return {
    ...format,
    lyricsParagraphStyleId: resolveClipboardParagraphStyleId(
      format.lyricsParagraphStyleId,
      paragraphStyleIds,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    ),
  };
}
