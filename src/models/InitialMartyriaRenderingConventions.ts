import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLanguageId,
  type InitialMartyriaNumeralStyle,
} from './InitialMartyriaStyle';

export interface InitialMartyriaRenderingConvention {
  terminalPunctuation: '' | '.';
  modeSignGroupPlacement: 'before-starting-pitch' | 'after-starting-pitch';
  plagalAbbreviationNumeralStyles: readonly InitialMartyriaNumeralStyle[];
  showGraveWordWithModeSign: boolean;
}

const defaultRenderingConvention: InitialMartyriaRenderingConvention = {
  terminalPunctuation: '.',
  modeSignGroupPlacement: 'before-starting-pitch',
  plagalAbbreviationNumeralStyles: [],
  showGraveWordWithModeSign: false,
};

export const initialMartyriaRenderingConventions: Record<
  InitialMartyriaLanguageId,
  InitialMartyriaRenderingConvention
> = {
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Greek]: {
    ...defaultRenderingConvention,
    plagalAbbreviationNumeralStyles: [
      INITIAL_MARTYRIA_NUMERAL_STYLES.AlphabeticNumerals,
    ],
    showGraveWordWithModeSign: true,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: defaultRenderingConvention,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: defaultRenderingConvention,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: defaultRenderingConvention,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: defaultRenderingConvention,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: {
    ...defaultRenderingConvention,
    terminalPunctuation: '',
    modeSignGroupPlacement: 'after-starting-pitch',
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: defaultRenderingConvention,
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: defaultRenderingConvention,
};
