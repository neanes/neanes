import { MelismaStyle } from '@/models/PageSetup';

export interface MelismaSyllables {
  initial: string;
  middle: string;
  final: string;
}

// Script=X misses two kinds of character that still identify the script, so
// each is listed explicitly.
//
// Combining marks are Script=Inherited. The Greek perispomeni, ypogegrammeni,
// and dotted accents have Script_Extensions of Greek alone, so they are
// unambiguous. The Cyrillic dasia and psili are shared with Latin, but a Latin
// vowel carrying them is Slavonic chant rather than Romanian. Marks that Latin
// uses for its own vowels (the circumflex and acute that NFD produces for
// Romanian) must stay out, or Romanian would route to the wrong analyzer.
//
// The Greek numeral sign is Script=Common and normalizes to U+02B9, so both
// forms are listed.
const GREEK_SCRIPT_REGEX =
  /[\p{Script=Greek}\u0374\u02b9\u0342\u0345\u1dc0\u1dc1]/u;

const CYRILLIC_SCRIPT_REGEX = /[\p{Script=Cyrillic}\u0485\u0486]/u;

export class MelismaHelperGreek {
  private static containsGreekScript(text: string) {
    return GREEK_SCRIPT_REGEX.test(text);
  }

  public static usesVocalicMelisma(melismaStyle: MelismaStyle, text: string) {
    // Fast path: empty text (e.g. a melisma continuation note) never has a
    // repeatable vowel. Layout hits this constantly.
    if (text === '') {
      return false;
    }

    // Auto resolves by script. Greek and Cyrillic text is unambiguously
    // chant sung with vocalic melismas, but Latin-script text is not
    // self-identifying (Romanian cannot be told apart from English), so it
    // defaults to western.
    let resolvedStyle = melismaStyle;

    if (resolvedStyle === MelismaStyle.Auto) {
      const usesVocalicScript =
        this.containsGreekScript(text) || this.containsCyrillicScript(text);

      resolvedStyle = usesVocalicScript
        ? MelismaStyle.Vocalic
        : MelismaStyle.Western;
    }

    return (
      resolvedStyle === MelismaStyle.Vocalic &&
      this.getMelismaSyllable(text).middle !== ''
    );
  }

  /**
   * Splits `text` into the syllable forms a vocalic melisma is sung with.
   * @param text The text to analyze
   * @param tokenInitial Whether `text` starts a token. A melisma run's final
   * form is token-medial by construction: it continues the syllable that the
   * run's start note began (the "iu" of "riul" reaching its closing note as
   * "iul"), so the rules keyed on a token's first vowel must not fire for it.
   */
  public static getMelismaSyllable(
    text: string,
    tokenInitial: boolean = true,
  ): MelismaSyllables {
    const normalized = text.normalize('NFC');

    if (this.containsGreekScript(normalized)) {
      // The Greek analyzer decomposes to NFD itself, and NFD(NFC(x)) is
      // NFD(x), so it can start from the original text.
      return getGreekMelismaSyllable(text);
    }

    if (this.containsCyrillicScript(normalized)) {
      return getSlavonicMelismaSyllable(normalized);
    }

    return getRomanianMelismaSyllable(normalized, tokenInitial);
  }

  /**
   * Returns the repeated (middle) vowel for a vocalic melisma run whose start
   * note stores `initial` and whose closing note stores `finalText`.
   * Re-analyzing the stored `initial` alone can pick a different vowel than
   * the full token did: a Romanian falling diphthong/triphthong loses its
   * closing vowel ("glaui" stores "glau", which re-analyzes to "a" instead of
   * "u") and a closed "iu" loses its closing consonant ("riul" stores "riu",
   * which re-analyzes to "i" instead of "u"). The vowel shared by the initial
   * and the final form recovers the original analysis; when the final form
   * shares no vowel (it belongs to a different syllable or word), the
   * initial's own analysis stands.
   */
  public static getMelismaMiddle(initial: string, finalText: string | null) {
    const middle = this.getMelismaSyllable(initial).middle;

    if (finalText == null || finalText.startsWith(middle)) {
      return middle;
    }

    const overlap = vocalicMiddleOverlap(initial, finalText);

    return overlap !== '' ? overlap : middle;
  }

