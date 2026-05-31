<template>
  <div class="neume-toolbar">
    <div v-if="secondaryNeume" class="row">
      <span>{{
        $t(($) => $.toolbar.neume.neumeSelect, { ns: 'toolbar' })
      }}</span>
      <span class="space"></span>
      <button
        v-if="tertiaryNeume"
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Tertiary' }"
        @click="$emit('update:innerNeume', 'Tertiary')"
      >
        <Neume
          :neume="tertiaryNeume"
          :font-family="pageSetup.neumeDefaultFontFamily"
        />
      </button>
      <button
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Secondary' }"
        @click="$emit('update:innerNeume', 'Secondary')"
      >
        <Neume
          :neume="secondaryNeume"
          :font-family="pageSetup.neumeDefaultFontFamily"
        />
      </button>
      <button
        class="btnNeumeSelect"
        :class="{ selected: innerNeume === 'Primary' }"
        @click="$emit('update:innerNeume', 'Primary')"
      >
        <Neume
          :neume="primaryNeume!"
          :font-family="pageSetup.neumeDefaultFontFamily"
        />
      </button>
    </div>
    <div class="row">
      <button
        class="neume-button"
        :disabled="klasmaDisabled"
        :title="tooltip(TimeNeume.Klasma_Top)"
        @click="$emit('update:klasma')"
      >
        <img src="@/assets/icons/time-klasma.svg" />
      </button>
      <ButtonWithMenu
        :options="apliMenuOptions"
        :disabled="apleDisabled"
        :title="tooltip(TimeNeume.Hapli)"
        @select="$emit('update:time', $event)"
      />
      <button
        class="neume-button"
        :disabled="koronisDisabled"
        :title="tooltip(TimeNeume.Koronis)"
        @click="$emit('update', { koronis: !element.koronis })"
      >
        <img src="@/assets/icons/time-koronis.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="stavrosDisabled"
        :title="tooltip(VocalExpressionNeume.Cross_Top)"
        @click="$emit('update', { stavros: !element.stavros })"
      >
        <img src="@/assets/icons/time-stavros.svg" />
      </button>
      <span class="space"></span>

      <ButtonWithMenu
        :options="gorgonMenuOptions"
        :title="tooltip(GorgonNeume.Gorgon_Top)"
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="digorgonMenuOptions"
        :title="tooltip(GorgonNeume.Digorgon)"
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="trigorgonMenuOptions"
        :title="tooltip(GorgonNeume.Trigorgon)"
        @select="updateGorgon($event)"
      />
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Vareia)"
        @click="$emit('update', { vareia: !element.vareia })"
      >
        <img src="@/assets/icons/quality-vareia.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Homalon)"
        @click="$emit('update:expression', VocalExpressionNeume.Homalon)"
      >
        <img src="@/assets/icons/quality-omalon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.HomalonConnecting)"
        @click="
          $emit('update:expression', VocalExpressionNeume.HomalonConnecting)
        "
      >
        <img src="@/assets/icons/quality-omalon-connecting.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Antikenoma)"
        @click="$emit('update:expression', VocalExpressionNeume.Antikenoma)"
      >
        <img src="@/assets/icons/quality-antikenoma.svg" />
      </button>
      <ButtonWithMenu
        :options="psifistonMenuOptions"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Psifiston)"
        @select="$emit('update:expression', $event)"
      />
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Heteron)"
        @click="$emit('update:expression', VocalExpressionNeume.Heteron)"
      >
        <img src="@/assets/icons/quality-heteron.svg" />
      </button>
      <ButtonWithMenu
        :options="heteronConnectingMenuOptions"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.HeteronConnecting)"
        @select="$emit('update:expression', $event)"
      />
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(VocalExpressionNeume.Endofonon)"
        @click="$emit('update:expression', VocalExpressionNeume.Endofonon)"
      >
        <img src="@/assets/icons/quality-endofonon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="expressionsDisabled"
        :title="tooltip(Tie.YfenBelow)"
        @click="$emit('update:tie', [Tie.YfenBelow, Tie.YfenAbove])"
      >
        <img src="@/assets/icons/tie-yfen-below.svg" />
      </button>
      <span class="space"></span>
      <ButtonWithMenu
        :options="flatMenuOptions"
        :disabled="accidentalsDisabled"
        :title="tooltip(Accidental.Flat_2_Right)"
        @select="updateAccidental($event)"
      />
      <ButtonWithMenu
        :options="sharpMenuOptions"
        :disabled="accidentalsDisabled"
        :title="tooltip(Accidental.Sharp_2_Left)"
        @select="updateAccidental($event)"
      />
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="argonDisabled"
        :title="tooltip(GorgonNeume.Argon)"
        @click="$emit('update:gorgon', [GorgonNeume.Argon])"
      >
        <img src="@/assets/icons/time-argon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="argonDisabled"
        :title="tooltip(GorgonNeume.Hemiolion)"
        @click="$emit('update:gorgon', [GorgonNeume.Hemiolion])"
      >
        <img src="@/assets/icons/time-diargon.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="argonDisabled"
        :title="tooltip(GorgonNeume.Diargon)"
        @click="$emit('update:gorgon', [GorgonNeume.Diargon])"
      >
        <img src="@/assets/icons/time-triargon.svg" />
      </button>
      <span class="space"></span>
      <ButtonWithMenu
        :options="barlineMenuOptions"
        :title="tooltip(MeasureBar.MeasureBarRight)"
        @select="$emit('update:measureBar', $event)"
      />
      <ButtonWithMenu
        :options="measureNumberMenuOptions"
        :title="tooltip(MeasureNumber.Two)"
        @select="$emit('update:measureNumber', $event)"
      />
      <button
        class="neume-button"
        :title="tooltip(NoteIndicator.Pa)"
        @click="$emit('update', { noteIndicator: !element.noteIndicator })"
      >
        <img draggable="false" src="@/assets/icons/note-ni.svg" />
      </button>
      <ButtonWithMenu
        :options="isonMenuOptions"
        :disabled="isonDisabled"
        :title="tooltip(Ison.Unison)"
        @select="$emit('update:ison', $event)"
      />
    </div>
    <div class="row">
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicNiLow_Top)"
        @click="
          updateFthora([Fthora.DiatonicNiLow_Top, Fthora.DiatonicNiLow_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ni-low.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicPa_Top)"
        @click="updateFthora([Fthora.DiatonicPa_Top, Fthora.DiatonicPa_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-pa.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicVou_Top)"
        @click="
          updateFthora([Fthora.DiatonicVou_Top, Fthora.DiatonicVou_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-vou.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicGa_Top)"
        @click="updateFthora([Fthora.DiatonicGa_Top, Fthora.DiatonicGa_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-ga.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicThi_Top)"
        @click="
          updateFthora([Fthora.DiatonicThi_Top, Fthora.DiatonicThi_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-di.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicKe_Top)"
        @click="updateFthora([Fthora.DiatonicKe_Top, Fthora.DiatonicKe_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-ke.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicZo_Top)"
        @click="updateFthora([Fthora.DiatonicZo_Top, Fthora.DiatonicZo_Bottom])"
      >
        <img src="@/assets/icons/fthora-diatonic-zo.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.DiatonicNiHigh_Top)"
        @click="
          updateFthora([
            Fthora.DiatonicNiHigh_Top,
            Fthora.DiatonicNiHigh_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-diatonic-ni-high.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.SoftChromaticThi_Top)"
        @click="
          updateFthora([
            Fthora.SoftChromaticThi_Top,
            Fthora.SoftChromaticThi_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-soft-chromatic-di.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.SoftChromaticPa_Top)"
        @click="
          updateFthora([
            Fthora.SoftChromaticPa_Top,
            Fthora.SoftChromaticPa_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-soft-chromatic-ke.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.HardChromaticPa_Top)"
        @click="
          updateFthora([
            Fthora.HardChromaticPa_Top,
            Fthora.HardChromaticPa_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-hard-chromatic-pa.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled"
        :title="tooltip(Fthora.HardChromaticThi_Top)"
        @click="
          updateFthora([
            Fthora.HardChromaticThi_Top,
            Fthora.HardChromaticThi_Bottom,
          ])
        "
      >
        <img src="@/assets/icons/fthora-hard-chromatic-di.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || enharmonicDisabled"
        :title="enharmonicTitle"
        @click="updateFthora([Fthora.Enharmonic_Top, Fthora.Enharmonic_Bottom])"
      >
        <img src="@/assets/icons/fthora-enharmonic.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || generalFlatDisabled"
        :title="generalFlatTitle"
        @click="
          updateFthora([Fthora.GeneralFlat_Top, Fthora.GeneralFlat_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-general-flat.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || generalSharpDisabled"
        :title="generalSharpTitle"
        @click="
          updateFthora([Fthora.GeneralSharp_Top, Fthora.GeneralSharp_Bottom])
        "
      >
        <img src="@/assets/icons/fthora-general-sharp.svg" />
      </button>
      <span class="space"></span>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || zygosDisabled"
        :title="zygosTitle"
        @click="updateFthora([Fthora.Zygos_Top, Fthora.Zygos_Bottom])"
      >
        <img src="@/assets/icons/fthora-zygos.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || klitonDisabled"
        :title="klitonTitle"
        @click="updateFthora([Fthora.Kliton_Top, Fthora.Kliton_Bottom])"
      >
        <img src="@/assets/icons/fthora-kliton.svg" />
      </button>
      <button
        class="neume-button"
        :disabled="fthoresDisabled || spathiDisabled"
        :title="spathiTitle"
        @click="updateFthora([Fthora.Spathi_Top, Fthora.Spathi_Bottom])"
      >
        <img src="@/assets/icons/fthora-spathi.svg" />
      </button>
    </div>
    <div class="row">
      <span class="space" />

      <span class="note-name">{{ noteDisplay }}</span>

      <span class="separator" />

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
        @update:model-value="$emit('update', { spaceAfter: $event })"
      />
      <span class="space"></span>

      <button @click="$emit('open-syllable-positioning-dialog')">
        {{ $t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' }) }}
      </button>
      <span class="space" />

      <div style="display: flex; align-items: center">
        <input
          id="toolbar:neume-ignore-attractions"
          type="checkbox"
          :checked="element.ignoreAttractions"
          @change="
            $emit('update', {
              ignoreAttractions: ($event.target as HTMLInputElement).checked,
            } as Partial<NoteElement>)
          "
        />
        <label for="toolbar:neume-ignore-attractions">{{
          $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
        }}</label>
      </div>

      <span class="space" />

      <div style="display: flex; align-items: center">
        <label class="right-space" for="toolbar:neume-accepts-lyrics">{{
          $t(($) => $.toolbar.neume.acceptsLyrics, { ns: 'toolbar' })
        }}</label>
        <select
          id="toolbar:neume-accepts-lyrics"
          :value="element.acceptsLyrics"
          @change="
            $emit('update', {
              acceptsLyrics: ($event.target as HTMLSelectElement).value,
            } as Partial<NoteElement>)
          "
        >
          <option :value="AcceptsLyricsOption.Default">
            {{
              $t(($) => $.toolbar.neume.acceptsLyricsDefault, { ns: 'toolbar' })
            }}
          </option>
          <option :value="AcceptsLyricsOption.Yes">
            {{ $t(($) => $.toolbar.neume.acceptsLyricsYes, { ns: 'toolbar' }) }}
          </option>
          <option :value="AcceptsLyricsOption.No">
            {{ $t(($) => $.toolbar.neume.acceptsLyricsNo, { ns: 'toolbar' }) }}
          </option>
          <option :value="AcceptsLyricsOption.MelismaOnly">
            {{
              $t(($) => $.toolbar.neume.acceptsLyricsMelismaOnly, {
                ns: 'toolbar',
              })
            }}
          </option>
        </select>
      </div>

      <template v-if="showChromaticFthoraNote">
        <span class="space" />
        <label class="right-space">{{
          $t(($) => $.toolbar.common.fthoraNote, { ns: 'toolbar' })
        }}</label>
        <select
          :value="chromaticFthoraNote"
          @change="
            updateChromaticFthoraNote(($event.target as HTMLInputElement).value)
          "
        >
          <option v-for="note in notes" :key="note.value" :value="note.value">
            {{ $t(note.label, { ns: 'model' }) }}
          </option>
        </select>
      </template>

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

import ButtonWithMenu, {
  ButtonWithMenuOption,
} from '@/components/ButtonWithMenu.vue';
import InputUnit from '@/components/InputUnit.vue';
import { AcceptsLyricsOption, NoteElement } from '@/models/Element';
import {
  getFthoraLabelSelector,
  getGorgonNeumeLabelSelector,
  getIsonLabelSelector,
  getMeasureBarLabelSelector,
  getNoteIndicatorLabelSelector,
  getNoteLabelSelector,
  getTimeNeumeLabelSelector,
  getVocalExpressionNeumeLabelSelector,
  ModelSelector,
} from '@/models/NeumeI18nMappings';
import {
  getPrimaryNeume,
  getSecondaryNeume,
  getTertiaryNeume,
  kentemataNeumes,
} from '@/models/NeumeReplacements';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  NoteIndicator,
  QuantitativeNeume,
  restNeumes,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { PageSetup } from '@/models/PageSetup';
import { ScaleNote } from '@/models/Scales';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { Unit } from '@/utils/Unit';

import Neume from './NeumeGlyph.vue';

const chromaticFthoras = [
  Fthora.SoftChromaticPa_Top,
  Fthora.SoftChromaticPa_Bottom,
  Fthora.SoftChromaticThi_Top,
  Fthora.SoftChromaticThi_Bottom,
  Fthora.HardChromaticPa_Top,
  Fthora.HardChromaticPa_Bottom,
  Fthora.HardChromaticThi_Top,
  Fthora.HardChromaticThi_Bottom,

  Fthora.SoftChromaticPa_TopSecondary,
  Fthora.SoftChromaticThi_TopSecondary,
  Fthora.HardChromaticPa_TopSecondary,
  Fthora.HardChromaticThi_TopSecondary,

  Fthora.SoftChromaticPa_TopTertiary,
  Fthora.SoftChromaticThi_TopTertiary,
  Fthora.HardChromaticPa_TopTertiary,
  Fthora.HardChromaticThi_TopTertiary,
];

type ChromaticFthoraNoteOption = {
  label: ModelSelector;
  value: ScaleNote;
};

type ToolbarNeumeTooltipNeume =
  | Fthora
  | TimeNeume
  | VocalExpressionNeume
  | GorgonNeume
  | MeasureBar
  | NoteIndicator
  | Ison
  | Tie.YfenBelow
  | Accidental.Flat_2_Right
  | Accidental.Sharp_2_Left
  | MeasureNumber.Two;

function enumHas<T extends string>(
  values: readonly T[],
  value: string,
): value is T {
  return values.includes(value as T);
}

const fthoraValues = Object.values(Fthora);
const timeNeumeValues = Object.values(TimeNeume);
const vocalExpressionNeumeValues = Object.values(VocalExpressionNeume);
const gorgonNeumeValues = Object.values(GorgonNeume);
const measureBarValues = Object.values(MeasureBar);
const noteIndicatorValues = Object.values(NoteIndicator);
const isonValues = Object.values(Ison);

const apliMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: TimeNeume.Tetrapli,
    icon: new URL('@/assets/icons/time-tetrapli.svg', import.meta.url).href,
  },
  {
    neume: TimeNeume.Tripli,
    icon: new URL('@/assets/icons/time-tripli.svg', import.meta.url).href,
  },
  {
    neume: TimeNeume.Dipli,
    icon: new URL('@/assets/icons/time-dipli.svg', import.meta.url).href,
  },
  {
    neume: TimeNeume.Hapli,
    icon: new URL('@/assets/icons/time-apli.svg', import.meta.url).href,
  },
];

const gorgonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: GorgonNeume.GorgonDottedRight,
    icon: new URL(
      '@/assets/icons/time-gorgon-dotted-right.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: GorgonNeume.GorgonDottedLeft,
    icon: new URL('@/assets/icons/time-gorgon-dotted-left.svg', import.meta.url)
      .href,
  },
  {
    neume: [GorgonNeume.Gorgon_Top, GorgonNeume.Gorgon_Bottom],
    icon: new URL('@/assets/icons/time-gorgon.svg', import.meta.url).href,
  },
];

const digorgonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: GorgonNeume.DigorgonDottedRight,
    icon: new URL(
      '@/assets/icons/time-digorgon-dotted-right.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: GorgonNeume.DigorgonDottedLeft2,
    icon: new URL(
      '@/assets/icons/time-digorgon-dotted-left-above.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: GorgonNeume.DigorgonDottedLeft1,
    icon: new URL(
      '@/assets/icons/time-digorgon-dotted-left-below.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: GorgonNeume.Digorgon,
    icon: new URL('@/assets/icons/time-digorgon.svg', import.meta.url).href,
  },
];

const trigorgonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: GorgonNeume.TrigorgonDottedRight,
    icon: new URL(
      '@/assets/icons/time-trigorgon-dotted-right.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: GorgonNeume.TrigorgonDottedLeft2,
    icon: new URL(
      '@/assets/icons/time-trigorgon-dotted-left-above.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: GorgonNeume.TrigorgonDottedLeft1,
    icon: new URL(
      '@/assets/icons/time-trigorgon-dotted-left-below.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: GorgonNeume.Trigorgon,
    icon: new URL('@/assets/icons/time-trigorgon.svg', import.meta.url).href,
  },
];

const psifistonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: VocalExpressionNeume.PsifistonSlanted,
    icon: new URL(
      '@/assets/icons/quality-psifiston-slanted.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: VocalExpressionNeume.Psifiston,
    icon: new URL('@/assets/icons/quality-psifiston.svg', import.meta.url).href,
  },
];

const heteronConnectingMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: VocalExpressionNeume.HeteronConnectingLong,
    icon: new URL(
      '@/assets/icons/quality-heteron-connecting-long.svg',
      import.meta.url,
    ).href,
  },
  {
    neume: VocalExpressionNeume.HeteronConnecting,
    icon: new URL(
      '@/assets/icons/quality-heteron-connecting.svg',
      import.meta.url,
    ).href,
  },
];

const flatMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: Accidental.Flat_8_Right,
    icon: new URL('@/assets/icons/alteration-yfesis8.svg', import.meta.url)
      .href,
  },
  {
    neume: Accidental.Flat_6_Right,
    icon: new URL('@/assets/icons/alteration-yfesis6.svg', import.meta.url)
      .href,
  },
  {
    neume: Accidental.Flat_4_Right,
    icon: new URL('@/assets/icons/alteration-yfesis4.svg', import.meta.url)
      .href,
  },
  {
    neume: Accidental.Flat_2_Right,
    icon: new URL('@/assets/icons/alteration-yfesis2.svg', import.meta.url)
      .href,
  },
];

const sharpMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: Accidental.Sharp_8_Left,
    icon: new URL('@/assets/icons/alteration-diesis8.svg', import.meta.url)
      .href,
  },
  {
    neume: Accidental.Sharp_6_Left,
    icon: new URL('@/assets/icons/alteration-diesis6.svg', import.meta.url)
      .href,
  },
  {
    neume: Accidental.Sharp_4_Left,
    icon: new URL('@/assets/icons/alteration-diesis4.svg', import.meta.url)
      .href,
  },
  {
    neume: Accidental.Sharp_2_Left,
    icon: new URL('@/assets/icons/alteration-diesis2.svg', import.meta.url)
      .href,
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

const measureNumberMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: MeasureNumber.Eight,
    icon: new URL('@/assets/icons/measure-number-8.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Seven,
    icon: new URL('@/assets/icons/measure-number-7.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Six,
    icon: new URL('@/assets/icons/measure-number-6.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Five,
    icon: new URL('@/assets/icons/measure-number-5.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Four,
    icon: new URL('@/assets/icons/measure-number-4.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Three,
    icon: new URL('@/assets/icons/measure-number-3.svg', import.meta.url).href,
  },
  {
    neume: MeasureNumber.Two,
    icon: new URL('@/assets/icons/measure-number-2.svg', import.meta.url).href,
  },
];

const isonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: Ison.ZoHigh,
    icon: new URL('@/assets/icons/ison-zo-high.svg', import.meta.url).href,
  },
  {
    neume: Ison.Ke,
    icon: new URL('@/assets/icons/ison-ke.svg', import.meta.url).href,
  },
  {
    neume: Ison.Thi,
    icon: new URL('@/assets/icons/ison-di.svg', import.meta.url).href,
  },
  {
    neume: Ison.Ga,
    icon: new URL('@/assets/icons/ison-ga.svg', import.meta.url).href,
  },
  {
    neume: Ison.Vou,
    icon: new URL('@/assets/icons/ison-vou.svg', import.meta.url).href,
  },
  {
    neume: Ison.Pa,
    icon: new URL('@/assets/icons/ison-pa.svg', import.meta.url).href,
  },
  {
    neume: Ison.Ni,
    icon: new URL('@/assets/icons/ison-ni.svg', import.meta.url).href,
  },
  {
    neume: Ison.Zo,
    icon: new URL('@/assets/icons/ison-zo.svg', import.meta.url).href,
  },
  {
    neume: Ison.KeLow,
    icon: new URL('@/assets/icons/ison-ke-low.svg', import.meta.url).href,
  },
  {
    neume: Ison.ThiLow,
    icon: new URL('@/assets/icons/ison-di-low.svg', import.meta.url).href,
  },
  {
    neume: Ison.Unison,
    icon: new URL('@/assets/icons/ison-unison.svg', import.meta.url).href,
  },
];

const props = defineProps({
  element: {
    type: Object as PropType<NoteElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  innerNeume: {
    type: String,
    required: true,
  },
  neumeKeyboard: {
    type: Object as PropType<NeumeKeyboard>,
    required: true,
  },
});

const emit = defineEmits([
  'update',
  'open-syllable-positioning-dialog',
  'update:accidental',
  'update:expression',
  'update:fthora',
  'update:gorgon',
  'update:innerNeume',
  'update:ison',
  'update:klasma',
  'update:measureBar',
  'update:measureNumber',
  'update:secondaryAccidental',
  'update:secondaryFthora',
  'update:secondaryGorgon',
  'update:sectionName',
  'update:tertiaryAccidental',
  'update:tertiaryFthora',
  'update:tie',
  'update:time',
]);

const { t } = useTranslation();

const primaryNeume = computed(() =>
  getPrimaryNeume(props.element.quantitativeNeume),
);

const secondaryNeume = computed(() =>
  getSecondaryNeume(props.element.quantitativeNeume),
);

const tertiaryNeume = computed(() =>
  getTertiaryNeume(props.element.quantitativeNeume),
);

const notes = computed((): ChromaticFthoraNoteOption[] => {
  if (
    props.element.fthora === Fthora.SoftChromaticThi_Top ||
    props.element.fthora === Fthora.SoftChromaticThi_Bottom ||
    props.element.secondaryFthora === Fthora.SoftChromaticThi_TopSecondary ||
    props.element.tertiaryFthora === Fthora.SoftChromaticThi_TopTertiary
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
    props.element.fthora === Fthora.SoftChromaticPa_Bottom ||
    props.element.secondaryFthora === Fthora.SoftChromaticPa_TopSecondary ||
    props.element.tertiaryFthora === Fthora.SoftChromaticPa_TopTertiary
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
    props.element.fthora === Fthora.HardChromaticThi_Bottom ||
    props.element.secondaryFthora === Fthora.HardChromaticThi_TopSecondary ||
    props.element.tertiaryFthora === Fthora.HardChromaticThi_TopTertiary
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
    props.element.fthora === Fthora.HardChromaticPa_Bottom ||
    props.element.secondaryFthora === Fthora.HardChromaticPa_TopSecondary ||
    props.element.tertiaryFthora === Fthora.HardChromaticPa_TopTertiary
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

const showChromaticFthoraNote = computed(
  () =>
    (props.innerNeume === 'Primary' &&
      props.element.fthora != null &&
      chromaticFthoras.includes(props.element.fthora)) ||
    (props.innerNeume === 'Secondary' &&
      props.element.secondaryFthora != null &&
      chromaticFthoras.includes(props.element.secondaryFthora)) ||
    (props.innerNeume === 'Tertiary' &&
      props.element.tertiaryFthora != null &&
      chromaticFthoras.includes(props.element.tertiaryFthora)),
);

const fthoresDisabled = computed(() =>
  restNeumes.includes(props.element.quantitativeNeume),
);

const expressionsDisabled = computed(() =>
  restNeumes.includes(props.element.quantitativeNeume),
);

const accidentalsDisabled = computed(() =>
  restNeumes.includes(props.element.quantitativeNeume),
);

const klasmaDisabled = computed(
  () =>
    restNeumes.includes(props.element.quantitativeNeume) ||
    kentemataNeumes.includes(props.element.quantitativeNeume),
);

const apleDisabled = computed(
  () =>
    restNeumes.includes(props.element.quantitativeNeume) ||
    kentemataNeumes.includes(props.element.quantitativeNeume),
);

const koronisDisabled = computed(
  () =>
    restNeumes.includes(props.element.quantitativeNeume) ||
    kentemataNeumes.includes(props.element.quantitativeNeume),
);

const stavrosDisabled = computed(
  () => props.element.quantitativeNeume !== QuantitativeNeume.RunningElaphron,
);

const argonDisabled = computed(
  () =>
    props.element.quantitativeNeume !== QuantitativeNeume.KentemataPlusOligon,
);

const isonDisabled = computed(() =>
  restNeumes.includes(props.element.quantitativeNeume),
);

const spathiDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ke) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ga),
);

const spathiTitle = computed(() =>
  spathiDisabled.value
    ? t(($) => $.toolbar.common.spathiDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Spathi_Top),
);

const klitonDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Thi),
);

const klitonTitle = computed(() =>
  klitonDisabled.value
    ? t(($) => $.toolbar.common.klitonDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Kliton_Top),
);

const zygosDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Thi),
);

const zygosTitle = computed(() =>
  zygosDisabled.value
    ? t(($) => $.toolbar.common.zygosDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Zygos_Top),
);

const enharmonicDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Zo) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.ZoHigh) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Vou) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.VouHigh) &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ga),
);

