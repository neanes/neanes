import { describe, expect, it } from 'vitest';

import { NoteElement, RichTextBoxElement } from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import {
  captureFootnotes,
  orderedFootnotes,
  planRichTextFootnoteUpdate,
  prepareFootnotePaste,
} from './FootnoteService';
import {
  insertRichTextFootnote,
  richTextBoxFootnoteIds,
  richTextFootnoteHtml,
  richTextFootnoteIds,
  superscriptLegacyFootnoteMarkers,
} from './RichTextFootnotes';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

describe('rich textbox footnotes', () => {
  it('creates and deletes content with its body in the same undo step', () => {
    const workspace = new Workspace();
    const box = new RichTextBoxElement();
    box.content = '<p>Before after</p>';
    workspace.score.staff.elements.unshift(box);
    const body = new Footnote();
    const content = insertRichTextFootnote(box.content, 9, body.id);
    workspace.commandService.executeAsBatch(
      planRichTextFootnoteUpdate(workspace.score, box, { content }, [body]),
    );
    expect(richTextBoxFootnoteIds(box)).toEqual([body.id]);
    workspace.commandService.undo();
    expect(box.content).toBe('<p>Before after</p>');
    expect(workspace.score.footnotes).toEqual([]);
    workspace.commandService.redo();
    workspace.commandService.executeAsBatch(
      planRichTextFootnoteUpdate(workspace.score, box, {
        content: '<p>Before after</p>',
      }),
    );
    expect(workspace.score.footnotes).toEqual([]);
    workspace.commandService.undo();
    expect(box.content).toBe(content);
    expect(workspace.score.footnotes[0]).toBe(body);
  });

  it('numbers references in document and panel order and copies independently', () => {
    const workspace = new Workspace();
    const bodies = Array.from({ length: 4 }, () => new Footnote());
    const box = new RichTextBoxElement();
    box.multipanel = true;
    box.contentLeft = `<p>${richTextFootnoteHtml(bodies[0].id)}</p>`;
    box.contentCenter = `<p>${richTextFootnoteHtml(bodies[1].id)}</p>`;
    box.contentRight = `<p>${richTextFootnoteHtml(bodies[2].id)}</p>`;
    const note = new NoteElement();
    note.footnoteId = bodies[3].id;
    workspace.score.staff.elements.unshift(box, note);
    workspace.score.footnotes = bodies.toReversed();
    workspace.score.pageSetup.firstFootnoteNumber = 98;
    expect(
      orderedFootnotes(workspace.score).map(({ footnote, number }) => [
        footnote.id,
        number,
      ]),
    ).toEqual(bodies.map((body, i) => [body.id, 98 + i]));
    const copied = box.clone();
    const copies = prepareFootnotePaste(
      [copied],
      captureFootnotes(workspace.score, [box]),
    );
    expect(richTextBoxFootnoteIds(copied)).toEqual(
      copies.map((body) => body.id),
    );
    expect(
      copies.every((copy) => !bodies.some((body) => body.id === copy.id)),
    ).toBe(true);
    const loaded = SaveService.LoadScoreFromJson(
      SaveService.SaveScoreToJson(workspace.score),
    );
    expect(orderedFootnotes(loaded).map(({ footnote }) => footnote.id)).toEqual(
      bodies.map((body) => body.id),
    );
    expect(() =>
      planRichTextFootnoteUpdate(workspace.score, box, { multipanel: false }),
    ).toThrow('INVALID_FOOTNOTE_REFERENCE');
  });

  it('rejects dangling, duplicate, and nested references before mutation', () => {
    const workspace = new Workspace();
    const box = new RichTextBoxElement();
    workspace.score.staff.elements.unshift(box);
    const body = new Footnote();
    const html = `<p>${richTextFootnoteHtml(body.id)}</p>`;
    expect(() =>
      planRichTextFootnoteUpdate(workspace.score, box, { content: html }),
    ).toThrow('INVALID_FOOTNOTE_REFERENCE');
    expect(() =>
      planRichTextFootnoteUpdate(
        workspace.score,
        box,
        { content: html + html },
        [body],
      ),
    ).toThrow('INVALID_FOOTNOTE_REFERENCE');
    expect(() =>
      planRichTextFootnoteUpdate(
        workspace.score,
        new RichTextBoxElement(),
        { content: html },
        [body],
      ),
    ).toThrow('NESTED_FOOTNOTES_UNSUPPORTED');
    expect(workspace.score.footnotes).toEqual([]);
    expect(
      richTextFootnoteIds(
        `<p>&lt;span class="neanes-footnote" data-footnote-id="${body.id}"&gt;</p>`,
      ),
    ).toEqual([]);
  });

  it('only inserts at safe HTML text boundaries', () => {
    const body = new Footnote();
    const html = '<p>Hello &amp; goodbye</p>';
    expect(
      richTextFootnoteIds(insertRichTextFootnote(html, 3, body.id)),
    ).toEqual([body.id]);
    const objectHtml = `<p><span class="neanes-ck-neume">X</span></p>`;
    expect(() =>
      insertRichTextFootnote(objectHtml, objectHtml.indexOf('X'), body.id),
    ).toThrow('INVALID_ELEMENT_EDIT');
    expect(() =>
      richTextFootnoteIds(
        `<p><span class="neanes-ck-neume">${richTextFootnoteHtml(body.id)}</span></p>`,
      ),
    ).toThrow('INVALID_FOOTNOTE_REFERENCE');
    for (const offset of [1, 11, 200]) {
      expect(() => insertRichTextFootnote(html, offset, body.id)).toThrow(
        'INVALID_ELEMENT_EDIT',
      );
    }
  });
});

describe('legacy rich-text footnote formatting', () => {
  it('upgrades old references once while preserving formatting and identity', () => {
    const marker =
      '<span class="neanes-footnote" data-footnote-id="id"></span>';
    const html = `<p><span style="font-size:20px">Before${marker}after</span></p>`;
    const migrated = superscriptLegacyFootnoteMarkers(html);
    expect(migrated).toBe(html.replace(marker, `<sup>${marker}</sup>`));
    expect(superscriptLegacyFootnoteMarkers(migrated)).toBe(migrated);
  });
});
