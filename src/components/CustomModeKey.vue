<template>
  <div
    class="mode-key-container"
    :style="style"
    @click="$emit('select-single')"
  >
    <span class="mode-key-main" :style="mainStyle">
      <span class="mode-key-signature" :dir="signatureResolution.flowDirection">
        <span
          class="sr-only"
          :lang="signatureResolution.style.languageId"
          :dir="signatureResolution.flowDirection"
          >{{ signatureResolution.pronunciation }}</span
        >
        <template v-for="(run, index) in resolvedRuns" :key="index">
          <span
            v-if="separatorsBefore[index] !== 'none'"
            class="mode-key-separator"
            :style="getSeparatorStyle(run, index)"
            aria-hidden="true"
            >{{ separatorsBefore[index] === 'wordSpace' ? ' ' : '' }}</span
          >
          <span
            v-if="run.kind === 'glyph'"
            class="mode-key-run"
            :style="getRunStyle(run)"
            aria-hidden="true"
          >
            <template v-for="neume in run.glyphs" :key="neume">
              <Neume :neume="neume" aria-hidden="true" />
            </template>
          </span>
          <span
            v-else-if="run.kind === 'text' && run.content.layout === 'inline'"
            class="mode-key-run"
            :lang="run.languageTag"
            :dir="run.direction"
            :style="getRunStyle(run)"
            aria-hidden="true"
            >{{ run.content.text }}</span
          >
          <span
            v-else-if="run.kind === 'startingPitch'"
            class="mode-key-run starting-pitch"
            :style="getRunStyle(run)"
            ><template
              v-for="[role, pitchNote] in [
                ['primary', run.cluster.primary],
                ['secondary', run.cluster.secondary],
              ] as const"
              :key="role"
            >
              <span
                v-if="pitchNote != null"
                class="starting-pitch-note"
                :style="getPitchCellStyle(pitchNote)"
              >
                <span
                  :dir="run.noteText.direction"
                  :style="getPitchTextStyle(run, pitchNote)"
                  >{{ run.noteText.names[pitchNote.note] }}</span
                >
                <span
                  v-if="pitchNote.fthoraAbove != null"
                  class="pitch-mark"
                  :style="getPitchMarkStyle(pitchNote, 'fthora')"
                >
                  <Neume
                    :neume="pitchNote.fthoraAbove"
                    :style="getPitchGlyphStyle(run)"
                  />
                </span>
                <span
                  v-if="pitchNote.quantitativeNeumeAbove != null"
                  class="pitch-mark"
                  :style="getPitchMarkStyle(pitchNote, 'quantitative')"
                >
                  <Neume
                    :neume="pitchNote.quantitativeNeumeAbove"
                    :style="getPitchGlyphStyle(run)"
                  />
                </span>
              </span>
              <span
                v-if="
                  role === 'primary' &&
                  run.cluster.primary != null &&
                  run.cluster.secondary != null
                "
                class="pitch-cluster-separator"
                :style="getPitchClusterSeparatorStyle(run)"
                aria-hidden="true"
              />
            </template>
            <span
              v-if="
                hasPitchNote(run.cluster) &&
                run.cluster.trailingGlyphs.length > 0
              "
              class="pitch-trailing-glue"
              :style="getPitchTrailingGlueStyle(run)"
              aria-hidden="true"
            />
            <Neume
              v-for="neume in run.cluster.trailingGlyphs"
              :key="neume"
              :neume="neume"
              :style="getTrailingPitchGlyphStyle(run)"
            />
          </span>
          <template
            v-else-if="run.kind === 'text' && run.content.layout === 'stacked'"
          >
            <span
              class="mode-key-run mode-key-stacked-text"
              :style="getStackedTextStyle(run)"
              aria-hidden="true"
            >
              <span
                v-for="(line, lineIndex) in run.content.lines"
                :key="lineIndex"
                :style="getStackedTextRowStyle(run, lineIndex)"
                aria-hidden="true"
                >{{ line }}</span
              >
            </span>
          </template>
        </template>
        <span
          v-if="trailingSeparator !== 'none'"
          class="mode-key-separator"
          :style="
            getTrailingSeparatorStyle(resolvedRuns[resolvedRuns.length - 1])
          "
          aria-hidden="true"
        />
      </span>
      <Neume
        v-if="
          element.tempo != null && (!element.tempoAlignRight || element.inline)
        "
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
    <span
      ref="rightContainer"
      class="right-container"
      :style="rightContainerStyle"
    >
      <span
        class="mode-key-baseline-strut"
        :style="baselineStrutStyle"
        aria-hidden="true"
      />
      <span
        v-if="element.showAmbitus && !element.inline"
        class="ambitus"
        :style="ambitusContainerStyle"
      >
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
        v-if="
          element.tempo != null && element.tempoAlignRight && !element.inline
        "
        :neume="element.tempo"
        :style="tempoStyle"
      />
    </span>
  </div>
