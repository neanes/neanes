import type { ScoreElement } from '@/models/Element';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import type { Score } from '@/models/Score';

import {
  collectClipboardInitialMartyriaStylesFromElements,
  resolveClipboardInitialMartyriaStyles,
  rewriteClipboardElementInitialMartyriaStyleId,
} from './clipboardInitialMartyriaStyles';
import {
  collectClipboardParagraphStylesFromElements,
  resolveClipboardParagraphStyles,
  rewriteClipboardElementParagraphStyleIds,
} from './clipboardParagraphStyles';

/*
 * Every paste that carries styles (score elements, footnote bodies, and mode
 * keys embedded in rich text) imports them the same way: paragraph styles
 * first, then initial martyria styles, whose paragraph style references
 * follow the paragraph style remap. Pasted elements are then rewritten
 * against the result.
 */

/** The styles a score owns, or that a paste adds to it. */
export interface ScoreStyles {
  paragraphStyles: ParagraphStyle[];
  initialMartyriaStyles: InitialMartyriaStyle[];
}

/** The styles a clipboard payload carries. */
export interface ClipboardStyles extends ScoreStyles {
  /**
   * The paragraph style ids the pasted content and the carried initial
   * martyria styles reference directly.
   */
  paragraphStyleIds: Iterable<string>;
}

export interface ImportedClipboardStyles {
  /** The styles the destination lacks, to be added to it. */
  imported: ScoreStyles;
  /** The destination's styles together with the imported ones. */
  styles: ScoreStyles;
  paragraphStyleIdRemap: Map<string, string>;
  initialMartyriaStyleIdRemap: Map<string, string>;
}

/**
 * Merges a clipboard's styles into `target`: an existing style is reused
 * where one matches, and every other style is imported as a copy.
 */
export function importClipboardStyles(
  clipboard: ClipboardStyles,
  target: ScoreStyles,
): ImportedClipboardStyles {
  const { importedParagraphStyles, styleIdRemap } =
    resolveClipboardParagraphStyles(
      clipboard.paragraphStyles,
      target.paragraphStyles,
      clipboard.paragraphStyleIds,
    );
  const paragraphStyles = [
    ...target.paragraphStyles,
    ...importedParagraphStyles,
  ];
  const { importedInitialMartyriaStyles, initialMartyriaStyleIdRemap } =
    resolveClipboardInitialMartyriaStyles(
      clipboard.initialMartyriaStyles,
      target.initialMartyriaStyles,
      paragraphStyles,
      styleIdRemap,
    );

  return {
    imported: {
      paragraphStyles: importedParagraphStyles,
      initialMartyriaStyles: importedInitialMartyriaStyles,
    },
    styles: {
      paragraphStyles,
      initialMartyriaStyles: [
        ...target.initialMartyriaStyles,
        ...importedInitialMartyriaStyles,
      ],
    },
    paragraphStyleIdRemap: styleIdRemap,
    initialMartyriaStyleIdRemap,
  };
}

/**
 * Points a pasted element's paragraph and initial martyria style references
 * at the destination's styles. A reference to a style the destination still
 * lacks falls back to the surface's default.
 */
export function rewriteClipboardElementStyleReferences(
  element: ScoreElement,
  {
    styles,
    paragraphStyleIdRemap,
    initialMartyriaStyleIdRemap,
  }: ImportedClipboardStyles,
) {
  rewriteClipboardElementParagraphStyleIds(
    element,
    styles.paragraphStyles,
    paragraphStyleIdRemap,
  );
  rewriteClipboardElementInitialMartyriaStyleId(
    element,
    styles.initialMartyriaStyles,
    initialMartyriaStyleIdRemap,
  );
}

/**
 * The score values that add `additions` to the score's styles, skipping
 * styles the score already has, or null when there is nothing to add.
 */
export function getScoreStyleAdditions(
  score: ScoreStyles,
  additions: ScoreStyles,
): Partial<Score> | null {
  const paragraphStyles = withoutExisting(
    additions.paragraphStyles,
    score.paragraphStyles,
  );
  const initialMartyriaStyles = withoutExisting(
    additions.initialMartyriaStyles,
    score.initialMartyriaStyles,
  );
  const values: Partial<Score> = {};
  if (paragraphStyles.length > 0) {
    values.paragraphStyles = [...score.paragraphStyles, ...paragraphStyles];
  }
  if (initialMartyriaStyles.length > 0) {
    values.initialMartyriaStyles = [
      ...score.initialMartyriaStyles,
      ...initialMartyriaStyles,
    ];
  }
  return Object.keys(values).length > 0 ? values : null;
}

/**
 * Splits `styles` into the ones `elements` use and the rest. A style is used
 * when an element names it, or through an initial martyria style or a child
 * paragraph style that is itself used.
 */
export function partitionStylesByUse(
  elements: ScoreElement[],
  styles: ScoreStyles,
): { used: ScoreStyles; unused: ScoreStyles } {
  const usedInitialMartyriaStyles =
    collectClipboardInitialMartyriaStylesFromElements(
      elements,
      styles.initialMartyriaStyles,
    );
  const usedIds = new Set(
    [
      ...usedInitialMartyriaStyles,
      ...collectClipboardParagraphStylesFromElements(
        elements,
        usedInitialMartyriaStyles,
        styles.paragraphStyles,
      ),
    ].map(({ id }) => id),
  );
  const isUsed = ({ id }: { id: string }) => usedIds.has(id);
  const isUnused = ({ id }: { id: string }) => !usedIds.has(id);
  return {
    used: {
      paragraphStyles: styles.paragraphStyles.filter(isUsed),
      initialMartyriaStyles: styles.initialMartyriaStyles.filter(isUsed),
    },
    unused: {
      paragraphStyles: styles.paragraphStyles.filter(isUnused),
      initialMartyriaStyles: styles.initialMartyriaStyles.filter(isUnused),
    },
  };
}

// Each style once, leaving out those already present.
function withoutExisting<T extends { id: string }>(
  candidates: T[],
  existing: T[],
) {
  const ids = new Set(existing.map(({ id }) => id));
  return candidates.filter((style) => {
    if (ids.has(style.id)) {
      return false;
    }
    ids.add(style.id);
    return true;
  });
}
