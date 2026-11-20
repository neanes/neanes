import { resources } from '@/i18n';
import {
  builtInInitialMartyriaStyles,
  getBuiltInInitialMartyriaStyleNameSelector,
} from '@/models/InitialMartyriaBuiltInStyles';
import { isInitialMartyriaStructureSupported } from '@/models/InitialMartyriaGrammar';
import { getSupportedInitialMartyriaLettering } from '@/models/InitialMartyriaResolver';
import {
  cloneInitialMartyriaStyle,
  getInitialMartyriaStyleNameKey,
} from '@/models/InitialMartyriaStyle';
import type { Score } from '@/models/Score';
import type { InitialMartyriaStyleUpdate } from '@/services/documents/initialMartyriaStyles';

import type { InitialMartyriaStyleChanges } from '../contracts/initialMartyriaStyles';

export function readInitialMartyriaStyles(
  score: Score,
  includePresets = false,
) {
  return {
    styles: score.initialMartyriaStyles.map(cloneInitialMartyriaStyle),
    defaultStyleId: score.defaultInitialMartyriaStyleId,
    ...(includePresets
      ? {
          presets: builtInInitialMartyriaStyles.map((style) => ({
            ...style,
            displayName: getBuiltInInitialMartyriaStyleNameSelector(style.id)(
              resources.en,
            ),
          })),
        }
      : {}),
  };
}

export function planInitialMartyriaStyleEdits(
  score: Score,
  { upsert = [], remove = [], defaultStyleId }: InitialMartyriaStyleChanges,
): InitialMartyriaStyleUpdate {
  if (upsert.length + remove.length === 0 && defaultStyleId === undefined) {
    throw new Error('STYLE_CHANGES_REQUIRED');
  }
  const editedIds = [...upsert, ...remove].map(({ id }) => id);
  if (new Set(editedIds).size !== editedIds.length) {
    throw new Error('DUPLICATE_STYLE_ACTION');
  }
  if (editedIds.some((id) => id.startsWith('builtin:'))) {
    throw new Error('BUILT_IN_STYLE_IMMUTABLE');
  }

  const styles = new Map(
    score.initialMartyriaStyles.map((style) => [style.id, style]),
  );
  const paragraphStyleIds = new Set(score.paragraphStyles.map(({ id }) => id));
  for (const style of upsert) {
    if (
      !paragraphStyleIds.has(style.paragraphStyleId) ||
      !paragraphStyleIds.has(style.greekParagraphStyleId)
    ) {
      throw new Error(
        'STYLE_NOT_FOUND: An initial martyria paragraph style does not exist.',
      );
    }
    if (
      !isInitialMartyriaStructureSupported(style.structure) ||
      getSupportedInitialMartyriaLettering(style.lettering, style.structure) !==
        style.lettering
    ) {
      throw new Error('INVALID_INITIAL_MARTYRIA_STYLE');
    }
    styles.set(style.id, style);
  }

  for (const { id } of remove) {
    if (!styles.delete(id)) {
      throw new Error('STYLE_NOT_FOUND');
    }
  }
  const replacements = Object.fromEntries(
    remove.map(({ id, replacementId }) => [id, replacementId]),
  );
  const previousDefault = score.defaultInitialMartyriaStyleId;
  const nextDefault =
    defaultStyleId ??
    (Object.hasOwn(replacements, previousDefault)
      ? replacements[previousDefault]
      : previousDefault);
  if (
    !styles.has(nextDefault) ||
    remove.some(({ replacementId }) => !styles.has(replacementId))
  ) {
    throw new Error(
      'STYLE_NOT_FOUND: The default and replacements must name surviving score styles.',
    );
  }
  const nextStyles = [...styles.values()];
  if (
    new Set(nextStyles.map(getInitialMartyriaStyleNameKey)).size !==
    nextStyles.length
  ) {
    throw new Error(
      'INVALID_STYLE_NAME: Initial martyria style names must be unique.',
    );
  }
  return { styles: nextStyles, defaultStyleId: nextDefault, replacements };
}
