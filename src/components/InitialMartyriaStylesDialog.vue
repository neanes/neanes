<template>
  <Dialog v-model:open="open">
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
        class="grid min-h-0 grid-cols-[15rem_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] gap-4 overflow-hidden"
      >
        <div
          class="grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[minmax(0,1fr)_auto] gap-2 overflow-hidden"
        >
          <ScrollArea class="min-h-0 min-w-0 border">
            <TabsList
              class="h-auto w-full flex-col items-stretch justify-start p-1"
            >
              <template v-for="group in listGroups" :key="group.key">
                <p
                  class="px-2 pt-3 pb-1 text-left text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                >
                  {{ group.label }}
                </p>
                <p
                  v-if="group.key === 'custom' && group.rows.length === 0"
                  class="px-2 py-1 text-left text-xs text-muted-foreground"
                >
                  {{
                    $t(($) => $.dialog.initialMartyriaStyles.noCustomStyles, {
                      ns,
                    })
                  }}
                </p>
                <TabsTrigger
                  v-for="row in group.rows"
                  :key="row.styleId"
                  :value="row.styleId"
                  class="min-h-7 w-full flex-none justify-start gap-2 py-1 whitespace-normal text-left"
                >
                  <span class="min-w-0 flex-1">{{ row.name }}</span>
                  <Badge
                    v-if="row.isDocumentDefault"
                    variant="outline"
                    class="shrink-0"
                  >
                    {{
                      $t(($) => $.dialog.initialMartyriaStyles.defaultBadge, {
                        ns,
                      })
                    }}
                  </Badge>
                </TabsTrigger>
              </template>
            </TabsList>
          </ScrollArea>

          <div class="flex min-w-0 flex-wrap items-center gap-2">
            <AppTooltip
              v-for="action in creationActions"
              :key="action.key"
              :tooltip="action.label"
            >
              <span class="inline-flex" @mousedown.prevent>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  :aria-label="action.label"
                  @click="action.onClick"
                >
                  <component :is="action.icon" />
                </Button>
              </span>
            </AppTooltip>
            <div class="ml-auto flex items-center gap-2">
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
            v-model:sample-mode="sampleMode"
            :martyria-style="selectedStyle"
            :paragraph-styles="paragraphStyles"
            :page-setup="pageSetup"
            :based-on-style="selectedBasedOnStyle"
            :duplicate-of-style="duplicateOfSelectedStyle"
            :name-valid="selectedStyleNameValid"
            @update:martyria-style="applyStyleChange($event)"
            @use-style-instead="useStyleInstead($event)"
          />
        </TabsContent>
      </Tabs>

      <DialogFooter class="items-center sm:justify-between">
        <span class="text-xs text-muted-foreground">
          {{
            $t(($) => $.dialog.initialMartyriaStyles.documentDefaultStatus, {
              ns,
              name: documentDefaultName,
            })
          }}
        </span>
        <div class="flex flex-wrap items-center justify-end gap-2">
          <DialogClose as-child>
            <Button type="button" variant="outline">
              {{ $t(($) => $.dialog.common.cancel, { ns }) }}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="outline"
            :disabled="!canSubmit"
            @click="confirm('update')"
          >
            {{ $t(($) => $.dialog.common.update, { ns }) }}
          </Button>
          <Button
            type="button"
            :variant="target === 'element' ? 'outline' : 'default'"
            :disabled="!canSubmit"
            @click="confirm('use-for-document')"
          >
            {{
              $t(($) => $.dialog.initialMartyriaStyles.useForDocument, { ns })
            }}
          </Button>
          <Button
            v-if="target === 'element'"
            type="button"
            :disabled="!canSubmit"
            @click="confirm('apply-to-element')"
          >
            {{ $t(($) => $.dialog.initialMartyriaStyles.apply, { ns }) }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  PhArrowCounterClockwise,
  PhCopy,
  PhPlus,
  PhTrash,
} from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed, nextTick, ref, useTemplateRef } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import InitialMartyriaStylePanel from '@/components/InitialMartyriaStylePanel.vue';
import { Badge } from '@/components/ui/badge';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  builtInInitialMartyriaStyles,
  DEFAULT_INITIAL_MARTYRIA_STYLE_ID,
  findInitialMartyriaStyle,
  getBuiltInInitialMartyriaStyle,
  getDefaultBuiltInInitialMartyriaStyle,
  getInitialMartyriaStyleDisplayName,
  getInitialMartyriaStyleOrDefault,
  getInitialMartyriaStyles,
  isBuiltInInitialMartyriaStyleId,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  createInitialMartyriaStyle,
  findInitialMartyriaStyleWithStructure,
} from '@/models/InitialMartyriaGrammar';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  initialMartyriaStructureHasOrdinalDigits,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import type { ParagraphStyle } from '@/models/ParagraphStyle';
import { getInitialMartyriaLanguageName } from '@/utils/initialMartyriaLabels';
import {
  areStyleDisplayNamesValid,
  getNextAvailableStyleName,
} from '@/utils/styleNames';

