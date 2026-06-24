<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="h-[42rem] max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto_auto] overflow-hidden sm:max-w-3xl"
    >
      <DialogHeader>
        <DialogTitle>
          {{ $t(($) => $.dialog.modeKey.root, { ns: 'dialog' }) }}
        </DialogTitle>
        <DialogDescription>
          {{ $t(($) => $.dialog.modeKey.description, { ns: 'dialog' }) }}
        </DialogDescription>
      </DialogHeader>
      <Tabs
        :model-value="selectedMode"
        orientation="vertical"
        class="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden sm:grid-cols-[13rem_minmax(0,1fr)] sm:grid-rows-[minmax(0,1fr)]"
        @update:model-value="selectMode"
      >
        <ScrollArea class="col-start-1 row-start-1 min-h-0">
          <TabsList
            class="h-auto w-full flex-col items-stretch justify-start p-1"
          >
            <TabsTrigger
              v-for="mode in modeOptions"
              :key="mode.value"
              :value="mode.value"
              class="min-h-9 w-full flex-none justify-start whitespace-normal text-left"
            >
              <component :is="mode.icon" />
              {{ $t(mode.labelSelector, { ns: 'model' }) }}
            </TabsTrigger>
          </TabsList>
        </ScrollArea>
        <TabsContent
          v-for="mode in modeOptions"
          :key="mode.value"
          :value="mode.value"
          class="col-start-1 row-start-2 min-h-0 min-w-0 overflow-hidden sm:col-start-2 sm:row-start-1"
        >
          <ScrollArea class="h-full min-h-0 border">
            <ItemGroup>
              <Item
                v-for="(template, index) in getModeKeyTemplatesForMode(
                  mode.value,
                )"
                :key="template.templateId ?? index"
                as="div"
                role="button"
                tabindex="0"
                :aria-pressed="selectedTemplateId === template.templateId"
                class="w-full items-start text-left hover:bg-accent hover:text-accent-foreground"
                :class="{
                  'border-primary bg-primary/5 text-primary':
                    selectedTemplateId === template.templateId,
                }"
                @click="selectedTemplateId = template.templateId"
                @dblclick="updateModeKey"
                @keydown.enter.prevent="
                  selectedTemplateId = template.templateId
                "
                @keydown.space.prevent="
                  selectedTemplateId = template.templateId
                "
              >
                <ItemContent class="items-start">
                  <div class="mode-key-preview w-full px-2 py-1">
                    <ModeKey
                      class="!w-auto !border-0 [--zoom:1]"
                      :element="template"
                      :page-setup="pageSetup"
                    />
                  </div>
                  <ItemDescription>
                    {{ $t(template.descriptionSelector, { ns: 'model' }) }}
                  </ItemDescription>
                </ItemContent>
              </Item>
            </ItemGroup>
          </ScrollArea>
        </TabsContent>
      </Tabs>
      <Field orientation="horizontal">
        <Checkbox
          id="mode-key-dialog-use-optional-diatonic-fthoras"
          :model-value="useOptionalDiatonicFthoras"
          @update:model-value="onUseOptionalDiatonicFthorasChanged"
        />
        <FieldLabel for="mode-key-dialog-use-optional-diatonic-fthoras">
          {{
            $t(($) => $.toolbar.modeKey.useOptionalDiatonicFthoras, {
              ns: 'toolbar',
            })
          }}
        </FieldLabel>
      </Field>
      <DialogFooter>
        <DialogClose as-child>
          <Button variant="outline" type="button">
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </Button>
        </DialogClose>
        <Button
          type="button"
          :disabled="selectedTemplateId == null"
          @click="updateModeKey"
        >
          <PhCheck />
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  PhCheck,
  PhNumberCircleEight,
  PhNumberCircleFive,
  PhNumberCircleFour,
  PhNumberCircleOne,
  PhNumberCircleSeven,
  PhNumberCircleSix,
  PhNumberCircleThree,
  PhNumberCircleTwo,
} from '@phosphor-icons/vue';
import type { Component, PropType } from 'vue';
import { computed, ref, watch } from 'vue';

