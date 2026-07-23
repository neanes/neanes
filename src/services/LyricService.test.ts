import { readFile } from 'fs/promises';
import { describe, expect, it } from 'vitest';

import type { ScoreElement } from '../models/Element';
import {
  AcceptsLyricsOption,
  DropCapElement,
  ElementType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  TempoElement,
  TextBoxElement,
} from '../models/Element';
import { QuantitativeNeume, Tie } from '../models/Neumes';
import { MelismaStyle } from '../models/PageSetup';
import {
  extractLyricLetters,
  findMelismaFinalNote,
  getMelismaRunMiddle,
  LyricService,
} from './LyricService';
import { MelismaHelperGreek } from './MelismaHelperGreek';
import { SaveService } from './SaveService';

describe('LyricService (English)', () => {
  it('should extract single word', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('test');
  });

  it('should extract two words', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('one'));
    scoreElements.push(createNote('two'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('one two');
  });

  it('should extract hyphenated word 2 syllables', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('ing'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('test-ing');
  });

  it('should extract hyphenated word 3 syllables', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('tes', true, true, true));
    scoreElements.push(createNote('ti', true, true, true));
    scoreElements.push(createNote('fy'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('tes-ti-fy');
  });

  it('should extract hyphenated word 2 syllables with middle melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('', true, false, true));
    scoreElements.push(createNote('ing'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('test--ing');
  });

  it('should extract melisma lasting 2 notes', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true));
    scoreElements.push(createNote('', true, false));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('test__');
  });

  it('should extract melisma lasting 3-notes', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true));
    scoreElements.push(createNote('', true, false));
    scoreElements.push(createNote('', true, false));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('test___');
  });

  it('should extract hyphenated word with melisma at end', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('ing', true, true));
    scoreElements.push(createNote('', true, false));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('test-ing__');
  });

  it('should extract word after melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('one', true, true));
    scoreElements.push(createNote('', true, false));
    scoreElements.push(createNote('two'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('one__ two');
  });

  it('should round trip (default)', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    for (let i = 0; i < 11; i++) {
      scoreElements.push(new NoteElement());
    }

    const lyrics = 'test-ing__ test--ing one two three___';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual(lyrics);
  });

  it('should round trip (melisma-only)', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    for (let i = 0; i < 11; i++) {
      scoreElements.push(new NoteElement());
    }

    (scoreElements[2] as NoteElement).acceptsLyrics =
      AcceptsLyricsOption.MelismaOnly;
    (scoreElements[4] as NoteElement).acceptsLyrics =
      AcceptsLyricsOption.MelismaOnly;
    (scoreElements[9] as NoteElement).acceptsLyrics =
      AcceptsLyricsOption.MelismaOnly;
    (scoreElements[10] as NoteElement).acceptsLyrics =
      AcceptsLyricsOption.MelismaOnly;

    const lyrics = 'test-ing test-ing one two three';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual(lyrics);
  });

  it('should canonicalize a lyric stream that the score already represents', () => {
    const lyricService = new LyricService();
    const dropCap = new DropCapElement();
    dropCap.content = 'Ἀ';
    const first = createNote('κριέψου', true, true, true);
    const continuation = createNote('', true, false, false, 'ου');
    const final = createNote('ουν');
    const martyria = new MartyriaElement();
    const scoreElements: ScoreElement[] = [
      dropCap,
      first,
      martyria,
      continuation,
      final,
    ];
    const lyrics = lyricService.extractLyrics(
      scoreElements,
      MelismaStyle.Vocalic,
    );
    const before = snapshotNotes([first, continuation, final]);

    // assignLyrics is a canonicalizing operation even when `lyrics` came from
    // these elements. The first assignment may normalize their internal
    // distribution; the second must be a true fixed point with no updates.
    const assign = () =>
      assignTestLyrics(
        lyricService,
        lyrics,
        scoreElements,
        MelismaStyle.Vocalic,
        (element, content) => {
          element.content = content;
        },
      );

    expect(assign()).toBeGreaterThan(0);
    expect(dropCap.content).toEqual('Ἀ');
    expect(snapshotNotes([first, continuation, final])).not.toEqual(before);

    const canonical = snapshotNotes([first, continuation, final]);

    expect(assign()).toEqual(0);
    expect(snapshotNotes([first, continuation, final])).toEqual(canonical);
  });

  it('should create a prosomia', async () => {
    const lyricService = new LyricService();

    const jsonInput = await readFile(
      `${__dirname}/../../tests/data/prosomoia1_input.byzx`,
      'utf8',
    );

    const scoreInput = SaveService.LoadScoreFromJson(JSON.parse(jsonInput));

    const newLyrics =
      "With what fair crowns of praise shall we crown the di-vine and all-laud-a-ble hier-arch? That clear trum-pet sound-ing the-ol-o-gy, the mouth of grace that doth breathe forth fire, the ven'-ra-ble ves-sel of the Spir-it, the might-y un-shak-en pil-lar of the Church of Christ, the great and ex-ceed-ing glad-ness of the world en-tire, the might-y riv-er of wis-dom of God's in-spi-ra-tion, and the lamp of the di-vine light, the bright and far-shin-ing star that mak-eth cre-a-tion ra-di-ant.";

    assignTestLyrics(
      lyricService,
      newLyrics,
      scoreInput.staff.elements,
      MelismaStyle.Auto,
    );

    // First make sure the lyrics round trip
    expect(
      lyricService.extractLyrics(scoreInput.staff.elements, MelismaStyle.Auto),
    ).toEqual(newLyrics);

    // Next match the snapshot
    expect(
      scoreInput.staff.elements
        .filter((x) =>
          [ElementType.Note, ElementType.DropCap].includes(x.elementType),
        )
        .map((x) =>
          x.elementType === ElementType.Note
            ? {
                lyrics: (x as NoteElement).lyrics,
                isMelisma: (x as NoteElement).isMelisma,
                isMelismaStart: (x as NoteElement).isMelismaStart,
                isHyphen: (x as NoteElement).isHyphen,
              }
            : { content: (x as DropCapElement).content },
        ),
    ).toMatchSnapshot();
  });

  it('should assign running elafron correctly', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    const ison1 = new NoteElement();
    ison1.quantitativeNeume = QuantitativeNeume.Ison;

    const runningElafron1 = new NoteElement();
    runningElafron1.quantitativeNeume = QuantitativeNeume.RunningElaphron;

    const ison2 = new NoteElement();
    ison2.quantitativeNeume = QuantitativeNeume.Ison;

    const runningElafron2 = new NoteElement();
    runningElafron2.quantitativeNeume = QuantitativeNeume.RunningElaphron;

    scoreElements.push(ison1);
    scoreElements.push(runningElafron1);
    scoreElements.push(ison2);
    scoreElements.push(runningElafron2);

    const lyrics = 'test-ing one two';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    expect(ison1.lyrics).toEqual('test');
    expect(ison1.isMelisma).toEqual(true);
    expect(ison1.isMelismaStart).toEqual(true);
    expect(ison1.isHyphen).toEqual(true);
    expect(runningElafron1.lyrics).toEqual('ing');
    expect(runningElafron1.isMelisma).toEqual(false);
    expect(runningElafron1.isMelismaStart).toEqual(false);
    expect(runningElafron1.isHyphen).toEqual(false);

    expect(ison2.lyrics).toEqual('one');
    expect(ison2.isMelisma).toEqual(true);
    expect(ison2.isMelismaStart).toEqual(true);
    expect(ison2.isHyphen).toEqual(false);
    expect(runningElafron2.lyrics).toEqual('two');
    expect(runningElafron2.isMelisma).toEqual(false);
    expect(runningElafron2.isMelismaStart).toEqual(false);
    expect(runningElafron2.isHyphen).toEqual(false);
  });
});

describe('LyricService (Greek)', () => {
  it('should extract single word', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('των'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('των');
  });

  it('should extract two words', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('των'));
    scoreElements.push(createNote('γαρ'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('των γαρ');
  });

  it('should extract melisma CV', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true));
    scoreElements.push(createNote('', true, false));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('τω__');
  });

  it('should extract hyphenated CVC', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, true));
    scoreElements.push(createNote('ων'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('των__');
  });

  it('should extract melisma CVC with melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, true));
    scoreElements.push(createNote('', true, true, true, 'ω'));
    scoreElements.push(createNote('ων'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('των___');
  });

  it('should extract word after melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, false));
    scoreElements.push(createNote('', true, false, false, 'ω'));
    scoreElements.push(createNote('ων'));

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('τω__ ων');
  });

  it('should round trip (default)', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());

    const lyrics = 'Κα τευ θυν θη___ τω γαρ___';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    // The layout service should assign melismaText so we do that here.
    // This process should probably be improved to be more testable.
    (scoreElements[8] as NoteElement).melismaText = 'α';

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual(lyrics);
  });

  it('should round trip (melisma-only)', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());
    scoreElements.push(new NoteElement());

    (scoreElements[4] as NoteElement).acceptsLyrics =
      AcceptsLyricsOption.MelismaOnly;
    (scoreElements[5] as NoteElement).acceptsLyrics =
      AcceptsLyricsOption.MelismaOnly;

    (scoreElements[8] as NoteElement).acceptsLyrics =
      AcceptsLyricsOption.MelismaOnly;
    (scoreElements[9] as NoteElement).acceptsLyrics =
      AcceptsLyricsOption.MelismaOnly;

    const lyrics = 'Κα τευ θυν θη τω γαρ';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual(lyrics);
  });
});

