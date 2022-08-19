<template>
  <div class="neume" :style="style">
    <Neume
      v-if="hasMeasureBarLeft"
      :neume="note.measureBarLeft"
      :style="measureBarStyle"
    />
    <template v-if="note.vareia">{{
      getMapping(VocalExpressionNeume.Vareia).text
    }}</template>
    <template>{{ getMapping(note.quantitativeNeume).text }}</template>
    <template v-if="hasVocalExpressionNeume && !hasHeteron">{{
      getMapping(note.vocalExpressionNeume).text
    }}</template>
    <Neume
      v-if="hasHeteron"
      :neume="note.vocalExpressionNeume"
      :style="heteronStyle"
    />
    <Neume v-if="hasTimeNeume" :neume="note.timeNeume" :style="timeStyle" />
    <Neume
      v-if="hasGorgonNeume"
      :neume="note.gorgonNeume"
      :style="gorgonStyle"
    />
    <Neume
      v-if="hasSecondaryGorgonNeume"
      :neume="note.secondaryGorgonNeume"
      :style="secondaryGorgonStyle"
    />
    <Neume v-if="hasFthora" :neume="note.fthora" :style="fthoraStyle" />
    <Neume
      v-if="hasAccidental"
      :neume="note.accidental"
      :style="accidentalStyle"
    />
    <Neume
      v-if="hasNoteIndicator"
      :neume="note.noteIndicator"
      :style="noteIndicatorStyle"
    />
    <Neume v-if="hasIson" :neume="note.ison" :style="isonStyle" />
    <Neume
      v-if="hasMeasureNumber"
      :neume="note.measureNumber"
      :style="measureNumberStyle"
    />
    <Neume
      v-if="hasMeasureBarRight"
      :neume="note.measureBarRight"
      :style="measureBarStyle"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { VocalExpressionNeume, Neume } from '@/models/Neumes';
import NeumeVue from '@/components/Neume.vue';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { fontService } from '@/services/FontService';

@Component({
  components: {
    Neume: NeumeVue,
  },
})
export default class NeumeBoxSyllablePrint extends Vue {
  @Prop() note!: NoteElement;
  @Prop() pageSetup!: PageSetup;

  VocalExpressionNeume = VocalExpressionNeume;

  get hasVocalExpressionNeume() {
    return this.note.vocalExpressionNeume != null;
  }

  get hasHeteron() {
    return (
      this.note.vocalExpressionNeume == VocalExpressionNeume.Heteron ||
      this.note.vocalExpressionNeume === VocalExpressionNeume.HeteronConnecting
    );
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

  get hasMeasureBarLeft() {
    return this.note.measureBarLeft != null;
  }

  get hasMeasureBarRight() {
    return this.note.measureBarRight != null;
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
      webkitTextStrokeWidth: withZoom(this.pageSetup.neumeDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get gorgonStyle() {
    const offset = this.getOffset(this.note.gorgonNeume!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.gorgonDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.gorgonDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get secondaryGorgonStyle() {
    const offset = this.getOffset(this.note.secondaryGorgonNeume!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.gorgonDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.gorgonDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get timeStyle() {
    const offset = this.getOffset(this.note.timeNeume!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      webkitTextStrokeWidth: withZoom(this.pageSetup.neumeDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get fthoraStyle() {
    const offset = this.getOffset(this.note.fthora!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.fthoraDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.fthoraDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get accidentalStyle() {
    const offset = this.getOffset(this.note.accidental!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.accidentalDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.accidentalDefaultStrokeWidth,
      ),
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

  get measureNumberStyle() {
    const offset = this.getOffset(this.note.measureNumber!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.measureNumberDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureNumberDefaultStrokeWidth,
      ),
    } as CSSStyleDeclaration;
  }

  get noteIndicatorStyle() {
    const offset = this.getOffset(this.note.noteIndicator!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.noteIndicatorDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.noteIndicatorDefaultStrokeWidth,
      ),
    } as CSSStyleDeclaration;
  }

  get isonStyle() {
    const offset = this.getOffset(this.note.ison!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.isonDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.isonDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get heteronStyle() {
    const offset = this.getOffset(this.note.vocalExpressionNeume!);

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.heteronDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.heteronDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  getMapping(neume: Neume) {
    return NeumeMappingService.getMapping(neume);
  }

  getOffset(neume: Neume) {
    const mark = this.getMapping(neume).glyphName;
    const base = this.getMapping(this.note.quantitativeNeume).glyphName;

    const offset = fontService.getMarkOffset(base, mark);

    // Shift offset for vareia
    if (this.note.vareia) {
      const vareiaGlyphName = this.getMapping(
        VocalExpressionNeume.Vareia,
      ).glyphName;

      const vareiaWidth = fontService.getAdvanceWidth(vareiaGlyphName);
      offset.x += vareiaWidth;
    }

    // Shift offset for measure bar
    if (this.note.measureBarLeft) {
      const glyphName = this.getMapping(this.note.measureBarLeft).glyphName;

      const width = fontService.getAdvanceWidth(glyphName);
      offset.x += width;
    }

    return offset;
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
