<template>
  <AppTooltip :tooltip="effectiveLabel">
    <span class="inline-flex" @mousedown.prevent>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        class="text-muted-foreground"
        :aria-label="effectiveLabel"
        :disabled="disabled"
        @click="$emit('clear')"
      >
        <PhTextTSlash />
      </Button>
    </span>
  </AppTooltip>
</template>

<script setup lang="ts">
import { PhTextTSlash } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import { Button } from '@/components/ui/button';

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: undefined,
  },
});

defineEmits(['clear']);

const { t } = useTranslation();
const effectiveLabel = computed(
  () =>
    props.label ??
    t(($) => $.toolbar.common.clearFormatting, {
      ns: 'toolbar',
    }),
);
</script>
