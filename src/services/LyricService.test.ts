import { readFile } from 'fs/promises';
import { describe, expect, it } from 'vitest';

import {
  AcceptsLyricsOption,
  DropCapElement,
  ElementType,
  NoteElement,
  ScoreElement,
} from '../models/Element';
import { QuantitativeNeume } from '../models/Neumes';
import { LyricService } from './LyricService';
import { SaveService } from './SaveService';

describe('LyricService (English)', () => {
  it('should extract single word', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test');
  });

  it('should extract two words', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('one'));
    scoreElements.push(createNote('two'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('one two');
  });

  it('should extract hyphenated word 2 syllables', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('ing'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test-ing');
  });

  it('should extract hyphenated word 3 syllables', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('tes', true, true, true));
    scoreElements.push(createNote('ti', true, true, true));
    scoreElements.push(createNote('fy'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('tes-ti-fy');
  });

  it('should extract hyphenated word 2 syllables with middle melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('', true, false, true));
    scoreElements.push(createNote('ing'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test--ing');
  });

  it('should extract melisma lasting 2 notes', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test__');
  });

  it('should extract melisma lasting 3-notes', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true));
    scoreElements.push(createNote('', true, false));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test___');
  });

  it('should extract hyphenated word with melisma at end', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('test', true, true, true));
    scoreElements.push(createNote('ing', true, true));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('test-ing__');
  });

  it('should extract word after melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('one', true, true));
    scoreElements.push(createNote('', true, false));
    scoreElements.push(createNote('two'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('one__ two');
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
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    expect(lyricService.extractLyrics(scoreElements)).toEqual(lyrics);
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
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    expect(lyricService.extractLyrics(scoreElements)).toEqual(lyrics);
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
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    // First make sure the lyrics round trip
    expect(lyricService.extractLyrics(scoreInput.staff.elements)).toEqual(
      newLyrics,
    );

    // Next match the snapshot
    expect(
      scoreInput.staff.elements
        .filter((x) =>
          [ElementType.Note, ElementType.DropCap].includes(x.elementType),
        )
        .map((x: NoteElement | DropCapElement) =>
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

    lyricService.assignLyrics(
      lyrics,
      scoreElements,
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

    expect(lyricService.extractLyrics(scoreElements)).toEqual('των');
  });

  it('should extract two words', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('των'));
    scoreElements.push(createNote('γαρ'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('των γαρ');
  });

  it('should extract melisma CV', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true));
    scoreElements.push(createNote('', true, false));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('τω__');
  });

  it('should extract hyphenated CVC', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, true));
    scoreElements.push(createNote('ων'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('των__');
  });

  it('should extract melisma CVC with melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, true));
    scoreElements.push(createNote('', true, true, true, 'ω'));
    scoreElements.push(createNote('ων'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('των___');
  });

  it('should extract word after melisma', () => {
    const lyricService = new LyricService();

    const scoreElements: ScoreElement[] = [];

    scoreElements.push(createNote('τω', true, true, false));
    scoreElements.push(createNote('', true, false, false, 'ω'));
    scoreElements.push(createNote('ων'));

    expect(lyricService.extractLyrics(scoreElements)).toEqual('τω__ ων');
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
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    // The layout service should assign melismaText so we do that here.
    // This process should probably be improved to be more testable.
    (scoreElements[8] as NoteElement).melismaText = 'α';

    expect(lyricService.extractLyrics(scoreElements)).toEqual(lyrics);
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
      () => {},
      (note, values) => {
        Object.assign(note, values);
      },
      () => {},
    );

    expect(lyricService.extractLyrics(scoreElements)).toEqual(lyrics);
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
