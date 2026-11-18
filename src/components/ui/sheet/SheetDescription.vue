<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core';
import { cn } from 'cn';
import type { DialogDescriptionProps } from 'reka-ui';
import { DialogDescription } from 'reka-ui';
import type { HTMLAttributes } from 'vue';

const props = defineProps<
  DialogDescriptionProps & { class?: HTMLAttributes['class'] }
>();

const delegatedProps = reactiveOmit(props, 'class');
</script>

<template>
  <DialogDescription
    data-slot="sheet-description"
    :class="cn('text-muted-foreground text-xs/relaxed', props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </DialogDescription>
</template>
