import { extractModeKeyElementsFromHtml } from '@/ckeditor-plugins/insertmodekey/modekeydata';
import type { ModeKeyElement, RichTextBoxElement } from '@/models/Element';

export function getEmbeddedModeKeys(
  element: Readonly<RichTextBoxElement>,
): ModeKeyElement[] {
  const content = element.multipanel
    ? [element.contentLeft, element.contentCenter, element.contentRight]
    : [element.content, element.contentBottom];

  return content.flatMap(extractModeKeyElementsFromHtml);
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
