<template>
  <div class="main-toolbar">
    <button
      class="entry-mode-btn"
      @click="$emit('updateEntryMode', EntryMode.Auto)"
      :class="{ on: entryMode === EntryMode.Auto }"
    >
      Auto
    </button>
    <button
      class="entry-mode-btn"
      @click="$emit('updateEntryMode', EntryMode.Insert)"
      :class="{ on: entryMode === EntryMode.Insert }"
    >
      Insert
    </button>
    <button
      class="entry-mode-btn"
      @click="$emit('updateEntryMode', EntryMode.Edit)"
      :class="{ on: entryMode === EntryMode.Edit }"
    >
      Single
    </button>
    <span class="space"></span>
    <button
      title="Insert Martyria"
      class="neume-button"
      @click="$emit('addAutoMartyria')"
    >
      <span class="martyria">
        <Neume class="red neume" :neume="Note.Pa" />
        <Neume class="red neume" :neume="RootSign.Alpha" />
      </span>
    </button>
    <span class="space"></span>
    <button
      class="neume-button"
      @click="$emit('add-tempo', TempoSign.VerySlow)"
    >
      <Neume class="red neume tempo" :neume="TempoSign.VerySlow" />
    </button>
    <button class="neume-button" @click="$emit('add-tempo', TempoSign.Slow)">
      <Neume class="red neume tempo" :neume="TempoSign.Slow" />
    </button>
    <button class="neume-button" @click="$emit('add-tempo', TempoSign.Medium)">
      <Neume class="red neume tempo" :neume="TempoSign.Medium" />
    </button>
    <button
      class="neume-button"
      @click="$emit('add-tempo', TempoSign.Moderate)"
    >
      <Neume class="red neume tempo" :neume="TempoSign.Moderate" />
    </button>
    <button class="neume-button" @click="$emit('add-tempo', TempoSign.Quick)">
      <Neume class="red neume tempo" :neume="TempoSign.Quick" />
    </button>
    <button
      class="neume-button"
      @click="$emit('add-tempo', TempoSign.VeryQuick)"
    >
      <Neume class="red neume tempo" :neume="TempoSign.VeryQuick" />
    </button>
    <span class="space"></span>
    <button
      class="icon-btn"
      title="Insert/Remove Line Break After Selected Element"
      @click="$emit('updateLineBreak')"
    >
      &#182;
    </button>
    <button
      class="page-break-btn icon-btn"
      title="Insert/Remove Page Break After Selected Element"
      @click="$emit('updatePageBreak')"
    >
      <img src="@/assets/pagebreak.svg" width="16" height="16" />
    </button>
    <span class="space"></span>
    <button
      class="red icon-btn"
      title="Delete Selected Element"
      @click="$emit('deleteSelectedElement')"
    >
      X
    </button>
    <span class="space"></span>
    <div class="zoom-container" @focusout="showZoomMenu = false" tabindex="-1">
      <input class="zoom" v-model.lazy="zoomDisplay" />
      <span class="zoom-arrow" @click="showZoomMenu = !showZoomMenu"
        >&#x25BE;</span
      >
      <div class="zoom-menu" v-if="showZoomMenu">
        <div
          v-for="option in zoomOptions"
          :key="option"
          class="zoom-menu-item"
          @click="
            zoomDisplay = option;
            showZoomMenu = false;
          "
        >
          {{ option }}%
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Note, RootSign, TempoSign } from '@/models/Neumes';
import Neume from './Neume.vue';
import { EntryMode } from './Editor.vue';

@Component({
  components: {
    Neume,
  },
})
export default class MainToolbar extends Vue {
  @Prop() entryMode!: EntryMode;
  @Prop() zoom!: number;
  Note = Note;
  RootSign = RootSign;
  TempoSign = TempoSign;
  EntryMode = EntryMode;

  showZoomMenu: boolean = false;

  zoomOptions: number[] = [50, 75, 90, 100, 125, 150, 200];

  get zoomDisplay() {
    return this.zoom * 100 + '%';
  }

  set zoomDisplay(value) {
    let valueAsNumber = Math.round(parseInt(value));

    if (Number.isNaN(valueAsNumber)) {
      valueAsNumber = 100;
    }

    if (valueAsNumber < 50) {
      valueAsNumber = 50;
    } else if (valueAsNumber > 200) {
      valueAsNumber = 200;
    }

    this.$emit('updateZoom', valueAsNumber / 100);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  background-color: lightgray;

  padding: 0.25rem;
}

.entry-mode-btn.on {
  background-color: lightsteelblue;
}

.red {
  color: red;
}

.neume {
  font-size: 25px;
}

.icon-btn {
  height: 32px;
  width: 32px;
}

.neume-button {
  height: 32px;
  width: 32px;

  position: relative;
}

.page-break-btn {
  display: flex;
  align-items: center;
}

.space {
  width: 16px;
}

.martyria {
  position: relative;

  top: -21px;
  left: -4px;
}

.tempo {
  top: -12px;
  left: -1px;
  font-size: 20px;
}

.zoom {
  width: 40px;
  padding: 1px 2px;
  font-family: 'Arial';
  font-size: 13px;
}

.zoom-container {
  position: relative;
}

.zoom-arrow {
  display: inline-block;
  cursor: default;
  height: 21px;
}

.zoom-menu {
  position: absolute;
  z-index: 999;
  background-color: white;
  border: 1px solid black;
}

.zoom-menu-item {
  padding: 1px 4px;
  font-family: 'Arial';
  font-size: 13px;
  cursor: default;
  width: 38px;
}

.zoom-menu-item:hover {
  background-color: aliceblue;
}
</style>
