<template>
  <div class="neume-selector-panel">
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in ascendingNeumes"
        :key="`ascendingNeumes-${index}`"
        :neume="neume"
        @click.native="$emit('select-quantitative-neume', neume)"
      ></Neume>
    </div>
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in ascendingNeumesWithPetasti"
        :key="`ascendingNeumesWithPetasti-${index}`"
        :neume="neume"
        @click.native="$emit('select-quantitative-neume', neume)"
      ></Neume>
    </div>
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in descendingNeumes"
        :key="`descendingNeumes-${index}`"
        :neume="neume"
        @click.native="$emit('select-quantitative-neume', neume)"
      ></Neume>
    </div>
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in combinationNeumes"
        :key="`combinationNeumes-${index}`"
        :neume="neume"
        @click.native="$emit('select-quantitative-neume', neume)"
      ></Neume>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { QuantitativeNeume } from '@/models/Neumes';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import Neume from '@/components/Neume.vue';

@Component({
  components: {
    SyllableNeumeBox,
    Neume,
  },
})
export default class NeumeSelector extends Vue {
  ison: QuantitativeNeume = QuantitativeNeume.Ison;

  ascendingNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.Ison,
    QuantitativeNeume.Oligon,
    QuantitativeNeume.OligonPlusKentima,
    QuantitativeNeume.OligonPlusKentimaBelow,
    QuantitativeNeume.OligonPlusKentimaAbove,
    QuantitativeNeume.OligonPlusHypsiliRight,
    QuantitativeNeume.OligonPlusHypsiliLeft,
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
    QuantitativeNeume.OligonPlusDoubleHypsili,
    QuantitativeNeume.VareiaDotted,
    QuantitativeNeume.Cross,
  ];

  ascendingNeumesWithPetasti: QuantitativeNeume[] = [
    QuantitativeNeume.PetastiWithIson,
    QuantitativeNeume.Petasti,
    QuantitativeNeume.PetastiPlusOligon,
    QuantitativeNeume.PetastiPlusKentimaAbove,
    QuantitativeNeume.PetastiPlusHypsiliRight,
    QuantitativeNeume.PetastiPlusHypsiliLeft,
    QuantitativeNeume.PetastiPlusHypsiliPlusKentimaHorizontal,
    QuantitativeNeume.PetastiPlusHypsiliPlusKentimaVertical,
    QuantitativeNeume.PetastiPlusDoubleHypsili,
    QuantitativeNeume.PetastiPlusApostrophos,
    QuantitativeNeume.PetastiPlusElaphron,
    QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
  ];

  descendingNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.IsonPlusApostrophos,
    QuantitativeNeume.Apostrophos,
    QuantitativeNeume.DoubleApostrophos,
    QuantitativeNeume.RunningElaphron,
    QuantitativeNeume.Hyporoe,
    QuantitativeNeume.Elaphron,
    QuantitativeNeume.ElaphronPlusApostrophos,
    QuantitativeNeume.Hamili,
    QuantitativeNeume.HamiliPlusApostrophos,
    QuantitativeNeume.HamiliPlusElaphron,
    QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
    QuantitativeNeume.DoubleHamili,
  ];

  combinationNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.Kentemata,
    QuantitativeNeume.OligonPlusKentemata,
    QuantitativeNeume.KentemataPlusOligon,
    QuantitativeNeume.OligonPlusIsonPlusKentemata,
    QuantitativeNeume.OligonPlusKentemataPlusHypsiliRight,
    QuantitativeNeume.OligonPlusKentemataPlusHypsiliLeft,
    QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
    QuantitativeNeume.OligonPlusElaphronPlusKentemata,
    QuantitativeNeume.OligonPlusRunningElaphronPlusKentemata,
    QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
    QuantitativeNeume.OligonPlusHamiliPlusKentemata,
  ];
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume-selector-panel {
  display: flex;
}

.row {
  display: flex;
  flex-direction: column;
}

.neume {
  font-size: 1.6rem;

  text-align: center;

  cursor: default;
  user-select: none;

  min-width: 2.5rem;
  height: 2.5rem;
}

.neume:hover {
  background-color: aliceblue;
}
</style>
