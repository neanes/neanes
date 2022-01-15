import {
  Neume,
  TimeNeume,
  QuantitativeNeume,
  Fthora,
  Accidental,
  VocalExpressionNeume,
  RootSign,
  Note,
  GorgonNeume,
  ModeSign,
  MeasureNumber,
  NoteIndicator,
  Ison,
} from '@/models/Neumes';

export interface NeumeAdjustmentOffset {
  x: number;
  y: number;
}

export interface NeumeAdjustment {
  isPairedWith: Neume[];
  offset: NeumeAdjustmentOffset;
}

export const rightGorgonNeumes: Neume[] = [
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.OligonPlusHyporoePlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusKentemata,
  QuantitativeNeume.OligonPlusIsonPlusKentemata,
  QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
  QuantitativeNeume.OligonPlusHamiliPlusKentemata,
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
  QuantitativeNeume.Hamili,
  QuantitativeNeume.HamiliPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphron,
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  QuantitativeNeume.DoubleHamili,
  QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
];

const defaultGorgonRightOffset: NeumeAdjustmentOffset = { x: 9, y: -4 };

export const gorgonAdjustmentMap = new Map<GorgonNeume, NeumeAdjustment[]>([
  [
    GorgonNeume.Gorgon_Top,
    [
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentemata],
        offset: { x: 0, y: -5 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft],
        offset: { x: 2, y: -3 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight],
        offset: { x: -4, y: -3 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
          QuantitativeNeume.PetastiPlusOligon,
          QuantitativeNeume.PetastiWithIson,
        ],
        offset: { x: 0, y: -7 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusKentimaAbove,
          QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
        ],
        offset: { x: 8, y: 0 },
      },
      {
        isPairedWith: [QuantitativeNeume.PetastiPlusDoubleHypsili],
        offset: { x: 2, y: 0 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.PetastiPlusKentimaAbove,
          QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
        ],
        offset: { x: 0, y: -9 },
      },
      {
        isPairedWith: [QuantitativeNeume.PetastiPlusHypsiliLeft],
        offset: { x: 5, y: 0 },
      },
      {
        isPairedWith: [QuantitativeNeume.PetastiPlusApostrophos],
        offset: { x: 0, y: -8 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusApostrophos],
        offset: { x: 0, y: -8 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentima],
        offset: { x: -7, y: 0 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.PetastiPlusElaphron,
          QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
        ],
        offset: { x: 0, y: -12 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusIson,
          QuantitativeNeume.OligonPlusHypsili,
        ],
        offset: { x: 0, y: -4 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusElaphron,
          QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
        ],
        offset: { x: -4, y: -9 },
      },
      {
        isPairedWith: [QuantitativeNeume.PetastiPlusRunningElaphron],
        offset: { x: 4, y: 0 },
      },
      // Right aligned
      {
        isPairedWith: [QuantitativeNeume.Hyporoe],
        offset: {
          x: defaultGorgonRightOffset.x + 8,
          y: defaultGorgonRightOffset.y + 4,
        },
      },
      {
        isPairedWith: [QuantitativeNeume.Apostrophos],
        offset: {
          x: defaultGorgonRightOffset.x,
          y: defaultGorgonRightOffset.y + 4,
        },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusIsonPlusKentemata,
          QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
          QuantitativeNeume.OligonPlusHyporoePlusKentemata,
          QuantitativeNeume.OligonPlusElaphronPlusKentemata,
          QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
          QuantitativeNeume.OligonPlusHamiliPlusKentemata,
          QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
        ],
        offset: {
          x: defaultGorgonRightOffset.x - 3,
          y: defaultGorgonRightOffset.y,
        },
      },
      {
        isPairedWith: [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical],
        offset: {
          x: defaultGorgonRightOffset.x + 4,
          y: defaultGorgonRightOffset.y,
        },
      },
      {
        isPairedWith: [
          QuantitativeNeume.DoubleHamili,
          QuantitativeNeume.HamiliPlusElaphron,
          QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
        ],
        offset: {
          x: defaultGorgonRightOffset.x,
          y: defaultGorgonRightOffset.y - 4,
        },
      },
      { isPairedWith: rightGorgonNeumes, offset: defaultGorgonRightOffset },
    ],
  ],

  [
    GorgonNeume.Gorgon_Bottom,
    [
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentima],
        offset: { x: -7, y: 0 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusKentimaBelow,
          QuantitativeNeume.KentemataPlusOligon,
          QuantitativeNeume.KentemataPlusOligonSpecial,
        ],
        offset: { x: -5, y: 0 },
      },
      {
        isPairedWith: [QuantitativeNeume.ElaphronPlusApostrophos],
        offset: { x: 0, y: 4 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Kentemata,
        ],
        offset: { x: 10, y: 4 },
      },
    ],
  ],

  [
    GorgonNeume.Digorgon,
    [
      {
        isPairedWith: [QuantitativeNeume.Hyporoe],
        offset: {
          x: defaultGorgonRightOffset.x + 5,
          y: defaultGorgonRightOffset.y + 6,
        },
      },
      { isPairedWith: rightGorgonNeumes, offset: defaultGorgonRightOffset },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedLeft1,
    [
      {
        isPairedWith: [QuantitativeNeume.Hyporoe],
        offset: {
          x: defaultGorgonRightOffset.x + 5,
          y: defaultGorgonRightOffset.y + 6,
        },
      },
      {
        isPairedWith: rightGorgonNeumes,
        offset: {
          x: defaultGorgonRightOffset.x,
          y: defaultGorgonRightOffset.y - 4,
        },
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedLeft2,
    [
      {
        isPairedWith: [QuantitativeNeume.Hyporoe],
        offset: {
          x: defaultGorgonRightOffset.x + 5,
          y: defaultGorgonRightOffset.y + 6,
        },
      },
      {
        isPairedWith: rightGorgonNeumes,
        offset: {
          x: defaultGorgonRightOffset.x,
          y: defaultGorgonRightOffset.y - 4,
        },
      },
    ],
  ],

  [
    GorgonNeume.DigorgonDottedRight,
    [
      {
        isPairedWith: [QuantitativeNeume.Hyporoe],
        offset: {
          x: defaultGorgonRightOffset.x + 5,
          y: defaultGorgonRightOffset.y + 6,
        },
      },
      {
        isPairedWith: rightGorgonNeumes,
        offset: {
          x: defaultGorgonRightOffset.x,
          y: defaultGorgonRightOffset.y - 4,
        },
      },
    ],
  ],

  [
    GorgonNeume.Trigorgon,
    [
      {
        isPairedWith: [QuantitativeNeume.Hyporoe],
        offset: {
          x: defaultGorgonRightOffset.x + 3,
          y: defaultGorgonRightOffset.y + 6,
        },
      },
      { isPairedWith: rightGorgonNeumes, offset: defaultGorgonRightOffset },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedLeft1,
    [
      {
        isPairedWith: [QuantitativeNeume.Hyporoe],
        offset: {
          x: defaultGorgonRightOffset.x + 3,
          y: defaultGorgonRightOffset.y + 6,
        },
      },
      {
        isPairedWith: rightGorgonNeumes,
        offset: {
          x: defaultGorgonRightOffset.x,
          y: defaultGorgonRightOffset.y - 4,
        },
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedLeft2,
    [
      {
        isPairedWith: [QuantitativeNeume.Hyporoe],
        offset: {
          x: defaultGorgonRightOffset.x + 3,
          y: defaultGorgonRightOffset.y + 6,
        },
      },
      {
        isPairedWith: rightGorgonNeumes,
        offset: {
          x: defaultGorgonRightOffset.x,
          y: defaultGorgonRightOffset.y - 4,
        },
      },
    ],
  ],

  [
    GorgonNeume.TrigorgonDottedRight,
    [
      {
        isPairedWith: [QuantitativeNeume.Hyporoe],
        offset: {
          x: defaultGorgonRightOffset.x + 3,
          y: defaultGorgonRightOffset.y + 6,
        },
      },
      {
        isPairedWith: rightGorgonNeumes,
        offset: {
          x: defaultGorgonRightOffset.x,
          y: defaultGorgonRightOffset.y - 4,
        },
      },
    ],
  ],
]);

gorgonAdjustmentMap.set(
  GorgonNeume.GorgonDottedLeft,
  gorgonAdjustmentMap.get(GorgonNeume.Gorgon_Top)!,
);

gorgonAdjustmentMap.set(GorgonNeume.GorgonDottedRight, [
  ...gorgonAdjustmentMap.get(GorgonNeume.Gorgon_Top)!.map((a) => ({
    isPairedWith: [...a.isPairedWith],
    offset: { x: a.offset.x, y: a.offset.y - 4 },
  })),
  {
    isPairedWith: [
      QuantitativeNeume.Elaphron,
      QuantitativeNeume.ElaphronPlusApostrophos,
      QuantitativeNeume.RunningElaphron,
    ],
    offset: { x: 0, y: -4 },
  },
]);

const rightTimeNeumes: Neume[] = [
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Hamili,
  QuantitativeNeume.HamiliPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphron,
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  QuantitativeNeume.DoubleHamili,
];

const defaultHapliRightOffset: NeumeAdjustmentOffset = { x: 14, y: 0 };
const defaultKlasmaTopRightOffset: NeumeAdjustmentOffset = { x: 9, y: -2 };

export const timeAdjustmentMap = new Map<TimeNeume, NeumeAdjustment[]>([
  [
    TimeNeume.Klasma_Top,
    [
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusKentimaAbove,
          QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
          QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
        ],
        offset: { x: -13, y: 0 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusHypsiliRight],
        offset: { x: -7, y: 0 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusHypsiliLeft],
        offset: { x: 4, y: 0 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusApostrophos,
          QuantitativeNeume.OligonPlusElaphron,
          QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
        ],
        offset: { x: -4, y: -9 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusIson,
          QuantitativeNeume.OligonPlusHypsili,
        ],
        offset: { x: 0, y: -4 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentima],
        offset: { x: -8, y: 0 },
      },
      // Right aligned
      {
        isPairedWith: [
          QuantitativeNeume.HamiliPlusElaphron,
          QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
        ],
        offset: {
          x: defaultKlasmaTopRightOffset.x,
          y: defaultKlasmaTopRightOffset.y - 6,
        },
      },
      {
        isPairedWith: [QuantitativeNeume.DoubleHamili],
        offset: {
          x: defaultKlasmaTopRightOffset.x,
          y: defaultKlasmaTopRightOffset.y - 8,
        },
      },
      { isPairedWith: rightTimeNeumes, offset: defaultKlasmaTopRightOffset },
    ],
  ],
  [
    TimeNeume.Klasma_Bottom,
    [
      {
        isPairedWith: [
          QuantitativeNeume.Petasti,
          QuantitativeNeume.PetastiPlusApostrophos,
          QuantitativeNeume.PetastiPlusDoubleHypsili,
          QuantitativeNeume.PetastiPlusElaphron,
          QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
          QuantitativeNeume.PetastiPlusHypsiliLeft,
          QuantitativeNeume.PetastiPlusHypsiliRight,
          QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
          QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
          QuantitativeNeume.PetastiWithIson,
          QuantitativeNeume.PetastiPlusKentimaAbove,
          QuantitativeNeume.PetastiPlusOligon,
          QuantitativeNeume.PetastiPlusHyporoe,
        ],
        offset: { x: 9, y: 2 },
      },
    ],
  ],
  [
    TimeNeume.Hapli,
    [
      {
        isPairedWith: [QuantitativeNeume.KentemataPlusOligon],
        offset: { x: 0, y: 6 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentimaBelow],
        offset: { x: 0, y: 4 },
      },
      { isPairedWith: rightTimeNeumes, offset: defaultHapliRightOffset },
    ],
  ],
  [
    TimeNeume.Dipli,
    [{ isPairedWith: rightTimeNeumes, offset: defaultHapliRightOffset }],
  ],
  [
    TimeNeume.Tripli,
    [{ isPairedWith: rightTimeNeumes, offset: defaultHapliRightOffset }],
  ],
]);

const homalonAdjustments: NeumeAdjustment[] = [
  {
    isPairedWith: [
      QuantitativeNeume.OligonPlusKentimaBelow,
      QuantitativeNeume.KentemataPlusOligon,
      QuantitativeNeume.KentemataPlusOligonSpecial,
      QuantitativeNeume.HamiliPlusApostrophos,
    ],
    offset: { x: 0, y: 4 },
  },
];

export const vocalExpressionAdjustmentMap = new Map<
  VocalExpressionNeume,
  NeumeAdjustment[]
>([
  [
    VocalExpressionNeume.Psifiston,
    [
      {
        isPairedWith: [
          QuantitativeNeume.Petasti,
          QuantitativeNeume.PetastiPlusApostrophos,
          QuantitativeNeume.PetastiPlusDoubleHypsili,
          QuantitativeNeume.PetastiPlusElaphron,
          QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
          QuantitativeNeume.PetastiPlusHypsiliLeft,
          QuantitativeNeume.PetastiPlusHypsiliRight,
          QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
          QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
          QuantitativeNeume.PetastiWithIson,
          QuantitativeNeume.PetastiPlusKentimaAbove,
          QuantitativeNeume.PetastiPlusOligon,
        ],
        offset: { x: 7, y: 0 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusIsonPlusKentemata,
          QuantitativeNeume.OligonPlusElaphronPlusKentemata,
          QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
          QuantitativeNeume.OligonPlusHamiliPlusKentemata,
          QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
          QuantitativeNeume.OligonPlusKentima,
        ],
        offset: { x: -6, y: 0 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.KentemataPlusOligon,
          QuantitativeNeume.KentemataPlusOligonSpecial,
        ],
        offset: { x: 0, y: 0 },
      },
    ],
  ],
  [
    VocalExpressionNeume.Antikenoma,
    [
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentima],
        offset: { x: -8, y: 0 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusKentimaBelow,
          QuantitativeNeume.ElaphronPlusApostrophos,
          QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
        ],
        offset: { x: 0, y: 4 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.KentemataPlusOligon,
          QuantitativeNeume.KentemataPlusOligonSpecial,
        ],
        offset: { x: 0, y: 6 },
      },
      {
        isPairedWith: [QuantitativeNeume.HamiliPlusApostrophos],
        offset: { x: 0, y: 6 },
      },
      {
        isPairedWith: [
          QuantitativeNeume.OligonPlusIsonPlusKentemata,
          QuantitativeNeume.OligonPlusElaphronPlusKentemata,
          QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
          QuantitativeNeume.OligonPlusHamiliPlusKentemata,
          QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
          QuantitativeNeume.OligonPlusKentima,
        ],
        offset: { x: -6, y: 0 },
      },
    ],
  ],
  [VocalExpressionNeume.Homalon, homalonAdjustments],
]);

