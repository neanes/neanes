import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  ModeSign,
  Note,
  NoteIndicator,
  QuantitativeNeume,
  RootSign,
  TempoSign,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { Unit } from '@/utils/Unit';

import { ModeKeyTemplate } from './ModeKeys';
import {
  getFthoraReplacements,
  getGorgonReplacements,
  getQuantitativeReplacements,
  getSecondaryNeume,
  getTertiaryNeume,
  getTimeReplacements,
  getVocalExpressionReplacements,
  isMeasureBarAbove,
  measureBarAboveToLeft,
  measureBarLeftToAbove,
} from './NeumeReplacements';
import { Scale, ScaleNote } from './Scales';

export enum ElementType {
  Note = 'Note',
  Martyria = 'Martyria',
  Tempo = 'Tempo',
  Empty = 'Empty',
  TextBox = 'TextBox',
  RichTextBox = 'RichTextBox',
  DropCap = 'DropCap',
  ModeKey = 'ModeKey',
  ImageBox = 'ImageBox',
}

export enum LineBreakType {
  Justify = 'Justify',
  Center = 'Center',
  Left = 'Left',
}

export interface ElementCloneArgs {
  includeLyrics?: boolean;
}

export abstract class ScoreElement {
  abstract elementType: ElementType;
  abstract clone(args?: ElementCloneArgs): ScoreElement;
  public id: number | null = null;
  public lineBreak: boolean = false;
  public lineBreakType: LineBreakType | null = null;
  public pageBreak: boolean = false;
  public sectionName: string | null = null;

  public x: number = 0;
  public y: number = 0;
  public width: number = 0;

  public index: number = 0;

  // This is used to help force components to re-render
  public keyHelper: number = 0;
  public updated: boolean = false;

  public widthPrevious = 0;

  // Used internally, not saved
  public line: number = 0;
  public page: number = 0;

  public static isShort(measureBar: MeasureBar): boolean {
    return (
      measureBar.startsWith('MeasureBarTop') ||
      measureBar.startsWith('MeasureBarShort')
    );
  }
}

export enum AcceptsLyricsOption {
  Default = 'Default',
  Yes = 'Yes',
  No = 'No',
  MelismaOnly = 'MelismaOnly',
}

