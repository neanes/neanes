import type { Namespace, SelectorParam, TFunction } from 'i18next';

import type { InitialMartyriaNumeralForm } from '@/models/InitialMartyriaGrammar';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLanguageId,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaModeNamingScheme,
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

const numeralKindSelectors: Record<InitialMartyriaNumeralKind, DialogSelector> =
  {
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralKinds.cardinal,
    [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal]: ($) =>
      $.dialog.initialMartyriaStyles.numeralKinds.ordinal,
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
  return t(($) => $.dialog.initialMartyriaStyles.numeralForm, {
    ns: 'dialog',
    style: t(numeralStyleSelectors[form.numeralStyle], { ns: 'dialog' }),
    kind: t(numeralKindSelectors[form.numeralKind], { ns: 'dialog' }),
  });
}

export function getInitialMartyriaNumeralKindLabel(
  t: Translate,
  numeralKind: InitialMartyriaNumeralKind,
) {
  return t(numeralKindSelectors[numeralKind], { ns: 'dialog' });
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
