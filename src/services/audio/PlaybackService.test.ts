import {
  PlaybackOptions,
  PlaybackWorkspace,
  PlaybackService,
  PlaybackScale,
} from './PlaybackService';
import { Scale, ScaleNote } from '../../models/Scales';
import {
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  ScoreElement,
  TempoElement,
} from '../../models/Element';
import {
  Accidental,
  Fthora,
  Note,
  QuantitativeNeume,
} from '../../models/Neumes';
import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe('PlaybackService', () => {
  describe('constructTetrachordScale', () => {
    it('should construct the first half of a disjunct tetrachord scale with separating tone at the end', () => {
      const service = new PlaybackService();

      expect(service.constructTetrachordScale([1, 2, 3])).toEqual([
        1, 2, 3, 12,
      ]);
    });
  });

  describe('constructDiapasonScale', () => {
    it('should construct a disjunct octave scale', () => {
      const service = new PlaybackService();

      expect(service.constructDiapasonScale([1, 2, 3])).toEqual([
        1, 2, 3, 12, 1, 2, 3,
      ]);
    });
  });

  describe('constructZygosScale', () => {
    it('should construct the zygos scale', () => {
      const service = new PlaybackService();

      expect(service.constructZygosScale([1, 2, 3, 4], [5, 6, 7])).toEqual([
        1, 2, 3, 4, 5, 6, 7,
      ]);

      expect(service.constructZygosScale([18, 4, 16, 4], [12, 10, 8])).toEqual([
        18, 4, 16, 4, 12, 10, 8,
      ]);
    });
  });

  describe('constructKlitonScale', () => {
    it('should construct the kliton scale', () => {
      const service = new PlaybackService();

      expect(service.constructKlitonScale([10, 20, 30], [1, 2, 3])).toEqual([
        1, 10, 20, 30, 1, 2, 3,
      ]);

      expect(service.constructKlitonScale([14, 12, 4], [12, 10, 8])).toEqual([
        12, 14, 12, 4, 12, 10, 8,
      ]);
    });
  });

  describe('constructSpathiScale', () => {
    it('should construct the spathi scale from ke', () => {
      const service = new PlaybackService();

      expect(service.constructSpathiKeScale([4, 5, 6, 7], [1, 2, 3])).toEqual([
        1, 2, 3, 4, 5, 6, 7,
      ]);

      expect(
        service.constructSpathiKeScale([20, 4, 4, 14], [12, 10, 8]),
      ).toEqual([12, 10, 8, 20, 4, 4, 14]);
    });
  });

  describe('constructSpathiGaScale', () => {
    it('should construct the spathi scale from ga', () => {
      const service = new PlaybackService();

      expect(service.constructSpathiGaScale([2, 3, 4, 5], [1, 6, 7])).toEqual([
        1, 2, 3, 4, 5, 6, 7,
      ]);

      expect(
        service.constructSpathiGaScale([20, 4, 4, 14], [12, 10, 8]),
      ).toEqual([12, 20, 4, 4, 14, 10, 8]);
    });
  });

  describe('applyModeKey', () => {
    it('should clear enharmonic Ga', () => {
      const service = new PlaybackService();

      const workspace = getDefaultWorkspace([], service.diatonicScale);

      workspace.enharmonicGa = true;

      service.applyModeKey(
        getModeKey(1, Scale.Diatonic, ScaleNote.Pa),
        workspace,
      );

      expect(workspace.enharmonicGa).toBeFalsy();
    });

    it('should clear enharmonic Zo', () => {
      const service = new PlaybackService();

      const workspace = getDefaultWorkspace([], service.diatonicScale);

      workspace.enharmonicZo = true;

      service.applyModeKey(
        getModeKey(1, Scale.Diatonic, ScaleNote.Pa),
        workspace,
      );

      expect(workspace.enharmonicZo).toBeFalsy();
    });

    it('should clear enharmonic Vou', () => {
      const service = new PlaybackService();

      const workspace = getDefaultWorkspace([], service.diatonicScale);

      workspace.enharmonicVou = true;

      service.applyModeKey(
        getModeKey(1, Scale.Diatonic, ScaleNote.Pa),
        workspace,
      );

      expect(workspace.enharmonicVou).toBeFalsy();
    });

    it('should clear general flat', () => {
      const service = new PlaybackService();

      const workspace = getDefaultWorkspace([], service.diatonicScale);

      workspace.generalFlat = true;

      service.applyModeKey(
        getModeKey(1, Scale.Diatonic, ScaleNote.Pa),
        workspace,
      );

      expect(workspace.generalFlat).toBeFalsy();
    });

    it('should clear general sharp', () => {
      const service = new PlaybackService();

      const workspace = getDefaultWorkspace([], service.diatonicScale);

      workspace.generalSharp = true;

      service.applyModeKey(
        getModeKey(1, Scale.Diatonic, ScaleNote.Pa),
        workspace,
      );

      expect(workspace.generalSharp).toBeFalsy();
    });
  });

  describe('computePlaybackSequence', () => {
    it.each`
      scaleNote            | expectedFrequency
      ${ScaleNote.VouLow}  | ${80.84}
      ${ScaleNote.GaLow}   | ${87.31}
      ${ScaleNote.ThiLow}  | ${98}
      ${ScaleNote.KeLow}   | ${110}
      ${ScaleNote.Zo}      | ${121.12}
      ${ScaleNote.Ni}      | ${130.81}
      ${ScaleNote.Pa}      | ${146.83}
      ${ScaleNote.Vou}     | ${161.67}
      ${ScaleNote.Ga}      | ${174.62}
      ${ScaleNote.Thi}     | ${196}
      ${ScaleNote.Ke}      | ${220}
      ${ScaleNote.ZoHigh}  | ${242.24}
      ${ScaleNote.NiHigh}  | ${261.63}
      ${ScaleNote.PaHigh}  | ${293.67}
      ${ScaleNote.VouHigh} | ${323.35}
      ${ScaleNote.GaHigh}  | ${349.23}
      ${ScaleNote.ThiHigh} | ${392}
      ${ScaleNote.KeHigh}  | ${440.01}
    `(
      'should play the correct starting note for the 12-10-8 diatonic scale when no fthora is present',
      ({ scaleNote, expectedFrequency }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.diatonicIntervals = [12, 10, 8];

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(1, Scale.Diatonic, scaleNote));
        elements.push(getNote(QuantitativeNeume.Ison));

        const events = service.computePlaybackSequence(elements, options);

        expect(events[0].frequency).toBeCloseTo(expectedFrequency, 2);
      },
    );

    it('should play the 12-10-8 diatonic scale', () => {
      const service = new PlaybackService();

      const options = getDefaultWorkspaceOptions();
      options.diatonicIntervals = [12, 10, 8];

      const elements: ScoreElement[] = [];

      elements.push(getModeKey(1, Scale.Diatonic, ScaleNote.VouLow));
      elements.push(getNote(QuantitativeNeume.Ison));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));

      const events = service.computePlaybackSequence(elements, options);
      const expectedFrequencies = [
        80.84, 87.31, 98, 110, 121.12, 130.81, 146.83, 161.67, 174.62, 196, 220,
        242.24, 261.63, 293.67, 323.35, 349.23, 392, 440.01,
      ];

      expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
        expectedFrequencies,
        2,
      );
    });

    it.each`
      scaleNote        | expectedFrequency
      ${ScaleNote.Pa}  | ${146.83}
      ${ScaleNote.Vou} | ${155.57}
    `(
      'should play the correct starting note for the 6-9-15 legetos scale when no fthora is present',
      ({ scaleNote, expectedFrequency }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.legetosIntervals = [6, 9, 15];
        options.useLegetos = true;

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(4, Scale.Diatonic, scaleNote));
        elements.push(getNote(QuantitativeNeume.Ison));

        const events = service.computePlaybackSequence(elements, options);

        expect(events[0].frequency).toBeCloseTo(expectedFrequency, 2);
      },
    );

    it.each`
      base                                                         | expectedFrequency
      ${QuantitativeNeume.HamiliPlusElaphron}                      | ${77.78}
      ${QuantitativeNeume.HamiliPlusApostrophos}                   | ${84.82}
      ${QuantitativeNeume.Hamili}                                  | ${98}
      ${QuantitativeNeume.ElaphronPlusApostrophos}                 | ${110}
      ${QuantitativeNeume.Elaphron}                                | ${116.54}
      ${QuantitativeNeume.Apostrophos}                             | ${127.09}
      ${QuantitativeNeume.Ison}                                    | ${146.83}
      ${QuantitativeNeume.Oligon}                                  | ${155.57}
      ${QuantitativeNeume.OligonPlusKentima}                       | ${169.65}
      ${QuantitativeNeume.OligonPlusKentimaAbove}                  | ${196}
      ${QuantitativeNeume.OligonPlusHypsiliRight}                  | ${220}
      ${QuantitativeNeume.OligonPlusHypsiliLeft}                   | ${233.08}
      ${QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal} | ${254.18}
      ${QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical}   | ${293.67}
      ${QuantitativeNeume.PetastiPlusDoubleHypsili}                | ${311.13}
      ${QuantitativeNeume.PetastiKentimataDoubleYpsili}            | ${339.29}
      ${QuantitativeNeume.PetastiKentimaDoubleYpsiliRight}         | ${392}
      ${QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft}          | ${440.01}
    `(
      'should play the correct starting note for 6-9-15 legetos scale when no fthora is present',
      ({ base, expectedFrequency }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.legetosIntervals = [6, 9, 15];
        options.useLegetos = true;

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(4, Scale.Diatonic, ScaleNote.Pa));
        elements.push(getNote(base));

        const events = service.computePlaybackSequence(elements, options);

        expect(events[0].frequency).toBeCloseTo(expectedFrequency, 2);
      },
    );

    it.each`
      scaleNote            | expectedFrequency
      ${ScaleNote.VouLow}  | ${77.78}
      ${ScaleNote.GaLow}   | ${87.31}
      ${ScaleNote.ThiLow}  | ${94.3}
      ${ScaleNote.KeLow}   | ${107.9}
      ${ScaleNote.Zo}      | ${116.54}
      ${ScaleNote.Ni}      | ${130.81}
      ${ScaleNote.Pa}      | ${141.29}
      ${ScaleNote.Vou}     | ${161.67}
      ${ScaleNote.Ga}      | ${174.62}
      ${ScaleNote.Thi}     | ${196}
      ${ScaleNote.Ke}      | ${211.69}
      ${ScaleNote.ZoHigh}  | ${242.24}
      ${ScaleNote.NiHigh}  | ${261.63}
      ${ScaleNote.PaHigh}  | ${293.67}
      ${ScaleNote.VouHigh} | ${317.18}
      ${ScaleNote.GaHigh}  | ${362.94}
      ${ScaleNote.ThiHigh} | ${392}
      ${ScaleNote.KeHigh}  | ${440.01}
    `(
      'should play the correct starting note for the 8-14-8 soft chromatic scale when no fthora is present',
      ({ scaleNote, expectedFrequency }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.softChromaticIntervals = [8, 14, 8];

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(2, Scale.SoftChromatic, scaleNote));
        elements.push(getNote(QuantitativeNeume.Ison));

        const events = service.computePlaybackSequence(elements, options);

        expect(events[0].frequency).toBeCloseTo(expectedFrequency, 2);
      },
    );

    it('should play the 8-14-8 soft chromatic scale', () => {
      const service = new PlaybackService();

      const options = getDefaultWorkspaceOptions();
      options.softChromaticIntervals = [8, 14, 8];

      const elements: ScoreElement[] = [];

      elements.push(getModeKey(2, Scale.SoftChromatic, ScaleNote.VouLow));
      elements.push(getNote(QuantitativeNeume.Ison));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));

      const events = service.computePlaybackSequence(elements, options);
      const expectedFrequencies = [
        77.78, 87.31, 94.3, 107.9, 116.54, 130.81, 141.29, 161.67, 174.62, 196,
        211.69, 242.24, 261.63, 293.67, 317.18, 362.94, 392, 440.01,
      ];

      expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
        expectedFrequencies,
        2,
      );
    });

    it.each`
      scaleNote            | expectedFrequency
      ${ScaleNote.VouLow}  | ${84.01}
      ${ScaleNote.GaLow}   | ${87.31}
      ${ScaleNote.ThiLow}  | ${98}
      ${ScaleNote.KeLow}   | ${103.83}
      ${ScaleNote.Zo}      | ${125.87}
      ${ScaleNote.Ni}      | ${130.81}
      ${ScaleNote.Pa}      | ${146.83}
      ${ScaleNote.Vou}     | ${155.57}
      ${ScaleNote.Ga}      | ${188.6}
      ${ScaleNote.Thi}     | ${196}
      ${ScaleNote.Ke}      | ${220}
      ${ScaleNote.ZoHigh}  | ${233.08}
      ${ScaleNote.NiHigh}  | ${282.57}
      ${ScaleNote.PaHigh}  | ${293.67}
      ${ScaleNote.VouHigh} | ${329.63}
      ${ScaleNote.GaHigh}  | ${349.23}
      ${ScaleNote.ThiHigh} | ${423.38}
      ${ScaleNote.KeHigh}  | ${440.01}
    `(
      'should play the correct starting note for the 6-20-4 hard chromatic scale when no fthora is present',
      ({ scaleNote, expectedFrequency }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.hardChromaticIntervals = [6, 20, 4];

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(2, Scale.HardChromatic, scaleNote));
        elements.push(getNote(QuantitativeNeume.Ison));

        const events = service.computePlaybackSequence(elements, options);

        expect(events[0].frequency).toBeCloseTo(expectedFrequency, 2);
      },
    );

    it('should play the 6-20-4 hard chromatic scale', () => {
      const service = new PlaybackService();

      const options = getDefaultWorkspaceOptions();
      options.hardChromaticIntervals = [6, 20, 4];

      const elements: ScoreElement[] = [];

      elements.push(getModeKey(2, Scale.HardChromatic, ScaleNote.VouLow));
      elements.push(getNote(QuantitativeNeume.Ison));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));

      const events = service.computePlaybackSequence(elements, options);
      const expectedFrequencies = [
        84.01, 87.31, 98, 103.83, 125.87, 130.81, 146.83, 155.57, 188.6, 196,
        220, 233.08, 282.57, 293.67, 329.63, 349.23, 423.38, 440.01,
      ];

      expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
        expectedFrequencies,
        2,
      );
    });

    it('should play the 12-12-6 enharmonic scale from Ga when enharmonic fthora on Ga and Zo', () => {
      const service = new PlaybackService();

      const options = getDefaultWorkspaceOptions();
      options.diatonicIntervals = [12, 10, 8];

      const elements: ScoreElement[] = [];

      elements.push(getModeKey(7, Scale.Diatonic, ScaleNote.Ga));
      elements.push(getNote(QuantitativeNeume.Ison));
      elements.push(
        getNote(QuantitativeNeume.PetastiPlusKentimaAbove, {
          fthora: Fthora.Enharmonic_Top,
        }),
      );
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(
        getNote(QuantitativeNeume.Apostrophos, {
          fthora: Fthora.Enharmonic_Top,
        }),
      );
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(
        getNote(QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical),
      );
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));

      const events = service.computePlaybackSequence(elements, options);
      const expectedFrequencies = [
        174.62, 233.08, 220, 196, 174.62, 164.82, 146.83, 130.81, 261.63,
        293.67, 311.13,
      ];

      expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
        expectedFrequencies,
        2,
      );
    });

    it('should play the 12-12-6 enharmonic scale from Ga with diatonic bottom when enharmonic fthora on Zo only', () => {
      const service = new PlaybackService();

      const options = getDefaultWorkspaceOptions();
      options.diatonicIntervals = [12, 10, 8];

      const elements: ScoreElement[] = [];

      elements.push(getModeKey(7, Scale.Diatonic, ScaleNote.Ga));
      elements.push(getNote(QuantitativeNeume.Ison));
      elements.push(
        getNote(QuantitativeNeume.PetastiPlusKentimaAbove, {
          fthora: Fthora.Enharmonic_Top,
        }),
      );
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(
        getNote(QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical),
      );
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));

      const events = service.computePlaybackSequence(elements, options);
      const expectedFrequencies = [
        174.62, 233.08, 220, 196, 174.62, 161.67, 146.83, 130.81, 261.63,
        293.67, 323.35,
      ];

      expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
        expectedFrequencies,
        2,
      );
    });

    it('should play the 12-12-6 enharmonic scale from Ga with diatonic bottom when permanent enharmonic zo is enabled', () => {
      const service = new PlaybackService();

      const options = getDefaultWorkspaceOptions();
      options.diatonicIntervals = [12, 10, 8];

      const elements: ScoreElement[] = [];

      elements.push(
        getModeKey(3, Scale.Diatonic, ScaleNote.Ga, {
          permanentEnharmonicZo: true,
        }),
      );
      elements.push(getNote(QuantitativeNeume.Ison));
      elements.push(getNote(QuantitativeNeume.PetastiPlusKentimaAbove));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(
        getNote(QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical),
      );
      elements.push(getNote(QuantitativeNeume.Oligon));
      elements.push(getNote(QuantitativeNeume.Oligon));

      const events = service.computePlaybackSequence(elements, options);
      const expectedFrequencies = [
        174.62, 233.08, 220, 196, 174.62, 161.67, 146.83, 130.81, 261.63,
        293.67, 323.35,
      ];

      expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
        expectedFrequencies,
        2,
      );
    });

    it('should play the 12-12-6 enharmonic scale from Vou when enharmonic fthora on Vou', () => {
      const service = new PlaybackService();

      const options = getDefaultWorkspaceOptions();
      options.diatonicIntervals = [12, 10, 8];

      const elements: ScoreElement[] = [];

      elements.push(getModeKey(7, Scale.Diatonic, ScaleNote.Ga));
      elements.push(getNote(QuantitativeNeume.Ison));
      elements.push(
        getNote(QuantitativeNeume.Apostrophos, {
          fthora: Fthora.Enharmonic_Top,
        }),
      );
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));
      elements.push(getNote(QuantitativeNeume.Apostrophos));

      const events = service.computePlaybackSequence(elements, options);
      const expectedFrequencies = [174.62, 155.57, 146.83, 130.81, 116.54];

      expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
        expectedFrequencies,
        2,
      );
    });

    it('should jump to martyria note for non-auto martyria', () => {
      const service = new PlaybackService();

      const options = getDefaultWorkspaceOptions();
      options.diatonicIntervals = [12, 10, 8];

      const elements: ScoreElement[] = [];

      elements.push(getModeKey(5, Scale.Diatonic, ScaleNote.Pa));
      elements.push(getNote(QuantitativeNeume.Ison));
      elements.push(getNote(QuantitativeNeume.OligonPlusKentimaAbove));
      elements.push(getNote(QuantitativeNeume.Kentemata));
      elements.push(getMartyria({ auto: false, note: Note.Pa }));
      elements.push(getNote(QuantitativeNeume.Ison));

      const events = service.computePlaybackSequence(elements, options);
      const expectedFrequencies = [
        getDiatonicFrequency(ScaleNote.Pa),
        getDiatonicFrequency(ScaleNote.Thi),
        getDiatonicFrequency(ScaleNote.Ke),
        getDiatonicFrequency(ScaleNote.Pa),
      ];

      expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
        expectedFrequencies,
        2,
      );
    });

    it.each`
      initialBpm | finalBpm | expectedResult
      ${120}     | ${60}    | ${[0, 0.5, 1, 1.5, 4, 5, 6, 7]}
      ${60}      | ${120}   | ${[0, 1, 2, 3, 2, 2.5, 3, 3.5]}
    `(
      'should schedule 8 notes correctly when tempo changes midway',
      ({ initialBpm, finalBpm, expectedResult }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();

        const elements: ScoreElement[] = [];

        const modeKey = getModeKey(1, Scale.Diatonic, ScaleNote.Pa);
        modeKey.bpm = initialBpm;

        elements.push(modeKey);
        elements.push(getNote(QuantitativeNeume.Ison));
        elements.push(getNote(QuantitativeNeume.Ison));
        elements.push(getNote(QuantitativeNeume.Ison));
        elements.push(getNote(QuantitativeNeume.Ison));

        elements.push(getTempoChange(finalBpm));

        elements.push(getNote(QuantitativeNeume.Ison));
        elements.push(getNote(QuantitativeNeume.Ison));
        elements.push(getNote(QuantitativeNeume.Ison));
        elements.push(getNote(QuantitativeNeume.Ison));

        const events = service.computePlaybackSequence(elements, options);

        expect(events.map((x) => x.transportTime)).toEqual(expectedResult);
      },
    );
  });
});

