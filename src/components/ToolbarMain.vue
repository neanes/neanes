<template>
  <div class="main-toolbar p-1">
    <Toolbar class="row h-auto w-full gap-0 border-0 p-0" loop>
      <div class="toolbar-leading-group">
        <div class="toolbar-leading-section">
          <AppTooltip :tooltip="$t(($) => $.menu.file.new, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              @click="$emit('new-score')"
            >
              <PhFilePlus weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip :tooltip="$t(($) => $.menu.file.open, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              @click="$emit('open-score')"
            >
              <PhFolderOpen weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip :tooltip="$t(($) => $.menu.file.save, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              @click="$emit('save-score')"
            >
              <PhFloppyDisk weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip :tooltip="$t(($) => $.menu.file.print, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              @click="$emit('print-score')"
            >
              <PhPrinter weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
        </div>
        <ToolbarSeparator class="toolbar-leading-separator" />
        <div class="toolbar-leading-section toolbar-leading-section-right">
          <AppTooltip :tooltip="$t(($) => $.menu.edit.cut, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              @click="$emit('cut')"
            >
              <PhScissors weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip :tooltip="$t(($) => $.menu.edit.copy, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              @click="$emit('copy')"
            >
              <PhCopy weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip :tooltip="$t(($) => $.menu.edit.paste, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              @click="$emit('paste')"
            >
              <PhClipboardText weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
        </div>
      </div>
      <div class="toolbar-aligned-group">
        <ToolbarSeparator />
        <AppTooltip :tooltip="$t(($) => $.menu.edit.undo, { ns: 'menu' })">
          <ToolbarButton
            variant="secondary"
            size="icon-sm"
            class="icon-btn"
            :disabled="!canUndo"
            @click="$emit('undo')"
          >
            <PhArrowCounterClockwise />
          </ToolbarButton>
        </AppTooltip>
        <AppTooltip :tooltip="$t(($) => $.menu.edit.redo, { ns: 'menu' })">
          <ToolbarButton
            variant="secondary"
            size="icon-sm"
            class="icon-btn"
            :disabled="!canRedo"
            @click="$emit('redo')"
          >
            <PhArrowClockwise />
          </ToolbarButton>
        </AppTooltip>
      </div>
      <div class="toolbar-primary-group toolbar-primary-group-zoom">
        <ToolbarSeparator />
        <AppTooltip
          :tooltip="
            $t(($) => $.toolbar.main.deleteSelectedElement, {
              ns: 'toolbar',
            })
          "
        >
          <ToolbarButton
            variant="secondary"
            size="icon-sm"
            class="icon-btn"
            @click="$emit('delete-selected-element')"
          >
            <PhTrash class="delete-icon" weight="duotone" />
          </ToolbarButton>
        </AppTooltip>
        <ToolbarSeparator />
        <div class="zoom-control">
          <DropdownMenu>
            <InputGroup class="w-full bg-background">
              <InputGroupInput
                v-model="zoomText"
                aria-label="Zoom"
                @change="updateZoom(zoomText)"
                @keydown.enter="onZoomInputEnter"
                @keydown.escape="onZoomInputEscape"
              />
              <InputGroupAddon
                align="inline-end"
                class="h-full border-l border-input p-0 has-[>button]:mr-0"
              >
                <DropdownMenuTrigger as-child>
                  <InputGroupButton
                    size="icon-sm"
                    class="h-full border-0"
                    aria-label="Show zoom options"
                  >
                    <PhCaretDown />
                  </InputGroupButton>
                </DropdownMenuTrigger>
              </InputGroupAddon>
            </InputGroup>
            <DropdownMenuContent align="end" class="w-24 min-w-24">
              <DropdownMenuItem @select="selectZoomToFit">
                {{ zoomToFitLabel }}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                v-for="option in zoomOptions"
                :key="option"
                @select="updateZoom(option)"
              >
                {{ option }}%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div class="toolbar-playback-section">
        <div class="toolbar-zoom-adjacent-actions">
          <ToolbarSeparator />
          <AppTooltip
            :tooltip="$t(($) => $.menu.file.pageSetup, { ns: 'menu' })"
          >
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              @click="$emit('open-page-setup')"
            >
              <PhScroll weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip :tooltip="$t(($) => $.menu.edit.find, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              @click="$emit('find')"
            >
              <PhMagnifyingGlass weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
        </div>
        <div class="toolbar-playback-controls">
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
              <PhPause v-if="audioState === AudioState.Playing" weight="fill" />
              <PhPlay v-else weight="fill" />
            </ToolbarButton>
            <ToolbarButton
              variant="secondary"
              size="icon-sm"
              class="icon-btn"
              aria-label="Playback settings"
              @click="$emit('open-playback-settings')"
            >
              <PhGearFine />
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
        </div>
      </div>
    </Toolbar>
    <Toolbar class="row h-auto w-full gap-0 border-0 p-0" loop>
      <div class="toolbar-leading-group">
        <div class="toolbar-leading-section">
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
        </div>
        <ToolbarSeparator class="toolbar-leading-separator" />
        <div class="toolbar-leading-section toolbar-leading-section-right">
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
          <ButtonWithMenu
            direction="down"
            :options="tempoOptions"
            :tooltip="tempoTooltip"
            img-size="28px"
            @select="$emit('add-tempo', $event)"
          />
        </div>
      </div>
      <div class="toolbar-aligned-group">
        <ToolbarSeparator />
        <AppTooltip
          :tooltip="$t(($) => $.menu.insert.alternateLine, { ns: 'menu' })"
        >
          <ToolbarButton
            variant="secondary"
            size="icon-sm"
            class="icon-btn"
            @click="$emit('add-alternate-line')"
          >
            <PhMusicNotesPlus weight="duotone" />
          </ToolbarButton>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.menu.insert.annotation, { ns: 'menu' })"
        >
          <ToolbarButton
            variant="secondary"
            size="icon-sm"
            class="icon-btn"
            @click="$emit('add-annotation')"
          >
            <PhNotePencil weight="duotone" />
          </ToolbarButton>
        </AppTooltip>
      </div>
      <div class="toolbar-primary-group">
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
            <PhArticleNyTimes weight="duotone" />
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
            <PhTextbox weight="duotone" />
          </ToolbarButton>
        </AppTooltip>
        <AppTooltip
          :tooltip="
            $t(($) => $.toolbar.main.insertTextBoxRich, { ns: 'toolbar' })
          "
        >
          <ToolbarButton
            variant="secondary"
            size="icon-sm"
            class="icon-btn"
            @click="$emit('add-text-box-rich')"
          >
            <PhTextbox class="rich-text-box-icon" weight="duotone" />
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
            <PhImageSquare weight="duotone" />
          </ToolbarButton>
        </AppTooltip>
      </div>
      <div class="toolbar-rest">
        <ToolbarSeparator />
        <AppTooltip
          :tooltip="
            $t(
              ($) => $.toolbar.main.insertOrRemoveLineBreakAfterSelectedElement,
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
            @click="$emit('toggle-line-break', LineBreakType.Left)"
          >
            <PhParagraph weight="duotone" />
          </ToolbarButton>
        </AppTooltip>
        <AppTooltip
          :tooltip="
            $t(
              ($) =>
                $.toolbar.main
                  .insertOrRemoveJustifiedLineBreakAfterSelectedElement,
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
            <svg viewBox="0 0 24 24">
              <PhParagraph
                size="24"
                weight="duotone"
                transform="matrix(0.75 0 0 1 -2 0)"
              />
              <PhTextAlignJustify size="12" x="12" y="12" />
            </svg>
          </ToolbarButton>
        </AppTooltip>
        <AppTooltip
          :tooltip="
            $t(
              ($) =>
                $.toolbar.main
                  .insertOrRemoveCenteredLineBreakAfterSelectedElement,
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
            <svg viewBox="0 0 24 24">
              <PhParagraph
                size="24"
                weight="duotone"
                transform="matrix(0.75 0 0 1 -2 0)"
              />
              <PhTextAlignCenter size="12" x="12" y="12" />
            </svg>
          </ToolbarButton>
        </AppTooltip>
        <AppTooltip
          :tooltip="
            $t(
              ($) => $.toolbar.main.insertOrRemovePageBreakAfterSelectedElement,
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
            @click="$emit('toggle-page-break')"
          >
            <PhFile />
          </ToolbarButton>
        </AppTooltip>
      </div>
    </Toolbar>
  </div>
</template>

<script setup lang="ts">
import {
  PhArrowClockwise,
  PhArrowCounterClockwise,
  PhArticleNyTimes,
  PhCaretDown,
  PhClipboardText,
  PhCopy,
  PhFile,
  PhFilePlus,
  PhFloppyDisk,
  PhFolderOpen,
  PhGearFine,
  PhImageSquare,
  PhMagnifyingGlass,
  PhMusicNotesPlus,
  PhNotePencil,
  PhParagraph,
  PhPause,
  PhPlay,
  PhPrinter,
  PhScissors,
  PhScroll,
  PhTextAlignCenter,
  PhTextAlignJustify,
  PhTextbox,
  PhTrash,
} from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed, nextTick, ref, watch } from 'vue';

import type { AppTooltipValue } from '@/components/AppTooltip.types';
import AppTooltip from '@/components/AppTooltip.vue';
import InputUnit from '@/components/InputUnit.vue';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group';
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
  playbackTime: {
    type: Number,
    required: true,
  },
  playbackBpm: {
    type: Number,
    required: true,
  },
  canUndo: {
    type: Boolean,
    required: true,
  },
  canRedo: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits([
  'add-alternate-line',
  'add-annotation',
  'add-auto-martyria',
  'add-drop-cap',
  'add-image',
  'add-mode-key',
  'add-tempo',
  'add-text-box',
  'add-text-box-rich',
  'copy',
  'cut',
  'delete-selected-element',
  'find',
  'new-score',
  'open-score',
  'open-page-setup',
  'open-playback-settings',
  'paste',
  'play-audio',
  'print-score',
  'redo',
  'save-score',
  'toggle-line-break',
  'toggle-page-break',
  'undo',
  'update:audioOptionsSpeed',
  'update:entryMode',
  'update:zoom',
  'update:zoomToFit',
]);

const { t } = useTranslation();
const ZOOM_TO_FIT_VALUE = 'fit';
const zoomOptions = ['50', '75', '90', '100', '125', '150', '200', '500'];
const zoomText = ref('');

const zoomToFitLabel = computed(() =>
  t(($) => $.toolbar.main.fit, { ns: 'toolbar' }),
);

const zoomDisplay = computed(() =>
  props.zoomToFit ? zoomToFitLabel.value : `${(props.zoom * 100).toFixed(0)}%`,
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

function onZoomInputEnter(event: KeyboardEvent) {
  if (event.isComposing) {
    return;
  }

  event.preventDefault();
  if (isCurrentZoomDisplay(zoomText.value)) {
    resetZoomInput();
    return;
  }

  updateZoom(zoomText.value);
}

function onZoomInputEscape(event: KeyboardEvent) {
  if (event.isComposing) {
    return;
  }

  resetZoomInput();
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
  if (isZoomToFitValue(value)) {
    selectZoomToFit();
    return;
  }

  let valueAsNumber = parseInt(value);

  if (Number.isNaN(valueAsNumber)) {
    valueAsNumber = 100;
  }

  emit('update:zoom', valueAsNumber / 100);

  resetZoomInput();
}

function selectZoomToFit() {
  emit('update:zoomToFit', true);
  resetZoomInput();
}

function isZoomToFitValue(value: string) {
  const normalizedValue = value.trim().toLowerCase();

  return (
    normalizedValue === ZOOM_TO_FIT_VALUE ||
    normalizedValue === zoomToFitLabel.value.trim().toLowerCase()
  );
}

function isCurrentZoomDisplay(value: string) {
  return value.trim() === zoomDisplay.value.trim();
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
  display: grid;
  grid-template-columns: max-content max-content max-content minmax(0, 1fr);
  align-items: center;
  font-size: 16px;
  background-color: var(--color-legacy-chrome-menu-surface);

  --btn-size: 32px;
}

.row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
  align-items: center;
}

.toolbar-leading-group,
.toolbar-aligned-group,
.toolbar-primary-group,
.toolbar-rest,
.toolbar-zoom-adjacent-actions,
.toolbar-playback-controls,
.toolbar-playback-section {
  align-items: center;
}

.toolbar-leading-group {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr) max-content;
}

.toolbar-leading-section {
  display: flex;
  align-items: center;
}

.toolbar-leading-section-right {
  justify-self: end;
}

.toolbar-leading-separator {
  justify-self: center;
}

.toolbar-aligned-group,
.toolbar-primary-group,
.toolbar-rest,
.toolbar-zoom-adjacent-actions,
.toolbar-playback-controls,
.toolbar-playback-section {
  display: flex;
}

.toolbar-leading-group,
.toolbar-aligned-group,
.toolbar-primary-group,
.toolbar-zoom-adjacent-actions,
.toolbar-playback-controls,
.toolbar-playback-section {
  flex-wrap: nowrap;
}

.toolbar-primary-group {
  min-width: 0;
  justify-self: stretch;
}

.zoom-control {
  min-width: 0;
  width: 0;
  flex: 1 1 0;
}

.toolbar-playback-section {
  min-width: 0;
  justify-content: space-between;
  justify-self: stretch;
}

.toolbar-rest {
  min-width: 0;
  flex-wrap: wrap;
}

.main-toolbar :deep(button:not(.entry-mode-btn)) {
  font-size: inherit;
  font-weight: normal;
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

.icon-btn:hover,
.neume-button:hover,
:deep(.menu-container > .neume-button:hover) {
  background: revert;
}

.neume-button > img,
.neume-button > svg,
:deep(.menu-container > .neume-button > img),
:deep(.menu-container > .neume-button > svg) {
  height: var(--btn-size);
  max-width: none;
  width: var(--btn-size);
}

.icon-btn > img,
.icon-btn > svg {
  height: var(--btn-icon-size, var(--btn-size));
  max-width: none;
  width: var(--btn-icon-size, var(--btn-size));
}

.delete-icon,
.rich-text-box-icon {
  color: red;
}

.icon-btn[aria-disabled='true'],
.icon-btn:disabled,
.neume-button[aria-disabled='true'],
:deep(.menu-container > .neume-button:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
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
