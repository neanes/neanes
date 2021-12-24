<template>
  <div class="editor">
    <MainToolbar
      :autoMode="autoMode"
      @addAutoMartyria="addAutoMartyria"
      @toggleAutoMode="toggleAutoMode"
      @updatePageBreak="updatePageBreak"
      @updateLineBreak="updateLineBreak"
      @updateTempo="updateTempo"
      @deleteSelectedElement="deleteSelectedElement"
    />
    <div class="content">
      <NeumeSelector
        class="neume-selector"
        @select-quantitative-neume="updateQuantitativeNeume"
      ></NeumeSelector>
      <div class="page-background">
        <div
          class="page"
          v-for="(page, pageIndex) in pages"
          :key="`page-${pageIndex}`"
          :ref="`page-${pageIndex}`"
        >
          <!-- <div class="mode-header red martyria">hWt</div> -->

          <div
            class="line"
            v-for="(line, lineIndex) in page.lines"
            :key="`line-${lineIndex}`"
            :ref="`line-${lineIndex}`"
          >
            <div
              v-for="(element, index) in line.elements"
              :key="`element-${index}`"
              :ref="`element-${index}`"
              class="element-box"
              :style="{ left: element.x + 'px', top: element.y + 'px' }"
            >
              <template v-if="isSyllableElement(element)">
                <div
                  :key="`element-${getElementIndex(element)}`"
                  :ref="`element-${getElementIndex(element)}`"
                  class="neume-box"
                >
                  <span
                    class="page-break"
                    v-if="element.pageBreak"
                    style="position: absolute; top: -10px"
                    >P</span
                  >
                  <span
                    class="line-break"
                    v-if="element.lineBreak"
                    style="position: absolute; top: -10px"
                    >L</span
                  >
                  <SyllableNeumeBox
                    class="syllable-box"
                    :note="element"
                    :class="[{ selected: element == selectedElement }]"
                    @click.native="selectedElement = element"
                  ></SyllableNeumeBox>
                  <div
                    class="lyrics-container"
                    :style="{
                      top: score.pageSetup.lyricsVerticalOffset + 'px',
                    }"
                    @click="selectedElement = null"
                  >
                    <ContentEditable
                      class="lyrics"
                      :content="element.lyrics"
                      @click.native="selectedElement = null"
                      @blur="updateLyrics(element, $event)"
                    ></ContentEditable>
                    <template v-if="isMelisma(element)">
                      <template v-if="element.melismaOffsetLeft">
                        <div
                          class="melisma full"
                          :style="{ left: element.melismaOffsetLeft + 'px' }"
                        >
                          {{ element.melismaText }}
                        </div>
                      </template>
                      <template v-else>
                        <div class="melisma" v-if="isMelisma(element)">
                          {{ element.melismaText }}
                        </div>
                      </template>
                    </template>
                  </div>
                </div>
              </template>
              <template v-if="isMartyriaElement(element)">
                <div
                  :key="`element-${getElementIndex(element)}`"
                  :ref="`element-${getElementIndex(element)}`"
                  class="neume-box"
                >
                  <span
                    v-if="element.pageBreak"
                    style="position: absolute; top: -10px"
                    >P</span
                  >
                  <span
                    v-if="element.lineBreak"
                    style="position: absolute; top: -10px"
                    >L</span
                  >
                  <MartyriaNeumeBox
                    class="marytria-neume-box"
                    :neume="element"
                    :class="[{ selected: element == selectedElement }]"
                    @click.native="selectedElement = element"
                  ></MartyriaNeumeBox>
                  <div class="lyrics"></div>
                </div>
              </template>
              <template v-if="isTempoElement(element)">
                <div
                  :key="`element-${getElementIndex(element)}`"
                  :ref="`element-${getElementIndex(element)}`"
                  class="neume-box"
                >
                  <span
                    v-if="element.pageBreak"
                    style="position: absolute; top: -10px"
                    >P</span
                  >
                  <span
                    v-if="element.lineBreak"
                    style="position: absolute; top: -10px"
                    >L</span
                  >
                  <TempoNeumeBox
                    class="tempo-neume-box"
                    :neume="element"
                    :class="[{ selected: element == selectedElement }]"
                    @click.native="selectedElement = element"
                  ></TempoNeumeBox>
                  <div class="lyrics"></div>
                </div>
              </template>
              <template v-if="isEmptyElement(element)">
                <div
                  :key="`element-${getElementIndex(element)}`"
                  :ref="`element-${getElementIndex(element)}`"
                  class="neume-box"
                >
                  <span
                    v-if="element.pageBreak"
                    style="position: absolute; top: -10px"
                    >P</span
                  >
                  <span
                    v-if="element.lineBreak"
                    style="position: absolute; top: -10px"
                    >L</span
                  >
                  <div
                    class="empty-neume-box"
                    :class="[{ selected: element == selectedElement }]"
                    @click="selectedElement = element"
                  ></div>
                  <div class="lyrics"></div>
                </div>
              </template>
              <template v-if="isTextBoxElement(element)">
                <TextBox
                  :key="`element-${getElementIndex(element)}`"
                  :element="element"
                  :class="[{ selectedTextbox: element == selectedElement }]"
                  @click.native="selectedElement = element"
                  @scoreUpdated="onScoreUpdated"
                >
                </TextBox>
              </template>
              <template v-if="isModeKeyElement(element)">
                <ModeKey
                  :key="`element-${getElementIndex(element)}`"
                  :element="element"
                  :class="[{ selectedTextbox: element == selectedElement }]"
                  @click.native="selectedElement = element"
                  @scoreUpdated="onScoreUpdated"
                >
                </ModeKey>
              </template>
              <template v-if="isStaffTextElement(element)">
                <StaffText
                  :key="`element-${getElementIndex(element)}`"
                  :ref="`element-${getElementIndex(element)}`"
                  :element="element"
                >
                </StaffText>
              </template>
              <template v-if="isDropCapElement(element)">
                <DropCap
                  :key="`element-${getElementIndex(element)}`"
                  :ref="`element-${getElementIndex(element)}`"
                  :element="element"
                  @click.native="selectedElement = element"
                  @dropCapUpdated="onDropCapUpdated"
                >
                </DropCap>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template
      v-if="selectedElement != null && isTextBoxElement(selectedElement)"
    >
      <TextToolbar :element="selectedElement" @scoreUpdated="onScoreUpdated" />
    </template>
    <template
      v-if="selectedElement != null && isModeKeyElement(selectedElement)"
    >
      <ModeKeyToolbar
        :element="selectedElement"
        @scoreUpdated="onScoreUpdated"
        @openModeKeyDialog="openModeKeyDialog"
      />
    </template>
    <template
      v-if="selectedElement != null && isSyllableElement(selectedElement)"
    >
      <NeumeToolbar :element="selectedElement" @scoreUpdated="onScoreUpdated" />
    </template>
    <template
      v-if="selectedElement != null && isMartyriaElement(selectedElement)"
    >
      <MartyriaToolbar
        :element="selectedElement"
        @scoreUpdated="onScoreUpdated"
      />
    </template>
    <ModeKeyDialog
      v-if="modeKeyDialogIsOpen"
      @scoreUpdated="onScoreUpdated"
      @close="modeKeyDialogIsOpen = false"
      :element="selectedElement"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import {
  ScoreElement,
  MartyriaElement,
  NoteElement,
  ElementType,
  EmptyElement,
  TextBoxElement,
  DropCapElement,
  TempoElement,
  ModeKeyElement,
  TextBoxAlignment,
} from '@/models/Element';
import {
  QuantitativeNeume,
  TimeNeume,
  Note,
  RootSign,
  VocalExpressionNeume,
  Fthora,
  GorgonNeume,
  TempoSign,
} from '@/models/Neumes';
import { Page, Line } from '@/models/Page';
import { Score } from '@/models/Score';
import { KeyboardMap, neumeMap } from '@/models/NeumeMappings';
import { SaveService } from '@/services/SaveService';
import { LayoutService } from '@/services/LayoutService';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import TempoNeumeBox from '@/components/NeumeBoxTempo.vue';
import NeumeSelector from '@/components/NeumeSelector.vue';
import NeumeKeyboard from '@/components/NeumeKeyboard.vue';
import ContentEditable from '@/components/ContentEditable.vue';
import FileMenuBar from '@/components/FileMenuBar.vue';
import StaffText from '@/components/StaffText.vue';
import TextBox from '@/components/TextBox.vue';
import { store } from '@/store';
import DropCap from '@/components/DropCap.vue';
import ModeKey from '@/components/ModeKey.vue';
import TextToolbar from '@/components/TextToolbar.vue';
import ModeKeyToolbar from '@/components/ModeKeyToolbar.vue';
import MainToolbar from '@/components/MainToolbar.vue';
import NeumeToolbar from '@/components/NeumeToolbar.vue';
import MartyriaToolbar from '@/components/MartyriaToolbar.vue';
import ModeKeyDialog from '@/components/ModeKeyDialog.vue';
import Neume from './Neume.vue';
import {
  FileMenuOpenScoreArgs,
  FileMenuSaveAsArgs,
  IpcMainChannels,
  IpcRendererChannels,
} from '@/ipc/ipcChannels';
import { EventBus } from '@/eventBus';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { TestFileGenerator } from '@/utils/TestFileGenerator';
import { TestFileType } from '@/utils/TestFileType';
import { Unit } from '@/utils/Unit';

