import type {
  DropCapElement,
  MartyriaElement,
  RichTextBoxElement,
  ScoreElement,
  TextBoxElement,
} from '@/models/Element';
import {
  AcceptsLyricsOption,
  ElementType,
  NoteElement,
} from '@/models/Element';
import { QuantitativeNeume } from '@/models/Neumes';
import { MelismaStyle } from '@/models/PageSetup';
import { TATWEEL } from '@/utils/constants';

import type { MelismaSyllables } from './MelismaHelperGreek';
import { MelismaHelperGreek } from './MelismaHelperGreek';

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

export interface NoteLyricUpdate {
  note: NoteElement;
  newValues: Partial<NoteElement>;
}

interface MelismaRun {
  owner: NoteElement;
  ownerIndex: number;
  startIndex: number;
  elements: ScoreElement[];
}

interface IndexedNote {
  note: NoteElement;
  index: number;
}

interface InlineVocalicMelismaContext {
  elements: ScoreElement[];
  lyrics: string;
}

const NO_LYRICS_ACCEPTED_NEUMES = new Set([
  QuantitativeNeume.Cross,
  QuantitativeNeume.Breath,
  QuantitativeNeume.VareiaDotted,
  QuantitativeNeume.VareiaDotted2,
  QuantitativeNeume.VareiaDotted3,
  QuantitativeNeume.VareiaDotted4,
]);

const MELISMA_ONLY_NEUMES = new Set([QuantitativeNeume.Kentemata]);

