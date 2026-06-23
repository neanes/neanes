<template>
  <div
    class="flex size-full min-h-0 flex-col overflow-hidden bg-background p-3"
  >
    <template v-if="context.kind === 'range'">
      <FieldSet class="min-h-0 flex-1 overflow-auto">
        <FieldLegend class="sr-only">{{
          $t(($) => $.menu.view.selection, { ns: 'menu' })
        }}</FieldLegend>
        <FieldGroup>
          <Field orientation="horizontal">
            <FieldLabel>{{
              $t(($) => $.toolbar.selection.elements, { ns: 'toolbar' })
            }}</FieldLabel>
            <FieldContent>
              {{ context.elements.length }}
            </FieldContent>
          </Field>

          <Button
            type="button"
            variant="destructive"
            @click="emit('delete-selected-element')"
          >
            <PhTrash data-icon="inline-start" weight="duotone" />
            {{
              $t(($) => $.toolbar.main.deleteSelectedElement, { ns: 'toolbar' })
            }}
          </Button>
        </FieldGroup>
      </FieldSet>
    </template>

    <FieldSet
      v-else-if="selectionElement != null"
      :key="`selection-${selectionElement.elementType}-${selectionElement.id}`"
      class="min-h-0 flex-1 overflow-auto"
    >
      <FieldLegend class="sr-only">{{
        $t(($) => $.menu.view.selection, { ns: 'menu' })
      }}</FieldLegend>
      <FieldGroup>
        <Field orientation="horizontal">
          <FieldLabel>{{
            $t(($) => $.dialog.pageSetup.type, { ns: 'dialog' })
          }}</FieldLabel>
          <FieldContent>
            <Badge variant="secondary" class="ml-auto">
              {{ elementTypeLabel }}
            </Badge>
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel for="properties-section-name">{{
            $t(($) => $.toolbar.common.sectionName, { ns: 'toolbar' })
          }}</FieldLabel>
          <Input
            id="properties-section-name"
            type="text"
            :model-value="selectionElement.sectionName ?? ''"
            @change="onSectionNameChanged"
          />
        </Field>

        <Field>
          <FieldLabel for="properties-line-break">{{
            $t(($) => $.toolbar.selection.lineBreak, { ns: 'toolbar' })
          }}</FieldLabel>
          <Select
            :model-value="lineBreakValue"
            :disabled="!canApplyBreak"
            @update:model-value="onLineBreakChanged"
          >
            <SelectTrigger id="properties-line-break" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem :value="LINE_BREAK_NONE_VALUE">{{
                  $t(($) => $.toolbar.common.none, { ns: 'toolbar' })
                }}</SelectItem>
                <SelectItem :value="LineBreakType.Left">{{
                  $t(($) => $.dialog.common.left, { ns: 'dialog' })
                }}</SelectItem>
                <SelectItem :value="LineBreakType.Center">{{
                  $t(($) => $.toolbar.selection.center, { ns: 'toolbar' })
                }}</SelectItem>
                <SelectItem :value="LineBreakType.Justify">{{
                  $t(($) => $.toolbar.selection.justify, { ns: 'toolbar' })
                }}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        <Field v-if="canShowSectionBreakToggle" orientation="horizontal">
          <Switch
            id="properties-section-break"
            :model-value="selectionElement.sectionBreak"
            :disabled="!canApplyBreak"
            @update:model-value="emit('toggle-section-break')"
          />
          <FieldLabel for="properties-section-break">{{
            $t(($) => $.toolbar.selection.sectionBreak, { ns: 'toolbar' })
          }}</FieldLabel>
        </Field>

        <Button
          type="button"
          :variant="selectionElement.pageBreak ? 'secondary' : 'outline'"
          :aria-pressed="selectionElement.pageBreak"
          :disabled="!canApplyBreak"
          @click="emit('toggle-page-break')"
        >
          <PhFile data-icon="inline-start" />
          {{ $t(($) => $.toolbar.selection.pageBreak, { ns: 'toolbar' }) }}
        </Button>

        <Button
          type="button"
          variant="secondary"
          @click="emit('copy-element-link')"
        >
          <PhLinkSimple data-icon="inline-start" />
          {{ $t(($) => $.menu.tools.copyElementLink, { ns: 'menu' }) }}
        </Button>

        <Button
          type="button"
          variant="destructive"
          @click="emit('delete-selected-element')"
        >
          <PhTrash data-icon="inline-start" weight="duotone" />
          {{
            $t(($) => $.toolbar.main.deleteSelectedElement, { ns: 'toolbar' })
          }}
        </Button>
      </FieldGroup>
    </FieldSet>

    <FieldSet
      v-else-if="headerFooterSelection != null"
      class="min-h-0 flex-1 overflow-auto"
    >
      <FieldLegend class="sr-only">{{
        $t(($) => $.menu.view.selection, { ns: 'menu' })
      }}</FieldLegend>
      <FieldGroup>
        <Field orientation="horizontal">
          <FieldLabel>{{
            $t(($) => $.dialog.pageSetup.type, { ns: 'dialog' })
          }}</FieldLabel>
          <FieldContent>
            <Badge variant="secondary" class="ml-auto">
              {{
                headerFooterSelection.kind === 'header'
                  ? $t(($) => $.menu.insert.header, { ns: 'menu' })
                  : $t(($) => $.menu.insert.footer, { ns: 'menu' })
              }}
            </Badge>
          </FieldContent>
        </Field>

        <Field
          v-if="headerFooterSelection.sectionIndex > 0"
          orientation="horizontal"
        >
          <FieldLabel>{{
            $t(($) => $.toolbar.selection.variant, { ns: 'toolbar' })
          }}</FieldLabel>
          <FieldContent>
            {{ activeHeaderFooterVariantLabel }}
          </FieldContent>
        </Field>

        <Field
          v-if="headerFooterSelection.sectionIndex > 0"
          orientation="horizontal"
        >
          <Switch
            id="properties-header-footer-link-to-previous"
            :model-value="headerFooterSelection.linkedToPrevious"
            @update:model-value="emit('toggle-header-footer-link-to-previous')"
          />
          <FieldLabel for="properties-header-footer-link-to-previous">{{
            headerFooterSelection.kind === 'header'
              ? $t(($) => $.toolbar.selection.linkHeaderToPrevious, {
                  ns: 'toolbar',
                })
              : $t(($) => $.toolbar.selection.linkFooterToPrevious, {
                  ns: 'toolbar',
                })
          }}</FieldLabel>
        </Field>

        <Field
          v-if="headerFooterSelection.sectionIndex > 0"
          orientation="horizontal"
        >
          <Switch
            id="properties-header-footer-different-first-page"
            :model-value="headerFooterSelection.headerDifferentFirstPage"
            @update:model-value="
              emit('toggle-header-footer-different-first-page')
            "
          />
          <FieldLabel for="properties-header-footer-different-first-page">{{
            $t(($) => $.toolbar.selection.differentFirstPage, {
              ns: 'toolbar',
            })
          }}</FieldLabel>
        </Field>
      </FieldGroup>
    </FieldSet>

    <Empty v-else class="min-h-40 border bg-muted/20">
      <EmptyHeader>
        <EmptyTitle>{{
          $t(($) => $.toolbar.selection.noSelection, { ns: 'toolbar' })
        }}</EmptyTitle>
        <EmptyDescription>{{
          $t(($) => $.toolbar.selection.nothingSelected, { ns: 'toolbar' })
        }}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </div>
