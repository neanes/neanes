<template>
  <div
    class="neume"
    :style="style"
    @click.exact="$emit('select-single')"
    @click.shift.exact="$emit('select-range')"
  >
    <template v-if="neume.error"> ? </template>
    <template v-else>
      <Neume
        v-if="hasMeasureBarLeft && !isMeasureBarAbove"
        :neume="neume.measureBarLeft!"
        :style="measureBarStyle"
      />
      <Neume
        v-if="hasTempoLeft"
        :neume="neume.tempoLeft!"
        :style="tempoStyle"
      />
      <Neume :neume="neume.note" />
      <Neume :neume="neume.rootSign" />
      <Neume v-if="hasFthora" :neume="neume.fthora!" :style="fthoraStyle" />
      <Neume v-if="hasTempo" :neume="neume.tempo!" :style="tempoStyle" />
      <Neume
        v-if="hasMeasureBarLeft && isMeasureBarAbove"
        :neume="neume.measureBarLeft!"
        :style="measureBarStyle"
      />
      <Neume
        v-if="hasQuantitativeNeume"
        :neume="neume.quantitativeNeume!"
        :style="quantitativeNeumeStyle"
      />
      <Neume
        v-if="hasTempoRight"
        :neume="neume.tempoRight!"
        :style="tempoStyle"
      />
      <Neume
        v-if="hasMeasureBarRight"
        :neume="neume.measureBarRight!"
        :style="measureBarStyle"
      />
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { MartyriaElement } from '@/models/Element';
import { Note } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

export default defineComponent({
  components: { Neume },
  emits: ['select-single', 'select-range'],
  props: {
    neume: {
      type: Object as PropType<MartyriaElement>,
      required: true,
    },
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
  },

  data() {
    return {
      Note,
    };
  },

  computed: {
    hasFthora() {
      return this.neume.fthora != null;
    },

    hasTempoLeft() {
      return this.neume.tempoLeft != null;
    },

    hasTempo() {
      return this.neume.tempo != null;
    },

    hasTempoRight() {
      return this.neume.tempoRight != null;
    },

    hasMeasureBarLeft() {
      return this.neume.measureBarLeft != null;
    },

    hasMeasureBarRight() {
      return this.neume.measureBarRight != null;
    },

    hasQuantitativeNeume() {
      return this.neume.quantitativeNeume != null && this.neume.alignRight;
    },

    isMeasureBarAbove() {
      return this.neume.measureBarLeft?.endsWith('Above');
    },

    style() {
      const verticalOffset =
        this.pageSetup.martyriaVerticalOffset + this.neume.verticalOffset;

      return {
        color: this.pageSetup.martyriaDefaultColor,
        fontFamily: this.pageSetup.neumeDefaultFontFamily,
        fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.martyriaDefaultStrokeWidth,
        ),
        position: verticalOffset != 0 ? 'relative' : undefined,
        top: verticalOffset != 0 ? withZoom(verticalOffset) : undefined,
      } as StyleValue;
    },

    fthoraStyle() {
      return {
        color: this.pageSetup.fthoraDefaultColor,
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.fthoraDefaultStrokeWidth,
        ),
      } as StyleValue;
    },

    quantitativeNeumeStyle() {
      return {
        marginLeft: withZoom(this.neume.padding),
        color: this.pageSetup.neumeDefaultColor,
        webkitTextStrokeWidth: withZoom(this.pageSetup.neumeDefaultStrokeWidth),
      } as StyleValue;
    },

    tempoStyle() {
      return {
        color: this.pageSetup.tempoDefaultColor,
        webkitTextStrokeWidth: withZoom(this.pageSetup.tempoDefaultStrokeWidth),
      } as StyleValue;
    },

    measureBarStyle() {
      return {
        color: this.pageSetup.measureBarDefaultColor,
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.measureBarDefaultStrokeWidth,
        ),
      } as StyleValue;
    },
  },

  methods: {},
});
</script>

<style scoped>
.neume {
  cursor: default;
  user-select: none;
}
</style>
