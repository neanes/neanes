<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.menu.insert.annotation, { ns: 'menu' })
    }}</FieldLegend>
    <FieldGroup>
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

      <FieldSeparator />

      <PropertiesRichTextStyle
        id-prefix="properties-annotation"
        :element="element"
        :fonts="fonts"
        :page-setup="pageSetup"
        :default-font-color="pageSetup.textBoxDefaultColor"
        :default-font-size="pageSetup.lyricsDefaultFontSize"
        :default-font-family="pageSetup.textBoxDefaultFontFamily"
      />
    </FieldGroup>
  </FieldSet>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import type { AnnotationElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';

import PropertiesRichTextStyle from './PropertiesRichTextStyle.vue';

defineProps({
  element: {
    type: Object as PropType<AnnotationElement>,
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

defineEmits(['update']);
</script>
