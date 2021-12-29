<template>
  <div class="editor">
    <MainToolbar
      :entryMode="entryMode"
      :zoom="zoom"
      @updateZoom="updateZoom"
      @addAutoMartyria="addAutoMartyria"
      @updateEntryMode="updateEntryMode"
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
      <div class="page-background" @keydown="onKeydown" tabindex="-1">
        <div
          class="page"
          :style="pageStyle"
          v-for="(page, pageIndex) in pages"
          :key="`page-${pageIndex}`"
          :ref="`page-${pageIndex}`"
        >
          <div
            class="line"
            v-for="(line, lineIndex) in page.lines"
            :key="`line-${pageIndex}-${lineIndex}`"
            :ref="`line-${lineIndex}`"
          >
            <div
              v-for="(element, index) in line.elements"
              :key="`lineElement-${pageIndex}-${lineIndex}-${index}`"
              class="element-box"
              :style="getElementStyle(element)"
            >
              <template v-if="isSyllableElement(element)">
                <div
                  :ref="`element-${getElementIndex(element)}`"
                  class="neume-box"
                >
                  <span class="page-break" v-if="element.pageBreak"
                    ><img src="@/assets/pagebreak.svg"
                  /></span>
                  <span class="line-break" v-if="element.lineBreak"
                    >&#182;</span
                  >
                  <SyllableNeumeBox
                    class="syllable-box"
                    :note="element"
                    :class="[{ selected: element == selectedElement }]"
                    @click.native="selectedElement = element"
                  ></SyllableNeumeBox>
                  <div class="lyrics-container" :style="lyricStyle">
                    <ContentEditable
                      class="lyrics"
                      :content="element.lyrics"
                      :ref="`lyrics-${getElementIndex(element)}`"
                      @focus.native="selectedLyrics = element"
                      @blur="updateLyrics(element, $event)"
                    ></ContentEditable>
                    <template v-if="isMelisma(element)">
                      <template v-if="element.melismaOffsetLeft">
                        <div
                          class="melisma full"
                          :style="getFullMelismaStyle(element)"
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
                <div class="neume-box">
                  <span v-if="element.pageBreak">
                    ><img src="@/assets/pagebreak.svg"
                  /></span>
                  <span v-if="element.lineBreak">&#182;</span>
                  <MartyriaNeumeBox
                    :ref="`element-${getElementIndex(element)}`"
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
                  :ref="`element-${getElementIndex(element)}`"
                  class="neume-box"
                >
                  <span v-if="element.pageBreak">
                    ><img src="@/assets/pagebreak.svg"
                  /></span>
                  <span v-if="element.lineBreak">&#182;</span>
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
                  :ref="`element-${getElementIndex(element)}`"
                  class="neume-box"
                >
                  <span v-if="element.pageBreak">
                    ><img src="@/assets/pagebreak.svg"
                  /></span>
                  <span v-if="element.lineBreak">&#182;</span>
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
                  :ref="`element-${getElementIndex(element)}`"
                  :element="element"
                  :class="[{ selectedTextbox: element == selectedElement }]"
                  @click.native="selectedElement = element"
                  @update:content="updateTextBoxContent(element, $event)"
                >
                </TextBox>
              </template>
              <template v-if="isModeKeyElement(element)">
                <ModeKey
                  :ref="`element-${getElementIndex(element)}`"
                  :element="element"
                  :class="[{ selectedTextbox: element == selectedElement }]"
                  @click.native="selectedElement = element"
                  @dblclick.native="openModeKeyDialog"
                  @scoreUpdated="onScoreUpdated"
                >
                </ModeKey>
              </template>
              <template v-if="isStaffTextElement(element)">
                <StaffText
                  :ref="`element-${getElementIndex(element)}`"
                  :element="element"
                >
                </StaffText>
              </template>
              <template v-if="isDropCapElement(element)">
                <DropCap
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
      <TextToolbar
        :element="selectedElement"
        @update:fontSize="updateTextBoxFontSize(selectedElement, $event)"
        @update:fontFamily="updateTextBoxFontFamily(selectedElement, $event)"
        @update:alignment="updateTextBoxAlignment(selectedElement, $event)"
        @update:color="updateTextBoxColor(selectedElement, $event)"
      />
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
      :element="selectedElement"
      @update="updateModeKey(selectedElement, $event)"
      @close="modeKeyDialogIsOpen = false"
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
import {
  FileMenuOpenScoreArgs,
  FileMenuSaveAsArgs,
  FileMenuSaveAsReplyArgs,
  FileMenuSaveReplyArgs,
  IpcMainChannels,
  IpcRendererChannels,
} from '@/ipc/ipcChannels';
import { EventBus } from '@/eventBus';
import { ModeKeyTemplate, modeKeyTemplates } from '@/models/ModeKeys';
import { TestFileGenerator } from '@/utils/TestFileGenerator';
import { TestFileType } from '@/utils/TestFileType';
import { Unit } from '@/utils/Unit';
import { withZoom } from '@/utils/withZoom';
import { throttle } from 'throttle-debounce';
import {
  CommandFactory,
  CommandService,
} from '@/services/history/CommandService';

