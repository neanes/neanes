import {
  extractModeKeyElementsFromHtml,
  rewriteModeKeyAttributesInHtml,
} from '@/ckeditor-plugins/insertmodekey/modekeydata';
import {
  ElementType,
  type ModeKeyElement,
  RICH_TEXT_BOX_CONTENT_KEYS,
  type RichTextBoxElement,
  type ScoreElement,
} from '@/models/Element';
import type { Score } from '@/models/Score';

/*
 * A mode key names its initial martyria style in one of two places: a
 * standalone mode key element, or a key embedded in the HTML of any panel of
 * a rich text box, whether that panel is shown or only stored. Code that
 * reads or rewrites style references goes through these helpers so neither
 * place is missed.
 */

/** Every element of a score that can hold a mode key. */
export function getScoreModeKeyHosts(
  score: Pick<Score, 'staves' | 'headersAndFooters'>,
): ScoreElement[] {
  return [
    ...score.staves.flatMap((staff) => staff.elements),
    ...score.headersAndFooters,
  ];
}

/**
 * The style each mode key of an element names, or null for a key that
 * follows the score's default style.
 */
export function getModeKeyStyleReferences(
  element: ScoreElement,
): (string | null)[] {
  if (element.elementType === ElementType.ModeKey) {
    return [(element as ModeKeyElement).initialMartyriaStyleId];
  }
  if (element.elementType === ElementType.RichTextBox) {
    const richTextBox = element as RichTextBoxElement;
    return RICH_TEXT_BOX_CONTENT_KEYS.flatMap((key) =>
      extractModeKeyElementsFromHtml(richTextBox[key]).map(
        (modeKey) => modeKey.initialMartyriaStyleId,
      ),
    );
  }
  return [];
}

/**
 * The property changes that make each mode key of an element name the style
 * `rewrite` returns for its current one, or null to follow the score's
 * default. Keys that already follow the default are left alone. Returns
 * null when nothing changes.
 */
export function getModeKeyStyleReferenceChanges(
  element: ScoreElement,
  rewrite: (styleId: string) => string | null,
): Partial<ModeKeyElement> | Partial<RichTextBoxElement> | null {
  if (element.elementType === ElementType.ModeKey) {
    const styleId = (element as ModeKeyElement).initialMartyriaStyleId;
    if (styleId == null) {
      return null;
    }
    const next = rewrite(styleId);
    return next === styleId ? null : { initialMartyriaStyleId: next };
  }
  if (element.elementType !== ElementType.RichTextBox) {
    return null;
  }

  const richTextBox = element as RichTextBoxElement;
  const changes: Partial<RichTextBoxElement> = {};
  for (const key of RICH_TEXT_BOX_CONTENT_KEYS) {
    const content = richTextBox[key];
    const rewritten = rewriteModeKeyAttributesInHtml(content, (attributes) => {
      const styleId = attributes.initialMartyriaStyleId;
      if (typeof styleId !== 'string') {
        return attributes;
      }
      const next = rewrite(styleId);
      return next === styleId
        ? attributes
        : { ...attributes, initialMartyriaStyleId: next };
    });
    if (rewritten !== content) {
      changes[key] = rewritten;
    }
  }
  return Object.keys(changes).length > 0 ? changes : null;
}
