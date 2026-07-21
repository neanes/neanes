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
      <ParagraphStyleField
        id="properties-lyrics-paragraph-style"
        :model-value="element.lyricsParagraphStyleId"
        :paragraph-styles="paragraphStyles"
        :has-overrides="hasParagraphStyleOverrides"
        @update:model-value="
          $emit('update', {
            lyricsParagraphStyleId: $event,
          } as Partial<NoteElement>)
        "
        @clear="clearParagraphStyleFormatting"
        @open-dialog="openParagraphStylesDialog"
      />

      <Field>
        <div class="mb-2 flex items-center justify-between gap-2">
          <FieldLabel for="properties-lyrics-font">{{
            $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
          }}</FieldLabel>
          <ParagraphStyleClearButton
            :disabled="element.lyricsFontFamily == null"
            @clear="
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
          <ParagraphStyleClearButton
            :disabled="element.lyricsFontStyle == null"
            @clear="
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
          <ParagraphStyleClearButton
            :disabled="element.lyricsFontSize == null"
            @clear="
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
          <ParagraphStyleClearButton
            :disabled="element.lyricsColor == null"
            @clear="
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
          :model-value="activeStyleAxisValues"
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
        <FieldLabel>{{
          $t(($) => $.toolbar.richTextBox.textDecorations, { ns: 'toolbar' })
        }}</FieldLabel>
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
          <ParagraphStyleClearButton
            :disabled="element.lyricsTextDecoration == null"
            @clear="
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
          <ParagraphStyleClearButton
            :disabled="element.lyricsStrokeWidth == null"
            @clear="
              $emit('update', {
                lyricsStrokeWidth: null,
              } as Partial<NoteElement>)
            "
          />
        </div>
      </Field>

      <Field orientation="horizontal">
        <FieldLabel>{{
          $t(($) => $.dialog.pageSetup.outlineColor, { ns: 'dialog' })
        }}</FieldLabel>
        <div class="flex items-center gap-1">
          <StrokeColorPicker
            :model-value="resolvedParagraphStyle.strokeColor"
            :preview-color="
              resolvedParagraphStyle.strokeColor === 'currentcolor'
                ? resolvedParagraphStyle.color
                : resolvedParagraphStyle.strokeColor
            "
            :text-color="resolvedParagraphStyle.color"
            :same-as-text="strokeColorSameAsText"
            :label="
              $t(($) => $.dialog.pageSetup.outlineColor, { ns: 'dialog' })
            "
            :same-as-text-label="
              $t(($) => $.dialog.pageSetup.sameAsText, { ns: 'dialog' })
            "
            @update:model-value="
              $emit('update', {
                lyricsStrokeColor: $event,
              } as Partial<NoteElement>)
            "
          />
          <ParagraphStyleClearButton
            :disabled="element.lyricsStrokeColor == null"
            @clear="
              $emit('update', {
                lyricsStrokeColor: null,
              } as Partial<NoteElement>)
            "
          />
        </div>
      </Field>

      <!--
        The controls reflect the resolved style (per-note overrides folded
        in); a change writes an explicit per-note value and clear restores
        inheritance from the paragraph style.
      -->
      <FontVariantFields
        id-prefix="properties-lyrics"
        :caps="resolvedParagraphStyle.fontVariantCaps"
        :numeric="resolvedParagraphStyle.fontVariantNumeric"
        :ligatures="resolvedParagraphStyle.fontVariantLigatures"
        :caps-clearable="element.lyricsFontVariantCaps != null"
        :numeric-clearable="element.lyricsFontVariantNumeric != null"
        :ligatures-clearable="element.lyricsFontVariantLigatures != null"
        @change="onFontVariantChanged"
        @clear="onFontVariantClear"
      />
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
import FontVariantFields from '@/components/properties/FontVariantFields.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import ParagraphStyleField from '@/components/properties/ParagraphStyleField.vue';
import StrokeColorPicker from '@/components/StrokeColorPicker.vue';
import { Field, FieldLabel } from '@/components/ui/field';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useFontStyleControls } from '@/composables/useFontStyleControls';
import { useResolvedParagraphStyle } from '@/composables/useResolvedParagraphStyle';
import type { NoteElement } from '@/models/Element';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { resolveParagraphStyle } from '@/models/ParagraphStyle';
import { fontCatalog } from '@/services/FontCatalog';
import type { FontVariantProperty } from '@/utils/fontVariants';
import { composeExplicitFontVariant } from '@/utils/fontVariants';

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

const {
  resolvedParagraphStyle,
  underlineValues,
  hasOverrides: hasParagraphStyleOverrides,
} = useResolvedParagraphStyle(
  () => props.paragraphStyles,
  () => props.element.lyricsParagraphStyleId,
  () => props.element.getParagraphStyleOverrides(),
);
const strokeColorSameAsText = computed(
  () => resolvedParagraphStyle.value.strokeColor === 'currentcolor',
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

const lyricsFontFamilies = computed(() => [
  ...fontCatalog.bundledTextFamilies(),
  ...props.fonts,
]);

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

// Maps each font-variant property onto its per-note override field.
const LYRIC_FONT_VARIANT_FIELDS: Record<
  FontVariantProperty,
  | 'lyricsFontVariantCaps'
  | 'lyricsFontVariantNumeric'
  | 'lyricsFontVariantLigatures'
> = {
  fontVariantCaps: 'lyricsFontVariantCaps',
  fontVariantNumeric: 'lyricsFontVariantNumeric',
  fontVariantLigatures: 'lyricsFontVariantLigatures',
};

// The paragraph style's own values (per-note overrides excluded), used to
// decide whether "no features" needs an explicit 'normal' or can clear back
// to inheritance.
const styleFontVariants = computed(() =>
  resolveParagraphStyle(
    props.paragraphStyles,
    props.element.lyricsParagraphStyleId,
  ),
);

function onFontVariantChanged(property: FontVariantProperty, value: string) {
  emit('update', {
    [LYRIC_FONT_VARIANT_FIELDS[property]]: composeExplicitFontVariant(
      value,
      styleFontVariants.value[property],
    ),
  } as Partial<NoteElement>);
}

function onFontVariantClear(property: FontVariantProperty) {
  emit('update', {
    [LYRIC_FONT_VARIANT_FIELDS[property]]: null,
  } as Partial<NoteElement>);
}

function clearParagraphStyleFormatting() {
  emit('update', {
    lyricsColor: null,
    lyricsFontFamily: null,
    lyricsFontSize: null,
    lyricsFontStyle: null,
    lyricsFontVariantCaps: null,
    lyricsFontVariantNumeric: null,
    lyricsFontVariantLigatures: null,
    lyricsStrokeWidth: null,
    lyricsStrokeColor: null,
    lyricsTextDecoration: null,
  } as Partial<NoteElement>);
}

function openParagraphStylesDialog() {
  emit('open-paragraph-styles-dialog', props.element.lyricsParagraphStyleId);
}
</script>
