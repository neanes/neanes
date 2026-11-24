import { resources } from '@/i18n';
import {
  commonInitialMartyriaWordings,
  createInitialMartyriaStyleFromWording,
  getCommonInitialMartyriaWordingCaptionSelector,
} from '@/models/InitialMartyriaCommonWordings';
import { isInitialMartyriaStructureSupported } from '@/models/InitialMartyriaGrammar';
import {
  getInitialMartyriaModeReading,
  getSupportedInitialMartyriaLettering,
  modeKeyModes,
} from '@/models/InitialMartyriaResolver';
import {
  cloneInitialMartyriaStyle,
  getInitialMartyriaStyleNameKey,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { Score } from '@/models/Score';
import type { InitialMartyriaStyleUpdate } from '@/services/documents/initialMartyriaStyles';

import type { InitialMartyriaStyleChanges } from '../contracts/initialMartyriaStyles';

const commonWordingNames = new Set<string>(
  commonInitialMartyriaWordings.map(({ name }) => name),
);

/*
 * Presets are the common wordings as ready-to-copy style definitions with
 * the default typography. A preset's ID is the wording's name, a placeholder
 * that a copy replaces with an ID of its own.
 */
export function readInitialMartyriaStyles(
  score: Score,
  includePresets = false,
) {
  const styles = score.initialMartyriaStyles.map(cloneInitialMartyriaStyle);
  const presets = includePresets
    ? commonInitialMartyriaWordings.map((wording) =>
        createInitialMartyriaStyleFromWording(
          wording,
          getCommonInitialMartyriaWordingCaptionSelector(wording.name)(
            resources.en,
          ),
          wording.name,
        ),
      )
    : undefined;
  return {
    styles,
    defaultStyleId: score.defaultInitialMartyriaStyleId,
    ...(presets == null ? {} : { presets }),
    modeReadings: getInitialMartyriaModeReadings([
      ...styles,
      ...(presets ?? []),
    ]),
  };
}

/*
 * How each listed definition names modes 1 to 8 aloud, keyed by ID. Wordings
 * can print alike yet read differently (Plagal Mode One beside Plagal of
 * Mode One), so the readings tell them apart. They sit beside the
 * definitions so that a definition can still be copied as it is.
 */
function getInitialMartyriaModeReadings(styles: InitialMartyriaStyle[]) {
  return Object.fromEntries(
    styles.map((style) => [
      style.id,
      modeKeyModes.map((mode) =>
        getInitialMartyriaModeReading(style.structure, mode),
      ),
    ]),
  );
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

  const styles = new Map(
    score.initialMartyriaStyles.map((style) => [style.id, style]),
  );
  const paragraphStyleIds = new Set(score.paragraphStyles.map(({ id }) => id));
  for (const style of upsert) {
    // A preset's ID is a placeholder, so a copy must replace it.
    if (!styles.has(style.id) && commonWordingNames.has(style.id)) {
      throw new Error(
        'INVALID_INITIAL_MARTYRIA_STYLE: A preset ID is a placeholder; give the new style an ID of its own.',
      );
    }
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
