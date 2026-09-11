import type { ModeKeyElement } from '@/models/Element';
import type { Neume } from '@/models/Neumes';
import type { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import {
  applyParagraphStyleOverrides,
  type ParagraphStyle,
  type ParagraphStyleOverrides,
  type ResolvedParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { getScaleNoteValue, ScaleNote } from '@/models/Scales';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import {
  composeNumericVariant,
  parseNumericVariant,
} from '@/utils/fontVariants';

import {
  DEFAULT_INITIAL_MARTYRIA_STYLE_ID,
  findInitialMartyriaStyle,
  getBuiltInInitialMartyriaStyle,
} from './InitialMartyriaBuiltInStyles';
import {
  arabicIndicDigits,
  initialMartyriaCanonicalNotes,
  initialMartyriaCanonicalNotesByScaleDegree,
  type InitialMartyriaLexicon,
  initialMartyriaLexicons,
  initialMartyriaSpokenLexicons,
  originalGreekNoteNames,
  romanNumerals,
  usesGreekScript,
} from './InitialMartyriaLexicon';
import {
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaAppearance,
  type InitialMartyriaCanonicalNote,
  type InitialMartyriaComponent,
  type InitialMartyriaContext,
  type InitialMartyriaModeNameSemantics,
  type InitialMartyriaStartingNoteRun,
  type InitialMartyriaStructure,
  initialMartyriaStructureHasOrdinalDigits,
  type InitialMartyriaStyle,
  type InitialMartyriaStyleResolution,
  type InitialMartyriaTextSemantic,
  type ModeKeyMode,
  type ResolvedInitialMartyriaRun,
  type ResolvedInitialMartyriaStyle,
  resolveInitialMartyriaFontFamily,
} from './InitialMartyriaStyle';

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
      ? semantics.numberingSystem ===
        INITIAL_MARTYRIA_NUMBERING_SYSTEMS.ArabicIndic
        ? arabicIndicDigits[modeNumber - 1]
        : String(modeNumber)
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
    ? lexicon.graveWordAfterLabel
      ? lexicon.graveWord!
      : null
    : getInitialMartyriaNumeralPronunciation(numeralSemantics, lexicon, mode);
  const marker = usesGraveWord
    ? lexicon.graveWordAfterLabel
      ? null
      : lexicon.graveWord
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
    let orderedNumeral = numeral;
    if (usesGraveNaming(structure, mode) && lexicon.graveWord != null) {
      if (lexicon.graveWordAfterLabel) {
        orderedNumeral = text('graveWord', lexicon.graveWord);
      } else {
        marker = text('graveWord', lexicon.graveWord);
      }
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
      orderedNumeral,
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

export function isInitialMartyriaModeNameSupported(
  structure: InitialMartyriaStructure,
) {
  const lexicon = initialMartyriaLexicons[structure.languageId];
  const displaysText =
    structure.modeIdentificationMethod !==
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign;
  return !(
    displaysText &&
    usesPlagalNaming(structure) &&
    !usesPlagalAbbreviationInText(structure, lexicon) &&
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
  fontFamily: string,
  neumeFontFamily: string,
): InitialMartyriaAppearance {
  return {
    fontFamily: resolveInitialMartyriaFontFamily(fontFamily, neumeFontFamily),
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
 * The typography of a style resolved through its paragraph style, with the
 * style's own overrides and then any element overrides folded in.
 */
export function resolveInitialMartyriaStyleAppearances(
  style: InitialMartyriaStyle,
  paragraphStyles: ParagraphStyle[],
  neumeFontFamily: string,
  elementOverrides?: ParagraphStyleOverrides,
): ResolvedInitialMartyriaStyle {
  const resolved = resolveParagraphStyle(
    paragraphStyles,
    style.paragraphStyleId,
    style.paragraphStyleOverrides,
  );
  applyParagraphStyleOverrides(resolved, elementOverrides);
  const greekFontFamily =
    usesGreekScript(style.structure.languageId) || style.greekFontFamily == null
      ? resolved.fontFamily
      : style.greekFontFamily;
  return {
    style,
    mainAppearance: toInitialMartyriaAppearance(
      resolved,
      resolved.fontFamily,
      neumeFontFamily,
    ),
    greekAppearance: toInitialMartyriaAppearance(
      resolved,
      greekFontFamily,
      neumeFontFamily,
    ),
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
 * The style an element renders with: its own, or else the score's, falling
 * back to the default built-in style when a reference no longer resolves.
 */
export function resolveModeKeyInitialMartyriaStyle(options: {
  element: Pick<
    ModeKeyElement,
    'initialMartyriaStyleId' | 'getParagraphStyleOverrides'
  >;
  pageSetup: Pick<
    PageSetup,
    'initialMartyriaStyleId' | 'neumeDefaultFontFamily'
  >;
  paragraphStyles: ParagraphStyle[];
  initialMartyriaStyles: InitialMartyriaStyle[];
}): ResolvedInitialMartyriaStyle {
  const styleId =
    options.element.initialMartyriaStyleId ??
    options.pageSetup.initialMartyriaStyleId;
  const style =
    findInitialMartyriaStyle(options.initialMartyriaStyles, styleId) ??
    getBuiltInInitialMartyriaStyle(DEFAULT_INITIAL_MARTYRIA_STYLE_ID);
  return resolveInitialMartyriaStyleAppearances(
    style,
    options.paragraphStyles,
    options.pageSetup.neumeDefaultFontFamily,
    options.element.getParagraphStyleOverrides(),
  );
}

/**
 * The spoken reading of a style for an element: the mode name selected by
 * the style's identification method, then the starting note.
 */
export function getInitialMartyriaPronunciation(
  structure: InitialMartyriaStructure,
  context: Pick<InitialMartyriaContext, 'mode' | 'physicalNote'>,
) {
  const modeName = getInitialMartyriaStylePronunciation(
    structure,
    initialMartyriaSpokenLexicons[structure.languageId],
    context.mode,
  );
  const startingNote = getInitialMartyriaStartingNotePronunciation(
    initialMartyriaLexicons[structure.languageId],
    context.physicalNote,
  );
  return `${modeName} ${startingNote}`;
}

export function resolveInitialMartyriaStyle(options: {
  context: InitialMartyriaContext;
  resolvedStyle: ResolvedInitialMartyriaStyle;
  pageSetup: Pick<PageSetup, 'direction' | 'neumeDefaultFontFamily'>;
  /** The size music-font glyphs (mode sign, pitch marks) are drawn at. */
  glyphFontSize: number;
}): InitialMartyriaStyleResolution {
  const { style, mainAppearance, greekAppearance } = options.resolvedStyle;
  const structure = style.structure;
  const lexicon = initialMartyriaLexicons[structure.languageId];
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
  // Glyphs are set in the document's music font at the requested size and
  // take the main text's color and stroke.
  const glyphAppearance: InitialMartyriaAppearance = {
    fontFamily: options.pageSetup.neumeDefaultFontFamily,
    fontStyle: DEFAULT_FONT_STYLE,
    fontSize: options.glyphFontSize,
    color: mainAppearance.color,
    strokeWidth: mainAppearance.strokeWidth,
    strokeColor: mainAppearance.strokeColor,
    fontVariantCaps: 'normal',
    fontVariantNumeric: 'normal',
    fontVariantLigatures: 'normal',
    fontVariantAlternates: 'normal',
  };

  const runs: ResolvedInitialMartyriaRun[] = [];
  for (const component of getInitialMartyriaComponents(
    structure,
    options.context.mode,
    flowDirection,
  )) {
    if (component.kind === 'text' || component.kind === 'stackedText') {
      const fontRole = component.fontRole ?? 'main';
      const appearance =
        component.semantic === 'numeral' &&
        style.useOrdinalForms &&
        initialMartyriaStructureHasOrdinalDigits(structure)
          ? withOrdinalForms(
              fontRole === 'greek' ? greekAppearance : mainAppearance,
            )
          : fontRole === 'greek'
            ? greekAppearance
            : mainAppearance;
      runs.push({
        kind: 'text',
        semantic: component.semantic,
        appearance,
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
    pronunciation: getInitialMartyriaPronunciation(structure, options.context),
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
