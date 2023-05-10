<template>
  <div class="martyria-toolbar">
    <div class="row">
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicNiLow_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicPa_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-pa.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicVou_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicGa_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicThi_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-di.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicKe_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ke.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicZo_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.DiatonicNiHigh_Top)"
      >
        <img src="@/assets/icons/fthora-diatonic-ni-high.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.SoftChromaticThi_Top)"
      >
        <img src="@/assets/icons/fthora-soft-chromatic-di.svg" />
      </button>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.SoftChromaticPa_Top)"
      >
        <img src="@/assets/icons/fthora-soft-chromatic-ke.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        @click="$emit('update:fthora', Fthora.HardChromaticPa_Top)"
      >
        <img src="@/assets/icons/fthora-hard-chromatic-pa.svg" />
      </button>
      <button
        class="neume-button"
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
        @select="$emit('update:measureBar', $event)"
      />
      <span class="space" />
      <ButtonWithMenu
        :options="tempoMenuOptions"
        @select="$emit('update:tempo', $event)"
      />
      <span class="space"></span>
      <button
        class="icon-btn"
        :class="{ selected: element.alignRight }"
        @click="$emit('update:alignRight', !element.alignRight)"
      >
        <img
          title="Align martyria to the end of the line"
          src="@/assets/icons/alignright2.svg"
          height="24"
          width="24"
          class="icon-btn-img"
        />
      </button>
      <span class="space" />
      <div style="display: flex; align-items: center">
        <input
          id="toolbar-martyria-auto"
          type="checkbox"
          :checked="element.auto"
          @change="$emit('update:auto', $event.target.checked)"
        />
        <label for="toolbar-martyria-auto">Auto</label>
      </div>
      <template v-if="!element.auto">
        <span class="space" />
        <label class="right-space">Note</label>
        <select
          :value="element.note"
          @change="$emit('update:note', $event.target.value)"
        >
          <option v-for="note in notes" :key="note.key" :value="note.key">
            {{ note.displayName }}
          </option>
        </select>

        <span class="space" />
        <label class="right-space">Scale</label>
        <select
          :value="element.scale"
          @change="$emit('update:scale', $event.target.value)"
        >
          <option v-for="scale in scales" :key="scale.key" :value="scale.key">
            {{ scale.displayName }}
          </option>
        </select>
      </template>
    </div>
    <div class="row">
      <label class="right-space">BPM</label>
      <InputBpm
        :disabled="element.tempo == null"
        :value="element.bpm"
        @input="$emit('update:bpm', $event)"
      />

      <span class="space" />

      <label class="right-space">Space After</label>

      <InputUnit
        unit="pt"
        :min="-spaceAfterMax"
        :max="spaceAfterMax"
        :step="0.5"
        :precision="2"
        :value="element.spaceAfter"
        @input="$emit('update:spaceAfter', $event)"
      />

      <template v-if="showChromaticFthoraNote">
        <span class="space" />
        <label class="right-space">Fthora Note</label>
        <select
          :value="element.chromaticFthoraNote"
          @change="$emit('update:chromaticFthoraNote', $event.target.value)"
        >
          <option v-for="note in fthoraNotes" :key="note" :value="note">
            {{ note }}
          </option>
        </select>
      </template>
      <span class="space" />
      <label class="right-space">Root Sign Override</label>
      <select
        :value="element.rootSignOverride"
        @change="$emit('update:rootSignOverride', $event.target.value)"
      >
        <option value="">None</option>
        <option v-for="sign in rootSigns" :key="sign.value" :value="sign.value">
          {{ sign.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { MartyriaElement } from '@/models/Element';
import { Fthora, MeasureBar, Note, RootSign, TempoSign } from '@/models/Neumes';
import InputUnit from './InputUnit.vue';
import InputBpm from './InputBpm.vue';
import { Scale, ScaleNote } from '@/models/Scales';
import { PageSetup } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';
import ButtonWithMenu, { ButtonWithMenuOption } from './ButtonWithMenu.vue';

@Component({
  components: {
    InputUnit,
    InputBpm,
    ButtonWithMenu,
  },
})
export default class ToolbarMartyria extends Vue {
  @Prop() element!: MartyriaElement;
  @Prop() pageSetup!: PageSetup;
  Fthora = Fthora;

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
      name: 'Varys',
      value: RootSign.Zo,
    },
    {
      name: 'Pl. Fourth',
      value: RootSign.Alpha,
    },
    {
      name: 'Pl. First',
      value: RootSign.Delta,
    },
    {
      name: 'Legetos',
      value: RootSign.Legetos,
    },
    {
      name: 'Nana',
      value: RootSign.Nana,
    },
    {
      name: 'Fourth',
      value: RootSign.DeltaDotted,
    },
    {
      name: 'Hard Chromatic Pa',
      value: RootSign.Squiggle,
    },
    {
      name: 'Hard Chromatic Di',
      value: RootSign.Tilt,
    },
    {
      name: 'Soft Chromatic Di',
      value: RootSign.SoftChromaticSquiggle,
    },
    {
      name: 'Hard Chromatic Ke',
      value: RootSign.SoftChromaticPaRootSign,
    },
    {
      name: 'Zygos',
      value: RootSign.Zygos,
    },
  ];

  get fthoraNotes() {
    if (
      this.element.fthora === Fthora.SoftChromaticThi_Top ||
      this.element.fthora === Fthora.SoftChromaticThi_Bottom
    ) {
      return [ScaleNote.Thi, ScaleNote.Vou];
    } else if (
      this.element.fthora === Fthora.SoftChromaticPa_Top ||
      this.element.fthora === Fthora.SoftChromaticPa_Bottom
    ) {
      return [ScaleNote.Ke, ScaleNote.Ga];
    } else if (
      this.element.fthora === Fthora.HardChromaticThi_Top ||
      this.element.fthora === Fthora.HardChromaticThi_Bottom
    ) {
      return [ScaleNote.Thi, ScaleNote.Vou];
    } else if (
      this.element.fthora === Fthora.HardChromaticPa_Top ||
      this.element.fthora === Fthora.HardChromaticPa_Bottom
    ) {
      return [ScaleNote.Pa, ScaleNote.Ga];
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
    if (note.includes('High')) {
      return note.replace('High', ' (High)');
    } else if (note.includes('Low')) {
      return note.replace('Low', ' (Low)');
    }

    return note;
  }

  private getScaleDisplayName(scale: Scale) {
    switch (scale) {
      case Scale.SoftChromatic:
        return 'Soft Chromatic';
      case Scale.HardChromatic:
        return 'Hard Chromatic';
      case Scale.EnharmonicGa:
        return 'Enharmonic from Ga';
      case Scale.EnharmonicZoHigh:
        return 'Enharmonic from High Zo';
      case Scale.EnharmonicVou:
        return 'Enharmonic from Vou';
      case Scale.EnharmonicZo:
        return 'Enharmonic from Zo';
      case Scale.EnharmonicVouHigh:
        return 'Enharmonic from High Vou';
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
    return this.spathiDisabled ? 'Spathi may only be placed on Ke' : '';
  }

  get klitonDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Thi
    );
  }

  get klitonTitle() {
    return this.klitonDisabled ? 'Kliton may only be placed on Thi' : '';
  }

  get zygosDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Thi
    );
  }

  get zygosTitle() {
    return this.zygosDisabled ? 'Zygos may only be placed on Thi' : '';
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
      ? 'Enharmonic fthora may only be placed on Ga, Zo, and Vou'
      : '';
  }

  get generalFlatDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Ke
    );
  }

  get generalFlatTitle() {
    return this.generalFlatDisabled
      ? 'General flat may only be placed on Ke'
      : '';
  }

  get generalSharpDisabled() {
    return (
      !this.pageSetup.noFthoraRestrictions && this.element.note !== Note.Ga
    );
  }

  get generalSharpTitle() {
    return this.generalSharpDisabled
      ? 'General sharp may only be placed on Ga'
      : '';
  }

  tempoMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: TempoSign.VeryQuickAbove,
      icon: require('@/assets/icons/agogi-poli-gorgi.svg'),
    },
    {
      neume: TempoSign.QuickerAbove,
      icon: require('@/assets/icons/agogi-gorgoteri.svg'),
    },
    {
      neume: TempoSign.QuickAbove,
      icon: require('@/assets/icons/agogi-gorgi.svg'),
    },
    {
      neume: TempoSign.MediumAbove,
      icon: require('@/assets/icons/agogi-mesi.svg'),
    },
    {
      neume: TempoSign.ModerateAbove,
      icon: require('@/assets/icons/agogi-metria.svg'),
    },
    {
      neume: TempoSign.SlowAbove,
      icon: require('@/assets/icons/agogi-argi.svg'),
    },
    {
      neume: TempoSign.SlowerAbove,
      icon: require('@/assets/icons/agogi-argoteri.svg'),
    },
    {
      neume: TempoSign.VerySlowAbove,
      icon: require('@/assets/icons/agogi-poli-argi.svg'),
    },
  ];

  barlineMenuOptions: ButtonWithMenuOption[] = [
    {
      neume: MeasureBar.MeasureBarTop,
      icon: require('@/assets/icons/barline-short-single.svg'),
    },
    {
      neume: MeasureBar.MeasureBarRight,
      icon: require('@/assets/icons/barline-single.svg'),
    },
  ];
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
