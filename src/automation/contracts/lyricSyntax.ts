// Shared guidance for the tool, parser actions and writable property schemas.
export const lyricParserDescription =
  'Parser syntax: spaces separate syllables; - ends a syllable with a hyphen and _ extends it to another note. ' +
  'For three notes accepting lyrics, Al-le-lu gives Al / le / lu with hyphen starts; Al___ gives Al / empty / empty with extension flags. ' +
  'A standalone _ surrounded by spaces leaves a note blank. ' +
  'With Greek melismas enabled (pageSetup.disableGreekMelismata=false), ' +
  '\u03c4\u03c9___ gives \u03c4\u03c9 / empty / empty (continuing vowel \u03c9), and \u03c4\u03c9\u03bd___ gives \u03c4\u03c9 / empty / \u03c9\u03bd, placing the final consonant on the last note and marking the split as hyphenated. ' +
  'disableGreekMelismata=true disables automatic Greek vowel/consonant redistribution; _ and - markers still work. ' +
  'acceptsLyrics controls token consumption: Yes consumes syllables/continuations, No skips the note, MelismaOnly continues the preceding syllable without consuming a new one, and Default derives behavior from the quantitative neume and preceding tie. ' +
  'For predictable one-token-per-note examples use acceptsLyrics=Yes. Direct note properties do not run this parser. assign_lyrics ranges must include complete tied, melismatic, or hyphenated groups; a boundary cutting such a group is rejected with INVALID_ELEMENT_RANGE. Expand start/end to include the complete group, or explicitly update note lyrics and flags. assign_lyrics rejects unconsumed input (including nonempty text for an empty range) with INVALID_ELEMENT_RANGE; expand the range or shorten the input. set_staff_lyrics with locked=true may retain excess text for future notes.';

export const literalLyricsDescription =
  'Literal note text, not parser syntax. Setting lyrics="Al-" stores the hyphen literally. ' +
  'Prefer assign_lyrics or set_staff_lyrics for _/- input. To write a hyphenated syllable directly, set lyrics="Al", isMelisma=true, isMelismaStart=true, isHyphen=true. ' +
  'For an extension start use isHyphen=false; for continuation notes use lyrics="", isMelisma=true, isMelismaStart=false and the matching isHyphen. ' +
  'For a plain syllable clear all three flags. Omitted flags remain unchanged.';
