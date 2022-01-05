<template>
  <ModalDialog>
    <div class="container">
      <div class="header">Select Mode Key</div>
      <div class="pane-container">
        <div class="left-pane">
          <ul class="mode-list">
            <li
              :class="{ selected: selectedMode === 1 }"
              @click="selectMode(1)"
            >
              First Mode
            </li>
            <li
              :class="{ selected: selectedMode === 2 }"
              @click="selectMode(2)"
            >
              Second Mode
            </li>
            <li
              :class="{ selected: selectedMode === 3 }"
              @click="selectMode(3)"
            >
              Third Mode
            </li>
            <li
              :class="{ selected: selectedMode === 4 }"
              @click="selectMode(4)"
            >
              Fourth Mode
            </li>
            <li
              :class="{ selected: selectedMode === 5 }"
              @click="selectMode(5)"
            >
              Plagal of the First Mode
            </li>
            <li
              :class="{ selected: selectedMode === 6 }"
              @click="selectMode(6)"
            >
              Plagal of the Second Mode
            </li>
            <li
              :class="{ selected: selectedMode === 7 }"
              @click="selectMode(7)"
            >
              Grave Mode
            </li>
            <li
              :class="{ selected: selectedMode === 8 }"
              @click="selectMode(8)"
            >
              Plagal of the Fourth Mode
            </li>
          </ul>
        </div>
        <div class="right-pane">
          <ul class="mode-list">
            <li
              @click="selectedModeKey = template"
              v-for="(template, index) in modeKeyTemplatesForSelectedMode"
              :class="{ selected: selectedModeKey === template }"
              :key="index"
            >
              <ModeKey :element="template" :pageSetup="pageSetup" />
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
          Update
        </button>
        <button class="cancel-btn" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ModeKeyElement, TextBoxAlignment } from '@/models/Element';
import { modeKeyTemplates } from '@/models/ModeKeys';
import ModalDialog from '@/components/ModalDialog.vue';
import ModeKey from '@/components/ModeKey.vue';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: { ModalDialog, ModeKey },
})
export default class ModeKeyDialog extends Vue {
  @Prop() element!: ModeKeyElement;
  @Prop() pageSetup!: PageSetup;
  private selectedMode: number | null = null;
  private selectedModeKey: ModeKeyElement | null = null;

  created() {
    this.selectMode(this.element.mode);

    window.addEventListener('keydown', this.onKeyDown);
  }

  destroyed() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  get modeKeyTemplatesForSelectedMode() {
    return modeKeyTemplates
      .filter((x) => x.mode === this.selectedMode)
      .map((x) => ModeKeyElement.createFromTemplate(x, TextBoxAlignment.Left));
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
.container {
  font-family: Arial, Helvetica, sans-serif;
}

.pane-container {
  display: flex;
  width: 420px;
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
