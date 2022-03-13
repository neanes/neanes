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

export type NeumeFont =
  | 'Psaltica'
  | 'Omega'
  | 'EzSpecial1'
  | 'EzSpecial2'
  | 'EzFthora'
  | 'Oxeia';

export interface NeumeMapping {
  fontFamily: NeumeFont;
  text: string;
}

export const neumeMap = new Map<Neume, NeumeMapping>([
  [QuantitativeNeume.Ison, { fontFamily: 'Psaltica', text: '0' }],

  [QuantitativeNeume.Oligon, { fontFamily: 'Psaltica', text: '1' }],
  [
    QuantitativeNeume.OligonPlusKentimaBelow,
    { fontFamily: 'Psaltica', text: '2' },
  ],
  [
    QuantitativeNeume.OligonPlusKentimaAbove,
    { fontFamily: 'Psaltica', text: '3' },
  ],
  [
    QuantitativeNeume.OligonPlusHypsiliRight,
    { fontFamily: 'Psaltica', text: '4' },
  ],
  [
    QuantitativeNeume.OligonPlusHypsiliLeft,
    { fontFamily: 'Psaltica', text: '5' },
  ],
  [
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
    { fontFamily: 'Psaltica', text: '6' },
  ],
  [
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
    { fontFamily: 'Psaltica', text: '7' },
  ],
  [
    QuantitativeNeume.OligonPlusDoubleHypsili,
    { fontFamily: 'Psaltica', text: '8' },
  ],

  [QuantitativeNeume.PetastiWithIson, { fontFamily: 'Psaltica', text: 'p' }],
  [QuantitativeNeume.Petasti, { fontFamily: 'Psaltica', text: 'q' }],
  [QuantitativeNeume.PetastiPlusOligon, { fontFamily: 'Psaltica', text: 'w' }],
  [
    QuantitativeNeume.PetastiPlusKentimaAbove,
    { fontFamily: 'Psaltica', text: 'e' },
  ],
  [
    QuantitativeNeume.PetastiPlusHypsiliRight,
    { fontFamily: 'Psaltica', text: 'r' },
  ],
  [
    QuantitativeNeume.PetastiPlusHypsiliLeft,
    { fontFamily: 'Psaltica', text: 't' },
  ],
  [
    QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
    { fontFamily: 'Psaltica', text: 'y' },
  ],
  [
    QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
    { fontFamily: 'Psaltica', text: 'u' },
  ],
  [
    QuantitativeNeume.PetastiPlusDoubleHypsili,
    { fontFamily: 'Psaltica', text: 'i' },
  ],

  [QuantitativeNeume.Apostrophos, { fontFamily: 'Psaltica', text: '!' }],
  [QuantitativeNeume.Elaphron, { fontFamily: 'Psaltica', text: '@' }],
  [
    QuantitativeNeume.ElaphronPlusApostrophos,
    { fontFamily: 'Psaltica', text: '#' },
  ],
  [QuantitativeNeume.Hamili, { fontFamily: 'Psaltica', text: '$' }],
  [
    QuantitativeNeume.HamiliPlusApostrophos,
    { fontFamily: 'Psaltica', text: '%' },
  ],
  [QuantitativeNeume.HamiliPlusElaphron, { fontFamily: 'Psaltica', text: '^' }],
  [
    QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
    { fontFamily: 'Psaltica', text: '&' },
  ],
  [QuantitativeNeume.DoubleHamili, { fontFamily: 'Psaltica', text: '*' }],

  [
    QuantitativeNeume.PetastiPlusApostrophos,
    { fontFamily: 'Psaltica', text: 'Q' },
  ],
  [
    QuantitativeNeume.PetastiPlusElaphron,
    { fontFamily: 'Psaltica', text: 'W' },
  ],
  [
    QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
    { fontFamily: 'Psaltica', text: 'E' },
  ],

  [
    QuantitativeNeume.OligonPlusKentemata,
    { fontFamily: 'Psaltica', text: 'O' },
  ],
  [
    QuantitativeNeume.KentemataPlusOligon,
    { fontFamily: 'Psaltica', text: 'o' },
  ],
  [
    QuantitativeNeume.OligonPlusIsonPlusKentemata,
    { fontFamily: 'Psaltica', text: 'P' },
  ],
  [
    QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
    { fontFamily: 'Psaltica', text: 'U' },
  ],
  [
    QuantitativeNeume.OligonPlusHyporoePlusKentemata,
    { fontFamily: 'EzSpecial1', text: 't' },
  ],
  [
    QuantitativeNeume.OligonPlusElaphronPlusKentemata,
    { fontFamily: 'Psaltica', text: 'Y' },
  ],
  [
    QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
    { fontFamily: 'Psaltica', text: 'T' },
  ],
  [
    QuantitativeNeume.OligonPlusHamiliPlusKentemata,
    { fontFamily: 'Psaltica', text: 'R' },
  ],

  [QuantitativeNeume.RunningElaphron, { fontFamily: 'Psaltica', text: '_' }],
  [QuantitativeNeume.Hyporoe, { fontFamily: 'Psaltica', text: ')' }],
  [
    QuantitativeNeume.PetastiPlusRunningElaphron,
    { fontFamily: 'EzSpecial2', text: '_' },
  ],
  [
    QuantitativeNeume.PetastiPlusHyporoe,
    { fontFamily: 'EzSpecial2', text: '-' },
  ],

  [QuantitativeNeume.OligonPlusIson, { fontFamily: 'EzSpecial2', text: '9' }],
  [
    QuantitativeNeume.OligonPlusApostrophos,
    { fontFamily: 'Psaltica', text: 'I' },
  ],
  [
    QuantitativeNeume.OligonPlusElaphron,
    { fontFamily: 'EzSpecial2', text: '0' },
  ],
  [
    QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
    { fontFamily: 'EzSpecial2', text: ')' },
  ],
  [QuantitativeNeume.OligonPlusHamili, { fontFamily: 'EzSpecial2', text: ']' }],

  [QuantitativeNeume.Kentima, { fontFamily: 'Psaltica', text: '~' }],
  [QuantitativeNeume.OligonPlusKentima, { fontFamily: 'Psaltica', text: '1~' }],
  [QuantitativeNeume.Kentemata, { fontFamily: 'Psaltica', text: '`' }],

  [
    QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
    { fontFamily: 'EzSpecial1', text: 'y' },
  ],
  [
    QuantitativeNeume.DoubleApostrophos,
    { fontFamily: 'EzSpecial1', text: 'O' },
  ],
  [
    QuantitativeNeume.IsonPlusApostrophos,
    { fontFamily: 'EzSpecial1', text: 'P' },
  ],
  [
    QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
    { fontFamily: 'EzSpecial1', text: 'i' },
  ],
  [
    QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
    { fontFamily: 'EzSpecial1', text: 'u' },
  ],

  [QuantitativeNeume.Cross, { fontFamily: 'Psaltica', text: '+' }],
  [QuantitativeNeume.VareiaDotted, { fontFamily: 'Psaltica', text: '|' }],

  [GorgonNeume.Gorgon_Top, { fontFamily: 'Psaltica', text: 's' }],
  [GorgonNeume.Gorgon_Bottom, { fontFamily: 'Psaltica', text: 'x' }],

  [GorgonNeume.Digorgon, { fontFamily: 'Psaltica', text: 'd' }],
  [GorgonNeume.Trigorgon, { fontFamily: 'Psaltica', text: 'f' }],

  [GorgonNeume.GorgonDottedLeft, { fontFamily: 'Psaltica', text: 'h' }],
  [GorgonNeume.GorgonDottedRight, { fontFamily: 'EzSpecial1', text: 'h' }],

  [GorgonNeume.DigorgonDottedLeft1, { fontFamily: 'EzSpecial1', text: 'd' }],
  [GorgonNeume.DigorgonDottedLeft2, { fontFamily: 'EzSpecial1', text: 'k' }],
  [GorgonNeume.DigorgonDottedRight, { fontFamily: 'EzSpecial1', text: 'c' }],

  [GorgonNeume.TrigorgonDottedLeft1, { fontFamily: 'EzSpecial1', text: 'f' }],
  [GorgonNeume.TrigorgonDottedLeft2, { fontFamily: 'EzSpecial1', text: 'b' }],
  [GorgonNeume.TrigorgonDottedRight, { fontFamily: 'EzSpecial1', text: 'v' }],

  [GorgonNeume.Argon, { fontFamily: 'Psaltica', text: 'g' }],
  [GorgonNeume.Hemiolion, { fontFamily: 'Psaltica', text: 'G' }],
  [GorgonNeume.Diargon, { fontFamily: 'EzSpecial1', text: 'J' }],

  [TimeNeume.Klasma_Top, { fontFamily: 'Psaltica', text: 'a' }],
  [TimeNeume.Klasma_Bottom, { fontFamily: 'Psaltica', text: 'z' }],

  [TimeNeume.Hapli, { fontFamily: 'Psaltica', text: ';' }],
  [TimeNeume.Dipli, { fontFamily: 'Psaltica', text: 'k' }],
  [TimeNeume.Tripli, { fontFamily: 'EzSpecial1', text: ';' }],

  [Fthora.DiatonicNiLow_Top, { fontFamily: 'EzFthora', text: 'd' }],
  [Fthora.DiatonicPa_Top, { fontFamily: 'EzFthora', text: 'f' }],
  [Fthora.DiatonicVou_Top, { fontFamily: 'EzFthora', text: 'g' }],
  [Fthora.DiatonicGa_Top, { fontFamily: 'EzFthora', text: 'h' }],
  [Fthora.DiatonicThi_Top, { fontFamily: 'EzFthora', text: 'j' }],
  [Fthora.DiatonicKe_Top, { fontFamily: 'EzFthora', text: 'k' }],
  [Fthora.DiatonicZo_Top, { fontFamily: 'EzFthora', text: 'l' }],
  [Fthora.DiatonicNiHigh_Top, { fontFamily: 'EzFthora', text: '7' }],
  [Fthora.HardChromaticPa_Top, { fontFamily: 'EzFthora', text: '1' }],
  [Fthora.HardChromaticThi_Top, { fontFamily: 'EzFthora', text: '6' }],
  [Fthora.SoftChromaticPa_Top, { fontFamily: 'EzFthora', text: '4' }],
  [Fthora.SoftChromaticThi_Top, { fontFamily: 'EzFthora', text: '2' }],
  [Fthora.Enharmonic_Top, { fontFamily: 'EzFthora', text: '0' }],
  [Fthora.Zygos_Top, { fontFamily: 'EzFthora', text: '8' }],
  [Fthora.Kliton_Top, { fontFamily: 'EzFthora', text: '9' }],
  [Fthora.Spathi_Top, { fontFamily: 'EzFthora', text: '`' }],

  [Fthora.DiatonicNiLow_Bottom, { fontFamily: 'EzFthora', text: 'z' }],
  [Fthora.DiatonicPa_Bottom, { fontFamily: 'EzFthora', text: 'a' }],
  [Fthora.DiatonicThi_Bottom, { fontFamily: 'EzFthora', text: 's' }],
  [Fthora.DiatonicKe_Bottom, { fontFamily: 'EzFthora', text: 'x' }],
  [Fthora.DiatonicNiHigh_Bottom, { fontFamily: 'EzFthora', text: 'u' }],
  [Fthora.HardChromaticPa_Bottom, { fontFamily: 'EzFthora', text: 'q' }],
  [Fthora.HardChromaticThi_Bottom, { fontFamily: 'EzFthora', text: 'y' }],
  [Fthora.SoftChromaticPa_Bottom, { fontFamily: 'EzFthora', text: 'r' }],
  [Fthora.SoftChromaticThi_Bottom, { fontFamily: 'EzFthora', text: 'w' }],
  [Fthora.Enharmonic_Bottom, { fontFamily: 'EzFthora', text: 'p' }],
  [Fthora.Zygos_Bottom, { fontFamily: 'EzFthora', text: 'i' }],
  [Fthora.Kliton_Bottom, { fontFamily: 'EzFthora', text: 'o' }],

  [Fthora.GeneralSharp_Top, { fontFamily: 'EzFthora', text: '3' }],
  [Fthora.GeneralSharp_Bottom, { fontFamily: 'EzFthora', text: 'e' }],

  [Fthora.GeneralFlat_Top, { fontFamily: 'EzFthora', text: '5' }],
  [Fthora.GeneralFlat_Bottom, { fontFamily: 'EzFthora', text: 't' }],

  [Accidental.Sharp_2_Left, { fontFamily: 'EzFthora', text: '=' }],
  [Accidental.Sharp_4_Left, { fontFamily: 'EzFthora', text: ']' }],
  [Accidental.Sharp_6_Left, { fontFamily: 'EzFthora', text: ';' }],

  [Accidental.Flat_2_Right, { fontFamily: 'EzFthora', text: '_' }],
  [Accidental.Flat_4_Right, { fontFamily: 'EzFthora', text: '{' }],
  [Accidental.Flat_6_Right, { fontFamily: 'EzFthora', text: '"' }],

  [TempoSign.VerySlow, { fontFamily: 'EzSpecial1', text: 'S' }],
  [TempoSign.Slow, { fontFamily: 'EzSpecial1', text: 'a' }],
  [TempoSign.Medium, { fontFamily: 'EzSpecial1', text: 's' }],
  [TempoSign.Moderate, { fontFamily: 'EzSpecial1', text: 'z' }],
  [TempoSign.Quick, { fontFamily: 'EzSpecial1', text: 'x' }],
  [TempoSign.VeryQuick, { fontFamily: 'EzSpecial1', text: 'X' }],

  [VocalExpressionNeume.Vareia, { fontFamily: 'Psaltica', text: '\\' }],
  [
    VocalExpressionNeume.HomalonConnecting,
    { fontFamily: 'Psaltica', text: '[' },
  ],
  [VocalExpressionNeume.Homalon, { fontFamily: 'Psaltica', text: '{' }],
  [VocalExpressionNeume.Antikenoma, { fontFamily: 'Psaltica', text: '"' }],
  [VocalExpressionNeume.AntikenomaShort, { fontFamily: 'Psaltica', text: '}' }],
  [VocalExpressionNeume.Psifiston, { fontFamily: 'Psaltica', text: "'" }],
  [VocalExpressionNeume.Heteron, { fontFamily: 'Psaltica', text: ']' }],

  [RootSign.Delta, { fontFamily: 'Psaltica', text: 'C' }],
  [RootSign.Alpha, { fontFamily: 'Psaltica', text: 'V' }],
  [RootSign.Legetos, { fontFamily: 'Psaltica', text: 'B' }],
  [RootSign.Nana, { fontFamily: 'Psaltica', text: 'N' }],
  [RootSign.Tilt, { fontFamily: 'Psaltica', text: 'M' }],
  [RootSign.Dots, { fontFamily: 'Psaltica', text: '<' }],
  [RootSign.Zo, { fontFamily: 'Psaltica', text: '>' }],
  [RootSign.Squiggle, { fontFamily: 'Psaltica', text: '?' }],
  [RootSign.Zygos, { fontFamily: 'EzFthora', text: 'I' }],
  [RootSign.SoftChromaticSquiggle, { fontFamily: 'Psaltica', text: '<?' }],
  [RootSign.DeltaDotted, { fontFamily: 'Psaltica', text: 'C<' }],
  [RootSign.AlphaDotted, { fontFamily: 'Psaltica', text: 'V<' }],
  [RootSign.SoftChromaticPaRootSign, { fontFamily: 'EzFthora', text: 'R' }],
  [RootSign.NanaLow, { fontFamily: 'EzSpecial1', text: 'N' }],
  [RootSign.DeltaLow, { fontFamily: 'EzSpecial1', text: 'M' }],
  [RootSign.AlphaLow, { fontFamily: 'EzSpecial1', text: '<' }],

  [Note.Ni, { fontFamily: 'Psaltica', text: 'c' }],
  [Note.Pa, { fontFamily: 'Psaltica', text: 'v' }],
  [Note.Vou, { fontFamily: 'Psaltica', text: 'b' }],
  [Note.Ga, { fontFamily: 'Psaltica', text: 'n' }],
  [Note.Thi, { fontFamily: 'Psaltica', text: 'm' }],
  [Note.Ke, { fontFamily: 'Psaltica', text: ',' }],
  [Note.Zo, { fontFamily: 'Psaltica', text: '.' }],
  [Note.GaLow, { fontFamily: 'EzSpecial1', text: 'n' }],
  [Note.ThiLow, { fontFamily: 'EzSpecial1', text: 'm' }],
  [Note.KeLow, { fontFamily: 'EzSpecial1', text: ',' }],
  [Note.Apostrophe, { fontFamily: 'Psaltica', text: '/' }],

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

  [NoteIndicator.Ni, { fontFamily: 'EzFthora', text: 'c' }],
  [NoteIndicator.Pa, { fontFamily: 'EzFthora', text: 'v' }],
  [NoteIndicator.Vou, { fontFamily: 'EzFthora', text: 'b' }],
  [NoteIndicator.Ga, { fontFamily: 'EzFthora', text: 'n' }],
  [NoteIndicator.Thi, { fontFamily: 'EzFthora', text: 'm' }],
  [NoteIndicator.Ke, { fontFamily: 'EzFthora', text: ',' }],
  [NoteIndicator.Zo, { fontFamily: 'EzFthora', text: '.' }],

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

const quantitativeNeumeKeyboardMap = new Map<string, QuantitativeNeume>([
  ['KeyH', QuantitativeNeume.Ison],
  ['KeyJ', QuantitativeNeume.Oligon],
  ['KeyK', QuantitativeNeume.OligonPlusKentimaBelow],
  ['KeyL', QuantitativeNeume.OligonPlusKentimaAbove],
  ['KeyU', QuantitativeNeume.OligonPlusHypsiliRight],
  ['KeyI', QuantitativeNeume.OligonPlusHypsiliLeft],
  ['KeyO', QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal],
  ['KeyP', QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical],
  ['KeyY', QuantitativeNeume.OligonPlusDoubleHypsili],

  ['KeyB', QuantitativeNeume.Apostrophos],
  ['KeyN', QuantitativeNeume.Elaphron],
  ['KeyM', QuantitativeNeume.ElaphronPlusApostrophos],
  // ["KeyV", QuantitativeNeume.Hamili],
  // ["KeyC", QuantitativeNeume.HamiliPlusApostrophos],
  // ["KeyX", QuantitativeNeume.HamiliPlusElaphron],
  // ["KeyZ", QuantitativeNeume.HamiliPlusElaphronPlusApostrophos],
  // ["Slash", QuantitativeNeume.DoubleHamili],
]);

// PetastiPlusApostrophos = 'Q',
// PetastiPlusElaphron = 'W',
// PetastiPlusElaphronPlusApostrophos = 'E',

const quantitativeNeumeKeyboardMap_Shift = new Map<string, QuantitativeNeume>([
  ['KeyH', QuantitativeNeume.PetastiWithIson],
  ['KeyJ', QuantitativeNeume.Petasti],
  ['KeyK', QuantitativeNeume.PetastiPlusOligon],
  ['KeyL', QuantitativeNeume.PetastiPlusKentimaAbove],
  ['KeyU', QuantitativeNeume.PetastiPlusHypsiliRight],
  ['KeyI', QuantitativeNeume.PetastiPlusHypsiliLeft],
  ['KeyO', QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal],
  ['KeyP', QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical],
  ['KeyY', QuantitativeNeume.PetastiPlusDoubleHypsili],
]);

const timeNeumeKeyboardMap = new Map<string, TimeNeume>([
  ['Comma', TimeNeume.Klasma_Top],
]);

const gorgonNeumeKeyboardMap = new Map<string, GorgonNeume>([
  ['Semicolon', GorgonNeume.Gorgon_Top],
]);

export const KeyboardMap = {
  quantitativeNeumeKeyboardMap,
  quantitativeNeumeKeyboardMap_Shift,

  timeNeumeKeyboardMap,
  gorgonNeumeKeyboardMap,
};