import ModeKey from '@/components/ModeKey.vue';
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
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
} from '@/components/ui/item';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import { modeKeyTemplates } from '@/models/ModeKeys';
import type { ModelSelector } from '@/models/NeumeI18nMappings';
import type { PageSetup } from '@/models/PageSetup';
import { TextMeasurementService } from '@/services/TextMeasurementService';

const emit = defineEmits<{
  update: [modeKey: ModeKeyElement];
  'update:useOptionalDiatonicFthoras': [value: boolean];
}>();
const props = defineProps({
  element: {
    type: Object as PropType<ModeKeyElement>,
    required: true,
  },
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
});

const open = defineModel<boolean>('open', { required: true });

const modeOptions = [
  {
    value: 1,
    labelSelector: ($) => $.model.mode.first,
    icon: PhNumberCircleOne,
  },
  {
    value: 2,
    labelSelector: ($) => $.model.mode.second,
    icon: PhNumberCircleTwo,
  },
  {
    value: 3,
    labelSelector: ($) => $.model.mode.third,
    icon: PhNumberCircleThree,
  },
  {
    value: 4,
    labelSelector: ($) => $.model.mode.fourth,
    icon: PhNumberCircleFour,
  },
  {
    value: 5,
    labelSelector: ($) => $.model.mode.plagalFirst,
    icon: PhNumberCircleFive,
  },
  {
    value: 6,
    labelSelector: ($) => $.model.mode.plagalSecond,
    icon: PhNumberCircleSix,
  },
  {
    value: 7,
    labelSelector: ($) => $.model.mode.grave,
    icon: PhNumberCircleSeven,
  },
  {
    value: 8,
    labelSelector: ($) => $.model.mode.plagalFourth,
    icon: PhNumberCircleEight,
  },
] satisfies { value: number; labelSelector: ModelSelector; icon: Component }[];

const selectedMode = ref(props.element.mode);
const selectedTemplateId = ref<number | null>(null);
const useOptionalDiatonicFthoras = ref(
  props.pageSetup.useOptionalDiatonicFthoras,
);

const modeKeyTemplatesForSelectedMode = computed(() => {
  return getModeKeyTemplatesForMode(selectedMode.value);
});

function getModeKeyTemplatesForMode(mode: number) {
  const elements = modeKeyTemplates
    .filter((x) => x.mode === mode)
    .map((x) =>
      Object.assign(
        ModeKeyElement.createFromTemplate(
          x,
          useOptionalDiatonicFthoras.value,
          TextBoxAlignment.Left,
        ),
        { descriptionSelector: x.description },
      ),
    );

  const height = TextMeasurementService.getFontHeight(
    `${elements[0].fontSize}px ${props.pageSetup.neumeDefaultFontFamily}`,
  );

  for (const element of elements) {
    element.height = height;
    element.computedFontFamily = props.pageSetup.neumeDefaultFontFamily;
  }

  return elements;
}

selectMode(props.element.mode);

watch(
  () => props.pageSetup.useOptionalDiatonicFthoras,
  (value) => {
    useOptionalDiatonicFthoras.value = value;
  },
);

function selectMode(mode: string | number) {
  selectedMode.value = Number(mode);
  selectedTemplateId.value =
    modeKeyTemplatesForSelectedMode.value.find(
      (x) => x.templateId === props.element.templateId,
    )?.templateId || modeKeyTemplatesForSelectedMode.value[0].templateId;
}

function onUseOptionalDiatonicFthorasChanged(value: boolean | 'indeterminate') {
  useOptionalDiatonicFthoras.value = value === true;
  emit('update:useOptionalDiatonicFthoras', useOptionalDiatonicFthoras.value);
}

function updateModeKey() {
  const modeKey = modeKeyTemplatesForSelectedMode.value.find(
    (x) => x.templateId === selectedTemplateId.value,
  );

  if (!modeKey) {
    return;
  }

  emit('update', modeKey);
  open.value = false;
}
</script>

<style scoped>
.mode-key-preview {
  color: var(--muted-foreground);
}

.mode-key-preview :deep(.mode-key-container),
.mode-key-preview :deep(.mode-key-container *) {
  color: inherit !important;
}
</style>
