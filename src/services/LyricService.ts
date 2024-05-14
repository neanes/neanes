import {
  AcceptsLyricsOption,
  DropCapElement,
  ElementType,
  MartyriaElement,
  NoteElement,
  ScoreElement,
} from '@/models/Element';
import { QuantitativeNeume } from '@/models/Neumes';

import { MelismaHelperGreek, MelismaSyllables } from './MelismaHelperGreek';

export type UpdateNoteCallback = (element: NoteElement, value: string) => void;

export type UpdateDropCapCallback = (
  element: DropCapElement,
  value: string,
) => void;

export class LyricService {
  /**
   * Extracts lyrics from score elements
   * @param elements The elements from which lyrics are extracted
   * @returns A string containing the extracted lyrics.
   */
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

  /**
   * Assigns lyrics to score elements. This method does not directly alter the elements. Instead, the caller should provide callbacks to handle the updates.
   * @param lyrics The lyrics
   * @param elements The elements to assign lyrics to
   * @param updateNote A callback that is called when lyrics should be updated
   * @param updateDropCap A callback that is called when drop caps should be updated
   */
  assignLyrics(
    lyrics: string,
    elements: ScoreElement[],
    updateNote: UpdateNoteCallback,
    updateDropCap: UpdateDropCapCallback,
  ) {
    const tokenizer = new LyricTokenizer(lyrics);

    let previousToken = '';
    let previousNote: NoteElement | null = null;
    let melismaSyllables: MelismaSyllables | null = null;

    // Only assign lyrics to notes and drop caps
    const filteredElements = elements.filter(
      (x) =>
        x.elementType === ElementType.Note ||
        x.elementType === ElementType.DropCap,
    );

    // Loop over the elements
    for (let i = 0; i < filteredElements.length; i++) {
      // If the element is a drop cap, then grab the next character
      // from the lyrics and assign it to the drop cap.
      if (filteredElements[i].elementType === ElementType.DropCap) {
        const dropCap = filteredElements[i] as DropCapElement;
        const token = tokenizer.getNextCharacter();

        updateDropCap(dropCap, token);

        // Skip to the next element
        continue;
      }

      // If the element is a note, process it.
      const note = filteredElements[i] as NoteElement;

      let token = '';

      // Check whether the note accepts lyrics
      const acceptsLyrics = this.getEffectiveAcceptsLyrics(note, previousNote);

      if (acceptsLyrics === AcceptsLyricsOption.MelismaOnly) {
        // This note only takes melismas. If the previous note was a melisma,
        // then extend the melisma to this note.
        if (previousToken.endsWith('-')) {
          token = '-';
        } else {
          token = '_';
        }

        // (Greek) Check whether this is the last note in a melisma.
        // If so, the final text of the syllable may be different
        // than than the melismatic text. For example τω ω ω ων.
        if (i + 1 < filteredElements.length) {
          const nextNote = filteredElements[i + 1] as NoteElement;

          // If the next note accepts syllables, then it is not a melisma
          if (
            melismaSyllables != null &&
            this.getEffectiveAcceptsLyrics(nextNote, note) ===
              AcceptsLyricsOption.Yes
          ) {
            // If the final syllable text is different than the middle,
            // then use the final text.
            if (melismaSyllables.final !== melismaSyllables.middle) {
              token = melismaSyllables.final;
            }

            // Clear the syllables since we are no longer in a melisma.
            melismaSyllables = null;
          }
        }
      } else if (acceptsLyrics === AcceptsLyricsOption.Yes) {
        // The only other options is "Yes". So grab the next token
        // and assign it to the note.
        token = tokenizer.getNextToken();

        // (Greek) In Greek mode, lyrics only use underscores, but the lyrics assigned
        // to a note must sometimes be converted to a hyphen. This helps us distinguish between
        // των and τω ων. We detect this by checking whether the syllable ends in a constant,
        // in which case the middle syllable text will not match the final syllable text.
        if (
          melismaSyllables != null &&
          token === '_' &&
          melismaSyllables.middle !== melismaSyllables.final
        ) {
          token = '-';
        }

        // If the token is a single underscore surrounded by spaces,
        // then this is interpreted as a note with no lyrics.
        if (token === '_' && !previousToken.endsWith('_')) {
          token = '';
          // Skip to the next element.
          continue;
        }

        // Finally, we check the next note to handle some special cases.
        if (i + 1 < filteredElements.length) {
          const nextNote = filteredElements[i + 1] as NoteElement;

          const nextNoteIsMelisma =
            this.getEffectiveAcceptsLyrics(nextNote, note) ===
            AcceptsLyricsOption.MelismaOnly;

          // (Greek) Calculate melisma syllables.
          // If the lyrics are Greek and the next note is a melisma,
          // then calculate the melismatic syllables.
          if (
            (nextNoteIsMelisma || token.endsWith('_')) &&
            MelismaHelperGreek.isGreek(token)
          ) {
            melismaSyllables = MelismaHelperGreek.getMelismaSyllable(
              token.replace('_', ''),
            );
            // By convention, we distinguish between των and τω ων by
            // setting note lyrics to either a hyphen or underscore, respectively.
            if (melismaSyllables.middle === melismaSyllables.final) {
              token = melismaSyllables.initial + '_';
            } else {
              token = melismaSyllables.initial + '-';
            }
          } else if (token !== '_') {
            // If the token is a single underscore, then MelismaHelperGreek.isGreek(token)
            // will be false, but we may still be in a melisma.
            // But if the token is not a single underscore, then we are not in a melisma.
            // So we clear the melisma.
            melismaSyllables = null;
          }

          // If the next note only takes a melisma, then ensure that this token
          // ends in an underscore
          if (
            nextNoteIsMelisma &&
            !token.endsWith('_') &&
            !token.endsWith('-')
          ) {
            token += '_';
          }

          // (Greek) If we are in a melisma and the next note is not a melisma,
          // then we should set the present note to the final melisma text if it differs
          // from the middle text. I.e. τω ω ω ων.
          if (
            melismaSyllables != null &&
            token === '-' &&
            melismaSyllables.final !== melismaSyllables.middle &&
            !nextNoteIsMelisma &&
            tokenizer.peekNextToken() !== '_'
          ) {
            token = melismaSyllables.final;
          }
        }
      }

      updateNote(note, token);

      previousToken = token;
      previousNote = note;
    }
  }

  /**
   * Calculates whether a note should accept lyrics when `acceptsLyrics` is set to `Default`.
   * @param note The note
   * @param previousNote The previous note, if one exists. Otherwise, pass `null`.
   * @returns The effective value of `acceptsLyrics`.
   */
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

  /**
   * Finds the next note in an array of elements, looking past martyria, but stops at any other element.
   * @param elements The elements to search
   * @param start The index of `elements` where the search should start.
   * @returns The next note element, if a note is found before a non-martyria element. Otherwise, `null` is returned.
   */
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

  /**
   * Returns the next token in the lyrics.
   * @returns The next token
   */
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

  /**
   * Peeks ahead at the next token without changing the tokenizer's index.
   * @returns The next token
   */
  peekNextToken() {
    const previousIndex = this.index;

    const token = this.getNextToken();

    this.index = previousIndex;

    return token;
  }

  /**
   * Returns the next single character in the lyrics.
   * @returns The next character
   */
  getNextCharacter() {
    let c = '';
    while (c.trim() === '' && this.index < this.lyrics.length) {
      c = this.lyrics[this.index++];
    }
    return c;
  }
}
