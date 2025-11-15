<script lang="ts">
import 'vue3-tabs-chrome/dist/vue3-tabs-chrome.css';

import { getFontEmbedCSS, toPng } from 'html-to-image';
import { debounce, throttle } from 'throttle-debounce';
import { defineComponent, inject, nextTick, StyleValue, toRaw } from 'vue';
import Vue3TabsChrome, { Tab } from 'vue3-tabs-chrome';

import AlternateLine from '@/components/AlternateLine.vue';
import ContentEditable from '@/components/ContentEditable.vue';
import DropCap from '@/components/DropCap.vue';
import EditorPreferencesDialog from '@/components/EditorPreferencesDialog.vue';
import ExportDialog, {
  ExportAsLatexSettings,
  ExportAsMusicXmlSettings,
  ExportAsPngSettings,
  ExportFormat,
} from '@/components/ExportDialog.vue';
import FileMenuBar from '@/components/FileMenuBar.vue';
import ImageBox from '@/components/ImageBox.vue';
import ModeKey from '@/components/ModeKey.vue';
import ModeKeyDialog from '@/components/ModeKeyDialog.vue';
import EmptyNeumeBox from '@/components/NeumeBoxEmpty.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import TempoNeumeBox from '@/components/NeumeBoxTempo.vue';
import NeumeComboSelector from '@/components/NeumeComboSelector.vue';
import NeumeSelector from '@/components/NeumeSelector.vue';
import PageSetupDialog from '@/components/PageSetupDialog.vue';
import PlaybackSettingsDialog from '@/components/PlaybackSettingsDialog.vue';
import SearchText from '@/components/SearchText.vue';
import SyllablePositioningDialog from '@/components/SyllablePositioningDialog.vue';
import Annotation from '@/components/TextAnnotation.vue';
import TextBox from '@/components/TextBox.vue';
import TextBoxRich from '@/components/TextBoxRich.vue';
import ToolbarDropCap from '@/components/ToolbarDropCap.vue';
import ToolbarImageBox from '@/components/ToolbarImageBox.vue';
import ToolbarLyricManager from '@/components/ToolbarLyricManager.vue';
import ToolbarLyrics from '@/components/ToolbarLyrics.vue';
import ToolbarMain from '@/components/ToolbarMain.vue';
import ToolbarMartyria from '@/components/ToolbarMartyria.vue';
import ToolbarModeKey from '@/components/ToolbarModeKey.vue';
import ToolbarNeume from '@/components/ToolbarNeume.vue';
import ToolbarTempo from '@/components/ToolbarTempo.vue';
import ToolbarTextBox from '@/components/ToolbarTextBox.vue';
import ToolbarTextBoxRich from '@/components/ToolbarTextBoxRich.vue';
import { EventBus } from '@/eventBus';
import {
  audioServiceKey,
  ipcServiceKey,
  latexExporterKey,
  lyricServiceKey,
  musicXmlExporterKey,
  neumeKeyboardKey,
  ocrImporterKey,
  platformServiceKey,
  playbackServiceKey,
  textSearchServiceKey,
} from '@/injectionKeys';
import {
  CloseWorkspacesArgs,
  CloseWorkspacesDisposition,
  ExportWorkspaceAsImageReplyArgs,
  FileMenuImportOcrArgs,
  FileMenuInsertTextboxArgs,
  FileMenuOpenImageArgs,
  FileMenuOpenScoreArgs,
  IpcMainChannels,
  IpcRendererChannels,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import { EditorPreferences } from '@/models/EditorPreferences';
import {
  AlternateLineElement,
  AnnotationElement,
  DropCapElement,
  ElementType,
  EmptyElement,
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
import { modeKeyTemplates } from '@/models/ModeKeys';
import { NeumeCombination } from '@/models/NeumeCommonCombinations';
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
import { Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import { ScaleNote } from '@/models/Scales';
import { Score } from '@/models/Score';
import { ScoreElementSelectionRange } from '@/models/ScoreElementSelectionRange';
import { Workspace, WorkspaceLocalStorage } from '@/models/Workspace';
import {
  AudioService,
  AudioServiceEventNames,
  AudioState,
} from '@/services/audio/AudioService';
import {
  PlaybackOptions,
  PlaybackSequenceEvent,
  PlaybackService,
} from '@/services/audio/PlaybackService';
import { Command, CommandFactory } from '@/services/history/CommandService';
import { ByzHtmlExporter } from '@/services/integration/ByzHtmlExporter';
import {
  LatexExporter,
  LatexExporterOptions,
} from '@/services/integration/LatexExporter';
import { MusicXmlExporter } from '@/services/integration/MusicXmlExporter';
import { OcrImporter } from '@/services/integration/OcrImporter';
import { IIpcService } from '@/services/ipc/IIpcService';
import { IpcService } from '@/services/ipc/IpcService';
import { LayoutService } from '@/services/LayoutService';
import { LyricService } from '@/services/LyricService';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { IPlatformService } from '@/services/platform/IPlatformService';
import { PlatformService } from '@/services/platform/PlatformService';
import { SaveService } from '@/services/SaveService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { TextSearchService } from '@/services/TextSearchService';
import { GORTHMIKON, PELASTIKON, TATWEEL } from '@/utils/constants';
import { getCursorPosition } from '@/utils/getCursorPosition';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { isElectron } from '@/utils/isElectron';
import { TokenMetadata } from '@/utils/replaceTokens';
import { shallowEquals } from '@/utils/shallowEquals';
import { TestFileGenerator } from '@/utils/TestFileGenerator';
import { TestFileType } from '@/utils/TestFileType';
import { withZoom } from '@/utils/withZoom';

interface Vue3TabsChromeComponent {
  addTab: (...newTabs: Array<Tab>) => void;
  removeTab: (tabKey: string | number) => void;
}

const noteElementCommandFactory: CommandFactory<NoteElement> =
  new CommandFactory<NoteElement>();

const martyriaCommandFactory: CommandFactory<MartyriaElement> =
  new CommandFactory<MartyriaElement>();

const tempoCommandFactory: CommandFactory<TempoElement> =
  new CommandFactory<TempoElement>();

const annotationCommandFactory: CommandFactory<AnnotationElement> =
  new CommandFactory<AnnotationElement>();

const alternateLineCommandFactory: CommandFactory<AlternateLineElement> =
  new CommandFactory<AlternateLineElement>();

const textBoxCommandFactory: CommandFactory<TextBoxElement> =
  new CommandFactory<TextBoxElement>();

const richTextBoxCommandFactory: CommandFactory<RichTextBoxElement> =
  new CommandFactory<RichTextBoxElement>();

const imageBoxCommandFactory: CommandFactory<ImageBoxElement> =
  new CommandFactory<ImageBoxElement>();

const modeKeyCommandFactory: CommandFactory<ModeKeyElement> =
  new CommandFactory<ModeKeyElement>();

const dropCapCommandFactory: CommandFactory<DropCapElement> =
  new CommandFactory<DropCapElement>();

const scoreElementCommandFactory: CommandFactory<ScoreElement> =
  new CommandFactory<ScoreElement>();

const pageSetupCommandFactory: CommandFactory<PageSetup> =
  new CommandFactory<PageSetup>();

let untitledIndex = 1;

const navigableElements = [
  ElementType.Note,
  ElementType.Martyria,
  ElementType.Tempo,
  ElementType.Empty,
  ElementType.DropCap,
  ElementType.TextBox,
  ElementType.ImageBox,
  ElementType.ModeKey,
];

const keydownThrottleIntervalMs = 100;

export default defineComponent({
  components: {
    AlternateLine,
    Annotation,
    SyllableNeumeBox,
    MartyriaNeumeBox,
    TempoNeumeBox,
    EmptyNeumeBox,
    NeumeComboSelector,
    NeumeSelector,
    ContentEditable,
    TextBox,
    TextBoxRich,
    DropCap,
    ImageBox,
    ModeKey,
    ToolbarImageBox,
    ToolbarTextBox,
    ToolbarTextBoxRich,
    ToolbarLyrics,
    ToolbarLyricManager,
    ToolbarModeKey,
    ToolbarNeume,
    ToolbarMartyria,
    ToolbarTempo,
    ToolbarDropCap,
    ToolbarMain,
    ModeKeyDialog,
    SyllablePositioningDialog,
    PlaybackSettingsDialog,
    EditorPreferencesDialog,
    ExportDialog,
    PageSetupDialog,
    FileMenuBar,
    Vue3TabsChrome,
    SearchText,
  },
  setup() {
    return {
      audioService: inject<AudioService>(audioServiceKey, new AudioService()),
      latexExporter: inject<LatexExporter>(
        latexExporterKey,
        new LatexExporter(),
      ),
      lyricService: inject<LyricService>(lyricServiceKey, new LyricService()),
      musicXmlExporter: inject<MusicXmlExporter>(
        musicXmlExporterKey,
        new MusicXmlExporter(),
      ),
      neumeKeyboard: inject<NeumeKeyboard>(
        neumeKeyboardKey,
        new NeumeKeyboard(),
      ),
      ocrImporter: inject<OcrImporter>(ocrImporterKey, new OcrImporter()),
      platformService: inject<IPlatformService>(
        platformServiceKey,
        new PlatformService(),
      ),
      playbackService: inject<PlaybackService>(
        playbackServiceKey,
        new PlaybackService(),
      ),
      textSearchService: inject<TextSearchService>(
        textSearchServiceKey,
        new TextSearchService(),
      ),
      ipcService: inject<IIpcService>(ipcServiceKey, new IpcService()),
    };
  },
  emits: [],
  data() {
    return {
      searchTextQuery: '',
      searchTextPanelIsOpen: false,

      showFileMenuBar: !isElectron(),

      LineBreakType,

      isDevelopment: import.meta.env.DEV,

      isBrowser: !isElectron(),

      isLoading: true,

      printMode: false,

      showGuides: false,

      workspaces: [] as Workspace[],
      selectedWorkspaceValue: new Workspace(),

      tabs: [] as Tab[],

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

      clipboard: [] as ScoreElement[],
      formatType: null as ElementType | null,
      textBoxFormat: null as Partial<TextBoxElement> | null,
      noteFormat: null as Partial<NoteElement> | null,
      richTextBoxCalculation: false,
      richTextBoxCalculationCount: 0,
      textBoxCalculation: false,
      textBoxCalculationCount: 0,

      fonts: [] as string[],

      toolbarInnerNeume: 'Primary',

      keyboardModifier: null as string | null,

      audioElement: null as ScoreElement | null,
      playbackEvents: [] as PlaybackSequenceEvent[],
      playbackTimeInterval: null as ReturnType<typeof setTimeout> | null,
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

      byzHtmlExporter: new ByzHtmlExporter(),

      exportInProgress: false,

      throttled: {
        assignLyrics: null! as () => void,
        moveToPreviousLyricBox: null! as () => void,
        moveToNextLyricBox: null! as (clearMelisma?: boolean) => void,
        moveLeft: null! as () => void,
        moveRight: null! as () => void,
        moveSelectionLeft: null! as () => void,
        moveSelectionRight: null! as () => void,
        deleteSelectedElement: null! as () => void,
        deletePreviousElement: null! as () => void,
        onFileMenuUndo: null! as () => void,
        onFileMenuRedo: null! as () => void,
        onCutScoreElements: null! as () => void,
        onCopyScoreElements: null! as () => void,
        onFileMenuCopyAsHtml: null! as () => void,
        onPasteScoreElements: null! as (includeLyrics: boolean) => void,
        addQuantitativeNeume: null! as (
          quantitativeNeume: QuantitativeNeume,
          secondaryGorgonNeume?: GorgonNeume,
        ) => void,
        addTempo: null! as (neume: TempoSign) => void,
        addAutoMartyria: null! as (alignRight?: boolean, note?: Note) => void,
        updateNoteAndSave: null! as (
          element: NoteElement,
          values: Partial<NoteElement>,
        ) => void,
        setKlasma: null! as (element: NoteElement) => void,
        setGorgon: null! as (
          element: NoteElement,
          neumes: GorgonNeume | GorgonNeume[],
        ) => void,
        setFthoraNote: null! as (
          element: NoteElement,
          neumes: Fthora[],
        ) => void,
        setFthoraMartyria: null! as (
          element: MartyriaElement,
          neume: Fthora,
        ) => void,
        setMartyriaTempo: null! as (
          element: MartyriaElement,
          neume: TempoSign,
        ) => void,
        setAccidental: null! as (
          element: NoteElement,
          neume: Accidental,
        ) => void,
        setTimeNeume: null! as (element: NoteElement, neume: TimeNeume) => void,
        setMeasureNumber: null! as (
          element: NoteElement,
          neume: MeasureNumber,
        ) => void,
        setMeasureBarNote: null! as (
          element: NoteElement,
          neume: MeasureBar,
        ) => void,
        setMeasureBarMartyria: null! as (
          element: MartyriaElement,
          neume: MeasureBar,
        ) => void,
        setIson: null! as (element: NoteElement, neume: Ison) => void,
        setTie: null! as (element: NoteElement, neumes: Tie[]) => void,
        setVocalExpression: null! as (
          element: NoteElement,
          neume: VocalExpressionNeume,
        ) => void,
        updateMartyria: null! as (
          element: MartyriaElement,
          values: Partial<MartyriaElement>,
        ) => void,
        onWindowResize: null! as () => void,
        onScroll: null! as () => void,
      },
      saveDebounced: null! as (markUnsavedChanges?: boolean) => void,
    };
  },

  computed: {
    selectedWorkspaceId: {
      get() {
        return this.selectedWorkspace.id;
      },

      set(value: string) {
        this.selectedWorkspace =
          (this.workspaces.find((x) => x.id === value) as Workspace) ??
          new Workspace();
      },
    },

    rtl() {
      return this.score.pageSetup.melkiteRtl;
    },

    selectedWorkspace: {
      get() {
        return this.selectedWorkspaceValue as Workspace;
      },

      set(value: Workspace) {
        // Save the scroll position
        const pageBackgroundElement = this.$refs[
          'page-background'
        ] as HTMLElement;
        this.selectedWorkspace.scrollLeft = pageBackgroundElement.scrollLeft;
        this.selectedWorkspace.scrollTop = pageBackgroundElement.scrollTop;

        this.selectedWorkspaceValue = value;
        this.selectedWorkspace.commandService.notify();
        this.save(false);

        // Scroll to the new workspace's saved scroll position
        // Use nextTick to scroll after the DOM has refreshed
        nextTick(() => {
          pageBackgroundElement.scrollTo(
            this.selectedWorkspace.scrollLeft,
            this.selectedWorkspace.scrollTop,
          );

          this.calculatePageNumber();
        });

        this.stopAudio();
      },
    },

    score() {
      return this.selectedWorkspace.score;
    },

    elements() {
      return this.score?.staff.elements ?? [];
    },

    resizableRichTextBoxElements() {
      return this.elements.filter(
        (x) =>
          x.elementType === ElementType.RichTextBox &&
          !(x as RichTextBoxElement).inline,
      );
    },

    resizableTextBoxElements() {
      return this.elements.filter(
        (x) =>
          x.elementType === ElementType.TextBox &&
          !(x as TextBoxElement).inline,
      );
    },

    lyrics: {
      get() {
        return this.score?.staff.lyrics.text ?? '';
      },

      set(value: string) {
        this.score.staff.lyrics.text = value;
      },
    },

    lyricsLocked: {
      get() {
        return this.score?.staff.lyrics.locked ?? false;
      },

      set(value: boolean) {
        this.score.staff.lyrics.locked = value;
      },
    },

    lyricManagerIsOpen: {
      get() {
        return this.selectedWorkspace.lyricManagerIsOpen;
      },

      set(value: boolean) {
        this.selectedWorkspace.lyricManagerIsOpen = value;
      },
    },

    pageCount() {
      return this.pages.length;
    },

    commandService() {
      return this.selectedWorkspace.commandService;
    },

    selectedElementIndex() {
      return this.selectedElement != null
        ? this.elements.indexOf(this.selectedElement)
        : -1;
    },

    windowTitle() {
      return `${this.getFileName(this.selectedWorkspace)} - ${
        import.meta.env.VITE_TITLE
      }`;
    },

    selectedElement: {
      get() {
        return this.selectedWorkspace.selectedElement;
      },

      set(element: ScoreElement | null) {
        if (element != null) {
          this.selectedLyrics = null;
          this.selectionRange = null;
          this.selectedHeaderFooterElement = null;
          this.toolbarInnerNeume = 'Primary';

          if (this.audioService.state === AudioState.Playing) {
            const event = this.playbackEvents.find(
              (x) => x.elementIndex === this.getElementIndex(element),
            );

            if (event) {
              this.audioService.jumpToEvent(event);
              this.selectedWorkspace.playbackTime = event.absoluteTime;
            }
          } else if (this.audioService.state === AudioState.Paused) {
            this.stopAudio();
          }
        }

        if (
          this.selectedWorkspace.selectedAlternateLineElement != null &&
          this.selectedWorkspace.selectedAlternateLineElement.elements
            .length === 0
        ) {
          this.removeAlternateLine(
            this.selectedElement as NoteElement,
            this.selectedWorkspace.selectedAlternateLineElement,
            true,
          );
        }

        this.selectedWorkspace.selectedElement = element;
        this.selectedWorkspace.selectedAnnotationElement = null;
        this.selectedWorkspace.selectedAlternateLineElement = null;
      },
    },

    selectedElementForNeumeToolbar() {
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

    previousElementOnLine() {
      const index = this.selectedElementIndex;

      if (index - 1 < 0) {
        return null;
      }

      return this.elements[index - 1].line === this.selectedElement?.line
        ? this.elements[index - 1]
        : null;
    },

    nextElementOnLine() {
      const index = this.selectedElementIndex;

      if (index + 1 >= this.elements.length - 1) {
        return null;
      }

      return this.elements[index + 1].line === this.selectedElement?.line
        ? this.elements[index + 1]
        : null;
    },

    selectedLyrics: {
      get() {
        return this.selectedWorkspace.selectedLyrics;
      },

      set(element: NoteElement | null) {
        if (element != null) {
          this.selectedElement = null;
          this.selectedHeaderFooterElement = null;
          this.selectionRange = null;
        }

        this.selectedWorkspace.selectedLyrics = element;
      },
    },

    selectedHeaderFooterElement: {
      get() {
        return this.selectedWorkspace.selectedHeaderFooterElement;
      },

      set(element: ScoreElement | null) {
        if (element != null) {
          this.selectedElement = null;
          this.selectedLyrics = null;
          this.selectionRange = null;
        }

        this.selectedWorkspace.selectedHeaderFooterElement = element;
      },
    },

    selectedTextBoxElement() {
      const selectedElement =
        this.selectedElement || this.selectedHeaderFooterElement;

      return selectedElement != null && this.isTextBoxElement(selectedElement)
        ? (selectedElement as TextBoxElement)
        : null;
    },

    selectedRichTextBoxElement() {
      const selectedElement =
        this.selectedElement || this.selectedHeaderFooterElement;

      return selectedElement != null &&
        this.isRichTextBoxElement(selectedElement)
        ? (selectedElement as RichTextBoxElement)
        : null;
    },

    selectionRange: {
      get() {
        return this.selectedWorkspace.selectionRange;
      },

      set(value: ScoreElementSelectionRange | null) {
        this.selectedWorkspace.selectionRange = value;
      },
    },

    zoom: {
      get() {
        return this.selectedWorkspace.zoom;
      },

      set(zoom: number) {
        this.selectedWorkspace.zoom = zoom;
      },
    },

    zoomToFit: {
      get() {
        return this.selectedWorkspace.zoomToFit;
      },

      set(value: boolean) {
        this.selectedWorkspace.zoomToFit = value;
      },
    },

    entryMode: {
      get() {
        return this.selectedWorkspace.entryMode;
      },

      set(value: EntryMode) {
        this.selectedWorkspace.entryMode = value;
      },
    },

    currentFilePath: {
      get() {
        return this.selectedWorkspace.filePath;
      },

      set(path: string | null) {
        this.selectedWorkspace.filePath = path;
      },
    },

    hasUnsavedChanges: {
      get() {
        return this.selectedWorkspace.hasUnsavedChanges;
      },

      set(hasUnsavedChanges: boolean) {
        this.selectedWorkspace.hasUnsavedChanges = hasUnsavedChanges;
      },
    },

    pageStyle() {
      return {
        minWidth: withZoom(this.score.pageSetup.pageWidth),
        maxWidth: withZoom(this.score.pageSetup.pageWidth),
        width: withZoom(this.score.pageSetup.pageWidth),
        height: withZoom(this.score.pageSetup.pageHeight),
        minHeight: withZoom(this.score.pageSetup.pageHeight),
        maxHeight: withZoom(this.score.pageSetup.pageHeight),
      } as StyleValue;
    },

    headerStyle() {
      return {
        left: withZoom(this.score.pageSetup.leftMargin),
        top: withZoom(this.score.pageSetup.headerMargin),
      } as StyleValue;
    },

    footerStyle() {
      return {
        left: withZoom(this.score.pageSetup.leftMargin),
        bottom: withZoom(this.score.pageSetup.footerMargin),
      } as StyleValue;
    },

    guideStyleLeft() {
      return {
        left: withZoom(this.score.pageSetup.leftMargin - 1),
        height: withZoom(this.score.pageSetup.pageHeight),
      } as StyleValue;
    },

    guideStyleRight() {
      return {
        right: withZoom(this.score.pageSetup.rightMargin - 1),
        height: withZoom(this.score.pageSetup.pageHeight),
      } as StyleValue;
    },

    guideStyleTop() {
      return {
        top: withZoom(this.score.pageSetup.topMargin - 1),
        width: withZoom(this.score.pageSetup.pageWidth),
      } as StyleValue;
    },

    guideStyleBottom() {
      return {
        bottom: withZoom(this.score.pageSetup.bottomMargin - 1),
        width: withZoom(this.score.pageSetup.pageWidth),
      } as StyleValue;
    },

    pageVisibilityIntersection() {
      // look ahead/behind 1 page
      const margin = this.score.pageSetup.pageHeight * this.zoom;

      return {
        root: this.$refs['page-background'],
        rootMargin: `${margin}px 0px ${margin}px 0px`,
      } as IntersectionObserver;
    },

    dialogOpen() {
      return (
        this.modeKeyDialogIsOpen ||
        this.pageSetupDialogIsOpen ||
        this.playbackSettingsDialogIsOpen ||
        this.syllablePositioningDialogIsOpen ||
        this.editorPreferencesDialogIsOpen
      );
    },

    filteredPages() {
      return this.printMode ? this.pages.filter((x) => !x.isEmpty) : this.pages;
    },
  },

  watch: {
    zoom() {
      document.documentElement.style.setProperty(
        '--zoom',
        this.zoom.toString(),
      );
    },

    currentFilePath() {
      window.document.title = this.windowTitle;
    },

    selectedWorkspaceId() {
      window.document.title = this.windowTitle;
    },

    hasUnsavedChanges() {
      window.document.title = this.windowTitle;
    },
  },

  async created() {
    // Attach the editor component to the window variable
    // so that it can be used for debugging
    (window as any)._editor = this;

    this.createThrottledMethods();

    try {
      const fontLoader = (document as any).fonts;

      const loadSystemFontsPromise = this.ipcService
        .getSystemFonts()
        .then((fonts) => (this.fonts = fonts));

      // Must load all fonts before loading any documents,
      // otherwise the text measurements will be wrong
      await Promise.all([
        loadSystemFontsPromise,
        fontLoader.load('1rem Athonite'),
        fontLoader.load('1rem "GFS Didot"'),
        fontLoader.load('1rem Neanes'),
        fontLoader.load('1rem NeanesStathisSeries'),
        fontLoader.load('1rem NeanesRTL'),
        fontLoader.load('1rem "Noto Naskh Arabic"'),
        fontLoader.load('1rem Omega'),
        fontLoader.load('1rem "Old Standard"'),
        fontLoader.load('1rem PFGoudyInitials'),
        fontLoader.load('1rem "Source Serif"'),
        fontLoader.ready,
      ]);

      await this.load();
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  },

  mounted() {
    const savedAudioOptions = localStorage.getItem('audioOptionsDefault');

    if (savedAudioOptions != null) {
      Object.assign(this.audioOptions, JSON.parse(savedAudioOptions));

      // -Infinity is not valid JSON, so it is serialized as null.
      // Deserialize as -Infinity
      this.audioOptions.volumeIson = this.audioOptions.volumeIson ?? -Infinity;
      this.audioOptions.volumeMelody =
        this.audioOptions.volumeMelody ?? -Infinity;
    }

    const savedEditorPreferences = localStorage.getItem('editorPreferences');

    if (savedEditorPreferences != null) {
      this.editorPreferences = EditorPreferences.createFrom(
        JSON.parse(savedEditorPreferences),
      );
    }

    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('keyup', this.onKeyup);
    window.addEventListener('resize', this.throttled.onWindowResize);

    EventBus.$on(IpcMainChannels.CloseWorkspaces, this.onCloseWorkspaces);
    EventBus.$on(IpcMainChannels.CloseApplication, this.onCloseApplication);

    EventBus.$on(IpcMainChannels.FileMenuNewScore, this.onFileMenuNewScore);
    EventBus.$on(IpcMainChannels.FileMenuOpenScore, this.onFileMenuOpenScore);
    EventBus.$on(IpcMainChannels.FileMenuPrint, this.onFileMenuPrint);
    EventBus.$on(IpcMainChannels.FileMenuSave, this.onFileMenuSave);
    EventBus.$on(IpcMainChannels.FileMenuSaveAs, this.onFileMenuSaveAs);
    EventBus.$on(IpcMainChannels.FileMenuPageSetup, this.onFileMenuPageSetup);
    EventBus.$on(IpcMainChannels.FileMenuImportOcr, this.onFileMenuImportOcr);
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsPdf,
      this.onFileMenuExportAsPdf,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsHtml,
      this.onFileMenuExportAsHtml,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsMusicXml,
      this.onFileMenuExportAsMusicXml,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsLatex,
      this.onFileMenuExportAsLatex,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsImage,
      this.onFileMenuExportAsImage,
    );
    EventBus.$on(IpcMainChannels.FileMenuUndo, this.onFileMenuUndo);
    EventBus.$on(IpcMainChannels.FileMenuRedo, this.onFileMenuRedo);
    EventBus.$on(IpcMainChannels.FileMenuCut, this.onFileMenuCut);
    EventBus.$on(IpcMainChannels.FileMenuCopy, this.onFileMenuCopy);
    EventBus.$on(IpcMainChannels.FileMenuCopyAsHtml, this.onFileMenuCopyAsHtml);
    EventBus.$on(IpcMainChannels.FileMenuCopyFormat, this.onFileMenuCopyFormat);
    EventBus.$on(IpcMainChannels.FileMenuPaste, this.onFileMenuPaste);
    EventBus.$on(
      IpcMainChannels.FileMenuPasteWithLyrics,
      this.onFileMenuPasteWithLyrics,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuPasteFormat,
      this.onFileMenuPasteFormat,
    );
    EventBus.$on(IpcMainChannels.FileMenuFind, this.onFileMenuFind);
    EventBus.$on(IpcMainChannels.FileMenuLyrics, this.onFileMenuLyrics);
    EventBus.$on(
      IpcMainChannels.FileMenuPreferences,
      this.onFileMenuPreferences,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertAnnotation,
      this.onFileMenuInsertAnnotation,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertAlternateLine,
      this.onFileMenuInsertAlternateLine,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertTextBox,
      this.onFileMenuInsertTextBox,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertRichTextBox,
      this.onFileMenuInsertRichTextBox,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertModeKey,
      this.onFileMenuInsertModeKey,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertDropCapBefore,
      this.onFileMenuInsertDropCapBefore,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertDropCapAfter,
      this.onFileMenuInsertDropCapAfter,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertImage,
      this.onFileMenuInsertImage,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertHeader,
      this.onFileMenuInsertHeader,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertFooter,
      this.onFileMenuInsertFooter,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuToolsCopyElementLink,
      this.onFileMenuToolsCopyElementLink,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuGenerateTestFile,
      this.onFileMenuGenerateTestFile,
    );

    EventBus.$on(
      AudioServiceEventNames.EventPlay,
      this.onAudioServiceEventPlay,
    );

    EventBus.$on(AudioServiceEventNames.Stop, this.onAudioServiceStop);
  },

  beforeUnmount() {
    // Remove the debugging variable from window
    (window as any)._editor = undefined;

    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('keyup', this.onKeyup);
    window.removeEventListener('resize', this.throttled.onWindowResize);

    EventBus.$off(IpcMainChannels.CloseWorkspaces, this.onCloseWorkspaces);
    EventBus.$off(IpcMainChannels.CloseApplication, this.onCloseApplication);

    EventBus.$off(IpcMainChannels.FileMenuNewScore, this.onFileMenuNewScore);
    EventBus.$off(IpcMainChannels.FileMenuOpenScore, this.onFileMenuOpenScore);
    EventBus.$off(IpcMainChannels.FileMenuPrint, this.onFileMenuPrint);
    EventBus.$off(IpcMainChannels.FileMenuSave, this.onFileMenuSave);
    EventBus.$off(IpcMainChannels.FileMenuSaveAs, this.onFileMenuSaveAs);
    EventBus.$off(IpcMainChannels.FileMenuPageSetup, this.onFileMenuPageSetup);
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsPdf,
      this.onFileMenuExportAsPdf,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsHtml,
      this.onFileMenuExportAsHtml,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsMusicXml,
      this.onFileMenuExportAsMusicXml,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsLatex,
      this.onFileMenuExportAsLatex,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsImage,
      this.onFileMenuExportAsImage,
    );
    EventBus.$off(IpcMainChannels.FileMenuUndo, this.onFileMenuUndo);
    EventBus.$off(IpcMainChannels.FileMenuRedo, this.onFileMenuRedo);
    EventBus.$off(IpcMainChannels.FileMenuCut, this.onFileMenuCut);
    EventBus.$off(IpcMainChannels.FileMenuCopy, this.onFileMenuCopy);
    EventBus.$off(
      IpcMainChannels.FileMenuCopyAsHtml,
      this.onFileMenuCopyAsHtml,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuCopyFormat,
      this.onFileMenuCopyFormat,
    );
    EventBus.$off(IpcMainChannels.FileMenuPaste, this.onFileMenuPaste);
    EventBus.$off(
      IpcMainChannels.FileMenuPasteWithLyrics,
      this.onFileMenuPasteWithLyrics,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuPasteFormat,
      this.onFileMenuPasteFormat,
    );
    EventBus.$off(IpcMainChannels.FileMenuFind, this.onFileMenuFind);
    EventBus.$off(IpcMainChannels.FileMenuLyrics, this.onFileMenuLyrics);
    EventBus.$off(
      IpcMainChannels.FileMenuPreferences,
      this.onFileMenuPreferences,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertAnnotation,
      this.onFileMenuInsertAnnotation,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertAlternateLine,
      this.onFileMenuInsertAlternateLine,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertTextBox,
      this.onFileMenuInsertTextBox,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertRichTextBox,
      this.onFileMenuInsertRichTextBox,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertModeKey,
      this.onFileMenuInsertModeKey,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertDropCapBefore,
      this.onFileMenuInsertDropCapBefore,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertDropCapAfter,
      this.onFileMenuInsertDropCapAfter,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertImage,
      this.onFileMenuInsertImage,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertHeader,
      this.onFileMenuInsertHeader,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertFooter,
      this.onFileMenuInsertFooter,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuToolsCopyElementLink,
      this.onFileMenuToolsCopyElementLink,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuGenerateTestFile,
      this.onFileMenuGenerateTestFile,
    );

    EventBus.$off(
      AudioServiceEventNames.EventPlay,
      this.onAudioServiceEventPlay,
    );

    EventBus.$off(AudioServiceEventNames.Stop, this.onAudioServiceStop);

    this.audioService.dispose();
  },

  methods: {
    createThrottledMethods() {
      this.throttled.assignLyrics = throttle(
        keydownThrottleIntervalMs,
        this.assignLyrics,
      );

      this.throttled.moveToPreviousLyricBox = throttle(
        keydownThrottleIntervalMs,
        this.moveToPreviousLyricBox,
      );

      this.throttled.moveToNextLyricBox = throttle(
        keydownThrottleIntervalMs,
        this.moveToNextLyricBox,
      );

      this.throttled.moveLeft = throttle(
        keydownThrottleIntervalMs,
        this.moveLeft,
      );

      this.throttled.moveRight = throttle(
        keydownThrottleIntervalMs,
        this.moveRight,
      );

      this.throttled.moveSelectionLeft = throttle(
        keydownThrottleIntervalMs,
        this.moveSelectionLeft,
      );

      this.throttled.moveSelectionRight = throttle(
        keydownThrottleIntervalMs,
        this.moveSelectionRight,
      );

      this.throttled.deleteSelectedElement = throttle(
        keydownThrottleIntervalMs,
        this.deleteSelectedElement,
      );

      this.throttled.deletePreviousElement = throttle(
        keydownThrottleIntervalMs,
        this.deletePreviousElement,
      );

      this.throttled.onFileMenuUndo = throttle(
        keydownThrottleIntervalMs,
        this.onFileMenuUndo,
      );

      this.throttled.onFileMenuRedo = throttle(
        keydownThrottleIntervalMs,
        this.onFileMenuRedo,
      );

      this.throttled.onCutScoreElements = throttle(
        keydownThrottleIntervalMs,
        this.onCutScoreElements,
      );

      this.throttled.onCopyScoreElements = throttle(
        keydownThrottleIntervalMs,
        this.onCopyScoreElements,
      );

      this.throttled.onFileMenuCopyAsHtml = throttle(
        keydownThrottleIntervalMs,
        this.onFileMenuCopyAsHtml,
      );

      this.throttled.onPasteScoreElements = throttle(
        keydownThrottleIntervalMs,
        this.onPasteScoreElements,
      );

      this.throttled.addQuantitativeNeume = throttle(
        keydownThrottleIntervalMs,
        this.addQuantitativeNeume,
      );

      this.throttled.addTempo = throttle(
        keydownThrottleIntervalMs,
        this.addTempo,
      );

      this.throttled.addAutoMartyria = throttle(
        keydownThrottleIntervalMs,
        this.addAutoMartyria,
      );

      this.throttled.updateNoteAndSave = throttle(
        keydownThrottleIntervalMs,
        this.updateNoteAndSave,
      );

      this.throttled.updateMartyria = throttle(
        keydownThrottleIntervalMs,
        this.updateMartyria,
      );

      this.throttled.setKlasma = throttle(
        keydownThrottleIntervalMs,
        this.setKlasma,
      );
      this.throttled.setGorgon = throttle(
        keydownThrottleIntervalMs,
        this.setGorgon,
      );
      this.throttled.setFthoraNote = throttle(
        keydownThrottleIntervalMs,
        this.setFthoraNote,
      );
      this.throttled.setFthoraMartyria = throttle(
        keydownThrottleIntervalMs,
        this.setFthoraMartyria,
      );
      this.throttled.setMartyriaTempo = throttle(
        keydownThrottleIntervalMs,
        this.setMartyriaTempo,
      );
      this.throttled.setAccidental = throttle(
        keydownThrottleIntervalMs,
        this.setAccidental,
      );
      this.throttled.setTimeNeume = throttle(
        keydownThrottleIntervalMs,
        this.setTimeNeume,
      );
      this.throttled.setMeasureNumber = throttle(
        keydownThrottleIntervalMs,
        this.setMeasureNumber,
      );
      this.throttled.setMeasureBarNote = throttle(
        keydownThrottleIntervalMs,
        this.setMeasureBarNote,
      );
      this.throttled.setMeasureBarMartyria = throttle(
        keydownThrottleIntervalMs,
        this.setMeasureBarMartyria,
      );
      this.throttled.setIson = throttle(
        keydownThrottleIntervalMs,
        this.setIson,
      );
      this.throttled.setTie = throttle(keydownThrottleIntervalMs, this.setTie);
      this.throttled.setVocalExpression = throttle(
        keydownThrottleIntervalMs,
        this.setVocalExpression,
      );

      this.throttled.onWindowResize = throttle(250, this.onWindowResize);
      this.throttled.onScroll = throttle(250, this.onScroll);

      this.saveDebounced = debounce(250, this.save);

      // Make sure we initialized all the throttled methods
      if (this.isDevelopment) {
        for (const [key, val] of Object.entries(this.throttled)) {
          if (val == null)
            throw new Error(
              `Missing initialization for throttled method '${key}'`,
            );
        }
      }
    },
    getHeaderHorizontalRuleStyle(headerHeight: number) {
      return {
        left: withZoom(this.score.pageSetup.leftMargin),
        top: withZoom(
          this.score.pageSetup.headerMargin +
            headerHeight +
            this.score.pageSetup.headerHorizontalRuleMarginTop,
        ),
        color: this.score.pageSetup.headerHorizontalRuleColor,
        borderTopWidth: withZoom(
          this.score.pageSetup.headerHorizontalRuleThickness,
        ),
        width: withZoom(this.score.pageSetup.innerPageWidth),
      } as StyleValue;
    },

    getFooterHorizontalRuleStyle(footerHeight: number) {
      return {
        left: withZoom(this.score.pageSetup.leftMargin),
        bottom: withZoom(
          this.score.pageSetup.footerMargin +
            footerHeight +
            this.score.pageSetup.footerHorizontalRuleMarginBottom,
        ),
        color: this.score.pageSetup.footerHorizontalRuleColor,
        borderTopWidth: withZoom(
          this.score.pageSetup.footerHorizontalRuleThickness,
        ),
        width: withZoom(this.score.pageSetup.innerPageWidth),
      } as StyleValue;
    },

    getLyricStyle(element: NoteElement) {
      return {
        direction: this.rtl ? 'rtl' : undefined,
        top: withZoom(element.lyricsVerticalOffset),
        paddingLeft:
          !element.isFullMelisma && element.lyricsHorizontalOffset > 0
            ? withZoom(element.lyricsHorizontalOffset)
            : undefined,
        paddingRight:
          !element.isFullMelisma && element.lyricsHorizontalOffset < 0
            ? withZoom(-element.lyricsHorizontalOffset)
            : undefined,
        fontSize: element.lyricsUseDefaultStyle
          ? withZoom(this.score.pageSetup.lyricsDefaultFontSize)
          : withZoom(element.lyricsFontSize),
        fontFamily: element.lyricsUseDefaultStyle
          ? getFontFamilyWithFallback(
              this.score.pageSetup.lyricsDefaultFontFamily,
              this.score.pageSetup.neumeDefaultFontFamily,
            )
          : getFontFamilyWithFallback(
              element.lyricsFontFamily,
              this.score.pageSetup.neumeDefaultFontFamily,
            ),
        fontWeight: element.lyricsUseDefaultStyle
          ? this.score.pageSetup.lyricsDefaultFontWeight
          : element.lyricsFontWeight,
        fontStyle: element.lyricsUseDefaultStyle
          ? this.score.pageSetup.lyricsDefaultFontStyle
          : element.lyricsFontStyle,
        textDecoration: element.lyricsUseDefaultStyle
          ? undefined
          : element.lyricsTextDecoration,
        color: element.lyricsUseDefaultStyle
          ? this.score.pageSetup.lyricsDefaultColor
          : element.lyricsColor,
        webkitTextStrokeWidth: element.lyricsUseDefaultStyle
          ? withZoom(this.score.pageSetup.lyricsDefaultStrokeWidth)
          : withZoom(element.lyricsStrokeWidth),
        lineHeight: withZoom(element.lyricsFontHeight),
        left: element.alignLeft ? 0 : undefined,
        textAlign: element.alignLeft ? 'left' : undefined,
      } as StyleValue;
    },

    getEmptyBoxStyle(element: EmptyElement) {
      return {
        width: withZoom(element.width),
        height: withZoom(element.height),
      } as StyleValue;
    },

    getElementStyle(element: ScoreElement) {
      return {
        left: !this.rtl ? withZoom(element.x) : undefined,
        right: this.rtl ? withZoom(element.x) : undefined,
        top: withZoom(element.y),
      } as StyleValue;
    },

    getMelismaStyle(element: NoteElement) {
      return {
        width: withZoom(element.melismaWidth),
        minHeight: element.lyricsUseDefaultStyle
          ? withZoom(this.score.pageSetup.lyricsDefaultFontSize)
          : withZoom(element.lyricsFontSize),
      } as StyleValue;
    },

    getMelismaUnderscoreStyleOuter(element: NoteElement) {
      return {
        top: withZoom(element.melismaOffsetTop),
        height: withZoom(element.lyricsFontHeight),
        width: withZoom(element.melismaWidth),
      };
    },

    getMelismaUnderscoreStyleInner(element: NoteElement) {
      const thickness = this.score.pageSetup.lyricsMelismaThickness;

      const spacing = !element.isFullMelisma
        ? this.score.pageSetup.lyricsMelismaSpacing
        : 0;

      return {
        borderBottom: `${withZoom(thickness)} solid ${
          element.lyricsUseDefaultStyle
            ? this.score.pageSetup.lyricsDefaultColor
            : element.lyricsColor
        }`,
        left: withZoom(spacing),
        width: `calc(100% - ${withZoom(spacing)})`,
      };
    },

    getMelismaHyphenStyle(element: NoteElement, index: number) {
      return {
        left: withZoom(element.hyphenOffsets[index]),
      } as StyleValue;
    },

    getTempFilename() {
      return `Untitled-${untitledIndex++}`;
    },

    getFileName(workspace: Workspace, showUnsavedChanges: boolean = true) {
      const unsavedChangesMarker =
        workspace.hasUnsavedChanges && showUnsavedChanges ? '*' : '';

      if (workspace.filePath != null) {
        const fileName = getFileNameFromPath(workspace.filePath);
        return `${unsavedChangesMarker}${fileName}`;
      } else {
        return `${unsavedChangesMarker}${workspace.tempFileName}`;
      }
    },

    getHeaderForPageIndex(pageIndex: number) {
      const pageNumber = pageIndex + 1;

      const header = this.score.getHeaderForPage(pageNumber);

      // Currently, headers only support a single text box element.
      return header.elements[0] as TextBoxElement | RichTextBoxElement;
    },

    getFooterForPageIndex(pageIndex: number) {
      const pageNumber = pageIndex + 1;

      const footer = this.score.getFooterForPage(pageNumber);

      // Currently, footers only support a single text box element.
      return footer.elements[0] as TextBoxElement | RichTextBoxElement;
    },

    shouldShowHeaderForPageIndex(pageIndex: number) {
      const pageNumber = pageIndex + 1;

      return this.score.shouldShowHeaderOnPage(pageNumber);
    },

    shouldShowFooterForPageIndex(pageIndex: number) {
      const pageNumber = pageIndex + 1;

      return this.score.shouldShowFooterOnPage(pageNumber);
    },

    getTokenMetadata(pageIndex: number): TokenMetadata {
      return {
        pageNumber: pageIndex + this.score.pageSetup.firstPageNumber,
        numberOfPages:
          this.pageCount + this.score.pageSetup.firstPageNumber - 1,
        fileName:
          this.selectedWorkspace.filePath != null
            ? getFileNameFromPath(this.selectedWorkspace.filePath)
            : this.selectedWorkspace.tempFileName,
        filePath: this.currentFilePath || '',
      };
    },

    getElementIndex(element: ScoreElement) {
      return element.index;
    },

    setSelectionRange(element: ScoreElement) {
      const elementIndex = this.getElementIndex(element);

      if (this.selectedElement != null) {
        this.selectionRange = {
          start: this.selectedElementIndex,
          end: elementIndex,
        };

        this.selectedElement = null;
      } else if (this.selectionRange != null) {
        this.selectionRange.end = elementIndex;
      }
    },

    getNormalizedSelectionRange() {
      if (this.selectionRange == null) {
        return null;
      }

      const start = Math.min(
        this.selectionRange.start,
        this.selectionRange.end,
      );
      const end = Math.max(this.selectionRange.start, this.selectionRange.end);

      return {
        start,
        end,
      } as ScoreElementSelectionRange;
    },

    isSelected(element: ScoreElement) {
      if (this.selectedElement === element) {
        return true;
      }
      if (this.selectionRange != null) {
        const start = Math.min(
          this.selectionRange.start,
          this.selectionRange.end,
        );
        const end = Math.max(
          this.selectionRange.start,
          this.selectionRange.end,
        );

        return (
          start <= this.getElementIndex(element) &&
          this.getElementIndex(element) <= end
        );
      }

      return false;
    },

    setSelectedAnnotation(
      parent: ScoreElement | null,
      annotation: AnnotationElement,
    ) {
      this.selectedElement = parent;
      this.selectedWorkspace.selectedAnnotationElement = annotation;
    },

    setSelectedAlternateLine(
      parent: ScoreElement | null,
      alternateLine: AlternateLineElement,
    ) {
      this.selectedElement = parent;
      this.selectedWorkspace.selectedAlternateLineElement = alternateLine;
    },

    isAudioSelected(element: ScoreElement) {
      return this.audioElement === element;
    },

    isMelisma(element: NoteElement) {
      return element.melismaWidth > 0;
    },

    openModeKeyDialog() {
      this.modeKeyDialogIsOpen = true;
    },

    closeModeKeyDialog() {
      this.modeKeyDialogIsOpen = false;
    },

    openSyllablePositioningDialog() {
      this.syllablePositioningDialogIsOpen = true;
    },

    closeSyllablePositioningDialog() {
      this.syllablePositioningDialogIsOpen = false;
    },

    openPlaybackSettingsDialog() {
      this.playbackSettingsDialogIsOpen = true;

      this.stopAudio();
    },

    closePlaybackSettingsDialog() {
      this.playbackSettingsDialogIsOpen = false;

      this.saveAudioOptions();
    },

    closePageSetupDialog() {
      this.pageSetupDialogIsOpen = false;
    },

    closeExportDialog() {
      this.exportDialogIsOpen = false;
    },

    openLyricManager() {
      this.lyricManagerIsOpen = true;
      this.refreshStaffLyrics();
    },

    closeLyricManager() {
      this.lyricManagerIsOpen = false;
    },

    updateEditorPreferences(form: EditorPreferences) {
      Object.assign(this.editorPreferences, form);

      this.saveEditorPreferences();

      this.editorPreferencesDialogIsOpen = false;
    },

    closeEditorPreferencesDialog() {
      this.editorPreferencesDialogIsOpen = false;
    },

    saveEditorPreferences() {
      localStorage.setItem(
        'editorPreferences',
        JSON.stringify(this.editorPreferences),
      );
    },

    isLastElement(element: ScoreElement) {
      return this.elements.indexOf(element) === this.elements.length - 1;
    },

    insertPelastikon() {
      document.execCommand('insertText', false, PELASTIKON);
    },

    insertGorthmikon() {
      document.execCommand('insertText', false, GORTHMIKON);
    },

    insertSpecialCharacter(character: string) {
      document.execCommand('insertText', false, character);
    },

    addQuantitativeNeume(
      quantitativeNeume: QuantitativeNeume,
      secondaryGorgonNeume: GorgonNeume | null = null,
    ) {
      if (this.selectedElement == null) {
        return;
      }

      const element = new NoteElement();
      element.lyricsColor = this.score.pageSetup.lyricsDefaultColor;
      element.lyricsFontFamily = this.score.pageSetup.lyricsDefaultFontFamily;
      element.lyricsFontSize = this.score.pageSetup.lyricsDefaultFontSize;
      element.lyricsFontStyle = this.score.pageSetup.lyricsDefaultFontStyle;
      element.lyricsFontWeight = this.score.pageSetup.lyricsDefaultFontWeight;
      element.lyricsStrokeWidth = this.score.pageSetup.lyricsDefaultStrokeWidth;

      element.quantitativeNeume = quantitativeNeume;
      // Special case for neumes with secondary gorgon
      if (getSecondaryNeume(quantitativeNeume) != null) {
        element.secondaryGorgonNeume = secondaryGorgonNeume;
      }

      // If the selected element is an alternate line element,
      // add the new element to the alternate line's elements
      // and return immediately. Alternate lines do not support
      // different entry modes.
      if (this.selectedWorkspace.selectedAlternateLineElement != null) {
        this.addScoreElement(
          element,
          this.selectedWorkspace.selectedAlternateLineElement.elements.length,
          this.selectedWorkspace.selectedAlternateLineElement.elements,
        );
        this.save();
        return;
      }

      switch (this.entryMode) {
        case EntryMode.Auto:
          if (!this.isLastElement(this.selectedElement) && !this.moveRight()) {
            return;
          }

          if (this.isLastElement(this.selectedElement)) {
            this.addScoreElement(element, this.selectedElementIndex);
            this.selectedElement = element;
          } else {
            if (this.selectedElement.elementType === ElementType.Note) {
              if (
                (this.selectedElement as NoteElement).quantitativeNeume !==
                quantitativeNeume
              ) {
                this.updateNote(this.selectedElement as NoteElement, {
                  quantitativeNeume,
                  secondaryGorgonNeume,
                });
              } else if (
                (this.selectedElement as NoteElement).secondaryGorgonNeume !==
                secondaryGorgonNeume
              ) {
                // Special case for hyporoe gorgon
                this.updateNote(this.selectedElement as NoteElement, {
                  secondaryGorgonNeume,
                });
              }
            } else {
              this.selectedElement = this.switchToSyllable(
                this.selectedElement,
                element,
              );
            }
          }
          break;
        case EntryMode.Insert:
          if (this.isLastElement(this.selectedElement)) {
            this.addScoreElement(element, this.selectedElementIndex);
          } else {
            if (this.selectedElement.elementType === ElementType.Note) {
              const selectedElementAsNote = this.selectedElement as NoteElement;

              element.isMelisma = selectedElementAsNote.isMelisma;
              element.isHyphen = selectedElementAsNote.isHyphen;
            }

            this.addScoreElement(element, this.selectedElementIndex + 1);
          }
          this.selectedElement = element;
          break;

        case EntryMode.Edit:
          if (this.isLastElement(this.selectedElement)) {
            this.addScoreElement(element, this.selectedElementIndex);
          } else if (this.selectedElement.elementType === ElementType.Note) {
            if (
              (this.selectedElement as NoteElement).quantitativeNeume !==
              quantitativeNeume
            ) {
              this.updateNote(this.selectedElement as NoteElement, {
                quantitativeNeume,
                secondaryGorgonNeume,
              });
            } else if (
              (this.selectedElement as NoteElement).secondaryGorgonNeume !==
              secondaryGorgonNeume
            ) {
              // Special case for hyporoe gorgon
              this.updateNote(this.selectedElement as NoteElement, {
                secondaryGorgonNeume,
              });
            }
          } else if (
            navigableElements.includes(this.selectedElement.elementType)
          ) {
            this.selectedElement = this.switchToSyllable(
              this.selectedElement,
              element,
            );
          }
          break;
      }

      this.save();
    },

    addNeumeCombination(combo: NeumeCombination) {
      const backup = this.clipboard.slice();
      this.clipboard = combo.elements;
      this.onPasteScoreElements(false);

      this.clipboard = backup;
    },

    addAutoMartyria(alignRight?: boolean, note?: Note) {
      if (this.selectedElement == null) {
        return;
      }

      const element = new MartyriaElement();
      element.alignRight = alignRight === true;

      if (note != null) {
        element.note = note;
        element.auto = false;
      }

      switch (this.entryMode) {
        case EntryMode.Auto:
          this.moveRight();

          if (this.isLastElement(this.selectedElement)) {
            this.addScoreElement(element, this.selectedElementIndex);
            this.selectedElement = element;
          } else {
            if (this.selectedElement.elementType != ElementType.Martyria) {
              this.selectedElement = this.switchToMartyria(
                this.selectedElement,
              );
            }
          }
          break;
        case EntryMode.Insert:
          if (this.isLastElement(this.selectedElement)) {
            this.addScoreElement(element, this.selectedElementIndex);
          } else {
            this.addScoreElement(element, this.selectedElementIndex + 1);
          }
          this.selectedElement = element;
          break;
        case EntryMode.Edit:
          if (this.isLastElement(this.selectedElement)) {
            this.addScoreElement(element, this.selectedElementIndex);
          } else if (this.selectedElement.elementType != ElementType.Martyria) {
            this.selectedElement = this.switchToMartyria(this.selectedElement);
          }
          break;
      }

      this.save();
    },

    addTempo(neume: TempoSign) {
      if (this.selectedElement == null) {
        return;
      }

      const element = new TempoElement();
      element.neume = neume;
      element.bpm =
        this.editorPreferences.getDefaultTempo(neume) ??
        TempoElement.getDefaultBpm(neume);

      switch (this.entryMode) {
        case EntryMode.Auto:
          this.moveRight();

          if (this.isLastElement(this.selectedElement)) {
            this.addScoreElement(element, this.selectedElementIndex);
            this.selectedElement = element;
          } else {
            if (this.selectedElement.elementType === ElementType.Tempo) {
              if ((this.selectedElement as TempoElement).neume !== neume) {
                this.updateTempo(this.selectedElement as TempoElement, {
                  neume,
                });
              }
            } else {
              this.selectedElement = this.switchToTempo(
                this.selectedElement,
                element,
              );
            }
          }
          break;
        case EntryMode.Insert:
          if (this.isLastElement(this.selectedElement)) {
            this.addScoreElement(element, this.selectedElementIndex);
          } else {
            this.addScoreElement(element, this.selectedElementIndex + 1);
          }
          this.selectedElement = element;
          break;
        case EntryMode.Edit:
          if (this.isLastElement(this.selectedElement)) {
            this.addScoreElement(element, this.selectedElementIndex);
          } else if (this.selectedElement.elementType === ElementType.Tempo) {
            if ((this.selectedElement as TempoElement).neume !== neume) {
              this.updateTempo(this.selectedElement as TempoElement, {
                neume,
              });
            }
          } else {
            this.selectedElement = this.switchToTempo(
              this.selectedElement,
              element,
            );
          }
          break;
      }

      this.save();
    },

    addDropCap(after: boolean) {
      if (this.selectedElement == null) {
        return;
      }

      const element = new DropCapElement();

      element.color = this.score.pageSetup.dropCapDefaultColor;
      element.fontFamily = this.score.pageSetup.dropCapDefaultFontFamily;
      element.fontSize = this.score.pageSetup.dropCapDefaultFontSize;
      element.strokeWidth = this.score.pageSetup.dropCapDefaultStrokeWidth;
      element.fontWeight = this.score.pageSetup.dropCapDefaultFontWeight;
      element.fontStyle = this.score.pageSetup.dropCapDefaultFontStyle;
      element.lineHeight = this.score.pageSetup.dropCapDefaultLineHeight;
      element.lineSpan = this.score.pageSetup.dropCapDefaultLineSpan;

      if (after && !this.isLastElement(this.selectedElement)) {
        this.addScoreElement(element, this.selectedElementIndex + 1);
      } else {
        this.addScoreElement(element, this.selectedElementIndex);
      }

      this.selectedElement = element;
      this.save();

      nextTick(() => {
        const index = this.elements.indexOf(element);

        (this.$refs[`element-${index}`] as any)[0].focus();
      });
    },

    onClickAddImage() {
      EventBus.$emit(IpcRendererChannels.OpenImageDialog);
    },

    togglePageBreak() {
      if (this.selectedElement && !this.isLastElement(this.selectedElement)) {
        this.commandService.execute(
          scoreElementCommandFactory.create('update-properties', {
            target: this.selectedElement,
            newValues: {
              pageBreak: !this.selectedElement.pageBreak,
              lineBreak: false,
            },
          }),
        );

        this.save();
      }
    },

    toggleLineBreak(lineBreakType: LineBreakType | null) {
      if (this.selectedElement && !this.isLastElement(this.selectedElement)) {
        let lineBreak = !this.selectedElement.lineBreak;

        if (lineBreakType != this.selectedElement.lineBreakType) {
          lineBreak = true;
        }

        if (!lineBreak) {
          lineBreakType = null;
        }

        this.commandService.execute(
          scoreElementCommandFactory.create('update-properties', {
            target: this.selectedElement,
            newValues: {
              lineBreak,
              pageBreak: false,
              lineBreakType,
            },
          }),
        );

        this.save();
      }
    },

    updateScoreElementSectionName(
      element: ScoreElement,
      sectionName: string | null,
    ) {
      if (sectionName != null && sectionName.trim() == '') {
        sectionName = null;
      }

      this.commandService.execute(
        scoreElementCommandFactory.create('update-properties', {
          target: element,
          newValues: {
            sectionName,
          },
        }),
      );

      this.save();
    },

    switchToMartyria(element: ScoreElement) {
      const index = this.elements.indexOf(element);

      const newElement = new MartyriaElement();
      newElement.pageBreak = element.pageBreak;
      newElement.lineBreak = element.lineBreak;

      this.replaceScoreElement(newElement, index);

      return newElement;
    },

    switchToTempo(oldElement: ScoreElement, newElement: TempoElement) {
      const index = this.elements.indexOf(oldElement);

      newElement.pageBreak = oldElement.pageBreak;
      newElement.lineBreak = oldElement.lineBreak;

      this.replaceScoreElement(newElement, index);

      return newElement;
    },

    switchToSyllable(oldElement: ScoreElement, newElement: NoteElement) {
      const index = this.elements.indexOf(oldElement);

      newElement.pageBreak = oldElement.pageBreak;
      newElement.lineBreak = oldElement.lineBreak;

      this.replaceScoreElement(newElement, index);

      return newElement;
    },

    focusLyrics(index: number, selectAll: boolean = false) {
      (
        this.$refs[`lyrics-${index}`] as InstanceType<typeof ContentEditable>[]
      )[0].focus(selectAll);
    },

    setLyrics(index: number, lyrics: string) {
      const elements = this.$refs[`lyrics-${index}`] as InstanceType<
        typeof ContentEditable
      >[];

      if (elements?.length > 0) {
        elements[0].setInnerText(lyrics);
      }
    },

    isSyllableElement(element: ScoreElement) {
      return element.elementType == ElementType.Note;
    },

    isMartyriaElement(element: ScoreElement) {
      return element.elementType == ElementType.Martyria;
    },

    isTempoElement(element: ScoreElement) {
      return element.elementType == ElementType.Tempo;
    },

    isEmptyElement(element: ScoreElement) {
      return element.elementType == ElementType.Empty;
    },

    isTextBoxElement(element: ScoreElement) {
      return element.elementType == ElementType.TextBox;
    },

    isRichTextBoxElement(element: ScoreElement) {
      return element.elementType == ElementType.RichTextBox;
    },

    isDropCapElement(element: ScoreElement) {
      return element.elementType == ElementType.DropCap;
    },

    isModeKeyElement(element: ScoreElement) {
      return element.elementType == ElementType.ModeKey;
    },

    isImageBoxElement(element: ScoreElement) {
      return element.elementType == ElementType.ImageBox;
    },

    isTextInputFocused() {
      return (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        (document.activeElement instanceof HTMLElement &&
          document.activeElement.isContentEditable)
      );
    },

    onWindowResize() {
      if (this.zoomToFit) {
        this.performZoomToFit();
      }
    },

    onScroll() {
      this.calculatePageNumber();
    },

    onKeydown(event: KeyboardEvent) {
      // Handle undo / redo
      // See https://github.com/electron/electron/issues/3682.
      if (
        (event.ctrlKey || event.metaKey) &&
        !this.isTextInputFocused() &&
        !this.dialogOpen
      ) {
        if (event.code === 'KeyZ') {
          if (this.platformService.isMac && event.shiftKey) {
            this.throttled.onFileMenuRedo();
          } else {
            this.throttled.onFileMenuUndo();
          }
          event.preventDefault();
          return;
        } else if (event.code === 'KeyY') {
          this.throttled.onFileMenuRedo();
          event.preventDefault();
          return;
        } else if (event.code === 'KeyX') {
          this.throttled.onCutScoreElements();
          event.preventDefault();
          return;
        } else if (event.code === 'KeyC') {
          if (event.shiftKey) {
            this.throttled.onFileMenuCopyAsHtml();
          } else {
            this.throttled.onCopyScoreElements();
          }
          event.preventDefault();
          return;
        } else if (event.code === 'KeyV') {
          const includeLyrics = event.shiftKey;
          this.throttled.onPasteScoreElements(includeLyrics);
          event.preventDefault();
          return;
        } else if (event.code === 'KeyI' && !event.shiftKey) {
          switch (this.entryMode) {
            case EntryMode.Auto:
              this.updateEntryMode(EntryMode.Insert);
              break;
            case EntryMode.Insert:
              this.updateEntryMode(EntryMode.Edit);
              break;
            case EntryMode.Edit:
              this.updateEntryMode(EntryMode.Auto);
              break;
          }
          return;
        } else if (event.code === 'KeyU' && !event.shiftKey) {
          switch (this.entryMode) {
            case EntryMode.Auto:
              this.updateEntryMode(EntryMode.Edit);
              break;
            case EntryMode.Edit:
              this.updateEntryMode(EntryMode.Insert);
              break;
            case EntryMode.Insert:
              this.updateEntryMode(EntryMode.Auto);
              break;
          }
          return;
        }
      }

      if (
        this.platformService.isMac &&
        this.isTextInputFocused() &&
        !this.dialogOpen
      ) {
        this.onKeydownMac(event);
      }

      if (this.selectedLyrics != null) {
        return this.onKeydownLyrics(event);
      }

      if (this.selectedElement?.elementType === ElementType.DropCap) {
        return this.onKeydownDropCap(event);
      }

      if (this.selectedElement?.elementType === ElementType.TextBox) {
        return this.onKeydownTextBox(event);
      }

      if (!this.isTextInputFocused() && !this.dialogOpen) {
        return this.onKeydownNeume(event);
      }
    },

    onKeydownNeume(event: KeyboardEvent) {
      let handled = false;

      if (event.shiftKey) {
        switch (event.code) {
          case 'ArrowLeft':
            this.throttled.moveSelectionLeft();
            handled = true;
            break;
          case 'ArrowRight':
            this.throttled.moveSelectionRight();
            handled = true;
            break;
        }
      } else {
        switch (event.code) {
          case 'ArrowLeft':
            if (!this.rtl) {
              this.throttled.moveLeft();
            } else {
              this.throttled.moveRight();
            }
            handled = true;
            break;
          case 'ArrowRight':
            if (!this.rtl) {
              this.throttled.moveRight();
            } else {
              this.throttled.moveLeft();
            }
            handled = true;
            break;
          case 'ArrowDown':
            if (
              (event.ctrlKey || event.metaKey) &&
              this.selectedElement?.elementType === ElementType.Note
            ) {
              const index = this.selectedElementIndex;

              this.focusLyrics(index, true);

              // Select All doesn't work until after the lyrics have been selected,
              // hence we call focus lyrics twice
              nextTick(() => {
                this.focusLyrics(index, true);
              });

              handled = true;
            }
            break;
          case 'Space':
            if (!event.repeat) {
              if (
                this.audioService.state === AudioState.Stopped ||
                event.ctrlKey
              ) {
                this.playAudio();
              } else {
                this.pauseAudio();
              }
              handled = true;
            }
            break;
          case 'Backspace':
            handled = true;
            this.throttled.deletePreviousElement();
            break;
          case 'Delete':
            handled = true;
            this.throttled.deleteSelectedElement();
            break;
        }
      }

      if (
        this.selectedElement != null &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (this.neumeKeyboard.isModifier(event.code)) {
          this.keyboardModifier = event.code;
          handled = true;
        }

        const quantitativeMapping = this.neumeKeyboard.findQuantitativeMapping(
          event,
          this.keyboardModifier,
        );

        if (quantitativeMapping != null) {
          handled = true;

          if (quantitativeMapping.acceptsLyricsOption != null) {
            if (this.selectedElement.elementType === ElementType.Note) {
              this.throttled.updateNoteAndSave(
                this.selectedElement as NoteElement,
                {
                  acceptsLyrics: quantitativeMapping.acceptsLyricsOption,
                },
              );
            }
          } else {
            this.throttled.addQuantitativeNeume(
              quantitativeMapping.neume as QuantitativeNeume,
            );
          }
        }

        const tempoMapping = this.neumeKeyboard.findTempoMapping(
          event,
          this.keyboardModifier,
        );

        if (tempoMapping != null) {
          handled = true;
          this.throttled.addTempo(tempoMapping.neume as TempoSign);
        }

        if (
          this.keyboardModifier == null &&
          this.neumeKeyboard.isMartyria(event.code)
        ) {
          handled = true;
          this.throttled.addAutoMartyria(event.shiftKey);
        }

        const martyriaConfigMapping =
          this.neumeKeyboard.findMartyriaConfigMapping(
            event,
            this.keyboardModifier,
          );

        if (martyriaConfigMapping != null) {
          if (martyriaConfigMapping.note != null) {
            handled = true;

            this.throttled.addAutoMartyria(
              martyriaConfigMapping.martyriaAlignmentToggle,
              martyriaConfigMapping.note,
            );
          }
        }

        if (
          this.selectedElement.elementType === ElementType.Note &&
          !event.repeat
        ) {
          const noteElement = this.selectedElement as NoteElement;

          const gorgonMapping = this.neumeKeyboard.findGorgonMapping(
            event,
            this.keyboardModifier,
          );

          if (gorgonMapping != null) {
            handled = true;
            this.throttled.setGorgon(
              noteElement,
              gorgonMapping.neumes as GorgonNeume[],
            );
          }

          const vocalExpressionMapping =
            this.neumeKeyboard.findVocalExpressionMapping(
              event,
              this.keyboardModifier,
            );

          if (vocalExpressionMapping != null) {
            handled = true;

            if (vocalExpressionMapping.neume === VocalExpressionNeume.Vareia) {
              this.throttled.updateNoteAndSave(noteElement, {
                vareia: !noteElement.vareia,
              });
            } else {
              this.throttled.setVocalExpression(
                noteElement,
                vocalExpressionMapping.neume as VocalExpressionNeume,
              );
            }
          }

          const tieMapping = this.neumeKeyboard.findTieMapping(
            event,
            this.keyboardModifier,
          );

          if (tieMapping != null) {
            handled = true;

            this.throttled.setTie(noteElement, tieMapping.neumes as Tie[]);
          }

          const fthoraMapping = this.neumeKeyboard.findFthoraMapping(
            event,
            this.keyboardModifier,
          );

          if (fthoraMapping != null) {
            handled = true;
            this.throttled.setFthoraNote(
              noteElement,
              fthoraMapping.neumes as Fthora[],
            );
          }

          const accidentalMapping = this.neumeKeyboard.findAccidentalMapping(
            event,
            this.keyboardModifier,
          );

          if (accidentalMapping != null) {
            handled = true;
            this.throttled.setAccidental(
              noteElement,
              accidentalMapping.neume as Accidental,
            );
          }

          const hapliMapping = this.neumeKeyboard.findHapliMapping(
            event,
            this.keyboardModifier,
          );

          if (hapliMapping != null) {
            handled = true;

            if (hapliMapping.neume === TimeNeume.Koronis) {
              this.throttled.updateNoteAndSave(noteElement, {
                koronis: !noteElement.koronis,
              });
            } else {
              this.throttled.setTimeNeume(
                noteElement,
                hapliMapping.neume as TimeNeume,
              );
            }
          }

          const measureNumberMapping =
            this.neumeKeyboard.findMeasureNumberMapping(
              event,
              this.keyboardModifier,
            );

          if (measureNumberMapping != null) {
            handled = true;
            this.throttled.setMeasureNumber(
              noteElement,
              measureNumberMapping.neume as MeasureNumber,
            );
          }

          const measureBarMapping = this.neumeKeyboard.findMeasureBarMapping(
            event,
            this.keyboardModifier,
          );

          if (measureBarMapping != null) {
            handled = true;
            this.throttled.setMeasureBarNote(
              noteElement,
              measureBarMapping.neume as MeasureBar,
            );
          }

          const isonMapping = this.neumeKeyboard.findIsonMapping(
            event,
            this.keyboardModifier,
          );

          if (isonMapping != null) {
            handled = true;
            this.throttled.setIson(noteElement, isonMapping.neume as Ison);
          }

          if (
            this.keyboardModifier == null &&
            this.neumeKeyboard.isMartyria(event.code)
          ) {
            this.throttled.addAutoMartyria();
          } else if (
            this.keyboardModifier == null &&
            this.neumeKeyboard.isKlasma(event.code)
          ) {
            this.throttled.setKlasma(noteElement);
          } else if (
            this.keyboardModifier == null &&
            this.neumeKeyboard.isNoteIndicator(event.code)
          ) {
            this.throttled.updateNoteAndSave(noteElement, {
              noteIndicator: !noteElement.noteIndicator,
            });
          }
        } else if (
          this.selectedElement.elementType === ElementType.Martyria &&
          !event.repeat
        ) {
          const martyriaElement = this.selectedElement as MartyriaElement;

          const fthoraMapping = this.neumeKeyboard.findFthoraMapping(
            event,
            this.keyboardModifier,
          );

          if (fthoraMapping != null) {
            handled = true;
            this.throttled.setFthoraMartyria(
              martyriaElement,
              fthoraMapping.neumes![0] as Fthora,
            );
          }

          const tempoMapping = this.neumeKeyboard.findMartyriaTempoMapping(
            event,
            this.keyboardModifier,
          );

          if (tempoMapping != null) {
            handled = true;
            this.throttled.setMartyriaTempo(
              martyriaElement,
              tempoMapping.neume as TempoSign,
            );
          }

          const measureBarMapping = this.neumeKeyboard.findMeasureBarMapping(
            event,
            this.keyboardModifier,
          );

          if (measureBarMapping != null) {
            handled = true;
            this.throttled.setMeasureBarMartyria(
              martyriaElement,
              measureBarMapping.neume as MeasureBar,
            );
          }

          const martyriaConfigMapping =
            this.neumeKeyboard.findMartyriaConfigMapping(
              event,
              this.keyboardModifier,
            );

          if (martyriaConfigMapping != null) {
            handled = true;

            if (martyriaConfigMapping.note != null) {
              // This case will not currently happen
              // because no keyboard mapping exist for it
              this.throttled.updateMartyria(martyriaElement, {
                note: martyriaConfigMapping.note,
              });
            } else if (martyriaConfigMapping.scale != null) {
              this.throttled.updateMartyria(martyriaElement, {
                scale: martyriaConfigMapping.scale,
              });
            } else if (martyriaConfigMapping.martyriaAlignmentToggle === true) {
              this.throttled.updateMartyria(martyriaElement, {
                alignRight: !martyriaElement.alignRight,
              });
            } else if (martyriaConfigMapping.martyriaAutoToggle === true) {
              this.throttled.updateMartyria(martyriaElement, {
                auto: !martyriaElement.auto,
              });
            }
          }
        }
      }
      if (handled) {
        event.preventDefault();
      }
    },

    onKeydownLyrics(event: KeyboardEvent) {
      let handled = false;

      // Do not allow enter key in lyrics
      if (event.code === 'Enter') {
        event.preventDefault();
        return;
      }

      switch (event.code) {
        case 'ArrowRight':
          if (event.shiftKey) {
            return;
          }

          if (event.ctrlKey || event.metaKey) {
            if (!this.rtl) {
              this.throttled.moveToNextLyricBox();
            } else {
              this.throttled.moveToPreviousLyricBox();
            }
            handled = true;
          } else if (
            !this.rtl &&
            getCursorPosition() === this.getLyricLength(this.selectedLyrics!)
          ) {
            this.throttled.moveToNextLyricBox();
            handled = true;
          } else if (this.rtl && getCursorPosition() === 0) {
            this.throttled.moveToPreviousLyricBox();
            handled = true;
          }
          break;
        case 'ArrowLeft':
          if (event.shiftKey) {
            return;
          }

          if (event.ctrlKey || event.metaKey) {
            if (!this.rtl) {
              this.throttled.moveToPreviousLyricBox();
            } else {
              this.throttled.moveToNextLyricBox();
            }
            handled = true;
          } else if (!this.rtl && getCursorPosition() === 0) {
            this.throttled.moveToPreviousLyricBox();
            handled = true;
          } else if (
            this.rtl &&
            getCursorPosition() === this.getLyricLength(this.selectedLyrics!)
          ) {
            this.throttled.moveToNextLyricBox();
            handled = true;
          }
          break;
        case 'ArrowUp':
          if (event.shiftKey) {
            return;
          }

          if (event.ctrlKey || event.metaKey) {
            this.selectedElement = this.selectedLyrics;
            this.blurActiveElement();
            window.getSelection()?.removeAllRanges();
            handled = true;
          }
          break;
        case 'Space':
          // Ctrl + Space should add a normal space character
          if (event.ctrlKey || event.metaKey) {
            document.execCommand('insertText', false, ' ');
          } else {
            this.throttled.moveToNextLyricBox(true);
          }
          handled = true;
          break;
        case 'Minus': {
          if (event.shiftKey) {
            document.execCommand('insertText', false, '_');
          } else {
            document.execCommand('insertText', false, '-');
          }

          // Ctrl key overrides the "go to next lyrics" (Alt key for mac)
          const overridden =
            (this.platformService.isMac && event.altKey) ||
            (!this.platformService.isMac && event.ctrlKey);

          if (
            !overridden &&
            getCursorPosition() === this.getLyricLength(this.selectedLyrics!)
          ) {
            if (this.getNextLyricBoxIndex() >= 0) {
              this.throttled.moveToNextLyricBox();
            } else {
              // If this is the last lyric box, blur
              // so that the melisma is registered and
              // the user doesn't accidentally type more
              // characters into box
              const index = this.elements.indexOf(this.selectedLyrics!);
              (
                this.$refs[`lyrics-${index}`] as InstanceType<
                  typeof ContentEditable
                >[]
              )[0].blur();
            }
          }

          handled = true;
          break;
        }
        case 'KeyJ': {
          if (!this.rtl) {
            return;
          }
          if (event.shiftKey) {
            document.execCommand('insertText', false, TATWEEL);
          } else {
            return;
          }

          // Ctrl key overrides the "go to next lyrics" (Alt key for mac)
          const overridden =
            (this.platformService.isMac && event.altKey) ||
            (!this.platformService.isMac && event.ctrlKey);

          if (
            !overridden &&
            getCursorPosition() === this.getLyricLength(this.selectedLyrics!)
          ) {
            if (this.getNextLyricBoxIndex() >= 0) {
              this.throttled.moveToNextLyricBox();
            } else {
              // If this is the last lyric box, blur
              // so that the melisma is registered and
              // the user doesn't accidentally type more
              // characters into box
              const index = this.elements.indexOf(this.selectedLyrics!);
              (
                this.$refs[`lyrics-${index}`] as InstanceType<
                  typeof ContentEditable
                >[]
              )[0].blur();
            }
          }

          handled = true;
          break;
        }
      }

      if (handled) {
        event.preventDefault();
      }
    },

    onKeydownDropCap(event: KeyboardEvent) {
      let handled = false;

      const index = this.elements.indexOf(this.selectedElement!);
      const htmlElement = (
        this.$refs[`element-${index}`] as InstanceType<typeof DropCap>[]
      )[0];

      switch (event.code) {
        case 'Enter':
          // Do not allow enter key in drop caps
          handled = true;
          break;
        case 'Tab':
          this.throttled.moveRight();
          handled = true;
          break;
        case 'ArrowLeft':
          if (!this.rtl && getCursorPosition() === 0) {
            this.throttled.moveLeft();
            handled = true;
          } else if (
            this.rtl &&
            getCursorPosition() ===
              htmlElement.textElement.getInnerText().length
          ) {
            this.throttled.moveRight();
            handled = true;
          }
          break;
        case 'ArrowRight':
          if (
            !this.rtl &&
            getCursorPosition() ===
              htmlElement.textElement.getInnerText().length
          ) {
            this.throttled.moveRight();
            handled = true;
          } else if (this.rtl && getCursorPosition() === 0) {
            this.throttled.moveLeft();
            handled = true;
          }
          break;
      }

      if (handled) {
        event.preventDefault();
      }
    },

    onKeydownTextBox(event: KeyboardEvent) {
      let handled = false;

      const index = this.elements.indexOf(this.selectedElement!);
      const htmlElement = (
        this.$refs[`element-${index}`] as InstanceType<typeof TextBox>[]
      )[0];

      switch (event.code) {
        case 'Tab':
          this.throttled.moveRight();
          handled = true;
          break;
        case 'ArrowLeft':
          if (!this.rtl && getCursorPosition() === 0) {
            this.throttled.moveLeft();
            handled = true;
          } else if (
            this.rtl &&
            getCursorPosition() ===
              htmlElement.getTextElement().getInnerText().length
          ) {
            this.throttled.moveRight();
            handled = true;
          }
          break;
        case 'ArrowRight':
          if (
            !this.rtl &&
            getCursorPosition() ===
              htmlElement.getTextElement().getInnerText().length
          ) {
            this.throttled.moveRight();
            handled = true;
          } else if (this.rtl && getCursorPosition() === 0) {
            this.throttled.moveLeft();
            handled = true;
          }
          break;
      }

      if (handled) {
        event.preventDefault();
      }
    },

    /**
     * Handles text editing functionality for macOS
     */
    onKeydownMac(event: KeyboardEvent) {
      let handled = false;

      if (!event.metaKey) {
        return;
      }

      switch (event.code) {
        case 'KeyA':
          document.execCommand('selectAll');
          handled = true;
          break;
        case 'KeyC':
          document.execCommand('copy');
          handled = true;
          break;
        case 'KeyV':
          this.ipcService.paste();
          handled = true;
          break;
        case 'KeyX':
          document.execCommand('cut');
          handled = true;
          break;
        case 'KeyZ':
          if (event.shiftKey) {
            document.execCommand('redo');
          } else {
            document.execCommand('undo');
          }
          handled = true;
          break;
      }

      if (handled) {
        event.preventDefault();
      }
    },

    onKeyup(event: KeyboardEvent) {
      let handled = false;

      if (this.keyboardModifier === event.code) {
        this.keyboardModifier = null;
        handled = true;
      }

      if (handled) {
        event.preventDefault();
      }
    },

    onCutScoreElements() {
      if (this.selectionRange != null) {
        const start = Math.min(
          this.selectionRange.start,
          this.selectionRange.end,
        );

        const elementsToCut = this.elements.filter(
          (x) => x.elementType != ElementType.Empty && this.isSelected(x),
        );

        this.clipboard = elementsToCut.map((x) => x.clone());

        this.commandService.executeAsBatch(
          elementsToCut.map((element) =>
            scoreElementCommandFactory.create('remove-from-collection', {
              element,
              collection: this.elements,
            }),
          ),
        );

        this.refreshStaffLyrics();

        this.selectedElement =
          this.elements[Math.min(start, this.elements.length - 1)];

        this.save();
      } else if (
        this.selectedElement != null &&
        this.selectedElement.elementType !== ElementType.Empty
      ) {
        const currentIndex = this.selectedElementIndex;

        this.clipboard = [this.selectedElement.clone()];

        this.removeScoreElement(this.selectedElement);

        this.selectedElement =
          this.elements[Math.min(currentIndex, this.elements.length - 1)];

        this.save();
      }
    },

    onCopyScoreElements() {
      if (this.selectionRange != null) {
        this.clipboard = this.elements
          .filter(
            (x) => x.elementType != ElementType.Empty && this.isSelected(x),
          )
          .map((x) => x.clone());
      } else if (
        this.selectedElement != null &&
        this.selectedElement.elementType !== ElementType.Empty
      ) {
        this.clipboard = [this.selectedElement.clone()];
      }
    },

    onPasteScoreElements(includeLyrics: boolean) {
      if (this.clipboard.length > 0 && this.selectedElement != null) {
        switch (this.entryMode) {
          case EntryMode.Insert:
            this.onPasteScoreElementsInsert(includeLyrics);
            break;
          case EntryMode.Auto:
            this.onPasteScoreElementsAuto(includeLyrics);
            break;
          case EntryMode.Edit:
            this.onPasteScoreElementsEdit(includeLyrics);
            break;
        }
      }
    },

    onPasteScoreElementsInsert(includeLyrics: boolean) {
      if (this.selectedElement == null || this.clipboard.length === 0) {
        return;
      }

      const insertAtIndex = this.isLastElement(this.selectedElement)
        ? this.selectedElementIndex
        : this.selectedElementIndex + 1;

      const newElements = this.clipboard.map((x) => x.clone({ includeLyrics }));

      this.addScoreElements(newElements, insertAtIndex);

      this.selectedElement = newElements.at(-1)!;
      this.save();
    },

    onPasteScoreElementsEdit(includeLyrics: boolean) {
      if (this.selectedElement == null || this.clipboard.length === 0) {
        return;
      }

      const commands: Command[] = [];

      let currentIndex = this.selectedElementIndex;

      for (const clipboardElement of this.clipboard) {
        const currentElement = this.elements[currentIndex];

        if (currentIndex >= this.elements.length - 1) {
          commands.push(
            scoreElementCommandFactory.create('add-to-collection', {
              elements: [clipboardElement.clone({ includeLyrics })],
              collection: this.elements,
              insertAtIndex: currentIndex,
            }),
          );
        } else {
          if (currentElement.elementType === clipboardElement.elementType) {
            switch (currentElement.elementType) {
              case ElementType.Note:
                if (
                  !shallowEquals(
                    (currentElement as NoteElement).getClipboardProperties(
                      includeLyrics,
                    ),
                    (clipboardElement as NoteElement).getClipboardProperties(
                      includeLyrics,
                    ),
                  )
                ) {
                  commands.push(
                    noteElementCommandFactory.create('update-properties', {
                      target: currentElement as NoteElement,
                      newValues: (
                        clipboardElement as NoteElement
                      ).getClipboardProperties(includeLyrics),
                    }),
                  );
                }
                break;
              case ElementType.Tempo:
                if (
                  !shallowEquals(
                    (currentElement as TempoElement).getClipboardProperties(),
                    (clipboardElement as TempoElement).getClipboardProperties(),
                  )
                ) {
                  commands.push(
                    tempoCommandFactory.create('update-properties', {
                      target: currentElement as TempoElement,
                      newValues: (
                        clipboardElement as TempoElement
                      ).getClipboardProperties(),
                    }),
                  );
                }
                break;
              case ElementType.Martyria:
                if (
                  !shallowEquals(
                    (
                      currentElement as MartyriaElement
                    ).getClipboardProperties(),
                    (
                      clipboardElement as MartyriaElement
                    ).getClipboardProperties(),
                  )
                ) {
                  commands.push(
                    martyriaCommandFactory.create('update-properties', {
                      target: currentElement as MartyriaElement,
                      newValues: (
                        clipboardElement as MartyriaElement
                      ).getClipboardProperties(),
                    }),
                  );
                }
                break;
              case ElementType.DropCap:
                if (
                  !shallowEquals(
                    (currentElement as DropCapElement).getClipboardProperties(),
                    (
                      clipboardElement as DropCapElement
                    ).getClipboardProperties(),
                  )
                ) {
                  commands.push(
                    dropCapCommandFactory.create('update-properties', {
                      target: currentElement as DropCapElement,
                      newValues: (
                        clipboardElement as DropCapElement
                      ).getClipboardProperties(),
                    }),
                  );
                }
                break;
              case ElementType.ModeKey:
                if (
                  !shallowEquals(
                    (currentElement as ModeKeyElement).getClipboardProperties(),
                    (
                      clipboardElement as ModeKeyElement
                    ).getClipboardProperties(),
                  )
                ) {
                  commands.push(
                    modeKeyCommandFactory.create('update-properties', {
                      target: currentElement as ModeKeyElement,
                      newValues: (
                        clipboardElement as ModeKeyElement
                      ).getClipboardProperties(),
                    }),
                  );
                }
                break;
              case ElementType.TextBox:
                if (
                  !shallowEquals(
                    (currentElement as TextBoxElement).getClipboardProperties(),
                    (
                      clipboardElement as TextBoxElement
                    ).getClipboardProperties(),
                  )
                ) {
                  commands.push(
                    textBoxCommandFactory.create('update-properties', {
                      target: currentElement as TextBoxElement,
                      newValues: (
                        clipboardElement as TextBoxElement
                      ).getClipboardProperties(),
                    }),
                  );
                }
                break;
            }
          } else {
            commands.push(
              scoreElementCommandFactory.create(
                'replace-element-in-collection',
                {
                  element: clipboardElement.clone(),
                  collection: this.elements,
                  replaceAtIndex: currentIndex,
                },
              ),
            );
          }
        }

        currentIndex++;
      }

      if (commands.length > 1) {
        this.commandService.executeAsBatch(commands);
        this.refreshStaffLyrics();
      } else if (commands.length === 1) {
        this.commandService.execute(commands[0]);
        this.refreshStaffLyrics();
      }

      this.save();
    },

    onPasteScoreElementsAuto(includeLyrics: boolean) {
      this.moveRight();
      const currentIndex = this.selectedElementIndex;

      this.onPasteScoreElementsEdit(includeLyrics);

      // Set the selected element to the last element that was pasted
      this.selectedElement =
        this.elements[currentIndex + this.clipboard.length - 1];
    },

    getLyricLength(element: NoteElement) {
      return (
        this.$refs[`lyrics-${this.elements.indexOf(element)}`] as InstanceType<
          typeof ContentEditable
        >[]
      )[0].getInnerText().length;
    },

    moveLeft() {
      let index = -1;

      if (this.selectedElement) {
        index = this.elements.indexOf(this.selectedElement);
      } else if (this.selectionRange) {
        index = this.selectionRange.end;
      }

      if (
        index - 1 >= 0 &&
        navigableElements.includes(this.elements[index - 1].elementType)
      ) {
        // If the currently selected element is a drop cap or text box, blur it first
        if (this.selectedElement?.elementType === ElementType.DropCap) {
          (
            this.$refs[`element-${index}`] as InstanceType<typeof DropCap>[]
          )[0].blur();
        } else if (this.selectedElement?.elementType === ElementType.TextBox) {
          (
            this.$refs[`element-${index}`] as InstanceType<typeof TextBox>[]
          )[0].blur();
        }

        this.selectedElement = this.elements[index - 1];

        // If the newly selected element is a drop cap or text box, focus it
        if (this.selectedElement.elementType === ElementType.DropCap) {
          (
            this.$refs[`element-${index - 1}`] as InstanceType<typeof DropCap>[]
          )[0].focus();
        } else if (this.selectedElement.elementType === ElementType.TextBox) {
          (
            this.$refs[`element-${index - 1}`] as InstanceType<typeof TextBox>[]
          )[0].focus();
        }

        return true;
      }

      return false;
    },

    moveRight() {
      let index = -1;

      if (this.selectedElement) {
        index = this.elements.indexOf(this.selectedElement);
      } else if (this.selectionRange) {
        index = this.selectionRange.end;
      }

      if (
        index >= 0 &&
        index + 1 < this.elements.length &&
        navigableElements.includes(this.elements[index + 1].elementType)
      ) {
        // If the currently selected element is a drop cap, blur it first
        if (this.selectedElement?.elementType === ElementType.DropCap) {
          (
            this.$refs[`element-${index}`] as InstanceType<typeof DropCap>[]
          )[0].blur();
        } else if (this.selectedElement?.elementType === ElementType.TextBox) {
          (
            this.$refs[`element-${index}`] as InstanceType<typeof TextBox>[]
          )[0].blur();
        }

        this.selectedElement = this.elements[index + 1];

        // If the newly selected element is a drop cap, focus it
        if (this.selectedElement.elementType === ElementType.DropCap) {
          (
            this.$refs[`element-${index + 1}`] as InstanceType<typeof DropCap>[]
          )[0].focus();
        } else if (this.selectedElement.elementType === ElementType.TextBox) {
          (
            this.$refs[`element-${index + 1}`] as InstanceType<typeof TextBox>[]
          )[0].focus();
        }

        return true;
      }

      return false;
    },

    moveSelectionLeft() {
      if (this.selectionRange != null) {
        if (
          this.selectionRange.end > 0 &&
          navigableElements.includes(
            this.elements[this.selectionRange.end - 1].elementType,
          )
        ) {
          this.setSelectionRange(this.elements[this.selectionRange.end - 1]);
        }
      } else if (
        this.selectedElement != null &&
        this.selectedElementIndex > 0 &&
        navigableElements.includes(
          this.elements[this.selectedElementIndex - 1].elementType,
        )
      ) {
        this.setSelectionRange(this.elements[this.selectedElementIndex - 1]);
      }
    },

    moveSelectionRight() {
      if (this.selectionRange != null) {
        if (
          this.selectionRange.end + 1 < this.elements.length - 1 &&
          navigableElements.includes(
            this.elements[this.selectionRange.end + 1].elementType,
          )
        ) {
          this.setSelectionRange(this.elements[this.selectionRange.end + 1]);
        }
      } else if (
        this.selectedElement != null &&
        this.selectedElementIndex + 1 < this.elements.length - 1 &&
        navigableElements.includes(
          this.elements[this.selectedElementIndex + 1].elementType,
        )
      ) {
        this.setSelectionRange(this.elements[this.selectedElementIndex + 1]);
      }
    },

    getNextLyricBoxIndex() {
      if (this.selectedLyrics) {
        const currentIndex = this.elements.indexOf(this.selectedLyrics);

        // Find the index of the next note
        for (let i = currentIndex + 1; i < this.elements.length; i++) {
          if (this.elements[i].elementType === ElementType.Note) {
            return i;
          }
        }
      }

      return -1;
    },

    moveToNextLyricBox(clearMelisma: boolean = false) {
      const nextIndex = this.getNextLyricBoxIndex();

      if (nextIndex >= 0) {
        // If the lyrics for the last neume on the line have been updated to be so long
        // that the neume is moved to the next line by processPages(), then focusLyrics()
        // will fail if called on its own. This is because the order of events would
        // be the following:
        // focus next element => blur previous element => updateLyrics => processPages
        // and finally the newly selected element would lose focus because processPages
        // moves the element to the next line.

        // To prevent this we, preemptively call updateLyrics and then use nextTick
        // to only focus the next lyrics after the UI has been redrawn.

        const noteElement = this.selectedLyrics!;

        const text = (
          this.$refs[
            `lyrics-${this.elements.indexOf(noteElement)}`
          ] as InstanceType<typeof ContentEditable>[]
        )[0].getInnerText();

        this.updateLyrics(noteElement, text, clearMelisma);

        nextTick(() => {
          this.focusLyrics(nextIndex, true);
        });

        return true;
      }

      return false;
    },

    moveToPreviousLyricBox() {
      if (this.selectedLyrics) {
        const currentIndex = this.elements.indexOf(this.selectedLyrics);
        let nextIndex = -1;

        // Find the index of the previous note
        for (let i = currentIndex - 1; i >= 0; i--) {
          if (this.elements[i].elementType === ElementType.Note) {
            nextIndex = i;
            break;
          }
        }

        if (nextIndex >= 0) {
          this.focusLyrics(nextIndex, true);
          return true;
        }
      }

      return false;
    },

    calculatePageNumber() {
      let maxPercentage = 0;
      let maxPercentageIndex = -1;

      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;

      for (let pageIndex = 0; pageIndex < this.pageCount; pageIndex++) {
        const rect = (this.$refs.pages as Element[])[
          pageIndex
        ].getBoundingClientRect();

        const percentage =
          Math.max(
            0,
            rect.top > 0
              ? Math.min(rect.height, viewportHeight - rect.top)
              : rect.bottom < viewportHeight
                ? rect.bottom
                : viewportHeight,
          ) / rect.height;

        if (percentage > maxPercentage) {
          maxPercentage = percentage;
          maxPercentageIndex = pageIndex;
        }
      }

      if (maxPercentageIndex >= 0) {
        this.currentPageNumber = maxPercentageIndex + 1;
      }
    },

    save(markUnsavedChanges: boolean = true) {
      if (markUnsavedChanges) {
        this.hasUnsavedChanges = true;
      }

      // Save the indexes of the visible pages
      const visiblePages = this.pages
        .map((_, i) => i)
        .filter((i) => this.pages[i].isVisible);

      const pages = LayoutService.processPages(toRaw(this.selectedWorkspace));

      // Set page visibility for the newly processed pages
      pages.forEach((x, index) => (x.isVisible = visiblePages.includes(index)));

      // Only re-render elements that are visible and that have been updated by processPages
      pages
        .filter((x) => x.isVisible)
        .forEach((page) => {
          page.lines.forEach((line) =>
            line.elements
              .filter((x) => x.updated)
              .forEach((element) => {
                element.keyHelper++;
              }),
          );
        });

      // Re-render headers and footers if they changed
      this.score.headersAndFooters
        .filter((x) => x.updated)
        .forEach((element) => {
          element.keyHelper++;
        });

      this.pages = pages;

      // If using the browser, save the workspace to local storage
      if (this.isBrowser) {
        const workspaceLocalStorage = {
          id: this.selectedWorkspace.id,
          score: JSON.stringify(SaveService.SaveScoreToJson(this.score)),
          filePath: this.currentFilePath,
          tempFileName: this.selectedWorkspace.tempFileName,
          hasUnsavedChanges: this.hasUnsavedChanges,
        } as WorkspaceLocalStorage;

        localStorage.setItem(
          `workspace-${this.selectedWorkspace.id}`,
          JSON.stringify(workspaceLocalStorage),
        );
      } else if (this.isDevelopment) {
        localStorage.setItem(
          'score',
          JSON.stringify(SaveService.SaveScoreToJson(this.score)),
        );

        if (this.currentFilePath != null) {
          localStorage.setItem('filePath', this.currentFilePath);
        } else {
          localStorage.removeItem('filePath');
        }

        localStorage.setItem(
          'hasUnsavedChanges',
          this.hasUnsavedChanges.toString(),
        );
      }
    },

    async load() {
      if (this.isBrowser) {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('workspace-')) {
            try {
              const localStorageWorkspace: WorkspaceLocalStorage = JSON.parse(
                localStorage.getItem(key)!,
              );
              const workspace = new Workspace();
              workspace.id = localStorageWorkspace.id;
              workspace.hasUnsavedChanges =
                localStorageWorkspace.hasUnsavedChanges;
              workspace.filePath = localStorageWorkspace.filePath;
              workspace.tempFileName = localStorageWorkspace.tempFileName;
              workspace.score = SaveService.LoadScoreFromJson(
                JSON.parse(localStorageWorkspace.score),
              );

              this.addWorkspace(workspace);
            } catch (error) {
              // We couldn't load this workspace for some reason. Remove it from storage.
              localStorage.removeItem(key);
              console.error(error);
            }
          }
        });

        if (this.workspaces.length > 0) {
          this.selectedWorkspace = this.workspaces[0] as Workspace;
          return;
        }
      }

      // First, try to load files passed in on the command line.
      // If there are none, then create a default workspace.
      const openWorkspaceResults =
        await this.ipcService.openWorkspaceFromArgv();

      if (openWorkspaceResults.silentPdf) {
        for (const file of openWorkspaceResults.files.filter(
          (x) => x.success,
        )) {
          this.openScore(file);
          await this.onFileMenuExportAsPdf();
          this.removeWorkspace(this.selectedWorkspace);
        }
      }

      if (openWorkspaceResults.silentHtml) {
        for (const file of openWorkspaceResults.files.filter(
          (x) => x.success,
        )) {
          this.openScore(file);
          await this.onFileMenuExportAsHtml();
          this.removeWorkspace(this.selectedWorkspace);
        }
      }

      if (openWorkspaceResults.silentLatex) {
        for (const file of openWorkspaceResults.files.filter(
          (x) => x.success,
        )) {
          const options = new LatexExporterOptions();
          options.includeModeKeys =
            openWorkspaceResults.silentLatexIncludeModeKeys ?? false;
          options.includeTextBoxes =
            openWorkspaceResults.silentLatexIncludeTextBoxes ?? false;
          this.openScore(file);
          await this.ipcService.exportWorkspaceAsLatex(
            this.selectedWorkspace,
            JSON.stringify(
              this.latexExporter.export(
                this.pages,
                this.score.pageSetup,
                options,
              ),
              null,
              2,
            ),
          );
          this.removeWorkspace(this.selectedWorkspace);
        }
      }

      if (
        openWorkspaceResults.silentPdf ||
        openWorkspaceResults.silentLatex ||
        openWorkspaceResults.silentHtml
      ) {
        await this.ipcService.exitApplication();
      }

      openWorkspaceResults.files
        .filter((x) => x.success)
        .forEach((x) => this.openScore(x));

      if (openWorkspaceResults.files.some((x) => x.success)) {
        return;
      }

      const workspace = new Workspace();
      workspace.tempFileName = this.getTempFilename();
      workspace.score = this.createDefaultScore();

      this.addWorkspace(workspace);

      if (this.isDevelopment) {
        const scoreString = localStorage.getItem('score');

        if (scoreString) {
          const score: Score = SaveService.LoadScoreFromJson(
            JSON.parse(scoreString),
          );
          this.currentFilePath = localStorage.getItem('filePath');
          this.hasUnsavedChanges =
            localStorage.getItem('hasUnsavedChanges') === 'true';

          workspace.score = score;
        }
      }

      this.selectedWorkspace = workspace;

      this.selectedElement =
        this.score.staff.elements[this.score.staff.elements.length - 1];

      this.pages = LayoutService.processPages(this.selectedWorkspace);
    },

    async saveWorkspace(workspace: Workspace) {
      if (!this.lyricsLocked) {
        this.lyrics = this.lyricService.extractLyrics(
          this.elements,
          this.score.pageSetup.disableGreekMelismata,
        );
      }

      return await this.ipcService.saveWorkspace(workspace);
    },

    async saveWorkspaceAs(workspace: Workspace) {
      if (!this.lyricsLocked) {
        this.lyrics = this.lyricService.extractLyrics(
          this.elements,
          this.score.pageSetup.disableGreekMelismata,
        );
      }

      return await this.ipcService.saveWorkspaceAs(workspace);
    },

    async closeWorkspace(workspace: Workspace) {
      let shouldClose = true;

      if (workspace.hasUnsavedChanges) {
        const fileName =
          workspace.filePath != null
            ? getFileNameFromPath(workspace.filePath)
            : workspace.tempFileName;

        let dialogResult: ShowMessageBoxReplyArgs;

        if (this.ipcService.isShowMessageBoxSupported()) {
          dialogResult = await this.ipcService.showMessageBox({
            title: import.meta.env.VITE_TITLE,
            message: `Do you want to save the changes you made to ${fileName}?`,
            detail: "Your changes will be lost if you don't save them.",
            type: 'warning',
            buttons: ['Save', "Don't Save", 'Cancel'],
          });
        } else {
          dialogResult = {
            response: confirm(
              `${fileName} has unsaved changes. Are you sure you want to close it?`,
            )
              ? 1
              : 2,
            checkboxChecked: false,
          };
        }

        if (dialogResult.response === 0) {
          // User chose "Save"
          const saveResult =
            workspace.filePath != null
              ? await this.saveWorkspace(workspace)
              : await this.saveWorkspaceAs(workspace);

          // If they successfully saved, then we can close the workspacce
          shouldClose = saveResult.success;
        } else if (dialogResult.response === 2) {
          // User chose "Cancel", so don't close the workspace.
          shouldClose = false;
        }
      }

      if (shouldClose) {
        // If using the browser, remove the item from local storage
        if (this.isBrowser) {
          localStorage.removeItem(`workspace-${workspace.id}`);
        }

        // If the last tab has closed, then exit
        if (this.workspaces.length == 1) {
          await this.ipcService.exitApplication();
        }

        this.removeWorkspace(workspace);
      }

      return shouldClose;
    },

    async onCloseWorkspaces(args: CloseWorkspacesArgs) {
      const workspacesToClose: Workspace[] = this.workspaces.filter(
        (workspace) => {
          const index: number = this.tabs.findIndex(
            (x) => x.key === workspace.id,
          );

          const pivot: number = args.workspaceId
            ? this.tabs.findIndex((x) => x.key === args.workspaceId)
            : this.tabs.findIndex((x) => x.key === this.selectedWorkspace.id);

          switch (args.disposition) {
            case CloseWorkspacesDisposition.SELF:
              return index === pivot;
            case CloseWorkspacesDisposition.OTHERS:
              return index !== pivot;
            case CloseWorkspacesDisposition.LEFT:
              return index < pivot;
            case CloseWorkspacesDisposition.RIGHT:
              return index > pivot;
            default:
              throw new Error(
                `Error: Unknown disposition ${args.disposition}.`,
              );
          }
        },
      ) as Workspace[];

      for (const workspaceToClose of workspacesToClose) {
        if (!(await this.closeWorkspace(workspaceToClose))) {
          // The user vetoed the operation.
          break;
        }
      }
    },

    async onCloseApplication() {
      // Give the user a chance to save their changes before exiting
      const unsavedWorkspaces = this.workspaces.filter(
        (x) => x.hasUnsavedChanges,
      ) as Workspace[];

      for (const workspace of unsavedWorkspaces) {
        if (!(await this.closeWorkspace(workspace))) {
          await this.ipcService.cancelExit();
          return false;
        }
      }

      await this.ipcService.exitApplication();
    },

    setKlasma(element: NoteElement) {
      if (onlyTakesBottomKlasma(element.quantitativeNeume)) {
        if (element.timeNeume === TimeNeume.Klasma_Bottom) {
          this.updateNoteAndSave(element, { timeNeume: null });
        } else {
          this.updateNoteAndSave(element, {
            timeNeume: TimeNeume.Klasma_Bottom,
          });
        }
        return;
      } else if (onlyTakesTopKlasma(element.quantitativeNeume)) {
        if (element.timeNeume === TimeNeume.Klasma_Top) {
          this.updateNoteAndSave(element, { timeNeume: null });
        } else {
          this.updateNoteAndSave(element, {
            timeNeume: TimeNeume.Klasma_Top,
          });
        }
        return;
      } else if (element.timeNeume == null) {
        this.updateNoteAndSave(element, {
          timeNeume: TimeNeume.Klasma_Top,
        });
      } else if (element.timeNeume === TimeNeume.Klasma_Top) {
        this.updateNoteAndSave(element, {
          timeNeume: TimeNeume.Klasma_Bottom,
        });
      } else if (element.timeNeume === TimeNeume.Klasma_Bottom) {
        this.updateNoteAndSave(element, { timeNeume: null });
      }
    },

    setGorgon(element: NoteElement, neumes: GorgonNeume | GorgonNeume[]) {
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
          this.updateNoteAndSave(element, { gorgonNeume: neume });
          return;
        }

        equivalent = element.gorgonNeume === neume;
      }

      // We've cycled through all the neumes.
      // If we got to the end of the cycle, remove all
      // gorgon neumes. Otherwise set gorgon to the first neume
      // in the cycle.
      if (equivalent) {
        this.updateNoteAndSave(element, { gorgonNeume: null });
      } else {
        this.updateNoteAndSave(element, { gorgonNeume: neumes[0] });
      }
    },

    setSecondaryGorgon(element: NoteElement, neume: GorgonNeume) {
      if (element.secondaryGorgonNeume === neume) {
        this.updateNoteAndSave(element, { secondaryGorgonNeume: null });
      } else {
        this.updateNoteAndSave(element, { secondaryGorgonNeume: neume });
      }
    },

    setFthoraNote(element: NoteElement, neumes: Fthora[]) {
      let equivalent = false;

      for (const neume of neumes) {
        // If previous neume was matched, set to the next neume in the cycle
        if (equivalent) {
          this.updateNoteFthora(element, neume);
          return;
        }

        equivalent = element.fthora === neume;
      }

      // We've cycled through all the neumes.
      // If we got to the end of the cycle, remove all
      // fthora neumes. Otherwise set fthora to the first neume
      // in the cycle.
      if (equivalent) {
        this.updateNoteFthora(element, null);
      } else {
        this.updateNoteFthora(element, neumes[0]);
      }
    },

    setSecondaryFthora(element: NoteElement, neume: Fthora) {
      if (element.secondaryFthora === neume) {
        this.updateNoteFthoraSecondary(element, null);
      } else {
        this.updateNoteFthoraSecondary(element, neume);
      }
    },

    setTertiaryFthora(element: NoteElement, neume: Fthora) {
      if (element.tertiaryFthora === neume) {
        this.updateNoteFthoraTertiary(element, null);
      } else {
        this.updateNoteFthoraTertiary(element, neume);
      }
    },

    setFthoraMartyria(element: MartyriaElement, neume: Fthora) {
      if (element.fthora === neume) {
        this.updateMartyriaFthora(element, null);
      } else {
        this.updateMartyriaFthora(element, neume);
      }
    },

    setMartyriaTempoLeft(element: MartyriaElement, neume: TempoSign) {
      if (element.tempoLeft === neume) {
        this.updateMartyriaTempoLeft(element, null);
      } else {
        this.updateMartyriaTempoLeft(element, neume);
      }
    },

    setMartyriaTempo(element: MartyriaElement, neume: TempoSign) {
      if (element.tempo === neume) {
        this.updateMartyriaTempo(element, null);
      } else {
        this.updateMartyriaTempo(element, neume);
      }
    },

    setMartyriaTempoRight(element: MartyriaElement, neume: TempoSign) {
      if (element.tempoRight === neume) {
        this.updateMartyriaTempoRight(element, null);
      } else {
        this.updateMartyriaTempoRight(element, neume);
      }
    },

    setMartyriaQuantitativeNeume(
      element: MartyriaElement,
      neume: QuantitativeNeume,
    ) {
      if (element.quantitativeNeume === neume) {
        this.updateMartyria(element, { quantitativeNeume: null });
      } else {
        this.updateMartyria(element, { quantitativeNeume: neume });
      }
    },

    setModeKeyTempo(element: ModeKeyElement, neume: TempoSign) {
      if (element.tempo === neume) {
        this.updateModeKeyTempo(element, null);
      } else {
        this.updateModeKeyTempo(element, neume);
      }
    },

    setAccidental(element: NoteElement, neume: Accidental) {
      if (element.accidental != null && element.accidental === neume) {
        this.updateNoteAndSave(element, { accidental: null });
      } else {
        this.updateNoteAndSave(element, { accidental: neume });
      }
    },

    setSecondaryAccidental(element: NoteElement, neume: Accidental) {
      if (
        element.secondaryAccidental != null &&
        element.secondaryAccidental === neume
      ) {
        this.updateNoteAndSave(element, { secondaryAccidental: null });
      } else {
        this.updateNoteAndSave(element, { secondaryAccidental: neume });
      }
    },

    setTertiaryAccidental(element: NoteElement, neume: Accidental) {
      if (
        element.tertiaryAccidental != null &&
        element.tertiaryAccidental === neume
      ) {
        this.updateNoteAndSave(element, { tertiaryAccidental: null });
      } else {
        this.updateNoteAndSave(element, { tertiaryAccidental: neume });
      }
    },

    setTimeNeume(element: NoteElement, neume: TimeNeume) {
      if (element.timeNeume === neume) {
        this.updateNoteAndSave(element, { timeNeume: null });
      } else {
        this.updateNoteAndSave(element, { timeNeume: neume });
      }
    },

    setMeasureNumber(element: NoteElement, neume: MeasureNumber) {
      if (neume === element.measureNumber) {
        this.updateNoteAndSave(element, { measureNumber: null });
      } else {
        this.updateNoteAndSave(element, { measureNumber: neume });
      }
    },

    setMeasureBarNote(element: NoteElement, neume: MeasureBar) {
      // Cycle through
      // Left
      // Right
      // Both Sides
      // None
      const normalizedMeasureBar = element.measureBarLeft?.endsWith('Above')
        ? measureBarAboveToLeft.get(element.measureBarLeft)
        : element.measureBarLeft;
      if (neume === normalizedMeasureBar && neume === element.measureBarRight) {
        this.updateNoteAndSave(element, {
          measureBarLeft: null,
          measureBarRight: null,
        });
      } else if (neume === normalizedMeasureBar) {
        this.updateNoteAndSave(element, {
          measureBarLeft: null,
          measureBarRight: neume,
        });
      } else if (neume === element.measureBarRight) {
        this.updateNoteAndSave(element, {
          measureBarLeft: neume,
          measureBarRight: neume,
        });
      } else {
        this.updateNoteAndSave(element, {
          measureBarLeft: neume,
          measureBarRight: null,
        });
      }
    },

    setMeasureBarMartyria(element: MartyriaElement, neume: MeasureBar) {
      // Cycle through
      // Left
      // Right
      // Both Sides
      // None
      const normalizedMeasureBar = element.measureBarLeft?.endsWith('Above')
        ? measureBarAboveToLeft.get(element.measureBarLeft)
        : element.measureBarLeft;
      if (neume === normalizedMeasureBar && neume === element.measureBarRight) {
        this.updateMartyria(element, {
          measureBarLeft: null,
          measureBarRight: null,
        });
      } else if (neume === normalizedMeasureBar) {
        this.updateMartyria(element, {
          measureBarLeft: null,
          measureBarRight: neume,
        });
      } else if (neume === element.measureBarRight) {
        this.updateMartyria(element, {
          measureBarLeft: neume,
          measureBarRight: neume,
        });
      } else {
        this.updateMartyria(element, {
          measureBarLeft: neume,
          measureBarRight: null,
        });
      }
    },

    setIson(element: NoteElement, neume: Ison) {
      if (neume === element.ison) {
        this.updateNoteAndSave(element, { ison: null });
      } else {
        this.updateNoteAndSave(element, { ison: neume });
      }
    },

    setVocalExpression(element: NoteElement, neume: VocalExpressionNeume) {
      if (
        element.vocalExpressionNeume != null &&
        areVocalExpressionsEquivalent(neume, element.vocalExpressionNeume)
      ) {
        this.updateNoteExpression(element, null);
      } else {
        this.updateNoteExpression(element, neume);
      }
    },

    setTie(element: NoteElement, neumes: Tie[]) {
      let equivalent = false;

      for (const neume of neumes) {
        // If previous neume was matched, set to the next neume in the cycle
        if (equivalent) {
          this.updateNoteAndSave(element, { tie: neume });
          return;
        }

        equivalent = element.tie === neume;
      }

      // We've cycled through all the neumes.
      // If we got to the end of the cycle, remove all
      // fthora neumes. Otherwise set fthora to the first neume
      // in the cycle.
      if (equivalent) {
        this.updateNoteAndSave(element, { tie: null });
      } else {
        this.updateNoteAndSave(element, { tie: neumes[0] });
      }
    },

    addScoreElement(
      element: ScoreElement,
      insertAtIndex?: number,
      collection?: ScoreElement[],
    ) {
      this.commandService.execute(
        scoreElementCommandFactory.create('add-to-collection', {
          elements: [element],
          collection: collection ?? this.elements,
          insertAtIndex,
        }),
      );

      this.refreshStaffLyrics();
    },

    addScoreElements(elements: ScoreElement[], insertAtIndex?: number) {
      this.commandService.execute(
        scoreElementCommandFactory.create('add-to-collection', {
          elements,
          collection: this.elements,
          insertAtIndex,
        }),
      );

      this.refreshStaffLyrics();
    },

    replaceScoreElement(element: ScoreElement, replaceAtIndex: number) {
      this.commandService.execute(
        scoreElementCommandFactory.create('replace-element-in-collection', {
          element,
          collection: this.elements,
          replaceAtIndex,
        }),
      );

      this.refreshStaffLyrics();
    },

    removeScoreElement(element: ScoreElement, collection?: ScoreElement[]) {
      this.commandService.execute(
        scoreElementCommandFactory.create('remove-from-collection', {
          element,
          collection: collection ?? this.elements,
        }),
      );

      this.refreshStaffLyrics();
    },

    updatePageVisibility(page: Page, isVisible: boolean) {
      page.isVisible = isVisible;
    },

    updateNoteAndSave(element: NoteElement, newValues: Partial<NoteElement>) {
      this.updateNote(element, newValues);
      this.save();
    },

    updateNote(element: NoteElement, newValues: Partial<NoteElement>) {
      this.commandService.execute(
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
        this.refreshStaffLyrics();
      }
    },

    updateNoteFthora(element: NoteElement, fthora: Fthora | null) {
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

      this.updateNote(element, { fthora, chromaticFthoraNote });
      this.save();
    },

    updateNoteFthoraSecondary(
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

      this.updateNote(element, {
        secondaryFthora,
        secondaryChromaticFthoraNote,
      });
      this.save();
    },

    updateNoteFthoraTertiary(
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

      this.updateNote(element, { tertiaryFthora, tertiaryChromaticFthoraNote });
      this.save();
    },

    updateNoteExpression(
      element: NoteElement,
      vocalExpressionNeume: VocalExpressionNeume | null,
    ) {
      // Replace the psifiston with a slanted psifiston if the previous neume
      // contains a long heteron
      if (vocalExpressionNeume === VocalExpressionNeume.Psifiston) {
        const index = this.getElementIndex(element);

        if (index > 0) {
          const previousElement = this.elements[index - 1];

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

      this.updateNote(element, { vocalExpressionNeume });
      this.save();
    },

    updateLyricsLocked(locked: boolean) {
      this.lyricsLocked = locked;
      this.hasUnsavedChanges = true;
    },

    updateStaffLyrics(lyrics: string) {
      this.lyrics = lyrics;
      this.throttled.assignLyrics();
      this.hasUnsavedChanges = true;
    },

    assignLyrics() {
      const updateCommands: Command[] = [];

      this.lyricService.assignLyrics(
        this.lyrics,
        this.elements,
        this.rtl,
        this.score.pageSetup.disableGreekMelismata,
        (note, lyrics) => this.setLyrics(this.getElementIndex(note), lyrics),
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
        this.commandService.executeAsBatch(updateCommands, this.lyricsLocked);
        this.save();
      }
    },

    assignAcceptsLyricsFromCurrentLyrics() {
      const commands: Command[] = [];

      this.lyricService.assignAcceptsLyricsFromCurrentLyrics(
        this.elements,
        this.score.pageSetup.disableGreekMelismata,
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
        this.commandService.executeAsBatch(commands);
        this.refreshStaffLyrics();
        this.save();
      }
    },

    updateLyrics(
      element: NoteElement,
      lyrics: string,
      clearMelisma: boolean = false,
    ) {
      const newValues = this.lyricService.getLyricUpdateValues(
        element,
        lyrics,
        this.elements,
        this.rtl,
        (note, lyrics) => this.setLyrics(this.getElementIndex(note), lyrics),
        clearMelisma,
      );

      if (newValues != null) {
        this.commandService.execute(
          noteElementCommandFactory.create('update-properties', {
            target: element,
            newValues,
          }),
        );
        this.refreshStaffLyrics();
        this.save();
      }
    },

    refreshStaffLyrics() {
      if (this.lyricsLocked) {
        this.assignLyrics();
      } else if (this.lyricManagerIsOpen) {
        this.lyrics = this.lyricService.extractLyrics(
          this.elements,
          this.score.pageSetup.disableGreekMelismata,
        );
      }
    },

    updateAnnotation(
      element: AnnotationElement,
      newValues: Partial<AnnotationElement>,
    ) {
      this.commandService.execute(
        annotationCommandFactory.create('update-properties', {
          target: element,
          newValues: newValues,
        }),
      );

      this.save();
    },

    removeAnnotation(
      note: NoteElement,
      annotation: AnnotationElement,
      noHistory: boolean = false,
    ) {
      this.commandService.execute(
        annotationCommandFactory.create('remove-from-collection', {
          element: annotation,
          collection: note.annotations,
        }),
        noHistory,
      );

      this.selectedWorkspace.selectedAnnotationElement = null;

      this.save();
    },

    updateAlternateLine(
      element: AlternateLineElement,
      newValues: Partial<AlternateLineElement>,
    ) {
      this.commandService.execute(
        alternateLineCommandFactory.create('update-properties', {
          target: element,
          newValues: newValues,
        }),
      );

      this.save();
    },

    removeAlternateLine(
      note: NoteElement,
      annotation: AlternateLineElement,
      noHistory: boolean = false,
    ) {
      this.commandService.execute(
        alternateLineCommandFactory.create('remove-from-collection', {
          element: annotation,
          collection: note.alternateLines,
        }),
        noHistory,
      );

      this.selectedWorkspace.selectedAlternateLineElement = null;

      this.save();
    },

    updateRichTextBox(
      element: RichTextBoxElement,
      newValues: Partial<RichTextBoxElement>,
    ) {
      if (newValues.rtl != null) {
        element.keyHelper++;
      }

      const heightProp: keyof RichTextBoxElement = 'height';

      const noHistory =
        Object.keys(newValues).length === 1 && heightProp in newValues;

      this.commandService.execute(
        richTextBoxCommandFactory.create('update-properties', {
          target: element,
          newValues: newValues,
        }),
        noHistory,
      );

      const modeChangeProp: keyof RichTextBoxElement = 'modeChange';

      if (modeChangeProp in newValues) {
        this.refreshStaffLyrics();
      }

      this.save(!noHistory);
    },

    updateRichTextBoxHeight(element: RichTextBoxElement, height: number) {
      // The height could be updated by many rich text box elements at once
      // (e.g. if PageSetup changes) so we debounce the save.
      element.height = height;
      this.richTextBoxCalculationCount++;
      this.saveDebounced(false);
    },

    updateTextBox(element: TextBoxElement, newValues: Partial<TextBoxElement>) {
      const noHistory =
        Object.keys(newValues).length === 1 && 'height' in newValues;

      this.commandService.execute(
        textBoxCommandFactory.create('update-properties', {
          target: element,
          newValues: newValues,
        }),
        noHistory,
      );

      this.save(!noHistory);
    },

    updateTextBoxHeight(element: TextBoxElement, height: number) {
      // The height could be updated by many rich text box elements at once
      // (e.g. if PageSetup changes) so we debounce the save.
      element.height = height;
      this.textBoxCalculationCount++;
      this.saveDebounced(false);
    },

    updateModeKey(element: ModeKeyElement, newValues: Partial<ModeKeyElement>) {
      this.commandService.execute(
        modeKeyCommandFactory.create('update-properties', {
          target: element,
          newValues: newValues,
        }),
      );

      this.save();
    },

    updateModeKeyTempo(element: ModeKeyElement, tempo: TempoSign | null) {
      let bpm = element.bpm;

      if (tempo != null) {
        bpm =
          this.editorPreferences.getDefaultTempo(tempo) ??
          TempoElement.getDefaultBpm(tempo);
      }

      this.updateModeKey(element, { tempo, bpm });
    },

    updateModeKeyFromTemplate(
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

      this.updateModeKey(element, newValues);

      this.save();
    },

    updateMartyria(
      element: MartyriaElement,
      newValues: Partial<MartyriaElement>,
    ) {
      this.commandService.execute(
        martyriaCommandFactory.create('update-properties', {
          target: element,
          newValues: newValues,
        }),
      );

      this.save();
    },

    updateMartyriaFthora(element: MartyriaElement, fthora: Fthora | null) {
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

      this.updateMartyria(element, { fthora, chromaticFthoraNote });
    },

    updateMartyriaTempoLeft(
      element: MartyriaElement,
      tempoLeft: TempoSign | null,
    ) {
      let bpm = element.bpm;

      if (tempoLeft != null) {
        bpm =
          this.editorPreferences.getDefaultTempo(tempoLeft) ??
          TempoElement.getDefaultBpm(tempoLeft);
      }

      this.updateMartyria(element, {
        tempoLeft,
        bpm,
        tempo: null,
        tempoRight: null,
      });
    },

    updateMartyriaTempo(element: MartyriaElement, tempo: TempoSign | null) {
      let bpm = element.bpm;

      if (tempo != null) {
        bpm =
          this.editorPreferences.getDefaultTempo(tempo) ??
          TempoElement.getDefaultBpm(tempo);
      }

      this.updateMartyria(element, {
        tempo,
        bpm,
        tempoLeft: null,
        tempoRight: null,
      });
    },

    updateMartyriaTempoRight(
      element: MartyriaElement,
      tempoRight: TempoSign | null,
    ) {
      let bpm = element.bpm;

      if (tempoRight != null) {
        bpm =
          this.editorPreferences.getDefaultTempo(tempoRight) ??
          TempoElement.getDefaultBpm(tempoRight);
      }

      this.updateMartyria(element, {
        tempoRight,
        bpm,
        tempoLeft: null,
        tempo: null,
      });
    },

    updateMartyriaBpm(element: MartyriaElement, bpm: number) {
      this.updateMartyria(element, { bpm });
      this.save();
    },

    updateMartyriaMeasureBar(
      element: MartyriaElement,
      {
        measureBarLeft,
        measureBarRight,
      }: {
        measureBarLeft: MeasureBar | null;
        measureBarRight: MeasureBar | null;
      },
    ) {
      this.updateMartyria(element, {
        measureBarLeft,
        measureBarRight,
      });
      this.save();
    },

    updateTempo(element: TempoElement, newValues: Partial<TempoElement>) {
      this.commandService.execute(
        tempoCommandFactory.create('update-properties', {
          target: element,
          newValues: newValues,
        }),
      );

      this.save();
    },

    updateDropCap(element: DropCapElement, newValues: Partial<DropCapElement>) {
      this.commandService.execute(
        dropCapCommandFactory.create('update-properties', {
          target: element,
          newValues: newValues,
        }),
      );

      this.save();
    },

    updateDropCapContent(element: DropCapElement, content: string) {
      // Replace newlines. This should only happen if the user pastes
      // text containing new lines.
      const sanitizedContent = content.replace(/(?:\r\n|\r|\n)/g, ' ');
      if (sanitizedContent !== content) {
        content = sanitizedContent;

        // Force the lyrics to re-render
        element.keyHelper++;
      }

      if (content === '') {
        const index = this.elements.indexOf(element);

        if (index > -1) {
          if (this.selectedElement === element) {
            this.selectedElement = null;
          }

          this.removeScoreElement(element);
        }
      } else if (element.content !== content) {
        this.commandService.execute(
          dropCapCommandFactory.create('update-properties', {
            target: element,
            newValues: { content },
          }),
        );

        this.refreshStaffLyrics();
      }

      this.save();
    },

    updateImageBox(
      element: ImageBoxElement,
      newValues: Partial<ImageBoxElement>,
    ) {
      this.commandService.execute(
        imageBoxCommandFactory.create('update-properties', {
          target: element,
          newValues: newValues,
        }),
      );

      this.save();
    },

    deleteSelectedElement() {
      if (
        this.selectedWorkspace.selectedAnnotationElement != null &&
        this.selectedElement?.elementType === ElementType.Note
      ) {
        this.removeAnnotation(
          this.selectedElement as NoteElement,
          this.selectedWorkspace.selectedAnnotationElement,
        );

        return;
      }

      if (
        this.selectedWorkspace.selectedAlternateLineElement != null &&
        this.selectedElement?.elementType === ElementType.Note
      ) {
        this.removeAlternateLine(
          this.selectedElement as NoteElement,
          this.selectedWorkspace.selectedAlternateLineElement,
        );

        return;
      }

      if (
        this.selectedElement != null &&
        !this.isLastElement(this.selectedElement)
      ) {
        const index = this.selectedElementIndex;

        this.removeScoreElement(this.selectedElement);

        this.selectedElement = this.elements[index];

        this.save();
      } else if (this.selectionRange != null) {
        const elementsToDelete = this.elements.filter(
          (x) => x.elementType != ElementType.Empty && this.isSelected(x),
        );

        this.commandService.executeAsBatch(
          elementsToDelete.map((element) =>
            scoreElementCommandFactory.create('remove-from-collection', {
              element,
              collection: this.elements,
            }),
          ),
        );

        this.refreshStaffLyrics();

        const start = Math.min(
          this.selectionRange.start,
          this.selectionRange.end,
        );

        this.selectedElement =
          this.elements[Math.min(start, this.elements.length - 1)];

        this.save();
      }
    },

    deletePreviousElement() {
      if (this.selectedWorkspace.selectedAlternateLineElement) {
        const elements =
          this.selectedWorkspace.selectedAlternateLineElement.elements;
        this.removeScoreElement(elements[this.elements.length - 1], elements);

        return;
      }

      if (
        this.selectedElement &&
        this.selectedElementIndex > 0 &&
        navigableElements.includes(
          this.elements[this.selectedElementIndex - 1].elementType,
        )
      ) {
        this.removeScoreElement(this.elements[this.selectedElementIndex - 1]);

        this.save();
      }
    },

    updatePageSetup(pageSetup: PageSetup) {
      const needToRecalcRichTextBoxes =
        pageSetup.textBoxDefaultFontFamily !=
          this.score.pageSetup.textBoxDefaultFontFamily ||
        pageSetup.textBoxDefaultFontSize !=
          this.score.pageSetup.textBoxDefaultFontSize;

      const updateCommands: Command[] = [
        pageSetupCommandFactory.create('update-properties', {
          target: this.score.pageSetup,
          newValues: pageSetup,
        }),
      ];

      if (
        pageSetup.richHeaderFooter &&
        !this.score.pageSetup.richHeaderFooter
      ) {
        updateCommands.push(
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.headers.default.elements,
            element: this.createRichHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.headers.even.elements,
            element: this.createRichHeaderFooter('$p', 'Title', ''),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.headers.firstPage.elements,
            element: this.createRichHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.headers.odd.elements,
            element: this.createRichHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.footers.default.elements,
            element: this.createRichHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.footers.even.elements,
            element: this.createRichHeaderFooter('$p', 'Footer', ''),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.footers.firstPage.elements,
            element: this.createRichHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.footers.odd.elements,
            element: this.createRichHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          }),
        );
      } else if (
        !pageSetup.richHeaderFooter &&
        this.score.pageSetup.richHeaderFooter
      ) {
        updateCommands.push(
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.headers.default.elements,
            element: this.createRegularHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.headers.even.elements,
            element: this.createRegularHeaderFooter('$p', 'Title', ''),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.headers.firstPage.elements,
            element: this.createRegularHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.headers.odd.elements,
            element: this.createRegularHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.footers.default.elements,
            element: this.createRegularHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.footers.even.elements,
            element: this.createRegularHeaderFooter('$p', 'Footer', ''),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.footers.firstPage.elements,
            element: this.createRegularHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          }),
          scoreElementCommandFactory.create('replace-element-in-collection', {
            collection: this.score.footers.odd.elements,
            element: this.createRegularHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          }),
        );
      }

      this.commandService.executeAsBatch(updateCommands);

      if (needToRecalcRichTextBoxes) {
        this.recalculateRichTextBoxHeights();
        this.recalculateTextBoxHeights();
      }

      this.save();
    },

    updatePageSetupUseOptionalDiatonicFthoras(
      useOptionalDiatonicFthoras: boolean,
    ) {
      this.commandService.execute(
        pageSetupCommandFactory.create('update-properties', {
          target: this.score.pageSetup,
          newValues: { useOptionalDiatonicFthoras },
        }),
      );

      this.save();
    },

    createRegularHeaderFooter(left: string, center: string, right: string) {
      const textbox = new TextBoxElement();
      textbox.multipanel = true;
      textbox.contentLeft = left;
      textbox.contentCenter = center;
      textbox.contentRight = right;
      return textbox;
    },

    createRichHeaderFooter(left: string, center: string, right: string) {
      const textbox = new RichTextBoxElement();
      textbox.multipanel = true;
      textbox.contentLeft = `${left}`;
      textbox.contentCenter = `<p style="text-align:center;">${center}</p>`;
      textbox.contentRight = `<p style="text-align:right;">${right}</p>`;
      return textbox;
    },

    updateEntryMode(mode: EntryMode) {
      this.entryMode = mode;
    },

    updateZoom(zoom: number) {
      if (zoom < 0.5 || zoom > 5) {
        if (this.ipcService.isShowMessageBoxSupported()) {
          this.ipcService.showMessageBox({
            type: 'error',
            title: 'Range overflow',
            message: this.$t('toolbar:main:invalidZoom'),
          });
        } else {
          alert(this.$t('toolbar:main:invalidZoom'));
        }
      } else {
        this.zoom = zoom;
        this.zoomToFit = false;
      }
    },

    updateZoomToFit(zoomToFit: boolean) {
      this.zoomToFit = zoomToFit;

      if (zoomToFit) {
        this.performZoomToFit();
      }
    },

    performZoomToFit() {
      const pageBackgroundElement = this.$refs[
        'page-background'
      ] as HTMLElement;

      const computedStyle = getComputedStyle(pageBackgroundElement);

      const availableWidth =
        pageBackgroundElement.clientWidth -
        parseFloat(computedStyle.paddingLeft) -
        parseFloat(computedStyle.paddingRight);

      this.zoom = availableWidth / this.score.pageSetup.pageWidth;
    },

    playAudio() {
      try {
        if (this.audioService.state === AudioState.Stopped) {
          this.playbackEvents = this.playbackService.computePlaybackSequence(
            this.elements,
            this.audioOptions,
            this.score.pageSetup.chrysanthineAccidentals,
          );

          if (this.playbackEvents.length === 0) {
            return;
          }

          const startAt = this.playbackEvents.find(
            (x) => x.elementIndex >= this.selectedElementIndex,
          );

          this.audioService.play(
            this.playbackEvents,
            this.audioOptions,
            startAt,
          );

          if (startAt) {
            this.selectedWorkspace.playbackTime = startAt.absoluteTime;
          }

          this.startPlaybackClock();
        } else {
          this.pauseAudio();
        }
      } catch (error) {
        console.error(error);
      }
    },

    stopAudio() {
      try {
        this.audioService.stop();

        this.playbackEvents = [];

        this.stopPlaybackClock();
      } catch (error) {
        console.error(error);
      }
    },

    pauseAudio() {
      try {
        this.audioService.togglePause();

        if (this.audioService.state === AudioState.Paused) {
          this.audioElement = null;
          this.stopPlaybackClock();
        } else {
          this.startPlaybackClock();
        }
      } catch (error) {
        console.error(error);
      }
    },

    startPlaybackClock() {
      this.stopPlaybackClock();

      this.playbackTimeInterval = setInterval(() => {
        this.selectedWorkspace.playbackTime += 0.1;
      }, 100);
    },

    stopPlaybackClock() {
      if (this.playbackTimeInterval != null) {
        clearInterval(this.playbackTimeInterval);
      }
    },

    playTestTone() {
      try {
        this.audioService.playTestTone(this.audioOptions.frequencyDi);
      } catch (error) {
        console.error(error);
      }
    },

    updateAudioOptionsSpeed(speed: number) {
      if (this.audioService.state === AudioState.Paused) {
        this.stopAudio();
      }

      speed = Math.max(0.1, speed);
      speed = Math.min(3, speed);
      speed = +speed.toFixed(2);

      this.selectedWorkspace.playbackBpm /= this.audioOptions.speed;
      this.selectedWorkspace.playbackBpm *= speed;

      this.audioOptions.speed = speed;

      this.saveAudioOptions();
    },

    saveAudioOptions() {
      localStorage.setItem(
        'audioOptionsDefault',
        JSON.stringify(this.audioOptions),
      );
    },

    onAudioServiceEventPlay(event: PlaybackSequenceEvent) {
      if (this.audioService.state === AudioState.Playing) {
        this.selectedWorkspace.playbackTime = event.absoluteTime;
        this.selectedWorkspace.playbackBpm = event.bpm;

        this.audioElement = this.elements[event.elementIndex];

        // Scroll the currently playing element into view
        const lyrics = (this.$refs[`lyrics-${event.elementIndex}`] as any[])[0];

        const neumeBox = (
          this.$refs[`element-${event.elementIndex}`] as any[]
        )[0];

        if (lyrics?.$el.scrollIntoViewIfNeeded) {
          lyrics.$el.scrollIntoViewIfNeeded(false);
        }

        if (neumeBox?.scrollIntoViewIfNeeded) {
          neumeBox.scrollIntoViewIfNeeded(false);
        }
      }
    },

    onAudioServiceStop() {
      this.audioElement = null;

      this.stopPlaybackClock();
    },

    recalculateRichTextBoxHeights() {
      if (this.richTextBoxCalculation) {
        this.richTextBoxCalculation = false;
      }

      nextTick(async () => {
        const expectedCount = this.resizableRichTextBoxElements.length;
        this.richTextBoxCalculationCount = 0;
        this.richTextBoxCalculation = true;

        const maxTries = 4 * 30; // 30 seconds
        let tries = 1;
        let lastCount = 0;

        // Wait until all rich text boxes have updated
        const poll = (resolve: (value: unknown) => void) => {
          if (
            this.richTextBoxCalculationCount === expectedCount ||
            tries >= maxTries ||
            this.richTextBoxCalculationCount < lastCount
          ) {
            resolve(true);
          } else {
            tries++;
            lastCount = this.richTextBoxCalculationCount;
            setTimeout(() => poll(resolve), 250);
          }
        };

        await new Promise(poll);

        this.richTextBoxCalculation = false;
        this.saveDebounced(false);
      });
    },

    recalculateTextBoxHeights() {
      if (this.textBoxCalculation) {
        this.textBoxCalculation = false;
      }

      nextTick(async () => {
        const expectedCount = this.resizableRichTextBoxElements.length;
        this.textBoxCalculationCount = 0;
        this.textBoxCalculation = true;

        const maxTries = 4 * 30; // 30 seconds
        let tries = 1;
        let lastCount = 0;

        // Wait until all rich text boxes have updated
        const poll = (resolve: (value: unknown) => void) => {
          if (
            this.textBoxCalculationCount === expectedCount ||
            tries >= maxTries ||
            this.textBoxCalculationCount < lastCount
          ) {
            resolve(true);
          } else {
            tries++;
            lastCount = this.textBoxCalculationCount;
            setTimeout(() => poll(resolve), 250);
          }
        };

        await new Promise(poll);

        this.textBoxCalculation = false;
        this.saveDebounced(false);
      });
    },

    onFileMenuNewScore() {
      const workspace = new Workspace();
      workspace.tempFileName = this.getTempFilename();
      workspace.score = this.createDefaultScore();

      this.addWorkspace(workspace);

      this.selectedWorkspace = workspace;

      this.selectedElement =
        this.score.staff.elements[this.score.staff.elements.length - 1];
      this.save(false);
    },

    async onFileMenuOpenScore(args: FileMenuOpenScoreArgs) {
      if (!this.dialogOpen && args.success) {
        this.openScore(args);
      }
    },

    onFileMenuImportOcr(args: FileMenuImportOcrArgs) {
      if (!this.dialogOpen && args.success) {
        const elements = this.ocrImporter.import(args.data);

        const workspace = new Workspace();
        workspace.tempFileName = this.getTempFilename();
        workspace.score = new Score();

        this.addWorkspace(workspace);

        this.selectedWorkspace = workspace;

        this.currentFilePath = null;
        this.score.staff.elements.unshift(...elements);

        this.save();
      }
    },

    onFileMenuPageSetup() {
      this.pageSetupDialogIsOpen = true;
    },

    async onFileMenuPrint() {
      this.printMode = true;

      // Blur the active element so that focus outlines and
      // blinking cursors don't show up in the printed page
      const activeElement = this.blurActiveElement();

      const previousTitle = window.document.title;
      window.document.title = this.getFileName(this.selectedWorkspace, false);

      nextTick(async () => {
        await this.ipcService.printWorkspace(this.selectedWorkspace);
        this.printMode = false;
        window.document.title = previousTitle;

        // Re-focus the active element
        this.focusElement(activeElement);
      });
    },

    async onFileMenuExportAsPdf() {
      this.printMode = true;

      // Blur the active element so that focus outlines and
      // blinking cursors don't show up in the printed page
      const activeElement = this.blurActiveElement();

      const previousTitle = window.document.title;
      window.document.title = this.getFileName(this.selectedWorkspace, false);

      await nextTick();
      await this.ipcService.exportWorkspaceAsPdf(this.selectedWorkspace);
      this.printMode = false;
      window.document.title = previousTitle;

      // Re-focus the active element
      this.focusElement(activeElement);
    },

    async onFileMenuExportAsImage() {
      this.exportFormat = ExportFormat.PNG;
      this.exportDialogIsOpen = true;
    },

    async exportAsPng(args: ExportAsPngSettings) {
      let reply: ExportWorkspaceAsImageReplyArgs;

      try {
        reply = await this.ipcService.exportWorkspaceAsImage(
          this.selectedWorkspace,
          'png',
        );

        if (!reply.success) {
          return;
        }
      } catch (error) {
        console.error(error);
        return;
      }

      this.printMode = true;
      this.exportInProgress = true;

      // Blur the active element so that focus outlines and
      // blinking cursors don't show up in the printed page
      const activeElement = this.blurActiveElement();

      nextTick(async () => {
        try {
          const pages = this.$refs.pages as HTMLElement[];

          if (pages.length > 0) {
            const fontEmbedCSS = await getFontEmbedCSS(pages[0]);

            let pageNumber = 1;

            for (const page of pages) {
              const options = {
                fontEmbedCSS,
                pixelRatio: args.dpi / 96,
                style: { margin: '0' },
              } as any;

              if (args.transparentBackground) {
                options.style.backgroundColor = 'transparent';
              }

              let data = await toPng(page, options);

              if (data != null) {
                const fileName = reply.filePath.replace(
                  /\.png$/,
                  `-${pageNumber++}.png`,
                );

                data = data.replace(/^data:image\/png;base64,/, '');

                if (
                  !(await this.ipcService.exportPageAsImage(fileName, data))
                ) {
                  break;
                }
              }
            }
          }

          if (args.openFolder) {
            await this.ipcService.showItemInFolder(
              reply.filePath.replace(/\.png$/, '-1.png'),
            );
          }
        } catch (error) {
          console.error(error);
        } finally {
          this.printMode = false;
          this.exportInProgress = false;
          this.closeExportDialog();
          // Re-focus the active element
          this.focusElement(activeElement);
        }
      });
    },

    // async exportAsSvg(openFolder: boolean) {
    //   let reply: ExportWorkspaceAsImageReplyArgs;

    //   try {
    //     reply = await this.ipcService.exportWorkspaceAsImage(
    //       this.selectedWorkspace,
    //       'svg',
    //     );

    //     if (!reply.success) {
    //       return;
    //     }
    //   } catch (error) {
    //     console.error(error);
    //     return;
    //   }

    //   this.printMode = true;
    //   this.exportInProgress = true;

    //   // Blur the active element so that focus outlines and
    //   // blinking cursors don't show up in the printed page
    //   const activeElement = this.blurActiveElement();

    //   nextTick(async () => {
    //     try {
    //       const pages = this.$refs.pages as HTMLElement[];

    //       if (pages.length > 0) {
    //         const fontEmbedCSS = await getFontEmbedCSS(pages[0]);

    //         let pageNumber = 1;

    //         for (let page of pages) {
    //           const data = await toSvg(page, {
    //             fontEmbedCSS,
    //           });

    //           if (data != null) {
    //             const fileName = reply.filePath.replace(
    //               /.svg$/,
    //               `-${pageNumber++}.svg`,
    //             );

    //             if (!(await this.ipcService.exportPageAsImage(fileName, data))) {
    //               break;
    //             }
    //           }
    //         }
    //       }

    //       if (openFolder) {
    //         await this.ipcService.showItemInFolder(
    //           reply.filePath.replace(/\.svg$/, '-1.svg'),
    //         );
    //       }
    //     } catch (error) {
    //       console.error(error);
    //     } finally {
    //       this.printMode = false;
    //       this.exportInProgress = false;
    //       this.closeExportDialog();
    //       // Re-focus the active element
    //       this.focusElement(activeElement);
    //     }
    //   });
    // }

    async onFileMenuExportAsHtml() {
      await this.ipcService.exportWorkspaceAsHtml(
        this.selectedWorkspace,
        this.byzHtmlExporter.exportScore(this.score),
      );
    },

    onFileMenuExportAsMusicXml() {
      this.exportFormat = ExportFormat.MusicXml;
      this.exportDialogIsOpen = true;
    },

    onFileMenuExportAsLatex() {
      this.exportFormat = ExportFormat.Latex;
      this.exportDialogIsOpen = true;
    },

    async exportAsMusicXml(args: ExportAsMusicXmlSettings) {
      await this.ipcService.exportWorkspaceAsMusicXml(
        this.selectedWorkspace,
        this.musicXmlExporter.export(this.score, args.options),
        args.compressed,
        args.openFolder,
      );

      this.closeExportDialog();
    },

    async exportAsLatex(args: ExportAsLatexSettings) {
      await this.ipcService.exportWorkspaceAsLatex(
        this.selectedWorkspace,
        JSON.stringify(
          this.latexExporter.export(
            this.pages,
            this.score.pageSetup,
            args.options,
          ),
          null,
          2,
        ),
      );

      this.closeExportDialog();
    },

    blurActiveElement() {
      const activeElement = document.activeElement;

      if (activeElement instanceof HTMLElement) {
        activeElement.blur();
      }

      return activeElement;
    },

    focusElement(element: Element | null) {
      if (element instanceof HTMLElement) {
        element.focus();
      }
    },

    onFileMenuInsertAnnotation() {
      if (this.selectedElement?.elementType === ElementType.Note) {
        const el = new AnnotationElement();
        const fontHeight = TextMeasurementService.getFontHeight(
          this.score.pageSetup.lyricsFont,
        );
        el.x = 0;
        el.y = -fontHeight;
        (this.selectedElement as NoteElement).annotations.push(el);
        this.selectedWorkspace.selectedAnnotationElement = el;
        this.save();
      }
    },

    onFileMenuInsertAlternateLine() {
      if (this.selectedElement?.elementType === ElementType.Note) {
        const el = new AlternateLineElement();
        const fontHeight = TextMeasurementService.getFontHeight(
          this.score.pageSetup.lyricsFont,
        );
        el.x = 0;
        el.y = -fontHeight;
        (this.selectedElement as NoteElement).alternateLines.push(el);
        this.selectedWorkspace.selectedAlternateLineElement = el;
        this.save();
      }
    },

    onFileMenuInsertTextBox(args?: FileMenuInsertTextboxArgs) {
      const element = new TextBoxElement();
      element.inline = args?.inline ?? false;

      if (element.inline) {
        element.color = this.score.pageSetup.lyricsDefaultColor;
        element.fontFamily = this.score.pageSetup.lyricsDefaultFontFamily;
        element.fontSize = this.score.pageSetup.lyricsDefaultFontSize;
        element.strokeWidth = this.score.pageSetup.lyricsDefaultStrokeWidth;
        element.bold = this.score.pageSetup.lyricsDefaultFontWeight === '700';
        element.italic =
          this.score.pageSetup.lyricsDefaultFontStyle === 'italic';
      } else {
        element.color = this.score.pageSetup.textBoxDefaultColor;
        element.fontFamily = this.score.pageSetup.textBoxDefaultFontFamily;
        element.fontSize = this.score.pageSetup.textBoxDefaultFontSize;
        element.strokeWidth = this.score.pageSetup.textBoxDefaultStrokeWidth;
        element.lineHeight = this.score.pageSetup.textBoxDefaultLineHeight;
        element.bold = this.score.pageSetup.textBoxDefaultFontWeight === '700';
        element.italic =
          this.score.pageSetup.textBoxDefaultFontStyle === 'italic';
      }

      this.addScoreElement(element, this.selectedElementIndex);

      this.selectedElement = element;

      this.save();

      nextTick(() => {
        const index = this.elements.indexOf(element);

        (this.$refs[`element-${index}`] as any)[0].focus();
      });
    },

    onFileMenuInsertRichTextBox() {
      const element = new RichTextBoxElement();
      element.rtl = this.score.pageSetup.melkiteRtl;

      this.addScoreElement(element, this.selectedElementIndex);

      this.selectedElement = element;

      this.save();

      nextTick(() => {
        const index = this.elements.indexOf(element);

        (this.$refs[`element-${index}`] as any)[0].focus();
      });
    },

    onFileMenuInsertModeKey() {
      const element = this.createDefaultModeKey(this.score.pageSetup);

      this.addScoreElement(element, this.selectedElementIndex);

      this.selectedElement = element;

      this.openModeKeyDialog();

      this.save();
    },

    onFileMenuInsertDropCapBefore() {
      this.addDropCap(false);
    },

    onFileMenuInsertDropCapAfter() {
      this.addDropCap(true);
    },

    onFileMenuInsertImage(args: FileMenuOpenImageArgs) {
      const element = new ImageBoxElement();

      element.data = args.data;
      element.imageWidth = args.imageWidth;
      element.imageHeight = args.imageHeight;

      this.addScoreElement(element, this.selectedElementIndex);

      this.selectedElement = element;

      this.save();
    },

    onFileMenuInsertHeader() {
      if (this.score.pageSetup.showHeader) {
        return;
      }

      this.score.pageSetup.showHeader = true;

      this.updatePageSetup(this.score.pageSetup);
    },

    onFileMenuInsertFooter() {
      if (this.score.pageSetup.showFooter) {
        return;
      }

      this.score.pageSetup.showFooter = true;

      this.updatePageSetup(this.score.pageSetup);
    },

    onFileMenuToolsCopyElementLink() {
      if (this.selectedElement?.id != null) {
        navigator.clipboard.writeText(
          '#element-' + this.selectedElement.id.toString(),
        );
      }
    },

    async onFileMenuSave() {
      const workspace = this.selectedWorkspace;

      if (workspace.filePath != null) {
        const result = await this.saveWorkspace(workspace);
        if (result.success) {
          workspace.hasUnsavedChanges = false;
        }
      } else {
        const result = await this.saveWorkspaceAs(workspace);
        if (result.success) {
          workspace.filePath = result.filePath;
          workspace.hasUnsavedChanges = false;
        }
      }
    },

    async onFileMenuSaveAs() {
      const workspace = this.selectedWorkspace;

      const result = await this.saveWorkspaceAs(workspace);
      if (result.success) {
        workspace.filePath = result.filePath;
        workspace.hasUnsavedChanges = false;
      }
    },

    onFileMenuUndo() {
      const currentIndex = this.selectedElementIndex;

      const textBoxDefaultFontFamilyPrevious =
        this.score.pageSetup.textBoxDefaultFontFamily;
      const textBoxDefaultFontSizePrevious =
        this.score.pageSetup.textBoxDefaultFontSize;

      this.commandService.undo();

      // TODO this may be overkill, but the alternative is putting in place
      // an event system to only refresh on certain undo actions
      this.refreshStaffLyrics();

      if (currentIndex > -1) {
        // If the selected element was removed during the undo process, choose a new one
        const clampedIndex = Math.min(currentIndex, this.elements.length - 1);

        if (this.selectedElement !== this.elements[clampedIndex]) {
          this.selectedElement = this.elements[clampedIndex];
        }

        // Undo/redo could affect the note display in the neume toolbar (among other things),
        // so we force a refresh here
        this.selectedElement.keyHelper++;
      }

      if (
        textBoxDefaultFontFamilyPrevious !=
          this.score.pageSetup.textBoxDefaultFontFamily ||
        textBoxDefaultFontSizePrevious !=
          this.score.pageSetup.textBoxDefaultFontSize
      ) {
        this.recalculateRichTextBoxHeights();
        this.recalculateTextBoxHeights();
      }

      this.save();
    },

    onFileMenuRedo() {
      const currentIndex = this.selectedElementIndex;

      const textBoxDefaultFontFamilyPrevious =
        this.score.pageSetup.textBoxDefaultFontFamily;
      const textBoxDefaultFontSizePrevious =
        this.score.pageSetup.textBoxDefaultFontSize;

      this.commandService.redo();

      // TODO this may be overkill, but the alternative is putting in place
      // an event system to only refresh on certain undo actions
      this.refreshStaffLyrics();

      if (currentIndex > -1) {
        // If the selected element was removed during the redo process, choose a new one
        const clampedIndex = Math.min(currentIndex, this.elements.length - 1);

        if (this.selectedElement !== this.elements[clampedIndex]) {
          this.selectedElement = this.elements[clampedIndex];
        }

        // Undo/redo could affect the note display in the neume toolbar (among other things),
        // so we force a refresh here
        this.selectedElement.keyHelper++;
      }

      if (
        textBoxDefaultFontFamilyPrevious !=
          this.score.pageSetup.textBoxDefaultFontFamily ||
        textBoxDefaultFontSizePrevious !=
          this.score.pageSetup.textBoxDefaultFontSize
      ) {
        this.recalculateRichTextBoxHeights();
        this.recalculateTextBoxHeights();
      }

      this.save();
    },

    onFileMenuCut() {
      if (!this.isTextInputFocused() && !this.dialogOpen) {
        this.onCutScoreElements();
      } else {
        document.execCommand('cut');
      }
    },

    onFileMenuCopy() {
      if (!this.isTextInputFocused() && !this.dialogOpen) {
        this.onCopyScoreElements();
      } else {
        document.execCommand('copy');
      }
    },

    onFileMenuCopyFormat() {
      if (this.selectedElement == null) {
        return;
      }

      if (this.selectedElement.elementType === ElementType.TextBox) {
        this.formatType = ElementType.TextBox;
        this.textBoxFormat = (
          this.selectedElement as TextBoxElement
        ).cloneFormat();
      } else if (this.selectedElement.elementType === ElementType.Note) {
        this.formatType = ElementType.Note;
        this.noteFormat = (this.selectedElement as NoteElement).cloneFormat();
      }
    },

    onFileMenuCopyAsHtml() {
      let elements: ScoreElement[] = [];

      if (this.selectionRange != null) {
        elements = this.elements.filter(
          (x) => x.elementType != ElementType.Empty && this.isSelected(x),
        );
      } else if (this.selectedElement != null) {
        elements = [this.selectedElement];
      } else if (this.selectedLyrics != null) {
        elements = [this.selectedLyrics];
      }

      const html = this.byzHtmlExporter.exportElements(
        elements,
        this.score.pageSetup,
        0,
        true,
      );

      navigator.clipboard.writeText(html);
    },

    onFileMenuPaste() {
      if (!this.isTextInputFocused() && !this.dialogOpen) {
        this.onPasteScoreElements(false);
      } else {
        this.ipcService.paste();
      }
    },

    onFileMenuPasteWithLyrics() {
      if (!this.isTextInputFocused() && !this.dialogOpen) {
        this.onPasteScoreElements(true);
      } else {
        this.ipcService.paste();
      }
    },

    onFileMenuPasteFormat() {
      const normalizedRange = this.getNormalizedSelectionRange();

      const commands: Command[] = [];

      if (normalizedRange != null) {
        for (let i = normalizedRange.start; i <= normalizedRange.end; i++) {
          if (this.elements[i].elementType === this.formatType) {
            this.applyCopiedFormat(this.elements[i], commands);
          }
        }
      } else if (this.selectedElement != null) {
        this.applyCopiedFormat(this.selectedElement, commands);
      }

      if (commands.length > 0) {
        this.commandService.executeAsBatch(commands);
        this.save();
      }
    },

    applyCopiedFormat(element: ScoreElement, commands: Command[]) {
      if (
        element.elementType === ElementType.TextBox &&
        this.textBoxFormat != null
      ) {
        commands.push(
          textBoxCommandFactory.create('update-properties', {
            target: element as TextBoxElement,
            newValues: this.textBoxFormat,
          }),
        );
      } else if (
        element.elementType === ElementType.Note &&
        this.noteFormat != null
      ) {
        commands.push(
          noteElementCommandFactory.create('update-properties', {
            target: element as NoteElement,
            newValues: this.noteFormat,
          }),
        );
      }
    },

    onFileMenuFind() {
      if (this.searchTextPanelIsOpen) {
        (this.$refs.searchText as InstanceType<typeof SearchText>).focus();
      } else {
        this.searchTextPanelIsOpen = true;
      }
    },

    onFileMenuLyrics() {
      if (!this.dialogOpen) {
        if (this.lyricManagerIsOpen) {
          this.closeLyricManager();
        } else {
          this.openLyricManager();
        }
      }
    },

    onFileMenuPreferences() {
      if (!this.dialogOpen) {
        this.editorPreferencesDialogIsOpen = true;
      }
    },

    onFileMenuGenerateTestFile(testFileType: TestFileType) {
      const workspace = new Workspace();
      workspace.tempFileName = this.getTempFilename();
      workspace.score = new Score();

      // The ison test page can be used to inspect the ison alignment
      // provided by the font, so we disable the automatic ison alignment
      if (testFileType === TestFileType.Ison) {
        workspace.score.pageSetup.alignIsonIndicators = false;
      }

      this.addWorkspace(workspace);

      this.selectedWorkspace = workspace;

      this.currentFilePath = null;
      this.score.staff.elements.unshift(
        ...(TestFileGenerator.generateTestFile(testFileType, this.fonts) || []),
      );
      this.save();
    },

    onSearchText(args: { query: string; reverse?: boolean }) {
      const result = this.textSearchService.findTextInElements(
        args.query,
        this.elements,
        this.selectedElementIndex,
        args.reverse ?? false,
      );

      if (result != null) {
        this.selectedElement = result;

        (this.$refs.pages as HTMLElement[])[
          this.selectedElement.page - 1
        ].scrollIntoView();

        this.pages[this.selectedElement.page - 1].isVisible = true;

        nextTick(() => {
          if (this.selectedElement?.elementType === ElementType.Note) {
            (
              this.$refs[
                `element-${this.selectedElementIndex}`
              ] as HTMLElement[]
            )[0].scrollIntoView();
          } else if (
            this.selectedElement?.elementType === ElementType.DropCap
          ) {
            (
              this.$refs[
                `element-${this.selectedElementIndex}`
              ] as InstanceType<typeof DropCap>[]
            )[0].$el.scrollIntoView();
          } else if (
            this.selectedElement?.elementType === ElementType.TextBox
          ) {
            (
              this.$refs[
                `element-${this.selectedElementIndex}`
              ] as InstanceType<typeof TextBox>[]
            )[0].$el.scrollIntoView();
          }
        });
      }
    },

    createDefaultModeKey(pageSetup: PageSetup) {
      const defaultTemplate = ModeKeyElement.createFromTemplate(
        modeKeyTemplates[0],
        this.score.pageSetup.useOptionalDiatonicFthoras,
      );

      defaultTemplate.color = pageSetup.modeKeyDefaultColor;
      defaultTemplate.fontSize = pageSetup.modeKeyDefaultFontSize;
      defaultTemplate.strokeWidth = pageSetup.modeKeyDefaultStrokeWidth;

      return defaultTemplate;
    },

    createDefaultScore() {
      const score = new Score();

      try {
        const pageSetupDefault = localStorage.getItem('pageSetupDefault');

        if (pageSetupDefault) {
          SaveService.LoadPageSetup_v1(
            score.pageSetup,
            JSON.parse(pageSetupDefault),
          );
        }
      } catch (error) {
        console.error(error);
      }

      const title = new TextBoxElement();
      title.content = 'Title';
      title.alignment = TextBoxAlignment.Center;
      title.color = score.pageSetup.textBoxDefaultColor;
      title.fontFamily = score.pageSetup.textBoxDefaultFontFamily;
      title.fontSize = score.pageSetup.textBoxDefaultFontSize;
      title.strokeWidth = score.pageSetup.textBoxDefaultStrokeWidth;
      title.lineHeight = score.pageSetup.textBoxDefaultLineHeight;
      title.bold = score.pageSetup.textBoxDefaultFontWeight === '700';
      title.italic = score.pageSetup.textBoxDefaultFontStyle === 'italic';
      title.height = Math.round(
        TextMeasurementService.getFontHeight(title.computedFont) * 1.2,
      );
      score.staff.elements.unshift(
        title,
        this.createDefaultModeKey(score.pageSetup),
      );

      for (const element of score.headersAndFooters) {
        if (element.elementType === ElementType.TextBox) {
          (element as TextBoxElement).fontFamily =
            score.pageSetup.lyricsDefaultFontFamily;
          (element as TextBoxElement).strokeWidth =
            score.pageSetup.lyricsDefaultStrokeWidth;
        }
      }

      return score;
    },

    openScore(args: FileMenuOpenScoreArgs) {
      if (!args.success) {
        return;
      }

      // First make sure we don't already have the score open
      const existingWorkspace = this.workspaces.find(
        (x) => x.filePath === args.filePath,
      ) as Workspace;
      if (existingWorkspace != null) {
        this.selectedWorkspace = existingWorkspace;
        return;
      }

      try {
        const score: Score = SaveService.LoadScoreFromJson(
          JSON.parse(args.data),
        );

        // if (score.version !== ScoreVersion) {
        //   alert('This score was created by an older version of the application. It may not work properly');
        // }

        const workspace = new Workspace();
        workspace.filePath = args.filePath;
        workspace.tempFileName = this.getTempFilename();
        workspace.score = score;

        this.addWorkspace(workspace);

        this.selectedWorkspace = workspace;

        this.selectedElement = null;

        this.save(false);
      } catch (error) {
        args.success = false;
        console.error(error);

        if (error instanceof Error) {
          if (this.ipcService.isShowMessageBoxSupported()) {
            this.ipcService.showMessageBox({
              type: 'error',
              title: 'Open failed',
              message: error.message,
            });
          } else {
            alert(error.message);
          }
        }
      }
    },

    addWorkspace(workspace: Workspace) {
      this.workspaces.push(workspace);

      (this.$refs.tabs as Vue3TabsChromeComponent).addTab({
        label: this.getFileName(workspace),
        key: workspace.id,
      });
    },

    removeWorkspace(workspace: Workspace) {
      const index = this.workspaces.indexOf(workspace);

      this.workspaces.splice(index, 1);

      (this.$refs.tabs as Vue3TabsChromeComponent).removeTab(workspace.id);

      if (this.selectedWorkspace === workspace) {
        if (this.workspaces.length > 0) {
          this.selectedWorkspace = this.workspaces[
            Math.min(index, this.workspaces.length - 1)
          ] as Workspace;
        } else {
          // TODO support closing all workspaces
          this.onFileMenuNewScore();
        }
      }
    },

    onTabClosed(tab: Tab) {
      const workspace = this.workspaces.find(
        (x) => x.id === tab.key,
      ) as Workspace;

      if (workspace) {
        // If the workspace is still in our list, then call closeWorkspace.
        // closeWorkspace will decide whether to remove the tab and will
        // explicitly call removeTab. Returning false tells the tab component
        // to not close the tab, so that we can take care of it manually.
        this.closeWorkspace(workspace);
        return false;
      } else {
        // If we got here, the workspace was already removed by closeWorkspace.
        // We allow the tab component to close the tab by returning true.
        return true;
      }
    },

    openContextMenuForTab(event: PointerEvent, tab: Tab) {
      // TODO for browser version, show a custom (non-native) context menu.
      if (!this.isBrowser) {
        this.ipcService.openContextMenuForTab({ workspaceId: tab.key });
      }
    },

    renderTabLabel(tab: Tab) {
      const workspace = this.workspaces.find(
        (x) => x.id === tab.key,
      ) as Workspace;

      return workspace ? this.getFileName(workspace) : '';
    },
  },
});
</script>

