<template>
  <ModalDialog>
    <div class="container">
      <div class="header">{{ $t('dialog:neumePositioning.root') }}</div>
      <div class="pane-container" :style="paneContainerStyle">
        <div class="top-pane" :style="topPaneStyle">
          <template v-if="previousElement != null">
            <NeumeBoxSyllable
              v-if="previousElement.elementType === ElementType.Note"
              class="other-neume"
              :note="previousElement as NoteElement"
              :pageSetup="pageSetup"
              :style="previousElementStyle"
            />

            <NeumeBoxMartyria
              v-if="previousElement.elementType === ElementType.Martyria"
              class="other-neume"
              :neume="previousElement as MartyriaElement"
              :pageSetup="pageSetup"
              :style="previousElementStyle"
            />

            <NeumeBoxTempo
              v-if="previousElement.elementType === ElementType.Tempo"
              class="other-neume"
              :neume="previousElement as TempoElement"
              :pageSetup="pageSetup"
              :style="previousElementStyle"
            />
          </template>

          <div class="neume-container" :style="mainStyle">
            <NeumeBoxSyllable
              :note="form as NoteElement"
              :pageSetup="pageSetup"
            />
            <DragHandle
              v-if="hasAccidental"
              :note="form as NoteElement"
              :mark="form.accidental!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.accidentalOffsetX"
              :y="form.accidentalOffsetY"
              @update="updateAccidentalOffset($event)"
            />
            <DragHandle
              v-if="hasSecondaryAccidental"
              :note="form as NoteElement"
              :mark="form.secondaryAccidental!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.secondaryAccidentalOffsetX"
              :y="form.secondaryAccidentalOffsetY"
              @update="updateSecondaryAccidentalOffset($event)"
            />
            <DragHandle
              v-if="hasTertiaryAccidental"
              :note="form as NoteElement"
              :mark="form.tertiaryAccidental!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
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
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.fthoraOffsetX"
              :y="form.fthoraOffsetY"
              @update="updateFthoraOffset($event)"
            />
            <DragHandle
              v-if="hasSecondaryFthora"
              :note="form as NoteElement"
              :mark="form.secondaryFthora!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.secondaryFthoraOffsetX"
              :y="form.secondaryFthoraOffsetY"
              @update="updateSecondaryFthoraOffset($event)"
            />
            <DragHandle
              v-if="hasTertiaryFthora"
              :note="form as NoteElement"
              :mark="form.tertiaryFthora!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.tertiaryFthoraOffsetX"
              :y="form.tertiaryFthoraOffsetY"
              @update="updateTertiaryFthoraOffset($event)"
            />
            <DragHandle
              v-if="hasGorgonNeume"
              :note="form as NoteElement"
              :mark="form.gorgonNeume!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.gorgonNeumeOffsetX"
              :y="form.gorgonNeumeOffsetY"
              @update="updateGorgonOffset($event)"
            />
            <DragHandle
              v-if="hasSecondaryGorgonNeume"
              :note="form as NoteElement"
              :mark="form.secondaryGorgonNeume!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.secondaryGorgonNeumeOffsetX"
              :y="form.secondaryGorgonNeumeOffsetY"
              @update="updateGorgon2Offset($event)"
            />
            <DragHandle
              v-if="hasIson"
              :note="form as NoteElement"
              :mark="form.ison!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.isonOffsetX"
              :y="form.isonOffsetY"
              @update="updateIsonOffset($event)"
            />
            <DragHandle
              v-if="form.koronis"
              :note="form as NoteElement"
              :mark="TimeNeume.Koronis"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.koronisOffsetX"
              :y="form.koronisOffsetY"
              @update="updateKoronisOffset($event)"
            />
            <DragHandle
              v-if="hasMeasureNumber"
              :note="form as NoteElement"
              :mark="form.measureNumber!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.measureNumberOffsetX"
              :y="form.measureNumberOffsetY"
              @update="updateMeasureNumberOffset($event)"
            />
            <DragHandle
              v-if="form.noteIndicator"
              :note="form as NoteElement"
              :mark="form.noteIndicatorNeume!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.noteIndicatorOffsetX"
              :y="form.noteIndicatorOffsetY"
              @update="updateNoteIndicatorOffset($event)"
            />
            <DragHandle
              v-if="form.stavros"
              :note="form as NoteElement"
              :mark="VocalExpressionNeume.Cross_Top"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.stavrosOffsetX"
              :y="form.stavrosOffsetY"
              @update="updateStavrosOffset($event)"
            />
            <DragHandle
              v-if="hasTie"
              :note="form as NoteElement"
              :mark="form.tie!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.tieOffsetX"
              :y="form.tieOffsetY"
              @update="updateTieOffset($event)"
            />
            <DragHandle
              v-if="hasTimeNeume"
              :note="form as NoteElement"
              :mark="form.timeNeume!"
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
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
              :fontFamily="pageSetup.neumeDefaultFontFamily"
              :fontSize="pageSetup.neumeDefaultFontSize"
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
              :pageSetup="pageSetup"
              :style="nextElementStyle"
            />

            <NeumeBoxMartyria
              v-if="nextElement.elementType === ElementType.Martyria"
              class="other-neume"
              :neume="nextElement as MartyriaElement"
              :pageSetup="pageSetup"
              :style="nextElementStyle"
            />

            <NeumeBoxTempo
              v-if="nextElement.elementType === ElementType.Tempo"
              class="other-neume"
              :neume="nextElement as TempoElement"
              :pageSetup="pageSetup"
              :style="nextElementStyle"
            />
          </template>
        </div>
        <div class="bottom-pane">
          <div class="form-group">
            <label />
            <span class="table-header">{{ $t('dialog:common.left') }}</span>
            <span class="table-header">{{ $t('dialog:common.top') }}</span>
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.accidental') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.accidentalOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.accidentalOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.accidental2') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.secondaryAccidentalOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.secondaryAccidentalOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.accidental3') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.tertiaryAccidentalOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.tertiaryAccidentalOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.barLineL') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureBarLeftOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureBarLeftOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.barLineR') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureBarRightOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureBarRightOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.fthora') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.fthoraOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.fthoraOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.fthora2') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.secondaryFthoraOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.secondaryFthoraOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.fthora3') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.tertiaryFthoraOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.tertiaryFthoraOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.gorgon') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.gorgonNeumeOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.gorgonNeumeOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.gorgon2') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.secondaryGorgonNeumeOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.secondaryGorgonNeumeOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.ison') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.isonOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.isonOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.koronis') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.koronisOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.koronisOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.measureNo') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureNumberOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureNumberOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.note') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.noteIndicatorOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.noteIndicatorOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.cross') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.stavrosOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.stavrosOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.tie') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.tieOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.tieOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.time') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.timeNeumeOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.timeNeumeOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.vareia') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.vareiaOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.vareiaOffsetY"
            />
          </div>
          <div class="form-group">
            <label>{{ $t('dialog:neumePositioning.quality') }}</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.vocalExpressionNeumeOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.vocalExpressionNeumeOffsetY"
            />
          </div>
        </div>
      </div>
      <div class="button-container">
        <button class="ok-btn" @click="update">
          {{ $t('dialog:common.update') }}
        </button>
        <button class="cancel-btn" @click="$emit('close')">
          {{ $t('dialog:common.cancel') }}
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { defineComponent, PropType, StyleValue } from 'vue';

