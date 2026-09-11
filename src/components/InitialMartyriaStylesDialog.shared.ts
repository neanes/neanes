import { createDefaultInitialMartyriaTypography } from '@/models/InitialMartyriaBuiltInStyles';
import {
  cloneInitialMartyriaStyle,
  type InitialMartyriaStructure,
  initialMartyriaStructureHasOrdinalDigits,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { ModelSelector } from '@/models/NeumeI18nMappings';
import {
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
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
  paragraphStyles: ParagraphStyle[],
) {
  const next = cloneInitialMartyriaStyle(style);
  next.structure = { ...structure };

  if (
    !initialMartyriaStructureHasOrdinalDigits(style.structure) &&
    initialMartyriaStructureHasOrdinalDigits(structure)
  ) {
    next.useOrdinalForms = true;
  }

  if (structure.languageId === style.structure.languageId) {
    return next;
  }

  const languageTypography = createDefaultInitialMartyriaTypography(
    structure.languageId,
  );
  const languageFontFamily =
    languageTypography.paragraphStyleOverrides.fontFamily;
  if (languageFontFamily == null) {
    delete next.paragraphStyleOverrides.fontFamily;
  } else {
    next.paragraphStyleOverrides.fontFamily = languageFontFamily;
  }
  next.greekFontFamily = languageTypography.greekFontFamily;
  if (next.paragraphStyleOverrides.fontStyle != null) {
    // The face is remapped against the family the style now resolves to.
    next.paragraphStyleOverrides.fontStyle = remapFontStyleForFamily(
      next.paragraphStyleOverrides.fontStyle,
      resolveParagraphStyle(
        paragraphStyles,
        next.paragraphStyleId,
        next.paragraphStyleOverrides,
      ).fontFamily,
    );
  }
  return next;
}

/** A gallery tile the user picked: a structure and the style that already has it, if any. */
export interface InitialMartyriaStructureSelection {
  structure: InitialMartyriaStructure;
  matchingStyle: InitialMartyriaStyle | null;
}
