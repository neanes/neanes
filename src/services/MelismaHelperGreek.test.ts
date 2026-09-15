import { describe, expect, it } from 'vitest';

import { MelismaStyle } from '@/models/PageSetup';

import { MelismaHelperGreek } from './MelismaHelperGreek';

const vowels = 'αειουηω';
const diphthongs = ['αι', 'ει', 'οι', 'υι', 'ου'];

describe('MelismaHelperGreek', () => {
  it('should capture single vowels', () => {
    for (let i = 0; i < vowels.length; i++) {
      const vowel = vowels[i];

      const actual = MelismaHelperGreek.getMelismaSyllable(vowel);
      expect(actual.initial).toEqual(vowel);
      expect(actual.middle).toEqual(vowel);
      expect(actual.final).toEqual(vowel);
    }
  });

  it('should capture diphthongs', () => {
    for (let i = 0; i < diphthongs.length; i++) {
      const diphthong = diphthongs[i];

      const actual = MelismaHelperGreek.getMelismaSyllable(diphthong);
      expect(actual.initial).toEqual(diphthong);
      expect(actual.middle).toEqual(diphthong);
      expect(actual.final).toEqual(diphthong);
    }
  });

  it('should capture vowel followed by consonant', () => {
    const actual1 = MelismaHelperGreek.getMelismaSyllable('ουκ');
    expect(actual1.initial).toEqual('ου');
    expect(actual1.middle).toEqual('ου');
    expect(actual1.final).toEqual('ουκ');
  });

  it('should capture consonant followed by vowel', () => {
    const actual1 = MelismaHelperGreek.getMelismaSyllable('τε');
    expect(actual1.initial).toEqual('τε');
    expect(actual1.middle).toEqual('ε');
    expect(actual1.final).toEqual('ε');

    const actual2 = MelismaHelperGreek.getMelismaSyllable('στε');
    expect(actual2.initial).toEqual('στε');
    expect(actual2.middle).toEqual('ε');
    expect(actual2.final).toEqual('ε');
  });

  it('should capture CVC', () => {
    const actual1 = MelismaHelperGreek.getMelismaSyllable('γαρ');
    expect(actual1.initial).toEqual('γα');
    expect(actual1.middle).toEqual('α');
    expect(actual1.final).toEqual('αρ');

    const actual2 = MelismaHelperGreek.getMelismaSyllable('τον');
    expect(actual2.initial).toEqual('το');
    expect(actual2.middle).toEqual('ο');
    expect(actual2.final).toEqual('ον');
  });

  it('should capture ypsilon diphthongs', () => {
    const actual1 = MelismaHelperGreek.getMelismaSyllable('ευ');
    expect(actual1.initial).toEqual('ε');
    expect(actual1.middle).toEqual('ε');
    expect(actual1.final).toEqual('ευ');

    const actual2 = MelismaHelperGreek.getMelismaSyllable('αυ');
    expect(actual2.initial).toEqual('α');
    expect(actual2.middle).toEqual('α');
    expect(actual2.final).toEqual('αυ');

    const actual3 = MelismaHelperGreek.getMelismaSyllable('ηυ');
    expect(actual3.initial).toEqual('η');
    expect(actual3.middle).toEqual('η');
    expect(actual3.final).toEqual('ηυ');
  });

  it('should keep the coda of an ypsilon diphthong in the final form', () => {
    // The repeated (middle) vowel is the first element of the diphthong, but the
    // final form (the differing tail) must keep the closing consonant of words
    // like ναυς, Ζευς, φηυς instead of dropping it.
    const naus = MelismaHelperGreek.getMelismaSyllable('ναυς');
    expect(naus.initial).toEqual('να');
    expect(naus.middle).toEqual('α');
    expect(naus.final).toEqual('αυς');

    const zeus = MelismaHelperGreek.getMelismaSyllable('Ζευς');
    expect(zeus.initial).toEqual('Ζε');
    expect(zeus.middle).toEqual('ε');
    expect(zeus.final).toEqual('ευς');

    const fius = MelismaHelperGreek.getMelismaSyllable('φηυς');
    expect(fius.initial).toEqual('φη');
    expect(fius.middle).toEqual('η');
    expect(fius.final).toEqual('ηυς');
  });

  it('should return lower case middle and final', () => {
    const actual1 = MelismaHelperGreek.getMelismaSyllable('Ο');
    expect(actual1.initial).toEqual('Ο');
    expect(actual1.middle).toEqual('ο');
    expect(actual1.final).toEqual('ο');

    const actual2 = MelismaHelperGreek.getMelismaSyllable('Θε');
    expect(actual2.initial).toEqual('Θε');
    expect(actual2.middle).toEqual('ε');
    expect(actual2.final).toEqual('ε');
  });

  it('should preserve accented and polytonic Greek in NFC and NFD', () => {
    const examples = [
      ['τό', { initial: 'τό', middle: 'ο', final: 'ο' }],
      ['τῆς', { initial: 'τῆ', middle: 'η', final: 'ης' }],
      ['τὸ', { initial: 'τὸ', middle: 'ο', final: 'ο' }],
      ['τῷ', { initial: 'τῷ', middle: 'ω', final: 'ω' }],
      ['ή', { initial: 'ή', middle: 'η', final: 'η' }],
      ['Ζόρζ', { initial: 'Ζό', middle: 'ο', final: 'ορζ' }],
      ['καί', { initial: 'καί', middle: 'αι', final: 'αι' }],
      ['εὖ', { initial: 'ε', middle: 'ε', final: 'εὖ' }],
    ] as const;

    for (const [text, expected] of examples) {
      for (const normalization of ['NFC', 'NFD'] as const) {
        expect(
          MelismaHelperGreek.getMelismaSyllable(text.normalize(normalization)),
        ).toEqual(expected);
      }

      expect(
        MelismaHelperGreek.usesVocalicMelisma(MelismaStyle.Auto, text),
      ).toEqual(true);
    }
  });

  it('should preserve Greek text before the final vowel group', () => {
    expect(MelismaHelperGreek.getMelismaSyllable('αδε')).toEqual({
      initial: 'αδε',
      middle: 'ε',
      final: 'ε',
    });
  });

  it('should split Romanian vocalic syllables for melisma display', () => {
    const examples = [
      ['tea', { initial: 'tea', middle: 'a', final: 'a' }],
      ['greu', { initial: 'gre', middle: 'e', final: 'eu' }],
      ['scriu', { initial: 'scri', middle: 'i', final: 'iu' }],
      ['ple', { initial: 'ple', middle: 'e', final: 'e' }],
      ['oai', { initial: 'oa', middle: 'a', final: 'ai' }],
      ['ioa', { initial: 'ioa', middle: 'a', final: 'a' }],
      ['toa', { initial: 'toa', middle: 'a', final: 'a' }],
      ['grea', { initial: 'grea', middle: 'a', final: 'a' }],
      ['mea', { initial: 'mea', middle: 'a', final: 'a' }],
      ['rea', { initial: 'rea', middle: 'a', final: 'a' }],
      ['gă', { initial: 'gă', middle: 'ă', final: 'ă' }],
      ['cân', { initial: 'câ', middle: 'â', final: 'ân' }],
      ['se', { initial: 'se', middle: 'e', final: 'e' }],
      ['rul', { initial: 'ru', middle: 'u', final: 'ul' }],
      ['în', { initial: 'î', middle: 'î', final: 'în' }],
      ['du', { initial: 'du', middle: 'u', final: 'u' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should split Romanian falling diphthongs at the vowel nucleus', () => {
    const examples = [
      ['mai', { initial: 'ma', middle: 'a', final: 'ai' }],
      ['hăi', { initial: 'hă', middle: 'ă', final: 'ăi' }],
      ['îi', { initial: 'î', middle: 'î', final: 'îi' }],
      ['mâi', { initial: 'mâ', middle: 'â', final: 'âi' }],
      ['lei', { initial: 'le', middle: 'e', final: 'ei' }],
      ['fii', { initial: 'fi', middle: 'i', final: 'ii' }],
      ['noi', { initial: 'no', middle: 'o', final: 'oi' }],
      ['lui', { initial: 'lu', middle: 'u', final: 'ui' }],
      ['sau', { initial: 'sa', middle: 'a', final: 'au' }],
      ['rău', { initial: 'ră', middle: 'ă', final: 'ău' }],
      ['grâu', { initial: 'grâ', middle: 'â', final: 'âu' }],
      ['meu', { initial: 'me', middle: 'e', final: 'eu' }],
      ['fiu', { initial: 'fi', middle: 'i', final: 'iu' }],
      ['ou', { initial: 'o', middle: 'o', final: 'ou' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should split Romanian triphthongs around the full vowel', () => {
    const examples = [
      ['vreau', { initial: 'vrea', middle: 'a', final: 'au' }],
      ['beau', { initial: 'bea', middle: 'a', final: 'au' }],
      ['oai', { initial: 'oa', middle: 'a', final: 'ai' }],
      ['ioa', { initial: 'ioa', middle: 'a', final: 'a' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should ignore Romanian devocalized final i when finding the sung vowel', () => {
    const examples = [
      ['pomi', { initial: 'po', middle: 'o', final: 'omi' }],
      ['sfinți', { initial: 'sfi', middle: 'i', final: 'inți' }],
      ['vechi', { initial: 've', middle: 'e', final: 'echi' }],
      ['ochi', { initial: 'o', middle: 'o', final: 'ochi' }],
      ['ochi,', { initial: 'o', middle: 'o', final: 'ochi,' }],
      ['pomi.', { initial: 'po', middle: 'o', final: 'omi.' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should ignore graphic e and i after Romanian palatal consonant spellings', () => {
    const examples = [
      ['ceas', { initial: 'cea', middle: 'a', final: 'as' }],
      ['geam', { initial: 'gea', middle: 'a', final: 'am' }],
      ['chea', { initial: 'chea', middle: 'a', final: 'a' }],
      ['ghea', { initial: 'ghea', middle: 'a', final: 'a' }],
      ['ciur', { initial: 'ciu', middle: 'u', final: 'ur' }],
      ['giul', { initial: 'giu', middle: 'u', final: 'ul' }],
      ['chiu', { initial: 'chiu', middle: 'u', final: 'u' }],
      ['ghiu', { initial: 'ghiu', middle: 'u', final: 'u' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should treat token-initial Romanian iu as a rising diphthong', () => {
    // Word-initial "iu" is consistently rising in Romanian (iubit, iute), so
    // the sung vowel is the "u", not the "i". These tokens are the first
    // syllable of words such as iu-bi-re, iu-bit, iu-te, and iu-li-e.
    const examples = [
      ['iu', { initial: 'iu', middle: 'u', final: 'u' }],
      ['Iu', { initial: 'Iu', middle: 'u', final: 'u' }],
      ['iubi', { initial: 'iu', middle: 'u', final: 'ubi' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should treat Romanian iu closed by a consonant as rising', () => {
    // A falling "iu" resyllabifies before vowel-initial endings (fiu but
    // fi-ul, auriu but a-u-ri-ul), so an "iu" closed by a consonant in the
    // same token always sustains the "u": rising (Mântuitoriul, studiul, the
    // riul/diul syllables) or hiatus with the melisma on the "u" syllable
    // (Fiul, pustiul, știut, triumf as single tokens). Verified against every
    // word form expanded from the hunspell ro_RO lexicon; there is no
    // counterexample. This also covers the definite forms of the archaic
    // 19th-century spellings (Mântuitoriul, Ceriul), which chanters sing by
    // sustaining the "u".
    const examples = [
      ['Fiul', { initial: 'Fiu', middle: 'u', final: 'ul' }],
      ['riul', { initial: 'riu', middle: 'u', final: 'ul' }],
      ['Mântuitoriul', { initial: 'Mântuitoriu', middle: 'u', final: 'ul' }],
      ['Ceriul', { initial: 'Ceriu', middle: 'u', final: 'ul' }],
      ['studiul', { initial: 'studiu', middle: 'u', final: 'ul' }],
      ['auriul', { initial: 'auriu', middle: 'u', final: 'ul' }],
      ['pustiuri', { initial: 'pustiu', middle: 'u', final: 'uri' }],
      ['națiuni', { initial: 'națiu', middle: 'u', final: 'uni' }],
      // Trailing punctuation is not a closing consonant.
      ['fiu,', { initial: 'fi', middle: 'i', final: 'iu,' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should correct the run middle vowel against the final form', () => {
    // Once a token is split across note boxes, the start box keeps only the
    // "initial" (riul => riu + ul), which can re-analyze to a different
    // middle vowel. getMelismaMiddle recovers the original analysis from the
    // vowel shared with the final form, and leaves the initial's own analysis
    // alone when the final form is unrelated (a different syllable or word).
    const examples = [
      ['riu', 'ul', 'u'],
      ['Fiu', 'ul', 'u'],
      ['glau', 'ui', 'u'],
      ['sai', 'ii', 'i'],
      ['scri', 'iu', 'i'],
      ['φη', 'ηυς', 'η'],
      ['Dum', 'ne', 'u'],
    ] as const;

    for (const [initial, finalText, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaMiddle(initial, finalText)).toEqual(
        expected,
      );
    }

    expect(MelismaHelperGreek.getMelismaMiddle('τω', null)).toEqual('ω');
  });

  it('should keep non-initial Romanian iu falling (documented limitation)', () => {
    // Final consonant + "iu" is genuinely ambiguous and is resolved by stress,
    // which Romanian spelling does not mark. We default to falling (repeat the
    // "i"), which is correct for the common liturgical words below. Unstressed
    // Latinate finals (premiu, studiu, spațiu) and the archaic spellings of
    // 19th-century chant books (Mântuitoriu, ceriu) are actually rising --
    // chanters sustain the "u" -- but modern service books write Mântuitorul
    // etc., so both stay a documented manual-edit case; this test pins the
    // default so a future change is a deliberate decision rather than an
    // accident. Only the bare forms are affected: the definite forms
    // (premiul, Mântuitoriul) are covered by the closed-iu rule above.
    const falling = [
      ['fiu', { initial: 'fi', middle: 'i', final: 'iu' }],
      ['scriu', { initial: 'scri', middle: 'i', final: 'iu' }],
      ['viu', { initial: 'vi', middle: 'i', final: 'iu' }],
      ['pustiu', { initial: 'pusti', middle: 'i', final: 'iu' }],
      ['sicriu', { initial: 'sicri', middle: 'i', final: 'iu' }],
      ['târziu', { initial: 'târzi', middle: 'i', final: 'iu' }],
      ['auriu', { initial: 'auri', middle: 'i', final: 'iu' }],
      // Known-wrong defaults (truly rising, but indistinguishable by spelling):
      ['premiu', { initial: 'premi', middle: 'i', final: 'iu' }],
      ['studiu', { initial: 'studi', middle: 'i', final: 'iu' }],
      ['Mântuitoriu', { initial: 'Mântuitori', middle: 'i', final: 'iu' }],
      ['ceriu', { initial: 'ceri', middle: 'i', final: 'iu' }],
    ] as const;

    for (const [text, expected] of falling) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should normalize decomposed Romanian input before splitting', () => {
    expect(MelismaHelperGreek.getMelismaSyllable('a\u0306n')).toEqual({
      initial: 'ă',
      middle: 'ă',
      final: 'ăn',
    });
  });

  it('should split Church Slavonic syllables at the last vowel', () => {
    const examples = [
      ['мѧ', { initial: 'мѧ', middle: 'ѧ', final: 'ѧ' }],
      ['тѧ̀', { initial: 'тѧ̀', middle: 'ѧ', final: 'ѧ' }],
      ['гла́съ', { initial: 'гла́', middle: 'а', final: 'асъ' }],
      ['де́нь', { initial: 'де́', middle: 'е', final: 'ень' }],
      ['свѣ́тъ', { initial: 'свѣ́', middle: 'ѣ', final: 'ѣтъ' }],
      ['ѡ҆чи́сти', { initial: 'ѡ҆чи́сти', middle: 'и', final: 'и' }],
      ['хрⷭ҇то́съ', { initial: 'хрⷭ҇то́', middle: 'о', final: 'осъ' }],
      ['ны́нѣ', { initial: 'ны́нѣ', middle: 'ѣ', final: 'ѣ' }],
      ['пѣ́снь', { initial: 'пѣ́', middle: 'ѣ', final: 'ѣснь' }],
      ['гла́съ,', { initial: 'гла́', middle: 'а', final: 'асъ,' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should keep Church Slavonic adjacent vowels as separate syllables', () => {
    // Church Slavonic has no diphthongs: adjacent vowel letters are hiatus,
    // so the sung vowel is the last one. Contrast with Romanian, where "moi"
    // is a falling diphthong that repeats the "o".
    const examples = [
      ['мои', { initial: 'мои', middle: 'и', final: 'и' }],
      ['мои́хъ', { initial: 'мои́', middle: 'и', final: 'ихъ' }],
      ['твоеѧ̀', { initial: 'твоеѧ̀', middle: 'ѧ', final: 'ѧ' }],
      ['діа́волъ', { initial: 'діа́во', middle: 'о', final: 'олъ' }],
      // The hiatus "о" plus monograph uk is not the digraph uk.
      ['поꙋ', { initial: 'поꙋ', middle: 'ꙋ', final: 'ꙋ' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should treat the Church Slavonic digraph uk as a single vowel', () => {
    // The digraph uk spells one vowel /u/ with two letters, in several
    // Unicode forms: "о" or the narrow "ᲂ" plus "у", the single-codepoint
    // digraph "ѹ", and the monograph "ꙋ". All analyze isomorphically.
    const examples = [
      ['доухъ', { initial: 'доу', middle: 'оу', final: 'оухъ' }],
      ['дѹхъ', { initial: 'дѹ', middle: 'ѹ', final: 'ѹхъ' }],
      ['дꙋхъ', { initial: 'дꙋ', middle: 'ꙋ', final: 'ꙋхъ' }],
      ['ᲂу҆́мъ', { initial: 'ᲂу҆́', middle: 'ᲂу', final: 'ᲂумъ' }],
      ['Оу҆́гль', { initial: 'Оу҆́', middle: 'оу', final: 'оугль' }],
      ['растᲂу́', { initial: 'растᲂу́', middle: 'ᲂу', final: 'ᲂу' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should read izhitsa as a consonant after а and е and as a vowel elsewhere', () => {
    const examples = [
      // After "а"/"е"/"є" the izhitsa is /v/ (Greek av/ev), so the nucleus is
      // the vowel before or after it.
      ['па́ѵелъ', { initial: 'па́ѵе', middle: 'е', final: 'елъ' }],
      ['лаѵ', { initial: 'ла', middle: 'а', final: 'аѵ' }],
      // The letter-titlo of an abbreviation does not vocalize the izhitsa.
      ['єѵⷢ҇', { initial: 'є', middle: 'є', final: 'єѵⷢ҇' }],
      // Elsewhere (or marked with kendema or an accent) it is the vowel /i/.
      ['мѵ́', { initial: 'мѵ́', middle: 'ѵ', final: 'ѵ' }],
      ['тѵ́ръ', { initial: 'тѵ́', middle: 'ѵ', final: 'ѵръ' }],
      ['мѡѷсе́ѡвъ', { initial: 'мѡѷсе́ѡ', middle: 'ѡ', final: 'ѡвъ' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should strip Church Slavonic prosodic marks from the repeated vowel', () => {
    // Accents, breathings, and titla stay on the initial form; the repeated
    // middle and the final form use the plain vowel. NFC composes a varia on
    // е/и into the precomposed ѐ/ѝ, which fold to the plain vowel the same
    // way.
    const examples = [
      ['спаси́', { initial: 'спаси́', middle: 'и', final: 'и' }],
      ['и҆̀', { initial: 'и҆̀', middle: 'и', final: 'и' }],
      ['всѧ̑', { initial: 'всѧ̑', middle: 'ѧ', final: 'ѧ' }],
      ['дꙋшѐ', { initial: 'дꙋшѐ', middle: 'е', final: 'е' }],
      ['спасѝ', { initial: 'спасѝ', middle: 'и', final: 'и' }],
      ['поѝмъ', { initial: 'поѝ', middle: 'и', final: 'имъ' }],
      ['и҆з̾ѡ҆брѣ́тъ', { initial: 'и҆з̾ѡ҆брѣ́', middle: 'ѣ', final: 'ѣтъ' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should treat Church Slavonic short i and short u as glides', () => {
    const examples = [
      ['мо́й', { initial: 'мо́', middle: 'о', final: 'ой' }],
      ['пе́рвый', { initial: 'пе́рвы', middle: 'ы', final: 'ый' }],
      ['геро́й', { initial: 'геро́', middle: 'о', final: 'ой' }],
      // Belarusian short u patterns like the second element of a falling
      // diphthong.
      ['воўк', { initial: 'во', middle: 'о', final: 'оўк' }],
    ] as const;

    for (const [text, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(expected);
    }
  });

  it('should find no vowel in Church Slavonic abbreviations and yer-only tokens', () => {
    // The yers are silent in Church Slavonic, and abbreviations under titla
    // may have no written vowel at all (the sung vowel is not written), so
    // these fall back to western melismas. This also covers Bulgarian, where
    // "ъ" is a true vowel: words whose only vowel is "ъ" stay western.
    const empty = { initial: '', middle: '', final: '' };

    for (const text of ['гдⷭ҇ь', 'бг҃ъ', 'ст҃ъ', 'въ', 'ѿ', 'път']) {
      expect(MelismaHelperGreek.getMelismaSyllable(text)).toEqual(empty);
      expect(
        MelismaHelperGreek.usesVocalicMelisma(MelismaStyle.Vocalic, text),
      ).toEqual(false);
    }
  });

  it('should use vocalic melismas for Cyrillic text under Auto', () => {
    expect(
      MelismaHelperGreek.usesVocalicMelisma(MelismaStyle.Auto, 'сла́ва'),
    ).toEqual(true);
    expect(
      MelismaHelperGreek.usesVocalicMelisma(MelismaStyle.Western, 'сла́ва'),
    ).toEqual(false);
    expect(
      MelismaHelperGreek.usesVocalicMelisma(MelismaStyle.Vocalic, 'сла́ва'),
    ).toEqual(true);
  });

  it('should route script-specific marks consistently after NFC normalization', () => {
    const empty = { initial: '', middle: '', final: '' };

    // U+0374 normalizes to U+02B9. A Latin catalogue label followed by that
    // Greek numeral sign is notation, not a Romanian syllable whose "a" can
    // carry a vocalic melisma.
    expect(MelismaHelperGreek.getMelismaSyllable('a\u0374')).toEqual(empty);
    expect(
      MelismaHelperGreek.usesVocalicMelisma(MelismaStyle.Auto, 'a\u0374'),
    ).toEqual(false);

    // Cyrillic combining dasia and psili have Script=Inherited. They must
    // still route malformed mixed-script tokens through the Slavonic analyzer
    // rather than interpreting their Latin vowels as Romanian.
    for (const breathing of ['\u0485', '\u0486']) {
      expect(MelismaHelperGreek.getMelismaSyllable(`${breathing}jest`)).toEqual(
        empty,
      );
      expect(
        MelismaHelperGreek.usesVocalicMelisma(
          MelismaStyle.Auto,
          `${breathing}jest`,
        ),
      ).toEqual(false);
    }

    // The Greek perispomeni, ypogegrammeni, and dotted accents are
    // Script=Inherited too, and unlike the Cyrillic breathings no other script
    // uses them. They route the same way.
    for (const mark of ['\u0342', '\u0345', '\u1dc0', '\u1dc1']) {
      expect(MelismaHelperGreek.getMelismaSyllable(`${mark}jest`)).toEqual(
        empty,
      );
      expect(
        MelismaHelperGreek.usesVocalicMelisma(MelismaStyle.Auto, `${mark}jest`),
      ).toEqual(false);
      expect(
        MelismaHelperGreek.usesVocalicMelisma(
          MelismaStyle.Vocalic,
          `${mark}jest`,
        ),
      ).toEqual(false);
    }
  });

  it('should correct the Slavonic run middle vowel against the final form', () => {
    const examples = [
      ['доу', 'оухъ', 'оу'],
      ['ᲂу҆́', 'ᲂумъ', 'ᲂу'],
      ['спо́', 'одь', 'о'],
      ['поѝ', 'имъ', 'и'],
      ['гла́', 'асъ', 'а'],
    ] as const;

    for (const [initial, finalText, expected] of examples) {
      expect(MelismaHelperGreek.getMelismaMiddle(initial, finalText)).toEqual(
        expected,
      );
    }
  });
});
