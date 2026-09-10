<template>
  <Dialog :open="open" @update:open="onOpenChange">
    <DialogContent
      class="grid h-[44rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-5xl"
      @escape-key-down="onEscapeKeyDown"
    >
      <DialogHeader>
        <Breadcrumb v-if="view !== 'list'">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink as="button" type="button" @click="goBack">
                {{ $t(($) => $.dialog.initialMartyriaStyles.styles, { ns }) }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem v-if="view === 'browse' && editor != null">
              <BreadcrumbLink as="button" type="button" @click="view = 'edit'">
                {{ editorBreadcrumb }}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator v-if="view === 'browse' && editor != null" />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {{
                  view === 'edit'
                    ? editorBreadcrumb
                    : $t(
                        ($) => $.dialog.initialMartyriaStyles.browseStructures,
                        { ns },
                      )
                }}
              </BreadcrumbPage>
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

      <InitialMartyriaStructureBrowser
        v-if="view === 'browse'"
        v-model:selection="browseSelection"
        v-model:sample-mode="sampleMode"
        :seed="browseSeed"
        :styles="allStyles"
        :page-setup="pageSetup"
      />

      <div
        v-else
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
            <AppTooltip
              :tooltip="
                $t(($) => $.dialog.initialMartyriaStyles.browseAll, { ns })
              "
            >
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                :aria-label="
                  $t(($) => $.dialog.initialMartyriaStyles.browseAll, { ns })
                "
                @click="browse"
              >
                <PhSquaresFour />
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
                  @dblclick="row.style != null && editStyle(row.style)"
                >
                  <span class="truncate">{{ row.name }}</span>
                  <PhLock
                    v-if="row.builtIn"
                    class="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span
                    v-else-if="row.languageName != null"
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
          :fonts="fonts"
          :name-valid="draftNameValid"
          @browse="browse"
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
              <div v-if="selectedStyle != null" class="flex items-center gap-1">
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
                  :style="selectedStyle"
                  :template-id="templateId"
                  :page-setup="pageSetup"
                  :max-font-size="32"
                />
                <span
                  v-if="selectedStyle != null"
                  class="text-center text-xs text-muted-foreground"
                  :lang="selectedStyle.structure.languageId"
                  aria-hidden="true"
                >
                  {{ pronunciationFor(selectedStyle, templateId) }}
                </span>
              </div>
            </div>

            <p
              v-if="selectedStyle == null"
              class="text-sm text-muted-foreground"
            >
              {{
                $t(($) => $.dialog.initialMartyriaStyles.standardDescription, {
                  ns,
                })
              }}
            </p>
            <dl
              v-else
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
          <p
            v-else-if="view === 'browse'"
            class="text-xs text-muted-foreground"
          >
            {{
              $t(($) => $.dialog.initialMartyriaStyles.tilesUseCurrentFont, {
                ns,
              })
            }}
          </p>
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
          <template v-else-if="view === 'edit'">
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
          <template v-else>
            <Button type="button" variant="outline" @click="goBack">
              {{ $t(($) => $.dialog.initialMartyriaStyles.back, { ns }) }}
            </Button>
            <Button
              v-if="browseSelection?.matchingStyle != null"
              type="button"
              @click="chooseBrowsedStyle(browseSelection.matchingStyle)"
            >
              {{ $t(($) => $.dialog.initialMartyriaStyles.apply, { ns }) }}
            </Button>
            <Button
              v-else
              type="button"
              :disabled="browseSelection == null"
              @click="openBrowsedStructureInEditor"
            >
              {{
                $t(($) => $.dialog.initialMartyriaStyles.openInEditor, { ns })
              }}
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
  PhSquaresFour,
  PhTrash,
} from '@phosphor-icons/vue';
import { useTranslation } from 'i18next-vue';
import { computed, ref } from 'vue';

