import { Score, Staff } from '@/models/Score';
import {
  DropCapElement,
  ElementType,
  EmptyElement,
  MartyriaElement,
  NoteElement,
  ScoreElement,
  ScoreElementOffset,
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
  TextBoxElement as TextBoxElement_v1,
  ScoreElement as ScoreElement_v1,
  ScoreElementOffset as ScoreElementOffset_v1,
  ModeKeyElement as ModeKeyElement_v1,
} from '@/models/save/v1/Element';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import { PageSetup } from '@/models/PageSetup';
import { QuantitativeNeume } from '@/models/Neumes';

interface IScore {
  version: string;
}

export class SaveService {
  public static LoadScoreFromJson(s: IScore) {
    let score: Score = new Score();

    if (s.version == null || typeof s.version !== 'string') {
      throw new Error('File is missing file version.');
    }

    if (s.version.startsWith('1.')) {
      score = this.LoadScore_v1(s as Score_v1);
    } else {
      throw new Error(`Unrecognized file version: ${s.version}`);
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
    score.pageSetup.lyricsDefaultColor = s.pageSetup.lyricsDefaultColor;
    score.pageSetup.lyricsDefaultFontFamily =
      s.pageSetup.lyricsDefaultFontFamily;
    score.pageSetup.lyricsDefaultFontSize = s.pageSetup.lyricsDefaultFontSize;
    score.pageSetup.lyricsVerticalOffset = s.pageSetup.lyricsVerticalOffset;
    score.pageSetup.martyriaDefaultColor = s.pageSetup.martyriaDefaultColor;
    score.pageSetup.tempoDefaultColor = s.pageSetup.tempoDefaultColor;
    score.pageSetup.modeKeyDefaultColor = s.pageSetup.modeKeyDefaultColor;
    score.pageSetup.neumeDefaultColor = s.pageSetup.neumeDefaultColor;
    score.pageSetup.neumeDefaultFontFamily = s.pageSetup.neumeDefaultFontFamily;
    score.pageSetup.neumeDefaultFontSize = s.pageSetup.neumeDefaultFontSize;
    score.pageSetup.neumeDefaultSpacing = s.pageSetup.neumeDefaultSpacing;
    score.pageSetup.pageHeight = s.pageSetup.pageHeight;
    score.pageSetup.pageWidth = s.pageSetup.pageWidth;
    score.pageSetup.rightMargin = s.pageSetup.rightMargin;
    score.pageSetup.topMargin = s.pageSetup.topMargin;

    score.pageSetup.accidentalDefaultColor = s.pageSetup.accidentalDefaultColor;
    score.pageSetup.fthoraDefaultColor = s.pageSetup.fthoraDefaultColor;
    score.pageSetup.heteronDefaultColor = s.pageSetup.heteronDefaultColor;
    score.pageSetup.gorgonDefaultColor = s.pageSetup.gorgonDefaultColor;
    score.pageSetup.measureBarDefaultColor = s.pageSetup.measureBarDefaultColor;
    score.pageSetup.measureNumberDefaultColor =
      s.pageSetup.measureNumberDefaultColor;
    score.pageSetup.noteIndicatorDefaultColor =
      s.pageSetup.noteIndicatorDefaultColor;
    score.pageSetup.isonDefaultColor = s.pageSetup.isonDefaultColor;

    score.pageSetup.pageSize = s.pageSetup.pageSize;
    score.pageSetup.pageSizeUnit = s.pageSetup.pageSizeUnit;
    score.pageSetup.landscape = s.pageSetup.landscape || undefined;

    score.pageSetup.hyphenSpacing = s.pageSetup.hyphenSpacing;

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
    element.alignRight = e.alignRight || undefined;
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

    if (e.secondaryGorgonNeume != null) {
      element.secondaryGorgonNeume = e.secondaryGorgonNeume;
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

    if (e.measureNumber != null) {
      element.measureNumber = e.measureNumber;
    }

    if (e.noteIndicator != null) {
      element.noteIndicator = e.noteIndicator;
    }

    if (e.ison != null) {
      element.ison = e.ison;
    }

    element.vareia = e.vareia || undefined;

    element.lyrics = e.lyrics !== '' ? e.lyrics : undefined;
    element.isMelisma = e.isMelisma || undefined;
    element.isMelismaStart = e.isMelismaStart || undefined;
    element.isHyphen = e.isHyphen || undefined;
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
    element.templateId = e.templateId || undefined;
    element.alignment = e.alignment;
    element.mode = e.mode;
    element.scale = e.scale;
    element.scaleNote = e.scaleNote;
    element.note = e.note || undefined;
    element.note2 = e.note2 || undefined;
    element.fthoraAboveNote = e.fthoraAboveNote || undefined;
    element.fthoraAboveNote2 = e.fthoraAboveNote2 || undefined;
    element.fthoraAboveQuantitativeNeumeRight =
      e.fthoraAboveQuantitativeNeumeRight || undefined;
    element.quantitativeNeumeAboveNote =
      e.quantitativeNeumeAboveNote || undefined;
    element.quantitativeNeumeAboveNote2 =
      e.quantitativeNeumeAboveNote2 || undefined;
    element.quantitativeNeumeRight = e.quantitativeNeumeRight || undefined;
    element.martyria = e.martyria;
    element.color = e.color;
    element.fontSize = e.fontSize;
    element.height = e.height;
  }

  public static LoadScore_v1(s: Score_v1) {
    const score = new Score();

    score.staff = new Staff();
    score.staff.elements = [];

    score.pageSetup = new PageSetup();

    this.LoadPageSetup_v1(score.pageSetup, s.pageSetup);

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

  public static LoadPageSetup_v1(pageSetup: PageSetup, p: PageSetup_v1) {
    pageSetup.pageHeight = p.pageHeight;
    pageSetup.pageWidth = p.pageWidth;
    pageSetup.topMargin = p.topMargin;
    pageSetup.bottomMargin = p.bottomMargin;
    pageSetup.leftMargin = p.leftMargin;
    pageSetup.rightMargin = p.rightMargin;

    pageSetup.lineHeight = p.lineHeight;

    pageSetup.dropCapDefaultColor =
      p.dropCapDefaultColor || pageSetup.dropCapDefaultColor;
    pageSetup.dropCapDefaultFontFamily = p.dropCapDefaultFontFamily;
    pageSetup.dropCapDefaultFontSize = p.dropCapDefaultFontSize;

    pageSetup.lyricsDefaultColor =
      p.lyricsDefaultColor || pageSetup.lyricsDefaultColor;
    pageSetup.lyricsDefaultFontFamily = p.lyricsDefaultFontFamily;
    pageSetup.lyricsDefaultFontSize = p.lyricsDefaultFontSize;
    pageSetup.lyricsVerticalOffset = p.lyricsVerticalOffset;

    pageSetup.martyriaDefaultColor =
      p.martyriaDefaultColor || pageSetup.martyriaDefaultColor;
    pageSetup.tempoDefaultColor =
      p.tempoDefaultColor || pageSetup.tempoDefaultColor;
    pageSetup.modeKeyDefaultColor =
      p.modeKeyDefaultColor || pageSetup.modeKeyDefaultColor;
    pageSetup.neumeDefaultColor =
      p.neumeDefaultColor || pageSetup.neumeDefaultColor;

    pageSetup.neumeDefaultFontFamily =
      p.neumeDefaultFontFamily || pageSetup.neumeDefaultFontFamily;
    pageSetup.neumeDefaultFontSize = p.neumeDefaultFontSize;
    pageSetup.neumeDefaultSpacing = p.neumeDefaultSpacing;

    pageSetup.accidentalDefaultColor =
      p.accidentalDefaultColor || pageSetup.accidentalDefaultColor;
    pageSetup.fthoraDefaultColor =
      p.fthoraDefaultColor || pageSetup.fthoraDefaultColor;
    pageSetup.heteronDefaultColor =
      p.heteronDefaultColor || pageSetup.heteronDefaultColor;
    pageSetup.gorgonDefaultColor =
      p.gorgonDefaultColor || pageSetup.gorgonDefaultColor;
    pageSetup.measureBarDefaultColor =
      p.measureBarDefaultColor || pageSetup.measureBarDefaultColor;
    pageSetup.measureNumberDefaultColor =
      p.measureNumberDefaultColor || pageSetup.measureNumberDefaultColor;
    pageSetup.noteIndicatorDefaultColor =
      p.noteIndicatorDefaultColor || pageSetup.noteIndicatorDefaultColor;
    pageSetup.isonDefaultColor =
      p.isonDefaultColor || pageSetup.isonDefaultColor;

    pageSetup.pageSize = p.pageSize || pageSetup.pageSize;
    pageSetup.pageSizeUnit = p.pageSizeUnit || pageSetup.pageSizeUnit;
    pageSetup.landscape = p.landscape === true;

    pageSetup.hyphenSpacing = p.hyphenSpacing;
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
    element.alignRight = e.alignRight === true;
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
    element.quantitativeNeume = Object.values(QuantitativeNeume).includes(
      e.quantitativeNeume,
    )
      ? e.quantitativeNeume
      : QuantitativeNeume.Ison;

    if (e.timeNeume != null) {
      element.timeNeume = e.timeNeume;
    }

    if (e.gorgonNeume != null) {
      element.gorgonNeume = e.gorgonNeume;
    }

    if (e.secondaryGorgonNeume != null) {
      element.secondaryGorgonNeume = e.secondaryGorgonNeume;
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

    if (e.measureNumber != null) {
      element.measureNumber = e.measureNumber;
    }

    if (e.noteIndicator != null) {
      element.noteIndicator = e.noteIndicator;
    }

    if (e.ison != null) {
      element.ison = e.ison;
    }

    if (e.lyrics != null) {
      element.lyrics = e.lyrics;
    }

    element.vareia = e.vareia === true;

    element.isMelisma = e.isMelisma === true;
    element.isMelismaStart = e.isMelismaStart === true;
    element.isHyphen = e.isHyphen === true;
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
    element.templateId = e.templateId || null;
    element.alignment = e.alignment;
    element.mode = e.mode;
    element.scale = e.scale;
    element.scaleNote = e.scaleNote;
    element.note = e.note || null;
    element.note2 = e.note2 || null;
    element.fthoraAboveNote = e.fthoraAboveNote || null;
    element.fthoraAboveNote2 = e.fthoraAboveNote2 || null;
    element.fthoraAboveQuantitativeNeumeRight =
      e.fthoraAboveQuantitativeNeumeRight || null;
    element.quantitativeNeumeAboveNote = e.quantitativeNeumeAboveNote || null;
    element.quantitativeNeumeAboveNote2 = e.quantitativeNeumeAboveNote2 || null;
    element.quantitativeNeumeRight = e.quantitativeNeumeRight || null;
    element.martyria = e.martyria;
    element.color = e.color;
    element.fontSize = e.fontSize;
  }
}
