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
        :title="$t(($) => $.martyria.tempoLeft, { ns: 'toolbar' })"
        @select="$emit('update:tempoLeft', $event)"
      />
      <ButtonWithMenu
        class="btnMenuTempoAbove"
        :options="tempoMenuOptionsAbove"
        :title="$t(($) => $.martyria.tempo, { ns: 'toolbar' })"
        @select="$emit('update:tempo', $event)"
      />
      <ButtonWithMenu
        class="btnMenuTempoRight"
        :options="tempoMenuOptions"
        :title="$t(($) => $.martyria.tempoRight, { ns: 'toolbar' })"
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
          :title="$t(($) => $.common.neume, { ns: 'toolbar' })"
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
          $t(($) => $.martyria.auto, { ns: 'toolbar' })
        }}</label>
      </div>
      <template v-if="!element.auto">
        <span class="space" />
        <label class="right-space">{{
          $t(($) => $.martyria.note, { ns: 'toolbar' })
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
          $t(($) => $.martyria.scale, { ns: 'toolbar' })
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
        $t(($) => $.common.bpm, { ns: 'toolbar' })
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
        $t(($) => $.common.verticalOffset, { ns: 'toolbar' })
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
        $t(($) => $.common.spaceAfter, { ns: 'toolbar' })
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
          $t(($) => $.common.fthoraNote, { ns: 'toolbar' })
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
        $t(($) => $.martyria.rootSignOverride, { ns: 'toolbar' })
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
          {{ $t(($) => $.common.none, { ns: 'toolbar' }) }}
        </option>
        <option v-for="sign in rootSigns" :key="sign.value" :value="sign.value">
          {{ $t(sign.name, { ns: 'model' }) }}
        </option>
      </select>

      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t(($) => $.common.sectionName, { ns: 'toolbar' })
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

<script lang="ts">
import { defineComponent, PropType } from 'vue';

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
  Neume,
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

export default defineComponent({
  components: { InputUnit, InputBpm, ButtonWithMenu },
  props: {
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
  },
  emits: [
    'update',
    'update:fthora',
    'update:measureBar',
    'update:quantitativeNeume',
    'update:sectionName',
    'update:tempoLeft',
    'update:tempo',
    'update:tempoRight',
  ],

  data() {
    return {
      Fthora,
      MeasureBar,
      TempoSign,
      rootSigns,
      notes,
      scales,
      chromaticFthoras,
      quantitativeNeumeOptions,
      tempoMenuOptions,
      tempoMenuOptionsAbove,
      barlineMenuOptions,
    };
  },

  computed: {
    spaceAfterMax() {
      return Math.round(Unit.toPt(this.pageSetup.pageWidth));
    },
    spathiDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions &&
        this.element.note !== Note.Ke &&
        this.element.note !== Note.Ga
      );
    },

    spathiTitle() {
      return this.spathiDisabled
        ? this.$t(($) => $.common.spathiDisabled, { ns: 'toolbar' })
        : this.tooltip(Fthora.Spathi_Top);
    },

    klitonDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Thi
      );
    },

    klitonTitle() {
      return this.klitonDisabled
        ? this.$t(($) => $.common.klitonDisabled, { ns: 'toolbar' })
        : this.tooltip(Fthora.Kliton_Top);
    },

    zygosDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Thi
      );
    },

    zygosTitle() {
      return this.zygosDisabled
        ? this.$t(($) => $.common.zygosDisabled, { ns: 'toolbar' })
        : this.tooltip(Fthora.Zygos_Top);
    },

    enharmonicDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions &&
        this.element.note !== Note.Zo &&
        this.element.note !== Note.ZoHigh &&
        this.element.note !== Note.Vou &&
        this.element.note !== Note.VouHigh &&
        this.element.note !== Note.Ga
      );
    },

    enharmonicTitle() {
      return this.enharmonicDisabled
        ? this.$t(($) => $.common.enharmonicDisabled, { ns: 'toolbar' })
        : this.tooltip(Fthora.Enharmonic_Top);
    },

    generalFlatDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Ke
      );
    },

    generalFlatTitle() {
      return this.generalFlatDisabled
        ? this.$t(($) => $.common.generalFlatDisabled, { ns: 'toolbar' })
        : this.tooltip(Fthora.GeneralFlat_Top);
    },

    generalSharpDisabled() {
      return (
        !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Ga
      );
    },

    generalSharpTitle() {
      return this.generalSharpDisabled
        ? this.$t(($) => $.common.generalSharpDisabled, { ns: 'toolbar' })
        : this.tooltip(Fthora.GeneralSharp_Top);
    },

    showChromaticFthoraNote() {
      return (
        this.element.fthora != null &&
        this.chromaticFthoras.includes(this.element.fthora)
      );
    },

    alignRightTooltip() {
      return `${this.$t(($) => $.common.alignRight, {
        ns: 'toolbar',
      })}(${this.neumeKeyboard.getMaryriaRightAlignTooltip()})`;
    },

    fthoraNotes(): FthoraNoteOption[] {
      if (
        this.element.fthora === Fthora.SoftChromaticThi_Top ||
        this.element.fthora === Fthora.SoftChromaticThi_Bottom
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
        this.element.fthora === Fthora.SoftChromaticPa_Top ||
        this.element.fthora === Fthora.SoftChromaticPa_Bottom
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
        this.element.fthora === Fthora.HardChromaticThi_Top ||
        this.element.fthora === Fthora.HardChromaticThi_Bottom
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
        this.element.fthora === Fthora.HardChromaticPa_Top ||
        this.element.fthora === Fthora.HardChromaticPa_Bottom
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
    },
  },

  methods: {
    translateNeumeDisplayName(neume: Neume) {
      if (neume === MeasureBar.MeasureBarRight) {
        return this.$t(($) => $.common.measureBar, { ns: 'toolbar' });
      }

      const displayName = getFthoraLabelSelector(neume);
      return displayName == null
        ? String(neume)
        : this.$t(displayName, { ns: 'model' });
    },

    tooltip(neume: Neume) {
      const label = this.translateNeumeDisplayName(neume);
      const mapping = this.neumeKeyboard.findMappingForNeume(neume);
      if (mapping) {
        return `${label} (${this.neumeKeyboard.generateTooltip(mapping)})`;
      } else {
        return label;
      }
    },
  },
});
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
