import type { Namespace, SelectorParam, TFunction } from 'i18next';
import i18next from 'i18next';

import { resources } from '@/i18n';
import { BUILT_IN_PARAGRAPH_STYLE_IDS } from '@/models/ParagraphStyle';
import { getNextAvailableStyleName } from '@/utils/styleNames';

import {
  getInitialMartyriaStyleNameScope,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLanguageId,
  type InitialMartyriaLettering,
  type InitialMartyriaModeSignStructure,
  type InitialMartyriaStyle,
  type InitialMartyriaStyleTypography,
  type InitialMartyriaTextStructure,
  isInitialMartyriaStyleUserCreatable,
} from './InitialMartyriaStyle';

export const BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS = {
  Classic: 'builtin:classic-v1',
  GreekTraditionalSign: 'builtin:traditional-greek-v1',
  GreekAlphabeticNumerals: 'builtin:greek-mode-names-v1',
  EnglishTraditionalSign: 'builtin:english-plagal-first-v1',
  EnglishModeNames: 'builtin:english-mode-names-v1',
  EnglishModeNamesWithSign: 'builtin:english-full-name-v1',
  EnglishModeNumbersWithSign: 'builtin:english-mode-number-v1',
  EnglishPlagalClassWithSign: 'builtin:english-plagal-class-ordinal-words-v1',
  SpanishTonoNumber: 'builtin:spanish-tono-number-v1',
  SpanishTonoRomanNumeral: 'builtin:spanish-tono-roman-numeral-v1',
  SpanishTonoOrdinal: 'builtin:spanish-tono-ordinal-v1',
  SpanishOrdinalTono: 'builtin:spanish-ordinal-tono-v1',
  ChurchSlavonicGlasNumber: 'builtin:church-slavonic-glas-number-v1',
  ChurchSlavonicGlasCyrillicNumeral:
    'builtin:church-slavonic-glas-cyrillic-numeral-v1',
  ChurchSlavonicGlasCyrillicNumeralText:
    'builtin:church-slavonic-glas-cyrillic-numeral-text-v1',
  ChurchSlavonicGlasOrdinal: 'builtin:church-slavonic-glas-ordinal-v1',
  ChurchSlavonicGlasOrdinalText: 'builtin:church-slavonic-glas-ordinal-text-v1',
  RussianGlasNumber: 'builtin:russian-glas-number-v1',
  RussianGlasOrdinal: 'builtin:russian-glas-ordinal-v1',
  RussianGlasOrdinalText: 'builtin:russian-glas-ordinal-text-v1',
  ArabicOrdinal: 'builtin:arabic-ordinal-v1',
  ArabicOrdinalText: 'builtin:arabic-ordinal-text-v1',
  RomanianGlasNumber: 'builtin:romanian-glas-number-v1',
  RomanianTraditionalSign: 'builtin:romanian-glas-v1',
  IndonesianModeNamesWithSign: 'builtin:indonesian-mode-names-v1',
} as const;

export type BuiltInInitialMartyriaStyleId =
  (typeof BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS)[keyof typeof BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS];

type InitialMartyriaStyleNameSelector = SelectorParam<'dialog'>;

type BuiltInInitialMartyriaStyleNameKey =
  keyof Parameters<InitialMartyriaStyleNameSelector>[0]['dialog']['initialMartyriaStyles']['builtInStyles'];

const styleName =
  (key: BuiltInInitialMartyriaStyleNameKey): InitialMartyriaStyleNameSelector =>
  ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles[key];

const BUILT_IN_INITIAL_MARTYRIA_STYLE_NAME_SELECTORS: Record<
  BuiltInInitialMartyriaStyleId,
  InitialMartyriaStyleNameSelector
> = {
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.Classic]: styleName('classic'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekTraditionalSign]: styleName(
    'greekTraditionalSign',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekAlphabeticNumerals]: styleName(
    'greekAlphabeticNumerals',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign]: styleName(
    'englishTraditionalSign',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNames]:
    styleName('englishModeNames'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNamesWithSign]: styleName(
    'englishModeNamesWithSign',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumbersWithSign]: styleName(
    'englishModeNumbersWithSign',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassWithSign]: styleName(
    'englishPlagalClassWithSign',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoNumber]:
    styleName('spanishTonoNumber'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoRomanNumeral]: styleName(
    'spanishTonoRomanNumeral',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinal]:
    styleName('spanishTonoOrdinal'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishOrdinalTono]:
    styleName('spanishOrdinalTono'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasNumber]: styleName(
    'churchSlavonicGlasNumber',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeral]:
    styleName('churchSlavonicGlasCyrillicNumeral'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeralText]:
    styleName('churchSlavonicGlasCyrillicNumeralText'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinal]: styleName(
    'churchSlavonicGlasOrdinal',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinalText]:
    styleName('churchSlavonicGlasOrdinalText'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasNumber]:
    styleName('russianGlasNumber'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinal]:
    styleName('russianGlasOrdinal'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalText]: styleName(
    'russianGlasOrdinalText',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinal]:
    styleName('arabicOrdinal'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinalText]:
    styleName('arabicOrdinalText'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumber]:
    styleName('romanianGlasNumber'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianTraditionalSign]: styleName(
    'romanianTraditionalSign',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.IndonesianModeNamesWithSign]: styleName(
    'indonesianModeNamesWithSign',
  ),
};

