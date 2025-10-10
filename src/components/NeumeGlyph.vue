<template>
  <span class="neume" :style="style">{{ text }}</span>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import { ScoreElementOffset } from '@/models/Element';
import { Neume as NeumeType } from '@/models/Neumes';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { withZoom } from '@/utils/withZoom';

export default defineComponent({
  components: {},
  emits: ['update'],
  props: {
    neume: {
      type: String as PropType<NeumeType>,
      required: true,
    },
    offset: Object as PropType<ScoreElementOffset>,
    fontFamily: String,
  },

  data() {
    return {};
  },

  computed: {
    mapping() {
      let mapping = NeumeMappingService.getMapping(this.neume);

      if (!mapping) {
        console.warn('Could not find mapping for neume ' + this.neume);
        mapping = {
          text: '?',
          glyphName: 'ison',
        };
      }

      return mapping;
    },

    text() {
      return this.mapping.text;
    },

    style() {
      const style = {} as Partial<CSSStyleDeclaration>;

      if (this.fontFamily != null) {
        style.fontFamily = this.fontFamily;
      }

      if (this.mapping.salt != null) {
        style.fontFeatureSettings = `"salt" ${this.mapping.salt}`;
      }

      if (this.offset) {
        style.left = withZoom(this.offset.x);
        style.top = withZoom(this.offset.y);
      }

      return style as StyleValue;
    },
  },

  methods: {},
});
</script>

<style scoped>
.neume {
  position: relative;
}
</style>
