<template>
  <Field orientation="horizontal">
    <div class="flex min-w-0 flex-1 items-center gap-3">
      <Switch
        v-if="showToggle"
        :model-value="active"
        @update:model-value="emit('toggle', $event)"
      />
      <FieldLabel :for="labelFor" class="shrink-0">
        {{ label }}
      </FieldLabel>
    </div>
    <slot />
  </Field>
</template>

<script setup lang="ts">
import { Field, FieldLabel } from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';

defineProps({
  label: {
    type: String,
    required: true,
  },
  labelFor: {
    type: String,
    default: undefined,
  },
  active: {
    type: Boolean,
    required: true,
  },
  showToggle: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits<{
  toggle: [value: boolean];
}>();
</script>
