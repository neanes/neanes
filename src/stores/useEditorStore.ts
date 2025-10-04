// stores/editor.ts
import { defineStore } from 'pinia';
import { StyleValue } from 'vue';

import { ExportFormat } from '@/components/ExportDialog.vue';
import { EditorPreferences } from '@/models/EditorPreferences';
import {
  ElementType,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TextBoxElement,
} from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import { Accidental } from '@/models/Neumes';
import { Page } from '@/models/Page';
import { Score } from '@/models/Score';
import { ScoreElementSelectionRange } from '@/models/ScoreElementSelectionRange';
import { Workspace } from '@/models/Workspace';
import { PlaybackOptions } from '@/services/audio/PlaybackService';
import { CommandService } from '@/services/history/CommandService';
import { withZoom } from '@/utils/withZoom';

export const useEditorStore = defineStore('editor', {
  state: () => ({
    isLoading: true,

    printMode: false,
    exportInProgress: false,
    richTextBoxCalculation: false,
    textBoxCalculation: false,

    showGuides: false,

    workspaces: [] as Workspace[],
    selectedWorkspace: new Workspace(),

    pages: [] as Page[],

    currentPageNumber: 0,

    modeKeyDialogIsOpen: false,
    syllablePositioningDialogIsOpen: false,
    playbackSettingsDialogIsOpen: false,
    pageSetupDialogIsOpen: false,
    editorPreferencesDialogIsOpen: false,
    exportDialogIsOpen: false,

    neumeComboPanelIsExpanded: false,

    exportFormat: ExportFormat.PNG,

    fonts: [] as string[],
    toolbarInnerNeume: 'Primary',

    audioOptions: {
      useLegetos: false,
      useDefaultAttractionZo: true,
      frequencyDi: 196,
      speed: 1,

      diatonicIntervals: [12, 10, 8],
      hardChromaticIntervals: [6, 20, 4],
      softChromaticIntervals: [8, 14, 8],
      legetosIntervals: [8, 10, 12],
      zygosIntervals: [18, 4, 16, 4],
      zygosLegetosIntervals: [18, 4, 20, 4],
      spathiIntervals: [20, 4, 4, 14],
      klitonIntervals: [14, 12, 4],

      defaultAttractionZoMoria: -4,
      defaultAttractionKeMoria: 5,

      volumeIson: -4,
      volumeMelody: 0,

      alterationMultipliers: [0.5, 0.25, 0.75],

      alterationMoriaMap: {
        [Accidental.Flat_2_Right]: -2,
        [Accidental.Flat_4_Right]: -4,
        [Accidental.Flat_6_Right]: -6,
        [Accidental.Flat_8_Right]: -8,
        [Accidental.Sharp_2_Left]: 2,
        [Accidental.Sharp_4_Left]: 4,
        [Accidental.Sharp_6_Left]: 6,
        [Accidental.Sharp_8_Left]: 8,
      },
    } as PlaybackOptions,

    editorPreferences: new EditorPreferences(),

    searchTextQuery: '',
    searchTextPanelIsOpen: false,

    keyboardModifier: null as string | null,
  }),

  getters: {
    score(): Score {
      return this.selectedWorkspace.score;
    },

    elements(): ScoreElement[] {
      return this.score.staff.elements ?? [];
    },

    lyrics(): string {
      return this.score?.staff.lyrics.text ?? '';
    },

    lyricsLocked(): boolean {
      return this.score?.staff.lyrics.locked ?? false;
    },

    lyricManagerIsOpen(): boolean {
      return this.selectedWorkspace.lyricManagerIsOpen;
    },

    pageCount(): number {
      return this.pages.length;
    },

    commandService(): CommandService {
      return this.selectedWorkspace.commandService as CommandService;
    },

    selectedElementIndex(): number {
      return this.selectedElement != null
        ? this.elements.indexOf(this.selectedElement)
        : -1;
    },

    selectedElement(): ScoreElement | null {
      return this.selectedWorkspace.selectedElement;
    },

    rtl(): boolean {
      return this.score.pageSetup.melkiteRtl;
    },

    resizableRichTextBoxElements(): ScoreElement[] {
      return this.elements.filter(
        (x) =>
          x.elementType === ElementType.RichTextBox &&
          !(x as RichTextBoxElement).inline,
      );
    },

    resizableTextBoxElements(): ScoreElement[] {
      return this.elements.filter(
        (x) =>
          x.elementType === ElementType.TextBox &&
          !(x as TextBoxElement).inline,
      );
    },

    footerStyle(): StyleValue {
      return {
        left: withZoom(this.score.pageSetup.leftMargin),
        bottom: withZoom(this.score.pageSetup.footerMargin),
      } as StyleValue;
    },

    selectedElementForNeumeToolbar(): ScoreElement | null {
      if (
        this.selectedWorkspace.selectedAlternateLineElement != null &&
        this.selectedWorkspace.selectedAlternateLineElement.elements.length > 0
      ) {
        return this.selectedWorkspace.selectedAlternateLineElement.elements[
          this.selectedWorkspace.selectedAlternateLineElement.elements.length -
            1
        ];
      }
      return this.selectedWorkspace.selectedElement;
    },

    previousElementOnLine(): ScoreElement | null {
      const index = this.selectedElementIndex;

      if (index - 1 < 0) {
        return null;
      }

      return this.elements[index - 1].line === this.selectedElement?.line
        ? this.elements[index - 1]
        : null;
    },

    nextElementOnLine(): ScoreElement | null {
      const index = this.selectedElementIndex;

      if (index + 1 >= this.elements.length - 1) {
        return null;
      }

      return this.elements[index + 1].line === this.selectedElement?.line
        ? this.elements[index + 1]
        : null;
    },

    selectedLyrics(): NoteElement | null {
      return this.selectedWorkspace.selectedLyrics as NoteElement | null;
    },
    selectionRange(): ScoreElementSelectionRange | null {
      return this.selectedWorkspace.selectionRange;
    },
    zoom(): number {
      return this.selectedWorkspace.zoom;
    },
    selectedHeaderFooterElement(): ScoreElement | null {
      return this.selectedWorkspace.selectedHeaderFooterElement;
    },
    selectedTextBoxElement(): TextBoxElement | null {
      const selectedElement =
        this.selectedElement || this.selectedHeaderFooterElement;

      return selectedElement != null &&
        selectedElement.elementType == ElementType.TextBox
        ? (selectedElement as TextBoxElement)
        : null;
    },

    selectedRichTextBoxElement(): RichTextBoxElement | null {
      const selectedElement =
        this.selectedElement || this.selectedHeaderFooterElement;

      return selectedElement != null &&
        selectedElement.elementType == ElementType.RichTextBox
        ? (selectedElement as RichTextBoxElement)
        : null;
    },

    guideStyleLeft(): StyleValue {
      return {
        left: withZoom(this.score.pageSetup.leftMargin - 1),
        height: withZoom(this.score.pageSetup.pageHeight),
      } as StyleValue;
    },

    guideStyleRight(): StyleValue {
      return {
        right: withZoom(this.score.pageSetup.rightMargin - 1),
        height: withZoom(this.score.pageSetup.pageHeight),
      } as StyleValue;
    },

    guideStyleTop(): StyleValue {
      return {
        top: withZoom(this.score.pageSetup.topMargin - 1),
        width: withZoom(this.score.pageSetup.pageWidth),
      } as StyleValue;
    },

    guideStyleBottom(): StyleValue {
      return {
        bottom: withZoom(this.score.pageSetup.bottomMargin - 1),
        width: withZoom(this.score.pageSetup.pageWidth),
      } as StyleValue;
    },

    hasUnsavedChanges(): boolean {
      return this.selectedWorkspace.hasUnsavedChanges;
    },

    zoomToFit(): boolean {
      return this.selectedWorkspace.zoomToFit;
    },

    entryMode(): EntryMode {
      return this.selectedWorkspace.entryMode;
    },

    currentFilePath(): string | null {
      return this.selectedWorkspace.filePath;
    },

    pageStyle(): StyleValue {
      return {
        minWidth: withZoom(this.score.pageSetup.pageWidth),
        maxWidth: withZoom(this.score.pageSetup.pageWidth),
        width: withZoom(this.score.pageSetup.pageWidth),
        height: withZoom(this.score.pageSetup.pageHeight),
        minHeight: withZoom(this.score.pageSetup.pageHeight),
        maxHeight: withZoom(this.score.pageSetup.pageHeight),
      } as StyleValue;
    },

    headerStyle(): StyleValue {
      return {
        left: withZoom(this.score.pageSetup.leftMargin),
        top: withZoom(this.score.pageSetup.headerMargin),
      } as StyleValue;
    },

    dialogOpen(): boolean {
      return (
        this.modeKeyDialogIsOpen ||
        this.pageSetupDialogIsOpen ||
        this.playbackSettingsDialogIsOpen ||
        this.syllablePositioningDialogIsOpen ||
        this.editorPreferencesDialogIsOpen
      );
    },

    filteredPages(): Page[] {
      return this.printMode ? this.pages.filter((x) => !x.isEmpty) : this.pages;
    },
  },

  actions: {
    setSelectionRange(value: ScoreElementSelectionRange | null) {
      this.selectedWorkspace.selectionRange = value;
    },
    setLyrics(value: string) {
      this.score.staff.lyrics.text = value;
    },
    setLyricsLocked(value: boolean) {
      this.score.staff.lyrics.locked = value;
    },
    setLyricManagerIsOpen(value: boolean) {
      this.selectedWorkspace.lyricManagerIsOpen = value;
    },

    setZoom(zoom: number) {
      this.selectedWorkspace.zoom = zoom;
    },

    setZoomToFit(value: boolean) {
      this.selectedWorkspace.zoomToFit = value;
    },

    setEntryMode(value: EntryMode) {
      this.selectedWorkspace.entryMode = value;
    },

    setCurrentFilePath(path: string | null) {
      this.selectedWorkspace.filePath = path;
    },

    setHasUnsavedChanges(hasUnsavedChanges: boolean) {
      this.selectedWorkspace.hasUnsavedChanges = hasUnsavedChanges;
    },
  },
});
