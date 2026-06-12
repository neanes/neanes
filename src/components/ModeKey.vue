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
      <span v-if="element.showAmbitus" class="ambitus">
        <span class="ambitus-text">(</span>
        <span class="ambitus-low" :style="ambitusStyleLow">
          <Neume :neume="element.ambitusLowNote" />
          <Neume :neume="element.ambitusLowRootSign" />
        </span>
        <span class="ambitus-text">-</span>
        <span class="ambitus-high" :style="ambitusStyleHigh">
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

<script setup lang="ts">
import type { CSSProperties, PropType, StyleValue } from 'vue';
import { computed } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import type { ModeKeyElement } from '@/models/Element';
import { ModeSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { withZoom } from '@/utils/withZoom';

defineEmits(['select-single']);
const props = defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const style = computed(() => {
  return {
    color: props.element.computedColor,
    fontFamily: props.element.computedFontFamily,
    fontSize: withZoom(props.element.computedFontSize),
    textAlign: props.element.alignment,
    width: withZoom(props.element.width),
    height: withZoom(props.element.height),
    webkitTextStrokeWidth: withZoom(props.element.computedStrokeWidth),
  } as StyleValue;
});

const tempoStyle = computed(() => {
  // TODO figure out a way to remove the hard-coded -.45em
  // maybe put it in the font metadata json?
  const style = {
    color: props.pageSetup.tempoDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.tempoDefaultStrokeWidth),
    top: '-0.45em',
    marginLeft: withZoom(8),
  } as StyleValue;

  return style;
});

const ambitusStyle = computed(() => {
  // TODO figure out a way to remove the hard-coded -.45em
  // maybe put it in the font metadata json?
  const style = {
    color: props.pageSetup.martyriaDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.martyriaDefaultStrokeWidth),
    position: 'relative',
    top: '-0.45em',
  } as CSSProperties;

  return style;
});

const ambitusStyleLow = computed(() => {
  const text = [props.element.ambitusLowNote, props.element.ambitusLowRootSign]
    .map((neume) => NeumeMappingService.getMapping(neume).text)
    .join('');
  const font = `${props.pageSetup.neumeDefaultFontSize}px ${props.pageSetup.neumeDefaultFontFamily}`;

  const bounds = TextMeasurementService.getInkBounds(text, font);

  const style = {
    ...ambitusStyle.value,
    marginLeft: `${4 - bounds.inkLeft}px`,
  } as CSSProperties;

  return style;
});

const ambitusStyleHigh = computed(() => {
  const text = [
    props.element.ambitusHighNote,
    props.element.ambitusHighRootSign,
  ]
    .map((neume) => NeumeMappingService.getMapping(neume).text)
    .join('');
  const font = `${props.pageSetup.neumeDefaultFontSize}px ${props.pageSetup.neumeDefaultFontFamily}`;

  const bounds = TextMeasurementService.getInkBounds(text, font);

  const style = {
    ...ambitusStyle.value,
    marginRight: `${4 - (bounds.advanceWidth - bounds.inkRight)}px`,
  } as CSSProperties;

  return style;
});
</script>

<style scoped>
.mode-key-container {
  border: 1px dotted black;
  box-sizing: border-box;
  line-height: normal;
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
  margin-left: 10px;
}
</style>