describe('LyricService (Melisma Style)', () => {
  it('should keep Latin Auto lyrics on western melismas', () => {
    const lyricService = new LyricService();
    const scoreElements = [new NoteElement(), new NoteElement()];
    const lyrics = 'rul__';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    expect(scoreElements[0].lyrics).toEqual('rul');
    expect(scoreElements[0].isHyphen).toEqual(false);
    expect(scoreElements[1].lyrics).toEqual('');
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual(lyrics);
  });

  it('should force Greek text to western literal behavior', () => {
    const lyricService = new LyricService();
    const scoreElements = [new NoteElement(), new NoteElement()];
    const lyrics = 'των__';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Western);

    expect(scoreElements[0].lyrics).toEqual('των');
    expect(scoreElements[0].isHyphen).toEqual(false);
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Western),
    ).toEqual(lyrics);
  });

  it('should round trip western Greek hyphenation with melismatic extenders', () => {
    const lyricService = new LyricService();
    const lyrics = 'Eις πολ--λα________ ε-----τη___ Δε------σπο---τα___';
    const noteCount = Array.from(lyrics).filter(
      (character) => character === '-' || character === '_',
    ).length;
    const scoreElements = Array.from(
      { length: noteCount + 1 },
      () => new NoteElement(),
    );

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Western);

    expect(getDisplayedLyrics(scoreElements, MelismaStyle.Western)).toEqual([
      'Eις',
      'πολ',
      'λα',
      'ε',
      'τη',
      'Δε',
      'σπο',
      'τα',
    ]);
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Western),
    ).toEqual(lyrics);
  });

  it('should assign Romanian final-vowel melismas when Latin text is Vocalic', () => {
    const lyricService = new LyricService();

    for (const [text, initial, middle, final] of [
      ['tea', 'tea', 'a', 'a'],
      ['greu', 'gre', 'e', 'eu'],
      ['scriu', 'scri', 'i', 'iu'],
      ['oai', 'oa', 'a', 'ai'],
      ['ioa', 'ioa', 'a', 'a'],
      ['toa', 'toa', 'a', 'a'],
      ['grea', 'grea', 'a', 'a'],
      ['mea', 'mea', 'a', 'a'],
      ['rea', 'rea', 'a', 'a'],
      ['gă', 'gă', 'ă', 'ă'],
      ['cân', 'câ', 'â', 'ân'],
      ['rul', 'ru', 'u', 'ul'],
      ['în', 'î', 'î', 'în'],
      ['du', 'du', 'u', 'u'],
    ]) {
      const scoreElements = [new NoteElement(), new NoteElement()];

      assignTestLyrics(
        lyricService,
        `${text}__`,
        scoreElements,
        MelismaStyle.Vocalic,
      );

      expect(scoreElements[0].lyrics).toEqual(initial);
      expect(scoreElements[0].isHyphen).toEqual(middle !== final);
      expect(scoreElements[1].lyrics).toEqual(middle === final ? '' : final);
      expect(
        lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
      ).toEqual(`${text}__`);
    }
  });

  it('should assign Romanian falling diphthong melismas when Latin text is Vocalic', () => {
    const lyricService = new LyricService();

    for (const [text, initial, final] of [
      ['mai', 'ma', 'ai'],
      ['hăi', 'hă', 'ăi'],
      ['îi', 'î', 'îi'],
      ['mâi', 'mâ', 'âi'],
      ['lei', 'le', 'ei'],
      ['fii', 'fi', 'ii'],
      ['noi', 'no', 'oi'],
      ['lui', 'lu', 'ui'],
      ['sau', 'sa', 'au'],
      ['rău', 'ră', 'ău'],
      ['grâu', 'grâ', 'âu'],
      ['meu', 'me', 'eu'],
      ['fiu', 'fi', 'iu'],
      ['ou', 'o', 'ou'],
    ]) {
      const scoreElements = createVocalicNotes(2);

      assignTestLyrics(
        lyricService,
        `${text}__`,
        scoreElements,
        MelismaStyle.Vocalic,
      );

      expect(scoreElements[0].lyrics).toEqual(initial);
      expect(scoreElements[0].isHyphen).toEqual(true);
      expect(scoreElements[1].lyrics).toEqual(final);
      expect(
        lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
      ).toEqual(`${text}__`);
    }
  });

  it('should assign Romanian triphthong melismas when Latin text is Vocalic', () => {
    const lyricService = new LyricService();

    for (const [text, initial, final] of [
      ['vreau', 'vrea', 'au'],
      ['beau', 'bea', 'au'],
    ]) {
      const scoreElements = createVocalicNotes(2);

      assignTestLyrics(
        lyricService,
        `${text}__`,
        scoreElements,
        MelismaStyle.Vocalic,
      );

      expect(scoreElements[0].lyrics).toEqual(initial);
      expect(scoreElements[0].isHyphen).toEqual(true);
      expect(scoreElements[1].lyrics).toEqual(final);
      expect(
        lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
      ).toEqual(`${text}__`);
    }
  });

  it('should assign Romanian devocalized-final-i melismas when Latin text is Vocalic', () => {
    const lyricService = new LyricService();

    for (const [text, initial, final] of [
      ['pomi', 'po', 'omi'],
      ['sfinți', 'sfi', 'inți'],
      ['vechi', 've', 'echi'],
      ['ochi', 'o', 'ochi'],
    ]) {
      const scoreElements = createVocalicNotes(2);

      assignTestLyrics(
        lyricService,
        `${text}__`,
        scoreElements,
        MelismaStyle.Vocalic,
      );

      expect(scoreElements[0].lyrics).toEqual(initial);
      expect(scoreElements[0].isHyphen).toEqual(true);
      expect(scoreElements[1].lyrics).toEqual(final);
      expect(
        lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
      ).toEqual(`${text}__`);
    }
  });

  it('should assign Romanian graphic-letter melismas when Latin text is Vocalic', () => {
    const lyricService = new LyricService();

    for (const [text, initial, final] of [
      ['ceas', 'cea', 'as'],
      ['geam', 'gea', 'am'],
      ['cheag', 'chea', 'ag'],
      ['ciur', 'ciu', 'ur'],
      ['giul', 'giu', 'ul'],
    ]) {
      const scoreElements = createVocalicNotes(2);

      assignTestLyrics(
        lyricService,
        `${text}__`,
        scoreElements,
        MelismaStyle.Vocalic,
      );

      expect(scoreElements[0].lyrics).toEqual(initial);
      expect(scoreElements[0].isHyphen).toEqual(true);
      expect(scoreElements[1].lyrics).toEqual(final);
      expect(
        lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
      ).toEqual(`${text}__`);
    }
  });

  it('should assign Romanian graphic-i final-vowel melismas when Latin text is Vocalic', () => {
    const lyricService = new LyricService();

    for (const text of ['ciu', 'giu', 'chiu', 'ghiu']) {
      const scoreElements = createVocalicNotes(2);

      assignTestLyrics(
        lyricService,
        `${text}__`,
        scoreElements,
        MelismaStyle.Vocalic,
      );

      expect(scoreElements[0].lyrics).toEqual(text);
      expect(scoreElements[0].isHyphen).toEqual(false);
      expect(scoreElements[1].lyrics).toEqual('');
      expect(
        lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
      ).toEqual(`${text}__`);
    }
  });

  it('should assign repeated Romanian vocalic melismas when Latin text is Vocalic', () => {
    const lyricService = new LyricService();

    for (const [lyrics, noteCount, expectedDisplay] of [
      ['greu___', 3, ['gre', 'e', 'eu']],
      ['scriu___', 3, ['scri', 'i', 'iu']],
      [
        'le---oai---că___',
        9,
        ['le', 'e', 'e', 'oa', 'a', 'ai', 'că', 'ă', 'ă'],
      ],
      [
        'cre---ioa---ne___',
        9,
        ['cre', 'e', 'e', 'ioa', 'a', 'a', 'ne', 'e', 'e'],
      ],
      [
        'În---țe---le---gă---toa---re___',
        18,
        [
          'Î',
          'î',
          'în',
          'țe',
          'e',
          'e',
          'le',
          'e',
          'e',
          'gă',
          'ă',
          'ă',
          'toa',
          'a',
          'a',
          're',
          'e',
          'e',
        ],
      ],
      [
        'lu---meas---că___',
        9,
        ['lu', 'u', 'u', 'mea', 'a', 'as', 'că', 'ă', 'ă'],
      ],
      [
        'În---ge---rul___',
        9,
        ['Î', 'î', 'în', 'ge', 'e', 'e', 'ru', 'u', 'ul'],
      ],
      [
        'ple---cân---du---se___',
        12,
        ['ple', 'e', 'e', 'câ', 'â', 'ân', 'du', 'u', 'u', 'se', 'e', 'e'],
      ],
      ['giul---giu___', 6, ['giu', 'u', 'ul', 'giu', 'u', 'u']],
      ['ce---riul___', 6, ['ce', 'e', 'e', 'riu', 'u', 'ul']],
      ['Fiul___', 3, ['Fiu', 'u', 'ul']],
      ['glaui___', 3, ['glau', 'u', 'ui']],
    ] as const) {
      const scoreElements = createVocalicNotes(noteCount);

      assignTestLyrics(
        lyricService,
        lyrics,
        scoreElements,
        MelismaStyle.Vocalic,
      );

      expect(getDisplayedLyrics(scoreElements, MelismaStyle.Vocalic)).toEqual(
        expectedDisplay,
      );
      expect(scoreElements[0].lyrics).toEqual(expectedDisplay[0]);

      const extracted = lyricService.extractLyrics(
        scoreElements,
        MelismaStyle.Vocalic,
      );
      const roundTripElements = createVocalicNotes(noteCount);

      assignTestLyrics(
        lyricService,
        extracted,
        roundTripElements,
        MelismaStyle.Vocalic,
      );

      expect(
        getDisplayedLyrics(roundTripElements, MelismaStyle.Vocalic),
      ).toEqual(expectedDisplay);
      expect(roundTripElements[0].lyrics).toEqual(expectedDisplay[0]);
    }
  });

  it('should apply global Vocalic style across a melisma run', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];

    // Five underscores spread the vocalic melisma across all five notes.
    assignTestLyrics(
      lyricService,
      'greu_____',
      scoreElements,
      MelismaStyle.Vocalic,
    );

    expect(scoreElements[0].lyrics).toEqual('gre');
    expect(scoreElements[4].lyrics).toEqual('eu');
  });

  it('should end a vocalic melisma run when notes trail the lyrics', () => {
    const lyricService = new LyricService();

    // The run is three notes (`scriu___`), but the score has more notes than
    // the lyrics fill. The final form must close the run at its last note,
    // not get pushed onto the final note of the score.
    const scoreElements = createVocalicNotes(8);

    assignTestLyrics(
      lyricService,
      'scriu___',
      scoreElements,
      MelismaStyle.Vocalic,
    );

    expect(getDisplayedLyrics(scoreElements, MelismaStyle.Vocalic)).toEqual([
      'scri',
      'i',
      'iu',
    ]);
    expect(scoreElements.slice(3).every((note) => note.lyrics === '')).toBe(
      true,
    );
    expect(scoreElements.slice(3).some((note) => note.isMelisma)).toBe(false);
  });

  it('should not emit trailing empty-note placeholders', () => {
    const lyricService = new LyricService();

    // A melisma run followed by trailing empty notes must extract to just the
    // run; the trailing notes are implied (the lyrics simply run out).
    const scoreElements = createVocalicNotes(8);

    assignTestLyrics(
      lyricService,
      'scriu_______',
      scoreElements,
      MelismaStyle.Vocalic,
    );

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
    ).toEqual('scriu_______');
  });

  it('should keep a melisma run unchanged across a style change with trailing notes', () => {
    const lyricService = new LyricService();

    // Reproduces the off-by-one: a vocalic run with a trailing empty note,
    // re-derived under the previous style and re-assigned under the new style,
    // must not grow by a note.
    const notes = createVocalicNotes(8);
    assignTestLyrics(lyricService, 'scriu_______', notes, MelismaStyle.Vocalic);

    const source = lyricService.extractLyrics(notes, MelismaStyle.Vocalic);
    expect(source).toEqual('scriu_______');
    assignTestLyrics(lyricService, source, notes, MelismaStyle.Western);

    // The seventh note still ends the run; the eighth note stays empty.
    expect(notes[6].isMelisma).toBe(true);
    expect(notes[7].isMelisma).toBe(false);
    expect(notes[7].lyrics).toEqual('');
    expect(lyricService.extractLyrics(notes, MelismaStyle.Western)).toEqual(
      'scriu_______',
    );
  });

  it('should round trip an interior Greek CVC melisma across a style change', () => {
    const lyricService = new LyricService();

    // Reproduces the corruption reported when switching a western Greek score to
    // Auto/Vocalic and back: an interior melismatic syllable that ends in a
    // consonant and is followed by another syllable of the same word (e.g. the
    // "παρ" of "επαρσις", written "ε--παρ--σις"). The vocalic model stores the
    // syllable as a "πα" start plus an "αρ" final-form note; extraction must
    // recover "παρ" rather than splitting it into "πα-αρ".
    const source = 'ε--παρ--σις';
    const notes = createVocalicNotes(8);
    assignTestLyrics(lyricService, source, notes, MelismaStyle.Western);

    // Switch to Auto: extract under the old style, re-assign under the new one,
    // then re-extract for the Lyrics pane. The pane text must not drift.
    const toAuto = lyricService.extractLyrics(notes, MelismaStyle.Western);
    assignTestLyrics(lyricService, toAuto, notes, MelismaStyle.Auto);
    expect(lyricService.extractLyrics(notes, MelismaStyle.Auto)).toEqual(
      source,
    );

    // Switch back to Western: still no drift.
    const toWestern = lyricService.extractLyrics(notes, MelismaStyle.Auto);
    assignTestLyrics(lyricService, toWestern, notes, MelismaStyle.Western);
    expect(lyricService.extractLyrics(notes, MelismaStyle.Western)).toEqual(
      source,
    );
  });

  it('should round trip a vocalic melisma whose run passes through a MelismaOnly note', () => {
    const lyricService = new LyricService();

    // Reproduces the corruption seen when a melismatic syllable is sung over a
    // MelismaOnly note (e.g. a Kentemata) that leaves no mark in the extracted
    // text. Both an open syllable ("Σω-μα", which round-trips correctly) and a
    // consonant-ending syllable ("των-μυ") must survive a Western -> Auto ->
    // Western cycle without the hyphen connection being lost.
    for (const word of ['Σω-μα', 'των-μυ', 'δο-ξα']) {
      // Build the Western model: syllable + a MelismaOnly (Kentemata) note +
      // syllable. The Kentemata is invisible in the text, so the source is a
      // single hyphen even though there is a melisma note between the syllables.
      const [first, second] = word.split('-');
      const start = createNote(first, true, true, true);
      const kentemata = createNote('', true, false, true);
      kentemata.quantitativeNeume = QuantitativeNeume.Kentemata;
      const last = createNote(second);
      const notes = [start, kentemata, last];

      const baseline = snapshotNotes(notes);

      // Western -> Auto: the pane text and model must be stable.
      assignTestLyrics(
        lyricService,
        lyricService.extractLyrics(notes, MelismaStyle.Western),
        notes,
        MelismaStyle.Auto,
      );
      expect(lyricService.extractLyrics(notes, MelismaStyle.Auto)).toEqual(
        word,
      );

      // Auto -> Western: the original model is restored exactly.
      assignTestLyrics(
        lyricService,
        lyricService.extractLyrics(notes, MelismaStyle.Auto),
        notes,
        MelismaStyle.Western,
      );
      expect(lyricService.extractLyrics(notes, MelismaStyle.Western)).toEqual(
        word,
      );
      expect(snapshotNotes(notes)).toEqual(baseline);
    }
  });

  it('should round trip a Romanian vowel-cluster vocalic melisma across a style change', () => {
    const lyricService = new LyricService();

    // The start note stores the syllable's "initial", which can re-analyze to a
    // different middle vowel for Romanian falling diphthongs/triphthongs:
    // "glaui" -> "glau" (gives "a" instead of "u"), "saii"/"vaii" -> "sai"/"vai"
    // (gives "a" instead of "i"). Extraction must still recover the original
    // syllable using the vowel shared by the initial and the final form.
    // [word, note count]. A word-final vocalic melisma spread over the notes.
    for (const [word, noteCount] of [
      ['glaui', 3],
      ['saii', 3],
      ['vaii', 2],
      ['creii', 2],
    ] as const) {
      const notes = createVocalicNotes(noteCount);

      // Build the canonical Western model by assigning the word followed by
      // enough underscores to fill every note.
      assignTestLyrics(
        lyricService,
        `${word}${'_'.repeat(noteCount)}`,
        notes,
        MelismaStyle.Western,
      );
      const baseline = snapshotNotes(notes);
      const westernPane = lyricService.extractLyrics(
        notes,
        MelismaStyle.Western,
      );

      // Western -> Vocalic and back: model and pane must be restored.
      assignTestLyrics(lyricService, westernPane, notes, MelismaStyle.Vocalic);
      const vocalicPane = lyricService.extractLyrics(
        notes,
        MelismaStyle.Vocalic,
      );
      assignTestLyrics(lyricService, vocalicPane, notes, MelismaStyle.Vocalic);
      expect(lyricService.extractLyrics(notes, MelismaStyle.Vocalic)).toEqual(
        vocalicPane,
      );

      assignTestLyrics(lyricService, vocalicPane, notes, MelismaStyle.Western);
      expect(lyricService.extractLyrics(notes, MelismaStyle.Western)).toEqual(
        westernPane,
      );
      expect(snapshotNotes(notes)).toEqual(baseline);
    }
  });

  it('should not desync lyrics around a stray MelismaOnly note with no melisma', () => {
    const lyricService = new LyricService();

    // A degenerate note that accepts only melismas (e.g. a Kentemata) but is not
    // marked as a melisma. Extraction must not emit a standalone underscore for
    // it: assignment does not consume a token for MelismaOnly notes, so the
    // underscore would shift every following note's lyrics by one.
    const before = createNote('σαν');
    const stray = createNote('');
    stray.quantitativeNeume = QuantitativeNeume.Kentemata; // effective MelismaOnly
    const after1 = createNote('ε');
    const after2 = createNote('δω');
    const notes = [before, stray, after1, after2];

    const extracted = lyricService.extractLyrics(notes, MelismaStyle.Western);
    // No stray underscore, so the words stay aligned with their notes.
    expect(extracted).toEqual('σαν ε δω');

    const roundTrip = [
      createNote('σαν'),
      (() => {
        const n = createNote('');
        n.quantitativeNeume = QuantitativeNeume.Kentemata;
        return n;
      })(),
      createNote('ε'),
      createNote('δω'),
    ];
    assignTestLyrics(lyricService, extracted, roundTrip, MelismaStyle.Western);

    // The following notes keep their lyrics; nothing is shifted by one.
    expect(roundTrip.map((n) => n.lyrics)).toEqual(['σαν', '', 'ε', 'δω']);
    expect(lyricService.extractLyrics(roundTrip, MelismaStyle.Western)).toEqual(
      'σαν ε δω',
    );
  });

  it('should treat a standalone underscore after a melisma as an empty note', () => {
    const lyricService = new LyricService();

    // "test__ _ word": a two-note melisma, then an empty note, then a word.
    // The whitespace-separated underscore must not be absorbed into the melisma.
    const scoreElements = createVocalicNotes(4);

    assignTestLyrics(
      lyricService,
      'test__ _ word',
      scoreElements,
      MelismaStyle.Western,
    );

    expect(scoreElements.map((note) => note.lyrics)).toEqual([
      'test',
      '',
      '',
      'word',
    ]);
    expect(scoreElements.map((note) => note.isMelisma)).toEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Western),
    ).toEqual('test__ _ word');
  });

  it('should keep a whitespace-separated underscore after a vocalic close as an empty note', () => {
    const lyricService = new LyricService();

    // "των _ λογος": a syllable whose melisma closes on a Kentemata, then an
    // intentionally empty note, then a word. The word token "των" consumes
    // the single separating space, so the lookahead must still see the
    // underscore as whitespace-separated: it is the empty note's placeholder,
    // not a continuation of the melisma. The final form must close the run
    // on the Kentemata instead of moving onto the empty note.
    const notes = createVocalicNotes(4);
    notes[1].quantitativeNeume = QuantitativeNeume.Kentemata;

    assignTestLyrics(lyricService, 'των _ λογος', notes, MelismaStyle.Auto);

    expect(notes.map((note) => note.lyrics)).toEqual(['τω', 'ων', '', 'λογος']);
    expect(lyricService.extractLyrics(notes, MelismaStyle.Auto)).toEqual(
      'των _ λογος',
    );
  });

  it('should not consume a whitespace-separated underscore as a carried melisma break', () => {
    const lyricService = new LyricService();

    // Same lyrics, but the run's closing note was explicitly set to
    // MelismaOnly rather than being inherently melisma-only. The
    // consume-break heuristic must not eat the standalone underscore: it
    // belongs to the empty note that follows, and consuming it would shift
    // every later token onto the wrong note.
    const notes = createVocalicNotes(4);
    notes[1].acceptsLyrics = AcceptsLyricsOption.MelismaOnly;

    assignTestLyrics(lyricService, 'των _ λογος', notes, MelismaStyle.Auto);

    expect(notes.map((note) => note.lyrics)).toEqual(['τω', 'ων', '', 'λογος']);
  });

  it('should classify a standalone underscore as an empty note inside an open vocalic run', () => {
    const lyricService = new LyricService();

    // "των_ _ λογος": the standalone underscore is the empty note's
    // placeholder, not a continuation of the first word's melisma. With no
    // continuation to carry the final form, the dangling break on "των_" does
    // not open a vocalic run at all; the syllable stays intact instead of
    // stranding its coda.
    const notes = createVocalicNotes(3);

    assignTestLyrics(lyricService, 'των_ _ λογος', notes, MelismaStyle.Auto);

    expect(notes.map((note) => note.lyrics)).toEqual(['των', '', 'λογος']);
  });

  it('should spread an inline Vocalic melisma typed on a single neume', () => {
    const lyricService = new LyricService();

    for (const [lyrics, noteCount, expectedDisplay] of [
      ['greu___', 3, ['gre', 'e', 'eu']],
      ['scriu___', 3, ['scri', 'i', 'iu']],
    ] as const) {
      const scoreElements = createVocalicNotes(noteCount);

      const updates =
        lyricService.getInlineVocalicMelismaUpdates(
          scoreElements[0],
          lyrics,
          scoreElements,
          false,
          MelismaStyle.Vocalic,
        ) ?? [];

      for (const { note, newValues } of updates) {
        Object.assign(note, newValues);
      }

      expect(getDisplayedLyrics(scoreElements, MelismaStyle.Vocalic)).toEqual(
        expectedDisplay,
      );
      expect(scoreElements[0].lyrics).toEqual(expectedDisplay[0]);
      expect(scoreElements[noteCount - 1].lyrics).toEqual(
        expectedDisplay[expectedDisplay.length - 1],
      );
    }
  });

  it('should stop an inline multi-break melisma at structural elements', () => {
    const lyricService = new LyricService();
    const modeChange = new RichTextBoxElement();
    modeChange.modeChange = true;

    for (const boundary of [
      new ModeKeyElement(),
      new DropCapElement(),
      modeChange,
      new TextBoxElement(),
    ]) {
      const start = createNote('');
      const followingNotes = [createNote('SECOND'), createNote('THIRD')];
      const scoreElements: ScoreElement[] = [
        start,
        boundary,
        ...followingNotes,
      ];

      const updates =
        lyricService.getInlineVocalicMelismaUpdates(
          start,
          'των___',
          scoreElements,
          false,
          MelismaStyle.Auto,
        ) ?? [];

      for (const { note, newValues } of updates) {
        Object.assign(note, newValues);
      }

      expect(start.lyrics).toEqual('των');
      expect(start.isMelisma).toBe(false);
      expect(followingNotes.map((note) => note.lyrics)).toEqual([
        'SECOND',
        'THIRD',
      ]);
    }
  });

  it('should spread an inline multi-break melisma through a martyria', () => {
    const lyricService = new LyricService();
    const notes = createVocalicNotes(3);
    const scoreElements: ScoreElement[] = [
      notes[0],
      new MartyriaElement(),
      notes[1],
      notes[2],
    ];

    const updates =
      lyricService.getInlineVocalicMelismaUpdates(
        notes[0],
        'των___',
        scoreElements,
        false,
        MelismaStyle.Auto,
      ) ?? [];

    for (const { note, newValues } of updates) {
      Object.assign(note, newValues);
    }

    expect(notes.map((note) => note.lyrics)).toEqual(['τω', '', 'ων']);
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('των___');
  });

  it('should spread an inline multi-break melisma through a tempo and an inline text box', () => {
    const lyricService = new LyricService();

    const inlineTextBox = new TextBoxElement();
    inlineTextBox.inline = true;

    for (const transparent of [new TempoElement(), inlineTextBox]) {
      const notes = createVocalicNotes(3);
      const scoreElements: ScoreElement[] = [
        notes[0],
        transparent,
        notes[1],
        notes[2],
      ];

      const updates =
        lyricService.getInlineVocalicMelismaUpdates(
          notes[0],
          'των___',
          scoreElements,
          false,
          MelismaStyle.Auto,
        ) ?? [];

      for (const { note, newValues } of updates) {
        Object.assign(note, newValues);
      }

      expect(notes.map((note) => note.lyrics)).toEqual(['τω', '', 'ων']);
      expect(
        lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
      ).toEqual('των___');
    }
  });

  it('should bake a vocalic final form that lies across a tempo marking', () => {
    const lyricService = new LyricService();
    const notes = [new NoteElement(), new NoteElement(), new NoteElement()];
    const scoreElements: ScoreElement[] = [
      notes[0],
      notes[1],
      new TempoElement(),
      notes[2],
    ];

    assignTestLyrics(
      lyricService,
      'riu--ul',
      scoreElements,
      MelismaStyle.Vocalic,
    );

    assignTestAcceptsLyrics(lyricService, scoreElements, MelismaStyle.Vocalic);

    expect(notes[2].acceptsLyrics).toEqual(AcceptsLyricsOption.MelismaOnly);
  });

  it('should keep the final form when an inline multi-break melisma crosses a MelismaOnly note', () => {
    const lyricService = new LyricService();

    const romanianNotes = createVocalicNotes(3);
    romanianNotes[1].quantitativeNeume = QuantitativeNeume.Kentemata;

    typeInlineLyrics(lyricService, romanianNotes, 0, 'greu___');

    expect(romanianNotes.map((note) => note.lyrics)).toEqual(['gre', '', 'eu']);
    expect(
      lyricService.extractLyrics(romanianNotes, MelismaStyle.Vocalic),
    ).toEqual('greu__');

    const greekNotes = createVocalicNotes(2);
    greekNotes[1].quantitativeNeume = QuantitativeNeume.Kentemata;

    typeInlineLyrics(lyricService, greekNotes, 0, 'των__');

    expect(greekNotes.map((note) => note.lyrics)).toEqual(['τω', 'ων']);
    expect(
      lyricService.extractLyrics(greekNotes, MelismaStyle.Vocalic),
    ).toEqual('των');
  });

  it('should keep an already-correct run unchanged when the identical inline melisma is retyped', () => {
    const lyricService = new LyricService();
    const notes = createVocalicNotes(3);

    typeInlineLyrics(lyricService, notes, 0, 'greu___');

    const before = snapshotNotes(notes);

    typeInlineLyrics(lyricService, notes, 0, 'greu___');

    expect(snapshotNotes(notes)).toEqual(before);
    expect(notes[0].lyrics).toEqual('gre');
  });

  it('should keep the final form when an inline melisma break is typed before a MelismaOnly note', () => {
    const lyricService = new LyricService();

    // ison, kentemata, apostrophos: the user types "Dum-" under the ison and
    // then "-" under the kentemata. The kentemata consumes no token on
    // assignment, so the rebuilt run must not include a break for it;
    // otherwise the dangling break makes the run appear to continue and the
    // syllable's final form ("um") is dropped entirely.
    const notes = createVocalicNotes(3);
    notes[1].quantitativeNeume = QuantitativeNeume.Kentemata;

    // The trailing "_" is the placeholder for the still-empty last note.
    typeInlineLyrics(lyricService, notes, 0, 'Dum-');
    expect(lyricService.extractLyrics(notes, MelismaStyle.Vocalic)).toEqual(
      'Dum-_',
    );

    typeInlineLyrics(lyricService, notes, 1, '-');
    expect(notes.map((note) => note.lyrics)).toEqual(['Du', 'um', '']);
    expect(lyricService.extractLyrics(notes, MelismaStyle.Vocalic)).toEqual(
      'Dum-_',
    );

    typeInlineLyrics(lyricService, notes, 2, 'ne');
    expect(notes.map((note) => note.lyrics)).toEqual(['Du', 'um', 'ne']);
    expect(lyricService.extractLyrics(notes, MelismaStyle.Vocalic)).toEqual(
      'Dum-ne',
    );
  });

  it('should match pane assignment when an inline Greek melisma crosses a Kentemata', () => {
    const lyricService = new LyricService();
    const paneNotes = createVocalicNotes(3);
    paneNotes[1].quantitativeNeume = QuantitativeNeume.Kentemata;

    assignTestLyrics(lyricService, 'μιν__', paneNotes, MelismaStyle.Auto);

    const inlineNotes = createVocalicNotes(3);
    inlineNotes[1].quantitativeNeume = QuantitativeNeume.Kentemata;

    typeInlineLyrics(lyricService, inlineNotes, 0, 'μιν_', MelismaStyle.Auto);
    typeInlineLyrics(lyricService, inlineNotes, 1, '_', MelismaStyle.Auto);

    expect(paneNotes.map((note) => note.lyrics)).toEqual(['μι', '', 'ιν']);
    expect(getDisplayedLyrics(paneNotes)).toEqual(['μι', 'ι', 'ιν']);
    expect(snapshotNotes(inlineNotes)).toEqual(snapshotNotes(paneNotes));
  });

  it('should extend an inline Vocalic melisma across consecutive MelismaOnly notes', () => {
    const lyricService = new LyricService();

    // ison, kentemata, kentemata: each "-" moves the final form to the run's
    // new last note instead of splitting the syllable at the previous final
    // form ("um-" must not re-analyze as its own run and shed the "D").
    const notes = createVocalicNotes(3);
    notes[1].quantitativeNeume = QuantitativeNeume.Kentemata;
    notes[2].quantitativeNeume = QuantitativeNeume.Kentemata;

    typeInlineLyrics(lyricService, notes, 0, 'Dum-');
    typeInlineLyrics(lyricService, notes, 1, '-');
    typeInlineLyrics(lyricService, notes, 2, '-');

    expect(notes.map((note) => note.lyrics)).toEqual(['Du', '', 'um']);
    expect(lyricService.extractLyrics(notes, MelismaStyle.Vocalic)).toEqual(
      'Dum-',
    );
  });

  it('should keep an inline Vocalic melisma connected forward on token-consuming notes', () => {
    const lyricService = new LyricService();

    // All notes accept lyrics. Typing "Dum-" then "-" spreads the syllable
    // with a connecting hyphen on the final form, so the following syllable
    // stays part of the same word.
    const notes = createVocalicNotes(3);

    // The trailing "_" is the placeholder for the still-empty last note.
    typeInlineLyrics(lyricService, notes, 0, 'Dum-');
    typeInlineLyrics(lyricService, notes, 1, '-');
    expect(notes.map((note) => note.lyrics)).toEqual(['Du', 'um', '']);
    expect(notes[1].isHyphen).toEqual(true);
    expect(lyricService.extractLyrics(notes, MelismaStyle.Vocalic)).toEqual(
      'Dum--_',
    );

    typeInlineLyrics(lyricService, notes, 2, 'ne');
    expect(notes.map((note) => note.lyrics)).toEqual(['Du', 'um', 'ne']);
    expect(lyricService.extractLyrics(notes, MelismaStyle.Vocalic)).toEqual(
      'Dum--ne',
    );
  });

  it('should round-trip a Vocalic melisma written with trailing hyphens', () => {
    const lyricService = new LyricService();

    // A trailing hyphen connects the melisma forward (mid-typing state), while
    // trailing underscores end the word; the distinction must survive
    // assignment and extraction.
    const hyphenNotes = createVocalicNotes(2);
    assignTestLyrics(lyricService, 'Dum--', hyphenNotes, MelismaStyle.Vocalic);
    expect(hyphenNotes.map((note) => note.lyrics)).toEqual(['Du', 'um']);
    expect(hyphenNotes[1].isHyphen).toEqual(true);
    expect(
      lyricService.extractLyrics(hyphenNotes, MelismaStyle.Vocalic),
    ).toEqual('Dum--');

    const underscoreNotes = createVocalicNotes(2);
    assignTestLyrics(
      lyricService,
      'Dum__',
      underscoreNotes,
      MelismaStyle.Vocalic,
    );
    expect(underscoreNotes.map((note) => note.lyrics)).toEqual(['Du', 'um']);
    expect(underscoreNotes[1].isHyphen).toEqual(false);
    expect(
      lyricService.extractLyrics(underscoreNotes, MelismaStyle.Vocalic),
    ).toEqual('Dum__');
  });

  it('should not consume the next syllable when typing after a Vocalic run containing a MelismaOnly note', () => {
    const lyricService = new LyricService();

    // ison, kentemata, apostrophos, apostrophos holding a word-final run
    // Du/(u)/um. Typing "ne-" on the next note rebuilds the run with one
    // break per token-consuming note; counting the kentemata too would leave
    // "ne-" dangling and drop it.
    const notes = createVocalicNotes(4);
    notes[1].quantitativeNeume = QuantitativeNeume.Kentemata;
    assignTestLyrics(lyricService, 'Dum__', notes, MelismaStyle.Vocalic);
    expect(notes.map((note) => note.lyrics)).toEqual(['Du', '', 'um', '']);

    // The typed hyphen stays on the note; extraction swallows it only until a
    // following note exists.
    typeInlineLyrics(lyricService, notes, 3, 'ne-');
    expect(notes.map((note) => note.lyrics)).toEqual(['Du', '', 'um', 'ne']);
    expect(notes[3].isHyphen).toEqual(true);
    expect(lyricService.extractLyrics(notes, MelismaStyle.Vocalic)).toEqual(
      'Dum--ne',
    );
  });

  it('should re-derive lyrics when the global melisma style changes', () => {
    const lyricService = new LyricService();

    // Entered under Vocalic, then switched to Auto. The source is re-derived
    // from the notes under the previous (Vocalic) style and re-assigned under
    // the new (Auto) style.
    const vocalicNotes = createVocalicNotes(5);
    assignTestLyrics(
      lyricService,
      'În---ge-rul',
      vocalicNotes,
      MelismaStyle.Vocalic,
    );
    expect(getDisplayedLyrics(vocalicNotes, MelismaStyle.Vocalic)).toEqual([
      'Î',
      'î',
      'în',
      'ge',
      'rul',
    ]);

    const vocalicSource = lyricService.extractLyrics(
      vocalicNotes,
      MelismaStyle.Vocalic,
    );
    expect(vocalicSource).toEqual('În---ge-rul');

    assignTestLyrics(
      lyricService,
      vocalicSource,
      vocalicNotes,
      MelismaStyle.Auto,
    );
    expect(vocalicNotes.map((note) => note.lyrics)).toEqual([
      'În',
      '',
      '',
      'ge',
      'rul',
    ]);

    // Entered under Auto, then switched to Vocalic.
    const autoNotes = createVocalicNotes(5);
    assignTestLyrics(lyricService, 'În---ge-rul', autoNotes, MelismaStyle.Auto);

    const autoSource = lyricService.extractLyrics(autoNotes, MelismaStyle.Auto);
    expect(autoSource).toEqual('În---ge-rul');

    assignTestLyrics(lyricService, autoSource, autoNotes, MelismaStyle.Vocalic);
    expect(getDisplayedLyrics(autoNotes, MelismaStyle.Vocalic)).toEqual([
      'Î',
      'î',
      'în',
      'ge',
      'rul',
    ]);
  });

  it('should round trip Romanian vocalic melismas idempotently', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];

    assignTestLyrics(
      lyricService,
      'rul___ tea__',
      scoreElements,
      MelismaStyle.Vocalic,
    );

    const extracted = lyricService.extractLyrics(
      scoreElements,
      MelismaStyle.Vocalic,
    );
    assignTestLyrics(
      lyricService,
      extracted,
      scoreElements,
      MelismaStyle.Vocalic,
    );

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
    ).toEqual(extracted);
  });

  it('should preserve Greek CVC vocalic melisma structure after baking accepts lyrics', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];

    assignTestLyrics(lyricService, 'των___', scoreElements, MelismaStyle.Auto);

    assignTestAcceptsLyrics(lyricService, scoreElements, MelismaStyle.Auto);

    expect(scoreElements[2].acceptsLyrics).toEqual(
      AcceptsLyricsOption.MelismaOnly,
    );

    assignTestLyrics(lyricService, 'Θε ος', scoreElements, MelismaStyle.Auto);

    expect(scoreElements[2].lyrics).toEqual('');
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual('Θε');
  });

  it('should preserve Romanian CVC vocalic melisma structure after baking accepts lyrics', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];

    assignTestLyrics(
      lyricService,
      'rul___',
      scoreElements,
      MelismaStyle.Vocalic,
    );

    assignTestAcceptsLyrics(lyricService, scoreElements, MelismaStyle.Vocalic);

    expect(scoreElements[2].acceptsLyrics).toEqual(
      AcceptsLyricsOption.MelismaOnly,
    );

    assignTestLyrics(
      lyricService,
      'cân doi',
      scoreElements,
      MelismaStyle.Vocalic,
    );

    expect(scoreElements[2].lyrics).toEqual('ân');
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
    ).toEqual('cân');
  });

  it('should not bake plain Slavonic hyphenation as a vocalic melisma', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];
    const lyrics = 'сла́-ва тебѣ̀';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    assignTestAcceptsLyrics(lyricService, scoreElements, MelismaStyle.Auto);

    expect(scoreElements.map((note) => note.acceptsLyrics)).toEqual([
      AcceptsLyricsOption.Default,
      AcceptsLyricsOption.Default,
      AcceptsLyricsOption.Default,
    ]);

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    expect(scoreElements.map((note) => note.lyrics)).toEqual([
      'сла́',
      'ва',
      'тебѣ̀',
    ]);
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Auto),
    ).toEqual(lyrics);
  });

  it('should not bake plain Romanian hyphenation as a vocalic melisma', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];
    const lyrics = 'cân-tări noi';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Vocalic);

    assignTestAcceptsLyrics(lyricService, scoreElements, MelismaStyle.Vocalic);

    expect(scoreElements.map((note) => note.acceptsLyrics)).toEqual([
      AcceptsLyricsOption.Default,
      AcceptsLyricsOption.Default,
      AcceptsLyricsOption.Default,
    ]);

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Vocalic);

    expect(scoreElements.map((note) => note.lyrics)).toEqual([
      'cân',
      'tări',
      'noi',
    ]);
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
    ).toEqual(lyrics);
  });

  it('should not bake an adjacent vowel-only Romanian syllable as a vocalic melisma final', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];
    const lyrics = 'fi-i-ca';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Vocalic);

    assignTestAcceptsLyrics(lyricService, scoreElements, MelismaStyle.Vocalic);

    expect(scoreElements.map((note) => note.acceptsLyrics)).toEqual([
      AcceptsLyricsOption.Default,
      AcceptsLyricsOption.Default,
      AcceptsLyricsOption.Default,
    ]);

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Vocalic);

    expect(scoreElements.map((note) => note.lyrics)).toEqual(['fi', 'i', 'ca']);
  });

  it('should preserve adjacent vowel-only syllables in extracted lyrics', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];
    const lyrics = 'fi-i-ca';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Vocalic);

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
    ).toEqual(lyrics);
  });

  it('should keep the same lyric mapping when re-assigning after Assign Accepts Lyrics', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];
    const lyrics = 'гла́съ__ ми';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    const before = snapshotNotes(scoreElements);

    assignTestAcceptsLyrics(lyricService, scoreElements, MelismaStyle.Auto);

    // With locked lyrics, the pane text is re-assigned right after the bake;
    // the baked MelismaOnly notes must not change how the text maps to notes.
    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Auto);

    expect(snapshotNotes(scoreElements)).toEqual(before);
  });

  it('should not drop words when re-assigning canonicalized hiatus lyrics after Assign Accepts Lyrics', () => {
    const lyricService = new LyricService();
    const scoreElements = [
      new NoteElement(),
      new NoteElement(),
      new NoteElement(),
    ];

    assignTestLyrics(
      lyricService,
      'fi-ind ca',
      scoreElements,
      MelismaStyle.Vocalic,
    );

    const lyrics = lyricService.extractLyrics(
      scoreElements,
      MelismaStyle.Vocalic,
    );

    expect(lyrics).toEqual('find__ ca');

    const before = snapshotNotes(scoreElements);

    assignTestAcceptsLyrics(lyricService, scoreElements, MelismaStyle.Vocalic);

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Vocalic);

    expect(snapshotNotes(scoreElements)).toEqual(before);
  });

  it('should reassign final forms when style changes from Western to Vocalic', () => {
    const lyricService = new LyricService();
    const scoreElements = [new NoteElement(), new NoteElement()];

    assignTestLyrics(
      lyricService,
      'rul__',
      scoreElements,
      MelismaStyle.Western,
    );

    const extracted = lyricService.extractLyrics(
      scoreElements,
      MelismaStyle.Vocalic,
    );
    assignTestLyrics(
      lyricService,
      extracted,
      scoreElements,
      MelismaStyle.Vocalic,
    );

    expect(scoreElements[0].lyrics).toEqual('ru');
    expect(scoreElements[0].isHyphen).toEqual(true);
    expect(scoreElements[1].lyrics).toEqual('ul');
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
    ).toEqual('rul__');
  });

  it('should derive western and vocalic displays from the same canonical keystrokes', () => {
    const lyricService = new LyricService();

    for (const [
      inputLyrics,
      canonicalLyrics,
      noteCount,
      vocalicDisplay,
      westernDisplay,
    ] of [
      ['greu___', 'greu___', 3, ['gre', 'e', 'eu'], ['greu']],
      ['scriu___', 'scriu___', 3, ['scri', 'i', 'iu'], ['scriu']],
      ['ochi,___', 'ochi,___', 3, ['o', 'o', 'ochi,'], ['ochi,']],
      [
        'le---oai---că___',
        'le---oai---că___',
        9,
        ['le', 'e', 'e', 'oa', 'a', 'ai', 'că', 'ă', 'ă'],
        ['le', 'oai', 'că'],
      ],
      [
        'cre---ioa---ne___',
        'cre---ioa---ne___',
        9,
        ['cre', 'e', 'e', 'ioa', 'a', 'a', 'ne', 'e', 'e'],
        ['cre', 'ioa', 'ne'],
      ],
      [
        'În---țe---le---gă---toa---re___',
        'În---țe---le---gă---toa---re___',
        18,
        [
          'Î',
          'î',
          'în',
          'țe',
          'e',
          'e',
          'le',
          'e',
          'e',
          'gă',
          'ă',
          'ă',
          'toa',
          'a',
          'a',
          're',
          'e',
          'e',
        ],
        ['În', 'țe', 'le', 'gă', 'toa', 're'],
      ],
      [
        'lu---meas---că___',
        'lu---meas---că___',
        9,
        ['lu', 'u', 'u', 'mea', 'a', 'as', 'că', 'ă', 'ă'],
        ['lu', 'meas', 'că'],
      ],
      [
        'În---ge---rul___',
        'În---ge---rul___',
        9,
        ['Î', 'î', 'în', 'ge', 'e', 'e', 'ru', 'u', 'ul'],
        ['În', 'ge', 'rul'],
      ],
    ] as const) {
      const vocalicElements = createVocalicNotes(noteCount);

      assignTestLyrics(
        lyricService,
        inputLyrics,
        vocalicElements,
        MelismaStyle.Vocalic,
      );

      expect(getDisplayedLyrics(vocalicElements, MelismaStyle.Vocalic)).toEqual(
        vocalicDisplay,
      );
      expect(
        lyricService.extractLyrics(vocalicElements, MelismaStyle.Vocalic),
      ).toEqual(canonicalLyrics);

      const westernElements = Array.from(
        { length: noteCount },
        () => new NoteElement(),
      );

      assignTestLyrics(
        lyricService,
        canonicalLyrics,
        westernElements,
        MelismaStyle.Western,
      );

      expect(getDisplayedLyrics(westernElements, MelismaStyle.Western)).toEqual(
        westernDisplay,
      );
      expect(
        lyricService.extractLyrics(westernElements, MelismaStyle.Western),
      ).toEqual(canonicalLyrics);

      const convertedBackElements = createVocalicNotes(noteCount);

      assignTestLyrics(
        lyricService,
        canonicalLyrics,
        convertedBackElements,
        MelismaStyle.Vocalic,
      );

      expect(
        getDisplayedLyrics(convertedBackElements, MelismaStyle.Vocalic),
      ).toEqual(vocalicDisplay);
      expect(
        lyricService.extractLyrics(convertedBackElements, MelismaStyle.Vocalic),
      ).toEqual(canonicalLyrics);
    }
  });
});

