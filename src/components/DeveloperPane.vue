<template>
  <div class="flex size-full min-h-0 flex-col overflow-hidden p-3">
    <div
      v-if="showMissingDiagnosticsNotice"
      class="developer-pane-notice mb-3 shrink-0"
    >
      <p class="developer-pane-notice-copy">
        Layout diagnostics have not been collected for the current pages yet.
        Reload the layout to collect the current developer stats.
      </p>
      <Button size="sm" variant="outline" @click="emit('reload-diagnostics')">
        Reload Layout Diagnostics
      </Button>
    </div>
    <ScrollArea class="developer-pane-scroll min-h-0 flex-1">
      <div class="developer-pane-scroll-content pr-4">
        <Accordion
          type="multiple"
          class="developer-pane-accordion"
          :model-value="openSections"
          @update:model-value="emitOpenSections($event)"
        >
          <AccordionItem value="display">
            <AccordionTrigger>Display Switches</AccordionTrigger>
            <AccordionContent>
              <FieldGroup class="pt-2">
                <Field
                  v-for="toggle in utilityDisplayToggles"
                  :key="toggle.key"
                  orientation="horizontal"
                >
                  <Switch
                    :id="`developer-pane-${toggle.key}`"
                    :model-value="props.toggles[toggle.key]"
                    @update:model-value="
                      emit('update:toggle', toggle.key, $event === true)
                    "
                  />
                  <FieldLabel :for="`developer-pane-${toggle.key}`">
                    {{ toggle.label }}
                  </FieldLabel>
                </Field>
                <Separator class="my-3" />
                <Field
                  v-for="toggle in displayToggles"
                  :key="toggle.key"
                  orientation="horizontal"
                >
                  <Switch
                    :id="`developer-pane-${toggle.key}`"
                    :disabled="!props.toggles.overlaysEnabled"
                    :model-value="props.toggles[toggle.key]"
                    @update:model-value="
                      emit('update:toggle', toggle.key, $event === true)
                    "
                  />
                  <FieldLabel :for="`developer-pane-${toggle.key}`">
                    {{ toggle.label }}
                  </FieldLabel>
                </Field>
              </FieldGroup>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="line">
            <AccordionTrigger>Line Diagnostics</AccordionTrigger>
            <AccordionContent>
              <div class="developer-pane-section pt-2">
                <template v-if="lineDiagnostics != null">
                  <dl class="developer-pane-grid">
                    <template
                      v-for="item in lineDiagnosticRows"
                      :key="item.label"
                    >
                      <dt>{{ item.label }}</dt>
                      <dd>{{ item.value }}</dd>
                    </template>
                  </dl>
                </template>
                <p v-else class="developer-pane-empty">
                  Layout diagnostics are unavailable for the current selection.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem v-if="props.toggles.showGlueWidths" value="glue">
            <AccordionTrigger>Glue Overlays</AccordionTrigger>
            <AccordionContent>
              <div class="developer-pane-section pt-2">
                <ul class="developer-pane-list">
                  <li>Top bar = actual justified width.</li>
                  <li>Bottom bar = preferred width.</li>
                  <li>Blue = glue that stretched.</li>
                  <li>Red = glue that shrunk.</li>
                  <li>Hatched boxes = glue w/ negative width.</li>
                  <li>Delta = actual minus preferred.</li>
                </ul>
                <ul
                  v-if="lineDiagnostics != null && glueOverlayRows.length > 0"
                  class="developer-pane-list pt-2"
                >
                  <li
                    v-for="(row, index) in glueOverlayRows"
                    :key="`glue-overlay-${index}`"
                  >
                    <code>{{ row }}</code>
                  </li>
                </ul>
                <p
                  v-else-if="lineDiagnostics != null"
                  class="developer-pane-empty pt-2"
                >
                  No anchored glue overlays were found for the selected line.
                </p>
                <p v-else class="developer-pane-empty pt-2">
                  Select a line-owned element to inspect its glue overlays.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="inspector">
            <AccordionTrigger>Element Inspector</AccordionTrigger>
            <AccordionContent>
              <div class="developer-pane-section pt-2">
                <template v-if="selectedElement != null">
                  <dl class="developer-pane-grid">
                    <template
                      v-for="item in inspectorRows"
                      :key="`${item.label}-${item.value}`"
                    >
                      <dt>{{ item.label }}</dt>
                      <dd
                        :class="{
                          'developer-pane-grid-multiline':
                            item.value.includes('\n'),
                        }"
                      >
                        {{ item.value }}
                      </dd>
                    </template>
                  </dl>

                  <div v-if="generatedItemGroups.length > 0" class="pt-3">
                    <p class="developer-pane-subtitle">Generated Items</p>
                    <div
                      v-for="(group, index) in generatedItemGroups"
                      :key="`${group.ownerElementId}-${index}`"
                      class="developer-pane-group"
                    >
                      <p class="developer-pane-group-title">
                        {{ getGroupLabel(group) }}
                      </p>
                      <ul class="developer-pane-list">
                        <li
                          v-for="(item, itemIndex) in group.items"
                          :key="`${group.ownerElementId}-${index}-${itemIndex}`"
                        >
                          <code>{{ formatDiagnosticItem(item) }}</code>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <p v-else class="developer-pane-empty pt-3">
                    Generated layout items are unavailable for the current
                    selection.
                  </p>
                </template>
                <p v-else class="developer-pane-empty">
                  Select an element to inspect it.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import type { ScoreElement } from '@/models/Element';
