<script setup lang="ts">
import 'vue3-tabs-chrome/dist/vue3-tabs-chrome.css';

import { getFontEmbedCSS, toPng } from 'html-to-image';
import i18next from 'i18next';
import { storeToRefs } from 'pinia';
import { debounce, throttle } from 'throttle-debounce';
import {
  computed,
  inject,
  nextTick,
  onBeforeMount,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  StyleValue,
  toRaw,
  useTemplateRef,
  watch,
} from 'vue';
import Vue3TabsChrome, { Tab } from 'vue3-tabs-chrome';

import AlternateLine from '@/components/AlternateLine.vue';
import Annotation from '@/components/Annotation.vue';
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
import { useAudioPlayback } from '@/composables/useAudioPlayback';
import { EventBus } from '@/eventBus';
import {
  CloseWorkspacesArgs,
  CloseWorkspacesDisposition,
  ExportWorkspaceAsImageReplyArgs,
  FileMenuInsertTextboxArgs,
  FileMenuOpenImageArgs,
  FileMenuOpenScoreArgs,
  IpcMainChannels,
  IpcRendererChannels,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import { EditorPreferences } from '@/models/EditorPreferences';
import {
  AcceptsLyricsOption,
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
  RootSign,
  TempoSign,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
import { Score } from '@/models/Score';
import { ScoreElementSelectionRange } from '@/models/ScoreElementSelectionRange';
import { Workspace, WorkspaceLocalStorage } from '@/models/Workspace';
import {
  AudioService,
  AudioServiceEventNames,
  AudioState,
} from '@/services/audio/AudioService';
import { PlaybackSequenceEvent } from '@/services/audio/PlaybackService';
import { Command, CommandFactory } from '@/services/history/CommandService';
import { ByzHtmlExporter } from '@/services/integration/ByzHtmlExporter';
import {
  LatexExporter,
  LatexExporterOptions,
} from '@/services/integration/LatexExporter';
import { MusicXmlExporter } from '@/services/integration/MusicXmlExporter';
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
import { useEditorStore } from '@/stores/useEditorStore';
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

import { Vue3TabsChromeComponent } from './Editor/Vue3TabsChromeComponent';

const ipcService = inject<IIpcService>('ipcService', new IpcService());
const platformService = inject<IPlatformService>(
  'platformService',
  new PlatformService(),
);
const audioService = inject<AudioService>('audioService', new AudioService());
const textSearchService = inject<TextSearchService>(
  'textSearchService',
  new TextSearchService(),
);
const lyricService = inject<LyricService>('lyricService', new LyricService());
const latexExporter = inject<LatexExporter>(
  'latexExporter',
  new LatexExporter(),
);
const musicXmlExporter = inject<MusicXmlExporter>(
  'musicXmlExporter',
  new MusicXmlExporter(),
);
const byzHtmlExporter = inject<ByzHtmlExporter>(
  'byzHtmlExporter',
  new ByzHtmlExporter(),
);
const neumeKeyboard = inject<NeumeKeyboard>(
  'neumeKeyboard',
  new NeumeKeyboard(),
);

const audioPlayback = useAudioPlayback();

const pageBackgroundRef = useTemplateRef('page-background');
const tabsRef = useTemplateRef<Vue3TabsChromeComponent>('tabs-ui');
const searchTextRef = useTemplateRef<SearchText>('searchText');
const lyricsRef = ref<Record<number, ContentEditable>>({});
const pagesRef = ref<Record<number, HTMLElement>>({});
const elementsRef = ref<
  Record<
    number,
    | HTMLElement
    | DropCap
    | ImageBox
    | MartyriaNeumeBox
    | ModeKey
    | TextBox
    | TextBoxRich
  >
>({});

const showFileMenuBar = isElectron();
const isDevelopment: boolean = import.meta.env.DEV;
const isBrowser: boolean = !isElectron();

let clipboard: ScoreElement[] = [];
let formatType: ElementType | null = null;
let textBoxFormat: Partial<TextBoxElement> | null = null;
let noteFormat: Partial<NoteElement> | null = null;
let richTextBoxCalculationCount = 0;
let textBoxCalculationCount = 0;

const tab = ref<string | null>(null);
const tabs = reactive([] as Tab[]);

const editor = useEditorStore();

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

// Throttled Methods
const keydownThrottleIntervalMs = 100;

const assignLyricsThrottled = throttle(keydownThrottleIntervalMs, assignLyrics);

const moveToPreviousLyricBoxThrottled = throttle(
  keydownThrottleIntervalMs,
  moveToPreviousLyricBox,
);

const moveToNextLyricBoxThrottled = throttle(
  keydownThrottleIntervalMs,
  moveToNextLyricBox,
);

const moveLeftThrottled = throttle(keydownThrottleIntervalMs, moveLeft);

const moveRightThrottled = throttle(keydownThrottleIntervalMs, moveRight);

const moveSelectionLeftThrottled = throttle(
  keydownThrottleIntervalMs,
  moveSelectionLeft,
);

const moveSelectionRightThrottled = throttle(
  keydownThrottleIntervalMs,
  moveSelectionRight,
);

const deleteSelectedElementThrottled = throttle(
  keydownThrottleIntervalMs,
  deleteSelectedElement,
);

const deletePreviousElementThrottled = throttle(
  keydownThrottleIntervalMs,
  deletePreviousElement,
);

const onFileMenuUndoThrottled = throttle(
  keydownThrottleIntervalMs,
  onFileMenuUndo,
);

const onFileMenuRedoThrottled = throttle(
  keydownThrottleIntervalMs,
  onFileMenuRedo,
);

const onCutScoreElementsThrottled = throttle(
  keydownThrottleIntervalMs,
  onCutScoreElements,
);

const onCopyScoreElementsThrottled = throttle(
  keydownThrottleIntervalMs,
  onCopyScoreElements,
);

const onFileMenuCopyAsHtmlThrottled = throttle(
  keydownThrottleIntervalMs,
  onFileMenuCopyAsHtml,
);

const onPasteScoreElementsThrottled = throttle(
  keydownThrottleIntervalMs,
  onPasteScoreElements,
);

const addQuantitativeNeumeThrottled = throttle(
  keydownThrottleIntervalMs,
  addQuantitativeNeume,
);

const addTempoThrottled = throttle(keydownThrottleIntervalMs, addTempo);

const addAutoMartyriaThrottled = throttle(
  keydownThrottleIntervalMs,
  addAutoMartyria,
);

const setKlasmaThrottled = throttle(keydownThrottleIntervalMs, setKlasma);
const setGorgonThrottled = throttle(keydownThrottleIntervalMs, setGorgon);
const setFthoraNoteThrottled = throttle(
  keydownThrottleIntervalMs,
  setFthoraNote,
);
const setFthoraMartyriaThrottled = throttle(
  keydownThrottleIntervalMs,
  setFthoraMartyria,
);
const setMartyriaTempoThrottled = throttle(
  keydownThrottleIntervalMs,
  setMartyriaTempo,
);
const setAccidentalThrottled = throttle(
  keydownThrottleIntervalMs,
  setAccidental,
);
const setTimeNeumeThrottled = throttle(keydownThrottleIntervalMs, setTimeNeume);
const setMeasureNumberThrottled = throttle(
  keydownThrottleIntervalMs,
  setMeasureNumber,
);
const setMeasureBarNoteThrottled = throttle(
  keydownThrottleIntervalMs,
  setMeasureBarNote,
);
const setMeasureBarMartyriaThrottled = throttle(
  keydownThrottleIntervalMs,
  setMeasureBarMartyria,
);
const setIsonThrottled = throttle(keydownThrottleIntervalMs, setIson);
const setTieThrottled = throttle(keydownThrottleIntervalMs, setTie);
const setVocalExpressionThrottled = throttle(
  keydownThrottleIntervalMs,
  setVocalExpression,
);

const updateMartyriaNoteThrottled = throttle(
  keydownThrottleIntervalMs,
  updateMartyriaNote,
);

const updateMartyriaScaleThrottled = throttle(
  keydownThrottleIntervalMs,
  updateMartyriaScale,
);

const updateMartyriaAutoThrottled = throttle(
  keydownThrottleIntervalMs,
  updateMartyriaAuto,
);

const updateMartyriaAlignRightThrottled = throttle(
  keydownThrottleIntervalMs,
  updateMartyriaAlignRight,
);

const updateNoteNoteIndicatorThrottled = throttle(
  keydownThrottleIntervalMs,
  updateNoteNoteIndicator,
);

const updateNoteKoronisThrottled = throttle(
  keydownThrottleIntervalMs,
  updateNoteKoronis,
);

const updateNoteVareiaThrottled = throttle(
  keydownThrottleIntervalMs,
  updateNoteVareia,
);

const onWindowResizeThrottled = throttle(250, onWindowResize);
const onScrollThrottled = throttle(250, onScroll);

const saveDebounced = debounce(250, save);

const windowTitle = computed(() => {
  return `${getFileName(editor.selectedWorkspace as Workspace)} - ${
    import.meta.env.VITE_TITLE
  }`;
});

function setSelectedWorkspace(value: Workspace) {
  // Save the scroll position
  const pageBackgroundElement = pageBackgroundRef.value as HTMLElement;
  editor.selectedWorkspace.scrollLeft = pageBackgroundElement.scrollLeft;
  editor.selectedWorkspace.scrollTop = pageBackgroundElement.scrollTop;

  editor.selectedWorkspace = value;
  editor.selectedWorkspace.commandService.notify();
  save(false);

  tab.value = value.id;

  // Scroll to the new workspace's saved scroll position
  // Use nextTick to scroll after the DOM has refreshed
  nextTick(() => {
    pageBackgroundElement.scrollTo(
      editor.selectedWorkspace.scrollLeft,
      editor.selectedWorkspace.scrollTop,
    );

    calculatePageNumber();
  });

  audioPlayback.stopAudio();
}

function setSelectedElement(element: ScoreElement | null) {
  if (element != null) {
    setSelectedLyrics(null);
    editor.setSelectionRange(null);
    setSelectedHeaderFooterElement(null);
    editor.toolbarInnerNeume = 'Primary';

    audioPlayback.onSetSelectedElement(element);
  }

  if (
    editor.selectedWorkspace.selectedAlternateLineElement != null &&
    editor.selectedWorkspace.selectedAlternateLineElement.elements.length === 0
  ) {
    removeAlternateLine(
      editor.selectedElement as NoteElement,
      editor.selectedWorkspace.selectedAlternateLineElement,
      true,
    );
  }

  editor.selectedWorkspace.selectedElement = element;
  editor.selectedWorkspace.selectedAnnotationElement = null;
  editor.selectedWorkspace.selectedAlternateLineElement = null;
}

function setSelectedLyrics(element: NoteElement | null) {
  if (element != null) {
    setSelectedElement(null);
    setSelectedHeaderFooterElement(null);
    editor.setSelectionRange(null);
  }

  editor.selectedWorkspace.selectedLyrics = element;
}

function setSelectedHeaderFooterElement(element: ScoreElement | null) {
  if (element != null) {
    setSelectedElement(null);
    editor.selectedWorkspace.selectedLyrics = null;
    editor.setSelectionRange(null);
  }

  editor.selectedWorkspace.selectedHeaderFooterElement = element;
}

function getHeaderHorizontalRuleStyle(headerHeight: number) {
  return {
    left: withZoom(editor.score.pageSetup.leftMargin),
    top: withZoom(
      editor.score.pageSetup.headerMargin +
        headerHeight +
        editor.score.pageSetup.headerHorizontalRuleMarginTop,
    ),
    color: editor.score.pageSetup.headerHorizontalRuleColor,
    borderTopWidth: withZoom(
      editor.score.pageSetup.headerHorizontalRuleThickness,
    ),
    width: withZoom(editor.score.pageSetup.innerPageWidth),
  } as StyleValue;
}

function getFooterHorizontalRuleStyle(footerHeight: number) {
  return {
    left: withZoom(editor.score.pageSetup.leftMargin),
    bottom: withZoom(
      editor.score.pageSetup.footerMargin +
        footerHeight +
        editor.score.pageSetup.footerHorizontalRuleMarginBottom,
    ),
    color: editor.score.pageSetup.footerHorizontalRuleColor,
    borderTopWidth: withZoom(
      editor.score.pageSetup.footerHorizontalRuleThickness,
    ),
    width: withZoom(editor.score.pageSetup.innerPageWidth),
  } as StyleValue;
}

const pageVisibilityIntersection = computed(() => {
  // look ahead/behind 1 page
  const margin = editor.score.pageSetup.pageHeight * editor.zoom;

  return {
    root: pageBackgroundRef.value,
    rootMargin: `${margin}px 0px ${margin}px 0px`,
  } as IntersectionObserver;
});

const { zoom, currentFilePath, hasUnsavedChanges, selectedWorkspace } =
  storeToRefs(editor);
watch(zoom, () =>
  document.documentElement.style.setProperty('--zoom', editor.zoom.toString()),
);
watch(currentFilePath, updateWindowTitle);
watch(hasUnsavedChanges, updateWindowTitle);
watch(selectedWorkspace, (value) => {
  if (value != null) {
    tab.value = value.id;
  }
});
watch(tab, (value) => {
  if (value != null && editor.selectedWorkspace.id !== value) {
    const workspace = editor.workspaces.find((x) => x.id === value);
    if (workspace) {
      setSelectedWorkspace(workspace as Workspace);
    }
  }
});

function updateWindowTitle() {
  window.document.title = windowTitle.value;
}

function getLyricStyle(element: NoteElement) {
  return {
    direction: editor.rtl ? 'rtl' : undefined,
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
      ? withZoom(editor.score.pageSetup.lyricsDefaultFontSize)
      : withZoom(element.lyricsFontSize),
    fontFamily: element.lyricsUseDefaultStyle
      ? getFontFamilyWithFallback(
          editor.score.pageSetup.lyricsDefaultFontFamily,
          editor.score.pageSetup.neumeDefaultFontFamily,
        )
      : getFontFamilyWithFallback(
          element.lyricsFontFamily,
          editor.score.pageSetup.neumeDefaultFontFamily,
        ),
    fontWeight: element.lyricsUseDefaultStyle
      ? editor.score.pageSetup.lyricsDefaultFontWeight
      : element.lyricsFontWeight,
    fontStyle: element.lyricsUseDefaultStyle
      ? editor.score.pageSetup.lyricsDefaultFontStyle
      : element.lyricsFontStyle,
    textDecoration: element.lyricsUseDefaultStyle
      ? undefined
      : element.lyricsTextDecoration,
    color: element.lyricsUseDefaultStyle
      ? editor.score.pageSetup.lyricsDefaultColor
      : element.lyricsColor,
    webkitTextStrokeWidth: element.lyricsUseDefaultStyle
      ? withZoom(editor.score.pageSetup.lyricsDefaultStrokeWidth)
      : withZoom(element.lyricsStrokeWidth),
    lineHeight: withZoom(element.lyricsFontHeight),
    left: element.alignLeft ? 0 : undefined,
    textAlign: element.alignLeft ? 'left' : undefined,
  } as StyleValue;
}

function getEmptyBoxStyle(element: EmptyElement) {
  return {
    width: withZoom(element.width),
    height: withZoom(element.height),
  } as StyleValue;
}

function getElementStyle(element: ScoreElement) {
  return {
    left: !editor.rtl ? withZoom(element.x) : undefined,
    right: editor.rtl ? withZoom(element.x) : undefined,
    top: withZoom(element.y),
  } as StyleValue;
}

function getMelismaStyle(element: NoteElement) {
  return {
    width: withZoom(element.melismaWidth),
    minHeight: element.lyricsUseDefaultStyle
      ? withZoom(editor.score.pageSetup.lyricsDefaultFontSize)
      : withZoom(element.lyricsFontSize),
  } as StyleValue;
}

function getMelismaUnderscoreStyleOuter(element: NoteElement) {
  return {
    top: withZoom(element.melismaOffsetTop),
    height: withZoom(element.lyricsFontHeight),
    width: withZoom(element.melismaWidth),
  };
}

function getMelismaUnderscoreStyleInner(element: NoteElement) {
  const thickness = editor.score.pageSetup.lyricsMelismaThickness;

  const spacing = !element.isFullMelisma
    ? editor.score.pageSetup.lyricsMelismaSpacing
    : 0;

  return {
    borderBottom: `${withZoom(thickness)} solid ${
      element.lyricsUseDefaultStyle
        ? editor.score.pageSetup.lyricsDefaultColor
        : element.lyricsColor
    }`,
    left: withZoom(spacing),
    width: `calc(100% - ${withZoom(spacing)})`,
  };
}

function getMelismaHyphenStyle(element: NoteElement, index: number) {
  return {
    left: withZoom(element.hyphenOffsets[index]),
  } as StyleValue;
}

let untitledIndex = 1;

function getTempFilename() {
  return `Untitled-${untitledIndex++}`;
}

function getFileName(workspace: Workspace, showUnsavedChanges: boolean = true) {
  const unsavedChangesMarker =
    workspace.hasUnsavedChanges && showUnsavedChanges ? '*' : '';

  if (workspace.filePath != null) {
    const fileName = getFileNameFromPath(workspace.filePath);
    return `${unsavedChangesMarker}${fileName}`;
  } else {
    return `${unsavedChangesMarker}${workspace.tempFileName}`;
  }
}

function getHeaderForPageIndex(pageIndex: number) {
  const pageNumber = pageIndex + 1;

  const header = editor.score.getHeaderForPage(pageNumber);

  // Currently, headers only support a single text box element.
  return header.elements[0] as TextBoxElement | RichTextBoxElement;
}

function getFooterForPageIndex(pageIndex: number) {
  const pageNumber = pageIndex + 1;

  const footer = editor.score.getFooterForPage(pageNumber);

  // Currently, footers only support a single text box element.
  return footer.elements[0] as TextBoxElement | RichTextBoxElement;
}

function getTokenMetadata(pageIndex: number): TokenMetadata {
  return {
    pageNumber: pageIndex + editor.score.pageSetup.firstPageNumber,
    numberOfPages:
      editor.pageCount + editor.score.pageSetup.firstPageNumber - 1,
    fileName:
      editor.selectedWorkspace.filePath != null
        ? getFileNameFromPath(editor.selectedWorkspace.filePath)
        : editor.selectedWorkspace.tempFileName,
    filePath: editor.currentFilePath || '',
  };
}

onMounted(() => {
  const savedAudioOptions = localStorage.getItem('audioOptionsDefault');

  if (savedAudioOptions != null) {
    Object.assign(editor.audioOptions, JSON.parse(savedAudioOptions));

    // -Infinity is not valid JSON, so it is serialized as null.
    // Deserialize as -Infinity
    editor.audioOptions.volumeIson =
      editor.audioOptions.volumeIson ?? -Infinity;
    editor.audioOptions.volumeMelody =
      editor.audioOptions.volumeMelody ?? -Infinity;
  }

  const savedEditorPreferences = localStorage.getItem('editorPreferences');

  if (savedEditorPreferences != null) {
    editor.editorPreferences = EditorPreferences.createFrom(
      JSON.parse(savedEditorPreferences),
    );
  }

  window.addEventListener('keydown', onKeydown);
  window.addEventListener('keyup', onKeyup);
  window.addEventListener('resize', onWindowResizeThrottled);

  EventBus.$on(IpcMainChannels.CloseWorkspaces, onCloseWorkspaces);
  EventBus.$on(IpcMainChannels.CloseApplication, onCloseApplication);

  EventBus.$on(IpcMainChannels.FileMenuNewScore, onFileMenuNewScore);
  EventBus.$on(IpcMainChannels.FileMenuOpenScore, onFileMenuOpenScore);
  EventBus.$on(IpcMainChannels.FileMenuPrint, onFileMenuPrint);
  EventBus.$on(IpcMainChannels.FileMenuSave, onFileMenuSave);
  EventBus.$on(IpcMainChannels.FileMenuSaveAs, onFileMenuSaveAs);
  EventBus.$on(IpcMainChannels.FileMenuPageSetup, onFileMenuPageSetup);
  EventBus.$on(IpcMainChannels.FileMenuExportAsPdf, onFileMenuExportAsPdf);
  EventBus.$on(IpcMainChannels.FileMenuExportAsHtml, onFileMenuExportAsHtml);
  EventBus.$on(
    IpcMainChannels.FileMenuExportAsMusicXml,
    onFileMenuExportAsMusicXml,
  );
  EventBus.$on(IpcMainChannels.FileMenuExportAsLatex, onFileMenuExportAsLatex);
  EventBus.$on(IpcMainChannels.FileMenuExportAsImage, onFileMenuExportAsImage);
  EventBus.$on(IpcMainChannels.FileMenuUndo, onFileMenuUndo);
  EventBus.$on(IpcMainChannels.FileMenuRedo, onFileMenuRedo);
  EventBus.$on(IpcMainChannels.FileMenuCut, onFileMenuCut);
  EventBus.$on(IpcMainChannels.FileMenuCopy, onFileMenuCopy);
  EventBus.$on(IpcMainChannels.FileMenuCopyAsHtml, onFileMenuCopyAsHtml);
  EventBus.$on(IpcMainChannels.FileMenuCopyFormat, onFileMenuCopyFormat);
  EventBus.$on(IpcMainChannels.FileMenuPaste, onFileMenuPaste);
  EventBus.$on(
    IpcMainChannels.FileMenuPasteWithLyrics,
    onFileMenuPasteWithLyrics,
  );
  EventBus.$on(IpcMainChannels.FileMenuPasteFormat, onFileMenuPasteFormat);
  EventBus.$on(IpcMainChannels.FileMenuFind, onFileMenuFind);
  EventBus.$on(IpcMainChannels.FileMenuLyrics, onFileMenuLyrics);
  EventBus.$on(IpcMainChannels.FileMenuPreferences, onFileMenuPreferences);
  EventBus.$on(
    IpcMainChannels.FileMenuInsertAnnotation,
    onFileMenuInsertAnnotation,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuInsertAlternateLine,
    onFileMenuInsertAlternateLine,
  );
  EventBus.$on(IpcMainChannels.FileMenuInsertTextBox, onFileMenuInsertTextBox);
  EventBus.$on(
    IpcMainChannels.FileMenuInsertRichTextBox,
    onFileMenuInsertRichTextBox,
  );
  EventBus.$on(IpcMainChannels.FileMenuInsertModeKey, onFileMenuInsertModeKey);
  EventBus.$on(
    IpcMainChannels.FileMenuInsertDropCapBefore,
    onFileMenuInsertDropCapBefore,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuInsertDropCapAfter,
    onFileMenuInsertDropCapAfter,
  );
  EventBus.$on(IpcMainChannels.FileMenuInsertImage, onFileMenuInsertImage);
  EventBus.$on(IpcMainChannels.FileMenuInsertHeader, onFileMenuInsertHeader);
  EventBus.$on(IpcMainChannels.FileMenuInsertFooter, onFileMenuInsertFooter);
  EventBus.$on(
    IpcMainChannels.FileMenuToolsCopyElementLink,
    onFileMenuToolsCopyElementLink,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuGenerateTestFile,
    onFileMenuGenerateTestFile,
  );

  EventBus.$on(AudioServiceEventNames.EventPlay, onAudioServiceEventPlay);
});

onBeforeUnmount(() => {
  // Remove the debugging variable from window
  (window as any)._editor = undefined;

  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('keyup', onKeyup);
  window.removeEventListener('resize', onWindowResizeThrottled);

  EventBus.$off(IpcMainChannels.CloseWorkspaces, onCloseWorkspaces);
  EventBus.$off(IpcMainChannels.CloseApplication, onCloseApplication);

  EventBus.$off(IpcMainChannels.FileMenuNewScore, onFileMenuNewScore);
  EventBus.$off(IpcMainChannels.FileMenuOpenScore, onFileMenuOpenScore);
  EventBus.$off(IpcMainChannels.FileMenuPrint, onFileMenuPrint);
  EventBus.$off(IpcMainChannels.FileMenuSave, onFileMenuSave);
  EventBus.$off(IpcMainChannels.FileMenuSaveAs, onFileMenuSaveAs);
  EventBus.$off(IpcMainChannels.FileMenuPageSetup, onFileMenuPageSetup);
  EventBus.$off(IpcMainChannels.FileMenuExportAsPdf, onFileMenuExportAsPdf);
  EventBus.$off(IpcMainChannels.FileMenuExportAsHtml, onFileMenuExportAsHtml);
  EventBus.$off(
    IpcMainChannels.FileMenuExportAsMusicXml,
    onFileMenuExportAsMusicXml,
  );
  EventBus.$off(IpcMainChannels.FileMenuExportAsLatex, onFileMenuExportAsLatex);
  EventBus.$off(IpcMainChannels.FileMenuExportAsImage, onFileMenuExportAsImage);
  EventBus.$off(IpcMainChannels.FileMenuUndo, onFileMenuUndo);
  EventBus.$off(IpcMainChannels.FileMenuRedo, onFileMenuRedo);
  EventBus.$off(IpcMainChannels.FileMenuCut, onFileMenuCut);
  EventBus.$off(IpcMainChannels.FileMenuCopy, onFileMenuCopy);
  EventBus.$off(IpcMainChannels.FileMenuCopyAsHtml, onFileMenuCopyAsHtml);
  EventBus.$off(IpcMainChannels.FileMenuCopyFormat, onFileMenuCopyFormat);
  EventBus.$off(IpcMainChannels.FileMenuPaste, onFileMenuPaste);
  EventBus.$off(
    IpcMainChannels.FileMenuPasteWithLyrics,
    onFileMenuPasteWithLyrics,
  );
  EventBus.$off(IpcMainChannels.FileMenuPasteFormat, onFileMenuPasteFormat);
  EventBus.$off(IpcMainChannels.FileMenuFind, onFileMenuFind);
  EventBus.$off(IpcMainChannels.FileMenuLyrics, onFileMenuLyrics);
  EventBus.$off(IpcMainChannels.FileMenuPreferences, onFileMenuPreferences);
  EventBus.$off(
    IpcMainChannels.FileMenuInsertAnnotation,
    onFileMenuInsertAnnotation,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuInsertAlternateLine,
    onFileMenuInsertAlternateLine,
  );
  EventBus.$off(IpcMainChannels.FileMenuInsertTextBox, onFileMenuInsertTextBox);
  EventBus.$off(
    IpcMainChannels.FileMenuInsertRichTextBox,
    onFileMenuInsertRichTextBox,
  );
  EventBus.$off(IpcMainChannels.FileMenuInsertModeKey, onFileMenuInsertModeKey);
  EventBus.$off(
    IpcMainChannels.FileMenuInsertDropCapBefore,
    onFileMenuInsertDropCapBefore,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuInsertDropCapAfter,
    onFileMenuInsertDropCapAfter,
  );
  EventBus.$off(IpcMainChannels.FileMenuInsertImage, onFileMenuInsertImage);
  EventBus.$off(IpcMainChannels.FileMenuInsertHeader, onFileMenuInsertHeader);
  EventBus.$off(IpcMainChannels.FileMenuInsertFooter, onFileMenuInsertFooter);
  EventBus.$off(
    IpcMainChannels.FileMenuToolsCopyElementLink,
    onFileMenuToolsCopyElementLink,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuGenerateTestFile,
    onFileMenuGenerateTestFile,
  );

  EventBus.$off(AudioServiceEventNames.EventPlay, onAudioServiceEventPlay);
});

function getElementIndex(element: ScoreElement) {
  return element.index;
}

function setSelectionRange(element: ScoreElement) {
  const elementIndex = getElementIndex(element);

  if (editor.selectedElement != null) {
    editor.setSelectionRange({
      start: editor.selectedElementIndex,
      end: elementIndex,
    });

    setSelectedElement(null);
  } else if (editor.selectionRange != null) {
    editor.selectionRange.end = elementIndex;
  }
}

function getNormalizedSelectionRange() {
  if (editor.selectionRange == null) {
    return null;
  }

  const start = Math.min(
    editor.selectionRange.start,
    editor.selectionRange.end,
  );
  const end = Math.max(editor.selectionRange.start, editor.selectionRange.end);

  return {
    start,
    end,
  } as ScoreElementSelectionRange;
}

function isSelected(element: ScoreElement) {
  if (editor.selectedElement === element) {
    return true;
  }
  if (editor.selectionRange != null) {
    const start = Math.min(
      editor.selectionRange.start,
      editor.selectionRange.end,
    );
    const end = Math.max(
      editor.selectionRange.start,
      editor.selectionRange.end,
    );

    return start <= getElementIndex(element) && getElementIndex(element) <= end;
  }

  return false;
}

function setSelectedAnnotation(
  parent: ScoreElement | null,
  annotation: AnnotationElement,
) {
  setSelectedElement(parent);
  editor.selectedWorkspace.selectedAnnotationElement = annotation;
}

function setSelectedAlternateLine(
  parent: ScoreElement | null,
  alternateLine: AlternateLineElement,
) {
  setSelectedElement(parent);
  editor.selectedWorkspace.selectedAlternateLineElement = alternateLine;
}

function isAudioSelected(element: ScoreElement) {
  return editor.audioElement === element;
}

function isMelisma(element: NoteElement) {
  return element.melismaWidth > 0;
}

function openModeKeyDialog() {
  editor.modeKeyDialogIsOpen = true;
}

function closeModeKeyDialog() {
  editor.modeKeyDialogIsOpen = false;
}

function openSyllablePositioningDialog() {
  editor.syllablePositioningDialogIsOpen = true;
}

function closeSyllablePositioningDialog() {
  editor.syllablePositioningDialogIsOpen = false;
}

function openPlaybackSettingsDialog() {
  editor.playbackSettingsDialogIsOpen = true;

  audioPlayback.stopAudio();
}

function closePlaybackSettingsDialog() {
  editor.playbackSettingsDialogIsOpen = false;

  audioPlayback.saveAudioOptions();
}

function closePageSetupDialog() {
  editor.pageSetupDialogIsOpen = false;
}

function closeExportDialog() {
  editor.exportDialogIsOpen = false;
}

function openLyricManager() {
  editor.setLyricManagerIsOpen(true);
  refreshStaffLyrics();
}

function closeLyricManager() {
  editor.setLyricManagerIsOpen(false);
}

function updateEditorPreferences(form: EditorPreferences) {
  Object.assign(editor.editorPreferences, form);

  saveEditorPreferences();

  editor.editorPreferencesDialogIsOpen = false;
}

function closeEditorPreferencesDialog() {
  editor.editorPreferencesDialogIsOpen = false;
}

function saveEditorPreferences() {
  localStorage.setItem(
    'editorPreferences',
    JSON.stringify(editor.editorPreferences),
  );
}

function isLastElement(element: ScoreElement) {
  return element.index === editor.elements.length - 1;
}

function insertPelastikon() {
  document.execCommand('insertText', false, PELASTIKON);
}

function insertGorthmikon() {
  document.execCommand('insertText', false, GORTHMIKON);
}

function insertSpecialCharacter(character: string) {
  document.execCommand('insertText', false, character);
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
      if (!isLastElement(editor.selectedElement) && !moveRight()) {
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
          setSelectedElement(switchToSyllable(editor.selectedElement, element));
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
        navigableElements.includes(editor.selectedElement.elementType)
      ) {
        setSelectedElement(switchToSyllable(editor.selectedElement, element));
      }
      break;
  }

  save();
}

function addNeumeCombination(combo: NeumeCombination) {
  const backup = clipboard.slice();
  clipboard = combo.elements;
  onPasteScoreElements(false);

  clipboard = backup;
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
      moveRight();

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
      moveRight();

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
    (elementsRef.value[element.index] as DropCap).focus();
  });
}

