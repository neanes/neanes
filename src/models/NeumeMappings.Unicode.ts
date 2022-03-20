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

  [QuantitativeNeume.Cross, { fontFamily: fontFamily, text: '\ue0c0' }],
  [QuantitativeNeume.VareiaDotted, { fontFamily: fontFamily, text: '\ue0e0' }],

  [GorgonNeume.Gorgon_Top, { fontFamily: fontFamily, text: '\ue0f0' }],
  [GorgonNeume.Gorgon_Bottom, { fontFamily: fontFamily, text: '\ue0f1' }],
  [GorgonNeume.Gorgon_Hyporoe, { fontFamily: fontFamily, text: '\ue100' }],

  [GorgonNeume.Digorgon, { fontFamily: fontFamily, text: '\ue0f4' }],
  [GorgonNeume.Trigorgon, { fontFamily: fontFamily, text: '\ue0f8' }],

  [GorgonNeume.GorgonDottedLeft, { fontFamily: fontFamily, text: '\ue0f2' }],
  [GorgonNeume.GorgonDottedRight, { fontFamily: fontFamily, text: '\ue0f3' }],

  [GorgonNeume.DigorgonDottedLeft1, { fontFamily: fontFamily, text: '\ue0f5' }],
  [GorgonNeume.DigorgonDottedLeft2, { fontFamily: fontFamily, text: '\ue0f6' }],
  [GorgonNeume.DigorgonDottedRight, { fontFamily: fontFamily, text: '\ue0f7' }],

  [
    GorgonNeume.TrigorgonDottedLeft1,
    { fontFamily: fontFamily, text: '\ue0f9' },
  ],
  [
    GorgonNeume.TrigorgonDottedLeft2,
    { fontFamily: fontFamily, text: '\ue0fa' },
  ],
  [
    GorgonNeume.TrigorgonDottedRight,
    { fontFamily: fontFamily, text: '\ue0fb' },
  ],

  [GorgonNeume.Argon, { fontFamily: fontFamily, text: '\ue0fc' }],
  [GorgonNeume.Hemiolion, { fontFamily: fontFamily, text: '\ue0fd' }],
  [GorgonNeume.Diargon, { fontFamily: fontFamily, text: '\ue0fe' }],

  [TimeNeume.Klasma_Top, { fontFamily: fontFamily, text: '\ue0d0' }],
  [TimeNeume.Klasma_Bottom, { fontFamily: fontFamily, text: '\ue0d1' }],

  [TimeNeume.Hapli, { fontFamily: fontFamily, text: '\ue0d2' }],
  [TimeNeume.Dipli, { fontFamily: fontFamily, text: '\ue0d3' }],
  [TimeNeume.Tripli, { fontFamily: fontFamily, text: '\ue0d4' }],

  [Fthora.DiatonicNiLow_Top, { fontFamily: fontFamily, text: '\ue190' }],
  [Fthora.DiatonicPa_Top, { fontFamily: fontFamily, text: '\ue191' }],
  [Fthora.DiatonicVou_Top, { fontFamily: fontFamily, text: '\ue192' }],
  [Fthora.DiatonicGa_Top, { fontFamily: fontFamily, text: '\ue193' }],
  [Fthora.DiatonicThi_Top, { fontFamily: fontFamily, text: '\ue194' }],
  [Fthora.DiatonicKe_Top, { fontFamily: fontFamily, text: '\ue195' }],
  [Fthora.DiatonicZo_Top, { fontFamily: fontFamily, text: '\ue196' }],
  [Fthora.DiatonicNiHigh_Top, { fontFamily: fontFamily, text: '\ue197' }],
  [Fthora.HardChromaticPa_Top, { fontFamily: fontFamily, text: '\ue198' }],
  [Fthora.HardChromaticThi_Top, { fontFamily: fontFamily, text: '\ue199' }],
  [Fthora.SoftChromaticThi_Top, { fontFamily: fontFamily, text: '\ue19A' }],
  [Fthora.SoftChromaticPa_Top, { fontFamily: fontFamily, text: '\ue19B' }],
  [Fthora.Enharmonic_Top, { fontFamily: fontFamily, text: '\ue19C' }],
  [Fthora.Zygos_Top, { fontFamily: fontFamily, text: '\ue19D' }],
  [Fthora.Kliton_Top, { fontFamily: fontFamily, text: '\ue19E' }],
  [Fthora.Spathi_Top, { fontFamily: fontFamily, text: '\ue19F' }],
  [Fthora.GeneralSharp_Top, { fontFamily: fontFamily, text: '\ue1f4' }],
  [Fthora.GeneralFlat_Top, { fontFamily: fontFamily, text: '\ue204' }],

  [Fthora.DiatonicNiLow_Bottom, { fontFamily: fontFamily, text: '\ue1c0' }],
  [Fthora.DiatonicPa_Bottom, { fontFamily: fontFamily, text: '\ue1c1' }],
  [Fthora.DiatonicThi_Bottom, { fontFamily: fontFamily, text: '\ue1c4' }],
  [Fthora.DiatonicKe_Bottom, { fontFamily: fontFamily, text: '\ue1c5' }],
  [Fthora.DiatonicNiHigh_Bottom, { fontFamily: fontFamily, text: '\ue1c7' }],
  [Fthora.HardChromaticPa_Bottom, { fontFamily: fontFamily, text: '\ue1c8' }],
  [Fthora.HardChromaticThi_Bottom, { fontFamily: fontFamily, text: '\ue1c9' }],
  [Fthora.SoftChromaticThi_Bottom, { fontFamily: fontFamily, text: '\ue1ca' }],
  [Fthora.SoftChromaticPa_Bottom, { fontFamily: fontFamily, text: '\ue1cb' }],
  [Fthora.Enharmonic_Bottom, { fontFamily: fontFamily, text: '\ue1cc' }],
  [Fthora.Zygos_Bottom, { fontFamily: fontFamily, text: '\ue1cd' }],
  [Fthora.Kliton_Bottom, { fontFamily: fontFamily, text: '\ue1ce' }],
  [Fthora.GeneralSharp_Bottom, { fontFamily: fontFamily, text: '\ue1f5' }],
  [Fthora.GeneralFlat_Bottom, { fontFamily: fontFamily, text: '\ue205' }],

  [Accidental.Sharp_2_Left, { fontFamily: fontFamily, text: '\ue1f0' }],
  [Accidental.Sharp_4_Left, { fontFamily: fontFamily, text: '\ue1f1' }],
  [Accidental.Sharp_6_Left, { fontFamily: fontFamily, text: '\ue1f2' }],

  [Accidental.Flat_2_Right, { fontFamily: fontFamily, text: '\ue200' }],
  [Accidental.Flat_4_Right, { fontFamily: fontFamily, text: '\ue201' }],
  [Accidental.Flat_6_Right, { fontFamily: fontFamily, text: '\ue202' }],

  [TempoSign.VerySlow, { fontFamily: fontFamily, text: '\ue120' }],
  [TempoSign.Slower, { fontFamily: fontFamily, text: '\ue121' }],
  [TempoSign.Slow, { fontFamily: fontFamily, text: '\ue122' }],
  [TempoSign.Moderate, { fontFamily: fontFamily, text: '\ue123' }],
  [TempoSign.Medium, { fontFamily: fontFamily, text: '\ue124' }],
  [TempoSign.Quick, { fontFamily: fontFamily, text: '\ue125' }],
  [TempoSign.Quicker, { fontFamily: fontFamily, text: '\ue126' }],
  [TempoSign.VeryQuick, { fontFamily: fontFamily, text: '\ue127' }],

  [VocalExpressionNeume.Vareia, { fontFamily: fontFamily, text: '\ue0a0' }],
  [
    VocalExpressionNeume.HomalonConnecting,
    { fontFamily: fontFamily, text: '\ue0a4' },
  ],
  [VocalExpressionNeume.Homalon, { fontFamily: fontFamily, text: '\ue0a3' }],
  [VocalExpressionNeume.Antikenoma, { fontFamily: fontFamily, text: '\ue0a2' }],
  [VocalExpressionNeume.Psifiston, { fontFamily: fontFamily, text: '\ue0a1' }],
  [VocalExpressionNeume.Heteron, { fontFamily: fontFamily, text: '\ue0a5' }],

  [RootSign.Delta, { fontFamily: fontFamily, text: '\ue151' }],
  [RootSign.Alpha, { fontFamily: fontFamily, text: '\ue152' }],
  [RootSign.Legetos, { fontFamily: fontFamily, text: '\ue153' }],
  [RootSign.Nana, { fontFamily: fontFamily, text: '\ue154' }],
  [RootSign.Zo, { fontFamily: fontFamily, text: '\ue150' }],
  [RootSign.Squiggle, { fontFamily: fontFamily, text: '\ue157' }],
  [RootSign.Tilt, { fontFamily: fontFamily, text: '\ue158' }],
  [RootSign.SoftChromaticSquiggle, { fontFamily: fontFamily, text: '\ue159' }],
  [RootSign.Zygos, { fontFamily: fontFamily, text: '\ue15b' }],
  [RootSign.DeltaDotted, { fontFamily: fontFamily, text: '\ue155' }],
  [RootSign.AlphaDotted, { fontFamily: fontFamily, text: '\ue156' }],
  [
    RootSign.SoftChromaticPaRootSign,
    { fontFamily: fontFamily, text: '\ue15a' },
  ],
  [RootSign.AlphaLow, { fontFamily: fontFamily, text: '\ue172' }],
  [RootSign.DeltaLow, { fontFamily: fontFamily, text: '\ue171' }],
  [RootSign.NanaLow, { fontFamily: fontFamily, text: '\ue174' }],

  [Note.GaLow, { fontFamily: fontFamily, text: '\ue134' }],
  [Note.ThiLow, { fontFamily: fontFamily, text: '\ue135' }],
  [Note.KeLow, { fontFamily: fontFamily, text: '\ue136' }],
  [Note.Zo, { fontFamily: fontFamily, text: '\ue137' }],
  [Note.Ni, { fontFamily: fontFamily, text: '\ue138' }],
  [Note.Pa, { fontFamily: fontFamily, text: '\ue139' }],
  [Note.Vou, { fontFamily: fontFamily, text: '\ue13a' }],
  [Note.Ga, { fontFamily: fontFamily, text: '\ue13b' }],
  [Note.Thi, { fontFamily: fontFamily, text: '\ue13c' }],
  [Note.Ke, { fontFamily: fontFamily, text: '\ue13d' }],
  [Note.Apostrophe, { fontFamily: fontFamily, text: '\ue145' }],

  [ModeSign.Ekhos, { fontFamily: fontFamily, text: '\ue2f1' }],
  [ModeSign.Plagal, { fontFamily: fontFamily, text: '\ue2f0' }],
  [ModeSign.First, { fontFamily: fontFamily, text: '\ue2f3' }],
  [ModeSign.Second, { fontFamily: fontFamily, text: '\ue2f4' }],
  [ModeSign.Third, { fontFamily: fontFamily, text: '\ue2f5' }],
  [ModeSign.Fourth, { fontFamily: fontFamily, text: '\ue2f6' }],
  [ModeSign.FirstCapital, { fontFamily: fontFamily, text: '\ue2f7' }],
  [ModeSign.SecondCapital, { fontFamily: fontFamily, text: '\ue2f8' }],
  [ModeSign.ThirdCapital, { fontFamily: fontFamily, text: '\ue2f9' }],
  [ModeSign.FourthCapital, { fontFamily: fontFamily, text: '\ue2fa' }],
  [ModeSign.Varys, { fontFamily: fontFamily, text: '\ue2f2' }],
  [ModeSign.Tos, { fontFamily: fontFamily, text: '|' }], // TODO delete
  [ModeSign.Alpha, { fontFamily: fontFamily, text: '\ue2c0' }],
  [ModeSign.AlphaWithDeltaHat, { fontFamily: fontFamily, text: '\ue2a0' }],
  [ModeSign.AlphaWithHypsili, { fontFamily: fontFamily, text: '\ue2a1' }],
  [ModeSign.SoftChromatic6, { fontFamily: fontFamily, text: '\ue2c8' }],
  [ModeSign.SoftChromatic2, { fontFamily: fontFamily, text: '\ue2a8' }],
  [ModeSign.Nana, { fontFamily: fontFamily, text: '\ue2b1' }],
  [ModeSign.VarysZo, { fontFamily: fontFamily, text: '\ue2d0' }],
  [ModeSign.Delta, { fontFamily: fontFamily, text: '\ue2d8' }],
  [ModeSign.DeltaWithDeltaHat, { fontFamily: fontFamily, text: '\ue2b8' }],
  [ModeSign.DeltaWithHypsili, { fontFamily: fontFamily, text: '\ue2b9' }],
  [ModeSign.OligonPlusKentemata, { fontFamily: fontFamily, text: '\ue2eb' }],
  [ModeSign.NanaOld, { fontFamily: fontFamily, text: '\ue2b0' }],
  [ModeSign.Legetos, { fontFamily: fontFamily, text: '\ue2ba' }],
  [
    ModeSign.ElaphronPlusApostrophos,
    { fontFamily: fontFamily, text: '\ue2eb' },
  ],
  [ModeSign.Elaphron, { fontFamily: fontFamily, text: '\ue2e9' }],
  [ModeSign.OligonPlusKentima, { fontFamily: fontFamily, text: '\ue2e7' }],
  [ModeSign.OligonPlusHypsili, { fontFamily: fontFamily, text: '\ue2e8' }],

  [ModeSign.Ni, { fontFamily: fontFamily, text: '\ue2e0' }],
  [ModeSign.Pa, { fontFamily: fontFamily, text: '\ue2e1' }],
  [ModeSign.Vou, { fontFamily: fontFamily, text: '\ue2e2' }],
  [ModeSign.Ga, { fontFamily: fontFamily, text: '\ue2e3' }],
  [ModeSign.Thi, { fontFamily: fontFamily, text: '\ue2e4' }],
  [ModeSign.Ke, { fontFamily: fontFamily, text: '\ue2e5' }],
  [ModeSign.Zo, { fontFamily: fontFamily, text: '\ue2e6' }],

  [MeasureBar.MeasureBarRight, { fontFamily: fontFamily, text: '\ue210' }],
  [MeasureBar.MeasureBarTop, { fontFamily: fontFamily, text: '\ue213' }],

  [MeasureNumber.Two, { fontFamily: fontFamily, text: '\ue220' }],
  [MeasureNumber.Three, { fontFamily: fontFamily, text: '\ue221' }],
  [MeasureNumber.Four, { fontFamily: fontFamily, text: '\ue222' }],
  [MeasureNumber.Five, { fontFamily: fontFamily, text: '\ue223' }],
  [MeasureNumber.Six, { fontFamily: fontFamily, text: '\ue224' }],
  [MeasureNumber.Seven, { fontFamily: fontFamily, text: '\ue225' }],
  [MeasureNumber.Eight, { fontFamily: fontFamily, text: '\ue226' }],

  [NoteIndicator.Ni, { fontFamily: fontFamily, text: '\ue250' }],
  [NoteIndicator.Pa, { fontFamily: fontFamily, text: '\ue251' }],
  [NoteIndicator.Vou, { fontFamily: fontFamily, text: '\ue252' }],
  [NoteIndicator.Ga, { fontFamily: fontFamily, text: '\ue253' }],
  [NoteIndicator.Thi, { fontFamily: fontFamily, text: '\ue254' }],
  [NoteIndicator.Ke, { fontFamily: fontFamily, text: '\ue255' }],
  [NoteIndicator.Zo, { fontFamily: fontFamily, text: '\ue256' }],

  [Ison.Unison, { fontFamily: fontFamily, text: '\ue260' }],
  [Ison.ThiLow, { fontFamily: fontFamily, text: '\ue261' }],
  [Ison.KeLow, { fontFamily: fontFamily, text: '\ue262' }],
  [Ison.Zo, { fontFamily: fontFamily, text: '\ue263' }],
  [Ison.Ni, { fontFamily: fontFamily, text: '\ue264' }],
  [Ison.Pa, { fontFamily: fontFamily, text: '\ue265' }],
  [Ison.Vou, { fontFamily: fontFamily, text: '\ue266' }],
  [Ison.Ga, { fontFamily: fontFamily, text: '\ue267' }],
  [Ison.Thi, { fontFamily: fontFamily, text: '\ue268' }],
  [Ison.Ke, { fontFamily: fontFamily, text: '\ue269' }],
  [Ison.ZoHigh, { fontFamily: fontFamily, text: '\ue26A' }], // The font appears to have a bug in it. This mapping does not work
]);