/**
 * The paragraph styles and ordinal behavior of a curated style.
 */
export function createDefaultInitialMartyriaTypography(): InitialMartyriaStyleTypography {
  return {
    paragraphStyleId: BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyria,
    greekParagraphStyleId: BUILT_IN_PARAGRAPH_STYLE_IDS.InitialMartyriaGreek,
    useOrdinalForms: true,
    lettering: INITIAL_MARTYRIA_LETTERINGS.Text,
  };
}

const languagesThatTransliterateNoteNames = new Set<InitialMartyriaLanguageId>([
  INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
  INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
]);

type BuiltInInitialMartyriaStyleDefinition = (
  | Omit<InitialMartyriaTextStructure, 'transliterateNoteNames'>
  | Omit<InitialMartyriaModeSignStructure, 'transliterateNoteNames'>
) & {
  transliterateNoteNames?: boolean;
  id: BuiltInInitialMartyriaStyleId;
  lettering?: InitialMartyriaLettering;
};

/** A curated style, whose id names one of the built-in styles. */
export interface BuiltInInitialMartyriaStyle extends InitialMartyriaStyle {
  id: BuiltInInitialMartyriaStyleId;
}

function builtIn({
  id,
  lettering = INITIAL_MARTYRIA_LETTERINGS.Text,
  ...structure
}: BuiltInInitialMartyriaStyleDefinition): BuiltInInitialMartyriaStyle {
  return {
    id,
    displayName: '',
    basedOn: null,
    structure: {
      transliterateNoteNames: languagesThatTransliterateNoteNames.has(
        structure.languageId,
      ),
      ...structure,
    },
    ...createDefaultInitialMartyriaTypography(),
    lettering,
  };
}

