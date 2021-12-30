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
  Neume,
  ModeSign,
  MeasureBar,
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
  StaffText = 'StaffText',
  DropCap = 'DropCap',
  ModeKey = 'ModeKey',
}

export abstract class ScoreElement {
  abstract elementType: ElementType;
  public lineBreak: boolean = false;
  public pageBreak: boolean = false;

  public x: number = 0;
  public y: number = 0;
  public width: number = 0;
}

export class NoteElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Note;
  public quantitativeNeumeValue: QuantitativeNeume = QuantitativeNeume.Ison;
  public timeNeumeValue: TimeNeume | null = null;
  public gorgonNeumeValue: GorgonNeume | null = null;
  public vocalExpressionNeumeValue: VocalExpressionNeume | null = null;
  public fthoraValue: Fthora | null = null;
  public accidentalValue: Accidental | null = null;
  public measureBar: MeasureBar | null = null;
  public lyrics: string = '';
  public isMelisma: boolean = false;
  public isMelismaStart: boolean = false;

  public get quantitativeNeume() {
    return this.quantitativeNeumeValue;
  }

  public get timeNeume() {
    return this.timeNeumeValue;
  }

  public get gorgonNeume() {
    return this.gorgonNeumeValue;
  }

  public get vocalExpressionNeume() {
    return this.vocalExpressionNeumeValue;
  }

  public get accidental() {
    return this.accidentalValue;
  }

  public get fthora() {
    return this.fthoraValue;
  }

  public set quantitativeNeume(neume: QuantitativeNeume) {
    this.quantitativeNeumeValue = neume;
    this.replaceNeumes();
  }

  public set timeNeume(neume: TimeNeume | null) {
    this.timeNeumeValue = neume;
    this.replaceNeumes();
  }

  public set gorgonNeume(neume: GorgonNeume | null) {
    this.gorgonNeumeValue = neume;
    this.replaceNeumes();
  }

  public set vocalExpressionNeume(neume: VocalExpressionNeume | null) {
    this.vocalExpressionNeumeValue = neume;
    this.replaceNeumes();
  }

  public set accidental(neume: Accidental | null) {
    this.accidentalValue = neume;
    this.replaceNeumes();
  }

  public set fthora(neume: Fthora | null) {
    this.fthoraValue = neume;
    this.replaceNeumes();
  }

  // Used for display
  public melismaText: string = '';
  public melismaOffsetLeft: number | null = null;
  public neumeWidth: number = 0;
  public lyricsWidth: number = 0;

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
  public apostrophe: boolean = false;
  public fthora: Fthora | null = null;
  public measureBar: MeasureBar | null = null;

  public error: boolean = false;
}

export class TempoElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.Tempo;
  public neume: TempoSign = TempoSign.Moderate;
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
  public alignment: TextBoxAlignment = TextBoxAlignment.Center;
  public mode: number = 1;
  public scale: Scale = Scale.Diatonic;
  public scaleNote: ScaleNote = ScaleNote.Pa;
  public martyrias: ModeSign[] = [];
  public note: ModeSign | null = null;
  public note2: ModeSign | null = null;
  public fthora: Fthora | null = null;
  public fthora2: Fthora | null = null;
  public quantitativeNeumeRight: QuantitativeNeume | null = null;
  public quantitativeNeumeTop: ModeSign | null = null;
  public color: string = '#000000';
  public fontSize: number = Unit.FromPt(20);

  public get isPlagal() {
    return this.mode > 4 && this.mode !== 7;
  }

  public get isVarys() {
    return this.mode === 7;
  }

  public get height() {
    return Math.ceil(
      Math.max(
        TextMeasurementService.getFontHeight(`${this.fontSize}px Oxeia`),
        TextMeasurementService.getFontHeight(`${this.fontSize}px EzSpecial2`),
      ),
    );
  }

  public static createFromTemplate(
    template: ModeKeyTemplate,
    alignment?: TextBoxAlignment,
  ) {
    const element = new ModeKeyElement();

    element.mode = template.mode;
    element.scale = template.scale;
    element.scaleNote = template.scaleNote;
    element.martyrias = template.martyrias.map((x) => x);
    element.fthora = template.fthora || null;
    element.fthora2 = template.fthora2 || null;
    element.note = template.note || null;
    element.note2 = template.note2 || null;
    element.quantitativeNeumeTop = template.quantitativeNeumeTop || null;
    element.quantitativeNeumeRight = template.quantitativeNeumeRight || null;
    element.alignment = alignment || TextBoxAlignment.Center;

    return element;
  }
}

export class StaffTextElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.StaffText;
  public offset: ScoreElementOffset = new ScoreElementOffset();
  public text: string = 'text';
}

export class DropCapElement extends ScoreElement {
  public readonly elementType: ElementType = ElementType.DropCap;
  public content: string = 'A';
  public fontFamily: string | null = null;
  public fontSize: number | null = null;
  public color: string | null = null;
}

export class ScoreElementOffset {
  public x: number = 0;
  public y: number = 0;
}
