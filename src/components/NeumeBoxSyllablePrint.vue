<template>
  <div class="neume" :style="style">
    <template v-if="note.vareia">{{
      getMapping(VocalExpressionNeume.Vareia).text
    }}</template>
    <template>{{ getMapping(note.quantitativeNeume).text }}</template>
    <template v-if="hasVocalExpressionNeume">{{
      getMapping(note.vocalExpressionNeume).text
    }}</template>
    <Neume
      v-if="hasTimeNeume"
      :neume="note.timeNeume"
      :style="timeStyle"
    ></Neume>
    <Neume
      v-if="hasGorgonNeume"
      :neume="note.gorgonNeume"
      :style="gorgonStyle"
    ></Neume>
    <Neume
      v-if="hasSecondaryGorgonNeume"
      :neume="note.secondaryGorgonNeume"
      :style="secondaryGorgonStyle"
    ></Neume>
    <Neume v-if="hasFthora" :neume="note.fthora" :style="fthoraStyle"></Neume>
    <Neume
      v-if="hasAccidental"
      :neume="note.accidental"
      :style="accidentalStyle"
    ></Neume>
    <Neume
      v-if="hasNoteIndicator"
      :neume="note.noteIndicator"
      :style="noteIndicatorStyle"
    ></Neume>
    <Neume v-if="hasIson" :neume="note.ison" :style="isonStyle"></Neume>
    <Neume
      v-if="hasMeasureNumber"
      :neume="note.measureNumber"
      :style="measureNumberStyle"
    ></Neume>
    <Neume
      v-if="hasMeasureBar"
      :neume="note.measureBar"
      :style="measureBarStyle"
    ></Neume>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { VocalExpressionNeume, Neume as GenericNeume } from '@/models/Neumes';
import Neume from '@/components/Neume.vue';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { fontService } from '@/services/FontService';

@Component({
  components: {
    Neume,
  },
})
export default class NeumeBoxSyllablePrint extends Vue {
  @Prop() note!: NoteElement;
  @Prop() pageSetup!: PageSetup;

  VocalExpressionNeume = VocalExpressionNeume;

  get hasVocalExpressionNeume() {
    return this.note.vocalExpressionNeume != null;
  }

  get hasTimeNeume() {
    return this.note.timeNeume != null;
  }

  get hasGorgonNeume() {
    return this.note.gorgonNeume != null;
  }

  get hasSecondaryGorgonNeume() {
    return this.note.secondaryGorgonNeume != null;
  }

  get hasFthora() {
    return this.note.fthora != null;
  }

  get hasAccidental() {
    return this.note.accidental != null;
  }

  get hasMeasureBar() {
    return this.note.measureBar != null;
  }

  get hasMeasureNumber() {
    return this.note.measureNumber != null;
  }

  get hasNoteIndicator() {
    return this.note.noteIndicator != null;
  }

  get hasIson() {
    return this.note.ison != null;
  }

  get style() {
    return {
      fontFamily: this.pageSetup.neumeDefaultFontFamily,
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
      color: this.pageSetup.neumeDefaultColor,
    } as CSSStyleDeclaration;
  }

  get gorgonStyle() {
    const offset = this.getOffset(this.note.gorgonNeume!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.gorgonDefaultColor,
    } as CSSStyleDeclaration;
  }

  get secondaryGorgonStyle() {
    const offset = this.getOffset(this.note.secondaryGorgonNeume!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.gorgonDefaultColor,
    } as CSSStyleDeclaration;
  }

  get timeStyle() {
    const offset = this.getOffset(this.note.timeNeume!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
    } as CSSStyleDeclaration;
  }

  get fthoraStyle() {
    const offset = this.getOffset(this.note.fthora!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.fthoraDefaultColor,
    } as CSSStyleDeclaration;
  }

  get accidentalStyle() {
    const offset = this.getOffset(this.note.accidental!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.accidentalDefaultColor,
    } as CSSStyleDeclaration;
  }

  get measureBarStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
    } as CSSStyleDeclaration;
  }

  get measureNumberStyle() {
    const offset = this.getOffset(this.note.measureNumber!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.measureNumberDefaultColor,
    } as CSSStyleDeclaration;
  }

  get noteIndicatorStyle() {
    const offset = this.getOffset(this.note.noteIndicator!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.noteIndicatorDefaultColor,
    } as CSSStyleDeclaration;
  }

  get isonStyle() {
    const offset = this.getOffset(this.note.ison!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.isonDefaultColor,
    } as CSSStyleDeclaration;
  }

  getMapping(neume: GenericNeume) {
    return NeumeMappingService.getMapping(neume);
  }

  getOffset(neume: GenericNeume) {
    const mark = this.getMapping(neume).glyphName;
    const base = this.getMapping(this.note.quantitativeNeume).glyphName;
    return fontService.getMarkOffset(base, mark);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume {
  position: relative;

  cursor: default;
  user-select: none;
}
</style>