  private static containsCyrillicScript(text: string) {
    return CYRILLIC_SCRIPT_REGEX.test(text);
  }
}

const LETTER_REGEX = /\p{L}/u;

const COMBINING_MARK_REGEX = /\p{M}/u;

const GREEK_VOWELS_LOWERCASE = 'αειουηω';

const GREEK_VOWELS = new Set(GREEK_VOWELS_LOWERCASE);

const GREEK_UPSILON_DIPHTHONGS = new Set(['ευ', 'αυ', 'ηυ']);

const ROMANIAN_VOWELS_LOWERCASE = 'aeiouăâî';

const ROMANIAN_VOWELS = new Set(
  ROMANIAN_VOWELS_LOWERCASE + ROMANIAN_VOWELS_LOWERCASE.toUpperCase(),
);

// Church Slavonic and modern Cyrillic vowel letters, so that liturgical texts
// analyze cleanly regardless of source orthography. The yers (hard and soft
// sign) are silent in Church Slavonic and are not vowels, nor are the glides
// short i and short u. The bare izhitsa is conditional (see
// isSlavonicVocalicIzhitsa); the izhitsa with kendema is always a vowel.
const SLAVONIC_VOWELS_LOWERCASE =
  // modern Cyrillic, including the precomposed grave forms produced by NFC
  'аеиоуыэюяёіїєѐѝ' +
  // historic letters: yat, omega, broad on, omega with great apostrophe,
  // digraph uk, the yuses and their iotified forms, iotified e, and izhitsa
  // with kendema
  'ѣѡѻѽѹѧѫѩѭѥѷ' +
  // Cyrillic Extended-B: monograph uk, broad omega, yeru with back yer,
  // iotified yat, iotified a, reversed yu, the closed and blended yus forms,
  // and iota
  'ꙋꙍꙑꙓꙗꙕꙙꙛꙝꙇ' +
  // Cyrillic Extended-C: narrow o and unblended uk
  'ᲂᲈ';

const SLAVONIC_VOWELS = new Set(
  SLAVONIC_VOWELS_LOWERCASE + SLAVONIC_VOWELS_LOWERCASE.toUpperCase(),
);

// Marks that force the vowel reading of a bare izhitsa: the kendema (double
// grave, or diaeresis in some sources), the accents, and the breathing. The
// titlo and covering marks of abbreviations do not; the izhitsa stays /v/ in
// the abbreviated "evangelie" even though the letter-titlo sits on it.
const SLAVONIC_IZHITSA_VOWEL_MARKS = new Set([
  '\u0300', // varia (grave)
  '\u0301', // oxia (acute)
  '\u0308', // kendema written as diaeresis
  '\u030f', // kendema (double grave)
  '\u0311', // kamora (inverted breve)
  '\u0486', // psili (breathing)
]);

// Greek, Romanian, and Church Slavonic vowels that can be a repeated (middle)
// melisma vowel. The Slavonic half adds the bare izhitsa, which is a vowel in
// the positions where it can be a nucleus.
const VOCALIC_MIDDLE_VOWELS = new Set(
  GREEK_VOWELS_LOWERCASE +
    ROMANIAN_VOWELS_LOWERCASE +
    SLAVONIC_VOWELS_LOWERCASE +
    'ѵ',
);

function isAllVocalicVowels(text: string) {
  if (text.length === 0) {
    return false;
  }

  for (const character of text.toLowerCase()) {
    if (!VOCALIC_MIDDLE_VOWELS.has(character)) {
      return false;
    }
  }

  return true;
}