const enharmonicTitle = computed(() =>
  enharmonicDisabled.value
    ? t(($) => $.toolbar.common.enharmonicDisabled, { ns: 'toolbar' })
    : tooltip(Fthora.Enharmonic_Top),
);

const generalFlatDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ke),
);

const generalFlatTitle = computed(() =>
  generalFlatDisabled.value
    ? t(($) => $.toolbar.common.generalFlatDisabled, {
        ns: 'toolbar',
      })
    : tooltip(Fthora.GeneralFlat_Top),
);

const generalSharpDisabled = computed(
  () =>
    !props.pageSetup.noFthoraRestrictions &&
    !props.element.scaleNotesVirtual.includes(ScaleNote.Ga),
);

const generalSharpTitle = computed(() =>
  generalSharpDisabled.value
    ? t(($) => $.toolbar.common.generalSharpDisabled, {
        ns: 'toolbar',
      })
    : tooltip(Fthora.GeneralSharp_Top),
);

const chromaticFthoraNote = computed(() => {
  if (props.innerNeume === 'Secondary') {
    return props.element.secondaryChromaticFthoraNote;
  } else if (props.innerNeume === 'Tertiary') {
    return props.element.tertiaryChromaticFthoraNote;
  } else {
    return props.element.chromaticFthoraNote;
  }
});