import AppTooltip from '@/components/AppTooltip.vue';
import InitialMartyriaSample from '@/components/InitialMartyriaSample.vue';
import InitialMartyriaStructureBrowser from '@/components/InitialMartyriaStructureBrowser.vue';
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
import { ModeKeyElement } from '@/models/Element';
import {
  builtInInitialMartyriaStyles,
  cloneInitialMartyriaStyle,
  createInitialMartyriaStyle,
  findInitialMartyriaStyle,
  findInitialMartyriaStyleWithStructure,
  getBuiltInInitialMartyriaStyle,
  getDefaultBuiltInInitialMartyriaStyle,
  getInitialMartyriaContext,
  getInitialMartyriaStyleDisplayName,
  getInitialMartyriaStyles,
  INITIAL_MARTYRIA_LANGUAGE_IDS,
  type InitialMartyriaLanguageId,
  initialMartyriaLanguageIds,
  type InitialMartyriaStyle,
  isBuiltInInitialMartyriaStyleId,
  resolveInitialMartyriaStyle,
  resolveInitialMartyriaStyleAppearances,
  usesGreekScript,
} from '@/models/InitialMartyriaStyle';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { PageSetup } from '@/models/PageSetup';
import {
  getInitialMartyriaLanguageName,
  getInitialMartyriaModeIdentificationMethodLabel,
  getInitialMartyriaModeNamingSchemeLabel,
  getInitialMartyriaNumeralFormLabel,
  getInitialMartyriaNumeralQualifierLabel,
} from '@/utils/initialMartyriaLabels';
import {
  areStyleDisplayNamesValid,
  getNextAvailableStyleName,
} from '@/utils/styleNames';
import { Unit } from '@/utils/Unit';

import {
  getSampleTemplateId,
  GRAVE_SAMPLE_MODE,
  type InitialMartyriaStructureSelection,
  PLAGAL_SAMPLE_MODE,
  withInitialMartyriaStyleStructure,
} from './InitialMartyriaStylesDialog.shared';

const ns = 'dialog';

const props = withDefaults(
  defineProps<{
    /** The score's own styles. Edits are emitted as they are saved. */
    styles: InitialMartyriaStyle[];
    pageSetup: PageSetup;
    fonts: string[];
    target?: 'document' | 'element';
    /** The element's own style when the dialog targets an element. */
    elementStyleId?: string | null | undefined;
  }>(),
  { target: 'document', elementStyleId: undefined },
);

const emit = defineEmits<{
  'update:styles': [styles: InitialMartyriaStyle[]];
  apply: [styleId: string | null];
  'use-for-document': [styleId: string | null];
}>();

const open = defineModel<boolean>('open', { required: true });
const { t, i18next } = useTranslation();

type View = 'list' | 'edit' | 'browse';

interface EditorState {
  draft: InitialMartyriaStyle;
  /** The saved style being edited, or null for a style not yet saved. */
  originalId: string | null;
  snapshot: string;
}

const view = ref<View>('list');
const editor = ref<EditorState | null>(null);
const search = ref('');
const sampleMode = ref(PLAGAL_SAMPLE_MODE);
const browseSelection = ref<InitialMartyriaStructureSelection | null>(null);
const discardDialogOpen = ref(false);
const deleteDialogOpen = ref(false);
let afterDiscard: (() => void) | null = null;

const initialStyleId =
  props.target === 'element' && props.elementStyleId !== undefined
    ? props.elementStyleId
    : props.pageSetup.initialMartyriaStyleId;
const selectedStyleId = ref<string | null>(
  initialStyleId != null &&
    findInitialMartyriaStyle(props.styles, initialStyleId) != null
    ? initialStyleId
    : null,
);

const allStyles = computed(() => getInitialMartyriaStyles(props.styles));
const selectedStyle = computed(() =>
  selectedStyleId.value == null
    ? null
    : findInitialMartyriaStyle(props.styles, selectedStyleId.value),
);
const selectedIsBuiltIn = computed(
  () =>
    selectedStyle.value != null &&
    isBuiltInInitialMartyriaStyleId(selectedStyle.value.id),
);
const selectedName = computed(() =>
  selectedStyle.value == null
    ? t(($) => $.dialog.initialMartyriaStyles.standard, { ns })
    : getInitialMartyriaStyleDisplayName(selectedStyle.value, t),
);
const selectedBasedOn = computed(() =>
  selectedStyle.value?.basedOn == null
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
  styleId: string | null;
  style: InitialMartyriaStyle | null;
  name: string;
  builtIn: boolean;
  languageName: string | null;
  selected: boolean;
}

function matchesSearch(name: string) {
  return name
    .toLocaleLowerCase()
    .includes(search.value.trim().toLocaleLowerCase());
}

