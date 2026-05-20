<template>
  <div class="file-menu-bar" tabindex="-1" @focusout="isMenuOpen = false">
    <FileMenuBarItem
      :label="$t(($) => $.file.root, { ns: 'menu' })"
      :is-open="isMenuOpen && selectedMenu === 'File'"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'File'"
    >
      <FileMenuItem
        :label="$t(($) => $.file.new, { ns: 'menu' })"
        @click="onClickNew"
      />
      <FileMenuItem
        :label="$t(($) => $.file.open, { ns: 'menu' })"
        @click="onClickOpen"
      />
      <FileMenuItem
        :label="$t(($) => $.file.save, { ns: 'menu' })"
        @click="onClickSave"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.file.pageSetup, { ns: 'menu' })"
        @click="onClickPageSetup"
      />
      <FileMenuItem
        :label="$t(($) => $.file.exportAsHtml, { ns: 'menu' })"
        @click="onClickExportAsHtml"
      />
      <FileMenuItem
        :label="$t(($) => $.file.exportAsMusicXml, { ns: 'menu' })"
        @click="onClickExportAsMusicXml"
      />
      <FileMenuItem
        :label="$t(($) => $.file.exportAsLatex, { ns: 'menu' })"
        @click="onClickExportAsLatex"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.file.close, { ns: 'menu' })"
        @click="onClickClose"
      />
      <FileMenuItem
        :label="$t(($) => $.file.closeOthers, { ns: 'menu' })"
        @click="onClickCloseOthers"
      />
    </FileMenuBarItem>
    <FileMenuBarItem
      :label="$t(($) => $.edit.root, { ns: 'menu' })"
      :is-open="isMenuOpen && selectedMenu === 'Edit'"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Edit'"
    >
      <FileMenuItem
        :label="$t(($) => $.edit.undo, { ns: 'menu' })"
        @click="onClickUndo"
      />
      <FileMenuItem
        :label="$t(($) => $.edit.redo, { ns: 'menu' })"
        @click="onClickRedo"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.edit.cut, { ns: 'menu' })"
        @click="onClickCut"
      />
      <FileMenuItem
        :label="$t(($) => $.edit.copy, { ns: 'menu' })"
        @click="onClickCopy"
      />
      <FileMenuItem
        :label="$t(($) => $.edit.copyAsHtml, { ns: 'menu' })"
        @click="onClickCopyAsHtml"
      />
      <FileMenuItem
        :label="$t(($) => $.edit.paste, { ns: 'menu' })"
        @click="onClickPaste"
      />
      <FileMenuItem
        :label="$t(($) => $.edit.pasteWithLyrics, { ns: 'menu' })"
        @click="onClickPasteWithLyrics"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.edit.copyFormat, { ns: 'menu' })"
        @click="onClickCopyFormat"
      />
      <FileMenuItem
        :label="$t(($) => $.edit.pasteFormat, { ns: 'menu' })"
        @click="onClickPasteFormat"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.edit.find, { ns: 'menu' })"
        @click="onClickFind"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.edit.lyrics, { ns: 'menu' })"
        @click="onClickLyrics"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.edit.preferences, { ns: 'menu' })"
        @click="onClickPreferences"
      />
    </FileMenuBarItem>
    <FileMenuBarItem
      :label="$t(($) => $.insert.root, { ns: 'menu' })"
      :is-open="isMenuOpen && selectedMenu === 'Insert'"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Insert'"
    >
      <FileMenuItem
        :label="$t(($) => $.insert.alternateLine, { ns: 'menu' })"
        @click="onClickAddAlternateLine"
      />
      <FileMenuItem
        :label="$t(($) => $.insert.annotation, { ns: 'menu' })"
        @click="onClickAddAnnotation"
      />
      <FileMenuItem
        :label="$t(($) => $.insert.dropCapBefore, { ns: 'menu' })"
        @click="onClickAddDropCapBefore"
      />
      <FileMenuItem
        :label="$t(($) => $.insert.dropCapAfter, { ns: 'menu' })"
        @click="onClickAddDropCapAfter"
      />
      <FileMenuItem
        :label="$t(($) => $.insert.textBox, { ns: 'menu' })"
        @click="onClickAddTextBox"
      />
      <FileMenuItem
        :label="$t(($) => $.insert.richTextBox, { ns: 'menu' })"
        @click="onClickAddRichTextBox"
      />
      <FileMenuItem
        :label="$t(($) => $.insert.inlineTextBox, { ns: 'menu' })"
        @click="onClickAddInlineTextBox"
      />
      <FileMenuItem
        :label="$t(($) => $.insert.modeKey, { ns: 'menu' })"
        @click="onClickAddModeKey"
      />
      <FileMenuItem
        :label="$t(($) => $.insert.image, { ns: 'menu' })"
        @click="onClickAddImage"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.insert.header, { ns: 'menu' })"
        @click="onClickAddHeader"
      />
      <FileMenuItem
        :label="$t(($) => $.insert.footer, { ns: 'menu' })"
        @click="onClickAddFooter"
      />
    </FileMenuBarItem>
    <FileMenuBarItem
      :label="$t(($) => $.help.root, { ns: 'menu' })"
      :is-open="isMenuOpen && selectedMenu === 'Help'"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Help'"
    >
      <FileMenuItem
        :label="$t(($) => $.help.guide, { ns: 'menu' })"
        @click="onClickGuide"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.help.requestAFeature, { ns: 'menu' })"
        @click="onClickRequestFeature"
      />
      <FileMenuItem
        :label="$t(($) => $.help.reportAnIssue, { ns: 'menu' })"
        @click="onClickReportIssue"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t(($) => $.help.about, { ns: 'menu' })"
        @click="onClickAbout"
      />
    </FileMenuBarItem>
    <div v-if="!isChrome" class="browser-warning">
      {{ $t(($) => $.warning, { ns: 'menu' }) }}
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