export class NoteElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Note;
  public measureNumber: MeasureNumber | null = null;
  public tie: Tie | null = null;
  public noteIndicator: boolean = false;
  public ison: Ison | null = null;
  public vareia: boolean = false;
  public koronis: boolean = false;
  public stavros: boolean = false;
  public lyrics: string = '';
  public lyricsColor: string = '#000000';
  public lyricsFontFamily: string = 'Source Serif';
  public lyricsFontSize: number = Unit.fromPt(12);
  public lyricsStrokeWidth: number = 0;
  public lyricsUseDefaultStyle: boolean = true;
  public lyricsFontStyle: string = 'normal';
  public lyricsFontWeight: string = '400';
  public lyricsTextDecoration: string = 'none';
  public acceptsLyrics: AcceptsLyricsOption = AcceptsLyricsOption.Default;
  public isMelisma: boolean = false;
  public isMelismaStart: boolean = false;
  public isHyphen: boolean = false;
  public spaceAfter: number = 0;
  public ignoreAttractions: boolean = false;

  public chromaticFthoraNote: ScaleNote | null = null;
  public secondaryChromaticFthoraNote: ScaleNote | null = null;
  public tertiaryChromaticFthoraNote: ScaleNote | null = null;

  public accidentalOffsetX: number | null = null;
  public accidentalOffsetY: number | null = null;
  public fthoraOffsetX: number | null = null;
  public fthoraOffsetY: number | null = null;
  public gorgonNeumeOffsetX: number | null = null;
  public gorgonNeumeOffsetY: number | null = null;
  public isonOffsetX: number | null = null;
  public isonOffsetY: number | null = null;
  public koronisOffsetX: number | null = null;
  public koronisOffsetY: number | null = null;
  public measureBarLeftOffsetX: number | null = null;
  public measureBarLeftOffsetY: number | null = null;
  public measureBarRightOffsetX: number | null = null;
  public measureBarRightOffsetY: number | null = null;
  public measureNumberOffsetX: number | null = null;
  public measureNumberOffsetY: number | null = null;
  public noteIndicatorOffsetX: number | null = null;
  public noteIndicatorOffsetY: number | null = null;
  public secondaryAccidentalOffsetX: number | null = null;
  public secondaryAccidentalOffsetY: number | null = null;
  public secondaryFthoraOffsetX: number | null = null;
  public secondaryFthoraOffsetY: number | null = null;
  public secondaryGorgonNeumeOffsetX: number | null = null;
  public secondaryGorgonNeumeOffsetY: number | null = null;
  public stavrosOffsetX: number | null = null;
  public stavrosOffsetY: number | null = null;
  public tertiaryAccidentalOffsetX: number | null = null;
  public tertiaryAccidentalOffsetY: number | null = null;
  public tertiaryFthoraOffsetX: number | null = null;
  public tertiaryFthoraOffsetY: number | null = null;
  public tieOffsetX: number | null = null;
  public tieOffsetY: number | null = null;
  public timeNeumeOffsetX: number | null = null;
  public timeNeumeOffsetY: number | null = null;
  public vareiaOffsetX: number | null = null;
  public vareiaOffsetY: number | null = null;
  public vocalExpressionNeumeOffsetX: number | null = null;
  public vocalExpressionNeumeOffsetY: number | null = null;

  // Re-render helpers
  public fthoraPrevious: Fthora | null = null;
  public secondaryFthoraPrevious: Fthora | null = null;
  public tertiaryFthoraPrevious: Fthora | null = null;
  public computedMeasureBarLeftPrevious: MeasureBar | null = null;
  public computedMeasureBarRightPrevious: MeasureBar | null = null;
  public computedIsonOffsetYPrevious: number | null = null;

  // Fthora helper
  public fthoraCarry: Fthora | null = null;
  public secondaryFthoraCarry: Fthora | null = null;
  public tertiaryFthoraCarry: Fthora | null = null;

  public get lyricsFont() {
    return `${this.lyricsFontStyle} normal ${this.lyricsFontWeight} ${this.lyricsFontSize}px "${this.lyricsFontFamily}"`;
  }

  public clone(args?: ElementCloneArgs) {
    const clone = new NoteElement();

    Object.assign(
      clone,
      this.getClipboardProperties(args?.includeLyrics ?? true),
    );

    return clone;
  }

  public getClipboardProperties(includeLyrics: boolean) {
    return {
      ...(includeLyrics
        ? {
            lyrics: this.lyrics,
            isHyphen: this.isHyphen,
            isMelismaStart: this.isMelismaStart,
            isMelisma: this.isMelisma,
            lyricsUseDefaultStyle: this.lyricsUseDefaultStyle,
            lyricsColor: this.lyricsColor,
            lyricsFontFamily: this.lyricsFontFamily,
            lyricsFontSize: this.lyricsFontSize,
            lyricsStrokeWidth: this.lyricsStrokeWidth,
          }
        : null),
      quantitativeNeume: this.quantitativeNeume,
      acceptsLyrics: this.acceptsLyrics,
      measureBarLeft: this.measureBarLeft,
      measureBarLeftOffsetX: this.measureBarLeftOffsetX,
      measureBarLeftOffsetY: this.measureBarLeftOffsetY,
      measureBarRight: this.measureBarRight,
      measureBarRightOffsetX: this.measureBarRightOffsetX,
      measureBarRightOffsetY: this.measureBarRightOffsetY,
      measureNumber: this.measureNumber,
      measureNumberOffsetX: this.measureNumberOffsetX,
      measureNumberOffsetY: this.measureNumberOffsetY,
      noteIndicator: this.noteIndicator,
      noteIndicatorOffsetX: this.noteIndicatorOffsetX,
      noteIndicatorOffsetY: this.noteIndicatorOffsetY,
      ison: this.ison,
      isonOffsetX: this.isonOffsetX,
      isonOffsetY: this.isonOffsetY,
      accidental: this.accidental,
      accidentalOffsetX: this.accidentalOffsetX,
      accidentalOffsetY: this.accidentalOffsetY,
      secondaryAccidental: this.secondaryAccidental,
      secondaryAccidentalOffsetX: this.secondaryAccidentalOffsetX,
      secondaryAccidentalOffsetY: this.secondaryAccidentalOffsetY,
      tertiaryAccidental: this.tertiaryAccidental,
      tertiaryAccidentalOffsetX: this.tertiaryAccidentalOffsetX,
      tertiaryAccidentalOffsetY: this.tertiaryAccidentalOffsetY,
      fthora: this.fthora,
      fthoraOffsetX: this.fthoraOffsetX,
      fthoraOffsetY: this.fthoraOffsetY,
      secondaryFthora: this.secondaryFthora,
      secondaryFthoraOffsetX: this.secondaryFthoraOffsetX,
      secondaryFthoraOffsetY: this.secondaryFthoraOffsetY,
      tertiaryFthora: this.tertiaryFthora,
      tertiaryFthoraOffsetX: this.tertiaryFthoraOffsetX,
      tertiaryFthoraOffsetY: this.tertiaryFthoraOffsetY,
      chromaticFthoraNote: this.chromaticFthoraNote,
      secondaryChromaticFthoraNote: this.secondaryChromaticFthoraNote,
      tertiaryChromaticFthoraNote: this.tertiaryChromaticFthoraNote,
      gorgonNeume: this.gorgonNeume,
      gorgonNeumeOffsetX: this.gorgonNeumeOffsetX,
      gorgonNeumeOffsetY: this.gorgonNeumeOffsetY,
      secondaryGorgonNeume: this.secondaryGorgonNeume,
      secondaryGorgonNeumeOffsetX: this.secondaryGorgonNeumeOffsetX,
      secondaryGorgonNeumeOffsetY: this.secondaryGorgonNeumeOffsetY,
      timeNeume: this.timeNeume,
      timeNeumeOffsetX: this.timeNeumeOffsetX,
      timeNeumeOffsetY: this.timeNeumeOffsetY,
      vocalExpressionNeume: this.vocalExpressionNeume,
      vocalExpressionNeumeOffsetX: this.vocalExpressionNeumeOffsetX,
      vocalExpressionNeumeOffsetY: this.vocalExpressionNeumeOffsetY,
      vareia: this.vareia,
      vareiaOffsetX: this.vareiaOffsetX,
      vareiaOffsetY: this.vareiaOffsetY,
    } as Partial<NoteElement>;
  }

  public cloneFormat() {
    return {
      lyricsColor: this.lyricsColor,
      lyricsFontFamily: this.lyricsFontFamily,
      lyricsFontSize: this.lyricsFontSize,
      lyricsStrokeWidth: this.lyricsStrokeWidth,
      lyricsUseDefaultStyle: this.lyricsUseDefaultStyle,
      lyricsFontStyle: this.lyricsFontStyle,
      lyricsFontWeight: this.lyricsFontWeight,
      lyricsTextDecoration: this.lyricsTextDecoration,
    };
  }

  public get quantitativeNeume() {
    return this._quantitativeNeume;
  }

  public set quantitativeNeume(neume: QuantitativeNeume) {
    this._quantitativeNeume = neume;
    this.replaceNeumes();

    if (getSecondaryNeume(this.quantitativeNeume) == null) {
      this._secondaryGorgonNeume = null;
      this._secondaryFthora = null;
      this._secondaryAccidental = null;
    }

    if (getTertiaryNeume(this.quantitativeNeume) == null) {
      this._tertiaryFthora = null;
      this._tertiaryAccidental = null;
    }
  }

  public get timeNeume() {
    return this._timeNeume;
  }

  public set timeNeume(neume: TimeNeume | null) {
    this._timeNeume = neume;
    this.replaceNeumes();
  }

  public get gorgonNeume() {
    return this._gorgonNeume;
  }

  public set gorgonNeume(neume: GorgonNeume | null) {
    this._gorgonNeume = neume;
    this.replaceNeumes();
  }

  public get secondaryGorgonNeume() {
    return this._secondaryGorgonNeume;
  }

  public set secondaryGorgonNeume(neume: GorgonNeume | null) {
    this._secondaryGorgonNeume = neume;
    this.replaceNeumes();
  }

  public get vocalExpressionNeume() {
    return this._vocalExpressionNeume;
  }

  public set vocalExpressionNeume(neume: VocalExpressionNeume | null) {
    this._vocalExpressionNeume = neume;
    this.replaceNeumes();
  }

  public get accidental() {
    return this._accidental;
  }

  public set accidental(neume: Accidental | null) {
    this._accidental = neume;
    this.replaceNeumes();
  }

  public get secondaryAccidental() {
    return this._secondaryAccidental;
  }

  public set secondaryAccidental(neume: Accidental | null) {
    this._secondaryAccidental = neume;
    this.replaceNeumes();
  }

  public get tertiaryAccidental() {
    return this._tertiaryAccidental;
  }

  public set tertiaryAccidental(neume: Accidental | null) {
    this._tertiaryAccidental = neume;
    this.replaceNeumes();
  }

  public get fthora() {
    return this._fthora;
  }

  public set fthora(neume: Fthora | null) {
    this._fthora = neume;
    this.replaceNeumes();
  }

  public get secondaryFthora() {
    return this._secondaryFthora;
  }

  public set secondaryFthora(neume: Fthora | null) {
    this._secondaryFthora = neume;
    this.replaceNeumes();
  }

  public get tertiaryFthora() {
    return this._tertiaryFthora;
  }

  public set tertiaryFthora(neume: Fthora | null) {
    this._tertiaryFthora = neume;
    this.replaceNeumes();
  }

  public get measureBarLeft() {
    return this._measureBarLeft;
  }

  public set measureBarLeft(measureBar: MeasureBar | null) {
    this._measureBarLeft = measureBar;
    this.replaceNeumes();
  }

  public get measureBarRight() {
    return this._measureBarRight;
  }

  public set measureBarRight(measureBar: MeasureBar | null) {
    this._measureBarRight = measureBar;
    this.replaceNeumes();
  }

  // Used for display
  public melismaText: string = '';
  public melismaOffsetTop: number = 0;
  public lyricsFontHeight: number = 0;
  public hyphenOffsets: number[] = [];
  public isFullMelisma: boolean = false;
  public melismaWidth: number = 0;
  public lyricsVerticalOffset: number = 0;
  public lyricsHorizontalOffset: number = 0;
  public neumeWidth: number = 0;
  public lyricsWidth: number = 0;
  public alignLeft: boolean = false;
  public noteIndicatorNeume: NoteIndicator | null = null;
  public scaleNotes: ScaleNote[] = [];
  public scaleNotesVirtual: ScaleNote[] = [];
  public computedMeasureBarLeft: MeasureBar | null = null;
  public computedMeasureBarRight: MeasureBar | null = null;
  public computedIsonOffsetY: number | null = null;
  public isonOffsetYBeforeAdjustment: number = 0;

  private _quantitativeNeume: QuantitativeNeume = QuantitativeNeume.Ison;
  private _timeNeume: TimeNeume | null = null;
  private _gorgonNeume: GorgonNeume | null = null;
  private _secondaryGorgonNeume: GorgonNeume | null = null;
  private _vocalExpressionNeume: VocalExpressionNeume | null = null;
  private _fthora: Fthora | null = null;
  private _secondaryFthora: Fthora | null = null;
  private _tertiaryFthora: Fthora | null = null;
  private _accidental: Accidental | null = null;
  private _secondaryAccidental: Accidental | null = null;
  private _tertiaryAccidental: Accidental | null = null;
  private _measureBarLeft: MeasureBar | null = null;
  private _measureBarRight: MeasureBar | null = null;

  private replaceNeumes() {
    this.replaceQuantitativeNeumes();
    this.replaceGorgons();
    this.replaceTimeNeumes();
    this.replaceVocalExpressions();
    this.replaceFthora();
    this.replaceMeasureBars();
  }

  private replaceGorgons() {
    if (this.gorgonNeume) {
      const replacements = getGorgonReplacements(this.gorgonNeume);

      if (replacements) {
        const replacement =
          replacements.find(
            (x) =>
              x.isPairedWith && x.isPairedWith.includes(this.quantitativeNeume),
          ) ||
          replacements.find(
            (x) =>
              x.isNotPairedWith &&
              !x.isNotPairedWith.includes(this.quantitativeNeume),
          );

        if (replacement) {
          this.gorgonNeume = replacement.replaceWith;
        }
      }
    }
  }

  private replaceTimeNeumes() {
    if (this.timeNeume) {
      const replacements = getTimeReplacements(this.timeNeume);

      if (replacements) {
        const replacement =
          replacements.find(
            (x) =>
              x.isPairedWith && x.isPairedWith.includes(this.quantitativeNeume),
          ) ||
          replacements.find(
            (x) =>
              x.isNotPairedWith &&
              !x.isNotPairedWith.includes(this.quantitativeNeume),
          );

        if (replacement) {
          this.timeNeume = replacement.replaceWith;
        }
      }
    }
  }

  private replaceFthora() {
    if (this.fthora) {
      const replacements = getFthoraReplacements(this.fthora);

      if (replacements) {
        const replacement =
          replacements.find(
            (x) =>
              x.isPairedWith && x.isPairedWith.includes(this.quantitativeNeume),
          ) ||
          replacements.find(
            (x) =>
              x.isNotPairedWith &&
              !x.isNotPairedWith.includes(this.quantitativeNeume),
          );

        if (replacement) {
          this.fthora = replacement.replaceWith;
        }
      }
    }
  }

  private replaceVocalExpressions() {
    if (this.vocalExpressionNeume) {
      const replacements = getVocalExpressionReplacements(
        this.vocalExpressionNeume,
      );

      if (replacements) {
        const replacement =
          replacements.find(
            (x) =>
              x.isPairedWith && x.isPairedWith.includes(this.quantitativeNeume),
          ) ||
          replacements.find(
            (x) =>
              x.isNotPairedWith &&
              !x.isNotPairedWith.includes(this.quantitativeNeume),
          );

        if (replacement) {
          this.vocalExpressionNeume = replacement.replaceWith;
        }
      }
    }
  }

  private replaceQuantitativeNeumes() {
    const replacements = getQuantitativeReplacements(this.quantitativeNeume);

    if (replacements) {
      if (this.vocalExpressionNeume) {
        const replacement =
          replacements.find(
            (x) =>
              x.isPairedWithVocalExpression &&
              x.isPairedWithVocalExpression.includes(
                this.vocalExpressionNeume!,
              ),
          ) ||
          replacements.find(
            (x) =>
              x.isNotPairedWithVocalExpression &&
              !x.isNotPairedWithVocalExpression.includes(
                this.vocalExpressionNeume!,
              ),
          );

        if (replacement) {
          this.quantitativeNeume = replacement.replaceWith!;
        }
      }
    }
  }

  private replaceMeasureBars() {
    if (
      this.measureBarLeft &&
      ScoreElement.isShort(this.measureBarLeft) &&
      isMeasureBarAbove(this.quantitativeNeume) &&
      measureBarLeftToAbove.has(this.measureBarLeft)
    ) {
      this.measureBarLeft = measureBarLeftToAbove.get(this.measureBarLeft)!;
    } else if (
      this.measureBarLeft &&
      ScoreElement.isShort(this.measureBarLeft) &&
      !isMeasureBarAbove(this.quantitativeNeume) &&
      measureBarAboveToLeft.has(this.measureBarLeft)
    ) {
      this.measureBarLeft = measureBarAboveToLeft.get(this.measureBarLeft)!;
    }
  }
}