const defaultFrequencyDi = 196;

function getDefaultWorkspaceOptions() {
  return {
    useLegetos: false,
    useDefaultAttractionZo: true,
    frequencyDi: defaultFrequencyDi,
    speed: 1,

    diatonicIntervals: [12, 10, 8],
    hardChromaticIntervals: [6, 20, 4],
    softChromaticIntervals: [8, 14, 8],
    legetosIntervals: [6, 9, 15],
    zygosIntervals: [18, 4, 16, 4],
    zygosLegetosIntervals: [18, 4, 20, 4],
    spathiIntervals: [20, 4, 4, 14],
    klitonIntervals: [14, 12, 4],

    generalFlatMoria: -6,
    generalSharpMoria: 4,

    defaultAttractionZoMoria: -4,

    volumeIson: -4,
    volumeMelody: 0,

    alterationMoriaMap: {
      [Accidental.Flat_2_Right]: -2,
      [Accidental.Flat_4_Right]: -4,
      [Accidental.Flat_6_Right]: -6,
      [Accidental.Flat_8_Right]: -8,
      [Accidental.Sharp_2_Left]: 2,
      [Accidental.Sharp_4_Left]: 4,
      [Accidental.Sharp_6_Left]: 6,
      [Accidental.Sharp_8_Left]: 8,
    },
  } as PlaybackOptions;
}

