<template>
  <div class="file-menu-bar" tabindex="-1" @focusout="isMenuOpen = false">
    <FileMenuBarItem
      :label="$t(($) => $.menu.file.root, { ns: 'menu' })"
      :is-open="isMenuOpen && selectedMenu === 'File'"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'File'"
    >
      <FileMenuItem
        :label="$t(($) => $.menu.file.new, { ns: 'menu' })"
        @click="onClickNew"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.file.open, { ns: 'menu' })"
        @click="onClickOpen"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.file.save, { ns: 'menu' })"
        @click="onClickSave"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.file.pageSetup, { ns: 'menu' })"
        @click="onClickPageSetup"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.file.exportAsHtml, { ns: 'menu' })"
        @click="onClickExportAsHtml"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.file.exportAsMusicXml, { ns: 'menu' })"
        @click="onClickExportAsMusicXml"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.file.exportAsLatex, { ns: 'menu' })"
        @click="onClickExportAsLatex"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.file.close, { ns: 'menu' })"
        @click="onClickClose"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.file.closeOthers, { ns: 'menu' })"
        @click="onClickCloseOthers"
      />
    </FileMenuBarItem>
    <FileMenuBarItem
      :label="$t(($) => $.menu.edit.root, { ns: 'menu' })"
      :is-open="isMenuOpen && selectedMenu === 'Edit'"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Edit'"
    >
      <FileMenuItem
        :label="$t(($) => $.menu.edit.undo, { ns: 'menu' })"
        @click="onClickUndo"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.redo, { ns: 'menu' })"
        @click="onClickRedo"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.cut, { ns: 'menu' })"
        @click="onClickCut"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.copy, { ns: 'menu' })"
        @click="onClickCopy"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.copyAsHtml, { ns: 'menu' })"
        @click="onClickCopyAsHtml"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.paste, { ns: 'menu' })"
        @click="onClickPaste"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.pasteWithLyrics, { ns: 'menu' })"
        @click="onClickPasteWithLyrics"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.copyFormat, { ns: 'menu' })"
        @click="onClickCopyFormat"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.pasteFormat, { ns: 'menu' })"
        @click="onClickPasteFormat"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.find, { ns: 'menu' })"
        @click="onClickFind"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.lyrics, { ns: 'menu' })"
        @click="onClickLyrics"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.edit.preferences, { ns: 'menu' })"
        @click="onClickPreferences"
      />
    </FileMenuBarItem>
    <FileMenuBarItem
      :label="$t(($) => $.menu.insert.root, { ns: 'menu' })"
      :is-open="isMenuOpen && selectedMenu === 'Insert'"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Insert'"
    >
      <FileMenuItem
        :label="$t(($) => $.menu.insert.alternateLine, { ns: 'menu' })"
        @click="onClickAddAlternateLine"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.annotation, { ns: 'menu' })"
        @click="onClickAddAnnotation"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.dropCapBefore, { ns: 'menu' })"
        @click="onClickAddDropCapBefore"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.dropCapAfter, { ns: 'menu' })"
        @click="onClickAddDropCapAfter"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.textBox, { ns: 'menu' })"
        @click="onClickAddTextBox"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.richTextBox, { ns: 'menu' })"
        @click="onClickAddRichTextBox"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.inlineTextBox, { ns: 'menu' })"
        @click="onClickAddInlineTextBox"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.modeKey, { ns: 'menu' })"
        @click="onClickAddModeKey"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.image, { ns: 'menu' })"
        @click="onClickAddImage"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.header, { ns: 'menu' })"
        @click="onClickAddHeader"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.insert.footer, { ns: 'menu' })"
        @click="onClickAddFooter"
      />
    </FileMenuBarItem>
    <FileMenuBarItem
      :label="$t(($) => $.menu.help.root, { ns: 'menu' })"
      :is-open="isMenuOpen && selectedMenu === 'Help'"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Help'"
    >
      <FileMenuItem
        :label="$t(($) => $.menu.help.guide, { ns: 'menu' })"
        @click="onClickGuide"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.help.requestAFeature, { ns: 'menu' })"
        @click="onClickRequestFeature"
      />
      <FileMenuItem
        :label="$t(($) => $.menu.help.reportAnIssue, { ns: 'menu' })"
        @click="onClickReportIssue"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.menu.help.about, { ns: 'menu' })"
        @click="onClickAbout"
      />
    </FileMenuBarItem>
    <div v-if="!isChrome" class="browser-warning">
      {{ $t(($) => $.menu.warning, { ns: 'menu' }) }}
    </div>
    <input
      v-show="false"
      ref="file"
      type="file"
      :accept="accept"
      @change="onSelectFile"
    />
    <input
      v-show="false"
      ref="imagefile"
      type="file"
      :accept="acceptImage"
      @change="onSelectImageFile"
    />
  </div>
