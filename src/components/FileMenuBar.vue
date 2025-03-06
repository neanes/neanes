<template>
  <div class="file-menu-bar" @focusout="isMenuOpen = false" tabindex="-1">
    <FileMenuBarItem
      :label="$t('menu:file.root')"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'File'"
      :isOpen="isMenuOpen && selectedMenu === 'File'"
    >
      <FileMenuItem :label="$t('menu:file.new')" @click="onClickNew" />
      <FileMenuItem :label="$t('menu:file.open')" @click="onClickOpen" />
      <FileMenuItem :label="$t('menu:file.save')" @click="onClickSave" />
      <div class="separator" />
      <FileMenuItem
        :label="$t('menu:file.pageSetup')"
        @click="onClickPageSetup"
      />
      <FileMenuItem
        :label="$t('menu:file.exportAsHtml')"
        @click="onClickExportAsHtml"
      />
      <FileMenuItem
        :label="$t('menu:file.exportAsMusicXml')"
        @click="onClickExportAsMusicXml"
      />
      <div class="separator" />
      <FileMenuItem :label="$t('menu:file.close')" @click="onClickClose" />
      <FileMenuItem
        :label="$t('menu:file.closeOthers')"
        @click="onClickCloseOthers"
      />
    </FileMenuBarItem>
    <FileMenuBarItem
      :label="$t('menu:edit.root')"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Edit'"
      :isOpen="isMenuOpen && selectedMenu === 'Edit'"
    >
      <FileMenuItem :label="$t('menu:edit.undo')" @click="onClickUndo" />
      <FileMenuItem :label="$t('menu:edit.redo')" @click="onClickRedo" />
      <div class="separator" />
      <FileMenuItem :label="$t('menu:edit.cut')" @click="onClickCut" />
      <FileMenuItem :label="$t('menu:edit.copy')" @click="onClickCopy" />
      <FileMenuItem
        :label="$t('menu:edit.copyAsHtml')"
        @click="onClickCopyAsHtml"
      />
      <FileMenuItem :label="$t('menu:edit.paste')" @click="onClickPaste" />
      <FileMenuItem
        :label="$t('menu:edit.pasteWithLyrics')"
        @click="onClickPasteWithLyrics"
      />
      <div class="separator" />
      <FileMenuItem
        :label="$t('menu:edit.copyFormat')"
        @click="onClickCopyFormat"
      />
      <FileMenuItem
        :label="$t('menu:edit.pasteFormat')"
        @click="onClickPasteFormat"
      />
      <div class="separator" />
      <FileMenuItem :label="$t('menu:edit.find')" @click="onClickFind" />
      <div class="separator" />
      <FileMenuItem :label="$t('menu:edit.lyrics')" @click="onClickLyrics" />
      <div class="separator" />
      <FileMenuItem
        :label="$t('menu:edit.preferences')"
        @click="onClickPreferences"
      />
    </FileMenuBarItem>
    <FileMenuBarItem
      :label="$t('menu:insert.root')"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Insert'"
      :isOpen="isMenuOpen && selectedMenu === 'Insert'"
    >
      <FileMenuItem
        :label="$t('menu:insert.dropCapBefore')"
        @click="onClickAddDropCapBefore"
      />
      <FileMenuItem
        :label="$t('menu:insert.dropCapAfter')"
        @click="onClickAddDropCapAfter"
      />
      <FileMenuItem
        :label="$t('menu:insert.textBox')"
        @click="onClickAddTextBox"
      />
      <FileMenuItem
        :label="$t('menu:insert.richTextBox')"
        @click="onClickAddRichTextBox"
      />
      <FileMenuItem
        :label="$t('menu:insert.inlineTextBox')"
        @click="onClickAddInlineTextBox"
      />
      <FileMenuItem
        :label="$t('menu:insert.modeKey')"
        @click="onClickAddModeKey"
      />
      <FileMenuItem :label="$t('menu:insert.image')" @click="onClickAddImage" />
      <div class="separator" />
      <FileMenuItem
        :label="$t('menu:insert.header')"
        @click="onClickAddHeader"
      />
      <FileMenuItem
        :label="$t('menu:insert.footer')"
        @click="onClickAddFooter"
      />
    </FileMenuBarItem>
    <FileMenuBarItem
      :label="$t('menu:help.root')"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Help'"
      :isOpen="isMenuOpen && selectedMenu === 'Help'"
    >
      <FileMenuItem :label="$t('menu:help.guide')" @click="onClickGuide" />
      <div class="separator" />
      <FileMenuItem
        :label="$t('menu:help.requestAFeature')"
        @click="onClickRequestFeature"
      />
      <FileMenuItem
        :label="$t('menu:help.reportAnIssue')"
        @click="onClickReportIssue"
      />
      <div class="separator" />
      <FileMenuItem :label="$t('menu:help.about')" @click="onClickAbout" />
    </FileMenuBarItem>
    <div class="browser-warning" v-if="!isChrome">
      {{ $t('menu:warning') }}
    </div>
    <input
      ref="file"
      type="file"
      :accept="accept"
      v-show="false"
      @change="onSelectFile"
    />
    <input
      ref="imagefile"
      type="file"
      :accept="acceptImage"
      v-show="false"
      @change="onSelectImageFile"
    />
  </div>
</template>

<script lang="ts">
import JSZip from 'jszip';
import { Component, Vue } from 'vue-facing-decorator';

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

@Component({
  components: {
    FileMenuBarItem,
    FileMenuItem,
  },
})
export default class FileMenuBar extends Vue {
  isMenuOpen = false;
  selectedMenu = '';
  accept = '.byz,.byzx';
  acceptImage = '.bmp,.jpg,.jpeg,.jpe,.png,.gif,.svg,.webp,.ico';
  isChrome = (window as any).chrome != null;