export enum EntryMode {
  Auto = 'Auto',
  Insert = 'Insert',
  Edit = 'Edit',
}

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

  entryMode: EntryMode = EntryMode.Auto;
  keyboardMode: boolean = false;

  modeKeyDialogIsOpen: boolean = false;

  commandService: CommandService = new CommandService();
  noteElementCommandFactory: CommandFactory<NoteElement> =
    new CommandFactory<NoteElement>();
  textBoxCommandFactory: CommandFactory<TextBoxElement> =
    new CommandFactory<TextBoxElement>();
  modeKeyCommandFactory: CommandFactory<ModeKeyElement> =
    new CommandFactory<ModeKeyElement>();

  // Throttled Methods
  keydownThrottleIntervalMs: number = 100;

  moveToPreviousLyricBoxThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.moveToPreviousLyricBox,
  );

  moveToNextLyricBoxThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.moveToNextLyricBox,
  );

  moveLeftThrottled = throttle(this.keydownThrottleIntervalMs, this.moveLeft);

  moveRightThrottled = throttle(this.keydownThrottleIntervalMs, this.moveRight);

  deleteSelectedElementThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.deleteSelectedElement,
  );

  onFileMenuUndoThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.onFileMenuUndo,
  );
  onFileMenuRedoThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.onFileMenuRedo,
  );

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

  get selectedLyrics() {
    return store.state.selectedLyrics;
  }

  set selectedLyrics(element: NoteElement | null) {
    store.mutations.setSelectedLyrics(element);
  }

  get zoom() {
    return store.state.zoom;
  }

  set zoom(zoom: number) {
    store.mutations.setZoom(zoom);
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

  get pageStyle() {
    return {
      minWidth: withZoom(this.score.pageSetup.pageWidth),
      maxWidth: withZoom(this.score.pageSetup.pageWidth),
      width: withZoom(this.score.pageSetup.pageWidth),
      height: withZoom(this.score.pageSetup.pageHeight),
      minHeight: withZoom(this.score.pageSetup.pageHeight),
      maxHeight: withZoom(this.score.pageSetup.pageHeight),
    } as CSSStyleDeclaration;
  }

  get lyricStyle() {
    return {
      top: withZoom(this.score.pageSetup.lyricsVerticalOffset),
      fontSize: withZoom(this.score.pageSetup.lyricsDefaultFontSize),
    } as CSSStyleDeclaration;
  }

  getElementStyle(element: ScoreElement) {
    return {
      left: withZoom(element.x),
      top: withZoom(element.y),
    } as CSSStyleDeclaration;
  }

  getFullMelismaStyle(element: NoteElement) {
    return {
      left: withZoom(element.melismaOffsetLeft!),
    } as CSSStyleDeclaration;
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
    EventBus.$on(IpcMainChannels.FileMenuNewScore, this.onFileMenuNewScore);
    EventBus.$on(IpcMainChannels.FileMenuOpenScore, this.onFileMenuOpenScore);
    EventBus.$on(IpcMainChannels.FileMenuSave, this.onFileMenuSave);
    EventBus.$on(IpcMainChannels.FileMenuSaveAs, this.onFileMenuSaveAs);
    EventBus.$on(IpcMainChannels.SaveComplete, this.onSaveComplete);
    EventBus.$on(IpcMainChannels.FileMenuUndo, this.onFileMenuUndo);
    EventBus.$on(IpcMainChannels.FileMenuRedo, this.onFileMenuRedo);
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
        store.mutations.setElementToFocus(null);

        (this.$refs[`element-${index}`] as any)[0].focus();
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

  isLastElement(element: ScoreElement) {
    return this.elements.indexOf(element) === this.elements.length - 1;
  }

  updateQuantitativeNeume(neume: QuantitativeNeume) {
    if (this.selectedElement) {
      // Handle auto entry mode
      if (
        this.entryMode === EntryMode.Auto &&
        !this.isLastElement(this.selectedElement)
      ) {
        if (!this.moveRight()) {
          return;
        }
      }

      // Handle insert mode
      if (
        this.entryMode === EntryMode.Insert &&
        !this.isLastElement(this.selectedElement)
      ) {
        const emptyElement = new EmptyElement();

        store.getters.elements.splice(
          store.getters.selectedElementIndex + 1,
          0,
          emptyElement,
        );

        this.selectedElement = emptyElement;
      }

      if (
        [ElementType.Empty, ElementType.Martyria].includes(
          this.selectedElement.elementType,
        )
      ) {
        this.selectedElement = this.switchToSyllable(this.selectedElement);
      }

      if (this.selectedElement.elementType === ElementType.Note) {
        (this.selectedElement as NoteElement).setQuantitativeNeume(neume);

        if (this.isLastElement(this.selectedElement)) {
          this.addEmptyElement();
        }

        this.save();
      }
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
      // Handle auto mode
      if (
        this.entryMode === EntryMode.Auto &&
        !this.isLastElement(this.selectedElement)
      ) {
        this.moveRight();
      }

      // Handle insert mode
      if (
        this.entryMode === EntryMode.Insert &&
        !this.isLastElement(this.selectedElement)
      ) {
        const emptyElement = new EmptyElement();

        store.getters.elements.splice(
          store.getters.selectedElementIndex + 1,
          0,
          emptyElement,
        );

        this.selectedElement = emptyElement;
      }

      if (this.isLastElement(this.selectedElement)) {
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
        this.entryMode === EntryMode.Auto &&
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

  isTextInputFocused() {
    return (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      (document.activeElement instanceof HTMLElement &&
        document.activeElement.contentEditable === 'true')
    );
  }

  onKeydown(event: KeyboardEvent) {
    // Handle undo / redo
    // See https://github.com/electron/electron/issues/3682.
    if (event.ctrlKey && !this.isTextInputFocused()) {
      if (event.code === 'KeyZ') {
        this.onFileMenuUndoThrottled();
        event.preventDefault();
        return;
      } else if (event.code === 'KeyY') {
        this.onFileMenuRedoThrottled();
        event.preventDefault();
        return;
      }
    }

    if (
      this.selectedElement != null &&
      this.navigableElements.includes(this.selectedElement.elementType)
    ) {
      return this.onKeydownNeume(event);
    } else if (this.selectedLyrics != null) {
      return this.onKeydownLyrics(event);
    }
  }

  onKeydownNeume(event: KeyboardEvent) {
    let handled = false;

    switch (event.code) {
      case 'ArrowLeft':
        this.moveLeftThrottled();
        handled = true;
        break;
      case 'ArrowRight':
      case 'Space':
        this.moveRightThrottled();
        handled = true;
        break;
      case 'Delete':
      case 'Backspace':
        handled = true;

        this.deleteSelectedElementThrottled();
        break;
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
    }
  }

  onKeydownLyrics(event: KeyboardEvent) {
    let handled = false;

    // We don't handle the shift key
    if (event.shiftKey) {
      return;
    }

    if (event.ctrlKey) {
      switch (event.code) {
        case 'ArrowRight':
          this.moveToNextLyricBoxThrottled();
          handled = true;
          break;
        case 'ArrowLeft':
          this.moveToPreviousLyricBoxThrottled();
          handled = true;
          break;
        case 'Space':
          // Ctrl + Space should add a normal space character
          document.execCommand('insertText', false, ' ');
          handled = true;
          break;
      }
    } else {
      switch (event.code) {
        case 'Space':
          this.moveToNextLyricBoxThrottled();
          handled = true;
          break;
        case 'ArrowLeft':
          if (this.getCursorPosition() === 0) {
            this.moveToPreviousLyricBoxThrottled();
            handled = true;
          }
          break;
        case 'ArrowRight':
          if (this.getCursorPosition() === this.selectedLyrics!.lyrics.length) {
            this.moveToNextLyricBoxThrottled();
            handled = true;
          }
          break;
      }
    }

    if (handled) {
      event.preventDefault();
    }
  }

  getCursorPosition() {
    const selection = window.getSelection();

    if (selection != null) {
      const range = selection.getRangeAt(0);
      if (range.startOffset === range.endOffset) {
        return selection.getRangeAt(0).startOffset;
      }
    }

    return null;
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

  moveToNextLyricBox() {
    if (this.selectedLyrics) {
      const currentIndex = this.elements.indexOf(this.selectedLyrics);
      let nextIndex = -1;

      // Find the index of the next note
      for (let i = currentIndex + 1; i < this.elements.length; i++) {
        if (this.elements[i].elementType === ElementType.Note) {
          nextIndex = i;
          break;
        }
      }

      if (nextIndex >= 0) {
        (this.$refs[`lyrics-${nextIndex}`] as any)[0].focus();
        return true;
      }
    }

    return false;
  }

  moveToPreviousLyricBox() {
    if (this.selectedLyrics) {
      const currentIndex = this.elements.indexOf(this.selectedLyrics);
      let nextIndex = -1;

      // Find the index of the previous note
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (this.elements[i].elementType === ElementType.Note) {
          nextIndex = i;
          break;
        }
      }

      if (nextIndex >= 0) {
        (this.$refs[`lyrics-${nextIndex}`] as any)[0].focus();
        return true;
      }
    }

    return false;
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
        return true;
      }
    }

    return false;
  }

  save(markUnsavedChanges: boolean = true) {
    if (markUnsavedChanges) {
      this.hasUnsavedChanges = true;
    }

    this.pages = LayoutService.processPages(
      this.elements,
      this.score.pageSetup,
    );

    localStorage.setItem(
      'score',
      JSON.stringify(SaveService.SaveScoreToJson(this.score)),
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

    // Calculate melisma properties
    let isMelisma: boolean;
    let isMelismaStart: boolean;

    if (lyrics === '_') {
      isMelisma = true;
      isMelismaStart = false;
      lyrics = '';
    } else if (lyrics.endsWith('_')) {
      isMelisma = true;
      isMelismaStart = true;
      lyrics = lyrics.slice(0, -1);
    } else {
      isMelisma = false;
      isMelismaStart = false;
    }

    this.commandService.execute(
      this.noteElementCommandFactory.create('update-properties', {
        target: element,
        newValues: { lyrics, isMelisma, isMelismaStart },
      }),
    );

    this.save();
  }

  updateTextBox(element: TextBoxElement, newValues: Partial<TextBoxElement>) {
    this.commandService.execute(
      this.textBoxCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    this.save();
  }

  updateTextBoxContent(element: TextBoxElement, content: string) {
    this.updateTextBox(element, { content });
  }

  updateTextBoxFontSize(element: TextBoxElement, fontSize: number) {
    this.updateTextBox(element, { fontSize });
  }

  updateTextBoxFontFamily(element: TextBoxElement, fontFamily: string) {
    this.updateTextBox(element, { fontFamily });
  }

  updateTextBoxColor(element: TextBoxElement, color: string) {
    this.updateTextBox(element, { color });
  }

  updateTextBoxAlignment(element: TextBoxElement, alignment: TextBoxAlignment) {
    this.updateTextBox(element, { alignment });
  }

  updateModeKey(element: ModeKeyElement, template: ModeKeyElement) {
    const {
      mode,
      scale,
      scaleNote,
      fthora,
      fthora2,
      note,
      note2,
      quantitativeNeumeTop,
      quantitativeNeumeRight,
    } = template;

    const newValues = {
      mode,
      scale,
      scaleNote,
      fthora,
      fthora2,
      note,
      note2,
      quantitativeNeumeTop,
      quantitativeNeumeRight,
      martyrias: template.martyrias.map((x) => x),
    };

    this.commandService.execute(
      this.modeKeyCommandFactory.create('update-properties', {
        target: element,
        newValues,
      }),
    );

    this.save();

    console.log(document.activeElement);
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

  updateEntryMode(mode: EntryMode) {
    this.entryMode = mode;
  }

  updateZoom(zoom: number) {
    this.zoom = zoom;
  }

  onFileMenuNewScore() {
    this.hasUnsavedChanges = false;
    this.currentFilePath = null;
    this.entryMode = EntryMode.Auto;
    this.score = this.createDefaultScore();
    this.selectedElement =
      this.score.staff.elements[this.score.staff.elements.length - 1];
    this.save(false);
  }

  onFileMenuOpenScore(args: FileMenuOpenScoreArgs) {
    const score: Score = SaveService.LoadScoreFromJson(JSON.parse(args.data));
    this.currentFilePath = args.filePath;
    this.hasUnsavedChanges = false;
    this.entryMode = EntryMode.Edit;

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
    EventBus.$emit(IpcRendererChannels.FileMenuSaveReply, {
      data: this.getSaveFile(),
    } as FileMenuSaveReplyArgs);
  }

  onFileMenuSaveAs(args: FileMenuSaveAsArgs) {
    this.currentFilePath = args.filePath;

    EventBus.$emit(IpcRendererChannels.FileMenuSaveAsReply, {
      data: this.getSaveFile(),
    } as FileMenuSaveAsReplyArgs);
  }

  onSaveComplete() {
    this.hasUnsavedChanges = false;
  }

  onFileMenuUndo() {
    this.commandService.undo();
    this.save();
  }

  onFileMenuRedo() {
    this.commandService.redo();
    this.save();
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

    defaultTemplate.color = this.score.pageSetup.modeKeyDefaultColor;

    return defaultTemplate;
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
  padding: 2rem 1rem;
  background-color: #ddd;

  overflow: auto;
  flex: 1;
}

.page {
  margin-bottom: 20px;

  margin-left: auto;
  margin-right: auto;

  background-color: white;
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

.page-break {
  position: absolute;
  top: calc(-10px * var(--zoom, 1));
}

.page-break img {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.line-break {
  position: absolute;
  font-size: calc(16px * var(--zoom, 1));
  top: calc(-10px * var(--zoom, 1));
}

.line-break img {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
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
