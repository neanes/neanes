import type { Fthora, Neume } from '@/models/Neumes';
import type { ModeSign } from '@/models/Neumes';
import type { ScaleNote } from '@/models/Scales';
import type { FontVariantProperty } from '@/utils/fontVariants';

import type { BuiltInInitialMartyriaStyleId } from './InitialMartyriaBuiltInStyles';

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

export const INITIAL_MARTYRIA_NUMBERING_SYSTEMS = {
  ArabicIndic: 'arab',
} as const;

export type InitialMartyriaNumberingSystem =
  (typeof INITIAL_MARTYRIA_NUMBERING_SYSTEMS)[keyof typeof INITIAL_MARTYRIA_NUMBERING_SYSTEMS];

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
  Indonesian: 'id',
} as const;

export type InitialMartyriaLanguageId =
  (typeof INITIAL_MARTYRIA_LANGUAGE_IDS)[keyof typeof INITIAL_MARTYRIA_LANGUAGE_IDS];

export const initialMartyriaLanguageIds = Object.values(
  INITIAL_MARTYRIA_LANGUAGE_IDS,
);

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

/**
 * The paragraph styles an initial martyria uses for regular and Greek text.
 * Typography is configured on those paragraph styles, not duplicated here.
 */
export interface InitialMartyriaStyleTypography {
  paragraphStyleId: string;
  greekParagraphStyleId: string;
  /** Apply the OpenType ordinal feature to digit-ordinal numeral runs only. */
  useOrdinalForms: boolean;
}

/** The grammatical reading of a mode name, whether written as text or a sign. */
export interface InitialMartyriaModeNameSemantics {
  numeralKind: InitialMartyriaNumeralKind;
  numeralQualifier: InitialMartyriaNumeralQualifier;
  modeNamingScheme: InitialMartyriaModeNamingScheme;
}

/** The additional choices that apply when a mode number is printed. */
export interface InitialMartyriaWrittenModeNameSemantics extends InitialMartyriaModeNameSemantics {
  numeralStyle: InitialMartyriaNumeralStyle;
  /** Digit repertoire; meaningful only when numeralStyle is digits. */
  numberingSystem?: InitialMartyriaNumberingSystem;
}

/**
 * How an initial martyria is written: one point in the space of structures
 * the app can produce. The displayed components and the spoken reading are
 * derived from these semantics and the language's lexicon, never stored.
 */
interface InitialMartyriaStructureBase extends InitialMartyriaModeNameSemantics {
  languageId: InitialMartyriaLanguageId;
  /** Only used by languages that are not written in Greek script. */
  transliterateNoteNames: boolean;
}

export interface InitialMartyriaTextStructure
  extends
    InitialMartyriaStructureBase,
    InitialMartyriaWrittenModeNameSemantics {
  modeIdentificationMethod:
    | typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text
    | typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign;
}

export interface InitialMartyriaModeSignStructure extends InitialMartyriaStructureBase {
  modeIdentificationMethod: typeof INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign;
}

export type InitialMartyriaStructure =
  InitialMartyriaTextStructure | InitialMartyriaModeSignStructure;

export function withInitialMartyriaModeIdentificationMethod(
  structure: InitialMartyriaStructure,
  modeIdentificationMethod: InitialMartyriaModeIdentificationMethod,
): InitialMartyriaStructure {
  const common = {
    languageId: structure.languageId,
    numeralKind: structure.numeralKind,
    numeralQualifier: structure.numeralQualifier,
    modeNamingScheme: structure.modeNamingScheme,
    transliterateNoteNames: structure.transliterateNoteNames,
  };
  if (
    modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    return { ...common, modeIdentificationMethod };
  }
  // A sign has no printed form to preserve; words are its direct reading.
  const written =
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
      ? { numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words }
      : {
          numeralStyle: structure.numeralStyle,
          numberingSystem: structure.numberingSystem,
        };
  return { ...common, modeIdentificationMethod, ...written };
}

export function withInitialMartyriaNumeralForm(
  structure: InitialMartyriaTextStructure,
  form: Pick<
    InitialMartyriaWrittenModeNameSemantics,
    'numeralKind' | 'numeralStyle'
  >,
): InitialMartyriaTextStructure {
  return {
    ...structure,
    ...form,
    numberingSystem:
      form.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
        ? structure.numberingSystem
        : undefined,
  };
}

/** Whether the rendered mode name contains a digit ordinal such as "5th". */
export function initialMartyriaStructureHasOrdinalDigits(
  structure: InitialMartyriaStructure,
) {
  return (
    structure.modeIdentificationMethod !==
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign &&
    structure.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal &&
    structure.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
  );
}

/**
 * A named point in the structure space together with its typography.
 * Built-in styles are curated per language and read-only; the rest are
 * saved with the score.
 */
export interface InitialMartyriaStyle extends InitialMartyriaStyleTypography {
  id: string;
  /** Ignored for built-in styles, which are named through the UI locale. */
  displayName: string;
  /** The built-in style a custom style was derived from, if any. */
  basedOn: BuiltInInitialMartyriaStyleId | null;
  structure: InitialMartyriaStructure;
}

/**
 * Fully resolved text or glyph styling used by layout and rendering: every
 * property has a value, so consumers never fall back.
 */
export interface InitialMartyriaAppearance extends Record<
  FontVariantProperty,
  string
> {
  fontFamily: string;
  fontStyle: string;
  fontSize: number;
  color: string;
  strokeWidth: number;
  strokeColor: string;
}

export interface ResolvedInitialMartyriaStyle {
  style: InitialMartyriaStyle;
  mainAppearance: InitialMartyriaAppearance;
  greekAppearance: InitialMartyriaAppearance;
  /** The appearance matching the script of the style's language. */
  primaryAppearance: InitialMartyriaAppearance;
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

export function cloneInitialMartyriaStyle(
  style: InitialMartyriaStyle,
): InitialMartyriaStyle {
  return {
    ...style,
    structure: { ...style.structure },
  };
}
