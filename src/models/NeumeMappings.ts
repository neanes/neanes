import { Neume, TimeNeume, QuantitativeNeume, VocalExpressionNeume, RootSign, Note } from '@/models/Neumes';

export type NeumeFont = 'Psaltica' | 'Omega' | 'EzSpecial2';

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

    [TimeNeume.Gorgon, { fontFamily: 'Psaltica', text: 's' }],
    [TimeNeume.Klasma, { fontFamily: 'Psaltica', text: 'a' }],

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
    ["Semicolon", TimeNeume.Gorgon],
    ["Comma", TimeNeume.Klasma],
]);

export const KeyboardMap = {
    quantitativeNeumeKeyboardMap,
    quantitativeNeumeKeyboardMap_Shift,

    timeNeumeKeyboardMap,
};