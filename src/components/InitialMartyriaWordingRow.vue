<template>
  <div
    class="border-b"
    :class="
      selected && 'bg-accent/50 outline-2 -outline-offset-2 outline-foreground'
    "
  >
    <button
      type="button"
      class="grid w-full items-center gap-x-3 px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
      :style="{
        gridTemplateColumns: `repeat(${samples.length}, minmax(0, 1fr))`,
      }"
      :aria-pressed="selected"
      @click="emit('select')"
    >
      <span
        v-for="sample in samples"
        :key="sample.mode"
        class="flex min-h-8 min-w-0 items-center justify-center"
      >
        <InitialMartyriaSample
          :martyria-style="martyriaStyle"
          :paragraph-styles="paragraphStyles"
          :template-id="sample.templateId"
          :page-setup="pageSetup"
          :max-font-size="18"
        />
      </span>
      <!-- Under the previews, so it never moves them. -->
      <span
        v-if="caption != null || inUse"
        class="col-span-full mt-1 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground"
      >
        <span v-if="caption != null">{{ caption }}</span>
        <Badge v-if="inUse" variant="secondary" class="text-[11px] font-normal">
          {{ $t(($) => $.dialog.initialMartyriaStyles.inUse, { ns }) }}
        </Badge>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import { Badge } from '@/components/ui/badge';
import type {
  InitialMartyriaLettering,
  InitialMartyriaStructure,
  InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';

import {
  type getSample,
  withInitialMartyriaStyleStructure,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

/** One wording in the wording picker, previewed in each sample mode. */
const props = defineProps<{
  /** The style whose typography the previews take. */
  base: InitialMartyriaStyle;
  structure: InitialMartyriaStructure;
  lettering: InitialMartyriaLettering;
  samples: ReturnType<typeof getSample>[];
  paragraphStyles: ParagraphStyle[];
  pageSetup: PageSetup;
  /** The captions of the common wordings written this way, if any. */
  caption: string | null;
  /** Whether this is the wording of the style being changed. */
  selected: boolean;
  /** Whether another style of the document already reads this way. */
  inUse: boolean;
}>();

const emit = defineEmits<{ select: [] }>();

const martyriaStyle = computed(() =>
  withInitialMartyriaStyleStructure(
    props.base,
    props.structure,
    props.lettering,
  ),
);
</script>
