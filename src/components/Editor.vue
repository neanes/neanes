<template>
  <div class="editor">
    <div class="loading-overlay" v-if="isLoading">
      <img src="@/assets/icons/spinner.svg" />
    </div>
    <FileMenuBar v-if="showFileMenuBar" />
    <ToolbarMain
      :entryMode="entryMode"
      :zoom="zoom"
      :zoomToFit="zoomToFit"
      :audioState="audioService.state"
      :audioOptions="audioOptions"
      @update:zoom="updateZoom"
      @update:zoomToFit="updateZoomToFit"
      @update:audioOptionsSpeed="updateAudioOptionsSpeed"
      @add-auto-martyria="addAutoMartyria"
      @update:entryMode="updateEntryMode"
      @toggle-page-break="togglePageBreak"
      @toggle-line-break="toggleLineBreak($event)"
      @add-tempo="addTempo"
      @add-drop-cap="addDropCap(false)"
      @delete-selected-element="deleteSelectedElement"
      @click.native="selectedLyrics = null"
      @play-audio="playAudio"
      @open-playback-settings="openPlaybackSettingsDialog"
    />
    <div class="content">
      <NeumeSelector
        class="neume-selector"
        :pageSetup="score.pageSetup"
        @select-quantitative-neume="addQuantitativeNeume"
      />
      <div class="page-container">
        <div class="workspace-tab-container" ref="workspace-tab-container">
          <div class="workspace-tab-new-button" @click="onFileMenuNewScore">
            +
          </div>
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
            v-observe-visibility="{
              callback: (isVisible) => updatePageVisibility(page, isVisible),
              intersection: pageVisibilityIntersection,
            }"
            v-for="(page, pageIndex) in filteredPages"
            :key="`page-${pageIndex}`"
            :ref="`page-${pageIndex}`"
          >
            <template v-if="page.isVisible || printMode">
              <template v-if="showGuides">
                <span class="guide-line-vl" :style="guideStyleLeft" />
                <span class="guide-line-vr" :style="guideStyleRight" />
                <span class="guide-line-ht" :style="guideStyleTop" />
                <span class="guide-line-hb" :style="guideStyleBottom" />
              </template>
              <template v-if="score.pageSetup.showHeader">
                <TextBox
                  class="element-box"
                  :ref="`header-${pageIndex}`"
                  :element="getHeaderForPageIndex(pageIndex)"
                  :editMode="
                    getHeaderForPageIndex(pageIndex) ==
                    selectedHeaderFooterElement
                  "
                  :metadata="getTokenMetadata(pageIndex)"
                  :class="[
                    {
                      selectedTextbox:
                        getHeaderForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement,
                    },
                  ]"
                  :style="headerStyle"
                  @click.native="
                    selectedHeaderFooterElement =
                      getHeaderForPageIndex(pageIndex)
                  "
                  @update:content="
                    updateTextBoxContent(
                      getHeaderForPageIndex(pageIndex),
                      $event,
                    )
                  "
                />
              </template>
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
                        ><img
                          v-if="element.justify"
                          src="@/assets/icons/line-break-justify.svg" /><img
                          v-else
                          src="@/assets/icons/line-break.svg"
                      /></span>
                      <SyllableNeumeBox
                        class="syllable-box"
                        :note="element"
                        :pageSetup="score.pageSetup"
                        :class="[
                          {
                            selected: isSelected(element),
                            'audio-selected': isAudioSelected(element),
                            'no-print': isBrowser,
                          },
                        ]"
                        @click.native.exact="selectedElement = element"
                        @click.native.shift.exact="setSelectionRange(element)"
                      />
                      <SyllableNeumeBoxPrint
                        v-if="isBrowser && printMode"
                        class="syllable-box print-only"
                        :note="element"
                        :pageSetup="score.pageSetup"
                      />
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
                          @blur="
                            updateLyrics(element, $event);
                            selectedLyrics = null;
                          "
                        />
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
                        class="marytria-neume-box"
                        :neume="element"
                        :pageSetup="score.pageSetup"
                        :class="[
                          {
                            selected: isSelected(element),
                            'no-print': isBrowser,
                          },
                        ]"
                        @click.native="selectedElement = element"
                      />
                      <MartyriaNeumeBoxPrint
                        v-if="isBrowser && printMode"
                        class="marytria-neume-box print-only"
                        :neume="element"
                        :pageSetup="score.pageSetup"
                      />
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
                      />
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
                      :editMode="true"
                      :metadata="getTokenMetadata(pageIndex)"
                      :class="[
                        { selectedTextbox: element === selectedElement },
                      ]"
                      @click.native="selectedElement = element"
                      @update:content="updateTextBoxContent(element, $event)"
                    />
                  </template>
                  <template v-if="isModeKeyElement(element)">
                    <span class="page-break-2" v-if="element.pageBreak"
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break-2" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <ModeKey
                      :ref="`element-${getElementIndex(element)}`"
                      :element="element"
                      :pageSetup="score.pageSetup"
                      :class="[
                        {
                          selectedTextbox: element === selectedElement,
                          'no-print': isBrowser,
                        },
                      ]"
                      @click.native="selectedElement = element"
                      @dblclick.native="openModeKeyDialog"
                    />
                    <ModeKeyPrint
                      v-if="isBrowser && printMode"
                      class="print-only"
                      :element="element"
                      :pageSetup="score.pageSetup"
                    />
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
                      @update:content="updateDropCapContent(element, $event)"
                    />
                  </template>
                </div>
              </div>
              <template v-if="score.pageSetup.showFooter">
                <TextBox
                  class="element-box"
                  :ref="`footer-${pageIndex}`"
                  :element="getFooterForPageIndex(pageIndex)"
                  :editMode="
                    getFooterForPageIndex(pageIndex) ==
                    selectedHeaderFooterElement
                  "
                  :metadata="getTokenMetadata(pageIndex)"
                  :class="[
                    {
                      selectedTextbox:
                        getFooterForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement,
                    },
                  ]"
                  :style="footerStyle"
                  @click.native="
                    selectedHeaderFooterElement =
                      getFooterForPageIndex(pageIndex)
                  "
                  @update:content="
                    updateTextBoxContent(
                      getFooterForPageIndex(pageIndex),
                      $event,
                    )
                  "
                />
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
    <template v-if="selectedTextBoxElement">
      <ToolbarTextBox
        :element="selectedTextBoxElement"
        :fonts="fonts"
        @update:useDefaultStyle="
          updateTextBoxUseDefaultStyle(selectedTextBoxElement, $event)
        "
        @update:fontSize="updateTextBoxFontSize(selectedTextBoxElement, $event)"
        @update:fontFamily="
          updateTextBoxFontFamily(selectedTextBoxElement, $event)
        "
        @update:strokeWidth="
          updateTextBoxStrokeWidth(selectedTextBoxElement, $event)
        "
        @update:alignment="
          updateTextBoxAlignment(selectedTextBoxElement, $event)
        "
        @update:color="updateTextBoxColor(selectedTextBoxElement, $event)"
        @update:inline="updateTextBoxInline(selectedTextBoxElement, $event)"
        @update:bold="updateTextBoxBold(selectedTextBoxElement, $event)"
        @update:italic="updateTextBoxItalic(selectedTextBoxElement, $event)"
        @update:underline="
          updateTextBoxUnderline(selectedTextBoxElement, $event)
        "
        @insert:gorthmikon="insertGorthmikon"
        @insert:pelastikon="insertPelastikon"
      />
    </template>
    <template v-if="selectedLyrics != null">
      <ToolbarLyrics
        :element="selectedLyrics"
        @insert:gorthmikon="insertGorthmikon"
        @insert:pelastikon="insertPelastikon"
      />
    </template>
    <template
      v-if="selectedElement != null && isModeKeyElement(selectedElement)"
    >
      <ToolbarModeKey
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:useDefaultStyle="
          updateModeKeyUseDefaultStyle(selectedElement, $event)
        "
        @update:fontSize="updateModeKeyFontSize(selectedElement, $event)"
        @update:strokeWidth="updateModeKeyStrokeWidth(selectedElement, $event)"
        @update:alignment="updateModeKeyAlignment(selectedElement, $event)"
        @update:color="updateModeKeyColor(selectedElement, $event)"
        @update:bpm="updateModeKeyBpm(selectedElement, $event)"
        @update:ignoreAttractions="
          updateModeKeyIgnoreAttractions(selectedElement, $event)
        "
        @update:tempoAlignRight="
          updateModeKeyTempoAlignRight(selectedElement, $event)
        "
        @update:tempo="setModeKeyTempo(selectedElement, $event)"
        @update:heightAdjustment="
          updateModeKeyHeightAdjustment(selectedElement, $event)
        "
        @update:permanentEnharmonicZo="
          updateModeKeyPermanentEnharmonicZo(selectedElement, $event)
        "
        @open-mode-key-dialog="openModeKeyDialog"
      />
    </template>
    <template
      v-if="selectedElement != null && isSyllableElement(selectedElement)"
    >
      <ToolbarNeume
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:accidental="setAccidental(selectedElement, $event)"
        @update:fthora="setFthoraNote(selectedElement, $event)"
        @update:chromaticFthoraNote="
          updateNoteChromaticFthoraNote(selectedElement, $event)
        "
        @update:gorgon="setGorgon(selectedElement, $event)"
        @update:klasma="setKlasma(selectedElement)"
        @update:time="setTimeNeume(selectedElement, $event)"
        @update:expression="setVocalExpression(selectedElement, $event)"
        @update:measureBar="setMeasureBarNote(selectedElement, $event)"
        @update:measureNumber="setMeasureNumber(selectedElement, $event)"
        @update:noteIndicator="updateNoteNoteIndicator(selectedElement, $event)"
        @update:ison="setIson(selectedElement, $event)"
        @update:vareia="updateNoteVareia(selectedElement, $event)"
        @update:spaceAfter="updateNoteSpaceAfter(selectedElement, $event)"
        @update:ignoreAttractions="
          updateNoteIgnoreAttractions(selectedElement, $event)
        "
        @open-syllable-positioning-dialog="openSyllablePositioningDialog"
      />
    </template>
    <template
      v-if="selectedElement != null && isMartyriaElement(selectedElement)"
    >
      <ToolbarMartyria
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:fthora="setFthoraMartyria(selectedElement, $event)"
        @update:chromaticFthoraNote="
          updateMartyriaChromaticFthoraNote(selectedElement, $event)
        "
        @update:tempo="setMartyriaTempo(selectedElement, $event)"
        @update:measureBar="setMeasureBarMartyria(selectedElement, $event)"
        @update:alignRight="updateMartyriaAlignRight(selectedElement, $event)"
        @update:auto="updateMartyriaAuto(selectedElement, $event)"
        @update:note="updateMartyriaNote(selectedElement, $event)"
        @update:scale="updateMartyriaScale(selectedElement, $event)"
        @update:bpm="updateMartyriaBpm(selectedElement, $event)"
        @update:spaceAfter="updateMartyriaSpaceAfter(selectedElement, $event)"
      />
    </template>
    <template v-if="selectedElement != null && isTempoElement(selectedElement)">
      <ToolbarTempo
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:bpm="updateTempoBpm(selectedElement, $event)"
        @update:spaceAfter="updateTempoSpaceAfter(selectedElement, $event)"
      />
    </template>
    <ModeKeyDialog
      v-if="modeKeyDialogIsOpen"
      :element="selectedElement"
      :pageSetup="score.pageSetup"
      @update="updateModeKeyFromTemplate(selectedElement, $event)"
      @close="closeModeKeyDialog"
    />
    <SyllablePositioningDialog
      v-if="syllablePositioningDialogIsOpen"
      :element="selectedElement"
      :pageSetup="score.pageSetup"
      @update="updateNoteAndSave(selectedElement, $event)"
      @close="closeSyllablePositioningDialog"
    />
    <PlaybackSettingsDialog
      v-if="playbackSettingsDialogIsOpen"
      :options="audioOptions"
      @close="closePlaybackSettingsDialog"
      @play-test-tone="playTestTone"
    />
    <EditorPreferencesDialog
      v-if="editorPreferencesDialogIsOpen"
      :options="editorPreferences"
      :pageSetup="score.pageSetup"
      @close="closeEditorPreferencesDialog"
    />
    <PageSetupDialog
      v-if="pageSetupDialogIsOpen"
      :pageSetup="score.pageSetup"
      :fonts="fonts"
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
  Ison,
  Note,
} from '@/models/Neumes';
import { Page } from '@/models/Page';
import { Score } from '@/models/Score';
import { Workspace, WorkspaceLocalStorage } from '@/models/Workspace';
import { EntryMode } from '@/models/EntryMode';
import { ScoreElementSelectionRange } from '@/models/ScoreElementSelectionRange';
import { SaveService } from '@/services/SaveService';
import { LayoutService } from '@/services/LayoutService';
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
import ToolbarTextBox from '@/components/ToolbarTextBox.vue';
import ToolbarLyrics from '@/components/ToolbarLyrics.vue';
import ToolbarModeKey from '@/components/ToolbarModeKey.vue';
import ToolbarMain from '@/components/ToolbarMain.vue';
import ToolbarNeume from '@/components/ToolbarNeume.vue';
import ToolbarMartyria from '@/components/ToolbarMartyria.vue';
import ToolbarTempo from '@/components/ToolbarTempo.vue';
import ModeKeyDialog from '@/components/ModeKeyDialog.vue';
import SyllablePositioningDialog from '@/components/SyllablePositioningDialog.vue';
import PlaybackSettingsDialog from '@/components/PlaybackSettingsDialog.vue';
import EditorPreferencesDialog from '@/components/EditorPreferencesDialog.vue';
import PageSetupDialog from '@/components/PageSetupDialog.vue';
import FileMenuBar from '@/components/FileMenuBar.vue';
import {
  IpcMainChannels,
  FileMenuOpenScoreArgs,
  ShowMessageBoxReplyArgs,
  FileMenuInsertTextboxArgs,
} from '@/ipc/ipcChannels';
import { EventBus } from '@/eventBus';
import { modeKeyTemplates } from '@/models/ModeKeys';
import { TestFileGenerator } from '@/utils/TestFileGenerator';
import { TestFileType } from '@/utils/TestFileType';
import { Unit } from '@/utils/Unit';
import { withZoom } from '@/utils/withZoom';
import { shallowEquals } from '@/utils/shallowEquals';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import { getCursorPosition } from '@/utils/getCursorPosition';
import { throttle } from 'throttle-debounce';
import { Command, CommandFactory } from '@/services/history/CommandService';
import { IIpcService } from '@/services/ipc/IIpcService';
import { PageSetup } from '@/models/PageSetup';
import { Header } from '@/models/Header';
import { Footer } from '@/models/Footer';
import { TokenMetadata } from '@/utils/replaceTokens';
import { Scale, ScaleNote } from '@/models/Scales';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { IPlatformService } from '@/services/platform/IPlatformService';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import {
  areVocalExpressionsEquivalent,
  onlyTakesBottomKlasma,
  onlyTakesTopGorgon,
  onlyTakesTopKlasma,
} from '@/models/NeumeReplacements';

