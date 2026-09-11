<template>
  <button
    type="button"
    class="flex min-w-0 flex-col items-center justify-start gap-1 rounded-md border bg-background px-2 py-2 text-center transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    :class="selected && 'ring-2 ring-foreground'"
    :aria-pressed="selected"
    :aria-label="ariaLabel"
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
    <span
      class="text-[11px] leading-tight text-muted-foreground"
      :lang="martyriaStyle.structure.languageId"
      aria-hidden="true"
    >
      {{ pronunciation }}
    </span>
    <span
      v-if="caption != null"
      class="text-[11px] leading-tight font-medium"
      aria-hidden="true"
    >
      {{ caption }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import { getSamplePronunciation } from '@/components/InitialMartyriaStylesDialog.shared';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';

defineEmits<{ select: [] }>();

const props = withDefaults(
  defineProps<{
    martyriaStyle: InitialMartyriaStyle;
    paragraphStyles: ParagraphStyle[];
    templateId: number;
    pageSetup: PageSetup;
    selected: boolean;
    caption?: string | null;
    maxFontSize?: number | null;
  }>(),
  { caption: null, maxFontSize: 20 },
);

const pronunciation = computed(() =>
  getSamplePronunciation(props.martyriaStyle.structure, props.templateId),
);

const ariaLabel = computed(() =>
  [props.caption, pronunciation.value]
    .filter((part) => part != null)
    .join(': '),
);
</script>
