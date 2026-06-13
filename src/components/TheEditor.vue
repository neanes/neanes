<script setup lang="ts">
import 'vue3-tabs-chrome/dist/vue3-tabs-chrome.css';

import {
  PhArrowLineLeft,
  PhArrowLineRight,
  PhFile,
  PhParagraph,
  PhTextAlignCenter,
  PhTextAlignJustify,
  PhX,
  PhXCircle,
} from '@phosphor-icons/vue';
import { getFontEmbedCSS, toPng } from 'html-to-image';
import i18next from 'i18next';
import { useTranslation } from 'i18next-vue';
import { debounce, throttle } from 'throttle-debounce';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  provide,
  reactive,
  ref,
  type StyleValue,
  toRaw,
  useTemplateRef,
  watch,
} from 'vue';
import { toast } from 'vue-sonner';
import type { Tab } from 'vue3-tabs-chrome';
import Vue3TabsChrome from 'vue3-tabs-chrome';

import AboutDialog from '@/components/AboutDialog.vue';
import AlternateLine from '@/components/AlternateLine.vue';
import ContentEditable from '@/components/ContentEditable.vue';
import DropCap from '@/components/DropCap.vue';
import EditorPreferencesDialog from '@/components/EditorPreferencesDialog.vue';
import type {
  ExportAsLatexSettings,
  ExportAsMusicXmlSettings,
  ExportAsPngSettings,
} from '@/components/ExportDialog.types';
import { ExportFormat } from '@/components/ExportDialog.types';
import ExportDialog from '@/components/ExportDialog.vue';
import FileMenuBar from '@/components/FileMenuBar.vue';
import ImageBox from '@/components/ImageBox.vue';
import ModeKey from '@/components/ModeKey.vue';
import ModeKeyDialog from '@/components/ModeKeyDialog.vue';
import EmptyNeumeBox from '@/components/NeumeBoxEmpty.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import TempoNeumeBox from '@/components/NeumeBoxTempo.vue';
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Spinner } from '@/components/ui/spinner';
import { useEditorServices } from '@/composables/useEditorServices';
import { EventBus } from '@/eventBus';
import { resolveLanguagePreference } from '@/i18n';
import { editorPreferencesKey } from '@/injectionKeys';
import type {
  CloseWorkspacesArgs,
  ExportWorkspaceAsImageReplyArgs,
  FileMenuImportOcrArgs,
  FileMenuInsertTextboxArgs,
  FileMenuOpenImageArgs,
  FileMenuOpenScoreArgs,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import {
  CloseWorkspacesDisposition,
  IpcMainChannels,
  IpcRendererChannels,
} from '@/ipc/ipcChannels';
import { EditorPreferences } from '@/models/EditorPreferences';
import type { EmptyElement, ScoreElement } from '@/models/Element';
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
  TempoElement,
  TextBoxAlignment,
  TextBoxElement,
} from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { NeumeCombination } from '@/models/NeumeCommonCombinations';
import {
  areVocalExpressionsEquivalent,
  getSecondaryNeume,
  measureBarAboveToLeft,
  onlyTakesBottomKlasma,
  onlyTakesTopGorgon,
  onlyTakesTopKlasma,
} from '@/models/NeumeReplacements';
import type {
  Ison,
  MeasureBar,
  MeasureNumber,
  Note,
  QuantitativeNeume,
  TempoSign,
  Tie,
} from '@/models/Neumes';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import type { Line, Page } from '@/models/Page';
import type { PageSetup } from '@/models/PageSetup';
import { ScaleNote } from '@/models/Scales';
import { Score } from '@/models/Score';
import type { ScoreElementSelectionRange } from '@/models/ScoreElementSelectionRange';
import type { WorkspaceLocalStorage } from '@/models/Workspace';
import { Workspace } from '@/models/Workspace';
import {
  AudioServiceEventNames,
  AudioState,
} from '@/services/audio/AudioService';
import type {
  PlaybackOptions,
  PlaybackSequenceEvent,
} from '@/services/audio/PlaybackService';
import type { Command } from '@/services/history/CommandService';
import { CommandFactory } from '@/services/history/CommandService';
import { ByzHtmlExporter } from '@/services/integration/ByzHtmlExporter';
import { LatexExporterOptions } from '@/services/integration/LatexExporter';
import { LayoutService } from '@/services/LayoutService';
import { SaveService } from '@/services/SaveService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { GORTHMIKON, PELASTIKON, TATWEEL } from '@/utils/constants';
import { getCursorPosition } from '@/utils/getCursorPosition';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { isElectron } from '@/utils/isElectron';
import type { TokenMetadata } from '@/utils/replaceTokens';
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
const tabsRef = useTemplateRef<Vue3TabsChromeComponent>('tabsRef');
const searchTextRef =
  useTemplateRef<InstanceType<typeof SearchText>>('searchTextRef');
const pageBackgroundRef = useTemplateRef<HTMLElement>('pageBackgroundRef');
const pagesRef = useTemplateRef<HTMLElement[]>('pagesRef');
const {
  audioService,
  ipcService,
  latexExporter,
  lyricService,
  musicXmlExporter,
  neumeKeyboard,
  ocrImporter,
  platformService,
  playbackService,
  textSearchService,
} = useEditorServices();
const { t } = useTranslation();

const dynamicTemplateRefs = new Map<string, unknown[]>();
const dynamicTemplateRefSetters = new Map<string, (value: unknown) => void>();

function getTemplateRef<T>(name: string) {
  return (dynamicTemplateRefs.get(name) ?? []) as T;
}

function setTemplateRef(name: string) {
  let setter = dynamicTemplateRefSetters.get(name);

  if (setter == null) {
    setter = (value: unknown) => {
      if (value == null) {
        dynamicTemplateRefs.delete(name);
      } else {
        dynamicTemplateRefs.set(name, [value]);
      }
    };

    dynamicTemplateRefSetters.set(name, setter);
  }

  return setter;
}

const searchTextQuery = ref('');
const searchTextPanelIsOpen = ref(false);
const showFileMenuBar = ref(!isElectron());
const isDevelopment = ref(import.meta.env.DEV);
const isBrowser = ref(!isElectron());
const isLoading = ref(true);
const printMode = ref(false);
const showGuides = ref(false);
const showAdjustmentRatios = ref(false);
const workspaces = ref<Workspace[]>([]);
const selectedWorkspaceValue = ref(new Workspace());
const tabs = ref<Tab[]>([]);
const contextMenuWorkspaceId = ref<string | null>(null);
const pages = ref<Page[]>([]);
const currentPageNumber = ref(0);
const modeKeyDialogIsOpen = ref(false);
const syllablePositioningDialogIsOpen = ref(false);
const playbackSettingsDialogIsOpen = ref(false);
const pageSetupDialogIsOpen = ref(false);
const editorPreferencesDialogIsOpen = ref(false);
const aboutDialogIsOpen = ref(false);
const exportDialogIsOpen = ref(false);
const exportFormat = ref(ExportFormat.PNG);
const clipboard = ref<ScoreElement[]>([]);
const formatType = ref<ElementType | null>(null);
const textBoxFormat = ref<Partial<TextBoxElement> | null>(null);
const noteFormat = ref<Partial<NoteElement> | null>(null);
const richTextBoxCalculation = ref(false);
const richTextBoxCalculationCount = ref(0);
const textBoxCalculation = ref(false);
const textBoxCalculationCount = ref(0);
const fonts = ref<string[]>([]);
const toolbarInnerNeume = ref('Primary');
const keyboardModifier = ref<string | null>(null);
const audioElement = ref<ScoreElement | null>(null);
const playbackEvents = ref<PlaybackSequenceEvent[]>([]);
const playbackTimeInterval = ref<ReturnType<typeof setInterval> | null>(null);
const audioOptions = reactive<PlaybackOptions>({
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
});
const editorPreferences = ref(new EditorPreferences());
const byzHtmlExporter = new ByzHtmlExporter();
const exportInProgress = ref(false);

const selectedWorkspaceId = computed({
  get: () => {
    return selectedWorkspace.value.id;
  },
  set: (value: string) => {
    selectedWorkspace.value =
      (workspaces.value.find((x) => x.id === value) as Workspace) ??
      new Workspace();
  },
});

const rtl = computed(() => {
  return score.value.pageSetup.melkiteRtl;
});

const selectedWorkspace = computed({
  get: () => {
    return selectedWorkspaceValue.value as Workspace;
  },
  set: (value: Workspace) => {
    // Save the scroll position
    const pageBackgroundElement = pageBackgroundRef.value!;
    selectedWorkspace.value.scrollLeft = pageBackgroundElement.scrollLeft;
    selectedWorkspace.value.scrollTop = pageBackgroundElement.scrollTop;

    selectedWorkspaceValue.value = value;
    selectedWorkspace.value.commandService.notify();
    save(false);

    // Scroll to the new workspace's saved scroll position
    // Use nextTick to scroll after the DOM has refreshed
    nextTick(() => {
      pageBackgroundElement.scrollTo(
        selectedWorkspace.value.scrollLeft,
        selectedWorkspace.value.scrollTop,
      );

      calculatePageNumber();
    });

    stopAudio();
  },
});

const score = computed(() => {
  return selectedWorkspace.value.score;
});

const elements = computed(() => {
  return score.value?.staff.elements ?? [];
});

const resizableRichTextBoxElements = computed(() => {
  return elements.value.filter(
    (x) =>
      x.elementType === ElementType.RichTextBox &&
      !(x as RichTextBoxElement).inline,
  );
});

const resizableTextBoxElements = computed(() => {
  return elements.value.filter(
    (x) =>
      x.elementType === ElementType.TextBox && !(x as TextBoxElement).inline,
  );
});

const lyrics = computed({
  get: () => {
    return score.value?.staff.lyrics.text ?? '';
  },
  set: (value: string) => {
    score.value.staff.lyrics.text = value;
  },
});

const lyricsLocked = computed({
  get: () => {
    return score.value?.staff.lyrics.locked ?? false;
  },
  set: (value: boolean) => {
    score.value.staff.lyrics.locked = value;
  },
});

const lyricManagerIsOpen = computed({
  get: () => {
    return selectedWorkspace.value.lyricManagerIsOpen;
  },
  set: (value: boolean) => {
    selectedWorkspace.value.lyricManagerIsOpen = value;
  },
});

const pageCount = computed(() => {
  return filteredPages.value.length;
});

const commandService = computed(() => {
  return selectedWorkspace.value.commandService;
});

const selectedElementIndex = computed(() => {
  return selectedElement.value != null
    ? elements.value.indexOf(selectedElement.value)
    : -1;
});

const windowTitle = computed(() => {
  return `${getFileName(selectedWorkspace.value)} - ${
    import.meta.env.VITE_TITLE
  }`;
});

const selectedElement = computed({
  get: () => {
    return selectedWorkspace.value.selectedElement;
  },
  set: (element: ScoreElement | null) => {
    if (element != null) {
      selectedLyrics.value = null;
      selectionRange.value = null;
      selectedHeaderFooterElement.value = null;
      toolbarInnerNeume.value = 'Primary';

      if (audioService.state === AudioState.Playing) {
        const event = playbackEvents.value.find(
          (x) => x.elementIndex === getElementIndex(element),
        );

        if (event) {
          audioService.jumpToEvent(event);
          selectedWorkspace.value.playbackTime = event.absoluteTime;
        }
      } else if (audioService.state === AudioState.Paused) {
        stopAudio();
      }
    }

    if (
      selectedWorkspace.value.selectedAlternateLineElement != null &&
      selectedWorkspace.value.selectedAlternateLineElement.elements.length === 0
    ) {
      removeAlternateLine(
        selectedElement.value as NoteElement,
        selectedWorkspace.value.selectedAlternateLineElement,
        true,
      );
    }

    selectedWorkspace.value.selectedElement = element;
    selectedWorkspace.value.selectedAnnotationElement = null;
    selectedWorkspace.value.selectedAlternateLineElement = null;
  },
});

const selectedElementForNeumeToolbar = computed(() => {
  if (
    selectedWorkspace.value.selectedAlternateLineElement != null &&
    selectedWorkspace.value.selectedAlternateLineElement.elements.length > 0
  ) {
    return selectedWorkspace.value.selectedAlternateLineElement.elements[
      selectedWorkspace.value.selectedAlternateLineElement.elements.length - 1
    ];
  }
  return selectedWorkspace.value.selectedElement;
});

const previousElementOnLine = computed(() => {
  const index = selectedElementIndex.value;

  if (index - 1 < 0) {
    return null;
  }

  return elements.value[index - 1].line === selectedElement.value?.line
    ? elements.value[index - 1]
    : null;
});

const nextElementOnLine = computed(() => {
  const index = selectedElementIndex.value;

  if (index + 1 >= elements.value.length - 1) {
    return null;
  }

  return elements.value[index + 1].line === selectedElement.value?.line
    ? elements.value[index + 1]
    : null;
});

const selectedLyrics = computed({
  get: () => {
    return selectedWorkspace.value.selectedLyrics;
  },
  set: (element: NoteElement | null) => {
    if (element != null) {
      selectedElement.value = null;
      selectedHeaderFooterElement.value = null;
      selectionRange.value = null;
    }

    selectedWorkspace.value.selectedLyrics = element;
  },
});

const selectedHeaderFooterElement = computed({
  get: () => {
    return selectedWorkspace.value.selectedHeaderFooterElement;
  },
  set: (element: ScoreElement | null) => {
    if (element != null) {
      selectedElement.value = null;
      selectedLyrics.value = null;
      selectionRange.value = null;
    }

    selectedWorkspace.value.selectedHeaderFooterElement = element;
  },
});

const selectedTextBoxElement = computed(() => {
  const currentSelectedElement =
    selectedElement.value || selectedHeaderFooterElement.value;

  return currentSelectedElement != null &&
    isTextBoxElement(currentSelectedElement)
    ? (currentSelectedElement as TextBoxElement)
    : null;
});

const selectedRichTextBoxElement = computed(() => {
  const currentSelectedElement =
    selectedElement.value || selectedHeaderFooterElement.value;

  return currentSelectedElement != null &&
    isRichTextBoxElement(currentSelectedElement)
    ? (currentSelectedElement as RichTextBoxElement)
    : null;
});

const selectionRange = computed({
  get: () => {
    return selectedWorkspace.value.selectionRange;
  },
  set: (value: ScoreElementSelectionRange | null) => {
    selectedWorkspace.value.selectionRange = value;
  },
});

const zoom = computed({
  get: () => {
    return selectedWorkspace.value.zoom;
  },
  set: (zoom: number) => {
    selectedWorkspace.value.zoom = zoom;
  },
});

const zoomToFit = computed({
  get: () => {
    return selectedWorkspace.value.zoomToFit;
  },
  set: (value: boolean) => {
    selectedWorkspace.value.zoomToFit = value;
  },
});

const entryMode = computed({
  get: () => {
    return selectedWorkspace.value.entryMode;
  },
  set: (value: EntryMode) => {
    selectedWorkspace.value.entryMode = value;
  },
});

const currentFilePath = computed({
  get: () => {
    return selectedWorkspace.value.filePath;
  },
  set: (path: string | null) => {
    selectedWorkspace.value.filePath = path;
  },
});

const hasUnsavedChanges = computed({
  get: () => {
    return selectedWorkspace.value.hasUnsavedChanges;
  },
  set: (hasUnsavedChanges: boolean) => {
    selectedWorkspace.value.hasUnsavedChanges = hasUnsavedChanges;
  },
});

const pageStyle = computed(() => {
  return {
    minWidth: withZoom(score.value.pageSetup.pageWidth),
    maxWidth: withZoom(score.value.pageSetup.pageWidth),
    width: withZoom(score.value.pageSetup.pageWidth),
    height: withZoom(score.value.pageSetup.pageHeight),
    minHeight: withZoom(score.value.pageSetup.pageHeight),
    maxHeight: withZoom(score.value.pageSetup.pageHeight),
  } as StyleValue;
});

const headerStyle = computed(() => {
  return {
    left: withZoom(score.value.pageSetup.leftMargin),
    top: withZoom(score.value.pageSetup.headerMargin),
  } as StyleValue;
});

