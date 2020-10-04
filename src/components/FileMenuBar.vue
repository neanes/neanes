<template>
  <div class="file-menu-bar">
    <FileMenuBarItem label="File">
      <FileMenuItem label="New" @click="onClickNew" />
      <FileMenuItem label="Open" @click="onClickOpen" />
      <FileMenuItem label="Save" @click="onClickSave" />
    </FileMenuBarItem>
    <FileMenuBarItem label="Edit"></FileMenuBarItem>
    <FileMenuBarItem label="Add">
      <FileMenuItem label="Text Box" @click="onClickAddTextBox" />
      <FileMenuItem label="Staff Text" @click="onClickAddStaffText" />
    </FileMenuBarItem>
    <input ref="file" type="file" v-show="false" @change="onSelectFile">
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import FileMenuBarItem from '@/components/FileMenuBarItem.vue';
import FileMenuItem from '@/components/FileMenuItem.vue';
import { Score, ScoreVersion } from '@/models/Score';
import { TextBoxElement, StaffTextElement } from '@/models/Element';
import { store } from '@/store';

@Component({
  components: {
    FileMenuBarItem,
    FileMenuItem,
  }
})
export default class FileMenuBar extends Vue {
  private get score() {
    return store.state.score;
  }

  private get fileSelector() {
    return this.$refs.file as HTMLInputElement;
  }

  onClickNew() {
    if (confirm('This will discard your current score. Make sure you have saved before doing this. Are you sure you wish to continue?')) {
      store.mutations.setScore(new Score());
    }
  }

  onClickOpen() {
    this.fileSelector.click();
  }
  
  onClickSave() {
    const content = JSON.stringify(this.score, null, 2);
    const contentType = 'text/plain';

    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
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
        const score:Score = JSON.parse(reader.result as string);

        if (score.version !== ScoreVersion) {
          alert('This score was created by an older version of the application. It may not work properly');
        }

        store.mutations.setScore(score);
      };

      reader.readAsText(file);
    }
  }

  onClickAddTextBox() {
    store.getters.elements.splice(store.getters.selectedElementIndex, 0, new TextBoxElement());
  }

  onClickAddStaffText() {
    store.getters.elements.splice(store.getters.selectedElementIndex, 0, new StaffTextElement());
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .file-menu-bar {
    display: flex;
  }
</style>
