<template>
  <div class="neume">
    <Neume 
      v-if="hasVocalExpressionNeume && isVareia(neume.vocalExpressionNeume)" :neume="neume.vocalExpressionNeume"></Neume>
    <Neume :neume="neume.quantitativeNeume"></Neume>
    <Neume 
      v-if="hasTimeNeume"
      :neume="neume.timeNeume"
      :style="timeNeumeStyle"
      :class="[ 
        { high: isHighNeume(neume.quantitativeNeume) }, 
        { red: isRedNeume(neume.timeNeume) } ]"></Neume>
    <Neume 
      v-if="hasFthora"
      :neume="neume.fthora"
      class="red"></Neume>
    <Neume 
      v-if="hasVocalExpressionNeume && !isVareia(neume.vocalExpressionNeume)"
      :neume="neume.vocalExpressionNeume"
      :class="[{ red: isRedNeume(neume.vocalExpressionNeume) } ]"></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { QuantitativeNeume, TimeNeume, isHighNeume, isRedNeume, VocalExpressionNeume } from '../models/Neumes';
import { neumeMap } from '@/models/NeumeMappings';
import Neume from '@/components/Neume.vue';

@Component({
  components: {
    Neume
  }
})
export default class NeumeBoxSyllable extends Vue {
  @Prop() neume!: NoteElement;

  get hasVocalExpressionNeume() {
    return this.neume.vocalExpressionNeume != null;
  }

  get hasTimeNeume() {
    return this.neume.timeNeume != null;
  }

  get hasFthora() {
    return this.neume.fthora != null;
  }

  get quantitativeNeumeMapping() {
    return neumeMap.get(this.neume.quantitativeNeume!)!;
  }

  get timeNeumeMapping() {
    return neumeMap.get(this.neume.timeNeume!)!;
  }

  get quantitativeNeumeStyle() {
    const style = {
      fontFamily: this.quantitativeNeumeMapping.fontFamily
    } as CSSStyleDeclaration;

    return style;
  }

  get timeNeumeStyle() {
    const style = {
      fontFamily: this.timeNeumeMapping.fontFamily
    } as CSSStyleDeclaration;
    
    switch(this.neume.timeNeume) {
      case TimeNeume.Gorgon_Top:
        if (this.neume.quantitativeNeume == QuantitativeNeume.Apostrophos) {
          style.position = 'relative';
          style.left = '0.6rem';
        }
        break;
      case TimeNeume.Klasma_Top:
        if (this.neume.quantitativeNeume == QuantitativeNeume.Apostrophos) {
          style.position = 'relative';
          style.left = '0.5rem';
        }
        break;
    }
  
    return style;
  }

  isHighNeume(neume: QuantitativeNeume) {
    return isHighNeume(neume);
  }

  isRedNeume(neume: TimeNeume) {
    return isRedNeume(neume);
  }

  isVareia(neume: VocalExpressionNeume) {
    return neume == VocalExpressionNeume.Vareia;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.neume {
    font-size: 1.6rem;
}

.red {
    color: #ED0000;
}

.high {
    position: relative;
    top: -0.30rem;
}
</style>
