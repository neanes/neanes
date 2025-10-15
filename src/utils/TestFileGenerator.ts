import { v4 as uuidv4 } from 'uuid';

import {
  DropCapElement,
  LineBreakType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
} from '@/models/Element';
import { modeKeyTemplates } from '@/models/ModeKeys';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureNumber,
  Note,
  QuantitativeNeume,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';

import { TestFileType } from './TestFileType';

export abstract class TestFileGenerator {
  public static generateTestFile(type: TestFileType, fonts: string[]) {
    switch (type) {
      case TestFileType.FthoraTop:
        return this.generateTestFile_Fthora('Top');
      case TestFileType.FthoraBottom:
        return this.generateTestFile_Fthora('Bottom');
      case TestFileType.MartyriaFthora:
        return this.generateTestFile_MartyriaFthora();
      case TestFileType.Gorgon:
        return this.generateTestFile_Gorgon();
      case TestFileType.Klasma:
        return this.generateTestFile_Klasma();
      case TestFileType.Hapli:
        return this.generateTestFile_Hapli();
      case TestFileType.Accidentals:
        return this.generateTestFile_Accidentals();
      case TestFileType.Expressions:
        return this.generateTestFile_Expressions();
      case TestFileType.Measures:
        return this.generateTestFile_Measures();
      case TestFileType.NoteIndicators:
        return this.generateTestFile_NoteIndicators();
      case TestFileType.Ison:
        return this.generateTestFile_Isons();
      case TestFileType.ModeKey:
        return this.generateTestFile_ModeKey();
      case TestFileType.Random:
        return this.generateTestFile_Random();
      case TestFileType.DropCaps:
        return this.generateTestFile_DropCaps(fonts);
      default:
        console.error(`Unknown test file type: ${type}`);
        return null;
    }
  }

  private static generateTestFile_Fthora(endsWith: string) {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      for (const f in Fthora) {
        const fthora = f as Fthora;
        if (
          fthora.startsWith('Zygos') ||
          fthora.startsWith('Kliton') ||
          fthora.startsWith('Spathi') ||
          fthora.startsWith('Enharmonic') ||
          fthora.startsWith('GeneralSharp') ||
          fthora.startsWith('GeneralFlat') ||
          !fthora.endsWith(endsWith)
        ) {
          continue;
        }

        const note = new NoteElement();
        note.quantitativeNeume = quantitativeNeume;
        note.fthora = fthora;
        note.lyrics = (counter++).toString();
        elements.push(note);
      }
    }

    return elements;
  }

  private static generateTestFile_MartyriaFthora() {
    const elements: ScoreElement[] = [];

    for (const n in Note) {
      const note = n as Note;

      for (const f in Fthora) {
        const fthora = f as Fthora;

        if (
          fthora.startsWith('Zygos') ||
          fthora.startsWith('Kliton') ||
          fthora.startsWith('Spathi') ||
          fthora.startsWith('Enharmonic') ||
          fthora.startsWith('GeneralSharp') ||
          fthora.startsWith('GeneralFlat') ||
          !fthora.endsWith('_Top')
        ) {
          continue;
        }

        const martyria = new MartyriaElement();
        martyria.auto = false;
        martyria.note = note;
        martyria.fthora = fthora;
        elements.push(martyria);
      }
    }

    return elements;
  }

  private static generateTestFile_Gorgon() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.gorgonNeume = GorgonNeume.Gorgon_Top;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.gorgonNeume = GorgonNeume.Gorgon_Bottom;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.gorgonNeume = GorgonNeume.GorgonDottedLeft;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.gorgonNeume = GorgonNeume.GorgonDottedRight;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Klasma() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Klasma_Top;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Klasma_Bottom;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Hapli() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Hapli;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Dipli;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Tripli;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Accidentals() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      let note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Flat_2_Right;
      note.lyrics = (counter++).toString();
      elements.push(note);

      note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Flat_4_Right;
      note.lyrics = (counter++).toString();
      elements.push(note);

      note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Flat_6_Right;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      let note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Sharp_2_Left;
      note.lyrics = (counter++).toString();
      elements.push(note);

      note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Sharp_4_Left;
      note.lyrics = (counter++).toString();
      elements.push(note);

      note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Sharp_6_Left;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Expressions() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.vocalExpressionNeume = VocalExpressionNeume.Psifiston;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.vocalExpressionNeume = VocalExpressionNeume.Antikenoma;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.vocalExpressionNeume = VocalExpressionNeume.Homalon;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.vocalExpressionNeume = VocalExpressionNeume.HomalonConnecting;
      note.lyrics = (counter++).toString();
      elements.push(note);

      const ison = new NoteElement();
      ison.quantitativeNeume = QuantitativeNeume.Ison;
      elements.push(ison);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.vocalExpressionNeume = VocalExpressionNeume.HeteronConnecting;
      note.lyrics = (counter++).toString();
      elements.push(note);

      const ison = new NoteElement();
      ison.quantitativeNeume = QuantitativeNeume.Ison;
      elements.push(ison);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.vareia = true;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Measures() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.measureNumber = MeasureNumber.Two;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.measureNumber = MeasureNumber.Eight;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_NoteIndicators() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.noteIndicator = true;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Isons() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (const q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.VareiaDotted2,
          QuantitativeNeume.VareiaDotted3,
          QuantitativeNeume.VareiaDotted4,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
          QuantitativeNeume.Breath,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.ison = Ison.Unison;
      note.lyrics = (counter++).toString();
      elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_ModeKey() {
    const elements: ScoreElement[] = [];

    for (const template of modeKeyTemplates) {
      elements.push(ModeKeyElement.createFromTemplate(template));
    }

    return elements;
  }

  private static generateTestFile_Random() {
    const elements: ScoreElement[] = [];

    const neumes = 10000;

    const max = Object.values(QuantitativeNeume).length - 1;

    const values = Object.values(QuantitativeNeume);

    for (let i = 0; i < neumes; i++) {
      const note = new NoteElement();
      note.quantitativeNeume = values[Math.floor(Math.random() * max)];
      note.lyrics = uuidv4();
      elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_DropCaps(fonts: string[]) {
    const elements: ScoreElement[] = [];

    for (const font of fonts) {
      const dropCap = new DropCapElement();
      dropCap.useDefaultStyle = false;
      dropCap.fontFamily = font;
      dropCap.fontSize = 80;
      elements.push(dropCap);

      const note = new NoteElement();
      note.quantitativeNeume = QuantitativeNeume.Ison;
      note.lyrics = 'A';
      note.lineBreak = true;
      note.lineBreakType = LineBreakType.Left;
      elements.push(note);
    }

    return elements;
  }
}
