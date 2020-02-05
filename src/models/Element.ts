import { TimeNeume, QuantitativeNeume, Note, RootSign, VocalExpressionNeume } from '@/models/Neumes';

export enum ElementType {
    Syllable = 'Syllable',
    Martyria = 'Martyria',
    Empty = 'Empty',
}

export interface Element {
    type: ElementType;
}

export interface SyllableElement extends Element {
    neume: SyllableNeume; 
    lyrics: string;
}

export interface MartyriaElement extends Element  {    
    neume: MartyriaNeume;
}

export interface EmptyElement extends Element {

}

export interface SyllableNeume {
    quantitativeNeume: QuantitativeNeume; 
    timeNeume: TimeNeume | null;
    vocalExpressionNeume: VocalExpressionNeume | null;
    //fthora: Fthora | null;
    //ison: Ison | null;
}

export interface MartyriaNeume {
    note: Note;
    rootSign: RootSign;
}