export class MartyriaElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Martyria;
  public auto: boolean = true;
  public note: Note = Note.Pa;
  public rootSign: RootSign = RootSign.Alpha;
  public rootSignOverride: RootSign | null = null;
  public scale: Scale = Scale.Diatonic;
  public fthora: Fthora | null = null;
  public chromaticFthoraNote: ScaleNote | null = null;
  public tempoLeft: TempoSign | null = null;
  public tempo: TempoSign | null = null;
  public tempoRight: TempoSign | null = null;
  public quantitativeNeume: QuantitativeNeume | null = null;
  public alignRight: boolean = false;
  public bpm: number = 0;
  public spaceAfter: number = 0;
  public verticalOffset: number = 0;

  public error: boolean = false;

  public get measureBarLeft() {
    return this._measureBarLeft;
  }

  public set measureBarLeft(measureBar: MeasureBar | null) {
    this._measureBarLeft = measureBar;
    this.replaceMeasureBars();
  }

  public get measureBarRight() {
    return this._measureBarRight;
  }

  public set measureBarRight(measureBar: MeasureBar | null) {
    this._measureBarRight = measureBar;
    this.replaceMeasureBars();
  }

  // Used for display
  public neumeWidth: number = 0;
  public padding: number = 0;

  private _measureBarLeft: MeasureBar | null = null;
  private _measureBarRight: MeasureBar | null = null;

  private replaceMeasureBars() {
    if (
      this.measureBarLeft &&
      ScoreElement.isShort(this.measureBarLeft) &&
      measureBarLeftToAbove.has(this.measureBarLeft)
    ) {
      this.measureBarLeft = measureBarLeftToAbove.get(this.measureBarLeft)!;
    } else if (
      this.measureBarLeft &&
      !ScoreElement.isShort(this.measureBarLeft) &&
      measureBarAboveToLeft.has(this.measureBarLeft)
    ) {
      this.measureBarLeft = measureBarAboveToLeft.get(this.measureBarLeft)!;
    }
  }

  // Re-render helpers
  public notePrevious: Note = Note.Pa;
  public rootSignPrevious: RootSign = RootSign.Alpha;

  // Fthora helper
  public fthoraCarry: Fthora | null = null;

  public clone() {
    const clone = new MartyriaElement();

    Object.assign(clone, this.getClipboardProperties());

    return clone;
  }

  public getClipboardProperties() {
    return {
      auto: this.auto,
      note: this.note,
      rootSign: this.rootSign,
      rootSignOverride: this.rootSignOverride,
      scale: this.scale,
      alignRight: this.alignRight,
      measureBarLeft: this.measureBarLeft,
      measureBarRight: this.measureBarRight,
      fthora: this.fthora,
      chromaticFthoraNote: this.chromaticFthoraNote,
      tempo: this.tempo,
      bpm: this.bpm,
    } as Partial<MartyriaElement>;
  }
}

