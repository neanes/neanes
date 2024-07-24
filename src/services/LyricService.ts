import {
  AcceptsLyricsOption,
  DropCapElement,
  ElementType,
  MartyriaElement,
  NoteElement,
  ScoreElement,
} from '@/models/Element';
import { QuantitativeNeume } from '@/models/Neumes';
import { TATWEEL } from '@/utils/constants';

import { MelismaHelperGreek, MelismaSyllables } from './MelismaHelperGreek';

export type UpdateNoteCallback = (
  element: NoteElement,
  values: Partial<NoteElement>,
) => void;

export type UpdateNoteLyricsCallback = (
  element: NoteElement,
  value: string,
) => void;

export type UpdateNoteAcceptsLyricsCallback = (
  element: NoteElement,
  value: AcceptsLyricsOption,
) => void;

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

    // Set to true if we need to add a space before the next character
    let needSpace = false;

    // When a melismatic syllable ends in a consonant, we must "merge"
    // the lyrics spread across multiple notes into a single lyric.
    // E.g. τω ω ω ω ων => των.
    // The mergeVowels in this case would be ω (i.e. the middle vowel)
    // The mergeUnderscores represents the number of underscores that
    // be added to the end of the syllable. In this case των_____.
    let mergeVowels: string | null = null;
    let mergeUnderscores = '';

    const filteredElements = elements.filter(
      (x) =>
        x.elementType === ElementType.Note ||
        x.elementType === ElementType.DropCap ||
        x.elementType === ElementType.ModeKey ||
        x.elementType === ElementType.Martyria,
    );

    // Loop over the elements
    for (let i = 0; i < filteredElements.length; i++) {
      if (filteredElements[i].elementType === ElementType.Note) {
        // Extract the lyrics from the note
        const note = filteredElements[i] as NoteElement;

        // Keep track of the previous note
        let previousNote: NoteElement | null = null;

        if (i > 0) {
          const previousElement = filteredElements[i - 1];

          if (previousElement.elementType === ElementType.Note) {
            previousNote = previousElement as NoteElement;
          }
        }

        // If a melisma has ended and we have merge vowels
        // then merge the last note's lyrics into the previously extracted
        // lyrics. This is done by removing the mergeVowels from the current note
        // and appending the necessary underscores.
        // E.g. merge τω + ων = των__
        if (mergeVowels != null && !note.isMelisma) {
          lyrics += note.lyrics.replace(mergeVowels, '') + mergeUnderscores;

          mergeVowels = null;
          mergeUnderscores = '';
          needSpace = true;
          continue;
        }

        // First, we consider notes that should not consist of
        // only an underscore or hyphen. That is, these notes are not
        // in the middle of a melisma.
        if (!note.isMelisma || note.isMelismaStart) {
          // Add space if needed
          if (needSpace) {
            lyrics += ' ';
            needSpace = false;
          }

          if (note.lyrics.trim() === '') {
            // If this note has no lyrics, then we might be a melisma.
            // But if we are not a melisma, then we represent the missing lyrics
            // with a single underscore surrounded by spaces.
            // Unless acceptsLyrics is "No", in which case we omit the underscore for
            // brevity.
            if (
              !note.isMelisma &&
              this.getEffectiveAcceptsLyrics(note, previousNote) !==
                AcceptsLyricsOption.No
            ) {
              lyrics += '_';
              needSpace = true;
            }
          } else {
            // Append the lyrics.
            lyrics += note.lyrics;
            // Unless this is the start of a melisma, we need to
            // add a space before the next word.
            needSpace = !note.isMelismaStart;
          }
        }

        // Next we handle hyphenated melismas
        if (note.isHyphen) {
          // (Greek) If this is the start of a melisma and the text is greek,
          // calculate the middle vowel(s) so we can merge later.
          // Also start keeping track of the underscores we need to add later.
          if (
            mergeVowels == null &&
            note.isMelismaStart &&
            MelismaHelperGreek.isGreek(note.lyrics)
          ) {
            mergeVowels = MelismaHelperGreek.getMelismaSyllable(
              note.lyrics,
            ).middle;

            const nextNote = this.findNextNote(filteredElements, i);

            // We only need the underscores if the next note's
            // acceptsLyrics is not MelismaOnly
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
            // If this note's acceptsLyrics is not MelismaOnly,
            // then we append a hyphen for non-Greek lyrics,
            // and an underscore for Greek lyrics.
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
          // Finally we handle non-hyphenated melismas
          if (note.isMelismaStart) {
            if (this.hasNonMelismaOnlyNotes(filteredElements, i)) {
              lyrics += '_';
            }
          } else {
            // Unless the user set acceptsLyrics to indicate a MelismaOnly,
            // or the note's default effective value is MelismaOnly,
            // we add the melismatic underscore to the lyrics.
            if (
              this.getEffectiveAcceptsLyrics(note, previousNote) !==
              AcceptsLyricsOption.MelismaOnly
            ) {
              lyrics += '_';
            }
          }
          needSpace = true;
        }
      } else if (filteredElements[i].elementType === ElementType.DropCap) {
        // Extract the character(s) from the drop cap
        const dropCap = filteredElements[i] as DropCapElement;

        // Add a space if we need to
        if (needSpace) {
          lyrics += ' ';
        }

        // Append the drop cap text to the lyrics
        lyrics += dropCap.content;
        needSpace = false;
      } else if (filteredElements[i].elementType === ElementType.ModeKey) {
        // Start a new paragraph when a mode key is encountered since this
        // typically separates a hymn.
        if (lyrics.trim() !== '') {
          lyrics += '\n\n';
          needSpace = false;
        }
      } else if (filteredElements[i].elementType === ElementType.Martyria) {
        // Start a new paragraph when a right-aligned marytyria is encountered
        // since this typically separates a hymn or verse
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
   * @param rtl Whether the score is in RTL mode
   * @param setLyrics A callback that is invoked whenever lyrics should be immediately changed
   * @param updateNote A callback that is called when lyrics should be updated
   * @param updateDropCap A callback that is called when drop caps should be updated
   */
  assignLyrics(
    lyrics: string,
    elements: ScoreElement[],
    rtl: boolean,
    setLyrics: UpdateNoteLyricsCallback,
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

        if (dropCap.content != token) {
          updateDropCap(dropCap, token);
        }

        previousNote = null;

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

        const nextNote = this.findNextNote(filteredElements, i);

        // (Greek) Check whether this is the last note in a melisma.
        // If so, the final text of the syllable may be different
        // than the melismatic text. For example τω ω ω ων.

        // If the next note accepts syllables, then it is not a melisma
        if (
          melismaSyllables != null &&
          (nextNote == null ||
            this.getEffectiveAcceptsLyrics(nextNote, note) ===
              AcceptsLyricsOption.Yes)
        ) {
          // If the final syllable text is different than the middle,
          // then use the final text.
          if (melismaSyllables.final !== melismaSyllables.middle) {
            token = melismaSyllables.final;
          }

          // Clear the syllables since we are no longer in a melisma.
          melismaSyllables = null;
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
        } else {
          const nextNote = this.findNextNote(filteredElements, i);
          const nextNoteIsMelisma =
            nextNote != null
              ? this.getEffectiveAcceptsLyrics(nextNote, note) ===
                AcceptsLyricsOption.MelismaOnly
              : false;
          const nextNoteIsRunningElaphron =
            nextNote != null
              ? nextNote.quantitativeNeume === QuantitativeNeume.RunningElaphron
              : false;

          // Finally, we check the next note to handle some special cases.
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
          } else if (token !== '_' && token !== '-') {
            // If the token is a single underscore, then MelismaHelperGreek.isGreek(token)
            // will be false, but we may still be in a melisma.
            // But if the token is not a single underscore, then we are not in a melisma.
            // So we clear the melisma.
            melismaSyllables = null;
          }

          // If the next note only takes a melisma, then ensure that this token
          // ends in an underscore
          if (
            (nextNoteIsMelisma || nextNoteIsRunningElaphron) &&
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

      const newValues = this.getLyricUpdateValues(
        note,
        token,
        elements,
        rtl,
        setLyrics,
        true,
      );

      if (newValues != null) {
        updateNote(note, newValues);
      }

      previousToken = token;
      previousNote = note;
    }
  }

  /**
   * Updates the `acceptsLyrics` property for every score element according to how it is used with the current lyrics. This method does not directly alter the elements. Instead, the caller should provide callbacks to handle the updates.
   * @param elements The elements to update
   * @param updateNote A callback that is called whenever an element should be updated.
   */
  assignAcceptsLyricsFromCurrentLyrics(
    elements: ScoreElement[],
    updateNote: UpdateNoteAcceptsLyricsCallback,
  ) {
    let previousNote: NoteElement | null = null;

    for (const element of elements.filter(
      (x) => x.elementType === ElementType.Note,
    )) {
      const note = element as NoteElement;

      let acceptsLyrics = AcceptsLyricsOption.Default;

      if (
        (note.isMelisma && !note.isMelismaStart) ||
        (previousNote?.isHyphen && MelismaHelperGreek.isGreek(note.lyrics))
      ) {
        acceptsLyrics = AcceptsLyricsOption.MelismaOnly;
      } else if (note.lyrics.trim() === '') {
        acceptsLyrics = AcceptsLyricsOption.No;
      }

      if (note.acceptsLyrics != acceptsLyrics) {
        updateNote(note, acceptsLyrics);
      }

      previousNote = note;
    }
  }

  /**
   * Returns all the values that should be updated if the `element` were assigned the `lyrics`.
   * @param element The note element that would be updated.
   * @param lyrics The lyrics
   * @param elements All the elements in the score. Needed for RTL calculations.
   * @param rtl Whether the score is RTL
   * @param setLyrics A callback that is invoked whenever lyrics should be immediately changed.
   * @param clearMelisma Whether existing melismas should be cleared.
   * @returns The values that should be updated.
   */
  getLyricUpdateValues(
    element: NoteElement,
    lyrics: string,
    elements: ScoreElement[],
    rtl: boolean,
    setLyrics: UpdateNoteLyricsCallback,
    clearMelisma: boolean = false,
  ): Partial<NoteElement> | null {
    // Replace newlines. This should only happen if the user pastes
    // text containing new lines.
    const sanitizedLyrics = lyrics.replace(/(?:\r\n|\r|\n)/g, ' ');
    if (sanitizedLyrics !== lyrics) {
      lyrics = sanitizedLyrics;

      setLyrics(element, lyrics);
    }

    if (element.lyrics === lyrics && !(element.isMelisma && clearMelisma)) {
      return null;
    }

    // Calculate melisma properties
    let isMelisma: boolean;
    let isMelismaStart: boolean;
    let isHyphen: boolean;

    if (lyrics === '_' || lyrics === '-' || lyrics === TATWEEL) {
      isMelisma = true;
      isMelismaStart = false;
      isHyphen = lyrics === '-';
      lyrics = '';

      setLyrics(element, lyrics);
    } else if (
      lyrics.endsWith('_') ||
      lyrics.endsWith('-') ||
      lyrics.endsWith(TATWEEL)
    ) {
      isMelisma = true;
      isMelismaStart = true;
      isHyphen = lyrics.endsWith('-');

      lyrics = !rtl ? lyrics.slice(0, -1) : lyrics;

      setLyrics(element, lyrics);
    } else {
      isMelisma = false;
      isMelismaStart = false;
      isHyphen = false;
    }

    if (rtl) {
      const currentIndex = element.index;

      if (currentIndex > 0) {
        const previousElement = elements[currentIndex - 1];

        if (
          previousElement.elementType === ElementType.Note &&
          (previousElement as NoteElement).isMelisma &&
          !lyrics.startsWith(TATWEEL)
        ) {
          lyrics = TATWEEL + lyrics;
        }
      }
    }

    // If nothing changed, return. This could happen if
    // the user types in an underscore when the element is
    // already a melisma.
    if (
      element.lyrics === lyrics &&
      element.isMelismaStart === isMelismaStart &&
      element.isMelisma === isMelisma &&
      element.isHyphen === isHyphen
    ) {
      return null;
    }

    return {
      lyrics,
      isMelisma,
      isMelismaStart,
      isHyphen,
    };
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
   * @param start The index of `elements` where the search should start. The first element considered is `start + 1`.
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

  /**
   * Determines whether a group of melismatic notes contains a note that is not set to `MelismaOnly`
   * @param elements The elements to search
   * @param start The index of `elements` where the search should start. The first element considered is `start + 1`. The element at `start` must be a note.
   * @returns Returns true if any note is not set to `MelismaOnly`.
   */
  hasNonMelismaOnlyNotes(elements: ScoreElement[], start: number) {
    let previousNote: NoteElement = elements[start] as NoteElement;

    for (let j = start + 1; j < elements.length; j++) {
      if (elements[j].elementType === ElementType.Note) {
        const note = elements[j] as NoteElement;

        if (note.isMelismaStart || !note.isMelisma) {
          return false;
        } else if (
          note.isMelisma &&
          this.getEffectiveAcceptsLyrics(note, previousNote) !==
            AcceptsLyricsOption.MelismaOnly
        ) {
          return true;
        }

        previousNote = note;
      } else if (elements[j].elementType !== ElementType.Martyria) {
        // Look past martyria, but stop at any other element (e.g. a mode key)
        return false;
      }
    }

    // We've run out of elements and haven't found the end of the melisma
    return false;
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
