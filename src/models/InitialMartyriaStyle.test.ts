import { describe, expect, it } from 'vitest';

import { resources } from '@/i18n';
import { ModeKeyElement } from '@/models/Element';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  type BuiltInInitialMartyriaStyleId,
  builtInInitialMartyriaStyles,
  cloneInitialMartyriaStyle,
  createDefaultInitialMartyriaAppearance,
  createInitialMartyriaStyle,
  enumerateInitialMartyriaStructures,
  findInitialMartyriaStyleWithStructure,
  getBuiltInInitialMartyriaStyle,
  getBuiltInInitialMartyriaStyleNameSelector,
  getInitialMartyriaContext,
  getInitialMartyriaFixedSeparatorSize,
  getInitialMartyriaStructureKey,
  getInitialMartyriaStructureVariations,
  getSupportedInitialMartyriaNumeralForms,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  initialMartyriaModeIdentificationMethods,
  initialMartyriaNumeralForms,
  type InitialMartyriaStartingNoteRun,
  type InitialMartyriaStructure,
  initialMartyriaStructuresEqual,
  type InitialMartyriaStyle,
  isInitialMartyriaStructureSupported,
  normalizeInitialMartyriaStructure,
  type ResolvedInitialMartyriaRun,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleAppearances,
  resolveInitialMartyriaStyleSelection,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { ScaleNote } from '@/models/Scales';

function encodeRun(run: ResolvedInitialMartyriaRun) {
  if (run.kind === 'glyph') {
    return '<modeSign>';
  }
  if (run.kind === 'startingPitch') {
    return '<pitch>';
  }
  const prefix = run.fontRole === 'greek' ? 'greek:' : '';
  return run.content.layout === 'inline'
    ? prefix + run.content.text
    : prefix + run.content.lines.join('/');
}

/** An unsaved style with the language's default typography. */
function styleFor(structure: InitialMartyriaStructure): InitialMartyriaStyle {
  return {
    id: 'test',
    displayName: 'Test',
    basedOn: null,
    structure,
    appearance: createDefaultInitialMartyriaAppearance(structure.languageId),
  };
}

function elementForMode(mode: number) {
  return ModeKeyElement.createFromTemplate(
    modeKeyTemplates.find((template) => template.mode === mode)!,
  );
}

function elementForTemplate(templateId: number) {
  return ModeKeyElement.createFromTemplate(
    modeKeyTemplates.find((template) => template.id === templateId)!,
  );
}

function resolve(style: InitialMartyriaStyle, element: ModeKeyElement) {
  return resolveInitialMartyriaStyle({
    context: getInitialMartyriaContext(element),
    resolvedStyle: resolveInitialMartyriaStyleAppearances(style),
    pageSetup: new PageSetup(),
  });
}

function textOf(runs: ResolvedInitialMartyriaRun[]) {
  return runs.flatMap((run) => {
    if (run.kind !== 'text') {
      return [];
    }
    return run.content.layout === 'inline'
      ? [run.content.text]
      : run.content.lines;
  });
}

const attestedStructures: Record<string, InitialMartyriaStructure> = {
  'traditional-greek': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'greek-mode-names': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-plagal-first': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-mode-names': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-authentic-counterpart-ordinal-digits-text': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-authentic-counterpart-number-sign': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-authentic-counterpart-number-text': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-authentic-counterpart-roman-numeral-text': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-authentic-counterpart-number-word-text': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-sign-first': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-plagal-class-ordinal-words-text': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-plagal-class-ordinal-words': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-ordinal-plagal-text': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-ordinal-plagal': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-ordinal': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-mode-number': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-mode-roman-numeral': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-mode-number-word': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-full-name': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-authentic-counterpart-ordinal-digits': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-authentic-counterpart-number': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-authentic-counterpart-roman-numeral': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'english-authentic-counterpart-number-word': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'spanish-tono-number': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'spanish-tono-roman-numeral': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'spanish-tono-ordinal-number': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'spanish-tono-ordinal': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'spanish-ordinal-tono': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'church-slavonic-glas-number': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: true,
    flowDirection: 'page',
  },
  'church-slavonic-glas-cyrillic-numeral': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: true,
    flowDirection: 'page',
  },
  'church-slavonic-glas-cyrillic-numeral-text': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: true,
    flowDirection: 'page',
  },
  'church-slavonic-glas-ordinal': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: true,
    flowDirection: 'page',
  },
  'church-slavonic-glas-ordinal-text': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: true,
    flowDirection: 'page',
  },
  'russian-glas-number': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: true,
    flowDirection: 'page',
  },
  'russian-glas-ordinal': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: true,
    flowDirection: 'page',
  },
  'russian-glas-ordinal-text': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: true,
    flowDirection: 'page',
  },
  'arabic-ordinal': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'rtl',
  },
  'arabic-ordinal-digits': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'rtl',
  },
  'romanian-glas-number': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'romanian-glas-roman-numeral': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'romanian-glas-ordinal-number': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'romanian-glas-ordinal-roman-numeral': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
  'romanian-glas': {
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    transliterateNoteNames: false,
    flowDirection: 'page',
  },
};

/*
 * The attested look of every structure a curated style has ever had: the
 * exact run sequence for modes 1-8. Changing an entry here changes what published scores look
 * like, so treat edits as deliberate typographic decisions.
 */
