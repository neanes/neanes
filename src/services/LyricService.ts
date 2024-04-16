import { ElementType, NoteElement, ScoreElement } from '@/models/Element';

export class LyricService {
  extractLyrics(elements: ScoreElement[]): string {
    let lyrics = '';

    let needSpace = false;

    for (const element of elements.filter(
      (x) => x.elementType === ElementType.Note,
    )) {
      const note = element as NoteElement;

      if (!note.isMelisma || note.isMelismaStart) {
        if (needSpace) {
          lyrics += ' ';
        }

        lyrics += note.lyrics;
        needSpace = !note.isMelismaStart;
      }

      if (note.isHyphen) {
        lyrics += '-';
      } else if (note.isMelisma) {
        lyrics += '_';
        needSpace = true;
      }
    }

    return lyrics.trimEnd();
  }
}

export class LyricTokenizer {
  private lyrics: string;
  private index: number = 0;

  constructor(lyrics: string) {
    this.lyrics = lyrics;
  }

  getNextToken() {
    const breakingCharacters = ['-', '_'];

    let token = '';

    let foundCompleteToken = false;

    while (!foundCompleteToken && this.index < this.lyrics.length) {
      const c = this.lyrics[this.index];

      if (c !== ' ') {
        token += c;
      }

      // Eat spaces until next non-space character
      if (c === ' ' && token.length > 0) {
        foundCompleteToken = true;
      }

      if (breakingCharacters.includes(c)) {
        foundCompleteToken = true;
      }

      this.index++;
    }

    return token.trim();
  }
}
