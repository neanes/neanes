import type { Namespace, SelectorParam, TFunction } from 'i18next';

import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  type InitialMartyriaLanguageId,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { getNextAvailableStyleName } from '@/utils/styleNames';

type DialogSelector = SelectorParam<'dialog'>;
type Translate = TFunction<Namespace>;

const languageNameSelectors: Record<InitialMartyriaLanguageId, DialogSelector> =
  {
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: ($) =>
      $.dialog.initialMartyriaStyles.languages.greek,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: ($) =>
      $.dialog.initialMartyriaStyles.languages.english,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: ($) =>
      $.dialog.initialMartyriaStyles.languages.spanish,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: ($) =>
      $.dialog.initialMartyriaStyles.languages.churchSlavonic,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: ($) =>
      $.dialog.initialMartyriaStyles.languages.russian,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: ($) =>
      $.dialog.initialMartyriaStyles.languages.arabic,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: ($) =>
      $.dialog.initialMartyriaStyles.languages.romanian,
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: ($) =>
      $.dialog.initialMartyriaStyles.languages.indonesian,
  };

const modeIdentificationMethodSelectors: Record<
  InitialMartyriaModeIdentificationMethod,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text]: ($) =>
    $.dialog.initialMartyriaStyles.modeIdentificationMethods.text,
  [INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign]: ($) =>
    $.dialog.initialMartyriaStyles.modeIdentificationMethods.modeSign,
  [INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign]: ($) =>
    $.dialog.initialMartyriaStyles.modeIdentificationMethods.textAndModeSign,
};

export function getInitialMartyriaLanguageName(
  t: Translate,
  languageId: InitialMartyriaLanguageId,
) {
  return t(languageNameSelectors[languageId], { ns: 'dialog' });
}

export function getInitialMartyriaModeIdentificationMethodLabel(
  t: Translate,
  method: InitialMartyriaModeIdentificationMethod,
) {
  return t(modeIdentificationMethodSelectors[method], { ns: 'dialog' });
}

const neumeFontStyleNameSelector: DialogSelector = ($) =>
  $.dialog.initialMartyriaStyles.neumeFontStyleName;

type StyleNameSource = Pick<InitialMartyriaStyle, 'lettering' | 'structure'>;

/**
 * The selector of the name a new style is given before any number is added:
 * its language, or the neume font for a style lettered in it.
 */
export function getInitialMartyriaStyleBaseNameSelector(
  style: StyleNameSource,
) {
  return style.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont
    ? neumeFontStyleNameSelector
    : languageNameSelectors[style.structure.languageId];
}

/** The name of a style just added: its base name, numbered if taken. */
export function getNewInitialMartyriaStyleName(
  t: Translate,
  style: StyleNameSource,
  takenNames: Iterable<string>,
) {
  return getNextAvailableStyleName(
    t(getInitialMartyriaStyleBaseNameSelector(style), { ns: 'dialog' }),
    takenNames,
  );
}
