<template>
  <Toolbar class="mode-key-toolbar h-auto w-full gap-0 border-0">
    <Checkbox
      id="toolbar-mode-key-use-default-style"
      class="bg-background"
      :model-value="element.useDefaultStyle"
      @update:model-value="
        $emit('update', {
          useDefaultStyle: $event === true,
        } as Partial<ModeKeyElement>)
      "
    />
    <Label for="toolbar-mode-key-use-default-style" class="ml-2">{{
      $t(($) => $.toolbar.common.useDefaultStyle, { ns: 'toolbar' })
    }}</Label>
    <span class="divider" />

    <template v-if="!element.useDefaultStyle">
      <Label for="toolbar-mode-key-font-size">{{
        $t(($) => $.toolbar.modeKey.size, { ns: 'toolbar' })
      }}</Label>
      <InputFontSize
        id="toolbar-mode-key-font-size"
        :model-value="element.fontSize"
        @update:model-value="
          $emit('update', { fontSize: $event } as Partial<ModeKeyElement>)
        "
      />
      <span class="space"></span>
      <ColorPicker
        :model-value="element.color"
        @update:model-value="
          $emit('update', { color: $event } as Partial<ModeKeyElement>)
        "
      />
      <span class="space"></span>
    </template>
    <ToggleGroup
      type="single"
      variant="outline"
      :model-value="element.alignment"
      @update:model-value="onAlignmentChanged"
    >
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.common.alignLeft, { ns: 'toolbar' })"
      >
        <ToggleGroupItem
          :value="TextBoxAlignment.Left"
          class="icon-btn"
          :class="{ selected: element.alignment === TextBoxAlignment.Left }"
        >
          <PhTextAlignLeft class="h-4 w-4" />
        </ToggleGroupItem>
      </AppTooltip>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.common.alignCenter, { ns: 'toolbar' })"
      >
        <ToggleGroupItem
          :value="TextBoxAlignment.Center"
          class="icon-btn"
          :class="{ selected: element.alignment === TextBoxAlignment.Center }"
        >
          <PhTextAlignCenter class="h-4 w-4" />
        </ToggleGroupItem>
      </AppTooltip>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })"
      >
        <ToggleGroupItem
          :value="TextBoxAlignment.Right"
          class="icon-btn"
          :class="{ selected: element.alignment === TextBoxAlignment.Right }"
        >
          <PhTextAlignRight class="h-4 w-4" />
        </ToggleGroupItem>
      </AppTooltip>
    </ToggleGroup>
    <span class="space" />
    <template v-if="!element.useDefaultStyle">
      <Label for="toolbar-mode-key-outline" class="mr-2">{{
        $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
      }}</Label>
      <InputStrokeWidth
        id="toolbar-mode-key-outline"
        :model-value="element.strokeWidth"
        @update:model-value="
          $emit('update', { strokeWidth: $event } as Partial<ModeKeyElement>)
        "
      />
      <span class="space" />

      <Label for="toolbar-mode-key-height-adjustment" class="mr-2">{{
        $t(($) => $.toolbar.modeKey.heightAdjustment, { ns: 'toolbar' })
      }}</Label>

      <InputUnit
        id="toolbar-mode-key-height-adjustment"
        unit="pt"
        :min="heightAdjustmentMin"
        :max="heightAdjustmentMax"
        :step="0.5"
        :format-options="fraction2FormatOptions"
        :model-value="element.heightAdjustment"
        @update:model-value="
          $emit('update', {
            heightAdjustment: $event,
          } as Partial<ModeKeyElement>)
        "
      />
      <span class="space" />
    </template>
    <ButtonWithMenu
      :options="tempoMenuOptions"
      :tooltip="$t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' })"
      @select="$emit('update', { tempo: $event } as Partial<ModeKeyElement>)"
    />
    <span class="space" />

    <AppTooltip
      :tooltip="$t(($) => $.toolbar.modeKey.rightAlignTempo, { ns: 'toolbar' })"
    >
      <button
        class="icon-btn"
        :class="{ selected: element.tempoAlignRight }"
        @click="
          $emit('update', {
            tempoAlignRight: !element.tempoAlignRight,
          } as Partial<ModeKeyElement>)
        "
      >
        <PhAlignRight class="h-4 w-4" weight="duotone" />
      </button>
    </AppTooltip>

    <span class="space" />

    <Label for="toolbar-mode-key-bpm" class="mr-2">{{
      $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
    }}</Label>
    <InputBpm
      id="toolbar-mode-key-bpm"
      :model-value="element.bpm"
      @update:model-value="
        $emit('update', { bpm: $event } as Partial<ModeKeyElement>)
      "
    />

    <span class="space" />

    <Label for="toolbar-mode-key-margin-top" class="mr-2">{{
      $t(($) => $.toolbar.common.marginTop, { ns: 'toolbar' })
    }}</Label>
    <InputUnit
      id="toolbar-mode-key-margin-top"
      unit="pt"
      :min="0"
      :max="maxHeight"
      :step="0.5"
      :model-value="element.marginTop"
      :format-options="fraction1FormatOptions"
      @update:model-value="
        $emit('update', { marginTop: $event } as Partial<ModeKeyElement>)
      "
    />
    <span class="space"></span>
    <Label for="toolbar-mode-key-margin-bottom" class="mr-2">{{
      $t(($) => $.toolbar.common.marginBottom, { ns: 'toolbar' })
    }}</Label>
    <InputUnit
      id="toolbar-mode-key-margin-bottom"
      unit="pt"
      :min="0"
      :max="maxHeight"
      :step="0.5"
      :model-value="element.marginBottom"
      :format-options="fraction1FormatOptions"
      @update:model-value="
        $emit('update', { marginBottom: $event } as Partial<ModeKeyElement>)
      "
    />

    <span class="space" />

    <Checkbox
      id="toolbar-mode-key-ignore-attractions"
      class="bg-background"
      :model-value="element.ignoreAttractions"
      @update:model-value="
        $emit('update', {
          ignoreAttractions: $event === true,
        } as Partial<ModeKeyElement>)
      "
    />
    <Label for="toolbar-mode-key-ignore-attractions" class="ml-2">{{
      $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
    }}</Label>

    <span class="space" />

    <Checkbox
      id="toolbar-mode-key-show-ambitus"
      class="bg-background"
      :model-value="element.showAmbitus"
      @update:model-value="
        $emit('update', {
          showAmbitus: $event === true,
        } as Partial<ModeKeyElement>)
      "
    />
    <Label for="toolbar-mode-key-show-ambitus" class="ml-2">{{
      $t(($) => $.toolbar.modeKey.showAmbitus, { ns: 'toolbar' })
    }}</Label>

    <span class="space" />

    <template v-if="element.mode === 3 || element.mode === 7">
      <Checkbox
        id="toolbar-mode-key-permanent-enharmonic-zo"
        class="bg-background"
        :model-value="element.permanentEnharmonicZo"
        @update:model-value="
          $emit('update', {
            permanentEnharmonicZo: $event === true,
          } as Partial<ModeKeyElement>)
        "
      />
      <Label for="toolbar-mode-key-permanent-enharmonic-zo" class="ml-2">{{
        $t(($) => $.toolbar.modeKey.permanentEnharmonicZo, { ns: 'toolbar' })
      }}</Label>
    </template>
    <span class="space" />

    <Button
      type="button"
      variant="secondary"
      @click="$emit('open-mode-key-dialog')"
    >
      <PhMusicNotes data-icon="inline-start" />
      {{ $t(($) => $.toolbar.modeKey.changeKey, { ns: 'toolbar' }) }}
    </Button>

    <span class="space" />

    <Label for="toolbar-mode-key-section-name" class="mr-2">{{
      $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
    }}</Label>
    <Input
      id="toolbar-mode-key-section-name"
      class="w-auto bg-background"
      type="text"
      :model-value="element.sectionName ?? ''"
      @change="
        $emit('update:sectionName', ($event.target as HTMLInputElement).value)
      "
    />
  </Toolbar>
