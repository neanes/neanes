<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent
      class="grid h-[44rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-5xl"
      @escape-key-down="onEscapeKeyDown"
    >
      <DialogHeader>
        <Breadcrumb v-if="view === 'edit'">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink as="button" type="button" @click="goBack">
                {{ $t(($) => $.dialog.initialMartyriaStyles.styles, { ns }) }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ editorBreadcrumb }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <DialogTitle>
          {{ $t(($) => $.dialog.initialMartyriaStyles.root, { ns }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t(($) => $.dialog.initialMartyriaStyles.description, { ns }) }}
        </DialogDescription>
      </DialogHeader>

      <div
        class="grid min-h-0 gap-4 overflow-hidden"
        :class="view === 'list' && 'sm:grid-cols-[14rem_minmax(0,1fr)]'"
      >
        <div
          v-if="view === 'list'"
          class="grid min-h-0 min-w-0 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-2 overflow-hidden"
        >
          <div class="flex items-center gap-1">
            <Input
              v-model="search"
              type="search"
              class="min-w-0 flex-1"
              :placeholder="
                $t(($) => $.dialog.initialMartyriaStyles.searchStyles, { ns })
              "
              :aria-label="
                $t(($) => $.dialog.initialMartyriaStyles.searchStyles, { ns })
              "
            />
            <AppTooltip
              :tooltip="$t(($) => $.dialog.initialMartyriaStyles.new, { ns })"
            >
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                :aria-label="
                  $t(($) => $.dialog.initialMartyriaStyles.new, { ns })
                "
                @click="createStyle"
              >
                <PhPlus />
              </Button>
            </AppTooltip>
          </div>

          <ScrollArea class="min-h-0 rounded-md border">
            <div class="p-1">
              <template v-for="group in listGroups" :key="group.key">
                <p
                  class="px-2 pt-3 pb-1 text-[11px] font-medium text-muted-foreground uppercase"
                >
                  {{ group.label }}
                </p>
                <p
                  v-if="group.rows.length === 0"
                  class="px-2 py-1 text-xs text-muted-foreground"
                >
                  {{
                    $t(($) => $.dialog.initialMartyriaStyles.noCustomStyles, {
                      ns,
                    })
                  }}
                </p>
                <button
                  v-for="row in group.rows"
                  :key="row.key"
                  type="button"
                  class="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  :class="row.selected && 'bg-muted'"
                  :aria-pressed="row.selected"
                  @click="selectedStyleId = row.styleId"
                  @dblclick="editStyle(row.style)"
                >
                  <span class="truncate">{{ row.name }}</span>
                  <PhLock
                    v-if="row.builtIn"
                    class="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span
                    v-else
                    class="shrink-0 text-[11px] text-muted-foreground"
                  >
                    {{ row.languageName }}
                  </span>
                </button>
              </template>
            </div>
          </ScrollArea>
        </div>

        <InitialMartyriaStyleEditor
          v-if="view === 'edit' && editor != null"
          v-model="editor.draft"
          v-model:sample-mode="sampleMode"
          :page-setup="pageSetup"
          :paragraph-styles="paragraphStyles"
          :name-valid="draftNameValid"
        />

        <ScrollArea v-else class="min-h-0">
          <div class="space-y-4 p-1">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="min-w-0 space-y-1">
                <p class="text-base font-medium">{{ selectedName }}</p>
                <Badge
                  v-if="selectedBasedOn != null"
                  variant="outline"
                  class="max-w-full"
                >
                  <span class="truncate">
                    {{
                      $t(($) => $.dialog.initialMartyriaStyles.basedOn, {
                        ns,
                        name: getInitialMartyriaStyleDisplayName(
                          selectedBasedOn,
                          t,
                        ),
                      })
                    }}
                  </span>
                </Badge>
              </div>
              <div class="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="duplicateStyle(selectedStyle)"
                >
                  <PhCopy />
                  {{
                    $t(($) => $.dialog.initialMartyriaStyles.duplicate, { ns })
                  }}
                </Button>
                <Button
                  v-if="!selectedIsBuiltIn"
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="deleteDialogOpen = true"
                >
                  <PhTrash />
                  {{ $t(($) => $.dialog.initialMartyriaStyles.delete, { ns }) }}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="editStyle(selectedStyle)"
                >
                  <PhPencilSimple />
                  {{ $t(($) => $.dialog.initialMartyriaStyles.edit, { ns }) }}
                </Button>
              </div>
            </div>

            <div
              class="flex flex-col items-center gap-3 overflow-hidden rounded-md border bg-muted/40 px-4 py-6"
            >
              <div
                v-for="templateId in listPreviewTemplateIds"
                :key="templateId"
                class="flex max-w-full flex-col items-center gap-1"
              >
                <InitialMartyriaSample
                  :martyria-style="selectedStyle"
                  :paragraph-styles="paragraphStyles"
                  :template-id="templateId"
                  :page-setup="pageSetup"
                  :max-font-size="32"
                />
                <span
                  class="text-center text-xs text-muted-foreground"
                  :lang="selectedStyle.structure.languageId"
                  aria-hidden="true"
                >
                  {{ pronunciationFor(selectedStyle, templateId) }}
                </span>
              </div>
            </div>

            <dl
              class="grid grid-cols-[max-content_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[max-content_minmax(0,1fr)_max-content_minmax(0,1fr)]"
            >
              <template v-for="item in summary" :key="item.label">
                <dt class="text-muted-foreground">{{ item.label }}</dt>
                <dd class="flex min-w-0 items-center gap-2">
                  <span
                    v-if="item.swatch != null"
                    class="inline-block size-3.5 shrink-0 rounded-sm border"
                    :style="{ backgroundColor: item.swatch }"
                    aria-hidden="true"
                  />
                  <span class="truncate">{{ item.value }}</span>
                </dd>
              </template>
            </dl>
          </div>
        </ScrollArea>
      </div>

      <DialogFooter class="items-center sm:justify-between">
        <div class="min-w-0 flex-1">
          <Alert
            v-if="view === 'edit' && duplicateOfDraft != null"
            class="py-2"
          >
            <PhInfo />
            <AlertDescription class="flex flex-wrap items-center gap-x-3">
              <span>
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.duplicateOfStyle, {
                    ns,
                    name: getInitialMartyriaStyleDisplayName(
                      duplicateOfDraft,
                      t,
                    ),
                  })
                }}
              </span>
              <Button
                type="button"
                variant="link"
                size="sm"
                class="h-auto px-0"
                @click="useStyleInstead(duplicateOfDraft)"
              >
                {{
                  $t(($) => $.dialog.initialMartyriaStyles.useStyleInstead, {
                    ns,
                    name: getInitialMartyriaStyleDisplayName(
                      duplicateOfDraft,
                      t,
                    ),
                  })
                }}
              </Button>
            </AlertDescription>
          </Alert>
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <template v-if="view === 'list'">
            <Button type="button" variant="outline" @click="open = false">
              {{ $t(($) => $.dialog.common.cancel, { ns }) }}
            </Button>
            <Button
              v-if="target === 'element'"
              type="button"
              variant="outline"
              @click="useForDocument"
            >
              {{
                $t(($) => $.dialog.initialMartyriaStyles.useForDocument, { ns })
              }}
            </Button>
            <Button
              v-if="target === 'element'"
              type="button"
              @click="applyToElement"
            >
              {{ $t(($) => $.dialog.initialMartyriaStyles.apply, { ns }) }}
            </Button>
            <Button v-else type="button" @click="useForDocument">
              {{
                $t(($) => $.dialog.initialMartyriaStyles.useForDocument, { ns })
              }}
            </Button>
          </template>
          <template v-else>
            <Button type="button" variant="outline" @click="cancelEdit">
              {{ $t(($) => $.dialog.common.cancel, { ns }) }}
            </Button>
            <Button
              type="button"
              :disabled="!draftNameValid"
              @click="saveDraft"
            >
              {{ $t(($) => $.dialog.initialMartyriaStyles.save, { ns }) }}
            </Button>
          </template>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <AlertDialog v-model:open="discardDialogOpen">
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
              { ns, name: editor?.draft.displayName ?? '' },
            )
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          {{ $t(($) => $.dialog.common.cancel, { ns }) }}
        </AlertDialogCancel>
        <AlertDialogAction @click="confirmDiscard">
          {{ $t(($) => $.dialog.initialMartyriaStyles.discard, { ns }) }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <AlertDialog v-model:open="deleteDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{
            $t(($) => $.dialog.initialMartyriaStyles.deleteStyleTitle, { ns })
          }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t(($) => $.dialog.initialMartyriaStyles.deleteStyleDescription, {
              ns,
              name: selectedName,
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>
          {{ $t(($) => $.dialog.common.cancel, { ns }) }}
        </AlertDialogCancel>
        <AlertDialogAction @click="deleteSelectedStyle">
          {{ $t(($) => $.dialog.initialMartyriaStyles.delete, { ns }) }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import {
  PhCopy,
  PhInfo,
  PhLock,
  PhPencilSimple,
  PhPlus,
  PhTrash,
} from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed, ref } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import InitialMartyriaStyleEditor from '@/components/InitialMartyriaStyleEditor.vue';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { usesGreekScript } from '@/models/InitialMartyriaLexicon';
import {
  cloneInitialMartyriaStyle,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import type { PageSetup } from '@/models/PageSetup';
import {
  type ParagraphStyle,
  resolveParagraphStyle,
} from '@/models/ParagraphStyle';
import { deepEquals } from '@/utils/deepEquals';
import {
  getInitialMartyriaLanguageName,
  getInitialMartyriaModeIdentificationMethodLabel,
  getInitialMartyriaModeNamingSchemeLabel,
  getInitialMartyriaNumeralFormLabel,
  getInitialMartyriaNumeralKindLabel,
  getInitialMartyriaNumeralQualifierLabel,
} from '@/utils/initialMartyriaLabels';
import {
  areStyleDisplayNamesValid,
  getNextAvailableStyleName,
} from '@/utils/styleNames';
import { Unit } from '@/utils/Unit';

import {
  getSamplePronunciation,
  getSampleTemplateId,
  GRAVE_SAMPLE_MODE,
  PLAGAL_SAMPLE_MODE,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

const props = withDefaults(
  defineProps<{
    /** The score's own styles. Edits are emitted as they are saved. */
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
  'update:styles': [styles: InitialMartyriaStyle[]];
  apply: [styleId: string];
  'use-for-document': [styleId: string];
}>();

const open = defineModel<boolean>('open', { required: true });
const { t, i18next } = useTranslation();

type View = 'list' | 'edit';

interface EditorState {
  draft: InitialMartyriaStyle;
  /** The saved style being edited, or null for a style not yet saved. */
  originalId: string | null;
  /** The draft as it was opened, to compare the edited draft against. */
  snapshot: InitialMartyriaStyle;
}

const view = ref<View>('list');
const editor = ref<EditorState | null>(null);
const search = ref('');
const sampleMode = ref(PLAGAL_SAMPLE_MODE);
const discardDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
let afterDiscard: (() => void) | null = null;

const initialStyleId =
  (props.target === 'element' ? props.elementStyleId : null) ??
  props.pageSetup.initialMartyriaStyleId;
const selectedStyleId = ref<string>(
  findInitialMartyriaStyle(props.styles, initialStyleId) != null
    ? initialStyleId
    : DEFAULT_INITIAL_MARTYRIA_STYLE_ID,
);

const allStyles = computed(() => getInitialMartyriaStyles(props.styles));
// The selection is always a style that exists: deletion and the initial
// selection both fall back to the default built-in style.
const selectedStyle = computed(() =>
  getInitialMartyriaStyleOrDefault(props.styles, selectedStyleId.value),
);
const selectedIsBuiltIn = computed(() =>
  isBuiltInInitialMartyriaStyleId(selectedStyle.value.id),
);
const selectedName = computed(() =>
  getInitialMartyriaStyleDisplayName(selectedStyle.value, t),
);
const selectedBasedOn = computed(() =>
  selectedStyle.value.basedOn == null
    ? null
    : getBuiltInInitialMartyriaStyle(selectedStyle.value.basedOn),
);

const listPreviewTemplateIds = [
  getSampleTemplateId(PLAGAL_SAMPLE_MODE),
  getSampleTemplateId(GRAVE_SAMPLE_MODE),
];

const uiLanguageId = computed<InitialMartyriaLanguageId>(() => {
  const language = i18next.language.split('-')[0];
  return initialMartyriaLanguageIds.includes(
    language as InitialMartyriaLanguageId,
  )
    ? (language as InitialMartyriaLanguageId)
    : INITIAL_MARTYRIA_LANGUAGE_IDS.English;
});

interface ListRow {
  key: string;
  styleId: string;
  style: InitialMartyriaStyle;
  name: string;
  builtIn: boolean;
  languageName: string;
  selected: boolean;
}

function matchesSearch(name: string) {
  return name
    .toLocaleLowerCase()
    .includes(search.value.trim().toLocaleLowerCase());
}

function rowFor(style: InitialMartyriaStyle): ListRow {
  return {
    key: style.id,
    styleId: style.id,
    style,
    name: getInitialMartyriaStyleDisplayName(style, t),
    builtIn: isBuiltInInitialMartyriaStyleId(style.id),
    languageName: getInitialMartyriaLanguageName(t, style.structure.languageId),
    selected: style.id === selectedStyleId.value,
  };
}

const listGroups = computed(() => {
  const groups: { key: string; label: string; rows: ListRow[] }[] = [];
  groups.push({
    key: 'custom',
    label: t(($) => $.dialog.initialMartyriaStyles.custom, { ns }),
    rows: props.styles.map(rowFor).filter((row) => matchesSearch(row.name)),
  });
  // The UI language's built-in styles come first; the rest keep model order.
  const languageIds = [
    uiLanguageId.value,
    ...initialMartyriaLanguageIds.filter((id) => id !== uiLanguageId.value),
  ];
  for (const languageId of languageIds) {
    const rows = builtInInitialMartyriaStyles
      .filter((style) => style.structure.languageId === languageId)
      .map(rowFor)
      .filter((row) => matchesSearch(row.name));
    if (rows.length > 0) {
      groups.push({
        key: `builtin:${languageId}`,
        label: t(($) => $.dialog.initialMartyriaStyles.builtInLanguage, {
          ns,
          language: getInitialMartyriaLanguageName(t, languageId),
        }),
        rows,
      });
    }
  }
  return groups;
});

const summary = computed(() => {
  const style = selectedStyle.value;
  const structure = style.structure;
  const mainTypography = resolveParagraphStyle(
    props.paragraphStyles,
    style.paragraphStyleId,
  );
  const greekTypography = resolveParagraphStyle(
    props.paragraphStyles,
    style.greekParagraphStyleId,
  );
  const primaryTypography = usesGreekScript(structure.languageId)
    ? greekTypography
    : mainTypography;
  const items: { label: string; value: string; swatch?: string }[] = [
    {
      label: t(($) => $.dialog.initialMartyriaStyles.language, { ns }),
      value: getInitialMartyriaLanguageName(t, structure.languageId),
    },
    {
      label: t(($) => $.dialog.initialMartyriaStyles.modeIdentification, {
        ns,
      }),
      value: getInitialMartyriaModeIdentificationMethodLabel(
        t,
        structure.modeIdentificationMethod,
      ),
    },
    {
      label: t(($) => $.dialog.initialMartyriaStyles.numberForm, { ns }),
      value:
        structure.modeIdentificationMethod ===
        INITIAL_MARTYRIA_MODE_IDENTIFICATION_METHODS.ModeSign
          ? getInitialMartyriaNumeralKindLabel(t, structure.numeralKind)
          : getInitialMartyriaNumeralFormLabel(t, structure),
    },
    {
      label: t(($) => $.dialog.initialMartyriaStyles.numberPlacement, { ns }),
      value: getInitialMartyriaNumeralQualifierLabel(
        t,
        structure.numeralQualifier,
      ),
    },
    {
      label: t(($) => $.dialog.initialMartyriaStyles.plagalWording, { ns }),
      value: getInitialMartyriaModeNamingSchemeLabel(
        t,
        structure.modeNamingScheme,
      ),
    },
  ];
  if (!usesGreekScript(structure.languageId)) {
    items.push({
      label: t(($) => $.dialog.initialMartyriaStyles.transliterateNoteNames, {
        ns,
      }),
      value: structure.transliterateNoteNames
        ? t(($) => $.dialog.initialMartyriaStyles.yes, { ns })
        : t(($) => $.dialog.initialMartyriaStyles.no, { ns }),
    });
  }
  items.push({
    label: t(($) => $.dialog.initialMartyriaStyles.font, { ns }),
    value: t(($) => $.dialog.initialMartyriaStyles.fontSummary, {
      ns,
      font: primaryTypography.fontFamily,
      size: Unit.toPt(primaryTypography.fontSize),
    }),
  });
  if (!usesGreekScript(structure.languageId)) {
    items.push({
      label: t(($) => $.dialog.initialMartyriaStyles.greekTextFont, { ns }),
      value: t(($) => $.dialog.initialMartyriaStyles.fontSummary, {
        ns,
        font: greekTypography.fontFamily,
        size: Unit.toPt(greekTypography.fontSize),
      }),
    });
  }
  items.push({
    label: t(($) => $.dialog.pageSetup.color, { ns }),
    value: primaryTypography.color,
    swatch: primaryTypography.color,
  });
  return items;
});

const editorBreadcrumb = computed(() =>
  editor.value == null
    ? ''
    : editor.value.originalId == null
      ? t(($) => $.dialog.initialMartyriaStyles.newStyleBreadcrumb, { ns })
      : t(($) => $.dialog.initialMartyriaStyles.editStyleBreadcrumb, {
          ns,
          name: editor.value.draft.displayName,
        }),
);

const draftNameValid = computed(() => {
  if (editor.value == null) {
    return false;
  }
  const otherNames = props.styles
    .filter((style) => style.id !== editor.value!.originalId)
    .map((style) => style.displayName);
  return areStyleDisplayNamesValid([
    ...otherNames,
    editor.value.draft.displayName,
  ]);
});

const draftDirty = computed(
  () =>
    editor.value != null &&
    !deepEquals(editor.value.draft, editor.value.snapshot),
);

// Judged on what the structure renders, not on its axes, so two styles that
// differ only in presentation are reported as the same structure.
const duplicateOfDraft = computed(() => {
  if (editor.value == null) {
    return null;
  }
  const draft = editor.value.draft;
  return findInitialMartyriaStyleWithStructure(
    allStyles.value.filter((style) => style.id !== draft.id),
    draft.structure,
  );
});

function customNames() {
  return props.styles.map((style) => style.displayName);
}

function openEditor(draft: InitialMartyriaStyle, originalId: string | null) {
  editor.value = {
    draft,
    originalId,
    snapshot: cloneInitialMartyriaStyle(draft),
  };
  view.value = 'edit';
}

function createStyle() {
  const base = getDefaultBuiltInInitialMartyriaStyle(uiLanguageId.value);
  openEditor(
    createInitialMartyriaStyle({
      ...base,
      displayName: getNextAvailableStyleName(
        t(($) => $.dialog.initialMartyriaStyles.newStyleName, { ns }),
        customNames(),
      ),
      basedOn: null,
    }),
    null,
  );
}

function copyName(style: InitialMartyriaStyle) {
  return getNextAvailableStyleName(
    t(($) => $.dialog.initialMartyriaStyles.copyStyleName, {
      ns,
      name: getInitialMartyriaStyleDisplayName(style, t),
    }),
    customNames(),
  );
}

// Built-in styles are read-only: editing one edits a copy derived from it.
function editStyle(style: InitialMartyriaStyle) {
  if (isBuiltInInitialMartyriaStyleId(style.id)) {
    duplicateStyle(style);
    return;
  }
  openEditor(cloneInitialMartyriaStyle(style), style.id);
}

function duplicateStyle(style: InitialMartyriaStyle) {
  openEditor(
    createInitialMartyriaStyle({
      ...style,
      displayName: copyName(style),
      basedOn: isBuiltInInitialMartyriaStyleId(style.id)
        ? style.id
        : style.basedOn,
    }),
    null,
  );
}

function deleteSelectedStyle() {
  const style = selectedStyle.value;
  deleteDialogOpen.value = false;
  if (isBuiltInInitialMartyriaStyleId(style.id)) {
    return;
  }
  emit(
    'update:styles',
    props.styles.filter((item) => item.id !== style.id),
  );
  selectedStyleId.value = DEFAULT_INITIAL_MARTYRIA_STYLE_ID;
}

function saveDraft() {
  if (editor.value == null || !draftNameValid.value) {
    return;
  }
  const draft = cloneInitialMartyriaStyle(editor.value.draft);
  draft.displayName = draft.displayName.trim();
  const originalId = editor.value.originalId;
  emit(
    'update:styles',
    originalId == null
      ? [...props.styles, draft]
      : props.styles.map((style) => (style.id === originalId ? draft : style)),
  );
  selectedStyleId.value = draft.id;
  editor.value = null;
  view.value = 'list';
}

function guardDiscard(proceed: () => void) {
  if (draftDirty.value) {
    afterDiscard = proceed;
    discardDialogOpen.value = true;
  } else {
    proceed();
  }
}

function confirmDiscard() {
  discardDialogOpen.value = false;
  const proceed = afterDiscard;
  afterDiscard = null;
  editor.value = null;
  proceed?.();
}

function cancelEdit() {
  guardDiscard(() => {
    editor.value = null;
    view.value = 'list';
  });
}

function useStyleInstead(style: InitialMartyriaStyle) {
  guardDiscard(() => {
    editor.value = null;
    selectedStyleId.value = style.id;
    view.value = 'list';
  });
}

function goBack() {
  if (view.value === 'edit') {
    cancelEdit();
  }
}

function pronunciationFor(style: InitialMartyriaStyle, templateId: number) {
  return getSamplePronunciation(style.structure, templateId);
}

function applyToElement() {
  emit('apply', selectedStyleId.value);
  open.value = false;
}

function useForDocument() {
  emit('use-for-document', selectedStyleId.value);
  open.value = false;
}

// Escape goes one level back; only the list view lets it close the dialog.
function onEscapeKeyDown(event: KeyboardEvent) {
  if (view.value !== 'list') {
    event.preventDefault();
    goBack();
  }
}

function onOpenChange(value: boolean) {
  if (value) {
    open.value = true;
    return;
  }
  guardDiscard(() => {
    open.value = false;
  });
}
</script>