const expectedRunsByStructure: [string, string[]][] = [
  [
    'traditional-greek',
    [
      'Ἦχος | <modeSign> | <pitch>',
      'Ἦχος | <modeSign> | <pitch>',
      'Ἦχος | <modeSign> | <pitch>',
      'Ἦχος | <modeSign> | <pitch>',
      'Ἦχος | greek:λ/π | <modeSign> | <pitch>',
      'Ἦχος | greek:λ/π | <modeSign> | <pitch>',
      'Ἦχος | Βαρύς | <modeSign> | <pitch>',
      'Ἦχος | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'greek-mode-names',
    [
      'Ἦχος | αʹ. | <pitch>',
      'Ἦχος | βʹ. | <pitch>',
      'Ἦχος | γʹ. | <pitch>',
      'Ἦχος | δʹ. | <pitch>',
      'Ἦχος | greek:λ/π | αʹ. | <pitch>',
      'Ἦχος | greek:λ/π | βʹ. | <pitch>',
      'Ἦχος | βαρύς. | <pitch>',
      'Ἦχος | greek:λ/π | δʹ. | <pitch>',
    ],
  ],
  [
    'english-plagal-first',
    [
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      'greek:λ/π | <modeSign> | Mode | <pitch>',
      'greek:λ/π | <modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      'greek:λ/π | <modeSign> | Mode | <pitch>',
    ],
  ],
  [
    'english-mode-names',
    [
      'First | Mode. | <pitch>',
      'Second | Mode. | <pitch>',
      'Third | Mode. | <pitch>',
      'Fourth | Mode. | <pitch>',
      'Plagal of | First | Mode. | <pitch>',
      'Plagal of | Second | Mode. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | Fourth | Mode. | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-ordinal-digits-text',
    [
      '1ˢᵗ | Mode. | <pitch>',
      '2ⁿᵈ | Mode. | <pitch>',
      '3ʳᵈ | Mode. | <pitch>',
      '4ᵗʰ | Mode. | <pitch>',
      'Plagal of | 1ˢᵗ | Mode. | <pitch>',
      'Plagal of | 2ⁿᵈ | Mode. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | 4ᵗʰ | Mode. | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number-sign',
    [
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'Mode | <modeSign> | <pitch>',
      'greek:λ/π | Mode | <modeSign> | <pitch>',
      'greek:λ/π | Mode | <modeSign> | <pitch>',
      '<modeSign> | Mode | <pitch>',
      'greek:λ/π | Mode | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number-text',
    [
      'Mode | 1. | <pitch>',
      'Mode | 2. | <pitch>',
      'Mode | 3. | <pitch>',
      'Mode | 4. | <pitch>',
      'Plagal of | Mode | 1. | <pitch>',
      'Plagal of | Mode | 2. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | Mode | 4. | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-roman-numeral-text',
    [
      'Mode | I. | <pitch>',
      'Mode | II. | <pitch>',
      'Mode | III. | <pitch>',
      'Mode | IV. | <pitch>',
      'Plagal of | Mode | I. | <pitch>',
      'Plagal of | Mode | II. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | Mode | IV. | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number-word-text',
    [
      'Mode | One. | <pitch>',
      'Mode | Two. | <pitch>',
      'Mode | Three. | <pitch>',
      'Mode | Four. | <pitch>',
      'Plagal of | Mode | One. | <pitch>',
      'Plagal of | Mode | Two. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Plagal of | Mode | Four. | <pitch>',
    ],
  ],
  [
    'english-sign-first',
    [
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | greek:λ/π | Mode | <pitch>',
      '<modeSign> | greek:λ/π | Mode | <pitch>',
      '<modeSign> | Mode | <pitch>',
      '<modeSign> | greek:λ/π | Mode | <pitch>',
    ],
  ],
  [
    'english-plagal-class-ordinal-words-text',
    [
      'First | Mode. | <pitch>',
      'Second | Mode. | <pitch>',
      'Third | Mode. | <pitch>',
      'Fourth | Mode. | <pitch>',
      'First | Plagal | Mode. | <pitch>',
      'Second | Plagal | Mode. | <pitch>',
      'Grave | Mode. | <pitch>',
      'Fourth | Plagal | Mode. | <pitch>',
    ],
  ],
  [
    'english-plagal-class-ordinal-words',
    [
      'First | Mode. | <modeSign> | <pitch>',
      'Second | Mode. | <modeSign> | <pitch>',
      'Third | Mode. | <modeSign> | <pitch>',
      'Fourth | Mode. | <modeSign> | <pitch>',
      'First | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Second | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Fourth | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-ordinal-plagal-text',
    [
      '1ˢᵗ | Mode. | <pitch>',
      '2ⁿᵈ | Mode. | <pitch>',
      '3ʳᵈ | Mode. | <pitch>',
      '4ᵗʰ | Mode. | <pitch>',
      '1ˢᵗ | Plagal | Mode. | <pitch>',
      '2ⁿᵈ | Plagal | Mode. | <pitch>',
      'Grave | Mode. | <pitch>',
      '4ᵗʰ | Plagal | Mode. | <pitch>',
    ],
  ],
  [
    'english-ordinal-plagal',
    [
      '1ˢᵗ | Mode. | <modeSign> | <pitch>',
      '2ⁿᵈ | Mode. | <modeSign> | <pitch>',
      '3ʳᵈ | Mode. | <modeSign> | <pitch>',
      '4ᵗʰ | Mode. | <modeSign> | <pitch>',
      '1ˢᵗ | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
      '2ⁿᵈ | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      '4ᵗʰ | Plagal | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-ordinal',
    [
      'First | Mode. | <modeSign> | <pitch>',
      'Second | Mode. | <modeSign> | <pitch>',
      'Third | Mode. | <modeSign> | <pitch>',
      'Fourth | Mode. | <modeSign> | <pitch>',
      'Fifth | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Sixth | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Seventh | Mode. | <modeSign> | <pitch>',
      'Eighth | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-mode-number',
    [
      'Mode | 1. | <modeSign> | <pitch>',
      'Mode | 2. | <modeSign> | <pitch>',
      'Mode | 3. | <modeSign> | <pitch>',
      'Mode | 4. | <modeSign> | <pitch>',
      'Mode | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | 7. | <modeSign> | <pitch>',
      'Mode | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-mode-roman-numeral',
    [
      'Mode | I. | <modeSign> | <pitch>',
      'Mode | II. | <modeSign> | <pitch>',
      'Mode | III. | <modeSign> | <pitch>',
      'Mode | IV. | <modeSign> | <pitch>',
      'Mode | V. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | VI. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | VII. | <modeSign> | <pitch>',
      'Mode | VIII. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-mode-number-word',
    [
      'Mode | One. | <modeSign> | <pitch>',
      'Mode | Two. | <modeSign> | <pitch>',
      'Mode | Three. | <modeSign> | <pitch>',
      'Mode | Four. | <modeSign> | <pitch>',
      'Mode | Five. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | Six. | greek:λ/π | <modeSign> | <pitch>',
      'Mode | Seven. | <modeSign> | <pitch>',
      'Mode | Eight. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-full-name',
    [
      'First | Mode. | <modeSign> | <pitch>',
      'Second | Mode. | <modeSign> | <pitch>',
      'Third | Mode. | <modeSign> | <pitch>',
      'Fourth | Mode. | <modeSign> | <pitch>',
      'Plagal of | First | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | Second | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | Fourth | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-ordinal-digits',
    [
      '1ˢᵗ | Mode. | <modeSign> | <pitch>',
      '2ⁿᵈ | Mode. | <modeSign> | <pitch>',
      '3ʳᵈ | Mode. | <modeSign> | <pitch>',
      '4ᵗʰ | Mode. | <modeSign> | <pitch>',
      'Plagal of | 1ˢᵗ | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | 2ⁿᵈ | Mode. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | 4ᵗʰ | Mode. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number',
    [
      'Mode | 1. | <modeSign> | <pitch>',
      'Mode | 2. | <modeSign> | <pitch>',
      'Mode | 3. | <modeSign> | <pitch>',
      'Mode | 4. | <modeSign> | <pitch>',
      'Plagal of | Mode | 1. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | Mode | 2. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | Mode | 4. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-roman-numeral',
    [
      'Mode | I. | <modeSign> | <pitch>',
      'Mode | II. | <modeSign> | <pitch>',
      'Mode | III. | <modeSign> | <pitch>',
      'Mode | IV. | <modeSign> | <pitch>',
      'Plagal of | Mode | I. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | Mode | II. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | Mode | IV. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'english-authentic-counterpart-number-word',
    [
      'Mode | One. | <modeSign> | <pitch>',
      'Mode | Two. | <modeSign> | <pitch>',
      'Mode | Three. | <modeSign> | <pitch>',
      'Mode | Four. | <modeSign> | <pitch>',
      'Plagal of | Mode | One. | greek:λ/π | <modeSign> | <pitch>',
      'Plagal of | Mode | Two. | greek:λ/π | <modeSign> | <pitch>',
      'Grave | Mode. | <modeSign> | <pitch>',
      'Plagal of | Mode | Four. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-tono-number',
    [
      'Tono | 1. | <modeSign> | <pitch>',
      'Tono | 2. | <modeSign> | <pitch>',
      'Tono | 3. | <modeSign> | <pitch>',
      'Tono | 4. | <modeSign> | <pitch>',
      'Tono | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 7. | <modeSign> | <pitch>',
      'Tono | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-tono-roman-numeral',
    [
      'Tono | I. | <modeSign> | <pitch>',
      'Tono | II. | <modeSign> | <pitch>',
      'Tono | III. | <modeSign> | <pitch>',
      'Tono | IV. | <modeSign> | <pitch>',
      'Tono | V. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | VI. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | VII. | <modeSign> | <pitch>',
      'Tono | VIII. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-tono-ordinal-number',
    [
      'Tono | 1.º. | <modeSign> | <pitch>',
      'Tono | 2.º. | <modeSign> | <pitch>',
      'Tono | 3.º. | <modeSign> | <pitch>',
      'Tono | 4.º. | <modeSign> | <pitch>',
      'Tono | 5.º. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 6.º. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | 7.º. | <modeSign> | <pitch>',
      'Tono | 8.º. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-tono-ordinal',
    [
      'Tono | primero. | <modeSign> | <pitch>',
      'Tono | segundo. | <modeSign> | <pitch>',
      'Tono | tercero. | <modeSign> | <pitch>',
      'Tono | cuarto. | <modeSign> | <pitch>',
      'Tono | quinto. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | sexto. | greek:λ/π | <modeSign> | <pitch>',
      'Tono | séptimo. | <modeSign> | <pitch>',
      'Tono | octavo. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'spanish-ordinal-tono',
    [
      'Primer | tono. | <modeSign> | <pitch>',
      'Segundo | tono. | <modeSign> | <pitch>',
      'Tercer | tono. | <modeSign> | <pitch>',
      'Cuarto | tono. | <modeSign> | <pitch>',
      'Quinto | tono. | greek:λ/π | <modeSign> | <pitch>',
      'Sexto | tono. | greek:λ/π | <modeSign> | <pitch>',
      'Séptimo | tono. | <modeSign> | <pitch>',
      'Octavo | tono. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'church-slavonic-glas-number',
    [
      'Гла́съ | 1. | <modeSign> | <pitch>',
      'Гла́съ | 2. | <modeSign> | <pitch>',
      'Гла́съ | 3. | <modeSign> | <pitch>',
      'Гла́съ | 4. | <modeSign> | <pitch>',
      'Гла́съ | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | 7. | <modeSign> | <pitch>',
      'Гла́съ | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'church-slavonic-glas-cyrillic-numeral',
    [
      'Гла́съ | а҃. | <modeSign> | <pitch>',
      'Гла́съ | в҃. | <modeSign> | <pitch>',
      'Гла́съ | г҃. | <modeSign> | <pitch>',
      'Гла́съ | д҃. | <modeSign> | <pitch>',
      'Гла́съ | є҃. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | ѕ҃. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | з҃. | <modeSign> | <pitch>',
      'Гла́съ | и҃. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'church-slavonic-glas-cyrillic-numeral-text',
    [
      'Гла́съ | а҃. | <pitch>',
      'Гла́съ | в҃. | <pitch>',
      'Гла́съ | г҃. | <pitch>',
      'Гла́съ | д҃. | <pitch>',
      'Гла́съ | є҃. | <pitch>',
      'Гла́съ | ѕ҃. | <pitch>',
      'Гла́съ | з҃. | <pitch>',
      'Гла́съ | и҃. | <pitch>',
    ],
  ],
  [
    'church-slavonic-glas-ordinal',
    [
      'Гла́съ | пе́рвый. | <modeSign> | <pitch>',
      'Гла́съ | вторы́й. | <modeSign> | <pitch>',
      'Гла́съ | тре́тїй. | <modeSign> | <pitch>',
      'Гла́съ | четве́ртый. | <modeSign> | <pitch>',
      'Гла́съ | пѧ́тый. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | шесты́й. | greek:λ/π | <modeSign> | <pitch>',
      'Гла́съ | седмы́й. | <modeSign> | <pitch>',
      'Гла́съ | ѻ҆сьмы́й. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'church-slavonic-glas-ordinal-text',
    [
      'Гла́съ | пе́рвый. | <pitch>',
      'Гла́съ | вторы́й. | <pitch>',
      'Гла́съ | тре́тїй. | <pitch>',
      'Гла́съ | четве́ртый. | <pitch>',
      'Гла́съ | пѧ́тый. | <pitch>',
      'Гла́съ | шесты́й. | <pitch>',
      'Гла́съ | седмы́й. | <pitch>',
      'Гла́съ | ѻ҆сьмы́й. | <pitch>',
    ],
  ],
  [
    'russian-glas-number',
    [
      'Глас | 1. | <modeSign> | <pitch>',
      'Глас | 2. | <modeSign> | <pitch>',
      'Глас | 3. | <modeSign> | <pitch>',
      'Глас | 4. | <modeSign> | <pitch>',
      'Глас | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Глас | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Глас | 7. | <modeSign> | <pitch>',
      'Глас | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'russian-glas-ordinal',
    [
      'Глас | первый. | <modeSign> | <pitch>',
      'Глас | второй. | <modeSign> | <pitch>',
      'Глас | третий. | <modeSign> | <pitch>',
      'Глас | четвёртый. | <modeSign> | <pitch>',
      'Глас | пятый. | greek:λ/π | <modeSign> | <pitch>',
      'Глас | шестой. | greek:λ/π | <modeSign> | <pitch>',
      'Глас | седьмой. | <modeSign> | <pitch>',
      'Глас | восьмой. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'russian-glas-ordinal-text',
    [
      'Глас | первый. | <pitch>',
      'Глас | второй. | <pitch>',
      'Глас | третий. | <pitch>',
      'Глас | четвёртый. | <pitch>',
      'Глас | пятый. | <pitch>',
      'Глас | шестой. | <pitch>',
      'Глас | седьмой. | <pitch>',
      'Глас | восьмой. | <pitch>',
    ],
  ],
  [
    'arabic-ordinal',
    [
      'اللحن | الأول | <pitch> | <modeSign>',
      'اللحن | الثاني | <pitch> | <modeSign>',
      'اللحن | الثالث | <pitch> | <modeSign>',
      'اللحن | الرابع | <pitch> | <modeSign>',
      'اللحن | الخامس | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | السادس | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | السابع | <pitch> | <modeSign>',
      'اللحن | الثامن | <pitch> | <modeSign> | greek:λ/π',
    ],
  ],
  [
    'arabic-ordinal-digits',
    [
      'اللحن | 1 | <pitch> | <modeSign>',
      'اللحن | 2 | <pitch> | <modeSign>',
      'اللحن | 3 | <pitch> | <modeSign>',
      'اللحن | 4 | <pitch> | <modeSign>',
      'اللحن | 5 | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | 6 | <pitch> | <modeSign> | greek:λ/π',
      'اللحن | 7 | <pitch> | <modeSign>',
      'اللحن | 8 | <pitch> | <modeSign> | greek:λ/π',
    ],
  ],
  [
    'romanian-glas-number',
    [
      'Glas | 1. | <modeSign> | <pitch>',
      'Glas | 2. | <modeSign> | <pitch>',
      'Glas | 3. | <modeSign> | <pitch>',
      'Glas | 4. | <modeSign> | <pitch>',
      'Glas | 5. | greek:λ/π | <modeSign> | <pitch>',
      'Glas | 6. | greek:λ/π | <modeSign> | <pitch>',
      'Glas | 7. | <modeSign> | <pitch>',
      'Glas | 8. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'romanian-glas-roman-numeral',
    [
      'Glas | I. | <modeSign> | <pitch>',
      'Glas | II. | <modeSign> | <pitch>',
      'Glas | III. | <modeSign> | <pitch>',
      'Glas | IV. | <modeSign> | <pitch>',
      'Glas | V. | greek:λ/π | <modeSign> | <pitch>',
      'Glas | VI. | greek:λ/π | <modeSign> | <pitch>',
      'Glas | VII. | <modeSign> | <pitch>',
      'Glas | VIII. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'romanian-glas-ordinal-number',
    [
      'Glasul | întâi. | <modeSign> | <pitch>',
      'Glasul | al 2-lea. | <modeSign> | <pitch>',
      'Glasul | al 3-lea. | <modeSign> | <pitch>',
      'Glasul | al 4-lea. | <modeSign> | <pitch>',
      'Glasul | al 5-lea. | greek:λ/π | <modeSign> | <pitch>',
      'Glasul | al 6-lea. | greek:λ/π | <modeSign> | <pitch>',
      'Glasul | al 7-lea. | <modeSign> | <pitch>',
      'Glasul | al 8-lea. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'romanian-glas-ordinal-roman-numeral',
    [
      'Glasul | întâi. | <modeSign> | <pitch>',
      'Glasul | al II-lea. | <modeSign> | <pitch>',
      'Glasul | al III-lea. | <modeSign> | <pitch>',
      'Glasul | al IV-lea. | <modeSign> | <pitch>',
      'Glasul | al V-lea. | greek:λ/π | <modeSign> | <pitch>',
      'Glasul | al VI-lea. | greek:λ/π | <modeSign> | <pitch>',
      'Glasul | al VII-lea. | <modeSign> | <pitch>',
      'Glasul | al VIII-lea. | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
  [
    'romanian-glas',
    [
      'Glas | <modeSign> | <pitch>',
      'Glas | <modeSign> | <pitch>',
      'Glas | <modeSign> | <pitch>',
      'Glas | <modeSign> | <pitch>',
      'Glas | greek:λ/π | <modeSign> | <pitch>',
      'Glas | greek:λ/π | <modeSign> | <pitch>',
      'Glas | <modeSign> | <pitch>',
      'Glas | greek:λ/π | <modeSign> | <pitch>',
    ],
  ],
];

type ExpectedModePronunciations = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const greekAuthenticCounterpartOrdinalPronunciations: ExpectedModePronunciations =
  [
    'Ήχος Πρώτος',
    'Ήχος Δεύτερος',
    'Ήχος Τρίτος',
    'Ήχος Τέταρτος',
    'Ήχος Πλάγιος του Πρώτου',
    'Ήχος Πλάγιος του Δευτέρου',
    'Ήχος Βαρύς',
    'Ήχος Πλάγιος του Τετάρτου',
  ];

const englishAuthenticCounterpartOrdinalPronunciations: ExpectedModePronunciations =
  [
    'First Mode',
    'Second Mode',
    'Third Mode',
    'Fourth Mode',
    'Plagal of First Mode',
    'Plagal of Second Mode',
    'Grave Mode',
    'Plagal of Fourth Mode',
  ];

const englishAuthenticCounterpartCardinalPronunciations: ExpectedModePronunciations =
  [
    'Mode One',
    'Mode Two',
    'Mode Three',
    'Mode Four',
    'Plagal of Mode One',
    'Plagal of Mode Two',
    'Grave Mode',
    'Plagal of Mode Four',
  ];

const englishPlagalClassOrdinalPronunciations: ExpectedModePronunciations = [
  'First Mode',
  'Second Mode',
  'Third Mode',
  'Fourth Mode',
  'First Plagal Mode',
  'Second Plagal Mode',
  'Grave Mode',
  'Fourth Plagal Mode',
];

const englishAbsoluteOrdinalPronunciations: ExpectedModePronunciations = [
  'First Mode',
  'Second Mode',
  'Third Mode',
  'Fourth Mode',
  'Fifth Mode',
  'Sixth Mode',
  'Seventh Mode',
  'Eighth Mode',
];

const englishAbsoluteCardinalPronunciations: ExpectedModePronunciations = [
  'Mode One',
  'Mode Two',
  'Mode Three',
  'Mode Four',
  'Mode Five',
  'Mode Six',
  'Mode Seven',
  'Mode Eight',
];

const spanishAbsoluteCardinalPronunciations: ExpectedModePronunciations = [
  'Tono uno',
  'Tono dos',
  'Tono tres',
  'Tono cuatro',
  'Tono cinco',
  'Tono seis',
  'Tono siete',
  'Tono ocho',
];

const spanishPostnominalOrdinalPronunciations: ExpectedModePronunciations = [
  'Tono primero',
  'Tono segundo',
  'Tono tercero',
  'Tono cuarto',
  'Tono quinto',
  'Tono sexto',
  'Tono séptimo',
  'Tono octavo',
];

const spanishPrenominalOrdinalPronunciations: ExpectedModePronunciations = [
  'Primer tono',
  'Segundo tono',
  'Tercer tono',
  'Cuarto tono',
  'Quinto tono',
  'Sexto tono',
  'Séptimo tono',
  'Octavo tono',
];

const churchSlavonicAbsoluteOrdinalPronunciations: ExpectedModePronunciations =
  [
    'Гла́съ пе́рвый',
    'Гла́съ вторы́й',
    'Гла́съ тре́тїй',
    'Гла́съ четве́ртый',
    'Гла́съ пѧ́тый',
    'Гла́съ шесты́й',
    'Гла́съ седмы́й',
    'Гла́съ ѻ҆сьмы́й',
  ];

const russianAbsoluteOrdinalPronunciations: ExpectedModePronunciations = [
  'Глас первый',
  'Глас второй',
  'Глас третий',
  'Глас четвёртый',
  'Глас пятый',
  'Глас шестой',
  'Глас седьмой',
  'Глас восьмой',
];

const arabicAbsoluteOrdinalPronunciations: ExpectedModePronunciations = [
  'اللحن الأول',
  'اللحن الثاني',
  'اللحن الثالث',
  'اللحن الرابع',
  'اللحن الخامس',
  'اللحن السادس',
  'اللحن السابع',
  'اللحن الثامن',
];

const romanianAbsoluteCardinalPronunciations: ExpectedModePronunciations = [
  'Glas unu',
  'Glas doi',
  'Glas trei',
  'Glas patru',
  'Glas cinci',
  'Glas șase',
  'Glas șapte',
  'Glas opt',
];

const romanianAbsoluteOrdinalPronunciations: ExpectedModePronunciations = [
  'Glasul întâi',
  'Glasul al doilea',
  'Glasul al treilea',
  'Glasul al patrulea',
  'Glasul al cincilea',
  'Glasul al șaselea',
  'Glasul al șaptelea',
  'Glasul al optulea',
];

const romanianAuthenticCounterpartOrdinalPronunciations: ExpectedModePronunciations =
  [
    'Glasul întâi',
    'Glasul al doilea',
    'Glasul al treilea',
    'Glasul al patrulea',
    'Glasul lăturaș întâi',
    'Glasul lăturaș al doilea',
    'Glasul al șaptelea',
    'Glasul lăturaș al patrulea',
  ];

const expectedStartingNotePhrasesByLanguage: Record<
  InitialMartyriaLanguageId,
  ExpectedModePronunciations
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: [
    'εκ του Πα',
    'εκ του Δι',
    'εκ του Γα',
    'εκ του Δι',
    'εκ του Πα',
    'εκ του Πα',
    'εκ του Γα',
    'εκ του Νη',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: [
    'from Pa',
    'from Di',
    'from Ga',
    'from Di',
    'from Pa',
    'from Pa',
    'from Ga',
    'from Ni',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: [
    'desde Pa',
    'desde Di',
    'desde Ga',
    'desde Di',
    'desde Pa',
    'desde Pa',
    'desde Ga',
    'desde Ni',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: [
    'ѿ Па',
    'ѿ Ди',
    'ѿ Га',
    'ѿ Ди',
    'ѿ Па',
    'ѿ Па',
    'ѿ Га',
    'ѿ Ни',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: [
    'от Па',
    'от Ди',
    'от Га',
    'от Ди',
    'от Па',
    'от Па',
    'от Га',
    'от Ни',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: [
    'من با',
    'من دي',
    'من غا',
    'من دي',
    'من با',
    'من با',
    'من غا',
    'من ني',
  ],
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: [
    'de la Pa',
    'de la Di',
    'de la Ga',
    'de la Di',
    'de la Pa',
    'de la Pa',
    'de la Ga',
    'de la Ni',
  ],
};

const expectedPronunciationsByStructure: [
  string,
  ExpectedModePronunciations,
][] = [
  ['traditional-greek', greekAuthenticCounterpartOrdinalPronunciations],
  ['greek-mode-names', greekAuthenticCounterpartOrdinalPronunciations],
  ['english-plagal-first', englishAuthenticCounterpartOrdinalPronunciations],
  ['english-mode-names', englishAuthenticCounterpartOrdinalPronunciations],
  [
    'english-authentic-counterpart-ordinal-digits-text',
    englishAuthenticCounterpartOrdinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number-sign',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number-text',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-roman-numeral-text',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number-word-text',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  ['english-sign-first', englishPlagalClassOrdinalPronunciations],
  [
    'english-plagal-class-ordinal-words-text',
    englishPlagalClassOrdinalPronunciations,
  ],
  [
    'english-plagal-class-ordinal-words',
    englishPlagalClassOrdinalPronunciations,
  ],
  ['english-ordinal-plagal-text', englishPlagalClassOrdinalPronunciations],
  ['english-ordinal-plagal', englishPlagalClassOrdinalPronunciations],
  ['english-ordinal', englishAbsoluteOrdinalPronunciations],
  ['english-mode-number', englishAbsoluteCardinalPronunciations],
  ['english-mode-roman-numeral', englishAbsoluteCardinalPronunciations],
  ['english-mode-number-word', englishAbsoluteCardinalPronunciations],
  ['english-full-name', englishAuthenticCounterpartOrdinalPronunciations],
  [
    'english-authentic-counterpart-ordinal-digits',
    englishAuthenticCounterpartOrdinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-roman-numeral',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  [
    'english-authentic-counterpart-number-word',
    englishAuthenticCounterpartCardinalPronunciations,
  ],
  ['spanish-tono-number', spanishAbsoluteCardinalPronunciations],
  ['spanish-tono-roman-numeral', spanishPostnominalOrdinalPronunciations],
  ['spanish-tono-ordinal-number', spanishPostnominalOrdinalPronunciations],
  ['spanish-tono-ordinal', spanishPostnominalOrdinalPronunciations],
  ['spanish-ordinal-tono', spanishPrenominalOrdinalPronunciations],
  ['church-slavonic-glas-number', churchSlavonicAbsoluteOrdinalPronunciations],
  [
    'church-slavonic-glas-cyrillic-numeral',
    churchSlavonicAbsoluteOrdinalPronunciations,
  ],
  [
    'church-slavonic-glas-cyrillic-numeral-text',
    churchSlavonicAbsoluteOrdinalPronunciations,
  ],
  ['church-slavonic-glas-ordinal', churchSlavonicAbsoluteOrdinalPronunciations],
  [
    'church-slavonic-glas-ordinal-text',
    churchSlavonicAbsoluteOrdinalPronunciations,
  ],
  ['russian-glas-number', russianAbsoluteOrdinalPronunciations],
  ['russian-glas-ordinal', russianAbsoluteOrdinalPronunciations],
  ['russian-glas-ordinal-text', russianAbsoluteOrdinalPronunciations],
  ['arabic-ordinal', arabicAbsoluteOrdinalPronunciations],
  ['arabic-ordinal-digits', arabicAbsoluteOrdinalPronunciations],
  ['romanian-glas-number', romanianAbsoluteCardinalPronunciations],
  ['romanian-glas-roman-numeral', romanianAbsoluteCardinalPronunciations],
  ['romanian-glas-ordinal-number', romanianAbsoluteOrdinalPronunciations],
  [
    'romanian-glas-ordinal-roman-numeral',
    romanianAbsoluteOrdinalPronunciations,
  ],
  ['romanian-glas', romanianAuthenticCounterpartOrdinalPronunciations],
];

describe('InitialMartyriaStyle', () => {
  it('renders the attested run sequence for every attested structure and mode', () => {
    expect(expectedRunsByStructure.map(([label]) => label)).toEqual(
      Object.keys(attestedStructures),
    );

    for (const [label, expectedByMode] of expectedRunsByStructure) {
      const style = styleFor(attestedStructures[label]);
      for (let mode = 1; mode <= 8; mode++) {
        const encoded = resolve(style, elementForMode(mode))
          .runs.map(encodeRun)
          .join(' | ');

        expect(`${label} mode ${mode}: ${encoded}`).toBe(
          `${label} mode ${mode}: ${expectedByMode[mode - 1]}`,
        );
      }
    }
  });

  it('pronounces every attested structure in every language for every mode', () => {
    expect(expectedPronunciationsByStructure.map(([label]) => label)).toEqual(
      Object.keys(attestedStructures),
    );

    for (const [label, expectedByMode] of expectedPronunciationsByStructure) {
      const structure = attestedStructures[label];
      const style = styleFor(structure);
      for (let mode = 1; mode <= 8; mode++) {
        const resolution = resolve(style, elementForMode(mode));
        const expectedStartingNote =
          expectedStartingNotePhrasesByLanguage[structure.languageId][mode - 1];

        expect(`${label} mode ${mode}: ${resolution.pronunciation}`).toBe(
          `${label} mode ${mode}: ${expectedByMode[mode - 1]} ${expectedStartingNote}`,
        );
      }
    }
  });

  it('supports every attested structure', () => {
    for (const [label, structure] of Object.entries(attestedStructures)) {
      expect(
        `${label}: ${isInitialMartyriaStructureSupported(structure)}`,
      ).toBe(`${label}: true`);
    }
  });

  it('pronounces the physical starting note in every language', () => {
    const element = elementForTemplate(506);
    const context = getInitialMartyriaContext(element);
    const expectedByStructure: [string, string][] = [
      ['greek-mode-names', 'Ήχος Πλάγιος του Πρώτου εκ του Κε'],
      ['english-mode-names', 'Plagal of First Mode from Ke'],
      ['spanish-tono-ordinal', 'Tono quinto desde Ke'],
      ['church-slavonic-glas-ordinal', 'Гла́съ пѧ́тый ѿ Ке'],
      ['russian-glas-ordinal', 'Глас пятый от Ке'],
      ['arabic-ordinal', 'اللحن الخامس من كي'],
      ['romanian-glas', 'Glasul lăturaș întâi de la Ke'],
    ];

    expect(context).toMatchObject({
      physicalNote: ScaleNote.Ke,
      pitchCluster: { primary: { note: ModeSign.Pa } },
    });

    for (const [label, expected] of expectedByStructure) {
      expect(
        resolve(styleFor(attestedStructures[label]), element).pronunciation,
      ).toBe(expected);
    }
  });

  it('preserves the physical starting note octave in the pronunciation', () => {
    const resolution = resolve(
      styleFor(attestedStructures['english-mode-names']),
      elementForTemplate(803),
    );

    expect(resolution.pronunciation).toBe("Plagal of Fourth Mode from Ni'");
  });

  it('sizes fixed separators from the main text font size', () => {
    for (const separator of [
      'plagalAbbreviation',
      'modeSign',
      'startingNote',
      'noteCluster',
    ] as const) {
      expect(getInitialMartyriaFixedSeparatorSize(separator, 20)).toBe(8.6);
    }
    expect(getInitialMartyriaFixedSeparatorSize('wordSpace', 20)).toBeNull();
  });

  it('curates a few attested, localized built-in styles per language', () => {
    const styleIds = builtInInitialMartyriaStyles.map((style) => style.id);
    const attestedKeys = new Set(
      Object.values(attestedStructures).map(getInitialMartyriaStructureKey),
    );

    expect(new Set(styleIds).size).toBe(styleIds.length);
    expect(new Set(styleIds)).toEqual(
      new Set(Object.values(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS)),
    );
    expect(
      builtInInitialMartyriaStyles
        .filter(
          (style) =>
            style.structure.languageId ===
            INITIAL_MARTYRIA_LANGUAGE_IDS.English,
        )
        .map((style) => style.id),
    ).toEqual([
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign,
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNamesWithSign,
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumbersWithSign,
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassWithSign,
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNames,
    ]);
    expect(
      getBuiltInInitialMartyriaStyle(
        BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumbersWithSign,
      ).structure,
    ).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    });
    expect(
      getBuiltInInitialMartyriaStyle(
        BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassWithSign,
      ).structure,
    ).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    });

    for (const languageId of initialMartyriaLanguageIds) {
      const count = builtInInitialMartyriaStyles.filter(
        (style) => style.structure.languageId === languageId,
      ).length;
      expect(`${languageId}: ${count}`).toMatch(/: [1-5]$/);
    }

    for (const style of builtInInitialMartyriaStyles) {
      expect(style.basedOn).toBeNull();
      expect(isInitialMartyriaStructureSupported(style.structure)).toBe(true);
      expect(
        attestedKeys.has(getInitialMartyriaStructureKey(style.structure)),
      ).toBe(true);
      const selector = getBuiltInInitialMartyriaStyleNameSelector(
        style.id as BuiltInInitialMartyriaStyleId,
      );
      for (const [locale, localeResources] of Object.entries(resources)) {
        const name = selector(localeResources);
        expect(`${locale} ${style.id}: ${name.length > 0}`).toBe(
          `${locale} ${style.id}: true`,
        );
      }
    }

    // Names only need to be distinct within a language group.
    for (const languageId of initialMartyriaLanguageIds) {
      const names = builtInInitialMartyriaStyles
        .filter((style) => style.structure.languageId === languageId)
        .map((style) =>
          getBuiltInInitialMartyriaStyleNameSelector(
            style.id as BuiltInInitialMartyriaStyleId,
          )(resources.en),
        );
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('resolves inherited, Standard, explicit, and missing style references', () => {
    const custom = createInitialMartyriaStyle({
      displayName: 'Parish',
      basedOn: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekTraditionalSign,
      structure: attestedStructures['greek-mode-names'],
      appearance: createDefaultInitialMartyriaAppearance(
        INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
      ),
    });
    const styles = [custom];
    const builtInId =
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign;

    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: undefined,
        pageStyleId: null,
        styles,
      }).kind,
    ).toBe('standard');
    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: undefined,
        pageStyleId: builtInId,
        styles,
      }),
    ).toMatchObject({ kind: 'custom', style: { id: builtInId } });
    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: null,
        pageStyleId: builtInId,
        styles,
      }).kind,
    ).toBe('standard');
    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: custom.id,
        pageStyleId: builtInId,
        styles,
      }),
    ).toMatchObject({ kind: 'custom', style: { id: custom.id } });
    expect(
      resolveInitialMartyriaStyleSelection({
        elementStyleId: 'missing',
        pageStyleId: builtInId,
        styles,
      }).kind,
    ).toBe('standard');
  });

  it('uses the note names defined by each structure', () => {
    const resolveNoteText = (label: string) => {
      const startingPitch = resolve(
        styleFor(attestedStructures[label]),
        elementForMode(1),
      ).runs.find(
        (run): run is InitialMartyriaStartingNoteRun =>
          run.kind === 'startingPitch',
      )!;
      return startingPitch.noteText;
    };

    expect(resolveNoteText('spanish-tono-number')).toMatchObject({
      languageTag: 'el',
      names: {
        [ModeSign.Pa]: 'Πα',
        [ModeSign.Vou]: 'Βου',
        [ModeSign.Ga]: 'Γα',
      },
    });

    expect(resolveNoteText('church-slavonic-glas-number')).toMatchObject({
      languageTag: 'cu',
      names: {
        [ModeSign.Pa]: 'Па',
        [ModeSign.Vou]: 'Ву',
        [ModeSign.Ga]: 'Га',
      },
    });

    expect(resolveNoteText('russian-glas-number')).toMatchObject({
      languageTag: 'ru',
      names: {
        [ModeSign.Pa]: 'Па',
        [ModeSign.Vou]: 'Ву',
        [ModeSign.Ga]: 'Га',
      },
    });

    const arabicStyle = getBuiltInInitialMartyriaStyle(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinal,
    );

    expect(arabicStyle).toMatchObject({
      structure: { flowDirection: 'rtl' },
      appearance: {
        mainFontFamily: 'Noto Naskh Arabic',
        greekFontFamily: 'GFS Didot',
      },
    });
    expect(resolveNoteText('arabic-ordinal')).toMatchObject({
      languageTag: 'el',
      direction: 'ltr',
      names: {
        [ModeSign.Ni]: 'Νη',
        [ModeSign.Pa]: 'Πα',
        [ModeSign.Vou]: 'Βου',
        [ModeSign.Ga]: 'Γα',
        [ModeSign.Thi]: 'Δι',
        [ModeSign.Ke]: 'Κε',
        [ModeSign.Zo]: 'Ζω',
      },
    });
  });

  it('defines Greek mode names without a mode-sign glyph', () => {
    const style = styleFor(attestedStructures['greek-mode-names']);
    const expectedText = new Map([
      [1, ['Ἦχος', 'αʹ.']],
      [2, ['Ἦχος', 'βʹ.']],
      [3, ['Ἦχος', 'γʹ.']],
      [4, ['Ἦχος', 'δʹ.']],
      [5, ['Ἦχος', 'λ', 'π', 'αʹ.']],
      [6, ['Ἦχος', 'λ', 'π', 'βʹ.']],
      [7, ['Ἦχος', 'βαρύς.']],
      [8, ['Ἦχος', 'λ', 'π', 'δʹ.']],
    ]);

    for (const [mode, expected] of expectedText) {
      const runs = resolve(style, elementForMode(mode)).runs;

      expect(textOf(runs)).toEqual(expected);
      expect(runs.some((run) => run.kind === 'glyph')).toBe(false);
      expect(runs.some((run) => run.kind === 'startingPitch')).toBe(true);
    }
  });

  it('defines English mode names without a mode-sign glyph', () => {
    const style = styleFor(attestedStructures['english-mode-names']);
    const expectedText = new Map([
      [1, ['First', 'Mode.']],
      [2, ['Second', 'Mode.']],
      [3, ['Third', 'Mode.']],
      [4, ['Fourth', 'Mode.']],
      [5, ['Plagal of', 'First', 'Mode.']],
      [6, ['Plagal of', 'Second', 'Mode.']],
      [7, ['Grave', 'Mode.']],
      [8, ['Plagal of', 'Fourth', 'Mode.']],
    ]);

    for (const [mode, expected] of expectedText) {
      const runs = resolve(style, elementForMode(mode)).runs;
      const startingPitch = runs.find((run) => run.kind === 'startingPitch');

      expect(textOf(runs)).toEqual(expected);
      expect(runs.some((run) => run.kind === 'glyph')).toBe(false);
      expect(startingPitch?.kind).toBe('startingPitch');
      if (startingPitch?.kind === 'startingPitch') {
        expect(startingPitch.noteText.names[ModeSign.Pa]).toBe('Πα');
      }
    }
  });

  it('applies the style appearance to text and musical glyphs', () => {
    const style = styleFor(attestedStructures['english-sign-first']);
    style.appearance = {
      ...style.appearance,
      mainFontFamily: 'GFS Didot',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.25,
      fontVariantCaps: 'small-caps',
      fontVariantNumeric: 'oldstyle-nums proportional-nums',
      fontVariantLigatures: 'no-common-ligatures',
      fontVariantAlternates: 'historical-forms',
    };

    const resolved = resolveInitialMartyriaStyleAppearances(style);
    const runs = resolve(style, elementForTemplate(100)).runs;

    expect(resolved.mainAppearance).toMatchObject({
      fontFamily: 'GFS Didot',
      fontSize: 18,
      color: '#123456',
      strokeWidth: 0.25,
      fontVariantCaps: 'small-caps',
      fontVariantNumeric: 'oldstyle-nums proportional-nums',
      fontVariantLigatures: 'no-common-ligatures',
      fontVariantAlternates: 'historical-forms',
    });
    expect(
      runs
        .filter((run) => run.kind === 'glyph')
        .every(
          (run) =>
            run.semantic === 'modeSign' &&
            run.appearance.color === '#123456' &&
            run.appearance.strokeWidth === 0.25,
        ),
    ).toBe(true);
  });

  it('uses the Greek font for original note names and permanent Greek text', () => {
    const style = styleFor(attestedStructures['english-sign-first']);
    style.appearance.mainFontFamily = 'Source Serif';
    style.appearance.greekFontFamily = 'GFS Didot';

    const originalRuns = resolve(style, elementForTemplate(500)).runs;
    const originalPitch = originalRuns.find(
      (run) => run.kind === 'startingPitch',
    );
    expect(originalPitch?.kind).toBe('startingPitch');
    if (originalPitch?.kind === 'startingPitch') {
      expect(originalPitch.noteText.appearance.fontFamily).toBe('GFS Didot');
    }

    const plagal = originalRuns.find(
      (run) =>
        run.kind === 'text' &&
        run.content.layout === 'stacked' &&
        run.content.lines[0] === 'λ' &&
        run.content.lines[1] === 'π',
    );
    expect(plagal?.kind).toBe('text');
    if (plagal?.kind === 'text') {
      expect(plagal.fontRole).toBe('greek');
      expect(plagal.languageTag).toBe('el');
      expect(plagal.appearance.fontFamily).toBe('GFS Didot');
    }
  });

  it('uses one font for every Greek style text role', () => {
    const style = styleFor(attestedStructures['traditional-greek']);
    style.appearance.mainFontFamily = 'Source Serif';
    style.appearance.greekFontFamily = 'GFS Didot';

    const resolved = resolveInitialMartyriaStyleAppearances(style);
    const runs = resolve(style, elementForTemplate(500)).runs;

    expect(resolved.mainAppearance.fontFamily).toBe('Source Serif');
    expect(resolved.greekAppearance.fontFamily).toBe('Source Serif');
    expect(
      runs
        .filter((run) => run.kind === 'text')
        .every((run) => run.appearance.fontFamily === 'Source Serif'),
    ).toBe(true);
    const startingPitch = runs.find((run) => run.kind === 'startingPitch');
    expect(startingPitch?.kind).toBe('startingPitch');
    if (startingPitch?.kind === 'startingPitch') {
      expect(startingPitch.noteText.appearance.fontFamily).toBe('Source Serif');
    }
  });

  it('clones styles without sharing mutable state', () => {
    const source = styleFor(attestedStructures['traditional-greek']);
    const clone = cloneInitialMartyriaStyle(source);
    clone.appearance.mainFontFamily = 'Source Serif';
    clone.structure.numeralStyle = INITIAL_MARTYRIA_NUMERAL_STYLES.Digits;

    expect(source.appearance.mainFontFamily).toBe('GFS Didot');
    expect(source.structure.numeralStyle).toBe(
      INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    );
    expect(createInitialMartyriaStyle(source).id).not.toBe(source.id);
  });
});

describe('InitialMartyriaStructure space', () => {
  const greekText = attestedStructures['greek-mode-names'];
  const englishText = attestedStructures['english-mode-names'];

  const signature = (structure: InitialMartyriaStructure) =>
    [
      structure.numeralStyle,
      structure.numeralKind,
      structure.numeralQualifier,
      structure.modeNamingScheme,
    ].join('/');

  const grammarStructure = (
    languageId: InitialMartyriaLanguageId,
    changes: Partial<InitialMartyriaStructure>,
  ): InitialMartyriaStructure => ({
    ...builtInInitialMartyriaStyles.find(
      (style) => style.structure.languageId === languageId,
    )!.structure,
    ...changes,
    languageId,
  });

  const textStructureSignatures = {
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: [
      'alphabetic-numerals/ordinal/postnominal/authentic-counterpart',
      'words/ordinal/postnominal/authentic-counterpart',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: [
      'digits/cardinal/postnominal/absolute',
      'digits/cardinal/postnominal/authentic-counterpart',
      'digits/cardinal/postnominal/plagal-class',
      'digits/ordinal/prenominal/absolute',
      'digits/ordinal/prenominal/authentic-counterpart',
      'digits/ordinal/prenominal/plagal-class',
      'roman-numerals/cardinal/postnominal/absolute',
      'roman-numerals/cardinal/postnominal/authentic-counterpart',
      'roman-numerals/cardinal/postnominal/plagal-class',
      'words/cardinal/postnominal/absolute',
      'words/cardinal/postnominal/authentic-counterpart',
      'words/cardinal/postnominal/plagal-class',
      'words/ordinal/prenominal/absolute',
      'words/ordinal/prenominal/authentic-counterpart',
      'words/ordinal/prenominal/plagal-class',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: [
      'digits/cardinal/postnominal/absolute',
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/prenominal/absolute',
      'roman-numerals/cardinal/postnominal/absolute',
      'roman-numerals/ordinal/postnominal/absolute',
      'words/cardinal/postnominal/absolute',
      'words/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: [
      'digits/ordinal/postnominal/absolute',
      'alphabetic-numerals/ordinal/postnominal/absolute',
      'words/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: [
      'digits/ordinal/postnominal/absolute',
      'roman-numerals/ordinal/postnominal/absolute',
      'words/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: [
      'digits/ordinal/postnominal/absolute',
      'words/ordinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: [
      'digits/cardinal/postnominal/absolute',
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/prenominal/absolute',
      'roman-numerals/cardinal/postnominal/absolute',
      'roman-numerals/ordinal/postnominal/absolute',
      'roman-numerals/ordinal/prenominal/absolute',
      'words/cardinal/postnominal/absolute',
      'words/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
  } satisfies Record<InitialMartyriaLanguageId, string[]>;

  const modeSignStructureSignatures = {
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: [
      'alphabetic-numerals/ordinal/postnominal/authentic-counterpart',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: [
      'digits/cardinal/postnominal/authentic-counterpart',
      'digits/cardinal/postnominal/plagal-class',
      'digits/ordinal/prenominal/authentic-counterpart',
      'digits/ordinal/prenominal/plagal-class',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: [
      'digits/cardinal/postnominal/absolute',
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: [
      'digits/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: [
      'digits/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: [
      'digits/ordinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: [
      'digits/cardinal/postnominal/absolute',
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/prenominal/absolute',
      'words/ordinal/postnominal/authentic-counterpart',
    ],
  } satisfies Record<InitialMartyriaLanguageId, string[]>;

  it('derives only numeral forms supported by each mode-name convention', () => {
    const forms = (languageId: InitialMartyriaLanguageId) =>
      getSupportedInitialMartyriaNumeralForms(languageId).map(
        (form) => `${form.numeralStyle}/${form.numeralKind}`,
      );

    expect(
      Object.fromEntries(
        initialMartyriaLanguageIds.map((languageId) => [
          languageId,
          forms(languageId),
        ]),
      ),
    ).toEqual({
      el: ['alphabetic-numerals/ordinal', 'words/ordinal'],
      en: [
        'digits/cardinal',
        'digits/ordinal',
        'roman-numerals/cardinal',
        'words/cardinal',
        'words/ordinal',
      ],
      es: [
        'digits/cardinal',
        'digits/ordinal',
        'roman-numerals/cardinal',
        'roman-numerals/ordinal',
        'words/cardinal',
        'words/ordinal',
      ],
      cu: ['digits/ordinal', 'alphabetic-numerals/ordinal', 'words/ordinal'],
      ru: ['digits/ordinal', 'roman-numerals/ordinal', 'words/ordinal'],
      ar: ['digits/ordinal', 'words/ordinal'],
      ro: [
        'digits/cardinal',
        'digits/ordinal',
        'roman-numerals/cardinal',
        'roman-numerals/ordinal',
        'words/cardinal',
        'words/ordinal',
      ],
    });
  });

  it('accepts and rejects complete supported mode-name constructions', () => {
    const cases: [string, InitialMartyriaStructure, boolean][] = [
      ['Greek alphabetic authentic name', greekText, true],
      [
        'Greek fully inflected authentic name',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Greek, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        }),
        true,
      ],
      [
        'Greek absolute numbering',
        {
          ...greekText,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        },
        false,
      ],
      [
        'Greek prenominal order',
        {
          ...greekText,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        false,
      ],
      [
        'Greek Roman numerals',
        {
          ...greekText,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        },
        false,
      ],
      [
        'English postnominal cardinal words',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.English, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        }),
        true,
      ],
      [
        'English prenominal ordinal digits',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.English, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        true,
      ],
      [
        'English prenominal cardinals',
        {
          ...englishText,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        },
        false,
      ],
      [
        'English postnominal ordinals',
        {
          ...englishText,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        },
        false,
      ],
      [
        'English ordinal Roman numerals',
        {
          ...englishText,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        },
        false,
      ],
      [
        'English sign-only absolute numbering',
        {
          ...attestedStructures['english-authentic-counterpart-number-sign'],
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        },
        false,
      ],
      [
        'English sign-only authentic counterpart',
        attestedStructures['english-authentic-counterpart-number-sign'],
        true,
      ],
      [
        'Spanish postnominal cardinal digits',
        attestedStructures['spanish-tono-number'],
        true,
      ],
      [
        'Spanish prenominal ordinal words',
        attestedStructures['spanish-ordinal-tono'],
        true,
      ],
      [
        'Spanish cardinal Roman reading',
        {
          ...attestedStructures['spanish-tono-roman-numeral'],
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        },
        true,
      ],
      [
        'Spanish sign-only plagal naming',
        {
          ...attestedStructures['spanish-tono-ordinal'],
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
          modeNamingScheme:
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
        },
        false,
      ],
      [
        'Church Slavonic postnominal alphabetic ordinal',
        attestedStructures['church-slavonic-glas-cyrillic-numeral-text'],
        true,
      ],
      [
        'Church Slavonic prenominal word ordinal',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        true,
      ],
      [
        'Church Slavonic cardinal words',
        {
          ...attestedStructures['church-slavonic-glas-ordinal-text'],
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        },
        false,
      ],
      [
        'Church Slavonic Roman numerals',
        {
          ...attestedStructures['church-slavonic-glas-ordinal-text'],
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        },
        false,
      ],
      [
        'Russian postnominal Roman ordinal',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        }),
        true,
      ],
      [
        'Russian prenominal word ordinal',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        true,
      ],
      [
        'Russian bare prenominal digits',
        {
          ...attestedStructures['russian-glas-number'],
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        false,
      ],
      [
        'Russian cardinal words',
        {
          ...attestedStructures['russian-glas-ordinal-text'],
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        },
        false,
      ],
      [
        'Arabic postnominal word ordinal',
        attestedStructures['arabic-ordinal'],
        true,
      ],
      [
        'Arabic postnominal digit ordinal',
        attestedStructures['arabic-ordinal-digits'],
        true,
      ],
      [
        'Arabic artificial prenominal axis',
        {
          ...attestedStructures['arabic-ordinal'],
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        false,
      ],
      [
        'Arabic sign-only plagal naming',
        {
          ...attestedStructures['arabic-ordinal'],
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
          modeNamingScheme:
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
        },
        false,
      ],
      [
        'Romanian postnominal cardinal Roman numeral',
        attestedStructures['romanian-glas-roman-numeral'],
        true,
      ],
      [
        'Romanian prenominal ordinal digit',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        }),
        true,
      ],
      [
        'Romanian sign-only laturas name',
        attestedStructures['romanian-glas'],
        true,
      ],
      [
        'Romanian prenominal cardinal',
        {
          ...attestedStructures['romanian-glas-number'],
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        false,
      ],
      [
        'Romanian unmodeled text laturas name',
        {
          ...attestedStructures['romanian-glas'],
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        },
        false,
      ],
    ];

    for (const [label, structure, expected] of cases) {
      expect(
        `${label}: ${isInitialMartyriaStructureSupported(structure)}`,
      ).toBe(`${label}: ${expected}`);
    }
  });

  it('normalizes unsupported structures to the nearest supported construction', () => {
    const spanish = normalizeInitialMartyriaStructure({
      ...attestedStructures['english-mode-number'],
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    });
    expect(spanish).toMatchObject({
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    const englishCardinal = normalizeInitialMartyriaStructure({
      ...attestedStructures['english-mode-number-word'],
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    });
    expect(englishCardinal).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    });

    const englishOrdinal = normalizeInitialMartyriaStructure({
      ...englishText,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    });
    expect(englishOrdinal).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    });

    const greek = normalizeInitialMartyriaStructure({
      ...greekText,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });
    expect(greek).toMatchObject({
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    });

    const arabic = normalizeInitialMartyriaStructure({
      ...attestedStructures['arabic-ordinal'],
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    });
    expect(arabic).toMatchObject({
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    expect(isInitialMartyriaStructureSupported(spanish)).toBe(true);
    expect(isInitialMartyriaStructureSupported(englishCardinal)).toBe(true);
    expect(isInitialMartyriaStructureSupported(englishOrdinal)).toBe(true);
    expect(isInitialMartyriaStructureSupported(greek)).toBe(true);
    expect(isInitialMartyriaStructureSupported(arabic)).toBe(true);
    expect(normalizeInitialMartyriaStructure(englishText)).toBe(englishText);

    const created = createInitialMartyriaStyle({
      displayName: 'Normalized',
      basedOn: null,
      structure: {
        ...attestedStructures['english-mode-number-word'],
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      },
      appearance: createDefaultInitialMartyriaAppearance(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    });
    expect(created.structure).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    });
  });

  it('keys structures by what they render and read, not by their axes', () => {
    const spanishSignCardinal = {
      ...attestedStructures['spanish-tono-number'],
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    };
    const spanishSignOrdinal = {
      ...attestedStructures['spanish-tono-ordinal-number'],
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    };
    // Both signs look alike, but one legal structure is read cardinally and
    // the other ordinally.
    expect(
      initialMartyriaStructuresEqual(spanishSignCardinal, spanishSignOrdinal),
    ).toBe(false);
    // Number styles hidden by a sign collapse when their reading is the same.
    expect(
      initialMartyriaStructuresEqual(
        {
          ...spanishSignCardinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        },
        spanishSignCardinal,
      ),
    ).toBe(true);
    expect(
      initialMartyriaStructuresEqual(
        attestedStructures['english-plagal-first'],
        attestedStructures['english-authentic-counterpart-number-sign'],
      ),
    ).toBe(false);
    expect(
      initialMartyriaStructuresEqual(englishText, {
        ...englishText,
        transliterateNoteNames: true,
      }),
    ).toBe(false);
    expect(
      initialMartyriaStructuresEqual(greekText, {
        ...greekText,
        transliterateNoteNames: true,
      }),
    ).toBe(true);
  });

  it('finds the style that already renders a structure', () => {
    const styles = [
      ...builtInInitialMartyriaStyles,
      styleFor(
        attestedStructures['english-authentic-counterpart-roman-numeral-text'],
      ),
    ];

    expect(
      findInitialMartyriaStyleWithStructure(
        styles,
        attestedStructures['english-authentic-counterpart-roman-numeral-text'],
      )?.id,
    ).toBe('test');
    expect(findInitialMartyriaStyleWithStructure(styles, greekText)?.id).toBe(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekAlphabeticNumerals,
    );
    expect(
      findInitialMartyriaStyleWithStructure(styles, {
        ...greekText,
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      }),
    ).toBeNull();
  });

  it('builds reachable variations across correlated grammar axes', () => {
    const englishRoman = {
      ...attestedStructures['english-mode-roman-numeral'],
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    };
    const forms = getInitialMartyriaStructureVariations(
      englishRoman,
      initialMartyriaNumeralForms,
      (structure, form) => ({ ...structure, ...form }),
    );

    expect(
      forms.map(
        (variation) =>
          `${variation.value.numeralStyle}/${variation.value.numeralKind}${
            variation.current ? '*' : ''
          }`,
      ),
    ).toEqual([
      'digits/cardinal',
      'digits/ordinal',
      'roman-numerals/cardinal*',
      'words/cardinal',
      'words/ordinal',
    ]);
    expect(new Set(forms.map((variation) => variation.key)).size).toBe(
      forms.length,
    );

    const greekForms = getInitialMartyriaStructureVariations(
      greekText,
      initialMartyriaNumeralForms,
      (structure, form) => ({ ...structure, ...form }),
    );
    expect(greekForms.map((variation) => variation.value.numeralStyle)).toEqual(
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ],
    );
    expect(greekForms.filter((variation) => variation.current)).toHaveLength(1);

    const englishPlacements = getInitialMartyriaStructureVariations(
      attestedStructures['english-mode-number-word'],
      [
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      ],
      (structure, numeralQualifier) => ({ ...structure, numeralQualifier }),
    );
    expect(
      englishPlacements.map((variation) => ({
        value: variation.value,
        numeralKind: variation.structure.numeralKind,
        current: variation.current,
      })),
    ).toEqual([
      {
        value: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        current: true,
      },
      {
        value: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        current: false,
      },
    ]);

    const romanianMethods = getInitialMartyriaStructureVariations(
      attestedStructures['romanian-glas'],
      initialMartyriaModeIdentificationMethods,
      (structure, modeIdentificationMethod) => ({
        ...structure,
        modeIdentificationMethod,
      }),
    );
    expect(romanianMethods.map((variation) => variation.value)).toEqual(
      initialMartyriaModeIdentificationMethods,
    );
    expect(
      romanianMethods
        .filter(
          (variation) =>
            variation.value !==
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
        )
        .every(
          (variation) =>
            variation.structure.modeNamingScheme ===
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        ),
    ).toBe(true);
  });

  it('enumerates exactly the grammar-derived structures for every method', () => {
    for (const languageId of initialMartyriaLanguageIds) {
      for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
        const structures = enumerateInitialMartyriaStructures({
          languageId,
          modeIdentificationMethod,
          transliterateNoteNames: false,
          flowDirection: 'page',
        });
        const keys = structures.map((variation) => variation.key);
        const expected =
          modeIdentificationMethod ===
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
            ? modeSignStructureSignatures[languageId]
            : textStructureSignatures[languageId];

        expect(
          structures.map((variation) => signature(variation.structure)),
        ).toEqual(expected);
        expect(new Set(keys).size).toBe(keys.length);
        expect(
          structures.every((variation) =>
            isInitialMartyriaStructureSupported(variation.structure),
          ),
        ).toBe(true);
        // Every tile renders for every mode; a structure the lexicon cannot
        // express would have thrown or produced undefined text.
        for (const variation of structures) {
          const style = styleFor(variation.structure);
          for (let mode = 1; mode <= 8; mode++) {
            const runs = resolve(style, elementForMode(mode)).runs;
            expect(textOf(runs).every((text) => text !== 'undefined')).toBe(
              true,
            );
          }
        }
      }
    }
  });

  it('renders the corrected grammar-specific morphology', () => {
    const examples: [InitialMartyriaStructure, string, string][] = [
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Greek, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        }),
        'Ἦχος | πλάγιος τοῦ | δευτέρου.',
        'Ήχος Πλάγιος του Δευτέρου εκ του Πα',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.English, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        }),
        'Mode | Six.',
        'Mode Six from Pa',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        }),
        'Tono | VI.',
        'Tono seis desde Pa',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        '6.º | tono.',
        'Sexto tono desde Pa',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        'Шесты́й | гла́съ.',
        'Шесты́й гла́съ ѿ Па',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        'Шестой | глас.',
        'Шестой глас от Па',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        }),
        'اللحن | السادس',
        'اللحن السادس من با',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        }),
        'Al 6-lea | glas.',
        'Al șaselea glas de la Pa',
      ],
    ];

    for (const [structure, expectedText, expectedPronunciation] of examples) {
      const resolution = resolve(styleFor(structure), elementForMode(6));
      expect(textOf(resolution.runs).join(' | ')).toBe(expectedText);
      expect(resolution.pronunciation).toBe(expectedPronunciation);
    }
  });

  it('handles the exceptional Romanian first ordinal in either position', () => {
    const cases = [
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        1,
        'Glasul | întâi.',
        'Glasul întâi de la Pa',
      ],
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        2,
        'Glasul | al II-lea.',
        'Glasul al doilea de la Di',
      ],
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        1,
        'Primul | glas.',
        'Primul glas de la Pa',
      ],
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        2,
        'Al II-lea | glas.',
        'Al doilea glas de la Di',
      ],
    ] as const;

    for (const [
      numeralStyle,
      numeralQualifier,
      mode,
      expectedText,
      expectedPronunciation,
    ] of cases) {
      const structure = grammarStructure(
        INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
        {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle,
          numeralQualifier,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        },
      );
      const resolution = resolve(styleFor(structure), elementForMode(mode));

      expect(textOf(resolution.runs).join(' | ')).toBe(expectedText);
      expect(resolution.pronunciation).toBe(expectedPronunciation);
    }
  });

  it('keeps every curated structure in its grammar-derived gallery', () => {
    // Every attested structure is a tile in its language's gallery.
    for (const [label, structure] of Object.entries(attestedStructures)) {
      const keys = new Set(
        enumerateInitialMartyriaStructures(structure).map(
          (variation) => variation.key,
        ),
      );
      expect(
        `${label}: ${keys.has(getInitialMartyriaStructureKey(structure))}`,
      ).toBe(`${label}: true`);
    }
  });
});