const rightFthoraNeumes: Neume[] = [
  QuantitativeNeume.Apostrophos,
  QuantitativeNeume.DoubleHamili,
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Hamili,
  QuantitativeNeume.HamiliPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
  QuantitativeNeume.HamiliPlusElaphron,
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.OligonPlusKentimaAbove,
  QuantitativeNeume.OligonPlusKentemata,
  QuantitativeNeume.OligonPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusApostrophos,
  QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
  QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
  QuantitativeNeume.PetastiPlusKentimaAbove,
  QuantitativeNeume.PetastiPlusHypsiliLeft,
];

const bottomRightFthoraNeumes: Neume[] = [
  QuantitativeNeume.Hyporoe,
  QuantitativeNeume.Kentemata,
  QuantitativeNeume.Apostrophos,
];

const defaultTopRightFthoraAdjustment: NeumeAdjustmentOffset = { x: 13, y: 0 };

export const fthoraAdjustmentMap = new Map<Fthora, NeumeAdjustment[]>([
  [
    Fthora.DiatonicPa_Top,
    [{ isPairedWith: [ModeSign.Pa], offset: { x: 15, y: -9 } }],
  ],
  [
    Fthora.SoftChromaticThi_Top,
    [
      {
        isPairedWith: [ModeSign.Vou, ModeSign.Thi, ModeSign.Ke],
        offset: { x: 13, y: -7 },
      },
    ],
  ],
  [
    Fthora.HardChromaticPa_Top,
    [{ isPairedWith: [ModeSign.Pa], offset: { x: 6, y: -10 } }],
  ],
  [
    Fthora.DiatonicNiLow_Top,
    [
      { isPairedWith: [ModeSign.Ga], offset: { x: 10, y: -9 } },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentimaAbove],
        offset: { x: 13, y: 0 },
      },
    ],
  ],
]);

