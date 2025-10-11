<script setup lang="ts">
import 'vue3-tabs-chrome/dist/vue3-tabs-chrome.css';

import i18next from 'i18next';
import { storeToRefs } from 'pinia';
import { throttle } from 'throttle-debounce';
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
  useTemplateRef,
  watch,
} from 'vue';
import Vue3TabsChrome, { Tab } from 'vue3-tabs-chrome';

import AlternateLine from '@/components/AlternateLine.vue';
import ContentEditable from '@/components/ContentEditable.vue';
import DropCap from '@/components/DropCap.vue';
import EditorPreferencesDialog from '@/components/EditorPreferencesDialog.vue';
import ExportDialog from '@/components/ExportDialog.vue';
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
import { useAudioPlayback } from '@/composables/useAudioPlayback';
import { useClipboard } from '@/composables/useClipboard';
import { useCommandFactories } from '@/composables/useCommandFactories';
import { useEditing } from '@/composables/useEditing';
import { useFocus } from '@/composables/useFocus';
import { useHistory } from '@/composables/useHistory';
import { useKeyboard } from '@/composables/useKeyboard';
import { useSave } from '@/composables/useSave';
import { useScoreExport } from '@/composables/useScoreExport';
import { useSelection } from '@/composables/useSelection';
import { useStyles } from '@/composables/useStyles';
import { useTemplateRefsArray } from '@/composables/useTemplateRefsArray';
import { EventBus } from '@/eventBus';
import {
  CloseWorkspacesArgs,
  CloseWorkspacesDisposition,
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
import { Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import { Score } from '@/models/Score';
import { Workspace, WorkspaceLocalStorage } from '@/models/Workspace';
import { AudioService } from '@/services/audio/AudioService';
import { Command } from '@/services/history/CommandService';
import {
  LatexExporter,
  LatexExporterOptions,
} from '@/services/integration/LatexExporter';
import { IIpcService } from '@/services/ipc/IIpcService';
import { IpcService } from '@/services/ipc/IpcService';
import { LayoutService } from '@/services/LayoutService';
import { LyricService } from '@/services/LyricService';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { SaveService } from '@/services/SaveService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { TextSearchService } from '@/services/TextSearchService';
import { useEditorStore } from '@/stores/useEditorStore';
import { GORTHMIKON, PELASTIKON } from '@/utils/constants';
import {
  getFileName,
  getFileNameFromPath,
  getTempFilename,
} from '@/utils/filenames';
import { isElectron } from '@/utils/isElectron';
import { TokenMetadata } from '@/utils/replaceTokens';
import { TestFileGenerator } from '@/utils/TestFileGenerator';
import { TestFileType } from '@/utils/TestFileType';
import { withZoom } from '@/utils/withZoom';

import { Vue3TabsChromeComponent } from './Editor/Vue3TabsChromeComponent';

const ipcService = inject<IIpcService>('ipcService', new IpcService());
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
const neumeKeyboard = inject<NeumeKeyboard>(
  'neumeKeyboard',
  new NeumeKeyboard(),
);

const editor = useEditorStore();

const { pageRefs, elementRefs, lyricRefs } = storeToRefs(editor);

const { setRefByIndex: setPageRefByIndex } = useTemplateRefsArray(pageRefs);

const { setRefByIndex: setElementRefByIndex } =
  useTemplateRefsArray(elementRefs);

const { setRefByIndex: setLyricRefByIndex } = useTemplateRefsArray(lyricRefs);

const audioPlayback = useAudioPlayback();
const { save } = useSave();
const exporting = useScoreExport();
const { scoreElementCommandFactory, pageSetupCommandFactory } =
  useCommandFactories();
const { focusLyrics } = useFocus();
const history = useHistory();
const editing = useEditing();
useKeyboard();

const pageBackgroundRef = useTemplateRef('page-background');
const tabsRef = useTemplateRef<Vue3TabsChromeComponent>('tabs-ui');
const searchTextRef =
  useTemplateRef<InstanceType<typeof SearchText>>('searchText');

const showFileMenuBar = !isElectron();
const isDevelopment: boolean = import.meta.env.DEV;
const isBrowser: boolean = !isElectron();

const tab = ref<string | null>(null);
const tabs = reactive([] as Tab[]);

const {
  setSelectedElement,
  setSelectedHeaderFooterElement,
  setSelectedAlternateLine,
  setSelectedAnnotation,
  setSelectedLyrics,
  isSelected,
  isAudioSelected,
  setSelectionRange,
} = useSelection();

const clipboard = useClipboard();

// Throttled Methods
const onWindowResizeThrottled = throttle(250, onWindowResize);
const onScrollThrottled = throttle(250, onScroll);

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

  window.addEventListener('resize', onWindowResizeThrottled);

  EventBus.$on(IpcMainChannels.CloseWorkspaces, onCloseWorkspaces);
  EventBus.$on(IpcMainChannels.CloseApplication, onCloseApplication);

  EventBus.$on(IpcMainChannels.FileMenuNewScore, onFileMenuNewScore);
  EventBus.$on(IpcMainChannels.FileMenuOpenScore, onFileMenuOpenScore);
  EventBus.$on(IpcMainChannels.FileMenuPrint, exporting.onFileMenuPrint);
  EventBus.$on(IpcMainChannels.FileMenuSave, onFileMenuSave);
  EventBus.$on(IpcMainChannels.FileMenuSaveAs, onFileMenuSaveAs);
  EventBus.$on(IpcMainChannels.FileMenuPageSetup, onFileMenuPageSetup);
  EventBus.$on(
    IpcMainChannels.FileMenuExportAsPdf,
    exporting.onFileMenuExportAsPdf,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuExportAsHtml,
    exporting.onFileMenuExportAsHtml,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuExportAsMusicXml,
    exporting.onFileMenuExportAsMusicXml,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuExportAsLatex,
    exporting.onFileMenuExportAsLatex,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuExportAsImage,
    exporting.onFileMenuExportAsImage,
  );
  EventBus.$on(IpcMainChannels.FileMenuUndo, history.onFileMenuUndo);
  EventBus.$on(IpcMainChannels.FileMenuRedo, history.onFileMenuRedo);
  EventBus.$on(IpcMainChannels.FileMenuCut, clipboard.onFileMenuCut);
  EventBus.$on(IpcMainChannels.FileMenuCopy, clipboard.onFileMenuCopy);
  EventBus.$on(
    IpcMainChannels.FileMenuCopyAsHtml,
    exporting.onFileMenuCopyAsHtml,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuCopyFormat,
    clipboard.onFileMenuCopyFormat,
  );
  EventBus.$on(IpcMainChannels.FileMenuPaste, clipboard.onFileMenuPaste);
  EventBus.$on(
    IpcMainChannels.FileMenuPasteWithLyrics,
    clipboard.onFileMenuPasteWithLyrics,
  );
  EventBus.$on(
    IpcMainChannels.FileMenuPasteFormat,
    clipboard.onFileMenuPasteFormat,
  );
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
});

