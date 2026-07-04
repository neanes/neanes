<template>
  <div class="neume-combo-selector-panel">
    <div
      v-for="(combo, index) in combos"
      :key="index"
      class="row chrome-list-item"
      @click="$emit('select-neume-combo', combo)"
    >
      <SyllableNeumeBox
        v-for="(neume, neumeIndex) in combo.elements"
        :key="neumeIndex"
        :note="neume"
        :page-setup="pageSetup"
        class="neume"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import type { NeumeCombination } from '@/models/NeumeCommonCombinations';
import { NeumeCommonCombinations } from '@/models/NeumeCommonCombinations';
import type { PageSetup } from '@/models/PageSetup';

defineEmits(['select-neume-combo']);
defineProps({
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const combos: NeumeCombination[] = [
  NeumeCommonCombinations.ending1,
  NeumeCommonCombinations.ending2,
  NeumeCommonCombinations.ornament1,
  NeumeCommonCombinations.ornament1Alt,
];
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.row {
  display: flex;
  align-items: center;
  justify-content: center;
}

.neume {
  margin: 0 0.125rem;
  --zoom: 1;
}
</style>