// Shortcut to enter adjustments for many fthora at once
for (let fthora of Object.values(Fthora)) {
  const adjustments = fthoraAdjustmentMap.get(fthora) || [];
  fthoraAdjustmentMap.set(fthora, adjustments);

  if (fthora.endsWith('Top')) {
    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusHypsiliRight],
      offset: { x: -10, y: 0 },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusKentima],
      offset: { x: -6, y: 0 },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight],
      offset: { x: 0, y: -5 },
    });

    adjustments.push({
      isPairedWith: [
        QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
        QuantitativeNeume.PetastiWithIson,
        QuantitativeNeume.PetastiPlusOligon,
        QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
        QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
        QuantitativeNeume.PetastiPlusApostrophos,
      ],
      offset: { x: 0, y: -10 },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusIsonPlusKentemata],
      offset: { x: -15, y: -5 },
    });

    adjustments.push({
      isPairedWith: [
        QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
        QuantitativeNeume.OligonPlusHyporoePlusKentemata,
        QuantitativeNeume.OligonPlusHamiliPlusKentemata,
      ],
      offset: { x: -15, y: -10 },
    });

    adjustments.push({
      isPairedWith: [
        QuantitativeNeume.OligonPlusElaphronPlusKentemata,
        QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
      ],
      offset: { x: -22, y: -13 },
    });

    adjustments.push({
      isPairedWith: [
        QuantitativeNeume.PetastiPlusElaphron,
        QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
      ],
      offset: { x: 0, y: -14 },
    });

    adjustments.push({
      isPairedWith: [
        QuantitativeNeume.Elaphron,
        QuantitativeNeume.ElaphronPlusApostrophos,
        QuantitativeNeume.RunningElaphron,
        QuantitativeNeume.PetastiPlusRunningElaphron,
      ],
      offset: { x: 0, y: -3 },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.PetastiPlusHypsiliRight],
      offset: { x: 0, y: -7 },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical],
      offset: { x: -9, y: -8 },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusDoubleHypsili],
      offset: { x: 4, y: -17 },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.PetastiPlusDoubleHypsili],
      offset: { x: 4, y: -20 },
    });

    adjustments.push({
      isPairedWith: [
        QuantitativeNeume.OligonPlusIson,
        QuantitativeNeume.OligonPlusElaphron,
        QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
        QuantitativeNeume.OligonPlusHypsili,
      ],
      offset: { x: 0, y: -8 },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusKentemata],
      offset: {
        x: defaultTopRightFthoraAdjustment.x + 5,
        y: defaultTopRightFthoraAdjustment.y,
      },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusKentimaAbove],
      offset: {
        x: defaultTopRightFthoraAdjustment.x + 2,
        y: defaultTopRightFthoraAdjustment.y,
      },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusApostrophos],
      offset: {
        x: defaultTopRightFthoraAdjustment.x + 3,
        y: defaultTopRightFthoraAdjustment.y,
      },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical],
      offset: {
        x: defaultTopRightFthoraAdjustment.x + 4,
        y: defaultTopRightFthoraAdjustment.y,
      },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.PetastiPlusKentimaAbove],
      offset: {
        x: defaultTopRightFthoraAdjustment.x,
        y: defaultTopRightFthoraAdjustment.y - 5,
      },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.PetastiPlusHypsiliLeft],
      offset: {
        x: defaultTopRightFthoraAdjustment.x + 5,
        y: defaultTopRightFthoraAdjustment.y,
      },
    });

    adjustments.push({
      isPairedWith: [
        QuantitativeNeume.HamiliPlusElaphron,
        QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
      ],
      offset: {
        x: defaultTopRightFthoraAdjustment.x,
        y: defaultTopRightFthoraAdjustment.y - 7,
      },
    });

    adjustments.push({
      isPairedWith: [QuantitativeNeume.DoubleHamili],
      offset: {
        x: defaultTopRightFthoraAdjustment.x,
        y: defaultTopRightFthoraAdjustment.y - 10,
      },
    });

    adjustments.push({
      isPairedWith: rightFthoraNeumes,
      offset: defaultTopRightFthoraAdjustment,
    });

    // All martyria should be right aligned
    adjustments.push({
      isPairedWith: Object.values(RootSign),
      offset: defaultTopRightFthoraAdjustment,
    });
  } else if (fthora.endsWith('Bottom')) {
    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusKentimaBelow],
      offset: { x: -5, y: 0 },
    });
    adjustments.push({
      isPairedWith: [QuantitativeNeume.OligonPlusKentima],
      offset: { x: -6, y: 0 },
    });
    adjustments.push({
      isPairedWith: [
        QuantitativeNeume.ElaphronPlusApostrophos,
        QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
      ],
      offset: { x: 0, y: 1 },
    });
    adjustments.push({
      isPairedWith: [QuantitativeNeume.HamiliPlusApostrophos],
      offset: { x: -5, y: 0 },
    });
    adjustments.push({
      isPairedWith: [
        QuantitativeNeume.KentemataPlusOligon,
        QuantitativeNeume.KentemataPlusOligonSpecial,
      ],
      offset: { x: -8, y: 0 },
    });
    adjustments.push({
      isPairedWith: [QuantitativeNeume.PetastiPlusRunningElaphron],
      offset: { x: -7, y: 0 },
    });

    adjustments.push({
      isPairedWith: bottomRightFthoraNeumes,
      offset: defaultTopRightFthoraAdjustment,
    });
  }
}

