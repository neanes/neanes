import type { Box, InputItem, Penalty } from 'tex-linebreak';
import { MAX_COST } from 'tex-linebreak';
import { describe, expect, it } from 'vitest';

import type { ScoreElement } from '../models/Element';
import {
  MartyriaElement,
  NoteElement,
  TempoElement,
  TextBoxElement,
} from '../models/Element';
import {
  Fthora,
  MeasureBar,
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

describe('Greek melisma span centering', () => {
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

  function center(data: ReturnType<typeof setup>, physicalPageNumber = 1) {
    return LayoutService['layoutGreekMelismaTextOnLine'](
      data.line,
      data.pageSetup,
      data.bars,
      data.widths,
      resolvePageMargins(data.pageSetup, physicalPageNumber),
    );
  }

  it('centers the only displayed syllable over two apostrophos signs', () => {
    const data = setup();
    center(data);
    expect(data.start.alignLeft).toBe(false);
    expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
      102,
    );
    expect(
      data.start.x + LayoutService['getLyricTextRight'](data.start, false),
    ).toBe(122);
  });

  it('centers a syllable wider than the group when surrounding space permits', () => {
    const data = setup(28);
    center(data);
    expect(data.start.alignLeft).toBe(false);
    expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
      98,
    );
  });

  it('does not center a group with a visible repeated vowel', () => {
    const data = setup();
    data.continuation.x = 140;
    center(data);
    expect(data.start.alignLeft).toBe(true);
    expect(data.start.lyricsHorizontalOffset).toBe(0);
  });

  it('centers τη over its opening span before the next visible η', () => {
    const data = setup();
    data.start.lyrics = 'τη';
    const next = new NoteElement();
    next.x = 140;
    next.neumeWidth = 10;
    next.isMelisma = true;
    data.line.elements.push(next);
    data.widths.set(next, { text: 'η', width: 6 });
    const texts = center(data);

    expect(texts.get(data.continuation)).toBe('');
    expect(texts.get(next)).toBe('η');
    expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
      102,
    );
    expect(next.lyricsHorizontalOffset).toBe(0);
    expect(data.line.elements.map((note) => note.x)).toEqual([100, 114, 140]);
  });

  it('centers an initially centered syllable when its continuation is omitted', () => {
    const data = setup(6);
    data.start.alignLeft = false;
    data.widths.set(data.continuation, { text: 'η', width: 12 });
    const next = new NoteElement();
    next.x = 132;
    next.neumeWidth = 10;
    next.lyricsWidth = 20;
    next.lyrics = 'σας';
    data.line.elements.push(next);
    const texts = center(data);

    expect(texts.get(data.continuation)).toBe('');
    expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
      109,
    );
  });

  it('centers a surviving ο over its own note and the omitted repetition', () => {
    const data = setup();
    data.continuation.x = 140;
    data.widths.set(data.continuation, { text: 'ο', width: 12 });
    const omitted = new NoteElement();
    omitted.x = 152;
    omitted.neumeWidth = 10;
    omitted.isMelisma = true;
    const next = new NoteElement();
    next.x = 180;
    next.neumeWidth = 10;
    next.isMelisma = true;
    data.line.elements.push(omitted, next);
    data.widths.set(omitted, { text: 'ο', width: 12 });
    data.widths.set(next, { text: 'ο', width: 12 });
    const texts = center(data);

    expect([...texts.values()]).toEqual(['ο', '', 'ο']);
    const displayedLeft =
      data.continuation.x +
      (data.continuation.neumeWidth +
        data.continuation.lyricsHorizontalOffset -
        12) /
        2;
    expect(displayedLeft).toBe(145);
    expect(next.lyricsHorizontalOffset).toBe(0);
  });

  it('keeps a generated vowel in place if centering would crowd a real lyric', () => {
    const data = setup();
    data.continuation.x = 140;
    data.widths.set(data.continuation, { text: 'ο', width: 12 });
    const omitted = new NoteElement();
    omitted.x = 152;
    omitted.neumeWidth = 10;
    omitted.isMelisma = true;
    const next = new NoteElement();
    next.x = 160;
    next.neumeWidth = 10;
    next.lyricsWidth = 10;
    next.lyrics = 'ος';
    data.line.elements.push(omitted, next);
    data.widths.set(omitted, { text: 'ο', width: 12 });
    const texts = center(data);

    expect([...texts.values()]).toEqual(['ο', '']);
    expect(data.continuation.lyricsHorizontalOffset).toBe(0);
    expect(next.lyricsHorizontalOffset).toBe(0);
  });

  it('keeps an omitted vowel hidden after centering', () => {
    const data = setup(28);
    data.continuation.lyricsHorizontalOffset = 30;
    // Visibility stays fixed even if the centered position would free space.
    const texts = center(data);
    expect(data.start.alignLeft).toBe(false);
    expect(texts.get(data.continuation)).toBe('');
  });

  it('preserves clearance to the preceding syllable', () => {
    const data = setup(28);
    const previous = new NoteElement();
    previous.x = 80;
    previous.neumeWidth = 10;
    previous.lyricsWidth = 28;
    data.line.elements.unshift(previous);
    center(data);
    expect(data.start.alignLeft).toBe(true);
  });

  it('preserves clearance to the following syllable', () => {
    const data = setup();
    const next = new NoteElement();
    next.x = 124;
    next.neumeWidth = 10;
    next.lyricsWidth = 10;
    data.line.elements.push(next);
    center(data);
    expect(data.start.alignLeft).toBe(true);
  });

  it('preserves clearance to a preceding visible Greek repetition', () => {
    const data = setup(28);
    const previous = new NoteElement();
    previous.x = 50;
    previous.neumeWidth = 10;
    previous.lyricsWidth = 10;
    const repetition = new NoteElement();
    repetition.x = 84;
    repetition.neumeWidth = 10;
    repetition.isMelisma = true;
    data.line.elements.unshift(previous, repetition);
    data.widths.set(repetition, { text: 'ο', width: 12 });
    center(data);
    expect(data.start.alignLeft).toBe(true);
  });

  it('centers only the local span on the current line', () => {
    const data = setup();
    center(data);
    expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
      102,
    );
  });

  it('does not group separately entered continuation lyrics', () => {
    const data = setup();
    data.continuation.lyrics = 'η';
    data.continuation.lyricsWidth = 6;
    center(data);
    expect(data.start.alignLeft).toBe(true);
  });

  it('ends the local span at a trailing martyria', () => {
    const data = setup();
    data.line.elements.push(new MartyriaElement());
    center(data);
    expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
      102,
    );
  });

  it("uses the following group's centered position for clearance", () => {
    const data = setup();
    const following = setup(28);
    following.start.x = 128;
    following.continuation.x = 142;
    data.line.elements.push(following.start, following.continuation);
    data.widths.set(following.continuation, { text: 'η', width: 6 });
    center(data);
    // The following group moves left to 126. The first group's centered
    // end at 122 still leaves the required four-pixel gap.
    expect(
      following.start.x + LayoutService['getLyricTextLeft'](following.start),
    ).toBe(126);
    expect(
      data.start.x + LayoutService['getLyricTextRight'](data.start, false),
    ).toBe(122);
    expect(data.start.alignLeft).toBe(false);
  });

  it('does not center mixed-element melismas', () => {
    const data = setup();
    data.line.elements.splice(1, 0, getInlineTextBox());
    center(data);
    expect(data.start.alignLeft).toBe(true);
  });

  it('respects the line indentation when centering would move left', () => {
    const data = setup(28);
    data.line.indentation = 100;
    center(data);
    expect(data.start.alignLeft).toBe(true);
  });

  it.each([
    { inside: 20, outside: 100, x: 100, width: 28, centered: false, left: 100 },
    { inside: 100, outside: 20, x: 40, width: 28, centered: true, left: 38 },
    { inside: 20, outside: 100, x: 150, width: 20, centered: true, left: 152 },
    { inside: 100, outside: 20, x: 80, width: 20, centered: false, left: 80 },
  ])(
    'uses facing-page bounds with inside=$inside, outside=$outside, x=$x',
    ({ inside, outside, x, width, centered, left }) => {
      const data = setup(width);
      data.pageSetup.facingPages = true;
      data.pageSetup.pageWidth = 200;
      data.pageSetup.leftMargin = inside;
      data.pageSetup.rightMargin = outside;
      data.start.x = x;
      data.continuation.x = x + 14;
      center(data, 2);

      expect(data.start.alignLeft).toBe(!centered);
      expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
        left,
      );
    },
  );

  it('resolves facing-page parity using the displayed first page number', () => {
    const data = setup(28);
    data.pageSetup.facingPages = true;
    data.pageSetup.firstPageNumber = 2;
    data.pageSetup.leftMargin = 20;
    data.pageSetup.rightMargin = 100;
    center(data, 1);

    expect(data.start.alignLeft).toBe(true);
    expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
      100,
    );
  });

  it('excludes left and right measure bars from the centered span', () => {
    const data = setup();
    data.start.measureBarLeft = MeasureBar.MeasureBarRight;
    data.continuation.measureBarRight = MeasureBar.MeasureBarDouble;
    data.start.neumeWidth = 14;
    data.start.lyricsHorizontalOffset = 4;
    data.continuation.x = 118;
    data.continuation.neumeWidth = 18;
    data.continuation.lyricsHorizontalOffset = -8;
    data.bars.set(MeasureBar.MeasureBarRight, 4);
    data.bars.set(MeasureBar.MeasureBarDouble, 8);
    center(data);
    expect(data.start.x + LayoutService['getLyricTextLeft'](data.start)).toBe(
      106,
    );
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

  it('preserves Greek vowel generation without centering in RTL scores', () => {
    const data = setup();
    data.pageSetup.melkiteRtl = true;
    data.continuation.x = 140;
    const texts = center(data);
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
