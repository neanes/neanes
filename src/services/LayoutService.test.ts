import type { Box, Glue, InputItem, Penalty } from 'tex-linebreak';
import {
  breakLines,
  forcedBreak,
  MAX_COST,
  positionItems,
} from 'tex-linebreak';
import { describe, expect, it } from 'vitest';

import type { ScoreElement } from '../models/Element';
import {
  DropCapElement,
  MartyriaElement,
  NoteElement,
  TempoElement,
  TextBoxElement,
} from '../models/Element';
import type { MeasureBar } from '../models/Neumes';
import {
  Fthora,
  GorgonNeume,
  QuantitativeNeume,
  restNeumes,
} from '../models/Neumes';
import { Line, Page } from '../models/Page';
import { PageSetup } from '../models/PageSetup';
import { Scale } from '../models/Scales';
import { resolvePageMargins } from '../utils/PageMargins';
import { LayoutService } from './LayoutService';

const itif = (condition: boolean) => (condition ? it : it.skip);

describe('LayoutService.calculateMartyriae', () => {
  it('normalizes all fthora slots in one layout pass', () => {
    const note = new NoteElement();
    note.quantitativeNeume =
      QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata;
    note.fthora = Fthora.Zygos_Bottom;
    note.secondaryFthora = Fthora.Kliton_TopSecondary;
    note.tertiaryFthora = Fthora.GeneralFlat_TopTertiary;
    const pageSetup = new PageSetup();

    LayoutService.calculateMartyriae([note], pageSetup);

    expect(note.fthora).toBeNull();
    expect(note.secondaryFthora).toBeNull();
    expect(note.tertiaryFthora).toBeNull();
    expect(note.fthoraCarry).toBe(Fthora.Zygos_Bottom);
    expect(note.secondaryFthoraCarry).toBe(Fthora.Kliton_TopSecondary);
    expect(note.tertiaryFthoraCarry).toBe(Fthora.GeneralFlat_TopTertiary);
    const normalized = note.captureNotationState();

    LayoutService.calculateMartyriae([note], pageSetup);
    expect(note.captureNotationState()).toEqual(normalized);
  });

  it('applies a valid secondary fthora when the primary fthora is invalid', () => {
    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.OligonPlusKentemata;
    note.fthora = Fthora.Kliton_Bottom;
    note.secondaryFthora = Fthora.Enharmonic_TopSecondary;
    const martyria = new MartyriaElement();
    const pageSetup = new PageSetup();

    LayoutService.calculateMartyriae([note, martyria], pageSetup);

    expect(note.fthora).toBeNull();
    expect(note.fthoraCarry).toBe(Fthora.Kliton_Bottom);
    expect(note.secondaryFthora).toBe(Fthora.Enharmonic_TopSecondary);
    expect(martyria.scale).toBe(Scale.EnharmonicVou);
    const normalized = note.captureNotationState();
    const scale = martyria.scale;

    LayoutService.calculateMartyriae([note, martyria], pageSetup);
    expect(note.captureNotationState()).toEqual(normalized);
    expect(martyria.scale).toBe(scale);
  });

  it('applies an attached quantitative-neume fthora after its interval', () => {
    const martyria = new MartyriaElement();
    martyria.auto = false;
    martyria.alignRight = true;
    martyria.quantitativeNeume = QuantitativeNeume.OligonPlusKentimaAbove;
    martyria.quantitativeNeumeFthora = Fthora.Zygos_Top;

    const nextMartyria = new MartyriaElement();

    LayoutService.calculateMartyriae([martyria, nextMartyria], new PageSetup());

    expect(martyria.quantitativeNeumeFthora).toBe(Fthora.Zygos_Top);
    expect(martyria.quantitativeNeumeFthoraCarry).toBeNull();
    expect(nextMartyria.scale).toBe(Scale.Zygos);
  });
});

describe.each([true, false])(
  'LayoutService.findFinalAndNextElement',
  (isHyphen) => {
    it(`works for adjacent melismas (no next) [isHyphen=${isHyphen}]`, () => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const element = melismaStart;
      const line = getLine(melismaStart, expectedFinalElement);
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBeNull();
    });

    it(`works for adjacent melismas (with next) [isHyphen=${isHyphen}]`, () => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const expectedNextElement = new NoteElement();
      expectedNextElement.isMelisma = true;
      expectedNextElement.isMelismaStart = true;

      const element = melismaStart;
      const line = getLine(
        melismaStart,
        expectedFinalElement,
        expectedNextElement,
      );
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBe(expectedNextElement);
    });

    it.each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(`skips $type (no next) [isHyphen=${isHyphen}]`, () => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const martyria = new MartyriaElement();

      const element = melismaStart;
      const line = getLine(melismaStart, martyria, expectedFinalElement);
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBeNull();
    });

    it.each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(`skips $type (with next) [isHyphen=${isHyphen}]`, () => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const martyriaElement = new MartyriaElement();

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const expectedNextElement = new NoteElement();
      expectedNextElement.isMelisma = true;
      expectedNextElement.isMelismaStart = true;

      const element = melismaStart;
      const line = getLine(
        melismaStart,
        martyriaElement,
        expectedFinalElement,
        expectedNextElement,
      );
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBe(expectedNextElement);
    });

    it.each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(
      `skips $type (with next and consecutive continouous elements) [isHyphen=${isHyphen}]`,
      () => {
        const melismaStart = new NoteElement();
        melismaStart.isHyphen = isHyphen;
        melismaStart.isMelisma = true;
        melismaStart.isMelismaStart = true;

        const martyriaElement = new MartyriaElement();
        const tempoElement = new TempoElement();

        const expectedFinalElement = new NoteElement();
        expectedFinalElement.isMelisma = true;

        const expectedNextElement = new NoteElement();
        expectedNextElement.isMelisma = true;
        expectedNextElement.isMelismaStart = true;

        const element = melismaStart;
        const line = getLine(
          melismaStart,
          martyriaElement,
          tempoElement,
          expectedFinalElement,
          expectedNextElement,
        );
        const firstElementOnNextLine = null;

        const { finalElement, nextElement } =
          LayoutService.findFinalAndNextElement(
            line,
            element,
            firstElementOnNextLine,
            1,
          );

        expect(finalElement).toBe(expectedFinalElement);
        expect(nextElement).toBe(expectedNextElement);
      },
    );

    itif(!isHyphen).each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(
      `skips $type and ends in correct place (with next and consecutive continouous elements) [isHyphen=${isHyphen}]`,
      () => {
        const melismaStart = new NoteElement();
        melismaStart.isHyphen = isHyphen;
        melismaStart.isMelisma = true;
        melismaStart.isMelismaStart = true;

        const expectedNextElement = new TempoElement();
        const martyriaNote = new MartyriaElement();

        const expectedFinalElement = new NoteElement();
        expectedFinalElement.isMelisma = true;

        const newNote = new NoteElement();
        newNote.isMelisma = true;
        newNote.isMelismaStart = true;

        const element = melismaStart;
        const line = getLine(
          melismaStart,
          expectedFinalElement,
          expectedNextElement,
          martyriaNote,
          newNote,
        );
        const firstElementOnNextLine = null;

        const { finalElement, nextElement } =
          LayoutService.findFinalAndNextElement(
            line,
            element,
            firstElementOnNextLine,
            1,
          );

        expect(finalElement).toBe(expectedFinalElement);
        expect(nextElement).toBe(expectedNextElement);
      },
    );

    itif(!isHyphen).each([
      { type: 'martyria', expectedNextElement: new MartyriaElement() },
      { type: 'tempo', expectedNextElement: new TempoElement() },
      { type: 'inline text box', expectedNextElement: getInlineTextBox() },
    ])(`stops at $type [isHyphen=${isHyphen}]`, ({ expectedNextElement }) => {
      const melismaStart = new NoteElement();
      melismaStart.isHyphen = isHyphen;
      melismaStart.isMelisma = true;
      melismaStart.isMelismaStart = true;

      const expectedFinalElement = new NoteElement();
      expectedFinalElement.isMelisma = true;

      const element = melismaStart;
      const line = getLine(
        melismaStart,
        expectedFinalElement,
        expectedNextElement,
        new NoteElement(),
      );
      const firstElementOnNextLine = null;

      const { finalElement, nextElement } =
        LayoutService.findFinalAndNextElement(
          line,
          element,
          firstElementOnNextLine,
          1,
        );

      expect(finalElement).toBe(expectedFinalElement);
      expect(nextElement).toBe(expectedNextElement);
    });
  },
);

