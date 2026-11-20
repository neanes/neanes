import {
  getForInitialMartyriaLabelVariant,
  getInitialMartyriaLabelVariants,
  getInitialMartyriaLexicon,
  type InitialMartyriaLexicon,
} from './InitialMartyriaLexicon';
import {
  getInitialMartyriaStructureKey,
  getSupportedInitialMartyriaLettering,
  isInitialMartyriaModeNameSupported,
} from './InitialMartyriaResolver';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_LABEL_VARIANTS,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLabelVariant,
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

export const initialMartyriaModeIdentificationMethods = [
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
] as const;

export const initialMartyriaModeNamingSchemes = [
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
] as const;

const relationalModeNamingSchemes = [
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
] as const;

export const initialMartyriaNumeralQualifiers = [
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
  numeralQualifiers: initialMartyriaNumeralQualifiers,
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
          modeNamingSchemes: initialMartyriaModeNamingSchemes,
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
          modeNamingSchemes: initialMartyriaModeNamingSchemes,
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
        modeNamingSchemes: [
          ...relationalModeNamingSchemes,
          INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        ],
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

function keepModeNamingSchemes<T extends InitialMartyriaModeNameGrammarRule>(
  rules: readonly T[],
  modeNamingSchemes: readonly InitialMartyriaModeNamingScheme[],
): T[] {
  return rules
    .map((rule) => ({
      ...rule,
      modeNamingSchemes: rule.modeNamingSchemes.filter((scheme) =>
        modeNamingSchemes.includes(scheme),
      ),
    }))
    .filter((rule) => rule.modeNamingSchemes.length > 0);
}

/** A language's grammar narrowed to some of its mode naming schemes. */
function withModeNamingSchemes(
  grammar: InitialMartyriaLanguageGrammar,
  modeNamingSchemes: readonly InitialMartyriaModeNamingScheme[],
): InitialMartyriaLanguageGrammar {
  return {
    text: keepModeNamingSchemes(grammar.text, modeNamingSchemes),
    modeSign: keepModeNamingSchemes(grammar.modeSign, modeNamingSchemes),
  };
}

/*
 * The grammar of a label variant, in place of its language's. English Tone
 * counts the modes 1-8 and never names them plagal: Tone 5, Tone V, Tone
 * Five, Fifth Tone, 5th Tone, and Tone beside the sign group.
 */
const initialMartyriaLabelVariantGrammarRules: Partial<
  Record<
    InitialMartyriaLanguageId,
    Partial<Record<InitialMartyriaLabelVariant, InitialMartyriaLanguageGrammar>>
  >
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: {
    [INITIAL_MARTYRIA_LABEL_VARIANTS.Tone]: withModeNamingSchemes(
      initialMartyriaGrammarRules[INITIAL_MARTYRIA_LANGUAGE_IDS.English],
      [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
    ),
  },
};

function getInitialMartyriaGrammar(
  structure: Pick<InitialMartyriaStructure, 'languageId' | 'labelVariant'>,
): InitialMartyriaLanguageGrammar {
  return getForInitialMartyriaLabelVariant(
    structure,
    initialMartyriaGrammarRules,
    initialMartyriaLabelVariantGrammarRules,
  );
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
  if (
    structure.labelVariant != null &&
    !getInitialMartyriaLabelVariants(structure.languageId).includes(
      structure.labelVariant,
    )
  ) {
    return false;
  }
  const lexicon = getInitialMartyriaLexicon(structure);
  const grammar = getInitialMartyriaGrammar(structure);
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

type InitialMartyriaGrammarAxis =
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
  labelVariant?: InitialMartyriaLabelVariant;
  modeIdentificationMethod: InitialMartyriaModeIdentificationMethod;
  transliterateNoteNames: boolean;
  plagalAbbreviationWithModeSign?: boolean;
  numberingSystem?: InitialMartyriaNumberingSystem;
}

/** The axes an enumeration keeps fixed, as set on every structure. */
function getEnumerationCommonAxes(base: InitialMartyriaEnumerationBase) {
  return {
    languageId: base.languageId,
    labelVariant: base.labelVariant,
    transliterateNoteNames: base.transliterateNoteNames,
    plagalAbbreviationWithModeSign: base.plagalAbbreviationWithModeSign,
  };
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
            ...getEnumerationCommonAxes(base),
            modeIdentificationMethod:
              INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
            numeralKind,
            numeralQualifier,
            modeNamingScheme,
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
            ...getEnumerationCommonAxes(base),
            modeIdentificationMethod: base.modeIdentificationMethod,
            ...form,
            numberingSystem,
            numeralQualifier,
            modeNamingScheme,
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

// The candidate set depends only on the language and label variant, the
// transliteration and plagal abbreviation choices, and the numbering system,
// so the enumeration (which tests roughly a hundred candidates for support)
// is done once per combination instead of once per unsupported value in
// every strip the styles dialog builds.
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
    structure.labelVariant,
    structure.transliterateNoteNames,
    structure.plagalAbbreviationWithModeSign,
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
  for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
    for (const candidate of getInitialMartyriaStructuresForMethod({
      ...getEnumerationCommonAxes(structure),
      modeIdentificationMethod,
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
) {
  return initialMartyriaGrammarAxes.filter(
    (axis) => getGrammarAxisValue(a, axis) !== getGrammarAxisValue(b, axis),
  ).length;
}

/** Moves an unsupported structure to the nearest supported one. */
export function normalizeInitialMartyriaStructure(
  structure: InitialMartyriaStructure,
): InitialMartyriaStructure {
  if (isInitialMartyriaStructureSupported(structure)) {
    return structure;
  }
  const candidates = [...getInitialMartyriaGrammarStructures(structure)];
  candidates.sort((a, b) => {
    const totalDifference =
      countAxisDifferences(a, structure) - countAxisDifferences(b, structure);
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

/**
 * Every distinct structure a language and identification method can reach,
 * de-duplicated by what it prints, in the grammar's presentation order.
 */
export function enumerateInitialMartyriaStructures(
  base: Pick<
    InitialMartyriaStructure,
    | 'languageId'
    | 'labelVariant'
    | 'modeIdentificationMethod'
    | 'transliterateNoteNames'
    | 'plagalAbbreviationWithModeSign'
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
