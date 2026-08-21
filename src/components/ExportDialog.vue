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
                    <PhFilePng />
                    {{ $t(($) => $.dialog.export.pngImages, { ns: 'dialog' }) }}
                  </SelectItem>
                  <SelectItem :value="ExportFormat.MusicXml">
                    <PhFileCode />
                    {{ $t(($) => $.dialog.export.musicXml, { ns: 'dialog' }) }}
                  </SelectItem>
                  <SelectItem :value="ExportFormat.Latex">
                    <PhFileText />
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
              <Field v-if="format === ExportFormat.PNG">
                <FieldLabel>
                  {{ $t(($) => $.dialog.export.pages, { ns: 'dialog' }) }}
                </FieldLabel>
                <RadioGroup v-model="pageSelection">
                  <Field orientation="horizontal">
                    <RadioGroupItem id="export-dialog-all-pages" value="all" />
                    <FieldLabel for="export-dialog-all-pages">
                      {{
                        $t(($) => $.dialog.export.allPages, { ns: 'dialog' })
                      }}
                    </FieldLabel>
                  </Field>
                  <Field
                    orientation="horizontal"
                    :data-invalid="visiblePageRangeError ? true : undefined"
                  >
                    <RadioGroupItem
                      id="export-dialog-page-range-option"
                      value="range"
                    />
                    <FieldContent>
                      <FieldLabel
                        id="export-dialog-page-range-label"
                        for="export-dialog-page-range-option"
                      >
                        {{
                          $t(($) => $.dialog.export.pageRange, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <Input
                        id="export-dialog-page-range"
                        ref="pageRangeInput"
                        v-model="pageRange"
                        type="text"
                        :disabled="pageSelection !== 'range'"
                        :placeholder="
                          $t(($) => $.dialog.export.pageRangePlaceholder, {
                            ns: 'dialog',
                          })
                        "
                        aria-labelledby="export-dialog-page-range-label"
                        :aria-invalid="visiblePageRangeError ? true : undefined"
                        :aria-describedby="pageRangeDescribedBy"
                        @blur="onPageRangeBlur"
                      />
                      <FieldDescription id="export-dialog-page-range-help">
                        {{
                          $t(($) => $.dialog.export.pageCount, {
                            ns: 'dialog',
                            pageCount,
                          })
                        }}
                      </FieldDescription>
                      <FieldError
                        v-if="visiblePageRangeError"
                        id="export-dialog-page-range-error"
                        :errors="[visiblePageRangeError]"
                      />
                    </FieldContent>
                  </Field>
                </RadioGroup>
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
              <Field
                orientation="horizontal"
                :data-disabled="!showItemInFolderSupported"
              >
                <Checkbox
                  id="export-dialog-open-folder"
                  v-model="openFolder"
                  :disabled="!showItemInFolderSupported"
                />
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
              <Field
                orientation="horizontal"
                :data-disabled="!showItemInFolderSupported"
              >
                <Checkbox
                  id="export-dialog-open-folder"
                  v-model="openFolder"
                  :disabled="!showItemInFolderSupported"
                />
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
                    $t(($) => $.dialog.export.includeInitialMartyriae, {
                      ns: 'dialog',
                    })
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
          <Button
            type="submit"
            form="export-dialog-form"
            :disabled="!exportSettingsAreValid"
          >
            <PhExport />
            {{ $t(($) => $.dialog.export.export, { ns: 'dialog' }) }}
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  PhExport,
  PhFileCode,
  PhFilePng,
  PhFileText,
} from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import type { PropType } from 'vue';
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';

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
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { normalizePageRanges, parsePageRanges } from '@/utils/pageRanges';

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
  pageCount: {
    type: Number,
    required: true,
  },
  showItemInFolderSupported: {
    type: Boolean,
    required: true,
  },
});

const { t } = useTranslation();

const open = defineModel<boolean>('open', { required: true });
const pageRange = defineModel<string>('pageRange', { required: true });
const pageRangeInput =
  useTemplateRef<InstanceType<typeof Input>>('pageRangeInput');
