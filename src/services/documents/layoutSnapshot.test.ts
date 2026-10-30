import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import {
  AlternateLineElement,
  AnnotationElement,
  NoteElement,
  TextBoxElement,
} from '@/models/Element';
import { Score } from '@/models/Score';

import { cloneScoreForLayout } from './layoutSnapshot';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
describe('detached layout data and reconciliation', () => {
  it('preserves model prototypes, null/undefined overrides, blank children and live identity mapping', () => {
    const source = reactive(new Score());
    const note = new NoteElement();
    note.annotations.push(new AnnotationElement());
    note.alternateLines.push(new AlternateLineElement());
    const box = new TextBoxElement();
    box.lineHeight = null;
    source.staff.elements.unshift(note, box);
    const { score, sources } = cloneScoreForLayout(source);
    expect(score).toBeInstanceOf(Score);
    expect(score.pageSetup.pageWidth).toBe(source.pageSetup.pageWidth);
    expect(score.staff.elements[0]).toBeInstanceOf(NoteElement);
    const copied = score.staff.elements[0] as NoteElement;
    expect(copied.annotations).toHaveLength(1);
    expect(copied.alternateLines).toHaveLength(1);
    expect(sources.get(copied)).toBe(note);
    expect(sources.get(copied.annotations[0])).toBe(note.annotations[0]);
    expect((score.staff.elements[1] as TextBoxElement).lineHeight).toBeNull();
    expect(
      (score.headers.default.elements[0] as TextBoxElement).lineHeight,
    ).toBeUndefined();
    copied.lyrics = 'copy';
    copied.annotations[0].text = 'copy';
    score.pageSetup.firstPageNumber = 17;
    score.paragraphStyles[0].overrides.fontSize = 77;
    expect(note.lyrics).toBe('');
    expect(note.annotations[0].text).toBe('');
    expect(source.pageSetup.firstPageNumber).not.toBe(17);
    expect(source.paragraphStyles[0].overrides.fontSize).not.toBe(77);
  });
});
