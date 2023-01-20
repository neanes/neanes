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
    <Neume :neume="note.quantitativeNeume" />
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
    <Neume v-if="hasTie" :neume="note.tie" :style="tieStyle" />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import { TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import Neume from '@/components/Neume.vue';
import { withZoom } from '@/utils/withZoom';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: {
    Neume,
  },
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

  get hasTie() {
    return this.note.tie != null;
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
    return {
      color: this.pageSetup.gorgonDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.gorgonDefaultStrokeWidth),
      left:
        this.note.gorgonNeumeOffsetX != null
          ? withZoom(this.note.gorgonNeumeOffsetX, 'em')
          : undefined,
      top:
        this.note.gorgonNeumeOffsetY != null
          ? withZoom(this.note.gorgonNeumeOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get secondaryGorgonStyle() {
    return {
      color: this.pageSetup.gorgonDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.gorgonDefaultStrokeWidth),
      left:
        this.note.secondaryGorgonNeumeOffsetX != null
          ? withZoom(this.note.secondaryGorgonNeumeOffsetX, 'em')
          : undefined,
      top:
        this.note.secondaryGorgonNeumeOffsetY != null
          ? withZoom(this.note.secondaryGorgonNeumeOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get fthoraStyle() {
    return {
      color: this.pageSetup.fthoraDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.fthoraDefaultStrokeWidth),
      left:
        this.note.fthoraOffsetX != null
          ? withZoom(this.note.fthoraOffsetX, 'em')
          : undefined,
      top:
        this.note.fthoraOffsetY != null
          ? withZoom(this.note.fthoraOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get accidentalStyle() {
    return {
      color: this.pageSetup.accidentalDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.accidentalDefaultStrokeWidth,
      ),
      left:
        this.note.accidentalOffsetX != null
          ? withZoom(this.note.accidentalOffsetX, 'em')
          : undefined,
      top:
        this.note.accidentalOffsetY != null
          ? withZoom(this.note.accidentalOffsetY, 'em')
          : undefined,
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
    return {
      color: this.pageSetup.measureNumberDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.measureNumberDefaultStrokeWidth,
      ),
      left:
        this.note.measureNumberOffsetX != null
          ? withZoom(this.note.measureNumberOffsetX, 'em')
          : undefined,
      top:
        this.note.measureNumberOffsetY != null
          ? withZoom(this.note.measureNumberOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get noteIndicatorStyle() {
    return {
      color: this.pageSetup.noteIndicatorDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.pageSetup.noteIndicatorDefaultStrokeWidth,
      ),
      left:
        this.note.noteIndicatorOffsetX != null
          ? withZoom(this.note.noteIndicatorOffsetX, 'em')
          : undefined,
      top:
        this.note.noteIndicatorOffsetY != null
          ? withZoom(this.note.noteIndicatorOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get isonStyle() {
    return {
      color: this.pageSetup.isonDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.isonDefaultStrokeWidth),
      left:
        this.note.isonOffsetX != null
          ? withZoom(this.note.isonOffsetX, 'em')
          : undefined,
      top:
        this.note.isonOffsetY != null
          ? withZoom(this.note.isonOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get timeStyle() {
    return {
      left:
        this.note.timeNeumeOffsetX != null
          ? withZoom(this.note.timeNeumeOffsetX, 'em')
          : undefined,
      top:
        this.note.timeNeumeOffsetY != null
          ? withZoom(this.note.timeNeumeOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
  }

  get koronisStyle() {
    return {
      color: this.pageSetup.koronisDefaultColor,
      webkitTextStrokeWidth: withZoom(this.pageSetup.koronisDefaultStrokeWidth),
      left:
        this.note.koronisOffsetX != null
          ? withZoom(this.note.koronisOffsetX, 'em')
          : undefined,
      top:
        this.note.koronisOffsetY != null
          ? withZoom(this.note.koronisOffsetY, 'em')
          : undefined,
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

  get vocalExpressionStyle() {
    const style = {
      left:
        this.note.vocalExpressionNeumeOffsetX != null
          ? withZoom(this.note.vocalExpressionNeumeOffsetX, 'em')
          : undefined,
      top:
        this.note.vocalExpressionNeumeOffsetY != null
          ? withZoom(this.note.vocalExpressionNeumeOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;

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
        this.note.tieOffsetX != null
          ? withZoom(this.note.tieOffsetX, 'em')
          : undefined,
      top:
        this.note.tieOffsetY != null
          ? withZoom(this.note.tieOffsetY, 'em')
          : undefined,
    } as CSSStyleDeclaration;
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
