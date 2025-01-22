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
              @click="selectedModeKey = template"
              @dblclick="updateModeKey"
              v-for="(template, index) in modeKeyTemplatesForSelectedMode"
              :class="{
                selected: selectedModeKey?.templateId === template.templateId,
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
      <div class="button-container">
        <button
          class="ok-btn"
          :disabled="selectedModeKey == null"
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
  emits: ['close', 'update'],
})
export default class ModeKeyDialog extends Vue {
  @Prop() element!: ModeKeyElement;
  @Prop() pageSetup!: PageSetup;
  selectedMode: number | null = null;
  selectedModeKey: ModeKeyElement | null = null;

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
      .map((x) => ModeKeyElement.createFromTemplate(x, TextBoxAlignment.Left));

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
    this.selectedModeKey =
      this.modeKeyTemplatesForSelectedMode.find(
        (x) => x.templateId === this.element.templateId,
      ) || this.modeKeyTemplatesForSelectedMode[0];
  }

  updateModeKey() {
    this.$emit('update', this.selectedModeKey);
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

.ok-btn {
  margin-right: 2rem;
}
</style>
