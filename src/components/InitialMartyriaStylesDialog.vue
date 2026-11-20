<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent
      class="grid h-[46rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-[68rem]"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.initialMartyriaStyles.root, { ns }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t(($) => $.dialog.initialMartyriaStyles.description, { ns }) }}
        </DialogDescription>
      </DialogHeader>

      <ScrollArea class="min-h-0 border">
        <ul
          ref="styleList"
          :aria-label="$t(($) => $.dialog.initialMartyriaStyles.root, { ns })"
        >
          <li
            v-for="row in rows"
            :key="row.style.id"
            :data-style-id="row.style.id"
            class="grid grid-cols-[auto_minmax(0,13rem)_minmax(0,1fr)_minmax(0,16rem)_auto] items-start gap-x-4 border-b px-3 py-3 last:border-b-0"
          >
            <AppTooltip
              :tooltip="row.isDefault ? defaultLabel : setAsDefaultLabel"
            >
              <span class="inline-flex" @mousedown.prevent>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="row.isDefault ? defaultLabel : setAsDefaultLabel"
                  :aria-pressed="row.isDefault"
                  @click="defaultStyleId = row.style.id"
                >
                  <PhStar :weight="row.isDefault ? 'fill' : 'regular'" />
                </Button>
              </span>
            </AppTooltip>

            <Field>
              <Input
                :id="`initial-martyria-style-name-${row.style.id}`"
                :model-value="row.style.displayName"
                :placeholder="namePlaceholder"
                :aria-label="nameLabel"
                :aria-invalid="!row.nameValid"
                @update:model-value="
                  update(row.style, { displayName: String($event) })
                "
              />
              <FieldError v-if="!row.nameValid" class="text-xs">
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.nameInvalid, { ns })
                }}
              </FieldError>
            </Field>

            <div
              class="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1"
              role="img"
              :aria-label="previewLabel"
            >
              <template v-for="sample in listSamples" :key="sample.mode">
                <span class="text-[11px] text-muted-foreground">
                  {{ $t(sample.labelSelector, { ns: 'model' }) }}
                </span>
                <span class="flex min-h-7 items-center justify-start">
                  <InitialMartyriaSample
                    :martyria-style="row.style"
                    :paragraph-styles="paragraphStyles"
                    :template-id="sample.templateId"
                    :page-setup="pageSetup"
                    :max-font-size="18"
                  />
                </span>
              </template>
            </div>

            <div class="flex flex-col gap-3">
              <Field v-if="row.paragraphStyleUsage.regular">
                <FieldLabel
                  :for="`initial-martyria-paragraph-style-${row.style.id}`"
                  class="text-xs"
                >
                  {{
                    $t(($) => $.toolbar.common.paragraphStyle, {
                      ns: 'toolbar',
                    })
                  }}
                </FieldLabel>
                <ParagraphStyleSelect
                  :id="`initial-martyria-paragraph-style-${row.style.id}`"
                  :model-value="row.style.paragraphStyleId"
                  :paragraph-styles="paragraphStyles"
                  @update:model-value="
                    update(row.style, { paragraphStyleId: $event })
                  "
                />
              </Field>
              <Field v-if="row.paragraphStyleUsage.greek">
                <FieldLabel
                  :for="`initial-martyria-greek-paragraph-style-${row.style.id}`"
                  class="text-xs"
                >
                  {{
                    $t(
                      ($) => $.dialog.initialMartyriaStyles.greekParagraphStyle,
                      { ns },
                    )
                  }}
                </FieldLabel>
                <ParagraphStyleSelect
                  :id="`initial-martyria-greek-paragraph-style-${row.style.id}`"
                  :model-value="row.style.greekParagraphStyleId"
                  :paragraph-styles="paragraphStyles"
                  @update:model-value="
                    update(row.style, { greekParagraphStyleId: $event })
                  "
                />
              </Field>
              <Field v-if="row.offersOrdinalForms" orientation="horizontal">
                <Checkbox
                  :id="`initial-martyria-ordinal-forms-${row.style.id}`"
                  :model-value="row.style.useOrdinalForms"
                  @update:model-value="
                    update(row.style, { useOrdinalForms: $event === true })
                  "
                />
                <FieldLabel
                  :for="`initial-martyria-ordinal-forms-${row.style.id}`"
                  class="text-xs font-normal"
                >
                  {{
                    $t(($) => $.dialog.initialMartyriaStyles.useOrdinalForms, {
                      ns,
                    })
                  }}
                </FieldLabel>
              </Field>
            </div>

            <div class="flex items-center gap-1">
              <AppTooltip
                v-for="action in row.actions"
                :key="action.key"
                :tooltip="action.label"
              >
                <span class="inline-flex" @mousedown.prevent>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    :disabled="action.disabled"
                    :aria-label="action.label"
                    @click="action.onClick"
                  >
                    <component :is="action.icon" />
                  </Button>
                </span>
              </AppTooltip>
            </div>
          </li>
        </ul>
      </ScrollArea>

      <DialogFooter class="sm:justify-between">
        <span class="inline-flex" @mousedown.prevent>
          <Button type="button" variant="outline" @click="openPicker(null)">
            <PhPlus />
            {{ addStyleLabel }}
          </Button>
        </span>
        <div class="flex gap-2">
          <Button type="button" variant="outline" @click="onOpenChange(false)">
            {{ $t(($) => $.dialog.common.cancel, { ns }) }}
          </Button>
          <Button type="button" :disabled="!canSubmit" @click="confirm">
            {{ $t(($) => $.dialog.common.update, { ns }) }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <InitialMartyriaWordingPicker
    v-model:open="pickerOpen"
    :paragraph-styles="paragraphStyles"
    :page-setup="pageSetup"
    :editing-style="pickerStyle"
    :preferred-language-id="preferredLanguageId"
    :used-wording-keys="usedWordingKeys"
    @select="onWordingSelected"
    @close-auto-focus="onNestedDialogCloseAutoFocus"
  />

  <AlertDialog v-model:open="discardConfirmOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{
            $t(($) => $.dialog.initialMartyriaStyles.discardChangesTitle, {
              ns,
            })
          }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t(
              ($) => $.dialog.initialMartyriaStyles.discardChangesDescription,
              { ns },
            )
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          {{ $t(($) => $.dialog.initialMartyriaStyles.keepEditing, { ns }) }}
        </AlertDialogCancel>
        <AlertDialogAction variant="destructive" @click="open = false">
          {{ $t(($) => $.dialog.initialMartyriaStyles.discard, { ns }) }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <AlertDialog v-model:open="deleteConfirmOpen">
    <AlertDialogContent
      v-if="pendingDeletion != null"
      @close-auto-focus="onNestedDialogCloseAutoFocus"
    >
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{
            $t(($) => $.dialog.initialMartyriaStyles.deleteTitle, {
              ns,
              name: pendingDeletion.style.displayName,
            })
          }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t(($) => $.dialog.initialMartyriaStyles.deleteInUseDescription, {
              ns,
              count: pendingDeletion.usage,
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <Field>
        <FieldLabel for="initial-martyria-replacement-style">
          {{
            $t(($) => $.dialog.initialMartyriaStyles.replacementStyle, { ns })
          }}
        </FieldLabel>
        <Select v-model="pendingDeletion.replacementId">
          <SelectTrigger id="initial-martyria-replacement-style" class="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="style in replacementCandidates"
              :key="style.id"
              :value="style.id"
            >
              {{ style.displayName }}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <AlertDialogFooter>
        <AlertDialogCancel>
          {{ $t(($) => $.dialog.common.cancel, { ns }) }}
        </AlertDialogCancel>
        <AlertDialogAction variant="destructive" @click="confirmDeletion">
          {{ $t(($) => $.dialog.initialMartyriaStyles.delete, { ns }) }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import {
  PhCopy,
  PhPencilSimple,
  PhPlus,
  PhStar,
  PhTrash,
} from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed, nextTick, type Ref, ref, useTemplateRef, watch } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import InitialMartyriaWordingPicker from '@/components/InitialMartyriaWordingPicker.vue';
import ParagraphStyleSelect from '@/components/ParagraphStyleSelect.vue';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createDefaultInitialMartyriaTypography } from '@/models/InitialMartyriaBuiltInStyles';
import { createInitialMartyriaStyle } from '@/models/InitialMartyriaGrammar';
import {
  getInitialMartyriaParagraphStyleUsage,
  getInitialMartyriaWordingKey,
  initialMartyriaStyleOffersOrdinalForms,
} from '@/models/InitialMartyriaResolver';
import {
  cloneInitialMartyriaStyle,
  getInitialMartyriaStyleNameKey,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_LETTERINGS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaLettering,
  type InitialMartyriaStructure,
  type InitialMartyriaStyle,
  type ModeKeyMode,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { deepEquals } from '@/utils/deepEquals';
import { getNewInitialMartyriaStyleName } from '@/utils/initialMartyriaLabels';
import { getNextAvailableStyleName } from '@/utils/styleNames';

import {
  getSample,
  withInitialMartyriaStyleStructure,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

/** The modes each style is previewed in: first, plagal first, and grave. */
const LIST_SAMPLE_MODES: ModeKeyMode[] = [1, 5, 7];

/**
 * Lists the score's own initial martyria styles. A style's wording is
 * chosen in the wording picker, when it is added or changed; the list sets
 * its name, typography, and the document default. Nothing is applied until
 * Update.
 */
const props = withDefaults(
  defineProps<{
    /** The score's styles. The dialog edits a copy of this list. */
    styles: InitialMartyriaStyle[];
    /** The score's default style, which mode keys without a style follow. */
    defaultStyleId: string;
    paragraphStyles: ParagraphStyle[];
    pageSetup: PageSetup;
    /** How many mode keys name each style explicitly. */
    usageCounts: Record<string, number>;
    /** How many mode keys follow the default style. */
    defaultUsageCount: number;
    /** The style to scroll to first, such as that of a selected mode key. */
    initialStyleId?: string | null;
  }>(),
  { initialStyleId: null },
);

const emit = defineEmits<{
  confirm: [
    payload: {
      styles: InitialMartyriaStyle[];
      defaultStyleId: string;
      /** The style each deleted style's mode keys use instead. */
      replacements: Record<string, string>;
    },
  ];
}>();

const open = defineModel<boolean>('open', { required: true });
const { t, i18next } = useTranslation();

const styleList = useTemplateRef<HTMLElement>('styleList');

// The dialog is mounted per open (v-if in TheEditor), so the working copy is
// snapshotted once at setup and edited in place until Update.
const styles = ref<InitialMartyriaStyle[]>(
  props.styles.map(cloneInitialMartyriaStyle),
);
const defaultStyleId = ref(props.defaultStyleId);
const replacements = ref<Record<string, string>>({});

const listSamples = LIST_SAMPLE_MODES.map(getSample);

function styleNames() {
  return styles.value.map(getInitialMartyriaStyleNameKey);
}

const nameCounts = computed(() => {
  const counts = new Map<string, number>();
  for (const style of styles.value) {
    const key = getInitialMartyriaStyleNameKey(style);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
});

function isNameValid(style: InitialMartyriaStyle) {
  return (
    getInitialMartyriaStyleNameKey(style).length > 0 &&
    nameCounts.value.get(getInitialMartyriaStyleNameKey(style)) === 1
  );
}

const canSubmit = computed(() => styles.value.every(isNameValid));

/*
 * How many mode keys will use a style once the dialog's changes apply: the
 * ones naming it, the ones naming a style deleted in its favor, and, for the
 * default, the ones that follow the default.
 */
function usageOf(styleId: string) {
  let count = styleId === defaultStyleId.value ? props.defaultUsageCount : 0;
  for (const [originalId, uses] of Object.entries(props.usageCounts)) {
    if ((replacements.value[originalId] ?? originalId) === styleId) {
      count += uses;
    }
  }
  return count;
}

const nameLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.name, { ns }),
);
const namePlaceholder = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.styleNamePlaceholder, { ns }),
);
const previewLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.preview, { ns }),
);
const addStyleLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.addStyle, { ns }),
);
const defaultLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.defaultBadge, { ns }),
);
const setAsDefaultLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.setAsDefault, { ns }),
);

