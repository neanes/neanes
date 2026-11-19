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

      <Tabs
        v-model="selectedStyleId"
        orientation="vertical"
        class="grid min-h-0 grid-cols-[20rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-4 overflow-hidden"
      >
        <div
          class="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-2 overflow-hidden"
        >
          <ScrollArea class="min-h-0 min-w-0 border">
            <TabsList
              ref="styleList"
              class="h-auto w-full flex-col items-stretch justify-start gap-1 p-1"
            >
              <TabsTrigger
                v-for="row in rows"
                :key="row.style.id"
                :value="row.style.id"
                class="h-auto w-full flex-none flex-col items-stretch gap-1 px-2 py-2 text-left whitespace-normal"
              >
                <!--
                  One line: a name too long to fit is cut short, so the
                  qualifiers and the default star always stay beside it.
                -->
                <span class="flex min-w-0 items-center gap-1.5">
                  <span class="min-w-0 truncate font-medium">
                    {{ row.name }}
                  </span>
                  <Badge
                    variant="secondary"
                    class="shrink-0 text-[11px] font-normal"
                  >
                    {{ row.qualifiers.language }}
                  </Badge>
                  <Badge
                    v-if="row.qualifiers.lettering != null"
                    variant="secondary"
                    class="shrink-0 text-[11px] font-normal"
                  >
                    {{ row.qualifiers.lettering }}
                  </Badge>
                  <AppTooltip v-if="row.isDefault" :tooltip="defaultLabel">
                    <span
                      role="img"
                      :aria-label="defaultLabel"
                      class="ms-auto flex shrink-0"
                    >
                      <PhStar weight="fill" class="size-3.5" />
                    </span>
                  </AppTooltip>
                </span>
                <span class="flex h-7 items-center justify-start">
                  <InitialMartyriaSample
                    :martyria-style="row.style"
                    :paragraph-styles="paragraphStyles"
                    :template-id="listSampleTemplateId"
                    :page-setup="pageSetup"
                    :max-font-size="16"
                  />
                </span>
              </TabsTrigger>
            </TabsList>
          </ScrollArea>

          <div class="flex min-w-0 items-center gap-1">
            <AppTooltip :tooltip="addStyleLabel">
              <span class="inline-flex" @mousedown.prevent>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  :aria-label="addStyleLabel"
                  @click="openGallery"
                >
                  <PhPlus />
                </Button>
              </span>
            </AppTooltip>
            <AppTooltip :tooltip="setAsDefaultLabel">
              <span class="inline-flex" @mousedown.prevent>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  :disabled="selectedStyle.id === defaultStyleId"
                  :aria-label="setAsDefaultLabel"
                  @click="defaultStyleId = selectedStyle.id"
                >
                  <PhStar />
                </Button>
              </span>
            </AppTooltip>
            <div class="ml-auto flex items-center gap-1">
              <AppTooltip
                v-for="action in selectionActions"
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
          </div>
        </div>

        <TabsContent
          :key="selectedStyleId"
          :value="selectedStyleId"
          class="col-start-2 row-start-1 min-h-0 min-w-0 overflow-hidden"
        >
          <InitialMartyriaStylePanel
            ref="panel"
            :martyria-style="selectedStyle"
            :paragraph-styles="paragraphStyles"
            :page-setup="pageSetup"
            :is-default="selectedStyle.id === defaultStyleId"
            :name-valid="isNameValid(selectedStyle)"
            @update:martyria-style="replaceStyle($event)"
          />
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button type="button" variant="outline" @click="onOpenChange(false)">
          {{ $t(($) => $.dialog.common.cancel, { ns }) }}
        </Button>
        <Button type="button" :disabled="!canSubmit" @click="confirm">
          {{ $t(($) => $.dialog.common.update, { ns }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <InitialMartyriaPresetGallery
    v-model:open="galleryOpen"
    :paragraph-styles="paragraphStyles"
    :page-setup="pageSetup"
    :preferred-language-id="uiLanguageId"
    @select="addStyleFromPreset"
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
              name: qualifiedName(pendingDeletion.style),
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
              {{ qualifiedName(style) }}
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
import { PhCopy, PhPlus, PhStar, PhTrash } from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed, nextTick, type Ref, ref, useTemplateRef, watch } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import InitialMartyriaPresetGallery from '@/components/InitialMartyriaPresetGallery.vue';
import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import InitialMartyriaStylePanel from '@/components/InitialMartyriaStylePanel.vue';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type BuiltInInitialMartyriaStyle,
  createInitialMartyriaStyleFromPreset,
  getInitialMartyriaStyleDisplayName,
} from '@/models/InitialMartyriaBuiltInStyles';
import { createInitialMartyriaStyle } from '@/models/InitialMartyriaGrammar';
import {
  cloneInitialMartyriaStyle,
  getInitialMartyriaStyleNameKey,
  getInitialMartyriaStyleNameScope,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { deepEquals } from '@/utils/deepEquals';
import {
  getInitialMartyriaStyleQualifiedName,
  getInitialMartyriaStyleQualifiers,
} from '@/utils/initialMartyriaLabels';
import { getNextAvailableStyleName } from '@/utils/styleNames';

import {
  getSampleTemplateId,
  PLAGAL_SAMPLE_MODE,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

/**
 * Edits the score's own initial martyria styles. Every style here belongs
 * to the score and is edited in place; built-in styles are only presets a
 * new style is started from. Nothing is applied until Update.
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
    /** The style to select first, such as that of a selected mode key. */
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

const panel = useTemplateRef<{ focusName: () => void }>('panel');
const styleList = useTemplateRef<{ $el: HTMLElement }>('styleList');

// The dialog is mounted per open (v-if in TheEditor), so the working copy is
// snapshotted once at setup and edited in place until Update.
const styles = ref<InitialMartyriaStyle[]>(
  props.styles.map(cloneInitialMartyriaStyle),
);
const defaultStyleId = ref(props.defaultStyleId);
const replacements = ref<Record<string, string>>({});

const selectedStyleId = ref<string>(
  styles.value.some((style) => style.id === props.initialStyleId)
    ? props.initialStyleId!
    : defaultStyleId.value,
);
const selectedStyle = computed(() =>
  styles.value.find((style) => style.id === selectedStyleId.value)!,
);

const galleryOpen = ref(false);

const listSampleTemplateId = getSampleTemplateId(PLAGAL_SAMPLE_MODE);

const uiLanguageId = computed<InitialMartyriaLanguageId>(() => {
  const language = i18next.language.split('-')[0];
  return initialMartyriaLanguageIds.includes(
    language as InitialMartyriaLanguageId,
  )
    ? (language as InitialMartyriaLanguageId)
    : INITIAL_MARTYRIA_LANGUAGE_IDS.English;
});

function displayName(style: InitialMartyriaStyle) {
  return style.displayName.trim();
}

// Names are unique only within a language and lettering, so where styles
// are named outside the list, the qualifiers are shown with the name.
function qualifiedName(style: InitialMartyriaStyle) {
  return getInitialMartyriaStyleQualifiedName(t, displayName(style), style);
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
    displayName(style).length > 0 &&
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

const rows = computed(() =>
  styles.value.map((style) => ({
    style,
    name: displayName(style),
    qualifiers: getInitialMartyriaStyleQualifiers(t, style),
    isDefault: style.id === defaultStyleId.value,
  })),
);

/*
 * Keep the selected row in view. A selection can land outside the visible
 * part of the list: the style the dialog opens on, or one just added, which
 * goes to the end of the list.
 */
function scrollSelectedStyleIntoView(block: ScrollLogicalPosition) {
  styleList.value?.$el
    .querySelector('[role="tab"][data-state="active"]')
    ?.scrollIntoView({ block });
}

// The dialog portal renders its content after this component mounts, so the
// list is only there to scroll once its ref is set.
watch(
  styleList,
  (list) => {
    if (list != null) {
      scrollSelectedStyleIntoView('center');
    }
  },
  { flush: 'post' },
);
watch(selectedStyleId, () => scrollSelectedStyleIntoView('nearest'), {
  flush: 'post',
});

const addStyleLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.addStyle, { ns }),
);
const defaultLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.defaultBadge, { ns }),
);
const setAsDefaultLabel = computed(() =>
  t(($) => $.dialog.initialMartyriaStyles.setAsDefault, { ns }),
);

