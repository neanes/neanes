<template>
  <div
    class="mode-key-container"
    :style="style"
    @click="$emit('select-single')"
  >
    <span class="mode-key-main" :style="mainStyle">
      <span class="mode-key-signature" :dir="signatureResolution.flowDirection">
        <template v-for="run in resolvedRuns" :key="run.componentId">
          <span
            v-if="run.kind === 'notation' || run.kind === 'pitchCluster'"
            class="mode-key-run"
            :style="getRunStyle(run)"
          >
            <Neume
              v-for="neume in run.notation ?? []"
              :key="neume"
              :neume="neume"
            />
          </span>
          <span
            v-else-if="run.kind === 'text'"
            class="mode-key-run"
            :lang="run.languageTag"
            :dir="run.direction"
            :style="getRunStyle(run)"
            >{{ run.text }}</span
          >
          <span
            v-else
            class="mode-key-run mode-key-stacked-text"
            :style="getRunStyle(run)"
          >
            <span>{{ run.upper }}</span>
            <span>{{ run.lower }}</span>
          </span>
        </template>
      </span>
      <Neume
        v-if="element.tempo != null && !element.tempoAlignRight"
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
    <span ref="rightContainer" class="right-container">
      <span v-if="element.showAmbitus" class="ambitus">
        <span class="ambitus-text">(</span>
        <span class="ambitus-low" :style="ambitusStyleLow">
          <Neume :neume="element.ambitusLowNote" />
          <Neume :neume="element.ambitusLowRootSign" />
        </span>
        <span class="ambitus-text">-</span>
        <span class="ambitus-high" :style="ambitusStyleHigh">
          <Neume :neume="element.ambitusHighNote" />
          <Neume :neume="element.ambitusHighRootSign" />
        </span>
        <span class="ambitus-text">)</span>
      </span>

      <Neume
        v-if="element.tempo != null && element.tempoAlignRight"
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties, PropType, StyleValue } from 'vue';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { type ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import {
  getInitialMartyriaContext,
  type InitialMartyriaStyle,
  type ModeTerminology,
  type ResolvedInitialMartyriaRun,
  resolveInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { resolveFontStyle } from '@/utils/fontStyle';
import { withZoom } from '@/utils/withZoom';

defineEmits(['select-single']);
const props = defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  initialMartyriaStyles: {
    type: Array as PropType<InitialMartyriaStyle[]>,
    default: () => [],
  },
  modeTerminologies: {
    type: Array as PropType<ModeTerminology[]>,
    default: () => [],
  },
});

const signatureResolution = computed(() =>
  resolveInitialMartyriaStyle({
    context: getInitialMartyriaContext(props.element),
    activeStyleId: props.pageSetup.initialMartyriaStyleId,
    styles: props.initialMartyriaStyles,
    terminologies: props.modeTerminologies,
    pageSetup: props.pageSetup,
    element: props.element,
  }),
);
const resolvedRuns = computed(() => signatureResolution.value.runs);
const rightContainer = ref<HTMLElement | null>(null);
const rightAccessoryWidth = ref(0);
let rightAccessoryResizeObserver: ResizeObserver | null = null;

const mainStyle = computed(
  () =>
    ({
      clipPath:
        props.element.alignment === TextBoxAlignment.Right
          ? undefined
          : `inset(0 ${rightAccessoryWidth.value}px 0 0)`,
    }) as CSSProperties,
);

onMounted(() => {
  if (rightContainer.value == null) {
    return;
  }

  const updateRightAccessoryWidth = () => {
    rightAccessoryWidth.value = rightContainer.value?.offsetWidth ?? 0;
  };

  rightAccessoryResizeObserver = new ResizeObserver(updateRightAccessoryWidth);
  rightAccessoryResizeObserver.observe(rightContainer.value);
  updateRightAccessoryWidth();
});

onBeforeUnmount(() => {
  rightAccessoryResizeObserver?.disconnect();
});