export const rootSignAdjustmentMap = new Map<RootSign, NeumeAdjustment[]>([
  [
    RootSign.Zygos,
    [{ isPairedWith: [Note.Vou, Note.Thi], offset: { x: 0, y: 3 } }],
  ],
]);

export const quantitativeNeumeAdjustmentMap = new Map<
  QuantitativeNeume,
  NeumeAdjustment[]
>([
  [
    QuantitativeNeume.RunningElaphron,
    [
      { isPairedWith: [ModeSign.Ga], offset: { x: 0, y: -7 } },
      { isPairedWith: [ModeSign.DeltaWithDeltaHat], offset: { x: 0, y: -7 } },
    ],
  ],
  [
    QuantitativeNeume.KentemataPlusOligon,
    [
      { isPairedWith: [ModeSign.Vou], offset: { x: 0, y: -7 } },
      { isPairedWith: [ModeSign.Ni], offset: { x: 0, y: -7 } },
    ],
  ],
  [
    QuantitativeNeume.OligonPlusHypsiliRight,
    [{ isPairedWith: [ModeSign.Pa], offset: { x: 0, y: -7 } }],
  ],
]);

export const modeSignAdjustmentMap = new Map<ModeSign, NeumeAdjustment[]>([
  [
    ModeSign.Legetos,
    [{ isPairedWith: [ModeSign.Vou], offset: { x: 0, y: -13 } }],
  ],
  [ModeSign.Tos, [{ isPairedWith: [ModeSign.Vou], offset: { x: 0, y: -13 } }]],
]);

