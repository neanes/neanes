<template>
  <ModalDialog>
    <div class="container">
      <div class="header">Page Setup</div>
      <div class="pane-container">
        <div class="left-pane">
          <div class="subheader">
            Margins <span class="units">(inches)</span>
          </div>
          <div class="form-group">
            <label class="margin-label">Top</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              step="0.1"
              v-model.lazy="topMargin"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Bottom</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              step="0.1"
              v-model.lazy="bottomMargin"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Left</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              step="0.1"
              v-model.lazy="leftMargin"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Right</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              step="0.1"
              v-model.lazy="rightMargin"
            />
          </div>
        </div>
        <div class="right-pane">
          <div class="subheader">Drop Caps</div>
          <div class="form-group">
            <label class="drop-caps-label">Color</label>
            <input
              class="drop-caps-input"
              type="color"
              list="presetDropCapsColors"
              v-model.lazy="form.dropCapDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Size</label>
            <input
              class="drop-caps-input"
              type="number"
              min="4"
              max="100"
              step="1"
              v-model.lazy="dropCapDefaultFontSize"
            />
          </div>

          <div class="form-group">
            <label class="drop-caps-label">Font</label>
            <select
              class="drop-caps-select"
              v-model="form.dropCapDefaultFontFamily"
            >
              <option v-for="family in dropCapFontFamilies" :key="family">
                {{ family }}
              </option>
            </select>
          </div>
          <div class="subheader">Neume Colors</div>
          <div class="form-group">
            <label class="neume-colors-label">Accidentals</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.accidentalDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Fthoras</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.fthoraDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Gorgons</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.gorgonDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Heterons</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.heteronDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Martyrias</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.martyriaDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Measures</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.measureBarDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Tempos</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.tempoDefaultColor"
            />
          </div>
        </div>
      </div>
      <div class="button-container">
        <button class="ok-btn" @click="updatePageSetup">Update</button>
        <button @click="$emit('close')">Cancel</button>
      </div>
      <datalist id="presetDropCapsColors">
        <option>#000000</option>
        <option>#ED0000</option>
        <option>#0000FF</option>
      </datalist>
      <datalist id="presetNeumeColors">
        <option>#000000</option>
        <option>#ED0000</option>
      </datalist>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ModalDialog from '@/components/ModalDialog.vue';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

@Component({
  components: { ModalDialog },
})
export default class PageSetupDialog extends Vue {
  @Prop() pageSetup!: PageSetup;
  private form: PageSetup = new PageSetup();
  private dropCapFontFamilies: string[] = ['Athonite', 'Omega'];

  created() {
    Object.assign(this.form, this.pageSetup);

    window.addEventListener('keydown', this.onKeyDown);
  }

  destroyed() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  get topMargin() {
    return Unit.toInch(this.form!.topMargin);
  }

  set topMargin(value: number) {
    this.form!.topMargin = Math.min(
      Math.max(Unit.fromInch(value), 0),
      this.form!.pageHeight - this.form!.bottomMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get bottomMargin() {
    return Unit.toInch(this.form!.bottomMargin);
  }

  set bottomMargin(value: number) {
    this.form!.bottomMargin = Math.min(
      Math.max(Unit.fromInch(value), 0),
      this.form!.pageHeight - this.form!.topMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get leftMargin() {
    return Unit.toInch(this.form!.leftMargin);
  }

  set leftMargin(value: number) {
    this.form!.leftMargin = Math.min(
      Math.max(Unit.fromInch(value), 0),
      this.form!.pageWidth - this.form!.rightMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get rightMargin() {
    return Unit.toInch(this.form!.rightMargin);
  }

  set rightMargin(value: number) {
    this.form!.rightMargin = Math.min(
      Math.max(Unit.fromInch(value), 0),
      this.form!.pageWidth - this.form!.leftMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  private get dropCapDefaultFontSize() {
    return Unit.toPt(this.form!.dropCapDefaultFontSize);
  }

  private set dropCapDefaultFontSize(value: number) {
    this.form!.dropCapDefaultFontSize = Math.min(
      Math.max(Unit.fromPt(value), Unit.fromPt(4)),
      Unit.fromPt(100),
    );
    this.$forceUpdate();
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.$emit('close');
    }
  }

  updatePageSetup() {
    this.$emit('update', this.form);
    this.$emit('close');
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container {
  font-family: Arial, Helvetica, sans-serif;
}

.pane-container {
  display: flex;
  width: 420px;
  margin-bottom: 1.5rem;
}

.left-pane {
  flex: 1;
  height: 275px;
}

.right-pane {
  flex: 1;
  overflow: auto;
  height: 275px;
}

.header {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.subheader {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.units {
  font-weight: normal;
  color: gray;
}

.form-group {
  margin: 0.5rem 0;
}

.margin-label {
  display: inline-block;
  width: 4rem;
}

.margin-input {
  width: 3.5rem;
}

.left-pane {
  margin-right: 2rem;
}

.drop-caps-label {
  display: inline-block;
  width: 4rem;
}

.drop-caps-input {
  width: 4rem;
}

.drop-caps-select {
  width: auto;
}

.neume-colors-label {
  display: inline-block;
  width: 5.5rem;
}

.neume-colors-input {
  width: 4rem;
}

.button-container {
  display: flex;
  justify-content: center;
}

.ok-btn {
  margin-right: 2rem;
}
</style>