export class TempoElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Tempo;
  public neume: TempoSign = TempoSign.Moderate;
  public bpm: number = TempoElement.getDefaultBpm(TempoSign.Moderate);
  public spaceAfter: number = 0;

  // Used for display
  public neumeWidth: number = 0;

  public clone() {
    const clone = new TempoElement();

    Object.assign(clone, this.getClipboardProperties());

    return clone;
  }

  public getClipboardProperties() {
    return {
      neume: this.neume,
      bpm: this.bpm,
    } as Partial<TempoElement>;
  }

  public static tempoToBpmMap = new Map<TempoSign, number>([
    [TempoSign.VerySlow, 40], // < 56 triargon?
    [TempoSign.Slower, 56], // 56 - 80 diargon
    [TempoSign.Slow, 80], // 80 - 100 hemiolion
    [TempoSign.Moderate, 100], // 100 - 168 argon
    [TempoSign.Medium, 130], // 130 argon + gorgon
    [TempoSign.Quick, 168], // 168 - 208 gorgon
    [TempoSign.Quicker, 208], // 208+ digorgon
    [TempoSign.VeryQuick, 250], // unattested? trigorgon

    [TempoSign.VerySlowAbove, 40], // < 56 triargon?
    [TempoSign.SlowerAbove, 56], // 56 - 80 diargon
    [TempoSign.SlowAbove, 80], // 80 - 100 hemiolion
    [TempoSign.ModerateAbove, 100], // 100 - 168 argon
    [TempoSign.MediumAbove, 130], // 130 argon + gorgon
    [TempoSign.QuickAbove, 168], // 168 - 208 gorgon
    [TempoSign.QuickerAbove, 208], // 208+ digorgon
    [TempoSign.VeryQuickAbove, 250], // unattested? trigorgon
  ]);

  public static getDefaultBpm(neume: TempoSign) {
    return TempoElement.tempoToBpmMap.get(neume)!;
  }
}

