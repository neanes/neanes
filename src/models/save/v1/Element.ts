import {
  TimeNeume,
  GorgonNeume,
  QuantitativeNeume,
  Note,
  RootSign,
  VocalExpressionNeume,
  Fthora,
  Accidental,
  ModeSign,
  TempoSign,
  MeasureBar,
  MeasureNumber,
  NoteIndicator,
  Ison,
} from '@/models/save/v1/Neumes';
import { Scale, ScaleNote } from './Scales';

export enum ElementType {
  Note = 'Note',
  Martyria = 'Martyria',
  Empty = 'Empty',
  TextBox = 'TextBox',
  DropCap = 'DropCap',
  ModeKey = 'ModeKey',
  Tempo = 'Tempo',
}

export abstract class ScoreElement {
  abstract elementType: ElementType;
  public lineBreak: boolean | undefined = undefined;
  public pageBreak: boolean | undefined = undefined;
  public justify: boolean | undefined = undefined;
}

export class NoteElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Note;
  public quantitativeNeume: QuantitativeNeume = QuantitativeNeume.Ison;
  public timeNeume: TimeNeume | undefined = undefined;
  public gorgonNeume: GorgonNeume | undefined = undefined;
  public secondaryGorgonNeume: GorgonNeume | undefined = undefined;
  public vocalExpressionNeume: VocalExpressionNeume | undefined = undefined;
  public fthora: Fthora | undefined = undefined;
  public chromaticFthoraNote: ScaleNote | undefined = undefined;
  public accidental: Accidental | undefined = undefined;
  public measureBarLeft: MeasureBar | undefined = undefined;
  public measureBarRight: MeasureBar | undefined = undefined;
  // Deprecated
  // New name: measureBarRight
  public measureBar: MeasureBar | undefined = undefined;
  public measureNumber: MeasureNumber | undefined = undefined;
  public noteIndicator: boolean | undefined = undefined;
  public ison: Ison | undefined = undefined;
  public vareia: boolean | undefined = undefined;
  public lyrics: string | undefined = undefined;
  public isMelisma: boolean | undefined = undefined;
  public isMelismaStart: boolean | undefined = undefined;
  public isHyphen: boolean | undefined = undefined;
  public spaceAfter: number = 0;
  public ignoreAttractions: boolean | undefined = undefined;

  public accidentalOffsetX: number | undefined = undefined;
  public accidentalOffsetY: number | undefined = undefined;
  public fthoraOffsetX: number | undefined = undefined;
  public fthoraOffsetY: number | undefined = undefined;
  public gorgonNeumeOffsetX: number | undefined = undefined;
  public gorgonNeumeOffsetY: number | undefined = undefined;
  public isonOffsetX: number | undefined = undefined;
  public isonOffsetY: number | undefined = undefined;
  public measureBarLeftOffsetX: number | undefined = undefined;
  public measureBarLeftOffsetY: number | undefined = undefined;
  public measureBarRightOffsetX: number | undefined = undefined;
  public measureBarRightOffsetY: number | undefined = undefined;
  public measureNumberOffsetX: number | undefined = undefined;
  public measureNumberOffsetY: number | undefined = undefined;
  public noteIndicatorOffsetX: number | undefined = undefined;
  public noteIndicatorOffsetY: number | undefined = undefined;
  public secondaryGorgonNeumeOffsetX: number | undefined = undefined;
  public secondaryGorgonNeumeOffsetY: number | undefined = undefined;
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
  public scale: Scale = Scale.Diatonic;
  public fthora: Fthora | undefined = undefined;
  public chromaticFthoraNote: ScaleNote | undefined = undefined;
  public tempo: TempoSign | undefined = undefined;
  public measureBarLeft: MeasureBar | undefined = undefined;
  public measureBarRight: MeasureBar | undefined = undefined;
  // Deprecated
  // New name: measureBarRight
  public measureBar: MeasureBar | undefined = undefined;
  public alignRight: boolean | undefined = undefined;
  public bpm: number = 0;
  public spaceAfter: number = 0;
}

export class TempoElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Tempo;
  public neume: TempoSign = TempoSign.Moderate;
  public bpm: number = 0;
  public spaceAfter: number = 0;

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
  public fontSize: number = 16;
  public fontFamily: string = 'Omega';
  public strokeWidth: number = 0;
  public inline: boolean | undefined = undefined;
  public bold: boolean | undefined = undefined;
  public italic: boolean | undefined = undefined;
  public underline: boolean | undefined = undefined;
  public height: number = 20;
  public useDefaultStyle: boolean | undefined = undefined;
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
  public bpm: number = 120;
  public useDefaultStyle: boolean | undefined = undefined;
  public ignoreAttractions: boolean | undefined = undefined;
  public permanentEnharmonicZo: boolean | undefined = undefined;
}

export class DropCapElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.DropCap;
  public content: string = 'A';
  public fontFamily: string | undefined = undefined;
  public fontSize: number | undefined = undefined;
  public fontWeight: string | undefined = undefined;
  public fontStyle: string | undefined = undefined;
  public strokeWidth: number | undefined = undefined;
  public color: string | undefined = undefined;
}

export class ScoreElementOffset {
  public x: number = 0;
  public y: number = 0;
}
