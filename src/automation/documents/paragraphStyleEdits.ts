import type { ParagraphStyleOverrides } from '@/models/ParagraphStyle';
import {
  isBuiltInParagraphStyleId,
  ParagraphStyle,
} from '@/models/ParagraphStyle';
import {
  normalizeParagraphStyles,
  paragraphStyleDefinition,
} from '@/services/documents/paragraphStyles';

import {
  type ParagraphStyleChange,
  paragraphStyleChangeSchema,
} from '../contracts/paragraphStyleChanges';

export function planParagraphStyleEdits(
  previous: ParagraphStyle[],
  input: ParagraphStyleChange[],
) {
  const changes = input.map((change) =>
    paragraphStyleChangeSchema.parse(change),
  );
  if (changes.length === 0) {
    throw new Error('STYLE_CHANGES_REQUIRED');
  }
  const ids = new Set<string>();
  const styles = new Map(previous.map((style) => [style.id, style.clone()]));
  const deleted = new Set(
    changes
      .filter((change) => change.action === 'delete')
      .map((change) => change.id),
  );
  for (const change of changes) {
    const id = 'style' in change ? change.style.id : change.id;
    if (ids.has(id)) {
      throw new Error('DUPLICATE_STYLE_ACTION');
    }
    ids.add(id);
    const existing = styles.get(id);
    if (change.action === 'create') {
      if (existing != null || isBuiltInParagraphStyleId(id)) {
        throw new Error('STYLE_ALREADY_EXISTS');
      }
    } else if (existing == null) {
      throw new Error('STYLE_NOT_FOUND');
    }
    if (change.action === 'delete') {
      if (isBuiltInParagraphStyleId(id)) {
        throw new Error('BUILT_IN_STYLE_IMMUTABLE');
      }
      styles.delete(id);
      continue;
    }
    const supplied =
      change.action === 'update' ? (change.changes ?? {}) : change.style;
    if (supplied.parentStyleId != null && deleted.has(supplied.parentStyleId)) {
      throw new Error('STYLE_PARENT_DELETED');
    }
    const definition =
      change.action === 'update'
        ? {
            ...paragraphStyleDefinition(existing!),
            ...supplied,
            overrides: { ...existing!.overrides, ...supplied.overrides },
          }
        : change.style;
    if (isBuiltInParagraphStyleId(id)) {
      if (definition.displayName !== undefined) {
        throw new Error('BUILT_IN_STYLE_IMMUTABLE');
      }
    } else if (definition.displayName === undefined) {
      throw new Error('STYLE_NAME_REQUIRED');
    }
    const style = existing?.clone() ?? new ParagraphStyle();
    style.id = id;
    if (definition.displayName !== undefined) {
      style.displayName = definition.displayName;
    }
    style.parentStyleId = definition.parentStyleId;
    style.overrides = { ...definition.overrides } as ParagraphStyleOverrides;
    if (change.action === 'update') {
      for (const key of change.resetOverrides ?? []) {
        delete style.overrides[key];
      }
    }
    styles.set(id, style);
  }
  return normalizeParagraphStyles(previous, [...styles.values()]);
}
