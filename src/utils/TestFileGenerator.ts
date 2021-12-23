import { NoteElement, ScoreElement } from '@/models/Element';
import { Fthora, QuantitativeNeume, TimeNeume } from '@/models/Neumes';

export abstract class TestFileGenerator {
  public static generateTestFile_Fthora_Top() {
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
          !fthora.endsWith('TopCenter')
        ) {
          continue;
        }

        const note = new NoteElement();
        note.setQuantitativeNeume(quantitativeNeume);
        note.setFthora(fthora as Fthora);
        (note.lyrics = (counter++).toString()), elements.push(note);
      }
    }

    return elements;
  }
}
