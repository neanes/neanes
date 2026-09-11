import { ModeKeyElement } from '@/models/Element';
import {
  getInitialMartyriaContext,
  getInitialMartyriaPronunciation,
} from '@/models/InitialMartyriaResolver';
import {
  cloneInitialMartyriaStyle,
  type InitialMartyriaStructure,
  initialMartyriaStructureHasOrdinalDigits,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { ModelSelector } from '@/models/NeumeI18nMappings';

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

/** The spoken reading a structure gives the mode key of a preview tile. */
export function getSamplePronunciation(
  structure: InitialMartyriaStructure,
  templateId: number,
) {
  const element = ModeKeyElement.createFromTemplate(
    modeKeyTemplates.find((template) => template.id === templateId)!,
  );
  return getInitialMartyriaPronunciation(
    structure,
    getInitialMartyriaContext(element),
  );
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

  if (
    !initialMartyriaStructureHasOrdinalDigits(style.structure) &&
    initialMartyriaStructureHasOrdinalDigits(structure)
  ) {
    next.useOrdinalForms = true;
  }

  return next;
}
