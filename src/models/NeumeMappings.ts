import { Neume, TimeNeume, QuantitativeNeume, Fthora, TempoSign, VocalExpressionNeume, RootSign, Note } from '@/models/Neumes';

export type NeumeFont = 'Psaltica' | 'Omega' | 'EzSpecial1' | 'EzSpecial2' | 'EzFthora';

export interface NeumeMapping {
    fontFamily: NeumeFont,
    text: string
}

export const neumeMap = new Map<Neume, NeumeMapping>([
    [QuantitativeNeume.Ison, { fontFamily: 'Psaltica', text: '0'}],

    [QuantitativeNeume.Oligon, { fontFamily: 'Psaltica', text: '1'}],
    [QuantitativeNeume.OligonPlusKentimaBelow, { fontFamily: 'Psaltica', text: '2'}],
    [QuantitativeNeume.OligonPlusKentimaAbove, { fontFamily: 'Psaltica', text: '3'}],
    [QuantitativeNeume.OligonPlusHypsiliRight, { fontFamily: 'Psaltica', text: '4'}],
    [QuantitativeNeume.OligonPlusHypsiliLeft, { fontFamily: 'Psaltica', text: '5'}],
    [QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal, { fontFamily: 'Psaltica', text: '6'}],
    [QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical, { fontFamily: 'Psaltica', text: '7'}],
    [QuantitativeNeume.OligonPlusDoubleHypsili, { fontFamily: 'Psaltica', text: '8'}],

    [QuantitativeNeume.PetastiWithIson, { fontFamily: 'Psaltica', text: 'p'}],
    [QuantitativeNeume.Petasti, { fontFamily: 'Psaltica', text: 'q'}],
    [QuantitativeNeume.PetastiPlusKentimaBelow, { fontFamily: 'Psaltica', text: 'w'}],
    [QuantitativeNeume.PetastiPlusKentimaAbove, { fontFamily: 'Psaltica', text: 'e'}],
    [QuantitativeNeume.PetastiPlusHypsiliRight, { fontFamily: 'Psaltica', text: 'r'}],
    [QuantitativeNeume.PetastiPlusHypsiliLeft, { fontFamily: 'Psaltica', text: 't'}],
    [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal, { fontFamily: 'Psaltica', text: 'y'}],
    [QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical, { fontFamily: 'Psaltica', text: 'u'}],
    [QuantitativeNeume.PetastiPlusDoubleHypsili, { fontFamily: 'Psaltica', text: 'i'}],

    [QuantitativeNeume.Apostrophos, { fontFamily: 'Psaltica', text: '!'}],
    [QuantitativeNeume.Elaphron, { fontFamily: 'Psaltica', text: '@'}],
    [QuantitativeNeume.ElaphronPlusApostrophos, { fontFamily: 'Psaltica', text: '#'}],
    [QuantitativeNeume.Hamili, { fontFamily: 'Psaltica', text: '$'}],
    [QuantitativeNeume.HamiliPlusApostrophos, { fontFamily: 'Psaltica', text: '%'}],
    [QuantitativeNeume.HamiliPlusElaphron, { fontFamily: 'Psaltica', text: '^'}],
    [QuantitativeNeume.HamiliPlusElaphronPlusApostrophos, { fontFamily: 'Psaltica', text: '&'}],
    [QuantitativeNeume.DoubleHamili, { fontFamily: 'Psaltica', text: '*'}],

    [QuantitativeNeume.PetastiPlusApostrophos, { fontFamily: 'Psaltica', text: 'Q'}],
    [QuantitativeNeume.PetastiPlusElaphron, { fontFamily: 'Psaltica', text: 'W'}],
    [QuantitativeNeume.PetastiPlusElaphronPlusApostrophos, { fontFamily: 'Psaltica', text: 'E'}],

    [QuantitativeNeume.OligonPlusKentemata, { fontFamily: 'Psaltica', text: 'O'}],
    [QuantitativeNeume.KentemataPlusOligon, { fontFamily: 'Psaltica', text: 'o'}],
    [QuantitativeNeume.OligonPlusIsonPlusKentemata, { fontFamily: 'Psaltica', text: 'P'}],
    [QuantitativeNeume.OligonPlusApostrophosPlusKentemata, { fontFamily: 'Psaltica', text: 'I'}],
    [QuantitativeNeume.OligonPlusElaphronPlusKentemata, { fontFamily: 'Psaltica', text: 'U'}],
    [QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata, { fontFamily: 'Psaltica', text: 'Y'}],
    [QuantitativeNeume.OligonPlusHamiliPlusKentemata, { fontFamily: 'Psaltica', text: 'T'}],
    [QuantitativeNeume.RunningElaphron, { fontFamily: 'Psaltica', text: '_'}],
    [QuantitativeNeume.Hyporoe, { fontFamily: 'Psaltica', text: ')'}],

    [QuantitativeNeume.Kentima, { fontFamily: 'Psaltica', text: '~'}],
    [QuantitativeNeume.OligonPlusKentima, { fontFamily: 'Psaltica', text: '1~'}],
    [QuantitativeNeume.Kentemata, { fontFamily: 'Psaltica', text: '`'}],

    [TimeNeume.Gorgon_Top, { fontFamily: 'Psaltica', text: 's' }],
    [TimeNeume.Gorgon_Bottom, { fontFamily: 'Psaltica', text: 'x' }],

    [TimeNeume.Digorgon, { fontFamily: 'Psaltica', text: 'd' }],
    [TimeNeume.Trigorgon, { fontFamily: 'Psaltica', text: 'f' }],

    [TimeNeume.GorgonDottedLeft, { fontFamily: 'Psaltica', text: 'h' }],
    [TimeNeume.GorgonDottedRight, { fontFamily: 'EzSpecial1', text: 'h' }],

    [TimeNeume.Klasma_Top, { fontFamily: 'Psaltica', text: 'a' }],
    [TimeNeume.Klasma_Bottom, { fontFamily: 'Psaltica', text: 'z' }],

    [TimeNeume.Hapli, { fontFamily: 'Psaltica', text: ';' }],
    [TimeNeume.Dipli, { fontFamily: 'Psaltica', text: 'k' }],
    [TimeNeume.Tripli, { fontFamily: 'EzSpecial1', text: ';' }],

    [TimeNeume.Argon, { fontFamily: 'Psaltica', text: 'g' }],
    [TimeNeume.Hemiolion, { fontFamily: 'Psaltica', text: 'G' }],
    [TimeNeume.Diargon, { fontFamily: 'EzSpecial1', text: 'J' }],

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
    [Fthora.Enharmonic_BottomRight , { fontFamily: 'EzFthora', text: 'P' }],
    [Fthora.Zygos_BottomRight, { fontFamily: 'EzFthora', text: 'I' }],
    [Fthora.Kliton_BottomRight, { fontFamily: 'EzFthora', text: 'O' }],

    [Fthora.Sharp_2_Right, { fontFamily: 'EzFthora', text: '+' }],
    [Fthora.Sharp_2_Left, { fontFamily: 'EzFthora', text: '=' }],
    [Fthora.Sharp_4_Right, { fontFamily: 'EzFthora', text: '}' }],
    [Fthora.Sharp_4_Left, { fontFamily: 'EzFthora', text: ']' }],
    [Fthora.Sharp_6_Right, { fontFamily: 'EzFthora', text: ':' }],
    [Fthora.Sharp_6_Left, { fontFamily: 'EzFthora', text: ';' }],

    [Fthora.Flat_2_Right, { fontFamily: 'EzFthora', text: '_' }],
    [Fthora.Flat_2_Left, { fontFamily: 'EzFthora', text: '-' }],
    [Fthora.Flat_4_Right, { fontFamily: 'EzFthora', text: '{' }],
    [Fthora.Flat_4_Left, { fontFamily: 'EzFthora', text: '[' }],
    [Fthora.Flat_6_Right, { fontFamily: 'EzFthora', text: '"' }],
    [Fthora.Flat_6_Left, { fontFamily: 'EzFthora', text: '\'' }],

    [Fthora.GeneralSharp_TopCenter, { fontFamily: 'EzFthora', text: '3' }],
    [Fthora.GeneralSharp_TopRight, { fontFamily: 'EzFthora', text: '#' }],
    [Fthora.GeneralSharp_BottomCenter, { fontFamily: 'EzFthora', text: 'e' }],
    [Fthora.GeneralSharp_BottomRight, { fontFamily: 'EzFthora', text: 'E' }],
    
    [Fthora.GeneralFlat_TopCenter, { fontFamily: 'EzFthora', text: '5' }],
    [Fthora.GeneralFlat_TopRight, { fontFamily: 'EzFthora', text: '%' }],
    [Fthora.GeneralFlat_BottomCenter, { fontFamily: 'EzFthora', text: 't' }],
    [Fthora.GeneralFlat_BottomRight, { fontFamily: 'EzFthora', text: 'T' }],

    [TempoSign.VerySlow, { fontFamily: 'EzSpecial1', text: 'S' }],
    [TempoSign.Slow, { fontFamily: 'EzSpecial1', text: 'a' }],
    [TempoSign.Medium, { fontFamily: 'EzSpecial1', text: 's' }],
    [TempoSign.Moderate, { fontFamily: 'EzSpecial1', text: 'z' }],
    [TempoSign.Quick, { fontFamily: 'EzSpecial1', text: 'x' }],
    [TempoSign.VeryQuick, { fontFamily: 'EzSpecial1', text: 'X' }],

    [VocalExpressionNeume.Vareia, { fontFamily: 'Psaltica', text: '\\'}],
    [VocalExpressionNeume.HomalonConnecting, { fontFamily: 'Psaltica', text: '['}],
    [VocalExpressionNeume.Homalon, { fontFamily: 'Psaltica', text: '{'}],
    [VocalExpressionNeume.Antikenoma, { fontFamily: 'Psaltica', text: '"'}],
    [VocalExpressionNeume.Psifiston, { fontFamily: 'Psaltica', text: '\''}],
    [VocalExpressionNeume.Heteron, { fontFamily: 'Psaltica', text: ']'}],
    [VocalExpressionNeume.Cross, { fontFamily: 'Psaltica', text: '+'}],

    [RootSign.Delta, { fontFamily: 'Psaltica', text: 'C'}],
    [RootSign.Alpha, { fontFamily: 'Psaltica', text: 'V'}],
    [RootSign.Legetos, { fontFamily: 'Psaltica', text: 'B'}],
    [RootSign.Nana, { fontFamily: 'Psaltica', text: 'N'}],
    [RootSign.Tilt, { fontFamily: 'Psaltica', text: 'M'}],
    [RootSign.Dots, { fontFamily: 'Psaltica', text: '<'}],
    [RootSign.Zo, { fontFamily: 'Psaltica', text: '>'}],
    [RootSign.Squiggle, { fontFamily: 'Psaltica', text: '?'}],
    [RootSign.SoftChromaticSquiggle, { fontFamily: 'Psaltica', text: '<?'}],
    [RootSign.DeltaDotted, { fontFamily: 'Psaltica', text: 'C<'}],
    [RootSign.AlphaDotted, { fontFamily: 'Psaltica', text: 'V<'}],
    [RootSign.SoftChromaticPaRootSign, { fontFamily: 'EzFthora', text: 'R'}],

    [Note.Ni, { fontFamily: 'Psaltica', text: 'c'}],
    [Note.Pa, { fontFamily: 'Psaltica', text: 'v'}],
    [Note.Vou, { fontFamily: 'Psaltica', text: 'b'}],
    [Note.Ga, { fontFamily: 'Psaltica', text: 'n'}],
    [Note.Thi, { fontFamily: 'Psaltica', text: 'm'}],
    [Note.Ke, { fontFamily: 'Psaltica', text: ','}],
    [Note.Zo, { fontFamily: 'Psaltica', text: '.'}],
    [Note.Apostrophe, { fontFamily: 'Psaltica', text: '/'}],
]);