import type {
  GlueOverlayDiagnostics,
  LayoutDiagnosticItem,
  LayoutDiagnosticItemGroup,
  LineLayoutDiagnostics,
} from '@/models/LayoutDiagnostics';

type DeveloperToggleKey =
  | 'overlaysEnabled'
  | 'printOverlays'
  | 'showAdjustmentRatios'
  | 'showAnonymousBoxes'
  | 'showCollisionRegions'
  | 'showElementBoxes'
  | 'showGuides'
  | 'showGlueWidths'
  | 'showInkBoundingBoxes'
  | 'showLyricBoundingBoxes'
  | 'showNeumeBoundingBoxes';

type DeveloperToggles = Record<DeveloperToggleKey, boolean>;

type InspectorRow = {
  label: string;
  value: string;
};

const props = defineProps<{
  generatedItemGroups: LayoutDiagnosticItemGroup[];
  inspectorRows: InspectorRow[];
  lineDiagnostics: LineLayoutDiagnostics | null;
  openSections: string[];
  selectedElement: ScoreElement | null;
  showMissingDiagnosticsNotice: boolean;
  toggles: DeveloperToggles;
}>();

const emit = defineEmits<{
  (event: 'reload-diagnostics'): void;
  (event: 'update:open-sections', value: string[]): void;
  (event: 'update:toggle', key: DeveloperToggleKey, value: boolean): void;
}>();

const utilityDisplayToggles: Array<{
  key: 'overlaysEnabled' | 'printOverlays';
  label: string;
}> = [
  { key: 'overlaysEnabled', label: 'Enable overlays' },
  { key: 'printOverlays', label: 'Print Overlays' },
];

const displayToggles: Array<{ key: DeveloperToggleKey; label: string }> = [
  { key: 'showGuides', label: 'Show guides' },
  { key: 'showAdjustmentRatios', label: 'Show adjustment ratios' },
  { key: 'showElementBoxes', label: 'Show element boxes' },
  { key: 'showAnonymousBoxes', label: 'Show anonymous boxes' },
  { key: 'showGlueWidths', label: 'Show glue widths' },
  { key: 'showInkBoundingBoxes', label: 'Show ink bounding boxes' },
  { key: 'showLyricBoundingBoxes', label: 'Show lyric bounding boxes' },
  { key: 'showNeumeBoundingBoxes', label: 'Show neume bounding boxes' },
  { key: 'showCollisionRegions', label: 'Show collision regions' },
];

const lineDiagnosticRows = computed(() => {
  const diagnostics = props.lineDiagnostics;

  if (diagnostics == null) {
    return [];
  }

  return [
    { label: 'Selected line', value: `${diagnostics.paragraphLineIndex + 1}` },
    {
      label: 'Adjustment ratio',
      value: formatNumber(diagnostics.adjustmentRatio),
    },
    {
      label: 'Badness',
      value:
        diagnostics.recomputedBadness == null
          ? 'unavailable'
          : formatNumber(diagnostics.recomputedBadness),
    },
    {
      label: 'Natural width',
      value: formatNumber(diagnostics.naturalContentWidth),
    },
    {
      label: 'Target width',
      value: formatNumber(diagnostics.targetWidth),
    },
    {
      label: 'Actual width',
      value: formatNumber(diagnostics.actualContentWidth),
    },
    {
      label: 'Stretch used',
      value: formatNumber(diagnostics.stretchUsed),
    },
    {
      label: 'Shrink used',
      value: formatNumber(diagnostics.shrinkUsed),
    },
  ];
});

