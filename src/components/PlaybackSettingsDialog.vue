<!-- eslint-disable vue/no-mutating-props -->
<template>
  <ModalDialog>
    <div class="container">
      <div class="header">{{ $t('dialog:playbackSettings.root') }}</div>
      <div class="pane-container">
        <div class="form-group row">
          <label>{{ $t('dialog:playbackSettings.detune') }}</label>
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
            {{ $t('dialog:playbackSettings.test') }}
          </button>
        </div>

        <div class="form-group subheader">
          {{ $t('dialog:playbackSettings.volume') }}
        </div>
        <div class="form-group row">
          <span class="volume-label">{{
            $t('dialog:playbackSettings.melody')
          }}</span>
          <input
            type="range"
            class="volume-slider"
            min="0"
            max="100"
            v-model="volumeMelody"
          />
          <span class="db-label">{{ options.volumeMelody.toFixed(1) }} dB</span>
        </div>

        <div class="form-group row">
          <span class="volume-label">{{
            $t('dialog:playbackSettings.ison')
          }}</span>
          <input
            type="range"
            class="volume-slider"
            min="0"
            max="100"
            v-model="volumeIson"
          />
          <span class="db-label">{{ options.volumeIson.toFixed(1) }} dB</span>
        </div>

        <div class="separator" />

        <div class="form-group">
          <input
            id="playback-settings-dialog-diatonic-zo"
            type="checkbox"
            v-model="options.useDefaultAttractionZo"
          />
          <label for="playback-settings-dialog-diatonic-zo">{{
            $t('dialog:playbackSettings.diatonicZoAttraction')
          }}</label>
          <p>
            {{ $t('dialog:playbackSettings.diatonicZoAttractionDescription') }}
          </p>
          {{ $t('dialog:playbackSettings.moria') }}
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
            {{ $t('dialog:playbackSettings.reset') }}
          </button>
        </div>

        <div class="form-group">
          <input
            id="playback-settings-dialog-legetos"
            type="checkbox"
            v-model="options.useLegetos"
          />
          <label for="playback-settings-dialog-legetos">{{
            $t('dialog:playbackSettings.classicLegetos')
          }}</label>
          <p>
            {{ $t('dialog:playbackSettings.classicLegetosDescription') }}
          </p>
        </div>

        <div class="separator" />

        <div class="row">
          <span class="subheader">{{
            $t('dialog:playbackSettings.intervals')
          }}</span
          ><button class="btnResetIntervals" @click="resetIntervals">
            {{ $t('dialog:playbackSettings.reset') }}
          </button>
        </div>

        <div class="vertical-spacer" />

        <div class="form-group row">
          <span class="scale-name">{{
            $t('dialog:playbackSettings.diatonic')
          }}</span>
          <div
            class="row"
            v-for="(note, index) in ['Ni', 'Pa', 'Vou']"
            :key="index"
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
            $t('dialog:playbackSettings.legetos')
          }}</span>
          <div
            class="row"
            v-for="(note, index) in ['Pa', 'Vou', 'Ga']"
            :key="index"
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
            $t('dialog:playbackSettings.softChromatic')
          }}</span>
          <div
            class="row"
            v-for="(note, index) in ['Ni', 'Pa', 'Vou']"
            :key="index"
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
            $t('dialog:playbackSettings.hardChromatic')
          }}</span>
          <div
            class="row"
            v-for="(note, index) in ['Pa', 'Vou', 'Ga']"
            :key="index"
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
            $t('dialog:playbackSettings.zygos')
          }}</span>
          <div
            class="row"
            v-for="(note, index) in ['Ni', 'Pa', 'Vou', 'Ga']"
            :key="index"
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
            $t('dialog:playbackSettings.zygosLegetos')
          }}</span>
          <div
            class="row"
            v-for="(note, index) in ['Ni', 'Pa', 'Vou', 'Ga']"
            :key="index"
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
            $t('dialog:playbackSettings.kliton')
          }}</span>
          <div
            class="row"
            v-for="(note, index) in ['Pa', 'Vou', 'Ga']"
            :key="index"
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
            $t('dialog:playbackSettings.spathi')
          }}</span>
          <div
            class="row"
            v-for="(note, index) in ['Ga', 'Di', 'Ke', 'Zo']"
            :key="index"
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
            $t('dialog:playbackSettings.alterationMultipliersChrysanthine')
          }}</span
          ><button
            class="btnResetIntervals"
            @click="resetAlterationMultipliers"
          >
            {{ $t('dialog:playbackSettings.reset') }}
          </button>
        </div>

        <div class="vertical-spacer" />

        <div class="form-group row">
          <span class="alteration-name">{{
            $t('dialog:playbackSettings.zeroCrossbeams')
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
            $t('dialog:playbackSettings.oneCrossbeam')
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
            $t('dialog:playbackSettings.twoCrossbeams')
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
            $t('dialog:playbackSettings.alterationMoria1881Committee')
          }}</span
          ><button class="btnResetIntervals" @click="resetAlterationMoria">
            Reset
          </button>
        </div>

        <div class="vertical-spacer" />
        <div class="form-group row">
          <span class="alteration-name">{{
            $t('dialog:playbackSettings.sharpWithZeroCrossbeams')
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
            $t('dialog:playbackSettings.sharpWithOneCrossbeam')
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
            $t('dialog:playbackSettings.sharpWithTwoCrossbeams')
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
            $t('dialog:playbackSettings.sharpWithThreeCrossbeams')
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
            $t('dialog:playbackSettings.flatWithZeroCrossbeams')
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
            $t('dialog:playbackSettings.flatWithOneCrossbeam')
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
            $t('dialog:playbackSettings.flatWithTwoCrossbeams')
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
            $t('dialog:playbackSettings.flatWithThreeCrossbeams')
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
          {{ $t('dialog:playbackSettings.close') }}
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
/* eslint-disable vue/no-mutating-props */
// TODO don't rely on this eslint-disable line
// Instead, make a copy of the options prop (a la Page Setup Dialog)
// and have TheEditor update the actual options.
import { defineComponent, PropType } from 'vue';

import ModalDialog from '@/components/ModalDialog.vue';
import { Accidental } from '@/models/Neumes';
import { PlaybackOptions } from '@/services/audio/PlaybackService';

const FREQUENCY_G3 = 196;

export default defineComponent({
  components: { ModalDialog },
  emits: ['close', 'play-test-tone'],
  props: {
    options: {
      type: Object as PropType<PlaybackOptions>,
      required: true,
    },
  },

  data() {
    return {
      Accidental,

      tuning: 0,

      error: null as string | null,
    };
  },

  computed: {
    volumeIson: {
      get() {
        return 100 * Math.pow(10, this.options.volumeIson / 20);
      },
      set(value: number) {
        this.options.volumeIson = 20 * Math.log10(value / 100);
      },
    },

    volumeMelody: {
      get() {
        return 100 * Math.pow(10, this.options.volumeMelody / 20);
      },
      set(value: number) {
        this.options.volumeMelody = 20 * Math.log10(value / 100);
      },
    },
  },

  mounted() {
    window.addEventListener('keydown', this.onKeyDown);

    this.tuning = Math.round(
      1200 * Math.log2(this.options.frequencyDi / FREQUENCY_G3),
    );
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  },

  methods: {
    onKeyDown(event: KeyboardEvent) {
      if (event.code === 'Escape') {
        this.close();
      }
    },

    onIntervalChanged(intervals: number[], index: number, value: number) {
      value = Math.max(1, value);
      value = Math.min(27, value);
      value = Math.round(value);

      intervals[index] = value;

      this.validateIntervals();

      this.$forceUpdate();
    },

    validateIntervals() {
      this.error = null;

      if (!this.validateTetrachord(this.options.diatonicIntervals)) {
        this.error = 'The diatonic intervals do not sum to 30.';
      }

      if (!this.validateTetrachord(this.options.softChromaticIntervals)) {
        this.error = 'The soft chromatic intervals do not sum to 30.';
      }

      if (!this.validateTetrachord(this.options.hardChromaticIntervals)) {
        this.error = 'The hard chromatic intervals do not sum to 30.';
      }

      if (!this.validateTetrachord(this.options.legetosIntervals)) {
        this.error = 'The legetos intervals do not sum to 30.';
      }
    },

    validateTetrachord(intervals: number[]) {
      let sum = 0;

      intervals.map((x) => (sum += x));

      return sum === 30;
    },

    resetIntervals() {
      this.options.diatonicIntervals = [12, 10, 8];
      this.options.hardChromaticIntervals = [6, 20, 4];
      this.options.softChromaticIntervals = [8, 14, 8];
      this.options.legetosIntervals = [8, 10, 12];
      this.options.zygosIntervals = [18, 4, 16, 4];
      this.options.zygosLegetosIntervals = [18, 4, 20, 4];
      this.options.spathiIntervals = [20, 4, 4, 14];
      this.options.klitonIntervals = [14, 12, 4];
    },

    resetAlterationMultipliers() {
      this.options.alterationMultipliers = [0.5, 0.25, 0.75];
    },

    resetAlterationMoria() {
      this.options.alterationMoriaMap = {
        [Accidental.Flat_2_Right]: -2,
        [Accidental.Flat_4_Right]: -4,
        [Accidental.Flat_6_Right]: -6,
        [Accidental.Flat_8_Right]: -8,
        [Accidental.Sharp_2_Left]: 2,
        [Accidental.Sharp_4_Left]: 4,
        [Accidental.Sharp_6_Left]: 6,
        [Accidental.Sharp_8_Left]: 8,
      };
    },

    resetDefaultAttractionZoMoria() {
      this.options.defaultAttractionZoMoria = -4;
    },

    onDiesisChanged(neume: Accidental, moria: number) {
      moria = Math.round(moria);

      moria = Math.max(0, moria);
      moria = Math.min(72, moria);

      this.options.alterationMoriaMap[neume] = moria;

      this.$forceUpdate();
    },

    onYfesisChanged(neume: Accidental, moria: number) {
      moria = Math.round(moria);

      moria = Math.max(-72, moria);
      moria = Math.min(0, moria);

      this.options.alterationMoriaMap[neume] = moria;

      this.$forceUpdate();
    },

    onDefaultAttractionZoMoriaChanged(value: number) {
      value = Math.max(-72, value);
      value = Math.min(0, value);
      value = Math.round(value);

      this.options.defaultAttractionZoMoria = value;

      this.$forceUpdate();
    },

    onTuningChanged(value: number) {
      this.tuning = Math.max(-2400, value);
      this.tuning = Math.min(2400, this.tuning);
      this.tuning = Math.round(this.tuning);
      this.options.frequencyDi = +(
        FREQUENCY_G3 * Math.pow(2, this.tuning / 1200)
      ).toFixed(1);

      this.$forceUpdate();
    },

    onAlterationMultiplierChanged(index: number, multiplier: number) {
      multiplier = Math.max(0, multiplier);
      multiplier = Math.min(1, multiplier);

      this.options.alterationMultipliers[index] = multiplier;

      this.$forceUpdate();
    },

    close() {
      this.$emit('close');
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
