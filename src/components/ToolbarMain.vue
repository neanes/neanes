<template>
  <div class="main-toolbar">
    <button
      class="entry-mode-btn"
      :class="{ on: entryMode === EntryMode.Auto }"
      @click="$emit('update:entryMode', EntryMode.Auto)"
    >
      {{ $t(($) => $.toolbar.main.auto, { ns: 'toolbar' }) }}
    </button>
    <button
      class="entry-mode-btn"
      :class="{ on: entryMode === EntryMode.Insert }"
      @click="$emit('update:entryMode', EntryMode.Insert)"
    >
      {{ $t(($) => $.toolbar.main.insert, { ns: 'toolbar' }) }}
    </button>
    <button
      class="entry-mode-btn"
      :class="{ on: entryMode === EntryMode.Edit }"
      @click="$emit('update:entryMode', EntryMode.Edit)"
    >
      {{ $t(($) => $.toolbar.main.single, { ns: 'toolbar' }) }}
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
    <ButtonWithMenu
      direction="down"
      :options="tempoOptions"
      :title="tempoTooltip"
      img-size="28px"
      @select="$emit('add-tempo', $event)"
    />
    <span class="space"></span>
    <button
      :title="$t(($) => $.toolbar.main.insertDropCapBefore, { ns: 'toolbar' })"
      class="icon-btn"
      @click="$emit('add-drop-cap')"
    >
      <img src="@/assets/icons/drop-cap.svg" width="24" height="24" />
    </button>
    <button
      :title="$t(($) => $.toolbar.main.insertTextBox, { ns: 'toolbar' })"
      class="icon-btn"
      @click="$emit('add-text-box')"
    >
      <img src="@/assets/icons/text-box.svg" width="24" height="24" />
    </button>
    <button
      :title="$t(($) => $.toolbar.main.insertTextBoxRich, { ns: 'toolbar' })"
      class="icon-btn"
      @click="$emit('add-text-box-rich')"
    >
      <img src="@/assets/icons/text-box-rich.svg" width="24" height="24" />
    </button>
    <button
      :title="$t(($) => $.toolbar.main.insertModeKey, { ns: 'toolbar' })"
      class="icon-btn"
      @click="$emit('add-mode-key')"
    >
      <img src="@/assets/icons/mode-key.svg" width="24" height="24" />
    </button>
    <button
      :title="$t(($) => $.toolbar.main.insertImage, { ns: 'toolbar' })"
      class="icon-btn"
      @click="$emit('add-image')"
    >
      <img src="@/assets/icons/image-add.svg" width="24" height="24" />
    </button>
    <span class="space"></span>
    <button
      class="icon-btn line-break-btn"
      :title="
        $t(($) => $.toolbar.main.insertOrRemoveLineBreakAfterSelectedElement, {
          ns: 'toolbar',
        })
      "
      @click="$emit('toggle-line-break', LineBreakType.Left)"
    >
      <img src="@/assets/icons/line-break.svg" width="24" height="24" />
    </button>
    <button
      class="icon-btn line-break-btn"
      :title="
        $t(
          ($) =>
            $.toolbar.main.insertOrRemoveJustifiedLineBreakAfterSelectedElement,
          {
            ns: 'toolbar',
          },
        )
      "
      @click="$emit('toggle-line-break', LineBreakType.Justify)"
    >
      <img src="@/assets/icons/line-break-justify.svg" width="24" height="24" />
    </button>
    <button
      class="icon-btn line-break-btn"
      :title="
        $t(
          ($) =>
            $.toolbar.main.insertOrRemoveCenteredLineBreakAfterSelectedElement,
          {
            ns: 'toolbar',
          },
        )
      "
      @click="$emit('toggle-line-break', LineBreakType.Center)"
    >
      <img src="@/assets/icons/line-break-center.svg" width="24" height="24" />
    </button>
    <button
      class="icon-btn"
      :title="
        $t(($) => $.toolbar.main.insertOrRemovePageBreakAfterSelectedElement, {
          ns: 'toolbar',
        })
      "
      @click="$emit('toggle-page-break')"
    >
      <img src="@/assets/icons/page-break.svg" width="24" height="24" />
    </button>
    <span class="space"></span>
    <button
      class="red icon-btn"
      :title="
        $t(($) => $.toolbar.main.deleteSelectedElement, { ns: 'toolbar' })
      "
      @click="$emit('delete-selected-element')"
    >
      <img src="@/assets/icons/delete.svg" width="24" height="24" />
    </button>
    <span class="space"></span>
    <div class="zoom-container" tabindex="-1" @focusout="showZoomMenu = false">
      <input
        class="zoom"
        :value="zoomDisplay"
        @change="updateZoom(($event.target as HTMLInputElement).value)"
      />
      <span class="zoom-arrow" @click="showZoomMenu = !showZoomMenu"
        >&#x25BE;</span
      >
      <div v-if="showZoomMenu" class="zoom-menu">
        <div class="zoom-menu-item" @click="updateZoom('Fit')">
          {{ $t(($) => $.toolbar.main.fit, { ns: 'toolbar' }) }}
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
      <label class="right-space">{{
        $t(($) => $.toolbar.main.speed, { ns: 'toolbar' })
      }}</label>
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
        :model-value="audioOptions.speed"
        :disabled="audioState === AudioState.Playing"
        @update:model-value="$emit('update:audioOptionsSpeed', $event)"
      />
      <span>%</span>
    </div>
    <span class="space"></span>
    <span class="space"></span>
    <div class="page-number-container">
      {{
        $t(($) => $.toolbar.main.pageNumber, {
          ns: 'toolbar',
          currentPageNumber,
          pageCount,
        })
      }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, getCurrentInstance, PropType, ref } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import { LineBreakType } from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import { TempoSign } from '@/models/Neumes';
