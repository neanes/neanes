import { Score, Staff } from '@/models/Score'
import { 
    DropCapElement,
    ElementType,
    EmptyElement,
    FthoraElement,
    AccidentalElement,
    MartyriaElement, 
    NoteElement, 
    QuantitativeNeumeElement, 
    ScoreElement, 
    ScoreElementOffset,
    StaffTextElement,
    TextBoxElement,
    TimeNeumeElement,
    VocalExpressionNeumeElement,
    ModeKeyElement
} from '@/models/Element';

import { Score as Score_v1, Staff as Staff_v1 } from '@/models/save/v1/Score';
import { 
    DropCapElement as DropCapElement_v1, 
    ElementType as ElementType_v1, 
    EmptyElement as EmptyElement_v1,
    MartyriaElement as MartyriaElement_v1,
    NoteElement as NoteElement_v1, 
    StaffTextElement as StaffTextElement_v1,
    TextBoxElement as TextBoxElement_v1,
    QuantitativeNeumeElement as QuantitativeNeumeElement_v1,
    ScoreElement as ScoreElement_v1, 
    ScoreElementOffset as ScoreElementOffset_v1,
    TimeNeumeElement as TimeNeumeElement_v1,
    GorgonNeumeElement as GorgonNeumeElement_v1,
    VocalExpressionNeumeElement as VocalExpressionNeumeElement_v1,
    ModeKeyElement as ModeKeyElement_v1,
} from '@/models/save/v1/Element';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import { PageSetup } from '@/models/PageSetup';

interface IScore  {
    version: string;
}

export class SaveService {
    public static LoadScoreFromJson(s: IScore) {
        let score: Score = new Score();

        if (s.version == null) {
            console.warn('File is missing file version');
            return score;
        }

        if (s.version.startsWith('1.')) {
            score = this.LoadScore_v1(s as Score_v1);
        }
        else {
            console.warn('Unrecognized file version', s.version);
        }

        return score;
    }

    public static SaveScoreToJson(s: Score) {
        const score = new Score_v1();
        
        score.staff = new Staff_v1();
        score.staff.elements = [];

        score.pageSetup = new PageSetup_v1();
        score.pageSetup.bottomMargin = s.pageSetup.bottomMargin;
        score.pageSetup.dropCapDefaultColor = s.pageSetup.dropCapDefaultColor;
        score.pageSetup.dropCapDefaultFontFamily = s.pageSetup.dropCapDefaultFontFamily;
        score.pageSetup.dropCapDefaultFontSize = s.pageSetup.dropCapDefaultFontSize;
        score.pageSetup.leftMargin = s.pageSetup.leftMargin;
        score.pageSetup.lineHeight = s.pageSetup.lineHeight;
        score.pageSetup.lyricsDefaultFontFamily = s.pageSetup.lyricsDefaultFontFamily;
        score.pageSetup.lyricsDefaultFontSize = s.pageSetup.lyricsDefaultFontSize;
        score.pageSetup.lyricsVerticalOffset = s.pageSetup.lyricsVerticalOffset;
        score.pageSetup.martyriaDefaultColor = s.pageSetup.martyriaDefaultColor;
        score.pageSetup.neumeDefaultFontSize = s.pageSetup.neumeDefaultFontSize;
        score.pageSetup.neumeDefaultSpacing = s.pageSetup.neumeDefaultSpacing;
        score.pageSetup.pageHeight = s.pageSetup.pageHeight;
        score.pageSetup.pageWidth = s.pageSetup.pageWidth;
        score.pageSetup.rightMargin = s.pageSetup.rightMargin;
        score.pageSetup.topMargin = s.pageSetup.topMargin;

        for (let e of s.staff.elements) {
            let element: ScoreElement_v1 = new EmptyElement_v1();

            switch (e.elementType) {
                case ElementType.DropCap:
                    element = new DropCapElement_v1();
                    this.SaveDropCap(element as DropCapElement_v1, e as DropCapElement);
                    break;
                case ElementType.Empty:
                    element = new EmptyElement_v1();
                    break;
                case ElementType.Martyria:
                    element = new MartyriaElement_v1();
                    this.SaveMartyria(element as MartyriaElement_v1, e as MartyriaElement);
                    break;
                case ElementType.Note:
                    element = new NoteElement_v1();
                    this.SaveNote(element as NoteElement_v1, e as NoteElement);
                    break;
                case ElementType.StaffText:
                    element = new StaffTextElement_v1();
                    this.SaveStaffText(element as StaffTextElement_v1, e as StaffTextElement);
                    break;
                case ElementType.TextBox:
                    element = new TextBoxElement_v1();
                    this.SaveTextBox(element as TextBoxElement_v1, e as TextBoxElement);
                    break;
                case ElementType.ModeKey:
                    element = new ModeKeyElement_v1();
                    this.SaveModeKey(element as ModeKeyElement_v1, e as ModeKeyElement);
                    break;
                default:
                    console.warn('Unrecognized element in score', e.elementType);
            }

            element.lineBreak = e.lineBreak;
            element.pageBreak = e.pageBreak;

            score.staff.elements.push(element);
        }

        return score;
    }
    
