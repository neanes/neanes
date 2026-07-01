<template>
  <Toolbar class="chrome-toolbar" loop>
    <ParagraphStyleSelect
      trigger-class="w-48"
      :model-value="element.paragraphStyleId"
      :paragraph-styles="paragraphStyles"
      @update:model-value="
        $emit('update', { paragraphStyleId: $event } as Partial<TextBoxElement>)
      "
    />
    <ToolbarSeparator />
    <FontCombobox
      :model-value="resolvedParagraphStyle.fontFamily"
      :options="textBoxFontFamilies"
      @update:model-value="onFontFamilyChanged"
    />
    <FontStyleSelect
      class="w-40"
      :model-value="resolvedParagraphStyle.fontStyle"
      :options="fontStyleOptions"
      :disabled="fontStyleOptions.length <= 1"
      @update:model-value="
        $emit('update', { fontStyle: $event } as Partial<TextBoxElement>)
      "
    />
    <InputFontSize
      id="toolbar-text-box-font-size"
      :model-value="resolvedParagraphStyle.fontSize"
      @update:model-value="
        $emit('update', { fontSize: $event } as Partial<TextBoxElement>)
      "
    />
    <ToolbarSeparator />
    <ToggleGroup
      type="multiple"
      variant="outline"
      :model-value="fontStyleValues"
      @update:model-value="onFontStyleValuesChanged"
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
    <ToggleGroup
      type="multiple"
      variant="outline"
      :model-value="underlineValues"
      @update:model-value="onTextDecorationValuesChanged"
    >
      <ToggleGroupItem
        value="underline"
        class="chrome-button"
        :class="{ selected: underline }"
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
        :model-value="currentAlignment"
        @update:model-value="onAlignmentChanged"
      >
        <AppTooltip
          :tooltip="$t(($) => $.toolbar.common.alignLeft, { ns: 'toolbar' })"
        >
          <ToggleGroupItem
            :value="TextBoxAlignment.Left"
            class="chrome-button"
            :class="{ selected: currentAlignment === TextBoxAlignment.Left }"
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
            :class="{ selected: currentAlignment === TextBoxAlignment.Center }"
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
            :class="{ selected: currentAlignment === TextBoxAlignment.Right }"
          >
            <PhTextAlignRight class="size-4" />
          </ToggleGroupItem>
        </AppTooltip>
        <AppTooltip
          :tooltip="$t(($) => $.toolbar.common.alignJustify, { ns: 'toolbar' })"
        >
          <ToggleGroupItem
            :value="TextBoxAlignment.Justify"
            class="chrome-button"
            :class="{ selected: currentAlignment === TextBoxAlignment.Justify }"
          >
            <PhTextAlignJustify class="size-4" />
          </ToggleGroupItem>
        </AppTooltip>
      </ToggleGroup>
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.common.resetToDefault, { ns: 'toolbar' })"
      >
        <ToolbarButton
          variant="ghost"
          class="chrome-button"
          :disabled="element.alignment == null"
          :aria-label="
            $t(($) => $.toolbar.common.resetToDefault, { ns: 'toolbar' })
          "
          @mousedown.prevent="
            $emit('update', { alignment: null } as Partial<TextBoxElement>)
          "
        >
          <PhArrowCounterClockwise class="size-4" />
        </ToolbarButton>
      </AppTooltip>
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
  PhArrowCounterClockwise,
  PhTextAlignCenter,
  PhTextAlignJustify,
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
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/ui/toolbar';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { TextBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';
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
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    required: true,
  },
});

const emit = defineEmits(['insert:gorthmikon', 'insert:pelastikon', 'update']);

const resolvedParagraphStyle = computed(() =>
  resolveParagraphStyle(
    props.paragraphStyles,
    props.element.paragraphStyleId,
    props.element.getParagraphStyleOverrides(),
  ),
);

const {
  fontStyleOptions,
  activeStyleAxisValues,
  isFontStyleAxisActive,
  isFontStyleAxisToggleEnabled,
  applyStyleAxisToggles,
  remapStyleForFamily,
} = useFontStyleControls(
  () => resolvedParagraphStyle.value.fontFamily,
  () => resolvedParagraphStyle.value.fontStyle,
);

const underline = computed(
  () =>
    props.element.underline === true ||
    (props.element.underline == null &&
      resolvedParagraphStyle.value.textDecoration === 'underline'),
);

const fontStyleValues = computed(() => [...activeStyleAxisValues.value]);
const underlineValues = computed(() => (underline.value ? ['underline'] : []));

const currentAlignment = computed(
  () => props.element.alignment ?? resolvedParagraphStyle.value.alignment,
);

const textBoxFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

function onFontStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    fontStyle: applyStyleAxisToggles(values),
  } as Partial<TextBoxElement>);
}

function onTextDecorationValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    underline: values.includes('underline') ? true : false,
  } as Partial<TextBoxElement>);
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