export class EmptyElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Empty;

  public height: number = 0;

  public clone() {
    return new EmptyElement();
  }
}

export enum TextBoxAlignment {
  Center = 'center',
  Left = 'left',
  Right = 'right',
}

export class TextBoxElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.TextBox;
  public alignment: TextBoxAlignment = TextBoxAlignment.Left;
  public color: string = '#000000';
  public content: string = '';
  public contentBottom: string = '';
  public contentLeft: string = '';
  public contentCenter: string = '';
  public contentRight: string = '';
  public fontSize: number = 16;
  public fontFamily: string = 'Source Serif';
  public strokeWidth: number = 0;
  public multipanel: boolean = false;
  public inline: boolean = false;
  public bold: boolean = false;
  public italic: boolean = false;
  public underline: boolean = false;
  public lineHeight: number | null = null;
  public useDefaultStyle: boolean = true;
  public height: number = 20;
  public customWidth: number | null = null;
  public customHeight: number | null = null;
  public marginTop: number = 0;
  public marginBottom: number = 0;
  public fillWidth: boolean = false;

  // Values computed by the layout service
  public computedFontFamily: string = '';
  public computedFontSize: number = Unit.fromPt(20);
  public computedFontWeight: string = '400';
  public computedFontStyle: string = 'normal';
  public computedColor: string = '#000000';
  public computedStrokeWidth: number = 0;
  public computedLineHeight: number | null = null;
  public minHeight: number = 10;

  // Re-render helpers
  public heightPrevious: number = 0;
  public computedFontFamilyPrevious: string = '';
  public computedFontSizePrevious: number = Unit.fromPt(20);
  public computedFontWeightPrevious: string = '400';
  public computedFontStylePrevious: string = 'normal';
  public computedColorPrevious: string = '#000000';
  public computedStrokeWidthPrevious: number = 0;
  public computedLineHeightPrevious: number | null = null;

  public get computedFont() {
    return `${this.computedFontStyle} normal ${this.computedFontWeight} ${this.computedFontSize}px "${this.computedFontFamily}"`;
  }

  public clone() {
    const clone = new TextBoxElement();

    Object.assign(clone, this.getClipboardProperties());

    return clone;
  }

  public getClipboardProperties() {
    return {
      alignment: this.alignment,
      color: this.color,
      content: this.content,
      contentLeft: this.contentLeft,
      contentCenter: this.contentCenter,
      contentRight: this.contentRight,
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
      strokeWidth: this.strokeWidth,
      customWidth: this.customWidth,
      customHeight: this.customHeight,
      fillWidth: this.fillWidth,
      marginTop: this.marginTop,
      marginBottom: this.marginBottom,
      inline: this.inline,
      bold: this.bold,
      italic: this.italic,
      underline: this.underline,
      useDefaultStyle: this.useDefaultStyle,
      multipanel: this.multipanel,
    } as Partial<TextBoxElement>;
  }

  public cloneFormat() {
    const format = this.getClipboardProperties();
    delete format.content;
    return format;
  }
}

