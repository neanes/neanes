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
  type InitialMartyriaModeNamingScheme,
  type InitialMartyriaNamedStructure,
  type InitialMartyriaNumberingSystem,
  type InitialMartyriaNumeralKind,
  type InitialMartyriaNumeralQualifier,
  type InitialMartyriaNumeralStyle,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
  type InitialMartyriaTextStructure,
  isInitialMartyriaModeSignAloneStructure,
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
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSignAlone,
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
  structure: InitialMartyriaNamedStructure,
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
 * are never a reason to reject. The sign group alone has no words, so every
 * language can set it.
 */
export function isInitialMartyriaStructureSupported(
  structure: InitialMartyriaStructure,
) {
  if (isInitialMartyriaModeSignAloneStructure(structure)) {
    return true;
  }
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

interface InitialMartyriaEnumerationBase {
  languageId: InitialMartyriaLanguageId;
  labelVariant?: InitialMartyriaLabelVariant;
  modeIdentificationMethod: InitialMartyriaModeIdentificationMethod;
  transliterateNoteNames: boolean;
  plagalAbbreviationWithModeSign?: boolean;
  numberingSystem?: InitialMartyriaNumberingSystem;
}

/** The axes an enumeration keeps fixed that every structure takes part in. */
function getEnumerationSharedAxes(base: InitialMartyriaEnumerationBase) {
  return {
    languageId: base.languageId,
    transliterateNoteNames: base.transliterateNoteNames,
    plagalAbbreviationWithModeSign: base.plagalAbbreviationWithModeSign,
  };
}

/** The axes an enumeration keeps fixed, as set on every named structure. */
function getEnumerationCommonAxes(base: InitialMartyriaEnumerationBase) {
  return {
    ...getEnumerationSharedAxes(base),
    labelVariant: base.labelVariant,
  };
}

function getInitialMartyriaStructuresForMethod(
  base: InitialMartyriaEnumerationBase,
  includeAllNumberingSystems = false,
) {
  const structures: InitialMartyriaStructure[] = [];
  const method = base.modeIdentificationMethod;
  if (method === INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSignAlone) {
    // No word for the mode, so the label variant takes no part.
    return [
      { ...getEnumerationSharedAxes(base), modeIdentificationMethod: method },
    ];
  }
  if (method === INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign) {
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
            modeIdentificationMethod: method,
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

/**
 * A new style with its own id. The structure must be one the grammar
 * supports, as every common and enumerated wording is.
 */
export function createInitialMartyriaStyle(
  options: Omit<InitialMartyriaStyle, 'id'>,
): InitialMartyriaStyle {
  return cloneInitialMartyriaStyle({
    ...options,
    id: crypto.randomUUID(),
    lettering: getSupportedInitialMartyriaLettering(
      options.lettering,
      options.structure,
    ),
  });
}
