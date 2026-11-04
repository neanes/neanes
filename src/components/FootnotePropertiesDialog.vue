<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md"
    >
      <DialogHeader>
        <DialogTitle>{{
          $t(($) => $.dialog.footnoteProperties.title, { ns: 'dialog' })
        }}</DialogTitle>
        <DialogDescription>{{
          $t(($) => $.dialog.footnoteProperties.description, { ns: 'dialog' })
        }}</DialogDescription>
      </DialogHeader>
      <form
        id="footnote-properties-form"
        class="min-h-0 overflow-y-auto pr-1"
        @submit.prevent="submit"
      >
        <FieldGroup>
          <Field>
            <FieldLabel for="footnote-custom-marker">{{
              $t(($) => $.dialog.footnoteProperties.customText, {
                ns: 'dialog',
              })
            }}</FieldLabel>
            <Input
              id="footnote-custom-marker"
              v-model="customText"
              autocomplete="off"
              :aria-invalid="!valid"
            />
            <p v-if="!valid" class="text-sm text-destructive" role="alert">
              {{
                $t(($) => $.dialog.footnoteProperties.invalid, { ns: 'dialog' })
              }}
            </p>
          </Field>
          <Accordion
            v-if="anchor !== null"
            v-model="positionSections"
            type="multiple"
          >
            <AccordionItem value="position">
              <AccordionTrigger id="footnote-positioning-trigger">{{
                $t(($) => $.dialog.footnoteProperties.positioning, {
                  ns: 'dialog',
                })
              }}</AccordionTrigger>
              <AccordionContent>
                <FieldGroup>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="footnote-position-override"
                      :model-value="positionOverride"
                      @update:model-value="setPositionOverride($event === true)"
                    />
                    <FieldLabel for="footnote-position-override">{{
                      $t(($) => $.dialog.footnoteProperties.overridePosition, {
                        ns: 'dialog',
                      })
                    }}</FieldLabel>
                  </Field>
                  <div
                    class="overflow-auto rounded border bg-white"
                    :style="{ height: `${previewHeight}px`, '--zoom': 2 }"
                  >
                    <div
                      data-testid="footnote-preview-anchor"
                      class="relative mx-auto whitespace-nowrap"
                      :style="previewAnchorStyle"
                    >
                      <div
                        v-for="(element, index) in surroundingElements"
                        :key="index"
                        data-testid="footnote-preview-neighbor"
                        class="pointer-events-none absolute whitespace-nowrap opacity-50"
                        :style="neighborStyle(element)"
                        aria-hidden="true"
                      >
                        <NeumeBoxSyllable
                          v-if="element instanceof NoteElement"
                          :note="element"
                          :page-setup="pageSetup"
                        />
                        <NeumeBoxMartyria
                          v-else-if="element instanceof MartyriaElement"
                          :neume="element"
                          :page-setup="pageSetup"
                        />
                        <NeumeBoxTempo
                          v-else
                          :neume="element"
                          :page-setup="pageSetup"
                        />
                      </div>
                      <NeumeBoxSyllable
                        v-if="previewAnchor instanceof NoteElement"
                        :note="previewAnchor"
                        :page-setup="pageSetup"
                      />
                      <NeumeBoxMartyria
                        v-else-if="previewAnchor instanceof MartyriaElement"
                        :neume="previewAnchor"
                        :page-setup="pageSetup"
                      />
                      <span
                        data-testid="footnote-position-preview"
                        class="pointer-events-none absolute whitespace-nowrap"
                        :style="previewMarkerStyle"
                        >{{ referencePreview }}</span
                      >
                      <button
                        data-testid="footnote-drag-handle"
                        type="button"
                        class="absolute z-40 size-4 -translate-x-1/2 -translate-y-1/2 touch-none bg-sky-300/60 enabled:cursor-move disabled:opacity-0"
                        :style="previewHandleStyle"
                        :disabled="!positionOverride"
                        :aria-label="
                          $t(($) => $.dialog.footnoteProperties.dragMarker, {
                            ns: 'dialog',
                          })
                        "
                        @pointerdown="startDrag"
                        @pointermove="drag"
                        @pointerup="endDrag"
                        @pointercancel="endDrag"
                        @lostpointercapture="dragStart = null"
                        @keydown="moveMarker"
                      />
                    </div>
                  </div>
                  <Field>
                    <FieldLabel for="footnote-offset-x">{{
                      $t(($) => $.dialog.footnoteProperties.offsetX, {
                        ns: 'dialog',
                      })
                    }}</FieldLabel>
                    <InputUnit
                      id="footnote-offset-x"
                      :model-value="offsetX"
                      :disabled="!positionOverride"
                      unit="unitless"
                      :min="-10"
                      :max="10"
                      :step="0.01"
                      @update:model-value="offsetX = $event ?? 0"
                    />
                  </Field>
                  <Field>
                    <FieldLabel for="footnote-offset-y">{{
                      $t(($) => $.dialog.footnoteProperties.offsetY, {
                        ns: 'dialog',
                      })
                    }}</FieldLabel>
                    <InputUnit
                      id="footnote-offset-y"
                      :model-value="offsetY"
                      :disabled="!positionOverride"
                      unit="unitless"
                      :min="-10"
                      :max="10"
                      :step="0.01"
                      @update:model-value="offsetY = $event ?? 0"
                    />
                  </Field>
                  <p class="text-sm text-muted-foreground">
                    {{
                      $t(($) => $.dialog.footnoteProperties.positionHint, {
                        ns: 'dialog',
                      })
                    }}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    :disabled="!positionOverride"
                    @click="
                      offsetX = 0;
                      offsetY = 0;
                    "
                    >{{
                      $t(($) => $.dialog.footnoteProperties.resetPosition, {
                        ns: 'dialog',
                      })
                    }}</Button
                  >
                </FieldGroup>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div class="flex justify-between gap-4 text-sm" aria-live="polite">
            <span
              >{{
                $t(($) => $.dialog.footnoteProperties.reference, {
                  ns: 'dialog',
                })
              }}:
              <component
                :is="richTextReference ? 'sup' : 'span'"
                data-testid="footnote-marker-preview"
                :style="
                  richTextReference
                    ? undefined
                    : { fontSize: `${referenceTypography.fontSize}px` }
                "
                >{{ referencePreview }}</component
              ></span
            >
            <span
              >{{
                $t(($) => $.dialog.footnoteProperties.body, { ns: 'dialog' })
              }}:
              <span
                data-testid="footnote-body-preview"
                :style="{ fontSize: `${bodyTypography.fontSize}px` }"
                >{{ footnoteBodyMarkerText(markerPreview) }}</span
              ></span
            >
          </div>
        </FieldGroup>
      </form>
      <DialogFooter>
        <DialogClose as-child
          ><Button variant="outline" type="button">{{
            $t(($) => $.dialog.common.cancel, { ns: 'dialog' })
          }}</Button></DialogClose
        >
        <Button
          type="submit"
          form="footnote-properties-form"
          :disabled="!valid"
          >{{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed, ref, watch } from 'vue';

import InputUnit from '@/components/InputUnit.vue';
import NeumeBoxMartyria from '@/components/NeumeBoxMartyria.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import NeumeBoxTempo from '@/components/NeumeBoxTempo.vue';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type {
  FootnoteAnchorElement,
  ScoreElement,
  TempoElement,
} from '@/models/Element';
import { MartyriaElement, NoteElement } from '@/models/Element';
import type { Footnote } from '@/models/Footnote';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import {
  footnoteBodyMarkerText,
  footnoteMarkerStyle,
  footnoteMarkerText,
} from '@/services/FootnoteLayout';
import { normalizeFootnoteMarker } from '@/services/FootnoteMarker';
import { LayoutService } from '@/services/LayoutService';
import { TextMeasurementService } from '@/services/TextMeasurementService';
import { resolveFontStyle } from '@/utils/fontStyle';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';

