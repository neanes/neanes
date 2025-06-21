<template>
  <div class="neume-combo-selector-panel">
    <div
      class="row"
      v-for="(combo, index) in combos"
      :key="index"
      @click="$emit('select-neume-combo', combo)"
    >
      <SyllableNeumeBox
        v-for="(neume, index) in combo.elements"
        :key="index"
        :note="neume"
        :pageSetup="pageSetup"
        class="neume"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import {
  NeumeCombination,
  NeumeCommonCombinations,
} from '@/models/NeumeCommonCombinations';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: { SyllableNeumeBox },
  emits: ['select-neume-combo'],
})
export default class NeumeComboSelector extends Vue {
  @Prop() pageSetup!: PageSetup;

  combos: NeumeCombination[] = [
    NeumeCommonCombinations.ending1,
    NeumeCommonCombinations.ending2,
    NeumeCommonCombinations.ornament1,
    NeumeCommonCombinations.ornament1Alt,
  ];
}
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

.row:hover {
  background-color: aliceblue;
}
</style>
