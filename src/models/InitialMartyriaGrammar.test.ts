import { describe, expect, it } from 'vitest';

import { builtInInitialMartyriaStyles } from '@/models/InitialMartyriaBuiltInStyles';
import {
  enumerateInitialMartyriaStructures,
  getInitialMartyriaStructureKey,
  initialMartyriaModeIdentificationMethods,
  isInitialMartyriaStructureSupported,
} from '@/models/InitialMartyriaGrammar';
import { getInitialMartyriaLabelVariants } from '@/models/InitialMartyriaLexicon';
import { initialMartyriaPlagalAbbreviationWithModeSignIsOptional } from '@/models/InitialMartyriaRenderingConventions';
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
      'digits/ordinal/prenominal/authentic-counterpart',
      'digits/ordinal/prenominal/plagal-class',
      'digits/ordinal/prenominal/absolute',
      'digits/cardinal/postnominal/authentic-counterpart',
      'digits/cardinal/postnominal/plagal-class',
      'digits/cardinal/postnominal/absolute',
      'roman-numerals/cardinal/postnominal/authentic-counterpart',
      'roman-numerals/cardinal/postnominal/plagal-class',
      'roman-numerals/cardinal/postnominal/absolute',
      'words/ordinal/prenominal/authentic-counterpart',
      'words/ordinal/prenominal/plagal-class',
      'words/ordinal/prenominal/absolute',
      'words/cardinal/postnominal/authentic-counterpart',
      'words/cardinal/postnominal/plagal-class',
      'words/cardinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: [
      'digits/cardinal/postnominal/absolute',
      'roman-numerals/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
      'words/ordinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: [
      'digits/ordinal/postnominal/absolute',
      'alphabetic-numerals/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
      'words/ordinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: [
      'digits/ordinal/prenominal/absolute',
      'digits/ordinal/postnominal/absolute',
      'roman-numerals/ordinal/prenominal/absolute',
      'roman-numerals/ordinal/postnominal/absolute',
      'words/ordinal/prenominal/absolute',
      'words/ordinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: [
      'digits/ordinal/postnominal/absolute',
      'digits/ordinal/postnominal/absolute/arab',
      'words/ordinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: [
      'digits/cardinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: [
      'digits/ordinal/postnominal/authentic-counterpart',
      'digits/ordinal/postnominal/absolute',
      'digits/cardinal/postnominal/absolute',
      'roman-numerals/cardinal/postnominal/absolute',
      'words/ordinal/postnominal/authentic-counterpart',
      'words/ordinal/postnominal/absolute',
      'words/cardinal/postnominal/absolute',
    ],
  } satisfies Record<InitialMartyriaLanguageId, string[]>;

  const modeSignStructureSignatures = {
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: [
      'ordinal/postnominal/authentic-counterpart',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: [
      'ordinal/prenominal/authentic-counterpart',
      'ordinal/prenominal/plagal-class',
      'cardinal/postnominal/authentic-counterpart',
      'cardinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: ['ordinal/postnominal/absolute'],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: [
      'ordinal/postnominal/absolute',
    ],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: ['ordinal/postnominal/absolute'],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: ['ordinal/postnominal/absolute'],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: ['ordinal/postnominal/absolute'],
    [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: [
      'ordinal/postnominal/authentic-counterpart',
    ],
  } satisfies Record<InitialMartyriaLanguageId, string[]>;

  it('renders prenominal Roman ordinals with the Russian label form', () => {
    const structure = grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });
    const resolution = resolve(styleFor(structure), elementForMode(2));

    expect(textOf(resolution.runs)).toEqual(['II', 'глас.']);
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
        true,
      ],
      [
        'English sign-only absolute ordinal before the label',
        {
          ...attestedStructures['english-mode-before-sign'],
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        false,
      ],
      ['English Tone number', attestedStructures['english-tone-number'], true],
      [
        'English Tone beside the sign group',
        attestedStructures['english-tone-before-sign'],
        true,
      ],
      [
        'English Tone ordinal digits before the label',
        {
          ...attestedStructures['english-ordinal-tone-text'],
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        },
        true,
      ],
      [
        'English Tone cardinal words',
        {
          ...attestedStructures['english-tone-number-text'],
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        },
        true,
      ],
      [
        'English Tone Roman numerals',
        {
          ...attestedStructures['english-tone-number-text'],
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        },
        true,
      ],
      [
        'English plagal of the first Tone',
        {
          ...attestedStructures['english-ordinal-tone-text'],
          modeNamingScheme:
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
        },
        false,
      ],
      [
        'English first plagal Tone',
        {
          ...attestedStructures['english-ordinal-tone-text'],
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.PlagalClass,
        },
        false,
      ],
      [
        'English Tone sign with plagal naming',
        {
          ...attestedStructures['english-tone-before-sign'],
          modeNamingScheme:
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
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
        'Spanish prenominal ordinal digits',
        {
          ...attestedStructures['spanish-ordinal-tono'],
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        },
        false,
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
        false,
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
        'Romanian postnominal cardinal digit',
        attestedStructures['romanian-glas-number'],
        true,
      ],
      [
        'Romanian postnominal cardinal Roman numeral',
        {
          ...attestedStructures['romanian-glas-number'],
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        },
        false,
      ],
      [
        'Romanian postnominal cardinal word',
        {
          ...attestedStructures['romanian-glas-number'],
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        },
        false,
      ],
      [
        'Romanian written ordinal',
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
          modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
        }),
        false,
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
        false,
      ],
      [
        'Romanian sign-only absolute ordinal name',
        attestedStructures['romanian-glas'],
        true,
      ],
      [
        'Romanian sign-only laturas name',
        {
          ...attestedStructures['romanian-glas'],
          modeNamingScheme:
            INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
        },
        false,
      ],
      [
        'Romanian sign-only prenominal name',
        {
          ...attestedStructures['romanian-glas'],
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        },
        false,
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

  // Styles are only ever created from these wordings, so none needs
  // normalizing to a supported structure.
  it('offers only supported structures in the wording picker', () => {
    const unsupported: string[] = [];
    const check = (structure: InitialMartyriaStructure) => {
      if (!isInitialMartyriaStructureSupported(structure)) {
        unsupported.push(JSON.stringify(structure));
      }
    };
    const pickerChoices = (
      axes: Pick<InitialMartyriaStructure, 'languageId' | 'labelVariant'>,
    ) =>
      [true, false].flatMap((transliterateNoteNames) =>
        (initialMartyriaPlagalAbbreviationWithModeSignIsOptional(axes)
          ? [true, false]
          : [undefined]
        ).map((plagalAbbreviationWithModeSign) => ({
          transliterateNoteNames,
          plagalAbbreviationWithModeSign,
        })),
      );

    for (const preset of builtInInitialMartyriaStyles) {
      for (const choices of pickerChoices(preset.structure)) {
        check({ ...preset.structure, ...choices });
      }
    }
    for (const languageId of initialMartyriaLanguageIds) {
      for (const labelVariant of [
        undefined,
        ...getInitialMartyriaLabelVariants(languageId),
      ]) {
        for (const choices of pickerChoices({ languageId, labelVariant })) {
          for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
            for (const { structure } of enumerateInitialMartyriaStructures({
              languageId,
              labelVariant,
              modeIdentificationMethod,
              ...choices,
            })) {
              check(structure);
            }
          }
        }
      }
    }

    expect(unsupported).toEqual([]);
  });

  it('keys structures by what they render, not by their axes', () => {
    const structuresEqual = (
      a: InitialMartyriaStructure,
      b: InitialMartyriaStructure,
    ) =>
      getInitialMartyriaStructureKey(a) === getInitialMartyriaStructureKey(b);
    const spanishSignCardinal = {
      ...attestedStructures['spanish-tono-number'],
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    };
    const spanishSignOrdinal = {
      ...attestedStructures['spanish-tono-roman-numeral'],
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign,
    };
    // Both signs look alike, so they are the same style whatever their
    // numeral kind.
    expect(structuresEqual(spanishSignCardinal, spanishSignOrdinal)).toBe(true);
    expect(
      structuresEqual(
        attestedStructures['english-plagal-first'],
        attestedStructures['english-authentic-counterpart-number-sign'],
      ),
    ).toBe(false);
    expect(
      structuresEqual(englishText, {
        ...englishText,
        transliterateNoteNames: true,
      }),
    ).toBe(false);
    expect(
      structuresEqual(greekText, {
        ...greekText,
        transliterateNoteNames: true,
      }),
    ).toBe(true);
  });

  it('offers each printed form once', () => {
    for (const languageId of initialMartyriaLanguageIds) {
      for (const modeIdentificationMethod of initialMartyriaModeIdentificationMethods) {
        const keys = enumerateInitialMartyriaStructures({
          languageId,
          modeIdentificationMethod,
          transliterateNoteNames: false,
        }).map(({ structure }) => getInitialMartyriaStructureKey(structure));
        expect(new Set(keys).size).toBe(keys.length);
      }
    }

    // Ordinal and cardinal Roman numerals print alike in Spanish, so they
    // are one option.
    const spanishRoman = enumerateInitialMartyriaStructures({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      transliterateNoteNames: false,
    }).filter(
      ({ structure }) =>
        structure.modeIdentificationMethod !==
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign &&
        structure.numeralStyle ===
          INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
    );
    expect(spanishRoman).toHaveLength(1);
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
    const examples: [InitialMartyriaStructure, string][] = [
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Greek, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
        }),
        'Ἦχος | πλάγιος τοῦ | δευτέρου.',
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
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        }),
        'Tono | VI.',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        'Шесты́й | гла́съ.',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        'Шестой | глас.',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Russian, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
          numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
          numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        }),
        '6-й | глас.',
      ],
      [
        grammarStructure(INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic, {
          modeIdentificationMethod:
            INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        }),
        'اللحن | السادس',
      ],
      [attestedStructures['romanian-glas-number'], 'Glas | 6 | λ | π'],
      [attestedStructures['romanian-glas'], 'Glas | λ | π'],
    ];

    for (const [structure, expectedText] of examples) {
      const resolution = resolve(styleFor(structure), elementForMode(6));
      expect(textOf(resolution.runs).join(' | ')).toBe(expectedText);
    }
  });

  it('keeps every curated structure in its grammar-derived set', () => {
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
