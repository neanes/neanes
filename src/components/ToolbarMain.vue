<template>
  <div class="main-toolbar chrome-toolbar">
    <div class="toolbar-left">
      <Toolbar class="row chrome-toolbar-row" loop>
        <div class="toolbar-leading-group">
          <div class="toolbar-leading-section">
            <AppTooltip :tooltip="$t(($) => $.menu.file.new, { ns: 'menu' })">
              <ToolbarButton
                variant="secondary"
                class="chrome-button toolbar-icon"
                @click="$emit('new-score')"
              >
                <PhFilePlus weight="duotone" />
              </ToolbarButton>
            </AppTooltip>
            <AppTooltip :tooltip="$t(($) => $.menu.file.open, { ns: 'menu' })">
              <ToolbarButton
                variant="secondary"
                class="chrome-button toolbar-icon"
                @click="$emit('open-score')"
              >
                <PhFolderOpen weight="duotone" />
              </ToolbarButton>
            </AppTooltip>
            <AppTooltip :tooltip="$t(($) => $.menu.file.save, { ns: 'menu' })">
              <ToolbarButton
                variant="secondary"
                class="chrome-button toolbar-icon"
                @click="$emit('save-score')"
              >
                <PhFloppyDisk weight="duotone" />
              </ToolbarButton>
            </AppTooltip>
            <AppTooltip :tooltip="$t(($) => $.menu.file.print, { ns: 'menu' })">
              <ToolbarButton
                variant="secondary"
                class="chrome-button toolbar-icon"
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
                class="chrome-button toolbar-icon"
                @click="$emit('cut')"
              >
                <PhScissors weight="duotone" />
              </ToolbarButton>
            </AppTooltip>
            <AppTooltip :tooltip="$t(($) => $.menu.edit.copy, { ns: 'menu' })">
              <ToolbarButton
                variant="secondary"
                class="chrome-button toolbar-icon"
                @click="$emit('copy')"
              >
                <PhCopy weight="duotone" />
              </ToolbarButton>
            </AppTooltip>
            <AppTooltip :tooltip="$t(($) => $.menu.edit.paste, { ns: 'menu' })">
              <ToolbarButton
                variant="secondary"
                class="chrome-button toolbar-icon"
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
              class="chrome-button toolbar-icon"
              :disabled="!canUndo"
              @click="$emit('undo')"
            >
              <PhArrowCounterClockwise />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip :tooltip="$t(($) => $.menu.edit.redo, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              class="chrome-button toolbar-icon"
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
              class="chrome-button toolbar-icon"
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
              <DropdownMenuContent align="end" class="w-32 min-w-32">
                <DropdownMenuCheckboxItem
                  v-for="option in zoomFitOptions"
                  :key="option.mode"
                  :model-value="zoomFitMode === option.mode"
                  @select="selectZoomFitMode(option.mode)"
                >
                  {{ option.label }}
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  v-for="option in zoomOptions"
                  :key="option"
                  :model-value="zoomLevelIsSelected(option)"
                  @select="selectZoomLevel(option)"
                >
                  {{ formatZoomPercent(option) }}
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div class="toolbar-zoom-adjacent-actions">
          <ToolbarSeparator />
          <AppTooltip
            :tooltip="$t(($) => $.menu.file.pageSetup, { ns: 'menu' })"
          >
            <ToolbarButton
              variant="secondary"
              class="chrome-button toolbar-icon"
              @click="$emit('open-page-setup')"
            >
              <PhScroll weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip :tooltip="$t(($) => $.menu.edit.find, { ns: 'menu' })">
            <ToolbarButton
              variant="secondary"
              class="chrome-button toolbar-icon"
              @click="$emit('find')"
            >
              <PhMagnifyingGlass weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
        </div>
      </Toolbar>
      <Toolbar class="row chrome-toolbar-row" loop>
        <div class="toolbar-leading-group">
          <div class="toolbar-leading-section">
            <ToolbarToggleGroup
              type="single"
              :model-value="entryMode"
              @update:model-value="onEntryModeChanged"
            >
              <ToolbarToggleItem
                class="chrome-button is-text"
                :value="EntryMode.Auto"
              >
                {{ $t(($) => $.toolbar.main.auto, { ns: 'toolbar' }) }}
              </ToolbarToggleItem>
              <ToolbarToggleItem
                class="chrome-button is-text"
                :value="EntryMode.Insert"
              >
                {{ $t(($) => $.toolbar.main.insert, { ns: 'toolbar' }) }}
              </ToolbarToggleItem>
              <ToolbarToggleItem
                class="chrome-button is-text"
                :value="EntryMode.Edit"
              >
                {{ $t(($) => $.toolbar.main.single, { ns: 'toolbar' }) }}
              </ToolbarToggleItem>
            </ToolbarToggleGroup>
          </div>
          <ToolbarSeparator class="toolbar-leading-separator" />
          <div class="toolbar-leading-section toolbar-leading-section-right">
            <AppTooltip :tooltip="martyriaTooltip">
              <ToolbarButton
                variant="secondary"
                class="chrome-button"
                @click="$emit('add-auto-martyria')"
              >
                <NeumeIcon name="martyria" />
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
              class="chrome-button toolbar-icon"
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
              class="chrome-button toolbar-icon"
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
              class="chrome-button toolbar-icon"
              @click="$emit('add-drop-cap')"
            >
              <PhArticleNyTimes weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip
            :tooltip="
              $t(($) => $.toolbar.main.insertTextBox, { ns: 'toolbar' })
            "
          >
            <ToolbarButton
              variant="secondary"
              class="chrome-button toolbar-icon"
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
              class="chrome-button toolbar-icon"
              @click="$emit('add-text-box-rich')"
            >
              <PhTextbox class="rich-text-box-icon" weight="duotone" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip
            :tooltip="
              $t(($) => $.toolbar.main.insertModeKey, { ns: 'toolbar' })
            "
          >
            <ToolbarButton
              variant="secondary"
              class="chrome-button toolbar-icon"
              @click="$emit('add-mode-key')"
            >
              <NeumeIcon name="mode-key" />
            </ToolbarButton>
          </AppTooltip>
          <AppTooltip
            :tooltip="$t(($) => $.toolbar.main.insertImage, { ns: 'toolbar' })"
          >
            <ToolbarButton
              variant="secondary"
              class="chrome-button toolbar-icon"
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
                ($) =>
                  $.toolbar.main.insertOrRemoveLineBreakAfterSelectedElement,
                {
                  ns: 'toolbar',
                },
              )
            "
          >
            <ToolbarButton
              variant="secondary"
              class="chrome-button toolbar-icon"
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
              class="chrome-button toolbar-icon"
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
              class="chrome-button toolbar-icon"
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
                ($) =>
                  $.toolbar.main.insertOrRemovePageBreakAfterSelectedElement,
                {
                  ns: 'toolbar',
                },
              )
            "
          >
            <ToolbarButton
              variant="secondary"
              class="chrome-button toolbar-icon"
              @click="$emit('toggle-page-break')"
            >
              <PhFile />
            </ToolbarButton>
          </AppTooltip>
        </div>
      </Toolbar>
    </div>
    <Toolbar
      class="toolbar-playback-section chrome-toolbar-row chrome-toolbar-row-fit"
      loop
    >
      <div class="toolbar-playback-controls">
        <div class="audio-container">
          <ToolbarButton
            variant="secondary"
            class="chrome-button toolbar-icon"
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
            class="chrome-button toolbar-icon"
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
import {
  formatZoomPercent,
  ZOOM_LEVELS,
  type ZoomFitMode,
} from '@/models/Workspace';
import { AudioState } from '@/services/audio/AudioService';
import type { PlaybackOptions } from '@/services/audio/PlaybackService';
import type { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { fraction0FormatOptions } from '@/utils/numberFormatOptions';

import type { ButtonWithMenuOption } from './ButtonWithMenu.types';
import ButtonWithMenu from './ButtonWithMenu.vue';
import NeumeIcon from './NeumeIcon.vue';

const tempoOptions: ButtonWithMenuOption[] = [
  {
    neume: TempoSign.VerySlow,
    icon: 'agogi-poli-argi',
  },
  {
    neume: TempoSign.Slower,
    icon: 'agogi-argoteri',
  },
  {
    neume: TempoSign.Slow,
    icon: 'agogi-argi',
  },
  {
    neume: TempoSign.Moderate,
    icon: 'agogi-metria',
  },
  {
    neume: TempoSign.Medium,
    icon: 'agogi-mesi',
  },
  {
    neume: TempoSign.Quick,
    icon: 'agogi-gorgi',
  },
  {
    neume: TempoSign.Quicker,
    icon: 'agogi-gorgoteri',
  },
  {
    neume: TempoSign.VeryQuick,
    icon: 'agogi-poli-gorgi',
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
  zoomFitMode: {
    type: String as PropType<ZoomFitMode | null>,
    default: null,
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
  'update:zoomFitMode',
]);

const { t } = useTranslation();
const ZOOM_COMPARISON_EPSILON = 0.000001;
const zoomOptions = ZOOM_LEVELS;
const zoomText = ref('');

const zoomFitOptions = computed<{ mode: ZoomFitMode; label: string }[]>(() => [
  {
    mode: 'page-width',
    label: t(($) => $.toolbar.main.pageWidth, { ns: 'toolbar' }),
  },
  {
    mode: 'text-width',
    label: t(($) => $.toolbar.main.textWidth, { ns: 'toolbar' }),
  },
  {
    mode: 'whole-page',
    label: t(($) => $.toolbar.main.wholePage, { ns: 'toolbar' }),
  },
]);

const zoomDisplay = computed(() => formatZoomPercent(props.zoom));

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
  const zoomFitMode = getZoomFitModeFromValue(value);

  if (zoomFitMode != null) {
    selectZoomFitMode(zoomFitMode);
    return;
  }

  let valueAsNumber = parseFloat(value);

  if (Number.isNaN(valueAsNumber)) {
    valueAsNumber = 100;
  }

  emit('update:zoom', valueAsNumber / 100);

  resetZoomInput();
}

function selectZoomFitMode(mode: ZoomFitMode) {
  emit('update:zoomFitMode', mode);
  resetZoomInput();
}

function selectZoomLevel(zoom: number) {
  emit('update:zoom', zoom);
  resetZoomInput();
}

function zoomLevelIsSelected(zoom: number) {
  return (
    props.zoomFitMode == null &&
    Math.abs(props.zoom - zoom) <= ZOOM_COMPARISON_EPSILON
  );
}

function getZoomFitModeFromValue(value: string): ZoomFitMode | null {
  const normalizedValue = value.trim().toLowerCase();
  const normalizedModeValue = normalizedValue.replace(/\s+/g, '-');

  const option = zoomFitOptions.value.find(
    (option) =>
      option.mode === normalizedModeValue ||
      option.label.trim().toLowerCase() === normalizedValue,
  );

  return option?.mode ?? null;
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
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;

  --toolbar-left-min-width: 42rem;
}

.toolbar-left {
  display: grid;
  flex: 0 1 var(--toolbar-left-min-width);
  grid-template-columns: max-content max-content max-content minmax(0, 1fr);
  row-gap: 3px;
  max-width: 100%;
  min-width: min(100%, var(--toolbar-left-min-width));
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
  flex: 0 1 auto;
  max-width: 100%;
  min-width: 0;
}

.toolbar-rest {
  min-width: 0;
  flex-wrap: wrap;
}

.main-toolbar :deep(.chrome-button:not(.is-text)) {
  font-size: inherit;
}

.toolbar-icon > :is(img, svg, .neume-icon) {
  height: 24px;
  max-width: none;
  width: 24px;
}

.delete-icon,
.rich-text-box-icon {
  color: var(--destructive);
}

.audio-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  max-width: 100%;
}

.playback-time {
  width: 5rem;
}

.label-bpm {
  width: 5.5rem;
}
</style>
