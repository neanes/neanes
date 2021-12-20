<template>
  <div class="mode-key-container" :style="style">
    <Neume :neume="ModeSign.Ekhos"></Neume>
    <Neume v-if="element.isPlagal" :neume="ModeSign.Plagal"></Neume>
    <Neume v-if="element.isVarys" :neume="ModeSign.Varys"></Neume>
    <template v-for="(neume, index) in element.martyrias">
      <Neume :neume="neume" :key="index" />
    </template>
    <Neume v-if="hasNote" :neume="element.note"></Neume>
    <Neume
      v-if="hasFthora"
      :neume="element.fthora"
      :offset="fthoraOffset"
    ></Neume>
    <Neume v-if="hasQuantativeNeume" :neume="element.quantativeNeume"></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ModeKeyElement } from '@/models/Element';
import Neume from '@/components/Neume.vue';
import { Fthora, ModeSign } from '@/models/Neumes';
import {
  getFthoraAdjustments,
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

  get hasQuantativeNeume() {
    return this.element.quantativeNeume != null;
  }

  get style() {
    return {
      color: this.element.color,
      fontSize: this.element.fontSize + 'px',
      textAlign: this.element.alignment,
    } as CSSStyleDeclaration;
  }

  get fthoraOffset() {
    let offset: NeumeAdjustmentOffset | null = null;

    const adjustments = getFthoraAdjustments(this.element.fthora!);

    if (adjustments) {
      const adjustment = adjustments.find(x =>
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
