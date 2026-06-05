<template>
  <div class="martyria-toolbar">
    <Toolbar class="row h-auto w-full gap-0 border-0 p-1" loop>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicNiLow_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.DiatonicNiLow_Top)"
        >
          <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicPa_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.DiatonicPa_Top)"
        >
          <img src="@/assets/icons/fthora-diatonic-pa.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicVou_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.DiatonicVou_Top)"
        >
          <img src="@/assets/icons/fthora-diatonic-vou.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicGa_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.DiatonicGa_Top)"
        >
          <img src="@/assets/icons/fthora-diatonic-ga.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicThi_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.DiatonicThi_Top)"
        >
          <img src="@/assets/icons/fthora-diatonic-di.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicKe_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.DiatonicKe_Top)"
        >
          <img src="@/assets/icons/fthora-diatonic-ke.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicZo_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.DiatonicZo_Top)"
        >
          <img src="@/assets/icons/fthora-diatonic-zo.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicNiHigh_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.DiatonicNiHigh_Top)"
        >
          <img src="@/assets/icons/fthora-diatonic-ni-high.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(Fthora.SoftChromaticThi_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.SoftChromaticThi_Top)"
        >
          <img src="@/assets/icons/fthora-soft-chromatic-di.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.SoftChromaticPa_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.SoftChromaticPa_Top)"
        >
          <img src="@/assets/icons/fthora-soft-chromatic-ke.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(Fthora.HardChromaticPa_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.HardChromaticPa_Top)"
        >
          <img src="@/assets/icons/fthora-hard-chromatic-pa.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.HardChromaticThi_Top)">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          @click="$emit('update:fthora', Fthora.HardChromaticThi_Top)"
        >
          <img src="@/assets/icons/fthora-hard-chromatic-di.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="enharmonicTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="enharmonicDisabled"
          @click="
            !enharmonicDisabled && $emit('update:fthora', Fthora.Enharmonic_Top)
          "
        >
          <img src="@/assets/icons/fthora-enharmonic.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="generalFlatTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="generalFlatDisabled"
          @click="
            !generalFlatDisabled &&
            $emit('update:fthora', Fthora.GeneralFlat_Top)
          "
        >
          <img src="@/assets/icons/fthora-general-flat.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="generalSharpTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="generalSharpDisabled"
          @click="
            !generalSharpDisabled &&
            $emit('update:fthora', Fthora.GeneralSharp_Top)
          "
        >
          <img src="@/assets/icons/fthora-general-sharp.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="zygosTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="zygosDisabled"
          @click="!zygosDisabled && $emit('update:fthora', Fthora.Zygos_Top)"
        >
          <img src="@/assets/icons/fthora-zygos.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="klitonTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="klitonDisabled"
          @click="!klitonDisabled && $emit('update:fthora', Fthora.Kliton_Top)"
        >
          <img src="@/assets/icons/fthora-kliton.svg" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="spathiTitle">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="neume-button"
          :aria-disabled="spathiDisabled"
          @click="!spathiDisabled && $emit('update:fthora', Fthora.Spathi_Top)"
        >
          <img src="@/assets/icons/fthora-spathi.svg" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <ButtonWithMenu
        :options="barlineMenuOptions"
        :tooltip="tooltip(MeasureBar.MeasureBarRight)"
        @select="$emit('update:measureBar', $event)"
      />
      <ToolbarSeparator />
      <ButtonWithMenu
        class="btnMenuTempoLeft"
        :options="tempoMenuOptions"
        :tooltip="$t(($) => $.toolbar.martyria.tempoLeft, { ns: 'toolbar' })"
        @select="$emit('update:tempoLeft', $event)"
      />
      <ButtonWithMenu
        class="btnMenuTempoAbove"
        :options="tempoMenuOptionsAbove"
        :tooltip="$t(($) => $.toolbar.martyria.tempo, { ns: 'toolbar' })"
        @select="$emit('update:tempo', $event)"
      />
      <ButtonWithMenu
        class="btnMenuTempoRight"
        :options="tempoMenuOptions"
        :tooltip="$t(($) => $.toolbar.martyria.tempoRight, { ns: 'toolbar' })"
        @select="$emit('update:tempoRight', $event)"
      />
      <ToolbarSeparator />
      <AppTooltip :tooltip="alignRightTooltip">
        <ToolbarButton
          variant="secondary"
          size="icon-sm"
          class="icon-btn icon-btn-small"
          :class="{ selected: element.alignRight }"
          @click="
            $emit('update', {
              alignRight: !element.alignRight,
            } as Partial<MartyriaElement>)
          "
        >
          <img src="@/assets/icons/alignright2.svg" />
        </ToolbarButton>
      </AppTooltip>
      <template v-if="element.alignRight">
        <ToolbarSeparator />
        <ButtonWithMenu
          :options="quantitativeNeumeOptions"
          :tooltip="$t(($) => $.toolbar.common.neume, { ns: 'toolbar' })"
          @select="$emit('update:quantitativeNeume', $event)"
        />
      </template>
    </Toolbar>
    <div class="row">
      <Checkbox
        id="toolbar:martyria-auto"
        class="bg-background"
        :model-value="element.auto"
        @update:model-value="
          $emit('update', {
            auto: $event === true,
          } as Partial<MartyriaElement>)
        "
      />
      <Label for="toolbar:martyria-auto" class="ml-2">{{
        $t(($) => $.toolbar.martyria.auto, { ns: 'toolbar' })
      }}</Label>
      <template v-if="!element.auto">
        <span class="space" />
        <Label for="toolbar-martyria-note" class="mr-2">{{
          $t(($) => $.toolbar.martyria.note, { ns: 'toolbar' })
        }}</Label>
        <Select
          :model-value="element.note"
          @update:model-value="
            $emit('update', {
              note: $event,
            } as Partial<MartyriaElement>)
          "
        >
          <SelectTrigger id="toolbar-martyria-note" class="bg-background">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="note in notes"
                :key="note.key"
                :value="note.key"
              >
                {{ $t(note.displayName, { ns: 'model' }) }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        <span class="space" />
        <Label for="toolbar-martyria-scale" class="mr-2">{{
          $t(($) => $.toolbar.martyria.scale, { ns: 'toolbar' })
        }}</Label>
        <Select
          :model-value="element.scale"
          @update:model-value="
            $emit('update', {
              scale: $event,
            } as Partial<MartyriaElement>)
          "
        >
          <SelectTrigger id="toolbar-martyria-scale" class="bg-background">
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
      </template>
      <span class="space" />
      <Label for="toolbar-martyria-bpm" class="mr-2">{{
        $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
      }}</Label>
      <InputBpm
        id="toolbar-martyria-bpm"
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

      <span class="space" />

      <Label for="toolbar-martyria-vertical-offset" class="mr-2">{{
        $t(($) => $.toolbar.common.verticalOffset, { ns: 'toolbar' })
      }}</Label>

      <InputUnit
        id="toolbar-martyria-vertical-offset"
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

      <span class="space" />

      <Label for="toolbar-martyria-space-after" class="mr-2">{{
        $t(($) => $.toolbar.common.spaceAfter, { ns: 'toolbar' })
      }}</Label>

      <InputUnit
        id="toolbar-martyria-space-after"
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

      <template v-if="showChromaticFthoraNote">
        <span class="space" />
        <Label for="toolbar-martyria-fthora-note" class="mr-2">{{
          $t(($) => $.toolbar.common.fthoraNote, { ns: 'toolbar' })
        }}</Label>
        <Select
          :model-value="element.chromaticFthoraNote"
          @update:model-value="
            $emit('update', {
              chromaticFthoraNote: $event,
            } as Partial<MartyriaElement>)
          "
        >
          <SelectTrigger
            id="toolbar-martyria-fthora-note"
            class="bg-background"
          >
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
      </template>
      <span class="space" />
      <Label for="toolbar-martyria-root-sign-override" class="mr-2">{{
        $t(($) => $.toolbar.martyria.rootSignOverride, { ns: 'toolbar' })
      }}</Label>
      <Select
        :model-value="element.rootSignOverride ?? SELECT_NONE_VALUE"
        @update:model-value="onRootSignOverrideChanged"
      >
        <SelectTrigger
          id="toolbar-martyria-root-sign-override"
          class="bg-background"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem :value="SELECT_NONE_VALUE">
              {{ $t(($) => $.toolbar.common.none, { ns: 'toolbar' }) }}
            </SelectItem>
            <SelectItem
              v-for="sign in rootSigns"
              :key="sign.value"
              :value="sign.value"
            >
              {{ $t(sign.name, { ns: 'model' }) }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <span class="space"></span>
      <Label for="toolbar-martyria-section-name" class="mr-2">{{
        $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
      }}</Label>
      <Input
        id="toolbar-martyria-section-name"
        class="w-auto bg-background"
        type="text"
        :model-value="element.sectionName ?? ''"
        @change="
          $emit('update:sectionName', ($event.target as HTMLInputElement).value)
        "
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import type { AppTooltipValue } from '@/components/AppTooltip.types';
import AppTooltip from '@/components/AppTooltip.vue';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/ui/toolbar';
import type { MartyriaElement } from '@/models/Element';
import type { ModelSelector } from '@/models/NeumeI18nMappings';
import {
  getFthoraLabelSelector,
  getNoteLabelSelector,
  getScaleLabelSelector,
  ROOT_SIGN_LABEL_SELECTORS,
} from '@/models/NeumeI18nMappings';
import {
  Fthora,
  MeasureBar,
  Note,
  QuantitativeNeume,
  RootSign,
  TempoSign,
} from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
import type { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

import type { ButtonWithMenuOption } from './ButtonWithMenu.types';
import ButtonWithMenu from './ButtonWithMenu.vue';
import InputBpm from './InputBpm.vue';
import InputUnit from './InputUnit.vue';

const notes = Object.values(Note).map((x) => ({
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

const rootSigns = [
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.Alpha],
    value: RootSign.Alpha,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.SoftChromaticSquiggle],
    value: RootSign.SoftChromaticSquiggle,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.SoftChromaticPaRootSign],
    value: RootSign.SoftChromaticPaRootSign,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.Nana],
    value: RootSign.Nana,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.Legetos],
    value: RootSign.Legetos,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.DeltaDotted],
    value: RootSign.DeltaDotted,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.Zygos],
    value: RootSign.Zygos,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.AlphaDotted],
    value: RootSign.AlphaDotted,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.Squiggle],
    value: RootSign.Squiggle,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.Tilt],
    value: RootSign.Tilt,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.Zo],
    value: RootSign.Zo,
  },
  {
    name: ROOT_SIGN_LABEL_SELECTORS[RootSign.Delta],
    value: RootSign.Delta,
  },
];

