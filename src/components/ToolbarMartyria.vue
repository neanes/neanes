<template>
  <div class="martyria-toolbar">
    <div class="row">
      <button
        class="neume-button"
        :title="tooltip(Fthora.DiatonicNiLow_Top)"
        @click="$emit('update:fthora', Fthora.DiatonicNiLow_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
      </button>
      <button
        class="neume-button"
        :title="tooltip(Fthora.DiatonicPa_Top)"
        @click="$emit('update:fthora', Fthora.DiatonicPa_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-pa.svg" />
      </button>
      <button
        class="neume-button"
        :title="tooltip(Fthora.DiatonicVou_Top)"
        @click="$emit('update:fthora', Fthora.DiatonicVou_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button
        class="neume-button"
        :title="tooltip(Fthora.DiatonicGa_Top)"
        @click="$emit('update:fthora', Fthora.DiatonicGa_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button
        class="neume-button"
        :title="tooltip(Fthora.DiatonicThi_Top)"
        @click="$emit('update:fthora', Fthora.DiatonicThi_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-di.svg" />
      </button>
      <button
        class="neume-button"
        :title="tooltip(Fthora.DiatonicKe_Top)"
        @click="$emit('update:fthora', Fthora.DiatonicKe_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ke.svg" />
      </button>
      <button
        class="neume-button"
        :title="tooltip(Fthora.DiatonicZo_Top)"
        @click="$emit('update:fthora', Fthora.DiatonicZo_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        :title="tooltip(Fthora.DiatonicNiHigh_Top)"
        @click="$emit('update:fthora', Fthora.DiatonicNiHigh_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ni-high.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        :title="tooltip(Fthora.SoftChromaticThi_Top)"
        @click="$emit('update:fthora', Fthora.SoftChromaticThi_Top)"
      >
        <img src="@/assets/icons/fthora-soft-chromatic-di.svg" />
      </button>
      <button
        class="neume-button"
        :title="tooltip(Fthora.SoftChromaticPa_Top)"
        @click="$emit('update:fthora', Fthora.SoftChromaticPa_Top)"
      >
        <img src="@/assets/icons/fthora-soft-chromatic-ke.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        :title="tooltip(Fthora.HardChromaticPa_Top)"
        @click="$emit('update:fthora', Fthora.HardChromaticPa_Top)"
      >
        <img src="@/assets/icons/fthora-hard-chromatic-pa.svg" />
      </button>
      <button
        class="neume-button"
        :title="tooltip(Fthora.HardChromaticThi_Top)"
        @click="$emit('update:fthora', Fthora.HardChromaticThi_Top)"
      >
        <img src="@/assets/icons/fthora-hard-chromatic-di.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="enharmonicDisabled"
        :title="enharmonicTitle"
        @click="$emit('update:fthora', Fthora.Enharmonic_Top)"
      >
        <img src="@/assets/icons/fthora-enharmonic.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="generalFlatDisabled"
        :title="generalFlatTitle"
        @click="$emit('update:fthora', Fthora.GeneralFlat_Top)"
      >
        <img src="@/assets/icons/fthora-general-flat.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="generalSharpDisabled"
        :title="generalSharpTitle"
        @click="$emit('update:fthora', Fthora.GeneralSharp_Top)"
      >
        <img src="@/assets/icons/fthora-general-sharp.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="zygosDisabled"
        :title="zygosTitle"
        @click="$emit('update:fthora', Fthora.Zygos_Top)"
      >
        <img src="@/assets/icons/fthora-zygos.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="klitonDisabled"
        :title="klitonTitle"
        @click="$emit('update:fthora', Fthora.Kliton_Top)"
      >
        <img src="@/assets/icons/fthora-kliton.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="spathiDisabled"
        :title="spathiTitle"
        @click="$emit('update:fthora', Fthora.Spathi_Top)"
      >
        <img src="@/assets/icons/fthora-spathi.svg" />
      </button>
      <span class="space"></span>
      <ButtonWithMenu
        :options="barlineMenuOptions"
        :title="tooltip(MeasureBar.MeasureBarRight)"
        @select="$emit('update:measureBar', $event)"
      />
      <span class="space" />
      <ButtonWithMenu
        class="btnMenuTempoLeft"
        :options="tempoMenuOptions"
        :title="$t(($) => $.toolbar.martyria.tempoLeft, { ns: 'toolbar' })"
        @select="$emit('update:tempoLeft', $event)"
      />
      <ButtonWithMenu
        class="btnMenuTempoAbove"
        :options="tempoMenuOptionsAbove"
        :title="$t(($) => $.toolbar.martyria.tempo, { ns: 'toolbar' })"
        @select="$emit('update:tempo', $event)"
      />
      <ButtonWithMenu
        class="btnMenuTempoRight"
        :options="tempoMenuOptions"
        :title="$t(($) => $.toolbar.martyria.tempoRight, { ns: 'toolbar' })"
        @select="$emit('update:tempoRight', $event)"
      />
      <span class="space"></span>
      <button
        class="icon-btn"
        :class="{ selected: element.alignRight }"
        :title="alignRightTooltip"
        @click="
          $emit('update', {
            alignRight: !element.alignRight,
          } as Partial<MartyriaElement>)
        "
      >
        <img
          src="@/assets/icons/alignright2.svg"
          height="24"
          width="24"
          class="icon-btn-img"
        />
      </button>
      <template v-if="element.alignRight">
        <span class="space" />
        <ButtonWithMenu
          :options="quantitativeNeumeOptions"
          :title="$t(($) => $.toolbar.common.neume, { ns: 'toolbar' })"
          @select="$emit('update:quantitativeNeume', $event)"
        />
      </template>
      <span class="space" />
      <div style="display: flex; align-items: center">
        <input
          id="toolbar:martyria-auto"
          type="checkbox"
          :checked="element.auto"
          @change="
            $emit('update', {
              auto: ($event.target as HTMLInputElement).checked,
            } as Partial<MartyriaElement>)
          "
        />
        <label for="toolbar:martyria-auto">{{
          $t(($) => $.toolbar.martyria.auto, { ns: 'toolbar' })
        }}</label>
      </div>
      <template v-if="!element.auto">
        <span class="space" />
        <label class="right-space">{{
          $t(($) => $.toolbar.martyria.note, { ns: 'toolbar' })
        }}</label>
        <select
          :value="element.note"
          @change="
            $emit('update', {
              note: ($event.target as HTMLInputElement).value,
            } as Partial<MartyriaElement>)
          "
        >
          <option v-for="note in notes" :key="note.key" :value="note.key">
            {{ $t(note.displayName, { ns: 'model' }) }}
          </option>
        </select>

        <span class="space" />
        <label class="right-space">{{
          $t(($) => $.toolbar.martyria.scale, { ns: 'toolbar' })
        }}</label>
        <select
          :value="element.scale"
          @change="
            $emit('update', {
              scale: ($event.target as HTMLInputElement).value,
            } as Partial<MartyriaElement>)
          "
        >
          <option v-for="scale in scales" :key="scale.key" :value="scale.key">
            {{ $t(scale.displayName, { ns: 'model' }) }}
          </option>
        </select>
      </template>
    </div>
    <div class="row">
      <label class="right-space">{{
        $t(($) => $.toolbar.common.bpm, { ns: 'toolbar' })
      }}</label>
      <InputBpm
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

      <label class="right-space">{{
        $t(($) => $.toolbar.common.verticalOffset, { ns: 'toolbar' })
      }}</label>

      <InputUnit
        unit="pt"
        :min="-spaceAfterMax"
        :max="spaceAfterMax"
        :step="0.5"
        :precision="2"
        :model-value="element.verticalOffset"
        @update:model-value="
          $emit('update', {
            verticalOffset: $event,
          } as Partial<MartyriaElement>)
        "
      />

      <span class="space" />

      <label class="right-space">{{
        $t(($) => $.toolbar.common.spaceAfter, { ns: 'toolbar' })
      }}</label>

      <InputUnit
        unit="pt"
        :min="-spaceAfterMax"
        :max="spaceAfterMax"
        :step="0.5"
        :precision="2"
        :model-value="element.spaceAfter"
        @update:model-value="
          $emit('update', {
            spaceAfter: $event,
          } as Partial<MartyriaElement>)
        "
      />

      <template v-if="showChromaticFthoraNote">
        <span class="space" />
        <label class="right-space">{{
          $t(($) => $.toolbar.common.fthoraNote, { ns: 'toolbar' })
        }}</label>
        <select
          :value="element.chromaticFthoraNote"
          @change="
            $emit('update', {
              chromaticFthoraNote: ($event.target as HTMLInputElement).value,
            } as Partial<MartyriaElement>)
          "
        >
          <option
            v-for="note in fthoraNotes"
            :key="note.value"
            :value="note.value"
          >
            {{ $t(note.label, { ns: 'model' }) }}
          </option>
        </select>
      </template>
      <span class="space" />
      <label class="right-space">{{
        $t(($) => $.toolbar.martyria.rootSignOverride, { ns: 'toolbar' })
      }}</label>
      <select
        :value="element.rootSignOverride"
        @change="
          $emit('update', {
            rootSignOverride: ($event.target as HTMLInputElement).value || null,
          } as Partial<MartyriaElement>)
        "
      >
        <option value="">
          {{ $t(($) => $.toolbar.common.none, { ns: 'toolbar' }) }}
        </option>
        <option v-for="sign in rootSigns" :key="sign.value" :value="sign.value">
          {{ $t(sign.name, { ns: 'model' }) }}
        </option>
      </select>

      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
        }}</label>
        <input
          type="text"
          :value="element.sectionName"
          @change="
            $emit(
              'update:sectionName',
              ($event.target as HTMLInputElement).value,
            )
          "
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, PropType } from 'vue';

