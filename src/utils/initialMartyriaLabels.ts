import type { Namespace, SelectorParam, TFunction } from 'i18next';

import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLanguageId,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaNumeralStyle,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';

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

const numeralStyleSelectors: Record<
  InitialMartyriaNumeralStyle,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_NUMERAL_STYLES.Digits]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyles.digits,
  [INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyles.romanNumerals,
  [INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyles.alphabeticNumerals,
  [INITIAL_MARTYRIA_NUMERAL_STYLES.Words]: ($) =>
    $.dialog.initialMartyriaStyles.numeralStyles.words,
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

/** How the mode number is written, as a heading for the wordings using it. */
export function getInitialMartyriaNumeralStyleLabel(
  t: Translate,
  numeralStyle: InitialMartyriaNumeralStyle,
) {
  return t(numeralStyleSelectors[numeralStyle], { ns: 'dialog' });
}

export interface InitialMartyriaStyleQualifiers {
  language: string;
  /** Set only for music-font lettering; text lettering is the norm. */
  lettering: string | null;
}

/**
 * The qualifiers shown beside a style's name: its language and, when it is
 * lettered in the neume font, its lettering. They name the scope the style's
 * name is unique within.
 */
export function getInitialMartyriaStyleQualifiers(
  t: Translate,
  style: Pick<InitialMartyriaStyle, 'lettering' | 'structure'>,
): InitialMartyriaStyleQualifiers {
  return {
    language: getInitialMartyriaLanguageName(t, style.structure.languageId),
    lettering:
      style.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont
        ? t(($) => $.dialog.initialMartyriaStyles.neumeFontLettering, {
            ns: 'dialog',
          })
        : null,
  };
}

/** A style's name with its qualifiers, for lists that show one line. */
export function getInitialMartyriaStyleQualifiedName(
  t: Translate,
  name: string,
  style: Pick<InitialMartyriaStyle, 'lettering' | 'structure'>,
) {
  const { language, lettering } = getInitialMartyriaStyleQualifiers(t, style);
  return lettering == null
    ? t(($) => $.dialog.initialMartyriaStyles.styleNameWithLanguage, {
        ns: 'dialog',
        name,
        language,
      })
    : t(
        ($) => $.dialog.initialMartyriaStyles.styleNameWithLanguageAndLettering,
        {
          ns: 'dialog',
          name,
          language,
          lettering,
        },
      );
}