const format = ref(props.defaultFormat);
const dpi = ref(300);
const transparentBackground = ref(false);
const openFolder = ref(props.showItemInFolderSupported);
const pageSelection = ref<'all' | 'range'>('all');
const visiblePageRangeError = ref<string | null>(null);
let pageRangeErrorTimer: ReturnType<typeof setTimeout> | null = null;

const musicXmlOptions = ref(new MusicXmlExporterOptions());
const latexOptions = ref(new LatexExporterOptions());

const exportFormatIsImage = computed(() => {
  return format.value === ExportFormat.PNG || format.value === ExportFormat.SVG;
});

const allPagesRange = computed(() => {
  if (props.pageCount === 1) {
    return '1';
  }

  return props.pageCount > 1 ? `1-${props.pageCount}` : '';
});

const parsedPageRange = computed(() =>
  parsePageRanges(
    pageRange.value.trim() === '' ? allPagesRange.value : pageRange.value,
    props.pageCount,
  ),
);

const pageRangeError = computed(() => {
  if (pageSelection.value !== 'range' || parsedPageRange.value.error == null) {
    return null;
  }

  return parsedPageRange.value.error === 'outOfRange'
    ? t(($) => $.dialog.export.pageRangeOutOfRange, {
        ns: 'dialog',
        pageCount: props.pageCount,
      })
    : t(($) => $.dialog.export.pageRangeInvalid, { ns: 'dialog' });
});

const pageRangeDescribedBy = computed(() =>
  visiblePageRangeError.value
    ? 'export-dialog-page-range-help export-dialog-page-range-error'
    : 'export-dialog-page-range-help',
);

const exportSettingsAreValid = computed(() => {
  return (
    format.value !== ExportFormat.PNG ||
    pageSelection.value === 'all' ||
    parsedPageRange.value.error == null
  );
});

watch(pageSelection, async (selection) => {
  if (selection === 'range') {
    await nextTick();

    if (pageSelection.value === 'range') {
      const input = pageRangeInput.value?.$el as HTMLInputElement | undefined;
      input?.focus();
      input?.select();
    }
  }
});

watch(pageRangeError, (error) => {
  clearPageRangeErrorTimer();
  visiblePageRangeError.value = null;

  if (error != null) {
    pageRangeErrorTimer = setTimeout(() => {
      visiblePageRangeError.value = pageRangeError.value;
      pageRangeErrorTimer = null;
    }, 400);
  }
});

onBeforeUnmount(clearPageRangeErrorTimer);

onMounted(() => {
  const normalizedPageRange = normalizePageRanges(
    pageRange.value,
    props.pageCount,
  );

  if (normalizedPageRange != null) {
    pageRange.value = normalizedPageRange;
  }
});

function clearPageRangeErrorTimer() {
  if (pageRangeErrorTimer != null) {
    clearTimeout(pageRangeErrorTimer);
    pageRangeErrorTimer = null;
  }
}

function fillEmptyPageRange() {
  if (
    pageSelection.value === 'range' &&
    pageRange.value.trim() === '' &&
    allPagesRange.value !== ''
  ) {
    pageRange.value = allPagesRange.value;
  }
}

function onPageRangeBlur() {
  fillEmptyPageRange();
  clearPageRangeErrorTimer();
  visiblePageRangeError.value = pageRangeError.value;
}

function doExport() {
  const shouldOpenFolder = props.showItemInFolderSupported && openFolder.value;

  if (format.value === ExportFormat.PNG) {
    emit('exportAsPng', {
      dpi: dpi.value,
      openFolder: shouldOpenFolder,
      pageNumbers:
        pageSelection.value === 'range'
          ? parsedPageRange.value.pageNumbers
          : null,
      transparentBackground: transparentBackground.value,
    });
  } else if (format.value === ExportFormat.SVG) {
    emit('exportAsSvg', shouldOpenFolder);
  } else if (format.value === ExportFormat.MusicXml) {
    emit('exportAsMusicXml', {
      options: musicXmlOptions.value,
      compressed: false,
      openFolder: shouldOpenFolder,
    });
  } else if (format.value === ExportFormat.Latex) {
    emit('exportAsLatex', {
      options: latexOptions.value,
    });
  }
}

function submit() {
  if (!props.loading) {
    fillEmptyPageRange();

    if (exportSettingsAreValid.value) {
      doExport();
    }
  }
}
</script>
