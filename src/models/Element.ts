import {
  TimeNeume,
  QuantitativeNeume,
  Note,
  RootSign,
  VocalExpressionNeume,
  Fthora,
  Accidental,
  GorgonNeume,
  TempoSign,
  ModeSign,
  MeasureBar,
  MeasureNumber,
  NoteIndicator,
  Ison,
} from '@/models/Neumes';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { Unit } from '@/utils/Unit';
import { ModeKeyTemplate } from './ModeKeys';
import {
  getGorgonReplacements,
  getTimeReplacements,
  getVocalExpressionReplacements,
  getFthoraReplacements,
  getQuantitativeReplacements,
} from './NeumeReplacements';
import { Scale, ScaleNote } from './Scales';

export enum ElementType {
  Note = 'Note',
  Martyria = 'Martyria',
  Tempo = 'Tempo',
  Empty = 'Empty',
  TextBox = 'TextBox',
  DropCap = 'DropCap',
  ModeKey = 'ModeKey',
}

export abstract class ScoreElement {
  abstract elementType: ElementType;
  abstract clone(): ScoreElement;
  public lineBreak: boolean = false;
  public pageBreak: boolean = false;

  public x: number = 0;
  public y: number = 0;
  public width: number = 0;

  public index: number = 0;

  // This is used to help force components to re-render
  public keyHelper: number = 0;
}

export class NoteElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Note;
  public measureBarLeft: MeasureBar | null = null;
  public measureBarRight: MeasureBar | null = null;
  public measureNumber: MeasureNumber | null = null;
  public noteIndicator: NoteIndicator | null = null;
  public ison: Ison | null = null;
  public vareia: boolean = false;
  public lyrics: string = '';
  public isMelisma: boolean = false;
  public isMelismaStart: boolean = false;
  public isHyphen: boolean = false;

  public clone() {
    const clone = new NoteElement();

    Object.assign(clone, this.getClipboardProperties());

    return clone;
  }

  public getClipboardProperties() {
    return {
      measureBarLeft: this.measureBarLeft,
      measureBarRight: this.measureBarRight,
      measureNumber: this.measureNumber,
      noteIndicator: this.noteIndicator,
      ison: this.ison,
      accidental: this.accidental,
      fthora: this.fthora,
      gorgonNeume: this.gorgonNeume,
      secondaryGorgonNeume: this.secondaryGorgonNeume,
      quantitativeNeume: this.quantitativeNeume,
      timeNeume: this.timeNeume,
      vocalExpressionNeume: this.vocalExpressionNeume,
      vareia: this.vareia,
    } as Partial<NoteElement>;
  }

  public get quantitativeNeume() {
    return this._quantitativeNeume;
  }

  public get timeNeume() {
    return this._timeNeume;
  }

  public get gorgonNeume() {
    return this._gorgonNeume;
  }

  public get secondaryGorgonNeume() {
    return this._secondaryGorgonNeume;
  }

  public get vocalExpressionNeume() {
    return this._vocalExpressionNeume;
  }

  public get accidental() {
    return this._accidental;
  }

  public get fthora() {
    return this._fthora;
  }

  public set quantitativeNeume(neume: QuantitativeNeume) {
    this._quantitativeNeume = neume;
    this.replaceNeumes();

    if (
      this.quantitativeNeume !==
      QuantitativeNeume.OligonPlusHyporoePlusKentemata
    ) {
      this._secondaryGorgonNeume = null;
    }
  }

  public set timeNeume(neume: TimeNeume | null) {
    this._timeNeume = neume;
    this.replaceNeumes();
  }

  public set gorgonNeume(neume: GorgonNeume | null) {
    this._gorgonNeume = neume;
    this.replaceNeumes();
  }

  public set secondaryGorgonNeume(neume: GorgonNeume | null) {
    this._secondaryGorgonNeume = neume;
    this.replaceNeumes();
  }

  public set vocalExpressionNeume(neume: VocalExpressionNeume | null) {
    this._vocalExpressionNeume = neume;
    this.replaceNeumes();
  }

  public set accidental(neume: Accidental | null) {
    this._accidental = neume;
    this.replaceNeumes();
  }

  public set fthora(neume: Fthora | null) {
    this._fthora = neume;
    this.replaceNeumes();
  }

  // Used for display
  public melismaText: string = '';
  public isFullMelisma: boolean = false;
  public melismaWidth: number = 0;
  public lyricsVerticalOffset: number = 0;
  public lyricsHorizontalOffset: number = 0;
  public neumeWidth: number = 0;
  public lyricsWidth: number = 0;

  private _quantitativeNeume: QuantitativeNeume = QuantitativeNeume.Ison;
  private _timeNeume: TimeNeume | null = null;
  private _gorgonNeume: GorgonNeume | null = null;
  private _secondaryGorgonNeume: GorgonNeume | null = null;
  private _vocalExpressionNeume: VocalExpressionNeume | null = null;
  private _fthora: Fthora | null = null;
  private _accidental: Accidental | null = null;

  private replaceNeumes() {
    this.replaceQuantitativeNeumes();
    this.replaceGorgons();
    this.replaceTimeNeumes();
    this.replaceVocalExpressions();
    this.replaceFthora();
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
}

