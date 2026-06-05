<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="max-h-[calc(100dvh-2rem)] max-w-md grid-rows-[auto_auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-md"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.neumePositioning.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{
            $t(($) => $.dialog.neumePositioning.description, {
              ns: 'dialog',
            })
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="top-pane bg-white" :style="topPaneStyle">
        <template v-if="previousElement != null">
          <NeumeBoxSyllable
            v-if="previousElement.elementType === ElementType.Note"
            class="other-neume"
            :note="previousElement as NoteElement"
            :page-setup="pageSetup"
            :style="previousElementStyle"
          />

          <NeumeBoxMartyria
            v-if="previousElement.elementType === ElementType.Martyria"
            class="other-neume"
            :neume="previousElement as MartyriaElement"
            :page-setup="pageSetup"
            :style="previousElementStyle"
          />

          <NeumeBoxTempo
            v-if="previousElement.elementType === ElementType.Tempo"
            class="other-neume"
            :neume="previousElement as TempoElement"
            :page-setup="pageSetup"
            :style="previousElementStyle"
          />
        </template>

        <div class="neume-container" :style="mainStyle">
          <NeumeBoxSyllable
            :note="form as NoteElement"
            :page-setup="pageSetup"
          />
          <DragHandle
            v-if="hasAccidental"
            :note="form as NoteElement"
            :mark="form.accidental!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.accidentalOffsetX"
            :y="form.accidentalOffsetY"
            @update="updateAccidentalOffset($event)"
          />
          <DragHandle
            v-if="hasSecondaryAccidental"
            :note="form as NoteElement"
            :mark="form.secondaryAccidental!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.secondaryAccidentalOffsetX"
            :y="form.secondaryAccidentalOffsetY"
            @update="updateSecondaryAccidentalOffset($event)"
          />
          <DragHandle
            v-if="hasTertiaryAccidental"
            :note="form as NoteElement"
            :mark="form.tertiaryAccidental!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.tertiaryAccidentalOffsetX"
            :y="form.tertiaryAccidentalOffsetY"
            @update="updateTertiaryAccidentalOffset($event)"
          />
          <!-- <DragHandle
            v-if="hasMeasureBarLeft"
            :note="form as NoteElement"
            :mark="form.measureBarLeft"
            :fontFamily="pageSetup.neumeDefaultFontFamily"
            :fontSize="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.measureBarLeftOffsetX"
            :y="form.measureBarLeftOffsetY"
            @update="updateMeasureBarLeftOffset($event)"
          />
          <DragHandle
            v-if="hasMeasureBarRight"
            :note="form as NoteElement"
            :mark="form.measureBarRight"
            :fontFamily="pageSetup.neumeDefaultFontFamily"
            :fontSize="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.measureBarRightOffsetX"
            :y="form.measureBarRightOffsetY"
            @update="updateMeasureBarRightOffset($event)"
          /> -->
          <DragHandle
            v-if="hasFthora"
            :note="form as NoteElement"
            :mark="form.fthora!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.fthoraOffsetX"
            :y="form.fthoraOffsetY"
            @update="updateFthoraOffset($event)"
          />
          <DragHandle
            v-if="hasSecondaryFthora"
            :note="form as NoteElement"
            :mark="form.secondaryFthora!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.secondaryFthoraOffsetX"
            :y="form.secondaryFthoraOffsetY"
            @update="updateSecondaryFthoraOffset($event)"
          />
          <DragHandle
            v-if="hasTertiaryFthora"
            :note="form as NoteElement"
            :mark="form.tertiaryFthora!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.tertiaryFthoraOffsetX"
            :y="form.tertiaryFthoraOffsetY"
            @update="updateTertiaryFthoraOffset($event)"
          />
          <DragHandle
            v-if="hasGorgonNeume"
            :note="form as NoteElement"
            :mark="form.gorgonNeume!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.gorgonNeumeOffsetX"
            :y="form.gorgonNeumeOffsetY"
            @update="updateGorgonOffset($event)"
          />
          <DragHandle
            v-if="hasSecondaryGorgonNeume"
            :note="form as NoteElement"
            :mark="form.secondaryGorgonNeume!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.secondaryGorgonNeumeOffsetX"
            :y="form.secondaryGorgonNeumeOffsetY"
            @update="updateGorgon2Offset($event)"
          />
          <DragHandle
            v-if="hasIson"
            :note="form as NoteElement"
            :mark="form.ison!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.isonOffsetX"
            :y="form.isonOffsetY"
            @update="updateIsonOffset($event)"
          />
          <DragHandle
            v-if="form.koronis"
            :note="form as NoteElement"
            :mark="TimeNeume.Koronis"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.koronisOffsetX"
            :y="form.koronisOffsetY"
            @update="updateKoronisOffset($event)"
          />
          <DragHandle
            v-if="hasMeasureNumber"
            :note="form as NoteElement"
            :mark="form.measureNumber!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.measureNumberOffsetX"
            :y="form.measureNumberOffsetY"
            @update="updateMeasureNumberOffset($event)"
          />
          <DragHandle
            v-if="form.noteIndicator"
            :note="form as NoteElement"
            :mark="form.noteIndicatorNeume!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.noteIndicatorOffsetX"
            :y="form.noteIndicatorOffsetY"
            @update="updateNoteIndicatorOffset($event)"
          />
          <DragHandle
            v-if="form.stavros"
            :note="form as NoteElement"
            :mark="VocalExpressionNeume.Cross_Top"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.stavrosOffsetX"
            :y="form.stavrosOffsetY"
            @update="updateStavrosOffset($event)"
          />
          <DragHandle
            v-if="hasTie"
            :note="form as NoteElement"
            :mark="form.tie!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.tieOffsetX"
            :y="form.tieOffsetY"
            @update="updateTieOffset($event)"
          />
          <DragHandle
            v-if="hasTimeNeume"
            :note="form as NoteElement"
            :mark="form.timeNeume!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.timeNeumeOffsetX"
            :y="form.timeNeumeOffsetY"
            @update="updateTimeOffset($event)"
          />
          <!-- <DragHandle
            v-if="form.vareia"
            :note="form as NoteElement"
            :mark="VocalExpressionNeume.Vareia"
            :fontFamily="pageSetup.neumeDefaultFontFamily"
            :fontSize="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.vareiaOffsetX"
            :y="form.vareiaOffsetY"
            @update="updateVareiaOffset($event)"
          /> -->
          <DragHandle
            v-if="hasVocalExpressionNeume"
            :note="form as NoteElement"
            :mark="form.vocalExpressionNeume!"
            :font-family="pageSetup.neumeDefaultFontFamily"
            :font-size="pageSetup.neumeDefaultFontSize"
            :zoom="zoom"
            :x="form.vocalExpressionNeumeOffsetX"
            :y="form.vocalExpressionNeumeOffsetY"
            @update="updateQualityOffset($event)"
          />
        </div>
        <template v-if="nextElement != null">
          <NeumeBoxSyllable
            v-if="nextElement.elementType === ElementType.Note"
            class="other-neume"
            :note="nextElement as NoteElement"
            :page-setup="pageSetup"
            :style="nextElementStyle"
          />

          <NeumeBoxMartyria
            v-if="nextElement.elementType === ElementType.Martyria"
            class="other-neume"
            :neume="nextElement as MartyriaElement"
            :page-setup="pageSetup"
            :style="nextElementStyle"
          />

          <NeumeBoxTempo
            v-if="nextElement.elementType === ElementType.Tempo"
            class="other-neume"
            :neume="nextElement as TempoElement"
            :page-setup="pageSetup"
            :style="nextElementStyle"
          />
        </template>
      </div>
      <form
        id="syllable-positioning-form"
        class="min-h-0 overflow-y-auto pr-1"
        @submit.prevent="update"
      >
        <div
          class="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 gap-y-1"
        >
          <div aria-hidden="true" />
          <div
            :id="leftOffsetHeaderId"
            class="h-6 text-xs font-medium text-foreground"
          >
            {{ $t(($) => $.dialog.common.left, { ns: 'dialog' }) }}
          </div>
          <div
            :id="topOffsetHeaderId"
            class="h-6 text-xs font-medium text-foreground"
          >
            {{ $t(($) => $.dialog.common.top, { ns: 'dialog' }) }}
          </div>

          <template v-for="row in offsetRows" :key="row.id">
            <div
              :id="getOffsetRowLabelId(row)"
              class="flex h-7 min-w-0 items-center text-xs"
            >
              {{ $t(row.label, { ns: 'dialog' }) }}
            </div>
            <InputUnit
              :id="getOffsetInputId(row, 'x')"
              class="h-7 min-w-16 px-2"
              button-class="p-1 [&>svg]:h-3 [&>svg]:w-3"
              :aria-labelledby="`${getOffsetRowLabelId(row)} ${leftOffsetHeaderId}`"
              :model-value="getOffsetValue(row.xKey)"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :format-options="fraction2FormatOptions"
              @update:model-value="updateOffsetValue(row.xKey, $event)"
            />
            <InputUnit
              :id="getOffsetInputId(row, 'y')"
              class="h-7 min-w-16 px-2"
              button-class="p-1 [&>svg]:h-3 [&>svg]:w-3"
              :aria-labelledby="`${getOffsetRowLabelId(row)} ${topOffsetHeaderId}`"
              :model-value="getOffsetValue(row.yKey)"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :format-options="fraction2FormatOptions"
              @update:model-value="updateOffsetValue(row.yKey, $event)"
            />
          </template>
        </div>
      </form>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" type="button">
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
        <Button type="submit" form="syllable-positioning-form">
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { SelectorParam } from 'i18next';
import type { PropType, StyleValue } from 'vue';
import { computed, ref } from 'vue';

import DragHandle from '@/components/DragHandle.vue';
import type { UnitOfMeasure } from '@/components/InputUnit.types';
import InputUnit from '@/components/InputUnit.vue';
import NeumeBoxMartyria from '@/components/NeumeBoxMartyria.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import NeumeBoxTempo from '@/components/NeumeBoxTempo.vue';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type {
  MartyriaElement,
  ScoreElement,
  ScoreElementOffset,
  TempoElement,
} from '@/models/Element';
import { ElementType, NoteElement } from '@/models/Element';
import { TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';

const emit = defineEmits<{
  update: [form: NoteElement];
}>();
const props = defineProps({
  element: {
    type: Object as PropType<NoteElement>,
    required: true,
  },
  previousElement: {
    type: Object as PropType<ScoreElement>,
    default: undefined,
  },
  nextElement: {
    type: Object as PropType<ScoreElement>,
    default: undefined,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});
const open = defineModel<boolean>('open', { required: true });

const form = ref(new NoteElement());
const stepSize = 0.01;
const min = -10;
const max = 10;
const unit = 'unitless' as UnitOfMeasure;
const paneContainerWidthPx = 448;
const zoom = 2;
const leftOffsetHeaderId = 'syllable-positioning-left-header';
const topOffsetHeaderId = 'syllable-positioning-top-header';

type DialogSelector = SelectorParam<'dialog'>;
type NoteOffsetKey =
  | 'accidentalOffsetX'
  | 'accidentalOffsetY'
  | 'secondaryAccidentalOffsetX'
  | 'secondaryAccidentalOffsetY'
  | 'tertiaryAccidentalOffsetX'
  | 'tertiaryAccidentalOffsetY'
  | 'measureBarLeftOffsetX'
  | 'measureBarLeftOffsetY'
  | 'measureBarRightOffsetX'
  | 'measureBarRightOffsetY'
  | 'fthoraOffsetX'
  | 'fthoraOffsetY'
  | 'secondaryFthoraOffsetX'
  | 'secondaryFthoraOffsetY'
  | 'tertiaryFthoraOffsetX'
  | 'tertiaryFthoraOffsetY'
  | 'gorgonNeumeOffsetX'
  | 'gorgonNeumeOffsetY'
  | 'secondaryGorgonNeumeOffsetX'
  | 'secondaryGorgonNeumeOffsetY'
  | 'isonOffsetX'
  | 'isonOffsetY'
  | 'koronisOffsetX'
  | 'koronisOffsetY'
  | 'measureNumberOffsetX'
  | 'measureNumberOffsetY'
  | 'noteIndicatorOffsetX'
  | 'noteIndicatorOffsetY'
  | 'stavrosOffsetX'
  | 'stavrosOffsetY'
  | 'tieOffsetX'
  | 'tieOffsetY'
  | 'timeNeumeOffsetX'
  | 'timeNeumeOffsetY'
  | 'vareiaOffsetX'
  | 'vareiaOffsetY'
  | 'vocalExpressionNeumeOffsetX'
  | 'vocalExpressionNeumeOffsetY';

type OffsetAxis = 'x' | 'y';

type OffsetRow = {
  id: string;
  label: DialogSelector;
  xKey: NoteOffsetKey;
  yKey: NoteOffsetKey;
};

const offsetRows = [
  {
    id: 'accidental',
    label: ($) => $.dialog.neumePositioning.accidental,
    xKey: 'accidentalOffsetX',
    yKey: 'accidentalOffsetY',
  },
  {
    id: 'secondary-accidental',
    label: ($) => $.dialog.neumePositioning.accidental2,
    xKey: 'secondaryAccidentalOffsetX',
    yKey: 'secondaryAccidentalOffsetY',
  },
  {
    id: 'tertiary-accidental',
    label: ($) => $.dialog.neumePositioning.accidental3,
    xKey: 'tertiaryAccidentalOffsetX',
    yKey: 'tertiaryAccidentalOffsetY',
  },
  {
    id: 'measure-bar-left',
    label: ($) => $.dialog.neumePositioning.barLineL,
    xKey: 'measureBarLeftOffsetX',
    yKey: 'measureBarLeftOffsetY',
  },
  {
    id: 'measure-bar-right',
    label: ($) => $.dialog.neumePositioning.barLineR,
    xKey: 'measureBarRightOffsetX',
    yKey: 'measureBarRightOffsetY',
  },
  {
    id: 'fthora',
    label: ($) => $.dialog.neumePositioning.fthora,
    xKey: 'fthoraOffsetX',
    yKey: 'fthoraOffsetY',
  },
  {
    id: 'secondary-fthora',
    label: ($) => $.dialog.neumePositioning.fthora2,
    xKey: 'secondaryFthoraOffsetX',
    yKey: 'secondaryFthoraOffsetY',
  },
  {
    id: 'tertiary-fthora',
    label: ($) => $.dialog.neumePositioning.fthora3,
    xKey: 'tertiaryFthoraOffsetX',
    yKey: 'tertiaryFthoraOffsetY',
  },
  {
    id: 'gorgon',
    label: ($) => $.dialog.neumePositioning.gorgon,
    xKey: 'gorgonNeumeOffsetX',
    yKey: 'gorgonNeumeOffsetY',
  },
  {
    id: 'secondary-gorgon',
    label: ($) => $.dialog.neumePositioning.gorgon2,
    xKey: 'secondaryGorgonNeumeOffsetX',
    yKey: 'secondaryGorgonNeumeOffsetY',
  },
  {
    id: 'ison',
    label: ($) => $.dialog.neumePositioning.ison,
    xKey: 'isonOffsetX',
    yKey: 'isonOffsetY',
  },
  {
    id: 'koronis',
    label: ($) => $.dialog.neumePositioning.koronis,
    xKey: 'koronisOffsetX',
    yKey: 'koronisOffsetY',
  },
  {
    id: 'measure-number',
    label: ($) => $.dialog.neumePositioning.measureNo,
    xKey: 'measureNumberOffsetX',
    yKey: 'measureNumberOffsetY',
  },
  {
    id: 'note-indicator',
    label: ($) => $.dialog.neumePositioning.note,
    xKey: 'noteIndicatorOffsetX',
    yKey: 'noteIndicatorOffsetY',
  },
  {
    id: 'cross',
    label: ($) => $.dialog.neumePositioning.cross,
    xKey: 'stavrosOffsetX',
    yKey: 'stavrosOffsetY',
  },
  {
    id: 'tie',
    label: ($) => $.dialog.neumePositioning.tie,
    xKey: 'tieOffsetX',
    yKey: 'tieOffsetY',
  },
  {
    id: 'time',
    label: ($) => $.dialog.neumePositioning.time,
    xKey: 'timeNeumeOffsetX',
    yKey: 'timeNeumeOffsetY',
  },
  {
    id: 'vareia',
    label: ($) => $.dialog.neumePositioning.vareia,
    xKey: 'vareiaOffsetX',
    yKey: 'vareiaOffsetY',
  },
  {
    id: 'quality',
    label: ($) => $.dialog.neumePositioning.quality,
    xKey: 'vocalExpressionNeumeOffsetX',
    yKey: 'vocalExpressionNeumeOffsetY',
  },
] satisfies OffsetRow[];

const hasVocalExpressionNeume = computed(() => {
  return form.value.vocalExpressionNeume != null;
});

const hasTimeNeume = computed(() => {
  return form.value.timeNeume != null;
});

const hasGorgonNeume = computed(() => {
  return form.value.gorgonNeume != null;
});

const hasSecondaryGorgonNeume = computed(() => {
  return form.value.secondaryGorgonNeume != null;
});

const hasFthora = computed(() => {
  return form.value.fthora != null;
});

const hasSecondaryFthora = computed(() => {
  return form.value.secondaryFthora != null;
});

const hasTertiaryFthora = computed(() => {
  return form.value.tertiaryFthora != null;
});

const hasAccidental = computed(() => {
  return form.value.accidental != null;
});

const hasSecondaryAccidental = computed(() => {
  return form.value.secondaryAccidental != null;
});

const hasTertiaryAccidental = computed(() => {
  return form.value.tertiaryAccidental != null;
});

const hasMeasureNumber = computed(() => {
  return form.value.measureNumber != null;
});

const hasIson = computed(() => {
  return form.value.ison != null;
});

const hasTie = computed(() => {
  return form.value.tie != null;
});

const centerLeft = computed(() => paneContainerWidthPx / 2);

const previousElementStyle = computed(() => {
  return {
    left: `calc(${centerLeft.value}px - ${
      props.element.x - props.previousElement!.x
    }px * var(--zoom, 1))`,
  } as StyleValue;
});

const nextElementStyle = computed(() => {
  return {
    left: `calc(${centerLeft.value}px + ${
      props.nextElement!.x - props.element.x
    }px * var(--zoom, 1))`,
  } as StyleValue;
});

const mainStyle = computed(() => {
  return {
    left: centerLeft.value + 'px',
  } as StyleValue;
});

const topPaneStyle = computed(() => {
  const neumeHeight = TextMeasurementService.getFontHeight(
    `${props.pageSetup.neumeDefaultFontSize}px ${props.pageSetup.neumeDefaultFontFamily}`,
  );

  return {
    height: neumeHeight * zoom + 'px',
  } as StyleValue;
});

Object.assign(form.value, props.element);

function update() {
  emit('update', form.value as NoteElement);
  open.value = false;
}

function getOffsetRowLabelId(row: OffsetRow) {
  return `syllable-positioning-${row.id}-label`;
}

function getOffsetInputId(row: OffsetRow, axis: OffsetAxis) {
  return `syllable-positioning-${row.id}-${axis}`;
}

function getOffsetValue(key: NoteOffsetKey) {
  return form.value[key];
}

function updateOffsetValue(key: NoteOffsetKey, value: number | null) {
  form.value[key] = value;
}

function updateAccidentalOffset(args: ScoreElementOffset) {
  form.value.accidentalOffsetX = args.x;
  form.value.accidentalOffsetY = args.y;
}

function updateSecondaryAccidentalOffset(args: ScoreElementOffset) {
  form.value.secondaryAccidentalOffsetX = args.x;
  form.value.secondaryAccidentalOffsetY = args.y;
}

function updateTertiaryAccidentalOffset(args: ScoreElementOffset) {
  form.value.tertiaryAccidentalOffsetX = args.x;
  form.value.tertiaryAccidentalOffsetY = args.y;
}

function updateFthoraOffset(args: ScoreElementOffset) {
  form.value.fthoraOffsetX = args.x;
  form.value.fthoraOffsetY = args.y;
}

function updateSecondaryFthoraOffset(args: ScoreElementOffset) {
  form.value.secondaryFthoraOffsetX = args.x;
  form.value.secondaryFthoraOffsetY = args.y;
}

function updateTertiaryFthoraOffset(args: ScoreElementOffset) {
  form.value.tertiaryFthoraOffsetX = args.x;
  form.value.tertiaryFthoraOffsetY = args.y;
}

function updateGorgonOffset(args: ScoreElementOffset) {
  form.value.gorgonNeumeOffsetX = args.x;
  form.value.gorgonNeumeOffsetY = args.y;
}

function updateGorgon2Offset(args: ScoreElementOffset) {
  form.value.secondaryGorgonNeumeOffsetX = args.x;
  form.value.secondaryGorgonNeumeOffsetY = args.y;
}

function updateIsonOffset(args: ScoreElementOffset) {
  form.value.isonOffsetX = args.x;
  form.value.isonOffsetY = args.y;
}

function updateKoronisOffset(args: ScoreElementOffset) {
  form.value.koronisOffsetX = args.x;
  form.value.koronisOffsetY = args.y;
}

function updateMeasureNumberOffset(args: ScoreElementOffset) {
  form.value.measureNumberOffsetX = args.x;
  form.value.measureNumberOffsetY = args.y;
}

function updateNoteIndicatorOffset(args: ScoreElementOffset) {
  form.value.noteIndicatorOffsetX = args.x;
  form.value.noteIndicatorOffsetY = args.y;
}

function updateStavrosOffset(args: ScoreElementOffset) {
  form.value.stavrosOffsetX = args.x;
  form.value.stavrosOffsetY = args.y;
}

function updateTieOffset(args: ScoreElementOffset) {
  form.value.tieOffsetX = args.x;
  form.value.tieOffsetY = args.y;
}

function updateTimeOffset(args: ScoreElementOffset) {
  form.value.timeNeumeOffsetX = args.x;
  form.value.timeNeumeOffsetY = args.y;
}

function updateQualityOffset(args: ScoreElementOffset) {
  form.value.vocalExpressionNeumeOffsetX = args.x;
  form.value.vocalExpressionNeumeOffsetY = args.y;
}
</script>

<style scoped>
.top-pane {
  display: flex;
  align-items: center;
  justify-content: center;
}

.neume-container {
  position: absolute;
}

.other-neume {
  position: absolute;
  opacity: 0.5;
}

.neume {
  --zoom: 2;
}

.handle {
  --zoom: 2;
}
</style>
