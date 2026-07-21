<template>
  <!--
    Every row shares one grid: the label (and optional activation switch) in a
    flexible left column, the control in a fixed-width right column with a
    single left edge. Both sides center within the standard control height, so
    single-line rows align exactly and multi-line clusters hang from their
    first line instead of floating around a centered label.
  -->
  <Field orientation="horizontal" class="items-start">
    <div class="flex min-h-9 min-w-0 flex-1 items-center gap-3">
      <Switch
        v-if="showToggle"
        :model-value="active"
        @update:model-value="emit('toggle', $event)"
      />
      <FieldLabel :for="labelFor">
        {{ label }}
      </FieldLabel>
    </div>
    <div class="flex min-h-9 w-64 shrink-0 flex-col items-start justify-center">
      <slot />
    </div>
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
