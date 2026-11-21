import type { SelectorParam } from 'i18next';
import i18next from 'i18next';

import { resources } from '@/i18n';
import { BUILT_IN_PARAGRAPH_STYLE_IDS } from '@/models/ParagraphStyle';
import { getInitialMartyriaStyleBaseNameSelector } from '@/utils/initialMartyriaLabels';
import { getNextAvailableStyleName } from '@/utils/styleNames';

import {
  INITIAL_MARTYRIA_LABEL_VARIANTS,
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
  type InitialMartyriaNamedStructure,
  type InitialMartyriaStyle,
  type InitialMartyriaStyleTypography,
  type InitialMartyriaTextStructure,
} from './InitialMartyriaStyle';

/*
 * The common wordings of the wording picker: attested ways each language
 * writes an initial martyria, offered first. They are wordings, not styles:
 * a score never names one, and a style made from one is the score's own.
 */

type CaptionSelector = SelectorParam<'dialog'>;

/** Names a common wording in code and keys its caption. */
export type CommonInitialMartyriaWordingName =
  keyof Parameters<CaptionSelector>[0]['dialog']['initialMartyriaStyles']['wordingCaptions'];

export interface CommonInitialMartyriaWording {
  name: CommonInitialMartyriaWordingName;
  structure: InitialMartyriaNamedStructure;
  lettering: InitialMartyriaLettering;
}

/**
 * The paragraph styles and ordinal behavior of a new style.
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

type CommonInitialMartyriaWordingDefinition = (
  | Omit<InitialMartyriaTextStructure, 'transliterateNoteNames'>
  | Omit<InitialMartyriaModeSignStructure, 'transliterateNoteNames'>
) & {
  transliterateNoteNames?: boolean;
  name: CommonInitialMartyriaWordingName;
  lettering?: InitialMartyriaLettering;
};

function wording({
  name,
  lettering = INITIAL_MARTYRIA_LETTERINGS.Text,
  ...structure
}: CommonInitialMartyriaWordingDefinition): CommonInitialMartyriaWording {
  return {
    name,
    structure: {
      transliterateNoteNames: getDefaultInitialMartyriaTransliteration(
        structure.languageId,
      ),
      ...structure,
    },
    lettering,
  };
}

// Curated wordings are developer-owned: a few attested points per language in
// the space of structures. A new one needs a localized caption under
// dialog.initialMartyriaStyles.wordingCaptions, then one entry here
// describing its semantics. Every other point in the space is reachable
// through the wording picker's other sections.
export const commonInitialMartyriaWordings: CommonInitialMartyriaWording[] = [
  wording({
    name: 'greekTraditionalSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
  // Traditional Greek set in the music font's own lettering glyphs.
  wording({
    name: 'classic',
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
  wording({
    name: 'greekAlphabeticNumerals',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  wording({
    name: 'englishTraditionalSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
  wording({
    name: 'englishModeNamesWithSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'englishModeNumbersWithSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'englishPlagalClassWithSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'englishModeNames',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  // The sign group beside the label stands for the mode number, as in
  // Romanian Glas πλ[sign].
  wording({
    name: 'englishModeBeforeSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
  wording({
    name: 'englishToneNumber',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    labelVariant: INITIAL_MARTYRIA_LABEL_VARIANTS.Tone,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  wording({
    name: 'englishOrdinalTone',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    labelVariant: INITIAL_MARTYRIA_LABEL_VARIANTS.Tone,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  wording({
    name: 'englishToneNumberWithSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    labelVariant: INITIAL_MARTYRIA_LABEL_VARIANTS.Tone,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'englishToneBeforeSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    labelVariant: INITIAL_MARTYRIA_LABEL_VARIANTS.Tone,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
  wording({
    name: 'spanishTonoNumber',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'spanishTonoRomanNumeral',
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
  wording({
    name: 'spanishTonoOrdinal',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'spanishOrdinalTono',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'churchSlavonicGlasNumber',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'churchSlavonicGlasCyrillicNumeral',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'churchSlavonicGlasCyrillicNumeralText',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  wording({
    name: 'churchSlavonicGlasOrdinal',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'churchSlavonicGlasOrdinalText',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  wording({
    name: 'russianGlasNumber',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'russianGlasOrdinal',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'russianGlasOrdinalText',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  }),
  wording({
    name: 'arabicOrdinal',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
  wording({
    name: 'arabicOrdinalText',
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
  wording({
    name: 'romanianGlasNumber',
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
  wording({
    name: 'romanianTraditionalSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
  wording({
    name: 'indonesianModeNamesWithSign',
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  }),
];

const commonInitialMartyriaWordingsByName = new Map(
  commonInitialMartyriaWordings.map((wording) => [wording.name, wording]),
);

export function getCommonInitialMartyriaWording(
  name: CommonInitialMartyriaWordingName,
) {
  return commonInitialMartyriaWordingsByName.get(name)!;
}

/**
 * The wording of a new score's style, and of the style given to scores saved
 * before initial martyria styles existed: the traditional Greek sign lettered
 * in the neume font, which reproduces their glyph-based mode keys.
 */