onBeforeUnmount(() => {
  // Remove the debugging variable from window
  (window as any)._editor = undefined;

  window.removeEventListener('resize', onWindowResizeThrottled);

  EventBus.$off(IpcMainChannels.CloseWorkspaces, onCloseWorkspaces);
  EventBus.$off(IpcMainChannels.CloseApplication, onCloseApplication);

  EventBus.$off(IpcMainChannels.FileMenuNewScore, onFileMenuNewScore);
  EventBus.$off(IpcMainChannels.FileMenuOpenScore, onFileMenuOpenScore);
  EventBus.$off(IpcMainChannels.FileMenuPrint, exporting.onFileMenuPrint);
  EventBus.$off(IpcMainChannels.FileMenuSave, onFileMenuSave);
  EventBus.$off(IpcMainChannels.FileMenuSaveAs, onFileMenuSaveAs);
  EventBus.$off(IpcMainChannels.FileMenuPageSetup, onFileMenuPageSetup);
  EventBus.$off(
    IpcMainChannels.FileMenuExportAsPdf,
    exporting.onFileMenuExportAsPdf,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuExportAsHtml,
    exporting.onFileMenuExportAsHtml,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuExportAsMusicXml,
    exporting.onFileMenuExportAsMusicXml,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuExportAsLatex,
    exporting.onFileMenuExportAsLatex,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuExportAsImage,
    exporting.onFileMenuExportAsImage,
  );
  EventBus.$off(IpcMainChannels.FileMenuUndo, history.onFileMenuUndo);
  EventBus.$off(IpcMainChannels.FileMenuRedo, history.onFileMenuRedo);
  EventBus.$off(IpcMainChannels.FileMenuCut, clipboard.onFileMenuCut);
  EventBus.$off(IpcMainChannels.FileMenuCopy, clipboard.onFileMenuCopy);
  EventBus.$off(
    IpcMainChannels.FileMenuCopyAsHtml,
    exporting.onFileMenuCopyAsHtml,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuCopyFormat,
    clipboard.onFileMenuCopyFormat,
  );
  EventBus.$off(IpcMainChannels.FileMenuPaste, clipboard.onFileMenuPaste);
  EventBus.$off(
    IpcMainChannels.FileMenuPasteWithLyrics,
    clipboard.onFileMenuPasteWithLyrics,
  );
  EventBus.$off(
    IpcMainChannels.FileMenuPasteFormat,
    clipboard.onFileMenuPasteFormat,
  );
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
});

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

