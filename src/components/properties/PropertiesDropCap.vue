<template>
  <PaneAccordion
    :open-sections="openSections"
    @update:open-sections="$emit('update:open-sections', $event)"
  >
    <template #legend>{{
      $t(($) => $.menu.insert.dropCap, { ns: 'menu' })
    }}</template>

    <PaneSection
      value="style"
      :title="$t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })"
    >
      <ParagraphStyleField
        id="properties-drop-cap-paragraph-style"
        :model-value="element.paragraphStyleId"
        :paragraph-styles="paragraphStyles"
        :has-overrides="hasParagraphStyleOverrides"
        @update:model-value="
          $emit('update', {
            paragraphStyleId: $event,
          } as Partial<DropCapElement>)
        "
        @clear="clearParagraphStyleFormatting"
        @open-dialog="openParagraphStylesDialog"
      />

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-drop-cap-font">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <ParagraphStyleClearButton
            :disabled="element.fontFamily == null"
            @clear="
              $emit('update', { fontFamily: null } as Partial<DropCapElement>)
            "
          />
        </div>
        <FontCombobox
          id="properties-drop-cap-font"
          class="w-full max-w-full"
          :model-value="resolvedParagraphStyle.fontFamily"
          :options="dropCapFontFamilies"
          @update:model-value="onFontFamilyChanged"
        />
      </Field>

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-drop-cap-font-style">{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <ParagraphStyleClearButton
            :disabled="element.fontStyle == null"
            @clear="
              $emit('update', { fontStyle: null } as Partial<DropCapElement>)
            "
          />
        </div>
        <FontStyleSelect
          id="properties-drop-cap-font-style"
          class="w-full max-w-full"
          :model-value="resolvedParagraphStyle.fontStyle"
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
        <div class="flex items-center gap-1">
          <InputFontSize
            id="properties-drop-cap-font-size"
            :max="500"
            :model-value="resolvedParagraphStyle.fontSize"
            @update:model-value="
              $emit('update', { fontSize: $event } as Partial<DropCapElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.fontSize == null"
            @clear="
              $emit('update', { fontSize: null } as Partial<DropCapElement>)
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
            :model-value="resolvedParagraphStyle.lineHeight"
            :format-options="fraction2FormatOptions"
            placeholder="auto"
            @update:model-value="
              $emit('update', { lineHeight: $event } as Partial<DropCapElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.lineHeight === undefined"
            @clear="
              $emit('update', {
                lineHeight: undefined,
              } as Partial<DropCapElement>)
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
            :model-value="resolvedParagraphStyle.color"
            @update:model-value="
              $emit('update', { color: $event } as Partial<DropCapElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.color == null"
            @clear="$emit('update', { color: null } as Partial<DropCapElement>)"
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
          :model-value="fontStyleValues"
          @update:model-value="onFontStyleValuesChanged"
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
            :model-value="resolvedParagraphStyle.strokeWidth"
            @update:model-value="
              $emit('update', {
                strokeWidth: $event,
              } as Partial<DropCapElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.strokeWidth == null"
            @clear="
              $emit('update', { strokeWidth: null } as Partial<DropCapElement>)
            "
          />
        </div>
      </Field>
    </PaneSection>

    <PaneSection
      value="positioning"
      :title="$t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' })"
    >
      <Field orientation="horizontal">
        <FieldLabel for="properties-drop-cap-width">{{
          $t(($) => $.toolbar.common.width, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-drop-cap-width"
          unit="pt"
          :nullable="true"
          :min="1"
          :max="maxWidth"
          :step="0.5"
          :model-value="element.customWidth"
          :format-options="fraction2FormatOptions"
          placeholder="auto"
          @update:model-value="
            $emit('update', { customWidth: $event } as Partial<DropCapElement>)
          "
        />
      </Field>
    </PaneSection>
  </PaneAccordion>
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
import PaneAccordion from '@/components/pane/PaneAccordion.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import ParagraphStyleField from '@/components/properties/ParagraphStyleField.vue';
import { Field, FieldLabel } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { DropCapElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import {
  hasParagraphStyleOverrides as overridesHaveValues,
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { fontCatalog } from '@/services/FontCatalog';
import {
  fraction0FormatOptions,
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
  openSections: {
    type: Array as PropType<string[]>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    required: true,
  },
});

const emit = defineEmits([
  'open-paragraph-styles-dialog',
  'update',
  'update:open-sections',
]);

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
  isFontStyleAxisToggleEnabled,
  applyStyleAxisToggles,
  remapStyleForFamily,
} = useFontStyleControls(
  () => resolvedParagraphStyle.value.fontFamily,
  () => resolvedParagraphStyle.value.fontStyle,
);

const fontStyleValues = computed(() => [...activeStyleAxisValues.value]);

const dropCapFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

const maxWidth = computed(() => Unit.toPt(props.pageSetup.innerPageWidth));
const hasParagraphStyleOverrides = computed(() =>
  overridesHaveValues(props.element.getParagraphStyleOverrides()),
);

function onFontStyleValuesChanged(value: unknown) {
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

function clearParagraphStyleFormatting() {
  emit('update', {
    color: null,
    fontFamily: null,
    fontSize: null,
    fontStyle: null,
    lineHeight: undefined,
    strokeWidth: null,
  } as Partial<DropCapElement>);
}

function openParagraphStylesDialog() {
  emit('open-paragraph-styles-dialog', props.element.paragraphStyleId);
}
</script>