const selectionActions = computed(() => [
  {
    key: 'duplicate',
    label: t(($) => $.dialog.initialMartyriaStyles.duplicate, { ns }),
    icon: PhCopy,
    onClick: duplicateSelectedStyle,
  },
  {
    key: 'delete',
    label: t(($) => $.dialog.initialMartyriaStyles.delete, { ns }),
    icon: PhTrash,
    disabled: styles.value.length < 2,
    onClick: deleteSelectedStyle,
  },
]);

/** The names of the styles in a name scope. */
function takenNames(nameScope: string) {
  return styles.value
    .filter((style) => getInitialMartyriaStyleNameScope(style) === nameScope)
    .map(displayName);
}

async function addStyle(style: InitialMartyriaStyle) {
  styles.value = [...styles.value, style];
  selectedStyleId.value = style.id;
  // The panel is rebuilt for the new style, so its name field is only
  // reachable once the change has been rendered.
  await nextTick();
  panel.value?.focusName();
}

/*
 * A style from a preset is named after it. The style's language and
 * lettering are shown beside its name wherever styles are listed, since they
 * can be changed afterwards and presets in different name scopes share names.
 */
function addStyleFromPreset(preset: BuiltInInitialMartyriaStyle) {
  const style = createInitialMartyriaStyleFromPreset(
    preset,
    getNextAvailableStyleName(
      getInitialMartyriaStyleDisplayName(preset, t),
      takenNames(getInitialMartyriaStyleNameScope(preset)),
    ),
  );
  nestedDialogResult = () => addStyle(style);
}

