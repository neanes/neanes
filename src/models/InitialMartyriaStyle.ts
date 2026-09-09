import type { Namespace, SelectorParam, TFunction } from 'i18next';

import type { ModeKeyElement } from '@/models/Element';
import type { Fthora, Neume } from '@/models/Neumes';
import { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { Unit } from '@/utils/Unit';

export type ModeKeyMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const INITIAL_MARTYRIA_NUMERAL_KINDS = {
  Cardinal: 'cardinal',
  Ordinal: 'ordinal',
} as const;

export type InitialMartyriaNumeralKind =
  (typeof INITIAL_MARTYRIA_NUMERAL_KINDS)[keyof typeof INITIAL_MARTYRIA_NUMERAL_KINDS];

export const INITIAL_MARTYRIA_NUMERAL_STYLES = {
  Digits: 'digits',
  RomanNumerals: 'roman-numerals',
  AlphabeticNumerals: 'alphabetic-numerals',
  Words: 'words',
} as const;

export type InitialMartyriaNumeralStyle =
  (typeof INITIAL_MARTYRIA_NUMERAL_STYLES)[keyof typeof INITIAL_MARTYRIA_NUMERAL_STYLES];

/*
 * Where the numeral sits relative to the mode word: prenominal names read
 * 'First Mode' / 'Primer tono', postnominal names read 'Mode 1' / 'Tono
 * primero'. Prenominal also selects prenominal word forms where the language
 * distinguishes them, and places the mode word after the sign group when the
 * traditional sign identifies the mode.
 */
export const INITIAL_MARTYRIA_NUMERAL_QUALIFIERS = {
  Postnominal: 'postnominal',
  Prenominal: 'prenominal',
} as const;

export type InitialMartyriaNumeralQualifier =
  (typeof INITIAL_MARTYRIA_NUMERAL_QUALIFIERS)[keyof typeof INITIAL_MARTYRIA_NUMERAL_QUALIFIERS];

export const INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS = {
  Text: 'text',
  ModeSign: 'mode-sign',
  TextAndModeSign: 'text-and-mode-sign',
} as const;

export type InitialMartyriaModeIdentificationMethod =
  (typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS)[keyof typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS];

/**
 * How the eight modes are named. Absolute naming counts straight through
 * modes 1-8. The other schemes use the authentic/plagal families: an
 * authentic-counterpart name describes the plagal counterpart of an
 * authentic mode ("Plagal of First Mode"), while a plagal-class name
 * describes a member of the class of plagal modes ("First Plagal Mode").
 */
export const INITIAL_MARTYRIA_MODE_NAMING_SCHEMES = {
  Absolute: 'absolute',
  AuthenticCounterpart: 'authentic-counterpart',
  PlagalClass: 'plagal-class',
} as const;

export type InitialMartyriaModeNamingScheme =
  (typeof INITIAL_MARTYRIA_MODE_NAMING_SCHEMES)[keyof typeof INITIAL_MARTYRIA_MODE_NAMING_SCHEMES];

export const INITIAL_MARTYRIA_LANGUAGE_IDS = {
  Greek: 'el',
  English: 'en',
  Spanish: 'es',
  ChurchSlavonic: 'cu',
  Russian: 'ru',
  Arabic: 'ar',
  Romanian: 'ro',
} as const;

export type InitialMartyriaLanguageId =
  (typeof INITIAL_MARTYRIA_LANGUAGE_IDS)[keyof typeof INITIAL_MARTYRIA_LANGUAGE_IDS];

export const initialMartyriaLanguageIds = Object.values(
  INITIAL_MARTYRIA_LANGUAGE_IDS,
);

export const BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS = {
  TraditionalGreekV1: 'builtin:traditional-greek-v1',
  GreekModeNamesV1: 'builtin:greek-mode-names-v1',
  EnglishPlagalFirstV1: 'builtin:english-plagal-first-v1',
  EnglishModeNamesV1: 'builtin:english-mode-names-v1',
  EnglishAuthenticCounterpartOrdinalDigitsTextV1:
    'builtin:english-authentic-counterpart-ordinal-digits-text-v1',
  EnglishAuthenticCounterpartNumberSignV1:
    'builtin:english-authentic-counterpart-number-sign-v1',
  EnglishAuthenticCounterpartNumberTextV1:
    'builtin:english-authentic-counterpart-number-text-v1',
  EnglishAuthenticCounterpartRomanNumeralTextV1:
    'builtin:english-authentic-counterpart-roman-numeral-text-v1',
  EnglishAuthenticCounterpartNumberWordTextV1:
    'builtin:english-authentic-counterpart-number-word-text-v1',
  EnglishSignFirstV1: 'builtin:english-sign-first-v1',
  EnglishPlagalClassOrdinalWordsTextV1:
    'builtin:english-plagal-class-ordinal-words-text-v1',
  EnglishPlagalClassOrdinalWordsV1:
    'builtin:english-plagal-class-ordinal-words-v1',
  EnglishOrdinalPlagalTextV1: 'builtin:english-ordinal-plagal-text-v1',
  EnglishOrdinalPlagalV1: 'builtin:english-ordinal-plagal-v1',
  EnglishOrdinalV1: 'builtin:english-ordinal-v1',
  EnglishModeNumberV1: 'builtin:english-mode-number-v1',
  EnglishModeRomanNumeralV1: 'builtin:english-mode-roman-numeral-v1',
  EnglishModeNumberWordV1: 'builtin:english-mode-number-word-v1',
  EnglishFullNameV1: 'builtin:english-full-name-v1',
  EnglishAuthenticCounterpartOrdinalDigitsV1:
    'builtin:english-authentic-counterpart-ordinal-digits-v1',
  EnglishAuthenticCounterpartNumberV1:
    'builtin:english-authentic-counterpart-number-v1',
  EnglishAuthenticCounterpartRomanNumeralV1:
    'builtin:english-authentic-counterpart-roman-numeral-v1',
  EnglishAuthenticCounterpartNumberWordV1:
    'builtin:english-authentic-counterpart-number-word-v1',
  SpanishTonoNumberV1: 'builtin:spanish-tono-number-v1',
  SpanishTonoRomanNumeralV1: 'builtin:spanish-tono-roman-numeral-v1',
  SpanishTonoOrdinalNumberV1: 'builtin:spanish-tono-ordinal-number-v1',
  SpanishTonoOrdinalV1: 'builtin:spanish-tono-ordinal-v1',
  SpanishOrdinalTonoV1: 'builtin:spanish-ordinal-tono-v1',
  ChurchSlavonicGlasNumberV1: 'builtin:church-slavonic-glas-number-v1',
  ChurchSlavonicGlasCyrillicNumeralV1:
    'builtin:church-slavonic-glas-cyrillic-numeral-v1',
  ChurchSlavonicGlasCyrillicNumeralTextV1:
    'builtin:church-slavonic-glas-cyrillic-numeral-text-v1',
  ChurchSlavonicGlasOrdinalV1: 'builtin:church-slavonic-glas-ordinal-v1',
  ChurchSlavonicGlasOrdinalTextV1:
    'builtin:church-slavonic-glas-ordinal-text-v1',
  RussianGlasNumberV1: 'builtin:russian-glas-number-v1',
  RussianGlasOrdinalV1: 'builtin:russian-glas-ordinal-v1',
  RussianGlasOrdinalTextV1: 'builtin:russian-glas-ordinal-text-v1',
  ArabicOrdinalV1: 'builtin:arabic-ordinal-v1',
  RomanianGlasNumberV1: 'builtin:romanian-glas-number-v1',
  RomanianGlasRomanNumeralV1: 'builtin:romanian-glas-roman-numeral-v1',
  RomanianGlasOrdinalNumberV1: 'builtin:romanian-glas-ordinal-number-v1',
  RomanianGlasOrdinalRomanNumeralV1:
    'builtin:romanian-glas-ordinal-roman-numeral-v1',
  RomanianGlasV1: 'builtin:romanian-glas-v1',
} as const;

export type BuiltInInitialMartyriaStyleId =
  (typeof BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS)[keyof typeof BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS];

type InitialMartyriaStyleNameSelector = SelectorParam<'dialog'>;

const BUILT_IN_INITIAL_MARTYRIA_STYLE_NAME_SELECTORS: Record<
  BuiltInInitialMartyriaStyleId,
  InitialMartyriaStyleNameSelector
> = {
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.traditionalGreek,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekModeNamesV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.greekModeNames,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalFirstV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishPlagalFirst,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNamesV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishModeNames,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartOrdinalDigitsTextV1]:
    ($) =>
      $.dialog.initialMartyriaStyles.builtInStyles
        .englishAuthenticCounterpartOrdinalDigitsText,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberSignV1]:
    ($) =>
      $.dialog.initialMartyriaStyles.builtInStyles
        .englishAuthenticCounterpartNumberSign,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberTextV1]:
    ($) =>
      $.dialog.initialMartyriaStyles.builtInStyles
        .englishAuthenticCounterpartNumberText,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartRomanNumeralTextV1]:
    ($) =>
      $.dialog.initialMartyriaStyles.builtInStyles
        .englishAuthenticCounterpartRomanNumeralText,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberWordTextV1]:
    ($) =>
      $.dialog.initialMartyriaStyles.builtInStyles
        .englishAuthenticCounterpartNumberWordText,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishSignFirst,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassOrdinalWordsTextV1]: (
    $,
  ) =>
    $.dialog.initialMartyriaStyles.builtInStyles
      .englishPlagalClassOrdinalWordsText,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassOrdinalWordsV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishPlagalClassOrdinalWords,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishOrdinalPlagalTextV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishOrdinalPlagalText,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishOrdinalPlagalV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishOrdinalPlagal,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishOrdinalV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishOrdinal,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishModeNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeRomanNumeralV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishModeRomanNumeral,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumberWordV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishModeNumberWord,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishFullNameV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishFullName,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartOrdinalDigitsV1]:
    ($) =>
      $.dialog.initialMartyriaStyles.builtInStyles
        .englishAuthenticCounterpartOrdinalDigits,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberV1]: (
    $,
  ) =>
    $.dialog.initialMartyriaStyles.builtInStyles
      .englishAuthenticCounterpartNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartRomanNumeralV1]:
    ($) =>
      $.dialog.initialMartyriaStyles.builtInStyles
        .englishAuthenticCounterpartRomanNumeral,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberWordV1]:
    ($) =>
      $.dialog.initialMartyriaStyles.builtInStyles
        .englishAuthenticCounterpartNumberWord,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.spanishTonoNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoRomanNumeralV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.spanishTonoRomanNumeral,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinalNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.spanishTonoOrdinalNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinalV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.spanishTonoOrdinal,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishOrdinalTonoV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.spanishOrdinalTono,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.churchSlavonicGlasNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeralV1]: (
    $,
  ) =>
    $.dialog.initialMartyriaStyles.builtInStyles
      .churchSlavonicGlasCyrillicNumeral,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeralTextV1]:
    ($) =>
      $.dialog.initialMartyriaStyles.builtInStyles
        .churchSlavonicGlasCyrillicNumeralText,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinalV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.churchSlavonicGlasOrdinal,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinalTextV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.churchSlavonicGlasOrdinalText,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.russianGlasNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.russianGlasOrdinal,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalTextV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.russianGlasOrdinalText,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinalV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.arabicOrdinal,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.romanianGlasNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasRomanNumeralV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.romanianGlasRomanNumeral,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasOrdinalNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.romanianGlasOrdinalNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasOrdinalRomanNumeralV1]: (
    $,
  ) =>
    $.dialog.initialMartyriaStyles.builtInStyles
      .romanianGlasOrdinalRomanNumeral,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.romanianGlas,
};

