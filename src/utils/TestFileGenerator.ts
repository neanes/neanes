import { NoteElement, ScoreElement } from '@/models/Element';
import {
  Fthora,
  QuantitativeNeume,
  TimeNeume,
  GorgonNeume,
  Accidental,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { TestFileType } from './TestFileType';

export abstract class TestFileGenerator {
  public static generateTestFile(type: TestFileType) {
    switch (type) {
      case TestFileType.FthoraTop:
        return this.generateTestFile_Fthora('TopCenter');
      case TestFileType.FthoraBottom:
        return this.generateTestFile_Fthora('BottomCenter');
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
        note.setQuantitativeNeume(quantitativeNeume);
        note.setFthora(fthora);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setGorgonNeume(GorgonNeume.Gorgon_Top);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setGorgonNeume(GorgonNeume.Gorgon_Bottom);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setTimeNeume(TimeNeume.Klasma_Top);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setTimeNeume(TimeNeume.Klasma_Bottom);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setTimeNeume(TimeNeume.Hapli);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setTimeNeume(TimeNeume.Dipli);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setTimeNeume(TimeNeume.Tripli);
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

      const note = new NoteElement();
      note.setQuantitativeNeume(quantitativeNeume);
      note.setAccidental(Accidental.Flat_2_Right);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setAccidental(Accidental.Sharp_2_Left);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setVocalExpressionNeume(VocalExpressionNeume.Psifiston);
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
      note.setQuantitativeNeume(quantitativeNeume);
      note.setVocalExpressionNeume(VocalExpressionNeume.Antikenoma);
      (note.lyrics = (counter++).toString()), elements.push(note);
    }

    return elements;
  }
}
