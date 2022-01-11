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
    ></Neume>
    <Neume
      v-if="hasGorgonNeume"
      :neume="note.gorgonNeume"
      :offset="gorgonNeumeOffset"
      :style="gorgonStyle"
    ></Neume>
    <Neume
      v-if="hasFthora"
      :neume="note.fthora"
      :offset="fthoraOffset"
      :style="fthoraStyle"
    ></Neume>
    <Neume
      v-if="hasAccidental"
      :neume="note.accidental"
      :offset="accidentalOffset"
      :style="accidentalStyle"
    ></Neume>
    <Neume
      v-if="hasVocalExpressionNeume && !isVareia(note.vocalExpressionNeume)"
      :neume="note.vocalExpressionNeume"
      :offset="vocalExpressionNeumeOffset"
      :style="vocalExpressionStyle"
    ></Neume>
    <Neume
      v-if="hasMeasureNumber"
      :neume="note.measureNumber"
      :offset="measureNumberOffset"
      :style="measureNumberStyle"
    ></Neume>
    <Neume
      v-if="hasMeasureBar"
      :neume="note.measureBar"
      :style="measureBarStyle"
    ></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement, ScoreElementOffset } from '@/models/Element';
import { VocalExpressionNeume } from '@/models/Neumes';
import {
  getFthoraAdjustments,
  getGorgonAdjustments,
  getTimeAdjustments,
  getVocalExpressionAdjustments,
  getAccidentalAdjustments,
  NeumeAdjustmentOffset,
  getMeasureNumberAdjustments,
} from '@/models/NeumeAdjustments';
import Neume from '@/components/Neume.vue';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: {
    Neume,
  },
})
export default class NeumeBoxSyllable extends Vue {
  @Prop() note!: NoteElement;
  @Prop() pageSetup!: PageSetup;

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

  get hasMeasureNumber() {
    return this.note.measureNumber != null;
  }

  get style() {
    return {
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
      color: this.pageSetup.neumeDefaultColor,
    } as CSSStyleDeclaration;
  }

  get gorgonStyle() {
    return {
      color: this.pageSetup.gorgonDefaultColor,
    } as CSSStyleDeclaration;
  }

  get fthoraStyle() {
    return {
      color: this.pageSetup.fthoraDefaultColor,
    } as CSSStyleDeclaration;
  }

  get accidentalStyle() {
    return {
      color: this.pageSetup.accidentalDefaultColor,
    } as CSSStyleDeclaration;
  }

  get measureBarStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
    } as CSSStyleDeclaration;
  }

  get measureNumberStyle() {
    return {
      color: this.pageSetup.measureNumberDefaultColor,
    } as CSSStyleDeclaration;
  }

  get vocalExpressionStyle() {
    if (this.note.vocalExpressionNeume === VocalExpressionNeume.Heteron) {
      return {
        color: this.pageSetup.heteronDefaultColor,
      } as CSSStyleDeclaration;
    }

    return null;
  }

  get timeNeumeOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getTimeAdjustments(this.note.timeNeume!);

    if (adjustments) {
      const adjustment = adjustments.find((x) =>
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
      const adjustment = adjustments.find((x) =>
        x.isPairedWith.includes(this.note.quantitativeNeume),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }

  get fthoraOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getFthoraAdjustments(this.note.fthora!);

    if (adjustments) {
      const adjustment = adjustments.find((x) =>
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
      const adjustment = adjustments.find((x) =>
        x.isPairedWith.includes(this.note.quantitativeNeume),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }

  get accidentalOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getAccidentalAdjustments(this.note.accidental!);

    if (adjustments) {
      const adjustment = adjustments.find((x) =>
        x.isPairedWith.includes(this.note.quantitativeNeume),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }

  get measureNumberOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getMeasureNumberAdjustments(this.note.measureNumber!);

    if (adjustments) {
      const adjustment = adjustments.find((x) =>
        x.isPairedWith.includes(this.note.quantitativeNeume),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
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
  user-select: none;
}

.red {
  color: #ed0000;
}

.high {
  position: relative;
  top: -0.3rem;
}
</style>