export type InitialMartyriaCanonicalNote =
  | ModeSign.Ni
  | ModeSign.Pa
  | ModeSign.Vou
  | ModeSign.Ga
  | ModeSign.Thi
  | ModeSign.Ke
  | ModeSign.Zo;

export interface InitialMartyriaNoteNames {
  names: Record<InitialMartyriaCanonicalNote, string>;
  direction: 'ltr' | 'rtl';
  languageTag: string;
}

/** The role a piece of text plays inside the mode-name phrase. */
export type InitialMartyriaTextSemantic =
  'label' | 'numeral' | 'plagalWord' | 'plagalAbbreviation' | 'graveWord';

export type InitialMartyriaIdentificationSource =
  | typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text
  | typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign;

export type InitialMartyriaComponent =
  | {
      kind: 'text';
      semantic: InitialMartyriaTextSemantic;
      content: string;
      fontRole?: 'main' | 'greek';
      identificationSource: InitialMartyriaIdentificationSource;
    }
  | {
      kind: 'stackedText';
      semantic: InitialMartyriaTextSemantic;
      top: string;
      bottom: string;
      fontRole?: 'main' | 'greek';
      identificationSource: InitialMartyriaIdentificationSource;
    }
  | {
      kind: 'modeSign';
      identificationSource: typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign;
    }
  | {
      kind: 'startingNoteCluster';
    };

export interface InitialMartyriaDefaultAppearance {
  mainFontFamily: string;
  greekFontFamily: string;
  fontStyle: string;
  fontSize: number;
  color: string;
  strokeWidth: number;
  fontVariantCaps: string | null;
  fontVariantNumeric: string | null;
  fontVariantLigatures: string | null;
  fontVariantAlternates: string | null;
}

export type InitialMartyriaAppearanceOverrides =
  Partial<InitialMartyriaDefaultAppearance>;

export interface InitialMartyriaConfiguration {
  styleId: BuiltInInitialMartyriaStyleId;
  transliterateNoteNames: boolean;
  appearanceOverrides: InitialMartyriaAppearanceOverrides;
}

interface InitialMartyriaNumeralIdentification {
  /**
   * The number form printed by text identification or conventionally read
   * from a mode sign.
   */
  numeralKind: InitialMartyriaNumeralKind;
  numeralStyle: InitialMartyriaNumeralStyle;
  numeralQualifier: InitialMartyriaNumeralQualifier;
}

interface InitialMartyriaModeNameSemantics extends InitialMartyriaNumeralIdentification {
  modeNamingScheme: InitialMartyriaModeNamingScheme;
}

interface InitialMartyriaStyleBase extends InitialMartyriaModeNameSemantics {
  id: BuiltInInitialMartyriaStyleId;
  languageId: InitialMartyriaLanguageId;
  flowDirection: 'page' | 'ltr' | 'rtl';
  defaultAppearance: InitialMartyriaDefaultAppearance;
}

type InitialMartyriaPlagalIndicator = 'stackedAbbreviation' | 'word';

interface InitialMartyriaModeSignIdentification {
  /**
   * How plagal modes are marked beside the traditional mode sign.
   */
  plagalIndicator: InitialMartyriaPlagalIndicator;
}

type InitialMartyriaModeSignPronunciation = InitialMartyriaModeNameSemantics;

export interface InitialMartyriaTextStyle extends InitialMartyriaStyleBase {
  modeIdentificationMethod: typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text;
}