const quantitativeNeumeOptionsList = [
  QuantitativeNeume.Elaphron,
  QuantitativeNeume.RunningElaphron,
  QuantitativeNeume.OligonPlusHypsiliPlusKentimaVertical,
  QuantitativeNeume.OligonPlusHypsiliLeft,
  QuantitativeNeume.OligonPlusHypsiliRight,
  QuantitativeNeume.OligonPlusKentimaAbove,
  QuantitativeNeume.OligonPlusKentima,
  QuantitativeNeume.KentemataPlusOligon,
];

const quantitativeNeumeOptions: ButtonWithMenuOption[] =
  quantitativeNeumeOptionsList.map((x) => {
    return { neume: x, text: NeumeMappingService.getMapping(x).text };
  });

const tempoMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: TempoSign.VeryQuick,
    icon: new URL('@/assets/icons/agogi-poli-gorgi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Quicker,
    icon: new URL('@/assets/icons/agogi-gorgoteri.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Quick,
    icon: new URL('@/assets/icons/agogi-gorgi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Medium,
    icon: new URL('@/assets/icons/agogi-mesi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Moderate,
    icon: new URL('@/assets/icons/agogi-metria.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Slow,
    icon: new URL('@/assets/icons/agogi-argi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.Slower,
    icon: new URL('@/assets/icons/agogi-argoteri.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.VerySlow,
    icon: new URL('@/assets/icons/agogi-poli-argi.svg', import.meta.url).href,
  },
];

const tempoMenuOptionsAbove: ButtonWithMenuOption[] = [
  {
    neume: TempoSign.VeryQuickAbove,
    icon: new URL('@/assets/icons/agogi-poli-gorgi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.QuickerAbove,
    icon: new URL('@/assets/icons/agogi-gorgoteri.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.QuickAbove,
    icon: new URL('@/assets/icons/agogi-gorgi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.MediumAbove,
    icon: new URL('@/assets/icons/agogi-mesi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.ModerateAbove,
    icon: new URL('@/assets/icons/agogi-metria.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.SlowAbove,
    icon: new URL('@/assets/icons/agogi-argi.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.SlowerAbove,
    icon: new URL('@/assets/icons/agogi-argoteri.svg', import.meta.url).href,
  },
  {
    neume: TempoSign.VerySlowAbove,
    icon: new URL('@/assets/icons/agogi-poli-argi.svg', import.meta.url).href,
  },
];

const barlineMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: MeasureBar.MeasureBarShortTheseos,
    icon: new URL('@/assets/icons/barline-short-theseos.svg', import.meta.url)
      .href,
  },
  {
    neume: MeasureBar.MeasureBarShortDouble,
    icon: new URL('@/assets/icons/barline-short-double.svg', import.meta.url)
      .href,
  },
  {
    neume: MeasureBar.MeasureBarTop,
    icon: new URL('@/assets/icons/barline-short-single.svg', import.meta.url)
      .href,
  },
  {
    neume: MeasureBar.MeasureBarTheseos,
    icon: new URL('@/assets/icons/barline-theseos.svg', import.meta.url).href,
  },
  {
    neume: MeasureBar.MeasureBarDouble,
    icon: new URL('@/assets/icons/barline-double.svg', import.meta.url).href,
  },
  {
    neume: MeasureBar.MeasureBarRight,
    icon: new URL('@/assets/icons/barline-single.svg', import.meta.url).href,
  },
];

const props = defineProps({
  element: {
    type: Object as PropType<MartyriaElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  neumeKeyboard: {
    type: Object as PropType<NeumeKeyboard>,
    required: true,
  },
});

const emit = defineEmits([
  'update',
  'update:fthora',
  'update:measureBar',
  'update:quantitativeNeume',
  'update:sectionName',
  'update:tempoLeft',
  'update:tempo',
  'update:tempoRight',
]);

const { t } = useTranslation();
const SELECT_NONE_VALUE = '__none__';

function onRootSignOverrideChanged(value: AcceptableValue) {
  emit('update', {
    rootSignOverride: value === SELECT_NONE_VALUE ? null : value,
  } as Partial<MartyriaElement>);
}

const spaceAfterMax = computed(() =>
  Math.round(Unit.toPt(props.pageSetup.pageWidth)),
);

const spathiDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    props.element.note !== Note.Ke &&
    props.element.note !== Note.Ga,
);

const spathiTitle = computed(() =>
  spathiDisabled.value
    ? t(($) => $.toolbar.common.spathiDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Spathi_Top),
);

const klitonDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions && props.element.note !== Note.Thi,
);

const klitonTitle = computed(() =>
  klitonDisabled.value
    ? t(($) => $.toolbar.common.klitonDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Kliton_Top),
);

const zygosDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions && props.element.note !== Note.Thi,
);

const zygosTitle = computed(() =>
  zygosDisabled.value
    ? t(($) => $.toolbar.common.zygosDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Zygos_Top),
);

const enharmonicDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    props.element.note !== Note.Zo &&
    props.element.note !== Note.ZoHigh &&
    props.element.note !== Note.Vou &&
    props.element.note !== Note.VouHigh &&
    props.element.note !== Note.Ga,
);

const enharmonicTitle = computed(() =>
  enharmonicDisabled.value
    ? t(($) => $.toolbar.common.enharmonicDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Enharmonic_Top),
);

const generalFlatDisabled = computed(
  () => !props.pageSetup.noFthoraRestrictions && props.element.note !== Note.Ke,
);

const generalFlatTitle = computed(() =>
  generalFlatDisabled.value
    ? t(($) => $.toolbar.common.generalFlatDisabled, {
        ns: 'toolbar',
      })
    : tooltip(Fthora.GeneralFlat_Top),
);

const generalSharpDisabled = computed(
  () => !props.pageSetup.noFthoraRestrictions && props.element.note !== Note.Ga,
);

const generalSharpTitle = computed(() =>
  generalSharpDisabled.value
    ? t(($) => $.toolbar.common.generalSharpDisabled, {
        ns: 'toolbar',
      })
    : tooltip(Fthora.GeneralSharp_Top),
);

const showChromaticFthoraNote = computed(
  () =>
    props.element.fthora != null &&
    chromaticFthoras.includes(props.element.fthora),
);

const alignRightTooltip = computed(
  (): AppTooltipValue => ({
    label: t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' }),
    shortcut: props.neumeKeyboard.getMartyriaRightAlignTooltipKeys(),
  }),
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

function translateNeumeDisplayName(neume: Fthora | MeasureBar.MeasureBarRight) {
  if (neume === MeasureBar.MeasureBarRight) {
    return t(($) => $.toolbar.common.measureBar, { ns: 'toolbar' });
  }

  return t(getFthoraLabelSelector(neume), { ns: 'model' });
}

function tooltip(neume: Fthora | MeasureBar.MeasureBarRight): AppTooltipValue {
  const label = translateNeumeDisplayName(neume);
  const mapping = props.neumeKeyboard.findMappingForNeume(neume);
  if (mapping) {
    return {
      label,
      shortcut: props.neumeKeyboard.generateTooltipKeys(mapping),
    };
  } else {
    return label;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.martyria-toolbar {
  background-color: var(--color-legacy-chrome-menu-surface);

  --btn-size: 32px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.neume-button,
:deep(.menu-container > .neume-button),
.icon-btn {
  box-sizing: border-box;
  height: var(--btn-size);
  width: var(--btn-size);
  appearance: auto;
  background: revert;
  border: revert;
  border-radius: revert;
  box-shadow: revert;
  font-weight: revert;

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;
  outline: revert;
  padding: 0;
  transition: revert;

  user-select: none;
}

.neume-button:hover,
:deep(.menu-container > .neume-button:hover),
.icon-btn:hover {
  background: revert;
}

.neume-button[aria-disabled='true'],
:deep(.menu-container > .neume-button:disabled),
.icon-btn[aria-disabled='true'],
.icon-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.neume-button img,
:deep(.menu-container > .neume-button img) {
  height: var(--btn-size);
  max-width: none;
  width: var(--btn-size);
}

.icon-btn img {
  height: var(--btn-icon-size, var(--btn-size));
  max-width: none;
  width: var(--btn-icon-size, var(--btn-size));
}

.icon-btn-small {
  --btn-icon-size: 24px;
}

.icon-btn.selected {
  background: var(--color-legacy-chrome-selected);
}

.space {
  width: 16px;
}

.btnMenuTempoLeft :deep(.neume-button) {
  justify-content: right;
}

.btnMenuTempoAbove :deep(.neume-button) {
  align-items: start;
}

.btnMenuTempoRight :deep(.neume-button) {
  justify-content: left;
}

.btnMenuTempoLeft :deep(.neume-button img),
.btnMenuTempoRight :deep(.neume-button img) {
  height: 28px;
  width: 28px;
}

.btnMenuTempoAbove :deep(.neume-button img) {
  height: 24px;
  width: 24px;
}
</style>
