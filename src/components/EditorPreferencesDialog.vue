<template>
  <ModalDialog>
    <div class="container">
      <div class="header">{{ $t('dialog.preferences.root') }}</div>
      <div class="pane-container">
        <div class="subheader">
          {{ $t('dialog.preferences.tempoDefaults') }}
        </div>
        <div v-for="tempo in tempoSigns" :key="tempo" class="form-group row">
          <Neume
            class="tempo-neume"
            :neume="tempo"
            :fontFamily="pageSetup.neumeDefaultFontFamily"
          />
          <InputBpm
            :modelValue="form.tempoDefaults[tempo]"
            @update:modelValue="onTempoChanged(tempo, $event)"
          />
          <span class="unit-label">{{ $t('dialog.preferences.bpm') }}</span>
        </div>
      </div>
      <div class="button-container">
        <button class="ok-btn" @click="$emit('update', form)">
          {{ $t('dialog.preferences.update') }}
        </button>
        <button class="reset-btn neutral-btn" @click="resetToSystemDefaults">
          {{ $t('dialog.preferences.useSystemDefault') }}
        </button>
        <button class="cancel-btn" @click="$emit('close')">
          {{ $t('dialog.preferences.cancel') }}
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ModalDialog from '@/components/ModalDialog.vue';
import Neume from '@/components/Neume.vue';
import { EditorPreferences } from '@/models/EditorPreferences';
import { TempoSign } from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';

import InputBpm from './InputBpm.vue';

@Component({
  components: { ModalDialog, Neume, InputBpm },
  emits: ['close', 'update'],
})
export default class PreferencesDialog extends Vue {
  @Prop() options!: EditorPreferences;
  @Prop() pageSetup!: PageSetup;

  form: EditorPreferences = new EditorPreferences();

  tempoSigns = [
    TempoSign.VerySlow,
    TempoSign.Slower,
    TempoSign.Slow,
    TempoSign.Moderate,
    TempoSign.Medium,
    TempoSign.Quick,
    TempoSign.Quicker,
    TempoSign.VeryQuick,
  ];

  mounted() {
    this.form = JSON.parse(JSON.stringify(this.options));

    window.addEventListener('keydown', this.onKeyDown);
  }

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.$emit('close');
    }
  }

  onTempoChanged(neume: TempoSign, bpm: number) {
    this.form.tempoDefaults[neume] = bpm;
  }

  resetToSystemDefaults() {
    this.form = new EditorPreferences();
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
  width: 420px;
  margin-bottom: 1.5rem;
  margin-top: 1.5rem;
  overflow: auto;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group.row {
  display: flex;
  align-items: center;
}

.form-group label {
  display: inline-block;
  font-weight: bold;
}

.form-group input {
  margin-right: 0.5rem;
}

.header {
  font-size: 1.5rem;
  text-align: center;
}

.button-container {
  display: flex;
  justify-content: center;
}

.ok-btn,
.reset-btn {
  margin-right: 2rem;
}

.separator {
  border-bottom: 1px solid lightgray;
  margin-bottom: 1rem;
  width: 100%;
}

.subheader {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.tempo-neume {
  font-size: 1.25rem;
  top: -8px;
  width: 1.5rem;
}
</style>