@Component({
  components: {
    SyllableNeumeBox,
    MartyriaNeumeBox,
    TempoNeumeBox,
    NeumeSelector,
    NeumeKeyboard,
    ContentEditable,
    FileMenuBar,
    StaffText,
    TextBox,
    DropCap,
    ModeKey,
    TextToolbar,
    ModeKeyToolbar,
    NeumeToolbar,
    MartyriaToolbar,
    MainToolbar,
    ModeKeyDialog,
  },
})
export default class Editor extends Vue {
  pages: Page[] = [];

  autoMode: boolean = true;
  keyboardMode: boolean = false;

  modeKeyDialogIsOpen: boolean = false;

  get score() {
    return store.state.score;
  }

  set score(score: Score) {
    store.mutations.setScore(score);
  }

  get elements() {
    return store.getters.elements;
  }

  get selectedElement() {
    return store.state.selectedElement;
  }

  set selectedElement(element: ScoreElement | null) {
    store.mutations.setSelectedElement(element);
  }

  set currentFilePath(path: string | null) {
    store.mutations.setCurrentFilepath(path);
  }

  get currentFilePath() {
    return store.state.currentFilePath;
  }

  get hasUnsavedChanges() {
    return store.state.hasUnsavedChanges;
  }

  set hasUnsavedChanges(hasUnsavedChanges: boolean) {
    store.mutations.setHasUnsavedChanges(hasUnsavedChanges);
  }

