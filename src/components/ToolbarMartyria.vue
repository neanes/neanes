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
        :options="tempoMenuOptions"
        :title="tooltip(TempoSign.VerySlowAbove)"
        @select="$emit('update:tempo', $event)"
      />
      <span class="space"></span>
      <button
        class="icon-btn"
        :class="{ selected: element.alignRight }"
        :title="alignRightTooltip"
        @click="$emit('update:alignRight', !element.alignRight)"
      >
        <img
          src="@/assets/icons/alignright2.svg"
          height="24"
          width="24"
          class="icon-btn-img"
        />
      </button>
      <span class="space" />
      <div style="display: flex; align-items: center">
        <input
          id="toolbar:martyria-auto"
          type="checkbox"
          :checked="element.auto"
          @change="
            $emit('update:auto', ($event.target as HTMLInputElement).checked)
          "
        />
        <label for="toolbar:martyria-auto">{{
          $t('toolbar:martyria.auto')
        }}</label>
      </div>
      <template v-if="!element.auto">
        <span class="space" />
        <label class="right-space">{{ $t('toolbar:martyria.note') }}</label>
        <select
          :value="element.note"
          @change="
            $emit('update:note', ($event.target as HTMLInputElement).value)
          "
        >
          <option v-for="note in notes" :key="note.key" :value="note.key">
            {{ $t(note.displayName) }}
          </option>
        </select>

        <span class="space" />
        <label class="right-space">{{ $t('toolbar:martyria.scale') }}</label>
        <select
          :value="element.scale"
          @change="
            $emit('update:scale', ($event.target as HTMLInputElement).value)
          "
        >
          <option v-for="scale in scales" :key="scale.key" :value="scale.key">
            {{ $t(scale.displayName) }}
          </option>
        </select>
      </template>
    </div>
    <div class="row">
      <label class="right-space">{{ $t('toolbar:common.bpm') }}</label>
      <InputBpm
        :disabled="element.tempo == null"
        :modelValue="element.bpm"
        @update:modelValue="$emit('update:bpm', $event)"
      />

      <span class="space" />

      <label class="right-space">{{ $t('toolbar:common.spaceAfter') }}</label>

      <InputUnit
        unit="pt"
        :min="-spaceAfterMax"
        :max="spaceAfterMax"
        :step="0.5"
        :precision="2"
        :modelValue="element.spaceAfter"
        @update:modelValue="$emit('update:spaceAfter', $event)"
      />

      <template v-if="showChromaticFthoraNote">
        <span class="space" />
        <label class="right-space">{{ $t('toolbar:common.fthoraNote') }}</label>
        <select
          :value="element.chromaticFthoraNote"
          @change="
            $emit(
              'update:chromaticFthoraNote',
              ($event.target as HTMLInputElement).value,
            )
          "
        >
          <option
            v-for="note in fthoraNotes"
            :key="note.value"
            :value="note.value"
          >
            {{ $t(note.label) }}
          </option>
        </select>
      </template>
      <span class="space" />
      <label class="right-space">{{
        $t('toolbar:martyria.rootSignOverride')
      }}</label>
      <select
        :value="element.rootSignOverride"
        @change="
          $emit(
            'update:rootSignOverride',
            ($event.target as HTMLInputElement).value,
          )
        "
      >
        <option value="">{{ $t('toolbar:martyria.none') }}</option>
        <option v-for="sign in rootSigns" :key="sign.value" :value="sign.value">
          {{ $t(sign.name) }}
        </option>
      </select>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import { MartyriaElement } from '@/models/Element';
