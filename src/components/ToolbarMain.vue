<template>
  <Toolbar class="main-toolbar h-auto w-full gap-0 border-0 p-1" loop>
    <ToolbarToggleGroup
      type="single"
      :model-value="entryMode"
      @update:model-value="onEntryModeChanged"
    >
      <ToolbarToggleItem class="entry-mode-btn" :value="EntryMode.Auto">
        {{ $t(($) => $.toolbar.main.auto, { ns: 'toolbar' }) }}
      </ToolbarToggleItem>
      <ToolbarToggleItem class="entry-mode-btn" :value="EntryMode.Insert">
        {{ $t(($) => $.toolbar.main.insert, { ns: 'toolbar' }) }}
      </ToolbarToggleItem>
      <ToolbarToggleItem class="entry-mode-btn" :value="EntryMode.Edit">
        {{ $t(($) => $.toolbar.main.single, { ns: 'toolbar' }) }}
      </ToolbarToggleItem>
    </ToolbarToggleGroup>
    <span class="space"></span>
    <AppTooltip :tooltip="martyriaTooltip">
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="neume-button"
        @click="$emit('add-auto-martyria')"
      >
        <img src="@/assets/icons/martyria.svg" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <ButtonWithMenu
      direction="down"
      :options="tempoOptions"
      :tooltip="tempoTooltip"
      img-size="28px"
      @select="$emit('add-tempo', $event)"
    />
    <ToolbarSeparator />
    <AppTooltip
      :tooltip="
        $t(($) => $.toolbar.main.insertDropCapBefore, { ns: 'toolbar' })
      "
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('add-drop-cap')"
      >
        <img src="@/assets/icons/drop-cap.svg" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.main.insertTextBox, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('add-text-box')"
      >
        <img src="@/assets/icons/text-box.svg" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.main.insertTextBoxRich, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('add-text-box-rich')"
      >
        <img src="@/assets/icons/text-box-rich.svg" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.main.insertModeKey, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('add-mode-key')"
      >
        <img src="@/assets/icons/mode-key.svg" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.main.insertImage, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('add-image')"
      >
        <img src="@/assets/icons/image-add.svg" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <AppTooltip
      :tooltip="
        $t(($) => $.toolbar.main.insertOrRemoveLineBreakAfterSelectedElement, {
          ns: 'toolbar',
        })
      "
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('toggle-line-break', LineBreakType.Left)"
      >
        <img src="@/assets/icons/line-break.svg" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="
        $t(
          ($) =>
            $.toolbar.main.insertOrRemoveJustifiedLineBreakAfterSelectedElement,
          {
            ns: 'toolbar',
          },
        )
      "
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('toggle-line-break', LineBreakType.Justify)"
      >
        <img src="@/assets/icons/line-break-justify.svg" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="
        $t(
          ($) =>
            $.toolbar.main.insertOrRemoveCenteredLineBreakAfterSelectedElement,
          {
            ns: 'toolbar',
          },
        )
      "
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('toggle-line-break', LineBreakType.Center)"
      >
        <img src="@/assets/icons/line-break-center.svg" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="
        $t(($) => $.toolbar.main.insertOrRemovePageBreakAfterSelectedElement, {
          ns: 'toolbar',
        })
      "
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('toggle-page-break')"
      >
        <img src="@/assets/icons/page-break.svg" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <AppTooltip
      :tooltip="
        $t(($) => $.toolbar.main.deleteSelectedElement, { ns: 'toolbar' })
      "
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        @click="$emit('delete-selected-element')"
      >
        <img src="@/assets/icons/delete.svg" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <div class="zoom-container" tabindex="-1" @focusout="showZoomMenu = false">
      <Input
        v-model="zoomText"
        class="w-20 bg-background"
        @change="updateZoom(zoomText)"
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
    <ToolbarSeparator />
    <div class="audio-container">
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn"
        :aria-label="
          audioState === AudioState.Playing ? 'Pause audio' : 'Play audio'
        "
        @click="$emit('play-audio')"
      >
        <img
          v-if="audioState === AudioState.Playing"
          src="@/assets/icons/audio-pause.svg"
        />
        <img v-else src="@/assets/icons/audio-play.svg" />
      </ToolbarButton>
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="icon-btn icon-btn-full"
        aria-label="Playback settings"
        @click="$emit('open-playback-settings')"
      >
        <img src="@/assets/icons/config.svg" />
      </ToolbarButton>
      <ToolbarSeparator />

      <span class="playback-time">{{ playbackTimeDisplay }}</span>
      <ToolbarSeparator />
      <span class="label-bpm">BPM = {{ playbackBpmDisplay }}</span>

      <ToolbarSeparator />
      <Label for="audio-speed-slider" class="mr-2">{{
        $t(($) => $.toolbar.main.speed, { ns: 'toolbar' })
      }}</Label>
      <Slider
        id="audio-speed-slider"
        class="m-0.5 w-16"
        :min="0.1"
        :max="3"
        :step="0.05"
        :disabled="audioState === AudioState.Playing"
        :model-value="[audioOptions.speed]"
        @update:model-value="onAudioOptionsSpeedChanged"
      />
      <InputUnit
        id="audio-speed-input"
        unit="percent"
        :min="10"
        :max="300"
        :step="1"
        :format-options="fraction0FormatOptions"
        :model-value="audioOptions.speed"
        :disabled="audioState === AudioState.Playing"
        @update:model-value="$emit('update:audioOptionsSpeed', $event)"
      />
      <span>%</span>
    </div>
    <ToolbarSeparator />
    <div class="page-number-container">
      {{
        $t(($) => $.toolbar.main.pageNumber, {
          ns: 'toolbar',
          currentPageNumber,
          pageCount,
        })
      }}
    </div>
  </Toolbar>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed, nextTick, ref, watch } from 'vue';

