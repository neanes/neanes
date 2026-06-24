<template>
  <Toolbar class="chrome-toolbar" loop>
    <AppTooltip :tooltip="tooltip(Fthora.DiatonicNiLow_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.DiatonicNiLow_Top)"
      >
        <NeumeIcon name="fthora-diatonic-ni-low" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="tooltip(Fthora.DiatonicPa_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.DiatonicPa_Top)"
      >
        <NeumeIcon name="fthora-diatonic-pa" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="tooltip(Fthora.DiatonicVou_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.DiatonicVou_Top)"
      >
        <NeumeIcon name="fthora-diatonic-vou" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="tooltip(Fthora.DiatonicGa_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.DiatonicGa_Top)"
      >
        <NeumeIcon name="fthora-diatonic-ga" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="tooltip(Fthora.DiatonicThi_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.DiatonicThi_Top)"
      >
        <NeumeIcon name="fthora-diatonic-di" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="tooltip(Fthora.DiatonicKe_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.DiatonicKe_Top)"
      >
        <NeumeIcon name="fthora-diatonic-ke" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="tooltip(Fthora.DiatonicZo_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.DiatonicZo_Top)"
      >
        <NeumeIcon name="fthora-diatonic-zo" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="tooltip(Fthora.DiatonicNiHigh_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.DiatonicNiHigh_Top)"
      >
        <NeumeIcon name="fthora-diatonic-ni-high" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <AppTooltip :tooltip="tooltip(Fthora.SoftChromaticThi_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.SoftChromaticThi_Top)"
      >
        <NeumeIcon name="fthora-soft-chromatic-di" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="tooltip(Fthora.SoftChromaticPa_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.SoftChromaticPa_Top)"
      >
        <NeumeIcon name="fthora-soft-chromatic-ke" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <AppTooltip :tooltip="tooltip(Fthora.HardChromaticPa_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.HardChromaticPa_Top)"
      >
        <NeumeIcon name="fthora-hard-chromatic-pa" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="tooltip(Fthora.HardChromaticThi_Top)">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        @click="$emit('update:fthora', Fthora.HardChromaticThi_Top)"
      >
        <NeumeIcon name="fthora-hard-chromatic-di" />
      </ToolbarButton>
    </AppTooltip>
    <ToolbarSeparator />
    <AppTooltip :tooltip="enharmonicTitle">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        :aria-disabled="enharmonicDisabled"
        @click="
          !enharmonicDisabled && $emit('update:fthora', Fthora.Enharmonic_Top)
        "
      >
        <NeumeIcon name="fthora-enharmonic" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="generalFlatTitle">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        :aria-disabled="generalFlatDisabled"
        @click="
          !generalFlatDisabled && $emit('update:fthora', Fthora.GeneralFlat_Top)
        "
      >
        <NeumeIcon name="fthora-general-flat" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="generalSharpTitle">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        :aria-disabled="generalSharpDisabled"
        @click="
          !generalSharpDisabled &&
          $emit('update:fthora', Fthora.GeneralSharp_Top)
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
        :aria-disabled="zygosDisabled"
        @click="!zygosDisabled && $emit('update:fthora', Fthora.Zygos_Top)"
      >
        <NeumeIcon name="fthora-zygos" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="klitonTitle">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        :aria-disabled="klitonDisabled"
        @click="!klitonDisabled && $emit('update:fthora', Fthora.Kliton_Top)"
      >
        <NeumeIcon name="fthora-kliton" />
      </ToolbarButton>
    </AppTooltip>
    <AppTooltip :tooltip="spathiTitle">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        :aria-disabled="spathiDisabled"
        @click="!spathiDisabled && $emit('update:fthora', Fthora.Spathi_Top)"
      >
        <NeumeIcon name="fthora-spathi" />
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
      img-size="28px"
      :options="tempoMenuOptions"
      :tooltip="$t(($) => $.toolbar.martyria.tempoLeft, { ns: 'toolbar' })"
      @select="$emit('update:tempoLeft', $event)"
    />
    <ButtonWithMenu
      class="btnMenuTempoAbove"
      img-size="24px"
      :options="tempoMenuOptionsAbove"
      :tooltip="$t(($) => $.toolbar.martyria.tempo, { ns: 'toolbar' })"
      @select="$emit('update:tempo', $event)"
    />
    <ButtonWithMenu
      class="btnMenuTempoRight"
      img-size="28px"
      :options="tempoMenuOptions"
      :tooltip="$t(($) => $.toolbar.martyria.tempoRight, { ns: 'toolbar' })"
      @select="$emit('update:tempoRight', $event)"
    />
    <ToolbarSeparator />
    <AppTooltip :tooltip="alignRightTooltip">
      <ToolbarButton
        variant="secondary"
        class="chrome-button"
        :class="{ selected: element.alignRight }"
        @click="
          $emit('update', {
            alignRight: !element.alignRight,
          } as Partial<MartyriaElement>)
        "
      >
        <PhAlignRight class="size-4" weight="duotone" />
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
</template>

