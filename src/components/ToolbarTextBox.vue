<template>
  <div class="text-box-toolbar">
    <Checkbox
      id="toolbar-text-box-use-default-style"
      class="bg-background"
      :model-value="element.useDefaultStyle"
      @update:model-value="
        $emit('update', {
          useDefaultStyle: $event === true,
        } as Partial<TextBoxElement>)
      "
    />
    <Label for="toolbar-text-box-use-default-style" class="ml-2">{{
      $t(($) => $.toolbar.common.useDefaultStyle, { ns: 'toolbar' })
    }}</Label>
    <span class="divider" />
    <template v-if="!element.useDefaultStyle">
      <FontCombobox
        :model-value="element.fontFamily"
        :options="textBoxFontFamilies"
        @update:model-value="
          $emit('update', {
            fontFamily: $event,
          } as Partial<TextBoxElement>)
        "
      />
      <span class="space"></span>
      <InputFontSize
        id="toolbar-text-box-font-size"
        :model-value="element.fontSize"
        @update:model-value="
          $emit('update', { fontSize: $event } as Partial<TextBoxElement>)
        "
      />
      <span class="space" style="text-align: center">&#47;</span>
      <InputUnit
        id="toolbar-text-box-line-height"
        unit="unitless"
        :nullable="true"
        :min="0"
        :step="0.1"
        :model-value="element.lineHeight"
        :format-options="fraction2FormatOptions"
        placeholder="normal"
        @update:model-value="
          $emit('update', { lineHeight: $event } as Partial<TextBoxElement>)
        "
      />
      <span class="space"></span>
      <ColorPicker
        :model-value="element.color"
        @update:model-value="
          $emit('update', { color: $event } as Partial<TextBoxElement>)
        "
      />
    </template>
    <span class="space"></span>
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
      <span class="space"></span>
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
            :class="{
              selected: element.alignment === TextBoxAlignment.Left,
            }"
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
            :class="{
              selected: element.alignment === TextBoxAlignment.Center,
            }"
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
            :class="{
              selected: element.alignment === TextBoxAlignment.Right,
            }"
          >
            <PhTextAlignRight class="h-4 w-4" />
          </ToggleGroupItem>
        </AppTooltip>
      </ToggleGroup>
    </template>
    <template v-if="!element.useDefaultStyle">
      <span class="space" />
      <Label for="toolbar-text-box-outline" class="mr-2">{{
        $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
      }}</Label>
      <InputStrokeWidth
        id="toolbar-text-box-outline"
        :model-value="element.strokeWidth"
        @update:model-value="
          $emit('update', { strokeWidth: $event } as Partial<TextBoxElement>)
        "
      />
    </template>
    <span class="space" />
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertPelastikon, { ns: 'toolbar' })"
    >
      <button class="icon-btn" @mousedown.prevent="$emit('insert:pelastikon')">
        <img src="@/assets/icons/letterPelastikon.svg" />
      </button>
    </AppTooltip>
    <AppTooltip
      :tooltip="$t(($) => $.toolbar.common.insertGorthmikon, { ns: 'toolbar' })"
    >
      <button class="icon-btn" @mousedown.prevent="$emit('insert:gorthmikon')">
        <img src="@/assets/icons/letterGorthmikon.svg" />
      </button>
    </AppTooltip>

    <template v-if="!element.inline">
      <span class="divider" />

      <Checkbox
        id="toolbar-text-box-multipanel"
        class="bg-background"
        :model-value="element.multipanel"
        @update:model-value="
          $emit('update', {
            multipanel: $event === true,
          } as Partial<TextBoxElement>)
        "
      />
      <Label for="toolbar-text-box-multipanel" class="ml-2">{{
        $t(($) => $.toolbar.textbox.multipanel, { ns: 'toolbar' })
      }}</Label>
      <span class="divider" />

      <template v-if="!element.multipanel">
        <Label for="toolbar-text-box-height" class="mr-2">{{
          $t(($) => $.toolbar.common.height, { ns: 'toolbar' })
        }}</Label>
        <InputUnit
          id="toolbar-text-box-height"
          unit="pt"
          :nullable="true"
          :min="0.5"
          :max="maxWidth"
          :step="0.5"
          :model-value="element.customHeight"
          :format-options="fraction1FormatOptions"
          placeholder="auto"
          @update:model-value="
            $emit('update', { customHeight: $event } as Partial<TextBoxElement>)
          "
        />
      </template>
    </template>
    <template v-else>
      <span class="divider" />
      <Label for="toolbar-text-box-width" class="mr-2">{{
        $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
      }}</Label>
      <InputUnit
        id="toolbar-text-box-width"
        unit="pt"
        :nullable="true"
        :min="0.5"
        :max="maxWidth"
        :step="0.5"
        :model-value="element.customWidth"
        :format-options="fraction1FormatOptions"
        placeholder="auto"
        @update:model-value="
          $emit('update', { customWidth: $event } as Partial<TextBoxElement>)
        "
      />
      <Checkbox
        id="toolbar-text-box-fill-width"
        class="bg-background"
        :model-value="element.fillWidth"
        @update:model-value="
          $emit('update', {
            fillWidth: $event === true,
          } as Partial<TextBoxElement>)
        "
      />
      <Label for="toolbar-text-box-fill-width" class="ml-2">{{
        $t(($) => $.toolbar.textbox.fillWidth, { ns: 'toolbar' })
      }}</Label>
    </template>
    <span class="space"></span>
    <Label for="toolbar-text-box-margin-top" class="mr-2">{{
      $t(($) => $.toolbar.common.marginTop, { ns: 'toolbar' })
    }}</Label>
    <InputUnit
      id="toolbar-text-box-margin-top"
      unit="pt"
      :min="-maxHeight"
      :max="maxHeight"
      :step="0.5"
      :model-value="element.marginTop"
      :format-options="fraction1FormatOptions"
      @update:model-value="
        $emit('update', { marginTop: $event } as Partial<TextBoxElement>)
      "
    />
    <span class="space"></span>
    <Label for="toolbar-text-box-margin-bottom" class="mr-2">{{
      $t(($) => $.toolbar.common.marginBottom, { ns: 'toolbar' })
    }}</Label>
    <InputUnit
      id="toolbar-text-box-margin-bottom"
      unit="pt"
      :min="0"
      :max="maxHeight"
      :step="0.5"
      :model-value="element.marginBottom"
      :format-options="fraction1FormatOptions"
      @update:model-value="
        $emit('update', { marginBottom: $event } as Partial<TextBoxElement>)
      "
    />
    <span class="space"></span>
    <Label for="toolbar-text-box-section-name" class="mr-2">{{
      $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
    }}</Label>
    <Input
      id="toolbar-text-box-section-name"
      class="w-auto bg-background"
      type="text"
      :model-value="element.sectionName ?? ''"
      @change="
        $emit('update:sectionName', ($event.target as HTMLInputElement).value)
      "
    />
  </div>
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
import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { TextBoxElement } from '@/models/Element';
import { TextBoxAlignment } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import {
  fraction1FormatOptions,
  fraction2FormatOptions,
} from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const props = defineProps({
  element: {
    type: Object as PropType<TextBoxElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits([
  'insert:gorthmikon',
  'insert:pelastikon',
  'update',
  'update:sectionName',
]);

const styleValues = computed(() => [
  ...(!props.element.useDefaultStyle && props.element.bold ? ['bold'] : []),
  ...(!props.element.useDefaultStyle && props.element.italic ? ['italic'] : []),
  ...(props.element.underline ? ['underline'] : []),
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

const textBoxFontFamilies = computed(() => [
  'Source Serif',
  'GFS Didot',
  'Noto Naskh Arabic',
  'Old Standard',
  ...props.fonts,
]);

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
const maxHeight = computed(() => Unit.toPt(props.pageSetup.innerPageHeight));
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.text-box-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  background-color: var(--color-legacy-chrome-menu-surface);

  padding: 0.25rem;

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
  height: var(--btn-icon-size, var(--btn-size));
  max-width: none;
  width: var(--btn-icon-size, var(--btn-size));
}

.icon-btn[aria-disabled='true'],
.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.divider {
  height: 32px;
  border-right: 1px solid var(--color-legacy-chrome-divider);
  margin: 0 0.5rem;
}

.space {
  width: 16px;
}
</style>
