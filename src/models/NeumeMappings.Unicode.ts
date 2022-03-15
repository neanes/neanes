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
  MeasureBar,
  MeasureNumber,
  NoteIndicator,
  Ison,
} from '@/models/Neumes';

export interface NeumeMapping {
  fontFamily: string;
  text: string;
}

const fontFamily: string = 'Neanes';

export const neumeMap = new Map<Neume, NeumeMapping>([
  [QuantitativeNeume.Ison, { fontFamily: fontFamily, text: '\ue000' }],

  [QuantitativeNeume.Oligon, { fontFamily: fontFamily, text: '\ue001' }],
  [
    QuantitativeNeume.OligonPlusKentimaBelow,
    { fontFamily: fontFamily, text: '\ue003' },
  ],
  [
    QuantitativeNeume.OligonPlusKentimaAbove,
    { fontFamily: fontFamily, text: '\ue004' },
  ],
  [
    QuantitativeNeume.OligonPlusHypsiliRight,
    { fontFamily: fontFamily, text: '\ue005' },
  ],
  [
    QuantitativeNeume.OligonPlusHypsiliLeft,
    { fontFamily: fontFamily, text: '\ue006' },
  ],
  [
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
    { fontFamily: fontFamily, text: '\ue007' },
  ],
  [
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
    { fontFamily: fontFamily, text: '\ue008' },
  ],
  [
    QuantitativeNeume.OligonPlusDoubleHypsili,
    { fontFamily: fontFamily, text: '\ue009' },
  ],

  [
    QuantitativeNeume.PetastiWithIson,
    { fontFamily: fontFamily, text: '\ue040' },
  ],
  [QuantitativeNeume.Petasti, { fontFamily: fontFamily, text: '\ue041' }],
  [
    QuantitativeNeume.PetastiPlusOligon,
    { fontFamily: fontFamily, text: '\ue042' },
  ],
  [
    QuantitativeNeume.PetastiPlusKentimaAbove,
    { fontFamily: fontFamily, text: '\ue043' },
  ],
  [
    QuantitativeNeume.PetastiPlusHypsiliRight,
    { fontFamily: fontFamily, text: '\ue044' },
  ],
  [
    QuantitativeNeume.PetastiPlusHypsiliLeft,
    { fontFamily: fontFamily, text: '\ue045' },
  ],
  [
    QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
    { fontFamily: fontFamily, text: '\ue046' },
  ],
  [
    QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
    { fontFamily: fontFamily, text: '\ue047' },
  ],
  [
    QuantitativeNeume.PetastiPlusDoubleHypsili,
    { fontFamily: fontFamily, text: '\ue048' },
  ],

  [QuantitativeNeume.Apostrophos, { fontFamily: fontFamily, text: '\ue021' }],
  [QuantitativeNeume.Elaphron, { fontFamily: fontFamily, text: '\ue024' }],
  [
    QuantitativeNeume.ElaphronPlusApostrophos,
    { fontFamily: fontFamily, text: '\ue026' },
  ],
  [QuantitativeNeume.Hamili, { fontFamily: fontFamily, text: '\ue027' }],
  [
    QuantitativeNeume.HamiliPlusApostrophos,
    { fontFamily: fontFamily, text: '\ue028' },
  ],
  [
    QuantitativeNeume.HamiliPlusElaphron,
    { fontFamily: fontFamily, text: '\ue029' },
  ],
  [
    QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
    { fontFamily: fontFamily, text: '\ue02A' },
  ],
  [QuantitativeNeume.DoubleHamili, { fontFamily: fontFamily, text: '\ue02B' }],

  [
    QuantitativeNeume.PetastiPlusApostrophos,
    { fontFamily: fontFamily, text: '\ue060' },
  ],
  [
    QuantitativeNeume.PetastiPlusElaphron,
    { fontFamily: fontFamily, text: '\ue062' },
  ],
  [
    QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
    { fontFamily: fontFamily, text: '\ue064' },
  ],

  [
    QuantitativeNeume.OligonPlusKentemata,
    { fontFamily: fontFamily, text: '\ue083' },
  ],
  [
    QuantitativeNeume.KentemataPlusOligon,
    { fontFamily: fontFamily, text: '\ue082' },
  ],
  [
    QuantitativeNeume.OligonPlusIsonPlusKentemata,
    { fontFamily: fontFamily, text: '\ue084' },
  ],
  [
    QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
    { fontFamily: fontFamily, text: '\ue087' },
  ],
  [
    QuantitativeNeume.OligonPlusHyporoePlusKentemata,
    { fontFamily: fontFamily, text: '\ue088' },
  ],
  [
    QuantitativeNeume.OligonPlusElaphronPlusKentemata,
    { fontFamily: fontFamily, text: '\ue089' },
  ],
  [
    QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
    { fontFamily: fontFamily, text: '\ue08B' },
  ],
  [
    QuantitativeNeume.OligonPlusHamiliPlusKentemata,
    { fontFamily: fontFamily, text: '\ue08C' },
  ],

  [
    QuantitativeNeume.RunningElaphron,
    { fontFamily: fontFamily, text: '\ue025' },
  ],
  [QuantitativeNeume.Hyporoe, { fontFamily: fontFamily, text: '\ue023' }],
  [
    QuantitativeNeume.PetastiPlusRunningElaphron,
    { fontFamily: fontFamily, text: '\ue063' },
  ],
  [
    QuantitativeNeume.PetastiPlusHyporoe,
    { fontFamily: fontFamily, text: '\ue061' },
  ],

  [
    QuantitativeNeume.OligonPlusIson,
    { fontFamily: fontFamily, text: '\ue010' },
  ],
  [
    QuantitativeNeume.OligonPlusApostrophos,
    { fontFamily: fontFamily, text: '\ue011' },
  ],
  [
    QuantitativeNeume.OligonPlusElaphron,
    { fontFamily: fontFamily, text: '\ue013' },
  ],
  [
    QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
    { fontFamily: fontFamily, text: '\ue014' },
  ],
  [
    QuantitativeNeume.OligonPlusHamili,
    { fontFamily: fontFamily, text: '\ue015' },
  ],

  [QuantitativeNeume.Kentima, { fontFamily: fontFamily, text: '\ue080' }],
  [
    QuantitativeNeume.OligonPlusKentima,
    { fontFamily: fontFamily, text: '\ue002' },
  ],
  [QuantitativeNeume.Kentemata, { fontFamily: fontFamily, text: '\ue081' }],

  [
    QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
    { fontFamily: fontFamily, text: '\ue08a' },
  ],
  [
    QuantitativeNeume.DoubleApostrophos,
    { fontFamily: fontFamily, text: '\ue022' },
  ],
  [
    QuantitativeNeume.IsonPlusApostrophos,
    { fontFamily: fontFamily, text: '\ue020' },
  ],
  [
    QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
    { fontFamily: fontFamily, text: '\ue086' },
  ],
  [
    QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
    { fontFamily: fontFamily, text: '\ue087' },
  ],

  [QuantitativeNeume.Cross, { fontFamily: fontFamily, text: '\ue0ca' }],
  [QuantitativeNeume.VareiaDotted, { fontFamily: fontFamily, text: '\ue0c6' }],

  [GorgonNeume.Gorgon_Top, { fontFamily: fontFamily, text: '\ue0a0' }],
  [GorgonNeume.Gorgon_Bottom, { fontFamily: fontFamily, text: '\ue0a1' }],
  [GorgonNeume.Gorgon_Hyporoe, { fontFamily: fontFamily, text: '\ue0a2' }],

  [GorgonNeume.Digorgon, { fontFamily: fontFamily, text: '\ue0a5' }],
  [GorgonNeume.Trigorgon, { fontFamily: fontFamily, text: '\ue0a9' }],

  [GorgonNeume.GorgonDottedLeft, { fontFamily: fontFamily, text: '\ue0a3' }],
  [GorgonNeume.GorgonDottedRight, { fontFamily: fontFamily, text: '\ue0a4' }],

  [GorgonNeume.DigorgonDottedLeft1, { fontFamily: fontFamily, text: '\ue0a6' }],
  [GorgonNeume.DigorgonDottedLeft2, { fontFamily: fontFamily, text: '\ue0a7' }],
  [GorgonNeume.DigorgonDottedRight, { fontFamily: fontFamily, text: '\ue0a8' }],

  [
    GorgonNeume.TrigorgonDottedLeft1,
    { fontFamily: fontFamily, text: '\ue0aa' },
  ],
  [
    GorgonNeume.TrigorgonDottedLeft2,
    { fontFamily: fontFamily, text: '\ue0ab' },
  ],
  [
    GorgonNeume.TrigorgonDottedRight,
    { fontFamily: fontFamily, text: '\ue0ac' },
  ],

  [GorgonNeume.Argon, { fontFamily: fontFamily, text: '\ue0ad' }],
  [GorgonNeume.Hemiolion, { fontFamily: fontFamily, text: '\ue0ae' }],
  [GorgonNeume.Diargon, { fontFamily: fontFamily, text: '\ue0af' }],

  [TimeNeume.Klasma_Top, { fontFamily: fontFamily, text: '\ue0c0' }],
  [TimeNeume.Klasma_Bottom, { fontFamily: fontFamily, text: '\ue0c1' }],

  [TimeNeume.Hapli, { fontFamily: fontFamily, text: '\ue0c2' }],
  [TimeNeume.Dipli, { fontFamily: fontFamily, text: '\ue0c3' }],
  [TimeNeume.Tripli, { fontFamily: fontFamily, text: '\ue0c4' }],

  [Fthora.DiatonicNiLow_Top, { fontFamily: fontFamily, text: '\ue128' }],
  [Fthora.DiatonicPa_Top, { fontFamily: fontFamily, text: '\ue129' }],
  [Fthora.DiatonicVou_Top, { fontFamily: fontFamily, text: '\ue12A' }],
  [Fthora.DiatonicGa_Top, { fontFamily: fontFamily, text: '\ue12B' }],
  [Fthora.DiatonicThi_Top, { fontFamily: fontFamily, text: '\ue12C' }],
  [Fthora.DiatonicKe_Top, { fontFamily: fontFamily, text: '\ue12D' }],
  [Fthora.DiatonicZo_Top, { fontFamily: fontFamily, text: '\ue12E' }],
  [Fthora.DiatonicNiHigh_Top, { fontFamily: fontFamily, text: '\ue12F' }],
  [Fthora.HardChromaticPa_Top, { fontFamily: fontFamily, text: '\ue130' }],
  [Fthora.HardChromaticThi_Top, { fontFamily: fontFamily, text: '\ue131' }],
  [Fthora.SoftChromaticPa_Top, { fontFamily: fontFamily, text: '\ue132' }],
  [Fthora.SoftChromaticThi_Top, { fontFamily: fontFamily, text: '\ue133' }],
  [Fthora.Enharmonic_Top, { fontFamily: fontFamily, text: '\ue134' }],
  [Fthora.Zygos_Top, { fontFamily: fontFamily, text: '\ue135' }],
  [Fthora.Kliton_Top, { fontFamily: fontFamily, text: '\ue136' }],
  [Fthora.Spathi_Top, { fontFamily: fontFamily, text: '\ue137' }],
  [Fthora.GeneralSharp_Top, { fontFamily: fontFamily, text: '\ue138' }],
  [Fthora.GeneralFlat_Top, { fontFamily: fontFamily, text: '\ue139' }],

  [Fthora.DiatonicNiLow_Bottom, { fontFamily: fontFamily, text: '\ue13A' }],
  [Fthora.DiatonicPa_Bottom, { fontFamily: fontFamily, text: '\ue13B' }],
  [Fthora.DiatonicThi_Bottom, { fontFamily: fontFamily, text: '\ue13E' }],
  [Fthora.DiatonicKe_Bottom, { fontFamily: fontFamily, text: '\ue13F' }],
  [Fthora.DiatonicNiHigh_Bottom, { fontFamily: fontFamily, text: '\ue141' }],
  [Fthora.HardChromaticPa_Bottom, { fontFamily: fontFamily, text: '\ue142' }],
  [Fthora.HardChromaticThi_Bottom, { fontFamily: fontFamily, text: '\ue143' }],
  [Fthora.SoftChromaticPa_Bottom, { fontFamily: fontFamily, text: '\ue144' }],
  [Fthora.SoftChromaticThi_Bottom, { fontFamily: fontFamily, text: '\ue145' }],
  [Fthora.Enharmonic_Bottom, { fontFamily: fontFamily, text: '\ue146' }],
  [Fthora.Zygos_Bottom, { fontFamily: fontFamily, text: '\ue147' }],
  [Fthora.Kliton_Bottom, { fontFamily: fontFamily, text: '\ue148' }],
  [Fthora.GeneralSharp_Bottom, { fontFamily: fontFamily, text: '\ue14A' }],
  [Fthora.GeneralFlat_Bottom, { fontFamily: fontFamily, text: '\ue14B' }],

  [Accidental.Sharp_2_Left, { fontFamily: fontFamily, text: '\ue120' }],
  [Accidental.Sharp_4_Left, { fontFamily: fontFamily, text: '\ue121' }],
  [Accidental.Sharp_6_Left, { fontFamily: fontFamily, text: '\ue122' }],

  [Accidental.Flat_2_Right, { fontFamily: fontFamily, text: '\ue124' }],
  [Accidental.Flat_4_Right, { fontFamily: fontFamily, text: '\ue125' }],
  [Accidental.Flat_6_Right, { fontFamily: fontFamily, text: '\ue126' }],

  [TempoSign.VerySlow, { fontFamily: fontFamily, text: '\ue180' }],
  [TempoSign.Slow, { fontFamily: fontFamily, text: '\ue181' }],
  [TempoSign.Medium, { fontFamily: fontFamily, text: '\ue183' }],
  [TempoSign.Moderate, { fontFamily: fontFamily, text: '\ue184' }],
  [TempoSign.Quick, { fontFamily: fontFamily, text: '\ue185' }],
  [TempoSign.VeryQuick, { fontFamily: fontFamily, text: '\ue186' }],

  [VocalExpressionNeume.Vareia, { fontFamily: fontFamily, text: '\ue0f0' }],
  [
    VocalExpressionNeume.HomalonConnecting,
    { fontFamily: fontFamily, text: '\ue0f4' },
  ],
  [VocalExpressionNeume.Homalon, { fontFamily: fontFamily, text: '\ue0f3' }],
  [VocalExpressionNeume.Antikenoma, { fontFamily: fontFamily, text: '\ue0f2' }],
  [VocalExpressionNeume.Psifiston, { fontFamily: fontFamily, text: '\ue0f1' }],
  [VocalExpressionNeume.Heteron, { fontFamily: fontFamily, text: '\ue0f6' }],

  [RootSign.Delta, { fontFamily: fontFamily, text: '\ue1b6' }],
  [RootSign.Alpha, { fontFamily: fontFamily, text: '\ue1b7' }],
  [RootSign.Legetos, { fontFamily: fontFamily, text: '\ue1b8' }],
  [RootSign.Nana, { fontFamily: fontFamily, text: '\ue1b9' }],
  [RootSign.Zo, { fontFamily: fontFamily, text: '\ue1b5' }],
  [RootSign.Squiggle, { fontFamily: fontFamily, text: '\ue1bc' }],
  [RootSign.Tilt, { fontFamily: fontFamily, text: '\ue1bd' }],
  [RootSign.SoftChromaticSquiggle, { fontFamily: fontFamily, text: '\ue1be' }],
  [RootSign.Zygos, { fontFamily: fontFamily, text: '\ue1c0' }],
  [RootSign.DeltaDotted, { fontFamily: fontFamily, text: '\ue1ba' }],
  [RootSign.AlphaDotted, { fontFamily: fontFamily, text: '\ue1bb' }],
  [
    RootSign.SoftChromaticPaRootSign,
    { fontFamily: fontFamily, text: '\ue1bf' },
  ],
  [RootSign.AlphaLow, { fontFamily: fontFamily, text: '\ue1d2' }],
  [RootSign.DeltaLow, { fontFamily: fontFamily, text: '\ue1d3' }],
  [RootSign.NanaLow, { fontFamily: fontFamily, text: '\ue1d4' }],

  [Note.GaLow, { fontFamily: fontFamily, text: '\ue1a3' }],
  [Note.ThiLow, { fontFamily: fontFamily, text: '\ue1a4' }],
  [Note.KeLow, { fontFamily: fontFamily, text: '\ue1a5' }],
  [Note.Ni, { fontFamily: fontFamily, text: '\ue1a7' }],
  [Note.Pa, { fontFamily: fontFamily, text: '\ue1a8' }],
  [Note.Vou, { fontFamily: fontFamily, text: '\ue1a9' }],
  [Note.Ga, { fontFamily: fontFamily, text: '\ue1aa' }],
  [Note.Thi, { fontFamily: fontFamily, text: '\ue1ab' }],
  [Note.Ke, { fontFamily: fontFamily, text: '\ue1ac' }],
  [Note.Zo, { fontFamily: fontFamily, text: '\ue1ad' }],
  [Note.Apostrophe, { fontFamily: fontFamily, text: '\ue1e0' }],

  [ModeSign.Ekhos, { fontFamily: 'EzSpecial2', text: 'h' }],
  [ModeSign.Plagal, { fontFamily: 'EzSpecial2', text: 'H' }],
  [ModeSign.First, { fontFamily: 'EzSpecial2', text: 'a' }],
  [ModeSign.FirstCapital, { fontFamily: 'EzSpecial2', text: 'A' }],
  [ModeSign.Second, { fontFamily: 'EzSpecial2', text: 's' }],
  [ModeSign.SecondCapital, { fontFamily: 'EzSpecial2', text: 'S' }],
  [ModeSign.Third, { fontFamily: 'EzSpecial2', text: 'd' }],
  [ModeSign.ThirdCapital, { fontFamily: 'EzSpecial2', text: 'D' }],
  [ModeSign.Fourth, { fontFamily: 'EzSpecial2', text: 'f' }],
  [ModeSign.FourthCapital, { fontFamily: 'EzSpecial2', text: 'F' }],
  [ModeSign.Varys, { fontFamily: 'EzSpecial2', text: 'u' }],
  [ModeSign.Tos, { fontFamily: 'EzSpecial2', text: '|' }],
  [ModeSign.Alpha, { fontFamily: 'EzSpecial2', text: 'q' }],
  [ModeSign.AlphaWithDeltaHat, { fontFamily: 'EzSpecial2', text: 'qT' }],
  [ModeSign.AlphaWithHypsili, { fontFamily: 'EzSpecial2', text: 'Q' }],
  [ModeSign.SoftChromatic6, { fontFamily: 'EzSpecial2', text: 'w' }],
  [ModeSign.SoftChromatic2, { fontFamily: 'EzSpecial2', text: 'W' }],
  [ModeSign.Nana, { fontFamily: 'EzSpecial2', text: 'e' }],
  [ModeSign.VarysZo, { fontFamily: 'EzSpecial2', text: 'E' }],
  [ModeSign.Delta, { fontFamily: 'EzSpecial2', text: 'r' }],
  [ModeSign.DeltaWithDeltaHat, { fontFamily: 'EzSpecial2', text: 'rT' }],
  [ModeSign.DeltaWithHypsili, { fontFamily: 'EzSpecial2', text: 'R' }],
  [ModeSign.OligonPlusKentemata, { fontFamily: 'EzSpecial2', text: 'y' }],
  [ModeSign.DeltaHat, { fontFamily: 'EzSpecial2', text: 'T' }],
  [ModeSign.NanaOld, { fontFamily: 'EzSpecial2', text: 'p' }],
  [ModeSign.Legetos, { fontFamily: 'Psaltica', text: 'nB' }],
  [ModeSign.ElaphronPlusApostrophos, { fontFamily: 'EzSpecial2', text: 'i' }],
  [ModeSign.Elaphron, { fontFamily: 'EzSpecial2', text: 'Y' }],
  [ModeSign.OligonPlusKentima, { fontFamily: 'EzSpecial2', text: 'U' }],
  [ModeSign.OligonPlusHypsili, { fontFamily: 'EzSpecial2', text: 'I' }],
  [ModeSign.PaHardChromatic, { fontFamily: 'EzSpecial2', text: 'g' }],
  [ModeSign.VouSoftChromatic, { fontFamily: 'EzSpecial2', text: 'G' }],
  [ModeSign.ThiSoftChromatic, { fontFamily: 'EzSpecial2', text: 't' }],

  [ModeSign.Ni, { fontFamily: 'Oxeia', text: 'C' }],
  [ModeSign.Pa, { fontFamily: 'Oxeia', text: 'V' }],
  [ModeSign.Vou, { fontFamily: 'Oxeia', text: 'B' }],
  [ModeSign.Ga, { fontFamily: 'Oxeia', text: 'N' }],
  [ModeSign.Thi, { fontFamily: 'Oxeia', text: 'M' }],
  [ModeSign.Ke, { fontFamily: 'Oxeia', text: '<' }],
  [ModeSign.Zo, { fontFamily: 'Oxeia', text: '>' }],

  [MeasureBar.MeasureBarRight, { fontFamily: 'Psaltica', text: 'J' }],
  [MeasureBar.MeasureBarTop, { fontFamily: 'Psaltica', text: 'j' }],

  [MeasureNumber.Two, { fontFamily: 'EzSpecial2', text: '2' }],
  [MeasureNumber.Three, { fontFamily: 'EzSpecial2', text: '3' }],
  [MeasureNumber.Four, { fontFamily: 'EzSpecial2', text: '4' }],
  [MeasureNumber.Five, { fontFamily: 'EzSpecial2', text: '5' }],
  [MeasureNumber.Six, { fontFamily: 'EzSpecial2', text: '6' }],
  [MeasureNumber.Seven, { fontFamily: 'EzSpecial2', text: '7' }],
  [MeasureNumber.Eight, { fontFamily: 'EzSpecial2', text: '8' }],

  [NoteIndicator.Ni, { fontFamily: fontFamily, text: '\ue160' }],
  [NoteIndicator.Pa, { fontFamily: fontFamily, text: '\ue161' }],
  [NoteIndicator.Vou, { fontFamily: fontFamily, text: '\ue162' }],
  [NoteIndicator.Ga, { fontFamily: fontFamily, text: '\ue163' }],
  [NoteIndicator.Thi, { fontFamily: fontFamily, text: '\ue164' }],
  [NoteIndicator.Ke, { fontFamily: fontFamily, text: '\ue165' }],
  [NoteIndicator.Zo, { fontFamily: fontFamily, text: '\ue166' }],

  [Ison.Unison, { fontFamily: 'EzSpecial2', text: '?' }],
  [Ison.ThiLow, { fontFamily: 'EzSpecial2', text: '~' }],
  [Ison.KeLow, { fontFamily: 'EzSpecial2', text: '!' }],
  [Ison.Zo, { fontFamily: 'EzSpecial2', text: '>' }],
  [Ison.Ni, { fontFamily: 'EzSpecial2', text: 'C' }],
  [Ison.Pa, { fontFamily: 'EzSpecial2', text: 'V' }],
  [Ison.Vou, { fontFamily: 'EzSpecial2', text: 'B' }],
  [Ison.Ga, { fontFamily: 'EzSpecial2', text: 'N' }],
  [Ison.Thi, { fontFamily: 'EzSpecial2', text: 'M' }],
  [Ison.Ke, { fontFamily: 'EzSpecial2', text: '<' }],
  [Ison.ZoHigh, { fontFamily: 'EzSpecial2', text: 'Z' }], // The font appears to have a bug in it. This mapping does not work
]);