    public static SaveDropCap(element: DropCapElement_v1, e: DropCapElement) {
        element.color = e.color;
        element.content = e.content;
        element.fontFamily = e.fontFamily;
        element.fontSize = e.fontSize;
    }

    public static SaveMartyria(element: MartyriaElement_v1, e: MartyriaElement) {
        element.apostrophe = e.apostrophe;
        element.note = e.note;
        element.rootSign = e.rootSign;
    }

    public static SaveNote(element: NoteElement_v1, e: NoteElement) {
        element.quantitativeNeume = new QuantitativeNeumeElement_v1(e.quantitativeNeume.neume);
        element.quantitativeNeume.offset = new ScoreElementOffset_v1();
        element.quantitativeNeume.offset.x = e.quantitativeNeume.offset.x;
        element.quantitativeNeume.offset.y = e.quantitativeNeume.offset.y;

        if(e.timeNeume != null) {
            element.timeNeume = new TimeNeumeElement_v1(e.timeNeume.neume);
            element.timeNeume.offset = new ScoreElementOffset_v1();
            element.timeNeume.offset.x = e.timeNeume.offset.x;
            element.timeNeume.offset.y = e.timeNeume.offset.y;
        }

        if(e.gorgonNeume != null) {
            element.gorgonNeume = new GorgonNeumeElement_v1(e.gorgonNeume.neume);
            element.gorgonNeume.offset = new ScoreElementOffset_v1();
            element.gorgonNeume.offset.x = e.gorgonNeume.offset.x;
            element.gorgonNeume.offset.y = e.gorgonNeume.offset.y;
        }

        if(e.fthora != null) {
            element.fthora = new FthoraElement(e.fthora.neume);
            element.fthora.offset = new ScoreElementOffset_v1();
            element.fthora.offset.x = e.fthora.offset.x;
            element.fthora.offset.y = e.fthora.offset.y;
        }

        if(e.accidental != null) {
            element.accidental = new AccidentalElement(e.accidental.neume);
            element.accidental.offset = new ScoreElementOffset_v1();
            element.accidental.offset.x = e.accidental.offset.x;
            element.accidental.offset.y = e.accidental.offset.y;
        }

        if(e.vocalExpressionNeume != null) {
            element.vocalExpressionNeume = new VocalExpressionNeumeElement_v1(e.vocalExpressionNeume.neume);
            element.vocalExpressionNeume.offset = new ScoreElementOffset_v1();
            element.vocalExpressionNeume.offset.x = e.vocalExpressionNeume.offset.x;
            element.vocalExpressionNeume.offset.y = e.vocalExpressionNeume.offset.y;
        }

        element.lyrics = e.lyrics;
        element.isMelisma = e.isMelisma;
        element.isMelismaStart = e.isMelismaStart;
    }

