import { TimeNeume, GorgonNeume, QuantitativeNeume, Note, RootSign, VocalExpressionNeume, Fthora, Accidental } from '@/models/save/v1/Neumes';

export enum ElementType {
    Note = 'Note',
    Martyria = 'Martyria',
    Empty = 'Empty',
    TextBox = 'TextBox',
    StaffText = 'StaffText',
    DropCap = 'DropCap'
}

export abstract class ScoreElement {
    abstract elementType: ElementType;
    public lineBreak: boolean = false;
    public pageBreak: boolean = false;
}

export class NoteElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.Note; 
    public quantitativeNeume: QuantitativeNeumeElement = new QuantitativeNeumeElement(QuantitativeNeume.Ison); 
    public timeNeume: TimeNeumeElement | null = null;
    public gorgonNeume: GorgonNeumeElement | null = null;
    public vocalExpressionNeume: VocalExpressionNeumeElement | null = null;
    public fthora: FthoraElement | null = null;
    public accidental: AccidentalElement | null = null;
    public lyrics: string = '';
    public isMelisma: boolean = false;
    public isMelismaStart: boolean = false;
}

export class MartyriaElement extends ScoreElement  {  
    public readonly elementType: ElementType = ElementType.Martyria; 
    public note: Note = Note.Pa;
    public rootSign: RootSign = RootSign.Alpha;
    public apostrophe: boolean = false;
}

export class EmptyElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.Empty; 
}

export enum TextBoxAlignment {
    Center = 'center',
    Left = 'left',
    Right = 'right',
}

export class TextBoxElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.TextBox;
    public alignment: TextBoxAlignment = TextBoxAlignment.Left;
    public color: string = 'black';
    public content: string = '';
    public fontSize: number = 16;
    public fontFamily: string = 'Omega';
    public height: number = 20;
}

export class StaffTextElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.StaffText;
    public offset: ScoreElementOffset = new ScoreElementOffset;
    public text: string = 'text';
}

export class DropCapElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.DropCap;
    public content: string = 'A';
    public fontFamily: string | null = null;
    public fontSize: number | null = null;
    public color: string | null = null;
}

export class QuantitativeNeumeElement {
    public offset: ScoreElementOffset = new ScoreElementOffset;
    public neume: QuantitativeNeume;

    constructor(neume: QuantitativeNeume) {
        this.neume = neume;
    }
}

export class TimeNeumeElement {
    public offset: ScoreElementOffset = new ScoreElementOffset;
    public neume: TimeNeume;

    constructor(neume: TimeNeume) {
        this.neume = neume;
    }
}

export class GorgonNeumeElement {
    public offset: ScoreElementOffset = new ScoreElementOffset;
    public neume: GorgonNeume;

    constructor(neume: GorgonNeume) {
        this.neume = neume;
    }
}

export class FthoraElement {
    public offset: ScoreElementOffset = new ScoreElementOffset;
    public neume: Fthora;

    constructor(neume: Fthora) {
        this.neume = neume;
    }
}

export class AccidentalElement {
    public offset: ScoreElementOffset = new ScoreElementOffset;
    public neume: Accidental;

    constructor(neume: Accidental) {
        this.neume = neume;
    }
}

export class VocalExpressionNeumeElement {
    public offset: ScoreElementOffset = new ScoreElementOffset;
    public neume: VocalExpressionNeume;

    constructor(neume: VocalExpressionNeume) {
        this.neume = neume;
    }
}

export class ScoreElementOffset {
    public x: number = 0;
    public y: number = 0;
}