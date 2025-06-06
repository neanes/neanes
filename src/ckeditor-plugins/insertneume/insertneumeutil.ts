import { fontService } from '@/services/FontService';

export interface InsertNeumeAttributes {
  top: number;
  left: number;
  kerningLeft: number;
  kerningRight: number;
  neumeFontSize: number;
  width: number | null;
  color: string | null;
}

export interface InsertNeumeAttributeSet {
  code: number;
  attributes: Partial<InsertNeumeAttributes>;
}

export interface CharacterBlock {
  name: string;
  ranges: Array<{ start: number; end: number; attributes?: string[] }>;
}

export type InsertNeumeDefaultAttributesType = Record<
  string,
  InsertNeumeAttributeSet[]
>;

export type InsertNeumeDefaultAttributesMartyriaType = Record<
  string,
  Partial<InsertNeumeAttributes>
>;

export const INSERT_NEUME_CHARACTER_BLOCKS = [
  {
    name: 'Mode Keys - Common',
    ranges: [
      { start: 0xe2a0, end: 0xe2a1 }, // mode 1
      { start: 0xe2a8, end: 0xe2a8 }, // mode 2
      { start: 0xe2b0, end: 0xe2b1 }, // mode 3
      { start: 0xe2b8, end: 0xe2b9 }, // mode 4
      { start: 0xe2ba, end: 0xe2ba }, // mode 4
      { start: 0xe2c0, end: 0xe2c0 }, // mode 5
      { start: 0xe2c8, end: 0xe2c8 }, // mode 6
      { start: 0xe2d0, end: 0xe2d1 }, // mode 7
      { start: 0xe2d8, end: 0xe2d8 }, // mode 8
      { start: 0xe2f0, end: 0xe2f0 }, // plagal
      //{ start: 0xe190, end: 0xe19f, attributes: ['fthora'] }, // Fthores

      { start: 0x1d0b6, end: 0x1d0b6, attributes: ['fthora'] }, // Fthores
      { start: 0x1d0ba, end: 0x1d0bb, attributes: ['fthora'] }, // Fthores
      { start: 0x1d0bd, end: 0x1d0bd, attributes: ['fthora'] }, // Fthores
      { start: 0x1d0bf, end: 0x1d0c5, attributes: ['fthora'] }, // Fthores
      { start: 0x1d0c7, end: 0x1d0cb, attributes: ['fthora'] }, // Fthores
      { start: 0xe004, end: 0xe005 }, // oligonKentimaAbove, oligonYpsiliRight
      { start: 0xe024, end: 0xe025 }, // elafron, runningElafron
      { start: 0xe120, end: 0xe127 }, // chronos
      { start: 0xe280, end: 0xe281 }, // n and double n
    ],
  },
  //   {
  //     name: 'SBMuFL - Base',
  //     ranges: [
  //       { start: 0xe000, end: 0xe015 },
  //       { start: 0xe020, end: 0xe02f },
  //       { start: 0xe040, end: 0xe04e },
  //       { start: 0xe060, end: 0xe06a },
  //       { start: 0xe080, end: 0xe08d },
  //     ],
  //   },
  //   {
  //     name: 'Byzantine Musical Symbols',
  //     ranges: [
  //       {
  //         start: 0x1d000,
  //         end: 0x1d0ff,
  //       },
  //     ],
  //   },
];

const defaultBaselineAdjustment = 0.366;
const defaultFontSizeAdjustment = 1.3;

export const INSERT_NEUME_DEFAULT_ATTRIBUTES: InsertNeumeDefaultAttributesType =
  {
    Neanes: [
      {
        code: 0xe2a0, // modeFirst
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: 0.072,
          kerningLeft: -0.266,
        },
      },
      {
        code: 0xe2a1, // modeFirstShort
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: defaultBaselineAdjustment,
          kerningLeft: -0.338,
        },
      },
      {
        code: 0xe2a8, // modeSecond
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: defaultBaselineAdjustment,
          kerningLeft: -0.249,
        },
      },
      {
        code: 0xe2b0, // modeThird
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningLeft: -0.3,
          kerningRight: -0.3,
        },
      },
      {
        code: 0xe2b1, // modeThirdNana
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: 0.095,
          kerningLeft: -0.32,
        },
      },
      {
        code: 0xe2b8, // modeFourth
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: 0.108,
          kerningLeft: -0.202,
        },
      },
      {
        code: 0xe2b9, // modeFourthShort
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: defaultBaselineAdjustment,
          kerningLeft: -0.235,
        },
      },
      {
        code: 0xe2ba, // modeLegetos
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: 0.036,
          kerningLeft: -0.134,
        },
      },
      {
        code: 0xe2c0, // modePlagalFirst
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: defaultBaselineAdjustment,
          kerningLeft: -0.338,
        },
      },
      {
        code: 0xe2c8, // modePlagalSecond
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: defaultBaselineAdjustment,
          kerningLeft: -0.3,
        },
      },
      {
        code: 0xe2d0, // modeVarys
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningLeft: -0.241,
        },
      },
      {
        code: 0xe2d1, // modeVarys2
        attributes: { neumeFontSize: defaultFontSizeAdjustment, top: -0.33 },
      },
      {
        code: 0xe2d8, // modePlagalFourth
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: defaultBaselineAdjustment,
          kerningLeft: -0.25,
        },
      },
      {
        code: 0xe2f0, // modePlagal
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          top: defaultBaselineAdjustment,
          kerningLeft: -0.324,
        },
      },
      {
        code: 0x1d0b6,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0B6`),
        },
      },
      {
        code: 0x1d0ba,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0BA`),
        },
      },
      {
        code: 0x1d0bb,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0BB`),
        },
      },
      {
        code: 0x1d0bd,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0BD`),
        },
      },
      {
        code: 0x1d0bf,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0BF`),
        },
      },
      {
        code: 0x1d0c0,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0C0`),
        },
      },
      {
        code: 0x1d0c1,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0C1`),
        },
      },
      {
        code: 0x1d0c2,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0C2`),
        },
      },
      {
        code: 0x1d0c3,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0C3`),
        },
      },
      {
        code: 0x1d0c4,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0C4`),
        },
      },
      {
        code: 0x1d0c5,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0C5`),
        },
      },
      {
        code: 0x1d0c7,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0C7`),
        },
      },
      {
        code: 0x1d0c8,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0C8`),
        },
      },
      {
        code: 0x1d0c9,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0C9`),
        },
      },
      {
        code: 0x1d0ca,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0CA`),
        },
      },
      {
        code: 0x1d0cb,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `U+1D0CB`),
        },
      },
    ],
  };

export const INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA: InsertNeumeDefaultAttributesMartyriaType =
  {
    Neanes: {
      neumeFontSize: 1.5,
      top: -0.29,
      kerningLeft: -0.3,
    },
  };

// Temporary Shortcut
INSERT_NEUME_DEFAULT_ATTRIBUTES['NeanesStathisSeries'] =
  INSERT_NEUME_DEFAULT_ATTRIBUTES['Neanes'];

INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA['NeanesStathisSeries'] =
  INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA['Neanes'];