</template>

<script setup lang="ts">
import type { CSSProperties, PropType, StyleValue } from 'vue';
import { computed, onMounted, ref } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import { useResizeObserver } from '@/composables/useResizeObserver';
import { type ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import type { InitialMartyriaPitchGeometry } from '@/models/InitialMartyriaPitchGeometry';
import type { InitialMartyriaStackedTextGeometry } from '@/models/InitialMartyriaStackedTextGeometry';
import {
  getInitialMartyriaContext,
  getInitialMartyriaFixedSeparatorSize,
  getInitialMartyriaSeparatorAfter,
  getInitialMartyriaSeparatorBefore,
  type InitialMartyriaPitchNote,
  type InitialMartyriaSeparator,
  type InitialMartyriaStartingNoteRun,
  type ResolvedInitialMartyriaConfiguration,
  type ResolvedInitialMartyriaRun,
  resolveInitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import { fontService } from '@/services/FontService';
import {
  getInitialMartyriaNeumeBaselineCorrection,
  getInitialMartyriaPitchTrailingGlueWidth,
  getMatchedNeumeFontSize,
  measureInitialMartyriaPitchGeometry,
  resolveInitialMartyriaAccessoryLayout,
  resolveInitialMartyriaPitchFontSizes,
} from '@/services/InitialMartyriaPitchMeasurementService';
import { measureInitialMartyriaStackedText } from '@/services/InitialMartyriaStackedTextMeasurementService';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { DEFAULT_FONT_STYLE } from '@/utils/fontConstants';
import { resolveFontCss, resolveFontStyle } from '@/utils/fontStyle';
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
  initialMartyriaConfiguration: {
    type: Object as PropType<ResolvedInitialMartyriaConfiguration>,
    required: true,
  },
});