// Curated styles are developer-owned: a few attested points per language in
// the space of structures. A new one needs an ID and localized name selector
// above, then one entry here describing its semantics. Every other point in
// the space is reachable through the styles dialog, where users save their
// own styles.
export const builtInInitialMartyriaStyles: BuiltInInitialMartyriaStyle[] = [
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekTraditionalSign,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
  // Traditional Greek set in the music font's own lettering glyphs.
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.Classic,
    lettering: INITIAL_MARTYRIA_LETTERINGS.MusicFont,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
  /*
   * Nea Mousiki Kypseli, Bambas edition (1898)
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekAlphabeticNumerals,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNamesWithSign,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumbersWithSign,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassWithSign,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNames,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoNumber,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoRomanNumeral,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  /*
   * https://analogion.com/forum/index.php?attachments/84206/
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinal,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishOrdinalTono,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasNumber,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeral,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeralText,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinal,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinalText,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasNumber,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinal,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalText,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinal,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinalText,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  /*
   * Attested in the popular series of books by Hierodeacon John Lacoschitiotul e.g.
   * Lacoschitiotul, Ioan, ierodiacon, Buchet muzical athonit: Dumnezeiasca Liturghie. Vol. 1. 2nd ed. Bucharest: Evanghelismos, 2009.
   *
   * Also the 2002 reprint of the Anastasimatarion by Macarius.
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumber,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  /*
   * Attested in 21st-century works by e.g.:
   *
   * - Virgil Ioan Nanu, e.g. https://www.stavropoleos.ro/wp-content/uploads/Psaltica/Taine_ierurgii/parastas.pdf
   * - Re-edition of Anton Pann's Heruvico-Chinonicar. Drobeta-Turnu Severin: Editura Didahia Severin (2012).
   * - Re-edition of Macarie Ieromonahul's Irmologhion Calofonicon by Cătălin Cernătescu. Bucharest: Editura Universității Naționale de Muzică București, 2023.
   *
   * These typically do not translate the note name.
   * They may use either 'Glas' or 'Ehul'. Glas is read with the absolute
   * ordinals 1-8 (Glasul al cincilea), since plagal belongs with Eh.
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianTraditionalSign,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.IndonesianModeNamesWithSign,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
];

const builtInInitialMartyriaStylesById = new Map<
  string,
  BuiltInInitialMartyriaStyle
>(builtInInitialMartyriaStyles.map((style) => [style.id, style]));

/**
 * The style of a new score, of scores saved before initial martyria styles
 * existed (it reproduces their glyph-based mode keys), and the fallback for
 * unresolved style references.
 */
export const DEFAULT_INITIAL_MARTYRIA_STYLE_ID: BuiltInInitialMartyriaStyleId =
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.Classic;

export function isBuiltInInitialMartyriaStyleId(
  id: string,
): id is BuiltInInitialMartyriaStyleId {
  return builtInInitialMartyriaStylesById.has(id);
}

export function getBuiltInInitialMartyriaStyle(
  id: BuiltInInitialMartyriaStyleId,
) {
  return builtInInitialMartyriaStylesById.get(id)!;
}

/**
 * The first curated style of a language that the dialog can create styles
 * from seeds new styles in that language.
 */
export function getDefaultBuiltInInitialMartyriaStyle(
  languageId: InitialMartyriaLanguageId,
) {
  return builtInInitialMartyriaStyles.find(
    (style) =>
      style.structure.languageId === languageId &&
      isInitialMartyriaStyleUserCreatable(style),
  )!;
}

export function findInitialMartyriaStyle(
  customStyles: InitialMartyriaStyle[],
  styleId: string,
) {
  return (
    builtInInitialMartyriaStylesById.get(styleId) ??
    customStyles.find((style) => style.id === styleId) ??
    null
  );
}

/**
 * The style a reference names, falling back to the default built-in style
 * when the reference no longer resolves (a deleted or unknown style).
 */
export function getInitialMartyriaStyleOrDefault(
  customStyles: InitialMartyriaStyle[],
  styleId: string,
) {
  return (
    findInitialMartyriaStyle(customStyles, styleId) ??
    getBuiltInInitialMartyriaStyle(DEFAULT_INITIAL_MARTYRIA_STYLE_ID)
  );
}

export function getBuiltInInitialMartyriaStyleNameSelector(
  styleId: BuiltInInitialMartyriaStyleId,
) {
  return BUILT_IN_INITIAL_MARTYRIA_STYLE_NAME_SELECTORS[styleId];
}

/** A built-in style is named through the UI locale. */
export function getInitialMartyriaStyleDisplayName(
  style: InitialMartyriaStyle,
  t: TFunction<Namespace>,
) {
  return isBuiltInInitialMartyriaStyleId(style.id)
    ? t(getBuiltInInitialMartyriaStyleNameSelector(style.id), { ns: 'dialog' })
    : style.displayName;
}

/**
 * A style of the score's own made from a built-in style, which serves only
 * as a preset: the new style is the score's to edit and name.
 */
export function createInitialMartyriaStyleFromPreset(
  preset: BuiltInInitialMartyriaStyle,
  displayName: string,
): InitialMartyriaStyle {
  return {
    ...preset,
    id: crypto.randomUUID(),
    displayName,
    basedOn: preset.id,
    structure: { ...preset.structure },
  };
}

/*
 * A preset's name in the app's language. Score models are also built where
 * i18next is not initialized (unit tests, before startup), and there the
 * English name is used.
 */
function getPresetName(preset: BuiltInInitialMartyriaStyle) {
  const selector = getBuiltInInitialMartyriaStyleNameSelector(preset.id);
  return i18next.isInitialized
    ? i18next.t(selector, { ns: 'dialog' })
    : selector(resources.en);
}

/**
 * Every score owns at least one style, and its default names one of them. A
 * score whose default does not resolve to a style of its own gets a copy of
 * the default built-in style as its default, named after it.
 */
export function ensureScoreInitialMartyriaStyle(score: {
  initialMartyriaStyles: InitialMartyriaStyle[];
  pageSetup: { initialMartyriaStyleId: string };
}) {
  const defaultStyleId = score.pageSetup.initialMartyriaStyleId;
  if (
    score.initialMartyriaStyles.some((style) => style.id === defaultStyleId)
  ) {
    return;
  }
  const preset = getBuiltInInitialMartyriaStyle(
    isBuiltInInitialMartyriaStyleId(defaultStyleId)
      ? defaultStyleId
      : DEFAULT_INITIAL_MARTYRIA_STYLE_ID,
  );
  const nameScope = getInitialMartyriaStyleNameScope(preset);
  const style = createInitialMartyriaStyleFromPreset(
    preset,
    getNextAvailableStyleName(
      getPresetName(preset),
      score.initialMartyriaStyles
        .filter(
          (style) => getInitialMartyriaStyleNameScope(style) === nameScope,
        )
        .map((style) => style.displayName),
    ),
  );
  score.initialMartyriaStyles = [style, ...score.initialMartyriaStyles];
  score.pageSetup.initialMartyriaStyleId = style.id;
}
