<template>
  <div class="mode-key-container" :style="style">
    <Neume :neume="ModeSign.Ekhos" />
    <Neume v-if="element.isPlagal" :neume="ModeSign.Plagal" />
    <Neume v-if="element.isVarys" :neume="ModeSign.Varys" />
    <Neume :neume="element.martyria" />
    <Neume v-if="hasNote" :neume="element.note" />
    <Neume v-if="hasFthoraAboveNote" :neume="element.fthoraAboveNote" />
    <Neume
      v-if="hasQuantitativeNeumeAboveNote"
      :neume="element.quantitativeNeumeAboveNote"
    />
    <Neume v-if="hasNote2" :neume="element.note2" />
    <Neume v-if="hasFthoraAboveNote2" :neume="element.fthoraAboveNote2" />
    <Neume
      v-if="hasQuantitativeNeumeAboveNote2"
      :neume="element.quantitativeNeumeAboveNote2"
    />
    <Neume
      v-if="hasQuantitativeNeumeRight"
      :neume="element.quantitativeNeumeRight"
    />
    <Neume
      v-if="hasFthoraAboveQuantitativeNeumeRight"
      :neume="element.fthoraAboveQuantitativeNeumeRight"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ModeKeyElement } from '@/models/Element';
import Neume from '@/components/Neume.vue';
import { ModeSign } from '@/models/Neumes';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: {
    Neume,
  },
})
export default class ModeKey extends Vue {
  @Prop() element!: ModeKeyElement;
  @Prop() pageSetup!: PageSetup;
  ModeSign = ModeSign;

  get hasFthoraAboveNote() {
    return this.element.fthoraAboveNote != null;
  }

  get hasNote() {
    return this.element.note != null;
  }

  get hasNote2() {
    return this.element.note2 != null;
  }

  get hasFthoraAboveNote2() {
    return this.element.fthoraAboveNote2 != null;
  }

  get hasFthoraAboveQuantitativeNeumeRight() {
    return this.element.fthoraAboveQuantitativeNeumeRight != null;
  }

  get hasQuantitativeNeumeAboveNote() {
    return this.element.quantitativeNeumeAboveNote != null;
  }

  get hasQuantitativeNeumeAboveNote2() {
    return this.element.quantitativeNeumeAboveNote2 != null;
  }

  get hasQuantitativeNeumeRight() {
    return this.element.quantitativeNeumeRight != null;
  }

  get style() {
    return {
      color: this.element.color,
      fontFamily: this.pageSetup.neumeDefaultFontFamily,
      fontSize: withZoom(this.element.fontSize),
      textAlign: this.element.alignment,
      width: withZoom(this.pageSetup.innerPageWidth),
      height: withZoom(this.element.height),
    } as CSSStyleDeclaration;
  }
}
</script>

<style scoped>
.mode-key-container {
  border: 1px dotted black;
  box-sizing: border-box;
  user-select: none;
}
</style>
