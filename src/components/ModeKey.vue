<template>
  <div class="mode-key-container" :style="style">
    <Neume
      :neume="ModeSign.Ekhos"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    ></Neume>
    <Neume
      v-if="element.isPlagal"
      :neume="ModeSign.Plagal"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    ></Neume>
    <Neume
      v-if="element.isVarys"
      :neume="ModeSign.Varys"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    ></Neume>
    <template v-for="(neume, index) in element.martyrias">
      <Neume
        :neume="neume"
        :key="index"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
      />
    </template>
    <Neume
      v-if="hasNote"
      :neume="element.note"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    ></Neume>
    <Neume
      v-if="hasFthora"
      :neume="element.fthora"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    ></Neume>
    <Neume
      v-if="hasNote2"
      :neume="element.note2"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    ></Neume>
    <Neume
      v-if="hasQuantitativeNeumeTop"
      :neume="element.quantitativeNeumeTop"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    ></Neume>
    <Neume
      v-if="hasQuantitativeNeumeRight"
      :neume="element.quantitativeNeumeRight"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    ></Neume>
    <Neume
      v-if="hasFthora2"
      :neume="element.fthora2"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    ></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ModeKeyElement } from '@/models/Element';
import Neume from '@/components/Neume.vue';
import { Fthora, ModeSign } from '@/models/Neumes';
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
