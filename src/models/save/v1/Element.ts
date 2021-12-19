import { TimeNeume, GorgonNeume, QuantitativeNeume, Note, RootSign, VocalExpressionNeume, Fthora, Accidental, ModeSign } from '@/models/save/v1/Neumes';
import { Scale, ScaleNote } from './Scales';

export enum ElementType {
    Note = 'Note',
    Martyria = 'Martyria',
    Empty = 'Empty',
    TextBox = 'TextBox',
    StaffText = 'StaffText',
    DropCap = 'DropCap',
    ModeKey = 'ModeKey',
}

export abstract class ScoreElement {
    abstract elementType: ElementType;
    public lineBreak: boolean = false;
    public pageBreak: boolean = false;
}

export class NoteElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.Note; 
    public quantitativeNeume: QuantitativeNeume = QuantitativeNeume.Ison; 
    public timeNeume: TimeNeume | null = null;
    public gorgonNeume: GorgonNeume | null = null;
    public vocalExpressionNeume: VocalExpressionNeume | null = null;
    public fthora: Fthora | null = null;
    public accidental: Accidental | null = null;
    public lyrics: string = '';
    public isMelisma: boolean = false;
    public isMelismaStart: boolean = false;
}

export class MartyriaElement extends ScoreElement  {  
    public readonly elementType: ElementType = ElementType.Martyria; 
    public auto: boolean = true;
    public note: Note = Note.Pa;
    public rootSign: RootSign = RootSign.Alpha;
    public apostrophe: boolean = false;
    public fthora: Fthora | null = null;
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

export class ModeKeyElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.ModeKey;
    public alignment: TextBoxAlignment = TextBoxAlignment.Center;
    public mode: number = 1;
    public scale: Scale = Scale.Diatonic;
    public scaleNote: ScaleNote = ScaleNote.Pa;
    public martyrias: ModeSign[] = []  
    public note: ModeSign | null = null;
    public fthora: Fthora | null = null;
    public quantativeNeume: ModeSign | null = null;
    public color: string = 'black';
    public fontSize: number = 16;
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

export class ScoreElementOffset {
    public x: number = 0;
    public y: number = 0;
}