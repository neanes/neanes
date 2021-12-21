<template>
  <div class="mode-key-container" :style="style">
    <Neume :neume="ModeSign.Ekhos"></Neume>
    <Neume v-if="element.isPlagal" :neume="ModeSign.Plagal"></Neume>
    <Neume v-if="element.isVarys" :neume="ModeSign.Varys"></Neume>
    <template v-for="(neume, index) in element.martyrias">
      <Neume :neume="neume" :key="index" :offset="getModeSignOffset(neume)" />
    </template>
    <Neume v-if="hasNote" :neume="element.note"></Neume>
    <Neume
      v-if="hasFthora"
      :neume="element.fthora"
      :offset="getFthoraOffset(element.fthora)"
    ></Neume>
    <Neume v-if="hasNote2" :neume="element.note2"></Neume>
    <Neume
      v-if="hasQuantitativeNeumeTop"
      :neume="element.quantitativeNeumeTop"
    ></Neume>
    <Neume
      v-if="hasQuantitativeNeumeRight"
      :neume="element.quantitativeNeumeRight"
      :offset="quantitativeNeumeRightOffset"
    ></Neume>
    <Neume
      v-if="hasFthora2"
      :neume="element.fthora2"
      :offset="getFthoraOffset(element.fthora2)"
    ></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ModeKeyElement } from '@/models/Element';
import Neume from '@/components/Neume.vue';
import { Fthora, ModeSign } from '@/models/Neumes';
import {
  getFthoraAdjustments,
  getModeSignAdjustments,
  getQuantitativeNeumeAdjustments,
  NeumeAdjustmentOffset,
} from '@/models/NeumeAdjustments';

@Component({
  components: {
    Neume,
  },
})
export default class ModeKey extends Vue {
  @Prop() element!: ModeKeyElement;
  ModeSign = ModeSign;

  get hasFthora() {
    return this.element.fthora != null;
  }

  get hasNote() {
    return this.element.note != null;
  }

  get hasNote2() {
    return this.element.note2 != null;
  }

  get hasFthora2() {
    return this.element.fthora2 != null;
  }

  get hasQuantitativeNeumeTop() {
    return this.element.quantitativeNeumeTop != null;
  }

  get hasQuantitativeNeumeRight() {
    return this.element.quantitativeNeumeRight != null;
  }

  get style() {
    return {
      color: this.element.color,
      fontSize: this.element.fontSize + 'px',
      textAlign: this.element.alignment,
    } as CSSStyleDeclaration;
  }

  getFthoraOffset(fthora: Fthora) {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getFthoraAdjustments(fthora);

    if (adjustments) {
      const adjustment = adjustments.find((x) =>
        x.isPairedWith.includes(this.element.note!),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }

  get quantitativeNeumeRightOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getQuantitativeNeumeAdjustments(
      this.element.quantitativeNeumeRight!,
    );

    if (adjustments) {
      const adjustment = adjustments.find(
        (x) =>
          x.isPairedWith.includes(this.element.note!) ||
          this.element.martyrias.some((y) => x.isPairedWith.includes(y)),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }

  getModeSignOffset(neume: ModeSign) {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getModeSignAdjustments(neume);

    if (adjustments) {
      const adjustment = adjustments.find((x) =>
        x.isPairedWith.includes(this.element.note!),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }
}
</script>

<style scoped>
.mode-key-container {
  width: 624px;
  border: 1px dotted black;
  box-sizing: border-box;
}
</style>
