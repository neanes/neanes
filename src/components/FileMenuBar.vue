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
    </FileMenuBarItem>
    <FileMenuBarItem label="Edit"></FileMenuBarItem>
    <FileMenuBarItem
      label="Insert"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Insert'"
      :isOpen="isMenuOpen && selectedMenu === 'Insert'"
    >
      <FileMenuItem label="Drop Cap" @click="onClickAddDropCap" />
      <FileMenuItem label="Text Box" @click="onClickAddTextBox" />
      <FileMenuItem label="Mode Key" @click="onClickAddModeKey" />
    </FileMenuBarItem>
    <input
      ref="file"
      type="file"
      :accept="accept"
      v-show="false"
      @change="onSelectFile"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import FileMenuBarItem from '@/components/FileMenuBarItem.vue';
import FileMenuItem from '@/components/FileMenuItem.vue';
import { EventBus } from '@/eventBus';
import {
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
  private isMenuOpen = false;
  private selectedMenu = '';
  private accept = '.byzx';

  private get fileSelector() {
    return this.$refs.file as HTMLInputElement;
  }

  mounted() {
    // If using the browser, then we need to hook into the key down
    // to listen for Ctrl+O for oven, Ctrl+S for save, etc.
    window.addEventListener('keydown', this.onKeyDown);
  }

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeyDown);
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

  onSelectFile() {
    const files = this.fileSelector.files!;

    if (files.length > 0) {
      var file = files[0];
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

  onClickAddTextBox() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox);
    this.isMenuOpen = false;
  }

  onClickAddModeKey() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertModeKey);
    this.isMenuOpen = false;
  }

  onClickAddDropCap() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertDropCap);
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
}
</style>