describe('LyricService (Church Slavonic)', () => {
  it('should assign Slavonic last-vowel melismas when text is Vocalic', () => {
    const lyricService = new LyricService();

    for (const [text, initial, middle, final] of [
      ['мѧ', 'мѧ', 'ѧ', 'ѧ'],
      ['тѧ̀', 'тѧ̀', 'ѧ', 'ѧ'],
      ['гла́съ', 'гла́', 'а', 'асъ'],
      ['де́нь', 'де́', 'е', 'ень'],
      ['дꙋ́хъ', 'дꙋ́', 'ꙋ', 'ꙋхъ'],
      ['ᲂу҆́мъ', 'ᲂу҆́', 'ᲂу', 'ᲂумъ'],
      ['мои́хъ', 'мои́', 'и', 'ихъ'],
      ['дꙋшѐ', 'дꙋшѐ', 'е', 'е'],
      ['па́ѵелъ', 'па́ѵе', 'е', 'елъ'],
      ['поѝмъ', 'поѝ', 'и', 'имъ'],
    ]) {
      const scoreElements = createVocalicNotes(2);

      assignTestLyrics(
        lyricService,
        `${text}__`,
        scoreElements,
        MelismaStyle.Vocalic,
      );

      const [firstNote, secondNote] = scoreElements;

      expect(firstNote.lyrics).toEqual(initial);
      expect(firstNote.isHyphen).toEqual(middle !== final);
      expect(secondNote.lyrics).toEqual(middle === final ? '' : final);
      expect(
        lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
      ).toEqual(`${text}__`);
    }
  });

  it('should repeat the Slavonic middle vowel across a melisma run', () => {
    const lyricService = new LyricService();

    for (const [lyrics, noteCount, expectedDisplay] of [
      ['гла́съ___', 3, ['гла́', 'а', 'асъ']],
      ['дꙋшѐ___', 3, ['дꙋшѐ', 'е', 'е']],
      ['доу́хъ___', 3, ['доу́', 'оу', 'оухъ']],
      ['ᲂу҆́мъ___', 3, ['ᲂу҆́', 'ᲂу', 'ᲂумъ']],
      ['мои́хъ___', 3, ['мои́', 'и', 'ихъ']],
    ] as const) {
      const scoreElements = createVocalicNotes(noteCount);

      assignTestLyrics(
        lyricService,
        lyrics,
        scoreElements,
        MelismaStyle.Vocalic,
      );

      expect(getDisplayedLyrics(scoreElements, MelismaStyle.Vocalic)).toEqual([
        ...expectedDisplay,
      ]);
      expect(
        lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
      ).toEqual(lyrics);
    }
  });

  it('should derive Slavonic western and vocalic displays from the same canonical keystrokes', () => {
    const lyricService = new LyricService();
    const canonicalLyrics = 'Го́---спо---ди__';
    const noteCount = 8;

    const vocalicElements = createVocalicNotes(noteCount);

    assignTestLyrics(
      lyricService,
      canonicalLyrics,
      vocalicElements,
      MelismaStyle.Vocalic,
    );

    expect(getDisplayedLyrics(vocalicElements, MelismaStyle.Vocalic)).toEqual([
      'Го́',
      'о',
      'о',
      'спо',
      'о',
      'о',
      'ди',
      'и',
    ]);
    expect(
      lyricService.extractLyrics(vocalicElements, MelismaStyle.Vocalic),
    ).toEqual(canonicalLyrics);

    const westernElements = Array.from(
      { length: noteCount },
      () => new NoteElement(),
    );

    assignTestLyrics(
      lyricService,
      canonicalLyrics,
      westernElements,
      MelismaStyle.Western,
    );

    expect(getDisplayedLyrics(westernElements, MelismaStyle.Western)).toEqual([
      'Го́',
      'спо',
      'ди',
    ]);
    expect(
      lyricService.extractLyrics(westernElements, MelismaStyle.Western),
    ).toEqual(canonicalLyrics);
  });

  it('should not merge a following syllable that begins with the run middle vowel', () => {
    // A hyphen melisma is often followed by a syllable that happens to begin
    // with the run's repeated vowel (и-initial word forms are ubiquitous in
    // Church Slavonic). The following syllable must stay distinct rather
    // than be mistaken for the run's final form.
    const lyricService = new LyricService();

    // Underscore-styled following syllable.
    const first = createVocalicNotes(5);
    assignTestLyrics(
      lyricService,
      'просвѣтѝ---и҆сцѣлѝ__',
      first,
      MelismaStyle.Vocalic,
    );
    expect(getDisplayedLyrics(first, MelismaStyle.Vocalic)).toEqual([
      'просвѣтѝ',
      'и',
      'и',
      'и҆сцѣлѝ',
      'и',
    ]);
    expect(lyricService.extractLyrics(first, MelismaStyle.Vocalic)).toEqual(
      'просвѣтѝ---и҆сцѣлѝ__',
    );

    // Hyphen-styled following syllable (a consonant-final word form).
    const second = createVocalicNotes(5);
    assignTestLyrics(
      lyricService,
      'лю́ди---и҆́мꙋтъ__',
      second,
      MelismaStyle.Vocalic,
    );
    expect(getDisplayedLyrics(second, MelismaStyle.Vocalic)).toEqual([
      'лю́ди',
      'и',
      'и',
      'и҆́мꙋ',
      'ꙋтъ',
    ]);
    expect(lyricService.extractLyrics(second, MelismaStyle.Vocalic)).toEqual(
      'лю́ди---и҆́мꙋтъ__',
    );
  });

  it('should still merge a Slavonic chained final form', () => {
    const lyricService = new LyricService();
    const scoreElements = createVocalicNotes(3);

    assignTestLyrics(
      lyricService,
      'по́й--те',
      scoreElements,
      MelismaStyle.Vocalic,
    );

    expect(getDisplayedLyrics(scoreElements, MelismaStyle.Vocalic)).toEqual([
      'по́',
      'ой',
      'те',
    ]);
    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Vocalic),
    ).toEqual('по́й--те');
  });
});

