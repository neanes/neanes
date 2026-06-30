<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.view.lyrics, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-lyrics-text-style">{{
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
          id="properties-lyrics-text-style"
          :model-value="element.lyricsTextStyleId"
          :text-styles="textStyles"
          @update:model-value="
            $emit('update', {
              lyricsTextStyleId: $event,
            } as Partial<NoteElement>)
          "
        />
      </Field>

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-lyrics-font">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <TextStyleResetButton
            :disabled="element.lyricsFontFamily == null"
            @reset="
              $emit('update', {
                lyricsFontFamily: null,
              } as Partial<NoteElement>)
            "
          />
        </div>
        <FontCombobox
          id="properties-lyrics-font"
          class="w-full max-w-full"
          :model-value="resolvedTextStyle.fontFamily"
          :options="lyricsFontFamilies"
          @update:model-value="onFontFamilyChanged"
        />
      </Field>

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-lyrics-font-style">{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <TextStyleResetButton
            :disabled="element.lyricsFontStyle == null"
            @reset="
              $emit('update', { lyricsFontStyle: null } as Partial<NoteElement>)
            "
          />
        </div>
        <FontStyleSelect
          id="properties-lyrics-font-style"
          class="w-full max-w-full"
          :model-value="resolvedTextStyle.fontStyle"
          :options="fontStyleOptions"
          :disabled="fontStyleOptions.length <= 1"
          @update:model-value="
            $emit('update', {
              lyricsFontStyle: $event,
            } as Partial<NoteElement>)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-lyrics-font-size">{{
          $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <InputFontSize
            id="properties-lyrics-font-size"
            :model-value="resolvedTextStyle.fontSize"
            @update:model-value="
              $emit('update', {
                lyricsFontSize: $event,
              } as Partial<NoteElement>)
            "
          />
          <TextStyleResetButton
            :disabled="element.lyricsFontSize == null"
            @reset="
              $emit('update', { lyricsFontSize: null } as Partial<NoteElement>)
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
              $emit('update', {
                lyricsColor: $event,
              } as Partial<NoteElement>)
            "
          />
          <TextStyleResetButton
            :disabled="element.lyricsColor == null"
            @reset="
              $emit('update', { lyricsColor: null } as Partial<NoteElement>)
            "
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
          <ToggleGroupItem value="underline" aria-label="Toggle underline">
            <PhTextUnderline />
          </ToggleGroupItem>
        </ToggleGroup>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <InputStrokeWidth
            :model-value="resolvedTextStyle.strokeWidth"
            @update:model-value="
              $emit('update', {
                lyricsStrokeWidth: $event,
              } as Partial<NoteElement>)
            "
          />
          <TextStyleResetButton
            :disabled="element.lyricsStrokeWidth == null"
            @reset="
              $emit('update', {
                lyricsStrokeWidth: null,
              } as Partial<NoteElement>)
            "
          />
        </div>
      </Field>
    </FieldGroup>
  </FieldSet>
</template>

<script setup lang="ts">
import { PhTextB, PhTextItalic, PhTextUnderline } from '@phosphor-icons/vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import FontCombobox from '@/components/FontCombobox.vue';
import FontStyleSelect from '@/components/FontStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import TextStyleResetButton from '@/components/properties/TextStyleResetButton.vue';
import TextStyleSelect from '@/components/TextStyleSelect.vue';
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
import type { NoteElement } from '@/models/Element';
import { resolveTextStyle, type TextStyle } from '@/models/TextStyle';
import { fontCatalog } from '@/services/FontCatalog';

const props = defineProps({
  element: {
    type: Object as PropType<NoteElement>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
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
    props.element.lyricsTextStyleId,
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

const underline = computed(
  () => props.element.lyricsTextDecoration === 'underline',
);
const styleValues = computed(() => [
  ...activeStyleAxisValues.value,
  ...(underline.value ? ['underline'] : []),
]);

const lyricsFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);
const textStyleOverrideLabels = computed(() => {
  const labels: string[] = [];

  if (props.element.lyricsFontFamily != null) {
    labels.push('Font');
  }
  if (props.element.lyricsFontStyle != null) {
    labels.push('Style');
  }
  if (props.element.lyricsFontSize != null) {
    labels.push('Size');
  }
  if (props.element.lyricsColor != null) {
    labels.push('Color');
  }
  if (props.element.lyricsStrokeWidth != null) {
    labels.push('Outline');
  }
  if (props.element.lyricsTextDecoration === 'underline') {
    labels.push('Underline');
  }

  return labels;
});
const hasTextStyleOverrides = computed(
  () => textStyleOverrideLabels.value.length > 0,
);
function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    lyricsFontStyle: applyStyleAxisToggles(values),
    lyricsTextDecoration: values.includes('underline') ? 'underline' : 'none',
  } as Partial<NoteElement>);
}

function onFontFamilyChanged(lyricsFontFamily: string) {
  emit('update', {
    lyricsFontFamily,
    lyricsFontStyle: remapStyleForFamily(lyricsFontFamily),
  } as Partial<NoteElement>);
}

function clearTextStyleOverrides() {
  emit('update', {
    lyricsColor: null,
    lyricsFontFamily: null,
    lyricsFontSize: null,
    lyricsFontStyle: null,
    lyricsStrokeWidth: null,
    lyricsTextDecoration: null,
  } as Partial<NoteElement>);
}

function openTextStylesDialog() {
  emit('open-text-styles-dialog', props.element.lyricsTextStyleId);
}
</script>
