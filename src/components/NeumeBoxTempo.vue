<template>
  <div
    class="neume"
    :style="style"
    @click.exact="$emit('select-single')"
    @click.shift.exact="$emit('select-range')"
  >
    <Neume
      :neume="neume.neume"
      :font-family="pageSetup.neumeDefaultFontFamily"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import { computed } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import type { TempoElement } from '@/models/Element';
import type { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

const props = defineProps({
  neume: {
    type: Object as PropType<TempoElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

defineEmits(['select-single', 'select-range']);

const style = computed(() => {
  return {
    color: props.pageSetup.tempoDefaultColor,
    fontSize: withZoom(props.pageSetup.neumeDefaultFontSize),
    webkitTextStrokeWidth: withZoom(props.pageSetup.tempoDefaultStrokeWidth),
  } as StyleValue;
});
</script>

<style scoped>
.neume {
  cursor: default;
  user-select: none;
}
</style>
