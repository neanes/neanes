import type { Namespace, SelectorParam, TFunction } from 'i18next';

import type { InitialMartyriaNumeralForm } from '@/models/InitialMartyriaGrammar';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLanguageId,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaModeNamingScheme,
  type InitialMartyriaNumberingSystem,
  type InitialMartyriaNumeralKind,
  type InitialMartyriaNumeralQualifier,
  type InitialMartyriaNumeralStyle,
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

/*
 * The kind of numeral only ever labels a tile of its own, where the mode is
 * identified by a sign and nothing is printed to vary.
 */
const numeralKindSelectors: Record<InitialMartyriaNumeralKind, DialogSelector> =
  {
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralKinds.cardinal,
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralKinds.ordinal,
  };

/*
 * One phrase per numeral form, rather than a kind word interpolated into a
 * style word: the two agree in gender and number in several of the
 * languages, so the phrase cannot be assembled from its parts.
 */
const numeralFormSelectors: Record<
  InitialMartyriaNumeralStyle,
  Record<InitialMartyriaNumeralKind, DialogSelector>
> = {
  [INITIAL_MARTYRIA_NUMERAL_STYLES.Digits]: {
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralForms.digits.cardinal,
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralForms.digits.ordinal,
  },
  [INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals]: {
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralForms.romanNumerals.cardinal,
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralForms.romanNumerals.ordinal,
  },
  [INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals]: {
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralForms.alphabeticNumerals.cardinal,
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralForms.alphabeticNumerals.ordinal,
  },
  [INITIAL_MARTYRIA_NUMERAL_STYLES.Words]: {
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralForms.words.cardinal,
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralForms.words.ordinal,
  },
};

/*
 * A digit repertoire. The language's own digits are the absence of a
 * choice, so they are labelled here rather than in the model.
 */
const numberingSystemSelectors: Record<
  InitialMartyriaNumberingSystem,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_NUMBERING_SYSTEMS.ArabicIndic]: ($) =>
    $.dialog.initialMartyriaStyles.numberingSystems.arabicIndic,
};

const numeralQualifierSelectors: Record<
  InitialMartyriaNumeralQualifier,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal]: ($) =>
    $.dialog.initialMartyriaStyles.numeralQualifiers.postnominal,
  [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal]: ($) =>
    $.dialog.initialMartyriaStyles.numeralQualifiers.prenominal,
};

const modeNamingSchemeSelectors: Record<
  InitialMartyriaModeNamingScheme,
  DialogSelector
> = {
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute]: ($) =>
    $.dialog.initialMartyriaStyles.modeNamingSchemes.absolute,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart]: ($) =>
    $.dialog.initialMartyriaStyles.modeNamingSchemes.authenticCounterpart,
  [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass]: ($) =>
    $.dialog.initialMartyriaStyles.modeNamingSchemes.plagalClass,
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

export function getInitialMartyriaNumeralFormLabel(
  t: Translate,
  form: InitialMartyriaNumeralForm,
) {
  return t(numeralFormSelectors[form.numeralStyle][form.numeralKind], {
    ns: 'dialog',
  });
}

export function getInitialMartyriaNumeralKindLabel(
  t: Translate,
  numeralKind: InitialMartyriaNumeralKind,
) {
  return t(numeralKindSelectors[numeralKind], { ns: 'dialog' });
}

export function getInitialMartyriaNumberingSystemLabel(
  t: Translate,
  numberingSystem: InitialMartyriaNumberingSystem | undefined,
) {
  return t(
    numberingSystem == null
      ? ($) => $.dialog.initialMartyriaStyles.numberingSystems.western
      : numberingSystemSelectors[numberingSystem],
    { ns: 'dialog' },
  );
}

export function getInitialMartyriaNumeralQualifierLabel(
  t: Translate,
  qualifier: InitialMartyriaNumeralQualifier,
) {
  return t(numeralQualifierSelectors[qualifier], { ns: 'dialog' });
}

export function getInitialMartyriaModeNamingSchemeLabel(
  t: Translate,
  scheme: InitialMartyriaModeNamingScheme,
) {
  return t(modeNamingSchemeSelectors[scheme], { ns: 'dialog' });
}
