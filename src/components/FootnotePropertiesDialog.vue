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
            <FieldLabel for="footnote-marker-type">{{
              $t(($) => $.dialog.footnoteProperties.marker, { ns: 'dialog' })
            }}</FieldLabel>
            <Select v-model="type">
              <SelectTrigger id="footnote-marker-type"
                ><SelectValue
              /></SelectTrigger>
              <SelectContent>
                <SelectItem value="automatic">{{
                  $t(($) => $.dialog.footnoteProperties.automatic, {
                    ns: 'dialog',
                  })
                }}</SelectItem>
                <SelectItem value="asterisk"
                  >{{
                    $t(($) => $.dialog.footnoteProperties.asterisk, {
                      ns: 'dialog',
                    })
                  }}
                  (*)</SelectItem
                >
                <SelectItem value="dagger"
                  >{{
                    $t(($) => $.dialog.footnoteProperties.dagger, {
                      ns: 'dialog',
                    })
                  }}
                  (†)</SelectItem
                >
                <SelectItem value="doubleDagger"
                  >{{
                    $t(($) => $.dialog.footnoteProperties.doubleDagger, {
                      ns: 'dialog',
                    })
                  }}
                  (‡)</SelectItem
                >
                <SelectItem value="custom">{{
                  $t(($) => $.dialog.footnoteProperties.custom, {
                    ns: 'dialog',
                  })
                }}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field v-if="type === 'custom'">
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
          <template v-if="anchor !== null">
            <div
              class="overflow-auto rounded border bg-white"
              :style="{ height: `${previewHeight}px`, '--zoom': 2 }"
            >
              <div class="relative mx-auto" :style="previewAnchorStyle">
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
                  class="absolute whitespace-nowrap"
                  :style="previewMarkerStyle"
                  >{{ referencePreview }}</span
                >
              </div>
            </div>
            <Field>
              <FieldLabel for="footnote-offset-x">{{
                $t(($) => $.dialog.footnoteProperties.offsetX, { ns: 'dialog' })
              }}</FieldLabel>
              <InputUnit
                id="footnote-offset-x"
                :model-value="offsetX"
                unit="unitless"
                :min="-10"
                :max="10"
                :step="0.01"
                @update:model-value="offsetX = $event ?? 0"
              />
            </Field>
            <Field>
              <FieldLabel for="footnote-offset-y">{{
                $t(($) => $.dialog.footnoteProperties.offsetY, { ns: 'dialog' })
              }}</FieldLabel>
              <InputUnit
                id="footnote-offset-y"
                :model-value="offsetY"
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
          </template>
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
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FootnoteAnchorElement } from '@/models/Element';
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
  pageSetup: PageSetup;
  paragraphStyles: ParagraphStyle[];
  automaticNumber: number;
  richTextReference: boolean;
}>();
const emit = defineEmits<{
  update: [
    marker: string | null,
    offsets: { footnoteOffsetX: number; footnoteOffsetY: number },
  ];
}>();
const open = defineModel<boolean>('open', { required: true });
const offsetX = ref(0);
const offsetY = ref(0);
const type = ref('automatic');
const customText = ref('');
const symbols: Record<string, string> = {
  asterisk: '*',
  dagger: '†',
  doubleDagger: '‡',
};
watch(
  [open, () => props.footnote],
  () => {
    if (!open.value) {
      return;
    }
    offsetX.value = props.anchor?.footnoteOffsetX ?? 0;
    offsetY.value = props.anchor?.footnoteOffsetY ?? 0;
    const marker = props.footnote.marker;
    type.value =
      marker === null
        ? 'automatic'
        : (Object.keys(symbols).find((key) => symbols[key] === marker) ??
          'custom');
    customText.value = marker ?? '';
  },
  { immediate: true },
);
const value = computed(() =>
  type.value === 'automatic'
    ? null
    : type.value === 'custom'
      ? customText.value
      : symbols[type.value],
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
    ? (normalizeFootnoteMarker(value.value) ?? String(props.automaticNumber))
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
        { footnoteOffsetX: offsetX.value, footnoteOffsetY: offsetY.value },
      ) as NoteElement | MartyriaElement),
);
const previewPosition = computed(() =>
  previewAnchor.value === null
    ? { left: 0, top: 0 }
    : LayoutService.getFootnoteMarkerPosition(
        previewAnchor.value,
        props.pageSetup,
        props.paragraphStyles,
        markerPreview.value,
      ),
);
const previewTop = computed(() =>
  Math.max(24, -previewPosition.value.top * 2 + 16),
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
function submit() {
  if (!valid.value) {
    return;
  }
  emit('update', normalizeFootnoteMarker(value.value), {
    footnoteOffsetX: offsetX.value,
    footnoteOffsetY: offsetY.value,
  });
  open.value = false;
}
</script>
