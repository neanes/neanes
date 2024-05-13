import {
  AcceptsLyricsOption,
  DropCapElement,
  ElementType,
  MartyriaElement,
  NoteElement,
  ScoreElement,
} from '@/models/Element';
import { QuantitativeNeume } from '@/models/Neumes';

import { MelismaHelperGreek } from './MelismaHelperGreek';

export class LyricService {
  extractLyrics(elements: ScoreElement[]): string {
    let lyrics = '';

    let needSpace = false;
    let mergeSyllables: string | null = null;
    let mergeUnderscores = '';

    const filteredElements = elements.filter(
      (x) =>
        x.elementType === ElementType.Note ||
        x.elementType === ElementType.DropCap ||
        x.elementType === ElementType.ModeKey ||
        x.elementType === ElementType.Martyria,
    );

    for (let i = 0; i < filteredElements.length; i++) {
      if (filteredElements[i].elementType === ElementType.Note) {
        const note = filteredElements[i] as NoteElement;

        let previousNote: NoteElement | null = null;

        if (i > 0) {
          const previousElement = filteredElements[i - 1];

          if (previousElement.elementType === ElementType.Note) {
            previousNote = previousElement as NoteElement;
          }
        }

        if (mergeSyllables != null && !note.isMelisma) {
          lyrics += note.lyrics.replace(mergeSyllables, '') + mergeUnderscores;

          mergeSyllables = null;
          mergeUnderscores = '';
          needSpace = true;
          continue;
        }

        if (!note.isMelisma || note.isMelismaStart) {
          if (needSpace) {
            lyrics += ' ';
            needSpace = false;
          }

          if (note.lyrics.trim() === '') {
            if (
              !note.isMelisma &&
              this.getEffectiveAcceptsLyrics(note, previousNote) !==
                AcceptsLyricsOption.No
            ) {
              lyrics += '_';
              needSpace = true;
            }
          } else {
            lyrics += note.lyrics;
            needSpace = !note.isMelismaStart;
          }
        }

        if (note.isHyphen) {
          if (
            mergeSyllables == null &&
            note.isMelismaStart &&
            MelismaHelperGreek.isGreek(note.lyrics)
          ) {
            mergeSyllables = MelismaHelperGreek.getMelismaSyllable(
              note.lyrics,
            ).middle;

            const nextNote = this.findNextNote(filteredElements, i);

            if (
              !nextNote ||
              this.getEffectiveAcceptsLyrics(nextNote, note) !==
                AcceptsLyricsOption.MelismaOnly
            ) {
              mergeUnderscores = '__';
            }
          } else if (
            this.getEffectiveAcceptsLyrics(note, previousNote) !==
            AcceptsLyricsOption.MelismaOnly
          ) {
            if (
              MelismaHelperGreek.isGreek(note.lyrics) ||
              MelismaHelperGreek.isGreek(note.melismaText)
            ) {
              mergeUnderscores += '_';
            } else {
              lyrics += '-';
            }
          }
        } else if (note.isMelisma) {
          const nextNote = this.findNextNote(filteredElements, i);

          if (
            this.getEffectiveAcceptsLyrics(note, previousNote) !==
              AcceptsLyricsOption.MelismaOnly &&
            (!nextNote ||
              this.getEffectiveAcceptsLyrics(nextNote, note) !==
                AcceptsLyricsOption.MelismaOnly)
          ) {
            lyrics += '_';
          }
          needSpace = true;
        }
      } else if (filteredElements[i].elementType === ElementType.DropCap) {
        const dropCap = filteredElements[i] as DropCapElement;

        if (needSpace) {
          lyrics += ' ';
        }

        lyrics += dropCap.content;
        needSpace = false;
      } else if (filteredElements[i].elementType === ElementType.ModeKey) {
        if (lyrics.trim() !== '') {
          lyrics += '\n\n';
          needSpace = false;
        }
      } else if (filteredElements[i].elementType === ElementType.Martyria) {
        const martyria = filteredElements[i] as MartyriaElement;
        if (martyria.alignRight) {
          lyrics += '\n\n';
          needSpace = false;
        }
      }
    }

    return lyrics.trimEnd();
  }

  getEffectiveAcceptsLyrics(
    note: NoteElement,
    previousNote: NoteElement | null,
  ) {
    let acceptsLyrics = note.acceptsLyrics;

    if (note.acceptsLyrics === AcceptsLyricsOption.Default) {
      const noLyricsAccepted = [
        QuantitativeNeume.Cross,
        QuantitativeNeume.Breath,
        QuantitativeNeume.VareiaDotted,
        QuantitativeNeume.VareiaDotted2,
        QuantitativeNeume.VareiaDotted3,
        QuantitativeNeume.VareiaDotted4,
      ];

      const melismaOnly = [QuantitativeNeume.Kentemata];

      if (noLyricsAccepted.includes(note.quantitativeNeume)) {
        acceptsLyrics = AcceptsLyricsOption.No;
      } else if (
        melismaOnly.includes(note.quantitativeNeume) ||
        previousNote?.tie != null
      ) {
        acceptsLyrics = AcceptsLyricsOption.MelismaOnly;
      } else {
        acceptsLyrics = AcceptsLyricsOption.Yes;
      }
    }

    return acceptsLyrics;
  }

  findNextNote(elements: ScoreElement[], start: number) {
    let nextNote: NoteElement | null = null;

    for (let j = start + 1; j < elements.length; j++) {
      if (elements[j].elementType === ElementType.Note) {
        // We found a note. Stop.
        nextNote = elements[j] as NoteElement;
        break;
      } else if (elements[j].elementType !== ElementType.Martyria) {
        // Look past martyria, but stop at any other element (e.g. a mode key)
        break;
      }
    }

    return nextNote;
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

      if (c.trim() !== '') {
        token += c;
      }

      // Eat spaces until next non-space character
      if (c.trim() === '' && token.length > 0) {
        foundCompleteToken = true;
      }

      if (breakingCharacters.includes(c)) {
        foundCompleteToken = true;
      }

      this.index++;
    }

    return token.trim();
  }

  peekNextToken() {
    const previousIndex = this.index;

    const token = this.getNextToken();

    this.index = previousIndex;

    return token;
  }

  getNextCharacter() {
    let c = '';
    while (c.trim() === '' && this.index < this.lyrics.length) {
      c = this.lyrics[this.index++];
    }
    return c;
  }
}
