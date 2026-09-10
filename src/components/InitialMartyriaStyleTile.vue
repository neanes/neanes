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
        :style="style"
        :template-id="templateId"
        :page-setup="pageSetup"
        :max-font-size="maxFontSize"
      />
    </span>
    <span
      v-if="pronunciation != null"
      class="text-[11px] leading-tight text-muted-foreground"
      :lang="style?.structure.languageId"
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
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import { ModeKeyElement } from '@/models/Element';
import {
  getInitialMartyriaContext,
  type InitialMartyriaStyle,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleAppearances,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { PageSetup } from '@/models/PageSetup';

defineEmits<{ select: [] }>();

const props = withDefaults(
  defineProps<{
    style: InitialMartyriaStyle | null;
    templateId: number;
    pageSetup: PageSetup;
    selected: boolean;
    caption?: string | null;
    showPronunciation?: boolean;
    maxFontSize?: number | null;
  }>(),
  { caption: null, showPronunciation: true, maxFontSize: 20 },
);

const pronunciation = computed(() => {
  if (props.style == null || !props.showPronunciation) {
    return null;
  }
  const element = ModeKeyElement.createFromTemplate(
    modeKeyTemplates.find((item) => item.id === props.templateId)!,
  );
  return resolveInitialMartyriaStyle({
    context: getInitialMartyriaContext(element),
    resolvedStyle: resolveInitialMartyriaStyleAppearances(
      props.style,
      props.pageSetup.neumeDefaultFontFamily,
    ),
    pageSetup: props.pageSetup,
  }).pronunciation;
});

const ariaLabel = computed(() =>
  [props.caption, pronunciation.value]
    .filter((part) => part != null)
    .join(': '),
);
</script>
