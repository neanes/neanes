import { TimeNeume, QuantitativeNeume, Note, RootSign, VocalExpressionNeume, Fthora } from '@/models/Neumes';
import { isRightNeume } from '@/models/Neumes';

export enum ElementType {
    Note = 'Note',
    Martyria = 'Martyria',
    Empty = 'Empty',
    TextBox = 'TextBox',
    StaffText = 'StaffText',
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
    public vocalExpressionNeume: VocalExpressionNeumeElement | null = null;
    public fthora: FthoraElement | null = null;
    public lyrics: string = '';

    public setTimeNeume(neume: TimeNeume | null) {
        if (isRightNeume(this.quantitativeNeume.neume)) {
            // Correct hapli, dipli,and tripli 
            if (neume === TimeNeume.Hapli) {
                neume = TimeNeume.Hapli_Right;
            }

            else if (neume === TimeNeume.Dipli) {
                neume = TimeNeume.Dipli_Right;
            }

            else if (neume === TimeNeume.Tripli) {
                neume = TimeNeume.Tripli_Right;
            }

            // Correct gorgons
            else if (neume === TimeNeume.Gorgon_Top) {
                neume = TimeNeume.Gorgon_TopRight;
            }

            else if (neume === TimeNeume.Gorgon_Bottom) {
                neume = TimeNeume.Gorgon_BottomRight;
            }

            else if (neume === TimeNeume.GorgonDottedLeft) {
                neume = TimeNeume.GorgonDottedLeft_Right;
            }

            else if (neume === TimeNeume.GorgonDottedRight) {
                neume = TimeNeume.GorgonDottedRight_Right;
            }

            else if (neume === TimeNeume.Digorgon) {
                neume = TimeNeume.Digorgon_Right;
            }

            else if (neume === TimeNeume.Trigorgon) {
                neume = TimeNeume.Trigorgon_Right;
            }

            // Correct klasmas
            else if (neume === TimeNeume.Klasma_Top) {
                neume = TimeNeume.Klasma_TopRight;
            }
        }

        this.timeNeume = neume != null ? new TimeNeumeElement(neume) : null;
    }

    public setVocalExpressionNeume(neume: VocalExpressionNeume | null) {
        // Correct antikenoma
        if (neume === VocalExpressionNeume.Antikenoma) {
            if (this.quantitativeNeume.neume === QuantitativeNeume.Apostrophos) {
                neume = VocalExpressionNeume.AntikenomaShort;
            }
        }

        this.vocalExpressionNeume = neume != null ? new VocalExpressionNeumeElement(neume) : null;
    }
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

export class TextBoxElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.TextBox;
    public content: string = '';
    public height: number = 20;
}

export class StaffTextElement extends ScoreElement {
    public readonly elementType: ElementType = ElementType.StaffText;
    public offset: ScoreElementOffset = new ScoreElementOffset;
    public text: string = 'text';
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

export class FthoraElement {
    public offset: ScoreElementOffset = new ScoreElementOffset;
    public neume: Fthora;

    constructor(neume: Fthora) {
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