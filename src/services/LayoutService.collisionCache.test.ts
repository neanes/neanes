import { describe, expect, it } from 'vitest';

import { NoteElement } from '@/models/Element';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  QuantitativeNeume,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';

import { LayoutService } from './LayoutService';

// Deterministic pseudo-random numbers (mulberry32).
function createRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const markProperties = {
  gorgonNeume: Object.values(GorgonNeume),
  secondaryGorgonNeume: Object.values(GorgonNeume),
  fthora: Object.values(Fthora),
  secondaryFthora: Object.values(Fthora),
  accidental: Object.values(Accidental),
  secondaryAccidental: Object.values(Accidental),
  timeNeume: Object.values(TimeNeume),
  vocalExpressionNeume: Object.values(VocalExpressionNeume),
  ison: Object.values(Ison),
  tie: Object.values(Tie),
  measureBarLeft: Object.values(MeasureBar),
  measureBarRight: Object.values(MeasureBar),
} as const;

const offsetProperties = [
  'accidentalOffset',
  'fthoraOffset',
  'gorgonNeumeOffset',
  'isonOffset',
  'koronisOffset',
  'measureBarLeftOffset',
  'secondaryFthoraOffset',
  'secondaryGorgonNeumeOffset',
  'stavrosOffset',
  'tieOffset',
  'timeNeumeOffset',
  'vocalExpressionNeumeOffset',
] as const;

function createNotes(count: number) {
  const random = createRandom(2903);
  const pick = <T>(values: readonly T[]) =>
    values[Math.floor(random() * values.length)];
  const neumes = Object.values(QuantitativeNeume);
  const notes: NoteElement[] = [];

  for (let i = 0; i < count; i++) {
    const note = new NoteElement();
    note.quantitativeNeume = pick(neumes);
    const target = note as unknown as Record<string, unknown>;
    for (const [property, values] of Object.entries(markProperties)) {
      if (random() < 0.3) {
        target[property] = pick<unknown>(values);
      }
    }
    // Vareia is left out: its prefix width needs canvas text measurement,
    // which is unavailable here. The editor layout comparison covers it.
    note.koronis = random() < 0.1;
    note.stavros = random() < 0.1;
    for (const property of offsetProperties) {
      if (random() < 0.15) {
        // A few distinct values, so that some offset notes share a key.
        target[`${property}X`] = pick([-0.25, 0.1, 0.5]);
        target[`${property}Y`] = pick([null, -0.3, 0.2]);
      }
    }
    notes.push(note);
  }

  // Copies that differ from a note in exactly one offset. Without them a key
  // that omits an offset would rarely see two otherwise identical notes.
  const variants = notes.slice(0, 300).flatMap((note) =>
    offsetProperties.flatMap((property) =>
      (['X', 'Y'] as const).map((axis) => {
        const variant = Object.assign(new NoteElement(), note);
        (variant as unknown as Record<string, unknown>)[`${property}${axis}`] =
          0.75;
        return variant;
      }),
    ),
  );

  return [...notes, ...variants];
}

function createSetups() {
  const ltr = new PageSetup();
  const rtl = new PageSetup();
  rtl.melkiteRtl = true;
  rtl.neumeDefaultFontFamily = 'NeanesRTL';
  const large = new PageSetup();
  large.neumeDefaultFontFamily = 'NeanesStathisSeries';
  large.neumeDefaultFontSize = 31;
  const resized = new PageSetup();
  resized.neumeDefaultFontSize = 40;
  return [ltr, rtl, large, resized];
}

const measureBarWidths = new Map(
  Object.values(MeasureBar).map((bar, index) => [bar, 4 + index]),
);

function getBoxes(note: NoteElement, setup: PageSetup, override?: number) {
  return LayoutService['getNoteCollisionGlyphBoxes'](
    note,
    setup,
    measureBarWidths,
    override ?? null,
  );
}

function computeBoxes(note: NoteElement, setup: PageSetup, override?: number) {
  return LayoutService['computeNoteCollisionGlyphBoxes'](
    setup.neumeDefaultFontFamily,
    setup.neumeDefaultFontSize,
    LayoutService['getNoteCollisionGlyphs'](
      note,
      setup,
      measureBarWidths,
      override ?? null,
    ),
  );
}

describe('LayoutService note collision glyph box cache', () => {
  // Warming and checking every combination can exceed 5 seconds on Windows CI.
  it(
    'returns the same boxes as a fresh computation for every note',
    { timeout: 30_000 },
    () => {
      const notes = createNotes(1000);
      const setups = createSetups();
      const overrides = [undefined, 7.5];

      // Fill the cache with every combination before checking any of them, so
      // that a key that misses an input returns another note's boxes.
      for (const setup of setups) {
        for (const note of notes) {
          for (const override of overrides) {
            getBoxes(note, setup, override);
          }
        }
      }

      for (const setup of setups) {
        for (const note of notes) {
          for (const override of overrides) {
            expect(getBoxes(note, setup, override)).toEqual(
              computeBoxes(note, setup, override),
            );
          }
        }
      }
    },
  );

  it('returns a new array of frozen boxes on every call', () => {
    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.Oligon;
    note.gorgonNeume = GorgonNeume.Gorgon_Top;
    const setup = new PageSetup();

    const first = getBoxes(note, setup);
    first.push({ left: 0, right: 0, top: 0, bottom: 0 });
    const second = getBoxes(note, setup);

    expect(second).not.toBe(first);
    expect(second).toEqual(computeBoxes(note, setup));
    expect(second.every((box) => Object.isFrozen(box))).toBe(true);
    expect(() => {
      second[0].left = 1;
    }).toThrow(TypeError);
  });
});