describe('LayoutService.applyRuntPenalty', () => {
  it.each(restNeumes)(
    'discourages a break that leaves one %s rest',
    (restNeume) => {
      const { items, notes, breakPenalties } = getRuntPenaltyItems(3);
      notes[2].quantitativeNeume = restNeume;

      LayoutService.applyRuntPenalty(items, null);

      expect(breakPenalties.map((penalty) => penalty.cost)).toEqual([
        0,
        MAX_COST * 0.15,
        0,
      ]);
    },
  );

  it('discourages a break that leaves two notes', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(4);
    notes[2].quantitativeNeume = QuantitativeNeume.VareiaDotted;

    LayoutService.applyRuntPenalty(items, null);

    expect(breakPenalties.map((penalty) => penalty.cost)).toEqual([
      0,
      MAX_COST * 0.15,
      0,
      0,
    ]);
  });

  it('applies the penalty to the end of a melisma', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(3);
    notes[0].isMelisma = true;
    notes[0].isMelismaStart = true;
    notes[1].isMelisma = true;
    notes[2].isMelisma = true;

    LayoutService.applyRuntPenalty(items, null);

    // Only the last note of the melisma qualifies. The two-note breakpoint
    // would begin the final line with notes[1], which is mid-melisma.
    expect(breakPenalties.map((penalty) => penalty.cost)).toEqual([
      0,
      MAX_COST * 0.15,
      0,
    ]);
  });

  it('does not apply the penalty to ordinary notes', () => {
    const { items, breakPenalties } = getRuntPenaltyItems(3);

    LayoutService.applyRuntPenalty(items, null);

    expect(breakPenalties.map((penalty) => penalty.cost)).toEqual([0, 0, 0]);
  });

  it('penalizes a two-note paragraph without reading past the first item', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(2);
    notes[1].quantitativeNeume = QuantitativeNeume.VareiaDotted;

    LayoutService.applyRuntPenalty(items, null);

    expect(breakPenalties.map((penalty) => penalty.cost)).toEqual([
      MAX_COST * 0.15,
      0,
    ]);
  });

  it('leaves a one-note paragraph alone', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(1);
    notes[0].quantitativeNeume = QuantitativeNeume.VareiaDotted;

    LayoutService.applyRuntPenalty(items, null);

    expect(breakPenalties.map((penalty) => penalty.cost)).toEqual([0]);
  });

  it('adds to an existing penalty', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(3);
    notes[2].quantitativeNeume = QuantitativeNeume.VareiaDotted;
    breakPenalties[1].cost = MAX_COST * 0.5;

    LayoutService.applyRuntPenalty(items, null);

    expect(breakPenalties[1].cost).toBe(MAX_COST * 0.65);
  });

  it('caps the total at the worst cost the break rules produce', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(3);
    notes[2].quantitativeNeume = QuantitativeNeume.VareiaDotted;
    breakPenalties[1].cost = MAX_COST * 0.85;

    LayoutService.applyRuntPenalty(items, null);

    expect(breakPenalties[1].cost).toBe(MAX_COST * 0.95);
  });

  it('leaves a breakpoint that is already at the cap alone', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(3);
    notes[2].quantitativeNeume = QuantitativeNeume.VareiaDotted;
    breakPenalties[1].cost = MAX_COST * 0.95;

    LayoutService.applyRuntPenalty(items, null);

    expect(breakPenalties[1].cost).toBe(MAX_COST * 0.95);
  });

  it('does not weaken a prohibited breakpoint', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(3);
    notes[2].quantitativeNeume = QuantitativeNeume.VareiaDotted;
    breakPenalties[1].cost = MAX_COST;

    LayoutService.applyRuntPenalty(items, null);

    expect(breakPenalties[1].cost).toBe(MAX_COST);
  });

  it('does not count a terminal non-note element as a tail element', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(
      3,
      new MartyriaElement(),
    );
    notes[1].quantitativeNeume = QuantitativeNeume.VareiaDotted;
    notes[2].quantitativeNeume = QuantitativeNeume.VareiaDotted;

    LayoutService.applyRuntPenalty(items, null);

    // Were the martyria counted, it would consume a tail slot and the
    // two-note breakpoint would fall one note earlier, leaving this one at 0.
    expect(breakPenalties.map((penalty) => penalty.cost)).toEqual([
      MAX_COST * 0.15,
      MAX_COST * 0.15,
      0,
    ]);
  });

  it('sees through a non-note box between the tail notes', () => {
    const { items, notes, breakPenalties } = getRuntPenaltyItems(
      3,
      undefined,
      new TempoElement(),
    );
    notes[1].quantitativeNeume = QuantitativeNeume.VareiaDotted;
    notes[2].quantitativeNeume = QuantitativeNeume.VareiaDotted;

    LayoutService.applyRuntPenalty(items, null);

    // Were the tempo counted, it would consume a tail slot and the walk would
    // stop one note earlier, leaving the two-note breakpoint at 0.
    expect(breakPenalties.map((penalty) => penalty.cost)).toEqual([
      MAX_COST * 0.15,
      MAX_COST * 0.15,
      0,
    ]);
  });

  it('leaves the martyria breakpoint itself unpenalized', () => {
    const { items, notes, terminalBreakPenalty } = getRuntPenaltyItems(
      3,
      new MartyriaElement(),
    );
    notes[2].quantitativeNeume = QuantitativeNeume.VareiaDotted;

    LayoutService.applyRuntPenalty(items, null);

    // The martyria's breakpoint is preceded by its pre-break glue rather than
    // a note box, so the rule does not reach it even though breaking there
    // would strand the trailing rest.
    expect(terminalBreakPenalty!.cost).toBe(0);
  });
});

