import { describe, expect, it } from 'vitest';

import { NoteElement, TextBoxElement } from '@/models/Element';
import { Score } from '@/models/Score';
import { SaveService } from '@/services/SaveService';

import { getScoreFontLoadDescriptors } from './fontReadiness';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('export font readiness', () => {
  it('loads families from inherited styles, element overrides, and notation settings', () => {
    const score = new Score();
    score.paragraphStyles[0].overrides.fontFamily = 'Source Serif';
    const text = new TextBoxElement();
    text.fontFamily = 'Old Standard';
    const note = new NoteElement();
    note.lyricsFontFamily = 'GFS Didot';
    score.staff.elements = [text, note];
    score.pageSetup.neumeDefaultFontFamily = 'NeanesStathisSeries';
    const descriptors = getScoreFontLoadDescriptors(
      SaveService.SaveScoreToJson(score),
    );
    expect(descriptors.some((value) => value.includes('"Source Serif"'))).toBe(
      true,
    );
    expect(
      descriptors.some((value) => value.includes('"Source Serif Caption"')),
    ).toBe(true);
    expect(descriptors.some((value) => value.includes('"Old Standard"'))).toBe(
      true,
    );
    expect(descriptors.some((value) => value.includes('"GFS Didot"'))).toBe(
      true,
    );
    expect(
      descriptors.some((value) => value.includes('"NeanesStathisSeries"')),
    ).toBe(true);
    expect(new Set(descriptors).size).toBe(descriptors.length);
  });
});