import { PLAGAL_SAMPLE_MODE } from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

const props = withDefaults(
  defineProps<{
    /** The score's own styles. The dialog edits a copy of this list. */
    styles: InitialMartyriaStyle[];
    paragraphStyles: ParagraphStyle[];
    pageSetup: PageSetup;
    target?: 'document' | 'element';
    /** The element's own style when the dialog targets an element. */
    elementStyleId?: string | null;
  }>(),
  { target: 'document', elementStyleId: null },
);

const emit = defineEmits<{
  confirm: [
    payload: {
      styles: InitialMartyriaStyle[];
      styleId: string;
      /** Update keeps the edits and changes nothing else. */
      action: 'update' | 'use-for-document' | 'apply-to-element';
    },
  ];
}>();

const open = defineModel<boolean>('open', { required: true });
const { t, i18next } = useTranslation();

const panel = useTemplateRef<{ focusName: () => void }>('panel');

// The dialog is mounted per open (v-if in TheEditor), so the working copy is
// snapshotted once at setup and edited in place until a confirm button is
// pressed. Cancel closes without emitting, which discards all of it.
const styles = ref<InitialMartyriaStyle[]>(
  props.styles.map(cloneInitialMartyriaStyle),
);
const styleSnapshots = new Map(
  props.styles.map((style) => [style.id, cloneInitialMartyriaStyle(style)]),
);

const documentDefaultStyleId = ref(
  findInitialMartyriaStyle(
    props.styles,
    props.pageSetup.initialMartyriaStyleId,
  ) != null
    ? props.pageSetup.initialMartyriaStyleId
    : DEFAULT_INITIAL_MARTYRIA_STYLE_ID,
);

const initialStyleId =
  (props.target === 'element' ? props.elementStyleId : null) ??
  documentDefaultStyleId.value;
const selectedStyleId = ref<string>(
  findInitialMartyriaStyle(props.styles, initialStyleId) != null
    ? initialStyleId
    : documentDefaultStyleId.value,
);

const sampleMode = ref(PLAGAL_SAMPLE_MODE);

const allStyles = computed(() => getInitialMartyriaStyles(styles.value));
// The selection is always a style that exists: deletion and the initial
// selection both fall back to the default built-in style.
const selectedStyle = computed(() =>
  getInitialMartyriaStyleOrDefault(styles.value, selectedStyleId.value),
);
const selectedIsBuiltIn = computed(() =>
  isBuiltInInitialMartyriaStyleId(selectedStyle.value.id),
);

const selectedBasedOnStyle = computed(() =>
  selectedStyle.value.basedOn == null
    ? null
    : getBuiltInInitialMartyriaStyle(selectedStyle.value.basedOn),
);
const documentDefaultName = computed(() =>
  getInitialMartyriaStyleDisplayName(
    getInitialMartyriaStyleOrDefault(
      styles.value,
      documentDefaultStyleId.value,
    ),
    t,
  ),
);

/*
 * Another style the selected one is written exactly like. The structure is
 * judged on what it renders rather than on its axes, so two structures that
 * differ only in how they are described count as the same; the typography
 * has to agree as well, since the same wording in another font is a style of
 * its own. Only a custom style can be abandoned for the style it duplicates,
 * so built-in styles are exempt.
 */
const duplicateOfSelectedStyle = computed(() =>
  selectedIsBuiltIn.value
    ? null
    : findInitialMartyriaStyleWithStructure(
        allStyles.value.filter(
          (style) =>
            style.id !== selectedStyle.value.id &&
            hasSameTypography(style, selectedStyle.value),
        ),
        selectedStyle.value.structure,
      ),
);