const signatureResolution = computed(() =>
  resolveInitialMartyriaStyle({
    context: getInitialMartyriaContext(props.element),
    resolvedConfiguration: props.initialMartyriaConfiguration,
    pageSetup: props.pageSetup,
  }),
);
const resolvedRuns = computed(() => signatureResolution.value.runs);
const separatorsBefore = computed(() =>
  resolvedRuns.value.map((_, index) =>
    getInitialMartyriaSeparatorBefore(resolvedRuns.value, index),
  ),
);
const trailingSeparator = computed(() =>
  getInitialMartyriaSeparatorAfter(
    resolvedRuns.value,
    resolvedRuns.value.length - 1,
  ),
);
const neumeFontFamily = computed(
  () =>
    props.element.computedFontFamily || props.pageSetup.neumeDefaultFontFamily,
);
const neumeFontSize = computed(
  () =>
    props.element.computedFontSize || props.pageSetup.modeKeyDefaultFontSize,
);
const baseTextAppearance = computed(
  () => props.initialMartyriaConfiguration.mainAppearance,
);
const fixedSeparatorFontSize = computed(
  () => baseTextAppearance.value.fontSize ?? neumeFontSize.value,
);
const hasCustomText = computed(() =>
  resolvedRuns.value.some(
    (run) => run.kind === 'text' || run.kind === 'startingPitch',
  ),
);
const matchedNeumeFontSize = computed(() => {
  if (!hasCustomText.value) {
    return null;
  }
  const textAppearance = baseTextAppearance.value;
  const textFontSize = textAppearance.fontSize ?? neumeFontSize.value;
  return getMatchedNeumeFontSize({
    textFontFamily: textAppearance.fontFamily ?? neumeFontFamily.value,
    textFontStyle: textAppearance.fontStyle,
    textFontSize,
    textFontVariantCaps: textAppearance.fontVariantCaps,
    neumeFontFamily: neumeFontFamily.value,
    neumeFontSize: neumeFontSize.value,
  });
});
const neumeBaselineCorrection = computed(() =>
  getInitialMartyriaNeumeBaselineCorrection({
    hasCustomText: hasCustomText.value,
    initialMartyriaBaseline:
      fontService.getMetrics(neumeFontFamily.value).initialMartyriaBaseline ??
      0,
    matchedNeumeFontSize: matchedNeumeFontSize.value,
    neumeFontSize: neumeFontSize.value,
  }),
);
const accessoryLayout = computed(() =>
  resolveInitialMartyriaAccessoryLayout({
    matchedNeumeFontSize: matchedNeumeFontSize.value,
    neumeBaselineCorrection: neumeBaselineCorrection.value,
    neumeFontSize: neumeFontSize.value,
  }),
);
const rightContainer = ref<HTMLElement | null>(null);
const rightAccessoryWidth = ref(0);
const { observe: observeRightAccessory } = useResizeObserver();
// Keep the CSS line box anchored by the explicit baseline strut rather than
// by zoom-dependent font metrics from any visible signature run.
const baselineFlowGuard = computed(() => props.element.height);

const mainStyle = computed(() => {
  const verticalClipMargin = withZoom(-props.element.height);
  return {
    position: 'relative',
    top: withZoom(props.element.computedFlowTop - props.element.computedTop),
    clipPath:
      props.element.alignment === TextBoxAlignment.Right
        ? undefined
        : `inset(${verticalClipMargin} ${rightAccessoryWidth.value}px ${verticalClipMargin} 0)`,
  } as CSSProperties;
});

const rightContainerStyle = computed(() => ({
  top: withZoom(
    props.element.computedFlowTop -
      props.element.computedTop -
      baselineFlowGuard.value,
  ),
}));

const baselineStrutStyle = computed(() => ({
  height: withZoom(
    Math.max(0, -props.element.computedFlowTop) + baselineFlowGuard.value,
  ),
}));

onMounted(() => {
  if (rightContainer.value == null) {
    return;
  }

  const updateRightAccessoryWidth = () => {
    rightAccessoryWidth.value = rightContainer.value?.offsetWidth ?? 0;
  };

  observeRightAccessory(rightContainer.value, updateRightAccessoryWidth);
  updateRightAccessoryWidth();
});

const style = computed(() => {
  return {
    color: props.element.computedColor,
    fontFamily:
      props.element.computedFontFamily ||
      props.pageSetup.neumeDefaultFontFamily,
    fontSize: withZoom(
      props.element.computedFontSize || props.pageSetup.modeKeyDefaultFontSize,
    ),
    textAlign: props.element.alignment,
    width: withZoom(props.element.width),
    height: withZoom(props.element.height),
    webkitTextStrokeWidth: withZoom(props.element.computedStrokeWidth),
  } as StyleValue;
});

const tempoStyle = computed(() => {
  const style = {
    color: props.pageSetup.tempoDefaultColor,
    fontSize: withZoom(accessoryLayout.value.fontSize),
    lineHeight: 'normal',
    webkitTextStrokeWidth: withZoom(props.pageSetup.tempoDefaultStrokeWidth),
    top: withZoom(accessoryLayout.value.baselineOffset),
    marginLeft: withZoom(8),
  } as StyleValue;

  return style;
});

