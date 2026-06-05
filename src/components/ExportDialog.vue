<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="!loading"
      @escape-key-down="(event) => loading && event.preventDefault()"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.export.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t(($) => $.dialog.export.description, { ns: 'dialog' }) }}
        </DialogDescription>
      </DialogHeader>
      <form id="export-dialog-form" @submit.prevent="submit">
        <FieldGroup>
          <Field>
            <FieldLabel for="export-dialog-format">{{
              $t(($) => $.dialog.export.format, { ns: 'dialog' })
            }}</FieldLabel>
            <Select v-model="format">
              <SelectTrigger id="export-dialog-format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <!-- <SelectItem :value="ExportFormat.HTML">HTML file</SelectItem>
                <SelectItem :value="ExportFormat.PDF">PDF file</SelectItem> -->
                  <SelectItem :value="ExportFormat.PNG">
                    {{ $t(($) => $.dialog.export.pngImages, { ns: 'dialog' }) }}
                  </SelectItem>
                  <SelectItem :value="ExportFormat.MusicXml">
                    {{ $t(($) => $.dialog.export.musicXml, { ns: 'dialog' }) }}
                  </SelectItem>
                  <SelectItem :value="ExportFormat.Latex">
                    {{ $t(($) => $.dialog.export.latex, { ns: 'dialog' }) }}
                  </SelectItem>
                  <!-- <SelectItem :value="ExportFormat.SVG">SVG images</SelectItem> -->
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <template v-if="exportFormatIsImage">
            <FieldSet>
              <FieldLegend>
                {{ $t(($) => $.dialog.export.pngImages, { ns: 'dialog' }) }}
              </FieldLegend>
              <Field
                v-if="format === ExportFormat.PNG"
                orientation="horizontal"
              >
                <FieldLabel for="export-dialog-resolution">{{
                  $t(($) => $.dialog.export.resolution, { ns: 'dialog' })
                }}</FieldLabel>
                <InputUnit
                  id="export-dialog-resolution"
                  v-model="dpi"
                  unit="unitless"
                  :min="32"
                  :max="999"
                  :step="1"
                  :format-options="fraction0FormatOptions"
                />
                <FieldDescription>{{
                  $t(($) => $.dialog.export.dpi, { ns: 'dialog' })
                }}</FieldDescription>
              </Field>
              <Field
                v-if="format === ExportFormat.PNG"
                orientation="horizontal"
              >
                <Checkbox
                  id="export-dialog-transparent-bg"
                  v-model="transparentBackground"
                />
                <FieldLabel for="export-dialog-transparent-bg">
                  {{
                    $t(($) => $.dialog.export.transparentBackground, {
                      ns: 'dialog',
                    })
                  }}
                </FieldLabel>
              </Field>
              <Field>
                <FieldDescription>
                  {{
                    $t(($) => $.dialog.export.separateImageFile, {
                      ns: 'dialog',
                    })
                  }}
                </FieldDescription>
              </Field>
              <FieldSeparator />
              <Field orientation="horizontal">
                <Checkbox id="export-dialog-open-folder" v-model="openFolder" />
                <FieldLabel for="export-dialog-open-folder">
                  {{
                    $t(
                      ($) => $.dialog.export.openDestinationFolderAfterExport,
                      {
                        ns: 'dialog',
                      },
                    )
                  }}
                </FieldLabel>
              </Field>
            </FieldSet>
          </template>
          <template v-if="format === ExportFormat.MusicXml">
            <FieldSet>
              <FieldLegend>
                {{ $t(($) => $.dialog.export.musicXml, { ns: 'dialog' }) }}
              </FieldLegend>
              <Field orientation="horizontal">
                <Checkbox
                  id="export-dialog-calculate-time-signatures"
                  v-model="musicXmlOptions.calculateTimeSignatures"
                />
                <FieldLabel for="export-dialog-calculate-time-signatures">
                  {{
                    $t(($) => $.dialog.export.calculateTimeSignatures, {
                      ns: 'dialog',
                    })
                  }}
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="export-dialog-display-time-signatures"
                  v-model="musicXmlOptions.displayTimeSignatures"
                />
                <FieldLabel for="export-dialog-display-time-signatures">
                  {{
                    $t(($) => $.dialog.export.displayTimeSignatures, {
                      ns: 'dialog',
                    })
                  }}
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="export-dialog-display-measure-subdivisions"
                  v-model="musicXmlOptions.displayMeasureSubdivisions"
                />
                <FieldLabel for="export-dialog-display-measure-subdivisions">
                  {{
                    $t(($) => $.dialog.export.displayMeasureSubdivisions, {
                      ns: 'dialog',
                    })
                  }}
                </FieldLabel>
              </Field>
              <FieldSeparator />
              <Field orientation="horizontal">
                <Checkbox id="export-dialog-open-folder" v-model="openFolder" />
                <FieldLabel for="export-dialog-open-folder">
                  {{
                    $t(
                      ($) => $.dialog.export.openDestinationFolderAfterExport,
                      {
                        ns: 'dialog',
                      },
                    )
                  }}
                </FieldLabel>
              </Field>
            </FieldSet>
          </template>
          <template v-if="format === ExportFormat.Latex">
            <FieldSet>
              <FieldLegend>
                {{ $t(($) => $.dialog.export.latex, { ns: 'dialog' }) }}
              </FieldLegend>
              <Field orientation="horizontal">
                <Checkbox
                  id="export-dialog-include-mode-keys"
                  v-model="latexOptions.includeModeKeys"
                />
                <FieldLabel for="export-dialog-include-mode-keys">
                  {{
                    $t(($) => $.dialog.export.includeModeKeys, { ns: 'dialog' })
                  }}
                </FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="export-dialog-include-text-boxes"
                  v-model="latexOptions.includeTextBoxes"
                />
                <FieldLabel for="export-dialog-include-text-boxes">
                  {{
                    $t(($) => $.dialog.export.includeTextBoxes, {
                      ns: 'dialog',
                    })
                  }}
                </FieldLabel>
              </Field>
            </FieldSet>
          </template>
        </FieldGroup>
      </form>
      <DialogFooter>
        <template v-if="loading">
          <Button type="button" disabled>
            <Spinner />
            {{ $t(($) => $.dialog.export.exporting, { ns: 'dialog' }) }}
          </Button>
        </template>
        <template v-else>
          <DialogClose as-child>
            <Button variant="outline" type="button">
              {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
            </Button>
          </DialogClose>
          <Button type="submit" form="export-dialog-form">
            {{ $t(($) => $.dialog.export.export, { ns: 'dialog' }) }}
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import { computed, ref } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { LatexExporterOptions } from '@/services/integration/LatexExporter';
import { MusicXmlExporterOptions } from '@/services/integration/MusicXmlExporter';
import { fraction0FormatOptions } from '@/utils/numberFormatOptions';

import type {
  ExportAsLatexSettings,
  ExportAsMusicXmlSettings,
  ExportAsPngSettings,
} from './ExportDialog.types';
import { ExportFormat } from './ExportDialog.types';

const emit = defineEmits<{
  exportAsLatex: [settings: ExportAsLatexSettings];
  exportAsMusicXml: [settings: ExportAsMusicXmlSettings];
  exportAsPng: [settings: ExportAsPngSettings];
  exportAsSvg: [openFolder: boolean];
}>();
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

const open = defineModel<boolean>('open', { required: true });
const format = ref(props.defaultFormat);
const dpi = ref(300);
const transparentBackground = ref(false);
const openFolder = ref(true);

const musicXmlOptions = ref(new MusicXmlExporterOptions());
const latexOptions = ref(new LatexExporterOptions());

const exportFormatIsImage = computed(() => {
  return format.value === ExportFormat.PNG || format.value === ExportFormat.SVG;
});

function doExport() {
  if (format.value === ExportFormat.PNG) {
    emit('exportAsPng', {
      dpi: dpi.value,
      openFolder: openFolder.value,
      transparentBackground: transparentBackground.value,
    });
  } else if (format.value === ExportFormat.SVG) {
    emit('exportAsSvg', openFolder.value);
  } else if (format.value === ExportFormat.MusicXml) {
    emit('exportAsMusicXml', {
      options: musicXmlOptions.value,
      compressed: false,
      openFolder: openFolder.value,
    });
  } else if (format.value === ExportFormat.Latex) {
    emit('exportAsLatex', {
      options: latexOptions.value,
    });
  }
}

function submit() {
  if (!props.loading) {
    doExport();
  }
}
</script>