describe('LayoutService.mayShowLeadingLyricHyphen', () => {
  it('suppresses Greek start hyphens when Greek melismata are enabled', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = true;
    note.lyrics = 'τω';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup)).toBe(
      false,
    );
  });

  it('suppresses Greek continuation hyphens when Greek melismata are enabled', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = true;
    note.isMelisma = true;
    note.lyrics = '';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup, true)).toBe(
      false,
    );
  });

  it('allows non-Greek hyphens', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = true;
    note.lyrics = 'test';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup)).toBe(true);
  });

  it('allows Greek hyphens when Greek melismata are disabled', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.disableGreekMelismata = true;

    const note = new NoteElement();
    note.isHyphen = true;
    note.lyrics = 'τω';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup)).toBe(true);
  });

  it('does not allow non-hyphen notes', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = false;
    note.lyrics = 'τω';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup)).toBe(
      false,
    );
  });

  it('allows non-Greek continuation hyphens outside active Greek melismas', () => {
    const pageSetup = getMockPageSetup();

    const note = new NoteElement();
    note.isHyphen = true;
    note.isMelisma = true;
    note.lyrics = '';

    expect(
      LayoutService.mayShowLeadingLyricHyphen(note, pageSetup, false),
    ).toBe(true);
  });

  it('allows Greek continuation hyphens when Greek melismata are disabled', () => {
    const pageSetup = getMockPageSetup();
    pageSetup.disableGreekMelismata = true;

    const note = new NoteElement();
    note.isHyphen = true;
    note.isMelisma = true;
    note.lyrics = '';

    expect(LayoutService.mayShowLeadingLyricHyphen(note, pageSetup, true)).toBe(
      true,
    );
  });
});

describe('Greek melisma collision geometry', () => {
  it('suppresses a vowel overlapping a left-aligned starting syllable', () => {
    const start = new NoteElement();
    start.alignLeft = true;
    start.neumeWidth = 20;
    start.lyricsWidth = 40;

    const continuation = new NoteElement();
    continuation.x = 38;
    continuation.neumeWidth = 10;

    const previousEnd =
      start.x + LayoutService['getLyricTextRight'](start, false);
    expect(previousEnd).toBe(40);
    expect(
      LayoutService['getGreekMelismaTextEnd'](
        continuation,
        10,
        previousEnd,
        Infinity,
        4,
      ),
    ).toBeNull();
  });

  it('uses the full offset for a left-aligned syllable with a vareia', () => {
    const start = new NoteElement();
    start.alignLeft = true;
    start.x = 100;
    start.neumeWidth = 30;
    start.lyricsWidth = 40;
    start.lyricsHorizontalOffset = 10;

    expect(start.x + LayoutService['getLyricTextRight'](start, false)).toBe(
      150,
    );
  });

  it('retains the centered starting syllable geometry', () => {
    const start = new NoteElement();
    start.x = 100;
    start.neumeWidth = 30;
    start.lyricsWidth = 20;
    start.lyricsHorizontalOffset = 10;

    expect(start.x + LayoutService['getLyricTextRight'](start, false)).toBe(
      130,
    );
  });

  it('requires clearance from the previous visible repetition', () => {
    const first = new NoteElement();
    first.x = 40;
    first.neumeWidth = 10;
    const firstEnd = LayoutService['getGreekMelismaTextEnd'](
      first,
      20,
      30,
      Infinity,
      4,
    );
    expect(firstEnd).toBe(55);

    const second = new NoteElement();
    second.x = 58;
    second.neumeWidth = 10;
    expect(
      LayoutService['getGreekMelismaTextEnd'](
        second,
        20,
        firstEnd,
        Infinity,
        4,
      ),
    ).toBeNull();

    // A hidden repetition does not move the last visible text's boundary.
    second.x = 64;
    expect(
      LayoutService['getGreekMelismaTextEnd'](
        second,
        20,
        firstEnd,
        Infinity,
        4,
      ),
    ).toBe(79);
  });

  it('requires clearance before a following real syllable at a line start', () => {
    const continuation = new NoteElement();
    continuation.neumeWidth = 10;

    expect(
      LayoutService['getGreekMelismaTextEnd'](continuation, 20, null, 18, 4),
    ).toBeNull();
    expect(
      LayoutService['getGreekMelismaTextEnd'](continuation, 20, null, 19, 4),
    ).toBe(15);
  });

  it('includes a continuation offset when accepting exact clearance', () => {
    const continuation = new NoteElement();
    continuation.x = 40;
    continuation.neumeWidth = 10;
    continuation.lyricsHorizontalOffset = 10;

    expect(
      LayoutService['getGreekMelismaTextEnd'](continuation, 20, 36, 64, 4),
    ).toBe(60);
  });

  it('finds the following real lyric through inline elements', () => {
    const continuation = new NoteElement();
    const next = new NoteElement();
    next.x = 100;
    next.neumeWidth = 20;
    next.lyricsWidth = 40;
    next.lyricsHorizontalOffset = 10;
    const line = getLine(continuation, getInlineTextBox(), next);

    expect(
      LayoutService['getFollowingLyricStarts'](line).get(continuation),
    ).toBe(95);
    next.alignLeft = true;
    expect(
      LayoutService['getFollowingLyricStarts'](line).get(continuation),
    ).toBe(110);
  });

  it('does not carry following lyric bounds across block elements', () => {
    const continuation = new NoteElement();
    const next = new NoteElement();
    next.lyricsWidth = 40;
    const line = getLine(continuation, new TextBoxElement(), next);

    expect(
      LayoutService['getFollowingLyricStarts'](line).get(continuation),
    ).toBe(Infinity);
    expect(
      LayoutService['getFollowingLyricStarts'](getLine(continuation)).get(
        continuation,
      ),
    ).toBe(Infinity);
  });
});