</template>

<script setup lang="ts">
import JSZip from 'jszip';
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import FileMenuBarItem from '@/components/FileMenuBarItem.vue';
import FileMenuItem from '@/components/FileMenuItem.vue';
import { EventBus } from '@/eventBus';
import {
  CloseWorkspacesArgs,
  CloseWorkspacesDisposition,
  FileMenuInsertTextboxArgs,
  FileMenuOpenImageArgs,
  FileMenuOpenScoreArgs,
  IpcMainChannels,
  IpcRendererChannels,
} from '@/ipc/ipcChannels';

const fileSelector = useTemplateRef<HTMLInputElement>('file');
const imageFileSelector = useTemplateRef<HTMLInputElement>('imagefile');

const isMenuOpen = ref(false);
const selectedMenu = ref('');
const accept = '.byz,.byzx';
const acceptImage = '.bmp,.jpg,.jpeg,.jpe,.png,.gif,.svg,.webp,.ico';
const isChrome = (window as any).chrome != null;

onMounted(() => {
  // If using the browser, then we need to hook into the key down
  // to listen for Ctrl+O for open, Ctrl+S for save, etc.
  window.addEventListener('keydown', onKeyDown);

  EventBus.$on(IpcRendererChannels.OpenImageDialog, onClickAddImage);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  EventBus.$off(IpcRendererChannels.OpenImageDialog, onClickAddImage);
});

function onKeyDown(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey) {
    if (event.code === 'KeyO') {
      onClickOpen();
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
    }
  }
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function onClickNew() {
  EventBus.$emit(IpcMainChannels.FileMenuNewScore);
  isMenuOpen.value = false;
}

function onClickOpen() {
  fileSelector.value!.click();
  isMenuOpen.value = false;
}

function onClickSave() {
  EventBus.$emit(IpcMainChannels.FileMenuSaveAs);
  isMenuOpen.value = false;
}

function onClickExportAsHtml() {
  EventBus.$emit(IpcMainChannels.FileMenuExportAsHtml);
  isMenuOpen.value = false;
}

function onClickExportAsMusicXml() {
  EventBus.$emit(IpcMainChannels.FileMenuExportAsMusicXml);
  isMenuOpen.value = false;
}

function onClickExportAsLatex() {
  EventBus.$emit(IpcMainChannels.FileMenuExportAsLatex);
  isMenuOpen.value = false;
}

function onClickPageSetup() {
  EventBus.$emit(IpcMainChannels.FileMenuPageSetup);
  isMenuOpen.value = false;
}

function onClickClose() {
  EventBus.$emit(IpcMainChannels.CloseWorkspaces, {
    disposition: CloseWorkspacesDisposition.SELF,
  } as CloseWorkspacesArgs);
  isMenuOpen.value = false;
}

function onClickCloseOthers() {
  EventBus.$emit(IpcMainChannels.CloseWorkspaces, {
    disposition: CloseWorkspacesDisposition.OTHERS,
  } as CloseWorkspacesArgs);
  isMenuOpen.value = false;
}

