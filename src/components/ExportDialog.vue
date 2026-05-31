<template>
  <ModalDialog>
    <div class="container">
      <div class="header">
        {{ $t(($) => $.dialog.export.root, { ns: 'dialog' }) }}
      </div>
      <div class="pane-container">
        <div class="vertical-spacer" />
        <div class="form-group row">
          <label class="medium">{{
            $t(($) => $.dialog.export.format, { ns: 'dialog' })
          }}</label>
          <select v-model="format">
            <!-- <option :value="ExportFormat.HTML">HTML file</option>
            <option :value="ExportFormat.PDF">PDF file</option> -->
            <option :value="ExportFormat.PNG">
              {{ $t(($) => $.dialog.export.pngImages, { ns: 'dialog' }) }}
            </option>
            <option :value="ExportFormat.MusicXml">
              {{ $t(($) => $.dialog.export.musicXml, { ns: 'dialog' }) }}
            </option>
            <option :value="ExportFormat.Latex">
              {{ $t(($) => $.dialog.export.latex, { ns: 'dialog' }) }}
            </option>
            <!-- <option :value="ExportFormat.SVG">SVG images</option> -->
          </select>
        </div>
        <template v-if="exportFormatIsImage">
          <div v-if="format === ExportFormat.PNG" class="form-group row">
            <label class="medium">{{
              $t(($) => $.dialog.export.resolution, { ns: 'dialog' })
            }}</label>
            <InputUnit
              v-model="dpi"
              unit="unitless"
              class="dpi"
              :min="32"
              :max="999"
              :step="1"
              :round="round"
            />
            <span class="unit-label">{{
              $t(($) => $.dialog.export.dpi, { ns: 'dialog' })
            }}</span>
          </div>
          <div v-if="format === ExportFormat.PNG" class="form-group row">
            <input
              id="export-dialog-transparent-bg"
              v-model="transparentBackground"
              type="checkbox"
            />
            <label for="export-dialog-transparent-bg">{{
              $t(($) => $.dialog.export.transparentBackground, { ns: 'dialog' })
            }}</label>
          </div>
          <div class="form-group row">
            {{ $t(($) => $.dialog.export.separateImageFile, { ns: 'dialog' }) }}
          </div>
          <div class="separator"></div>
          <div class="form-group row">
            <input
              id="export-dialog-open-folder"
              v-model="openFolder"
              type="checkbox"
            />
            <label for="export-dialog-open-folder">{{
              $t(($) => $.dialog.export.openDestinationFolderAfterExport, {
                ns: 'dialog',
              })
            }}</label>
          </div>
        </template>
        <template v-if="format === ExportFormat.MusicXml">
          <div class="form-group row">
            <input
              id="export-dialog-calculate-time-signatures"
              v-model="musicXmlOptions.calculateTimeSignatures"
              type="checkbox"
            />
            <label for="export-dialog-calculate-time-signatures">{{
              $t(($) => $.dialog.export.calculateTimeSignatures, {
                ns: 'dialog',
              })
            }}</label>
          </div>
          <div class="form-group row">
            <input
              id="export-dialog-display-time-signatures"
              v-model="musicXmlOptions.displayTimeSignatures"
              type="checkbox"
            />
            <label for="export-dialog-display-time-signatures">{{
              $t(($) => $.dialog.export.displayTimeSignatures, { ns: 'dialog' })
            }}</label>
          </div>
          <div class="form-group row">
            <input
              id="export-dialog-display-measure-subdivisions"
              v-model="musicXmlOptions.displayMeasureSubdivisions"
              type="checkbox"
            />
            <label for="export-dialog-display-measure-subdivisions">{{
              $t(($) => $.dialog.export.displayMeasureSubdivisions, {
                ns: 'dialog',
              })
            }}</label>
          </div>

          <div class="separator"></div>

          <div class="form-group row">
            <input
              id="export-dialog-open-folder"
              v-model="openFolder"
              type="checkbox"
            />
            <label for="export-dialog-open-folder">{{
              $t(($) => $.dialog.export.openDestinationFolderAfterExport, {
                ns: 'dialog',
              })
            }}</label>
          </div>
        </template>
        <template v-if="format === ExportFormat.Latex">
          <div class="form-group row">
            <input
              id="export-dialog-include-mode-keys"
              v-model="latexOptions.includeModeKeys"
              type="checkbox"
            />
            <label for="export-dialog-include-mode-keys">{{
              $t(($) => $.dialog.export.includeModeKeys, { ns: 'dialog' })
            }}</label>
          </div>
          <div class="form-group row">
            <input
              id="export-dialog-include-text-boxes"
              v-model="latexOptions.includeTextBoxes"
              type="checkbox"
            />
            <label for="export-dialog-include-text-boxes">{{
              $t(($) => $.dialog.export.includeTextBoxes, { ns: 'dialog' })
            }}</label>
          </div>
        </template>
      </div>
      <div class="button-container">
        <template v-if="loading">
          <button class="cancel-btn" disabled>
            {{ $t(($) => $.dialog.export.exporting, { ns: 'dialog' }) }}
          </button>
        </template>
        <template v-else>
          <button class="ok-btn" @click="doExport">
            {{ $t(($) => $.dialog.export.export, { ns: 'dialog' }) }}
          </button>
          <button class="cancel-btn" @click="close">
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </button>
        </template>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
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
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, PropType, ref } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import ModalDialog from '@/components/ModalDialog.vue';

const emit = defineEmits([
  'close',
  'exportAsLatex',
  'exportAsMusicXml',
  'exportAsPng',
  'exportAsSvg',
]);
const props = defineProps({
  defaultFormat: {
    type: String as PropType<ExportFormat>,
    required: true,
  },
  loading: {
    type: Boolean,
    required: true,
  },
});

const format = ref(ExportFormat.PNG);
const dpi = ref(300);
const transparentBackground = ref(false);
const openFolder = ref(true);

const musicXmlOptions = ref(new MusicXmlExporterOptions());
const latexOptions = ref(new LatexExporterOptions());

const exportFormatIsImage = computed(() => {
  return format.value === ExportFormat.PNG || format.value === ExportFormat.SVG;
});

onMounted(() => {
  if (props.defaultFormat != null) {
    format.value = props.defaultFormat;
  }

  window.addEventListener('keydown', onKeyDown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});

function onKeyDown(event: KeyboardEvent) {
  if (event.code === 'Escape') {
    close();
  }
}

function round(value: number) {
  return Math.round(value);
}

function doExport() {
  if (format.value === ExportFormat.PNG) {
    emit('exportAsPng', {
      dpi: dpi.value,
      openFolder: openFolder.value,
      transparentBackground: transparentBackground.value,
    } as ExportAsPngSettings);
  } else if (format.value === ExportFormat.SVG) {
    emit('exportAsSvg', openFolder.value);
  } else if (format.value === ExportFormat.MusicXml) {
    emit('exportAsMusicXml', {
      options: musicXmlOptions.value,
      compressed: false,
      openFolder: openFolder.value,
    } as ExportAsMusicXmlSettings);
  } else if (format.value === ExportFormat.Latex) {
    emit('exportAsLatex', {
      options: latexOptions.value,
    } as ExportAsLatexSettings);
  }
}

function close() {
  emit('close');
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
