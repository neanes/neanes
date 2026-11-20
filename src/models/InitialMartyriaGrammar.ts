import {
  type InitialMartyriaLexicon,
  initialMartyriaLexicons,
} from './InitialMartyriaLexicon';
import {
  getInitialMartyriaStructureKey,
  getSupportedInitialMartyriaLettering,
  isInitialMartyriaModeNameSupported,
} from './InitialMartyriaResolver';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLanguageId,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaModeNameSemantics,
  type InitialMartyriaModeNamingScheme,
  type InitialMartyriaNumberingSystem,
  type InitialMartyriaNumeralKind,
  type InitialMartyriaNumeralQualifier,
  type InitialMartyriaNumeralStyle,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
  type InitialMartyriaTextStructure,
  withInitialMartyriaModeIdentificationMethod,
} from './InitialMartyriaStyle';

export { getInitialMartyriaStructureKey } from './InitialMartyriaResolver';

interface InitialMartyriaModeNameGrammarRule {
  numeralKinds: readonly InitialMartyriaNumeralKind[];
  numeralQualifiers: readonly InitialMartyriaNumeralQualifier[];
  modeNamingSchemes: readonly InitialMartyriaModeNamingScheme[];
}

interface InitialMartyriaTextGrammarRule extends InitialMartyriaModeNameGrammarRule {
  numeralStyles: readonly InitialMartyriaNumeralStyle[];
}

interface InitialMartyriaLanguageGrammar {
  text: readonly InitialMartyriaTextGrammarRule[];
  modeSign: readonly InitialMartyriaModeNameGrammarRule[];
}

const everyModeIdentificationMethod = [
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
] as const;

const everyModeNamingScheme = [
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
] as const;

const relationalModeNamingSchemes = [
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
] as const;

const everyNumeralQualifier = [
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
] as const;

/*
 * Supported syntax and attested liturgical conventions for each language.
 * The citations and language data that motivate these rules live with the
 * corresponding entries in InitialMartyriaLexicon.
 */

function withNumeralStyles(
  rule: InitialMartyriaModeNameGrammarRule,
  numeralStyles: readonly InitialMartyriaNumeralStyle[],
): InitialMartyriaTextGrammarRule {
  return { ...rule, numeralStyles };
}

const cardinalPostAbsoluteRule = {
  numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal],
  numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
  modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
} satisfies InitialMartyriaModeNameGrammarRule;

const ordinalPostAbsoluteRule = {
  numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
  numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
  modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
} satisfies InitialMartyriaModeNameGrammarRule;

const ordinalEveryAbsoluteRule = {
  ...ordinalPostAbsoluteRule,
  numeralQualifiers: everyNumeralQualifier,
} satisfies InitialMartyriaModeNameGrammarRule;

const ordinalPostAuthenticRule = {
  ...ordinalPostAbsoluteRule,
  modeNamingSchemes: [
    INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
  ],
} satisfies InitialMartyriaModeNameGrammarRule;

const ordinalPostAbsoluteAndAuthenticRule = {
  ...ordinalPostAbsoluteRule,
  modeNamingSchemes: [
    INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
  ],
} satisfies InitialMartyriaModeNameGrammarRule;