import {
  AudioService,
  AudioServiceEventNames,
  AudioState,
} from '@/services/audio/AudioService';

import {
  PlaybackOptions,
  PlaybackSequenceEvent,
  PlaybackService,
} from '@/services/audio/PlaybackService';

export interface EditorPreferences {
  tempoDefaults: { [key in TempoSign]?: number };
}

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
    ToolbarTextBox,
    ToolbarLyrics,
    ToolbarModeKey,
    ToolbarNeume,
    ToolbarMartyria,
    ToolbarTempo,
    ToolbarMain,
    ModeKeyDialog,
    SyllablePositioningDialog,
    PlaybackSettingsDialog,
    EditorPreferencesDialog,
    PageSetupDialog,
    FileMenuBar,
  },
})
export default class Editor extends Vue {
  @Prop() ipcService!: IIpcService;
  @Prop() platformService!: IPlatformService;
  @Prop() showFileMenuBar!: boolean;

  isDevelopment: boolean = process.env.NODE_ENV !== 'production';
  isBrowser: boolean = process.env.IS_ELECTRON == null;

  isLoading: boolean = true;

  printMode: boolean = false;

  showGuides: boolean = false;

  workspaces: Workspace[] = [];
  selectedWorkspaceValue: Workspace = new Workspace();

  pages: Page[] = [];

  modeKeyDialogIsOpen: boolean = false;
  syllablePositioningDialogIsOpen: boolean = false;
  playbackSettingsDialogIsOpen: boolean = false;
  pageSetupDialogIsOpen: boolean = false;
  editorPreferencesDialogIsOpen: boolean = false;

  clipboard: ScoreElement[] = [];

  fonts: string[] = [];

  neumeKeyboard: NeumeKeyboard = new NeumeKeyboard();
  keyboardModifier: string | null = null;

  audioService = new AudioService();
  playbackService = new PlaybackService();

  audioElement: ScoreElement | null = null;
  playbackEvents: PlaybackSequenceEvent[] = [];
  audioOptions: PlaybackOptions = {
    useLegetos: false,
    useDefaultAttractionZo: true,
    frequencyDi: 196,
    speed: 1,

    diatonicIntervals: [12, 10, 8],
    hardChromaticIntervals: [6, 20, 4],
    softChromaticIntervals: [8, 14, 8],
    legetosIntervals: [6, 9, 15],
    zygosIntervals: [18, 4, 16, 4],
    zygosLegetosIntervals: [18, 4, 20, 4],
    spathiIntervals: [20, 4, 4, 14],
    klitonIntervals: [14, 12, 4],

    generalFlatMoria: -6,
    generalSharpMoria: 4,

    defaultAttractionZoMoria: -4,

    volumeIson: -4,
    volumeMelody: 0,

    alterationMoriaMap: {
      [Accidental.Flat_2_Right]: -2,
      [Accidental.Flat_4_Right]: -4,
      [Accidental.Flat_6_Right]: -6,
      [Accidental.Flat_8_Right]: -8,
      [Accidental.Sharp_2_Left]: 2,
      [Accidental.Sharp_4_Left]: 4,
      [Accidental.Sharp_6_Left]: 6,
      [Accidental.Sharp_8_Left]: 8,
    },
  };

