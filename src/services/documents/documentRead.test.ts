import { describe, expect, it } from 'vitest';

import { NoteElement } from '@/models/Element';
import { Score } from '@/models/Score';
import { SaveService } from '@/services/SaveService';

import { readDocumentSections } from './documentRead';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

const serialized = () => {
  const score = new Score();
  score.staff.elements.unshift(new NoteElement(), new NoteElement());
  score.staff.lyrics.text = 'long manager text'.repeat(10000);
  return SaveService.SaveScoreToJson(score);
};
describe('document read sections', () => {
  it('preserves the complete legacy view and paginates staff elements', () => {
    const data = serialized();
    const before = JSON.stringify(data);
    const page = readDocumentSections(data, { offset: 1, limit: 1 });
    expect(page).toEqual({
      score: {
        ...data,
        staff: { ...data.staff, elements: data.staff.elements.slice(1, 2) },
      },
      offset: 1,
      nextOffset: 2,
    });
    expect(
      readDocumentSections(data, { offset: 2, limit: 1 }).nextOffset,
    ).toBeNull();
    expect(JSON.stringify(data)).toBe(before);
  });
  it('excludes shared sections and manager text from focused element pages', () => {
    const data = serialized();
    const page = readDocumentSections(data, {
      offset: 0,
      limit: 1,
      sections: ['staffElements'],
    });
    expect(page.score).toEqual({
      version: data.version,
      appVersion: data.appVersion,
      staff: { elements: data.staff.elements.slice(0, 1) },
    });
    expect(JSON.stringify(page).length).toBeLessThan(1000);
    expect(page.nextOffset).toBe(1);
  });
  it('reads arbitrary sections without returning unrelated content or a spurious next page', () => {
    const data = serialized();
    expect(
      readDocumentSections(data, {
        offset: 0,
        limit: 1,
        sections: ['staffLyrics', 'paragraphStyles'],
      }),
    ).toEqual({
      score: {
        version: data.version,
        appVersion: data.appVersion,
        staff: { lyrics: data.staff.lyrics },
        paragraphStyles: data.paragraphStyles,
      },
      offset: 0,
      nextOffset: null,
    });
    expect(
      readDocumentSections(data, { offset: 0, limit: 1, sections: [] }).score,
    ).toEqual({ version: data.version, appVersion: data.appVersion });
  });
});
