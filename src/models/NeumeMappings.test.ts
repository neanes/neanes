import { neumeMap } from './NeumeMappings';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  ModeSign,
  Note,
  NoteIndicator,
  QuantitativeNeume,
  RootSign,
  TempoSign,
  TimeNeume,
  VocalExpressionNeume,
} from './Neumes';

describe('NeumeMappings', () => {
  it('should have a mapping for every neume', () => {
    expect(
      Object.values(QuantitativeNeume).every(
        (x) => neumeMap.get(x) !== undefined,
      ) &&
        Object.values(TimeNeume).every((x) => neumeMap.get(x) !== undefined) &&
        Object.values(GorgonNeume).every(
          (x) => neumeMap.get(x) !== undefined,
        ) &&
        Object.values(VocalExpressionNeume).every(
          (x) => neumeMap.get(x) !== undefined,
        ) &&
        Object.values(Fthora).every((x) => neumeMap.get(x) !== undefined) &&
        Object.values(Accidental).every((x) => neumeMap.get(x) !== undefined) &&
        Object.values(TempoSign).every((x) => neumeMap.get(x) !== undefined) &&
        Object.values(Note).every((x) => neumeMap.get(x) !== undefined) &&
        Object.values(RootSign).every((x) => neumeMap.get(x) !== undefined) &&
        Object.values(ModeSign).every((x) => neumeMap.get(x) !== undefined) &&
        Object.values(MeasureBar).every((x) => neumeMap.get(x) !== undefined) &&
        Object.values(MeasureNumber).every(
          (x) => neumeMap.get(x) !== undefined,
        ) &&
        Object.values(NoteIndicator).every(
          (x) => neumeMap.get(x) !== undefined,
        ) &&
        Object.values(Ison).every((x) => neumeMap.get(x) !== undefined),
    ).toBe(true);
  });
});
