<template>
  <div class="chrome-toolbar">
    <Toolbar class="chrome-toolbar-row" loop>
      <AppTooltip :tooltip="tooltip(TimeNeume.Klasma_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="klasmaDisabled"
          @click="!klasmaDisabled && $emit('update:klasma')"
        >
          <NeumeIcon name="time-klasma" />
        </ToolbarButton>
      </AppTooltip>
      <ButtonWithMenu
        :options="apliMenuOptions"
        :disabled="apleDisabled"
        :tooltip="tooltip(TimeNeume.Hapli)"
        @select="$emit('update:time', $event)"
      />
      <AppTooltip :tooltip="tooltip(TimeNeume.Koronis)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="koronisDisabled"
          @click="
            !koronisDisabled && $emit('update', { koronis: !element.koronis })
          "
        >
          <NeumeIcon name="time-koronis" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Cross_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="stavrosDisabled"
          @click="
            !stavrosDisabled && $emit('update', { stavros: !element.stavros })
          "
        >
          <NeumeIcon name="time-stavros" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />

      <ButtonWithMenu
        :options="gorgonMenuOptions"
        :tooltip="tooltip(GorgonNeume.Gorgon_Top)"
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="digorgonMenuOptions"
        :tooltip="tooltip(GorgonNeume.Digorgon)"
        @select="updateGorgon($event)"
      />
      <ButtonWithMenu
        :options="trigorgonMenuOptions"
        :tooltip="tooltip(GorgonNeume.Trigorgon)"
        @select="updateGorgon($event)"
      />
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Vareia)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled && $emit('update', { vareia: !element.vareia })
          "
        >
          <NeumeIcon name="quality-vareia" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Homalon)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.Homalon)
          "
        >
          <NeumeIcon name="quality-omalon" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.HomalonConnecting)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.HomalonConnecting)
          "
        >
          <NeumeIcon name="quality-omalon-connecting" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Antikenoma)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.Antikenoma)
          "
        >
          <NeumeIcon name="quality-antikenoma" />
        </ToolbarButton>
      </AppTooltip>
      <ButtonWithMenu
        :options="psifistonMenuOptions"
        :disabled="expressionsDisabled"
        :tooltip="tooltip(VocalExpressionNeume.Psifiston)"
        @select="$emit('update:expression', $event)"
      />
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Heteron)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.Heteron)
          "
        >
          <NeumeIcon name="quality-heteron" />
        </ToolbarButton>
      </AppTooltip>
      <ButtonWithMenu
        :options="heteronConnectingMenuOptions"
        :disabled="expressionsDisabled"
        :tooltip="tooltip(VocalExpressionNeume.HeteronConnecting)"
        @select="$emit('update:expression', $event)"
      />
      <AppTooltip :tooltip="tooltip(VocalExpressionNeume.Endofonon)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:expression', VocalExpressionNeume.Endofonon)
          "
        >
          <NeumeIcon name="quality-endofonon" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Tie.YfenBelow)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="expressionsDisabled"
          @click="
            !expressionsDisabled &&
            $emit('update:tie', [Tie.YfenBelow, Tie.YfenAbove])
          "
        >
          <NeumeIcon name="tie-yfen-below" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <ButtonWithMenu
        :options="flatMenuOptions"
        :disabled="accidentalsDisabled"
        :tooltip="tooltip(Accidental.Flat_2_Right)"
        @select="updateAccidental($event)"
      />
      <ButtonWithMenu
        :options="sharpMenuOptions"
        :disabled="accidentalsDisabled"
        :tooltip="tooltip(Accidental.Sharp_2_Left)"
        @select="updateAccidental($event)"
      />
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(GorgonNeume.Argon)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="argonDisabled"
          @click="!argonDisabled && $emit('update:gorgon', [GorgonNeume.Argon])"
        >
          <NeumeIcon name="time-argon" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(GorgonNeume.Hemiolion)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="argonDisabled"
          @click="
            !argonDisabled && $emit('update:gorgon', [GorgonNeume.Hemiolion])
          "
        >
          <NeumeIcon name="time-diargon" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(GorgonNeume.Diargon)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="argonDisabled"
          @click="
            !argonDisabled && $emit('update:gorgon', [GorgonNeume.Diargon])
          "
        >
          <NeumeIcon name="time-triargon" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <ButtonWithMenu
        :options="barlineMenuOptions"
        :tooltip="tooltip(MeasureBar.MeasureBarRight)"
        @select="$emit('update:measureBar', $event)"
      />
      <ButtonWithMenu
        :options="measureNumberMenuOptions"
        :tooltip="tooltip(MeasureNumber.Two)"
        @select="$emit('update:measureNumber', $event)"
      />
      <AppTooltip :tooltip="tooltip(NoteIndicator.Pa)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          @click="$emit('update', { noteIndicator: !element.noteIndicator })"
        >
          <NeumeIcon name="note-ni" />
        </ToolbarButton>
      </AppTooltip>
      <ButtonWithMenu
        :options="isonMenuOptions"
        :disabled="isonDisabled"
        :tooltip="tooltip(Ison.Unison)"
        @select="$emit('update:ison', $event)"
      />
    </Toolbar>
    <Toolbar class="chrome-toolbar-row" loop>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicNiLow_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.DiatonicNiLow_Top,
              Fthora.DiatonicNiLow_Bottom,
            ])
          "
        >
          <NeumeIcon name="fthora-diatonic-ni-low" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicPa_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicPa_Top, Fthora.DiatonicPa_Bottom])
          "
        >
          <NeumeIcon name="fthora-diatonic-pa" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicVou_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicVou_Top, Fthora.DiatonicVou_Bottom])
          "
        >
          <NeumeIcon name="fthora-diatonic-vou" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicGa_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicGa_Top, Fthora.DiatonicGa_Bottom])
          "
        >
          <NeumeIcon name="fthora-diatonic-ga" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicThi_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicThi_Top, Fthora.DiatonicThi_Bottom])
          "
        >
          <NeumeIcon name="fthora-diatonic-di" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicKe_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicKe_Top, Fthora.DiatonicKe_Bottom])
          "
        >
          <NeumeIcon name="fthora-diatonic-ke" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicZo_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([Fthora.DiatonicZo_Top, Fthora.DiatonicZo_Bottom])
          "
        >
          <NeumeIcon name="fthora-diatonic-zo" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.DiatonicNiHigh_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.DiatonicNiHigh_Top,
              Fthora.DiatonicNiHigh_Bottom,
            ])
          "
        >
          <NeumeIcon name="fthora-diatonic-ni-high" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(Fthora.SoftChromaticThi_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.SoftChromaticThi_Top,
              Fthora.SoftChromaticThi_Bottom,
            ])
          "
        >
          <NeumeIcon name="fthora-soft-chromatic-di" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.SoftChromaticPa_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.SoftChromaticPa_Top,
              Fthora.SoftChromaticPa_Bottom,
            ])
          "
        >
          <NeumeIcon name="fthora-soft-chromatic-ke" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="tooltip(Fthora.HardChromaticPa_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.HardChromaticPa_Top,
              Fthora.HardChromaticPa_Bottom,
            ])
          "
        >
          <NeumeIcon name="fthora-hard-chromatic-pa" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="tooltip(Fthora.HardChromaticThi_Top)">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled"
          @click="
            !fthoresDisabled &&
            updateFthora([
              Fthora.HardChromaticThi_Top,
              Fthora.HardChromaticThi_Bottom,
            ])
          "
        >
          <NeumeIcon name="fthora-hard-chromatic-di" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="enharmonicTitle">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled || enharmonicDisabled"
          @click="
            !(fthoresDisabled || enharmonicDisabled) &&
            updateFthora([Fthora.Enharmonic_Top, Fthora.Enharmonic_Bottom])
          "
        >
          <NeumeIcon name="fthora-enharmonic" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="generalFlatTitle">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled || generalFlatDisabled"
          @click="
            !(fthoresDisabled || generalFlatDisabled) &&
            updateFthora([Fthora.GeneralFlat_Top, Fthora.GeneralFlat_Bottom])
          "
        >
          <NeumeIcon name="fthora-general-flat" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="generalSharpTitle">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled || generalSharpDisabled"
          @click="
            !(fthoresDisabled || generalSharpDisabled) &&
            updateFthora([Fthora.GeneralSharp_Top, Fthora.GeneralSharp_Bottom])
          "
        >
          <NeumeIcon name="fthora-general-sharp" />
        </ToolbarButton>
      </AppTooltip>
      <ToolbarSeparator />
      <AppTooltip :tooltip="zygosTitle">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled || zygosDisabled"
          @click="
            !(fthoresDisabled || zygosDisabled) &&
            updateFthora([Fthora.Zygos_Top, Fthora.Zygos_Bottom])
          "
        >
          <NeumeIcon name="fthora-zygos" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="klitonTitle">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled || klitonDisabled"
          @click="
            !(fthoresDisabled || klitonDisabled) &&
            updateFthora([Fthora.Kliton_Top, Fthora.Kliton_Bottom])
          "
        >
          <NeumeIcon name="fthora-kliton" />
        </ToolbarButton>
      </AppTooltip>
      <AppTooltip :tooltip="spathiTitle">
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          :aria-disabled="fthoresDisabled || spathiDisabled"
          @click="
            !(fthoresDisabled || spathiDisabled) &&
            updateFthora([Fthora.Spathi_Top, Fthora.Spathi_Bottom])
          "
        >
          <NeumeIcon name="fthora-spathi" />
        </ToolbarButton>
      </AppTooltip>
      <template v-if="secondaryNeume">
        <ToolbarSeparator />
        <span :id="neumeSelectLabelId" class="chrome-toolbar-label">{{
          $t(($) => $.toolbar.neume.neumeSelect, { ns: 'toolbar' })
        }}</span>
        <ToolbarToggleGroup
          type="single"
          :model-value="innerNeume"
          :aria-labelledby="neumeSelectLabelId"
          @update:model-value="updateInnerNeume"
        >
          <ToolbarToggleItem
            v-if="tertiaryNeume"
            :value="NeumeSelection.Tertiary"
            class="chrome-button neume-select-button"
            :aria-label="NeumeSelection.Tertiary"
          >
            <Neume
              :neume="tertiaryNeume"
              :font-family="pageSetup.neumeDefaultFontFamily"
            />
          </ToolbarToggleItem>
          <ToolbarToggleItem
            :value="NeumeSelection.Secondary"
            class="chrome-button neume-select-button"
            :aria-label="NeumeSelection.Secondary"
          >
            <Neume
              :neume="secondaryNeume"
              :font-family="pageSetup.neumeDefaultFontFamily"
            />
          </ToolbarToggleItem>
          <ToolbarToggleItem
            :value="NeumeSelection.Primary"
            class="chrome-button neume-select-button"
            :aria-label="NeumeSelection.Primary"
          >
            <Neume
              :neume="primaryNeume!"
              :font-family="pageSetup.neumeDefaultFontFamily"
            />
          </ToolbarToggleItem>
        </ToolbarToggleGroup>
      </template>
      <ToolbarSeparator />
      <AppTooltip
        :tooltip="$t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' })"
      >
        <ToolbarButton
          variant="secondary"
          class="chrome-button"
          @click="$emit('open-syllable-positioning-dialog')"
        >
          <PhCrosshair class="size-4" />
        </ToolbarButton>
      </AppTooltip>
    </Toolbar>
  </div>