const rows = computed(() =>
  styles.value.map((style) => {
    const isDefault = style.id === defaultStyleId.value;
    return {
      style,
      isDefault,
      nameValid: isNameValid(style),
      paragraphStyleUsage: getInitialMartyriaParagraphStyleUsage(style),
      offersOrdinalForms: initialMartyriaStyleOffersOrdinalForms(style),
      actions: [
        {
          key: 'change-wording',
          label: t(($) => $.dialog.initialMartyriaStyles.changeWording, {
            ns,
          }),
          icon: PhPencilSimple,
          disabled: false,
          onClick: () => openPicker(style),
        },
        {
          key: 'duplicate',
          label: t(($) => $.dialog.initialMartyriaStyles.duplicate, { ns }),
          icon: PhCopy,
          disabled: false,
          onClick: () => duplicateStyle(style),
        },
        {
          key: 'delete',
          label: t(($) => $.dialog.initialMartyriaStyles.delete, { ns }),
          icon: PhTrash,
          // The default always remains, so the list is never empty.
          disabled: isDefault,
          onClick: () => deleteStyle(style),
        },
      ],
    };
  }),
);

function scrollStyleIntoView(styleId: string, block: ScrollLogicalPosition) {
  styleList.value
    ?.querySelector(`[data-style-id="${styleId}"]`)
    ?.scrollIntoView({ block });
}

