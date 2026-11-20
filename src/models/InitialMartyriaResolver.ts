import type { ModeKeyElement } from '@/models/Element';
import type { Neume } from '@/models/Neumes';
import { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import {
  type ParagraphStyle,
  type ParagraphStyleOverrides,
  type ResolvedParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import {
  composeNumericVariant,
  parseNumericVariant,
} from '@/utils/fontVariants';

import { getInitialMartyriaStyleOrDefault } from './InitialMartyriaBuiltInStyles';
import {
  arabicIndicDigits,
  hasRaisableOrdinalSuffix,
  initialMartyriaCanonicalNotes,
  type InitialMartyriaLexicon,
  initialMartyriaLexicons,
  originalGreekNoteNames,
  romanNumerals,
} from './InitialMartyriaLexicon';
import { initialMartyriaRenderingConventions } from './InitialMartyriaRenderingConventions';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_LETTERINGS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaAppearance,
  type InitialMartyriaCanonicalNote,
  type InitialMartyriaContext,
  type InitialMartyriaLettering,
  type InitialMartyriaModeNameSemantics,
  type InitialMartyriaStructure,
  initialMartyriaStructureHasOrdinalDigits,
  type InitialMartyriaStyle,
  type InitialMartyriaStyleResolution,
  type InitialMartyriaTextSemantic,
  type InitialMartyriaWrittenModeNameSemantics,
  type ModeKeyMode,
  type ResolvedInitialMartyriaRun,
  type ResolvedInitialMartyriaStyle,
} from './InitialMartyriaStyle';

type InitialMartyriaComponent =
  | {
      kind: 'text';
      semantic: InitialMartyriaTextSemantic;
      content: string;
    }
  | {
      kind: 'stackedCharacters';
      semantic: InitialMartyriaTextSemantic;
      top: string;
      bottom: string;
    }
  | { kind: 'modeSign' }
  | { kind: 'startingNoteCluster' };

/** The authentic mode each plagal mode is numbered after. */
const authenticModeNumbers: Partial<Record<ModeKeyMode, ModeKeyMode>> = {
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

function getInitialMartyriaNumeralWord(
  semantics: InitialMartyriaModeNameSemantics,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  const modeNumber = getInitialMartyriaModeNumber(semantics, mode);
  if (modeNumber == null) {
    return null;
  }
  if (semantics.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal) {
    return lexicon.cardinalWords == null
      ? null
      : lexicon.cardinalWords[modeNumber];
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
  const word = words[modeNumber];
  return semantics.numeralQualifier ===
    INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal
    ? capitalizeInitial(word)
    : word;
}

function getInitialMartyriaNumeralText(
  semantics: InitialMartyriaWrittenModeNameSemantics,
  lexicon: InitialMartyriaLexicon,
  mode: ModeKeyMode,
) {
  if (semantics.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Words) {
    return getInitialMartyriaNumeralWord(semantics, lexicon, mode);
  }
  const modeNumber = getInitialMartyriaModeNumber(semantics, mode);
  if (modeNumber == null) {
    return null;
  }
  if (
    semantics.numeralStyle ===
    INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals
  ) {
    return lexicon.alphabeticNumerals == null
      ? null
      : lexicon.alphabeticNumerals[modeNumber];
  }
  const base =
    semantics.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
      ? semantics.numberingSystem ===
        INITIAL_MARTYRIA_NUMBERING_SYSTEMS.ArabicIndic
        ? arabicIndicDigits[modeNumber]
        : String(modeNumber)
      : romanNumerals[modeNumber];
  return semantics.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal &&
    lexicon.formatOrdinal
    ? lexicon.formatOrdinal(
        base,
        semantics.numeralStyle,
        semantics.numeralQualifier,
      )
    : base;
}

function getInitialMartyriaLabelText(
  lexicon: InitialMartyriaLexicon,
  trailingLabel: boolean,
  withOrdinal: boolean,
) {
  if (trailingLabel) {
    return lexicon.lowercaseTrailingLabel
      ? lexicon.label.toLocaleLowerCase()
      : lexicon.label;
  }
  if (lexicon.labelWithOrdinal != null && withOrdinal) {
    return lexicon.labelWithOrdinal;
  }
  return lexicon.label;
}

function usesPlagalAbbreviationInText(
  semantics: Pick<InitialMartyriaWrittenModeNameSemantics, 'numeralStyle'>,
  languageId: InitialMartyriaStructure['languageId'],
) {
  return initialMartyriaRenderingConventions[
    languageId
  ].plagalAbbreviationNumeralStyles.includes(semantics.numeralStyle);
}

function capitalizeInitial(value: string) {
  const [first, ...rest] = [...value];
  return `${first.toLocaleUpperCase()}${rest.join('')}`;
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
    kind: 'stackedCharacters',
    semantic: 'plagalAbbreviation',
    top: 'λ',
    bottom: 'π',
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

/*
 * The conventional semantics of the traditional sign group when it repeats a
 * text identification: the sign beside "Mode 5" still names "Plagal First",
 * so its plagal indicator keeps the traditional placement.
 */
const traditionalModeSignSemantics: InitialMartyriaModeNameSemantics = {
  numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
  numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
  modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
};

/**
 * Derives the displayed components for one mode from the style's semantics
 * and its language's lexicon. The mode name is a phrase built from the
 * label, the numeral, and a plagal or grave marker; sign-identified styles
 * use the traditional sign group in place of the numeral.
 */
function getInitialMartyriaComponents(
  structure: InitialMartyriaStructure,
  mode: ModeKeyMode,
  flowDirection: 'ltr' | 'rtl' = initialMartyriaLexicons[structure.languageId]
    .direction,
): InitialMartyriaComponent[] {
  const lexicon = initialMartyriaLexicons[structure.languageId];
  const convention = initialMartyriaRenderingConventions[structure.languageId];
  const plagal = isPlagalMode(mode);
  const modeSign: InitialMartyriaComponent = { kind: 'modeSign' };
  const modeSignAbbreviation =
    plagal && convention.showPlagalAbbreviationWithModeSign
      ? plagalAbbreviation()
      : null;
  const startingPitch: InitialMartyriaComponent = {
    kind: 'startingNoteCluster',
  };
  const makeLabel = (withOrdinal: boolean) => {
    const labelText = getInitialMartyriaLabelText(
      lexicon,
      usesTrailingLabel(structure),
      withOrdinal,
    );
    return text('label', labelText);
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
    // The sign group may include a plagal abbreviation or grave title.
    const graveTitle =
      usesGraveNaming(structure, mode) &&
      convention.showGraveWordWithModeSign &&
      lexicon.graveWord != null
        ? capitalizeInitial(lexicon.graveWord)
        : null;
    const marker =
      modeSignAbbreviation ??
      (graveTitle != null ? text('graveWord', graveTitle) : null);
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
    let orderedNumeral = numeral;
    if (usesGraveNaming(structure, mode) && lexicon.graveWord != null) {
      if (lexicon.graveWordAfterLabel) {
        orderedNumeral = text('graveWord', lexicon.graveWord);
      } else {
        marker = text('graveWord', lexicon.graveWord);
      }
    } else if (plagal && usesPlagalNaming(structure)) {
      if (usesPlagalAbbreviationInText(structure, structure.languageId)) {
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
      orderedNumeral,
      marker,
      label,
    );

    if (convention.terminalPunctuation !== '') {
      const lastText = ordered
        .filter(
          (
            component,
          ): component is Extract<InitialMartyriaComponent, { kind: 'text' }> =>
            component?.kind === 'text',
        )
        .at(-1);
      if (lastText != null) {
        lastText.content += convention.terminalPunctuation;
      }
    }

    if (
      structure.modeIdentificationMethod ===
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign
    ) {
      // The traditional sign group repeats the text identification, but keeps
      // its own conventional order rather than inheriting the text's number
      // form. For example, the sign beside "Mode 5" still names
      // "Plagal First".
      const group = orderInitialMartyriaModeName(
        traditionalModeSignSemantics,
        lexicon,
        modeSign,
        modeSignAbbreviation,
        null,
      ).filter(
        (component): component is InitialMartyriaComponent => component != null,
      );
      if (flowDirection === 'rtl') {
        group.reverse();
      }
      if (convention.modeSignGroupPlacement === 'after-starting-pitch') {
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

export const modeKeyModes: ModeKeyMode[] = [1, 2, 3, 4, 5, 6, 7, 8];

export function isInitialMartyriaModeNameSupported(
  structure: InitialMartyriaStructure,
) {
  if (
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    return true;
  }
  const lexicon = initialMartyriaLexicons[structure.languageId];
  return !(
    usesPlagalNaming(structure) &&
    !usesPlagalAbbreviationInText(structure, structure.languageId) &&
    getPlagalMarkerWord(structure, lexicon) == null
  );
}

function encodeInitialMartyriaComponent(component: InitialMartyriaComponent) {
  switch (component.kind) {
    case 'modeSign':
      return '<modeSign>';
    case 'startingNoteCluster':
      return '<pitch>';
    case 'text':
      return `main:${component.content}`;
    case 'stackedCharacters':
      return `${
        component.semantic === 'plagalAbbreviation' ? 'greek' : 'main'
      }:${component.top}/${component.bottom}`;
  }
}

// The key is a pure function of a structure's axes over static lexicon data,
// and the reachable space is a few hundred structures, so every key is
// computed at most once for the life of the app. The dialog asks for keys
// once per style per row rebuild, which would otherwise rebuild the
// components of all eight modes each time.
const structureKeyCache = new Map<string, string>();

function getInitialMartyriaStructureAxisSignature(
  structure: InitialMartyriaStructure,
) {
  return [
    structure.languageId,
    structure.modeIdentificationMethod,
    structure.numeralKind,
    structure.numeralQualifier,
    structure.modeNamingScheme,
    structure.transliterateNoteNames,
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
      ? undefined
      : structure.numeralStyle,
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
      ? undefined
      : structure.numberingSystem,
  ].join('/');
}

/** The printed form of one mode: its components, encoded as text. */
export function getInitialMartyriaPrintedForm(
  structure: InitialMartyriaStructure,
  mode: ModeKeyMode,
) {
  return getInitialMartyriaComponents(structure, mode)
    .map(encodeInitialMartyriaComponent)
    .join(' | ');
}

/**
 * Identifies what a structure produces rather than how it is described: the
 * printed form of every mode. Two structures with the same key look the same
 * on the page, however their axes are set, so the key drives de-duplication
 * throughout the styles dialog.
 */
export function getInitialMartyriaStructureKey(
  structure: InitialMartyriaStructure,
) {
  const cacheKey = getInitialMartyriaStructureAxisSignature(structure);
  const cached = structureKeyCache.get(cacheKey);
  if (cached != null) {
    return cached;
  }
  const lexicon = initialMartyriaLexicons[structure.languageId];
  const transliterate =
    structure.transliterateNoteNames && !lexicon.usesGreekScript;
  const key = [
    structure.languageId,
    transliterate ? 'transliterated' : 'original',
    ...modeKeyModes.map((mode) =>
      getInitialMartyriaPrintedForm(structure, mode),
    ),
  ].join('\n');
  structureKeyCache.set(cacheKey, key);
  return key;
}

/** What tells two wordings apart: their lettering and what they print. */
export function getInitialMartyriaWordingKey(
  style: Pick<InitialMartyriaStyle, 'lettering' | 'structure'>,
) {
  return `${style.lettering}\n${getInitialMartyriaStructureKey(style.structure)}`;
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

function toInitialMartyriaAppearance(
  resolved: ResolvedParagraphStyle,
): InitialMartyriaAppearance {
  return {
    fontFamily: resolved.fontFamily,
    fontStyle: resolved.fontStyle,
    fontSize: resolved.fontSize,
    color: resolved.color,
    strokeWidth: resolved.strokeWidth,
    strokeColor: resolved.strokeColor,
    fontVariantCaps: resolved.fontVariantCaps ?? 'normal',
    fontVariantNumeric: resolved.fontVariantNumeric ?? 'normal',
    fontVariantLigatures: resolved.fontVariantLigatures ?? 'normal',
    fontVariantAlternates: resolved.fontVariantAlternates ?? 'normal',
  };
}

/**
 * The typography of a style resolved through its regular and Greek paragraph
 * styles, with any element overrides folded in.
 */
export function resolveInitialMartyriaStyleAppearances(
  style: InitialMartyriaStyle,
  paragraphStyles: ParagraphStyle[],
  elementOverrides?: ParagraphStyleOverrides,
): ResolvedInitialMartyriaStyle {
  const main = resolveParagraphStyle(
    paragraphStyles,
    style.paragraphStyleId,
    elementOverrides,
  );
  const greek = resolveParagraphStyle(
    paragraphStyles,
    style.greekParagraphStyleId,
    elementOverrides,
  );
  const mainAppearance = toInitialMartyriaAppearance(main);
  const greekAppearance = toInitialMartyriaAppearance(greek);
  // The primary text, and with it every music-font glyph, follows the
  // paragraph style of the language's script, whatever the lettering.
  const primaryAppearance = initialMartyriaLexicons[style.structure.languageId]
    .usesGreekScript
    ? greekAppearance
    : mainAppearance;
  return {
    style,
    mainAppearance,
    greekAppearance,
    primaryAppearance,
  };
}

function withOrdinalForms(
  appearance: InitialMartyriaAppearance,
): InitialMartyriaAppearance {
  const numeric = parseNumericVariant(appearance.fontVariantNumeric);
  return {
    ...appearance,
    fontVariantNumeric: composeNumericVariant({ ...numeric, ordinal: true }),
  };
}

/**
 * The style every mode key of a score inherits unless it overrides it.
 */
export function resolveScoreInitialMartyriaStyle(options: {
  pageSetup: Pick<PageSetup, 'initialMartyriaStyleId'>;
  paragraphStyles: ParagraphStyle[];
  initialMartyriaStyles: InitialMartyriaStyle[];
  styleId?: string;
  paragraphStyleOverrides?: ParagraphStyleOverrides;
}): ResolvedInitialMartyriaStyle {
  return resolveInitialMartyriaStyleAppearances(
    getInitialMartyriaStyleOrDefault(
      options.initialMartyriaStyles,
      options.styleId ?? options.pageSetup.initialMartyriaStyleId,
    ),
    options.paragraphStyles,
    options.paragraphStyleOverrides,
  );
}

/**
 * The style an element renders with: its own, or else the score's, falling
 * back to the default built-in style when a reference no longer resolves.
 */
export function resolveModeKeyInitialMartyriaStyle(options: {
  element: Pick<
    ModeKeyElement,
    'initialMartyriaStyleId' | 'getParagraphStyleOverrides'
  >;
  pageSetup: Pick<PageSetup, 'initialMartyriaStyleId'>;
  paragraphStyles: ParagraphStyle[];
  initialMartyriaStyles: InitialMartyriaStyle[];
}): ResolvedInitialMartyriaStyle {
  return resolveScoreInitialMartyriaStyle({
    ...options,
    styleId: options.element.initialMartyriaStyleId ?? undefined,
    paragraphStyleOverrides: options.element.getParagraphStyleOverrides(),
  });
}

/*
 * The music font's lettering glyph for each word of a mode name, or null for
 * words it has no glyph for.
 */
const musicFontLetteringGlyphs: Record<
  InitialMartyriaTextSemantic,
  ModeSign | null
> = {
  label: ModeSign.Ekhos,
  graveWord: ModeSign.Varys,
  plagalAbbreviation: ModeSign.Plagal,
  numeral: null,
  plagalWord: null,
};

const musicFontLetteringSupportCache = new Map<string, boolean>();

/*
 * The music font letters Greek only, and only a structure whose every word,
 * in every mode, has a lettering glyph.
 */
function initialMartyriaStructureSupportsMusicFontLettering(
  structure: InitialMartyriaStructure,
) {
  if (structure.languageId !== INITIAL_MARTYRIA_LANGUAGE_IDS.Greek) {
    return false;
  }
  const cacheKey = getInitialMartyriaStructureAxisSignature(structure);
  const cached = musicFontLetteringSupportCache.get(cacheKey);
  if (cached != null) {
    return cached;
  }
  const supported = modeKeyModes.every((mode) =>
    getInitialMartyriaComponents(structure, mode).every(
      (component) =>
        (component.kind !== 'text' && component.kind !== 'stackedCharacters') ||
        musicFontLetteringGlyphs[component.semantic] != null,
    ),
  );
  musicFontLetteringSupportCache.set(cacheKey, supported);
  return supported;
}

/**
 * The lettering a style can keep for its structure. Accepts unvalidated saved
 * values; anything other than supported music-font lettering becomes text.
 */
export function getSupportedInitialMartyriaLettering(
  lettering: string | undefined,
  structure: InitialMartyriaStructure,
): InitialMartyriaLettering {
  return lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont &&
    initialMartyriaStructureSupportsMusicFontLettering(structure)
    ? INITIAL_MARTYRIA_LETTERINGS.MusicFont
    : INITIAL_MARTYRIA_LETTERINGS.Text;
}

/** Whether a style's use-ordinal-forms option has any effect. */
export function initialMartyriaStyleOffersOrdinalForms(
  style: Pick<InitialMartyriaStyle, 'lettering' | 'structure'>,
) {
  return (
    style.lettering === INITIAL_MARTYRIA_LETTERINGS.Text &&
    initialMartyriaStructureSupportsOrdinalForms(style.structure)
  );
}

/**
 * Whether ordinal forms can change how a structure renders: its mode name
 * prints digit ordinals whose suffix the font's ordinal forms can raise.
 */
export function initialMartyriaStructureSupportsOrdinalForms(
  structure: InitialMartyriaStructure,
) {
  return (
    hasRaisableOrdinalSuffix(structure.languageId) &&
    initialMartyriaStructureHasOrdinalDigits(structure)
  );
}

/*
 * Whether a text run is set in the Greek paragraph style: all text of a
 * Greek-script language, and the stacked plagal abbreviation in any language.
 */
function textUsesGreekParagraphStyle(
  lexicon: InitialMartyriaLexicon,
  semantic: InitialMartyriaTextSemantic,
) {
  return lexicon.usesGreekScript || semantic === 'plagalAbbreviation';
}

/** The paragraph styles a style's rendering reads, in any mode. */
export interface InitialMartyriaParagraphStyleUsage {
  regular: boolean;
  greek: boolean;
}

/**
 * Which of a style's paragraph styles affect how it renders. The primary
 * text's style (the one matching the language's script) always does, since
 * it sizes and paints the music-font glyphs; music-font lettering reads
 * nothing else.
 */
export function getInitialMartyriaParagraphStyleUsage(
  style: Pick<InitialMartyriaStyle, 'lettering' | 'structure'>,
): InitialMartyriaParagraphStyleUsage {
  const structure = style.structure;
  const lexicon = initialMartyriaLexicons[structure.languageId];
  const usage = {
    regular: !lexicon.usesGreekScript,
    greek: lexicon.usesGreekScript,
  };
  if (style.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont) {
    return usage;
  }
  const transliteratesNoteNames =
    structure.transliterateNoteNames && !lexicon.usesGreekScript;
  if (transliteratesNoteNames) {
    usage.regular = true;
  } else {
    usage.greek = true;
  }
  for (const mode of modeKeyModes) {
    for (const component of getInitialMartyriaComponents(structure, mode)) {
      if (component.kind === 'text' || component.kind === 'stackedCharacters') {
        if (textUsesGreekParagraphStyle(lexicon, component.semantic)) {
          usage.greek = true;
        } else {
          usage.regular = true;
        }
      }
    }
  }
  return usage;
}

export function resolveInitialMartyriaStyle(options: {
  context: InitialMartyriaContext;
  resolvedStyle: ResolvedInitialMartyriaStyle;
  pageSetup: Pick<PageSetup, 'direction' | 'neumeDefaultFontFamily'>;
  /** The size music-font glyphs (mode sign, pitch marks) are drawn at. */
  glyphFontSize: number;
}): InitialMartyriaStyleResolution {
  const { style, mainAppearance, greekAppearance, primaryAppearance } =
    options.resolvedStyle;
  const structure = style.structure;
  const lexicon = initialMartyriaLexicons[structure.languageId];
  const flowDirection =
    lexicon.direction === 'rtl' ? 'rtl' : options.pageSetup.direction;
  const transliteratedNoteNames =
    structure.transliterateNoteNames && !lexicon.usesGreekScript
      ? lexicon.transliteratedNoteNames
      : null;
  const noteNames = transliteratedNoteNames ?? originalGreekNoteNames;
  const noteAppearance =
    transliteratedNoteNames == null ? greekAppearance : mainAppearance;
  // Glyphs are set in the document's music font at the requested size and
  // take the primary text's color and stroke.
  const glyphAppearance: InitialMartyriaAppearance = {
    fontFamily: options.pageSetup.neumeDefaultFontFamily,
    fontStyle: DEFAULT_FONT_STYLE,
    fontSize: options.glyphFontSize,
    color: primaryAppearance.color,
    strokeWidth: primaryAppearance.strokeWidth,
    strokeColor: primaryAppearance.strokeColor,
    fontVariantCaps: 'normal',
    fontVariantNumeric: 'normal',
    fontVariantLigatures: 'normal',
    fontVariantAlternates: 'normal',
  };

  // Music-font lettering sets every word and note in the music font's own
  // glyphs; the shared pitch run centers the marks on each note glyph.
  const usesMusicFontLettering =
    style.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont;

  const runs: ResolvedInitialMartyriaRun[] = [];
  for (const component of getInitialMartyriaComponents(
    structure,
    options.context.mode,
    flowDirection,
  )) {
    if (component.kind === 'text' || component.kind === 'stackedCharacters') {
      if (usesMusicFontLettering) {
        // Music-font lettering is only kept for structures with a glyph for
        // every word they print (getSupportedInitialMartyriaLettering).
        runs.push({
          kind: 'glyph',
          semantic: component.semantic,
          appearance: glyphAppearance,
          direction: 'ltr',
          glyphs: [musicFontLetteringGlyphs[component.semantic]!],
        });
        continue;
      }
      const usesGreekFont = textUsesGreekParagraphStyle(
        lexicon,
        component.semantic,
      );
      const appearance =
        component.semantic === 'numeral' &&
        style.useOrdinalForms &&
        initialMartyriaStructureSupportsOrdinalForms(structure)
          ? withOrdinalForms(usesGreekFont ? greekAppearance : mainAppearance)
          : usesGreekFont
            ? greekAppearance
            : mainAppearance;
      runs.push({
        kind: 'text',
        semantic: component.semantic,
        appearance,
        direction: usesGreekFont ? 'ltr' : lexicon.direction,
        languageTag: usesGreekFont ? 'el' : structure.languageId,
        content:
          component.kind === 'text'
            ? { layout: 'inline', text: component.content }
            : {
                layout: 'stackedCharacters',
                topCharacter: component.top,
                bottomCharacter: component.bottom,
              },
      });
      continue;
    }
    if (component.kind === 'modeSign') {
      runs.push({
        kind: 'glyph',
        semantic: 'modeSign',
        appearance: glyphAppearance,
        direction: usesMusicFontLettering ? 'ltr' : flowDirection,
        glyphs: [options.context.traditionalModeSign],
      });
      continue;
    }
    runs.push({
      kind: 'startingPitch',
      appearance: glyphAppearance,
      noteText: usesMusicFontLettering
        ? null
        : { ...noteNames, appearance: noteAppearance },
      direction: usesMusicFontLettering ? 'ltr' : noteNames.direction,
      cluster: options.context.pitchCluster,
    });
  }
  return {
    structure,
    flowDirection,
    runs,
  };
}

export type InitialMartyriaSeparator = 'none' | 'wordSpace' | 'fixed';

export function getInitialMartyriaFixedSeparatorSize(
  primaryTextFontSize: number,
) {
  return 0.43 * primaryTextFontSize;
}

/** The plagal abbreviation, whether set as text or as a music-font glyph. */
function isPlagalAbbreviationRun(run: ResolvedInitialMartyriaRun) {
  return (
    (run.kind === 'text' || run.kind === 'glyph') &&
    run.semantic === 'plagalAbbreviation'
  );
}

function isWordLikeRun(run: ResolvedInitialMartyriaRun) {
  return (
    run.kind === 'startingPitch' ||
    (run.kind === 'text' && !isPlagalAbbreviationRun(run))
  );
}

/**
 * The gap before runs[index]: a word space between two word-like runs, and
 * a fixed gap beside anything else.
 */
export function getInitialMartyriaSeparatorBefore(
  { runs }: Pick<InitialMartyriaStyleResolution, 'runs'>,
  index: number,
): InitialMartyriaSeparator {
  if (index <= 0 || index >= runs.length) {
    return 'none';
  }
  return isWordLikeRun(runs[index - 1]) && isWordLikeRun(runs[index])
    ? 'wordSpace'
    : 'fixed';
}

export function getInitialMartyriaSeparatorAfter(
  resolution: Pick<InitialMartyriaStyleResolution, 'runs'>,
  index: number,
): InitialMartyriaSeparator {
  const { runs } = resolution;
  if (index < 0 || index >= runs.length) {
    return 'none';
  }
  if (index !== runs.length - 1) {
    return getInitialMartyriaSeparatorBefore(resolution, index + 1);
  }
  return isPlagalAbbreviationRun(runs[index]) ? 'fixed' : 'none';
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
