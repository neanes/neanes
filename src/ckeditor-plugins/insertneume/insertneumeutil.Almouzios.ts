import {
  Fthora,
  ModeSign,
  QuantitativeNeume,
  TempoSign,
} from '@/models/Neumes';
import { fontService } from '@/services/FontService';
import { NeumeMappingService } from '@/services/NeumeMappingService';

import { InsertNeumeAttributeSet } from './insertneumeutil';

const defaultFontSizeAdjustment = 1.7;

export const DEFAULT_ATTRIBUTES_ALMOUZIOS: InsertNeumeAttributeSet[] = [
  {
    neume: ModeSign.AlphaWithHypsili, // modeFirst
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.AlphaWithDeltaHat, // modeFirstShort
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.SoftChromatic2, // modeSecond
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.NanaOld, // modeThird
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Nana, // modeThirdNana
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.DeltaWithHypsili, // modeFourth
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.DeltaWithDeltaHat, // modeFourthShort
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Legetos, // modeLegetos
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Alpha, // modePlagalFirst
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.SoftChromatic6, // modePlagalSecond
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.VarysZo, // modeVarys2
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Delta, // modePlagalFourth
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Plagal, // modePlagal
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: Fthora.DiatonicNiLow,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.DiatonicNiLow).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicPa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.DiatonicPa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicVou,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.DiatonicVou).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicGa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.DiatonicGa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicThi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.DiatonicThi).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicKe,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.DiatonicKe).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicZo,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.DiatonicZo).glyphName,
      ),
    },
  },
  {
    neume: Fthora.DiatonicNiHigh,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.DiatonicNiHigh).glyphName,
      ),
    },
  },
  {
    neume: Fthora.HardChromaticPa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.HardChromaticPa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.HardChromaticThi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.HardChromaticThi).glyphName,
      ),
    },
  },
  {
    neume: Fthora.SoftChromaticThi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.SoftChromaticThi).glyphName,
      ),
    },
  },
  {
    neume: Fthora.SoftChromaticPa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.SoftChromaticPa).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Enharmonic,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.Enharmonic).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Zygos,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.Zygos).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Kliton,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.Kliton).glyphName,
      ),
    },
  },
  {
    neume: Fthora.Spathi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
      kerningRight: -fontService.getAdvanceWidth(
        'Almouzios',
        NeumeMappingService.getMapping(Fthora.Spathi).glyphName,
      ),
    },
  },
  {
    neume: TempoSign.Medium,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: TempoSign.Moderate,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: TempoSign.Quick,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: TempoSign.Quicker,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: TempoSign.Slow,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: TempoSign.Slower,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: TempoSign.VeryQuick,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: TempoSign.VerySlow,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.OligonPlusHypsili,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
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
    },
  },
  {
    neume: ModeSign.Varys,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Ni,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Pa,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Vou,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Ga,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Thi,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Ke,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Zo,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.First,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.FirstCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Second,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.SecondCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Third,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.ThirdCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.Fourth,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
  {
    neume: ModeSign.FourthCapital,
    attributes: {
      neumeFontSize: defaultFontSizeAdjustment,
    },
  },
];