export class MartyriaElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Martyria;
  public auto: boolean = true;
  public note: Note = Note.Pa;
  public rootSign: RootSign = RootSign.Alpha;
  public scale: Scale = Scale.Diatonic;
  public fthora: Fthora | null = null;
  public measureBarLeft: MeasureBar | null = null;
  public measureBarRight: MeasureBar | null = null;
  public alignRight: boolean = false;

  public error: boolean = false;

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
      alignRight: this.alignRight,
      measureBarLeft: this.measureBarLeft,
      measureBarRight: this.measureBarRight,
      fthora: this.fthora,
    } as Partial<MartyriaElement>;
  }
}

export class TempoElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Tempo;
  public neume: TempoSign = TempoSign.Moderate;

  public clone() {
    const clone = new TempoElement();

    Object.assign(clone, this.getClipboardProperties());

    return clone;
  }

  public getClipboardProperties() {
    return {
      neume: this.neume,
    } as Partial<TempoElement>;
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
  public fontSize: number = 16;
  public fontFamily: string = 'Omega';
  public inline: boolean = false;
  public bold: boolean = false;
  public italic: boolean = false;
  public underline: boolean = false;
  public height: number = 20;

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
      fontSize: this.fontSize,
      fontFamily: this.fontFamily,
    } as Partial<TextBoxElement>;
  }
}

export class ModeKeyElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.ModeKey;
  public templateId: number | null = null;
  public alignment: TextBoxAlignment = TextBoxAlignment.Center;
  public mode: number = 1;
  public scale: Scale = Scale.Diatonic;
  public scaleNote: ScaleNote = ScaleNote.Pa;
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
  public height: number = Unit.fromPt(37);

  public get isPlagal() {
    return this.mode > 4 && this.mode !== 7;
  }

  public get isVarys() {
    return this.mode === 7;
  }

  public static createFromTemplate(
    template: ModeKeyTemplate,
    alignment?: TextBoxAlignment,
  ) {
    const element = new ModeKeyElement();

    element.templateId = template.id;
    element.mode = template.mode;
    element.scale = template.scale;
    element.scaleNote = template.scaleNote;
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
      martyria: this.martyria,
      fthora: this.fthoraAboveNote,
      fthora2: this.fthoraAboveNote2,
      fthoraAboveQuantitativeNeumeRight: this.fthoraAboveQuantitativeNeumeRight,
      note: this.note,
      note2: this.note2,
      quantitativeNeumeAboveNote: this.quantitativeNeumeAboveNote,
      quantitativeNeumeAboveNote2: this.quantitativeNeumeAboveNote2,
      quantitativeNeumeRight: this.quantitativeNeumeRight,
      fontSize: this.fontSize,
    } as Partial<ModeKeyElement>;
  }
}

export class DropCapElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.DropCap;
  public content: string = 'A';
  public fontFamily: string | null = null;
  public fontSize: number | null = null;
  public fontWeight: string | null = null;
  public fontStyle: string | null = null;
  public color: string | null = null;

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
      fontFamily: this.fontFamily,
    } as Partial<DropCapElement>;
  }
}

export class ScoreElementOffset {
  public x: number = 0;
  public y: number = 0;
}
