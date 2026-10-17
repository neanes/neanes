import type { ScoreElement } from '@/models/Element';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  pruneParentlessParagraphStyleRootFallbackOverrides,
  wouldCreateParagraphStyleCycle,
} from '@/models/ParagraphStyle';
import type { Score } from '@/models/Score';
import type { Workspace } from '@/models/Workspace';
import type { Command } from '@/services/history/CommandService';
import { CommandFactory } from '@/services/history/CommandService';
import {
  type ParagraphStyleReferenceResolvers,
  planParagraphStyleReferenceRemap,
} from '@/utils/paragraphStyleReferences';

import {
  type ParagraphStyleDefinition,
  paragraphStyleDefinitionSchema,
} from './paragraphStyleSchema';

export function paragraphStyleDefinition(
  style: ParagraphStyle,
): ParagraphStyleDefinition {
  return {
    id: style.id,
    ...(!style.builtIn ? { displayName: style.displayName } : {}),
    parentStyleId: style.parentStyleId,
    overrides: { ...style.overrides },
  };
}

// Both UI replacement and MCP edits validate the complete proposed graph.
export function normalizeParagraphStyles(
  previous: ParagraphStyle[],
  input: ParagraphStyle[],
) {
  const styles = input.map((style) => {
    paragraphStyleDefinitionSchema.parse(paragraphStyleDefinition(style));
    const updated = style.clone();
    if (!updated.builtIn) {
      updated.displayName = updated.displayName.trim();
      updated.parentStyleId ??= BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    } else {
      const original = previous.find((item) => item.id === style.id);
      if (original == null || original.displayName !== style.displayName) {
        throw new Error('BUILT_IN_STYLE_IMMUTABLE');
      }
    }
    pruneParentlessParagraphStyleRootFallbackOverrides(updated);
    return updated;
  });
  const ids = new Set(styles.map((style) => style.id));
  if (ids.size !== styles.length) {
    throw new Error('DUPLICATE_STYLE_ID');
  }
  for (const id of Object.values(BUILT_IN_PARAGRAPH_STYLE_IDS)) {
    if (!ids.has(id)) {
      throw new Error('BUILT_IN_STYLE_REQUIRED');
    }
  }
  const fallbacks = getDeletedStyleFallbacks(
    new Map(previous.map((style) => [style.id, style])),
    ids,
  );
  const names = new Set<string>();
  for (const style of styles) {
    const name = style.displayName.trim();
    // Built-in labels are localized by the UI; only custom names are domain data.
    if (!style.builtIn) {
      if (name === '' || names.has(name)) {
        throw new Error('INVALID_STYLE_NAME');
      }
      names.add(name);
    }
    if (style.parentStyleId != null && fallbacks.has(style.parentStyleId)) {
      style.parentStyleId =
        fallbacks.get(style.parentStyleId) ??
        BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;
    }
    if (style.parentStyleId != null && !ids.has(style.parentStyleId)) {
      throw new Error('STYLE_PARENT_NOT_FOUND');
    }
  }
  for (const style of styles) {
    if (wouldCreateParagraphStyleCycle(styles, style.id, style.parentStyleId)) {
      throw new Error('STYLE_INHERITANCE_CYCLE');
    }
  }
  return styles;
}

function getDeletedStyleFallbacks(
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

export function replaceParagraphStyles(
  workspace: Workspace,
  styles: ParagraphStyle[],
) {
  const normalized = normalizeParagraphStyles(
    workspace.score.paragraphStyles,
    styles,
  );
  workspace.commandService.executeAsBatch(
    createParagraphStyleUpdateCommands(workspace.score, normalized),
  );
  workspace.hasUnsavedChanges = true;
}
