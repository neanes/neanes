import { describe, expect, it } from 'vitest';

import {
  EmptyElement,
  NoteElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import { Score } from '@/models/Score';
import { SaveService } from '@/services/SaveService';

import {
  footnoteStartMax,
  footnoteSymbol,
  footnoteSymbolPosition,
  isValidFootnoteStart,
  MAX_FOOTNOTE_START_NUMBER,
  MAX_FOOTNOTE_START_SYMBOL_REPETITIONS,
} from './FootnoteMarker';
import { orderedFootnotes } from './FootnoteReferences';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

function fixture() {
  const score = new Score();
  const anchors = Array.from({ length: 4 }, () => new NoteElement());
  score.staff.elements = [...anchors, new EmptyElement()];
  score.footnotes = anchors.map((anchor) => {
    const footnote = new Footnote();
    anchor.footnoteId = footnote.id;
    return footnote;
  });
  return { score, anchors };
}

const labels = (score: Score) =>
  orderedFootnotes(score).map(({ marker }) => marker);

describe('automatic footnote sequences', () => {
  it('bounds starting values without limiting later automatic entries', () => {
    const maximum = footnoteStartMax('symbols', 'standard');
    expect(maximum).toBe(6 * MAX_FOOTNOTE_START_SYMBOL_REPETITIONS);
    expect(isValidFootnoteStart(maximum, 'symbols', 'standard')).toBe(true);
    expect(footnoteSymbol(maximum, 'standard')).toBe('‖'.repeat(64));
    for (const value of [
      maximum + 1,
      1_000_000_000_000,
      Infinity,
      NaN,
      0,
      1.5,
    ]) {
      expect(isValidFootnoteStart(value, 'symbols', 'standard')).toBe(false);
    }
    expect(
      isValidFootnoteStart(MAX_FOOTNOTE_START_NUMBER, 'numbers', 'standard'),
    ).toBe(true);
    expect(
      isValidFootnoteStart(
        MAX_FOOTNOTE_START_NUMBER + 1,
        'numbers',
        'standard',
      ),
    ).toBe(false);
    expect(footnoteSymbol(maximum + 1, 'standard')).toBe('*'.repeat(65));
  });

  it('repeats the six symbols in order without a fixed endpoint', () => {
    expect(
      Array.from({ length: 14 }, (_, index) =>
        footnoteSymbol(index + 1, 'standard'),
      ),
    ).toEqual([
      '*',
      '†',
      '‡',
      '§',
      '¶',
      '‖',
      '**',
      '††',
      '‡‡',
      '§§',
      '¶¶',
      '‖‖',
      '***',
      '†††',
    ]);
    for (let position = 1; position <= 120; position++) {
      expect(
        footnoteSymbolPosition(
          footnoteSymbol(position, 'standard'),
          'standard',
        ),
      ).toBe(position);
    }
    expect(footnoteSymbolPosition(' †† ', 'standard')).toBe(8);
    for (const value of ['', '*†', 'dagger', '† †', '1']) {
      expect(footnoteSymbolPosition(value, 'standard')).toBeNull();
    }
  });

  it('repeats asterisks and persists the selected sequence', () => {
    const { score } = fixture();
    Object.assign(score.pageSetup, {
      footnoteFormat: 'symbols',
      footnoteSymbolSequence: 'asterisks',
      firstFootnoteNumber: 2,
    });
    expect(labels(score)).toEqual(['**', '***', '****', '*****']);
    const loaded = SaveService.LoadScoreFromJson(
      JSON.parse(JSON.stringify(SaveService.SaveScoreToJson(score))),
    );
    expect(loaded.pageSetup.footnoteSymbolSequence).toBe('asterisks');
    expect(labels(loaded)).toEqual(labels(score));
    expect(footnoteStartMax('symbols', 'asterisks')).toBe(64);
    expect(isValidFootnoteStart(65, 'symbols', 'asterisks')).toBe(false);
    expect(footnoteSymbol(65, 'asterisks')).toBe('*'.repeat(65));
    for (let position = 1; position <= 64; position++) {
      expect(footnoteSymbolPosition('*'.repeat(position), 'asterisks')).toBe(
        position,
      );
    }
    expect(footnoteSymbolPosition('†', 'asterisks')).toBeNull();
  });

  it('uses the configured start and skips custom markers', () => {
    const { score } = fixture();
    score.pageSetup.footnoteFormat = 'symbols';
    score.pageSetup.firstFootnoteNumber = 5;
    score.footnotes[1].marker = 'Custom';
    expect(labels(score)).toEqual(['¶', 'Custom', '‖', '**']);
    expect(orderedFootnotes(score)[1].automaticMarker).toBe('‖');
    score.footnotes[1].marker = null;
    expect(labels(score)).toEqual(['¶', '‖', '**', '††']);
    score.pageSetup.footnoteFormat = 'numbers';
    expect(labels(score)).toEqual(['5', '6', '7', '8']);
  });

  it('restarts at the same nonempty section markers as the editor, including a reference in the heading itself', () => {
    const { score, anchors } = fixture();
    score.pageSetup.footnoteNumbering = 'section';
    score.pageSetup.firstFootnoteNumber = 7;
    const section = new TextBoxElement();
    section.runningMarkerRole = 'section';
    section.content = 'Section';
    const emptySection = new TextBoxElement();
    emptySection.runningMarkerRole = 'section';
    const chapter = new TextBoxElement();
    chapter.runningMarkerRole = 'chapter';
    chapter.content = 'Chapter';
    const richSection = new RichTextBoxElement();
    richSection.runningMarkerRole = 'section';
    richSection.content = `<p>Heading <span class="neanes-footnote" data-footnote-id="${score.footnotes[3].id}"></span></p>`;
    score.staff.elements = [
      anchors[0],
      chapter,
      anchors[1],
      emptySection,
      section,
      anchors[2],
      richSection,
      new EmptyElement(),
    ];
    expect(labels(score)).toEqual(['7', '8', '7', '7']);
    section.content = '';
    expect(labels(score)).toEqual(['7', '8', '9', '7']);
  });

  it('round trips all numbering settings and supplies the original defaults for older files', () => {
    const { score } = fixture();
    Object.assign(score.pageSetup, {
      footnoteFormat: 'symbols',
      footnoteNumbering: 'section',
      firstFootnoteNumber: 8,
    });
    const saved = SaveService.SaveScoreToJson(score);
    const loaded = SaveService.LoadScoreFromJson(
      JSON.parse(JSON.stringify(saved)),
    );
    expect(loaded.pageSetup.footnoteFormat).toBe('symbols');
    expect(loaded.pageSetup.footnoteNumbering).toBe('section');
    expect(loaded.pageSetup.footnoteSymbolSequence).toBe('standard');
    expect(labels(loaded)).toEqual(['††', '‡‡', '§§', '¶¶']);
    delete saved.pageSetup.footnoteFormat;
    delete saved.pageSetup.footnoteNumbering;
    delete saved.pageSetup.footnoteSymbolSequence;
    const legacy = SaveService.LoadScoreFromJson(saved);
    expect(legacy.pageSetup.footnoteFormat).toBe('numbers');
    expect(legacy.pageSetup.footnoteNumbering).toBe('continuous');
    expect(labels(legacy)).toEqual(['8', '9', '10', '11']);
  });
});
