import {
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_NUMERAL_STYLES,
  type InitialMartyriaLanguageId,
  type InitialMartyriaNumeralStyle,
  type InitialMartyriaStructure,
} from './InitialMartyriaStyle';

/**
 * Whether plagal modes set the plagal abbreviation beside the mode sign.
 * An optional one is chosen per style, starting from the default.
 */
export interface InitialMartyriaPlagalAbbreviationWithModeSign {
  optional: boolean;
  default: boolean;
}

export interface InitialMartyriaRenderingConvention {
  terminalPunctuation: '' | '.';
  modeSignGroupPlacement: 'before-starting-pitch' | 'after-starting-pitch';
  plagalAbbreviationNumeralStyles: readonly InitialMartyriaNumeralStyle[];
  plagalAbbreviationWithModeSign: InitialMartyriaPlagalAbbreviationWithModeSign;
  showGraveWordWithModeSign: boolean;
}

const alwaysWithModeSign: InitialMartyriaPlagalAbbreviationWithModeSign = {
  optional: false,
  default: true,
};

const neverWithModeSign: InitialMartyriaPlagalAbbreviationWithModeSign = {
  optional: false,
  default: false,
};

const defaultRenderingConvention: InitialMartyriaRenderingConvention = {
  terminalPunctuation: '.',
  modeSignGroupPlacement: 'before-starting-pitch',
  plagalAbbreviationNumeralStyles: [],
  plagalAbbreviationWithModeSign: alwaysWithModeSign,
  showGraveWordWithModeSign: false,
};

const initialMartyriaRenderingConventions: Record<
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
  [INITIAL_MARTYRIA_LANGUAGE_IDS.English]: {
    ...defaultRenderingConvention,
    plagalAbbreviationWithModeSign: { optional: true, default: true },
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Spanish]: {
    ...defaultRenderingConvention,
    plagalAbbreviationWithModeSign: { optional: true, default: false },
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.ChurchSlavonic]: {
    ...defaultRenderingConvention,
    plagalAbbreviationWithModeSign: neverWithModeSign,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Russian]: {
    ...defaultRenderingConvention,
    plagalAbbreviationWithModeSign: neverWithModeSign,
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Arabic]: {
    ...defaultRenderingConvention,
    terminalPunctuation: '',
    modeSignGroupPlacement: 'after-starting-pitch',
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Romanian]: {
    ...defaultRenderingConvention,
    terminalPunctuation: '',
  },
  [INITIAL_MARTYRIA_LANGUAGE_IDS.Indonesian]: defaultRenderingConvention,
};

export function getInitialMartyriaRenderingConvention(
  structure: Pick<InitialMartyriaStructure, 'languageId'>,
): InitialMartyriaRenderingConvention {
  return initialMartyriaRenderingConventions[structure.languageId];
}

/** Whether a style chooses for itself if the plagal abbreviation is shown. */
export function initialMartyriaPlagalAbbreviationWithModeSignIsOptional(
  structure: Pick<InitialMartyriaStructure, 'languageId' | 'labelVariant'>,
) {
  return getInitialMartyriaRenderingConvention(structure)
    .plagalAbbreviationWithModeSign.optional;
}

/**
 * Whether plagal modes of a structure set the plagal abbreviation beside the
 * mode sign: the style's own choice where the language makes it optional,
 * otherwise the language's practice.
 */
export function showsInitialMartyriaPlagalAbbreviationWithModeSign(
  structure: Pick<
    InitialMartyriaStructure,
    'languageId' | 'plagalAbbreviationWithModeSign'
  >,
) {
  const { optional, default: usual } =
    getInitialMartyriaRenderingConvention(
      structure,
    ).plagalAbbreviationWithModeSign;
  return optional ? (structure.plagalAbbreviationWithModeSign ?? usual) : usual;
}
