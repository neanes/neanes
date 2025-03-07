import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  ModeSign,
  Note,
  QuantitativeNeume,
  RootSign,
  TempoSign,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/save/v1/Neumes';
import { Unit } from '@/utils/Unit';

import { Scale, ScaleNote } from './Scales';

export enum ElementType {
  Note = 'Note',
  Martyria = 'Martyria',
  Empty = 'Empty',
  TextBox = 'TextBox',
  RichTextBox = 'RichTextBox',
  DropCap = 'DropCap',
  ModeKey = 'ModeKey',
  Tempo = 'Tempo',
  ImageBox = 'ImageBox',
}

export enum LineBreakType {
  Justify = 'Justify',
  Center = 'Center',
  Left = 'Left',
}

export abstract class ScoreElement {
  abstract elementType: ElementType;
  public lineBreak: boolean | undefined = undefined;
  public pageBreak: boolean | undefined = undefined;
  public lineBreakType: LineBreakType | undefined = undefined;
  public sectionName: string | undefined = undefined;
}

export enum AcceptsLyricsOption {
  Default = 'Default',
  Yes = 'Yes',
  No = 'No',
  MelismaOnly = 'MelismaOnly',
}

export class NoteElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Note;
  public quantitativeNeume: QuantitativeNeume = QuantitativeNeume.Ison;
  public timeNeume: TimeNeume | undefined = undefined;
  public gorgonNeume: GorgonNeume | undefined = undefined;
  public secondaryGorgonNeume: GorgonNeume | undefined = undefined;
  public vocalExpressionNeume: VocalExpressionNeume | undefined = undefined;
  public fthora: Fthora | undefined = undefined;
  public secondaryFthora: Fthora | undefined = undefined;
  public tertiaryFthora: Fthora | undefined = undefined;
  public chromaticFthoraNote: ScaleNote | undefined = undefined;
  public secondaryChromaticFthoraNote: ScaleNote | undefined = undefined;
  public tertiaryChromaticFthoraNote: ScaleNote | undefined = undefined;
  public accidental: Accidental | undefined = undefined;
  public secondaryAccidental: Accidental | undefined = undefined;
  public tertiaryAccidental: Accidental | undefined = undefined;
  public measureBarLeft: MeasureBar | undefined = undefined;
  public measureBarRight: MeasureBar | undefined = undefined;
  // Deprecated
  // New name: measureBarRight
  public measureBar: MeasureBar | undefined = undefined;
  public measureNumber: MeasureNumber | undefined = undefined;
  public noteIndicator: boolean | undefined = undefined;
  public ison: Ison | undefined = undefined;
  public tie: Tie | undefined = undefined;
  public vareia: boolean | undefined = undefined;
  public koronis: boolean | undefined = undefined;
  public stavros: boolean | undefined = undefined;
  public lyrics: string | undefined = undefined;
  public lyricsColor: string | undefined = undefined;
  public lyricsFontFamily: string | undefined = undefined;
  public lyricsFontSize: number | undefined = undefined;
  public lyricsStrokeWidth: number | undefined = undefined;
  public lyricsFontStyle: string | undefined = undefined;
  public lyricsFontWeight: string | undefined = undefined;
  public lyricsTextDecoration: string | undefined = undefined;
  public lyricsUseDefaultStyle: boolean | undefined = undefined;
  public acceptsLyrics: AcceptsLyricsOption | undefined = undefined;
  public isMelisma: boolean | undefined = undefined;
  public isMelismaStart: boolean | undefined = undefined;
  public isHyphen: boolean | undefined = undefined;
  public spaceAfter: number | undefined = undefined;
  public ignoreAttractions: boolean | undefined = undefined;

  public accidentalOffsetX: number | undefined = undefined;
  public accidentalOffsetY: number | undefined = undefined;
  public fthoraOffsetX: number | undefined = undefined;
  public fthoraOffsetY: number | undefined = undefined;
  public gorgonNeumeOffsetX: number | undefined = undefined;
  public gorgonNeumeOffsetY: number | undefined = undefined;
  public isonOffsetX: number | undefined = undefined;
  public isonOffsetY: number | undefined = undefined;
  public koronisOffsetX: number | undefined = undefined;
  public koronisOffsetY: number | undefined = undefined;
  public measureBarLeftOffsetX: number | undefined = undefined;
  public measureBarLeftOffsetY: number | undefined = undefined;
  public measureBarRightOffsetX: number | undefined = undefined;
  public measureBarRightOffsetY: number | undefined = undefined;
  public measureNumberOffsetX: number | undefined = undefined;
  public measureNumberOffsetY: number | undefined = undefined;
  public noteIndicatorOffsetX: number | undefined = undefined;
  public noteIndicatorOffsetY: number | undefined = undefined;
  public secondaryAccidentalOffsetX: number | undefined = undefined;
  public secondaryAccidentalOffsetY: number | undefined = undefined;
  public secondaryFthoraOffsetX: number | undefined = undefined;
  public secondaryFthoraOffsetY: number | undefined = undefined;
  public secondaryGorgonNeumeOffsetX: number | undefined = undefined;
  public secondaryGorgonNeumeOffsetY: number | undefined = undefined;
  public stavrosOffsetX: number | undefined = undefined;
  public stavrosOffsetY: number | undefined = undefined;
  public tertiaryAccidentalOffsetX: number | undefined = undefined;
  public tertiaryAccidentalOffsetY: number | undefined = undefined;
  public tertiaryFthoraOffsetX: number | undefined = undefined;
  public tertiaryFthoraOffsetY: number | undefined = undefined;
  public tieOffsetX: number | undefined = undefined;
  public tieOffsetY: number | undefined = undefined;
  public timeNeumeOffsetX: number | undefined = undefined;
  public timeNeumeOffsetY: number | undefined = undefined;
  public vareiaOffsetX: number | undefined = undefined;
  public vareiaOffsetY: number | undefined = undefined;
  public vocalExpressionNeumeOffsetX: number | undefined = undefined;
  public vocalExpressionNeumeOffsetY: number | undefined = undefined;
}