import {
  Fthora,
  MeasureBar,
  Neume,
  Note,
  RootSign,
  TempoSign,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { Unit } from '@/utils/Unit';

import ButtonWithMenu, { ButtonWithMenuOption } from './ButtonWithMenu.vue';
import InputBpm from './InputBpm.vue';
import InputUnit from './InputUnit.vue';

@Component({
  components: { InputUnit, InputBpm, ButtonWithMenu },
  emits: [
    'update:alignRight',
    'update:auto',
    'update:bpm',
    'update:chromaticFthoraNote',
    'update:fthora',
    'update:measureBar',
    'update:note',
    'update:rootSignOverride',
    'update:scale',
    'update:spaceAfter',
    'update:tempo',
  ],
})
export default class ToolbarMartyria extends Vue {
  @Prop() element!: MartyriaElement;
  @Prop() pageSetup!: PageSetup;
  @Prop() neumeKeyboard!: NeumeKeyboard;

  Fthora = Fthora;
  MeasureBar = MeasureBar;
  TempoSign = TempoSign;

  notes = Object.values(Note).map((x) => ({
    key: x,
    displayName: this.getNoteDisplayName(x),
  }));

  scales = Object.values(Scale).map((x) => ({
    key: x,
    displayName: this.getScaleDisplayName(x),
  }));

  get spaceAfterMax() {
    return Math.round(Unit.toPt(this.pageSetup.pageWidth));
  }

  chromaticFthoras = [
    Fthora.SoftChromaticPa_Top,
    Fthora.SoftChromaticPa_Bottom,
    Fthora.SoftChromaticThi_Top,
    Fthora.SoftChromaticThi_Bottom,
    Fthora.HardChromaticPa_Top,
    Fthora.HardChromaticPa_Bottom,
    Fthora.HardChromaticThi_Top,
    Fthora.HardChromaticThi_Bottom,
  ];

  rootSigns = [
    {
      name: 'model:neume.rootSign.ananes',
      value: RootSign.Alpha,
    },
    {
      name: 'model:neume.rootSign.neanes',
      value: RootSign.SoftChromaticSquiggle,
    },
    {
      name: 'model:neume.rootSign.softChromaticGa',
      value: RootSign.SoftChromaticPaRootSign,
    },
    {
      name: 'model:neume.rootSign.nana',
      value: RootSign.Nana,
    },
    {
      name: 'model:neume.rootSign.legetos',
      value: RootSign.Legetos,
    },
    {
      name: 'model:neume.rootSign.agia',
      value: RootSign.DeltaDotted,
    },
    {
      name: 'model:neume.rootSign.zygos',
      value: RootSign.Zygos,
    },
    {
      name: 'model:neume.rootSign.aneanes',
      value: RootSign.AlphaDotted,
    },
    {
      name: 'model:neume.rootSign.necheanes',
      value: RootSign.Squiggle,
    },
    {
      name: 'model:neume.rootSign.nenano',
      value: RootSign.Tilt,
    },
    {
      name: 'model:neume.rootSign.varys',
      value: RootSign.Zo,
    },
    {
      name: 'model:neume.rootSign.neagie',
      value: RootSign.Delta,
    },
  ];

  get fthoraNotes() {
    if (
      this.element.fthora === Fthora.SoftChromaticThi_Top ||
      this.element.fthora === Fthora.SoftChromaticThi_Bottom
    ) {
      return [
        { label: 'model:note.zoHigh', value: ScaleNote.ZoHigh },
        { label: 'model:note.di', value: ScaleNote.Thi },
        { label: 'model:note.vou', value: ScaleNote.Vou },
      ];
    } else if (
      this.element.fthora === Fthora.SoftChromaticPa_Top ||
      this.element.fthora === Fthora.SoftChromaticPa_Bottom
    ) {
      return [
        { label: `model:note.niHigh`, value: ScaleNote.NiHigh },
        { label: 'model:note.ke', value: ScaleNote.Ke },
        { label: 'model:note.ga', value: ScaleNote.Ga },
        { label: 'model:note.pa', value: ScaleNote.Pa },
      ];
    } else if (
      this.element.fthora === Fthora.HardChromaticThi_Top ||
      this.element.fthora === Fthora.HardChromaticThi_Bottom
    ) {
      return [
        { label: 'model:note.zoHigh', value: ScaleNote.ZoHigh },
        { label: 'model:note.di', value: ScaleNote.Thi },
        { label: 'model:note.vou', value: ScaleNote.Vou },
      ];
    } else if (
      this.element.fthora === Fthora.HardChromaticPa_Top ||
      this.element.fthora === Fthora.HardChromaticPa_Bottom
    ) {
      return [
        { label: `model:note.niHigh`, value: ScaleNote.NiHigh },
        { label: 'model:note.ke', value: ScaleNote.Ke },
        { label: 'model:note.ga', value: ScaleNote.Ga },
        { label: 'model:note.pa', value: ScaleNote.Pa },
      ];
    }

    return [];
  }

  get showChromaticFthoraNote() {
    return (
      this.element.fthora != null &&
      this.chromaticFthoras.includes(this.element.fthora)
    );
  }

  private getNoteDisplayName(note: Note) {
    switch (note) {
      case Note.ZoLow:
        return 'model:note.zoLow';
      case Note.NiLow:
        return 'model:note.niLow';
      case Note.PaLow:
        return 'model:note.paLow';
      case Note.VouLow:
        return 'model:note.vouLow';
      case Note.GaLow:
        return 'model:note.gaLow';
      case Note.ThiLow:
        return 'model:note.diLow';
      case Note.KeLow:
        return 'model:note.keLow';
      case Note.Zo:
        return 'model:note.zo';
      case Note.Ni:
        return 'model:note.ni';
      case Note.Pa:
        return 'model:note.pa';
      case Note.Vou:
        return 'model:note.vou';
      case Note.Ga:
        return 'model:note.ga';
      case Note.Thi:
        return 'model:note.di';
      case Note.Ke:
        return 'model:note.ke';
      case Note.ZoHigh:
        return 'model:note.zoHigh';
      case Note.NiHigh:
        return 'model:note.niHigh';
      case Note.PaHigh:
        return 'model:note.paHigh';
      case Note.VouHigh:
        return 'model:note.vouHigh';
      case Note.GaHigh:
        return 'model:note.gaHigh';
      case Note.ThiHigh:
        return 'model:note.diHigh';
      case Note.KeHigh:
        return 'model:note.keHigh';
      default:
        return note;
    }
  }

  private getScaleDisplayName(scale: Scale) {
    switch (scale) {
      case Scale.Diatonic:
        return 'model:scale.diatonic';
      case Scale.SoftChromatic:
        return 'model:scale.softChromatic';
      case Scale.HardChromatic:
        return 'model:scale.hardChromatic';
      case Scale.EnharmonicGa:
        return 'model:scale.enharmonicGa';
      case Scale.EnharmonicZoHigh:
        return 'model:scale.enharmonicZoHigh';
      case Scale.EnharmonicVou:
        return 'model:scale.enharmonicVou';
      case Scale.EnharmonicZo:
        return 'model:scale.enharmonicZo';
      case Scale.EnharmonicVouHigh:
        return 'model:scale.enharmonicVouHigh';
      case Scale.Zygos:
        return 'model:scale.zygos';
      case Scale.Spathi:
        return 'model:scale.spathi';
      case Scale.SpathiGa:
        return 'model:scale.spathiGa';
      case Scale.Kliton:
        return 'model:scale.kliton';
      default:
        return scale;
    }
  }

  get spathiDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions &&
      this.element.note !== Note.Ke &&
      this.element.note !== Note.Ga
    );
  }

  get spathiTitle() {
    return this.spathiDisabled
      ? this.$t('toolbar:common.spathiDisabled')
      : this.tooltip(Fthora.Spathi_Top);
  }

  get klitonDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Thi
    );
  }

  get klitonTitle() {
    return this.klitonDisabled
      ? this.$t('toolbar:common.klitonDisabled')
      : this.tooltip(Fthora.Kliton_Top);
  }

  get zygosDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Thi
    );
  }

  get zygosTitle() {
    return this.zygosDisabled
      ? this.$t('toolbar:common.zygosDisabled')
      : this.tooltip(Fthora.Zygos_Top);
  }

  get enharmonicDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions &&
      this.element.note !== Note.Zo &&
      this.element.note !== Note.ZoHigh &&
      this.element.note !== Note.Vou &&
      this.element.note !== Note.VouHigh &&
      this.element.note !== Note.Ga
    );
  }

  get enharmonicTitle() {
    return this.enharmonicDisabled
      ? this.$t('toolbar:common.enharmonicDisabled')
      : this.tooltip(Fthora.Enharmonic_Top);
  }

  get generalFlatDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Ke
    );
  }

  get generalFlatTitle() {
    return this.generalFlatDisabled
      ? this.$t('toolbar:common.generalFlatDisabled')
      : this.tooltip(Fthora.GeneralFlat_Top);
  }

  get generalSharpDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Ga
    );
  }

  get generalSharpTitle() {
    return this.generalSharpDisabled
      ? this.$t('toolbar:common.generalSharpDisabled')
      : this.tooltip(Fthora.GeneralSharp_Top);
  }

  tempoMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: TempoSign.VeryQuickAbove,
      icon: new URL('@/assets/icons/agogi-poli-gorgi.svg', import.meta.url)
        .href,
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

  barlineMenuOptions: ButtonWithMenuOption[] = [
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

  get alignRightTooltip() {
    return `${this.$t(
      'toolbar:common.alignRight',
    )}(${this.neumeKeyboard.getMaryriaRightAlignTooltip()})`;
  }

  tooltip(neume: Neume) {
    const displayName = this.getDisplayName(neume);
    const mapping = this.neumeKeyboard.findMappingForNeume(neume);
    if (mapping) {
      return `${this.$t(displayName)} (${this.neumeKeyboard.generateTooltip(
        mapping,
      )})`;
    } else {
      return `${this.$t(displayName)}`;
    }
  }

  getDisplayName(neume: Neume) {
    switch (neume) {
      case Fthora.DiatonicNiLow_Top:
        return 'model:neume.fthora.diatonicNiLow';
      case Fthora.DiatonicPa_Top:
        return 'model:neume.fthora.diatonicPa';
      case Fthora.DiatonicVou_Top:
        return 'model:neume.fthora.diatonicVou';
      case Fthora.DiatonicGa_Top:
        return 'model:neume.fthora.diatonicGa';
      case Fthora.DiatonicThi_Top:
        return 'model:neume.fthora.diatonicDi';
      case Fthora.DiatonicKe_Top:
        return 'model:neume.fthora.diatonicKe';
      case Fthora.DiatonicZo_Top:
        return 'model:neume.fthora.diatonicZo';
      case Fthora.DiatonicNiHigh_Top:
        return 'model:neume.fthora.diatonicNiHigh';
      case Fthora.SoftChromaticThi_Top:
        return 'model:neume.fthora.softChromaticDi';
      case Fthora.SoftChromaticPa_Top:
        return 'model:neume.fthora.softChromaticGa';
      case Fthora.HardChromaticPa_Top:
        return 'model:neume.fthora.hardChromaticPa';
      case Fthora.HardChromaticThi_Top:
        return 'model:neume.fthora.hardChromaticDi';
      case Fthora.Enharmonic_Top:
        return 'model:neume.fthora.enharmonic';
      case Fthora.GeneralFlat_Top:
        return 'model:neume.fthora.generalFlat';
      case Fthora.GeneralSharp_Top:
        return 'model:neume.fthora.generalSharp';
      case Fthora.Zygos_Top:
        return 'model:neume.fthora.zygos';
      case Fthora.Kliton_Top:
        return 'model:neume.fthora.kliton';
      case Fthora.Spathi_Top:
        return 'model:neume.fthora.spathi';
      case MeasureBar.MeasureBarRight:
        return 'toolbar:common.measureBar';
      case TempoSign.VerySlowAbove:
        return 'toolbar:common.tempoSign';
      default:
        return neume;
    }
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
</style>