describe('Greek apostrophos-hyporoe pairs', () => {
  function setup() {
    const setup = new PageSetup();
    setup.leftMargin = 0;
    setup.rightMargin = 0;
    setup.lyricsMinimumSpacing = 4;
    const start = new NoteElement();
    Object.assign(start, {
      x: 100,
      neumeWidth: 20,
      lyrics: 'ρου',
      lyricsWidth: 20,
      isMelismaStart: true,
      isMelisma: true,
    });
    const first = new NoteElement();
    Object.assign(first, {
      x: 130,
      neumeWidth: 10,
      isMelisma: true,
      quantitativeNeume: QuantitativeNeume.Apostrophos,
    });
    const apostrophos = new NoteElement();
    Object.assign(apostrophos, {
      x: 150,
      neumeWidth: 10,
      isMelisma: true,
      quantitativeNeume: QuantitativeNeume.Apostrophos,
    });
    const hyporoe = new NoteElement();
    Object.assign(hyporoe, {
      x: 164,
      neumeWidth: 10,
      isMelisma: true,
      quantitativeNeume: QuantitativeNeume.Hyporoe,
      gorgonNeume: GorgonNeume.Gorgon_Top,
    });
    const next = new NoteElement();
    Object.assign(next, {
      x: 188,
      neumeWidth: 10,
      lyrics: 'με',
      lyricsWidth: 10,
    });
    const line = getLine(start, first, apostrophos, hyporoe, next);
    const repetitions = new Map(
      [first, apostrophos, hyporoe].map(
        (note) => [note, { text: 'ου', width: 12 }] as const,
      ),
    );
    return {
      setup,
      start,
      first,
      apostrophos,
      hyporoe,
      next,
      line,
      repetitions,
    };
  }

  it('centers ου on apostrophos-hyporoe, not the preceding two apostrophos signs', () => {
    const data = setup();
    const texts = LayoutService['layoutGreekMelismaTextOnLine'](
      data.line,
      data.setup,
      new Map(),
      data.repetitions,
      resolvePageMargins(data.setup, 1),
    );
    expect(texts.get(data.first)).toBe('ου');
    expect(texts.get(data.apostrophos)).toBe('ου');
    expect(texts.get(data.hyporoe)).toBe('');
    expect(data.first.lyricsHorizontalOffset).toBe(0);
    const left =
      data.apostrophos.x +
      (data.apostrophos.neumeWidth +
        data.apostrophos.lyricsHorizontalOffset -
        12) /
        2;
    expect(left).toBe(156);
  });

  it('centers a starting syllable on the pair even when a second vowel fits', () => {
    const data = setup();
    data.apostrophos.lyrics = 'τη';
    data.apostrophos.lyricsWidth = 10;
    data.apostrophos.isMelismaStart = true;
    data.line.elements = [data.apostrophos, data.hyporoe, data.next];
    const texts = LayoutService['layoutGreekMelismaTextOnLine'](
      data.line,
      data.setup,
      new Map(),
      data.repetitions,
      resolvePageMargins(data.setup, 1),
    );
    expect(texts.get(data.hyporoe)).toBe('');
    expect(
      data.apostrophos.x + LayoutService['getLyricTextLeft'](data.apostrophos),
    ).toBe(157);
  });

  it.each([false, true])(
    'centers a complete consonant-ending lyric without splitting it (isHyphen=%s)',
    (isHyphen) => {
      const data = setup();
      Object.assign(data.apostrophos, {
        lyrics: 'μην',
        lyricsWidth: 30,
        isMelismaStart: true,
        isHyphen,
      });
      data.hyporoe.isHyphen = isHyphen;
      data.line.elements = [data.apostrophos, data.hyporoe, data.next];
      const pairs = LayoutService['prepareGreekMelismaPairs'](
        data.line.elements,
        data.setup,
        new Map(),
      );
      expect(pairs.get(data.apostrophos)).toBe(data.hyporoe);
      expect(
        LayoutService['getMelismaBreakConstraint'](
          data.apostrophos,
          data.hyporoe,
          false,
          pairs.has(data.apostrophos),
        ).cost,
      ).toBe(MAX_COST);
      const texts = LayoutService['layoutGreekMelismaTextOnLine'](
        data.line,
        data.setup,
        new Map(),
        data.repetitions,
        resolvePageMargins(data.setup, 1),
      );
      expect(texts.get(data.hyporoe)).toBe('');
      expect(
        data.apostrophos.x +
          LayoutService['getLyricTextLeft'](data.apostrophos),
      ).toBe(147);
      expect(data.apostrophos.lyrics).toBe('μην');
      expect(data.hyporoe.lyrics).toBe('');
    },
  );

  it('keeps separately entered opening and closing fragments separate', () => {
    const data = setup();
    Object.assign(data.apostrophos, {
      lyrics: 'μη',
      lyricsWidth: 10,
      isMelismaStart: true,
      isHyphen: true,
    });
    Object.assign(data.hyporoe, {
      lyrics: 'ην',
      lyricsWidth: 10,
      isMelisma: false,
    });
    data.line.elements = [data.apostrophos, data.hyporoe, data.next];
    expect(
      LayoutService['getGreekMelismaPairs'](data.line.elements, data.setup)
        .size,
    ).toBe(0);
    LayoutService['layoutGreekMelismaTextOnLine'](
      data.line,
      data.setup,
      new Map(),
      new Map(),
      resolvePageMargins(data.setup, 1),
    );
    expect(data.apostrophos.lyrics).toBe('μη');
    expect(data.hyporoe.lyrics).toBe('ην');
    expect(data.apostrophos.lyricsHorizontalOffset).toBe(0);
    expect(data.hyporoe.lyricsHorizontalOffset).toBe(0);
  });

  it('keeps a drop-cap syllable in place during both pair layout phases', () => {
    const data = setup();
    const dropCap = new DropCapElement();
    dropCap.content = 'Κ';
    data.apostrophos.lyrics = 'υ';
    data.apostrophos.lyricsWidth = 10;
    data.apostrophos.isMelismaStart = true;
    data.line.elements = [dropCap, data.apostrophos, data.hyporoe];

    // Without the drop-cap exclusion, Phase 1 would shift υ by seven pixels.
    const centered = LayoutService['getGreekMelismaPairTextBounds'](
      data.apostrophos,
      data.hyporoe,
      0,
      14,
      10,
      data.setup,
      new Map(),
    );
    expect(centered.left).toBe(7);
    const pairs = LayoutService['prepareGreekMelismaPairs'](
      data.line.elements,
      data.setup,
      new Map(),
    );
    expect(pairs.get(data.apostrophos)).toBe(data.hyporoe);
    expect(data.apostrophos.alignLeft).toBe(false);
    expect(data.apostrophos.lyricsHorizontalOffset).toBe(0);

    LayoutService['layoutGreekMelismaTextOnLine'](
      data.line,
      data.setup,
      new Map(),
      data.repetitions,
      resolvePageMargins(data.setup, 1),
    );
    expect(data.apostrophos.alignLeft).toBe(false);
    expect(data.apostrophos.lyricsHorizontalOffset).toBe(0);
  });

  it('does not extend the pair to further omitted repetitions', () => {
    const data = setup();
    const omitted = new NoteElement();
    Object.assign(omitted, { x: 170, neumeWidth: 4, isMelisma: true });
    data.line.elements.splice(4, 0, omitted);
    data.repetitions.set(omitted, { text: 'ου', width: 12 });
    const texts = LayoutService['layoutGreekMelismaTextOnLine'](
      data.line,
      data.setup,
      new Map(),
      data.repetitions,
      resolvePageMargins(data.setup, 1),
    );
    expect(texts.get(omitted)).toBe('');
    expect(data.apostrophos.lyricsHorizontalOffset).toBe(14);
  });

  it('prohibits an automatic line break inside the pair', () => {
    const data = setup();
    const pairs = LayoutService['getGreekMelismaPairs'](
      data.line.elements,
      data.setup,
    );
    const constraint = LayoutService['getMelismaBreakConstraint'](
      data.apostrophos,
      data.hyporoe,
      false,
      pairs.has(data.apostrophos),
    );
    expect(constraint.cost).toBe(MAX_COST);
    const items: InputItem[] = [
      { type: 'box', width: 20 },
      glueItem(0, 100, 0),
      { type: 'box', width: 20 },
      penaltyItem(constraint.cost),
      glueItem(0, 0, 0),
      { type: 'box', width: 20 },
      glueItem(0, 100, 0),
      { type: 'box', width: 20 },
      glueItem(0, 100, 0),
      forcedBreak(),
    ];
    const breaks = breakLines(items, 40);
    expect(breaks).not.toContain(3);
    const positions = positionItems(items, 40, breaks);
    expect(positions.find((position) => position.item === 2)!.line).toBe(
      positions.find((position) => position.item === 5)!.line,
    );
    expect(positions.find((position) => position.item === 7)!.line).not.toBe(
      positions.find((position) => position.item === 2)!.line,
    );
  });

  it.each(['lineBreak', 'pageBreak'] as const)('honors explicit %s', (flag) => {
    const data = setup();
    data.apostrophos[flag] = true;
    expect(
      LayoutService['getGreekMelismaPairs'](data.line.elements, data.setup)
        .size,
    ).toBe(0);
  });

  it('preserves explicit lyrics on the hyporoe', () => {
    const data = setup();
    data.hyporoe.lyrics = 'με';
    data.hyporoe.lyricsWidth = 10;
    expect(
      LayoutService['getGreekMelismaPairs'](data.line.elements, data.setup)
        .size,
    ).toBe(0);
  });

  it('does not pair across an inline element', () => {
    const data = setup();
    data.line.elements.splice(3, 0, getInlineTextBox());
    expect(
      LayoutService['getGreekMelismaPairs'](data.line.elements, data.setup)
        .size,
    ).toBe(0);
  });

  it('does not apply to an English melisma', () => {
    const data = setup();
    data.start.lyrics = 'word';
    expect(
      LayoutService['getGreekMelismaPairs'](data.line.elements, data.setup)
        .size,
    ).toBe(0);
  });

  it.each(['disableGreekMelismata', 'melkiteRtl'] as const)(
    'does not apply when %s is enabled',
    (flag) => {
      const data = setup();
      data.setup[flag] = true;
      expect(
        LayoutService['getGreekMelismaPairs'](data.line.elements, data.setup)
          .size,
      ).toBe(0);
    },
  );

  it('uses the same centered bounds for Phase 1 reservation and Phase 2 display', () => {
    const data = setup();
    const bounds = LayoutService['getGreekMelismaPairTextBounds'](
      data.apostrophos,
      data.hyporoe,
      150,
      164,
      12,
      data.setup,
      new Map(),
    );
    expect(bounds).toEqual({ left: 156, right: 168 });
    expect(
      LayoutService['getGreekMelismaBoundaryMinimumWidth'](
        bounds.right,
        data.next,
        174,
        4,
        0,
      ),
    ).toBe(-2);
  });
});

