<template>
  <ModalDialog>
    <div class="container">
      <div class="header">
        {{ $t(($) => $.dialog.modeKey.root, { ns: 'dialog' }) }}
      </div>
      <div class="pane-container">
        <div class="left-pane">
          <ul class="mode-list">
            <li
              :class="{ selected: selectedMode === 1 }"
              @click="selectMode(1)"
            >
              {{ $t(($) => $.model.mode.first, { ns: 'model' }) }}
            </li>
            <li
              :class="{ selected: selectedMode === 2 }"
              @click="selectMode(2)"
            >
              {{ $t(($) => $.model.mode.second, { ns: 'model' }) }}
            </li>
            <li
              :class="{ selected: selectedMode === 3 }"
              @click="selectMode(3)"
            >
              {{ $t(($) => $.model.mode.third, { ns: 'model' }) }}
            </li>
            <li
              :class="{ selected: selectedMode === 4 }"
              @click="selectMode(4)"
            >
              {{ $t(($) => $.model.mode.fourth, { ns: 'model' }) }}
            </li>
            <li
              :class="{ selected: selectedMode === 5 }"
              @click="selectMode(5)"
            >
              {{ $t(($) => $.model.mode.plagalFirst, { ns: 'model' }) }}
            </li>
            <li
              :class="{ selected: selectedMode === 6 }"
              @click="selectMode(6)"
            >
              {{ $t(($) => $.model.mode.plagalSecond, { ns: 'model' }) }}
            </li>
            <li
              :class="{ selected: selectedMode === 7 }"
              @click="selectMode(7)"
            >
              {{ $t(($) => $.model.mode.grave, { ns: 'model' }) }}
            </li>
            <li
              :class="{ selected: selectedMode === 8 }"
              @click="selectMode(8)"
            >
              {{ $t(($) => $.model.mode.plagalFourth, { ns: 'model' }) }}
            </li>
          </ul>
        </div>
        <div class="right-pane">
          <ul class="mode-list">
            <li
              v-for="(template, index) in modeKeyTemplatesForSelectedMode"
              :key="index"
              :class="{
                selected: selectedTemplateId === template.templateId,
              }"
              @click="selectedTemplateId = template.templateId"
              @dblclick="updateModeKey"
            >
              <ModeKey :element="template" :page-setup="pageSetup" />
              <div class="mode-key-description">
                {{ $t(template.descriptionSelector, { ns: 'model' }) }}
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div class="options-container">
        <input
          id="mode-key-dialog:use-optional-diatonic-fthoras"
          type="checkbox"
          :checked="pageSetup.useOptionalDiatonicFthoras"
          @change="
            $emit(
              'update:useOptionalDiatonicFthoras',
              ($event.target as HTMLInputElement).checked,
            )
          "
        />
        <label for="mode-key-dialog:use-optional-diatonic-fthoras">{{
          $t(($) => $.toolbar.modeKey.useOptionalDiatonicFthoras, {
            ns: 'toolbar',
          })
        }}</label>
      </div>
      <div class="button-container">
        <button
          class="ok-btn"
          :disabled="selectedTemplateId == null"
          @click="updateModeKey"
        >
          {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
        </button>
        <button class="cancel-btn" @click="$emit('close')">
          {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, PropType, ref } from 'vue';

import ModalDialog from '@/components/ModalDialog.vue';
import ModeKey from '@/components/ModeKey.vue';
import { ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { PageSetup } from '@/models/PageSetup';
import { TextMeasurementService } from '@/services/TextMeasurementService';

const emit = defineEmits([
  'close',
  'update',
  'update:useOptionalDiatonicFthoras',
]);
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

const selectedMode = ref<number | null>(null);
const selectedTemplateId = ref<number | null>(null);

const modeKeyTemplatesForSelectedMode = computed(() => {
  const elements = modeKeyTemplates
    .filter((x) => x.mode === selectedMode.value)
    .map((x) =>
      Object.assign(
        ModeKeyElement.createFromTemplate(
          x,
          props.pageSetup.useOptionalDiatonicFthoras,
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
});

selectMode(props.element.mode);

window.addEventListener('keydown', onKeyDown);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});

function onKeyDown(event: KeyboardEvent) {
  if (event.code === 'Escape') {
    emit('close');
  }
}

function selectMode(mode: number) {
  selectedMode.value = mode;
  selectedTemplateId.value =
    modeKeyTemplatesForSelectedMode.value.find(
      (x) => x.templateId === props.element.templateId,
    )?.templateId || modeKeyTemplatesForSelectedMode.value[0].templateId;
}

function updateModeKey() {
  const modeKey = modeKeyTemplatesForSelectedMode.value.find(
    (x) => x.templateId === selectedTemplateId.value,
  );

  emit('update', modeKey);
  emit('close');
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.pane-container {
  display: flex;
  width: 460px;
  margin-bottom: 1.5rem;
}

.left-pane {
  height: 290px;
}

.right-pane {
  flex: 1;
  overflow: auto;
  height: 290px;
}

.mode-key-container {
  border: none;
  width: auto !important;

  --zoom: 1;
}

.header {
  font-size: 1.5rem;
  text-align: center;
}

ul {
  padding: 0;
}

ul li {
  list-style: none;
  cursor: default;
}

.left-pane {
  margin-right: 2rem;
}

.button-container {
  display: flex;
  justify-content: center;
}

.mode-list li {
  padding: 0.5rem;
}

li.selected {
  background-color: lightblue;
}

.form-group.row {
  display: flex;
  align-items: center;
}

.options-container {
  border-top: 1px solid lightgray;
  border-bottom: 1px solid lightgray;
  padding: 0.5rem 0;
  margin-bottom: 1rem;
}

.ok-btn {
  margin-right: 2rem;
}
</style>
