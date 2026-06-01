import {
  Fthora,
  Letter,
  ModeSign,
  Neume,
  QuantitativeNeume,
  TempoSign,
} from '@/models/Neumes';

import { DEFAULT_ATTRIBUTES_ALMOUZIOS } from './insertneumeutil.Almouzios';
import { DEFAULT_ATTRIBUTES_PSALTICA } from './insertneumeutil.Neanes';
import { DEFAULT_ATTRIBUTES_STATHIS } from './insertneumeutil.NeanesStathisSeries';

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
  neume: Neume;
  attributes: Partial<InsertNeumeAttributes>;
}

export interface CharacterBlock {
  name: string;
  neumes: Neume[];
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
    neumes: [
      ModeSign.AlphaWithDeltaHat,
      ModeSign.AlphaWithHypsili,
      ModeSign.SoftChromatic2,
      ModeSign.Nana,
      ModeSign.NanaOld,
      ModeSign.DeltaWithDeltaHat,
      ModeSign.DeltaWithHypsili,
      ModeSign.Legetos,
      ModeSign.Alpha,
      ModeSign.SoftChromatic6,
      ModeSign.VarysZo,
      ModeSign.Delta,
      ModeSign.Plagal,
      Fthora.DiatonicNiLow,
      Fthora.DiatonicPa,
      Fthora.DiatonicVou,
      Fthora.DiatonicGa,
      Fthora.DiatonicThi,
      Fthora.DiatonicKe,
      Fthora.DiatonicZo,
      Fthora.DiatonicNiHigh,
      Fthora.HardChromaticPa,
      Fthora.HardChromaticThi,
      Fthora.SoftChromaticThi,
      Fthora.SoftChromaticPa,
      Fthora.Enharmonic,
      Fthora.Zygos,
      Fthora.Kliton,
      Fthora.Spathi,
      QuantitativeNeume.KentemataPlusOligon,
      QuantitativeNeume.OligonPlusKentima,
      QuantitativeNeume.OligonPlusKentimaAbove,
      QuantitativeNeume.OligonPlusHypsiliRight,
      ModeSign.OligonPlusHypsili,
      QuantitativeNeume.OligonPlusHypsiliLeft,
      QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
      QuantitativeNeume.Elaphron,
      QuantitativeNeume.RunningElaphron,
      TempoSign.VerySlow,
      TempoSign.Slower,
      TempoSign.Slow,
      TempoSign.Medium,
      TempoSign.Moderate,
      TempoSign.Quick,
      TempoSign.Quicker,
      TempoSign.VeryQuick,
      Letter.Pelastikon,
      Letter.Gorthmikon,
      ModeSign.Ekhos,
      ModeSign.Varys,
      ModeSign.Zo,
      ModeSign.Ni,
      ModeSign.Pa,
      ModeSign.Vou,
      ModeSign.Ga,
      ModeSign.Thi,
      ModeSign.Ke,
      ModeSign.First,
      ModeSign.FirstCapital,
      ModeSign.Second,
      ModeSign.SecondCapital,
      ModeSign.Third,
      ModeSign.ThirdCapital,
      ModeSign.Fourth,
      ModeSign.FourthCapital,
    ],
  },
];

export const INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA: InsertNeumeDefaultAttributesMartyriaType =
  {
    Neanes: {
      neumeFontSize: 1.7,
      top: -0.29,
      kerningLeft: -0.3,
    },
    NeanesRTL: {
      neumeFontSize: 1.7,
      top: -0.29,
      kerningLeft: -0.3,
    },
    NeanesStathisSeries: {
      neumeFontSize: 1.7,
      top: -0.29,
      kerningLeft: -0.3,
    },
    Almouzios: {
      neumeFontSize: 1.7,
      top: -0.8,
    },
  };

export const INSERT_NEUME_DEFAULT_ATTRIBUTES: InsertNeumeDefaultAttributesType =
  {
    Neanes: DEFAULT_ATTRIBUTES_PSALTICA,
    NeanesRTL: DEFAULT_ATTRIBUTES_PSALTICA,
    NeanesStathisSeries: DEFAULT_ATTRIBUTES_STATHIS,
    Almouzios: DEFAULT_ATTRIBUTES_ALMOUZIOS,
  };
