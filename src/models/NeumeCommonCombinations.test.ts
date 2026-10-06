import { describe, expect, it } from 'vitest';

import { AcceptsLyricsOption, NoteElement } from './Element';
import {
  hydrateNeumeCombinationNote,
  type NeumeCombinationNotePayload,
  serializeNeumeCombinationNote,
} from './NeumeCommonCombinations';

describe('neume combination lyrics acceptance', () => {
  it.each(Object.values(AcceptsLyricsOption))(
    'preserves %s through storage and insertion without lyrics',
    (acceptsLyrics) => {
      const note = new NoteElement();
      note.acceptsLyrics = acceptsLyrics;
      note.lyrics = 'test';

      const stored = JSON.stringify(serializeNeumeCombinationNote(note));
      const payload = JSON.parse(stored) as NeumeCombinationNotePayload;
      expect(payload.acceptsLyrics).toBe(acceptsLyrics);

      const hydrated = hydrateNeumeCombinationNote(payload);
      expect(hydrated.acceptsLyrics).toBe(acceptsLyrics);

      const inserted = hydrated.clone({ includeLyrics: false });
      expect(inserted.acceptsLyrics).toBe(acceptsLyrics);
      expect(inserted.lyrics).toBe('');
    },
  );

  it('defaults older combinations without acceptsLyrics to Default', () => {
    const payload = serializeNeumeCombinationNote(new NoteElement());
    delete payload.acceptsLyrics;

    const stored = JSON.stringify(payload);
    const hydrated = hydrateNeumeCombinationNote(
      JSON.parse(stored) as NeumeCombinationNotePayload,
    );

    expect(hydrated.acceptsLyrics).toBe(AcceptsLyricsOption.Default);
  });
});
