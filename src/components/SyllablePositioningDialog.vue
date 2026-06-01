<template>
  <ModalDialog>
    <div class="container">
      <div class="header">
        {{ $t(($) => $.dialog.neumePositioning.root, { ns: 'dialog' }) }}
      </div>
      <div class="pane-container" :style="paneContainerStyle">
        <div class="top-pane" :style="topPaneStyle">
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
        <div class="bottom-pane">
          <div class="form-group">
            <label />
            <span class="table-header">{{
              $t(($) => $.dialog.common.left, { ns: 'dialog' })
            }}</span>
            <span class="table-header">{{
              $t(($) => $.dialog.common.top, { ns: 'dialog' })
            }}</span>
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.accidental, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.accidentalOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.accidentalOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.accidental2, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.secondaryAccidentalOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.secondaryAccidentalOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.accidental3, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.tertiaryAccidentalOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.tertiaryAccidentalOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.barLineL, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.measureBarLeftOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.measureBarLeftOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.barLineR, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.measureBarRightOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.measureBarRightOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.fthora, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.fthoraOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.fthoraOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.fthora2, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.secondaryFthoraOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.secondaryFthoraOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.fthora3, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.tertiaryFthoraOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.tertiaryFthoraOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.gorgon, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.gorgonNeumeOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.gorgonNeumeOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.gorgon2, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.secondaryGorgonNeumeOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.secondaryGorgonNeumeOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.ison, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.isonOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.isonOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.koronis, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.koronisOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.koronisOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.measureNo, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.measureNumberOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.measureNumberOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.note, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.noteIndicatorOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.noteIndicatorOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.cross, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.stavrosOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.stavrosOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.tie, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.tieOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.tieOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.time, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.timeNeumeOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.timeNeumeOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.vareia, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.vareiaOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.vareiaOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
          <div class="form-group">
            <label>{{
              $t(($) => $.dialog.neumePositioning.quality, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="form.vocalExpressionNeumeOffsetX"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
            <InputUnit
              v-model="form.vocalExpressionNeumeOffsetY"
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
            />
          </div>
        </div>
      </div>
      <div class="button-container">
        <button class="ok-btn" @click="update">
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </button>
        <button class="cancel-btn" @click="$emit('close')">
          {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
import type { PropType, StyleValue } from 'vue';
import { computed, onBeforeUnmount, ref } from 'vue';

import DragHandle from '@/components/DragHandle.vue';
import type { UnitOfMeasure } from '@/components/InputUnit.types';
import InputUnit from '@/components/InputUnit.vue';
import ModalDialog from '@/components/ModalDialog.vue';
import NeumeBoxMartyria from '@/components/NeumeBoxMartyria.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import NeumeBoxTempo from '@/components/NeumeBoxTempo.vue';
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

const emit = defineEmits(['close', 'update']);
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

const form = ref(new NoteElement());
const stepSize = 0.01;
const min = -10;
const max = 10;
const precision = 2;
const unit = 'unitless' as UnitOfMeasure;
const paneContainerWidthPx = 420;
const zoom = 2;

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

const paneContainerStyle = computed(() => {
  return {
    width: paneContainerWidthPx + 'px',
  } as StyleValue;
});

Object.assign(form.value, props.element);

window.addEventListener('keydown', onKeyDown);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});

function onKeyDown(event: KeyboardEvent) {
  if (event.code === 'Escape') {
    emit('close');
  }
}

function update() {
  emit('update', form.value);
  emit('close');
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dialog-content {
  display: flex;
}

.container {
  display: flex;
  flex-direction: column;
  height: 80vh;
}

.pane-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
  overflow: auto;
  flex: 1;
}

.form-group label {
  display: inline-block;
  width: 6.75rem;
}

.form-group input {
  width: 3rem;
}

.form-group .table-header {
  display: inline-block;
  width: 3.5rem;
}

.top-pane {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-pane {
  overflow: auto;
  flex: 1;
}

.header {
  font-size: 1.5rem;
  text-align: center;
}

.button-container {
  display: flex;
  justify-content: center;
}

.ok-btn {
  margin-right: 2rem;
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
