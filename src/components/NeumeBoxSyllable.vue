<template>
  <div
    class="neume"
    :style="style"
    @click.exact="$emit('select-single')"
    @click.shift.exact="$emit('select-range')"
  >
    <Neume
      v-if="note.vareia && !pageSetup.melkiteRtl"
      :neume="VocalExpressionNeume.Vareia"
      :style="vareiaStyle"
    />
    <Neume :neume="note.quantitativeNeume" :style="neumeStyle" />
    <Neume
      v-if="note.stavros"
      :neume="VocalExpressionNeume.Cross_Top"
      :style="stavrosStyle"
    />
    <Neume
      v-if="hasVocalExpressionNeume"
      :neume="note.vocalExpressionNeume!"
      :style="vocalExpressionStyle"
    />
    <Neume v-if="hasTimeNeume" :neume="note.timeNeume!" :style="timeStyle" />
    <Neume
      v-if="note.koronis"
      :neume="TimeNeume.Koronis"
      :style="koronisStyle"
    />
    <Neume
      v-if="hasGorgonNeume"
      :neume="note.gorgonNeume!"
      :style="gorgonStyle"
    />
    <Neume
      v-if="hasSecondaryGorgonNeume"
      :neume="note.secondaryGorgonNeume!"
      :style="secondaryGorgonStyle"
    />
    <Neume v-if="hasFthora" :neume="note.fthora!" :style="fthoraStyle" />
    <Neume
      v-if="hasSecondaryFthora"
      :neume="note.secondaryFthora!"
      :style="secondaryFthoraStyle"
    />
    <Neume
      v-if="hasTertiaryFthora"
      :neume="note.tertiaryFthora!"
      :style="tertiaryFthoraStyle"
    />
    <Neume
      v-if="hasAccidental"
      :neume="note.accidental!"
      :style="accidentalStyle"
    />
    <Neume
      v-if="hasSecondaryAccidental"
      :neume="note.secondaryAccidental!"
      :style="secondaryAccidentalStyle"
    />
    <Neume
      v-if="hasTertiaryAccidental"
      :neume="note.tertiaryAccidental!"
      :style="tertiaryAccidentalStyle"
    />
    <Neume
      v-if="note.noteIndicator && note.noteIndicatorNeume"
      :neume="note.noteIndicatorNeume"
      :style="noteIndicatorStyle"
    />
    <Neume v-if="hasIson" :neume="note.ison!" :style="isonStyle" />
    <Neume
      v-if="hasMeasureNumber"
      :neume="note.measureNumber!"
      :style="measureNumberStyle"
    />
    <Neume
      v-if="hasMeasureBarLeft"
      :neume="getMeasureBarLeft!"
      :style="measureBarLeftStyle"
    />
    <Neume v-if="hasTie" :neume="note.tie!" :style="tieStyle" />
    <Neume
      v-if="note.vareia && pageSetup.melkiteRtl"
      :neume="VocalExpressionNeume.Vareia"
      :style="vareiaStyle"
    />
  </div>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import { computed } from 'vue';

