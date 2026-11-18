import { RichTextBoxElement, type ScoreElement } from '@/models/Element';
import {
  activeRichTextContentKeys,
  richTextFootnoteIds,
} from '@/services/RichTextFootnotes';

export function richFootnoteReferences(element: RichTextBoxElement) {
  return activeRichTextContentKeys(element).flatMap((contentKey) =>
    richTextFootnoteIds(element[contentKey]).map((footnoteId) => ({
      footnoteId,
      contentKey,
    })),
  );
}

// Computed API properties stay out of the persistent score model.
export function readElementProperty(
  element: ScoreElement,
  key: string,
): unknown {
  if (key === 'footnoteReferences' && element instanceof RichTextBoxElement) {
    const references = richFootnoteReferences(element);
    return references.length === 0 ? undefined : references;
  }
  return Reflect.get(element, key);
}
