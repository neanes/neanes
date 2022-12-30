<template>
  <ModalDialog>
    <div class="container">
      <div class="header">Playback Settings</div>
      <div class="pane-container">
        <div class="form-group row">
          <label>Detune</label>
          <input
            type="number"
            class="detune"
            min="-2400"
            max="2400"
            step="1"
            :value="tuning"
            @change="onTuningChanged($event.target.value)"
          />
          <span class="unit-label">cents</span>
          <span class="label-g3">Di = G3 = {{ options.frequencyDi }} Hz </span>
          <button class="btnTestTone" @click="$emit('play-test-tone')">
            Test
          </button>
        </div>

        <div class="form-group subheader">Volume</div>
        <div class="form-group row">
          <span class="volume-label">Melody</span>
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
          <span class="volume-label">Ison</span>
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
          <label for="playback-settings-dialog-diatonic-zo"
            >Diatonic Zo Attraction</label
          >
          <p>
            If checked, hymns that use the diatonic scale will automatically
            have the note Zo lowered if the melody does not ascend past Zo.
          </p>
          Moria:
          <input
            type="number"
            class="interval"
            min="-72"
            max="72"
            step="1"
            v-model="defaultAttractionZoMoria"
          />
          <button
            class="btnResetDefaultAttractionZoMoria"
            @click="resetDefaultAttractionZoMoria"
          >
            Reset
          </button>
        </div>

        <div class="form-group">
          <input
            id="playback-settings-dialog-legetos"
            type="checkbox"
            v-model="options.useLegetos"
          />
          <label for="playback-settings-dialog-legetos">Classic Legetos</label>
          <p>
            If checked, hymns in the fourth mode with base notes Pa or Vou will
            use the classic legetos scale with Vou lowered.
          </p>
        </div>

        <div class="separator" />

        <div class="row">
          <span class="subheader">Intervals</span
          ><button class="btnResetIntervals" @click="resetIntervals">
            Reset
          </button>
        </div>

        <div class="vertical-spacer" />

        <div class="form-group row">
          <span class="scale-name">Diatonic</span>
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
                  $event.target.value,
                )
              "
            />
          </div>
          <span class="interval-label">Ga</span>
        </div>

        <div v-if="options.useLegetos" class="form-group row">
          <span class="scale-name">Legetos</span>
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
                  $event.target.value,
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">Soft Chromatic</span>
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
                  $event.target.value,
                )
              "
            />
          </div>
          <span class="interval-label">Ga</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">Hard Chromatic</span>
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
                  $event.target.value,
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">Zygos</span>
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
                  $event.target.value,
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div v-if="options.useLegetos" class="form-group row">
          <span class="scale-name">Zygos (Legetos)</span>
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
                  $event.target.value,
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">Kliton</span>
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
                  $event.target.value,
                )
              "
            />
          </div>
          <span class="interval-label">Di</span>
        </div>

        <div class="form-group row">
          <span class="scale-name">Spathi</span>
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
                  $event.target.value,
                )
              "
            />
          </div>
          <span class="interval-label">Ni</span>
        </div>

        <div class="separator" />

        <div class="row">
          <span class="subheader">Alterations</span
          ><button class="btnResetIntervals" @click="resetAlterations">
            Reset
          </button>
        </div>

        <div class="vertical-spacer" />

        <div class="form-group row">
          <span class="alteration-name">General Flat</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="-72"
              max="72"
              step="1"
              v-model="generalFlatMoria"
            />
          </div>
          <span class="interval-label">moria</span>
        </div>

        <div class="form-group row">
          <span class="alteration-name">General Sharp</span>
          <div class="row">
            <input
              type="number"
              class="interval"
              min="-72"
              max="72"
              step="1"
              v-model="generalSharpMoria"
            />
          </div>
          <span class="interval-label">moria</span>
        </div>
      </div>
      <div class="error">{{ error }}</div>
      <div class="button-container">
        <button class="cancel-btn" @click="close">Close</button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ModalDialog from '@/components/ModalDialog.vue';
import { PlaybackOptions } from '@/services/audio/PlaybackService';

const FREQUENCY_G3 = 196;

@Component({
  components: { ModalDialog },
})
export default class PlaybackSettingsDialog extends Vue {
  @Prop() options!: PlaybackOptions;

  tuning: number = 0;

  error: string | null = null;

  get generalSharpMoria() {
    return this.options.generalSharpMoria;
  }

  set generalSharpMoria(value: number) {
    value = Math.max(-72, value);
    value = Math.min(72, value);
    value = Math.round(value);

    this.options.generalSharpMoria = value;
  }

  get generalFlatMoria() {
    return this.options.generalFlatMoria;
  }

  set generalFlatMoria(value: number) {
    value = Math.max(-72, value);
    value = Math.min(72, value);
    value = Math.round(value);

    this.options.generalFlatMoria = value;
  }

  get defaultAttractionZoMoria() {
    return this.options.defaultAttractionZoMoria;
  }

  set defaultAttractionZoMoria(value: number) {
    value = Math.max(-72, value);
    value = Math.min(72, value);
    value = Math.round(value);

    this.options.defaultAttractionZoMoria = value;
  }

  get volumeIson() {
    return 100 * Math.pow(10, this.options.volumeIson / 20);
  }

  set volumeIson(value: number) {
    this.options.volumeIson = 20 * Math.log10(value / 100);
  }

  get volumeMelody() {
    return 100 * Math.pow(10, this.options.volumeMelody / 20);
  }

  set volumeMelody(value: number) {
    this.options.volumeMelody = 20 * Math.log10(value / 100);
  }

  mounted() {
    window.addEventListener('keydown', this.onKeyDown);

    this.tuning = Math.round(
      1200 * Math.log2(this.options.frequencyDi / FREQUENCY_G3),
    );
  }

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.close();
    }
  }

  onIntervalChanged(intervals: number[], index: number, value: number) {
    value = Math.max(1, value);
    value = Math.min(27, value);
    value = Math.round(value);

    intervals[index] = value;

    this.validateIntervals();
  }

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
  }

  validateTetrachord(intervals: number[]) {
    let sum = 0;

    intervals.map((x) => (sum += x));

    return sum === 30;
  }

  resetIntervals() {
    this.options.diatonicIntervals = [12, 10, 8];
    this.options.hardChromaticIntervals = [6, 20, 4];
    this.options.softChromaticIntervals = [8, 14, 8];
  }

  resetAlterations() {
    this.options.generalFlatMoria = -6;
    this.options.generalSharpMoria = 4;
  }

  resetDefaultAttractionZoMoria() {
    this.options.defaultAttractionZoMoria = -4;
  }

  close() {
    this.$emit('close');
  }
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
  width: 520px;
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
  width: 8rem;
}

.interval-label {
  margin: 0 0.5rem;
  width: 3ch;
}

input.interval {
  width: 2rem;
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