const flatAdjustments: NeumeAdjustment[] = [
  {
    isPairedWith: [
      QuantitativeNeume.PetastiWithIson,
      QuantitativeNeume.PetastiPlusOligon,
      QuantitativeNeume.HamiliPlusElaphron,
      QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
      QuantitativeNeume.PetastiPlusElaphron,
      QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
    ],
    offset: { x: 0, y: -6 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.OligonPlusHypsiliRight,
      QuantitativeNeume.PetastiPlusHypsiliRight,
      QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
      QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
      QuantitativeNeume.PetastiPlusDoubleHypsili,
      QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
    ],
    offset: { x: 2, y: 0 },
  },
  {
    isPairedWith: [QuantitativeNeume.DoubleHamili],
    offset: { x: 0, y: -8 },
  },
];

const sharpAdjustments: NeumeAdjustment[] = [
  {
    isPairedWith: [
      QuantitativeNeume.OligonPlusIsonPlusKentemata,
      QuantitativeNeume.OligonPlusElaphronPlusKentemata,
      QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
      QuantitativeNeume.OligonPlusHamiliPlusKentemata,
      QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
    ],
    offset: { x: -12, y: 0 },
  },
  {
    isPairedWith: [QuantitativeNeume.Hyporoe, QuantitativeNeume.Kentemata],
    offset: { x: 16, y: 0 },
  },
  {
    isPairedWith: [QuantitativeNeume.Apostrophos],
    offset: { x: 12, y: 0 },
  },
];