export const DEFAULT_INITIAL_MARTYRIA_WORDING_NAME: CommonInitialMartyriaWordingName =
  'classic';

/** Whether new styles in a language transliterate their note names. */
export function getDefaultInitialMartyriaTransliteration(
  languageId: InitialMartyriaLanguageId,
) {
  return languagesThatTransliterateNoteNames.has(languageId);
}

export function getCommonInitialMartyriaWordingCaptionSelector(
  name: CommonInitialMartyriaWordingName,
): CaptionSelector {
  return ($) => $.dialog.initialMartyriaStyles.wordingCaptions[name];
}

/** A new style of the score's own, written in a common wording. */
export function createInitialMartyriaStyleFromWording(
  wording: CommonInitialMartyriaWording,
  displayName: string,
  id: string = crypto.randomUUID(),
): InitialMartyriaStyle & { structure: InitialMartyriaNamedStructure } {
  return {
    ...createDefaultInitialMartyriaTypography(),
    id,
    displayName,
    structure: { ...wording.structure },
    lettering: wording.lettering,
  };
}

/*
 * A new style's base name in the app's language. Score models are also built
 * where i18next is not initialized (unit tests, before startup), and there
 * the English name is used.
 */
function getBaseName(wording: CommonInitialMartyriaWording) {
  const selector = getInitialMartyriaStyleBaseNameSelector(wording);
  return i18next.isInitialized
    ? i18next.t(selector, { ns: 'dialog' })
    : selector(resources.en);
}

/**
 * Every score owns at least one style, and its default names one of them. A
 * score whose default names none of its styles gets a new default style in
 * the default wording, named after it.
 */
export function ensureScoreInitialMartyriaStyle(score: {
  initialMartyriaStyles: InitialMartyriaStyle[];
  defaultInitialMartyriaStyleId: string;
}) {
  if (
    score.initialMartyriaStyles.some(
      (style) => style.id === score.defaultInitialMartyriaStyleId,
    )
  ) {
    return;
  }
  const wording = getCommonInitialMartyriaWording(
    DEFAULT_INITIAL_MARTYRIA_WORDING_NAME,
  );
  const style = createInitialMartyriaStyleFromWording(
    wording,
    getNextAvailableStyleName(
      getBaseName(wording),
      score.initialMartyriaStyles.map((style) => style.displayName),
    ),
  );
  score.initialMartyriaStyles = [style, ...score.initialMartyriaStyles];
  score.defaultInitialMartyriaStyleId = style.id;
}

/**
 * The style a mode key without a style of its own follows. Every score owns
 * its default style; should the default not resolve, the score's first style
 * stands in rather than failing to render.
 */
export function getScoreDefaultInitialMartyriaStyle(score: {
  initialMartyriaStyles: InitialMartyriaStyle[];
  defaultInitialMartyriaStyleId: string;
}) {
  return (
    score.initialMartyriaStyles.find(
      (style) => style.id === score.defaultInitialMartyriaStyleId,
    ) ?? score.initialMartyriaStyles[0]
  );
}
