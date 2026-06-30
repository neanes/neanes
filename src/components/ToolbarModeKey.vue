<template>
  <Toolbar class="chrome-toolbar" loop>
    <template v-if="!element.useDefaultStyle">
      <Label for="toolbar-mode-key-font-size">{{
        $t(($) => $.toolbar.initialMartyria.size, { ns: 'toolbar' })
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
          class="chrome-button"
          :class="{ selected: element.alignment === TextBoxAlignment.Left }"
        >
          <PhTextAlignLeft class="size-4" />
        </ToggleGroupItem>
      </AppTooltip>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.common.alignCenter, { ns: 'toolbar' })"
      >
        <ToggleGroupItem
          :value="TextBoxAlignment.Center"
          class="chrome-button"
          :class="{ selected: element.alignment === TextBoxAlignment.Center }"
        >
          <PhTextAlignCenter class="size-4" />
        </ToggleGroupItem>
      </AppTooltip>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })"
      >
        <ToggleGroupItem
          :value="TextBoxAlignment.Right"
          class="chrome-button"
          :class="{ selected: element.alignment === TextBoxAlignment.Right }"
        >
          <PhTextAlignRight class="size-4" />
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
      :tooltip="
        $t(($) => $.toolbar.initialMartyria.rightAlignTempo, { ns: 'toolbar' })
      "
    >
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        :class="{ selected: element.tempoAlignRight }"
        @click="
          $emit('update', {
            tempoAlignRight: !element.tempoAlignRight,
          } as Partial<ModeKeyElement>)
        "
      >
        <PhAlignRight class="size-4" weight="duotone" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <AppTooltip
      :tooltip="
        $t(($) => $.toolbar.initialMartyria.changeInitialMartyria, {
          ns: 'toolbar',
        })
      "
    >
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('open-mode-key-dialog')"
      >
        <PhMusicNotes class="size-4" />
      </ToolbarButton>
    </AppTooltip>
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
    icon: 'agogi-poli-gorgi',
  },
  {
    neume: TempoSign.Quicker,
    icon: 'agogi-gorgoteri',
  },
  {
    neume: TempoSign.Quick,
    icon: 'agogi-gorgi',
  },
  {
    neume: TempoSign.Medium,
    icon: 'agogi-mesi',
  },
  {
    neume: TempoSign.Moderate,
    icon: 'agogi-metria',
  },
  {
    neume: TempoSign.Slow,
    icon: 'agogi-argi',
  },
  {
    neume: TempoSign.Slower,
    icon: 'agogi-argoteri',
  },
  {
    neume: TempoSign.VerySlow,
    icon: 'agogi-poli-argi',
  },
];

defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
});

const emit = defineEmits(['open-mode-key-dialog', 'update', 'update:tempo']);

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
