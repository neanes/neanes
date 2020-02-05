export enum QuantitativeNeume {
    Ison = 'Ison',

    Oligon = 'Oligon',
    OligonPlusKentimaBelow = 'OligonPlusKentimaBelow',
    OligonPlusKentimaAbove = 'OligonPlusKentimaAbove',
    OligonPlusHypsiliRight = 'OligonPlusHypsiliRight',
    OligonPlusHypsiliLeft = 'OligonPlusHypsiliLeft',
    OligonPlusHypsiliPlusKentimaHorizontal = 'OligonPlusHypsiliPlusKentimaHorizontal',
    OligonPlusHypsiliPlusKentimaVertical = 'OligonPlusHypsiliPlusKentimaVertical',
    OligonPlusDoubleHypsili = 'OligonPlusDoubleHypsili',

    PetastiWithIson = 'PetastiWithIson',
    Petasti = 'Petasti',
    PetastiPlusKentimaBelow = 'PetastiPlusKentimaBelow',
    PetastiPlusKentimaAbove = 'PetastiPlusKentimaAbove',
    PetastiPlusHypsiliRight = 'PetastiPlusHypsiliRight',
    PetastiPlusHypsiliLeft = 'PetastiPlusHypsiliLeft',
    PetastiPlusHypsiliPlusKentimaHorizontal = 'PetastiPlusHypsiliPlusKentimaHorizontal',
    PetastiPlusHypsiliPlusKentimaVertical = 'PetastiPlusHypsiliPlusKentimaVertical',
    PetastiPlusDoubleHypsili = 'PetastiPlusDoubleHypsili',

    Apostrophos = 'Apostrophos',
    Elaphron = 'Elaphron',
    ElaphronPlusApostrophos = 'ElaphronPlusApostrophos',
    Hamili = 'Hamili',
    HamiliPlusApostrophos = 'HamiliPlusApostrophos',
    HamiliPlusElaphron = 'HamiliPlusElaphron',
    HamiliPlusElaphronPlusApostrophos = 'HamiliPlusElaphronPlusApostrophos',
    DoubleHamili = 'DoubleHamili',

    PetastiPlusApostrophos = 'PetastiPlusApostrophos',
    PetastiPlusElaphron = 'PetastiPlusElaphron',
    PetastiPlusElaphronPlusApostrophos = 'PetastiPlusElaphronPlusApostrophos',

    OligonPlusKentemata = 'OligonPlusKentemata',
    KentemataPlusOligon = 'KentemataPlusOligon',
    OligonPlusIsonPlusKentemata = 'OligonPlusIsonPlusKentemata',
    OligonPlusApostrophosPlusKentemata = 'OligonPlusApostrophosPlusKentemata',
    OligonPlusElaphronPlusKentemata = 'OligonPlusElaphronPlusKentemata',
    OligonPlusElaphronPlusApostrophosPlusKentemata = 'OligonPlusElaphronPlusApostrophosPlusKentemata',
    OligonPlusHamiliPlusKentemata = 'OligonPlusHamiliPlusKentemata',
    RunningElaphron = 'RunningElaphron',
    Hyporoe = 'Hyporoe',

    Kentima = 'Kentima',
    OligonPlusKentima = 'OligonPlusKentima',
    Kentemata = 'Kentemata',
}

export enum TimeNeume {
    Gorgon = 'Gorgon',
    Klasma = 'Klasma',
}

export enum VocalExpressionNeume {
    Vareia = 'Vareia',
    HomalonConnecting = 'HomalonConnecting',
    Homalon = 'Homalon',
    Antikenoma = 'Antikenoma',
    Psifiston = 'Psifiston',
    Heteron = 'Heteron',
    Cross = 'Cross',
}

export enum RootSign {
    Delta = 'Delta',
    Alpha = 'Alpha',
    Legetos = 'Legetos',
    Nana = 'Nana',
    Tilt = 'Tilt',
    Dots = 'Dots',
    Zo = 'Zo',
    Squiggle = 'Squiggle',
    SoftChromaticSquiggle = 'SoftChromaticSquiggle',
}

export enum Note {
    Ni = 'Ni',
    Pa = 'Pa',
    Vou = 'Vou',
    Ga = 'Ga',
    Thi = 'Thi',
    Ke = 'Ke',
    Zo = 'Zo',
    Apostrophe = 'Apostrophe',
}

export type Neume = QuantitativeNeume | TimeNeume | VocalExpressionNeume | RootSign | Note;

const highNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.OligonPlusKentemata,
];

const redNeumes: Neume[] = [
    TimeNeume.Gorgon,
    VocalExpressionNeume.Heteron,
];

export function isHighNeume(neume: QuantitativeNeume) {
    return highNeumes.includes(neume);
}

export function isRedNeume(neume: Neume) {
    return redNeumes.includes(neume);
}