export class RichTextBoxElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.RichTextBox;
  public content: string = '';
  public contentBottom: string = '';
  public contentLeft: string = '';
  public contentRight: string = '';
  public contentCenter: string = '';
  public multipanel: boolean = false;
  public rtl: boolean = false;
  public inline: boolean = false;
  public centerOnPage: boolean = false;
  public modeChange: boolean = false;
  public modeChangePhysicalNote: ScaleNote = ScaleNote.Pa;
  public modeChangeScale: Scale = Scale.Diatonic;
  public modeChangeVirtualNote: ScaleNote | null = null;
  public modeChangeIgnoreAttractions: boolean = false;
  public modeChangePermanentEnharmonicZo: boolean = false;
  public modeChangeBpm: number = 120;

  public height: number = 20;
  public customWidth: number | null = null;
  public marginTop: number = 0;
  public marginBottom: number = 0;
  public offsetYTop: number = 0;
  public offsetYBottom: number = 0;

  // Values computed by the layout service
  public defaultLyricsFontHeight: number = 0;
  public defaultNeumeFontAscent: number = 0;
  public oligonMidpoint: number = 0;

  public clone() {
    const clone = new RichTextBoxElement();

    Object.assign(clone, this.getClipboardProperties());

    return clone;
  }

  public getClipboardProperties() {
    return {
      content: this.content,
      contentBottom: this.contentBottom,
      contentLeft: this.contentLeft,
      contentRight: this.contentRight,
      contentCenter: this.contentCenter,
      rtl: this.rtl,
      multipanel: this.multipanel,
      inline: this.inline,
      centerOnPage: this.centerOnPage,
      height: this.height,
      customWidth: this.customWidth,
      marginBottom: this.marginBottom,
      marginTop: this.marginTop,
      offsetYBottom: this.offsetYBottom,
      offsetYTop: this.offsetYTop,
      modeChange: this.modeChange,
      modeChangePhysicalNote: this.modeChangePhysicalNote,
      modeChangeScale: this.modeChangeScale,
      modeChangeVirtualNote: this.modeChangeVirtualNote,
      modeChangeIgnoreAttractions: this.modeChangeIgnoreAttractions,
      modeChangePermanentEnharmonicZo: this.modeChangePermanentEnharmonicZo,
      modeChangeBpm: this.modeChangeBpm,
    } as Partial<RichTextBoxElement>;
  }
}

