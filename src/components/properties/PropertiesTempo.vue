<template>
  <PaneAccordion
    :open-sections="openSections"
    @update:open-sections="$emit('update:open-sections', $event)"
  >
    <template #legend>{{
      $t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' })
    }}</template>

    <PaneSection
      value="tempo"
      :title="$t(($) => $.toolbar.common.tempoSign, { ns: 'toolbar' })"
    >
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
    </PaneSection>

    <PaneSection
      value="positioning"
      :title="$t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' })"
    >
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
    </PaneSection>
  </PaneAccordion>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputBpm from '@/components/InputBpm.vue';
import InputUnit from '@/components/InputUnit.vue';
import PaneAccordion from '@/components/pane/PaneAccordion.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import { Field, FieldLabel } from '@/components/ui/field';
import type { TempoElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const props = defineProps({
  element: {
    type: Object as PropType<TempoElement>,
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
});

defineEmits(['update', 'update:open-sections']);

const spaceAfterMax = computed(() =>
  Math.round(Unit.toPt(props.pageSetup.pageWidth)),
);
</script>
