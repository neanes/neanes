<template>
  <div
    class="neume"
    :style="style"
    @click.exact="$emit('select-single')"
    @click.shift.exact="$emit('select-range')"
  >
    <Neume
      v-if="hasMeasureBarLeft && !isMeasureBarAbove"
      :neume="getMeasureBarLeft"
      :style="measureBarLeftStyle"
    />
    <Neume
      v-if="note.vareia && !pageSetup.melkiteRtl"
      :neume="VocalExpressionNeume.Vareia"
      :style="vareiaStyle"
    />
    <Neume :neume="note.quantitativeNeume" />
    <Neume
      v-if="note.stavros"
      :neume="VocalExpressionNeume.Cross_Top"
      :style="stavrosStyle"
    />
    <Neume
      v-if="hasVocalExpressionNeume"
      :neume="note.vocalExpressionNeume"
      :style="vocalExpressionStyle"
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
      v-if="hasSecondaryFthora"
      :neume="note.secondaryFthora"
      :style="secondaryFthoraStyle"
    />
    <Neume
      v-if="hasTertiaryFthora"
      :neume="note.tertiaryFthora"
      :style="tertiaryFthoraStyle"
    />
    <Neume
      v-if="hasAccidental"
      :neume="note.accidental"
      :style="accidentalStyle"
    />
    <Neume
      v-if="hasSecondaryAccidental"
      :neume="note.secondaryAccidental"
      :style="secondaryAccidentalStyle"
    />
    <Neume
      v-if="hasTertiaryAccidental"
      :neume="note.tertiaryAccidental"
      :style="tertiaryAccidentalStyle"
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
      v-if="hasMeasureBarLeft && isMeasureBarAbove"
      :neume="getMeasureBarLeft"
      :style="measureBarLeftStyle"
    />
    <Neume
      v-if="hasMeasureBarRight"
      :neume="getMeasureBarRight"
      :style="measureBarRightStyle"
    />
    <Neume v-if="hasTie" :neume="note.tie" :style="tieStyle" />
    <Neume
      v-if="note.vareia && pageSetup.melkiteRtl"
      :neume="VocalExpressionNeume.Vareia"
      :style="vareiaStyle"
    />
  </div>
</template>

<script lang="ts">
import { StyleValue } from 'vue';
import { Component, Prop, Vue } from 'vue-facing-decorator';