describe('LyricService regression coverage', () => {
  it('should preserve polytonic Greek melismas in NFC and NFD', () => {
    const lyricService = new LyricService();

    for (const word of ['τό', 'τῆς', 'τὸ', 'τῷ', 'ή']) {
      for (const normalization of ['NFC', 'NFD'] as const) {
        const input = `${word.normalize(normalization)}___`;
        const notes = createVocalicNotes(3);

        assignTestLyrics(lyricService, input, notes, MelismaStyle.Auto);

        expect(
          lyricService.extractLyrics(notes, MelismaStyle.Auto).normalize('NFC'),
        ).toEqual(input.normalize('NFC'));
      }
    }
  });

  it('should reach a fixed point when lyrics end before a MelismaOnly note', () => {
    const lyricService = new LyricService();
    const first = new NoteElement();
    first.quantitativeNeume = QuantitativeNeume.Kentemata;
    const middle = new NoteElement();
    middle.quantitativeNeume = QuantitativeNeume.Ison;
    middle.acceptsLyrics = AcceptsLyricsOption.Yes;
    const last = new NoteElement();
    last.quantitativeNeume = QuantitativeNeume.Kentemata;
    const notes = [first, middle, last];

    assignTestLyrics(lyricService, '_', notes, MelismaStyle.Vocalic);
    const firstExtraction = lyricService.extractLyrics(
      notes,
      MelismaStyle.Vocalic,
    );
    const firstState = snapshotNotes(notes);

    assignTestLyrics(
      lyricService,
      firstExtraction,
      notes,
      MelismaStyle.Vocalic,
    );

    expect(lyricService.extractLyrics(notes, MelismaStyle.Vocalic)).toEqual(
      firstExtraction,
    );
    expect(snapshotNotes(notes)).toEqual(firstState);
  });

  it('should not rebuild letters off another note during inline entry', () => {
    const lyricService = new LyricService();
    const notes = [createNote('αδε', true, true), createNote('', true, false)];
    const before = snapshotNotes(notes);

    typeInlineLyrics(lyricService, notes, 1, '_');
    expect(snapshotNotes(notes)).toEqual(before);

    typeInlineLyrics(lyricService, notes, 1, '_');
    expect(snapshotNotes(notes)).toEqual(before);
  });

  it('should rebuild only the current vocalic run during inline entry', () => {
    const lyricService = new LyricService();
    const notes = createVocalicNotes(6);
    assignTestLyrics(
      lyricService,
      'τῷ- гла́съ____ greu',
      notes,
      MelismaStyle.Vocalic,
    );
    assignTestAcceptsLyrics(lyricService, notes, MelismaStyle.Vocalic);

    const beforeLetters = extractedLyricLetters(
      lyricService,
      notes,
      MelismaStyle.Vocalic,
    );
    typeInlineLyrics(lyricService, notes, 1, `${notes[1].lyrics}_`);
    const afterFirst = snapshotNotes(notes);

    expect(
      extractedLyricLetters(lyricService, notes, MelismaStyle.Vocalic),
    ).toEqual(beforeLetters);

    typeInlineLyrics(lyricService, notes, 1, `${notes[1].lyrics}_`);
    expect(snapshotNotes(notes)).toEqual(afterFirst);
  });

  it('should keep an inline edit local on a baked no-lyrics note', () => {
    const lyricService = new LyricService();
    const notes = createVocalicNotes(7);
    assignTestLyrics(lyricService, 'των____ test', notes, MelismaStyle.Vocalic);
    assignTestAcceptsLyrics(lyricService, notes, MelismaStyle.Vocalic);

    const beforeLetters = extractedLyricLetters(
      lyricService,
      notes,
      MelismaStyle.Vocalic,
    );
    typeInlineLyrics(lyricService, notes, 6, '_');
    const afterFirst = snapshotNotes(notes);

    expect(
      extractedLyricLetters(lyricService, notes, MelismaStyle.Vocalic),
    ).toEqual(beforeLetters);

    typeInlineLyrics(lyricService, notes, 6, '_');
    expect(snapshotNotes(notes)).toEqual(afterFirst);
  });

  it('should not toggle a vocalic final form when its marker is retyped', () => {
    const lyricService = new LyricService();
    const notes = createVocalicNotes(3);

    typeInlineLyrics(lyricService, notes, 0, 'των-');
    typeInlineLyrics(lyricService, notes, 1, '_');
    const afterFirst = snapshotNotes(notes);

    typeInlineLyrics(lyricService, notes, 1, '_');

    expect(snapshotNotes(notes)).toEqual(afterFirst);
    expect(
      extractedLyricLetters(lyricService, notes, MelismaStyle.Auto),
    ).toEqual('των');
  });

  it('should not duplicate a vocalic final form when a break is appended', () => {
    const lyricService = new LyricService();
    const notes = createVocalicNotes(3);
    assignTestLyrics(lyricService, 'των--', notes, MelismaStyle.Auto);
    const beforeLetters = extractedLyricLetters(
      lyricService,
      notes,
      MelismaStyle.Auto,
    );

    typeInlineLyrics(lyricService, notes, 1, `${notes[1].lyrics}_`);
    const afterFirst = snapshotNotes(notes);

    expect(
      extractedLyricLetters(lyricService, notes, MelismaStyle.Auto),
    ).toEqual(beforeLetters);

    typeInlineLyrics(lyricService, notes, 1, `${notes[1].lyrics}_`);
    expect(snapshotNotes(notes)).toEqual(afterFirst);
  });

  it('should preserve sung letters when a baked continuation marker changes', () => {
    const lyricService = new LyricService();
    const start = createNote('гла́', true, true, true, 'а');
    const continuation = createNote('', true, false, true, 'а');
    continuation.acceptsLyrics = AcceptsLyricsOption.MelismaOnly;
    const final = createNote('асъ');
    const notes = [start, continuation, final];
    const beforeLetters = extractedLyricLetters(
      lyricService,
      notes,
      MelismaStyle.Auto,
    );

    typeInlineLyrics(lyricService, notes, 1, '_', MelismaStyle.Auto);
    const afterFirst = snapshotNotes(notes);

    expect(
      extractedLyricLetters(lyricService, notes, MelismaStyle.Auto),
    ).toEqual(beforeLetters);

    typeInlineLyrics(lyricService, notes, 1, '_', MelismaStyle.Auto);
    expect(snapshotNotes(notes)).toEqual(afterFirst);

    const extracted = lyricService.extractLyrics(notes, MelismaStyle.Auto);
    assignTestLyrics(lyricService, extracted, notes, MelismaStyle.Auto);
    const canonical = snapshotNotes(notes);

    expect(canonical).not.toEqual(afterFirst);
    expect(
      extractedLyricLetters(lyricService, notes, MelismaStyle.Auto),
    ).toEqual(beforeLetters);
    expect(
      assignTestLyrics(
        lyricService,
        lyricService.extractLyrics(notes, MelismaStyle.Auto),
        notes,
        MelismaStyle.Auto,
      ),
    ).toEqual(0);
    expect(snapshotNotes(notes)).toEqual(canonical);
  });

  it('should canonicalize an Auto vocalic edit across a martyria and pane assignment', () => {
    const lyricService = new LyricService();
    const notes = createVocalicNotes(3);
    const martyria = new MartyriaElement();
    const elements: ScoreElement[] = [notes[0], martyria, notes[1], notes[2]];
    assignTestLyrics(lyricService, 'αγριέψουν_', elements, MelismaStyle.Auto);
    typeInlineLyrics(
      lyricService,
      elements,
      0,
      'αγριέψουν_',
      MelismaStyle.Auto,
    );
    const afterInline = snapshotNotes(notes);
    const typedLetters = extractLyricLetters('αγριέψουν');

    expect(
      extractedLyricLetters(lyricService, elements, MelismaStyle.Auto),
    ).toEqual(typedLetters);

    typeInlineLyrics(
      lyricService,
      elements,
      0,
      'αγριέψουν_',
      MelismaStyle.Auto,
    );
    expect(snapshotNotes(notes)).toEqual(afterInline);

    const extracted = lyricService.extractLyrics(elements, MelismaStyle.Auto);
    assignTestLyrics(lyricService, extracted, elements, MelismaStyle.Auto);
    const canonical = snapshotNotes(notes);

    expect(canonical).not.toEqual(afterInline);
    expect(
      extractedLyricLetters(lyricService, elements, MelismaStyle.Auto),
    ).toEqual(typedLetters);
    expect(
      assignTestLyrics(
        lyricService,
        lyricService.extractLyrics(elements, MelismaStyle.Auto),
        elements,
        MelismaStyle.Auto,
      ),
    ).toEqual(0);
    expect(snapshotNotes(notes)).toEqual(canonical);
  });

  it('should not oscillate when a multi-break inline melisma is retyped', () => {
    const lyricService = new LyricService();
    const first = createNote('δεσπό', true, true, true);
    const kentemata = createNote('', true, false, true, 'ο');
    kentemata.quantitativeNeume = QuantitativeNeume.Kentemata;
    const target = createNote('ζεις');
    const spare = new NoteElement();
    const secondKentemata = createNote('', true, false);
    secondKentemata.quantitativeNeume = QuantitativeNeume.Kentemata;
    const tied = new NoteElement();
    tied.acceptsLyrics = AcceptsLyricsOption.Yes;
    tied.tie = Tie.YfenAbove;
    const elements: ScoreElement[] = [
      first,
      kentemata,
      target,
      spare,
      secondKentemata,
      new NoteElement(),
      new TextBoxElement(),
      tied,
      new TextBoxElement(),
    ];

    typeInlineLyrics(lyricService, elements, 2, 'abețedat---');
    const afterFirst = snapshotNotes(
      elements.filter((element) => element instanceof NoteElement),
    );

    typeInlineLyrics(lyricService, elements, 2, 'abețedat---');
    expect(
      snapshotNotes(
        elements.filter((element) => element instanceof NoteElement),
      ),
    ).toEqual(afterFirst);
  });

  it('should not treat an unrelated following syllable as a vocalic final form', () => {
    const lyricService = new LyricService();
    const first = createNote('bearwood', true, true, true);
    const previous = createNote('άγ', true, true, true);
    const target = createNote('ακανόνιστο');
    const notes = [first, previous, target, new NoteElement()];

    typeInlineLyrics(lyricService, notes, 2, 'ακανόνιστο-', MelismaStyle.Auto);
    const afterFirst = snapshotNotes(notes);

    expect(previous.lyrics).toEqual('άγ');
    expect(target.lyrics).toEqual('ακανόνιστο');

    typeInlineLyrics(lyricService, notes, 2, 'ακανόνιστο-', MelismaStyle.Auto);
    expect(snapshotNotes(notes)).toEqual(afterFirst);
  });

  it('should keep a replacement syllable local after a vocalic final form', () => {
    const lyricService = new LyricService();
    const start = createNote('καταδύω', true, true, true);
    start.quantitativeNeume = QuantitativeNeume.Kentemata;
    start.tie = Tie.YfenAbove;
    const continuation = createNote('', true, false, true, 'υω');
    continuation.acceptsLyrics = AcceptsLyricsOption.MelismaOnly;
    const final = createNote('υων');
    const target = createNote('behavior');
    const elements: ScoreElement[] = [
      start,
      continuation,
      new MartyriaElement(),
      final,
      target,
    ];

    typeInlineLyrics(lyricService, elements, 4, 'annie_');
    const afterFirst = snapshotNotes([start, continuation, final, target]);

    expect(final.lyrics).toEqual('υων');
    expect(target.lyrics).toEqual('annie');

    typeInlineLyrics(lyricService, elements, 4, 'annie_');
    expect(snapshotNotes([start, continuation, final, target])).toEqual(
      afterFirst,
    );
  });

  it('should never remove lyric letters when a bare marker is retyped', () => {
    const lyricService = new LyricService();
    const start = createNote('bogota', true, true, true);
    const inherentMelismaOnly = createNote('дѣ́ланїи', true, true, true);
    inherentMelismaOnly.quantitativeNeume = QuantitativeNeume.Kentemata;
    const target = new NoteElement();
    const elements: ScoreElement[] = [
      start,
      inherentMelismaOnly,
      new MartyriaElement(),
      target,
    ];
    const beforeLetters = extractedLyricLetters(
      lyricService,
      elements,
      MelismaStyle.Vocalic,
    );

    typeInlineLyrics(lyricService, elements, 3, '-');
    const afterFirst = snapshotNotes([start, inherentMelismaOnly, target]);
    expect(
      extractedLyricLetters(lyricService, elements, MelismaStyle.Vocalic),
    ).toEqual(beforeLetters);

    typeInlineLyrics(lyricService, elements, 3, '-');
    expect(snapshotNotes([start, inherentMelismaOnly, target])).toEqual(
      afterFirst,
    );
    expect(
      extractedLyricLetters(lyricService, elements, MelismaStyle.Vocalic),
    ).toEqual(beforeLetters);
  });

  it('should keep an edit after a chained vocalic final local', () => {
    const lyricService = new LyricService();
    const notes = createVocalicNotes(5);
    assignTestLyrics(
      lyricService,
      'bosporu---us-',
      notes,
      MelismaStyle.Vocalic,
    );

    typeInlineLyrics(lyricService, notes, 4, '_');
    const afterFirst = snapshotNotes(notes);

    typeInlineLyrics(lyricService, notes, 4, '_');
    expect(snapshotNotes(notes)).toEqual(afterFirst);

    const extracted = lyricService.extractLyrics(notes, MelismaStyle.Vocalic);
    const beforePaneAssign = extractLyricLetters(extracted);
    assignTestLyrics(lyricService, extracted, notes, MelismaStyle.Vocalic);
    expect(
      extractedLyricLetters(lyricService, notes, MelismaStyle.Vocalic),
    ).toEqual(beforePaneAssign);
  });

  it('should preserve rendering when baked lyrics are extracted and reassigned', () => {
    const lyricService = new LyricService();

    for (const [lyrics, style] of [
      ['test___', MelismaStyle.Western],
      ['των___', MelismaStyle.Auto],
      ['cân___', MelismaStyle.Vocalic],
      ['гласъ___', MelismaStyle.Auto],
    ] as const) {
      const notes = createVocalicNotes(3);
      assignTestLyrics(lyricService, lyrics, notes, style);
      const before = snapshotNotes(notes);

      assignTestAcceptsLyrics(lyricService, notes, style);

      const extracted = lyricService.extractLyrics(notes, style);
      assignTestLyrics(lyricService, extracted, notes, style);
      expect(snapshotNotes(notes)).toEqual(before);
    }
  });

  it('should preserve a baked continuation break independently of its start', () => {
    const lyricService = new LyricService();
    const notes = [
      createNote('а', true, true, true),
      createNote('кцепта', true, true, true),
      createNote('', true, false, false, 'а'),
    ];
    const before = snapshotNotes(notes);

    assignTestAcceptsLyrics(lyricService, notes, MelismaStyle.Vocalic);
    const extracted = lyricService.extractLyrics(notes, MelismaStyle.Vocalic);
    assignTestLyrics(lyricService, extracted, notes, MelismaStyle.Vocalic);

    expect(snapshotNotes(notes)).toEqual(before);
  });

  it('should ignore paragraph-emitting elements inside a vocalic melisma', () => {
    const lyricService = new LyricService();
    const notes = createVocalicNotes(3);
    assignTestLyrics(lyricService, 'των__ αβγ', notes, MelismaStyle.Auto);
    const martyria = new MartyriaElement();
    martyria.alignRight = true;
    const elements: ScoreElement[] = [notes[0], martyria, notes[1], notes[2]];
    const before = snapshotNotes(notes);

    const extracted = lyricService.extractLyrics(elements, MelismaStyle.Auto);
    expect(extracted).toEqual('των__ αβγ');

    assignTestLyrics(lyricService, extracted, elements, MelismaStyle.Auto);
    expect(snapshotNotes(notes)).toEqual(before);
  });

  it('should retain previous-note accepts behavior across a martyria', () => {
    const lyricService = new LyricService();
    const tied = new NoteElement();
    tied.acceptsLyrics = AcceptsLyricsOption.MelismaOnly;
    tied.tie = Tie.YfenAbove;
    const continuation = new NoteElement();
    const target = new NoteElement();
    const elements: ScoreElement[] = [
      tied,
      new MartyriaElement(),
      continuation,
      target,
    ];

    assignTestLyrics(lyricService, 'rea', elements, MelismaStyle.Vocalic);
    expect([tied.lyrics, continuation.lyrics, target.lyrics]).toEqual([
      '',
      '',
      'rea',
    ]);
    const before = snapshotNotes([tied, continuation, target]);

    const extracted = lyricService.extractLyrics(
      elements,
      MelismaStyle.Vocalic,
    );
    expect(extracted).toEqual('rea');

    assignTestLyrics(lyricService, extracted, elements, MelismaStyle.Vocalic);
    expect(snapshotNotes([tied, continuation, target])).toEqual(before);
  });

  it('should preserve a lyric-bearing inherent MelismaOnly syllable', () => {
    const lyricService = new LyricService();
    const first = createNote('ла', true, true, true);
    const middle = createNote('с', true, true, true);
    middle.quantitativeNeume = QuantitativeNeume.Kentemata;
    const last = createNote('ва');
    const notes = [first, middle, last];
    const before = snapshotNotes(notes);

    const extracted = lyricService.extractLyrics(notes, MelismaStyle.Auto);
    expect(extracted).toEqual('ла-с-ва');

    assignTestLyrics(lyricService, extracted, notes, MelismaStyle.Auto);
    expect(snapshotNotes(notes)).toEqual(before);
  });

  it('should not emit a leading space for suppressed opening melisma notes', () => {
    const lyricService = new LyricService();
    const first = createNote('', true, false);
    first.quantitativeNeume = QuantitativeNeume.Kentemata;
    const second = createNote('', true, false);
    second.quantitativeNeume = QuantitativeNeume.Kentemata;
    const word = createNote('word');

    expect(
      lyricService.extractLyrics([first, second, word], MelismaStyle.Western),
    ).toEqual('word');
  });

  it('should strip every inline melisma break from stored lyrics', () => {
    const lyricService = new LyricService();
    const note = new NoteElement();
    const newValues = lyricService.getLyricUpdateValues(
      note,
      'word___',
      [note],
      false,
      () => {},
    );

    expect(newValues).toMatchObject({
      lyrics: 'word',
      isMelisma: true,
      isMelismaStart: true,
      isHyphen: false,
    });
  });
});