// The dialog portal renders its content after this component mounts, so the
// list is only there to scroll once its ref is set.
watch(
  styleList,
  (list) => {
    if (list != null && props.initialStyleId != null) {
      scrollStyleIntoView(props.initialStyleId, 'center');
    }
  },
  { flush: 'post' },
);

function update(style: InitialMartyriaStyle, changes: object) {
  replaceStyle({ ...style, ...changes });
}

function replaceStyle(next: InitialMartyriaStyle) {
  styles.value = styles.value.map((style) =>
    style.id === next.id ? next : style,
  );
}

async function addStyle(style: InitialMartyriaStyle, after: string | null) {
  const index = styles.value.findIndex((other) => other.id === after);
  styles.value =
    index < 0
      ? [...styles.value, style]
      : styles.value.toSpliced(index + 1, 0, style);
  await nextTick();
  scrollStyleIntoView(style.id, 'nearest');
}

function duplicateStyle(style: InitialMartyriaStyle) {
  addStyle(
    createInitialMartyriaStyle({
      ...style,
      displayName: getNextAvailableStyleName(style.displayName, styleNames()),
    }),
    style.id,
  );
}

/*
 * The wording picker opens on a style to change its wording, or on nothing
 * to add a style.
 */
const pickerOpen = ref(false);
const pickerStyle = ref<InitialMartyriaStyle | null>(null);

