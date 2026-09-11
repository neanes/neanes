import type { ModeKeyElement, ScoreElement } from '@/models/Element';
import { ElementType } from '@/models/Element';
import {
  findInitialMartyriaStyle,
  isBuiltInInitialMartyriaStyleId,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  cloneInitialMartyriaStyle,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type ParagraphStyle,
} from '@/models/ParagraphStyle';

import { resolveClipboardParagraphStyleReference } from './clipboardParagraphStyles';

// A copied mode key references its initial martyria style by id. Built-in
// styles exist in every score, so only the custom styles a copied mode key
// names need to travel with the clipboard.
export function collectClipboardInitialMartyriaStylesFromElements(
  elements: ScoreElement[],
  initialMartyriaStyles: InitialMartyriaStyle[],
) {
  const collectedStyles = new Map<string, InitialMartyriaStyle>();

  for (const element of elements) {
    if (element.elementType !== ElementType.ModeKey) {
      continue;
    }

    const styleId = (element as ModeKeyElement).initialMartyriaStyleId;

    if (
      styleId == null ||
      isBuiltInInitialMartyriaStyleId(styleId) ||
      collectedStyles.has(styleId)
    ) {
      continue;
    }

    const style = initialMartyriaStyles.find((style) => style.id === styleId);

    if (style != null) {
      collectedStyles.set(styleId, cloneInitialMartyriaStyle(style));
    }
  }

  return [...collectedStyles.values()];
}

// Merges the clipboard's custom styles into the destination: a style whose id
// the destination already has is left to the destination, and every other
// one is imported as its own copy under the same id. An imported style's
// paragraph style reference is rewritten with the remap produced for the
// pasted content, so it follows the paragraph style that traveled with it.
export function resolveClipboardInitialMartyriaStyles(
  clipboardInitialMartyriaStyles: InitialMartyriaStyle[],
  targetInitialMartyriaStyles: InitialMartyriaStyle[],
  targetParagraphStyles: ParagraphStyle[],
  paragraphStyleIdRemap: Map<string, string>,
) {
  const targetInitialMartyriaStyleIds = new Set(
    targetInitialMartyriaStyles.map((style) => style.id),
  );
  const targetParagraphStyleIds = new Set(
    targetParagraphStyles.map((style) => style.id),
  );
  const importedInitialMartyriaStyles: InitialMartyriaStyle[] = [];

  for (const clipboardStyle of clipboardInitialMartyriaStyles) {
    if (targetInitialMartyriaStyleIds.has(clipboardStyle.id)) {
      continue;
    }

    const importedStyle = cloneInitialMartyriaStyle(clipboardStyle);
    const paragraphStyleId = resolveClipboardParagraphStyleReference(
      importedStyle.paragraphStyleId,
      targetParagraphStyleIds,
      paragraphStyleIdRemap,
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    );

    if (paragraphStyleId != null) {
      importedStyle.paragraphStyleId = paragraphStyleId;
    }

    importedInitialMartyriaStyles.push(importedStyle);
  }

  return importedInitialMartyriaStyles;
}

// A pasted mode key may name a style the destination does not have even
// after the merge; such a reference follows the score's style instead.
// `initialMartyriaStyles` are the destination's custom styles including the
// ones imported by this paste.
export function rewriteClipboardElementInitialMartyriaStyleId(
  element: ScoreElement,
  initialMartyriaStyles: InitialMartyriaStyle[],
) {
  if (element.elementType !== ElementType.ModeKey) {
    return;
  }

  const modeKey = element as ModeKeyElement;
  const styleId = modeKey.initialMartyriaStyleId;

  if (
    styleId != null &&
    findInitialMartyriaStyle(initialMartyriaStyles, styleId) == null
  ) {
    modeKey.initialMartyriaStyleId = null;
  }
}