const footerStyle = computed(() => {
  return {
    left: withZoom(score.value.pageSetup.leftMargin),
    bottom: withZoom(score.value.pageSetup.footerMargin),
  } as StyleValue;
});

const guideStyleLeft = computed(() => {
  return {
    left: withZoom(score.value.pageSetup.leftMargin - 1),
    height: withZoom(score.value.pageSetup.pageHeight),
  } as StyleValue;
});

const guideStyleRight = computed(() => {
  return {
    right: withZoom(score.value.pageSetup.rightMargin - 1),
    height: withZoom(score.value.pageSetup.pageHeight),
  } as StyleValue;
});

const guideStyleTop = computed(() => {
  return {
    top: withZoom(score.value.pageSetup.topMargin - 1),
    width: withZoom(score.value.pageSetup.pageWidth),
  } as StyleValue;
});

const guideStyleBottom = computed(() => {
  return {
    bottom: withZoom(score.value.pageSetup.bottomMargin - 1),
    width: withZoom(score.value.pageSetup.pageWidth),
  } as StyleValue;
});

const pageVisibilityIntersection = computed(() => {
  // look ahead/behind 1 page
  const margin = score.value.pageSetup.pageHeight * zoom.value;

  return {
    root: pageBackgroundRef.value,
    rootMargin: `${margin}px 0px ${margin}px 0px`,
  } as IntersectionObserver;
});

const dialogOpen = computed(() => {
  return (
    modeKeyDialogIsOpen.value ||
    pageSetupDialogIsOpen.value ||
    playbackSettingsDialogIsOpen.value ||
    syllablePositioningDialogIsOpen.value ||
    editorPreferencesDialogIsOpen.value ||
    aboutDialogIsOpen.value
  );
});

const filteredPages = computed(() => {
  return printMode.value ? pages.value.filter((x) => !x.isEmpty) : pages.value;
});

provide(
  editorPreferencesKey,
  computed(() => editorPreferences.value),
);

const throttled = {
  assignLyrics: throttle(keydownThrottleIntervalMs, assignLyrics),
  moveToPreviousLyricBox: throttle(
    keydownThrottleIntervalMs,
    moveToPreviousLyricBox,
  ),
  moveToNextLyricBox: throttle(keydownThrottleIntervalMs, moveToNextLyricBox),
  moveLeft: throttle(keydownThrottleIntervalMs, moveLeft),
  moveRight: throttle(keydownThrottleIntervalMs, moveRight),
  moveSelectionLeft: throttle(keydownThrottleIntervalMs, moveSelectionLeft),
  moveSelectionRight: throttle(keydownThrottleIntervalMs, moveSelectionRight),
  deleteSelectedElement: throttle(
    keydownThrottleIntervalMs,
    deleteSelectedElement,
  ),
  deletePreviousElement: throttle(
    keydownThrottleIntervalMs,
    deletePreviousElement,
  ),
  onFileMenuUndo: throttle(keydownThrottleIntervalMs, onFileMenuUndo),
  onFileMenuRedo: throttle(keydownThrottleIntervalMs, onFileMenuRedo),
  onCutScoreElements: throttle(keydownThrottleIntervalMs, onCutScoreElements),
  onCopyScoreElements: throttle(keydownThrottleIntervalMs, onCopyScoreElements),
  onFileMenuCopyAsHtml: throttle(
    keydownThrottleIntervalMs,
    onFileMenuCopyAsHtml,
  ),
  onPasteScoreElements: throttle(
    keydownThrottleIntervalMs,
    onPasteScoreElements,
  ),
  addQuantitativeNeume: throttle(
    keydownThrottleIntervalMs,
    addQuantitativeNeume,
  ),
  addTempo: throttle(keydownThrottleIntervalMs, addTempo),
  addAutoMartyria: throttle(keydownThrottleIntervalMs, addAutoMartyria),
  updateNoteAndSave: throttle(keydownThrottleIntervalMs, updateNoteAndSave),
  setKlasma: throttle(keydownThrottleIntervalMs, setKlasma),
  setGorgon: throttle(keydownThrottleIntervalMs, setGorgon),
  setFthoraNote: throttle(keydownThrottleIntervalMs, setFthoraNote),
  setFthoraMartyria: throttle(keydownThrottleIntervalMs, setFthoraMartyria),
  setMartyriaTempo: throttle(keydownThrottleIntervalMs, setMartyriaTempo),
  setAccidental: throttle(keydownThrottleIntervalMs, setAccidental),
  setTimeNeume: throttle(keydownThrottleIntervalMs, setTimeNeume),
  setMeasureNumber: throttle(keydownThrottleIntervalMs, setMeasureNumber),
  setMeasureBarNote: throttle(keydownThrottleIntervalMs, setMeasureBarNote),
  setMeasureBarMartyria: throttle(
    keydownThrottleIntervalMs,
    setMeasureBarMartyria,
  ),
  setIson: throttle(keydownThrottleIntervalMs, setIson),
  setTie: throttle(keydownThrottleIntervalMs, setTie),
  setVocalExpression: throttle(keydownThrottleIntervalMs, setVocalExpression),
  updateMartyria: throttle(keydownThrottleIntervalMs, updateMartyria),
  onWindowResize: throttle(250, onWindowResize),
  onScroll: throttle(250, onScroll),
};
const saveDebounced = debounce(250, save);

if (isDevelopment.value) {
  for (const [key, val] of Object.entries(throttled)) {
    if (val == null) {
      throw new Error(`Missing initialization for throttled method '${key}'`);
    }
  }
}

watch(zoom, () => {
  document.documentElement.style.setProperty('--zoom', zoom.value.toString());
});

watch(currentFilePath, () => {
  window.document.title = windowTitle.value;
});

watch(selectedWorkspaceId, () => {
  window.document.title = windowTitle.value;
});

watch(hasUnsavedChanges, () => {
  window.document.title = windowTitle.value;
});

watch(playbackSettingsDialogIsOpen, (isOpen, wasOpen) => {
  if (!isOpen && wasOpen) {
    saveAudioOptions();
  }
});

onMounted(() => {
  const savedAudioOptions = localStorage.getItem('audioOptionsDefault');

  if (savedAudioOptions != null) {
    Object.assign(audioOptions, JSON.parse(savedAudioOptions));

    // -Infinity is not valid JSON, so it is serialized as null.
    // Deserialize as -Infinity
    audioOptions.volumeIson = audioOptions.volumeIson ?? -Infinity;
    audioOptions.volumeMelody = audioOptions.volumeMelody ?? -Infinity;
  }

  const savedEditorPreferences = localStorage.getItem('editorPreferences');

  if (savedEditorPreferences != null) {
    editorPreferences.value = EditorPreferences.createFrom(
      JSON.parse(savedEditorPreferences),
    );
  }

  window.addEventListener('keydown', onKeydown);
  window.addEventListener('keyup', onKeyup);
  window.addEventListener('resize', throttled.onWindowResize);

  EventBus.$on(IpcMainChannels.CloseWorkspaces, onCloseWorkspaces);
  EventBus.$on(IpcMainChannels.CloseApplication, onCloseApplication);

  EventBus.$on(IpcMainChannels.FileMenuNewScore, onFileMenuNewScore);
  EventBus.$on(IpcMainChannels.FileMenuOpenScore, onFileMenuOpenScore);
  EventBus.$on(IpcMainChannels.FileMenuPrint, onFileMenuPrint);
  EventBus.$on(IpcMainChannels.FileMenuSave, onFileMenuSave);
  EventBus.$on(IpcMainChannels.FileMenuSaveAs, onFileMenuSaveAs);
  EventBus.$on(IpcMainChannels.FileMenuPageSetup, onFileMenuPageSetup);
  EventBus.$on(IpcMainChannels.FileMenuImportOcr, onFileMenuImportOcr);
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
  EventBus.$on(IpcMainChannels.OpenAboutDialog, onOpenAboutDialog);
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

  EventBus.$on(AudioServiceEventNames.Stop, onAudioServiceStop);
});

onBeforeUnmount(() => {
  // Remove the debugging variable from window
  (window as any)._editor = undefined;

  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('keyup', onKeyup);
  window.removeEventListener('resize', throttled.onWindowResize);

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
  EventBus.$off(IpcMainChannels.OpenAboutDialog, onOpenAboutDialog);
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

  EventBus.$off(AudioServiceEventNames.Stop, onAudioServiceStop);

  audioService.dispose();
});

