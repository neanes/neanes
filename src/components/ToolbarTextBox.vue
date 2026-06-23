<template>
  <Toolbar class="chrome-toolbar" loop>
    <template v-if="!element.useDefaultStyle">
      <FontCombobox
        :model-value="element.fontFamily"
        :options="textBoxFontFamilies"
        @update:model-value="onFontFamilyChanged"
      />
      <FontStyleSelect
        class="w-40"
        :model-value="element.fontStyle"
        :options="fontStyleOptions"
        :disabled="fontStyleOptions.length <= 1"
        @update:model-value="
          $emit('update', { fontStyle: $event } as Partial<TextBoxElement>)
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
        class="chrome-button"
        :class="{ selected: isFontStyleAxisActive('bold') }"
        :disabled="!isFontStyleAxisToggleEnabled('bold')"
        aria-label="Toggle bold"
      >
        <PhTextB class="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        v-if="!element.useDefaultStyle"
        value="italic"
        class="chrome-button"
        :class="{ selected: isFontStyleAxisActive('italic') }"
        :disabled="!isFontStyleAxisToggleEnabled('italic')"
        aria-label="Toggle italic"
      >
        <PhTextItalic class="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="underline"
        class="chrome-button"
        :class="{ selected: element.underline }"
        aria-label="Toggle underline"
      >
        <PhTextUnderline class="size-4" />
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
    </template>
    <ToolbarSeparator />
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertPelastikon, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @mousedown.prevent="$emit('insert:pelastikon')"
      >
        <NeumeIcon name="letterPelastikon" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertGorthmikon, { ns: 'toolbar' })"
    >
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @mousedown.prevent="$emit('insert:gorthmikon')"
      >
        <NeumeIcon name="letterGorthmikon" />
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
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import NeumeIcon from '@/components/NeumeIcon.vue';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/ui/toolbar';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { TextBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import { fontCatalog } from '@/services/FontCatalog';

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

const styleValues = computed(() => [
  ...(props.element.useDefaultStyle ? [] : activeStyleAxisValues.value),
  ...(props.element.underline ? ['underline'] : []),
]);

const textBoxFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  const update: Partial<TextBoxElement> = {
    underline: values.includes('underline'),
  };

  if (!props.element.useDefaultStyle) {
    update.fontStyle = applyStyleAxisToggles(values);
  }

  emit('update', update);
}

function onFontFamilyChanged(fontFamily: string) {
  emit('update', {
    fontFamily,
    fontStyle: remapStyleForFamily(fontFamily),
  } as Partial<TextBoxElement>);
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
