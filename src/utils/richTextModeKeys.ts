import { extractModeKeyElementsFromHtml } from '@/ckeditor-plugins/insertmodekey/modekeydata';
import type { ModeKeyElement, RichTextBoxElement } from '@/models/Element';
import { activeRichTextContentKeys } from '@/services/RichTextFootnotes';

export function getEmbeddedModeKeys(
  element: Readonly<RichTextBoxElement>,
): ModeKeyElement[] {
  return activeRichTextContentKeys(element).flatMap((key) =>
    extractModeKeyElementsFromHtml(element[key]),
  );
}

export function getLastEmbeddedModeKey(
  element: Readonly<RichTextBoxElement>,
): ModeKeyElement | null {
  const modeKeys = getEmbeddedModeKeys(element);
  const modeKey = modeKeys.at(-1) ?? null;

  if (modeKey != null) {
    modeKey.index = element.index;
  }

  return modeKey;
}
