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
      <!-- <FileMenuItem label="Staff Text" @click="onClickAddStaffText" /> -->
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
    if (
      confirm(
        'This will discard your current score. Make sure you have saved before doing this. Are you sure you wish to continue?',
      )
    ) {
      store.mutations.setScore(new Score());
      store.mutations.setSelectedElement(null);
      this.$emit('scoreUpdated');
    }
  }

  onClickOpen() {
    this.fileSelector.click();
  }

  onClickSave() {
    const content = JSON.stringify(
      SaveService.SaveScoreToJson(this.score),
      null,
      2,
    );
    const contentType = 'text/plain';

    var a = document.createElement('a');
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = 'score.json';
    a.click();
  }

  onSelectFile() {
    const files = this.fileSelector.files!;

    if (files.length > 0) {
      var file = files[0];
      var reader = new FileReader();

      reader.onload = () => {
        // TODO validate file contents
        const score: Score = SaveService.LoadScoreFromJson(
          JSON.parse(reader.result as string),
        );

        // if (score.version !== ScoreVersion) {
        //   alert('This score was created by an older version of the application. It may not work properly');
        // }

        store.mutations.setScore(score);
        store.mutations.setSelectedElement(null);

        this.$emit('scoreUpdated');

        // Reset the selector so that if the user selects
        // the same file twice, it will load
        this.fileSelector.value = '';
      };

      reader.readAsText(file);
    }
  }

  onClickAddNeume() {
    store.getters.elements.splice(
      store.getters.selectedElementIndex,
      0,
      new EmptyElement(),
    );
    this.$emit('scoreUpdated');
  }

  onClickAddTextBox() {
    store.getters.elements.splice(
      store.getters.selectedElementIndex,
      0,
      new TextBoxElement(),
    );
    this.$emit('scoreUpdated');
  }

  onClickAddModeKey() {
    store.getters.elements.splice(
      store.getters.selectedElementIndex,
      0,
      new ModeKeyElement(),
    );
    this.$emit('scoreUpdated');
  }

  onClickAddStaffText() {
    const element = new StaffTextElement();
    store.getters.elements.splice(
      store.getters.selectedElementIndex,
      0,
      element,
    );
    store.mutations.setSelectedElement(element);
    store.mutations.setElementToFocus(element);
    this.$emit('scoreUpdated');
  }

  onClickAddDropCap() {
    const element = new DropCapElement();
    store.getters.elements.splice(
      store.getters.selectedElementIndex,
      0,
      element,
    );
    store.mutations.setSelectedElement(element);
    store.mutations.setElementToFocus(element);
    this.$emit('scoreUpdated');
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