function hasSameTypography(a: InitialMartyriaStyle, b: InitialMartyriaStyle) {
  return (
    a.paragraphStyleId === b.paragraphStyleId &&
    a.greekParagraphStyleId === b.greekParagraphStyleId &&
    // Ordinal forms are only ever visible in a structure that prints one.
    (a.useOrdinalForms === b.useOrdinalForms ||
      !initialMartyriaStructureHasOrdinalDigits(b.structure))
  );
}

// Only the score's own styles are named by the user, but a name a built-in
// style already carries is taken too.
const builtInStyleNames = computed(() =>
  builtInInitialMartyriaStyles.map((style) =>
    getInitialMartyriaStyleDisplayName(style, t),
  ),
);

const builtInStyleNameSet = computed(
  () => new Set(builtInStyleNames.value.map((name) => name.trim())),
);

const customStyleNamesValid = computed(() =>
  areStyleDisplayNamesValid(styles.value.map((style) => style.displayName)),
);

function styleNameIsBuiltIn(style: InitialMartyriaStyle) {
  return builtInStyleNameSet.value.has(style.displayName.trim());
}

const canSubmit = computed(
  () =>
    customStyleNamesValid.value &&
    styles.value.every((style) => !styleNameIsBuiltIn(style)),
);

const selectedStyleNameValid = computed(() => {
  const selected = selectedStyle.value;

  if (isBuiltInInitialMartyriaStyleId(selected.id)) {
    return true;
  }

  const name = selected.displayName.trim();

  return (
    name.length > 0 &&
    !styleNameIsBuiltIn(selected) &&
    styles.value.every(
      (style) => style.id === selected.id || style.displayName.trim() !== name,
    )
  );
});

const uiLanguageId = computed<InitialMartyriaLanguageId>(() => {
  const language = i18next.language.split('-')[0];
  return initialMartyriaLanguageIds.includes(
    language as InitialMartyriaLanguageId,
  )
    ? (language as InitialMartyriaLanguageId)
    : INITIAL_MARTYRIA_LANGUAGE_IDS.English;
});

interface ListRow {
  styleId: string;
  name: string;
  isDocumentDefault: boolean;
}

function rowFor(style: InitialMartyriaStyle): ListRow {
  return {
    styleId: style.id,
    name: getInitialMartyriaStyleDisplayName(style, t),
    isDocumentDefault: style.id === documentDefaultStyleId.value,
  };
}

const listGroups = computed(() => {
  const groups: { key: string; label: string; rows: ListRow[] }[] = [
    {
      key: 'custom',
      label: t(($) => $.dialog.initialMartyriaStyles.custom, { ns }),
      rows: styles.value.map(rowFor),
    },
  ];
  for (const languageId of initialMartyriaLanguageIds) {
    groups.push({
      key: `builtin:${languageId}`,
      label: t(($) => $.dialog.initialMartyriaStyles.builtInLanguage, {
        ns,
        language: getInitialMartyriaLanguageName(t, languageId),
      }),
      rows: builtInInitialMartyriaStyles
        .filter((style) => style.structure.languageId === languageId)
        .map(rowFor),
    });
  }
  return groups;
});

const creationActions = computed(() => [
  {
    key: 'new',
    label: t(($) => $.dialog.initialMartyriaStyles.new, { ns }),
    icon: PhPlus,
    onClick: createStyle,
  },
  {
    key: 'duplicate',
    label: t(($) => $.dialog.initialMartyriaStyles.duplicate, { ns }),
    icon: PhCopy,
    onClick: duplicateSelectedStyle,
  },
]);

const selectionActions = computed(() => [
  {
    key: 'reset',
    label: t(($) => $.dialog.initialMartyriaStyles.resetToBase, { ns }),
    icon: PhArrowCounterClockwise,
    disabled: selectedIsBuiltIn.value || selectedBasedOnStyle.value == null,
    onClick: resetSelectedStyleToBase,
  },
  {
    key: 'delete',
    label: t(($) => $.dialog.initialMartyriaStyles.delete, { ns }),
    icon: PhTrash,
    disabled: selectedIsBuiltIn.value,
    onClick: deleteSelectedStyle,
  },
]);

/** Every name a new style has to avoid. */
function takenNames() {
  return [
    ...styles.value.map((style) => style.displayName),
    ...builtInStyleNames.value,
  ];
}

