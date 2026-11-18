import { describe, expect, it } from 'vitest';
import { computed, reactive } from 'vue';

import { MartyriaElement, NoteElement } from '@/models/Element';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  MeasureBar,
  Note,
  QuantitativeNeume,
  TimeNeume,
} from '@/models/Neumes';
import {
  MartyriaElement as SavedMartyriaElement,
  NoteElement as SavedNoteElement,
} from '@/models/save/v1/Element';
import { Scale } from '@/models/Scales';
import { Workspace } from '@/models/Workspace';
import {
  createMartyriaUpdateCommand,
  createNoteUpdateCommand,
} from '@/services/elementEditing';
import { CommandFactory } from '@/services/history/CommandService';
import { LayoutService } from '@/services/LayoutService';
import { SaveService } from '@/services/SaveService';

function savedNote(note: NoteElement) {
  const result = new SavedNoteElement();
  SaveService.SaveNote(result, note);
  return result;
}

describe('property update side effects', () => {
  it('restores downstream notation after undoing an upstream pitch change', () => {
    const workspace = reactive(new Workspace()) as Workspace;
    const upstream = new NoteElement();
    upstream.quantitativeNeume = QuantitativeNeume.Apostrophos;
    const downstream = new NoteElement();
    downstream.quantitativeNeume = QuantitativeNeume.OligonPlusKentemata;
    downstream.fthora = Fthora.Kliton_Bottom;
    downstream.secondaryFthora = Fthora.GeneralFlat_TopSecondary;
    workspace.score.staff.elements = [upstream, downstream];
    const layout = () =>
      LayoutService.calculateMartyriae(
        workspace.score.staff.elements,
        workspace.score.pageSetup,
      );
    const snapshot = () =>
      JSON.stringify(
        workspace.score.staff.elements.map((element) =>
          savedNote(element as NoteElement),
        ),
      );

    // Start from a settled saved score, including both hidden fthora carries.
    layout();
    layout();
    const saved = snapshot();
    expect(savedNote(downstream).secondaryFthora).toBeUndefined();
    workspace.markContentSaved(workspace.contentStateId);

    workspace.commandService.execute(
      createNoteUpdateCommand({
        target: workspace.score.staff.elements[0] as NoteElement,
        newValues: { quantitativeNeume: QuantitativeNeume.OligonPlusKentemata },
      }),
    );
    layout();
    const edited = snapshot();
    expect(downstream.fthora).toBe(Fthora.Kliton_Bottom);
    expect(downstream.secondaryFthora).toBe(Fthora.GeneralFlat_TopSecondary);
    expect(workspace.hasUnsavedChanges).toBe(true);

    workspace.commandService.undo();
    layout();
    expect(snapshot()).toBe(saved);
    expect(workspace.hasUnsavedChanges).toBe(false);
    layout();
    expect(snapshot()).toBe(saved);

    workspace.commandService.redo();
    layout();
    expect(snapshot()).toBe(edited);
    expect(workspace.hasUnsavedChanges).toBe(true);
    layout();
    expect(snapshot()).toBe(edited);
  });

  it('groups notation and lyrics into one undo step', () => {
    const workspace = reactive(new Workspace()) as Workspace;
    workspace.score.staff.elements = [new NoteElement()];
    const note = workspace.score.staff.elements[0] as NoteElement;
    workspace.commandService.execute(
      createNoteUpdateCommand({
        target: note,
        newValues: {
          quantitativeNeume: QuantitativeNeume.Oligon,
          lyrics: 'Lyrics',
        },
      }),
    );
    expect(workspace.contentRevision).toBe(1);
    workspace.commandService.undo();
    expect(note.quantitativeNeume).toBe(QuantitativeNeume.Ison);
    expect(note.lyrics).toBe('');
    expect(workspace.hasUnsavedChanges).toBe(false);
    workspace.commandService.redo();
    expect(note.quantitativeNeume).toBe(QuantitativeNeume.Oligon);
    expect(note.lyrics).toBe('Lyrics');
    expect(workspace.contentRevision).toBe(3);
  });

  it('keeps an unchanged notation group out of an ordinary edit undo step', () => {
    const workspace = new Workspace();
    const note = new NoteElement();
    workspace.score.staff.elements = [note];
    workspace.commandService.execute(
      createNoteUpdateCommand({
        target: note,
        newValues: {
          quantitativeNeume: note.quantitativeNeume,
          lyrics: 'Lyrics',
        },
      }),
    );
    workspace.commandService.execute(
      createNoteUpdateCommand({
        target: note,
        newValues: { fthora: Fthora.DiatonicGa_Top },
      }),
      true,
    );
    workspace.commandService.undo();
    expect(note.lyrics).toBe('');
    expect(note.fthora).toBe(Fthora.DiatonicGa_Top);
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.commandService.redo();
    expect(note.lyrics).toBe('Lyrics');
    expect(note.fthora).toBe(Fthora.DiatonicGa_Top);
  });

  it('does not restore unchanged lyrics included in a notation edit', () => {
    const workspace = new Workspace();
    const note = new NoteElement();
    note.lyrics = 'Original';
    workspace.score.staff.elements = [note];
    workspace.commandService.execute(
      createNoteUpdateCommand({
        target: note,
        newValues: {
          quantitativeNeume: QuantitativeNeume.Oligon,
          lyrics: note.lyrics,
        },
      }),
    );
    workspace.commandService.execute(
      createNoteUpdateCommand({ target: note, newValues: { lyrics: 'Later' } }),
      true,
    );
    workspace.commandService.undo();
    expect(note.quantitativeNeume).toBe(QuantitativeNeume.Ison);
    expect(note.lyrics).toBe('Later');
    workspace.commandService.redo();
    expect(note.quantitativeNeume).toBe(QuantitativeNeume.Oligon);
    expect(note.lyrics).toBe('Later');
  });

  it('restores manual martyria note and scale after undoing Auto', () => {
    const workspace = reactive(new Workspace()) as Workspace;
    const original = new MartyriaElement();
    original.auto = false;
    original.note = Note.Ga;
    original.scale = Scale.HardChromatic;
    workspace.score.staff.elements = [original];
    const martyria = workspace.score.staff.elements[0] as MartyriaElement;
    const layout = () =>
      LayoutService.calculateMartyriae(
        workspace.score.staff.elements,
        workspace.score.pageSetup,
      );
    const snapshot = () => {
      const result = new SavedMartyriaElement();
      SaveService.SaveMartyria(result, martyria);
      return result;
    };
    layout();
    const before = snapshot();
    workspace.commandService.execute(
      new CommandFactory<MartyriaElement>(createMartyriaUpdateCommand).create(
        'update-properties',
        {
          target: martyria,
          newValues: { auto: true },
        },
      ),
    );
    layout();
    expect(martyria.note).toBe(Note.Pa);
    expect(martyria.scale).toBe(Scale.Diatonic);
    const after = snapshot();
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.commandService.undo();
    layout();
    expect(snapshot()).toEqual(before);
    expect(martyria.auto).toBe(false);
    expect(martyria.note).toBe(Note.Ga);
    expect(martyria.scale).toBe(Scale.HardChromatic);
    expect(workspace.hasUnsavedChanges).toBe(false);
    workspace.commandService.redo();
    layout();
    expect(snapshot()).toEqual(after);
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.commandService.undo();
    layout();
    expect(snapshot()).toEqual(before);
    expect(workspace.hasUnsavedChanges).toBe(false);
  });
  it.each([
    ['fthora', 'fthoraCarry', Fthora.DiatonicGa_Top, Fthora.Enharmonic_Top],
    [
      'secondaryFthora',
      'secondaryFthoraCarry',
      Fthora.DiatonicGa_TopSecondary,
      Fthora.Enharmonic_TopSecondary,
    ],
    [
      'tertiaryFthora',
      'tertiaryFthoraCarry',
      Fthora.DiatonicGa_TopTertiary,
      Fthora.Enharmonic_TopTertiary,
    ],
  ] as const)(
    'restores %s carry state generated by layout after a paste',
    (slot, carry, originalFthora, pastedFthora) => {
      const workspace = new Workspace();
      const note = new NoteElement();
      note.quantitativeNeume = QuantitativeNeume.OligonPlusKentimaBelow;
      note[slot] = originalFthora;
      workspace.score.staff.elements = [note];
      const layout = () =>
        LayoutService.calculateMartyriae(
          workspace.score.staff.elements,
          workspace.score.pageSetup,
        );
      layout();
      const before = savedNote(note);
      expect(note[slot]).toBe(originalFthora);
      const pasted = new NoteElement();
      pasted.quantitativeNeume = QuantitativeNeume.Ison;
      pasted[slot] = pastedFthora;
      workspace.commandService.execute(
        new CommandFactory<NoteElement>(createNoteUpdateCommand).create(
          'update-properties',
          {
            target: note,
            newValues: pasted.getClipboardProperties(true),
          },
        ),
      );
      layout();
      expect(note[carry]).toBe(pastedFthora);
      const after = savedNote(note);
      workspace.commandService.undo();
      layout();
      expect(savedNote(note)).toEqual(before);
      expect(note[carry]).toBeNull();
      expect(workspace.hasUnsavedChanges).toBe(false);
      workspace.commandService.redo();
      layout();
      expect(savedNote(note)).toEqual(after);
      expect(note[carry]).toBe(pastedFthora);
      workspace.commandService.undo();
      layout();
      expect(savedNote(note)).toEqual(before);
    },
  );
  it('restores an existing carry consumed by layout, including its initially unchanged visible field', () => {
    const workspace = new Workspace();
    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.Ison;
    note.fthoraCarry = Fthora.Enharmonic_Top;
    workspace.score.staff.elements = [note];
    const layout = () =>
      LayoutService.calculateMartyriae(
        workspace.score.staff.elements,
        workspace.score.pageSetup,
      );
    layout();
    const before = savedNote(note);
    expect(note.fthora).toBeNull();
    workspace.commandService.execute(
      new CommandFactory<NoteElement>(createNoteUpdateCommand).create(
        'update-properties',
        {
          target: note,
          newValues: {
            quantitativeNeume: QuantitativeNeume.OligonPlusKentimaBelow,
          },
        },
      ),
    );
    layout();
    const after = savedNote(note);
    expect(note.fthora).toBe(Fthora.Enharmonic_Top);
    expect(note.fthoraCarry).toBeNull();
    workspace.commandService.undo();
    layout();
    expect(savedNote(note)).toEqual(before);
    expect(note.fthoraCarry).toBe(Fthora.Enharmonic_Top);
    expect(workspace.hasUnsavedChanges).toBe(false);
    workspace.commandService.redo();
    layout();
    expect(savedNote(note)).toEqual(after);
    expect(note.fthoraCarry).toBeNull();
  });
  it.each([
    ['fthora', 'fthoraCarry'],
    ['quantitativeNeumeFthora', 'quantitativeNeumeFthoraCarry'],
  ] as const)(
    'restores existing martyria %s carries across layout and undo/redo',
    (slot, carry) => {
      const workspace = new Workspace();
      const martyria = new MartyriaElement();
      martyria.auto = false;
      martyria.note = Note.Pa;
      martyria.alignRight = true;
      martyria.quantitativeNeume = QuantitativeNeume.Ison;
      martyria[slot] = Fthora.Enharmonic_Top;
      workspace.score.staff.elements = [martyria];
      const layout = () =>
        LayoutService.calculateMartyriae(
          workspace.score.staff.elements,
          workspace.score.pageSetup,
        );
      const snapshot = () => {
        const result = new SavedMartyriaElement();
        SaveService.SaveMartyria(result, martyria);
        return result;
      };
      layout();
      const before = snapshot();
      expect(martyria[slot]).toBeNull();
      expect(martyria[carry]).toBe(Fthora.Enharmonic_Top);
      workspace.commandService.execute(
        new CommandFactory<MartyriaElement>(createMartyriaUpdateCommand).create(
          'update-properties',
          {
            target: martyria,
            newValues: { note: Note.Ga },
          },
        ),
      );
      layout();
      const after = snapshot();
      expect(martyria[slot]).toBe(Fthora.Enharmonic_Top);
      expect(martyria[carry]).toBeNull();
      workspace.commandService.undo();
      layout();
      expect(snapshot()).toEqual(before);
      expect(martyria[carry]).toBe(Fthora.Enharmonic_Top);
      expect(workspace.hasUnsavedChanges).toBe(false);
      workspace.commandService.redo();
      layout();
      expect(snapshot()).toEqual(after);
      expect(martyria[carry]).toBeNull();
    },
  );
  it.each(
    Object.values(QuantitativeNeume).filter(
      (neume) =>
        neume !== QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
    ),
  )(
    'restores all persisted adornments when undoing a change to %s',
    (quantitativeNeume) => {
      const workspace = reactive(new Workspace()) as Workspace;
      const original = new NoteElement();
      original.quantitativeNeume =
        QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata;
      original.secondaryFthora = Fthora.SoftChromaticPa_TopSecondary;
      original.tertiaryFthora = Fthora.HardChromaticPa_TopTertiary;
      original.secondaryAccidental = Accidental.Sharp_2_LeftSecondary;
      original.tertiaryAccidental = Accidental.Flat_2_RightTertiary;
      original.secondaryGorgonNeume = GorgonNeume.GorgonSecondary;
      original.gorgonNeume = GorgonNeume.Gorgon_Bottom;
      original.timeNeume = TimeNeume.Klasma_Top;
      original.measureBarLeft = MeasureBar.MeasureBarShortDouble;
      workspace.score.staff.elements = [original];
      const note = workspace.score.staff.elements[0] as NoteElement;
      const secondaryFthora = computed(() => note.secondaryFthora);
      const before = savedNote(note);
      expect(secondaryFthora.value).toBe(before.secondaryFthora);
      workspace.commandService.execute(
        new CommandFactory<NoteElement>(createNoteUpdateCommand).create(
          'update-properties',
          {
            target: note,
            newValues: { quantitativeNeume },
          },
        ),
      );
      const after = savedNote(note);
      expect(secondaryFthora.value).toBe(note.secondaryFthora);
      workspace.commandService.undo();
      expect(savedNote(note)).toEqual(before);
      expect(secondaryFthora.value).toBe(before.secondaryFthora);
      expect(workspace.hasUnsavedChanges).toBe(false);
      workspace.commandService.redo();
      expect(savedNote(note)).toEqual(after);
      workspace.commandService.undo();
      expect(savedNote(note)).toEqual(before);
      expect(workspace.hasUnsavedChanges).toBe(false);
    },
  );
  it('restores a secondary fthora cleared by the quantitative-neume setter before reporting clean', () => {
    const workspace = new Workspace();
    const note = new NoteElement();
    note.quantitativeNeume = QuantitativeNeume.OligonPlusKentemata;
    note.secondaryFthora = Fthora.SoftChromaticPa_TopSecondary;
    note.secondaryFthoraOffsetX = 3;
    note.secondaryFthoraOffsetY = 5;
    workspace.score.staff.elements = [note];
    const before = savedNote(note);
    workspace.commandService.execute(
      new CommandFactory<NoteElement>(createNoteUpdateCommand).create(
        'update-properties',
        {
          target: note,
          newValues: { quantitativeNeume: QuantitativeNeume.Ison },
        },
      ),
    );
    const after = savedNote(note);
    expect(note.secondaryFthora).toBeNull();
    expect(workspace.hasUnsavedChanges).toBe(true);
    workspace.commandService.undo();
    expect(savedNote(note)).toEqual(before);
    expect(workspace.hasUnsavedChanges).toBe(false);
    workspace.commandService.redo();
    expect(savedNote(note)).toEqual(after);
    expect(workspace.hasUnsavedChanges).toBe(true);
  });
});