describe('LyricService (Arab phonetics)', () => {
  it('should round trip (default)', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    for (let i = 0; i < 25; i++) {
      scoreElements.push(new NoteElement());
    }

    const lyrics = 'al-la-δi---na θa--ba--ru ’aa-la ha----δα__ kul--la--hu__';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Western);

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Western),
    ).toEqual(lyrics);
  });

  it('should round trip (melisma-only)', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    for (let i = 0; i < 25; i++) {
      scoreElements.push(new NoteElement());
    }

    const indices = [3, 4, 7, 9, 14, 15, 16, 18, 20, 22, 24];

    for (const index of indices) {
      (scoreElements[index] as NoteElement).acceptsLyrics =
        AcceptsLyricsOption.MelismaOnly;
    }

    const lyrics = 'al-la-δi-na θa-ba-ru ’aa-la ha-δα kul-la-hu';

    assignTestLyrics(lyricService, lyrics, scoreElements, MelismaStyle.Western);

    expect(
      lyricService.extractLyrics(scoreElements, MelismaStyle.Western),
    ).toEqual(lyrics);
  });
});

function createNote(
  lyrics: string,
  isMelisma: boolean = false,
  isMelismaStart: boolean = false,
  isHyphen: boolean = false,
  melismaText: string = '',
) {
  const note = new NoteElement();
  note.lyrics = lyrics;
  note.isMelisma = isMelisma;
  note.isHyphen = isHyphen;
  note.isMelismaStart = isMelismaStart;
  note.melismaText = melismaText;

  return note;
}

