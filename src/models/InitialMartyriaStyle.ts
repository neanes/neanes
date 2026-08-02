import type { Namespace, SelectorParam, TFunction } from 'i18next';

import type { ModeKeyElement } from '@/models/Element';
import type { Fthora, Neume } from '@/models/Neumes';
import { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { Unit } from '@/utils/Unit';

export type ModeKeyMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const INITIAL_MARTYRIA_NUMERAL_STYLES = {
  None: 'none',
  Digits: 'digits',
  RomanNumerals: 'roman-numerals',
  CyrillicNumerals: 'cyrillic-numerals',
  CardinalWords: 'cardinal-words',
  OrdinalWords: 'ordinal-words',
} as const;

export type InitialMartyriaNumeralStyle =
  (typeof INITIAL_MARTYRIA_NUMERAL_STYLES)[keyof typeof INITIAL_MARTYRIA_NUMERAL_STYLES];

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
  EnglishPlagalFirstV1: 'builtin:english-plagal-first-v1',
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
  SpanishTonoOrdinalV1: 'builtin:spanish-tono-ordinal-v1',
  SpanishOrdinalTonoV1: 'builtin:spanish-ordinal-tono-v1',
  ChurchSlavonicGlasNumberV1: 'builtin:church-slavonic-glas-number-v1',
  ChurchSlavonicGlasCyrillicNumeralV1:
    'builtin:church-slavonic-glas-cyrillic-numeral-v1',
  ChurchSlavonicGlasOrdinalV1: 'builtin:church-slavonic-glas-ordinal-v1',
  RussianGlasNumberV1: 'builtin:russian-glas-number-v1',
  RussianGlasOrdinalV1: 'builtin:russian-glas-ordinal-v1',
  ArabicOrdinalV1: 'builtin:arabic-ordinal-v1',
  RomanianGlasNumberV1: 'builtin:romanian-glas-number-v1',
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
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalFirstV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.englishPlagalFirst,
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
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.russianGlasNumber,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.russianGlasOrdinal,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinalV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.arabicOrdinal,
  [BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumberV1]: ($) =>
    $.dialog.initialMartyriaStyles.builtInStyles.romanianGlasNumber,
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
      modes?: ModeKeyMode[];
      fontRole?: 'main' | 'greek';
    }
  | {
      kind: 'stackedText';
      top: string;
      bottom: string;
      modes?: ModeKeyMode[];
      fontRole?: 'main' | 'greek';
    }
  | {
      kind: 'modeSign';
      modes?: ModeKeyMode[];
    }
  | {
      kind: 'startingNoteCluster';
      modes?: ModeKeyMode[];
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
  flowDirection: 'page' | 'ltr' | 'rtl';
  defaultAppearance: InitialMartyriaDefaultAppearance;
  originalNoteNames: InitialMartyriaNoteNames;
  transliteratedNoteNames: InitialMartyriaNoteNames;
  filters: {
    numeralStyle: InitialMartyriaNumeralStyle;
    usesPlagalTerminology: boolean;
  };
  components: InitialMartyriaComponent[];
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

function text(
  content: string,
  modes?: ModeKeyMode[],
): InitialMartyriaComponent {
  return { kind: 'text', content, modes };
}

function stackedText(
  top: string,
  bottom: string,
  modes?: ModeKeyMode[],
  fontRole: 'main' | 'greek' = 'main',
): InitialMartyriaComponent {
  return {
    kind: 'stackedText',
    top,
    bottom,
    modes,
    fontRole,
  };
}

function plagalAbbreviation() {
  return stackedText('λ', 'π', [5, 6, 8], 'greek');
}

function modeSign(): InitialMartyriaComponent {
  return { kind: 'modeSign' };
}

function startingPitch(): InitialMartyriaComponent {
  return { kind: 'startingNoteCluster' };
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
  defaultAppearance: InitialMartyriaDefaultAppearance;
  filters: InitialMartyriaStyle['filters'];
  components: InitialMartyriaComponent[];
  transliteratedNoteNames?: InitialMartyriaNoteNames;
  flowDirection?: InitialMartyriaStyle['flowDirection'];
}): InitialMartyriaStyle {
  const {
    transliteratedNoteNames = transliteratedGreekNoteNames,
    flowDirection = 'page',
    ...styleOptions
  } = options;
  return {
    ...styleOptions,
    flowDirection,
    originalNoteNames: originalGreekNoteNames,
    transliteratedNoteNames,
  };
}

