import {
  cloneInitialMartyriaStyle,
  getDefaultBuiltInInitialMartyriaStyle,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { ModelSelector } from '@/models/NeumeI18nMappings';
import { remapFontStyleForFamily } from '@/utils/fontStyle';

/*
 * Sample modes for previews. The plagal first mode exposes the plagal
 * wording of a style and the grave mode its irregular name, so together they
 * show every axis at work.
 */
export const PLAGAL_SAMPLE_MODE = 5;
export const GRAVE_SAMPLE_MODE = 7;

const sampleModeLabelSelectors: Record<number, ModelSelector> = {
  1: ($) => $.model.mode.first,
  2: ($) => $.model.mode.second,
  3: ($) => $.model.mode.third,
  4: ($) => $.model.mode.fourth,
  5: ($) => $.model.mode.plagalFirst,
  6: ($) => $.model.mode.plagalSecond,
  7: ($) => $.model.mode.grave,
  8: ($) => $.model.mode.plagalFourth,
};

export function getSampleModeOptions() {
  return Object.entries(sampleModeLabelSelectors).map(
    ([mode, labelSelector]) => ({ mode: Number(mode), labelSelector }),
  );
}

/** The first template of a mode stands in for the mode in previews. */
export function getSampleTemplateId(mode: number) {
  return modeKeyTemplates.find((template) => template.mode === mode)!.id;
}

/**
 * Carry a style's presentation to another structure, adopting the new
 * language's fonts when the structure crosses a language boundary.
 */
export function withInitialMartyriaStyleStructure(
  style: InitialMartyriaStyle,
  structure: InitialMartyriaStructure,
) {
  const next = cloneInitialMartyriaStyle(style);
  next.structure = { ...structure };

  if (structure.languageId === style.structure.languageId) {
    return next;
  }

  const languageAppearance = getDefaultBuiltInInitialMartyriaStyle(
    structure.languageId,
  ).appearance;
  next.appearance.mainFontFamily = languageAppearance.mainFontFamily;
  next.appearance.greekFontFamily = languageAppearance.greekFontFamily;
  next.appearance.fontStyle = remapFontStyleForFamily(
    style.appearance.fontStyle,
    languageAppearance.mainFontFamily,
  );
  return next;
}

/** A gallery tile the user picked: a structure and the style that already has it, if any. */
export interface InitialMartyriaStructureSelection {
  structure: InitialMartyriaStructure;
  matchingStyle: InitialMartyriaStyle | null;
}
