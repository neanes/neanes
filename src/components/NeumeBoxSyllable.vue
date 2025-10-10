<template>
  <div
    class="neume"
    :style="style"
    @click.exact="$emit('select-single')"
    @click.shift.exact="$emit('select-range')"
  >
    <Neume
      v-if="hasMeasureBarLeft && !isMeasureBarAbove"
      :neume="getMeasureBarLeft!"
      :style="measureBarLeftStyle"
    />
    <Neume
      v-if="note.vareia && !pageSetup.melkiteRtl"
      :neume="VocalExpressionNeume.Vareia"
      :style="vareiaStyle"
    />
    <Neume :neume="note.quantitativeNeume" :style="neumeStyle" />
    <Neume
      v-if="note.stavros"
      :neume="VocalExpressionNeume.Cross_Top"
      :style="stavrosStyle"
    />
    <Neume
      v-if="hasVocalExpressionNeume"
      :neume="note.vocalExpressionNeume!"
      :style="vocalExpressionStyle"
    />
    <Neume v-if="hasTimeNeume" :neume="note.timeNeume!" :style="timeStyle" />
    <Neume
      v-if="note.koronis"
      :neume="TimeNeume.Koronis"
      :style="koronisStyle"
    />
    <Neume
      v-if="hasGorgonNeume"
      :neume="note.gorgonNeume!"
      :style="gorgonStyle"
    />
    <Neume
      v-if="hasSecondaryGorgonNeume"
      :neume="note.secondaryGorgonNeume!"
      :style="secondaryGorgonStyle"
    />
    <Neume v-if="hasFthora" :neume="note.fthora!" :style="fthoraStyle" />
    <Neume
      v-if="hasSecondaryFthora"
      :neume="note.secondaryFthora!"
      :style="secondaryFthoraStyle"
    />
    <Neume
      v-if="hasTertiaryFthora"
      :neume="note.tertiaryFthora!"
      :style="tertiaryFthoraStyle"
    />
    <Neume
      v-if="hasAccidental"
      :neume="note.accidental!"
      :style="accidentalStyle"
    />
    <Neume
      v-if="hasSecondaryAccidental"
      :neume="note.secondaryAccidental!"
      :style="secondaryAccidentalStyle"
    />
    <Neume
      v-if="hasTertiaryAccidental"
      :neume="note.tertiaryAccidental!"
      :style="tertiaryAccidentalStyle"
    />
    <Neume
      v-if="note.noteIndicator && note.noteIndicatorNeume"
      :neume="note.noteIndicatorNeume"
      :style="noteIndicatorStyle"
    />
    <Neume v-if="hasIson" :neume="note.ison!" :style="isonStyle" />
    <Neume
      v-if="hasMeasureNumber"
      :neume="note.measureNumber!"
      :style="measureNumberStyle"
    />
    <Neume
      v-if="hasMeasureBarLeft && isMeasureBarAbove"
      :neume="getMeasureBarLeft!"
      :style="measureBarLeftStyle"
    />
    <Neume
      v-if="hasMeasureBarRight"
      :neume="getMeasureBarRight!"
      :style="measureBarRightStyle"
    />
    <Neume v-if="hasTie" :neume="note.tie!" :style="tieStyle" />
    <Neume
      v-if="note.vareia && pageSetup.melkiteRtl"
      :neume="VocalExpressionNeume.Vareia"
      :style="vareiaStyle"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import NeumeVue from '@/components/NeumeGlyph.vue';