function createVocalicNotes(count: number) {
  return Array.from({ length: count }, () => new NoteElement());
}

// Assigns lyrics over the elements the way the Lyrics pane does, applying
// each computed update directly to the note.
function assignTestLyrics(
  lyricService: LyricService,
  lyrics: string,
  elements: ScoreElement[],
  melismaStyle: MelismaStyle,
  setDropCapContent: (
    element: DropCapElement,
    content: string,
  ) => void = () => {},
) {
  let updateCount = 0;

  lyricService.assignLyrics(
    lyrics,
    elements,
    false,
    melismaStyle,
    () => {},
    (note, values) => {
      Object.assign(note, values);
      updateCount++;
    },
    (element, content) => {
      setDropCapContent(element, content);
      updateCount++;
    },
  );

  return updateCount;
}

// Bakes acceptsLyrics into the elements the way the "Assign Accepts Lyrics"
// command does, applying each computed value directly to the note.
function assignTestAcceptsLyrics(
  lyricService: LyricService,
  elements: ScoreElement[],
  melismaStyle: MelismaStyle,
) {
  lyricService.assignAcceptsLyricsFromCurrentLyrics(
    elements,
    melismaStyle,
    (note, acceptsLyrics) => {
      note.acceptsLyrics = acceptsLyrics;
    },
  );
}

