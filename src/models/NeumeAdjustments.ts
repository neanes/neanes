import {
  Neume,
  TimeNeume,
  QuantitativeNeume,
  Fthora,
  Accidental,
  TempoSign,
  VocalExpressionNeume,
  RootSign,
  Note,
  GorgonNeume,
  ModeSign,
} from '@/models/Neumes';

export interface NeumeAdjustmentOffset {
  x: number;
  y: number;
}

export interface NeumeAdjustment {
  isPairedWith: Neume[];
  offset: NeumeAdjustmentOffset;
}

export const gorgonAdjustmentMap = new Map<GorgonNeume, NeumeAdjustment[]>([
  [
    GorgonNeume.Gorgon_Top,
    [
      {
        isPairedWith: [QuantitativeNeume.OligonPlusKentemata],
        offset: { x: 0, y: -5 },
      },
    ],
  ],

  [
    GorgonNeume.Gorgon_TopRight,
    [
      { isPairedWith: [QuantitativeNeume.Hyporoe], offset: { x: 8, y: 4 } },
      { isPairedWith: [QuantitativeNeume.Apostrophos], offset: { x: 0, y: 4 } },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusIsonPlusKentemata],
        offset: { x: -3, y: 0 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusApostrophosPlusKentemata],
        offset: { x: -3, y: 0 },
      },
      {
        isPairedWith: [QuantitativeNeume.OligonPlusElaphronPlusKentemata],
        offset: { x: -3, y: 0 },
      },
    ],
  ],

  [
    GorgonNeume.Digorgon_Right,
    [{ isPairedWith: [QuantitativeNeume.Hyporoe], offset: { x: 5, y: 6 } }],
  ],

  [
    GorgonNeume.Trigorgon_Right,
    [{ isPairedWith: [QuantitativeNeume.Hyporoe], offset: { x: 3, y: 6 } }],
  ],
]);

export const timeAdjustmentMap = new Map<TimeNeume, NeumeAdjustment[]>([
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
        ],
        offset: { x: 9, y: 2 },
      },
    ],
  ],
]);

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
          QuantitativeNeume.OligonPlusKentima,
        ],
        offset: { x: -6, y: 0 },
      },
      {
        isPairedWith: [QuantitativeNeume.KentemataPlusOligon],
        offset: { x: 0, y: 5 },
      },
    ],
  ],
]);

export const fthoraAdjustmentMap = new Map<Fthora, NeumeAdjustment[]>([
  [
    Fthora.DiatonicPa_TopRight,
    [{ isPairedWith: [ModeSign.Pa], offset: { x: 2, y: -9 } }],
  ],
]);

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
