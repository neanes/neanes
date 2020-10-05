<template>
  <div class="neume">
    <Neume 
      v-if="hasVocalExpressionNeume && isVareia(note.vocalExpressionNeume.neume)" :neume="note.vocalExpressionNeume.neume"></Neume>
    <Neume :neume="note.quantitativeNeume.neume"></Neume>
    <TimeNeumeBox
      v-if="hasTimeNeume"
      :element="note.timeNeume"
      :style="timeNeumeStyle"
      :class="[ 
        { high: isHighNeume(note.quantitativeNeume.neume) }, 
        { red: isRedNeume(note.timeNeume.neume) } ]"></TimeNeumeBox>
    <Neume 
      v-if="hasFthora"
      :neume="note.fthora.neume"
      class="red"></Neume>
    <Neume 
      v-if="hasVocalExpressionNeume && !isVareia(note.vocalExpressionNeume.neume)"
      :neume="note.vocalExpressionNeume.neume"
      :class="[{ red: isRedNeume(note.vocalExpressionNeume.neume) } ]"></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { QuantitativeNeume, TimeNeume, isHighNeume, isRedNeume, VocalExpressionNeume } from '@/models/Neumes';
import { neumeMap } from '@/models/NeumeMappings';
import Neume from '@/components/Neume.vue';
import TimeNeumeBox from '@/components/TimeNeume.vue';

@Component({
  components: {
    Neume,
    TimeNeumeBox,
  }
})
export default class NeumeBoxSyllable extends Vue {
  @Prop() note!: NoteElement;

  get hasVocalExpressionNeume() {
    return this.note.vocalExpressionNeume != null;
  }

  get hasTimeNeume() {
    return this.note.timeNeume != null;
  }

  get hasFthora() {
    return this.note.fthora != null;
  }

  get timeNeumeStyle() {
    const style = {} as CSSStyleDeclaration;
    
    switch(this.note.timeNeume!.neume) {
      case TimeNeume.Gorgon_Top:
        if (this.note.quantitativeNeume.neume === QuantitativeNeume.Apostrophos) {
          style.position = 'relative';
          style.left = '0.6rem';
        }
        break;
      case TimeNeume.Klasma_Top:
        if (this.note.quantitativeNeume.neume === QuantitativeNeume.Apostrophos) {
          style.position = 'relative';
          style.left = '0.5rem';
        }
        break;
    }
    console.log(style);
    return style;
  }

  isHighNeume(neume: QuantitativeNeume) {
    return isHighNeume(neume);
  }

  isRedNeume(neume: VocalExpressionNeume) {
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
    cursor: default;
}

.red {
    color: #ED0000;
}

.high {
    position: relative;
    top: -0.30rem;
}
</style>
