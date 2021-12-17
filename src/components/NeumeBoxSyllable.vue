<template>
  <div class="neume" :style="style">
    <Neume 
      v-if="hasVocalExpressionNeume && isVareia(note.vocalExpressionNeume.neume)" :neume="note.vocalExpressionNeume.neume"></Neume>
    <Neume :neume="note.quantitativeNeume.neume"></Neume>
    <TimeNeumeBox
      v-if="hasTimeNeume"
      :element="note.timeNeume"
      :style="timeNeumeStyle"
      :class="[ 
        { red: isRedNeume(note.timeNeume.neume) } ]"></TimeNeumeBox>
    <Neume
      v-if="hasGorgonNeume"
      :neume="note.gorgonNeume.neume"
      :offset="gorgonNeumeOffset"
      :class="[ 
        { red: isRedNeume(note.gorgonNeume.neume) } ]"></Neume>
    <Neume 
      v-if="hasFthora"
      :neume="note.fthora.neume"
      class="red"></Neume>
    <Neume 
      v-if="hasAccidental"
      :neume="note.accidental.neume"
      class="red"></Neume>
    <Neume 
      v-if="hasVocalExpressionNeume && !isVareia(note.vocalExpressionNeume.neume)"
      :neume="note.vocalExpressionNeume.neume"
      :class="[{ red: isRedNeume(note.vocalExpressionNeume.neume) } ]"></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement, ScoreElementOffset } from '@/models/Element';
import { QuantitativeNeume, isRedNeume, VocalExpressionNeume } from '@/models/Neumes';
import { getGorgonAdjustments, NeumeAdjustmentOffset } from '@/models/NeumeAdjustments';
import Neume from '@/components/Neume.vue';
import TimeNeumeBox from '@/components/TimeNeume.vue';
import { store } from '@/store';

@Component({
  components: {
    Neume,
    TimeNeumeBox,
  }
})
export default class NeumeBoxSyllable extends Vue {
  @Prop() note!: NoteElement;

  get pageSetup() {
    return store.state.score.pageSetup;
  }

  get hasVocalExpressionNeume() {
    return this.note.vocalExpressionNeume != null;
  }

  get hasTimeNeume() {
    return this.note.timeNeume != null;
  }

  get hasGorgonNeume() {
    return this.note.gorgonNeume != null;
  }

  get hasFthora() {
    return this.note.fthora != null;
  }

  get hasAccidental() {
    return this.note.accidental != null;
  }

  get style() {
    return {
      fontSize: this.pageSetup.neumeDefaultFontSize + 'px',
    } as CSSStyleDeclaration;
  }

  get timeNeumeStyle() {
    const style = {} as CSSStyleDeclaration;
    
    // switch(this.note.timeNeume!.neume) {
    //   case TimeNeume.Gorgon_Top:
    //     if (this.note.quantitativeNeume.neume === QuantitativeNeume.Apostrophos) {
    //       style.position = 'relative';
    //       style.left = '0.6rem';
    //     }
    //     break;
    //   case TimeNeume.Klasma_Top:
    //     if (this.note.quantitativeNeume.neume === QuantitativeNeume.Apostrophos) {
    //       style.position = 'relative';
    //       style.left = '0.5rem';
    //     }
    //     break;
    // }

    return style;
  }

  get gorgonNeumeOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

      const adjustments = getGorgonAdjustments(this.note.gorgonNeume!.neume);

      if (adjustments) {
        const adjustment = adjustments.find(x => x.isPairedWith === this.note.quantitativeNeume.neume);

        if (adjustment) {
          offset = adjustment.offset;
        }
      }

    return offset;
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
