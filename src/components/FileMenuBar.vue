<template>
  <div>
    <Alert v-if="!isChrome" variant="destructive">
      <AlertDescription>
        {{ $t(($) => $.menu.warning, { ns: 'menu' }) }}
      </AlertDescription>
    </Alert>

    <Menubar class="chrome-menubar">
      <MenubarMenu>
        <MenubarTrigger>
          {{ $t(($) => $.menu.file.root, { ns: 'menu' }) }}
        </MenubarTrigger>
        <MenubarContent class="chrome-menubar-content">
          <MenubarItem @select="onClickNew">
            <PhFilePlus />
            {{ $t(($) => $.menu.file.new, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickOpen">
            <PhFolderOpen />
            {{ $t(($) => $.menu.file.open, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger
              :class="openRecentIsEnabled ? undefined : disabledSubmenuClass"
              :disabled="!openRecentIsEnabled"
            >
              <PhClockCounterClockwise />
              {{ $t(($) => $.menu.file.openRecent, { ns: 'menu' }) }}
            </MenubarSubTrigger>
            <MenubarSubContent
              v-if="openRecentIsEnabled"
              class="chrome-menubar-content"
            >
              <MenubarItem
                v-for="(recentFile, index) in recentFiles"
                :key="recentFile.id"
                @select="onClickOpenRecent(recentFile.id)"
              >
                {{ index + 1 }}: {{ recentFile.name }}
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSub>
            <MenubarSubTrigger>
              <PhTrayArrowDown />
              {{ $t(($) => $.menu.file.import, { ns: 'menu' }) }}
            </MenubarSubTrigger>
            <MenubarSubContent class="chrome-menubar-content">
              <MenubarItem @select="onClickImportOcr">
                <PhFileText />
                {{ $t(($) => $.menu.file.importFromOcr, { ns: 'menu' }) }}
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem @select="onClickSave">
            <PhFloppyDisk />
            {{ $t(($) => $.menu.file.save, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickSaveAs">
            <PhFloppyDiskBack />
            {{ $t(($) => $.menu.file.saveAs, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @select="onClickDocumentProperties">
            <PhFileText />
            {{ $t(($) => $.menu.file.documentProperties, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>
              <PhExport />
              {{ $t(($) => $.menu.file.exportAs, { ns: 'menu' }) }}
            </MenubarSubTrigger>
            <MenubarSubContent class="chrome-menubar-content">
              <MenubarItem @select="onClickExportAsPdf">
                <PhFilePdf />
                {{ $t(($) => $.menu.file.exportAsPdf, { ns: 'menu' }) }}
              </MenubarItem>
              <MenubarItem @select="onClickExportAsHtml">
                <PhFileHtml />
                {{ $t(($) => $.menu.file.exportAsHtml, { ns: 'menu' }) }}
              </MenubarItem>
              <MenubarItem @select="onClickExportAsMusicXml">
                <PhFileCode />
                {{ $t(($) => $.menu.file.exportAsMusicXml, { ns: 'menu' }) }}
              </MenubarItem>
              <MenubarItem @select="onClickExportAsLatex">
                <PhFileText />
                {{ $t(($) => $.menu.file.exportAsLatex, { ns: 'menu' }) }}
              </MenubarItem>
              <MenubarItem @select="onClickExportAsImage">
                <PhFileImage />
                {{ $t(($) => $.menu.file.exportAsImage, { ns: 'menu' }) }}
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem @select="onClickPrint">
            <PhPrinter />
            {{ $t(($) => $.menu.file.print, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @select="onClickClose">
            <PhX />
            {{ $t(($) => $.menu.file.close, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickCloseOthers">
            <PhXCircle />
            {{ $t(($) => $.menu.file.closeOthers, { ns: 'menu' }) }}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>
          {{ $t(($) => $.menu.edit.root, { ns: 'menu' }) }}
        </MenubarTrigger>
        <MenubarContent class="chrome-menubar-content">
          <MenubarItem @select="onClickUndo">
            <PhArrowCounterClockwise />
            {{ $t(($) => $.menu.edit.undo, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickRedo">
            <PhArrowClockwise />
            {{ $t(($) => $.menu.edit.redo, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @select="onClickCut">
            <PhScissors />
            {{ $t(($) => $.menu.edit.cut, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickCopy">
            <PhCopy />
            {{ $t(($) => $.menu.edit.copy, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickCopyAsHtml">
            <PhFileHtml />
            {{ $t(($) => $.menu.edit.copyAsHtml, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickPaste">
            <PhClipboardText />
            {{ $t(($) => $.menu.edit.paste, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickPasteWithLyrics">
            {{ $t(($) => $.menu.edit.pasteWithLyrics, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickSelectAll">
            <PhSelectionAll />
            {{ $t(($) => $.menu.edit.selectAll, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @select="onClickCopyFormat">
            <PhPaintBrush />
            {{ $t(($) => $.menu.edit.copyFormat, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickPasteFormat">
            <PhPaintBucket />
            {{ $t(($) => $.menu.edit.pasteFormat, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @select="onClickFind">
            <PhMagnifyingGlass />
            {{ $t(($) => $.menu.edit.find, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem
            :disabled="!props.canCopyElementLink"
            @select="onClickCopyElementLink"
          >
            <PhLinkSimple />
            {{ $t(($) => $.menu.edit.copyElementLink, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @select="onClickPreferences">
            <PhGearFine />
            {{ $t(($) => $.menu.edit.preferences, { ns: 'menu' }) }}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>
          {{ $t(($) => $.menu.insert.root, { ns: 'menu' }) }}
        </MenubarTrigger>
        <MenubarContent class="chrome-menubar-content">
          <MenubarItem @select="onClickAddAlternateLine">
            <PhMusicNotesPlus />
            {{ $t(($) => $.menu.insert.alternateLine, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickAddAnnotation">
            <PhNotePencil />
            {{ $t(($) => $.menu.insert.annotation, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickAddDropCapBefore">
            <PhArticleNyTimes />
            {{ $t(($) => $.menu.insert.dropCapBefore, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickAddDropCapAfter">
            <PhArticleNyTimes />
            {{ $t(($) => $.menu.insert.dropCapAfter, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickAddTextBox">
            <PhTextbox />
            {{ $t(($) => $.menu.insert.textBox, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickAddRichTextBox">
            <PhTextAa />
            {{ $t(($) => $.menu.insert.richTextBox, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickAddInlineTextBox">
            {{ $t(($) => $.menu.insert.inlineTextBox, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickAddModeKey">
            <PhWaveSine />
            {{ $t(($) => $.menu.insert.initialMartyria, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickAddImage">
            <PhImageSquare />
            {{ $t(($) => $.menu.insert.image, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarSub>
            <MenubarSubTrigger>
              <PhBookOpenText />
              {{ $t(($) => $.menu.insert.headersAndFooters, { ns: 'menu' }) }}
            </MenubarSubTrigger>
            <MenubarSubContent class="chrome-menubar-content">
              <MenubarItem @select="onClickAddHeader">
                <PhRowsPlusTop />
                {{ $t(($) => $.menu.insert.header, { ns: 'menu' }) }}
              </MenubarItem>
              <MenubarItem @select="onClickAddFooter">
                <PhRowsPlusBottom />
                {{ $t(($) => $.menu.insert.footer, { ns: 'menu' }) }}
              </MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>
          {{ $t(($) => $.menu.format.root, { ns: 'menu' }) }}
        </MenubarTrigger>
        <MenubarContent class="chrome-menubar-content">
          <MenubarItem @select="onClickPageSetup">
            <PhScroll />
            {{ $t(($) => $.menu.file.pageSetup, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickTextStyles">
            <PhTextAa />
            {{ $t(($) => $.menu.file.textStyles, { ns: 'menu' }) }}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>
          {{ $t(($) => $.menu.view.root, { ns: 'menu' }) }}
        </MenubarTrigger>
        <MenubarContent class="chrome-menubar-content">
          <MenubarSub>
            <MenubarSubTrigger>
              <PhMagnifyingGlass />
              {{ $t(($) => $.menu.view.zoom.root, { ns: 'menu' }) }}
            </MenubarSubTrigger>
            <MenubarSubContent class="chrome-menubar-content">
              <MenubarItem @select="onZoomInClick">
                <PhMagnifyingGlassPlus />
                {{ $t(($) => $.menu.view.zoom.zoomIn, { ns: 'menu' }) }}
              </MenubarItem>
              <MenubarItem @select="onZoomOutClick">
                <PhMagnifyingGlassMinus />
                {{ $t(($) => $.menu.view.zoom.zoomOut, { ns: 'menu' }) }}
              </MenubarItem>
              <MenubarSeparator />
              <MenubarCheckboxItem
                :model-value="actualSizeZoomIsSelected"
                @select="onActualSizeZoomClick"
              >
                {{ $t(($) => $.menu.view.zoom.actualSize, { ns: 'menu' }) }}
              </MenubarCheckboxItem>
              <MenubarSeparator />
              <MenubarCheckboxItem
                :model-value="props.zoomFitMode === 'page-width'"
                @select="onZoomFitModeClick('page-width')"
              >
                {{ $t(($) => $.menu.view.zoom.pageWidth, { ns: 'menu' }) }}
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :model-value="props.zoomFitMode === 'text-width'"
                @select="onZoomFitModeClick('text-width')"
              >
                {{ $t(($) => $.menu.view.zoom.textWidth, { ns: 'menu' }) }}
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :model-value="props.zoomFitMode === 'whole-page'"
                @select="onZoomFitModeClick('whole-page')"
              >
                {{ $t(($) => $.menu.view.zoom.wholePage, { ns: 'menu' }) }}
              </MenubarCheckboxItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarSeparator />
          <MenubarCheckboxItem
            :model-value="props.paneVisibility['neume-selector']"
            @update:model-value="
              onTogglePaneClick('neume-selector', $event === true)
            "
          >
            {{ $t(($) => $.menu.view.neumeSelector, { ns: 'menu' }) }}
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            :model-value="props.paneVisibility['common-combos']"
            @update:model-value="
              onTogglePaneClick('common-combos', $event === true)
            "
          >
            {{ $t(($) => $.menu.view.commonCombos, { ns: 'menu' }) }}
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            :model-value="props.paneVisibility.properties"
            @update:model-value="
              onTogglePaneClick('properties', $event === true)
            "
          >
            {{ $t(($) => $.menu.view.properties, { ns: 'menu' }) }}
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            :model-value="props.paneVisibility.selection"
            @update:model-value="
              onTogglePaneClick('selection', $event === true)
            "
          >
            {{ $t(($) => $.menu.view.selection, { ns: 'menu' }) }}
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            :model-value="props.paneVisibility.lyrics"
            @update:model-value="onTogglePaneClick('lyrics', $event === true)"
          >
            {{ $t(($) => $.menu.view.lyrics, { ns: 'menu' }) }}
          </MenubarCheckboxItem>
          <MenubarCheckboxItem
            v-if="props.showDeveloperPanels"
            :model-value="props.paneVisibility.developer"
            @update:model-value="
              onTogglePaneClick('developer', $event === true)
            "
          >
            {{ $t(($) => $.menu.view.developer, { ns: 'menu' }) }}
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarCheckboxItem
            :model-value="props.statusBarVisible"
            @update:model-value="onToggleStatusBarClick($event === true)"
          >
            {{ $t(($) => $.menu.view.statusBar, { ns: 'menu' }) }}
          </MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarItem @select="onResetPaneLayoutClick">
            <PhArrowCounterClockwise />
            {{ $t(($) => $.menu.view.resetLayout, { ns: 'menu' }) }}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>
          {{ $t(($) => $.menu.window.root, { ns: 'menu' }) }}
        </MenubarTrigger>
        <MenubarContent class="chrome-menubar-content">
          <MenubarItem
            :disabled="!props.canNavigateWorkspaceTabs"
            @select="onClickPreviousTab"
          >
            <PhArrowLineLeft />
            {{ $t(($) => $.menu.window.previousTab, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem
            :disabled="!props.canNavigateWorkspaceTabs"
            @select="onClickNextTab"
          >
            <PhArrowLineRight />
            {{ $t(($) => $.menu.window.nextTab, { ns: 'menu' }) }}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>
          {{ $t(($) => $.menu.help.root, { ns: 'menu' }) }}
        </MenubarTrigger>
        <MenubarContent class="chrome-menubar-content">
          <MenubarItem @select="onClickGuide">
            <PhBookOpen />
            {{ $t(($) => $.menu.help.guide, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @select="onClickRequestFeature">
            <PhLightbulb />
            {{ $t(($) => $.menu.help.requestAFeature, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarItem @select="onClickReportIssue">
            <PhBug />
            {{ $t(($) => $.menu.help.reportAnIssue, { ns: 'menu' }) }}
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem @select="onClickAbout">
            <PhInfo />
            {{ $t(($) => $.menu.help.about, { ns: 'menu' }) }}
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>

    <input
      ref="file"
      class="hidden"
      type="file"
      :accept="accept"
      @change="onSelectFile"
    />
    <input
      ref="imagefile"
      class="hidden"
      type="file"
      :accept="acceptImage"
      @change="onSelectImageFile"
    />
    <input
      ref="ocrfile"
      class="hidden"
      type="file"
      :accept="acceptOcr"
      @change="onSelectOcrFile"
    />
  </div>
</template>

<script setup lang="ts">
import {
  PhArrowClockwise,
  PhArrowCounterClockwise,
  PhArrowLineLeft,
  PhArrowLineRight,
  PhArticleNyTimes,
  PhBookOpen,
  PhBookOpenText,
  PhBug,
  PhClipboardText,
  PhClockCounterClockwise,
  PhCopy,
  PhExport,
  PhFileCode,
  PhFileHtml,
  PhFileImage,
  PhFilePdf,
  PhFilePlus,
  PhFileText,
  PhFloppyDisk,
  PhFloppyDiskBack,
  PhFolderOpen,
  PhGearFine,
  PhImageSquare,
  PhInfo,
  PhLightbulb,
  PhLinkSimple,
  PhMagnifyingGlass,
  PhMagnifyingGlassMinus,
  PhMagnifyingGlassPlus,
  PhMusicNotesPlus,
  PhNotePencil,
  PhPaintBrush,
  PhPaintBucket,
  PhPrinter,
  PhRowsPlusBottom,
  PhRowsPlusTop,
  PhScissors,
  PhScroll,
  PhSelectionAll,
  PhTextAa,
  PhTextbox,
  PhTrayArrowDown,
  PhWaveSine,
  PhX,
  PhXCircle,
} from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import JSZip from 'jszip';
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { toast } from 'vue-sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { EventBus } from '@/eventBus';
import type {
  CloseWorkspacesArgs,
  FileMenuImportOcrArgs,
  FileMenuInsertTextboxArgs,
  FileMenuOpenImageArgs,
  FileMenuOpenScoreArgs,
  FileMenuViewPaneVisibilityArgs,
  FileMenuViewStatusBarVisibilityArgs,
  FileMenuViewZoomArgs,
} from '@/ipc/ipcChannels';
import {
  CloseWorkspacesDisposition,
  IpcMainChannels,
  IpcRendererChannels,
} from '@/ipc/ipcChannels';
import type { ZoomFitMode } from '@/models/Workspace';
import type {
  WorkspacePaneId,
  WorkspacePaneVisibility,
} from '@/models/WorkspacePane';
import {
  type BrowserRecentFile,
  BrowserRecentFilesService,
} from '@/services/BrowserRecentFilesService';

const props = defineProps<{
  canCopyElementLink: boolean;
  canNavigateWorkspaceTabs: boolean;
  paneVisibility: WorkspacePaneVisibility;
  showDeveloperPanels: boolean;
  statusBarVisible: boolean;
  zoom: number;
  zoomFitMode: ZoomFitMode | null;
}>();

const fileSelector = useTemplateRef<HTMLInputElement>('file');
const imageFileSelector = useTemplateRef<HTMLInputElement>('imagefile');
const ocrFileSelector = useTemplateRef<HTMLInputElement>('ocrfile');
const recentFilesService = new BrowserRecentFilesService();
const { t } = useTranslation();

const accept = '.byz,.byzx';
const acceptImage = '.bmp,.jpg,.jpeg,.jpe,.png,.gif,.svg,.webp,.ico';
const acceptOcr = '.byzocr';
const disabledSubmenuClass =
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50';
const isChrome = (window as any).chrome != null;
const openRecentIsSupported = recentFilesService.isSupported();
const recentFiles = ref<BrowserRecentFile[]>([]);
const openRecentIsEnabled = computed(
  () => openRecentIsSupported && recentFiles.value.length > 0,
);
const ZOOM_COMPARISON_EPSILON = 0.000001;
const actualSizeZoomIsSelected = computed(
  () =>
    props.zoomFitMode == null &&
    Math.abs(props.zoom - 1) <= ZOOM_COMPARISON_EPSILON,
);

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return fallback;
}

onMounted(() => {
  // If using the browser, then we need to hook into the key down
  // to listen for Ctrl+O for open, Ctrl+S for save, etc.
  window.addEventListener('keydown', onKeyDown);

  EventBus.$on(IpcRendererChannels.OpenScoreDialog, onClickOpen);
  EventBus.$on(IpcRendererChannels.OpenImageDialog, onClickAddImage);
  void loadRecentFiles();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  EventBus.$off(IpcRendererChannels.OpenScoreDialog, onClickOpen);
  EventBus.$off(IpcRendererChannels.OpenImageDialog, onClickAddImage);
});

function onKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey) {
    if (event.code === 'KeyO') {
      void onClickOpen();
      event.preventDefault();
      return;
    } else if (event.shiftKey && event.code === 'KeyS') {
      onClickSaveAs();
      event.preventDefault();
      return;
    } else if (event.code === 'KeyS') {
      onClickSave();
      event.preventDefault();
      return;
    } else if (event.code === 'KeyN') {
      // Note: this doesn't actually work in Chrome.
      // Chrome prevents you from capturing Ctrl+N.
      onClickNew();
      event.preventDefault();
      return;
    } else if (event.code === 'KeyD') {
      if (event.shiftKey) {
        onClickAddDropCapAfter();
      } else {
        onClickAddDropCapBefore();
      }
      event.preventDefault();
      return;
    } else if (event.shiftKey && event.code === 'KeyP') {
      onClickPageSetup();
      event.preventDefault();
      return;
    } else if (event.code === 'Comma') {
      onClickPreferences();
      event.preventDefault();
      return;
    } else if (event.code === 'KeyL') {
      onTogglePaneClick('lyrics');
      event.preventDefault();
      return;
    }
  }
}

function onClickNew() {
  EventBus.$emit(IpcMainChannels.FileMenuNewScore);
}

async function onClickOpen() {
  if (openRecentIsSupported) {
    let handle: Awaited<
      ReturnType<typeof recentFilesService.showOpenFilePicker>
    > | null = null;

    try {
      handle = await recentFilesService.showOpenFilePicker();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      console.error(error);
      fileSelector.value!.click();
      return;
    }

    if (handle == null) {
      return;
    }

    try {
      const file = await handle.getFile();
      await openScoreFile(file);
    } catch (error) {
      console.error(error);
      toast.error(
        t(($) => $.toast.editor.openFailed, { ns: 'toast' }),
        {
          description: getErrorMessage(
            error,
            t(($) => $.toast.editor.openFailedDescription, { ns: 'toast' }),
          ),
        },
      );
      return;
    }

    try {
      await recentFilesService.add(handle);
      await loadRecentFiles();
    } catch (error) {
      console.error(error);
    }

    return;
  }

  fileSelector.value!.click();
}

async function onClickOpenRecent(id: string) {
  try {
    const recentFile = await recentFilesService.open(id);

    if (recentFile != null) {
      await openScoreFile(recentFile.file, recentFile.filePath);
    } else {
      toast.error(
        t(($) => $.toast.editor.openRecentFailed, { ns: 'toast' }),
        {
          description: t(($) => $.toast.editor.openRecentUnavailable, {
            ns: 'toast',
          }),
        },
      );
    }
  } catch (error) {
    console.error(error);
    toast.error(
      t(($) => $.toast.editor.openRecentFailed, { ns: 'toast' }),
      {
        description: getErrorMessage(
          error,
          t(($) => $.toast.editor.openRecentReadFailed, { ns: 'toast' }),
        ),
      },
    );
  } finally {
    await loadRecentFiles();
  }
}

function onClickImportOcr() {
  ocrFileSelector.value!.click();
}

function onClickSave() {
  EventBus.$emit(IpcMainChannels.FileMenuSave);
}

function onClickSaveAs() {
  EventBus.$emit(IpcMainChannels.FileMenuSaveAs);
}

function onClickExportAsPdf() {
  EventBus.$emit(IpcMainChannels.FileMenuExportAsPdf);
}

function onClickExportAsHtml() {
  EventBus.$emit(IpcMainChannels.FileMenuExportAsHtml);
}

function onClickExportAsMusicXml() {
  EventBus.$emit(IpcMainChannels.FileMenuExportAsMusicXml);
}

function onClickExportAsLatex() {
  EventBus.$emit(IpcMainChannels.FileMenuExportAsLatex);
}

function onClickExportAsImage() {
  EventBus.$emit(IpcMainChannels.FileMenuExportAsImage);
}

function onClickPrint() {
  window.print();
}

function onClickPageSetup() {
  EventBus.$emit(IpcMainChannels.FileMenuPageSetup);
}

function onClickTextStyles() {
  EventBus.$emit(IpcMainChannels.FileMenuTextStyles);
}

function onClickDocumentProperties() {
  EventBus.$emit(IpcMainChannels.FileMenuDocumentProperties);
}

function onClickClose() {
  EventBus.$emit(IpcMainChannels.CloseWorkspaces, {
    disposition: CloseWorkspacesDisposition.SELF,
  } as CloseWorkspacesArgs);
}

function onClickCloseOthers() {
  EventBus.$emit(IpcMainChannels.CloseWorkspaces, {
    disposition: CloseWorkspacesDisposition.OTHERS,
  } as CloseWorkspacesArgs);
}

async function onSelectFile() {
  const files = fileSelector.value!.files!;

  if (files.length > 0) {
    try {
      await openScoreFile(files[0]);
    } catch (error) {
      console.error(error);
      toast.error(
        t(($) => $.toast.editor.openFailed, { ns: 'toast' }),
        {
          description: getErrorMessage(
            error,
            t(($) => $.toast.editor.openFailedDescription, { ns: 'toast' }),
          ),
        },
      );
    } finally {
      resetFileSelector(fileSelector.value);
    }
  }
}

async function loadRecentFiles() {
  recentFiles.value = await recentFilesService.list();
}

async function openScoreFile(file: File, filePath = file.name) {
  const data = await readScoreFile(file);

  EventBus.$emit(IpcMainChannels.FileMenuOpenScore, {
    data,
    filePath,
    success: true,
  } as FileMenuOpenScoreArgs);
}

async function readScoreFile(file: File) {
  if (file.name.endsWith('.byz')) {
    const zip = await JSZip.loadAsync(file);
    const scoreFile = zip.file(/\.(byzx)$/)[0];

    if (scoreFile == null) {
      throw new Error('Could not find a .byzx score inside the .byz file.');
    }

    return await scoreFile.async('text');
  }

  return await file.text();
}

function resetFileSelector(selector: HTMLInputElement | null) {
  if (selector != null) {
    selector.value = '';
  }
}

async function onSelectImageFile() {
  const files = imageFileSelector.value!.files!;

  if (files.length > 0) {
    const file = files[0];

    const reader = new FileReader();

    reader.onload = () => {
      const data = reader.result as string;

      // Create an instance of Image to determine the
      // original image's height and width
      const image = new Image();

      image.onload = () => {
        EventBus.$emit(IpcMainChannels.FileMenuInsertImage, {
          data,
          imageHeight: image.height,
          imageWidth: image.width,
          filePath: file.name,
          success: true,
        } as FileMenuOpenImageArgs);
      };

      image.src = data;

      // Reset the selector so that if the user selects
      // the same file twice, it will load
      imageFileSelector.value!.value = '';
    };

    reader.readAsDataURL(file);
  }
}

async function onSelectOcrFile() {
  const files = ocrFileSelector.value!.files!;

  if (files.length > 0) {
    const file = files[0];
    const reader = new FileReader();

    reader.onload = () => {
      EventBus.$emit(IpcMainChannels.FileMenuImportOcr, {
        data: reader.result as string,
        filePath: file.name,
        success: true,
      } as FileMenuImportOcrArgs);

      // Reset the selector so that if the user selects
      // the same file twice, it will load
      ocrFileSelector.value!.value = '';
    };

    reader.readAsText(file);
  }
}

function onClickCut() {
  EventBus.$emit(IpcMainChannels.FileMenuCut);
}

function onClickCopy() {
  EventBus.$emit(IpcMainChannels.FileMenuCopy);
}

function onClickCopyAsHtml() {
  EventBus.$emit(IpcMainChannels.FileMenuCopyAsHtml);
}

function onClickCopyFormat() {
  EventBus.$emit(IpcMainChannels.FileMenuCopyFormat);
}

function onClickPaste() {
  EventBus.$emit(IpcMainChannels.FileMenuPaste);
}

function onClickPasteWithLyrics() {
  EventBus.$emit(IpcMainChannels.FileMenuPasteWithLyrics);
}

function onClickSelectAll() {
  EventBus.$emit(IpcMainChannels.FileMenuSelectAll);
}

function onClickPasteFormat() {
  EventBus.$emit(IpcMainChannels.FileMenuPasteFormat);
}

function onClickFind() {
  EventBus.$emit(IpcMainChannels.FileMenuFind);
}

function onClickPreviousTab() {
  EventBus.$emit(IpcMainChannels.FileMenuWindowPreviousTab);
}

function onClickNextTab() {
  EventBus.$emit(IpcMainChannels.FileMenuWindowNextTab);
}

function onTogglePaneClick(paneId: WorkspacePaneId, visible?: boolean) {
  EventBus.$emit(IpcMainChannels.FileMenuViewPaneVisibility, {
    paneId,
    visible,
  } as FileMenuViewPaneVisibilityArgs);
}

function onToggleStatusBarClick(visible?: boolean) {
  EventBus.$emit(IpcMainChannels.FileMenuViewStatusBarVisibility, {
    visible,
  } as FileMenuViewStatusBarVisibilityArgs);
}

function onResetPaneLayoutClick() {
  EventBus.$emit(IpcMainChannels.FileMenuViewResetPaneLayout);
}

function emitViewZoom(args: FileMenuViewZoomArgs) {
  EventBus.$emit(IpcMainChannels.FileMenuViewZoom, args);
}

function onZoomInClick() {
  emitViewZoom({ type: 'zoom-in' });
}

function onZoomOutClick() {
  emitViewZoom({ type: 'zoom-out' });
}

function onActualSizeZoomClick() {
  emitViewZoom({ type: 'actual-size' });
}

function onZoomFitModeClick(mode: ZoomFitMode) {
  emitViewZoom({ type: 'fit', mode });
}

function onClickPreferences() {
  EventBus.$emit(IpcMainChannels.FileMenuPreferences);
}

function onClickUndo() {
  EventBus.$emit(IpcMainChannels.FileMenuUndo);
}

function onClickRedo() {
  EventBus.$emit(IpcMainChannels.FileMenuRedo);
}

function onClickAddTextBox() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox, {
    inline: false,
  } as FileMenuInsertTextboxArgs);
}

function onClickAddRichTextBox() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertRichTextBox);
}

function onClickAddInlineTextBox() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox, {
    inline: true,
  } as FileMenuInsertTextboxArgs);
}

function onClickAddModeKey() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertModeKey);
}

function onClickAddAlternateLine() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertAlternateLine);
}

function onClickAddAnnotation() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertAnnotation);
}

function onClickAddDropCapBefore() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertDropCapBefore);
}

function onClickAddDropCapAfter() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertDropCapAfter);
}

function onClickAddImage() {
  imageFileSelector.value!.click();
}

function onClickAddHeader() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertHeader);
}

function onClickAddFooter() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertFooter);
}

function onClickCopyElementLink() {
  EventBus.$emit(IpcMainChannels.FileMenuEditCopyElementLink);
}

function onClickAbout() {
  EventBus.$emit(IpcMainChannels.OpenAboutDialog);
}

function onClickGuide() {
  window.open(import.meta.env.VITE_GUIDE_URL, '_blank');
}

function onClickRequestFeature() {
  window.open(import.meta.env.VITE_ISSUES_URL, '_blank');
}

function onClickReportIssue() {
  window.open(import.meta.env.VITE_ISSUES_URL, '_blank');
}
</script>
