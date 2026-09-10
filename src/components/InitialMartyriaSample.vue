<template>
  <span
    ref="frame"
    class="initial-martyria-sample flex w-full justify-center"
    :style="{ '--zoom': zoom }"
    aria-hidden="true"
  >
    <ModeKey
      v-if="sample.resolvedStyle == null"
      class="initial-martyria-sample-key !w-auto"
      :element="sample.element"
      :page-setup="pageSetup"
    />
    <CustomModeKey
      v-else
      class="initial-martyria-sample-key !w-auto"
      :element="sample.element"
      :resolved-style="sample.resolvedStyle"
      :page-setup="pageSetup"
    />
  </span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import CustomModeKey from '@/components/CustomModeKey.vue';
import ModeKey from '@/components/ModeKey.vue';
import { useResizeObserver } from '@/composables/useResizeObserver';
import { ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import {
  type InitialMartyriaStyle,
  resolveInitialMartyriaStyleAppearances,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { PageSetup } from '@/models/PageSetup';
import { LayoutService } from '@/services/LayoutService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { getLegacyNeumeFontFamily } from '@/utils/getFontFamilyWithFallback';

/**
 * One initial martyria rendered for a mode key template, exactly as the
 * score would draw it, scaled down when it would not fit its frame. A null
 * style draws the Standard glyph-based key.
 */
const props = withDefaults(
  defineProps<{
    style: InitialMartyriaStyle | null;
    templateId: number;
    pageSetup: PageSetup;
    /** Text taller than this (in pixels) is scaled down. */
    maxFontSize?: number | null;
  }>(),
  { maxFontSize: null },
);

const frame = ref<HTMLElement | null>(null);
const frameWidth = ref<number | null>(null);
const { observe } = useResizeObserver();

onMounted(() => {
  if (frame.value != null) {
    observe(frame.value, ([entry]) => {
      frameWidth.value = entry.contentRect.width;
    });
  }
});

const sample = computed(() => {
  const template = modeKeyTemplates.find(
    (item) => item.id === props.templateId,
  )!;
  const element = ModeKeyElement.createFromTemplate(
    template,
    props.pageSetup.useOptionalDiatonicFthoras,
    TextBoxAlignment.Left,
  );

  if (props.style == null) {
    const fontFamily = getLegacyNeumeFontFamily(
      props.pageSetup.neumeDefaultFontFamily,
    );
    element.initialMartyriaStyleId = null;
    element.computedFontFamily = fontFamily;
    element.computedFontSize = props.pageSetup.modeKeyDefaultFontSize;
    element.computedColor = props.pageSetup.modeKeyDefaultColor;
    element.computedStrokeWidth = props.pageSetup.modeKeyDefaultStrokeWidth;
    const font = `${element.computedFontSize}px ${fontFamily}`;
    element.height = TextMeasurementService.getFontHeight(font);
    return {
      element,
      resolvedStyle: null,
      fontSize: element.computedFontSize,
      width: LayoutService.getStandardInitialMartyriaWidth(element),
    };
  }

  const resolvedStyle = resolveInitialMartyriaStyleAppearances(props.style);
  element.initialMartyriaStyleId = props.style.id;
  element.computedFontFamily = props.pageSetup.neumeDefaultFontFamily;
  element.computedFontSize = resolvedStyle.mainAppearance.fontSize!;
  element.computedColor = resolvedStyle.mainAppearance.color!;
  element.computedStrokeWidth = resolvedStyle.mainAppearance.strokeWidth!;
  const geometry = LayoutService.getInitialMartyriaGeometry(
    element,
    props.pageSetup,
    resolvedStyle,
  );
  element.computedTop = geometry.top;
  element.computedBottom = geometry.bottom;
  element.computedFlowTop = geometry.flowTop;
  element.height = geometry.bottom - geometry.top;
  return {
    element,
    resolvedStyle,
    fontSize: element.computedFontSize,
    width: geometry.width,
  };
});

const zoom = computed(() => {
  const limits = [1];
  if (props.maxFontSize != null) {
    limits.push(props.maxFontSize / sample.value.fontSize);
  }
  if (frameWidth.value != null && sample.value.width > 0) {
    limits.push(frameWidth.value / sample.value.width);
  }
  return Math.min(...limits);
});
</script>

<style scoped>
:deep(.initial-martyria-sample-key.mode-key-container) {
  border: 0;
  outline: 0;
}
</style>
