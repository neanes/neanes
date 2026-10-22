import type { ScoreElement } from '@/models/Element';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import type { Score } from '@/models/Score';
import type { Command } from '@/services/history/CommandService';
import { CommandFactory } from '@/services/history/CommandService';
import {
  type ParagraphStyleReferenceResolvers,
  planParagraphStyleReferenceRemap,
} from '@/utils/paragraphStyleReferences';

export function getDeletedStyleFallbacks(
  previousStylesById: Map<string, ParagraphStyle>,
  nextStyleIds: Set<string>,
) {
  const deletedStyleFallbacks = new Map<string, string | null>();

  for (const [styleId, style] of previousStylesById.entries()) {
    if (nextStyleIds.has(styleId)) {
      continue;
    }

    const visited = new Set<string>();
    let parentStyleId = style.parentStyleId;

    while (parentStyleId != null && !visited.has(parentStyleId)) {
      if (nextStyleIds.has(parentStyleId)) {
        deletedStyleFallbacks.set(styleId, parentStyleId);
        break;
      }

      visited.add(parentStyleId);
      parentStyleId =
        previousStylesById.get(parentStyleId)?.parentStyleId ?? null;
    }

    if (!deletedStyleFallbacks.has(styleId)) {
      deletedStyleFallbacks.set(styleId, null);
    }
  }

  return deletedStyleFallbacks;
}

export function createParagraphStyleUpdateCommands(
  score: Score,
  paragraphStyles: ParagraphStyle[],
): Command[] {
  const previousStylesById = new Map(
    score.paragraphStyles.map((style) => [style.id, style]),
  );
  const clonedStyles = paragraphStyles.map((style) => style.clone());
  const nextStyleIds = new Set(clonedStyles.map((style) => style.id));
  const deletedStyleFallbacks = getDeletedStyleFallbacks(
    previousStylesById,
    nextStyleIds,
  );
  // References to a deleted style move to its nearest surviving ancestor,
  // then to the surface default. Rich text classes whose ids this deletion
  // did not remove are left untouched.
  const remapResolvers: ParagraphStyleReferenceResolvers = {
    resolveStyleId: (styleId, fallbackStyleId) =>
      nextStyleIds.has(styleId)
        ? null
        : (deletedStyleFallbacks.get(styleId) ?? fallbackStyleId),
    resolveRichTextStyleId: (styleId, fallbackStyleId) =>
      deletedStyleFallbacks.has(styleId)
        ? (deletedStyleFallbacks.get(styleId) ?? fallbackStyleId)
        : null,
  };
  const commands: Command[] = [
    new CommandFactory<Score>().create('update-properties', {
      target: score,
      newValues: { paragraphStyles: clonedStyles },
    }),
  ];

  for (const element of [...score.staff.elements, ...score.headersAndFooters]) {
    for (const remap of planParagraphStyleReferenceRemap(
      element,
      remapResolvers,
    )) {
      commands.push(
        new CommandFactory<ScoreElement>().create('update-properties', {
          target: remap.target,
          newValues: remap.newValues,
        }),
      );
    }
  }

  return commands;
}
