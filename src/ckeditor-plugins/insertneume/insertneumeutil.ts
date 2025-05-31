export interface InsertNeumeAttributes {
  top: number;
  left: number;
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
      { start: 0xe190, end: 0xe19f, attributes: ['fthora'] }, // Fthores

      // { start: 0x1d0b6, end: 0x1d0b6, attributes: ['fthora'] }, // Fthores
      // { start: 0x1d0ba, end: 0x1d0bb, attributes: ['fthora'] }, // Fthores
      // { start: 0x1d0bd, end: 0x1d0bd, attributes: ['fthora'] }, // Fthores
      // { start: 0x1d0bf, end: 0x1d0c5, attributes: ['fthora'] }, // Fthores
      // { start: 0x1d0c7, end: 0x1d0cb, attributes: ['fthora'] }, // Fthores
      { start: 0xe004, end: 0xe005 }, // oligonKentimaAbove, oligonYpsiliRight
      { start: 0xe024, end: 0xe025 }, // elafron, runningElafron
      { start: 0xe120, end: 0xe127 }, // chronos
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
const defaultFontSizeAdjustment = 1.2;

export const INSERT_NEUME_DEFAULT_ATTRIBUTES: InsertNeumeDefaultAttributesType =
  {
    Neanes: [
      {
        code: 0xe2a0,
        attributes: {
          top: defaultBaselineAdjustment,
          neumeFontSize: defaultFontSizeAdjustment,
        },
      },
      {
        code: 0xe2a1,
        attributes: {
          top: defaultBaselineAdjustment,
          neumeFontSize: defaultFontSizeAdjustment,
        },
      },
    ],
  };