const glueOverlayRows = computed(() => {
  const diagnostics = props.lineDiagnostics;

  if (diagnostics == null) {
    return [];
  }

  return diagnostics.glueOverlays.map(formatGlueOverlay);
});

function emitOpenSections(value: string | string[] | undefined) {
  emit(
    'update:open-sections',
    value == null ? [] : Array.isArray(value) ? value : [value],
  );
}

function formatDiagnosticItem(item: LayoutDiagnosticItem) {
  if (item.type === 'box') {
    const label = item.label;
    return label != null
      ? `b(${label}:${formatNumber(item.width)})`
      : `b(${formatNumber(item.width)})`;
  }

  if (item.type === 'glue') {
    const label = item.label;
    const prefix = label != null ? `${label}:` : '';
    return `g(${prefix}${formatNumber(item.width)},+${formatNumber(
      item.stretch ?? 0,
    )},-${formatNumber(item.shrink ?? 0)})`;
  }

  const label = item.label;
  const cost = formatPenaltyCost(item);
  return label != null ? `p(${label}:${cost})` : `p(${cost})`;
}

function formatNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : String(value);
}

function formatSignedNumber(value: number) {
  if (value > 0) {
    return `+${formatNumber(value)}`;
  }

  if (value < 0) {
    return `-${formatNumber(Math.abs(value))}`;
  }

  return formatNumber(value);
}

function formatGlueOverlay(glue: GlueOverlayDiagnostics) {
  const label = glue.label ?? getGlueOwnerLabel(glue) ?? 'glue';
  const delta = glue.actualWidth - glue.preferredWidth;

  return `${label}: pref ${formatNumber(glue.preferredWidth)}, actual ${formatNumber(
    glue.actualWidth,
  )}, delta ${formatSignedNumber(delta)}`;
}

function formatPenaltyCost(item: LayoutDiagnosticItem) {
  if (item.forcedBreak) {
    return '-∞';
  }

  if (item.infinitePenalty) {
    return '+∞';
  }

  return formatNumber(item.cost ?? 0);
}

function getGroupLabel(group: LayoutDiagnosticItemGroup) {
  return group.ownerElementType == null
    ? group.anonymous
      ? 'Anonymous'
      : 'Unowned'
    : `${group.ownerElementType} #${group.ownerElementId ?? group.ownerElementIndex ?? '?'}`;
}

function getGlueOwnerLabel(glue: GlueOverlayDiagnostics) {
  return glue.ownerElementType == null
    ? null
    : `${glue.ownerElementType} #${glue.ownerElementId ?? glue.ownerElementIndex ?? '?'}`;
}
</script>

<style scoped>
.developer-pane-accordion {
  display: flex;
  min-height: 0;
  flex-direction: column;
  gap: 0.25rem;
}

.developer-pane-scroll-content {
  min-width: 0;
}

.developer-pane-section {
  font-size: 0.75rem;
}

.developer-pane-notice {
  border: 1px solid var(--border);
  background: color-mix(in srgb, var(--muted) 70%, transparent);
  padding: 0.75rem;
}

.developer-pane-notice-copy {
  margin: 0 0 0.75rem;
  color: var(--muted-foreground);
  font-size: 0.75rem;
}

.developer-pane-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.35rem 0.75rem;
}

.developer-pane-grid dt {
  color: var(--muted-foreground);
}

.developer-pane-grid dd {
  margin: 0;
  overflow-wrap: anywhere;
  text-align: right;
}

.developer-pane-grid-multiline {
  text-align: left;
  white-space: pre-line;
}

.developer-pane-empty {
  color: var(--muted-foreground);
  font-size: 0.75rem;
}

.developer-pane-subtitle {
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.developer-pane-group + .developer-pane-group {
  margin-top: 0.75rem;
}

.developer-pane-group-title {
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.developer-pane-list {
  margin: 0;
  padding-left: 1rem;
  font-family: monospace;
  font-size: 0.7rem;
}
</style>
