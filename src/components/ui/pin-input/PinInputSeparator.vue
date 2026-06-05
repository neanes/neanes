<script setup lang="ts">
import { PhMinus } from '@phosphor-icons/vue';
import type { PrimitiveProps } from 'reka-ui';
import { Primitive, useForwardProps } from 'reka-ui';

const props = defineProps<PrimitiveProps>();
const forwardedProps = useForwardProps(props);
</script>

<template>
  <Primitive data-slot="pin-input-separator" v-bind="forwardedProps">
    <slot>
      <PhMinus />
    </slot>
  </Primitive>
</template>