export class ModeKeyElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.ModeKey;
  public templateId: number | null = null;
  public alignment: TextBoxAlignment = TextBoxAlignment.Center;
  public mode: number = 1;
  public scale: Scale = Scale.Diatonic;
  public scaleNote: ScaleNote = ScaleNote.Pa;
  public fthora: Fthora | null = null;
  public description: string = '';
  public tempo: TempoSign | null = null;
  public tempoAlignRight: boolean = false;
  public martyria: ModeSign = ModeSign.Alpha;
  public note: ModeSign | null = null;
  public note2: ModeSign | null = null;
  public fthoraAboveNote: Fthora | null = null;
  public fthoraAboveNote2: Fthora | null = null;
  public fthoraAboveQuantitativeNeumeRight: Fthora | null = null;
  public quantitativeNeumeRight: QuantitativeNeume | null = null;
  public quantitativeNeumeAboveNote: ModeSign | null = null;
  public quantitativeNeumeAboveNote2: ModeSign | null = null;
  public color: string = '#000000';
  public fontSize: number = Unit.fromPt(20);
  public strokeWidth: number = 0;
  public heightAdjustment: number = 0;
  public bpm: number = 120;
  public useDefaultStyle: boolean = true;
  public ignoreAttractions: boolean = false;
  public permanentEnharmonicZo: boolean = false;
  public ambitusLowNote: Note = Note.Pa;
  public ambitusLowRootSign: RootSign = RootSign.Alpha;
  public ambitusHighNote: Note = Note.Pa;
  public ambitusHighRootSign: RootSign = RootSign.Alpha;
  public showAmbitus: boolean = false;
  public height: number = Unit.fromPt(37);
  public marginTop: number = 0;
  public marginBottom: number = 0;

  // Values computed by the layout service
  public computedFontFamily: string = '';
  public computedFontSize: number = Unit.fromPt(20);
  public computedColor: string = '#000000';
  public computedStrokeWidth: number = 0;
  public computedHeightAdjustment: number = 0;

  // Re-render helpers
  public computedFontFamilyPrevious: string = '';
  public computedFontSizePrevious: number = Unit.fromPt(20);
  public computedColorPrevious: string = '#000000';
  public computedStrokeWidthPrevious: number = 0;
  public computedHeightAdjustmentPrevious: number = 0;

  public get isPlagal() {
    return this.mode > 4 && this.mode !== 7;
  }

  public get isVarys() {
    return this.mode === 7;
  }

  public static createFromTemplate(
    template: ModeKeyTemplate,
    useOptionalDiatonicFthoras?: boolean,
    alignment?: TextBoxAlignment,
  ) {
    const element = new ModeKeyElement();

    element.templateId = template.id;
    element.mode = template.mode;
    element.scale = template.scale;
    element.scaleNote = template.scaleNote;
    element.fthora = template.fthora ?? null;
    element.description = template.description;
    element.martyria = template.martyria;
    element.fthoraAboveNote = template.fthoraAboveNote || null;
    element.fthoraAboveNote2 = template.fthoraAboveNote2 || null;
    element.fthoraAboveQuantitativeNeumeRight =
      template.fthoraAboveQuantitativeNeumeRight || null;
    element.note = template.note || null;
    element.note2 = template.note2 || null;
    element.quantitativeNeumeAboveNote =
      template.quantitativeNeumeAboveNote || null;
    element.quantitativeNeumeAboveNote2 =
      template.quantitativeNeumeAboveNote2 || null;
    element.quantitativeNeumeRight = template.quantitativeNeumeRight || null;
    element.alignment = alignment || TextBoxAlignment.Center;

    if (
      useOptionalDiatonicFthoras &&
      template.optionalFthoras?.fthoraAboveNote != null
    ) {
      element.fthoraAboveNote = template.optionalFthoras.fthoraAboveNote;
    }

    element.ignoreAttractions = false;
    element.permanentEnharmonicZo = false;

    return element;
  }

  public clone() {
    const clone = new ModeKeyElement();

    Object.assign(clone, this.getClipboardProperties());

    return clone;
  }

  public getClipboardProperties() {
    return {
      alignment: this.alignment,
      color: this.color,
      templateId: this.templateId,
      mode: this.mode,
      scale: this.scale,
      scaleNote: this.scaleNote,
      fthora: this.fthora,
      martyria: this.martyria,
      fthoraAboveNote: this.fthoraAboveNote,
      fthoraAboveNote2: this.fthoraAboveNote2,
      fthoraAboveQuantitativeNeumeRight: this.fthoraAboveQuantitativeNeumeRight,
      note: this.note,
      note2: this.note2,
      quantitativeNeumeAboveNote: this.quantitativeNeumeAboveNote,
      quantitativeNeumeAboveNote2: this.quantitativeNeumeAboveNote2,
      quantitativeNeumeRight: this.quantitativeNeumeRight,
      fontSize: this.fontSize,
      strokeWidth: this.strokeWidth,
      heightAdjustment: this.heightAdjustment,
      marginBottom: this.marginBottom,
      marginTop: this.marginTop,
      useDefaultStyle: this.useDefaultStyle,
      ignoreAttractions: this.ignoreAttractions,
      permanentEnharmonicZo: this.permanentEnharmonicZo,
      showAmbitus: this.showAmbitus,
    } as Partial<ModeKeyElement>;
  }
}

