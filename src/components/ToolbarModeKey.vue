<template>
  <Toolbar class="mode-key-toolbar h-auto w-full gap-0 border-0 p-1" loop>
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
      <ToolbarSeparator />
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
    <ToolbarSeparator />
    <ButtonWithMenu
      :options="tempoMenuOptions"
      :tooltip="$t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' })"
      @select="$emit('update:tempo', $event)"
    />
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.modeKey.rightAlignTempo, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="neume-button"
        :class="{ selected: element.tempoAlignRight }"
        @click="
          $emit('update', {
            tempoAlignRight: !element.tempoAlignRight,
          } as Partial<ModeKeyElement>)
        "
      >
        <PhAlignRight class="h-4 w-4" weight="duotone" />
      </ToolbarButton>
    </AppTooltip>
  </Toolbar>
</template>

<script setup lang="ts">
import {
  PhAlignRight,
  PhTextAlignCenter,
  PhTextAlignLeft,
  PhTextAlignRight,
} from '@phosphor-icons/vue';
import type { PropType } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/ui/toolbar';
import type { ModeKeyElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import { TempoSign } from '@/models/Neumes';

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

defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
});

const emit = defineEmits(['update', 'update:tempo']);

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
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mode-key-toolbar {
  flex-wrap: wrap;
  background-color: var(--color-legacy-chrome-menu-surface);

  --btn-size: 32px;
}

.neume-button,
:deep(.menu-container > .neume-button),
.icon-btn {
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

.neume-button:hover,
:deep(.menu-container > .neume-button:hover),
.icon-btn:hover {
  background: revert;
}

.neume-button.selected,
.neume-button[data-state='on'],
.neume-button[aria-pressed='true'],
.icon-btn.selected,
.icon-btn[data-state='on'],
.icon-btn[aria-pressed='true'] {
  background: var(--color-legacy-chrome-selected);
}

.neume-button > img,
:deep(.menu-container > .neume-button > img),
.icon-btn img {
  height: var(--btn-size);
  max-width: none;
  width: var(--btn-size);
}

.neume-button[aria-disabled='true'],
.neume-button:disabled,
:deep(.menu-container > .neume-button:disabled),
.icon-btn[aria-disabled='true'],
.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
