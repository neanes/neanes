<script setup lang="ts">
import 'vue3-tabs-chrome/dist/vue3-tabs-chrome.css';

import {
  PhAlignRight,
  PhArrowLineLeft,
  PhArrowLineRight,
  PhClipboardText,
  PhCopy,
  PhCrosshair,
  PhFile,
  PhMusicNotes,
  PhParagraph,
  PhScissors,
  PhSelectionAll,
  PhSlidersHorizontal,
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
  type CSSProperties,
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
import DeveloperPane from '@/components/DeveloperPane.vue';
import DocumentPropertiesDialog from '@/components/DocumentPropertiesDialog.vue';
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
import LyricsPane from '@/components/LyricsPane.vue';
import ModeKey from '@/components/ModeKey.vue';
import ModeKeyDialog from '@/components/ModeKeyDialog.vue';
import EmptyNeumeBox from '@/components/NeumeBoxEmpty.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import TempoNeumeBox from '@/components/NeumeBoxTempo.vue';
import NeumeComboSelector from '@/components/NeumeComboSelector.vue';
import NeumeSelector from '@/components/NeumeSelector.vue';
import PageSetupDialog from '@/components/PageSetupDialog.vue';
import ParagraphStylesDialog from '@/components/ParagraphStylesDialog.vue';
import PlaybackSettingsDialog from '@/components/PlaybackSettingsDialog.vue';
import type { InspectorContext } from '@/components/properties/InspectorContext';
import PropertiesPane from '@/components/properties/PropertiesPane.vue';
import RichTextToolbar from '@/components/RichTextToolbar.vue';
import SearchText from '@/components/SearchText.vue';
import SelectionPane from '@/components/SelectionPane.vue';
import SyllablePositioningDialog from '@/components/SyllablePositioningDialog.vue';
import Annotation from '@/components/TextAnnotation.vue';
import TextBox from '@/components/TextBox.vue';
import TextBoxRich from '@/components/TextBoxRich.vue';
import ToolbarDropCap from '@/components/ToolbarDropCap.vue';
import ToolbarLyrics from '@/components/ToolbarLyrics.vue';
import ToolbarMain from '@/components/ToolbarMain.vue';
import ToolbarMartyria from '@/components/ToolbarMartyria.vue';
import ToolbarModeKey from '@/components/ToolbarModeKey.vue';
import ToolbarNeume from '@/components/ToolbarNeume.vue';
import ToolbarTextBox from '@/components/ToolbarTextBox.vue';
import { Badge } from '@/components/ui/badge';
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group';
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Spinner } from '@/components/ui/spinner';
import WorkspaceDockLayout from '@/components/WorkspaceDockLayout.vue';
import { useEditorServices } from '@/composables/useEditorServices';
import { useResizeObserver } from '@/composables/useResizeObserver';
import {
  clearActiveEditor,
  focusLastActiveEditorForOwner,
  isActiveEditorForOwner,
} from '@/composables/useRichTextEditorRegistry';
import { EventBus } from '@/eventBus';
import { resolveLanguagePreference } from '@/i18n';
import { editorPreferencesKey } from '@/injectionKeys';
import type {
  CloseWorkspacesArgs,
  ExportWorkspaceAsImageReplyArgs,
  ExportWorkspaceReplyArgs,
  FileMenuImportOcrArgs,
  FileMenuInsertTextboxArgs,
  FileMenuOpenImageArgs,
  FileMenuOpenScoreArgs,
  FileMenuViewPaneVisibilityArgs,
  FileMenuViewStatusBarVisibilityArgs,
  FileMenuViewZoomArgs,
  ShowMessageBoxReplyArgs,
  WorkspaceZoomState,
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
  TextBoxElement,
} from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import type {
  BoxOverlayDiagnostics,
  ElementOverlayBox,
  ElementOverlayDiagnostics,
} from '@/models/LayoutDiagnostics';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { NeumeCombination } from '@/models/NeumeCommonCombinations';
import { getNoteLabelSelector } from '@/models/NeumeI18nMappings';
import {
  areVocalExpressionsEquivalent,
  getSecondaryGorgonNeume,
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
  TempoSign,
  Tie,
} from '@/models/Neumes';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  NeumeSelection,
  QuantitativeNeume,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import type { Line, Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { ScaleNote } from '@/models/Scales';
import type { DocumentProperties } from '@/models/Score';
import { Score } from '@/models/Score';
import type { ScoreElementSelectionRange } from '@/models/ScoreElementSelectionRange';
import type { WorkspaceLocalStorage, ZoomFitMode } from '@/models/Workspace';
import {
  formatZoomPercent,
  MAX_ZOOM,
  MIN_ZOOM,
  Workspace,
  ZOOM_LEVELS,
} from '@/models/Workspace';
import {
  createDefaultPaneVisibility,
  type WorkspacePaneId,
  type WorkspacePaneVisibility,
} from '@/models/WorkspacePane';
import {
  AudioServiceEventNames,
  AudioState,
} from '@/services/audio/AudioService';
import type {
  PlaybackOptions,
  PlaybackSequenceEvent,
} from '@/services/audio/PlaybackService';
import { fontCatalog } from '@/services/FontCatalog';
import type { Command } from '@/services/history/CommandService';
import { CommandFactory } from '@/services/history/CommandService';
import { ByzHtmlExporter } from '@/services/integration/ByzHtmlExporter';
import { LatexExporterOptions } from '@/services/integration/LatexExporter';
import {
  LayoutService,
  type OverlayDiagnosticsContext,
} from '@/services/LayoutService';
import { SaveService } from '@/services/SaveService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { GORTHMIKON, PELASTIKON, TATWEEL } from '@/utils/constants';
import { resolveFontStyle } from '@/utils/fontStyle';
import { getCursorPosition } from '@/utils/getCursorPosition';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { isElectron } from '@/utils/isElectron';
import { resolvePageMargins } from '@/utils/PageMargins';
import {
  getDisplayedPageNumber,
  isDisplayedPageNumberOdd,
  isRightHandPage,
} from '@/utils/PageNumbering';
import type { TokenMetadata } from '@/utils/replaceTokens';
import { setRichTextLanguage } from '@/utils/richTextLanguage';
import {
  resolveRunningMarkerPageMetadata,
  resolveRunningMarkerText,
} from '@/utils/runningMarkers';
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

const scoreCommandFactory: CommandFactory<Score> = new CommandFactory<Score>();

const scoreElementCommandFactory: CommandFactory<ScoreElement> =
  new CommandFactory<ScoreElement>();

const pageSetupCommandFactory: CommandFactory<PageSetup> =
  new CommandFactory<PageSetup>();

const documentPropertiesCommandFactory: CommandFactory<DocumentProperties> =
  new CommandFactory<DocumentProperties>();

function createFontLoadDescriptor(
  fontFamily: string,
  fontStyle: string | null = null,
) {
  const resolved = resolveFontStyle(fontFamily, fontStyle);
  const cssFontFamily = `"${resolved.cssFontFamily.replace(/["\\]/g, '\\$&')}"`;

  return [
    resolved.cssFontStyle,
    'normal',
    resolved.cssFontWeight,
    '1rem',
    cssFontFamily,
  ].join(' ');
}

function getBundledFontLoadDescriptors() {
  const descriptors = new Set<string>();

  for (const family of fontCatalog.bundledFamilies()) {
    for (const style of fontCatalog.getStyles(family)) {
      descriptors.add(createFontLoadDescriptor(family, style));
    }
  }

  descriptors.add(createFontLoadDescriptor('NeanesRTL'));
  descriptors.add(createFontLoadDescriptor('NeanesRTLLegacy'));

  return [...descriptors];
}

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
const { observe: observePageBackgroundResize } = useResizeObserver();

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

type RichTextBoxComponent = {
  focus: () => void;
  getPendingUpdates: () => Partial<RichTextBoxElement> | null;
};

type AnnotationComponent = {
  focus: () => void;
  getCurrentText: () => string;
  getPendingUpdates: () => Partial<AnnotationElement>;
};

const preferredRichTextBoxFocusTarget = ref<{
  element: RichTextBoxElement;
  refName: string;
} | null>(null);

const searchTextQuery = ref('');
const searchTextPanelIsOpen = ref(false);
const showFileMenuBar = ref(!isElectron());
const statusBarIsVisible = ref(true);
const paneLayoutResetCounter = ref(0);
const paneVisibility = ref(createDefaultPaneVisibility());
const editorPreferencesHydrated = ref(false);
const isDevelopment = ref(import.meta.env.DEV);
const isBrowser = ref(!isElectron());
const isLoading = ref(true);
const printMode = ref(false);
const canUndo = ref(false);
const canRedo = ref(false);
const developerPaneOpenSections = ref(['display', 'line', 'inspector']);
const workspaces = ref<Workspace[]>([]);
const selectedWorkspaceValue = ref(new Workspace());
const pendingLyricsAssignmentTimers = new Map<string, number>();
const tabs = ref<Tab[]>([]);
const contextMenuWorkspaceId = ref<string | null>(null);
const scoreContextMenuTarget = ref<ScoreElement | null>(null);
const scoreMenuPointerDownInside = ref(false);
const pages = ref<Page[]>([]);
const currentPageNumber = ref(0);
const modeKeyDialogIsOpen = ref(false);
const syllablePositioningDialogIsOpen = ref(false);
const playbackSettingsDialogIsOpen = ref(false);
const pageSetupDialogIsOpen = ref(false);
const paragraphStylesDialogIsOpen = ref(false);
const paragraphStylesDialogSelectedStyleId = ref<string>(
  BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
);
const documentPropertiesDialogIsOpen = ref(false);
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
const toolbarInnerNeume = ref<NeumeSelection>(NeumeSelection.Primary);
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

const ckeditorLanguage = computed(() => {
  return (
    resolveLanguagePreference(
      editorPreferences.value.language,
      navigator.language,
    ) ?? 'en'
  );
});

const inspectorContext = computed<InspectorContext>(() => {
  const currentSelectedElement = selectedElement.value;
  const currentSelectedElementForNeumeToolbar =
    selectedElementForNeumeToolbar.value;
  const currentSelectedElementType = currentSelectedElement?.elementType;
  const currentSelectedAnnotation =
    selectedWorkspace.value.selectedAnnotationElement;

  if (currentSelectedAnnotation != null) {
    return { kind: 'annotation', element: currentSelectedAnnotation };
  }

  if (selectedTextBoxElement.value != null) {
    return {
      kind: 'text-box',
      element: selectedTextBoxElement.value,
      source:
        currentSelectedElement === selectedTextBoxElement.value
          ? 'score'
          : 'header-footer',
    };
  }

  if (selectedRichTextBoxElement.value != null) {
    return {
      kind: 'rich-text-box',
      element: selectedRichTextBoxElement.value,
      source:
        currentSelectedElement === selectedRichTextBoxElement.value
          ? 'score'
          : 'header-footer',
    };
  }

  if (
    currentSelectedElement != null &&
    currentSelectedElementType === ElementType.DropCap &&
    isDropCapElement(currentSelectedElement)
  ) {
    return { kind: 'drop-cap', element: currentSelectedElement };
  }

  if (
    currentSelectedElement != null &&
    currentSelectedElementType === ElementType.ImageBox &&
    isImageBoxElement(currentSelectedElement)
  ) {
    return { kind: 'image-box', element: currentSelectedElement };
  }

  if (selectedLyrics.value != null) {
    return { kind: 'lyrics', element: selectedLyrics.value };
  }

  if (
    currentSelectedElement != null &&
    currentSelectedElementType === ElementType.ModeKey &&
    isModeKeyElement(currentSelectedElement)
  ) {
    return { kind: 'mode-key', element: currentSelectedElement };
  }

  if (
    currentSelectedElement != null &&
    currentSelectedElementForNeumeToolbar != null &&
    isSyllableElement(currentSelectedElementForNeumeToolbar)
  ) {
    return { kind: 'neume', element: currentSelectedElementForNeumeToolbar };
  }

  if (
    currentSelectedElement != null &&
    currentSelectedElementType === ElementType.Martyria &&
    isMartyriaElement(currentSelectedElement)
  ) {
    return { kind: 'martyria', element: currentSelectedElement };
  }

  if (
    currentSelectedElement != null &&
    currentSelectedElementType === ElementType.Tempo &&
    isTempoElement(currentSelectedElement)
  ) {
    return { kind: 'tempo', element: currentSelectedElement };
  }

  if (selectionRange.value != null) {
    const start = Math.min(
      selectionRange.value.start,
      selectionRange.value.end,
    );
    const end = Math.max(selectionRange.value.start, selectionRange.value.end);

    return { kind: 'range', elements: elements.value.slice(start, end + 1) };
  }

  return { kind: 'none' };
});

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
    flushPendingRichTextEditors(selectedWorkspace.value);
    flushLyricsAssignment(selectedWorkspace.value);

    // Save the scroll position
    const pageBackgroundElement = pageBackgroundRef.value;

    if (pageBackgroundElement != null) {
      selectedWorkspace.value.scrollLeft = pageBackgroundElement.scrollLeft;
      selectedWorkspace.value.scrollTop = pageBackgroundElement.scrollTop;
    }

    selectedWorkspaceValue.value = value;
    selectedWorkspace.value.commandService.notify();
    save(false);

    // Scroll to the new workspace's saved scroll position
    // Use nextTick to scroll after the DOM has refreshed
    nextTick(() => {
      pageBackgroundRef.value?.scrollTo(
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

const isLyricsManagerOpen = computed(() => {
  return paneVisibility.value.lyrics;
});

const pageCount = computed(() => {
  return filteredPages.value.length;
});

const statusPageCount = computed(() => Math.max(1, pageCount.value));

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
      toolbarInnerNeume.value = NeumeSelection.Primary;

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
const canCopyElementLink = computed(() => selectedElement.value?.id != null);

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

const showDeveloperPanels = computed(
  () => editorPreferences.value.showDeveloperPanels,
);

const overlaysEnabled = computed(() => editorPreferences.value.overlaysEnabled);

const printOverlays = computed(() => editorPreferences.value.printOverlays);

const showGuides = computed(() => editorPreferences.value.showGuides);

const showAdjustmentRatios = computed(
  () => editorPreferences.value.showAdjustmentRatios,
);

const showAnonymousBoxes = computed(
  () => editorPreferences.value.showAnonymousBoxes,
);

const showElementBoxes = computed(
  () => editorPreferences.value.showElementBoxes,
);

const showInkBoundingBoxes = computed(
  () => editorPreferences.value.showInkBoundingBoxes,
);

const showGlueWidths = computed(() => editorPreferences.value.showGlueWidths);

const showLyricBoundingBoxes = computed(
  () => editorPreferences.value.showLyricBoundingBoxes,
);

const showNeumeBoundingBoxes = computed(
  () => editorPreferences.value.showNeumeBoundingBoxes,
);

const showCollisionRegions = computed(
  () => editorPreferences.value.showCollisionRegions,
);

const shouldCollectLayoutDiagnostics = computed(
  () => showDeveloperPanels.value,
);

const shouldRenderDeveloperOverlaysInPrint = computed(
  () => showDeveloperPanels.value && printOverlays.value,
);

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

const developerSelectedElement = computed(
  () =>
    selectedElement.value ??
    selectedLyrics.value ??
    selectedHeaderFooterElement.value,
);

const developerNextElementOnLine = computed(() => {
  const element = developerSelectedElement.value;

  if (element == null) {
    return null;
  }

  const index = elements.value.indexOf(element);

  if (index < 0 || index + 1 >= elements.value.length) {
    return null;
  }

  return elements.value[index + 1].line === element.line
    ? elements.value[index + 1]
    : null;
});

const selectedDeveloperLine = computed(() => {
  const element = developerSelectedElement.value;

  if (element == null || element.page <= 0 || element.line <= 0) {
    return null;
  }

  return pages.value[element.page - 1]?.lines[element.line - 1] ?? null;
});

const selectedLineDiagnostics = computed(() =>
  shouldCollectLayoutDiagnostics.value
    ? (selectedDeveloperLine.value?.diagnostics ?? null)
    : null,
);

const developerPaneHasMissingDiagnostics = computed(() => {
  if (!shouldCollectLayoutDiagnostics.value || pages.value.length === 0) {
    return false;
  }

  return pages.value.some((page) =>
    page.lines.some((line) => line.diagnostics == null),
  );
});

function reloadDeveloperPaneDiagnostics() {
  save(false);
}

function getDeveloperGlueOverlays(
  page: Page,
  line: Line,
  lineIndex: number,
  pageIndex: number,
) {
  const diagnostics = line.diagnostics;

  if (
    !showDeveloperPanels.value ||
    !overlaysEnabled.value ||
    !showGlueWidths.value ||
    diagnostics == null ||
    line.elements.length === 0
  ) {
    return [];
  }

  const barHeight = Math.max(3, score.value.pageSetup.lineHeight * 0.06);
  const barGap = Math.max(2, score.value.pageSetup.lineHeight * 0.03);
  const stackHeight = barHeight * 2 + barGap;
  const stackTop =
    line.elements[0].y +
    score.value.pageSetup.lineHeight * 0.45 -
    stackHeight / 2;
  const preferredTop = stackTop + barHeight + barGap;
  const resolvedMargins = getResolvedMarginsForPage(page);

  return diagnostics.glueOverlays.map((overlay, overlayIndex) => {
    const delta = overlay.actualWidth - overlay.preferredWidth;
    const actualFrame = getDeveloperGlueOverlayFrame(
      resolvedMargins,
      line,
      overlay.left,
      stackTop,
      overlay.actualWidth,
      barHeight,
    );
    const preferredFrame = getDeveloperGlueOverlayFrame(
      resolvedMargins,
      line,
      overlay.left,
      preferredTop,
      overlay.preferredWidth,
      barHeight,
    );
    const wrapperLeft = Math.min(actualFrame.left, preferredFrame.left);
    const wrapperTop = Math.min(actualFrame.top, preferredFrame.top);
    const wrapperRight = Math.max(
      actualFrame.left + actualFrame.width,
      preferredFrame.left + preferredFrame.width,
    );
    const wrapperBottom = Math.max(
      actualFrame.top + actualFrame.height,
      preferredFrame.top + preferredFrame.height,
    );

    return {
      actualNegative: overlay.actualWidth < 0,
      actualStyle: getDeveloperGlueOverlayStyle(
        actualFrame,
        wrapperLeft,
        wrapperTop,
      ),
      delta,
      key: `${pageIndex}-${lineIndex}-${overlay.ownerElementId ?? 'anon'}-${overlayIndex}`,
      preferredNegative: overlay.preferredWidth < 0,
      preferredStyle: getDeveloperGlueOverlayStyle(
        preferredFrame,
        wrapperLeft,
        wrapperTop,
      ),
      wrapperStyle: getDeveloperGlueOverlayWrapperStyle({
        height: wrapperBottom - wrapperTop,
        left: wrapperLeft,
        top: wrapperTop,
        width: wrapperRight - wrapperLeft,
      }),
    };
  });
}

function getDeveloperBoxOverlays(page: Page, line: Line, lineIndex: number) {
  const diagnostics = line.diagnostics;

  if (
    !showDeveloperPanels.value ||
    !overlaysEnabled.value ||
    (!showAnonymousBoxes.value && !showElementBoxes.value) ||
    diagnostics == null ||
    line.elements.length === 0
  ) {
    return [];
  }

  const height = Math.max(4, score.value.pageSetup.lineHeight * 0.08);
  const top = line.elements[0].y + score.value.pageSetup.lineHeight * 0.2;
  const resolvedMargins = getResolvedMarginsForPage(page);

  const overlays: BoxOverlayDiagnostics[] = [];

  if (showAnonymousBoxes.value) {
    overlays.push(...diagnostics.anonymousBoxOverlays);
  }

  if (showElementBoxes.value) {
    overlays.push(...diagnostics.nonAnonymousBoxOverlays);
  }

  return overlays.map((overlay, overlayIndex) => ({
    key: `${lineIndex}-${overlay.anonymous ? 'anon' : 'owned'}-${overlay.ownerElementId ?? 'none'}-${overlay.label ?? 'box'}-${overlayIndex}`,
    kind: getDeveloperBoxOverlayKind(overlay),
    label: overlay.label,
    style: getDeveloperOverlayStyle(
      getDeveloperGlueOverlayFrame(
        resolvedMargins,
        line,
        overlay.left,
        top,
        overlay.width,
        height,
      ),
    ),
  }));
}

const overlayDiagnosticsContext = computed<OverlayDiagnosticsContext>(() =>
  LayoutService.createOverlayDiagnosticsContext(score.value.pageSetup),
);

const selectedElementOverlayDiagnostics =
  computed<ElementOverlayDiagnostics | null>(() => {
    const element = developerSelectedElement.value;

    if (element == null) {
      return null;
    }

    return LayoutService.getElementOverlayDiagnostics(
      element,
      developerNextElementOnLine.value,
      score.value.pageSetup,
      overlayDiagnosticsContext.value,
    );
  });

const developerPaneGeneratedItemGroups = computed(() => {
  const diagnostics = selectedLineDiagnostics.value;
  const element = developerSelectedElement.value;

  if (diagnostics == null || element == null) {
    return [];
  }

  return diagnostics.itemGroups.filter((group) => {
    return (
      group.ownerElementId === element.id &&
      group.ownerElementType === element.elementType
    );
  });
});

const developerInspectorRows = computed(() => {
  const element = developerSelectedElement.value;
  const overlayDiagnostics = selectedElementOverlayDiagnostics.value;

  if (element == null) {
    return [];
  }

  const rows = [
    { label: 'Type', value: element.elementType },
    { label: 'Page', value: `${element.page || 0}` },
    { label: 'Line', value: `${element.line || 0}` },
    { label: 'Width', value: formatDeveloperNumber(element.width) },
    { label: 'X', value: formatDeveloperNumber(element.x) },
    { label: 'Y', value: formatDeveloperNumber(element.y) },
  ];

  if (overlayDiagnostics?.glyph != null) {
    rows.push({ label: 'Glyph', value: overlayDiagnostics.glyph });
  }

  if (overlayDiagnostics?.rootNeume != null) {
    rows.push({ label: 'Root Neume', value: overlayDiagnostics.rootNeume });
  }

  if (overlayDiagnostics?.advanceBox != null) {
    rows.push({
      label: 'Advance Box',
      value: formatDeveloperPageBox(element, overlayDiagnostics.advanceBox),
    });
  }

  if (overlayDiagnostics?.inkBox != null) {
    rows.push({
      label: 'Ink BBox',
      value: formatDeveloperPageBox(element, overlayDiagnostics.inkBox),
    });
  }

  if (overlayDiagnostics?.lyricBox != null) {
    rows.push({
      label: 'Lyric BBox',
      value: formatDeveloperPageBox(element, overlayDiagnostics.lyricBox),
    });
  }

  if (overlayDiagnostics?.leftProjection != null) {
    rows.push({
      label: 'Left Projection',
      value: formatDeveloperNumber(overlayDiagnostics.leftProjection),
    });
  }

  if (overlayDiagnostics?.rightProjection != null) {
    rows.push({
      label: 'Right Projection',
      value: formatDeveloperNumber(overlayDiagnostics.rightProjection),
    });
  }

  if (overlayDiagnostics?.leftTuck != null) {
    rows.push({
      label: 'Left Tuck',
      value: formatDeveloperNumber(overlayDiagnostics.leftTuck),
    });
  }

  if (overlayDiagnostics?.rightTuck != null) {
    rows.push({
      label: 'Right Tuck',
      value: formatDeveloperNumber(overlayDiagnostics.rightTuck),
    });
  }

  if (overlayDiagnostics != null) {
    rows.push({
      label: 'Collision Boxes',
      value: formatDeveloperCollisionBoxes(
        element,
        overlayDiagnostics.collisionBoxes,
      ),
    });
  }

  return rows;
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

const zoomFitMode = computed({
  get: () => {
    return selectedWorkspace.value.zoomFitMode;
  },
  set: (value: ZoomFitMode | null) => {
    selectedWorkspace.value.zoomFitMode = value;
  },
});
const canNavigateWorkspaceTabs = computed(
  () => !dialogOpen.value && tabs.value.length > 1,
);

const statusScrollPageNumber = computed(() =>
  clamp(currentPageNumber.value, 1, statusPageCount.value),
);

const statusActiveElement = computed(
  () => selectedLyrics.value ?? selectedElement.value,
);

const statusPositionElement = computed(
  () =>
    statusActiveElement.value ??
    getFirstElementForPage(statusScrollPageNumber.value),
);

const statusPageNumber = computed(() => {
  const elementPage = statusPositionElement.value?.page ?? 0;

  return elementPage > 0
    ? clamp(elementPage, 1, statusPageCount.value)
    : statusScrollPageNumber.value;
});

const statusPositionElementOnPage = computed(() => {
  const element = statusPositionElement.value;

  return element?.page === statusPageNumber.value
    ? element
    : getFirstElementForPage(statusPageNumber.value);
});

const statusSectionNumber = computed(() => {
  const element = statusActiveElement.value;

  return element?.page === statusPageNumber.value
    ? getSectionNumberForElementIndex(element.index)
    : getSectionNumberForPage(statusPageNumber.value);
});

const statusSectionCount = computed(() => getSectionCount());

const statusLinePosition = computed(() => {
  const page = filteredPages.value[statusPageNumber.value - 1];
  const lineCount = Math.max(page?.lines.length ?? 0, 1);
  const lineNumber =
    statusPositionElementOnPage.value?.line ??
    getFirstLineNumberForPage(page) ??
    1;

  return {
    lineNumber: clamp(lineNumber, 1, lineCount),
    lineCount,
  };
});

const statusColumnPosition = computed(() => {
  const page = filteredPages.value[statusPageNumber.value - 1];
  const line = page?.lines[statusLinePosition.value.lineNumber - 1];
  const lineElements = line?.elements ?? [];
  const columnCount = Math.max(lineElements.length, 1);
  const element = statusPositionElementOnPage.value;
  const elementIndex = element != null ? lineElements.indexOf(element) : -1;

  return {
    columnNumber: elementIndex >= 0 ? elementIndex + 1 : 1,
    columnCount,
  };
});

const statusNeumeNoteDisplay = computed(() => {
  if (inspectorContext.value.kind !== 'neume') {
    return '';
  }

  return inspectorContext.value.element.scaleNotes
    .map((note) => t(getNoteLabelSelector(note), { ns: 'model' }))
    .join(' - ');
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

const guideStyleTop = computed(() => {
  return {
    top: withZoom(score.value.pageSetup.topMargin),
    width: withZoom(score.value.pageSetup.pageWidth),
  } as StyleValue;
});

const guideStyleBottom = computed(() => {
  return {
    bottom: withZoom(score.value.pageSetup.bottomMargin),
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
    paragraphStylesDialogIsOpen.value ||
    documentPropertiesDialogIsOpen.value ||
    playbackSettingsDialogIsOpen.value ||
    syllablePositioningDialogIsOpen.value ||
    editorPreferencesDialogIsOpen.value ||
    aboutDialogIsOpen.value
  );
});

const filteredPages = computed(() => {
  return printMode.value ? pages.value.filter((x) => !x.isEmpty) : pages.value;
});

const runningMarkerPageMetadata = computed(() =>
  resolveRunningMarkerPageMetadata(filteredPages.value),
);

provide(
  editorPreferencesKey,
  computed(() => editorPreferences.value),
);

const throttled = {
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
  onSelectAllScoreElements: throttle(
    keydownThrottleIntervalMs,
    onSelectAllScoreElements,
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
  setSecondaryGorgon: throttle(keydownThrottleIntervalMs, setSecondaryGorgon),
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
  onEditorViewportResize: throttle(250, onEditorViewportResize),
  onScroll: throttle(250, onScroll),
};
const saveDebounced = debounce(250, save);
const ZOOM_WHEEL_DELTA_THRESHOLD = 80;
const ZOOM_WHEEL_DELTA_RESET_DELAY_MS = 200;
let zoomWheelDelta = 0;
let zoomWheelResetTimeout: number | null = null;

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

watch(
  () => [
    zoomFitMode.value,
    score.value.pageSetup.pageWidth,
    score.value.pageSetup.pageHeight,
    score.value.pageSetup.innerPageWidth,
    score.value.pageSetup.leftMargin,
    score.value.pageSetup.rightMargin,
    score.value.pageSetup.facingPages,
    score.value.pageSetup.direction,
    score.value.pageSetup.firstPageNumber,
  ],
  () => {
    if (zoomFitMode.value != null) {
      nextTick(performZoomToFit);
    }
  },
  { flush: 'post' },
);

watch(
  () => getCurrentPhysicalPageNumber(),
  () => {
    if (zoomFitMode.value === 'text-width') {
      alignZoomFitScroll(zoomFitMode.value, zoom.value);
    }
  },
  { flush: 'post' },
);

watch(currentFilePath, () => {
  window.document.title = windowTitle.value;
});

watch(selectedWorkspaceId, () => {
  window.document.title = windowTitle.value;

  if (paneVisibility.value.lyrics) {
    refreshStaffLyrics();
  }
});

// Keep this before the annotation post-flush watcher; handoff focus depends on declaration order.
watch(
  selectedRichTextBoxElement,
  (element) => {
    if (element == null) {
      clearActiveEditor();
      clearPreferredRichTextBoxFocusTarget();
      return;
    }

    if (preferredRichTextBoxFocusTarget.value?.element !== element) {
      clearPreferredRichTextBoxFocusTarget();
    }

    if (!isActiveEditorForOwner(element)) {
      focusSelectedRichTextBoxEditor(element);
    }
  },
  { flush: 'post' },
);

// Keep previous-annotation cleanup owner-scoped so handoff does not clear a new rich-text editor.
watch(
  () => selectedWorkspace.value.selectedAnnotationElement,
  (annotation, previousAnnotation) => {
    if (previousAnnotation != null) {
      clearActiveEditor(previousAnnotation);
    }

    if (annotation != null && !isActiveEditorForOwner(annotation)) {
      // Single-click selection should not enter annotation editing; double-click
      // and new empty annotations manage their own focus paths.
      clearActiveEditor();
    }
  },
  { flush: 'post' },
);

watch(
  paneVisibility,
  () => {
    const visibility: WorkspacePaneVisibility = {
      ...paneVisibility.value,
    };

    EventBus.$emit(IpcRendererChannels.SetWorkspacePaneVisibility, visibility);
  },
  { deep: true, immediate: true },
);

watch(
  canCopyElementLink,
  (enabled) => {
    EventBus.$emit(IpcRendererChannels.SetCopyElementLinkEnabled, enabled);
  },
  { immediate: true },
);

watch(
  canNavigateWorkspaceTabs,
  (enabled) => {
    EventBus.$emit(
      IpcRendererChannels.SetWorkspaceTabNavigationEnabled,
      enabled,
    );
  },
  { immediate: true },
);

watch(
  statusBarIsVisible,
  (visible) => {
    EventBus.$emit(IpcRendererChannels.SetStatusBarVisibility, visible);
  },
  { immediate: true },
);

watch(
  () =>
    ({
      zoom: zoom.value,
      zoomFitMode: zoomFitMode.value,
    }) as WorkspaceZoomState,
  (state) => {
    EventBus.$emit(IpcRendererChannels.SetWorkspaceZoomState, state);
  },
  { immediate: true },
);

watch(isLyricsManagerOpen, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    refreshStaffLyrics();
  }
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

  syncDeveloperPanelsFromPreferencesOnStartup();
  editorPreferencesHydrated.value = true;

  window.addEventListener('keydown', onKeydown);
  window.addEventListener('keyup', onKeyup);
  window.addEventListener('resize', throttled.onEditorViewportResize);

  if (pageBackgroundRef.value != null) {
    observePageBackgroundResize(pageBackgroundRef.value, () => {
      throttled.onEditorViewportResize();
    });
  }

  EventBus.$on(IpcMainChannels.CloseWorkspaces, onCloseWorkspaces);
  EventBus.$on(IpcMainChannels.CloseApplication, onCloseApplication);
  EventBus.$on(IpcRendererChannels.SetCanUndo, onSetCanUndo);
  EventBus.$on(IpcRendererChannels.SetCanRedo, onSetCanRedo);

  EventBus.$on(IpcMainChannels.FileMenuNewScore, onFileMenuNewScore);
  EventBus.$on(IpcMainChannels.FileMenuOpenScore, onFileMenuOpenScore);
  EventBus.$on(IpcMainChannels.FileMenuPrint, onFileMenuPrint);
  EventBus.$on(IpcMainChannels.FileMenuSave, onFileMenuSave);
  EventBus.$on(IpcMainChannels.FileMenuSaveAs, onFileMenuSaveAs);
  EventBus.$on(IpcMainChannels.FileMenuPageSetup, onFileMenuPageSetup);
  EventBus.$on(
    IpcMainChannels.FileMenuParagraphStyles,
    onFileMenuParagraphStyles,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuDocumentProperties,
    onFileMenuDocumentProperties,
  );
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
  EventBus.$on(IpcMainChannels.FileMenuSelectAll, onFileMenuSelectAll);
  EventBus.$on(IpcMainChannels.FileMenuPasteFormat, onFileMenuPasteFormat);
  EventBus.$on(IpcMainChannels.FileMenuFind, onFileMenuFind);
  EventBus.$on(
    IpcMainChannels.FileMenuWindowPreviousTab,
    onFileMenuWindowPreviousTab,
  );
  EventBus.$on(IpcMainChannels.FileMenuWindowNextTab, onFileMenuWindowNextTab);
  EventBus.$on(
    IpcMainChannels.FileMenuViewPaneVisibility,
    onFileMenuViewPaneVisibility,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuViewStatusBarVisibility,
    onFileMenuViewStatusBarVisibility,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuViewResetPaneLayout,
    onFileMenuViewResetPaneLayout,
  );
  EventBus.$on(IpcMainChannels.FileMenuViewZoom, onFileMenuViewZoom);
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
    IpcMainChannels.FileMenuEditCopyElementLink,
    onFileMenuEditCopyElementLink,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuGenerateTestFile,
    onFileMenuGenerateTestFile,
  );

  EventBus.$on(AudioServiceEventNames.EventPlay, onAudioServiceEventPlay);

  EventBus.$on(AudioServiceEventNames.Stop, onAudioServiceStop);
  selectedWorkspace.value.commandService.notify();
});

onBeforeUnmount(() => {
  // Remove the debugging variable from window
  (window as any)._editor = undefined;

  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('keyup', onKeyup);
  window.removeEventListener('resize', throttled.onEditorViewportResize);
  clearZoomWheelDeltaReset();

  EventBus.$off(IpcMainChannels.CloseWorkspaces, onCloseWorkspaces);
  EventBus.$off(IpcMainChannels.CloseApplication, onCloseApplication);
  EventBus.$off(IpcRendererChannels.SetCanUndo, onSetCanUndo);
  EventBus.$off(IpcRendererChannels.SetCanRedo, onSetCanRedo);

  EventBus.$off(IpcMainChannels.FileMenuNewScore, onFileMenuNewScore);
  EventBus.$off(IpcMainChannels.FileMenuOpenScore, onFileMenuOpenScore);
  EventBus.$off(IpcMainChannels.FileMenuPrint, onFileMenuPrint);
  EventBus.$off(IpcMainChannels.FileMenuSave, onFileMenuSave);
  EventBus.$off(IpcMainChannels.FileMenuSaveAs, onFileMenuSaveAs);
  EventBus.$off(IpcMainChannels.FileMenuPageSetup, onFileMenuPageSetup);
  EventBus.$off(
    IpcMainChannels.FileMenuParagraphStyles,
    onFileMenuParagraphStyles,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuDocumentProperties,
    onFileMenuDocumentProperties,
  );
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
  EventBus.$off(IpcMainChannels.FileMenuSelectAll, onFileMenuSelectAll);
  EventBus.$off(IpcMainChannels.FileMenuPasteFormat, onFileMenuPasteFormat);
  EventBus.$off(IpcMainChannels.FileMenuFind, onFileMenuFind);
  EventBus.$off(
    IpcMainChannels.FileMenuWindowPreviousTab,
    onFileMenuWindowPreviousTab,
  );
  EventBus.$off(IpcMainChannels.FileMenuWindowNextTab, onFileMenuWindowNextTab);
  EventBus.$off(
    IpcMainChannels.FileMenuViewPaneVisibility,
    onFileMenuViewPaneVisibility,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuViewStatusBarVisibility,
    onFileMenuViewStatusBarVisibility,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuViewResetPaneLayout,
    onFileMenuViewResetPaneLayout,
  );
  EventBus.$off(IpcMainChannels.FileMenuViewZoom, onFileMenuViewZoom);
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
    IpcMainChannels.FileMenuEditCopyElementLink,
    onFileMenuEditCopyElementLink,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuGenerateTestFile,
    onFileMenuGenerateTestFile,
  );

  EventBus.$off(AudioServiceEventNames.EventPlay, onAudioServiceEventPlay);

  EventBus.$off(AudioServiceEventNames.Stop, onAudioServiceStop);

  clearPendingLyricsAssignments();

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

    const loadSystemFontsPromise = fontCatalog
      .init()
      .then(() => (fonts.value = fontCatalog.systemFamilies()));
    const bundledFontLoadPromises = getBundledFontLoadDescriptors().map(
      (descriptor) => fontLoader.load(descriptor),
    );

    // Must load all bundled faces before loading any documents, otherwise the
    // first text measurements can use fallback metrics.
    await Promise.all([
      loadSystemFontsPromise,
      ...bundledFontLoadPromises,
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

function getResolvedMarginsForPage(page: Page) {
  return resolvePageMargins(score.value.pageSetup, page.physicalPageNumber);
}

function getHeaderStyle(page: Page) {
  const margins = getResolvedMarginsForPage(page);

  return {
    left: withZoom(margins.left),
    top: withZoom(score.value.pageSetup.headerMargin),
  } as StyleValue;
}

function getFooterStyle(page: Page) {
  const margins = getResolvedMarginsForPage(page);

  return {
    left: withZoom(margins.left),
    bottom: withZoom(score.value.pageSetup.footerMargin),
  } as StyleValue;
}

function getGuideStyleLeft(page: Page) {
  const margins = getResolvedMarginsForPage(page);

  return {
    left: withZoom(margins.left),
    height: withZoom(score.value.pageSetup.pageHeight),
  } as StyleValue;
}

function getGuideStyleRight(page: Page) {
  const margins = getResolvedMarginsForPage(page);

  return {
    right: withZoom(margins.right),
    height: withZoom(score.value.pageSetup.pageHeight),
  } as StyleValue;
}

function getHeaderHorizontalRuleStyle(page: Page, headerHeight: number) {
  const margins = getResolvedMarginsForPage(page);

  return {
    left: withZoom(margins.left),
    top: withZoom(
      score.value.pageSetup.headerMargin +
        headerHeight +
        score.value.pageSetup.headerHorizontalRuleMarginTop,
    ),
    borderColor: score.value.pageSetup.headerHorizontalRuleColor,
    borderTopWidth: withZoom(
      score.value.pageSetup.headerHorizontalRuleThickness,
    ),
    width: withZoom(margins.contentWidth),
  } as StyleValue;
}

function getFooterHorizontalRuleStyle(page: Page, footerHeight: number) {
  const margins = getResolvedMarginsForPage(page);

  return {
    left: withZoom(margins.left),
    bottom: withZoom(
      score.value.pageSetup.footerMargin +
        footerHeight +
        score.value.pageSetup.footerHorizontalRuleMarginBottom,
    ),
    borderColor: score.value.pageSetup.footerHorizontalRuleColor,
    borderTopWidth: withZoom(
      score.value.pageSetup.footerHorizontalRuleThickness,
    ),
    width: withZoom(margins.contentWidth),
  } as StyleValue;
}

function getLyricStyle(element: NoteElement) {
  const resolvedLyricsStyle = resolveParagraphStyle(
    score.value.paragraphStyles,
    element.lyricsParagraphStyleId,
    element.getParagraphStyleOverrides(),
  );
  const resolvedLyricsFont = resolveFontStyle(
    resolvedLyricsStyle.fontFamily,
    resolvedLyricsStyle.fontStyle,
  );

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
    fontSize: withZoom(resolvedLyricsStyle.fontSize),
    fontFamily: getFontFamilyWithFallback(
      resolvedLyricsFont.cssFontFamily,
      score.value.pageSetup.neumeDefaultFontFamily,
    ),
    fontWeight: resolvedLyricsFont.cssFontWeight,
    fontStyle: resolvedLyricsFont.cssFontStyle,
    textDecoration: element.lyricsTextDecoration ?? undefined,
    color: resolvedLyricsStyle.color,
    webkitTextStrokeWidth: withZoom(resolvedLyricsStyle.strokeWidth),
    lineHeight: withZoom(element.lyricsFontHeight),
    left: element.alignLeft
      ? withZoom(Math.min(0, element.lyricsHorizontalOffset))
      : undefined,
    textAlign: element.alignLeft ? 'left' : undefined,
  } as CSSProperties;
}

function getLeadingLyricHyphenStyle(element: NoteElement) {
  const resolvedLyricsStyle = resolveParagraphStyle(
    score.value.paragraphStyles,
    element.lyricsParagraphStyleId,
    element.getParagraphStyleOverrides(),
  );
  const resolvedLyricsFont = resolveFontStyle(
    resolvedLyricsStyle.fontFamily,
    resolvedLyricsStyle.fontStyle,
  );

  return {
    top: withZoom(element.lyricsVerticalOffset),
    left: withZoom(element.leadingLyricHyphenOffset),
    fontSize: withZoom(resolvedLyricsStyle.fontSize),
    fontFamily: getFontFamilyWithFallback(
      resolvedLyricsFont.cssFontFamily,
      score.value.pageSetup.neumeDefaultFontFamily,
    ),
    fontWeight: resolvedLyricsFont.cssFontWeight,
    fontStyle: resolvedLyricsFont.cssFontStyle,
    textDecoration: element.lyricsTextDecoration ?? undefined,
    color: resolvedLyricsStyle.color,
    webkitTextStrokeWidth: withZoom(resolvedLyricsStyle.strokeWidth),
    lineHeight: withZoom(element.lyricsFontHeight),
  } as CSSProperties;
}

function getEmptyBoxStyle(element: EmptyElement) {
  return {
    width: withZoom(element.width),
    height: withZoom(element.height),
  } as StyleValue;
}

function formatDeveloperBox(box: ElementOverlayBox) {
  const lines = [
    `x=${formatDeveloperNumber(box.left)}`,
    `y=${formatDeveloperNumber(box.top)}`,
    `height=${formatDeveloperNumber(box.height)}`,
    `width=${formatDeveloperNumber(box.width)}`,
  ];

  if (box.kind != null) {
    lines.push(`type=${box.kind}`);
  }

  return lines.join('\n');
}

function formatDeveloperPageBox(element: ScoreElement, box: ElementOverlayBox) {
  return formatDeveloperBox(getDeveloperPageBox(element, box));
}

function formatDeveloperCollisionBoxes(
  element: ScoreElement,
  boxes: ElementOverlayBox[],
) {
  if (boxes.length === 0) {
    return '0';
  }

  return boxes
    .map((box, index) => {
      return `box ${index + 1}\n${formatDeveloperPageBox(element, box)}`;
    })
    .join('\n\n');
}

function getDeveloperPageBox(element: ScoreElement, box: ElementOverlayBox) {
  const elementLeft = rtl.value
    ? score.value.pageSetup.pageWidth - element.x - element.width
    : element.x;

  return {
    ...box,
    left: elementLeft + box.left,
    top: element.y + box.top,
  };
}

function formatDeveloperNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : String(value);
}

function getDeveloperBoxOverlayKind(overlay: BoxOverlayDiagnostics) {
  switch (overlay.label) {
    case 'line-start-reservation':
      return 'line-start-reservation';
    case 'martyria-shift':
      return 'martyria-shift';
    case 'lyric-collision':
      return 'lyric-collision';
    default:
      return overlay.anonymous ? 'anonymous' : 'owned';
  }
}

function getDeveloperOverlayBoxes(element: ScoreElement) {
  if (!showDeveloperPanels.value || !overlaysEnabled.value) {
    return [];
  }

  if (
    !showInkBoundingBoxes.value &&
    !showLyricBoundingBoxes.value &&
    !showNeumeBoundingBoxes.value &&
    !showCollisionRegions.value
  ) {
    return [];
  }

  const diagnostics = LayoutService.getElementOverlayDiagnostics(
    element,
    getNextElementOnSameLine(element),
    score.value.pageSetup,
    overlayDiagnosticsContext.value,
  );
  const boxes: Array<{
    height: number;
    kind: string;
    left: number;
    top: number;
    width: number;
  }> = [];

  if (showNeumeBoundingBoxes.value && diagnostics.advanceBox != null) {
    boxes.push({ ...diagnostics.advanceBox, kind: 'neume' });
  }

  if (showInkBoundingBoxes.value && diagnostics.inkBox != null) {
    boxes.push({ ...diagnostics.inkBox, kind: 'ink' });
  }

  if (showLyricBoundingBoxes.value && diagnostics.lyricBox != null) {
    boxes.push({ ...diagnostics.lyricBox, kind: 'lyric' });
  }

  if (showCollisionRegions.value) {
    boxes.push(
      ...diagnostics.collisionBoxes.map((box) => ({
        ...box,
        kind: 'collision',
      })),
    );
  }

  return boxes;
}

function getDeveloperOverlayStyle(box: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  return {
    left: withZoom(box.left),
    top: withZoom(box.top),
    width: withZoom(box.width),
    height: withZoom(box.height),
  } as StyleValue;
}

function getDeveloperGlueOverlayFrame(
  resolvedMargins: ReturnType<typeof resolvePageMargins>,
  line: Line,
  logicalLeft: number,
  top: number,
  width: number,
  height: number,
) {
  const logicalRight = logicalLeft + width;
  const normalizedLogicalLeft = Math.min(logicalLeft, logicalRight);
  const normalizedLogicalRight = Math.max(logicalLeft, logicalRight);
  const normalizedWidth = normalizedLogicalRight - normalizedLogicalLeft;
  const physicalLeft = rtl.value
    ? resolvedMargins.contentRight - line.indentation - normalizedLogicalRight
    : resolvedMargins.contentLeft + line.indentation + normalizedLogicalLeft;

  return {
    height,
    left: physicalLeft,
    top,
    width: normalizedWidth,
  };
}

function getDeveloperGlueOverlayWrapperStyle(frame: {
  height: number;
  left: number;
  top: number;
  width: number;
}) {
  return {
    left: withZoom(frame.left),
    top: withZoom(frame.top),
    width: withZoom(frame.width),
    height: withZoom(frame.height),
  } as StyleValue;
}

function getDeveloperGlueOverlayStyle(
  frame: { height: number; left: number; top: number; width: number },
  wrapperLeft: number,
  wrapperTop: number,
) {
  return {
    left: withZoom(frame.left - wrapperLeft),
    top: withZoom(frame.top - wrapperTop),
    width: withZoom(frame.width),
    height: withZoom(frame.height),
  } as StyleValue;
}

function getNextElementOnSameLine(element: ScoreElement) {
  const index = elements.value.indexOf(element);

  if (index < 0 || index + 1 >= elements.value.length) {
    return null;
  }

  return elements.value[index + 1].line === element.line
    ? elements.value[index + 1]
    : null;
}

function getElementStyle(element: ScoreElement) {
  return {
    left: !rtl.value ? withZoom(element.x) : undefined,
    right: rtl.value ? withZoom(element.x) : undefined,
    top: withZoom(element.y),
  } as StyleValue;
}

function getAdjustmentRatioStyle(line: Line, page: Page) {
  const resolvedLyricsStyle = getResolvedLyricsStyle();
  const fontSize = resolvedLyricsStyle.fontSize * 0.8;
  const gap = fontSize * 0.5;
  const margins = getResolvedMarginsForPage(page);

  return {
    position: 'absolute',
    left: withZoom(
      rtl.value
        ? margins.left - gap - fontSize * 3
        : score.value.pageSetup.pageWidth - margins.right + gap,
    ),
    width: withZoom(fontSize * 3),
    textAlign: 'right',
    top: withZoom(
      line.elements[0].y + score.value.pageSetup.lineHeight / 3 - fontSize / 2,
    ),
    fontSize: withZoom(fontSize),
    fontFamily: resolvedLyricsStyle.fontFamily,
    color: score.value.pageSetup.gorgonDefaultColor,
  } as StyleValue;
}

function getMelismaStyle(element: NoteElement) {
  const resolvedLyricsStyle = getResolvedLyricsStyle(element);

  return {
    width: withZoom(element.melismaWidth),
    minHeight: withZoom(resolvedLyricsStyle.fontSize),
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
  const resolvedLyricsStyle = getResolvedLyricsStyle(element);

  const spacing = !element.isFullMelisma
    ? score.value.pageSetup.lyricsMelismaSpacing
    : 0;

  return {
    borderBottom: `${withZoom(thickness)} solid ${resolvedLyricsStyle.color}`,
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

function showErrorToast(
  message: string,
  error: unknown,
  options: { id?: string | number; fallback: string },
) {
  toast.error(message, {
    id: options.id,
    description: getErrorMessage(error, options.fallback),
  });
}

function showReplyErrorToast(
  message: string,
  reply: { errorMessage?: string },
  fallback: string,
) {
  toast.error(message, {
    description: reply.errorMessage ?? fallback,
  });
}

function showExportReplyToast(
  reply: ExportWorkspaceReplyArgs,
  successMessage: string,
  errorMessage: string,
  fallbackErrorDescription: string,
) {
  if (reply.success) {
    toast.success(successMessage, {
      description: reply.filePath,
    });
    return true;
  }

  if (!reply.canceled) {
    showReplyErrorToast(errorMessage, reply, fallbackErrorDescription);
  }

  return false;
}

function getHeaderForPageIndex(pageIndex: number) {
  const pageNumber = filteredPages.value[pageIndex]?.physicalPageNumber ?? 1;
  const isChapterOpening =
    runningMarkerPageMetadata.value[pageIndex]?.isChapterOpening ?? false;

  const header = score.value.getHeaderForPage(pageNumber, isChapterOpening);

  // Currently, headers only support a single text box element.
  return header.elements[0] as TextBoxElement | RichTextBoxElement;
}

function getFooterForPageIndex(pageIndex: number) {
  const pageNumber = filteredPages.value[pageIndex]?.physicalPageNumber ?? 1;
  const isChapterOpening =
    runningMarkerPageMetadata.value[pageIndex]?.isChapterOpening ?? false;

  const footer = score.value.getFooterForPage(pageNumber, isChapterOpening);

  // Currently, footers only support a single text box element.
  return footer.elements[0] as TextBoxElement | RichTextBoxElement;
}

function getHeaderFooterVariantForPageIndex(
  pageIndex: number,
): HeaderFooterVariant {
  const physicalPageNumber =
    filteredPages.value[pageIndex]?.physicalPageNumber ?? 1;
  const isChapterOpening =
    runningMarkerPageMetadata.value[pageIndex]?.isChapterOpening ?? false;
  const isOddDisplayedPage = isDisplayedPageNumberOdd(
    score.value.pageSetup,
    physicalPageNumber,
  );

  if (
    score.value.pageSetup.headerDifferentFirstPage &&
    physicalPageNumber === 1
  ) {
    return 'firstPage';
  }

  if (
    score.value.pageSetup.headerFooterDifferentChapterOpening &&
    isChapterOpening
  ) {
    return 'chapterOpening';
  }

  if (score.value.pageSetup.headerDifferentOddEven) {
    return isOddDisplayedPage ? 'odd' : 'even';
  }

  return 'default';
}

function getHeaderFooterVariantLabel(variant: HeaderFooterVariant) {
  switch (variant) {
    case 'firstPage':
      return t(($) => $.dialog.pageSetup.firstPage, { ns: 'dialog' });
    case 'chapterOpening':
      return t(($) => $.dialog.pageSetup.chapterOpening, { ns: 'dialog' });
    case 'odd':
      return t(($) => $.dialog.pageSetup.oddPages, { ns: 'dialog' });
    case 'even':
      return t(($) => $.dialog.pageSetup.evenPages, { ns: 'dialog' });
    default:
      return t(($) => $.dialog.pageSetup.defaultVariant, { ns: 'dialog' });
  }
}

function getHeaderFooterBadgeLabel(pageIndex: number, kind: HeaderFooterKind) {
  const kindLabel =
    kind === 'header'
      ? t(($) => $.dialog.pageSetup.header, { ns: 'dialog' })
      : t(($) => $.dialog.pageSetup.footer, { ns: 'dialog' });

  return `${kindLabel}: ${getHeaderFooterVariantLabel(
    getHeaderFooterVariantForPageIndex(pageIndex),
  )}`;
}

function getHeaderFooterBadgeStyle(
  pageIndex: number,
  page: Page,
  kind: HeaderFooterKind,
): StyleValue {
  const margins = getResolvedMarginsForPage(page);
  const badgeGap = 4;
  const style: CSSProperties = {
    left: withZoom(margins.left),
  };

  if (kind === 'header') {
    style.top = withZoom(
      score.value.pageSetup.headerMargin +
        getHeaderForPageIndex(pageIndex).height +
        badgeGap,
    );
  } else {
    style.bottom = withZoom(
      score.value.pageSetup.footerMargin +
        getFooterForPageIndex(pageIndex).height +
        badgeGap,
    );
  }

  return style;
}

function shouldShowHeaderRuleForPageIndex(pageIndex: number) {
  const pageNumber = filteredPages.value[pageIndex]?.physicalPageNumber ?? 1;
  const isChapterOpening =
    runningMarkerPageMetadata.value[pageIndex]?.isChapterOpening ?? false;

  return score.value.shouldShowHeaderRuleForPageIndex(
    pageNumber,
    isChapterOpening,
  );
}

function shouldShowFooterRuleForPageIndex(pageIndex: number) {
  const pageNumber = filteredPages.value[pageIndex]?.physicalPageNumber ?? 1;
  const isChapterOpening =
    runningMarkerPageMetadata.value[pageIndex]?.isChapterOpening ?? false;

  return score.value.shouldShowFooterRuleOnPage(pageNumber, isChapterOpening);
}

function getTokenMetadata(pageIndex: number): TokenMetadata {
  const physicalPageNumber = filteredPages.value[pageIndex].physicalPageNumber;
  const lastPhysicalPageNumber =
    filteredPages.value[filteredPages.value.length - 1].physicalPageNumber;
  const runningMarkers = runningMarkerPageMetadata.value[pageIndex];

  return {
    pageNumber: getDisplayedPageNumber(
      score.value.pageSetup,
      physicalPageNumber,
    ),
    numberOfPages: getDisplayedPageNumber(
      score.value.pageSetup,
      lastPhysicalPageNumber,
    ),
    numerals: score.value.pageSetup.numerals,
    fileName:
      selectedWorkspace.value.filePath != null
        ? getFileNameFromPath(selectedWorkspace.value.filePath)
        : selectedWorkspace.value.tempFileName,
    filePath: currentFilePath.value || '',
    title: score.value.documentProperties.title,
    author: score.value.documentProperties.author,
    chapter: runningMarkers?.chapter ?? '',
    section: runningMarkers?.section ?? '',
  };
}

function getElementIndex(element: ScoreElement) {
  return element.index;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getLyricHtmlElement(index: number) {
  const htmlElement = getTemplateRef<InstanceType<typeof ContentEditable>[]>(
    `lyrics-${index}`,
  )[0]?.htmlElement;

  return htmlElement instanceof HTMLElement ? htmlElement : null;
}

type LyricSelectionSnapshot = {
  element: NoteElement;
  startOffset: number;
  endOffset: number;
  wasFocused: boolean;
};

function captureSelectedLyricSelection(): LyricSelectionSnapshot | null {
  const element = selectedLyrics.value;

  if (element == null) {
    return null;
  }

  const index = elements.value.indexOf(element);
  const htmlElement = getLyricHtmlElement(index);
  const selection = window.getSelection();

  if (htmlElement == null || selection == null || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (
    !htmlElement.contains(range.startContainer) ||
    !htmlElement.contains(range.endContainer)
  ) {
    return null;
  }

  return {
    element,
    startOffset: getTextOffset(
      htmlElement,
      range.startContainer,
      range.startOffset,
    ),
    endOffset: getTextOffset(htmlElement, range.endContainer, range.endOffset),
    wasFocused: document.activeElement === htmlElement,
  };
}

function getTextOffset(root: HTMLElement, container: Node, offset: number) {
  const range = document.createRange();
  range.selectNodeContents(root);
  range.setEnd(container, offset);

  const textOffset = range.toString().length;

  return textOffset;
}

function restoreLyricSelection(lyricSelection: LyricSelectionSnapshot) {
  if (selectedLyrics.value !== lyricSelection.element) {
    return;
  }

  const index = elements.value.indexOf(lyricSelection.element);
  const htmlElement = getLyricHtmlElement(index);
  const selection = window.getSelection();

  if (htmlElement == null || selection == null) {
    return;
  }

  const textLength = htmlElement.textContent?.length ?? 0;
  const clampedStartOffset = clamp(lyricSelection.startOffset, 0, textLength);
  const clampedEndOffset = clamp(lyricSelection.endOffset, 0, textLength);
  const range = document.createRange();

  setTextRangeBoundary(htmlElement, range, clampedStartOffset, true);
  setTextRangeBoundary(htmlElement, range, clampedEndOffset, false);

  if (lyricSelection.wasFocused && document.hasFocus()) {
    htmlElement.focus();
  }

  selection.removeAllRanges();
  selection.addRange(range);
}

function setTextRangeBoundary(
  root: HTMLElement,
  range: Range,
  offset: number,
  start: boolean,
) {
  let remainingOffset = offset;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = walker.nextNode();

  while (textNode != null) {
    const textLength = textNode.textContent?.length ?? 0;

    if (remainingOffset <= textLength) {
      if (start) {
        range.setStart(textNode, remainingOffset);
      } else {
        range.setEnd(textNode, remainingOffset);
      }

      return;
    }

    remainingOffset -= textLength;
    textNode = walker.nextNode();
  }

  if (start) {
    range.setStart(root, root.childNodes.length);
  } else {
    range.setEnd(root, root.childNodes.length);
  }
}

function getFirstElementForPage(pageNumber: number) {
  const page = filteredPages.value[pageNumber - 1];

  if (!page) {
    return null;
  }

  return (
    page.lines
      .flatMap((line) => line.elements)
      .find((element) => element.elementType !== ElementType.Empty) ?? null
  );
}

function getFirstLineNumberForPage(page: Page | undefined) {
  if (!page) {
    return null;
  }

  const lineIndex = page.lines.findIndex((line) =>
    line.elements.some((element) => element.elementType !== ElementType.Empty),
  );

  return lineIndex >= 0 ? lineIndex + 1 : null;
}

function getSectionNumberForPage(pageNumber: number) {
  const anchorIndex = getSectionAnchorIndexForPage(pageNumber);

  return getSectionNumberForElementIndex(anchorIndex);
}

function getSectionAnchorIndexForPage(pageNumber: number) {
  const page = filteredPages.value[pageNumber - 1];

  if (page == null) {
    return 0;
  }

  const firstPageElement = getPageElements(page).find(
    (element) => element.elementType !== ElementType.Empty,
  );

  if (firstPageElement) {
    return firstPageElement.index;
  }

  for (let pageIndex = pageNumber - 2; pageIndex >= 0; pageIndex--) {
    const prevPage = filteredPages.value[pageIndex];

    for (
      let lineIndex = prevPage.lines.length - 1;
      lineIndex >= 0;
      lineIndex--
    ) {
      const line = prevPage.lines[lineIndex];

      for (
        let elementIndex = line.elements.length - 1;
        elementIndex >= 0;
        elementIndex--
      ) {
        const element = line.elements[elementIndex];

        if (element.elementType !== ElementType.Empty) {
          return element.index;
        }
      }
    }
  }

  return 0;
}

function getPageElements(page: Page) {
  return page.lines.flatMap((line) => line.elements);
}

function getSectionNumberForElementIndex(elementIndex: number) {
  const scoreElements = elements.value.filter(
    (element) => element.elementType !== ElementType.Empty,
  );

  if (scoreElements.length === 0) {
    return 1;
  }

  const sectionMarkers = scoreElements.filter(isSectionMarker);
  if (sectionMarkers.length === 0) {
    return 1;
  }

  const firstScoreElementIndex = scoreElements[0].index;
  const hasDefaultSectionBeforeFirstMarker =
    sectionMarkers[0].index > firstScoreElementIndex;
  const markersAtOrBeforeElement = sectionMarkers.filter(
    (element) => element.index <= elementIndex,
  ).length;

  if (markersAtOrBeforeElement === 0) {
    return 1;
  }

  return (
    markersAtOrBeforeElement + (hasDefaultSectionBeforeFirstMarker ? 1 : 0)
  );
}

function getSectionCount() {
  const scoreElements = elements.value.filter(
    (element) => element.elementType !== ElementType.Empty,
  );

  if (scoreElements.length === 0) {
    return 1;
  }

  const sectionMarkers = scoreElements.filter(isSectionMarker);
  if (sectionMarkers.length === 0) {
    return 1;
  }

  return (
    sectionMarkers.length +
    (sectionMarkers[0].index > scoreElements[0].index ? 1 : 0)
  );
}

function isSectionMarker(element: ScoreElement) {
  if (
    element.elementType !== ElementType.TextBox &&
    element.elementType !== ElementType.RichTextBox
  ) {
    return false;
  }

  const runningMarkerElement = element as TextBoxElement | RichTextBoxElement;

  if (runningMarkerElement.runningMarkerRole !== 'section') {
    return false;
  }

  return resolveRunningMarkerText(runningMarkerElement) != null;
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

function onSelectAllScoreElements() {
  const firstElementIndex = elements.value.findIndex(
    (element) => element.elementType !== ElementType.Empty,
  );
  const lastElementIndex = elements.value.findLastIndex(
    (element) => element.elementType !== ElementType.Empty,
  );

  if (firstElementIndex < 0 || lastElementIndex < 0) {
    return;
  }

  selectedElement.value = null;
  selectedLyrics.value = null;
  selectedHeaderFooterElement.value = null;
  selectionRange.value = { start: firstElementIndex, end: lastElementIndex };
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

function openParagraphStylesDialog(
  styleId: string = BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
) {
  paragraphStylesDialogSelectedStyleId.value = styleId;
  paragraphStylesDialogIsOpen.value = true;
}

function updatePlaybackOptions(options: PlaybackOptions) {
  Object.assign(audioOptions, options);
}

function closeExportDialog() {
  exportDialogIsOpen.value = false;
}

function setPaneVisibility(paneId: WorkspacePaneId, isVisible: boolean) {
  const visibility = paneVisibility.value;

  if (visibility[paneId] === isVisible) {
    return;
  }

  visibility[paneId] = isVisible;
}

function syncDeveloperPanelsMenuState() {
  EventBus.$emit(
    IpcRendererChannels.SetDeveloperPaneEnabled,
    editorPreferences.value.showDeveloperPanels,
  );

  EventBus.$emit(IpcRendererChannels.SetWorkspacePaneVisibility, {
    developer: paneVisibility.value.developer,
  });
}

function syncDeveloperPanelsFromPreferencesOnStartup() {
  setPaneVisibility('developer', editorPreferences.value.showDeveloperPanels);
  syncDeveloperPanelsMenuState();
}

function updateDeveloperToggle(
  key:
    | 'overlaysEnabled'
    | 'printOverlays'
    | 'showAdjustmentRatios'
    | 'showAnonymousBoxes'
    | 'showCollisionRegions'
    | 'showElementBoxes'
    | 'showGuides'
    | 'showGlueWidths'
    | 'showInkBoundingBoxes'
    | 'showLyricBoundingBoxes'
    | 'showNeumeBoundingBoxes',
  value: boolean,
) {
  editorPreferences.value[key] = value;
  saveEditorPreferences();
}

function getSelectedRichTextOwner() {
  return (
    selectedWorkspace.value.selectedAnnotationElement ??
    selectedRichTextBoxElement.value
  );
}

function refocusSelectedRichTextEditorAfterShowingPane(
  paneId: WorkspacePaneId,
  isVisible: boolean,
) {
  if (paneId !== 'properties' || !isVisible) {
    return;
  }

  const owner = getSelectedRichTextOwner();

  if (owner == null) {
    return;
  }

  void nextTick(() => {
    if (
      paneVisibility.value.properties &&
      getSelectedRichTextOwner() === owner
    ) {
      focusLastActiveEditorForOwner(owner);
    }
  });
}

function showPropertiesPaneForRichTextNeume() {
  if (paneVisibility.value.properties) {
    return;
  }

  setPaneVisibility('properties', true);
  refocusSelectedRichTextEditorAfterShowingPane('properties', true);
}

function resetLayout() {
  const defaultVisibility = createDefaultPaneVisibility();

  Object.assign(paneVisibility.value, defaultVisibility);
  paneVisibility.value.developer = editorPreferences.value.showDeveloperPanels;
  paneLayoutResetCounter.value += 1;
}

function onPaneVisibilityChange(paneId: WorkspacePaneId, isVisible: boolean) {
  if (paneId === 'developer') {
    if (!editorPreferencesHydrated.value) {
      setPaneVisibility('developer', isVisible);
      return;
    }

    setPaneVisibility('developer', isVisible);
    return;
  }

  setPaneVisibility(paneId, isVisible);
  refocusSelectedRichTextEditorAfterShowingPane(paneId, isVisible);
}

function updateEditorPreferences(form: EditorPreferences) {
  const languageChanged = editorPreferences.value.language !== form.language;
  const developerPanelsChanged =
    editorPreferences.value.showDeveloperPanels !== form.showDeveloperPanels;

  Object.assign(editorPreferences.value, form);

  if (developerPanelsChanged) {
    setPaneVisibility('developer', form.showDeveloperPanels);
    saveEditorPreferences();
    syncDeveloperPanelsMenuState();
  } else {
    saveEditorPreferences();
  }

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

function getInspectorSelectionElement() {
  const context = inspectorContext.value;

  switch (context.kind) {
    case 'none':
    case 'range':
    case 'lyrics':
      return null;
    case 'text-box':
    case 'rich-text-box':
      return context.source === 'score' ? context.element : null;
    case 'annotation':
      return selectedElement.value;
    case 'neume':
      return selectedElementForNeumeToolbar.value;
    default:
      return context.element;
  }
}

function getInspectorSelectionElementCollection(element: ScoreElement) {
  const alternateLine = selectedWorkspace.value.selectedAlternateLineElement;

  if (alternateLine?.elements.includes(element)) {
    return alternateLine.elements;
  }

  return elements.value;
}

function canApplyInspectorBreakToElement(
  element: ScoreElement,
  collection: ScoreElement[],
) {
  return collection === elements.value && !isLastElement(element);
}

const canApplyInspectorBreak = computed(() => {
  const element = getInspectorSelectionElement();

  if (element == null) {
    return false;
  }

  return canApplyInspectorBreakToElement(
    element,
    getInspectorSelectionElementCollection(element),
  );
});

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

function onClickOpenScore() {
  EventBus.$emit(IpcRendererChannels.OpenScoreDialog);
}

function onClickPrintScore() {
  if (isLoading.value) {
    return;
  }

  if (isBrowser.value) {
    window.print();
  } else {
    void onFileMenuPrint();
  }
}

function onSetCanUndo(value: boolean) {
  canUndo.value = value;
}

function onSetCanRedo(value: boolean) {
  canRedo.value = value;
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

function toggleInspectorPageBreak() {
  const element = getInspectorSelectionElement();

  if (element == null) {
    return;
  }

  const collection = getInspectorSelectionElementCollection(element);

  if (!canApplyInspectorBreakToElement(element, collection)) {
    return;
  }

  commandService.value.execute(
    scoreElementCommandFactory.create('update-properties', {
      target: element,
      newValues: {
        pageBreak: !element.pageBreak,
        lineBreak: false,
      },
    }),
  );

  save();
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

function toggleInspectorLineBreak(lineBreakType: LineBreakType | null) {
  const element = getInspectorSelectionElement();

  if (element == null) {
    return;
  }

  const collection = getInspectorSelectionElementCollection(element);

  if (!canApplyInspectorBreakToElement(element, collection)) {
    return;
  }

  let lineBreak = !element.lineBreak;

  if (lineBreakType != element.lineBreakType) {
    lineBreak = true;
  }

  if (!lineBreak) {
    lineBreakType = null;
  }

  commandService.value.execute(
    scoreElementCommandFactory.create('update-properties', {
      target: element,
      newValues: {
        lineBreak,
        pageBreak: false,
        lineBreakType,
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

function isSyllableElement(element: ScoreElement): element is NoteElement {
  return element.elementType == ElementType.Note;
}

function isMartyriaElement(element: ScoreElement): element is MartyriaElement {
  return element.elementType == ElementType.Martyria;
}

function isTempoElement(element: ScoreElement): element is TempoElement {
  return element.elementType == ElementType.Tempo;
}

function isEmptyElement(element: ScoreElement): element is EmptyElement {
  return element.elementType == ElementType.Empty;
}

function isTextBoxElement(element: ScoreElement): element is TextBoxElement {
  return element.elementType == ElementType.TextBox;
}

function isRichTextBoxElement(
  element: ScoreElement,
): element is RichTextBoxElement {
  return element.elementType == ElementType.RichTextBox;
}

function selectHeaderRichTextBox(pageIndex: number) {
  const element = getHeaderForPageIndex(pageIndex);

  if (isRichTextBoxElement(element)) {
    selectHeaderFooterRichTextBox(element, `header-${pageIndex}`);
  }
}

function selectFooterRichTextBox(pageIndex: number) {
  const element = getFooterForPageIndex(pageIndex);

  if (isRichTextBoxElement(element)) {
    selectHeaderFooterRichTextBox(element, `footer-${pageIndex}`);
  }
}

function selectHeaderFooterRichTextBox(
  element: RichTextBoxElement,
  refName: string,
) {
  const alreadySelected = selectedRichTextBoxElement.value === element;

  preferredRichTextBoxFocusTarget.value = { element, refName };
  selectedHeaderFooterElement.value = element;

  if (alreadySelected) {
    focusSelectedRichTextBoxEditor(element);
  }
}

function focusSelectedRichTextBoxEditor(element: RichTextBoxElement) {
  nextTick(() => {
    if (
      selectedRichTextBoxElement.value !== element ||
      isActiveEditorForOwner(element)
    ) {
      return;
    }

    const component = getRichTextBoxComponentRef(element);

    clearPreferredRichTextBoxFocusTarget(element);
    component?.focus();
  });
}

function getRichTextBoxComponentRef(element: RichTextBoxElement) {
  return (
    getPreferredRichTextBoxComponentRef(element) ??
    getRichTextBoxComponentRefs(element)[0]
  );
}

function getRichTextBoxComponentRefs(element: RichTextBoxElement) {
  const components: RichTextBoxComponent[] = [];
  const scoreElementIndex = getElementIndex(element);

  if (elements.value[scoreElementIndex] === element) {
    components.push(
      ...getTemplateRef<RichTextBoxComponent[]>(`element-${scoreElementIndex}`),
    );
  }

  for (let pageIndex = 0; pageIndex < filteredPages.value.length; pageIndex++) {
    const page = filteredPages.value[pageIndex];

    if (!page.isVisible && !printMode.value) {
      continue;
    }

    if (
      score.value.pageSetup.showHeader &&
      getHeaderForPageIndex(pageIndex) === element
    ) {
      components.push(
        ...getTemplateRef<RichTextBoxComponent[]>(`header-${pageIndex}`),
      );
    }

    if (
      score.value.pageSetup.showFooter &&
      getFooterForPageIndex(pageIndex) === element
    ) {
      components.push(
        ...getTemplateRef<RichTextBoxComponent[]>(`footer-${pageIndex}`),
      );
    }
  }

  return components;
}

function getPreferredRichTextBoxComponentRef(element: RichTextBoxElement) {
  const target = preferredRichTextBoxFocusTarget.value;

  if (target == null || target.element !== element) {
    return undefined;
  }

  return getTemplateRef<RichTextBoxComponent[]>(target.refName)[0];
}

function clearPreferredRichTextBoxFocusTarget(element?: RichTextBoxElement) {
  const target = preferredRichTextBoxFocusTarget.value;

  if (target == null || element == null || target.element === element) {
    preferredRichTextBoxFocusTarget.value = null;
  }
}

function getAnnotationComponentRef(annotation: AnnotationElement) {
  return getAnnotationContext(annotation)?.component;
}

function getAnnotationContext(annotation: AnnotationElement) {
  for (const element of elements.value) {
    if (!isSyllableElement(element)) {
      continue;
    }

    const annotationIndex = element.annotations.indexOf(annotation);

    if (annotationIndex >= 0) {
      const component = getTemplateRef<AnnotationComponent[]>(
        `annotation-${getElementIndex(element)}-${annotationIndex}`,
      )[0];

      return { component, parent: element };
    }
  }

  return undefined;
}

function isDropCapElement(element: ScoreElement): element is DropCapElement {
  return element.elementType == ElementType.DropCap;
}

function isModeKeyElement(element: ScoreElement): element is ModeKeyElement {
  return element.elementType == ElementType.ModeKey;
}

function isImageBoxElement(element: ScoreElement): element is ImageBoxElement {
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

type WorkspaceTabNavigationDirection = 'previous' | 'next';

function isEditorShortcutIgnored(event: KeyboardEvent) {
  return (
    event.target instanceof Element &&
    (event.target.closest('[data-editor-shortcuts="ignore"]') != null ||
      (toolbarInteractionKeyCodes.has(event.code) &&
        event.target.closest('[role="toolbar"], [data-slot="toolbar"]') !=
          null))
  );
}

function onEditorViewportResize() {
  if (zoomFitMode.value != null) {
    performZoomToFit();
  }
}

function onScroll() {
  calculatePageNumber();
}

type ZoomWheelAnchor =
  | {
      kind: 'page';
      pageElement: HTMLElement;
      clientX: number;
      clientY: number;
      pageX: number;
      pageY: number;
    }
  | {
      kind: 'scroll';
      scrollX: number;
      scrollY: number;
      viewportOffsetX: number;
      viewportOffsetY: number;
    };

function resetZoomWheelDelta() {
  zoomWheelDelta = 0;
  clearZoomWheelDeltaReset();
}

function clearZoomWheelDeltaReset() {
  if (zoomWheelResetTimeout == null) {
    return;
  }

  window.clearTimeout(zoomWheelResetTimeout);
  zoomWheelResetTimeout = null;
}

function scheduleZoomWheelDeltaReset() {
  clearZoomWheelDeltaReset();

  zoomWheelResetTimeout = window.setTimeout(() => {
    zoomWheelDelta = 0;
    zoomWheelResetTimeout = null;
  }, ZOOM_WHEEL_DELTA_RESET_DELAY_MS);
}

function createZoomWheelAnchor(
  event: WheelEvent,
  pageBackgroundElement: HTMLElement,
  zoomValue: number,
): ZoomWheelAnchor {
  const pageElement =
    event.target instanceof Element ? event.target.closest('.page') : null;

  if (
    pageElement instanceof HTMLElement &&
    pageBackgroundElement.contains(pageElement)
  ) {
    const pageRect = pageElement.getBoundingClientRect();

    return {
      kind: 'page',
      pageElement,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: (event.clientX - pageRect.left) / zoomValue,
      pageY: (event.clientY - pageRect.top) / zoomValue,
    };
  }

  // Fallback for gutters/padding between pages. Fixed page margins and
  // container padding do not scale, so this only approximately preserves the
  // cursor position when the wheel event is not over a page.
  const backgroundRect = pageBackgroundElement.getBoundingClientRect();
  const computedStyle = getComputedStyle(pageBackgroundElement);
  const viewportOffsetX =
    event.clientX - backgroundRect.left - parseFloat(computedStyle.paddingLeft);
  const viewportOffsetY =
    event.clientY - backgroundRect.top - parseFloat(computedStyle.paddingTop);

  return {
    kind: 'scroll',
    scrollX: pageBackgroundElement.scrollLeft + viewportOffsetX,
    scrollY: pageBackgroundElement.scrollTop + viewportOffsetY,
    viewportOffsetX,
    viewportOffsetY,
  };
}

function restoreZoomWheelAnchor(
  anchor: ZoomWheelAnchor,
  pageBackgroundElement: HTMLElement,
  previousZoom: number,
) {
  nextTick(() => {
    if (!pageBackgroundElement.isConnected) {
      return;
    }

    if (anchor.kind === 'page') {
      if (!pageBackgroundElement.contains(anchor.pageElement)) {
        return;
      }

      const pageRect = anchor.pageElement.getBoundingClientRect();
      pageBackgroundElement.scrollLeft +=
        pageRect.left + anchor.pageX * zoom.value - anchor.clientX;
      pageBackgroundElement.scrollTop +=
        pageRect.top + anchor.pageY * zoom.value - anchor.clientY;
    } else {
      const zoomRatio = zoom.value / previousZoom;

      if (!Number.isFinite(zoomRatio) || zoomRatio <= 0) {
        return;
      }

      pageBackgroundElement.scrollLeft =
        anchor.scrollX * zoomRatio - anchor.viewportOffsetX;
      pageBackgroundElement.scrollTop =
        anchor.scrollY * zoomRatio - anchor.viewportOffsetY;
    }

    calculatePageNumber();
  });
}

function applyZoomWheelStep(
  event: WheelEvent,
  pageBackgroundElement: HTMLElement,
  direction: 1 | -1,
) {
  const previousZoom = zoom.value;
  const anchor = createZoomWheelAnchor(
    event,
    pageBackgroundElement,
    previousZoom,
  );

  if (zoomToNearestStep(direction)) {
    restoreZoomWheelAnchor(anchor, pageBackgroundElement, previousZoom);
  }
}

function onPageBackgroundWheel(event: WheelEvent) {
  const isZoomWheelShortcut =
    event.ctrlKey || (platformService.isMac && event.metaKey);

  if (event.defaultPrevented || !isZoomWheelShortcut) {
    return;
  }

  const pageBackgroundElement =
    event.currentTarget instanceof HTMLElement
      ? event.currentTarget
      : pageBackgroundRef.value;

  if (pageBackgroundElement == null) {
    return;
  }

  const { deltaY } = event;

  if (deltaY === 0) {
    return;
  }

  // This is a vertical Ctrl/Cmd+wheel over the document: suppress the browser's
  // native zoom even if we decline to zoom below (e.g. while a dialog is open).
  event.preventDefault();

  if (dialogOpen.value) {
    return;
  }

  // Discrete wheels (e.g. Firefox in line/page mode) deliver one notch per
  // event, so zoom a single step immediately. The accumulator below is tuned
  // for high-resolution pixel deltas (mice and trackpad pinch in Chromium);
  // accumulating discrete notches would require several to cross the
  // threshold, making one deliberate notch feel unresponsive.
  if (event.deltaMode !== WheelEvent.DOM_DELTA_PIXEL) {
    resetZoomWheelDelta();
    applyZoomWheelStep(event, pageBackgroundElement, deltaY < 0 ? 1 : -1);
    return;
  }

  if (zoomWheelDelta !== 0 && Math.sign(zoomWheelDelta) !== Math.sign(deltaY)) {
    zoomWheelDelta = 0;
  }

  zoomWheelDelta += deltaY;

  if (Math.abs(zoomWheelDelta) < ZOOM_WHEEL_DELTA_THRESHOLD) {
    scheduleZoomWheelDeltaReset();
    return;
  }

  const direction = zoomWheelDelta < 0 ? 1 : -1;

  resetZoomWheelDelta();
  applyZoomWheelStep(event, pageBackgroundElement, direction);
}

function onKeydown(event: KeyboardEvent) {
  if (event.defaultPrevented) {
    return;
  }

  const editorShortcutIgnored = isEditorShortcutIgnored(event);

  if (platformService.isMac && isTextInputFocused() && !dialogOpen.value) {
    onKeydownMac(event);
  }

  if (event.defaultPrevented || editorShortcutIgnored) {
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
    } else if (event.code === 'KeyA' && !event.shiftKey) {
      throttled.onSelectAllScoreElements();
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
        const gorgonNeumes = gorgonMapping.neumes as GorgonNeume[];
        const secondaryGorgonNeume = getSecondaryGorgonNeume(gorgonNeumes);

        if (
          toolbarInnerNeume.value === 'Secondary' &&
          noteElement.quantitativeNeume !== QuantitativeNeume.Hyporoe &&
          getSecondaryNeume(noteElement.quantitativeNeume) != null &&
          secondaryGorgonNeume != null
        ) {
          throttled.setSecondaryGorgon(noteElement, secondaryGorgonNeume);
        } else {
          throttled.setGorgon(noteElement, gorgonNeumes);
        }
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
      void pasteTextFromClipboard();
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

/**
 * THE gate for putting score elements on the clipboard.
 *
 * Rich-text box content lives in the live CKEditor instance and is only synced
 * into `element.content` by an explicit flush (see `flushPendingRichTextEditors`).
 * `clone()` reads `element.content`, so we MUST flush before cloning or the
 * clipboard captures pre-edit content whenever the editor was never blurred.
 * Routing every copy/cut clone through here keeps the flush and the clone
 * inseparable -- a new clipboard path cannot forget the flush.
 */
function flushAndCloneForClipboard(
  elementsToClone: ScoreElement[],
): ScoreElement[] {
  flushPendingRichTextEditors(selectedWorkspace.value);
  return elementsToClone.map((x) => x.clone());
}

const canCutCopySelected = computed(
  () => getSelectedNonEmptyElements().length > 0,
);

const canPasteSelected = computed(
  () => clipboard.value.length > 0 && selectedElement.value != null,
);

const canSelectAllElements = computed(() =>
  elements.value.some((element) => element.elementType !== ElementType.Empty),
);

function getSelectedNonEmptyElements() {
  if (selectionRange.value != null) {
    return elements.value.filter(
      (element) =>
        element.elementType !== ElementType.Empty && isSelected(element),
    );
  }

  if (
    selectedElement.value != null &&
    selectedElement.value.elementType !== ElementType.Empty
  ) {
    return [selectedElement.value];
  }

  return [];
}

function onCutScoreElements() {
  if (selectionRange.value != null) {
    const start = Math.min(
      selectionRange.value.start,
      selectionRange.value.end,
    );

    const elementsToCut = getSelectedNonEmptyElements();

    clipboard.value = flushAndCloneForClipboard(elementsToCut);

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

    clipboard.value = flushAndCloneForClipboard([selectedElement.value]);

    removeScoreElement(selectedElement.value);

    selectedElement.value =
      elements.value[Math.min(currentIndex, elements.value.length - 1)];

    save();
  }
}

function onCopyScoreElements() {
  const elementsToCopy = getSelectedNonEmptyElements();

  if (elementsToCopy.length > 0) {
    clipboard.value = flushAndCloneForClipboard(elementsToCopy);
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

  const lyricSelection = captureSelectedLyricSelection();

  // Save the indexes of the visible pages
  const visiblePages = pages.value
    .map((_, i) => i)
    .filter((i) => pages.value[i].isVisible);

  const processedPages = LayoutService.processPages(
    toRaw(selectedWorkspace.value),
    shouldCollectLayoutDiagnostics.value
      ? { collectDiagnostics: true }
      : undefined,
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

  if (lyricSelection != null) {
    nextTick(() => {
      restoreLyricSelection(lyricSelection);
    });
  }

  // Auto-persist to local/dev storage. This deliberately serializes WITHOUT
  // flushing the live rich-text editors: `save()` runs frequently -- often via the
  // 250 ms-debounced `saveDebounced` (e.g. on every height change while editing) --
  // and flushing here would force a getData() + full layout round-trip each time
  // (updateRichTextBox calls save(), so it would also re-enter). The trade is
  // intentional -- the snapshot may lag the in-editor text by one flush, which is
  // corrected on the next blur or explicit save; the authoritative save
  // (saveWorkspace -> prepareWorkspaceForSerialization) always flushes first.
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
      await nextTick();
      await ipcService.exportWorkspaceAsLatex(
        selectedWorkspace.value,
        JSON.stringify(
          latexExporter.export(
            pages.value,
            score.value.pageSetup,
            score.value.paragraphStyles,
            options,
          ),
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

  pages.value = LayoutService.processPages(
    selectedWorkspace.value,
    shouldCollectLayoutDiagnostics.value
      ? { collectDiagnostics: true }
      : undefined,
  );
}

/**
 * THE gate for explicit serialization -- save, save-as, print, and the
 * PDF/PNG/HTML/MusicXML/LaTeX exporters all route through here. Rich-text content
 * is live in the editor and stale in `element.content` until flushed, so any path
 * that serializes the score for persistence or export MUST call this first.
 *
 * The debounced autosave in `save()` deliberately does NOT come through here -- see
 * the comment there.
 */
function prepareWorkspaceForSerialization(workspace: Workspace) {
  flushPendingRichTextEditors(workspace);
  flushLyricsAssignment(workspace);

  if (!workspace.score.staff.lyrics.locked) {
    extractStaffLyrics(workspace);
  }
}

async function saveWorkspace(workspace: Workspace) {
  prepareWorkspaceForSerialization(workspace);

  return await ipcService.saveWorkspace(workspace);
}

async function saveWorkspaceAs(workspace: Workspace) {
  prepareWorkspaceForSerialization(workspace);

  return await ipcService.saveWorkspaceAs(workspace);
}

async function closeWorkspace(workspace: Workspace) {
  let shouldClose = true;

  flushPendingRichTextEditors(workspace);

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
      try {
        const saveResult =
          workspace.filePath != null
            ? await saveWorkspace(workspace)
            : await saveWorkspaceAs(workspace);

        // If they successfully saved, then we can close the workspace
        shouldClose = saveResult.success;

        if (!saveResult.success && !saveResult.canceled) {
          showReplyErrorToast(
            t(($) => $.toast.editor.saveFailed, { ns: 'toast' }),
            saveResult,
            t(($) => $.toast.editor.saveFailedDescription, { ns: 'toast' }),
          );
        }
      } catch (error) {
        console.error(error);
        shouldClose = false;
        showErrorToast(
          t(($) => $.toast.editor.saveFailed, { ns: 'toast' }),
          error,
          {
            fallback: t(($) => $.toast.editor.saveFailedDescription, {
              ns: 'toast',
            }),
          },
        );
      }
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
  flushPendingRichTextEditors(selectedWorkspace.value);

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

function setModeKeyTempo(element: ModeKeyElement, neume: TempoSign) {
  if (element.tempo === neume) {
    updateModeKeyTempo(element, null);
  } else {
    updateModeKeyTempo(element, neume);
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
  const previousElement = elements.value[replaceAtIndex];

  commandService.value.execute(
    scoreElementCommandFactory.create('replace-element-in-collection', {
      element,
      collection: elements.value,
      replaceAtIndex,
    }),
  );

  if (selectedElement.value === previousElement) {
    selectedElement.value = element;
  }

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
  const workspace = selectedWorkspace.value;

  workspace.score.staff.lyrics.text = staffLyrics;
  scheduleLyricsAssignment(workspace);
  hasUnsavedChanges.value = true;
}

function scheduleLyricsAssignment(workspace: Workspace) {
  cancelLyricsAssignment(workspace);

  pendingLyricsAssignmentTimers.set(
    workspace.id,
    window.setTimeout(() => {
      pendingLyricsAssignmentTimers.delete(workspace.id);
      assignLyrics(workspace);
    }, keydownThrottleIntervalMs),
  );
}

function flushLyricsAssignment(workspace: Workspace) {
  if (!pendingLyricsAssignmentTimers.has(workspace.id)) {
    return;
  }

  cancelLyricsAssignment(workspace);
  assignLyrics(workspace);
}

function cancelLyricsAssignment(workspace: Workspace) {
  const timer = pendingLyricsAssignmentTimers.get(workspace.id);

  if (timer == null) {
    return;
  }

  window.clearTimeout(timer);
  pendingLyricsAssignmentTimers.delete(workspace.id);
}

function clearPendingLyricsAssignments() {
  for (const timer of pendingLyricsAssignmentTimers.values()) {
    window.clearTimeout(timer);
  }

  pendingLyricsAssignmentTimers.clear();
}

function assignLyrics(workspace: Workspace = selectedWorkspace.value) {
  const workspaceScore = workspace.score;
  const workspaceElements = workspaceScore.staff.elements;
  const workspaceIsSelected = workspace === selectedWorkspace.value;
  const updateCommands: Command[] = [];

  lyricService.assignLyrics(
    workspaceScore.staff.lyrics.text,
    workspaceElements,
    workspaceScore.pageSetup.melkiteRtl,
    workspaceScore.pageSetup.disableGreekMelismata,
    (note, lyrics) => {
      if (workspaceIsSelected) {
        setLyrics(getElementIndex(note), lyrics);
      }
    },
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

  if (updateCommands.length === 0) {
    return;
  }

  workspace.commandService.executeAsBatch(
    updateCommands,
    workspaceScore.staff.lyrics.locked,
  );

  if (workspaceIsSelected) {
    save();
  } else {
    workspace.hasUnsavedChanges = true;
    selectedWorkspace.value.commandService.notify();
  }
}

function extractStaffLyrics(workspace: Workspace) {
  workspace.score.staff.lyrics.text = lyricService.extractLyrics(
    workspace.score.staff.elements,
    workspace.score.pageSetup.disableGreekMelismata,
  );
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
  flushLyricsAssignment(selectedWorkspace.value);

  if (lyricsLocked.value) {
    assignLyrics();
  } else if (isLyricsManagerOpen.value) {
    extractStaffLyrics(selectedWorkspace.value);
  }
}

function updateAnnotation(
  element: AnnotationElement,
  newValues: Partial<AnnotationElement>,
) {
  const annotationContext = getAnnotationContext(element);

  if (newValues.text != null && newValues.text.trim() === '') {
    if (annotationContext != null) {
      removeAnnotation(annotationContext.parent, element);
    }

    return;
  }

  if (newValues.text == null && annotationContext?.component != null) {
    const currentText = annotationContext.component.getCurrentText();

    if (currentText.trim() === '') {
      removeAnnotation(annotationContext.parent, element);
      return;
    }

    if (element.text !== currentText) {
      newValues = {
        ...newValues,
        text: currentText,
      };
    }
  }

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
  newValues = {
    ...getPendingRichTextBoxUpdates(element),
    ...newValues,
  };

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

function getPendingRichTextBoxUpdates(element: RichTextBoxElement) {
  const updates: Partial<RichTextBoxElement> = {};

  for (const component of getRichTextBoxComponentRefs(element)) {
    Object.assign(updates, component.getPendingUpdates() ?? {});
  }

  return updates;
}

/**
 * Low-level flush primitive: sync the live editors' content into the model for
 * the selected workspace. Prefer the gates that wrap it --
 * `prepareWorkspaceForSerialization` (serialize/export) and
 * `flushAndCloneForClipboard` (copy/cut). Only the selected workspace has live
 * editors; a non-selected one was already flushed when it was switched away.
 */
function flushPendingRichTextEditors(workspace: Workspace) {
  if (workspace !== selectedWorkspace.value) {
    return;
  }

  flushPendingRichTextBoxEditor();
  flushPendingAnnotationEditor();
}

function flushPendingRichTextBoxEditor() {
  const element = selectedRichTextBoxElement.value;

  if (element == null) {
    return;
  }

  const updates = getPendingRichTextBoxUpdates(element);

  if (Object.keys(updates).length > 0) {
    updateRichTextBox(element, updates);
  }
}

function flushPendingAnnotationEditor() {
  const annotation = selectedWorkspace.value.selectedAnnotationElement;

  if (annotation == null) {
    return;
  }

  const component = getAnnotationComponentRef(annotation);

  if (component == null) {
    return;
  }

  const updates = component.getPendingUpdates();
  const currentText = updates.text ?? component.getCurrentText();

  if (currentText.trim() === '') {
    updateAnnotation(annotation, { text: currentText });
    return;
  }

  if (Object.keys(updates).length > 0) {
    updateAnnotation(annotation, updates);
  }
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
    const elementsToDelete = getSelectedNonEmptyElements();

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

function deleteInspectorSelectionElement() {
  if (inspectorContext.value.kind === 'range') {
    deleteSelectedElement();
    return;
  }

  const element = getInspectorSelectionElement();

  if (element == null) {
    return;
  }

  const alternateLine = selectedWorkspace.value.selectedAlternateLineElement;

  if (alternateLine?.elements.includes(element)) {
    if (
      alternateLine.elements.length === 1 &&
      selectedElement.value?.elementType === ElementType.Note
    ) {
      removeAlternateLine(selectedElement.value as NoteElement, alternateLine);
    } else {
      removeScoreElement(element, alternateLine.elements);
      save();
    }

    return;
  }

  deleteSelectedElement();
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

function getResolvedAnnotationStyle() {
  return resolveParagraphStyle(
    score.value.paragraphStyles,
    BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation,
  );
}

function getResolvedDefaultParagraphStyle() {
  return resolveParagraphStyle(
    score.value.paragraphStyles,
    BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
  );
}

function getResolvedLyricsStyle(element?: NoteElement) {
  return resolveParagraphStyle(
    score.value.paragraphStyles,
    element?.lyricsParagraphStyleId ?? BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    element?.getParagraphStyleOverrides(),
  );
}

function getDefaultLyricsFont() {
  const resolvedLyricsStyle = getResolvedLyricsStyle();
  const resolvedLyricsFont = resolveFontStyle(
    resolvedLyricsStyle.fontFamily,
    resolvedLyricsStyle.fontStyle,
  );

  return `${resolvedLyricsFont.cssFontStyle} normal ${resolvedLyricsFont.cssFontWeight} ${resolvedLyricsStyle.fontSize}px "${resolvedLyricsFont.cssFontFamily}"`;
}

function getResizableTextDefaultSnapshot(currentScore: Score) {
  return {
    defaultText: resolveParagraphStyle(
      currentScore.paragraphStyles,
      BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    ),
    lyrics: resolveParagraphStyle(
      currentScore.paragraphStyles,
      BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics,
    ),
  };
}

function updatePageSetup(pageSetup: PageSetup) {
  const currentPageSetup = score.value.pageSetup;
  const nextPageSetup = normalizePageSetupForGeneratedHeaderFooterDefaults(
    pageSetup,
    shouldAutoEnableDifferentOddEvenForFacingPages(
      score.value,
      currentPageSetup,
      pageSetup,
    ),
  );

  const updateCommands: Command[] = [
    pageSetupCommandFactory.create('update-properties', {
      target: currentPageSetup,
      newValues: nextPageSetup,
    }),
  ];

  if (nextPageSetup.richHeaderFooter !== currentPageSetup.richHeaderFooter) {
    pushHeaderFooterReplacementCommands(
      updateCommands,
      score.value,
      createGeneratedHeaderFooterTemplates(
        nextPageSetup,
        nextPageSetup.richHeaderFooter,
      ),
    );
  } else if (
    generatedHeaderFooterDefaultsChanged(currentPageSetup, nextPageSetup)
  ) {
    const oldGeneratedTemplates = createGeneratedHeaderFooterTemplates(
      currentPageSetup,
      currentPageSetup.richHeaderFooter,
    );
    const newGeneratedTemplates = createGeneratedHeaderFooterTemplates(
      nextPageSetup,
      nextPageSetup.richHeaderFooter,
    );

    for (const slot of headerFooterSlots) {
      const currentElement = getHeaderFooterSlotElement(score.value, slot);
      const oldGeneratedElement = getHeaderFooterTemplateSlotElement(
        oldGeneratedTemplates,
        slot,
      );

      if (
        currentElement != null &&
        areGeneratedHeaderFooterElementsEqual(
          currentElement,
          oldGeneratedElement,
        )
      ) {
        updateCommands.push(
          createHeaderFooterReplacementCommand(
            score.value,
            slot,
            getHeaderFooterTemplateSlotElement(newGeneratedTemplates, slot),
          ),
        );
      }
    }
  }

  commandService.value.executeAsBatch(updateCommands);

  save();
}

function updateDocumentProperties(documentProperties: DocumentProperties) {
  commandService.value.execute(
    documentPropertiesCommandFactory.create('update-properties', {
      target: score.value.documentProperties,
      newValues: documentProperties,
    }),
  );

  save();
}

function getAllTextStyleElements(score: Score) {
  return [...score.staff.elements, ...score.headersAndFooters].filter(
    (element): element is TextBoxElement => isTextBoxElement(element),
  );
}

function getAllRichTextBoxes(score: Score) {
  return [...score.staff.elements, ...score.headersAndFooters].filter(
    (element): element is RichTextBoxElement => isRichTextBoxElement(element),
  );
}

function getAllNoteElements(score: Score) {
  return score.staff.elements.filter(
    (element): element is NoteElement =>
      element.elementType === ElementType.Note,
  );
}

function getAllDropCapElements(score: Score) {
  return score.staff.elements.filter(
    (element): element is DropCapElement =>
      element.elementType === ElementType.DropCap,
  );
}

function getDeletedStyleFallbacks(
  previousStylesById: Map<string, ParagraphStyle>,
  nextStyleIds: Set<string>,
) {
  const deletedStyleFallbacks = new Map<string, string>();

  for (const [styleId, style] of previousStylesById.entries()) {
    if (nextStyleIds.has(styleId)) {
      continue;
    }

    deletedStyleFallbacks.set(
      styleId,
      style.parentStyleId != null && nextStyleIds.has(style.parentStyleId)
        ? style.parentStyleId
        : BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
    );
  }

  return deletedStyleFallbacks;
}

function rewriteRichTextHtmlForDeletedStyles(
  html: string,
  deletedStyleFallbacks: Map<string, string>,
) {
  if (html === '' || deletedStyleFallbacks.size === 0) {
    return html;
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const styledElements = template.content.querySelectorAll('[class]');

  for (const element of styledElements) {
    const classes = Array.from(element.classList);
    const deletedClasses: string[] = [];

    for (const className of classes) {
      if (!className.startsWith('neanes-style-')) {
        continue;
      }

      const styleId = className.slice('neanes-style-'.length);

      if (!deletedStyleFallbacks.has(styleId)) {
        continue;
      }

      deletedClasses.push(className);
      const fallbackStyleId = deletedStyleFallbacks.get(styleId);

      if (fallbackStyleId == null) {
        continue;
      }

      const fallbackClassName = `neanes-style-${fallbackStyleId}`;

      if (!element.classList.contains(fallbackClassName)) {
        element.classList.add(fallbackClassName);
      }
    }

    for (const className of deletedClasses) {
      element.classList.remove(className);
    }
  }

  return template.innerHTML;
}

function updateParagraphStyles(paragraphStyles: ParagraphStyle[]) {
  flushPendingRichTextEditors(selectedWorkspace.value);

  const previousResizableTextDefaults = getResizableTextDefaultSnapshot(
    score.value,
  );
  const previousStylesById = new Map(
    score.value.paragraphStyles.map((style) => [style.id, style]),
  );
  const clonedStyles = paragraphStyles.map((style) => style.clone());
  const nextStyleIds = new Set(clonedStyles.map((style) => style.id));
  const deletedStyleFallbacks = getDeletedStyleFallbacks(
    previousStylesById,
    nextStyleIds,
  );
  const commands: Command[] = [
    scoreCommandFactory.create('update-properties', {
      target: score.value,
      newValues: { paragraphStyles: clonedStyles },
    }),
  ];

  for (const element of getAllTextStyleElements(score.value)) {
    if (nextStyleIds.has(element.paragraphStyleId)) {
      continue;
    }

    commands.push(
      textBoxCommandFactory.create('update-properties', {
        target: element,
        newValues: {
          paragraphStyleId:
            deletedStyleFallbacks.get(element.paragraphStyleId) ??
            BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
        },
      }),
    );
  }

  for (const element of getAllRichTextBoxes(score.value)) {
    const updatedValues: Partial<RichTextBoxElement> = {};

    for (const contentKey of [
      'content',
      'contentBottom',
      'contentLeft',
      'contentCenter',
      'contentRight',
    ] as const) {
      const rewrittenHtml = rewriteRichTextHtmlForDeletedStyles(
        element[contentKey],
        deletedStyleFallbacks,
      );

      if (rewrittenHtml !== element[contentKey]) {
        updatedValues[contentKey] = rewrittenHtml;
      }
    }

    if (Object.keys(updatedValues).length === 0) {
      continue;
    }

    commands.push(
      richTextBoxCommandFactory.create('update-properties', {
        target: element,
        newValues: updatedValues,
      }),
    );
  }

  for (const note of getAllNoteElements(score.value)) {
    if (!nextStyleIds.has(note.lyricsParagraphStyleId)) {
      commands.push(
        noteElementCommandFactory.create('update-properties', {
          target: note,
          newValues: {
            lyricsParagraphStyleId:
              deletedStyleFallbacks.get(note.lyricsParagraphStyleId) ??
              BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
          },
        }),
      );
    }

    const updatedAnnotations: Array<{
      annotation: AnnotationElement;
      text: string;
    }> = [];

    for (const annotation of note.annotations) {
      const rewrittenText = rewriteRichTextHtmlForDeletedStyles(
        annotation.text,
        deletedStyleFallbacks,
      );

      if (rewrittenText !== annotation.text) {
        updatedAnnotations.push({
          annotation,
          text: rewrittenText,
        });
      }
    }

    for (const { annotation, text } of updatedAnnotations) {
      commands.push(
        annotationCommandFactory.create('update-properties', {
          target: annotation,
          newValues: {
            text,
          },
        }),
      );
    }
  }

  for (const dropCap of getAllDropCapElements(score.value)) {
    if (nextStyleIds.has(dropCap.paragraphStyleId)) {
      continue;
    }

    commands.push(
      dropCapCommandFactory.create('update-properties', {
        target: dropCap,
        newValues: {
          paragraphStyleId:
            deletedStyleFallbacks.get(dropCap.paragraphStyleId) ??
            BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText,
        },
      }),
    );
  }

  commandService.value.executeAsBatch(commands);

  if (
    !shallowEquals(
      previousResizableTextDefaults,
      getResizableTextDefaultSnapshot(score.value),
    )
  ) {
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

type HeaderFooterKind = 'header' | 'footer';
type HeaderFooterVariant =
  | 'default'
  | 'firstPage'
  | 'odd'
  | 'even'
  | 'chapterOpening';
type HeaderFooterSlot = {
  kind: HeaderFooterKind;
  variant: HeaderFooterVariant;
};
type HeaderFooterTemplateElement = TextBoxElement | RichTextBoxElement;
type HeaderFooterTemplateGroup<T> = Record<HeaderFooterVariant, T>;
type HeaderFooterTemplates<T> = Record<
  HeaderFooterKind,
  HeaderFooterTemplateGroup<T>
>;

const headerFooterVariants: HeaderFooterVariant[] = [
  'default',
  'firstPage',
  'odd',
  'even',
  'chapterOpening',
];

const headerFooterSlots: HeaderFooterSlot[] = [
  { kind: 'header', variant: 'default' },
  { kind: 'header', variant: 'firstPage' },
  { kind: 'header', variant: 'odd' },
  { kind: 'header', variant: 'even' },
  { kind: 'header', variant: 'chapterOpening' },
  { kind: 'footer', variant: 'default' },
  { kind: 'footer', variant: 'firstPage' },
  { kind: 'footer', variant: 'odd' },
  { kind: 'footer', variant: 'even' },
  { kind: 'footer', variant: 'chapterOpening' },
];

const nonChapterOddEvenAffectedSlots: HeaderFooterSlot[] = [
  { kind: 'header', variant: 'default' },
  { kind: 'header', variant: 'odd' },
  { kind: 'header', variant: 'even' },
  { kind: 'footer', variant: 'default' },
  { kind: 'footer', variant: 'odd' },
  { kind: 'footer', variant: 'even' },
];

function getDefaultHeaderFooterPanels(
  pageSetup: PageSetup,
  kind: HeaderFooterKind,
  variant: HeaderFooterVariant,
) {
  if (!pageSetup.facingPages) {
    return kind === 'header'
      ? { left: '', center: '', right: '' }
      : { left: '', center: '$p', right: '' };
  }

  if (variant === 'chapterOpening') {
    return kind === 'header'
      ? { left: '', center: '', right: '' }
      : { left: '', center: '$p', right: '' };
  }

  if (kind === 'footer') {
    return { left: '', center: '', right: '' };
  }

  let isRightHandTemplatePage: boolean;

  if (variant === 'default' || variant === 'firstPage') {
    isRightHandTemplatePage = isRightHandPage(pageSetup, 1);
  } else if (!pageSetup.facingPages) {
    isRightHandTemplatePage = variant === 'odd';
  } else if (pageSetup.direction === 'rtl') {
    isRightHandTemplatePage = variant === 'even';
  } else {
    isRightHandTemplatePage = variant === 'odd';
  }

  return {
    left: isRightHandTemplatePage ? '' : '$p',
    center: isRightHandTemplatePage ? '$:section' : '$:chapter',
    right: isRightHandTemplatePage ? '$p' : '',
  };
}

function createRichHeaderFooterWithStyle(
  left: string,
  center: string,
  right: string,
  paragraphStyleId: string,
) {
  const textbox = new RichTextBoxElement();
  textbox.multipanel = true;
  textbox.contentLeft = `<p class="neanes-style-${paragraphStyleId}">${left}</p>`;
  textbox.contentCenter = `<p class="neanes-style-${paragraphStyleId}" style="text-align:center;">${center}</p>`;
  textbox.contentRight = `<p class="neanes-style-${paragraphStyleId}" style="text-align:right;">${right}</p>`;
  return textbox;
}

function createDefaultRegularHeaderFooter(
  pageSetup: PageSetup,
  kind: HeaderFooterKind,
  variant: HeaderFooterVariant,
) {
  const panel = getDefaultHeaderFooterPanels(pageSetup, kind, variant);
  const textbox = createRegularHeaderFooter(
    panel.left,
    panel.center,
    panel.right,
  );
  textbox.paragraphStyleId =
    kind === 'header'
      ? BUILT_IN_PARAGRAPH_STYLE_IDS.Header
      : BUILT_IN_PARAGRAPH_STYLE_IDS.Footer;
  return textbox;
}

function createDefaultRichHeaderFooter(
  pageSetup: PageSetup,
  kind: HeaderFooterKind,
  variant: HeaderFooterVariant,
) {
  const panel = getDefaultHeaderFooterPanels(pageSetup, kind, variant);
  const paragraphStyleId =
    kind === 'header'
      ? BUILT_IN_PARAGRAPH_STYLE_IDS.Header
      : BUILT_IN_PARAGRAPH_STYLE_IDS.Footer;
  const textbox = createRichHeaderFooterWithStyle(
    panel.left,
    panel.center,
    panel.right,
    paragraphStyleId,
  );

  if (pageSetup.melkiteRtl || pageSetup.numerals === 'easternArabic') {
    setRichTextLanguage(textbox, 'ar', 'rtl');
  }

  return textbox;
}

function createDefaultHeaderFooterElement(
  pageSetup: PageSetup,
  richHeaderFooter: boolean,
  kind: HeaderFooterKind,
  variant: HeaderFooterVariant,
) {
  return richHeaderFooter
    ? createDefaultRichHeaderFooter(pageSetup, kind, variant)
    : createDefaultRegularHeaderFooter(pageSetup, kind, variant);
}

function createGeneratedHeaderFooterTemplates(
  pageSetup: PageSetup,
  richHeaderFooter: boolean,
): HeaderFooterTemplates<HeaderFooterTemplateElement> {
  return {
    header: Object.fromEntries(
      headerFooterVariants.map((variant) => [
        variant,
        createDefaultHeaderFooterElement(
          pageSetup,
          richHeaderFooter,
          'header',
          variant,
        ),
      ]),
    ) as HeaderFooterTemplateGroup<HeaderFooterTemplateElement>,
    footer: Object.fromEntries(
      headerFooterVariants.map((variant) => [
        variant,
        createDefaultHeaderFooterElement(
          pageSetup,
          richHeaderFooter,
          'footer',
          variant,
        ),
      ]),
    ) as HeaderFooterTemplateGroup<HeaderFooterTemplateElement>,
  };
}

function getHeaderFooterSlotCollection(score: Score, slot: HeaderFooterSlot) {
  return slot.kind === 'header'
    ? score.headers[slot.variant].elements
    : score.footers[slot.variant].elements;
}

function getHeaderFooterSlotElement(score: Score, slot: HeaderFooterSlot) {
  return getHeaderFooterSlotCollection(score, slot)[0] as
    | HeaderFooterTemplateElement
    | undefined;
}

function getHeaderFooterTemplateSlotElement(
  templates: HeaderFooterTemplates<HeaderFooterTemplateElement>,
  slot: HeaderFooterSlot,
) {
  return templates[slot.kind][slot.variant];
}

function createHeaderFooterReplacementCommand(
  score: Score,
  slot: HeaderFooterSlot,
  element: HeaderFooterTemplateElement,
) {
  return scoreElementCommandFactory.create('replace-element-in-collection', {
    collection: getHeaderFooterSlotCollection(score, slot),
    element,
    replaceAtIndex: 0,
  });
}

function pushHeaderFooterReplacementCommands(
  updateCommands: Command[],
  score: Score,
  templates: HeaderFooterTemplates<HeaderFooterTemplateElement>,
) {
  for (const slot of headerFooterSlots) {
    updateCommands.push(
      createHeaderFooterReplacementCommand(
        score,
        slot,
        getHeaderFooterTemplateSlotElement(templates, slot),
      ),
    );
  }
}

function areGeneratedHeaderFooterElementsEqual(
  left: HeaderFooterTemplateElement,
  right: HeaderFooterTemplateElement,
) {
  if (left.elementType !== right.elementType) {
    return false;
  }

  return (
    left.multipanel === right.multipanel &&
    left.contentLeft === right.contentLeft &&
    left.contentCenter === right.contentCenter &&
    left.contentRight === right.contentRight
  );
}

function generatedHeaderFooterDefaultsChanged(
  previous: PageSetup,
  current: PageSetup,
) {
  return !shallowEquals(
    {
      facingPages: previous.facingPages,
      direction: previous.direction,
      headerDifferentOddEven: previous.headerDifferentOddEven,
      headerFooterDifferentChapterOpening:
        previous.headerFooterDifferentChapterOpening,
      richHeaderFooter: previous.richHeaderFooter,
    },
    {
      facingPages: current.facingPages,
      direction: current.direction,
      headerDifferentOddEven: current.headerDifferentOddEven,
      headerFooterDifferentChapterOpening:
        current.headerFooterDifferentChapterOpening,
      richHeaderFooter: current.richHeaderFooter,
    },
  );
}

function shouldAutoEnableDifferentOddEvenForFacingPages(
  score: Score,
  previous: PageSetup,
  current: PageSetup,
) {
  if (
    previous.facingPages ||
    !current.facingPages ||
    current.headerDifferentOddEven
  ) {
    return false;
  }

  const oldGeneratedTemplates = createGeneratedHeaderFooterTemplates(
    previous,
    previous.richHeaderFooter,
  );

  return nonChapterOddEvenAffectedSlots.every((slot) => {
    const currentElement = getHeaderFooterSlotElement(score, slot);

    return (
      currentElement != null &&
      areGeneratedHeaderFooterElementsEqual(
        currentElement,
        getHeaderFooterTemplateSlotElement(oldGeneratedTemplates, slot),
      )
    );
  });
}

function normalizePageSetupForGeneratedHeaderFooterDefaults(
  pageSetup: PageSetup,
  autoEnableDifferentOddEven: boolean,
) {
  return autoEnableDifferentOddEven
    ? Object.assign(new PageSetup(), pageSetup, {
        headerDifferentOddEven: true,
      })
    : pageSetup;
}

function initializeDefaultHeaderFooters(score: Score) {
  const templates = createGeneratedHeaderFooterTemplates(
    score.pageSetup,
    score.pageSetup.richHeaderFooter,
  );

  for (const slot of headerFooterSlots) {
    getHeaderFooterSlotCollection(score, slot)[0] =
      getHeaderFooterTemplateSlotElement(templates, slot);
  }
}

function updateEntryMode(mode: EntryMode) {
  entryMode.value = mode;
}

function updateZoom(newZoom: number) {
  if (newZoom < MIN_ZOOM || newZoom > MAX_ZOOM) {
    toast.error(
      t(($) => $.toast.editor.rangeOverflow, { ns: 'toast' }),
      {
        description: t(($) => $.toolbar.main.invalidZoom, {
          ns: 'toolbar',
          minZoom: formatZoomPercent(MIN_ZOOM),
          maxZoom: formatZoomPercent(MAX_ZOOM),
        }),
      },
    );
  } else {
    zoom.value = newZoom;
    zoomFitMode.value = null;
  }
}

function zoomToNearestStep(direction: 1 | -1) {
  const zoomStepEpsilon = 0.000001;
  const zoomStep =
    direction > 0
      ? ZOOM_LEVELS.find((option) => option > zoom.value + zoomStepEpsilon)
      : [...ZOOM_LEVELS]
          .reverse()
          .find((option) => option < zoom.value - zoomStepEpsilon);

  if (zoomStep != null) {
    updateZoom(zoomStep);
    return true;
  }

  return false;
}

function updateZoomFitMode(mode: ZoomFitMode) {
  if (zoomFitMode.value === mode) {
    performZoomToFit();
    return;
  }

  zoomFitMode.value = mode;
}

function performZoomToFit() {
  const mode = zoomFitMode.value;

  if (mode == null) {
    return;
  }

  const pageBackgroundElement = pageBackgroundRef.value;

  if (pageBackgroundElement == null) {
    return;
  }

  const computedStyle = getComputedStyle(pageBackgroundElement);

  const availableWidth =
    pageBackgroundElement.clientWidth -
    parseFloat(computedStyle.paddingLeft) -
    parseFloat(computedStyle.paddingRight);
  const availableHeight =
    pageBackgroundElement.clientHeight -
    parseFloat(computedStyle.paddingTop) -
    parseFloat(computedStyle.paddingBottom);

  const pageSetup = score.value.pageSetup;
  const zoomForPageWidth = availableWidth / pageSetup.pageWidth;
  const fitZoom =
    mode === 'text-width'
      ? availableWidth / pageSetup.innerPageWidth
      : mode === 'whole-page'
        ? Math.min(zoomForPageWidth, availableHeight / pageSetup.pageHeight)
        : zoomForPageWidth;

  if (!Number.isFinite(fitZoom) || fitZoom <= 0) {
    return;
  }

  const newZoom = clamp(fitZoom, MIN_ZOOM, MAX_ZOOM);
  zoom.value = newZoom;
  alignZoomFitScroll(mode, newZoom);
}

function getCurrentPhysicalPageNumber() {
  if (filteredPages.value.length === 0) {
    return 1;
  }

  const pageIndex =
    clamp(currentPageNumber.value, 1, filteredPages.value.length) - 1;

  return filteredPages.value[pageIndex].physicalPageNumber;
}

function alignZoomFitScroll(mode: ZoomFitMode, zoomValue: number) {
  nextTick(() => {
    const pageBackgroundElement = pageBackgroundRef.value;

    if (pageBackgroundElement == null) {
      return;
    }

    pageBackgroundElement.scrollLeft =
      mode === 'text-width'
        ? resolvePageMargins(
            score.value.pageSetup,
            getCurrentPhysicalPageNumber(),
          ).contentLeft * zoomValue
        : 0;
  });
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
    showErrorToast(
      t(($) => $.toast.editor.playbackFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.playbackStartFailed, {
          ns: 'toast',
        }),
      },
    );
  }
}

function stopAudio() {
  try {
    audioService.stop();

    playbackEvents.value = [];

    stopPlaybackClock();
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.editor.stopPlaybackFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.stopPlaybackFailedDescription, {
          ns: 'toast',
        }),
      },
    );
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
    showErrorToast(
      t(($) => $.toast.editor.playbackFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.playbackToggleFailed, {
          ns: 'toast',
        }),
      },
    );
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
    showErrorToast(
      t(($) => $.toast.editor.testToneFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.testToneFailedDescription, {
          ns: 'toast',
        }),
      },
    );
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

      showErrorToast(
        t(($) => $.toast.editor.ocrImportFailed, { ns: 'toast' }),
        error,
        {
          fallback: t(($) => $.toast.editor.unexpectedError, { ns: 'toast' }),
        },
      );
    }
  }
}

function onFileMenuPageSetup() {
  pageSetupDialogIsOpen.value = true;
}

function onFileMenuParagraphStyles() {
  openParagraphStylesDialog();
}

function onFileMenuDocumentProperties() {
  documentPropertiesDialogIsOpen.value = true;
}

async function onFileMenuPrint() {
  prepareWorkspaceForSerialization(selectedWorkspace.value);

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
  prepareWorkspaceForSerialization(selectedWorkspace.value);

  printMode.value = true;

  // Blur the active element so that focus outlines and
  // blinking cursors don't show up in the printed page
  const activeElement = blurActiveElement();

  const previousTitle = window.document.title;
  window.document.title = getFileName(selectedWorkspace.value, false);

  try {
    await nextTick();
    const reply = await ipcService.exportWorkspaceAsPdf(
      selectedWorkspace.value,
    );

    showExportReplyToast(
      reply,
      t(($) => $.toast.export.pdfSuccess, { ns: 'toast' }),
      t(($) => $.toast.export.pdfFailed, { ns: 'toast' }),
      t(($) => $.toast.export.pdfFailedDescription, { ns: 'toast' }),
    );
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.export.pdfFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.export.pdfFailedDescription, {
          ns: 'toast',
        }),
      },
    );
  } finally {
    printMode.value = false;
    window.document.title = previousTitle;

    // Re-focus the active element
    focusElement(activeElement);
  }
}

async function onFileMenuExportAsImage() {
  exportFormat.value = ExportFormat.PNG;
  exportDialogIsOpen.value = true;
}

async function exportAsPng(args: ExportAsPngSettings) {
  let reply: ExportWorkspaceAsImageReplyArgs;

  prepareWorkspaceForSerialization(selectedWorkspace.value);

  try {
    reply = await ipcService.exportWorkspaceAsImage(
      selectedWorkspace.value,
      'png',
    );

    if (!reply.success) {
      if (!reply.canceled) {
        showReplyErrorToast(
          t(($) => $.toast.export.pngFailed, { ns: 'toast' }),
          reply,
          t(($) => $.toast.export.pngStartFailedDescription, {
            ns: 'toast',
          }),
        );
      }
      return;
    }
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.export.pngFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.export.pngStartFailedDescription, {
          ns: 'toast',
        }),
      },
    );
    return;
  }

  printMode.value = true;
  exportInProgress.value = true;
  const toastId = toast.loading(
    t(($) => $.toast.export.pngLoading, { ns: 'toast' }),
    {
      description: t(($) => $.toast.export.pngLoadingDescription, {
        ns: 'toast',
      }),
    },
  );

  // Blur the active element so that focus outlines and
  // blinking cursors don't show up in the printed page
  const activeElement = blurActiveElement();

  try {
    await nextTick();

    const pageElements = pagesRef.value as HTMLElement[];
    let exportedPageCount = 0;
    let firstExportedPagePath = '';

    if (pageElements.length > 0) {
      const fontEmbedCSS = await getFontEmbedCSS(pageElements[0]);

      for (const [index, page] of pageElements.entries()) {
        const options = {
          fontEmbedCSS,
          pixelRatio: args.dpi / 96,
          style: { margin: '0' },
        } as any;

        if (args.transparentBackground) {
          options.style.backgroundColor = 'transparent';
        }

        const fileName = reply.filePath.replace(/\.png$/i, `-${index + 1}.png`);

        const data = (await toPng(page, options)).replace(
          /^data:image\/png;base64,/,
          '',
        );

        const pageReply = await ipcService.exportPageAsImage(fileName, data);

        if (!pageReply.success) {
          if (pageReply.skipped) {
            continue;
          }

          if (pageReply.canceled) {
            break;
          }

          throw new Error(
            pageReply.errorMessage ??
              t(($) => $.toast.export.pngFileFailedDescription, {
                ns: 'toast',
              }),
          );
        }

        if (!firstExportedPagePath) {
          firstExportedPagePath = fileName;
        }

        exportedPageCount++;
      }
    }

    if (exportedPageCount === 0) {
      toast.info(
        t(($) => $.toast.export.pngCanceled, { ns: 'toast' }),
        {
          id: toastId,
          description: t(($) => $.toast.export.pngCanceledDescription, {
            ns: 'toast',
          }),
        },
      );
      return;
    }

    if (args.openFolder && ipcService.isShowItemInFolderSupported()) {
      await ipcService.showItemInFolder(firstExportedPagePath);
    }

    toast.success(
      t(($) => $.toast.export.pngComplete, { ns: 'toast' }),
      {
        id: toastId,
        description: t(($) => $.toast.export.pngCompleteDescription, {
          ns: 'toast',
          count: exportedPageCount,
          path: firstExportedPagePath,
        }),
      },
    );
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.export.pngFailed, { ns: 'toast' }),
      error,
      {
        id: toastId,
        fallback: t(($) => $.toast.export.pngFilesFailedDescription, {
          ns: 'toast',
        }),
      },
    );
  } finally {
    printMode.value = false;
    exportInProgress.value = false;
    closeExportDialog();
    // Re-focus the active element
    focusElement(activeElement);
  }
}

async function onFileMenuExportAsHtml() {
  try {
    prepareWorkspaceForSerialization(selectedWorkspace.value);

    const reply = await ipcService.exportWorkspaceAsHtml(
      selectedWorkspace.value,
      byzHtmlExporter.exportScore(score.value),
    );

    showExportReplyToast(
      reply,
      t(($) => $.toast.export.htmlSuccess, { ns: 'toast' }),
      t(($) => $.toast.export.htmlFailed, { ns: 'toast' }),
      t(($) => $.toast.export.htmlFailedDescription, { ns: 'toast' }),
    );
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.export.htmlFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.export.htmlFailedDescription, {
          ns: 'toast',
        }),
      },
    );
  }
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
  try {
    prepareWorkspaceForSerialization(selectedWorkspace.value);

    const reply = await ipcService.exportWorkspaceAsMusicXml(
      selectedWorkspace.value,
      musicXmlExporter.export(score.value, args.options),
      args.compressed,
      args.openFolder && ipcService.isShowItemInFolderSupported(),
    );

    showExportReplyToast(
      reply,
      t(($) => $.toast.export.musicXmlSuccess, { ns: 'toast' }),
      t(($) => $.toast.export.musicXmlFailed, { ns: 'toast' }),
      t(($) => $.toast.export.musicXmlFailedDescription, {
        ns: 'toast',
      }),
    );

    if (reply.success || reply.canceled) {
      closeExportDialog();
    }
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.export.musicXmlFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.export.musicXmlFailedDescription, {
          ns: 'toast',
        }),
      },
    );
  }
}

async function exportAsLatex(args: ExportAsLatexSettings) {
  try {
    prepareWorkspaceForSerialization(selectedWorkspace.value);

    const reply = await ipcService.exportWorkspaceAsLatex(
      selectedWorkspace.value,
      JSON.stringify(
        latexExporter.export(
          pages.value,
          score.value.pageSetup,
          score.value.paragraphStyles,
          args.options,
        ),
        null,
        2,
      ),
    );

    showExportReplyToast(
      reply,
      t(($) => $.toast.export.latexSuccess, { ns: 'toast' }),
      t(($) => $.toast.export.latexFailed, { ns: 'toast' }),
      t(($) => $.toast.export.latexFailedDescription, { ns: 'toast' }),
    );

    if (reply.success || reply.canceled) {
      closeExportDialog();
    }
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.export.latexFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.export.latexFailedDescription, {
          ns: 'toast',
        }),
      },
    );
  }
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
    el.text = `<p class="neanes-style-${BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation}"></p>`;
    const fontHeight = TextMeasurementService.getFontHeight(
      getDefaultLyricsFont(),
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
      getDefaultLyricsFont(),
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
  element.paragraphStyleId = element.inline
    ? BUILT_IN_PARAGRAPH_STYLE_IDS.Lyrics
    : BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText;

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
  element.content = `<p class="neanes-style-${BUILT_IN_PARAGRAPH_STYLE_IDS.DefaultText}"></p>`;
  if (
    score.value.pageSetup.melkiteRtl ||
    score.value.pageSetup.numerals === 'easternArabic'
  ) {
    setRichTextLanguage(element, 'ar', 'rtl');
  }

  addScoreElement(element, selectedElementIndex.value);

  selectedElement.value = element;

  save();
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

async function onFileMenuEditCopyElementLink() {
  if (selectedElement.value?.id != null) {
    try {
      await navigator.clipboard.writeText(
        '#element-' + selectedElement.value.id.toString(),
      );
      toast.success(
        t(($) => $.toast.editor.copyElementLinkSuccess, { ns: 'toast' }),
      );
    } catch (error) {
      console.error(error);
      showErrorToast(
        t(($) => $.toast.editor.copyFailed, { ns: 'toast' }),
        error,
        {
          fallback: t(($) => $.toast.editor.clipboardWriteFailed, {
            ns: 'toast',
          }),
        },
      );
    }
  }
}

async function copyInspectorSelectionElementLink() {
  const element = getInspectorSelectionElement();

  if (element?.id == null) {
    return;
  }

  try {
    await navigator.clipboard.writeText('#element-' + element.id.toString());
    toast.success(
      t(($) => $.toast.editor.copyElementLinkSuccess, { ns: 'toast' }),
    );
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.editor.copyFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.clipboardWriteFailed, {
          ns: 'toast',
        }),
      },
    );
  }
}

async function onFileMenuSave() {
  const workspace = selectedWorkspace.value;

  try {
    if (workspace.filePath != null) {
      const result = await saveWorkspace(workspace);
      if (result.success) {
        workspace.hasUnsavedChanges = false;
        toast.success(
          t(($) => $.toast.editor.saveSuccess, { ns: 'toast' }),
          {
            description: workspace.filePath,
          },
        );
      } else if (!result.canceled) {
        showReplyErrorToast(
          t(($) => $.toast.editor.saveFailed, { ns: 'toast' }),
          result,
          t(($) => $.toast.editor.saveFailedDescription, { ns: 'toast' }),
        );
      }
    } else {
      const result = await saveWorkspaceAs(workspace);
      if (result.success) {
        workspace.filePath = result.filePath;
        workspace.hasUnsavedChanges = false;
        toast.success(
          t(($) => $.toast.editor.saveSuccess, { ns: 'toast' }),
          {
            description: result.filePath,
          },
        );
      } else if (!result.canceled) {
        showReplyErrorToast(
          t(($) => $.toast.editor.saveFailed, { ns: 'toast' }),
          result,
          t(($) => $.toast.editor.saveFailedDescription, { ns: 'toast' }),
        );
      }
    }
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.editor.saveFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.saveFailedDescription, {
          ns: 'toast',
        }),
      },
    );
  }
}

async function onFileMenuSaveAs() {
  const workspace = selectedWorkspace.value;

  try {
    const result = await saveWorkspaceAs(workspace);
    if (result.success) {
      workspace.filePath = result.filePath;
      workspace.hasUnsavedChanges = false;
      toast.success(
        t(($) => $.toast.editor.saveSuccess, { ns: 'toast' }),
        {
          description: result.filePath,
        },
      );
    } else if (!result.canceled) {
      showReplyErrorToast(
        t(($) => $.toast.editor.saveFailed, { ns: 'toast' }),
        result,
        t(($) => $.toast.editor.saveFailedDescription, { ns: 'toast' }),
      );
    }
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.editor.saveFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.saveFailedDescription, {
          ns: 'toast',
        }),
      },
    );
  }
}

function onFileMenuUndo() {
  const currentIndex = selectedElementIndex.value;
  const pageSetupPrevious = getResizableTextDefaultSnapshot(score.value);

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

    // Undo can affect the note display in the neume toolbar, so force a refresh here.
    selectedElement.value.keyHelper++;
  }

  if (
    !shallowEquals(
      pageSetupPrevious,
      getResizableTextDefaultSnapshot(score.value),
    )
  ) {
    recalculateRichTextBoxHeights();
    recalculateTextBoxHeights();
  }

  save();
}

function onFileMenuRedo() {
  const currentIndex = selectedElementIndex.value;
  const pageSetupPrevious = getResizableTextDefaultSnapshot(score.value);

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

    // Redo can affect the note display in the neume toolbar, so force a refresh here.
    selectedElement.value.keyHelper++;
  }

  if (
    !shallowEquals(
      pageSetupPrevious,
      getResizableTextDefaultSnapshot(score.value),
    )
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

async function onFileMenuCopyAsHtml() {
  prepareWorkspaceForSerialization(selectedWorkspace.value);

  let copiedElements: ScoreElement[] = [];

  const selectedScoreElements = getSelectedNonEmptyElements();

  if (selectedScoreElements.length > 0) {
    copiedElements = selectedScoreElements;
  } else if (selectedLyrics.value != null) {
    copiedElements = [selectedLyrics.value];
  }

  const html = byzHtmlExporter.exportElements(
    copiedElements,
    score.value.pageSetup,
    score.value.paragraphStyles,
    0,
    true,
  );

  try {
    await navigator.clipboard.writeText(html);
    toast.success(t(($) => $.toast.editor.copyHtmlSuccess, { ns: 'toast' }));
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.editor.copyFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.clipboardWriteFailed, {
          ns: 'toast',
        }),
      },
    );
  }
}

async function pasteTextFromClipboard() {
  try {
    const reply = await ipcService.paste();

    if (!reply.success) {
      showReplyErrorToast(
        t(($) => $.toast.editor.pasteFailed, { ns: 'toast' }),
        reply,
        t(($) => $.toast.editor.clipboardReadFailed, { ns: 'toast' }),
      );
    }
  } catch (error) {
    console.error(error);
    showErrorToast(
      t(($) => $.toast.editor.pasteFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.clipboardReadFailed, {
          ns: 'toast',
        }),
      },
    );
  }
}

async function onFileMenuPaste() {
  if (!isTextInputFocused() && !dialogOpen.value) {
    onPasteScoreElements(false);
  } else {
    await pasteTextFromClipboard();
  }
}

async function onFileMenuPasteWithLyrics() {
  if (!isTextInputFocused() && !dialogOpen.value) {
    onPasteScoreElements(true);
  } else {
    await pasteTextFromClipboard();
  }
}

function onFileMenuSelectAll() {
  if (!isTextInputFocused() && !dialogOpen.value) {
    onSelectAllScoreElements();
  } else {
    document.execCommand('selectAll');
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

function onFileMenuWindowPreviousTab() {
  selectWorkspaceTab('previous');
}

function onFileMenuWindowNextTab() {
  selectWorkspaceTab('next');
}

function onFileMenuViewPaneVisibility({
  paneId,
  visible,
}: FileMenuViewPaneVisibilityArgs) {
  if (!dialogOpen.value) {
    const isVisible = visible ?? !paneVisibility.value[paneId];
    onPaneVisibilityChange(paneId, isVisible);
  }
}

function onFileMenuViewStatusBarVisibility({
  visible,
}: FileMenuViewStatusBarVisibilityArgs) {
  if (!dialogOpen.value) {
    statusBarIsVisible.value = visible ?? !statusBarIsVisible.value;
  }
}

function onFileMenuViewResetPaneLayout() {
  if (!dialogOpen.value) {
    resetLayout();
  }
}

function onFileMenuViewZoom(args: FileMenuViewZoomArgs) {
  if (dialogOpen.value) {
    return;
  }

  switch (args.type) {
    case 'zoom-in':
      zoomToNearestStep(1);
      break;
    case 'zoom-out':
      zoomToNearestStep(-1);
      break;
    case 'actual-size':
      updateZoom(1);
      break;
    case 'fit':
      updateZoomFitMode(args.mode);
      break;
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
      score.pageSetup = normalizePageSetupForGeneratedHeaderFooterDefaults(
        score.pageSetup,
        score.pageSetup.facingPages && !score.pageSetup.headerDifferentOddEven,
      );
    }
  } catch (error) {
    console.error(error);
  }

  initializeDefaultHeaderFooters(score);

  const title = new TextBoxElement();
  title.paragraphStyleId = BUILT_IN_PARAGRAPH_STYLE_IDS.Title;
  title.content = 'Title';
  title.height = Math.round(
    TextMeasurementService.getFontHeight(title.computedFont) * 1.2,
  );
  score.staff.elements.unshift(title, createDefaultModeKey(score.pageSetup));

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

    showErrorToast(
      t(($) => $.toast.editor.openFailed, { ns: 'toast' }),
      error,
      {
        fallback: t(($) => $.toast.editor.openFailedDescription, {
          ns: 'toast',
        }),
      },
    );
  }
}

function addWorkspace(workspace: Workspace) {
  workspaces.value.push(workspace);

  const tab = {
    label: getFileName(workspace),
    key: workspace.id,
  };

  if (tabsRef.value != null) {
    tabsRef.value.addTab(tab);
  } else {
    tabs.value.push(tab);
  }
}

function removeWorkspace(workspace: Workspace) {
  cancelLyricsAssignment(workspace);

  const index = workspaces.value.indexOf(workspace);

  workspaces.value.splice(index, 1);

  if (tabsRef.value != null) {
    tabsRef.value.removeTab(workspace.id);
  } else {
    const tabIndex = tabs.value.findIndex((tab) => tab.key === workspace.id);

    if (tabIndex >= 0) {
      tabs.value.splice(tabIndex, 1);
    }
  }

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

function selectWorkspaceTab(direction: WorkspaceTabNavigationDirection) {
  if (dialogOpen.value || !canNavigateWorkspaceTabs.value) {
    return;
  }

  const currentIndex = tabs.value.findIndex(
    (tab) => tab.key === selectedWorkspace.value.id,
  );

  if (currentIndex < 0) {
    return;
  }

  const offset = direction === 'previous' ? -1 : 1;
  const nextIndex =
    (currentIndex + offset + tabs.value.length) % tabs.value.length;
  const nextTab = tabs.value[nextIndex];
  const nextWorkspace = workspaces.value.find(
    (workspace) => workspace.id === nextTab?.key,
  ) as Workspace | undefined;

  if (nextWorkspace != null) {
    selectedWorkspace.value = nextWorkspace;
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

function isEditableContextMenuTarget(event: MouseEvent) {
  // True when the right-click landed inside editable text (a lyric, text box,
  // rich text box, header, or footer), where the native context menu should be
  // used instead of the score menu.
  const target = event.target;
  const element =
    target instanceof Element
      ? target
      : target instanceof Node
        ? target.parentElement
        : null;

  return (
    element != null &&
    ((element instanceof HTMLElement && element.isContentEditable) ||
      element.closest(
        'input, textarea, [contenteditable="true"], [contenteditable="plaintext-only"]',
      ) != null)
  );
}

function onScoreElementContextMenu(element: ScoreElement) {
  scoreContextMenuTarget.value = element;

  // Select the right-clicked element unless it is already part of the current
  // selection, so the menu actions operate on it. The selectedElement setter
  // clears any active range and clears the lyrics selection.
  if (!isSelected(element)) {
    selectedElement.value = element;
  }
}

function resetScoreContextMenu(event: MouseEvent) {
  scoreContextMenuTarget.value = null;
  scoreMenuPointerDownInside.value = false;

  // Right-clicks inside editable text keep the native context menu: stop the
  // event in the capture phase so reka's trigger on .page-background never opens
  // the score menu, and do NOT preventDefault so the browser's own menu shows.
  if (isEditableContextMenuTarget(event)) {
    event.stopImmediatePropagation();
  }
}

function onScoreContextMenu(event: MouseEvent) {
  // Suppress the score menu on empty canvas (a right-click that was not on an
  // element). Editable-text right-clicks are handled in the capture phase above
  // and never reach here.
  if (scoreContextMenuTarget.value == null) {
    event.preventDefault();
  }
}

function onScoreContextMenuOpenChange(open: boolean) {
  if (!open) {
    scoreContextMenuTarget.value = null;
    scoreMenuPointerDownInside.value = false;
  }
}

function onScoreMenuContentPointerDown() {
  scoreMenuPointerDownInside.value = true;
}

function onScoreMenuContentPointerUp(event: PointerEvent) {
  // The right-click that opens the menu finishes with a pointerup over the
  // item under the cursor. Because that gesture's pointerdown happened outside
  // the menu, reka's MenuItem treats the release as a click and fires the first
  // item (Cut). Swallow a release whose press did not start inside the menu;
  // genuine clicks press down on the item first, so they are unaffected.
  if (!scoreMenuPointerDownInside.value) {
    event.preventDefault();
  }
  scoreMenuPointerDownInside.value = false;
}

const contextMenuNote = computed(() => {
  return getContextMenuTargetForHomogeneousSelection(isSyllableElement);
});

const contextMenuMartyria = computed(() => {
  return getContextMenuTargetForHomogeneousSelection(isMartyriaElement);
});

const contextMenuModeKey = computed(() => {
  return getContextMenuTargetForHomogeneousSelection(isModeKeyElement);
});

const contextMenuImageBox = computed(() => {
  return getContextMenuTargetForHomogeneousSelection(isImageBoxElement);
});

function getContextMenuSelectedNonEmptyElements() {
  const element = scoreContextMenuTarget.value;

  if (element == null) {
    return [];
  }

  if (selectionRange.value != null && isSelected(element)) {
    return getSelectedNonEmptyElements();
  }

  return element.elementType !== ElementType.Empty ? [element] : [];
}

function getContextMenuTargetForHomogeneousSelection<T extends ScoreElement>(
  predicate: (element: ScoreElement) => element is T,
) {
  const element = scoreContextMenuTarget.value;

  if (element == null || !predicate(element)) {
    return null;
  }

  const selectedElements = getContextMenuSelectedNonEmptyElements();

  return selectedElements.length > 0 && selectedElements.every(predicate)
    ? element
    : null;
}

const contextMenuUseDefaultStyleTarget = computed(
  () => contextMenuModeKey.value,
);

const contextMenuHasElementProperties = computed(
  () =>
    contextMenuMartyria.value != null ||
    contextMenuUseDefaultStyleTarget.value != null ||
    contextMenuImageBox.value != null,
);

function setContextMenuUseDefaultStyle(
  element: ModeKeyElement,
  value: boolean,
) {
  const wasUsingDefaultStyle = element.useDefaultStyle;

  updateModeKey(element, { useDefaultStyle: value });

  if (wasUsingDefaultStyle && !value) {
    setPaneVisibility('properties', true);
  }
}

function openContextMenuPositioning(element: NoteElement) {
  // Make sure the dialog targets the right-clicked note (it reads the
  // selected element), then open it as the Properties pane button does.
  selectedElement.value = element;
  openSyllablePositioningDialog();
}

function openContextMenuChangeKey(element: ModeKeyElement) {
  // Make sure the dialog targets the right-clicked mode key (it reads the
  // selected element), then open it as the Properties pane button does.
  selectedElement.value = element;
  openModeKeyDialog();
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
    <FileMenuBar
      v-if="showFileMenuBar"
      class="no-print"
      :can-copy-element-link="canCopyElementLink"
      :can-navigate-workspace-tabs="canNavigateWorkspaceTabs"
      :pane-visibility="paneVisibility"
      :show-developer-panels="showDeveloperPanels"
      :status-bar-visible="statusBarIsVisible"
      :zoom="zoom"
      :zoom-fit-mode="zoomFitMode"
    />
    <ToolbarMain
      :entry-mode="entryMode"
      :zoom="zoom"
      :zoom-fit-mode="zoomFitMode"
      :audio-state="audioService.state"
      :audio-options="audioOptions"
      :playback-time="selectedWorkspace.playbackTime"
      :playback-bpm="selectedWorkspace.playbackBpm"
      :neume-keyboard="neumeKeyboard"
      :can-undo="canUndo"
      :can-redo="canRedo"
      @new-score="onFileMenuNewScore"
      @open-score="onClickOpenScore"
      @save-score="onFileMenuSave"
      @print-score="onClickPrintScore"
      @cut="onFileMenuCut"
      @copy="onFileMenuCopy"
      @paste="onFileMenuPaste"
      @undo="onFileMenuUndo"
      @redo="onFileMenuRedo"
      @update:zoom="updateZoom"
      @update:zoom-fit-mode="updateZoomFitMode"
      @update:audio-options-speed="updateAudioOptionsSpeed"
      @add-auto-martyria="addAutoMartyria"
      @update:entry-mode="updateEntryMode"
      @toggle-page-break="togglePageBreak"
      @toggle-line-break="toggleLineBreak($event)"
      @add-tempo="addTempo"
      @add-alternate-line="onFileMenuInsertAlternateLine"
      @add-annotation="onFileMenuInsertAnnotation"
      @add-drop-cap="addDropCap(false)"
      @add-mode-key="onFileMenuInsertModeKey"
      @add-text-box="onFileMenuInsertTextBox"
      @add-text-box-rich="onFileMenuInsertRichTextBox"
      @add-image="onClickAddImage"
      @delete-selected-element="deleteSelectedElement"
      @click="selectedLyrics = null"
      @play-audio="playAudio"
      @open-page-setup="onFileMenuPageSetup"
      @find="onFileMenuFind"
      @open-playback-settings="openPlaybackSettingsDialog"
    />
    <div class="content">
      <WorkspaceDockLayout
        :developer-pane-enabled="showDeveloperPanels"
        :pane-visibility="paneVisibility"
        :pane-layout-reset-counter="paneLayoutResetCounter"
        @pane-visibility-change="onPaneVisibilityChange"
      >
        <template #neume-selector>
          <NeumeSelector
            class="neume-selector"
            :page-setup="score.pageSetup"
            :neume-keyboard="neumeKeyboard"
            @select-quantitative-neume="addQuantitativeNeume"
          />
        </template>

        <template #common-combos>
          <NeumeComboSelector
            class="neume-combo-selector"
            :page-setup="score.pageSetup"
            @select-neume-combo="addNeumeCombination"
          />
        </template>

        <template #properties>
          <PropertiesPane
            :context="inspectorContext"
            :fonts="fonts"
            :inner-neume="toolbarInnerNeume"
            :page-setup="score.pageSetup"
            :paragraph-styles="score.paragraphStyles"
            @update:annotation="updateAnnotation"
            @update:text-box="updateTextBox"
            @update:rich-text-box="updateRichTextBox"
            @update:drop-cap="updateDropCap"
            @update:image-box="updateImageBox"
            @update:lyrics="updateNoteAndSave"
            @update:mode-key="updateModeKey"
            @update:neume="updateNoteAndSave"
            @update:martyria="updateMartyria"
            @update:tempo="updateTempo"
            @open-mode-key-dialog="openModeKeyDialog"
            @open-paragraph-styles-dialog="openParagraphStylesDialog"
            @open-syllable-positioning-dialog="openSyllablePositioningDialog"
          />
        </template>

        <template #selection>
          <SelectionPane
            :context="inspectorContext"
            :can-apply-break="canApplyInspectorBreak"
            @copy-element-link="copyInspectorSelectionElementLink"
            @toggle-page-break="toggleInspectorPageBreak"
            @toggle-line-break="toggleInspectorLineBreak"
            @delete-selected-element="deleteInspectorSelectionElement"
          />
        </template>

        <template #lyrics>
          <LyricsPane
            :locked="lyricsLocked"
            :lyrics="lyrics"
            @activate-staff-lyrics="
              selectedElement = null;
              selectedLyrics = null;
            "
            @update:locked="updateLyricsLocked"
            @update:lyrics="updateStaffLyrics"
            @assign-accepts-lyrics="assignAcceptsLyricsFromCurrentLyrics"
          />
        </template>

        <template #developer>
          <DeveloperPane
            :generated-item-groups="developerPaneGeneratedItemGroups"
            :inspector-rows="developerInspectorRows"
            :line-diagnostics="selectedLineDiagnostics"
            :open-sections="developerPaneOpenSections"
            :selected-element="developerSelectedElement"
            :show-missing-diagnostics-notice="
              developerPaneHasMissingDiagnostics
            "
            :toggles="{
              overlaysEnabled,
              printOverlays,
              showAdjustmentRatios,
              showAnonymousBoxes,
              showCollisionRegions,
              showGuides,
              showGlueWidths,
              showInkBoundingBoxes,
              showLyricBoundingBoxes,
              showElementBoxes,
              showNeumeBoundingBoxes,
            }"
            @reload-diagnostics="reloadDeveloperPaneDiagnostics"
            @update:open-sections="developerPaneOpenSections = $event"
            @update:toggle="updateDeveloperToggle"
          />
        </template>

        <template #center>
          <div class="page-container chrome-paper-canvas">
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
                      type="button"
                      @click="onFileMenuNewScore"
                    >
                      +
                    </button>
                  </template>
                </Vue3TabsChrome>
              </ContextMenuTrigger>
              <ContextMenuContent class="chrome-menu">
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
                    closeContextMenuWorkspaces(
                      CloseWorkspacesDisposition.OTHERS,
                    )
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
            <ContextMenu @update:open="onScoreContextMenuOpenChange">
              <ContextMenuTrigger
                as-child
                class="select-auto"
                @contextmenu.capture="resetScoreContextMenu"
                @contextmenu="onScoreContextMenu"
              >
                <div
                  ref="pageBackgroundRef"
                  class="page-background chrome-paper-canvas"
                  @scroll="throttled.onScroll"
                  @wheel="onPageBackgroundWheel"
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
                      <template
                        v-if="
                          showDeveloperPanels &&
                          overlaysEnabled &&
                          showGuides &&
                          (!printMode || shouldRenderDeveloperOverlaysInPrint)
                        "
                      >
                        <span
                          class="guide-line-vl"
                          :style="getGuideStyleLeft(page)"
                        />
                        <span
                          class="guide-line-vr"
                          :style="getGuideStyleRight(page)"
                        />
                        <span class="guide-line-ht" :style="guideStyleTop" />
                        <span class="guide-line-hb" :style="guideStyleBottom" />
                      </template>
                      <template
                        v-if="
                          showDeveloperPanels &&
                          overlaysEnabled &&
                          showGlueWidths &&
                          (!printMode || shouldRenderDeveloperOverlaysInPrint)
                        "
                      >
                        <div
                          v-for="(line, lineIndex) in page.lines"
                          :key="`developer-glue-line-${pageIndex}-${lineIndex}`"
                        >
                          <div
                            v-for="overlay in getDeveloperGlueOverlays(
                              page,
                              line,
                              lineIndex,
                              pageIndex,
                            )"
                            :key="`developer-glue-${overlay.key}`"
                            class="developer-glue-overlay"
                            :class="{
                              shrink: overlay.delta < 0,
                              stretch: overlay.delta > 0,
                            }"
                            :style="overlay.wrapperStyle"
                          >
                            <div
                              class="developer-glue-preferred"
                              :class="{
                                negative: overlay.preferredNegative,
                              }"
                              :style="overlay.preferredStyle"
                            ></div>
                            <div
                              class="developer-glue-actual"
                              :class="{
                                negative: overlay.actualNegative,
                              }"
                              :style="overlay.actualStyle"
                            ></div>
                          </div>
                        </div>
                      </template>
                      <template
                        v-if="
                          showDeveloperPanels &&
                          overlaysEnabled &&
                          (showAnonymousBoxes || showElementBoxes) &&
                          (!printMode || shouldRenderDeveloperOverlaysInPrint)
                        "
                      >
                        <div
                          v-for="(line, lineIndex) in page.lines"
                          :key="`developer-anonymous-line-${pageIndex}-${lineIndex}`"
                        >
                          <div
                            v-for="overlay in getDeveloperBoxOverlays(
                              page,
                              line,
                              lineIndex,
                            )"
                            :key="`developer-anonymous-${pageIndex}-${overlay.key}`"
                            class="developer-box-overlay"
                            :class="overlay.kind"
                            :style="overlay.style"
                            :title="overlay.label"
                          ></div>
                        </div>
                      </template>
                      <template v-if="score.pageSetup.showHeader">
                        <Badge
                          v-if="
                            !printMode &&
                            getHeaderForPageIndex(pageIndex) ==
                              selectedHeaderFooterElement
                          "
                          variant="outline"
                          :style="
                            getHeaderFooterBadgeStyle(pageIndex, page, 'header')
                          "
                          class="pointer-events-none absolute z-20 h-auto bg-background/95 px-2 py-0.5 text-[11px]"
                        >
                          {{ getHeaderFooterBadgeLabel(pageIndex, 'header') }}
                        </Badge>
                        <template
                          v-if="
                            isRichTextBoxElement(
                              getHeaderForPageIndex(pageIndex),
                            )
                          "
                        >
                          <TextBoxRich
                            :key="`element-${selectedWorkspace.id}-${getHeaderForPageIndex(pageIndex).id}-${
                              getHeaderForPageIndex(pageIndex).keyHelper
                            }`"
                            :ref="setTemplateRef(`header-${pageIndex}`)"
                            class="element-box"
                            :element="
                              getHeaderForPageIndex(
                                pageIndex,
                              ) as RichTextBoxElement
                            "
                            :edit-mode="
                              !printMode &&
                              getHeaderForPageIndex(pageIndex) ==
                                selectedHeaderFooterElement
                            "
                            :metadata="getTokenMetadata(pageIndex)"
                            token-scope="header"
                            :page-setup="score.pageSetup"
                            :fonts="fonts"
                            :paragraph-styles="score.paragraphStyles"
                            :editor-language="ckeditorLanguage"
                            :selected="
                              getHeaderForPageIndex(pageIndex) ==
                              selectedHeaderFooterElement
                            "
                            :style="getHeaderStyle(page)"
                            @click="selectHeaderRichTextBox(pageIndex)"
                            @select-neume="
                              selectHeaderRichTextBox(pageIndex);
                              showPropertiesPaneForRichTextNeume();
                            "
                            @update="
                              updateRichTextBox(
                                getHeaderForPageIndex(
                                  pageIndex,
                                ) as RichTextBoxElement,
                                $event,
                              )
                            "
                            @update:height="
                              updateRichTextBoxHeight(
                                getHeaderForPageIndex(
                                  pageIndex,
                                ) as RichTextBoxElement,
                                $event,
                              )
                            "
                          />
                        </template>
                        <template
                          v-else-if="
                            isTextBoxElement(getHeaderForPageIndex(pageIndex))
                          "
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
                            token-scope="header"
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
                            :style="getHeaderStyle(page)"
                            @click="
                              selectedHeaderFooterElement =
                                getHeaderForPageIndex(pageIndex)
                            "
                            @update="
                              updateTextBox(
                                getHeaderForPageIndex(
                                  pageIndex,
                                )! as TextBoxElement,
                                $event,
                              )
                            "
                          />
                        </template>
                        <div
                          v-if="shouldShowHeaderRuleForPageIndex(pageIndex)"
                          class="header-footer-hr"
                          :style="
                            getHeaderHorizontalRuleStyle(
                              page,
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
                          @contextmenu="onScoreElementContextMenu(element)"
                        >
                          <template v-if="isSyllableElement(element)">
                            <div
                              :ref="
                                setTemplateRef(
                                  `element-${getElementIndex(element)}`,
                                )
                              "
                              class="neume-box"
                            >
                              <span v-if="element.pageBreak" class="page-break"
                                ><PhFile
                              /></span>
                              <span v-if="element.lineBreak" class="line-break"
                                ><svg
                                  v-if="
                                    element.lineBreakType ===
                                    LineBreakType.Justify
                                  "
                                  viewBox="0 0 24 24"
                                >
                                  <PhParagraph
                                    size="24"
                                    weight="fill"
                                    transform="matrix(0.75 0 0 1 -2 0)"
                                  />
                                  <PhTextAlignJustify
                                    size="12"
                                    x="12"
                                    y="12"
                                  /></svg
                                ><svg
                                  v-else-if="
                                    element.lineBreakType ===
                                    LineBreakType.Center
                                  "
                                  viewBox="0 0 24 24"
                                >
                                  <PhParagraph
                                    size="24"
                                    weight="fill"
                                    transform="matrix(0.75 0 0 1 -2 0)"
                                  />
                                  <PhTextAlignCenter
                                    size="12"
                                    x="12"
                                    y="12"
                                  /></svg
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
                                @update="
                                  updateAlternateLine(alternateLine, $event)
                                "
                                @mousedown="
                                  setSelectedAlternateLine(
                                    element,
                                    alternateLine,
                                  )
                                "
                              />
                              <Annotation
                                v-for="(annotation, index) in (
                                  element as NoteElement
                                ).annotations"
                                :key="index"
                                :ref="
                                  setTemplateRef(
                                    `annotation-${getElementIndex(element)}-${index}`,
                                  )
                                "
                                :element="annotation"
                                :page-setup="score.pageSetup"
                                :fonts="fonts"
                                :paragraph-styles="score.paragraphStyles"
                                :editor-language="ckeditorLanguage"
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
                                @select-neume="
                                  setSelectedAnnotation(element, annotation);
                                  showPropertiesPaneForRichTextNeume();
                                "
                                @mousedown="
                                  setSelectedAnnotation(element, annotation)
                                "
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
                              <span
                                v-if="
                                  (element as NoteElement)
                                    .showLeadingLyricHyphen
                                "
                                class="leading-lyric-hyphen"
                                contenteditable="false"
                                aria-hidden="true"
                                :style="
                                  getLeadingLyricHyphenStyle(
                                    element as NoteElement,
                                  )
                                "
                                >-</span
                              >
                              <div
                                class="lyrics-container"
                                dir="auto"
                                :style="getLyricStyle(element as NoteElement)"
                              >
                                <ContentEditable
                                  :ref="
                                    setTemplateRef(
                                      `lyrics-${getElementIndex(element)}`,
                                    )
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
                                  @focus="
                                    selectedLyrics = element as NoteElement
                                  "
                                  @blur="
                                    updateLyrics(element as NoteElement, $event)
                                  "
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
                                      full: (element as NoteElement)
                                        .isFullMelisma,
                                    }"
                                    :style="
                                      getMelismaStyle(element as NoteElement)
                                    "
                                  >
                                    <span
                                      v-for="(offset, index) in (
                                        element as NoteElement
                                      ).hyphenOffsets"
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
                                      full: (element as NoteElement)
                                        .isFullMelisma,
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
                                      fullRtl: (element as NoteElement)
                                        .isFullMelisma,
                                    }"
                                    :style="
                                      getMelismaStyle(element as NoteElement)
                                    "
                                    v-text="
                                      (element as NoteElement).melismaText
                                    "
                                  ></div>
                                </template>
                                <template
                                  v-else-if="
                                    (element as NoteElement).isMelisma &&
                                    (element as NoteElement).melismaText !==
                                      '' &&
                                    !rtl
                                  "
                                >
                                  <span
                                    class="melisma-text"
                                    :class="{
                                      selectedMelisma:
                                        element === selectedLyrics,
                                    }"
                                    @click="focusLyrics(element.index)"
                                    @focus="
                                      selectedLyrics = element as NoteElement
                                    "
                                    v-text="
                                      (element as NoteElement).melismaText
                                    "
                                  ></span>
                                </template>
                              </div>
                            </div>
                          </template>
                          <template v-else-if="isMartyriaElement(element)">
                            <div class="neume-box">
                              <span v-if="element.pageBreak" class="page-break">
                                <PhFile
                              /></span>
                              <span v-if="element.lineBreak" class="line-break"
                                ><PhParagraph weight="fill"
                              /></span>
                              <MartyriaNeumeBox
                                :ref="
                                  setTemplateRef(
                                    `element-${getElementIndex(element)}`,
                                  )
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
                                setTemplateRef(
                                  `element-${getElementIndex(element)}`,
                                )
                              "
                              class="neume-box"
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
                                setTemplateRef(
                                  `element-${getElementIndex(element)}`,
                                )
                              "
                              class="neume-box"
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
                                :style="
                                  getEmptyBoxStyle(element as EmptyElement)
                                "
                                @select-single="selectedElement = element"
                              ></EmptyNeumeBox>
                              <div class="lyrics"></div>
                            </div>
                          </template>
                          <template v-else-if="isTextBoxElement(element)">
                            <span v-if="element.pageBreak" class="page-break-2"
                              ><PhFile
                            /></span>
                            <span v-if="element.lineBreak" class="line-break-2"
                              ><PhParagraph weight="fill"
                            /></span>
                            <TextBox
                              :ref="
                                setTemplateRef(
                                  `element-${getElementIndex(element)}`,
                                )
                              "
                              :element="element as TextBoxElement"
                              :edit-mode="true"
                              :metadata="getTokenMetadata(pageIndex)"
                              :page-setup="score.pageSetup"
                              :selected="isSelected(element)"
                              @select-single="selectedElement = element"
                              @update="
                                updateTextBox(element as TextBoxElement, $event)
                              "
                              @update:height="
                                updateTextBoxHeight(
                                  element as TextBoxElement,
                                  $event,
                                )
                              "
                            />
                          </template>
                          <template v-else-if="isRichTextBoxElement(element)">
                            <span v-if="element.pageBreak" class="page-break-2"
                              ><PhFile
                            /></span>
                            <span v-if="element.lineBreak" class="line-break-2"
                              ><PhParagraph weight="fill"
                            /></span>
                            <TextBoxRich
                              :ref="
                                setTemplateRef(
                                  `element-${getElementIndex(element)}`,
                                )
                              "
                              :element="element as RichTextBoxElement"
                              :page-setup="score.pageSetup"
                              :fonts="fonts"
                              :paragraph-styles="score.paragraphStyles"
                              :editor-language="ckeditorLanguage"
                              :selected="isSelected(element)"
                              @select-single="selectedElement = element"
                              @select-neume="
                                selectedElement = element;
                                showPropertiesPaneForRichTextNeume();
                              "
                              @update="
                                updateRichTextBox(
                                  element as RichTextBoxElement,
                                  $event,
                                )
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
                            <span v-if="element.pageBreak" class="page-break-2"
                              ><PhFile
                            /></span>
                            <span v-if="element.lineBreak" class="line-break-2"
                              ><PhParagraph weight="fill"
                            /></span>
                            <ModeKey
                              :ref="
                                setTemplateRef(
                                  `element-${getElementIndex(element)}`,
                                )
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
                            <span v-if="element.pageBreak" class="page-break"
                              ><PhFile
                            /></span>
                            <span v-if="element.lineBreak" class="line-break"
                              ><PhParagraph weight="fill"
                            /></span>
                            <DropCap
                              :ref="
                                setTemplateRef(
                                  `element-${getElementIndex(element)}`,
                                )
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
                                updateDropCapContent(
                                  element as DropCapElement,
                                  $event,
                                )
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
                                setTemplateRef(
                                  `element-${getElementIndex(element)}`,
                                )
                              "
                              :element="element as ImageBoxElement"
                              :zoom="zoom"
                              :print-mode="printMode"
                              :class="[
                                { selectedImagebox: isSelected(element) },
                              ]"
                              @select-single="selectedElement = element"
                              @update:size="
                                updateImageBox(
                                  selectedElement as ImageBoxElement,
                                  {
                                    imageWidth: $event.width,
                                    imageHeight: $event.height,
                                  },
                                )
                              "
                            />
                          </template>
                          <div
                            v-for="(box, boxIndex) in getDeveloperOverlayBoxes(
                              element,
                            )"
                            v-show="
                              !printMode || shouldRenderDeveloperOverlaysInPrint
                            "
                            :key="`developer-overlay-${element.id}-${boxIndex}`"
                            class="developer-overlay-box"
                            :class="{
                              collision: box.kind === 'collision',
                              ink: box.kind === 'ink',
                              lyric: box.kind === 'lyric',
                              neume: box.kind === 'neume',
                            }"
                            :style="getDeveloperOverlayStyle(box)"
                          ></div>
                        </div>
                        <span
                          v-if="
                            showDeveloperPanels &&
                            overlaysEnabled &&
                            showAdjustmentRatios &&
                            (!printMode ||
                              shouldRenderDeveloperOverlaysInPrint) &&
                            line.adjustmentRatio != null &&
                            line.elements.length > 0
                          "
                          class="adjustment-ratio"
                          :style="getAdjustmentRatioStyle(line, page)"
                          >{{ line.adjustmentRatio.toFixed(2) }}</span
                        >
                      </div>
                      <template v-if="score.pageSetup.showFooter">
                        <Badge
                          v-if="
                            !printMode &&
                            getFooterForPageIndex(pageIndex) ==
                              selectedHeaderFooterElement
                          "
                          variant="outline"
                          :style="
                            getHeaderFooterBadgeStyle(pageIndex, page, 'footer')
                          "
                          class="pointer-events-none absolute z-20 h-auto bg-background/95 px-2 py-0.5 text-[11px]"
                        >
                          {{ getHeaderFooterBadgeLabel(pageIndex, 'footer') }}
                        </Badge>
                        <div
                          v-if="shouldShowFooterRuleForPageIndex(pageIndex)"
                          class="header-footer-hr"
                          :style="
                            getFooterHorizontalRuleStyle(
                              page,
                              getFooterForPageIndex(pageIndex).height,
                            )
                          "
                        ></div>
                        <template
                          v-if="
                            isRichTextBoxElement(
                              getFooterForPageIndex(pageIndex),
                            )
                          "
                        >
                          <TextBoxRich
                            :key="`element-${selectedWorkspace.id}-${getFooterForPageIndex(pageIndex).id}-${
                              getFooterForPageIndex(pageIndex).keyHelper
                            }`"
                            :ref="setTemplateRef(`footer-${pageIndex}`)"
                            class="element-box"
                            :element="
                              getFooterForPageIndex(
                                pageIndex,
                              ) as RichTextBoxElement
                            "
                            :edit-mode="
                              !printMode &&
                              getFooterForPageIndex(pageIndex) ==
                                selectedHeaderFooterElement
                            "
                            :metadata="getTokenMetadata(pageIndex)"
                            token-scope="footer"
                            :page-setup="score.pageSetup"
                            :fonts="fonts"
                            :paragraph-styles="score.paragraphStyles"
                            :editor-language="ckeditorLanguage"
                            :selected="
                              getFooterForPageIndex(pageIndex) ==
                              selectedHeaderFooterElement
                            "
                            :style="getFooterStyle(page)"
                            @click="selectFooterRichTextBox(pageIndex)"
                            @select-neume="
                              selectFooterRichTextBox(pageIndex);
                              showPropertiesPaneForRichTextNeume();
                            "
                            @update="
                              updateRichTextBox(
                                getFooterForPageIndex(
                                  pageIndex,
                                ) as RichTextBoxElement,
                                $event,
                              )
                            "
                            @update:height="
                              updateRichTextBoxHeight(
                                getFooterForPageIndex(
                                  pageIndex,
                                ) as RichTextBoxElement,
                                $event,
                              )
                            "
                          />
                        </template>
                        <template
                          v-else-if="
                            isTextBoxElement(getFooterForPageIndex(pageIndex))
                          "
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
                            token-scope="footer"
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
                            :style="getFooterStyle(page)"
                            @click="
                              selectedHeaderFooterElement =
                                getFooterForPageIndex(pageIndex)
                            "
                            @update="
                              updateTextBox(
                                getFooterForPageIndex(
                                  pageIndex,
                                )! as TextBoxElement,
                                $event,
                              )
                            "
                        /></template>
                      </template>
                    </template>
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent
                class="chrome-menu"
                @pointerdown.capture="onScoreMenuContentPointerDown"
                @pointerup.capture="onScoreMenuContentPointerUp"
              >
                <ContextMenuItem
                  :disabled="!canCutCopySelected"
                  @select="onCutScoreElements"
                >
                  <PhScissors />
                  {{ $t(($) => $.menu.edit.cut, { ns: 'menu' }) }}
                </ContextMenuItem>
                <ContextMenuItem
                  :disabled="!canCutCopySelected"
                  @select="onCopyScoreElements"
                >
                  <PhCopy />
                  {{ $t(($) => $.menu.edit.copy, { ns: 'menu' }) }}
                </ContextMenuItem>
                <ContextMenuItem
                  :disabled="!canPasteSelected"
                  @select="onPasteScoreElements(false)"
                >
                  <PhClipboardText />
                  {{ $t(($) => $.menu.edit.paste, { ns: 'menu' }) }}
                </ContextMenuItem>
                <ContextMenuItem
                  :disabled="!canPasteSelected"
                  @select="onPasteScoreElements(true)"
                >
                  <PhClipboardText />
                  {{ $t(($) => $.menu.edit.pasteWithLyrics, { ns: 'menu' }) }}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  :disabled="!canSelectAllElements"
                  @select="onSelectAllScoreElements"
                >
                  <PhSelectionAll />
                  {{ $t(($) => $.menu.edit.selectAll, { ns: 'menu' }) }}
                </ContextMenuItem>
                <template v-if="contextMenuHasElementProperties">
                  <ContextMenuSeparator />
                  <ContextMenuCheckboxItem
                    v-if="contextMenuMartyria != null"
                    :model-value="contextMenuMartyria.alignRight"
                    @update:model-value="
                      updateMartyria(contextMenuMartyria, {
                        alignRight: $event === true,
                      })
                    "
                  >
                    <PhAlignRight class="h-4 w-4" weight="duotone" />
                    {{
                      $t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })
                    }}
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    v-if="contextMenuUseDefaultStyleTarget != null"
                    :model-value="
                      contextMenuUseDefaultStyleTarget.useDefaultStyle
                    "
                    @update:model-value="
                      setContextMenuUseDefaultStyle(
                        contextMenuUseDefaultStyleTarget,
                        $event === true,
                      )
                    "
                  >
                    {{
                      $t(($) => $.toolbar.common.useDefaultStyle, {
                        ns: 'toolbar',
                      })
                    }}
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    v-if="contextMenuModeKey != null"
                    :model-value="contextMenuModeKey.showAmbitus"
                    @update:model-value="
                      updateModeKey(contextMenuModeKey, {
                        showAmbitus: $event === true,
                      })
                    "
                  >
                    {{
                      $t(($) => $.toolbar.initialMartyria.showAmbitus, {
                        ns: 'toolbar',
                      })
                    }}
                  </ContextMenuCheckboxItem>
                  <ContextMenuCheckboxItem
                    v-if="contextMenuImageBox != null"
                    :model-value="contextMenuImageBox.lockAspectRatio"
                    @update:model-value="
                      updateImageBox(contextMenuImageBox, {
                        lockAspectRatio: $event === true,
                      })
                    "
                  >
                    {{
                      $t(($) => $.toolbar.imageBox.maintainAspectRatio, {
                        ns: 'toolbar',
                      })
                    }}
                  </ContextMenuCheckboxItem>
                </template>
                <ContextMenuSeparator />
                <ContextMenuItem
                  v-if="contextMenuNote != null"
                  @select="openContextMenuPositioning(contextMenuNote)"
                >
                  <PhCrosshair />
                  {{
                    $t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' })
                  }}
                </ContextMenuItem>
                <ContextMenuItem
                  v-if="contextMenuModeKey != null"
                  @select="openContextMenuChangeKey(contextMenuModeKey)"
                >
                  <PhMusicNotes />
                  {{
                    $t(($) => $.toolbar.initialMartyria.changeInitialMartyria, {
                      ns: 'toolbar',
                    })
                  }}
                </ContextMenuItem>
                <ContextMenuItem
                  @select="setPaneVisibility('properties', true)"
                >
                  <PhSlidersHorizontal />
                  {{ $t(($) => $.menu.view.properties, { ns: 'menu' }) }}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </template>
      </WorkspaceDockLayout>
    </div>
    <div
      v-if="
        inspectorContext.kind === 'neume' ||
        inspectorContext.kind === 'martyria' ||
        inspectorContext.kind === 'mode-key' ||
        inspectorContext.kind === 'lyrics' ||
        inspectorContext.kind === 'text-box' ||
        inspectorContext.kind === 'rich-text-box' ||
        inspectorContext.kind === 'annotation' ||
        inspectorContext.kind === 'drop-cap'
      "
      class="contextual-toolbar-panel flex-none w-full min-w-0"
    >
      <template v-if="inspectorContext.kind === 'neume'">
        <ToolbarNeume
          :key="`toolbar-neume-${selectedWorkspace.id}-${inspectorContext.element.id}`"
          :element="inspectorContext.element"
          :page-setup="score.pageSetup"
          :neume-keyboard="neumeKeyboard"
          :inner-neume="toolbarInnerNeume"
          @update="updateNoteAndSave(inspectorContext.element, $event)"
          @update:inner-neume="toolbarInnerNeume = $event"
          @update:accidental="setAccidental(inspectorContext.element, $event)"
          @update:secondary-accidental="
            setSecondaryAccidental(inspectorContext.element, $event)
          "
          @update:tertiary-accidental="
            setTertiaryAccidental(inspectorContext.element, $event)
          "
          @update:fthora="setFthoraNote(inspectorContext.element, $event)"
          @update:secondary-fthora="
            setSecondaryFthora(inspectorContext.element, $event)
          "
          @update:tertiary-fthora="
            setTertiaryFthora(inspectorContext.element, $event)
          "
          @update:gorgon="setGorgon(inspectorContext.element, $event)"
          @update:secondary-gorgon="
            setSecondaryGorgon(inspectorContext.element, $event)
          "
          @update:klasma="setKlasma(inspectorContext.element)"
          @update:time="setTimeNeume(inspectorContext.element, $event)"
          @update:expression="
            setVocalExpression(inspectorContext.element, $event)
          "
          @update:measure-bar="
            setMeasureBarNote(inspectorContext.element, $event)
          "
          @update:measure-number="
            setMeasureNumber(inspectorContext.element, $event)
          "
          @update:ison="setIson(inspectorContext.element, $event)"
          @update:tie="setTie(inspectorContext.element, $event)"
        />
      </template>
      <template v-else-if="inspectorContext.kind === 'martyria'">
        <ToolbarMartyria
          :element="inspectorContext.element"
          :page-setup="score.pageSetup"
          :neume-keyboard="neumeKeyboard"
          @update="updateMartyria(inspectorContext.element, $event)"
          @update:fthora="setFthoraMartyria(inspectorContext.element, $event)"
          @update:tempo-left="
            setMartyriaTempoLeft(inspectorContext.element, $event)
          "
          @update:tempo="setMartyriaTempo(inspectorContext.element, $event)"
          @update:tempo-right="
            setMartyriaTempoRight(inspectorContext.element, $event)
          "
          @update:measure-bar="
            setMeasureBarMartyria(inspectorContext.element, $event)
          "
          @update:quantitative-neume="
            setMartyriaQuantitativeNeume(inspectorContext.element, $event)
          "
        />
      </template>
      <template v-else-if="inspectorContext.kind === 'mode-key'">
        <ToolbarModeKey
          :element="inspectorContext.element"
          @update="updateModeKey(inspectorContext.element, $event)"
          @update:tempo="setModeKeyTempo(inspectorContext.element, $event)"
        />
      </template>
      <template v-else-if="inspectorContext.kind === 'lyrics'">
        <ToolbarLyrics
          :element="inspectorContext.element"
          :fonts="fonts"
          :paragraph-styles="score.paragraphStyles"
          @update="updateNoteAndSave(inspectorContext.element, $event)"
          @insert:special-character="insertSpecialCharacter"
        />
      </template>
      <template v-else-if="inspectorContext.kind === 'text-box'">
        <ToolbarTextBox
          :element="inspectorContext.element"
          :fonts="fonts"
          :paragraph-styles="score.paragraphStyles"
          @update="updateTextBox(inspectorContext.element, $event)"
          @insert:gorthmikon="insertGorthmikon"
          @insert:pelastikon="insertPelastikon"
        />
      </template>
      <template v-else-if="inspectorContext.kind === 'rich-text-box'">
        <RichTextToolbar
          :element="inspectorContext.element"
          :page-setup="score.pageSetup"
          :fonts="fonts"
          :paragraph-styles="score.paragraphStyles"
          :fallback-paragraph-style="
            inspectorContext.element.inline
              ? getResolvedLyricsStyle()
              : getResolvedDefaultParagraphStyle()
          "
        />
      </template>
      <template v-else-if="inspectorContext.kind === 'annotation'">
        <RichTextToolbar
          :element="inspectorContext.element"
          :page-setup="score.pageSetup"
          :fonts="fonts"
          :paragraph-styles="score.paragraphStyles"
          :fallback-paragraph-style="getResolvedAnnotationStyle()"
        />
      </template>
      <template v-else-if="inspectorContext.kind === 'drop-cap'">
        <ToolbarDropCap
          :element="inspectorContext.element"
          :fonts="fonts"
          :paragraph-styles="score.paragraphStyles"
          @update="updateDropCap(inspectorContext.element, $event)"
        />
      </template>
    </div>
    <div
      v-if="statusBarIsVisible"
      class="status-bar flex w-full flex-none items-center gap-2 chrome-toolbar-surface p-1"
    >
      <ButtonGroup>
        <ButtonGroupText data-slot="button-group-text">
          {{
            $t(($) => $.toolbar.status.pageNumber, {
              ns: 'toolbar',
              currentPageNumber: statusPageNumber,
              pageCount: statusPageCount,
            })
          }}
        </ButtonGroupText>
        <ButtonGroupText data-slot="button-group-text">
          {{
            $t(($) => $.toolbar.status.section, {
              ns: 'toolbar',
              sectionNumber: statusSectionNumber,
              sectionCount: statusSectionCount,
            })
          }}
        </ButtonGroupText>
      </ButtonGroup>
      <ButtonGroup>
        <ButtonGroupText data-slot="button-group-text">
          {{
            $t(($) => $.toolbar.status.line, {
              ns: 'toolbar',
              lineNumber: statusLinePosition.lineNumber,
              lineCount: statusLinePosition.lineCount,
            })
          }}
        </ButtonGroupText>
        <ButtonGroupText data-slot="button-group-text">
          {{
            $t(($) => $.toolbar.status.column, {
              ns: 'toolbar',
              columnNumber: statusColumnPosition.columnNumber,
              columnCount: statusColumnPosition.columnCount,
            })
          }}
        </ButtonGroupText>
        <ButtonGroupText
          v-if="statusNeumeNoteDisplay"
          data-slot="button-group-text"
        >
          {{ statusNeumeNoteDisplay }}
        </ButtonGroupText>
      </ButtonGroup>
    </div>
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
      :paragraph-styles="score.paragraphStyles"
      :fonts="fonts"
      @open-paragraph-styles="openParagraphStylesDialog($event)"
      @update="updatePageSetup($event)"
    />
    <ParagraphStylesDialog
      v-if="paragraphStylesDialogIsOpen"
      v-model:open="paragraphStylesDialogIsOpen"
      :paragraph-styles="score.paragraphStyles"
      :initial-selected-style-id="paragraphStylesDialogSelectedStyleId"
      :fonts="fonts"
      @update="updateParagraphStyles($event)"
    />
    <DocumentPropertiesDialog
      v-if="documentPropertiesDialogIsOpen"
      v-model:open="documentPropertiesDialogIsOpen"
      :document-properties="score.documentProperties"
      @update="updateDocumentProperties($event)"
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
        :paragraph-styles="score.paragraphStyles"
        :editor-language="ckeditorLanguage"
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

.developer-overlay-box {
  position: absolute;
  pointer-events: none;
  border: 1px dashed #2563eb;
}

.developer-glue-overlay {
  position: absolute;
  pointer-events: none;
  opacity: 0.75;
}

.developer-glue-preferred {
  --developer-glue-preferred-border: rgb(14 116 144 / 80%);
  position: absolute;
  box-sizing: border-box;
  border: 1px solid var(--developer-glue-preferred-border);
  background-size: 100% 100%;
}

.developer-glue-actual {
  --developer-glue-actual-fill: rgb(14 116 144 / 35%);
  position: absolute;
  border: 1px solid rgb(14 116 144 / 55%);
  background: var(--developer-glue-actual-fill);
}

.developer-glue-overlay.stretch .developer-glue-preferred {
  --developer-glue-preferred-border: rgb(3 105 161 / 85%);
}

.developer-glue-overlay.stretch .developer-glue-actual {
  --developer-glue-actual-fill: rgb(3 105 161 / 28%);
}

.developer-glue-overlay.shrink .developer-glue-preferred {
  --developer-glue-preferred-border: rgb(180 83 9 / 85%);
}

.developer-glue-overlay.shrink .developer-glue-actual {
  --developer-glue-actual-fill: rgb(217 119 6 / 24%);
}

.developer-glue-preferred.negative {
  background-image: repeating-linear-gradient(
    135deg,
    transparent 0 4px,
    var(--developer-glue-preferred-border) 4px 7px
  );
}

.developer-glue-actual.negative {
  background-image:
    repeating-linear-gradient(
      135deg,
      transparent 0 4px,
      rgb(255 255 255 / 45%) 4px 7px
    ),
    linear-gradient(
      var(--developer-glue-actual-fill),
      var(--developer-glue-actual-fill)
    );
}

.developer-box-overlay {
  position: absolute;
  pointer-events: none;
  border: 1px solid rgb(190 24 93 / 75%);
  background: rgb(244 114 182 / 16%);
}

.developer-box-overlay.owned {
  border-color: rgb(37 99 235 / 75%);
  background: rgb(96 165 250 / 16%);
}

.developer-box-overlay.line-start-reservation {
  border-color: rgb(147 51 234 / 75%);
  background: rgb(192 132 252 / 16%);
}

.developer-box-overlay.martyria-shift {
  border-color: rgb(217 119 6 / 80%);
  background: rgb(251 191 36 / 16%);
}

.developer-box-overlay.lyric-collision {
  border-color: rgb(22 163 74 / 80%);
  background: rgb(74 222 128 / 16%);
}

.developer-overlay-box.ink {
  border-color: #ef4444;
}

.developer-overlay-box.lyric {
  border-color: #16a34a;
}

.developer-overlay-box.collision {
  border-color: #f59e0b;
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
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

/*
 * vue3-tabs-chrome -> chrome tokens. The library ships compile-time hex with
 * no theming surface, so we override its compiled rules here. The tab component
 * is nested under TheEditor's scoped root, so these deep selectors match the
 * library DOM while staying local to the editor.
 */
:deep(.vue3-tabs-chrome) {
  padding: 0;
}

:deep(.vue3-tabs-chrome .tabs-main) {
  border-radius: 0;
  margin: 0;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
}

:deep(.vue3-tabs-chrome .tabs-background) {
  padding: 0;
}

:deep(.vue3-tabs-chrome .tabs-background-divider) {
  display: none;
}

:deep(.vue3-tabs-chrome .tabs-background-content) {
  border-radius: 0;
  background-color: var(--chrome-tab-rest);
}

:deep(.vue3-tabs-chrome .tabs-background-before),
:deep(.vue3-tabs-chrome .tabs-background-after) {
  fill: var(--chrome-tab-rest);
}

:deep(.vue3-tabs-chrome .tabs-item:hover .tabs-background-content) {
  background-color: var(--chrome-tab-hover);
}

:deep(.vue3-tabs-chrome .tabs-item:hover .tabs-background-before),
:deep(.vue3-tabs-chrome .tabs-item:hover .tabs-background-after) {
  fill: var(--chrome-tab-hover);
}

:deep(.vue3-tabs-chrome .tabs-item) {
  border-right: 1px solid var(--chrome-tab-divider);
}

:deep(.vue3-tabs-chrome .tabs-item:last-of-type) {
  border-right: none;
}

:deep(.vue3-tabs-chrome .tabs-item.active .tabs-main) {
  background-color: transparent;
}

:deep(.vue3-tabs-chrome .tabs-item.active .tabs-background-content) {
  border-top: 1px solid var(--chrome-tab-active-border);
  background-color: var(--chrome-tab-active);
}

:deep(.vue3-tabs-chrome .tabs-item.active .tabs-background-before),
:deep(.vue3-tabs-chrome .tabs-item.active .tabs-background-after) {
  fill: var(--chrome-tab-active);
}

:deep(.vue3-tabs-chrome .tabs-item.active .tabs-close) {
  background-color: inherit;
}

:deep(.vue3-tabs-chrome .tabs-close) {
  right: 0.5rem;
}

:deep(.vue3-tabs-chrome .tabs-close-icon) {
  stroke: var(--muted-foreground);
}

:deep(.vue3-tabs-chrome .tabs-close-icon:hover) {
  stroke: var(--foreground);
  background-color: var(--chrome-tab-close-hover);
}

:deep(.vue3-tabs-chrome .tabs-after) {
  position: relative;
  z-index: 1;
  display: inline-flex !important;
  right: auto !important;
  width: max-content !important;
  height: 100%;
  overflow: visible;
}

.workspace-tab-container {
  background-color: var(--chrome-tab-strip);
}

.workspace-tab-new-button {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  height: 100%;

  color: inherit;
  font-size: 1.25rem;
  font-weight: bold;
  background-color: var(--chrome-tab-new);
  border: none;
  cursor: default;
}

.workspace-tab-new-button:hover {
  background-color: var(--chrome-tab-action-hover);
}

.page-background {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 2rem 1rem;

  overflow: auto;
  flex: 1;
}

.page {
  margin-bottom: 20px;

  margin-left: auto;
  margin-right: auto;

  background-color: var(--chrome-paper);
  color: var(--chrome-paper-foreground);
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
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.neume-selector {
  flex: 1;
  min-height: 0;
}

.neume-combo-selector {
  flex: 1;
  min-height: 0;
  overflow: auto;
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

.leading-lyric-hyphen {
  position: absolute;
  pointer-events: none;
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
  .content {
    display: block;
    height: auto;
    overflow: visible;
  }

  .page,
  .page * {
    visibility: visible;
  }

  .page-background {
    display: block;
    padding: 0;
  }

  .page-container {
    position: static !important;
    z-index: auto;
    display: block;
    width: auto !important;
    height: auto !important;
    overflow: visible;
    visibility: visible !important;
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

  .workspace-tab-container,
  .workspace-tab-new-button,
  .contextual-toolbar-panel,
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