async function onSelectFile() {
  const files = fileSelector.value!.files!;

  if (files.length > 0) {
    const file = files[0];

    if (file.name.endsWith('.byz')) {
      const zip = await JSZip.loadAsync(file);
      const data = await zip.file(/\.(byzx)$/)[0].async('text');

      EventBus.$emit(IpcMainChannels.FileMenuOpenScore, {
        data,
        filePath: file.name,
        success: true,
      } as FileMenuOpenScoreArgs);

      // Reset the selector so that if the user selects
      // the same file twice, it will load
      fileSelector.value!.value = '';
    } else {
      const reader = new FileReader();

      reader.onload = () => {
        EventBus.$emit(IpcMainChannels.FileMenuOpenScore, {
          data: reader.result as string,
          filePath: file.name,
          success: true,
        } as FileMenuOpenScoreArgs);

        // Reset the selector so that if the user selects
        // the same file twice, it will load
        fileSelector.value!.value = '';
      };

      reader.readAsText(file);
    }
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

function onClickCut() {
  EventBus.$emit(IpcMainChannels.FileMenuCut);
  isMenuOpen.value = false;
}

function onClickCopy() {
  EventBus.$emit(IpcMainChannels.FileMenuCopy);
  isMenuOpen.value = false;
}

function onClickCopyAsHtml() {
  EventBus.$emit(IpcMainChannels.FileMenuCopyAsHtml);
  isMenuOpen.value = false;
}

function onClickCopyFormat() {
  EventBus.$emit(IpcMainChannels.FileMenuCopyFormat);
  isMenuOpen.value = false;
}

function onClickPaste() {
  EventBus.$emit(IpcMainChannels.FileMenuPaste);
  isMenuOpen.value = false;
}

function onClickPasteWithLyrics() {
  EventBus.$emit(IpcMainChannels.FileMenuPasteWithLyrics);
  isMenuOpen.value = false;
}

function onClickPasteFormat() {
  EventBus.$emit(IpcMainChannels.FileMenuPasteFormat);
  isMenuOpen.value = false;
}

function onClickFind() {
  EventBus.$emit(IpcMainChannels.FileMenuFind);
  isMenuOpen.value = false;
}

function onClickLyrics() {
  EventBus.$emit(IpcMainChannels.FileMenuLyrics);
  isMenuOpen.value = false;
}

function onClickPreferences() {
  EventBus.$emit(IpcMainChannels.FileMenuPreferences);
  isMenuOpen.value = false;
}

function onClickUndo() {
  EventBus.$emit(IpcMainChannels.FileMenuUndo);
  isMenuOpen.value = false;
}

function onClickRedo() {
  EventBus.$emit(IpcMainChannels.FileMenuRedo);
  isMenuOpen.value = false;
}

function onClickAddTextBox() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox, {
    inline: false,
  } as FileMenuInsertTextboxArgs);
  isMenuOpen.value = false;
}

function onClickAddRichTextBox() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertRichTextBox);
  isMenuOpen.value = false;
}

function onClickAddInlineTextBox() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox, {
    inline: true,
  } as FileMenuInsertTextboxArgs);
  isMenuOpen.value = false;
}

function onClickAddModeKey() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertModeKey);
  isMenuOpen.value = false;
}

function onClickAddAlternateLine() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertAlternateLine);
  isMenuOpen.value = false;
}

function onClickAddAnnotation() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertAnnotation);
  isMenuOpen.value = false;
}

function onClickAddDropCapBefore() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertDropCapBefore);
  isMenuOpen.value = false;
}

function onClickAddDropCapAfter() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertDropCapAfter);
  isMenuOpen.value = false;
}

function onClickAddImage() {
  imageFileSelector.value!.click();
  isMenuOpen.value = false;
}

function onClickAddHeader() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertHeader);
  isMenuOpen.value = false;
}

function onClickAddFooter() {
  EventBus.$emit(IpcMainChannels.FileMenuInsertFooter);
  isMenuOpen.value = false;
}

function onClickAbout() {
  alert(`Neanes\nVersion: ${APP_VERSION}`);
  isMenuOpen.value = false;
}

function onClickGuide() {
  window.open(import.meta.env.VITE_GUIDE_URL, '_blank');
  isMenuOpen.value = false;
}

function onClickRequestFeature() {
  window.open(import.meta.env.VITE_ISSUES_URL, '_blank');
  isMenuOpen.value = false;
}

function onClickReportIssue() {
  window.open(import.meta.env.VITE_ISSUES_URL, '_blank');
  isMenuOpen.value = false;
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.file-menu-bar {
  display: flex;
  background-color: #aaa;

  user-select: none;

  align-items: center;
}

.separator {
  margin: 0 10px;
  border-top: 1px solid #999;
}

.browser-warning {
  color: red;
}
</style>
