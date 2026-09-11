import { describe, expect, it } from 'vitest';

import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  builtInInitialMartyriaStyles,
  createDefaultInitialMartyriaTypography,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  createInitialMartyriaStyle,
  enumerateInitialMartyriaStructures,
  findInitialMartyriaStyleWithStructure,
  getInitialMartyriaStructureKey,
  getInitialMartyriaStructureVariations,
  getSupportedInitialMartyriaNumeralForms,
  initialMartyriaModeIdentificationMethods,
  initialMartyriaNumeralForms,
  initialMartyriaNumeralKinds,
  initialMartyriaStructuresEqual,
  isInitialMartyriaStructureSupported,
  normalizeInitialMartyriaStructure,
} from '@/models/InitialMartyriaGrammar';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaModeIdentificationMethod,
  type InitialMartyriaModeNameSemantics,
  type InitialMartyriaStructure,
  type InitialMartyriaWrittenModeNameSemantics,
  withInitialMartyriaModeIdentificationMethod,
} from '@/models/InitialMartyriaStyle';

import { attestedStructures } from './InitialMartyriaStyle.testData';
import {
  elementForMode,
  resolve,
  styleFor,
  textOf,
} from './InitialMartyriaStyle.testHelpers';

describe('InitialMartyriaGrammar', () => {
  it('supports every attested structure', () => {
    for (const [label, structure] of Object.entries(attestedStructures)) {
      expect(
        `${label}: ${isInitialMartyriaStructureSupported(structure)}`,
      ).toBe(`${label}: true`);
    }
  });

  const greekText = attestedStructures['greek-mode-names'];
  const englishText = attestedStructures['english-mode-names'];

  const signature = (structure: InitialMartyriaStructure) => {
    const axes: string[] = [
      structure.numeralKind,
      structure.numeralQualifier,
      structure.modeNamingScheme,
    ];
    if (
      structure.modeIdentificationMethod !==
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
    ) {
      axes.unshift(structure.numeralStyle);
    }
    if (
      structure.modeIdentificationMethod !==
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign &&
      structure.numberingSystem ===
        INITIAL_MARTYRIA_NUMBERING_SYSTEMS.ArabicIndic
    ) {
      axes.push(structure.numberingSystem);
    }
    return axes.join('/');
  };

  const grammarStructure = (
    languageId: InitialMartyriaLanguageId,
    changes: Partial<
      InitialMartyriaModeNameSemantics &
        InitialMartyriaWrittenModeNameSemantics & {
          modeIdentificationMethod: InitialMartyriaModeIdentificationMethod;
          transliterateNoteNames: boolean;
        }
    >,
  ): InitialMartyriaStructure => {
    const base = builtInInitialMartyriaStyles.find(
      (style) => style.structure.languageId === languageId,
    )!.structure;
    const modeIdentificationMethod =
      changes.modeIdentificationMethod ?? base.modeIdentificationMethod;
    const common = {
      languageId,
      numeralKind: changes.numeralKind ?? base.numeralKind,
      numeralQualifier: changes.numeralQualifier ?? base.numeralQualifier,
      modeNamingScheme: changes.modeNamingScheme ?? base.modeNamingScheme,
      transliterateNoteNames:
        changes.transliterateNoteNames ?? base.transliterateNoteNames,
    };
    if (
      modeIdentificationMethod ===
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
    ) {
      return { ...common, modeIdentificationMethod };
    }
    return {
      ...common,
      modeIdentificationMethod,
      numeralStyle:
        changes.numeralStyle ??
        (base.modeIdentificationMethod ===
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
          ? INITIAL_MARTYRIA_NUMERAL_STYLES.Words
          : base.numeralStyle),
      numberingSystem:
        changes.numberingSystem ??
        (base.modeIdentificationMethod ===
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
          ? undefined
          : base.numberingSystem),
    };
  };

  const textStructureSignatures = {
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: [
      'alphabetic-numerals/ordinal/postnominal/authentic-counterpart',
      'words/ordinal/postnominal/authentic-counterpart',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: [
      'digits/cardinal/postnominal/absolute',
      'digits/cardinal/postnominal/authentic-counterpart',
      'digits/cardinal/postnominal/plagal-class',
      'digits/ordinal/prenominal/absolute',
      'digits/ordinal/prenominal/authentic-counterpart',
      'digits/ordinal/prenominal/plagal-class',
      'roman-numerals/cardinal/postnominal/absolute',
      'roman-numerals/cardinal/postnominal/authentic-counterpart',
      'roman-numerals/cardinal/postnominal/plagal-class',
      'words/cardinal/postnominal/absolute',
      'words/cardinal/postnominal/authentic-counterpart',
      'words/cardinal/postnominal/plagal-class',
      'words/ordinal/prenominal/absolute',
      'words/ordinal/prenominal/authentic-counterpart',
      'words/ordinal/prenominal/plagal-class',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: [
      'digits/cardinal/postnominal/absolute',
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/prenominal/absolute',
      'roman-numerals/cardinal/postnominal/absolute',
      'roman-numerals/ordinal/postnominal/absolute',
      'roman-numerals/ordinal/prenominal/absolute',
      'words/cardinal/postnominal/absolute',
      'words/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: [
      'digits/ordinal/postnominal/absolute',
      'alphabetic-numerals/ordinal/postnominal/absolute',
      'words/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: [
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/prenominal/absolute',
      'roman-numerals/ordinal/postnominal/absolute',
      'roman-numerals/ordinal/prenominal/absolute',
      'words/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: [
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/postnominal/absolute/arab',
      'words/ordinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: [
      'digits/cardinal/postnominal/absolute',
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/prenominal/absolute',
      'roman-numerals/cardinal/postnominal/absolute',
      'roman-numerals/ordinal/postnominal/absolute',
      'roman-numerals/ordinal/prenominal/absolute',
      'words/cardinal/postnominal/absolute',
      'words/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: [
      'digits/cardinal/postnominal/absolute',
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/postnominal/authentic-counterpart',
      'roman-numerals/cardinal/postnominal/absolute',
      'words/cardinal/postnominal/absolute',
      'words/ordinal/postnominal/absolute',
      'words/ordinal/postnominal/authentic-counterpart',
    ],
  } satisfies Record<InitialMartyriaLanguageId, string[]>;

  const modeSignStructureSignatures = {
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: [
      'ordinal/postnominal/authentic-counterpart',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: [
      'cardinal/postnominal/authentic-counterpart',
      'cardinal/postnominal/plagal-class',
      'ordinal/prenominal/authentic-counterpart',
      'ordinal/prenominal/plagal-class',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: [
      'cardinal/postnominal/absolute',
      'ordinal/postnominal/absolute',
      'ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: [
      'ordinal/postnominal/absolute',
      'ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: [
      'ordinal/postnominal/absolute',
      'ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: ['ordinal/postnominal/absolute'],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: [
      'cardinal/postnominal/absolute',
      'ordinal/postnominal/absolute',
      'ordinal/postnominal/authentic-counterpart',
      'ordinal/prenominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: [
      'cardinal/postnominal/absolute',
      'ordinal/postnominal/absolute',
      'ordinal/postnominal/authentic-counterpart',
    ],
  } satisfies Record<InitialMartyriaLanguageId, string[]>;

  it('derives only numeral forms supported by each mode-name convention', () => {
    const forms = (languageId: InitialMartyriaLanguageId) =>
      getSupportedInitialMartyriaNumeralForms(languageId).map(
        (form) => `${form.numeralStyle}/${form.numeralKind}`,
      );

    expect(
      Object.fromEntries(
        initialMartyriaLanguageIds.map((languageId) => [
          languageId,
          forms(languageId),
        ]),
      ),
    ).toEqual({
      el: ['alphabetic-numerals/ordinal', 'words/ordinal'],
      en: [
        'digits/cardinal',
        'digits/ordinal',
        'roman-numerals/cardinal',
        'words/cardinal',
        'words/ordinal',
      ],
      es: [
        'digits/cardinal',
        'digits/ordinal',
        'roman-numerals/cardinal',
        'roman-numerals/ordinal',
        'words/cardinal',
        'words/ordinal',
      ],
      cu: ['digits/ordinal', 'alphabetic-numerals/ordinal', 'words/ordinal'],
      ru: ['digits/ordinal', 'roman-numerals/ordinal', 'words/ordinal'],
      ar: ['digits/ordinal', 'words/ordinal'],
      ro: [
        'digits/cardinal',
        'digits/ordinal',
        'roman-numerals/cardinal',
        'roman-numerals/ordinal',
        'words/cardinal',
        'words/ordinal',
      ],
      id: [
        'digits/cardinal',
        'digits/ordinal',
        'roman-numerals/cardinal',
        'words/cardinal',
        'words/ordinal',
      ],
    });
  });

  it('renders prenominal Roman ordinals with the language-specific label form', () => {
    const structures = [
      [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish, ['II', 'tono.'], 'Segundo tono'],
      [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, ['II', 'глас.'], 'Второй глас'],
    ] as const;

    for (const [
      languageId,
      expectedText,
      expectedPronunciation,
    ] of structures) {
      const structure = grammarStructure(languageId, {
        modeIdentificationMethod:
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      });
      const resolution = resolve(styleFor(structure), elementForMode(2));

      expect(textOf(resolution.runs)).toEqual(expectedText);
      expect(resolution.pronunciation.startsWith(expectedPronunciation)).toBe(
        true,
      );
    }
  });

  it('accepts and rejects complete supported mode-name constructions', () => {
    const cases: [string, InitialMartyriaStructure, boolean][] = [
      ['Greek alphabetic authentic name', greekText, true],
      [
        'Greek fully inflected authentic name',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Greek, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        }),
        true,
      ],
      [
        'Greek absolute numbering',
        {
          ...greekText,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        },
        false,
      ],
      [
        'Greek prenominal order',
        {
          ...greekText,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        false,
      ],
      [
        'Greek Roman numerals',
        {
          ...greekText,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        },
        false,
      ],
      [
        'English postnominal cardinal words',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.English, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        }),
        true,
      ],
      [
        'English prenominal ordinal digits',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.English, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        true,
      ],
      [
        'English prenominal cardinals',
        {
          ...englishText,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        },
        false,
      ],
      [
        'English postnominal ordinals',
        {
          ...englishText,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        },
        false,
      ],
      [
        'English ordinal Roman numerals',
        {
          ...englishText,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        },
        false,
      ],
      [
        'English sign-only absolute numbering',
        {
          ...attestedStructures['english-authentic-counterpart-number-sign'],
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        },
        false,
      ],
      [
        'English sign-only authentic counterpart',
        attestedStructures['english-authentic-counterpart-number-sign'],
        true,
      ],
      [
        'Spanish postnominal cardinal digits',
        attestedStructures['spanish-tono-number'],
        true,
      ],
      [
        'Spanish prenominal ordinal words',
        attestedStructures['spanish-ordinal-tono'],
        true,
      ],
      [
        'Spanish cardinal Roman reading',
        {
          ...attestedStructures['spanish-tono-roman-numeral'],
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        },
        true,
      ],
      [
        'Spanish prenominal ordinal Roman numeral',
        {
          ...attestedStructures['spanish-tono-roman-numeral'],
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        true,
      ],
      [
        'Spanish sign-only plagal naming',
        {
          ...attestedStructures['spanish-tono-ordinal'],
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
          modeNamingScheme:
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
        },
        false,
      ],
      [
        'Church Slavonic postnominal alphabetic ordinal',
        attestedStructures['church-slavonic-glas-cyrillic-numeral-text'],
        true,
      ],
      [
        'Church Slavonic prenominal word ordinal',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        true,
      ],
      [
        'Church Slavonic cardinal words',
        {
          ...attestedStructures['church-slavonic-glas-ordinal-text'],
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        },
        false,
      ],
      [
        'Church Slavonic Roman numerals',
        {
          ...attestedStructures['church-slavonic-glas-ordinal-text'],
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        },
        false,
      ],
      [
        'Russian postnominal Roman ordinal',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        }),
        true,
      ],
      [
        'Russian prenominal word ordinal',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        true,
      ],
      [
        'Russian prenominal Roman ordinal',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        true,
      ],
      [
        'Russian suffixed prenominal digit ordinal',
        {
          ...attestedStructures['russian-glas-number'],
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        true,
      ],
      [
        'Russian cardinal words',
        {
          ...attestedStructures['russian-glas-ordinal-text'],
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        },
        false,
      ],
      [
        'Arabic postnominal word ordinal',
        attestedStructures['arabic-ordinal'],
        true,
      ],
      [
        'Arabic postnominal digit ordinal',
        attestedStructures['arabic-ordinal-digits'],
        true,
      ],
      [
        'Arabic postnominal Arabic-Indic digit ordinal',
        attestedStructures['arabic-ordinal-arabic-indic-digits'],
        true,
      ],
      [
        'Arabic artificial prenominal axis',
        {
          ...attestedStructures['arabic-ordinal'],
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        false,
      ],
      [
        'Arabic sign-only plagal naming',
        {
          ...attestedStructures['arabic-ordinal'],
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
          modeNamingScheme:
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
        },
        false,
      ],
      [
        'Romanian postnominal cardinal Roman numeral',
        attestedStructures['romanian-glas-roman-numeral'],
        true,
      ],
      [
        'Romanian prenominal ordinal digit',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        }),
        true,
      ],
      [
        'Romanian sign-only laturas name',
        attestedStructures['romanian-glas'],
        true,
      ],
      [
        'Romanian prenominal cardinal',
        {
          ...attestedStructures['romanian-glas-number'],
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        false,
      ],
      [
        'Romanian unmodeled text laturas name',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
          modeNamingScheme:
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
        }),
        false,
      ],
    ];

    for (const [label, structure, expected] of cases) {
      expect(
        `${label}: ${isInitialMartyriaStructureSupported(structure)}`,
      ).toBe(`${label}: ${expected}`);
    }
  });

  it('normalizes unsupported structures to the nearest supported construction', () => {
    const spanish = normalizeInitialMartyriaStructure({
      ...attestedStructures['english-mode-number'],
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    });
    expect(spanish).toMatchObject({
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    const englishCardinal = normalizeInitialMartyriaStructure({
      ...attestedStructures['english-mode-number-word'],
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    });
    expect(englishCardinal).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    });

    const englishOrdinal = normalizeInitialMartyriaStructure({
      ...englishText,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    });
    expect(englishOrdinal).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    });

    const greek = normalizeInitialMartyriaStructure({
      ...greekText,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });
    expect(greek).toMatchObject({
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    });

    const arabic = normalizeInitialMartyriaStructure(
      grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic, {
        modeIdentificationMethod:
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        modeNamingScheme:
          INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
      }),
    );
    expect(arabic).toMatchObject({
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    const arabicIndicToWords = normalizeInitialMartyriaStructure(
      {
        ...attestedStructures['arabic-ordinal-arabic-indic-digits'],
        numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      },
      ['numeralStyle'],
    );
    expect(arabicIndicToWords).toMatchObject({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      numberingSystem: undefined,
    });

    const arabicIndicToIndonesian = normalizeInitialMartyriaStructure({
      ...attestedStructures['arabic-ordinal-arabic-indic-digits'],
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian,
    });
    expect(arabicIndicToIndonesian).toMatchObject({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian,
      numberingSystem: undefined,
    });

    expect(isInitialMartyriaStructureSupported(spanish)).toBe(true);
    expect(isInitialMartyriaStructureSupported(englishCardinal)).toBe(true);
    expect(isInitialMartyriaStructureSupported(englishOrdinal)).toBe(true);
    expect(isInitialMartyriaStructureSupported(greek)).toBe(true);
    expect(isInitialMartyriaStructureSupported(arabic)).toBe(true);
    expect(isInitialMartyriaStructureSupported(arabicIndicToWords)).toBe(true);
    expect(isInitialMartyriaStructureSupported(arabicIndicToIndonesian)).toBe(
      true,
    );
    expect(normalizeInitialMartyriaStructure(englishText)).toBe(englishText);

    const created = createInitialMartyriaStyle({
      displayName: 'Normalized',
      basedOn: null,
      structure: {
        ...attestedStructures['english-mode-number-word'],
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      },
      ...createDefaultInitialMartyriaTypography(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    });
    expect(created.structure).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    });
  });

  it('keys structures by what they render and read, not by their axes', () => {
    const spanishSignCardinal = {
      ...attestedStructures['spanish-tono-number'],
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    };
    const spanishSignOrdinal = {
      ...attestedStructures['spanish-tono-ordinal-number'],
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    };
    // Both signs look alike, but one legal structure is read cardinally and
    // the other ordinally.
    expect(
      initialMartyriaStructuresEqual(spanishSignCardinal, spanishSignOrdinal),
    ).toBe(false);
    expect(
      initialMartyriaStructuresEqual(
        attestedStructures['english-plagal-first'],
        attestedStructures['english-authentic-counterpart-number-sign'],
      ),
    ).toBe(false);
    expect(
      initialMartyriaStructuresEqual(englishText, {
        ...englishText,
        transliterateNoteNames: true,
      }),
    ).toBe(false);
    expect(
      initialMartyriaStructuresEqual(greekText, {
        ...greekText,
        transliterateNoteNames: true,
      }),
    ).toBe(true);
  });

  it('finds the style that already renders a structure', () => {
    const styles = [
      ...builtInInitialMartyriaStyles,
      styleFor(
        attestedStructures['english-authentic-counterpart-roman-numeral-text'],
      ),
    ];

    expect(
      findInitialMartyriaStyleWithStructure(
        styles,
        attestedStructures['english-authentic-counterpart-roman-numeral-text'],
      )?.id,
    ).toBe('test');
    expect(findInitialMartyriaStyleWithStructure(styles, greekText)?.id).toBe(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.GreekAlphabeticNumerals,
    );
    expect(
      findInitialMartyriaStyleWithStructure(styles, {
        ...greekText,
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      }),
    ).toBeNull();
  });

  it('builds reachable variations across correlated grammar axes', () => {
    const englishRoman = {
      ...attestedStructures['english-mode-roman-numeral'],
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
    };
    const forms = getInitialMartyriaStructureVariations(
      englishRoman,
      initialMartyriaNumeralForms,
      (structure, form) => ({ ...structure, ...form }),
    );

    expect(
      forms.map(
        (variation) =>
          `${variation.value.numeralStyle}/${variation.value.numeralKind}${
            variation.current ? '*' : ''
          }`,
      ),
    ).toEqual([
      'digits/cardinal',
      'digits/ordinal',
      'roman-numerals/cardinal*',
      'words/cardinal',
      'words/ordinal',
    ]);
    expect(new Set(forms.map((variation) => variation.key)).size).toBe(
      forms.length,
    );

    const greekForms = getInitialMartyriaStructureVariations(
      greekText,
      initialMartyriaNumeralForms,
      (structure, form) => ({ ...structure, ...form }),
    );
    expect(greekForms.map((variation) => variation.value.numeralStyle)).toEqual(
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
        INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      ],
    );
    expect(greekForms.filter((variation) => variation.current)).toHaveLength(1);

    const englishPlacements = getInitialMartyriaStructureVariations(
      attestedStructures['english-mode-number-word'],
      [
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      ],
      (structure, numeralQualifier) => ({ ...structure, numeralQualifier }),
    );
    expect(
      englishPlacements.map((variation) => ({
        value: variation.value,
        numeralKind: variation.structure.numeralKind,
        current: variation.current,
      })),
    ).toEqual([
      {
        value: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        current: true,
      },
      {
        value: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        current: false,
      },
    ]);

    const romanianMethods = getInitialMartyriaStructureVariations(
      attestedStructures['romanian-glas'],
      initialMartyriaModeIdentificationMethods,
      withInitialMartyriaModeIdentificationMethod,
    );
    expect(romanianMethods.map((variation) => variation.value)).toEqual(
      initialMartyriaModeIdentificationMethods,
    );
    expect(
      romanianMethods
        .filter(
          (variation) =>
            variation.value !==
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
        )
        .every(
          (variation) =>
            variation.structure.modeNamingScheme ===
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        ),
    ).toBe(true);

    const signKinds = getInitialMartyriaStructureVariations(
      attestedStructures['english-sign-first'],
      initialMartyriaNumeralKinds,
      (structure, numeralKind) => ({ ...structure, numeralKind }),
    );
    expect(
      signKinds.map(
        (variation) => `${variation.value}${variation.current ? '*' : ''}`,
      ),
    ).toEqual(['cardinal', 'ordinal*']);
    expect(
      signKinds.every((variation) => !('numeralStyle' in variation.structure)),
    ).toBe(true);
  });

  it('enumerates exactly the grammar-derived structures for every method', () => {
    for (const languageId of initialMartyriaLanguageIds) {
      for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
        const structures = enumerateInitialMartyriaStructures({
          languageId,
          modeIdentificationMethod,
          transliterateNoteNames: false,
        });
        const keys = structures.map((variation) => variation.key);
        const expected =
          modeIdentificationMethod ===
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
            ? modeSignStructureSignatures[languageId]
            : textStructureSignatures[languageId];

        expect(
          structures.map((variation) => signature(variation.structure)),
        ).toEqual(expected);
        expect(new Set(keys).size).toBe(keys.length);
        expect(
          structures.every((variation) =>
            isInitialMartyriaStructureSupported(variation.structure),
          ),
        ).toBe(true);
        if (
          modeIdentificationMethod ===
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
        ) {
          expect(
            structures.every(
              (variation) => !('numeralStyle' in variation.structure),
            ),
          ).toBe(true);
        }
        // Every tile renders for every mode; a structure the lexicon cannot
        // express would have thrown or produced undefined text.
        for (const variation of structures) {
          const style = styleFor(variation.structure);
          for (let mode = 1; mode <= 8; mode++) {
            const runs = resolve(style, elementForMode(mode)).runs;
            expect(textOf(runs).every((text) => text !== 'undefined')).toBe(
              true,
            );
          }
        }
      }
    }
  });

  it('renders the corrected grammar-specific morphology', () => {
    const examples: [InitialMartyriaStructure, string, string][] = [
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Greek, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        }),
        'Ἦχος | πλάγιος τοῦ | δευτέρου.',
        'Ήχος Πλάγιος του Δευτέρου εκ του Πα',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.English, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        }),
        'Mode | Six.',
        'Mode Six from Pa',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        }),
        'Tono | VI.',
        'Tono seis desde Pa',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        '6.º | tono.',
        'Sexto tono desde Pa',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        'Шесты́й | гла́съ.',
        'Шесты́й гла́съ ѿ Па',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        'Шестой | глас.',
        'Шестой глас от Па',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        '6-й | глас.',
        'Шестой глас от Па',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        }),
        'اللحن | السادس',
        'اللحن السادس من با',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        }),
        'Al 6-lea | glas.',
        'Al șaselea glas de la Pa',
      ],
    ];

    for (const [structure, expectedText, expectedPronunciation] of examples) {
      const resolution = resolve(styleFor(structure), elementForMode(6));
      expect(textOf(resolution.runs).join(' | ')).toBe(expectedText);
      expect(resolution.pronunciation).toBe(expectedPronunciation);
    }
  });

  it('handles the exceptional Romanian first ordinal in either position', () => {
    const cases = [
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        1,
        'Glasul | întâi.',
        'Glasul întâi de la Pa',
      ],
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        2,
        'Glasul | al II-lea.',
        'Glasul al doilea de la Di',
      ],
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        1,
        'Primul | glas.',
        'Primul glas de la Pa',
      ],
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        2,
        'Al II-lea | glas.',
        'Al doilea glas de la Di',
      ],
    ] as const;

    for (const [
      numeralStyle,
      numeralQualifier,
      mode,
      expectedText,
      expectedPronunciation,
    ] of cases) {
      const structure = grammarStructure(
        INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
        {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle,
          numeralQualifier,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        },
      );
      const resolution = resolve(styleFor(structure), elementForMode(mode));

      expect(textOf(resolution.runs).join(' | ')).toBe(expectedText);
      expect(resolution.pronunciation).toBe(expectedPronunciation);
    }
  });

  it('keeps every curated structure in its grammar-derived gallery', () => {
    // Every attested structure is a tile in its language's gallery.
    for (const [label, structure] of Object.entries(attestedStructures)) {
      const keys = new Set(
        enumerateInitialMartyriaStructures(structure).map(
          (variation) => variation.key,
        ),
      );
      expect(
        `${label}: ${keys.has(getInitialMartyriaStructureKey(structure))}`,
      ).toBe(`${label}: true`);
    }
  });
});
