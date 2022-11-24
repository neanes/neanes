import { NeumeKeyboard } from './NeumeKeyboard';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  Neume,
  Note,
  NoteIndicator,
  QuantitativeNeume,
  TempoSign,
  TimeNeume,
  VocalExpressionNeume,
} from '../models/Neumes';

describe('NeumeKeyboard', () => {
  it('should have a mapping for every neume that is not in the list of exceptions', () => {
    const exceptions: Neume[] = [
      QuantitativeNeume.Kentima,
      TimeNeume.Klasma_Top,
      TimeNeume.Klasma_Bottom,
      GorgonNeume.GorgonSecondary,
      GorgonNeume.DigorgonSecondary,
      GorgonNeume.TrigorgonSecondary,
      GorgonNeume.GorgonDottedLeftSecondary,
      GorgonNeume.GorgonDottedRightSecondary,
      GorgonNeume.DigorgonDottedLeft1Secondary,
      GorgonNeume.DigorgonDottedRightSecondary,
      GorgonNeume.TrigorgonDottedLeft1Secondary,
      GorgonNeume.TrigorgonDottedRightSecondary,
    ];

    const keyboard = new NeumeKeyboard();

    Object.values(QuantitativeNeume)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(TimeNeume)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(GorgonNeume)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neumes).toContain(x);
      });

    Object.values(VocalExpressionNeume)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(Fthora)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        if (keyboard.findMappingForNeume(x)?.neumes == null) {
          console.log(x);
        }
        expect(keyboard.findMappingForNeume(x)?.neumes).toContain(x);
      });

    Object.values(Accidental)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(TempoSign)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(MeasureBar)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(MeasureNumber)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(Ison)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.neume).toBe(x);
      });

    Object.values(Note)
      .filter((x) => !exceptions.includes(x))
      .forEach((x) => {
        expect(keyboard.findMappingForNeume(x)?.note).toBe(x);
      });
  });
});
