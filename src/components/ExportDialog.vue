<template>
  <ModalDialog>
    <div class="container">
      <div class="header">{{ $t('dialog:export.root') }}</div>
      <div class="pane-container">
        <div class="vertical-spacer" />
        <div class="form-group row">
          <label class="medium">{{ $t('dialog:export.format') }}</label>
          <select v-model="format">
            <!-- <option :value="ExportFormat.HTML">HTML file</option>
            <option :value="ExportFormat.PDF">PDF file</option> -->
            <option :value="ExportFormat.PNG">
              {{ $t('dialog:export.pngImages') }}
            </option>
            <option :value="ExportFormat.MusicXml">
              {{ $t('dialog:export.musicXml') }}
            </option>
            <option :value="ExportFormat.Latex">
              {{ $t('dialog:export.latex') }}
            </option>
            <!-- <option :value="ExportFormat.SVG">SVG images</option> -->
          </select>
        </div>
        <template v-if="exportFormatIsImage">
          <div class="form-group row" v-if="format === ExportFormat.PNG">
            <label class="medium">{{ $t('dialog:export.resolution') }}</label>
            <InputUnit
              unit="unitless"
              class="dpi"
              :min="32"
              :max="999"
              :step="1"
              :round="round"
              v-model="dpi"
            />
            <span class="unit-label">{{ $t('dialog:export.dpi') }}</span>
          </div>
          <div class="form-group row" v-if="format === ExportFormat.PNG">
            <input
              id="export-dialog-transparent-bg"
              type="checkbox"
              v-model="transparentBackground"
            />
            <label for="export-dialog-transparent-bg">{{
              $t('dialog:export.transparentBackground')
            }}</label>
          </div>
          <div class="form-group row">
            {{ $t('dialog:export.separateImageFile') }}
          </div>
          <div class="separator"></div>
          <div class="form-group row">
            <input
              id="export-dialog-open-folder"
              type="checkbox"
              v-model="openFolder"
            />
            <label for="export-dialog-open-folder">{{
              $t('dialog:export.openDestinationFolderAfterExport')
            }}</label>
          </div>
        </template>
        <template v-if="format === ExportFormat.MusicXml">
          <div class="form-group row">
            <input
              id="export-dialog-calculate-time-signatures"
              type="checkbox"
              v-model="musicXmlOptions.calculateTimeSignatures"
            />
            <label for="export-dialog-calculate-time-signatures">{{
              $t('dialog:export.calculateTimeSignatures')
            }}</label>
          </div>
          <div class="form-group row">
            <input
              id="export-dialog-display-time-signatures"
              type="checkbox"
              v-model="musicXmlOptions.displayTimeSignatures"
            />
            <label for="export-dialog-display-time-signatures">{{
              $t('dialog:export.displayTimeSignatures')
            }}</label>
          </div>
          <div class="form-group row">
            <input
              id="export-dialog-display-measure-subdivisions"
              type="checkbox"
              v-model="musicXmlOptions.displayMeasureSubdivisions"
            />
            <label for="export-dialog-display-time-signatures">{{
              $t('dialog:export.displayMeasureSubdivisions')
            }}</label>
          </div>

          <div class="separator"></div>

          <div class="form-group row">
            <input
              id="export-dialog-open-folder"
              type="checkbox"
              v-model="openFolder"
            />
            <label for="export-dialog-open-folder">{{
              $t('dialog:export.openDestinationFolderAfterExport')
            }}</label>
          </div>
        </template>
        <template v-if="format === ExportFormat.Latex">
          <div class="form-group row">
            <input
              id="export-dialog-include-mode-keys"
              type="checkbox"
              v-model="latexOptions.includeModeKeys"
            />
            <label for="export-dialog-include-mode-keys">{{
              $t('dialog:export.includeModeKeys')
            }}</label>
          </div>
          <div class="form-group row">
            <input
              id="export-dialog-include-text-boxes"
              type="checkbox"
              v-model="latexOptions.includeTextBoxes"
            />
            <label for="export-dialog-include-text-boxes">{{
              $t('dialog:export.includeTextBoxes')
            }}</label>
          </div>
        </template>
      </div>
      <div class="button-container">
        <template v-if="loading">
          <button class="cancel-btn" disabled>
            {{ $t('dialog:export.exporting') }}
          </button>
        </template>
        <template v-else>
          <button class="ok-btn" @click="doExport">
            {{ $t('dialog:export.export') }}
          </button>
          <button class="cancel-btn" @click="close">
            {{ $t('dialog:common.cancel') }}
          </button>
        </template>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import InputUnit from '@/components/InputUnit.vue';
import ModalDialog from '@/components/ModalDialog.vue';
import { LatexExporterOptions } from '@/services/integration/LatexExporter';
import { MusicXmlExporterOptions } from '@/services/integration/MusicXmlExporter';

export enum ExportFormat {
  HTML = 'HTML',
  PDF = 'PDF',
  PNG = 'PNG',
  SVG = 'SVG',
  MusicXml = 'MusicXml',
  Latex = 'Latex',
}

export interface ExportAsPngSettings {
  dpi: number;
  openFolder: boolean;
  transparentBackground: boolean;
}

export interface ExportAsMusicXmlSettings {
  options: MusicXmlExporterOptions;
  openFolder: boolean;
  compressed: boolean;
}

export interface ExportAsLatexSettings {
  options: LatexExporterOptions;
}

@Component({
  components: { ModalDialog, InputUnit },
  emits: [
    'close',
    'exportAsLatex',
    'exportAsMusicXml',
    'exportAsPng',
    'exportAsSvg',
  ],
})
export default class ExportDialog extends Vue {
  @Prop() defaultFormat: ExportFormat | undefined;
  @Prop() loading!: boolean;

  format: ExportFormat = ExportFormat.PNG;
  dpi: number = 300;
  transparentBackground: boolean = false;
  openFolder: boolean = true;

  musicXmlOptions = new MusicXmlExporterOptions();
  latexOptions = new LatexExporterOptions();

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

  beforeUnmount() {
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
    } else if (this.format === ExportFormat.MusicXml) {
      this.$emit('exportAsMusicXml', {
        options: this.musicXmlOptions,
        compressed: false,
        openFolder: this.openFolder,
      } as ExportAsMusicXmlSettings);
    } else if (this.format === ExportFormat.Latex) {
      this.$emit('exportAsLatex', {
        options: this.latexOptions,
      } as ExportAsLatexSettings);
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
