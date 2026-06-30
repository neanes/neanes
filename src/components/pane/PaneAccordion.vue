<template>
  <FieldSet :class="cn('min-h-0 flex-1 overflow-auto', props.class)">
    <FieldLegend class="sr-only">
      <slot name="legend" />
    </FieldLegend>
    <Accordion
      type="multiple"
      :class="cn('pane-accordion', props.accordionClass)"
      :model-value="props.openSections"
      @update:model-value="onOpenSectionsChanged($event as string[])"
    >
      <slot />
    </Accordion>
  </FieldSet>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { provide } from 'vue';

import { Accordion } from '@/components/ui/accordion';
import { FieldLegend, FieldSet } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import { paneSectionRegistrationKey } from './PaneSectionRegistration';

const props = defineProps<{
  accordionClass?: HTMLAttributes['class'];
  class?: HTMLAttributes['class'];
  openSections: string[];
}>();

const emit = defineEmits<{
  (event: 'update:open-sections', value: string[]): void;
}>();

const registeredSections = new Set<string>();

provide(paneSectionRegistrationKey, {
  registerSection(value: string) {
    registeredSections.add(value);
  },
  unregisterSection(value: string) {
    registeredSections.delete(value);
  },
});

function onOpenSectionsChanged(value: string[]) {
  const nextVisibleSections = value.filter((section) =>
    registeredSections.has(section),
  );
  const hiddenOpenSections = props.openSections.filter(
    (section) => !registeredSections.has(section),
  );

  emit('update:open-sections', [...hiddenOpenSections, ...nextVisibleSections]);
}
</script>

<style scoped>
.pane-accordion {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