  editorPreferences: EditorPreferences = {
    tempoDefaults: {
      [TempoSign.VerySlow]: 40, // < 56 triargon?
      [TempoSign.Slower]: 56, // 56 - 80 diargon
      [TempoSign.Slow]: 80, // 80 - 100 hemiolion
      [TempoSign.Moderate]: 100, // 100 - 168 argon
      [TempoSign.Medium]: 130, // 130 argon + gorgon
      [TempoSign.Quick]: 168, // 168 - 208 gorgon
      [TempoSign.Quicker]: 208, // 208+ digorgon
      [TempoSign.VeryQuick]: 250, // unattested? trigorgon
    },
  };

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

  headerCommandFactory: CommandFactory<Header> = new CommandFactory<Header>();

  footerCommandFactory: CommandFactory<Footer> = new CommandFactory<Footer>();

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

  addQuantitativeNeumeThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.addQuantitativeNeume,
  );

  addTempoThrottled = throttle(this.keydownThrottleIntervalMs, this.addTempo);

  addAutoMartyriaThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.addAutoMartyria,
  );

  setKlasmaThrottled = throttle(this.keydownThrottleIntervalMs, this.setKlasma);
  setGorgonThrottled = throttle(this.keydownThrottleIntervalMs, this.setGorgon);
  setFthoraNoteThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.setFthoraNote,
  );
  setFthoraMartyriaThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.setFthoraMartyria,
  );
  setMartyriaTempoThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.setMartyriaTempo,
  );
  setAccidentalThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.setAccidental,
  );
  setTimeNeumeThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.setTimeNeume,
  );
  setMeasureNumberThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.setMeasureNumber,
  );
  setMeasureBarNoteThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.setMeasureBarNote,
  );
  setMeasureBarMartyriaThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.setMeasureBarMartyria,
  );
  setIsonThrottled = throttle(this.keydownThrottleIntervalMs, this.setIson);
  setVocalExpressionThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.setVocalExpression,
  );

  updateMartyriaNoteThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.updateMartyriaNote,
  );

  updateMartyriaScaleThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.updateMartyriaScale,
  );

  updateMartyriaAutoThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.updateMartyriaAuto,
  );

  updateMartyriaAlignRightThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.updateMartyriaAlignRight,
  );

  updateNoteNoteIndicatorThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.updateNoteNoteIndicator,
  );

  updateNoteVareiaThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.updateNoteVareia,
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

    this.stopAudio();
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
      this.selectedHeaderFooterElement = null;

      if (this.audioService.state === AudioState.Playing) {
        const event = this.playbackEvents.find(
          (x) => x.elementIndex === this.getElementIndex(element),
        );

        if (event) {
          this.audioService.jumpToEvent(event);
        }
      } else if (this.audioService.state === AudioState.Paused) {
        this.stopAudio();
      }
    }

    this.selectedWorkspace.selectedElement = element;
  }

  get selectedLyrics() {
    return this.selectedWorkspace.selectedLyrics;
  }

  set selectedLyrics(element: NoteElement | null) {
    if (element != null) {
      this.selectedElement = null;
      this.selectedHeaderFooterElement = null;
      this.selectionRange = null;
    }

    this.selectedWorkspace.selectedLyrics = element;
  }

  get selectedHeaderFooterElement() {
    return this.selectedWorkspace.selectedHeaderFooterElement;
  }

  set selectedHeaderFooterElement(element: ScoreElement | null) {
    if (element != null) {
      this.selectedElement = null;
      this.selectedLyrics = null;
      this.selectionRange = null;
    }

    this.selectedWorkspace.selectedHeaderFooterElement = element;
  }

  get selectedTextBoxElement() {
    const selectedElement =
      this.selectedElement || this.selectedHeaderFooterElement;

    return selectedElement != null && this.isTextBoxElement(selectedElement)
      ? (selectedElement as TextBoxElement)
      : null;
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

  get headerStyle() {
    return {
      left: withZoom(this.score.pageSetup.leftMargin),
      top: withZoom(this.score.pageSetup.headerMargin),
    } as CSSStyleDeclaration;
  }

  get footerStyle() {
    return {
      left: withZoom(this.score.pageSetup.leftMargin),
      bottom: withZoom(this.score.pageSetup.footerMargin),
    } as CSSStyleDeclaration;
  }

  get guideStyleLeft() {
    return {
      left: withZoom(this.score.pageSetup.leftMargin - 1),
      height: withZoom(this.score.pageSetup.pageHeight),
    } as CSSStyleDeclaration;
  }

  get guideStyleRight() {
    return {
      right: withZoom(this.score.pageSetup.rightMargin - 1),
      height: withZoom(this.score.pageSetup.pageHeight),
    } as CSSStyleDeclaration;
  }

  get guideStyleTop() {
    return {
      top: withZoom(this.score.pageSetup.topMargin - 1),
      width: withZoom(this.score.pageSetup.pageWidth),
    } as CSSStyleDeclaration;
  }

  get guideStyleBottom() {
    return {
      bottom: withZoom(this.score.pageSetup.bottomMargin - 1),
      width: withZoom(this.score.pageSetup.pageWidth),
    } as CSSStyleDeclaration;
  }

  get pageVisibilityIntersection() {
    // look ahead/behind 1 page
    const margin = this.score.pageSetup.pageHeight * this.zoom;

    return {
      root: this.$refs['page-background'],
      rootMargin: `${margin}px 0px ${margin}px 0px`,
    } as IntersectionObserver;
  }

  get dialogOpen() {
    return (
      this.modeKeyDialogIsOpen ||
      this.pageSetupDialogIsOpen ||
      this.playbackSettingsDialogIsOpen ||
      this.syllablePositioningDialogIsOpen ||
      this.editorPreferencesDialogIsOpen
    );
  }

  get filteredPages() {
    return this.printMode ? this.pages.filter((x) => !x.isEmpty) : this.pages;
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
        element.lyricsHorizontalOffset > 0
          ? withZoom(element.lyricsHorizontalOffset)
          : undefined,
      paddingRight:
        element.lyricsHorizontalOffset < 0
          ? withZoom(-element.lyricsHorizontalOffset)
          : undefined,
      fontSize: withZoom(this.score.pageSetup.lyricsDefaultFontSize),
      fontFamily: getFontFamilyWithFallback(
        this.score.pageSetup.lyricsDefaultFontFamily,
      ),
      fontWeight: this.score.pageSetup.lyricsDefaultFontWeight,
      fontStyle: this.score.pageSetup.lyricsDefaultFontStyle,
      color: this.score.pageSetup.lyricsDefaultColor,
      webkitTextStrokeWidth: withZoom(
        this.score.pageSetup.lyricsDefaultStrokeWidth,
      ),
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

  getHeaderForPageIndex(pageIndex: number) {
    const pageNumber = pageIndex + 1;

    const header = this.score.getHeaderForPage(pageNumber);

    // Currently, headers only support a single text box element.
    return header != null ? header.elements[0] : null;
  }

  getFooterForPageIndex(pageIndex: number) {
    const pageNumber = pageIndex + 1;

    const footer = this.score.getFooterForPage(pageNumber);

    // Currently, footers only support a single text box element.
    return footer != null ? footer.elements[0] : null;
  }

  getTokenMetadata(pageIndex: number): TokenMetadata {
    return {
      pageNumber: pageIndex + 1,
      numberOfPages: this.pages.length,
      fileName:
        this.selectedWorkspace.filePath != null
          ? getFileNameFromPath(this.selectedWorkspace.filePath)
          : this.selectedWorkspace.tempFileName,
      filePath: this.currentFilePath || '',
    };
  }

  async created() {
    // Attach the editor component to the window variable
    // so that it can be used for debugging
    (window as any)._editor = this;

    try {
      const fontLoader = (document as any).fonts;

      const loadSystemFontsPromise = this.ipcService
        .getSystemFonts()
        .then((fonts) => (this.fonts = fonts));

      // Must load all fonts before loading any documents,
      // otherwise the text measurements will be wrong
      await Promise.all([
        loadSystemFontsPromise,
        fontLoader.load('1rem Athonite'),
        fontLoader.load('1rem Omega'),
        fontLoader.load('1rem PFGoudyInitials'),
        fontLoader.load('1rem Neanes'),
        fontLoader.ready,
      ]);

      await this.load();
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  mounted() {
    const savedAudioOptions = localStorage.getItem('audioOptionsDefault');

    if (savedAudioOptions != null) {
      Object.assign(this.audioOptions, JSON.parse(savedAudioOptions));

      // -Infinity is not valid JSON, so it is serialized as null.
      // Deserialize as -Infinity
      this.audioOptions.volumeIson = this.audioOptions.volumeIson ?? -Infinity;
      this.audioOptions.volumeMelody =
        this.audioOptions.volumeMelody ?? -Infinity;
    }

    const savedEditorPreferences = localStorage.getItem('editorPreferences');

    if (savedEditorPreferences != null) {
      Object.assign(this.editorPreferences, JSON.parse(savedEditorPreferences));
    }

    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('keyup', this.onKeyup);
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
      IpcMainChannels.FileMenuPreferences,
      this.onFileMenuPreferences,
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
      IpcMainChannels.FileMenuInsertDropCapBefore,
      this.onFileMenuInsertDropCapBefore,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertDropCapAfter,
      this.onFileMenuInsertDropCapAfter,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertHeader,
      this.onFileMenuInsertHeader,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertFooter,
      this.onFileMenuInsertFooter,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuGenerateTestFile,
      this.onFileMenuGenerateTestFile,
    );

    EventBus.$on(
      AudioServiceEventNames.EventPlay,
      this.onAudioServiceEventPlay,
    );

    EventBus.$on(AudioServiceEventNames.Stop, this.onAudioServiceStop);
  }

  beforeDestroy() {
    // Remove the debugging variable from window
    (window as any)._editor = undefined;

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
      IpcMainChannels.FileMenuPreferences,
      this.onFileMenuPreferences,
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
      IpcMainChannels.FileMenuInsertDropCapBefore,
      this.onFileMenuInsertDropCapBefore,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertDropCapAfter,
      this.onFileMenuInsertDropCapAfter,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuGenerateTestFile,
      this.onFileMenuGenerateTestFile,
    );

    EventBus.$off(
      AudioServiceEventNames.EventPlay,
      this.onAudioServiceEventPlay,
    );

    EventBus.$off(AudioServiceEventNames.Stop, this.onAudioServiceStop);

    this.audioService.dispose();
  }

  getElementIndex(element: ScoreElement) {
    return element.index;
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

  isAudioSelected(element: ScoreElement) {
    return this.audioElement === element;
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

  openSyllablePositioningDialog() {
    this.syllablePositioningDialogIsOpen = true;
  }

  closeSyllablePositioningDialog() {
    this.syllablePositioningDialogIsOpen = false;
  }

  openPlaybackSettingsDialog() {
    this.playbackSettingsDialogIsOpen = true;

    this.stopAudio();
  }

  closePlaybackSettingsDialog() {
    this.playbackSettingsDialogIsOpen = false;

    this.saveAudioOptions();
  }

  closePageSetupDialog() {
    this.pageSetupDialogIsOpen = false;
  }

  closeEditorPreferencesDialog() {
    this.editorPreferencesDialogIsOpen = false;

    this.saveEditorPreferences();
  }

  saveEditorPreferences() {
    localStorage.setItem(
      'editorPreferences',
      JSON.stringify(this.editorPreferences),
    );
  }

  isLastElement(element: ScoreElement) {
    return this.elements.indexOf(element) === this.elements.length - 1;
  }

  insertPelastikon() {
    document.execCommand('insertText', false, '\u{1d0b4}');
  }

  insertGorthmikon() {
    document.execCommand('insertText', false, '\u{1d0b5}');
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
    // Special case for neumes with secondary gorgon
    if (
      quantitativeNeume === QuantitativeNeume.OligonPlusHyporoePlusKentemata ||
      quantitativeNeume === QuantitativeNeume.OligonPlusIsonPlusKentemata ||
      quantitativeNeume === QuantitativeNeume.OligonPlusApostrophosPlusKentemata
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
          if (this.selectedElement.elementType === ElementType.Note) {
            const selectedElementAsNote = this.selectedElement as NoteElement;

            element.isMelisma = selectedElementAsNote.isMelisma;
            element.isHyphen = selectedElementAsNote.isHyphen;
          }

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

  addAutoMartyria(alignRight?: boolean, note?: Note) {
    if (this.selectedElement == null) {
      return;
    }

    const element = new MartyriaElement();
    element.alignRight = alignRight === true;

    if (note != null) {
      element.note = note;
      element.auto = false;
    }

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
    element.bpm =
      this.editorPreferences.tempoDefaults[neume] ??
      TempoElement.getDefaultBpm(neume);

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

  addDropCap(after: boolean) {
    if (this.selectedElement == null) {
      return;
    }

    const element = new DropCapElement();

    if (after && !this.isLastElement(this.selectedElement)) {
      this.addScoreElement(element, this.selectedElementIndex + 1);
    } else {
      this.addScoreElement(element, this.selectedElementIndex);
    }

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

  toggleLineBreak(justify: boolean) {
    if (this.selectedElement && !this.isLastElement(this.selectedElement)) {
      let lineBreak = !this.selectedElement.lineBreak;

      if (justify != this.selectedElement.justify) {
        lineBreak = true;
      }

      this.commandService.execute(
        this.scoreElementCommandFactory.create('update-properties', {
          target: this.selectedElement,
          newValues: {
            lineBreak,
            pageBreak: false,
            justify,
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
        if (this.platformService.isMac && event.shiftKey) {
          this.onFileMenuRedoThrottled();
        } else {
          this.onFileMenuUndoThrottled();
        }
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
      } else if (event.code === 'KeyI' && !event.shiftKey) {
        switch (this.entryMode) {
          case EntryMode.Auto:
            this.updateEntryMode(EntryMode.Insert);
            break;
          case EntryMode.Insert:
            this.updateEntryMode(EntryMode.Edit);
            break;
          case EntryMode.Edit:
            this.updateEntryMode(EntryMode.Auto);
            break;
        }
        return;
      } else if (event.code === 'KeyU' && !event.shiftKey) {
        switch (this.entryMode) {
          case EntryMode.Auto:
            this.updateEntryMode(EntryMode.Edit);
            break;
          case EntryMode.Edit:
            this.updateEntryMode(EntryMode.Insert);
            break;
          case EntryMode.Insert:
            this.updateEntryMode(EntryMode.Auto);
            break;
        }
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
          this.moveRightThrottled();
          handled = true;
          break;
        case 'Space':
          if (!event.repeat) {
            if (
              this.audioService.state === AudioState.Stopped ||
              event.ctrlKey
            ) {
              this.playAudio();
            } else {
              this.pauseAudio();
            }
            handled = true;
          }
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

    if (
      this.selectedElement != null &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      if (this.neumeKeyboard.isModifier(event.code)) {
        this.keyboardModifier = event.code;
        handled = true;
      }

      const quantitativeMapping = this.neumeKeyboard.findQuantitativeMapping(
        event,
        this.keyboardModifier,
      );

      if (quantitativeMapping != null) {
        handled = true;
        this.addQuantitativeNeumeThrottled(
          quantitativeMapping.neume as QuantitativeNeume,
        );
      }

      const tempoMapping = this.neumeKeyboard.findTempoMapping(
        event,
        this.keyboardModifier,
      );

      if (tempoMapping != null) {
        handled = true;
        this.addTempoThrottled(tempoMapping.neume as TempoSign);
      }

      if (
        this.keyboardModifier == null &&
        this.neumeKeyboard.isMartyria(event.code)
      ) {
        handled = true;
        this.addAutoMartyriaThrottled(event.shiftKey);
      }

      const martyriaConfigMapping =
        this.neumeKeyboard.findMartyriaConfigMapping(
          event,
          this.keyboardModifier,
        );

      if (martyriaConfigMapping != null) {
        if (martyriaConfigMapping.note != null) {
          handled = true;

          this.addAutoMartyriaThrottled(
            martyriaConfigMapping.martyriaAlignmentToggle,
            martyriaConfigMapping.note,
          );
        }
      }

      if (
        this.selectedElement.elementType === ElementType.Note &&
        !event.repeat
      ) {
        const noteElement = this.selectedElement as NoteElement;

        const gorgonMapping = this.neumeKeyboard.findGorgonMapping(
          event,
          this.keyboardModifier,
        );

        if (gorgonMapping != null) {
          handled = true;
          this.setGorgonThrottled(
            noteElement,
            gorgonMapping.neumes as GorgonNeume[],
          );
        }

        const vocalExpressionMapping =
          this.neumeKeyboard.findVocalExpressionMapping(
            event,
            this.keyboardModifier,
          );

        if (vocalExpressionMapping != null) {
          handled = true;

          if (vocalExpressionMapping.neume === VocalExpressionNeume.Vareia) {
            this.updateNoteVareiaThrottled(noteElement, !noteElement.vareia);
          } else {
            this.setVocalExpression(
              noteElement,
              vocalExpressionMapping.neume as VocalExpressionNeume,
            );
          }
        }

        const fthoraMapping = this.neumeKeyboard.findFthoraMapping(
          event,
          this.keyboardModifier,
        );

        if (fthoraMapping != null) {
          handled = true;
          this.setFthoraNoteThrottled(
            noteElement,
            fthoraMapping.neumes as Fthora[],
          );
        }

        const accidentalMapping = this.neumeKeyboard.findAccidentalMapping(
          event,
          this.keyboardModifier,
        );

        if (accidentalMapping != null) {
          handled = true;
          this.setAccidentalThrottled(
            noteElement,
            accidentalMapping.neume as Accidental,
          );
        }

        const hapliMapping = this.neumeKeyboard.findHapliMapping(
          event,
          this.keyboardModifier,
        );

        if (hapliMapping != null) {
          handled = true;
          this.setTimeNeumeThrottled(
            noteElement,
            hapliMapping.neume as TimeNeume,
          );
        }

        const measureNumberMapping =
          this.neumeKeyboard.findMeasureNumberMapping(
            event,
            this.keyboardModifier,
          );

        if (measureNumberMapping != null) {
          handled = true;
          this.setMeasureNumberThrottled(
            noteElement,
            measureNumberMapping.neume as MeasureNumber,
          );
        }

        const measureBarMapping = this.neumeKeyboard.findMeasureBarMapping(
          event,
          this.keyboardModifier,
        );

        if (measureBarMapping != null) {
          handled = true;
          this.setMeasureBarNoteThrottled(
            noteElement,
            measureBarMapping.neume as MeasureBar,
          );
        }

        const isonMapping = this.neumeKeyboard.findIsonMapping(
          event,
          this.keyboardModifier,
        );

        if (isonMapping != null) {
          handled = true;
          this.setIsonThrottled(noteElement, isonMapping.neume as Ison);
        }

        if (
          this.keyboardModifier == null &&
          this.neumeKeyboard.isMartyria(event.code)
        ) {
          this.addAutoMartyriaThrottled();
        } else if (
          this.keyboardModifier == null &&
          this.neumeKeyboard.isKlasma(event.code)
        ) {
          this.setKlasmaThrottled(noteElement);
        } else if (
          this.keyboardModifier == null &&
          this.neumeKeyboard.isNoteIndicator(event.code)
        ) {
          this.updateNoteNoteIndicatorThrottled(
            noteElement,
            !noteElement.noteIndicator,
          );
        }
      } else if (
        this.selectedElement.elementType === ElementType.Martyria &&
        !event.repeat
      ) {
        const martyriaElement = this.selectedElement as MartyriaElement;

        const fthoraMapping = this.neumeKeyboard.findFthoraMapping(
          event,
          this.keyboardModifier,
        );

        if (fthoraMapping != null) {
          handled = true;
          this.setFthoraMartyriaThrottled(
            martyriaElement,
            fthoraMapping.neumes![0] as Fthora,
          );
        }

        const tempoMapping = this.neumeKeyboard.findMartyriaTempoMapping(
          event,
          this.keyboardModifier,
        );

        if (tempoMapping != null) {
          handled = true;
          this.setMartyriaTempoThrottled(
            martyriaElement,
            tempoMapping.neume as TempoSign,
          );
        }

        const measureBarMapping = this.neumeKeyboard.findMeasureBarMapping(
          event,
          this.keyboardModifier,
        );

        if (measureBarMapping != null) {
          handled = true;
          this.setMeasureBarMartyriaThrottled(
            martyriaElement,
            measureBarMapping.neume as MeasureBar,
          );
        }

        const martyriaConfigMapping =
          this.neumeKeyboard.findMartyriaConfigMapping(
            event,
            this.keyboardModifier,
          );

        if (martyriaConfigMapping != null) {
          handled = true;

          if (martyriaConfigMapping.note != null) {
            // This case will not currently happen
            // because no keyboard mapping exist for it
            this.updateMartyriaNoteThrottled(
              martyriaElement,
              martyriaConfigMapping.note,
            );
          } else if (martyriaConfigMapping.scale != null) {
            this.updateMartyriaScaleThrottled(
              martyriaElement,
              martyriaConfigMapping.scale,
            );
          } else if (martyriaConfigMapping.martyriaAlignmentToggle === true) {
            this.updateMartyriaAlignRightThrottled(
              martyriaElement,
              !martyriaElement.alignRight,
            );
          } else if (martyriaConfigMapping.martyriaAutoToggle === true) {
            this.updateMartyriaAutoThrottled(
              martyriaElement,
              !martyriaElement.auto,
            );
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

    // Do not allow enter key in lyrics
    if (event.code === 'Enter') {
      event.preventDefault();
      return;
    }

    if (event.shiftKey && event.code !== 'Minus') {
      return;
    }

    if (event.ctrlKey || event.metaKey) {
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
          if (getCursorPosition() === 0) {
            this.moveToPreviousLyricBoxThrottled();
            handled = true;
          }
          break;
        case 'ArrowRight':
          if (
            getCursorPosition() === this.getLyricLength(this.selectedLyrics!)
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
            getCursorPosition() === this.getLyricLength(this.selectedLyrics!)
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
    let handled = false;

    const index = this.elements.indexOf(this.selectedElement!);
    const htmlElement = (this.$refs[`element-${index}`] as DropCap[])[0];

    switch (event.code) {
      case 'Enter':
        // Do not allow enter key in drop caps
        handled = true;
        break;
      case 'Tab':
        this.moveRightThrottled();
        handled = true;
        break;
      case 'ArrowLeft':
        if (getCursorPosition() === 0) {
          this.moveLeftThrottled();
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (
          getCursorPosition() === htmlElement.textElement.getInnerText().length
        ) {
          this.moveRightThrottled();
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  onKeyup(event: KeyboardEvent) {
    let handled = false;

    if (this.keyboardModifier === event.code) {
      this.keyboardModifier = null;
      handled = true;
    }

    if (handled) {
      event.preventDefault();
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

  navigableElements = [
    ElementType.Note,
    ElementType.Martyria,
    ElementType.Tempo,
    ElementType.Empty,
    ElementType.DropCap,
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
      // If the currently selected element is a drop cap, blur it first
      if (this.selectedElement?.elementType === ElementType.DropCap) {
        (this.$refs[`element-${index}`] as DropCap[])[0].blur();
      }

      this.selectedElement = this.elements[index - 1];

      // If the newly selected element is a drop cap, focus it
      if (this.selectedElement.elementType === ElementType.DropCap) {
        (this.$refs[`element-${index - 1}`] as DropCap[])[0].focus();
      }

      return true;
    }

    return false;
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
      // If the currently selected element is a drop cap, blur it first
      if (this.selectedElement?.elementType === ElementType.DropCap) {
        (this.$refs[`element-${index}`] as DropCap[])[0].blur();
      }

      this.selectedElement = this.elements[index + 1];

      // If the newly selected element is a drop cap, focus it
      if (this.selectedElement.elementType === ElementType.DropCap) {
        (this.$refs[`element-${index + 1}`] as DropCap[])[0].focus();
      }

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
      // If the lyrics for the last neume on the line have been updated to be so long
      // that the neume is moved to the next line by processPages(), then focusLyrics()
      // will fail if called on its own. This is because the order of events would
      // be the following:
      // focus next element => blur previous element => updateLyrics => processPages
      // and finally the newly selected element would lose focus because processPages
      // moves the element to the next line.

      // To prevent this we, preemptively call updateLyrics and then use Vue.nextTick
      // to only focus the next lyrics after the UI has been redrawn.

      const noteElement = this.selectedLyrics!;

      const text = (
        this.$refs[
          `lyrics-${this.elements.indexOf(noteElement)}`
        ] as ContentEditable[]
      )[0].getInnerText();

      this.updateLyrics(noteElement, text);

      Vue.nextTick(() => {
        this.focusLyrics(nextIndex, true);
      });

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

    // Save the indexes of the visible pages
    const visiblePages = this.pages
      .map((_, i) => i)
      .filter((i) => this.pages[i].isVisible);

    const pages = LayoutService.processPages(this.score);

    // Set page visibility for the newly processed pages
    pages.forEach((x, index) => (x.isVisible = visiblePages.includes(index)));

    this.pages = pages;

    // If using the browser, save the workspace to local storage
    if (this.isBrowser) {
      const workspaceLocalStorage = {
        id: this.selectedWorkspace.id,
        score: JSON.stringify(SaveService.SaveScoreToJson(this.score)),
        filePath: this.currentFilePath,
        tempFileName: this.selectedWorkspace.tempFileName,
        hasUnsavedChanges: this.hasUnsavedChanges,
      } as WorkspaceLocalStorage;

      localStorage.setItem(
        `workspace-${this.selectedWorkspace.id}`,
        JSON.stringify(workspaceLocalStorage),
      );
    } else if (this.isDevelopment) {
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
    if (this.isBrowser) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('workspace-')) {
          try {
            const localStorageWorkspace: WorkspaceLocalStorage = JSON.parse(
              localStorage.getItem(key)!,
            );
            const workspace = new Workspace();
            workspace.id = localStorageWorkspace.id;
            workspace.hasUnsavedChanges =
              localStorageWorkspace.hasUnsavedChanges;
            workspace.filePath = localStorageWorkspace.filePath;
            workspace.tempFileName = localStorageWorkspace.tempFileName;
            workspace.score = SaveService.LoadScoreFromJson(
              JSON.parse(localStorageWorkspace.score),
            );

            this.workspaces.push(workspace);
          } catch (error) {
            // We couldn't load this workspace for some reason. Remove it from storage.
            localStorage.removeItem(key);
            console.error(error);
          }
        }
      });

      if (this.workspaces.length > 0) {
        this.selectedWorkspace = this.workspaces[0];
        return;
      }
    }

    // First, try to load files passed in on the command line.
    // If there are none, then create a default workspace.
    const openWorkspaceResults = await this.ipcService.openWorkspaceFromArgv();

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

    this.pages = LayoutService.processPages(this.score);
  }

  async closeWorkspace(workspace: Workspace) {
    let shouldClose = true;

    if (workspace.hasUnsavedChanges) {
      const fileName =
        workspace.filePath != null
          ? getFileNameFromPath(workspace.filePath)
          : workspace.tempFileName;

      let dialogResult: ShowMessageBoxReplyArgs;

      if (this.ipcService.isShowMessageBoxSupported()) {
        dialogResult = await this.ipcService.showMessageBox({
          title: process.env.VUE_APP_TITLE,
          message: `Do you want to save the changes you made to ${fileName}?`,
          detail: "Your changes will be lost if you don't save them.",
          type: 'warning',
          buttons: ['Save', "Don't Save", 'Cancel'],
        });
      } else {
        dialogResult = {
          response: confirm(
            `${fileName} has unsaved changes. Are you sure you want to close it?`,
          )
            ? 1
            : 2,
          checkboxChecked: false,
        };
      }

      if (dialogResult.response === 0) {
        // User chose "Save"
        const saveResult =
          workspace.filePath != null
            ? await this.ipcService.saveWorkspace(workspace)
            : await this.ipcService.saveWorkspaceAs(workspace);

        // If they successfully saved, then we can close the workspacce
        shouldClose = saveResult.success;
      } else if (dialogResult.response === 2) {
        // User chose "Cancel", so don't close the workspace.
        shouldClose = false;
      }
    }

    if (shouldClose) {
      // If using the browser, remove the item from local storage
      if (this.isBrowser) {
        localStorage.removeItem(`workspace-${workspace.id}`);
      }

      // If the last tab has closed, then exit
      if (this.workspaces.length == 1) {
        this.ipcService.exitApplication();
      }

      const index = this.workspaces.indexOf(workspace);

      this.workspaces.splice(index, 1);

      if (this.selectedWorkspace === workspace) {
        if (this.workspaces.length > 0) {
          this.selectedWorkspace =
            this.workspaces[Math.min(index, this.workspaces.length - 1)];
        } else {
          // TODO support closing all workspaces
          this.onFileMenuNewScore();
        }
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
        await this.ipcService.cancelExit();
        return false;
      }
    }

    await this.ipcService.exitApplication();
  }

  setKlasma(element: NoteElement) {
    if (onlyTakesBottomKlasma(element.quantitativeNeume)) {
      if (element.timeNeume === TimeNeume.Klasma_Bottom) {
        this.updateNoteTime(element, null);
      } else {
        this.updateNoteTime(element, TimeNeume.Klasma_Bottom);
      }
      return;
    } else if (onlyTakesTopKlasma(element.quantitativeNeume)) {
      if (element.timeNeume === TimeNeume.Klasma_Top) {
        this.updateNoteTime(element, null);
      } else {
        this.updateNoteTime(element, TimeNeume.Klasma_Top);
      }
      return;
    } else if (element.timeNeume == null) {
      this.updateNoteTime(element, TimeNeume.Klasma_Top);
    } else if (element.timeNeume === TimeNeume.Klasma_Top) {
      this.updateNoteTime(element, TimeNeume.Klasma_Bottom);
    } else if (element.timeNeume === TimeNeume.Klasma_Bottom) {
      this.updateNoteTime(element, null);
    }
  }

  setGorgon(element: NoteElement, neumes: GorgonNeume[]) {
    let equivalent = false;

    for (let neume of neumes) {
      if (
        neume === GorgonNeume.Gorgon_Bottom &&
        onlyTakesTopGorgon(element.quantitativeNeume)
      ) {
        continue;
      }

      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        this.updateNoteGorgon(element, neume);
        return;
      }

      equivalent = element.gorgonNeume === neume;
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // gorgon neumes. Otherwise set gorgon to the first neume
    // in the cycle.
    if (equivalent) {
      this.updateNoteGorgon(element, null);
    } else {
      this.updateNoteGorgon(element, neumes[0]);
    }
  }

  private setFthoraNote(element: NoteElement, neumes: Fthora[]) {
    let equivalent = false;

    for (let neume of neumes) {
      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        this.updateNoteFthora(element, neume);
        return;
      }

      equivalent = element.fthora === neume;
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // fthora neumes. Otherwise set fthora to the first neume
    // in the cycle.
    if (equivalent) {
      this.updateNoteFthora(element, null);
    } else {
      this.updateNoteFthora(element, neumes[0]);
    }
  }

  private setFthoraMartyria(element: MartyriaElement, neume: Fthora) {
    if (element.fthora === neume) {
      this.updateMartyriaFthora(element, null);
    } else {
      this.updateMartyriaFthora(element, neume);
    }
  }

  private setMartyriaTempo(element: MartyriaElement, neume: TempoSign) {
    if (element.tempo === neume) {
      this.updateMartyriaTempo(element, null);
    } else {
      this.updateMartyriaTempo(element, neume);
    }
  }

  private setModeKeyTempo(element: ModeKeyElement, neume: TempoSign) {
    if (element.tempo === neume) {
      this.updateModeKeyTempo(element, null);
    } else {
      this.updateModeKeyTempo(element, neume);
    }
  }

  private setAccidental(element: NoteElement, neume: Accidental) {
    if (element.accidental != null && element.accidental === neume) {
      this.updateNoteAccidental(element, null);
    } else {
      this.updateNoteAccidental(element, neume);
    }
  }

  private setTimeNeume(element: NoteElement, neume: TimeNeume) {
    if (element.timeNeume === neume) {
      this.updateNoteTime(element, null);
    } else {
      this.updateNoteTime(element, neume);
    }
  }

  private setMeasureNumber(element: NoteElement, neume: MeasureNumber) {
    if (neume === element.measureNumber) {
      this.updateNoteMeasureNumber(element, null);
    } else {
      this.updateNoteMeasureNumber(element, neume);
    }
  }

  private setMeasureBarNote(element: NoteElement, neume: MeasureBar) {
    // Cycle through
    // Left
    // Right
    // Both Sides
    // None
    if (neume === element.measureBarLeft && neume === element.measureBarRight) {
      this.updateNoteMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: null,
      });
    } else if (neume === element.measureBarLeft) {
      this.updateNoteMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: neume,
      });
    } else if (neume === element.measureBarRight) {
      this.updateNoteMeasureBar(element, {
        measureBarLeft: neume,
        measureBarRight: neume,
      });
    } else {
      this.updateNoteMeasureBar(element, {
        measureBarLeft: neume,
        measureBarRight: null,
      });
    }
  }

  private setMeasureBarMartyria(element: MartyriaElement, neume: MeasureBar) {
    // Cycle through
    // Left
    // Right
    // Both Sides
    // None
    if (neume === element.measureBarLeft && neume === element.measureBarRight) {
      this.updateMartyriaMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: null,
      });
    } else if (neume === element.measureBarLeft) {
      this.updateMartyriaMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: neume,
      });
    } else if (neume === element.measureBarRight) {
      this.updateMartyriaMeasureBar(element, {
        measureBarLeft: neume,
        measureBarRight: neume,
      });
    } else {
      this.updateMartyriaMeasureBar(element, {
        measureBarLeft: neume,
        measureBarRight: null,
      });
    }
  }

  private setIson(element: NoteElement, neume: Ison) {
    if (neume === element.ison) {
      this.updateNoteIson(element, null);
    } else {
      this.updateNoteIson(element, neume);
    }
  }

  private setVocalExpression(
    element: NoteElement,
    neume: VocalExpressionNeume,
  ) {
    if (
      element.vocalExpressionNeume != null &&
      areVocalExpressionsEquivalent(neume, element.vocalExpressionNeume)
    ) {
      this.updateNoteExpression(element, null);
    } else {
      this.updateNoteExpression(element, neume);
    }
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

  updatePageVisibility(page: Page, isVisible: boolean) {
    page.isVisible = isVisible;
  }

  updateNoteAndSave(element: NoteElement, newValues: Partial<NoteElement>) {
    this.updateNote(element, newValues);
    this.save();
  }

  updateNote(element: NoteElement, newValues: Partial<NoteElement>) {
    this.commandService.execute(
      this.noteElementCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );
  }

  updateNoteAccidental(element: NoteElement, accidental: Accidental | null) {
    this.updateNote(element, { accidental });
    this.save();
  }

  updateNoteFthora(element: NoteElement, fthora: Fthora | null) {
    let chromaticFthoraNote: ScaleNote | null = null;

    if (
      fthora === Fthora.SoftChromaticThi_Top ||
      fthora === Fthora.SoftChromaticThi_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Thi;
    } else if (
      fthora === Fthora.SoftChromaticPa_Top ||
      fthora === Fthora.SoftChromaticPa_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Ke;
    } else if (
      fthora === Fthora.HardChromaticThi_Top ||
      fthora === Fthora.HardChromaticThi_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Thi;
    } else if (
      fthora === Fthora.HardChromaticPa_Top ||
      fthora === Fthora.HardChromaticPa_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Pa;
    }

    this.updateNote(element, { fthora, chromaticFthoraNote });
    this.save();
  }

  updateNoteExpression(
    element: NoteElement,
    vocalExpressionNeume: VocalExpressionNeume | null,
  ) {
    this.updateNote(element, { vocalExpressionNeume });
    this.save();
  }

  updateNoteTime(element: NoteElement, timeNeume: TimeNeume | null) {
    this.updateNote(element, { timeNeume });
    this.save();
  }

  updateNoteGorgon(element: NoteElement, gorgonNeume: GorgonNeume | null) {
    this.updateNote(element, { gorgonNeume });
    this.save();
  }

  updateNoteMeasureBar(
    element: NoteElement,
    {
      measureBarLeft,
      measureBarRight,
    }: {
      measureBarLeft: MeasureBar | null;
      measureBarRight: MeasureBar | null;
    },
  ) {
    this.updateNote(element, {
      measureBarLeft,
      measureBarRight,
    });
    this.save();
  }

  updateNoteMeasureNumber(
    element: NoteElement,
    measureNumber: MeasureNumber | null,
  ) {
    this.updateNote(element, { measureNumber });
    this.save();
  }

  updateNoteNoteIndicator(element: NoteElement, noteIndicator: boolean) {
    this.updateNote(element, { noteIndicator });
    this.save();
  }

  updateNoteIson(element: NoteElement, ison: Ison | null) {
    this.updateNote(element, { ison });
    this.save();
  }

  updateNoteVareia(element: NoteElement, vareia: boolean) {
    this.updateNote(element, { vareia });
    this.save();
  }

  updateNoteSpaceAfter(element: NoteElement, spaceAfter: number) {
    this.updateNote(element, { spaceAfter });
    this.save();
  }

  updateNoteIgnoreAttractions(
    element: NoteElement,
    ignoreAttractions: boolean,
  ) {
    this.updateNote(element, { ignoreAttractions });
    this.save();
  }

  updateNoteChromaticFthoraNote(
    element: NoteElement,
    chromaticFthoraNote: ScaleNote | null,
  ) {
    this.updateNote(element, { chromaticFthoraNote });
    this.save();
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

  updateTextBoxUseDefaultStyle(
    element: TextBoxElement,
    useDefaultStyle: boolean,
  ) {
    this.updateTextBox(element, { useDefaultStyle });
  }

  updateTextBoxFontSize(element: TextBoxElement, fontSize: number) {
    this.updateTextBox(element, { fontSize });
  }

  updateTextBoxFontFamily(element: TextBoxElement, fontFamily: string) {
    this.updateTextBox(element, { fontFamily });
  }

  updateTextBoxStrokeWidth(element: TextBoxElement, strokeWidth: number) {
    this.updateTextBox(element, { strokeWidth });
  }

  updateTextBoxColor(element: TextBoxElement, color: string) {
    this.updateTextBox(element, { color });
  }

  updateTextBoxAlignment(element: TextBoxElement, alignment: TextBoxAlignment) {
    this.updateTextBox(element, { alignment });
  }

  updateTextBoxInline(element: TextBoxElement, inline: boolean) {
    this.updateTextBox(element, { inline });
  }

  updateTextBoxBold(element: TextBoxElement, bold: boolean) {
    this.updateTextBox(element, { bold });
  }

  updateTextBoxItalic(element: TextBoxElement, italic: boolean) {
    this.updateTextBox(element, { italic });
  }

  updateTextBoxUnderline(element: TextBoxElement, underline: boolean) {
    this.updateTextBox(element, { underline });
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

  updateModeKeyUseDefaultStyle(
    element: ModeKeyElement,
    useDefaultStyle: boolean,
  ) {
    this.updateModeKey(element, { useDefaultStyle });
  }

  updateModeKeyFontSize(element: ModeKeyElement, fontSize: number) {
    this.updateModeKey(element, { fontSize });
  }

  updateModeKeyStrokeWidth(element: ModeKeyElement, strokeWidth: number) {
    this.updateModeKey(element, { strokeWidth });
  }

  updateModeKeyColor(element: ModeKeyElement, color: string) {
    this.updateModeKey(element, { color });
  }

  updateModeKeyAlignment(element: ModeKeyElement, alignment: TextBoxAlignment) {
    this.updateModeKey(element, { alignment });
  }

  updateModeKeyHeightAdjustment(
    element: ModeKeyElement,
    heightAdjustment: number,
  ) {
    this.updateModeKey(element, { heightAdjustment });
  }

  updateModeKeyTempo(element: ModeKeyElement, tempo: TempoSign | null) {
    let bpm = element.bpm;

    if (tempo != null) {
      bpm =
        this.editorPreferences.tempoDefaults[tempo] ??
        TempoElement.getDefaultBpm(tempo);
    }

    this.updateModeKey(element, { tempo, bpm });
  }

  updateModeKeyBpm(element: ModeKeyElement, bpm: number) {
    bpm = Math.round(bpm);
    bpm = Math.max(5, bpm);
    bpm = Math.min(999, bpm);

    this.updateModeKey(element, { bpm });
    this.save();
  }

  updateModeKeyIgnoreAttractions(
    element: ModeKeyElement,
    ignoreAttractions: boolean,
  ) {
    this.updateModeKey(element, { ignoreAttractions });
    this.save();
  }

  updateModeKeyTempoAlignRight(
    element: ModeKeyElement,
    tempoAlignRight: boolean,
  ) {
    this.updateModeKey(element, { tempoAlignRight });
    this.save();
  }

  updateModeKeyPermanentEnharmonicZo(
    element: ModeKeyElement,
    permanentEnharmonicZo: boolean,
  ) {
    this.updateModeKey(element, { permanentEnharmonicZo });
    this.save();
  }

  updateModeKeyFromTemplate(element: ModeKeyElement, template: ModeKeyElement) {
    const {
      templateId,
      mode,
      scale,
      scaleNote,
      fthora,
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
      fthora,
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

  updateMartyriaFthora(element: MartyriaElement, fthora: Fthora | null) {
    let chromaticFthoraNote: ScaleNote | null = null;

    if (
      fthora === Fthora.SoftChromaticThi_Top ||
      fthora === Fthora.SoftChromaticThi_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Thi;
    } else if (
      fthora === Fthora.SoftChromaticPa_Top ||
      fthora === Fthora.SoftChromaticPa_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Ke;
    } else if (
      fthora === Fthora.HardChromaticThi_Top ||
      fthora === Fthora.HardChromaticThi_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Thi;
    } else if (
      fthora === Fthora.HardChromaticPa_Top ||
      fthora === Fthora.HardChromaticPa_Bottom
    ) {
      chromaticFthoraNote = ScaleNote.Pa;
    }

    this.updateMartyria(element, { fthora, chromaticFthoraNote });
  }

  updateMartyriaTempo(element: MartyriaElement, tempo: TempoSign | null) {
    let bpm = element.bpm;

    if (tempo != null) {
      bpm =
        this.editorPreferences.tempoDefaults[tempo] ??
        TempoElement.getDefaultBpm(tempo);
    }

    this.updateMartyria(element, { tempo, bpm });
  }

  updateMartyriaBpm(element: MartyriaElement, bpm: number) {
    bpm = Math.round(bpm);
    bpm = Math.max(5, bpm);
    bpm = Math.min(999, bpm);

    this.updateMartyria(element, { bpm });
    this.save();
  }

  updateMartyriaMeasureBar(
    element: MartyriaElement,
    {
      measureBarLeft,
      measureBarRight,
    }: {
      measureBarLeft: MeasureBar | null;
      measureBarRight: MeasureBar | null;
    },
  ) {
    this.updateMartyria(element, {
      measureBarLeft,
      measureBarRight,
    });
    this.save();
  }

  updateMartyriaAlignRight(element: MartyriaElement, alignRight: boolean) {
    this.updateMartyria(element, { alignRight });
  }

  updateMartyriaChromaticFthoraNote(
    element: MartyriaElement,
    chromaticFthoraNote: ScaleNote | null,
  ) {
    this.updateMartyria(element, { chromaticFthoraNote });
  }

  updateMartyriaAuto(element: MartyriaElement, auto: boolean) {
    if (element.auto === auto) {
      return;
    }

    this.updateMartyria(element, { auto });
  }

  updateMartyriaNote(element: MartyriaElement, note: Note) {
    if (element.note === note) {
      return;
    }

    this.updateMartyria(element, { note, auto: false });
  }

  updateMartyriaScale(element: MartyriaElement, scale: Scale) {
    if (element.scale === scale) {
      return;
    }

    this.updateMartyria(element, { scale, auto: false });
  }

  updateMartyriaSpaceAfter(element: MartyriaElement, spaceAfter: number) {
    this.updateMartyria(element, { spaceAfter });
    this.save();
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

  updateTempoSpaceAfter(element: TempoElement, spaceAfter: number) {
    this.updateTempo(element, { spaceAfter });
    this.save();
  }

  updateTempoBpm(element: TempoElement, bpm: number) {
    bpm = Math.round(bpm);
    bpm = Math.max(5, bpm);
    bpm = Math.min(999, bpm);

    this.updateTempo(element, { bpm });
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

      const start = Math.min(
        this.selectionRange.start,
        this.selectionRange.end,
      );

      this.selectedElement =
        this.elements[Math.min(start, this.elements.length - 1)];

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

  playAudio() {
    try {
      if (this.audioService.state === AudioState.Stopped) {
        this.playbackEvents = this.playbackService.computePlaybackSequence(
          this.elements,
          this.audioOptions,
        );

        const startAt = this.playbackEvents.find(
          (x) => x.elementIndex >= this.selectedElementIndex,
        );

        this.audioService.play(this.playbackEvents, this.audioOptions, startAt);
      } else {
        this.pauseAudio();
      }
    } catch (error) {
      console.error(error);
    }
  }

  stopAudio() {
    try {
      this.audioService.stop();

      this.playbackEvents = [];
    } catch (error) {
      console.error(error);
    }
  }

  pauseAudio() {
    try {
      this.audioService.togglePause();

      if (this.audioService.state === AudioState.Paused) {
        this.audioElement = null;
      }
    } catch (error) {
      console.error(error);
    }
  }

  playTestTone() {
    try {
      this.audioService.playTestTone(this.audioOptions.frequencyDi);
    } catch (error) {
      console.error(error);
    }
  }

  updateAudioOptionsSpeed(speed: number) {
    if (this.audioService.state === AudioState.Paused) {
      this.stopAudio();
    }

    speed = Math.max(0.1, speed);
    speed = Math.min(3, speed);
    speed = +speed.toFixed(2);

    this.audioOptions.speed = speed;

    this.saveAudioOptions();
  }

  saveAudioOptions() {
    localStorage.setItem(
      'audioOptionsDefault',
      JSON.stringify(this.audioOptions),
    );
  }

  onAudioServiceEventPlay(event: PlaybackSequenceEvent) {
    if (this.audioService.state === AudioState.Playing) {
      this.audioElement = this.elements[event.elementIndex];

      // Scroll the currently playing element into view
      const lyrics = (this.$refs[`lyrics-${event.elementIndex}`] as any[])[0];

      const neumeBox = (
        this.$refs[`element-${event.elementIndex}`] as any[]
      )[0];

      if (lyrics?.$el.scrollIntoViewIfNeeded) {
        lyrics.$el.scrollIntoViewIfNeeded(false);
      }

      if (neumeBox?.scrollIntoViewIfNeeded) {
        neumeBox.scrollIntoViewIfNeeded(false);
      }
    }
  }

  onAudioServiceStop(event: PlaybackSequenceEvent) {
    this.audioElement = null;
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
    this.printMode = true;

    // Blur the active element so that focus outlines and
    // blinking cursors don't show up in the printed page
    const activeElement = this.blurActiveElement();

    Vue.nextTick(async () => {
      await this.ipcService.printWorkspace(this.selectedWorkspace);
      this.printMode = false;

      // Re-focus the active element
      this.focusElement(activeElement);
    });
  }

  async onFileMenuExportAsPdf() {
    this.printMode = true;

    // Blur the active element so that focus outlines and
    // blinking cursors don't show up in the printed page
    const activeElement = this.blurActiveElement();

    Vue.nextTick(async () => {
      await this.ipcService.exportWorkspaceAsPdf(this.selectedWorkspace);
      this.printMode = false;

      // Re-focus the active element
      this.focusElement(activeElement);
    });
  }

  blurActiveElement() {
    const activeElement = document.activeElement;

    if (activeElement instanceof HTMLElement) {
      activeElement.blur();
    }

    return activeElement;
  }

  focusElement(element: Element | null) {
    if (element instanceof HTMLElement) {
      element.focus();
    }
  }

  onFileMenuInsertTextBox(args: FileMenuInsertTextboxArgs) {
    const element = new TextBoxElement();
    element.inline = args.inline;

    element.color = this.score.pageSetup.lyricsDefaultColor;
    element.fontFamily = this.score.pageSetup.lyricsDefaultFontFamily;
    element.fontSize = this.score.pageSetup.lyricsDefaultFontSize;
    element.strokeWidth = this.score.pageSetup.lyricsDefaultStrokeWidth;
    element.bold = this.score.pageSetup.lyricsDefaultFontWeight === '700';
    element.italic = this.score.pageSetup.lyricsDefaultFontStyle === 'italic';

    this.addScoreElement(element, this.selectedElementIndex);

    this.selectedElement = element;

    this.save();

    Vue.nextTick(() => {
      const index = this.elements.indexOf(element);

      (this.$refs[`element-${index}`] as any)[0].focus();
    });
  }

  onFileMenuInsertModeKey() {
    const element = this.createDefaultModeKey(this.score.pageSetup);

    this.addScoreElement(element, this.selectedElementIndex);

    this.selectedElement = element;

    this.openModeKeyDialog();

    this.save();
  }

  onFileMenuInsertDropCapBefore() {
    this.addDropCap(false);
  }

  onFileMenuInsertDropCapAfter() {
    this.addDropCap(true);
  }

  onFileMenuInsertHeader() {
    if (this.score.pageSetup.showHeader) {
      return;
    }

    this.score.pageSetup.showHeader = true;

    this.updatePageSetup(this.score.pageSetup);
  }

  onFileMenuInsertFooter() {
    if (this.score.pageSetup.showFooter) {
      return;
    }

    this.score.pageSetup.showFooter = true;

    this.updatePageSetup(this.score.pageSetup);
  }

  async onFileMenuSave() {
    const workspace = this.selectedWorkspace;

    if (workspace.filePath != null) {
      const result = await this.ipcService.saveWorkspace(workspace);
      if (result.success) {
        workspace.hasUnsavedChanges = false;
      }
    } else {
      const result = await this.ipcService.saveWorkspaceAs(workspace);
      if (result.success) {
        workspace.filePath = result.filePath;
        workspace.hasUnsavedChanges = false;
      }
    }
  }

  async onFileMenuSaveAs() {
    const workspace = this.selectedWorkspace;

    const result = await this.ipcService.saveWorkspaceAs(workspace);
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

  onFileMenuPreferences() {
    if (!this.dialogOpen) {
      this.editorPreferencesDialogIsOpen = true;
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

  createDefaultModeKey(pageSetup: PageSetup) {
    const defaultTemplate = ModeKeyElement.createFromTemplate(
      modeKeyTemplates[0],
    );

    defaultTemplate.color = pageSetup.modeKeyDefaultColor;
    defaultTemplate.fontSize = pageSetup.modeKeyDefaultFontSize;
    defaultTemplate.strokeWidth = pageSetup.modeKeyDefaultStrokeWidth;

    return defaultTemplate;
  }

  createDefaultScore() {
    const score = new Score();

    try {
      const pageSetupDefault = localStorage.getItem('pageSetupDefault');

      if (pageSetupDefault) {
        SaveService.LoadPageSetup_v1(
          score.pageSetup,
          JSON.parse(pageSetupDefault),
        );
      }
    } catch (error) {
      console.error(error);
    }

    const title = new TextBoxElement();
    title.content = 'Title';
    title.fontFamily = score.pageSetup.lyricsDefaultFontFamily;
    title.fontSize = Unit.fromPt(20);
    title.strokeWidth = score.pageSetup.lyricsDefaultStrokeWidth;
    title.alignment = TextBoxAlignment.Center;

    score.staff.elements.unshift(
      title,
      this.createDefaultModeKey(score.pageSetup),
    );

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
      args.success = false;
      console.error(error);

      if (error instanceof Error) {
        if (this.ipcService.isShowMessageBoxSupported()) {
          this.ipcService.showMessageBox({
            type: 'error',
            title: 'Open failed',
            message: error.message,
          });
        } else {
          alert(error.message);
        }
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.loading-overlay {
  position: absolute;
  z-index: 9999;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease;
  color: white;
}

.lyrics {
  min-height: 1.6rem;
  min-width: 1rem;
  text-align: center;
  position: relative;
}

.guide-line-vl {
  border-left: 1px solid black;
  position: absolute;
}

.guide-line-vr {
  border-right: 1px solid black;
  position: absolute;
}

.guide-line-ht {
  border-top: 1px solid black;
  position: absolute;
}

.guide-line-hb {
  border-bottom: 1px solid black;
  position: absolute;
}

.red {
  color: #ed0000;
}

.neume-box .selected {
  background-color: palegoldenrod;
}

.neume-box .audio-selected {
  background-color: rgba(152, 251, 152, 0.5);
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

.workspace-tab-new-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;

  font-size: 1.25rem;
  font-weight: bold;

  cursor: default;
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
    overflow: visible !important;
  }

  .page,
  .page * {
    visibility: visible;
  }

  .page-background {
    display: block;
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

  .file-menu-bar,
  .neume-selector-panel,
  .workspace-tab-container,
  .lyrics-toolbar,
  .main-toolbar,
  .martyria-toolbar,
  .mode-key-toolbar,
  .neume-toolbar,
  .tempo-toolbar,
  .text-box-toolbar,
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
