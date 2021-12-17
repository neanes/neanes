import { Neume, TimeNeume, QuantitativeNeume, Fthora, Accidental, TempoSign, VocalExpressionNeume, RootSign, Note, GorgonNeume, ModeSign } from '@/models/Neumes';

export interface NeumeAdjustmentOffset {
    x: number;
    y: number;
}

export interface NeumeAdjustment {
    isPairedWith: Neume;
    offset: NeumeAdjustmentOffset;
}

export const gorgonAdjustmentMap = new Map<GorgonNeume, NeumeAdjustment[]>([
    [GorgonNeume.Gorgon_Top, [ 
        { isPairedWith: QuantitativeNeume.OligonPlusKentemata, offset: { x: 0, y: -5 }},
    ]],

    [GorgonNeume.Gorgon_TopRight, [ 
        { isPairedWith: QuantitativeNeume.Hyporoe, offset: { x: 8, y: 5 }},
        { isPairedWith: QuantitativeNeume.Apostrophos, offset: { x: 0, y: 4 }},
        { isPairedWith: QuantitativeNeume.OligonPlusIsonPlusKentemata, offset: { x: -3, y: 0 }},
    ]],

    [GorgonNeume.Digorgon_Right, [ 
        { isPairedWith: QuantitativeNeume.Hyporoe, offset: { x: 5, y: 6 }},
    ]],

    [GorgonNeume.Trigorgon_Right, [ 
        { isPairedWith: QuantitativeNeume.Hyporoe, offset: { x: 3, y: 6 }},
    ]],
   ]);

export const getGorgonAdjustments = (neume: GorgonNeume) => {
    return gorgonAdjustmentMap.get(neume);
}