function copyName(style: InitialMartyriaStyle) {
  return getNextAvailableStyleName(
    t(($) => $.dialog.initialMartyriaStyles.copyStyleName, {
      ns,
      name: getInitialMartyriaStyleDisplayName(style, t),
    }),
    takenNames(),
  );
}

function addStyle(style: InitialMartyriaStyle) {
  styles.value = [...styles.value, style];
  selectedStyleId.value = style.id;
}

/** Select the name of a style just created, so typing replaces it. */
async function focusNewStyleName() {
  // The panel is rebuilt for the new style, so its name field is only
  // reachable once the change has been rendered.
  await nextTick();
  panel.value?.focusName();
}

/*
 * Built-in styles are read-only, so the first change to one continues in a
 * copy of it. Every other change replaces the style in the working copy.
 */
function applyStyleChange(next: InitialMartyriaStyle) {
  const source = selectedStyle.value;
  if (isBuiltInInitialMartyriaStyleId(source.id)) {
    addStyle(
      createInitialMartyriaStyle({
        ...next,
        displayName: copyName(source),
        basedOn: source.id,
      }),
    );
    return;
  }
  styles.value = styles.value.map((style) =>
    style.id === next.id ? next : style,
  );
}

function createStyle() {
  const base = getDefaultBuiltInInitialMartyriaStyle(uiLanguageId.value);
  addStyle(
    createInitialMartyriaStyle({
      ...base,
      displayName: getNextAvailableStyleName(
        t(($) => $.dialog.initialMartyriaStyles.newStyleName, { ns }),
        takenNames(),
      ),
      basedOn: base.id,
    }),
  );
  focusNewStyleName();
}

function duplicateSelectedStyle() {
  const style = selectedStyle.value;
  addStyle(
    createInitialMartyriaStyle({
      ...style,
      displayName: copyName(style),
      basedOn: isBuiltInInitialMartyriaStyleId(style.id)
        ? style.id
        : style.basedOn,
    }),
  );
  focusNewStyleName();
}

function resetSelectedStyleToBase() {
  const base = selectedBasedOnStyle.value;
  if (base == null) {
    return;
  }
  applyStyleChange({
    ...selectedStyle.value,
    structure: { ...base.structure },
    paragraphStyleId: base.paragraphStyleId,
    greekParagraphStyleId: base.greekParagraphStyleId,
    useOrdinalForms: base.useOrdinalForms,
  });
}

function deleteSelectedStyle() {
  const styleId = selectedStyle.value.id;
  if (isBuiltInInitialMartyriaStyleId(styleId)) {
    return;
  }
  const index = styles.value.findIndex((style) => style.id === styleId);
  const remaining = styles.value.filter((style) => style.id !== styleId);
  styles.value = remaining;
  if (documentDefaultStyleId.value === styleId) {
    documentDefaultStyleId.value = DEFAULT_INITIAL_MARTYRIA_STYLE_ID;
  }
  // The next custom style takes the selection, then the previous one, and
  // finally the document's own style when no custom style is left.
  selectedStyleId.value =
    remaining[index]?.id ??
    remaining[index - 1]?.id ??
    documentDefaultStyleId.value;
}

/*
 * The style being edited is abandoned in favor of the one it duplicates: a
 * style that existed when the dialog opened goes back to how it was, and one
 * created since is dropped.
 */
function useStyleInstead(style: InitialMartyriaStyle) {
  const current = selectedStyle.value;
  if (!isBuiltInInitialMartyriaStyleId(current.id)) {
    const snapshot = styleSnapshots.get(current.id);
    styles.value =
      snapshot == null
        ? styles.value.filter((item) => item.id !== current.id)
        : styles.value.map((item) =>
            item.id === current.id ? cloneInitialMartyriaStyle(snapshot) : item,
          );
  }
  selectedStyleId.value = style.id;
}

function confirm(action: 'update' | 'use-for-document' | 'apply-to-element') {
  if (!canSubmit.value) {
    return;
  }
  emit('confirm', {
    styles: styles.value.map((style) => ({
      ...cloneInitialMartyriaStyle(style),
      displayName: style.displayName.trim(),
    })),
    styleId: selectedStyleId.value,
    action,
  });
  open.value = false;
}
</script>
