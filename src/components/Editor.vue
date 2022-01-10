<template>
  <div class="editor">
    <MainToolbar
      :entryMode="entryMode"
      :zoom="zoom"
      :zoomToFit="zoomToFit"
      @update:zoom="updateZoom"
      @update:zoomToFit="updateZoomToFit"
      @add-auto-martyria="addAutoMartyria"
      @update:entryMode="updateEntryMode"
      @toggle-page-break="togglePageBreak"
      @toggle-line-break="toggleLineBreak"
      @add-tempo="addTempo"
      @add-drop-cap="addDropCap"
      @delete-selected-element="deleteSelectedElement"
      @click.native="selectedLyrics = null"
    />
    <div class="content">
      <NeumeSelector
        class="neume-selector"
        @select-quantitative-neume="addQuantitativeNeume"
      ></NeumeSelector>
      <div class="page-background" ref="page-background">
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
                    :pageSetup="score.pageSetup"
                    :class="[{ selected: element == selectedElement }]"
                    @click.native="selectedElement = element"
                  ></SyllableNeumeBox>
                  <div
                    class="lyrics-container"
                    :key="`lyrics-${getElementIndex(element)}-${
                      element.keyHelper
                    }`"
                    :style="getLyricStyle(element)"
                    @click="focusLyrics(getElementIndex(element))"
                  >
                    <ContentEditable
                      class="lyrics"
                      :content="element.lyrics"
                      :ref="`lyrics-${getElementIndex(element)}`"
                      @focus.native="selectedLyrics = element"
                      @blur="updateLyrics(element, $event)"
                    ></ContentEditable>
                    <template v-if="isMelisma(element)">
                      <div
                        class="melisma"
                        :class="{ full: element.isFullMelisma }"
                        :style="getMelismaStyle(element)"
                        v-text="element.melismaText"
                      ></div>
                    </template>
                  </div>
                </div>
              </template>
              <template v-if="isMartyriaElement(element)">
                <div class="neume-box">
                  <span class="page-break" v-if="element.pageBreak">
                    ><img src="@/assets/pagebreak.svg"
                  /></span>
                  <span class="line-break" v-if="element.lineBreak"
                    >&#182;</span
                  >
                  <MartyriaNeumeBox
                    :ref="`element-${getElementIndex(element)}`"
                    class="marytria-neume-box"
                    :neume="element"
                    :pageSetup="score.pageSetup"
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
                  <span class="page-break" v-if="element.pageBreak">
                    ><img src="@/assets/pagebreak.svg"
                  /></span>
                  <span class="line-break" v-if="element.lineBreak"
                    >&#182;</span
                  >
                  <TempoNeumeBox
                    class="tempo-neume-box"
                    :neume="element"
                    :pageSetup="score.pageSetup"
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
                  <span class="page-break" v-if="element.pageBreak">
                    ><img src="@/assets/pagebreak.svg"
                  /></span>
                  <span class="line-break" v-if="element.lineBreak"
                    >&#182;</span
                  >
                  <div
                    class="empty-neume-box"
                    :class="[{ selected: element == selectedElement }]"
                    :style="getEmptyBoxStyle(element)"
                    @click="selectedElement = element"
                  ></div>
                  <div class="lyrics"></div>
                </div>
              </template>
              <template v-if="isTextBoxElement(element)">
                <span class="page-break-2" v-if="element.pageBreak"
                  ><img src="@/assets/pagebreak.svg"
                /></span>
                <span class="line-break-2" v-if="element.lineBreak"
                  >&#182;</span
                >
                <TextBox
                  :ref="`element-${getElementIndex(element)}`"
                  :element="element"
                  :pageSetup="score.pageSetup"
                  :class="[{ selectedTextbox: element == selectedElement }]"
                  @click.native="selectedElement = element"
                  @update:content="updateTextBoxContent(element, $event)"
                >
                </TextBox>
              </template>
              <template v-if="isModeKeyElement(element)">
                <span class="page-break-2" v-if="element.pageBreak"
                  ><img src="@/assets/pagebreak.svg"
                /></span>
                <span class="line-break-2" v-if="element.lineBreak"
                  >&#182;</span
                >
                <ModeKey
                  :ref="`element-${getElementIndex(element)}`"
                  :element="element"
                  :pageSetup="score.pageSetup"
                  :class="[{ selectedTextbox: element == selectedElement }]"
                  @click.native="selectedElement = element"
                  @dblclick.native="openModeKeyDialog"
                >
                </ModeKey>
              </template>
              <template v-if="isDropCapElement(element)">
                <span class="page-break" v-if="element.pageBreak"
                  ><img src="@/assets/pagebreak.svg"
                /></span>
                <span class="line-break" v-if="element.lineBreak">&#182;</span>
                <DropCap
                  :ref="`element-${getElementIndex(element)}`"
                  :key="`drop-cap-${getElementIndex(element)}-${
                    element.keyHelper
                  }`"
                  :element="element"
                  :pageSetup="score.pageSetup"
                  @click.native="selectedElement = element"
                  @update:content="
                    updateDropCapContent(selectedElement, $event)
                  "
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
        @update:fontSize="updateModeKeyFontSize(selectedElement, $event)"
        @update:alignment="updateModeKeyAlignment(selectedElement, $event)"
        @update:color="updateModeKeyColor(selectedElement, $event)"
        @open-mode-key-dialog="openModeKeyDialog"
      />
    </template>
    <template
      v-if="selectedElement != null && isSyllableElement(selectedElement)"
    >
      <NeumeToolbar
        :element="selectedElement"
        @update:accidental="updateNoteAccidental(selectedElement, $event)"
        @update:fthora="updateNoteFthora(selectedElement, $event)"
        @update:gorgon="updateNoteGorgon(selectedElement, $event)"
        @update:time="updateNoteTime(selectedElement, $event)"
        @update:expression="updateNoteExpression(selectedElement, $event)"
        @update:measureBar="updateNoteMeasureBar(selectedElement, $event)"
        @update:vocalExpression="
          updateNoteVocalExpression(selectedElement, $event)
        "
      />
    </template>
    <template
      v-if="selectedElement != null && isMartyriaElement(selectedElement)"
    >
      <MartyriaToolbar
        :element="selectedElement"
        @update:fthora="updateMartyriaFthora(selectedElement, $event)"
        @update:measureBar="updateMartyriaMeasureBar(selectedElement, $event)"
        @update:alignRight="updateMartyriaAlignRight(selectedElement, $event)"
      />
    </template>
    <ModeKeyDialog
      v-if="modeKeyDialogIsOpen"
      :element="selectedElement"
      :pageSetup="score.pageSetup"
      @update="updateModeKeyFromTemplate(selectedElement, $event)"
      @close="closeModeKeyDialog"
    />
    <PageSetupDialog
      v-if="pageSetupDialogIsOpen"
      :pageSetup="score.pageSetup"
      @update="updatePageSetup($event)"
      @close="closePageSetupDialog"
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
  VocalExpressionNeume,
  Fthora,
  GorgonNeume,
  TempoSign,
  MeasureBar,
  Accidental,
} from '@/models/Neumes';
import { Page } from '@/models/Page';
import { Score } from '@/models/Score';
import { SaveService } from '@/services/SaveService';
import { LayoutService } from '@/services/LayoutService';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import TempoNeumeBox from '@/components/NeumeBoxTempo.vue';
import NeumeSelector from '@/components/NeumeSelector.vue';
import NeumeKeyboard from '@/components/NeumeKeyboard.vue';
import ContentEditable from '@/components/ContentEditable.vue';
import FileMenuBar from '@/components/FileMenuBar.vue';
import TextBox from '@/components/TextBox.vue';
import DropCap from '@/components/DropCap.vue';
import ModeKey from '@/components/ModeKey.vue';
import TextToolbar from '@/components/TextToolbar.vue';
import ModeKeyToolbar from '@/components/ModeKeyToolbar.vue';
import MainToolbar from '@/components/MainToolbar.vue';
import NeumeToolbar from '@/components/NeumeToolbar.vue';
import MartyriaToolbar from '@/components/MartyriaToolbar.vue';
import ModeKeyDialog from '@/components/ModeKeyDialog.vue';
import PageSetupDialog from '@/components/PageSetupDialog.vue';
import {
  FileMenuOpenScoreArgs,
  FileMenuPrintReplyArgs,
  FileMenuSaveAsArgs,
  FileMenuSaveAsReplyArgs,
  FileMenuSaveReplyArgs,
  IpcMainChannels,
  IpcRendererChannels,
} from '@/ipc/ipcChannels';
import { EventBus } from '@/eventBus';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { TestFileGenerator } from '@/utils/TestFileGenerator';
import { TestFileType } from '@/utils/TestFileType';
import { Unit } from '@/utils/Unit';
import { withZoom } from '@/utils/withZoom';
import { throttle } from 'throttle-debounce';
import {
  CommandFactory,
  CommandService,
} from '@/services/history/CommandService';
import { PageSetup } from '@/models/PageSetup';

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
    TextBox,
    DropCap,
    ModeKey,
    TextToolbar,
    ModeKeyToolbar,
    NeumeToolbar,
    MartyriaToolbar,
    MainToolbar,
    ModeKeyDialog,
    PageSetupDialog,
  },
})
export default class Editor extends Vue {
  isDevelopment: boolean = process.env.NODE_ENV !== 'production';

  score: Score = new Score();
  pages: Page[] = [];

  entryMode: EntryMode = EntryMode.Auto;

  selectedElementValue: ScoreElement | null = null;
  selectedLyricsValue: NoteElement | null = null;

  zoomValue: number = 1;
  zoomToFit: boolean = false;

  currentFilePathValue: string | null = null;
  hasUnsavedChangesValue: boolean = false;

  elementToFocus: ScoreElement | null = null;

  modeKeyDialogIsOpen: boolean = false;
  pageSetupDialogIsOpen: boolean = false;

  // Commands
  commandService: CommandService = new CommandService();

  noteElementCommandFactory: CommandFactory<NoteElement> =
    new CommandFactory<NoteElement>();

  martyriaCommandFactory: CommandFactory<MartyriaElement> =
    new CommandFactory<MartyriaElement>();

  tempoCommandFactory: CommandFactory<TempoElement> =
    new CommandFactory<TempoElement>();

  textBoxCommandFactory: CommandFactory<TextBoxElement> =
    new CommandFactory<TextBoxElement>();

  modeKeyCommandFactory: CommandFactory<ModeKeyElement> =
    new CommandFactory<ModeKeyElement>();

  dropCapCommandFactory: CommandFactory<DropCapElement> =
    new CommandFactory<DropCapElement>();

  scoreElementCommandFactory: CommandFactory<ScoreElement> =
    new CommandFactory<ScoreElement>();

  pageSetupCommandFactory: CommandFactory<PageSetup> =
    new CommandFactory<PageSetup>();

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

  deletePreviousElementThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.deletePreviousElement,
  );

  onFileMenuUndoThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.onFileMenuUndo,
  );

  onFileMenuRedoThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.onFileMenuRedo,
  );

  onWindowResizeThrottled = throttle(250, this.onWindowResize);

  get elements() {
    return this.score != null ? this.score.staff.elements : [];
  }

  get selectedElementIndex() {
    return this.selectedElement != null
      ? this.elements.indexOf(this.selectedElement)
      : -1;
  }

  get windowTitle() {
    const unsavedChangesMarker = this.hasUnsavedChanges ? '*' : '';

    if (this.currentFilePath != null) {
      const fileName = this.currentFilePath.replace(/^.*[\\/]/, '');
      return `${unsavedChangesMarker}${fileName} - ${process.env.VUE_APP_TITLE}`;
    } else {
      return `${unsavedChangesMarker}Untitled 1 - ${process.env.VUE_APP_TITLE}`;
    }
  }

  get selectedElement() {
    return this.selectedElementValue;
  }

  set selectedElement(element: ScoreElement | null) {
    if (element != null) {
      this.selectedLyrics = null;
    }

    this.selectedElementValue = element;
  }

  get selectedLyrics() {
    return this.selectedLyricsValue;
  }

  set selectedLyrics(element: NoteElement | null) {
    if (element != null) {
      this.selectedElementValue = null;
    }

    this.selectedLyricsValue = element;
  }

  get zoom() {
    return this.zoomValue;
  }

  set zoom(zoom: number) {
    if (zoom < 0.5) {
      zoom = 0.5;
    } else if (zoom > 2) {
      zoom = 2;
    }

    this.zoomValue = zoom;
    document.documentElement.style.setProperty('--zoom', zoom.toString());
  }

  get currentFilePath() {
    return this.currentFilePathValue;
  }

  set currentFilePath(path: string | null) {
    this.currentFilePathValue = path;

    window.document.title = this.windowTitle;

    EventBus.$emit(IpcRendererChannels.SetFilePath, path);
  }

  get hasUnsavedChanges() {
    return this.hasUnsavedChangesValue;
  }

  set hasUnsavedChanges(hasUnsavedChanges: boolean) {
    this.hasUnsavedChangesValue = hasUnsavedChanges;
    window.document.title = this.windowTitle;
    EventBus.$emit(IpcRendererChannels.SetHasUnsavedChanges, hasUnsavedChanges);
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

  getLyricStyle(element: NoteElement) {
    return {
      top: withZoom(element.lyricsVerticalOffset),
      paddingLeft:
        element.lyricsHorizontalOffset != null
          ? withZoom(element.lyricsHorizontalOffset)
          : undefined,
      fontSize: withZoom(this.score.pageSetup.lyricsDefaultFontSize),
      fontFamily: this.score.pageSetup.lyricsDefaultFontFamily,
      color: this.score.pageSetup.lyricsDefaultColor,
    } as CSSStyleDeclaration;
  }

  getEmptyBoxStyle(element: EmptyElement) {
    return {
      width: withZoom(element.width),
      height: withZoom(element.height),
    } as CSSStyleDeclaration;
  }

  getElementStyle(element: ScoreElement) {
    return {
      left: withZoom(element.x),
      top: withZoom(element.y),
    } as CSSStyleDeclaration;
  }

  getMelismaStyle(element: NoteElement) {
    return {
      width: withZoom(element.melismaWidth!),
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
    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('resize', this.onWindowResizeThrottled);

    EventBus.$on(IpcMainChannels.FileMenuNewScore, this.onFileMenuNewScore);
    EventBus.$on(IpcMainChannels.FileMenuOpenScore, this.onFileMenuOpenScore);
    EventBus.$on(IpcMainChannels.FileMenuPrint, this.onFileMenuPrint);
    EventBus.$on(IpcMainChannels.FileMenuSave, this.onFileMenuSave);
    EventBus.$on(IpcMainChannels.FileMenuSaveAs, this.onFileMenuSaveAs);
    EventBus.$on(IpcMainChannels.FileMenuPageSetup, this.onFileMenuPageSetup);
    EventBus.$on(IpcMainChannels.SaveComplete, this.onSaveComplete);
    EventBus.$on(IpcMainChannels.FileMenuUndo, this.onFileMenuUndo);
    EventBus.$on(IpcMainChannels.FileMenuRedo, this.onFileMenuRedo);
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
    window.removeEventListener('resize', this.onWindowResizeThrottled);

    EventBus.$off(IpcMainChannels.FileMenuNewScore, this.onFileMenuNewScore);
    EventBus.$off(IpcMainChannels.FileMenuOpenScore, this.onFileMenuOpenScore);
    EventBus.$off(IpcMainChannels.FileMenuPrint, this.onFileMenuPrint);
    EventBus.$off(IpcMainChannels.FileMenuSave, this.onFileMenuSave);
    EventBus.$off(IpcMainChannels.FileMenuSaveAs, this.onFileMenuSaveAs);
    EventBus.$off(IpcMainChannels.FileMenuPageSetup, this.onFileMenuPageSetup);
    EventBus.$off(IpcMainChannels.SaveComplete, this.onSaveComplete);
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
      if (this.elementToFocus != null) {
        const index = this.elements.indexOf(this.elementToFocus);
        this.elementToFocus = null;

        (this.$refs[`element-${index}`] as any)[0].focus();
      }
    });
  }

  getElementIndex(element: ScoreElement) {
    return this.elements.indexOf(element);
  }

  isMelisma(element: NoteElement) {
    return element.melismaWidth > 0;
  }

  openModeKeyDialog() {
    this.modeKeyDialogIsOpen = true;
  }

  closeModeKeyDialog() {
    this.modeKeyDialogIsOpen = false;
  }

  closePageSetupDialog() {
    this.pageSetupDialogIsOpen = false;
  }

  isLastElement(element: ScoreElement) {
    return this.elements.indexOf(element) === this.elements.length - 1;
  }

  addQuantitativeNeume(quantitativeNeume: QuantitativeNeume) {
    if (this.selectedElement == null) {
      return;
    }

    const element = new NoteElement();
    element.quantitativeNeume = quantitativeNeume;

    switch (this.entryMode) {
      case EntryMode.Auto:
        if (!this.isLastElement(this.selectedElement) && !this.moveRight()) {
          return;
        }

        if (this.isLastElement(this.selectedElement)) {
          this.addScoreElement(element, this.selectedElementIndex);
          this.selectedElement = element;
        } else {
          if (this.selectedElement.elementType === ElementType.Note) {
            if (
              (this.selectedElement as NoteElement).quantitativeNeume !==
              quantitativeNeume
            ) {
              this.updateNote(this.selectedElement as NoteElement, {
                quantitativeNeume,
              });
            }
          } else {
            this.selectedElement = this.switchToSyllable(
              this.selectedElement,
              element,
            );
          }
        }
        break;
      case EntryMode.Insert:
        if (this.isLastElement(this.selectedElement)) {
          this.addScoreElement(element, this.selectedElementIndex);
        } else {
          this.addScoreElement(element, this.selectedElementIndex + 1);
        }
        this.selectedElement = element;
        break;

      case EntryMode.Edit:
        if (this.isLastElement(this.selectedElement)) {
          this.addScoreElement(element, this.selectedElementIndex);
        } else if (this.selectedElement.elementType === ElementType.Note) {
          if (
            (this.selectedElement as NoteElement).quantitativeNeume !==
            quantitativeNeume
          ) {
            this.updateNote(this.selectedElement as NoteElement, {
              quantitativeNeume,
            });
          }
        } else if (
          this.navigableElements.includes(this.selectedElement.elementType)
        ) {
          this.selectedElement = this.switchToSyllable(
            this.selectedElement,
            element,
          );
        }
        break;
    }

    this.save();
  }

  addAutoMartyria() {
    if (this.selectedElement == null) {
      return;
    }

    const element = new MartyriaElement();

    switch (this.entryMode) {
      case EntryMode.Auto:
        this.moveRight();

        if (this.isLastElement(this.selectedElement)) {
          this.addScoreElement(element, this.selectedElementIndex);
          this.selectedElement = element;
        } else {
          if (this.selectedElement.elementType != ElementType.Martyria) {
            this.selectedElement = this.switchToMartyria(this.selectedElement);
          }
        }
        break;
      case EntryMode.Insert:
        if (this.isLastElement(this.selectedElement)) {
          this.addScoreElement(element, this.selectedElementIndex);
        } else {
          this.addScoreElement(element, this.selectedElementIndex + 1);
        }
        this.selectedElement = element;
        break;
      case EntryMode.Edit:
        if (this.isLastElement(this.selectedElement)) {
          this.addScoreElement(element, this.selectedElementIndex);
        } else if (this.selectedElement.elementType != ElementType.Martyria) {
          this.selectedElement = this.switchToMartyria(this.selectedElement);
        }
        break;
    }

    this.save();
  }

  addTempo(neume: TempoSign) {
    if (this.selectedElement == null) {
      return;
    }

    const element = new TempoElement();
    element.neume = neume;

    switch (this.entryMode) {
      case EntryMode.Auto:
        this.moveRight();

        if (this.isLastElement(this.selectedElement)) {
          this.addScoreElement(element, this.selectedElementIndex);
          this.selectedElement = element;
        } else {
          if (this.selectedElement.elementType === ElementType.Tempo) {
            if ((this.selectedElement as TempoElement).neume !== neume) {
              this.updateTempo(this.selectedElement as TempoElement, {
                neume,
              });
            }
          } else {
            this.selectedElement = this.switchToTempo(
              this.selectedElement,
              element,
            );
          }
        }
        break;
      case EntryMode.Insert:
        if (this.isLastElement(this.selectedElement)) {
          this.addScoreElement(element, this.selectedElementIndex);
        } else {
          this.addScoreElement(element, this.selectedElementIndex + 1);
        }
        this.selectedElement = element;
        break;
      case EntryMode.Edit:
        if (this.isLastElement(this.selectedElement)) {
          this.addScoreElement(element, this.selectedElementIndex);
        } else if (this.selectedElement.elementType === ElementType.Tempo) {
          if ((this.selectedElement as TempoElement).neume !== neume) {
            this.updateTempo(this.selectedElement as TempoElement, {
              neume,
            });
          }
        } else {
          this.selectedElement = this.switchToTempo(
            this.selectedElement,
            element,
          );
        }
        break;
    }

    this.save();
  }

  addDropCap() {
    const element = new DropCapElement();

    this.addScoreElement(element, this.selectedElementIndex);

    this.selectedElement = element;
    this.elementToFocus = element;
    this.save();
  }

  togglePageBreak() {
    if (this.selectedElement && !this.isLastElement(this.selectedElement)) {
      this.commandService.execute(
        this.scoreElementCommandFactory.create('update-properties', {
          target: this.selectedElement,
          newValues: {
            pageBreak: !this.selectedElement.pageBreak,
            lineBreak: false,
          },
        }),
      );

      this.save();
    }
  }

  toggleLineBreak() {
    if (this.selectedElement && !this.isLastElement(this.selectedElement)) {
      this.commandService.execute(
        this.scoreElementCommandFactory.create('update-properties', {
          target: this.selectedElement,
          newValues: {
            lineBreak: !this.selectedElement.lineBreak,
            pageBreak: false,
          },
        }),
      );

      this.save();
    }
  }

  switchToMartyria(element: ScoreElement) {
    const index = this.elements.indexOf(element);

    const newElement = new MartyriaElement();
    newElement.pageBreak = element.pageBreak;
    newElement.lineBreak = element.lineBreak;

    this.replaceScoreElement(newElement, index);

    return newElement;
  }

  switchToTempo(oldElement: ScoreElement, newElement: TempoElement) {
    const index = this.elements.indexOf(oldElement);

    newElement.pageBreak = oldElement.pageBreak;
    newElement.lineBreak = oldElement.lineBreak;

    this.replaceScoreElement(newElement, index);

    return newElement;
  }

  switchToSyllable(oldElement: ScoreElement, newElement: NoteElement) {
    const index = this.elements.indexOf(oldElement);

    newElement.pageBreak = oldElement.pageBreak;
    newElement.lineBreak = oldElement.lineBreak;

    this.replaceScoreElement(newElement, index);

    return newElement;
  }

  focusLyrics(index: number) {
    (this.$refs[`lyrics-${index}`] as ContentEditable[])[0].focus();
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
        document.activeElement.isContentEditable)
    );
  }

  dialogOpen() {
    return this.modeKeyDialogIsOpen || this.pageSetupDialogIsOpen;
  }

  onWindowResize() {
    if (this.zoomToFit) {
      this.performZoomToFit();
    }
  }

  onKeydown(event: KeyboardEvent) {
    // Handle undo / redo
    // See https://github.com/electron/electron/issues/3682.
    if (event.ctrlKey && !this.isTextInputFocused() && !this.dialogOpen()) {
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

    if (this.selectedElement != null) {
      if (
        this.navigableElements.includes(this.selectedElement.elementType) &&
        !this.isTextInputFocused() &&
        !this.dialogOpen()
      ) {
        return this.onKeydownNeume(event);
      } else if (this.selectedElement.elementType === ElementType.DropCap) {
        return this.onKeydownDropCap(event);
      }
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
      case 'Backspace':
        handled = true;
        this.deletePreviousElementThrottled();
        break;
      case 'Delete':
        handled = true;
        this.deleteSelectedElementThrottled();
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  onKeydownLyrics(event: KeyboardEvent) {
    let handled = false;

    // Do not allow enter key in lyrics
    if (event.code === 'Enter') {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && event.code !== 'Minus') {
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
          if (
            this.getCursorPosition() ===
            this.getLyricLength(this.selectedLyrics!)
          ) {
            this.moveToNextLyricBoxThrottled();
            handled = true;
          }
          break;
        case 'Minus':
          if (event.shiftKey) {
            document.execCommand('insertText', false, '_');
          } else {
            document.execCommand('insertText', false, '-');
          }

          if (
            this.getCursorPosition() ===
            this.getLyricLength(this.selectedLyrics!)
          ) {
            if (this.getNextLyricBoxIndex() >= 0) {
              this.moveToNextLyricBoxThrottled();
            } else {
              // If this is the last lyric box, blur
              // so that the melisma is registered and
              // the user doesn't accidentally type more
              // characters into box
              const index = this.elements.indexOf(this.selectedLyrics!);
              (this.$refs[`lyrics-${index}`] as ContentEditable[])[0].blur();
            }
          }

          handled = true;
          break;
      }
    }

    if (handled) {
      event.preventDefault();
    }
  }

  onKeydownDropCap(event: KeyboardEvent) {
    // Do not allow enter key in drop caps
    if (event.code === 'Enter') {
      event.preventDefault();
      return;
    }
  }

  getLyricLength(element: NoteElement) {
    return (
      this.$refs[
        `lyrics-${this.elements.indexOf(element)}`
      ] as ContentEditable[]
    )[0].getInnerText().length;
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

  getNextLyricBoxIndex() {
    if (this.selectedLyrics) {
      const currentIndex = this.elements.indexOf(this.selectedLyrics);

      // Find the index of the next note
      for (let i = currentIndex + 1; i < this.elements.length; i++) {
        if (this.elements[i].elementType === ElementType.Note) {
          return i;
        }
      }
    }

    return -1;
  }

  moveToNextLyricBox() {
    const nextIndex = this.getNextLyricBoxIndex();

    if (nextIndex >= 0) {
      this.focusLyrics(nextIndex);
      return true;
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
        this.focusLyrics(nextIndex);
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

    if (this.isDevelopment) {
      localStorage.setItem(
        'score',
        JSON.stringify(SaveService.SaveScoreToJson(this.score)),
      );

      if (this.currentFilePath != null) {
        localStorage.setItem('filePath', this.currentFilePath);
      } else {
        localStorage.removeItem('filePath');
      }

      localStorage.setItem(
        'hasUnsavedChanges',
        this.hasUnsavedChanges.toString(),
      );
    }
  }

  load() {
    this.score = this.createDefaultScore();
    this.hasUnsavedChanges = false;
    this.currentFilePath = null;

    if (this.isDevelopment) {
      const scoreString = localStorage.getItem('score');
      if (scoreString) {
        const score: Score = SaveService.LoadScoreFromJson(
          JSON.parse(scoreString),
        );
        this.currentFilePath = localStorage.getItem('filePath');
        this.hasUnsavedChanges =
          localStorage.getItem('hasUnsavedChanges') === 'true';
        this.score = score;
      }
    }

    this.selectedElement =
      this.score.staff.elements[this.score.staff.elements.length - 1];

    this.pages = LayoutService.processPages(
      this.elements,
      this.score.pageSetup,
    );

    EventBus.$emit(IpcRendererChannels.EditorFinishedLoading);
  }

  addScoreElement(element: ScoreElement, insertAtIndex?: number) {
    this.commandService.execute(
      this.scoreElementCommandFactory.create('add-to-collection', {
        element,
        collection: this.elements,
        insertAtIndex,
      }),
    );
  }

  replaceScoreElement(element: ScoreElement, replaceAtIndex: number) {
    this.commandService.execute(
      this.scoreElementCommandFactory.create('replace-element-in-collection', {
        element,
        collection: this.elements,
        replaceAtIndex,
      }),
    );
  }

  removeScoreElement(element: ScoreElement) {
    this.commandService.execute(
      this.scoreElementCommandFactory.create('remove-from-collection', {
        element,
        collection: this.elements,
      }),
    );
  }

  updateNote(element: NoteElement, newValues: Partial<NoteElement>) {
    this.commandService.execute(
      this.noteElementCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    this.save();
  }

  updateNoteAccidental(element: NoteElement, accidental: Accidental) {
    this.updateNote(element, { accidental });
  }

  updateNoteFthora(element: NoteElement, fthora: Fthora) {
    this.updateNote(element, { fthora });
  }

  updateNoteExpression(
    element: NoteElement,
    vocalExpressionNeume: VocalExpressionNeume,
  ) {
    this.updateNote(element, { vocalExpressionNeume });
  }

  updateNoteTime(element: NoteElement, timeNeume: TimeNeume) {
    this.updateNote(element, { timeNeume });
  }

  updateNoteGorgon(element: NoteElement, gorgonNeume: GorgonNeume) {
    this.updateNote(element, { gorgonNeume });
  }

  updateNoteMeasureBar(element: NoteElement, measureBar: MeasureBar) {
    this.updateNote(element, { measureBar });
  }

  updateLyrics(element: NoteElement, lyrics: string) {
    // Replace newlines. This should only happen if the user pastes
    // text containing new lines.
    const sanitizedLyrics = lyrics.replace(/(?:\r\n|\r|\n)/g, ' ');
    if (sanitizedLyrics !== lyrics) {
      lyrics = sanitizedLyrics;

      // Force the lyrics to re-render
      element.keyHelper++;
    }

    if (element.lyrics === lyrics) {
      return;
    }

    // Calculate melisma properties
    let isMelisma: boolean;
    let isMelismaStart: boolean;
    let isHyphen: boolean;

    if (lyrics === '_' || lyrics === '-') {
      isMelisma = true;
      isMelismaStart = false;
      isHyphen = lyrics === '-';
      lyrics = '';

      // Force the lyrics to re-render
      element.keyHelper++;
    } else if (lyrics.endsWith('_') || lyrics.endsWith('-')) {
      isMelisma = true;
      isMelismaStart = true;
      isHyphen = lyrics.endsWith('-');
      lyrics = lyrics.slice(0, -1);

      // Force the lyrics to re-render
      element.keyHelper++;
    } else {
      isMelisma = false;
      isMelismaStart = false;
      isHyphen = false;
    }

    // If nothing changed, return. This could happen if
    // the user types in an underscore when the element is
    // already a melisma.
    if (
      element.lyrics === lyrics &&
      element.isMelismaStart === isMelismaStart &&
      element.isMelisma === isMelisma &&
      element.isHyphen === isHyphen
    ) {
      return;
    }

    this.commandService.execute(
      this.noteElementCommandFactory.create('update-properties', {
        target: element,
        newValues: {
          lyrics,
          isMelisma,
          isMelismaStart,
          isHyphen,
        },
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

  updateModeKey(element: ModeKeyElement, newValues: Partial<ModeKeyElement>) {
    this.commandService.execute(
      this.modeKeyCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    this.save();
  }

  updateModeKeyFontSize(element: ModeKeyElement, fontSize: number) {
    this.updateModeKey(element, { fontSize });
  }

  updateModeKeyColor(element: ModeKeyElement, color: string) {
    this.updateModeKey(element, { color });
  }

  updateModeKeyAlignment(element: ModeKeyElement, alignment: TextBoxAlignment) {
    this.updateModeKey(element, { alignment });
  }

  updateModeKeyFromTemplate(element: ModeKeyElement, template: ModeKeyElement) {
    const {
      templateId,
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
      templateId,
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

    this.updateModeKey(element, newValues);

    this.save();
  }

  updateMartyria(
    element: MartyriaElement,
    newValues: Partial<MartyriaElement>,
  ) {
    this.commandService.execute(
      this.martyriaCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    this.save();
  }

  updateMartyriaFthora(element: MartyriaElement, fthora: Fthora) {
    this.updateMartyria(element, { fthora });
  }

  updateMartyriaMeasureBar(element: MartyriaElement, measureBar: MeasureBar) {
    this.updateMartyria(element, { measureBar });
  }

  updateMartyriaAlignRight(element: MartyriaElement, alignRight: boolean) {
    this.updateMartyria(element, { alignRight });
  }

  updateTempo(element: TempoElement, newValues: Partial<TempoElement>) {
    this.commandService.execute(
      this.tempoCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    this.save();
  }

  updateDropCapContent(element: DropCapElement, content: string) {
    // Replace newlines. This should only happen if the user pastes
    // text containing new lines.
    const sanitizedContent = content.replace(/(?:\r\n|\r|\n)/g, ' ');
    if (sanitizedContent !== content) {
      content = sanitizedContent;

      // Force the lyrics to re-render
      element.keyHelper++;
    }

    if (content === '') {
      const index = this.elements.indexOf(element);

      if (index > -1) {
        if (this.selectedElement === element) {
          this.selectedElement = null;
        }

        this.removeScoreElement(element);
      }
    } else if (element.content !== content) {
      this.commandService.execute(
        this.dropCapCommandFactory.create('update-properties', {
          target: element,
          newValues: { content },
        }),
      );
    }

    this.save();
  }

  deleteSelectedElement() {
    if (this.selectedElement && !this.isLastElement(this.selectedElement)) {
      const index = this.selectedElementIndex;

      this.removeScoreElement(this.selectedElement);

      this.selectedElement = this.elements[index];

      this.save();
    }
  }

  deletePreviousElement() {
    if (
      this.selectedElement &&
      this.selectedElementIndex > 0 &&
      this.navigableElements.includes(
        this.elements[this.selectedElementIndex - 1].elementType,
      )
    ) {
      this.removeScoreElement(this.elements[this.selectedElementIndex - 1]);

      this.save();
    }
  }

  updatePageSetup(pageSetup: PageSetup) {
    this.commandService.execute(
      this.pageSetupCommandFactory.create('update-properties', {
        target: this.score.pageSetup,
        newValues: pageSetup,
      }),
    );

    this.save();
  }

  updateEntryMode(mode: EntryMode) {
    this.entryMode = mode;
  }

  updateZoom(zoom: number) {
    this.zoom = zoom;
    this.zoomToFit = false;
  }

  updateZoomToFit(zoomToFit: boolean) {
    this.zoomToFit = zoomToFit;

    if (zoomToFit) {
      this.performZoomToFit();
    }
  }

  performZoomToFit() {
    const pageBackgroundElement = this.$refs['page-background'] as HTMLElement;

    const computedStyle = getComputedStyle(pageBackgroundElement);

    const availableWidth =
      pageBackgroundElement.clientWidth -
      parseFloat(computedStyle.paddingLeft) -
      parseFloat(computedStyle.paddingRight);

    this.zoom = availableWidth / this.score.pageSetup.pageWidth;
  }

  onFileMenuNewScore() {
    this.commandService.clearHistory();

    this.hasUnsavedChanges = false;
    this.currentFilePath = null;
    this.entryMode = EntryMode.Auto;
    this.score = this.createDefaultScore();
    this.selectedElement =
      this.score.staff.elements[this.score.staff.elements.length - 1];
    this.save(false);
  }

  onFileMenuOpenScore(args: FileMenuOpenScoreArgs) {
    try {
      this.commandService.clearHistory();

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
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        EventBus.$emit(IpcRendererChannels.ShowErrorBox, {
          title: 'Open failed',
          content: error.message,
        });
      }
    }
  }

  onFileMenuPageSetup() {
    this.pageSetupDialogIsOpen = true;
  }

  onFileMenuPrint() {
    EventBus.$emit(IpcRendererChannels.FileMenuPrintReply, {
      pageSize: this.score.pageSetup.pageSize,
      landscape: this.score.pageSetup.landscape,
    } as FileMenuPrintReplyArgs);
  }

  onFileMenuInsertTextBox() {
    const element = new TextBoxElement();

    this.addScoreElement(element, this.selectedElementIndex);

    this.selectedElement = element;
    this.elementToFocus = element;

    this.save();
  }

  onFileMenuInsertModeKey() {
    const element = this.createDefaultModeKey();

    this.addScoreElement(element, this.selectedElementIndex);

    this.selectedElement = element;

    this.openModeKeyDialog();

    this.save();
  }

  onFileMenuInsertDropCap() {
    this.addDropCap();
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
      this.commandService.clearHistory();
      this.currentFilePath = null;
      this.score = new Score();
      this.score.staff.elements.unshift(
        ...(TestFileGenerator.generateTestFile(testFileType) || []),
      );
      this.save();
    }
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
    title.fontSize = Unit.fromPt(20);

    score.staff.elements.unshift(title, this.createDefaultModeKey());

    return score;
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.lyrics {
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

  position: relative;
}

.empty-neume-box {
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
  min-width: 100%;
  text-align: center;
  position: absolute;
  white-space: nowrap;
}

.melisma {
  position: absolute;
  display: inline;
  overflow: hidden;
  white-space: pre;
}

.melisma.full {
  left: 0;
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

.page-break-2 {
  position: absolute;
  top: calc(-16px * var(--zoom, 1));
}

.page-break-2 img {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.line-break-2 {
  position: absolute;
  font-size: calc(16px * var(--zoom, 1));
  top: calc(-18px * var(--zoom, 1));
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
  .line-break,
  .page-break-2,
  .line-break-2 {
    display: none !important;
  }
}
</style>
