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
      <div class="neume"></div>
      <Neume
        class="neume"
        v-for="(neume, index) in descendingNeumes"
        :key="`descendingNeumes-${index}`"
        :neume="neume"
        @click.native="$emit('select-quantitative-neume', neume)"
      ></Neume>
    </div>
    <div class="row">
      <div class="neume"></div>
      <Neume
        class="neume"
        v-for="(neume, index) in descendingNeumesWithPetasti"
        :key="`descendingNeumesWithPetasti-${index}`"
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
    <div class="row">
      <Neume
        class="neume"
        v-for="(neume, index) in breathNeumes"
        :key="`breathNeumes-${index}`"
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
    QuantitativeNeume.OligonPlusKentimaBelow,
    QuantitativeNeume.OligonPlusKentimaAbove,
    QuantitativeNeume.OligonPlusHypsiliRight,
    QuantitativeNeume.OligonPlusHypsiliLeft,
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaHorizontal,
    QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
    QuantitativeNeume.OligonPlusDoubleHypsili,
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
  ];

  descendingNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.Apostrophos,
    QuantitativeNeume.Elaphron,
    QuantitativeNeume.ElaphronPlusApostrophos,
    QuantitativeNeume.Hamili,
    QuantitativeNeume.HamiliPlusApostrophos,
    QuantitativeNeume.HamiliPlusElaphron,
    QuantitativeNeume.HamiliPlusElaphronPlusApostrophos,
    QuantitativeNeume.DoubleHamili,
  ];

  descendingNeumesWithPetasti: QuantitativeNeume[] = [
    QuantitativeNeume.PetastiPlusApostrophos,
    QuantitativeNeume.PetastiPlusElaphron,
    QuantitativeNeume.PetastiPlusElaphronPlusApostrophos,
    QuantitativeNeume.RunningElaphron,
    QuantitativeNeume.Hyporoe,
  ];

  combinationNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.OligonPlusKentemata,
    QuantitativeNeume.KentemataPlusOligon,
    QuantitativeNeume.OligonPlusIsonPlusKentemata,
    QuantitativeNeume.OligonPlusApostrophosPlusKentemata,
    QuantitativeNeume.OligonPlusElaphronPlusKentemata,
    QuantitativeNeume.OligonPlusElaphronPlusApostrophosPlusKentemata,
    QuantitativeNeume.OligonPlusHamiliPlusKentemata,
    QuantitativeNeume.OligonPlusKentima,
    QuantitativeNeume.Kentemata,
  ];

  breathNeumes: QuantitativeNeume[] = [
    QuantitativeNeume.VareiaDotted,
    QuantitativeNeume.Cross,
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

  border: 0.5px solid black;
  cursor: default;

  min-width: 2.5rem;
}
</style>
