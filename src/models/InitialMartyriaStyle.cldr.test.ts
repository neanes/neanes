import cldr from 'cldr';
import { describe, expect, it } from 'vitest';

import { ModeKeyElement } from '@/models/Element';
import { createDefaultInitialMartyriaTypography } from '@/models/InitialMartyriaBuiltInStyles';
import { isInitialMartyriaStructureSupported } from '@/models/InitialMartyriaGrammar';
import { initialMartyriaLexicons } from '@/models/InitialMartyriaLexicon';
import {
  getInitialMartyriaContext,
  getInitialMartyriaPronunciation,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleAppearances,
} from '@/models/InitialMartyriaResolver';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  initialMartyriaLanguageIds,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
  type InitialMartyriaTextStructure,
  type ModeKeyMode,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { PageSetup } from '@/models/PageSetup';
import { createDefaultParagraphStyles } from '@/models/ParagraphStyle';

type RbnfFunction = (value: number) => string;
type RbnfFunctions = Record<string, RbnfFunction>;
type CldrLayout = {
  orientation: {
    characterOrder: 'left-to-right' | 'right-to-left';
  };
};

const modes: ModeKeyMode[] = [1, 2, 3, 4, 5, 6, 7, 8];

function getRbnf(locale: string) {
  const rules = cldr.extractRbnfFunctionByType(locale) as RbnfFunctions;
  rules.renderNumber = (value) => String(value);
  return rules;
}

function cldrValues(locale: string, rule: string) {
  const rules = getRbnf(locale);
  const render = rules[rule];
  return modes.map((mode) => render.call(rules, mode));
}

function cldrDigits(numberingSystemId: string) {
  const numberingSystem = cldr.extractNumberingSystem(numberingSystemId);
  expect(numberingSystem.type).toBe('numeric');
  return [...numberingSystem.digits!].slice(1, 9);
}

function caseFold(values: (string | null)[], locale: string) {
  return values.map((value) => value?.toLocaleLowerCase(locale) ?? null);
}

function styleFor(
  structure: Omit<InitialMartyriaTextStructure, 'transliterateNoteNames'>,
): InitialMartyriaStyle {
  const fullStructure: InitialMartyriaStructure = {
    ...structure,
    transliterateNoteNames: false,
  };
  return {
    id: 'cldr-test',
    displayName: 'CLDR test',
    basedOn: null,
    structure: fullStructure,
    ...createDefaultInitialMartyriaTypography(),
  };
}

const paragraphStyles = createDefaultParagraphStyles();

function numeralsFor(
  style: InitialMartyriaStyle,
  stripTerminalPunctuation = true,
) {
  return modes.map((mode) => {
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.mode === mode)!,
    );
    const pageSetup = new PageSetup();
    const resolution = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedStyle: resolveInitialMartyriaStyleAppearances(
        style,
        paragraphStyles,
      ),
      pageSetup,
      glyphFontSize: 20,
    });
    const run = resolution.runs.find(
      (candidate) =>
        candidate.kind === 'text' && candidate.semantic === 'numeral',
    );
    if (run == null || run.kind !== 'text') {
      return null;
    }
    if (run.content.layout !== 'inline') {
      return null;
    }
    return stripTerminalPunctuation
      ? run.content.text.replace(/\.$/, '')
      : run.content.text;
  });
}

function pronunciationsFor(style: InitialMartyriaStyle) {
  return modes.map((mode) => {
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.mode === mode)!,
    );
    return getInitialMartyriaPronunciation(
      style.structure,
      getInitialMartyriaContext(element),
    );
  });
}

function absoluteWordStyle(
  languageId: InitialMartyriaStructure['languageId'],
  numeralKind: InitialMartyriaStructure['numeralKind'],
  numeralQualifier: InitialMartyriaStructure['numeralQualifier'],
) {
  return styleFor({
    languageId,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
    numeralQualifier,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
  });
}