    public static SaveStaffText(element: StaffTextElement_v1, e: StaffTextElement) {
        element.text = e.text;
        element.offset = new ScoreElementOffset_v1();
        element.offset.x = e.offset.x;
        element.offset.y = e.offset.y;
    }

    public static SaveTextBox(element: TextBoxElement_v1, e: TextBoxElement) {
        element.alignment = e.alignment;
        element.color = e.color;
        element.content = e.content;
        element.fontFamily = e.fontFamily;
        element.fontSize = e.fontSize;
        element.height = e.height;
    }

    public static SaveModeKey(element: ModeKeyElement_v1, e: ModeKeyElement) {
        element.alignment = e.alignment;
        element.neumes = e.neumes.map(x => x);
        element.color = e.color;
        element.fontSize = e.fontSize;
        element.height = e.height;
    }

    public static LoadScore_v1(s: Score_v1) {
        const score = new Score();
        
        score.staff = new Staff();
        score.staff.elements = [];

        score.pageSetup = new PageSetup();
        score.pageSetup.bottomMargin = s.pageSetup.bottomMargin;
        score.pageSetup.dropCapDefaultColor = s.pageSetup.dropCapDefaultColor;
        score.pageSetup.dropCapDefaultFontFamily = s.pageSetup.dropCapDefaultFontFamily;
        score.pageSetup.dropCapDefaultFontSize = s.pageSetup.dropCapDefaultFontSize;
        score.pageSetup.leftMargin = s.pageSetup.leftMargin;
        score.pageSetup.lineHeight = s.pageSetup.lineHeight;
        score.pageSetup.lyricsDefaultFontFamily = s.pageSetup.lyricsDefaultFontFamily;
        score.pageSetup.lyricsDefaultFontSize = s.pageSetup.lyricsDefaultFontSize;
        score.pageSetup.lyricsVerticalOffset = s.pageSetup.lyricsVerticalOffset;
        score.pageSetup.martyriaDefaultColor = s.pageSetup.martyriaDefaultColor;
        score.pageSetup.neumeDefaultFontSize = s.pageSetup.neumeDefaultFontSize;
        score.pageSetup.neumeDefaultSpacing = s.pageSetup.neumeDefaultSpacing;
        score.pageSetup.pageHeight = s.pageSetup.pageHeight;
        score.pageSetup.pageWidth = s.pageSetup.pageWidth;
        score.pageSetup.rightMargin = s.pageSetup.rightMargin;
        score.pageSetup.topMargin = s.pageSetup.topMargin;

        for (let e of s.staff.elements) {
            let element: ScoreElement = new EmptyElement();

            switch (e.elementType) {
                case ElementType_v1.DropCap:
                    element = new DropCapElement();
                    this.LoadDropCap_v1(element as DropCapElement, e as DropCapElement_v1);
                    break;
                case ElementType_v1.Empty:
                    element = new EmptyElement();
                    break;
                case ElementType_v1.Martyria:
                    element = new MartyriaElement();
                    this.LoadMartyria_v1(element as MartyriaElement, e as MartyriaElement_v1);
                    break;
                case ElementType_v1.Note:
                    element = new NoteElement();
                    this.LoadNote_v1(element as NoteElement, e as NoteElement_v1);
                    break;
                case ElementType_v1.StaffText:
                    element = new StaffTextElement();
                    this.LoadStaffText_v1(element as StaffTextElement, e as StaffTextElement_v1);
                    break;
                case ElementType_v1.TextBox:
                    element = new TextBoxElement();
                    this.LoadTextBox_v1(element as TextBoxElement, e as TextBoxElement_v1);
                    break;
                case ElementType_v1.ModeKey:
                    element = new ModeKeyElement();
                    this.LoadModeKey_v1(element as ModeKeyElement, e as ModeKeyElement_v1);
                    break;
                default:
                    console.warn('Unrecognized element in score file', 'v1', e.elementType);
            }

            element.lineBreak = e.lineBreak;
            element.pageBreak = e.pageBreak;

            score.staff.elements.push(element);
        }

        return score;
    }

