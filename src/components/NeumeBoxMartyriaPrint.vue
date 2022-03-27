<template>
  <div class="neume" :style="style">
    <template v-if="neume.error"> ? </template>
    <template v-else>
      <Neume :neume="neume.note"></Neume>
      <Neume :neume="neume.rootSign" :style="rootSignStyle"></Neume>
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
import { Note, Neume as GenericNeume } from '@/models/Neumes';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { fontService } from '@/services/FontService';

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
    const offset = this.getOffset(this.neume.fthora!);

    return {
      position: 'absolute',
      color: this.pageSetup.fthoraDefaultColor,
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
    } as CSSStyleDeclaration;
  }

  get rootSignStyle() {
    const offset = this.getOffset(this.neume.rootSign!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
    } as CSSStyleDeclaration;
  }

  get measureBarStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
    } as CSSStyleDeclaration;
  }

  getMapping(neume: GenericNeume) {
    return NeumeMappingService.getMapping(neume);
  }

  getOffset(neume: GenericNeume) {
    const mark = this.getMapping(neume).glyphName;
    const base = this.getMapping(this.neume.note).glyphName;
    return fontService.getMarkOffset(base, mark);
  }
}
</script>

<style scoped>
.neume {
  position: relative;

  cursor: default;
  user-select: none;
}
</style>
