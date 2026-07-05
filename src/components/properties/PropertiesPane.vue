<template>
  <div class="flex size-full min-h-0 flex-col overflow-hidden p-3">
    <template v-if="context.kind === 'none'">
      <Empty class="min-h-40 border bg-muted/20">
        <EmptyHeader>
          <EmptyTitle>{{
            $t(($) => $.toolbar.properties.noProperties, { ns: 'toolbar' })
          }}</EmptyTitle>
          <EmptyDescription>{{
            $t(($) => $.toolbar.properties.nothingToEdit, { ns: 'toolbar' })
          }}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </template>

    <PropertiesTempo
      v-else-if="tempoElement != null"
      :key="`tempo-${tempoElement.id}`"
      :element="tempoElement"
      :open-sections="openSections"
      :page-setup="pageSetup"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:tempo', tempoElement, $event)"
    />

    <PropertiesAnnotation
      v-else-if="annotationElement != null"
      :key="`annotation-${annotationElement.id}`"
      :element="annotationElement"
      :fonts="fonts"
      :open-sections="openSections"
      :page-setup="pageSetup"
      :paragraph-styles="paragraphStyles"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:annotation', annotationElement, $event)"
      @open-paragraph-styles-dialog="
        emit('open-paragraph-styles-dialog', $event)
      "
    />

    <PropertiesTextBox
      v-else-if="textBoxElement != null"
      :key="`text-box-${textBoxElement.id}`"
      :element="textBoxElement"
      :fonts="fonts"
      :open-sections="openSections"
      :page-setup="pageSetup"
      :paragraph-styles="paragraphStyles"
      :source="textBoxSource"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:text-box', textBoxElement, $event)"
      @open-paragraph-styles-dialog="
        emit('open-paragraph-styles-dialog', $event)
      "
    />

    <PropertiesRichTextBox
      v-else-if="richTextBoxElement != null"
      :key="`rich-text-box-${richTextBoxElement.id}`"
      :element="richTextBoxElement"
      :fonts="fonts"
      :open-sections="openSections"
      :page-setup="pageSetup"
      :paragraph-styles="paragraphStyles"
      :source="richTextBoxSource"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:rich-text-box', richTextBoxElement, $event)"
      @open-paragraph-styles-dialog="
        emit('open-paragraph-styles-dialog', $event)
      "
    />

    <PropertiesDropCap
      v-else-if="dropCapElement != null"
      :key="`drop-cap-${dropCapElement.id}`"
      :element="dropCapElement"
      :fonts="fonts"
      :open-sections="openSections"
      :page-setup="pageSetup"
      :paragraph-styles="paragraphStyles"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:drop-cap', dropCapElement, $event)"
      @open-paragraph-styles-dialog="
        emit('open-paragraph-styles-dialog', $event)
      "
    />

    <PropertiesImageBox
      v-else-if="imageBoxElement != null"
      :key="`image-box-${imageBoxElement.id}`"
      :element="imageBoxElement"
      :open-sections="openSections"
      :page-setup="pageSetup"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:image-box', imageBoxElement, $event)"
    />

    <PropertiesLyrics
      v-else-if="lyricsElement != null"
      :key="`lyrics-${lyricsElement.id}`"
      :element="lyricsElement"
      :fonts="fonts"
      :paragraph-styles="paragraphStyles"
      :open-sections="openSections"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:lyrics', lyricsElement, $event)"
      @open-paragraph-styles-dialog="
        emit('open-paragraph-styles-dialog', $event)
      "
    />

    <PropertiesModeKey
      v-else-if="modeKeyElement != null"
      :key="`mode-key-${modeKeyElement.id}`"
      :element="modeKeyElement"
      :open-sections="openSections"
      :page-setup="pageSetup"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:mode-key', modeKeyElement, $event)"
    />

    <PropertiesNeume
      v-else-if="neumeElement != null"
      :key="`neume-${neumeElement.id}`"
      :element="neumeElement"
      :inner-neume="innerNeume"
      :open-sections="openSections"
      :page-setup="pageSetup"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:neume', neumeElement, $event)"
    />

    <PropertiesMartyria
      v-else-if="martyriaElement != null"
      :key="`martyria-${martyriaElement.id}`"
      :element="martyriaElement"
      :open-sections="openSections"
      :page-setup="pageSetup"
      @update:open-sections="emit('update:open-sections', $event)"
      @update="emit('update:martyria', martyriaElement, $event)"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed } from 'vue';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';

import type { InspectorContext } from './InspectorContext';
import PropertiesAnnotation from './PropertiesAnnotation.vue';
import PropertiesDropCap from './PropertiesDropCap.vue';
import PropertiesImageBox from './PropertiesImageBox.vue';
import PropertiesLyrics from './PropertiesLyrics.vue';
import PropertiesMartyria from './PropertiesMartyria.vue';
import PropertiesModeKey from './PropertiesModeKey.vue';
import PropertiesNeume from './PropertiesNeume.vue';
import PropertiesRichTextBox from './PropertiesRichTextBox.vue';
import PropertiesTempo from './PropertiesTempo.vue';
import PropertiesTextBox from './PropertiesTextBox.vue';

const props = defineProps({
  context: {
    type: Object as PropType<InspectorContext>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
  innerNeume: {
    type: String,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  paragraphStyles: {
    type: Array as PropType<ParagraphStyle[]>,
    required: true,
  },
  openSections: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const emit = defineEmits([
  'open-paragraph-styles-dialog',
  'update:open-sections',
  'update:annotation',
  'update:drop-cap',
  'update:image-box',
  'update:lyrics',
  'update:martyria',
  'update:mode-key',
  'update:neume',
  'update:rich-text-box',
  'update:tempo',
  'update:text-box',
]);

const textBoxElement = computed(() =>
  props.context.kind === 'text-box' ? props.context.element : null,
);
const textBoxSource = computed(() =>
  props.context.kind === 'text-box' ? props.context.source : 'score',
);
const annotationElement = computed(() =>
  props.context.kind === 'annotation' ? props.context.element : null,
);
const richTextBoxElement = computed(() =>
  props.context.kind === 'rich-text-box' ? props.context.element : null,
);
const richTextBoxSource = computed(() =>
  props.context.kind === 'rich-text-box' ? props.context.source : 'score',
);
const dropCapElement = computed(() =>
  props.context.kind === 'drop-cap' ? props.context.element : null,
);
const imageBoxElement = computed(() =>
  props.context.kind === 'image-box' ? props.context.element : null,
);
const lyricsElement = computed(() =>
  props.context.kind === 'lyrics' ? props.context.element : null,
);
const modeKeyElement = computed(() =>
  props.context.kind === 'mode-key' ? props.context.element : null,
);
const neumeElement = computed(() =>
  props.context.kind === 'neume' ? props.context.element : null,
);
const martyriaElement = computed(() =>
  props.context.kind === 'martyria' ? props.context.element : null,
);
const tempoElement = computed(() =>
  props.context.kind === 'tempo' ? props.context.element : null,
);
</script>