</template>

<script setup lang="ts">
import { PhCrosshair } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import type { PropType } from 'vue';
import { computed, useId } from 'vue';

import type { AppTooltipValue } from '@/components/AppTooltip.types';
import AppTooltip from '@/components/AppTooltip.vue';
import type { ButtonWithMenuOption } from '@/components/ButtonWithMenu.types';
import ButtonWithMenu from '@/components/ButtonWithMenu.vue';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarToggleGroup,
  ToolbarToggleItem,
} from '@/components/ui/toolbar';
import type { NoteElement } from '@/models/Element';
import {
  getFthoraLabelSelector,
  getGorgonNeumeLabelSelector,
  getIsonLabelSelector,
  getMeasureBarLabelSelector,
  getNoteIndicatorLabelSelector,
  getTimeNeumeLabelSelector,
  getVocalExpressionNeumeLabelSelector,
} from '@/models/NeumeI18nMappings';
import {
  getPrimaryNeume,
  getSecondaryGorgonNeume,
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
  NeumeSelection,
  NoteIndicator,
  QuantitativeNeume,
  restNeumes,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { ScaleNote } from '@/models/Scales';
import type { NeumeKeyboard } from '@/services/NeumeKeyboard';

import Neume from './NeumeGlyph.vue';
import NeumeIcon from './NeumeIcon.vue';

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
const neumeSelectionValues = Object.values(NeumeSelection);

const apliMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: TimeNeume.Tetrapli,
    icon: 'time-tetrapli',
  },
  {
    neume: TimeNeume.Tripli,
    icon: 'time-tripli',
  },
  {
    neume: TimeNeume.Dipli,
    icon: 'time-dipli',
  },
  {
    neume: TimeNeume.Hapli,
    icon: 'time-apli',
  },
];

const gorgonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: GorgonNeume.GorgonDottedRight,
    icon: 'time-gorgon-dotted-right',
  },
  {
    neume: GorgonNeume.GorgonDottedLeft,
    icon: 'time-gorgon-dotted-left',
  },
  {
    neume: [GorgonNeume.Gorgon_Top, GorgonNeume.Gorgon_Bottom],
    icon: 'time-gorgon',
  },
];

const digorgonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: GorgonNeume.DigorgonDottedRight,
    icon: 'time-digorgon-dotted-right',
  },
  {
    neume: GorgonNeume.DigorgonDottedLeft2,
    icon: 'time-digorgon-dotted-left-above',
  },
  {
    neume: GorgonNeume.DigorgonDottedLeft1,
    icon: 'time-digorgon-dotted-left-below',
  },
  {
    neume: GorgonNeume.Digorgon,
    icon: 'time-digorgon',
  },
];

const trigorgonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: GorgonNeume.TrigorgonDottedRight,
    icon: 'time-trigorgon-dotted-right',
  },
  {
    neume: GorgonNeume.TrigorgonDottedLeft2,
    icon: 'time-trigorgon-dotted-left-above',
  },
  {
    neume: GorgonNeume.TrigorgonDottedLeft1,
    icon: 'time-trigorgon-dotted-left-below',
  },
  {
    neume: GorgonNeume.Trigorgon,
    icon: 'time-trigorgon',
  },
];

const psifistonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: VocalExpressionNeume.PsifistonSlanted,
    icon: 'quality-psifiston-slanted',
  },
  {
    neume: VocalExpressionNeume.Psifiston,
    icon: 'quality-psifiston',
  },
];

const heteronConnectingMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: VocalExpressionNeume.HeteronConnectingLong,
    icon: 'quality-heteron-connecting-long',
  },
  {
    neume: VocalExpressionNeume.HeteronConnecting,
    icon: 'quality-heteron-connecting',
  },
];

const flatMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: Accidental.Flat_8_Right,
    icon: 'alteration-yfesis8',
  },
  {
    neume: Accidental.Flat_6_Right,
    icon: 'alteration-yfesis6',
  },
  {
    neume: Accidental.Flat_4_Right,
    icon: 'alteration-yfesis4',
  },
  {
    neume: Accidental.Flat_2_Right,
    icon: 'alteration-yfesis2',
  },
];

const sharpMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: Accidental.Sharp_8_Left,
    icon: 'alteration-diesis8',
  },
  {
    neume: Accidental.Sharp_6_Left,
    icon: 'alteration-diesis6',
  },
  {
    neume: Accidental.Sharp_4_Left,
    icon: 'alteration-diesis4',
  },
  {
    neume: Accidental.Sharp_2_Left,
    icon: 'alteration-diesis2',
  },
];

const barlineMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: MeasureBar.MeasureBarShortTheseos,
    icon: 'barline-short-theseos',
  },
  {
    neume: MeasureBar.MeasureBarShortDouble,
    icon: 'barline-short-double',
  },
  {
    neume: MeasureBar.MeasureBarTop,
    icon: 'barline-short-single',
  },
  {
    neume: MeasureBar.MeasureBarTheseos,
    icon: 'barline-theseos',
  },
  {
    neume: MeasureBar.MeasureBarDouble,
    icon: 'barline-double',
  },
  {
    neume: MeasureBar.MeasureBarRight,
    icon: 'barline-single',
  },
];

const measureNumberMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: MeasureNumber.Eight,
    icon: 'measure-number-8',
  },
  {
    neume: MeasureNumber.Seven,
    icon: 'measure-number-7',
  },
  {
    neume: MeasureNumber.Six,
    icon: 'measure-number-6',
  },
  {
    neume: MeasureNumber.Five,
    icon: 'measure-number-5',
  },
  {
    neume: MeasureNumber.Four,
    icon: 'measure-number-4',
  },
  {
    neume: MeasureNumber.Three,
    icon: 'measure-number-3',
  },
  {
    neume: MeasureNumber.Two,
    icon: 'measure-number-2',
  },
];