const style = computed(() => {
  return {
    color: props.element.computedColor,
    fontFamily: props.element.computedFontFamily,
    fontSize: withZoom(props.element.computedFontSize),
    textAlign: props.element.alignment,
    width: withZoom(props.element.width),
    height: withZoom(props.element.height),
    webkitTextStrokeWidth: withZoom(props.element.computedStrokeWidth),
  } as StyleValue;
});

const tempoStyle = computed(() => {
  // TODO figure out a way to remove the hard-coded -.45em
  // maybe put it in the font metadata json?
  const style = {
    color: props.pageSetup.tempoDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.tempoDefaultStrokeWidth),
    top: '-0.45em',
    marginLeft: withZoom(8),
  } as StyleValue;

  return style;
});

const ambitusStyle = computed(() => {
  // TODO figure out a way to remove the hard-coded -.45em
  // maybe put it in the font metadata json?
  const style = {
    color: props.pageSetup.martyriaDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.martyriaDefaultStrokeWidth),
    position: 'relative',
    top: '-0.45em',
  } as CSSProperties;

  return style;
});

const ambitusStyleLow = computed(() => {
  const text = [props.element.ambitusLowNote, props.element.ambitusLowRootSign]
    .map((neume) => NeumeMappingService.getMapping(neume).text)
    .join('');
  const font = `${props.element.computedFontSize}px ${props.element.computedFontFamily}`;

  const bounds = TextMeasurementService.getInkBounds(text, font);

  const style = {
    ...ambitusStyle.value,
    marginLeft: withZoom(4 - bounds.inkLeft),
    marginRight: withZoom(10),
  } as CSSProperties;

  return style;
});

const ambitusStyleHigh = computed(() => {
  const text = [
    props.element.ambitusHighNote,
    props.element.ambitusHighRootSign,
  ]
    .map((neume) => NeumeMappingService.getMapping(neume).text)
    .join('');
  const font = `${props.element.computedFontSize}px ${props.element.computedFontFamily}`;

  const bounds = TextMeasurementService.getInkBounds(text, font);

  const style = {
    ...ambitusStyle.value,
    marginLeft: withZoom(10),
    marginRight: withZoom(4 - (bounds.advanceWidth - bounds.inkRight)),
  } as CSSProperties;

  return style;
});

function getRunStyle(run: ResolvedInitialMartyriaRun) {
  const appearance = run.appearance;
  const font = resolveFontStyle(
    appearance.fontFamily ?? props.element.computedFontFamily,
    appearance.fontStyle,
  );

  return {
    color: appearance.color,
    fontFamily: font.cssFontFamily,
    fontSize:
      appearance.fontSize == null ? undefined : withZoom(appearance.fontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth:
      appearance.strokeWidth == null
        ? undefined
        : withZoom(appearance.strokeWidth),
    top:
      appearance.baselineShift == null
        ? undefined
        : withZoom(appearance.baselineShift),
    insetInlineStart:
      appearance.offsetInline == null
        ? undefined
        : withZoom(appearance.offsetInline),
    marginInlineStart:
      appearance.spacingBefore == null
        ? undefined
        : withZoom(appearance.spacingBefore),
    marginInlineEnd:
      appearance.spacingAfter == null
        ? undefined
        : withZoom(appearance.spacingAfter),
    rowGap: run.kind === 'stackedText' ? withZoom(run.gap ?? 0) : undefined,
    direction: run.direction,
    unicodeBidi: 'isolate',
  } as CSSProperties;
}
</script>

<style scoped>
.mode-key-container {
  border: 1px dotted black;
  box-sizing: border-box;
  line-height: normal;
  user-select: none;

  position: relative;
}

.right-container {
  position: absolute;
  top: 0;
  right: 0;
  white-space: nowrap;
}

.mode-key-main {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-key-run {
  position: relative;
}

.mode-key-signature {
  unicode-bidi: isolate;
}

.mode-key-stacked-text {
  display: inline-flex;
  flex-direction: column;
  line-height: 1;
  vertical-align: middle;
}

.ambitus {
  position: relative;
  top: calc(-4px * var(--zoom));
}

.ambitus-text {
  font-family: Arial, Helvetica, sans-serif;
}
</style>
