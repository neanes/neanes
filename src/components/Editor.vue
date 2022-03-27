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
        :pageSetup="score.pageSetup"
        @select-quantitative-neume="addQuantitativeNeume"
      ></NeumeSelector>
      <div class="page-container">
        <div class="workspace-tab-container" ref="workspace-tab-container">
          <div
            class="workspace-tab"
            :class="{ selected: workspace == selectedWorkspace }"
            v-for="(workspace, index) in workspaces"
            :key="`${index}-${workspace.filePath}`"
            :title="workspace.filePath"
            @click="selectedWorkspace = workspace"
          >
            <div class="workspace-tab-label">
              {{ getFileName(workspace) }}
            </div>
            <div
              class="workspace-tab-close-btn"
              @click.stop="closeWorkspace(workspace)"
            >
              X
            </div>
          </div>
        </div>
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
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <SyllableNeumeBox
                      class="syllable-box no-print"
                      :note="element"
                      :pageSetup="score.pageSetup"
                      :class="[{ selected: isSelected(element) }]"
                      @click.native.exact="selectedElement = element"
                      @click.native.shift.exact="setSelectionRange(element)"
                    ></SyllableNeumeBox>
                    <SyllableNeumeBoxPrint
                      class="syllable-box print-only"
                      :note="element"
                      :pageSetup="score.pageSetup"
                      :class="[{ selected: isSelected(element) }]"
                      @click.native.exact="selectedElement = element"
                      @click.native.shift.exact="setSelectionRange(element)"
                    ></SyllableNeumeBoxPrint>
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
                      <img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <MartyriaNeumeBox
                      :ref="`element-${getElementIndex(element)}`"
                      class="marytria-neume-box no-print"
                      :neume="element"
                      :pageSetup="score.pageSetup"
                      :class="[{ selected: isSelected(element) }]"
                      @click.native="selectedElement = element"
                    ></MartyriaNeumeBox>
                    <MartyriaNeumeBoxPrint
                      :ref="`element-${getElementIndex(element)}`"
                      class="marytria-neume-box print-only"
                      :neume="element"
                      :pageSetup="score.pageSetup"
                      :class="[{ selected: isSelected(element) }]"
                      @click.native="selectedElement = element"
                    ></MartyriaNeumeBoxPrint>
                    <div class="lyrics"></div>
                  </div>
                </template>
                <template v-if="isTempoElement(element)">
                  <div
                    :ref="`element-${getElementIndex(element)}`"
                    class="neume-box"
                  >
                    <span class="page-break" v-if="element.pageBreak">
                      <img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <TempoNeumeBox
                      class="tempo-neume-box"
                      :neume="element"
                      :pageSetup="score.pageSetup"
                      :class="[{ selected: isSelected(element) }]"
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
                      <img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <div
                      class="empty-neume-box"
                      :class="[{ selected: isSelected(element) }]"
                      :style="getEmptyBoxStyle(element)"
                      @click="selectedElement = element"
                    ></div>
                    <div class="lyrics"></div>
                  </div>
                </template>
                <template v-if="isTextBoxElement(element)">
                  <span class="page-break-2" v-if="element.pageBreak"
                    ><img src="@/assets/icons/page-break.svg"
                  /></span>
                  <span class="line-break-2" v-if="element.lineBreak"
                    ><img src="@/assets/icons/line-break.svg"
                  /></span>
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
                    ><img src="@/assets/icons/page-break.svg"
                  /></span>
                  <span class="line-break-2" v-if="element.lineBreak"
                    ><img src="@/assets/icons/line-break.svg"
                  /></span>
                  <ModeKey
                    class="no-print"
                    :ref="`element-${getElementIndex(element)}`"
                    :element="element"
                    :pageSetup="score.pageSetup"
                    :class="[{ selectedTextbox: element == selectedElement }]"
                    @click.native="selectedElement = element"
                    @dblclick.native="openModeKeyDialog"
                  >
                  </ModeKey>
                  <ModeKeyPrint
                    class="print-only"
                    :ref="`element-${getElementIndex(element)}`"
                    :element="element"
                    :pageSetup="score.pageSetup"
                    :class="[{ selectedTextbox: element == selectedElement }]"
                    @click.native="selectedElement = element"
                    @dblclick.native="openModeKeyDialog"
                  >
                  </ModeKeyPrint>
                </template>
                <template v-if="isDropCapElement(element)">
                  <span class="page-break" v-if="element.pageBreak"
                    ><img src="@/assets/icons/page-break.svg"
                  /></span>
                  <span class="line-break" v-if="element.lineBreak"
                    ><img src="@/assets/icons/line-break.svg"
                  /></span>
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
        @update:measureNumber="updateNoteMeasureNumber(selectedElement, $event)"
        @update:noteIndicator="updateNoteNoteIndicator(selectedElement, $event)"
        @update:ison="updateNoteIson(selectedElement, $event)"
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
  MeasureNumber,
  NoteIndicator,
  Ison,
} from '@/models/Neumes';
import { Page } from '@/models/Page';
import { Score } from '@/models/Score';
import { Workspace } from '@/models/Workspace';
import { EntryMode } from '@/models/EntryMode';
import { ScoreElementSelectionRange } from '@/models/ScoreElementSelectionRange';
import { SaveService } from '@/services/SaveService';
import { LayoutService } from '@/services/LayoutService';
import { IpcService } from '@/services/IpcService';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import SyllableNeumeBoxPrint from '@/components/NeumeBoxSyllablePrint.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import MartyriaNeumeBoxPrint from '@/components/NeumeBoxMartyriaPrint.vue';
import TempoNeumeBox from '@/components/NeumeBoxTempo.vue';
import NeumeSelector from '@/components/NeumeSelector.vue';
import ContentEditable from '@/components/ContentEditable.vue';
import TextBox from '@/components/TextBox.vue';
import DropCap from '@/components/DropCap.vue';
import ModeKey from '@/components/ModeKey.vue';
import ModeKeyPrint from '@/components/ModeKeyPrint.vue';
import TextToolbar from '@/components/TextToolbar.vue';
import ModeKeyToolbar from '@/components/ModeKeyToolbar.vue';
import MainToolbar from '@/components/MainToolbar.vue';
import NeumeToolbar from '@/components/NeumeToolbar.vue';
import MartyriaToolbar from '@/components/MartyriaToolbar.vue';
import ModeKeyDialog from '@/components/ModeKeyDialog.vue';
import PageSetupDialog from '@/components/PageSetupDialog.vue';
import { IpcMainChannels, FileMenuOpenScoreArgs } from '@/ipc/ipcChannels';
import { EventBus } from '@/eventBus';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { TestFileGenerator } from '@/utils/TestFileGenerator';
import { TestFileType } from '@/utils/TestFileType';
import { Unit } from '@/utils/Unit';
import { withZoom } from '@/utils/withZoom';
import { shallowEquals } from '@/utils/shallowEquals';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import { throttle } from 'throttle-debounce';
import { Command, CommandFactory } from '@/services/history/CommandService';
import { PageSetup } from '@/models/PageSetup';

