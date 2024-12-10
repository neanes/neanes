export interface MelismaSyllables {
  initial: string;
  middle: string;
  final: string;
}

export class MelismaHelperGreek {
  public static isGreek(text: string) {
    for (let i = 0; i < text.length; i++) {
      if (this.charCodeIsGreek(text.charCodeAt(i))) {
        return this.containsVowel(text);
      }
    }

    return false;
  }

  public static getMelismaSyllable(text: string): MelismaSyllables {
    //const match = text.match(/[αειουηω](?!.*[αειουηω])/i);
    const match = text.match(/([^αειουηω]*)([αειουηω]+)([^αειουηω]*)$/i);

    let middle = match ? match[2] : '';
    let final = match ? middle + match[3] : '';

    if (middle === 'ευ') {
      middle = 'ε';
      final = 'ευ';
    } else if (middle === 'αυ') {
      middle = 'α';
      final = 'αυ';
    } else if (middle === 'ηυ') {
      middle = 'η';
      final = 'ηυ';
    }

    const initial = match ? match[1] + middle : '';

    middle = middle.toLowerCase();
    final = final.toLowerCase();

    return { initial, middle, final };
  }

  private static charCodeIsGreek(code: number) {
    return 0x370 <= code && code <= 0x3ff;
  }

  private static containsVowel(text: string) {
    return text.match(/[αειουηω]+/i) !== null;
  }
}
