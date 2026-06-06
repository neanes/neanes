<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[38rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.playbackSettings.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{
            $t(($) => $.dialog.playbackSettings.description, { ns: 'dialog' })
          }}
        </DialogDescription>
      </DialogHeader>

      <Tabs
        default-value="general"
        orientation="vertical"
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden sm:grid-cols-[13rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)]"
      >
        <ScrollArea class="col-start-1 row-start-1 min-h-0">
          <TabsList
            class="h-auto w-full flex-col items-stretch justify-start p-1"
          >
            <TabsTrigger
              v-for="section in sections"
              :key="section.value"
              :value="section.value"
              class="min-h-9 w-full flex-none justify-start whitespace-normal text-left"
            >
              <component :is="section.icon" />
              {{ $t(section.labelSelector, { ns: 'dialog' }) }}
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent
          value="general"
          class="col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden sm:col-start-2 sm:row-start-1"
        >
          <ScrollArea class="h-full min-h-0 border">
            <FieldGroup class="p-4">
              <Field orientation="horizontal">
                <FieldLabel for="playback-settings-dialog-detune">
                  {{
                    $t(($) => $.dialog.playbackSettings.detune, {
                      ns: 'dialog',
                    })
                  }}
                </FieldLabel>
                <FieldContent>
                  <div class="flex flex-wrap items-center gap-2">
                    <NumberField
                      :min="-2400"
                      :max="2400"
                      :step="1"
                      :format-options="fraction0FormatOptions"
                      :model-value="tuning"
                      @update:model-value="onTuningChanged"
                    >
                      <NumberFieldContent>
                        <NumberFieldDecrement />
                        <NumberFieldInput
                          id="playback-settings-dialog-detune"
                        />
                        <NumberFieldIncrement />
                      </NumberFieldContent>
                    </NumberField>
                    <span>cents</span>
                    <FieldDescription>
                      Di = G3 = {{ form.frequencyDi }} Hz
                    </FieldDescription>
                  </div>
                </FieldContent>
                <Button variant="outline" type="button" @click="playTestTone">
                  <PhSpeakerHigh />
                  {{
                    $t(($) => $.dialog.playbackSettings.test, { ns: 'dialog' })
                  }}
                </Button>
              </Field>

              <FieldSeparator />

              <FieldSet>
                <FieldLegend>
                  {{
                    $t(($) => $.dialog.playbackSettings.volume, {
                      ns: 'dialog',
                    })
                  }}
                </FieldLegend>
                <FieldGroup>
                  <Field orientation="horizontal">
                    <FieldTitle class="w-32 shrink-0 flex-none!">
                      {{
                        $t(($) => $.dialog.playbackSettings.melody, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldTitle>
                    <FieldContent class="min-w-0">
                      <div class="flex w-full items-center gap-3">
                        <Slider
                          class="min-w-40 flex-1"
                          :aria-label="
                            $t(($) => $.dialog.playbackSettings.melody, {
                              ns: 'dialog',
                            })
                          "
                          :model-value="[volumeMelody]"
                          :min="0"
                          :max="100"
                          @update:model-value="onVolumeMelodyChanged"
                        />
                        <span class="w-20 shrink-0 text-right tabular-nums"
                          >{{ form.volumeMelody.toFixed(1) }} dB</span
                        >
                      </div>
                    </FieldContent>
                  </Field>

                  <Field orientation="horizontal">
                    <FieldTitle class="w-32 shrink-0 flex-none!">
                      {{
                        $t(($) => $.dialog.playbackSettings.ison, {
                          ns: 'dialog',
                        })
                      }}
                    </FieldTitle>
                    <FieldContent class="min-w-0">
                      <div class="flex w-full items-center gap-3">
                        <Slider
                          class="min-w-40 flex-1"
                          :aria-label="
                            $t(($) => $.dialog.playbackSettings.ison, {
                              ns: 'dialog',
                            })
                          "
                          :model-value="[volumeIson]"
                          :min="0"
                          :max="100"
                          @update:model-value="onVolumeIsonChanged"
                        />
                        <span class="w-20 shrink-0 text-right tabular-nums"
                          >{{ form.volumeIson.toFixed(1) }} dB</span
                        >
                      </div>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </FieldSet>

              <FieldSeparator />

              <FieldSet>
                <FieldGroup>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="playback-settings-dialog-diatonic-zo"
                      :model-value="form.useDefaultAttractionZo"
                      @update:model-value="onUseDefaultAttractionZoChanged"
                    />
                    <FieldContent>
                      <FieldLabel for="playback-settings-dialog-diatonic-zo">
                        {{
                          $t(
                            ($) =>
                              $.dialog.playbackSettings.diatonicZoAttraction,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) =>
                              $.dialog.playbackSettings
                                .diatonicZoAttractionDescription,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldDescription>
                      <div class="flex flex-wrap items-center gap-2 pt-1">
                        <FieldLabel
                          for="playback-settings-dialog-diatonic-zo-moria"
                        >
                          {{
                            $t(($) => $.dialog.playbackSettings.moria, {
                              ns: 'dialog',
                            })
                          }}
                        </FieldLabel>
                        <NumberField
                          :min="-72"
                          :max="0"
                          :step="1"
                          :format-options="fraction0FormatOptions"
                          :model-value="form.defaultAttractionZoMoria"
                          @update:model-value="
                            onDefaultAttractionZoMoriaChanged
                          "
                        >
                          <NumberFieldContent>
                            <NumberFieldDecrement />
                            <NumberFieldInput
                              id="playback-settings-dialog-diatonic-zo-moria"
                            />
                            <NumberFieldIncrement />
                          </NumberFieldContent>
                        </NumberField>
                        <Button
                          variant="outline"
                          type="button"
                          @click="resetDefaultAttractionZoMoria"
                        >
                          <PhArrowCounterClockwise />
                          {{
                            $t(($) => $.dialog.playbackSettings.reset, {
                              ns: 'dialog',
                            })
                          }}
                        </Button>
                      </div>
                    </FieldContent>
                  </Field>

                  <Field orientation="horizontal">
                    <Checkbox
                      id="playback-settings-dialog-legetos"
                      :model-value="form.useLegetos"
                      @update:model-value="onUseLegetosChanged"
                    />
                    <FieldContent>
                      <FieldLabel for="playback-settings-dialog-legetos">
                        {{
                          $t(($) => $.dialog.playbackSettings.classicLegetos, {
                            ns: 'dialog',
                          })
                        }}
                      </FieldLabel>
                      <FieldDescription>
                        {{
                          $t(
                            ($) =>
                              $.dialog.playbackSettings
                                .classicLegetosDescription,
                            {
                              ns: 'dialog',
                            },
                          )
                        }}
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="intervals"
          class="col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden sm:col-start-2 sm:row-start-1"
        >
          <ScrollArea class="h-full min-h-0 border">
            <FieldGroup class="p-4">
              <FieldSet
                :data-invalid="hasIntervalErrors ? true : undefined"
                :aria-invalid="hasIntervalErrors ? true : undefined"
                :aria-describedby="
                  hasIntervalErrors ? intervalsErrorId : undefined
                "
              >
                <FieldLegend>
                  {{
                    $t(($) => $.dialog.playbackSettings.intervals, {
                      ns: 'dialog',
                    })
                  }}
                </FieldLegend>
                <FieldGroup class="gap-4">
                  <Field
                    v-for="row in visibleIntervalRows"
                    :key="row.id"
                    class="gap-1"
                    :data-invalid="isIntervalRowInvalid(row) ? true : undefined"
                  >
                    <FieldTitle :id="getIntervalRowLabelId(row)">
                      {{ $t(row.label, { ns: 'dialog' }) }}
                    </FieldTitle>
                    <FieldContent>
                      <div class="flex flex-wrap items-center gap-1">
                        <template
                          v-for="(note, index) in row.notes"
                          :key="`${row.id}-${note}`"
                        >
                          <span
                            :id="getIntervalNoteLabelId(row, index)"
                            class="w-6"
                            >{{ note }}</span
                          >
                          <NumberField
                            :min="1"
                            :max="27"
                            :step="1"
                            :format-options="fraction0FormatOptions"
                            :model-value="form[row.intervalsKey][index]"
                            @update:model-value="
                              onIntervalRowChanged(row, index, $event)
                            "
                          >
                            <NumberFieldContent>
                              <NumberFieldDecrement />
                              <NumberFieldInput
                                :id="getIntervalInputId(row, index)"
                                class="w-18"
                                :aria-labelledby="`${getIntervalNoteLabelId(row, index)} ${getIntervalRowLabelId(row)}`"
                                :aria-invalid="
                                  isIntervalRowInvalid(row) ? true : undefined
                                "
                                :aria-describedby="
                                  isIntervalRowInvalid(row)
                                    ? intervalsErrorId
                                    : undefined
                                "
                              />
                              <NumberFieldIncrement />
                            </NumberFieldContent>
                          </NumberField>
                        </template>
                        <span class="w-6">{{ row.endNote }}</span>
                      </div>
                    </FieldContent>
                  </Field>
                  <FieldError
                    v-if="hasIntervalErrors"
                    :id="intervalsErrorId"
                    :errors="intervalErrorMessages"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-fit"
                    type="button"
                    @click="resetIntervals"
                  >
                    <PhArrowCounterClockwise />
                    {{
                      $t(($) => $.dialog.playbackSettings.reset, {
                        ns: 'dialog',
                      })
                    }}
                  </Button>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </ScrollArea>
        </TabsContent>

        <TabsContent
          value="alterations"
          class="col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden sm:col-start-2 sm:row-start-1"
        >
          <ScrollArea class="h-full min-h-0 border">
            <FieldGroup class="p-4">
              <FieldSet>
                <FieldLegend>
                  {{
                    $t(
                      ($) =>
                        $.dialog.playbackSettings
                          .alterationMultipliersChrysanthine,
                      {
                        ns: 'dialog',
                      },
                    )
                  }}
                </FieldLegend>
                <FieldGroup class="gap-4">
                  <Field
                    v-for="row in alterationMultiplierRows"
                    :key="row.id"
                    orientation="horizontal"
                  >
                    <FieldLabel
                      :for="getAlterationMultiplierInputId(row)"
                      class="w-72 shrink-0 flex-none!"
                    >
                      {{ $t(row.label, { ns: 'dialog' }) }}
                    </FieldLabel>
                    <FieldContent>
                      <div class="flex items-center gap-2">
                        <NumberField
                          :min="0"
                          :max="1"
                          :step="0.05"
                          :format-options="fraction2FormatOptions"
                          :model-value="form.alterationMultipliers[row.index]"
                          @update:model-value="
                            onAlterationMultiplierChanged(row.index, $event)
                          "
                        >
                          <NumberFieldContent>
                            <NumberFieldDecrement />
                            <NumberFieldInput
                              :id="getAlterationMultiplierInputId(row)"
                            />
                            <NumberFieldIncrement />
                          </NumberFieldContent>
                        </NumberField>
                        <span>&times;</span>
                      </div>
                    </FieldContent>
                  </Field>
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-fit"
                    type="button"
                    @click="resetAlterationMultipliers"
                  >
                    <PhArrowCounterClockwise />
                    {{
                      $t(($) => $.dialog.playbackSettings.reset, {
                        ns: 'dialog',
                      })
                    }}
                  </Button>
                </FieldGroup>
              </FieldSet>

              <FieldSeparator />

              <FieldSet>
                <FieldLegend>
                  {{
                    $t(
                      ($) =>
                        $.dialog.playbackSettings.alterationMoria1881Committee,
                      {
                        ns: 'dialog',
                      },
                    )
                  }}
                </FieldLegend>
                <FieldGroup class="gap-4">
                  <Field
                    v-for="row in alterationMoriaRows"
                    :key="row.id"
                    orientation="horizontal"
                  >
                    <FieldLabel
                      :for="getAlterationMoriaInputId(row)"
                      class="w-72 shrink-0 flex-none!"
                    >
                      {{ $t(row.label, { ns: 'dialog' }) }}
                    </FieldLabel>
                    <FieldContent>
                      <div class="flex items-center gap-2">
                        <NumberField
                          :min="row.min"
                          :max="row.max"
                          :step="1"
                          :format-options="fraction0FormatOptions"
                          :model-value="form.alterationMoriaMap[row.accidental]"
                          @update:model-value="
                            onAlterationMoriaRowChanged(row, $event)
                          "
                        >
                          <NumberFieldContent>
                            <NumberFieldDecrement />
                            <NumberFieldInput
                              :id="getAlterationMoriaInputId(row)"
                            />
                            <NumberFieldIncrement />
                          </NumberFieldContent>
                        </NumberField>
                        <span>{{
                          $t(($) => $.dialog.playbackSettings.moria, {
                            ns: 'dialog',
                          })
                        }}</span>
                      </div>
                    </FieldContent>
                  </Field>
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-fit"
                    type="button"
                    @click="resetAlterationMoria"
                  >
                    <PhArrowCounterClockwise />
                    {{
                      $t(($) => $.dialog.playbackSettings.reset, {
                        ns: 'dialog',
                      })
                    }}
                  </Button>
                </FieldGroup>
              </FieldSet>
            </FieldGroup>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" type="button">
            {{ $t(($) => $.dialog.playbackSettings.close, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  PhArrowCounterClockwise,
  PhGearFine,
  PhSlidersHorizontal,
  PhSpeakerHigh,
  PhWaveSine,
} from '@phosphor-icons/vue';
import type { SelectorParam } from 'i18next';
import type { Component, PropType } from 'vue';
import { computed, ref } from 'vue';

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
  FieldTitle,
} from '@/components/ui/field';
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accidental } from '@/models/Neumes';
import type { PlaybackOptions } from '@/services/audio/PlaybackService';
import {
  fraction0FormatOptions,
  fraction2FormatOptions,
} from '@/utils/numberFormatOptions';

const FREQUENCY_G3 = 196;

const emit = defineEmits<{
  'play-test-tone': [];
  'update:options': [options: PlaybackOptions];
}>();
const props = defineProps({
  options: {
    type: Object as PropType<PlaybackOptions>,
    required: true,
  },
});
const open = defineModel<boolean>('open', { required: true });

const sections = [
  {
    value: 'general',
    labelSelector: ($) => $.dialog.playbackSettings.general,
    icon: PhSlidersHorizontal,
  },
  {
    value: 'intervals',
    labelSelector: ($) => $.dialog.playbackSettings.intervals,
    icon: PhWaveSine,
  },
  {
    value: 'alterations',
    labelSelector: ($) => $.dialog.playbackSettings.alterations,
    icon: PhGearFine,
  },
] as const satisfies ReadonlyArray<{
  value: string;
  labelSelector: DialogSelector;
  icon: Component;
}>;

type DialogSelector = SelectorParam<'dialog'>;
type IntervalKey =
  | 'diatonicIntervals'
  | 'softChromaticIntervals'
  | 'hardChromaticIntervals'
  | 'legetosIntervals'
  | 'zygosIntervals'
  | 'zygosLegetosIntervals'
  | 'spathiIntervals'
  | 'klitonIntervals';

type IntervalRow = {
  id: string;
  label: DialogSelector;
  intervalsKey: IntervalKey;
  notes: string[];
  endNote: string;
  requiresLegetos?: boolean;
};

type IntervalError = {
  intervalsKey: IntervalKey;
  message: string;
};

type AlterationMultiplierRow = {
  id: string;
  label: DialogSelector;
  index: number;
};

type AlterationMoriaRow = {
  id: string;
  label: DialogSelector;
  accidental: Accidental;
  min: number;
  max: number;
  kind: 'diesis' | 'yfesis';
};

const intervalRows = [
  {
    id: 'diatonic',
    label: ($) => $.dialog.playbackSettings.diatonic,
    intervalsKey: 'diatonicIntervals',
    notes: ['Ni', 'Pa', 'Vou'],
    endNote: 'Ga',
  },
  {
    id: 'legetos',
    label: ($) => $.dialog.playbackSettings.legetos,
    intervalsKey: 'legetosIntervals',
    notes: ['Pa', 'Vou', 'Ga'],
    endNote: 'Di',
    requiresLegetos: true,
  },
  {
    id: 'soft-chromatic',
    label: ($) => $.dialog.playbackSettings.softChromatic,
    intervalsKey: 'softChromaticIntervals',
    notes: ['Ni', 'Pa', 'Vou'],
    endNote: 'Ga',
  },
  {
    id: 'hard-chromatic',
    label: ($) => $.dialog.playbackSettings.hardChromatic,
    intervalsKey: 'hardChromaticIntervals',
    notes: ['Pa', 'Vou', 'Ga'],
    endNote: 'Di',
  },
  {
    id: 'zygos',
    label: ($) => $.dialog.playbackSettings.zygos,
    intervalsKey: 'zygosIntervals',
    notes: ['Ni', 'Pa', 'Vou', 'Ga'],
    endNote: 'Di',
  },
  {
    id: 'zygos-legetos',
    label: ($) => $.dialog.playbackSettings.zygosLegetos,
    intervalsKey: 'zygosLegetosIntervals',
    notes: ['Ni', 'Pa', 'Vou', 'Ga'],
    endNote: 'Di',
    requiresLegetos: true,
  },
  {
    id: 'kliton',
    label: ($) => $.dialog.playbackSettings.kliton,
    intervalsKey: 'klitonIntervals',
    notes: ['Pa', 'Vou', 'Ga'],
    endNote: 'Di',
  },
  {
    id: 'spathi',
    label: ($) => $.dialog.playbackSettings.spathi,
    intervalsKey: 'spathiIntervals',
    notes: ['Ga', 'Di', 'Ke', 'Zo'],
    endNote: 'Ni',
  },
] satisfies IntervalRow[];

const alterationMultiplierRows = [
  {
    id: 'zero-crossbeams',
    label: ($) => $.dialog.playbackSettings.zeroCrossbeams,
    index: 0,
  },
  {
    id: 'one-crossbeam',
    label: ($) => $.dialog.playbackSettings.oneCrossbeam,
    index: 1,
  },
  {
    id: 'two-crossbeams',
    label: ($) => $.dialog.playbackSettings.twoCrossbeams,
    index: 2,
  },
] satisfies AlterationMultiplierRow[];

const alterationMoriaRows = [
  {
    id: 'sharp-zero-crossbeams',
    label: ($) => $.dialog.playbackSettings.sharpWithZeroCrossbeams,
    accidental: Accidental.Sharp_2_Left,
    min: 0,
    max: 72,
    kind: 'diesis',
  },
  {
    id: 'sharp-one-crossbeam',
    label: ($) => $.dialog.playbackSettings.sharpWithOneCrossbeam,
    accidental: Accidental.Sharp_4_Left,
    min: 0,
    max: 72,
    kind: 'diesis',
  },
  {
    id: 'sharp-two-crossbeams',
    label: ($) => $.dialog.playbackSettings.sharpWithTwoCrossbeams,
    accidental: Accidental.Sharp_6_Left,
    min: 0,
    max: 72,
    kind: 'diesis',
  },
  {
    id: 'sharp-three-crossbeams',
    label: ($) => $.dialog.playbackSettings.sharpWithThreeCrossbeams,
    accidental: Accidental.Sharp_8_Left,
    min: 0,
    max: 72,
    kind: 'diesis',
  },
  {
    id: 'flat-zero-crossbeams',
    label: ($) => $.dialog.playbackSettings.flatWithZeroCrossbeams,
    accidental: Accidental.Flat_2_Right,
    min: -72,
    max: 0,
    kind: 'yfesis',
  },
  {
    id: 'flat-one-crossbeam',
    label: ($) => $.dialog.playbackSettings.flatWithOneCrossbeam,
    accidental: Accidental.Flat_4_Right,
    min: -72,
    max: 0,
    kind: 'yfesis',
  },
  {
    id: 'flat-two-crossbeams',
    label: ($) => $.dialog.playbackSettings.flatWithTwoCrossbeams,
    accidental: Accidental.Flat_6_Right,
    min: -72,
    max: 0,
    kind: 'yfesis',
  },
  {
    id: 'flat-three-crossbeams',
    label: ($) => $.dialog.playbackSettings.flatWithThreeCrossbeams,
    accidental: Accidental.Flat_8_Right,
    min: -72,
    max: 0,
    kind: 'yfesis',
  },
] satisfies AlterationMoriaRow[];

const form = ref<PlaybackOptions>(clonePlaybackOptions(props.options));
const tuning = ref(getTuningFromFrequency(form.value.frequencyDi));
const intervalErrors = ref<IntervalError[]>([]);
const intervalsErrorId = 'playback-settings-dialog-intervals-error';

const visibleIntervalRows = computed(() =>
  intervalRows.filter((row) => !row.requiresLegetos || form.value.useLegetos),
);
const hasIntervalErrors = computed(() => intervalErrors.value.length > 0);
const intervalErrorMessages = computed(() =>
  intervalErrors.value.map((error) => error.message),
);

const volumeIson = computed({
  get() {
    return 100 * Math.pow(10, form.value.volumeIson / 20);
  },
  set(value: number) {
    form.value.volumeIson = 20 * Math.log10(value / 100);
    emitPlaybackOptionsChanged();
  },
});

const volumeMelody = computed({
  get() {
    return 100 * Math.pow(10, form.value.volumeMelody / 20);
  },
  set(value: number) {
    form.value.volumeMelody = 20 * Math.log10(value / 100);
    emitPlaybackOptionsChanged();
  },
});

function onVolumeIsonChanged(value: number[] | undefined) {
  volumeIson.value = value?.[0] ?? 0;
}

function onVolumeMelodyChanged(value: number[] | undefined) {
  volumeMelody.value = value?.[0] ?? 0;
}

function clonePlaybackOptions(options: PlaybackOptions): PlaybackOptions {
  return {
    ...options,
    diatonicIntervals: [...options.diatonicIntervals],
    hardChromaticIntervals: [...options.hardChromaticIntervals],
    softChromaticIntervals: [...options.softChromaticIntervals],
    legetosIntervals: [...options.legetosIntervals],
    zygosIntervals: [...options.zygosIntervals],
    zygosLegetosIntervals: [...options.zygosLegetosIntervals],
    spathiIntervals: [...options.spathiIntervals],
    klitonIntervals: [...options.klitonIntervals],
    alterationMultipliers: [...options.alterationMultipliers],
    alterationMoriaMap: { ...options.alterationMoriaMap },
  };
}

function emitPlaybackOptionsChanged() {
  emit('update:options', clonePlaybackOptions(form.value));
}

function getTuningFromFrequency(frequency: number) {
  return Math.round(1200 * Math.log2(frequency / FREQUENCY_G3));
}

function onUseDefaultAttractionZoChanged(value: boolean | 'indeterminate') {
  form.value.useDefaultAttractionZo = value === true;
  emitPlaybackOptionsChanged();
}

function onUseLegetosChanged(value: boolean | 'indeterminate') {
  form.value.useLegetos = value === true;
  validateIntervals();
  emitPlaybackOptionsChanged();
}

function normalizeNumberFieldValue(value: number | undefined) {
  return value ?? 0;
}

function onIntervalRowChanged(
  row: IntervalRow,
  index: number,
  value: number | undefined,
) {
  onIntervalChanged(form.value[row.intervalsKey], index, value);
}

function onIntervalChanged(
  intervals: number[],
  index: number,
  value: number | undefined,
) {
  value = normalizeNumberFieldValue(value);
  value = Math.max(1, value);
  value = Math.min(27, value);
  value = Math.round(value);

  intervals[index] = value;

  validateIntervals();
  emitPlaybackOptionsChanged();
}

function validateIntervals() {
  const errors: IntervalError[] = [];

  if (!validateTetrachord(form.value.diatonicIntervals)) {
    errors.push({
      intervalsKey: 'diatonicIntervals',
      message: 'The diatonic intervals do not sum to 30.',
    });
  }

  if (!validateTetrachord(form.value.softChromaticIntervals)) {
    errors.push({
      intervalsKey: 'softChromaticIntervals',
      message: 'The soft chromatic intervals do not sum to 30.',
    });
  }

  if (!validateTetrachord(form.value.hardChromaticIntervals)) {
    errors.push({
      intervalsKey: 'hardChromaticIntervals',
      message: 'The hard chromatic intervals do not sum to 30.',
    });
  }

  if (
    form.value.useLegetos &&
    !validateTetrachord(form.value.legetosIntervals)
  ) {
    errors.push({
      intervalsKey: 'legetosIntervals',
      message: 'The legetos intervals do not sum to 30.',
    });
  }

  intervalErrors.value = errors;
}

function validateTetrachord(intervals: number[]) {
  const sum = intervals.reduce((total, interval) => total + interval, 0);
  return sum === 30;
}

function resetIntervals() {
  form.value.diatonicIntervals = [12, 10, 8];
  form.value.hardChromaticIntervals = [6, 20, 4];
  form.value.softChromaticIntervals = [8, 14, 8];
  form.value.legetosIntervals = [8, 10, 12];
  form.value.zygosIntervals = [18, 4, 16, 4];
  form.value.zygosLegetosIntervals = [18, 4, 20, 4];
  form.value.spathiIntervals = [20, 4, 4, 14];
  form.value.klitonIntervals = [14, 12, 4];
  validateIntervals();
  emitPlaybackOptionsChanged();
}

function resetAlterationMultipliers() {
  form.value.alterationMultipliers = [0.5, 0.25, 0.75];
  emitPlaybackOptionsChanged();
}

function resetAlterationMoria() {
  form.value.alterationMoriaMap = {
    [Accidental.Flat_2_Right]: -2,
    [Accidental.Flat_4_Right]: -4,
    [Accidental.Flat_6_Right]: -6,
    [Accidental.Flat_8_Right]: -8,
    [Accidental.Sharp_2_Left]: 2,
    [Accidental.Sharp_4_Left]: 4,
    [Accidental.Sharp_6_Left]: 6,
    [Accidental.Sharp_8_Left]: 8,
  };
  emitPlaybackOptionsChanged();
}

function resetDefaultAttractionZoMoria() {
  form.value.defaultAttractionZoMoria = -4;
  emitPlaybackOptionsChanged();
}

function onAlterationMoriaRowChanged(
  row: AlterationMoriaRow,
  moria: number | undefined,
) {
  if (row.kind === 'diesis') {
    onDiesisChanged(row.accidental, moria);
  } else {
    onYfesisChanged(row.accidental, moria);
  }
}

function onDiesisChanged(neume: Accidental, moria: number | undefined) {
  moria = normalizeNumberFieldValue(moria);
  moria = Math.round(moria);

  moria = Math.max(0, moria);
  moria = Math.min(72, moria);

  form.value.alterationMoriaMap[neume] = moria;
  emitPlaybackOptionsChanged();
}

function onYfesisChanged(neume: Accidental, moria: number | undefined) {
  moria = normalizeNumberFieldValue(moria);
  moria = Math.round(moria);

  moria = Math.max(-72, moria);
  moria = Math.min(0, moria);

  form.value.alterationMoriaMap[neume] = moria;
  emitPlaybackOptionsChanged();
}

function onDefaultAttractionZoMoriaChanged(value: number | undefined) {
  value = normalizeNumberFieldValue(value);
  value = Math.max(-72, value);
  value = Math.min(0, value);
  value = Math.round(value);

  form.value.defaultAttractionZoMoria = value;
  emitPlaybackOptionsChanged();
}

function onTuningChanged(value: number | undefined) {
  value = normalizeNumberFieldValue(value);
  tuning.value = Math.max(-2400, value);
  tuning.value = Math.min(2400, tuning.value);
  tuning.value = Math.round(tuning.value);
  form.value.frequencyDi = +(
    FREQUENCY_G3 * Math.pow(2, tuning.value / 1200)
  ).toFixed(1);
  emitPlaybackOptionsChanged();
}

function onAlterationMultiplierChanged(
  index: number,
  multiplier: number | undefined,
) {
  multiplier = normalizeNumberFieldValue(multiplier);
  multiplier = Math.max(0, multiplier);
  multiplier = Math.min(1, multiplier);

  form.value.alterationMultipliers[index] = multiplier;
  emitPlaybackOptionsChanged();
}

function getIntervalInputId(row: IntervalRow, index: number) {
  return `playback-settings-dialog-${row.id}-interval-${index}`;
}

function getIntervalRowLabelId(row: IntervalRow) {
  return `playback-settings-dialog-${row.id}-interval-label`;
}

function getIntervalNoteLabelId(row: IntervalRow, index: number) {
  return `playback-settings-dialog-${row.id}-interval-${index}-note`;
}

function isIntervalRowInvalid(row: IntervalRow) {
  return intervalErrors.value.some(
    (error) => error.intervalsKey === row.intervalsKey,
  );
}

function getAlterationMultiplierInputId(row: AlterationMultiplierRow) {
  return `playback-settings-dialog-alteration-multiplier-${row.id}`;
}

function getAlterationMoriaInputId(row: AlterationMoriaRow) {
  return `playback-settings-dialog-alteration-moria-${row.id}`;
}

function playTestTone() {
  emit('play-test-tone');
}
</script>
