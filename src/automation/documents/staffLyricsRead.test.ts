import { describe, expect, it } from 'vitest';

import { automationOutputSchema } from '@/automation/__tests__/helpers';
import { Score } from '@/models/Score';

import { parseAutomationRequest } from '../contracts/protocol';
import { assertResultBudget } from '../contracts/responseBudget';
import { readStaffLyrics } from './contentRead';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('staff lyrics manager content', () => {
  it.each(['a'.repeat(65000), 'a\u{1f600}' + '\u0000'.repeat(70000), ''])(
    'reconstructs exact manager text in bounded chunks',
    (text) => {
      const score = new Score();
      score.staff.lyrics.text = text;
      score.staff.lyrics.locked = true;
      let offset: number | null = 0;
      let reconstructed = '';
      while (offset !== null) {
        const request = parseAutomationRequest({
          tool: 'get_staff_lyrics',
          arguments: { documentId: 'test', offset, expectedRevision: 7 },
        });
        if (request.tool !== 'get_staff_lyrics') {
          throw new Error('Unexpected tool');
        }
        expect(request.arguments.expectedRevision).toBe(7);
        const result = {
          documentId: 'test',
          revision: 7,
          ...readStaffLyrics(score.staff.lyrics, request.arguments),
        };
        expect(result.locked).toBe(true);
        expect(result.totalLength).toBe(text.length);
        expect(() =>
          assertResultBudget(result, 'get_staff_lyrics'),
        ).not.toThrow();
        expect(
          automationOutputSchema('get_staff_lyrics').parse({
            success: true,
            result,
          }),
        ).toEqual({ success: true, result });
        reconstructed += result.text;
        offset = result.nextOffset;
      }
      expect(reconstructed).toBe(text);
      expect(score.staff.lyrics.text).toBe(text);
      expect(score.staff.lyrics.locked).toBe(true);
    },
  );

  it('retains lock state and handles boundaries without splitting surrogate pairs', () => {
    const score = new Score();
    score.staff.lyrics.text = 'a\u{1f600}b';
    expect(
      readStaffLyrics(score.staff.lyrics, { offset: 0, limit: 2 }),
    ).toMatchObject({ text: 'a', nextOffset: 1, locked: false });
    expect(
      readStaffLyrics(score.staff.lyrics, { offset: 1, limit: 2 }),
    ).toMatchObject({ text: '\u{1f600}', nextOffset: 3 });
    expect(() =>
      readStaffLyrics(score.staff.lyrics, { offset: 2, limit: 2 }),
    ).toThrow('INVALID_ELEMENT_RANGE');
    expect(() =>
      readStaffLyrics(score.staff.lyrics, { offset: 5, limit: 2 }),
    ).toThrow('INVALID_ELEMENT_RANGE');
    expect(
      readStaffLyrics(score.staff.lyrics, { offset: 4, limit: 2 }),
    ).toMatchObject({ text: '', nextOffset: null });
  });
});
