<template>
  <span v-if="!tooltip" v-bind="$attrs" class="neume" :style="style">{{
    text
  }}</span>
  <AppTooltip v-else :tooltip="tooltip">
    <span v-bind="$attrs" class="neume" :style="style">{{ text }}</span>
  </AppTooltip>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import { computed } from 'vue';

import type { AppTooltipValue } from '@/components/AppTooltip.types';
import AppTooltip from '@/components/AppTooltip.vue';
import type { ScoreElementOffset } from '@/models/Element';
import type { Neume as NeumeType } from '@/models/Neumes';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { withZoom } from '@/utils/withZoom';

defineOptions({
  inheritAttrs: false,
});

defineEmits(['update']);
const props = defineProps({
  neume: {
    type: String as PropType<NeumeType>,
    required: true,
  },
  offset: {
    type: Object as PropType<ScoreElementOffset>,
    default: undefined,
  },
  fontFamily: {
    type: String,
    default: undefined,
  },
  tooltip: {
    type: [String, Object] as PropType<AppTooltipValue>,
    default: undefined,
  },
});

const mapping = computed(() => {
  let mapping = NeumeMappingService.getMapping(props.neume);

  if (!mapping) {
    console.warn('Could not find mapping for neume ' + props.neume);
    mapping = {
      text: '?',
      glyphName: 'ison',
    };
  }

  return mapping;
});

const text = computed(() => mapping.value.text);

const style = computed(() => {
  const style = {} as Partial<CSSStyleDeclaration>;

  if (props.fontFamily != null) {
    style.fontFamily = props.fontFamily;
  }

  if (mapping.value.salt != null) {
    style.fontFeatureSettings = `"salt" ${mapping.value.salt}`;
  }

  if (props.offset) {
    style.left = withZoom(props.offset.x);
    style.top = withZoom(props.offset.y);
  }

  return style as StyleValue;
});
</script>

<style scoped>
.neume {
  position: relative;
}
</style>