export interface InitialMartyriaModeSignStyle
  extends InitialMartyriaStyleBase, InitialMartyriaModeSignIdentification {
  modeIdentificationMethod: typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign;
}

export interface InitialMartyriaTextAndModeSignStyle
  extends InitialMartyriaStyleBase, InitialMartyriaModeSignIdentification {
  modeIdentificationMethod: typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign;
  /** The conventional reading of the traditional sign group. */
  modeSignPronunciation: InitialMartyriaModeSignPronunciation;
}

export type InitialMartyriaStyle =
  | InitialMartyriaTextStyle
  | InitialMartyriaModeSignStyle
  | InitialMartyriaTextAndModeSignStyle;

/** Resolved text and glyph styling used by layout and rendering. */
export interface InitialMartyriaAppearance {
  fontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
  fontVariantCaps?: string | null;
  fontVariantNumeric?: string | null;
  fontVariantLigatures?: string | null;
  fontVariantAlternates?: string | null;
  color?: string;
  strokeWidth?: number;
  strokeColor?: string;
}

export interface ResolvedInitialMartyriaConfiguration {
  style: InitialMartyriaStyle;
  configuration: InitialMartyriaConfiguration;
  mainAppearance: InitialMartyriaAppearance;
  greekAppearance: InitialMartyriaAppearance;
}

export interface InitialMartyriaPitchNote {
  note: InitialMartyriaCanonicalNote;
  fthoraAbove: Fthora | null;
  quantitativeNeumeAbove: ModeSign | null;
}

export interface InitialMartyriaPitchCluster {
  primary: InitialMartyriaPitchNote | null;
  secondary: InitialMartyriaPitchNote | null;
  trailingGlyphs: Neume[];
}

export interface InitialMartyriaContext {
  mode: ModeKeyMode;
  traditionalModeSign: Neume;
  pitchCluster: InitialMartyriaPitchCluster;
}

type ResolvedInitialMartyriaTextContent =
  { layout: 'inline'; text: string } | { layout: 'stacked'; lines: string[] };

export type ResolvedInitialMartyriaRun =
  | {
      kind: 'glyph';
      semantic: 'modeSign';
      appearance: InitialMartyriaAppearance;
      direction: 'ltr' | 'rtl';
      glyphs: Neume[];
      identificationSource: typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign;
      /** The reading of this glyph, whether primary or redundant. */
      pronunciation: string;
    }
  | {
      kind: 'text';
      semantic: InitialMartyriaTextSemantic;
      appearance: InitialMartyriaAppearance;
      fontRole: 'main' | 'greek';
      direction: 'ltr' | 'rtl';
      languageTag: string;
      identificationSource: InitialMartyriaIdentificationSource;
      /** The reading of this text, whether primary or redundant. */
      pronunciation: string;
      content: ResolvedInitialMartyriaTextContent;
    }
  | {
      kind: 'startingPitch';
      appearance: InitialMartyriaAppearance;
      noteText: InitialMartyriaNoteNames & {
        appearance: InitialMartyriaAppearance;
      };
      direction: 'ltr' | 'rtl';
      cluster: InitialMartyriaPitchCluster;
    };

export type InitialMartyriaStartingNoteRun = Extract<
  ResolvedInitialMartyriaRun,
  { kind: 'startingPitch' }
>;

export interface InitialMartyriaStyleResolution {
  style: InitialMartyriaStyle;
  runs: ResolvedInitialMartyriaRun[];
  flowDirection: 'ltr' | 'rtl';
  /** The complete reading selected by the style's identification method. */
  pronunciation: string;
}

export type InitialMartyriaStyleSelection =
  | {
      kind: 'standard';
      missingStyleId: string | null;
    }
  | ({
      kind: 'custom';
      missingStyleId: string | null;
    } & ResolvedInitialMartyriaConfiguration);

const initialMartyriaCanonicalNotes: InitialMartyriaCanonicalNote[] = [
  ModeSign.Ni,
  ModeSign.Pa,
  ModeSign.Vou,
  ModeSign.Ga,
  ModeSign.Thi,
  ModeSign.Ke,
  ModeSign.Zo,
];

/*
 * These note names are score content, deliberately kept independent of the
 * translator-editable UI locale files so that a locale edit can never change
 * rendered documents.
 */
const originalGreekNoteNames: InitialMartyriaNoteNames = {
  names: {
    [ModeSign.Ni]: 'Νη',
    [ModeSign.Pa]: 'Πα',
    [ModeSign.Vou]: 'Βου',
    [ModeSign.Ga]: 'Γα',
    [ModeSign.Thi]: 'Δι',
    [ModeSign.Ke]: 'Κε',
    [ModeSign.Zo]: 'Ζω',
  },
  direction: 'ltr',
  languageTag: 'el',
};

const transliteratedGreekNoteNames: InitialMartyriaNoteNames = {
  names: {
    [ModeSign.Ni]: 'Ni',
    [ModeSign.Pa]: 'Pa',
    [ModeSign.Vou]: 'Vou',
    [ModeSign.Ga]: 'Ga',
    [ModeSign.Thi]: 'Di',
    [ModeSign.Ke]: 'Ke',
    [ModeSign.Zo]: 'Zo',
  },
  direction: 'ltr',
  languageTag: 'en',
};

const spanishTransliteratedNoteNames: InitialMartyriaNoteNames = {
  names: {
    [ModeSign.Ni]: 'Ni',
    [ModeSign.Pa]: 'Pa',
    [ModeSign.Vou]: 'Vu',
    [ModeSign.Ga]: 'Ga',
    [ModeSign.Thi]: 'Di',
    [ModeSign.Ke]: 'Ke',
    [ModeSign.Zo]: 'Zo',
  },
  direction: 'ltr',
  languageTag: 'es',
};

const cyrillicTransliteratedNoteNames: InitialMartyriaNoteNames['names'] = {
  [ModeSign.Ni]: 'Ни',
  [ModeSign.Pa]: 'Па',
  [ModeSign.Vou]: 'Ву',
  [ModeSign.Ga]: 'Га',
  [ModeSign.Thi]: 'Ди',
  [ModeSign.Ke]: 'Ке',
  [ModeSign.Zo]: 'Зо',
};

const churchSlavonicTransliteratedNoteNames: InitialMartyriaNoteNames = {
  names: cyrillicTransliteratedNoteNames,
  direction: 'ltr',
  languageTag: 'cu',
};

const russianTransliteratedNoteNames: InitialMartyriaNoteNames = {
  names: cyrillicTransliteratedNoteNames,
  direction: 'ltr',
  languageTag: 'ru',
};

const arabicTransliteratedNoteNames: InitialMartyriaNoteNames = {
  names: {
    [ModeSign.Ni]: 'ني',
    [ModeSign.Pa]: 'با',
    [ModeSign.Vou]: 'فو',
    [ModeSign.Ga]: 'غا',
    [ModeSign.Thi]: 'دي',
    [ModeSign.Ke]: 'كي',
    [ModeSign.Zo]: 'زو',
  },
  direction: 'rtl',
  languageTag: 'ar',
};

type InitialMartyriaModeTexts = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

/*
 * Language-specific script properties, vocabulary, and phrase conventions.
 * Word choice, casing, ordinal formation, and where the plagal word sits in
 * the phrase are language decisions; which words appear at all is described
 * by each style's semantics.
 */