// The longest all-vowel suffix of the start note's text that is also a prefix
// of the final form; empty when they share no vowel.
function vocalicMiddleOverlap(initial: string, final: string) {
  const lowerInitial = initial.toLowerCase();
  const lowerFinal = final.toLowerCase();
  const max = Math.min(lowerInitial.length, lowerFinal.length);

  for (let length = max; length > 0; length--) {
    const suffix = lowerInitial.slice(lowerInitial.length - length);

    if (lowerFinal.startsWith(suffix) && isAllVocalicVowels(suffix)) {
      return suffix;
    }
  }

  return '';
}

function getGreekMelismaSyllable(text: string): MelismaSyllables {
  // Analyze decomposed graphemes so precomposed monotonic and polytonic
  // vowels behave exactly like their unaccented bases. Keeping marks attached
  // to their base letter also prevents the combining ypogegrammeni from being
  // case-folded to an iota by a case-insensitive regular expression. Each
  // grapheme's lowercased base letter is recorded alongside it.
  const graphemes: string[] = [];
  const bases: string[] = [];

  for (const character of text.normalize('NFD')) {
    if (isCombiningMark(character) && graphemes.length > 0) {
      graphemes[graphemes.length - 1] += character;
    } else {
      graphemes.push(character);
      bases.push(character.toLowerCase());
    }
  }

  const isVowelAt = (index: number) => GREEK_VOWELS.has(bases[index]);

  const finalVowelIndex = bases.findLastIndex((base) => GREEK_VOWELS.has(base));

  if (finalVowelIndex === -1) {
    return { initial: '', middle: '', final: '' };
  }

  let vowelRunStart = finalVowelIndex;

  while (vowelRunStart > 0 && isVowelAt(vowelRunStart - 1)) {
    vowelRunStart--;
  }

  const vowelRun = bases.slice(vowelRunStart, finalVowelIndex + 1).join('');
  // For ευ/αυ/ηυ the repeated vowel is only the first element. The second
  // vowel, including any breathing or accent attached to it, belongs to the
  // final form so extraction can reconstruct the original spelling.
  const middleLength = GREEK_UPSILON_DIPHTHONGS.has(vowelRun)
    ? 1
    : vowelRun.length;
  const middle = vowelRun.slice(0, middleLength);
  const initialEnd = vowelRunStart + middleLength;
  const initial = graphemes.slice(0, initialEnd).join('').normalize('NFC');
  const finalTail = graphemes.slice(initialEnd).join('').toLowerCase();
  const final = `${middle}${finalTail}`.normalize('NFC');

  return { initial, middle, final };
}

function getRomanianMelismaSyllable(
  text: string,
  tokenInitial: boolean,
): MelismaSyllables {
  const chars = Array.from(text);

  for (let i = chars.length - 1; i >= 0; i--) {
    if (
      ROMANIAN_VOWELS.has(chars[i]) &&
      !isRomanianDevocalizedFinalI(chars, i)
    ) {
      const middleIndex = getRomanianMiddleVowelIndex(chars, i, tokenInitial);
      const middle = chars[middleIndex].toLowerCase();

      return {
        initial: chars.slice(0, middleIndex + 1).join(''),
        middle,
        final: chars.slice(middleIndex).join('').toLowerCase(),
      };
    }
  }

  return { initial: '', middle: '', final: '' };
}

