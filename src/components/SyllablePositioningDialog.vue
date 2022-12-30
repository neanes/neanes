<template>
  <ModalDialog>
    <div class="container">
      <div class="header">Neume Positioning</div>
      <div class="pane-container">
        <div class="top-pane">
          <NeumeBoxSyllable :note="form" :pageSetup="pageSetup" />
        </div>
        <div class="bottom-pane">
          <div class="form-group">
            <label />
            <span class="table-header">Left</span>
            <span class="table-header">Top</span>
          </div>
          <div class="form-group">
            <label>Accidental</label>
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
            <label>Bar Line L</label>
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
            <label>Bar Line R</label>
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
            <label>Fthora</label>
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
            <label>Gorgon</label>
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
            <label>Gorgon 2</label>
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
            <label>Ison</label>
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
            <label>Measure No.</label>
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
            <label>Note</label>
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
            <label>Time</label>
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
            <label>Vareia</label>
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
            <label>Quality</label>
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
        <button class="ok-btn" @click="update">Update</button>
        <button class="cancel-btn" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { NoteElement } from '@/models/Element';
import ModalDialog from '@/components/ModalDialog.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import InputUnit from '@/components/InputUnit.vue';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: { ModalDialog, NeumeBoxSyllable, InputUnit },
})
export default class SyllablePositioningDialog extends Vue {
  @Prop() element!: NoteElement;
  @Prop() pageSetup!: PageSetup;

  form: NoteElement = new NoteElement();
  stepSize: number = 0.01;
  min: number = -10;
  max: number = 10;
  precision: number = 2;
  unit: string = 'pt';

  created() {
    Object.assign(this.form, this.element);

    window.addEventListener('keydown', this.onKeyDown);
  }

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.$emit('close');
    }
  }

  update() {
    this.$emit('update', this.form);
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
  width: 420px;
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
</style>