// The sung letters of the elements, with every melisma break, space, and
// punctuation mark removed. Two scores that render the same words agree here
// even when the words are distributed differently across the notes.
function extractedLyricLetters(
  lyricService: LyricService,
  elements: ScoreElement[],
  melismaStyle: MelismaStyle,
) {
  return extractLyricLetters(
    lyricService.extractLyrics(elements, melismaStyle),
  );
}

function snapshotNotes(notes: NoteElement[]) {
  return notes.map(
    (n) =>
      `${n.lyrics}|${Number(n.isMelisma)}${Number(n.isMelismaStart)}${Number(n.isHyphen)}`,
  );
}

// Simulates typing into a single lyric box under a neume, the way
// TheEditor.updateLyrics applies it: the inline vocalic rebuild when it
// applies, the plain per-note update otherwise.
function typeInlineLyrics(
  lyricService: LyricService,
  notes: ScoreElement[],
  index: number,
  lyrics: string,
  melismaStyle: MelismaStyle = MelismaStyle.Vocalic,
) {
  const note = notes[index] as NoteElement;
  const updates = lyricService.getInlineVocalicMelismaUpdates(
    note,
    lyrics,
    notes,
    false,
    melismaStyle,
  );

  if (updates != null) {
    for (const { note, newValues } of updates) {
      Object.assign(note, newValues);
    }
    return;
  }

  const newValues = lyricService.getLyricUpdateValues(
    note,
    lyrics,
    notes,
    false,
    () => {},
  );

  if (newValues != null) {
    Object.assign(note, newValues);
  }
}

