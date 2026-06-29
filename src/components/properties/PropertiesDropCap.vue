<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.insert.dropCap, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-drop-cap-text-style">{{
            $t(($) => $.toolbar.common.textStyle, { ns: 'toolbar' })
          }}</FieldLabel>
          <div class="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              @click="openTextStylesDialog"
            >
              {{ $t(($) => $.dialog.textStyles.openDialog, { ns: 'dialog' }) }}
            </Button>
            <TextStyleResetButton
              :disabled="!hasTextStyleOverrides"
              @reset="clearTextStyleOverrides"
            />
          </div>
        </div>
        <TextStyleSelect
          id="properties-drop-cap-text-style"
          :model-value="element.textStyleId"
          :text-styles="textStyles"
          @update:model-value="
            $emit('update', { textStyleId: $event } as Partial<DropCapElement>)
          "
        />
      </Field>

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-drop-cap-font">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <TextStyleResetButton
            :disabled="element.fontFamily == null"
            @reset="
              $emit('update', { fontFamily: null } as Partial<DropCapElement>)
            "
          />
        </div>
        <FontCombobox
          id="properties-drop-cap-font"
          class="w-full max-w-full"
          :model-value="resolvedTextStyle.fontFamily"
          :options="dropCapFontFamilies"
          @update:model-value="onFontFamilyChanged"
        />
      </Field>

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-drop-cap-font-style">{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <TextStyleResetButton
            :disabled="element.fontStyle == null"
            @reset="
              $emit('update', { fontStyle: null } as Partial<DropCapElement>)
            "
          />
        </div>
        <FontStyleSelect
          id="properties-drop-cap-font-style"
          class="w-full max-w-full"
          :model-value="resolvedTextStyle.fontStyle"
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
          $t(($) => $.toolbar.modeKey.size, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <InputFontSize
            id="properties-drop-cap-font-size"
            :max="500"
            :model-value="resolvedTextStyle.fontSize"
            @update:model-value="
              $emit('update', { fontSize: $event } as Partial<DropCapElement>)
            "
          />
          <TextStyleResetButton
            :disabled="element.fontSize == null"
            @reset="
              $emit('update', { fontSize: null } as Partial<DropCapElement>)
            "
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-drop-cap-line-height">{{
          $t(($) => $.dialog.pageSetup.lineHeight, { ns: 'dialog' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <InputUnit
            id="properties-drop-cap-line-height"
            unit="unitless"
            :nullable="true"
            :min="0"
            :step="0.1"
            :model-value="resolvedTextStyle.lineHeight"
            :format-options="fraction2FormatOptions"
            placeholder="auto"
            @update:model-value="
              $emit('update', { lineHeight: $event } as Partial<DropCapElement>)
            "
          />
          <TextStyleResetButton
            :disabled="element.lineHeight == null"
            @reset="
              $emit('update', { lineHeight: null } as Partial<DropCapElement>)
            "
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <ColorPicker
            :model-value="resolvedTextStyle.color"
            @update:model-value="
              $emit('update', { color: $event } as Partial<DropCapElement>)
            "
          />
          <TextStyleResetButton
            :disabled="element.color == null"
            @reset="$emit('update', { color: null } as Partial<DropCapElement>)"
          />
        </div>
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
        <div class="flex items-center gap-1">
          <InputStrokeWidth
            id="properties-drop-cap-outline"
            :model-value="resolvedTextStyle.strokeWidth"
            @update:model-value="
              $emit('update', {
                strokeWidth: $event,
              } as Partial<DropCapElement>)
            "
          />
          <TextStyleResetButton
            :disabled="element.strokeWidth == null"
            @reset="
              $emit('update', { strokeWidth: null } as Partial<DropCapElement>)
            "
          />
        </div>
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
import TextStyleSelect from '@/components/ParagraphStyleSelect.vue';
import TextStyleResetButton from '@/components/properties/TextStyleResetButton.vue';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { DropCapElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { resolveTextStyle, type TextStyle } from '@/models/TextStyle';
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
  textStyles: {
    type: Array as PropType<TextStyle[]>,
    required: true,
  },
});

const emit = defineEmits(['open-text-styles-dialog', 'update']);

const resolvedTextStyle = computed(() =>
  resolveTextStyle(
    props.textStyles,
    props.element.textStyleId,
    props.element.getTextStyleOverrides(),
  ),
);

const {
  fontStyleOptions,
  activeStyleAxisValues,
  isFontStyleAxisToggleEnabled,
  applyStyleAxisToggles,
  remapStyleForFamily,
} = useFontStyleControls(
  () => resolvedTextStyle.value.fontFamily,
  () => resolvedTextStyle.value.fontStyle,
);

const styleValues = computed(() => [...activeStyleAxisValues.value]);

const dropCapFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
const textStyleOverrideLabels = computed(() => {
  const labels: string[] = [];

  if (props.element.fontFamily != null) {
    labels.push('Font');
  }
  if (props.element.fontStyle != null) {
    labels.push('Style');
  }
  if (props.element.fontSize != null) {
    labels.push('Size');
  }
  if (props.element.lineHeight != null) {
    labels.push('Line Height');
  }
  if (props.element.color != null) {
    labels.push('Color');
  }
  if (props.element.strokeWidth != null) {
    labels.push('Outline');
  }

  return labels;
});
const hasTextStyleOverrides = computed(
  () => textStyleOverrideLabels.value.length > 0,
);
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

function clearTextStyleOverrides() {
  emit('update', {
    color: null,
    fontFamily: null,
    fontSize: null,
    fontStyle: null,
    lineHeight: null,
    strokeWidth: null,
  } as Partial<DropCapElement>);
}

function openTextStylesDialog() {
  emit('open-text-styles-dialog', props.element.textStyleId);
}
</script>
