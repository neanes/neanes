import {
  type InitialMartyriaLexicon,
  initialMartyriaLexicons,
} from './InitialMartyriaLexicon';
import {
  getInitialMartyriaStructureKey,
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
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
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
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
      withNumeralStyles(ordinalEveryAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
    ],
    modeSign: [cardinalPostAbsoluteRule, ordinalEveryAbsoluteRule],
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
    modeSign: [ordinalEveryAbsoluteRule],
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: {
    text: [
      withNumeralStyles(ordinalEveryAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
    ],
    modeSign: [ordinalEveryAbsoluteRule],
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
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
      withNumeralStyles(ordinalEveryAbsoluteRule, [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ]),
    ],
    modeSign: [
      cardinalPostAbsoluteRule,
      ordinalEveryAbsoluteRule,
      ordinalPostAuthenticRule,
    ],
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

export const initialMartyriaNumeralKinds: InitialMartyriaNumeralKind[] = [
  INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
  INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
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
  const words =
    structure.numeralKind === INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal
      ? lexicon.cardinalWords
      : lexicon.ordinalWords;
  if (words == null) {
    return false;
  }
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

export function getSupportedInitialMartyriaNumeralForms(
  languageId: InitialMartyriaLanguageId,
) {
  const lexicon = initialMartyriaLexicons[languageId];
  return initialMartyriaNumeralForms.filter(
    (form) =>
      supportsNumeralForm(lexicon, form) &&
      initialMartyriaGrammarRules[languageId].text.some(
        (rule) =>
          rule.numeralKinds.includes(form.numeralKind) &&
          rule.numeralStyles.includes(form.numeralStyle),
      ),
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

const defaultNormalizationAxisPriority: readonly InitialMartyriaGrammarAxis[] =
  [
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

function getInitialMartyriaGrammarStructures(
  structure: InitialMartyriaStructure,
) {
  const candidates: InitialMartyriaStructure[] = [];
  const seen = new Set<string>();
  const addCandidate = (candidate: InitialMartyriaStructure) => {
    const signature = initialMartyriaGrammarAxes
      .map((axis) => getGrammarAxisValue(candidate, axis))
      .join('/');
    if (
      !seen.has(signature) &&
      isInitialMartyriaStructureSupported(candidate)
    ) {
      seen.add(signature);
      candidates.push(candidate);
    }
  };
  for (const modeIdentificationMethod of everyModeIdentificationMethod) {
    for (const candidate of getInitialMartyriaStructuresForMethod({
      languageId: structure.languageId,
      modeIdentificationMethod,
      transliterateNoteNames: structure.transliterateNoteNames,
      numberingSystem:
        structure.modeIdentificationMethod ===
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
          ? undefined
          : structure.numberingSystem,
    })) {
      addCandidate(candidate);
    }
  }
  return candidates;
}

function getGrammarAxisValue(
  structure: InitialMartyriaStructure,
  axis: InitialMartyriaGrammarAxis,
) {
  if (axis === 'numeralStyle' || axis === 'numberingSystem') {
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
  return candidates[0];
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
export function getInitialMartyriaStructureVariations<
  TStructure extends InitialMartyriaStructure,
  TValue,
>(
  current: TStructure,
  values: TValue[],
  apply: (structure: TStructure, value: TValue) => InitialMartyriaStructure,
): InitialMartyriaStructureVariation<TValue>[] {
  const currentKey = getInitialMartyriaStructureKey(current);
  const byKey = new Map<string, InitialMartyriaStructureVariation<TValue>>();
  for (const value of values) {
    const requested = apply(current, value);
    const requestedAxes = initialMartyriaGrammarAxes.filter(
      (axis) =>
        getGrammarAxisValue(requested, axis) !==
        getGrammarAxisValue(current, axis),
    );
    const structure = normalizeInitialMartyriaStructure(
      requested,
      requestedAxes,
    );
    if (
      requestedAxes.some(
        (axis) =>
          getGrammarAxisValue(structure, axis) !==
          getGrammarAxisValue(requested, axis),
      ) ||
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
  return (
    a.languageId === b.languageId &&
    a.transliterateNoteNames === b.transliterateNoteNames &&
    initialMartyriaGrammarAxes.every(
      (axis) => getGrammarAxisValue(a, axis) === getGrammarAxisValue(b, axis),
    )
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
    'languageId' | 'modeIdentificationMethod' | 'transliterateNoteNames'
  >,
): InitialMartyriaStructureVariation<InitialMartyriaStructure>[] {
  const seen = new Set<string>();
  const structures: InitialMartyriaStructureVariation<InitialMartyriaStructure>[] =
    [];
  for (const structure of getInitialMartyriaStructuresForMethod(base, true)) {
    const key = getInitialMartyriaStructureKey(structure);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    structures.push({
      value: structure,
      structure,
      key,
      current: false,
    });
  }
  return structures;
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
