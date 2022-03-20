<template>
  <div class="neume" :style="style">
    <template v-if="neume.error"> ? </template>
    <template v-else>
      <Neume
        :neume="neume.note"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
      ></Neume>
      <Neume
        :neume="neume.rootSign"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
      ></Neume>
      <Neume
        v-if="hasFthora"
        :neume="neume.fthora"
        :style="fthoraStyle"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
      ></Neume>
      <Neume
        v-if="neume.apostrophe"
        :neume="Note.Apostrophe"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
      ></Neume>
      <Neume
        v-if="hasMeasureBar"
        :neume="neume.measureBar"
        :style="measureBarStyle"
        :fontFamily="pageSetup.neumeDefaultFontFamily"
      ></Neume>
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

  get hasMeasureBar() {
    return this.neume.measureBar != null;
  }

  get style() {
    return {
      color: this.pageSetup.martyriaDefaultColor,
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
    } as CSSStyleDeclaration;
  }

  get fthoraStyle() {
    return {
      color: this.pageSetup.fthoraDefaultColor,
    } as CSSStyleDeclaration;
  }

  get measureBarStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
    } as CSSStyleDeclaration;
  }
}
</script>

<style scoped></style>
