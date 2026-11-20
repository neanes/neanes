import {
  getInitialMartyriaPrintedForm,
  getSupportedInitialMartyriaLettering,
  modeKeyModes,
} from '@/models/InitialMartyriaResolver';
import {
  cloneInitialMartyriaStyle,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
  type ModeKeyMode,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { ModelSelector } from '@/models/NeumeI18nMappings';

/*
 * Sample modes for previews. The plagal first mode exposes the plagal
 * wording of a style, so it shows every axis at work.
 */
export const PLAGAL_SAMPLE_MODE: ModeKeyMode = 5;

const sampleModeLabelSelectors: Record<ModeKeyMode, ModelSelector> = {
  1: ($) => $.model.mode.first,
  2: ($) => $.model.mode.second,
  3: ($) => $.model.mode.third,
  4: ($) => $.model.mode.fourth,
  5: ($) => $.model.mode.plagalFirst,
  6: ($) => $.model.mode.plagalSecond,
  7: ($) => $.model.mode.grave,
  8: ($) => $.model.mode.plagalFourth,
};

/** A mode as previewed: its label and the template standing in for it. */
export function getSample(mode: ModeKeyMode) {
  return {
    mode,
    labelSelector: sampleModeLabelSelectors[mode],
    templateId: getSampleTemplateId(mode),
  };
}

/*
 * Grows a set of modes until it tells every pair of structures apart, adding
 * each time the mode whose printed forms separate the most remaining pairs.
 * Each structure's printed forms are built once, up front.
 */
function getSeparatingModes(
  structures: InitialMartyriaStructure[],
  initialModes: ModeKeyMode[],
) {
  const printedForms = structures.map(
    (structure) =>
      new Map(
        modeKeyModes.map((mode) => [
          mode,
          getInitialMartyriaPrintedForm(structure, mode),
        ]),
      ),
  );
  const differ = (a: number, b: number, mode: ModeKeyMode) =>
    printedForms[a].get(mode) !== printedForms[b].get(mode);

  const modes = [...initialModes];
  let pairs: [number, number][] = [];
  for (let i = 0; i < structures.length; i++) {
    for (let j = i + 1; j < structures.length; j++) {
      if (!modes.some((mode) => differ(i, j, mode))) {
        pairs.push([i, j]);
      }
    }
  }
  while (pairs.length > 0) {
    let bestMode: ModeKeyMode | null = null;
    let bestCount = 0;
    for (const mode of modeKeyModes.filter((mode) => !modes.includes(mode))) {
      const count = pairs.filter(([a, b]) => differ(a, b, mode)).length;
      if (count > bestCount) {
        bestMode = mode;
        bestCount = count;
      }
    }
    if (bestMode == null) {
      break;
    }
    modes.push(bestMode);
    pairs = pairs.filter(([a, b]) => !differ(a, b, bestMode));
  }
  return modes.sort((a, b) => a - b);
}

/**
 * The modes a list of wordings is previewed in: the first and plagal first
 * modes, then whichever further modes it takes to tell every wording apart.
 */
export function getWordingSampleModes(structures: InitialMartyriaStructure[]) {
  return getSeparatingModes(structures, [1, PLAGAL_SAMPLE_MODE]);
}

/** The first template of a mode stands in for the mode in previews. */
export function getSampleTemplateId(mode: ModeKeyMode) {
  return modeKeyTemplates.find((template) => template.mode === mode)!.id;
}

/**
 * Carry a style's presentation to another structure.
 */
export function withInitialMartyriaStyleStructure(
  style: InitialMartyriaStyle,
  structure: InitialMartyriaStructure,
) {
  const next = cloneInitialMartyriaStyle(style);
  next.structure = { ...structure };
  next.lettering = getSupportedInitialMartyriaLettering(
    style.lettering,
    structure,
  );
  return next;
}