describe('Greek melisma syllable-boundary spacing', () => {
  const standardGlue: Glue = { type: 'glue', width: 0, stretch: 2, shrink: 2 };

  it.each([
    ['γλω', 'ω', 'σσα', true],
    ['κα', 'α', 'λλει', false],
    ['σμε', 'ε', 'νων', false],
  ] as const)(
    'keeps the final %s repetition before %s / %s visible',
    (lyric, vowel, followingLyric, followingStartsMelisma) => {
      const start = new NoteElement();
      Object.assign(start, {
        x: 100,
        neumeWidth: 10,
        lyrics: lyric,
        lyricsWidth: 20,
        alignLeft: true,
        isMelisma: true,
        isMelismaStart: true,
      });
      const tail = new NoteElement();
      Object.assign(tail, { x: 999, neumeWidth: 10, isMelisma: true });
      const next = new NoteElement();
      Object.assign(next, {
        neumeWidth: 10,
        lyrics: followingLyric,
        lyricsWidth: 20,
        alignLeft: followingStartsMelisma,
        isMelismaStart: followingStartsMelisma,
        isMelisma: followingStartsMelisma,
      });

      // Phase 1 uses its current cursor, not coordinates from a prior layout.
      const end = LayoutService['getGreekMelismaTextEnd'](
        tail,
        12,
        120,
        Infinity,
        4,
        140,
      );
      expect(end).toBe(151);
      const minimum = LayoutService['getGreekMelismaBoundaryMinimumWidth'](
        end,
        next,
        150,
        4,
        0,
      );
      expect(minimum).toBe(5);
      const glue = LayoutService['createNotePostBreakGlue'](
        standardGlue,
        5,
        minimum,
      );
      expect(glue.shrink).toBe(0);

      tail.x = 140;
      const projection = LayoutService['getLyricProjections'](
        next,
        next.alignLeft,
      ).leftProjection;
      next.x = 150 + glue.width - glue.shrink + projection;
      const setup = new PageSetup();
      setup.leftMargin = 0;
      setup.lyricsMinimumSpacing = 4;
      const line = getLine(start, tail, next);
      const texts = LayoutService['layoutGreekMelismaTextOnLine'](
        line,
        setup,
        new Map(),
        new Map([[tail, { text: vowel, width: 12 }]]),
        resolvePageMargins(setup, 1),
      );
      expect(texts.get(tail)).toBe(vowel);
      expect(start.lyricsHorizontalOffset).toBe(0);
      expect(next.x + LayoutService['getLyricTextLeft'](next) - end!).toBe(4);
    },
  );

  it('reserves clearance for every generated vowel, including one initially crowded by the starting syllable', () => {
    const setup = new PageSetup();
    setup.leftMargin = 0;
    setup.rightMargin = 0;
    setup.lyricsMinimumSpacing = 4;
    const start = new NoteElement();
    Object.assign(start, {
      x: 100,
      neumeWidth: 10,
      lyrics: 'σου',
      lyricsWidth: 22,
      alignLeft: true,
      isMelisma: true,
      isMelismaStart: true,
    });
    const notes = Array.from({ length: 7 }, () => {
      const note = new NoteElement();
      Object.assign(note, {
        neumeWidth: 10,
        isMelisma: true,
        quantitativeNeume: QuantitativeNeume.Apostrophos,
      });
      return note;
    });
    const following = new NoteElement();
    Object.assign(following, { neumeWidth: 10, lyrics: 'με', lyricsWidth: 14 });
    let previous = start;
    let previousEnd = 122;
    for (const note of notes) {
      const bounds = LayoutService['getGreekRepetitionBounds'](
        note,
        undefined,
        12,
        setup,
        new Map(),
      );
      const minimum = LayoutService['getGreekMelismaBoundaryMinimumWidth'](
        previousEnd,
        note,
        previous.x + previous.neumeWidth,
        4,
        0,
        bounds.left,
      )!;
      const glue = LayoutService['createNotePostBreakGlue'](
        standardGlue,
        Math.max(0, minimum),
        minimum,
      );
      // Even maximum permitted shrink must leave every vowel visible.
      note.x =
        previous.x +
        previous.neumeWidth +
        glue.width -
        glue.shrink +
        Math.max(0, -bounds.left);
      expect(note.x + bounds.left - previousEnd).toBeCloseTo(4);
      previousEnd = note.x + bounds.right;
      previous = note;
    }
    const minimum = LayoutService['getGreekMelismaBoundaryMinimumWidth'](
      previousEnd,
      following,
      previous.x + previous.neumeWidth,
      4,
      0,
    )!;
    following.x =
      previous.x +
      previous.neumeWidth +
      minimum +
      LayoutService['getLyricProjections'](following, false).leftProjection;
    const texts = LayoutService['layoutGreekMelismaTextOnLine'](
      getLine(start, ...notes, following),
      setup,
      new Map(),
      new Map(notes.map((note) => [note, { text: 'ου', width: 12 }])),
      resolvePageMargins(setup, 1),
    );
    expect([...texts.values()]).toEqual(Array(7).fill('ου'));
    expect(
      following.x + LayoutService['getLyricTextLeft'](following) - previousEnd,
    ).toBeCloseTo(4);
    expect(notes.every((note) => note.lyricsHorizontalOffset === 0)).toBe(true);
  });

  it('reserves incoming clearance for the single text of an apostrophos-hyporoe pair', () => {
    const setup = new PageSetup();
    const apostrophos = new NoteElement();
    const hyporoe = new NoteElement();
    Object.assign(apostrophos, {
      neumeWidth: 10,
      quantitativeNeume: QuantitativeNeume.Apostrophos,
    });
    Object.assign(hyporoe, {
      neumeWidth: 10,
      quantitativeNeume: QuantitativeNeume.Hyporoe,
    });
    const bounds = LayoutService['getGreekRepetitionBounds'](
      apostrophos,
      hyporoe,
      12,
      setup,
      new Map(),
    );
    const minimum = LayoutService['getGreekMelismaBoundaryMinimumWidth'](
      130,
      apostrophos,
      120,
      4,
      0,
      bounds.left,
    )!;
    const x = 120 + minimum + Math.max(0, -bounds.left);
    expect(x + bounds.left - 130).toBeCloseTo(4);
    expect(bounds.right - bounds.left).toBe(12);
  });

  it('does not reserve vowel clearance without generated geometry or at score end', () => {
    const next = new NoteElement();
    next.isMelisma = true;
    expect(
      LayoutService['getGreekMelismaBoundaryMinimumWidth'](
        151,
        next,
        150,
        4,
        0,
      ),
    ).toBeNull();
    expect(
      LayoutService['getGreekMelismaBoundaryMinimumWidth'](
        151,
        null,
        150,
        4,
        0,
      ),
    ).toBeNull();
  });

  it('counts existing fixed spacing toward the required clearance', () => {
    const next = new NoteElement();
    next.neumeWidth = 10;
    next.lyricsWidth = 20;
    next.alignLeft = true;
    expect(
      LayoutService['getGreekMelismaBoundaryMinimumWidth'](
        151,
        next,
        150,
        4,
        3,
      ),
    ).toBe(2);
    expect(
      LayoutService['getGreekMelismaBoundaryMinimumWidth'](
        151,
        next,
        150,
        4,
        -3,
      ),
    ).toBe(8);
  });

  it('allows shrink only in excess of the vowel clearance', () => {
    const glue = LayoutService['createNotePostBreakGlue'](standardGlue, 6, 5);
    expect(glue.width - glue.shrink).toBe(5);
    expect(glue.stretch).toBe(2);
    expect(
      LayoutService['createNotePostBreakGlue'](standardGlue, 6, null).shrink,
    ).toBe(2);
  });

  it('accepts exact fractional clearance despite floating-point rounding', () => {
    const tail = new NoteElement();
    tail.x = 144.3;
    tail.neumeWidth = 10;
    expect(
      LayoutService['getGreekMelismaTextEnd'](tail, 10, null, 159.1, 4.8),
    ).toBeCloseTo(154.3);
  });
});

