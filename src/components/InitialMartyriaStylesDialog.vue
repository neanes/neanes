<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-3xl"
    >
      <DialogHeader>
        <DialogTitle>{{
          $t(($) => $.dialog.initialMartyriaStyles.root, { ns: 'dialog' })
        }}</DialogTitle>
        <DialogDescription>{{
          $t(($) => $.dialog.initialMartyriaStyles.description, {
            ns: 'dialog',
          })
        }}</DialogDescription>
      </DialogHeader>
      <div class="grid min-h-0 gap-4 sm:grid-cols-[13rem_minmax(0,1fr)]">
        <div class="flex min-h-0 flex-col gap-2">
          <ScrollArea class="min-h-0 flex-1 border">
            <div class="p-1">
              <Button
                v-for="style in allStyles"
                :key="style.id"
                variant="ghost"
                class="w-full justify-start"
                :class="selectedStyleId === style.id && 'bg-accent'"
                @click="selectedStyleId = style.id"
              >
                {{ styleDisplayName(style) }}
                <span
                  v-if="style.id === activeStyleId"
                  class="ml-auto text-xs text-muted-foreground"
                  >{{
                    $t(($) => $.dialog.initialMartyriaStyles.active, {
                      ns: 'dialog',
                    })
                  }}</span
                >
              </Button>
            </div>
          </ScrollArea>
          <div class="flex gap-1">
            <Button size="sm" variant="outline" @click="createStyle">{{
              $t(($) => $.dialog.initialMartyriaStyles.new, { ns: 'dialog' })
            }}</Button>
            <Button
              size="sm"
              variant="outline"
              :disabled="selectedStyle == null"
              @click="duplicateStyle"
              >{{
                $t(($) => $.dialog.initialMartyriaStyles.duplicate, {
                  ns: 'dialog',
                })
              }}</Button
            >
            <Button
              size="sm"
              variant="outline"
              :disabled="
                selectedCustomStyle == null || selectedStyleId === activeStyleId
              "
              @click="deleteStyle"
              >{{
                $t(($) => $.dialog.initialMartyriaStyles.delete, {
                  ns: 'dialog',
                })
              }}</Button
            >
          </div>
        </div>
        <ScrollArea class="min-h-0 border">
          <FieldGroup v-if="selectedStyle != null" class="p-4">
            <Field orientation="horizontal">
              <FieldLabel for="initial-martyria-style-name">{{
                $t(($) => $.dialog.initialMartyriaStyles.name, { ns: 'dialog' })
              }}</FieldLabel>
              <Input
                id="initial-martyria-style-name"
                :disabled="selectedCustomStyle == null"
                :model-value="selectedStyle.displayName"
                @update:model-value="updateName"
              />
            </Field>
            <Field orientation="horizontal">
              <FieldLabel>{{
                $t(($) => $.dialog.initialMartyriaStyles.flowDirection, {
                  ns: 'dialog',
                })
              }}</FieldLabel>
              <Select
                :disabled="selectedCustomStyle == null"
                :model-value="selectedStyle.flowDirection"
                @update:model-value="updateFlowDirection"
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent
                  ><SelectItem value="page">{{
                    $t(($) => $.dialog.initialMartyriaStyles.page, {
                      ns: 'dialog',
                    })
                  }}</SelectItem
                  ><SelectItem value="ltr">LTR</SelectItem
                  ><SelectItem value="rtl">RTL</SelectItem></SelectContent
                >
              </Select>
            </Field>
            <Field>
              <FieldLabel>{{
                $t(($) => $.dialog.initialMartyriaStyles.components, {
                  ns: 'dialog',
                })
              }}</FieldLabel>
              <div class="space-y-2">
                <div
                  v-for="(component, index) in selectedStyle.components"
                  :key="component.id"
                  class="flex items-center gap-2 rounded border p-2"
                >
                  <span class="min-w-0 flex-1 text-sm">{{
                    componentDisplayName(component)
                  }}</span>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    :disabled="selectedCustomStyle == null || index === 0"
                    :aria-label="
                      $t(($) => $.dialog.initialMartyriaStyles.moveUp, {
                        ns: 'dialog',
                      })
                    "
                    @click="moveComponent(index, -1)"
                    >↑</Button
                  >
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    :disabled="
                      selectedCustomStyle == null ||
                      index === selectedStyle.components.length - 1
                    "
                    :aria-label="
                      $t(($) => $.dialog.initialMartyriaStyles.moveDown, {
                        ns: 'dialog',
                      })
                    "
                    @click="moveComponent(index, 1)"
                    >↓</Button
                  >
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    :disabled="selectedCustomStyle == null"
                    :aria-label="
                      $t(
                        ($) => $.dialog.initialMartyriaStyles.removeComponent,
                        { ns: 'dialog' },
                      )
                    "
                    @click="removeComponent(index)"
                    >×</Button
                  >
                </div>
              </div>
              <div class="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  :disabled="selectedCustomStyle == null"
                  @click="addComponent('notationGlyph')"
                  >{{
                    $t(($) => $.dialog.initialMartyriaStyles.addNotation, {
                      ns: 'dialog',
                    })
                  }}</Button
                >
                <Button
                  size="sm"
                  variant="outline"
                  :disabled="selectedCustomStyle == null"
                  @click="addComponent('startingPitchCluster')"
                  >{{
                    $t(($) => $.dialog.initialMartyriaStyles.addPitch, {
                      ns: 'dialog',
                    })
                  }}</Button
                >
                <Button
                  size="sm"
                  variant="outline"
                  :disabled="selectedCustomStyle == null"
                  @click="addComponent('literal')"
                  >{{
                    $t(($) => $.dialog.initialMartyriaStyles.addText, {
                      ns: 'dialog',
                    })
                  }}</Button
                >
              </div>
            </Field>
            <Button
              :disabled="selectedStyleId === activeStyleId || !stylesAreValid"
              @click="useForDocument"
              >{{
                $t(($) => $.dialog.initialMartyriaStyles.useForDocument, {
                  ns: 'dialog',
                })
              }}</Button
            >
            <Button :disabled="!stylesAreValid" @click="applyStyles">{{
              $t(($) => $.dialog.common.update, { ns: 'dialog' })
            }}</Button>
          </FieldGroup>
        </ScrollArea>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, ref, toRaw, watch } from 'vue';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  type InitialMartyriaComponent,
  type InitialMartyriaStyle,
  type ModeTerminology,
  traditionalGreekInitialMartyriaStyle,
  validateInitialMartyriaStyle,
  validateModeTerminology,
} from '@/models/InitialMartyriaStyle';

