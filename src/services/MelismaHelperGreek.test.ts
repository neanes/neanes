import { describe, expect, it } from 'vitest';

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
});
