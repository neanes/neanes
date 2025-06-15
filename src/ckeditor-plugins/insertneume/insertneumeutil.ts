import {
  Fthora,
  Letter,
  ModeSign,
  Neume,
  QuantitativeNeume,
  TempoSign,
} from '@/models/Neumes';
import { fontService } from '@/services/FontService';
import { NeumeMappingService } from '@/services/NeumeMappingService';

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

const defaultBaselineAdjustment = 0.366;
const defaultFontSizeAdjustment = 1.7;

const defaultTempoTopAdjustmentStathis = -0.1;

const defaultTempoTopAdjustmentPsaltica = -0.15;
const defaultTempoFontSizeAdjustmentPsaltica = 1.05;

const DEFAULT_ATTRIBUTES_PSALTICA: InsertNeumeAttributeSet[] = [
  {
    neume: ModeSign.AlphaWithHypsili, // modeFirst
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.072,
      kerningLeft: -0.266,
    },
  },
  {
    neume: ModeSign.AlphaWithDeltaHat, // modeFirstShort
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.338,
    },
  },
  {
    neume: ModeSign.SoftChromatic2, // modeSecond
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.249,
    },
  },
  {
    neume: ModeSign.NanaOld, // modeThird
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningLeft: -0.3,
      kerningRight: -0.3,
    },
  },
  {
    neume: ModeSign.Nana, // modeThirdNana
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.095,
      kerningLeft: -0.32,
    },
  },
  {
    neume: ModeSign.DeltaWithHypsili, // modeFourth
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.108,
      kerningLeft: -0.202,
    },
  },
  {
    neume: ModeSign.DeltaWithDeltaHat, // modeFourthShort
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.235,
    },
  },
  {
    neume: ModeSign.Legetos, // modeLegetos
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.036,
      kerningLeft: -0.134,
    },
  },
  {
    neume: ModeSign.Alpha, // modePlagalFirst
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.338,
    },
  },
  {
    neume: ModeSign.SoftChromatic6, // modePlagalSecond
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.3,
    },
  },
  {
    neume: ModeSign.VarysZo, // modeVarys2
    attributes: { neumeFontSize: defaultFontSizeAdjustment, top: 0.33 },
  },
  {
    neume: ModeSign.Delta, // modePlagalFourth
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.25,
    },
  },
  {
    neume: ModeSign.Plagal, // modePlagal
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.324,
    },
  },
  {
    neume: Fthora.DiatonicNiLow,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicNiLow).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicPa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicNiLow).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicVou,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicVou).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicGa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicGa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicThi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicThi).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicKe,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicKe).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicZo,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicZo).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicNiHigh,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicNiHigh).glyphName,
      ),
    },
  },
  {
    neume: Fthora.HardChromaticPa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.HardChromaticPa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.HardChromaticThi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.HardChromaticThi).glyphName,
      ),
    },
  },
  {
    neume: Fthora.SoftChromaticThi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.SoftChromaticThi).glyphName,
      ),
    },
  },
  {
    neume: Fthora.SoftChromaticPa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.SoftChromaticPa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Enharmonic,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.Enharmonic).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Zygos,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.Zygos).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Kliton,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.Kliton).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Spathi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.Spathi).glyphName,
      ),
    },
  },
  {
    neume: TempoSign.Medium,
    attributes: {
      neumeFontSize: defaultTempoFontSizeAdjustmentPsaltica,
      top: defaultTempoTopAdjustmentPsaltica,
    },
  },
  {
    neume: TempoSign.Moderate,
    attributes: {
      neumeFontSize: defaultTempoFontSizeAdjustmentPsaltica,
      top: defaultTempoTopAdjustmentPsaltica,
    },
  },
  {
    neume: TempoSign.Quick,
    attributes: {
      neumeFontSize: defaultTempoFontSizeAdjustmentPsaltica,
      top: defaultTempoTopAdjustmentPsaltica,
    },
  },
  {
    neume: TempoSign.Quicker,
    attributes: {
      neumeFontSize: defaultTempoFontSizeAdjustmentPsaltica,
      top: defaultTempoTopAdjustmentPsaltica,
    },
  },
  {
    neume: TempoSign.Slow,
    attributes: {
      neumeFontSize: defaultTempoFontSizeAdjustmentPsaltica,
      top: defaultTempoTopAdjustmentPsaltica,
    },
  },
  {
    neume: TempoSign.Slower,
    attributes: {
      neumeFontSize: defaultTempoFontSizeAdjustmentPsaltica,
      top: defaultTempoTopAdjustmentPsaltica,
    },
  },
  {
    neume: TempoSign.VeryQuick,
    attributes: {
      neumeFontSize: defaultTempoFontSizeAdjustmentPsaltica,
      top: defaultTempoTopAdjustmentPsaltica,
    },
  },
  {
    neume: TempoSign.VerySlow,
    attributes: {
      neumeFontSize: defaultTempoFontSizeAdjustmentPsaltica,
      top: defaultTempoTopAdjustmentPsaltica,
    },
  },
  {
    neume: ModeSign.OligonPlusHypsili,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      width: 1.444,
      kerningRight: -1.444,
    },
  },
  {
    neume: QuantitativeNeume.KentemataPlusOligon,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusKentima,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusKentimaAbove,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusHypsiliRight,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusHypsiliLeft,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.Elaphron,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.RunningElaphron,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Ekhos,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Varys,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Ni,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Pa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Vou,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Ga,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Thi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Ke,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Zo,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.First,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.FirstCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Second,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.SecondCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Third,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.ThirdCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Fourth,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.FourthCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
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
  };