const emit = defineEmits<{
  update: [
    { styles: InitialMartyriaStyle[]; terminologies: ModeTerminology[] },
  ];
  'use-style': [id: string];
}>();
const props = defineProps<{
  styles: InitialMartyriaStyle[];
  terminologies: ModeTerminology[];
  activeStyleId?: string;
}>();
const open = defineModel<boolean>('open', { required: true });
const { t } = useTranslation();
const workingStyles = ref<InitialMartyriaStyle[]>([]);
const workingTerminologies = ref<ModeTerminology[]>([]);
const selectedStyleId = ref(
  props.activeStyleId ?? BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
);
const allStyles = computed(() => [
  traditionalGreekInitialMartyriaStyle,
  ...workingStyles.value,
]);
const selectedStyle = computed(
  () =>
    allStyles.value.find((style) => style.id === selectedStyleId.value) ??
    traditionalGreekInitialMartyriaStyle,
);
const selectedCustomStyle = computed(
  () =>
    workingStyles.value.find((style) => style.id === selectedStyleId.value) ??
    null,
);
const stylesAreValid = computed(
  () =>
    workingStyles.value.every(
      (style) =>
        validateInitialMartyriaStyle(style, workingTerminologies.value)
          .length === 0,
    ) &&
    workingTerminologies.value.every(
      (terminology) => validateModeTerminology(terminology).length === 0,
    ),
);

