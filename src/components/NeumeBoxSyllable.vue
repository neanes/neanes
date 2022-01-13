<template>
  <div class="neume" :style="style">
    <Neume
      v-if="hasVocalExpressionNeume && isVareia(note.vocalExpressionNeume)"
      :neume="note.vocalExpressionNeume"
    ></Neume>
    <Neume
      :neume="note.quantitativeNeume"
      :offset="quantitativeNeumeOffset"
    ></Neume>
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
      v-if="hasHyporoeGorgonNeume"
      :neume="note.hyporoeGorgonNeume"
      :offset="hyporoeGorgonNeumeOffset"
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
      v-if="hasNoteIndicator"
      :neume="note.noteIndicator"
      :offset="noteIndicatorOffset"
      :style="noteIndicatorStyle"
    ></Neume>
    <Neume
      v-if="hasIson"
      :neume="note.ison"
      :offset="isonOffset"
      :style="isonStyle"
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
import { NoteElement } from '@/models/Element';
import { QuantitativeNeume, VocalExpressionNeume } from '@/models/Neumes';
import {
  getFthoraAdjustments,
  getGorgonAdjustments,
  getTimeAdjustments,
  getVocalExpressionAdjustments,
  getAccidentalAdjustments,
  NeumeAdjustmentOffset,
  getMeasureNumberAdjustments,
  getNoteIndicatorAdjustments,
  getIsonAdjustments,
  hyporoeGorgonOffset,
} from '@/models/NeumeAdjustments';
import Neume from '@/components/Neume.vue';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';
import { TextMeasurementService } from '@/services/TextMeasurementService';

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

  get hasHyporoeGorgonNeume() {
    return this.note.hyporoeGorgonNeume != null;
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

  get hasNoteIndicator() {
    return this.note.noteIndicator != null;
  }

  get hasIson() {
    return this.note.ison != null;
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

  get noteIndicatorStyle() {
    return {
      color: this.pageSetup.noteIndicatorDefaultColor,
    } as CSSStyleDeclaration;
  }

  get isonStyle() {
    return {
      color: this.pageSetup.isonDefaultColor,
    } as CSSStyleDeclaration;
  }

  get quantitativeNeumeOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    // This is a special case to handle the hyporoe+kentemata neume
    if (
      this.note.quantitativeNeume ===
      QuantitativeNeume.OligonPlusHyporoePlusKentemata
    ) {
      offset = { x: 0, y: -2.5 };
    }

    if (
      [
        QuantitativeNeume.OligonPlusIson,
        QuantitativeNeume.OligonPlusElaphron,
        QuantitativeNeume.OligonPlusElaphronPlusApostrophos,
        QuantitativeNeume.OligonPlusHypsili,
        QuantitativeNeume.PetastiPlusHyporoe,
      ].includes(this.note.quantitativeNeume)
    ) {
      offset = { x: 0, y: -8 };
    }

    return offset;
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

  get hyporoeGorgonNeumeOffset() {
    return hyporoeGorgonOffset;
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

  get noteIndicatorOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getNoteIndicatorAdjustments(this.note.noteIndicator!);

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

  get isonOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getIsonAdjustments(this.note.ison!);

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
