<template>
  <FieldSet class="min-h-0 flex-1 overflow-auto">
    <FieldLegend class="sr-only">{{
      $t(($) => $.toolbar.main.martyria, { ns: 'toolbar' })
    }}</FieldLegend>
    <FieldGroup>
      <Field orientation="horizontal">
        <Switch
          id="properties-martyria-auto"
          :model-value="element.auto"
          @update:model-value="
            $emit('update', {
              auto: $event === true,
            } as Partial<MartyriaElement>)
          "
        />
        <FieldLabel for="properties-martyria-auto">
          {{ $t(($) => $.toolbar.martyria.auto, { ns: 'toolbar' }) }}
        </FieldLabel>
      </Field>

      <template v-if="!element.auto">
        <Field>
          <FieldLabel for="properties-martyria-note">{{
            $t(($) => $.toolbar.martyria.note, { ns: 'toolbar' })
          }}</FieldLabel>
          <Select
            :model-value="element.note"
            @update:model-value="
              $emit('update', {
                note: $event,
              } as Partial<MartyriaElement>)
            "
          >
            <SelectTrigger id="properties-martyria-note" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="note in noteOptions"
                  :key="note.key"
                  :value="note.key"
                >
                  {{ $t(note.displayName, { ns: 'model' }) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel for="properties-martyria-scale">{{
            $t(($) => $.toolbar.martyria.scale, { ns: 'toolbar' })
          }}</FieldLabel>
          <Select
            :model-value="element.scale"
            @update:model-value="
              $emit('update', {
                scale: $event,
              } as Partial<MartyriaElement>)
            "
          >
            <SelectTrigger id="properties-martyria-scale" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem
                  v-for="scale in scales"
                  :key="scale.key"
                  :value="scale.key"
                >
                  {{ $t(scale.displayName, { ns: 'model' }) }}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </template>

      <Field orientation="horizontal">
        <FieldLabel for="properties-martyria-bpm">{{
          $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputBpm
          id="properties-martyria-bpm"
          :disabled="
            element.tempo == null &&
            element.tempoLeft == null &&
            element.tempoRight == null
          "
          :model-value="element.bpm"
          @update:model-value="
            $emit('update', {
              bpm: $event,
            } as Partial<MartyriaElement>)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-martyria-vertical-offset">{{
          $t(($) => $.toolbar.common.verticalOffset, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-martyria-vertical-offset"
          unit="pt"
          :min="-spaceAfterMax"
          :max="spaceAfterMax"
          :step="0.5"
          :format-options="fraction2FormatOptions"
          :model-value="element.verticalOffset"
          @update:model-value="
            $emit('update', {
              verticalOffset: $event,
            } as Partial<MartyriaElement>)
          "
        />
      </Field>

      <Field orientation="horizontal">
        <FieldLabel for="properties-martyria-space-after">{{
          $t(($) => $.toolbar.common.spaceAfter, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-martyria-space-after"
          unit="pt"
          :min="-spaceAfterMax"
          :max="spaceAfterMax"
          :step="0.5"
          :format-options="fraction2FormatOptions"
          :model-value="element.spaceAfter"
          @update:model-value="
            $emit('update', {
              spaceAfter: $event,
            } as Partial<MartyriaElement>)
          "
        />
      </Field>

      <Field v-if="showChromaticFthoraNote">
        <FieldLabel for="properties-martyria-fthora-note">{{
          $t(($) => $.toolbar.common.fthoraNote, { ns: 'toolbar' })
        }}</FieldLabel>
        <Select
          :model-value="element.chromaticFthoraNote"
          @update:model-value="
            $emit('update', {
              chromaticFthoraNote: $event,
            } as Partial<MartyriaElement>)
          "
        >
          <SelectTrigger id="properties-martyria-fthora-note" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="note in fthoraNotes"
                :key="note.value"
                :value="note.value"
              >
                {{ $t(note.label, { ns: 'model' }) }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel for="properties-martyria-root-sign-override">{{
          $t(($) => $.toolbar.martyria.martyriaSignOverride, { ns: 'toolbar' })
        }}</FieldLabel>
        <Select
          :model-value="element.rootSignOverride ?? SELECT_NONE_VALUE"
          @update:model-value="onRootSignOverrideChanged"
        >
          <SelectTrigger
            id="properties-martyria-root-sign-override"
            class="w-full"
          >
            <SelectValue>
              <span v-if="selectedRootSignOverride" class="root-sign-option">
                <span class="root-sign-glyph" :style="rootSignGlyphStyle">{{
                  selectedRootSignOverride.glyph
                }}</span>
                <span class="root-sign-name">{{
                  $t(selectedRootSignOverride.name, { ns: 'model' })
                }}</span>
              </span>
              <span v-else>
                {{ $t(($) => $.toolbar.common.none, { ns: 'toolbar' }) }}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                :value="SELECT_NONE_VALUE"
                :text-value="
                  $t(($) => $.toolbar.common.none, { ns: 'toolbar' })
                "
              >
                {{ $t(($) => $.toolbar.common.none, { ns: 'toolbar' }) }}
              </SelectItem>
              <SelectItem
                v-for="sign in rootSigns"
                :key="sign.value"
                :value="sign.value"
                :text-value="$t(sign.name, { ns: 'model' })"
              >
                <span class="root-sign-option">
                  <span class="root-sign-glyph" :style="rootSignGlyphStyle">{{
                    sign.glyph
                  }}</span>
                  <span class="root-sign-name">{{
                    $t(sign.name, { ns: 'model' })
                  }}</span>
                </span>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  </FieldSet>
</template>

<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputBpm from '@/components/InputBpm.vue';
import InputUnit from '@/components/InputUnit.vue';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
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
import { Switch } from '@/components/ui/switch';
import type { MartyriaElement } from '@/models/Element';
import type { ModelSelector } from '@/models/NeumeI18nMappings';
import {
  getNoteLabelSelector,
  getScaleLabelSelector,
  ROOT_SIGN_LABEL_SELECTORS,
} from '@/models/NeumeI18nMappings';
import { Fthora, Note, RootSign } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

const noteOptions = Object.values(Note).map((x) => ({
  key: x,
  displayName: getNoteLabelSelector(x),
}));

const scales = Object.values(Scale).map((x) => ({
  key: x,
  displayName: getScaleLabelSelector(x),
}));

const chromaticFthoras = [
  Fthora.SoftChromaticPa_Top,
  Fthora.SoftChromaticPa_Bottom,
  Fthora.SoftChromaticThi_Top,
  Fthora.SoftChromaticThi_Bottom,
  Fthora.HardChromaticPa_Top,
  Fthora.HardChromaticPa_Bottom,
  Fthora.HardChromaticThi_Top,
  Fthora.HardChromaticThi_Bottom,
];

type FthoraNoteOption = {
  label: ModelSelector;
  value: ScaleNote;
};

const ROOT_SIGN_OPTIONS: RootSign[] = [
  RootSign.Alpha,
  RootSign.SoftChromaticSquiggle,
  RootSign.SoftChromaticPaRootSign,
  RootSign.Nana,
  RootSign.Legetos,
  RootSign.DeltaDotted,
  RootSign.Zygos,
  RootSign.AlphaDotted,
  RootSign.Squiggle,
  RootSign.Tilt,
  RootSign.Zo,
  RootSign.Delta,
];

const rootSigns = ROOT_SIGN_OPTIONS.map((rootSign) => ({
  glyph:
    NeumeMappingService.getMapping((rootSign + 'Low') as RootSign)?.text ??
    rootSign,
  name: ROOT_SIGN_LABEL_SELECTORS[rootSign],
  value: rootSign,
}));

const props = defineProps({
  element: {
    type: Object as PropType<MartyriaElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const emit = defineEmits(['update']);
const SELECT_NONE_VALUE = '__none__';

const spaceAfterMax = computed(() =>
  Math.round(Unit.toPt(props.pageSetup.pageWidth)),
);

const rootSignGlyphStyle = computed(() => ({
  fontFamily: props.pageSetup.neumeDefaultFontFamily,
}));

const selectedRootSignOverride = computed(() =>
  rootSigns.find((sign) => sign.value === props.element.rootSignOverride),
);

const showChromaticFthoraNote = computed(
  () =>
    props.element.fthora != null &&
    chromaticFthoras.includes(props.element.fthora),
);

const fthoraNotes = computed((): FthoraNoteOption[] => {
  if (
    props.element.fthora === Fthora.SoftChromaticThi_Top ||
    props.element.fthora === Fthora.SoftChromaticThi_Bottom
  ) {
    return [
      {
        label: getNoteLabelSelector(ScaleNote.ZoHigh),
        value: ScaleNote.ZoHigh,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Thi),
        value: ScaleNote.Thi,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Vou),
        value: ScaleNote.Vou,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ni),
        value: ScaleNote.Ni,
      },
    ];
  } else if (
    props.element.fthora === Fthora.SoftChromaticPa_Top ||
    props.element.fthora === Fthora.SoftChromaticPa_Bottom
  ) {
    return [
      {
        label: getNoteLabelSelector(ScaleNote.NiHigh),
        value: ScaleNote.NiHigh,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ke),
        value: ScaleNote.Ke,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ga),
        value: ScaleNote.Ga,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Pa),
        value: ScaleNote.Pa,
      },
    ];
  } else if (
    props.element.fthora === Fthora.HardChromaticThi_Top ||
    props.element.fthora === Fthora.HardChromaticThi_Bottom
  ) {
    return [
      {
        label: getNoteLabelSelector(ScaleNote.ZoHigh),
        value: ScaleNote.ZoHigh,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Thi),
        value: ScaleNote.Thi,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Vou),
        value: ScaleNote.Vou,
      },
    ];
  } else if (
    props.element.fthora === Fthora.HardChromaticPa_Top ||
    props.element.fthora === Fthora.HardChromaticPa_Bottom
  ) {
    return [
      {
        label: getNoteLabelSelector(ScaleNote.NiHigh),
        value: ScaleNote.NiHigh,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ke),
        value: ScaleNote.Ke,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Ga),
        value: ScaleNote.Ga,
      },
      {
        label: getNoteLabelSelector(ScaleNote.Pa),
        value: ScaleNote.Pa,
      },
    ];
  }

  return [];
});

function onRootSignOverrideChanged(value: AcceptableValue) {
  emit('update', {
    rootSignOverride: value === SELECT_NONE_VALUE ? null : value,
  } as Partial<MartyriaElement>);
}
</script>

<style scoped>
.root-sign-option {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.5rem;
}

.root-sign-glyph {
  position: relative;
  top: -0.33em;
  display: inline-block;
  width: 1.75rem;
  flex: none;
  font-size: 20pt;
  line-height: 20pt;
  text-align: center;
}

.root-sign-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
