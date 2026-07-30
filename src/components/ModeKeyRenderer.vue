<template>
  <ModeKey
    v-if="styleSelection.kind === 'standard'"
    v-bind="$attrs"
    :element="element"
    :page-setup="pageSetup"
    @select-single="$emit('select-single')"
  />
  <CustomModeKey
    v-else
    v-bind="$attrs"
    :element="element"
    :initial-martyria-configuration="styleSelection"
    :page-setup="pageSetup"
    @select-single="$emit('select-single')"
  />
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

import CustomModeKey from '@/components/CustomModeKey.vue';
import ModeKey from '@/components/ModeKey.vue';
import type { ModeKeyElement } from '@/models/Element';
import { resolveInitialMartyriaStyleSelection } from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';

defineOptions({ inheritAttrs: false });
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

const styleSelection = computed(() =>
  resolveInitialMartyriaStyleSelection({
    elementConfiguration: props.element.initialMartyriaConfiguration,
    pageConfiguration: props.pageSetup.initialMartyriaConfiguration,
  }),
);
</script>
