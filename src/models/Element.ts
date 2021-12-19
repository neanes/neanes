import { TimeNeume, QuantitativeNeume, Note, RootSign, VocalExpressionNeume, Fthora, Accidental, GorgonNeume, TempoSign, Neume, ModeSign, MeasureBar } from '@/models/Neumes';
import { getGorgonReplacements, getTimeReplacements, getVocalExpressionReplacements } from './NeumeReplacements';
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

    public x: number = 0;
    public y: number = 0;
    public width: number = 0;
}

export class NoteElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.Note;
    public quantitativeNeume: QuantitativeNeume = QuantitativeNeume.Ison;
    public timeNeume: TimeNeume | null = null;
    public gorgonNeume: GorgonNeume | null = null;
    public vocalExpressionNeume: VocalExpressionNeume | null = null;
    public fthora: Fthora | null = null;
    public accidental: Accidental | null = null;
    public measureBar: MeasureBar | null = null;
    public lyrics: string = '';
    public isMelisma: boolean = false;
    public isMelismaStart: boolean = false;
    
    // Used for display
    public melismaText: string = '';
    public melismaOffsetLeft: number | null = null;
    public neumeWidth: number = 0;
    public lyricsWidth: number = 0;

    public setQuantitativeNeume(neume: QuantitativeNeume) {
        this.quantitativeNeume = neume;
        this.replaceNeumes();
    }

    public setTimeNeume(neume: TimeNeume | null) {
        this.timeNeume = neume;
        this.replaceNeumes();
    }

    public setGorgonNeume(neume: GorgonNeume | null) {        
        this.gorgonNeume = neume;
        this.replaceNeumes();
    }

    public setVocalExpressionNeume(neume: VocalExpressionNeume | null) {
        this.vocalExpressionNeume = neume;
        this.replaceNeumes();
    }

    public setAccidental(neume: Accidental | null) {
        this.accidental = neume;
        this.replaceNeumes();
    }

    public setFthora(neume: Fthora | null) {
        this.fthora = neume;
        this.replaceNeumes();
    }

    private replaceNeumes() {
        this.replaceGorgons();
        this.replaceTimeNeumes();
        this.replaceVocalExpressions();
    }

    private replaceGorgons() {
        if (this.gorgonNeume) {
            const replacements = getGorgonReplacements(this.gorgonNeume);

            if (replacements) {
              const replacement = replacements.find(x => x.isPairedWith && x.isPairedWith.includes(this.quantitativeNeume)) ||
                replacements.find(x => x.isNotPairedWith && !x.isNotPairedWith.includes(this.quantitativeNeume));
              
                if (replacement) {
                this.setGorgonNeume(replacement.replaceWith);
              }
            }
        }        
    }

    private replaceTimeNeumes() {
        if (this.timeNeume) {
            const replacements = getTimeReplacements(this.timeNeume);

            if (replacements) {
              const replacement = replacements.find(x => x.isPairedWith && x.isPairedWith.includes(this.quantitativeNeume)) ||
                replacements.find(x => x.isNotPairedWith && !x.isNotPairedWith.includes(this.quantitativeNeume));
              
                if (replacement) {
                this.setTimeNeume(replacement.replaceWith);
              }
            }
        }        
    }

    private replaceVocalExpressions() {
        if (this.vocalExpressionNeume) {
            const replacements = getVocalExpressionReplacements(this.vocalExpressionNeume);

            if (replacements) {
              const replacement = replacements.find(x => x.isPairedWith && x.isPairedWith.includes(this.quantitativeNeume)) ||
                replacements.find(x => x.isNotPairedWith && !x.isNotPairedWith.includes(this.quantitativeNeume));
              
                if (replacement) {
                    this.setVocalExpressionNeume(replacement.replaceWith);
              }
            }
        }        
    }
}

export class MartyriaElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.Martyria;
    public auto: boolean = true;
    public note: Note = Note.Pa;
    public rootSign: RootSign = RootSign.Alpha;
    public apostrophe: boolean = false;
    public fthora: Fthora | null = null;
    public measureBar: MeasureBar | null = null;
    
    public error: boolean = false;
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

    public get isPlagal() {
        return this.mode > 4 && this.mode !== 7;
    }

    public get isVarys() {
        return this.mode === 7;
    }
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