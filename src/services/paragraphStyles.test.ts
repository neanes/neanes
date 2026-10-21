import { describe, expect, it } from 'vitest';

import { DropCapElement, NoteElement, TextBoxElement } from '@/models/Element';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS as ids,
  ParagraphStyle,
} from '@/models/ParagraphStyle';
import { Score } from '@/models/Score';
import { CommandService } from '@/services/history/CommandService';

import { createParagraphStyleUpdateCommands } from './paragraphStyles';

function custom(id: string, parentStyleId: string | null) {
  return Object.assign(new ParagraphStyle(), {
    id,
    displayName: id,
    parentStyleId,
  });
}

function replace(score: Score, styles: ParagraphStyle[]) {
  const history = new CommandService();
  history.executeAsBatch(createParagraphStyleUpdateCommands(score, styles));
  return history;
}

describe('paragraph style update commands', () => {
  it('plans without mutating the score, and clones proposed definitions and overrides', () => {
    const score = new Score();
    const previous = score.paragraphStyles;
    const style = custom('custom', ids.DefaultText);
    style.overrides = { fontSize: 24 };
    const commands = createParagraphStyleUpdateCommands(score, [
      ...previous,
      style,
    ]);
    expect(score.paragraphStyles).toBe(previous);
    const history = new CommandService();
    history.executeAsBatch(commands);
    const stored = score.paragraphStyles.find((x) => x.id === style.id)!;
    expect(stored).not.toBe(style);
    style.overrides.fontSize = 72;
    expect(stored.overrides.fontSize).toBe(24);
    history.undo();
    expect(score.paragraphStyles).toBe(previous);
    history.redo();
    expect(
      score.paragraphStyles.find((x) => x.id === style.id)?.overrides.fontSize,
    ).toBe(24);
  });

  it('uses the nearest surviving ancestor when several levels are removed together', () => {
    const score = new Score();
    const survivor = custom('survivor', ids.Lyrics);
    const middle = custom('middle', survivor.id);
    const leaf = custom('leaf', middle.id);
    score.paragraphStyles.push(survivor, middle, leaf);
    const note = new NoteElement();
    note.lyricsParagraphStyleId = leaf.id;
    score.staff.elements = [note];
    const history = replace(
      score,
      score.paragraphStyles.filter((x) => ![middle.id, leaf.id].includes(x.id)),
    );
    expect(note.lyricsParagraphStyleId).toBe(survivor.id);
    history.undo();
    expect(note.lyricsParagraphStyleId).toBe(leaf.id);
    expect(score.paragraphStyles).toContain(leaf);
    expect(score.paragraphStyles).toContain(middle);
    history.redo();
    expect(note.lyricsParagraphStyleId).toBe(survivor.id);
    expect(
      score.paragraphStyles.some((x) => x.id === leaf.id || x.id === middle.id),
    ).toBe(false);
  });

  it('repairs references across notes, drop caps, body text, and all header/footer variants in one undo batch', () => {
    const score = new Score();
    const style = custom('deleted', ids.Title);
    score.paragraphStyles.push(style);
    const note = new NoteElement();
    note.lyricsParagraphStyleId = style.id;
    const drop = new DropCapElement();
    drop.paragraphStyleId = style.id;
    const body = new TextBoxElement();
    body.paragraphStyleId = style.id;
    score.staff.elements = [note, drop, body];
    for (const box of score.headersAndFooters as TextBoxElement[]) {
      box.paragraphStyleId = style.id;
    }
    const history = replace(
      score,
      score.paragraphStyles.filter((x) => x.id !== style.id),
    );
    expect(note.lyricsParagraphStyleId).toBe(ids.Title);
    expect(drop.paragraphStyleId).toBe(ids.Title);
    expect(body.paragraphStyleId).toBe(ids.Title);
    expect(
      score.headersAndFooters.every(
        (x) => (x as TextBoxElement).paragraphStyleId === ids.Title,
      ),
    ).toBe(true);
    history.undo();
    expect(note.lyricsParagraphStyleId).toBe(style.id);
    expect(drop.paragraphStyleId).toBe(style.id);
    expect(body.paragraphStyleId).toBe(style.id);
    expect(
      score.headersAndFooters.every(
        (x) => (x as TextBoxElement).paragraphStyleId === style.id,
      ),
    ).toBe(true);
    expect(score.paragraphStyles).toContain(style);
  });

  it.each(['parentless', 'missing-parent', 'cycle'])(
    'falls back to each surface default for a %s deleted chain',
    (kind) => {
      const score = new Score();
      const a = custom(
        'a',
        kind === 'parentless'
          ? null
          : kind === 'missing-parent'
            ? 'missing'
            : 'b',
      );
      const b = custom('b', 'a');
      score.paragraphStyles.push(a, b);
      const note = new NoteElement();
      note.lyricsParagraphStyleId = a.id;
      const drop = new DropCapElement();
      drop.paragraphStyleId = a.id;
      const body = new TextBoxElement();
      body.paragraphStyleId = a.id;
      const inline = new TextBoxElement();
      inline.inline = true;
      inline.paragraphStyleId = a.id;
      score.staff.elements = [note, drop, body, inline];
      replace(
        score,
        score.paragraphStyles.filter((x) => x.id !== a.id && x.id !== b.id),
      );
      expect(note.lyricsParagraphStyleId).toBe(ids.Lyrics);
      expect(drop.paragraphStyleId).toBe(ids.DropCap);
      expect(body.paragraphStyleId).toBe(ids.DefaultText);
      expect(inline.paragraphStyleId).toBe(ids.Lyrics);
    },
  );

  it('preserves references to surviving styles and repairs unknown scalar references', () => {
    const score = new Score();
    const style = custom('surviving', ids.Lyrics);
    score.paragraphStyles.push(style);
    const note = new NoteElement();
    note.lyricsParagraphStyleId = style.id;
    const unknown = new NoteElement();
    unknown.lyricsParagraphStyleId = 'missing';
    score.staff.elements = [note, unknown];
    replace(score, score.paragraphStyles);
    expect(note.lyricsParagraphStyleId).toBe(style.id);
    expect(unknown.lyricsParagraphStyleId).toBe(ids.Lyrics);
  });
});
