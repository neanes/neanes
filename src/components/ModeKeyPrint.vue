<template>
  <div class="mode-key-container" :style="style">
    <Neume :neume="ModeSign.Ekhos" />
    <Neume v-if="element.isPlagal" :neume="ModeSign.Plagal" />
    <Neume v-if="element.isVarys" :neume="ModeSign.Varys" />
    <Neume :neume="element.martyria" />
    <span style="position: relative">
      <Neume v-if="hasNote" :neume="element.note" />
      <Neume
        v-if="hasFthoraAboveNote"
        :neume="element.fthoraAboveNote"
        :style="fthoraAboveNoteStyle"
      />
      <Neume
        v-if="hasQuantitativeNeumeAboveNote"
        :neume="element.quantitativeNeumeAboveNote"
        :style="quantitativeNeumeAboveNoteStyle"
      />
    </span>
    <span style="position: relative">
      <Neume v-if="hasNote2" :neume="element.note2" />
      <Neume
        v-if="hasQuantitativeNeumeAboveNote2"
        :neume="element.quantitativeNeumeAboveNote2"
        :style="quantitativeNeumeAboveNote2Style"
      />
      <Neume
        v-if="hasFthoraAboveNote2"
        :neume="element.fthoraAboveNote2"
        :style="fthoraAboveNote2Style"
      />
    </span>
    <span style="position: relative">
      <Neume
        v-if="hasQuantitativeNeumeRight"
        :neume="element.quantitativeNeumeRight"
      />
      <Neume
        v-if="hasFthoraAboveQuantitativeNeumeRight"
        :neume="element.fthoraAboveQuantitativeNeumeRight"
        :style="fthoraAboveQuantitativeNeumeRightStyle"
      />
    </span>

    <Neume v-if="hasTempo" :neume="element.tempo" :style="tempoStyle" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';
import { ModeKeyElement } from '@/models/Element';
import Neume from '@/components/Neume.vue';
import { ModeSign, Neume as GenericNeume } from '@/models/Neumes';
import { withZoom } from '@/utils/withZoom';
import { fontService } from '@/services/FontService';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { PageSetup } from '@/models/PageSetup';
import { StyleValue } from 'vue';

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

  get hasTempo() {
    return this.element.tempo != null;
  }

  get style() {
    return {
      color: this.element.computedColor,
      fontFamily: this.element.computedFontFamily,
      fontSize: withZoom(this.element.computedFontSize),
      textAlign: this.element.alignment,
      width: withZoom(this.element.width),
      height: withZoom(this.element.height),
      webkitTextStrokeWidth: withZoom(this.element.computedStrokeWidth),
    } as StyleValue;
  }

  get fthoraAboveNoteStyle() {
    const offset = this.getOffset(
      this.element.fthoraAboveNote!,
      this.element.note!,
    );

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
    } as StyleValue;
  }

  get fthoraAboveNote2Style() {
    const offset = this.getOffset(
      this.element.fthoraAboveNote2!,
      this.element.note2!,
    );

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
    } as StyleValue;
  }

  get fthoraAboveQuantitativeNeumeRightStyle() {
    const offset = this.getOffset(
      this.element.fthoraAboveQuantitativeNeumeRight!,
      this.element.quantitativeNeumeRight!,
    );

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
    } as StyleValue;
  }

  get quantitativeNeumeAboveNoteStyle() {
    const offset = this.getOffset(
      this.element.quantitativeNeumeAboveNote!,
      this.element.note!,
    );

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
    } as StyleValue;
  }

  get quantitativeNeumeAboveNote2Style() {
    const offset = this.getOffset(
      this.element.quantitativeNeumeAboveNote2!,
      this.element.note2!,
    );

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
    } as StyleValue;
  }

  get tempoStyle() {
    // TODO figure out a way to remove the hard-coded 12
    // font metadata json?
    const style = {
      color: this.pageSetup.tempoDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.tempoDefaultStrokeWidth),
      top: withZoom(-12),
    } as Partial<CSSStyleDeclaration>;

    if (this.element.tempoAlignRight) {
      style.position = 'absolute';
      style.right = withZoom(0);
    }

    return style;
  }

  getMapping(neume: GenericNeume) {
    return NeumeMappingService.getMapping(neume);
  }

  getOffset(markNeume: GenericNeume, baseNeume: GenericNeume) {
    const mark = this.getMapping(markNeume).glyphName;
    const base = this.getMapping(baseNeume).glyphName;

    return fontService.getMarkOffset(base, mark);
  }
}
</script>

<style scoped>
.mode-key-container {
  position: relative;
  display: flex;
  border: 1px dotted black;
  box-sizing: border-box;
  user-select: none;
}
</style>