import DragHandle from '@/components/DragHandle.vue';
import InputUnit, { UnitOfMeasure } from '@/components/InputUnit.vue';
import ModalDialog from '@/components/ModalDialog.vue';
import NeumeBoxMartyria from '@/components/NeumeBoxMartyria.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import NeumeBoxTempo from '@/components/NeumeBoxTempo.vue';
import {
  ElementType,
  MartyriaElement,
  NoteElement,
  ScoreElement,
  ScoreElementOffset,
  TempoElement,
} from '@/models/Element';
import { TimeNeume, VocalExpressionNeume } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { TextMeasurementService } from '@/services/TextMeasurementService';

export default defineComponent({
  components: {
    ModalDialog,
    NeumeBoxSyllable,
    NeumeBoxMartyria,
    NeumeBoxTempo,
    InputUnit,
    DragHandle,
  },
  emits: ['close', 'update'],
  props: {
    element: {
      type: Object as PropType<NoteElement>,
      required: true,
    },
    previousElement: Object as PropType<ScoreElement>,
    nextElement: Object as PropType<ScoreElement>,
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
  },

  data() {
    return {
      TimeNeume,
      VocalExpressionNeume,
      ElementType,
      TempoElement,
      MartyriaElement,

      form: new NoteElement(),
      stepSize: 0.01,
      min: -10,
      max: 10,
      precision: 2,
      unit: 'unitless' as UnitOfMeasure,

      paneContainerWidthPx: 420,

      zoom: 2,
    };
  },

  computed: {
    hasVocalExpressionNeume() {
      return this.form.vocalExpressionNeume != null;
    },

    hasTimeNeume() {
      return this.form.timeNeume != null;
    },

    hasGorgonNeume() {
      return this.form.gorgonNeume != null;
    },

    hasSecondaryGorgonNeume() {
      return this.form.secondaryGorgonNeume != null;
    },

    hasFthora() {
      return this.form.fthora != null;
    },

    hasSecondaryFthora() {
      return this.form.secondaryFthora != null;
    },

    hasTertiaryFthora() {
      return this.form.tertiaryFthora != null;
    },

    hasAccidental() {
      return this.form.accidental != null;
    },

    hasSecondaryAccidental() {
      return this.form.secondaryAccidental != null;
    },

    hasTertiaryAccidental() {
      return this.form.tertiaryAccidental != null;
    },

    hasMeasureBarLeft() {
      return this.form.measureBarLeft != null;
    },

    hasMeasureBarRight() {
      return this.form.measureBarRight != null;
    },

    hasMeasureNumber() {
      return this.form.measureNumber != null;
    },

    hasIson() {
      return this.form.ison != null;
    },

    hasTie() {
      return this.form.tie != null;
    },

    centerLeft() {
      return this.paneContainerWidthPx / 2;
    },

    previousElementStyle() {
      return {
        left: `calc(${this.centerLeft}px - ${
          this.element.x - this.previousElement!.x
        }px * var(--zoom, 1))`,
      } as StyleValue;
    },

    nextElementStyle() {
      return {
        left: `calc(${this.centerLeft}px + ${
          this.nextElement!.x - this.element.x
        }px * var(--zoom, 1))`,
      } as StyleValue;
    },

    mainStyle() {
      return {
        left: this.centerLeft + 'px',
      } as StyleValue;
    },

    topPaneStyle() {
      const neumeHeight = TextMeasurementService.getFontHeight(
        `${this.pageSetup.neumeDefaultFontSize}px ${this.pageSetup.neumeDefaultFontFamily}`,
      );

      return {
        height: neumeHeight * this.zoom + 'px',
      } as StyleValue;
    },

    paneContainerStyle() {
      return {
        width: this.paneContainerWidthPx + 'px',
      } as StyleValue;
    },
  },

  created() {
    Object.assign(this.form, this.element);

    window.addEventListener('keydown', this.onKeyDown);
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  },

  methods: {
    onKeyDown(event: KeyboardEvent) {
      if (event.code === 'Escape') {
        this.$emit('close');
      }
    },

    update() {
      this.$emit('update', this.form);
      this.$emit('close');
    },

    updateAccidentalOffset(args: ScoreElementOffset) {
      this.form.accidentalOffsetX = args.x;
      this.form.accidentalOffsetY = args.y;
    },

    updateSecondaryAccidentalOffset(args: ScoreElementOffset) {
      this.form.secondaryAccidentalOffsetX = args.x;
      this.form.secondaryAccidentalOffsetY = args.y;
    },

    updateTertiaryAccidentalOffset(args: ScoreElementOffset) {
      this.form.tertiaryAccidentalOffsetX = args.x;
      this.form.tertiaryAccidentalOffsetY = args.y;
    },

    updateMeasureBarLeftOffset(args: ScoreElementOffset) {
      this.form.measureBarLeftOffsetX = args.x;
      this.form.measureBarLeftOffsetY = args.y;
    },

    updateMeasureBarRightOffset(args: ScoreElementOffset) {
      this.form.measureBarRightOffsetX = args.x;
      this.form.measureBarRightOffsetY = args.y;
    },

    updateFthoraOffset(args: ScoreElementOffset) {
      this.form.fthoraOffsetX = args.x;
      this.form.fthoraOffsetY = args.y;
    },

    updateSecondaryFthoraOffset(args: ScoreElementOffset) {
      this.form.secondaryFthoraOffsetX = args.x;
      this.form.secondaryFthoraOffsetY = args.y;
    },

    updateTertiaryFthoraOffset(args: ScoreElementOffset) {
      this.form.tertiaryFthoraOffsetX = args.x;
      this.form.tertiaryFthoraOffsetY = args.y;
    },

    updateGorgonOffset(args: ScoreElementOffset) {
      this.form.gorgonNeumeOffsetX = args.x;
      this.form.gorgonNeumeOffsetY = args.y;
    },

    updateGorgon2Offset(args: ScoreElementOffset) {
      this.form.secondaryGorgonNeumeOffsetX = args.x;
      this.form.secondaryGorgonNeumeOffsetY = args.y;
    },

    updateIsonOffset(args: ScoreElementOffset) {
      this.form.isonOffsetX = args.x;
      this.form.isonOffsetY = args.y;
    },

    updateKoronisOffset(args: ScoreElementOffset) {
      this.form.koronisOffsetX = args.x;
      this.form.koronisOffsetY = args.y;
    },

    updateMeasureNumberOffset(args: ScoreElementOffset) {
      this.form.measureNumberOffsetX = args.x;
      this.form.measureNumberOffsetY = args.y;
    },

    updateNoteIndicatorOffset(args: ScoreElementOffset) {
      this.form.noteIndicatorOffsetX = args.x;
      this.form.noteIndicatorOffsetY = args.y;
    },

    updateStavrosOffset(args: ScoreElementOffset) {
      this.form.stavrosOffsetX = args.x;
      this.form.stavrosOffsetY = args.y;
    },

    updateTieOffset(args: ScoreElementOffset) {
      this.form.tieOffsetX = args.x;
      this.form.tieOffsetY = args.y;
    },

    updateTimeOffset(args: ScoreElementOffset) {
      this.form.timeNeumeOffsetX = args.x;
      this.form.timeNeumeOffsetY = args.y;
    },

    updateVareiaOffset(args: ScoreElementOffset) {
      this.form.vareiaOffsetX = args.x;
      this.form.vareiaOffsetY = args.y;
    },

    updateQualityOffset(args: ScoreElementOffset) {
      this.form.vocalExpressionNeumeOffsetX = args.x;
      this.form.vocalExpressionNeumeOffsetY = args.y;
    },
  },
});
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