const uiLanguageId = computed<InitialMartyriaLanguageId>(() => {
  const language = i18next.language.split('-')[0];
  return initialMartyriaLanguageIds.includes(
    language as InitialMartyriaLanguageId,
  )
    ? (language as InitialMartyriaLanguageId)
    : INITIAL_MARTYRIA_LANGUAGE_IDS.English;
});

/*
 * A new style starts in the language of the default style. A neume font
 * default, which every score starts with, says nothing about the language
 * the user writes in, so the UI language stands in for it.
 */
const preferredLanguageId = computed(() => {
  const defaultStyle = styles.value.find(
    (style) => style.id === defaultStyleId.value,
  )!;
  return defaultStyle.lettering === INITIAL_MARTYRIA_LETTERINGS.MusicFont
    ? uiLanguageId.value
    : defaultStyle.structure.languageId;
});

const usedWordingKeys = computed(
  () => new Set(styles.value.map(getInitialMartyriaWordingKey)),
);

function openPicker(style: InitialMartyriaStyle | null) {
  pickerStyle.value = style;
  openNestedDialog(pickerOpen);
}

function onWordingSelected(wording: {
  structure: InitialMartyriaStructure;
  lettering: InitialMartyriaLettering;
}) {
  const style = pickerStyle.value;
  if (style == null) {
    const added = createInitialMartyriaStyle({
      ...createDefaultInitialMartyriaTypography(),
      displayName: '',
      structure: wording.structure,
      lettering: wording.lettering,
    });
    added.displayName = getNewInitialMartyriaStyleName(t, added, styleNames());
    nestedDialogResult = () => addStyle(added, null);
    return;
  }
  const changed = withInitialMartyriaStyleStructure(
    style,
    wording.structure,
    wording.lettering,
  );
  nestedDialogResult = () => replaceStyle(changed);
}

