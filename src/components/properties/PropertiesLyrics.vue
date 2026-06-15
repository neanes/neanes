<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.view.lyrics, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
      <Field orientation="horizontal">
        <Checkbox
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
            @update:model-value="
              $emit('update', {
                lyricsFontFamily: $event,
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
            <ToggleGroupItem value="bold" aria-label="Toggle bold">
              <PhTextB />
            </ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Toggle italic">
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
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { NoteElement } from '@/models/Element';

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

const bold = computed(() => props.element.lyricsFontWeight === '700');
const italic = computed(() => props.element.lyricsFontStyle === 'italic');
const underline = computed(
  () => props.element.lyricsTextDecoration === 'underline',
);
const styleValues = computed(() => [
  ...(bold.value ? ['bold'] : []),
  ...(italic.value ? ['italic'] : []),
  ...(underline.value ? ['underline'] : []),
]);

const lyricsFontFamilies = computed(() => [
  'Source Serif',
  'GFS Didot',
  'Noto Naskh Arabic',
  'Old Standard',
  ...props.fonts,
]);

function onStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    lyricsFontWeight: values.includes('bold') ? '700' : '400',
    lyricsFontStyle: values.includes('italic') ? 'italic' : 'normal',
    lyricsTextDecoration: values.includes('underline') ? 'underline' : 'none',
  } as Partial<NoteElement>);
}
</script>
