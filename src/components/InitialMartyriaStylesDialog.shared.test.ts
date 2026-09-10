import { describe, expect, it } from 'vitest';

import {
  cloneInitialMartyriaStyle,
  getDefaultBuiltInInitialMartyriaStyle,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
} from '@/models/InitialMartyriaStyle';

import { withInitialMartyriaStyleStructure } from './InitialMartyriaStylesDialog.shared';

describe('withInitialMartyriaStyleStructure', () => {
  it("adopts the new language's fonts and preserves other presentation", () => {
    const english = cloneInitialMartyriaStyle(
      getDefaultBuiltInInitialMartyriaStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    );
    english.appearance.fontStyle = 'Caption Bold';
    english.appearance.fontSize = 20;
    english.appearance.color = '#123456';

    const arabic = getDefaultBuiltInInitialMartyriaStyle(
      INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    );
    const changed = withInitialMartyriaStyleStructure(
      english,
      arabic.structure,
    );

    expect(changed.structure).toEqual(arabic.structure);
    expect(changed.appearance).toMatchObject({
      mainFontFamily: 'Noto Naskh Arabic',
      greekFontFamily: 'GFS Didot',
      fontStyle: 'Bold',
      fontSize: 20,
      color: '#123456',
    });
    expect(english.appearance).toMatchObject({
      mainFontFamily: 'Source Serif',
      greekFontFamily: 'Source Serif',
      fontStyle: 'Caption Bold',
    });
  });

  it('keeps custom fonts when the language does not change', () => {
    const english = cloneInitialMartyriaStyle(
      getDefaultBuiltInInitialMartyriaStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    );
    english.appearance.mainFontFamily = 'Alegreya';

    const changed = withInitialMartyriaStyleStructure(english, {
      ...english.structure,
      transliterateNoteNames: !english.structure.transliterateNoteNames,
    });

    expect(changed.appearance.mainFontFamily).toBe('Alegreya');
    expect(changed).not.toBe(english);
    expect(changed.structure).not.toBe(english.structure);
  });

  it('defaults ordinal forms when a picker choice introduces digit ordinals', () => {
    const english = cloneInitialMartyriaStyle(
      getDefaultBuiltInInitialMartyriaStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    );
    english.appearance.useOrdinalForms = false;

    const changed = withInitialMartyriaStyleStructure(english, {
      ...english.structure,
      modeIdentificationMethod:
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
      numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
      numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
      modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
    });

    expect(changed.appearance.useOrdinalForms).toBe(true);
    expect(english.appearance.useOrdinalForms).toBe(false);
  });
});