export const accidentalAdjustmentMap = new Map<Accidental, NeumeAdjustment[]>([
  [Accidental.Flat_2_Right, flatAdjustments],
  [Accidental.Flat_4_Right, flatAdjustments],
  [Accidental.Flat_6_Right, flatAdjustments],
  [Accidental.Sharp_2_Left, sharpAdjustments],
  [Accidental.Sharp_4_Left, sharpAdjustments],
  [Accidental.Sharp_6_Left, sharpAdjustments],
]);

const measureNumberAdjustments: NeumeAdjustment[] = [
  {
    isPairedWith: [
      QuantitativeNeume.Petasti,
      QuantitativeNeume.PetastiPlusKentimaAbove,
      QuantitativeNeume.PetastiPlusHypsiliRight,
      QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
      QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
    ],
    offset: { x: 0, y: -8 },
  },
  {
    isPairedWith: [QuantitativeNeume.PetastiWithIson],
    offset: { x: 0, y: -18 },
  },
  {
    isPairedWith: [QuantitativeNeume.PetastiPlusOligon],
    offset: { x: 0, y: -14 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.PetastiPlusHypsiliLeft,
      QuantitativeNeume.PetastiPlusDoubleHypsili,
    ],
    offset: { x: 0, y: -12 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.Ison,
      QuantitativeNeume.Oligon,
      QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
      QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
      QuantitativeNeume.OligonPlusHypsiliRight,
      QuantitativeNeume.OligonPlusKentimaAbove,
      QuantitativeNeume.OligonPlusKentimaBelow,
      QuantitativeNeume.KentemataPlusOligon,
      QuantitativeNeume.KentemataPlusOligonSpecial,
    ],
    offset: { x: 0, y: -8 },
  },
  {
    isPairedWith: [QuantitativeNeume.OligonPlusKentemata],
    offset: { x: 0, y: -10 },
  },
  {
    isPairedWith: [QuantitativeNeume.OligonPlusApostrophos],
    offset: { x: -8, y: -6 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.OligonPlusHypsiliLeft,
      QuantitativeNeume.OligonPlusDoubleHypsili,
    ],
    offset: { x: -4, y: -14 },
  },
  {
    isPairedWith: [QuantitativeNeume.Apostrophos],
    offset: { x: 13, y: -8 },
  },
  {
    isPairedWith: [QuantitativeNeume.PetastiPlusApostrophos],
    offset: { x: 4, y: -14 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.Elaphron,
      QuantitativeNeume.ElaphronPlusApostrophos,
      QuantitativeNeume.RunningElaphron,
    ],
    offset: { x: 0, y: -7 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.PetastiPlusElaphron,
      QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
    ],
    offset: { x: 0, y: -18 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.Hamili,
      QuantitativeNeume.HamiliPlusApostrophos,
    ],
    offset: { x: 4, y: -16 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.HamiliPlusElaphron,
      QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
      QuantitativeNeume.DoubleHamili,
    ],
    offset: { x: 2, y: -24 },
  },
  {
    isPairedWith: [QuantitativeNeume.OligonPlusIsonPlusKentemata],
    offset: { x: -8, y: -10 },
  },
  {
    isPairedWith: [QuantitativeNeume.OligonPlusApostrophosPlusKentemata],
    offset: { x: -8, y: -14 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.OligonPlusElaphronPlusKentemata,
      QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
    ],
    offset: { x: -18, y: -16 },
  },
  {
    isPairedWith: [QuantitativeNeume.OligonPlusHamiliPlusKentemata],
    offset: { x: -18, y: -20 },
  },
  {
    isPairedWith: [QuantitativeNeume.Hyporoe],
    offset: { x: 20, y: -4 },
  },
  {
    isPairedWith: [QuantitativeNeume.Kentemata],
    offset: { x: 14, y: -4 },
  },
  {
    isPairedWith: [QuantitativeNeume.OligonPlusKentima],
    offset: { x: -8, y: -5 },
  },
  {
    isPairedWith: [QuantitativeNeume.DoubleApostrophos],
    offset: { x: 2, y: -5 },
  },
  {
    isPairedWith: [QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata],
    offset: { x: -10, y: -12 },
  },
  {
    isPairedWith: [QuantitativeNeume.IsonPlusApostrophos],
    offset: { x: 6, y: -4 },
  },
  {
    isPairedWith: [QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft],
    offset: { x: -5, y: -10 },
  },
  {
    isPairedWith: [QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight],
    offset: { x: -5, y: -10 },
  },
];

