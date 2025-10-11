import { throttle } from 'throttle-debounce';
import { inject, nextTick } from 'vue';

import DropCap from '@/components/DropCap.vue';
import {
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  ElementType,
  ImageBoxElement,
  LineBreakType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TempoElement,
  TextBoxElement,
} from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import {
  areVocalExpressionsEquivalent,
  getSecondaryNeume,
  measureBarAboveToLeft,
  onlyTakesBottomKlasma,
  onlyTakesTopGorgon,
  onlyTakesTopKlasma,
} from '@/models/NeumeReplacements';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  Note,
  QuantitativeNeume,
  TempoSign,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { ScaleNote } from '@/models/Scales';
import { Command } from '@/services/history/CommandService';
import { LyricService } from '@/services/LyricService';
import { useEditorStore } from '@/stores/useEditorStore';

import { useAlternateLines } from './useAlternateLines';
import { useCommandFactories } from './useCommandFactories';
import { useNavigation } from './useNavigation';
import { useSave } from './useSave';
import { useSelection } from './useSelection';

export function useEditing() {
  const lyricService = inject<LyricService>('lyricService')!;

  const editor = useEditorStore();
  const navigation = useNavigation();
  const {
    noteElementCommandFactory,
    textBoxCommandFactory,
    alternateLineCommandFactory,
    annotationCommandFactory,
    tempoCommandFactory,
    dropCapCommandFactory,
    martyriaCommandFactory,
    modeKeyCommandFactory,
    imageBoxCommandFactory,
    scoreElementCommandFactory,
    richTextBoxCommandFactory,
  } = useCommandFactories();
  const { save, saveDebounced } = useSave();
  const { setSelectedElement, isSelected } = useSelection();
  const { removeAlternateLine } = useAlternateLines();

  // TODO does this really belong here?
  function isLastElement(element: ScoreElement) {
    return element.index === editor.elements.length - 1;
  }

  const keydownThrottleIntervalMs = 100;

  const assignLyricsThrottled = throttle(
    keydownThrottleIntervalMs,
    assignLyrics,
  );

  function setKlasma(element: NoteElement) {
    if (onlyTakesBottomKlasma(element.quantitativeNeume)) {
      if (element.timeNeume === TimeNeume.Klasma_Bottom) {
        updateNoteAndSave(element, { timeNeume: null });
      } else {
        updateNoteAndSave(element, {
          timeNeume: TimeNeume.Klasma_Bottom,
        });
      }
      return;
    } else if (onlyTakesTopKlasma(element.quantitativeNeume)) {
      if (element.timeNeume === TimeNeume.Klasma_Top) {
        updateNoteAndSave(element, { timeNeume: null });
      } else {
        updateNoteAndSave(element, {
          timeNeume: TimeNeume.Klasma_Top,
        });
      }
      return;
    } else if (element.timeNeume == null) {
      updateNoteAndSave(element, {
        timeNeume: TimeNeume.Klasma_Top,
      });
    } else if (element.timeNeume === TimeNeume.Klasma_Top) {
      updateNoteAndSave(element, {
        timeNeume: TimeNeume.Klasma_Bottom,
      });
    } else if (element.timeNeume === TimeNeume.Klasma_Bottom) {
      updateNoteAndSave(element, { timeNeume: null });
    }
  }

  function setGorgon(
    element: NoteElement,
    neumes: GorgonNeume | GorgonNeume[],
  ) {
    let equivalent = false;

    // Force neumes to be an array if it's not
    neumes = Array.isArray(neumes) ? neumes : [neumes];

    for (const neume of neumes) {
      if (
        neume === GorgonNeume.Gorgon_Bottom &&
        onlyTakesTopGorgon(element.quantitativeNeume)
      ) {
        continue;
      }

      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        updateNoteAndSave(element, { gorgonNeume: neume });
        return;
      }

      equivalent = element.gorgonNeume === neume;
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // gorgon neumes. Otherwise set gorgon to the first neume
    // in the cycle.
    if (equivalent) {
      updateNoteAndSave(element, { gorgonNeume: null });
    } else {
      updateNoteAndSave(element, { gorgonNeume: neumes[0] });
    }
  }

  function setSecondaryGorgon(element: NoteElement, neume: GorgonNeume) {
    if (element.secondaryGorgonNeume === neume) {
      updateNoteAndSave(element, { secondaryGorgonNeume: null });
    } else {
      updateNoteAndSave(element, { secondaryGorgonNeume: neume });
    }
  }

  function setFthoraNote(element: NoteElement, neumes: Fthora[]) {
    let equivalent = false;

    for (const neume of neumes) {
      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        updateNoteFthora(element, neume);
        return;
      }

      equivalent = element.fthora === neume;
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // fthora neumes. Otherwise set fthora to the first neume
    // in the cycle.
    if (equivalent) {
      updateNoteFthora(element, null);
    } else {
      updateNoteFthora(element, neumes[0]);
    }
  }

  function setSecondaryFthora(element: NoteElement, neume: Fthora) {
    if (element.secondaryFthora === neume) {
      updateNoteFthoraSecondary(element, null);
    } else {
      updateNoteFthoraSecondary(element, neume);
    }
  }

  function setTertiaryFthora(element: NoteElement, neume: Fthora) {
    if (element.tertiaryFthora === neume) {
      updateNoteFthoraTertiary(element, null);
    } else {
      updateNoteFthoraTertiary(element, neume);
    }
  }

  function setFthoraMartyria(element: MartyriaElement, neume: Fthora) {
    if (element.fthora === neume) {
      updateMartyriaFthora(element, null);
    } else {
      updateMartyriaFthora(element, neume);
    }
  }

  function setMartyriaTempoLeft(element: MartyriaElement, neume: TempoSign) {
    if (element.tempoLeft === neume) {
      updateMartyriaTempoLeft(element, null);
    } else {
      updateMartyriaTempoLeft(element, neume);
    }
  }

  function setMartyriaTempo(element: MartyriaElement, neume: TempoSign) {
    if (element.tempo === neume) {
      updateMartyriaTempo(element, null);
    } else {
      updateMartyriaTempo(element, neume);
    }
  }

  function setMartyriaTempoRight(element: MartyriaElement, neume: TempoSign) {
    if (element.tempoRight === neume) {
      updateMartyriaTempoRight(element, null);
    } else {
      updateMartyriaTempoRight(element, neume);
    }
  }

  function setMartyriaQuantitativeNeume(
    element: MartyriaElement,
    neume: QuantitativeNeume,
  ) {
    if (element.quantitativeNeume === neume) {
      updateMartyria(element, { quantitativeNeume: null });
    } else {
      updateMartyria(element, { quantitativeNeume: neume });
    }
  }

  function setModeKeyTempo(element: ModeKeyElement, neume: TempoSign) {
    if (element.tempo === neume) {
      updateModeKeyTempo(element, null);
    } else {
      updateModeKeyTempo(element, neume);
    }
  }

  function setAccidental(element: NoteElement, neume: Accidental) {
    if (element.accidental != null && element.accidental === neume) {
      updateNoteAndSave(element, { accidental: null });
    } else {
      updateNoteAndSave(element, { accidental: neume });
    }
  }

  function setSecondaryAccidental(element: NoteElement, neume: Accidental) {
    if (
      element.secondaryAccidental != null &&
      element.secondaryAccidental === neume
    ) {
      updateNoteAndSave(element, { secondaryAccidental: null });
    } else {
      updateNoteAndSave(element, { secondaryAccidental: neume });
    }
  }

  function setTertiaryAccidental(element: NoteElement, neume: Accidental) {
    if (
      element.tertiaryAccidental != null &&
      element.tertiaryAccidental === neume
    ) {
      updateNoteAndSave(element, { tertiaryAccidental: null });
    } else {
      updateNoteAndSave(element, { tertiaryAccidental: neume });
    }
  }

  function setTimeNeume(element: NoteElement, neume: TimeNeume) {
    if (element.timeNeume === neume) {
      updateNoteAndSave(element, { timeNeume: null });
    } else {
      updateNoteAndSave(element, { timeNeume: neume });
    }
  }

  function setMeasureNumber(element: NoteElement, neume: MeasureNumber) {
    if (neume === element.measureNumber) {
      updateNoteAndSave(element, { measureNumber: null });
    } else {
      updateNoteAndSave(element, { measureNumber: neume });
    }
  }

  function setMeasureBarNote(element: NoteElement, neume: MeasureBar) {
    // Cycle through
    // Left
    // Right
    // Both Sides
    // None
    const normalizedMeasureBar = element.measureBarLeft?.endsWith('Above')
      ? measureBarAboveToLeft.get(element.measureBarLeft)
      : element.measureBarLeft;
    if (neume === normalizedMeasureBar && neume === element.measureBarRight) {
      updateNoteAndSave(element, {
        measureBarLeft: null,
        measureBarRight: null,
      });
    } else if (neume === normalizedMeasureBar) {
      updateNoteAndSave(element, {
        measureBarLeft: null,
        measureBarRight: neume,
      });
    } else if (neume === element.measureBarRight) {
      updateNoteAndSave(element, {
        measureBarLeft: neume,
        measureBarRight: neume,
      });
    } else {
      updateNoteAndSave(element, {
        measureBarLeft: neume,
        measureBarRight: null,
      });
    }
  }

  function setMeasureBarMartyria(element: MartyriaElement, neume: MeasureBar) {
    // Cycle through
    // Left
    // Right
    // Both Sides
    // None
    const normalizedMeasureBar = element.measureBarLeft?.endsWith('Above')
      ? measureBarAboveToLeft.get(element.measureBarLeft)
      : element.measureBarLeft;
    if (neume === normalizedMeasureBar && neume === element.measureBarRight) {
      updateMartyria(element, {
        measureBarLeft: null,
        measureBarRight: null,
      });
    } else if (neume === normalizedMeasureBar) {
      updateMartyria(element, {
        measureBarLeft: null,
        measureBarRight: neume,
      });
    } else if (neume === element.measureBarRight) {
      updateMartyria(element, {
        measureBarLeft: neume,
        measureBarRight: neume,
      });
    } else {
      updateMartyria(element, {
        measureBarLeft: neume,
        measureBarRight: null,
      });
    }
  }

  function setIson(element: NoteElement, neume: Ison) {
    if (neume === element.ison) {
      updateNoteAndSave(element, { ison: null });
    } else {
      updateNoteAndSave(element, { ison: neume });
    }
  }

  function setVocalExpression(
    element: NoteElement,
    neume: VocalExpressionNeume,
  ) {
    if (
      element.vocalExpressionNeume != null &&
      areVocalExpressionsEquivalent(neume, element.vocalExpressionNeume)
    ) {
      updateNoteExpression(element, null);
    } else {
      updateNoteExpression(element, neume);
    }
  }

  function setTie(element: NoteElement, neumes: Tie[]) {
    let equivalent = false;

    for (const neume of neumes) {
      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        updateNoteAndSave(element, { tie: neume });
        return;
      }

      equivalent = element.tie === neume;
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // fthora neumes. Otherwise set fthora to the first neume
    // in the cycle.
    if (equivalent) {
      updateNoteAndSave(element, { tie: null });
    } else {
      updateNoteAndSave(element, { tie: neumes[0] });
    }
  }

  function updateNoteAndSave(
    element: NoteElement,
    newValues: Partial<NoteElement>,
  ) {
    updateNote(element, newValues);
    save();
  }

  function updateNote(element: NoteElement, newValues: Partial<NoteElement>) {
    editor.commandService.execute(
      noteElementCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    // Force the element to update so that the neume toolbar updates
    element.keyHelper++;

    // If we change certain fields, we need to refresh the staff lyrics
    if (
      newValues.quantitativeNeume !== undefined ||
      newValues.tie !== undefined ||
      newValues.acceptsLyrics !== undefined
    ) {
      refreshStaffLyrics();
    }
  }

  function updateNoteFthora(element: NoteElement, fthora: Fthora | null) {
    let chromaticFthoraNote: ScaleNote | null = null;

    if (
      fthora === Fthora.SoftChromaticThi_Top ||
      fthora === Fthora.SoftChromaticThi_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Thi;
    } else if (
      fthora === Fthora.SoftChromaticPa_Top ||
      fthora === Fthora.SoftChromaticPa_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Ga;
    } else if (
      fthora === Fthora.HardChromaticThi_Top ||
      fthora === Fthora.HardChromaticThi_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Thi;
    } else if (
      fthora === Fthora.HardChromaticPa_Top ||
      fthora === Fthora.HardChromaticPa_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Pa;
    }

    updateNote(element, { fthora, chromaticFthoraNote });
    save();
  }

  function updateNoteFthoraSecondary(
    element: NoteElement,
    secondaryFthora: Fthora | null,
  ) {
    let secondaryChromaticFthoraNote: ScaleNote | null = null;

    if (secondaryFthora === Fthora.SoftChromaticThi_TopSecondary) {
      secondaryChromaticFthoraNote = ScaleNote.Thi;
    } else if (secondaryFthora === Fthora.SoftChromaticPa_TopSecondary) {
      secondaryChromaticFthoraNote = ScaleNote.Ga;
    } else if (secondaryFthora === Fthora.HardChromaticThi_TopSecondary) {
      secondaryChromaticFthoraNote = ScaleNote.Thi;
    } else if (secondaryFthora === Fthora.HardChromaticPa_TopSecondary) {
      secondaryChromaticFthoraNote = ScaleNote.Pa;
    }

    updateNote(element, { secondaryFthora, secondaryChromaticFthoraNote });
    save();
  }

  function updateNoteFthoraTertiary(
    element: NoteElement,
    tertiaryFthora: Fthora | null,
  ) {
    let tertiaryChromaticFthoraNote: ScaleNote | null = null;

    if (tertiaryFthora === Fthora.SoftChromaticThi_TopTertiary) {
      tertiaryChromaticFthoraNote = ScaleNote.Thi;
    } else if (tertiaryFthora === Fthora.SoftChromaticPa_TopTertiary) {
      tertiaryChromaticFthoraNote = ScaleNote.Ga;
    } else if (tertiaryFthora === Fthora.HardChromaticThi_TopTertiary) {
      tertiaryChromaticFthoraNote = ScaleNote.Thi;
    } else if (tertiaryFthora === Fthora.HardChromaticPa_TopTertiary) {
      tertiaryChromaticFthoraNote = ScaleNote.Pa;
    }

    updateNote(element, { tertiaryFthora, tertiaryChromaticFthoraNote });
    save();
  }

  function updateNoteExpression(
    element: NoteElement,
    vocalExpressionNeume: VocalExpressionNeume | null,
  ) {
    // Replace the psifiston with a slanted psifiston if the previous neume
    // contains a long heteron
    if (vocalExpressionNeume === VocalExpressionNeume.Psifiston) {
      const index = element.index;

      if (index > 0) {
        const previousElement = editor.elements[index - 1];

        if (previousElement.elementType === ElementType.Note) {
          const previousNote = previousElement as NoteElement;

          if (
            previousNote.vocalExpressionNeume ===
            VocalExpressionNeume.HeteronConnectingLong
          ) {
            vocalExpressionNeume = VocalExpressionNeume.PsifistonSlanted;
          }
        }
      }
    }

    updateNote(element, { vocalExpressionNeume });
    save();
  }

  function updateLyricsLocked(locked: boolean) {
    editor.setLyricsLocked(locked);
    editor.selectedWorkspace.hasUnsavedChanges = true;
  }

  function updateStaffLyrics(lyrics: string) {
    editor.setLyrics(lyrics);
    assignLyricsThrottled();
    editor.selectedWorkspace.hasUnsavedChanges = true;
  }

  function assignLyrics() {
    const updateCommands: Command[] = [];

    lyricService.assignLyrics(
      editor.lyrics,
      editor.elements,
      editor.rtl,
      editor.score.pageSetup.disableGreekMelismata,
      (note, lyrics) => setLyricsOnHtmlElement(note.index, lyrics),
      (note, newValues) => {
        note.updated = true;
        updateCommands.push(
          noteElementCommandFactory.create('update-properties', {
            target: note,
            newValues,
          }),
        );
      },
      (dropCap, token) => {
        updateCommands.push(
          dropCapCommandFactory.create('update-properties', {
            target: dropCap,
            newValues: { content: token },
          }),
        );
      },
    );

    if (updateCommands.length > 0) {
      editor.commandService.executeAsBatch(updateCommands, editor.lyricsLocked);
      save();
    }
  }

  function assignAcceptsLyricsFromCurrentLyrics() {
    const commands: Command[] = [];

    lyricService.assignAcceptsLyricsFromCurrentLyrics(
      editor.elements,
      editor.score.pageSetup.disableGreekMelismata,
      (note, acceptsLyrics) => {
        commands.push(
          noteElementCommandFactory.create('update-properties', {
            target: note,
            newValues: {
              acceptsLyrics,
            },
          }),
        );
      },
    );

    if (commands.length > 0) {
      editor.commandService.executeAsBatch(commands);
      refreshStaffLyrics();
      save();
    }
  }

  function setLyricsOnHtmlElement(index: number, lyrics: string) {
    if (editor.lyricRefs[index]) {
      editor.lyricRefs[index].setInnerText(lyrics);
    }
  }

  function updateLyrics(
    element: NoteElement,
    lyrics: string,
    clearMelisma: boolean = false,
  ) {
    const newValues = lyricService.getLyricUpdateValues(
      element,
      lyrics,
      editor.elements,
      editor.rtl,
      (note, lyrics) => setLyricsOnHtmlElement(note.index, lyrics),
      clearMelisma,
    );

    if (newValues != null) {
      editor.commandService.execute(
        noteElementCommandFactory.create('update-properties', {
          target: element,
          newValues,
        }),
      );
      refreshStaffLyrics();
      save();
    }
  }

  function refreshStaffLyrics() {
    if (editor.lyricsLocked) {
      assignLyrics();
    } else if (editor.lyricManagerIsOpen) {
      editor.setLyrics(
        lyricService.extractLyrics(
          editor.elements,
          editor.score.pageSetup.disableGreekMelismata,
        ),
      );
    }
  }

  function updateAnnotation(
    element: AnnotationElement,
    newValues: Partial<AnnotationElement>,
  ) {
    editor.commandService.execute(
      annotationCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    save();
  }

  function removeAnnotation(
    note: NoteElement,
    annotation: AnnotationElement,
    noHistory: boolean = false,
  ) {
    editor.commandService.execute(
      annotationCommandFactory.create('remove-from-collection', {
        element: annotation,
        collection: note.annotations,
      }),
      noHistory,
    );

    editor.selectedWorkspace.selectedAnnotationElement = null;

    save();
  }

  function updateAlternateLine(
    element: AlternateLineElement,
    newValues: Partial<AlternateLineElement>,
  ) {
    editor.commandService.execute(
      alternateLineCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    save();
  }

  function updateRichTextBox(
    element: RichTextBoxElement,
    newValues: Partial<RichTextBoxElement>,
  ) {
    if (newValues.rtl != null) {
      element.keyHelper++;
    }

    const heightProp: keyof RichTextBoxElement = 'height';

    const noHistory =
      Object.keys(newValues).length === 1 && heightProp in newValues;

    editor.commandService.execute(
      richTextBoxCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
      noHistory,
    );

    const modeChangeProp: keyof RichTextBoxElement = 'modeChange';

    if (modeChangeProp in newValues) {
      refreshStaffLyrics();
    }

    save(!noHistory);
  }

  function updateRichTextBoxHeight(
    element: RichTextBoxElement,
    height: number,
  ) {
    // The height could be updated by many rich text box elements at once
    // (e.g. if PageSetup changes) so we debounce the save.
    element.height = height;
    editor.richTextBoxCalculationCount++;
    saveDebounced(false);
  }

  function updateTextBox(
    element: TextBoxElement,
    newValues: Partial<TextBoxElement>,
  ) {
    const noHistory =
      Object.keys(newValues).length === 1 && 'height' in newValues;

    editor.commandService.execute(
      textBoxCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
      noHistory,
    );

    save(!noHistory);
  }

  function updateTextBoxHeight(element: TextBoxElement, height: number) {
    // The height could be updated by many rich text box elements at once
    // (e.g. if PageSetup changes) so we debounce the save.
    element.height = height;
    editor.textBoxCalculationCount++;
    saveDebounced(false);
  }

  function updateModeKey(
    element: ModeKeyElement,
    newValues: Partial<ModeKeyElement>,
  ) {
    editor.commandService.execute(
      modeKeyCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    save();
  }

  function updateModeKeyTempo(
    element: ModeKeyElement,
    tempo: TempoSign | null,
  ) {
    let bpm = element.bpm;

    if (tempo != null) {
      bpm =
        editor.editorPreferences.getDefaultTempo(tempo) ??
        TempoElement.getDefaultBpm(tempo);
    }

    updateModeKey(element, { tempo, bpm });
  }

  function updateModeKeyFromTemplate(
    element: ModeKeyElement,
    template: ModeKeyElement,
  ) {
    const {
      templateId,
      mode,
      scale,
      scaleNote,
      fthora,
      martyria,
      fthoraAboveNote,
      fthoraAboveNote2,
      fthoraAboveQuantitativeNeumeRight,
      note,
      note2,
      quantitativeNeumeAboveNote,
      quantitativeNeumeAboveNote2,
      quantitativeNeumeRight,
    } = template;

    const newValues = {
      templateId,
      mode,
      scale,
      scaleNote,
      fthora,
      martyria,
      fthoraAboveNote,
      fthoraAboveNote2,
      fthoraAboveQuantitativeNeumeRight,
      note,
      note2,
      quantitativeNeumeAboveNote,
      quantitativeNeumeAboveNote2,
      quantitativeNeumeRight,
    };

    updateModeKey(element, newValues);

    save();
  }

  function updateMartyria(
    element: MartyriaElement,
    newValues: Partial<MartyriaElement>,
  ) {
    editor.commandService.execute(
      martyriaCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    save();
  }

  function updateMartyriaFthora(
    element: MartyriaElement,
    fthora: Fthora | null,
  ) {
    let chromaticFthoraNote: ScaleNote | null = null;

    if (
      fthora === Fthora.SoftChromaticThi_Top ||
      fthora === Fthora.SoftChromaticThi_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Thi;
    } else if (
      fthora === Fthora.SoftChromaticPa_Top ||
      fthora === Fthora.SoftChromaticPa_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Ga;
    } else if (
      fthora === Fthora.HardChromaticThi_Top ||
      fthora === Fthora.HardChromaticThi_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Thi;
    } else if (
      fthora === Fthora.HardChromaticPa_Top ||
      fthora === Fthora.HardChromaticPa_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Pa;
    }

    updateMartyria(element, { fthora, chromaticFthoraNote });
  }

  function updateMartyriaTempoLeft(
    element: MartyriaElement,
    tempoLeft: TempoSign | null,
  ) {
    let bpm = element.bpm;

    if (tempoLeft != null) {
      bpm =
        editor.editorPreferences.getDefaultTempo(tempoLeft) ??
        TempoElement.getDefaultBpm(tempoLeft);
    }

    updateMartyria(element, {
      tempoLeft,
      bpm,
      tempo: null,
      tempoRight: null,
    });
  }

  function updateMartyriaTempo(
    element: MartyriaElement,
    tempo: TempoSign | null,
  ) {
    let bpm = element.bpm;

    if (tempo != null) {
      bpm =
        editor.editorPreferences.getDefaultTempo(tempo) ??
        TempoElement.getDefaultBpm(tempo);
    }

    updateMartyria(element, {
      tempo,
      bpm,
      tempoLeft: null,
      tempoRight: null,
    });
  }

  function updateMartyriaTempoRight(
    element: MartyriaElement,
    tempoRight: TempoSign | null,
  ) {
    let bpm = element.bpm;

    if (tempoRight != null) {
      bpm =
        editor.editorPreferences.getDefaultTempo(tempoRight) ??
        TempoElement.getDefaultBpm(tempoRight);
    }

    updateMartyria(element, {
      tempoRight,
      bpm,
      tempoLeft: null,
      tempo: null,
    });
  }

  function updateTempo(
    element: TempoElement,
    newValues: Partial<TempoElement>,
  ) {
    editor.commandService.execute(
      tempoCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    save();
  }

  function updateDropCap(
    element: DropCapElement,
    newValues: Partial<DropCapElement>,
  ) {
    editor.commandService.execute(
      dropCapCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    save();
  }

  function updateDropCapContent(element: DropCapElement, content: string) {
    // Replace newlines. This should only happen if the user pastes
    // text containing new lines.
    const sanitizedContent = content.replace(/(?:\r\n|\r|\n)/g, ' ');
    if (sanitizedContent !== content) {
      content = sanitizedContent;

      // Force the lyrics to re-render
      element.keyHelper++;
    }

    if (content === '') {
      const index = element.index;

      if (index > -1) {
        if (editor.selectedElement === element) {
          setSelectedElement(null);
        }

        removeScoreElement(element);
      }
    } else if (element.content !== content) {
      editor.commandService.execute(
        dropCapCommandFactory.create('update-properties', {
          target: element,
          newValues: { content },
        }),
      );

      refreshStaffLyrics();
    }

    save();
  }

  function updateImageBox(
    element: ImageBoxElement,
    newValues: Partial<ImageBoxElement>,
  ) {
    editor.commandService.execute(
      imageBoxCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    save();
  }

  function addQuantitativeNeume(
    quantitativeNeume: QuantitativeNeume,
    secondaryGorgonNeume: GorgonNeume | null = null,
  ) {
    if (editor.selectedElement == null) {
      return;
    }

    const element = new NoteElement();
    element.lyricsColor = editor.score.pageSetup.lyricsDefaultColor;
    element.lyricsFontFamily = editor.score.pageSetup.lyricsDefaultFontFamily;
    element.lyricsFontSize = editor.score.pageSetup.lyricsDefaultFontSize;
    element.lyricsFontStyle = editor.score.pageSetup.lyricsDefaultFontStyle;
    element.lyricsFontWeight = editor.score.pageSetup.lyricsDefaultFontWeight;
    element.lyricsStrokeWidth = editor.score.pageSetup.lyricsDefaultStrokeWidth;

    element.quantitativeNeume = quantitativeNeume;
    // Special case for neumes with secondary gorgon
    if (getSecondaryNeume(quantitativeNeume) != null) {
      element.secondaryGorgonNeume = secondaryGorgonNeume;
    }

    // If the selected element is an alternate line element,
    // add the new element to the alternate line's elements
    // and return immediately. Alternate lines do not support
    // different entry modes.
    if (editor.selectedWorkspace.selectedAlternateLineElement != null) {
      addScoreElement(
        element,
        editor.selectedWorkspace.selectedAlternateLineElement.elements.length,
        editor.selectedWorkspace.selectedAlternateLineElement.elements,
      );
      save();
      return;
    }

    switch (editor.entryMode) {
      case EntryMode.Auto:
        if (!isLastElement(editor.selectedElement) && !navigation.moveRight()) {
          return;
        }

        if (isLastElement(editor.selectedElement)) {
          addScoreElement(element, editor.selectedElementIndex);
          setSelectedElement(element);
        } else {
          if (editor.selectedElement.elementType === ElementType.Note) {
            if (
              (editor.selectedElement as NoteElement).quantitativeNeume !==
              quantitativeNeume
            ) {
              updateNote(editor.selectedElement as NoteElement, {
                quantitativeNeume,
                secondaryGorgonNeume,
              });
            } else if (
              (editor.selectedElement as NoteElement).secondaryGorgonNeume !==
              secondaryGorgonNeume
            ) {
              // Special case for hyporoe gorgon
              updateNote(editor.selectedElement as NoteElement, {
                secondaryGorgonNeume,
              });
            }
          } else {
            setSelectedElement(
              switchToSyllable(editor.selectedElement, element),
            );
          }
        }
        break;
      case EntryMode.Insert:
        if (isLastElement(editor.selectedElement)) {
          addScoreElement(element, editor.selectedElementIndex);
        } else {
          if (editor.selectedElement.elementType === ElementType.Note) {
            const selectedElementAsNote = editor.selectedElement as NoteElement;

            element.isMelisma = selectedElementAsNote.isMelisma;
            element.isHyphen = selectedElementAsNote.isHyphen;
          }

          addScoreElement(element, editor.selectedElementIndex + 1);
        }
        setSelectedElement(element);
        break;

      case EntryMode.Edit:
        if (isLastElement(editor.selectedElement)) {
          addScoreElement(element, editor.selectedElementIndex);
        } else if (editor.selectedElement.elementType === ElementType.Note) {
          if (
            (editor.selectedElement as NoteElement).quantitativeNeume !==
            quantitativeNeume
          ) {
            updateNote(editor.selectedElement as NoteElement, {
              quantitativeNeume,
              secondaryGorgonNeume,
            });
          } else if (
            (editor.selectedElement as NoteElement).secondaryGorgonNeume !==
            secondaryGorgonNeume
          ) {
            // Special case for hyporoe gorgon
            updateNote(editor.selectedElement as NoteElement, {
              secondaryGorgonNeume,
            });
          }
        } else if (
          navigation.navigableElements.includes(
            editor.selectedElement.elementType,
          )
        ) {
          setSelectedElement(switchToSyllable(editor.selectedElement, element));
        }
        break;
    }

    save();
  }

  function addAutoMartyria(alignRight?: boolean, note?: Note) {
    if (editor.selectedElement == null) {
      return;
    }

    const element = new MartyriaElement();
    element.alignRight = alignRight === true;

    if (note != null) {
      element.note = note;
      element.auto = false;
    }

    switch (editor.entryMode) {
      case EntryMode.Auto:
        navigation.moveRight();

        if (isLastElement(editor.selectedElement)) {
          addScoreElement(element, editor.selectedElementIndex);
          setSelectedElement(element);
        } else {
          if (editor.selectedElement.elementType != ElementType.Martyria) {
            setSelectedElement(switchToMartyria(editor.selectedElement));
          }
        }
        break;
      case EntryMode.Insert:
        if (isLastElement(editor.selectedElement)) {
          addScoreElement(element, editor.selectedElementIndex);
        } else {
          addScoreElement(element, editor.selectedElementIndex + 1);
        }
        setSelectedElement(element);
        break;
      case EntryMode.Edit:
        if (isLastElement(editor.selectedElement)) {
          addScoreElement(element, editor.selectedElementIndex);
        } else if (editor.selectedElement.elementType != ElementType.Martyria) {
          setSelectedElement(switchToMartyria(editor.selectedElement));
        }
        break;
    }

    save();
  }

  function addTempo(neume: TempoSign) {
    if (editor.selectedElement == null) {
      return;
    }

    const element = new TempoElement();
    element.neume = neume;
    element.bpm =
      editor.editorPreferences.getDefaultTempo(neume) ??
      TempoElement.getDefaultBpm(neume);

    switch (editor.entryMode) {
      case EntryMode.Auto:
        navigation.moveRight();

        if (isLastElement(editor.selectedElement)) {
          addScoreElement(element, editor.selectedElementIndex);
          setSelectedElement(element);
        } else {
          if (editor.selectedElement.elementType === ElementType.Tempo) {
            if ((editor.selectedElement as TempoElement).neume !== neume) {
              updateTempo(editor.selectedElement as TempoElement, {
                neume,
              });
            }
          } else {
            setSelectedElement(switchToTempo(editor.selectedElement, element));
          }
        }
        break;
      case EntryMode.Insert:
        if (isLastElement(editor.selectedElement)) {
          addScoreElement(element, editor.selectedElementIndex);
        } else {
          addScoreElement(element, editor.selectedElementIndex + 1);
        }
        setSelectedElement(element);
        break;
      case EntryMode.Edit:
        if (isLastElement(editor.selectedElement)) {
          addScoreElement(element, editor.selectedElementIndex);
        } else if (editor.selectedElement.elementType === ElementType.Tempo) {
          if ((editor.selectedElement as TempoElement).neume !== neume) {
            updateTempo(editor.selectedElement as TempoElement, {
              neume,
            });
          }
        } else {
          setSelectedElement(switchToTempo(editor.selectedElement, element));
        }
        break;
    }

    save();
  }

  function addDropCap(after: boolean) {
    if (editor.selectedElement == null) {
      return;
    }

    const element = new DropCapElement();

    element.color = editor.score.pageSetup.dropCapDefaultColor;
    element.fontFamily = editor.score.pageSetup.dropCapDefaultFontFamily;
    element.fontSize = editor.score.pageSetup.dropCapDefaultFontSize;
    element.strokeWidth = editor.score.pageSetup.dropCapDefaultStrokeWidth;
    element.fontWeight = editor.score.pageSetup.dropCapDefaultFontWeight;
    element.fontStyle = editor.score.pageSetup.dropCapDefaultFontStyle;
    element.lineHeight = editor.score.pageSetup.dropCapDefaultLineHeight;
    element.lineSpan = editor.score.pageSetup.dropCapDefaultLineSpan;

    if (after && !isLastElement(editor.selectedElement)) {
      addScoreElement(element, editor.selectedElementIndex + 1);
    } else {
      addScoreElement(element, editor.selectedElementIndex);
    }

    setSelectedElement(element);
    save();

    nextTick(() => {
      (
        editor.elementRefs[element.index] as InstanceType<typeof DropCap>
      ).focus();
    });
  }

  function addScoreElement(
    element: ScoreElement,
    insertAtIndex?: number,
    collection: ScoreElement[] = editor.elements,
  ) {
    editor.commandService.execute(
      scoreElementCommandFactory.create('add-to-collection', {
        elements: [element],
        collection,
        insertAtIndex,
      }),
    );

    refreshStaffLyrics();
  }

  function addScoreElements(elements: ScoreElement[], insertAtIndex?: number) {
    editor.commandService.execute(
      scoreElementCommandFactory.create('add-to-collection', {
        elements,
        collection: editor.elements,
        insertAtIndex,
      }),
    );

    refreshStaffLyrics();
  }

  function replaceScoreElement(element: ScoreElement, replaceAtIndex: number) {
    editor.commandService.execute(
      scoreElementCommandFactory.create('replace-element-in-collection', {
        element,
        collection: editor.elements,
        replaceAtIndex,
      }),
    );

    refreshStaffLyrics();
  }

  function removeScoreElement(
    element: ScoreElement,
    collection: ScoreElement[] = editor.elements,
  ) {
    editor.commandService.execute(
      scoreElementCommandFactory.create('remove-from-collection', {
        element,
        collection,
      }),
    );

    refreshStaffLyrics();
  }

  function deleteSelectedElement() {
    if (
      editor.selectedWorkspace.selectedAnnotationElement != null &&
      editor.selectedElement?.elementType === ElementType.Note
    ) {
      removeAnnotation(
        editor.selectedElement as NoteElement,
        editor.selectedWorkspace.selectedAnnotationElement,
      );

      return;
    }

    if (
      editor.selectedWorkspace.selectedAlternateLineElement != null &&
      editor.selectedElement?.elementType === ElementType.Note
    ) {
      removeAlternateLine(
        editor.selectedElement as NoteElement,
        editor.selectedWorkspace.selectedAlternateLineElement,
      );

      return;
    }

    if (
      editor.selectedElement != null &&
      !isLastElement(editor.selectedElement)
    ) {
      const index = editor.selectedElementIndex;

      removeScoreElement(editor.selectedElement);

      setSelectedElement(editor.elements[index]);

      save();
    } else if (editor.selectionRange != null) {
      const elementsToDelete = editor.elements.filter(
        (x) => x.elementType != ElementType.Empty && isSelected(x),
      );

      editor.commandService.executeAsBatch(
        elementsToDelete.map((element) =>
          scoreElementCommandFactory.create('remove-from-collection', {
            element,
            collection: editor.elements,
          }),
        ),
      );

      refreshStaffLyrics();

      const start = Math.min(
        editor.selectionRange.start,
        editor.selectionRange.end,
      );

      setSelectedElement(
        editor.elements[Math.min(start, editor.elements.length - 1)],
      );

      save();
    }
  }

  function switchToMartyria(element: ScoreElement) {
    const newElement = new MartyriaElement();
    newElement.pageBreak = element.pageBreak;
    newElement.lineBreak = element.lineBreak;

    replaceScoreElement(newElement, element.index);

    return newElement;
  }

  function switchToTempo(oldElement: ScoreElement, newElement: TempoElement) {
    newElement.pageBreak = oldElement.pageBreak;
    newElement.lineBreak = oldElement.lineBreak;

    replaceScoreElement(newElement, oldElement.index);

    return newElement;
  }

  function switchToSyllable(oldElement: ScoreElement, newElement: NoteElement) {
    newElement.pageBreak = oldElement.pageBreak;
    newElement.lineBreak = oldElement.lineBreak;

    replaceScoreElement(newElement, oldElement.index);

    return newElement;
  }

  function togglePageBreak() {
    if (editor.selectedElement && !isLastElement(editor.selectedElement)) {
      editor.commandService.execute(
        scoreElementCommandFactory.create('update-properties', {
          target: editor.selectedElement,
          newValues: {
            pageBreak: !editor.selectedElement.pageBreak,
            lineBreak: false,
          },
        }),
      );

      save();
    }
  }

  function toggleLineBreak(lineBreakType: LineBreakType | null) {
    if (editor.selectedElement && !isLastElement(editor.selectedElement)) {
      let lineBreak = !editor.selectedElement.lineBreak;

      if (lineBreakType != editor.selectedElement.lineBreakType) {
        lineBreak = true;
      }

      if (!lineBreak) {
        lineBreakType = null;
      }

      editor.commandService.execute(
        scoreElementCommandFactory.create('update-properties', {
          target: editor.selectedElement,
          newValues: {
            lineBreak,
            pageBreak: false,
            lineBreakType,
          },
        }),
      );

      save();
    }
  }

  function updateScoreElementSectionName(
    element: ScoreElement,
    sectionName: string | null,
  ) {
    if (sectionName != null && sectionName.trim() == '') {
      sectionName = null;
    }

    editor.commandService.execute(
      scoreElementCommandFactory.create('update-properties', {
        target: element,
        newValues: {
          sectionName,
        },
      }),
    );

    save();
  }

  function recalculateRichTextBoxHeights() {
    if (editor.richTextBoxCalculation) {
      editor.richTextBoxCalculation = false;
    }

    nextTick(async () => {
      const expectedCount = editor.resizableRichTextBoxElements.length;
      editor.richTextBoxCalculationCount = 0;
      editor.richTextBoxCalculation = true;

      const maxTries = 4 * 30; // 30 seconds
      let tries = 1;
      let lastCount = 0;

      // Wait until all rich text boxes have updated
      const poll = (resolve: (value: unknown) => void) => {
        if (
          editor.richTextBoxCalculationCount === expectedCount ||
          tries >= maxTries ||
          editor.richTextBoxCalculationCount < lastCount
        ) {
          resolve(true);
        } else {
          tries++;
          lastCount = editor.richTextBoxCalculationCount;
          setTimeout(() => poll(resolve), 250);
        }
      };

      await new Promise(poll);

      editor.richTextBoxCalculation = false;
      saveDebounced(false);
    });
  }

  function recalculateTextBoxHeights() {
    if (editor.textBoxCalculation) {
      editor.textBoxCalculation = false;
    }

    nextTick(async () => {
      const expectedCount = editor.resizableRichTextBoxElements.length;
      editor.textBoxCalculationCount = 0;
      editor.textBoxCalculation = true;

      const maxTries = 4 * 30; // 30 seconds
      let tries = 1;
      let lastCount = 0;

      // Wait until all rich text boxes have updated
      const poll = (resolve: (value: unknown) => void) => {
        if (
          editor.textBoxCalculationCount === expectedCount ||
          tries >= maxTries ||
          editor.textBoxCalculationCount < lastCount
        ) {
          resolve(true);
        } else {
          tries++;
          lastCount = editor.textBoxCalculationCount;
          setTimeout(() => poll(resolve), 250);
        }
      };

      await new Promise(poll);

      editor.textBoxCalculation = false;
      saveDebounced(false);
    });
  }

  return {
    updateNoteAndSave,
    updateNoteFthora,
    updateNoteFthoraSecondary,
    updateNoteFthoraTertiary,
    updateNoteExpression,
    updateLyricsLocked,
    updateStaffLyrics,
    updateLyrics,
    assignLyrics,
    assignAcceptsLyricsFromCurrentLyrics,
    updateAnnotation,
    removeAnnotation,
    updateAlternateLine,
    updateRichTextBox,
    updateRichTextBoxHeight,
    updateTextBox,
    updateTextBoxHeight,
    updateModeKey,
    updateModeKeyTempo,
    updateModeKeyFromTemplate,
    updateMartyria,
    updateMartyriaFthora,
    updateMartyriaTempoLeft,
    updateMartyriaTempo,
    updateMartyriaTempoRight,
    setAccidental,
    setFthoraMartyria,
    updateTempo,
    updateDropCap,
    updateDropCapContent,
    updateImageBox,
    setGorgon,
    setVocalExpression,
    setTie,
    setIson,
    setKlasma,
    setFthoraNote,
    setMartyriaTempo,
    setModeKeyTempo,
    setTimeNeume,
    setMeasureBarMartyria,
    setMeasureBarNote,
    setSecondaryAccidental,
    setSecondaryFthora,
    setSecondaryGorgon,
    setTertiaryAccidental,
    setTertiaryFthora,
    setMartyriaQuantitativeNeume,
    setMartyriaTempoLeft,
    setMartyriaTempoRight,
    setMeasureNumber,
    addTempo,
    addScoreElements,
    removeScoreElement,
    addScoreElement,
    deleteSelectedElement,
    replaceScoreElement,
    addQuantitativeNeume,
    addAutoMartyria,
    addDropCap,
    switchToMartyria,
    switchToTempo,
    switchToSyllable,
    refreshStaffLyrics,
    isLastElement,
    toggleLineBreak,
    togglePageBreak,
    updateScoreElementSectionName,
    recalculateRichTextBoxHeights,
    recalculateTextBoxHeights,
  };
}
