import type { Fthora, ModeSign, Neume } from '@/models/Neumes';
import type { ScaleNote } from '@/models/Scales';
import type { FontVariantProperty } from '@/utils/fontVariants';

export type ModeKeyMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const INITIAL_MARTYRIA_NUMERAL_KINDS = {
  Ordinal: 'ordinal',
  Cardinal: 'cardinal',
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
  Prenominal: 'prenominal',
  Postnominal: 'postnominal',
} as const;

export type InitialMartyriaNumeralQualifier =
  (typeof INITIAL_MARTYRIA_NUMERAL_QUALIFIERS)[keyof typeof INITIAL_MARTYRIA_NUMERAL_QUALIFIERS];

export const INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS = {
  ModeSign: 'mode-sign',
  TextAndModeSign: 'text-and-mode-sign',
  Text: 'text',
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
  AuthenticCounterpart: 'authentic-counterpart',
  PlagalClass: 'plagal-class',
  Absolute: 'absolute',
} as const;

export type InitialMartyriaModeNamingScheme =
  (typeof INITIAL_MARTYRIA_MODE_NAMING_SCHEMES)[keyof typeof INITIAL_MARTYRIA_MODE_NAMING_SCHEMES];

export const INITIAL_MARTYRIA_LANGUAGE_IDS = {
  Arabic: 'ar',
  ChurchSlavonic: 'cu',
  English: 'en',
  Greek: 'el',
  Indonesian: 'id',
  Romanian: 'ro',
  Russian: 'ru',
  Spanish: 'es',
} as const;

export type InitialMartyriaLanguageId =
  (typeof INITIAL_MARTYRIA_LANGUAGE_IDS)[keyof typeof INITIAL_MARTYRIA_LANGUAGE_IDS];

/**
 * A word a language can use for the concept of a mode in place of its usual
 * one, named by concept rather than spelling so that languages can share an
 * id (English Tone). Each language declares the variants it offers; a
 * variant may bring its own words, grammar, and rendering conventions.
 */
export const INITIAL_MARTYRIA_LABEL_VARIANTS = {
  Tone: 'tone',
} as const;

export type InitialMartyriaLabelVariant =
  (typeof INITIAL_MARTYRIA_LABEL_VARIANTS)[keyof typeof INITIAL_MARTYRIA_LABEL_VARIANTS];

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

/** How the words and note names of an initial martyria are set. */
export const INITIAL_MARTYRIA_LETTERINGS = {
  /** Text in the style's paragraph styles. */
  Text: 'text',
  /** The music font's own Greek lettering and pitch-name glyphs. */
  MusicFont: 'music-font',
} as const;

export type InitialMartyriaLettering =
  (typeof INITIAL_MARTYRIA_LETTERINGS)[keyof typeof INITIAL_MARTYRIA_LETTERINGS];

/**
 * The paragraph styles an initial martyria uses for regular and Greek text.
 * Typography is configured on those paragraph styles, not duplicated here.
 */
export interface InitialMartyriaStyleTypography {
  /**
   * Music-font lettering takes its size, color, and stroke from the
   * paragraph style matching the language's script alone (the Greek one for
   * the neume font's Greek structure); ordinal forms apply to text lettering
   * alone. Music-font lettering is only ever paired with a structure the
   * font can letter: styles are created and loaded through
   * getSupportedInitialMartyriaLettering, and the built-in styles are pinned
   * by a test. Consumers read this field as is.
   */
  lettering: InitialMartyriaLettering;
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
 * the app can produce. The displayed components are derived from these
 * semantics and the language's lexicon, never stored.
 */
interface InitialMartyriaStructureBase extends InitialMartyriaModeNameSemantics {
  languageId: InitialMartyriaLanguageId;
  /** The word for the mode; absent means the language's usual word. */
  labelVariant?: InitialMartyriaLabelVariant;
  /** Only used by languages that are not written in Greek script. */
  transliterateNoteNames: boolean;
  /**
   * Whether plagal modes set the plagal abbreviation beside the mode sign.
   * Only used where the language makes it optional; absent means the
   * language's usual practice.
   */
  plagalAbbreviationWithModeSign?: boolean;
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

/**
 * What identifies a style by name. Names are unique across all of a score's
 * styles, and pasting reuses a destination style with the same name.
 */
export function getInitialMartyriaStyleNameKey(
  style: Pick<InitialMartyriaStyle, 'displayName'>,
) {
  return style.displayName.trim();
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
  /**
   * The appearance matching the script of the style's language. It sizes
   * and paints every music-font glyph, whatever the lettering.
   */
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
  | { layout: 'inline'; text: string }
  | {
      layout: 'stackedCharacters';
      topCharacter: string;
      bottomCharacter: string;
    };

export type InitialMartyriaGlyphSemantic =
  'modeSign' | InitialMartyriaTextSemantic;

export type ResolvedInitialMartyriaRun =
  | {
      kind: 'glyph';
      semantic: InitialMartyriaGlyphSemantic;
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
      /** The music-font glyphs: pitch marks, trailing glyphs, glyph notes. */
      appearance: InitialMartyriaAppearance;
      /**
       * The note names, or null when each note is drawn as its own music-font
       * glyph in the run's appearance. Pitch marks are centered on the note
       * either way.
       */
      noteText:
        | (InitialMartyriaNoteNames & {
            appearance: InitialMartyriaAppearance;
          })
        | null;
      direction: 'ltr' | 'rtl';
      cluster: InitialMartyriaPitchCluster;
    };

export type InitialMartyriaStartingNoteRun = Extract<
  ResolvedInitialMartyriaRun,
  { kind: 'startingPitch' }
>;

/** The appearance a starting pitch run sets its notes in. */
export function getInitialMartyriaNoteAppearance(
  run: InitialMartyriaStartingNoteRun,
): InitialMartyriaAppearance {
  return run.noteText?.appearance ?? run.appearance;
}

export interface InitialMartyriaStyleResolution {
  structure: InitialMartyriaStructure;
  runs: ResolvedInitialMartyriaRun[];
  flowDirection: 'ltr' | 'rtl';
}

export function cloneInitialMartyriaStyle(
  style: InitialMartyriaStyle,
): InitialMartyriaStyle {
  return {
    ...style,
    structure: { ...style.structure },
  };
}
