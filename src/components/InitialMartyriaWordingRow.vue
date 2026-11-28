<template>
  <div
    class="relative border-b"
    :class="
      selected && 'bg-accent/50 outline-2 -outline-offset-2 outline-foreground'
    "
  >
    <button
      type="button"
      class="grid w-full items-start gap-x-3 px-3 py-2 text-left transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
      :style="{
        gridTemplateColumns: `repeat(${samples.length}, minmax(0, 1fr))`,
      }"
      :aria-pressed="selected"
      :aria-label="accessibleName"
      :aria-describedby="readingsId"
      @click="emit('select')"
    >
      <span
        v-for="(sample, index) in samples"
        :key="sample.mode"
        class="flex min-w-0 flex-col items-center gap-0.5"
      >
        <span class="flex min-h-8 w-full items-center justify-center">
          <InitialMartyriaSample
            :martyria-style="martyriaStyle"
            :paragraph-styles="paragraphStyles"
            :template-id="sample.templateId"
            :page-setup="pageSetup"
            :max-font-size="18"
          />
        </span>
        <span
          class="w-full truncate text-center text-[11px] text-muted-foreground"
          :lang="structure.languageId"
          :dir="readingDirection"
          :style="languageTextStyle"
          :title="readings[index]"
          aria-hidden="true"
          >{{ readings[index] }}</span
        >
      </span>
      <!-- Under the previews, so it never moves them. -->
      <span
        class="col-span-full mt-1 flex items-center justify-center gap-2 text-center text-[11px] text-muted-foreground"
        aria-hidden="true"
      >
        <span :style="captionQuotesLanguage ? languageTextStyle : undefined">{{
          caption
        }}</span>
        <Badge
          v-if="methodLabel != null"
          variant="outline"
          class="text-[11px] font-normal"
        >
          {{ methodLabel }}
        </Badge>
        <Badge v-if="inUse" variant="secondary" class="text-[11px] font-normal">
          {{ inUseLabel }}
        </Badge>
      </span>
    </button>
    <!--
      The readings, outside the button so that they keep their language: a
      button's name and contents reach screen readers as plain text in the
      interface language, which cannot switch to the reading's voice.
    -->
    <span
      :id="readingsId"
      class="sr-only"
      :lang="structure.languageId"
      :dir="readingDirection"
      :style="languageTextStyle"
      >{{ readings.join('. ') }}.</span
    >
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, useId } from 'vue';

import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import { Badge } from '@/components/ui/badge';
import { getInitialMartyriaLexicon } from '@/models/InitialMartyriaLexicon';
import { getInitialMartyriaPronunciation } from '@/models/InitialMartyriaResolver';
import type {
  InitialMartyriaLettering,
  InitialMartyriaStructure,
  InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { getInitialMartyriaLanguageTextStyle } from '@/utils/initialMartyriaLabels';

import {
  type getSample,
  withInitialMartyriaStyleStructure,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

/**
 * One wording in the wording picker, previewed in each sample mode with the
 * reading of each preview under it.
 */
const props = defineProps<{
  /** The style whose typography the previews take. */
  base: InitialMartyriaStyle;
  structure: InitialMartyriaStructure;
  lettering: InitialMartyriaLettering;
  samples: ReturnType<typeof getSample>[];
  paragraphStyles: ParagraphStyle[];
  pageSetup: PageSetup;
  /** What sets this wording apart from its neighbours. */
  caption: string;
  /** Whether the caption quotes the language's own words, such as a numeral. */
  captionQuotesLanguage: boolean;
  /** How the wording shows the mode, where its group heading does not say. */
  methodLabel: string | null;
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

const readings = computed(() =>
  props.samples.map((sample) =>
    getInitialMartyriaPronunciation(props.structure, sample.readingContext),
  ),
);

const languageTextStyle = computed(() =>
  getInitialMartyriaLanguageTextStyle(props.structure.languageId),
);
const readingDirection = computed(
  () => getInitialMartyriaLexicon(props.structure).direction,
);

const { t } = useTranslation();

const readingsId = useId();

const inUseLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.inUse, { ns }),
);

/*
 * A short name in the interface language; the readings, in the wording's
 * own language, describe it.
 */
const accessibleName = computed(() =>
  [props.methodLabel, props.caption, props.inUse ? inUseLabel.value : null]
    .filter((part) => part != null)
    .join('. '),
);
</script>
