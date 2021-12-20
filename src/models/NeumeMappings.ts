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
    QuantitativeNeume.OligonPlusApostrophos,
    { fontFamily: 'Psaltica', text: 'I' },
  ],
  [
    QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
    { fontFamily: 'Psaltica', text: 'U' },
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

  [QuantitativeNeume.Kentima, { fontFamily: 'Psaltica', text: '~' }],
  [QuantitativeNeume.OligonPlusKentima, { fontFamily: 'Psaltica', text: '1~' }],
  [QuantitativeNeume.Kentemata, { fontFamily: 'Psaltica', text: '`' }],

  [QuantitativeNeume.Cross, { fontFamily: 'Psaltica', text: '+' }],
  [QuantitativeNeume.VareiaDotted, { fontFamily: 'Psaltica', text: '|' }],

  [GorgonNeume.Gorgon_Top, { fontFamily: 'Psaltica', text: 's' }],
  [GorgonNeume.Gorgon_Bottom, { fontFamily: 'Psaltica', text: 'x' }],

  [GorgonNeume.Gorgon_TopRight, { fontFamily: 'Psaltica', text: 'S' }],
  [GorgonNeume.Gorgon_BottomRight, { fontFamily: 'Psaltica', text: 'X' }],

  [GorgonNeume.Digorgon, { fontFamily: 'Psaltica', text: 'd' }],
  [GorgonNeume.Trigorgon, { fontFamily: 'Psaltica', text: 'f' }],

  [GorgonNeume.Digorgon_Right, { fontFamily: 'Psaltica', text: 'D' }],
  [GorgonNeume.Trigorgon_Right, { fontFamily: 'Psaltica', text: 'F' }],

  [GorgonNeume.GorgonDottedLeft, { fontFamily: 'Psaltica', text: 'h' }],
  [GorgonNeume.GorgonDottedRight, { fontFamily: 'EzSpecial1', text: 'h' }],

  [GorgonNeume.GorgonDottedLeft_Right, { fontFamily: 'Psaltica', text: 'H' }],
  [
    GorgonNeume.GorgonDottedRight_Right,
    { fontFamily: 'EzSpecial1', text: 'H' },
  ],

  [GorgonNeume.Argon, { fontFamily: 'Psaltica', text: 'g' }],
  [GorgonNeume.Hemiolion, { fontFamily: 'Psaltica', text: 'G' }],
  [GorgonNeume.Diargon, { fontFamily: 'EzSpecial1', text: 'J' }],

  [TimeNeume.Klasma_Top, { fontFamily: 'Psaltica', text: 'a' }],
  [TimeNeume.Klasma_Bottom, { fontFamily: 'Psaltica', text: 'z' }],

  [TimeNeume.Klasma_TopRight, { fontFamily: 'Psaltica', text: 'A' }],
  [TimeNeume.Klasma_TopLeft, { fontFamily: 'Psaltica', text: 'Z' }],

  [TimeNeume.Hapli, { fontFamily: 'Psaltica', text: ';' }],
  [TimeNeume.Dipli, { fontFamily: 'Psaltica', text: 'k' }],
  [TimeNeume.Tripli, { fontFamily: 'EzSpecial1', text: ';' }],

  [TimeNeume.Hapli_Right, { fontFamily: 'Psaltica', text: ':' }],
  [TimeNeume.Dipli_Right, { fontFamily: 'Psaltica', text: 'K' }],
  [TimeNeume.Tripli_Right, { fontFamily: 'EzSpecial1', text: ':' }],

  [Fthora.DiatonicNiLow_TopCenter, { fontFamily: 'EzFthora', text: 'd' }],
  [Fthora.DiatonicPa_TopCenter, { fontFamily: 'EzFthora', text: 'f' }],
  [Fthora.DiatonicVou_TopCenter, { fontFamily: 'EzFthora', text: 'g' }],
  [Fthora.DiatonicGa_TopCenter, { fontFamily: 'EzFthora', text: 'h' }],
  [Fthora.DiatonicThi_TopCenter, { fontFamily: 'EzFthora', text: 'j' }],
  [Fthora.DiatonicKe_TopCenter, { fontFamily: 'EzFthora', text: 'k' }],
  [Fthora.DiatonicZo_TopCenter, { fontFamily: 'EzFthora', text: 'l' }],
  [Fthora.DiatonicNiHigh_TopCenter, { fontFamily: 'EzFthora', text: '7' }],
  [Fthora.HardChromaticPa_TopCenter, { fontFamily: 'EzFthora', text: '1' }],
  [Fthora.HardChromaticThi_TopCenter, { fontFamily: 'EzFthora', text: '6' }],
  [Fthora.SoftChromaticPa_TopCenter, { fontFamily: 'EzFthora', text: '4' }],
  [Fthora.SoftChromaticThi_TopCenter, { fontFamily: 'EzFthora', text: '2' }],
  [Fthora.Enharmonic_TopCenter, { fontFamily: 'EzFthora', text: '0' }],
  [Fthora.Zygos_TopCenter, { fontFamily: 'EzFthora', text: '8' }],
  [Fthora.Kliton_TopCenter, { fontFamily: 'EzFthora', text: '9' }],
  [Fthora.Spathi_TopCenter, { fontFamily: 'EzFthora', text: '`' }],

  [Fthora.DiatonicNiLow_TopRight, { fontFamily: 'EzFthora', text: 'D' }],
  [Fthora.DiatonicPa_TopRight, { fontFamily: 'EzFthora', text: 'F' }],
  [Fthora.DiatonicVou_TopRight, { fontFamily: 'EzFthora', text: 'G' }],
  [Fthora.DiatonicGa_TopRight, { fontFamily: 'EzFthora', text: 'H' }],
  [Fthora.DiatonicThi_TopRight, { fontFamily: 'EzFthora', text: 'J' }],
  [Fthora.DiatonicKe_TopRight, { fontFamily: 'EzFthora', text: 'K' }],
  [Fthora.DiatonicZo_TopRight, { fontFamily: 'EzFthora', text: 'L' }],
  [Fthora.DiatonicNiHigh_TopRight, { fontFamily: 'EzFthora', text: '&' }],
  [Fthora.HardChromaticPa_TopRight, { fontFamily: 'EzFthora', text: '!' }],
  [Fthora.HardChromaticThi_TopRight, { fontFamily: 'EzFthora', text: '^' }],
  [Fthora.SoftChromaticPa_TopRight, { fontFamily: 'EzFthora', text: '$' }],
  [Fthora.SoftChromaticThi_TopRight, { fontFamily: 'EzFthora', text: '@' }],
  [Fthora.Enharmonic_TopRight, { fontFamily: 'EzFthora', text: ')' }],
  [Fthora.Zygos_TopRight, { fontFamily: 'EzFthora', text: '*' }],
  [Fthora.Kliton_TopRight, { fontFamily: 'EzFthora', text: '(' }],
  [Fthora.Spathi_TopRight, { fontFamily: 'EzFthora', text: '~' }],

  [Fthora.DiatonicNiLow_BottomCenter, { fontFamily: 'EzFthora', text: 'z' }],
  [Fthora.DiatonicPa_BottomCenter, { fontFamily: 'EzFthora', text: 'a' }],
  [Fthora.DiatonicThi_BottomCenter, { fontFamily: 'EzFthora', text: 's' }],
  [Fthora.DiatonicKe_BottomCenter, { fontFamily: 'EzFthora', text: 'x' }],
  [Fthora.DiatonicNiHigh_BottomCenter, { fontFamily: 'EzFthora', text: 'u' }],
  [Fthora.HardChromaticPa_BottomCenter, { fontFamily: 'EzFthora', text: 'q' }],
  [Fthora.HardChromaticThi_BottomCenter, { fontFamily: 'EzFthora', text: 'y' }],
  [Fthora.SoftChromaticPa_BottomCenter, { fontFamily: 'EzFthora', text: 'r' }],
  [Fthora.SoftChromaticThi_BottomCenter, { fontFamily: 'EzFthora', text: 'w' }],
  [Fthora.Enharmonic_BottomCenter, { fontFamily: 'EzFthora', text: 'p' }],
  [Fthora.Zygos_BottomCenter, { fontFamily: 'EzFthora', text: 'i' }],
  [Fthora.Kliton_BottomCenter, { fontFamily: 'EzFthora', text: 'o' }],

  [Fthora.DiatonicNiLow_BottomRight, { fontFamily: 'EzFthora', text: 'Z' }],
  [Fthora.DiatonicPa_BottomRight, { fontFamily: 'EzFthora', text: 'A' }],
  [Fthora.DiatonicThi_BottomRight, { fontFamily: 'EzFthora', text: 'S' }],
  [Fthora.DiatonicKe_BottomRight, { fontFamily: 'EzFthora', text: 'X' }],
  [Fthora.DiatonicNiHigh_BottomRight, { fontFamily: 'EzFthora', text: 'U' }],
  [Fthora.HardChromaticPa_BottomRight, { fontFamily: 'EzFthora', text: 'Q' }],
  [Fthora.HardChromaticThi_BottomRight, { fontFamily: 'EzFthora', text: 'Y' }],
  [Fthora.SoftChromaticPa_BottomRight, { fontFamily: 'EzFthora', text: 'R' }],
  [Fthora.SoftChromaticThi_BottomRight, { fontFamily: 'EzFthora', text: 'W' }],
  [Fthora.Enharmonic_BottomRight, { fontFamily: 'EzFthora', text: 'P' }],
  [Fthora.Zygos_BottomRight, { fontFamily: 'EzFthora', text: 'I' }],
  [Fthora.Kliton_BottomRight, { fontFamily: 'EzFthora', text: 'O' }],

  [Fthora.GeneralSharp_TopCenter, { fontFamily: 'EzFthora', text: '3' }],
  [Fthora.GeneralSharp_TopRight, { fontFamily: 'EzFthora', text: '#' }],
  [Fthora.GeneralSharp_BottomCenter, { fontFamily: 'EzFthora', text: 'e' }],
  [Fthora.GeneralSharp_BottomRight, { fontFamily: 'EzFthora', text: 'E' }],

  [Fthora.GeneralFlat_TopCenter, { fontFamily: 'EzFthora', text: '5' }],
  [Fthora.GeneralFlat_TopRight, { fontFamily: 'EzFthora', text: '%' }],
  [Fthora.GeneralFlat_BottomCenter, { fontFamily: 'EzFthora', text: 't' }],
  [Fthora.GeneralFlat_BottomRight, { fontFamily: 'EzFthora', text: 'T' }],

  [Accidental.Sharp_2_Right, { fontFamily: 'EzFthora', text: '+' }],
  [Accidental.Sharp_2_Left, { fontFamily: 'EzFthora', text: '=' }],
  [Accidental.Sharp_4_Right, { fontFamily: 'EzFthora', text: '}' }],
  [Accidental.Sharp_4_Left, { fontFamily: 'EzFthora', text: ']' }],
  [Accidental.Sharp_6_Right, { fontFamily: 'EzFthora', text: ':' }],
  [Accidental.Sharp_6_Left, { fontFamily: 'EzFthora', text: ';' }],

  [Accidental.Flat_2_Right, { fontFamily: 'EzFthora', text: '_' }],
  [Accidental.Flat_2_Left, { fontFamily: 'EzFthora', text: '-' }],
  [Accidental.Flat_4_Right, { fontFamily: 'EzFthora', text: '{' }],
  [Accidental.Flat_4_Left, { fontFamily: 'EzFthora', text: '[' }],
  [Accidental.Flat_6_Right, { fontFamily: 'EzFthora', text: '"' }],
  [Accidental.Flat_6_Left, { fontFamily: 'EzFthora', text: "'" }],

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
  [ModeSign.AlphaWithHypsili, { fontFamily: 'EzSpecial2', text: 'Q' }],
  [ModeSign.SoftChromatic6, { fontFamily: 'EzSpecial2', text: 'w' }],
  [ModeSign.SoftChromatic2, { fontFamily: 'EzSpecial2', text: 'W' }],
  [ModeSign.Nana, { fontFamily: 'EzSpecial2', text: 'e' }],
  [ModeSign.VarysZo, { fontFamily: 'EzSpecial2', text: 'E' }],
  [ModeSign.Delta, { fontFamily: 'EzSpecial2', text: 'r' }],
  [ModeSign.DeltaWithHypsili, { fontFamily: 'EzSpecial2', text: 'R' }],
  [ModeSign.OligonPlusKentemata, { fontFamily: 'EzSpecial2', text: 'y' }],
  [ModeSign.DeltaHat, { fontFamily: 'EzSpecial2', text: 'T' }],
  [ModeSign.NanaOld, { fontFamily: 'EzSpecial2', text: 'p' }],
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