interface InitialMartyriaLexicon {
  /** Reading direction of the language's mode-name phrases. */
  direction: 'ltr' | 'rtl';
  /**
   * The language is written in Greek script, so greek-role text needs no
   * separate font and note names are never transliterated.
   */
  usesGreekScript: boolean;
  /** Note names rendered when a score transliterates them. */
  transliteratedNoteNames: InitialMartyriaNoteNames;
  /** Whether scores in this language transliterate note names by default. */
  transliteratesNoteNamesByDefault: boolean;
  /** The word naming the concept of a mode (Mode, Tono, Glas). */
  label?: string;
  /** Label form used when it trails the mode name (Spanish lowercase). */
  labelMedial?: string;
  /** Label form used with an ordinal numeral (Romanian definite article). */
  labelWithOrdinal?: string;
  /** Ordinal words, in the form used after the label. */
  ordinalWords?: InitialMartyriaModeTexts;
  /** Ordinal words in the form used before the label (Spanish apocope). */
  ordinalWordsPrenominal?: InitialMartyriaModeTexts;
  cardinalWords?: InitialMartyriaModeTexts;
  alphabeticNumerals?: InitialMartyriaModeTexts;
  /** Spells an ordinal from a digit or Roman numeral (1o, al 1-lea). */
  formatOrdinal?: (
    base: string,
    numeralStyle: InitialMartyriaNumeralStyle,
  ) => string;
  /** Standalone plagal word (Plagal, laturas). */
  plagalWord?: string;
  /** Word form that identifies an authentic mode's plagal counterpart. */
  plagalCounterpartWord?: string;
  /** Where a plagal-counterpart marker sits inside the mode-name phrase. */
  plagalCounterpartMarkerPosition?: 'phraseStart' | 'beforeNumeral';
  /** Text phrases mark plagal modes with the stacked abbreviation (Greek). */
  plagalAbbreviationInText: boolean;
  /** Grave-mode word used inside a text phrase. */
  graveWord?: string;
  /** Grave-mode word used as a standalone title next to the mode sign. */
  graveWordTitle?: string;
  /** Whether the language ends the mode-name phrase with a period. */
  usesTerminalPeriod: boolean;
  /**
   * The traditional sign group trails the whole key, after the starting
   * pitch (Arabic).
   */
  modeSignGroupTrailing: boolean;
}

const romanNumerals: InitialMartyriaModeTexts = [
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
];

const englishOrdinalSuffixes: InitialMartyriaModeTexts = [
  'ˢᵗ',
  'ⁿᵈ',
  'ʳᵈ',
  'ᵗʰ',
  'ᵗʰ',
  'ᵗʰ',
  'ᵗʰ',
  'ᵗʰ',
];

function formatEnglishOrdinal(
  base: string,
  numeralStyle: InitialMartyriaNumeralStyle,
) {
  return numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
    ? `${base}${englishOrdinalSuffixes[Number(base) - 1]}`
    : base;
}

