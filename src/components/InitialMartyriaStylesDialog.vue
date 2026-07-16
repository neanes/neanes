<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="grid h-[42rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden sm:max-w-3xl"
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

      <Tabs
        v-model="selectedTab"
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden"
      >
        <TabsList class="justify-start">
          <TabsTrigger value="styles">
            {{
              $t(($) => $.dialog.initialMartyriaStyles.styles, { ns: 'dialog' })
            }}
            <span
              v-if="stylesHaveErrors"
              class="ml-1 text-destructive"
              aria-hidden="true"
              >!</span
            >
            <span v-if="stylesHaveErrors" class="sr-only">
              {{
                $t(($) => $.dialog.initialMartyriaStyles.hasErrors, {
                  ns: 'dialog',
                })
              }}
            </span>
          </TabsTrigger>
          <TabsTrigger value="terminology">
            {{
              $t(($) => $.dialog.initialMartyriaStyles.terminology, {
                ns: 'dialog',
              })
            }}
            <span
              v-if="terminologiesHaveErrors"
              class="ml-1 text-destructive"
              aria-hidden="true"
              >!</span
            >
            <span v-if="terminologiesHaveErrors" class="sr-only">
              {{
                $t(($) => $.dialog.initialMartyriaStyles.hasErrors, {
                  ns: 'dialog',
                })
              }}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="styles" class="min-h-0 overflow-hidden">
          <div
            class="grid h-full min-h-0 gap-4 sm:grid-cols-[13rem_minmax(0,1fr)]"
          >
            <div class="flex min-h-0 flex-col gap-2">
              <Input
                v-model="styleSearchQuery"
                :placeholder="
                  $t(($) => $.dialog.initialMartyriaStyles.searchStyles, {
                    ns: 'dialog',
                  })
                "
              />
              <ScrollArea class="min-h-0 flex-1 border">
                <div class="p-1">
                  <Button
                    v-for="style in filteredStyles"
                    :key="style.id"
                    variant="ghost"
                    class="w-full justify-start"
                    :class="[
                      selectedStyleId === style.id && 'bg-accent',
                      styleErrors.has(style.id) && 'text-destructive',
                    ]"
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
                    <span
                      v-if="styleErrors.has(style.id)"
                      class="ml-auto text-destructive"
                      aria-hidden="true"
                      >!</span
                    >
                    <span v-if="styleErrors.has(style.id)" class="sr-only">
                      {{
                        $t(($) => $.dialog.initialMartyriaStyles.invalid, {
                          ns: 'dialog',
                        })
                      }}
                    </span>
                  </Button>
                </div>
              </ScrollArea>
              <div class="flex gap-1">
                <Button size="sm" variant="outline" @click="createStyle">{{
                  $t(($) => $.dialog.initialMartyriaStyles.new, {
                    ns: 'dialog',
                  })
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
                    selectedCustomStyle == null ||
                    selectedStyleId === activeStyleId
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
                <p
                  v-if="selectedStyleErrors.length > 0"
                  class="text-sm text-destructive"
                >
                  {{
                    $t(($) => $.dialog.initialMartyriaStyles.fixStyleErrors, {
                      ns: 'dialog',
                    })
                  }}
                </p>
                <Field orientation="horizontal">
                  <FieldLabel for="initial-martyria-style-name">{{
                    $t(($) => $.dialog.initialMartyriaStyles.name, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <Input
                    id="initial-martyria-style-name"
                    :disabled="selectedCustomStyle == null"
                    :model-value="selectedStyle.displayName"
                    @update:model-value="updateName"
                  />
                </Field>
                <p
                  v-if="selectedCustomStyle != null && styleNameIsMissing"
                  class="text-sm text-destructive"
                >
                  {{
                    $t(($) => $.dialog.initialMartyriaStyles.required, {
                      ns: 'dialog',
                    })
                  }}
                </p>
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
                    <SelectContent>
                      <SelectItem value="page">{{
                        $t(($) => $.dialog.initialMartyriaStyles.page, {
                          ns: 'dialog',
                        })
                      }}</SelectItem>
                      <SelectItem value="ltr">LTR</SelectItem>
                      <SelectItem value="rtl">RTL</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel>{{
                    $t(($) => $.dialog.initialMartyriaStyles.terminology, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <Select
                    :disabled="selectedCustomStyle == null"
                    :model-value="selectedStyle.terminologyId ?? 'none'"
                    @update:model-value="updateTerminologyId"
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{{
                        $t(($) => $.dialog.initialMartyriaStyles.none, {
                          ns: 'dialog',
                        })
                      }}</SelectItem>
                      <SelectItem
                        v-for="terminology in workingTerminologies"
                        :key="terminology.id"
                        :value="terminology.id"
                        >{{ terminology.displayName }}</SelectItem
                      >
                    </SelectContent>
                  </Select>
                </Field>
                <div class="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    :disabled="selectedStyle.terminologyId == null"
                    @click="editSelectedTerminology"
                    >{{
                      $t(
                        ($) => $.dialog.initialMartyriaStyles.editTerminology,
                        { ns: 'dialog' },
                      )
                    }}</Button
                  >
                  <Button
                    size="sm"
                    variant="outline"
                    :disabled="selectedCustomStyle == null"
                    @click="createTerminologyForStyle"
                    >{{
                      $t(($) => $.dialog.initialMartyriaStyles.newTerminology, {
                        ns: 'dialog',
                      })
                    }}</Button
                  >
                </div>
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
                            ($) =>
                              $.dialog.initialMartyriaStyles.removeComponent,
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
              </FieldGroup>
            </ScrollArea>
          </div>
        </TabsContent>

        <TabsContent value="terminology" class="min-h-0 overflow-hidden">
          <div
            class="grid h-full min-h-0 gap-4 sm:grid-cols-[13rem_minmax(0,1fr)]"
          >
            <div class="flex min-h-0 flex-col gap-2">
              <Input
                v-model="terminologySearchQuery"
                :placeholder="
                  $t(($) => $.dialog.initialMartyriaStyles.searchTerminology, {
                    ns: 'dialog',
                  })
                "
              />
              <ScrollArea class="min-h-0 flex-1 border">
                <div class="p-1">
                  <Button
                    v-for="terminology in filteredTerminologies"
                    :key="terminology.id"
                    variant="ghost"
                    class="w-full justify-start"
                    :class="[
                      selectedTerminologyId === terminology.id && 'bg-accent',
                      terminologyErrors.has(terminology.id) &&
                        'text-destructive',
                    ]"
                    @click="selectedTerminologyId = terminology.id"
                    >{{ terminology.displayName }}
                    <span
                      v-if="terminologyErrors.has(terminology.id)"
                      class="ml-auto text-destructive"
                      aria-hidden="true"
                      >!</span
                    >
                    <span
                      v-if="terminologyErrors.has(terminology.id)"
                      class="sr-only"
                    >
                      {{
                        $t(($) => $.dialog.initialMartyriaStyles.invalid, {
                          ns: 'dialog',
                        })
                      }}
                    </span></Button
                  >
                </div>
              </ScrollArea>
              <div class="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  @click="createTerminology"
                  >{{
                    $t(($) => $.dialog.initialMartyriaStyles.new, {
                      ns: 'dialog',
                    })
                  }}</Button
                >
                <Button
                  size="sm"
                  variant="outline"
                  :disabled="selectedTerminology == null"
                  @click="duplicateTerminology"
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
                    selectedTerminology == null || terminologyIsReferenced
                  "
                  @click="deleteTerminology"
                  >{{
                    $t(($) => $.dialog.initialMartyriaStyles.delete, {
                      ns: 'dialog',
                    })
                  }}</Button
                >
              </div>
            </div>

            <ScrollArea class="min-h-0 border">
              <FieldGroup v-if="selectedTerminology != null" class="p-4">
                <p
                  v-if="selectedTerminologyErrors.length > 0"
                  class="text-sm text-destructive"
                >
                  {{
                    $t(
                      ($) =>
                        $.dialog.initialMartyriaStyles.fixTerminologyErrors,
                      { ns: 'dialog' },
                    )
                  }}
                </p>
                <Field orientation="horizontal">
                  <FieldLabel for="initial-martyria-terminology-name">{{
                    $t(($) => $.dialog.initialMartyriaStyles.terminologyName, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <Input
                    id="initial-martyria-terminology-name"
                    :model-value="selectedTerminology.displayName"
                    @update:model-value="updateTerminologyName"
                  />
                </Field>
                <p
                  v-if="terminologyNameIsMissing"
                  class="text-sm text-destructive"
                >
                  {{
                    $t(($) => $.dialog.initialMartyriaStyles.required, {
                      ns: 'dialog',
                    })
                  }}
                </p>
                <p
                  v-if="terminologyLocaleIsInvalid"
                  class="text-sm text-destructive"
                >
                  {{
                    $t(
                      ($) =>
                        $.dialog.initialMartyriaStyles
                          .invalidLocaleOrNumberingSystem,
                      { ns: 'dialog' },
                    )
                  }}
                </p>
                <Field orientation="horizontal">
                  <FieldLabel for="initial-martyria-terminology-language">{{
                    $t(($) => $.dialog.initialMartyriaStyles.languageTag, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <Input
                    id="initial-martyria-terminology-language"
                    :model-value="selectedTerminology.languageTag"
                    @update:model-value="updateTerminologyLanguage"
                  />
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel>{{
                    $t(($) => $.dialog.initialMartyriaStyles.writingDirection, {
                      ns: 'dialog',
                    })
                  }}</FieldLabel>
                  <Select
                    :model-value="selectedTerminology.direction"
                    @update:model-value="updateTerminologyDirection"
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ltr">LTR</SelectItem>
                      <SelectItem value="rtl">RTL</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field orientation="horizontal">
                  <FieldLabel
                    for="initial-martyria-terminology-numbering-system"
                    >{{
                      $t(
                        ($) => $.dialog.initialMartyriaStyles.numberingSystem,
                        { ns: 'dialog' },
                      )
                    }}</FieldLabel
                  >
                  <Input
                    id="initial-martyria-terminology-numbering-system"
                    :model-value="selectedTerminology.numberingSystem ?? ''"
                    @update:model-value="updateNumberingSystem"
                  />
                </Field>
                <Field>
                  <FieldLabel>{{
                    $t(
                      ($) => $.dialog.initialMartyriaStyles.completeModeNames,
                      { ns: 'dialog' },
                    )
                  }}</FieldLabel>
                  <div class="space-y-2">
                    <Field
                      v-for="mode in modes"
                      :key="mode"
                      orientation="horizontal"
                    >
                      <FieldLabel>{{
                        $t(
                          ($) =>
                            $.dialog.initialMartyriaStyles.completeModeName,
                          { ns: 'dialog', mode },
                        )
                      }}</FieldLabel>
                      <Input
                        :model-value="
                          selectedTerminology.values.completeModeName?.[mode] ??
                          ''
                        "
                        @update:model-value="
                          (value) => updateCompleteModeName(mode, value)
                        "
                      />
                      <p
                        v-if="completeModeNameIsMissing(mode)"
                        class="text-sm text-destructive"
                      >
                        {{
                          $t(($) => $.dialog.initialMartyriaStyles.required, {
                            ns: 'dialog',
                          })
                        }}
                      </p>
                    </Field>
                  </div>
                </Field>
              </FieldGroup>
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button
          v-if="selectedTab === 'styles'"
          variant="outline"
          :disabled="selectedStyleId === activeStyleId || !stylesAreValid"
          @click="useForDocument"
          >{{
            $t(($) => $.dialog.initialMartyriaStyles.useForDocument, {
              ns: 'dialog',
            })
          }}</Button
        >
        <DialogClose as-child
          ><Button variant="outline" type="button">{{
            $t(($) => $.dialog.common.cancel, { ns: 'dialog' })
          }}</Button></DialogClose
        >
        <Button
          type="button"
          :disabled="!stylesAreValid"
          @click="applyStyles"
          >{{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}</Button
        >
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import { computed, ref, toRaw, watch } from 'vue';

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
  BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS,
  type InitialMartyriaComponent,
  type InitialMartyriaStyle,
  type ModeKeyMode,
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
const modes: ModeKeyMode[] = [1, 2, 3, 4, 5, 6, 7, 8];
const selectedTab = ref<'styles' | 'terminology'>('styles');
const styleSearchQuery = ref('');
const terminologySearchQuery = ref('');
const workingStyles = ref<InitialMartyriaStyle[]>([]);
const workingTerminologies = ref<ModeTerminology[]>([]);
const selectedStyleId = ref(
  props.activeStyleId ?? BUILT_IN_INITIAL_MARTYRIA_STYLE_IDS.TraditionalGreekV1,
);
const selectedTerminologyId = ref<string | null>(null);
const allStyles = computed(() => [
  traditionalGreekInitialMartyriaStyle,
  ...workingStyles.value,
]);
const filteredStyles = computed(() => {
  const query = styleSearchQuery.value.trim().toLocaleLowerCase();
  return query === ''
    ? allStyles.value
    : allStyles.value.filter((style) =>
        styleDisplayName(style).toLocaleLowerCase().includes(query),
      );
});
const filteredTerminologies = computed(() => {
  const query = terminologySearchQuery.value.trim().toLocaleLowerCase();
  return query === ''
    ? workingTerminologies.value
    : workingTerminologies.value.filter((terminology) =>
        terminology.displayName.toLocaleLowerCase().includes(query),
      );
});
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
const selectedTerminology = computed(
  () =>
    workingTerminologies.value.find(
      (terminology) => terminology.id === selectedTerminologyId.value,
    ) ?? null,
);
const styleErrors = computed(
  () =>
    new Map(
      workingStyles.value.flatMap((style) => {
        const errors = validateInitialMartyriaStyle(
          style,
          workingTerminologies.value,
        );
        return errors.length === 0 ? [] : [[style.id, errors]];
      }),
    ),
);
const terminologyErrors = computed(
  () =>
    new Map(
      workingTerminologies.value.flatMap((terminology) => {
        const errors = validateModeTerminology(terminology);
        return errors.length === 0 ? [] : [[terminology.id, errors]];
      }),
    ),
);
const selectedStyleErrors = computed(
  () => styleErrors.value.get(selectedStyleId.value) ?? [],
);
const selectedTerminologyErrors = computed(
  () => terminologyErrors.value.get(selectedTerminologyId.value ?? '') ?? [],
);
const stylesHaveErrors = computed(() => styleErrors.value.size > 0);
const terminologiesHaveErrors = computed(
  () => terminologyErrors.value.size > 0,
);
const stylesAreValid = computed(
  () => !stylesHaveErrors.value && !terminologiesHaveErrors.value,
);
const terminologyIsReferenced = computed(
  () =>
    selectedTerminology.value != null &&
    workingStyles.value.some(
      (style) => style.terminologyId === selectedTerminology.value?.id,
    ),
);
const styleNameIsMissing = computed(() =>
  selectedStyleErrors.value.includes('A style display name is required.'),
);
const terminologyNameIsMissing = computed(() =>
  selectedTerminologyErrors.value.includes(
    'A terminology display name is required.',
  ),
);
const terminologyLocaleIsInvalid = computed(() =>
  selectedTerminologyErrors.value.some(
    (error) =>
      error.includes('language tag') ||
      error.includes('locale or numbering system'),
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
    if (!open.value) {
      return;
    }
    workingStyles.value = structuredClone(toRaw(props.styles));
    workingTerminologies.value = structuredClone(toRaw(props.terminologies));
    if (
      !workingTerminologies.value.some(
        (terminology) => terminology.id === selectedTerminologyId.value,
      )
    ) {
      selectedTerminologyId.value = workingTerminologies.value[0]?.id ?? null;
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
  const style = structuredClone(selectedStyle.value);
  style.id = crypto.randomUUID();
  style.displayName = `${style.displayName} ${t(($) => $.dialog.initialMartyriaStyles.copy, { ns: 'dialog' })}`;
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
function updateTerminologyId(value: unknown) {
  updateSelected((style) => {
    style.terminologyId =
      typeof value === 'string' && value !== 'none' ? value : null;
  });
}
function createTerminology() {
  const terminology: ModeTerminology = {
    id: crypto.randomUUID(),
    displayName: t(($) => $.dialog.initialMartyriaStyles.terminology, {
      ns: 'dialog',
    }),
    languageTag: 'en',
    direction: 'ltr',
    values: { completeModeName: {} },
  };
  workingTerminologies.value.push(terminology);
  selectedTerminologyId.value = terminology.id;
}
function createTerminologyForStyle() {
  createTerminology();
  updateSelected((style) => {
    style.terminologyId = selectedTerminologyId.value;
  });
  selectedTab.value = 'terminology';
}
function editSelectedTerminology() {
  selectedTerminologyId.value = selectedStyle.value.terminologyId;
  selectedTab.value = 'terminology';
}
function duplicateTerminology() {
  if (selectedTerminology.value == null) {
    return;
  }
  const terminology = structuredClone(selectedTerminology.value);
  terminology.id = crypto.randomUUID();
  terminology.displayName = `${terminology.displayName} ${t(($) => $.dialog.initialMartyriaStyles.copy, { ns: 'dialog' })}`;
  workingTerminologies.value.push(terminology);
  selectedTerminologyId.value = terminology.id;
}
function deleteTerminology() {
  if (selectedTerminology.value == null || terminologyIsReferenced.value) {
    return;
  }
  const index = workingTerminologies.value.findIndex(
    (terminology) => terminology.id === selectedTerminology.value?.id,
  );
  workingTerminologies.value.splice(index, 1);
  selectedTerminologyId.value =
    workingTerminologies.value[index]?.id ??
    workingTerminologies.value[index - 1]?.id ??
    null;
}
function updateTerminology(update: (terminology: ModeTerminology) => void) {
  if (selectedTerminology.value != null) {
    update(selectedTerminology.value);
  }
}
function updateTerminologyName(value: string | number) {
  updateTerminology((terminology) => {
    terminology.displayName = String(value);
  });
}
function updateTerminologyLanguage(value: string | number) {
  updateTerminology((terminology) => {
    terminology.languageTag = String(value);
  });
}
function updateTerminologyDirection(value: unknown) {
  if (value === 'ltr' || value === 'rtl') {
    updateTerminology((terminology) => {
      terminology.direction = value;
    });
  }
}
function updateNumberingSystem(value: string | number) {
  updateTerminology((terminology) => {
    const numberingSystem = String(value).trim();
    terminology.numberingSystem =
      numberingSystem === '' ? undefined : numberingSystem;
  });
}
function updateCompleteModeName(mode: ModeKeyMode, value: string | number) {
  updateTerminology((terminology) => {
    terminology.values.completeModeName ??= {};
    terminology.values.completeModeName[mode] = String(value);
  });
}
function completeModeNameIsMissing(mode: ModeKeyMode) {
  const completeName =
    selectedTerminology.value?.values.completeModeName?.[mode];
  return completeName == null || completeName.trim() === '';
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
  if (selectedStyle.value.components.length > 1) {
    updateSelected((style) => {
      style.components.splice(index, 1);
    });
  }
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
