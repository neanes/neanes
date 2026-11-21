import { locateModeKeysInHtml } from '@/ckeditor-plugins/insertmodekey/modekeydata';
import { RichTextBoxElement, type ScoreElement } from '@/models/Element';
import {
  activeRichTextContentKeys,
  richTextFootnoteIds,
} from '@/services/RichTextFootnotes';
import { getLastEmbeddedModeKey } from '@/utils/richTextModeKeys';

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
  if (element instanceof RichTextBoxElement) {
    if (key === 'embeddedMode') {
      return element.modeChange
        ? undefined
        : getLastEmbeddedModeKey(element)?.mode;
    }
    if (key === 'embeddedModeKeys') {
      const keys = activeRichTextContentKeys(element).flatMap((contentKey) =>
        locateModeKeysInHtml(element[contentKey]).map(
          ({ element: modeKey }, index) => ({
            contentKey,
            index,
            templateId: modeKey.templateId,
            mode: modeKey.mode,
            scale: modeKey.scale,
            scaleNote: modeKey.scaleNote,
            initialMartyriaStyleId: modeKey.initialMartyriaStyleId,
            fontSize: modeKey.fontSize,
            color: modeKey.color,
            strokeWidth: modeKey.strokeWidth,
          }),
        ),
      );
      return keys.length === 0 ? undefined : keys;
    }
  }
  return Reflect.get(element, key);
}
