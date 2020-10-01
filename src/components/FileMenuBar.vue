<template>
  <div class="file-menu-bar">
    <FileMenuBarItem label="File">
      <FileMenuItem label="New" @click="onClickNew" />
      <FileMenuItem label="Open" @click="onClickOpen" />
      <FileMenuItem label="Save" @click="onClickSave" />
    </FileMenuBarItem>
    <FileMenuBarItem label="Edit"></FileMenuBarItem>
    <input ref="file" type="file" v-show="false" @change="onSelectFile">
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import FileMenuBarItem from '@/components/FileMenuBarItem.vue';
import FileMenuItem from '@/components/FileMenuItem.vue';
import { Score } from '@/models/Score';
import { store, mutations } from '@/store';

@Component({
  components: {
    FileMenuBarItem,
    FileMenuItem,
  }
})
export default class FileMenuBar extends Vue {
  private get score() {
    return store.score;
  }

  private get fileSelector() {
    return this.$refs.file as HTMLInputElement;
  }

  onClickNew() {
    if (confirm('This will discard your current score. Make sure you have saved before doing this. Are you sure you wish to continue?')) {
      mutations.setScore(new Score());
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
        const score = JSON.parse(reader.result as string);
        mutations.setScore(score);
      };

      reader.readAsText(file);
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .file-menu-bar {
    display: flex;
  }
</style>
