<template>
  <AppTooltip :tooltip="label">
    <!--
      The wrapper span still receives pointer events while the button is
      disabled, so clicking an inactive clear action does not blur the active
      editor.
    -->
    <span class="inline-flex" @mousedown.prevent>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        class="text-muted-foreground"
        :aria-label="label"
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

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['clear']);

const { t } = useTranslation();
const label = computed(() =>
  t(($) => $.toolbar.common.clearFormatting, {
    ns: 'toolbar',
  }),
);
</script>