describe('Greek melisma starts centered on their own note', () => {
  function setup(lyrics = 'ρρε') {
    const start = new NoteElement();
    Object.assign(start, {
      lyrics,
      lyricsWidth: 24,
      neumeWidth: 10,
      quantitativeNeume: QuantitativeNeume.Hyporoe,
      isMelisma: true,
      isMelismaStart: true,
    });
    const continuation = new NoteElement();
    continuation.isMelisma = true;
    const pageSetup = new PageSetup();
    const align = (previous: ScoreElement | null = null) => {
      start.alignLeft = LayoutService['shouldAlignLeft'](
        start,
        continuation,
        pageSetup,
        previous,
      );
    };
    return { start, continuation, pageSetup, align };
  }

  it('centers ρρε on the hyporoe and reserves both lyric projections', () => {
    const data = setup();
    data.align();
    expect(data.start.alignLeft).toBe(false);
    expect(LayoutService['getLyricTextLeft'](data.start)).toBe(-7);
    expect(LayoutService['getLyricTextRight'](data.start, false)).toBe(17);
    expect(LayoutService['getLyricProjections'](data.start, false)).toEqual({
      leftProjection: 7,
      rightProjection: 7,
    });
  });

  it('centers the syllable without centering its punctuation', () => {
    const data = setup('ρρε,');
    data.start.lyricsWidth = 28;
    data.start.lyricsTrailingPunctuationWidth = 4;
    data.align();
    LayoutService['applyPunctuationHorizontalOffset'](
      data.start,
      data.pageSetup,
    );
    expect(LayoutService['getLyricTextLeft'](data.start)).toBe(-7);
    expect(LayoutService['getLyricTextRight'](data.start, false)).toBe(21);
  });

  it('preserves the existing drop-cap syllable alignment', () => {
    const data = setup();
    data.align(new DropCapElement());
    expect(data.start.alignLeft).toBe(true);
  });

  it.each(['disableGreekMelismata', 'melkiteRtl'] as const)(
    'preserves existing alignment when %s is enabled',
    (option) => {
      const data = setup();
      data.pageSetup[option] = true;
      data.align();
      expect(data.start.alignLeft).toBe(true);
    },
  );

  it('preserves the English melisma alignment decision', () => {
    const data = setup('word');
    data.align();
    expect(data.start.alignLeft).toBe(true);
  });

  it('allows the shared apostrophos-hyporoe rule to override single-note centering', () => {
    const data = setup('μην');
    data.start.quantitativeNeume = QuantitativeNeume.Apostrophos;
    data.continuation.quantitativeNeume = QuantitativeNeume.Hyporoe;
    data.continuation.neumeWidth = 10;
    data.align();
    const pairs = LayoutService['prepareGreekMelismaPairs'](
      [data.start, data.continuation],
      data.pageSetup,
      new Map(),
    );
    expect(pairs.get(data.start)).toBe(data.continuation);
    expect(data.start.alignLeft).toBe(true);
    const bounds = LayoutService['getGreekMelismaPairTextBounds'](
      data.start,
      data.continuation,
      0,
      10 +
        LayoutService['getMelismaContinuationBoundaryWidth'](
          data.start,
          data.continuation,
          data.pageSetup,
          new Map(),
        ),
      24,
      data.pageSetup,
      new Map(),
    );
    expect(data.start.lyricsHorizontalOffset).toBe(bounds.left);
  });
});

