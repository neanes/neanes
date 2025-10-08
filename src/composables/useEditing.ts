import { throttle } from 'throttle-debounce';
import { inject, nextTick } from 'vue';

import DropCap from '@/components/DropCap.vue';
import {
  AcceptsLyricsOption,
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
  TextBoxAlignment,
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
  RootSign,
  TempoSign,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { Scale, ScaleNote } from '@/models/Scales';
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
        updateNoteTime(element, null);
      } else {
        updateNoteTime(element, TimeNeume.Klasma_Bottom);
      }
      return;
    } else if (onlyTakesTopKlasma(element.quantitativeNeume)) {
      if (element.timeNeume === TimeNeume.Klasma_Top) {
        updateNoteTime(element, null);
      } else {
        updateNoteTime(element, TimeNeume.Klasma_Top);
      }
      return;
    } else if (element.timeNeume == null) {
      updateNoteTime(element, TimeNeume.Klasma_Top);
    } else if (element.timeNeume === TimeNeume.Klasma_Top) {
      updateNoteTime(element, TimeNeume.Klasma_Bottom);
    } else if (element.timeNeume === TimeNeume.Klasma_Bottom) {
      updateNoteTime(element, null);
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
        updateNoteGorgon(element, neume);
        return;
      }

      equivalent = element.gorgonNeume === neume;
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // gorgon neumes. Otherwise set gorgon to the first neume
    // in the cycle.
    if (equivalent) {
      updateNoteGorgon(element, null);
    } else {
      updateNoteGorgon(element, neumes[0]);
    }
  }

  function setSecondaryGorgon(element: NoteElement, neume: GorgonNeume) {
    if (element.secondaryGorgonNeume === neume) {
      updateNoteGorgonSecondary(element, null);
    } else {
      updateNoteGorgonSecondary(element, neume);
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
      updateMartyriaQuantitativeNeume(element, null);
    } else {
      updateMartyriaQuantitativeNeume(element, neume);
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
      updateNoteAccidental(element, null);
    } else {
      updateNoteAccidental(element, neume);
    }
  }

  function setSecondaryAccidental(element: NoteElement, neume: Accidental) {
    if (
      element.secondaryAccidental != null &&
      element.secondaryAccidental === neume
    ) {
      updateNoteAccidentalSecondary(element, null);
    } else {
      updateNoteAccidentalSecondary(element, neume);
    }
  }

  function setTertiaryAccidental(element: NoteElement, neume: Accidental) {
    if (
      element.tertiaryAccidental != null &&
      element.tertiaryAccidental === neume
    ) {
      updateNoteAccidentalTertiary(element, null);
    } else {
      updateNoteAccidentalTertiary(element, neume);
    }
  }

  function setTimeNeume(element: NoteElement, neume: TimeNeume) {
    if (element.timeNeume === neume) {
      updateNoteTime(element, null);
    } else {
      updateNoteTime(element, neume);
    }
  }

  function setMeasureNumber(element: NoteElement, neume: MeasureNumber) {
    if (neume === element.measureNumber) {
      updateNoteMeasureNumber(element, null);
    } else {
      updateNoteMeasureNumber(element, neume);
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
      updateNoteMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: null,
      });
    } else if (neume === normalizedMeasureBar) {
      updateNoteMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: neume,
      });
    } else if (neume === element.measureBarRight) {
      updateNoteMeasureBar(element, {
        measureBarLeft: neume,
        measureBarRight: neume,
      });
    } else {
      updateNoteMeasureBar(element, {
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
      updateMartyriaMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: null,
      });
    } else if (neume === normalizedMeasureBar) {
      updateMartyriaMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: neume,
      });
    } else if (neume === element.measureBarRight) {
      updateMartyriaMeasureBar(element, {
        measureBarLeft: neume,
        measureBarRight: neume,
      });
    } else {
      updateMartyriaMeasureBar(element, {
        measureBarLeft: neume,
        measureBarRight: null,
      });
    }
  }

  function setIson(element: NoteElement, neume: Ison) {
    if (neume === element.ison) {
      updateNoteIson(element, null);
    } else {
      updateNoteIson(element, neume);
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
        updateNoteTie(element, neume);
        return;
      }

      equivalent = element.tie === neume;
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // fthora neumes. Otherwise set fthora to the first neume
    // in the cycle.
    if (equivalent) {
      updateNoteTie(element, null);
    } else {
      updateNoteTie(element, neumes[0]);
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

  function updateNoteLyricsUseDefaultStyle(
    element: NoteElement,
    lyricsUseDefaultStyle: boolean,
  ) {
    updateNote(element, { lyricsUseDefaultStyle });
    save();
  }

  function updateNoteLyricsColor(element: NoteElement, lyricsColor: string) {
    updateNote(element, { lyricsColor });
    save();
  }

  function updateNoteLyricsFontFamily(
    element: NoteElement,
    lyricsFontFamily: string,
  ) {
    updateNote(element, { lyricsFontFamily });
    save();
  }

  function updateNoteLyricsFontSize(
    element: NoteElement,
    lyricsFontSize: number,
  ) {
    updateNote(element, { lyricsFontSize });
    save();
  }

  function updateNoteLyricsStrokeWidth(
    element: NoteElement,
    lyricsStrokeWidth: number,
  ) {
    updateNote(element, { lyricsStrokeWidth });
    save();
  }

  function updateNoteLyricsFontWeight(element: NoteElement, bold: boolean) {
    updateNote(element, { lyricsFontWeight: bold ? '700' : '400' });
    save();
  }

  function updateNoteLyricsFontStyle(element: NoteElement, italic: boolean) {
    updateNote(element, { lyricsFontStyle: italic ? 'italic' : 'normal' });
    save();
  }

  function updateNoteLyricsTextDecoration(
    element: NoteElement,
    underline: boolean,
  ) {
    updateNote(element, {
      lyricsTextDecoration: underline ? 'underline' : 'none',
    });
    save();
  }

  function updateNoteAccidental(
    element: NoteElement,
    accidental: Accidental | null,
  ) {
    updateNote(element, { accidental });
    save();
  }

  function updateNoteAccidentalSecondary(
    element: NoteElement,
    secondaryAccidental: Accidental | null,
  ) {
    updateNote(element, { secondaryAccidental });
    save();
  }

  function updateNoteAccidentalTertiary(
    element: NoteElement,
    tertiaryAccidental: Accidental | null,
  ) {
    updateNote(element, { tertiaryAccidental });
    save();
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

  function updateNoteTime(element: NoteElement, timeNeume: TimeNeume | null) {
    updateNote(element, { timeNeume });
    save();
  }

  function updateNoteGorgon(
    element: NoteElement,
    gorgonNeume: GorgonNeume | null,
  ) {
    updateNote(element, { gorgonNeume });
    save();
  }

  function updateNoteGorgonSecondary(
    element: NoteElement,
    secondaryGorgonNeume: GorgonNeume | null,
  ) {
    updateNote(element, { secondaryGorgonNeume });
    save();
  }

  function updateNoteMeasureBar(
    element: NoteElement,
    {
      measureBarLeft,
      measureBarRight,
    }: {
      measureBarLeft: MeasureBar | null;
      measureBarRight: MeasureBar | null;
    },
  ) {
    updateNote(element, {
      measureBarLeft,
      measureBarRight,
    });
    save();
  }

  function updateNoteMeasureNumber(
    element: NoteElement,
    measureNumber: MeasureNumber | null,
  ) {
    updateNote(element, { measureNumber });
    save();
  }

  function updateNoteNoteIndicator(
    element: NoteElement,
    noteIndicator: boolean,
  ) {
    updateNote(element, { noteIndicator });
    save();
  }

  function updateNoteIson(element: NoteElement, ison: Ison | null) {
    updateNote(element, { ison });
    save();
  }

  function updateNoteKoronis(element: NoteElement, koronis: boolean) {
    updateNote(element, { koronis });
    save();
  }

  function updateNoteStavros(element: NoteElement, stavros: boolean) {
    updateNote(element, { stavros });
    save();
  }

  function updateNoteVareia(element: NoteElement, vareia: boolean) {
    updateNote(element, { vareia });
    save();
  }

  function updateNoteTie(element: NoteElement, tie: Tie | null) {
    updateNote(element, { tie });
    save();
  }

  function updateNoteSpaceAfter(element: NoteElement, spaceAfter: number) {
    updateNote(element, { spaceAfter });
    save();
  }

  function updateNoteIgnoreAttractions(
    element: NoteElement,
    ignoreAttractions: boolean,
  ) {
    updateNote(element, { ignoreAttractions });
    save();
  }

  function updateNoteAcceptsLyrics(
    element: NoteElement,
    acceptsLyrics: AcceptsLyricsOption,
  ) {
    updateNote(element, {
      acceptsLyrics: acceptsLyrics,
    });
    save();
  }

  function updateNoteChromaticFthoraNote(
    element: NoteElement,
    chromaticFthoraNote: ScaleNote | null,
  ) {
    updateNote(element, { chromaticFthoraNote });
    save();
  }

  function updateNoteSecondaryChromaticFthoraNote(
    element: NoteElement,
    secondaryChromaticFthoraNote: ScaleNote | null,
  ) {
    updateNote(element, { secondaryChromaticFthoraNote });
    save();
  }

  function updateNoteTertiaryChromaticFthoraNote(
    element: NoteElement,
    tertiaryChromaticFthoraNote: ScaleNote | null,
  ) {
    updateNote(element, { tertiaryChromaticFthoraNote });
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

  function updateRichTextBoxMarginTop(
    element: RichTextBoxElement,
    marginTop: number,
  ) {
    updateRichTextBox(element, { marginTop });
  }

  function updateRichTextBoxMarginBottom(
    element: RichTextBoxElement,
    marginBottom: number,
  ) {
    updateRichTextBox(element, { marginBottom });
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

  function updateTextBoxUseDefaultStyle(
    element: TextBoxElement,
    useDefaultStyle: boolean,
  ) {
    updateTextBox(element, { useDefaultStyle });
  }

  function updateTextBoxMultipanel(
    element: TextBoxElement,
    multipanel: boolean,
  ) {
    updateTextBox(element, { multipanel });
  }

  function updateTextBoxFontSize(element: TextBoxElement, fontSize: number) {
    updateTextBox(element, { fontSize });
  }

  function updateTextBoxFontFamily(
    element: TextBoxElement,
    fontFamily: string,
  ) {
    updateTextBox(element, { fontFamily });
  }

  function updateTextBoxStrokeWidth(
    element: TextBoxElement,
    strokeWidth: number,
  ) {
    updateTextBox(element, { strokeWidth });
  }

  function updateTextBoxColor(element: TextBoxElement, color: string) {
    updateTextBox(element, { color });
  }

  function updateTextBoxAlignment(
    element: TextBoxElement,
    alignment: TextBoxAlignment,
  ) {
    updateTextBox(element, { alignment });
  }

  function updateTextBoxInline(element: TextBoxElement, inline: boolean) {
    updateTextBox(element, { inline });
  }

  function updateTextBoxBold(element: TextBoxElement, bold: boolean) {
    updateTextBox(element, { bold });
  }

  function updateTextBoxItalic(element: TextBoxElement, italic: boolean) {
    updateTextBox(element, { italic });
  }

  function updateTextBoxUnderline(element: TextBoxElement, underline: boolean) {
    updateTextBox(element, { underline });
  }

  function updateTextBoxLineHeight(
    element: TextBoxElement,
    lineHeight: number | null,
  ) {
    updateTextBox(element, { lineHeight });
  }

  function updateTextBoxWidth(
    element: TextBoxElement,
    customWidth: number | null,
  ) {
    updateTextBox(element, { customWidth });
  }

  function updateTextBoxFillWidth(element: TextBoxElement, fillWidth: boolean) {
    updateTextBox(element, { fillWidth });
  }

  function updateTextBoxCustomHeight(
    element: TextBoxElement,
    customHeight: number | null,
  ) {
    updateTextBox(element, { customHeight });
  }

  function updateTextBoxMarginTop(element: TextBoxElement, marginTop: number) {
    updateTextBox(element, { marginTop });
  }

  function updateTextBoxMarginBottom(
    element: TextBoxElement,
    marginBottom: number,
  ) {
    updateTextBox(element, { marginBottom });
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

  function updateModeKeyMarginTop(element: ModeKeyElement, marginTop: number) {
    updateModeKey(element, { marginTop });
  }

  function updateModeKeyMarginBottom(
    element: ModeKeyElement,
    marginBottom: number,
  ) {
    updateModeKey(element, { marginBottom });
  }

  function updateModeKeyUseDefaultStyle(
    element: ModeKeyElement,
    useDefaultStyle: boolean,
  ) {
    updateModeKey(element, { useDefaultStyle });
  }

  function updateModeKeyFontSize(element: ModeKeyElement, fontSize: number) {
    updateModeKey(element, { fontSize });
  }

  function updateModeKeyStrokeWidth(
    element: ModeKeyElement,
    strokeWidth: number,
  ) {
    updateModeKey(element, { strokeWidth });
  }

  function updateModeKeyColor(element: ModeKeyElement, color: string) {
    updateModeKey(element, { color });
  }

  function updateModeKeyAlignment(
    element: ModeKeyElement,
    alignment: TextBoxAlignment,
  ) {
    updateModeKey(element, { alignment });
  }

  function updateModeKeyHeightAdjustment(
    element: ModeKeyElement,
    heightAdjustment: number,
  ) {
    updateModeKey(element, { heightAdjustment });
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

  function updateModeKeyBpm(element: ModeKeyElement, bpm: number) {
    updateModeKey(element, { bpm });
    save();
  }

  function updateModeKeyIgnoreAttractions(
    element: ModeKeyElement,
    ignoreAttractions: boolean,
  ) {
    updateModeKey(element, { ignoreAttractions });
    save();
  }

  function updateModeKeyShowAmbitus(
    element: ModeKeyElement,
    showAmbitus: boolean,
  ) {
    updateModeKey(element, { showAmbitus });
    save();
  }

  function updateModeKeyTempoAlignRight(
    element: ModeKeyElement,
    tempoAlignRight: boolean,
  ) {
    updateModeKey(element, { tempoAlignRight });
    save();
  }

  function updateModeKeyPermanentEnharmonicZo(
    element: ModeKeyElement,
    permanentEnharmonicZo: boolean,
  ) {
    updateModeKey(element, { permanentEnharmonicZo });
    save();
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

  function updateMartyriaBpm(element: MartyriaElement, bpm: number) {
    updateMartyria(element, { bpm });
    save();
  }

  function updateMartyriaMeasureBar(
    element: MartyriaElement,
    {
      measureBarLeft,
      measureBarRight,
    }: {
      measureBarLeft: MeasureBar | null;
      measureBarRight: MeasureBar | null;
    },
  ) {
    updateMartyria(element, {
      measureBarLeft,
      measureBarRight,
    });
    save();
  }

  function updateMartyriaAlignRight(
    element: MartyriaElement,
    alignRight: boolean,
  ) {
    updateMartyria(element, { alignRight, quantitativeNeume: null });
  }

  function updateMartyriaQuantitativeNeume(
    element: MartyriaElement,
    quantitativeNeume: QuantitativeNeume | null,
  ) {
    updateMartyria(element, { quantitativeNeume });
  }

  function updateMartyriaChromaticFthoraNote(
    element: MartyriaElement,
    chromaticFthoraNote: ScaleNote | null,
  ) {
    updateMartyria(element, { chromaticFthoraNote });
  }

  function updateMartyriaAuto(element: MartyriaElement, auto: boolean) {
    if (element.auto === auto) {
      return;
    }

    updateMartyria(element, { auto });
  }

  function updateMartyriaNote(element: MartyriaElement, note: Note) {
    if (element.note === note) {
      return;
    }

    updateMartyria(element, { note, auto: false });
  }

  function updateMartyriaScale(element: MartyriaElement, scale: Scale) {
    if (element.scale === scale) {
      return;
    }

    updateMartyria(element, { scale, auto: false });
  }

  function updateMartyriaSpaceAfter(
    element: MartyriaElement,
    spaceAfter: number,
  ) {
    updateMartyria(element, { spaceAfter });
    save();
  }

  function updateMartyriaVerticalOffset(
    element: MartyriaElement,
    verticalOffset: number,
  ) {
    updateMartyria(element, { verticalOffset });
    save();
  }

  function updateMartyriaRootSignOverride(
    element: MartyriaElement,
    rootSignOverride: RootSign,
  ) {
    rootSignOverride = rootSignOverride || null;
    updateMartyria(element, { rootSignOverride });
    save();
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

  function updateTempoSpaceAfter(element: TempoElement, spaceAfter: number) {
    updateTempo(element, { spaceAfter });
    save();
  }

  function updateTempoBpm(element: TempoElement, bpm: number) {
    updateTempo(element, { bpm });
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

  function updateDropCapUseDefaultStyle(
    element: DropCapElement,
    useDefaultStyle: boolean,
  ) {
    updateDropCap(element, { useDefaultStyle });
  }

  function updateDropCapFontSize(element: DropCapElement, fontSize: number) {
    updateDropCap(element, { fontSize });
  }

  function updateDropCapFontFamily(
    element: DropCapElement,
    fontFamily: string,
  ) {
    updateDropCap(element, { fontFamily });
  }

  function updateDropCapStrokeWidth(
    element: DropCapElement,
    strokeWidth: number,
  ) {
    updateDropCap(element, { strokeWidth });
  }

  function updateDropCapColor(element: DropCapElement, color: string) {
    updateDropCap(element, { color });
  }

  function updateDropCapFontWeight(element: DropCapElement, bold: boolean) {
    updateDropCap(element, { fontWeight: bold ? '700' : '400' });
  }

  function updateDropCapFontStyle(element: DropCapElement, italic: boolean) {
    updateDropCap(element, { fontStyle: italic ? 'italic' : 'normal' });
  }

  function updateDropCapLineHeight(
    element: DropCapElement,
    lineHeight: number | null,
  ) {
    updateDropCap(element, { lineHeight });
  }

  function updateDropCapLineSpan(element: DropCapElement, lineSpan: number) {
    updateDropCap(element, { lineSpan });
  }

  function updateDropCapWidth(
    element: DropCapElement,
    customWidth: number | null,
  ) {
    updateDropCap(element, { customWidth });
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

  function updateImageBoxInline(element: ImageBoxElement, inline: boolean) {
    updateImageBox(element, { inline });
  }

  function updateImageBoxLockAspectRatio(
    element: ImageBoxElement,
    lockAspectRatio: boolean,
  ) {
    updateImageBox(element, { lockAspectRatio });
  }

  function updateImageBoxAlignment(
    element: ImageBoxElement,
    alignment: TextBoxAlignment,
  ) {
    updateImageBox(element, { alignment });
  }

  function updateImageBoxSize(
    element: ImageBoxElement,
    imageWidth: number,
    imageHeight: number,
  ) {
    updateImageBox(element, { imageWidth, imageHeight });
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
    updateNoteLyricsUseDefaultStyle,
    updateNoteLyricsColor,
    updateNoteLyricsFontFamily,
    updateNoteLyricsFontSize,
    updateNoteLyricsStrokeWidth,
    updateNoteLyricsFontWeight,
    updateNoteLyricsFontStyle,
    updateNoteLyricsTextDecoration,
    updateNoteAccidental,
    updateNoteAccidentalSecondary,
    updateNoteAccidentalTertiary,
    updateNoteFthora,
    updateNoteFthoraSecondary,
    updateNoteFthoraTertiary,
    updateNoteExpression,
    updateNoteTime,
    updateNoteGorgon,
    updateNoteGorgonSecondary,
    updateNoteMeasureBar,
    updateNoteMeasureNumber,
    updateNoteNoteIndicator,
    updateNoteIson,
    updateNoteKoronis,
    updateNoteStavros,
    updateNoteVareia,
    updateNoteTie,
    updateNoteSpaceAfter,
    updateNoteIgnoreAttractions,
    updateNoteAcceptsLyrics,
    updateNoteChromaticFthoraNote,
    updateNoteSecondaryChromaticFthoraNote,
    updateNoteTertiaryChromaticFthoraNote,
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
    updateRichTextBoxMarginTop,
    updateRichTextBoxMarginBottom,
    updateTextBox,
    updateTextBoxHeight,
    updateTextBoxUseDefaultStyle,
    updateTextBoxMultipanel,
    updateTextBoxFontSize,
    updateTextBoxFontFamily,
    updateTextBoxStrokeWidth,
    updateTextBoxColor,
    updateTextBoxAlignment,
    updateTextBoxInline,
    updateTextBoxBold,
    updateTextBoxItalic,
    updateTextBoxUnderline,
    updateTextBoxLineHeight,
    updateTextBoxWidth,
    updateTextBoxFillWidth,
    updateTextBoxCustomHeight,
    updateTextBoxMarginTop,
    updateTextBoxMarginBottom,
    updateModeKey,
    updateModeKeyMarginTop,
    updateModeKeyMarginBottom,
    updateModeKeyUseDefaultStyle,
    updateModeKeyFontSize,
    updateModeKeyStrokeWidth,
    updateModeKeyColor,
    updateModeKeyAlignment,
    updateModeKeyHeightAdjustment,
    updateModeKeyTempo,
    updateModeKeyBpm,
    updateModeKeyIgnoreAttractions,
    updateModeKeyShowAmbitus,
    updateModeKeyTempoAlignRight,
    updateModeKeyPermanentEnharmonicZo,
    updateModeKeyFromTemplate,
    updateMartyria,
    updateMartyriaFthora,
    updateMartyriaTempoLeft,
    updateMartyriaTempo,
    updateMartyriaTempoRight,
    updateMartyriaBpm,
    updateMartyriaMeasureBar,
    updateMartyriaAlignRight,
    updateMartyriaQuantitativeNeume,
    updateMartyriaChromaticFthoraNote,
    updateMartyriaAuto,
    updateMartyriaNote,
    updateMartyriaScale,
    updateMartyriaSpaceAfter,
    setAccidental,
    setFthoraMartyria,
    updateMartyriaVerticalOffset,
    updateMartyriaRootSignOverride,
    updateTempo,
    updateTempoSpaceAfter,
    updateTempoBpm,
    updateDropCap,
    updateDropCapContent,
    updateDropCapUseDefaultStyle,
    updateDropCapFontSize,
    updateDropCapFontFamily,
    updateDropCapStrokeWidth,
    updateDropCapColor,
    updateDropCapFontWeight,
    updateDropCapFontStyle,
    updateDropCapLineHeight,
    updateDropCapLineSpan,
    updateDropCapWidth,
    updateImageBox,
    updateImageBoxInline,
    updateImageBoxLockAspectRatio,
    updateImageBoxAlignment,
    updateImageBoxSize,
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