/*
 * The preset gallery and the delete prompt open over this dialog. Each hides
 * the rest of the page from assistive technology before it takes focus, and
 * stops only once it has unmounted, after its close event. The buttons that
 * open them keep focus where it was, often the name field, so focus is
 * released before one opens rather than left inside the hidden region.
 *
 * The change a nested dialog confirms is applied once it has closed, on the
 * next task, as the dialog's own fallback focus is. Applied any earlier, it
 * would rebuild the panel while the page is hidden, and this dialog's focus
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

function openGallery() {
  openNestedDialog(galleryOpen);
}

function onNestedDialogCloseAutoFocus(event: Event) {
  event.preventDefault();
  const result = nestedDialogResult;
  const previous = focusBeforeNestedDialog;
  nestedDialogResult = null;
  focusBeforeNestedDialog = null;
  setTimeout(() => {
    if (result != null) {
      result();
    } else {
      previous?.focus();
    }
  });
}

function duplicateSelectedStyle() {
  const style = selectedStyle.value;
  addStyle(
    createInitialMartyriaStyle({
      ...style,
      displayName: getNextAvailableStyleName(
        t(($) => $.dialog.initialMartyriaStyles.copyStyleName, {
          ns,
          name: displayName(style),
        }),
        takenNames(getInitialMartyriaStyleNameScope(style)),
      ),
    }),
  );
}

function replaceStyle(next: InitialMartyriaStyle) {
  styles.value = styles.value.map((style) =>
    style.id === next.id ? next : style,
  );
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
function deleteSelectedStyle() {
  const style = selectedStyle.value;
  // Delete is disabled for the last style, so another always remains.
  const remaining = styles.value.filter((item) => item.id !== style.id);
  const fallback =
    style.id === defaultStyleId.value ? remaining[0].id : defaultStyleId.value;
  const usage = usageOf(style.id);
  if (usage === 0) {
    removeStyle(style.id, fallback);
    return;
  }
  pendingDeletion.value = { style, usage, replacementId: fallback };
  openNestedDialog(deleteConfirmOpen);
}

/*
 * The prompt renders only while a deletion is pending. The style is removed
 * once the prompt has closed, and focus then moves to the row of the style
 * selected in its place, since the field that had it is gone.
 */
function confirmDeletion() {
  const { style, replacementId } = pendingDeletion.value!;
  nestedDialogResult = async () => {
    removeStyle(style.id, replacementId);
    await nextTick();
    styleList.value?.$el
      .querySelector<HTMLElement>('[role="tab"][data-state="active"]')
      ?.focus();
  };
}

function removeStyle(styleId: string, replacementId: string) {
  const index = styles.value.findIndex((style) => style.id === styleId);
  styles.value = styles.value.filter((style) => style.id !== styleId);

  // Mode keys of styles deleted earlier in favor of this one move on too.
  const next: Record<string, string> = {};
  for (const [originalId, targetId] of Object.entries(replacements.value)) {
    next[originalId] = targetId === styleId ? replacementId : targetId;
  }
  next[styleId] = replacementId;
  replacements.value = next;

  if (defaultStyleId.value === styleId) {
    defaultStyleId.value = replacementId;
  }
  selectedStyleId.value =
    styles.value[index]?.id ?? styles.value[index - 1]?.id ?? replacementId;
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