function onClickAddImage() {
  EventBus.$emit(IpcRendererChannels.OpenImageDialog);
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

function focusLyrics(index: number, selectAll: boolean = false) {
  lyricsRef.value[index].focus(selectAll);
}

function setLyrics(index: number, lyrics: string) {
  if (lyricsRef.value[index]) {
    lyricsRef.value[index].setInnerText(lyrics);
  }
}

function isSyllableElement(element: ScoreElement) {
  return element.elementType == ElementType.Note;
}

function isMartyriaElement(element: ScoreElement) {
  return element.elementType == ElementType.Martyria;
}

function isTempoElement(element: ScoreElement) {
  return element.elementType == ElementType.Tempo;
}

function isEmptyElement(element: ScoreElement) {
  return element.elementType == ElementType.Empty;
}

function isTextBoxElement(element: ScoreElement) {
  return element.elementType == ElementType.TextBox;
}

function isRichTextBoxElement(element: ScoreElement) {
  return element.elementType == ElementType.RichTextBox;
}

function isDropCapElement(element: ScoreElement) {
  return element.elementType == ElementType.DropCap;
}

function isModeKeyElement(element: ScoreElement) {
  return element.elementType == ElementType.ModeKey;
}

function isImageBoxElement(element: ScoreElement) {
  return element.elementType == ElementType.ImageBox;
}

function isTextInputFocused() {
  return (
    document.activeElement instanceof HTMLInputElement ||
    document.activeElement instanceof HTMLTextAreaElement ||
    (document.activeElement instanceof HTMLElement &&
      document.activeElement.isContentEditable)
  );
}

function onWindowResize() {
  if (editor.zoomToFit) {
    performZoomToFit();
  }
}

function onScroll() {
  calculatePageNumber();
}

function onKeydown(event: KeyboardEvent) {
  // Handle undo / redo
  // See https://github.com/electron/electron/issues/3682.
  if (
    (event.ctrlKey || event.metaKey) &&
    !isTextInputFocused() &&
    !editor.dialogOpen
  ) {
    if (event.code === 'KeyZ') {
      if (platformService.isMac && event.shiftKey) {
        onFileMenuRedoThrottled();
      } else {
        onFileMenuUndoThrottled();
      }
      event.preventDefault();
      return;
    } else if (event.code === 'KeyY') {
      onFileMenuRedoThrottled();
      event.preventDefault();
      return;
    } else if (event.code === 'KeyX') {
      onCutScoreElementsThrottled();
      event.preventDefault();
      return;
    } else if (event.code === 'KeyC') {
      if (event.shiftKey) {
        onFileMenuCopyAsHtmlThrottled();
      } else {
        onCopyScoreElementsThrottled();
      }
      event.preventDefault();
      return;
    } else if (event.code === 'KeyV') {
      const includeLyrics = event.shiftKey;
      onPasteScoreElementsThrottled(includeLyrics);
      event.preventDefault();
      return;
    } else if (event.code === 'KeyI' && !event.shiftKey) {
      switch (editor.entryMode) {
        case EntryMode.Auto:
          updateEntryMode(EntryMode.Insert);
          break;
        case EntryMode.Insert:
          updateEntryMode(EntryMode.Edit);
          break;
        case EntryMode.Edit:
          updateEntryMode(EntryMode.Auto);
          break;
      }
      return;
    } else if (event.code === 'KeyU' && !event.shiftKey) {
      switch (editor.entryMode) {
        case EntryMode.Auto:
          updateEntryMode(EntryMode.Edit);
          break;
        case EntryMode.Edit:
          updateEntryMode(EntryMode.Insert);
          break;
        case EntryMode.Insert:
          updateEntryMode(EntryMode.Auto);
          break;
      }
      return;
    }
  }

  if (platformService.isMac && isTextInputFocused() && !editor.dialogOpen) {
    onKeydownMac(event);
  }

  if (editor.selectedLyrics != null) {
    return onKeydownLyrics(event);
  }

  if (editor.selectedElement?.elementType === ElementType.DropCap) {
    return onKeydownDropCap(event);
  }

  if (editor.selectedElement?.elementType === ElementType.TextBox) {
    return onKeydownTextBox(event);
  }

  if (!isTextInputFocused() && !editor.dialogOpen) {
    return onKeydownNeume(event);
  }
}

function onKeydownNeume(event: KeyboardEvent) {
  let handled = false;

  if (event.shiftKey) {
    switch (event.code) {
      case 'ArrowLeft':
        moveSelectionLeftThrottled();
        handled = true;
        break;
      case 'ArrowRight':
        moveSelectionRightThrottled();
        handled = true;
        break;
    }
  } else {
    switch (event.code) {
      case 'ArrowLeft':
        if (!editor.rtl) {
          moveLeftThrottled();
        } else {
          moveRightThrottled();
        }
        handled = true;
        break;
      case 'ArrowRight':
        if (!editor.rtl) {
          moveRightThrottled();
        } else {
          moveLeftThrottled();
        }
        handled = true;
        break;
      case 'ArrowDown':
        if (
          (event.ctrlKey || event.metaKey) &&
          editor.selectedElement?.elementType === ElementType.Note
        ) {
          const index = editor.selectedElementIndex;

          focusLyrics(index, true);

          // Select All doesn't work until after the lyrics have been selected,
          // hence we call focus lyrics twice
          nextTick(() => {
            focusLyrics(index, true);
          });

          handled = true;
        }
        break;
      case 'Space':
        if (!event.repeat) {
          if (audioService.state === AudioState.Stopped || event.ctrlKey) {
            audioPlayback.playAudio();
          } else {
            audioPlayback.pauseAudio();
          }
          handled = true;
        }
        break;
      case 'Backspace':
        handled = true;
        deletePreviousElementThrottled();
        break;
      case 'Delete':
        handled = true;
        deleteSelectedElementThrottled();
        break;
    }
  }

  if (
    editor.selectedElement != null &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    if (neumeKeyboard.isModifier(event.code)) {
      editor.keyboardModifier = event.code;
      handled = true;
    }

    const quantitativeMapping = neumeKeyboard.findQuantitativeMapping(
      event,
      editor.keyboardModifier,
    );

    if (quantitativeMapping != null) {
      handled = true;

      if (quantitativeMapping.acceptsLyricsOption != null) {
        if (editor.selectedElement.elementType === ElementType.Note) {
          updateNoteAcceptsLyrics(
            editor.selectedElement as NoteElement,
            quantitativeMapping.acceptsLyricsOption,
          );
        }
      } else {
        addQuantitativeNeumeThrottled(
          quantitativeMapping.neume as QuantitativeNeume,
        );
      }
    }

    const tempoMapping = neumeKeyboard.findTempoMapping(
      event,
      editor.keyboardModifier,
    );

    if (tempoMapping != null) {
      handled = true;
      addTempoThrottled(tempoMapping.neume as TempoSign);
    }

    if (
      editor.keyboardModifier == null &&
      neumeKeyboard.isMartyria(event.code)
    ) {
      handled = true;
      addAutoMartyriaThrottled(event.shiftKey);
    }

    const martyriaConfigMapping = neumeKeyboard.findMartyriaConfigMapping(
      event,
      editor.keyboardModifier,
    );

    if (martyriaConfigMapping != null) {
      if (martyriaConfigMapping.note != null) {
        handled = true;

        addAutoMartyriaThrottled(
          martyriaConfigMapping.martyriaAlignmentToggle,
          martyriaConfigMapping.note,
        );
      }
    }

    if (
      editor.selectedElement.elementType === ElementType.Note &&
      !event.repeat
    ) {
      const noteElement = editor.selectedElement as NoteElement;

      const gorgonMapping = neumeKeyboard.findGorgonMapping(
        event,
        editor.keyboardModifier,
      );

      if (gorgonMapping != null) {
        handled = true;
        setGorgonThrottled(noteElement, gorgonMapping.neumes as GorgonNeume[]);
      }

      const vocalExpressionMapping = neumeKeyboard.findVocalExpressionMapping(
        event,
        editor.keyboardModifier,
      );

      if (vocalExpressionMapping != null) {
        handled = true;

        if (vocalExpressionMapping.neume === VocalExpressionNeume.Vareia) {
          updateNoteVareiaThrottled(noteElement, !noteElement.vareia);
        } else {
          setVocalExpressionThrottled(
            noteElement,
            vocalExpressionMapping.neume as VocalExpressionNeume,
          );
        }
      }

      const tieMapping = neumeKeyboard.findTieMapping(
        event,
        editor.keyboardModifier,
      );

      if (tieMapping != null) {
        handled = true;

        setTieThrottled(noteElement, tieMapping.neumes as Tie[]);
      }

      const fthoraMapping = neumeKeyboard.findFthoraMapping(
        event,
        editor.keyboardModifier,
      );

      if (fthoraMapping != null) {
        handled = true;
        setFthoraNoteThrottled(noteElement, fthoraMapping.neumes as Fthora[]);
      }

      const accidentalMapping = neumeKeyboard.findAccidentalMapping(
        event,
        editor.keyboardModifier,
      );

      if (accidentalMapping != null) {
        handled = true;
        setAccidentalThrottled(
          noteElement,
          accidentalMapping.neume as Accidental,
        );
      }

      const hapliMapping = neumeKeyboard.findHapliMapping(
        event,
        editor.keyboardModifier,
      );

      if (hapliMapping != null) {
        handled = true;

        if (hapliMapping.neume === TimeNeume.Koronis) {
          updateNoteKoronisThrottled(noteElement, !noteElement.koronis);
        } else {
          setTimeNeumeThrottled(noteElement, hapliMapping.neume as TimeNeume);
        }
      }

      const measureNumberMapping = neumeKeyboard.findMeasureNumberMapping(
        event,
        editor.keyboardModifier,
      );

      if (measureNumberMapping != null) {
        handled = true;
        setMeasureNumberThrottled(
          noteElement,
          measureNumberMapping.neume as MeasureNumber,
        );
      }

      const measureBarMapping = neumeKeyboard.findMeasureBarMapping(
        event,
        editor.keyboardModifier,
      );

      if (measureBarMapping != null) {
        handled = true;
        setMeasureBarNoteThrottled(
          noteElement,
          measureBarMapping.neume as MeasureBar,
        );
      }

      const isonMapping = neumeKeyboard.findIsonMapping(
        event,
        editor.keyboardModifier,
      );

      if (isonMapping != null) {
        handled = true;
        setIsonThrottled(noteElement, isonMapping.neume as Ison);
      }

      if (
        editor.keyboardModifier == null &&
        neumeKeyboard.isMartyria(event.code)
      ) {
        addAutoMartyriaThrottled();
      } else if (
        editor.keyboardModifier == null &&
        neumeKeyboard.isKlasma(event.code)
      ) {
        setKlasmaThrottled(noteElement);
      } else if (
        editor.keyboardModifier == null &&
        neumeKeyboard.isNoteIndicator(event.code)
      ) {
        updateNoteNoteIndicatorThrottled(
          noteElement,
          !noteElement.noteIndicator,
        );
      }
    } else if (
      editor.selectedElement.elementType === ElementType.Martyria &&
      !event.repeat
    ) {
      const martyriaElement = editor.selectedElement as MartyriaElement;

      const fthoraMapping = neumeKeyboard.findFthoraMapping(
        event,
        editor.keyboardModifier,
      );

      if (fthoraMapping != null) {
        handled = true;
        setFthoraMartyriaThrottled(
          martyriaElement,
          fthoraMapping.neumes![0] as Fthora,
        );
      }

      const tempoMapping = neumeKeyboard.findMartyriaTempoMapping(
        event,
        editor.keyboardModifier,
      );

      if (tempoMapping != null) {
        handled = true;
        setMartyriaTempoThrottled(
          martyriaElement,
          tempoMapping.neume as TempoSign,
        );
      }

      const measureBarMapping = neumeKeyboard.findMeasureBarMapping(
        event,
        editor.keyboardModifier,
      );

      if (measureBarMapping != null) {
        handled = true;
        setMeasureBarMartyriaThrottled(
          martyriaElement,
          measureBarMapping.neume as MeasureBar,
        );
      }

      const martyriaConfigMapping = neumeKeyboard.findMartyriaConfigMapping(
        event,
        editor.keyboardModifier,
      );

      if (martyriaConfigMapping != null) {
        handled = true;

        if (martyriaConfigMapping.note != null) {
          // This case will not currently happen
          // because no keyboard mapping exist for it
          updateMartyriaNoteThrottled(
            martyriaElement,
            martyriaConfigMapping.note,
          );
        } else if (martyriaConfigMapping.scale != null) {
          updateMartyriaScaleThrottled(
            martyriaElement,
            martyriaConfigMapping.scale,
          );
        } else if (martyriaConfigMapping.martyriaAlignmentToggle === true) {
          updateMartyriaAlignRightThrottled(
            martyriaElement,
            !martyriaElement.alignRight,
          );
        } else if (martyriaConfigMapping.martyriaAutoToggle === true) {
          updateMartyriaAutoThrottled(martyriaElement, !martyriaElement.auto);
        }
      }
    }
  }
  if (handled) {
    event.preventDefault();
  }
}

function onKeydownLyrics(event: KeyboardEvent) {
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
        if (!editor.rtl) {
          moveToNextLyricBoxThrottled();
        } else {
          moveToPreviousLyricBoxThrottled();
        }
        handled = true;
      } else if (
        !editor.rtl &&
        getCursorPosition() === getLyricLength(editor.selectedLyrics!)
      ) {
        moveToNextLyricBoxThrottled();
        handled = true;
      } else if (editor.rtl && getCursorPosition() === 0) {
        moveToPreviousLyricBoxThrottled();
        handled = true;
      }
      break;
    case 'ArrowLeft':
      if (event.shiftKey) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        if (!editor.rtl) {
          moveToPreviousLyricBoxThrottled();
        } else {
          moveToNextLyricBoxThrottled();
        }
        handled = true;
      } else if (!editor.rtl && getCursorPosition() === 0) {
        moveToPreviousLyricBoxThrottled();
        handled = true;
      } else if (
        editor.rtl &&
        getCursorPosition() === getLyricLength(editor.selectedLyrics!)
      ) {
        moveToNextLyricBoxThrottled();
        handled = true;
      }
      break;
    case 'ArrowUp':
      if (event.shiftKey) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        setSelectedElement(editor.selectedLyrics);
        blurActiveElement();
        window.getSelection()?.removeAllRanges();
        handled = true;
      }
      break;
    case 'Space':
      // Ctrl + Space should add a normal space character
      if (event.ctrlKey || event.metaKey) {
        document.execCommand('insertText', false, ' ');
      } else {
        moveToNextLyricBoxThrottled(true);
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
        (platformService.isMac && event.altKey) ||
        (!platformService.isMac && event.ctrlKey);

      if (
        !overridden &&
        getCursorPosition() === getLyricLength(editor.selectedLyrics!)
      ) {
        if (getNextLyricBoxIndex() >= 0) {
          moveToNextLyricBoxThrottled();
        } else {
          // If this is the last lyric box, blur
          // so that the melisma is registered and
          // the user doesn't accidentally type more
          // characters into box
          lyricsRef.value[editor.selectedLyrics!.index].blur();
        }
      }

      handled = true;
      break;
    }
    case 'KeyJ': {
      if (!editor.rtl) {
        return;
      }
      if (event.shiftKey) {
        document.execCommand('insertText', false, TATWEEL);
      } else {
        return;
      }

      // Ctrl key overrides the "go to next lyrics" (Alt key for mac)
      const overridden =
        (platformService.isMac && event.altKey) ||
        (!platformService.isMac && event.ctrlKey);

      if (
        !overridden &&
        getCursorPosition() === getLyricLength(editor.selectedLyrics!)
      ) {
        if (getNextLyricBoxIndex() >= 0) {
          moveToNextLyricBoxThrottled();
        } else {
          // If this is the last lyric box, blur
          // so that the melisma is registered and
          // the user doesn't accidentally type more
          // characters into box
          lyricsRef.value[editor.selectedLyrics!.index].blur();
        }
      }

      handled = true;
      break;
    }
  }

  if (handled) {
    event.preventDefault();
  }
}

