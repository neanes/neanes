import { TimeNeume, QuantitativeNeume, Note, RootSign, VocalExpressionNeume, Fthora, Accidental, GorgonNeume, TempoSign, Neume, ModeSign } from '@/models/Neumes';
import { getGorgonReplacements } from './NeumeReplacements';

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
    public quantitativeNeume: QuantitativeNeumeElement = new QuantitativeNeumeElement(QuantitativeNeume.Ison);
    public timeNeume: TimeNeumeElement | null = null;
    public gorgonNeume: GorgonNeumeElement | null = null;
    public vocalExpressionNeume: VocalExpressionNeumeElement | null = null;
    public fthora: FthoraElement | null = null;
    public accidental: AccidentalElement | null = null;
    public lyrics: string = '';
    public isMelisma: boolean = false;
    public isMelismaStart: boolean = false;
    
    // Used for display
    public melismaText: string = '';
    public melismaOffsetLeft: number | null = null;
    public neumeWidth: number = 0;
    public lyricsWidth: number = 0;

    public setQuantitativeNeume(neume: QuantitativeNeume) {
        this.quantitativeNeume =new QuantitativeNeumeElement(neume);
        this.replaceNeumes();
    }

    public setTimeNeume(neume: TimeNeume | null) {
        // if (isRightNeume(this.quantitativeNeume.neume)) {
        //     // Correct hapli, dipli,and tripli 
        //     if (neume === TimeNeume.Hapli) {
        //         neume = TimeNeume.Hapli_Right;
        //     }

        //     else if (neume === TimeNeume.Dipli) {
        //         neume = TimeNeume.Dipli_Right;
        //     }

        //     else if (neume === TimeNeume.Tripli) {
        //         neume = TimeNeume.Tripli_Right;
        //     }

        //     // Correct klasmas
        //     else if (neume === TimeNeume.Klasma_Top) {
        //         neume = TimeNeume.Klasma_TopRight;
        //     }
        // }

        this.timeNeume = neume != null ? new TimeNeumeElement(neume) : null;
        this.replaceNeumes();
    }

    public setGorgonNeume(neume: GorgonNeume | null) {        
        this.gorgonNeume = neume != null ? new GorgonNeumeElement(neume) : null;
        this.replaceNeumes();
    }

    public setVocalExpressionNeume(neume: VocalExpressionNeume | null) {
        // Correct antikenoma
        if (neume === VocalExpressionNeume.Antikenoma) {
            if (this.quantitativeNeume.neume === QuantitativeNeume.Apostrophos) {
                neume = VocalExpressionNeume.AntikenomaShort;
            }
        }

        this.vocalExpressionNeume = neume != null ? new VocalExpressionNeumeElement(neume) : null;
        this.replaceNeumes();
    }

    public setAccidental(neume: Accidental | null) {
        this.accidental = neume != null ? new AccidentalElement(neume) : null;
        this.replaceNeumes();
    }

    public setFthora(neume: Fthora | null) {
        this.fthora = neume != null ? new FthoraElement(neume) : null;
        this.replaceNeumes();
    }

    private replaceNeumes() {
        this.replaceGorgons();
    }

    private replaceGorgons() {
        if (this.gorgonNeume) {
            const replacements = getGorgonReplacements(this.gorgonNeume!.neume);

            if (replacements) {
              const replacement = replacements.find(x => x.isPairedWith && x.isPairedWith.includes(this.quantitativeNeume.neume)) ||
                replacements.find(x => x.isNotPairedWith && !x.isNotPairedWith.includes(this.quantitativeNeume.neume));
              
                if (replacement) {
                this.setGorgonNeume(replacement.replaceWith);
              }
            }
        }        
    }
}

export class MartyriaElement extends ScoreElement {
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

export class ModeKeyElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.ModeKey;
    public alignment: TextBoxAlignment = TextBoxAlignment.Center;
    public mode: number = 1;
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