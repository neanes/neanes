<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.view.lyrics, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <Field orientation="horizontal">
        <Switch
          id="properties-lyrics-use-default-style"
          :model-value="element.lyricsUseDefaultStyle"
          @update:model-value="
            $emit('update', {
              lyricsUseDefaultStyle: $event === true,
            } as Partial<NoteElement>)
          "
        />
        <FieldLabel for="properties-lyrics-use-default-style">{{
          $t(($) => $.toolbar.common.useDefaultStyle, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>

      <template v-if="!element.lyricsUseDefaultStyle">
        <Field>
          <FieldLabel for="properties-lyrics-font">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <FontCombobox
            id="properties-lyrics-font"
            class="w-full max-w-full"
            :model-value="element.lyricsFontFamily"
            :options="lyricsFontFamilies"
            @update:model-value="onFontFamilyChanged"
          />
        </Field>

        <Field>
          <FieldLabel for="properties-lyrics-font-style">{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <FontStyleSelect
            id="properties-lyrics-font-style"
            class="w-full max-w-full"
            :model-value="element.lyricsFontStyle"
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
          <InputFontSize
            id="properties-lyrics-font-size"
            :model-value="element.lyricsFontSize"
            @update:model-value="
              $emit('update', {
                lyricsFontSize: $event,
              } as Partial<NoteElement>)
            "
          />
        </Field>

        <Field orientation="horizontal">
          <FieldLabel>{{
            $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
          }}</FieldLabel>
          <ColorPicker
            :model-value="element.lyricsColor"
            @update:model-value="
              $emit('update', {
                lyricsColor: $event,
              } as Partial<NoteElement>)
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
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <PhTextUnderline />
            </ToggleGroupItem>
          </ToggleGroup>
        </Field>

        <Field orientation="horizontal">
          <FieldLabel>{{
            $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
          }}</FieldLabel>
          <InputStrokeWidth
            :model-value="element.lyricsStrokeWidth"
            @update:model-value="
              $emit('update', {
                lyricsStrokeWidth: $event,
              } as Partial<NoteElement>)
            "
          />
        </Field>
      </template>
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
import type { NoteElement } from '@/models/Element';
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
});

const emit = defineEmits(['update']);

const {
  fontStyleOptions,
  activeStyleAxisValues,
  isFontStyleAxisToggleEnabled,
  applyStyleAxisToggles,
  remapStyleForFamily,
} = useFontStyleControls(
  () => props.element.lyricsFontFamily,
  () => props.element.lyricsFontStyle,
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
</script>