export class DropCapElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.DropCap;
  public content: string = 'A';
  public fontFamily: string = 'Source Serif';
  public fontSize: number = Unit.fromPt(60);
  public fontWeight: string = '400';
  public fontStyle: string = 'normal';
  public lineHeight: number | null = null;
  public strokeWidth: number = 0;
  public color: string = '#000000';
  public useDefaultStyle: boolean = true;
  public customWidth: number | null = null;
  public lineSpan: number = 1;

  // Values computed by the layout service
  public computedFontFamily: string = '';
  public computedFontSize: number = Unit.fromPt(60);
  public computedFontWeight: string = '400';
  public computedFontStyle: string = 'normal';
  public computedColor: string = '#000000';
  public computedStrokeWidth: number = 0;
  public computedLineHeight: number | null = null;
  public computedLineSpan: number = 1;
  public contentWidth: number = 0;

  // Re-render helpers
  public computedFontFamilyPrevious: string = '';
  public computedFontSizePrevious: number = Unit.fromPt(60);
  public computedFontWeightPrevious: string = '400';
  public computedFontStylePrevious: string = 'normal';
  public computedColorPrevious: string = '#000000';
  public computedStrokeWidthPrevious: number = 0;
  public computedLineHeightPrevious: number | null = null;

  public get computedFont() {
    return `${this.computedFontStyle} normal ${this.computedFontWeight} ${this.computedFontSize}px "${this.computedFontFamily}"`;
  }

  public clone() {
    const clone = new DropCapElement();

    Object.assign(clone, this.getClipboardProperties());

    return clone;
  }

  public getClipboardProperties() {
    return {
      color: this.color,
      content: this.content,
      fontSize: this.fontSize,
      fontStyle: this.fontStyle,
      fontFamily: this.fontFamily,
      fontWeight: this.fontWeight,
      lineHeight: this.lineHeight,
      strokeWidth: this.strokeWidth,
      customWidth: this.customWidth,
      useDefaultStyle: this.useDefaultStyle,
    } as Partial<DropCapElement>;
  }
}

export class ImageBoxElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.ImageBox;

  public data: string = '';

  public imageHeight: number = 100;
  public imageWidth: number = 100;
  public inline: boolean = false;
  public lockAspectRatio: boolean = true;
  public alignment: TextBoxAlignment = TextBoxAlignment.Center;

  public get aspectRatio() {
    return this.imageWidth / this.imageHeight;
  }

  public clone() {
    const clone = new ImageBoxElement();

    Object.assign(clone, this.getClipboardProperties());

    return clone;
  }

  public getClipboardProperties() {
    return {
      data: this.data,
      imageHeight: this.imageHeight,
      imageWidth: this.imageWidth,
      inline: this.inline,
      lockAspectRatio: this.lockAspectRatio,
      alignment: this.alignment,
    } as Partial<ImageBoxElement>;
  }
}

export class ScoreElementOffset {
  public x: number = 0;
  public y: number = 0;
}