function getDisplayedLyrics(
  notes: NoteElement[],
  melismaStyle: MelismaStyle = MelismaStyle.Auto,
) {
  const display: string[] = [];
  let melismaSyllables: ReturnType<
    typeof MelismaHelperGreek.getMelismaSyllable
  > | null = null;

  for (const [index, note] of notes.entries()) {
    if (note.lyrics !== '') {
      display.push(note.lyrics);
    } else if (melismaSyllables != null && note.isMelisma) {
      display.push(melismaSyllables.middle);
    }

    // Mirror LayoutService phase 2: only melisma notes participate in a
    // vocalic run, a lyric-bearing continuation ends the run, and the
    // repeated vowel is corrected against the run's final form only when
    // getMelismaRunMiddle confirms the candidate carries it (e.g. "riu" +
    // "ul"), since the stored initial alone can re-analyze wrongly.
    if (
      (note.isMelisma || note.isMelismaStart) &&
      MelismaHelperGreek.usesVocalicMelisma(melismaStyle, note.lyrics)
    ) {
      if (note.isMelismaStart) {
        melismaSyllables = MelismaHelperGreek.getMelismaSyllable(note.lyrics);

        if (note.isHyphen) {
          const finalCandidate = findMelismaFinalNote(notes, index);
          const middle = finalCandidate
            ? getMelismaRunMiddle(
                note.lyrics,
                finalCandidate,
                finalCandidate.lyrics,
              )
            : null;

          if (middle != null) {
            melismaSyllables = { ...melismaSyllables, middle };
          }
        }
      } else {
        melismaSyllables = null;
      }
    } else if (note.lyrics.length > 0) {
      melismaSyllables = null;
    }
  }

  return display;
}
