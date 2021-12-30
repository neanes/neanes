<template>
  <div class="neume" :style="style">
    <template v-if="neume.error"> ? </template>
    <template v-else>
      <Neume :neume="neume.note"></Neume>
      <Neume :neume="neume.rootSign" :offset="rootSignOffset"></Neume>
      <Neume
        v-if="hasFthora"
        :neume="neume.fthora"
        :offset="fthoraOffset"
      ></Neume>
      <Neume v-if="neume.apostrophe" :neume="Note.Apostrophe"></Neume>
      <Neume v-if="hasMeasureBar" :neume="neume.measureBar" class="red"></Neume>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaElement } from '@/models/Element';
import { neumeMap } from '@/models/NeumeMappings';
import Neume from '@/components/Neume.vue';
import { Note } from '@/models/Neumes';
import {
  getFthoraAdjustments,
  getRootSignAdjustments,
  NeumeAdjustmentOffset,
} from '@/models/NeumeAdjustments';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: {
    Neume,
  },
})
export default class NeumeBoxMartyria extends Vue {
  @Prop() neume!: MartyriaElement;
  @Prop() pageSetup!: PageSetup;

  Note = Note;

  get noteMapping() {
    return neumeMap.get(this.neume.note!)!;
  }

  get rootSignMapping() {
    return neumeMap.get(this.neume.rootSign!)!;
  }

  get hasFthora() {
    return this.neume.fthora != null;
  }

  get hasMeasureBar() {
    return this.neume.measureBar != null;
  }

  get style() {
    return {
      color: this.pageSetup.martyriaDefaultColor,
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
    } as CSSStyleDeclaration;
  }

  get rootSignOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getRootSignAdjustments(this.neume.rootSign!);

    if (adjustments) {
      const adjustment = adjustments.find((x) =>
        x.isPairedWith.includes(this.neume.note),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }

  get fthoraOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getFthoraAdjustments(this.neume.fthora!);

    if (adjustments) {
      const adjustment = adjustments.find(
        (x) =>
          x.isPairedWith.includes(this.neume.rootSign) ||
          x.isPairedWith.includes(this.neume.note),
      );

      if (adjustment) {
        offset = adjustment.offset;
      }
    }

    return offset;
  }
}
</script>

<style scoped></style>