const ambitusStyle = computed(() => {
  const neumeFont = resolveFontStyle(neumeFontFamily.value, DEFAULT_FONT_STYLE);
  const style = {
    color: props.pageSetup.martyriaDefaultColor,
    fontFamily: neumeFont.cssFontFamily,
    fontSize: withZoom(accessoryLayout.value.fontSize),
    fontStyle: neumeFont.cssFontStyle,
    fontWeight: neumeFont.cssFontWeight,
    webkitTextStrokeWidth: withZoom(props.pageSetup.martyriaDefaultStrokeWidth),
    position: 'relative',
    top: withZoom(accessoryLayout.value.baselineOffset),
  } as CSSProperties;

  return style;
});

const ambitusContainerStyle = computed(() => {
  const appearance = baseTextAppearance.value;
  const font = resolveFontStyle(
    appearance.fontFamily ?? neumeFontFamily.value,
    appearance.fontStyle,
  );

  return {
    color: appearance.color,
    fontFamily: font.cssFontFamily,
    fontSize: withZoom(appearance.fontSize ?? neumeFontSize.value),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    fontVariantCaps: appearance.fontVariantCaps ?? 'normal',
    fontVariantNumeric: appearance.fontVariantNumeric ?? 'normal',
    fontVariantLigatures: appearance.fontVariantLigatures ?? 'normal',
    fontVariantAlternates: appearance.fontVariantAlternates ?? 'normal',
    lineHeight: 'normal',
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth:
      appearance.strokeWidth == null
        ? undefined
        : withZoom(appearance.strokeWidth),
  } as CSSProperties;
});

