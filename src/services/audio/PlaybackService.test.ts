import { PlaybackOptions, PlaybackService } from './PlaybackService';
import { Scale, ScaleNote } from '../../models/Scales';
import {
  ModeKeyElement,
  NoteElement,
  ScoreElement,
  TempoElement,
} from '../../models/Element';
import { QuantitativeNeume } from '../../models/Neumes';

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
    it('should construct the spathi scale', () => {
      const service = new PlaybackService();

      expect(service.constructSpathiScale([4, 5, 6, 7], [1, 2, 3])).toEqual([
        1, 2, 3, 4, 5, 6, 7,
      ]);

      expect(service.constructSpathiScale([20, 4, 4, 14], [12, 10, 8])).toEqual(
        [12, 10, 8, 20, 4, 4, 14],
      );
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

function getDefaultWorkspaceOptions() {
  return {
    useLegetos: true,
    useDefaultAttractionZo: true,
    frequencyDi: 196,
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
  } as PlaybackOptions;
}

function getModeKey(mode: number, scale: Scale, scaleNote: ScaleNote) {
  const element = new ModeKeyElement();
  element.mode = mode;
  element.scale = scale;
  element.scaleNote = scaleNote;

  return element;
}

function getNote(base: QuantitativeNeume) {
  const element = new NoteElement();
  element.quantitativeNeume = base;

  return element;
}

function getTempoChange(bpm: number) {
  const element = new TempoElement();
  element.bpm = bpm;

  return element;
}

/*
      ${ScaleNote.VouLow}  | ${77.78}
      ${ScaleNote.GaLow}   | ${84.82}
      ${ScaleNote.ThiLow}  | ${98}
      ${ScaleNote.KeLow}   | ${110}
      ${ScaleNote.Zo}      | ${116.54}
      ${ScaleNote.Ni}      | ${127.09}
      ${ScaleNote.Pa}      | ${146.83}
      ${ScaleNote.Vou}     | ${155.57}
      ${ScaleNote.Ga}      | ${169.65}
      ${ScaleNote.Thi}     | ${196}
      ${ScaleNote.Ke}      | ${220}
      ${ScaleNote.ZoHigh}  | ${233.08}
      ${ScaleNote.NiHigh}  | ${254.18}
      ${ScaleNote.PaHigh}  | ${293.67}
      ${ScaleNote.VouHigh} | ${311.13}
      ${ScaleNote.GaHigh}  | ${339.29}
      ${ScaleNote.ThiHigh} | ${392}
      ${ScaleNote.KeHigh}  | ${440.01}
*/
