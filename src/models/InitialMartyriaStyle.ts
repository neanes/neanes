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

export interface InitialMartyriaLanguage {
  id: InitialMartyriaLanguageId;
  languageTag: string;
  direction: 'ltr' | 'rtl';
}

export const initialMartyriaLanguages: InitialMartyriaLanguage[] = [
  {
    id: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    languageTag: 'el',
    direction: 'ltr',
  },
  {
    id: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    languageTag: 'en',
    direction: 'ltr',
  },
  {
    id: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    languageTag: 'es',
    direction: 'ltr',
  },
  {
    id: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    languageTag: 'cu',
    direction: 'ltr',
  },
  {
    id: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    languageTag: 'ru',
    direction: 'ltr',
  },
  {
    id: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    languageTag: 'ar',
    direction: 'rtl',
  },
  {
    id: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    languageTag: 'ro',
    direction: 'ltr',
  },
];

export const BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS = {
  TraditionalGreekV1: 'builtin:traditional-greek-v1',
  GreekModeNamesV1: 'builtin:greek-mode-names-v1',
  EnglishPlagalFirstV1: 'builtin:english-plagal-first-v1',
  EnglishModeNamesV1: 'builtin:english-mode-names-v1',
  EnglishSignFirstV1: 'builtin:english-sign-first-v1',
  EnglishModeBeforeSignV1: 'builtin:english-mode-before-sign-v1',
  EnglishOrdinalV1: 'builtin:english-ordinal-v1',
  EnglishModeNumberV1: 'builtin:english-mode-number-v1',
  EnglishModeRomanNumeralV1: 'builtin:english-mode-roman-numeral-v1',
  EnglishModeNumberWordV1: 'builtin:english-mode-number-word-v1',
  EnglishFullNameV1: 'builtin:english-full-name-v1',
  EnglishPlagalNumberV1: 'builtin:english-plagal-number-v1',
  EnglishPlagalRomanNumeralV1: 'builtin:english-plagal-roman-numeral-v1',
  EnglishPlagalNumberWordV1: 'builtin:english-plagal-number-word-v1',
  SpanishTonoNumberV1: 'builtin:spanish-tono-number-v1',
  SpanishTonoRomanNumeralV1: 'builtin:spanish-tono-roman-numeral-v1',
  SpanishTonoOrdinalNumberV1: 'builtin:spanish-tono-ordinal-number-v1',
  SpanishTonoOrdinalV1: 'builtin:spanish-tono-ordinal-v1',
  SpanishOrdinalTonoV1: 'builtin:spanish-ordinal-tono-v1',
  ChurchSlavonicGlasNumberV1: 'builtin:church-slavonic-glas-number-v1',
  ChurchSlavonicGlasCyrillicNumeralV1:
    'builtin:church-slavonic-glas-cyrillic-numeral-v1',
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
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishSignFirst,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeBeforeSignV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishModeBeforeSign,
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
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishPlagalNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalRomanNumeralV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishPlagalRomanNumeral,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalNumberWordV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishPlagalNumberWord,
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

export type InitialMartyriaComponent =
  | {
      kind: 'text';
      content: string;
      fontRole?: 'main' | 'greek';
    }
  | {
      kind: 'stackedText';
      top: string;
      bottom: string;
      fontRole?: 'main' | 'greek';
    }
  | {
      kind: 'modeSign';
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

export interface InitialMartyriaAppearanceOverrides {
  mainFontFamily?: string;
  greekFontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
  color?: string;
  strokeWidth?: number;
  fontVariantCaps?: string | null;
  fontVariantNumeric?: string | null;
  fontVariantLigatures?: string | null;
  fontVariantAlternates?: string | null;
}

export interface InitialMartyriaConfiguration {
  styleId: BuiltInInitialMartyriaStyleId;
  transliterateNoteNames: boolean;
  appearanceOverrides: InitialMartyriaAppearanceOverrides;
}

export interface InitialMartyriaStyle {
  id: BuiltInInitialMartyriaStyleId;
  languageId: InitialMartyriaLanguageId;
  numeralKind: InitialMartyriaNumeralKind;
  numeralStyle: InitialMartyriaNumeralStyle;
  numeralQualifier?: InitialMartyriaNumeralQualifier;
  usesPlagalTerminology: boolean;
  modeIdentificationMethod: InitialMartyriaModeIdentificationMethod;
  /**
   * Where the stacked plagal abbreviation sits when the traditional mode
   * sign identifies the mode. It usually directly precedes the sign (a
   * right-to-left flow mirrors the pair automatically).
   */
  plagalAbbreviationPlacement:
    'beforeModeSign' | 'afterModeSign' | 'beforeLabel';
  flowDirection: 'page' | 'ltr' | 'rtl';
  defaultAppearance: InitialMartyriaDefaultAppearance;
  originalNoteNames: InitialMartyriaNoteNames;
  transliteratedNoteNames: InitialMartyriaNoteNames;
}

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
  baselineShift?: number;
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
  | { layout: 'inline'; text: string }
  | { layout: 'stacked'; lines: string[]; gap: number };

export type ResolvedInitialMartyriaRun =
  | {
      kind: 'glyph';
      semantic: 'modeSign';
      appearance: InitialMartyriaAppearance;
      direction: 'ltr' | 'rtl';
      glyphs: Neume[];
    }
  | {
      kind: 'text';
      appearance: InitialMartyriaAppearance;
      fontRole: 'main' | 'greek';
      direction: 'ltr' | 'rtl';
      languageTag: string;
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

export const initialMartyriaCanonicalNotes: InitialMartyriaCanonicalNote[] = [
  ModeSign.Ni,
  ModeSign.Pa,
  ModeSign.Vou,
  ModeSign.Ga,
  ModeSign.Thi,
  ModeSign.Ke,
  ModeSign.Zo,
];

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
 * Language-specific vocabulary and phrase conventions. Word choice, casing,
 * ordinal formation, and where the plagal word sits in the phrase are
 * language decisions; which words appear at all is described by each style's
 * semantics.
 */
interface InitialMartyriaLexicon {
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
  formatOrdinal?: (base: string) => string;
  /** Standalone plagal word (Plagal, laturas). */
  plagalWord?: string;
  /** Plagal word form used directly before a numeral (Plagal of). */
  plagalWordBeforeNumeral?: string;
  /** Where the plagal word sits inside the mode-name phrase. */
  plagalWordPosition?: 'phraseStart' | 'beforeNumeral' | 'afterNumeral';
  /** Text phrases mark plagal modes with the stacked abbreviation (Greek). */
  plagalAbbreviationInText?: boolean;
  /**
   * Ordinal mode names carry the plagal word even though the numbering runs
   * continuously through the plagal modes (Romanian 'al 5-lea laturas').
   */
  plagalWordWithOrdinals?: boolean;
  /**
   * The sign group drops the stacked abbreviation when the text phrase
   * already carries the plagal word (Romanian; English editions keep both).
   */
  omitsPlagalAbbreviationAfterPlagalWord?: boolean;
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
  modeSignGroupTrailing?: boolean;
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

const initialMartyriaLexicons: Record<
  InitialMartyriaLanguageId,
  InitialMartyriaLexicon
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: {
    label: 'Ἦχος',
    alphabeticNumerals: ['αʹ', 'βʹ', 'γʹ', 'δʹ', 'εʹ', 'ϛʹ', 'ζʹ', 'ηʹ'],
    plagalWordPosition: 'beforeNumeral',
    plagalAbbreviationInText: true,
    graveWord: 'βαρύς',
    graveWordTitle: 'Βαρύς',
    usesTerminalPeriod: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: {
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
    plagalWord: 'Plagal',
    plagalWordBeforeNumeral: 'Plagal of',
    plagalWordPosition: 'phraseStart',
    graveWord: 'Grave',
    usesTerminalPeriod: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: {
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
    formatOrdinal: (base) => `${base}º`,
    usesTerminalPeriod: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: {
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
    alphabeticNumerals: ['а҃', 'в҃', 'г҃', 'д҃', 'є҃', 'ѕ҃', 'з҃', 'и҃'],
    usesTerminalPeriod: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: {
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
    usesTerminalPeriod: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: {
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
    usesTerminalPeriod: false,
    modeSignGroupTrailing: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: {
    label: 'Glas',
    labelWithOrdinal: 'Glasul',
    formatOrdinal: (base) => `al ${base}-lea`,
    plagalWord: 'lăturaș',
    plagalWordPosition: 'afterNumeral',
    plagalWordWithOrdinals: true,
    omitsPlagalAbbreviationAfterPlagalWord: true,
    usesTerminalPeriod: true,
  },
};

const plagalModes: ModeKeyMode[] = [5, 6, 8];

/** The authentic mode each plagal mode is numbered after. */
const authenticModeNumbers: Partial<Record<ModeKeyMode, number>> = {
  5: 1,
  6: 2,
  8: 4,
};

function getInitialMartyriaModeNumber(
  style: InitialMartyriaStyle,
  mode: ModeKeyMode,
) {
  if (!style.usesPlagalTerminology) {
    return mode;
  }
  if (mode === 7) {
    // Under plagal terminology the grave mode is named, not numbered.
    return null;
  }
  return authenticModeNumbers[mode] ?? mode;
}

function getInitialMartyriaNumeralText(
  style: InitialMartyriaStyle,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  const modeNumber = getInitialMartyriaModeNumber(style, mode);
  if (modeNumber == null) {
    return null;
  }
  if (style.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Words) {
    if (style.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal) {
      return lexicon.cardinalWords![modeNumber - 1];
    }
    const words =
      style.numeralQualifier === INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
        ? (lexicon.ordinalWordsPrenominal ?? lexicon.ordinalWords)
        : lexicon.ordinalWords;
    return words![modeNumber - 1];
  }
  if (
    style.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals
  ) {
    return lexicon.alphabeticNumerals![modeNumber - 1];
  }
  const base =
    style.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
      ? String(modeNumber)
      : romanNumerals[modeNumber - 1];
  return style.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal &&
    lexicon.formatOrdinal
    ? lexicon.formatOrdinal(base)
    : base;
}

function getInitialMartyriaLabelText(
  style: InitialMartyriaStyle,
  lexicon: InitialMartyriaLexicon,
) {
  if (lexicon.label == null) {
    return null;
  }
  if (
    lexicon.labelWithOrdinal != null &&
    style.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal &&
    style.modeIdentificationMethod !==
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    return lexicon.labelWithOrdinal;
  }
  return usesTrailingLabel(style)
    ? (lexicon.labelMedial ?? lexicon.label)
    : lexicon.label;
}

/** A prenominal mode name puts the mode word after the numeral or sign. */
function usesTrailingLabel(style: InitialMartyriaStyle) {
  return (
    style.numeralQualifier === INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
  );
}

function text(content: string): InitialMartyriaComponent {
  return { kind: 'text', content };
}

function plagalAbbreviation(): InitialMartyriaComponent {
  return { kind: 'stackedText', top: 'λ', bottom: 'π', fontRole: 'greek' };
}

/**
 * Derives the displayed components for one mode from the style's semantics
 * and its language's lexicon. The mode name is a phrase built from the
 * label, the numeral, and a plagal or grave marker; sign-identified styles
 * use the traditional sign group in place of the numeral. flowDirection is
 * the resolved rendering direction (a 'page' flow resolves against the page
 * setup).
 */
export function getInitialMartyriaComponents(
  style: InitialMartyriaStyle,
  mode: ModeKeyMode,
  flowDirection: 'ltr' | 'rtl' = style.flowDirection === 'rtl' ? 'rtl' : 'ltr',
): InitialMartyriaComponent[] {
  const lexicon = initialMartyriaLexicons[style.languageId];
  const method = style.modeIdentificationMethod;
  const trailingLabel = usesTrailingLabel(style);
  // A right-to-left flow mirrors the abbreviation-sign pair so the
  // abbreviation keeps its traditional place beside the sign.
  const signBeforeAbbreviation =
    (style.plagalAbbreviationPlacement === 'afterModeSign') !==
    (flowDirection === 'rtl');
  const isPlagalMode = plagalModes.includes(mode);
  const labelText = getInitialMartyriaLabelText(style, lexicon);
  const label = labelText == null ? null : text(labelText);
  const modeSign: InitialMartyriaComponent = { kind: 'modeSign' };
  const startingPitch: InitialMartyriaComponent = {
    kind: 'startingNoteCluster',
  };

  let ordered: (InitialMartyriaComponent | null)[];
  if (method === INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign) {
    // The sign group identifies the mode: the stacked plagal abbreviation
    // (or the grave title, where the language spells one out) plus the sign.
    const graveTitle =
      mode === 7 && style.usesPlagalTerminology ? lexicon.graveWordTitle : null;
    const marker = isPlagalMode
      ? plagalAbbreviation()
      : graveTitle != null
        ? text(graveTitle)
        : null;
    if (style.plagalAbbreviationPlacement === 'beforeLabel') {
      ordered = [marker, label, modeSign];
    } else {
      const group = signBeforeAbbreviation
        ? [modeSign, marker]
        : [marker, modeSign];
      ordered = trailingLabel ? [...group, label] : [label, ...group];
    }
    ordered.push(startingPitch);
  } else {
    // The text phrase identifies the mode.
    const numeralText = getInitialMartyriaNumeralText(style, lexicon, mode);
    const numeral = numeralText == null ? null : text(numeralText);
    const markerPosition = lexicon.plagalWordPosition ?? 'phraseStart';

    let marker: InitialMartyriaComponent | null = null;
    const marksPlagalModes =
      style.usesPlagalTerminology ||
      (lexicon.plagalWordWithOrdinals === true &&
        style.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal);
    if (
      mode === 7 &&
      style.usesPlagalTerminology &&
      lexicon.graveWord != null
    ) {
      marker = text(lexicon.graveWord);
    } else if (isPlagalMode && marksPlagalModes) {
      if (lexicon.plagalAbbreviationInText) {
        marker = plagalAbbreviation();
      } else if (lexicon.plagalWord != null) {
        const beforeNumeral =
          markerPosition === 'beforeNumeral' ||
          (markerPosition === 'phraseStart' && trailingLabel);
        marker = text(
          beforeNumeral
            ? (lexicon.plagalWordBeforeNumeral ?? lexicon.plagalWord)
            : lexicon.plagalWord,
        );
      }
    }

    switch (markerPosition) {
      case 'beforeNumeral':
        ordered = trailingLabel
          ? [marker, numeral, label]
          : [label, marker, numeral];
        break;
      case 'afterNumeral':
        ordered = trailingLabel
          ? [numeral, marker, label]
          : [label, numeral, marker];
        break;
      default:
        ordered = trailingLabel
          ? [marker, numeral, label]
          : [marker, label, numeral];
    }

    if (
      method === INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign
    ) {
      const abbreviation =
        isPlagalMode &&
        !(
          marker?.kind === 'text' &&
          lexicon.omitsPlagalAbbreviationAfterPlagalWord
        )
          ? plagalAbbreviation()
          : null;
      const group = signBeforeAbbreviation
        ? [modeSign, abbreviation]
        : [abbreviation, modeSign];
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
  if (
    lexicon.usesTerminalPeriod &&
    method !== INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    const lastText = components
      .filter(
        (
          component,
        ): component is Extract<InitialMartyriaComponent, { kind: 'text' }> =>
          component.kind === 'text',
      )
      .at(-1);
    if (lastText != null) {
      lastText.content += '.';
    }
  }
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

function builtIn(options: {
  id: BuiltInInitialMartyriaStyleId;
  languageId: InitialMartyriaLanguageId;
  numeralKind: InitialMartyriaNumeralKind;
  numeralStyle: InitialMartyriaNumeralStyle;
  numeralQualifier?: InitialMartyriaNumeralQualifier;
  usesPlagalTerminology: boolean;
  modeIdentificationMethod: InitialMartyriaModeIdentificationMethod;
  plagalAbbreviationPlacement?: InitialMartyriaStyle['plagalAbbreviationPlacement'];
  defaultAppearance: InitialMartyriaDefaultAppearance;
  transliteratedNoteNames?: InitialMartyriaNoteNames;
  flowDirection?: InitialMartyriaStyle['flowDirection'];
}): InitialMartyriaStyle {
  const {
    plagalAbbreviationPlacement = 'beforeModeSign',
    transliteratedNoteNames = transliteratedGreekNoteNames,
    flowDirection = 'page',
    ...styleOptions
  } = options;
  return {
    ...styleOptions,
    plagalAbbreviationPlacement,
    flowDirection,
    originalNoteNames: originalGreekNoteNames,
    transliteratedNoteNames,
  };
}

export const traditionalGreekInitialMartyriaStyle = builtIn({
  id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
  languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
  numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
  numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
  usesPlagalTerminology: true,
  modeIdentificationMethod:
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  defaultAppearance: defaultAppearance('GFS Didot'),
});

/*
 * Nea Mousiki Kypseli, Bambas edition (1898)
 */
export const greekModeNamesInitialMartyriaStyle = builtIn({
  id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekModeNamesV1,
  languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
  numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
  numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
  usesPlagalTerminology: true,
  modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  defaultAppearance: defaultAppearance('GFS Didot'),
});

const sourceSerifAppearance = () => defaultAppearance('Source Serif');

// Curated styles are developer-owned. A new option needs an ID and localized
// name selector above, then one entry here describing its semantics; the
// displayed components are derived from those semantics and the language
// lexicon by getInitialMartyriaComponents.
export const builtInInitialMartyriaStyles: InitialMartyriaStyle[] = [
  traditionalGreekInitialMartyriaStyle,
  greekModeNamesInitialMartyriaStyle,
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalFirstV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    usesPlagalTerminology: true,
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
    usesPlagalTerminology: true,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    usesPlagalTerminology: true,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    plagalAbbreviationPlacement: 'afterModeSign',
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeBeforeSignV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    usesPlagalTerminology: true,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    plagalAbbreviationPlacement: 'beforeLabel',
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumberWordV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    usesPlagalTerminology: false,
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
    usesPlagalTerminology: true,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    usesPlagalTerminology: true,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    usesPlagalTerminology: true,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalNumberWordV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    usesPlagalTerminology: true,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
    transliteratedNoteNames: spanishTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
    transliteratedNoteNames: spanishTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinalNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
    transliteratedNoteNames: spanishTransliteratedNoteNames,
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
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
    transliteratedNoteNames: spanishTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishOrdinalTonoV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
    transliteratedNoteNames: spanishTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: defaultAppearance('Old Standard'),
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: defaultAppearance('Old Standard'),
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: defaultAppearance('Old Standard'),
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinalTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    usesPlagalTerminology: false,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: defaultAppearance('Old Standard'),
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
    transliteratedNoteNames: russianTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
    transliteratedNoteNames: russianTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalTextV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    usesPlagalTerminology: false,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    defaultAppearance: sourceSerifAppearance(),
    transliteratedNoteNames: russianTransliteratedNoteNames,
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: defaultAppearance('Noto Naskh Arabic', 'GFS Didot'),
    transliteratedNoteNames: arabicTransliteratedNoteNames,
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
    usesPlagalTerminology: false,
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
    usesPlagalTerminology: false,
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
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    defaultAppearance: sourceSerifAppearance(),
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasOrdinalRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    usesPlagalTerminology: false,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
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
    usesPlagalTerminology: true,
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
  return (
    languageId === INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic ||
    languageId === INITIAL_MARTYRIA_LANGUAGE_IDS.Russian
  );
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

export function isBuiltInInitialMartyriaStyleId(
  id: string,
): id is BuiltInInitialMartyriaStyleId {
  return Object.values(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS).includes(
    id as BuiltInInitialMartyriaStyleId,
  );
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
  return builtInInitialMartyriaStyles.find((style) => style.id === id) ?? null;
}

function resolveAppearance(
  style: InitialMartyriaStyle,
  configuration: InitialMartyriaConfiguration,
  fontRole: 'main' | 'greek',
): InitialMartyriaAppearance {
  const defaults = style.defaultAppearance;
  const overrides = configuration.appearanceOverrides;
  const fontFamily =
    fontRole === 'main' ||
    style.languageId === INITIAL_MARTYRIA_LANGUAGE_IDS.Greek
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

export function resolveInitialMartyriaBaseTextAppearance(
  resolved: ResolvedInitialMartyriaConfiguration,
) {
  return resolved.mainAppearance;
}

export function resolveInitialMartyriaStyle(options: {
  context: InitialMartyriaContext;
  resolvedConfiguration: ResolvedInitialMartyriaConfiguration;
  pageSetup: Pick<PageSetup, 'direction'>;
}): InitialMartyriaStyleResolution {
  const { style, configuration, mainAppearance, greekAppearance } =
    options.resolvedConfiguration;
  const language = initialMartyriaLanguages.find(
    (item) => item.id === style.languageId,
  )!;
  const flowDirection =
    style.flowDirection === 'page'
      ? options.pageSetup.direction
      : style.flowDirection;
  const noteNames = configuration.transliterateNoteNames
    ? style.transliteratedNoteNames
    : style.originalNoteNames;
  const noteAppearance = configuration.transliterateNoteNames
    ? mainAppearance
    : greekAppearance;
  const glyphAppearance: InitialMartyriaAppearance = {
    color: mainAppearance.color,
    strokeWidth: mainAppearance.strokeWidth,
    strokeColor: mainAppearance.strokeColor,
  };

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
        appearance: fontRole === 'greek' ? greekAppearance : mainAppearance,
        fontRole,
        direction: fontRole === 'greek' ? 'ltr' : language.direction,
        languageTag: fontRole === 'greek' ? 'el' : language.languageTag,
        content:
          component.kind === 'text'
            ? { layout: 'inline', text: component.content }
            : {
                layout: 'stacked',
                lines: [component.top, component.bottom],
                gap: 0,
              },
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
    runs,
  };
}

export function isInitialMartyriaStartingNoteRun(
  run: ResolvedInitialMartyriaRun,
): run is InitialMartyriaStartingNoteRun {
  return run.kind === 'startingPitch';
}

export type InitialMartyriaSeparator =
  'none' | 'wordSpace' | 'modeSign' | 'plagal' | 'startingNote';

export function getInitialMartyriaFixedSeparatorWidth(
  separator: InitialMartyriaSeparator,
) {
  switch (separator) {
    case 'modeSign':
    case 'plagal':
    case 'startingNote':
      return 0.43;
    default:
      return null;
  }
}

export function getInitialMartyriaFixedSeparatorSize(
  separator: InitialMartyriaSeparator,
  mainTextFontSize: number,
) {
  const width = getInitialMartyriaFixedSeparatorWidth(separator);
  return width == null ? null : width * mainTextFontSize;
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
  const isPlagal = (run: ResolvedInitialMartyriaRun) =>
    run.kind === 'text' && run.content.layout === 'stacked';
  if (isInitialMartyriaStartingNoteRun(after)) {
    return 'startingNote';
  }
  if (isInitialMartyriaStartingNoteRun(before) && after.kind === 'text') {
    return 'startingNote';
  }
  if (isModeSign(before) || isModeSign(after)) {
    return 'modeSign';
  }
  if (isPlagal(before) || isPlagal(after)) {
    return 'plagal';
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
  if (runs[index].kind !== 'text' || runs[index].content.layout !== 'stacked') {
    return 'none';
  }
  return 'plagal';
}

export function isModeKeyMode(value: number): value is ModeKeyMode {
  return Number.isInteger(value) && value >= 1 && value <= 8;
}

export function isInitialMartyriaCanonicalNote(
  value: ModeSign | null,
): value is InitialMartyriaCanonicalNote {
  return initialMartyriaCanonicalNotes.includes(
    value as InitialMartyriaCanonicalNote,
  );
}
