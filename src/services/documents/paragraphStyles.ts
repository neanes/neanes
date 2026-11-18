import type { ParagraphStyle } from '@/models/ParagraphStyle';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  pruneParentlessParagraphStyleRootFallbackOverrides,
  wouldCreateParagraphStyleCycle,
} from '@/models/ParagraphStyle';
import type { Workspace } from '@/models/Workspace';
import {
  createParagraphStyleUpdateCommands,
  getDeletedStyleFallbacks,
} from '@/services/paragraphStyles';

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
}
