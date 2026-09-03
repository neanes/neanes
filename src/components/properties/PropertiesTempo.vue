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
  </PaneAccordion>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import InputBpm from '@/components/InputBpm.vue';
import PaneAccordion from '@/components/pane/PaneAccordion.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import { Field, FieldLabel } from '@/components/ui/field';
import type { TempoElement } from '@/models/Element';

defineProps({
  element: {
    type: Object as PropType<TempoElement>,
    required: true,
  },
  openSections: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

defineEmits(['update', 'update:open-sections']);
</script>
