<template>
  <div class="neume" :style="style">
    <Neume
      v-if="hasVocalExpressionNeume && isVareia(note.vocalExpressionNeume)"
      :neume="note.vocalExpressionNeume"
    ></Neume>
    <Neume :neume="note.quantitativeNeume"></Neume>
    <Neume
      v-if="hasTimeNeume"
      :neume="note.timeNeume"
      :offset="timeNeumeOffset"
      :class="[{ red: isRedNeume(note.timeNeume) }]"
    ></Neume>
    <Neume
      v-if="hasGorgonNeume"
      :neume="note.gorgonNeume"
      :offset="gorgonNeumeOffset"
      :class="[{ red: isRedNeume(note.gorgonNeume) }]"
    ></Neume>
    <Neume v-if="hasFthora" :neume="note.fthora" class="red"></Neume>
    <Neume v-if="hasAccidental" :neume="note.accidental" class="red"></Neume>
    <Neume
      v-if="hasVocalExpressionNeume && !isVareia(note.vocalExpressionNeume)"
      :neume="note.vocalExpressionNeume"
      :offset="vocalExpressionNeumeOffset"
      :class="[{ red: isRedNeume(note.vocalExpressionNeume) }]"
    ></Neume>
    <Neume v-if="hasMeasureBar" :neume="note.measureBar" class="red"></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement, ScoreElementOffset } from '@/models/Element';
import {
  QuantitativeNeume,
  isRedNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import {
  getGorgonAdjustments,
  getTimeAdjustments,
  getVocalExpressionAdjustments,
  NeumeAdjustmentOffset,
} from '@/models/NeumeAdjustments';
import Neume from '@/components/Neume.vue';
import { store } from '@/store';

@Component({
  components: {
    Neume,
  },
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

  get hasMeasureBar() {
    return this.note.measureBar != null;
  }

  get style() {
    return {
      fontSize: this.pageSetup.neumeDefaultFontSize + 'px',
    } as CSSStyleDeclaration;
  }

  get timeNeumeOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getTimeAdjustments(this.note.timeNeume!);

    if (adjustments) {
      const adjustment = adjustments.find(x =>
        x.isPairedWith.includes(this.note.quantitativeNeume),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }

  get gorgonNeumeOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getGorgonAdjustments(this.note.gorgonNeume!);

    if (adjustments) {
      const adjustment = adjustments.find(x =>
        x.isPairedWith.includes(this.note.quantitativeNeume),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }

  get vocalExpressionNeumeOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getVocalExpressionAdjustments(
      this.note.vocalExpressionNeume!,
    );

    if (adjustments) {
      const adjustment = adjustments.find(x =>
        x.isPairedWith.includes(this.note.quantitativeNeume),
      );

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
  color: #ed0000;
}

.high {
  position: relative;
  top: -0.3rem;
}
</style>