<template>
  <div class="editor">
    <div class="loading-overlay" v-if="isLoading">
      <img src="@/assets/icons/spinner.svg" />
    </div>
    <FileMenuBar v-if="showFileMenuBar" />
    <ToolbarMain
      :entryMode="entryMode"
      :zoom="zoom"
      :zoomToFit="zoomToFit"
      :audioState="audioService.state"
      :audioOptions="audioOptions"
      :playbackTime="selectedWorkspace.playbackTime"
      :playbackBpm="selectedWorkspace.playbackBpm"
      :currentPageNumber="currentPageNumber"
      :pageCount="pageCount"
      :neumeKeyboard="neumeKeyboard"
      @update:zoom="updateZoom"
      @update:zoomToFit="updateZoomToFit"
      @update:audioOptionsSpeed="updateAudioOptionsSpeed"
      @add-auto-martyria="addAutoMartyria"
      @update:entryMode="updateEntryMode"
      @toggle-page-break="togglePageBreak"
      @toggle-line-break="toggleLineBreak($event)"
      @add-tempo="addTempo"
      @add-drop-cap="addDropCap(false)"
      @add-mode-key="onFileMenuInsertModeKey"
      @add-text-box="onFileMenuInsertTextBox"
      @add-text-box-rich="onFileMenuInsertRichTextBox"
      @add-image="onClickAddImage"
      @delete-selected-element="deleteSelectedElement"
      @click="selectedLyrics = null"
      @play-audio="playAudio"
      @open-playback-settings="openPlaybackSettingsDialog"
    />
    <div class="content">
      <div class="left-panel">
        <NeumeSelector
          class="neume-selector"
          :pageSetup="score.pageSetup"
          :neumeKeyboard="neumeKeyboard"
          @select-quantitative-neume="addQuantitativeNeume"
        />
        <div
          class="neume-combo-header"
          @click="neumeComboPanelIsExpanded = !neumeComboPanelIsExpanded"
        >
          {{ $t('editor:common.neumeComboHeader') }}
          <span class="neume-combo-expand-collapse">{{
            neumeComboPanelIsExpanded ? '\u2796' : '\u2795'
          }}</span>
        </div>
        <NeumeComboSelector
          v-if="neumeComboPanelIsExpanded"
          class="neume-combo-selector"
          :pageSetup="score.pageSetup"
          @select-neume-combo="addNeumeCombination"
        />
      </div>

      <div class="page-container">
        <!-- @vue-ignore -->
        <Vue3TabsChrome
          class="workspace-tab-container"
          ref="tabs"
          :tabs="tabs"
          v-model="selectedWorkspaceId"
          :gap="0"
          :on-close="onTabClosed"
          :render-label="renderTabLabel"
          @contextmenu="openContextMenuForTab"
        >
          <template v-slot:after>
            <button
              class="workspace-tab-new-button"
              @click="onFileMenuNewScore"
            >
              +
            </button>
          </template></Vue3TabsChrome
        >
        <SearchText
          ref="searchText"
          v-if="searchTextPanelIsOpen"
          v-model:query="searchTextQuery"
          @search="onSearchText"
          @close="searchTextPanelIsOpen = false"
        />
        <div
          class="page-background"
          ref="page-background"
          @scroll="throttled.onScroll"
        >
          <div
            class="page"
            :style="pageStyle"
            v-observe-visibility="{
              callback: (isVisible: boolean) =>
                updatePageVisibility(page, isVisible),
              intersection: pageVisibilityIntersection,
            }"
            v-for="(page, pageIndex) in filteredPages"
            :key="`page-${pageIndex}`"
            ref="pages"
            :class="{ print: printMode }"
          >
            <template v-if="page.isVisible || printMode">
              <template v-if="showGuides">
                <span class="guide-line-vl" :style="guideStyleLeft" />
                <span class="guide-line-vr" :style="guideStyleRight" />
                <span class="guide-line-ht" :style="guideStyleTop" />
                <span class="guide-line-hb" :style="guideStyleBottom" />
              </template>
              <template v-if="score.pageSetup.showHeader">
                <template
                  v-if="isRichTextBoxElement(getHeaderForPageIndex(pageIndex))"
                >
                  <TextBoxRich
                    class="element-box"
                    :key="`element-${selectedWorkspace.id}-${getHeaderForPageIndex(pageIndex).id}-${
                      getHeaderForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="`header-${pageIndex}`"
                    :element="
                      getHeaderForPageIndex(pageIndex) as RichTextBoxElement
                    "
                    :editMode="
                      !printMode &&
                      getHeaderForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :fonts="fonts"
                    :selected="
                      getHeaderForPageIndex(pageIndex) ==
                      selectedHeaderFooterElement
                    "
                    :style="headerStyle"
                    @click="
                      selectedHeaderFooterElement =
                        getHeaderForPageIndex(pageIndex)
                    "
                    @update="
                      updateRichTextBox(
                        getHeaderForPageIndex(pageIndex) as RichTextBoxElement,
                        $event,
                      )
                    "
                    @update:height="
                      updateRichTextBoxHeight(
                        getHeaderForPageIndex(pageIndex) as RichTextBoxElement,
                        $event,
                      )
                    "
                  />
                </template>
                <template
                  v-else-if="isTextBoxElement(getHeaderForPageIndex(pageIndex))"
                >
                  <TextBox
                    class="element-box"
                    :key="`element-${selectedWorkspace.id}-${getHeaderForPageIndex(pageIndex).id}-${
                      getHeaderForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="`header-${pageIndex}`"
                    :element="
                      getHeaderForPageIndex(pageIndex) as TextBoxElement
                    "
                    :editMode="
                      !printMode &&
                      getHeaderForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :selected="
                      getHeaderForPageIndex(pageIndex) ==
                      selectedHeaderFooterElement
                    "
                    :class="[
                      {
                        selectedTextbox:
                          getHeaderForPageIndex(pageIndex) ==
                          selectedHeaderFooterElement,
                      },
                    ]"
                    :style="headerStyle"
                    @click="
                      selectedHeaderFooterElement =
                        getHeaderForPageIndex(pageIndex)
                    "
                    @update="
                      updateTextBox(
                        getHeaderForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                  />
                </template>
                <div
                  v-if="shouldShowHeaderForPageIndex(pageIndex)"
                  class="header-footer-hr"
                  :style="
                    getHeaderHorizontalRuleStyle(
                      getHeaderForPageIndex(pageIndex).height,
                    )
                  "
                ></div>
              </template>
              <div
                class="line"
                v-for="(line, lineIndex) in page.lines"
                :key="`line-${pageIndex}-${lineIndex}`"
                :ref="`line-${lineIndex}`"
              >
                <div
                  v-for="element in line.elements"
                  :id="`element-${element.id}`"
                  :key="`element-${selectedWorkspace.id}-${element.id}-${element.keyHelper}`"
                  class="element-box"
                  :style="getElementStyle(element)"
                >
                  <template v-if="isSyllableElement(element)">
                    <div
                      :ref="`element-${getElementIndex(element)}`"
                      class="neume-box"
                    >
                      <span
                        class="section-name"
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        >§</span
                      >
                      <span class="page-break" v-if="element.pageBreak"
                        ><img src="@/assets/icons/page-break.svg"
                      /></span>
                      <span class="line-break" v-if="element.lineBreak"
                        ><img
                          v-if="element.lineBreakType === LineBreakType.Justify"
                          src="@/assets/icons/line-break-justify.svg" /><img
                          v-else-if="
                            element.lineBreakType === LineBreakType.Center
                          "
                          src="@/assets/icons/line-break-center.svg" /><img
                          v-else
                          src="@/assets/icons/line-break.svg"
                      /></span>
                      <AlternateLine
                        v-for="(alternateLine, index) in (
                          element as NoteElement
                        ).alternateLines"
                        :key="index"
                        :element="alternateLine"
                        :pageSetup="score.pageSetup"
                        :class="{
                          selectedAlternateLine:
                            selectedWorkspace.selectedAlternateLineElement ===
                            alternateLine,
                        }"
                        @update="updateAlternateLine(alternateLine, $event)"
                        @mousedown="
                          setSelectedAlternateLine(element, alternateLine)
                        "
                      />
                      <Annotation
                        v-for="(annotation, index) in (element as NoteElement)
                          .annotations"
                        :key="index"
                        :element="annotation"
                        :pageSetup="score.pageSetup"
                        :fonts="fonts"
                        :selected="
                          selectedWorkspace.selectedAnnotationElement ===
                          annotation
                        "
                        @update="updateAnnotation(annotation, $event)"
                        @delete="
                          removeAnnotation(
                            element as NoteElement,
                            annotation,
                            true,
                          )
                        "
                        @mousedown="setSelectedAnnotation(element, annotation)"
                      />
                      <SyllableNeumeBox
                        class="syllable-box"
                        :note="element as NoteElement"
                        :pageSetup="score.pageSetup"
                        :class="[
                          {
                            selected: isSelected(element),
                            'audio-selected': isAudioSelected(element),
                          },
                        ]"
                        @select-single="selectedElement = element"
                        @select-range="setSelectionRange(element)"
                        @dblclick="openSyllablePositioningDialog"
                      />
                      <div
                        class="lyrics-container"
                        :style="getLyricStyle(element as NoteElement)"
                      >
                        <ContentEditable
                          class="lyrics"
                          :class="{
                            selectedLyrics: element === selectedLyrics,
                          }"
                          :content="(element as NoteElement).lyrics"
                          :editable="!lyricsLocked"
                          whiteSpace="nowrap"
                          :ref="`lyrics-${getElementIndex(element)}`"
                          @click="focusLyrics(element.index)"
                          @focus="selectedLyrics = element as NoteElement"
                          @blur="updateLyrics(element as NoteElement, $event)"
                        />
                        <template
                          v-if="
                            isMelisma(element as NoteElement) &&
                            (element as NoteElement).isHyphen &&
                            (element as NoteElement).melismaText === ''
                          "
                        >
                          <div
                            class="melisma"
                            :class="{
                              full: (element as NoteElement).isFullMelisma,
                            }"
                            :style="getMelismaStyle(element as NoteElement)"
                          >
                            <span
                              class="melisma-hyphen"
                              v-for="(offset, index) in (element as NoteElement)
                                .hyphenOffsets"
                              :key="index"
                              :style="
                                getMelismaHyphenStyle(
                                  element as NoteElement,
                                  index,
                                )
                              "
                              >-</span
                            >
                          </div>
                        </template>
                        <template
                          v-else-if="
                            isMelisma(element as NoteElement) &&
                            !(element as NoteElement).isHyphen &&
                            !rtl &&
                            (element as NoteElement).melismaText === ''
                          "
                        >
                          <div
                            class="melisma-underscore"
                            :class="{
                              full: (element as NoteElement).isFullMelisma,
                            }"
                            :style="
                              getMelismaUnderscoreStyleOuter(
                                element as NoteElement,
                              )
                            "
                          >
                            <div
                              class="melisma-inner"
                              :style="
                                getMelismaUnderscoreStyleInner(
                                  element as NoteElement,
                                )
                              "
                            ></div>
                          </div>
                        </template>
                        <template
                          v-else-if="
                            isMelisma(element as NoteElement) &&
                            !(element as NoteElement).isHyphen &&
                            rtl
                          "
                        >
                          <div
                            class="melisma"
                            :class="{
                              fullRtl: (element as NoteElement).isFullMelisma,
                            }"
                            :style="getMelismaStyle(element as NoteElement)"
                            v-text="(element as NoteElement).melismaText"
                          ></div>
                        </template>
                        <template
                          v-else-if="
                            (element as NoteElement).isMelisma &&
                            (element as NoteElement).melismaText !== '' &&
                            !rtl
                          "
                        >
                          <span
                            class="melisma-text"
                            v-text="(element as NoteElement).melismaText"
                            :class="{
                              selectedMelisma: element === selectedLyrics,
                            }"
                            @click="focusLyrics(element.index)"
                            @focus="selectedLyrics = element as NoteElement"
                          ></span>
                        </template>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="isMartyriaElement(element)">
                    <div class="neume-box">
                      <span
                        class="section-name"
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        >§</span
                      >
                      <span class="page-break" v-if="element.pageBreak">
                        <img src="@/assets/icons/page-break.svg"
                      /></span>
                      <span class="line-break" v-if="element.lineBreak"
                        ><img src="@/assets/icons/line-break.svg"
                      /></span>
                      <MartyriaNeumeBox
                        :ref="`element-${getElementIndex(element)}`"
                        class="marytria-neume-box"
                        :neume="element as MartyriaElement"
                        :pageSetup="score.pageSetup"
                        :class="[
                          {
                            selected: isSelected(element),
                          },
                        ]"
                        @select-single="selectedElement = element"
                        @select-range="setSelectionRange(element)"
                      />
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isTempoElement(element)">
                    <div
                      :ref="`element-${getElementIndex(element)}`"
                      class="neume-box"
                    >
                      <span
                        class="section-name"
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        >§</span
                      >
                      <span class="page-break" v-if="element.pageBreak">
                        <img src="@/assets/icons/page-break.svg"
                      /></span>
                      <span class="line-break" v-if="element.lineBreak"
                        ><img src="@/assets/icons/line-break.svg"
                      /></span>
                      <TempoNeumeBox
                        class="tempo-neume-box"
                        :neume="element as TempoElement"
                        :pageSetup="score.pageSetup"
                        :class="[{ selected: isSelected(element) }]"
                        @select-single="selectedElement = element"
                        @select-range="setSelectionRange(element)"
                      />
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isEmptyElement(element)">
                    <div
                      :ref="`element-${getElementIndex(element)}`"
                      class="neume-box"
                    >
                      <span
                        class="section-name"
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        >§</span
                      >
                      <span class="page-break" v-if="element.pageBreak">
                        <img src="@/assets/icons/page-break.svg"
                      /></span>
                      <span class="line-break" v-if="element.lineBreak"
                        ><img src="@/assets/icons/line-break.svg"
                      /></span>
                      <EmptyNeumeBox
                        class="empty-neume-box"
                        :class="[{ selected: isSelected(element) }]"
                        :style="getEmptyBoxStyle(element as EmptyElement)"
                        @select-single="selectedElement = element"
                      ></EmptyNeumeBox>
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isTextBoxElement(element)">
                    <span
                      class="section-name-2"
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      >§</span
                    >
                    <span class="page-break-2" v-if="element.pageBreak"
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break-2" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <TextBox
                      :ref="`element-${getElementIndex(element)}`"
                      :element="element as TextBoxElement"
                      :editMode="true"
                      :metadata="getTokenMetadata(pageIndex)"
                      :pageSetup="score.pageSetup"
                      :selected="isSelected(element)"
                      @select-single="selectedElement = element"
                      @update="updateTextBox(element as TextBoxElement, $event)"
                      @update:height="
                        updateTextBoxHeight(element as TextBoxElement, $event)
                      "
                    />
                  </template>
                  <template v-else-if="isRichTextBoxElement(element)">
                    <span
                      class="section-name-2"
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      >§</span
                    >
                    <span class="page-break-2" v-if="element.pageBreak"
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break-2" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <TextBoxRich
                      :ref="`element-${getElementIndex(element)}`"
                      :element="element as RichTextBoxElement"
                      :pageSetup="score.pageSetup"
                      :fonts="fonts"
                      :selected="isSelected(element)"
                      @select-single="selectedElement = element"
                      @update="
                        updateRichTextBox(element as RichTextBoxElement, $event)
                      "
                      @update:height="
                        updateRichTextBoxHeight(
                          element as RichTextBoxElement,
                          $event,
                        )
                      "
                    />
                  </template>
                  <template v-else-if="isModeKeyElement(element)">
                    <span
                      class="section-name-2"
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      >§</span
                    >
                    <span class="page-break-2" v-if="element.pageBreak"
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break-2" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <ModeKey
                      :ref="`element-${getElementIndex(element)}`"
                      :element="element as ModeKeyElement"
                      :pageSetup="score.pageSetup"
                      :class="[
                        {
                          selectedTextbox: isSelected(element),
                        },
                      ]"
                      @select-single="selectedElement = element"
                      @dblclick="openModeKeyDialog"
                    />
                  </template>
                  <template v-else-if="isDropCapElement(element)">
                    <span
                      class="section-name"
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      >§</span
                    >
                    <span class="page-break" v-if="element.pageBreak"
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <DropCap
                      :ref="`element-${getElementIndex(element)}`"
                      :element="element as DropCapElement"
                      :pageSetup="score.pageSetup"
                      :editable="!lyricsLocked"
                      :class="[
                        {
                          selectedTextbox: isSelected(element),
                        },
                      ]"
                      @select-single="selectedElement = element"
                      @update:content="
                        updateDropCapContent(element as DropCapElement, $event)
                      "
                    />
                  </template>
                  <template v-else-if="isImageBoxElement(element)">
                    <span class="page-break-2" v-if="element.pageBreak"
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break-2" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <ImageBox
                      :ref="`element-${getElementIndex(element)}`"
                      :element="element as ImageBoxElement"
                      :zoom="zoom"
                      :printMode="printMode"
                      :class="[{ selectedImagebox: isSelected(element) }]"
                      @select-single="selectedElement = element"
                      @update:size="
                        updateImageBox(selectedElement as ImageBoxElement, {
                          imageWidth: $event.width,
                          imageHeight: $event.height,
                        })
                      "
                    />
                  </template>
                </div>
              </div>
              <template v-if="score.pageSetup.showFooter">
                <div
                  v-if="shouldShowFooterForPageIndex(pageIndex)"
                  class="header-footer-hr"
                  :style="
                    getFooterHorizontalRuleStyle(
                      getFooterForPageIndex(pageIndex).height,
                    )
                  "
                ></div>
                <template
                  v-if="isRichTextBoxElement(getFooterForPageIndex(pageIndex))"
                >
                  <TextBoxRich
                    class="element-box"
                    :key="`element-${selectedWorkspace.id}-${getFooterForPageIndex(pageIndex).id}-${
                      getFooterForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="`footer-${pageIndex}`"
                    :element="
                      getFooterForPageIndex(pageIndex) as RichTextBoxElement
                    "
                    :editMode="
                      !printMode &&
                      getFooterForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :fonts="fonts"
                    :selected="
                      getFooterForPageIndex(pageIndex) ==
                      selectedHeaderFooterElement
                    "
                    :style="footerStyle"
                    @click="
                      selectedHeaderFooterElement =
                        getFooterForPageIndex(pageIndex)
                    "
                    @update="
                      updateRichTextBox(
                        getFooterForPageIndex(pageIndex) as RichTextBoxElement,
                        $event,
                      )
                    "
                    @update:height="
                      updateRichTextBoxHeight(
                        getFooterForPageIndex(pageIndex) as RichTextBoxElement,
                        $event,
                      )
                    "
                  />
                </template>
                <template
                  v-else-if="isTextBoxElement(getHeaderForPageIndex(pageIndex))"
                >
                  <TextBox
                    class="element-box"
                    :ref="`footer-${pageIndex}`"
                    :key="`element-${selectedWorkspace.id}-${getFooterForPageIndex(pageIndex).id}-${
                      getFooterForPageIndex(pageIndex).keyHelper
                    }`"
                    :element="
                      getFooterForPageIndex(pageIndex) as TextBoxElement
                    "
                    :editMode="
                      !printMode &&
                      getFooterForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :selected="
                      getFooterForPageIndex(pageIndex) ==
                      selectedHeaderFooterElement
                    "
                    :class="[
                      {
                        selectedTextbox:
                          getFooterForPageIndex(pageIndex) ==
                          selectedHeaderFooterElement,
                      },
                    ]"
                    :style="footerStyle"
                    @click="
                      selectedHeaderFooterElement =
                        getFooterForPageIndex(pageIndex)
                    "
                    @update="
                      updateTextBox(
                        getFooterForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                /></template>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
    <template v-if="selectedTextBoxElement">
      <ToolbarTextBox
        :element="selectedTextBoxElement as TextBoxElement"
        :fonts="fonts"
        :pageSetup="score.pageSetup"
        @update="updateTextBox(selectedTextBoxElement, $event)"
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as TextBoxElement,
            $event,
          )
        "
        @insert:gorthmikon="insertGorthmikon"
        @insert:pelastikon="insertPelastikon"
      />
    </template>
    <template v-if="selectedRichTextBoxElement != null">
      <ToolbarTextBoxRich
        :element="selectedRichTextBoxElement"
        :pageSetup="score.pageSetup"
        @update="updateRichTextBox(selectedRichTextBoxElement, $event)"
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as RichTextBoxElement,
            $event,
          )
        "
      />
    </template>
    <template
      v-if="selectedElement != null && isDropCapElement(selectedElement)"
    >
      <ToolbarDropCap
        :element="selectedElement as DropCapElement"
        :fonts="fonts"
        :pageSetup="score.pageSetup"
        @update="updateDropCap(selectedElement as DropCapElement, $event)"
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as DropCapElement,
            $event,
          )
        "
      />
    </template>
    <template
      v-if="selectedElement != null && isImageBoxElement(selectedElement)"
    >
      <ToolbarImageBox
        :element="selectedElement as ImageBoxElement"
        :pageSetup="score.pageSetup"
        @update="updateImageBox(selectedElement as ImageBoxElement, $event)"
      />
    </template>
    <template v-if="selectedLyrics != null">
      <ToolbarLyrics
        :element="selectedLyrics"
        :fonts="fonts"
        @update="updateNoteAndSave(selectedLyrics as NoteElement, $event)"
        @insert:specialCharacter="insertSpecialCharacter"
      />
    </template>
    <template
      v-if="selectedElement != null && isModeKeyElement(selectedElement)"
    >
      <ToolbarModeKey
        :element="selectedElement as ModeKeyElement"
        :pageSetup="score.pageSetup"
        @update="updateModeKey(selectedElement as ModeKeyElement, $event)"
        @update:tempo="
          setModeKeyTempo(selectedElement as ModeKeyElement, $event)
        "
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @open-mode-key-dialog="openModeKeyDialog"
      />
    </template>
    <template
      v-if="
        selectedElement != null &&
        selectedElementForNeumeToolbar != null &&
        isSyllableElement(selectedElementForNeumeToolbar)
      "
    >
      <ToolbarNeume
        :element="selectedElementForNeumeToolbar as NoteElement"
        :pageSetup="score.pageSetup"
        :neumeKeyboard="neumeKeyboard"
        :key="`toolbar-neume-${selectedWorkspace.id}-${selectedElement.id}-${selectedElement.keyHelper}`"
        :innerNeume="toolbarInnerNeume"
        @update="
          updateNoteAndSave(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:innerNeume="toolbarInnerNeume = $event"
        @update:accidental="
          setAccidental(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:secondaryAccidental="
          setSecondaryAccidental(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:tertiaryAccidental="
          setTertiaryAccidental(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:fthora="
          setFthoraNote(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:secondaryFthora="
          setSecondaryFthora(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:tertiaryFthora="
          setTertiaryFthora(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:gorgon="
          setGorgon(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:secondaryGorgon="
          setSecondaryGorgon(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:klasma="
          setKlasma(selectedElementForNeumeToolbar as NoteElement)
        "
        @update:time="
          setTimeNeume(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:expression="
          setVocalExpression(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:measureBar="
          setMeasureBarNote(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:measureNumber="
          setMeasureNumber(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:ison="
          setIson(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:tie="
          setTie(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @open-syllable-positioning-dialog="openSyllablePositioningDialog"
      />
    </template>
    <template
      v-if="selectedElement != null && isMartyriaElement(selectedElement)"
    >
      <ToolbarMartyria
        :element="selectedElement as MartyriaElement"
        :pageSetup="score.pageSetup"
        :neumeKeyboard="neumeKeyboard"
        @update="updateMartyria(selectedElement as MartyriaElement, $event)"
        @update:fthora="
          setFthoraMartyria(selectedElement as MartyriaElement, $event)
        "
        @update:tempoLeft="
          setMartyriaTempoLeft(selectedElement as MartyriaElement, $event)
        "
        @update:tempo="
          setMartyriaTempo(selectedElement as MartyriaElement, $event)
        "
        @update:tempoRight="
          setMartyriaTempoRight(selectedElement as MartyriaElement, $event)
        "
        @update:measureBar="
          setMeasureBarMartyria(selectedElement as MartyriaElement, $event)
        "
        @update:quantitativeNeume="
          setMartyriaQuantitativeNeume(
            selectedElement as MartyriaElement,
            $event,
          )
        "
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as MartyriaElement,
            $event,
          )
        "
      />
    </template>
    <template v-if="selectedElement != null && isTempoElement(selectedElement)">
      <ToolbarTempo
        :element="selectedElement as TempoElement"
        :pageSetup="score.pageSetup"
        @update="updateTempo(selectedElement as TempoElement, $event)"
        @update:sectionName="
          updateScoreElementSectionName(selectedElement as TempoElement, $event)
        "
      />
    </template>
    <ToolbarLyricManager
      v-if="lyricManagerIsOpen"
      :lyrics="lyrics"
      :locked="lyricsLocked"
      @update:locked="updateLyricsLocked"
      @update:lyrics="updateStaffLyrics"
      @assignAcceptsLyrics="assignAcceptsLyricsFromCurrentLyrics"
      @close="closeLyricManager"
      @click="
        selectedElement = null;
        selectedLyrics = null;
      "
    ></ToolbarLyricManager>
    <ModeKeyDialog
      v-if="modeKeyDialogIsOpen"
      :element="selectedElement as ModeKeyElement"
      :pageSetup="score.pageSetup"
      @update="
        updateModeKeyFromTemplate(selectedElement as ModeKeyElement, $event)
      "
      @update:useOptionalDiatonicFthoras="
        updatePageSetupUseOptionalDiatonicFthoras($event)
      "
      @close="closeModeKeyDialog"
    />
    <SyllablePositioningDialog
      v-if="syllablePositioningDialogIsOpen"
      :element="selectedElement as NoteElement"
      :previousElement="previousElementOnLine ?? undefined"
      :nextElement="nextElementOnLine ?? undefined"
      :pageSetup="score.pageSetup"
      @update="updateNoteAndSave(selectedElement as NoteElement, $event)"
      @close="closeSyllablePositioningDialog"
    />
    <PlaybackSettingsDialog
      v-if="playbackSettingsDialogIsOpen"
      :options="audioOptions"
      @close="closePlaybackSettingsDialog"
      @play-test-tone="playTestTone"
    />
    <EditorPreferencesDialog
      v-if="editorPreferencesDialogIsOpen"
      :options="editorPreferences"
      :pageSetup="score.pageSetup"
      @update="updateEditorPreferences"
      @close="closeEditorPreferencesDialog"
    />
    <PageSetupDialog
      v-if="pageSetupDialogIsOpen"
      :pageSetup="score.pageSetup"
      :fonts="fonts"
      @update="updatePageSetup($event)"
      @close="closePageSetupDialog"
    />
    <ExportDialog
      v-if="exportDialogIsOpen"
      :loading="exportInProgress"
      :defaultFormat="exportFormat"
      @exportAsPng="exportAsPng"
      @exportAsMusicXml="exportAsMusicXml"
      @exportAsLatex="exportAsLatex"
      @close="closeExportDialog"
    />
    <template v-if="richTextBoxCalculation">
      <TextBoxRich
        class="richTextBoxCalculation"
        v-for="element in resizableRichTextBoxElements"
        :key="element.id!"
        :element="element as RichTextBoxElement"
        :pageSetup="score.pageSetup"
        :fonts="fonts"
        :recalc="true"
        @update:height="
          updateRichTextBoxHeight(element as RichTextBoxElement, $event)
        "
      />
    </template>
    <template v-if="textBoxCalculation">
      <TextBox
        class="textBoxCalculation"
        v-for="element in resizableTextBoxElements"
        :key="element.id!"
        :element="element as TextBoxElement"
        :pageSetup="score.pageSetup"
        :fonts="fonts"
        @update:height="updateTextBoxHeight(element as TextBoxElement, $event)"
      />
    </template>
  </div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
@media print {
  body * {
    visibility: hidden;
    overflow: visible !important;
  }
}
</style>
<style scoped>
.loading-overlay {
  position: absolute;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease;
  color: white;
}

.lyrics {
  min-height: 1.6rem;
  min-width: 1rem;
  text-align: center;
  position: relative;
}

.lyrics:focus {
  outline: none;
}
.guide-line-vl {
  border-left: 1px solid black;
  position: absolute;
}

.guide-line-vr {
  border-right: 1px solid black;
  position: absolute;
}

.guide-line-ht {
  border-top: 1px solid black;
  position: absolute;
}

.guide-line-hb {
  border-bottom: 1px solid black;
  position: absolute;
}

.header-footer-hr {
  position: absolute;
  border-top-style: solid;
}

.red {
  color: #ed0000;
}

.neume-box .selected {
  background-color: rgb(238, 232, 170, 0.7);
}

.neume-box .audio-selected {
  background-color: rgba(152, 251, 152, 0.5);
}

.selectedTextbox {
  outline: 1px solid goldenrod;
}

.selectedTextbox:deep(.handle) {
  display: inline;
}

.selectedImagebox {
  border: 1px solid goldenrod;
}

.selectedAlternateLine {
  outline: 1px solid goldenrod;
}

.selectedLyrics {
  border: 1px solid goldenrod;
}

.selectedMelisma {
  display: none;
}

.richTextBoxCalculation,
.textBoxCalculation {
  position: absolute;
  left: -99999999px;
}

.line {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
}

.element-box {
  position: absolute;
}

.neume-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  position: relative;
}

.page-container {
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex: 1;
}

:deep(.vue3-tabs-chrome) {
  padding: 0;
}

:deep(.vue3-tabs-chrome .tabs-background) {
  display: none;
}

:deep(.vue3-tabs-chrome .tabs-main) {
  border-radius: 0;
  background-color: silver;
  margin: 0;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
}

:deep(.vue3-tabs-chrome .tabs-item) {
  border-right: 1px solid black;
}

:deep(.vue3-tabs-chrome .tabs-item:last-of-type) {
  border-right: none;
}

:deep(.vue3-tabs-chrome .tabs-item.active .tabs-main) {
  background-color: lightgray;
}

:deep(.vue3-tabs-chrome .tabs-item.active .tabs-close) {
  background-color: inherit;
}

:deep(.vue3-tabs-chrome .tabs-close) {
  right: 0.5rem;
}

:deep(.vue3-tabs-chrome .tabs-after) {
  height: 100%;
}

.workspace-tab-container {
  background-color: #b5b5b5;
}

.workspace-tab-new-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;

  font-size: 1.25rem;
  font-weight: bold;

  background-color: darkgray;

  border: none;

  cursor: default;
}

.page-background {
  display: flex;
  flex-direction: column;
  padding: 2rem 1rem;
  background-color: #ddd;

  overflow: auto;
  flex: 1;
}

.page {
  margin-bottom: 20px;

  margin-left: auto;
  margin-right: auto;

  background-color: white;
  overflow: clip;

  position: relative;
}

.editor {
  display: flex;
  flex-direction: column;

  flex: 1;

  height: 100%;
}

.content {
  display: flex;
  flex: 1;
  overflow: auto;
}

.left-panel {
  display: flex;
  flex-direction: column;
}

.neume-selector {
  flex: 2;
  overflow: auto;
}

.neume-combo-selector {
  flex: 1;
  overflow: auto;
}

.neume-combo-header {
  display: flex;
  justify-content: center;
  cursor: default;
  user-select: none;
  padding: 0.5rem 0.25rem;
  background-color: #eee;
}

.neume-combo-header:hover {
  background-color: #ddd;
}

.neume-combo-expand-collapse {
  margin-left: auto;
  margin-right: 0.25rem;
}

.mode-header {
  font-size: 1.75rem;
  text-align: center;
}

.lyrics-container {
  min-height: 1.6rem;
  min-width: 100%;
  text-align: center;
  position: absolute;
  white-space: nowrap;
}

.melisma {
  position: absolute;
  display: inline;
  overflow: hidden !important;
  white-space: pre;
}

.melisma-underscore {
  position: absolute;
  display: inline;
  white-space: pre;
}

.melisma.full {
  left: 0;
}

.melisma-underscore.full {
  left: 0;
}

.melisma.fullRtl {
  right: 0;
}

.melisma-hyphen {
  position: absolute;
}

.melisma-inner {
  height: 100%;
  position: relative;
  box-sizing: border-box;
}

.melisma-text {
  opacity: 0.5;
}

.page-break {
  position: absolute;
  top: calc(-10px * var(--zoom, 1));
}

.page-break img {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.line-break {
  position: absolute;
  top: calc(-10px * var(--zoom, 1));
}

.line-break img {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.page-break-2 {
  position: absolute;
  top: calc(-16px * var(--zoom, 1));
}

.page-break-2 img {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.line-break-2 {
  position: absolute;
  top: calc(-18px * var(--zoom, 1));
}

.line-break-2 img {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.section-name {
  position: absolute;
  top: calc(-20px * var(--zoom, 1));
  height: 100%;
  font-weight: bold;
}

.section-name-2 {
  position: absolute;
  font-weight: bold;
  left: calc(-22px * var(--zoom, 1));
  height: 100%;
  display: flex;
  align-items: center;
}

.print-only {
  display: none;
}

.page.print .empty-neume-box {
  visibility: hidden;
}

.page.print .text-box-container,
.page.print .rich-text-box-container,
.page.print .drop-cap-container,
.page.print .mode-key-container,
.page.print .image-box-container,
.page.print .selectedAnnotation,
.page.print .selectedAlternateLine,
.page.print :deep(.text-box),
.page.print :deep(.rich-text-editor),
.page.print :deep(.inline-container),
.page.print :deep(.text-box.multipanel) {
  border: none;
  outline: none;
}

.page.print .page-break,
.page.print .line-break,
.page.print .page-break-2,
.page.print .line-break-2,
.page.print :deep(.handle),
.page.print :deep(.ck-widget__type-around) {
  display: none !important;
}

.page.print :deep(.ck-widget) {
  outline: none !important;
}

.page.print .neume-box .selected {
  background-color: initial;
}

.page.print .melisma-text {
  opacity: 1;
}

.page.print :deep(.rich-text-editor) {
  overflow: visible !important;
}

@media print {
  .page,
  .page * {
    visibility: visible;
  }

  .page-background {
    display: block;
    padding: 0;
  }

  .page {
    width: auto;
    height: auto;
    margin-bottom: 0;
    padding: 0;
    break-after: page;
  }

  .empty-neume-box {
    visibility: hidden;
  }

  .text-box-container {
    border: none;
    outline: none;
  }

  .drop-cap-container {
    border: none;
    outline: none;
  }

  .mode-key-container {
    border: none;
    outline: none;
  }

  .image-box-container {
    border: none;
    outline: none;
  }

  .selectedLyrics {
    border: none;
    outline: none;
  }

  .melisma-text {
    opacity: 1;
  }

  .file-menu-bar,
  .left-panel,
  .workspace-tab-container,
  .lyrics-toolbar,
  .lyric-manager-toolbar,
  .main-toolbar,
  .martyria-toolbar,
  .mode-key-toolbar,
  .neume-toolbar,
  .drop-cap-toolbar,
  .tempo-toolbar,
  .text-box-toolbar,
  .image-box-toolbar,
  .search-text-container,
  .section-name,
  .section-name-2,
  .page-break,
  .line-break,
  .page-break-2,
  .line-break-2 {
    display: none !important;
  }

  .no-print {
    display: none !important;
  }

  .print-only {
    display: block;
  }
}
</style>
