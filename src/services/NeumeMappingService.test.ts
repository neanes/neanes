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
} from '../models/Neumes';
import { NeumeMappingService } from './NeumeMappingService';

describe('NeumeMappingsService', () => {
  it('should have a mapping for every neume', () => {
    Object.values(QuantitativeNeume).forEach((x) => {
      expect(NeumeMappingService.getMapping(x)).toBeDefined();
    });

    Object.values(TimeNeume).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );

    Object.values(GorgonNeume).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(VocalExpressionNeume).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(Fthora).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(Accidental).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(TempoSign).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(Note).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(RootSign).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(ModeSign).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(MeasureBar).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(MeasureNumber).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(NoteIndicator).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
    Object.values(Ison).forEach((x) =>
      expect(NeumeMappingService.getMapping(x)).toBeDefined(),
    );
  });
});