import { NoteElement } from '@/models/Element';
import {
  QuantitativeNeume,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

export default defineComponent({
  components: { Neume: NeumeVue },
  emits: ['select-single', 'select-range'],
  props: {
    note: {
      type: Object as PropType<NoteElement>,
      required: true,
    },
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
    alternateLine: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      TimeNeume,
      VocalExpressionNeume,
    };
  },

  computed: {
    hasVocalExpressionNeume() {
      return this.note.vocalExpressionNeume != null;
    },

    hasTimeNeume() {
      return this.note.timeNeume != null;
    },

    hasGorgonNeume() {
      return this.note.gorgonNeume != null;
    },

    hasSecondaryGorgonNeume() {
      return this.note.secondaryGorgonNeume != null;
    },

    hasFthora() {
      return this.note.fthora != null;
    },

    hasSecondaryFthora() {
      return this.note.secondaryFthora != null;
    },

    hasTertiaryFthora() {
      return this.note.tertiaryFthora != null;
    },

    hasAccidental() {
      return this.note.accidental != null;
    },

    hasSecondaryAccidental() {
      return this.note.secondaryAccidental != null;
    },

    hasTertiaryAccidental() {
      return this.note.tertiaryAccidental != null;
    },

    hasMeasureBarLeft() {
      return (
        this.note.measureBarLeft != null ||
        this.note.computedMeasureBarLeft != null
      );
    },

    hasMeasureBarRight() {
      return (
        this.note.measureBarRight != null ||
        this.note.computedMeasureBarRight != null
      );
    },

    getMeasureBarLeft() {
      return this.note.measureBarLeft
        ? this.note.measureBarLeft
        : this.note.computedMeasureBarLeft;
    },

    getMeasureBarRight() {
      return this.note.measureBarRight
        ? this.note.measureBarRight
        : this.note.computedMeasureBarRight;
    },

    isMeasureBarAbove() {
      return (
        this.note.measureBarLeft
          ? this.note.measureBarLeft
          : this.note.computedMeasureBarLeft
      )?.endsWith('Above');
    },

    hasMeasureNumber() {
      return this.note.measureNumber != null;
    },

    hasIson() {
      return this.note.ison != null;
    },

    hasTie() {
      return this.note.tie != null;
    },

    style() {
      return {
        fontFamily: this.pageSetup.neumeDefaultFontFamily,
        fontSize: this.alternateLine
          ? withZoom(this.pageSetup.alternateLineDefaultFontSize)
          : withZoom(this.pageSetup.neumeDefaultFontSize),
        color: this.alternateLine
          ? this.pageSetup.alternateLineDefaultColor
          : this.pageSetup.neumeDefaultColor,
        webkitTextStrokeWidth: withZoom(this.pageSetup.neumeDefaultStrokeWidth),
      } as StyleValue;
    },

    gorgonStyle() {
      return {
        color: this.pageSetup.gorgonDefaultColor,
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.gorgonDefaultStrokeWidth,
        ),
        left:
          this.note.gorgonNeumeOffsetX != null
            ? `${this.note.gorgonNeumeOffsetX}em`
            : undefined,
        top:
          this.note.gorgonNeumeOffsetY != null
            ? `${this.note.gorgonNeumeOffsetY}em`
            : undefined,
      } as StyleValue;
    },

    secondaryGorgonStyle() {
      return {
        color: this.pageSetup.gorgonDefaultColor,
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.gorgonDefaultStrokeWidth,
        ),
        left:
          this.note.secondaryGorgonNeumeOffsetX != null
            ? `${this.note.secondaryGorgonNeumeOffsetX}em`
            : undefined,
        top:
          this.note.secondaryGorgonNeumeOffsetY != null
            ? `${this.note.secondaryGorgonNeumeOffsetY}em`
            : undefined,
      } as StyleValue;
    },

    fthoraStyle() {
      return {
        color: this.pageSetup.fthoraDefaultColor,
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.fthoraDefaultStrokeWidth,
        ),
        left:
          this.note.fthoraOffsetX != null
            ? `${this.note.fthoraOffsetX}em`
            : undefined,
        top:
          this.note.fthoraOffsetY != null
            ? `${this.note.fthoraOffsetY}em`
            : undefined,
      } as StyleValue;
    },

    secondaryFthoraStyle() {
      return {
        color: this.pageSetup.fthoraDefaultColor,
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.fthoraDefaultStrokeWidth,
        ),
        left:
          this.note.secondaryFthoraOffsetX != null
            ? `${this.note.secondaryFthoraOffsetX}em`
            : undefined,
        top:
          this.note.secondaryFthoraOffsetY != null
            ? `${this.note.secondaryFthoraOffsetY}em`
            : undefined,
      } as StyleValue;
    },

    tertiaryFthoraStyle() {
      return {
        color: this.pageSetup.fthoraDefaultColor,
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.fthoraDefaultStrokeWidth,
        ),
        left:
          this.note.tertiaryFthoraOffsetX != null
            ? `${this.note.tertiaryFthoraOffsetX}em`
            : undefined,
        top:
          this.note.tertiaryFthoraOffsetY != null
            ? `${this.note.tertiaryFthoraOffsetY}em`
            : undefined,
      } as StyleValue;
    },

    accidentalStyle() {
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
    },

    secondaryAccidentalStyle() {
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
    },

    tertiaryAccidentalStyle() {
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
    },

    measureBarLeftStyle() {
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
    },

    measureBarRightStyle() {
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
    },

    measureNumberStyle() {
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
    },

    noteIndicatorStyle() {
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
    },

    isonStyle() {
      return {
        color: this.pageSetup.isonDefaultColor,
        webkitTextStrokeWidth: withZoom(this.pageSetup.isonDefaultStrokeWidth),
        left:
          this.note.isonOffsetX != null
            ? `${this.note.isonOffsetX}em`
            : undefined,
        top:
          this.note.computedIsonOffsetY != null
            ? `${this.note.computedIsonOffsetY}em`
            : undefined,
      } as StyleValue;
    },

    timeStyle() {
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
    },

    neumeStyle() {
      if (this.note.quantitativeNeume == QuantitativeNeume.Cross) {
        return {
          color: this.pageSetup.crossDefaultColor,
          webkitTextStrokeWidth: withZoom(
            this.pageSetup.crossDefaultStrokeWidth,
          ),
        } as StyleValue;
      } else if (this.note.quantitativeNeume == QuantitativeNeume.Breath) {
        return {
          color: this.pageSetup.breathDefaultColor,
          webkitTextStrokeWidth: withZoom(
            this.pageSetup.breathDefaultStrokeWidth,
          ),
        } as StyleValue;
      }

      return {};
    },

    koronisStyle() {
      return {
        color: this.pageSetup.koronisDefaultColor,
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.koronisDefaultStrokeWidth,
        ),
        left:
          this.note.koronisOffsetX != null
            ? `${this.note.koronisOffsetX}em`
            : undefined,
        top:
          this.note.koronisOffsetY != null
            ? `${this.note.koronisOffsetY}em`
            : undefined,
      } as StyleValue;
    },

    stavrosStyle() {
      return {
        color: this.pageSetup.crossDefaultColor,
        webkitTextStrokeWidth: withZoom(this.pageSetup.crossDefaultStrokeWidth),
        left:
          this.note.stavrosOffsetX != null
            ? `${this.note.stavrosOffsetX}em`
            : undefined,
        top:
          this.note.stavrosOffsetY != null
            ? `${this.note.stavrosOffsetY}em`
            : undefined,
      } as StyleValue;
    },

    vareiaStyle() {
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
    },

    vocalExpressionStyle() {
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
    },

    tieStyle() {
      return {
        left:
          this.note.tieOffsetX != null
            ? `${this.note.tieOffsetX}em`
            : undefined,
        top:
          this.note.tieOffsetY != null
            ? `${this.note.tieOffsetY}em`
            : undefined,
      } as StyleValue;
    },
  },

  methods: {},
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume {
  cursor: default;
  user-select: none;
}
</style>