describe('Greek melisma placement without general span centering', () => {
  function setup(lyricWidth = 20) {
    const start = new NoteElement();
    start.x = 100;
    start.neumeWidth = 10;
    start.lyrics = 'στη';
    start.lyricsWidth = lyricWidth;
    start.isMelisma = true;
    start.isMelismaStart = true;
    start.alignLeft = true;
    start.quantitativeNeume = QuantitativeNeume.Apostrophos;

    const continuation = new NoteElement();
    continuation.x = 114;
    continuation.neumeWidth = 10;
    continuation.isMelisma = true;
    continuation.quantitativeNeume = QuantitativeNeume.Apostrophos;

    const pageSetup = new PageSetup();
    pageSetup.leftMargin = 0;
    pageSetup.rightMargin = 0;
    pageSetup.lyricsMinimumSpacing = 4;
    const line = getLine(start, continuation);
    const widths = new Map([[continuation, { text: 'η', width: 6 }]]);
    const bars = new Map<MeasureBar, number>();
    return { start, continuation, pageSetup, line, widths, bars };
  }

  function layout(data: ReturnType<typeof setup>, physicalPageNumber = 1) {
    return LayoutService['layoutGreekMelismaTextOnLine'](
      data.line,
      data.pageSetup,
      data.bars,
      data.widths,
      resolvePageMargins(data.pageSetup, physicalPageNumber),
    );
  }

  it.each([
    { facing: false, page: 1, right: 160 },
    { facing: true, page: 1, right: 160 },
    { facing: true, page: 2, right: 180 },
  ])(
    'keeps generated vowels within the right margin (facing=$facing, page=$page)',
    ({ facing, page, right }) => {
      const data = setup();
      data.pageSetup.pageWidth = 200;
      data.pageSetup.leftMargin = 20;
      data.pageSetup.rightMargin = 40;
      data.pageSetup.facingPages = facing;
      data.widths.set(data.continuation, { text: 'ου', width: 12 });
      data.continuation.x = right - 11;

      // A vowel ending exactly at the margin remains visible; no extra
      // lyric clearance is required beyond the page's content boundary.
      expect(layout(data, page).get(data.continuation)).toBe('ου');
      data.continuation.x += 0.1;
      expect(layout(data, page).get(data.continuation)).toBe('');
      expect(data.continuation.lyricsHorizontalOffset).toBe(0);
    },
  );

  it('keeps a line-initial generated vowel inside the left margin and indentation', () => {
    const data = setup();
    data.line.elements = [data.continuation];
    data.line.indentation = 100;
    data.widths.set(data.continuation, { text: 'ου', width: 12 });
    data.continuation.x = 100;
    expect(layout(data).get(data.continuation)).toBe('');
    data.continuation.x = 101;
    expect(layout(data).get(data.continuation)).toBe('ου');
  });

  it.each(['μου', 'σσα'])(
    'keeps %s on its original neume when a vowel is omitted',
    (lyric) => {
      const data = setup();
      data.start.lyrics = lyric;
      const texts = layout(data);
      expect(texts.get(data.continuation)).toBe('');
      expect(data.start.alignLeft).toBe(true);
      expect(data.start.lyricsHorizontalOffset).toBe(0);
      expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
        100,
      );
    },
  );

  it('preserves an initially centered syllable when its continuation is omitted', () => {
    const data = setup(6);
    data.start.alignLeft = false;
    data.widths.set(data.continuation, { text: 'η', width: 12 });
    const next = new NoteElement();
    Object.assign(next, {
      x: 132,
      neumeWidth: 10,
      lyricsWidth: 20,
      lyrics: 'σας',
    });
    data.line.elements.push(next);
    const texts = layout(data);
    expect(texts.get(data.continuation)).toBe('');
    expect(data.start.alignLeft).toBe(false);
    expect(data.start.lyricsHorizontalOffset).toBe(0);
    expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
      102,
    );
  });

  it('keeps a surviving vowel on its original neume when the next repetition is omitted', () => {
    const data = setup();
    data.continuation.x = 140;
    data.widths.set(data.continuation, { text: 'ο', width: 12 });
    const omitted = new NoteElement();
    Object.assign(omitted, { x: 152, neumeWidth: 10, isMelisma: true });
    const next = new NoteElement();
    Object.assign(next, { x: 180, neumeWidth: 10, isMelisma: true });
    data.line.elements.push(omitted, next);
    data.widths.set(omitted, { text: 'ο', width: 12 });
    data.widths.set(next, { text: 'ο', width: 12 });
    const texts = layout(data);
    expect([...texts.values()]).toEqual(['ο', '', 'ο']);
    expect(data.continuation.lyricsHorizontalOffset).toBe(0);
    expect(next.lyricsHorizontalOffset).toBe(0);
    expect(data.line.elements.map((note) => note.x)).toEqual([
      100, 140, 152, 180,
    ]);
  });

  it('does not apply when Greek melismata are disabled', () => {
    const data = setup();
    data.pageSetup.disableGreekMelismata = true;
    const page = new Page();
    page.lines = [data.line];
    expect(
      LayoutService['layoutGreekMelismaText']([page], data.pageSetup, data.bars)
        .size,
    ).toBe(0);
    expect(data.start.alignLeft).toBe(true);
  });

  it('preserves Greek vowel generation in RTL scores', () => {
    const data = setup();
    data.pageSetup.melkiteRtl = true;
    data.continuation.x = 140;
    const texts = layout(data);
    expect(texts.get(data.continuation)).toBe('η');
    expect(data.start.alignLeft).toBe(true);
  });
});