</template>

<script setup lang="ts">
import { PhFile, PhLinkSimple, PhTrash } from '@phosphor-icons/vue';
import type { SelectorParam } from 'i18next';
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import type { InspectorContext } from '@/components/properties/InspectorContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ScoreElement } from '@/models/Element';
import { ElementType, LineBreakType } from '@/models/Element';

const props = defineProps({
  context: {
    type: Object as PropType<InspectorContext>,
    required: true,
  },
  canApplyBreak: {
    type: Boolean,
    default: false,
  },
  selectedHeaderFooterSection: {
    type: Object as PropType<{
      activeVariant: 'default' | 'odd' | 'even' | 'firstPage';
      headerDifferentFirstPage: boolean;
      kind: 'header' | 'footer';
      linkedToPrevious: boolean;
      pageNumberInSection: number;
      sectionIndex: number;
      sourceSectionIndex: number;
    } | null>,
    default: null,
  },
});

const emit = defineEmits([
  'copy-element-link',
  'delete-selected-element',
  'toggle-header-footer-different-first-page',
  'toggle-header-footer-link-to-previous',
  'toggle-line-break',
  'toggle-page-break',
  'toggle-section-break',
  'update:score-element-section-name',
]);

const LINE_BREAK_NONE_VALUE = '__none__';

type ElementTypeLabelSelector =
  | { ns: 'menu'; selector: SelectorParam<'menu'> }
  | { ns: 'toolbar'; selector: SelectorParam<'toolbar'> };

const ELEMENT_TYPE_LABEL_SELECTORS: Record<
  ElementType,
  ElementTypeLabelSelector
