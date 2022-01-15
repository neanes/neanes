import { NoteElement, ScoreElement } from '@/models/Element';
import {
  Fthora,
  QuantitativeNeume,
  TimeNeume,
  GorgonNeume,
  Accidental,
  VocalExpressionNeume,
  MeasureNumber,
  NoteIndicator,
  Ison,
} from '@/models/Neumes';
import { TestFileType } from './TestFileType';

export abstract class TestFileGenerator {
  public static generateTestFile(type: TestFileType) {
    switch (type) {
      case TestFileType.FthoraTop:
        return this.generateTestFile_Fthora('Top');
      case TestFileType.FthoraBottom:
        return this.generateTestFile_Fthora('Bottom');
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
      default:
        console.error(`Unknown test file type: ${type}`);
        return null;
    }
  }

  private static generateTestFile_Fthora(endsWith: string) {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      for (let f in Fthora) {
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
        (note.lyrics = (counter++).toString()), elements.push(note);
      }
    }

    return elements;
  }

  private static generateTestFile_Gorgon() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.gorgonNeume = GorgonNeume.Gorgon_Top;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.gorgonNeume = GorgonNeume.Gorgon_Bottom;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.gorgonNeume = GorgonNeume.GorgonDottedLeft;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.gorgonNeume = GorgonNeume.GorgonDottedRight;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Klasma() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Klasma_Top;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Klasma_Bottom;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Hapli() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Hapli;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Dipli;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.timeNeume = TimeNeume.Tripli;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Accidentals() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      let note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Flat_2_Right;
      (note.lyrics = (counter++).toString()), elements.push(note);

      note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Flat_4_Right;
      (note.lyrics = (counter++).toString()), elements.push(note);

      note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Flat_6_Right;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      let note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Sharp_2_Left;
      (note.lyrics = (counter++).toString()), elements.push(note);

      note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Sharp_4_Left;
      (note.lyrics = (counter++).toString()), elements.push(note);

      note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.accidental = Accidental.Sharp_6_Left;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Expressions() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.vocalExpressionNeume = VocalExpressionNeume.Psifiston;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.vocalExpressionNeume = VocalExpressionNeume.Antikenoma;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.vocalExpressionNeume = VocalExpressionNeume.Homalon;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Measures() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.measureNumber = MeasureNumber.Two;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.measureNumber = MeasureNumber.Eight;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_NoteIndicators() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.noteIndicator = NoteIndicator.Ni;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    return elements;
  }

  private static generateTestFile_Isons() {
    const elements: ScoreElement[] = [];

    let counter = 1;

    for (let q in QuantitativeNeume) {
      const quantitativeNeume = q as QuantitativeNeume;
      if (
        [
          QuantitativeNeume.VareiaDotted,
          QuantitativeNeume.Cross,
          QuantitativeNeume.Kentima,
        ].includes(quantitativeNeume)
      ) {
        continue;
      }

      const note = new NoteElement();
      note.quantitativeNeume = quantitativeNeume;
      note.ison = Ison.Unison;
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    return elements;
  }
}