<script setup lang="ts">
import { PhAlignRight } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import type { PropType } from 'vue';
import { computed } from 'vue';

import type { AppTooltipValue } from '@/components/AppTooltip.types';
import AppTooltip from '@/components/AppTooltip.vue';
import {
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
} from '@/components/ui/toolbar';
import type { MartyriaElement } from '@/models/Element';
import { getFthoraLabelSelector } from '@/models/NeumeI18nMappings';
import {
  Fthora,
  MeasureBar,
  Note,
  QuantitativeNeume,
  TempoSign,
} from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import type { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { NeumeMappingService } from '@/services/NeumeMappingService';

import type { ButtonWithMenuOption } from './ButtonWithMenu.types';
import ButtonWithMenu from './ButtonWithMenu.vue';
import NeumeIcon from './NeumeIcon.vue';

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
    icon: 'agogi-poli-gorgi',
  },
  {
    neume: TempoSign.Quicker,
    icon: 'agogi-gorgoteri',
  },
  {
    neume: TempoSign.Quick,
    icon: 'agogi-gorgi',
  },
  {
    neume: TempoSign.Medium,
    icon: 'agogi-mesi',
  },
  {
    neume: TempoSign.Moderate,
    icon: 'agogi-metria',
  },
  {
    neume: TempoSign.Slow,
    icon: 'agogi-argi',
  },
  {
    neume: TempoSign.Slower,
    icon: 'agogi-argoteri',
  },
  {
    neume: TempoSign.VerySlow,
    icon: 'agogi-poli-argi',
  },
];

const tempoMenuOptionsAbove: ButtonWithMenuOption[] = [
  {
    neume: TempoSign.VeryQuickAbove,
    icon: 'agogi-poli-gorgi',
  },
  {
    neume: TempoSign.QuickerAbove,
    icon: 'agogi-gorgoteri',
  },
  {
    neume: TempoSign.QuickAbove,
    icon: 'agogi-gorgi',
  },
  {
    neume: TempoSign.MediumAbove,
    icon: 'agogi-mesi',
  },
  {
    neume: TempoSign.ModerateAbove,
    icon: 'agogi-metria',
  },
  {
    neume: TempoSign.SlowAbove,
    icon: 'agogi-argi',
  },
  {
    neume: TempoSign.SlowerAbove,
    icon: 'agogi-argoteri',
  },
  {
    neume: TempoSign.VerySlowAbove,
    icon: 'agogi-poli-argi',
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
  'update:tempoLeft',
  'update:tempo',
  'update:tempoRight',
]);

const { t } = useTranslation();

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

const alignRightTooltip = computed(
  (): AppTooltipValue => ({
    label: t(($) => $.toolbar.common.alignRight, { ns: 'toolbar' }),
    shortcut: props.neumeKeyboard.getMartyriaRightAlignTooltipKeys(),
  }),
);

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
.btnMenuTempoLeft :deep(.chrome-button) {
  justify-content: right;
}

.btnMenuTempoAbove :deep(.chrome-button) {
  align-items: start;
}

.btnMenuTempoRight :deep(.chrome-button) {
  justify-content: left;
}
</style>