function getDefaultWorkspace(elements: ScoreElement[], scale: PlaybackScale) {
  const workspace: PlaybackWorkspace = {
    events: [],
    gorgonIndexes: [],

    elements,
    elementIndex: 0,
    innerElementIndex: 0,
    currentNoteElement: null,

    options: getDefaultWorkspaceOptions(),

    intervalIndex: 0,
    frequency: defaultFrequencyDi,
    isonFrequency: 0,
    scale: scale,
    legetos: false,
    note: 3, // Thi
    noteOffset: 0,

    bpm: 0,
    beat: 0,

    ignoreAttractions: false,

    lastAlterationMoria: 0,

    //chroa
    enharmonicZo: false,
    enharmonicGa: false,
    enharmonicVou: false,
    generalFlat: false,
    generalSharp: false,

    permanentEnharmonicZo: false,
    permanentEnharmonicVou: false,
  };

  return workspace;
}

function getModeKey(
  mode: number,
  scale: Scale,
  scaleNote: ScaleNote,
  options?: Partial<ModeKeyElement>,
) {
  const element = new ModeKeyElement();
  element.mode = mode;
  element.scale = scale;
  element.scaleNote = scaleNote;

  if (options) {
    Object.assign(element, options);
  }

  return element;
}

function getNote(base: QuantitativeNeume, options?: Partial<NoteElement>) {
  const element = new NoteElement();
  element.quantitativeNeume = base;

  if (options) {
    Object.assign(element, options);
  }

  return element;
}

