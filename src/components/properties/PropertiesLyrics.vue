<template>
  <PaneAccordion
    :open-sections="openSections"
    @update:open-sections="$emit('update:open-sections', $event)"
  >
    <template #legend>{{
      $t(($) => $.menu.view.lyrics, { ns: 'menu' })
    }}</template>

    <PaneSection
      value="style"
      :title="$t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })"
    >
      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-lyrics-text-style">{{
            $t(($) => $.toolbar.common.paragraphStyle, { ns: 'toolbar' })
          }}</FieldLabel>
          <div class="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              @click="openParagraphStylesDialog"
            >
              {{
                $t(($) => $.dialog.paragraphStyles.openDialog, { ns: 'dialog' })
              }}
            </Button>
            <ParagraphStyleResetButton
              :disabled="!hasParagraphStyleOverrides"
              @reset="clearParagraphStyleOverrides"
            />
          </div>
        </div>
        <ParagraphStyleSelect
          id="properties-lyrics-text-style"
          :model-value="element.lyricsParagraphStyleId"
          :paragraph-styles="paragraphStyles"
          @update:model-value="
            $emit('update', {
              lyricsParagraphStyleId: $event,
            } as Partial<NoteElement>)
          "
        />
      </Field>

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-lyrics-font">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <ParagraphStyleResetButton
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
          :model-value="resolvedParagraphStyle.fontFamily"
          :options="lyricsFontFamilies"
          @update:model-value="onFontFamilyChanged"
        />
      </Field>

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-lyrics-font-style">{{
            $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
          }}</FieldLabel>
          <ParagraphStyleResetButton
            :disabled="element.lyricsFontStyle == null"
            @reset="
              $emit('update', { lyricsFontStyle: null } as Partial<NoteElement>)
            "
          />
        </div>
        <FontStyleSelect
          id="properties-lyrics-font-style"
          class="w-full max-w-full"
          :model-value="resolvedParagraphStyle.fontStyle"
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
            :model-value="resolvedParagraphStyle.fontSize"
            @update:model-value="
              $emit('update', {
                lyricsFontSize: $event,
              } as Partial<NoteElement>)
            "
          />
          <ParagraphStyleResetButton
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
            :model-value="resolvedParagraphStyle.color"
            @update:model-value="
              $emit('update', {
                lyricsColor: $event,
              } as Partial<NoteElement>)
            "
          />
          <ParagraphStyleResetButton
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
        <FieldLabel>Text Decorations</FieldLabel>
        <div class="flex items-center gap-1">
          <ToggleGroup
            type="multiple"
            variant="outline"
            :model-value="underlineValues"
            @update:model-value="onTextDecorationValuesChanged"
          >
            <ToggleGroupItem value="underline" aria-label="Toggle underline">
              <PhTextUnderline />
            </ToggleGroupItem>
          </ToggleGroup>
          <ParagraphStyleResetButton
            :disabled="element.lyricsTextDecoration == null"
            @reset="
              $emit('update', {
                lyricsTextDecoration: null,
              } as Partial<NoteElement>)
            "
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <InputStrokeWidth
            :model-value="resolvedParagraphStyle.strokeWidth"
            @update:model-value="
              $emit('update', {
                lyricsStrokeWidth: $event,
              } as Partial<NoteElement>)
            "
          />
          <ParagraphStyleResetButton
            :disabled="element.lyricsStrokeWidth == null"
            @reset="
              $emit('update', {
                lyricsStrokeWidth: null,
              } as Partial<NoteElement>)
            "
          />
        </div>
      </Field>
    </PaneSection>
  </PaneAccordion>
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
import PaneAccordion from '@/components/pane/PaneAccordion.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import ParagraphStyleResetButton from '@/components/properties/ParagraphStyleResetButton.vue';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import type { NoteElement } from '@/models/Element';
import {
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
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
  openSections: {
    type: Array as PropType<string[]>,
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
    props.element.lyricsParagraphStyleId,
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

const underline = computed(
  () =>
    props.element.lyricsTextDecoration === 'underline' ||
    (props.element.lyricsTextDecoration == null &&
      resolvedParagraphStyle.value.textDecoration === 'underline'),
);
const fontStyleValues = computed(() => [...activeStyleAxisValues.value]);
const underlineValues = computed(() => (underline.value ? ['underline'] : []));

const lyricsFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);
const paragraphStyleOverrideLabels = computed(() => {
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
  if (props.element.lyricsTextDecoration != null) {
    labels.push('Underline');
  }

  return labels;
});
const hasParagraphStyleOverrides = computed(
  () => paragraphStyleOverrideLabels.value.length > 0,
);

function onFontStyleValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    lyricsFontStyle: applyStyleAxisToggles(values),
  } as Partial<NoteElement>);
}

function onTextDecorationValuesChanged(value: unknown) {
  const values = Array.isArray(value) ? value : [];

  emit('update', {
    lyricsTextDecoration: values.includes('underline') ? 'underline' : 'none',
  } as Partial<NoteElement>);
}

function onFontFamilyChanged(lyricsFontFamily: string) {
  emit('update', {
    lyricsFontFamily,
    lyricsFontStyle: remapStyleForFamily(lyricsFontFamily),
  } as Partial<NoteElement>);
}

function clearParagraphStyleOverrides() {
  emit('update', {
    lyricsColor: null,
    lyricsFontFamily: null,
    lyricsFontSize: null,
    lyricsFontStyle: null,
    lyricsStrokeWidth: null,
    lyricsTextDecoration: null,
  } as Partial<NoteElement>);
}

function openParagraphStylesDialog() {
  emit('open-paragraph-styles-dialog', props.element.lyricsParagraphStyleId);
}
</script>
