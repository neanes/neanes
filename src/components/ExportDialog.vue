<template>
  <ModalDialog>
    <div class="container">
      <div class="header">Export</div>
      <div class="pane-container">
        <div class="vertical-spacer" />
        <div class="form-group row">
          <label class="medium">Format</label>
          <select v-model="format">
            <!-- <option :value="ExportFormat.HTML">HTML file</option>
            <option :value="ExportFormat.PDF">PDF file</option> -->
            <option :value="ExportFormat.PNG">PNG images</option>
            <!-- <option :value="ExportFormat.SVG">SVG images</option> -->
          </select>
        </div>
        <div class="form-group row" v-if="format === ExportFormat.PNG">
          <label class="medium">Resolution</label>
          <InputUnit
            unit="unitless"
            class="dpi"
            :min="32"
            :max="999"
            :step="1"
            :round="round"
            v-model="dpi"
          />
          <span class="unit-label">dpi</span>
        </div>
        <div class="form-group row" v-if="format === ExportFormat.PNG">
          <input
            id="export-dialog-transparent-bg"
            type="checkbox"
            v-model="transparentBackground"
          />
          <label for="export-dialog-transparent-bg"
            >Transparent Background</label
          >
        </div>
        <div class="form-group row" v-if="exportFormatIsImage">
          Each page will be exported as a separate image file.
        </div>
        <div class="separator"></div>
        <div class="form-group row" v-if="exportFormatIsImage">
          <input
            id="export-dialog-open-folder"
            type="checkbox"
            v-model="openFolder"
          />
          <label for="export-dialog-open-folder"
            >Open destination folder after export</label
          >
        </div>
      </div>
      <div class="button-container">
        <template v-if="loading">
          <button class="cancel-btn" disabled>Exporting...</button>
        </template>
        <template v-else>
          <button class="ok-btn" @click="doExport">Export</button>
          <button class="cancel-btn" @click="close">Close</button>
        </template>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ModalDialog from '@/components/ModalDialog.vue';
import InputUnit from '@/components/InputUnit.vue';

export enum ExportFormat {
  HTML = 'HTML',
  PDF = 'PDF',
  PNG = 'PNG',
  SVG = 'SVG',
}

export interface ExportAsPngSettings {
  dpi: number;
  openFolder: boolean;
  transparentBackground: boolean;
}

@Component({
  components: { ModalDialog, InputUnit },
})
export default class ExportDialog extends Vue {
  @Prop() defaultFormat: ExportFormat | undefined;
  @Prop() loading!: boolean;

  format: ExportFormat = ExportFormat.PNG;
  dpi: number = 300;
  transparentBackground: boolean = false;
  openFolder: boolean = true;

  ExportFormat = ExportFormat;

  get exportFormatIsImage() {
    return this.format === ExportFormat.PNG || this.format === ExportFormat.SVG;
  }

  mounted() {
    if (this.defaultFormat != null) {
      this.format = this.defaultFormat;
    }

    window.addEventListener('keydown', this.onKeyDown);
  }

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.close();
    }
  }

  round(value: number) {
    return Math.round(value);
  }

  doExport() {
    if (this.format === ExportFormat.PNG) {
      const { dpi, openFolder, transparentBackground } = this;
      this.$emit('exportAsPng', {
        dpi,
        openFolder,
        transparentBackground,
      } as ExportAsPngSettings);
    } else if (this.format === ExportFormat.SVG) {
      this.$emit('exportAsSvg', this.openFolder);
    }
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

label.medium {
  width: 6rem;
}

.form-group input[type='checkbox'] {
  margin-right: 0.5rem;
}

.unit-label {
  margin-left: 0.5rem;
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

.button-container {
  display: flex;
  justify-content: center;
}

.ok-btn {
  margin-right: 2rem;
}

.separator {
  border-bottom: 1px solid lightgray;
  margin-bottom: 1rem;
  width: 100%;
}
</style>
