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
  type InitialMartyriaNumeralKind,
  type InitialMartyriaNumeralQualifier,
  type InitialMartyriaNumeralStyle,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
} from './InitialMartyriaStyle';

export { getInitialMartyriaStructureKey } from './InitialMartyriaResolver';

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
 * Supported syntax and attested liturgical conventions for each language.
 * The citations and language data that motivate these rules live with the
 * corresponding entries in InitialMartyriaLexicon.
 */

const initialMartyriaGrammarRules: Record<
  InitialMartyriaLanguageId,
  readonly InitialMartyriaGrammarRule[]
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: [
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
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: [
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
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: [
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
      // Position is meaningful only when the Roman numeral is printed.
      modeIdentificationMethods: textModeIdentificationMethods,
      numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
      numeralStyles: [INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals],
      numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal],
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
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: [
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
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: [
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
      // Position is meaningful only when the Roman numeral is printed.
      modeIdentificationMethods: textModeIdentificationMethods,
      numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
      numeralStyles: [INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals],
      numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal],
      modeNamingSchemes: [INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute],
    },
    {
      // A prenominal digit ordinal carries the masculine nominative -й
      // ending: 1-й глас. A postnominal identifier remains Глас 1.
      // https://gramota.ru/biblioteka/spravochniki/pismovnik/kogda-nuzhny-bukvennye-narashcheniya-posle-tsifr
      modeIdentificationMethods: textModeIdentificationMethods,
      numeralKinds: [INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal],
      numeralStyles: [INITIAL_MARTYRIA_NUMERAL_STYLES.Digits],
      numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal],
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
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: [
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
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: [
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
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: [
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
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ],
      numeralQualifiers: [INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal],
      modeNamingSchemes: [
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
      ],
    },
  ],
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
    (structure.numberingSystem != null &&
      structure.numeralStyle !== INITIAL_MARTYRIA_NUMERAL_STYLES.Digits) ||
    (structure.numberingSystem ===
      INITIAL_MARTYRIA_NUMBERING_SYSTEMS.ArabicIndic &&
      structure.languageId !== INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic) ||
    !supportsNumeralForm(lexicon, structure) ||
    !initialMartyriaGrammarRules[structure.languageId].some((rule) =>
      grammarRuleMatches(rule, structure),
    )
  ) {
    return false;
  }
  return isInitialMartyriaModeNameSupported(structure);
}

export function getSupportedInitialMartyriaNumeralForms(
  languageId: InitialMartyriaLanguageId,
) {
  const lexicon = initialMartyriaLexicons[languageId];
  return initialMartyriaNumeralForms.filter(
    (form) =>
      supportsNumeralForm(lexicon, form) &&
      initialMartyriaGrammarRules[languageId].some(
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

function getInitialMartyriaGrammarStructures(
  structure: InitialMartyriaStructure,
) {
  const candidates: InitialMartyriaStructure[] = [];
  const seen = new Set<string>();
  for (const rule of initialMartyriaGrammarRules[structure.languageId]) {
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
                numberingSystem:
                  numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits &&
                  structure.languageId === INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic
                    ? structure.numberingSystem
                    : undefined,
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
    const numberingSystems =
      base.languageId === INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic &&
      form.numeralStyle === INITIAL_MARTYRIA_NUMERAL_STYLES.Digits
        ? Object.values(INITIAL_MARTYRIA_NUMBERING_SYSTEMS)
        : [undefined];
    for (const numberingSystem of numberingSystems) {
      for (const numeralQualifier of initialMartyriaNumeralQualifiers) {
        for (const modeNamingScheme of initialMartyriaModeNamingSchemes) {
          const structure: InitialMartyriaStructure = {
            ...base,
            ...form,
            numberingSystem,
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
          structures.push({
            value: structure,
            structure,
            key,
            current: false,
          });
        }
      }
    }
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
