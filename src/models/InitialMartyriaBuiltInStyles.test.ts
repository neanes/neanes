import { describe, expect, it } from 'vitest';

import { resources } from '@/i18n';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  type BuiltInInitialMartyriaStyleId,
  builtInInitialMartyriaStyles,
  createDefaultInitialMartyriaTypography,
  getBuiltInInitialMartyriaStyle,
  getBuiltInInitialMartyriaStyleNameSelector,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  createInitialMartyriaStyle,
  getInitialMartyriaStructureKey,
  isInitialMartyriaStructureSupported,
} from '@/models/InitialMartyriaGrammar';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  initialMartyriaLanguageIds,
} from '@/models/InitialMartyriaStyle';

import { attestedStructures } from './InitialMartyriaStyle.testData';
import { elementForMode, resolve } from './InitialMartyriaStyle.testHelpers';

describe('InitialMartyriaBuiltInStyles', () => {
  it('curates a few attested, localized built-in styles per language', () => {
    const styleIds = builtInInitialMartyriaStyles.map((style) => style.id);
    const attestedKeys = new Set(
      Object.values(attestedStructures).map(getInitialMartyriaStructureKey),
    );

    expect(new Set(styleIds).size).toBe(styleIds.length);
    expect(new Set(styleIds)).toEqual(
      new Set(Object.values(BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS)),
    );
    expect(
      builtInInitialMartyriaStyles
        .filter(
          (style) =>
            style.structure.languageId ===
            INITIAL_MARTYRIA_LANGUAGE_IDS.English,
        )
        .map((style) => style.id),
    ).toEqual([
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishTraditionalSign,
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNamesWithSign,
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumbersWithSign,
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassWithSign,
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNames,
    ]);
    expect(
      getBuiltInInitialMartyriaStyle(
        BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishModeNumbersWithSign,
      ).structure,
    ).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    });
    expect(
      getBuiltInInitialMartyriaStyle(
        BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassWithSign,
      ).structure,
    ).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    });

    const englishOrdinalDigits = getBuiltInInitialMartyriaStyle(
      BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.EnglishPlagalClassWithSign,
    );
    expect(englishOrdinalDigits.useOrdinalForms).toBe(true);
    expect(
      englishOrdinalDigits.paragraphStyleOverrides.fontVariantNumeric,
    ).toBeUndefined();
    const plagalRuns = resolve(englishOrdinalDigits, elementForMode(5)).runs;
    const ordinalNumeralRun = plagalRuns.find(
      (run) => run.kind === 'text' && run.semantic === 'numeral',
    );
    expect(ordinalNumeralRun).toMatchObject({
      appearance: { fontVariantNumeric: 'ordinal' },
      content: { layout: 'inline', text: '1st' },
    });
    expect(
      plagalRuns
        .filter((run) => run.kind === 'text' && run.semantic !== 'numeral')
        .every((run) => run.appearance.fontVariantNumeric === 'normal'),
    ).toBe(true);
    const startingPitch = plagalRuns.find(
      (run) => run.kind === 'startingPitch',
    );
    expect(startingPitch?.kind).toBe('startingPitch');
    if (startingPitch?.kind === 'startingPitch') {
      expect(startingPitch.noteText.appearance.fontVariantNumeric).toBe(
        'normal',
      );
    }
    expect(
      resolve(englishOrdinalDigits, elementForMode(7))
        .runs.filter((run) => run.kind === 'text')
        .every((run) => run.appearance.fontVariantNumeric === 'normal'),
    ).toBe(true);

    const newEnglishOrdinalDigits = createInitialMartyriaStyle({
      displayName: 'New ordinal style',
      basedOn: null,
      structure: {
        ...englishOrdinalDigits.structure,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      },
      ...createDefaultInitialMartyriaTypography(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    });
    expect(newEnglishOrdinalDigits.useOrdinalForms).toBe(true);
    expect(
      newEnglishOrdinalDigits.paragraphStyleOverrides.fontVariantNumeric,
    ).toBeUndefined();
    expect(
      resolve(newEnglishOrdinalDigits, elementForMode(5)).runs.find(
        (run) => run.kind === 'text' && run.semantic === 'numeral',
      ),
    ).toMatchObject({
      appearance: { fontVariantNumeric: 'ordinal' },
      content: { layout: 'inline', text: '5th' },
    });

    newEnglishOrdinalDigits.useOrdinalForms = false;
    const numeralWithoutOrdinalForms = resolve(
      newEnglishOrdinalDigits,
      elementForMode(5),
    ).runs.find((run) => run.kind === 'text' && run.semantic === 'numeral');
    expect(numeralWithoutOrdinalForms).toMatchObject({
      appearance: { fontVariantNumeric: 'normal' },
      content: { layout: 'inline', text: '5th' },
    });

    for (const languageId of initialMartyriaLanguageIds) {
      const count = builtInInitialMartyriaStyles.filter(
        (style) => style.structure.languageId === languageId,
      ).length;
      expect(`${languageId}: ${count}`).toMatch(/: [1-5]$/);
    }

    for (const style of builtInInitialMartyriaStyles) {
      expect(style.basedOn).toBeNull();
      expect(isInitialMartyriaStructureSupported(style.structure)).toBe(true);
      expect(
        attestedKeys.has(getInitialMartyriaStructureKey(style.structure)),
      ).toBe(true);
      const selector = getBuiltInInitialMartyriaStyleNameSelector(
        style.id as BuiltInInitialMartyriaStyleId,
      );
      for (const [locale, localeResources] of Object.entries(resources)) {
        const name = selector(localeResources);
        expect(`${locale} ${style.id}: ${name.length > 0}`).toBe(
          `${locale} ${style.id}: true`,
        );
      }
    }

    // Names only need to be distinct within a language group.
    for (const languageId of initialMartyriaLanguageIds) {
      const names = builtInInitialMartyriaStyles
        .filter((style) => style.structure.languageId === languageId)
        .map((style) =>
          getBuiltInInitialMartyriaStyleNameSelector(
            style.id as BuiltInInitialMartyriaStyleId,
          )(resources.en),
        );
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