import Neume from '@/components/NeumeGlyph.vue';
import type { NoteElement } from '@/models/Element';
import {
  QuantitativeNeume,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { withZoom } from '@/utils/withZoom';

const props = defineProps({
  note: {
    type: Object as PropType<NoteElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  alternateLine: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['select-single', 'select-range']);

const hasVocalExpressionNeume = computed(
  () => props.note.vocalExpressionNeume != null,
);
const hasTimeNeume = computed(() => props.note.timeNeume != null);
const hasGorgonNeume = computed(() => props.note.gorgonNeume != null);
const hasSecondaryGorgonNeume = computed(
  () => props.note.secondaryGorgonNeume != null,
);
const hasFthora = computed(() => props.note.fthora != null);
const hasSecondaryFthora = computed(() => props.note.secondaryFthora != null);
const hasTertiaryFthora = computed(() => props.note.tertiaryFthora != null);
const hasAccidental = computed(() => props.note.accidental != null);
const hasSecondaryAccidental = computed(
  () => props.note.secondaryAccidental != null,
);
const hasTertiaryAccidental = computed(
  () => props.note.tertiaryAccidental != null,
);
const getMeasureBarLeft = computed(
  () => props.note.measureBarLeft ?? props.note.computedMeasureBarLeft,
);
const hasMeasureBarLeft = computed(
  () => getMeasureBarLeft.value?.endsWith('Above') === true,
);
const hasMeasureNumber = computed(() => props.note.measureNumber != null);
const hasIson = computed(() => props.note.ison != null);
const hasTie = computed(() => props.note.tie != null);

function offsetStyle(
  left: number | null | undefined,
  top: number | null | undefined,
) {
  return {
    left: left != null ? `${left}em` : undefined,
    top: top != null ? `${top}em` : undefined,
  };
}

const style = computed(() => {
  return {
    fontFamily: props.pageSetup.neumeDefaultFontFamily,
    fontSize: props.alternateLine
      ? withZoom(props.pageSetup.alternateLineDefaultFontSize)
      : withZoom(props.pageSetup.neumeDefaultFontSize),
    color: props.alternateLine
      ? props.pageSetup.alternateLineDefaultColor
      : props.pageSetup.neumeDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.neumeDefaultStrokeWidth),
  } as StyleValue;
});

const gorgonStyle = computed(() => {
  return {
    color: props.pageSetup.gorgonDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.gorgonDefaultStrokeWidth),
    ...offsetStyle(
      props.note.gorgonNeumeOffsetX,
      props.note.gorgonNeumeOffsetY,
    ),
  } as StyleValue;
});

const secondaryGorgonStyle = computed(() => {
  return {
    color: props.pageSetup.gorgonDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.gorgonDefaultStrokeWidth),
    ...offsetStyle(
      props.note.secondaryGorgonNeumeOffsetX,
      props.note.secondaryGorgonNeumeOffsetY,
    ),
  } as StyleValue;
});

const fthoraStyle = computed(() => {
  return {
    color: props.pageSetup.fthoraDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.fthoraDefaultStrokeWidth),
    ...offsetStyle(props.note.fthoraOffsetX, props.note.fthoraOffsetY),
  } as StyleValue;
});

const secondaryFthoraStyle = computed(() => {
  return {
    color: props.pageSetup.fthoraDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.fthoraDefaultStrokeWidth),
    ...offsetStyle(
      props.note.secondaryFthoraOffsetX,
      props.note.secondaryFthoraOffsetY,
    ),
  } as StyleValue;
});

const tertiaryFthoraStyle = computed(() => {
  return {
    color: props.pageSetup.fthoraDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.fthoraDefaultStrokeWidth),
    ...offsetStyle(
      props.note.tertiaryFthoraOffsetX,
      props.note.tertiaryFthoraOffsetY,
    ),
  } as StyleValue;
});

const accidentalStyle = computed(() => {
  return {
    color: props.pageSetup.accidentalDefaultColor,
    webkitTextStrokeWidth: withZoom(
      props.pageSetup.accidentalDefaultStrokeWidth,
    ),
    ...offsetStyle(props.note.accidentalOffsetX, props.note.accidentalOffsetY),
  } as StyleValue;
});

const secondaryAccidentalStyle = computed(() => {
  return {
    color: props.pageSetup.accidentalDefaultColor,
    webkitTextStrokeWidth: withZoom(
      props.pageSetup.accidentalDefaultStrokeWidth,
    ),
    ...offsetStyle(
      props.note.secondaryAccidentalOffsetX,
      props.note.secondaryAccidentalOffsetY,
    ),
  } as StyleValue;
});

const tertiaryAccidentalStyle = computed(() => {
  return {
    color: props.pageSetup.accidentalDefaultColor,
    webkitTextStrokeWidth: withZoom(
      props.pageSetup.accidentalDefaultStrokeWidth,
    ),
    ...offsetStyle(
      props.note.tertiaryAccidentalOffsetX,
      props.note.tertiaryAccidentalOffsetY,
    ),
  } as StyleValue;
});

const measureBarLeftStyle = computed(() => {
  return {
    color: props.pageSetup.measureBarDefaultColor,
    webkitTextStrokeWidth: withZoom(
      props.pageSetup.measureBarDefaultStrokeWidth,
    ),
    ...offsetStyle(
      props.note.measureBarLeftOffsetX,
      props.note.measureBarLeftOffsetY,
    ),
  } as StyleValue;
});

