import type { Namespace, SelectorParam, TFunction } from 'i18next';

import type { ModeKeyElement } from '@/models/Element';
import type { Fthora, Neume } from '@/models/Neumes';
import { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { getScaleNoteValue, ScaleNote } from '@/models/Scales';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import type { FontVariantProperty } from '@/utils/fontVariants';
import { FONT_VARIANT_PROPERTIES } from '@/utils/fontVariants';
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

export type InitialMartyriaFlowDirection = 'page' | 'ltr' | 'rtl';

export const BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS = {
  GreekTraditionalSign: 'builtin:traditional-greek-v1',
  GreekAlphabeticNumerals: 'builtin:greek-mode-names-v1',
  EnglishTraditionalSign: 'builtin:english-plagal-first-v1',
  EnglishModeNames: 'builtin:english-mode-names-v1',
  EnglishModeNamesWithSign: 'builtin:english-full-name-v1',
  EnglishModeNumbersWithSign: 'builtin:english-mode-number-v1',
  EnglishPlagalClassWithSign: 'builtin:english-plagal-class-ordinal-words-v1',
  SpanishTonoNumber: 'builtin:spanish-tono-number-v1',
  SpanishTonoRomanNumeral: 'builtin:spanish-tono-roman-numeral-v1',
  SpanishTonoOrdinalNumber: 'builtin:spanish-tono-ordinal-number-v1',
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
  RomanianGlasNumber: 'builtin:romanian-glas-number-v1',
  RomanianGlasRomanNumeral: 'builtin:romanian-glas-roman-numeral-v1',
  RomanianTraditionalSign: 'builtin:romanian-glas-v1',
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
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinalNumber]: styleName(
    'spanishTonoOrdinalNumber',
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
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumber]:
    styleName('romanianGlasNumber'),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasRomanNumeral]: styleName(
    'romanianGlasRomanNumeral',
  ),
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianTraditionalSign]: styleName(
    'romanianTraditionalSign',
  ),
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