function onKeydownDropCap(event: KeyboardEvent) {
  let handled = false;

  const index = editor.selectedElement!.index;
  const htmlElement = elementsRef.value[index] as DropCap;

  switch (event.code) {
    case 'Enter':
      // Do not allow enter key in drop caps
      handled = true;
      break;
    case 'Tab':
      moveRightThrottled();
      handled = true;
      break;
    case 'ArrowLeft':
      if (!editor.rtl && getCursorPosition() === 0) {
        moveLeftThrottled();
        handled = true;
      } else if (
        editor.rtl &&
        getCursorPosition() === htmlElement.textElement.getInnerText().length
      ) {
        moveRightThrottled();
        handled = true;
      }
      break;
    case 'ArrowRight':
      if (
        !editor.rtl &&
        getCursorPosition() === htmlElement.textElement.getInnerText().length
      ) {
        moveRightThrottled();
        handled = true;
      } else if (editor.rtl && getCursorPosition() === 0) {
        moveLeftThrottled();
        handled = true;
      }
      break;
  }

  if (handled) {
    event.preventDefault();
  }
}

function onKeydownTextBox(event: KeyboardEvent) {
  let handled = false;

  const index = editor.selectedElement!.index;
  const htmlElement = elementsRef.value[index] as TextBox;

  switch (event.code) {
    case 'Tab':
      moveRightThrottled();
      handled = true;
      break;
    case 'ArrowLeft':
      if (!editor.rtl && getCursorPosition() === 0) {
        moveLeftThrottled();
        handled = true;
      } else if (
        editor.rtl &&
        getCursorPosition() ===
          htmlElement.getTextElement().getInnerText().length
      ) {
        moveRightThrottled();
        handled = true;
      }
      break;
    case 'ArrowRight':
      if (
        !editor.rtl &&
        getCursorPosition() ===
          htmlElement.getTextElement().getInnerText().length
      ) {
        moveRightThrottled();
        handled = true;
      } else if (editor.rtl && getCursorPosition() === 0) {
        moveLeftThrottled();
        handled = true;
      }
      break;
  }

  if (handled) {
    event.preventDefault();
  }
}

