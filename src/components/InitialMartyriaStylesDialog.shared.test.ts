import { describe, expect, it } from 'vitest';

import { getDefaultBuiltInInitialMartyriaStyle } from '@/models/InitialMartyriaBuiltInStyles';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  INITIAL_MARTYRIA_MODE_NAMING_SCHEMES,
  INITIAL_MARTYRIA_NUMERAL_KINDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
} from '@/models/InitialMartyriaStyle';
import { createDefaultParagraphStyles } from '@/models/ParagraphStyle';

import { withInitialMartyriaStyleStructure } from './InitialMartyriaStylesDialog.shared';

const paragraphStyles = createDefaultParagraphStyles();

describe('withInitialMartyriaStyleStructure', () => {
  it("adopts the new language's fonts and preserves other presentation", () => {
    const english = cloneInitialMartyriaStyle(
      getDefaultBuiltInInitialMartyriaStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    );
    english.paragraphStyleOverrides.fontStyle = 'Caption Bold';
    english.paragraphStyleOverrides.fontSize = 20;
    english.paragraphStyleOverrides.color = '#123456';

    const arabic = getDefaultBuiltInInitialMartyriaStyle(
      INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic,
    );
    const changed = withInitialMartyriaStyleStructure(
      english,
      arabic.structure,
      paragraphStyles,
    );

    expect(changed.structure).toEqual(arabic.structure);
    expect(changed.paragraphStyleOverrides).toEqual({
      fontFamily: 'Noto Naskh Arabic',
      fontStyle: 'Bold',
      fontSize: 20,
      color: '#123456',
    });
    expect(changed.greekFontFamily).toBe('GFS Didot');
    expect(english.paragraphStyleOverrides).toEqual({
      fontStyle: 'Caption Bold',
      fontSize: 20,
      color: '#123456',
    });
    expect(english.greekFontFamily).toBeNull();
  });

  it('drops the font override when the new language has none', () => {
    const slavonic = cloneInitialMartyriaStyle(
      getDefaultBuiltInInitialMartyriaStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic,
      ),
    );
    expect(slavonic.paragraphStyleOverrides.fontFamily).toBe('Old Standard');

    const english = getDefaultBuiltInInitialMartyriaStyle(
      INITIAL_MARTYRIA_LANGUAGE_IDS.English,
    );
    const changed = withInitialMartyriaStyleStructure(
      slavonic,
      english.structure,
      paragraphStyles,
    );

    expect(changed.paragraphStyleOverrides.fontFamily).toBeUndefined();
    expect(changed.greekFontFamily).toBeNull();
  });

  it('keeps custom fonts when the language does not change', () => {
    const english = cloneInitialMartyriaStyle(
      getDefaultBuiltInInitialMartyriaStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    );
    english.paragraphStyleOverrides.fontFamily = 'Alegreya';

    const changed = withInitialMartyriaStyleStructure(
      english,
      {
        ...english.structure,
        transliterateNoteNames: !english.structure.transliterateNoteNames,
      },
      paragraphStyles,
    );

    expect(changed.paragraphStyleOverrides.fontFamily).toBe('Alegreya');
    expect(changed).not.toBe(english);
    expect(changed.structure).not.toBe(english.structure);
    expect(changed.paragraphStyleOverrides).not.toBe(
      english.paragraphStyleOverrides,
    );
  });

  it('defaults ordinal forms when a picker choice introduces digit ordinals', () => {
    const english = cloneInitialMartyriaStyle(
      getDefaultBuiltInInitialMartyriaStyle(
        INITIAL_MARTYRIA_LANGUAGE_IDS.English,
      ),
    );
    english.useOrdinalForms = false;

    const changed = withInitialMartyriaStyleStructure(
      english,
      {
        ...english.structure,
        modeIdentificationMethod:
          INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.Text,
        numeralKind: INITIAL_MARTYRIA_NUMERAL_KINDS.Ordinal,
        numeralStyle: INITIAL_MARTYRIA_NUMERAL_STYLES.Digits,
        modeNamingScheme: INITIAL_MARTYRIA_MODE_NAMING_SCHEMES.Absolute,
      },
      paragraphStyles,
    );

    expect(changed.useOrdinalForms).toBe(true);
    expect(english.useOrdinalForms).toBe(false);
  });
});
