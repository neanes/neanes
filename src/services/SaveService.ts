import {
  AcceptsLyricsOption,
  DropCapElement,
  ElementType,
  EmptyElement,
  ImageBoxElement,
  LineBreakType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import { Footer } from '@/models/Footer';
import { Header } from '@/models/Header';
import { LyricSetup } from '@/models/LyricSetup';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { QuantitativeNeume } from '@/models/Neumes';
import { PageSetup, pageSizes } from '@/models/PageSetup';
import {
  DropCapElement as DropCapElement_v1,
  ElementType as ElementType_v1,
  EmptyElement as EmptyElement_v1,
  ImageBoxElement as ImageBoxElement_v1,
  MartyriaElement as MartyriaElement_v1,
  ModeKeyElement as ModeKeyElement_v1,
  NoteElement as NoteElement_v1,
  RichTextBoxElement as RichTextBoxElement_v1,
  ScoreElement as ScoreElement_v1,
  TempoElement as TempoElement_v1,
  TextBoxElement as TextBoxElement_v1,
} from '@/models/save/v1/Element';
import { Footer as Footer_v1 } from '@/models/save/v1/Footer';
import { Header as Header_v1 } from '@/models/save/v1/Header';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import {
  LyricSetup as LyricSetup_v1,
  Score as Score_v1,
  Staff as Staff_v1,
} from '@/models/save/v1/Score';
import { Score } from '@/models/Score';
import { Staff } from '@/models/Staff';

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
    this.SaveLyricSetup(score.staff.lyrics, s.staff.lyrics);

    this.SaveHeader(score.headers.default, s.headers.default);
    this.SaveHeader(score.headers.even, s.headers.even);
    this.SaveHeader(score.headers.odd, s.headers.odd);
    this.SaveHeader(score.headers.firstPage, s.headers.firstPage);

    this.SaveFooter(score.footers.default, s.footers.default);
    this.SaveFooter(score.footers.even, s.footers.even);
    this.SaveFooter(score.footers.odd, s.footers.odd);
    this.SaveFooter(score.footers.firstPage, s.footers.firstPage);

    for (const e of s.staff.elements) {
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
        case ElementType.RichTextBox:
          element = new RichTextBoxElement_v1();
          this.SaveRichTextBox(
            element as RichTextBoxElement_v1,
            e as RichTextBoxElement,
          );
          break;
        case ElementType.ModeKey:
          element = new ModeKeyElement_v1();
          this.SaveModeKey(element as ModeKeyElement_v1, e as ModeKeyElement);
          break;
        case ElementType.ImageBox:
          element = new ImageBoxElement_v1();
          this.SaveImageBox(
            element as ImageBoxElement_v1,
            e as ImageBoxElement,
          );
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
    pageSetup.dropCapDefaultLineHeight =
      p.dropCapDefaultLineHeight ?? undefined;
    pageSetup.dropCapDefaultLineSpan = p.dropCapDefaultLineSpan;

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
    pageSetup.lyricsMelismaCutoffWidth = p.lyricsMelismaCutoffWidth;

    pageSetup.textBoxDefaultColor = p.textBoxDefaultColor;
    pageSetup.textBoxDefaultFontFamily = p.textBoxDefaultFontFamily;
    pageSetup.textBoxDefaultFontSize = p.textBoxDefaultFontSize;
    pageSetup.textBoxDefaultFontWeight = p.textBoxDefaultFontWeight;
    pageSetup.textBoxDefaultFontStyle = p.textBoxDefaultFontStyle;
    pageSetup.textBoxDefaultStrokeWidth = p.textBoxDefaultStrokeWidth;
    pageSetup.textBoxDefaultLineHeight =
      p.textBoxDefaultLineHeight ?? undefined;

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

    pageSetup.melkiteRtl = p.melkiteRtl || undefined;

    pageSetup.headerMargin = p.headerMargin;
    pageSetup.footerMargin = p.footerMargin;
    pageSetup.headerDifferentFirstPage =
      p.headerDifferentFirstPage || undefined;
    pageSetup.headerDifferentOddEven = p.headerDifferentOddEven || undefined;

    pageSetup.showHeader = p.showHeader || undefined;
    pageSetup.showFooter = p.showFooter || undefined;
    pageSetup.richHeaderFooter = p.richHeaderFooter || undefined;

    pageSetup.firstPageNumber = p.firstPageNumber;

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
    pageSetup.koronisDefaultColor = p.koronisDefaultColor;
    pageSetup.koronisDefaultStrokeWidth = p.koronisDefaultStrokeWidth;

    pageSetup.pageSize = p.pageSize;
    pageSetup.pageSizeUnit = p.pageSizeUnit;
    pageSetup.landscape = p.landscape || undefined;

    pageSetup.hyphenSpacing = p.hyphenSpacing;

    pageSetup.chrysanthineAccidentals = p.chrysanthineAccidentals;
    pageSetup.noFthoraRestrictions = p.noFthoraRestrictions || undefined;
    pageSetup.disableGreekMelismata = p.disableGreekMelismata || undefined;
  }

  public static SaveLyricSetup(lyricSetup: LyricSetup_v1, l: LyricSetup) {
    lyricSetup.locked = l.locked || undefined;
    lyricSetup.text = l.text;
  }

  public static SaveHeader(header: Header_v1, h: Header) {
    // Currently, headers only support a single element
    const e = h.elements[0];

    if (e.elementType === ElementType.TextBox) {
      const element = new TextBoxElement_v1();

      this.SaveTextBox(element, e as TextBoxElement);

      header.elements[0] = element;
    } else if (e.elementType === ElementType.RichTextBox) {
      const element = new RichTextBoxElement_v1();

      this.SaveRichTextBox(element, e as RichTextBoxElement);

      header.elements[0] = element;
    }
  }

  public static SaveFooter(footer: Footer_v1, f: Footer) {
    // Currently, footers only support a single element
    const e = f.elements[0];

    if (e.elementType === ElementType.TextBox) {
      const element = new TextBoxElement_v1();

      this.SaveTextBox(element, e as TextBoxElement);

      footer.elements[0] = element;
    } else if (e.elementType === ElementType.RichTextBox) {
      const element = new RichTextBoxElement_v1();

      this.SaveRichTextBox(element, e as RichTextBoxElement);

      footer.elements[0] = element;
    }
  }

  public static SaveDropCap(element: DropCapElement_v1, e: DropCapElement) {
    element.color = e.color;
    element.content = e.content;
    element.fontFamily = e.fontFamily;
    element.fontSize = e.fontSize;
    element.fontWeight = e.fontWeight;
    element.fontStyle = e.fontStyle;
    element.lineHeight = e.lineHeight ?? undefined;
    element.strokeWidth = e.strokeWidth;
    element.customWidth = e.customWidth ?? undefined;
    element.useDefaultStyle = e.useDefaultStyle || undefined;
    element.lineSpan = e.lineSpan;
  }

  public static SaveImageBox(element: ImageBoxElement_v1, e: ImageBoxElement) {
    element.imageHeight = e.imageHeight;
    element.imageWidth = e.imageWidth;
    element.alignment = e.alignment;
    element.data = e.data;
    element.inline = e.inline || undefined;
    element.lockAspectRatio = e.lockAspectRatio || undefined;
  }

  public static SaveMartyria(element: MartyriaElement_v1, e: MartyriaElement) {
    element.auto = e.auto || undefined;
    element.note = e.note;
    element.rootSign = e.rootSign;
    element.rootSignOverride = e.rootSignOverride || undefined;
    element.scale = e.scale;
    element.fthora = e.fthora || undefined;
    element.chromaticFthoraNote = e.chromaticFthoraNote || undefined;
    element.tempoLeft = e.tempoLeft || undefined;
    element.tempo = e.tempo || undefined;
    element.tempoRight = e.tempoRight || undefined;
    element.measureBarLeft = e.measureBarLeft || undefined;
    element.measureBarRight = e.measureBarRight || undefined;
    element.alignRight = e.alignRight || undefined;

    if (e.tempo != null || e.tempoLeft != null || e.tempoRight != null) {
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

    if (e.secondaryFthora != null) {
      element.secondaryFthora = e.secondaryFthora;
      element.secondaryFthoraOffsetX = e.secondaryFthoraOffsetX || undefined;
      element.secondaryFthoraOffsetY = e.secondaryFthoraOffsetY || undefined;
    }

    if (e.tertiaryFthora != null) {
      element.tertiaryFthora = e.tertiaryFthora;
      element.tertiaryFthoraOffsetX = e.tertiaryFthoraOffsetX || undefined;
      element.tertiaryFthoraOffsetY = e.tertiaryFthoraOffsetY || undefined;
    }

    element.chromaticFthoraNote = e.chromaticFthoraNote ?? undefined;
    element.secondaryChromaticFthoraNote =
      e.secondaryChromaticFthoraNote ?? undefined;
    element.tertiaryChromaticFthoraNote =
      e.tertiaryChromaticFthoraNote ?? undefined;

    if (e.accidental != null) {
      element.accidental = e.accidental;
      element.accidentalOffsetX = e.accidentalOffsetX || undefined;
      element.accidentalOffsetY = e.accidentalOffsetY || undefined;
    }

    if (e.secondaryAccidental != null) {
      element.secondaryAccidental = e.secondaryAccidental;
      element.secondaryAccidentalOffsetX =
        e.secondaryAccidentalOffsetX || undefined;
      element.secondaryAccidentalOffsetY =
        e.secondaryAccidentalOffsetY || undefined;
    }

    if (e.tertiaryAccidental != null) {
      element.tertiaryAccidental = e.tertiaryAccidental;
      element.tertiaryAccidentalOffsetX =
        e.tertiaryAccidentalOffsetX || undefined;
      element.tertiaryAccidentalOffsetY =
        e.tertiaryAccidentalOffsetY || undefined;
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

    if (e.tie != null) {
      element.tie = e.tie;
      element.tieOffsetX = e.tieOffsetX || undefined;
      element.tieOffsetY = e.tieOffsetY || undefined;
    }

    if (e.vareia) {
      element.vareiaOffsetX = e.vareiaOffsetX || undefined;
      element.vareiaOffsetY = e.vareiaOffsetY || undefined;
    }

    if (e.koronis) {
      element.koronisOffsetX = e.koronisOffsetX || undefined;
      element.koronisOffsetY = e.koronisOffsetY || undefined;
    }

    if (e.stavros) {
      element.stavrosOffsetX = e.stavrosOffsetX || undefined;
      element.stavrosOffsetY = e.stavrosOffsetY || undefined;
    }

    element.vareia = e.vareia || undefined;
    element.noteIndicator = e.noteIndicator || undefined;
    element.koronis = e.koronis || undefined;
    element.stavros = e.stavros || undefined;

    element.lyrics = e.lyrics !== '' ? e.lyrics : undefined;
    element.isMelisma = e.isMelisma || undefined;
    element.isMelismaStart = e.isMelismaStart || undefined;
    element.isHyphen = e.isHyphen || undefined;

    if (!e.lyricsUseDefaultStyle) {
      element.lyricsUseDefaultStyle = e.lyricsUseDefaultStyle;
      element.lyricsColor = e.lyricsColor;
      element.lyricsFontStyle = e.lyricsFontStyle;
      element.lyricsFontWeight = e.lyricsFontWeight;
      element.lyricsFontFamily = e.lyricsFontFamily;
      element.lyricsFontSize = e.lyricsFontSize;
      element.lyricsTextDecoration = e.lyricsTextDecoration;
      element.lyricsStrokeWidth = e.lyricsStrokeWidth;
    }

    element.ignoreAttractions = e.ignoreAttractions || undefined;

    if (e.acceptsLyrics !== AcceptsLyricsOption.Default) {
      element.acceptsLyrics = e.acceptsLyrics;
    }
  }

  public static SaveTextBox(element: TextBoxElement_v1, e: TextBoxElement) {
    element.alignment = e.alignment;
    element.color = e.color;
    element.content = e.content;
    if (e.multipanel) {
      element.contentLeft = e.contentLeft;
      element.contentCenter = e.contentCenter;
      element.contentRight = e.contentRight;
      element.multipanel = true;
    }
    element.fontFamily = e.fontFamily;
    element.fontSize = e.fontSize;
    element.strokeWidth = e.strokeWidth;
    element.inline = e.inline || undefined;
    element.bold = e.bold || undefined;
    element.italic = e.italic || undefined;
    element.underline = e.underline || undefined;
    element.lineHeight = e.lineHeight ?? undefined;
    element.height = e.height;
    element.customWidth = e.customWidth ?? undefined;
    element.customHeight = e.customHeight ?? undefined;
    element.marginTop = e.marginTop ?? undefined;
    element.marginBottom = e.marginBottom ?? undefined;
    element.useDefaultStyle = e.useDefaultStyle || undefined;
  }

  public static SaveRichTextBox(
    element: RichTextBoxElement_v1,
    e: RichTextBoxElement,
  ) {
    element.content = e.content;

    if (e.multipanel) {
      element.contentLeft = e.contentLeft;
      element.contentCenter = e.contentCenter;
      element.contentRight = e.contentRight;
      element.multipanel = true;
    }

    element.height = e.height;
    element.marginTop = e.marginTop ?? undefined;
    element.marginBottom = e.marginBottom ?? undefined;
    element.rtl = e.rtl || undefined;
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
    element.marginTop = e.marginTop ?? undefined;
    element.marginBottom = e.marginBottom ?? undefined;
    element.bpm = e.bpm;
    element.ignoreAttractions = e.ignoreAttractions || undefined;
    element.showAmbitus = e.showAmbitus || undefined;
    element.useDefaultStyle = e.useDefaultStyle || undefined;
    element.permanentEnharmonicZo = e.permanentEnharmonicZo || undefined;
  }

  public static LoadScore_v1(s: Score_v1) {
    const score = new Score();

    score.staff = new Staff();
    score.staff.elements = [];

    score.pageSetup = new PageSetup();

    this.LoadPageSetup_v1(score.pageSetup, s.pageSetup);
    this.LoadLyricSetup_v1(
      score.staff.lyrics,
      s.staff.lyrics ?? new LyricSetup(),
    );

    if (s.headers) {
      this.LoadHeader_v1(
        s.version,
        score.headers.default,
        s.headers.default,
        score.pageSetup,
      );
      this.LoadHeader_v1(
        s.version,
        score.headers.even,
        s.headers.even,
        score.pageSetup,
      );
      this.LoadHeader_v1(
        s.version,
        score.headers.odd,
        s.headers.odd,
        score.pageSetup,
      );
      this.LoadHeader_v1(
        s.version,
        score.headers.firstPage,
        s.headers.firstPage,
        score.pageSetup,
      );
    }

    if (s.footers) {
      this.LoadFooter_v1(
        s.version,
        score.footers.default,
        s.footers.default,
        score.pageSetup,
      );
      this.LoadFooter_v1(
        s.version,
        score.footers.even,
        s.footers.even,
        score.pageSetup,
      );
      this.LoadFooter_v1(
        s.version,
        score.footers.odd,
        s.footers.odd,
        score.pageSetup,
      );
      this.LoadFooter_v1(
        s.version,
        score.footers.firstPage,
        s.footers.firstPage,
        score.pageSetup,
      );
    }

    for (const e of s.staff.elements) {
      let element: ScoreElement = new EmptyElement();

      switch (e.elementType) {
        case ElementType_v1.DropCap:
          element = new DropCapElement();
          this.LoadDropCap_v1(
            element as DropCapElement,
            e as DropCapElement_v1,
            score.pageSetup,
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
            s.version,
            element as TextBoxElement,
            e as TextBoxElement_v1,
            score.pageSetup,
          );
          break;
        case ElementType_v1.RichTextBox:
          element = new RichTextBoxElement();
          this.LoadRichTextBox_v1(
            element as RichTextBoxElement,
            e as RichTextBoxElement_v1,
          );
          break;
        case ElementType_v1.ModeKey:
          element = new ModeKeyElement();
          this.LoadModeKey_v1(
            element as ModeKeyElement,
            e as ModeKeyElement_v1,
          );
          break;

        case ElementType_v1.ImageBox:
          element = new ImageBoxElement();
          this.LoadImageBox_v1(
            element as ImageBoxElement,
            e as ImageBoxElement_v1,
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

    pageSetup.melkiteRtl = p.melkiteRtl === true;

    pageSetup.headerDifferentFirstPage = p.headerDifferentFirstPage === true;
    pageSetup.headerDifferentOddEven = p.headerDifferentOddEven === true;
    pageSetup.showHeader = p.showHeader === true;
    pageSetup.showFooter = p.showFooter === true;
    pageSetup.richHeaderFooter = p.richHeaderFooter === true;
    pageSetup.firstPageNumber = p.firstPageNumber ?? pageSetup.firstPageNumber;

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
    pageSetup.dropCapDefaultLineHeight =
      p.dropCapDefaultLineHeight ?? pageSetup.dropCapDefaultLineHeight;
    pageSetup.dropCapDefaultLineSpan =
      p.dropCapDefaultLineSpan ?? pageSetup.dropCapDefaultLineSpan;

    pageSetup.textBoxDefaultColor =
      p.textBoxDefaultColor ?? pageSetup.textBoxDefaultColor;
    pageSetup.textBoxDefaultFontFamily =
      p.textBoxDefaultFontFamily ?? pageSetup.textBoxDefaultFontFamily;
    pageSetup.textBoxDefaultFontSize =
      p.textBoxDefaultFontSize ?? pageSetup.textBoxDefaultFontSize;
    pageSetup.textBoxDefaultFontWeight =
      p.textBoxDefaultFontWeight ?? pageSetup.textBoxDefaultFontWeight;
    pageSetup.textBoxDefaultFontStyle =
      p.textBoxDefaultFontStyle ?? pageSetup.textBoxDefaultFontStyle;
    pageSetup.textBoxDefaultStrokeWidth =
      p.textBoxDefaultStrokeWidth ?? pageSetup.textBoxDefaultStrokeWidth;
    pageSetup.textBoxDefaultLineHeight =
      p.textBoxDefaultLineHeight ?? pageSetup.textBoxDefaultLineHeight;

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
    pageSetup.lyricsMelismaCutoffWidth =
      p.lyricsMelismaCutoffWidth ?? pageSetup.lyricsMelismaCutoffWidth;

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
    pageSetup.koronisDefaultColor =
      p.koronisDefaultColor ?? pageSetup.koronisDefaultColor;
    pageSetup.koronisDefaultStrokeWidth =
      p.koronisDefaultStrokeWidth ?? pageSetup.koronisDefaultStrokeWidth;

    pageSetup.pageSize = p.pageSize ?? pageSetup.pageSize;
    pageSetup.pageSizeUnit = p.pageSizeUnit ?? pageSetup.pageSizeUnit;
    pageSetup.landscape = p.landscape === true;

    pageSetup.hyphenSpacing = p.hyphenSpacing;

    pageSetup.chrysanthineAccidentals =
      p.chrysanthineAccidentals === true ||
      p.chrysanthineAccidentals === undefined;
    pageSetup.noFthoraRestrictions = p.noFthoraRestrictions === true;
    pageSetup.disableGreekMelismata = p.disableGreekMelismata === true;

    // Fix pageWidth and pageHeight
    // Due to bug #71, A-series paper sizes had incorrect width and height
    const pageSize = pageSizes.find((x) => x.name === pageSetup.pageSize);
    if (pageSize) {
      if (pageSetup.landscape) {
        pageSetup.pageWidth = pageSize.height;
        pageSetup.pageHeight = pageSize.width;
      } else {
        pageSetup.pageWidth = pageSize.width;
        pageSetup.pageHeight = pageSize.height;
      }
    }
  }

  public static LoadLyricSetup_v1(lyricSetup: LyricSetup, l: LyricSetup_v1) {
    lyricSetup.locked = l.locked === true;
    lyricSetup.text = l.text;
  }

  public static LoadHeader_v1(
    scoreVersion: string,
    header: Header,
    h: Header_v1,
    pageSetup: PageSetup,
  ) {
    // Currently, headers only support a single element
    const e = h.elements[0];

    if (e.elementType === ElementType.TextBox) {
      const element = new TextBoxElement();

      this.LoadTextBox_v1(
        scoreVersion,
        element,
        e as TextBoxElement_v1,
        pageSetup,
      );

      header.elements[0] = element;
    } else if (e.elementType === ElementType.RichTextBox) {
      const element = new RichTextBoxElement();

      this.LoadRichTextBox_v1(element, e as RichTextBoxElement_v1);

      header.elements[0] = element;
    }
  }

  public static LoadFooter_v1(
    scoreVersion: string,
    footer: Footer,
    f: Footer_v1,
    pageSetup: PageSetup,
  ) {
    // Currently, footers only support a single element
    const e = f.elements[0];

    if (e.elementType === ElementType.TextBox) {
      const element = new TextBoxElement();

      this.LoadTextBox_v1(
        scoreVersion,
        element,
        e as TextBoxElement_v1,
        pageSetup,
      );

      footer.elements[0] = element;
    } else if (e.elementType === ElementType.RichTextBox) {
      const element = new RichTextBoxElement();

      this.LoadRichTextBox_v1(element, e as RichTextBoxElement_v1);

      footer.elements[0] = element;
    }
  }

  public static LoadDropCap_v1(
    element: DropCapElement,
    e: DropCapElement_v1,
    pageSetup: PageSetup,
  ) {
    // Due to model changes, these values may be null for older files
    element.color = e.color ?? pageSetup.dropCapDefaultColor;
    element.content = e.content;
    element.fontFamily = e.fontFamily ?? pageSetup.dropCapDefaultFontFamily;
    element.fontSize = e.fontSize ?? pageSetup.dropCapDefaultFontSize;
    element.lineHeight = e.lineHeight ?? pageSetup.dropCapDefaultLineHeight;
    element.fontWeight = e.fontWeight ?? pageSetup.dropCapDefaultFontWeight;
    element.fontStyle = e.fontStyle ?? pageSetup.dropCapDefaultFontStyle;
    element.strokeWidth = e.strokeWidth ?? pageSetup.dropCapDefaultStrokeWidth;
    element.lineSpan = e.lineSpan ?? pageSetup.dropCapDefaultLineSpan;
    element.customWidth = e.customWidth ?? null;
    element.useDefaultStyle = e.useDefaultStyle === true;
  }

  public static LoadImageBox_v1(
    element: ImageBoxElement,
    e: ImageBoxElement_v1,
  ) {
    element.imageHeight = e.imageHeight;
    element.imageWidth = e.imageWidth;
    element.alignment = e.alignment;
    element.data = e.data;
    element.inline = e.inline === true;
    element.lockAspectRatio = e.lockAspectRatio === true;
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
    element.rootSignOverride = e.rootSignOverride || null;
    element.spaceAfter = e.spaceAfter ?? 0;

    if (e.fthora != null) {
      element.fthora = e.fthora;
    }

    if (e.chromaticFthoraNote != null) {
      element.chromaticFthoraNote = e.chromaticFthoraNote;
    }

    if (e.tempoLeft != null) {
      element.tempoLeft = e.tempoLeft;
      element.bpm = e.bpm ?? TempoElement.getDefaultBpm(element.tempoLeft);
    }

    if (e.tempo != null) {
      element.tempo = e.tempo;
      element.bpm = e.bpm ?? TempoElement.getDefaultBpm(element.tempo);
    }

    if (e.tempoRight != null) {
      element.tempoRight = e.tempoRight;
      element.bpm = e.bpm ?? TempoElement.getDefaultBpm(element.tempoRight);
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

    if (e.secondaryFthora != null) {
      element.secondaryFthora = e.secondaryFthora;
      element.secondaryFthoraOffsetX = e.secondaryFthoraOffsetX ?? null;
      element.secondaryFthoraOffsetY = e.secondaryFthoraOffsetY ?? null;
    }

    if (e.tertiaryFthora != null) {
      element.tertiaryFthora = e.tertiaryFthora;
      element.tertiaryFthoraOffsetX = e.tertiaryFthoraOffsetX ?? null;
      element.tertiaryFthoraOffsetY = e.tertiaryFthoraOffsetY ?? null;
    }

    element.chromaticFthoraNote = e.chromaticFthoraNote ?? null;
    element.secondaryChromaticFthoraNote =
      e.secondaryChromaticFthoraNote ?? null;
    element.tertiaryChromaticFthoraNote = e.tertiaryChromaticFthoraNote ?? null;

    if (e.accidental != null) {
      element.accidental = e.accidental;
      element.accidentalOffsetX = e.accidentalOffsetX ?? null;
      element.accidentalOffsetY = e.accidentalOffsetY ?? null;
    }

    if (e.secondaryAccidental != null) {
      element.secondaryAccidental = e.secondaryAccidental;
      element.secondaryAccidentalOffsetX = e.secondaryAccidentalOffsetX ?? null;
      element.secondaryAccidentalOffsetY = e.secondaryAccidentalOffsetY ?? null;
    }

    if (e.tertiaryAccidental != null) {
      element.tertiaryAccidental = e.tertiaryAccidental;
      element.tertiaryAccidentalOffsetX = e.tertiaryAccidentalOffsetX ?? null;
      element.tertiaryAccidentalOffsetY = e.tertiaryAccidentalOffsetY ?? null;
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

    if (e.tie != null) {
      element.tie = e.tie;
      element.tieOffsetX = e.tieOffsetX ?? null;
      element.tieOffsetY = e.tieOffsetY ?? null;
    }

    if (e.lyrics != null) {
      element.lyrics = e.lyrics;
    }

    if (e.vareia === true) {
      element.vareiaOffsetX = e.vareiaOffsetX ?? null;
      element.vareiaOffsetY = e.vareiaOffsetY ?? null;
    }

    if (e.koronis === true) {
      element.koronisOffsetX = e.koronisOffsetX ?? null;
      element.koronisOffsetY = e.koronisOffsetY ?? null;
    }

    if (e.stavros === true) {
      element.stavrosOffsetX = e.stavrosOffsetX ?? null;
      element.stavrosOffsetY = e.stavrosOffsetY ?? null;
    }

    element.vareia = e.vareia === true;
    element.koronis = e.koronis === true;
    element.stavros = e.stavros === true;

    element.isMelisma = e.isMelisma === true;
    element.isMelismaStart = e.isMelismaStart === true;
    element.isHyphen = e.isHyphen === true;
    element.ignoreAttractions = e.ignoreAttractions === true;
    element.spaceAfter = e.spaceAfter ?? 0;

    if (e.lyricsUseDefaultStyle != null) {
      element.lyricsUseDefaultStyle = e.lyricsUseDefaultStyle;
      element.lyricsColor = e.lyricsColor ?? element.lyricsColor;
      element.lyricsFontStyle = e.lyricsFontStyle ?? element.lyricsFontStyle;
      element.lyricsFontWeight = e.lyricsFontWeight ?? element.lyricsFontWeight;
      element.lyricsFontFamily = e.lyricsFontFamily ?? element.lyricsFontFamily;
      element.lyricsFontSize = e.lyricsFontSize ?? element.lyricsFontSize;
      element.lyricsTextDecoration =
        e.lyricsTextDecoration ?? element.lyricsTextDecoration;
      element.lyricsStrokeWidth =
        e.lyricsStrokeWidth ?? element.lyricsStrokeWidth;
    }

    if (e.acceptsLyrics !== undefined) {
      element.acceptsLyrics = e.acceptsLyrics;
    } else {
      element.acceptsLyrics = AcceptsLyricsOption.Default;
    }
  }

  public static LoadTextBox_v1(
    scoreVersion: string,
    element: TextBoxElement,
    e: TextBoxElement_v1,
    pageSetup: PageSetup,
  ) {
    element.alignment = e.alignment;
    element.color = e.color;
    element.content = e.content;

    if (e.multipanel) {
      element.contentLeft = e.contentLeft;
      element.contentCenter = e.contentCenter;
      element.contentRight = e.contentRight;
    }

    element.multipanel = e.multipanel === true;

    element.fontFamily = e.fontFamily;
    element.fontSize = e.fontSize;
    element.inline = e.inline === true;
    element.bold = e.bold === true;
    element.italic = e.italic === true;
    element.underline = e.underline === true;
    element.height = e.height;
    element.strokeWidth = e.strokeWidth ?? element.strokeWidth;
    element.lineHeight = e.lineHeight ?? pageSetup.textBoxDefaultLineHeight;
    element.customWidth = e.customWidth ?? null;
    element.customHeight = e.customHeight ?? null;
    element.marginTop = e.marginTop ?? 0;
    element.marginBottom = e.marginBottom ?? 0;

    if (scoreVersion === '1.0') {
      // In this version, use default was incorrectly set to true
      // for non-inline text boxes even though the field was never used
      element.useDefaultStyle = element.inline && e.useDefaultStyle === true;
    } else {
      element.useDefaultStyle = e.useDefaultStyle === true;
    }
  }

  public static LoadRichTextBox_v1(
    element: RichTextBoxElement,
    e: RichTextBoxElement_v1,
  ) {
    element.content = e.content;
    element.height = e.height;
    element.marginTop = e.marginTop ?? 0;
    element.marginBottom = e.marginBottom ?? 0;

    if (e.multipanel) {
      element.contentLeft = e.contentLeft;
      element.contentCenter = e.contentCenter;
      element.contentRight = e.contentRight;
    }

    element.multipanel = e.multipanel === true;
    element.rtl = e.rtl === true;
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
    element.marginTop = e.marginTop ?? 0;
    element.marginBottom = e.marginBottom ?? 0;
    element.bpm = e.bpm ?? 120;
    element.ignoreAttractions = e.ignoreAttractions === true;
    element.showAmbitus = e.showAmbitus === true;
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
