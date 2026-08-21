import type {
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TextBoxElement,
} from '@/models/Element';
import { ElementType, RICH_TEXT_BOX_CONTENT_KEYS } from '@/models/Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  getTextBoxParagraphStyleFallbackId,
} from '@/models/ParagraphStyle';

import { rewriteRichTextParagraphStyleClasses } from './richTextParagraphStyleClasses';

// This module owns the map of every paragraph-style reference an element
// graph can carry: which fields hold style ids, which rich text HTML carries
// style classes, each surface's built-in fallback, and how to recurse into
// annotations and alternate lines. Clipboard sanitization and style deletion
// share this map and differ only in their resolver policies.
export interface ParagraphStyleReferenceResolvers {
  // Direct style-id fields (paragraphStyleId, lyricsParagraphStyleId).
  // Return the replacement id, or null to keep the current one.
  resolveStyleId(styleId: string, fallbackStyleId: string): string | null;
  // Style classes inside rich text HTML. Return the replacement id, or null
  // to leave the class untouched.
  resolveRichTextStyleId(
    styleId: string,
    fallbackStyleId: string,
  ): string | null;
}

interface Remap<T extends ScoreElement> {
  target: T;
  newValues: Partial<T>;
}

export type ParagraphStyleReferenceRemap =
  | Remap<TextBoxElement>
  | Remap<RichTextBoxElement>
  | Remap<NoteElement>
  | Remap<AnnotationElement>
  | Remap<DropCapElement>;

export function planParagraphStyleReferenceRemap(
  element: ScoreElement,
  resolvers: ParagraphStyleReferenceResolvers,
): ParagraphStyleReferenceRemap[] {
  const remaps: ParagraphStyleReferenceRemap[] = [];

  collectRemaps(element, resolvers, remaps);

  return remaps;
}

function collectRemaps(
  element: ScoreElement,
  resolvers: ParagraphStyleReferenceResolvers,
  remaps: ParagraphStyleReferenceRemap[],
) {
  switch (element.elementType) {
    case ElementType.Note: {
      const note = element as NoteElement;
      const lyricsParagraphStyleId = resolvers.resolveStyleId(
        note.lyricsParagraphStyleId,
        BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
      );

      if (lyricsParagraphStyleId != null) {
        remaps.push({ target: note, newValues: { lyricsParagraphStyleId } });
      }

      for (const annotation of note.annotations) {
        collectRemaps(annotation, resolvers, remaps);
      }

      for (const alternateLine of note.alternateLines) {
        collectRemaps(alternateLine, resolvers, remaps);
      }
      break;
    }
    case ElementType.Annotation: {
      const annotation = element as AnnotationElement;
      const text = rewriteRichTextParagraphStyleClasses(
        annotation.text,
        (styleId) =>
          resolvers.resolveRichTextStyleId(
            styleId,
            BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation,
          ),
      );

      if (text !== annotation.text) {
        remaps.push({ target: annotation, newValues: { text } });
      }
      break;
    }
    case ElementType.RichTextBox: {
      const richTextBox = element as RichTextBoxElement;
      const fallbackStyleId = getTextBoxParagraphStyleFallbackId(
        richTextBox.inline,
      );
      const newValues: Partial<RichTextBoxElement> = {};

      for (const contentKey of RICH_TEXT_BOX_CONTENT_KEYS) {
        const html = rewriteRichTextParagraphStyleClasses(
          richTextBox[contentKey],
          (styleId) =>
            resolvers.resolveRichTextStyleId(styleId, fallbackStyleId),
        );

        if (html !== richTextBox[contentKey]) {
          newValues[contentKey] = html;
        }
      }

      if (Object.keys(newValues).length > 0) {
        remaps.push({ target: richTextBox, newValues });
      }
      break;
    }
    case ElementType.TextBox: {
      const textBox = element as TextBoxElement;
      const paragraphStyleId = resolvers.resolveStyleId(
        textBox.paragraphStyleId,
        getTextBoxParagraphStyleFallbackId(textBox.inline),
      );

      if (paragraphStyleId != null) {
        remaps.push({ target: textBox, newValues: { paragraphStyleId } });
      }
      break;
    }
    case ElementType.DropCap: {
      const dropCap = element as DropCapElement;
      const paragraphStyleId = resolvers.resolveStyleId(
        dropCap.paragraphStyleId,
        BUILT_IN_PARAGRAPH_STYLE_IDS.DropCap,
      );

      if (paragraphStyleId != null) {
        remaps.push({ target: dropCap, newValues: { paragraphStyleId } });
      }
      break;
    }
    case ElementType.AlternateLine: {
      for (const child of (element as AlternateLineElement).elements) {
        collectRemaps(child, resolvers, remaps);
      }
      break;
    }
  }
}
