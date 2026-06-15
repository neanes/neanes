<template>
  <Toolbar class="drop-cap-toolbar h-auto w-full gap-0 border-0 p-1" loop>
    <template v-if="!element.useDefaultStyle">
      <FontCombobox
        :model-value="element.fontFamily"
        :options="dropCapFontFamilies"
        @update:model-value="
          $emit('update', { fontFamily: $event } as Partial<DropCapElement>)
        "
      />
      <InputFontSize
        id="toolbar-drop-cap-font-size"
        :max="500"
        :model-value="element.fontSize"
        @update:model-value="
          $emit('update', { fontSize: $event } as Partial<DropCapElement>)
        "
      />
      <ToolbarSeparator />
      <ToggleGroup
        type="multiple"
        variant="outline"
        :model-value="styleValues"
        @update:model-value="onStyleValuesChanged"
      >
        <ToggleGroupItem
          value="bold"
          class="icon-btn"
          :class="{ selected: bold }"
          aria-label="Toggle bold"
        >
          <PhTextB class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="italic"
          class="icon-btn"
          :class="{ selected: italic }"
          aria-label="Toggle italic"
        >
          <PhTextItalic class="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </template>
  </Toolbar>
</template>

<script setup lang="ts">
import { PhTextB, PhTextItalic } from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import FontCombobox from '@/components/FontCombobox.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Toolbar, ToolbarSeparator } from '@/components/ui/toolbar';
import type { DropCapElement } from '@/models/Element';

const props = defineProps({
  element: {
    type: Object as PropType<DropCapElement>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits(['update']);

const bold = computed(() => props.element.fontWeight === '700');
const italic = computed(() => props.element.fontStyle === 'italic');
const styleValues = computed(() => [
  ...(bold.value ? ['bold'] : []),
  ...(italic.value ? ['italic'] : []),
]);

const dropCapFontFamilies = computed(() => [
  'Source Serif',
  'GFS Didot',
  'Noto Naskh Arabic',
  'Old Standard',
  ...props.fonts,
]);

function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    fontWeight: values.includes('bold') ? '700' : '400',
    fontStyle: values.includes('italic') ? 'italic' : 'normal',
  } as Partial<DropCapElement>);
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.drop-cap-toolbar {
  flex-wrap: wrap;
  background-color: var(--color-legacy-chrome-menu-surface);

  --btn-size: 32px;
}

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

.icon-btn:hover {
  background: revert;
}

.icon-btn.selected,
.icon-btn[data-state='on'],
.icon-btn[aria-pressed='true'] {
  background: var(--color-legacy-chrome-selected);
}

.icon-btn img {
  height: var(--btn-size);
  max-width: none;
  width: var(--btn-size);
}

.icon-btn[aria-disabled='true'],
.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