@Component({
  components: {
    SyllableNeumeBox,
    SyllableNeumeBoxPrint,
    MartyriaNeumeBox,
    MartyriaNeumeBoxPrint,
    TempoNeumeBox,
    NeumeSelector,
    ContentEditable,
    TextBox,
    DropCap,
    ModeKey,
    ModeKeyPrint,
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

  workspaces: Workspace[] = [];
  selectedWorkspaceValue: Workspace = new Workspace();

  pages: Page[] = [];

  modeKeyDialogIsOpen: boolean = false;
  pageSetupDialogIsOpen: boolean = false;

  clipboard: ScoreElement[] = [];

  // Commands
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

  moveSelectionLeftThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.moveSelectionLeft,
  );

  moveSelectionRightThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.moveSelectionRight,
  );

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

  onCutScoreElementsThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.onCutScoreElements,
  );

  onCopyScoreElementsThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.onCopyScoreElements,
  );

  onPasteScoreElementsThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.onPasteScoreElements,
  );

  onWindowResizeThrottled = throttle(250, this.onWindowResize);

  get selectedWorkspace() {
    return this.selectedWorkspaceValue;
  }

  set selectedWorkspace(value: Workspace) {
    // Save the scroll position
    const pageBackgroundElement = this.$refs['page-background'] as HTMLElement;
    this.selectedWorkspace.scrollLeft = pageBackgroundElement.scrollLeft;
    this.selectedWorkspace.scrollTop = pageBackgroundElement.scrollTop;

    this.selectedWorkspaceValue = value;
    this.selectedWorkspace.commandService.notify();
    this.save(false);

    // Scroll to the new workspace's saved scroll position
    // Use nextTick to scroll after the DOM has refreshed
    Vue.nextTick(() => {
      pageBackgroundElement.scrollTo(
        this.selectedWorkspace.scrollLeft,
        this.selectedWorkspace.scrollTop,
      );
    });
  }

  get score() {
    return this.selectedWorkspace.score;
  }

  get elements() {
    return this.score != null ? this.score.staff.elements : [];
  }

  get commandService() {
    return this.selectedWorkspace.commandService;
  }

  get selectedElementIndex() {
    return this.selectedElement != null
      ? this.elements.indexOf(this.selectedElement)
      : -1;
  }

  get windowTitle() {
    return `${this.getFileName(this.selectedWorkspace)} - ${
      process.env.VUE_APP_TITLE
    }`;
  }

  get selectedElement() {
    return this.selectedWorkspace.selectedElement;
  }

  set selectedElement(element: ScoreElement | null) {
    if (element != null) {
      this.selectedLyrics = null;
      this.selectionRange = null;
    }

    this.selectedWorkspace.selectedElement = element;
  }

  get selectedLyrics() {
    return this.selectedWorkspace.selectedLyrics;
  }

  set selectedLyrics(element: NoteElement | null) {
    if (element != null) {
      this.selectedElement = null;
      this.selectionRange = null;
    }

    this.selectedWorkspace.selectedLyrics = element;
  }

  get selectionRange() {
    return this.selectedWorkspace.selectionRange;
  }

  set selectionRange(value: ScoreElementSelectionRange | null) {
    this.selectedWorkspace.selectionRange = value;
  }

  get zoom() {
    return this.selectedWorkspace.zoom;
  }

  set zoom(zoom: number) {
    if (zoom < 0.5) {
      zoom = 0.5;
    } else if (zoom > 2) {
      zoom = 2;
    }

    this.selectedWorkspace.zoom = zoom;
  }

  get zoomToFit() {
    return this.selectedWorkspace.zoomToFit;
  }

  set zoomToFit(value: boolean) {
    this.selectedWorkspace.zoomToFit = value;
  }

  get entryMode() {
    return this.selectedWorkspace.entryMode;
  }

  set entryMode(value: EntryMode) {
    this.selectedWorkspace.entryMode = value;
  }

  get currentFilePath() {
    return this.selectedWorkspace.filePath;
  }

  set currentFilePath(path: string | null) {
    this.selectedWorkspace.filePath = path;
  }

  get hasUnsavedChanges() {
    return this.selectedWorkspace.hasUnsavedChanges;
  }

  set hasUnsavedChanges(hasUnsavedChanges: boolean) {
    this.selectedWorkspace.hasUnsavedChanges = hasUnsavedChanges;
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

  get dialogOpen() {
    return this.modeKeyDialogIsOpen || this.pageSetupDialogIsOpen;
  }

  @Watch('zoom')
  onZoomUpdated() {
    document.documentElement.style.setProperty('--zoom', this.zoom.toString());
  }

  @Watch('currentFilePath')
  onFilePathUpdated() {
    window.document.title = this.windowTitle;
  }

  @Watch('hasUnsavedChanges')
  onUnsavedChangesUpdated() {
    window.document.title = this.windowTitle;
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

  untitledIndex: number = 1;

  getTempFilename() {
    return `Untitled-${this.untitledIndex++}`;
  }

  getFileName(workspace: Workspace) {
    const unsavedChangesMarker = workspace.hasUnsavedChanges ? '*' : '';

    if (workspace.filePath != null) {
      const fileName = getFileNameFromPath(workspace.filePath);
      return `${unsavedChangesMarker}${fileName}`;
    } else {
      return `${unsavedChangesMarker}${workspace.tempFileName}`;
    }
  }

  async created() {
    const fontLoader = (document as any).fonts;

    // Must load all fonts before loading any documents,
    // otherwise the text measurements will be wrong
    await Promise.all([
      fontLoader.load('1rem Athonite'),
      fontLoader.load('1rem Omega'),
      fontLoader.load('1rem PFGoudyInitials'),
      fontLoader.load('1rem Neanes'),
      fontLoader.ready,
    ]);

    await this.load();
  }

  mounted() {
    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('resize', this.onWindowResizeThrottled);

    EventBus.$on(IpcMainChannels.CloseApplication, this.onCloseApplication);

    EventBus.$on(IpcMainChannels.FileMenuNewScore, this.onFileMenuNewScore);
    EventBus.$on(IpcMainChannels.FileMenuOpenScore, this.onFileMenuOpenScore);
    EventBus.$on(IpcMainChannels.FileMenuPrint, this.onFileMenuPrint);
    EventBus.$on(IpcMainChannels.FileMenuSave, this.onFileMenuSave);
    EventBus.$on(IpcMainChannels.FileMenuSaveAs, this.onFileMenuSaveAs);
    EventBus.$on(IpcMainChannels.FileMenuPageSetup, this.onFileMenuPageSetup);
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsPdf,
      this.onFileMenuExportAsPdf,
    );
    EventBus.$on(IpcMainChannels.FileMenuUndo, this.onFileMenuUndo);
    EventBus.$on(IpcMainChannels.FileMenuRedo, this.onFileMenuRedo);
    EventBus.$on(IpcMainChannels.FileMenuCut, this.onFileMenuCut);
    EventBus.$on(IpcMainChannels.FileMenuCopy, this.onFileMenuCopy);
    EventBus.$on(IpcMainChannels.FileMenuPaste, this.onFileMenuPaste);
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

    EventBus.$off(IpcMainChannels.CloseApplication, this.onCloseApplication);

    EventBus.$off(IpcMainChannels.FileMenuNewScore, this.onFileMenuNewScore);
    EventBus.$off(IpcMainChannels.FileMenuOpenScore, this.onFileMenuOpenScore);
    EventBus.$off(IpcMainChannels.FileMenuPrint, this.onFileMenuPrint);
    EventBus.$off(IpcMainChannels.FileMenuSave, this.onFileMenuSave);
    EventBus.$off(IpcMainChannels.FileMenuSaveAs, this.onFileMenuSaveAs);
    EventBus.$off(IpcMainChannels.FileMenuPageSetup, this.onFileMenuPageSetup);
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsPdf,
      this.onFileMenuExportAsPdf,
    );
    EventBus.$off(IpcMainChannels.FileMenuUndo, this.onFileMenuUndo);
    EventBus.$off(IpcMainChannels.FileMenuRedo, this.onFileMenuRedo);
    EventBus.$off(IpcMainChannels.FileMenuCut, this.onFileMenuCut);
    EventBus.$off(IpcMainChannels.FileMenuCopy, this.onFileMenuCopy);
    EventBus.$off(IpcMainChannels.FileMenuPaste, this.onFileMenuPaste);
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

  getElementIndex(element: ScoreElement) {
    return this.elements.indexOf(element);
  }

  setSelectionRange(element: ScoreElement) {
    const elementIndex = this.getElementIndex(element);

    if (this.selectedElement != null) {
      this.selectionRange = {
        start: this.selectedElementIndex,
        end: elementIndex,
      };

      this.selectedElement = null;
    } else if (this.selectionRange != null) {
      this.selectionRange.end = elementIndex;
    }
  }

  isSelected(element: ScoreElement) {
    if (this.selectedElement === element) {
      return true;
    }
    if (this.selectionRange != null) {
      const start = Math.min(
        this.selectionRange.start,
        this.selectionRange.end,
      );
      const end = Math.max(this.selectionRange.start, this.selectionRange.end);

      return (
        start <= this.getElementIndex(element) &&
        this.getElementIndex(element) <= end
      );
    }

    return false;
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

  addQuantitativeNeume(
    quantitativeNeume: QuantitativeNeume,
    secondaryGorgonNeume: GorgonNeume | null = null,
  ) {
    if (this.selectedElement == null) {
      return;
    }

    const element = new NoteElement();
    element.quantitativeNeume = quantitativeNeume;
    // Special case for OligonPlusHyporoePlusKentemata
    if (
      quantitativeNeume === QuantitativeNeume.OligonPlusHyporoePlusKentemata
    ) {
      element.secondaryGorgonNeume = secondaryGorgonNeume;
    }

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
                secondaryGorgonNeume,
              });
            } else if (
              (this.selectedElement as NoteElement).secondaryGorgonNeume !==
              secondaryGorgonNeume
            ) {
              // Special case for hyporoe gorgon
              this.updateNote(this.selectedElement as NoteElement, {
                secondaryGorgonNeume,
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
              secondaryGorgonNeume,
            });
          } else if (
            (this.selectedElement as NoteElement).secondaryGorgonNeume !==
            secondaryGorgonNeume
          ) {
            // Special case for hyporoe gorgon
            this.updateNote(this.selectedElement as NoteElement, {
              secondaryGorgonNeume,
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
    this.save();

    Vue.nextTick(() => {
      const index = this.elements.indexOf(element);

      (this.$refs[`element-${index}`] as any)[0].focus();
    });
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

  focusLyrics(index: number, selectAll: boolean = false) {
    (this.$refs[`lyrics-${index}`] as ContentEditable[])[0].focus(selectAll);
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

  onWindowResize() {
    if (this.zoomToFit) {
      this.performZoomToFit();
    }
  }

  onKeydown(event: KeyboardEvent) {
    // Handle undo / redo
    // See https://github.com/electron/electron/issues/3682.
    if (
      (event.ctrlKey || event.metaKey) &&
      !this.isTextInputFocused() &&
      !this.dialogOpen
    ) {
      if (event.code === 'KeyZ') {
        this.onFileMenuUndoThrottled();
        event.preventDefault();
        return;
      } else if (event.code === 'KeyY') {
        this.onFileMenuRedoThrottled();
        event.preventDefault();
        return;
      } else if (event.code === 'KeyX') {
        this.onCutScoreElementsThrottled();
        event.preventDefault();
        return;
      } else if (event.code === 'KeyC') {
        this.onCopyScoreElementsThrottled();
        event.preventDefault();
        return;
      } else if (event.code === 'KeyV') {
        this.onPasteScoreElementsThrottled();
        event.preventDefault();
        return;
      }
    }

    if (this.selectedLyrics != null) {
      return this.onKeydownLyrics(event);
    }

    if (
      this.selectedElement != null &&
      this.selectedElement.elementType === ElementType.DropCap
    ) {
      return this.onKeydownDropCap(event);
    }

    if (!this.isTextInputFocused() && !this.dialogOpen) {
      return this.onKeydownNeume(event);
    }
  }

  onKeydownNeume(event: KeyboardEvent) {
    let handled = false;

    if (event.shiftKey) {
      switch (event.code) {
        case 'ArrowLeft':
          this.moveSelectionLeftThrottled();
          handled = true;
          break;
        case 'ArrowRight':
          this.moveSelectionRightThrottled();
          handled = true;
          break;
      }
    } else {
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

  onCutScoreElements() {
    if (this.selectionRange != null) {
      const start = Math.min(
        this.selectionRange.start,
        this.selectionRange.end,
      );

      const elementsToCut = this.elements.filter(
        (x) => x.elementType != ElementType.Empty && this.isSelected(x),
      );

      this.clipboard = elementsToCut.map((x) => x.clone());

      this.commandService.executeAsBatch(
        elementsToCut.map((element) =>
          this.scoreElementCommandFactory.create('remove-from-collection', {
            element,
            collection: this.elements,
          }),
        ),
      );

      this.selectedElement =
        this.elements[Math.min(start, this.elements.length - 1)];

      this.save();
    } else if (
      this.selectedElement != null &&
      this.selectedElement.elementType !== ElementType.Empty
    ) {
      const currentIndex = this.selectedElementIndex;

      this.clipboard = [this.selectedElement.clone()];

      this.removeScoreElement(this.selectedElement);

      this.selectedElement =
        this.elements[Math.min(currentIndex, this.elements.length - 1)];

      this.save();
    }
  }

  onCopyScoreElements() {
    if (this.selectionRange != null) {
      this.clipboard = this.elements
        .filter((x) => x.elementType != ElementType.Empty && this.isSelected(x))
        .map((x) => x.clone());
    } else if (
      this.selectedElement != null &&
      this.selectedElement.elementType !== ElementType.Empty
    ) {
      this.clipboard = [this.selectedElement.clone()];
    }
  }

  onPasteScoreElements() {
    if (this.clipboard.length > 0 && this.selectedElement != null) {
      switch (this.entryMode) {
        case EntryMode.Insert:
          this.onPasteScoreElementsInsert();
          break;
        case EntryMode.Auto:
          this.onPasteScoreElementsAuto();
          break;
        case EntryMode.Edit:
          this.onPasteScoreElementsEdit();
          break;
      }
    }
  }

  onPasteScoreElementsInsert() {
    if (this.selectedElement == null || this.clipboard.length === 0) {
      return;
    }

    const insertAtIndex = this.isLastElement(this.selectedElement)
      ? this.selectedElementIndex
      : this.selectedElementIndex + 1;

    const newElements = this.clipboard.map((x) => x.clone());

    this.addScoreElements(newElements, insertAtIndex);

    this.selectedElement = newElements.at(-1)!;
    this.save();
  }

  onPasteScoreElementsEdit() {
    if (this.selectedElement == null || this.clipboard.length === 0) {
      return;
    }

    const commands: Command[] = [];

    let currentIndex = this.selectedElementIndex;

    for (let clipboardElement of this.clipboard) {
      const currentElement = this.elements[currentIndex];

      if (currentIndex >= this.elements.length - 1) {
        commands.push(
          this.scoreElementCommandFactory.create('add-to-collection', {
            elements: [clipboardElement.clone()],
            collection: this.elements,
            insertAtIndex: currentIndex,
          }),
        );
      } else {
        if (currentElement.elementType === clipboardElement.elementType) {
          switch (currentElement.elementType) {
            case ElementType.Note:
              if (
                !shallowEquals(
                  (currentElement as NoteElement).getClipboardProperties(),
                  (clipboardElement as NoteElement).getClipboardProperties(),
                )
              ) {
                commands.push(
                  this.noteElementCommandFactory.create('update-properties', {
                    target: currentElement as NoteElement,
                    newValues: (
                      clipboardElement as NoteElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
            case ElementType.Tempo:
              if (
                !shallowEquals(
                  (currentElement as TempoElement).getClipboardProperties(),
                  (clipboardElement as TempoElement).getClipboardProperties(),
                )
              ) {
                commands.push(
                  this.tempoCommandFactory.create('update-properties', {
                    target: currentElement as TempoElement,
                    newValues: (
                      clipboardElement as TempoElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
            case ElementType.Martyria:
              if (
                !shallowEquals(
                  (currentElement as MartyriaElement).getClipboardProperties(),
                  (
                    clipboardElement as MartyriaElement
                  ).getClipboardProperties(),
                )
              ) {
                commands.push(
                  this.martyriaCommandFactory.create('update-properties', {
                    target: currentElement as MartyriaElement,
                    newValues: (
                      clipboardElement as MartyriaElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
            case ElementType.DropCap:
              if (
                !shallowEquals(
                  (currentElement as DropCapElement).getClipboardProperties(),
                  (clipboardElement as DropCapElement).getClipboardProperties(),
                )
              ) {
                commands.push(
                  this.dropCapCommandFactory.create('update-properties', {
                    target: currentElement as DropCapElement,
                    newValues: (
                      clipboardElement as DropCapElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
            case ElementType.ModeKey:
              if (
                !shallowEquals(
                  (currentElement as ModeKeyElement).getClipboardProperties(),
                  (clipboardElement as ModeKeyElement).getClipboardProperties(),
                )
              ) {
                commands.push(
                  this.modeKeyCommandFactory.create('update-properties', {
                    target: currentElement as ModeKeyElement,
                    newValues: (
                      clipboardElement as ModeKeyElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
            case ElementType.TextBox:
              if (
                !shallowEquals(
                  (currentElement as TextBoxElement).getClipboardProperties(),
                  (clipboardElement as TextBoxElement).getClipboardProperties(),
                )
              ) {
                commands.push(
                  this.textBoxCommandFactory.create('update-properties', {
                    target: currentElement as TextBoxElement,
                    newValues: (
                      clipboardElement as TextBoxElement
                    ).getClipboardProperties(),
                  }),
                );
              }
              break;
          }
        } else {
          commands.push(
            this.scoreElementCommandFactory.create(
              'replace-element-in-collection',
              {
                element: clipboardElement.clone(),
                collection: this.elements,
                replaceAtIndex: currentIndex,
              },
            ),
          );
        }
      }

      currentIndex++;
    }

    if (commands.length > 1) {
      this.commandService.executeAsBatch(commands);
    } else if (commands.length === 1) {
      this.commandService.execute(commands[0]);
    }

    this.save();
  }

  onPasteScoreElementsAuto() {
    this.moveRight();
    const currentIndex = this.selectedElementIndex;

    this.onPasteScoreElementsEdit();

    // Set the selected element to the last element that was pasted
    this.selectedElement =
      this.elements[currentIndex + this.clipboard.length - 1];
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
    let index = -1;

    if (this.selectedElement) {
      index = this.elements.indexOf(this.selectedElement);
    } else if (this.selectionRange) {
      index = this.selectionRange.end;
    }

    if (
      index - 1 >= 0 &&
      this.navigableElements.includes(this.elements[index - 1].elementType)
    ) {
      this.selectedElement = this.elements[index - 1];
    }
  }

  moveRight() {
    let index = -1;

    if (this.selectedElement) {
      index = this.elements.indexOf(this.selectedElement);
    } else if (this.selectionRange) {
      index = this.selectionRange.end;
    }

    if (
      index >= 0 &&
      index + 1 < this.elements.length &&
      this.navigableElements.includes(this.elements[index + 1].elementType)
    ) {
      this.selectedElement = this.elements[index + 1];
      return true;
    }

    return false;
  }

  moveSelectionLeft() {
    if (this.selectionRange != null) {
      if (
        this.selectionRange.end > 0 &&
        this.navigableElements.includes(
          this.elements[this.selectionRange.end - 1].elementType,
        )
      ) {
        this.setSelectionRange(this.elements[this.selectionRange.end - 1]);
      }
    } else if (
      this.selectedElement != null &&
      this.selectedElementIndex > 0 &&
      this.navigableElements.includes(
        this.elements[this.selectedElementIndex - 1].elementType,
      )
    ) {
      this.setSelectionRange(this.elements[this.selectedElementIndex - 1]);
    }
  }

  moveSelectionRight() {
    if (this.selectionRange != null) {
      if (
        this.selectionRange.end + 1 < this.elements.length - 1 &&
        this.navigableElements.includes(
          this.elements[this.selectionRange.end + 1].elementType,
        )
      ) {
        this.setSelectionRange(this.elements[this.selectionRange.end + 1]);
      }
    } else if (
      this.selectedElement != null &&
      this.selectedElementIndex + 1 < this.elements.length - 1 &&
      this.navigableElements.includes(
        this.elements[this.selectedElementIndex + 1].elementType,
      )
    ) {
      this.setSelectionRange(this.elements[this.selectedElementIndex + 1]);
    }
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
      this.focusLyrics(nextIndex, true);
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
        this.focusLyrics(nextIndex, true);
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

  async load() {
    // First, try to load files passed in on the command line.
    // If there are none, then create a default workspace.
    const openWorkspaceResults = await IpcService.openWorkspaceFromArgv();

    openWorkspaceResults
      .filter((x) => x.success)
      .forEach((x) => this.openScore(x));

    if (openWorkspaceResults.some((x) => x.success)) {
      return;
    }

    const workspace = new Workspace();
    workspace.tempFileName = this.getTempFilename();
    workspace.score = this.createDefaultScore();

    this.workspaces.push(workspace);

    if (this.isDevelopment) {
      const scoreString = localStorage.getItem('score');

      if (scoreString) {
        const score: Score = SaveService.LoadScoreFromJson(
          JSON.parse(scoreString),
        );
        this.currentFilePath = localStorage.getItem('filePath');
        this.hasUnsavedChanges =
          localStorage.getItem('hasUnsavedChanges') === 'true';

        workspace.score = score;
      }
    }

    this.selectedWorkspace = workspace;

    this.selectedElement =
      this.score.staff.elements[this.score.staff.elements.length - 1];

    this.pages = LayoutService.processPages(
      this.elements,
      this.score.pageSetup,
    );
  }

  async closeWorkspace(workspace: Workspace) {
    let shouldClose = true;

    if (workspace.hasUnsavedChanges) {
      const fileName =
        workspace.filePath != null
          ? getFileNameFromPath(workspace.filePath)
          : workspace.tempFileName;

      const dialogResult = await IpcService.showMessageBox({
        title: process.env.VUE_APP_TITLE,
        message: `Do you want to save the changes you made to ${fileName}?`,
        detail: "Your changes will be lost if you don't save them.",
        type: 'warning',
        buttons: ['Save', "Don't Save", 'Cancel'],
      });

      if (dialogResult.response === 0) {
        // User chose "Save"
        const saveResult =
          workspace.filePath != null
            ? await IpcService.saveWorkspace(workspace)
            : await IpcService.saveWorkspaceAs(workspace);

        // If they successfully saved, then we can close the workspacce
        shouldClose = saveResult.success;
      } else if (dialogResult.response === 2) {
        // User chose "Cancel", so don't close the workspace.
        shouldClose = false;
      }
    }

    if (shouldClose) {
      // If the last tab has closed, then exit
      if (this.workspaces.length == 1) {
        IpcService.exitApplication();
      }

      const index = this.workspaces.indexOf(workspace);

      this.workspaces.splice(index, 1);

      if (this.selectedWorkspace === workspace) {
        this.selectedWorkspace =
          this.workspaces[Math.min(index, this.workspaces.length - 1)];
      }
    }

    return shouldClose;
  }

  async onCloseApplication() {
    // Give the user a chance to save their changes before exiting
    const unsavedWorkspaces = this.workspaces.filter(
      (x) => x.hasUnsavedChanges,
    );

    for (let workspace of unsavedWorkspaces) {
      if (!(await this.closeWorkspace(workspace))) {
        return false;
      }
    }

    await IpcService.exitApplication();
  }

  addScoreElement(element: ScoreElement, insertAtIndex?: number) {
    this.commandService.execute(
      this.scoreElementCommandFactory.create('add-to-collection', {
        elements: [element],
        collection: this.elements,
        insertAtIndex,
      }),
    );
  }

  addScoreElements(elements: ScoreElement[], insertAtIndex?: number) {
    this.commandService.execute(
      this.scoreElementCommandFactory.create('add-to-collection', {
        elements,
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

  updateNoteMeasureNumber(element: NoteElement, measureNumber: MeasureNumber) {
    this.updateNote(element, { measureNumber });
  }

  updateNoteNoteIndicator(element: NoteElement, noteIndicator: NoteIndicator) {
    this.updateNote(element, { noteIndicator });
  }

  updateNoteIson(element: NoteElement, ison: Ison) {
    this.updateNote(element, { ison });
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
      martyria,
      fthoraAboveNote,
      fthoraAboveNote2,
      fthoraAboveQuantitativeNeumeRight,
      note,
      note2,
      quantitativeNeumeAboveNote,
      quantitativeNeumeAboveNote2,
      quantitativeNeumeRight,
    } = template;

    const newValues = {
      templateId,
      mode,
      scale,
      scaleNote,
      martyria,
      fthoraAboveNote,
      fthoraAboveNote2,
      fthoraAboveQuantitativeNeumeRight,
      note,
      note2,
      quantitativeNeumeAboveNote,
      quantitativeNeumeAboveNote2,
      quantitativeNeumeRight,
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
    if (
      this.selectedElement != null &&
      !this.isLastElement(this.selectedElement)
    ) {
      const index = this.selectedElementIndex;

      this.removeScoreElement(this.selectedElement);

      this.selectedElement = this.elements[index];

      this.save();
    } else if (this.selectionRange != null) {
      const elementsToDelete = this.elements.filter(
        (x) => x.elementType != ElementType.Empty && this.isSelected(x),
      );

      this.commandService.executeAsBatch(
        elementsToDelete.map((element) =>
          this.scoreElementCommandFactory.create('remove-from-collection', {
            element,
            collection: this.elements,
          }),
        ),
      );

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
    const workspace = new Workspace();
    workspace.tempFileName = this.getTempFilename();
    workspace.score = this.createDefaultScore();

    this.workspaces.push(workspace);

    this.selectedWorkspace = workspace;

    this.selectedElement =
      this.score.staff.elements[this.score.staff.elements.length - 1];
    this.save(false);

    Vue.nextTick(() => {
      const tabContainerElement = this.$refs[
        'workspace-tab-container'
      ] as HTMLElement;

      tabContainerElement.scrollTo(tabContainerElement.scrollWidth, 0);
    });
  }

  async onFileMenuOpenScore(args: FileMenuOpenScoreArgs) {
    if (!this.dialogOpen && args.success) {
      this.openScore(args);
    }
  }

  onFileMenuPageSetup() {
    this.pageSetupDialogIsOpen = true;
  }

  async onFileMenuPrint() {
    await IpcService.printWorkspace(this.selectedWorkspace);
  }

  async onFileMenuExportAsPdf() {
    await IpcService.exportWorkspaceAsPdf(this.selectedWorkspace);
  }

  onFileMenuInsertTextBox() {
    const element = new TextBoxElement();

    this.addScoreElement(element, this.selectedElementIndex);

    this.selectedElement = element;

    this.save();

    Vue.nextTick(() => {
      const index = this.elements.indexOf(element);

      (this.$refs[`element-${index}`] as any)[0].focus();
    });
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

  async onFileMenuSave() {
    const workspace = this.selectedWorkspace;

    if (workspace.filePath != null) {
      const result = await IpcService.saveWorkspace(workspace);
      if (result.success) {
        workspace.hasUnsavedChanges = false;
      }
    } else {
      const result = await IpcService.saveWorkspaceAs(workspace);
      if (result.success) {
        workspace.filePath = result.filePath;
        workspace.hasUnsavedChanges = false;
      }
    }
  }

  async onFileMenuSaveAs() {
    const workspace = this.selectedWorkspace;

    const result = await IpcService.saveWorkspaceAs(workspace);
    if (result.success) {
      workspace.filePath = result.filePath;
      workspace.hasUnsavedChanges = false;
    }
  }

  onFileMenuUndo() {
    const currentIndex = this.selectedElementIndex;

    this.commandService.undo();

    // If the selected element was removed during the undo process, choose a new one
    this.selectedElement =
      this.elements[Math.min(currentIndex, this.elements.length - 1)];

    this.save();
  }

  onFileMenuRedo() {
    const currentIndex = this.selectedElementIndex;

    this.commandService.redo();

    // If the selected element was removed during the redo process, choose a new one
    this.selectedElement =
      this.elements[Math.min(currentIndex, this.elements.length - 1)];

    this.save();
  }

  onFileMenuCut() {
    if (!this.isTextInputFocused() && !this.dialogOpen) {
      this.onCutScoreElements();
    } else {
      document.execCommand('cut');
    }
  }

  onFileMenuCopy() {
    if (!this.isTextInputFocused() && !this.dialogOpen) {
      this.onCopyScoreElements();
    } else {
      document.execCommand('copy');
    }
  }

  onFileMenuPaste() {
    if (!this.isTextInputFocused() && !this.dialogOpen) {
      this.onPasteScoreElements();
    } else {
      document.execCommand('paste');
    }
  }

  onFileMenuGenerateTestFile(testFileType: TestFileType) {
    const workspace = new Workspace();
    workspace.tempFileName = this.getTempFilename();
    workspace.score = new Score();

    this.workspaces.push(workspace);

    this.selectedWorkspace = workspace;

    this.currentFilePath = null;
    this.score.staff.elements.unshift(
      ...(TestFileGenerator.generateTestFile(testFileType) || []),
    );
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
    title.fontSize = Unit.fromPt(20);

    score.staff.elements.unshift(title, this.createDefaultModeKey());

    return score;
  }

  openScore(args: FileMenuOpenScoreArgs) {
    if (!args.success) {
      return;
    }

    // First make sure we don't already have the score open
    const existingWorkspace = this.workspaces.find(
      (x) => x.filePath === args.filePath,
    );
    if (existingWorkspace != null) {
      this.selectedWorkspace = existingWorkspace;
      return;
    }

    try {
      const score: Score = SaveService.LoadScoreFromJson(JSON.parse(args.data));

      // if (score.version !== ScoreVersion) {
      //   alert('This score was created by an older version of the application. It may not work properly');
      // }

      const workspace = new Workspace();
      workspace.filePath = args.filePath;
      workspace.tempFileName = this.getTempFilename();
      workspace.score = score;
      workspace.entryMode = EntryMode.Edit;

      this.workspaces.push(workspace);

      this.selectedWorkspace = workspace;

      this.selectedElement = null;

      this.save(false);

      Vue.nextTick(() => {
        const tabContainerElement = this.$refs[
          'workspace-tab-container'
        ] as HTMLElement;

        tabContainerElement.scrollTo(tabContainerElement.scrollWidth, 0);
      });
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        IpcService.showMessageBox({
          type: 'error',
          title: 'Open failed',
          message: error.message,
        });
      }
    }
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

.neume-box .selected {
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

.page-container {
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex: 1;
}

.workspace-tab-container {
  display: flex;
  overflow: hidden;
  background-color: #b5b5b5;
}

.workspace-tab-container:hover {
  overflow-x: auto;
}

.workspace-tab {
  display: flex;
  align-items: center;
  cursor: default;
  white-space: nowrap;
  border-right: 1px solid black;
  padding: 0.5rem 1rem;
  padding-right: 0.5rem;
  background-color: #c0c0c0;
}

.workspace-tab:last-child {
  border-right: none;
}

.workspace-tab.selected {
  background-color: lightgray;
}

.workspace-tab-label {
  margin-right: 0.75rem;
}

.workspace-tab-close-btn {
  margin-left: auto;
  font-family: Arial;
  font-size: 0.75rem;
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

/* .neume {
  display: flex;
} */

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
  top: calc(-10px * var(--zoom, 1));
}

.line-break img {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
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
  top: calc(-18px * var(--zoom, 1));
}

.line-break-2 img {
  height: calc(16px * var(--zoom, 1));
  width: calc(16px * var(--zoom, 1));
}

.print-only {
  display: none;
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

  .no-print {
    display: none !important;
  }

  .print-only {
    display: block;
  }
}
</style>