function absoluteDigitOrdinalStyle(
  languageId: InitialMartyriaStructure['languageId'],
  numeralQualifier: InitialMartyriaStructure['numeralQualifier'],
) {
  return styleFor({
    languageId,
    modeIdentificationMethod: INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
    numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    numeralQualifier,
    modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
  });
}

describe('Initial Martyria lexicons against Unicode CLDR', () => {
  it('uses CLDR writing directions for every language', () => {
    for (const languageId of initialMartyriaLanguageIds) {
      const layout = cldr.extractLayout(languageId) as CldrLayout;
      const expectedDirection =
        layout.orientation.characterOrder === 'right-to-left' ? 'rtl' : 'ltr';

      expect(initialMartyriaLexicons[languageId].direction).toBe(
        expectedDirection,
      );
    }
  });

  it('uses CLDR Roman numerals in every unformatted Roman-numeral form', () => {
    const expected = cldrValues('root', 'renderRomanUpper');
    const cases = [
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      ],
    ] as const;

    for (const [languageId, numeralKind, numeralQualifier] of cases) {
      const style = styleFor({
        languageId,
        modeIdentificationMethod:
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        numeralKind,
        numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        numeralQualifier,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      });

      expect(isInitialMartyriaStructureSupported(style.structure)).toBe(true);
      expect(numeralsFor(style)).toEqual(expected);
    }
  });

  it('uses CLDR latn digits in every unformatted decimal form', () => {
    const expected = cldrDigits('latn');
    const cases = [
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      ],
    ] as const;

    for (const [languageId, numeralKind] of cases) {
      const style = styleFor({
        languageId,
        modeIdentificationMethod:
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        numeralKind,
        numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      });

      expect(isInitialMartyriaStructureSupported(style.structure)).toBe(true);
      expect(numeralsFor(style)).toEqual(expected);
    }
  });

  it('uses CLDR numerals and readings for prenominal Spanish and Russian Roman ordinals', () => {
    const expectedNumerals = cldrValues('root', 'renderRomanUpper');
    const cases = [
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
        'es',
        'renderSpelloutOrdinalMasculineAdjective',
      ],
      [
        INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
        'ru',
        'renderSpelloutOrdinalMasculine',
      ],
    ] as const;

    for (const [languageId, locale, ordinalRule] of cases) {
      const style = styleFor({
        languageId,
        modeIdentificationMethod:
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      });

      expect(isInitialMartyriaStructureSupported(style.structure)).toBe(true);
      expect(numeralsFor(style)).toEqual(expectedNumerals);

      const expectedOrdinals = cldrValues(locale, ordinalRule);
      if (languageId === INITIAL_MARTYRIA_LANGUAGE_IDS.Russian) {
        // The attested spelling keeps yo where CLDR permits e.
        expectedOrdinals[3] = 'четвёртый';
      }
      expect(
        pronunciationsFor(style).map((pronunciation) =>
          pronunciation.split(' ')[0].toLocaleLowerCase(locale),
        ),
      ).toEqual(expectedOrdinals);
    }
  });

  it('uses CLDR English cardinal and ordinal words', () => {
    expect(
      caseFold(
        numeralsFor(
          absoluteWordStyle(
            INITIAL_MARTYRIA_LANGUAGE_IDS.English,
            INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
            INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
          ),
        ),
        'en',
      ),
    ).toEqual(cldrValues('en', 'renderSpelloutCardinal'));
    expect(
      caseFold(
        numeralsFor(
          absoluteWordStyle(
            INITIAL_MARTYRIA_LANGUAGE_IDS.English,
            INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
            INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
          ),
        ),
        'en',
      ),
    ).toEqual(cldrValues('en', 'renderSpelloutOrdinal'));
  });

  it('uses CLDR English digit ordinals', () => {
    expect(
      numeralsFor(
        absoluteDigitOrdinalStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.English,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        ),
      ),
    ).toEqual(cldrValues('en', 'renderDigitsOrdinal'));
  });

  it('uses CLDR Indonesian cardinal words, ordinal words, and digit ordinals', () => {
    const cardinalStyle = absoluteWordStyle(
      INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian,
      INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    );
    const ordinalStyle = absoluteWordStyle(
      INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian,
      INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    );
    const digitOrdinalStyle = absoluteDigitOrdinalStyle(
      INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian,
      INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    );

    expect(caseFold(numeralsFor(cardinalStyle), 'id')).toEqual(
      cldrValues('id', 'renderSpelloutCardinal'),
    );
    expect(caseFold(numeralsFor(ordinalStyle), 'id')).toEqual(
      cldrValues('id', 'renderSpelloutOrdinal'),
    );
    expect(numeralsFor(digitOrdinalStyle)).toEqual(
      cldrValues('id', 'renderDigitsOrdinal'),
    );
  });

  it('preserves reachable polytonic Greek ordinals alongside CLDR readings', () => {
    const style = styleFor({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Words,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    });
    const spokenOrdinals = pronunciationsFor(style).map((pronunciation) =>
      pronunciation
        .slice('Ήχος '.length)
        .split(' εκ του ')[0]
        .toLocaleLowerCase('el'),
    );

    expect(caseFold(spokenOrdinals.slice(0, 4), 'el')).toEqual(
      cldrValues('el', 'renderSpelloutOrdinalMasculine').slice(0, 4),
    );
    expect(numeralsFor(style).slice(0, 4)).toEqual([
      'πρῶτος',
      'δεύτερος',
      'τρίτος',
      'τέταρτος',
    ]);
  });

  it('uses reachable CLDR Greek numerals with attested typography', () => {
    const expected = cldrValues('root', 'renderGreekLower').map((value) =>
      value.replace('´', 'ʹ'),
    );
    const style = styleFor({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    });

    expect(numeralsFor(style).slice(0, 4)).toEqual(expected.slice(0, 4));
  });

  it('uses CLDR Spanish ordinals, including prenominal apocope', () => {
    expect(
      numeralsFor(
        absoluteWordStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
          INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        ),
      ),
    ).toEqual(cldrValues('es', 'renderSpelloutOrdinalMasculine'));
    expect(
      caseFold(
        numeralsFor(
          absoluteWordStyle(
            INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
            INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
            INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
          ),
        ),
        'es',
      ),
    ).toEqual(cldrValues('es', 'renderSpelloutOrdinalMasculineAdjective'));
  });

  it('uses CLDR standalone Spanish cardinal words', () => {
    expect(
      numeralsFor(
        absoluteWordStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
          INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        ),
      ),
    ).toEqual(cldrValues('es', 'renderSpelloutNumbering'));
  });

  it('uses the matching CLDR Spanish digit ordinal for each position', () => {
    expect(
      numeralsFor(
        absoluteDigitOrdinalStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        ),
      ),
    ).toEqual(cldrValues('es', 'renderDigitsOrdinalMasculine'));
    expect(
      numeralsFor(
        absoluteDigitOrdinalStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        ),
      ),
    ).toEqual(cldrValues('es', 'renderDigitsOrdinalMasculineAdjective'));
  });

  it('uses CLDR Russian ordinals modulo case and attested yo spelling', () => {
    const expected = cldrValues('ru', 'renderSpelloutOrdinalMasculine');
    expected[3] = 'четвёртый';

    for (const qualifier of [
      INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
    ]) {
      expect(
        caseFold(
          numeralsFor(
            absoluteWordStyle(
              INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
              INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
              qualifier,
            ),
          ),
          'ru',
        ),
      ).toEqual(expected);
    }
  });

  it('uses CLDR Russian prenominal digit ordinal suffixes', () => {
    expect(
      numeralsFor(
        absoluteDigitOrdinalStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        ),
      ),
    ).toEqual(cldrValues('ru', 'renderDigitsOrdinalMasculine'));
  });

  it('uses CLDR Arabic masculine ordinal words', () => {
    expect(
      numeralsFor(
        absoluteWordStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
          INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        ),
      ),
    ).toEqual(cldrValues('ar', 'renderSpelloutOrdinalMasculine'));
  });

  it('uses CLDR Arabic digit ordinals', () => {
    expect(
      numeralsFor(
        absoluteDigitOrdinalStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        ),
      ),
    ).toEqual(cldrValues('ar', 'renderDigitsOrdinal'));
  });

  it('uses the CLDR arab numbering-system digits', () => {
    const style = styleFor({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      numberingSystem: INITIAL_MARTYRIA_NUMBERING_SYSTEMS.ArabicIndic,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    expect(numeralsFor(style)).toEqual(cldrDigits('arab'));
  });

  it('uses CLDR Romanian masculine cardinal words', () => {
    expect(
      numeralsFor(
        absoluteWordStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
          INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        ),
      ),
    ).toEqual(cldrValues('ro', 'renderSpelloutNumbering'));
  });

  it('preserves attested Romanian church ordinal forms missing from CLDR', () => {
    expect(cldrValues('ro', 'renderSpelloutOrdinal')).toEqual([
      '1.',
      '2.',
      '3.',
      '4.',
      '5.',
      '6.',
      '7.',
      '8.',
    ]);
    const postnominal = numeralsFor(
      absoluteWordStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      ),
    );
    const prenominal = numeralsFor(
      absoluteWordStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      ),
    );
    expect(postnominal).toEqual([
      'întâi',
      'al doilea',
      'al treilea',
      'al patrulea',
      'al cincilea',
      'al șaselea',
      'al șaptelea',
      'al optulea',
    ]);
    expect(prenominal[0]).toBe('Primul');
    expect(caseFold(prenominal.slice(1), 'ro')).toEqual(
      caseFold(postnominal.slice(1), 'ro'),
    );
  });

  it('wraps CLDR decimal and Roman bases in Romanian church ordinal forms', () => {
    const cases = [
      [INITIAL_MARTYRIA_NUMERAL_STYLES.Digits, cldrDigits('latn')],
      [
        INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
        cldrValues('root', 'renderRomanUpper'),
      ],
    ] as const;

    for (const [numeralStyle, bases] of cases) {
      const postnominal = styleFor({
        languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
        modeIdentificationMethod:
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        numeralStyle,
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      });
      const prenominal = styleFor({
        languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian,
        modeIdentificationMethod:
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        numeralStyle,
        numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      });

      expect(numeralsFor(postnominal)).toEqual([
        'întâi',
        ...bases.slice(1).map((base) => `al ${base}-lea`),
      ]);
      expect(numeralsFor(prenominal)).toEqual([
        'Primul',
        ...bases.slice(1).map((base) => `Al ${base}-lea`),
      ]);
    }
  });

  it('uses CLDR Cyrillic numerals for the Church Slavonic forms', () => {
    const style = styleFor({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    expect(numeralsFor(style)).toEqual(
      cldrValues('root', 'renderCyrillicLower'),
    );
  });

  it('uses CLDR Church Slavonic digit-ordinal punctuation', () => {
    const style = absoluteDigitOrdinalStyle(
      INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
      INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    );

    expect(numeralsFor(style, false)).toEqual(
      cldrValues('cu', 'renderDigitsOrdinal'),
    );
  });

  it('preserves attested Church Slavonic ordinal words absent from CLDR', () => {
    expect(cldrValues('cu', 'renderSpelloutOrdinal')).toEqual([
      '1.',
      '2.',
      '3.',
      '4.',
      '5.',
      '6.',
      '7.',
      '8.',
    ]);
    const postnominal = numeralsFor(
      absoluteWordStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      ),
    );
    const prenominal = numeralsFor(
      absoluteWordStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
        INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Prenominal,
      ),
    );
    expect(postnominal).toEqual([
      'пе́рвый',
      'вторы́й',
      'тре́тїй',
      'четве́ртый',
      'пѧ́тый',
      'шесты́й',
      'седмы́й',
      'ѻ҆сьмы́й',
    ]);
    expect(caseFold(prenominal, 'cu')).toEqual(caseFold(postnominal, 'cu'));
  });
});