async function initialize() {
  // Attach a small debugging surface without relying on the component proxy.
  (window as any)._editor = {
    elements,
    score,
    selectedElement,
    selectedWorkspace,
    workspaces,
  };

  try {
    const fontLoader = (document as any).fonts;

    const loadSystemFontsPromise = ipcService
      .getSystemFonts()
      .then((systemFonts) => (fonts.value = systemFonts));

    // Must load all fonts before loading any documents,
    // otherwise the text measurements will be wrong
    await Promise.all([
      loadSystemFontsPromise,
      fontLoader.load('1rem "GFS Didot"'),
      fontLoader.load('1rem Neanes'),
      fontLoader.load('1rem NeanesStathisSeries'),
      fontLoader.load('1rem NeanesRTL'),
      fontLoader.load('1rem NeanesLegacy'),
      fontLoader.load('1rem NeanesStathisSeriesLegacy'),
      fontLoader.load('1rem NeanesRTLLegacy'),
      fontLoader.load('1rem "Noto Naskh Arabic"'),
      fontLoader.load('1rem "Old Standard"'),
      fontLoader.load('1rem "Source Serif"'),
      fontLoader.ready,
    ]);

    await load();
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

void initialize();

function getHeaderHorizontalRuleStyle(headerHeight: number) {
  return {
    left: withZoom(score.value.pageSetup.leftMargin),
    top: withZoom(
      score.value.pageSetup.headerMargin +
        headerHeight +
        score.value.pageSetup.headerHorizontalRuleMarginTop,
    ),
    borderColor: score.value.pageSetup.headerHorizontalRuleColor,
    borderTopWidth: withZoom(
      score.value.pageSetup.headerHorizontalRuleThickness,
    ),
    width: withZoom(score.value.pageSetup.innerPageWidth),
  } as StyleValue;
}

function getFooterHorizontalRuleStyle(footerHeight: number) {
  return {
    left: withZoom(score.value.pageSetup.leftMargin),
    bottom: withZoom(
      score.value.pageSetup.footerMargin +
        footerHeight +
        score.value.pageSetup.footerHorizontalRuleMarginBottom,
    ),
    borderColor: score.value.pageSetup.footerHorizontalRuleColor,
    borderTopWidth: withZoom(
      score.value.pageSetup.footerHorizontalRuleThickness,
    ),
    width: withZoom(score.value.pageSetup.innerPageWidth),
  } as StyleValue;
}

function getLyricStyle(element: NoteElement) {
  return {
    top: withZoom(element.lyricsVerticalOffset),
    paddingLeft:
      (!element.isFullMelisma ||
        (element.melismaText && !element.melismaText.endsWith(TATWEEL))) &&
      element.lyricsHorizontalOffset > 0
        ? withZoom(element.lyricsHorizontalOffset)
        : undefined,
    paddingRight:
      (!element.isFullMelisma ||
        (element.melismaText && !element.melismaText.endsWith(TATWEEL))) &&
      element.lyricsHorizontalOffset < 0
        ? withZoom(-element.lyricsHorizontalOffset)
        : undefined,
    fontSize: element.lyricsUseDefaultStyle
      ? withZoom(score.value.pageSetup.lyricsDefaultFontSize)
      : withZoom(element.lyricsFontSize),
    fontFamily: element.lyricsUseDefaultStyle
      ? getFontFamilyWithFallback(
          score.value.pageSetup.lyricsDefaultFontFamily,
          score.value.pageSetup.neumeDefaultFontFamily,
        )
      : getFontFamilyWithFallback(
          element.lyricsFontFamily,
          score.value.pageSetup.neumeDefaultFontFamily,
        ),
    fontWeight: element.lyricsUseDefaultStyle
      ? score.value.pageSetup.lyricsDefaultFontWeight
      : element.lyricsFontWeight,
    fontStyle: element.lyricsUseDefaultStyle
      ? score.value.pageSetup.lyricsDefaultFontStyle
      : element.lyricsFontStyle,
    textDecoration: element.lyricsUseDefaultStyle
      ? undefined
      : element.lyricsTextDecoration,
    color: element.lyricsUseDefaultStyle
      ? score.value.pageSetup.lyricsDefaultColor
      : element.lyricsColor,
    webkitTextStrokeWidth: element.lyricsUseDefaultStyle
      ? withZoom(score.value.pageSetup.lyricsDefaultStrokeWidth)
      : withZoom(element.lyricsStrokeWidth),
    lineHeight: withZoom(element.lyricsFontHeight),
    left: element.alignLeft
      ? withZoom(Math.min(0, element.lyricsHorizontalOffset))
      : undefined,
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
    left: !rtl.value ? withZoom(element.x) : undefined,
    right: rtl.value ? withZoom(element.x) : undefined,
    top: withZoom(element.y),
  } as StyleValue;
}

function getAdjustmentRatioStyle(line: Line) {
  const fontSize = score.value.pageSetup.lyricsDefaultFontSize * 0.8;
  const gap = fontSize * 0.5;
  return {
    position: 'absolute',
    left: withZoom(
      rtl.value
        ? score.value.pageSetup.leftMargin - gap - fontSize * 3
        : score.value.pageSetup.pageWidth -
            score.value.pageSetup.rightMargin +
            gap,
    ),
    width: withZoom(fontSize * 3),
    textAlign: 'right',
    top: withZoom(
      line.elements[0].y + score.value.pageSetup.lineHeight / 3 - fontSize / 2,
    ),
    fontSize: withZoom(fontSize),
    fontFamily: score.value.pageSetup.lyricsDefaultFontFamily,
    color: score.value.pageSetup.gorgonDefaultColor,
  } as StyleValue;
}

function getMelismaStyle(element: NoteElement) {
  return {
    width: withZoom(element.melismaWidth),
    minHeight: element.lyricsUseDefaultStyle
      ? withZoom(score.value.pageSetup.lyricsDefaultFontSize)
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
  const thickness = score.value.pageSetup.lyricsMelismaThickness;

  const spacing = !element.isFullMelisma
    ? score.value.pageSetup.lyricsMelismaSpacing
    : 0;

  return {
    borderBottom: `${withZoom(thickness)} solid ${
      element.lyricsUseDefaultStyle
        ? score.value.pageSetup.lyricsDefaultColor
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

  const header = score.value.getHeaderForPage(pageNumber);

  // Currently, headers only support a single text box element.
  return header.elements[0] as TextBoxElement | RichTextBoxElement;
}

function getFooterForPageIndex(pageIndex: number) {
  const pageNumber = pageIndex + 1;

  const footer = score.value.getFooterForPage(pageNumber);

  // Currently, footers only support a single text box element.
  return footer.elements[0] as TextBoxElement | RichTextBoxElement;
}

function shouldShowHeaderForPageIndex(pageIndex: number) {
  const pageNumber = pageIndex + 1;

  return score.value.shouldShowHeaderOnPage(pageNumber);
}

function shouldShowFooterForPageIndex(pageIndex: number) {
  const pageNumber = pageIndex + 1;

  return score.value.shouldShowFooterOnPage(pageNumber);
}

function getTokenMetadata(pageIndex: number): TokenMetadata {
  return {
    pageNumber: pageIndex + score.value.pageSetup.firstPageNumber,
    numberOfPages: pageCount.value + score.value.pageSetup.firstPageNumber - 1,
    fileName:
      selectedWorkspace.value.filePath != null
        ? getFileNameFromPath(selectedWorkspace.value.filePath)
        : selectedWorkspace.value.tempFileName,
    filePath: currentFilePath.value || '',
  };
}

function getElementIndex(element: ScoreElement) {
  return element.index;
}

function setSelectionRange(element: ScoreElement) {
  const elementIndex = getElementIndex(element);

  if (selectedElement.value != null) {
    selectionRange.value = {
      start: selectedElementIndex.value,
      end: elementIndex,
    };

    selectedElement.value = null;
  } else if (selectionRange.value != null) {
    selectionRange.value.end = elementIndex;
  }
}

function getNormalizedSelectionRange() {
  if (selectionRange.value == null) {
    return null;
  }

  const start = Math.min(selectionRange.value.start, selectionRange.value.end);
  const end = Math.max(selectionRange.value.start, selectionRange.value.end);

  return {
    start,
    end,
  } as ScoreElementSelectionRange;
}

function isSelected(element: ScoreElement) {
  if (selectedElement.value === element) {
    return true;
  }
  if (selectionRange.value != null) {
    const start = Math.min(
      selectionRange.value.start,
      selectionRange.value.end,
    );
    const end = Math.max(selectionRange.value.start, selectionRange.value.end);

    return start <= getElementIndex(element) && getElementIndex(element) <= end;
  }

  return false;
}

function setSelectedAnnotation(
  parent: ScoreElement | null,
  annotation: AnnotationElement,
) {
  selectedElement.value = parent;
  selectedWorkspace.value.selectedAnnotationElement = annotation;
}

function setSelectedAlternateLine(
  parent: ScoreElement | null,
  alternateLine: AlternateLineElement,
) {
  selectedElement.value = parent;
  selectedWorkspace.value.selectedAlternateLineElement = alternateLine;
}

function isAudioSelected(element: ScoreElement) {
  return audioElement.value === element;
}

function isMelisma(element: NoteElement) {
  return element.melismaWidth > 0;
}

function openModeKeyDialog() {
  modeKeyDialogIsOpen.value = true;
}

function openSyllablePositioningDialog() {
  syllablePositioningDialogIsOpen.value = true;
}

function openPlaybackSettingsDialog() {
  playbackSettingsDialogIsOpen.value = true;

  stopAudio();
}

function updatePlaybackOptions(options: PlaybackOptions) {
  Object.assign(audioOptions, options);
}

function closeExportDialog() {
  exportDialogIsOpen.value = false;
}

function openLyricManager() {
  lyricManagerIsOpen.value = true;
  refreshStaffLyrics();
}

function closeLyricManager() {
  lyricManagerIsOpen.value = false;
}

function updateEditorPreferences(form: EditorPreferences) {
  const languageChanged = editorPreferences.value.language !== form.language;

  Object.assign(editorPreferences.value, form);

  saveEditorPreferences();

  if (languageChanged) {
    // An empty string means "fall back to the auto-detected locale".
    i18next.changeLanguage(
      resolveLanguagePreference(form.language, navigator.language),
    );
    EventBus.$emit(IpcRendererChannels.SetLanguage, form.language);
  }

  editorPreferencesDialogIsOpen.value = false;
}

function saveEditorPreferences() {
  localStorage.setItem(
    'editorPreferences',
    JSON.stringify(editorPreferences.value),
  );
}

function isLastElement(element: ScoreElement) {
  return elements.value.indexOf(element) === elements.value.length - 1;
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
  if (selectedElement.value == null) {
    return;
  }

  const element = new NoteElement();
  element.lyricsColor = score.value.pageSetup.lyricsDefaultColor;
  element.lyricsFontFamily = score.value.pageSetup.lyricsDefaultFontFamily;
  element.lyricsFontSize = score.value.pageSetup.lyricsDefaultFontSize;
  element.lyricsFontStyle = score.value.pageSetup.lyricsDefaultFontStyle;
  element.lyricsFontWeight = score.value.pageSetup.lyricsDefaultFontWeight;
  element.lyricsStrokeWidth = score.value.pageSetup.lyricsDefaultStrokeWidth;

  element.quantitativeNeume = quantitativeNeume;
  // Special case for neumes with secondary gorgon
  if (getSecondaryNeume(quantitativeNeume) != null) {
    element.secondaryGorgonNeume = secondaryGorgonNeume;
  }

  // If the selected element is an alternate line element,
  // add the new element to the alternate line's elements
  // and return immediately. Alternate lines do not support
  // different entry modes.
  if (selectedWorkspace.value.selectedAlternateLineElement != null) {
    addScoreElement(
      element,
      selectedWorkspace.value.selectedAlternateLineElement.elements.length,
      selectedWorkspace.value.selectedAlternateLineElement.elements,
    );
    save();
    return;
  }

  switch (entryMode.value) {
    case EntryMode.Auto:
      if (!isLastElement(selectedElement.value) && !moveRight()) {
        return;
      }

      if (isLastElement(selectedElement.value)) {
        addScoreElement(element, selectedElementIndex.value);
        selectedElement.value = element;
      } else {
        if (selectedElement.value.elementType === ElementType.Note) {
          if (
            (selectedElement.value as NoteElement).quantitativeNeume !==
            quantitativeNeume
          ) {
            updateNote(selectedElement.value as NoteElement, {
              quantitativeNeume,
              secondaryGorgonNeume,
            });
          } else if (
            (selectedElement.value as NoteElement).secondaryGorgonNeume !==
            secondaryGorgonNeume
          ) {
            // Special case for hyporoe gorgon
            updateNote(selectedElement.value as NoteElement, {
              secondaryGorgonNeume,
            });
          }
        } else {
          selectedElement.value = switchToSyllable(
            selectedElement.value,
            element,
          );
        }
      }
      break;
    case EntryMode.Insert:
      if (isLastElement(selectedElement.value)) {
        addScoreElement(element, selectedElementIndex.value);
      } else {
        if (selectedElement.value.elementType === ElementType.Note) {
          const selectedElementAsNote = selectedElement.value as NoteElement;

          element.isMelisma = selectedElementAsNote.isMelisma;
          element.isHyphen = selectedElementAsNote.isHyphen;
        }

        addScoreElement(element, selectedElementIndex.value + 1);
      }
      selectedElement.value = element;
      break;

    case EntryMode.Edit:
      if (isLastElement(selectedElement.value)) {
        addScoreElement(element, selectedElementIndex.value);
      } else if (selectedElement.value.elementType === ElementType.Note) {
        if (
          (selectedElement.value as NoteElement).quantitativeNeume !==
          quantitativeNeume
        ) {
          updateNote(selectedElement.value as NoteElement, {
            quantitativeNeume,
            secondaryGorgonNeume,
          });
        } else if (
          (selectedElement.value as NoteElement).secondaryGorgonNeume !==
          secondaryGorgonNeume
        ) {
          // Special case for hyporoe gorgon
          updateNote(selectedElement.value as NoteElement, {
            secondaryGorgonNeume,
          });
        }
      } else if (
        navigableElements.includes(selectedElement.value.elementType)
      ) {
        selectedElement.value = switchToSyllable(
          selectedElement.value,
          element,
        );
      }
      break;
  }

  save();
}

function addNeumeCombination(combo: NeumeCombination) {
  const backup = clipboard.value.slice();
  clipboard.value = combo.elements;
  onPasteScoreElements(false);

  clipboard.value = backup;
}

function addAutoMartyria(alignRight?: boolean, note?: Note) {
  if (selectedElement.value == null) {
    return;
  }

  const element = new MartyriaElement();
  element.alignRight = alignRight === true;

  if (note != null) {
    element.note = note;
    element.auto = false;
  }

  switch (entryMode.value) {
    case EntryMode.Auto:
      moveRight();

      if (isLastElement(selectedElement.value)) {
        addScoreElement(element, selectedElementIndex.value);
        selectedElement.value = element;
      } else {
        if (selectedElement.value.elementType != ElementType.Martyria) {
          selectedElement.value = switchToMartyria(selectedElement.value);
        }
      }
      break;
    case EntryMode.Insert:
      if (isLastElement(selectedElement.value)) {
        addScoreElement(element, selectedElementIndex.value);
      } else {
        addScoreElement(element, selectedElementIndex.value + 1);
      }
      selectedElement.value = element;
      break;
    case EntryMode.Edit:
      if (isLastElement(selectedElement.value)) {
        addScoreElement(element, selectedElementIndex.value);
      } else if (selectedElement.value.elementType != ElementType.Martyria) {
        selectedElement.value = switchToMartyria(selectedElement.value);
      }
      break;
  }

  save();
}

function addTempo(neume: TempoSign) {
  if (selectedElement.value == null) {
    return;
  }

  const element = new TempoElement();
  element.neume = neume;
  element.bpm =
    editorPreferences.value.getDefaultTempo(neume) ??
    TempoElement.getDefaultBpm(neume);

  switch (entryMode.value) {
    case EntryMode.Auto:
      moveRight();

      if (isLastElement(selectedElement.value)) {
        addScoreElement(element, selectedElementIndex.value);
        selectedElement.value = element;
      } else {
        if (selectedElement.value.elementType === ElementType.Tempo) {
          if ((selectedElement.value as TempoElement).neume !== neume) {
            updateTempo(selectedElement.value as TempoElement, {
              neume,
            });
          }
        } else {
          selectedElement.value = switchToTempo(selectedElement.value, element);
        }
      }
      break;
    case EntryMode.Insert:
      if (isLastElement(selectedElement.value)) {
        addScoreElement(element, selectedElementIndex.value);
      } else {
        addScoreElement(element, selectedElementIndex.value + 1);
      }
      selectedElement.value = element;
      break;
    case EntryMode.Edit:
      if (isLastElement(selectedElement.value)) {
        addScoreElement(element, selectedElementIndex.value);
      } else if (selectedElement.value.elementType === ElementType.Tempo) {
        if ((selectedElement.value as TempoElement).neume !== neume) {
          updateTempo(selectedElement.value as TempoElement, {
            neume,
          });
        }
      } else {
        selectedElement.value = switchToTempo(selectedElement.value, element);
      }
      break;
  }

  save();
}

function addDropCap(after: boolean) {
  if (selectedElement.value == null) {
    return;
  }

  const element = new DropCapElement();

  element.color = score.value.pageSetup.dropCapDefaultColor;
  element.fontFamily = score.value.pageSetup.dropCapDefaultFontFamily;
  element.fontSize = score.value.pageSetup.dropCapDefaultFontSize;
  element.strokeWidth = score.value.pageSetup.dropCapDefaultStrokeWidth;
  element.fontWeight = score.value.pageSetup.dropCapDefaultFontWeight;
  element.fontStyle = score.value.pageSetup.dropCapDefaultFontStyle;
  element.lineHeight = score.value.pageSetup.dropCapDefaultLineHeight;
  element.lineSpan = score.value.pageSetup.dropCapDefaultLineSpan;

  if (after && !isLastElement(selectedElement.value)) {
    addScoreElement(element, selectedElementIndex.value + 1);
  } else {
    addScoreElement(element, selectedElementIndex.value);
  }

  selectedElement.value = element;
  save();

  nextTick(() => {
    const index = elements.value.indexOf(element);

    getTemplateRef<any[]>(`element-${index}`)[0].focus();
  });
}

function onClickAddImage() {
  EventBus.$emit(IpcRendererChannels.OpenImageDialog);
}

function togglePageBreak() {
  if (selectedElement.value && !isLastElement(selectedElement.value)) {
    commandService.value.execute(
      scoreElementCommandFactory.create('update-properties', {
        target: selectedElement.value,
        newValues: {
          pageBreak: !selectedElement.value.pageBreak,
          lineBreak: false,
        },
      }),
    );

    save();
  }
}

function toggleLineBreak(lineBreakType: LineBreakType | null) {
  if (selectedElement.value && !isLastElement(selectedElement.value)) {
    let lineBreak = !selectedElement.value.lineBreak;

    if (lineBreakType != selectedElement.value.lineBreakType) {
      lineBreak = true;
    }

    if (!lineBreak) {
      lineBreakType = null;
    }

    commandService.value.execute(
      scoreElementCommandFactory.create('update-properties', {
        target: selectedElement.value,
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

  commandService.value.execute(
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
  const index = elements.value.indexOf(element);

  const newElement = new MartyriaElement();
  newElement.pageBreak = element.pageBreak;
  newElement.lineBreak = element.lineBreak;

  replaceScoreElement(newElement, index);

  return newElement;
}

function switchToTempo(oldElement: ScoreElement, newElement: TempoElement) {
  const index = elements.value.indexOf(oldElement);

  newElement.pageBreak = oldElement.pageBreak;
  newElement.lineBreak = oldElement.lineBreak;

  replaceScoreElement(newElement, index);

  return newElement;
}

function switchToSyllable(oldElement: ScoreElement, newElement: NoteElement) {
  const index = elements.value.indexOf(oldElement);

  newElement.pageBreak = oldElement.pageBreak;
  newElement.lineBreak = oldElement.lineBreak;

  replaceScoreElement(newElement, index);

  return newElement;
}

function focusLyrics(index: number, selectAll: boolean = false) {
  getTemplateRef<InstanceType<typeof ContentEditable>[]>(
    `lyrics-${index}`,
  )[0].focus(selectAll);
}

function setLyrics(index: number, lyrics: string) {
  const elements = getTemplateRef<InstanceType<typeof ContentEditable>[]>(
    `lyrics-${index}`,
  );

  if (elements?.length > 0) {
    elements[0].setInnerText(lyrics);
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

const toolbarInteractionKeyCodes = new Set([
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'End',
  'Enter',
  'Home',
  'Space',
  'Tab',
]);

function isToolbarInteraction(event: KeyboardEvent) {
  return (
    toolbarInteractionKeyCodes.has(event.code) &&
    event.target instanceof Element &&
    event.target.closest('[role="toolbar"], [data-slot="toolbar"]') != null
  );
}

function onWindowResize() {
  if (zoomToFit.value) {
    performZoomToFit();
  }
}

function onScroll() {
  calculatePageNumber();
}

function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented || isToolbarInteraction(event)) {
    return;
  }

  // Handle undo / redo
  // See https://github.com/electron/electron/issues/3682.
  if (
    (event.ctrlKey || event.metaKey) &&
    !isTextInputFocused() &&
    !dialogOpen.value
  ) {
    if (event.code === 'KeyZ') {
      if (platformService.isMac && event.shiftKey) {
        throttled.onFileMenuRedo();
      } else {
        throttled.onFileMenuUndo();
      }
      event.preventDefault();
      return;
    } else if (event.code === 'KeyY') {
      throttled.onFileMenuRedo();
      event.preventDefault();
      return;
    } else if (event.code === 'KeyX') {
      throttled.onCutScoreElements();
      event.preventDefault();
      return;
    } else if (event.code === 'KeyC') {
      if (event.shiftKey) {
        throttled.onFileMenuCopyAsHtml();
      } else {
        throttled.onCopyScoreElements();
      }
      event.preventDefault();
      return;
    } else if (event.code === 'KeyV') {
      const includeLyrics = event.shiftKey;
      throttled.onPasteScoreElements(includeLyrics);
      event.preventDefault();
      return;
    } else if (event.code === 'KeyI' && !event.shiftKey) {
      switch (entryMode.value) {
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
      switch (entryMode.value) {
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

  if (platformService.isMac && isTextInputFocused() && !dialogOpen.value) {
    onKeydownMac(event);
  }

  if (selectedLyrics.value != null) {
    return onKeydownLyrics(event);
  }

  if (selectedElement.value?.elementType === ElementType.DropCap) {
    return onKeydownDropCap(event);
  }

  if (selectedElement.value?.elementType === ElementType.TextBox) {
    return onKeydownTextBox(event);
  }

  if (!isTextInputFocused() && !dialogOpen.value) {
    return onKeydownNeume(event);
  }
}

function onKeydownNeume(event: KeyboardEvent) {
  let handled = false;

  if (event.shiftKey) {
    switch (event.code) {
      case 'ArrowLeft':
        throttled.moveSelectionLeft();
        handled = true;
        break;
      case 'ArrowRight':
        throttled.moveSelectionRight();
        handled = true;
        break;
    }
  } else {
    switch (event.code) {
      case 'ArrowLeft':
        if (!rtl.value) {
          throttled.moveLeft();
        } else {
          throttled.moveRight();
        }
        handled = true;
        break;
      case 'ArrowRight':
        if (!rtl.value) {
          throttled.moveRight();
        } else {
          throttled.moveLeft();
        }
        handled = true;
        break;
      case 'ArrowDown':
        if (
          (event.ctrlKey || event.metaKey) &&
          selectedElement.value?.elementType === ElementType.Note
        ) {
          const index = selectedElementIndex.value;

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
            playAudio();
          } else {
            pauseAudio();
          }
          handled = true;
        }
        break;
      case 'Backspace':
        handled = true;
        throttled.deletePreviousElement();
        break;
      case 'Delete':
        handled = true;
        throttled.deleteSelectedElement();
        break;
    }
  }

  if (
    selectedElement.value != null &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey
  ) {
    if (neumeKeyboard.isModifier(event.code)) {
      keyboardModifier.value = event.code;
      handled = true;
    }

    const quantitativeMapping = neumeKeyboard.findQuantitativeMapping(
      event,
      keyboardModifier.value,
    );

    if (quantitativeMapping != null) {
      handled = true;

      if (quantitativeMapping.acceptsLyricsOption != null) {
        if (selectedElement.value.elementType === ElementType.Note) {
          throttled.updateNoteAndSave(selectedElement.value as NoteElement, {
            acceptsLyrics: quantitativeMapping.acceptsLyricsOption,
          });
        }
      } else {
        throttled.addQuantitativeNeume(
          quantitativeMapping.neume as QuantitativeNeume,
        );
      }
    }

    const tempoMapping = neumeKeyboard.findTempoMapping(
      event,
      keyboardModifier.value,
    );

    if (tempoMapping != null) {
      handled = true;
      throttled.addTempo(tempoMapping.neume as TempoSign);
    }

    if (
      keyboardModifier.value == null &&
      neumeKeyboard.isMartyria(event.code)
    ) {
      handled = true;
      throttled.addAutoMartyria(event.shiftKey);
    }

    const martyriaConfigMapping = neumeKeyboard.findMartyriaConfigMapping(
      event,
      keyboardModifier.value,
    );

    if (martyriaConfigMapping != null) {
      if (martyriaConfigMapping.note != null) {
        handled = true;

        throttled.addAutoMartyria(
          martyriaConfigMapping.martyriaAlignmentToggle,
          martyriaConfigMapping.note,
        );
      }
    }

    if (
      selectedElement.value.elementType === ElementType.Note &&
      !event.repeat
    ) {
      const noteElement = selectedElement.value as NoteElement;

      const gorgonMapping = neumeKeyboard.findGorgonMapping(
        event,
        keyboardModifier.value,
      );

      if (gorgonMapping != null) {
        handled = true;
        throttled.setGorgon(noteElement, gorgonMapping.neumes as GorgonNeume[]);
      }

      const vocalExpressionMapping = neumeKeyboard.findVocalExpressionMapping(
        event,
        keyboardModifier.value,
      );

      if (vocalExpressionMapping != null) {
        handled = true;

        if (vocalExpressionMapping.neume === VocalExpressionNeume.Vareia) {
          throttled.updateNoteAndSave(noteElement, {
            vareia: !noteElement.vareia,
          });
        } else {
          throttled.setVocalExpression(
            noteElement,
            vocalExpressionMapping.neume as VocalExpressionNeume,
          );
        }
      }

      const tieMapping = neumeKeyboard.findTieMapping(
        event,
        keyboardModifier.value,
      );

      if (tieMapping != null) {
        handled = true;

        throttled.setTie(noteElement, tieMapping.neumes as Tie[]);
      }

      const fthoraMapping = neumeKeyboard.findFthoraMapping(
        event,
        keyboardModifier.value,
      );

      if (fthoraMapping != null) {
        handled = true;
        throttled.setFthoraNote(noteElement, fthoraMapping.neumes as Fthora[]);
      }

      const accidentalMapping = neumeKeyboard.findAccidentalMapping(
        event,
        keyboardModifier.value,
      );

      if (accidentalMapping != null) {
        handled = true;
        throttled.setAccidental(
          noteElement,
          accidentalMapping.neume as Accidental,
        );
      }

      const hapliMapping = neumeKeyboard.findHapliMapping(
        event,
        keyboardModifier.value,
      );

      if (hapliMapping != null) {
        handled = true;

        if (hapliMapping.neume === TimeNeume.Koronis) {
          throttled.updateNoteAndSave(noteElement, {
            koronis: !noteElement.koronis,
          });
        } else {
          throttled.setTimeNeume(noteElement, hapliMapping.neume as TimeNeume);
        }
      }

      const measureNumberMapping = neumeKeyboard.findMeasureNumberMapping(
        event,
        keyboardModifier.value,
      );

      if (measureNumberMapping != null) {
        handled = true;
        throttled.setMeasureNumber(
          noteElement,
          measureNumberMapping.neume as MeasureNumber,
        );
      }

      const measureBarMapping = neumeKeyboard.findMeasureBarMapping(
        event,
        keyboardModifier.value,
      );

      if (measureBarMapping != null) {
        handled = true;
        throttled.setMeasureBarNote(
          noteElement,
          measureBarMapping.neume as MeasureBar,
        );
      }

      const isonMapping = neumeKeyboard.findIsonMapping(
        event,
        keyboardModifier.value,
      );

      if (isonMapping != null) {
        handled = true;
        throttled.setIson(noteElement, isonMapping.neume as Ison);
      }

      if (
        keyboardModifier.value == null &&
        neumeKeyboard.isMartyria(event.code)
      ) {
        throttled.addAutoMartyria();
      } else if (
        keyboardModifier.value == null &&
        neumeKeyboard.isKlasma(event.code)
      ) {
        throttled.setKlasma(noteElement);
      } else if (
        keyboardModifier.value == null &&
        neumeKeyboard.isNoteIndicator(event.code)
      ) {
        throttled.updateNoteAndSave(noteElement, {
          noteIndicator: !noteElement.noteIndicator,
        });
      }
    } else if (
      selectedElement.value.elementType === ElementType.Martyria &&
      !event.repeat
    ) {
      const martyriaElement = selectedElement.value as MartyriaElement;

      const fthoraMapping = neumeKeyboard.findFthoraMapping(
        event,
        keyboardModifier.value,
      );

      if (fthoraMapping != null) {
        handled = true;
        throttled.setFthoraMartyria(
          martyriaElement,
          fthoraMapping.neumes![0] as Fthora,
        );
      }

      const tempoMapping = neumeKeyboard.findMartyriaTempoMapping(
        event,
        keyboardModifier.value,
      );

      if (tempoMapping != null) {
        handled = true;
        throttled.setMartyriaTempo(
          martyriaElement,
          tempoMapping.neume as TempoSign,
        );
      }

      const measureBarMapping = neumeKeyboard.findMeasureBarMapping(
        event,
        keyboardModifier.value,
      );

      if (measureBarMapping != null) {
        handled = true;
        throttled.setMeasureBarMartyria(
          martyriaElement,
          measureBarMapping.neume as MeasureBar,
        );
      }

      const martyriaConfigMapping = neumeKeyboard.findMartyriaConfigMapping(
        event,
        keyboardModifier.value,
      );

      if (martyriaConfigMapping != null) {
        handled = true;

        if (martyriaConfigMapping.note != null) {
          // This case will not currently happen
          // because no keyboard mapping exist for it
          throttled.updateMartyria(martyriaElement, {
            note: martyriaConfigMapping.note,
            auto: false,
          });
        } else if (martyriaConfigMapping.scale != null) {
          if (martyriaElement.scale !== martyriaConfigMapping.scale) {
            throttled.updateMartyria(martyriaElement, {
              scale: martyriaConfigMapping.scale,
              auto: false,
            });
          }
        } else if (martyriaConfigMapping.martyriaAlignmentToggle === true) {
          throttled.updateMartyria(martyriaElement, {
            alignRight: !martyriaElement.alignRight,
          });
        } else if (martyriaConfigMapping.martyriaAutoToggle === true) {
          throttled.updateMartyria(martyriaElement, {
            auto: !martyriaElement.auto,
          });
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
        if (!rtl.value) {
          throttled.moveToNextLyricBox();
        } else {
          throttled.moveToPreviousLyricBox();
        }
        handled = true;
      } else if (
        !rtl.value &&
        getCursorPosition() === getLyricLength(selectedLyrics.value!)
      ) {
        throttled.moveToNextLyricBox();
        handled = true;
      } else if (rtl.value && getCursorPosition() === 0) {
        throttled.moveToPreviousLyricBox();
        handled = true;
      }
      break;
    case 'ArrowLeft':
      if (event.shiftKey) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        if (!rtl.value) {
          throttled.moveToPreviousLyricBox();
        } else {
          throttled.moveToNextLyricBox();
        }
        handled = true;
      } else if (!rtl.value && getCursorPosition() === 0) {
        throttled.moveToPreviousLyricBox();
        handled = true;
      } else if (
        rtl.value &&
        getCursorPosition() === getLyricLength(selectedLyrics.value!)
      ) {
        throttled.moveToNextLyricBox();
        handled = true;
      }
      break;
    case 'ArrowUp':
      if (event.shiftKey) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        selectedElement.value = selectedLyrics.value;
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
        throttled.moveToNextLyricBox(true);
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
        getCursorPosition() === getLyricLength(selectedLyrics.value!)
      ) {
        if (getNextLyricBoxIndex() >= 0) {
          throttled.moveToNextLyricBox();
        } else {
          // If this is the last lyric box, blur
          // so that the melisma is registered and
          // the user doesn't accidentally type more
          // characters into box
          const index = elements.value.indexOf(selectedLyrics.value!);
          getTemplateRef<InstanceType<typeof ContentEditable>[]>(
            `lyrics-${index}`,
          )[0].blur();
        }
      }

      handled = true;
      break;
    }
    case 'KeyJ': {
      if (!rtl.value) {
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
        getCursorPosition() === getLyricLength(selectedLyrics.value!)
      ) {
        if (getNextLyricBoxIndex() >= 0) {
          throttled.moveToNextLyricBox();
        } else {
          // If this is the last lyric box, blur
          // so that the melisma is registered and
          // the user doesn't accidentally type more
          // characters into box
          const index = elements.value.indexOf(selectedLyrics.value!);
          getTemplateRef<InstanceType<typeof ContentEditable>[]>(
            `lyrics-${index}`,
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
}

function onKeydownDropCap(event: KeyboardEvent) {
  let handled = false;

  const index = elements.value.indexOf(selectedElement.value!);
  const htmlElement = getTemplateRef<InstanceType<typeof DropCap>[]>(
    `element-${index}`,
  )[0];

  switch (event.code) {
    case 'Enter':
      // Do not allow enter key in drop caps
      handled = true;
      break;
    case 'Tab':
      throttled.moveRight();
      handled = true;
      break;
    case 'ArrowLeft':
      if (!rtl.value && getCursorPosition() === 0) {
        throttled.moveLeft();
        handled = true;
      } else if (
        rtl.value &&
        getCursorPosition() === htmlElement.textElement.getInnerText().length
      ) {
        throttled.moveRight();
        handled = true;
      }
      break;
    case 'ArrowRight':
      if (
        !rtl.value &&
        getCursorPosition() === htmlElement.textElement.getInnerText().length
      ) {
        throttled.moveRight();
        handled = true;
      } else if (rtl.value && getCursorPosition() === 0) {
        throttled.moveLeft();
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

  const index = elements.value.indexOf(selectedElement.value!);
  const htmlElement = getTemplateRef<InstanceType<typeof TextBox>[]>(
    `element-${index}`,
  )[0];

  switch (event.code) {
    case 'Tab':
      throttled.moveRight();
      handled = true;
      break;
    case 'ArrowLeft':
      if (!rtl.value && getCursorPosition() === 0) {
        throttled.moveLeft();
        handled = true;
      } else if (
        rtl.value &&
        getCursorPosition() ===
          htmlElement.getTextElement().getInnerText().length
      ) {
        throttled.moveRight();
        handled = true;
      }
      break;
    case 'ArrowRight':
      if (
        !rtl.value &&
        getCursorPosition() ===
          htmlElement.getTextElement().getInnerText().length
      ) {
        throttled.moveRight();
        handled = true;
      } else if (rtl.value && getCursorPosition() === 0) {
        throttled.moveLeft();
        handled = true;
      }
      break;
  }

  if (handled) {
    event.preventDefault();
  }
}

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

  if (keyboardModifier.value === event.code) {
    keyboardModifier.value = null;
    handled = true;
  }

  if (handled) {
    event.preventDefault();
  }
}

function onCutScoreElements() {
  if (selectionRange.value != null) {
    const start = Math.min(
      selectionRange.value.start,
      selectionRange.value.end,
    );

    const elementsToCut = elements.value.filter(
      (x) => x.elementType != ElementType.Empty && isSelected(x),
    );

    clipboard.value = elementsToCut.map((x) => x.clone());

    commandService.value.executeAsBatch(
      elementsToCut.map((element) =>
        scoreElementCommandFactory.create('remove-from-collection', {
          element,
          collection: elements.value,
        }),
      ),
    );

    refreshStaffLyrics();

    selectedElement.value =
      elements.value[Math.min(start, elements.value.length - 1)];

    save();
  } else if (
    selectedElement.value != null &&
    selectedElement.value.elementType !== ElementType.Empty
  ) {
    const currentIndex = selectedElementIndex.value;

    clipboard.value = [selectedElement.value.clone()];

    removeScoreElement(selectedElement.value);

    selectedElement.value =
      elements.value[Math.min(currentIndex, elements.value.length - 1)];

    save();
  }
}

function onCopyScoreElements() {
  if (selectionRange.value != null) {
    clipboard.value = elements.value
      .filter((x) => x.elementType != ElementType.Empty && isSelected(x))
      .map((x) => x.clone());
  } else if (
    selectedElement.value != null &&
    selectedElement.value.elementType !== ElementType.Empty
  ) {
    clipboard.value = [selectedElement.value.clone()];
  }
}

function onPasteScoreElements(includeLyrics: boolean) {
  if (clipboard.value.length > 0 && selectedElement.value != null) {
    switch (entryMode.value) {
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
  if (selectedElement.value == null || clipboard.value.length === 0) {
    return;
  }

  const insertAtIndex = isLastElement(selectedElement.value)
    ? selectedElementIndex.value
    : selectedElementIndex.value + 1;

  const newElements = clipboard.value.map((x) => x.clone({ includeLyrics }));

  addScoreElements(newElements, insertAtIndex);

  selectedElement.value = newElements.at(-1)!;
  save();
}

function onPasteScoreElementsEdit(includeLyrics: boolean) {
  if (selectedElement.value == null || clipboard.value.length === 0) {
    return;
  }

  const commands: Command[] = [];

  let currentIndex = selectedElementIndex.value;

  for (const clipboardElement of clipboard.value) {
    const currentElement = elements.value[currentIndex];

    if (currentIndex >= elements.value.length - 1) {
      commands.push(
        scoreElementCommandFactory.create('add-to-collection', {
          elements: [clipboardElement.clone({ includeLyrics })],
          collection: elements.value,
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
            collection: elements.value,
            replaceAtIndex: currentIndex,
          }),
        );
      }
    }

    currentIndex++;
  }

  if (commands.length > 1) {
    commandService.value.executeAsBatch(commands);
    refreshStaffLyrics();
  } else if (commands.length === 1) {
    commandService.value.execute(commands[0]);
    refreshStaffLyrics();
  }

  save();
}

function onPasteScoreElementsAuto(includeLyrics: boolean) {
  moveRight();
  const currentIndex = selectedElementIndex.value;

  onPasteScoreElementsEdit(includeLyrics);

  // Set the selected element to the last element that was pasted
  selectedElement.value =
    elements.value[currentIndex + clipboard.value.length - 1];
}

function getLyricLength(element: NoteElement) {
  return getTemplateRef<InstanceType<typeof ContentEditable>[]>(
    `lyrics-${elements.value.indexOf(element)}`,
  )[0].getInnerText().length;
}

function moveLeft() {
  let index = -1;

  if (selectedElement.value) {
    index = elements.value.indexOf(selectedElement.value);
  } else if (selectionRange.value) {
    index = selectionRange.value.end;
  }

  if (
    index - 1 >= 0 &&
    navigableElements.includes(elements.value[index - 1].elementType)
  ) {
    // If the currently selected element is a drop cap or text box, blur it first
    if (selectedElement.value?.elementType === ElementType.DropCap) {
      getTemplateRef<InstanceType<typeof DropCap>[]>(
        `element-${index}`,
      )[0].blur();
    } else if (selectedElement.value?.elementType === ElementType.TextBox) {
      getTemplateRef<InstanceType<typeof TextBox>[]>(
        `element-${index}`,
      )[0].blur();
    }

    selectedElement.value = elements.value[index - 1];

    // If the newly selected element is a drop cap or text box, focus it
    if (selectedElement.value.elementType === ElementType.DropCap) {
      getTemplateRef<InstanceType<typeof DropCap>[]>(
        `element-${index - 1}`,
      )[0].focus();
    } else if (selectedElement.value.elementType === ElementType.TextBox) {
      getTemplateRef<InstanceType<typeof TextBox>[]>(
        `element-${index - 1}`,
      )[0].focus();
    }

    return true;
  }

  return false;
}

function moveRight() {
  let index = -1;

  if (selectedElement.value) {
    index = elements.value.indexOf(selectedElement.value);
  } else if (selectionRange.value) {
    index = selectionRange.value.end;
  }

  if (
    index >= 0 &&
    index + 1 < elements.value.length &&
    navigableElements.includes(elements.value[index + 1].elementType)
  ) {
    // If the currently selected element is a drop cap, blur it first
    if (selectedElement.value?.elementType === ElementType.DropCap) {
      getTemplateRef<InstanceType<typeof DropCap>[]>(
        `element-${index}`,
      )[0].blur();
    } else if (selectedElement.value?.elementType === ElementType.TextBox) {
      getTemplateRef<InstanceType<typeof TextBox>[]>(
        `element-${index}`,
      )[0].blur();
    }

    selectedElement.value = elements.value[index + 1];

    // If the newly selected element is a drop cap, focus it
    if (selectedElement.value.elementType === ElementType.DropCap) {
      getTemplateRef<InstanceType<typeof DropCap>[]>(
        `element-${index + 1}`,
      )[0].focus();
    } else if (selectedElement.value.elementType === ElementType.TextBox) {
      getTemplateRef<InstanceType<typeof TextBox>[]>(
        `element-${index + 1}`,
      )[0].focus();
    }

    return true;
  }

  return false;
}

function moveSelectionLeft() {
  if (selectionRange.value != null) {
    if (
      selectionRange.value.end > 0 &&
      navigableElements.includes(
        elements.value[selectionRange.value.end - 1].elementType,
      )
    ) {
      setSelectionRange(elements.value[selectionRange.value.end - 1]);
    }
  } else if (
    selectedElement.value != null &&
    selectedElementIndex.value > 0 &&
    navigableElements.includes(
      elements.value[selectedElementIndex.value - 1].elementType,
    )
  ) {
    setSelectionRange(elements.value[selectedElementIndex.value - 1]);
  }
}

function moveSelectionRight() {
  if (selectionRange.value != null) {
    if (
      selectionRange.value.end + 1 < elements.value.length - 1 &&
      navigableElements.includes(
        elements.value[selectionRange.value.end + 1].elementType,
      )
    ) {
      setSelectionRange(elements.value[selectionRange.value.end + 1]);
    }
  } else if (
    selectedElement.value != null &&
    selectedElementIndex.value + 1 < elements.value.length - 1 &&
    navigableElements.includes(
      elements.value[selectedElementIndex.value + 1].elementType,
    )
  ) {
    setSelectionRange(elements.value[selectedElementIndex.value + 1]);
  }
}

function getNextLyricBoxIndex() {
  if (selectedLyrics.value) {
    const currentIndex = elements.value.indexOf(selectedLyrics.value);

    // Find the index of the next note
    for (let i = currentIndex + 1; i < elements.value.length; i++) {
      if (elements.value[i].elementType === ElementType.Note) {
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

    const noteElement = selectedLyrics.value!;

    const text = getTemplateRef<InstanceType<typeof ContentEditable>[]>(
      `lyrics-${elements.value.indexOf(noteElement)}`,
    )[0].getInnerText();

    updateLyrics(noteElement, text, clearMelisma);

    nextTick(() => {
      focusLyrics(nextIndex, true);
    });

    return true;
  }

  return false;
}

function moveToPreviousLyricBox() {
  if (selectedLyrics.value) {
    const currentIndex = elements.value.indexOf(selectedLyrics.value);
    let nextIndex = -1;

    // Find the index of the previous note
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (elements.value[i].elementType === ElementType.Note) {
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

  for (let pageIndex = 0; pageIndex < pageCount.value; pageIndex++) {
    const rect = (pagesRef.value as Element[])[
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
    currentPageNumber.value = maxPercentageIndex + 1;
  }
}

function save(markUnsavedChanges: boolean = true) {
  if (markUnsavedChanges) {
    hasUnsavedChanges.value = true;
  }

  // Save the indexes of the visible pages
  const visiblePages = pages.value
    .map((_, i) => i)
    .filter((i) => pages.value[i].isVisible);

  const processedPages = LayoutService.processPages(
    toRaw(selectedWorkspace.value),
  );

  // Set page visibility for the newly processed pages
  processedPages.forEach(
    (x, index) => (x.isVisible = visiblePages.includes(index)),
  );

  // Only re-render elements that are visible and that have been updated by processPages
  processedPages
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
  score.value.headersAndFooters
    .filter((x) => x.updated)
    .forEach((element) => {
      element.keyHelper++;
    });

  pages.value = processedPages;

  // If using the browser, save the workspace to local storage
  if (isBrowser.value) {
    const workspaceLocalStorage = {
      id: selectedWorkspace.value.id,
      score: JSON.stringify(SaveService.SaveScoreToJson(score.value)),
      filePath: currentFilePath.value,
      tempFileName: selectedWorkspace.value.tempFileName,
      hasUnsavedChanges: hasUnsavedChanges.value,
    } as WorkspaceLocalStorage;

    localStorage.setItem(
      `workspace-${selectedWorkspace.value.id}`,
      JSON.stringify(workspaceLocalStorage),
    );
  } else if (isDevelopment.value) {
    localStorage.setItem(
      'score',
      JSON.stringify(SaveService.SaveScoreToJson(score.value)),
    );

    if (currentFilePath.value != null) {
      localStorage.setItem('filePath', currentFilePath.value);
    } else {
      localStorage.removeItem('filePath');
    }

    localStorage.setItem(
      'hasUnsavedChanges',
      hasUnsavedChanges.value.toString(),
    );
  }
}

async function load() {
  if (isBrowser.value) {
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

    if (workspaces.value.length > 0) {
      selectedWorkspace.value = workspaces.value[0] as Workspace;
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
      removeWorkspace(selectedWorkspace.value);
    }
  }

  if (openWorkspaceResults.silentHtml) {
    for (const file of openWorkspaceResults.files.filter((x) => x.success)) {
      openScore(file);
      await onFileMenuExportAsHtml();
      removeWorkspace(selectedWorkspace.value);
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
        selectedWorkspace.value,
        JSON.stringify(
          latexExporter.export(pages.value, score.value.pageSetup, options),
          null,
          2,
        ),
      );
      removeWorkspace(selectedWorkspace.value);
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

  if (isDevelopment.value) {
    const scoreString = localStorage.getItem('score');

    if (scoreString) {
      const score: Score = SaveService.LoadScoreFromJson(
        JSON.parse(scoreString),
      );
      currentFilePath.value = localStorage.getItem('filePath');
      hasUnsavedChanges.value =
        localStorage.getItem('hasUnsavedChanges') === 'true';

      workspace.score = score;
    }
  }

  selectedWorkspace.value = workspace;

  selectedElement.value =
    score.value.staff.elements[score.value.staff.elements.length - 1];

  pages.value = LayoutService.processPages(selectedWorkspace.value);
}

async function saveWorkspace(workspace: Workspace) {
  if (!lyricsLocked.value) {
    lyrics.value = lyricService.extractLyrics(
      elements.value,
      score.value.pageSetup.disableGreekMelismata,
    );
  }

  return await ipcService.saveWorkspace(workspace);
}

async function saveWorkspaceAs(workspace: Workspace) {
  if (!lyricsLocked.value) {
    lyrics.value = lyricService.extractLyrics(
      elements.value,
      score.value.pageSetup.disableGreekMelismata,
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
    if (isBrowser.value) {
      localStorage.removeItem(`workspace-${workspace.id}`);
    }

    // If the last tab has closed, then exit
    if (workspaces.value.length == 1) {
      await ipcService.exitApplication();
    }

    removeWorkspace(workspace);
  }

  return shouldClose;
}

async function onCloseWorkspaces(args: CloseWorkspacesArgs) {
  const workspacesToClose: Workspace[] = workspaces.value.filter(
    (workspace) => {
      const index: number = tabs.value.findIndex((x) => x.key === workspace.id);

      const pivot: number = args.workspaceId
        ? tabs.value.findIndex((x) => x.key === args.workspaceId)
        : tabs.value.findIndex((x) => x.key === selectedWorkspace.value.id);

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
  const unsavedWorkspaces = workspaces.value.filter(
    (x) => x.hasUnsavedChanges,
  ) as Workspace[];

  for (const workspace of unsavedWorkspaces) {
    if (!(await closeWorkspace(workspace))) {
      await ipcService.cancelExit();
      return false;
    }
  }

  await ipcService.exitApplication();
}

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

function addScoreElement(
  element: ScoreElement,
  insertAtIndex?: number,
  collection?: ScoreElement[],
) {
  commandService.value.execute(
    scoreElementCommandFactory.create('add-to-collection', {
      elements: [element],
      collection: collection ?? elements.value,
      insertAtIndex,
    }),
  );

  refreshStaffLyrics();
}

function addScoreElements(newElements: ScoreElement[], insertAtIndex?: number) {
  commandService.value.execute(
    scoreElementCommandFactory.create('add-to-collection', {
      elements: newElements,
      collection: elements.value,
      insertAtIndex,
    }),
  );

  refreshStaffLyrics();
}

function replaceScoreElement(element: ScoreElement, replaceAtIndex: number) {
  commandService.value.execute(
    scoreElementCommandFactory.create('replace-element-in-collection', {
      element,
      collection: elements.value,
      replaceAtIndex,
    }),
  );

  refreshStaffLyrics();
}

function removeScoreElement(
  element: ScoreElement,
  collection?: ScoreElement[],
) {
  commandService.value.execute(
    scoreElementCommandFactory.create('remove-from-collection', {
      element,
      collection: collection ?? elements.value,
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
  commandService.value.execute(
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

  updateNote(element, {
    secondaryFthora,
    secondaryChromaticFthoraNote,
  });
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
      const previousElement = elements.value[index - 1];

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
  lyricsLocked.value = locked;
  hasUnsavedChanges.value = true;
}

function updateStaffLyrics(staffLyrics: string) {
  lyrics.value = staffLyrics;
  throttled.assignLyrics();
  hasUnsavedChanges.value = true;
}

function assignLyrics() {
  const updateCommands: Command[] = [];

  lyricService.assignLyrics(
    lyrics.value,
    elements.value,
    rtl.value,
    score.value.pageSetup.disableGreekMelismata,
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
    commandService.value.executeAsBatch(updateCommands, lyricsLocked.value);
    save();
  }
}

function assignAcceptsLyricsFromCurrentLyrics() {
  const commands: Command[] = [];

  lyricService.assignAcceptsLyricsFromCurrentLyrics(
    elements.value,
    score.value.pageSetup.disableGreekMelismata,
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
    commandService.value.executeAsBatch(commands);
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
    elements.value,
    rtl.value,
    (note, lyrics) => setLyrics(getElementIndex(note), lyrics),
    clearMelisma,
  );

  if (newValues != null) {
    commandService.value.execute(
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
  if (lyricsLocked.value) {
    assignLyrics();
  } else if (lyricManagerIsOpen.value) {
    lyrics.value = lyricService.extractLyrics(
      elements.value,
      score.value.pageSetup.disableGreekMelismata,
    );
  }
}

function updateAnnotation(
  element: AnnotationElement,
  newValues: Partial<AnnotationElement>,
) {
  commandService.value.execute(
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
  commandService.value.execute(
    annotationCommandFactory.create('remove-from-collection', {
      element: annotation,
      collection: note.annotations,
    }),
    noHistory,
  );

  selectedWorkspace.value.selectedAnnotationElement = null;

  save();
}

function updateAlternateLine(
  element: AlternateLineElement,
  newValues: Partial<AlternateLineElement>,
) {
  commandService.value.execute(
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
  commandService.value.execute(
    alternateLineCommandFactory.create('remove-from-collection', {
      element: annotation,
      collection: note.alternateLines,
    }),
    noHistory,
  );

  selectedWorkspace.value.selectedAlternateLineElement = null;

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

  commandService.value.execute(
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
  richTextBoxCalculationCount.value++;
  saveDebounced(false);
}

function updateTextBox(
  element: TextBoxElement,
  newValues: Partial<TextBoxElement>,
) {
  const noHistory =
    Object.keys(newValues).length === 1 && 'height' in newValues;

  commandService.value.execute(
    textBoxCommandFactory.create('update-properties', {
      target: element,
      newValues: newValues,
    }),
    noHistory,
  );

  save(!noHistory);
}

function updateTextBoxHeight(element: TextBoxElement, height: number) {
  // The height could be updated by many text box elements at once
  // (e.g. if PageSetup changes) so we debounce the save.
  element.height = height;
  textBoxCalculationCount.value++;
  saveDebounced(false);
}

function updateModeKey(
  element: ModeKeyElement,
  newValues: Partial<ModeKeyElement>,
) {
  commandService.value.execute(
    modeKeyCommandFactory.create('update-properties', {
      target: element,
      newValues: newValues,
    }),
  );

  save();
}

function updateModeKeyTempo(element: ModeKeyElement, tempo: TempoSign | null) {
  let bpm = element.bpm;

  if (tempo != null) {
    bpm =
      editorPreferences.value.getDefaultTempo(tempo) ??
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
  const values =
    newValues.alignRight !== undefined &&
    newValues.alignRight !== element.alignRight
      ? { ...newValues, quantitativeNeume: null }
      : newValues;

  commandService.value.execute(
    martyriaCommandFactory.create('update-properties', {
      target: element,
      newValues: values,
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
      editorPreferences.value.getDefaultTempo(tempoLeft) ??
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
      editorPreferences.value.getDefaultTempo(tempo) ??
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
      editorPreferences.value.getDefaultTempo(tempoRight) ??
      TempoElement.getDefaultBpm(tempoRight);
  }

  updateMartyria(element, {
    tempoRight,
    bpm,
    tempoLeft: null,
    tempo: null,
  });
}

function updateTempo(element: TempoElement, newValues: Partial<TempoElement>) {
  commandService.value.execute(
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
  commandService.value.execute(
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
    const index = elements.value.indexOf(element);

    if (index > -1) {
      if (selectedElement.value === element) {
        selectedElement.value = null;
      }

      removeScoreElement(element);
    }
  } else if (element.content !== content) {
    commandService.value.execute(
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
  commandService.value.execute(
    imageBoxCommandFactory.create('update-properties', {
      target: element,
      newValues: newValues,
    }),
  );

  save();
}

function deleteSelectedElement() {
  if (
    selectedWorkspace.value.selectedAnnotationElement != null &&
    selectedElement.value?.elementType === ElementType.Note
  ) {
    removeAnnotation(
      selectedElement.value as NoteElement,
      selectedWorkspace.value.selectedAnnotationElement,
    );

    return;
  }

  if (
    selectedWorkspace.value.selectedAlternateLineElement != null &&
    selectedElement.value?.elementType === ElementType.Note
  ) {
    removeAlternateLine(
      selectedElement.value as NoteElement,
      selectedWorkspace.value.selectedAlternateLineElement,
    );

    return;
  }

  if (selectedElement.value != null && !isLastElement(selectedElement.value)) {
    const index = selectedElementIndex.value;

    removeScoreElement(selectedElement.value);

    selectedElement.value = elements.value[index];

    save();
  } else if (selectionRange.value != null) {
    const elementsToDelete = elements.value.filter(
      (x) => x.elementType != ElementType.Empty && isSelected(x),
    );

    commandService.value.executeAsBatch(
      elementsToDelete.map((element) =>
        scoreElementCommandFactory.create('remove-from-collection', {
          element,
          collection: elements.value,
        }),
      ),
    );

    refreshStaffLyrics();

    const start = Math.min(
      selectionRange.value.start,
      selectionRange.value.end,
    );

    selectedElement.value =
      elements.value[Math.min(start, elements.value.length - 1)];

    save();
  }
}

function deletePreviousElement() {
  if (selectedWorkspace.value.selectedAlternateLineElement) {
    const alternateLineElements =
      selectedWorkspace.value.selectedAlternateLineElement.elements;
    removeScoreElement(
      alternateLineElements[alternateLineElements.length - 1],
      alternateLineElements,
    );

    return;
  }

  if (
    selectedElement.value &&
    selectedElementIndex.value > 0 &&
    navigableElements.includes(
      elements.value[selectedElementIndex.value - 1].elementType,
    )
  ) {
    removeScoreElement(elements.value[selectedElementIndex.value - 1]);

    save();
  }
}

function updatePageSetup(pageSetup: PageSetup) {
  const needToRecalcRichTextBoxes =
    pageSetup.textBoxDefaultFontFamily !=
      score.value.pageSetup.textBoxDefaultFontFamily ||
    pageSetup.textBoxDefaultFontSize !=
      score.value.pageSetup.textBoxDefaultFontSize;

  const updateCommands: Command[] = [
    pageSetupCommandFactory.create('update-properties', {
      target: score.value.pageSetup,
      newValues: pageSetup,
    }),
  ];

  if (pageSetup.richHeaderFooter && !score.value.pageSetup.richHeaderFooter) {
    updateCommands.push(
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.headers.default.elements,
        element: createRichHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.headers.even.elements,
        element: createRichHeaderFooter('$p', 'Title', ''),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.headers.firstPage.elements,
        element: createRichHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.headers.odd.elements,
        element: createRichHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.footers.default.elements,
        element: createRichHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.footers.even.elements,
        element: createRichHeaderFooter('$p', 'Footer', ''),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.footers.firstPage.elements,
        element: createRichHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.footers.odd.elements,
        element: createRichHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
    );
  } else if (
    !pageSetup.richHeaderFooter &&
    score.value.pageSetup.richHeaderFooter
  ) {
    updateCommands.push(
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.headers.default.elements,
        element: createRegularHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.headers.even.elements,
        element: createRegularHeaderFooter('$p', 'Title', ''),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.headers.firstPage.elements,
        element: createRegularHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.headers.odd.elements,
        element: createRegularHeaderFooter('', 'Title', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.footers.default.elements,
        element: createRegularHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.footers.even.elements,
        element: createRegularHeaderFooter('$p', 'Footer', ''),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.footers.firstPage.elements,
        element: createRegularHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
      scoreElementCommandFactory.create('replace-element-in-collection', {
        collection: score.value.footers.odd.elements,
        element: createRegularHeaderFooter('', 'Footer', '$p'),
        replaceAtIndex: 0,
      }),
    );
  }

  commandService.value.executeAsBatch(updateCommands);

  if (needToRecalcRichTextBoxes) {
    recalculateRichTextBoxHeights();
    recalculateTextBoxHeights();
  }

  save();
}

function updatePageSetupUseOptionalDiatonicFthoras(
  useOptionalDiatonicFthoras: boolean,
) {
  commandService.value.execute(
    pageSetupCommandFactory.create('update-properties', {
      target: score.value.pageSetup,
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
  entryMode.value = mode;
}

function updateZoom(newZoom: number) {
  if (newZoom < 0.5 || newZoom > 5) {
    toast.error('Range overflow', {
      description: t(($) => $.toolbar.main.invalidZoom, { ns: 'toolbar' }),
    });
  } else {
    zoom.value = newZoom;
    zoomToFit.value = false;
  }
}

function updateZoomToFit(value: boolean) {
  zoomToFit.value = value;

  if (value) {
    performZoomToFit();
  }
}

function performZoomToFit() {
  const pageBackgroundElement = pageBackgroundRef.value!;

  const computedStyle = getComputedStyle(pageBackgroundElement);

  const availableWidth =
    pageBackgroundElement.clientWidth -
    parseFloat(computedStyle.paddingLeft) -
    parseFloat(computedStyle.paddingRight);

  zoom.value = availableWidth / score.value.pageSetup.pageWidth;
}

async function playAudio() {
  try {
    if (audioService.state === AudioState.Stopped) {
      playbackEvents.value = playbackService.computePlaybackSequence(
        elements.value,
        audioOptions,
        score.value.pageSetup.chrysanthineAccidentals,
      );

      if (playbackEvents.value.length === 0) {
        return;
      }

      const startAt = playbackEvents.value.find(
        (x) => x.elementIndex >= selectedElementIndex.value,
      );

      await audioService.play(playbackEvents.value, audioOptions, startAt);

      if (startAt) {
        selectedWorkspace.value.playbackTime = startAt.absoluteTime;
      }

      startPlaybackClock();
    } else {
      pauseAudio();
    }
  } catch (error) {
    console.error(error);
  }
}

function stopAudio() {
  try {
    audioService.stop();

    playbackEvents.value = [];

    stopPlaybackClock();
  } catch (error) {
    console.error(error);
  }
}

function pauseAudio() {
  try {
    audioService.togglePause();

    if (audioService.state === AudioState.Paused) {
      audioElement.value = null;
      stopPlaybackClock();
    } else {
      startPlaybackClock();
    }
  } catch (error) {
    console.error(error);
  }
}

function startPlaybackClock() {
  stopPlaybackClock();

  playbackTimeInterval.value = setInterval(() => {
    selectedWorkspace.value.playbackTime += 0.1;
  }, 100);
}

function stopPlaybackClock() {
  if (playbackTimeInterval.value != null) {
    clearInterval(playbackTimeInterval.value);
  }
}

async function playTestTone() {
  try {
    await audioService.playTestTone(audioOptions.frequencyDi);
  } catch (error) {
    console.error(error);
  }
}

function updateAudioOptionsSpeed(speed: number) {
  if (audioService.state === AudioState.Paused) {
    stopAudio();
  }

  speed = Math.max(0.1, speed);
  speed = Math.min(3, speed);
  speed = +speed.toFixed(2);

  selectedWorkspace.value.playbackBpm /= audioOptions.speed;
  selectedWorkspace.value.playbackBpm *= speed;

  audioOptions.speed = speed;

  saveAudioOptions();
}

function saveAudioOptions() {
  localStorage.setItem('audioOptionsDefault', JSON.stringify(audioOptions));
}

function onAudioServiceEventPlay(event: PlaybackSequenceEvent) {
  if (audioService.state === AudioState.Playing) {
    selectedWorkspace.value.playbackTime = event.absoluteTime;
    selectedWorkspace.value.playbackBpm = event.bpm;

    audioElement.value = elements.value[event.elementIndex];

    // Scroll the currently playing element into view
    const lyrics = getTemplateRef<InstanceType<typeof ContentEditable>[]>(
      `lyrics-${event.elementIndex}`,
    )[0];

    const neumeBox = getTemplateRef<any[]>(`element-${event.elementIndex}`)[0];

    if ((lyrics?.htmlElement as any)?.scrollIntoViewIfNeeded) {
      (lyrics?.htmlElement as any).scrollIntoViewIfNeeded(false);
    }

    if (neumeBox?.scrollIntoViewIfNeeded) {
      neumeBox.scrollIntoViewIfNeeded(false);
    }
  }
}

function onAudioServiceStop() {
  audioElement.value = null;

  stopPlaybackClock();
}

function recalculateRichTextBoxHeights() {
  if (richTextBoxCalculation.value) {
    richTextBoxCalculation.value = false;
  }

  nextTick(async () => {
    const expectedCount = resizableRichTextBoxElements.value.length;
    richTextBoxCalculationCount.value = 0;
    richTextBoxCalculation.value = true;

    const maxTries = 4 * 30; // 30 seconds
    let tries = 1;
    let lastCount = 0;

    // Wait until all rich text boxes have updated
    const poll = (resolve: (value: unknown) => void) => {
      if (
        richTextBoxCalculationCount.value === expectedCount ||
        tries >= maxTries ||
        richTextBoxCalculationCount.value < lastCount
      ) {
        resolve(true);
      } else {
        tries++;
        lastCount = richTextBoxCalculationCount.value;
        setTimeout(() => poll(resolve), 250);
      }
    };

    await new Promise(poll);

    richTextBoxCalculation.value = false;
    saveDebounced(false);
  });
}

function recalculateTextBoxHeights() {
  if (textBoxCalculation.value) {
    textBoxCalculation.value = false;
  }

  nextTick(async () => {
    const expectedCount = resizableTextBoxElements.value.length;
    textBoxCalculationCount.value = 0;
    textBoxCalculation.value = true;

    const maxTries = 4 * 30; // 30 seconds
    let tries = 1;
    let lastCount = 0;

    // Wait until all text boxes have updated
    const poll = (resolve: (value: unknown) => void) => {
      if (
        textBoxCalculationCount.value === expectedCount ||
        tries >= maxTries ||
        textBoxCalculationCount.value < lastCount
      ) {
        resolve(true);
      } else {
        tries++;
        lastCount = textBoxCalculationCount.value;
        setTimeout(() => poll(resolve), 250);
      }
    };

    await new Promise(poll);

    textBoxCalculation.value = false;
    saveDebounced(false);
  });
}

function onFileMenuNewScore() {
  const workspace = new Workspace();
  workspace.tempFileName = getTempFilename();
  workspace.score = createDefaultScore();

  addWorkspace(workspace);

  selectedWorkspace.value = workspace;

  selectedElement.value =
    score.value.staff.elements[score.value.staff.elements.length - 1];
  save(false);
}

async function onFileMenuOpenScore(args: FileMenuOpenScoreArgs) {
  if (!dialogOpen.value && args.success) {
    openScore(args);
  }
}

function onFileMenuImportOcr(args: FileMenuImportOcrArgs) {
  if (!dialogOpen.value && args.success) {
    try {
      const elements = ocrImporter.import(args.data);

      const workspace = new Workspace();
      workspace.tempFileName = getTempFilename();
      workspace.score = new Score();

      addWorkspace(workspace);

      selectedWorkspace.value = workspace;

      currentFilePath.value = null;
      score.value.staff.elements.unshift(...elements);

      save();
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        if (ipcService.isShowMessageBoxSupported()) {
          ipcService.showMessageBox({
            type: 'error',
            title: 'OCR import failed',
            message: error.message,
          });
        } else {
          alert(error.message);
        }
      }
    }
  }
}

function onFileMenuPageSetup() {
  pageSetupDialogIsOpen.value = true;
}

async function onFileMenuPrint() {
  printMode.value = true;

  // Blur the active element so that focus outlines and
  // blinking cursors don't show up in the printed page
  const activeElement = blurActiveElement();

  const previousTitle = window.document.title;
  window.document.title = getFileName(selectedWorkspace.value, false);

  nextTick(async () => {
    await ipcService.printWorkspace(selectedWorkspace.value);
    printMode.value = false;
    window.document.title = previousTitle;

    // Re-focus the active element
    focusElement(activeElement);
  });
}

async function onFileMenuExportAsPdf() {
  printMode.value = true;

  // Blur the active element so that focus outlines and
  // blinking cursors don't show up in the printed page
  const activeElement = blurActiveElement();

  const previousTitle = window.document.title;
  window.document.title = getFileName(selectedWorkspace.value, false);

  await nextTick();
  await ipcService.exportWorkspaceAsPdf(selectedWorkspace.value);
  printMode.value = false;
  window.document.title = previousTitle;

  // Re-focus the active element
  focusElement(activeElement);
}

async function onFileMenuExportAsImage() {
  exportFormat.value = ExportFormat.PNG;
  exportDialogIsOpen.value = true;
}

async function exportAsPng(args: ExportAsPngSettings) {
  let reply: ExportWorkspaceAsImageReplyArgs;

  try {
    reply = await ipcService.exportWorkspaceAsImage(
      selectedWorkspace.value,
      'png',
    );

    if (!reply.success) {
      return;
    }
  } catch (error) {
    console.error(error);
    return;
  }

  printMode.value = true;
  exportInProgress.value = true;

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

      if (args.openFolder && ipcService.isShowItemInFolderSupported()) {
        await ipcService.showItemInFolder(
          reply.filePath.replace(/\.png$/, '-1.png'),
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      printMode.value = false;
      exportInProgress.value = false;
      closeExportDialog();
      // Re-focus the active element
      focusElement(activeElement);
    }
  });
}

async function onFileMenuExportAsHtml() {
  await ipcService.exportWorkspaceAsHtml(
    selectedWorkspace.value,
    byzHtmlExporter.exportScore(score.value),
  );
}

function onFileMenuExportAsMusicXml() {
  exportFormat.value = ExportFormat.MusicXml;
  exportDialogIsOpen.value = true;
}

function onFileMenuExportAsLatex() {
  exportFormat.value = ExportFormat.Latex;
  exportDialogIsOpen.value = true;
}

async function exportAsMusicXml(args: ExportAsMusicXmlSettings) {
  await ipcService.exportWorkspaceAsMusicXml(
    selectedWorkspace.value,
    musicXmlExporter.export(score.value, args.options),
    args.compressed,
    args.openFolder && ipcService.isShowItemInFolderSupported(),
  );

  closeExportDialog();
}

async function exportAsLatex(args: ExportAsLatexSettings) {
  await ipcService.exportWorkspaceAsLatex(
    selectedWorkspace.value,
    JSON.stringify(
      latexExporter.export(pages.value, score.value.pageSetup, args.options),
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
  if (selectedElement.value?.elementType === ElementType.Note) {
    const el = new AnnotationElement();
    const fontHeight = TextMeasurementService.getFontHeight(
      score.value.pageSetup.lyricsFont,
    );
    el.x = 0;
    el.y = -fontHeight;
    (selectedElement.value as NoteElement).annotations.push(el);
    selectedWorkspace.value.selectedAnnotationElement = el;
    save();
  }
}

function onFileMenuInsertAlternateLine() {
  if (selectedElement.value?.elementType === ElementType.Note) {
    const el = new AlternateLineElement();
    const fontHeight = TextMeasurementService.getFontHeight(
      score.value.pageSetup.lyricsFont,
    );
    el.x = 0;
    el.y = -fontHeight;
    (selectedElement.value as NoteElement).alternateLines.push(el);
    selectedWorkspace.value.selectedAlternateLineElement = el;
    save();
  }
}

function onFileMenuInsertTextBox(args?: FileMenuInsertTextboxArgs) {
  const element = new TextBoxElement();
  element.inline = args?.inline ?? false;

  if (element.inline) {
    element.color = score.value.pageSetup.lyricsDefaultColor;
    element.fontFamily = score.value.pageSetup.lyricsDefaultFontFamily;
    element.fontSize = score.value.pageSetup.lyricsDefaultFontSize;
    element.strokeWidth = score.value.pageSetup.lyricsDefaultStrokeWidth;
    element.bold = score.value.pageSetup.lyricsDefaultFontWeight === '700';
    element.italic = score.value.pageSetup.lyricsDefaultFontStyle === 'italic';
  } else {
    element.color = score.value.pageSetup.textBoxDefaultColor;
    element.fontFamily = score.value.pageSetup.textBoxDefaultFontFamily;
    element.fontSize = score.value.pageSetup.textBoxDefaultFontSize;
    element.strokeWidth = score.value.pageSetup.textBoxDefaultStrokeWidth;
    element.lineHeight = score.value.pageSetup.textBoxDefaultLineHeight;
    element.bold = score.value.pageSetup.textBoxDefaultFontWeight === '700';
    element.italic = score.value.pageSetup.textBoxDefaultFontStyle === 'italic';
  }

  addScoreElement(element, selectedElementIndex.value);

  selectedElement.value = element;

  save();

  nextTick(() => {
    const index = elements.value.indexOf(element);

    getTemplateRef<any[]>(`element-${index}`)[0].focus();
  });
}

function onFileMenuInsertRichTextBox() {
  const element = new RichTextBoxElement();
  element.rtl = score.value.pageSetup.melkiteRtl;

  addScoreElement(element, selectedElementIndex.value);

  selectedElement.value = element;

  save();

  nextTick(() => {
    const index = elements.value.indexOf(element);

    getTemplateRef<any[]>(`element-${index}`)[0].focus();
  });
}

function onFileMenuInsertModeKey() {
  const element = createDefaultModeKey(score.value.pageSetup);

  addScoreElement(element, selectedElementIndex.value);

  selectedElement.value = element;

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

  addScoreElement(element, selectedElementIndex.value);

  selectedElement.value = element;

  save();
}

function onFileMenuInsertHeader() {
  if (score.value.pageSetup.showHeader) {
    return;
  }

  score.value.pageSetup.showHeader = true;

  updatePageSetup(score.value.pageSetup);
}

function onFileMenuInsertFooter() {
  if (score.value.pageSetup.showFooter) {
    return;
  }

  score.value.pageSetup.showFooter = true;

  updatePageSetup(score.value.pageSetup);
}

function onFileMenuToolsCopyElementLink() {
  if (selectedElement.value?.id != null) {
    navigator.clipboard.writeText(
      '#element-' + selectedElement.value.id.toString(),
    );
  }
}

async function onFileMenuSave() {
  const workspace = selectedWorkspace.value;

  if (workspace.filePath != null) {
    const result = await saveWorkspace(workspace);
    if (result.success) {
      workspace.hasUnsavedChanges = false;
    }
  } else {
    const result = await saveWorkspaceAs(workspace);
    if (result.success) {
      workspace.filePath = result.filePath;
      workspace.hasUnsavedChanges = false;
    }
  }
}

async function onFileMenuSaveAs() {
  const workspace = selectedWorkspace.value;

  const result = await saveWorkspaceAs(workspace);
  if (result.success) {
    workspace.filePath = result.filePath;
    workspace.hasUnsavedChanges = false;
  }
}

function onFileMenuUndo() {
  const currentIndex = selectedElementIndex.value;

  const textBoxDefaultFontFamilyPrevious =
    score.value.pageSetup.textBoxDefaultFontFamily;
  const textBoxDefaultFontSizePrevious =
    score.value.pageSetup.textBoxDefaultFontSize;

  commandService.value.undo();

  // TODO this may be overkill, but the alternative is putting in place
  // an event system to only refresh on certain undo actions
  refreshStaffLyrics();

  if (currentIndex > -1) {
    // If the selected element was removed during the undo process, choose a new one
    const clampedIndex = Math.min(currentIndex, elements.value.length - 1);

    if (selectedElement.value !== elements.value[clampedIndex]) {
      selectedElement.value = elements.value[clampedIndex];
    }

    // Undo/redo could affect the note display in the neume toolbar (among other things),
    // so we force a refresh here
    selectedElement.value.keyHelper++;
  }

  if (
    textBoxDefaultFontFamilyPrevious !=
      score.value.pageSetup.textBoxDefaultFontFamily ||
    textBoxDefaultFontSizePrevious !=
      score.value.pageSetup.textBoxDefaultFontSize
  ) {
    recalculateRichTextBoxHeights();
    recalculateTextBoxHeights();
  }

  save();
}

function onFileMenuRedo() {
  const currentIndex = selectedElementIndex.value;

  const textBoxDefaultFontFamilyPrevious =
    score.value.pageSetup.textBoxDefaultFontFamily;
  const textBoxDefaultFontSizePrevious =
    score.value.pageSetup.textBoxDefaultFontSize;

  commandService.value.redo();

  // TODO this may be overkill, but the alternative is putting in place
  // an event system to only refresh on certain undo actions
  refreshStaffLyrics();

  if (currentIndex > -1) {
    // If the selected element was removed during the redo process, choose a new one
    const clampedIndex = Math.min(currentIndex, elements.value.length - 1);

    if (selectedElement.value !== elements.value[clampedIndex]) {
      selectedElement.value = elements.value[clampedIndex];
    }

    // Undo/redo could affect the note display in the neume toolbar (among other things),
    // so we force a refresh here
    selectedElement.value.keyHelper++;
  }

  if (
    textBoxDefaultFontFamilyPrevious !=
      score.value.pageSetup.textBoxDefaultFontFamily ||
    textBoxDefaultFontSizePrevious !=
      score.value.pageSetup.textBoxDefaultFontSize
  ) {
    recalculateRichTextBoxHeights();
    recalculateTextBoxHeights();
  }

  save();
}

function onFileMenuCut() {
  if (!isTextInputFocused() && !dialogOpen.value) {
    onCutScoreElements();
  } else {
    document.execCommand('cut');
  }
}

function onFileMenuCopy() {
  if (!isTextInputFocused() && !dialogOpen.value) {
    onCopyScoreElements();
  } else {
    document.execCommand('copy');
  }
}

function onFileMenuCopyFormat() {
  if (selectedElement.value == null) {
    return;
  }

  if (selectedElement.value.elementType === ElementType.TextBox) {
    formatType.value = ElementType.TextBox;
    textBoxFormat.value = (
      selectedElement.value as TextBoxElement
    ).cloneFormat();
  } else if (selectedElement.value.elementType === ElementType.Note) {
    formatType.value = ElementType.Note;
    noteFormat.value = (selectedElement.value as NoteElement).cloneFormat();
  }
}

function onFileMenuCopyAsHtml() {
  let copiedElements: ScoreElement[] = [];

  if (selectionRange.value != null) {
    copiedElements = elements.value.filter(
      (x) => x.elementType != ElementType.Empty && isSelected(x),
    );
  } else if (selectedElement.value != null) {
    copiedElements = [selectedElement.value];
  } else if (selectedLyrics.value != null) {
    copiedElements = [selectedLyrics.value];
  }

  const html = byzHtmlExporter.exportElements(
    copiedElements,
    score.value.pageSetup,
    0,
    true,
  );

  navigator.clipboard.writeText(html);
}

function onFileMenuPaste() {
  if (!isTextInputFocused() && !dialogOpen.value) {
    onPasteScoreElements(false);
  } else {
    ipcService.paste();
  }
}

function onFileMenuPasteWithLyrics() {
  if (!isTextInputFocused() && !dialogOpen.value) {
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
      if (elements.value[i].elementType === formatType.value) {
        applyCopiedFormat(elements.value[i], commands);
      }
    }
  } else if (selectedElement.value != null) {
    applyCopiedFormat(selectedElement.value, commands);
  }

  if (commands.length > 0) {
    commandService.value.executeAsBatch(commands);
    save();
  }
}

function applyCopiedFormat(element: ScoreElement, commands: Command[]) {
  if (
    element.elementType === ElementType.TextBox &&
    textBoxFormat.value != null
  ) {
    commands.push(
      textBoxCommandFactory.create('update-properties', {
        target: element as TextBoxElement,
        newValues: textBoxFormat.value,
      }),
    );
  } else if (
    element.elementType === ElementType.Note &&
    noteFormat.value != null
  ) {
    commands.push(
      noteElementCommandFactory.create('update-properties', {
        target: element as NoteElement,
        newValues: noteFormat.value,
      }),
    );
  }
}

function onFileMenuFind() {
  if (searchTextPanelIsOpen.value) {
    searchTextRef.value!.focus();
  } else {
    searchTextPanelIsOpen.value = true;
  }
}

function onFileMenuLyrics() {
  if (!dialogOpen.value) {
    if (lyricManagerIsOpen.value) {
      closeLyricManager();
    } else {
      openLyricManager();
    }
  }
}

function onFileMenuPreferences() {
  if (!dialogOpen.value) {
    editorPreferencesDialogIsOpen.value = true;
  }
}

function onOpenAboutDialog() {
  aboutDialogIsOpen.value = true;
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

  selectedWorkspace.value = workspace;

  currentFilePath.value = null;
  score.value.staff.elements.unshift(
    ...(TestFileGenerator.generateTestFile(testFileType, fonts.value) || []),
  );
  save();
}

function onSearchText(args: { query: string; reverse?: boolean }) {
  const result = textSearchService.findTextInElements(
    args.query,
    elements.value,
    selectedElementIndex.value,
    args.reverse ?? false,
  );

  if (result != null) {
    selectedElement.value = result;

    (pagesRef.value as HTMLElement[])[
      selectedElement.value.page - 1
    ].scrollIntoView();

    pages.value[selectedElement.value.page - 1].isVisible = true;

    nextTick(() => {
      if (selectedElement.value?.elementType === ElementType.Note) {
        getTemplateRef<HTMLElement[]>(
          `element-${selectedElementIndex.value}`,
        )[0].scrollIntoView();
      } else if (selectedElement.value?.elementType === ElementType.DropCap) {
        getTemplateRef<InstanceType<typeof DropCap>[]>(
          `element-${selectedElementIndex.value}`,
        )[0].htmlElement.scrollIntoView();
      } else if (selectedElement.value?.elementType === ElementType.TextBox) {
        getTemplateRef<InstanceType<typeof TextBox>[]>(
          `element-${selectedElementIndex.value}`,
        )[0].htmlElement.scrollIntoView();
      }
    });
  }
}

function createDefaultModeKey(pageSetup: PageSetup) {
  const defaultTemplate = ModeKeyElement.createFromTemplate(
    modeKeyTemplates[0],
    score.value.pageSetup.useOptionalDiatonicFthoras,
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
  const existingWorkspace = workspaces.value.find(
    (x) => x.filePath === args.filePath,
  ) as Workspace;
  if (existingWorkspace != null) {
    selectedWorkspace.value = existingWorkspace;
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

    selectedWorkspace.value = workspace;

    selectedElement.value = null;

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
  workspaces.value.push(workspace);

  tabsRef.value!.addTab({
    label: getFileName(workspace),
    key: workspace.id,
  });
}

function removeWorkspace(workspace: Workspace) {
  const index = workspaces.value.indexOf(workspace);

  workspaces.value.splice(index, 1);

  tabsRef.value!.removeTab(workspace.id);

  if (selectedWorkspace.value === workspace) {
    if (workspaces.value.length > 0) {
      selectedWorkspace.value = workspaces.value[
        Math.min(index, workspaces.value.length - 1)
      ] as Workspace;
    } else {
      // TODO support closing all workspaces
      onFileMenuNewScore();
    }
  }
}

function onTabClosed(tab: Tab) {
  const workspace = workspaces.value.find((x) => x.id === tab.key) as Workspace;

  if (workspace) {
    // If the workspace is still in our list, then call closeWorkspace.
    // closeWorkspace will decide whether to remove the tab and will
    // explicitly call removeTab. Returning false tells the tab component
    // to not close the tab, so that we can take care of it manually.
    closeWorkspace(workspace);
    return false;
  } else {
    // If we got here, the workspace was already removed by closeWorkspace.
    // We allow the tab component to close the tab by returning true.
    return true;
  }
}

function selectContextMenuWorkspace(_event: PointerEvent, tab: Tab) {
  contextMenuWorkspaceId.value = tab.key;
}

function resetContextMenuWorkspace() {
  contextMenuWorkspaceId.value = null;
}

function onWorkspaceTabContextMenu(event: PointerEvent) {
  if (contextMenuWorkspaceId.value == null) {
    event.preventDefault();
  }
}

function closeContextMenuWorkspaces(disposition: CloseWorkspacesDisposition) {
  if (contextMenuWorkspaceId.value == null) {
    return;
  }

  void onCloseWorkspaces({
    disposition,
    workspaceId: contextMenuWorkspaceId.value,
  });
}

function renderTabLabel(tab: Tab) {
  const workspace = workspaces.value.find((x) => x.id === tab.key) as Workspace;

  return workspace ? getFileName(workspace) : '';
}
</script>

<template>
  <div class="editor">
    <div v-if="isLoading" class="loading-overlay">
      <Spinner class="size-16" />
    </div>
    <FileMenuBar v-if="showFileMenuBar" class="no-print" />
    <ToolbarMain
      :entry-mode="entryMode"
      :zoom="zoom"
      :zoom-to-fit="zoomToFit"
      :audio-state="audioService.state"
      :audio-options="audioOptions"
      :playback-time="selectedWorkspace.playbackTime"
      :playback-bpm="selectedWorkspace.playbackBpm"
      :current-page-number="currentPageNumber"
      :page-count="pageCount"
      :neume-keyboard="neumeKeyboard"
      @update:zoom="updateZoom"
      @update:zoom-to-fit="updateZoomToFit"
      @update:audio-options-speed="updateAudioOptionsSpeed"
      @add-auto-martyria="addAutoMartyria"
      @update:entry-mode="updateEntryMode"
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
          :page-setup="score.pageSetup"
          :neume-keyboard="neumeKeyboard"
          @select-neume-combo="addNeumeCombination"
          @select-quantitative-neume="addQuantitativeNeume"
        />
      </div>

      <div class="page-container">
        <ContextMenu>
          <ContextMenuTrigger
            as="div"
            @contextmenu.capture="resetContextMenuWorkspace"
            @contextmenu="onWorkspaceTabContextMenu"
          >
            <!-- @vue-ignore -->
            <Vue3TabsChrome
              ref="tabsRef"
              v-model="selectedWorkspaceId"
              class="workspace-tab-container"
              :tabs="tabs"
              :gap="0"
              :on-close="onTabClosed"
              :render-label="renderTabLabel"
              @contextmenu="selectContextMenuWorkspace"
            >
              <template #after>
                <button
                  class="workspace-tab-new-button"
                  @click="onFileMenuNewScore"
                >
                  +
                </button>
              </template></Vue3TabsChrome
            >
          </ContextMenuTrigger>
          <ContextMenuContent class="bg-legacy-chrome-menu-surface">
            <ContextMenuItem
              @select="
                closeContextMenuWorkspaces(CloseWorkspacesDisposition.SELF)
              "
            >
              <PhX />
              {{ $t(($) => $.menu.tab.close, { ns: 'menu' }) }}
            </ContextMenuItem>
            <ContextMenuItem
              @select="
                closeContextMenuWorkspaces(CloseWorkspacesDisposition.OTHERS)
              "
            >
              <PhXCircle />
              {{ $t(($) => $.menu.tab.closeOthers, { ns: 'menu' }) }}
            </ContextMenuItem>
            <ContextMenuItem
              @select="
                closeContextMenuWorkspaces(CloseWorkspacesDisposition.LEFT)
              "
            >
              <PhArrowLineLeft />
              {{ $t(($) => $.menu.tab.closeToTheLeft, { ns: 'menu' }) }}
            </ContextMenuItem>
            <ContextMenuItem
              @select="
                closeContextMenuWorkspaces(CloseWorkspacesDisposition.RIGHT)
              "
            >
              <PhArrowLineRight />
              {{ $t(($) => $.menu.tab.closeToTheRight, { ns: 'menu' }) }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        <SearchText
          v-if="searchTextPanelIsOpen"
          ref="searchTextRef"
          v-model:query="searchTextQuery"
          @search="onSearchText"
          @close="searchTextPanelIsOpen = false"
        />
        <div
          ref="pageBackgroundRef"
          class="page-background"
          @scroll="throttled.onScroll"
        >
          <div
            v-for="(page, pageIndex) in filteredPages"
            :key="`page-${pageIndex}`"
            ref="pagesRef"
            v-observe-visibility="{
              callback: (isVisible: boolean) =>
                updatePageVisibility(page, isVisible),
              intersection: pageVisibilityIntersection,
            }"
            class="page"
            :style="pageStyle"
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
                    :key="`element-${selectedWorkspace.id}-${getHeaderForPageIndex(pageIndex).id}-${
                      getHeaderForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="setTemplateRef(`header-${pageIndex}`)"
                    class="element-box"
                    :element="
                      getHeaderForPageIndex(pageIndex) as RichTextBoxElement
                    "
                    :edit-mode="
                      !printMode &&
                      getHeaderForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :page-setup="score.pageSetup"
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
                    :key="`element-${selectedWorkspace.id}-${getHeaderForPageIndex(pageIndex).id}-${
                      getHeaderForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="setTemplateRef(`header-${pageIndex}`)"
                    class="element-box"
                    :element="
                      getHeaderForPageIndex(pageIndex) as TextBoxElement
                    "
                    :edit-mode="
                      !printMode &&
                      getHeaderForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :page-setup="score.pageSetup"
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
                v-for="(line, lineIndex) in page.lines"
                :key="`line-${pageIndex}-${lineIndex}`"
                :ref="`line-${lineIndex}`"
                class="line"
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
                      :ref="
                        setTemplateRef(`element-${getElementIndex(element)}`)
                      "
                      class="neume-box"
                    >
                      <span
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        class="section-name"
                        >§</span
                      >
                      <span v-if="element.pageBreak" class="page-break"
                        ><PhFile
                      /></span>
                      <span v-if="element.lineBreak" class="line-break"
                        ><svg
                          v-if="element.lineBreakType === LineBreakType.Justify"
                          viewBox="0 0 24 24"
                        >
                          <PhParagraph
                            size="24"
                            weight="fill"
                            transform="matrix(0.75 0 0 1 -2 0)"
                          />
                          <PhTextAlignJustify size="12" x="12" y="12" /></svg
                        ><svg
                          v-else-if="
                            element.lineBreakType === LineBreakType.Center
                          "
                          viewBox="0 0 24 24"
                        >
                          <PhParagraph
                            size="24"
                            weight="fill"
                            transform="matrix(0.75 0 0 1 -2 0)"
                          />
                          <PhTextAlignCenter size="12" x="12" y="12" /></svg
                        ><PhParagraph v-else weight="fill"
                      /></span>
                      <AlternateLine
                        v-for="(alternateLine, index) in (
                          element as NoteElement
                        ).alternateLines"
                        :key="index"
                        :element="alternateLine"
                        :page-setup="score.pageSetup"
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
                        :page-setup="score.pageSetup"
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
                        :page-setup="score.pageSetup"
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
                        dir="auto"
                        :style="getLyricStyle(element as NoteElement)"
                      >
                        <ContentEditable
                          :ref="
                            setTemplateRef(`lyrics-${getElementIndex(element)}`)
                          "
                          class="lyrics"
                          :class="{
                            selectedLyrics: element === selectedLyrics,
                          }"
                          :style="{ minWidth: withZoom(element.width) }"
                          :content="(element as NoteElement).lyrics"
                          :editable="!lyricsLocked"
                          white-space="nowrap"
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
                              v-for="(offset, index) in (element as NoteElement)
                                .hyphenOffsets"
                              :key="index"
                              class="melisma-hyphen"
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
                            :class="{
                              selectedMelisma: element === selectedLyrics,
                            }"
                            @click="focusLyrics(element.index)"
                            @focus="selectedLyrics = element as NoteElement"
                            v-text="(element as NoteElement).melismaText"
                          ></span>
                        </template>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="isMartyriaElement(element)">
                    <div class="neume-box">
                      <span
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        class="section-name"
                        >§</span
                      >
                      <span v-if="element.pageBreak" class="page-break">
                        <PhFile
                      /></span>
                      <span v-if="element.lineBreak" class="line-break"
                        ><PhParagraph weight="fill"
                      /></span>
                      <MartyriaNeumeBox
                        :ref="
                          setTemplateRef(`element-${getElementIndex(element)}`)
                        "
                        class="marytria-neume-box"
                        :neume="element as MartyriaElement"
                        :page-setup="score.pageSetup"
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
                      :ref="
                        setTemplateRef(`element-${getElementIndex(element)}`)
                      "
                      class="neume-box"
                    >
                      <span
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        class="section-name"
                        >§</span
                      >
                      <span v-if="element.pageBreak" class="page-break">
                        <PhFile
                      /></span>
                      <span v-if="element.lineBreak" class="line-break"
                        ><PhParagraph weight="fill"
                      /></span>
                      <TempoNeumeBox
                        class="tempo-neume-box"
                        :neume="element as TempoElement"
                        :page-setup="score.pageSetup"
                        :class="[{ selected: isSelected(element) }]"
                        @select-single="selectedElement = element"
                        @select-range="setSelectionRange(element)"
                      />
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isEmptyElement(element)">
                    <div
                      :ref="
                        setTemplateRef(`element-${getElementIndex(element)}`)
                      "
                      class="neume-box"
                    >
                      <span
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        class="section-name"
                        >§</span
                      >
                      <span v-if="element.pageBreak" class="page-break">
                        <PhFile
                      /></span>
                      <span v-if="element.lineBreak" class="line-break"
                        ><PhParagraph weight="fill"
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
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      class="section-name-2"
                      >§</span
                    >
                    <span v-if="element.pageBreak" class="page-break-2"
                      ><PhFile
                    /></span>
                    <span v-if="element.lineBreak" class="line-break-2"
                      ><PhParagraph weight="fill"
                    /></span>
                    <TextBox
                      :ref="
                        setTemplateRef(`element-${getElementIndex(element)}`)
                      "
                      :element="element as TextBoxElement"
                      :edit-mode="true"
                      :metadata="getTokenMetadata(pageIndex)"
                      :page-setup="score.pageSetup"
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
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      class="section-name-2"
                      >§</span
                    >
                    <span v-if="element.pageBreak" class="page-break-2"
                      ><PhFile
                    /></span>
                    <span v-if="element.lineBreak" class="line-break-2"
                      ><PhParagraph weight="fill"
                    /></span>
                    <TextBoxRich
                      :ref="
                        setTemplateRef(`element-${getElementIndex(element)}`)
                      "
                      :element="element as RichTextBoxElement"
                      :page-setup="score.pageSetup"
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
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      class="section-name-2"
                      >§</span
                    >
                    <span v-if="element.pageBreak" class="page-break-2"
                      ><PhFile
                    /></span>
                    <span v-if="element.lineBreak" class="line-break-2"
                      ><PhParagraph weight="fill"
                    /></span>
                    <ModeKey
                      :ref="
                        setTemplateRef(`element-${getElementIndex(element)}`)
                      "
                      :element="element as ModeKeyElement"
                      :page-setup="score.pageSetup"
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
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      class="section-name"
                      >§</span
                    >
                    <span v-if="element.pageBreak" class="page-break"
                      ><PhFile
                    /></span>
                    <span v-if="element.lineBreak" class="line-break"
                      ><PhParagraph weight="fill"
                    /></span>
                    <DropCap
                      :ref="
                        setTemplateRef(`element-${getElementIndex(element)}`)
                      "
                      :element="element as DropCapElement"
                      :page-setup="score.pageSetup"
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
                    <span v-if="element.pageBreak" class="page-break-2"
                      ><PhFile
                    /></span>
                    <span v-if="element.lineBreak" class="line-break-2"
                      ><PhParagraph weight="fill"
                    /></span>
                    <ImageBox
                      :ref="
                        setTemplateRef(`element-${getElementIndex(element)}`)
                      "
                      :element="element as ImageBoxElement"
                      :zoom="zoom"
                      :print-mode="printMode"
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
                <span
                  v-if="
                    showAdjustmentRatios &&
                    line.adjustmentRatio != null &&
                    line.elements.length > 0
                  "
                  class="adjustment-ratio"
                  :style="getAdjustmentRatioStyle(line)"
                  >{{ line.adjustmentRatio.toFixed(2) }}</span
                >
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
                    :key="`element-${selectedWorkspace.id}-${getFooterForPageIndex(pageIndex).id}-${
                      getFooterForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="setTemplateRef(`footer-${pageIndex}`)"
                    class="element-box"
                    :element="
                      getFooterForPageIndex(pageIndex) as RichTextBoxElement
                    "
                    :edit-mode="
                      !printMode &&
                      getFooterForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :page-setup="score.pageSetup"
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
                  v-else-if="isTextBoxElement(getFooterForPageIndex(pageIndex))"
                >
                  <TextBox
                    :ref="setTemplateRef(`footer-${pageIndex}`)"
                    :key="`element-${selectedWorkspace.id}-${getFooterForPageIndex(pageIndex).id}-${
                      getFooterForPageIndex(pageIndex).keyHelper
                    }`"
                    class="element-box"
                    :element="
                      getFooterForPageIndex(pageIndex) as TextBoxElement
                    "
                    :edit-mode="
                      !printMode &&
                      getFooterForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :page-setup="score.pageSetup"
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
        :page-setup="score.pageSetup"
        @update="updateTextBox(selectedTextBoxElement, $event)"
        @update:section-name="
          updateScoreElementSectionName(
            selectedTextBoxElement as TextBoxElement,
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
        :page-setup="score.pageSetup"
        @update="updateRichTextBox(selectedRichTextBoxElement, $event)"
        @update:section-name="
          updateScoreElementSectionName(
            selectedRichTextBoxElement as RichTextBoxElement,
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
        :page-setup="score.pageSetup"
        @update="updateDropCap(selectedElement as DropCapElement, $event)"
        @update:section-name="
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
        :page-setup="score.pageSetup"
        @update="updateImageBox(selectedElement as ImageBoxElement, $event)"
      />
    </template>
    <template v-if="selectedLyrics != null">
      <ToolbarLyrics
        :element="selectedLyrics"
        :fonts="fonts"
        @update="updateNoteAndSave(selectedLyrics as NoteElement, $event)"
        @insert:special-character="insertSpecialCharacter"
      />
    </template>
    <template
      v-if="selectedElement != null && isModeKeyElement(selectedElement)"
    >
      <ToolbarModeKey
        :element="selectedElement as ModeKeyElement"
        :page-setup="score.pageSetup"
        @update="updateModeKey(selectedElement as ModeKeyElement, $event)"
        @update:tempo="
          setModeKeyTempo(selectedElement as ModeKeyElement, $event)
        "
        @update:section-name="
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
        :key="`toolbar-neume-${selectedWorkspace.id}-${selectedElement.id}`"
        :element="selectedElementForNeumeToolbar as NoteElement"
        :page-setup="score.pageSetup"
        :neume-keyboard="neumeKeyboard"
        :inner-neume="toolbarInnerNeume"
        @update="
          updateNoteAndSave(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:inner-neume="toolbarInnerNeume = $event"
        @update:accidental="
          setAccidental(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:secondary-accidental="
          setSecondaryAccidental(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:tertiary-accidental="
          setTertiaryAccidental(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:fthora="
          setFthoraNote(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:secondary-fthora="
          setSecondaryFthora(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:tertiary-fthora="
          setTertiaryFthora(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:gorgon="
          setGorgon(selectedElementForNeumeToolbar as NoteElement, $event)
        "
        @update:secondary-gorgon="
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
        @update:measure-bar="
          setMeasureBarNote(
            selectedElementForNeumeToolbar as NoteElement,
            $event,
          )
        "
        @update:measure-number="
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
        @update:section-name="
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
        :page-setup="score.pageSetup"
        :neume-keyboard="neumeKeyboard"
        @update="updateMartyria(selectedElement as MartyriaElement, $event)"
        @update:fthora="
          setFthoraMartyria(selectedElement as MartyriaElement, $event)
        "
        @update:tempo-left="
          setMartyriaTempoLeft(selectedElement as MartyriaElement, $event)
        "
        @update:tempo="
          setMartyriaTempo(selectedElement as MartyriaElement, $event)
        "
        @update:tempo-right="
          setMartyriaTempoRight(selectedElement as MartyriaElement, $event)
        "
        @update:measure-bar="
          setMeasureBarMartyria(selectedElement as MartyriaElement, $event)
        "
        @update:quantitative-neume="
          setMartyriaQuantitativeNeume(
            selectedElement as MartyriaElement,
            $event,
          )
        "
        @update:section-name="
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
        :page-setup="score.pageSetup"
        @update="updateTempo(selectedElement as TempoElement, $event)"
        @update:section-name="
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
      @assign-accepts-lyrics="assignAcceptsLyricsFromCurrentLyrics"
      @close="closeLyricManager"
      @click="
        selectedElement = null;
        selectedLyrics = null;
      "
    ></ToolbarLyricManager>
    <ModeKeyDialog
      v-if="modeKeyDialogIsOpen"
      v-model:open="modeKeyDialogIsOpen"
      :element="selectedElement as ModeKeyElement"
      :page-setup="score.pageSetup"
      @update="
        updateModeKeyFromTemplate(selectedElement as ModeKeyElement, $event)
      "
      @update:use-optional-diatonic-fthoras="
        updatePageSetupUseOptionalDiatonicFthoras($event)
      "
    />
    <SyllablePositioningDialog
      v-if="syllablePositioningDialogIsOpen"
      v-model:open="syllablePositioningDialogIsOpen"
      :element="selectedElement as NoteElement"
      :previous-element="previousElementOnLine ?? undefined"
      :next-element="nextElementOnLine ?? undefined"
      :page-setup="score.pageSetup"
      @update="updateNoteAndSave(selectedElement as NoteElement, $event)"
    />
    <PlaybackSettingsDialog
      v-if="playbackSettingsDialogIsOpen"
      v-model:open="playbackSettingsDialogIsOpen"
      :options="audioOptions"
      @update:options="updatePlaybackOptions"
      @play-test-tone="playTestTone"
    />
    <EditorPreferencesDialog
      v-if="editorPreferencesDialogIsOpen"
      v-model:open="editorPreferencesDialogIsOpen"
      :options="editorPreferences"
      :page-setup="score.pageSetup"
      @update="updateEditorPreferences"
    />
    <AboutDialog v-if="aboutDialogIsOpen" v-model:open="aboutDialogIsOpen" />
    <PageSetupDialog
      v-if="pageSetupDialogIsOpen"
      v-model:open="pageSetupDialogIsOpen"
      :page-setup="score.pageSetup"
      :fonts="fonts"
      @update="updatePageSetup($event)"
    />
    <ExportDialog
      v-if="exportDialogIsOpen"
      v-model:open="exportDialogIsOpen"
      :loading="exportInProgress"
      :default-format="exportFormat"
      :show-item-in-folder-supported="ipcService.isShowItemInFolderSupported()"
      @export-as-png="exportAsPng"
      @export-as-music-xml="exportAsMusicXml"
      @export-as-latex="exportAsLatex"
    />
    <template v-if="richTextBoxCalculation">
      <TextBoxRich
        v-for="element in resizableRichTextBoxElements"
        :key="element.id!"
        class="richTextBoxCalculation"
        :element="element as RichTextBoxElement"
        :page-setup="score.pageSetup"
        :fonts="fonts"
        :recalc="true"
        @update:height="
          updateRichTextBoxHeight(element as RichTextBoxElement, $event)
        "
      />
    </template>
    <template v-if="textBoxCalculation">
      <TextBox
        v-for="element in resizableTextBoxElements"
        :key="element.id!"
        class="textBoxCalculation"
        :element="element as TextBoxElement"
        :page-setup="score.pageSetup"
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
  z-index: 45;
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

.adjustment-ratio {
  pointer-events: none;
  white-space: nowrap;
  font-variant-numeric: lining-nums tabular-nums;
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
  background-color: var(--color-legacy-chrome-tab-list);
  margin: 0;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
}

:deep(.vue3-tabs-chrome .tabs-item) {
  border-right: 1px solid var(--color-legacy-chrome-border);
}

:deep(.vue3-tabs-chrome .tabs-item:last-of-type) {
  border-right: none;
}

:deep(.vue3-tabs-chrome .tabs-item.active .tabs-main) {
  background-color: var(--color-legacy-chrome-menu-surface);
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
  background-color: var(--color-legacy-chrome-tab-strip);
}

.workspace-tab-new-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;

  font-size: 1.25rem;
  font-weight: bold;

  background-color: var(--color-legacy-chrome-tab-action);

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
  flex: 1;
  min-height: 0;
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

.page-break > svg {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.line-break {
  position: absolute;
  top: calc(-10px * var(--zoom, 1));
}

.line-break > svg {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.page-break-2 {
  position: absolute;
  top: calc(-16px * var(--zoom, 1));
}

.page-break-2 > svg {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.line-break-2 {
  position: absolute;
  top: calc(-18px * var(--zoom, 1));
}

.line-break-2 > svg {
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