import NeumeVue from '@/components/Neume.vue';
import { NoteElement } from '@/models/Element';
import { TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

@Component({
  components: {
    Neume: NeumeVue,
  },
  emits: ['select-single', 'select-range'],
})
export default class NeumeBoxSyllable extends Vue {
  @Prop() note!: NoteElement;
  @Prop() pageSetup!: PageSetup;

  TimeNeume = TimeNeume;
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

  get hasSecondaryFthora() {
    return this.note.secondaryFthora != null;
  }

  get hasTertiaryFthora() {
    return this.note.tertiaryFthora != null;
  }

  get hasAccidental() {
    return this.note.accidental != null;
  }

  get hasSecondaryAccidental() {
    return this.note.secondaryAccidental != null;
  }

  get hasTertiaryAccidental() {
    return this.note.tertiaryAccidental != null;
  }

  get hasMeasureBarLeft() {
    return (
      this.note.measureBarLeft != null ||
      this.note.computedMeasureBarLeft != null
    );
  }

  get hasMeasureBarRight() {
    return (
      this.note.measureBarRight != null ||
      this.note.computedMeasureBarRight != null
    );
  }

  get getMeasureBarLeft() {
    return this.note.measureBarLeft
      ? this.note.measureBarLeft
      : this.note.computedMeasureBarLeft;
  }

  get getMeasureBarRight() {
    return this.note.measureBarRight
      ? this.note.measureBarRight
      : this.note.computedMeasureBarRight;
  }

  get isMeasureBarAbove() {
    return (
      this.note.measureBarLeft
        ? this.note.measureBarLeft
        : this.note.computedMeasureBarLeft
    )?.endsWith('Above');
  }

  get hasMeasureNumber() {
    return this.note.measureNumber != null;
  }

  get hasIson() {
    return this.note.ison != null;
  }

  get hasTie() {
    return this.note.tie != null;
  }

  get style() {
    return {
      fontFamily: this.pageSetup.neumeDefaultFontFamily,
      fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
      color: this.pageSetup.neumeDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.neumeDefaultStrokeWidth),
    } as StyleValue;
  }

  get gorgonStyle() {
    return {
      color: this.pageSetup.gorgonDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.gorgonDefaultStrokeWidth),
      left:
        this.note.gorgonNeumeOffsetX != null
          ? `${this.note.gorgonNeumeOffsetX}em`
          : undefined,
      top:
        this.note.gorgonNeumeOffsetY != null
          ? `${this.note.gorgonNeumeOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get secondaryGorgonStyle() {
    return {
      color: this.pageSetup.gorgonDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.gorgonDefaultStrokeWidth),
      left:
        this.note.secondaryGorgonNeumeOffsetX != null
          ? `${this.note.secondaryGorgonNeumeOffsetX}em`
          : undefined,
      top:
        this.note.secondaryGorgonNeumeOffsetY != null
          ? `${this.note.secondaryGorgonNeumeOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get fthoraStyle() {
    return {
      color: this.pageSetup.fthoraDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.fthoraDefaultStrokeWidth),
      left:
        this.note.fthoraOffsetX != null
          ? `${this.note.fthoraOffsetX}em`
          : undefined,
      top:
        this.note.fthoraOffsetY != null
          ? `${this.note.fthoraOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get secondaryFthoraStyle() {
    return {
      color: this.pageSetup.fthoraDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.fthoraDefaultStrokeWidth),
      left:
        this.note.secondaryFthoraOffsetX != null
          ? `${this.note.secondaryFthoraOffsetX}em`
          : undefined,
      top:
        this.note.secondaryFthoraOffsetY != null
          ? `${this.note.secondaryFthoraOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get tertiaryFthoraStyle() {
    return {
      color: this.pageSetup.fthoraDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.fthoraDefaultStrokeWidth),
      left:
        this.note.tertiaryFthoraOffsetX != null
          ? `${this.note.tertiaryFthoraOffsetX}em`
          : undefined,
      top:
        this.note.tertiaryFthoraOffsetY != null
          ? `${this.note.tertiaryFthoraOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get accidentalStyle() {
    return {
      color: this.pageSetup.accidentalDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.accidentalDefaultStrokeWidth,
      ),
      left:
        this.note.accidentalOffsetX != null
          ? `${this.note.accidentalOffsetX}em`
          : undefined,
      top:
        this.note.accidentalOffsetY != null
          ? `${this.note.accidentalOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get secondaryAccidentalStyle() {
    return {
      color: this.pageSetup.accidentalDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.accidentalDefaultStrokeWidth,
      ),
      left:
        this.note.secondaryAccidentalOffsetX != null
          ? `${this.note.secondaryAccidentalOffsetX}em`
          : undefined,
      top:
        this.note.secondaryAccidentalOffsetY != null
          ? `${this.note.secondaryAccidentalOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get tertiaryAccidentalStyle() {
    return {
      color: this.pageSetup.accidentalDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.accidentalDefaultStrokeWidth,
      ),
      left:
        this.note.tertiaryAccidentalOffsetX != null
          ? `${this.note.tertiaryAccidentalOffsetX}em`
          : undefined,
      top:
        this.note.tertiaryAccidentalOffsetY != null
          ? `${this.note.tertiaryAccidentalOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get measureBarLeftStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureBarDefaultStrokeWidth,
      ),
      left:
        this.note.measureBarLeftOffsetX != null
          ? `${this.note.measureBarLeftOffsetX}em`
          : undefined,
      top:
        this.note.measureBarLeftOffsetY != null
          ? `${this.note.measureBarLeftOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get measureBarRightStyle() {
    return {
      color: this.pageSetup.measureBarDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureBarDefaultStrokeWidth,
      ),
      left:
        this.note.measureBarRightOffsetX != null
          ? `${this.note.measureBarRightOffsetX}em`
          : undefined,
      top:
        this.note.measureBarRightOffsetY != null
          ? `${this.note.measureBarRightOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get measureNumberStyle() {
    return {
      color: this.pageSetup.measureNumberDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureNumberDefaultStrokeWidth,
      ),
      left:
        this.note.measureNumberOffsetX != null
          ? `${this.note.measureNumberOffsetX}em`
          : undefined,
      top:
        this.note.measureNumberOffsetY != null
          ? `${this.note.measureNumberOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get noteIndicatorStyle() {
    return {
      color: this.pageSetup.noteIndicatorDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.noteIndicatorDefaultStrokeWidth,
      ),
      left:
        this.note.noteIndicatorOffsetX != null
          ? `${this.note.noteIndicatorOffsetX}em`
          : undefined,
      top:
        this.note.noteIndicatorOffsetY != null
          ? `${this.note.noteIndicatorOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get isonStyle() {
    const isonOffsetY = this.pageSetup.alignIsonIndicators
      ? this.note.isonOffsetYAdjusted
      : this.note.isonOffsetY;

    return {
      color: this.pageSetup.isonDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.isonDefaultStrokeWidth),
      left:
        this.note.isonOffsetX != null
          ? `${this.note.isonOffsetX}em`
          : undefined,
      top: isonOffsetY != null ? `${isonOffsetY}em` : undefined,
    } as StyleValue;
  }

  get timeStyle() {
    return {
      left:
        this.note.timeNeumeOffsetX != null
          ? `${this.note.timeNeumeOffsetX}em`
          : undefined,
      top:
        this.note.timeNeumeOffsetY != null
          ? `${this.note.timeNeumeOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get koronisStyle() {
    return {
      color: this.pageSetup.koronisDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.koronisDefaultStrokeWidth),
      left:
        this.note.koronisOffsetX != null
          ? `${this.note.koronisOffsetX}em`
          : undefined,
      top:
        this.note.koronisOffsetY != null
          ? `${this.note.koronisOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get stavrosStyle() {
    return {
      left:
        this.note.stavrosOffsetX != null
          ? `${this.note.stavrosOffsetX}em`
          : undefined,
      top:
        this.note.stavrosOffsetY != null
          ? `${this.note.stavrosOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get vareiaStyle() {
    return {
      left:
        this.note.vareiaOffsetX != null
          ? `${this.note.vareiaOffsetX}em`
          : undefined,
      top:
        this.note.vareiaOffsetY != null
          ? `${this.note.vareiaOffsetY}em`
          : undefined,
    } as StyleValue;
  }

  get vocalExpressionStyle() {
    const style = {
      left:
        this.note.vocalExpressionNeumeOffsetX != null
          ? `${this.note.vocalExpressionNeumeOffsetX}em`
          : undefined,
      top:
        this.note.vocalExpressionNeumeOffsetY != null
          ? `${this.note.vocalExpressionNeumeOffsetY}em`
          : undefined,
    } as Partial<CSSStyleDeclaration>;

    if (
      this.note.vocalExpressionNeume === VocalExpressionNeume.Heteron ||
      this.note.vocalExpressionNeume ===
        VocalExpressionNeume.HeteronConnecting ||
      this.note.vocalExpressionNeume ===
        VocalExpressionNeume.HeteronConnectingLong ||
      this.note.vocalExpressionNeume === VocalExpressionNeume.Endofonon
    ) {
      style.color = this.pageSetup.heteronDefaultColor;
      style.webkitTextStrokeWidth = withZoom(
        this.pageSetup.heteronDefaultStrokeWidth,
      );
    }

    return style;
  }

  get tieStyle() {
    return {
      left:
        this.note.tieOffsetX != null ? `${this.note.tieOffsetX}em` : undefined,
      top:
        this.note.tieOffsetY != null ? `${this.note.tieOffsetY}em` : undefined,
    } as StyleValue;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume {
  cursor: default;
  user-select: none;
}
</style>
