import { readFile } from 'fs/promises';
import { describe, expect, it } from 'vitest';

import type { DropCapElement, ScoreElement } from '../models/Element';
import {
  AcceptsLyricsOption,
  ElementType,
  NoteElement,
} from '../models/Element';
import { QuantitativeNeume, Tie } from '../models/Neumes';
import { LyricService } from './LyricService';
import { SaveService } from './SaveService';

describe('LyricService (English)', () => {
  it('should extract single word', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('test');
  });

  it('should extract two words', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('one'));
    scoreElements.push(createNote('two'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('one two');
  });

  it('should extract hyphenated word 2 syllables', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('ing'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(
      'test-ing',
    );
  });

  it('should extract hyphenated word 3 syllables', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('tes', true, true, true));
    scoreElements.push(createNote('ti', true, true, true));
    scoreElements.push(createNote('fy'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(
      'tes-ti-fy',
    );
  });

  it('should extract hyphenated word 2 syllables with middle melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('', true, false, true));
    scoreElements.push(createNote('ing'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(
      'test--ing',
    );
  });

  it('should extract melisma lasting 2 notes', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('test__');
  });

  it('should extract melisma lasting 3-notes', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true));
    scoreElements.push(createNote('', true, false));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('test___');
  });

  it('should extract hyphenated word with melisma at end', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('ing', true, true));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(
      'test-ing__',
    );
  });

  it('should extract word after melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('one', true, true));
    scoreElements.push(createNote('', true, false));
    scoreElements.push(createNote('two'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(
      'one__ two',
    );
  });

  it('should round trip (default)', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    for (let i = 0; i < 11; i++) {
      scoreElements.push(new NoteElement());
    }

    const lyrics = 'test-ing__ test--ing one two three___';

    lyricService.assignLyrics(
      lyrics,
      scoreElements,
      false,
      false,
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(lyrics);
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

    lyricService.assignLyrics(
      lyrics,
      scoreElements,
      false,
      false,
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(lyrics);
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

    lyricService.assignLyrics(
      newLyrics,
      scoreInput.staff.elements,
      false,
      false,
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    // First make sure the lyrics round trip
    expect(lyricService.extractLyrics(scoreInput.staff.elements, true)).toEqual(
      newLyrics,
    );

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

  it.each([
    ['running elafron', QuantitativeNeume.RunningElaphron],
    [
      'petasti plus running elafron',
      QuantitativeNeume.PetastiPlusRunningElaphron,
    ],
  ] as const)('should assign %s correctly', (_, runningElaphron) => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    const ison1 = new NoteElement();
    ison1.quantitativeNeume = QuantitativeNeume.Ison;

    const runningElafron1 = new NoteElement();
    runningElafron1.quantitativeNeume = runningElaphron;

    const ison2 = new NoteElement();
    ison2.quantitativeNeume = QuantitativeNeume.Ison;

    const runningElafron2 = new NoteElement();
    runningElafron2.quantitativeNeume = runningElaphron;

    scoreElements.push(ison1);
    scoreElements.push(runningElafron1);
    scoreElements.push(ison2);
    scoreElements.push(runningElafron2);

    const lyrics = 'test-ing one two';

    lyricService.assignLyrics(
      lyrics,
      scoreElements,
      false,
      false,
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

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

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('των');
  });

  it('should extract two words', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('των'));
    scoreElements.push(createNote('γαρ'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('των γαρ');
  });

  it('should extract melisma CV', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('τω__');
  });

  it('should extract hyphenated CVC', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, true));
    scoreElements.push(createNote('ων'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('των__');
  });

  it('should extract melisma CVC with melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, true));
    scoreElements.push(createNote('', true, true, true, 'ω'));
    scoreElements.push(createNote('ων'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('των___');
  });

  it('should extract word after melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, false));
    scoreElements.push(createNote('', true, false, false, 'ω'));
    scoreElements.push(createNote('ων'));

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual('τω__ ων');
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

    lyricService.assignLyrics(
      lyrics,
      scoreElements,
      false,
      false,
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    // The layout service should assign melismaText so we do that here.
    // This process should probably be improved to be more testable.
    (scoreElements[8] as NoteElement).melismaText = 'α';

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(lyrics);
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

    lyricService.assignLyrics(
      lyrics,
      scoreElements,
      false,
      false,
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(lyrics);
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

    lyricService.assignLyrics(
      lyrics,
      scoreElements,
      false,
      true, // disable Greek melismata
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(lyrics);
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

    lyricService.assignLyrics(
      lyrics,
      scoreElements,
      false,
      true, // disable Greek melismata
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    expect(lyricService.extractLyrics(scoreElements, false)).toEqual(lyrics);
  });
});

describe('Save current melismas', () => {
  it.each([
    QuantitativeNeume.Hyporoe,
    QuantitativeNeume.KentemataPlusOligon,
    QuantitativeNeume.Kentemata,
    QuantitativeNeume.Cross,
    QuantitativeNeume.Breath,
    QuantitativeNeume.VareiaDotted,
    QuantitativeNeume.VareiaDotted2,
    QuantitativeNeume.VareiaDotted3,
    QuantitativeNeume.VareiaDotted4,
  ])('preserves syllables on %s when replacing lyrics', (neume) => {
    const service = new LyricService();
    const notes = [createNote('one'), createNote('two'), createNote('three')];
    notes[1].quantitativeNeume = neume;
    notes[1].acceptsLyrics = AcceptsLyricsOption.Yes;

    service.assignAcceptsLyricsFromCurrentLyrics(
      notes,
      false,
      (note, value) => {
        note.acceptsLyrics = value;
      },
    );

    expect(notes.map((note) => note.acceptsLyrics)).toEqual([
      AcceptsLyricsOption.Default,
      AcceptsLyricsOption.Yes,
      AcceptsLyricsOption.Default,
    ]);

    service.assignLyrics(
      'new words here',
      notes,
      false,
      false,
      (note, lyrics) => {
        note.lyrics = lyrics;
      },
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    expect(notes.map((note) => note.lyrics)).toEqual(['new', 'words', 'here']);
    expect(service.extractLyrics(notes, false)).toBe('new words here');
  });

  it.each([Tie.YfenAbove, Tie.YfenBelow])(
    'preserves syllables after %s when replacing lyrics',
    (tie) => {
      const service = new LyricService();
      const notes = [createNote('one'), createNote('two'), createNote('three')];
      notes[0].tie = tie;

      expect(service.getEffectiveAcceptsLyrics(notes[1], notes[0])).toBe(
        AcceptsLyricsOption.MelismaOnly,
      );

      service.assignAcceptsLyricsFromCurrentLyrics(
        notes,
        false,
        (note, value) => {
          note.acceptsLyrics = value;
        },
      );

      expect(notes.map((note) => note.acceptsLyrics)).toEqual([
        AcceptsLyricsOption.Default,
        AcceptsLyricsOption.Yes,
        AcceptsLyricsOption.Default,
      ]);

      service.assignLyrics(
        'new words here',
        notes,
        false,
        false,
        (note, lyrics) => {
          note.lyrics = lyrics;
        },
        (note, values) => {
          Object.assign(note, values);
        },
        () => {},
      );

      expect(notes.map((note) => note.lyrics)).toEqual([
        'new',
        'words',
        'here',
      ]);
      expect(service.extractLyrics(notes, false)).toBe('new words here');
    },
  );

  it.each([QuantitativeNeume.Hyporoe, QuantitativeNeume.KentemataPlusOligon])(
    'preserves continuations and blank notes on %s',
    (neume) => {
      const service = new LyricService();
      const notes = [
        createNote('one', true, true),
        createNote('', true),
        createNote(''),
      ];
      notes[1].quantitativeNeume = neume;
      notes[2].quantitativeNeume = neume;

      expect(service.getEffectiveAcceptsLyrics(notes[1], notes[0])).toBe(
        AcceptsLyricsOption.MelismaOnly,
      );
      service.assignAcceptsLyricsFromCurrentLyrics(
        notes,
        false,
        (note, value) => {
          note.acceptsLyrics = value;
        },
      );

      expect(notes.map((note) => note.acceptsLyrics)).toEqual([
        AcceptsLyricsOption.Default,
        AcceptsLyricsOption.MelismaOnly,
        AcceptsLyricsOption.No,
      ]);
    },
  );
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