function getRomanianMiddleVowelIndex(
  chars: string[],
  finalVowelIndex: number,
  tokenInitial: boolean,
) {
  const previousIndex = finalVowelIndex - 1;

  if (previousIndex < 0 || !ROMANIAN_VOWELS.has(chars[previousIndex])) {
    return finalVowelIndex;
  }

  const previousVowel = chars[previousIndex].toLowerCase();
  const finalVowel = chars[finalVowelIndex].toLowerCase();

  // The spelling "iu" is ambiguous. Treat it as a rising diphthong (repeat the
  // "u") when the "i" is a glide rather than the syllabic nucleus:
  //   - after a graphic palatal spelling (ci/gi/chi/ghi): ciur, chiul
  //   - when the "i" is token-initial: the "iu" syllable of iu-bi-re, iu-te.
  //     Word-initial "iu" is consistently rising in Romanian (iubit, iute).
  //     A token-medial text (a run's final form) is exempt: its "i" continues
  //     the syllable its start note began and is not word-initial at all.
  //   - when the "u" is closed by a consonant in the same token. A falling
  //     "iu" resyllabifies before vowel-initial endings (a-u-riu but
  //     a-u-ri-ul, fiu but fi-ul), so a closed "iu" is either rising
  //     (Mântuitoriul, studiul, and the syllables riul/diul/miul/țiul) or a
  //     hiatus whose melisma lands on the "u" syllable (Fiul, pustiul as a
  //     single token). Either way the sustained vowel is the "u"; there is
  //     no counterexample among the word forms of the hunspell ro_RO lexicon.
  // Otherwise default to a falling diphthong (repeat the "i"): fiu, scriu,
  // sicriu, pustiu. This matches the "-iu" words that occur in modern chant
  // texts (auriu, argintiu, pustiu), which stress the "i". The default is
  // knowingly wrong for unstressed Latinate finals such as premiu/studiu and
  // for the archaic spellings of 19th-century chant books (Mântuitoriu,
  // Făcătoriu, ceriu), which are sung by sustaining the "u"; modern service
  // books write Mântuitorul etc., so the bare forms stay a documented
  // manual-edit case. Their definite forms (premiul, studiul, Mântuitoriul,
  // ceriul) are covered by the closed-"iu" rule above.
  if (
    previousVowel === 'i' &&
    finalVowel === 'u' &&
    ((tokenInitial && previousIndex === 0) ||
      isRomanianGraphicPalatalI(chars, previousIndex) ||
      isRomanianClosedIu(chars, finalVowelIndex))
  ) {
    return finalVowelIndex;
  }

  if (isRomanianFallingDiphthong(previousVowel, finalVowel)) {
    return previousIndex;
  }

  return finalVowelIndex;
}

function isRomanianFallingDiphthong(vowel: string, semivowel: string) {
  if (semivowel === 'i') {
    return ROMANIAN_VOWELS_LOWERCASE.includes(vowel);
  }

  if (semivowel === 'u') {
    return vowel !== 'u' && ROMANIAN_VOWELS_LOWERCASE.includes(vowel);
  }

  return false;
}

function isRomanianClosedIu(chars: string[], finalVowelIndex: number) {
  // Everything after the final vowel is a non-vowel by construction, so a
  // trailing letter is a consonant closing the "iu". The letter check keeps
  // trailing punctuation (e.g. "fiu,") from counting as a closing consonant.
  const next = chars[finalVowelIndex + 1];
  return next !== undefined && LETTER_REGEX.test(next);
}

function isRomanianDevocalizedFinalI(chars: string[], index: number) {
  if (
    chars.slice(index + 1).some((char) => LETTER_REGEX.test(char)) ||
    chars[index].toLowerCase() !== 'i' ||
    index === 0 ||
    ROMANIAN_VOWELS.has(chars[index - 1])
  ) {
    return false;
  }

  return chars.slice(0, index).some((char) => ROMANIAN_VOWELS.has(char));
}

// Assumes chars[index] is the "i" of an "iu" pair (checked by the caller).
function isRomanianGraphicPalatalI(chars: string[], index: number) {
  const previous = chars[index - 1]?.toLowerCase();

  if (previous === 'c' || previous === 'g') {
    return true;
  }

  if (previous === 'h') {
    const beforeH = chars[index - 2]?.toLowerCase();
    return beforeH === 'c' || beforeH === 'g';
  }

  return false;
}