const initialMartyriaLexicons: Record<
  InitialMartyriaLanguageId,
  InitialMartyriaLexicon
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: {
    direction: 'ltr',
    usesGreekScript: true,
    transliteratedNoteNames: transliteratedGreekNoteNames,
    transliteratesNoteNamesByDefault: false,
    label: 'Ἦχος',
    ordinalWords: [
      'πρῶτος',
      'δεύτερος',
      'τρίτος',
      'τέταρτος',
      'πέμπτος',
      'ἕκτος',
      'ἕβδομος',
      'ὄγδοος',
    ],
    alphabeticNumerals: ['αʹ', 'βʹ', 'γʹ', 'δʹ', 'εʹ', 'ϛʹ', 'ζʹ', 'ηʹ'],
    plagalWord: 'πλάγιος',
    plagalCounterpartMarkerPosition: 'beforeNumeral',
    plagalAbbreviationInText: true,
    graveWord: 'βαρύς',
    graveWordTitle: 'Βαρύς',
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: {
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: transliteratedGreekNoteNames,
    transliteratesNoteNamesByDefault: false,
    label: 'Mode',
    ordinalWords: [
      'First',
      'Second',
      'Third',
      'Fourth',
      'Fifth',
      'Sixth',
      'Seventh',
      'Eighth',
    ],
    cardinalWords: [
      'One',
      'Two',
      'Three',
      'Four',
      'Five',
      'Six',
      'Seven',
      'Eight',
    ],
    formatOrdinal: formatEnglishOrdinal,
    plagalWord: 'Plagal',
    plagalCounterpartWord: 'Plagal of',
    graveWord: 'Grave',
    plagalAbbreviationInText: false,
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: {
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: spanishTransliteratedNoteNames,
    transliteratesNoteNamesByDefault: false,
    label: 'Tono',
    labelMedial: 'tono',
    ordinalWords: [
      'primero',
      'segundo',
      'tercero',
      'cuarto',
      'quinto',
      'sexto',
      'séptimo',
      'octavo',
    ],
    ordinalWordsPrenominal: [
      'Primer',
      'Segundo',
      'Tercer',
      'Cuarto',
      'Quinto',
      'Sexto',
      'Séptimo',
      'Octavo',
    ],
    cardinalWords: [
      'uno',
      'dos',
      'tres',
      'cuatro',
      'cinco',
      'seis',
      'siete',
      'ocho',
    ],
    formatOrdinal: (base) => `${base}º`,
    plagalAbbreviationInText: false,
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: {
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
    transliteratesNoteNamesByDefault: true,
    label: 'Гла́съ',
    ordinalWords: [
      'пе́рвый',
      'вторы́й',
      'тре́тїй',
      'четве́ртый',
      'пѧ́тый',
      'шесты́й',
      'седмы́й',
      'ѻ҆сьмы́й',
    ],
    cardinalWords: [
      'є҆ди́нъ',
      'два̀',
      'трѝ',
      'четы́ре',
      'пѧ́ть',
      'ше́сть',
      'се́дмь',
      'ѻ҆́смь',
    ],
    alphabeticNumerals: ['а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃'],
    plagalAbbreviationInText: false,
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: {
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: russianTransliteratedNoteNames,
    transliteratesNoteNamesByDefault: true,
    label: 'Глас',
    ordinalWords: [
      'первый',
      'второй',
      'третий',
      'четвёртый',
      'пятый',
      'шестой',
      'седьмой',
      'восьмой',
    ],
    cardinalWords: [
      'один',
      'два',
      'три',
      'четыре',
      'пять',
      'шесть',
      'семь',
      'восемь',
    ],
    plagalAbbreviationInText: false,
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: {
    direction: 'rtl',
    usesGreekScript: false,
    transliteratedNoteNames: arabicTransliteratedNoteNames,
    transliteratesNoteNamesByDefault: false,
    // Arabic fuses the definite label into the mode name, so the ordinal
    // words are full phrases and there is no separate label.
    ordinalWords: [
      'اللحن الأول',
      'اللحن الثاني',
      'اللحن الثالث',
      'اللحن الرابع',
      'اللحن الخامس',
      'اللحن السادس',
      'اللحن السابع',
      'اللحن الثامن',
    ],
    plagalAbbreviationInText: false,
    usesTerminalPeriod: false,
    modeSignGroupTrailing: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: {
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: transliteratedGreekNoteNames,
    transliteratesNoteNamesByDefault: false,
    label: 'Glas',
    labelWithOrdinal: 'Glasul',
    ordinalWords: [
      'întâi',
      'al doilea',
      'al treilea',
      'al patrulea',
      'al cincilea',
      'al șaselea',
      'al șaptelea',
      'al optulea',
    ],
    cardinalWords: [
      'unu',
      'doi',
      'trei',
      'patru',
      'cinci',
      'șase',
      'șapte',
      'opt',
    ],
    formatOrdinal: (base) => `al ${base}-lea`,
    plagalWord: 'Lăturaș',
    plagalCounterpartMarkerPosition: 'beforeNumeral',
    plagalAbbreviationInText: false,
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
};

/** The authentic mode each plagal mode is numbered after. */
const authenticModeNumbers: Partial<Record<ModeKeyMode, number>> = {
  5: 1,
  6: 2,
  8: 4,
};

function isPlagalMode(mode: ModeKeyMode) {
  return authenticModeNumbers[mode] != null;
}

function getInitialMartyriaModeNumber(
  semantics: Pick<InitialMartyriaModeNameSemantics, 'modeNamingScheme'>,
  mode: ModeKeyMode,
) {
  if (
    semantics.modeNamingScheme === INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute
  ) {
    return mode;
  }
  if (mode === 7) {
    // Under plagal terminology the grave mode is named, not numbered.
    return null;
  }
  return authenticModeNumbers[mode] ?? mode;
}

function getInitialMartyriaNumeralText(
  semantics: InitialMartyriaModeNameSemantics,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  const modeNumber = getInitialMartyriaModeNumber(semantics, mode);
  if (modeNumber == null) {
    return null;
  }
  if (semantics.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Words) {
    if (semantics.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal) {
      return lexicon.cardinalWords![modeNumber - 1];
    }
    const words =
      semantics.numeralQualifier ===
      INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
        ? (lexicon.ordinalWordsPrenominal ?? lexicon.ordinalWords)
        : lexicon.ordinalWords;
    return words![modeNumber - 1];
  }
  if (
    semantics.numeralStyle ===
    INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals
  ) {
    return lexicon.alphabeticNumerals![modeNumber - 1];
  }
  const base =
    semantics.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
      ? String(modeNumber)
      : romanNumerals[modeNumber - 1];
  return semantics.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal &&
    lexicon.formatOrdinal
    ? lexicon.formatOrdinal(base, semantics.numeralStyle)
    : base;
}

function getInitialMartyriaNumeralPronunciation(
  semantics: InitialMartyriaModeNameSemantics,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  const modeNumber = getInitialMartyriaModeNumber(semantics, mode);
  if (modeNumber == null) {
    return null;
  }
  if (semantics.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal) {
    return lexicon.cardinalWords![modeNumber - 1];
  }
  const words =
    semantics.numeralQualifier ===
    INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
      ? (lexicon.ordinalWordsPrenominal ?? lexicon.ordinalWords)
      : lexicon.ordinalWords;
  return words![modeNumber - 1];
}

function getInitialMartyriaModeSignPronunciation(
  semantics: InitialMartyriaModeNameSemantics,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  if (
    mode === 7 &&
    semantics.modeNamingScheme !== INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute
  ) {
    if (lexicon.graveWord != null) {
      return lexicon.graveWord;
    }
    return getInitialMartyriaNumeralPronunciation(
      {
        ...semantics,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      },
      lexicon,
      mode,
    )!;
  }
  return getInitialMartyriaNumeralPronunciation(semantics, lexicon, mode)!;
}

function getInitialMartyriaLabelText(
  lexicon: InitialMartyriaLexicon,
  trailingLabel: boolean,
  withOrdinal: boolean,
) {
  if (lexicon.label == null) {
    return null;
  }
  if (lexicon.labelWithOrdinal != null && withOrdinal) {
    return lexicon.labelWithOrdinal;
  }
  return trailingLabel ? (lexicon.labelMedial ?? lexicon.label) : lexicon.label;
}

/** A prenominal mode name puts the mode word after the numeral. */
function usesTrailingLabel(style: InitialMartyriaNumeralIdentification) {
  return (
    style.numeralQualifier === INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
  );
}

function text(
  identificationSource: InitialMartyriaIdentificationSource,
  semantic: InitialMartyriaTextSemantic,
  content: string,
): InitialMartyriaComponent {
  return { kind: 'text', identificationSource, semantic, content };
}

function plagalAbbreviation(
  identificationSource: InitialMartyriaIdentificationSource,
): InitialMartyriaComponent {
  return {
    kind: 'stackedText',
    identificationSource,
    semantic: 'plagalAbbreviation',
    top: 'λ',
    bottom: 'π',
    fontRole: 'greek',
  };
}

function getPlagalIndicator(
  style: InitialMartyriaModeSignStyle | InitialMartyriaTextAndModeSignStyle,
  lexicon: InitialMartyriaLexicon,
  identificationSource: InitialMartyriaIdentificationSource,
): InitialMartyriaComponent {
  if (style.plagalIndicator === 'word') {
    if (lexicon.plagalWord == null) {
      throw new Error(`Missing plagal word for ${style.languageId}`);
    }
    return text(identificationSource, 'plagalWord', lexicon.plagalWord);
  }
  return plagalAbbreviation(identificationSource);
}

function orderInitialMartyriaModeName<T>(
  semantics: InitialMartyriaModeNameSemantics,
  lexicon: InitialMartyriaLexicon,
  identifier: T | null,
  marker: T | null,
  label: T | null,
) {
  const trailingLabel = usesTrailingLabel(semantics);
  if (
    semantics.modeNamingScheme ===
    INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass
  ) {
    return trailingLabel
      ? [identifier, marker, label]
      : [marker, label, identifier];
  }

  if (trailingLabel) {
    return [marker, identifier, label];
  }

  const counterpartMarkerPosition =
    lexicon.plagalCounterpartMarkerPosition ?? 'phraseStart';
  return counterpartMarkerPosition === 'beforeNumeral'
    ? [label, marker, identifier]
    : [marker, label, identifier];
}

function getInitialMartyriaStylePronunciation(
  style: InitialMartyriaStyle,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  const usesPlagalNaming =
    style.modeNamingScheme !== INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute;
  const usesGraveWord =
    mode === 7 && usesPlagalNaming && lexicon.graveWord != null;
  const numeralSemantics =
    mode === 7 && usesPlagalNaming && !usesGraveWord
      ? {
          ...style,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        }
      : style;
  const identifier = usesGraveWord
    ? null
    : getInitialMartyriaNumeralPronunciation(numeralSemantics, lexicon, mode);
  const marker = usesGraveWord
    ? lexicon.graveWord
    : isPlagalMode(mode) && usesPlagalNaming
      ? style.modeNamingScheme ===
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart
        ? (lexicon.plagalCounterpartWord ?? lexicon.plagalWord)
        : lexicon.plagalWord
      : null;
  const trailingLabel = usesTrailingLabel(style);
  const label = getInitialMartyriaLabelText(
    lexicon,
    trailingLabel,
    style.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
  );

  return orderInitialMartyriaModeName(style, lexicon, identifier, marker, label)
    .filter((component): component is string => component != null)
    .join(' ');
}

/**
 * Derives the displayed components for one mode from the style's semantics
 * and its language's lexicon. The mode name is a phrase built from the
 * label, the numeral, and a plagal or grave marker; sign-identified styles
 * use the traditional sign group in place of the numeral. flowDirection is
 * the resolved rendering direction (a 'page' flow resolves against the page
 * setup).
 */
function getInitialMartyriaComponents(
  style: InitialMartyriaStyle,
  mode: ModeKeyMode,
  flowDirection: 'ltr' | 'rtl' = style.flowDirection === 'rtl' ? 'rtl' : 'ltr',
): InitialMartyriaComponent[] {
  const lexicon = initialMartyriaLexicons[style.languageId];
  const plagal = isPlagalMode(mode);
  const modeSign: InitialMartyriaComponent = {
    kind: 'modeSign',
    identificationSource: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  };
  const startingPitch: InitialMartyriaComponent = {
    kind: 'startingNoteCluster',
  };

  let ordered: (InitialMartyriaComponent | null)[];
  if (
    style.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    const trailingLabel = usesTrailingLabel(style);
    const labelText = getInitialMartyriaLabelText(
      lexicon,
      trailingLabel,
      false,
    );
    const label =
      labelText == null
        ? null
        : text(
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
            'label',
            labelText,
          );
    // The sign carries the style's numeral pronunciation. Treat it as the
    // numeral when ordering the mode name: "plagal first mode", "first plagal
    // mode", and "plagal mode one" place the same sign differently.
    // The sign group identifies the mode: the stacked plagal abbreviation
    // (or the grave title, where the language spells one out) plus the sign.
    const graveTitle =
      mode === 7 &&
      style.modeNamingScheme !== INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute
        ? lexicon.graveWordTitle
        : null;
    const marker = plagal
      ? getPlagalIndicator(
          style,
          lexicon,
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
        )
      : graveTitle != null
        ? text(
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
            'graveWord',
            graveTitle,
          )
        : null;
    const orderingSemantics =
      mode === 7 && graveTitle == null && lexicon.graveWord != null
        ? {
            ...style,
            numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
          }
        : style;
    ordered = orderInitialMartyriaModeName(
      orderingSemantics,
      lexicon,
      modeSign,
      marker,
      label,
    );
    ordered.push(startingPitch);
  } else {
    const trailingLabel = usesTrailingLabel(style);
    const labelText = getInitialMartyriaLabelText(
      lexicon,
      trailingLabel,
      style.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    );
    const label =
      labelText == null
        ? null
        : text(
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
            'label',
            labelText,
          );
    // The text phrase identifies the mode.
    const numeralText = getInitialMartyriaNumeralText(style, lexicon, mode);
    const numeral =
      numeralText == null
        ? null
        : text(
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
            'numeral',
            numeralText,
          );
    const usesPlagalNaming =
      style.modeNamingScheme !== INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute;

    let marker: InitialMartyriaComponent | null = null;
    if (mode === 7 && usesPlagalNaming && lexicon.graveWord != null) {
      marker = text(
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        'graveWord',
        lexicon.graveWord,
      );
    } else if (plagal && usesPlagalNaming) {
      if (lexicon.plagalAbbreviationInText) {
        marker = plagalAbbreviation(
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        );
      } else if (lexicon.plagalWord != null) {
        marker = text(
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          'plagalWord',
          style.modeNamingScheme ===
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart
            ? (lexicon.plagalCounterpartWord ?? lexicon.plagalWord)
            : lexicon.plagalWord,
        );
      }
    }

    ordered = orderInitialMartyriaModeName(
      style,
      lexicon,
      numeral,
      marker,
      label,
    );

    if (lexicon.usesTerminalPeriod) {
      const lastText = ordered
        .filter(
          (
            component,
          ): component is Extract<InitialMartyriaComponent, { kind: 'text' }> =>
            component?.kind === 'text',
        )
        .at(-1);
      if (lastText != null) {
        lastText.content += '.';
      }
    }

    if (
      style.modeIdentificationMethod ===
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign
    ) {
      // The traditional sign group repeats the text identification, but keeps
      // its own conventional reading rather than inheriting the text's number
      // form. For example, the sign beside "Mode 5" is still read as
      // "Plagal First".
      const indicator = plagal
        ? getPlagalIndicator(
            style,
            lexicon,
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
          )
        : null;
      const group = orderInitialMartyriaModeName(
        style.modeSignPronunciation,
        lexicon,
        modeSign,
        indicator,
        null,
      ).filter(
        (component): component is InitialMartyriaComponent => component != null,
      );
      if (flowDirection === 'rtl') {
        group.reverse();
      }
      if (lexicon.modeSignGroupTrailing) {
        ordered.push(startingPitch, ...group);
      } else {
        ordered.push(...group, startingPitch);
      }
    } else {
      ordered.push(startingPitch);
    }
  }

  const components = ordered.filter(
    (component): component is InitialMartyriaComponent => component != null,
  );
  return components;
}

const modeKeyModes: ModeKeyMode[] = [1, 2, 3, 4, 5, 6, 7, 8];

export function initialMartyriaStyleHasGreekText(style: InitialMartyriaStyle) {
  return modeKeyModes.some((mode) =>
    getInitialMartyriaComponents(style, mode).some(
      (component) =>
        component.kind !== 'modeSign' &&
        component.kind !== 'startingNoteCluster' &&
        component.fontRole === 'greek',
    ),
  );
}

function defaultAppearance(
  mainFontFamily: string,
  greekFontFamily = mainFontFamily,
): InitialMartyriaDefaultAppearance {
  return {
    mainFontFamily,
    greekFontFamily,
    fontStyle: DEFAULT_FONT_STYLE,
    fontSize: Unit.fromPt(14.5),
    color: '#ED0000',
    strokeWidth: 0,
    fontVariantCaps: null,
    fontVariantNumeric: null,
    fontVariantLigatures: null,
    fontVariantAlternates: null,
  };
}

type BuiltInInitialMartyriaStyleBase = Omit<
  InitialMartyriaStyleBase,
  'flowDirection'
> &
  Partial<Pick<InitialMartyriaStyleBase, 'flowDirection'>>;

interface BuiltInInitialMartyriaModeSignIdentification {
  plagalIndicator?: InitialMartyriaPlagalIndicator;
}

type BuiltInInitialMartyriaStyle =
  | (BuiltInInitialMartyriaStyleBase & {
      modeIdentificationMethod: typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text;
    })
  | (BuiltInInitialMartyriaStyleBase &
      BuiltInInitialMartyriaModeSignIdentification & {
        modeIdentificationMethod: typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign;
      })
  | (BuiltInInitialMartyriaStyleBase &
      BuiltInInitialMartyriaModeSignIdentification & {
        modeIdentificationMethod: typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign;
      });

const traditionalModeSignPronunciation: InitialMartyriaModeSignPronunciation = {
  numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
  numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
  numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
  modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
};

function builtIn(options: BuiltInInitialMartyriaStyle): InitialMartyriaStyle {
  const base = { flowDirection: 'page' as const };
  if (
    options.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text
  ) {
    return { ...base, ...options };
  }
  if (
    options.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    return { ...base, plagalIndicator: 'stackedAbbreviation', ...options };
  }
  return {
    ...base,
    plagalIndicator: 'stackedAbbreviation',
    modeSignPronunciation: { ...traditionalModeSignPronunciation },
    ...options,
  };
}

const sourceSerifAppearance = () => defaultAppearance('Source Serif');

// Curated styles are developer-owned. A new option needs an ID and localized
// name selector above, then one entry here describing its semantics; the
// displayed components are derived from those semantics and the language
// lexicon by getInitialMartyriaComponents.
export const builtInInitialMartyriaStyles: InitialMartyriaStyle[] = [
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    defaultAppearance: defaultAppearance('GFS Didot'),
  }),
  /*
   * Nea Mousiki Kypseli, Bambas edition (1898)
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekModeNamesV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: defaultAppearance('GFS Didot'),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalFirstV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNamesV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartOrdinalDigitsTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberSignV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartRomanNumeralTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberWordTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassOrdinalWordsTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassOrdinalWordsV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishOrdinalPlagalTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
  }),
  /*
   * Attested as "2nd plagal mode" and "4th plagal mode" in Christian
   * Troelsgard, Byzantine Neumes: A New Introduction to the Middle Byzantine
   * Musical Notation.
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishOrdinalPlagalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumberWordV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishFullNameV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartOrdinalDigitsV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishAuthenticCounterpartNumberWordV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinalNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  /*
   * https://analogion.com/forum/index.php?attachments/84206/
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishOrdinalTonoV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: defaultAppearance('Old Standard'),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: defaultAppearance('Old Standard'),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeralTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: defaultAppearance('Old Standard'),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: defaultAppearance('Old Standard'),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinalTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: defaultAppearance('Old Standard'),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: defaultAppearance('Noto Naskh Arabic', 'GFS Didot'),
    flowDirection: 'rtl',
  }),
  /*
   * Attested in the popular series of books by Hierodeacon John Lacoschitiotul e.g.
   * Lacoschitiotul, Ioan, ierodiacon, Buchet muzical athonit: Dumnezeiasca Liturghie. Vol. 1. 2nd ed. Bucharest: Evanghelismos, 2009.
   *
   * Also the 2002 reprint of the Anastasimatarion by Macarius.
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  /*
   * Attested in 1990s editions of Archdeacon Sebastian Barbu-Bucur, e.g.
   * Dimitrie Suceveanu, Idiomelarul, ed. Sebastian Barbu-Bucur (București: Editura Muzicală, 1996),
   *
   * Also attested in 20th century Uniformizat interlinear Western-Byzantine notation editions.
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  /*
   * Attested in 19th century works of Anton Pann
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasOrdinalNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    plagalIndicator: 'word',
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasOrdinalRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    plagalIndicator: 'word',
    defaultAppearance: sourceSerifAppearance(),
  }),
  /*
   * Attested in 21st-century works by e.g.:
   *
   * - Virgil Ioan Nanu, e.g. https://www.stavropoleos.ro/wp-content/uploads/Psaltica/Taine_ierurgii/parastas.pdf
   * - Re-edition of Anton Pann's Heruvico-Chinonicar. Drobeta-Turnu Severin: Editura Didahia Severin (2012).
   * - Re-edition of Macarie Ieromonahul's Irmologhion Calofonicon by Cătălin Cernătescu. Bucharest: Editura Universității Naționale de Muzică București, 2023.
   *
   * These typically udo not translate the note name.
   * They may use either 'Glas' or 'Ehul'.
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
];

export function createInitialMartyriaConfiguration(
  styleId: BuiltInInitialMartyriaStyleId,
): InitialMartyriaConfiguration {
  const style = getBuiltInInitialMartyriaStyle(styleId)!;
  return {
    styleId,
    transliterateNoteNames: usesTransliteratedNoteNamesByDefault(
      style.languageId,
    ),
    appearanceOverrides: {},
  };
}

export function usesTransliteratedNoteNamesByDefault(
  languageId: InitialMartyriaLanguageId,
) {
  return initialMartyriaLexicons[languageId].transliteratesNoteNamesByDefault;
}

export function usesGreekScript(languageId: InitialMartyriaLanguageId) {
  return initialMartyriaLexicons[languageId].usesGreekScript;
}

export function cloneInitialMartyriaConfiguration(
  configuration: InitialMartyriaConfiguration,
): InitialMartyriaConfiguration {
  return {
    styleId: configuration.styleId,
    transliterateNoteNames: configuration.transliterateNoteNames,
    appearanceOverrides: { ...configuration.appearanceOverrides },
  };
}

export function getInitialMartyriaContext(
  element: ModeKeyElement,
): InitialMartyriaContext {
  if (!isModeKeyMode(element.mode)) {
    throw new Error(`Invalid initial martyria mode: ${element.mode}`);
  }
  return {
    mode: element.mode,
    traditionalModeSign: element.martyria,
    pitchCluster: {
      primary: isInitialMartyriaCanonicalNote(element.note)
        ? {
            note: element.note,
            fthoraAbove: element.fthoraAboveNote,
            quantitativeNeumeAbove: element.quantitativeNeumeAboveNote,
          }
        : null,
      secondary: isInitialMartyriaCanonicalNote(element.note2)
        ? {
            note: element.note2,
            fthoraAbove: element.fthoraAboveNote2,
            quantitativeNeumeAbove: element.quantitativeNeumeAboveNote2,
          }
        : null,
      trailingGlyphs: [
        element.quantitativeNeumeRight,
        element.fthoraAboveQuantitativeNeumeRight,
      ].filter((neume) => neume != null) as Neume[],
    },
  };
}

const builtInInitialMartyriaStylesById = new Map<string, InitialMartyriaStyle>(
  builtInInitialMartyriaStyles.map((style) => [style.id, style]),
);

export function isBuiltInInitialMartyriaStyleId(
  id: string,
): id is BuiltInInitialMartyriaStyleId {
  return builtInInitialMartyriaStylesById.has(id);
}

export function getBuiltInInitialMartyriaStyleNameSelector(
  styleId: string | null | undefined,
) {
  if (styleId == null || !isBuiltInInitialMartyriaStyleId(styleId)) {
    return null;
  }
  return BUILT_IN_INITIAL_MARTYRIA_STYLE_NAME_SELECTORS[styleId];
}

export function getInitialMartyriaStyleDisplayName(
  style: InitialMartyriaStyle,
  t: TFunction<Namespace>,
) {
  return t(BUILT_IN_INITIAL_MARTYRIA_STYLE_NAME_SELECTORS[style.id], {
    ns: 'dialog',
  });
}

export function getBuiltInInitialMartyriaStyle(id: string) {
  return builtInInitialMartyriaStylesById.get(id) ?? null;
}

function resolveAppearance(
  style: InitialMartyriaStyle,
  configuration: InitialMartyriaConfiguration,
  fontRole: 'main' | 'greek',
): InitialMartyriaAppearance {
  const defaults = style.defaultAppearance;
  const overrides = configuration.appearanceOverrides;
  const fontFamily =
    fontRole === 'main' || usesGreekScript(style.languageId)
      ? (overrides.mainFontFamily ?? defaults.mainFontFamily)
      : (overrides.greekFontFamily ?? defaults.greekFontFamily);
  const color = overrides.color ?? defaults.color;
  const resolveVariant = (
    override: string | null | undefined,
    defaultValue: string | null,
  ) =>
    override === undefined
      ? (defaultValue ?? 'normal')
      : (override ?? 'normal');
  return {
    fontFamily,
    fontStyle: overrides.fontStyle ?? defaults.fontStyle,
    fontSize: overrides.fontSize ?? defaults.fontSize,
    fontVariantCaps: resolveVariant(
      overrides.fontVariantCaps,
      defaults.fontVariantCaps,
    ),
    fontVariantNumeric: resolveVariant(
      overrides.fontVariantNumeric,
      defaults.fontVariantNumeric,
    ),
    fontVariantLigatures: resolveVariant(
      overrides.fontVariantLigatures,
      defaults.fontVariantLigatures,
    ),
    fontVariantAlternates: resolveVariant(
      overrides.fontVariantAlternates,
      defaults.fontVariantAlternates,
    ),
    color,
    strokeWidth: overrides.strokeWidth ?? defaults.strokeWidth,
    strokeColor: color,
  };
}

export function resolveInitialMartyriaConfiguration(
  configuration: InitialMartyriaConfiguration,
): ResolvedInitialMartyriaConfiguration | null {
  const style = getBuiltInInitialMartyriaStyle(configuration.styleId);
  if (style == null) {
    return null;
  }
  return {
    style,
    configuration,
    mainAppearance: resolveAppearance(style, configuration, 'main'),
    greekAppearance: resolveAppearance(style, configuration, 'greek'),
  };
}

export function resolveInitialMartyriaStyleSelection(options: {
  elementConfiguration: InitialMartyriaConfiguration | null | undefined;
  pageConfiguration: InitialMartyriaConfiguration | null | undefined;
}): InitialMartyriaStyleSelection {
  const requested =
    options.elementConfiguration === undefined
      ? options.pageConfiguration
      : options.elementConfiguration;
  if (requested == null) {
    return { kind: 'standard', missingStyleId: null };
  }
  const resolved = resolveInitialMartyriaConfiguration(requested);
  if (resolved != null) {
    return { kind: 'custom', missingStyleId: null, ...resolved };
  }
  if (
    options.elementConfiguration !== undefined &&
    options.pageConfiguration != null
  ) {
    const pageResolved = resolveInitialMartyriaConfiguration(
      options.pageConfiguration,
    );
    if (pageResolved != null) {
      return {
        kind: 'custom',
        missingStyleId: requested.styleId,
        ...pageResolved,
      };
    }
  }
  return { kind: 'standard', missingStyleId: requested.styleId };
}

function getInitialMartyriaTextComponentPronunciation(
  component: Extract<
    InitialMartyriaComponent,
    { kind: 'text' | 'stackedText' }
  >,
  semantics: InitialMartyriaModeNameSemantics,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  if (component.kind === 'text') {
    if (component.semantic === 'numeral') {
      return getInitialMartyriaNumeralPronunciation(semantics, lexicon, mode)!;
    }
    return component.content.endsWith('.')
      ? component.content.slice(0, -1)
      : component.content;
  }
  if (component.semantic === 'plagalAbbreviation') {
    if (
      semantics.modeNamingScheme ===
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart &&
      lexicon.plagalCounterpartWord != null
    ) {
      return lexicon.plagalCounterpartWord;
    }
    return lexicon.plagalWord ?? `${component.top} ${component.bottom}`;
  }
  return `${component.top} ${component.bottom}`;
}

export function resolveInitialMartyriaStyle(options: {
  context: InitialMartyriaContext;
  resolvedConfiguration: ResolvedInitialMartyriaConfiguration;
  pageSetup: Pick<PageSetup, 'direction'>;
}): InitialMartyriaStyleResolution {
  const { style, configuration, mainAppearance, greekAppearance } =
    options.resolvedConfiguration;
  const lexicon = initialMartyriaLexicons[style.languageId];
  const flowDirection =
    style.flowDirection === 'page'
      ? options.pageSetup.direction
      : style.flowDirection;
  // Greek-script languages never transliterate their note names; a stray
  // flag from a hand-edited file must not change the rendered score.
  const transliterate =
    configuration.transliterateNoteNames && !lexicon.usesGreekScript;
  const noteNames = transliterate
    ? lexicon.transliteratedNoteNames
    : originalGreekNoteNames;
  const noteAppearance = transliterate ? mainAppearance : greekAppearance;
  const glyphAppearance: InitialMartyriaAppearance = {
    color: mainAppearance.color,
    strokeWidth: mainAppearance.strokeWidth,
    strokeColor: mainAppearance.strokeColor,
  };
  const modeSignPronunciation =
    style.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign
      ? style.modeSignPronunciation
      : style;
  const pronunciation = getInitialMartyriaStylePronunciation(
    style,
    lexicon,
    options.context.mode,
  );

  const runs: ResolvedInitialMartyriaRun[] = [];
  for (const component of getInitialMartyriaComponents(
    style,
    options.context.mode,
    flowDirection,
  )) {
    if (component.kind === 'text' || component.kind === 'stackedText') {
      const fontRole = component.fontRole ?? 'main';
      runs.push({
        kind: 'text',
        semantic: component.semantic,
        appearance: fontRole === 'greek' ? greekAppearance : mainAppearance,
        fontRole,
        direction: fontRole === 'greek' ? 'ltr' : lexicon.direction,
        languageTag: fontRole === 'greek' ? 'el' : style.languageId,
        identificationSource: component.identificationSource,
        pronunciation: getInitialMartyriaTextComponentPronunciation(
          component,
          component.identificationSource ===
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
            ? modeSignPronunciation
            : style,
          lexicon,
          options.context.mode,
        ),
        content:
          component.kind === 'text'
            ? { layout: 'inline', text: component.content }
            : { layout: 'stacked', lines: [component.top, component.bottom] },
      });
      continue;
    }
    if (component.kind === 'modeSign') {
      runs.push({
        kind: 'glyph',
        semantic: 'modeSign',
        appearance: glyphAppearance,
        direction: flowDirection,
        glyphs: [options.context.traditionalModeSign],
        identificationSource: component.identificationSource,
        pronunciation: getInitialMartyriaModeSignPronunciation(
          modeSignPronunciation,
          lexicon,
          options.context.mode,
        ),
      });
      continue;
    }
    runs.push({
      kind: 'startingPitch',
      appearance: glyphAppearance,
      noteText: { ...noteNames, appearance: noteAppearance },
      direction: noteNames.direction,
      cluster: options.context.pitchCluster,
    });
  }
  return {
    style,
    flowDirection,
    pronunciation,
    runs,
  };
}

function isInitialMartyriaStartingNoteRun(
  run: ResolvedInitialMartyriaRun,
): run is InitialMartyriaStartingNoteRun {
  return run.kind === 'startingPitch';
}

export type InitialMartyriaSeparator =
  | 'none'
  | 'wordSpace'
  | 'modeSign'
  | 'plagalAbbreviation'
  | 'startingNote'
  | 'noteCluster';

export function getInitialMartyriaFixedSeparatorSize(
  separator: InitialMartyriaSeparator,
  mainTextFontSize: number,
) {
  switch (separator) {
    case 'modeSign':
    case 'plagalAbbreviation':
    case 'startingNote':
    case 'noteCluster':
      return 0.43 * mainTextFontSize;
    default:
      return null;
  }
}

export function getInitialMartyriaSeparatorBefore(
  runs: ResolvedInitialMartyriaRun[],
  index: number,
): InitialMartyriaSeparator {
  if (index <= 0 || index >= runs.length) {
    return 'none';
  }
  const before = runs[index - 1];
  const after = runs[index];
  const isModeSign = (run: ResolvedInitialMartyriaRun) =>
    run.kind === 'glyph' && run.semantic === 'modeSign';
  const isPlagalAbbreviation = (run: ResolvedInitialMartyriaRun) =>
    run.kind === 'text' && run.semantic === 'plagalAbbreviation';
  if (isInitialMartyriaStartingNoteRun(after)) {
    return 'startingNote';
  }
  if (isInitialMartyriaStartingNoteRun(before) && after.kind === 'text') {
    return 'startingNote';
  }
  if (isModeSign(before) || isModeSign(after)) {
    return 'modeSign';
  }
  if (isPlagalAbbreviation(before) || isPlagalAbbreviation(after)) {
    return 'plagalAbbreviation';
  }
  return 'wordSpace';
}

export function getInitialMartyriaSeparatorAfter(
  runs: ResolvedInitialMartyriaRun[],
  index: number,
): InitialMartyriaSeparator {
  if (index < 0 || index >= runs.length) {
    return 'none';
  }
  if (index !== runs.length - 1) {
    return getInitialMartyriaSeparatorBefore(runs, index + 1);
  }
  const last = runs[index];
  if (last.kind !== 'text' || last.semantic !== 'plagalAbbreviation') {
    return 'none';
  }
  return 'plagalAbbreviation';
}

function isModeKeyMode(value: number): value is ModeKeyMode {
  return Number.isInteger(value) && value >= 1 && value <= 8;
}

function isInitialMartyriaCanonicalNote(
  value: ModeSign | null,
): value is InitialMartyriaCanonicalNote {
  return initialMartyriaCanonicalNotes.includes(
    value as InitialMartyriaCanonicalNote,
  );
}