import type { AppTooltipValue } from '@/components/AppTooltip.types';
import AppTooltip from '@/components/AppTooltip.vue';
import InputUnit from '@/components/InputUnit.vue';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from '@/components/ui/toolbar';
import { LineBreakType } from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import { TempoSign } from '@/models/Neumes';
import { AudioState } from '@/services/audio/AudioService';
import type { PlaybackOptions } from '@/services/audio/PlaybackService';
import type { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { fraction0FormatOptions } from '@/utils/numberFormatOptions';

import type { ButtonWithMenuOption } from './ButtonWithMenu.types';
import ButtonWithMenu from './ButtonWithMenu.vue';

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
const showZoomMenu = ref(false);
const zoomText = ref('');
const zoomOptions = ['50', '75', '90', '100', '125', '150', '200', '500'];

const zoomDisplay = computed(() =>
  props.zoomToFit ? 'Fit' : (props.zoom * 100).toFixed(0) + '%',
);

// Keep the editable zoom field in sync with the canonical zoom display
// whenever the zoom changes (e.g. via the zoom menu or external controls).
watch(zoomDisplay, (value) => (zoomText.value = value), { immediate: true });

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

function onEntryModeChanged(value: AcceptableValue | AcceptableValue[]) {
  if (isEntryMode(value)) {
    emit('update:entryMode', value);
  }
}

function isEntryMode(
  value: AcceptableValue | AcceptableValue[],
): value is EntryMode {
  return (
    typeof value === 'string' &&
    Object.values(EntryMode).includes(value as EntryMode)
  );
}

function onAudioOptionsSpeedChanged(value: number[] | undefined) {
  emit('update:audioOptionsSpeed', value?.[0] ?? 0.1);
}

const martyriaTooltip = computed(
  (): AppTooltipValue => ({
    label: t(($) => $.toolbar.main.martyria, { ns: 'toolbar' }),
    shortcut: props.neumeKeyboard.getMartyriaKeyTooltipKeys(),
  }),
);

const tempoTooltip = computed(
  (): AppTooltipValue => ({
    label: t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' }),
    shortcut: props.neumeKeyboard.generateTooltipKeys(
      props.neumeKeyboard.findMappingForNeume(TempoSign.VerySlow)!,
    ),
  }),
);

function updateZoom(value: string) {
  showZoomMenu.value = false;

  if (value === 'Fit') {
    emit('update:zoomToFit', true);
    resetZoomInput();
    return;
  }

  let valueAsNumber = parseInt(value);

  if (Number.isNaN(valueAsNumber)) {
    valueAsNumber = 100;
  }

  emit('update:zoom', valueAsNumber / 100);

  showZoomMenu.value = false;
  resetZoomInput();
}

function resetZoomInput() {
  // Restore the canonical display after a commit. The watcher already handles
  // the case where the zoom actually changed; this covers the case where it
  // didn't (e.g. invalid input), where the watcher wouldn't fire.
  nextTick(() => {
    zoomText.value = zoomDisplay.value;
  });
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.main-toolbar {
  flex-wrap: wrap;
  font-size: 16px;
  background-color: var(--color-legacy-chrome-menu-surface);

  --btn-size: 32px;
}

.main-toolbar :deep(button:not(.entry-mode-btn)) {
  font-size: inherit;
  font-weight: normal;
}

.space {
  width: 16px;
}

.entry-mode-btn {
  all: revert;
}

.entry-mode-btn[data-state='on'] {
  background-color: var(--color-legacy-chrome-selected);
}

.icon-btn,
.neume-button,
:deep(.menu-container > .neume-button) {
  box-sizing: border-box;
  height: var(--btn-size);
  width: var(--btn-size);
  appearance: auto;
  background: revert;
  border: revert;
  border-radius: revert;
  box-shadow: revert;
  font-weight: revert;
  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
  outline: revert;
  padding: 0;
  transition: revert;
  user-select: none;
}

.icon-btn {
  --btn-icon-size: 24px;
}

.icon-btn-full {
  --btn-icon-size: var(--btn-size);
}

.icon-btn:hover,
.neume-button:hover,
:deep(.menu-container > .neume-button:hover) {
  background: revert;
}

.neume-button img,
:deep(.menu-container > .neume-button img) {
  height: var(--btn-size);
  max-width: none;
  width: var(--btn-size);
}

.icon-btn img {
  height: var(--btn-icon-size, var(--btn-size));
  max-width: none;
  width: var(--btn-icon-size, var(--btn-size));
}

.icon-btn[aria-disabled='true'],
.icon-btn:disabled,
.neume-button[aria-disabled='true'],
:deep(.menu-container > .neume-button:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
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
  z-index: 40;
  background-color: var(--color-legacy-chrome-surface);
  border: 1px solid var(--color-legacy-chrome-border);
}

.zoom-menu-item {
  padding: 1px 4px;
  font-size: 13px;
  cursor: default;
  width: 38px;
}

.zoom-menu-item:hover {
  background-color: var(--color-legacy-chrome-hover);
}

.zoom-menu-separator {
  border-top: 1px solid var(--color-legacy-chrome-divider);
}

.audio-container {
  display: flex;
  align-items: center;
}

.playback-time {
  width: 5rem;
}

.label-bpm {
  width: 5.5rem;
}
</style>
