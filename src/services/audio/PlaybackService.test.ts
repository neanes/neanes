import { toBeDeepCloseTo, toMatchCloseTo } from 'jest-matcher-deep-close-to';
import { describe, expect, it } from 'vitest';

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
import { Scale, ScaleNote } from '../../models/Scales';
import { PlaybackOptions, PlaybackService } from './PlaybackService';
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

        const events = service.computePlaybackSequence(elements, options, true);

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

      const events = service.computePlaybackSequence(elements, options, true);
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
      ${ScaleNote.Vou} | ${158.59}
    `(
      'should play the correct starting note for the 8-10-12 legetos scale when no fthora is present',
      ({ scaleNote, expectedFrequency }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.legetosIntervals = [8, 10, 12];
        options.useLegetos = true;

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(4, Scale.Diatonic, scaleNote));
        elements.push(getNote(QuantitativeNeume.Ison));

        const events = service.computePlaybackSequence(elements, options, true);

        expect(events[0].frequency).toBeCloseTo(expectedFrequency, 2);
      },
    );

    it.each`
      base                                                         | expectedFrequency
      ${QuantitativeNeume.HamiliPlusElaphron}                      | ${79.29}
      ${QuantitativeNeume.HamiliPlusApostrophos}                   | ${87.31}
      ${QuantitativeNeume.Hamili}                                  | ${98}
      ${QuantitativeNeume.ElaphronPlusApostrophos}                 | ${110}
      ${QuantitativeNeume.Elaphron}                                | ${118.81}
      ${QuantitativeNeume.Apostrophos}                             | ${130.81}
      ${QuantitativeNeume.Ison}                                    | ${146.83}
      ${QuantitativeNeume.Oligon}                                  | ${158.59}
      ${QuantitativeNeume.OligonPlusKentima}                       | ${174.62}
      ${QuantitativeNeume.OligonPlusKentimaAbove}                  | ${196}
      ${QuantitativeNeume.OligonPlusHypsiliRight}                  | ${220}
      ${QuantitativeNeume.OligonPlusHypsiliLeft}                   | ${237.62}
      ${QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal} | ${261.63}
      ${QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical}   | ${293.67}
      ${QuantitativeNeume.PetastiPlusDoubleHypsili}                | ${317.18}
      ${QuantitativeNeume.PetastiKentimataDoubleYpsili}            | ${349.23}
      ${QuantitativeNeume.PetastiKentimaDoubleYpsiliRight}         | ${392}
      ${QuantitativeNeume.PetastiKentimaDoubleYpsiliLeft}          | ${440.01}
    `(
      'should play the correct starting note for 8-10-12 legetos scale when no fthora is present',
      ({ base, expectedFrequency }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.legetosIntervals = [8, 10, 12];
        options.useLegetos = true;

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(4, Scale.Diatonic, ScaleNote.Pa));
        elements.push(getNote(base));

        const events = service.computePlaybackSequence(elements, options, true);

        expect(events[0].frequency).toBeCloseTo(expectedFrequency, 2);
      },
    );

    it.each`
      neume                                                       | expectedFrequency
      ${QuantitativeNeume.DoubleHamiliApostrofos}                 | ${77.78}
      ${QuantitativeNeume.DoubleHamili}                           | ${87.31}
      ${QuantitativeNeume.HamiliPlusElaphronPlusApostrophos}      | ${94.3}
      ${QuantitativeNeume.HamiliPlusElaphron}                     | ${107.9}
      ${QuantitativeNeume.HamiliPlusApostrophos}                  | ${116.54}
      ${QuantitativeNeume.Hamili}                                 | ${130.81}
      ${QuantitativeNeume.ElaphronPlusApostrophos}                | ${141.29}
      ${QuantitativeNeume.Elaphron}                               | ${161.67}
      ${QuantitativeNeume.Apostrophos}                            | ${174.62}
      ${QuantitativeNeume.Ison}                                   | ${196}
      ${QuantitativeNeume.Oligon}                                 | ${211.69}
      ${QuantitativeNeume.OligonPlusKentima}                      | ${242.24}
      ${QuantitativeNeume.OligonPlusKentimaAbove}                 | ${261.63}
      ${QuantitativeNeume.OligonPlusHypsiliRight}                 | ${293.67}
      ${QuantitativeNeume.OligonPlusHypsiliLeft}                  | ${317.18}
      ${QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal} | ${362.94}
      ${QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical}   | ${392}
      ${QuantitativeNeume.OligonPlusDoubleHypsili}                | ${440.01}
    `(
      'should play the correct starting note for the 8-14-8 soft chromatic scale when no fthora is present',
      ({ neume, expectedFrequency }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.softChromaticIntervals = [8, 14, 8];

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(2, Scale.SoftChromatic, ScaleNote.Thi));
        elements.push(getNote(neume));

        const events = service.computePlaybackSequence(elements, options, true);

        expect(events[0].frequency).toBeCloseTo(expectedFrequency, 2);
      },
    );

    it('should play the 8-14-8 soft chromatic scale', () => {
      const service = new PlaybackService();

      const options = getDefaultWorkspaceOptions();
      options.softChromaticIntervals = [8, 14, 8];

      const elements: ScoreElement[] = [];

      elements.push(getModeKey(2, Scale.SoftChromatic, ScaleNote.Thi));
      elements.push(getNote(QuantitativeNeume.DoubleHamiliApostrofos));
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

      const events = service.computePlaybackSequence(elements, options, true);
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
      neume                                                       | expectedFrequency
      ${QuantitativeNeume.HamiliPlusElaphron}                     | ${84.01}
      ${QuantitativeNeume.HamiliPlusApostrophos}                  | ${87.31}
      ${QuantitativeNeume.Hamili}                                 | ${98}
      ${QuantitativeNeume.ElaphronPlusApostrophos}                | ${103.83}
      ${QuantitativeNeume.Elaphron}                               | ${125.87}
      ${QuantitativeNeume.Apostrophos}                            | ${130.81}
      ${QuantitativeNeume.Ison}                                   | ${146.83}
      ${QuantitativeNeume.Oligon}                                 | ${155.57}
      ${QuantitativeNeume.OligonKentimaMiddleKentimata}           | ${188.6}
      ${QuantitativeNeume.OligonPlusKentimaAbove}                 | ${196}
      ${QuantitativeNeume.OligonPlusHypsiliRight}                 | ${220}
      ${QuantitativeNeume.OligonPlusHypsiliLeft}                  | ${233.08}
      ${QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal} | ${282.57}
      ${QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical}   | ${293.67}
      ${QuantitativeNeume.OligonPlusDoubleHypsili}                | ${329.63}
      ${QuantitativeNeume.OligonKentimataDoubleYpsili}            | ${349.23}
      ${QuantitativeNeume.OligonKentimaDoubleYpsiliRight}         | ${423.38}
      ${QuantitativeNeume.OligonKentimaDoubleYpsiliLeft}          | ${440.01}
    `(
      'should play the correct starting note for the 6-20-4 hard chromatic scale when no fthora is present',
      ({ neume, expectedFrequency }) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.hardChromaticIntervals = [6, 20, 4];

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(2, Scale.HardChromatic, ScaleNote.Pa));
        elements.push(getNote(neume));

        const events = service.computePlaybackSequence(elements, options, true);

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

      const events = service.computePlaybackSequence(elements, options, true);
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

      const events = service.computePlaybackSequence(elements, options, true);
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

      const events = service.computePlaybackSequence(elements, options, true);
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

      const events = service.computePlaybackSequence(elements, options, true);
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

      const events = service.computePlaybackSequence(elements, options, true);
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

      const events = service.computePlaybackSequence(elements, options, true);
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

        const events = service.computePlaybackSequence(elements, options, true);

        expect(events.map((x) => x.transportTime)).toEqual(expectedResult);
      },
    );

    it.each([
      [
        'nzkd',
        Note.NiHigh,
        [
          QuantitativeNeume.Ison,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Apostrophos,
        ],
        [
          getDiatonicFrequency(ScaleNote.NiHigh),
          getDiatonicFrequency(ScaleNote.ZoHigh, -4),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.Thi),
        ],
      ],
      [
        'nzzkd',
        Note.NiHigh,
        [
          QuantitativeNeume.Ison,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Ison,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Apostrophos,
        ],
        [
          getDiatonicFrequency(ScaleNote.NiHigh),
          getDiatonicFrequency(ScaleNote.ZoHigh, -4),
          getDiatonicFrequency(ScaleNote.ZoHigh, -4),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.Thi),
        ],
      ],
      [
        'nzn',
        Note.NiHigh,
        [
          QuantitativeNeume.Ison,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Oligon,
        ],
        [
          getDiatonicFrequency(ScaleNote.NiHigh),
          getDiatonicFrequency(ScaleNote.ZoHigh),
          getDiatonicFrequency(ScaleNote.NiHigh),
        ],
      ],
      [
        'dkzn',
        Note.Thi,
        [
          QuantitativeNeume.Ison,
          QuantitativeNeume.Oligon,
          QuantitativeNeume.Oligon,
          QuantitativeNeume.Oligon,
        ],
        [
          getDiatonicFrequency(ScaleNote.Thi),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.ZoHigh),
          getDiatonicFrequency(ScaleNote.NiHigh),
        ],
      ],
      [
        'dkzkd',
        Note.Thi,
        [
          QuantitativeNeume.Ison,
          QuantitativeNeume.Oligon,
          QuantitativeNeume.Oligon,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Apostrophos,
        ],
        [
          getDiatonicFrequency(ScaleNote.Thi),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.ZoHigh, -4),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.Thi),
        ],
      ],
      [
        'nzkkd',
        Note.NiHigh,
        [
          QuantitativeNeume.Ison,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Ison,
          QuantitativeNeume.Apostrophos,
        ],
        [
          getDiatonicFrequency(ScaleNote.NiHigh),
          getDiatonicFrequency(ScaleNote.ZoHigh, -4),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.Thi),
        ],
      ],
      [
        'nzkkzkd',
        Note.NiHigh,
        [
          QuantitativeNeume.Ison,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Ison,
          QuantitativeNeume.Oligon,
          QuantitativeNeume.Apostrophos,
          QuantitativeNeume.Apostrophos,
        ],
        [
          getDiatonicFrequency(ScaleNote.NiHigh),
          getDiatonicFrequency(ScaleNote.ZoHigh, -4),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.ZoHigh, -4),
          getDiatonicFrequency(ScaleNote.Ke),
          getDiatonicFrequency(ScaleNote.Thi),
        ],
      ],
    ])(
      'should calculate the correct zo attractions (%# - %s)',
      (
        name: string,
        startingNote: Note,
        notes: QuantitativeNeume[],
        expectedFrequencies: number[],
      ) => {
        const service = new PlaybackService();

        const options = getDefaultWorkspaceOptions();
        options.diatonicIntervals = [12, 10, 8];

        const elements: ScoreElement[] = [];

        elements.push(getModeKey(4, Scale.Diatonic, ScaleNote.Vou));
        elements.push(getMartyria({ auto: false, note: startingNote }));

        notes.forEach((x) => elements.push(getNote(x)));

        const events = service.computePlaybackSequence(elements, options, true);

        expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
          expectedFrequencies,
          2,
        );
      },
    );

    // it.each([
    //   [
    //     'nzkz',
    //     Note.NiHigh,
    //     [
    //       QuantitativeNeume.Ison,
    //       QuantitativeNeume.Apostrophos,
    //       QuantitativeNeume.Apostrophos,
    //       QuantitativeNeume.Oligon,
    //     ],
    //     [
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //       getDiatonicFrequency(ScaleNote.Ke, 5),
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //     ],
    //   ],
    //   [
    //     'nzkzn',
    //     Note.NiHigh,
    //     [
    //       QuantitativeNeume.Ison,
    //       QuantitativeNeume.Apostrophos,
    //       QuantitativeNeume.Apostrophos,
    //       QuantitativeNeume.Oligon,
    //       QuantitativeNeume.Oligon,
    //     ],
    //     [
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //       getDiatonicFrequency(ScaleNote.Ke, 5),
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //     ],
    //   ],
    //   [
    //     // This is an unlikely case where zo was never hit
    //     // before ni, so the attraction is not triggered.
    //     // Perhaps additional logic should handle this case to sharpen ke?
    //     'nkzn',
    //     Note.NiHigh,
    //     [
    //       QuantitativeNeume.Ison,
    //       QuantitativeNeume.Elaphron,
    //       QuantitativeNeume.Oligon,
    //       QuantitativeNeume.Oligon,
    //     ],
    //     [
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //       getDiatonicFrequency(ScaleNote.Ke),
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //     ],
    //   ],
    //   [
    //     'znkzn',
    //     Note.ZoHigh,
    //     [
    //       QuantitativeNeume.Ison,
    //       QuantitativeNeume.Oligon,
    //       QuantitativeNeume.Elaphron,
    //       QuantitativeNeume.Oligon,
    //       QuantitativeNeume.Oligon,
    //     ],
    //     [
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //       getDiatonicFrequency(ScaleNote.Ke, 5),
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //     ],
    //   ],
    //   [
    //     'nzkkz',
    //     Note.NiHigh,
    //     [
    //       QuantitativeNeume.Ison,
    //       QuantitativeNeume.Apostrophos,
    //       QuantitativeNeume.Apostrophos,
    //       QuantitativeNeume.Ison,
    //       QuantitativeNeume.Oligon,
    //     ],
    //     [
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //       getDiatonicFrequency(ScaleNote.Ke, 5),
    //       getDiatonicFrequency(ScaleNote.Ke, 5),
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //     ],
    //   ],
    //   [
    //     'nzkn',
    //     Note.NiHigh,
    //     [
    //       QuantitativeNeume.Ison,
    //       QuantitativeNeume.Apostrophos,
    //       QuantitativeNeume.Apostrophos,
    //       QuantitativeNeume.PetastiPlusOligon,
    //     ],
    //     [
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //       getDiatonicFrequency(ScaleNote.ZoHigh),
    //       getDiatonicFrequency(ScaleNote.Ke, 5),
    //       getDiatonicFrequency(ScaleNote.NiHigh),
    //     ],
    //   ],
    // ])(
    //   'should calculate the correct ke attractions (%# - %s)',
    //   (
    //     name: string,
    //     startingNote: Note,
    //     notes: QuantitativeNeume[],
    //     expectedFrequencies: number[],
    //   ) => {
    //     const service = new PlaybackService();

    //     const options = getDefaultWorkspaceOptions();
    //     options.diatonicIntervals = [12, 10, 8];

    //     const elements: ScoreElement[] = [];

    //     elements.push(getModeKey(4, Scale.Diatonic, ScaleNote.Vou));
    //     elements.push(getMartyria({ auto: false, note: startingNote }));

    //     notes.forEach((x) => elements.push(getNote(x)));

    //     const events = service.computePlaybackSequence(elements, options, true);

    //     expect(events.map((x) => x.frequency)).toBeDeepCloseTo(
    //       expectedFrequencies,
    //       2,
    //     );
    //   },
    // );
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
    legetosIntervals: [8, 10, 12],
    zygosIntervals: [18, 4, 16, 4],
    zygosLegetosIntervals: [18, 4, 20, 4],
    spathiIntervals: [20, 4, 4, 14],
    klitonIntervals: [14, 12, 4],

    defaultAttractionZoMoria: -4,
    defaultAttractionKeMoria: 5,

    volumeIson: -4,
    volumeMelody: 0,

    alterationMultipliers: [0.5, 0.25, 0.75],
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
function getDiatonicFrequency(note: ScaleNote, alterationMoria: number = 0) {
  return changeFrequency(diatonicFrequencyMap.get(note)!, alterationMoria);
}

function changeFrequency(currentFrequency: number, moria: number) {
  return currentFrequency * Math.pow(2, moria / 72);
}
