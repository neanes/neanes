<template>
  <div class="neume" :style="style">
    <template v-if="neume.error"> ? </template>
    <template v-else>
      <Neume :neume="neume.note"></Neume>
      <Neume :neume="neume.rootSign"></Neume>
      <Neume
        v-if="hasFthora"
        :neume="neume.fthora"
        :style="fthoraStyle"
      ></Neume>
      <Neume v-if="neume.apostrophe" :neume="Note.Apostrophe"></Neume>
      <Neume
        v-if="hasMeasureBar"
        :neume="neume.measureBar"
        :style="measureBarStyle"
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
      fontFamily: this.pageSetup.neumeDefaultFontFamily,
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