const measureNumberAdjustmentsCenter: NeumeAdjustment[] =
  measureNumberAdjustments.map((a) => ({
    isPairedWith: [...a.isPairedWith],
    offset: { x: a.offset.x - 12, y: a.offset.y },
  }));

export const measureNumberAdjustmentMap = new Map<
  MeasureNumber,
  NeumeAdjustment[]
>([
  [MeasureNumber.Two, measureNumberAdjustments],
  [MeasureNumber.Three, measureNumberAdjustments],
  [MeasureNumber.Four, measureNumberAdjustments],
  [MeasureNumber.Five, measureNumberAdjustments],
  [MeasureNumber.Six, measureNumberAdjustmentsCenter],
  [MeasureNumber.Seven, measureNumberAdjustmentsCenter],
  [MeasureNumber.Eight, measureNumberAdjustmentsCenter],
]);

// Note indicators are similarly positioned to
// measure numbers, so we can re-use those adjustments
const noteIndicatorAdjustments: NeumeAdjustment[] =
  measureNumberAdjustments.map((a) => ({
    isPairedWith: [...a.isPairedWith],
    offset: { x: a.offset.x, y: a.offset.y + 6 },
  }));

export const noteIndicatorAdjustmentMap = new Map<
  NoteIndicator,
  NeumeAdjustment[]