function getMartyria(options?: Partial<MartyriaElement>) {
  const element = new MartyriaElement();

  if (options) {
    Object.assign(element, options);
  }

  return element;
}

function getTempoChange(bpm: number) {
  const element = new TempoElement();
  element.bpm = bpm;

  return element;
}

/**
 * Frequencies for a 12-10-8 diatonic scale
 */
const diatonicFrequencyMap = new Map<ScaleNote, number>([
  [ScaleNote.VouLow, 80.84],
  [ScaleNote.GaLow, 87.31],
  [ScaleNote.ThiLow, 98],
  [ScaleNote.KeLow, 110],
  [ScaleNote.Zo, 121.12],
  [ScaleNote.Ni, 130.81],
  [ScaleNote.Pa, 146.83],
  [ScaleNote.Vou, 161.67],
  [ScaleNote.Ga, 174.62],
  [ScaleNote.Thi, 196],
  [ScaleNote.Ke, 220],
  [ScaleNote.ZoHigh, 242.24],
  [ScaleNote.NiHigh, 261.63],
  [ScaleNote.PaHigh, 293.67],
  [ScaleNote.VouHigh, 323.35],
  [ScaleNote.GaHigh, 349.23],
  [ScaleNote.ThiHigh, 392],
  [ScaleNote.KeHigh, 440.01],
]);

/**
 * Returns the frequency for a note in the 12-10-8 diatonic scale
 */
function getDiatonicFrequency(note: ScaleNote) {
  return diatonicFrequencyMap.get(note)!;
}
