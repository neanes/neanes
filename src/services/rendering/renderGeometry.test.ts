import { describe, expect, it } from 'vitest';

import {
  AlternateLineElement,
  AnnotationElement,
  NoteElement,
} from '@/models/Element';
import { Line, Page } from '@/models/Page';
import { Score } from '@/models/Score';
import { SaveService } from '@/services/SaveService';

import { cloneScoreForLayout } from '../documents/layoutSnapshot';
import { renderGeometry } from './renderGeometry';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('independently rendered page geometry', () => {
  it.each(['alternateLine', 'annotation'] as const)(
    'matches a save/load snapshot when a note has a non-rendering %s',
    (kind) => {
      const score = new Score();
      const note = new NoteElement();
      const alternate = new AlternateLineElement();
      alternate.elements.push(new NoteElement());
      const annotation = new AnnotationElement();
      annotation.text = '<p>Visible annotation</p>';
      note.alternateLines.push(alternate);
      note.annotations.push(annotation);
      if (kind === 'alternateLine') {
        const empty = new AlternateLineElement();
        empty.x = 40;
        empty.y = -60;
        note.alternateLines.unshift(empty);
      } else {
        const empty = new AnnotationElement();
        empty.text = '  ';
        note.annotations.unshift(empty);
      }
      score.staff.elements.unshift(note, new NoteElement());
      const loaded = SaveService.LoadScoreFromJson(
        JSON.parse(JSON.stringify(SaveService.SaveScoreToJson(score))),
      );
      const loadedNote = loaded.staff.elements[0] as NoteElement;
      expect(loadedNote.alternateLines).toHaveLength(1);
      expect(loadedNote.annotations).toHaveLength(1);
      expect(note.alternateLines).toHaveLength(
        kind === 'alternateLine' ? 2 : 1,
      );
      expect(note.annotations).toHaveLength(kind === 'annotation' ? 2 : 1);
      function pages(score: Score) {
        return score.staff.elements.slice(0, 2).map((element, index) => {
          const page = new Page();
          page.physicalPageNumber = index + 1;
          const line = new Line();
          line.elements = [element];
          page.lines.push(line);
          return page;
        });
      }
      const expected = renderGeometry(score, pages(score));
      expect(renderGeometry(loaded, pages(loaded))).toBe(expected);
      loadedNote.alternateLines[0].elements[0].x++;
      expect(renderGeometry(loaded, pages(loaded))).not.toBe(expected);
    },
  );
  it('ignores live identities but detects page, child, and running-template geometry changes', () => {
    const score = new Score();
    score.pageSetup.showHeader = true;
    score.pageSetup.showFooter = true;
    const note = new NoteElement();
    const annotation = new AnnotationElement();
    annotation.text = '<p>Visible annotation</p>';
    note.annotations.push(annotation);
    const alternate = new AlternateLineElement();
    alternate.elements.push(new NoteElement());
    note.alternateLines.push(alternate);
    score.staff.elements.unshift(note);
    function pages(score: Score) {
      const page = new Page();
      const line = new Line();
      line.elements = [score.staff.elements[0]];
      page.lines.push(line);
      return [page];
    }
    const baseline = renderGeometry(score, pages(score));
    const { score: copy } = cloneScoreForLayout(score);
    expect(renderGeometry(copy, pages(copy))).toBe(baseline);
    const copyNote = copy.staff.elements[0] as NoteElement;
    copyNote.alternateLines[0].elements[0].x++;
    expect(renderGeometry(copy, pages(copy))).not.toBe(baseline);
    copyNote.alternateLines[0].elements[0].x--;
    copyNote.annotations[0].y++;
    expect(renderGeometry(copy, pages(copy))).not.toBe(baseline);
    copyNote.annotations[0].y--;
    copy.getHeaderForPage(1, true).elements[0].width++;
    copy.getHeaderForPage(1, false).elements[0].width++;
    expect(renderGeometry(copy, pages(copy))).not.toBe(baseline);
    expect(renderGeometry(score, [])).not.toBe(baseline);
    score.pageSetup.pageWidth++;
    expect(renderGeometry(score, pages(score))).not.toBe(baseline);
  });
});