function insertPelastikon() {
  document.execCommand('insertText', false, PELASTIKON);
}

function insertGorthmikon() {
  document.execCommand('insertText', false, GORTHMIKON);
}

function insertSpecialCharacter(character: string) {
  document.execCommand('insertText', false, character);
}

function onClickAddImage() {
  EventBus.$emit(IpcRendererChannels.OpenImageDialog);
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

function onWindowResize() {
  if (editor.zoomToFit) {
    performZoomToFit();
  }
}

function onScroll() {
  calculatePageNumber();
}

function calculatePageNumber() {
  let maxPercentage = 0;
  let maxPercentageIndex = -1;

  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;

  for (let pageIndex = 0; pageIndex < editor.pageCount; pageIndex++) {
    const rect = editor.pageRefs[pageIndex].getBoundingClientRect();

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
      await exporting.onFileMenuExportAsPdf();
      removeWorkspace(editor.selectedWorkspace as Workspace);
    }
  }

  if (openWorkspaceResults.silentHtml) {
    for (const file of openWorkspaceResults.files.filter((x) => x.success)) {
      openScore(file);
      await exporting.onFileMenuExportAsHtml();
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

function updatePageVisibility(page: Page, isVisible: boolean) {
  page.isVisible = isVisible;
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
    editing.recalculateRichTextBoxHeights();
    editing.recalculateTextBoxHeights();
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
  editor.selectedWorkspace.entryMode = mode;
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

function onFileMenuNewScore() {
  const workspace = new Workspace();
  workspace.tempFileName = getTempFilename();
  workspace.score = createDefaultScore();

  addWorkspace(workspace);

  setSelectedWorkspace(workspace);

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
    (editor.elementRefs[element.index] as InstanceType<typeof TextBox>).focus();
  });
}

function onFileMenuInsertRichTextBox() {
  const element = new RichTextBoxElement();
  element.rtl = editor.score.pageSetup.melkiteRtl;

  addScoreElement(element, editor.selectedElementIndex);

  setSelectedElement(element);

  save();

  nextTick(() => {
    (
      editor.elementRefs[element.index] as InstanceType<typeof TextBoxRich>
    ).focus();
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

  setSelectedWorkspace(workspace);

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

    editor.pageRefs[result.page - 1].scrollIntoView();

    editor.pages[result.page - 1].isVisible = true;

    nextTick(() => {
      if (editor.selectedElement?.elementType === ElementType.Note) {
        (
          editor.elementRefs[editor.selectedElementIndex] as HTMLElement
        ).scrollIntoView();
      } else if (editor.selectedElement?.elementType === ElementType.DropCap) {
        (
          editor.elementRefs[editor.selectedElementIndex] as InstanceType<
            typeof DropCap
          >
        ).$el.scrollIntoView();
      } else if (editor.selectedElement?.elementType === ElementType.TextBox) {
        (
          editor.elementRefs[editor.selectedElementIndex] as InstanceType<
            typeof TextBox
          >
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
    setSelectedWorkspace(existingWorkspace as Workspace);
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

    setSelectedWorkspace(workspace);

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
      setSelectedWorkspace(
        editor.workspaces[
          Math.min(index, editor.workspaces.length - 1)
        ] as Workspace,
      );
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

const {
  updateNoteAndSave,
  updateLyricsLocked,
  updateStaffLyrics,
  updateLyrics,
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
  updateModeKey,
  updateModeKeyFromTemplate,
  updateMartyria,
  setAccidental,
  setFthoraMartyria,
  updateTempoSpaceAfter,
  updateTempoBpm,
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
  addScoreElement,
  deleteSelectedElement,
  addQuantitativeNeume,
  addAutoMartyria,
  addDropCap,
  refreshStaffLyrics,
  updateScoreElementSectionName,
  toggleLineBreak,
  togglePageBreak,
} = useEditing();

const {
  getMelismaHyphenStyle,
  getMelismaUnderscoreStyleInner,
  getMelismaUnderscoreStyleOuter,
  getMelismaStyle,
  getLyricStyle,
  getElementStyle,
  getEmptyBoxStyle,
} = useStyles();

const { addNeumeCombination } = useClipboard();
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
            :ref="setPageRefByIndex(pageIndex)"
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
                      :ref="setElementRefByIndex(element.index)"
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
                        :note="element as NoteElement"
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
                          :ref="setLyricRefByIndex(element.index)"
                          @click="focusLyrics(element.index)"
                          @focus="setSelectedLyrics(element as NoteElement)"
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
                            @focus="setSelectedLyrics(element as NoteElement)"
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
                        :ref="setElementRefByIndex(element.index)"
                        class="marytria-neume-box"
                        :neume="element as MartyriaElement"
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
                      :ref="setElementRefByIndex(element.index)"
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
                        @select-single="setSelectedElement(element)"
                        @select-range="setSelectionRange(element)"
                      />
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isEmptyElement(element)">
                    <div
                      :ref="setElementRefByIndex(element.index)"
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
                      :ref="setElementRefByIndex(element.index)"
                      :element="element as TextBoxElement"
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
                      :ref="setElementRefByIndex(element.index)"
                      :element="element as RichTextBoxElement"
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
                      :ref="setElementRefByIndex(element.index)"
                      :element="element as ModeKeyElement"
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
                      :ref="setElementRefByIndex(element.index)"
                      :element="element as DropCapElement"
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
                      :ref="setElementRefByIndex(element.index)"
                      :element="element as ImageBoxElement"
                      :zoom="zoom"
                      :printMode="printMode"
                      :class="[{ selectedImagebox: isSelected(element) }]"
                      @select-single="setSelectedElement(element)"
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
        :element="selectedElementForNeumeToolbar"
        :pageSetup="score.pageSetup"
        :neumeKeyboard="neumeKeyboard"
        :key="`toolbar-neume-${editor.selectedWorkspace.id}-${selectedElement.id}-${selectedElement.keyHelper}`"
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
      @exportAsPng="exporting.exportAsPng"
      @exportAsMusicXml="exporting.exportAsMusicXml"
      @exportAsLatex="exporting.exportAsLatex"
      @close="exporting.closeExportDialog"
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