const measureNumberStyle = computed(() => {
  return {
    color: props.pageSetup.measureNumberDefaultColor,
    webkitTextStrokeWidth: withZoom(
      props.pageSetup.measureNumberDefaultStrokeWidth,
    ),
    ...offsetStyle(
      props.note.measureNumberOffsetX,
      props.note.measureNumberOffsetY,
    ),
  } as StyleValue;
});

const noteIndicatorStyle = computed(() => {
  return {
    color: props.pageSetup.noteIndicatorDefaultColor,
    webkitTextStrokeWidth: withZoom(
      props.pageSetup.noteIndicatorDefaultStrokeWidth,
    ),
    ...offsetStyle(
      props.note.noteIndicatorOffsetX,
      props.note.noteIndicatorOffsetY,
    ),
  } as StyleValue;
});

const isonStyle = computed(() => {
  return {
    color: props.pageSetup.isonDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.isonDefaultStrokeWidth),
    ...offsetStyle(props.note.isonOffsetX, props.note.computedIsonOffsetY),
  } as StyleValue;
});

const timeStyle = computed(() => {
  return offsetStyle(
    props.note.timeNeumeOffsetX,
    props.note.timeNeumeOffsetY,
  ) as StyleValue;
});

const neumeStyle = computed(() => {
  if (props.note.quantitativeNeume == QuantitativeNeume.Cross) {
    return {
      color: props.pageSetup.crossDefaultColor,
      webkitTextStrokeWidth: withZoom(props.pageSetup.crossDefaultStrokeWidth),
    } as StyleValue;
  } else if (props.note.quantitativeNeume == QuantitativeNeume.Breath) {
    return {
      color: props.pageSetup.breathDefaultColor,
      webkitTextStrokeWidth: withZoom(props.pageSetup.breathDefaultStrokeWidth),
    } as StyleValue;
  }

  return {};
});

const koronisStyle = computed(() => {
  return {
    color: props.pageSetup.koronisDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.koronisDefaultStrokeWidth),
    ...offsetStyle(props.note.koronisOffsetX, props.note.koronisOffsetY),
  } as StyleValue;
});

const stavrosStyle = computed(() => {
  return {
    color: props.pageSetup.crossDefaultColor,
    webkitTextStrokeWidth: withZoom(props.pageSetup.crossDefaultStrokeWidth),
    ...offsetStyle(props.note.stavrosOffsetX, props.note.stavrosOffsetY),
  } as StyleValue;
});

const vareiaStyle = computed(() => {
  const style = offsetStyle(
    props.note.vareiaOffsetX,
    props.note.vareiaOffsetY,
  ) as Partial<CSSStyleDeclaration>;

  return {
    ...style,
    marginRight: !props.pageSetup.melkiteRtl
      ? withZoom(props.note.vareiaInternalSpacing)
      : undefined,
    marginLeft: props.pageSetup.melkiteRtl
      ? withZoom(props.note.vareiaInternalSpacing)
      : undefined,
  } as StyleValue;
});

const vocalExpressionStyle = computed(() => {
  const style = offsetStyle(
    props.note.vocalExpressionNeumeOffsetX,
    props.note.vocalExpressionNeumeOffsetY,
  ) as Partial<CSSStyleDeclaration>;

  if (
    props.note.vocalExpressionNeume === VocalExpressionNeume.Heteron ||
    props.note.vocalExpressionNeume ===
      VocalExpressionNeume.HeteronConnecting ||
    props.note.vocalExpressionNeume ===
      VocalExpressionNeume.HeteronConnectingLong ||
    props.note.vocalExpressionNeume === VocalExpressionNeume.Endofonon
  ) {
    style.color = props.pageSetup.heteronDefaultColor;
    style.webkitTextStrokeWidth = withZoom(
      props.pageSetup.heteronDefaultStrokeWidth,
    );
  }

  return style;
});

const tieStyle = computed(() => {
  return offsetStyle(
    props.note.tieOffsetX,
    props.note.tieOffsetY,
  ) as StyleValue;
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume {
  cursor: default;
  position: relative;
  user-select: none;
}

.measure-bar {
  display: inline-block;
}
</style>