>();

Object.values(NoteIndicator).forEach((x) =>
  noteIndicatorAdjustmentMap.set(x, noteIndicatorAdjustments),
);

const isonAdjustments: NeumeAdjustment[] = [
  { isPairedWith: [QuantitativeNeume.Hyporoe], offset: { x: 16, y: -14 } },
  {
    isPairedWith: [QuantitativeNeume.Kentemata, QuantitativeNeume.Apostrophos],
    offset: { x: 8, y: -14 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.OligonPlusDoubleHypsili,
      QuantitativeNeume.PetastiPlusDoubleHypsili,
      QuantitativeNeume.PetastiPlusHypsiliLeft,
    ],
    offset: { x: 0, y: -16 },
  },
  {
    isPairedWith: [
      QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
      QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
    ],
    offset: { x: 0, y: -18 },
  },
  { isPairedWith: Object.values(QuantitativeNeume), offset: { x: 0, y: -14 } },
];

export const isonAdjustmentMap = new Map<Ison, NeumeAdjustment[]>();

Object.values(Ison).forEach((x) => isonAdjustmentMap.set(x, isonAdjustments));

export const getGorgonAdjustments = (neume: GorgonNeume) => {
  return gorgonAdjustmentMap.get(neume);
};

export const getTimeAdjustments = (neume: TimeNeume) => {
  return timeAdjustmentMap.get(neume);
};

export const getVocalExpressionAdjustments = (neume: VocalExpressionNeume) => {
  return vocalExpressionAdjustmentMap.get(neume);
};

export const getFthoraAdjustments = (neume: Fthora) => {
  return fthoraAdjustmentMap.get(neume);
};

export const getRootSignAdjustments = (neume: RootSign) => {
  return rootSignAdjustmentMap.get(neume);
};

export const getQuantitativeNeumeAdjustments = (neume: QuantitativeNeume) => {
  return quantitativeNeumeAdjustmentMap.get(neume);
};

export const getModeSignAdjustments = (neume: ModeSign) => {
  return modeSignAdjustmentMap.get(neume);
};

export const getAccidentalAdjustments = (neume: Accidental) => {
  return accidentalAdjustmentMap.get(neume);
};

export const getMeasureNumberAdjustments = (neume: MeasureNumber) => {
  return measureNumberAdjustmentMap.get(neume);
};

export const getNoteIndicatorAdjustments = (neume: NoteIndicator) => {
  return noteIndicatorAdjustmentMap.get(neume);
};

export const getIsonAdjustments = (neume: Ison) => {
  return isonAdjustmentMap.get(neume);
};

export const hyporoeGorgonOffset: NeumeAdjustmentOffset = { x: -10, y: -8 };
