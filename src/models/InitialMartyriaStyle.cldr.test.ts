import cldr from 'cldr';
import { describe, expect, it } from 'vitest';

import { ModeKeyElement } from '@/models/Element';
import {
  createDefaultInitialMartyriaAppearance,
  getInitialMartyriaContext,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMBERING_SYSTEMS,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_QUALIFIERS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
  isInitialMartyriaStructureSupported,
  type ModeKeyMode,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleAppearances,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { PageSetup } from '@/models/PageSetup';

type RbnfFunction = (value: number) => string;
type RbnfFunctions = Record<string, RbnfFunction>;

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

function caseFold(values: (string | null)[], locale: string) {
  return values.map((value) => value?.toLocaleLowerCase(locale) ?? null);
}

function styleFor(
  structure: Omit<
    InitialMartyriaStructure,
    'transliterateNoteNames' | 'flowDirection'
  >,
): InitialMartyriaStyle {
  const fullStructure: InitialMartyriaStructure = {
    ...structure,
    transliterateNoteNames: false,
    flowDirection: 'ltr',
  };
  return {
    id: 'cldr-test',
    displayName: 'CLDR test',
    basedOn: null,
    structure: fullStructure,
    appearance: createDefaultInitialMartyriaAppearance(structure.languageId),
  };
}

function numeralsFor(style: InitialMartyriaStyle) {
  return modes.map((mode) => {
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.mode === mode)!,
    );
    const resolution = resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedStyle: resolveInitialMartyriaStyleAppearances(style, 'Neanes'),
      pageSetup: new PageSetup(),
    });
    const run = resolution.runs.find(
      (candidate) =>
        candidate.kind === 'text' && candidate.semantic === 'numeral',
    );
    if (run == null || run.kind !== 'text') {
      return null;
    }
    return run.content.layout === 'inline'
      ? run.content.text.replace(/\.$/, '')
      : null;
  });
}

function pronunciationsFor(style: InitialMartyriaStyle) {
  return modes.map((mode) => {
    const element = ModeKeyElement.createFromTemplate(
      modeKeyTemplates.find((template) => template.mode === mode)!,
    );
    return resolveInitialMartyriaStyle({
      context: getInitialMartyriaContext(element),
      resolvedStyle: resolveInitialMartyriaStyleAppearances(style, 'Neanes'),
      pageSetup: new PageSetup(),
    }).pronunciation;
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
  it('uses CLDR Roman numerals', () => {
    const expected = cldrValues('root', 'renderRomanUpper');
    const style = styleFor({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.RomanNumerals,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    expect(numeralsFor(style)).toEqual(expected);
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

  it('preserves attested polytonic Greek ordinals alongside CLDR readings', () => {
    const style = absoluteWordStyle(
      INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
      INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
    );
    const spokenOrdinals = pronunciationsFor(style).map((pronunciation) =>
      pronunciation
        .slice('Ήχος '.length)
        .split(' εκ του ')[0]
        .toLocaleLowerCase('el'),
    );

    expect(caseFold(spokenOrdinals, 'el')).toEqual(
      cldrValues('el', 'renderSpelloutOrdinalMasculine'),
    );
    expect(numeralsFor(style)).toEqual([
      'πρῶτος',
      'δεύτερος',
      'τρίτος',
      'τέταρτος',
      'πέμπτος',
      'ἕκτος',
      'ἕβδομος',
      'ὄγδοος',
    ]);
  });

  it('uses CLDR Greek numerals with attested typography and stigma', () => {
    const expected = cldrValues('root', 'renderGreekLower').map((value) =>
      value.replace('´', 'ʹ'),
    );
    expected[5] = 'ϛʹ';
    const style = styleFor({
      languageId: INITIAL_MARTYRIA_LANGUAGE_IDS.Greek,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
      numeralQualifier: INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    expect(numeralsFor(style)).toEqual(expected);
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

  it('uses CLDR Russian masculine cardinal words', () => {
    expect(
      numeralsFor(
        absoluteWordStyle(
          INITIAL_MARTYRIA_LANGUAGE_IDS.Russian,
          INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
          INITIAL_MARTYRIA_NUMERAL_QUALIFIERS.Postnominal,
        ),
      ),
    ).toEqual(cldrValues('ru', 'renderSpelloutNumbering'));
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
    const numberingSystem = cldr.extractNumberingSystem('arab');
    expect(numberingSystem.type).toBe('numeric');

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

    expect(numeralsFor(style)).toEqual(
      [...numberingSystem.digits!].slice(1, 9),
    );
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
