<template>
  <button
    type="button"
    class="flex min-w-0 flex-col items-center justify-start gap-1 rounded-none border bg-background px-2 py-2 text-center transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
    @click="$emit('select')"
  >
    <span class="mb-1 flex min-h-8 w-full items-center justify-center">
      <InitialMartyriaSample
        :martyria-style="martyriaStyle"
        :paragraph-styles="paragraphStyles"
        :template-id="templateId"
        :page-setup="pageSetup"
        :max-font-size="maxFontSize"
      />
    </span>
    <span class="text-[11px] leading-tight font-medium">
      {{ caption }}
    </span>
  </button>
</template>

<script setup lang="ts">
import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';

defineEmits<{ select: [] }>();

withDefaults(
  defineProps<{
    martyriaStyle: InitialMartyriaStyle;
    paragraphStyles: ParagraphStyle[];
    templateId: number;
    pageSetup: PageSetup;
    caption: string;
    maxFontSize?: number | null;
  }>(),
  { maxFontSize: 20 },
);
</script>