function rowFor(style: InitialMartyriaStyle | null): ListRow {
  const styleId = style?.id ?? null;
  return {
    key: styleId ?? 'standard',
    styleId,
    style,
    name:
      style == null
        ? t(($) => $.dialog.initialMartyriaStyles.standard, { ns })
        : getInitialMartyriaStyleDisplayName(style, t),
    builtIn: style == null || isBuiltInInitialMartyriaStyleId(style.id),
    languageName:
      style == null
        ? null
        : getInitialMartyriaLanguageName(t, style.structure.languageId),
    selected: styleId === selectedStyleId.value,
  };
}

const listGroups = computed(() => {
  const groups: { key: string; label: string; rows: ListRow[] }[] = [];
  const standardRow = rowFor(null);
  if (matchesSearch(standardRow.name)) {
    groups.push({
      key: 'standard',
      label: t(($) => $.dialog.initialMartyriaStyles.builtIn, { ns }),
      rows: [standardRow],
    });
  }
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
  if (style == null) {
    return [];
  }
  const structure = style.structure;
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
      value: getInitialMartyriaNumeralFormLabel(t, structure),
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
  items.push(
    {
      label: t(($) => $.dialog.initialMartyriaStyles.font, { ns }),
      value: t(($) => $.dialog.initialMartyriaStyles.fontSummary, {
        ns,
        font: style.appearance.mainFontFamily,
        size: Unit.toPt(style.appearance.fontSize),
      }),
    },
    {
      label: t(($) => $.dialog.pageSetup.color, { ns }),
      value: style.appearance.color,
      swatch: style.appearance.color,
    },
  );
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
    JSON.stringify(editor.value.draft) !== editor.value.snapshot,
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

const browseSeed = computed(
  () =>
    editor.value?.draft ??
    selectedStyle.value ??
    getDefaultBuiltInInitialMartyriaStyle(uiLanguageId.value),
);

function customNames() {
  return props.styles.map((style) => style.displayName);
}

function openEditor(draft: InitialMartyriaStyle, originalId: string | null) {
  editor.value = { draft, originalId, snapshot: JSON.stringify(draft) };
  view.value = 'edit';
}

function createStyle() {
  const base = getDefaultBuiltInInitialMartyriaStyle(uiLanguageId.value);
  openEditor(
    createInitialMartyriaStyle({
      displayName: getNextAvailableStyleName(
        t(($) => $.dialog.initialMartyriaStyles.newStyleName, { ns }),
        customNames(),
      ),
      basedOn: null,
      structure: base.structure,
      appearance: base.appearance,
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
      displayName: copyName(style),
      basedOn: isBuiltInInitialMartyriaStyleId(style.id)
        ? style.id
        : style.basedOn,
      structure: style.structure,
      appearance: style.appearance,
    }),
    null,
  );
}

function deleteSelectedStyle() {
  const style = selectedStyle.value;
  deleteDialogOpen.value = false;
  if (style == null || isBuiltInInitialMartyriaStyleId(style.id)) {
    return;
  }
  emit(
    'update:styles',
    props.styles.filter((item) => item.id !== style.id),
  );
  selectedStyleId.value = null;
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

function browse() {
  browseSelection.value = null;
  view.value = 'browse';
}

function goBack() {
  if (view.value === 'browse') {
    view.value = editor.value == null ? 'list' : 'edit';
    return;
  }
  if (view.value === 'edit') {
    cancelEdit();
  }
}

function chooseBrowsedStyle(style: InitialMartyriaStyle) {
  guardDiscard(() => {
    editor.value = null;
    selectedStyleId.value = style.id;
    view.value = 'list';
  });
}

function openBrowsedStructureInEditor() {
  const selection = browseSelection.value;
  if (selection == null) {
    return;
  }
  if (editor.value != null) {
    editor.value.draft = withInitialMartyriaStyleStructure(
      editor.value.draft,
      selection.structure,
    );
    view.value = 'edit';
    return;
  }
  const seed = withInitialMartyriaStyleStructure(
    browseSeed.value,
    selection.structure,
  );
  openEditor(
    createInitialMartyriaStyle({
      displayName: '',
      basedOn: null,
      structure: selection.structure,
      appearance: seed.appearance,
    }),
    null,
  );
}

function pronunciationFor(style: InitialMartyriaStyle, templateId: number) {
  const element = ModeKeyElement.createFromTemplate(
    modeKeyTemplates.find((item) => item.id === templateId)!,
  );
  return resolveInitialMartyriaStyle({
    context: getInitialMartyriaContext(element),
    resolvedStyle: resolveInitialMartyriaStyleAppearances(style),
    pageSetup: props.pageSetup,
  }).pronunciation;
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
