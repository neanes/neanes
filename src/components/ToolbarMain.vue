<template>
  <div class="main-toolbar">
    <button
      class="entry-mode-btn"
      @click="$emit('update:entryMode', EntryMode.Auto)"
      :class="{ on: entryMode === EntryMode.Auto }"
    >
      {{ $t('toolbar:main.auto') }}
    </button>
    <button
      class="entry-mode-btn"
      @click="$emit('update:entryMode', EntryMode.Insert)"
      :class="{ on: entryMode === EntryMode.Insert }"
    >
      {{ $t('toolbar:main.insert') }}
    </button>
    <button
      class="entry-mode-btn"
      @click="$emit('update:entryMode', EntryMode.Edit)"
      :class="{ on: entryMode === EntryMode.Edit }"
    >
      {{ $t('toolbar:main.single') }}
    </button>
    <span class="space"></span>
    <button
      :title="martyriaTooltip"
      class="neume-button martyria"
      @click="$emit('add-auto-martyria')"
    >
      <img src="@/assets/icons/martyria.svg" />
    </button>
    <span class="space"></span>
    <div
      class="tempo-container"
      :title="tempoTooltip"
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
      :title="$t('toolbar:main.insertDropCapBefore')"
      class="icon-btn"
      @click="$emit('add-drop-cap')"
    >
      <img src="@/assets/icons/drop-cap.svg" width="24" height="24" />
    </button>
    <button
      :title="$t('toolbar:main.insertTextBox')"
      class="icon-btn"
      @click="$emit('add-text-box')"
    >
      <img src="@/assets/icons/text-box.svg" width="24" height="24" />
    </button>
    <button
      :title="$t('toolbar:main.insertTextBoxRich')"
      class="icon-btn"
      @click="$emit('add-text-box-rich')"
    >
      <img src="@/assets/icons/text-box-rich.svg" width="24" height="24" />
    </button>
    <button
      :title="$t('toolbar:main.insertModeKey')"
      class="icon-btn"
      @click="$emit('add-mode-key')"
    >
      <img src="@/assets/icons/mode-key.svg" width="24" height="24" />
    </button>
    <button
      :title="$t('toolbar:main.insertImage')"
      class="icon-btn"
      @click="$emit('add-image')"
    >
      <img src="@/assets/icons/image-add.svg" width="24" height="24" />
    </button>
    <span class="space"></span>
    <button
      class="icon-btn line-break-btn"
      :title="$t('toolbar:main.insertOrRemoveLineBreakAfterSelectedElement')"
      @click="$emit('toggle-line-break', LineBreakType.Left)"
    >
      <img src="@/assets/icons/line-break.svg" width="24" height="24" />
    </button>
    <button
      class="icon-btn line-break-btn"
      :title="
        $t('toolbar:main.insertOrRemoveJustifiedLineBreakAfterSelectedElement')
      "
      @click="$emit('toggle-line-break', LineBreakType.Justify)"
    >
      <img src="@/assets/icons/line-break-justify.svg" width="24" height="24" />
    </button>
    <button
      class="icon-btn line-break-btn"
      :title="
        $t('toolbar:main.insertOrRemoveCenteredLineBreakAfterSelectedElement')
      "
      @click="$emit('toggle-line-break', LineBreakType.Center)"
    >
      <img src="@/assets/icons/line-break-center.svg" width="24" height="24" />
    </button>
    <button
      class="icon-btn"
      :title="$t('toolbar:main.insertOrRemovePageBreakAfterSelectedElement')"
      @click="$emit('toggle-page-break')"
    >
      <img src="@/assets/icons/page-break.svg" width="24" height="24" />
    </button>
    <span class="space"></span>
    <button
      class="red icon-btn"
      :title="$t('toolbar:main.deleteSelectedElement')"
      @click="$emit('delete-selected-element')"
    >
      <img src="@/assets/icons/delete.svg" width="24" height="24" />
    </button>
    <span class="space"></span>
    <div class="zoom-container" @focusout="showZoomMenu = false" tabindex="-1">
      <input
        class="zoom"
        :value="zoomDisplay"
        @change="updateZoom(($event.target as HTMLInputElement).value)"
      />
      <span class="zoom-arrow" @click="showZoomMenu = !showZoomMenu"
        >&#x25BE;</span
      >
      <div class="zoom-menu" v-if="showZoomMenu">
        <div class="zoom-menu-item" @click="updateZoom('Fit')">
          {{ $t('toolbar:main.fit') }}
        </div>
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
      <span class="divider"></span>

      <span class="playback-time">{{ playbackTimeDisplay }}</span>
      <span class="space" />
      <span class="label-bpm">BPM = {{ playbackBpmDisplay }}</span>

      <span class="space" />
      <label class="right-space">{{ $t('toolbar:main.speed') }}</label>
      <input
        class="audio-speed-slider"
        type="range"
        min=".1"
        max="3"
        step=".05"
        :disabled="audioState === AudioState.Playing"
        :value="audioOptions.speed"
        @input="
          $emit(
            'update:audioOptionsSpeed',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <InputUnit
        class="audio-speed"
        unit="percent"
        :min="10"
        :max="300"
        :step="1"
        :precision="0"
        :modelValue="audioOptions.speed"
        :disabled="audioState === AudioState.Playing"
        @update:modelValue="$emit('update:audioOptionsSpeed', $event)"
      />
      <span>%</span>
    </div>
    <span class="space"></span>
    <span class="space"></span>
    <div class="page-number-container">
      {{ $t('toolbar:main.pageNumber', { currentPageNumber, pageCount }) }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import InputUnit from '@/components/InputUnit.vue';
import { LineBreakType } from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import { Note, RootSign, TempoSign } from '@/models/Neumes';
import { AudioState } from '@/services/audio/AudioService';
import { PlaybackOptions } from '@/services/audio/PlaybackService';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';

import Neume from './NeumeGlyph.vue';

@Component({
  components: { InputUnit, Neume },
  emits: [
    'add-auto-martyria',
    'add-drop-cap',
    'add-image',
    'add-mode-key',
    'add-tempo',
    'add-text-box',
    'add-text-box-rich',
    'delete-selected-element',
    'open-playback-settings',
    'play-audio',
    'toggle-line-break',
    'toggle-page-break',
    'update:audioOptionsSpeed',
    'update:entryMode',
    'update:zoom',
    'update:zoomToFit',
  ],
})
export default class ToolbarMain extends Vue {
  @Prop() entryMode!: EntryMode;
  @Prop() zoom!: number;
  @Prop() zoomToFit!: boolean;
  @Prop() currentPageNumber!: number;
  @Prop() pageCount!: number;
  @Prop() audioState!: AudioState;
  @Prop() audioOptions!: PlaybackOptions;
  @Prop() neumeKeyboard!: NeumeKeyboard;
  @Prop() playbackTime!: number;
  @Prop() playbackBpm!: number;

  Note = Note;
  RootSign = RootSign;
  TempoSign = TempoSign;
  EntryMode = EntryMode;
  AudioState = AudioState;
  LineBreakType = LineBreakType;

  showTempoMenu: boolean = false;
  showZoomMenu: boolean = false;

  selectedTempoNeume: TempoSign | null = null;

  zoomOptions: string[] = ['50', '75', '90', '100', '125', '150', '200', '500'];

  get zoomDisplay() {
    return this.zoomToFit ? 'Fit' : (this.zoom * 100).toFixed(0) + '%';
  }

  get speedDisplay() {
    return (this.audioOptions.speed * 100).toFixed(0) + '%';
  }

  get playbackTimeDisplay() {
    // Round to the nearest tenth to eliminate floating point errors
    // E.g. 4.999999... should give 0:00:05:0, instead of 0:00:04:0
    const roundedTime = Math.round(this.playbackTime * 10) / 10;

    const hours = Math.floor(roundedTime / 3600);
    const minutes = Math.floor((roundedTime % 3600) / 60);
    const seconds = Math.floor(roundedTime % 60);
    const tenths = roundedTime.toFixed(1).split('.')[1];

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${tenths}`;
  }

  get playbackBpmDisplay() {
    return this.playbackBpm.toFixed(0);
  }

  get martyriaTooltip() {
    return `${this.$t(
      'toolbar:main.martyria',
    )} (${this.neumeKeyboard.getMartyriaKeyTooltip()})`;
  }

  get tempoTooltip() {
    return `${this.$t(
      'toolbar:common.tempoSign',
    )} (${this.neumeKeyboard.generateTooltip(
      this.neumeKeyboard.findMappingForNeume(TempoSign.VerySlow)!,
    )})`;
  }

  beforeUnmount() {
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

.divider {
  height: 32px;
  border-right: 1px solid #666;
  margin: 0 0.5rem;
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
  width: 2.5rem;
}

.audio-speed-slider {
  width: 58px;
}

.playback-time {
  width: 5rem;
}

.label-bpm {
  width: 5.5rem;
}
</style>
