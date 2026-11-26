// Melkite RTL layout is only valid with Arabic lyrics, with tatweel for
// melismas. RTL test variants must not use Greek or English text.
const ARABIC_SYLLABLES = [
  'يا',
  'ربّ',
  'ارحم',
  'آمين',
  'قدّوس',
  'الله',
  'المجد',
  'لك',
];

// Turns on Melkite RTL and replaces every lyric with an Arabic syllable,
// keeping each note's melisma flags.
export function arabicRtlScore(score) {
  score.pageSetup.melkiteRtl = true;
  let index = 0;
  for (const element of score.staff.elements) {
    if (element.elementType === 'Note' && element.lyrics) {
      element.lyrics = ARABIC_SYLLABLES[index++ % ARABIC_SYLLABLES.length];
    }
  }
  return score;
}
