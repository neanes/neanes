import { describe, expect, it } from 'vitest';

import {
  NoteElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import { Score } from '@/models/Score';
import { Workspace } from '@/models/Workspace';

import {
  needsFootnoteSettlement,
  WorkspaceLayoutSettlement,
} from './workspaceLayoutSettlement';

describe('workspace layout settlement', () => {
  it('requires an automatic rich-text reference and page restart', () => {
    const score = new Score();
    score.pageSetup.footnoteNumbering = 'page';
    expect(needsFootnoteSettlement(score)).toBe(false);

    const body = new Footnote();
    const note = new NoteElement();
    note.footnoteId = body.id;
    score.footnotes.push(body);
    score.staff.elements.unshift(note);
    expect(needsFootnoteSettlement(score)).toBe(false);

    const box = new RichTextBoxElement();
    box.inline = true;
    box.contentBottom = `<p>Text<span class="neanes-footnote" data-footnote-id="${body.id}"></span></p>`;
    score.staff.elements.splice(0, 1, box);
    body.marker = '*';
    expect(needsFootnoteSettlement(score)).toBe(false);

    body.marker = null;
    expect(needsFootnoteSettlement(score)).toBe(true);
    for (const numbering of ['continuous', 'section'] as const) {
      score.pageSetup.footnoteNumbering = numbering;
      expect(needsFootnoteSettlement(score)).toBe(false);
    }
  });
  it('bounds oscillating layout passes and accepts convergence within the limit', () => {
    const body = new TextBoxElement();
    const state = new WorkspaceLayoutSettlement(new Workspace());
    for (let i = 0; i < 11; i++) {
      expect(
        state.advance([{ element: body, width: body.width, height: 100 + i }]),
      ).toBe(true);
    }
    expect(
      state.advance([{ element: body, width: body.width, height: 110 }]),
    ).toBe(false);
    expect(() =>
      state.advance([{ element: body, width: body.width, height: 111 }]),
    ).toThrow('LAYOUT_DID_NOT_SETTLE');
  });
});