</template>

<script setup lang="ts">
import {
  PhAlignRight,
  PhMusicNotes,
  PhTextAlignCenter,
  PhTextAlignLeft,
  PhTextAlignRight,
} from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import ColorPicker from '@/components/ColorPicker.vue';
import InputBpm from '@/components/InputBpm.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Toolbar } from '@/components/ui/toolbar';
import type { ModeKeyElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import { TempoSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import {
  fraction1FormatOptions,
  fraction2FormatOptions,
} from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

import type { ButtonWithMenuOption } from './ButtonWithMenu.types';
import ButtonWithMenu from './ButtonWithMenu.vue';

const tempoMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: TempoSign.VeryQuick,
    icon: new URL('@/assets/icons/agogi-poli-gorgi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Quicker,
    icon: new URL('@/assets/icons/agogi-gorgoteri.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Quick,
    icon: new URL('@/assets/icons/agogi-gorgi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Medium,
    icon: new URL('@/assets/icons/agogi-mesi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Moderate,
    icon: new URL('@/assets/icons/agogi-metria.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Slow,
    icon: new URL('@/assets/icons/agogi-argi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Slower,
    icon: new URL('@/assets/icons/agogi-argoteri.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.VerySlow,
    icon: new URL('@/assets/icons/agogi-poli-argi.svg', import.meta.url).href,
  },
];

const props = defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const emit = defineEmits([
  'open-mode-key-dialog',
  'update',
  'update:sectionName',
  'update:tempo',
]);

function onAlignmentChanged(value: unknown) {
  if (isTextBoxAlignment(value)) {
    emit('update', {
      alignment: value,
    } as Partial<ModeKeyElement>);
  }
}

function isTextBoxAlignment(value: unknown): value is TextBoxAlignment {
  return Object.values(TextBoxAlignment).includes(value as TextBoxAlignment);
}

const heightAdjustmentMin = computed(
  () => -Math.round(Unit.fromPt(props.element.height)),
);

const heightAdjustmentMax = computed(() =>
  Unit.toPt(props.pageSetup.pageHeight),
);

const maxHeight = computed(() => Unit.toPt(props.pageSetup.innerPageHeight));
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mode-key-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  background-color: var(--color-legacy-chrome-menu-surface);

  padding: 0.25rem;

  --btn-size: 32px;
}

.icon-btn,
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

.icon-btn:hover,
:deep(.menu-container > .neume-button:hover) {
  background: revert;
}

.icon-btn.selected,
.icon-btn[data-state='on'],
.icon-btn[aria-pressed='true'] {
  background: var(--color-legacy-chrome-selected);
}

.icon-btn img {
  height: var(--btn-icon-size, var(--btn-size));
  max-width: none;
  width: var(--btn-icon-size, var(--btn-size));
}

:deep(.menu-container > .neume-button img) {
  height: var(--btn-size);
  max-width: none;
  width: var(--btn-size);
}

.icon-btn[aria-disabled='true'],
.icon-btn:disabled,
:deep(.menu-container > .neume-button:disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

.space {
  width: 16px;
}

.divider {
  height: 32px;
  border-right: 1px solid var(--color-legacy-chrome-divider);
  margin: 0 0.5rem;
}
</style>
