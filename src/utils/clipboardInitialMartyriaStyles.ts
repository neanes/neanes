import {
  extractModeKeyElementsFromHtml,
  rewriteModeKeyAttributesInHtml,
} from '@/ckeditor-plugins/insertmodekey/modekeydata';
import type {
  ModeKeyElement,
  RichTextBoxElement,
  ScoreElement,
} from '@/models/Element';
import { ElementType, RICH_TEXT_BOX_CONTENT_KEYS } from '@/models/Element';
import { getInitialMartyriaWordingKey } from '@/models/InitialMartyriaResolver';
import {
  cloneInitialMartyriaStyle,
  getInitialMartyriaStyleNameKey,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type ParagraphStyle,
} from '@/models/ParagraphStyle';
import { getNextAvailableStyleName } from '@/utils/styleNames';

import { resolveClipboardParagraphStyleReference } from './clipboardParagraphStyles';

export interface ResolvedClipboardInitialMartyriaStyles {
  importedInitialMartyriaStyles: InitialMartyriaStyle[];
  initialMartyriaStyleIdRemap: Map<string, string>;
}

// A copied mode key references its initial martyria style by id, so the
// styles copied mode keys name travel with the clipboard. This includes keys
// in stored panels that can become visible after pasting.
export function collectClipboardInitialMartyriaStylesFromElements(
  elements: ScoreElement[],
  initialMartyriaStyles: InitialMartyriaStyle[],
) {
  const collectedStyles = new Map<string, InitialMartyriaStyle>();

  for (const element of elements) {
    const modeKeys =
      element.elementType === ElementType.ModeKey
        ? [element as ModeKeyElement]
        : element.elementType === ElementType.RichTextBox
          ? RICH_TEXT_BOX_CONTENT_KEYS.flatMap((key) =>
              extractModeKeyElementsFromHtml(
                (element as RichTextBoxElement)[key],
              ),
            )
          : [];

    for (const modeKey of modeKeys) {
      const styleId = modeKey.initialMartyriaStyleId;

      if (styleId == null || collectedStyles.has(styleId)) {
        continue;
      }

      const style = initialMartyriaStyles.find((style) => style.id === styleId);

      if (style != null) {
        collectedStyles.set(styleId, cloneInitialMartyriaStyle(style));
      }
    }
  }

  return [...collectedStyles.values()];
}

// Merges the clipboard's custom styles into the destination. Like paragraph
// styles, an existing style is reused by id first and then by name (see
// getInitialMartyriaStyleNameKey), though by name only when it also reads
// the same way. Every other style is imported as its own copy under the same
// id, renamed when its name is taken, since names are unique. An imported
// style's paragraph style references are rewritten with the remap produced
// for the pasted content, so they follow the paragraph styles that traveled
// with it.
export function resolveClipboardInitialMartyriaStyles(
  clipboardInitialMartyriaStyles: InitialMartyriaStyle[],
  targetInitialMartyriaStyles: InitialMartyriaStyle[],
  targetParagraphStyles: ParagraphStyle[],
  paragraphStyleIdRemap: Map<string, string>,
): ResolvedClipboardInitialMartyriaStyles {
  const targetInitialMartyriaStyleIds = new Set(
    targetInitialMartyriaStyles.map((style) => style.id),
  );
  const targetParagraphStyleIds = new Set(
    targetParagraphStyles.map((style) => style.id),
  );
  const targetInitialMartyriaStylesByName = new Map(
    targetInitialMartyriaStyles.map((style) => [
      getInitialMartyriaStyleNameKey(style),
      style,
    ]),
  );
  const takenNames = targetInitialMartyriaStyles.map(
    (style) => style.displayName,
  );
  const importedInitialMartyriaStyles: InitialMartyriaStyle[] = [];
  const initialMartyriaStyleIdRemap = new Map<string, string>();

  for (const clipboardStyle of clipboardInitialMartyriaStyles) {
    if (targetInitialMartyriaStyleIds.has(clipboardStyle.id)) {
      initialMartyriaStyleIdRemap.set(clipboardStyle.id, clipboardStyle.id);
      continue;
    }

    const targetStyle = targetInitialMartyriaStylesByName.get(
      getInitialMartyriaStyleNameKey(clipboardStyle),
    );

    if (
      targetStyle != null &&
      getInitialMartyriaWordingKey(targetStyle) ===
        getInitialMartyriaWordingKey(clipboardStyle)
    ) {
      initialMartyriaStyleIdRemap.set(clipboardStyle.id, targetStyle.id);
      continue;
    }

    const importedStyle = cloneInitialMartyriaStyle(clipboardStyle);
    importedStyle.displayName = getNextAvailableStyleName(
      importedStyle.displayName,
      takenNames,
    );
    takenNames.push(importedStyle.displayName);
    const paragraphStyleId = resolveClipboardParagraphStyleReference(
      importedStyle.paragraphStyleId,
      targetParagraphStyleIds,
      paragraphStyleIdRemap,
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    );

    if (paragraphStyleId != null) {
      importedStyle.paragraphStyleId = paragraphStyleId;
    }

    const greekParagraphStyleId = resolveClipboardParagraphStyleReference(
      importedStyle.greekParagraphStyleId,
      targetParagraphStyleIds,
      paragraphStyleIdRemap,
      BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyriaGreek,
    );

    if (greekParagraphStyleId != null) {
      importedStyle.greekParagraphStyleId = greekParagraphStyleId;
    }

    importedInitialMartyriaStyles.push(importedStyle);
    initialMartyriaStyleIdRemap.set(clipboardStyle.id, importedStyle.id);
  }

  return {
    importedInitialMartyriaStyles,
    initialMartyriaStyleIdRemap,
  };
}

// A pasted mode key may name a style the destination does not have even
// after the merge; such a reference follows the score's style instead.
// `initialMartyriaStyles` are the destination's styles including the ones
// imported by this paste.
export function rewriteClipboardElementInitialMartyriaStyleId(
  element: ScoreElement,
  initialMartyriaStyles: InitialMartyriaStyle[],
  styleIdRemap: Map<string, string>,
) {
  const rewrite = (styleId: string) => {
    const resolvedStyleId = styleIdRemap.get(styleId) ?? styleId;
    return initialMartyriaStyles.some((style) => style.id === resolvedStyleId)
      ? resolvedStyleId
      : null;
  };

  if (element.elementType === ElementType.RichTextBox) {
    const richTextBox = element as RichTextBoxElement;

    for (const contentKey of RICH_TEXT_BOX_CONTENT_KEYS) {
      richTextBox[contentKey] = rewriteModeKeyAttributesInHtml(
        richTextBox[contentKey],
        (attributes) => {
          const styleId = attributes.initialMartyriaStyleId;

          return typeof styleId === 'string'
            ? { ...attributes, initialMartyriaStyleId: rewrite(styleId) }
            : attributes;
        },
      );
    }
  } else if (element.elementType === ElementType.ModeKey) {
    const modeKey = element as ModeKeyElement;

    if (modeKey.initialMartyriaStyleId != null) {
      modeKey.initialMartyriaStyleId = rewrite(modeKey.initialMartyriaStyleId);
    }
  }
}