const noteDisplay = computed(() =>
  props.element.scaleNotes
    .map((x) => t(getNoteLabelSelector(x), { ns: 'model' }))
    .join(' - '),
);

const spaceAfterMax = computed(() =>
  Math.round(Unit.toPt(props.pageSetup.pageWidth)),
);

function translateNeumeDisplayName(neume: ToolbarNeumeTooltipNeume) {
  switch (neume) {
    case Tie.YfenBelow:
      return t(($) => $.toolbar.neume.yfen, { ns: 'toolbar' });
    case Accidental.Flat_2_Right:
      return t(($) => $.toolbar.neume.flat, { ns: 'toolbar' });
    case Accidental.Sharp_2_Left:
      return t(($) => $.toolbar.neume.sharp, { ns: 'toolbar' });
    case MeasureBar.MeasureBarRight:
      return t(($) => $.toolbar.common.measureBar, { ns: 'toolbar' });
    case MeasureNumber.Two:
      return t(($) => $.toolbar.neume.measureNumber, {
        ns: 'toolbar',
      });
    case NoteIndicator.Pa:
      return t(($) => $.toolbar.neume.noteIndicator, {
        ns: 'toolbar',
      });
    case Ison.Unison:
      return t(($) => $.toolbar.neume.isonIndicator, {
        ns: 'toolbar',
      });
  }

  if (enumHas(fthoraValues, neume)) {
    return t(getFthoraLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(timeNeumeValues, neume)) {
    return t(getTimeNeumeLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(vocalExpressionNeumeValues, neume)) {
    return t(getVocalExpressionNeumeLabelSelector(neume), {
      ns: 'model',
    });
  }

  if (enumHas(gorgonNeumeValues, neume)) {
    return t(getGorgonNeumeLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(measureBarValues, neume)) {
    return t(getMeasureBarLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(noteIndicatorValues, neume)) {
    return t(getNoteIndicatorLabelSelector(neume), { ns: 'model' });
  }

  if (enumHas(isonValues, neume)) {
    const displayName = getIsonLabelSelector(neume);
    return displayName == null
      ? String(neume)
      : t(displayName, { ns: 'model' });
  }

  return String(neume);
}

function updateFthora(args: string[]) {
  if (props.innerNeume === 'Secondary') {
    emit('update:secondaryFthora', args[0] + props.innerNeume);
  } else if (props.innerNeume === 'Tertiary') {
    emit('update:tertiaryFthora', args[0] + props.innerNeume);
  } else {
    emit('update:fthora', args);
  }
}

function updateChromaticFthoraNote(note: string) {
  if (props.innerNeume === 'Secondary') {
    emit('update', {
      secondaryChromaticFthoraNote: note,
    } as Partial<NoteElement>);
  } else if (props.innerNeume === 'Tertiary') {
    emit('update', {
      tertiaryChromaticFthoraNote: note,
    } as Partial<NoteElement>);
  } else {
    emit('update', {
      chromaticFthoraNote: note,
    } as Partial<NoteElement>);
  }
}

function updateGorgon(args: string | string[]) {
  if (
    props.innerNeume === 'Secondary' &&
    props.element.quantitativeNeume !== QuantitativeNeume.Hyporoe
  ) {
    if (Array.isArray(args)) {
      emit('update:secondaryGorgon', GorgonNeume.GorgonSecondary);
    } else {
      emit('update:secondaryGorgon', args + props.innerNeume);
    }
  } else {
    emit('update:gorgon', args);
  }
}

function updateAccidental(args: string) {
  // There is some admittedly confusing logic here regarding the hyporoe.
  // Compare to handleHyporoe in the Analysis Service.

  if (props.innerNeume === 'Secondary') {
    if (
      props.element.quantitativeNeume == QuantitativeNeume.Hyporoe &&
      args.startsWith('Flat')
    ) {
      emit('update:accidental', args);
    } else {
      emit('update:secondaryAccidental', args + props.innerNeume);
    }
  } else if (props.innerNeume === 'Tertiary') {
    emit('update:tertiaryAccidental', args + props.innerNeume);
  } else {
    if (
      props.element.quantitativeNeume == QuantitativeNeume.Hyporoe &&
      args.startsWith('Flat')
    ) {
      emit('update:secondaryAccidental', args + 'Secondary');
    } else {
      emit('update:accidental', args);
    }
  }
}

function tooltip(neume: ToolbarNeumeTooltipNeume) {
  const label = translateNeumeDisplayName(neume);
  const mapping = props.neumeKeyboard.findMappingForNeume(neume);
  if (mapping) {
    return `${label} (${props.neumeKeyboard.generateTooltip(mapping)})`;
  } else if (neume === TimeNeume.Klasma_Top) {
    return `${label} (${props.neumeKeyboard.getKlasmaKeyTooltip()})`;
  } else if (neume === NoteIndicator.Pa) {
    return `${label} (${props.neumeKeyboard.getNoteIndicatorKeyTooltip()})`;
  } else {
    return label;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.neume-toolbar {
  background-color: lightgray;

  padding: 0.25rem;

  --btn-size: 32px;
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

.neume-button img {
  height: var(--btn-size);
  width: var(--btn-size);
}

.note-name {
  width: 12ch;
  text-align: center;
}

label.right-space {
  margin-right: 0.5rem;
}

.space {
  width: 16px;
}

.separator {
  margin: 0 16px;
  border-right: 1px solid black;
  height: 16px;
}

.btnNeumeSelect {
  font-size: 24px;
  height: 32px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btnNeumeSelect.selected {
  background-color: var(--btn-color-selected);
}
</style>
