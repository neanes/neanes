import { describe, expect, it } from 'vitest';
import { reactive, toRaw } from 'vue';

import {
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  ImageBoxElement,
  LineBreakType,
  MartyriaElement,
  NoteElement,
  RichTextBoxElement,
  TextBoxElement,
} from '@/models/Element';
import { QuantitativeNeume, TempoSign } from '@/models/Neumes';
import { ParagraphStyle } from '@/models/ParagraphStyle';
import { Workspace } from '@/models/Workspace';
import { SaveService } from '@/services/SaveService';

import { planElementCopy } from './elementCopy';
import { applyElementEdits } from './elementEdits';

(globalThis as { APP_VERSION?: string }).APP_VERSION = 'test';
const workspace = () => reactive(new Workspace()) as Workspace;
const saved = (document: Workspace) =>
  JSON.stringify(SaveService.SaveScoreToJson(document.score));

describe('copying staff ranges', () => {
  it.each([undefined, true, false])(
    'copies note lyrics only when included (%s), including alternate lines',
    (includeLyrics) => {
      const source = workspace();
      const destination = workspace();
      const style = new ParagraphStyle();
      style.displayName = 'Lyrics only';
      source.score.paragraphStyles.push(style);
      const note = new NoteElement();
      Object.assign(note, {
        quantitativeNeume: QuantitativeNeume.Oligon,
        lyrics: 'Al',
        isHyphen: true,
        isMelisma: true,
        isMelismaStart: true,
        lyricsParagraphStyleId: style.id,
        lyricsFontFamily: 'Arial',
        lyricsFontSize: 22,
      });
      const alternate = new AlternateLineElement();
      alternate.elements.push(note.clone());
      note.alternateLines.push(alternate);
      note.annotations.push(new AnnotationElement());
      const dropCap = new DropCapElement();
      dropCap.content = 'A';
      const text = new TextBoxElement();
      text.content = 'Keep text';
      source.score.staff.elements.unshift(note, dropCap, text);
      const before = saved(source);
      const stylesBefore = destination.score.paragraphStyles.length;
      applyElementEdits(
        destination,
        planElementCopy(source, destination, { start: 0, includeLyrics }),
      );
      const copied = destination.score.staff.elements[0] as NoteElement;
      const defaultNote = new NoteElement();
      for (const copy of [
        copied,
        copied.alternateLines[0].elements[0] as NoteElement,
      ]) {
        expect(copy.quantitativeNeume).toBe(QuantitativeNeume.Oligon);
        expect(copy).toMatchObject(
          includeLyrics === false
            ? {
                lyrics: '',
                isHyphen: false,
                isMelisma: false,
                isMelismaStart: false,
                lyricsParagraphStyleId: defaultNote.lyricsParagraphStyleId,
                lyricsFontFamily: null,
                lyricsFontSize: null,
              }
            : {
                lyrics: 'Al',
                isHyphen: true,
                isMelisma: true,
                isMelismaStart: true,
                lyricsParagraphStyleId: copied.lyricsParagraphStyleId,
                lyricsFontFamily: 'Arial',
                lyricsFontSize: 22,
              },
        );
      }
      expect(destination.score.paragraphStyles).toHaveLength(
        stylesBefore + (includeLyrics === false ? 0 : 1),
      );
      expect(copied.annotations).toHaveLength(1);
      expect(destination.score.staff.elements[1]).toMatchObject({
        content: 'A',
      });
      expect(destination.score.staff.elements[2]).toMatchObject({
        content: 'Keep text',
      });
      expect(saved(source)).toBe(before);
      destination.commandService.undo();
      expect(destination.score.staff.elements).toHaveLength(1);
      destination.commandService.redo();
      expect(destination.score.staff.elements[0]).toBe(copied);
    },
  );

  it('copies content, nested children, images and break state with fresh identities', () => {
    const source = workspace();
    const destination = workspace();
    const note = new NoteElement();
    note.lyrics = 'Alleluia';
    note.lineBreak = true;
    note.lineBreakType = LineBreakType.Center;
    note.keepWithNext = true;
    const annotation = new AnnotationElement();
    annotation.x = 12;
    note.annotations.push(annotation);
    const alternate = new AlternateLineElement();
    const alternateNote = new NoteElement();
    alternateNote.lyrics = 'Alternate';
    alternate.elements.push(alternateNote);
    note.alternateLines.push(alternate);
    const image = new ImageBoxElement();
    image.data = 'data:image/png;base64,unchanged';
    const rich = new RichTextBoxElement();
    const martyria = new MartyriaElement();
    martyria.tempoLeft = TempoSign.Moderate;
    martyria.verticalOffset = 17;
    const originals = [note, image, rich, martyria];
    source.score.staff.elements.splice(0, 0, ...originals);
    const before = saved(source);
    const revision = source.contentRevision;
    const sentinel = destination.score.staff.elements[0];
    const plan = planElementCopy(source, destination, { start: 0 });
    expect(destination.score.staff.elements).toHaveLength(1);
    expect(applyElementEdits(destination, plan)).toBe(true);
    const copies = destination.score.staff.elements.slice(0, -1);
    copies.forEach((copy, index) => {
      expect(toRaw(copy)).not.toBe(originals[index]);
    });
    const copiedNote = copies[0] as NoteElement;
    expect(copiedNote).toMatchObject({
      lyrics: 'Alleluia',
      lineBreak: true,
      lineBreakType: LineBreakType.Center,
      keepWithNext: true,
    });
    expect(toRaw(copiedNote.annotations[0])).not.toBe(annotation);
    expect(copiedNote.annotations[0]).toMatchObject({
      text: '',
      x: 12,
    });
    expect(toRaw(copiedNote.alternateLines[0])).not.toBe(alternate);
    expect(toRaw(copiedNote.alternateLines[0].elements[0])).not.toBe(
      alternateNote,
    );
    expect(copiedNote.alternateLines[0].elements[0]).toMatchObject({
      lyrics: 'Alternate',
    });
    expect(copies[1]).toMatchObject({ data: image.data });
    expect(copies[2]).toMatchObject({ contentRight: rich.contentRight });
    expect(copies[3]).toMatchObject({
      tempoLeft: martyria.tempoLeft,
      verticalOffset: 17,
    });
    expect(saved(source)).toBe(before);
    expect(source.contentRevision).toBe(revision);
    destination.commandService.undo();
    expect(destination.score.staff.elements).toEqual([sentinel]);
    destination.commandService.redo();
    expect(destination.score.staff.elements.slice(0, -1)).toEqual(copies);
    copiedNote.annotations[0].text = 'Changed';
    expect(annotation.text).toBe('');
  });

  it('imports custom style ancestors and remaps nested lyrics in the same undo step', () => {
    const source = workspace();
    const destination = workspace();
    const parent = new ParagraphStyle();
    parent.displayName = 'Parent';
    parent.overrides.fontFamily = 'Arial';
    const style = new ParagraphStyle();
    style.displayName = 'Passage';
    style.parentStyleId = parent.id;
    const note = new NoteElement();
    note.lyricsParagraphStyleId = style.id;
    const alternate = new AlternateLineElement();
    const alternateNote = new NoteElement();
    alternateNote.lyricsParagraphStyleId = style.id;
    alternate.elements.push(alternateNote);
    note.alternateLines.push(alternate);
    source.score.paragraphStyles.push(parent, style);
    source.score.staff.elements.unshift(note);
    const originalStyles = [...destination.score.paragraphStyles];
    const plan = planElementCopy(source, destination, { start: 0 });
    expect(plan.fontFamilies).toContain('Arial');
    applyElementEdits(destination, plan);
    const copied = destination.score.staff.elements[0] as NoteElement;
    const imported = destination.score.paragraphStyles.find(
      (item) => item.displayName === 'Passage',
    )!;
    expect(imported.id).not.toBe(style.id);
    expect(copied.lyricsParagraphStyleId).toBe(imported.id);
    expect(
      (copied.alternateLines[0].elements[0] as NoteElement)
        .lyricsParagraphStyleId,
    ).toBe(imported.id);
    expect(
      destination.score.paragraphStyles.find(
        (item) => item.id === imported.parentStyleId,
      ),
    ).toMatchObject({
      displayName: 'Parent',
      overrides: { fontFamily: 'Arial' },
    });
    destination.commandService.undo();
    expect(destination.score.paragraphStyles).toEqual(originalStyles);
    expect(destination.score.staff.elements).toHaveLength(1);
    destination.commandService.redo();
    expect(destination.score.paragraphStyles).toHaveLength(
      originalStyles.length + 2,
    );
  });

  it('reuses destination custom styles by name without changing their definitions', () => {
    const source = workspace();
    const destination = workspace();
    const sourceStyle = new ParagraphStyle();
    sourceStyle.displayName = 'Shared';
    sourceStyle.overrides.fontSize = 90;
    const targetStyle = new ParagraphStyle();
    targetStyle.displayName = 'Shared';
    targetStyle.overrides.fontSize = 20;
    source.score.paragraphStyles.push(sourceStyle);
    destination.score.paragraphStyles.push(targetStyle);
    const text = new TextBoxElement();
    text.paragraphStyleId = sourceStyle.id;
    source.score.staff.elements.unshift(text);
    applyElementEdits(
      destination,
      planElementCopy(source, destination, { start: 0 }),
    );
    expect(destination.score.staff.elements[0]).toMatchObject({
      paragraphStyleId: targetStyle.id,
    });
    expect(targetStyle.overrides.fontSize).toBe(20);
  });

  it('uses pre-insertion indexes when copying an overlapping range in the same document', () => {
    const document = workspace();
    const notes = ['A', 'B', 'C'].map((lyrics) =>
      Object.assign(new NoteElement(), { lyrics }),
    );
    document.score.staff.elements.unshift(...notes);
    applyElementEdits(
      document,
      planElementCopy(document, document, { start: 0, end: 2, index: 1 }),
    );
    expect(
      document.score.staff.elements
        .slice(0, -1)
        .map((element) => (element as NoteElement).lyrics),
    ).toEqual(['A', 'A', 'B', 'B', 'C']);
    document.commandService.undo();
    expect(document.score.staff.elements.slice(0, -1)).toEqual(notes);
  });

  it('rejects invalid ranges and locked destinations without changing either document', () => {
    const source = workspace();
    const destination = workspace();
    source.score.staff.elements.unshift(new NoteElement());
    const before = [saved(source), saved(destination)];
    for (const range of [
      { start: -1 },
      { start: 2 },
      { start: 0, end: 2 },
      { start: 1, end: 0 },
      { start: 0, index: 1 },
    ]) {
      expect(() => planElementCopy(source, destination, range)).toThrow(
        'INVALID_ELEMENT_RANGE',
      );
    }
    expect([saved(source), saved(destination)]).toEqual(before);
    destination.score.staff.lyrics.locked = true;
    expect(() => planElementCopy(source, destination, { start: 0 })).toThrow(
      'LYRICS_LOCKED',
    );
    const revision = destination.contentRevision;
    expect(
      applyElementEdits(
        destination,
        planElementCopy(source, destination, { start: 1, end: 1 }),
      ),
    ).toBe(false);
    expect(destination.contentRevision).toBe(revision);
  });
});