  async created() {
    const fontLoader = (document as any).fonts;

    await Promise.all([
      fontLoader.load('1rem Athonite'),
      fontLoader.load('1rem Omega'),
      fontLoader.load('1rem Psaltica'),
      fontLoader.load('1rem EzSpecial1'),
      fontLoader.load('1rem EzSpecial2'),
      fontLoader.load('1rem EzFthora'),
      fontLoader.load('1rem Oxeia'),
      fontLoader.ready,
    ]);

    this.load();
  }

  mounted() {
    window.addEventListener('keydown', this.onKeydown);

    EventBus.$on(IpcMainChannels.FileMenuNewScore, this.onFileMenuNewScore);
    EventBus.$on(IpcMainChannels.FileMenuOpenScore, this.onFileMenuOpenScore);
    EventBus.$on(IpcMainChannels.FileMenuSave, this.onFileMenuSave);
    EventBus.$on(IpcMainChannels.FileMenuSaveAs, this.onFileMenuSaveAs);
    EventBus.$on(IpcMainChannels.SaveComplete, this.onSaveComplete);
    EventBus.$on(
      IpcMainChannels.FileMenuInsertNeume,
      this.onFileMenuInsertNeume,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertTextBox,
      this.onFileMenuInsertTextBox,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertModeKey,
      this.onFileMenuInsertModeKey,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertDropCap,
      this.onFileMenuInsertDropCap,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuGenerateTestFile,
      this.onFileMenuGenerateTestFile,
    );
  }

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown);

    EventBus.$off(IpcMainChannels.FileMenuNewScore, this.onFileMenuNewScore);
    EventBus.$off(IpcMainChannels.FileMenuOpenScore, this.onFileMenuOpenScore);
    EventBus.$off(IpcMainChannels.FileMenuSave, this.onFileMenuSave);
    EventBus.$off(IpcMainChannels.FileMenuSaveAs, this.onFileMenuSaveAs);
    EventBus.$off(IpcMainChannels.SaveComplete, this.onSaveComplete);
    EventBus.$off(
      IpcMainChannels.FileMenuInsertNeume,
      this.onFileMenuInsertNeume,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertTextBox,
      this.onFileMenuInsertTextBox,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertModeKey,
      this.onFileMenuInsertModeKey,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertDropCap,
      this.onFileMenuInsertDropCap,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuGenerateTestFile,
      this.onFileMenuGenerateTestFile,
    );
  }

  updated() {
    Vue.nextTick(() => {
      if (store.state.elementToFocus != null) {
        const index = this.elements.indexOf(store.state.elementToFocus);
        (this.$refs[`element-${index}`] as any)[0].focus();
        store.mutations.setElementToFocus(null);
      }
    });
  }

  getElementIndex(element: ScoreElement) {
    return this.elements.indexOf(element);
  }

  isMelisma(element: NoteElement) {
    return (
      LayoutService.isIntermediateMelisma(element, this.elements) ||
      LayoutService.isFinalMelisma(element, this.elements)
    );
  }

  openModeKeyDialog() {
    this.modeKeyDialogIsOpen = true;
  }

  updateQuantitativeNeume(neume: QuantitativeNeume) {
    if (this.selectedElement) {
      if (
        this.autoMode &&
        this.selectedElement.elementType !== ElementType.Empty
      ) {
        this.moveRight();
      }

      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Note) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as NoteElement).setQuantitativeNeume(neume);

      this.save();
    }
  }

  updateTimeNeume(neume: TimeNeume | null) {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Note) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as NoteElement).setTimeNeume(neume);

      this.save();
    }
  }

  updateGorgonNeume(neume: GorgonNeume | null) {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Note) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as NoteElement).setGorgonNeume(neume);

      this.save();
    }
  }

  updateFthora(neume: Fthora | null) {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Note) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as NoteElement).setFthora(neume);

      this.save();
    }
  }

  updateVocalExpressionNeume(neume: VocalExpressionNeume) {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Note) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      (this.selectedElement as NoteElement).setVocalExpressionNeume(neume);

      this.save();
    }
  }

  updateMartyriaNote(neume: Note) {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      (this.selectedElement as MartyriaElement).note = neume;

      this.save();
    }
  }

  updateMartyriaRootSign(neume: RootSign) {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      (this.selectedElement as MartyriaElement).rootSign = neume;

      this.save();
    }
  }

  updateMartyriaNoteAndRootSign(
    note: Note,
    rootSign: RootSign,
    apostrophe: boolean | undefined,
  ) {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      (this.selectedElement as MartyriaElement).note = note;
      (this.selectedElement as MartyriaElement).rootSign = rootSign;
      (this.selectedElement as MartyriaElement).apostrophe =
        apostrophe || false;

      this.save();
    }
  }

  addAutoMartyria() {
    if (this.selectedElement) {
      if (
        this.autoMode &&
        this.selectedElement.elementType !== ElementType.Empty
      ) {
        this.moveRight();
      }

      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Martyria) {
        this.selectedElement = this.switchToMartyria(this.selectedElement);
      }

      this.save();
    }
  }

  updateTempo(neume: TempoSign) {
    if (this.selectedElement) {
      if (
        this.autoMode &&
        this.selectedElement.elementType !== ElementType.Empty
      ) {
        this.moveRight();
      }

      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Tempo) {
        this.selectedElement = this.switchToTempo(this.selectedElement);
      }

      (this.selectedElement as TempoElement).neume = neume;

      this.save();
    }
  }

  updatePageBreak() {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index !== this.elements.length - 1) {
        this.selectedElement.pageBreak = !this.selectedElement.pageBreak;
        this.save();
      }
    }
  }

  updateLineBreak() {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index !== this.elements.length - 1) {
        this.selectedElement.lineBreak = !this.selectedElement.lineBreak;
        this.save();
      }
    }
  }

  updateEmpty() {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (index === this.elements.length - 1) {
        this.addEmptyElement();
      }

      if (this.selectedElement.elementType != ElementType.Empty) {
        this.selectedElement = this.switchToEmptyElement(this.selectedElement);
      }

      this.save();
    }
  }

  switchToMartyria(element: ScoreElement) {
    const index = this.elements.indexOf(element);

    const newElement = new MartyriaElement();
    newElement.pageBreak = element.pageBreak;
    newElement.lineBreak = element.lineBreak;

    this.elements.splice(index, 1, newElement);

    return newElement;
  }

  switchToTempo(element: ScoreElement) {
    const index = this.elements.indexOf(element);

    const newElement = new TempoElement();
    newElement.pageBreak = element.pageBreak;
    newElement.lineBreak = element.lineBreak;

    this.elements.splice(index, 1, newElement);

    return newElement;
  }

  switchToSyllable(element: ScoreElement) {
    const index = this.elements.indexOf(element);

    const newElement = new NoteElement();
    newElement.pageBreak = element.pageBreak;
    newElement.lineBreak = element.lineBreak;

    this.elements.splice(index, 1, newElement);

    return newElement;
  }

  switchToEmptyElement(element: ScoreElement) {
    const index = this.elements.indexOf(element);

    const newElement = new EmptyElement();
    newElement.pageBreak = element.pageBreak;
    newElement.lineBreak = element.lineBreak;

    this.elements.splice(index, 1, newElement);

    return newElement;
  }

  addEmptyElement() {
    this.elements.push(new EmptyElement());
  }

  isSyllableElement(element: ScoreElement) {
    return element.elementType == ElementType.Note;
  }

  isMartyriaElement(element: ScoreElement) {
    return element.elementType == ElementType.Martyria;
  }

  isTempoElement(element: ScoreElement) {
    return element.elementType == ElementType.Tempo;
  }

  isEmptyElement(element: ScoreElement) {
    return element.elementType == ElementType.Empty;
  }

  isTextBoxElement(element: ScoreElement) {
    return element.elementType == ElementType.TextBox;
  }

  isStaffTextElement(element: ScoreElement) {
    return element.elementType == ElementType.StaffText;
  }

  isDropCapElement(element: ScoreElement) {
    return element.elementType == ElementType.DropCap;
  }

  isModeKeyElement(element: ScoreElement) {
    return element.elementType == ElementType.ModeKey;
  }

  keydownLastHandleTime: number = +new Date();
  keydownThrottleIntervalMs: number = 100;

  onKeydown(event: KeyboardEvent) {
    const now = +new Date();

    if (
      this.selectedElement == null ||
      this.selectedElement.elementType === ElementType.StaffText ||
      this.selectedElement.elementType === ElementType.TextBox ||
      this.selectedElement.elementType === ElementType.DropCap ||
      now - this.keydownLastHandleTime < this.keydownThrottleIntervalMs
    ) {
      return;
    }

    let handled = false;

    if (event.code == 'ArrowLeft') {
      this.moveLeft();
      handled = true;
    } else if (event.code == 'ArrowRight' || event.code == 'Space') {
      this.moveRight();
      handled = true;
    } else if (event.code == 'Backspace') {
      handled = true;

      if (this.isSyllableElement(this.selectedElement)) {
        let syllableElement = this.selectedElement as NoteElement;
        if (syllableElement.timeNeume) {
          syllableElement.timeNeume = null;
        } else {
          this.selectedElement = this.switchToEmptyElement(
            this.selectedElement,
          );
          this.moveLeft();
          this.save();
        }
      } else {
        this.selectedElement = this.switchToEmptyElement(this.selectedElement);
        this.moveLeft();
        this.save();
      }
    } else if (event.code == 'Delete') {
      handled = true;

      this.deleteSelectedElement();
    }

    if (this.keyboardMode && !event.ctrlKey) {
      if (event.shiftKey) {
        const quantitativeNeume =
          KeyboardMap.quantitativeNeumeKeyboardMap_Shift.get(event.code);

        if (quantitativeNeume) {
          this.updateQuantitativeNeume(quantitativeNeume);
          handled = true;
        }
      } else {
        const quantitativeNeume = KeyboardMap.quantitativeNeumeKeyboardMap.get(
          event.code,
        );

        if (quantitativeNeume) {
          this.updateQuantitativeNeume(quantitativeNeume);
          handled = true;
        } else {
          const timeNeume = KeyboardMap.timeNeumeKeyboardMap.get(event.code);

          if (timeNeume) {
            this.updateTimeNeume(timeNeume);
            handled = true;
          }
        }
      }
    }

    if (handled) {
      event.preventDefault();
      this.keydownLastHandleTime = +new Date();
    }
  }

  navigableElements = [
    ElementType.Note,
    ElementType.Martyria,
    ElementType.Tempo,
    ElementType.Empty,
  ];

  moveLeft() {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (
        index - 1 >= 0 &&
        this.navigableElements.includes(this.elements[index - 1].elementType)
      ) {
        this.selectedElement = this.elements[index - 1];
      }
    }
  }

  moveRight() {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (
        index >= 0 &&
        index + 1 < this.elements.length &&
        this.navigableElements.includes(this.elements[index + 1].elementType)
      ) {
        this.selectedElement = this.elements[index + 1];
      }
    }
  }

  save(markUnsavedChanges: boolean = true) {
    localStorage.setItem(
      'score',
      JSON.stringify(SaveService.SaveScoreToJson(this.score)),
    );

    if (markUnsavedChanges) {
      this.hasUnsavedChanges = true;
    }

    this.pages = LayoutService.processPages(
      this.elements,
      this.score.pageSetup,
    );
  }

  load() {
    const scoreString = localStorage.getItem('score');
    this.currentFilePath = localStorage.getItem('filePath');
    this.hasUnsavedChanges =
      localStorage.getItem('hasUnsavedChanges') === 'true';

    if (scoreString) {
      const score: Score = SaveService.LoadScoreFromJson(
        JSON.parse(scoreString),
      );

      this.score = score;
    } else {
      this.score = this.createDefaultScore();
      this.selectedElement =
        this.score.staff.elements[this.score.staff.elements.length - 1];
    }

    this.pages = LayoutService.processPages(
      this.elements,
      this.score.pageSetup,
    );
  }

  updateLyrics(element: NoteElement, lyrics: string) {
    // Nothing changed. No further processing is necessary.
    if (element.lyrics === lyrics) {
      return;
    }

    if (lyrics === '_') {
      element.isMelisma = true;
      element.isMelismaStart = false;
      element.lyrics = '';
    } else if (lyrics.endsWith('_')) {
      element.isMelisma = true;
      element.isMelismaStart = true;
      element.lyrics = lyrics.slice(0, -1);
    } else {
      element.isMelisma = false;
      element.isMelismaStart = false;
      element.lyrics = lyrics;
    }

    this.save();
  }

  onDropCapUpdated(element: DropCapElement) {
    if (element.content === '') {
      const index = this.elements.indexOf(element);

      if (index > -1) {
        if (this.selectedElement === element) {
          this.selectedElement = null;
        }

        this.elements.splice(index, 1);
      }
    }

    this.save();
  }

  deleteSelectedElement() {
    if (this.selectedElement) {
      const index = this.elements.indexOf(this.selectedElement);

      if (this.selectedElement && index !== this.elements.length - 1) {
        this.moveLeft();

        if (index > -1) {
          this.elements.splice(index, 1);
          this.save();
        }
      }
    }
  }

  toggleAutoMode() {
    this.autoMode = !this.autoMode;
  }

  onFileMenuNewScore() {
    // TODO warn about unsaved changes and let the user save the current document first.
    if (
      !this.hasUnsavedChanges ||
      confirm(
        'The current score has unsaved changes. If you continue, the changes will be lost. Are you sure you wish to continue?',
      )
    ) {
      this.hasUnsavedChanges = false;
      this.currentFilePath = null;
      this.score = this.createDefaultScore();
      this.selectedElement =
        this.score.staff.elements[this.score.staff.elements.length - 1];
      this.save(false);
    }
  }

  onFileMenuOpenScore(args: FileMenuOpenScoreArgs) {
    const score: Score = SaveService.LoadScoreFromJson(JSON.parse(args.data));
    this.currentFilePath = args.filePath;
    this.hasUnsavedChanges = false;

    // if (score.version !== ScoreVersion) {
    //   alert('This score was created by an older version of the application. It may not work properly');
    // }

    this.score = score;
    this.selectedElement = null;

    this.save(false);
  }

  onFileMenuInsertNeume() {
    store.getters.elements.splice(
      store.getters.selectedElementIndex,
      0,
      new EmptyElement(),
    );
    this.save();
  }

  onFileMenuInsertTextBox() {
    const element = new TextBoxElement();

    store.getters.elements.splice(
      store.getters.selectedElementIndex,
      0,
      element,
    );

    this.selectedElement = element;
    store.mutations.setElementToFocus(element);

    this.save();
  }

  onFileMenuInsertModeKey() {
    const element = this.createDefaultModeKey();

    store.getters.elements.splice(
      store.getters.selectedElementIndex,
      0,
      element,
    );

    this.selectedElement = element;

    this.openModeKeyDialog();

    this.save();
  }

  onFileMenuInsertDropCap() {
    const element = new DropCapElement();

    store.getters.elements.splice(
      store.getters.selectedElementIndex,
      0,
      element,
    );

    this.selectedElement = element;
    store.mutations.setElementToFocus(element);
    this.save();
  }

  getSaveFile() {
    return JSON.stringify(SaveService.SaveScoreToJson(this.score), null, 2);
  }

  onFileMenuSave() {
    // If there is no file path, the file has not been saved yet,
    // so we must do a Save As. In that case, there is no point
    // in calling getSaveFile, since it will be called during
    // the Save As process.
    EventBus.$emit(IpcRendererChannels.FileMenuSaveReply, {
      data: this.currentFilePath ? this.getSaveFile() : null,
      filePath: this.currentFilePath,
    });
  }

  onFileMenuSaveAs(args: FileMenuSaveAsArgs) {
    this.currentFilePath = args.filePath;

    EventBus.$emit(IpcRendererChannels.FileMenuSaveAsReply, {
      data: this.getSaveFile(),
    });
  }

  onSaveComplete() {
    this.hasUnsavedChanges = false;
  }

  onFileMenuGenerateTestFile(testFileType: TestFileType) {
    if (
      confirm(
        'This will discard your current score. Make sure you have saved before doing this. Are you sure you wish to continue?',
      )
    ) {
      this.currentFilePath = null;
      this.score = new Score();
      this.score.staff.elements.unshift(
        ...(TestFileGenerator.generateTestFile(testFileType) || []),
      );
      this.save();
    }
  }

  onScoreUpdated() {
    this.save();
  }

  createDefaultModeKey() {
    const defaultTemplate = ModeKeyElement.createFromTemplate(
      modeKeyTemplates[0],
    );
    const element = new ModeKeyElement();
    element.updateFrom(defaultTemplate);
    element.color = this.score.pageSetup.modeKeyDefaultColor;

    return element;
  }

  createDefaultScore() {
    const score = new Score();

    const title = new TextBoxElement();
    title.content = 'Title';
    title.alignment = TextBoxAlignment.Center;
    title.fontSize = Unit.FromPt(16);

    score.staff.elements.unshift(title, this.createDefaultModeKey());

    return score;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.lyrics {
  font-family: Omega;
  min-height: 1.6rem;
  min-width: 1rem;
  text-align: center;
  position: relative;
}

.red {
  color: #ed0000;
}

.selected {
  background-color: palegoldenrod;
}

.selectedTextbox {
  border: 1px solid goldenrod;
}

.line {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  width: 100%;
}

.element-box {
  position: absolute;
}

.neume-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  /* width: 39px;  */
  /* height: 82px; */

  position: relative;

  /* margin-right: 0.25rem; */
}

