<!-- eslint-disable vue/no-mutating-props -->
<template>
  <ModalDialog>
    <div class="container" :data-render-version="renderVersion">
      <div class="header">
        {{ $t(($) => $.dialog.playbackSettings.root, { ns: 'dialog' }) }}
      </div>
      <div class="pane-container">
        <div class="form-group row">
          <label>{{
            $t(($) => $.dialog.playbackSettings.detune, { ns: 'dialog' })
          }}</label>
          <input
            type="number"
            class="detune"
            min="-2400"
            max="2400"
            step="1"
            :value="tuning"
            @change="
              onTuningChanged(Number(($event.target as HTMLInputElement).value))
            "
          />
          <span class="unit-label">cents</span>
          <span class="label-g3">Di = G3 = {{ options.frequencyDi }} Hz </span>
          <button class="btnTestTone" @click="$emit('play-test-tone')">
            {{ $t(($) => $.dialog.playbackSettings.test, { ns: 'dialog' }) }}
          </button>
        </div>

        <div class="form-group subheader">
          {{ $t(($) => $.dialog.playbackSettings.volume, { ns: 'dialog' }) }}
        </div>
        <div class="form-group row">
          <span class="volume-label">{{
            $t(($) => $.dialog.playbackSettings.melody, { ns: 'dialog' })
          }}</span>
          <input
            v-model="volumeMelody"
            type="range"
            class="volume-slider"
            min="0"
            max="100"
          />
          <span class="db-label">{{ options.volumeMelody.toFixed(1) }} dB</span>
        </div>

        <div class="form-group row">
          <span class="volume-label">{{
            $t(($) => $.dialog.playbackSettings.ison, { ns: 'dialog' })
          }}</span>
          <input
            v-model="volumeIson"
            type="range"
            class="volume-slider"
            min="0"
            max="100"
          />
          <span class="db-label">{{ options.volumeIson.toFixed(1) }} dB</span>
        </div>

        <div class="separator" />

        <div class="form-group">
          <input
            id="playback-settings-dialog-diatonic-zo"
            v-model="options.useDefaultAttractionZo"
            type="checkbox"
          />
          <label for="playback-settings-dialog-diatonic-zo">{{
            $t(($) => $.dialog.playbackSettings.diatonicZoAttraction, {
              ns: 'dialog',
            })
          }}</label>
          <p>
            {{
              $t(
                ($) =>
                  $.dialog.playbackSettings.diatonicZoAttractionDescription,
                {
                  ns: 'dialog',
                },
              )
            }}
          </p>
          {{ $t(($) => $.dialog.playbackSettings.moria, { ns: 'dialog' }) }}
          <input
            type="number"
            class="interval"
            min="-72"
            max="0"
            step="1"
            :value="options.defaultAttractionZoMoria"
            @change="
              onDefaultAttractionZoMoriaChanged(
                Number(($event.target as HTMLInputElement).value),
              )
            "
          />
          <button
            class="btnResetDefaultAttractionZoMoria"
            @click="resetDefaultAttractionZoMoria"
          >
            {{ $t(($) => $.dialog.playbackSettings.reset, { ns: 'dialog' }) }}
          </button>
        </div>

        <div class="form-group">
          <input
            id="playback-settings-dialog-legetos"
            v-model="options.useLegetos"
            type="checkbox"
          />
          <label for="playback-settings-dialog-legetos">{{
            $t(($) => $.dialog.playbackSettings.classicLegetos, {
              ns: 'dialog',
            })
          }}</label>
          <p>
            {{
              $t(($) => $.dialog.playbackSettings.classicLegetosDescription, {
                ns: 'dialog',
              })
            }}
          </p>
        </div>

        <div class="separator" />

        <div class="row">
          <span class="subheader">{{
            $t(($) => $.dialog.playbackSettings.intervals, { ns: 'dialog' })
          }}</span
          ><button class="btnResetIntervals" @click="resetIntervals">
            {{ $t(($) => $.dialog.playbackSettings.reset, { ns: 'dialog' }) }}
          </button>
        </div>

        <div class="vertical-spacer" />

        <div class="form-group row">
          <span class="scale-name">{{
            $t(($) => $.dialog.playbackSettings.diatonic, { ns: 'dialog' })
          }}</span>
          <div
            v-for="(note, index) in ['Ni', 'Pa', 'Vou']"
            :key="index"
            class="row"
          >
            <span class="interval-label">{{ note }}</span>
            <input
              type="number"
              class="interval"
              min="1"
              max="27"
              step="1"
              :value="options.diatonicIntervals[index]"
              @change="
                onIntervalChanged(
                  options.diatonicIntervals,
                  index,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">Ga</span>
        </div>

        <div v-if="options.useLegetos" class="form-group row">
          <span class="scale-name">{{
            $t(($) => $.dialog.playbackSettings.legetos, { ns: 'dialog' })
          }}</span>
          <div
            v-for="(note, index) in ['Pa', 'Vou', 'Ga']"
            :key="index"
            class="row"
          >
            <span class="interval-label">{{ note }}</span>
            <input
              type="number"
              class="interval"
              min="1"
              max="27"
              step="1"
              :value="options.legetosIntervals[index]"
              @change="
                onIntervalChanged(
                  options.legetosIntervals,
                  index,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">{{
            $t(($) => $.dialog.playbackSettings.softChromatic, { ns: 'dialog' })
          }}</span>
          <div
            v-for="(note, index) in ['Ni', 'Pa', 'Vou']"
            :key="index"
            class="row"
          >
            <span class="interval-label">{{ note }}</span>
            <input
              type="number"
              class="interval"
              min="1"
              max="27"
              step="1"
              :value="options.softChromaticIntervals[index]"
              @change="
                onIntervalChanged(
                  options.softChromaticIntervals,
                  index,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">Ga</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">{{
            $t(($) => $.dialog.playbackSettings.hardChromatic, { ns: 'dialog' })
          }}</span>
          <div
            v-for="(note, index) in ['Pa', 'Vou', 'Ga']"
            :key="index"
            class="row"
          >
            <span class="interval-label">{{ note }}</span>
            <input
              type="number"
              class="interval"
              min="1"
              max="27"
              step="1"
              :value="options.hardChromaticIntervals[index]"
              @change="
                onIntervalChanged(
                  options.hardChromaticIntervals,
                  index,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">{{
            $t(($) => $.dialog.playbackSettings.zygos, { ns: 'dialog' })
          }}</span>
          <div
            v-for="(note, index) in ['Ni', 'Pa', 'Vou', 'Ga']"
            :key="index"
            class="row"
          >
            <span class="interval-label">{{ note }}</span>
            <input
              type="number"
              class="interval"
              min="1"
              max="27"
              step="1"
              :value="options.zygosIntervals[index]"
              @change="
                onIntervalChanged(
                  options.zygosIntervals,
                  index,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div v-if="options.useLegetos" class="form-group row">
          <span class="scale-name">{{
            $t(($) => $.dialog.playbackSettings.zygosLegetos, { ns: 'dialog' })
          }}</span>
          <div
            v-for="(note, index) in ['Ni', 'Pa', 'Vou', 'Ga']"
            :key="index"
            class="row"
          >
            <span class="interval-label">{{ note }}</span>
            <input
              type="number"
              class="interval"
              min="1"
              max="27"
              step="1"
              :value="options.zygosLegetosIntervals[index]"
              @change="
                onIntervalChanged(
                  options.zygosLegetosIntervals,
                  index,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">{{
            $t(($) => $.dialog.playbackSettings.kliton, { ns: 'dialog' })
          }}</span>
          <div
            v-for="(note, index) in ['Pa', 'Vou', 'Ga']"
            :key="index"
            class="row"
          >
            <span class="interval-label">{{ note }}</span>
            <input
              type="number"
              class="interval"
              min="1"
              max="27"
              step="1"
              :value="options.klitonIntervals[index]"
              @change="
                onIntervalChanged(
                  options.klitonIntervals,
                  index,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">{{
            $t(($) => $.dialog.playbackSettings.spathi, { ns: 'dialog' })
          }}</span>
          <div
            v-for="(note, index) in ['Ga', 'Di', 'Ke', 'Zo']"
            :key="index"
            class="row"
          >
            <span class="interval-label">{{ note }}</span>
            <input
              type="number"
              class="interval"
              min="1"
              max="27"
              step="1"
              :value="options.spathiIntervals[index]"
              @change="
                onIntervalChanged(
                  options.spathiIntervals,
                  index,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">Ni</span>
        </div>

        <div class="separator" />

        <div class="row">
          <span class="subheader">{{
            $t(
              ($) =>
                $.dialog.playbackSettings.alterationMultipliersChrysanthine,
              {
                ns: 'dialog',
              },
            )
          }}</span
          ><button
            class="btnResetIntervals"
            @click="resetAlterationMultipliers"
          >
            {{ $t(($) => $.dialog.playbackSettings.reset, { ns: 'dialog' }) }}
          </button>
        </div>

        <div class="vertical-spacer" />

        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.zeroCrossbeams, {
              ns: 'dialog',
            })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="0"
              max="1"
              step="0.05"
              :value="options.alterationMultipliers[0]"
              @change="
                onAlterationMultiplierChanged(
                  0,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">&#215;</span>
        </div>
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.oneCrossbeam, { ns: 'dialog' })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="0"
              max="1"
              step="0.05"
              :value="options.alterationMultipliers[1]"
              @change="
                onAlterationMultiplierChanged(
                  1,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">&#215;</span>
        </div>
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.twoCrossbeams, { ns: 'dialog' })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="0"
              max="1"
              step="0.05"
              :value="options.alterationMultipliers[2]"
              @change="
                onAlterationMultiplierChanged(
                  2,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">&#215;</span>
        </div>

        <div class="separator" />

        <div class="row">
          <span class="subheader">{{
            $t(($) => $.dialog.playbackSettings.alterationMoria1881Committee, {
              ns: 'dialog',
            })
          }}</span
          ><button class="btnResetIntervals" @click="resetAlterationMoria">
            Reset
          </button>
        </div>

        <div class="vertical-spacer" />
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.sharpWithZeroCrossbeams, {
              ns: 'dialog',
            })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="0"
              max="72"
              step="1"
              :value="options.alterationMoriaMap[Accidental.Sharp_2_Left]"
              @change="
                onDiesisChanged(
                  Accidental.Sharp_2_Left,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">moria</span>
        </div>
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.sharpWithOneCrossbeam, {
              ns: 'dialog',
            })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="0"
              max="72"
              step="1"
              :value="options.alterationMoriaMap[Accidental.Sharp_4_Left]"
              @change="
                onDiesisChanged(
                  Accidental.Sharp_4_Left,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">moria</span>
        </div>
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.sharpWithTwoCrossbeams, {
              ns: 'dialog',
            })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="0"
              max="72"
              step="1"
              :value="options.alterationMoriaMap[Accidental.Sharp_6_Left]"
              @change="
                onDiesisChanged(
                  Accidental.Sharp_6_Left,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">moria</span>
        </div>
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.sharpWithThreeCrossbeams, {
              ns: 'dialog',
            })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="0"
              max="72"
              step="1"
              :value="options.alterationMoriaMap[Accidental.Sharp_8_Left]"
              @change="
                onDiesisChanged(
                  Accidental.Sharp_8_Left,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">moria</span>
        </div>
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.flatWithZeroCrossbeams, {
              ns: 'dialog',
            })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="-72"
              max="0"
              step="1"
              :value="options.alterationMoriaMap[Accidental.Flat_2_Right]"
              @change="
                onYfesisChanged(
                  Accidental.Flat_2_Right,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">moria</span>
        </div>
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.flatWithOneCrossbeam, {
              ns: 'dialog',
            })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="-72"
              max="0"
              step="1"
              :value="options.alterationMoriaMap[Accidental.Flat_4_Right]"
              @change="
                onYfesisChanged(
                  Accidental.Flat_4_Right,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">moria</span>
        </div>
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.flatWithTwoCrossbeams, {
              ns: 'dialog',
            })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="-72"
              max="0"
              step="1"
              :value="options.alterationMoriaMap[Accidental.Flat_6_Right]"
              @change="
                onYfesisChanged(
                  Accidental.Flat_6_Right,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">moria</span>
        </div>
        <div class="form-group row">
          <span class="alteration-name">{{
            $t(($) => $.dialog.playbackSettings.flatWithThreeCrossbeams, {
              ns: 'dialog',
            })
          }}</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="-72"
              max="0"
              step="1"
              :value="options.alterationMoriaMap[Accidental.Flat_8_Right]"
              @change="
                onYfesisChanged(
                  Accidental.Flat_8_Right,
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <span class="interval-label">moria</span>
        </div>
      </div>
      <div class="error">{{ error }}</div>
      <div class="button-container">
        <button class="cancel-btn" @click="close">
          {{ $t(($) => $.dialog.playbackSettings.close, { ns: 'dialog' }) }}
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
// TODO don't rely on this eslint-disable line
// Instead, make a copy of the options prop (a la Page Setup Dialog)
// and have TheEditor update the actual options.
import { computed, onBeforeUnmount, onMounted, PropType, ref } from 'vue';

import ModalDialog from '@/components/ModalDialog.vue';
import { Accidental } from '@/models/Neumes';
import { PlaybackOptions } from '@/services/audio/PlaybackService';

const FREQUENCY_G3 = 196;

const emit = defineEmits(['close', 'play-test-tone']);
const props = defineProps({
  options: {
    type: Object as PropType<PlaybackOptions>,
    required: true,
  },
});

const tuning = ref(0);
const error = ref<string | null>(null);
const renderVersion = ref(0);

const volumeIson = computed({
  get() {
    return 100 * Math.pow(10, props.options.volumeIson / 20);
  },
  set(value: number) {
    props.options.volumeIson = 20 * Math.log10(value / 100);
  },
});

const volumeMelody = computed({
  get() {
    return 100 * Math.pow(10, props.options.volumeMelody / 20);
  },
  set(value: number) {
    props.options.volumeMelody = 20 * Math.log10(value / 100);
  },
});

onMounted(() => {
  window.addEventListener('keydown', onKeyDown);

  tuning.value = Math.round(
    1200 * Math.log2(props.options.frequencyDi / FREQUENCY_G3),
  );
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});

function onKeyDown(event: KeyboardEvent) {
  if (event.code === 'Escape') {
    close();
  }
}

function onIntervalChanged(intervals: number[], index: number, value: number) {
  value = Math.max(1, value);
  value = Math.min(27, value);
  value = Math.round(value);

  intervals[index] = value;

  validateIntervals();

  refreshPlaybackInputs();
}

function validateIntervals() {
  error.value = null;

  if (!validateTetrachord(props.options.diatonicIntervals)) {
    error.value = 'The diatonic intervals do not sum to 30.';
  }

  if (!validateTetrachord(props.options.softChromaticIntervals)) {
    error.value = 'The soft chromatic intervals do not sum to 30.';
  }

  if (!validateTetrachord(props.options.hardChromaticIntervals)) {
    error.value = 'The hard chromatic intervals do not sum to 30.';
  }

  if (!validateTetrachord(props.options.legetosIntervals)) {
    error.value = 'The legetos intervals do not sum to 30.';
  }
}

function validateTetrachord(intervals: number[]) {
  let sum = 0;

  intervals.map((x) => (sum += x));

  return sum === 30;
}

function resetIntervals() {
  props.options.diatonicIntervals = [12, 10, 8];
  props.options.hardChromaticIntervals = [6, 20, 4];
  props.options.softChromaticIntervals = [8, 14, 8];
  props.options.legetosIntervals = [8, 10, 12];
  props.options.zygosIntervals = [18, 4, 16, 4];
  props.options.zygosLegetosIntervals = [18, 4, 20, 4];
  props.options.spathiIntervals = [20, 4, 4, 14];
  props.options.klitonIntervals = [14, 12, 4];
}

function resetAlterationMultipliers() {
  props.options.alterationMultipliers = [0.5, 0.25, 0.75];
}

function resetAlterationMoria() {
  props.options.alterationMoriaMap = {
    [Accidental.Flat_2_Right]: -2,
    [Accidental.Flat_4_Right]: -4,
    [Accidental.Flat_6_Right]: -6,
    [Accidental.Flat_8_Right]: -8,
    [Accidental.Sharp_2_Left]: 2,
    [Accidental.Sharp_4_Left]: 4,
    [Accidental.Sharp_6_Left]: 6,
    [Accidental.Sharp_8_Left]: 8,
  };
}

function resetDefaultAttractionZoMoria() {
  props.options.defaultAttractionZoMoria = -4;
}

function onDiesisChanged(neume: Accidental, moria: number) {
  moria = Math.round(moria);

  moria = Math.max(0, moria);
  moria = Math.min(72, moria);

  props.options.alterationMoriaMap[neume] = moria;

  refreshPlaybackInputs();
}

function onYfesisChanged(neume: Accidental, moria: number) {
  moria = Math.round(moria);

  moria = Math.max(-72, moria);
  moria = Math.min(0, moria);

  props.options.alterationMoriaMap[neume] = moria;

  refreshPlaybackInputs();
}

function onDefaultAttractionZoMoriaChanged(value: number) {
  value = Math.max(-72, value);
  value = Math.min(0, value);
  value = Math.round(value);

  props.options.defaultAttractionZoMoria = value;

  refreshPlaybackInputs();
}

function onTuningChanged(value: number) {
  tuning.value = Math.max(-2400, value);
  tuning.value = Math.min(2400, tuning.value);
  tuning.value = Math.round(tuning.value);
  props.options.frequencyDi = +(
    FREQUENCY_G3 * Math.pow(2, tuning.value / 1200)
  ).toFixed(1);

  refreshPlaybackInputs();
}

function onAlterationMultiplierChanged(index: number, multiplier: number) {
  multiplier = Math.max(0, multiplier);
  multiplier = Math.min(1, multiplier);

  props.options.alterationMultipliers[index] = multiplier;

  refreshPlaybackInputs();
}

function close() {
  emit('close');
}

function refreshPlaybackInputs() {
  renderVersion.value += 1;
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
  width: 550px;
  margin-bottom: 1.5rem;
  margin-top: 1.5rem;
  overflow: auto;
}

.form-group {
  margin-bottom: 1rem;
}

.row {
  display: flex;
}

.form-group label {
  display: inline-block;
  font-weight: bold;
}

input.detune {
  width: 3.5rem;
  margin-left: 1rem;
  margin-right: 0.5rem;
}

.header {
  font-size: 1.5rem;
  text-align: center;
}

.subheader {
  font-weight: bold;
}

.vertical-spacer {
  margin-bottom: 1rem;
}

.scale-name {
  width: 8rem;
}

.alteration-name {
  width: 16rem;
}

.interval-label {
  margin: 0 0.5rem;
  width: 3ch;
}

input.interval {
  width: 2.5rem;
}

.volume-slider {
  margin: 0 1rem;
}

.volume-label {
  width: 3rem;
}

.button-container {
  display: flex;
  justify-content: center;
}

.ok-btn {
  margin-right: 2rem;
}

.label-g3 {
  margin-left: 2rem;
}

.separator {
  border-bottom: 1px solid lightgray;
  margin-bottom: 1rem;
  width: 100%;
}

.btnTestTone {
  display: inline-block;
  margin-left: auto;
}

.btnResetIntervals {
  display: inline-block;
  margin-left: auto;
}

.btnResetDefaultAttractionZoMoria {
  margin-left: 1rem;
}

.error {
  color: red;
  font-weight: bold;
  text-align: center;
  margin-bottom: 0.5rem;
}
</style>
