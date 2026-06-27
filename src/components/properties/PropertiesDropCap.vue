<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.insert.dropCap, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <Field orientation="horizontal">
        <Switch
          id="properties-drop-cap-use-default-style"
          :model-value="element.useDefaultStyle"
          @update:model-value="
            $emit('update', {
              useDefaultStyle: $event === true,
            } as Partial<DropCapElement>)
          "
        />
        <FieldLabel for="properties-drop-cap-use-default-style">{{
          $t(($) => $.toolbar.common.useDefaultStyle, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>

      <template v-if="!element.useDefaultStyle">
        <Field>
          <FieldLabel for="properties-drop-cap-font">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <FontCombobox
            id="properties-drop-cap-font"
            class="w-full max-w-full"
            :model-value="element.fontFamily"
            :options="dropCapFontFamilies"
            @update:model-value="onFontFamilyChanged"
          />
        </Field>

        <Field>
          <FieldLabel for="properties-drop-cap-font-style">{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <FontStyleSelect
            id="properties-drop-cap-font-style"
            class="w-full max-w-full"
            :model-value="element.fontStyle"
            :options="fontStyleOptions"
            :disabled="fontStyleOptions.length <= 1"
            @update:model-value="
              $emit('update', {
                fontStyle: $event,
              } as Partial<DropCapElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-drop-cap-font-size">{{
            $t(($) => $.toolbar.initialMartyria.size, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputFontSize
            id="properties-drop-cap-font-size"
            :max="500"
            :model-value="element.fontSize"
            @update:model-value="
              $emit('update', { fontSize: $event } as Partial<DropCapElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-drop-cap-line-height">{{
            $t(($) => $.dialog.pageSetup.lineHeight, { ns: 'dialog' })
          }}</FieldLabel>
          <InputUnit
            id="properties-drop-cap-line-height"
            unit="unitless"
            :nullable="true"
            :min="0"
            :step="0.1"
            :model-value="element.lineHeight"
            :format-options="fraction2FormatOptions"
            placeholder="auto"
            @update:model-value="
              $emit('update', { lineHeight: $event } as Partial<DropCapElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel>{{
            $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
          }}</FieldLabel>
          <ColorPicker
            :model-value="element.color"
            @update:model-value="
              $emit('update', { color: $event } as Partial<DropCapElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel>{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <ToggleGroup
            type="multiple"
            variant="outline"
            :model-value="styleValues"
            @update:model-value="onStyleValuesChanged"
          >
            <ToggleGroupItem
              value="bold"
              aria-label="Toggle bold"
              :disabled="!isFontStyleAxisToggleEnabled('bold')"
            >
              <PhTextB />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="italic"
              aria-label="Toggle italic"
              :disabled="!isFontStyleAxisToggleEnabled('italic')"
            >
              <PhTextItalic />
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-drop-cap-outline">{{
            $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputStrokeWidth
            id="properties-drop-cap-outline"
            :model-value="element.strokeWidth"
            @update:model-value="
              $emit('update', {
                strokeWidth: $event,
              } as Partial<DropCapElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel for="properties-drop-cap-line-span">{{
            $t(($) => $.toolbar.dropCap.lineSpan, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputUnit
            id="properties-drop-cap-line-span"
            unit="unitless"
            :min="1"
            :max="10"
            :step="1"
            :model-value="element.lineSpan"
            :format-options="fraction0FormatOptions"
            @update:model-value="
              $emit('update', { lineSpan: $event } as Partial<DropCapElement>)
            "
          />
        </Field>
      </template>

      <Field orientation="horizontal">
        <FieldLabel for="properties-drop-cap-width">{{
          $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-drop-cap-width"
          unit="pt"
          :nullable="true"
          :min="4"
          :max="maxWidth"
          :step="0.5"
          :model-value="element.customWidth"
          :format-options="fraction1FormatOptions"
          placeholder="auto"
          @update:model-value="
            $emit('update', { customWidth: $event } as Partial<DropCapElement>)
          "
        />
      </Field>
    </FieldGroup>
  </FieldSet>
</template>

<script setup lang="ts">
import { PhTextB, PhTextItalic } from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { DropCapElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { fontCatalog } from '@/services/FontCatalog';
import {
  fraction0FormatOptions,
  fraction1FormatOptions,
  fraction2FormatOptions,
} from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const props = defineProps({
  element: {
    type: Object as PropType<DropCapElement>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const emit = defineEmits(['update']);

const {
  fontStyleOptions,
  activeStyleAxisValues,
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

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));

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
