import { describe, expect, it } from 'vitest';

import { NoteElement, RichTextBoxElement } from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import { Score } from '@/models/Score';

import { needsFootnoteSlotSettlement } from './workspaceLayoutSettlement';

describe('page-restarted footnote slot eligibility', () => {
  it('requires an automatic rich-text reference and page restart', () => {
    const score = new Score();
    score.pageSetup.footnoteNumbering = 'page';
    expect(needsFootnoteSlotSettlement(score)).toBe(false);

    const body = new Footnote();
    const note = new NoteElement();
    note.footnoteId = body.id;
    score.footnotes.push(body);
    score.staff.elements.unshift(note);
    expect(needsFootnoteSlotSettlement(score)).toBe(false);

    const box = new RichTextBoxElement();
    box.inline = true;
    box.contentBottom = `<p>Text<span class="neanes-footnote" data-footnote-id="${body.id}"></span></p>`;
    score.staff.elements.splice(0, 1, box);
    body.marker = '*';
    expect(needsFootnoteSlotSettlement(score)).toBe(false);

    body.marker = null;
    expect(needsFootnoteSlotSettlement(score)).toBe(true);
    for (const numbering of ['continuous', 'section'] as const) {
      score.pageSetup.footnoteNumbering = numbering;
      expect(needsFootnoteSlotSettlement(score)).toBe(false);
    }
  });
});