watch(
  () => props.activeStyleId,
  (id) => {
    if (id != null && allStyles.value.some((style) => style.id === id)) {
      selectedStyleId.value = id;
    }
  },
);
watch(
  () => [open.value, props.styles, props.terminologies] as const,
  () => {
    if (open.value) {
      workingStyles.value = structuredClone(toRaw(props.styles));
      workingTerminologies.value = structuredClone(toRaw(props.terminologies));
    }
  },
  { immediate: true },
);

function commit(transform: (styles: InitialMartyriaStyle[]) => void) {
  transform(workingStyles.value);
}
function applyStyles() {
  if (!stylesAreValid.value) {
    return;
  }
  emit('update', {
    styles: structuredClone(workingStyles.value),
    terminologies: structuredClone(workingTerminologies.value),
  });
}
function useForDocument() {
  applyStyles();
  emit('use-style', selectedStyleId.value);
}
function createStyle() {
  const style = structuredClone(traditionalGreekInitialMartyriaStyle);
  style.id = crypto.randomUUID();
  style.displayName = t(($) => $.dialog.initialMartyriaStyles.newStyle, {
    ns: 'dialog',
  });
  commit((styles) => styles.push(style));
  selectedStyleId.value = style.id;
}
function duplicateStyle() {
  if (selectedStyle.value == null) {
    return;
  }
  const style = structuredClone(selectedStyle.value);
  style.id = crypto.randomUUID();
  style.displayName = `${style.displayName} ${t(
    ($) => $.dialog.initialMartyriaStyles.copy,
    { ns: 'dialog' },
  )}`;
  commit((styles) => styles.push(style));
  selectedStyleId.value = style.id;
}
function deleteStyle() {
  commit((styles) =>
    styles.splice(
      styles.findIndex((style) => style.id === selectedStyleId.value),
      1,
    ),
  );
  selectedStyleId.value =
    BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1;
}
function updateSelected(update: (style: InitialMartyriaStyle) => void) {
  commit((styles) => {
    const style = styles.find(
      (candidate) => candidate.id === selectedStyleId.value,
    );
    if (style != null) {
      update(style);
    }
  });
}
function updateName(value: string | number) {
  updateSelected((style) => {
    style.displayName = String(value);
  });
}
function updateFlowDirection(value: unknown) {
  if (value === 'page' || value === 'ltr' || value === 'rtl') {
    updateSelected((style) => {
      style.flowDirection = value;
    });
  }
}
function moveComponent(index: number, direction: number) {
  updateSelected((style) => {
    const target = index + direction;
    [style.components[index], style.components[target]] = [
      style.components[target],
      style.components[index],
    ];
  });
}
function removeComponent(index: number) {
  if (selectedStyle.value.components.length <= 1) {
    return;
  }
  updateSelected((style) => {
    style.components.splice(index, 1);
  });
}
function addComponent(
  kind: 'notationGlyph' | 'startingPitchCluster' | 'literal',
) {
  const component: InitialMartyriaComponent =
    kind === 'notationGlyph'
      ? { id: crypto.randomUUID(), kind, source: 'traditionalModeSign' }
      : kind === 'startingPitchCluster'
        ? { id: crypto.randomUUID(), kind }
        : { id: crypto.randomUUID(), kind, text: '' };
  updateSelected((style) => style.components.push(component));
}
function styleDisplayName(style: InitialMartyriaStyle) {
  return style.id === BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1
    ? t(($) => $.dialog.initialMartyriaStyles.traditionalGreek, {
        ns: 'dialog',
      })
    : style.displayName;
}
function componentDisplayName(component: InitialMartyriaComponent) {
  return t(
    ($) =>
      $.dialog.initialMartyriaStyles.componentKinds[
        component.kind as keyof typeof $.dialog.initialMartyriaStyles.componentKinds
      ],
    { ns: 'dialog' },
  );
}
</script>
