<template>
  <div class="tempo-toolbar">
    <div class="row">
      <div class="form-group">
        <Label for="toolbar-tempo-bpm" class="mr-2">{{
          $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
        }}</Label>
        <InputBpm
          id="toolbar-tempo-bpm"
          :model-value="element.bpm"
          @update:model-value="
            $emit('update', { bpm: $event } as Partial<TempoElement>)
          "
        />
      </div>

      <span class="space" />

      <div class="form-group">
        <Label for="toolbar-tempo-space-after" class="mr-2">{{
          $t(($) => $.toolbar.common.spaceAfter, { ns: 'toolbar' })
        }}</Label>
        <InputUnit
          id="toolbar-tempo-space-after"
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
      </div>
      <span class="space"></span>
      <Label for="toolbar-tempo-section-name" class="mr-2">{{
        $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
      }}</Label>
      <Input
        id="toolbar-tempo-section-name"
        class="w-auto bg-background"
        type="text"
        :model-value="element.sectionName ?? ''"
        @change="
          $emit('update:sectionName', ($event.target as HTMLInputElement).value)
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TempoElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

import InputBpm from './InputBpm.vue';
import InputUnit from './InputUnit.vue';

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

defineEmits(['update', 'update:sectionName']);

const spaceAfterMax = computed(() =>
  Math.round(Unit.toPt(props.pageSetup.pageWidth)),
);
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.tempo-toolbar {
  background-color: var(--color-legacy-chrome-menu-surface);

  padding: 0.25rem;

  --btn-size: 32px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.space {
  width: 16px;
}
</style>