export type InitialMartyriaComponent =
  | {
      kind: 'text';
      semantic: InitialMartyriaTextSemantic;
      content: string;
      fontRole?: 'main' | 'greek';
    }
  | {
      kind: 'stackedText';
      semantic: InitialMartyriaTextSemantic;
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

/** The typography a style applies to its text and glyphs. */
export interface InitialMartyriaStyleAppearance extends Record<
  FontVariantProperty,
  string | null
> {
  mainFontFamily: string;
  greekFontFamily: string;
  fontStyle: string;
  fontSize: number;
  color: string;
  strokeWidth: number;
}

/** The number form printed by text identification or read from a mode sign. */
export interface InitialMartyriaModeNameSemantics {
  numeralKind: InitialMartyriaNumeralKind;
  numeralStyle: InitialMartyriaNumeralStyle;
  numeralQualifier: InitialMartyriaNumeralQualifier;
  modeNamingScheme: InitialMartyriaModeNamingScheme;
}

/**
 * How an initial martyria is written: one point in the space of structures
 * the app can produce. The displayed components and the spoken reading are
 * derived from these semantics and the language's lexicon, never stored.
 */
export interface InitialMartyriaStructure extends InitialMartyriaModeNameSemantics {
  languageId: InitialMartyriaLanguageId;
  modeIdentificationMethod: InitialMartyriaModeIdentificationMethod;
  /** Only used by languages that are not written in Greek script. */
  transliterateNoteNames: boolean;
  flowDirection: InitialMartyriaFlowDirection;
}

/**
 * A named point in the structure space together with its typography.
 * Built-in styles are curated per language and read-only; the rest are
 * saved with the score.
 */
export interface InitialMartyriaStyle {
  id: string;
  /** Ignored for built-in styles, which are named through the UI locale. */
  displayName: string;
  /** The built-in style a custom style was derived from, if any. */
  basedOn: BuiltInInitialMartyriaStyleId | null;
  structure: InitialMartyriaStructure;
  appearance: InitialMartyriaStyleAppearance;
}

/** Resolved text and glyph styling used by layout and rendering. */
export interface InitialMartyriaAppearance extends Partial<
  Record<FontVariantProperty, string | null>
> {
  fontFamily?: string;
  fontStyle?: string;
  fontSize?: number;
  color?: string;
  strokeWidth?: number;
  strokeColor?: string;
}

export interface ResolvedInitialMartyriaStyle {
  style: InitialMartyriaStyle;
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
  physicalNote: ScaleNote;
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
    }
  | {
      kind: 'text';
      semantic: InitialMartyriaTextSemantic;
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
  structure: InitialMartyriaStructure;
  runs: ResolvedInitialMartyriaRun[];
  flowDirection: 'ltr' | 'rtl';
  /** The complete reading selected by the style's identification method. */
  pronunciation: string;
}

export type InitialMartyriaStyleSelection =
  { kind: 'standard' } | ({ kind: 'custom' } & ResolvedInitialMartyriaStyle);

const initialMartyriaCanonicalNotes: InitialMartyriaCanonicalNote[] = [
  ModeSign.Ni,
  ModeSign.Pa,
  ModeSign.Vou,
  ModeSign.Ga,
  ModeSign.Thi,
  ModeSign.Ke,
  ModeSign.Zo,
];

/* The same notes keyed by scale degree: degree 0 is Pa, wrapping to Ni. */
const initialMartyriaCanonicalNotesByScaleDegree: InitialMartyriaCanonicalNote[] =
  [...initialMartyriaCanonicalNotes.slice(1), ModeSign.Ni];

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

type InitialMartyriaPronunciationOverrides = Partial<
  Pick<
    InitialMartyriaLexicon,
    | 'label'
    | 'ordinalWords'
    | 'plagalWord'
    | 'plagalCounterpartWord'
    | 'plagalCounterpartOrdinalWords'
    | 'graveWord'
  >
>;

interface InitialMartyriaGrammarRule {
  modeIdentificationMethods: readonly InitialMartyriaModeIdentificationMethod[];
  numeralKinds: readonly InitialMartyriaNumeralKind[];
  numeralStyles: readonly InitialMartyriaNumeralStyle[];
  numeralQualifiers: readonly InitialMartyriaNumeralQualifier[];
  modeNamingSchemes: readonly InitialMartyriaModeNamingScheme[];
}

const everyModeIdentificationMethod = [
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
] as const;

const textModeIdentificationMethods = [
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
] as const;

const everyModeNamingScheme = [
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
] as const;

const relationalModeNamingSchemes = [
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
] as const;

const everyNumeralQualifier = [
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
] as const;

/*
 * Language-specific script properties, vocabulary, and phrase conventions.
 * Word choice, casing, ordinal formation, and where the plagal word sits in
 * the phrase are language decisions; which words appear at all is described
 * by each style's semantics.
 */
interface InitialMartyriaLexicon {
  /** Supported syntax and attested liturgical conventions for mode names. */
  grammar: readonly InitialMartyriaGrammarRule[];
  /** Reading direction of the language's mode-name phrases. */
  direction: 'ltr' | 'rtl';
  /**
   * The language is written in Greek script, so greek-role text needs no
   * separate font and note names are never transliterated.
   */
  usesGreekScript: boolean;
  /** Note names rendered when a style transliterates them. */
  transliteratedNoteNames: InitialMartyriaNoteNames;
  /** Whether curated styles in this language transliterate note names. */
  transliterateNoteNames: boolean;
  /** Words introducing the physical starting note in a spoken mode name. */
  startingNotePrefix: string;
  /** Spoken forms that differ from the text printed in the score. */
  pronunciationOverrides?: InitialMartyriaPronunciationOverrides;
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
    numeralQualifier: InitialMartyriaNumeralQualifier,
  ) => string;
  /** Standalone plagal word (Plagal, laturas). */
  plagalWord?: string;
  /** Word form that identifies an authentic mode's plagal counterpart. */
  plagalCounterpartWord?: string;
  /** Ordinal forms read after the plagal-counterpart word (Greek genitive). */
  plagalCounterpartOrdinalWords?: Partial<Record<ModeKeyMode, string>>;
  /** Where a plagal-counterpart marker sits inside the mode-name phrase. */
  plagalCounterpartMarkerPosition?: 'phraseStart' | 'beforeNumeral';
  /** Number styles whose text phrases use the stacked Greek abbreviation. */
  plagalAbbreviationNumeralStyles?: readonly InitialMartyriaNumeralStyle[];
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
  'st',
  'nd',
  'rd',
  'th',
  'th',
  'th',
  'th',
  'th',
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
    // Byzantine Greek uses label-first authentic/plagal names. Alphabetic
    // numerals use the abbreviation; word forms use an inflected full name.
    // The Greek Ministry grammar places alphabetic signs beside both cardinal
    // and ordinal words; liturgical headings supply the ordinal reading here.
    // https://lb1.ebooks.edu.gr/ebooks/d/8547/774/21-0058-02_Grammatiki-Neas-Ellinikis-Glossas_A-B-G-Gymnasiou.pdf
    // https://byzantine-music.apostoliki-diakonia.gr/Texts/texts.asp?main=Anastasimatarion.htm
    grammar: [
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: [
          INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
        ],
      },
    ],
    direction: 'ltr',
    usesGreekScript: true,
    transliteratedNoteNames: transliteratedGreekNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'εκ του',
    pronunciationOverrides: {
      label: 'Ήχος',
      ordinalWords: [
        'Πρώτος',
        'Δεύτερος',
        'Τρίτος',
        'Τέταρτος',
        'Πέμπτος',
        'Έκτος',
        'Έβδομος',
        'Όγδοος',
      ],
      plagalWord: 'Πλάγιος',
      plagalCounterpartWord: 'Πλάγιος του',
      plagalCounterpartOrdinalWords: {
        5: 'Πρώτου',
        6: 'Δευτέρου',
        8: 'Τετάρτου',
      },
      graveWord: 'Βαρύς',
    },
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
    plagalCounterpartWord: 'πλάγιος τοῦ',
    plagalCounterpartOrdinalWords: {
      5: 'πρώτου',
      6: 'δευτέρου',
      8: 'τετάρτου',
    },
    plagalCounterpartMarkerPosition: 'beforeNumeral',
    plagalAbbreviationNumeralStyles: [
      INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    ],
    graveWord: 'βαρύς',
    graveWordTitle: 'Βαρύς',
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: {
    // English cardinals follow the noun and ordinals precede it. Roman
    // numerals represent the conventional postnominal cardinal construction.
    // A sign by itself encodes authentic/plagal relations, not absolute 1-8.
    // https://dictionary.cambridge.org/grammar/british-grammar/number
    // https://www.govinfo.gov/content/pkg/GPO-STYLEMANUAL-2016/pdf/GPO-STYLEMANUAL-2016-10.pdf
    grammar: [
      {
        modeIdentificationMethods: textModeIdentificationMethods,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: everyModeNamingScheme,
      },
      {
        modeIdentificationMethods: [
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
        ],
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: relationalModeNamingSchemes,
      },
      {
        modeIdentificationMethods: textModeIdentificationMethods,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal],
        modeNamingSchemes: everyModeNamingScheme,
      },
      {
        modeIdentificationMethods: [
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
        ],
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal],
        modeNamingSchemes: relationalModeNamingSchemes,
      },
    ],
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: transliteratedGreekNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'from',
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
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: {
    // Cardinals follow tono; ordinal adjectives can precede or follow it.
    // RAE says Roman numerals are ordinarily read as ordinals, but permits a
    // cardinal reading where both readings fit the construction. Orthodox
    // liturgical sources attest both "Tono I" and explicit "Tono Primero".
    // https://www.rae.es/ortograf%C3%ADa/lectura-de-los-n%C3%BAmeros-romanos
    // https://www.iglesiaortodoxa.cl/_files/ugd/aa7bfd_74510bb681824b4da936ab661d3b80cf.pdf
    // https://www.iglesiaortodoxa.cl/_files/ugd/aa7bfd_565aa2a8788643afbce34f404100332c.pdf
    grammar: [
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [INITIAL_MARTYRIA_NUMERAL_STYLES.Digits],
        numeralQualifiers: everyNumeralQualifier,
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [INITIAL_MARTYRIA_NUMERAL_STYLES.Words],
        numeralQualifiers: everyNumeralQualifier,
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
    ],
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: spanishTransliteratedNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'desde',
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
    formatOrdinal: (base, numeralStyle, numeralQualifier) => {
      if (numeralStyle !== INITIAL_MARTYRIA_NUMERAL_STYLES.Digits) {
        return base;
      }
      return numeralQualifier ===
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal &&
        (base === '1' || base === '3')
        ? `${base}.ᵉʳ`
        : `${base}.º`;
    },
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: {
    // Gamanovich distinguishes quantity from order and lists the same
    // alphabetic numeral glyph beside both cardinal and ordinal word forms.
    // Liturgical context resolves the ambiguity: the 1995 Irmologion pairs
    // alphabetic mode headings with explicit ordinal mode names. Ponomar's
    // Octoechos navigation and a Moscow Patriarchate service book also attest
    // postnominal Arabic digits. Written numbers follow the noun, while an
    // inflected ordinal adjective can stand on either side.
    // https://www.ponomar.net/files/gama2/p061.htm
    // https://www.ponomar.net/files/gama2/p068app.htm
    // https://www.ponomar.net/maktabah/Irmologii1995/01glas.html
    // https://www.ponomar.net/maktabah/Irmologii1995/02glas.html
    // https://www.ponomar.net/maktabah/OctoechosPart1Edinovetsy/index.html
    // https://edinstvo.patriarchia.ru/uploads/Files/2026/Sretenie.pdf
    grammar: [
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [INITIAL_MARTYRIA_NUMERAL_STYLES.Words],
        numeralQualifiers: everyNumeralQualifier,
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
    ],
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
    transliterateNoteNames: true,
    startingNotePrefix: 'ѿ',
    label: 'Гла́съ',
    labelMedial: 'гла́съ',
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
    ordinalWordsPrenominal: [
      'Пе́рвый',
      'Вторы́й',
      'Тре́тїй',
      'Четве́ртый',
      'Пѧ́тый',
      'Шесты́й',
      'Седмы́й',
      'Ѻ҆сьмы́й',
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
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: {
    // General Russian orthography writes an Arabic ordinal with a suffix such
    // as 1-y, and Moscow Patriarchate directions use that form for modes. Its
    // service books also attest the compact rubrical form "Glas 1.". Both are
    // ordinal mode names. Inflected ordinal adjectives can stand on either
    // side of the noun.
    // https://orfo.ruslang.ru/rules/rule/1 (footnote 9)
    // https://patriarchia.ru/bu/2026-06-14
    // https://edinstvo.patriarchia.ru/uploads/Files/2026/Sretenie.pdf
    grammar: [
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [INITIAL_MARTYRIA_NUMERAL_STYLES.Words],
        numeralQualifiers: everyNumeralQualifier,
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
    ],
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: russianTransliteratedNoteNames,
    transliterateNoteNames: true,
    startingNotePrefix: 'от',
    label: 'Глас',
    labelMedial: 'глас',
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
    ordinalWordsPrenominal: [
      'Первый',
      'Второй',
      'Третий',
      'Четвёртый',
      'Пятый',
      'Шестой',
      'Седьмой',
      'Восьмой',
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
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: {
    // Arabic ordinals are adjectives: they follow the noun and agree with its
    // definiteness and gender. Antiochian Orthodox sources attest both the
    // word form (اللحن الأول) and a postnominal digit form (اللحن 1).
    // https://www.arabicacademy.gov.eg/ar/محرك-البحث/معجم/dic-19/نعت-معنى
    // https://antiochpatriarchate.org/ar/page/1662/
    // https://www.antiochpatriarchate.org/ar/page/909/
    grammar: [
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
    ],
    direction: 'rtl',
    usesGreekScript: false,
    transliteratedNoteNames: arabicTransliteratedNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'من',
    label: 'اللحن',
    ordinalWords: [
      'الأول',
      'الثاني',
      'الثالث',
      'الرابع',
      'الخامس',
      'السادس',
      'السابع',
      'الثامن',
    ],
    usesTerminalPeriod: false,
    modeSignGroupTrailing: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: {
    // Cardinals follow glas. Ordinals 2-8 use the al ... -lea construction;
    // first is the exceptional primul/intai, not *al unu-lea. DOOM3 attests
    // al II-lea/al 2-lea and cardinal identifiers such as pagina unu. Church
    // sources attest Glasul intai and Glasul al II-lea. The laturas vocabulary
    // is modeled only for its sign.
    // https://doom.lingv.ro/cautare/q/al%20doilea
    // https://doom.lingv.ro/cautare/q/%27i/?orderBy=%27i
    // https://arhiepiscopiabucurestilor.ro/stiri/evenimente-bisericesti/cantarile-sfintei-liturghii-glasurile-i-si-al-vii-lea
    grammar: [
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
      {
        modeIdentificationMethods: everyModeIdentificationMethod,
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
        numeralQualifiers: everyNumeralQualifier,
        modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
      },
      {
        modeIdentificationMethods: [
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
        ],
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralStyles: [INITIAL_MARTYRIA_NUMERAL_STYLES.Words],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: [
          INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
        ],
      },
    ],
    direction: 'ltr',
    usesGreekScript: false,
    transliteratedNoteNames: transliteratedGreekNoteNames,
    transliterateNoteNames: false,
    startingNotePrefix: 'de la',
    label: 'Glas',
    labelMedial: 'glas',
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
    ordinalWordsPrenominal: [
      'Primul',
      'Al doilea',
      'Al treilea',
      'Al patrulea',
      'Al cincilea',
      'Al șaselea',
      'Al șaptelea',
      'Al optulea',
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
    formatOrdinal: (base, _numeralStyle, numeralQualifier) => {
      if (base === '1' || base === 'I') {
        return numeralQualifier ===
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
          ? 'Primul'
          : 'întâi';
      }
      return `${
        numeralQualifier === INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
          ? 'Al'
          : 'al'
      } ${base}-lea`;
    },
    plagalWord: 'lăturaș',
    plagalCounterpartMarkerPosition: 'beforeNumeral',
    usesTerminalPeriod: true,
    modeSignGroupTrailing: false,
  },
};

/* Lexicons with the spoken forms folded in, for the pronunciation functions. */
const initialMartyriaSpokenLexicons = Object.fromEntries(
  initialMartyriaLanguageIds.map((languageId) => [
    languageId,
    {
      ...initialMartyriaLexicons[languageId],
      ...initialMartyriaLexicons[languageId].pronunciationOverrides,
    },
  ]),
) as Record<InitialMartyriaLanguageId, InitialMartyriaLexicon>;

/** The authentic mode each plagal mode is numbered after. */
const authenticModeNumbers: Partial<Record<ModeKeyMode, number>> = {
  5: 1,
  6: 2,
  8: 4,
};

function isPlagalMode(mode: ModeKeyMode) {
  return authenticModeNumbers[mode] != null;
}

/** Whether the naming scheme marks plagal modes instead of numbering them. */
function usesPlagalNaming(
  semantics: Pick<InitialMartyriaModeNameSemantics, 'modeNamingScheme'>,
) {
  return (
    semantics.modeNamingScheme !== INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute
  );
}

/** Under plagal terminology the grave mode is named, not numbered. */
function usesGraveNaming(
  semantics: Pick<InitialMartyriaModeNameSemantics, 'modeNamingScheme'>,
  mode: ModeKeyMode,
) {
  return mode === 7 && usesPlagalNaming(semantics);
}

/** The word marking a plagal mode under the style's naming scheme. */
function getPlagalMarkerWord(
  semantics: Pick<InitialMartyriaModeNameSemantics, 'modeNamingScheme'>,
  lexicon: InitialMartyriaLexicon,
) {
  return semantics.modeNamingScheme ===
    INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart
    ? (lexicon.plagalCounterpartWord ?? lexicon.plagalWord)
    : lexicon.plagalWord;
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
    const counterpartOrdinal =
      semantics.modeNamingScheme ===
      INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart
        ? lexicon.plagalCounterpartOrdinalWords?.[mode]
        : undefined;
    if (counterpartOrdinal != null) {
      return counterpartOrdinal;
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
    ? lexicon.formatOrdinal(
        base,
        semantics.numeralStyle,
        semantics.numeralQualifier,
      )
    : base;
}

/*
 * The spoken numeral is always a word; the counterpart form (Greek genitive)
 * wins where the language has one.
 */
function getInitialMartyriaNumeralPronunciation(
  semantics: InitialMartyriaModeNameSemantics,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  const counterpartOrdinal =
    semantics.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal &&
    semantics.modeNamingScheme ===
      INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart
      ? lexicon.plagalCounterpartOrdinalWords?.[mode]
      : undefined;
  return (
    counterpartOrdinal ??
    getInitialMartyriaNumeralText(
      { ...semantics, numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words },
      lexicon,
      mode,
    )
  );
}

function getInitialMartyriaLabelText(
  lexicon: InitialMartyriaLexicon,
  trailingLabel: boolean,
  withOrdinal: boolean,
) {
  if (lexicon.label == null) {
    return null;
  }
  if (trailingLabel) {
    return lexicon.labelMedial ?? lexicon.label;
  }
  if (lexicon.labelWithOrdinal != null && withOrdinal) {
    return lexicon.labelWithOrdinal;
  }
  return lexicon.label;
}

function usesPlagalAbbreviationInText(
  semantics: Pick<InitialMartyriaModeNameSemantics, 'numeralStyle'>,
  lexicon: InitialMartyriaLexicon,
) {
  return (
    lexicon.plagalAbbreviationNumeralStyles?.includes(
      semantics.numeralStyle,
    ) === true
  );
}

/** A prenominal mode name puts the mode word after the numeral. */
function usesTrailingLabel(
  semantics: Pick<InitialMartyriaModeNameSemantics, 'numeralQualifier'>,
) {
  return (
    semantics.numeralQualifier ===
    INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
  );
}

function text(
  semantic: InitialMartyriaTextSemantic,
  content: string,
): InitialMartyriaComponent {
  return { kind: 'text', semantic, content };
}

function plagalAbbreviation(): InitialMartyriaComponent {
  return {
    kind: 'stackedText',
    semantic: 'plagalAbbreviation',
    top: 'λ',
    bottom: 'π',
    fontRole: 'greek',
  };
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
  structure: InitialMartyriaStructure,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  const usesGraveWord =
    usesGraveNaming(structure, mode) && lexicon.graveWord != null;
  const numeralSemantics =
    usesGraveNaming(structure, mode) && !usesGraveWord
      ? {
          ...structure,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        }
      : structure;
  const identifier = usesGraveWord
    ? null
    : getInitialMartyriaNumeralPronunciation(numeralSemantics, lexicon, mode);
  const marker = usesGraveWord
    ? lexicon.graveWord
    : isPlagalMode(mode) && usesPlagalNaming(structure)
      ? getPlagalMarkerWord(structure, lexicon)
      : null;
  const trailingLabel = usesTrailingLabel(structure);
  const label = getInitialMartyriaLabelText(
    lexicon,
    trailingLabel,
    structure.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
  );

  return orderInitialMartyriaModeName(
    structure,
    lexicon,
    identifier,
    marker,
    label,
  )
    .filter((component): component is string => component != null)
    .join(' ');
}

const keLowNoteValue = getScaleNoteValue(ScaleNote.KeLow);
const zoHighNoteValue = getScaleNoteValue(ScaleNote.ZoHigh);

function getInitialMartyriaStartingNotePronunciation(
  lexicon: InitialMartyriaLexicon,
  physicalNote: ScaleNote,
) {
  const noteNames = lexicon.usesGreekScript
    ? originalGreekNoteNames
    : lexicon.transliteratedNoteNames;
  const physicalNoteValue = getScaleNoteValue(physicalNote);
  const canonicalNote =
    initialMartyriaCanonicalNotesByScaleDegree[
      ((physicalNoteValue % 7) + 7) % 7
    ];
  let noteName = noteNames.names[canonicalNote];

  if (physicalNoteValue <= keLowNoteValue) {
    noteName = noteName.toLocaleLowerCase(noteNames.languageTag);
  } else if (physicalNoteValue >= zoHighNoteValue) {
    noteName += "'";
  }

  return `${lexicon.startingNotePrefix} ${noteName}`;
}

/*
 * The conventional reading of the traditional sign group when it repeats a
 * text identification: the sign beside "Mode 5" is still read as "Plagal
 * First", so its plagal indicator keeps the traditional placement.
 */
const traditionalModeSignPronunciation: InitialMartyriaModeNameSemantics = {
  numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
  numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
  numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
  modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
};

/**
 * Derives the displayed components for one mode from the style's semantics
 * and its language's lexicon. The mode name is a phrase built from the
 * label, the numeral, and a plagal or grave marker; sign-identified styles
 * use the traditional sign group in place of the numeral. flowDirection is
 * the resolved rendering direction (a 'page' flow resolves against the page
 * setup).
 */
function getInitialMartyriaComponents(
  structure: InitialMartyriaStructure,
  mode: ModeKeyMode,
  flowDirection: 'ltr' | 'rtl' = structure.flowDirection === 'rtl'
    ? 'rtl'
    : 'ltr',
): InitialMartyriaComponent[] {
  const lexicon = initialMartyriaLexicons[structure.languageId];
  const plagal = isPlagalMode(mode);
  const modeSign: InitialMartyriaComponent = { kind: 'modeSign' };
  const startingPitch: InitialMartyriaComponent = {
    kind: 'startingNoteCluster',
  };
  const makeLabel = (withOrdinal: boolean) => {
    const labelText = getInitialMartyriaLabelText(
      lexicon,
      usesTrailingLabel(structure),
      withOrdinal,
    );
    return labelText == null ? null : text('label', labelText);
  };

  let ordered: (InitialMartyriaComponent | null)[];
  if (
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    const label = makeLabel(false);
    // Treat the sign as the numeral when ordering the mode name: "plagal first
    // mode", "first plagal mode", and "plagal mode one" place the same sign
    // differently.
    // The sign group identifies the mode: the stacked plagal abbreviation
    // (or the grave title, where the language spells one out) plus the sign.
    const graveTitle = usesGraveNaming(structure, mode)
      ? lexicon.graveWordTitle
      : null;
    const marker = plagal
      ? plagalAbbreviation()
      : graveTitle != null
        ? text('graveWord', graveTitle)
        : null;
    const orderingSemantics =
      mode === 7 && graveTitle == null && lexicon.graveWord != null
        ? {
            ...structure,
            numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
          }
        : structure;
    ordered = orderInitialMartyriaModeName(
      orderingSemantics,
      lexicon,
      modeSign,
      marker,
      label,
    );
    ordered.push(startingPitch);
  } else {
    const label = makeLabel(
      structure.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    );
    // The text phrase identifies the mode.
    const numeralText = getInitialMartyriaNumeralText(structure, lexicon, mode);
    const numeral = numeralText == null ? null : text('numeral', numeralText);

    let marker: InitialMartyriaComponent | null = null;
    if (usesGraveNaming(structure, mode) && lexicon.graveWord != null) {
      marker = text('graveWord', lexicon.graveWord);
    } else if (plagal && usesPlagalNaming(structure)) {
      if (usesPlagalAbbreviationInText(structure, lexicon)) {
        marker = plagalAbbreviation();
      } else {
        const plagalMarkerWord = getPlagalMarkerWord(structure, lexicon);
        if (plagalMarkerWord != null) {
          marker = text('plagalWord', plagalMarkerWord);
        }
      }
    }

    ordered = orderInitialMartyriaModeName(
      structure,
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
      structure.modeIdentificationMethod ===
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign
    ) {
      // The traditional sign group repeats the text identification, but keeps
      // its own conventional reading rather than inheriting the text's number
      // form. For example, the sign beside "Mode 5" is still read as
      // "Plagal First".
      const indicator = plagal ? plagalAbbreviation() : null;
      const group = orderInitialMartyriaModeName(
        traditionalModeSignPronunciation,
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

export function initialMartyriaStructureHasGreekText(
  structure: InitialMartyriaStructure,
) {
  return modeKeyModes.some((mode) =>
    getInitialMartyriaComponents(structure, mode).some(
      (component) =>
        component.kind !== 'modeSign' &&
        component.kind !== 'startingNoteCluster' &&
        component.fontRole === 'greek',
    ),
  );
}

/** Default fonts for the curated styles of each language. */
const initialMartyriaDefaultFonts: Record<
  InitialMartyriaLanguageId,
  { main: string; greek?: string }
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: { main: 'GFS Didot' },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: { main: 'Source Serif' },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: { main: 'Source Serif' },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: { main: 'Old Standard' },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: { main: 'Source Serif' },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: {
    main: 'Noto Naskh Arabic',
    greek: 'GFS Didot',
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: { main: 'Source Serif' },
};

export function createDefaultInitialMartyriaAppearance(
  languageId: InitialMartyriaLanguageId,
): InitialMartyriaStyleAppearance {
  const fonts = initialMartyriaDefaultFonts[languageId];
  return {
    mainFontFamily: fonts.main,
    greekFontFamily: fonts.greek ?? fonts.main,
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

type BuiltInInitialMartyriaStyleDefinition = Omit<
  InitialMartyriaStructure,
  'transliterateNoteNames' | 'flowDirection'
> &
  Partial<
    Pick<InitialMartyriaStructure, 'transliterateNoteNames' | 'flowDirection'>
  > & {
    id: BuiltInInitialMartyriaStyleId;
    appearance?: Partial<InitialMartyriaStyleAppearance>;
  };

function builtIn({
  id,
  appearance,
  ...structure
}: BuiltInInitialMartyriaStyleDefinition): InitialMartyriaStyle {
  return {
    id,
    displayName: '',
    basedOn: null,
    structure: {
      transliterateNoteNames:
        initialMartyriaLexicons[structure.languageId].transliterateNoteNames,
      flowDirection: 'page',
      ...structure,
    },
    appearance: {
      ...createDefaultInitialMartyriaAppearance(structure.languageId),
      ...appearance,
    },
  };
}

// Curated styles are developer-owned: a few attested points per language in
// the space of structures. A new one needs an ID and localized name selector
// above, then one entry here describing its semantics. Every other point in
// the space is reachable through the styles dialog, where users save their
// own styles.
export const builtInInitialMartyriaStyles: InitialMartyriaStyle[] = [
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekTraditionalSign,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
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
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
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
    appearance: { fontVariantNumeric: 'ordinal' },
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
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinalNumber,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
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
    flowDirection: 'rtl',
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
   * Attested in 1990s editions of Archdeacon Sebastian Barbu-Bucur, e.g.
   * Dimitrie Suceveanu, Idiomelarul, ed. Sebastian Barbu-Bucur (București: Editura Muzicală, 1996),
   *
   * Also attested in 20th century Uniformizat interlinear Western-Byzantine notation editions.
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasRomanNumeral,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
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
   * These typically udo not translate the note name.
   * They may use either 'Glas' or 'Ehul'.
   */
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianTraditionalSign,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    modeIdentificationMethod:
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  }),
];

const builtInInitialMartyriaStylesById = new Map<string, InitialMartyriaStyle>(
  builtInInitialMartyriaStyles.map((style) => [style.id, style]),
);

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

/** The first curated style of a language seeds new styles in that language. */
export function getDefaultBuiltInInitialMartyriaStyle(
  languageId: InitialMartyriaLanguageId,
) {
  return builtInInitialMartyriaStyles.find(
    (style) => style.structure.languageId === languageId,
  )!;
}

/** Every style available to a score: the built-in styles, then its own. */
export function getInitialMartyriaStyles(customStyles: InitialMartyriaStyle[]) {
  return [...builtInInitialMartyriaStyles, ...customStyles];
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

export function getBuiltInInitialMartyriaStyleNameSelector(
  styleId: BuiltInInitialMartyriaStyleId,
) {
  return BUILT_IN_INITIAL_MARTYRIA_STYLE_NAME_SELECTORS[styleId];
}

export function getInitialMartyriaStyleDisplayName(
  style: InitialMartyriaStyle,
  t: TFunction<Namespace>,
) {
  return isBuiltInInitialMartyriaStyleId(style.id)
    ? t(getBuiltInInitialMartyriaStyleNameSelector(style.id), { ns: 'dialog' })
    : style.displayName;
}

export function cloneInitialMartyriaStyle(
  style: InitialMartyriaStyle,
): InitialMartyriaStyle {
  return {
    ...style,
    structure: { ...style.structure },
    appearance: { ...style.appearance },
  };
}

export function createInitialMartyriaStyle(
  options: Omit<InitialMartyriaStyle, 'id'>,
): InitialMartyriaStyle {
  return cloneInitialMartyriaStyle({
    ...options,
    id: crypto.randomUUID(),
    structure: normalizeInitialMartyriaStructure(options.structure),
  });
}

export function usesGreekScript(languageId: InitialMartyriaLanguageId) {
  return initialMartyriaLexicons[languageId].usesGreekScript;
}

/*
 * The structure space. Each axis lists its candidate values in the order the
 * UI presents them; simpler values come first so that a de-duplicated set
 * keeps the least surprising representative.
 */

export interface InitialMartyriaNumeralForm {
  numeralKind: InitialMartyriaNumeralKind;
  numeralStyle: InitialMartyriaNumeralStyle;
}

export const initialMartyriaNumeralForms: InitialMartyriaNumeralForm[] = [
  INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
  INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
  INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
  INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
].flatMap((numeralStyle) =>
  [
    INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
  ].map((numeralKind) => ({ numeralKind, numeralStyle })),
);

export const initialMartyriaModeIdentificationMethods: InitialMartyriaModeIdentificationMethod[] =
  [...everyModeIdentificationMethod];

export const initialMartyriaNumeralQualifiers: InitialMartyriaNumeralQualifier[] =
  [...everyNumeralQualifier];

export const initialMartyriaModeNamingSchemes: InitialMartyriaModeNamingScheme[] =
  [...everyModeNamingScheme];

function supportsNumeralForm(
  lexicon: InitialMartyriaLexicon,
  form: InitialMartyriaNumeralForm,
) {
  // The spoken numeral is always a word, whatever is printed.
  const words =
    form.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal
      ? lexicon.cardinalWords
      : lexicon.ordinalWords;
  if (words == null) {
    return false;
  }
  switch (form.numeralStyle) {
    case INITIAL_MARTYRIA_NUMERAL_STYLES.Words:
      return true;
    case INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals:
      return lexicon.alphabeticNumerals != null;
    default:
      // A bare number is only a mode name next to the word for "mode".
      return lexicon.label != null;
  }
}

function grammarRuleMatches(
  rule: InitialMartyriaGrammarRule,
  structure: InitialMartyriaStructure,
) {
  return (
    rule.modeIdentificationMethods.includes(
      structure.modeIdentificationMethod,
    ) &&
    rule.numeralKinds.includes(structure.numeralKind) &&
    rule.numeralStyles.includes(structure.numeralStyle) &&
    rule.numeralQualifiers.includes(structure.numeralQualifier) &&
    rule.modeNamingSchemes.includes(structure.modeNamingScheme)
  );
}

/**
 * Whether the language's lexicon can express a structure. Axes that do not
 * take part in the structure (the transliteration of Greek-script languages)
 * are never a reason to reject.
 */
export function isInitialMartyriaStructureSupported(
  structure: InitialMartyriaStructure,
) {
  const lexicon = initialMartyriaLexicons[structure.languageId];
  if (
    !supportsNumeralForm(lexicon, structure) ||
    !lexicon.grammar.some((rule) => grammarRuleMatches(rule, structure))
  ) {
    return false;
  }
  const displaysText =
    structure.modeIdentificationMethod !==
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign;
  if (
    displaysText &&
    usesPlagalNaming(structure) &&
    !usesPlagalAbbreviationInText(structure, lexicon) &&
    getPlagalMarkerWord(structure, lexicon) == null
  ) {
    // Without a marker, a plagal mode's text would read as its authentic
    // counterpart.
    return false;
  }
  return true;
}

export function getSupportedInitialMartyriaNumeralForms(
  languageId: InitialMartyriaLanguageId,
) {
  const lexicon = initialMartyriaLexicons[languageId];
  return initialMartyriaNumeralForms.filter(
    (form) =>
      supportsNumeralForm(lexicon, form) &&
      lexicon.grammar.some(
        (rule) =>
          rule.numeralKinds.includes(form.numeralKind) &&
          rule.numeralStyles.includes(form.numeralStyle),
      ),
  );
}

export type InitialMartyriaGrammarAxis =
  'modeIdentificationMethod' | keyof InitialMartyriaModeNameSemantics;

const initialMartyriaGrammarAxes: readonly InitialMartyriaGrammarAxis[] = [
  'modeIdentificationMethod',
  'numeralKind',
  'numeralStyle',
  'numeralQualifier',
  'modeNamingScheme',
];

const defaultNormalizationAxisPriority: readonly InitialMartyriaGrammarAxis[] =
  [
    'modeIdentificationMethod',
    'numeralKind',
    'numeralStyle',
    'numeralQualifier',
    'modeNamingScheme',
  ];

function getInitialMartyriaGrammarStructures(
  structure: InitialMartyriaStructure,
) {
  const lexicon = initialMartyriaLexicons[structure.languageId];
  const candidates: InitialMartyriaStructure[] = [];
  const seen = new Set<string>();
  for (const rule of lexicon.grammar) {
    for (const modeIdentificationMethod of rule.modeIdentificationMethods) {
      for (const numeralKind of rule.numeralKinds) {
        for (const numeralStyle of rule.numeralStyles) {
          for (const numeralQualifier of rule.numeralQualifiers) {
            for (const modeNamingScheme of rule.modeNamingSchemes) {
              const candidate = {
                ...structure,
                modeIdentificationMethod,
                numeralKind,
                numeralStyle,
                numeralQualifier,
                modeNamingScheme,
              };
              const signature = initialMartyriaGrammarAxes
                .map((axis) => candidate[axis])
                .join('/');
              if (
                !seen.has(signature) &&
                isInitialMartyriaStructureSupported(candidate)
              ) {
                seen.add(signature);
                candidates.push(candidate);
              }
            }
          }
        }
      }
    }
  }
  return candidates;
}

function countAxisDifferences(
  a: InitialMartyriaStructure,
  b: InitialMartyriaStructure,
  axes: readonly InitialMartyriaGrammarAxis[],
) {
  return axes.filter((axis) => a[axis] !== b[axis]).length;
}

/**
 * Moves an unsupported structure to the nearest supported one. Callers
 * editing particular axes can give those axes priority so a correlated rule
 * does not undo the requested change.
 */
export function normalizeInitialMartyriaStructure(
  structure: InitialMartyriaStructure,
  preferredAxes: readonly InitialMartyriaGrammarAxis[] = [],
): InitialMartyriaStructure {
  if (isInitialMartyriaStructureSupported(structure)) {
    return structure;
  }
  const candidates = getInitialMartyriaGrammarStructures(structure);
  candidates.sort((a, b) => {
    const preferredDifference =
      countAxisDifferences(a, structure, preferredAxes) -
      countAxisDifferences(b, structure, preferredAxes);
    if (preferredDifference !== 0) {
      return preferredDifference;
    }

    const totalDifference =
      countAxisDifferences(a, structure, initialMartyriaGrammarAxes) -
      countAxisDifferences(b, structure, initialMartyriaGrammarAxes);
    if (totalDifference !== 0) {
      return totalDifference;
    }

    for (const axis of defaultNormalizationAxisPriority) {
      const aDiffers = a[axis] !== structure[axis];
      const bDiffers = b[axis] !== structure[axis];
      if (aDiffers !== bDiffers) {
        return aDiffers ? 1 : -1;
      }
    }
    return 0;
  });
  return candidates[0];
}

function encodeInitialMartyriaComponent(component: InitialMartyriaComponent) {
  switch (component.kind) {
    case 'modeSign':
      return '<modeSign>';
    case 'startingNoteCluster':
      return '<pitch>';
    case 'text':
      return `${component.fontRole ?? 'main'}:${component.content}`;
    case 'stackedText':
      return `${component.fontRole ?? 'main'}:${component.top}/${component.bottom}`;
  }
}

/**
 * Identifies what a structure produces rather than how it is described: the
 * displayed components and the spoken reading of every mode. Two structures
 * with the same key are the same style to a reader, however their axes are
 * set, so the key drives de-duplication throughout the styles dialog.
 */
export function getInitialMartyriaStructureKey(
  structure: InitialMartyriaStructure,
) {
  const lexicon = initialMartyriaLexicons[structure.languageId];
  const spokenLexicon = initialMartyriaSpokenLexicons[structure.languageId];
  const transliterate =
    structure.transliterateNoteNames && !lexicon.usesGreekScript;
  const lines = modeKeyModes.map((mode) => {
    const components = getInitialMartyriaComponents(structure, mode)
      .map(encodeInitialMartyriaComponent)
      .join(' | ');
    const pronunciation = getInitialMartyriaStylePronunciation(
      structure,
      spokenLexicon,
      mode,
    );
    return `${components} = ${pronunciation}`;
  });
  return [
    structure.languageId,
    structure.flowDirection,
    transliterate ? 'transliterated' : 'original',
    ...lines,
  ].join('\n');
}

export function initialMartyriaStructuresEqual(
  a: InitialMartyriaStructure,
  b: InitialMartyriaStructure,
) {
  return (
    getInitialMartyriaStructureKey(a) === getInitialMartyriaStructureKey(b)
  );
}

export function findInitialMartyriaStyleWithStructure(
  styles: InitialMartyriaStyle[],
  structure: InitialMartyriaStructure,
) {
  const key = getInitialMartyriaStructureKey(structure);
  return (
    styles.find(
      (style) => getInitialMartyriaStructureKey(style.structure) === key,
    ) ?? null
  );
}

export interface InitialMartyriaStructureVariation<T> {
  value: T;
  structure: InitialMartyriaStructure;
  key: string;
  current: boolean;
}

/**
 * One variation strip: the current structure with a single axis moved to
 * each of its candidate values. Values the language cannot express and
 * values that change nothing visible are left out, so the strip only ever
 * shows real alternatives.
 */
export function getInitialMartyriaStructureVariations<T>(
  current: InitialMartyriaStructure,
  values: T[],
  apply: (
    structure: InitialMartyriaStructure,
    value: T,
  ) => InitialMartyriaStructure,
): InitialMartyriaStructureVariation<T>[] {
  const currentKey = getInitialMartyriaStructureKey(current);
  const byKey = new Map<string, InitialMartyriaStructureVariation<T>>();
  for (const value of values) {
    const requested = apply(current, value);
    const requestedAxes = initialMartyriaGrammarAxes.filter(
      (axis) => requested[axis] !== current[axis],
    );
    const structure = normalizeInitialMartyriaStructure(
      requested,
      requestedAxes,
    );
    if (
      requestedAxes.some((axis) => structure[axis] !== requested[axis]) ||
      !isInitialMartyriaStructureSupported(structure)
    ) {
      continue;
    }
    const key = getInitialMartyriaStructureKey(structure);
    const existing = byKey.get(key);
    // When several values collapse into the current tile, the tile is
    // captioned with the value the structure actually has.
    if (existing == null) {
      byKey.set(key, { value, structure, key, current: key === currentKey });
    } else if (existing.current && hasSameAxes(structure, current)) {
      existing.value = value;
      existing.structure = structure;
    }
  }
  return [...byKey.values()];
}

function hasSameAxes(a: InitialMartyriaStructure, b: InitialMartyriaStructure) {
  return (Object.keys(a) as (keyof InitialMartyriaStructure)[]).every(
    (axis) => a[axis] === b[axis],
  );
}

/**
 * Every distinct structure a language can produce, de-duplicated by what it
 * renders. The wording axes (number form, placement, plagal wording) span
 * the space; the axes that only add or swap one element (identification
 * method and transliteration) are fixed by the caller. This is the gallery:
 * computed on demand, never stored.
 */
export function enumerateInitialMartyriaStructures(
  base: Pick<
    InitialMartyriaStructure,
    | 'languageId'
    | 'modeIdentificationMethod'
    | 'transliterateNoteNames'
    | 'flowDirection'
  >,
): InitialMartyriaStructureVariation<InitialMartyriaStructure>[] {
  const seen = new Set<string>();
  const structures: InitialMartyriaStructureVariation<InitialMartyriaStructure>[] =
    [];
  for (const form of initialMartyriaNumeralForms) {
    for (const numeralQualifier of initialMartyriaNumeralQualifiers) {
      for (const modeNamingScheme of initialMartyriaModeNamingSchemes) {
        const structure: InitialMartyriaStructure = {
          ...base,
          ...form,
          numeralQualifier,
          modeNamingScheme,
        };
        if (!isInitialMartyriaStructureSupported(structure)) {
          continue;
        }
        const key = getInitialMartyriaStructureKey(structure);
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        structures.push({ value: structure, structure, key, current: false });
      }
    }
  }
  return structures;
}

export function getInitialMartyriaContext(
  element: ModeKeyElement,
): InitialMartyriaContext {
  if (!isModeKeyMode(element.mode)) {
    throw new Error(`Invalid initial martyria mode: ${element.mode}`);
  }
  return {
    mode: element.mode,
    physicalNote: element.scaleNote,
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

function resolveAppearance(
  style: InitialMartyriaStyle,
  fontRole: 'main' | 'greek',
): InitialMartyriaAppearance {
  const appearance = style.appearance;
  const resolved: InitialMartyriaAppearance = {
    fontFamily:
      fontRole === 'main' || usesGreekScript(style.structure.languageId)
        ? appearance.mainFontFamily
        : appearance.greekFontFamily,
    fontStyle: appearance.fontStyle,
    fontSize: appearance.fontSize,
    color: appearance.color,
    strokeWidth: appearance.strokeWidth,
    strokeColor: appearance.color,
  };
  for (const property of FONT_VARIANT_PROPERTIES) {
    resolved[property] = appearance[property] ?? 'normal';
  }
  return resolved;
}

export function resolveInitialMartyriaStyleAppearances(
  style: InitialMartyriaStyle,
): ResolvedInitialMartyriaStyle {
  return {
    style,
    mainAppearance: resolveAppearance(style, 'main'),
    greekAppearance: resolveAppearance(style, 'greek'),
  };
}

/**
 * Which style an element renders with: its own, the score's default, or the
 * Standard glyph-based initial martyria when neither names a style. A
 * reference to a style that no longer exists renders as Standard.
 */
export function resolveInitialMartyriaStyleSelection(options: {
  elementStyleId: string | null | undefined;
  pageStyleId: string | null;
  styles: InitialMartyriaStyle[];
}): InitialMartyriaStyleSelection {
  const styleId =
    options.elementStyleId === undefined
      ? options.pageStyleId
      : options.elementStyleId;
  const style =
    styleId == null ? null : findInitialMartyriaStyle(options.styles, styleId);
  return style == null
    ? { kind: 'standard' }
    : { kind: 'custom', ...resolveInitialMartyriaStyleAppearances(style) };
}

export function resolveInitialMartyriaStyle(options: {
  context: InitialMartyriaContext;
  resolvedStyle: ResolvedInitialMartyriaStyle;
  pageSetup: Pick<PageSetup, 'direction'>;
}): InitialMartyriaStyleResolution {
  const { style, mainAppearance, greekAppearance } = options.resolvedStyle;
  const structure = style.structure;
  const lexicon = initialMartyriaLexicons[structure.languageId];
  const pronunciationLexicon =
    initialMartyriaSpokenLexicons[structure.languageId];
  const flowDirection =
    structure.flowDirection === 'page'
      ? options.pageSetup.direction
      : structure.flowDirection;
  const transliterate =
    structure.transliterateNoteNames && !lexicon.usesGreekScript;
  const noteNames = transliterate
    ? lexicon.transliteratedNoteNames
    : originalGreekNoteNames;
  const noteAppearance = transliterate ? mainAppearance : greekAppearance;
  const glyphAppearance: InitialMartyriaAppearance = {
    color: mainAppearance.color,
    strokeWidth: mainAppearance.strokeWidth,
    strokeColor: mainAppearance.strokeColor,
  };
  const pronunciation = getInitialMartyriaStylePronunciation(
    structure,
    pronunciationLexicon,
    options.context.mode,
  );
  const startingNotePronunciation = getInitialMartyriaStartingNotePronunciation(
    lexicon,
    options.context.physicalNote,
  );

  const runs: ResolvedInitialMartyriaRun[] = [];
  for (const component of getInitialMartyriaComponents(
    structure,
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
        languageTag: fontRole === 'greek' ? 'el' : structure.languageId,
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
    structure,
    flowDirection,
    pronunciation: `${pronunciation} ${startingNotePronunciation}`,
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

function isModeSignRun(run: ResolvedInitialMartyriaRun) {
  return run.kind === 'glyph' && run.semantic === 'modeSign';
}

function isPlagalAbbreviationRun(run: ResolvedInitialMartyriaRun) {
  return run.kind === 'text' && run.semantic === 'plagalAbbreviation';
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
  if (isInitialMartyriaStartingNoteRun(after)) {
    return 'startingNote';
  }
  if (isInitialMartyriaStartingNoteRun(before) && after.kind === 'text') {
    return 'startingNote';
  }
  if (isModeSignRun(before) || isModeSignRun(after)) {
    return 'modeSign';
  }
  if (isPlagalAbbreviationRun(before) || isPlagalAbbreviationRun(after)) {
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
  return isPlagalAbbreviationRun(runs[index]) ? 'plagalAbbreviation' : 'none';
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