/**
 * Handles text editing functionality for macOS
 */
function onKeydownMac(event: KeyboardEvent) {
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
      ipcService.paste();
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
}

function onKeyup(event: KeyboardEvent) {
  let handled = false;

  if (editor.keyboardModifier === event.code) {
    editor.keyboardModifier = null;
    handled = true;
  }

  if (handled) {
    event.preventDefault();
  }
}

function onCutScoreElements() {
  if (editor.selectionRange != null) {
    const start = Math.min(
      editor.selectionRange.start,
      editor.selectionRange.end,
    );

    const elementsToCut = editor.elements.filter(
      (x) => x.elementType != ElementType.Empty && isSelected(x),
    );

    clipboard = elementsToCut.map((x) => x.clone());

    editor.commandService.executeAsBatch(
      elementsToCut.map((element) =>
        scoreElementCommandFactory.create('remove-from-collection', {
          element,
          collection: editor.elements,
        }),
      ),
    );

    refreshStaffLyrics();

    setSelectedElement(
      editor.elements[Math.min(start, editor.elements.length - 1)],
    );

    save();
  } else if (
    editor.selectedElement != null &&
    editor.selectedElement.elementType !== ElementType.Empty
  ) {
    const currentIndex = editor.selectedElementIndex;

    clipboard = [editor.selectedElement.clone()];

    removeScoreElement(editor.selectedElement);

    setSelectedElement(
      editor.elements[Math.min(currentIndex, editor.elements.length - 1)],
    );

    save();
  }
}

function onCopyScoreElements() {
  if (editor.selectionRange != null) {
    clipboard = editor.elements
      .filter((x) => x.elementType != ElementType.Empty && isSelected(x))
      .map((x) => x.clone());
  } else if (
    editor.selectedElement != null &&
    editor.selectedElement.elementType !== ElementType.Empty
  ) {
    clipboard = [editor.selectedElement.clone()];
  }
}

function onPasteScoreElements(includeLyrics: boolean) {
  if (clipboard.length > 0 && editor.selectedElement != null) {
    switch (editor.entryMode) {
      case EntryMode.Insert:
        onPasteScoreElementsInsert(includeLyrics);
        break;
      case EntryMode.Auto:
        onPasteScoreElementsAuto(includeLyrics);
        break;
      case EntryMode.Edit:
        onPasteScoreElementsEdit(includeLyrics);
        break;
    }
  }
}

function onPasteScoreElementsInsert(includeLyrics: boolean) {
  if (editor.selectedElement == null || clipboard.length === 0) {
    return;
  }

  const insertAtIndex = isLastElement(editor.selectedElement)
    ? editor.selectedElementIndex
    : editor.selectedElementIndex + 1;

  const newElements = clipboard.map((x) => x.clone({ includeLyrics }));

  addScoreElements(newElements, insertAtIndex);

  setSelectedElement(newElements.at(-1)!);
  save();
}

function onPasteScoreElementsEdit(includeLyrics: boolean) {
  if (editor.selectedElement == null || clipboard.length === 0) {
    return;
  }

  const commands: Command[] = [];

  let currentIndex = editor.selectedElementIndex;

  for (const clipboardElement of clipboard) {
    const currentElement = editor.elements[currentIndex];

    if (currentIndex >= editor.elements.length - 1) {
      commands.push(
        scoreElementCommandFactory.create('add-to-collection', {
          elements: [clipboardElement.clone({ includeLyrics })],
          collection: editor.elements,
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
                (currentElement as MartyriaElement).getClipboardProperties(),
                (clipboardElement as MartyriaElement).getClipboardProperties(),
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
                (clipboardElement as DropCapElement).getClipboardProperties(),
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
                (clipboardElement as ModeKeyElement).getClipboardProperties(),
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
                (clipboardElement as TextBoxElement).getClipboardProperties(),
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
          scoreElementCommandFactory.create('replace-element-in-collection', {
            element: clipboardElement.clone(),
            collection: editor.elements,
            replaceAtIndex: currentIndex,
          }),
        );
      }
    }

    currentIndex++;
  }

  if (commands.length > 1) {
    editor.commandService.executeAsBatch(commands);
    refreshStaffLyrics();
  } else if (commands.length === 1) {
    editor.commandService.execute(commands[0]);
    refreshStaffLyrics();
  }

  save();
}

function onPasteScoreElementsAuto(includeLyrics: boolean) {
  moveRight();
  const currentIndex = editor.selectedElementIndex;

  onPasteScoreElementsEdit(includeLyrics);

  // Set the selected element to the last element that was pasted
  setSelectedElement(editor.elements[currentIndex + clipboard.length - 1]);
}

function getLyricLength(element: NoteElement) {
  return lyricsRef.value[element.index].getInnerText().length;
}

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

function moveLeft() {
  let index = -1;

  if (editor.selectedElement) {
    index = editor.selectedElement.index;
  } else if (editor.selectionRange) {
    index = editor.selectionRange.end;
  }

  const element = editor.elements[index - 1];

  if (index - 1 >= 0 && navigableElements.includes(element.elementType)) {
    // If the currently selected element is a drop cap or text box, blur it first
    if (editor.selectedElement?.elementType === ElementType.DropCap) {
      (elementsRef.value[index] as DropCap).blur();
    } else if (editor.selectedElement?.elementType === ElementType.TextBox) {
      (elementsRef.value[index] as TextBox).blur();
    }

    setSelectedElement(element);

    // If the newly selected element is a drop cap or text box, focus it
    if (element.elementType === ElementType.DropCap) {
      (elementsRef.value[index - 1] as DropCap).focus();
    } else if (element.elementType === ElementType.TextBox) {
      (elementsRef.value[index - 1] as TextBox).focus();
    }

    return true;
  }

  return false;
}

function moveRight() {
  let index = -1;

  if (editor.selectedElement) {
    index = editor.selectedElement.index;
  } else if (editor.selectionRange) {
    index = editor.selectionRange.end;
  }

  const element = editor.elements[index + 1];

  if (
    index >= 0 &&
    index + 1 < editor.elements.length &&
    navigableElements.includes(element.elementType)
  ) {
    // If the currently selected element is a drop cap, blur it first
    if (editor.selectedElement?.elementType === ElementType.DropCap) {
      (elementsRef.value[index] as DropCap).blur();
    } else if (editor.selectedElement?.elementType === ElementType.TextBox) {
      (elementsRef.value[index] as TextBox).blur();
    }

    setSelectedElement(element);

    // If the newly selected element is a drop cap, focus it
    if (element.elementType === ElementType.DropCap) {
      (elementsRef.value[index] as DropCap).focus();
    } else if (element.elementType === ElementType.TextBox) {
      (elementsRef.value[index] as TextBox).focus();
    }

    return true;
  }

  return false;
}

function moveSelectionLeft() {
  if (editor.selectionRange != null) {
    if (
      editor.selectionRange.end > 0 &&
      navigableElements.includes(
        editor.elements[editor.selectionRange.end - 1].elementType,
      )
    ) {
      setSelectionRange(editor.elements[editor.selectionRange.end - 1]);
    }
  } else if (
    editor.selectedElement != null &&
    editor.selectedElementIndex > 0 &&
    navigableElements.includes(
      editor.elements[editor.selectedElementIndex - 1].elementType,
    )
  ) {
    setSelectionRange(editor.elements[editor.selectedElementIndex - 1]);
  }
}

function moveSelectionRight() {
  if (editor.selectionRange != null) {
    if (
      editor.selectionRange.end + 1 < editor.elements.length - 1 &&
      navigableElements.includes(
        editor.elements[editor.selectionRange.end + 1].elementType,
      )
    ) {
      setSelectionRange(editor.elements[editor.selectionRange.end + 1]);
    }
  } else if (
    editor.selectedElement != null &&
    editor.selectedElementIndex + 1 < editor.elements.length - 1 &&
    navigableElements.includes(
      editor.elements[editor.selectedElementIndex + 1].elementType,
    )
  ) {
    setSelectionRange(editor.elements[editor.selectedElementIndex + 1]);
  }
}

function getNextLyricBoxIndex() {
  if (editor.selectedLyrics) {
    const currentIndex = editor.selectedLyrics.index;

    // Find the index of the next note
    for (let i = currentIndex + 1; i < editor.elements.length; i++) {
      if (editor.elements[i].elementType === ElementType.Note) {
        return i;
      }
    }
  }

  return -1;
}

function moveToNextLyricBox(clearMelisma: boolean = false) {
  const nextIndex = getNextLyricBoxIndex();

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

    const noteElement = editor.selectedLyrics!;

    const text = lyricsRef.value[noteElement.index].getInnerText();

    updateLyrics(noteElement, text, clearMelisma);

    nextTick(() => {
      focusLyrics(nextIndex, true);
    });

    return true;
  }

  return false;
}