const initialMartyriaGrammarRules: Record<
  InitialMartyriaLanguageId,
  InitialMartyriaLanguageGrammar
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: {
    text: [
      withNumeralStyles(ordinalPostAuthenticRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
    ],
    modeSign: [ordinalPostAuthenticRule],
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: {
    text: [
      withNumeralStyles(
        {
          numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal],
          numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
          modeNamingSchemes: everyModeNamingScheme,
        },
        [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
      ),
      withNumeralStyles(
        {
          numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
          numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal],
          modeNamingSchemes: everyModeNamingScheme,
        },
        [
          INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        ],
      ),
    ],
    modeSign: [
      {
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
        modeNamingSchemes: relationalModeNamingSchemes,
      },
      {
        numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
        numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal],
        modeNamingSchemes: relationalModeNamingSchemes,
      },
    ],
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: {
    text: [
      withNumeralStyles(cardinalPostAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      ]),
      withNumeralStyles(ordinalPostAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      ]),
      withNumeralStyles(ordinalEveryAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
    ],
    modeSign: [cardinalPostAbsoluteRule, ordinalPostAbsoluteRule],
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: {
    text: [
      withNumeralStyles(ordinalPostAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
      ]),
      withNumeralStyles(ordinalEveryAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
    ],
    modeSign: [ordinalPostAbsoluteRule],
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: {
    text: [
      withNumeralStyles(ordinalEveryAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
    ],
    modeSign: [ordinalPostAbsoluteRule],
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: {
    text: [
      withNumeralStyles(ordinalPostAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
    ],
    modeSign: [ordinalPostAbsoluteRule],
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: {
    text: [
      withNumeralStyles(cardinalPostAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      ]),
    ],
    modeSign: [ordinalPostAbsoluteRule],
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: {
    text: [
      withNumeralStyles(cardinalPostAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
      withNumeralStyles(ordinalPostAbsoluteAndAuthenticRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
    ],
    modeSign: [cardinalPostAbsoluteRule, ordinalPostAbsoluteAndAuthenticRule],
  },
};

/*
 * The structure space. Each axis lists its candidate values in the order the
 * UI presents them; simpler values come first so that a de-duplicated set
 * keeps the least surprising representative.
 */

export interface InitialMartyriaNumeralForm {
  numeralKind: InitialMartyriaNumeralKind;
  numeralStyle: InitialMartyriaNumeralStyle;
}

const initialMartyriaNumeralKinds: InitialMartyriaNumeralKind[] = [
  INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
  INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
];

export const initialMartyriaNumeralForms: InitialMartyriaNumeralForm[] = [
  INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
  INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
  INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
  INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
].flatMap((numeralStyle) =>
  initialMartyriaNumeralKinds.map((numeralKind) => ({
    numeralKind,
    numeralStyle,
  })),
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
  switch (form.numeralStyle) {
    case INITIAL_MARTYRIA_NUMERAL_STYLES.Words:
      return (
        form.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal ||
        lexicon.cardinalWords != null
      );
    case INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals:
      return lexicon.alphabeticNumerals != null;
    default:
      return true;
  }
}

function modeNameGrammarRuleMatches(
  rule: InitialMartyriaModeNameGrammarRule,
  structure: InitialMartyriaStructure,
) {
  return (
    rule.numeralKinds.includes(structure.numeralKind) &&
    rule.numeralQualifiers.includes(structure.numeralQualifier) &&
    rule.modeNamingSchemes.includes(structure.modeNamingScheme)
  );
}

function textGrammarRuleMatches(
  rule: InitialMartyriaTextGrammarRule,
  structure: InitialMartyriaTextStructure,
) {
  return (
    modeNameGrammarRuleMatches(rule, structure) &&
    rule.numeralStyles.includes(structure.numeralStyle)
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
  const grammar = initialMartyriaGrammarRules[structure.languageId];
  if (
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    return (
      grammar.modeSign.some((rule) =>
        modeNameGrammarRuleMatches(rule, structure),
      ) && isInitialMartyriaModeNameSupported(structure)
    );
  }
  return (
    (structure.numberingSystem == null ||
      structure.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits) &&
    (structure.numberingSystem !==
      INITIAL_MARTYRIA_NUMBERING_SYSTEMS.ArabicIndic ||
      structure.languageId === INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic) &&
    supportsNumeralForm(lexicon, structure) &&
    grammar.text.some((rule) => textGrammarRuleMatches(rule, structure)) &&
    isInitialMartyriaModeNameSupported(structure)
  );
}

export type InitialMartyriaGrammarAxis =
  | 'modeIdentificationMethod'
  | keyof InitialMartyriaModeNameSemantics
  | 'numeralStyle'
  | 'numberingSystem';

const initialMartyriaGrammarAxes: readonly InitialMartyriaGrammarAxis[] = [
  'modeIdentificationMethod',
  'numeralKind',
  'numeralStyle',
  'numberingSystem',
  'numeralQualifier',
  'modeNamingScheme',
];

interface InitialMartyriaEnumerationBase {
  languageId: InitialMartyriaLanguageId;
  modeIdentificationMethod: InitialMartyriaModeIdentificationMethod;
  transliterateNoteNames: boolean;
  numberingSystem?: InitialMartyriaNumberingSystem;
}

function getInitialMartyriaStructuresForMethod(
  base: InitialMartyriaEnumerationBase,
  includeAllNumberingSystems = false,
) {
  const structures: InitialMartyriaStructure[] = [];
  if (
    base.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
  ) {
    for (const numeralKind of initialMartyriaNumeralKinds) {
      for (const numeralQualifier of initialMartyriaNumeralQualifiers) {
        for (const modeNamingScheme of initialMartyriaModeNamingSchemes) {
          const structure: InitialMartyriaStructure = {
            languageId: base.languageId,
            modeIdentificationMethod:
              INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
            numeralKind,
            numeralQualifier,
            modeNamingScheme,
            transliterateNoteNames: base.transliterateNoteNames,
          };
          if (isInitialMartyriaStructureSupported(structure)) {
            structures.push(structure);
          }
        }
      }
    }
    return structures;
  }

  for (const form of initialMartyriaNumeralForms) {
    const numberingSystems =
      base.languageId === INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic &&
      form.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
        ? includeAllNumberingSystems
          ? [undefined, INITIAL_MARTYRIA_NUMBERING_SYSTEMS.ArabicIndic]
          : [base.numberingSystem]
        : [undefined];
    for (const numberingSystem of numberingSystems) {
      for (const numeralQualifier of initialMartyriaNumeralQualifiers) {
        for (const modeNamingScheme of initialMartyriaModeNamingSchemes) {
          const structure: InitialMartyriaStructure = {
            languageId: base.languageId,
            modeIdentificationMethod: base.modeIdentificationMethod,
            ...form,
            numberingSystem,
            numeralQualifier,
            modeNamingScheme,
            transliterateNoteNames: base.transliterateNoteNames,
          };
          if (isInitialMartyriaStructureSupported(structure)) {
            structures.push(structure);
          }
        }
      }
    }
  }
  return structures;
}

// The candidate set depends only on the language, the transliteration
// choice, and the numbering system, so the enumeration (which tests roughly
// a hundred candidates for support) is done once per combination instead of
// once per unsupported value in every strip the styles dialog builds.
const grammarStructureCache = new Map<string, InitialMartyriaStructure[]>();

function getInitialMartyriaGrammarStructures(
  structure: InitialMartyriaStructure,
) {
  const numberingSystem =
    structure.modeIdentificationMethod ===
    INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
      ? undefined
      : structure.numberingSystem;
  const cacheKey = [
    structure.languageId,
    structure.transliterateNoteNames,
    numberingSystem,
  ].join('/');
  const cached = grammarStructureCache.get(cacheKey);
  if (cached != null) {
    return cached;
  }

  const candidates: InitialMartyriaStructure[] = [];
  const seen = new Set<string>();
  const addCandidate = (candidate: InitialMartyriaStructure) => {
    const signature = initialMartyriaGrammarAxes
      .map((axis) => getGrammarAxisValue(candidate, axis))
      .join('/');
    if (!seen.has(signature)) {
      seen.add(signature);
      candidates.push(candidate);
    }
  };
  for (const modeIdentificationMethod of everyModeIdentificationMethod) {
    for (const candidate of getInitialMartyriaStructuresForMethod({
      languageId: structure.languageId,
      modeIdentificationMethod,
      transliterateNoteNames: structure.transliterateNoteNames,
      numberingSystem,
    })) {
      addCandidate(candidate);
    }
  }
  grammarStructureCache.set(cacheKey, candidates);
  return candidates;
}

/** Axes of a printed numeral, which a sign does not have. */
function isPrintedNumeralAxis(axis: InitialMartyriaGrammarAxis) {
  return axis === 'numeralStyle' || axis === 'numberingSystem';
}

function getGrammarAxisValue(
  structure: InitialMartyriaStructure,
  axis: InitialMartyriaGrammarAxis,
) {
  if (isPrintedNumeralAxis(axis)) {
    return structure.modeIdentificationMethod ===
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
      ? undefined
      : structure[axis];
  }
  return structure[axis];
}

function countAxisDifferences(
  a: InitialMartyriaStructure,
  b: InitialMartyriaStructure,
  axes: readonly InitialMartyriaGrammarAxis[],
) {
  return axes.filter(
    (axis) => getGrammarAxisValue(a, axis) !== getGrammarAxisValue(b, axis),
  ).length;
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
  const candidates = [...getInitialMartyriaGrammarStructures(structure)];
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

    // The axes are listed most significant first, so the first axis where
    // the candidates differ decides the tie.
    for (const axis of initialMartyriaGrammarAxes) {
      const aDiffers =
        getGrammarAxisValue(a, axis) !== getGrammarAxisValue(structure, axis);
      const bDiffers =
        getGrammarAxisValue(b, axis) !== getGrammarAxisValue(structure, axis);
      if (aDiffers !== bDiffers) {
        return aDiffers ? 1 : -1;
      }
    }
    return 0;
  });
  const nearest = candidates[0];
  if (nearest == null) {
    throw new Error(
      `No supported initial martyria structure for language ${structure.languageId}`,
    );
  }
  // The candidates are cached and shared, so callers get their own copy.
  return { ...nearest };
}

export function initialMartyriaStructuresEqual(
  a: InitialMartyriaStructure,
  b: InitialMartyriaStructure,
) {
  return (
    getInitialMartyriaStructureKey(a) === getInitialMartyriaStructureKey(b)
  );
}

/**
 * Every distinct structure a language and identification method can reach,
 * de-duplicated by what it prints, in the grammar's presentation order.
 */
export function enumerateInitialMartyriaStructures(
  base: Pick<
    InitialMartyriaStructure,
    'languageId' | 'modeIdentificationMethod' | 'transliterateNoteNames'
  >,
) {
  const seen = new Set<string>();
  const structures: { structure: InitialMartyriaStructure; key: string }[] = [];
  for (const structure of getInitialMartyriaStructuresForMethod(base, true)) {
    const key = getInitialMartyriaStructureKey(structure);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    structures.push({ structure, key });
  }
  return structures;
}

/**
 * The structure a style takes on when its identification method changes:
 * its wording carries over where the method supports it.
 */
export function withSupportedInitialMartyriaModeIdentificationMethod(
  structure: InitialMartyriaStructure,
  modeIdentificationMethod: InitialMartyriaModeIdentificationMethod,
) {
  return normalizeInitialMartyriaStructure(
    withInitialMartyriaModeIdentificationMethod(
      structure,
      modeIdentificationMethod,
    ),
    ['modeIdentificationMethod'],
  );
}

export function createInitialMartyriaStyle(
  options: Omit<InitialMartyriaStyle, 'id'>,
): InitialMartyriaStyle {
  const structure = normalizeInitialMartyriaStructure(options.structure);
  return cloneInitialMartyriaStyle({
    ...options,
    id: crypto.randomUUID(),
    structure,
    lettering: getSupportedInitialMartyriaLettering(
      options.lettering,
      structure,
    ),
  });
}
