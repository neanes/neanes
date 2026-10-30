import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import {
  AlternateLineElement,
  AnnotationElement,
  EmptyElement,
  MartyriaElement,
  NoteElement,
  TextBoxElement,
} from '@/models/Element';
import { TempoSign } from '@/models/Neumes';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import {
  captureFootnotes,
  footnoteRemovalCommands,
  orderedFootnotes,
  planFootnoteInsertion,
  planFootnoteRemoval,
  prepareFootnotePaste,
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
    expect(loaded.staff.elements[0]).toHaveProperty('footnoteId', footnote.id);
    expect(saved.staff.elements[0]).not.toHaveProperty('footnoteNumber');
    delete saved.footnotes;
    delete saved.pageSetup.firstFootnoteNumber;
    const legacy = SaveService.LoadScoreFromJson(saved);
    expect(legacy.footnotes).toEqual([]);
    expect(legacy.pageSetup.firstFootnoteNumber).toBe(1);
  });
});
