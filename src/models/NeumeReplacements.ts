import { Neume, TimeNeume, QuantitativeNeume, Fthora, Accidental, TempoSign, VocalExpressionNeume, RootSign, Note, GorgonNeume, ModeSign } from '@/models/Neumes';

export interface NeumeReplacement<T> {
    isPairedWith?: Neume[];
    isNotPairedWith?: Neume[];
    replaceWith: T;
}

// Neumes that must be paired with special "_Right" neumes
const rightNeumes: Neume[] = [
    QuantitativeNeume.Apostrophos,
    QuantitativeNeume.Hyporoe,
    QuantitativeNeume.OligonPlusElaphronPlusKentemata,
    QuantitativeNeume.OligonPlusIsonPlusKentemata,
];

export const gorgonReplacementMap = new Map<GorgonNeume, NeumeReplacement<GorgonNeume>[]>([
    [GorgonNeume.Gorgon_Top, [
        { isPairedWith: rightNeumes, replaceWith: GorgonNeume.Gorgon_TopRight },
    ]],

    [GorgonNeume.Gorgon_Bottom, [
        { isPairedWith: rightNeumes, replaceWith: GorgonNeume.Gorgon_BottomRight },
    ]],

    [GorgonNeume.GorgonDottedLeft, [
        { isPairedWith: rightNeumes, replaceWith: GorgonNeume.GorgonDottedLeft_Right },
    ]],

    [GorgonNeume.GorgonDottedRight, [
        { isPairedWith: rightNeumes, replaceWith: GorgonNeume.GorgonDottedRight_Right },
    ]],

    [GorgonNeume.Digorgon, [
        { isPairedWith: rightNeumes, replaceWith: GorgonNeume.Digorgon_Right },
    ]],

    [GorgonNeume.Trigorgon, [
        { isPairedWith: rightNeumes, replaceWith: GorgonNeume.Trigorgon_Right },
    ]],

    [GorgonNeume.Gorgon_TopRight, [
        { isNotPairedWith: rightNeumes, replaceWith: GorgonNeume.Gorgon_Top },
    ]],

    [GorgonNeume.Gorgon_BottomRight, [
        { isNotPairedWith: rightNeumes, replaceWith: GorgonNeume.Gorgon_Bottom },
    ]],

    [GorgonNeume.GorgonDottedLeft_Right, [
        { isNotPairedWith: rightNeumes, replaceWith: GorgonNeume.GorgonDottedLeft },
    ]],

    [GorgonNeume.GorgonDottedRight_Right, [
        { isNotPairedWith: rightNeumes, replaceWith: GorgonNeume.GorgonDottedRight },
    ]],

    [GorgonNeume.Digorgon_Right, [
        { isNotPairedWith: rightNeumes, replaceWith: GorgonNeume.Digorgon },
    ]],

    [GorgonNeume.Trigorgon_Right, [
        { isNotPairedWith: rightNeumes, replaceWith: GorgonNeume.Trigorgon },
    ]],
]);


export const getGorgonReplacements = (neume: GorgonNeume) => {
    return gorgonReplacementMap.get(neume);
}

// export const getTimeReplacements = (neume: TimeNeume) => {
//     return timeReplacementMap.get(neume);
// }

// export const getVocalExpressionReplacements = (neume: VocalExpressionNeume) => {
//     return vocalExpressionReplacementMap.get(neume);
// }

// export const getFthoraReplacements = (neume: Fthora) => {
//     return fthoraReplacementMap.get(neume);
// }