function moveToPreviousLyricBox() {
  if (editor.selectedLyrics) {
    const currentIndex = editor.selectedLyrics.index;
    let nextIndex = -1;

    // Find the index of the previous note
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (editor.elements[i].elementType === ElementType.Note) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex >= 0) {
      focusLyrics(nextIndex, true);
      return true;
    }
  }

  return false;
}

function calculatePageNumber() {
  let maxPercentage = 0;
  let maxPercentageIndex = -1;

  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;

  for (let pageIndex = 0; pageIndex < editor.pageCount; pageIndex++) {
    const rect = pagesRef.value[pageIndex].getBoundingClientRect();

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
    editor.currentPageNumber = maxPercentageIndex + 1;
  }
}

function save(markUnsavedChanges: boolean = true) {
  if (markUnsavedChanges) {
    editor.selectedWorkspace.hasUnsavedChanges = true;
  }

  // Save the indexes of the visible pages
  const visiblePages = editor.pages
    .map((_, i) => i)
    .filter((i) => editor.pages[i].isVisible);

  const pages = LayoutService.processPages(
    toRaw(editor.selectedWorkspace) as Workspace,
  );

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
  editor.score.headersAndFooters
    .filter((x) => x.updated)
    .forEach((element) => {
      element.keyHelper++;
    });

  editor.pages = pages;

  // If using the browser, save the workspace to local storage
  if (isBrowser) {
    const workspaceLocalStorage = {
      id: editor.selectedWorkspace.id,
      score: JSON.stringify(SaveService.SaveScoreToJson(editor.score)),
      filePath: editor.currentFilePath,
      tempFileName: editor.selectedWorkspace.tempFileName,
      hasUnsavedChanges: editor.selectedWorkspace.hasUnsavedChanges,
    } as WorkspaceLocalStorage;

    localStorage.setItem(
      `workspace-${editor.selectedWorkspace.id}`,
      JSON.stringify(workspaceLocalStorage),
    );
  } else if (isDevelopment) {
    localStorage.setItem(
      'score',
      JSON.stringify(SaveService.SaveScoreToJson(editor.score)),
    );

    if (editor.currentFilePath != null) {
      localStorage.setItem('filePath', editor.currentFilePath);
    } else {
      localStorage.removeItem('filePath');
    }

    localStorage.setItem(
      'hasUnsavedChanges',
      editor.selectedWorkspace.hasUnsavedChanges.toString(),
    );
  }
}

async function load() {
  if (isBrowser) {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('workspace-')) {
        try {
          const localStorageWorkspace: WorkspaceLocalStorage = JSON.parse(
            localStorage.getItem(key)!,
          );
          const workspace = new Workspace();
          workspace.id = localStorageWorkspace.id;
          workspace.hasUnsavedChanges = localStorageWorkspace.hasUnsavedChanges;
          workspace.filePath = localStorageWorkspace.filePath;
          workspace.tempFileName = localStorageWorkspace.tempFileName;
          workspace.score = SaveService.LoadScoreFromJson(
            JSON.parse(localStorageWorkspace.score),
          );

          addWorkspace(workspace);
        } catch (error) {
          // We couldn't load this workspace for some reason. Remove it from storage.
          localStorage.removeItem(key);
          console.error(error);
        }
      }
    });

    if (editor.workspaces.length > 0) {
      setSelectedWorkspace(editor.workspaces[0] as Workspace);
      return;
    }
  }

  // First, try to load files passed in on the command line.
  // If there are none, then create a default workspace.
  const openWorkspaceResults = await ipcService.openWorkspaceFromArgv();

  if (openWorkspaceResults.silentPdf) {
    for (const file of openWorkspaceResults.files.filter((x) => x.success)) {
      openScore(file);
      await onFileMenuExportAsPdf();
      removeWorkspace(editor.selectedWorkspace as Workspace);
    }
  }

  if (openWorkspaceResults.silentHtml) {
    for (const file of openWorkspaceResults.files.filter((x) => x.success)) {
      openScore(file);
      await onFileMenuExportAsHtml();
      removeWorkspace(editor.selectedWorkspace as Workspace);
    }
  }

  if (openWorkspaceResults.silentLatex) {
    for (const file of openWorkspaceResults.files.filter((x) => x.success)) {
      const options = new LatexExporterOptions();
      options.includeModeKeys =
        openWorkspaceResults.silentLatexIncludeModeKeys ?? false;
      options.includeTextBoxes =
        openWorkspaceResults.silentLatexIncludeTextBoxes ?? false;
      openScore(file);
      await ipcService.exportWorkspaceAsLatex(
        editor.selectedWorkspace as Workspace,
        JSON.stringify(
          latexExporter.export(editor.pages, editor.score.pageSetup, options),
          null,
          2,
        ),
      );
      removeWorkspace(editor.selectedWorkspace as Workspace);
    }
  }

  if (
    openWorkspaceResults.silentPdf ||
    openWorkspaceResults.silentLatex ||
    openWorkspaceResults.silentHtml
  ) {
    await ipcService.exitApplication();
  }

  openWorkspaceResults.files
    .filter((x) => x.success)
    .forEach((x) => openScore(x));

  if (openWorkspaceResults.files.some((x) => x.success)) {
    return;
  }

  const workspace = new Workspace();
  workspace.tempFileName = getTempFilename();
  workspace.score = createDefaultScore();

  addWorkspace(workspace);

  if (isDevelopment) {
    const scoreString = localStorage.getItem('score');

    if (scoreString) {
      const score: Score = SaveService.LoadScoreFromJson(
        JSON.parse(scoreString),
      );
      editor.selectedWorkspace.filePath = localStorage.getItem('filePath');
      editor.selectedWorkspace.hasUnsavedChanges =
        localStorage.getItem('hasUnsavedChanges') === 'true';

      workspace.score = score;
    }
  }

  setSelectedWorkspace(workspace);

  setSelectedElement(
    editor.score.staff.elements[editor.score.staff.elements.length - 1],
  );

  editor.pages = LayoutService.processPages(
    editor.selectedWorkspace as Workspace,
  );
}

async function saveWorkspace(workspace: Workspace) {
  if (!editor.lyricsLocked) {
    editor.setLyrics(
      lyricService.extractLyrics(
        editor.elements,
        editor.score.pageSetup.disableGreekMelismata,
      ),
    );
  }

  return await ipcService.saveWorkspace(workspace);
}

async function saveWorkspaceAs(workspace: Workspace) {
  if (!editor.lyricsLocked) {
    editor.setLyrics(
      lyricService.extractLyrics(
        editor.elements,
        editor.score.pageSetup.disableGreekMelismata,
      ),
    );
  }

  return await ipcService.saveWorkspaceAs(workspace);
}

