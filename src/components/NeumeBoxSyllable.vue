<template>
  <div class="neume" :style="style">
    <Neume 
      v-if="hasVocalExpressionNeume && isVareia(note.vocalExpressionNeume.neume)" :neume="note.vocalExpressionNeume.neume"></Neume>
    <Neume :neume="note.quantitativeNeume.neume"></Neume>
    <Neume
      v-if="hasTimeNeume"
      :neume="note.timeNeume.neume"
      :offset="timeNeumeOffset"
      :class="[ 
        { red: isRedNeume(note.timeNeume.neume) } ]"></Neume>
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
      :offset="vocalExpressionNeumeOffset"
      :class="[{ red: isRedNeume(note.vocalExpressionNeume.neume) } ]"></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement, ScoreElementOffset } from '@/models/Element';
import { QuantitativeNeume, isRedNeume, VocalExpressionNeume } from '@/models/Neumes';
import { getGorgonAdjustments, getTimeAdjustments, getVocalExpressionAdjustments, NeumeAdjustmentOffset } from '@/models/NeumeAdjustments';
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

  get timeNeumeOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

      const adjustments = getTimeAdjustments(this.note.timeNeume!.neume);

      if (adjustments) {
        const adjustment = adjustments.find(x => x.isPairedWith.includes(this.note.quantitativeNeume.neume));

        if (adjustment) {
          offset = adjustment.offset;
        }
      }

    return offset;
  }

  get gorgonNeumeOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

      const adjustments = getGorgonAdjustments(this.note.gorgonNeume!.neume);

      if (adjustments) {
        const adjustment = adjustments.find(x => x.isPairedWith.includes(this.note.quantitativeNeume.neume));

        if (adjustment) {
          offset = adjustment.offset;
        }
      }

    return offset;
  }

  get vocalExpressionNeumeOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

      const adjustments = getVocalExpressionAdjustments(this.note.vocalExpressionNeume!.neume);

      if (adjustments) {
        const adjustment = adjustments.find(x => x.isPairedWith.includes(this.note.quantitativeNeume.neume));

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
