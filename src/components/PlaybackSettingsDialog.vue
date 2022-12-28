<template>
  <ModalDialog>
    <div class="container">
      <div class="header">Playback Settings</div>
      <div class="pane-container">
        <div class="form-group">
          <label>Detune</label>
          <input
            type="number"
            class="detune"
            min="-2400"
            max="2400"
            step="100"
            :value="tuning"
            @change="onTuningChanged($event.target.value)"
          />
          <span class="unit-label">cents</span>
          <span class="label-g3">Di = G3 = {{ options.frequencyDi }} Hz </span>
        </div>

        <div class="separator" />

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
        </div>
      </div>
      <div class="button-container">
        <button class="cancel-btn" @click="$emit('close')">Close</button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ModalDialog from '@/components/ModalDialog.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import InputUnit from '@/components/InputUnit.vue';
import { PlaybackOptions } from '@/services/audio/AudioService';

const FREQUENCY_G3 = 196;

@Component({
  components: { ModalDialog, NeumeBoxSyllable, InputUnit },
})
export default class SyllablePositioningDialog extends Vue {
  @Prop() options!: PlaybackOptions;

  tuning: number = 0;

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
      this.$emit('close');
    }
  }

  onTuningChanged(value: number) {
    this.tuning = Math.max(-2400, value);
    this.tuning = Math.min(2400, this.tuning);
    this.tuning = Math.round(this.tuning);

    this.options.frequencyDi = +(
      FREQUENCY_G3 * Math.pow(2, this.tuning / 1200)
    ).toFixed(1);
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.pane-container {
  display: flex;
  flex-direction: column;
  width: 420px;
  margin-bottom: 1.5rem;
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
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

.form-group .table-header {
  display: inline-block;
  width: 3.5rem;
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

.label-g3 {
  margin-left: 2rem;
}

.separator {
  border-bottom: 1px solid lightgray;
  margin-bottom: 1rem;
  width: 100%;
}
</style>
