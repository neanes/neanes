<template>
  <Field>
    <div class="mb-2 flex items-center justify-between gap-2">
      <FieldLabel :for="`${idPrefix}-style`">{{
        $t(($) => $.dialog.initialMartyriaStyles.styleLabel, {
          ns: 'dialog',
        })
      }}</FieldLabel>
      <div class="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          @click="emit('open-style-dialog')"
        >
          {{
            $t(($) => $.dialog.initialMartyriaStyles.manageStyles, {
              ns: 'dialog',
            })
          }}
        </Button>
        <ParagraphStyleClearButton
          v-if="showClearOverrides"
          :disabled="!hasOverrides"
          @clear="update({ fontSize: null, color: null, strokeWidth: null })"
        />
      </div>
    </div>
    <InitialMartyriaStyleSelect
      :id="`${idPrefix}-style`"
      :model-value="element.initialMartyriaStyleId"
      :initial-martyria-styles="initialMartyriaStyles"
      :default-style-id="defaultInitialMartyriaStyleId"
      :rich-text-portal="richTextPortal"
      @update:model-value="update({ initialMartyriaStyleId: $event })"
      @update:open="emit('update:style-selector-open', $event)"
    />
  </Field>

  <Field orientation="horizontal">
    <FieldLabel :for="`${idPrefix}-font-size`">{{
      $t(($) => $.toolbar.initialMartyria.size, { ns: 'toolbar' })
    }}</FieldLabel>
    <div class="flex items-center gap-1">
      <InputFontSize
        :id="`${idPrefix}-font-size`"
        :model-value="primaryAppearance.fontSize"
        @update:model-value="update({ fontSize: $event })"
      />
      <ParagraphStyleClearButton
        :disabled="element.fontSize == null"
        @clear="update({ fontSize: null })"
      />
    </div>
  </Field>

  <Field orientation="horizontal">
    <FieldLabel>{{
      $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
    }}</FieldLabel>
    <div class="flex items-center gap-1">
      <ColorPicker
        :model-value="primaryAppearance.color"
        :rich-text-portal="richTextPortal"
        @update:model-value="update({ color: $event })"
      />
      <ParagraphStyleClearButton
        :disabled="element.color == null"
        @clear="update({ color: null })"
      />
    </div>
  </Field>

  <Field orientation="horizontal">
    <FieldLabel :for="`${idPrefix}-outline`">{{
      $t(($) => $.toolbar.common.outline, { ns: 'toolbar' })
    }}</FieldLabel>
    <div class="flex items-center gap-1">
      <InputStrokeWidth
        :id="`${idPrefix}-outline`"
        :model-value="primaryAppearance.strokeWidth"
        @update:model-value="update({ strokeWidth: $event })"
      />
      <ParagraphStyleClearButton
        :disabled="element.strokeWidth == null"
        @clear="update({ strokeWidth: null })"
      />
    </div>
  </Field>
</template>

<script setup lang="ts">
import ColorPicker from '@/components/ColorPicker.vue';
import InitialMartyriaStyleSelect from '@/components/InitialMartyriaStyleSelect.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import ParagraphStyleClearButton from '@/components/properties/ParagraphStyleClearButton.vue';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { useResolvedInitialMartyriaStyle } from '@/composables/useResolvedInitialMartyriaStyle';
import type { ModeKeyElement } from '@/models/Element';
import type { InitialMartyriaStyle } from '@/models/InitialMartyriaStyle';
import type { ParagraphStyle } from '@/models/ParagraphStyle';

/**
 * The style of a mode key, standalone or embedded in rich text, and its
 * local size, color, and outline overrides. The controls reflect the
 * resolved style (element overrides folded in); a change writes an explicit
 * element value and clear restores inheritance.
 */
const props = withDefaults(
  defineProps<{
    element: ModeKeyElement;
    paragraphStyles: ParagraphStyle[];
    initialMartyriaStyles: InitialMartyriaStyle[];
    /** The score's default style, which a mode key without a style follows. */
    defaultInitialMartyriaStyleId: string;
    /** Prefixes the ids of the controls, which must be unique on the page. */
    idPrefix: string;
    /** Portal popups so that they do not take focus from a rich text editor. */
    richTextPortal?: boolean;
    /** Show a button that clears every override at once. */
    showClearOverrides?: boolean;
  }>(),
  { richTextPortal: false, showClearOverrides: false },
);

const emit = defineEmits<{
  update: [values: Partial<ModeKeyElement>];
  'open-style-dialog': [];
  'update:style-selector-open': [value: boolean];
}>();

const { primaryAppearance, hasOverrides } = useResolvedInitialMartyriaStyle({
  element: () => props.element,
  paragraphStyles: () => props.paragraphStyles,
  initialMartyriaStyles: () => props.initialMartyriaStyles,
  defaultInitialMartyriaStyleId: () => props.defaultInitialMartyriaStyleId,
});

function update(values: Partial<ModeKeyElement>) {
  emit('update', values);
}
</script>