function getSlavonicMelismaSyllable(text: string): MelismaSyllables {
  const chars = Array.from(text);

  for (let i = chars.length - 1; i >= 0; i--) {
    if (!isSlavonicVowel(chars, i)) {
      continue;
    }

    // Church Slavonic has no diphthongs: adjacent vowel letters belong to
    // separate syllables (mo-e-ya, pri-i-det), so the nucleus is the last
    // vowel letter alone. The one multi-letter nucleus is the digraph uk,
    // a single vowel /u/ written with two letters.
    const nucleusStart = isSlavonicUkDigraph(chars, i) ? i - 1 : i;

    // Combining marks on the nucleus (accent, breathing, titlo) stay on the
    // initial form only. The repeated middle and the final form use the plain
    // vowel, so the marks are neither repeated across the melisma nor
    // duplicated when a merge folds the final form back into the syllable.
    let nucleusEnd = i + 1;

    while (nucleusEnd < chars.length && isCombiningMark(chars[nucleusEnd])) {
      nucleusEnd++;
    }

    const middle = foldSlavonicPrecomposedGrave(
      chars
        .slice(nucleusStart, i + 1)
        .join('')
        .toLowerCase(),
    );

    return {
      initial: chars.slice(0, nucleusEnd).join(''),
      middle,
      final: (middle + chars.slice(nucleusEnd).join('')).toLowerCase(),
    };
  }

  return { initial: '', middle: '', final: '' };
}

// NFC composes "е" and "и" with a following varia (grave) into the
// precomposed letters "ѐ" and "ѝ", the only compositions NFC makes of a
// Church Slavonic prosodic accent on a Cyrillic vowel. (The kendema also
// composes, but there it is letter-forming: "ѷ" is a distinct vowel letter,
// not an accented "ѵ".) The grave is a prosodic mark like any other, so the
// repeated middle and the final form use the plain vowel, exactly as an
// accent written as a combining mark is left behind on the initial form.
function foldSlavonicPrecomposedGrave(middle: string) {
  if (middle === 'ѐ') {
    return 'е';
  }

  if (middle === 'ѝ') {
    return 'и';
  }

  return middle;
}

function isSlavonicVowel(chars: string[], index: number) {
  const char = chars[index];

  if (SLAVONIC_VOWELS.has(char)) {
    return true;
  }

  return (
    (char === 'ѵ' || char === 'Ѵ') && isSlavonicVocalicIzhitsa(chars, index)
  );
}

// Izhitsa spells the Greek upsilon: directly after "а" or "е" it is the
// consonant /v/ (Pavel, lavra, evangelie), elsewhere the vowel /i/ (miro,
// Tyre, Moses). A kendema, accent, or breathing on the izhitsa marks the
// vowel reading explicitly, even after "а" or "е".
function isSlavonicVocalicIzhitsa(chars: string[], index: number) {
  for (let i = index + 1; i < chars.length && isCombiningMark(chars[i]); i++) {
    if (SLAVONIC_IZHITSA_VOWEL_MARKS.has(chars[i])) {
      return true;
    }
  }

  for (let i = index - 1; i >= 0; i--) {
    if (isCombiningMark(chars[i])) {
      continue;
    }

    return !'аеєАЕЄ'.includes(chars[i]);
  }

  return true;
}

// The digraph uk spells the single vowel /u/ as "о" plus "у" (with the plain
// "о", the narrow "ᲂ" of Church Slavonic typography, or their capitals). Any
// marks sit on the "у", so the two letters are always adjacent; a marked "о"
// before "у" is a stressed vowel of its own, not a digraph.
function isSlavonicUkDigraph(chars: string[], index: number) {
  const char = chars[index];

  if (char !== 'у' && char !== 'У') {
    return false;
  }

  const previous = chars[index - 1];

  return previous === 'о' || previous === 'О' || previous === 'ᲂ';
}

function isCombiningMark(character: string) {
  return COMBINING_MARK_REGEX.test(character);
}