function getInlineTextBox() {
  const inlineTextBox = new TextBoxElement();
  inlineTextBox.inline = true;
  return inlineTextBox;
}

function getLine(...elements: ScoreElement[]) {
  const line = new Line();
  line.elements = elements;
  return line;
}

function elementBox(element: ScoreElement): Box & { element: ScoreElement } {
  return { type: 'box', width: 10, element };
}

function penaltyItem(cost: number): Penalty {
  return { type: 'penalty', cost, width: 0, flagged: false };
}

function glueItem(width: number, stretch: number, shrink: number): InputItem {
  return { type: 'glue', width, stretch, shrink };
}

function getRuntPenaltyItems(
  noteCount: number,
  terminalElement?: ScoreElement,
  elementBeforeLastNote?: ScoreElement,
) {
  const items: InputItem[] = [];
  const notes: NoteElement[] = [];
  const breakPenalties: Penalty[] = [];
  // The martyria's own breakpoint, when a terminal element is present. It is
  // not preceded by a note box, so applyRuntPenalty never reaches it.
  let terminalBreakPenalty: Penalty | null = null;

  for (let i = 0; i < noteCount; i++) {
    if (elementBeforeLastNote != null && i === noteCount - 1) {
      // A tempo or inline text box between two notes: a box followed by
      // standard glue, contributing no penalty of its own.
      items.push(elementBox(elementBeforeLastNote), glueItem(5, 5, 5));
    }

    const note = new NoteElement();
    notes.push(note);
    items.push(elementBox(note));

    // Break opportunity after the neume: an unlabeled penalty immediately
    // after the box, then the post-break glue.
    const penalty = penaltyItem(0);
    breakPenalties.push(penalty);
    items.push(penalty, glueItem(5, 5, 5));
  }

  if (terminalElement != null) {
    // addProtectedBreakpointEncoding: the break must occur at the penalty
    // rather than before the pre-break glue, so the post-break glue is
    // skipped on the next line.
    terminalBreakPenalty = penaltyItem(0);
    items.push(
      elementBox(terminalElement),
      penaltyItem(MAX_COST),
      glueItem(0, 0, 0),
      terminalBreakPenalty,
      glueItem(5, 5, 5),
    );
  }

  // removeGlue strips the paragraph's trailing glue before the finishing glue
  // is applied.
  while (items[items.length - 1].type === 'glue') {
    items.pop();
  }

  // The paragraph terminator that endParagraph appends before the penalties
  // are applied: prevent-break, finishing glue, forced break.
  items.push(
    penaltyItem(MAX_COST),
    glueItem(0, MAX_COST, 0),
    penaltyItem(-MAX_COST),
  );

  return { items, notes, breakPenalties, terminalBreakPenalty };
}

function getMockPageSetup() {
  const pageSetup = new PageSetup();
  pageSetup.neumeDefaultFontFamily = 'MockFont';
  return pageSetup;
}