export const traditionalGreekInitialMartyriaStyle = builtIn({
  id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
  languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
  defaultAppearance: defaultAppearance('GFS Didot'),
  filters: {
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.None,
    usesPlagalTerminology: false,
  },
  components: [
    text('Ἦχος'),
    stackedText('λ', 'π', [5, 6, 8], 'greek'),
    text('Βαρύς', [7]),
    modeSign(),
    startingPitch(),
  ],
});

const sourceSerifAppearance = () => defaultAppearance('Source Serif');

// Curated styles are developer-owned. A new option needs an ID and localized
// name selector above, then one entry here describing its language, defaults,
// and ordered real-text/musical components.
export const builtInInitialMartyriaStyles: InitialMartyriaStyle[] = [
  traditionalGreekInitialMartyriaStyle,
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalFirstV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.None,
      usesPlagalTerminology: false,
    },
    components: [
      plagalAbbreviation(),
      modeSign(),
      text('Mode'),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishSignFirstV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.None,
      usesPlagalTerminology: false,
    },
    components: [
      modeSign(),
      plagalAbbreviation(),
      text('Mode'),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeBeforeSignV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.None,
      usesPlagalTerminology: false,
    },
    components: [
      plagalAbbreviation(),
      text('Mode'),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.OrdinalWords,
      usesPlagalTerminology: false,
    },
    components: [
      text('First', [1]),
      text('Second', [2]),
      text('Third', [3]),
      text('Fourth', [4]),
      text('Fifth', [5]),
      text('Sixth', [6]),
      text('Seventh', [7]),
      text('Eighth', [8]),
      text('Mode'),
      plagalAbbreviation(),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      usesPlagalTerminology: false,
    },
    components: [
      text('Mode'),
      text('1', [1]),
      text('2', [2]),
      text('3', [3]),
      text('4', [4]),
      text('5', [5]),
      text('6', [6]),
      text('7', [7]),
      text('8', [8]),
      plagalAbbreviation(),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      usesPlagalTerminology: false,
    },
    components: [
      text('Mode'),
      text('I', [1]),
      text('II', [2]),
      text('III', [3]),
      text('IV', [4]),
      text('V', [5]),
      text('VI', [6]),
      text('VII', [7]),
      text('VIII', [8]),
      plagalAbbreviation(),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumberWordV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.CardinalWords,
      usesPlagalTerminology: false,
    },
    components: [
      text('Mode'),
      text('One', [1]),
      text('Two', [2]),
      text('Three', [3]),
      text('Four', [4]),
      text('Five', [5]),
      text('Six', [6]),
      text('Seven', [7]),
      text('Eight', [8]),
      plagalAbbreviation(),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishFullNameV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.OrdinalWords,
      usesPlagalTerminology: true,
    },
    components: [
      text('Plagal of', [5, 6, 8]),
      text('First', [1]),
      text('Second', [2]),
      text('Third', [3]),
      text('Fourth', [4]),
      text('First', [5]),
      text('Second', [6]),
      text('Grave', [7]),
      text('Fourth', [8]),
      text('Mode'),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      usesPlagalTerminology: true,
    },
    components: [
      text('Plagal', [5, 6, 8]),
      text('Grave', [7]),
      text('Mode'),
      text('1', [1, 5]),
      text('2', [2, 6]),
      text('3', [3]),
      text('4', [4, 8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      usesPlagalTerminology: true,
    },
    components: [
      text('Plagal', [5, 6, 8]),
      text('Grave', [7]),
      text('Mode'),
      text('I', [1, 5]),
      text('II', [2, 6]),
      text('III', [3]),
      text('IV', [4, 8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalNumberWordV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.CardinalWords,
      usesPlagalTerminology: true,
    },
    components: [
      text('Plagal', [5, 6, 8]),
      text('Grave', [7]),
      text('Mode'),
      text('One', [1, 5]),
      text('Two', [2, 6]),
      text('Three', [3]),
      text('Four', [4, 8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: spanishTransliteratedNoteNames,
    components: [
      text('Tono'),
      text('1', [1]),
      text('2', [2]),
      text('3', [3]),
      text('4', [4]),
      text('5', [5]),
      text('6', [6]),
      text('7', [7]),
      text('8', [8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoRomanNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: spanishTransliteratedNoteNames,
    components: [
      text('Tono'),
      text('I', [1]),
      text('II', [2]),
      text('III', [3]),
      text('IV', [4]),
      text('V', [5]),
      text('VI', [6]),
      text('VII', [7]),
      text('VIII', [8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishTonoOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.OrdinalWords,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: spanishTransliteratedNoteNames,
    components: [
      text('Tono'),
      text('Primero', [1]),
      text('Segundo', [2]),
      text('Tercero', [3]),
      text('Cuarto', [4]),
      text('Quinto', [5]),
      text('Sexto', [6]),
      text('Séptimo', [7]),
      text('Octavo', [8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.SpanishOrdinalTonoV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.OrdinalWords,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: spanishTransliteratedNoteNames,
    components: [
      text('Primer', [1]),
      text('Segundo', [2]),
      text('Tercer', [3]),
      text('Cuarto', [4]),
      text('Quinto', [5]),
      text('Sexto', [6]),
      text('Séptimo', [7]),
      text('Octavo', [8]),
      text('Tono'),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    defaultAppearance: defaultAppearance('Old Standard'),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
    components: [
      text('Гласъ'),
      text('1', [1]),
      text('2', [2]),
      text('3', [3]),
      text('4', [4]),
      text('5', [5]),
      text('6', [6]),
      text('7', [7]),
      text('8', [8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasCyrillicNumeralV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    defaultAppearance: defaultAppearance('Old Standard'),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.CyrillicNumerals,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
    components: [
      text('Гласъ'),
      text('а҃', [1]),
      text('в҃', [2]),
      text('г҃', [3]),
      text('д҃', [4]),
      text('є҃', [5]),
      text('ѕ҃', [6]),
      text('з҃', [7]),
      text('и҃', [8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ChurchSlavonicGlasOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
    defaultAppearance: defaultAppearance('Old Standard'),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.OrdinalWords,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: churchSlavonicTransliteratedNoteNames,
    components: [
      text('Гласъ'),
      text('пе́рвый', [1]),
      text('вторы́й', [2]),
      text('тре́тій', [3]),
      text('четве́ртый', [4]),
      text('пяты́й', [5]),
      text('шесты́й', [6]),
      text('седьмы́й', [7]),
      text('осмы́й', [8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: russianTransliteratedNoteNames,
    components: [
      text('Глас'),
      text('1', [1]),
      text('2', [2]),
      text('3', [3]),
      text('4', [4]),
      text('5', [5]),
      text('6', [6]),
      text('7', [7]),
      text('8', [8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RussianGlasOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.OrdinalWords,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: russianTransliteratedNoteNames,
    components: [
      text('Глас'),
      text('первый', [1]),
      text('второй', [2]),
      text('третий', [3]),
      text('четвёртый', [4]),
      text('пятый', [5]),
      text('шестой', [6]),
      text('седьмой', [7]),
      text('восьмой', [8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.ArabicOrdinalV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    defaultAppearance: defaultAppearance('Noto Naskh Arabic', 'GFS Didot'),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.OrdinalWords,
      usesPlagalTerminology: false,
    },
    transliteratedNoteNames: arabicTransliteratedNoteNames,
    flowDirection: 'rtl',
    components: [
      text('اللحن الأول', [1]),
      text('اللحن الثاني', [2]),
      text('اللحن الثالث', [3]),
      text('اللحن الرابع', [4]),
      text('اللحن الخامس', [5]),
      text('اللحن السادس', [6]),
      text('اللحن السابع', [7]),
      text('اللحن الثامن', [8]),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasNumberV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      usesPlagalTerminology: false,
    },
    components: [
      text('Glas'),
      text('1', [1]),
      text('2', [2]),
      text('3', [3]),
      text('4', [4]),
      text('5', [5]),
      text('6', [6]),
      text('7', [7]),
      text('8', [8]),
      plagalAbbreviation(),
      modeSign(),
      startingPitch(),
    ],
  }),
  builtIn({
    id: BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.RomanianGlasV1,
    languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
    defaultAppearance: sourceSerifAppearance(),
    filters: {
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.None,
      usesPlagalTerminology: false,
    },
    components: [
      text('Glas'),
      plagalAbbreviation(),
      modeSign(),
      startingPitch(),
    ],
  }),
];

export function createInitialMartyriaConfiguration(
  styleId: BuiltInInitialMartyriaStyleId,
): InitialMartyriaConfiguration {
  return {
    styleId,
    transliterateNoteNames: false,
    appearanceOverrides: {},
  };
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

function isInitialMartyriaComponentVisible(
  component: InitialMartyriaComponent,
  mode: ModeKeyMode,
) {
  return component.modes?.includes(mode) ?? true;
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
  for (const component of style.components) {
    if (!isInitialMartyriaComponentVisible(component, options.context.mode)) {
      continue;
    }
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