    public static LoadDropCap_v1(element: DropCapElement, e: DropCapElement_v1) {
        element.color = e.color;
        element.content = e.content;
        element.fontFamily = e.fontFamily;
        element.fontSize = e.fontSize;
    }

    public static LoadMartyria_v1(element: MartyriaElement, e: MartyriaElement_v1) {
        element.apostrophe = e.apostrophe;
        element.note = e.note;
        element.rootSign = e.rootSign;
    }

    public static LoadNote_v1(element: NoteElement, e: NoteElement_v1) {
        element.quantitativeNeume = new QuantitativeNeumeElement(e.quantitativeNeume.neume);
        element.quantitativeNeume.offset = new ScoreElementOffset();
        element.quantitativeNeume.offset.x = e.quantitativeNeume.offset.x;
        element.quantitativeNeume.offset.y = e.quantitativeNeume.offset.y;

        if(e.timeNeume != null) {
            element.setTimeNeume(e.timeNeume.neume);
            element.timeNeume!.offset = new ScoreElementOffset();
            element.timeNeume!.offset.x = e.timeNeume.offset.x;
            element.timeNeume!.offset.y = e.timeNeume.offset.y;
        }

        if(e.gorgonNeume != null) {
            element.setGorgonNeume(e.gorgonNeume.neume);
            element.gorgonNeume!.offset = new ScoreElementOffset();
            element.gorgonNeume!.offset.x = e.gorgonNeume.offset.x;
            element.gorgonNeume!.offset.y = e.gorgonNeume.offset.y;
        }

        if(e.fthora != null) {
            element.fthora = new FthoraElement(e.fthora.neume);
            element.fthora.offset = new ScoreElementOffset();
            element.fthora.offset.x = e.fthora.offset.x;
            element.fthora.offset.y = e.fthora.offset.y;
        }

        if(e.accidental != null) {
            element.accidental = new AccidentalElement(e.accidental.neume);
            element.accidental.offset = new ScoreElementOffset();
            element.accidental.offset.x = e.accidental.offset.x;
            element.accidental.offset.y = e.accidental.offset.y;
        }

        if(e.vocalExpressionNeume != null) {
            element.setVocalExpressionNeume(e.vocalExpressionNeume.neume);
            element.vocalExpressionNeume!.offset = new ScoreElementOffset();
            element.vocalExpressionNeume!.offset.x = e.vocalExpressionNeume.offset.x;
            element.vocalExpressionNeume!.offset.y = e.vocalExpressionNeume.offset.y;
        }

        element.lyrics = e.lyrics;
        element.isMelisma = e.isMelisma;
        element.isMelismaStart = e.isMelismaStart;
    }

    public static LoadStaffText_v1(element: StaffTextElement, e: StaffTextElement_v1) {
        element.text = e.text;
        element.offset = new ScoreElementOffset();
        element.offset.x = e.offset.x;
        element.offset.y = e.offset.y;
    }

    public static LoadTextBox_v1(element: TextBoxElement, e: TextBoxElement_v1) {
        element.alignment = e.alignment;
        element.color = e.color;
        element.content = e.content;
        element.fontFamily = e.fontFamily;
        element.fontSize = e.fontSize;
        element.height = e.height;
    }

    public static LoadModeKey_v1(element: ModeKeyElement, e: ModeKeyElement_v1) {
        element.alignment = e.alignment;
        element.neumes = e.neumes.map(x => x);
        element.color = e.color;
        element.fontSize = e.fontSize;
        element.height = e.height;
    }
}