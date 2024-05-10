import { describe, expect, it } from 'vitest';

import { NoteElement, ScoreElement } from '../models/Element';
import { LyricService } from './LyricService';

describe('LyricService', () => {
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

function createNote(
  lyrics: string,
  isMelisma: boolean = false,
  isMelismaStart: boolean = false,
  isHyphen: boolean = false,
) {
  const note = new NoteElement();
  note.lyrics = lyrics;
  note.isMelisma = isMelisma;
  note.isHyphen = isHyphen;
  note.isMelismaStart = isMelismaStart;

  return note;
}
