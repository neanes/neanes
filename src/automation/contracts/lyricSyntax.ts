// Shared guidance for the tool, parser actions and writable property schemas.
export const dropCapLyricInstruction =
  "A drop cap and the following note's lyrics form one syllable; the drop cap does not consume a separate syllable.";

// Detailed guidance is exposed through focused DropCap content catalog queries.
export const dropCapLyricsDescription =
  'Plain-text initial letter of the following lyric syllable, not a separate syllable. ' +
  'For example, DropCap.content="A" followed by Note.lyrics="l" represents "Al". ' +
  'When assign_lyrics includes both elements, or when using set_staff_lyrics, supply the complete syllable: the parser assigns the initial character to the drop cap and the remainder to the note. ' +
  'Direct property edits store each part separately.';

export const lyricParserDescription =
  'Parser syntax: spaces separate syllables; - ends a syllable with a hyphen and _ extends it to another note. ' +
  'For three notes accepting lyrics, Al-le-lu gives Al / le / lu with hyphen starts; Al___ gives Al / empty / empty with extension flags. ' +
  'A standalone _ surrounded by spaces leaves a note blank. ' +
  'With Greek melismas enabled (pageSetup.disableGreekMelismata=false), ' +
  '\u03c4\u03c9___ gives \u03c4\u03c9 / empty / empty (continuing vowel \u03c9), and \u03c4\u03c9\u03bd___ gives \u03c4\u03c9 / empty / \u03c9\u03bd, placing the final consonant on the last note and marking the split as hyphenated. ' +
  'disableGreekMelismata=true disables automatic Greek vowel/consonant redistribution; _ and - markers still work. ' +
  'acceptsLyrics controls token consumption: Yes consumes syllables/continuations, No skips the note, MelismaOnly continues the preceding syllable without consuming a new one, and Default derives behavior from the quantitative neume and preceding tie. ' +
  'For predictable one-token-per-note examples use acceptsLyrics=Yes. Direct note properties do not run this parser.';

export const literalLyricsDescription =
  'Literal note text, not parser syntax. Setting lyrics="Al-" stores the hyphen literally. ' +
  'Prefer assign_lyrics or set_staff_lyrics for _/- input. To write a hyphenated syllable directly, set lyrics="Al", isMelisma=true, isMelismaStart=true, isHyphen=true. ' +
  'For an extension start use isHyphen=false; for continuation notes use lyrics="", isMelisma=true, isMelismaStart=false and the matching isHyphen. ' +
  'For a plain syllable clear all three flags. Omitted flags remain unchanged.';
