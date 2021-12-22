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
      label="Add"
      @click="toggleMenu"
      @mouseenter="selectedMenu = 'Add'"
      :isOpen="isMenuOpen && selectedMenu === 'Add'"
    >
      <FileMenuItem label="Neume" @click="onClickAddNeume" />
      <FileMenuItem label="Text Box" @click="onClickAddTextBox" />
      <FileMenuItem label="Mode Key" @click="onClickAddModeKey" />
      <FileMenuItem label="Drop Cap" @click="onClickAddDropCap" />
    </FileMenuBarItem>
    <input ref="file" type="file" v-show="false" @change="onSelectFile" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import FileMenuBarItem from '@/components/FileMenuBarItem.vue';
import FileMenuItem from '@/components/FileMenuItem.vue';
import { Score } from '@/models/Score';
import {
  TextBoxElement,
  StaffTextElement,
  EmptyElement,
  DropCapElement,
  ModeKeyElement,
} from '@/models/Element';
import { SaveService } from '@/services/SaveService';
import { store } from '@/store';
import { EventBus } from '@/eventBus';
import { IpcMainChannels, IpcRendererChannels } from '@/ipc/ipcChannels';

@Component({
  components: {
    FileMenuBarItem,
    FileMenuItem,
  },
})
export default class FileMenuBar extends Vue {
  private isMenuOpen = false;
  private selectedMenu = '';

  private get score() {
    return store.state.score;
  }

  private get fileSelector() {
    return this.$refs.file as HTMLInputElement;
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  onClickNew() {
    EventBus.$emit(IpcMainChannels.FileMenuNewScore);
  }

  onClickOpen() {
    this.fileSelector.click();
  }

  onClickSave() {
    EventBus.$emit(IpcMainChannels.FileMenuSaveAs);

    EventBus.$once(IpcRendererChannels.FileMenuSaveAsReply, (data: string) => {
      const contentType = 'text/plain';

      var a = document.createElement('a');
      var file = new Blob([data], { type: contentType });
      a.href = URL.createObjectURL(file);
      a.download = 'score.json';
      a.click();
    });
  }

  onSelectFile() {
    const files = this.fileSelector.files!;

    if (files.length > 0) {
      var file = files[0];
      var reader = new FileReader();

      reader.onload = () => {
        EventBus.$emit(
          IpcMainChannels.FileMenuOpenScore,
          reader.result as string,
        );

        // Reset the selector so that if the user selects
        // the same file twice, it will load
        this.fileSelector.value = '';
      };

      reader.readAsText(file);
    }
  }

  onClickAddNeume() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertNeume);
  }

  onClickAddTextBox() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertTextBox);
  }

  onClickAddModeKey() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertModeKey);
  }

  onClickAddDropCap() {
    EventBus.$emit(IpcMainChannels.FileMenuInsertDropCap);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.file-menu-bar {
  display: flex;
  background-color: #aaa;
}
</style>
