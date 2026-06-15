<template>
  <div class="neume measure-bar" :style="style">
    <Neume :neume="element.measureBar" :style="measureBarStyle" />
  </div>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import { computed } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import type { MeasureBarElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

const props = defineProps({
  element: {
    type: Object as PropType<MeasureBarElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const style = computed(() => {
  return {
    fontFamily: props.pageSetup.neumeDefaultFontFamily,
    fontSize: withZoom(props.pageSetup.neumeDefaultFontSize),
    userSelect: 'none',
  } as StyleValue;
});

const measureBarStyle = computed(() => {
  return {
    color: props.pageSetup.measureBarDefaultColor,
    webkitTextStrokeWidth: withZoom(
      props.pageSetup.measureBarDefaultStrokeWidth,
    ),
    transform: `translate(${withZoom(
      props.element.computedOffsetX,
    )}, ${withZoom(props.element.computedOffsetY)})`,
  } as StyleValue;
});
</script>

<style scoped>
.measure-bar {
  cursor: default;
}
</style>
