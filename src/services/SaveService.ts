import { Score, Staff } from '@/models/Score';
import {
  DropCapElement,
  ElementType,
  EmptyElement,
  MartyriaElement,
  NoteElement,
  ScoreElement,
  ScoreElementOffset,
  StaffTextElement,
  TextBoxElement,
  ModeKeyElement,
  TempoElement,
} from '@/models/Element';

import { Score as Score_v1, Staff as Staff_v1 } from '@/models/save/v1/Score';
import {
  DropCapElement as DropCapElement_v1,
  ElementType as ElementType_v1,
  EmptyElement as EmptyElement_v1,
  MartyriaElement as MartyriaElement_v1,
  TempoElement as TempoElement_v1,
  NoteElement as NoteElement_v1,
  StaffTextElement as StaffTextElement_v1,
  TextBoxElement as TextBoxElement_v1,
  ScoreElement as ScoreElement_v1,
  ScoreElementOffset as ScoreElementOffset_v1,
  ModeKeyElement as ModeKeyElement_v1,
} from '@/models/save/v1/Element';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import { PageSetup } from '@/models/PageSetup';

interface IScore {
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
    } else {
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
    score.pageSetup.dropCapDefaultFontFamily =
      s.pageSetup.dropCapDefaultFontFamily;
    score.pageSetup.dropCapDefaultFontSize = s.pageSetup.dropCapDefaultFontSize;
    score.pageSetup.leftMargin = s.pageSetup.leftMargin;
    score.pageSetup.lineHeight = s.pageSetup.lineHeight;
    score.pageSetup.lyricsDefaultFontFamily =
      s.pageSetup.lyricsDefaultFontFamily;
    score.pageSetup.lyricsDefaultFontSize = s.pageSetup.lyricsDefaultFontSize;
    score.pageSetup.lyricsVerticalOffset = s.pageSetup.lyricsVerticalOffset;
    score.pageSetup.martyriaDefaultColor = s.pageSetup.martyriaDefaultColor;
    score.pageSetup.tempoDefaultColor = s.pageSetup.tempoDefaultColor;
    score.pageSetup.modeKeyDefaultColor = s.pageSetup.modeKeyDefaultColor;
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
          this.SaveMartyria(
            element as MartyriaElement_v1,
            e as MartyriaElement,
          );
          break;
        case ElementType.Tempo:
          element = new TempoElement_v1();
          this.SaveTempo(element as TempoElement_v1, e as TempoElement);
          break;
        case ElementType.Note:
          element = new NoteElement_v1();
          this.SaveNote(element as NoteElement_v1, e as NoteElement);
          break;
        case ElementType.StaffText:
          element = new StaffTextElement_v1();
          this.SaveStaffText(
            element as StaffTextElement_v1,
            e as StaffTextElement,
          );
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

      element.lineBreak = e.lineBreak || undefined;
      element.pageBreak = e.pageBreak || undefined;

      score.staff.elements.push(element);
    }

    return score;
  }

  public static SaveDropCap(element: DropCapElement_v1, e: DropCapElement) {
    element.color = e.color || undefined;
    element.content = e.content;
    element.fontFamily = e.fontFamily || undefined;
    element.fontSize = e.fontSize || undefined;
  }

  public static SaveMartyria(element: MartyriaElement_v1, e: MartyriaElement) {
    element.apostrophe = e.apostrophe || undefined;
    element.auto = e.auto || undefined;
    element.note = e.note;
    element.rootSign = e.rootSign;
    element.fthora = e.fthora || undefined;
    element.measureBar = e.measureBar || undefined;
  }

  public static SaveTempo(element: TempoElement_v1, e: TempoElement) {
    element.neume = e.neume;
  }

  public static SaveNote(element: NoteElement_v1, e: NoteElement) {
    element.quantitativeNeume = e.quantitativeNeume;

    if (e.timeNeume != null) {
      element.timeNeume = e.timeNeume;
    }

    if (e.gorgonNeume != null) {
      element.gorgonNeume = e.gorgonNeume;
    }

    if (e.fthora != null) {
      element.fthora = e.fthora;
    }

    if (e.accidental != null) {
      element.accidental = e.accidental;
    }

    if (e.vocalExpressionNeume != null) {
      element.vocalExpressionNeume = e.vocalExpressionNeume;
    }

    if (e.measureBar != null) {
      element.measureBar = e.measureBar;
    }

    element.lyrics = e.lyrics !== '' ? e.lyrics : undefined;
    element.isMelisma = e.isMelisma || undefined;
    element.isMelismaStart = e.isMelismaStart || undefined;
  }

  public static SaveStaffText(
    element: StaffTextElement_v1,
    e: StaffTextElement,
  ) {
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
    element.mode = e.mode;
    element.scale = e.scale;
    element.scaleNote = e.scaleNote;
    element.note = e.note || undefined;
    element.note2 = e.note2 || undefined;
    element.fthora = e.fthora || undefined;
    element.fthora2 = e.fthora2 || undefined;
    element.quantitativeNeumeTop = e.quantitativeNeumeTop || undefined;
    element.quantitativeNeumeRight = e.quantitativeNeumeRight || undefined;
    element.martyrias = e.martyrias.map((x) => x);
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
    score.pageSetup.dropCapDefaultFontFamily =
      s.pageSetup.dropCapDefaultFontFamily;
    score.pageSetup.dropCapDefaultFontSize = s.pageSetup.dropCapDefaultFontSize;
    score.pageSetup.leftMargin = s.pageSetup.leftMargin;
    score.pageSetup.lineHeight = s.pageSetup.lineHeight;
    score.pageSetup.lyricsDefaultFontFamily =
      s.pageSetup.lyricsDefaultFontFamily;
    score.pageSetup.lyricsDefaultFontSize = s.pageSetup.lyricsDefaultFontSize;
    score.pageSetup.lyricsVerticalOffset = s.pageSetup.lyricsVerticalOffset;
    score.pageSetup.martyriaDefaultColor = s.pageSetup.martyriaDefaultColor;
    score.pageSetup.tempoDefaultColor = s.pageSetup.tempoDefaultColor;
    score.pageSetup.modeKeyDefaultColor = s.pageSetup.modeKeyDefaultColor;
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
          this.LoadDropCap_v1(
            element as DropCapElement,
            e as DropCapElement_v1,
          );
          break;
        case ElementType_v1.Empty:
          element = new EmptyElement();
          break;
        case ElementType_v1.Martyria:
          element = new MartyriaElement();
          this.LoadMartyria_v1(
            element as MartyriaElement,
            e as MartyriaElement_v1,
          );
          break;
        case ElementType_v1.Tempo:
          element = new TempoElement();
          this.LoadTempo_v1(element as TempoElement, e as TempoElement_v1);
          break;
        case ElementType_v1.Note:
          element = new NoteElement();
          this.LoadNote_v1(element as NoteElement, e as NoteElement_v1);
          break;
        case ElementType_v1.StaffText:
          element = new StaffTextElement();
          this.LoadStaffText_v1(
            element as StaffTextElement,
            e as StaffTextElement_v1,
          );
          break;
        case ElementType_v1.TextBox:
          element = new TextBoxElement();
          this.LoadTextBox_v1(
            element as TextBoxElement,
            e as TextBoxElement_v1,
          );
          break;
        case ElementType_v1.ModeKey:
          element = new ModeKeyElement();
          this.LoadModeKey_v1(
            element as ModeKeyElement,
            e as ModeKeyElement_v1,
          );
          break;
        default:
          console.warn(
            'Unrecognized element in score file',
            'v1',
            e.elementType,
          );
      }

      element.lineBreak = e.lineBreak === true;
      element.pageBreak = e.pageBreak === true;

      score.staff.elements.push(element);
    }

    return score;
  }

  public static LoadDropCap_v1(element: DropCapElement, e: DropCapElement_v1) {
    element.color = e.color || null;
    element.content = e.content;
    element.fontFamily = e.fontFamily || null;
    element.fontSize = e.fontSize || null;
  }

  public static LoadMartyria_v1(
    element: MartyriaElement,
    e: MartyriaElement_v1,
  ) {
    element.apostrophe = e.apostrophe === true;
    element.auto = e.auto === true;
    element.note = e.note;
    element.rootSign = e.rootSign;

    if (e.fthora != null) {
      element.fthora = e.fthora;
    }

    if (e.measureBar != null) {
      element.measureBar = e.measureBar;
    }
  }

  public static LoadTempo_v1(element: TempoElement, e: TempoElement_v1) {
    element.neume = e.neume;
  }

  public static LoadNote_v1(element: NoteElement, e: NoteElement_v1) {
    element.quantitativeNeume = e.quantitativeNeume;

    if (e.timeNeume != null) {
      element.timeNeume = e.timeNeume;
    }

    if (e.gorgonNeume != null) {
      element.gorgonNeume = e.gorgonNeume;
    }

    if (e.fthora != null) {
      element.fthora = e.fthora;
    }

    if (e.accidental != null) {
      element.accidental = e.accidental;
    }

    if (e.vocalExpressionNeume != null) {
      element.vocalExpressionNeume = e.vocalExpressionNeume;
    }

    if (e.measureBar != null) {
      element.measureBar = e.measureBar;
    }

    if (e.lyrics != null) {
      element.lyrics = e.lyrics;
    }

    element.isMelisma = e.isMelisma === true;
    element.isMelismaStart = e.isMelismaStart === true;
  }

  public static LoadStaffText_v1(
    element: StaffTextElement,
    e: StaffTextElement_v1,
  ) {
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
    element.mode = e.mode;
    element.scale = e.scale;
    element.scaleNote = e.scaleNote;
    element.note = e.note || null;
    element.note2 = e.note2 || null;
    element.fthora = e.fthora || null;
    element.fthora2 = e.fthora2 || null;
    element.quantitativeNeumeTop = e.quantitativeNeumeTop || null;
    element.quantitativeNeumeRight = e.quantitativeNeumeRight || null;
    element.martyrias = e.martyrias.map((x) => x);
    element.color = e.color;
    element.fontSize = e.fontSize;
  }
}