<script lang="ts">
import JSZip from 'jszip';
import { defineComponent } from 'vue';

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

export default defineComponent({
  components: { FileMenuBarItem, FileMenuItem },
  props: {},
  emits: [],

  data() {
    return {
      isMenuOpen: false,
      selectedMenu: '',
      accept: '.byz,.byzx',
      acceptImage: '.bmp,.jpg,.jpeg,.jpe,.png,.gif,.svg,.webp,.ico',
      isChrome: (window as any).chrome != null,
    };
  },

  computed: {
    fileSelector() {
      return this.$refs.file as HTMLInputElement;
    },

    imageFileSelector() {
      return this.$refs.imagefile as HTMLInputElement;
    },
  },

  mounted() {
    // If using the browser, then we need to hook into the key down
    // to listen for Ctrl+O for oven, Ctrl+S for save, etc.
    window.addEventListener('keydown', this.onKeyDown);

    EventBus.$on(IpcRendererChannels.OpenImageDialog, this.onClickAddImage);
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
    EventBus.$off(IpcRendererChannels.OpenImageDialog, this.onClickAddImage);
  },

  methods: {
    onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey) {
        if (event.code === 'KeyO') {
          this.onClickOpen();
          event.preventDefault();
          return;
        } else if (event.code === 'KeyS') {
          this.onClickSave();
          event.preventDefault();
          return;
        } else if (event.code === 'KeyN') {
          // Note: this doesn't actually work in Chrome.
          // Chrome prevents you from capturing Ctrl+N.
          this.onClickNew();
          event.preventDefault();
          return;
        } else if (event.code === 'KeyD') {
          if (event.shiftKey) {
            this.onClickAddDropCapAfter();
          } else {
            this.onClickAddDropCapBefore();
          }
          event.preventDefault();
          return;
        } else if (event.shiftKey && event.code === 'KeyP') {
          this.onClickPageSetup();
          event.preventDefault();
          return;
        } else if (event.code === 'Comma') {
          this.onClickPreferences();
          event.preventDefault();
          return;
        }
      }
    },

    toggleMenu() {
      this.isMenuOpen = !this.isMenuOpen;
    },

    onClickNew() {
      EventBus.$emit(IpcMainChannels.FileMenuNewScore);
      this.isMenuOpen = false;
    },

    onClickOpen() {
      this.fileSelector.click();
      this.isMenuOpen = false;
    },

    onClickSave() {
      EventBus.$emit(IpcMainChannels.FileMenuSaveAs);
      this.isMenuOpen = false;
    },

    onClickExportAsHtml() {
      EventBus.$emit(IpcMainChannels.FileMenuExportAsHtml);
      this.isMenuOpen = false;
    },

    onClickExportAsMusicXml() {
      EventBus.$emit(IpcMainChannels.FileMenuExportAsMusicXml);
      this.isMenuOpen = false;
    },

    onClickExportAsLatex() {
      EventBus.$emit(IpcMainChannels.FileMenuExportAsLatex);
      this.isMenuOpen = false;
    },

    onClickPageSetup() {
      EventBus.$emit(IpcMainChannels.FileMenuPageSetup);
      this.isMenuOpen = false;
    },

    onClickClose() {
      EventBus.$emit(IpcMainChannels.CloseWorkspaces, {
        disposition: CloseWorkspacesDisposition.SELF,
      } as CloseWorkspacesArgs);
      this.isMenuOpen = false;
    },

    onClickCloseOthers() {
      EventBus.$emit(IpcMainChannels.CloseWorkspaces, {
        disposition: CloseWorkspacesDisposition.OTHERS,
      } as CloseWorkspacesArgs);
      this.isMenuOpen = false;
    },

    async onSelectFile() {
      const files = this.fileSelector.files!;

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
          this.fileSelector.value = '';
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
            this.fileSelector.value = '';
          };

          reader.readAsText(file);
        }
      }
    },

    async onSelectImageFile() {
      const files = this.imageFileSelector.files!;

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
          this.imageFileSelector.value = '';
        };

        reader.readAsDataURL(file);
      }
    },

    onClickCut() {
      EventBus.$emit(IpcMainChannels.FileMenuCut);
      this.isMenuOpen = false;
    },

    onClickCopy() {
      EventBus.$emit(IpcMainChannels.FileMenuCopy);
      this.isMenuOpen = false;
    },

    onClickCopyAsHtml() {
      EventBus.$emit(IpcMainChannels.FileMenuCopyAsHtml);
      this.isMenuOpen = false;
    },

    onClickCopyFormat() {
      EventBus.$emit(IpcMainChannels.FileMenuCopyFormat);
      this.isMenuOpen = false;
    },

    onClickPaste() {
      EventBus.$emit(IpcMainChannels.FileMenuPaste);
      this.isMenuOpen = false;
    },

    onClickPasteWithLyrics() {
      EventBus.$emit(IpcMainChannels.FileMenuPasteWithLyrics);
      this.isMenuOpen = false;
    },

    onClickPasteFormat() {
      EventBus.$emit(IpcMainChannels.FileMenuPasteFormat);
      this.isMenuOpen = false;
    },

    onClickFind() {
      EventBus.$emit(IpcMainChannels.FileMenuFind);
      this.isMenuOpen = false;
    },

    onClickLyrics() {
      EventBus.$emit(IpcMainChannels.FileMenuLyrics);
      this.isMenuOpen = false;
    },

    onClickPreferences() {
      EventBus.$emit(IpcMainChannels.FileMenuPreferences);
      this.isMenuOpen = false;
    },

    onClickUndo() {
      EventBus.$emit(IpcMainChannels.FileMenuUndo);
      this.isMenuOpen = false;
    },

    onClickRedo() {
      EventBus.$emit(IpcMainChannels.FileMenuRedo);
      this.isMenuOpen = false;
    },

    onClickAddTextBox() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox, {
        inline: false,
      } as FileMenuInsertTextboxArgs);
      this.isMenuOpen = false;
    },

    onClickAddRichTextBox() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertRichTextBox);
      this.isMenuOpen = false;
    },

    onClickAddInlineTextBox() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox, {
        inline: true,
      } as FileMenuInsertTextboxArgs);
      this.isMenuOpen = false;
    },

    onClickAddModeKey() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertModeKey);
      this.isMenuOpen = false;
    },

    onClickAddAlternateLine() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertAlternateLine);
      this.isMenuOpen = false;
    },

    onClickAddAnnotation() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertAnnotation);
      this.isMenuOpen = false;
    },

    onClickAddDropCapBefore() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertDropCapBefore);
      this.isMenuOpen = false;
    },

    onClickAddDropCapAfter() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertDropCapAfter);
      this.isMenuOpen = false;
    },

    onClickAddImage() {
      this.imageFileSelector.click();
      this.isMenuOpen = false;
    },

    onClickAddHeader() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertHeader);
      this.isMenuOpen = false;
    },

    onClickAddFooter() {
      EventBus.$emit(IpcMainChannels.FileMenuInsertFooter);
      this.isMenuOpen = false;
    },

    onClickAbout() {
      alert(`Neanes\nVersion: ${APP_VERSION}`);
      this.isMenuOpen = false;
    },

    onClickGuide() {
      window.open(import.meta.env.VITE_GUIDE_URL, '_blank');
      this.isMenuOpen = false;
    },

    onClickRequestFeature() {
      window.open(import.meta.env.VITE_ISSUES_URL, '_blank');
      this.isMenuOpen = false;
    },

    onClickReportIssue() {
      window.open(import.meta.env.VITE_ISSUES_URL, '_blank');
      this.isMenuOpen = false;
    },
  },
});
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
