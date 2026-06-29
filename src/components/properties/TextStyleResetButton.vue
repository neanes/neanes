<template>
  <AppTooltip
    :tooltip="$t(($) => $.toolbar.common.resetToDefault, { ns: 'toolbar' })"
  >
    <span class="inline-flex" @mousedown.prevent>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        class="text-muted-foreground"
        :aria-label="
          $t(($) => $.toolbar.common.resetToDefault, { ns: 'toolbar' })
        "
        :disabled="disabled"
        @click="$emit('reset')"
      >
        <PhEraser />
      </Button>
    </span>
  </AppTooltip>
</template>

<script setup lang="ts">
import { PhEraser } from '@phosphor-icons/vue';

import AppTooltip from '@/components/AppTooltip.vue';
import { Button } from '@/components/ui/button';

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['reset']);
</script>
