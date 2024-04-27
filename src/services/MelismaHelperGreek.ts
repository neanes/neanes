export interface MelismaSyllables {
  middle: string;
  final: string;
}

export class MelismaHelperGreek {
  public static isGreek(text: string) {
    for (let i = 0; i < text.length; i++) {
      if (0x370 <= text.charCodeAt(i) && text.charCodeAt(i) <= 0x3ff) {
        return true;
      }
    }
  }

  public static getMelismaSyllable(text: string): MelismaSyllables {
    //const match = text.match(/[αειουηω](?!.*[αειουηω])/i);
    const match = text.match(/([αειουηω]+)[^αειουηω]*$/i);

    let middle = match ? match[1] : '';
    let final = match ? match[0] : '';

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

    return { middle, final };
  }
}