/*
 * The wording picker and the delete prompt open over this dialog. Each hides
 * the rest of the page from assistive technology before it takes focus, and
 * stops only once it has unmounted, after its close event. The buttons that
 * open them keep focus where it was, so focus is released before one opens
 * rather than left inside the hidden region.
 *
 * The change a nested dialog confirms is applied once it has closed, on the
 * next task, as the dialog's own fallback focus is. Applied any earlier, it
 * would rebuild the list while the page is hidden, and this dialog's focus
 * trap would move focus into the hidden region. Without a change, focus
 * returns to where it was.
 */
let focusBeforeNestedDialog: HTMLElement | null = null;
let nestedDialogResult: (() => void) | null = null;

function openNestedDialog(open: Ref<boolean>) {
  focusBeforeNestedDialog =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  focusBeforeNestedDialog?.blur();
  open.value = true;
}

function onNestedDialogCloseAutoFocus(event: Event) {
  event.preventDefault();
  const result = nestedDialogResult;
  const previous = focusBeforeNestedDialog;
  nestedDialogResult = null;
  focusBeforeNestedDialog = null;
  setTimeout(() => {
    result?.();
    previous?.focus();
  });
}

const pendingDeletion = ref<{
  style: InitialMartyriaStyle;
  usage: number;
  replacementId: string;
} | null>(null);

// The deletion outlives the prompt closing, which happens before the
// prompt's own button handler runs.
const deleteConfirmOpen = ref(false);

const replacementCandidates = computed(() =>
  styles.value.filter((style) => style.id !== pendingDeletion.value?.style.id),
);

/*
 * A style no mode key uses goes at once. Otherwise the user chooses the
 * style its mode keys switch to, so none of them changes silently.
 */
function deleteStyle(style: InitialMartyriaStyle) {
  const usage = usageOf(style.id);
  if (usage === 0) {
    removeStyle(style.id, defaultStyleId.value);
    return;
  }
  pendingDeletion.value = {
    style,
    usage,
    replacementId: defaultStyleId.value,
  };
  openNestedDialog(deleteConfirmOpen);
}

/*
 * The prompt renders only while a deletion is pending. The style is removed
 * once the prompt has closed.
 */
function confirmDeletion() {
  const { style, replacementId } = pendingDeletion.value!;
  nestedDialogResult = () => removeStyle(style.id, replacementId);
}

function removeStyle(styleId: string, replacementId: string) {
  styles.value = styles.value.filter((style) => style.id !== styleId);

  // Mode keys of styles deleted earlier in favor of this one move on too.
  const next: Record<string, string> = {};
  for (const [originalId, targetId] of Object.entries(replacements.value)) {
    next[originalId] = targetId === styleId ? replacementId : targetId;
  }
  next[styleId] = replacementId;
  replacements.value = next;
}

const discardConfirmOpen = ref(false);

function trimmedStyles() {
  return styles.value.map((style) => ({
    ...cloneInitialMartyriaStyle(style),
    displayName: style.displayName.trim(),
  }));
}

const hasChanges = computed(
  () =>
    defaultStyleId.value !== props.defaultStyleId ||
    !deepEquals(trimmedStyles(), props.styles),
);

/*
 * Every way of dismissing the dialog (Cancel, the close button, Escape, a
 * click outside) comes through here, so unsaved edits are never dropped
 * without asking. Update closes the dialog directly.
 */
function onOpenChange(value: boolean) {
  if (!value && hasChanges.value) {
    discardConfirmOpen.value = true;
    return;
  }
  open.value = value;
}

function confirm() {
  if (!canSubmit.value) {
    return;
  }
  emit('confirm', {
    styles: trimmedStyles(),
    defaultStyleId: defaultStyleId.value,
    replacements: { ...replacements.value },
  });
  open.value = false;
}
</script>
