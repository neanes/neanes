<template>
  <div class="neume" :style="style">
    <template v-if="neume.error"> ? </template>
    <template v-else>
      <Neume
        v-if="hasMeasureBarLeft"
        :neume="neume.measureBarLeft"
        :style="measureBarStyle"
      />
      <Neume :neume="neume.note" />
      <Neume :neume="neume.rootSign" />
      <Neume v-if="hasFthora" :neume="neume.fthora" :style="fthoraStyle" />
      <Neume
        v-if="hasMeasureBarRight"
        :neume="neume.measureBarRight"
        :style="measureBarStyle"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaElement } from '@/models/Element';
import Neume from '@/components/Neume.vue';
import { Note } from '@/models/Neumes';
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

  get hasFthora() {
    return this.neume.fthora != null;
  }

  get hasMeasureBarLeft() {
    return this.neume.measureBarLeft != null;
  }

  get hasMeasureBarRight() {
    return this.neume.measureBarRight != null;
  }

  get style() {
    return {
      color: this.pageSetup.martyriaDefaultColor,
      fontFamily: this.pageSetup.neumeDefaultFontFamily,
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.martyriaDefaultStrokeWidth,
      ),
    } as CSSStyleDeclaration;
  }

  get fthoraStyle() {
    return {
      color: this.pageSetup.fthoraDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.fthoraDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get measureBarStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureBarDefaultStrokeWidth,
      ),
    } as CSSStyleDeclaration;
  }
}
</script>

<style scoped></style>
