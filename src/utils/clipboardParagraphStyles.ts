import type {
  AlternateLineElement,
  DropCapElement,
  NoteElement,
  ScoreElement,
  TextBoxElement,
} from '@/models/Element';
import { ElementType } from '@/models/Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  getTextBoxParagraphStyleFallbackId,
  type ParagraphStyle,
} from '@/models/ParagraphStyle';

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

export function sanitizeClipboardElementParagraphStyleIds(
  element: ScoreElement,
  paragraphStyles: ParagraphStyle[],
) {
  const paragraphStyleIds = createParagraphStyleIdSet(paragraphStyles);

  sanitizeElementParagraphStyleIds(element, paragraphStyleIds);
}

function sanitizeAlternateLineParagraphStyleIds(
  alternateLine: AlternateLineElement,
  paragraphStyleIds: Set<string>,
) {
  for (const childElement of alternateLine.elements) {
    sanitizeElementParagraphStyleIds(childElement, paragraphStyleIds);
  }
}

function sanitizeElementParagraphStyleIds(
  element: ScoreElement,
  paragraphStyleIds: Set<string>,
) {
  switch (element.elementType) {
    case ElementType.Note: {
      const note = element as NoteElement;
      note.lyricsParagraphStyleId = resolveClipboardParagraphStyleId(
        note.lyricsParagraphStyleId,
        paragraphStyleIds,
        BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      );

      for (const alternateLine of note.alternateLines) {
        sanitizeAlternateLineParagraphStyleIds(
          alternateLine,
          paragraphStyleIds,
        );
      }
      break;
    }
    case ElementType.TextBox: {
      const textBox = element as TextBoxElement;
      textBox.paragraphStyleId = resolveClipboardParagraphStyleId(
        textBox.paragraphStyleId,
        paragraphStyleIds,
        getTextBoxParagraphStyleFallbackId(textBox.inline),
      );
      break;
    }
    case ElementType.DropCap: {
      const dropCap = element as DropCapElement;
      dropCap.paragraphStyleId = resolveClipboardParagraphStyleId(
        dropCap.paragraphStyleId,
        paragraphStyleIds,
        BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
      );
      break;
    }
    case ElementType.AlternateLine: {
      sanitizeAlternateLineParagraphStyleIds(
        element as AlternateLineElement,
        paragraphStyleIds,
      );
      break;
    }
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
