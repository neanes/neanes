<template>
  <PaneAccordion
    :open-sections="openSections"
    @update:open-sections="$emit('update:open-sections', $event)"
  >
    <template #legend>{{
      $t(($) => $.toolbar.common.neume, { ns: 'toolbar' })
    }}</template>

    <PaneSection
      value="neume"
      :title="$t(($) => $.toolbar.common.neume, { ns: 'toolbar' })"
    >
      <Field v-if="showChromaticFthoraNote">
        <FieldLabel for="properties-neume-fthora-note">{{
          $t(($) => $.toolbar.common.fthoraNote, { ns: 'toolbar' })
        }}</FieldLabel>
        <Select
          :model-value="chromaticFthoraNote"
          @update:model-value="updateChromaticFthoraNote"
        >
          <SelectTrigger id="properties-neume-fthora-note" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem
                v-for="note in notes"
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
        <FieldLabel for="properties-neume-accepts-lyrics">{{
          $t(($) => $.toolbar.neume.acceptsLyrics, { ns: 'toolbar' })
        }}</FieldLabel>
        <Select
          :model-value="element.acceptsLyrics"
          @update:model-value="
            $emit('update', {
              acceptsLyrics: $event,
            } as Partial<NoteElement>)
          "
        >
          <SelectTrigger id="properties-neume-accepts-lyrics" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem :value="AcceptsLyricsOption.Default">
                {{
                  $t(($) => $.toolbar.neume.acceptsLyricsDefault, {
                    ns: 'toolbar',
                  })
                }}
              </SelectItem>
              <SelectItem :value="AcceptsLyricsOption.Yes">
                {{
                  $t(($) => $.toolbar.neume.acceptsLyricsYes, { ns: 'toolbar' })
                }}
              </SelectItem>
              <SelectItem :value="AcceptsLyricsOption.No">
                {{
                  $t(($) => $.toolbar.neume.acceptsLyricsNo, { ns: 'toolbar' })
                }}
              </SelectItem>
              <SelectItem :value="AcceptsLyricsOption.MelismaOnly">
                {{
                  $t(($) => $.toolbar.neume.acceptsLyricsMelismaOnly, {
                    ns: 'toolbar',
                  })
                }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>

      <Field orientation="horizontal">
        <Switch
          id="properties-neume-ignore-attractions"
          :model-value="element.ignoreAttractions"
          @update:model-value="
            $emit('update', {
              ignoreAttractions: $event === true,
            } as Partial<NoteElement>)
          "
        />
        <FieldLabel for="properties-neume-ignore-attractions">{{
          $t(($) => $.toolbar.common.ignoreAttractions, { ns: 'toolbar' })
        }}</FieldLabel>
      </Field>
    </PaneSection>

    <PaneSection
      value="positioning"
      :title="$t(($) => $.toolbar.neume.positioning, { ns: 'toolbar' })"
    >
      <Field orientation="horizontal">
        <FieldLabel for="properties-neume-space-after">{{
          $t(($) => $.toolbar.common.spaceAfter, { ns: 'toolbar' })
        }}</FieldLabel>
        <InputUnit
          id="properties-neume-space-after"
          unit="pt"
          :min="-spaceAfterMax"
          :max="spaceAfterMax"
          :step="0.5"
          :format-options="fraction2FormatOptions"
          :model-value="element.spaceAfter"
          @update:model-value="$emit('update', { spaceAfter: $event })"
        />
      </Field>
    </PaneSection>
  </PaneAccordion>
</template>

<script setup lang="ts">
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import PaneAccordion from '@/components/pane/PaneAccordion.vue';
import PaneSection from '@/components/pane/PaneSection.vue';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { NoteElement } from '@/models/Element';
import { AcceptsLyricsOption } from '@/models/Element';
import type { ModelSelector } from '@/models/NeumeI18nMappings';
import { getNoteLabelSelector } from '@/models/NeumeI18nMappings';
import { Fthora } from '@/models/Neumes';
import type { PageSetup } from '@/models/PageSetup';
import { ScaleNote } from '@/models/Scales';
import { fraction2FormatOptions } from '@/utils/numberFormatOptions';
import { Unit } from '@/utils/Unit';

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

const props = defineProps({
  element: {
    type: Object as PropType<NoteElement>,
    required: true,
  },
  innerNeume: {
    type: String,
    required: true,
  },
  openSections: {
    type: Array as PropType<string[]>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const emit = defineEmits(['update', 'update:open-sections']);

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

const chromaticFthoraNote = computed(() => {
  if (props.innerNeume === 'Secondary') {
    return props.element.secondaryChromaticFthoraNote;
  } else if (props.innerNeume === 'Tertiary') {
    return props.element.tertiaryChromaticFthoraNote;
  } else {
    return props.element.chromaticFthoraNote;
  }
});

const spaceAfterMax = computed(() =>
  Math.round(Unit.toPt(props.pageSetup.pageWidth)),
);

function updateChromaticFthoraNote(value: AcceptableValue) {
  if (typeof value !== 'string') {
    return;
  }

  const note = value as ScaleNote;

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
</script>
