<template>
  <div class="neume" :style="style">
    <Neume
      v-if="hasMeasureBarLeft"
      :neume="note.measureBarLeft"
      :style="measureBarLeftStyle"
    />
    <Neume
      v-if="note.vareia"
      :neume="VocalExpressionNeume.Vareia"
      :style="vareiaStyle"
    />
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
      v-if="note.koronis"
      :neume="TimeNeume.Koronis"
      :style="koronisStyle"
    />
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
      v-if="note.noteIndicator"
      :neume="note.noteIndicatorNeume"
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
      :style="measureBarRightStyle"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { VocalExpressionNeume, Neume, TimeNeume } from '@/models/Neumes';
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

  TimeNeume = TimeNeume;
  VocalExpressionNeume = VocalExpressionNeume;

  get hasVocalExpressionNeume() {
    return this.note.vocalExpressionNeume != null;
  }

  get hasHeteron() {
    return (
      this.note.vocalExpressionNeume == VocalExpressionNeume.Heteron ||
      this.note.vocalExpressionNeume ===
        VocalExpressionNeume.HeteronConnecting ||
      this.note.vocalExpressionNeume ===
        VocalExpressionNeume.HeteronConnectingLong ||
      this.note.vocalExpressionNeume === VocalExpressionNeume.Endofonon
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

    offset.x += this.note.gorgonNeumeOffsetX || 0;
    offset.y += this.note.gorgonNeumeOffsetY || 0;

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

    offset.x += this.note.secondaryGorgonNeumeOffsetX || 0;
    offset.y += this.note.secondaryGorgonNeumeOffsetY || 0;

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

    offset.x += this.note.timeNeumeOffsetX || 0;
    offset.y += this.note.timeNeumeOffsetY || 0;

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      webkitTextStrokeWidth: withZoom(this.pageSetup.neumeDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get koronisStyle() {
    const offset = this.getOffset(TimeNeume.Koronis);

    offset.x += this.note.koronisOffsetX || 0;
    offset.y += this.note.koronisOffsetY || 0;

    return {
      position: 'absolute',
      left: withZoom(offset.x, 'em'),
      top: withZoom(offset.y, 'em'),
      color: this.pageSetup.koronisDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.koronisDefaultStrokeWidth),
    } as CSSStyleDeclaration;
  }

  get vareiaStyle() {
    return {
      left:
        this.note.vareiaOffsetX != null
          ? withZoom(this.note.vareiaOffsetX, 'em')
          : undefined,
      top:
        this.note.vareiaOffsetY != null
          ? withZoom(this.note.vareiaOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get fthoraStyle() {
    const offset = this.getOffset(this.note.fthora!);

    offset.x += this.note.fthoraOffsetX || 0;
    offset.y += this.note.fthoraOffsetY || 0;

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

    offset.x += this.note.accidentalOffsetX || 0;
    offset.y += this.note.accidentalOffsetY || 0;

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

  get measureBarLeftStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureBarDefaultStrokeWidth,
      ),
      left:
        this.note.measureBarLeftOffsetX != null
          ? withZoom(this.note.measureBarLeftOffsetX, 'em')
          : undefined,
      top:
        this.note.measureBarLeftOffsetY != null
          ? withZoom(this.note.measureBarLeftOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get measureBarRightStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureBarDefaultStrokeWidth,
      ),
      left:
        this.note.measureBarRightOffsetX != null
          ? withZoom(this.note.measureBarRightOffsetX, 'em')
          : undefined,
      top:
        this.note.measureBarRightOffsetY != null
          ? withZoom(this.note.measureBarRightOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get measureNumberStyle() {
    const offset = this.getOffset(this.note.measureNumber!);

    offset.x += this.note.measureNumberOffsetX || 0;
    offset.y += this.note.measureNumberOffsetY || 0;

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
    const offset = this.getOffset(this.note.noteIndicatorNeume!);

    offset.x += this.note.noteIndicatorOffsetX || 0;
    offset.y += this.note.noteIndicatorOffsetY || 0;

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

    offset.x += this.note.isonOffsetX || 0;
    offset.y += this.note.isonOffsetY || 0;

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

    offset.x += this.note.vocalExpressionNeumeOffsetX || 0;
    offset.y += this.note.vocalExpressionNeumeOffsetY || 0;

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