const DEFAULT_ATTRIBUTES_STATHIS: InsertNeumeAttributeSet[] = [
  {
    neume: ModeSign.AlphaWithHypsili, // modeFirst
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.2,
      kerningLeft: -0.266,
    },
  },
  {
    neume: ModeSign.AlphaWithDeltaHat, // modeFirstShort
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.2,
      kerningLeft: -0.266,
    },
  },
  {
    neume: ModeSign.SoftChromatic2, // modeSecond
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.249,
    },
  },
  {
    neume: ModeSign.NanaOld, // modeThird
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningLeft: -0.3,
      kerningRight: -0.3,
    },
  },
  {
    neume: ModeSign.Nana, // modeThirdNana
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.095,
      kerningLeft: -0.32,
    },
  },
  {
    neume: ModeSign.DeltaWithHypsili, // modeFourth
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.108,
      kerningLeft: -0.202,
    },
  },
  {
    neume: ModeSign.DeltaWithDeltaHat, // modeFourthShort
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.108,
      kerningLeft: -0.235,
    },
  },
  {
    neume: ModeSign.Legetos, // modeLegetos
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: 0.23,
      kerningLeft: -0.4,
    },
  },
  {
    neume: ModeSign.Alpha, // modePlagalFirst
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.338,
    },
  },
  {
    neume: ModeSign.SoftChromatic6, // modePlagalSecond
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.3,
    },
  },
  {
    neume: ModeSign.VarysZo, // modeVarys2
    attributes: { neumeFontSize: defaultFontSizeAdjustment },
  },
  {
    neume: ModeSign.Delta, // modePlagalFourth
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.25,
    },
  },
  {
    neume: ModeSign.Plagal, // modePlagal
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
      kerningLeft: -0.324,
    },
  },
  {
    neume: Fthora.DiatonicNiLow,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicNiLow).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicPa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicNiLow).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicVou,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicVou).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicGa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicGa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicThi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicThi).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicKe,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicKe).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicZo,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicZo).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicNiHigh,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.DiatonicNiHigh).glyphName,
      ),
    },
  },
  {
    neume: Fthora.HardChromaticPa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.HardChromaticPa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.HardChromaticThi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.HardChromaticThi).glyphName,
      ),
    },
  },
  {
    neume: Fthora.SoftChromaticThi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.SoftChromaticThi).glyphName,
      ),
    },
  },
  {
    neume: Fthora.SoftChromaticPa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.SoftChromaticPa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Enharmonic,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.Enharmonic).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Zygos,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.Zygos).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Kliton,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.Kliton).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Spathi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Neanes',
        NeumeMappingService.getMapping(Fthora.Spathi).glyphName,
      ),
    },
  },
  {
    neume: TempoSign.Medium,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultTempoTopAdjustmentStathis,
    },
  },
  {
    neume: TempoSign.Moderate,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultTempoTopAdjustmentStathis,
    },
  },
  {
    neume: TempoSign.Quick,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultTempoTopAdjustmentStathis,
    },
  },
  {
    neume: TempoSign.Quicker,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultTempoTopAdjustmentStathis,
    },
  },
  {
    neume: TempoSign.Slow,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultTempoTopAdjustmentStathis,
    },
  },
  {
    neume: TempoSign.Slower,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultTempoTopAdjustmentStathis,
    },
  },
  {
    neume: TempoSign.VeryQuick,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultTempoTopAdjustmentStathis,
    },
  },
  {
    neume: TempoSign.VerySlow,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultTempoTopAdjustmentStathis,
    },
  },
  {
    neume: ModeSign.OligonPlusHypsili,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      width: 1.444,
      kerningRight: -1.444,
    },
  },
  {
    neume: QuantitativeNeume.KentemataPlusOligon,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusKentima,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusKentimaAbove,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusHypsiliRight,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusHypsiliLeft,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.Elaphron,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: QuantitativeNeume.RunningElaphron,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Ekhos,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Varys,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Ni,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Pa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Vou,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Ga,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Thi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Ke,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Zo,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.First,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.FirstCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Second,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.SecondCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Third,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.ThirdCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.Fourth,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
  {
    neume: ModeSign.FourthCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      top: defaultBaselineAdjustment,
    },
  },
];

export const INSERT_NEUME_DEFAULT_ATTRIBUTES: InsertNeumeDefaultAttributesType =
  {
    Neanes: DEFAULT_ATTRIBUTES_PSALTICA,
    NeanesRTL: DEFAULT_ATTRIBUTES_PSALTICA,
    NeanesStathisSeries: DEFAULT_ATTRIBUTES_STATHIS,
  };
