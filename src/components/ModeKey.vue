<template>
  <div
    class="mode-key-container"
    :style="style"
    @click="$emit('select-single')"
  >
    <Neume :neume="ModeSign.Ekhos" />
    <Neume v-if="element.isPlagal" :neume="ModeSign.Plagal" />
    <Neume v-if="element.isVarys" :neume="ModeSign.Varys" />
    <Neume :neume="element.martyria" />
    <Neume v-if="element.note != null" :neume="element.note" />
    <Neume
      v-if="element.fthoraAboveNote != null"
      :neume="element.fthoraAboveNote"
    />
    <Neume
      v-if="element.quantitativeNeumeAboveNote != null"
      :neume="element.quantitativeNeumeAboveNote"
    />
    <Neume v-if="element.note2 != null" :neume="element.note2" />
    <Neume
      v-if="element.fthoraAboveNote2 != null"
      :neume="element.fthoraAboveNote2"
    />
    <Neume
      v-if="element.quantitativeNeumeAboveNote2 != null"
      :neume="element.quantitativeNeumeAboveNote2"
    />
    <Neume
      v-if="element.quantitativeNeumeRight != null"
      :neume="element.quantitativeNeumeRight"
    />
    <Neume
      v-if="element.fthoraAboveQuantitativeNeumeRight != null"
      :neume="element.fthoraAboveQuantitativeNeumeRight"
    />
    <Neume
      v-if="element.tempo != null && !element.tempoAlignRight"
      :neume="element.tempo"
      :style="tempoStyle"
    />
    <span class="right-container">
      <span class="ambitus" v-if="element.showAmbitus">
        <span class="ambitus-text">(</span>
        <span class="ambitus-low" :style="ambitusStyle">
          <Neume :neume="element.ambitusLowNote" />
          <Neume :neume="element.ambitusLowRootSign" />
        </span>
        <span class="ambitus-text">-</span>
        <span class="ambitus-high" :style="ambitusStyle">
          <Neume :neume="element.ambitusHighNote" />
          <Neume :neume="element.ambitusHighRootSign" />
        </span>
        <span class="ambitus-text">)</span>
      </span>

      <Neume
        v-if="element.tempo != null && element.tempoAlignRight"
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { ModeKeyElement } from '@/models/Element';
import { ModeSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

export default defineComponent({
  components: { Neume },
  emits: ['select-single'],
  props: {
    element: {
      type: Object as PropType<ModeKeyElement>,
      required: true,
    },
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
  },

  data() {
    return {
      ModeSign,
    };
  },

  computed: {
    style() {
      return {
        color: this.element.computedColor,
        fontFamily: this.element.computedFontFamily,
        fontSize: withZoom(this.element.computedFontSize),
        textAlign: this.element.alignment,
        width: withZoom(this.element.width),
        height: withZoom(this.element.height),
        webkitTextStrokeWidth: withZoom(this.element.computedStrokeWidth),
      } as StyleValue;
    },

    tempoStyle() {
      // TODO figure out a way to remove the hard-coded -.45em
      // maybe put it in the font metadata json?
      const style = {
        color: this.pageSetup.tempoDefaultColor,
        webkitTextStrokeWidth: withZoom(this.pageSetup.tempoDefaultStrokeWidth),
        top: '-0.45em',
        marginLeft: withZoom(8),
      } as StyleValue;

      return style;
    },

    ambitusStyle() {
      // TODO figure out a way to remove the hard-coded -.45em
      // maybe put it in the font metadata json?
      const style = {
        color: this.pageSetup.martyriaDefaultColor,
        webkitTextStrokeWidth: withZoom(
          this.pageSetup.martyriaDefaultStrokeWidth,
        ),
        position: 'relative',
        top: '-0.45em',
      } as StyleValue;

      return style;
    },
  },

  methods: {},
});
</script>

<style scoped>
.mode-key-container {
  border: 1px dotted black;
  box-sizing: border-box;
  user-select: none;

  position: relative;
}

.right-container {
  position: absolute;
  right: 0;
}

.ambitus {
  position: relative;
  top: calc(-4px * var(--zoom));
}

.ambitus-text {
  font-family: Arial, Helvetica, sans-serif;
}

.ambitus-low {
  margin-right: 10px;
}

.ambitus-high {
  margin-left: 2px;
  margin-right: 4px;
}
</style>