import { AudioState } from '@/services/audio/AudioService';
import { PlaybackOptions } from '@/services/audio/PlaybackService';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';

import ButtonWithMenu, { ButtonWithMenuOption } from './ButtonWithMenu.vue';

const tempoOptions: ButtonWithMenuOption[] = [
  {
    neume: TempoSign.VerySlow,
    icon: new URL('@/assets/icons/agogi-poli-argi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Slower,
    icon: new URL('@/assets/icons/agogi-argoteri.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Slow,
    icon: new URL('@/assets/icons/agogi-argi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Moderate,
    icon: new URL('@/assets/icons/agogi-metria.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Medium,
    icon: new URL('@/assets/icons/agogi-mesi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Quick,
    icon: new URL('@/assets/icons/agogi-gorgi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Quicker,
    icon: new URL('@/assets/icons/agogi-gorgoteri.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.VeryQuick,
    icon: new URL('@/assets/icons/agogi-poli-gorgi.svg', import.meta.url).href,
  },
];

const props = defineProps({
  entryMode: {
    type: String as PropType<EntryMode>,
    required: true,
  },
  audioState: {
    type: String as PropType<AudioState>,
    required: true,
  },
  audioOptions: {
    type: Object as PropType<PlaybackOptions>,
    required: true,
  },
  neumeKeyboard: {
    type: Object as PropType<NeumeKeyboard>,
    required: true,
  },
  zoom: {
    type: Number,
    required: true,
  },
  zoomToFit: {
    type: Boolean,
    required: true,
  },
  currentPageNumber: {
    type: Number,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
  },
  playbackTime: {
    type: Number,
    required: true,
  },
  playbackBpm: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits([
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
]);

const { t } = useTranslation();
const instance = getCurrentInstance();
const showZoomMenu = ref(false);
const zoomOptions = ['50', '75', '90', '100', '125', '150', '200', '500'];

const zoomDisplay = computed(() =>
  props.zoomToFit ? 'Fit' : (props.zoom * 100).toFixed(0) + '%',
);

const playbackTimeDisplay = computed(() => {
  // Round to the nearest tenth to eliminate floating point errors
  // E.g. 4.999999... should give 0:00:05:0, instead of 0:00:04:0
  const roundedTime = Math.round(props.playbackTime * 10) / 10;

  const hours = Math.floor(roundedTime / 3600);
  const minutes = Math.floor((roundedTime % 3600) / 60);
  const seconds = Math.floor(roundedTime % 60);
  const tenths = roundedTime.toFixed(1).split('.')[1];

  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${tenths}`;
});

const playbackBpmDisplay = computed(() => props.playbackBpm.toFixed(0));

const martyriaTooltip = computed(
  () =>
    `${t(($) => $.toolbar.main.martyria, { ns: 'toolbar' })} (${props.neumeKeyboard.getMartyriaKeyTooltip()})`,
);

const tempoTooltip = computed(
  () =>
    `${t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' })} (${props.neumeKeyboard.generateTooltip(
      props.neumeKeyboard.findMappingForNeume(TempoSign.VerySlow)!,
    )})`,
);

function updateZoom(value: string) {
  showZoomMenu.value = false;

  if (value === 'Fit') {
    emit('update:zoomToFit', true);
    return;
  }

  let valueAsNumber = parseInt(value);

  if (Number.isNaN(valueAsNumber)) {
    valueAsNumber = 100;
  }

  emit('update:zoom', valueAsNumber / 100);

  showZoomMenu.value = false;

  instance?.proxy?.$forceUpdate();
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
