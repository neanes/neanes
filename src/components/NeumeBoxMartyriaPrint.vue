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
      <Neume :neume="neume.rootSign" :style="rootSignStyle" />
      <Neume v-if="hasFthora" :neume="neume.fthora" :style="fthoraStyle" />
      <Neume v-if="hasTempo" :neume="neume.tempo" :style="tempoStyle" />
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

  get hasTempo() {
    return this.neume.tempo != null;
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
    const offset = this.getOffset(this.neume.fthora!);

    return {
      position: 'absolute',
      color: this.pageSetup.fthoraDefaultColor,
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      webkitTextStrokeWidth: withZoom(this.pageSetup.fthoraDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get tempoStyle() {
    const offset = this.getOffset(this.neume.tempo!);

    if (this.hasFthora) {
      const offsetFthora = this.getOffset(this.neume.fthora!);
      const offsetTempo = this.getOffset(this.neume.tempo!, this.neume.fthora!);
      offset.x = offsetFthora.x + offsetTempo.x;
      offset.y = offsetFthora.y + offsetTempo.y;
    }

    return {
      position: 'absolute',
      color: this.pageSetup.tempoDefaultColor,
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      webkitTextStrokeWidth: withZoom(this.pageSetup.tempoDefaultStrokeWidth),
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
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureBarDefaultStrokeWidth,
      ),
    } as CSSStyleDeclaration;
  }

  getMapping(neume: GenericNeume) {
    return NeumeMappingService.getMapping(neume);
  }

  getOffset(neume: GenericNeume, baseNeume?: GenericNeume) {
    const mark = this.getMapping(neume).glyphName;
    const base = this.getMapping(baseNeume ?? this.neume.note).glyphName;

    const offset = fontService.getMarkOffset(base, mark);

    // Shift offset for measure bar
    if (this.neume.measureBarLeft) {
      const glyphName = this.getMapping(this.neume.measureBarLeft).glyphName;

      const width = fontService.getAdvanceWidth(glyphName);
      offset.x += width;
    }

    return offset;
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