  get fileSelector() {
    return this.$refs.file as HTMLInputElement;
  }

  get imageFileSelector() {
    return this.$refs.imagefile as HTMLInputElement;
  }

  mounted() {
    // If using the browser, then we need to hook into the key down
    // to listen for Ctrl+O for oven, Ctrl+S for save, etc.
    window.addEventListener('keydown', this.onKeyDown);

    EventBus.$on(IpcRendererChannels.OpenImageDialog, this.onClickAddImage);
  }

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
    EventBus.$off(IpcRendererChannels.OpenImageDialog, this.onClickAddImage);
  }

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
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onClickNew() {
    EventBus.$emit(IpcMainChannels.FileMenuNewScore);
    this.isMenuOpen = false;
  }

  onClickOpen() {
    this.fileSelector.click();
    this.isMenuOpen = false;
  }

  onClickSave() {
    EventBus.$emit(IpcMainChannels.FileMenuSaveAs);
    this.isMenuOpen = false;
  }

  onClickExportAsHtml() {
    EventBus.$emit(IpcMainChannels.FileMenuExportAsHtml);
    this.isMenuOpen = false;
  }

  onClickExportAsMusicXml() {
    EventBus.$emit(IpcMainChannels.FileMenuExportAsMusicXml);
    this.isMenuOpen = false;
  }

  onClickPageSetup() {
    EventBus.$emit(IpcMainChannels.FileMenuPageSetup);
    this.isMenuOpen = false;
  }

  onClickClose() {
    EventBus.$emit(IpcMainChannels.CloseWorkspaces, {
      disposition: CloseWorkspacesDisposition.SELF,
    } as CloseWorkspacesArgs);
    this.isMenuOpen = false;
  }

  onClickCloseOthers() {
    EventBus.$emit(IpcMainChannels.CloseWorkspaces, {
      disposition: CloseWorkspacesDisposition.OTHERS,
    } as CloseWorkspacesArgs);
    this.isMenuOpen = false;
  }

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
  }

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
        this.fileSelector.value = '';
      };

      reader.readAsDataURL(file);
    }
  }

  onClickCut() {
    EventBus.$emit(IpcMainChannels.FileMenuCut);
    this.isMenuOpen = false;
  }

  onClickCopy() {
    EventBus.$emit(IpcMainChannels.FileMenuCopy);
    this.isMenuOpen = false;
  }

  onClickCopyAsHtml() {
    EventBus.$emit(IpcMainChannels.FileMenuCopyAsHtml);
    this.isMenuOpen = false;
  }

  onClickCopyFormat() {
    EventBus.$emit(IpcMainChannels.FileMenuCopyFormat);
    this.isMenuOpen = false;
  }

  onClickPaste() {
    EventBus.$emit(IpcMainChannels.FileMenuPaste);
    this.isMenuOpen = false;
  }

  onClickPasteWithLyrics() {
    EventBus.$emit(IpcMainChannels.FileMenuPasteWithLyrics);
    this.isMenuOpen = false;
  }

  onClickPasteFormat() {
    EventBus.$emit(IpcMainChannels.FileMenuPasteFormat);
    this.isMenuOpen = false;
  }

  onClickFind() {
    EventBus.$emit(IpcMainChannels.FileMenuFind);
    this.isMenuOpen = false;
  }

  onClickLyrics() {
    EventBus.$emit(IpcMainChannels.FileMenuLyrics);
    this.isMenuOpen = false;
  }

  onClickPreferences() {
    EventBus.$emit(IpcMainChannels.FileMenuPreferences);
    this.isMenuOpen = false;
  }

  onClickUndo() {
    EventBus.$emit(IpcMainChannels.FileMenuUndo);
    this.isMenuOpen = false;
  }

  onClickRedo() {
    EventBus.$emit(IpcMainChannels.FileMenuRedo);
    this.isMenuOpen = false;
  }

  onClickAddTextBox() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox, {
      inline: false,
    } as FileMenuInsertTextboxArgs);
    this.isMenuOpen = false;
  }

  onClickAddRichTextBox() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertRichTextBox);
    this.isMenuOpen = false;
  }

  onClickAddInlineTextBox() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox, {
      inline: true,
    } as FileMenuInsertTextboxArgs);
    this.isMenuOpen = false;
  }

  onClickAddModeKey() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertModeKey);
    this.isMenuOpen = false;
  }

  onClickAddDropCapBefore() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertDropCapBefore);
    this.isMenuOpen = false;
  }

  onClickAddDropCapAfter() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertDropCapAfter);
    this.isMenuOpen = false;
  }

  onClickAddImage() {
    this.imageFileSelector.click();
    this.isMenuOpen = false;
  }

  onClickAddHeader() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertHeader);
    this.isMenuOpen = false;
  }

  onClickAddFooter() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertFooter);
    this.isMenuOpen = false;
  }

  onClickAbout() {
    alert(`Neanes\nVersion: ${APP_VERSION}`);
    this.isMenuOpen = false;
  }

  onClickGuide() {
    window.open(import.meta.env.VITE_GUIDE_URL, '_blank');
    this.isMenuOpen = false;
  }

  onClickRequestFeature() {
    window.open(import.meta.env.VITE_ISSUES_URL, '_blank');
    this.isMenuOpen = false;
  }

  onClickReportIssue() {
    window.open(import.meta.env.VITE_ISSUES_URL, '_blank');
    this.isMenuOpen = false;
  }
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