const isonMenuOptions: ButtonWithMenuOption[] = [
  {
    neume: Ison.ZoHigh,
    icon: 'ison-zo-high',
  },
  {
    neume: Ison.Ke,
    icon: 'ison-ke',
  },
  {
    neume: Ison.Thi,
    icon: 'ison-di',
  },
  {
    neume: Ison.Ga,
    icon: 'ison-ga',
  },
  {
    neume: Ison.Vou,
    icon: 'ison-vou',
  },
  {
    neume: Ison.Pa,
    icon: 'ison-pa',
  },
  {
    neume: Ison.Ni,
    icon: 'ison-ni',
  },
  {
    neume: Ison.Zo,
    icon: 'ison-zo',
  },
  {
    neume: Ison.KeLow,
    icon: 'ison-ke-low',
  },
  {
    neume: Ison.ThiLow,
    icon: 'ison-di-low',
  },
  {
    neume: Ison.Unison,
    icon: 'ison-unison',
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
    type: String as PropType<NeumeSelection>,
    required: true,
  },
  neumeKeyboard: {
    type: Object as PropType<NeumeKeyboard>,
    required: true,
  },
});

const emit = defineEmits([
  'update',
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
  'update:tertiaryAccidental',
  'update:tertiaryFthora',
  'update:tie',
  'update:time',
  'open-syllable-positioning-dialog',
]);

const neumeSelectLabelId = useId();

const { t } = useTranslation();

function updateInnerNeume(value: unknown) {
  if (typeof value === 'string' && enumHas(neumeSelectionValues, value)) {
    emit('update:innerNeume', value);
  }
}

const primaryNeume = computed(() =>
  getPrimaryNeume(props.element.quantitativeNeume),
);

const secondaryNeume = computed(() =>
  getSecondaryNeume(props.element.quantitativeNeume),
);

const tertiaryNeume = computed(() =>
  getTertiaryNeume(props.element.quantitativeNeume),
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

function translateNeumeDisplayName(neume: ToolbarNeumeTooltipNeume) {
  switch (neume) {
    case Tie.YfenBelow:
      return t(($) => $.model.neume.vocalExpression.yfen, { ns: 'model' });
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
  if (props.innerNeume === NeumeSelection.Secondary) {
    emit('update:secondaryFthora', args[0] + props.innerNeume);
  } else if (props.innerNeume === NeumeSelection.Tertiary) {
    emit('update:tertiaryFthora', args[0] + props.innerNeume);
  } else {
    emit('update:fthora', args);
  }
}

function updateGorgon(args: GorgonNeume | GorgonNeume[]) {
  if (
    props.innerNeume === NeumeSelection.Secondary &&
    props.element.quantitativeNeume !== QuantitativeNeume.Hyporoe
  ) {
    const secondaryGorgonNeume = getSecondaryGorgonNeume(args);

    if (secondaryGorgonNeume != null) {
      emit('update:secondaryGorgon', secondaryGorgonNeume);
      return;
    }
  }

  emit('update:gorgon', args);
}

function updateAccidental(args: string) {
  // There is some admittedly confusing logic here regarding the hyporoe.
  // Compare to handleHyporoe in the Analysis Service.

  if (props.innerNeume === NeumeSelection.Secondary) {
    if (
      props.element.quantitativeNeume === QuantitativeNeume.Hyporoe &&
      args.startsWith('Flat')
    ) {
      emit('update:accidental', args);
    } else {
      emit('update:secondaryAccidental', args + props.innerNeume);
    }
  } else if (props.innerNeume === NeumeSelection.Tertiary) {
    emit('update:tertiaryAccidental', args + props.innerNeume);
  } else {
    if (
      props.element.quantitativeNeume === QuantitativeNeume.Hyporoe &&
      args.startsWith('Flat')
    ) {
      emit('update:secondaryAccidental', args + NeumeSelection.Secondary);
    } else {
      emit('update:accidental', args);
    }
  }
}

function tooltip(neume: ToolbarNeumeTooltipNeume): AppTooltipValue {
  const label = translateNeumeDisplayName(neume);
  const mapping = props.neumeKeyboard.findMappingForNeume(neume);
  if (mapping) {
    return {
      label,
      shortcut: props.neumeKeyboard.generateTooltipKeys(mapping),
    };
  } else if (neume === TimeNeume.Klasma_Top) {
    return { label, shortcut: props.neumeKeyboard.getKlasmaKeyTooltipKeys() };
  } else if (neume === NoteIndicator.Pa) {
    return {
      label,
      shortcut: props.neumeKeyboard.getNoteIndicatorKeyTooltipKeys(),
    };
  } else {
    return label;
  }
}
</script>

<style scoped>
.neume-select-button {
  font-size: 24px;
}
</style>
