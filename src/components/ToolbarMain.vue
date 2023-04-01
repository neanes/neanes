<template>
  <div class="main-toolbar">
    <button
      class="entry-mode-btn"
      @click="$emit('update:entryMode', EntryMode.Auto)"
      :class="{ on: entryMode === EntryMode.Auto }"
    >
      Auto
    </button>
    <button
      class="entry-mode-btn"
      @click="$emit('update:entryMode', EntryMode.Insert)"
      :class="{ on: entryMode === EntryMode.Insert }"
    >
      Insert
    </button>
    <button
      class="entry-mode-btn"
      @click="$emit('update:entryMode', EntryMode.Edit)"
      :class="{ on: entryMode === EntryMode.Edit }"
    >
      Single
    </button>
    <span class="space"></span>
    <button
      title="Insert martyria"
      class="neume-button martyria"
      @click="$emit('add-auto-martyria')"
    >
      <img src="@/assets/icons/martyria.svg" />
    </button>
    <span class="space"></span>
    <div
      class="tempo-container"
      @mousedown="openTempoMenu"
      @mouseleave="selectedTempoNeume = null"
    >
      <button class="neume-button">
        <img draggable="false" src="@/assets/icons/agogi-poli-argi.svg" />
      </button>
      <div class="tempo-menu" v-if="showTempoMenu">
        <div
          class="tempo-menu-item"
          @mouseenter="selectedTempoNeume = TempoSign.VerySlow"
        >
          <img draggable="false" src="@/assets/icons/agogi-poli-argi.svg" />
        </div>
        <div
          class="tempo-menu-item"
          @mouseenter="selectedTempoNeume = TempoSign.Slower"
        >
          <img draggable="false" src="@/assets/icons/agogi-argoteri.svg" />
        </div>
        <div
          class="tempo-menu-item"
          @mouseenter="selectedTempoNeume = TempoSign.Slow"
        >
          <img draggable="false" src="@/assets/icons/agogi-argi.svg" />
        </div>
        <div
          class="tempo-menu-item"
          @mouseenter="selectedTempoNeume = TempoSign.Moderate"
        >
          <img draggable="false" src="@/assets/icons/agogi-metria.svg" />
        </div>
        <div
          class="tempo-menu-item"
          @mouseenter="selectedTempoNeume = TempoSign.Medium"
        >
          <img draggable="false" src="@/assets/icons/agogi-mesi.svg" />
        </div>
        <div
          class="tempo-menu-item"
          @mouseenter="selectedTempoNeume = TempoSign.Quick"
        >
          <img draggable="false" src="@/assets/icons/agogi-gorgi.svg" />
        </div>

        <div
          class="tempo-menu-item"
          @mouseenter="selectedTempoNeume = TempoSign.Quicker"
        >
          <img draggable="false" src="@/assets/icons/agogi-gorgoteri.svg" />
        </div>
        <div
          class="tempo-menu-item"
          @mouseenter="selectedTempoNeume = TempoSign.VeryQuick"
        >
          <img draggable="false" src="@/assets/icons/agogi-poli-gorgi.svg" />
        </div>
      </div>
    </div>
    <span class="space"></span>
    <button
      title="Insert drop cap before"
      class="icon-btn"
      @click="$emit('add-drop-cap')"
    >
      <img src="@/assets/icons/drop-cap.svg" width="24" height="24" />
    </button>
    <button title="Insert image" class="icon-btn" @click="$emit('add-image')">
      <img src="@/assets/icons/image-add.svg" width="24" height="24" />
    </button>
    <span class="space"></span>
    <button
      class="icon-btn line-break-btn"
      title="Insert or remove line break after selected element"
      @click="$emit('toggle-line-break', LineBreakType.Left)"
    >
      <img src="@/assets/icons/line-break.svg" width="24" height="24" />
    </button>
    <button
      class="icon-btn line-break-btn"
      title="Insert or remove justified line break after selected element"
      @click="$emit('toggle-line-break', LineBreakType.Justify)"
    >
      <img src="@/assets/icons/line-break-justify.svg" width="24" height="24" />
    </button>
    <button
      class="icon-btn line-break-btn"
      title="Insert or remove centered line break after selected element"
      @click="$emit('toggle-line-break', LineBreakType.Center)"
    >
      <img src="@/assets/icons/line-break-center.svg" width="24" height="24" />
    </button>
    <button
      class="icon-btn"
      title="Insert or remove page break after selected element"
      @click="$emit('toggle-page-break')"
    >
      <img src="@/assets/icons/page-break.svg" width="24" height="24" />
    </button>
    <span class="space"></span>
    <button
      class="red icon-btn"
      title="Delete selected element"
      @click="$emit('delete-selected-element')"
    >
      <img src="@/assets/icons/delete.svg" width="24" height="24" />
    </button>
    <span class="space"></span>
    <div class="zoom-container" @focusout="showZoomMenu = false" tabindex="-1">
      <input
        class="zoom"
        :value="zoomDisplay"
        @change="updateZoom($event.target.value)"
      />
      <span class="zoom-arrow" @click="showZoomMenu = !showZoomMenu"
        >&#x25BE;</span
      >
      <div class="zoom-menu" v-if="showZoomMenu">
        <div class="zoom-menu-item" @click="updateZoom('Fit')">Fit</div>
        <div class="zoom-menu-separator"></div>
        <div
          v-for="option in zoomOptions"
          :key="option"
          class="zoom-menu-item"
          @click="updateZoom(option)"
        >
          {{ option }}%
        </div>
      </div>
    </div>
    <span class="space" />
    <span class="space" />
    <div class="audio-container">
      <button class="icon-btn" @click="$emit('play-audio')">
        <img
          v-if="audioState === AudioState.Playing"
          src="@/assets/icons/audio-pause.svg"
          width="24"
          height="24"
        />
        <img
          v-else
          src="@/assets/icons/audio-play.svg"
          width="24"
          height="24"
        />
      </button>
      <button class="icon-btn config" @click="$emit('open-playback-settings')">
        <img src="@/assets/icons/config.svg" width="32" height="32" />
      </button>
      <span class="space" />
      <label class="right-space">Speed</label>
      <select
        class="audio-speed"
        :value="audioOptions.speed"
        :disabled="audioState === AudioState.Playing"
        @change="$emit('update:audioOptionsSpeed', $event.target.value)"
      >
        <option value="0.25">0.25x</option>
        <option value="0.5">0.5x</option>
        <option value="0.75">0.75x</option>
        <option value="1">1x</option>
        <option value="1.25">1.25x</option>
        <option value="1.5">1.5x</option>
        <option value="1.75">1.75x</option>
        <option value="2">2x</option>
      </select>
    </div>
    <span class="space"></span>
    <span class="space"></span>
    <div class="page-number-container">
      Page {{ currentPageNumber }} of {{ pageCount }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { Note, RootSign, TempoSign } from '@/models/Neumes';
import Neume from './Neume.vue';
import { EntryMode } from '@/models/EntryMode';
import { AudioState } from '@/services/audio/AudioService';
import { PlaybackOptions } from '@/services/audio/PlaybackService';
import { LineBreakType } from '@/models/Element';

@Component({
  components: {
    Neume,
  },
})
export default class ToolbarMain extends Vue {
  @Prop() entryMode!: EntryMode;
  @Prop() zoom!: number;
  @Prop() zoomToFit!: boolean;
  @Prop() currentPageNumber!: Number;
  @Prop() pageCount!: Number;
  @Prop() audioState!: AudioState;
  @Prop() audioOptions!: PlaybackOptions;
  Note = Note;
  RootSign = RootSign;
  TempoSign = TempoSign;
  EntryMode = EntryMode;
  AudioState = AudioState;
  LineBreakType = LineBreakType;

  showZoomMenu: boolean = false;
  showTempoMenu: boolean = false;

  selectedTempoNeume: TempoSign | null = null;

  zoomOptions: number[] = [50, 75, 90, 100, 125, 150, 200];

  get zoomDisplay() {
    return this.zoomToFit ? 'Fit' : (this.zoom * 100).toFixed(0) + '%';
  }

  get playButtonSrc() {
    return this.audioState === AudioState.Playing
      ? '@/assets/icons/audio-play.svg'
      : '@/assets/icons/audio-play.svg';
  }

  beforeDestroy() {
    window.removeEventListener('mouseup', this.onTempoMouseUp);
  }

  updateZoom(value: string) {
    this.showZoomMenu = false;

    if (value === 'Fit') {
      this.$emit('update:zoomToFit', true);
      return;
    }

    let valueAsNumber = parseInt(value);

    if (Number.isNaN(valueAsNumber)) {
      valueAsNumber = 100;
    }

    this.$emit('update:zoom', valueAsNumber / 100);

    this.showZoomMenu = false;

    this.$forceUpdate();
  }

  openTempoMenu() {
    this.showTempoMenu = true;
    window.addEventListener('mouseup', this.onTempoMouseUp);
  }

  onTempoMouseUp() {
    if (this.selectedTempoNeume) {
      this.$emit('add-tempo', this.selectedTempoNeume);
    }

    this.showTempoMenu = false;

    window.removeEventListener('mouseup', this.onTempoMouseUp);
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

  --btn-size: 32px;
}

.entry-mode-btn.on {
  background-color: var(--btn-color-selected);
}

.red {
  color: red;
}

.neume {
  font-size: 25px;
}

.icon-btn {
  height: var(--btn-size);
  width: var(--btn-size);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
}

.neume-button {
  height: var(--btn-size);
  width: var(--btn-size);

  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  overflow: hidden;

  user-select: none;
}

.space {
  width: 16px;
}

.zoom {
  width: 40px;
  padding: 1px 2px;
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
  font-size: 13px;
  cursor: default;
  width: 38px;
}

.zoom-menu-item:hover {
  background-color: aliceblue;
}

.zoom-menu-separator {
  border-top: 1px solid #666;
}

.tempo-container {
  display: flex;
}

.tempo-container img {
  height: 28px;
  width: 28px;
}

.tempo-menu {
  position: absolute;
  z-index: 999;
  background-color: white;
  border: 1px solid black;
  box-sizing: border-box;
  width: var(--btn-size);
}

.tempo-menu-item {
  height: var(--btn-size);
  width: 100%;
  padding: 2px 0;
  box-sizing: border-box;
  text-align: center;
  user-select: none;
  overflow: hidden;
  position: relative;
}

.tempo-menu-item:hover {
  background-color: aliceblue;
}

label.right-space {
  margin-right: 0.5rem;
}

.audio-container {
  display: flex;
  align-items: center;
}

.audio-speed {
  width: 3.5rem;
}
</style>