const props = defineProps<{
  footnote: Footnote;
  anchor: FootnoteAnchorElement | null;
  surroundingElements: (NoteElement | MartyriaElement | TempoElement)[];
  lineElements: ScoreElement[];
  pageSetup: PageSetup;
  paragraphStyles: ParagraphStyle[];
  automaticMarker: string;
  richTextReference: boolean;
}>();
const emit = defineEmits<{
  update: [
    marker: string | null,
    offsets: {
      footnoteOffsetX: number;
      footnoteOffsetY: number;
      footnotePositionOverride: boolean;
    },
  ];
}>();
const open = defineModel<boolean>('open', { required: true });
const positionSections = ref<string[]>([]);
const positionOverride = ref(false);
const offsetX = ref(0);
const offsetY = ref(0);
const customText = ref('');
watch(
  [open, () => props.footnote],
  () => {
    if (!open.value) {
      return;
    }
    positionSections.value = [];
    positionOverride.value = props.anchor?.footnotePositionOverride ?? false;
    offsetX.value = props.anchor?.footnoteOffsetX ?? 0;
    offsetY.value = props.anchor?.footnoteOffsetY ?? 0;
    const marker = props.footnote.marker;
    customText.value = marker ?? '';
  },
  { immediate: true },
);
const value = computed(() =>
  customText.value.trim() === '' ? null : customText.value,
);
const valid = computed(() => {
  try {
    normalizeFootnoteMarker(value.value);
    return true;
  } catch {
    return false;
  }
});
const markerPreview = computed(() =>
  valid.value
    ? (normalizeFootnoteMarker(value.value) ?? props.automaticMarker)
    : '',
);
const bodyTypography = computed(() =>
  footnoteMarkerStyle(props.paragraphStyles, 'body'),
);
const referenceTypography = computed(() =>
  footnoteMarkerStyle(props.paragraphStyles),
);
const referencePreview = computed(() =>
  props.richTextReference
    ? markerPreview.value
    : footnoteMarkerText(
        markerPreview.value,
        props.pageSetup.footnoteReferenceParentheses,
      ),
);
const previewAnchor = computed(() =>
  props.anchor === null
    ? null
    : (Object.assign(
        Object.create(Object.getPrototypeOf(props.anchor)),
        props.anchor,
        {
          footnoteMarker: markerPreview.value,
          footnoteOffsetX: offsetX.value,
          footnoteOffsetY: offsetY.value,
          footnotePositionOverride: positionOverride.value,
        },
      ) as NoteElement | MartyriaElement),
);
function markerPositionInLine(anchor: FootnoteAnchorElement) {
  return LayoutService.getFootnoteMarkerPositionsForLine(
    props.lineElements.map((element) =>
      element === props.anchor ? anchor : element,
    ),
    props.pageSetup,
    props.paragraphStyles,
  ).get(anchor)!;
}
const previewPosition = computed(() =>
  previewAnchor.value === null
    ? { left: 0, top: 0, inkBox: { left: 0, right: 0, top: 0, bottom: 0 } }
    : markerPositionInLine(previewAnchor.value),
);
const previewTop = computed(() =>
  Math.max(
    48,
    -(props.anchor === null ? 0 : markerPositionInLine(props.anchor).top) * 2 +
      32,
  ),
);
const previewHeight = computed(() =>
  Math.min(
    280,
    previewTop.value +
      TextMeasurementService.getFontHeight(
        `${props.pageSetup.neumeDefaultFontSize}px ${props.pageSetup.neumeDefaultFontFamily}`,
      ) *
        2 +
      16,
  ),
);
const previewAnchorStyle = computed(() => ({
  top: `${previewTop.value}px`,
  width: `${(previewAnchor.value?.neumeWidth ?? 0) * 2}px`,
  fontFamily: props.pageSetup.neumeDefaultFontFamily,
  fontSize: `${props.pageSetup.neumeDefaultFontSize * 2}px`,
}));
function neighborStyle(
  element: NoteElement | MartyriaElement | TempoElement,
): CSSProperties {
  const anchor = props.anchor!;
  return {
    [props.pageSetup.melkiteRtl ? 'right' : 'left']:
      `${(element.x - anchor.x) * 2}px`,
    top: `${(element.y - anchor.y) * 2}px`,
    width: `${element.neumeWidth * 2}px`,
  };
}
const previewMarkerStyle = computed(() => {
  const style = referenceTypography.value;
  const font = resolveFontStyle(style.fontFamily, style.fontStyle);
  return {
    [props.pageSetup.melkiteRtl ? 'right' : 'left']:
      `${previewPosition.value.left * 2}px`,
    top: `${previewPosition.value.top * 2}px`,
    fontSize: `${style.fontSize * 2}px`,
    fontFamily: getFontFamilyWithFallback(font.cssFontFamily),
    fontStyle: font.cssFontStyle,
    fontWeight: font.cssFontWeight,
    color: style.color,
    lineHeight: 1,
    WebkitTextStrokeWidth: `${style.strokeWidth * 2}px`,
    WebkitTextStrokeColor: style.strokeColor,
    fontVariantCaps: style.fontVariantCaps,
    fontVariantNumeric: style.fontVariantNumeric,
    fontVariantLigatures: style.fontVariantLigatures,
    fontVariantAlternates: style.fontVariantAlternates,
    textDecoration: style.textDecoration,
  } as CSSProperties;
});
const previewHandleStyle = computed(() => {
  const { inkBox } = previewPosition.value;
  const { neumeFontAscent, neumeFontHeight } =
    LayoutService.createOverlayDiagnosticsContext(props.pageSetup);
  // Ink bounds use physical coordinates relative to the musical baseline.
  const baseline =
    neumeFontAscent +
    (neumeFontHeight - props.pageSetup.neumeDefaultFontSize) / 2;
  return {
    left: `${inkBox.left + inkBox.right}px`,
    top: `${inkBox.top + inkBox.bottom + baseline * 2}px`,
  };
});

