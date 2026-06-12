<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' })
    }}</FieldLegend>
    <FieldGroup>
      <Field orientation="horizontal">
        <FieldLabel for="properties-tempo-bpm">{{
          $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputBpm
          id="properties-tempo-bpm"
          :model-value="element.bpm"
          @update:model-value="
            $emit('update', { bpm: $event } as Partial<TempoElement>)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-tempo-space-after">{{
          $t(($) => $.toolbar.common.spaceAfter, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-tempo-space-after"
          unit="pt"
          :min="-spaceAfterMax"
          :max="spaceAfterMax"
          :step="0.5"
          :format-options="fraction2FormatOptions"
          :model-value="element.spaceAfter"
          @update:model-value="
            $emit('update', { spaceAfter: $event } as Partial<TempoElement>)
          "
        />
      </Field>
    </FieldGroup>
  </FieldSet>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputBpm from '@/components/InputBpm.vue';
import InputUnit from '@/components/InputUnit.vue';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import type { TempoElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const props = defineProps({
  element: {
    type: Object as PropType<TempoElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

defineEmits(['update']);

const spaceAfterMax = computed(() =>
  Math.round(Unit.toPt(props.pageSetup.pageWidth)),
);
</script>
