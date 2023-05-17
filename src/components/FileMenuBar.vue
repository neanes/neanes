<template>
  <div class="file-menu-bar" @focusout="isMenuOpen = false" tabindex="-1">
    <FileMenuBarItem
      label="File"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'File'"
      :isOpen="isMenuOpen && selectedMenu === 'File'"
    >
      <FileMenuItem label="New" @click="onClickNew" />
      <FileMenuItem label="Open" @click="onClickOpen" />
      <FileMenuItem label="Save" @click="onClickSave" />
      <div class="separator" />
      <FileMenuItem label="Page Setup" @click="onClickPageSetup" />
      <FileMenuItem label="Export as HTML" @click="onClickExportAsHtml" />
    </FileMenuBarItem>
    <FileMenuBarItem
      label="Edit"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Edit'"
      :isOpen="isMenuOpen && selectedMenu === 'Edit'"
    >
      <FileMenuItem label="Undo" @click="onClickUndo" />
      <FileMenuItem label="Redo" @click="onClickRedo" />
      <div class="separator" />
      <FileMenuItem label="Cut" @click="onClickCut" />
      <FileMenuItem label="Copy" @click="onClickCopy" />
      <FileMenuItem label="Copy as HTML" @click="onClickCopyAsHtml" />
      <FileMenuItem label="Paste" @click="onClickPaste" />
      <FileMenuItem label="Paste with lyrics" @click="onClickPasteWithLyrics" />
      <div class="separator" />
      <FileMenuItem label="Preferences" @click="onClickPreferences" />
    </FileMenuBarItem>
    <FileMenuBarItem
      label="Insert"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Insert'"
      :isOpen="isMenuOpen && selectedMenu === 'Insert'"
    >
      <FileMenuItem label="Drop Cap Before" @click="onClickAddDropCapBefore" />
      <FileMenuItem label="Drop Cap After" @click="onClickAddDropCapAfter" />
      <FileMenuItem label="Text Box" @click="onClickAddTextBox" />
      <FileMenuItem label="Inline Text Box" @click="onClickAddInlineTextBox" />
      <FileMenuItem label="Mode Key" @click="onClickAddModeKey" />
      <FileMenuItem label="Image" @click="onClickAddImage" />
      <div class="separator" />
      <FileMenuItem label="Header" @click="onClickAddHeader" />
      <FileMenuItem label="Footer" @click="onClickAddFooter" />
    </FileMenuBarItem>
    <FileMenuBarItem
      label="Help"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Help'"
      :isOpen="isMenuOpen && selectedMenu === 'Help'"
    >
      <FileMenuItem label="Guide" @click="onClickGuide" />
      <div class="separator" />
      <FileMenuItem label="Request a Feature" @click="onClickRequestFeature" />
      <FileMenuItem label="Report an Issue" @click="onClickReportIssue" />
      <div class="separator" />
      <FileMenuItem label="About" @click="onClickAbout" />
    </FileMenuBarItem>
    <div class="browser-warning" v-if="!isChrome">
      Warning: This application works best in Chromium-based browsers. You may
      experience reduced functionality or errors in non-Chromium-based browsers.
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
import { Component, Vue } from 'vue-property-decorator';
import FileMenuBarItem from '@/components/FileMenuBarItem.vue';
import FileMenuItem from '@/components/FileMenuItem.vue';
import { EventBus } from '@/eventBus';
import {
  FileMenuInsertTextboxArgs,
  FileMenuOpenImageArgs,
  FileMenuOpenScoreArgs,
  IpcMainChannels,
  IpcRendererChannels,
} from '@/ipc/ipcChannels';
import JSZip from 'jszip';

@Component({
  components: {
    FileMenuBarItem,
    FileMenuItem,
  },
})
export default class FileMenuBar extends Vue {
  private isMenuOpen = false;
  private selectedMenu = '';
  private accept = '.byz,.byzx';
  private acceptImage = '.bmp,.jpg,.jpeg,.jpe,.png,.gif,.svg,.webp,.ico';
  private isChrome = (window as any).chrome != null;

  private get fileSelector() {
    return this.$refs.file as HTMLInputElement;
  }

  private get imageFileSelector() {
    return this.$refs.imagefile as HTMLInputElement;
  }

  mounted() {
    // If using the browser, then we need to hook into the key down
    // to listen for Ctrl+O for oven, Ctrl+S for save, etc.
    window.addEventListener('keydown', this.onKeyDown);

    EventBus.$on(IpcRendererChannels.OpenImageDialog, this.onClickAddImage);
  }

  beforeDestroy() {
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

  onClickPageSetup() {
    EventBus.$emit(IpcMainChannels.FileMenuPageSetup);
    this.isMenuOpen = false;
  }

  async onSelectFile() {
    const files = this.fileSelector.files!;

    if (files.length > 0) {
      var file = files[0];

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
        var reader = new FileReader();

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
      var file = files[0];

      var reader = new FileReader();

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

  onClickPaste() {
    EventBus.$emit(IpcMainChannels.FileMenuPaste);
    this.isMenuOpen = false;
  }

  onClickPasteWithLyrics() {
    EventBus.$emit(IpcMainChannels.FileMenuPasteWithLyrics);
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
    alert(`Neanes\nVersion: ${process.env.VUE_APP_VERSION}`);
    this.isMenuOpen = false;
  }

  onClickGuide() {
    window.open(process.env.VUE_APP_GUIDE_URL, '_blank');
    this.isMenuOpen = false;
  }

  onClickRequestFeature() {
    window.open(process.env.VUE_APP_ISSUES_URL, '_blank');
    this.isMenuOpen = false;
  }

  onClickReportIssue() {
    window.open(process.env.VUE_APP_ISSUES_URL, '_blank');
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