function setPositionOverride(enabled: boolean) {
  const top = previewPosition.value.top;
  positionOverride.value = enabled;
  if (enabled) {
    offsetY.value +=
      (top - previewPosition.value.top) / props.pageSetup.neumeDefaultFontSize;
  } else {
    offsetX.value = 0;
    offsetY.value = 0;
  }
}

let dragStart: {
  pointerId: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
} | null = null;
function startDrag(event: PointerEvent) {
  if (event.button !== 0 || !positionOverride.value) {
    return;
  }
  event.preventDefault();
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  dragStart = {
    pointerId: event.pointerId,
    x: event.clientX,
    y: event.clientY,
    offsetX: offsetX.value,
    offsetY: offsetY.value,
  };
}
function drag(event: PointerEvent) {
  if (dragStart === null || event.pointerId !== dragStart.pointerId) {
    return;
  }
  const scale = props.pageSetup.neumeDefaultFontSize * 2;
  offsetX.value = clampOffset(
    dragStart.offsetX + (event.clientX - dragStart.x) / scale,
  );
  offsetY.value = clampOffset(
    dragStart.offsetY + (event.clientY - dragStart.y) / scale,
  );
}
function endDrag(event: PointerEvent) {
  if (dragStart === null || event.pointerId !== dragStart.pointerId) {
    return;
  }
  (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  dragStart = null;
}
function clampOffset(value: number) {
  return Math.round(Math.max(-10, Math.min(10, value)) * 100) / 100;
}
function moveMarker(event: KeyboardEvent) {
  const delta = event.shiftKey ? 0.1 : 0.01;
  switch (event.key) {
    case 'ArrowLeft':
      offsetX.value = clampOffset(offsetX.value - delta);
      break;
    case 'ArrowRight':
      offsetX.value = clampOffset(offsetX.value + delta);
      break;
    case 'ArrowUp':
      offsetY.value = clampOffset(offsetY.value - delta);
      break;
    case 'ArrowDown':
      offsetY.value = clampOffset(offsetY.value + delta);
      break;
    default:
      return;
  }
  event.preventDefault();
}

function submit() {
  if (!valid.value) {
    return;
  }
  emit('update', normalizeFootnoteMarker(value.value), {
    footnotePositionOverride: positionOverride.value,
    footnoteOffsetX: offsetX.value,
    footnoteOffsetY: offsetY.value,
  });
  open.value = false;
}
</script>
