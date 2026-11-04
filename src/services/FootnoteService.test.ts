import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import {
  AlternateLineElement,
  AnnotationElement,
  EmptyElement,
  FootnoteAnchorElement,
  MartyriaElement,
  NoteElement,
  RichTextBoxElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import { Footnote } from '@/models/Footnote';
import { TempoSign } from '@/models/Neumes';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import { normalizeFootnoteMarker } from './FootnoteMarker';
import {
  captureFootnotes,
  createFootnote,
  footnoteMarkerUpdateCommand,
  footnoteRemovalCommands,
  orderedFootnotes,
  planFootnoteInsertion,
  planFootnoteRemoval,
  planRichTextFootnoteUpdate,
  prepareFootnotePaste,
  transferFootnoteReference,
} from './FootnoteService';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';

function fixture() {
  const workspace = reactive(new Workspace()) as Workspace;
  const reference = new NoteElement();
  workspace.score.staff.elements.unshift(reference);
  const insertion = planFootnoteInsertion(workspace, reference);
  workspace.commandService.executeAsBatch(insertion.commands);
  return { workspace, reference, footnote: insertion.footnote };
}

describe('footnote ownership', () => {
  it('does not treat tempos as footnote anchors or save footnote properties on them', () => {
    const workspace = new Workspace();
    const tempo = new TempoElement();
    workspace.score.staff.elements.unshift(tempo);
    const saved = SaveService.SaveScoreToJson(workspace.score);
    const loaded = SaveService.LoadScoreFromJson(saved);
    for (const element of [
      tempo,
      tempo.clone(),
      saved.staff.elements[0],
      loaded.staff.elements[0],
    ]) {
      expect(element).not.toBeInstanceOf(FootnoteAnchorElement);
      for (const key of [
        'footnoteId',
        'footnoteOffsetX',
        'footnoteOffsetY',
        'footnotePositionOverride',
      ]) {
        expect(element).not.toHaveProperty(key);
      }
    }
  });

  it.each([NoteElement, MartyriaElement])(
    'transfers footnote identity and marker offsets to a replacement %s',
    (Replacement) => {
      const source = new MartyriaElement();
      source.footnoteId = 'body';
      source.footnotePositionOverride = true;
      source.footnoteOffsetX = 0.3;
      source.footnoteOffsetY = -0.5;
      const replacement = new Replacement();
      transferFootnoteReference(source, replacement);
      expect(replacement).toMatchObject({
        footnoteId: 'body',
        footnotePositionOverride: true,
        footnoteOffsetX: 0.3,
        footnoteOffsetY: -0.5,
      });
      expect(source.footnoteOffsetX).toBe(0.3);
      expect(source.footnoteOffsetY).toBe(-0.5);
    },
  );

  it('keeps explicit replacement offsets, including zero, independently for each axis', () => {
    const source = new MartyriaElement();
    source.footnoteId = 'body';
    source.footnoteOffsetX = 0.3;
    source.footnoteOffsetY = -0.5;
    const replacement = new NoteElement();
    transferFootnoteReference(source, replacement, { footnoteOffsetX: 0 });
    expect(replacement.footnoteOffsetX).toBe(0);
    expect(replacement.footnoteOffsetY).toBe(-0.5);
  });

  it('preserves an explicit false position override during replacement', () => {
    const source = new MartyriaElement();
    source.footnoteId = 'body';
    source.footnotePositionOverride = true;
    const replacement = new NoteElement();
    transferFootnoteReference(source, replacement, {
      footnotePositionOverride: false,
    });
    expect(replacement.footnotePositionOverride).toBe(false);
  });

  it('defaults older scores to automatic positioning', () => {
    const workspace = new Workspace();
    workspace.score.staff.elements.unshift(
      new NoteElement(),
      new MartyriaElement(),
    );
    const saved = SaveService.SaveScoreToJson(workspace.score);
    const loaded = SaveService.LoadScoreFromJson(saved);
    for (const element of loaded.staff.elements.slice(0, 2)) {
      expect(element).toHaveProperty('footnotePositionOverride', false);
    }
  });

  it('keeps replacement offsets when the source has no footnote to transfer', () => {
    const replacement = new NoteElement();
    replacement.footnoteOffsetY = -0.2;
    transferFootnoteReference(new MartyriaElement(), replacement);
    expect(replacement.footnoteId).toBeNull();
    expect(replacement.footnoteOffsetY).toBe(-0.2);
  });

  it.each([NoteElement, MartyriaElement])(
    'preserves marker offsets and ownership when saving and copying %s',
    (Anchor) => {
      const workspace = new Workspace();
      const reference = new Anchor();
      reference.footnotePositionOverride = true;
      reference.footnoteOffsetX = 0.25;
      reference.footnoteOffsetY = -0.5;
      workspace.score.staff.elements.unshift(reference);
      const insertion = planFootnoteInsertion(workspace, reference);
      workspace.commandService.executeAsBatch(insertion.commands);
      const loaded = SaveService.LoadScoreFromJson(
        SaveService.SaveScoreToJson(workspace.score),
      );
      expect(loaded.staff.elements[0]).toMatchObject({
        footnoteId: insertion.footnote.id,
        footnotePositionOverride: true,
        footnoteOffsetX: 0.25,
        footnoteOffsetY: -0.5,
      });
      const clone = reference.clone();
      expect(clone).toMatchObject({
        footnoteId: insertion.footnote.id,
        footnotePositionOverride: true,
        footnoteOffsetX: 0.25,
        footnoteOffsetY: -0.5,
      });
      const copies = prepareFootnotePaste(
        [clone],
        captureFootnotes(workspace.score, [reference]),
      );
      expect(clone.footnoteId).toBe(copies[0].id);
      expect(clone.footnoteId).not.toBe(reference.footnoteId);
      workspace.commandService.undo();
      expect(reference.footnoteId).toBeNull();
      expect(workspace.score.footnotes).toHaveLength(0);
      workspace.commandService.redo();
      expect(orderedFootnotes(workspace.score)[0].reference).toBe(reference);
    },
  );

  it('preserves rich marker HTML when loading scores without footnote styles', () => {
    const workspace = new Workspace();
    const body = new Footnote();
    const box = new RichTextBoxElement();
    box.content = `<p>A<span class="neanes-footnote" data-footnote-id="${body.id}"></span>B</p>`;
    workspace.score.staff.elements.unshift(box);
    workspace.score.footnotes.push(body);
    const saved = SaveService.SaveScoreToJson(workspace.score);
    expect(
      SaveService.LoadScoreFromJson(saved).staff.elements[0],
    ).toHaveProperty('content', box.content);
    saved.paragraphStyles = saved.paragraphStyles?.filter(
      (style) => !style.id.startsWith('footnote-'),
    );
    const loaded = SaveService.LoadScoreFromJson(saved);
    expect(loaded.staff.elements[0]).toHaveProperty('content', box.content);
    const roundTrip = SaveService.LoadScoreFromJson(
      SaveService.SaveScoreToJson(loaded),
    );
    expect(roundTrip.staff.elements[0]).toHaveProperty(
      'content',
      (loaded.staff.elements[0] as RichTextBoxElement).content,
    );
  });

  it('creates a styled rich-text body only for rich-text anchors', () => {
    const source = new RichTextBoxElement();
    source.languageCode = 'el';
    source.textDirection = 'ltr';
    const body = createFootnote(source);
    expect(body.staff.elements[0]).toBeInstanceOf(RichTextBoxElement);
    expect(body.staff.elements[0]).toMatchObject({
      content: '<p class="neanes-paragraph-style-footnote-text"></p>',
      languageCode: 'el',
    });
    expect(createFootnote(new NoteElement()).staff.elements).toHaveLength(1);
    expect(createFootnote(source, false).staff.elements).toHaveLength(1);
  });

  it('creates and removes a reference and its body in one undo step', () => {
    const { workspace, reference, footnote } = fixture();
    expect(reference.footnoteId).toBe(footnote.id);
    workspace.commandService.undo();
    expect(reference.footnoteId).toBeNull();
    expect(workspace.score.footnotes).toHaveLength(0);
    workspace.commandService.redo();
    workspace.commandService.executeAsBatch(
      planFootnoteRemoval(workspace.score, reference),
    );
    expect(reference.footnoteId).toBeNull();
    expect(workspace.score.footnotes).toHaveLength(0);
    workspace.commandService.undo();
    expect(reference.footnoteId).toBe(footnote.id);
    expect(workspace.score.footnotes[0].id).toBe(footnote.id);
  });

  it('restores a flushed marker and its complete body together through score history', () => {
    const workspace = reactive(new Workspace()) as Workspace;
    const box = new RichTextBoxElement();
    workspace.score.staff.elements.unshift(box);
    const body = new Footnote();
    const note = new NoteElement();
    note.spaceAfter = 37;
    note.lyrics = 'Remember me';
    body.staff.elements.unshift(note);
    const html = `<p>A<span class="neanes-footnote" data-footnote-id="${body.id}"></span>B</p>`;
    const flush = (content: string, added: Footnote[] = []) =>
      workspace.commandService.executeAsBatch(
        planRichTextFootnoteUpdate(
          workspace.score,
          workspace.score.staff.elements[0] as RichTextBoxElement,
          { content },
          added,
        ),
      );
    flush(html, [body]);
    flush('<p>AB</p>');
    expect(workspace.score.footnotes).toHaveLength(0);
    expect(
      SaveService.SaveScoreToJson(workspace.score).footnotes ?? [],
    ).toHaveLength(0);
    workspace.commandService.undo();
    expect(workspace.score.footnotes[0].id).toBe(body.id);
    expect(workspace.score.staff.elements[0]).toHaveProperty('content', html);
    expect(workspace.score.footnotes[0].staff.elements[0]).toMatchObject({
      spaceAfter: 37,
      lyrics: 'Remember me',
    });
    workspace.commandService.redo();
    expect(workspace.score.footnotes).toHaveLength(0);
    expect(workspace.score.staff.elements[0]).toHaveProperty(
      'content',
      '<p>AB</p>',
    );
  });

  it('numbers in reference order using the document starting number', () => {
    const { workspace, reference } = fixture();
    const earlier = new NoteElement();
    workspace.score.staff.elements.unshift(earlier);
    const insertion = planFootnoteInsertion(workspace, earlier);
    workspace.commandService.executeAsBatch(insertion.commands);
    workspace.score.pageSetup.firstFootnoteNumber = 98;
    expect(
      orderedFootnotes(workspace.score).map(({ reference, number }) => [
        reference,
        number,
      ]),
    ).toEqual([
      [earlier, 98],
      [reference, 99],
    ]);
    workspace.commandService.executeAsBatch(
      footnoteRemovalCommands(workspace.score, [earlier]),
    );
    workspace.score.staff.elements.splice(0, 1);
    expect(orderedFootnotes(workspace.score)[0].number).toBe(98);
  });

  it('custom markers skip automatic numbers and survive undo, saving and copying', () => {
    const { workspace, reference } = fixture();
    const anchors = [reference, new NoteElement(), new NoteElement()];
    const bodies = [workspace.score.footnotes[0]];
    for (const anchor of anchors.slice(1)) {
      workspace.score.staff.elements.splice(-1, 0, anchor);
      const plan = planFootnoteInsertion(workspace, anchor);
      workspace.commandService.executeAsBatch(plan.commands);
      bodies.push(plan.footnote);
    }
    workspace.score.pageSetup.firstFootnoteNumber = 98;
    workspace.commandService.execute(
      footnoteMarkerUpdateCommand(bodies[1], '*'),
    );
    expect(
      orderedFootnotes(workspace.score).map(({ number, marker }) => [
        number,
        marker,
      ]),
    ).toEqual([
      [98, '98'],
      [null, '*'],
      [99, '99'],
    ]);
    workspace.commandService.undo();
    expect(
      orderedFootnotes(workspace.score).map(({ number }) => number),
    ).toEqual([98, 99, 100]);
    workspace.commandService.redo();
    const loaded = SaveService.LoadScoreFromJson(
      JSON.parse(JSON.stringify(SaveService.SaveScoreToJson(workspace.score))),
    );
    expect(orderedFootnotes(loaded)[1].marker).toBe('*');
    expect(orderedFootnotes(loaded)[2].number).toBe(99);
    const [copy] = prepareFootnotePaste(
      [anchors[1].clone()],
      captureFootnotes(workspace.score, [anchors[1]]),
    );
    expect(copy.marker).toBe('*');
    expect(copy.id).not.toBe(bodies[1].id);
    workspace.commandService.execute(
      footnoteMarkerUpdateCommand(bodies[1], null),
    );
    expect(
      orderedFootnotes(workspace.score).map(({ marker }) => marker),
    ).toEqual(['98', '99', '100']);
    expect(SaveService.SaveFootnote(bodies[1]).marker).toBeUndefined();
  });

  it('validates short custom markers without rejecting Unicode symbols', () => {
    expect(normalizeFootnoteMarker(null)).toBeNull();
    expect(normalizeFootnoteMarker(' \u2020 ')).toBe('\u2020');
    expect(normalizeFootnoteMarker('a'.repeat(16))).toHaveLength(16);
    for (const marker of ['', ' ', 'a\nb', 'a\tb', 'a'.repeat(17)]) {
      expect(() => normalizeFootnoteMarker(marker)).toThrow(
        'INVALID_FOOTNOTE_MARKER',
      );
    }
  });

  it('does not allow nested or duplicate references', () => {
    const { workspace, reference, footnote } = fixture();
    expect(() => planFootnoteInsertion(workspace, reference)).toThrow(
      'INVALID_FOOTNOTE_ANCHOR',
    );
    const child = new NoteElement();
    footnote.staff.elements.unshift(child);
    expect(() => planFootnoteInsertion(workspace, child)).toThrow(
      'INVALID_FOOTNOTE_ANCHOR',
    );
  });

  it('keeps active content, lyrics, and IDs independent', () => {
    const { workspace, reference, footnote } = fixture();
    const child = new NoteElement();
    child.id = 200;
    footnote.staff.elements.unshift(child);
    workspace.selectContentForElement(child);
    expect(workspace.activeStaff).toBe(workspace.score.footnotes[0].staff);
    workspace.updateStaffLyrics('Footnote lyrics', workspace.activeStaff);
    expect(workspace.score.staff.lyrics.text).toBe('');
    expect(workspace.nextId).toBe(201);
    workspace.selectContentForElement(reference);
    expect(workspace.activeStaff).toBe(workspace.score.staff);
    expect(footnote.staff.lyrics.text).toBe('Footnote lyrics');
    expect(workspace.hasUnsavedChanges).toBe(true);
  });

  it('copies complete bodies with new identities and independent content', () => {
    const { workspace, reference, footnote } = fixture();
    const text = new TextBoxElement();
    text.content = 'Explanation';
    text.lineBreak = true;
    footnote.staff.elements.unshift(text, new NoteElement());
    const snapshots = captureFootnotes(workspace.score, [reference]);
    const pasted = [reference.clone()];
    const bodies = prepareFootnotePaste(pasted, snapshots);
    expect(pasted[0].footnoteId).toBe(bodies[0].id);
    expect(bodies[0].id).not.toBe(footnote.id);
    expect(bodies[0].staff.elements.at(-1)).toBeInstanceOf(EmptyElement);
    expect(bodies[0].staff.elements[0].lineBreak).toBe(true);
    (bodies[0].staff.elements[0] as TextBoxElement).content = 'Edited copy';
    expect(text.content).toBe('Explanation');
  });

  it('preserves all persisted body fields and resets nested identities when copying', () => {
    const { workspace, reference, footnote } = fixture();
    const note = new NoteElement();
    note.id = 101;
    note.spaceAfter = 37;
    note.lyrics = 'Body lyrics';
    const alternate = new AlternateLineElement();
    alternate.id = 102;
    const child = new NoteElement();
    child.id = 103;
    child.spaceAfter = 19;
    alternate.elements.push(child);
    note.alternateLines.push(alternate);
    const annotation = new AnnotationElement();
    annotation.id = 104;
    annotation.text = 'Annotation';
    note.annotations.push(annotation);
    const martyria = new MartyriaElement();
    martyria.id = 105;
    martyria.tempoLeft = TempoSign.Slow;
    footnote.staff.elements.unshift(note, martyria);
    footnote.staff.lyrics.text = 'Body lyrics';
    const before = SaveService.SaveElements(footnote.staff.elements);
    const snapshots = captureFootnotes(workspace.score, [reference]);
    const [copy] = prepareFootnotePaste([reference.clone()], snapshots);
    const withoutIds = (
      elements: ReturnType<typeof SaveService.SaveElements>,
    ) =>
      JSON.parse(
        JSON.stringify(elements, (key, value) =>
          key === 'id' ? undefined : value,
        ),
      );
    expect(withoutIds(SaveService.SaveElements(copy.staff.elements))).toEqual(
      withoutIds(before),
    );
    expect(copy.staff.lyrics).toEqual(footnote.staff.lyrics);
    const copiedNote = copy.staff.elements[0] as NoteElement;
    expect(copiedNote).toBeInstanceOf(NoteElement);
    expect(copiedNote.spaceAfter).toBe(37);
    expect(copy.staff.elements[1]).toHaveProperty('tempoLeft', TempoSign.Slow);
    for (const element of [
      copiedNote,
      copiedNote.annotations[0],
      copiedNote.alternateLines[0],
      copiedNote.alternateLines[0].elements[0],
      copy.staff.elements[1],
    ]) {
      expect(element.id).toBeNull();
    }
    (copiedNote.alternateLines[0].elements[0] as NoteElement).spaceAfter = 99;
    copiedNote.annotations[0].text = 'Changed';
    copy.staff.lyrics.text = 'Changed';
    expect(SaveService.SaveElements(footnote.staff.elements)).toEqual(before);
    expect(child.id).toBe(103);
    expect(footnote.staff.lyrics.text).toBe('Body lyrics');
  });

  it('round trips mixed content and settings without saving calculated labels', () => {
    const { workspace, reference, footnote } = fixture();
    const text = new TextBoxElement();
    text.content = 'Explanation';
    text.lineBreak = true;
    footnote.staff.elements.unshift(text, new NoteElement());
    workspace.score.pageSetup.firstFootnoteNumber = 12;
    workspace.score.pageSetup.footnoteHorizontalRuleLength = 75;
    workspace.score.pageSetup.showFootnoteHorizontalRule = false;
    workspace.score.pageSetup.footnoteReferenceParentheses = false;
    reference.footnoteNumber = 12;
    const saved = SaveService.SaveScoreToJson(workspace.score);
    const loaded = SaveService.LoadScoreFromJson(
      JSON.parse(JSON.stringify(saved)),
    );
    expect(loaded.footnotes[0].staff.elements[1]).toBeInstanceOf(NoteElement);
    expect(loaded.footnotes[0].id).toBe(footnote.id);
    expect(loaded.pageSetup.firstFootnoteNumber).toBe(12);
    expect(loaded.pageSetup.footnoteHorizontalRuleLength).toBe(75);
    expect(loaded.pageSetup.showFootnoteHorizontalRule).toBe(false);
    expect(loaded.pageSetup.footnoteReferenceParentheses).toBe(false);
    delete saved.pageSetup.footnoteReferenceParentheses;
    expect(
      SaveService.LoadScoreFromJson(saved).pageSetup
        .footnoteReferenceParentheses,
    ).toBe(true);
    expect(loaded.staff.elements[0]).toHaveProperty('footnoteId', footnote.id);
    expect(saved.staff.elements[0]).not.toHaveProperty('footnoteNumber');
    delete saved.footnotes;
    delete saved.pageSetup.firstFootnoteNumber;
    const legacy = SaveService.LoadScoreFromJson(saved);
    expect(legacy.footnotes).toEqual([]);
    expect(legacy.pageSetup.firstFootnoteNumber).toBe(1);
  });
});