const ambitusStyleLow = computed(() => {
  const text = [props.element.ambitusLowNote, props.element.ambitusLowRootSign]
    .map((neume) => NeumeMappingService.getMapping(neume).text)
    .join('');
  const font = `${accessoryLayout.value.fontSize}px ${props.element.computedFontFamily}`;

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
  const font = `${accessoryLayout.value.fontSize}px ${props.element.computedFontFamily}`;

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
  const isGlyph = run.kind === 'glyph';
  const isText = run.kind === 'text';
  const font = resolveFontStyle(
    appearance.fontFamily || neumeFontFamily.value,
    appearance.fontStyle,
  );
  const renderedFontSize = getEffectiveRunFontSize(run);
  const baselineShift = isGlyph ? -neumeBaselineCorrection.value : 0;
  return {
    color: isGlyph ? undefined : appearance.color,
    fontFamily: font.cssFontFamily,
    fontSize: withZoom(renderedFontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    fontVariantCaps: isText
      ? (appearance.fontVariantCaps ?? 'normal')
      : undefined,
    fontVariantNumeric: isText
      ? (appearance.fontVariantNumeric ?? 'normal')
      : undefined,
    fontVariantLigatures: isText
      ? (appearance.fontVariantLigatures ?? 'normal')
      : undefined,
    fontVariantAlternates: isText
      ? (appearance.fontVariantAlternates ?? 'normal')
      : undefined,
    webkitTextStrokeColor: isGlyph ? undefined : appearance.strokeColor,
    webkitTextStrokeWidth:
      isGlyph || appearance.strokeWidth == null
        ? undefined
        : withZoom(appearance.strokeWidth),
    top:
      baselineShift === 0 ||
      (run.kind === 'text' && run.content.layout === 'stacked')
        ? undefined
        : withZoom(-baselineShift),
    direction: run.direction,
    unicodeBidi: 'isolate',
  } as CSSProperties;
}

function getSeparatorStyle(run: ResolvedInitialMartyriaRun, index: number) {
  const separator = separatorsBefore.value[index];
  if (separator === 'wordSpace') {
    const before = resolvedRuns.value[index - 1];
    const after = resolvedRuns.value[index];
    const textOwner =
      getWordSpaceTextMetrics(before) ?? getWordSpaceTextMetrics(after);
    const appearance = textOwner?.appearance ?? baseTextAppearance.value;
    const font = resolveFontStyle(
      appearance.fontFamily ?? neumeFontFamily.value,
      appearance.fontStyle,
    );
    return {
      fontFamily: font.cssFontFamily,
      fontStyle: font.cssFontStyle,
      fontWeight: font.cssFontWeight,
      fontSize: withZoom(
        textOwner?.fontSize ?? appearance.fontSize ?? neumeFontSize.value,
      ),
      direction: run.direction,
    } as CSSProperties;
  }
  return getFixedSeparatorStyle(run, separator);
}

function getWordSpaceTextMetrics(run: ResolvedInitialMartyriaRun | undefined) {
  if (run?.kind === 'startingPitch') {
    return {
      appearance: run.noteText.appearance,
      fontSize: getPitchFontSizes(run).textFontSize,
    };
  }
  if (run?.kind === 'text') {
    return {
      appearance: run.appearance,
      fontSize: getEffectiveTextFontSize(run),
    };
  }
  return null;
}

function getTrailingSeparatorStyle(run: ResolvedInitialMartyriaRun) {
  return getFixedSeparatorStyle(run, trailingSeparator.value);
}

function getFixedSeparatorStyle(
  run: ResolvedInitialMartyriaRun,
  separator: InitialMartyriaSeparator,
) {
  const width = getInitialMartyriaFixedSeparatorSize(
    separator,
    fixedSeparatorFontSize.value,
  );
  if (width == null) {
    return undefined;
  }
  return {
    display: 'inline-block',
    width: withZoom(width),
    direction: run.direction,
  } as CSSProperties;
}

function getEffectiveRunFontSize(run: ResolvedInitialMartyriaRun) {
  if (run.kind === 'startingPitch') {
    return getPitchFontSizes(run).glyphFontSize;
  }
  if (run.kind === 'text') {
    return getEffectiveTextFontSize(run);
  }
  return (
    run.appearance.fontSize ??
    (run.kind === 'glyph' ? matchedNeumeFontSize.value : undefined) ??
    neumeFontSize.value
  );
}

function getEffectiveTextFontSize(run: TextRun) {
  return run.appearance.fontSize ?? neumeFontSize.value;
}

const stackedTextGeometries = computed(() => {
  const geometries = new Map<
    TextRun,
    { geometry: InitialMartyriaStackedTextGeometry; lineHeight: number }
  >();
  for (const run of resolvedRuns.value) {
    if (run.kind !== 'text' || run.content.layout !== 'stacked') {
      continue;
    }
    const appearance = run.appearance;
    const fontFamily = appearance.fontFamily || neumeFontFamily.value;
    const fontSize = getEffectiveTextFontSize(run);
    geometries.set(run, {
      geometry: measureInitialMartyriaStackedText(run.content.lines, {
        fontFamily,
        fontStyle: appearance.fontStyle,
        fontSize,
        fontVariantCaps: appearance.fontVariantCaps,
        strokeWidth: appearance.strokeWidth,
      }),
      lineHeight: TextMeasurementService.getFontHeight(
        resolveFontCss({
          fontFamily,
          fontStyle: resolveFontStyle(fontFamily, appearance.fontStyle)
            .cssFontStyle,
          fontSize,
        }),
      ),
    });
  }
  return geometries;
});

function getStackedTextStyle(run: TextRun) {
  const { geometry } = stackedTextGeometries.value.get(run)!;
  const style = getRunStyle(run);
  const height = geometry.bottom - geometry.top;

  return {
    ...style,
    display: 'inline-block',
    height: withZoom(height),
    position: 'relative',
    verticalAlign: withZoom(-geometry.bottom),
    width: withZoom(geometry.width),
  } as CSSProperties;
}

function getStackedTextRowStyle(run: TextRun, index: number) {
  const { geometry, lineHeight } = stackedTextGeometries.value.get(run)!;
  const row = geometry.rows[index];

  return {
    display: 'block',
    left: withZoom(row.left),
    lineHeight: withZoom(lineHeight),
    position: 'absolute',
    top: withZoom(row.top),
    whiteSpace: 'nowrap',
  } as CSSProperties;
}

const startingNoteTextStyles = computed(() => {
  const styles = new Map<InitialMartyriaStartingNoteRun, CSSProperties>();
  for (const run of resolvedRuns.value) {
    if (run.kind === 'startingPitch') {
      styles.set(run, buildStartingNoteTextStyle(run));
    }
  }
  return styles;
});

function buildStartingNoteTextStyle(run: InitialMartyriaStartingNoteRun) {
  const appearance = run.noteText.appearance;
  const font = resolveFontStyle(
    appearance.fontFamily || neumeFontFamily.value,
    appearance.fontStyle,
  );
  const fontSizes = getPitchFontSizes(run);

  return {
    color: appearance.color,
    display: 'block',
    position: 'relative',
    fontFamily: font.cssFontFamily,
    fontSize: withZoom(fontSizes.textFontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    fontVariantCaps: appearance.fontVariantCaps ?? 'normal',
    fontVariantNumeric: appearance.fontVariantNumeric ?? 'normal',
    fontVariantLigatures: appearance.fontVariantLigatures ?? 'normal',
    fontVariantAlternates: appearance.fontVariantAlternates ?? 'normal',
    lineHeight: withZoom(
      TextMeasurementService.getFontHeight(
        resolveFontCss({
          fontFamily: appearance.fontFamily || neumeFontFamily.value,
          fontStyle: appearance.fontStyle ?? '',
          fontSize: fontSizes.textFontSize,
        }),
      ),
    ),
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth:
      appearance.strokeWidth == null
        ? undefined
        : withZoom(appearance.strokeWidth),
    whiteSpace: 'nowrap',
  } as CSSProperties;
}

type TextRun = Extract<ResolvedInitialMartyriaRun, { kind: 'text' }>;

function getPitchFontSizes(run: InitialMartyriaStartingNoteRun) {
  const appearance = run.noteText.appearance;
  return resolveInitialMartyriaPitchFontSizes({
    textFontFamily: appearance.fontFamily || neumeFontFamily.value,
    textFontStyle: appearance.fontStyle,
    textFontSize: appearance.fontSize,
    glyphFontSize: undefined,
    matchedNeumeFontSize: matchedNeumeFontSize.value,
    neumeFontFamily: neumeFontFamily.value,
    neumeFontSize: neumeFontSize.value,
  });
}

const pitchGeometries = computed(() => {
  const geometries = new Map<
    InitialMartyriaPitchNote,
    InitialMartyriaPitchGeometry
  >();
  for (const run of resolvedRuns.value) {
    if (run.kind !== 'startingPitch') {
      continue;
    }
    for (const pitchNote of [run.cluster.primary, run.cluster.secondary]) {
      if (pitchNote != null) {
        geometries.set(pitchNote, measurePitchGeometry(run, pitchNote));
      }
    }
  }
  return geometries;
});

function measurePitchGeometry(
  run: InitialMartyriaStartingNoteRun,
  pitchNote: InitialMartyriaPitchNote,
) {
  const textAppearance = run.noteText.appearance;
  const glyphAppearance = run.appearance;
  const fontSizes = getPitchFontSizes(run);
  return measureInitialMartyriaPitchGeometry(
    pitchNote,
    run.noteText.names[pitchNote.note],
    {
      textFontFamily: textAppearance.fontFamily || neumeFontFamily.value,
      textFontStyle: textAppearance.fontStyle,
      textFontSize: fontSizes.textFontSize,
      textFontVariantCaps: textAppearance.fontVariantCaps,
      glyphFontFamily: glyphAppearance.fontFamily || neumeFontFamily.value,
      glyphFontStyle: glyphAppearance.fontStyle,
      glyphFontSize: fontSizes.glyphFontSize,
      textStrokeWidth: textAppearance.strokeWidth,
      glyphStrokeWidth: glyphAppearance.strokeWidth,
    },
  );
}

function getPitchCellStyle(pitchNote: InitialMartyriaPitchNote) {
  const geometry = pitchGeometries.value.get(pitchNote)!;
  return {
    display: 'inline-block',
    height: withZoom(geometry.bottom - geometry.top),
    position: 'relative',
    verticalAlign: withZoom(-geometry.bottom),
    width: withZoom(geometry.width),
  } as CSSProperties;
}

function getPitchTextStyle(
  run: InitialMartyriaStartingNoteRun,
  pitchNote: InitialMartyriaPitchNote,
) {
  const geometry = pitchGeometries.value.get(pitchNote)!;
  return {
    ...startingNoteTextStyles.value.get(run)!,
    left: withZoom(geometry.text.left),
    position: 'absolute',
    top: withZoom(geometry.text.top),
  } as CSSProperties;
}

function getPitchMarkStyle(
  pitchNote: InitialMartyriaPitchNote,
  kind: 'fthora' | 'quantitative',
) {
  const placement = pitchGeometries.value.get(pitchNote)![kind]!;
  return {
    left: withZoom(placement.left),
    position: 'absolute',
    top: withZoom(placement.top),
  } as CSSProperties;
}

function getPitchGlyphStyle(run: InitialMartyriaStartingNoteRun) {
  const appearance = run.appearance;
  const font = resolveFontStyle(
    appearance.fontFamily || neumeFontFamily.value,
    appearance.fontStyle,
  );

  return {
    color: appearance.color,
    fontFamily: font.cssFontFamily,
    fontSize: withZoom(getPitchFontSizes(run).glyphFontSize),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    webkitTextStrokeColor: appearance.strokeColor,
    webkitTextStrokeWidth: withZoom(appearance.strokeWidth ?? 0),
  } as CSSProperties;
}

function getTrailingPitchGlyphStyle(run: InitialMartyriaStartingNoteRun) {
  return {
    ...getPitchGlyphStyle(run),
    position: 'relative',
    top: withZoom(neumeBaselineCorrection.value),
  } as CSSProperties;
}

function hasPitchNote(cluster: InitialMartyriaStartingNoteRun['cluster']) {
  return cluster.primary != null || cluster.secondary != null;
}

function getPitchTrailingGlueStyle(run: InitialMartyriaStartingNoteRun) {
  const glyphFontSize = getPitchFontSizes(run).glyphFontSize;
  return {
    display: 'inline-block',
    width: withZoom(
      getInitialMartyriaPitchTrailingGlueWidth(
        neumeFontFamily.value,
        glyphFontSize,
      ),
    ),
  } as CSSProperties;
}

function getPitchClusterSeparatorStyle(run: InitialMartyriaStartingNoteRun) {
  return getFixedSeparatorStyle(run, 'noteCluster');
}
</script>

<style scoped>
.mode-key-container {
  outline: 1px dotted black;
  box-sizing: border-box;
  line-height: normal;
  user-select: none;

  position: relative;
}

.right-container {
  line-height: 0;
  position: absolute;
  top: 0;
  right: 0;
  white-space: nowrap;
}

.mode-key-main {
  display: block;
  overflow-x: clip;
  overflow-y: visible;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mode-key-baseline-strut {
  display: inline-block;
  width: 0;
  vertical-align: baseline;
}

.mode-key-run {
  position: relative;
}

.mode-key-signature {
  unicode-bidi: isolate;
}

.mode-key-stacked-text {
  position: relative;
}

.starting-pitch-note {
  display: inline-block;
  position: relative;
}

.pitch-mark {
  position: absolute;
}

.ambitus {
  position: relative;
}
</style>
