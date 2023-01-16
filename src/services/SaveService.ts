import { Score } from '@/models/Score';
import { Staff } from '@/models/Staff';
import {
  DropCapElement,
  ElementType,
  EmptyElement,
  MartyriaElement,
  NoteElement,
  ScoreElement,
  TextBoxElement,
  ModeKeyElement,
  TempoElement,
  LineBreakType,
} from '@/models/Element';

import { Score as Score_v1, Staff as Staff_v1 } from '@/models/save/v1/Score';
import { Header as Header_v1 } from '@/models/save/v1/Header';
import { Footer as Footer_v1 } from '@/models/save/v1/Footer';
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
import { Header } from '@/models/Header';
import { Footer } from '@/models/Footer';
import { modeKeyTemplates } from '@/models/ModeKeys';

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

    this.SavePageSetup(score.pageSetup, s.pageSetup);

    this.SaveHeader(score.headers.default, s.headers.default);
    this.SaveHeader(score.headers.even, s.headers.even);
    this.SaveHeader(score.headers.odd, s.headers.odd);
    this.SaveHeader(score.headers.firstPage, s.headers.firstPage);

    this.SaveFooter(score.footers.default, s.footers.default);
    this.SaveFooter(score.footers.even, s.footers.even);
    this.SaveFooter(score.footers.odd, s.footers.odd);
    this.SaveFooter(score.footers.firstPage, s.footers.firstPage);

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

      if (e.lineBreak) {
        element.lineBreakType = e.lineBreakType || undefined;
      }

      element.pageBreak = e.pageBreak || undefined;

      score.staff.elements.push(element);
    }

    return score;
  }

  public static SavePageSetup(pageSetup: PageSetup_v1, p: PageSetup) {
    pageSetup.bottomMargin = p.bottomMargin;
    pageSetup.dropCapDefaultColor = p.dropCapDefaultColor;
    pageSetup.dropCapDefaultFontFamily = p.dropCapDefaultFontFamily;
    pageSetup.dropCapDefaultFontSize = p.dropCapDefaultFontSize;
    pageSetup.dropCapDefaultFontWeight = p.dropCapDefaultFontWeight;
    pageSetup.dropCapDefaultFontStyle = p.dropCapDefaultFontStyle;
    pageSetup.dropCapDefaultStrokeWidth = p.dropCapDefaultStrokeWidth;
    pageSetup.leftMargin = p.leftMargin;
    pageSetup.lineHeight = p.lineHeight;
    pageSetup.lyricsDefaultColor = p.lyricsDefaultColor;
    pageSetup.lyricsDefaultFontFamily = p.lyricsDefaultFontFamily;
    pageSetup.lyricsDefaultFontSize = p.lyricsDefaultFontSize;
    pageSetup.lyricsDefaultFontWeight = p.lyricsDefaultFontWeight;
    pageSetup.lyricsDefaultFontStyle = p.lyricsDefaultFontStyle;
    pageSetup.lyricsDefaultStrokeWidth = p.lyricsDefaultStrokeWidth;
    pageSetup.lyricsVerticalOffset = p.lyricsVerticalOffset;
    pageSetup.lyricsMinimumSpacing = p.lyricsMinimumSpacing;

    pageSetup.martyriaDefaultColor = p.martyriaDefaultColor;
    pageSetup.martyriaDefaultStrokeWidth = p.martyriaDefaultStrokeWidth;
    pageSetup.tempoDefaultColor = p.tempoDefaultColor;
    pageSetup.tempoDefaultStrokeWidth = p.tempoDefaultStrokeWidth;

    pageSetup.neumeDefaultColor = p.neumeDefaultColor;
    pageSetup.neumeDefaultFontFamily = p.neumeDefaultFontFamily;
    pageSetup.neumeDefaultStrokeWidth = p.neumeDefaultStrokeWidth;
    pageSetup.neumeDefaultFontSize = p.neumeDefaultFontSize;
    pageSetup.neumeDefaultSpacing = p.neumeDefaultSpacing;

    pageSetup.modeKeyDefaultColor = p.modeKeyDefaultColor;
    pageSetup.modeKeyDefaultStrokeWidth = p.modeKeyDefaultStrokeWidth;
    pageSetup.modeKeyDefaultFontSize = p.modeKeyDefaultFontSize;
    pageSetup.modeKeyDefaultHeightAdjustment = p.modeKeyDefaultHeightAdjustment;

    pageSetup.pageHeight = p.pageHeight;
    pageSetup.pageWidth = p.pageWidth;
    pageSetup.rightMargin = p.rightMargin;
    pageSetup.topMargin = p.topMargin;

    pageSetup.headerMargin = p.headerMargin;
    pageSetup.footerMargin = p.footerMargin;
    pageSetup.headerDifferentFirstPage =
      p.headerDifferentFirstPage || undefined;
    pageSetup.headerDifferentOddEven = p.headerDifferentOddEven || undefined;

    pageSetup.showHeader = p.showHeader || undefined;
    pageSetup.showFooter = p.showFooter || undefined;

    pageSetup.accidentalDefaultColor = p.accidentalDefaultColor;
    pageSetup.accidentalDefaultStrokeWidth = p.accidentalDefaultStrokeWidth;
    pageSetup.fthoraDefaultColor = p.fthoraDefaultColor;
    pageSetup.fthoraDefaultStrokeWidth = p.fthoraDefaultStrokeWidth;
    pageSetup.heteronDefaultColor = p.heteronDefaultColor;
    pageSetup.heteronDefaultStrokeWidth = p.heteronDefaultStrokeWidth;
    pageSetup.gorgonDefaultColor = p.gorgonDefaultColor;
    pageSetup.gorgonDefaultStrokeWidth = p.gorgonDefaultStrokeWidth;
    pageSetup.measureBarDefaultColor = p.measureBarDefaultColor;
    pageSetup.measureBarDefaultStrokeWidth = p.measureBarDefaultStrokeWidth;
    pageSetup.measureNumberDefaultColor = p.measureNumberDefaultColor;
    pageSetup.measureNumberDefaultStrokeWidth =
      p.measureNumberDefaultStrokeWidth;
    pageSetup.noteIndicatorDefaultColor = p.noteIndicatorDefaultColor;
    pageSetup.noteIndicatorDefaultStrokeWidth =
      p.noteIndicatorDefaultStrokeWidth;
    pageSetup.isonDefaultColor = p.isonDefaultColor;
    pageSetup.isonDefaultStrokeWidth = p.isonDefaultStrokeWidth;

    pageSetup.pageSize = p.pageSize;
    pageSetup.pageSizeUnit = p.pageSizeUnit;
    pageSetup.landscape = p.landscape || undefined;

    pageSetup.hyphenSpacing = p.hyphenSpacing;
  }

  public static SaveHeader(header: Header_v1, h: Header) {
    // Currently, headers only support a single element
    const e = h.elements[0];
    const element = header.elements[0];
    this.SaveTextBox(element as TextBoxElement_v1, e as TextBoxElement);
  }

  public static SaveFooter(footer: Footer_v1, f: Footer) {
    // Currently, footers only support a single element
    const e = f.elements[0];
    const element = footer.elements[0];
    this.SaveTextBox(element as TextBoxElement_v1, e as TextBoxElement);
  }

  public static SaveDropCap(element: DropCapElement_v1, e: DropCapElement) {
    element.color = e.color || undefined;
    element.content = e.content;
    element.fontFamily = e.fontFamily || undefined;
    element.fontSize = e.fontSize || undefined;
    element.fontWeight = e.fontWeight || undefined;
    element.fontStyle = e.fontStyle || undefined;
    element.strokeWidth = e.strokeWidth || undefined;
  }

  public static SaveMartyria(element: MartyriaElement_v1, e: MartyriaElement) {
    element.auto = e.auto || undefined;
    element.note = e.note;
    element.rootSign = e.rootSign;
    element.scale = e.scale;
    element.fthora = e.fthora || undefined;
    element.chromaticFthoraNote = e.chromaticFthoraNote || undefined;
    element.tempo = e.tempo || undefined;
    element.measureBarLeft = e.measureBarLeft || undefined;
    element.measureBarRight = e.measureBarRight || undefined;
    element.alignRight = e.alignRight || undefined;

    if (e.tempo != null) {
      console.log('saving bpm', e.tempo);
      element.bpm = e.bpm;
    }

    element.spaceAfter = e.spaceAfter || undefined;
  }

  public static SaveTempo(element: TempoElement_v1, e: TempoElement) {
    element.neume = e.neume;
    element.bpm = e.bpm;
    element.spaceAfter = e.spaceAfter || undefined;
  }

  public static SaveNote(element: NoteElement_v1, e: NoteElement) {
    element.quantitativeNeume = e.quantitativeNeume;
    element.spaceAfter = e.spaceAfter || undefined;

    if (e.timeNeume != null) {
      element.timeNeume = e.timeNeume;
      element.timeNeumeOffsetX = e.timeNeumeOffsetX || undefined;
      element.timeNeumeOffsetY = e.timeNeumeOffsetY || undefined;
    }

    if (e.gorgonNeume != null) {
      element.gorgonNeume = e.gorgonNeume;
      element.gorgonNeumeOffsetX = e.gorgonNeumeOffsetX || undefined;
      element.gorgonNeumeOffsetY = e.gorgonNeumeOffsetY || undefined;
    }

    if (e.secondaryGorgonNeume != null) {
      element.secondaryGorgonNeume = e.secondaryGorgonNeume;
      element.secondaryGorgonNeumeOffsetX =
        e.secondaryGorgonNeumeOffsetX || undefined;
      element.secondaryGorgonNeumeOffsetY =
        e.secondaryGorgonNeumeOffsetY || undefined;
    }

    if (e.fthora != null) {
      element.fthora = e.fthora;
      element.fthoraOffsetX = e.fthoraOffsetX || undefined;
      element.fthoraOffsetY = e.fthoraOffsetY || undefined;
    }

    if (e.chromaticFthoraNote != null) {
      element.chromaticFthoraNote = e.chromaticFthoraNote;
    }

    if (e.accidental != null) {
      element.accidental = e.accidental;
      element.accidentalOffsetX = e.accidentalOffsetX || undefined;
      element.accidentalOffsetY = e.accidentalOffsetY || undefined;
    }

    if (e.vocalExpressionNeume != null) {
      element.vocalExpressionNeume = e.vocalExpressionNeume;
      element.vocalExpressionNeumeOffsetX =
        e.vocalExpressionNeumeOffsetX || undefined;
      element.vocalExpressionNeumeOffsetY =
        e.vocalExpressionNeumeOffsetY || undefined;
    }

    if (e.measureBarLeft != null) {
      element.measureBarLeft = e.measureBarLeft;
      element.measureBarLeftOffsetX = e.measureBarLeftOffsetX || undefined;
      element.measureBarLeftOffsetY = e.measureBarLeftOffsetY || undefined;
    }

    if (e.measureBarRight != null) {
      element.measureBarRight = e.measureBarRight;
      element.measureBarRightOffsetX = e.measureBarRightOffsetX || undefined;
      element.measureBarRightOffsetY = e.measureBarRightOffsetY || undefined;
    }

    if (e.measureNumber != null) {
      element.measureNumber = e.measureNumber;
      element.measureNumberOffsetX = e.measureNumberOffsetX || undefined;
      element.measureNumberOffsetY = e.measureNumberOffsetY || undefined;
    }

    if (e.noteIndicator != null) {
      element.noteIndicatorOffsetX = e.noteIndicatorOffsetX || undefined;
      element.noteIndicatorOffsetY = e.noteIndicatorOffsetY || undefined;
    }

    if (e.ison != null) {
      element.ison = e.ison;
      element.isonOffsetX = e.isonOffsetX || undefined;
      element.isonOffsetY = e.isonOffsetY || undefined;
    }

    if (e.vareia) {
      element.vareiaOffsetX = e.vareiaOffsetX || undefined;
      element.vareiaOffsetY = e.vareiaOffsetY || undefined;
    }

    element.vareia = e.vareia || undefined;
    element.noteIndicator = e.noteIndicator || undefined;

    element.lyrics = e.lyrics !== '' ? e.lyrics : undefined;
    element.isMelisma = e.isMelisma || undefined;
    element.isMelismaStart = e.isMelismaStart || undefined;
    element.isHyphen = e.isHyphen || undefined;

    element.ignoreAttractions = e.ignoreAttractions || undefined;
  }

  public static SaveTextBox(element: TextBoxElement_v1, e: TextBoxElement) {
    element.alignment = e.alignment;
    element.color = e.color;
    element.content = e.content;
    element.fontFamily = e.fontFamily;
    element.fontSize = e.fontSize;
    element.strokeWidth = e.strokeWidth;
    element.inline = e.inline || undefined;
    element.bold = e.bold || undefined;
    element.italic = e.italic || undefined;
    element.underline = e.underline || undefined;
    element.height = e.height;
    element.useDefaultStyle = e.useDefaultStyle || undefined;
  }

  public static SaveModeKey(element: ModeKeyElement_v1, e: ModeKeyElement) {
    element.templateId = e.templateId || undefined;
    element.alignment = e.alignment;
    element.mode = e.mode;
    element.scale = e.scale;
    element.scaleNote = e.scaleNote;
    element.fthora = e.fthora || undefined;
    element.tempo = e.tempo || undefined;
    element.tempoAlignRight = e.tempoAlignRight || undefined;
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
    element.strokeWidth = e.strokeWidth;
    element.height = e.height;
    element.heightAdjustment = e.heightAdjustment;
    element.bpm = e.bpm;
    element.ignoreAttractions = e.ignoreAttractions || undefined;
    element.useDefaultStyle = e.useDefaultStyle || undefined;
    element.permanentEnharmonicZo = e.permanentEnharmonicZo || undefined;
  }

  public static LoadScore_v1(s: Score_v1) {
    const score = new Score();

    score.staff = new Staff();
    score.staff.elements = [];

    score.pageSetup = new PageSetup();

    this.LoadPageSetup_v1(score.pageSetup, s.pageSetup);

    if (s.headers) {
      this.LoadHeader_v1(score.headers.default, s.headers.default);
      this.LoadHeader_v1(score.headers.even, s.headers.even);
      this.LoadHeader_v1(score.headers.odd, s.headers.odd);
      this.LoadHeader_v1(score.headers.firstPage, s.headers.firstPage);
    }

    if (s.footers) {
      this.LoadFooter_v1(score.footers.default, s.footers.default);
      this.LoadFooter_v1(score.footers.even, s.footers.even);
      this.LoadFooter_v1(score.footers.odd, s.footers.odd);
      this.LoadFooter_v1(score.footers.firstPage, s.footers.firstPage);
    }

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
      element.lineBreakType = e.lineBreakType ?? LineBreakType.Left;
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

    if (p.headerMargin != null) {
      pageSetup.headerMargin = p.headerMargin;
    }

    if (p.footerMargin != null) {
      pageSetup.footerMargin = p.footerMargin;
    }

    pageSetup.headerDifferentFirstPage = p.headerDifferentFirstPage === true;
    pageSetup.headerDifferentOddEven = p.headerDifferentOddEven === true;
    pageSetup.showHeader = p.showHeader === true;
    pageSetup.showFooter = p.showFooter === true;

    pageSetup.lineHeight = p.lineHeight;

    pageSetup.dropCapDefaultColor =
      p.dropCapDefaultColor ?? pageSetup.dropCapDefaultColor;
    pageSetup.dropCapDefaultFontFamily = p.dropCapDefaultFontFamily;
    pageSetup.dropCapDefaultFontSize = p.dropCapDefaultFontSize;
    pageSetup.dropCapDefaultFontWeight =
      p.dropCapDefaultFontWeight ?? pageSetup.dropCapDefaultFontWeight;
    pageSetup.dropCapDefaultFontStyle =
      p.dropCapDefaultFontStyle ?? pageSetup.dropCapDefaultFontStyle;
    pageSetup.dropCapDefaultStrokeWidth =
      p.dropCapDefaultStrokeWidth ?? pageSetup.dropCapDefaultStrokeWidth;

    pageSetup.lyricsDefaultColor =
      p.lyricsDefaultColor ?? pageSetup.lyricsDefaultColor;
    pageSetup.lyricsDefaultFontFamily = p.lyricsDefaultFontFamily;
    pageSetup.lyricsDefaultFontSize = p.lyricsDefaultFontSize;
    pageSetup.lyricsDefaultFontWeight =
      p.lyricsDefaultFontWeight ?? pageSetup.lyricsDefaultFontWeight;
    pageSetup.lyricsDefaultFontStyle =
      p.lyricsDefaultFontStyle ?? pageSetup.lyricsDefaultFontStyle;
    pageSetup.lyricsDefaultStrokeWidth =
      p.lyricsDefaultStrokeWidth ?? pageSetup.lyricsDefaultStrokeWidth;
    pageSetup.lyricsVerticalOffset = p.lyricsVerticalOffset;
    pageSetup.lyricsMinimumSpacing =
      p.lyricsMinimumSpacing ?? pageSetup.lyricsMinimumSpacing;

    pageSetup.martyriaDefaultColor =
      p.martyriaDefaultColor ?? pageSetup.martyriaDefaultColor;
    pageSetup.martyriaDefaultStrokeWidth =
      p.martyriaDefaultStrokeWidth ?? pageSetup.martyriaDefaultStrokeWidth;
    pageSetup.tempoDefaultColor =
      p.tempoDefaultColor ?? pageSetup.tempoDefaultColor;
    pageSetup.tempoDefaultStrokeWidth =
      p.tempoDefaultStrokeWidth ?? pageSetup.tempoDefaultStrokeWidth;
    pageSetup.neumeDefaultColor =
      p.neumeDefaultColor ?? pageSetup.neumeDefaultColor;

    pageSetup.neumeDefaultFontFamily =
      p.neumeDefaultFontFamily ?? pageSetup.neumeDefaultFontFamily;
    pageSetup.neumeDefaultFontSize = p.neumeDefaultFontSize;
    pageSetup.neumeDefaultStrokeWidth =
      p.neumeDefaultStrokeWidth ?? pageSetup.neumeDefaultStrokeWidth;
    pageSetup.neumeDefaultSpacing = p.neumeDefaultSpacing;

    pageSetup.modeKeyDefaultColor =
      p.modeKeyDefaultColor ?? pageSetup.modeKeyDefaultColor;
    pageSetup.modeKeyDefaultStrokeWidth =
      p.modeKeyDefaultStrokeWidth ?? pageSetup.modeKeyDefaultStrokeWidth;
    pageSetup.modeKeyDefaultFontSize =
      p.modeKeyDefaultFontSize ?? pageSetup.modeKeyDefaultFontSize;
    pageSetup.modeKeyDefaultHeightAdjustment =
      p.modeKeyDefaultHeightAdjustment ??
      pageSetup.modeKeyDefaultHeightAdjustment;

    pageSetup.accidentalDefaultColor =
      p.accidentalDefaultColor ?? pageSetup.accidentalDefaultColor;
    pageSetup.accidentalDefaultStrokeWidth =
      p.accidentalDefaultStrokeWidth ?? pageSetup.accidentalDefaultStrokeWidth;
    pageSetup.fthoraDefaultColor =
      p.fthoraDefaultColor ?? pageSetup.fthoraDefaultColor;
    pageSetup.fthoraDefaultStrokeWidth =
      p.fthoraDefaultStrokeWidth ?? pageSetup.fthoraDefaultStrokeWidth;
    pageSetup.heteronDefaultColor =
      p.heteronDefaultColor ?? pageSetup.heteronDefaultColor;
    pageSetup.heteronDefaultStrokeWidth =
      p.heteronDefaultStrokeWidth ?? pageSetup.heteronDefaultStrokeWidth;
    pageSetup.gorgonDefaultColor =
      p.gorgonDefaultColor ?? pageSetup.gorgonDefaultColor;
    pageSetup.gorgonDefaultStrokeWidth =
      p.gorgonDefaultStrokeWidth ?? pageSetup.gorgonDefaultStrokeWidth;
    pageSetup.measureBarDefaultColor =
      p.measureBarDefaultColor ?? pageSetup.measureBarDefaultColor;
    pageSetup.measureBarDefaultStrokeWidth =
      p.measureBarDefaultStrokeWidth ?? pageSetup.measureBarDefaultStrokeWidth;
    pageSetup.measureNumberDefaultColor =
      p.measureNumberDefaultColor ?? pageSetup.measureNumberDefaultColor;
    pageSetup.measureNumberDefaultStrokeWidth =
      p.measureNumberDefaultStrokeWidth ??
      pageSetup.measureNumberDefaultStrokeWidth;
    pageSetup.noteIndicatorDefaultColor =
      p.noteIndicatorDefaultColor ?? pageSetup.noteIndicatorDefaultColor;
    pageSetup.noteIndicatorDefaultStrokeWidth =
      p.noteIndicatorDefaultStrokeWidth ??
      pageSetup.noteIndicatorDefaultStrokeWidth;
    pageSetup.isonDefaultColor =
      p.isonDefaultColor ?? pageSetup.isonDefaultColor;
    pageSetup.isonDefaultStrokeWidth =
      p.isonDefaultStrokeWidth ?? pageSetup.isonDefaultStrokeWidth;

    pageSetup.pageSize = p.pageSize ?? pageSetup.pageSize;
    pageSetup.pageSizeUnit = p.pageSizeUnit ?? pageSetup.pageSizeUnit;
    pageSetup.landscape = p.landscape === true;

    pageSetup.hyphenSpacing = p.hyphenSpacing;
  }

  public static LoadHeader_v1(header: Header, h: Header_v1) {
    // Currently, headers only support a single element
    const e = h.elements[0];
    const element = header.elements[0];
    this.LoadTextBox_v1(element as TextBoxElement, e as TextBoxElement_v1);
  }

  public static LoadFooter_v1(footer: Footer, f: Footer_v1) {
    // Currently, footers only support a single element
    const e = f.elements[0];
    const element = footer.elements[0];
    this.LoadTextBox_v1(element as TextBoxElement, e as TextBoxElement_v1);
  }

  public static LoadDropCap_v1(element: DropCapElement, e: DropCapElement_v1) {
    element.color = e.color ?? null;
    element.content = e.content;
    element.fontFamily = e.fontFamily ?? null;
    element.fontSize = e.fontSize ?? null;
    element.fontWeight = e.fontWeight ?? null;
    element.fontStyle = e.fontStyle ?? null;
    element.strokeWidth = e.strokeWidth ?? null;
  }

  public static LoadMartyria_v1(
    element: MartyriaElement,
    e: MartyriaElement_v1,
  ) {
    element.auto = e.auto === true;
    element.alignRight = e.alignRight === true;
    element.note = e.note;
    element.scale = e.scale;
    element.rootSign = e.rootSign;
    element.spaceAfter = e.spaceAfter ?? 0;

    if (e.fthora != null) {
      element.fthora = e.fthora;
    }

    if (e.chromaticFthoraNote != null) {
      element.chromaticFthoraNote = e.chromaticFthoraNote;
    }

    if (e.tempo != null) {
      element.tempo = e.tempo;
      element.bpm = e.bpm ?? TempoElement.getDefaultBpm(element.tempo);
    }

    if (e.measureBarLeft != null) {
      element.measureBarLeft = e.measureBarLeft;
    }

    if (e.measureBar != null) {
      element.measureBarRight = e.measureBar;
    }

    if (e.measureBarRight != null) {
      element.measureBarRight = e.measureBarRight ?? e.measureBar;
    }
  }

  public static LoadTempo_v1(element: TempoElement, e: TempoElement_v1) {
    element.neume = e.neume;
    element.bpm = e.bpm ?? TempoElement.getDefaultBpm(element.neume);
    element.spaceAfter = e.spaceAfter ?? 0;
  }

  public static LoadNote_v1(element: NoteElement, e: NoteElement_v1) {
    element.quantitativeNeume = Object.values(QuantitativeNeume).includes(
      e.quantitativeNeume,
    )
      ? e.quantitativeNeume
      : QuantitativeNeume.Ison;

    if (e.timeNeume != null) {
      element.timeNeume = e.timeNeume;
      element.timeNeumeOffsetX = e.timeNeumeOffsetX ?? null;
      element.timeNeumeOffsetY = e.timeNeumeOffsetY ?? null;
    }

    if (e.gorgonNeume != null) {
      element.gorgonNeume = e.gorgonNeume;
      element.gorgonNeumeOffsetX = e.gorgonNeumeOffsetX ?? null;
      element.gorgonNeumeOffsetY = e.gorgonNeumeOffsetY ?? null;
    }

    if (e.secondaryGorgonNeume != null) {
      element.secondaryGorgonNeume = e.secondaryGorgonNeume;
      element.secondaryGorgonNeumeOffsetX =
        e.secondaryGorgonNeumeOffsetX ?? null;
      element.secondaryGorgonNeumeOffsetY =
        e.secondaryGorgonNeumeOffsetY ?? null;
    }

    if (e.fthora != null) {
      element.fthora = e.fthora;
      element.fthoraOffsetX = e.fthoraOffsetX ?? null;
      element.fthoraOffsetY = e.fthoraOffsetY ?? null;
    }

    if (e.chromaticFthoraNote != null) {
      element.chromaticFthoraNote = e.chromaticFthoraNote;
    }

    if (e.accidental != null) {
      element.accidental = e.accidental;
      element.accidentalOffsetX = e.accidentalOffsetX ?? null;
      element.accidentalOffsetY = e.accidentalOffsetY ?? null;
    }

    if (e.vocalExpressionNeume != null) {
      element.vocalExpressionNeume = e.vocalExpressionNeume;
      element.vocalExpressionNeumeOffsetX =
        e.vocalExpressionNeumeOffsetX ?? null;
      element.vocalExpressionNeumeOffsetY =
        e.vocalExpressionNeumeOffsetY ?? null;
    }

    if (e.measureBarLeft != null) {
      element.measureBarLeft = e.measureBarLeft;
      element.measureBarLeftOffsetX = e.measureBarLeftOffsetX ?? null;
      element.measureBarLeftOffsetY = e.measureBarLeftOffsetY ?? null;
    }

    if (e.measureBar != null) {
      element.measureBarRight = e.measureBar;
    }

    if (e.measureBarRight != null) {
      element.measureBarRight = e.measureBarRight;
      element.measureBarRightOffsetX = e.measureBarRightOffsetX ?? null;
      element.measureBarRightOffsetY = e.measureBarRightOffsetY ?? null;
    }

    if (e.measureNumber != null) {
      element.measureNumber = e.measureNumber;
      element.measureNumberOffsetX = e.measureNumberOffsetX ?? null;
      element.measureNumberOffsetY = e.measureNumberOffsetY ?? null;
    }

    // For backwards compatibility, noteIndicator used to be a string | undefined
    element.noteIndicator =
      e.noteIndicator !== undefined && e.noteIndicator !== false;

    if (element.noteIndicator) {
      element.noteIndicatorOffsetX = e.noteIndicatorOffsetX ?? null;
      element.noteIndicatorOffsetY = e.noteIndicatorOffsetY ?? null;
    }

    if (e.ison != null) {
      element.ison = e.ison;
      element.isonOffsetX = e.isonOffsetX ?? null;
      element.isonOffsetY = e.isonOffsetY ?? null;
    }

    if (e.lyrics != null) {
      element.lyrics = e.lyrics;
    }

    if (e.vareia === true) {
      element.vareiaOffsetX = e.vareiaOffsetX ?? null;
      element.vareiaOffsetY = e.vareiaOffsetY ?? null;
    }

    element.vareia = e.vareia === true;

    element.isMelisma = e.isMelisma === true;
    element.isMelismaStart = e.isMelismaStart === true;
    element.isHyphen = e.isHyphen === true;
    element.ignoreAttractions = e.ignoreAttractions === true;
    element.spaceAfter = e.spaceAfter ?? 0;
  }

  public static LoadTextBox_v1(element: TextBoxElement, e: TextBoxElement_v1) {
    element.alignment = e.alignment;
    element.color = e.color;
    element.content = e.content;
    element.fontFamily = e.fontFamily;
    element.fontSize = e.fontSize;
    element.inline = e.inline === true;
    element.bold = e.bold === true;
    element.italic = e.italic === true;
    element.underline = e.underline === true;
    element.height = e.height;
    element.strokeWidth = e.strokeWidth ?? element.strokeWidth;
    element.useDefaultStyle = e.useDefaultStyle === true;
  }

  public static LoadModeKey_v1(element: ModeKeyElement, e: ModeKeyElement_v1) {
    element.templateId = e.templateId ?? null;
    element.alignment = e.alignment;
    element.mode = e.mode;
    element.scale = e.scale;
    element.scaleNote = e.scaleNote;
    element.tempo = e.tempo ?? null;
    element.tempoAlignRight = e.tempoAlignRight === true;
    element.note = e.note ?? null;
    element.note2 = e.note2 ?? null;
    element.fthoraAboveNote = e.fthoraAboveNote ?? null;
    element.fthoraAboveNote2 = e.fthoraAboveNote2 ?? null;
    element.fthoraAboveQuantitativeNeumeRight =
      e.fthoraAboveQuantitativeNeumeRight ?? null;
    element.quantitativeNeumeAboveNote = e.quantitativeNeumeAboveNote ?? null;
    element.quantitativeNeumeAboveNote2 = e.quantitativeNeumeAboveNote2 ?? null;
    element.quantitativeNeumeRight = e.quantitativeNeumeRight ?? null;
    element.martyria = e.martyria;
    element.color = e.color;
    element.fontSize = e.fontSize;
    element.strokeWidth = e.strokeWidth ?? element.strokeWidth;
    element.heightAdjustment = e.heightAdjustment ?? 0;
    element.bpm = e.bpm ?? 120;
    element.ignoreAttractions = e.ignoreAttractions === true;
    element.useDefaultStyle = e.useDefaultStyle === true;
    element.permanentEnharmonicZo = e.permanentEnharmonicZo === true;

    // For backwards compatibility, we check the current mode key templates
    // to fill out the fthora if it is missing.
    if (e.fthora == null) {
      const template = modeKeyTemplates.find((x) => x.id === e.templateId);

      element.fthora = template?.fthora ?? null;
    } else {
      element.fthora = e.fthora;
    }
  }
}
