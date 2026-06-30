<template>
  <PaneAccordion
    :open-sections="openSections"
    @update:open-sections="$emit('update:open-sections', $event)"
  >
    <template #legend>{{
      $t(($) => $.menu.insert.annotation, { ns: 'menu' })
    }}</template>

    <PaneSection
      value="positioning"
      :title="$t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' })"
    >
      <Field orientation="horizontal">
        <FieldLabel for="properties-annotation-left">{{
          $t(($) => $.dialog.common.left, { ns: 'dialog' })
        }}</FieldLabel>
        <InputUnit
          id="properties-annotation-left"
          unit="pt"
          :step="0.5"
          :format-options="fraction2FormatOptions"
          :model-value="element.x"
          @update:model-value="
            $emit('update', { x: $event } as Partial<AnnotationElement>)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-annotation-top">{{
          $t(($) => $.dialog.common.top, { ns: 'dialog' })
        }}</FieldLabel>
        <InputUnit
          id="properties-annotation-top"
          unit="pt"
          :step="0.5"
          :format-options="fraction2FormatOptions"
          :model-value="element.y"
          @update:model-value="
            $emit('update', { y: $event } as Partial<AnnotationElement>)
          "
        />
      </Field>
    </PaneSection>

    <PropertiesRichTextStyle
      id-prefix="properties-annotation"
      :element="element"
      :fonts="fonts"
      :page-setup="pageSetup"
      :paragraph-styles="paragraphStyles"
      show-edit-styles-button
      :fallback-paragraph-style="annotationStyle"
      @open-paragraph-styles-dialog="
        emit('open-paragraph-styles-dialog', $event)
      "
    />
  </PaneAccordion>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import PaneAccordion from '@/components/pane/PaneAccordion.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import { Field, FieldLabel } from '@/components/ui/field';
import type { AnnotationElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import {
  BUILT_IN_PARAGRAPH_STYLE_IDS,
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle.js';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';

import PropertiesRichTextStyle from './PropertiesRichTextStyle.vue';

const props = defineProps({
  element: {
    type: Object as PropType<AnnotationElement>,
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

const annotationStyle = computed(() =>
  resolveParagraphStyle(
    props.paragraphStyles,
    BUILT_IN_PARAGRAPH_STYLE_IDS.Annotation,
  ),
);
</script>