async function closeWorkspace(workspace: Workspace) {
  let shouldClose = true;

  if (workspace.hasUnsavedChanges) {
    const fileName =
      workspace.filePath != null
        ? getFileNameFromPath(workspace.filePath)
        : workspace.tempFileName;

    let dialogResult: ShowMessageBoxReplyArgs;

    if (ipcService.isShowMessageBoxSupported()) {
      dialogResult = await ipcService.showMessageBox({
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
          ? await saveWorkspace(workspace)
          : await saveWorkspaceAs(workspace);

      // If they successfully saved, then we can close the workspacce
      shouldClose = saveResult.success;
    } else if (dialogResult.response === 2) {
      // User chose "Cancel", so don't close the workspace.
      shouldClose = false;
    }
  }

  if (shouldClose) {
    // If using the browser, remove the item from local storage
    if (isBrowser) {
      localStorage.removeItem(`workspace-${workspace.id}`);
    }

    // If the last tab has closed, then exit
    if (editor.workspaces.length == 1) {
      await ipcService.exitApplication();
    }

    removeWorkspace(workspace);
  }

  return shouldClose;
}

async function onCloseWorkspaces(args: CloseWorkspacesArgs) {
  const workspacesToClose: Workspace[] = editor.workspaces.filter(
    (workspace) => {
      const index: number = tabs.findIndex((x) => x.key === workspace.id);

      const pivot: number = args.workspaceId
        ? tabs.findIndex((x) => x.key === args.workspaceId)
        : tabs.findIndex((x) => x.key === editor.selectedWorkspace.id);

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
          throw new Error(`Error: Unknown disposition ${args.disposition}.`);
      }
    },
  ) as Workspace[];

  for (const workspaceToClose of workspacesToClose) {
    if (!(await closeWorkspace(workspaceToClose))) {
      // The user vetoed the operation.
      break;
    }
  }
}

async function onCloseApplication() {
  // Give the user a chance to save their changes before exiting
  const unsavedWorkspaces = editor.workspaces.filter(
    (x) => x.hasUnsavedChanges,
  );

  for (const workspace of unsavedWorkspaces) {
    if (!(await closeWorkspace(workspace as Workspace))) {
      await ipcService.cancelExit();
      return false;
    }
  }

  await ipcService.exitApplication();
}

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

function setGorgon(element: NoteElement, neumes: GorgonNeume | GorgonNeume[]) {
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

function setVocalExpression(element: NoteElement, neume: VocalExpressionNeume) {
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

function updatePageVisibility(page: Page, isVisible: boolean) {
  page.isVisible = isVisible;
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
    const index = getElementIndex(element);

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

function updateNoteNoteIndicator(element: NoteElement, noteIndicator: boolean) {
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
    (note, lyrics) => setLyrics(getElementIndex(note), lyrics),
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
    (note, lyrics) => setLyrics(getElementIndex(note), lyrics),
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

function removeAlternateLine(
  note: NoteElement,
  annotation: AlternateLineElement,
  noHistory: boolean = false,
) {
  editor.commandService.execute(
    alternateLineCommandFactory.create('remove-from-collection', {
      element: annotation,
      collection: note.alternateLines,
    }),
    noHistory,
  );

  editor.selectedWorkspace.selectedAlternateLineElement = null;

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

function updateRichTextBoxHeight(element: RichTextBoxElement, height: number) {
  // The height could be updated by many rich text box elements at once
  // (e.g. if PageSetup changes) so we debounce the save.
  element.height = height;
  richTextBoxCalculationCount++;
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
  textBoxCalculationCount++;
  saveDebounced(false);
}

function updateTextBoxUseDefaultStyle(
  element: TextBoxElement,
  useDefaultStyle: boolean,
) {
  updateTextBox(element, { useDefaultStyle });
}

function updateTextBoxMultipanel(element: TextBoxElement, multipanel: boolean) {
  updateTextBox(element, { multipanel });
}

function updateTextBoxFontSize(element: TextBoxElement, fontSize: number) {
  updateTextBox(element, { fontSize });
}

function updateTextBoxFontFamily(element: TextBoxElement, fontFamily: string) {
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

function updateModeKeyTempo(element: ModeKeyElement, tempo: TempoSign | null) {
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

function updateMartyriaFthora(element: MartyriaElement, fthora: Fthora | null) {
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

function updateTempo(element: TempoElement, newValues: Partial<TempoElement>) {
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

function updateDropCapFontFamily(element: DropCapElement, fontFamily: string) {
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

function deletePreviousElement() {
  if (editor.selectedWorkspace.selectedAlternateLineElement) {
    const elements =
      editor.selectedWorkspace.selectedAlternateLineElement.elements;
    removeScoreElement(elements[editor.elements.length - 1], elements);

    return;
  }

  if (
    editor.selectedElement &&
    editor.selectedElementIndex > 0 &&
    navigableElements.includes(
      editor.elements[editor.selectedElementIndex - 1].elementType,
    )
  ) {
    removeScoreElement(editor.elements[editor.selectedElementIndex - 1]);

    save();
  }
}

function updatePageSetup(pageSetup: PageSetup) {
  const needToRecalcRichTextBoxes =
    pageSetup.textBoxDefaultFontFamily !=
      editor.score.pageSetup.textBoxDefaultFontFamily ||
    pageSetup.textBoxDefaultFontSize !=
      editor.score.pageSetup.textBoxDefaultFontSize;

  const updateCommands: Command[] = [
    pageSetupCommandFactory.create('update-properties', {
      target: editor.score.pageSetup,
      newValues: pageSetup,
    }),
  ];

  if (pageSetup.richHeaderFooter && !editor.score.pageSetup.richHeaderFooter) {
    updateCommands.push(
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.headers.default.elements,
        element: createRichHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.headers.even.elements,
        element: createRichHeaderFooter('$p', 'Title', ''),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.headers.firstPage.elements,
        element: createRichHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.headers.odd.elements,
        element: createRichHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.footers.default.elements,
        element: createRichHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.footers.even.elements,
        element: createRichHeaderFooter('$p', 'Footer', ''),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.footers.firstPage.elements,
        element: createRichHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.footers.odd.elements,
        element: createRichHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
    );
  } else if (
    !pageSetup.richHeaderFooter &&
    editor.score.pageSetup.richHeaderFooter
  ) {
    updateCommands.push(
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.headers.default.elements,
        element: createRegularHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.headers.even.elements,
        element: createRegularHeaderFooter('$p', 'Title', ''),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.headers.firstPage.elements,
        element: createRegularHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.headers.odd.elements,
        element: createRegularHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.footers.default.elements,
        element: createRegularHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.footers.even.elements,
        element: createRegularHeaderFooter('$p', 'Footer', ''),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.footers.firstPage.elements,
        element: createRegularHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: editor.score.footers.odd.elements,
        element: createRegularHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
    );
  }

  editor.commandService.executeAsBatch(updateCommands);

  if (needToRecalcRichTextBoxes) {
    recalculateRichTextBoxHeights();
    recalculateTextBoxHeights();
  }

  save();
}

function updatePageSetupUseOptionalDiatonicFthoras(
  useOptionalDiatonicFthoras: boolean,
) {
  editor.commandService.execute(
    pageSetupCommandFactory.create('update-properties', {
      target: editor.score.pageSetup,
      newValues: { useOptionalDiatonicFthoras },
    }),
  );

  save();
}

function createRegularHeaderFooter(
  left: string,
  center: string,
  right: string,
) {
  const textbox = new TextBoxElement();
  textbox.multipanel = true;
  textbox.contentLeft = left;
  textbox.contentCenter = center;
  textbox.contentRight = right;
  return textbox;
}

function createRichHeaderFooter(left: string, center: string, right: string) {
  const textbox = new RichTextBoxElement();
  textbox.multipanel = true;
  textbox.contentLeft = `${left}`;
  textbox.contentCenter = `<p style="text-align:center;">${center}</p>`;
  textbox.contentRight = `<p style="text-align:right;">${right}</p>`;
  return textbox;
}

function updateEntryMode(mode: EntryMode) {
  editor.setEntryMode(mode);
}

function updateZoom(zoom: number) {
  if (zoom < 0.5 || zoom > 5) {
    if (ipcService.isShowMessageBoxSupported()) {
      ipcService.showMessageBox({
        type: 'error',
        title: 'Range overflow',
        message: i18next.t('toolbar:main:invalidZoom'),
      });
    } else {
      alert(i18next.t('toolbar:main:invalidZoom'));
    }
  } else {
    editor.selectedWorkspace.zoom = zoom;
    editor.selectedWorkspace.zoomToFit = false;
  }
}

function updateZoomToFit(zoomToFit: boolean) {
  editor.selectedWorkspace.zoomToFit = zoomToFit;

  if (zoomToFit) {
    performZoomToFit();
  }
}

function performZoomToFit() {
  const pageBackgroundElement = pageBackgroundRef.value as HTMLElement;

  const computedStyle = getComputedStyle(pageBackgroundElement);

  const availableWidth =
    pageBackgroundElement.clientWidth -
    parseFloat(computedStyle.paddingLeft) -
    parseFloat(computedStyle.paddingRight);

  editor.selectedWorkspace.zoom =
    availableWidth / editor.score.pageSetup.pageWidth;
}

function onAudioServiceEventPlay(event: PlaybackSequenceEvent) {
  if (audioService.state === AudioState.Playing) {
    // Scroll the currently playing element into view
    const lyrics = lyricsRef.value[event.elementIndex];

    const neumeBox = elementsRef.value[event.elementIndex] as HTMLElement;

    lyrics?.$el.scrollIntoView({ block: 'nearest', inline: 'nearest' });

    neumeBox?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

function recalculateRichTextBoxHeights() {
  if (editor.richTextBoxCalculation) {
    editor.richTextBoxCalculation = false;
  }

  nextTick(async () => {
    const expectedCount = editor.resizableRichTextBoxElements.length;
    richTextBoxCalculationCount = 0;
    editor.richTextBoxCalculation = true;

    const maxTries = 4 * 30; // 30 seconds
    let tries = 1;
    let lastCount = 0;

    // Wait until all rich text boxes have updated
    const poll = (resolve: (value: unknown) => void) => {
      if (
        richTextBoxCalculationCount === expectedCount ||
        tries >= maxTries ||
        richTextBoxCalculationCount < lastCount
      ) {
        resolve(true);
      } else {
        tries++;
        lastCount = richTextBoxCalculationCount;
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
    textBoxCalculationCount = 0;
    editor.textBoxCalculation = true;

    const maxTries = 4 * 30; // 30 seconds
    let tries = 1;
    let lastCount = 0;

    // Wait until all rich text boxes have updated
    const poll = (resolve: (value: unknown) => void) => {
      if (
        textBoxCalculationCount === expectedCount ||
        tries >= maxTries ||
        textBoxCalculationCount < lastCount
      ) {
        resolve(true);
      } else {
        tries++;
        lastCount = textBoxCalculationCount;
        setTimeout(() => poll(resolve), 250);
      }
    };

    await new Promise(poll);

    editor.textBoxCalculation = false;
    saveDebounced(false);
  });
}

function onFileMenuNewScore() {
  const workspace = new Workspace();
  workspace.tempFileName = getTempFilename();
  workspace.score = createDefaultScore();

  addWorkspace(workspace);

  editor.selectedWorkspace = workspace;

  setSelectedElement(
    editor.score.staff.elements[editor.score.staff.elements.length - 1],
  );
  save(false);
}

async function onFileMenuOpenScore(args: FileMenuOpenScoreArgs) {
  if (!editor.dialogOpen && args.success) {
    openScore(args);
  }
}

function onFileMenuPageSetup() {
  editor.pageSetupDialogIsOpen = true;
}

async function onFileMenuPrint() {
  editor.printMode = true;

  // Blur the active element so that focus outlines and
  // blinking cursors don't show up in the printed page
  const activeElement = blurActiveElement();

  const previousTitle = window.document.title;
  window.document.title = getFileName(
    editor.selectedWorkspace as Workspace,
    false,
  );

  nextTick(async () => {
    await ipcService.printWorkspace(editor.selectedWorkspace as Workspace);
    editor.printMode = false;
    window.document.title = previousTitle;

    // Re-focus the active element
    focusElement(activeElement);
  });
}

async function onFileMenuExportAsPdf() {
  editor.printMode = true;

  // Blur the active element so that focus outlines and
  // blinking cursors don't show up in the printed page
  const activeElement = blurActiveElement();

  const previousTitle = window.document.title;
  window.document.title = getFileName(
    editor.selectedWorkspace as Workspace,
    false,
  );

  await nextTick();
  await ipcService.exportWorkspaceAsPdf(editor.selectedWorkspace as Workspace);
  editor.printMode = false;
  window.document.title = previousTitle;

  // Re-focus the active element
  focusElement(activeElement);
}

async function onFileMenuExportAsImage() {
  editor.exportFormat = ExportFormat.PNG;
  editor.exportDialogIsOpen = true;
}

async function exportAsPng(args: ExportAsPngSettings) {
  let reply: ExportWorkspaceAsImageReplyArgs;

  try {
    reply = await ipcService.exportWorkspaceAsImage(
      editor.selectedWorkspace as Workspace,
      'png',
    );

    if (!reply.success) {
      return;
    }
  } catch (error) {
    console.error(error);
    return;
  }

  editor.printMode = true;
  editor.exportInProgress = true;

  // Blur the active element so that focus outlines and
  // blinking cursors don't show up in the printed page
  const activeElement = blurActiveElement();

  nextTick(async () => {
    try {
      const pages = pagesRef.value as HTMLElement[];

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

            if (!(await ipcService.exportPageAsImage(fileName, data))) {
              break;
            }
          }
        }
      }

      if (args.openFolder) {
        await ipcService.showItemInFolder(
          reply.filePath.replace(/\.png$/, '-1.png'),
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      editor.printMode = false;
      editor.exportInProgress = false;
      closeExportDialog();
      // Re-focus the active element
      focusElement(activeElement);
    }
  });
}

async function onFileMenuExportAsHtml() {
  await ipcService.exportWorkspaceAsHtml(
    editor.selectedWorkspace as Workspace,
    byzHtmlExporter.exportScore(editor.score),
  );
}

function onFileMenuExportAsMusicXml() {
  editor.exportFormat = ExportFormat.MusicXml;
  editor.exportDialogIsOpen = true;
}

function onFileMenuExportAsLatex() {
  editor.exportFormat = ExportFormat.Latex;
  editor.exportDialogIsOpen = true;
}

async function exportAsMusicXml(args: ExportAsMusicXmlSettings) {
  await ipcService.exportWorkspaceAsMusicXml(
    editor.selectedWorkspace as Workspace,
    musicXmlExporter.export(editor.score, args.options),
    args.compressed,
    args.openFolder,
  );

  closeExportDialog();
}

async function exportAsLatex(args: ExportAsLatexSettings) {
  await ipcService.exportWorkspaceAsLatex(
    editor.selectedWorkspace as Workspace,
    JSON.stringify(
      latexExporter.export(editor.pages, editor.score.pageSetup, args.options),
      null,
      2,
    ),
  );

  closeExportDialog();
}

function blurActiveElement() {
  const activeElement = document.activeElement;

  if (activeElement instanceof HTMLElement) {
    activeElement.blur();
  }

  return activeElement;
}

function focusElement(element: Element | null) {
  if (element instanceof HTMLElement) {
    element.focus();
  }
}

function onFileMenuInsertAnnotation() {
  if (editor.selectedElement?.elementType === ElementType.Note) {
    const el = new AnnotationElement();
    const fontHeight = TextMeasurementService.getFontHeight(
      editor.score.pageSetup.lyricsFont,
    );
    el.x = 0;
    el.y = -fontHeight;
    (editor.selectedElement as NoteElement).annotations.push(el);
    editor.selectedWorkspace.selectedAnnotationElement = el;
    save();
  }
}

function onFileMenuInsertAlternateLine() {
  if (editor.selectedElement?.elementType === ElementType.Note) {
    const el = new AlternateLineElement();
    const fontHeight = TextMeasurementService.getFontHeight(
      editor.score.pageSetup.lyricsFont,
    );
    el.x = 0;
    el.y = -fontHeight;
    (editor.selectedElement as NoteElement).alternateLines.push(el);
    editor.selectedWorkspace.selectedAlternateLineElement = el;
    save();
  }
}

function onFileMenuInsertTextBox(args?: FileMenuInsertTextboxArgs) {
  const element = new TextBoxElement();
  element.inline = args?.inline ?? false;

  if (element.inline) {
    element.color = editor.score.pageSetup.lyricsDefaultColor;
    element.fontFamily = editor.score.pageSetup.lyricsDefaultFontFamily;
    element.fontSize = editor.score.pageSetup.lyricsDefaultFontSize;
    element.strokeWidth = editor.score.pageSetup.lyricsDefaultStrokeWidth;
    element.bold = editor.score.pageSetup.lyricsDefaultFontWeight === '700';
    element.italic = editor.score.pageSetup.lyricsDefaultFontStyle === 'italic';
  } else {
    element.color = editor.score.pageSetup.textBoxDefaultColor;
    element.fontFamily = editor.score.pageSetup.textBoxDefaultFontFamily;
    element.fontSize = editor.score.pageSetup.textBoxDefaultFontSize;
    element.strokeWidth = editor.score.pageSetup.textBoxDefaultStrokeWidth;
    element.lineHeight = editor.score.pageSetup.textBoxDefaultLineHeight;
    element.bold = editor.score.pageSetup.textBoxDefaultFontWeight === '700';
    element.italic =
      editor.score.pageSetup.textBoxDefaultFontStyle === 'italic';
  }

  addScoreElement(element, editor.selectedElementIndex);

  setSelectedElement(element);

  save();

  nextTick(() => {
    (elementsRef.value[element.index] as TextBox).focus();
  });
}

function onFileMenuInsertRichTextBox() {
  const element = new RichTextBoxElement();
  element.rtl = editor.score.pageSetup.melkiteRtl;

  addScoreElement(element, editor.selectedElementIndex);

  setSelectedElement(element);

  save();

  nextTick(() => {
    (elementsRef.value[element.index] as TextBoxRich).focus();
  });
}

function onFileMenuInsertModeKey() {
  const element = createDefaultModeKey(editor.score.pageSetup);

  addScoreElement(element, editor.selectedElementIndex);

  setSelectedElement(element);

  openModeKeyDialog();

  save();
}

function onFileMenuInsertDropCapBefore() {
  addDropCap(false);
}

function onFileMenuInsertDropCapAfter() {
  addDropCap(true);
}

function onFileMenuInsertImage(args: FileMenuOpenImageArgs) {
  const element = new ImageBoxElement();

  element.data = args.data;
  element.imageWidth = args.imageWidth;
  element.imageHeight = args.imageHeight;

  addScoreElement(element, editor.selectedElementIndex);

  setSelectedElement(element);

  save();
}

function onFileMenuInsertHeader() {
  if (editor.score.pageSetup.showHeader) {
    return;
  }

  editor.score.pageSetup.showHeader = true;

  updatePageSetup(editor.score.pageSetup);
}

function onFileMenuInsertFooter() {
  if (editor.score.pageSetup.showFooter) {
    return;
  }

  editor.score.pageSetup.showFooter = true;

  updatePageSetup(editor.score.pageSetup);
}

function onFileMenuToolsCopyElementLink() {
  if (editor.selectedElement?.id != null) {
    navigator.clipboard.writeText(
      '#element-' + editor.selectedElement.id.toString(),
    );
  }
}

async function onFileMenuSave() {
  const workspace = editor.selectedWorkspace;

  if (workspace.filePath != null) {
    const result = await saveWorkspace(workspace as Workspace);
    if (result.success) {
      workspace.hasUnsavedChanges = false;
    }
  } else {
    const result = await saveWorkspaceAs(workspace as Workspace);
    if (result.success) {
      workspace.filePath = result.filePath;
      workspace.hasUnsavedChanges = false;
    }
  }
}

async function onFileMenuSaveAs() {
  const workspace = editor.selectedWorkspace;

  const result = await saveWorkspaceAs(workspace as Workspace);
  if (result.success) {
    workspace.filePath = result.filePath;
    workspace.hasUnsavedChanges = false;
  }
}

function onFileMenuUndo() {
  const currentIndex = editor.selectedElementIndex;

  const textBoxDefaultFontFamilyPrevious =
    editor.score.pageSetup.textBoxDefaultFontFamily;
  const textBoxDefaultFontSizePrevious =
    editor.score.pageSetup.textBoxDefaultFontSize;

  editor.commandService.undo();

  // TODO this may be overkill, but the alternative is putting in place
  // an event system to only refresh on certain undo actions
  refreshStaffLyrics();

  if (currentIndex > -1) {
    // If the selected element was removed during the undo process, choose a new one
    const clampedIndex = Math.min(currentIndex, editor.elements.length - 1);

    if (editor.selectedElement !== editor.elements[clampedIndex]) {
      setSelectedElement(editor.elements[clampedIndex]);
    }

    // Undo/redo could affect the note display in the neume toolbar (among other things),
    // so we force a refresh here
    editor.elements[clampedIndex].keyHelper++;
  }

  if (
    textBoxDefaultFontFamilyPrevious !=
      editor.score.pageSetup.textBoxDefaultFontFamily ||
    textBoxDefaultFontSizePrevious !=
      editor.score.pageSetup.textBoxDefaultFontSize
  ) {
    recalculateRichTextBoxHeights();
    recalculateTextBoxHeights();
  }

  save();
}

function onFileMenuRedo() {
  const currentIndex = editor.selectedElementIndex;

  const textBoxDefaultFontFamilyPrevious =
    editor.score.pageSetup.textBoxDefaultFontFamily;
  const textBoxDefaultFontSizePrevious =
    editor.score.pageSetup.textBoxDefaultFontSize;

  editor.commandService.redo();

  // TODO this may be overkill, but the alternative is putting in place
  // an event system to only refresh on certain undo actions
  refreshStaffLyrics();

  if (currentIndex > -1) {
    // If the selected element was removed during the redo process, choose a new one
    const clampedIndex = Math.min(currentIndex, editor.elements.length - 1);

    if (editor.selectedElement !== editor.elements[clampedIndex]) {
      setSelectedElement(editor.elements[clampedIndex]);
    }

    // Undo/redo could affect the note display in the neume toolbar (among other things),
    // so we force a refresh here
    editor.elements[clampedIndex].keyHelper++;
  }

  if (
    textBoxDefaultFontFamilyPrevious !=
      editor.score.pageSetup.textBoxDefaultFontFamily ||
    textBoxDefaultFontSizePrevious !=
      editor.score.pageSetup.textBoxDefaultFontSize
  ) {
    recalculateRichTextBoxHeights();
    recalculateTextBoxHeights();
  }

  save();
}

function onFileMenuCut() {
  if (!isTextInputFocused() && !editor.dialogOpen) {
    onCutScoreElements();
  } else {
    document.execCommand('cut');
  }
}

function onFileMenuCopy() {
  if (!isTextInputFocused() && !editor.dialogOpen) {
    onCopyScoreElements();
  } else {
    document.execCommand('copy');
  }
}

function onFileMenuCopyFormat() {
  if (editor.selectedElement == null) {
    return;
  }

  if (editor.selectedElement.elementType === ElementType.TextBox) {
    formatType = ElementType.TextBox;
    textBoxFormat = (editor.selectedElement as TextBoxElement).cloneFormat();
  } else if (editor.selectedElement.elementType === ElementType.Note) {
    formatType = ElementType.Note;
    noteFormat = (editor.selectedElement as NoteElement).cloneFormat();
  }
}

function onFileMenuCopyAsHtml() {
  let elements: ScoreElement[] = [];

  if (editor.selectionRange != null) {
    elements = editor.elements.filter(
      (x) => x.elementType != ElementType.Empty && isSelected(x),
    );
  } else if (editor.selectedElement != null) {
    elements = [editor.selectedElement];
  } else if (editor.selectedLyrics != null) {
    elements = [editor.selectedLyrics];
  }

  const html = byzHtmlExporter.exportElements(
    elements,
    editor.score.pageSetup,
    0,
    true,
  );

  navigator.clipboard.writeText(html);
}

function onFileMenuPaste() {
  if (!isTextInputFocused() && !editor.dialogOpen) {
    onPasteScoreElements(false);
  } else {
    ipcService.paste();
  }
}

function onFileMenuPasteWithLyrics() {
  if (!isTextInputFocused() && !editor.dialogOpen) {
    onPasteScoreElements(true);
  } else {
    ipcService.paste();
  }
}

function onFileMenuPasteFormat() {
  const normalizedRange = getNormalizedSelectionRange();

  const commands: Command[] = [];

  if (normalizedRange != null) {
    for (let i = normalizedRange.start; i <= normalizedRange.end; i++) {
      if (editor.elements[i].elementType === formatType) {
        applyCopiedFormat(editor.elements[i], commands);
      }
    }
  } else if (editor.selectedElement != null) {
    applyCopiedFormat(editor.selectedElement, commands);
  }

  if (commands.length > 0) {
    editor.commandService.executeAsBatch(commands);
    save();
  }
}

function applyCopiedFormat(element: ScoreElement, commands: Command[]) {
  if (element.elementType === ElementType.TextBox && textBoxFormat != null) {
    commands.push(
      textBoxCommandFactory.create('update-properties', {
        target: element as TextBoxElement,
        newValues: textBoxFormat,
      }),
    );
  } else if (element.elementType === ElementType.Note && noteFormat != null) {
    commands.push(
      noteElementCommandFactory.create('update-properties', {
        target: element as NoteElement,
        newValues: noteFormat,
      }),
    );
  }
}

function onFileMenuFind() {
  if (editor.searchTextPanelIsOpen) {
    searchTextRef.value?.focus();
  } else {
    editor.searchTextPanelIsOpen = true;
  }
}

function onFileMenuLyrics() {
  if (!editor.dialogOpen) {
    if (editor.lyricManagerIsOpen) {
      closeLyricManager();
    } else {
      openLyricManager();
    }
  }
}

function onFileMenuPreferences() {
  if (!editor.dialogOpen) {
    editor.editorPreferencesDialogIsOpen = true;
  }
}

function onFileMenuGenerateTestFile(testFileType: TestFileType) {
  const workspace = new Workspace();
  workspace.tempFileName = getTempFilename();
  workspace.score = new Score();

  // The ison test page can be used to inspect the ison alignment
  // provided by the font, so we disable the automatic ison alignment
  if (testFileType === TestFileType.Ison) {
    workspace.score.pageSetup.alignIsonIndicators = false;
  }

  addWorkspace(workspace);

  editor.selectedWorkspace = workspace;

  editor.selectedWorkspace.filePath = null;
  editor.score.staff.elements.unshift(
    ...(TestFileGenerator.generateTestFile(testFileType, editor.fonts) || []),
  );
  save();
}

function onSearchText(args: { query: string; reverse?: boolean }) {
  const result = textSearchService.findTextInElements(
    args.query,
    editor.elements,
    editor.selectedElementIndex,
    args.reverse ?? false,
  );

  if (result != null) {
    setSelectedElement(result);

    pagesRef.value[result.page - 1].scrollIntoView();

    editor.pages[result.page - 1].isVisible = true;

    nextTick(() => {
      if (editor.selectedElement?.elementType === ElementType.Note) {
        (
          elementsRef.value[editor.selectedElementIndex] as HTMLElement
        ).scrollIntoView();
      } else if (editor.selectedElement?.elementType === ElementType.DropCap) {
        (
          elementsRef.value[editor.selectedElementIndex] as DropCap
        ).$el.scrollIntoView();
      } else if (editor.selectedElement?.elementType === ElementType.TextBox) {
        (
          elementsRef.value[editor.selectedElementIndex] as TextBox
        ).$el.scrollIntoView();
      }
    });
  }
}

function createDefaultModeKey(pageSetup: PageSetup) {
  const defaultTemplate = ModeKeyElement.createFromTemplate(
    modeKeyTemplates[0],
    editor.score.pageSetup.useOptionalDiatonicFthoras,
  );

  defaultTemplate.color = pageSetup.modeKeyDefaultColor;
  defaultTemplate.fontSize = pageSetup.modeKeyDefaultFontSize;
  defaultTemplate.strokeWidth = pageSetup.modeKeyDefaultStrokeWidth;

  return defaultTemplate;
}

function createDefaultScore() {
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
  score.staff.elements.unshift(title, createDefaultModeKey(score.pageSetup));

  for (const element of score.headersAndFooters) {
    if (element.elementType === ElementType.TextBox) {
      (element as TextBoxElement).fontFamily =
        score.pageSetup.lyricsDefaultFontFamily;
      (element as TextBoxElement).strokeWidth =
        score.pageSetup.lyricsDefaultStrokeWidth;
    }
  }

  return score;
}

function openScore(args: FileMenuOpenScoreArgs) {
  if (!args.success) {
    return;
  }

  // First make sure we don't already have the score open
  const existingWorkspace = editor.workspaces.find(
    (x) => x.filePath === args.filePath,
  );
  if (existingWorkspace != null) {
    editor.selectedWorkspace = existingWorkspace;
    return;
  }

  try {
    const score: Score = SaveService.LoadScoreFromJson(JSON.parse(args.data));

    // if (score.version !== ScoreVersion) {
    //   alert('This score was created by an older version of the application. It may not work properly');
    // }

    const workspace = new Workspace();
    workspace.filePath = args.filePath;
    workspace.tempFileName = getTempFilename();
    workspace.score = score;

    addWorkspace(workspace);

    editor.selectedWorkspace = workspace;

    setSelectedElement(null);

    save(false);
  } catch (error) {
    args.success = false;
    console.error(error);

    if (error instanceof Error) {
      if (ipcService.isShowMessageBoxSupported()) {
        ipcService.showMessageBox({
          type: 'error',
          title: 'Open failed',
          message: error.message,
        });
      } else {
        alert(error.message);
      }
    }
  }
}

function addWorkspace(workspace: Workspace) {
  editor.workspaces.push(workspace);

  tabsRef.value?.addTab({
    label: getFileName(workspace),
    key: workspace.id,
  });
}

function removeWorkspace(workspace: Workspace) {
  const index = editor.workspaces.indexOf(workspace);

  editor.workspaces.splice(index, 1);

  tabsRef.value?.removeTab(workspace.id);

  if (editor.selectedWorkspace === workspace) {
    if (editor.workspaces.length > 0) {
      editor.selectedWorkspace =
        editor.workspaces[Math.min(index, editor.workspaces.length - 1)];
    } else {
      // TODO support closing all workspaces
      onFileMenuNewScore();
    }
  }
}

function onTabClosed(tab: Tab) {
  const workspace = editor.workspaces.find((x) => x.id === tab.key);

  if (workspace) {
    // If the workspace is still in our list, then call closeWorkspace.
    // closeWorkspace will decide whether to remove the tab and will
    // explicitly call removeTab. Returning false tells the tab component
    // to not close the tab, so that we can take care of it manually.
    closeWorkspace(workspace as Workspace);
    return false;
  } else {
    // If we got here, the workspace was already removed by closeWorkspace.
    // We allow the tab component to close the tab by returning true.
    return true;
  }
}

function openContextMenuForTab(event: PointerEvent, tab: Tab) {
  // TODO for browser version, show a custom (non-native) context menu.
  if (!isBrowser) {
    ipcService.openContextMenuForTab({ workspaceId: tab.key });
  }
}

function renderTabLabel(tab: Tab) {
  const workspace = editor.workspaces.find((x) => x.id === tab.key);

  return workspace ? getFileName(workspace as Workspace) : '';
}

onBeforeMount(async () => {
  // Attach the editor component to the window variable
  // so that it can be used for debugging
  (window as any)._editor = editor;

  try {
    const fontLoader = (document as any).fonts;

    const loadSystemFontsPromise = ipcService
      .getSystemFonts()
      .then((fonts) => (editor.fonts = fonts));

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

    await load();
  } catch (error) {
    console.error(error);
  } finally {
    editor.isLoading = false;
  }
});

const {
  audioOptions,
  currentPageNumber,
  editorPreferencesDialogIsOpen,
  editorPreferences,
  entryMode,
  exportDialogIsOpen,
  exportFormat,
  exportInProgress,
  filteredPages,
  fonts,
  footerStyle,
  guideStyleBottom,
  guideStyleLeft,
  guideStyleRight,
  guideStyleTop,
  headerStyle,
  isLoading,
  lyricManagerIsOpen,
  lyrics,
  lyricsLocked,
  modeKeyDialogIsOpen,
  neumeComboPanelIsExpanded,
  nextElementOnLine,
  pageCount,
  previousElementOnLine,
  pageStyle,
  pageSetupDialogIsOpen,
  playbackSettingsDialogIsOpen,
  printMode,
  resizableRichTextBoxElements,
  resizableTextBoxElements,
  richTextBoxCalculation,
  rtl,
  searchTextQuery,
  score,
  searchTextPanelIsOpen,
  selectedElement,
  selectedElementForNeumeToolbar,
  selectedHeaderFooterElement,
  selectedLyrics,
  selectedRichTextBoxElement,
  selectedTextBoxElement,
  showGuides,
  syllablePositioningDialogIsOpen,
  textBoxCalculation,
  toolbarInnerNeume,
  zoomToFit,
} = storeToRefs(editor);
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
      @update:audioOptionsSpeed="audioPlayback.updateAudioOptionsSpeed"
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
      @click="setSelectedLyrics(null)"
      @play-audio="audioPlayback.playAudio"
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
        <Vue3TabsChrome
          class="workspace-tab-container"
          ref="tabs-ui"
          :tabs="tabs"
          v-model="tab"
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
          @scroll="onScrollThrottled"
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
            :ref="(el: HTMLElement) => (pagesRef[pageIndex] = el)"
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
                    :key="`element-${editor.selectedWorkspace.id}-${getHeaderForPageIndex(pageIndex).id}-${
                      getHeaderForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="`header-${pageIndex}`"
                    :element="getHeaderForPageIndex(pageIndex)"
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
                      setSelectedHeaderFooterElement(
                        getHeaderForPageIndex(pageIndex),
                      )
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
                    :key="`element-${editor.selectedWorkspace.id}-${getHeaderForPageIndex(pageIndex).id}-${
                      getHeaderForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="`header-${pageIndex}`"
                    :element="getHeaderForPageIndex(pageIndex)"
                    :editMode="
                      !printMode &&
                      getHeaderForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :class="[
                      {
                        selectedTextbox:
                          getHeaderForPageIndex(pageIndex) ==
                          selectedHeaderFooterElement,
                      },
                    ]"
                    :style="headerStyle"
                    @click="
                      setSelectedHeaderFooterElement(
                        getHeaderForPageIndex(pageIndex),
                      )
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
                  v-if="score.pageSetup.showHeaderHorizontalRule"
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
                  :key="`element-${editor.selectedWorkspace.id}-${element.id}-${element.keyHelper}`"
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
                            editor.selectedWorkspace
                              .selectedAlternateLineElement === alternateLine,
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
                          editor.selectedWorkspace.selectedAnnotationElement ===
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
                        :note="element"
                        :pageSetup="score.pageSetup"
                        :class="[
                          {
                            selected: isSelected(element),
                            'audio-selected': isAudioSelected(element),
                          },
                        ]"
                        @select-single="setSelectedElement(element)"
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
                          :ref="
                            (el: ContentEditable) =>
                              (lyricsRef[getElementIndex(element)] = el)
                          "
                          @click="focusLyrics(getElementIndex(element))"
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
                            @click="focusLyrics(getElementIndex(element))"
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
                        :ref="
                          (el: MartyriaNeumeBox) =>
                            (elementsRef[getElementIndex(element)] = el)
                        "
                        class="marytria-neume-box"
                        :neume="element"
                        :pageSetup="score.pageSetup"
                        :class="[
                          {
                            selected: isSelected(element),
                          },
                        ]"
                        @select-single="setSelectedElement(element)"
                        @select-range="setSelectionRange(element)"
                      />
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isTempoElement(element)">
                    <div
                      :ref="
                        (el) => (elementsRef[getElementIndex(element)] = el)
                      "
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
                        :neume="element"
                        :pageSetup="score.pageSetup"
                        :class="[{ selected: isSelected(element) }]"
                        @select-single="setSelectedElement(element)"
                        @select-range="setSelectionRange(element)"
                      />
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isEmptyElement(element)">
                    <div
                      :ref="
                        (el: any) =>
                          (elementsRef[getElementIndex(element)] = el)
                      "
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
                        @select-single="setSelectedElement(element)"
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
                      :ref="
                        (el: TextBox) =>
                          (elementsRef[getElementIndex(element)] = el)
                      "
                      :element="element"
                      :editMode="true"
                      :metadata="getTokenMetadata(pageIndex)"
                      :pageSetup="score.pageSetup"
                      :selected="isSelected(element)"
                      @select-single="setSelectedElement(element)"
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
                      :ref="
                        (el: TextBoxRich) =>
                          (elementsRef[getElementIndex(element)] = el)
                      "
                      :element="element"
                      :pageSetup="score.pageSetup"
                      :fonts="fonts"
                      :selected="isSelected(element)"
                      @select-single="setSelectedElement(element)"
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
                      :ref="
                        (el: ModeKey) =>
                          (elementsRef[getElementIndex(element)] = el)
                      "
                      :element="element"
                      :pageSetup="score.pageSetup"
                      :class="[
                        {
                          selectedTextbox: isSelected(element),
                        },
                      ]"
                      @select-single="setSelectedElement(element)"
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
                      :ref="
                        (el: DropCap) =>
                          (elementsRef[getElementIndex(element)] = el)
                      "
                      :element="element"
                      :pageSetup="score.pageSetup"
                      :editable="!lyricsLocked"
                      :class="[
                        {
                          selectedTextbox: isSelected(element),
                        },
                      ]"
                      @select-single="setSelectedElement(element)"
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
                      :ref="
                        (el: ImageBox) =>
                          (elementsRef[getElementIndex(element)] = el)
                      "
                      :element="element"
                      :zoom="zoom"
                      :printMode="printMode"
                      :class="[{ selectedImagebox: isSelected(element) }]"
                      @select-single="setSelectedElement(element)"
                      @update:size="
                        updateImageBoxSize(
                          selectedElement as ImageBoxElement,
                          $event.width,
                          $event.height,
                        )
                      "
                    />
                  </template>
                </div>
              </div>
              <template v-if="score.pageSetup.showFooter">
                <div
                  v-if="score.pageSetup.showFooterHorizontalRule"
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
                    :key="`element-${editor.selectedWorkspace.id}-${getFooterForPageIndex(pageIndex).id}-${
                      getFooterForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="`footer-${pageIndex}`"
                    :element="getFooterForPageIndex(pageIndex)"
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
                      setSelectedHeaderFooterElement(
                        getFooterForPageIndex(pageIndex),
                      )
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
                    :key="`element-${editor.selectedWorkspace.id}-${getFooterForPageIndex(pageIndex).id}-${
                      getFooterForPageIndex(pageIndex).keyHelper
                    }`"
                    :element="getFooterForPageIndex(pageIndex)"
                    :editMode="
                      !printMode &&
                      getFooterForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :class="[
                      {
                        selectedTextbox:
                          getFooterForPageIndex(pageIndex) ==
                          selectedHeaderFooterElement,
                      },
                    ]"
                    :style="footerStyle"
                    @click="
                      setSelectedHeaderFooterElement(
                        getFooterForPageIndex(pageIndex),
                      )
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
        :element="selectedTextBoxElement"
        :fonts="fonts"
        :pageSetup="score.pageSetup"
        @update:multipanel="
          updateTextBoxMultipanel(selectedTextBoxElement, $event)
        "
        @update:useDefaultStyle="
          updateTextBoxUseDefaultStyle(selectedTextBoxElement, $event)
        "
        @update:fontSize="updateTextBoxFontSize(selectedTextBoxElement, $event)"
        @update:fontFamily="
          updateTextBoxFontFamily(selectedTextBoxElement, $event)
        "
        @update:strokeWidth="
          updateTextBoxStrokeWidth(selectedTextBoxElement, $event)
        "
        @update:alignment="
          updateTextBoxAlignment(selectedTextBoxElement, $event)
        "
        @update:color="updateTextBoxColor(selectedTextBoxElement, $event)"
        @update:inline="updateTextBoxInline(selectedTextBoxElement, $event)"
        @update:bold="updateTextBoxBold(selectedTextBoxElement, $event)"
        @update:italic="updateTextBoxItalic(selectedTextBoxElement, $event)"
        @update:underline="
          updateTextBoxUnderline(selectedTextBoxElement, $event)
        "
        @update:lineHeight="
          updateTextBoxLineHeight(selectedTextBoxElement, $event)
        "
        @update:customWidth="updateTextBoxWidth(selectedTextBoxElement, $event)"
        @update:fillWidth="
          updateTextBoxFillWidth(selectedTextBoxElement, $event)
        "
        @update:customHeight="
          updateTextBoxCustomHeight(selectedTextBoxElement, $event)
        "
        @update:marginTop="
          updateTextBoxMarginTop(selectedTextBoxElement, $event)
        "
        @update:marginBottom="
          updateTextBoxMarginBottom(selectedTextBoxElement, $event)
        "
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
        @update:inline="
          updateRichTextBox(selectedRichTextBoxElement, { inline: $event })
        "
        @update:customWidth="
          updateRichTextBox(selectedRichTextBoxElement, { customWidth: $event })
        "
        @update:offsetYTop="
          updateRichTextBox(selectedRichTextBoxElement, { offsetYTop: $event })
        "
        @update:offsetYBottom="
          updateRichTextBox(selectedRichTextBoxElement, {
            offsetYBottom: $event,
          })
        "
        @update:rtl="
          updateRichTextBox(selectedRichTextBoxElement, { rtl: $event })
        "
        @update:centerOnPage="
          updateRichTextBox(selectedRichTextBoxElement, {
            centerOnPage: $event,
          })
        "
        @update:modeChange="
          updateRichTextBox(selectedRichTextBoxElement, { modeChange: $event })
        "
        @update:modeChangePhysicalNote="
          updateRichTextBox(selectedRichTextBoxElement, {
            modeChangePhysicalNote: $event,
          })
        "
        @update:modeChangeScale="
          updateRichTextBox(selectedRichTextBoxElement, {
            modeChangeScale: $event,
          })
        "
        @update:modeChangeVirtualNote="
          updateRichTextBox(selectedRichTextBoxElement, {
            modeChangeVirtualNote: $event,
          })
        "
        @update:modeChangeIgnoreAttractions="
          updateRichTextBox(selectedRichTextBoxElement, {
            modeChangeIgnoreAttractions: $event,
          })
        "
        @update:modeChangePermanentEnharmonicZo="
          updateRichTextBox(selectedRichTextBoxElement, {
            modeChangePermanentEnharmonicZo: $event,
          })
        "
        @update:modeChangeBpm="
          updateRichTextBox(selectedRichTextBoxElement, {
            modeChangeBpm: $event,
          })
        "
        @update:marginTop="
          updateRichTextBoxMarginTop(selectedRichTextBoxElement, $event)
        "
        @update:marginBottom="
          updateRichTextBoxMarginBottom(selectedRichTextBoxElement, $event)
        "
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
        :element="selectedElement"
        :fonts="fonts"
        :pageSetup="score.pageSetup"
        @update:useDefaultStyle="
          updateDropCapUseDefaultStyle(
            selectedElement as DropCapElement,
            $event,
          )
        "
        @update:fontSize="
          updateDropCapFontSize(selectedElement as DropCapElement, $event)
        "
        @update:fontFamily="
          updateDropCapFontFamily(selectedElement as DropCapElement, $event)
        "
        @update:strokeWidth="
          updateDropCapStrokeWidth(selectedElement as DropCapElement, $event)
        "
        @update:color="
          updateDropCapColor(selectedElement as DropCapElement, $event)
        "
        @update:bold="
          updateDropCapFontWeight(selectedElement as DropCapElement, $event)
        "
        @update:italic="
          updateDropCapFontStyle(selectedElement as DropCapElement, $event)
        "
        @update:lineHeight="
          updateDropCapLineHeight(selectedElement as DropCapElement, $event)
        "
        @update:customWidth="
          updateDropCapWidth(selectedElement as DropCapElement, $event)
        "
        @update:lineSpan="
          updateDropCapLineSpan(selectedElement as DropCapElement, $event)
        "
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
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:alignment="
          updateImageBoxAlignment(selectedElement as ImageBoxElement, $event)
        "
        @update:inline="
          updateImageBoxInline(selectedElement as ImageBoxElement, $event)
        "
        @update:lockAspectRatio="
          updateImageBoxLockAspectRatio(
            selectedElement as ImageBoxElement,
            $event,
          )
        "
        @update:size="
          updateImageBoxSize(
            selectedElement as ImageBoxElement,
            $event.width,
            $event.height,
          )
        "
      />
    </template>
    <template v-if="selectedLyrics != null">
      <ToolbarLyrics
        :element="selectedLyrics"
        :fonts="fonts"
        @update:lyricsColor="
          updateNoteLyricsColor(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsFontFamily="
          updateNoteLyricsFontFamily(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsFontSize="
          updateNoteLyricsFontSize(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsFontStyle="
          updateNoteLyricsFontStyle(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsFontWeight="
          updateNoteLyricsFontWeight(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsTextDecoration="
          updateNoteLyricsTextDecoration(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsStrokeWidth="
          updateNoteLyricsStrokeWidth(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsUseDefaultStyle="
          updateNoteLyricsUseDefaultStyle(selectedLyrics as NoteElement, $event)
        "
        @insert:specialCharacter="insertSpecialCharacter"
      />
    </template>
    <template
      v-if="selectedElement != null && isModeKeyElement(selectedElement)"
    >
      <ToolbarModeKey
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:useDefaultStyle="
          updateModeKeyUseDefaultStyle(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @update:fontSize="
          updateModeKeyFontSize(selectedElement as ModeKeyElement, $event)
        "
        @update:strokeWidth="
          updateModeKeyStrokeWidth(selectedElement as ModeKeyElement, $event)
        "
        @update:alignment="
          updateModeKeyAlignment(selectedElement as ModeKeyElement, $event)
        "
        @update:color="
          updateModeKeyColor(selectedElement as ModeKeyElement, $event)
        "
        @update:bpm="
          updateModeKeyBpm(selectedElement as ModeKeyElement, $event)
        "
        @update:ignoreAttractions="
          updateModeKeyIgnoreAttractions(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @update:showAmbitus="
          updateModeKeyShowAmbitus(selectedElement as ModeKeyElement, $event)
        "
        @update:tempoAlignRight="
          updateModeKeyTempoAlignRight(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @update:tempo="
          setModeKeyTempo(selectedElement as ModeKeyElement, $event)
        "
        @update:heightAdjustment="
          updateModeKeyHeightAdjustment(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @update:marginTop="
          updateModeKeyMarginTop(selectedElement as ModeKeyElement, $event)
        "
        @update:marginBottom="
          updateModeKeyMarginBottom(selectedElement as ModeKeyElement, $event)
        "
        @update:permanentEnharmonicZo="
          updateModeKeyPermanentEnharmonicZo(
            selectedElement as ModeKeyElement,
            $event,
          )
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
        :element="selectedElementForNeumeToolbar"
        :pageSetup="score.pageSetup"
        :neumeKeyboard="neumeKeyboard"
        :key="`toolbar-neume-${editor.selectedWorkspace.id}-${selectedElement.id}-${selectedElement.keyHelper}`"
        :innerNeume="toolbarInnerNeume"
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
        @update:chromaticFthoraNote="
          updateNoteChromaticFthoraNote(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:secondaryChromaticFthoraNote="
          updateNoteSecondaryChromaticFthoraNote(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:tertiaryChromaticFthoraNote="
          updateNoteTertiaryChromaticFthoraNote(
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
        @update:noteIndicator="
          updateNoteNoteIndicator(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:ison="
          setIson(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:koronis="
          updateNoteKoronis(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:stavros="
          updateNoteStavros(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:vareia="
          updateNoteVareia(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:tie="
          setTie(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:spaceAfter="
          updateNoteSpaceAfter(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:ignoreAttractions="
          updateNoteIgnoreAttractions(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:acceptsLyrics="
          updateNoteAcceptsLyrics(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
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
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        :neumeKeyboard="neumeKeyboard"
        @update:fthora="
          setFthoraMartyria(selectedElement as MartyriaElement, $event)
        "
        @update:chromaticFthoraNote="
          updateMartyriaChromaticFthoraNote(
            selectedElement as MartyriaElement,
            $event,
          )
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
        @update:alignRight="
          updateMartyriaAlignRight(selectedElement as MartyriaElement, $event)
        "
        @update:quantitativeNeume="
          setMartyriaQuantitativeNeume(
            selectedElement as MartyriaElement,
            $event,
          )
        "
        @update:auto="
          updateMartyriaAuto(selectedElement as MartyriaElement, $event)
        "
        @update:note="
          updateMartyriaNote(selectedElement as MartyriaElement, $event)
        "
        @update:scale="
          updateMartyriaScale(selectedElement as MartyriaElement, $event)
        "
        @update:bpm="
          updateMartyriaBpm(selectedElement as MartyriaElement, $event)
        "
        @update:spaceAfter="
          updateMartyriaSpaceAfter(selectedElement as MartyriaElement, $event)
        "
        @update:verticalOffset="
          updateMartyriaVerticalOffset(
            selectedElement as MartyriaElement,
            $event,
          )
        "
        @update:rootSignOverride="
          updateMartyriaRootSignOverride(
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
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:bpm="updateTempoBpm(selectedElement as TempoElement, $event)"
        @update:spaceAfter="
          updateTempoSpaceAfter(selectedElement as TempoElement, $event)
        "
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
        setSelectedElement(null);
        setSelectedLyrics(null);
      "
    ></ToolbarLyricManager>
    <ModeKeyDialog
      v-if="modeKeyDialogIsOpen"
      :element="selectedElement"
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
      :element="selectedElement"
      :previousElement="previousElementOnLine"
      :nextElement="nextElementOnLine"
      :pageSetup="score.pageSetup"
      @update="updateNoteAndSave(selectedElement as NoteElement, $event)"
      @close="closeSyllablePositioningDialog"
    />
    <PlaybackSettingsDialog
      v-if="playbackSettingsDialogIsOpen"
      :options="audioOptions"
      @close="closePlaybackSettingsDialog"
      @play-test-tone="audioPlayback.playTestTone"
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
        :key="element.id"
        :element="element"
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
        :key="element.id"
        :element="element"
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
