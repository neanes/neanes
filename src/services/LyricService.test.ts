import { describe, expect, it } from 'vitest';

import { NoteElement, ScoreElement } from '../models/Element';
import { LyricService } from './LyricService';

describe('LyricService (English)', () => {
  it('should extract single word', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test');
  });

  it('should extract two words', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('one'));
    scoreElements.push(createNote('two'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('one two');
  });

  it('should extract hyphenated word 2 syllables', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('ing'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test-ing');
  });

  it('should extract hyphenated word 3 syllables', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('tes', true, true, true));
    scoreElements.push(createNote('ti', true, true, true));
    scoreElements.push(createNote('fy'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('tes-ti-fy');
  });

  it('should extract hyphenated word 2 syllables with middle melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('', true, false, true));
    scoreElements.push(createNote('ing'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test--ing');
  });

  it('should extract melisma lasting 2 notes', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test__');
  });

  it('should extract melisma lasting 3-notes', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true));
    scoreElements.push(createNote('', true, false));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test___');
  });

  it('should extract hyphenated word with melisma at end', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('ing', true, true));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test-ing__');
  });

  it('should extract word after melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('one', true, true));
    scoreElements.push(createNote('', true, false));
    scoreElements.push(createNote('two'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('one__ two');
  });
});

describe('LyricService (Greek)', () => {
  it('should extract single word', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('των'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('των');
  });

  it('should extract two words', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('των'));
    scoreElements.push(createNote('γαρ'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('των γαρ');
  });

  it('should extract melisma CV', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('τω__');
  });

  it('should extract hyphenated CVC', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, true));
    scoreElements.push(createNote('ων'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('των__');
  });

  it('should extract melisma CVC with melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, true));
    scoreElements.push(createNote('', true, true, true, 'ω'));
    scoreElements.push(createNote('ων'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('των___');
  });

  it('should extract word after melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, false));
    scoreElements.push(createNote('', true, false, false, 'ω'));
    scoreElements.push(createNote('ων'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('τω__ ων');
  });
});

function createNote(
  lyrics: string,
  isMelisma: boolean = false,
  isMelismaStart: boolean = false,
  isHyphen: boolean = false,
  melismaText: string = '',
) {
  const note = new NoteElement();
  note.lyrics = lyrics;
  note.isMelisma = isMelisma;
  note.isHyphen = isHyphen;
  note.isMelismaStart = isMelismaStart;
  note.melismaText = melismaText;

  return note;
}