export class LyricService {
  /**
   * Extracts lyrics from score elements
   * @param elements The elements from which lyrics are extracted
   * @returns A string containing the extracted lyrics.
   */
  extractLyrics(elements: ScoreElement[], melismaStyle: MelismaStyle): string {
    let lyrics = '';

    // Set to true if we need to add a space before the next character
    let needSpace = false;

    // Whether anything has been emitted so far. `lyrics` only ever starts with
    // a paragraph break, so this stops at the first character or two; trimming
    // instead would copy the whole extraction on every note that asks.
    const hasEmittedText = () => /\S/.test(lyrics);

    // When a melismatic syllable ends in a consonant, we must "merge"
    // the lyrics spread across multiple notes into a single lyric.
    // E.g. τω ω ω ω ων => των.
    // The mergeVowels in this case would be ω (i.e. the middle vowel).
    // mergeContinuationCount counts the run's visible continuation notes,
    // each of which contributes one break character to the merged syllable
    // (in this case των_____).
    let mergeVowels: string | null = null;
    let mergeContinuationCount = 0;
    // Whether the pending merge is a hyphen-connected run, so that hyphen
    // continuation notes are counted rather than emitted as hyphens.
    let vocalicHyphenRunPending = false;

    const clearPendingVocalicMerge = () => {
      mergeVowels = null;
      mergeContinuationCount = 0;
      vocalicHyphenRunPending = false;
    };

    const filteredElements = elements.filter(
      (x) =>
        x.elementType === ElementType.Note ||
        x.elementType === ElementType.DropCap ||
        x.elementType === ElementType.ModeKey ||
        x.elementType === ElementType.RichTextBox ||
        x.elementType === ElementType.Martyria,
    );
    let previousNote: NoteElement | null = null;

    const elementIsInsideMelisma = (index: number) => {
      if (mergeVowels != null) {
        return true;
      }

      if (previousNote?.isMelisma !== true) {
        return false;
      }

      const nextNote = this.findNextNote(filteredElements, index);

      return nextNote?.isMelisma === true && !nextNote.isMelismaStart;
    };

    // A mode key or a mode-changing text box typically separates hymns, and a
    // right-aligned martyria or one with a line break typically separates
    // hymns or verses, so each starts a new paragraph.
    const startsNewParagraph = (element: ScoreElement) => {
      switch (element.elementType) {
        case ElementType.ModeKey:
          return hasEmittedText();
        case ElementType.RichTextBox:
          return (element as RichTextBoxElement).modeChange && hasEmittedText();
        case ElementType.Martyria: {
          const martyria = element as MartyriaElement;
          return martyria.alignRight || martyria.lineBreak;
        }
        default:
          return false;
      }
    };

    // Loop over the elements
    for (let i = 0; i < filteredElements.length; i++) {
      if (filteredElements[i].elementType === ElementType.Note) {
        // Extract the lyrics from the note
        const note = filteredElements[i] as NoteElement;
        const precedingNote = previousNote;
        previousNote = note;

        // If a melisma has ended and we have merge vowels
        // then merge the last note's lyrics into the previously extracted
        // lyrics. This is done by removing the mergeVowels from the current note
        // and appending the necessary underscores.
        // E.g. merge τω + ων = των__
        const noteCarriesMergeVowels =
          mergeVowels != null &&
          getVocalicCandidateText(note).startsWith(mergeVowels);
        const noteIsVocalicFinalBeforeHyphen =
          noteCarriesMergeVowels &&
          note.isMelismaStart &&
          note.isHyphen &&
          note.lyrics.trim() !== '';

        if (
          mergeVowels != null &&
          (!note.isMelisma || noteIsVocalicFinalBeforeHyphen)
        ) {
          // Count the break characters this vocalic run contributes, matching
          // what a western extraction would emit: one per visible continuation
          // note, plus one for the closing note unless it is a MelismaOnly
          // note (e.g. a Kentemata), which leaves no mark in the text.
          const closingNoteIsMelismaOnly =
            this.getEffectiveAcceptsLyrics(note, precedingNote) ===
            AcceptsLyricsOption.MelismaOnly;
          const visibleContinuations =
            mergeContinuationCount + (closingNoteIsMelismaOnly ? 0 : 1);
          // The start note adds one more break when the run connects forward to
          // a following syllable (the closing note is a hyphen) or when the run
          // has at least one visible note. A purely MelismaOnly word-final run
          // shows nothing (e.g. γαρ over two Kentemata extracts back to γαρ).
          const mergeBreakCount =
            visibleContinuations +
            (note.isHyphen || visibleContinuations > 0 ? 1 : 0);

          if (noteIsVocalicFinalBeforeHyphen) {
            lyrics +=
              note.lyrics.replace(mergeVowels, '') +
              '-'.repeat(mergeBreakCount);
          } else if (!noteCarriesMergeVowels) {
            // The run turned out not to merge; emit it western-style, with one
            // hyphen for the start note's connector plus one per visible
            // continuation note.
            lyrics += '-'.repeat(mergeContinuationCount + 1);
            clearPendingVocalicMerge();
            needSpace = false;

            if (note.lyrics.trim() !== '') {
              lyrics += note.lyrics;
              needSpace = !note.isMelismaStart;
            }

            if (note.isHyphen) {
              lyrics += '-';
              needSpace = false;
            }

            continue;
          } else {
            lyrics +=
              note.lyrics.replace(mergeVowels, '') +
              '_'.repeat(mergeBreakCount);
          }

          clearPendingVocalicMerge();
          needSpace = !noteIsVocalicFinalBeforeHyphen;
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
            // with a single underscore surrounded by spaces. We only do this for
            // notes that accept lyrics ("Yes"): assignment consumes a token for
            // those, so the placeholder keeps the notes and lyrics aligned. A
            // note whose effective acceptsLyrics is "No" or "MelismaOnly" (e.g. a
            // stray Kentemata with no melisma) does not consume a token on
            // assignment, so emitting an underscore would desynchronize every
            // following note.
            if (
              !note.isMelisma &&
              this.getEffectiveAcceptsLyrics(note, precedingNote) ===
                AcceptsLyricsOption.Yes
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
          // If this is the start of a vocalic melisma,
          // calculate the middle vowel(s) so we can merge later.
          // Also start keeping track of the underscores we need to add later.
          if (
            mergeVowels == null &&
            note.isMelismaStart &&
            MelismaHelperGreek.usesVocalicMelisma(melismaStyle, note.lyrics)
          ) {
            // Find the note that carries this syllable's final form. When it
            // closes the run, the run is a single vocalic melisma to merge
            // using the run's middle vowel (e.g. πα + αρ => παρ); otherwise
            // the syllables are distinct and this note is a plain hyphenated
            // syllable. The final form may sit immediately after the start
            // note (παρ--σις) or after intervening melisma notes (παρ---σις);
            // both are handled the same way here.
            const finalCandidate = findMelismaFinalNote(filteredElements, i);

            const middle = finalCandidate
              ? getMelismaRunMiddle(note.lyrics, finalCandidate)
              : MelismaHelperGreek.getMelismaSyllable(note.lyrics).middle;

            if (middle != null) {
              mergeVowels = middle;
              vocalicHyphenRunPending = true;
              mergeContinuationCount = 0;
            } else {
              lyrics += '-';
              needSpace = false;
            }
          } else if (
            this.getEffectiveAcceptsLyrics(note, precedingNote) !==
              AcceptsLyricsOption.MelismaOnly ||
            note.lyrics.trim() !== ''
          ) {
            // If this note's acceptsLyrics is not MelismaOnly,
            // then we append a hyphen for western lyrics. For a pending
            // vocalic hyphen run, we count the continuation and emit its
            // break character when the run merges.
            if (vocalicHyphenRunPending) {
              mergeContinuationCount++;
            } else {
              lyrics += '-';
              needSpace = false;
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
              this.getEffectiveAcceptsLyrics(note, precedingNote) !==
              AcceptsLyricsOption.MelismaOnly
            ) {
              lyrics += '_';
            }
          }
          needSpace = hasEmittedText();
          if (!note.isMelismaStart) {
            vocalicHyphenRunPending = false;
          }
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
        previousNote = null;
      } else if (
        startsNewParagraph(filteredElements[i]) &&
        !elementIsInsideMelisma(i)
      ) {
        lyrics += '\n\n';
        needSpace = false;
      }
    }

    // Drop trailing empty-note placeholders. They are written as whitespace-
    // separated underscores (e.g. "word__ _ _") and are redundant at the end of
    // the lyrics: re-assigning without them leaves the same trailing notes empty
    // because the lyrics simply run out. Contiguous melisma underscores (e.g.
    // "word__") have no preceding whitespace and are preserved.
    return lyrics.replace(/(?:\s+_)+\s*$/, '').trimEnd();
  }

  /**
   * Canonically assigns lyrics to score elements. This method does not
   * directly alter the elements. Instead, the caller should provide callbacks
   * to handle the updates.
   *
   * Assignment must run even when extracting the current elements produces
   * `lyrics`: extraction preserves the canonical text, but cannot represent
   * every possible internal distribution across notes. The first assignment
   * may therefore normalize that distribution. Assigning the resulting text a
   * second time must produce no updates. If it does, the canonicalizer must be
   * fixed rather than bypassed with call-history state.
   *
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
    melismaStyle: MelismaStyle,
    setLyrics: UpdateNoteLyricsCallback,
    updateNote: UpdateNoteCallback,
    updateDropCap: UpdateDropCapCallback,
  ) {
    const tokenizer = new LyricTokenizer(lyrics);

    let previousToken = '';
    let previousNote: NoteElement | null = null;
    let melismaSyllables: MelismaSyllables | null = null;
    let melismaRunText: string | null = null;
    let preserveExistingMelismaBreaks = false;
    // Whether the current vocalic melisma run connects forward to a following
    // syllable of the same word (the run's start token ended in a hyphen). This
    // is captured from the start token because the tokenizer consumes the space
    // after a word, making a later whitespace check unreliable.
    let melismaConnectsForward = false;

    const clearMelismaRun = () => {
      melismaSyllables = null;
      melismaRunText = null;
      preserveExistingMelismaBreaks = false;
    };

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
      let acceptsLyrics = this.getEffectiveAcceptsLyrics(note, previousNote);

      // A lyric-bearing melisma start on an inherently MelismaOnly note is a
      // real syllable preserved from an existing score, unless its text is the
      // previous note's vocalic final form. When no vocalic run is open, let
      // it consume its token so extract/assign does not move that syllable
      // onto the following note.
      if (
        acceptsLyrics === AcceptsLyricsOption.MelismaOnly &&
        melismaSyllables == null &&
        note.isMelismaStart &&
        note.lyrics.trim() !== '' &&
        (previousNote == null ||
          getMelismaRunMiddle(previousNote.lyrics, note) == null)
      ) {
        acceptsLyrics = AcceptsLyricsOption.Yes;
      }

      if (acceptsLyrics === AcceptsLyricsOption.MelismaOnly) {
        let explicitMelismaBreak = '';

        // When the note is not inherently melisma-only (e.g. it was set to
        // MelismaOnly by "Assign Accepts Lyrics" rather than being a
        // Kentemata), the text may still carry the break character that the
        // note consumed while it accepted lyrics. Consume that break so the
        // remaining breaks map to the following notes; otherwise the same
        // text spreads one note further on every assignment. Inherently
        // melisma-only notes leave no mark in the text, so nothing is
        // consumed for them.
        if (
          !this.isInherentlyMelismaOnly(note, previousNote) &&
          tokenContinuesMelisma(
            tokenizer.peekNextToken(),
            tokenizer.nextTokenStartsNewWord(),
          )
        ) {
          explicitMelismaBreak = tokenizer.getNextToken();
        }

        // This note only takes melismas. If the previous note was a melisma,
        // then extend the melisma to this note.
        if (explicitMelismaBreak !== '') {
          token = explicitMelismaBreak;
        } else if (
          preserveExistingMelismaBreaks &&
          note.isMelisma &&
          !this.isInherentlyMelismaOnly(note, previousNote)
        ) {
          token = note.isHyphen ? '-' : '_';
        } else {
          token = previousToken.endsWith('-') ? '-' : '_';
        }

        // (Greek) Check whether this is the last note in a melisma.
        // If so, the final text of the syllable may be different
        // than the melismatic text. For example τω ω ω ων.
        if (melismaSyllables != null) {
          const nextNote = this.findNextNote(filteredElements, i);
          const nextNoteIsMelismaOnly =
            nextNote != null &&
            this.getEffectiveAcceptsLyrics(nextNote, note) ===
              AcceptsLyricsOption.MelismaOnly;
          const nextToken = tokenizer.peekNextToken();
          const nextTokenContinuesMelisma = tokenContinuesMelisma(
            nextToken,
            tokenizer.nextTokenStartsNewWord(),
          );

          // The run ends at this note unless a later note continues it: another
          // MelismaOnly note, or a token-consuming note that takes a melisma
          // break. A regular blank melisma note reports acceptsLyrics === Yes,
          // so we must check the next token rather than the next note's
          // acceptsLyrics to avoid ending the run early.
          if (!nextNoteIsMelismaOnly && !nextTokenContinuesMelisma) {
            // If the final syllable text differs from the middle, carry the
            // final form. Keep the break character (so the note stays a melisma
            // note that round-trips) when the run connects to a following
            // syllable; drop it at the very end of a word.
            if (melismaSyllables.final !== melismaSyllables.middle) {
              token = melismaConnectsForward
                ? `${melismaSyllables.final}${token}`
                : melismaSyllables.final;
            }

            // Clear the syllables since we are no longer in a melisma.
            clearMelismaRun();
          }
        }
      } else if (acceptsLyrics === AcceptsLyricsOption.Yes) {
        // The only other options is "Yes". So grab the next token
        // and assign it to the note.
        token = tokenizer.getNextToken();

        // If the token is a single underscore surrounded by spaces,
        // then this is interpreted as a note with no lyrics. A contiguous
        // underscore (not separated by whitespace) instead continues a melisma.
        // This classification must happen before the vocalic underscore
        // conversion below, so that an open vocalic run cannot rewrite the
        // empty note's placeholder into a melisma continuation.
        if (token === '_' && tokenizer.tokenPrecededByWhitespace) {
          token = '';
        } else {
          // In vocalic mode, lyrics only use underscores, but the lyrics assigned
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

          const nextNote = this.findNextNote(filteredElements, i);
          const tokenWithoutMelismaBreak = stripMelismaBreaksSuffix(token);
          const nextNoteIsMelisma =
            nextNote != null &&
            this.getEffectiveAcceptsLyrics(nextNote, note) ===
              AcceptsLyricsOption.MelismaOnly &&
            (!nextNote.isMelismaStart ||
              nextNote.lyrics.trim() === '' ||
              getMelismaRunMiddle(
                tokenWithoutMelismaBreak || melismaRunText || '',
                nextNote,
              ) != null);
          const nextNoteIsRunningElaphron =
            nextNote != null
              ? nextNote.quantitativeNeume === QuantitativeNeume.RunningElaphron
              : false;
          const nextToken = tokenizer.peekNextToken();
          const nextTokenStartsNewWord = tokenizer.nextTokenStartsNewWord();
          const existingSyllable =
            nextNoteIsMelisma && note.isMelismaStart
              ? this.extractSingleVocalicSyllable(
                  this.sliceMelismaSegment(filteredElements, i),
                  MelismaStyle.Vocalic,
                )
              : null;
          const existingSyllableMatches =
            existingSyllable != null &&
            sameLyricText(existingSyllable, tokenWithoutMelismaBreak);
          // Only computed when the syllable matches: a run's break style is
          // preserved only for a run this note already owns, and resolving the
          // run's closing note costs a forward scan plus a syllable analysis.
          const preserveExistingHyphen =
            existingSyllableMatches &&
            this.existingRunConnectsForward(filteredElements, i, note);

          if (tokenWithoutMelismaBreak !== '') {
            preserveExistingMelismaBreaks = existingSyllableMatches;
          }

          // Finally, we check the next note to handle some special cases.
          // Calculate vocalic melisma syllables.
          // If the lyrics are vocalic and the next note is a melisma,
          // then calculate the melismatic syllables. A run also needs a
          // continuation to land its final form on: a following MelismaOnly
          // note, or a contiguous break token for the next note. Without one
          // (e.g. "clu_" followed by a new word), converting the token would
          // strand the syllable's coda on a continuation that never
          // materializes, dropping its letters.
          if (
            (nextNoteIsMelisma ||
              (endsWithMelismaBreak(token) &&
                tokenContinuesMelisma(nextToken, nextTokenStartsNewWord))) &&
            MelismaHelperGreek.usesVocalicMelisma(
              melismaStyle,
              tokenWithoutMelismaBreak,
            )
          ) {
            melismaSyllables = MelismaHelperGreek.getMelismaSyllable(
              tokenWithoutMelismaBreak,
            );
            melismaRunText = tokenWithoutMelismaBreak;
            // The run connects forward to a following same-word syllable only
            // when the start token ended in a hyphen (e.g. των-μυ). An
            // underscore melisma or a plain word whose melisma is implied by
            // following MelismaOnly notes is word-final (e.g. cân, γαρ).
            melismaConnectsForward =
              token.endsWith('-') || preserveExistingHyphen;
            // Choose the break character for the melisma start note. A token
            // ending in a hyphen always stays a hyphen: it connects this
            // syllable's melisma to a following syllable (e.g. Σω-μα), even when
            // the run passes through a MelismaOnly note (e.g. a Kentemata) that
            // leaves no second hyphen in the extracted text. Otherwise, an
            // open-vowel syllable (middle === final, e.g. τω) becomes an
            // underscore melisma, while a consonant-ending syllable
            // (middle !== final, e.g. των) stays a hyphen so that its final form
            // can land on the closing note.
            if (
              melismaSyllables.middle === melismaSyllables.final &&
              !melismaConnectsForward
            ) {
              token = melismaSyllables.initial + '_';
            } else {
              token = melismaSyllables.initial + '-';
            }
          } else if (!isMelismaBreakingCharacter(token) && token !== '') {
            // If the token is a single underscore, then the vocalic check
            // will be false, but we may still be in a melisma.
            // But if the token is not a single underscore, then we are not in a melisma.
            // So we clear the melisma.
            clearMelismaRun();
          }

          // If the next note only takes a melisma, then ensure that this token
          // ends in an underscore
          if (
            token !== '' &&
            (nextNoteIsMelisma || nextNoteIsRunningElaphron) &&
            !endsWithMelismaBreak(token)
          ) {
            // A baked MelismaOnly pattern removes explicit breaks from the
            // extracted text. Preserve the start note's existing break style
            // when that pattern implies the run, since otherwise a hyphen run
            // silently comes back as an underscore run on re-assignment.
            token += preserveExistingHyphen ? '-' : '_';
          }

          // (Greek) If we are in a melisma and the next note is not a melisma,
          // then we should set the present note to the final melisma text if it differs
          // from the middle text. I.e. τω ω ω ων.
          // The melisma run ends at this note whenever the next token does not
          // continue it (any number of empty notes may trail after it).
          const nextTokenContinuesMelisma = tokenContinuesMelisma(
            nextToken,
            nextTokenStartsNewWord,
          );

          if (
            melismaSyllables != null &&
            token === '-' &&
            melismaSyllables.final !== melismaSyllables.middle &&
            !nextNoteIsMelisma &&
            !nextTokenContinuesMelisma
          ) {
            // Keep the connecting hyphen when a following same-word syllable is
            // present, and also when the lyrics simply stop here but the run's
            // start token declared a forward connection (e.g. the inline
            // mid-typing state "Dum--": the user is about to type the next
            // syllable of the word).
            token =
              (nextToken !== '' && !nextTokenStartsNewWord) ||
              (nextToken === '' && melismaConnectsForward)
                ? `${melismaSyllables.final}-`
                : melismaSyllables.final;

            // The run ends at its final note, so any following notes (e.g. a
            // trailing empty note written as a standalone underscore) must not
            // be treated as part of this melisma.
            clearMelismaRun();
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
    melismaStyle: MelismaStyle,
    updateNote: UpdateNoteAcceptsLyricsCallback,
  ) {
    const vocalicMelismaFinalNotes = new Set<NoteElement>();

    // A hyphenated syllable is not necessarily a melisma. Only bake the
    // closing note when its text confirms that it is the start note's final
    // form.
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      if (element.elementType !== ElementType.Note) {
        continue;
      }

      const note = element as NoteElement;

      if (
        !note.isMelismaStart ||
        !note.isHyphen ||
        !MelismaHelperGreek.usesVocalicMelisma(melismaStyle, note.lyrics)
      ) {
        continue;
      }

      const finalNote = findMelismaFinalNote(elements, i);

      if (finalNote == null) {
        continue;
      }

      const finalText = getVocalicCandidateText(finalNote);
      const middle = getMelismaRunMiddle(note.lyrics, finalNote, finalText);

      if (
        middle != null &&
        // A stored final form adds a coda to the repeated vowel (e.g. "um"
        // after "Du"). An empty candidate whose melismaText is exactly the
        // repeated vowel is an old-format intermediate note: it keeps the
        // run open but is not the run's final form.
        finalText !== middle
      ) {
        vocalicMelismaFinalNotes.add(finalNote);
      }
    }

    for (const element of elements.filter(
      (x) => x.elementType === ElementType.Note,
    )) {
      const note = element as NoteElement;

      let acceptsLyrics = AcceptsLyricsOption.Default;

      if (
        (note.isMelisma && !note.isMelismaStart) ||
        vocalicMelismaFinalNotes.has(note)
      ) {
        acceptsLyrics = AcceptsLyricsOption.MelismaOnly;
      } else if (note.lyrics.trim() === '') {
        acceptsLyrics = AcceptsLyricsOption.No;
      }

      if (note.acceptsLyrics != acceptsLyrics) {
        updateNote(note, acceptsLyrics);
      }
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

    if (
      sameNormalizedLyricText(element.lyrics, lyrics) &&
      !(element.isMelisma && clearMelisma)
    ) {
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

      lyrics = !rtl ? stripMelismaBreaksSuffix(lyrics) : lyrics;

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
      sameNormalizedLyricText(element.lyrics, lyrics) &&
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
   * Calculates the value that `acceptsLyrics` resolves to when it is set to
   * `Default`, ignoring any stored override. This is the note's inherent
   * behavior: e.g. a Kentemata is melisma-only by nature and never consumes a
   * token or leaves a break character in extracted lyrics, while a regular
   * note set to `MelismaOnly` by the user or by "Assign Accepts Lyrics" still
   * owns a break character in the text.
   * @param note The note
   * @param previousNote The previous note, if one exists. Otherwise, pass `null`.
   * @returns The default value of `acceptsLyrics`.
   */
  getDefaultAcceptsLyrics(
    note: NoteElement,
    previousNote: NoteElement | null,
  ): AcceptsLyricsOption {
    if (NO_LYRICS_ACCEPTED_NEUMES.has(note.quantitativeNeume)) {
      return AcceptsLyricsOption.No;
    }

    if (
      MELISMA_ONLY_NEUMES.has(note.quantitativeNeume) ||
      previousNote?.tie != null
    ) {
      return AcceptsLyricsOption.MelismaOnly;
    }

    return AcceptsLyricsOption.Yes;
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
    return note.acceptsLyrics === AcceptsLyricsOption.Default
      ? this.getDefaultAcceptsLyrics(note, previousNote)
      : note.acceptsLyrics;
  }

  /**
   * Calculates whether a note is melisma-only by nature (e.g. a Kentemata)
   * rather than by an override. Such a note takes an implied continuation: it
   * consumes no token and leaves no break character in extracted lyrics, while
   * a note set to `MelismaOnly` by the user still owns a break character.
   * @param note The note
   * @param previousNote The previous note, if one exists. Otherwise, pass `null`.
   * @returns `true` when the note is inherently melisma-only.
   */
  private isInherentlyMelismaOnly(
    note: NoteElement,
    previousNote: NoteElement | null,
  ) {
    return (
      this.getEffectiveAcceptsLyrics(note, previousNote) ===
        AcceptsLyricsOption.MelismaOnly &&
      this.getDefaultAcceptsLyrics(note, previousNote) ===
        AcceptsLyricsOption.MelismaOnly
    );
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
   * Computes the per-note lyric updates needed when a vocalic melisma is entered inline
   * (directly on a neume rather than through the Lyrics pane). The affected melisma run
   * is found by scanning the elements forward and backward, and the run's lyrics are
   * then re-assigned using the global melisma style.
   *
   * Returns null when the entry is not an inline vocalic melisma, in which case the
   * caller should fall back to a plain per-note update. An empty array means the run
   * already matches the entered melisma and nothing should change.
   */
  getInlineVocalicMelismaUpdates(
    element: NoteElement,
    lyrics: string,
    elements: ScoreElement[],
    rtl: boolean,
    melismaStyle: MelismaStyle,
  ): NoteLyricUpdate[] | null {
    // The plain per-note update and the current sung letters are each needed
    // by several of the checks below; compute them at most once.
    let localValues: Partial<NoteElement> | null | undefined;
    const probeLocalValues = () =>
      localValues !== undefined
        ? localValues
        : (localValues = this.getLyricUpdateValues(
            element,
            lyrics,
            elements,
            rtl,
            () => {},
          ));

    let currentLetters: string | undefined;
    const getCurrentLetters = () =>
      (currentLetters ??= extractLyricLetters(
        this.extractLyrics(elements, melismaStyle),
      ));

    const localUpdatePreservesLyricLetters = (values: Partial<NoteElement>) =>
      this.inlineUpdatesPreserveLyricLetters(
        elements,
        [{ note: element, newValues: values }],
        melismaStyle,
        getCurrentLetters(),
      );

    // The lyric input includes its trailing break while the note stores that
    // break in the melisma flags. If those stored values already represent the
    // input, a surrounding run must not reinterpret the identical value on a
    // repeated input event.
    if (endsWithMelismaBreak(lyrics) && probeLocalValues() == null) {
      return [];
    }

    if (isMelismaBreakingCharacter(lyrics) && element.lyrics !== '') {
      const elementIndex = elements.indexOf(element);

      if (
        this.findPreviousVocalicRunClosedBy(
          elements,
          elementIndex,
          melismaStyle,
        ) != null
      ) {
        return [];
      }

      const run = this.resolveMelismaRun(elements, element, elementIndex);

      // Extending a consonant-ending run moves its final form onto the edited
      // note. The editor can then send the same marker again while the lyric
      // box still contains that marker. Treat it as the already-applied edit
      // instead of clearing the final form and toggling on every retype.
      if (this.noteCarriesRunFinalForm(run.owner, element, melismaStyle)) {
        return [];
      }
    }

    const context = this.getInlineVocalicMelismaContext(
      element,
      lyrics,
      elements,
      melismaStyle,
    );

    if (context == null) {
      // Without a run to rebuild, a breaks-only edit falls back to the plain
      // local update; suppress it when it would change the score's sung
      // letters.
      if (this.inlineEditAddsOnlyMelismaBreaks(element, lyrics)) {
        const values = probeLocalValues();

        if (values != null && !localUpdatePreservesLyricLetters(values)) {
          return [];
        }
      }

      return null;
    }

    const updates = this.collectLyricUpdates(
      context.lyrics,
      context.elements,
      rtl,
      melismaStyle,
    );

    // Adding only melisma breaks may redistribute a syllable, but it must not
    // add or remove any of the score's sung letters. Prefer the ordinary local
    // update when it preserves them; if neither representation can do so,
    // retain the existing score instead of applying a lossy rewrite.
    if (
      this.inlineEditAddsOnlyMelismaBreaks(element, lyrics) &&
      !this.inlineUpdatesPreserveLyricLetters(
        elements,
        updates,
        melismaStyle,
        getCurrentLetters(),
      )
    ) {
      const values = probeLocalValues();

      if (values != null && localUpdatePreservesLyricLetters(values)) {
        return null;
      }

      return [];
    }

    return updates;
  }

  private inlineEditAddsOnlyMelismaBreaks(
    element: NoteElement,
    lyrics: string,
  ) {
    return (
      isMelismaBreakingCharacter(lyrics) ||
      sameNormalizedLyricText(stripMelismaBreaksSuffix(lyrics), element.lyrics)
    );
  }

  private inlineUpdatesPreserveLyricLetters(
    elements: ScoreElement[],
    updates: NoteLyricUpdate[],
    melismaStyle: MelismaStyle,
    currentLetters: string,
  ) {
    if (updates.length === 0) {
      return true;
    }

    const updatesByNote = new Map(
      updates.map((update) => [update.note, update.newValues]),
    );
    const updatedElements = elements.map((element) => {
      const newValues = updatesByNote.get(element as NoteElement);

      return newValues == null
        ? element
        : Object.assign(new NoteElement(), element, newValues);
    });

    // Both sides come from extractLyricLetters, which already normalizes.
    return (
      currentLetters ===
      extractLyricLetters(this.extractLyrics(updatedElements, melismaStyle))
    );
  }

  private collectLyricUpdates(
    lyrics: string,
    elements: ScoreElement[],
    rtl: boolean,
    melismaStyle: MelismaStyle,
  ): NoteLyricUpdate[] {
    const updates: NoteLyricUpdate[] = [];
    const originalNotes = new Map<NoteElement, NoteElement>();
    const workingElements = elements.map((element) => {
      if (element.elementType !== ElementType.Note) {
        return element;
      }

      const workingNote = Object.assign(new NoteElement(), element, {
        lyrics: '',
        isMelisma: false,
        isMelismaStart: false,
        isHyphen: false,
        melismaText: '',
      });
      originalNotes.set(workingNote, element as NoteElement);
      return workingNote;
    });

    this.assignLyrics(
      lyrics,
      workingElements,
      rtl,
      melismaStyle,
      () => {},
      (note, newValues) => {
        // The update always carries all four fields (see getLyricUpdateValues).
        const originalNote = originalNotes.get(note)!;

        if (
          !sameNormalizedLyricText(originalNote.lyrics, newValues.lyrics!) ||
          originalNote.isMelisma !== newValues.isMelisma ||
          originalNote.isMelismaStart !== newValues.isMelismaStart ||
          originalNote.isHyphen !== newValues.isHyphen
        ) {
          updates.push({ note: originalNote, newValues });
        }
      },
      () => {},
    );

    return updates;
  }

  private getInlineVocalicMelismaContext(
    element: NoteElement,
    lyrics: string,
    elements: ScoreElement[],
    melismaStyle: MelismaStyle,
  ): InlineVocalicMelismaContext | null {
    if (!endsWithMelismaBreak(lyrics)) {
      return null;
    }

    const elementIndex = elements.indexOf(element);
    const trailingBreakCount = countMelismaBreaksSuffix(lyrics);
    const syllableText = stripMelismaBreaksSuffix(lyrics);
    const previousRunNote = this.findPreviousNoteInRun(elements, elementIndex);
    const effectiveAcceptsLyrics = this.getEffectiveAcceptsLyrics(
      element,
      previousRunNote?.note ?? null,
    );
    // A baked empty note explicitly accepts no lyrics, so it cannot consume
    // any break used to rebuild a surrounding run. Keep its inline edit local;
    // otherwise re-assignment drops the preceding syllable's final form and a
    // repeated edit toggles the run's break style.
    if (effectiveAcceptsLyrics === AcceptsLyricsOption.No) {
      return null;
    }

    // The lyric box on a vocalic run's closing note contains the final form
    // (e.g. "ων" in "τω/ων"). Appending a break there must rebuild the open
    // run from its owner; treating the final form as a new syllable duplicates
    // its letters ("τω/ων" -> "τω/ων/ων").
    if (
      trailingBreakCount === 1 &&
      syllableText !== '' &&
      sameLyricText(element.lyrics, syllableText)
    ) {
      const previousRun = this.findPreviousVocalicRunClosedBy(
        elements,
        elementIndex,
        melismaStyle,
      );

      if (previousRun != null) {
        return this.buildInlineRunContextForRun(
          elements,
          previousRun,
          elementIndex,
          lyrics,
          melismaStyle,
        );
      }
    }

    // An inherently MelismaOnly note cannot consume a word token during a
    // batch assignment. Apply a lyric-bearing inline edit locally first; its
    // resulting melisma flags then make an identical input a no-op.
    if (
      effectiveAcceptsLyrics === AcceptsLyricsOption.MelismaOnly &&
      syllableText !== ''
    ) {
      return null;
    }

    if (trailingBreakCount === 1 && syllableText !== '') {
      const existingRunElements = element.isMelismaStart
        ? this.sliceMelismaSegment(elements, elementIndex)
        : [];
      const existingSyllable = this.extractSingleVocalicSyllable(
        existingRunElements,
        melismaStyle,
      );
      const rebuildsExistingRun =
        existingSyllable != null &&
        runHasFollowingNote(existingRunElements) &&
        (sameLyricText(existingSyllable, syllableText) ||
          sameLyricText(element.lyrics, syllableText));

      if (rebuildsExistingRun) {
        return {
          elements: existingRunElements,
          lyrics: `${existingSyllable}${lyrics
            .slice(-1)
            .repeat(this.countAssignableMelismaBreaks(existingRunElements))}`,
        };
      }

      return this.getInlinePreviousVocalicFinalContext(
        element,
        lyrics,
        elements,
        elementIndex,
        melismaStyle,
      );
    }

    if (trailingBreakCount > 1) {
      if (!MelismaHelperGreek.usesVocalicMelisma(melismaStyle, syllableText)) {
        return null;
      }

      const runElements = this.sliceThroughNthNote(
        elements,
        elementIndex,
        trailingBreakCount,
      );
      const melismaBreaks = lyrics.slice(syllableText.length);

      return {
        elements: runElements,
        lyrics:
          syllableText +
          (runHasFollowingNote(runElements)
            ? melismaBreaks.slice(
                0,
                this.countAssignableMelismaBreaks(runElements),
              )
            : ''),
      };
    }

    // Only a bare break character reaches this point: every combination of a
    // non-empty syllable with a trailing break returns above.
    //
    // A marker retyped on an existing note is already a complete local edit.
    // Rebuilding a surrounding run in this case can pull a syllable from
    // another note into the target, and repeating the same keystroke can then
    // move it back. Only a fresh empty note inside a run can be rebuilt.
    if (element.lyrics !== '' || element.isMelisma || previousRunNote == null) {
      return null;
    }

    // An underscore typed on an inherently MelismaOnly note stands for the next
    // token-consuming note: the MelismaOnly note supplies its continuation
    // implicitly and consumes no marker in the canonical lyrics, so the run
    // must be rebuilt through the note that does consume the marker.
    const implicitClosingNoteIndex =
      lyrics === '_' &&
      this.isInherentlyMelismaOnly(element, previousRunNote.note)
        ? this.findNextTokenConsumingNoteIndex(elements, elementIndex)
        : null;

    // A batch rebuild is only needed when extending a hyphen-linked vocalic run
    // onto the note, or when the marker is consumed by a later note.
    if (
      (!previousRunNote.note.isHyphen && implicitClosingNoteIndex == null) ||
      (effectiveAcceptsLyrics === AcceptsLyricsOption.Yes &&
        this.findPreviousVocalicRunClosedBy(
          elements,
          previousRunNote.index,
          melismaStyle,
        ) != null)
    ) {
      return null;
    }

    const run = this.findInlineVocalicRun(
      element,
      elementIndex,
      elements,
      melismaStyle,
    );

    if (run == null) {
      return null;
    }

    return this.buildInlineRunContextForRun(
      elements,
      run,
      implicitClosingNoteIndex ?? elementIndex,
      lyrics,
      melismaStyle,
    );
  }

  /**
   * Builds the rebuild context for `run`, preferring the start of the whole
   * hyphen-linked chain: when the run's owner is itself the final form of a
   * preceding run (e.g. "um-" after "Du-"), the chain extraction folds back
   * into one syllable ("Dum") whose letters must all take part in the rebuild.
   * When the chain instead spans distinct syllables (e.g. "Du-ne"), it fails
   * buildInlineRunContext's single-syllable check and the nearest run alone is
   * rebuilt.
   *
   * `runEndIndex` is the last note taking part in the rebuild: normally the
   * typed note, or the note that consumes the typed marker when the typed note
   * supplies its continuation implicitly.
   */
  private buildInlineRunContextForRun(
    elements: ScoreElement[],
    run: MelismaRun,
    runEndIndex: number,
    lyrics: string,
    melismaStyle: MelismaStyle,
  ): InlineVocalicMelismaContext | null {
    return (
      this.buildInlineRunContext(
        elements,
        run.startIndex,
        runEndIndex,
        lyrics,
        melismaStyle,
      ) ??
      this.buildInlineRunContext(
        elements,
        run.ownerIndex,
        runEndIndex,
        lyrics,
        melismaStyle,
      )
    );
  }

  private buildInlineRunContext(
    elements: ScoreElement[],
    startIndex: number,
    runEndIndex: number,
    lyrics: string,
    melismaStyle: MelismaStyle,
  ): InlineVocalicMelismaContext | null {
    const runElements = elements.slice(startIndex, runEndIndex + 1);
    const noteCount = runElements.filter(
      (x) => x.elementType === ElementType.Note,
    ).length;

    if (noteCount < 2) {
      return null;
    }

    // Derive the run's syllable from the run including the end note's current
    // text: when that note carries the run's final form (e.g. "um" in Du/um),
    // replacing it with a break must fold its letters back into the syllable
    // rather than dropping them.
    const syllableText = this.extractSingleVocalicSyllable(
      runElements,
      melismaStyle,
    );

    if (syllableText == null) {
      return null;
    }

    return {
      elements: runElements,
      lyrics: `${syllableText}${(lyrics.endsWith('-') ? '-' : '_').repeat(
        this.countAssignableMelismaBreaks(runElements),
      )}`,
    };
  }

  private getInlinePreviousVocalicFinalContext(
    element: NoteElement,
    lyrics: string,
    elements: ScoreElement[],
    elementIndex: number,
    melismaStyle: MelismaStyle,
  ): InlineVocalicMelismaContext | null {
    const typedSyllableText = stripMelismaBreaksSuffix(lyrics);

    // Replacing an existing syllable is a local edit. Rebuilding a preceding
    // run in this case can absorb the replacement into that run, so identical
    // input alternates between the old and new syllables.
    if (
      element.lyrics !== '' &&
      !sameLyricText(element.lyrics, typedSyllableText)
    ) {
      return null;
    }

    const previousNote = this.findPreviousNoteInRun(elements, elementIndex);

    if (previousNote == null) {
      return null;
    }

    if (previousNote.note.isMelisma) {
      return null;
    }

    const previousMelismaNote = this.findPreviousNoteInRun(
      elements,
      previousNote.index,
    );

    if (previousMelismaNote == null || !previousMelismaNote.note.isMelisma) {
      return null;
    }

    const previousRun = this.resolveMelismaRun(
      elements,
      previousMelismaNote.note,
      previousMelismaNote.index,
    );

    if (
      previousRun.owner === previousMelismaNote.note ||
      !MelismaHelperGreek.usesVocalicMelisma(
        melismaStyle,
        previousRun.owner.lyrics,
      )
    ) {
      return null;
    }

    if (previousNote.note.lyrics === '') {
      return null;
    }

    const previousRunElements = elements.slice(
      previousRun.ownerIndex,
      elementIndex,
    );
    const typedSyllable =
      MelismaHelperGreek.getMelismaSyllable(typedSyllableText);

    // A single inline break starts a melisma on this note but does not provide
    // a second token on which to place a consonant-ending syllable's final
    // form. Keep that edit local. If the user extends the run on a following
    // note, that later edit has enough context to rebuild it without dropping
    // the coda in the meantime.
    if (typedSyllable.final !== typedSyllable.middle) {
      return null;
    }

    const previousSyllableText = this.extractSingleVocalicSyllable(
      previousRunElements,
      melismaStyle,
    );

    if (previousSyllableText == null) {
      return null;
    }

    return {
      elements: [...previousRunElements, element],
      lyrics: `${previousSyllableText}${'-'.repeat(
        this.countAssignableMelismaBreaks(previousRunElements),
      )}${lyrics}`,
    };
  }

  /**
   * Extracts the lyrics of `elements` and returns the single vocalic syllable
   * they collapse to, or null when the extraction is not one unbroken vocalic
   * syllable (e.g. it spans distinct hyphenated syllables like "Du-ne").
   */
  private extractSingleVocalicSyllable(
    elements: ScoreElement[],
    melismaStyle: MelismaStyle,
  ): string | null {
    const syllableText = stripMelismaBreaksSuffix(
      this.extractLyrics(elements, melismaStyle),
    );

    return isSingleSyllableToken(syllableText) &&
      MelismaHelperGreek.usesVocalicMelisma(melismaStyle, syllableText)
      ? syllableText
      : null;
  }

  private findInlineVocalicRun(
    element: NoteElement,
    elementIndex: number,
    elements: ScoreElement[],
    melismaStyle: MelismaStyle,
  ): MelismaRun | null {
    const run = this.resolveMelismaRun(elements, element, elementIndex);

    if (
      run.owner !== element &&
      MelismaHelperGreek.usesVocalicMelisma(melismaStyle, run.owner.lyrics)
    ) {
      return run;
    }

    const previousNote = this.findPreviousNoteInRun(elements, elementIndex);

    if (previousNote == null) {
      return null;
    }

    const previousRun = this.resolveMelismaRun(
      elements,
      previousNote.note,
      previousNote.index,
    );
    const previousRunLyrics = this.extractLyrics(
      previousRun.elements,
      melismaStyle,
    );

    return MelismaHelperGreek.usesVocalicMelisma(
      melismaStyle,
      stripMelismaBreaksSuffix(previousRunLyrics),
    )
      ? previousRun
      : null;
  }

  /**
   * Whether the vocalic run that `note` starts connects forward to a following
   * syllable, i.e. the note carrying the run's final form is written with a
   * hyphen. When the run has no confirmed final form, the note's own break
   * style stands.
   */
  private existingRunConnectsForward(
    elements: ScoreElement[],
    noteIndex: number,
    note: NoteElement,
  ) {
    const finalCandidate = note.isMelismaStart
      ? findMelismaFinalNote(elements, noteIndex)
      : null;

    return finalCandidate != null &&
      getMelismaRunMiddle(note.lyrics, finalCandidate) != null
      ? finalCandidate.isHyphen
      : note.isHyphen;
  }

  /**
   * Whether `note` carries the final form of a vocalic run owned by `owner`
   * (e.g. the "ων" closing "τω/ω/ων") rather than a syllable of its own.
   */
  private noteCarriesRunFinalForm(
    owner: NoteElement,
    note: NoteElement,
    melismaStyle: MelismaStyle,
  ) {
    return (
      owner !== note &&
      MelismaHelperGreek.usesVocalicMelisma(melismaStyle, owner.lyrics) &&
      getMelismaRunMiddle(owner.lyrics, note) != null
    );
  }

  /**
   * Returns the vocalic run that the note at `noteIndex` closes with its final
   * form, or null when the note does not close a preceding run.
   */
  private findPreviousVocalicRunClosedBy(
    elements: ScoreElement[],
    noteIndex: number,
    melismaStyle: MelismaStyle,
  ): MelismaRun | null {
    const note = elements[noteIndex] as NoteElement;
    const previousNote = this.findPreviousNoteInRun(elements, noteIndex);

    if (previousNote == null || !previousNote.note.isMelisma) {
      return null;
    }

    const previousRun = this.resolveMelismaRun(
      elements,
      previousNote.note,
      previousNote.index,
    );

    return this.noteCarriesRunFinalForm(previousRun.owner, note, melismaStyle)
      ? previousRun
      : null;
  }

  /**
   * Counts the melisma break characters that `assignLyrics` consumes when a
   * single syllable followed by breaks is re-assigned over `elements`: one for
   * the start note's own trailing break, plus one per following note that
   * consumes a token (effective `acceptsLyrics` of `Yes`). A MelismaOnly note
   * (e.g. a Kentemata) takes an implied continuation and consumes no break;
   * counting it would leave a dangling break token that makes the run appear
   * to continue past its last note, losing the syllable's final form.
   */
  private countAssignableMelismaBreaks(elements: ScoreElement[]): number {
    let count = 1;
    let previousNote: NoteElement | null = null;

    for (const element of elements) {
      if (element.elementType !== ElementType.Note) {
        continue;
      }

      const note = element as NoteElement;

      if (
        previousNote != null &&
        this.getEffectiveAcceptsLyrics(note, previousNote) ===
          AcceptsLyricsOption.Yes
      ) {
        count++;
      }

      previousNote = note;
    }

    return count;
  }

  private sliceThroughNthNote(
    elements: ScoreElement[],
    startIndex: number,
    noteCount: number,
  ) {
    let remaining = noteCount;
    let endIndex = startIndex;

    for (let i = startIndex; i < elements.length; i++) {
      const element = elements[i];

      if (isMelismaContinuationElement(element)) {
        continue;
      }

      if (element.elementType !== ElementType.Note) {
        break;
      }

      endIndex = i;
      remaining--;

      if (remaining === 0) {
        break;
      }
    }

    return elements.slice(startIndex, endIndex + 1);
  }

  private sliceMelismaSegment(
    elements: ScoreElement[],
    startIndex: number,
  ): ScoreElement[] {
    return elements.slice(
      startIndex,
      scanMelismaSegment(elements, startIndex).endIndex + 1,
    );
  }

  /**
   * Resolves the melisma run that contains `note` by scanning the elements. The run's
   * effective style is the global melisma style.
   */
  private resolveMelismaRun(
    elements: ScoreElement[],
    note: NoteElement,
    noteIndex: number,
  ): MelismaRun {
    const ownerIndex = this.resolveMelismaRunOwnerIndex(
      elements,
      note,
      noteIndex,
    );
    const run = this.collectMelismaRunElements(elements, ownerIndex);

    return {
      owner: elements[ownerIndex] as NoteElement,
      ownerIndex,
      ...run,
    };
  }

  private resolveMelismaRunOwnerIndex(
    elements: ScoreElement[],
    note: NoteElement,
    noteIndex: number,
  ): number {
    if (note.isMelismaStart) {
      return noteIndex;
    }

    if (note.isMelisma) {
      const startIndex = this.findMelismaStartIndex(elements, noteIndex - 1);
      return startIndex ?? noteIndex;
    }

    const previousNote = this.findPreviousNoteInRun(elements, noteIndex);

    if (previousNote == null) {
      return noteIndex;
    }

    if (previousNote.note.isMelisma && previousNote.note.isHyphen) {
      const startIndex = this.findMelismaStartIndex(
        elements,
        previousNote.index,
      );
      return startIndex ?? noteIndex;
    }

    return noteIndex;
  }

  private collectMelismaRunElements(
    elements: ScoreElement[],
    startIndex: number,
  ): Omit<MelismaRun, 'owner' | 'ownerIndex'> {
    const runStartIndex = this.findRunStartIndex(elements, startIndex);
    const runElements: ScoreElement[] = [];
    let previousNote: NoteElement | null = null;

    for (let i = runStartIndex; i < elements.length; i++) {
      const element = elements[i];

      if (isMelismaContinuationElement(element) && previousNote != null) {
        runElements.push(element);
        continue;
      }

      if (element.elementType !== ElementType.Note) {
        break;
      }

      const note = element as NoteElement;
      const isContinuation = note.isMelisma && !note.isMelismaStart;

      // A non-continuation note starts a new syllable, which belongs to the
      // run only when the previous note connects to it with a hyphen.
      if (previousNote != null && !isContinuation && !previousNote.isHyphen) {
        break;
      }

      runElements.push(note);
      previousNote = note;
    }

    return { startIndex: runStartIndex, elements: runElements };
  }

  private findRunStartIndex(
    elements: ScoreElement[],
    startIndex: number,
  ): number {
    let runStartIndex = startIndex;

    for (;;) {
      const previousNote = this.findPreviousNoteInRun(elements, runStartIndex);

      if (previousNote == null) {
        break;
      }

      if (!(previousNote.note.isMelisma && previousNote.note.isHyphen)) {
        break;
      }

      runStartIndex =
        this.findMelismaStartIndex(elements, previousNote.index) ??
        previousNote.index;
    }

    return runStartIndex;
  }

  /**
   * Finds the nearest note before `index`, looking past melisma-transparent
   * elements, but stopping at any other element. The backward counterpart of
   * `findNextNote`.
   */
  private findPreviousNoteInRun(
    elements: ScoreElement[],
    index: number,
  ): IndexedNote | null {
    for (let i = index - 1; i >= 0; i--) {
      const element = elements[i];

      if (element.elementType === ElementType.Note) {
        return { note: element as NoteElement, index: i };
      }

      if (!isMelismaContinuationElement(element)) {
        break;
      }
    }

    return null;
  }

  /**
   * Finds the next note that consumes a lyric token, looking through inherent
   * MelismaOnly notes and the same transparent elements accepted by a melisma
   * run. Other note behavior or a structural element ends the search.
   */
  private findNextTokenConsumingNoteIndex(
    elements: ScoreElement[],
    index: number,
  ): number | null {
    let previousNote = elements[index] as NoteElement;

    for (let i = index + 1; i < elements.length; i++) {
      const element = elements[i];

      if (isMelismaContinuationElement(element)) {
        continue;
      }

      if (element.elementType !== ElementType.Note) {
        return null;
      }

      const note = element as NoteElement;

      // Walk through inherently MelismaOnly notes. The first note that is not
      // one either consumes the token or ends the search.
      if (!this.isInherentlyMelismaOnly(note, previousNote)) {
        return this.getEffectiveAcceptsLyrics(note, previousNote) ===
          AcceptsLyricsOption.Yes
          ? i
          : null;
      }

      previousNote = note;
    }

    return null;
  }

  private findMelismaStartIndex(
    elements: ScoreElement[],
    startIndex: number,
  ): number | null {
    for (let i = Math.min(startIndex, elements.length - 1); i >= 0; i--) {
      const element = elements[i];

      if (isMelismaContinuationElement(element)) {
        continue;
      }

      if (element.elementType !== ElementType.Note) {
        break;
      }

      const previousNote = element as NoteElement;

      if (previousNote.isMelismaStart) {
        return i;
      }

      if (!previousNote.isMelisma) {
        break;
      }
    }

    return null;
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

  /**
   * Whether the most recently returned token was separated from the previous
   * token by whitespace (or was the first token). This distinguishes a
   * standalone underscore (an empty note) from an underscore that continues a
   * melisma, since the melisma underscores are written contiguously.
   */
  tokenPrecededByWhitespace: boolean = false;

  constructor(lyrics: string) {
    this.lyrics = lyrics;
  }

  /**
   * Returns the next token in the lyrics.
   * @returns The next token
   */
  getNextToken() {
    let token = '';

    let foundCompleteToken = false;

    // The previous token may have already consumed the separating space (word
    // tokens do; break tokens do not), so consider both the character right
    // before the current position and any whitespace skipped below.
    let precededByWhitespace =
      this.index === 0 || this.lyrics[this.index - 1].trim() === '';

    while (!foundCompleteToken && this.index < this.lyrics.length) {
      const c = this.lyrics[this.index];

      if (c.trim() !== '') {
        token += c;
      }

      // Eat spaces until next non-space character
      if (c.trim() === '' && token.length > 0) {
        foundCompleteToken = true;
      } else if (c.trim() === '') {
        precededByWhitespace = true;
      }

      if (isMelismaBreakingCharacter(c)) {
        foundCompleteToken = true;
      }

      this.index++;
    }

    this.tokenPrecededByWhitespace = precededByWhitespace;

    return token.trim();
  }

  /**
   * Peeks ahead at the next token without changing the tokenizer's index.
   * @returns The next token
   */
  peekNextToken() {
    const previousIndex = this.index;
    const previousPrecededByWhitespace = this.tokenPrecededByWhitespace;

    const token = this.getNextToken();

    this.index = previousIndex;
    this.tokenPrecededByWhitespace = previousPrecededByWhitespace;

    return token;
  }

  /**
   * Peeks ahead to determine whether the next token starts a new word, i.e.
   * whether whitespace separates it from the previous token. The tokenizer
   * consumes a word token's single trailing space, so the character at the
   * current index alone cannot answer this; instead, reuse the whitespace
   * tracking that getNextToken itself performs.
   * @returns True if the next token starts a new word
   */
  nextTokenStartsNewWord() {
    const previousIndex = this.index;
    const previousPrecededByWhitespace = this.tokenPrecededByWhitespace;

    this.getNextToken();
    const startsNewWord = this.tokenPrecededByWhitespace;

    this.index = previousIndex;
    this.tokenPrecededByWhitespace = previousPrecededByWhitespace;

    return startsNewWord;
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

/**
 * Returns true if a melisma can continue through this element: martyria,
 * tempo markings, and inline text boxes sit inside a run without ending it.
 * The layout draws melismas through exactly this element class, so run
 * scanning must look past it too.
 */
export function isMelismaContinuationElement(element: ScoreElement) {
  return (
    element.elementType === ElementType.Martyria ||
    element.elementType === ElementType.Tempo ||
    (element.elementType === ElementType.TextBox &&
      (element as TextBoxElement).inline)
  );
}

/**
 * Walks the melisma segment that starts at `startIndex`: intermediate melisma
 * notes and melisma-transparent elements, ending inclusively at the first
 * syllable-bearing note (`finalNote`) or, when the segment ends before one is
 * found, at its last element with `finalNote` null. Any other element type
 * ends the walk.
 */
function scanMelismaSegment(
  elements: ScoreElement[],
  startIndex: number,
): { endIndex: number; finalNote: NoteElement | null } {
  let endIndex = startIndex;

  for (let i = startIndex + 1; i < elements.length; i++) {
    const element = elements[i];

    if (isMelismaContinuationElement(element)) {
      endIndex = i;
      continue;
    }

    if (element.elementType !== ElementType.Note) {
      break;
    }

    endIndex = i;
    const note = element as NoteElement;

    if (!(note.isMelisma && !note.isMelismaStart)) {
      return { endIndex, finalNote: note };
    }
  }

  return { endIndex, finalNote: null };
}

/**
 * Finds the note that carries a melisma run's final form: the next
 * syllable-bearing note after `startIndex`, skipping intermediate melisma
 * notes and looking past melisma-transparent elements. Returns `null` when
 * the elements end, or when any other element type interrupts the run, before
 * such a note is found.
 */
export function findMelismaFinalNote(
  elements: ScoreElement[],
  startIndex: number,
): NoteElement | null {
  return scanMelismaSegment(elements, startIndex).finalNote;
}

/**
 * Returns the repeated (middle) vowel of the vocalic melisma run that starts
 * with `startText` and is closed by `finalNote` holding `finalText`, or null
 * when `finalNote` does not carry the run's final form. `finalText` defaults
 * to the note's stored candidate text (its lyrics, else its melismaText); the
 * layout passes a differently derived text. The middle is
 * corrected against the final form (see MelismaHelperGreek.getMelismaMiddle).
 * `startText` must use a vocalic melisma (per
 * MelismaHelperGreek.usesVocalicMelisma); the precondition is not re-checked
 * here, and a vowelless `startText` degenerates to an empty-string return.
 *
 * A distinct following syllable can coincidentally begin with the run's
 * middle vowel (common in Church Slavonic, where a hyphen melisma is often
 * followed by an и-initial word form), so the prefix check alone would
 * misidentify it as the final form. Assignment writes a final form either
 * bare (the run ends with it) or with a hyphen connector (the run chains
 * into a following syllable), never with an underscore, so an
 * underscore-styled melisma start is always a new word-final syllable. A
 * hyphen-styled start is the run's final form only when it stores exactly
 * that: middle plus coda, which re-analyzes with no onset before the nucleus
 * (the "um" of Du/um). A new syllable instead stores its own initial, with
 * material before the nucleus (the "итїе́" of и-тї-е́мъ).
 */
export function getMelismaRunMiddle(
  startText: string,
  finalNote: NoteElement,
  finalText: string = getVocalicCandidateText(finalNote),
): string | null {
  if (finalNote.isMelismaStart && !finalNote.isHyphen) {
    return null;
  }

  const middle = MelismaHelperGreek.getMelismaMiddle(startText, finalText);

  if (!finalText.startsWith(middle)) {
    return null;
  }

  // A note whose own lyrics are exactly the repeated vowel is a real
  // adjacent syllable (e.g. the second "i" of fi-i-ca), not the run's final
  // form. An empty note whose melismaText matches the middle is instead an
  // intermediate note of an old-format run and keeps the run open.
  if (finalNote.lyrics !== '' && finalText === middle) {
    return null;
  }

  // The final form begins at the repeated vowel and contains only that
  // syllable's remaining vowel material and coda. It is token-medial by
  // construction, so it must not be analyzed as if its vowels started a word.
  const finalSyllable = MelismaHelperGreek.getMelismaSyllable(finalText, false);

  return sameLyricText(finalSyllable.middle, middle) &&
    sameLyricText(finalSyllable.final, finalText)
    ? middle
    : null;
}

function isMelismaBreakingCharacter(character: string) {
  return character === '-' || character === '_';
}

// A melisma continues when the next token is a break character written
// contiguously; a whitespace-separated break is an empty note instead.
function tokenContinuesMelisma(token: string, startsNewWord: boolean) {
  return isMelismaBreakingCharacter(token) && !startsNewWord;
}

function endsWithMelismaBreak(token: string) {
  return isMelismaBreakingCharacter(token.slice(-1));
}

function sameLyricText(first: string, second: string) {
  return (
    first === second ||
    first.normalize('NFD').toLowerCase().replaceAll('\u03c2', '\u03c3') ===
      second.normalize('NFD').toLowerCase().replaceAll('\u03c2', '\u03c3')
  );
}

// Whether a run slice holds a note after the one that owns it.
function runHasFollowingNote(runElements: ScoreElement[]) {
  return runElements.some(
    (runElement, index) =>
      index > 0 && runElement.elementType === ElementType.Note,
  );
}

function sameNormalizedLyricText(first: string, second: string) {
  return first === second || first.normalize('NFC') === second.normalize('NFC');
}

export function extractLyricLetters(text: string) {
  return text.normalize('NFD').replaceAll(/[^\p{L}\p{M}]/gu, '');
}

// A run extraction that is not a single unbroken syllable (e.g. it spans
// distinct hyphenated syllables like "Du-ne") cannot be rebuilt as one vocalic
// melisma.
function isSingleSyllableToken(text: string) {
  return (
    text !== '' &&
    !/\s/.test(text) &&
    !Array.from(text).some(isMelismaBreakingCharacter)
  );
}

function getVocalicCandidateText(note: NoteElement) {
  return note.lyrics || note.melismaText;
}

function stripMelismaBreaksSuffix(token: string) {
  return token.slice(0, token.length - countMelismaBreaksSuffix(token));
}

function countMelismaBreaksSuffix(token: string) {
  let count = 0;

  for (let i = token.length - 1; i >= 0; i--) {
    if (!isMelismaBreakingCharacter(token[i])) {
      break;
    }

    count++;
  }

  return count;
}
