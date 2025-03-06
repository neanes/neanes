<template>
  <ModalDialog>
    <div class="container">
      <div class="header">{{ $t('dialog:modeKey.root') }}</div>
      <div class="pane-container">
        <div class="left-pane">
          <ul class="mode-list">
            <li
              :class="{ selected: selectedMode === 1 }"
              @click="selectMode(1)"
            >
              {{ $t('model:mode.first') }}
            </li>
            <li
              :class="{ selected: selectedMode === 2 }"
              @click="selectMode(2)"
            >
              {{ $t('model:mode.second') }}
            </li>
            <li
              :class="{ selected: selectedMode === 3 }"
              @click="selectMode(3)"
            >
              {{ $t('model:mode.third') }}
            </li>
            <li
              :class="{ selected: selectedMode === 4 }"
              @click="selectMode(4)"
            >
              {{ $t('model:mode.fourth') }}
            </li>
            <li
              :class="{ selected: selectedMode === 5 }"
              @click="selectMode(5)"
            >
              {{ $t('model:mode.plagalFirst') }}
            </li>
            <li
              :class="{ selected: selectedMode === 6 }"
              @click="selectMode(6)"
            >
              {{ $t('model:mode.plagalSecond') }}
            </li>
            <li
              :class="{ selected: selectedMode === 7 }"
              @click="selectMode(7)"
            >
              {{ $t('model:mode.grave') }}
            </li>
            <li
              :class="{ selected: selectedMode === 8 }"
              @click="selectMode(8)"
            >
              {{ $t('model:mode.plagalFourth') }}
            </li>
          </ul>
        </div>
        <div class="right-pane">
          <ul class="mode-list">
            <li
              @click="selectedTemplateId = template.templateId"
              @dblclick="updateModeKey"
              v-for="(template, index) in modeKeyTemplatesForSelectedMode"
              :class="{
                selected: selectedTemplateId === template.templateId,
              }"
              :key="index"
            >
              <ModeKey :element="template" />
              <div class="mode-key-description">
                {{ $t(template.description) }}
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
          $t('toolbar:modeKey.useOptionalDiatonicFthoras')
        }}</label>
      </div>
      <div class="button-container">
        <button
          class="ok-btn"
          :disabled="selectedTemplateId == null"
          @click="updateModeKey"
        >
          {{ $t('dialog:common.update') }}
        </button>
        <button class="cancel-btn" @click="$emit('close')">
          {{ $t('dialog:common.cancel') }}
        </button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ModalDialog from '@/components/ModalDialog.vue';
import ModeKey from '@/components/ModeKey.vue';
import { ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { PageSetup } from '@/models/PageSetup';
import { TextMeasurementService } from '@/services/TextMeasurementService';

@Component({
  components: { ModalDialog, ModeKey },
  emits: ['close', 'update', 'update:useOptionalDiatonicFthoras'],
})
export default class ModeKeyDialog extends Vue {
  @Prop() element!: ModeKeyElement;
  @Prop() pageSetup!: PageSetup;
  selectedMode: number | null = null;
  selectedTemplateId: number | null = null;

  created() {
    this.selectMode(this.element.mode);

    window.addEventListener('keydown', this.onKeyDown);
  }

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  get modeKeyTemplatesForSelectedMode() {
    const elements = modeKeyTemplates
      .filter((x) => x.mode === this.selectedMode)
      .map((x) =>
        ModeKeyElement.createFromTemplate(
          x,
          this.pageSetup.useOptionalDiatonicFthoras,
          TextBoxAlignment.Left,
        ),
      );

    const height = TextMeasurementService.getFontHeight(
      `${elements[0].fontSize}px ${this.pageSetup.neumeDefaultFontFamily}`,
    );

    for (const element of elements) {
      element.height = height;
      element.computedFontFamily = this.pageSetup.neumeDefaultFontFamily;
    }

    return elements;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.$emit('close');
    }
  }

  selectMode(mode: number) {
    this.selectedMode = mode;
    this.selectedTemplateId =
      this.modeKeyTemplatesForSelectedMode.find(
        (x) => x.templateId === this.element.templateId,
      )?.templateId || this.modeKeyTemplatesForSelectedMode[0].templateId;
  }

  updateModeKey() {
    const modeKey = this.modeKeyTemplatesForSelectedMode.find(
      (x) => x.templateId === this.selectedTemplateId,
    );

    this.$emit('update', modeKey);
    this.$emit('close');
  }
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
