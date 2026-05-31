<template>
  <div class="tempo-toolbar">
    <div class="row">
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
        }}</label>
        <InputBpm
          :model-value="element.bpm"
          @update:model-value="
            $emit('update', { bpm: $event } as Partial<TempoElement>)
          "
        />
      </div>

      <span class="space" />

      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.common.spaceAfter, { ns: 'toolbar' })
        }}</label>
        <InputUnit
          unit="pt"
          :min="-spaceAfterMax"
          :max="spaceAfterMax"
          :step="0.5"
          :precision="2"
          :model-value="element.spaceAfter"
          @update:model-value="
            $emit('update', { spaceAfter: $event } as Partial<TempoElement>)
          "
        />
      </div>
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
        }}</label>
        <input
          type="text"
          :value="element.sectionName"
          @change="
            $emit(
              'update:sectionName',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, PropType } from 'vue';

import { TempoElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
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
  background-color: lightgray;

  padding: 0.25rem;

  --btn-size: 32px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

label.right-space {
  margin-right: 0.5rem;
}

.space {
  width: 16px;
}
</style>
