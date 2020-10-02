import { TimeNeume, QuantitativeNeume, Note, RootSign, VocalExpressionNeume, Fthora } from '@/models/Neumes';

export enum ElementType {
    Note = 'Note',
    Martyria = 'Martyria',
    Empty = 'Empty',
}

export abstract class Element {
    abstract elementType: ElementType;
    public lineBreak: boolean = false;
    public pageBreak: boolean = false;
}

export class NoteElement extends Element {
    public readonly elementType: ElementType = ElementType.Note; 
    public quantitativeNeume: QuantitativeNeume = QuantitativeNeume.Ison; 
    public timeNeume: TimeNeume | null = null;
    public vocalExpressionNeume: VocalExpressionNeume | null = null;
    public fthora: Fthora | null = null;
    public lyrics: string = '';

}

export class MartyriaElement extends Element  {  
    public readonly elementType: ElementType = ElementType.Martyria; 
    public note: Note = Note.Pa;
    public rootSign: RootSign = RootSign.Alpha;
    public apostrophe: boolean = false;
}

export class EmptyElement extends Element {
    public readonly elementType: ElementType = ElementType.Empty; 
}