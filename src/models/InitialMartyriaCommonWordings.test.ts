import { describe, expect, it } from 'vitest';

import { resources } from '@/i18n';
import {
  type CommonInitialMartyriaWording,
  commonInitialMartyriaWordings,
  createDefaultInitialMartyriaTypography,
  createInitialMartyriaStyleFromWording,
  ensureScoreInitialMartyriaStyle,
  getCommonInitialMartyriaWording,
  getCommonInitialMartyriaWordingCaptionSelector,
} from '@/models/InitialMartyriaCommonWordings';
import {
  createInitialMartyriaStyle,
  getInitialMartyriaStructureKey,
  isInitialMartyriaStructureSupported,
} from '@/models/InitialMartyriaGrammar';
import { getInitialMartyriaLabelVariants } from '@/models/InitialMartyriaLexicon';
import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  initialMartyriaLanguageIds,
} from '@/models/InitialMartyriaStyle';

import { attestedStructures } from './InitialMartyriaStyle.testData';
import {
  elementForMode,
  resolve,
  styleFromWording,
} from './InitialMartyriaStyle.testHelpers';

describe('InitialMartyriaCommonWordings', () => {
  it('curates a few attested, captioned wordings per language', () => {
    const names = commonInitialMartyriaWordings.map((wording) => wording.name);
    const attestedKeys = new Set(
      Object.values(attestedStructures).map(getInitialMartyriaStructureKey),
    );

    expect(new Set(names).size).toBe(names.length);
    // Every caption names a common wording.
    expect(new Set(names)).toEqual(
      new Set(
        Object.keys(resources.en.dialog.initialMartyriaStyles.wordingCaptions),
      ),
    );
    expect(
      commonInitialMartyriaWordings
        .filter(
          (wording) =>
            wording.structure.languageId ===
            INITIAL_MARTYRIA_LANGUAGE_IDS.English,
        )
        .map((wording) => wording.name),
    ).toEqual([
      'englishTraditionalSign',
      'englishModeNamesWithSign',
      'englishModeNumbersWithSign',
      'englishPlagalClassWithSign',
      'englishModeNames',
      'englishModeBeforeSign',
      'englishToneNumber',
      'englishOrdinalTone',
      'englishToneNumberWithSign',
      'englishToneBeforeSign',
    ]);
    expect(
      getCommonInitialMartyriaWording('englishModeNumbersWithSign').structure,
    ).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Cardinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      modeNamingScheme:
        INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.AuthenticCounterpart,
    });
    expect(
      getCommonInitialMartyriaWording('englishPlagalClassWithSign').structure,
    ).toMatchObject({
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
    });
    const arabicStyles = commonInitialMartyriaWordings.filter(
      (wording) =>
        wording.structure.languageId === INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    );
    expect(arabicStyles.map((wording) => wording.name)).toEqual([
      'arabicOrdinal',
      'arabicOrdinalText',
    ]);
    expect(arabicStyles[0].structure.modeIdentificationMethod).toBe(
      INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.TextAndModeSign,
    );
    expect(arabicStyles[1].structure).toEqual({
      ...arabicStyles[0].structure,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
    });

    const englishOrdinalDigits = styleFromWording('englishPlagalClassWithSign');
    expect(englishOrdinalDigits.useOrdinalForms).toBe(true);
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
      expect(startingPitch.noteText!.appearance.fontVariantNumeric).toBe(
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
      structure: {
        ...englishOrdinalDigits.structure,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      },
      ...createDefaultInitialMartyriaTypography(),
    });
    expect(newEnglishOrdinalDigits.useOrdinalForms).toBe(true);
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

    // The picker lists the wordings of one language and mode word at a time.
    for (const languageId of initialMartyriaLanguageIds) {
      for (const labelVariant of [
        undefined,
        ...getInitialMartyriaLabelVariants(languageId),
      ]) {
        const count = commonInitialMartyriaWordings.filter(
          (wording) =>
            wording.structure.languageId === languageId &&
            wording.structure.labelVariant === labelVariant,
        ).length;
        expect(`${languageId} ${labelVariant}: ${count}`).toMatch(/: [1-6]$/);
      }
    }

    for (const wording of commonInitialMartyriaWordings) {
      expect(isInitialMartyriaStructureSupported(wording.structure)).toBe(true);
      expect(
        attestedKeys.has(getInitialMartyriaStructureKey(wording.structure)),
      ).toBe(true);
      const selector = getCommonInitialMartyriaWordingCaptionSelector(
        wording.name,
      );
      for (const [locale, localeResources] of Object.entries(resources)) {
        const caption = selector(localeResources);
        expect(`${locale} ${wording.name}: ${caption.length > 0}`).toBe(
          `${locale} ${wording.name}: true`,
        );
      }
    }

    // Captions label the common wordings of one language and word for the
    // mode, in one lettering. The picker names how each shows the mode
    // beside its caption, so captions only need to be distinct among
    // wordings that show the mode alike, in every locale.
    const getCaptionScope = (wording: CommonInitialMartyriaWording) =>
      [
        wording.structure.languageId,
        wording.structure.labelVariant,
        wording.lettering,
        wording.structure.modeIdentificationMethod,
      ].join(':');
    const captionScopes = new Set(
      commonInitialMartyriaWordings.map(getCaptionScope),
    );
    for (const [locale, localeResources] of Object.entries(resources)) {
      for (const captionScope of captionScopes) {
        const captions = commonInitialMartyriaWordings
          .filter((wording) => getCaptionScope(wording) === captionScope)
          .map((wording) =>
            getCommonInitialMartyriaWordingCaptionSelector(wording.name)(
              localeResources,
            ),
          );
        expect(`${locale} ${captionScope}: ${new Set(captions).size}`).toBe(
          `${locale} ${captionScope}: ${captions.length}`,
        );
      }
    }
  });

  it("makes a style of the score's own with the default typography", () => {
    const wording = getCommonInitialMartyriaWording('englishModeNames');
    const style = createInitialMartyriaStyleFromWording(wording, 'English');
    const other = createInitialMartyriaStyleFromWording(wording, 'English 2');

    expect(style).toMatchObject({
      ...createDefaultInitialMartyriaTypography(),
      displayName: 'English',
      structure: wording.structure,
      lettering: wording.lettering,
    });
    expect(style.id).not.toBe(other.id);
    expect(style.structure).not.toBe(wording.structure);
  });

  it("names a score's new default style after the neume font, avoiding names in use", () => {
    const classic = getCommonInitialMartyriaWording('classic');
    const taken = createInitialMartyriaStyleFromWording(classic, 'Neume Font');
    // Names are unique across every style, whatever its language.
    const otherLanguage = styleFromWording('englishModeNames', 'Neume Font 2');
    const score = {
      initialMartyriaStyles: [taken, otherLanguage],
      defaultInitialMartyriaStyleId: 'deleted',
    };

    ensureScoreInitialMartyriaStyle(score);

    expect(score.initialMartyriaStyles).toHaveLength(3);
    expect(score.initialMartyriaStyles[0]).toMatchObject({
      lettering: classic.lettering,
      structure: classic.structure,
      displayName: 'Neume Font 3',
    });
    expect(score.defaultInitialMartyriaStyleId).toBe(
      score.initialMartyriaStyles[0].id,
    );
  });
});
