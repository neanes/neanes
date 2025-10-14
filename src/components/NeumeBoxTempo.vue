<template>
  <div
    class="neume"
    :style="style"
    @click.exact="$emit('select-single')"
    @click.shift.exact="$emit('select-range')"
  >
    <Neume
      :neume="neume.neume"
      :fontFamily="pageSetup.neumeDefaultFontFamily"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { TempoElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

export default defineComponent({
  components: { Neume },
  emits: ['select-single', 'select-range'],
  props: {
    neume: {
      type: Object as PropType<TempoElement>,
      required: true,
    },
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
  },

  data() {
    return {};
  },

  computed: {
    style() {
      return {
        color: this.pageSetup.tempoDefaultColor,
        fontSize: withZoom(this.pageSetup.neumeDefaultFontSize),
        webkitTextStrokeWidth: withZoom(this.pageSetup.tempoDefaultStrokeWidth),
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
