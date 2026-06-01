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

<script setup lang="ts">
import { computed, PropType, StyleValue } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { MartyriaElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

const props = defineProps({
  neume: {
    type: Object as PropType<MartyriaElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

defineEmits(['select-single', 'select-range']);

const hasFthora = computed(() => props.neume.fthora != null);
const hasTempoLeft = computed(() => props.neume.tempoLeft != null);
const hasTempo = computed(() => props.neume.tempo != null);
const hasTempoRight = computed(() => props.neume.tempoRight != null);
const hasMeasureBarLeft = computed(() => props.neume.measureBarLeft != null);
const hasMeasureBarRight = computed(() => props.neume.measureBarRight != null);
const hasQuantitativeNeume = computed(
  () => props.neume.quantitativeNeume != null && props.neume.alignRight,
);
const isMeasureBarAbove = computed(() =>
  props.neume.measureBarLeft?.endsWith('Above'),
);

const style = computed(() => {
  const verticalOffset =
    props.pageSetup.martyriaVerticalOffset + props.neume.verticalOffset;

  return {
    color: props.pageSetup.martyriaDefaultColor,
    fontFamily: props.pageSetup.neumeDefaultFontFamily,
    fontSize: withZoom(props.pageSetup.neumeDefaultFontSize),
    webkitTextStrokeWidth: withZoom(props.pageSetup.martyriaDefaultStrokeWidth),
    position: verticalOffset != 0 ? 'relative' : undefined,
    top: verticalOffset != 0 ? withZoom(verticalOffset) : undefined,
  } as StyleValue;
});

const fthoraStyle = computed(() => {
  return {
    color: props.pageSetup.fthoraDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.fthoraDefaultStrokeWidth),
  } as StyleValue;
});

const quantitativeNeumeStyle = computed(() => {
  return {
    marginLeft: withZoom(props.neume.padding),
    color: props.pageSetup.neumeDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.neumeDefaultStrokeWidth),
  } as StyleValue;
});

const tempoStyle = computed(() => {
  return {
    color: props.pageSetup.tempoDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.tempoDefaultStrokeWidth),
  } as StyleValue;
});

const measureBarStyle = computed(() => {
  return {
    color: props.pageSetup.measureBarDefaultColor,
    webkitTextStrokeWidth: withZoom(
      props.pageSetup.measureBarDefaultStrokeWidth,
    ),
  } as StyleValue;
});
</script>

<style scoped>
.neume {
  cursor: default;
  user-select: none;
}
</style>
