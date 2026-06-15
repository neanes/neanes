<template>
  <Toolbar class="text-box-toolbar h-auto w-full gap-0 border-0 p-1" loop>
    <template v-if="!element.useDefaultStyle">
      <FontCombobox
        :model-value="element.fontFamily"
        :options="textBoxFontFamilies"
        @update:model-value="
          $emit('update', { fontFamily: $event } as Partial<TextBoxElement>)
        "
      />
      <InputFontSize
        id="toolbar-text-box-font-size"
        :model-value="element.fontSize"
        @update:model-value="
          $emit('update', { fontSize: $event } as Partial<TextBoxElement>)
        "
      />
      <ToolbarSeparator />
    </template>
    <ToggleGroup
      type="multiple"
      variant="outline"
      :model-value="styleValues"
      @update:model-value="onStyleValuesChanged"
    >
      <ToggleGroupItem
        v-if="!element.useDefaultStyle"
        value="bold"
        class="icon-btn"
        :class="{ selected: element.bold }"
        aria-label="Toggle bold"
      >
        <PhTextB class="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        v-if="!element.useDefaultStyle"
        value="italic"
        class="icon-btn"
        :class="{ selected: element.italic }"
        aria-label="Toggle italic"
      >
        <PhTextItalic class="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="underline"
        class="icon-btn"
        :class="{ selected: element.underline }"
        aria-label="Toggle underline"
      >
        <PhTextUnderline class="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
    <template v-if="!element.multipanel">
      <ToolbarSeparator />
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
    </template>
    <ToolbarSeparator />
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertPelastikon, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="neume-button"
        @mousedown.prevent="$emit('insert:pelastikon')"
      >
        <img src="@/assets/icons/letterPelastikon.svg" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertGorthmikon, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        size="icon-sm"
        class="neume-button"
        @mousedown.prevent="$emit('insert:gorthmikon')"
      >
        <img src="@/assets/icons/letterGorthmikon.svg" />
      </ToolbarButton>
    </AppTooltip>
  </Toolbar>
</template>

<script setup lang="ts">
import {
  PhTextAlignCenter,
  PhTextAlignLeft,
  PhTextAlignRight,
  PhTextB,
  PhTextItalic,
  PhTextUnderline,
} from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/ui/toolbar';
import type { TextBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';

const props = defineProps({
  element: {
    type: Object as PropType<TextBoxElement>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits(['insert:gorthmikon', 'insert:pelastikon', 'update']);

const styleValues = computed(() => [
  ...(!props.element.useDefaultStyle && props.element.bold ? ['bold'] : []),
  ...(!props.element.useDefaultStyle && props.element.italic ? ['italic'] : []),
  ...(props.element.underline ? ['underline'] : []),
]);

const textBoxFontFamilies = computed(() => [
  'Source Serif',
  'GFS Didot',
  'Noto Naskh Arabic',
  'Old Standard',
  ...props.fonts,
]);

function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  const update: Partial<TextBoxElement> = {
    underline: values.includes('underline'),
  };

  if (!props.element.useDefaultStyle) {
    update.bold = values.includes('bold');
    update.italic = values.includes('italic');
  }

  emit('update', update);
}

function onAlignmentChanged(value: unknown) {
  if (isTextBoxAlignment(value)) {
    emit('update', {
      alignment: value,
    } as Partial<TextBoxElement>);
  }
}

function isTextBoxAlignment(value: unknown): value is TextBoxAlignment {
  return Object.values(TextBoxAlignment).includes(value as TextBoxAlignment);
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.text-box-toolbar {
  flex-wrap: wrap;
  background-color: var(--color-legacy-chrome-menu-surface);

  --btn-size: 32px;
}

.neume-button,
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
.icon-btn:hover {
  background: revert;
}

.icon-btn.selected,
.icon-btn[data-state='on'],
.icon-btn[aria-pressed='true'] {
  background: var(--color-legacy-chrome-selected);
}

.neume-button > img,
.icon-btn img {
  height: var(--btn-size);
  max-width: none;
  width: var(--btn-size);
}

.neume-button[aria-disabled='true'],
.neume-button:disabled,
.icon-btn[aria-disabled='true'],
.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