.empty-neume-box {
  width: 39px;
  height: 82px;
  border: 1px dotted black;
  box-sizing: border-box;
}

.page-background {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 4rem;
  background-color: #ddd;

  overflow: auto;
  flex: 1;
}

.page {
  margin-bottom: 20px;

  background-color: white;
  min-width: 624px;
  max-width: 624px;
  width: 624px;
  height: 864px;
  min-height: 864px;
  max-height: 864px;
  padding: 96px;
  overflow: hidden;

  position: relative;
}

.editor {
  display: flex;
  flex-direction: column;

  flex: 1;

  height: 100%;
}

.content {
  display: flex;
  flex: 1;
  overflow: auto;
}

.neume-selector {
  overflow: auto;
}

.mode-header {
  font-size: 1.75rem;
  text-align: center;
}

.lyrics-container {
  min-height: 1.6rem;
  min-width: 1rem;
  text-align: center;
  position: absolute;
  white-space: nowrap;
}

.melisma {
  font-family: Omega;
  position: absolute;
  display: inline;
}

.melisma.full {
  position: relative;
}

.neume {
  display: flex;
}

@media print {
  body * {
    visibility: hidden;
  }

  .page,
  .page * {
    visibility: visible;
  }

  .page-background {
    display: block;
    position: absolute;
    left: 0;
    top: 0;
    padding: 0;
  }

  .page {
    width: auto;
    height: auto;
    margin-bottom: 0;
    padding: 0;
    width: 816px;
    height: 1056px;
    min-width: 816px;
    max-width: 816px;
    min-height: 1056px;
    max-height: 1056px;
  }

  .empty-neume-box {
    visibility: hidden;
  }

  .text-box-container {
    border: none;
  }

  .mode-key-container {
    border: none;
  }

  .neume-toolbar,
  .martyria-toolbar,
  .text-toolbar,
  .page-break,
  .line-break {
    display: none !important;
  }
}
</style>
