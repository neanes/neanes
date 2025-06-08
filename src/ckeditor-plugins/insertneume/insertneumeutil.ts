import {
  ModeSign,
  Neume,
  QuantitativeNeume,
  TempoSign,
  UnicodeNeume,
} from '@/models/Neumes';
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
      UnicodeNeume.Uni1d0b6, // fthora start
      UnicodeNeume.Uni1d0ba,
      UnicodeNeume.Uni1d0bb,
      UnicodeNeume.Uni1d0bd,
      UnicodeNeume.Uni1d0bf,
      UnicodeNeume.Uni1d0c0,
      UnicodeNeume.Uni1d0c1,
      UnicodeNeume.Uni1d0c2,
      UnicodeNeume.Uni1d0c3,
      UnicodeNeume.Uni1d0c4,
      UnicodeNeume.Uni1d0c5,
      UnicodeNeume.Uni1d0c7,
      UnicodeNeume.Uni1d0c8,
      UnicodeNeume.Uni1d0c9,
      UnicodeNeume.Uni1d0ca,
      UnicodeNeume.Uni1d0cb, // end fthoras
      QuantitativeNeume.OligonPlusKentimaAbove,
      QuantitativeNeume.OligonPlusHypsiliRight,
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
      UnicodeNeume.Uni1d0b4, // pelastikon
      UnicodeNeume.Uni1d0b5, // gorthmikon
    ],
  },
];

const defaultBaselineAdjustment = 0.366;
const defaultFontSizeAdjustment = 1.7;

export const INSERT_NEUME_DEFAULT_ATTRIBUTES: InsertNeumeDefaultAttributesType =
  {
    Neanes: [
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
        attributes: { neumeFontSize: defaultFontSizeAdjustment, top: -0.33 },
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
        neume: UnicodeNeume.Uni1d0b6,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0b6`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0ba,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0ba`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0bb,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0bb`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0bd,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0bd`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0bf,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0bf`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0c0,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0c0`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0c1,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0c1`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0c2,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0c2`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0c3,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0c3`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0c4,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0c4`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0c5,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0c5`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0c7,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0c7`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0c8,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0c8`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0c9,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0c9`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0ca,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0ca`),
        },
      },
      {
        neume: UnicodeNeume.Uni1d0cb,
        attributes: {
          neumeFontSize: defaultFontSizeAdjustment,
          kerningRight: -fontService.getAdvanceWidth('Neanes', `uni1d0cb`),
        },
      },
    ],
  };

export const INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA: InsertNeumeDefaultAttributesMartyriaType =
  {
    Neanes: {
      neumeFontSize: 1.7,
      top: -0.29,
      kerningLeft: -0.3,
    },
  };

// Temporary Shortcut
INSERT_NEUME_DEFAULT_ATTRIBUTES['NeanesStathisSeries'] =
  INSERT_NEUME_DEFAULT_ATTRIBUTES['Neanes'];

INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA['NeanesStathisSeries'] =
  INSERT_NEUME_DEFAULT_ATTRIBUTES_MARTYRIA['Neanes'];