import { MartyriaElement } from '@/models/Element';
import {
  getFthoraLabelSelector,
  getNoteLabelSelector,
  getScaleLabelSelector,
  ModelSelector,
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
import { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { NeumeMappingService } from '@/services/NeumeMappingService';
import { Unit } from '@/utils/Unit';

import ButtonWithMenu, { ButtonWithMenuOption } from './ButtonWithMenu.vue';
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

defineEmits([
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
  () =>
    `${t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' })}(${props.neumeKeyboard.getMaryriaRightAlignTooltip()})`,
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

function tooltip(neume: Fthora | MeasureBar.MeasureBarRight) {
  const label = translateNeumeDisplayName(neume);
  const mapping = props.neumeKeyboard.findMappingForNeume(neume);
  if (mapping) {
    return `${label} (${props.neumeKeyboard.generateTooltip(mapping)})`;
  } else {
    return label;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.martyria-toolbar {
  background-color: lightgray;

  padding: 0.25rem;

  --btn-size: 32px;
}

label.right-space {
  margin-right: 0.5rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.neume-button {
  height: var(--btn-size);
  width: var(--btn-size);

  position: relative;

  display: flex;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  user-select: none;
}

.space {
  width: 16px;
}

.icon-btn {
  height: var(--btn-size);
  width: var(--btn-size);
  padding: 0;

  user-select: none;
}

.icon-btn.selected {
  background-color: var(--btn-color-selected);
}

.icon-btn-img {
  vertical-align: middle;
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
