import { MeasureBar } from '@/models/Neumes';
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
}

export class NoteElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Note;
  public quantitativeNeume: QuantitativeNeume = QuantitativeNeume.Ison;
  public timeNeume: TimeNeume | undefined = undefined;
  public gorgonNeume: GorgonNeume | undefined = undefined;
  public vocalExpressionNeume: VocalExpressionNeume | undefined = undefined;
  public fthora: Fthora | undefined = undefined;
  public accidental: Accidental | undefined = undefined;
  public measureBar: MeasureBar | undefined = undefined;
  public lyrics: string | undefined = undefined;
  public isMelisma: boolean | undefined = undefined;
  public isMelismaStart: boolean | undefined = undefined;
  public isHyphen: boolean | undefined = undefined;
}

export class MartyriaElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Martyria;
  public auto: boolean | undefined = undefined;
  public note: Note = Note.Pa;
  public rootSign: RootSign = RootSign.Alpha;
  public apostrophe: boolean | undefined = undefined;
  public fthora: Fthora | undefined = undefined;
  public measureBar: MeasureBar | undefined = undefined;
  public alignRight: boolean | undefined = undefined;
}

export class TempoElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Tempo;
  public neume: TempoSign = TempoSign.Moderate;

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
  public height: number = 20;
}

export class ModeKeyElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.ModeKey;
  public templateId: number | undefined = undefined;
  public alignment: TextBoxAlignment = TextBoxAlignment.Center;
  public mode: number = 1;
  public scale: Scale = Scale.Diatonic;
  public scaleNote: ScaleNote = ScaleNote.Pa;
  public martyrias: ModeSign[] = [];
  public note: ModeSign | undefined = undefined;
  public note2: ModeSign | undefined = undefined;
  public fthora: Fthora | undefined = undefined;
  public fthora2: Fthora | undefined = undefined;
  public quantitativeNeumeTop: ModeSign | undefined = undefined;
  public quantitativeNeumeRight: QuantitativeNeume | undefined = undefined;
  public color: string = '#000000';
  public fontSize: number = 16;
  public height: number = 20;
}

export class DropCapElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.DropCap;
  public content: string = 'A';
  public fontFamily: string | undefined = undefined;
  public fontSize: number | undefined = undefined;
  public color: string | undefined = undefined;
}

export class ScoreElementOffset {
  public x: number = 0;
  public y: number = 0;
}
