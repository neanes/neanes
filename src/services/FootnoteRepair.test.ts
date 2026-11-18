import { describe, expect, it } from 'vitest';

import {
  EmptyElement,
  NoteElement,
  RichTextBoxElement,
} from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import { Score } from '@/models/Score';
import { SaveService } from '@/services/SaveService';

import {
  elementFootnoteIds,
  orderedFootnotes,
  repairFootnoteReferences,
} from './FootnoteReferences';
import { planRichTextFootnoteUpdate } from './FootnoteService';
import {
  richTextBoxFootnoteIds,
  richTextFootnoteHtml,
} from './RichTextFootnotes';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

function reload(score: Score) {
  return SaveService.LoadScoreFromJson(SaveService.SaveScoreToJson(score));
}

function referencedIds(score: Score) {
  return orderedFootnotes(score).map(({ footnote }) => footnote.id);
}

describe('footnote reference repair on load', () => {
  it('leaves a valid score unchanged', () => {
    const score = new Score();
    const note = new NoteElement();
    const box = new RichTextBoxElement();
    const first = new Footnote();
    const second = new Footnote();
    note.footnoteId = first.id;
    box.content = `<p>A${richTextFootnoteHtml(second.id)}B</p>`;
    score.staff.elements = [note, box, new EmptyElement()];
    score.footnotes = [first, second];

    const saved = SaveService.SaveScoreToJson(score);
    expect(repairFootnoteReferences(score)).toBe(false);
    expect(
      SaveService.LoadScoreFromJsonWithRepairs(saved)
        .repairedFootnoteReferences,
    ).toBe(false);
    expect(SaveService.SaveScoreToJson(reload(score))).toEqual(saved);
  });

  it('drops anchor and rich text references to missing bodies', () => {
    const score = new Score();
    const note = new NoteElement();
    const box = new RichTextBoxElement();
    const body = new Footnote();
    note.footnoteId = MISSING_ID;
    box.content = `<p>A${richTextFootnoteHtml(MISSING_ID)}B${richTextFootnoteHtml(body.id)}C</p>`;
    score.staff.elements = [note, box, new EmptyElement()];
    score.footnotes = [body];

    expect(
      SaveService.LoadScoreFromJsonWithRepairs(
        SaveService.SaveScoreToJson(score),
      ).repairedFootnoteReferences,
    ).toBe(true);
    const loaded = reload(score);
    const loadedNote = loaded.staff.elements[0] as NoteElement;
    const loadedBox = loaded.staff.elements[1] as RichTextBoxElement;
    expect(loadedNote.footnoteId).toBeNull();
    expect(loadedBox.content).toBe(
      `<p>AB${richTextFootnoteHtml(body.id)}C</p>`,
    );
    expect(referencedIds(loaded)).toEqual([body.id]);
  });

  it('keeps only the first reference to a body in score order', () => {
    const score = new Score();
    const first = new NoteElement();
    const second = new NoteElement();
    const box = new RichTextBoxElement();
    const body = new Footnote();
    first.footnoteId = body.id;
    second.footnoteId = body.id;
    box.content = `<p>${richTextFootnoteHtml(body.id)}X${richTextFootnoteHtml(body.id)}</p>`;
    score.staff.elements = [first, second, box, new EmptyElement()];
    score.footnotes = [body];

    const loaded = reload(score);
    const [loadedFirst, loadedSecond, loadedBox] = loaded.staff.elements as [
      NoteElement,
      NoteElement,
      RichTextBoxElement,
    ];
    expect(loadedFirst.footnoteId).toBe(body.id);
    expect(loadedSecond.footnoteId).toBeNull();
    expect(loadedBox.content).toBe('<p>X</p>');
    expect(referencedIds(loaded)).toEqual([body.id]);
  });

  it('strips malformed and object-nested rich text references but keeps text', () => {
    const score = new Score();
    const box = new RichTextBoxElement();
    const body = new Footnote();
    box.content =
      '<p>A<span class="neanes-footnote" data-footnote-id="bad"></span>B' +
      '<span class="neanes-footnote"></span>C' +
      `<span class="neanes-ck-neume">N${richTextFootnoteHtml(body.id)}</span>D</p>`;
    score.staff.elements = [box, new EmptyElement()];
    score.footnotes = [body];

    const loaded = reload(score);
    expect((loaded.staff.elements[0] as RichTextBoxElement).content).toBe(
      '<p>ABC<span class="neanes-ck-neume">N</span>D</p>',
    );
    expect(referencedIds(loaded)).toEqual([]);
  });

  it('drops references from footnote bodies, headers, and footers', () => {
    const score = new Score();
    const outer = new Footnote();
    const inner = new Footnote();
    const anchor = new NoteElement();
    const reference = new NoteElement();
    const nestedNote = new NoteElement();
    const nestedBox = new RichTextBoxElement();
    const header = new RichTextBoxElement();
    const footer = new RichTextBoxElement();
    anchor.footnoteId = outer.id;
    reference.footnoteId = inner.id;
    nestedNote.footnoteId = inner.id;
    nestedBox.content = `<p>Body${richTextFootnoteHtml(inner.id)}</p>`;
    outer.staff.elements = [nestedNote, nestedBox, new EmptyElement()];
    header.content = `<p>Header${richTextFootnoteHtml(outer.id)}</p>`;
    footer.content = `<p>Footer${richTextFootnoteHtml(inner.id)}</p>`;
    score.headers.default.elements = [header];
    score.footers.default.elements = [footer];
    score.staff.elements = [anchor, reference, new EmptyElement()];
    score.footnotes = [outer, inner];

    const loaded = reload(score);
    expect(
      [
        ...loaded.headersAndFooters,
        ...loaded.footnotes.flatMap((footnote) => footnote.staff.elements),
      ].flatMap(elementFootnoteIds),
    ).toEqual([]);
    expect(
      (loaded.headers.default.elements[0] as RichTextBoxElement).content,
    ).toBe('<p>Header</p>');
    // Main staff references to the same bodies survive.
    expect(referencedIds(loaded)).toEqual([outer.id, inner.id]);
  });

  it('drops references hidden in inactive panel content', () => {
    const score = new Score();
    const box = new RichTextBoxElement();
    const hidden = new Footnote();
    const shown = new Footnote();
    box.multipanel = true;
    box.content = `<p>Hidden${richTextFootnoteHtml(hidden.id)}</p>`;
    box.contentCenter = `<p>Shown${richTextFootnoteHtml(shown.id)}</p>`;
    score.staff.elements = [box, new EmptyElement()];
    score.footnotes = [hidden, shown];

    const loaded = reload(score);
    const loadedBox = loaded.staff.elements[0] as RichTextBoxElement;
    expect(loadedBox.content).toBe('<p>Hidden</p>');
    expect(richTextBoxFootnoteIds(loadedBox)).toEqual([shown.id]);
    expect(loaded.footnotes.map((footnote) => footnote.id)).toEqual([shown.id]);
    // Editing the box no longer trips the hidden-reference check.
    expect(() =>
      planRichTextFootnoteUpdate(loaded, loadedBox, {
        contentLeft: '<p>Left</p>',
      }),
    ).not.toThrow();
  });

  it('drops bodies left without a main staff reference', () => {
    const score = new Score();
    const note = new NoteElement();
    const header = new RichTextBoxElement();
    const kept = new Footnote();
    const headerOnly = new Footnote();
    const unreferenced = new Footnote();
    note.footnoteId = kept.id;
    header.content = `<p>Header${richTextFootnoteHtml(headerOnly.id)}</p>`;
    score.headers.default.elements = [header];
    score.staff.elements = [note, new EmptyElement()];
    score.footnotes = [unreferenced, kept, headerOnly];

    const { score: loaded, repairedFootnoteReferences } =
      SaveService.LoadScoreFromJsonWithRepairs(
        SaveService.SaveScoreToJson(score),
      );
    expect(repairedFootnoteReferences).toBe(true);
    expect(loaded.footnotes.map((footnote) => footnote.id)).toEqual([kept.id]);
    expect(referencedIds(loaded)).toEqual([kept.id]);
  });
});
