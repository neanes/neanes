<template>
  <AccordionItem :value="value">
    <AccordionTrigger>{{ title }}</AccordionTrigger>
    <AccordionContent>
      <FieldGroup :class="cn('pt-2', props.bodyClass)">
        <slot />
      </FieldGroup>
    </AccordionContent>
  </AccordionItem>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue';
import { inject, onBeforeUnmount, onMounted } from 'vue';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { FieldGroup } from '@/components/ui/field';
import { cn } from '@/lib/utils';

import { paneSectionRegistrationKey } from './PaneSectionRegistration';

const props = defineProps<{
  bodyClass?: HTMLAttributes['class'];
  title: string;
  value: string;
}>();

const sectionRegistration = inject(paneSectionRegistrationKey)!;

onMounted(() => sectionRegistration.registerSection(props.value));
onBeforeUnmount(() => sectionRegistration.unregisterSection(props.value));
</script>
