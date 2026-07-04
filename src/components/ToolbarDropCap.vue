<template>
  <Toolbar class="chrome-toolbar" loop>
    <template v-if="!element.useDefaultStyle">
      <FontCombobox
        :model-value="element.fontFamily"
        :options="dropCapFontFamilies"
        @update:model-value="onFontFamilyChanged"
      />
      <FontStyleSelect
        class="w-40"
        :model-value="element.fontStyle"
        :options="fontStyleOptions"
        :disabled="fontStyleOptions.length <= 1"
        @update:model-value="
          $emit('update', { fontStyle: $event } as Partial<DropCapElement>)
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
          class="chrome-button"
          :class="{ selected: isFontStyleAxisActive('bold') }"
          :disabled="!isFontStyleAxisToggleEnabled('bold')"
          aria-label="Toggle bold"
        >
          <PhTextB class="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="italic"
          class="chrome-button"
          :class="{ selected: isFontStyleAxisActive('italic') }"
          :disabled="!isFontStyleAxisToggleEnabled('italic')"
          aria-label="Toggle italic"
        >
          <PhTextItalic class="size-4" />
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
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Toolbar, ToolbarSeparator } from '@/components/ui/toolbar';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { DropCapElement } from '@/models/Element';
import { fontCatalog } from '@/services/FontCatalog';

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

const {
  fontStyleOptions,
  activeStyleAxisValues,
  isFontStyleAxisActive,
  isFontStyleAxisToggleEnabled,
  applyStyleAxisToggles,
  remapStyleForFamily,
} = useFontStyleControls(
  () => props.element.fontFamily,
  () => props.element.fontStyle,
);

const styleValues = computed(() => [...activeStyleAxisValues.value]);

const dropCapFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    fontStyle: applyStyleAxisToggles(values),
  } as Partial<DropCapElement>);
}

function onFontFamilyChanged(fontFamily: string) {
  emit('update', {
    fontFamily,
    fontStyle: remapStyleForFamily(fontFamily),
  } as Partial<DropCapElement>);
}
</script>