export class MartyriaElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Martyria;
  public auto: boolean | undefined = undefined;
  public note: Note = Note.Pa;
  public rootSign: RootSign = RootSign.Alpha;
  public rootSignOverride: RootSign | undefined = undefined;
  public scale: Scale = Scale.Diatonic;
  public fthora: Fthora | undefined = undefined;
  public chromaticFthoraNote: ScaleNote | undefined = undefined;
  public tempoLeft: TempoSign | undefined = undefined;
  public tempo: TempoSign | undefined = undefined;
  public tempoRight: TempoSign | undefined = undefined;
  public measureBarLeft: MeasureBar | undefined = undefined;
  public measureBarRight: MeasureBar | undefined = undefined;
  // Deprecated
  // New name: measureBarRight
  public measureBar: MeasureBar | undefined = undefined;
  public alignRight: boolean | undefined = undefined;
  public bpm: number | undefined = undefined;
  public spaceAfter: number | undefined = undefined;
  public verticalOffset: number | undefined = undefined;
}

export class TempoElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Tempo;
  public neume: TempoSign = TempoSign.Moderate;
  public bpm: number = 0;
  public spaceAfter: number | undefined = undefined;

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
  public color: string = '#000000';
  public content: string = '';
  public contentLeft: string = '';
  public contentCenter: string = '';
  public contentRight: string = '';
  public fontSize: number = 16;
  public fontFamily: string = 'Omega';
  public strokeWidth: number = 0;
  public multipanel: boolean | undefined = undefined;
  public inline: boolean | undefined = undefined;
  public bold: boolean | undefined = undefined;
  public italic: boolean | undefined = undefined;
  public underline: boolean | undefined = undefined;
  public lineHeight: number | undefined = undefined;
  public height: number = 20;
  public customWidth: number | undefined = undefined;
  public customHeight: number | undefined = undefined;
  public marginTop: number | undefined = undefined;
  public marginBottom: number | undefined = undefined;
  public useDefaultStyle: boolean | undefined = undefined;
}

export class RichTextBoxElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.RichTextBox;
  public content: string = '';
  public contentLeft: string = '';
  public contentRight: string = '';
  public contentCenter: string = '';
  public multipanel: boolean | undefined = undefined;
  public rtl: boolean | undefined = undefined;
  public height: number = 20;
  public marginTop: number | undefined = undefined;
  public marginBottom: number | undefined = undefined;
}

export class ModeKeyElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.ModeKey;
  public templateId: number | undefined = undefined;
  public alignment: TextBoxAlignment = TextBoxAlignment.Center;
  public mode: number = 1;
  public scale: Scale = Scale.Diatonic;
  public scaleNote: ScaleNote = ScaleNote.Pa;
  public fthora: Fthora | undefined = undefined;
  public tempo: TempoSign | undefined = undefined;
  public tempoAlignRight: boolean | undefined = undefined;
  public martyria: ModeSign = ModeSign.Alpha;
  public note: ModeSign | undefined = undefined;
  public note2: ModeSign | undefined = undefined;
  public fthoraAboveNote: Fthora | undefined = undefined;
  public fthoraAboveNote2: Fthora | undefined = undefined;
  public fthoraAboveQuantitativeNeumeRight: Fthora | undefined = undefined;
  public quantitativeNeumeRight: QuantitativeNeume | undefined = undefined;
  public quantitativeNeumeAboveNote: ModeSign | undefined = undefined;
  public quantitativeNeumeAboveNote2: ModeSign | undefined = undefined;
  public color: string = '#000000';
  public fontSize: number = 16;
  public strokeWidth: number = 0;
  public height: number = 20;
  public heightAdjustment: number = 0;
  public marginTop: number | undefined = undefined;
  public marginBottom: number | undefined = undefined;
  public bpm: number = 120;
  public useDefaultStyle: boolean | undefined = undefined;
  public ignoreAttractions: boolean | undefined = undefined;
  public permanentEnharmonicZo: boolean | undefined = undefined;
  public ambitusLowNote: Note = Note.Pa;
  public ambitusLowRootSign: RootSign = RootSign.Alpha;
  public ambitusHighNote: Note = Note.Pa;
  public ambitusHighRootSign: RootSign = RootSign.Alpha;
  public showAmbitus: boolean | undefined = undefined;
}

export class DropCapElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.DropCap;
  public content: string = 'A';
  public fontFamily: string = 'Athonite';
  public fontSize: number = Unit.fromPt(60);
  public fontWeight: string = '400';
  public fontStyle: string = 'normal';
  public lineHeight: number | undefined = undefined;
  public strokeWidth: number = 0;
  public color: string = '#000000';
  public useDefaultStyle: boolean | undefined = undefined;
  public customWidth: number | undefined = undefined;
  public lineSpan: number = 1;
}

export class ImageBoxElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.ImageBox;

  public data: string = '';

  public imageHeight: number = 0;
  public imageWidth: number = 0;
  public inline: boolean | undefined = undefined;
  public lockAspectRatio: boolean | undefined = undefined;
  public alignment: TextBoxAlignment = TextBoxAlignment.Left;
}

export class ScoreElementOffset {
  public x: number = 0;
  public y: number = 0;
}