> = {
  [ElementType.AlternateLine]: {
    ns: 'menu',
    selector: ($) => $.menu.insert.alternateLine,
  },
  [ElementType.Annotation]: {
    ns: 'menu',
    selector: ($) => $.menu.insert.annotation,
  },
  [ElementType.DropCap]: {
    ns: 'menu',
    selector: ($) => $.menu.insert.dropCap,
  },
  [ElementType.Empty]: {
    ns: 'toolbar',
    selector: ($) => $.toolbar.common.none,
  },
  [ElementType.ImageBox]: {
    ns: 'menu',
    selector: ($) => $.menu.insert.image,
  },
  [ElementType.Martyria]: {
    ns: 'toolbar',
    selector: ($) => $.toolbar.main.martyria,
  },
  [ElementType.ModeKey]: {
    ns: 'menu',
    selector: ($) => $.menu.insert.modeKey,
  },
  [ElementType.Note]: {
    ns: 'toolbar',
    selector: ($) => $.toolbar.common.neume,
  },
  [ElementType.RichTextBox]: {
    ns: 'menu',
    selector: ($) => $.menu.insert.richTextBox,
  },
  [ElementType.Tempo]: {
    ns: 'toolbar',
    selector: ($) => $.toolbar.common.tempoSign,
  },
  [ElementType.TextBox]: {
    ns: 'menu',
    selector: ($) => $.menu.insert.textBox,
  },
};

const { t } = useTranslation();

const selectionElement = computed<ScoreElement | null>(() => {
  if (props.context.kind === 'none' || props.context.kind === 'range') {
    return null;
  }

  if (props.context.kind === 'lyrics') {
    return null;
  }

  if (
    (props.context.kind === 'text-box' ||
      props.context.kind === 'rich-text-box') &&
    props.context.source !== 'score'
  ) {
    return null;
  }

  return props.context.element;
});

const headerFooterSelection = computed(() => {
  if (
    (props.context.kind !== 'text-box' &&
      props.context.kind !== 'rich-text-box') ||
    props.context.source !== 'header-footer'
  ) {
    return null;
  }

  return props.selectedHeaderFooterSection;
});

const activeHeaderFooterVariantLabel = computed(() => {
  switch (headerFooterSelection.value?.activeVariant) {
    case 'even':
      return t(($) => $.toolbar.selection.evenPage, { ns: 'toolbar' });
    case 'odd':
      return t(($) => $.toolbar.selection.oddPage, { ns: 'toolbar' });
    case 'firstPage':
      return t(($) => $.toolbar.selection.firstPage, { ns: 'toolbar' });
    case 'default':
    default:
      return t(($) => $.toolbar.selection.defaultVariant, { ns: 'toolbar' });
  }
});

const elementTypeLabel = computed(() => {
  const element = selectionElement.value;

  if (element == null) {
    return '';
  }

  return translateElementTypeLabel(
    ELEMENT_TYPE_LABEL_SELECTORS[element.elementType],
  );
});

const lineBreakValue = computed(() => {
  const element = selectionElement.value;

  return element?.lineBreak
    ? (element.lineBreakType ?? LineBreakType.Left)
    : LINE_BREAK_NONE_VALUE;
});

const canShowSectionBreakToggle = computed(() => {
  const element = selectionElement.value;

  return element != null && (props.canApplyBreak || element.pageBreak);
});

function translateElementTypeLabel(label: ElementTypeLabelSelector) {
  switch (label.ns) {
    case 'menu':
      return t(label.selector, { ns: 'menu' });
    case 'toolbar':
      return t(label.selector, { ns: 'toolbar' });
  }
}

function onSectionNameChanged(event: Event) {
  const element = selectionElement.value;

  if (element == null) {
    return;
  }

  emit(
    'update:score-element-section-name',
    element,
    (event.target as HTMLInputElement).value,
  );
}

function onLineBreakChanged(value: AcceptableValue) {
  const element = selectionElement.value;

  if (
    element == null ||
    !props.canApplyBreak ||
    value === lineBreakValue.value
  ) {
    return;
  }

  if (value === LINE_BREAK_NONE_VALUE) {
    if (element.lineBreak) {
      emit('toggle-line-break', element.lineBreakType ?? LineBreakType.Left);
    }

    return;
  }

  if (isLineBreakType(value)) {
    emit('toggle-line-break', value);
  }
}

function isLineBreakType(value: AcceptableValue): value is LineBreakType {
  return Object.values(LineBreakType).includes(value as LineBreakType);
}
</script>
