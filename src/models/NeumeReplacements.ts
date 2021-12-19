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
    QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
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

export const timeReplacementMap = new Map<TimeNeume, NeumeReplacement<TimeNeume>[]>([
    [TimeNeume.Hapli, [
        { isPairedWith: rightNeumes, replaceWith: TimeNeume.Hapli_Right },
    ]],

    [TimeNeume.Dipli, [
        { isPairedWith: rightNeumes, replaceWith: TimeNeume.Dipli_Right },
    ]],

    [TimeNeume.Tripli, [
        { isPairedWith: rightNeumes, replaceWith: TimeNeume.Tripli_Right },
    ]],

    [TimeNeume.Klasma_Top, [
        { isPairedWith: rightNeumes, replaceWith: TimeNeume.Klasma_TopRight },
    ]],

    [TimeNeume.Hapli_Right, [
        { isNotPairedWith: rightNeumes, replaceWith: TimeNeume.Hapli },
    ]],

    [TimeNeume.Dipli_Right, [
        { isNotPairedWith: rightNeumes, replaceWith: TimeNeume.Dipli },
    ]],

    [TimeNeume.Tripli_Right, [
        { isNotPairedWith: rightNeumes, replaceWith: TimeNeume.Tripli },
    ]],

    [TimeNeume.Klasma_TopRight, [
        { isNotPairedWith: rightNeumes, replaceWith: TimeNeume.Klasma_Top },
    ]],
]);

export const vocalExpressionReplacementMap = new Map<VocalExpressionNeume, NeumeReplacement<VocalExpressionNeume>[]>([
    [VocalExpressionNeume.Antikenoma, [
        { isPairedWith: [QuantitativeNeume.Apostrophos], replaceWith: VocalExpressionNeume.AntikenomaShort },
    ]],
]);

export const fthoraReplacementMap = new Map<Fthora, NeumeReplacement<Fthora>[]>([
    [Fthora.DiatonicNiLow_TopCenter, [
        { isPairedWith: rightNeumes, replaceWith: Fthora.DiatonicNiLow_TopRight },
    ]],
]);

export const getGorgonReplacements = (neume: GorgonNeume) => {
    return gorgonReplacementMap.get(neume);
}

export const getTimeReplacements = (neume: TimeNeume) => {
    return timeReplacementMap.get(neume);
}

export const getVocalExpressionReplacements = (neume: VocalExpressionNeume) => {
    return vocalExpressionReplacementMap.get(neume);
}

export const getFthoraReplacements = (neume: Fthora) => {
    return fthoraReplacementMap.get(neume);
}

export const areTimeNeumesEquivalent = (neume1: TimeNeume, neume2: TimeNeume) => {
    return areNeumesEquivalent(neume1, neume2, getTimeReplacements(neume1), getTimeReplacements(neume2));
}

export const areGorgonsEquivalent = (neume1: GorgonNeume, neume2: GorgonNeume) => {
    return areNeumesEquivalent(neume1, neume2, getGorgonReplacements(neume1), getGorgonReplacements(neume2));
}

export const areVocalExpressionsEquivalent = (neume1: VocalExpressionNeume, neume2: VocalExpressionNeume) => {
    return areNeumesEquivalent(neume1, neume2, getVocalExpressionReplacements(neume1), getVocalExpressionReplacements(neume2));
}

export const areFthorasEquivalent = (neume1: Fthora, neume2: Fthora) => {
    return areNeumesEquivalent(neume1, neume2, getFthoraReplacements(neume1), getFthoraReplacements(neume2));
}

const areNeumesEquivalent = (neume1: Neume, neume2: Neume, replacements1: NeumeReplacement<Neume>[] | undefined, replacements2: NeumeReplacement<Neume>[] | undefined) => {
    if (neume1 === neume2) {
        return true;
    }
    if (replacements1) {
        if (replacements1.find(x => x.replaceWith == neume2)) {
            return true;
        }
    }

    if (replacements2) {
        if (replacements2.find(x => x.replaceWith == neume1)) {
            return true;
        }
    }

    return false;
}