const quantitativeNeumeKeyboardMap = new Map<string, QuantitativeNeume>([
    ["KeyH", QuantitativeNeume.Ison],
    ["KeyJ", QuantitativeNeume.Oligon],
    ["KeyK", QuantitativeNeume.OligonPlusKentimaBelow],
    ["KeyL", QuantitativeNeume.OligonPlusKentimaAbove],
    ["KeyU", QuantitativeNeume.OligonPlusHypsiliRight],
    ["KeyI", QuantitativeNeume.OligonPlusHypsiliLeft],
    ["KeyO", QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal],
    ["KeyP", QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical],
    ["KeyY", QuantitativeNeume.OligonPlusDoubleHypsili],

    ["KeyB", QuantitativeNeume.Apostrophos],
    ["KeyN", QuantitativeNeume.Elaphron],
    ["KeyM", QuantitativeNeume.ElaphronPlusApostrophos],
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
    ["KeyH", QuantitativeNeume.PetastiWithIson],
    ["KeyJ", QuantitativeNeume.Petasti],
    ["KeyK", QuantitativeNeume.PetastiPlusKentimaBelow],
    ["KeyL", QuantitativeNeume.PetastiPlusKentimaAbove],
    ["KeyU", QuantitativeNeume.PetastiPlusHypsiliRight],
    ["KeyI", QuantitativeNeume.PetastiPlusHypsiliLeft],
    ["KeyO", QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal],
    ["KeyP", QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical],
    ["KeyY", QuantitativeNeume.PetastiPlusDoubleHypsili],
]);

const timeNeumeKeyboardMap = new Map<string, TimeNeume>([
    ["Semicolon", TimeNeume.Gorgon_Top],
    ["Comma", TimeNeume.Klasma_Top],
]);

export const KeyboardMap = {
    quantitativeNeumeKeyboardMap,
    quantitativeNeumeKeyboardMap_Shift,

    timeNeumeKeyboardMap,
};