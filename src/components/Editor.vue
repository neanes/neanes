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
      :playbackTime="selectedWorkspace.playbackTime"
      :playbackBpm="selectedWorkspace.playbackBpm"
      :currentPageNumber="currentPageNumber"
      :pageCount="pageCount"
      :neumeKeyboard="neumeKeyboard"
      @update:zoom="updateZoom"
      @update:zoomToFit="updateZoomToFit"
      @update:audioOptionsSpeed="updateAudioOptionsSpeed"
      @add-auto-martyria="addAutoMartyria"
      @update:entryMode="updateEntryMode"
      @toggle-page-break="togglePageBreak"
      @toggle-line-break="toggleLineBreak($event)"
      @add-tempo="addTempo"
      @add-drop-cap="addDropCap(false)"
      @add-mode-key="onFileMenuInsertModeKey"
      @add-text-box="onFileMenuInsertTextBox"
      @add-text-box-rich="onFileMenuInsertRichTextBox"
      @add-image="onClickAddImage"
      @delete-selected-element="deleteSelectedElement"
      @click="selectedLyrics = null"
      @play-audio="playAudio"
      @open-playback-settings="openPlaybackSettingsDialog"
    />
    <div class="content">
      <NeumeSelector
        class="neume-selector"
        :pageSetup="score.pageSetup"
        :neumeKeyboard="neumeKeyboard"
        @select-quantitative-neume="addQuantitativeNeume"
      />
      <div class="page-container">
        <Vue3TabsChrome
          class="workspace-tab-container"
          ref="tabs"
          :tabs="tabs"
          v-model="selectedWorkspaceId"
          :gap="0"
          :on-close="onTabClosed"
          :render-label="renderTabLabel"
          @contextmenu="openContextMenuForTab"
        >
          <template v-slot:after>
            <button
              class="workspace-tab-new-button"
              @click="onFileMenuNewScore"
            >
              +
            </button>
          </template></Vue3TabsChrome
        >
        <SearchText
          ref="searchText"
          v-if="searchTextPanelIsOpen"
          v-model:query="searchTextQuery"
          @search="onSearchText"
          @close="searchTextPanelIsOpen = false"
        />
        <div
          class="page-background"
          ref="page-background"
          @scroll="onScrollThrottled"
        >
          <div
            class="page"
            :style="pageStyle"
            v-observe-visibility="{
              callback: (isVisible: boolean) =>
                updatePageVisibility(page, isVisible),
              intersection: pageVisibilityIntersection,
            }"
            v-for="(page, pageIndex) in filteredPages"
            :key="`page-${pageIndex}`"
            ref="pages"
            :class="{ print: printMode }"
          >
            <template v-if="page.isVisible || printMode">
              <template v-if="showGuides">
                <span class="guide-line-vl" :style="guideStyleLeft" />
                <span class="guide-line-vr" :style="guideStyleRight" />
                <span class="guide-line-ht" :style="guideStyleTop" />
                <span class="guide-line-hb" :style="guideStyleBottom" />
              </template>
              <template v-if="score.pageSetup.showHeader">
                <template
                  v-if="isRichTextBoxElement(getHeaderForPageIndex(pageIndex))"
                >
                  <TextBoxRich
                    class="element-box"
                    :key="`element-${getHeaderForPageIndex(pageIndex).id}-${
                      getHeaderForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="`header-${pageIndex}`"
                    :element="getHeaderForPageIndex(pageIndex)"
                    :editMode="
                      !printMode &&
                      getHeaderForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :fonts="fonts"
                    :class="[
                      {
                        selectedTextbox:
                          getHeaderForPageIndex(pageIndex) ==
                          selectedHeaderFooterElement,
                      },
                    ]"
                    :style="headerStyle"
                    @click="
                      selectedHeaderFooterElement =
                        getHeaderForPageIndex(pageIndex)
                    "
                    @update="
                      updateRichTextBox(
                        getHeaderForPageIndex(pageIndex) as RichTextBoxElement,
                        $event,
                      )
                    "
                    @update:height="
                      updateRichTextBoxHeight(
                        getHeaderForPageIndex(pageIndex) as RichTextBoxElement,
                        $event,
                      )
                    "
                  />
                </template>
                <template
                  v-else-if="isTextBoxElement(getHeaderForPageIndex(pageIndex))"
                >
                  <TextBox
                    class="element-box"
                    :key="`element-${getHeaderForPageIndex(pageIndex).id}-${
                      getHeaderForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="`header-${pageIndex}`"
                    :element="getHeaderForPageIndex(pageIndex)"
                    :editMode="
                      !printMode &&
                      getHeaderForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :class="[
                      {
                        selectedTextbox:
                          getHeaderForPageIndex(pageIndex) ==
                          selectedHeaderFooterElement,
                      },
                    ]"
                    :style="headerStyle"
                    @click="
                      selectedHeaderFooterElement =
                        getHeaderForPageIndex(pageIndex)
                    "
                    @update:content="
                      updateTextBoxContent(
                        getHeaderForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                    @update:contentLeft="
                      updateTextBoxContentLeft(
                        getHeaderForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                    @update:contentCenter="
                      updateTextBoxContentCenter(
                        getHeaderForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                    @update:contentRight="
                      updateTextBoxContentRight(
                        getHeaderForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                  />
                </template>
                <div
                  v-if="score.pageSetup.showHeaderHorizontalRule"
                  class="header-footer-hr"
                  :style="
                    getHeaderHorizontalRuleStyle(
                      getHeaderForPageIndex(pageIndex).height,
                    )
                  "
                ></div>
              </template>
              <div
                class="line"
                v-for="(line, lineIndex) in page.lines"
                :key="`line-${pageIndex}-${lineIndex}`"
                :ref="`line-${lineIndex}`"
              >
                <div
                  v-for="element in line.elements"
                  :id="`element-${element.id}`"
                  :key="`element-${element.id}-${element.keyHelper}`"
                  class="element-box"
                  :style="getElementStyle(element)"
                >
                  <template v-if="isSyllableElement(element)">
                    <div
                      :ref="`element-${getElementIndex(element)}`"
                      class="neume-box"
                    >
                      <span
                        class="section-name"
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        >§</span
                      >
                      <span class="page-break" v-if="element.pageBreak"
                        ><img src="@/assets/icons/page-break.svg"
                      /></span>
                      <span class="line-break" v-if="element.lineBreak"
                        ><img
                          v-if="element.lineBreakType === LineBreakType.Justify"
                          src="@/assets/icons/line-break-justify.svg" /><img
                          v-else-if="
                            element.lineBreakType === LineBreakType.Center
                          "
                          src="@/assets/icons/line-break-center.svg" /><img
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
                          },
                        ]"
                        @select-single="selectedElement = element"
                        @select-range="setSelectionRange(element)"
                        @dblclick="openSyllablePositioningDialog"
                      />
                      <div
                        class="lyrics-container"
                        :style="getLyricStyle(element as NoteElement)"
                      >
                        <ContentEditable
                          class="lyrics"
                          :class="{
                            selectedLyrics: element === selectedLyrics,
                          }"
                          :content="(element as NoteElement).lyrics"
                          :editable="!lyricsLocked"
                          whiteSpace="nowrap"
                          :ref="`lyrics-${getElementIndex(element)}`"
                          @click="focusLyrics(getElementIndex(element))"
                          @focus="selectedLyrics = element as NoteElement"
                          @blur="updateLyrics(element as NoteElement, $event)"
                        />
                        <template
                          v-if="
                            isMelisma(element as NoteElement) &&
                            (element as NoteElement).isHyphen &&
                            (element as NoteElement).melismaText === ''
                          "
                        >
                          <div
                            class="melisma"
                            :class="{
                              full: (element as NoteElement).isFullMelisma,
                            }"
                            :style="getMelismaStyle(element as NoteElement)"
                          >
                            <span
                              class="melisma-hyphen"
                              v-for="(offset, index) in (element as NoteElement)
                                .hyphenOffsets"
                              :key="index"
                              :style="
                                getMelismaHyphenStyle(
                                  element as NoteElement,
                                  index,
                                )
                              "
                              >-</span
                            >
                          </div>
                        </template>
                        <template
                          v-else-if="
                            isMelisma(element as NoteElement) &&
                            !(element as NoteElement).isHyphen &&
                            !rtl &&
                            (element as NoteElement).melismaText === ''
                          "
                        >
                          <div
                            class="melisma-underscore"
                            :class="{
                              full: (element as NoteElement).isFullMelisma,
                            }"
                            :style="
                              getMelismaUnderscoreStyleOuter(
                                element as NoteElement,
                              )
                            "
                          >
                            <div
                              class="melisma-inner"
                              :style="
                                getMelismaUnderscoreStyleInner(
                                  element as NoteElement,
                                )
                              "
                            ></div>
                          </div>
                        </template>
                        <template
                          v-else-if="
                            isMelisma(element as NoteElement) &&
                            !(element as NoteElement).isHyphen &&
                            rtl
                          "
                        >
                          <div
                            class="melisma"
                            :class="{
                              fullRtl: (element as NoteElement).isFullMelisma,
                            }"
                            :style="getMelismaStyle(element as NoteElement)"
                            v-text="(element as NoteElement).melismaText"
                          ></div>
                        </template>
                        <template
                          v-else-if="
                            (element as NoteElement).isMelisma &&
                            (element as NoteElement).melismaText !== '' &&
                            !rtl
                          "
                        >
                          <span
                            class="melisma-text"
                            v-text="(element as NoteElement).melismaText"
                            :class="{
                              selectedMelisma: element === selectedLyrics,
                            }"
                            @click="focusLyrics(getElementIndex(element))"
                            @focus="selectedLyrics = element as NoteElement"
                          ></span>
                        </template>
                      </div>
                    </div>
                  </template>
                  <template v-else-if="isMartyriaElement(element)">
                    <div class="neume-box">
                      <span
                        class="section-name"
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        >§</span
                      >
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
                          },
                        ]"
                        @select-single="selectedElement = element"
                        @select-range="setSelectionRange(element)"
                      />
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isTempoElement(element)">
                    <div
                      :ref="`element-${getElementIndex(element)}`"
                      class="neume-box"
                    >
                      <span
                        class="section-name"
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        >§</span
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
                        @select-single="selectedElement = element"
                        @select-range="setSelectionRange(element)"
                      />
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isEmptyElement(element)">
                    <div
                      :ref="`element-${getElementIndex(element)}`"
                      class="neume-box"
                    >
                      <span
                        class="section-name"
                        v-if="
                          element.sectionName != '' &&
                          element.sectionName != null
                        "
                        >§</span
                      >
                      <span class="page-break" v-if="element.pageBreak">
                        <img src="@/assets/icons/page-break.svg"
                      /></span>
                      <span class="line-break" v-if="element.lineBreak"
                        ><img src="@/assets/icons/line-break.svg"
                      /></span>
                      <EmptyNeumeBox
                        class="empty-neume-box"
                        :class="[{ selected: isSelected(element) }]"
                        :style="getEmptyBoxStyle(element as EmptyElement)"
                        @select-single="selectedElement = element"
                      ></EmptyNeumeBox>
                      <div class="lyrics"></div>
                    </div>
                  </template>
                  <template v-else-if="isTextBoxElement(element)">
                    <span
                      class="section-name-2"
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      >§</span
                    >
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
                      :pageSetup="score.pageSetup"
                      :class="[{ selectedTextbox: isSelected(element) }]"
                      @select-single="selectedElement = element"
                      @update:content="
                        updateTextBoxContent(element as TextBoxElement, $event)
                      "
                      @update:contentLeft="
                        updateTextBoxContentLeft(
                          element as TextBoxElement,
                          $event,
                        )
                      "
                      @update:contentCenter="
                        updateTextBoxContentCenter(
                          element as TextBoxElement,
                          $event,
                        )
                      "
                      @update:contentRight="
                        updateTextBoxContentRight(
                          element as TextBoxElement,
                          $event,
                        )
                      "
                    />
                  </template>
                  <template v-else-if="isRichTextBoxElement(element)">
                    <span
                      class="section-name-2"
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      >§</span
                    >
                    <span class="page-break-2" v-if="element.pageBreak"
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break-2" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <TextBoxRich
                      :ref="`element-${getElementIndex(element)}`"
                      :element="element"
                      :pageSetup="score.pageSetup"
                      :fonts="fonts"
                      :class="[{ selectedTextbox: isSelected(element) }]"
                      @select-single="selectedElement = element"
                      @update="
                        updateRichTextBox(element as RichTextBoxElement, $event)
                      "
                      @update:height="
                        updateRichTextBoxHeight(
                          element as RichTextBoxElement,
                          $event,
                        )
                      "
                    />
                  </template>
                  <template v-else-if="isModeKeyElement(element)">
                    <span
                      class="section-name-2"
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      >§</span
                    >
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
                          selectedTextbox: isSelected(element),
                        },
                      ]"
                      @select-single="selectedElement = element"
                      @dblclick="openModeKeyDialog"
                    />
                  </template>
                  <template v-else-if="isDropCapElement(element)">
                    <span
                      class="section-name"
                      v-if="
                        element.sectionName != '' && element.sectionName != null
                      "
                      >§</span
                    >
                    <span class="page-break" v-if="element.pageBreak"
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <DropCap
                      :ref="`element-${getElementIndex(element)}`"
                      :element="element"
                      :pageSetup="score.pageSetup"
                      :editable="!lyricsLocked"
                      :class="[
                        {
                          selectedTextbox: isSelected(element),
                        },
                      ]"
                      @select-single="selectedElement = element"
                      @update:content="
                        updateDropCapContent(element as DropCapElement, $event)
                      "
                    />
                  </template>
                  <template v-else-if="isImageBoxElement(element)">
                    <span class="page-break-2" v-if="element.pageBreak"
                      ><img src="@/assets/icons/page-break.svg"
                    /></span>
                    <span class="line-break-2" v-if="element.lineBreak"
                      ><img src="@/assets/icons/line-break.svg"
                    /></span>
                    <ImageBox
                      :ref="`element-${getElementIndex(element)}`"
                      :element="element"
                      :zoom="zoom"
                      :printMode="printMode"
                      :class="[{ selectedImagebox: isSelected(element) }]"
                      @select-single="selectedElement = element"
                      @update:size="
                        updateImageBoxSize(
                          selectedElement as ImageBoxElement,
                          $event.width,
                          $event.height,
                        )
                      "
                    />
                  </template>
                </div>
              </div>
              <template v-if="score.pageSetup.showFooter">
                <div
                  v-if="score.pageSetup.showFooterHorizontalRule"
                  class="header-footer-hr"
                  :style="
                    getFooterHorizontalRuleStyle(
                      getFooterForPageIndex(pageIndex).height,
                    )
                  "
                ></div>
                <template
                  v-if="isRichTextBoxElement(getFooterForPageIndex(pageIndex))"
                >
                  <TextBoxRich
                    class="element-box"
                    :key="`element-${getFooterForPageIndex(pageIndex).id}-${
                      getFooterForPageIndex(pageIndex).keyHelper
                    }`"
                    :ref="`footer-${pageIndex}`"
                    :element="getFooterForPageIndex(pageIndex)"
                    :editMode="
                      !printMode &&
                      getFooterForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :fonts="fonts"
                    :class="[
                      {
                        selectedTextbox:
                          getFooterForPageIndex(pageIndex) ==
                          selectedHeaderFooterElement,
                      },
                    ]"
                    :style="footerStyle"
                    @click="
                      selectedHeaderFooterElement =
                        getFooterForPageIndex(pageIndex)
                    "
                    @update="
                      updateRichTextBox(
                        getFooterForPageIndex(pageIndex) as RichTextBoxElement,
                        $event,
                      )
                    "
                    @update:height="
                      updateRichTextBoxHeight(
                        getFooterForPageIndex(pageIndex) as RichTextBoxElement,
                        $event,
                      )
                    "
                  />
                </template>
                <template
                  v-else-if="isTextBoxElement(getHeaderForPageIndex(pageIndex))"
                >
                  <TextBox
                    class="element-box"
                    :ref="`footer-${pageIndex}`"
                    :key="`element-${getFooterForPageIndex(pageIndex).id}-${
                      getFooterForPageIndex(pageIndex).keyHelper
                    }`"
                    :element="getFooterForPageIndex(pageIndex)"
                    :editMode="
                      !printMode &&
                      getFooterForPageIndex(pageIndex) ==
                        selectedHeaderFooterElement
                    "
                    :metadata="getTokenMetadata(pageIndex)"
                    :pageSetup="score.pageSetup"
                    :class="[
                      {
                        selectedTextbox:
                          getFooterForPageIndex(pageIndex) ==
                          selectedHeaderFooterElement,
                      },
                    ]"
                    :style="footerStyle"
                    @click="
                      selectedHeaderFooterElement =
                        getFooterForPageIndex(pageIndex)
                    "
                    @update:content="
                      updateTextBoxContent(
                        getFooterForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                    @update:contentLeft="
                      updateTextBoxContentLeft(
                        getFooterForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                    @update:contentCenter="
                      updateTextBoxContentCenter(
                        getFooterForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                    @update:contentRight="
                      updateTextBoxContentRight(
                        getFooterForPageIndex(pageIndex)! as TextBoxElement,
                        $event,
                      )
                    "
                /></template>
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
        :pageSetup="score.pageSetup"
        @update:multipanel="
          updateTextBoxMultipanel(selectedTextBoxElement, $event)
        "
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
        @update:lineHeight="
          updateTextBoxLineHeight(selectedTextBoxElement, $event)
        "
        @update:customWidth="updateTextBoxWidth(selectedTextBoxElement, $event)"
        @update:customHeight="
          updateTextBoxHeight(selectedTextBoxElement, $event)
        "
        @update:marginTop="
          updateTextBoxMarginTop(selectedTextBoxElement, $event)
        "
        @update:marginBottom="
          updateTextBoxMarginBottom(selectedTextBoxElement, $event)
        "
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as TextBoxElement,
            $event,
          )
        "
        @insert:gorthmikon="insertGorthmikon"
        @insert:pelastikon="insertPelastikon"
      />
    </template>
    <template v-if="selectedRichTextBoxElement != null">
      <ToolbarTextBoxRich
        :element="selectedRichTextBoxElement"
        :pageSetup="score.pageSetup"
        @update:rtl="
          updateRichTextBox(selectedRichTextBoxElement, { rtl: $event })
        "
        @update:marginTop="
          updateRichTextBoxMarginTop(selectedRichTextBoxElement, $event)
        "
        @update:marginBottom="
          updateRichTextBoxMarginBottom(selectedRichTextBoxElement, $event)
        "
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as RichTextBoxElement,
            $event,
          )
        "
      />
    </template>
    <template
      v-if="selectedElement != null && isDropCapElement(selectedElement)"
    >
      <ToolbarDropCap
        :element="selectedElement"
        :fonts="fonts"
        :pageSetup="score.pageSetup"
        @update:useDefaultStyle="
          updateDropCapUseDefaultStyle(
            selectedElement as DropCapElement,
            $event,
          )
        "
        @update:fontSize="
          updateDropCapFontSize(selectedElement as DropCapElement, $event)
        "
        @update:fontFamily="
          updateDropCapFontFamily(selectedElement as DropCapElement, $event)
        "
        @update:strokeWidth="
          updateDropCapStrokeWidth(selectedElement as DropCapElement, $event)
        "
        @update:color="
          updateDropCapColor(selectedElement as DropCapElement, $event)
        "
        @update:bold="
          updateDropCapFontWeight(selectedElement as DropCapElement, $event)
        "
        @update:italic="
          updateDropCapFontStyle(selectedElement as DropCapElement, $event)
        "
        @update:lineHeight="
          updateDropCapLineHeight(selectedElement as DropCapElement, $event)
        "
        @update:customWidth="
          updateDropCapWidth(selectedElement as DropCapElement, $event)
        "
        @update:lineSpan="
          updateDropCapLineSpan(selectedElement as DropCapElement, $event)
        "
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as DropCapElement,
            $event,
          )
        "
      />
    </template>
    <template
      v-if="selectedElement != null && isImageBoxElement(selectedElement)"
    >
      <ToolbarImageBox
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:alignment="
          updateImageBoxAlignment(selectedElement as ImageBoxElement, $event)
        "
        @update:inline="
          updateImageBoxInline(selectedElement as ImageBoxElement, $event)
        "
        @update:lockAspectRatio="
          updateImageBoxLockAspectRatio(
            selectedElement as ImageBoxElement,
            $event,
          )
        "
        @update:size="
          updateImageBoxSize(
            selectedElement as ImageBoxElement,
            $event.width,
            $event.height,
          )
        "
      />
    </template>
    <template v-if="selectedLyrics != null">
      <ToolbarLyrics
        :element="selectedLyrics"
        :fonts="fonts"
        @update:lyricsColor="
          updateNoteLyricsColor(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsFontFamily="
          updateNoteLyricsFontFamily(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsFontSize="
          updateNoteLyricsFontSize(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsFontStyle="
          updateNoteLyricsFontStyle(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsFontWeight="
          updateNoteLyricsFontWeight(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsTextDecoration="
          updateNoteLyricsTextDecoration(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsStrokeWidth="
          updateNoteLyricsStrokeWidth(selectedLyrics as NoteElement, $event)
        "
        @update:lyricsUseDefaultStyle="
          updateNoteLyricsUseDefaultStyle(selectedLyrics as NoteElement, $event)
        "
        @insert:specialCharacter="insertSpecialCharacter"
      />
    </template>
    <template
      v-if="selectedElement != null && isModeKeyElement(selectedElement)"
    >
      <ToolbarModeKey
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:useDefaultStyle="
          updateModeKeyUseDefaultStyle(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @update:fontSize="
          updateModeKeyFontSize(selectedElement as ModeKeyElement, $event)
        "
        @update:strokeWidth="
          updateModeKeyStrokeWidth(selectedElement as ModeKeyElement, $event)
        "
        @update:alignment="
          updateModeKeyAlignment(selectedElement as ModeKeyElement, $event)
        "
        @update:color="
          updateModeKeyColor(selectedElement as ModeKeyElement, $event)
        "
        @update:bpm="
          updateModeKeyBpm(selectedElement as ModeKeyElement, $event)
        "
        @update:ignoreAttractions="
          updateModeKeyIgnoreAttractions(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @update:showAmbitus="
          updateModeKeyShowAmbitus(selectedElement as ModeKeyElement, $event)
        "
        @update:tempoAlignRight="
          updateModeKeyTempoAlignRight(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @update:tempo="
          setModeKeyTempo(selectedElement as ModeKeyElement, $event)
        "
        @update:heightAdjustment="
          updateModeKeyHeightAdjustment(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @update:marginTop="
          updateModeKeyMarginTop(selectedElement as ModeKeyElement, $event)
        "
        @update:marginBottom="
          updateModeKeyMarginBottom(selectedElement as ModeKeyElement, $event)
        "
        @update:permanentEnharmonicZo="
          updateModeKeyPermanentEnharmonicZo(
            selectedElement as ModeKeyElement,
            $event,
          )
        "
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as ModeKeyElement,
            $event,
          )
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
        :neumeKeyboard="neumeKeyboard"
        :key="`toolbar-neume-${selectedElement.id}-${selectedElement.keyHelper}`"
        :innerNeume="toolbarInnerNeume"
        @update:innerNeume="toolbarInnerNeume = $event"
        @update:accidental="
          setAccidental(selectedElement as NoteElement, $event)
        "
        @update:secondaryAccidental="
          setSecondaryAccidental(selectedElement as NoteElement, $event)
        "
        @update:tertiaryAccidental="
          setTertiaryAccidental(selectedElement as NoteElement, $event)
        "
        @update:fthora="setFthoraNote(selectedElement as NoteElement, $event)"
        @update:secondaryFthora="
          setSecondaryFthora(selectedElement as NoteElement, $event)
        "
        @update:tertiaryFthora="
          setTertiaryFthora(selectedElement as NoteElement, $event)
        "
        @update:chromaticFthoraNote="
          updateNoteChromaticFthoraNote(selectedElement as NoteElement, $event)
        "
        @update:secondaryChromaticFthoraNote="
          updateNoteSecondaryChromaticFthoraNote(
            selectedElement as NoteElement,
            $event,
          )
        "
        @update:tertiaryChromaticFthoraNote="
          updateNoteTertiaryChromaticFthoraNote(
            selectedElement as NoteElement,
            $event,
          )
        "
        @update:gorgon="setGorgon(selectedElement as NoteElement, $event)"
        @update:secondaryGorgon="
          setSecondaryGorgon(selectedElement as NoteElement, $event)
        "
        @update:klasma="setKlasma(selectedElement as NoteElement)"
        @update:time="setTimeNeume(selectedElement as NoteElement, $event)"
        @update:expression="
          setVocalExpression(selectedElement as NoteElement, $event)
        "
        @update:measureBar="
          setMeasureBarNote(selectedElement as NoteElement, $event)
        "
        @update:measureNumber="
          setMeasureNumber(selectedElement as NoteElement, $event)
        "
        @update:noteIndicator="
          updateNoteNoteIndicator(selectedElement as NoteElement, $event)
        "
        @update:ison="setIson(selectedElement as NoteElement, $event)"
        @update:koronis="
          updateNoteKoronis(selectedElement as NoteElement, $event)
        "
        @update:stavros="
          updateNoteStavros(selectedElement as NoteElement, $event)
        "
        @update:vareia="
          updateNoteVareia(selectedElement as NoteElement, $event)
        "
        @update:tie="setTie(selectedElement as NoteElement, $event)"
        @update:spaceAfter="
          updateNoteSpaceAfter(selectedElement as NoteElement, $event)
        "
        @update:ignoreAttractions="
          updateNoteIgnoreAttractions(selectedElement as NoteElement, $event)
        "
        @update:acceptsLyrics="
          updateNoteAcceptsLyrics(selectedElement as NoteElement, $event)
        "
        @update:sectionName="
          updateScoreElementSectionName(selectedElement as NoteElement, $event)
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
        :neumeKeyboard="neumeKeyboard"
        @update:fthora="
          setFthoraMartyria(selectedElement as MartyriaElement, $event)
        "
        @update:chromaticFthoraNote="
          updateMartyriaChromaticFthoraNote(
            selectedElement as MartyriaElement,
            $event,
          )
        "
        @update:tempoLeft="
          setMartyriaTempoLeft(selectedElement as MartyriaElement, $event)
        "
        @update:tempo="
          setMartyriaTempo(selectedElement as MartyriaElement, $event)
        "
        @update:tempoRight="
          setMartyriaTempoRight(selectedElement as MartyriaElement, $event)
        "
        @update:measureBar="
          setMeasureBarMartyria(selectedElement as MartyriaElement, $event)
        "
        @update:alignRight="
          updateMartyriaAlignRight(selectedElement as MartyriaElement, $event)
        "
        @update:auto="
          updateMartyriaAuto(selectedElement as MartyriaElement, $event)
        "
        @update:note="
          updateMartyriaNote(selectedElement as MartyriaElement, $event)
        "
        @update:scale="
          updateMartyriaScale(selectedElement as MartyriaElement, $event)
        "
        @update:bpm="
          updateMartyriaBpm(selectedElement as MartyriaElement, $event)
        "
        @update:spaceAfter="
          updateMartyriaSpaceAfter(selectedElement as MartyriaElement, $event)
        "
        @update:verticalOffset="
          updateMartyriaVerticalOffset(
            selectedElement as MartyriaElement,
            $event,
          )
        "
        @update:rootSignOverride="
          updateMartyriaRootSignOverride(
            selectedElement as MartyriaElement,
            $event,
          )
        "
        @update:sectionName="
          updateScoreElementSectionName(
            selectedElement as MartyriaElement,
            $event,
          )
        "
      />
    </template>
    <template v-if="selectedElement != null && isTempoElement(selectedElement)">
      <ToolbarTempo
        :element="selectedElement"
        :pageSetup="score.pageSetup"
        @update:bpm="updateTempoBpm(selectedElement as TempoElement, $event)"
        @update:spaceAfter="
          updateTempoSpaceAfter(selectedElement as TempoElement, $event)
        "
        @update:sectionName="
          updateScoreElementSectionName(selectedElement as TempoElement, $event)
        "
      />
    </template>
    <ToolbarLyricManager
      v-if="lyricManagerIsOpen"
      :lyrics="lyrics"
      :locked="lyricsLocked"
      @update:locked="updateLyricsLocked"
      @update:lyrics="updateStaffLyrics"
      @assignAcceptsLyrics="assignAcceptsLyricsFromCurrentLyrics"
      @close="closeLyricManager"
      @click="
        selectedElement = null;
        selectedLyrics = null;
      "
    ></ToolbarLyricManager>
    <ModeKeyDialog
      v-if="modeKeyDialogIsOpen"
      :element="selectedElement"
      :pageSetup="score.pageSetup"
      @update="
        updateModeKeyFromTemplate(selectedElement as ModeKeyElement, $event)
      "
      @update:useOptionalDiatonicFthoras="
        updatePageSetupUseOptionalDiatonicFthoras($event)
      "
      @close="closeModeKeyDialog"
    />
    <SyllablePositioningDialog
      v-if="syllablePositioningDialogIsOpen"
      :element="selectedElement"
      :previousElement="previousElementOnLine"
      :nextElement="nextElementOnLine"
      :pageSetup="score.pageSetup"
      @update="updateNoteAndSave(selectedElement as NoteElement, $event)"
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
      @update="updateEditorPreferences"
      @close="closeEditorPreferencesDialog"
    />
    <PageSetupDialog
      v-if="pageSetupDialogIsOpen"
      :pageSetup="score.pageSetup"
      :fonts="fonts"
      @update="updatePageSetup($event)"
      @close="closePageSetupDialog"
    />
    <ExportDialog
      v-if="exportDialogIsOpen"
      :loading="exportInProgress"
      :defaultFormat="exportFormat"
      @exportAsPng="exportAsPng"
      @exportAsMusicXml="exportAsMusicXml"
      @exportAsLatex="exportAsLatex"
      @close="closeExportDialog"
    />
    <template v-if="richTextBoxCalculation">
      <TextBoxRich
        class="richTextBoxCalculation"
        v-for="element in richTextBoxElements"
        :key="element.id"
        :element="element"
        :pageSetup="score.pageSetup"
        :fonts="fonts"
        @update:height="
          updateRichTextBoxHeight(element as RichTextBoxElement, $event)
        "
      />
    </template>
  </div>
</template>

<script lang="ts">
import 'vue3-tabs-chrome/dist/vue3-tabs-chrome.css';

import { getFontEmbedCSS, toPng } from 'html-to-image';
import { debounce, throttle } from 'throttle-debounce';
import { nextTick, StyleValue, toRaw } from 'vue';
import { Component, Inject, Prop, Vue, Watch } from 'vue-facing-decorator';
import Vue3TabsChrome, { Tab } from 'vue3-tabs-chrome';

import ContentEditable from '@/components/ContentEditable.vue';
import DropCap from '@/components/DropCap.vue';
import EditorPreferencesDialog from '@/components/EditorPreferencesDialog.vue';
import ExportDialog, {
  ExportAsLatexSettings,
  ExportAsMusicXmlSettings,
  ExportAsPngSettings,
  ExportFormat,
} from '@/components/ExportDialog.vue';
import FileMenuBar from '@/components/FileMenuBar.vue';
import ImageBox from '@/components/ImageBox.vue';
import ModeKey from '@/components/ModeKey.vue';
import ModeKeyDialog from '@/components/ModeKeyDialog.vue';
import EmptyNeumeBox from '@/components/NeumeBoxEmpty.vue';
import MartyriaNeumeBox from '@/components/NeumeBoxMartyria.vue';
import SyllableNeumeBox from '@/components/NeumeBoxSyllable.vue';
import TempoNeumeBox from '@/components/NeumeBoxTempo.vue';
import NeumeSelector from '@/components/NeumeSelector.vue';
import PageSetupDialog from '@/components/PageSetupDialog.vue';
import PlaybackSettingsDialog from '@/components/PlaybackSettingsDialog.vue';
import SearchText from '@/components/SearchText.vue';
import SyllablePositioningDialog from '@/components/SyllablePositioningDialog.vue';
import TextBox from '@/components/TextBox.vue';
import TextBoxRich from '@/components/TextBoxRich.vue';
import ToolbarDropCap from '@/components/ToolbarDropCap.vue';
import ToolbarImageBox from '@/components/ToolbarImageBox.vue';
import ToolbarLyricManager from '@/components/ToolbarLyricManager.vue';
import ToolbarLyrics from '@/components/ToolbarLyrics.vue';
import ToolbarMain from '@/components/ToolbarMain.vue';
import ToolbarMartyria from '@/components/ToolbarMartyria.vue';
import ToolbarModeKey from '@/components/ToolbarModeKey.vue';
import ToolbarNeume from '@/components/ToolbarNeume.vue';
import ToolbarTempo from '@/components/ToolbarTempo.vue';
import ToolbarTextBox from '@/components/ToolbarTextBox.vue';
import ToolbarTextBoxRich from '@/components/ToolbarTextBoxRich.vue';
import { EventBus } from '@/eventBus';
import {
  CloseWorkspacesArgs,
  CloseWorkspacesDisposition,
  ExportWorkspaceAsImageReplyArgs,
  FileMenuInsertTextboxArgs,
  FileMenuOpenImageArgs,
  FileMenuOpenScoreArgs,
  IpcMainChannels,
  IpcRendererChannels,
  ShowMessageBoxReplyArgs,
} from '@/ipc/ipcChannels';
import { EditorPreferences } from '@/models/EditorPreferences';
import {
  AcceptsLyricsOption,
  DropCapElement,
  ElementType,
  EmptyElement,
  ImageBoxElement,
  LineBreakType,
  MartyriaElement,
  ModeKeyElement,
  NoteElement,
  RichTextBoxElement,
  ScoreElement,
  TempoElement,
  TextBoxAlignment,
  TextBoxElement,
} from '@/models/Element';
import { EntryMode } from '@/models/EntryMode';
import { Footer } from '@/models/Footer';
import { Header } from '@/models/Header';
import { modeKeyTemplates } from '@/models/ModeKeys';
import {
  areVocalExpressionsEquivalent,
  getSecondaryNeume,
  measureBarAboveToLeft,
  onlyTakesBottomKlasma,
  onlyTakesTopGorgon,
  onlyTakesTopKlasma,
} from '@/models/NeumeReplacements';
import {
  Accidental,
  Fthora,
  GorgonNeume,
  Ison,
  MeasureBar,
  MeasureNumber,
  Note,
  QuantitativeNeume,
  RootSign,
  TempoSign,
  Tie,
  TimeNeume,
  VocalExpressionNeume,
} from '@/models/Neumes';
import { Page } from '@/models/Page';
import { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
import { Score } from '@/models/Score';
import { ScoreElementSelectionRange } from '@/models/ScoreElementSelectionRange';
import { Workspace, WorkspaceLocalStorage } from '@/models/Workspace';
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
import { Command, CommandFactory } from '@/services/history/CommandService';
import { ByzHtmlExporter } from '@/services/integration/ByzHtmlExporter';
import {
  LatexExporter,
  LatexExporterOptions,
} from '@/services/integration/LatexExporter';
import { MusicXmlExporter } from '@/services/integration/MusicXmlExporter';
import { IIpcService } from '@/services/ipc/IIpcService';
import { LayoutService } from '@/services/LayoutService';
import { LyricService } from '@/services/LyricService';
import { NeumeKeyboard } from '@/services/NeumeKeyboard';
import { IPlatformService } from '@/services/platform/IPlatformService';
import { SaveService } from '@/services/SaveService';
import { TextSearchService } from '@/services/TextSearchService';
import { GORTHMIKON, PELASTIKON, TATWEEL } from '@/utils/constants';
import { getCursorPosition } from '@/utils/getCursorPosition';
import { getFileNameFromPath } from '@/utils/getFileNameFromPath';
import { getFontFamilyWithFallback } from '@/utils/getFontFamilyWithFallback';
import { isElectron } from '@/utils/isElectron';
import { TokenMetadata } from '@/utils/replaceTokens';
import { shallowEquals } from '@/utils/shallowEquals';
import { TestFileGenerator } from '@/utils/TestFileGenerator';
import { TestFileType } from '@/utils/TestFileType';
import { withZoom } from '@/utils/withZoom';

interface Vue3TabsChromeComponent {
  addTab: (...newTabs: Array<Tab>) => void;
  removeTab: (tabKey: string | number) => void;
}

@Component({
  components: {
    SyllableNeumeBox,
    MartyriaNeumeBox,
    TempoNeumeBox,
    EmptyNeumeBox,
    NeumeSelector,
    ContentEditable,
    TextBox,
    TextBoxRich,
    DropCap,
    ImageBox,
    ModeKey,
    ToolbarImageBox,
    ToolbarTextBox,
    ToolbarTextBoxRich,
    ToolbarLyrics,
    ToolbarLyricManager,
    ToolbarModeKey,
    ToolbarNeume,
    ToolbarMartyria,
    ToolbarTempo,
    ToolbarDropCap,
    ToolbarMain,
    ModeKeyDialog,
    SyllablePositioningDialog,
    PlaybackSettingsDialog,
    EditorPreferencesDialog,
    ExportDialog,
    PageSetupDialog,
    FileMenuBar,
    Vue3TabsChrome,
    SearchText,
  },
})
export default class Editor extends Vue {
  @Prop() ipcService!: IIpcService;
  @Prop() platformService!: IPlatformService;
  @Prop() showFileMenuBar!: boolean;

  @Inject() readonly audioService!: AudioService;
  @Inject() readonly playbackService!: PlaybackService;
  @Inject() readonly textSearchService!: TextSearchService;
  @Inject() readonly lyricService!: LyricService;
  @Inject() readonly latexExporter!: LatexExporter;
  @Inject() readonly musicXmlExporter!: MusicXmlExporter;

  searchTextQuery: string = '';
  searchTextPanelIsOpen = false;

  LineBreakType = LineBreakType;

  isDevelopment: boolean = import.meta.env.DEV;

  isBrowser: boolean = !isElectron();

  isLoading: boolean = true;

  printMode: boolean = false;

  showGuides: boolean = false;

  workspaces: Workspace[] = [];
  selectedWorkspaceValue: Workspace = new Workspace();

  get selectedWorkspaceId() {
    return this.selectedWorkspace.id;
  }

  set selectedWorkspaceId(value: string) {
    this.selectedWorkspace =
      this.workspaces.find((x) => x.id === value) ?? new Workspace();
  }

  get rtl() {
    return this.score.pageSetup.melkiteRtl;
  }

  tabs: Tab[] = [];

  pages: Page[] = [];

  currentPageNumber: number = 0;

  modeKeyDialogIsOpen: boolean = false;
  syllablePositioningDialogIsOpen: boolean = false;
  playbackSettingsDialogIsOpen: boolean = false;
  pageSetupDialogIsOpen: boolean = false;
  editorPreferencesDialogIsOpen: boolean = false;
  exportDialogIsOpen: boolean = false;

  exportFormat: ExportFormat = ExportFormat.PNG;

  clipboard: ScoreElement[] = [];
  textBoxFormat: Partial<TextBoxElement> | null = null;
  richTextBoxCalculation = false;
  richTextBoxCalculationCount = 0;

  fonts: string[] = [];

  toolbarInnerNeume: string = 'Primary';

  neumeKeyboard: NeumeKeyboard = new NeumeKeyboard();
  keyboardModifier: string | null = null;

  audioElement: ScoreElement | null = null;
  playbackEvents: PlaybackSequenceEvent[] = [];
  playbackTimeInterval: ReturnType<typeof setTimeout> | null = null;
  audioOptions: PlaybackOptions = {
    useLegetos: false,
    useDefaultAttractionZo: true,
    frequencyDi: 196,
    speed: 1,

    diatonicIntervals: [12, 10, 8],
    hardChromaticIntervals: [6, 20, 4],
    softChromaticIntervals: [8, 14, 8],
    legetosIntervals: [8, 10, 12],
    zygosIntervals: [18, 4, 16, 4],
    zygosLegetosIntervals: [18, 4, 20, 4],
    spathiIntervals: [20, 4, 4, 14],
    klitonIntervals: [14, 12, 4],

    defaultAttractionZoMoria: -4,
    defaultAttractionKeMoria: 5,

    volumeIson: -4,
    volumeMelody: 0,

    alterationMultipliers: [0.5, 0.25, 0.75],

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

  editorPreferences: EditorPreferences = new EditorPreferences();

  byzHtmlExporter: ByzHtmlExporter = new ByzHtmlExporter();

  exportInProgress: boolean = false;

  // Commands
  noteElementCommandFactory: CommandFactory<NoteElement> =
    new CommandFactory<NoteElement>();

  martyriaCommandFactory: CommandFactory<MartyriaElement> =
    new CommandFactory<MartyriaElement>();

  tempoCommandFactory: CommandFactory<TempoElement> =
    new CommandFactory<TempoElement>();

  textBoxCommandFactory: CommandFactory<TextBoxElement> =
    new CommandFactory<TextBoxElement>();

  richTextBoxCommandFactory: CommandFactory<RichTextBoxElement> =
    new CommandFactory<RichTextBoxElement>();

  imageBoxCommandFactory: CommandFactory<ImageBoxElement> =
    new CommandFactory<ImageBoxElement>();

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

  assignLyricsThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.assignLyrics,
  );

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

  onFileMenuCopyAsHtmlThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.onFileMenuCopyAsHtml,
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
  setTieThrottled = throttle(this.keydownThrottleIntervalMs, this.setTie);
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

  updateNoteKoronisThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.updateNoteKoronis,
  );

  updateNoteVareiaThrottled = throttle(
    this.keydownThrottleIntervalMs,
    this.updateNoteVareia,
  );

  onWindowResizeThrottled = throttle(250, this.onWindowResize);
  onScrollThrottled = throttle(250, this.onScroll);

  saveDebounced = debounce(250, this.save);

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
    nextTick(() => {
      pageBackgroundElement.scrollTo(
        this.selectedWorkspace.scrollLeft,
        this.selectedWorkspace.scrollTop,
      );

      this.calculatePageNumber();
    });

    this.stopAudio();
  }

  get score() {
    return this.selectedWorkspace.score;
  }

  get elements() {
    return this.score?.staff.elements ?? [];
  }

  get richTextBoxElements() {
    return this.elements.filter(
      (x) => x.elementType === ElementType.RichTextBox,
    );
  }

  get lyrics() {
    return this.score?.staff.lyrics.text ?? '';
  }

  set lyrics(value: string) {
    this.score.staff.lyrics.text = value;
  }

  get lyricsLocked() {
    return this.score?.staff.lyrics.locked ?? false;
  }

  set lyricsLocked(value: boolean) {
    this.score.staff.lyrics.locked = value;
  }

  get lyricManagerIsOpen() {
    return this.selectedWorkspace.lyricManagerIsOpen;
  }

  set lyricManagerIsOpen(value: boolean) {
    this.selectedWorkspace.lyricManagerIsOpen = value;
  }

  get pageCount() {
    return this.pages.length;
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
      import.meta.env.VITE_TITLE
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
      this.toolbarInnerNeume = 'Primary';

      if (this.audioService.state === AudioState.Playing) {
        const event = this.playbackEvents.find(
          (x) => x.elementIndex === this.getElementIndex(element),
        );

        if (event) {
          this.audioService.jumpToEvent(event);
          this.selectedWorkspace.playbackTime = event.absoluteTime;
        }
      } else if (this.audioService.state === AudioState.Paused) {
        this.stopAudio();
      }
    }

    this.selectedWorkspace.selectedElement = element;
  }

  get previousElementOnLine() {
    const index = this.selectedElementIndex;

    if (index - 1 < 0) {
      return null;
    }

    return this.elements[index - 1].line === this.selectedElement?.line
      ? this.elements[index - 1]
      : null;
  }

  get nextElementOnLine() {
    const index = this.selectedElementIndex;

    if (index + 1 >= this.elements.length - 1) {
      return null;
    }

    return this.elements[index + 1].line === this.selectedElement?.line
      ? this.elements[index + 1]
      : null;
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

  get selectedRichTextBoxElement() {
    const selectedElement =
      this.selectedElement || this.selectedHeaderFooterElement;

    return selectedElement != null && this.isRichTextBoxElement(selectedElement)
      ? (selectedElement as RichTextBoxElement)
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
    } as StyleValue;
  }

  get headerStyle() {
    return {
      left: withZoom(this.score.pageSetup.leftMargin),
      top: withZoom(this.score.pageSetup.headerMargin),
    } as StyleValue;
  }

  getHeaderHorizontalRuleStyle(headerHeight: number) {
    return {
      left: withZoom(this.score.pageSetup.leftMargin),
      top: withZoom(
        this.score.pageSetup.headerMargin +
          headerHeight +
          this.score.pageSetup.headerHorizontalRuleMarginTop,
      ),
      color: this.score.pageSetup.headerHorizontalRuleColor,
      borderTopWidth: withZoom(
        this.score.pageSetup.headerHorizontalRuleThickness,
      ),
      width: withZoom(this.score.pageSetup.innerPageWidth),
    } as StyleValue;
  }

  get footerStyle() {
    return {
      left: withZoom(this.score.pageSetup.leftMargin),
      bottom: withZoom(this.score.pageSetup.footerMargin),
    } as StyleValue;
  }

  getFooterHorizontalRuleStyle(footerHeight: number) {
    return {
      left: withZoom(this.score.pageSetup.leftMargin),
      bottom: withZoom(
        this.score.pageSetup.footerMargin +
          footerHeight +
          this.score.pageSetup.footerHorizontalRuleMarginBottom,
      ),
      color: this.score.pageSetup.footerHorizontalRuleColor,
      borderTopWidth: withZoom(
        this.score.pageSetup.footerHorizontalRuleThickness,
      ),
      width: withZoom(this.score.pageSetup.innerPageWidth),
    } as StyleValue;
  }

  get guideStyleLeft() {
    return {
      left: withZoom(this.score.pageSetup.leftMargin - 1),
      height: withZoom(this.score.pageSetup.pageHeight),
    } as StyleValue;
  }

  get guideStyleRight() {
    return {
      right: withZoom(this.score.pageSetup.rightMargin - 1),
      height: withZoom(this.score.pageSetup.pageHeight),
    } as StyleValue;
  }

  get guideStyleTop() {
    return {
      top: withZoom(this.score.pageSetup.topMargin - 1),
      width: withZoom(this.score.pageSetup.pageWidth),
    } as StyleValue;
  }

  get guideStyleBottom() {
    return {
      bottom: withZoom(this.score.pageSetup.bottomMargin - 1),
      width: withZoom(this.score.pageSetup.pageWidth),
    } as StyleValue;
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

  @Watch('selectedWorkspaceId')
  onCurrentWorkspaceIdUpdated() {
    window.document.title = this.windowTitle;
  }

  @Watch('hasUnsavedChanges')
  onUnsavedChangesUpdated() {
    window.document.title = this.windowTitle;
  }

  getLyricStyle(element: NoteElement) {
    return {
      direction: this.rtl ? 'rtl' : undefined,
      top: withZoom(element.lyricsVerticalOffset),
      paddingLeft:
        !element.isFullMelisma && element.lyricsHorizontalOffset > 0
          ? withZoom(element.lyricsHorizontalOffset)
          : undefined,
      paddingRight:
        !element.isFullMelisma && element.lyricsHorizontalOffset < 0
          ? withZoom(-element.lyricsHorizontalOffset)
          : undefined,
      fontSize: element.lyricsUseDefaultStyle
        ? withZoom(this.score.pageSetup.lyricsDefaultFontSize)
        : withZoom(element.lyricsFontSize),
      fontFamily: element.lyricsUseDefaultStyle
        ? getFontFamilyWithFallback(
            this.score.pageSetup.lyricsDefaultFontFamily,
            this.score.pageSetup.neumeDefaultFontFamily,
          )
        : getFontFamilyWithFallback(
            element.lyricsFontFamily,
            this.score.pageSetup.neumeDefaultFontFamily,
          ),
      fontWeight: element.lyricsUseDefaultStyle
        ? this.score.pageSetup.lyricsDefaultFontWeight
        : element.lyricsFontWeight,
      fontStyle: element.lyricsUseDefaultStyle
        ? this.score.pageSetup.lyricsDefaultFontStyle
        : element.lyricsFontStyle,
      textDecoration: element.lyricsUseDefaultStyle
        ? undefined
        : element.lyricsTextDecoration,
      color: element.lyricsUseDefaultStyle
        ? this.score.pageSetup.lyricsDefaultColor
        : element.lyricsColor,
      webkitTextStrokeWidth: element.lyricsUseDefaultStyle
        ? withZoom(this.score.pageSetup.lyricsDefaultStrokeWidth)
        : withZoom(element.lyricsStrokeWidth),
      lineHeight: withZoom(element.lyricsFontHeight),
      left: element.alignLeft ? 0 : undefined,
      textAlign: element.alignLeft ? 'left' : undefined,
    } as StyleValue;
  }

  getEmptyBoxStyle(element: EmptyElement) {
    return {
      width: withZoom(element.width),
      height: withZoom(element.height),
    } as StyleValue;
  }

  getElementStyle(element: ScoreElement) {
    return {
      left: !this.rtl ? withZoom(element.x) : undefined,
      right: this.rtl ? withZoom(element.x) : undefined,
      top: withZoom(element.y),
    } as StyleValue;
  }

  getMelismaStyle(element: NoteElement) {
    return {
      width: withZoom(element.melismaWidth),
      minHeight: element.lyricsUseDefaultStyle
        ? withZoom(this.score.pageSetup.lyricsDefaultFontSize)
        : withZoom(element.lyricsFontSize),
    } as StyleValue;
  }

  getMelismaUnderscoreStyleOuter(element: NoteElement) {
    return {
      top: withZoom(element.melismaOffsetTop),
      height: withZoom(element.lyricsFontHeight),
      width: withZoom(element.melismaWidth),
    };
  }

  getMelismaUnderscoreStyleInner(element: NoteElement) {
    const thickness = this.score.pageSetup.lyricsMelismaThickness;

    const spacing = !element.isFullMelisma
      ? this.score.pageSetup.lyricsMelismaSpacing
      : 0;

    return {
      borderBottom: `${withZoom(thickness)} solid ${
        element.lyricsUseDefaultStyle
          ? this.score.pageSetup.lyricsDefaultColor
          : element.lyricsColor
      }`,
      left: withZoom(spacing),
      width: `calc(100% - ${withZoom(spacing)})`,
    };
  }

  getMelismaHyphenStyle(element: NoteElement, index: number) {
    return {
      left: withZoom(element.hyphenOffsets[index]),
    } as StyleValue;
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
    return header.elements[0] as TextBoxElement | RichTextBoxElement;
  }

  getFooterForPageIndex(pageIndex: number) {
    const pageNumber = pageIndex + 1;

    const footer = this.score.getFooterForPage(pageNumber);

    // Currently, footers only support a single text box element.
    return footer.elements[0] as TextBoxElement | RichTextBoxElement;
  }

  getTokenMetadata(pageIndex: number): TokenMetadata {
    return {
      pageNumber: pageIndex + this.score.pageSetup.firstPageNumber,
      numberOfPages: this.pageCount + this.score.pageSetup.firstPageNumber - 1,
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
        fontLoader.load('1rem "GFS Didot"'),
        fontLoader.load('1rem Neanes'),
        fontLoader.load('1rem NeanesStathisSeries'),
        fontLoader.load('1rem NeanesRTL'),
        fontLoader.load('1rem "Noto Naskh Arabic"'),
        fontLoader.load('1rem Omega'),
        fontLoader.load('1rem PFGoudyInitials'),
        fontLoader.load('1rem "Source Serif"'),
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
      this.editorPreferences = EditorPreferences.createFrom(
        JSON.parse(savedEditorPreferences),
      );
    }

    window.addEventListener('keydown', this.onKeydown);
    window.addEventListener('keyup', this.onKeyup);
    window.addEventListener('resize', this.onWindowResizeThrottled);

    EventBus.$on(IpcMainChannels.CloseWorkspaces, this.onCloseWorkspaces);
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
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsHtml,
      this.onFileMenuExportAsHtml,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsMusicXml,
      this.onFileMenuExportAsMusicXml,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsLatex,
      this.onFileMenuExportAsLatex,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuExportAsImage,
      this.onFileMenuExportAsImage,
    );
    EventBus.$on(IpcMainChannels.FileMenuUndo, this.onFileMenuUndo);
    EventBus.$on(IpcMainChannels.FileMenuRedo, this.onFileMenuRedo);
    EventBus.$on(IpcMainChannels.FileMenuCut, this.onFileMenuCut);
    EventBus.$on(IpcMainChannels.FileMenuCopy, this.onFileMenuCopy);
    EventBus.$on(IpcMainChannels.FileMenuCopyAsHtml, this.onFileMenuCopyAsHtml);
    EventBus.$on(IpcMainChannels.FileMenuCopyFormat, this.onFileMenuCopyFormat);
    EventBus.$on(IpcMainChannels.FileMenuPaste, this.onFileMenuPaste);
    EventBus.$on(
      IpcMainChannels.FileMenuPasteWithLyrics,
      this.onFileMenuPasteWithLyrics,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuPasteFormat,
      this.onFileMenuPasteFormat,
    );
    EventBus.$on(IpcMainChannels.FileMenuFind, this.onFileMenuFind);
    EventBus.$on(IpcMainChannels.FileMenuLyrics, this.onFileMenuLyrics);
    EventBus.$on(
      IpcMainChannels.FileMenuPreferences,
      this.onFileMenuPreferences,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertTextBox,
      this.onFileMenuInsertTextBox,
    );
    EventBus.$on(
      IpcMainChannels.FileMenuInsertRichTextBox,
      this.onFileMenuInsertRichTextBox,
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
      IpcMainChannels.FileMenuInsertImage,
      this.onFileMenuInsertImage,
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
      IpcMainChannels.FileMenuToolsCopyElementLink,
      this.onFileMenuToolsCopyElementLink,
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

  beforeUnmount() {
    // Remove the debugging variable from window
    (window as any)._editor = undefined;

    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('keyup', this.onKeyup);
    window.removeEventListener('resize', this.onWindowResizeThrottled);

    EventBus.$off(IpcMainChannels.CloseWorkspaces, this.onCloseWorkspaces);
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
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsHtml,
      this.onFileMenuExportAsHtml,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsMusicXml,
      this.onFileMenuExportAsMusicXml,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsLatex,
      this.onFileMenuExportAsLatex,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuExportAsImage,
      this.onFileMenuExportAsImage,
    );
    EventBus.$off(IpcMainChannels.FileMenuUndo, this.onFileMenuUndo);
    EventBus.$off(IpcMainChannels.FileMenuRedo, this.onFileMenuRedo);
    EventBus.$off(IpcMainChannels.FileMenuCut, this.onFileMenuCut);
    EventBus.$off(IpcMainChannels.FileMenuCopy, this.onFileMenuCopy);
    EventBus.$off(
      IpcMainChannels.FileMenuCopyAsHtml,
      this.onFileMenuCopyAsHtml,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuCopyFormat,
      this.onFileMenuCopyFormat,
    );
    EventBus.$off(IpcMainChannels.FileMenuPaste, this.onFileMenuPaste);
    EventBus.$off(
      IpcMainChannels.FileMenuPasteWithLyrics,
      this.onFileMenuPasteWithLyrics,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuPasteFormat,
      this.onFileMenuPasteFormat,
    );
    EventBus.$off(IpcMainChannels.FileMenuFind, this.onFileMenuFind);
    EventBus.$off(IpcMainChannels.FileMenuLyrics, this.onFileMenuLyrics);
    EventBus.$off(
      IpcMainChannels.FileMenuPreferences,
      this.onFileMenuPreferences,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertTextBox,
      this.onFileMenuInsertTextBox,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertRichTextBox,
      this.onFileMenuInsertRichTextBox,
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
      IpcMainChannels.FileMenuInsertImage,
      this.onFileMenuInsertImage,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertHeader,
      this.onFileMenuInsertHeader,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuInsertFooter,
      this.onFileMenuInsertFooter,
    );
    EventBus.$off(
      IpcMainChannels.FileMenuToolsCopyElementLink,
      this.onFileMenuToolsCopyElementLink,
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

  closeExportDialog() {
    this.exportDialogIsOpen = false;
  }

  openLyricManager() {
    this.lyricManagerIsOpen = true;
    this.refreshStaffLyrics();
  }

  closeLyricManager() {
    this.lyricManagerIsOpen = false;
  }

  updateEditorPreferences(form: EditorPreferences) {
    Object.assign(this.editorPreferences, form);

    this.saveEditorPreferences();

    this.editorPreferencesDialogIsOpen = false;
  }

  closeEditorPreferencesDialog() {
    this.editorPreferencesDialogIsOpen = false;
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
    document.execCommand('insertText', false, PELASTIKON);
  }

  insertGorthmikon() {
    document.execCommand('insertText', false, GORTHMIKON);
  }

  insertSpecialCharacter(character: string) {
    document.execCommand('insertText', false, character);
  }

  addQuantitativeNeume(
    quantitativeNeume: QuantitativeNeume,
    secondaryGorgonNeume: GorgonNeume | null = null,
  ) {
    if (this.selectedElement == null) {
      return;
    }

    const element = new NoteElement();
    element.lyricsColor = this.score.pageSetup.lyricsDefaultColor;
    element.lyricsFontFamily = this.score.pageSetup.lyricsDefaultFontFamily;
    element.lyricsFontSize = this.score.pageSetup.lyricsDefaultFontSize;
    element.lyricsFontStyle = this.score.pageSetup.lyricsDefaultFontStyle;
    element.lyricsFontWeight = this.score.pageSetup.lyricsDefaultFontWeight;
    element.lyricsStrokeWidth = this.score.pageSetup.lyricsDefaultStrokeWidth;

    element.quantitativeNeume = quantitativeNeume;
    // Special case for neumes with secondary gorgon
    if (getSecondaryNeume(quantitativeNeume) != null) {
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
      this.editorPreferences.getDefaultTempo(neume) ??
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

    element.color = this.score.pageSetup.dropCapDefaultColor;
    element.fontFamily = this.score.pageSetup.dropCapDefaultFontFamily;
    element.fontSize = this.score.pageSetup.dropCapDefaultFontSize;
    element.strokeWidth = this.score.pageSetup.dropCapDefaultStrokeWidth;
    element.fontWeight = this.score.pageSetup.dropCapDefaultFontWeight;
    element.fontStyle = this.score.pageSetup.dropCapDefaultFontStyle;
    element.lineHeight = this.score.pageSetup.dropCapDefaultLineHeight;
    element.lineSpan = this.score.pageSetup.dropCapDefaultLineSpan;

    if (after && !this.isLastElement(this.selectedElement)) {
      this.addScoreElement(element, this.selectedElementIndex + 1);
    } else {
      this.addScoreElement(element, this.selectedElementIndex);
    }

    this.selectedElement = element;
    this.save();

    nextTick(() => {
      const index = this.elements.indexOf(element);

      (this.$refs[`element-${index}`] as any)[0].focus();
    });
  }

  onClickAddImage() {
    EventBus.$emit(IpcRendererChannels.OpenImageDialog);
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

  toggleLineBreak(lineBreakType: LineBreakType | null) {
    if (this.selectedElement && !this.isLastElement(this.selectedElement)) {
      let lineBreak = !this.selectedElement.lineBreak;

      if (lineBreakType != this.selectedElement.lineBreakType) {
        lineBreak = true;
      }

      if (!lineBreak) {
        lineBreakType = null;
      }

      this.commandService.execute(
        this.scoreElementCommandFactory.create('update-properties', {
          target: this.selectedElement,
          newValues: {
            lineBreak,
            pageBreak: false,
            lineBreakType,
          },
        }),
      );

      this.save();
    }
  }

  updateScoreElementSectionName(
    element: ScoreElement,
    sectionName: string | null,
  ) {
    if (sectionName != null && sectionName.trim() == '') {
      sectionName = null;
    }

    this.commandService.execute(
      this.scoreElementCommandFactory.create('update-properties', {
        target: element,
        newValues: {
          sectionName,
        },
      }),
    );

    this.save();
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

  setLyrics(index: number, lyrics: string) {
    const elements = this.$refs[`lyrics-${index}`] as ContentEditable[];

    if (elements?.length > 0) {
      elements[0].setInnerText(lyrics);
    }
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

  isRichTextBoxElement(element: ScoreElement) {
    return element.elementType == ElementType.RichTextBox;
  }

  isDropCapElement(element: ScoreElement) {
    return element.elementType == ElementType.DropCap;
  }

  isModeKeyElement(element: ScoreElement) {
    return element.elementType == ElementType.ModeKey;
  }

  isImageBoxElement(element: ScoreElement) {
    return element.elementType == ElementType.ImageBox;
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

  onScroll() {
    this.calculatePageNumber();
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
        if (event.shiftKey) {
          this.onFileMenuCopyAsHtmlThrottled();
        } else {
          this.onCopyScoreElementsThrottled();
        }
        event.preventDefault();
        return;
      } else if (event.code === 'KeyV') {
        const includeLyrics = event.shiftKey;
        this.onPasteScoreElementsThrottled(includeLyrics);
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

    if (
      this.platformService.isMac &&
      this.isTextInputFocused() &&
      !this.dialogOpen
    ) {
      this.onKeydownMac(event);
    }

    if (this.selectedLyrics != null) {
      return this.onKeydownLyrics(event);
    }

    if (this.selectedElement?.elementType === ElementType.DropCap) {
      return this.onKeydownDropCap(event);
    }

    if (this.selectedElement?.elementType === ElementType.TextBox) {
      return this.onKeydownTextBox(event);
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
          if (!this.rtl) {
            this.moveLeftThrottled();
          } else {
            this.moveRightThrottled();
          }
          handled = true;
          break;
        case 'ArrowRight':
          if (!this.rtl) {
            this.moveRightThrottled();
          } else {
            this.moveLeftThrottled();
          }
          handled = true;
          break;
        case 'ArrowDown':
          if (
            (event.ctrlKey || event.metaKey) &&
            this.selectedElement?.elementType === ElementType.Note
          ) {
            const index = this.selectedElementIndex;

            this.focusLyrics(index, true);

            // Select All doesn't work until after the lyrics have been selected,
            // hence we call focus lyrics twice
            nextTick(() => {
              this.focusLyrics(index, true);
            });

            handled = true;
          }
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

        if (quantitativeMapping.acceptsLyricsOption != null) {
          if (this.selectedElement.elementType === ElementType.Note) {
            this.updateNoteAcceptsLyrics(
              this.selectedElement as NoteElement,
              quantitativeMapping.acceptsLyricsOption,
            );
          }
        } else {
          this.addQuantitativeNeumeThrottled(
            quantitativeMapping.neume as QuantitativeNeume,
          );
        }
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
            this.setVocalExpressionThrottled(
              noteElement,
              vocalExpressionMapping.neume as VocalExpressionNeume,
            );
          }
        }

        const tieMapping = this.neumeKeyboard.findTieMapping(
          event,
          this.keyboardModifier,
        );

        if (tieMapping != null) {
          handled = true;

          this.setTieThrottled(noteElement, tieMapping.neumes as Tie[]);
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

          if (hapliMapping.neume === TimeNeume.Koronis) {
            this.updateNoteKoronisThrottled(noteElement, !noteElement.koronis);
          } else {
            this.setTimeNeumeThrottled(
              noteElement,
              hapliMapping.neume as TimeNeume,
            );
          }
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

    switch (event.code) {
      case 'ArrowRight':
        if (event.shiftKey) {
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          if (!this.rtl) {
            this.moveToNextLyricBoxThrottled();
          } else {
            this.moveToPreviousLyricBoxThrottled();
          }
          handled = true;
        } else if (
          !this.rtl &&
          getCursorPosition() === this.getLyricLength(this.selectedLyrics!)
        ) {
          this.moveToNextLyricBoxThrottled();
          handled = true;
        } else if (this.rtl && getCursorPosition() === 0) {
          this.moveToPreviousLyricBoxThrottled();
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (event.shiftKey) {
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          if (!this.rtl) {
            this.moveToPreviousLyricBoxThrottled();
          } else {
            this.moveToNextLyricBoxThrottled();
          }
          handled = true;
        } else if (!this.rtl && getCursorPosition() === 0) {
          this.moveToPreviousLyricBoxThrottled();
          handled = true;
        } else if (
          this.rtl &&
          getCursorPosition() === this.getLyricLength(this.selectedLyrics!)
        ) {
          this.moveToNextLyricBoxThrottled();
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (event.shiftKey) {
          return;
        }

        if (event.ctrlKey || event.metaKey) {
          this.selectedElement = this.selectedLyrics;
          this.blurActiveElement();
          window.getSelection()?.removeAllRanges();
          handled = true;
        }
        break;
      case 'Space':
        // Ctrl + Space should add a normal space character
        if (event.ctrlKey || event.metaKey) {
          document.execCommand('insertText', false, ' ');
        } else {
          this.moveToNextLyricBoxThrottled(true);
        }
        handled = true;
        break;
      case 'Minus': {
        if (event.shiftKey) {
          document.execCommand('insertText', false, '_');
        } else {
          document.execCommand('insertText', false, '-');
        }

        // Ctrl key overrides the "go to next lyrics" (Alt key for mac)
        const overridden =
          (this.platformService.isMac && event.altKey) ||
          (!this.platformService.isMac && event.ctrlKey);

        if (
          !overridden &&
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
      case 'KeyJ': {
        if (!this.rtl) {
          return;
        }
        if (event.shiftKey) {
          document.execCommand('insertText', false, TATWEEL);
        } else {
          return;
        }

        // Ctrl key overrides the "go to next lyrics" (Alt key for mac)
        const overridden =
          (this.platformService.isMac && event.altKey) ||
          (!this.platformService.isMac && event.ctrlKey);

        if (
          !overridden &&
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
        if (!this.rtl && getCursorPosition() === 0) {
          this.moveLeftThrottled();
          handled = true;
        } else if (
          this.rtl &&
          getCursorPosition() === htmlElement.textElement.getInnerText().length
        ) {
          this.moveRightThrottled();
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (
          !this.rtl &&
          getCursorPosition() === htmlElement.textElement.getInnerText().length
        ) {
          this.moveRightThrottled();
          handled = true;
        } else if (this.rtl && getCursorPosition() === 0) {
          this.moveLeftThrottled();
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  onKeydownTextBox(event: KeyboardEvent) {
    let handled = false;

    const index = this.elements.indexOf(this.selectedElement!);
    const htmlElement = (this.$refs[`element-${index}`] as TextBox[])[0];

    switch (event.code) {
      case 'Tab':
        this.moveRightThrottled();
        handled = true;
        break;
      case 'ArrowLeft':
        if (!this.rtl && getCursorPosition() === 0) {
          this.moveLeftThrottled();
          handled = true;
        } else if (
          this.rtl &&
          getCursorPosition() === htmlElement.textElement.getInnerText().length
        ) {
          this.moveRightThrottled();
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (
          !this.rtl &&
          getCursorPosition() === htmlElement.textElement.getInnerText().length
        ) {
          this.moveRightThrottled();
          handled = true;
        } else if (this.rtl && getCursorPosition() === 0) {
          this.moveLeftThrottled();
          handled = true;
        }
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  /**
   * Handles text editing functionality for macOS
   */
  onKeydownMac(event: KeyboardEvent) {
    let handled = false;

    if (!event.metaKey) {
      return;
    }

    switch (event.code) {
      case 'KeyA':
        document.execCommand('selectAll');
        handled = true;
        break;
      case 'KeyC':
        document.execCommand('copy');
        handled = true;
        break;
      case 'KeyV':
        this.ipcService.paste();
        handled = true;
        break;
      case 'KeyX':
        document.execCommand('cut');
        handled = true;
        break;
      case 'KeyZ':
        if (event.shiftKey) {
          document.execCommand('redo');
        } else {
          document.execCommand('undo');
        }
        handled = true;
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

      this.refreshStaffLyrics();

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

  onPasteScoreElements(includeLyrics: boolean) {
    if (this.clipboard.length > 0 && this.selectedElement != null) {
      switch (this.entryMode) {
        case EntryMode.Insert:
          this.onPasteScoreElementsInsert(includeLyrics);
          break;
        case EntryMode.Auto:
          this.onPasteScoreElementsAuto(includeLyrics);
          break;
        case EntryMode.Edit:
          this.onPasteScoreElementsEdit(includeLyrics);
          break;
      }
    }
  }

  onPasteScoreElementsInsert(includeLyrics: boolean) {
    if (this.selectedElement == null || this.clipboard.length === 0) {
      return;
    }

    const insertAtIndex = this.isLastElement(this.selectedElement)
      ? this.selectedElementIndex
      : this.selectedElementIndex + 1;

    const newElements = this.clipboard.map((x) => x.clone({ includeLyrics }));

    this.addScoreElements(newElements, insertAtIndex);

    this.selectedElement = newElements.at(-1)!;
    this.save();
  }

  onPasteScoreElementsEdit(includeLyrics: boolean) {
    if (this.selectedElement == null || this.clipboard.length === 0) {
      return;
    }

    const commands: Command[] = [];

    let currentIndex = this.selectedElementIndex;

    for (const clipboardElement of this.clipboard) {
      const currentElement = this.elements[currentIndex];

      if (currentIndex >= this.elements.length - 1) {
        commands.push(
          this.scoreElementCommandFactory.create('add-to-collection', {
            elements: [clipboardElement.clone({ includeLyrics })],
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
                  (currentElement as NoteElement).getClipboardProperties(
                    includeLyrics,
                  ),
                  (clipboardElement as NoteElement).getClipboardProperties(
                    includeLyrics,
                  ),
                )
              ) {
                commands.push(
                  this.noteElementCommandFactory.create('update-properties', {
                    target: currentElement as NoteElement,
                    newValues: (
                      clipboardElement as NoteElement
                    ).getClipboardProperties(includeLyrics),
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
      this.refreshStaffLyrics();
    } else if (commands.length === 1) {
      this.commandService.execute(commands[0]);
      this.refreshStaffLyrics();
    }

    this.save();
  }

  onPasteScoreElementsAuto(includeLyrics: boolean) {
    this.moveRight();
    const currentIndex = this.selectedElementIndex;

    this.onPasteScoreElementsEdit(includeLyrics);

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
    ElementType.TextBox,
    ElementType.ImageBox,
    ElementType.ModeKey,
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
      // If the currently selected element is a drop cap or text box, blur it first
      if (this.selectedElement?.elementType === ElementType.DropCap) {
        (this.$refs[`element-${index}`] as DropCap[])[0].blur();
      } else if (this.selectedElement?.elementType === ElementType.TextBox) {
        (this.$refs[`element-${index}`] as TextBox[])[0].blur();
      }

      this.selectedElement = this.elements[index - 1];

      // If the newly selected element is a drop cap or text box, focus it
      if (this.selectedElement.elementType === ElementType.DropCap) {
        (this.$refs[`element-${index - 1}`] as DropCap[])[0].focus();
      } else if (this.selectedElement.elementType === ElementType.TextBox) {
        (this.$refs[`element-${index - 1}`] as TextBox[])[0].focus();
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
      } else if (this.selectedElement?.elementType === ElementType.TextBox) {
        (this.$refs[`element-${index}`] as TextBox[])[0].blur();
      }

      this.selectedElement = this.elements[index + 1];

      // If the newly selected element is a drop cap, focus it
      if (this.selectedElement.elementType === ElementType.DropCap) {
        (this.$refs[`element-${index + 1}`] as DropCap[])[0].focus();
      } else if (this.selectedElement.elementType === ElementType.TextBox) {
        (this.$refs[`element-${index + 1}`] as TextBox[])[0].focus();
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

  moveToNextLyricBox(clearMelisma: boolean = false) {
    const nextIndex = this.getNextLyricBoxIndex();

    if (nextIndex >= 0) {
      // If the lyrics for the last neume on the line have been updated to be so long
      // that the neume is moved to the next line by processPages(), then focusLyrics()
      // will fail if called on its own. This is because the order of events would
      // be the following:
      // focus next element => blur previous element => updateLyrics => processPages
      // and finally the newly selected element would lose focus because processPages
      // moves the element to the next line.

      // To prevent this we, preemptively call updateLyrics and then use nextTick
      // to only focus the next lyrics after the UI has been redrawn.

      const noteElement = this.selectedLyrics!;

      const text = (
        this.$refs[
          `lyrics-${this.elements.indexOf(noteElement)}`
        ] as ContentEditable[]
      )[0].getInnerText();

      this.updateLyrics(noteElement, text, clearMelisma);

      nextTick(() => {
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

  calculatePageNumber() {
    let maxPercentage = 0;
    let maxPercentageIndex = -1;

    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    for (let pageIndex = 0; pageIndex < this.pageCount; pageIndex++) {
      const rect = (this.$refs.pages as Element[])[
        pageIndex
      ].getBoundingClientRect();

      const percentage =
        Math.max(
          0,
          rect.top > 0
            ? Math.min(rect.height, viewportHeight - rect.top)
            : rect.bottom < viewportHeight
              ? rect.bottom
              : viewportHeight,
        ) / rect.height;

      if (percentage > maxPercentage) {
        maxPercentage = percentage;
        maxPercentageIndex = pageIndex;
      }
    }

    if (maxPercentageIndex >= 0) {
      this.currentPageNumber = maxPercentageIndex + 1;
    }
  }

  save(markUnsavedChanges: boolean = true) {
    if (markUnsavedChanges) {
      this.hasUnsavedChanges = true;
    }

    // Save the indexes of the visible pages
    const visiblePages = this.pages
      .map((_, i) => i)
      .filter((i) => this.pages[i].isVisible);

    const pages = LayoutService.processPages(toRaw(this.selectedWorkspace));

    // Set page visibility for the newly processed pages
    pages.forEach((x, index) => (x.isVisible = visiblePages.includes(index)));

    // Only re-render elements that are visible and that have been updated by processPages
    pages
      .filter((x) => x.isVisible)
      .forEach((page) => {
        page.lines.forEach((line) =>
          line.elements
            .filter((x) => x.updated)
            .forEach((element) => {
              element.keyHelper++;
            }),
        );
      });

    // Re-render headers and footers if they changed
    this.score.headersAndFooters
      .filter((x) => x.updated)
      .forEach((element) => {
        element.keyHelper++;
      });

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

            this.addWorkspace(workspace);
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

    if (openWorkspaceResults.silentPdf) {
      for (const file of openWorkspaceResults.files.filter((x) => x.success)) {
        this.openScore(file);
        await this.onFileMenuExportAsPdf();
        this.removeWorkspace(this.selectedWorkspace);
      }
    }

    if (openWorkspaceResults.silentHtml) {
      for (const file of openWorkspaceResults.files.filter((x) => x.success)) {
        this.openScore(file);
        await this.onFileMenuExportAsHtml();
        this.removeWorkspace(this.selectedWorkspace);
      }
    }

    if (openWorkspaceResults.silentLatex) {
      for (const file of openWorkspaceResults.files.filter((x) => x.success)) {
        const options = new LatexExporterOptions();
        options.includeModeKeys =
          openWorkspaceResults.silentLatexIncludeModeKeys ?? false;
        options.includeTextBoxes =
          openWorkspaceResults.silentLatexIncludeTextBoxes ?? false;
        this.openScore(file);
        await this.ipcService.exportWorkspaceAsLatex(
          this.selectedWorkspace,
          JSON.stringify(
            this.latexExporter.export(
              this.pages,
              this.score.pageSetup,
              options,
            ),
            null,
            2,
          ),
        );
        this.removeWorkspace(this.selectedWorkspace);
      }
    }

    if (
      openWorkspaceResults.silentPdf ||
      openWorkspaceResults.silentLatex ||
      openWorkspaceResults.silentHtml
    ) {
      await this.ipcService.exitApplication();
    }

    openWorkspaceResults.files
      .filter((x) => x.success)
      .forEach((x) => this.openScore(x));

    if (openWorkspaceResults.files.some((x) => x.success)) {
      return;
    }

    const workspace = new Workspace();
    workspace.tempFileName = this.getTempFilename();
    workspace.score = this.createDefaultScore();

    this.addWorkspace(workspace);

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

    this.pages = LayoutService.processPages(this.selectedWorkspace);
  }

  async saveWorkspace(workspace: Workspace) {
    if (!this.lyricsLocked) {
      this.lyrics = this.lyricService.extractLyrics(
        this.elements,
        this.score.pageSetup.disableGreekMelismata,
      );
    }

    return await this.ipcService.saveWorkspace(workspace);
  }

  async saveWorkspaceAs(workspace: Workspace) {
    if (!this.lyricsLocked) {
      this.lyrics = this.lyricService.extractLyrics(
        this.elements,
        this.score.pageSetup.disableGreekMelismata,
      );
    }

    return await this.ipcService.saveWorkspaceAs(workspace);
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
          title: import.meta.env.VITE_TITLE,
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
            ? await this.saveWorkspace(workspace)
            : await this.saveWorkspaceAs(workspace);

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
        await this.ipcService.exitApplication();
      }

      this.removeWorkspace(workspace);
    }

    return shouldClose;
  }

  async onCloseWorkspaces(args: CloseWorkspacesArgs) {
    const workspacesToClose: Workspace[] = this.workspaces.filter(
      (workspace) => {
        const index: number = this.tabs.findIndex(
          (x) => x.key === workspace.id,
        );

        const pivot: number = args.workspaceId
          ? this.tabs.findIndex((x) => x.key === args.workspaceId)
          : this.tabs.findIndex((x) => x.key === this.selectedWorkspace.id);

        switch (args.disposition) {
          case CloseWorkspacesDisposition.SELF:
            return index === pivot;
          case CloseWorkspacesDisposition.OTHERS:
            return index !== pivot;
          case CloseWorkspacesDisposition.LEFT:
            return index < pivot;
          case CloseWorkspacesDisposition.RIGHT:
            return index > pivot;
          default:
            throw new Error(`Error: Unknown disposition ${args.disposition}.`);
        }
      },
    );

    for (const workspaceToClose of workspacesToClose) {
      if (!(await this.closeWorkspace(workspaceToClose))) {
        // The user vetoed the operation.
        break;
      }
    }
  }

  async onCloseApplication() {
    // Give the user a chance to save their changes before exiting
    const unsavedWorkspaces = this.workspaces.filter(
      (x) => x.hasUnsavedChanges,
    );

    for (const workspace of unsavedWorkspaces) {
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

  setGorgon(element: NoteElement, neumes: GorgonNeume | GorgonNeume[]) {
    let equivalent = false;

    // Force neumes to be an array if it's not
    neumes = Array.isArray(neumes) ? neumes : [neumes];

    for (const neume of neumes) {
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

  setSecondaryGorgon(element: NoteElement, neume: GorgonNeume) {
    if (element.secondaryGorgonNeume === neume) {
      this.updateNoteGorgonSecondary(element, null);
    } else {
      this.updateNoteGorgonSecondary(element, neume);
    }
  }

  setFthoraNote(element: NoteElement, neumes: Fthora[]) {
    let equivalent = false;

    for (const neume of neumes) {
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

  setSecondaryFthora(element: NoteElement, neume: Fthora) {
    if (element.secondaryFthora === neume) {
      this.updateNoteFthoraSecondary(element, null);
    } else {
      this.updateNoteFthoraSecondary(element, neume);
    }
  }

  setTertiaryFthora(element: NoteElement, neume: Fthora) {
    if (element.tertiaryFthora === neume) {
      this.updateNoteFthoraTertiary(element, null);
    } else {
      this.updateNoteFthoraTertiary(element, neume);
    }
  }

  setFthoraMartyria(element: MartyriaElement, neume: Fthora) {
    if (element.fthora === neume) {
      this.updateMartyriaFthora(element, null);
    } else {
      this.updateMartyriaFthora(element, neume);
    }
  }

  setMartyriaTempoLeft(element: MartyriaElement, neume: TempoSign) {
    if (element.tempoLeft === neume) {
      this.updateMartyriaTempoLeft(element, null);
    } else {
      this.updateMartyriaTempoLeft(element, neume);
    }
  }

  setMartyriaTempo(element: MartyriaElement, neume: TempoSign) {
    if (element.tempo === neume) {
      this.updateMartyriaTempo(element, null);
    } else {
      this.updateMartyriaTempo(element, neume);
    }
  }

  setMartyriaTempoRight(element: MartyriaElement, neume: TempoSign) {
    if (element.tempoRight === neume) {
      this.updateMartyriaTempoRight(element, null);
    } else {
      this.updateMartyriaTempoRight(element, neume);
    }
  }

  setModeKeyTempo(element: ModeKeyElement, neume: TempoSign) {
    if (element.tempo === neume) {
      this.updateModeKeyTempo(element, null);
    } else {
      this.updateModeKeyTempo(element, neume);
    }
  }

  setAccidental(element: NoteElement, neume: Accidental) {
    if (element.accidental != null && element.accidental === neume) {
      this.updateNoteAccidental(element, null);
    } else {
      this.updateNoteAccidental(element, neume);
    }
  }

  setSecondaryAccidental(element: NoteElement, neume: Accidental) {
    if (
      element.secondaryAccidental != null &&
      element.secondaryAccidental === neume
    ) {
      this.updateNoteAccidentalSecondary(element, null);
    } else {
      this.updateNoteAccidentalSecondary(element, neume);
    }
  }

  setTertiaryAccidental(element: NoteElement, neume: Accidental) {
    if (
      element.tertiaryAccidental != null &&
      element.tertiaryAccidental === neume
    ) {
      this.updateNoteAccidentalTertiary(element, null);
    } else {
      this.updateNoteAccidentalTertiary(element, neume);
    }
  }

  setTimeNeume(element: NoteElement, neume: TimeNeume) {
    if (element.timeNeume === neume) {
      this.updateNoteTime(element, null);
    } else {
      this.updateNoteTime(element, neume);
    }
  }

  setMeasureNumber(element: NoteElement, neume: MeasureNumber) {
    if (neume === element.measureNumber) {
      this.updateNoteMeasureNumber(element, null);
    } else {
      this.updateNoteMeasureNumber(element, neume);
    }
  }

  setMeasureBarNote(element: NoteElement, neume: MeasureBar) {
    // Cycle through
    // Left
    // Right
    // Both Sides
    // None
    const normalizedMeasureBar = element.measureBarLeft?.endsWith('Above')
      ? measureBarAboveToLeft.get(element.measureBarLeft)
      : element.measureBarLeft;
    if (neume === normalizedMeasureBar && neume === element.measureBarRight) {
      this.updateNoteMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: null,
      });
    } else if (neume === normalizedMeasureBar) {
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

  setMeasureBarMartyria(element: MartyriaElement, neume: MeasureBar) {
    // Cycle through
    // Left
    // Right
    // Both Sides
    // None
    const normalizedMeasureBar = element.measureBarLeft?.endsWith('Above')
      ? measureBarAboveToLeft.get(element.measureBarLeft)
      : element.measureBarLeft;
    if (neume === normalizedMeasureBar && neume === element.measureBarRight) {
      this.updateMartyriaMeasureBar(element, {
        measureBarLeft: null,
        measureBarRight: null,
      });
    } else if (neume === normalizedMeasureBar) {
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

  setIson(element: NoteElement, neume: Ison) {
    if (neume === element.ison) {
      this.updateNoteIson(element, null);
    } else {
      this.updateNoteIson(element, neume);
    }
  }

  setVocalExpression(element: NoteElement, neume: VocalExpressionNeume) {
    if (
      element.vocalExpressionNeume != null &&
      areVocalExpressionsEquivalent(neume, element.vocalExpressionNeume)
    ) {
      this.updateNoteExpression(element, null);
    } else {
      this.updateNoteExpression(element, neume);
    }
  }

  setTie(element: NoteElement, neumes: Tie[]) {
    let equivalent = false;

    for (const neume of neumes) {
      // If previous neume was matched, set to the next neume in the cycle
      if (equivalent) {
        this.updateNoteTie(element, neume);
        return;
      }

      equivalent = element.tie === neume;
    }

    // We've cycled through all the neumes.
    // If we got to the end of the cycle, remove all
    // fthora neumes. Otherwise set fthora to the first neume
    // in the cycle.
    if (equivalent) {
      this.updateNoteTie(element, null);
    } else {
      this.updateNoteTie(element, neumes[0]);
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

    this.refreshStaffLyrics();
  }

  addScoreElements(elements: ScoreElement[], insertAtIndex?: number) {
    this.commandService.execute(
      this.scoreElementCommandFactory.create('add-to-collection', {
        elements,
        collection: this.elements,
        insertAtIndex,
      }),
    );

    this.refreshStaffLyrics();
  }

  replaceScoreElement(element: ScoreElement, replaceAtIndex: number) {
    this.commandService.execute(
      this.scoreElementCommandFactory.create('replace-element-in-collection', {
        element,
        collection: this.elements,
        replaceAtIndex,
      }),
    );

    this.refreshStaffLyrics();
  }

  removeScoreElement(element: ScoreElement) {
    this.commandService.execute(
      this.scoreElementCommandFactory.create('remove-from-collection', {
        element,
        collection: this.elements,
      }),
    );

    this.refreshStaffLyrics();
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

    // Force the element to update so that the neume toolbar updates
    element.keyHelper++;

    // If we change certain fields, we need to refresh the staff lyrics
    if (
      newValues.quantitativeNeume !== undefined ||
      newValues.tie !== undefined ||
      newValues.acceptsLyrics !== undefined
    ) {
      this.refreshStaffLyrics();
    }
  }

  updateNoteLyricsUseDefaultStyle(
    element: NoteElement,
    lyricsUseDefaultStyle: boolean,
  ) {
    this.updateNote(element, { lyricsUseDefaultStyle });
    this.save();
  }

  updateNoteLyricsColor(element: NoteElement, lyricsColor: string) {
    this.updateNote(element, { lyricsColor });
    this.save();
  }

  updateNoteLyricsFontFamily(element: NoteElement, lyricsFontFamily: string) {
    this.updateNote(element, { lyricsFontFamily });
    this.save();
  }

  updateNoteLyricsFontSize(element: NoteElement, lyricsFontSize: number) {
    this.updateNote(element, { lyricsFontSize });
    this.save();
  }

  updateNoteLyricsStrokeWidth(element: NoteElement, lyricsStrokeWidth: number) {
    this.updateNote(element, { lyricsStrokeWidth });
    this.save();
  }

  updateNoteLyricsFontWeight(element: NoteElement, bold: boolean) {
    this.updateNote(element, { lyricsFontWeight: bold ? '700' : '400' });
    this.save();
  }

  updateNoteLyricsFontStyle(element: NoteElement, italic: boolean) {
    this.updateNote(element, { lyricsFontStyle: italic ? 'italic' : 'normal' });
    this.save();
  }

  updateNoteLyricsTextDecoration(element: NoteElement, underline: boolean) {
    this.updateNote(element, {
      lyricsTextDecoration: underline ? 'underline' : 'none',
    });
    this.save();
  }

  updateNoteAccidental(element: NoteElement, accidental: Accidental | null) {
    this.updateNote(element, { accidental });
    this.save();
  }

  updateNoteAccidentalSecondary(
    element: NoteElement,
    secondaryAccidental: Accidental | null,
  ) {
    this.updateNote(element, { secondaryAccidental });
    this.save();
  }

  updateNoteAccidentalTertiary(
    element: NoteElement,
    tertiaryAccidental: Accidental | null,
  ) {
    this.updateNote(element, { tertiaryAccidental });
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
      chromaticFthoraNote = ScaleNote.Ga;
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

  updateNoteFthoraSecondary(
    element: NoteElement,
    secondaryFthora: Fthora | null,
  ) {
    let secondaryChromaticFthoraNote: ScaleNote | null = null;

    if (secondaryFthora === Fthora.SoftChromaticThi_TopSecondary) {
      secondaryChromaticFthoraNote = ScaleNote.Thi;
    } else if (secondaryFthora === Fthora.SoftChromaticPa_TopSecondary) {
      secondaryChromaticFthoraNote = ScaleNote.Ga;
    } else if (secondaryFthora === Fthora.HardChromaticThi_TopSecondary) {
      secondaryChromaticFthoraNote = ScaleNote.Thi;
    } else if (secondaryFthora === Fthora.HardChromaticPa_TopSecondary) {
      secondaryChromaticFthoraNote = ScaleNote.Pa;
    }

    this.updateNote(element, { secondaryFthora, secondaryChromaticFthoraNote });
    this.save();
  }

  updateNoteFthoraTertiary(
    element: NoteElement,
    tertiaryFthora: Fthora | null,
  ) {
    let tertiaryChromaticFthoraNote: ScaleNote | null = null;

    if (tertiaryFthora === Fthora.SoftChromaticThi_TopTertiary) {
      tertiaryChromaticFthoraNote = ScaleNote.Thi;
    } else if (tertiaryFthora === Fthora.SoftChromaticPa_TopTertiary) {
      tertiaryChromaticFthoraNote = ScaleNote.Ga;
    } else if (tertiaryFthora === Fthora.HardChromaticThi_TopTertiary) {
      tertiaryChromaticFthoraNote = ScaleNote.Thi;
    } else if (tertiaryFthora === Fthora.HardChromaticPa_TopTertiary) {
      tertiaryChromaticFthoraNote = ScaleNote.Pa;
    }

    this.updateNote(element, { tertiaryFthora, tertiaryChromaticFthoraNote });
    this.save();
  }

  updateNoteExpression(
    element: NoteElement,
    vocalExpressionNeume: VocalExpressionNeume | null,
  ) {
    // Replace the psifiston with a slanted psifiston if the previous neume
    // contains a long heteron
    if (vocalExpressionNeume === VocalExpressionNeume.Psifiston) {
      const index = this.getElementIndex(element);

      if (index > 0) {
        const previousElement = this.elements[index - 1];

        if (previousElement.elementType === ElementType.Note) {
          const previousNote = previousElement as NoteElement;

          if (
            previousNote.vocalExpressionNeume ===
            VocalExpressionNeume.HeteronConnectingLong
          ) {
            vocalExpressionNeume = VocalExpressionNeume.PsifistonSlanted;
          }
        }
      }
    }

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

  updateNoteGorgonSecondary(
    element: NoteElement,
    secondaryGorgonNeume: GorgonNeume | null,
  ) {
    this.updateNote(element, { secondaryGorgonNeume });
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

  updateNoteKoronis(element: NoteElement, koronis: boolean) {
    this.updateNote(element, { koronis });
    this.save();
  }

  updateNoteStavros(element: NoteElement, stavros: boolean) {
    this.updateNote(element, { stavros });
    this.save();
  }

  updateNoteVareia(element: NoteElement, vareia: boolean) {
    this.updateNote(element, { vareia });
    this.save();
  }

  updateNoteTie(element: NoteElement, tie: Tie | null) {
    this.updateNote(element, { tie });
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

  updateNoteAcceptsLyrics(
    element: NoteElement,
    acceptsLyrics: AcceptsLyricsOption,
  ) {
    this.updateNote(element, {
      acceptsLyrics: acceptsLyrics,
    });
    this.save();
  }

  updateNoteChromaticFthoraNote(
    element: NoteElement,
    chromaticFthoraNote: ScaleNote | null,
  ) {
    this.updateNote(element, { chromaticFthoraNote });
    this.save();
  }

  updateNoteSecondaryChromaticFthoraNote(
    element: NoteElement,
    secondaryChromaticFthoraNote: ScaleNote | null,
  ) {
    this.updateNote(element, { secondaryChromaticFthoraNote });
    this.save();
  }

  updateNoteTertiaryChromaticFthoraNote(
    element: NoteElement,
    tertiaryChromaticFthoraNote: ScaleNote | null,
  ) {
    this.updateNote(element, { tertiaryChromaticFthoraNote });
    this.save();
  }

  updateLyricsLocked(locked: boolean) {
    this.lyricsLocked = locked;
    this.hasUnsavedChanges = true;
  }

  updateStaffLyrics(lyrics: string) {
    this.lyrics = lyrics;
    this.assignLyricsThrottled();
    this.hasUnsavedChanges = true;
  }

  assignLyrics() {
    const updateCommands: Command[] = [];

    this.lyricService.assignLyrics(
      this.lyrics,
      this.elements,
      this.rtl,
      this.score.pageSetup.disableGreekMelismata,
      (note, lyrics) => this.setLyrics(this.getElementIndex(note), lyrics),
      (note, newValues) => {
        note.updated = true;
        updateCommands.push(
          this.noteElementCommandFactory.create('update-properties', {
            target: note,
            newValues,
          }),
        );
      },
      (dropCap, token) => {
        updateCommands.push(
          this.dropCapCommandFactory.create('update-properties', {
            target: dropCap,
            newValues: { content: token },
          }),
        );
      },
    );

    if (updateCommands.length > 0) {
      this.commandService.executeAsBatch(updateCommands, this.lyricsLocked);
      this.save();
    }
  }

  assignAcceptsLyricsFromCurrentLyrics() {
    const commands: Command[] = [];

    this.lyricService.assignAcceptsLyricsFromCurrentLyrics(
      this.elements,
      this.score.pageSetup.disableGreekMelismata,
      (note, acceptsLyrics) => {
        commands.push(
          this.noteElementCommandFactory.create('update-properties', {
            target: note,
            newValues: {
              acceptsLyrics,
            },
          }),
        );
      },
    );

    if (commands.length > 0) {
      this.commandService.executeAsBatch(commands);
      this.refreshStaffLyrics();
      this.save();
    }
  }

  updateLyrics(
    element: NoteElement,
    lyrics: string,
    clearMelisma: boolean = false,
  ) {
    const newValues = this.lyricService.getLyricUpdateValues(
      element,
      lyrics,
      this.elements,
      this.rtl,
      (note, lyrics) => this.setLyrics(this.getElementIndex(note), lyrics),
      clearMelisma,
    );

    if (newValues != null) {
      this.commandService.execute(
        this.noteElementCommandFactory.create('update-properties', {
          target: element,
          newValues,
        }),
      );
      this.refreshStaffLyrics();
      this.save();
    }
  }

  refreshStaffLyrics() {
    if (this.lyricsLocked) {
      this.assignLyrics();
    } else if (this.lyricManagerIsOpen) {
      this.lyrics = this.lyricService.extractLyrics(
        this.elements,
        this.score.pageSetup.disableGreekMelismata,
      );
    }
  }

  updateRichTextBox(
    element: RichTextBoxElement,
    newValues: Partial<RichTextBoxElement>,
  ) {
    if (newValues.rtl != null) {
      element.keyHelper++;
    }

    this.commandService.execute(
      this.richTextBoxCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    this.save();
  }

  updateRichTextBoxHeight(element: RichTextBoxElement, height: number) {
    // The height could be updated by many rich text box elements at once
    // (e.g. if PageSetup changes) so we debounce the save.
    element.height = height;
    this.richTextBoxCalculationCount++;
    this.saveDebounced();
  }

  updateRichTextBoxMarginTop(element: RichTextBoxElement, marginTop: number) {
    this.updateRichTextBox(element, { marginTop });
  }

  updateRichTextBoxMarginBottom(
    element: RichTextBoxElement,
    marginBottom: number,
  ) {
    this.updateRichTextBox(element, { marginBottom });
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

  updateTextBoxContentLeft(element: TextBoxElement, contentLeft: string) {
    this.updateTextBox(element, { contentLeft });
  }

  updateTextBoxContentCenter(element: TextBoxElement, contentCenter: string) {
    this.updateTextBox(element, { contentCenter });
  }

  updateTextBoxContentRight(element: TextBoxElement, contentRight: string) {
    this.updateTextBox(element, { contentRight });
  }

  updateTextBoxUseDefaultStyle(
    element: TextBoxElement,
    useDefaultStyle: boolean,
  ) {
    this.updateTextBox(element, { useDefaultStyle });
  }

  updateTextBoxMultipanel(element: TextBoxElement, multipanel: boolean) {
    this.updateTextBox(element, { multipanel });
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

  updateTextBoxLineHeight(element: TextBoxElement, lineHeight: number | null) {
    this.updateTextBox(element, { lineHeight });
  }

  updateTextBoxWidth(element: TextBoxElement, customWidth: number | null) {
    this.updateTextBox(element, { customWidth });
  }

  updateTextBoxHeight(element: TextBoxElement, customHeight: number | null) {
    this.updateTextBox(element, { customHeight });
  }

  updateTextBoxMarginTop(element: TextBoxElement, marginTop: number) {
    this.updateTextBox(element, { marginTop });
  }

  updateTextBoxMarginBottom(element: TextBoxElement, marginBottom: number) {
    this.updateTextBox(element, { marginBottom });
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

  updateModeKeyMarginTop(element: ModeKeyElement, marginTop: number) {
    this.updateModeKey(element, { marginTop });
  }

  updateModeKeyMarginBottom(element: ModeKeyElement, marginBottom: number) {
    this.updateModeKey(element, { marginBottom });
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
        this.editorPreferences.getDefaultTempo(tempo) ??
        TempoElement.getDefaultBpm(tempo);
    }

    this.updateModeKey(element, { tempo, bpm });
  }

  updateModeKeyBpm(element: ModeKeyElement, bpm: number) {
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

  updateModeKeyShowAmbitus(element: ModeKeyElement, showAmbitus: boolean) {
    this.updateModeKey(element, { showAmbitus });
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
      chromaticFthoraNote = ScaleNote.Ga;
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

  updateMartyriaTempoLeft(
    element: MartyriaElement,
    tempoLeft: TempoSign | null,
  ) {
    let bpm = element.bpm;

    if (tempoLeft != null) {
      bpm =
        this.editorPreferences.getDefaultTempo(tempoLeft) ??
        TempoElement.getDefaultBpm(tempoLeft);
    }

    this.updateMartyria(element, {
      tempoLeft,
      bpm,
      tempo: null,
      tempoRight: null,
    });
  }

  updateMartyriaTempo(element: MartyriaElement, tempo: TempoSign | null) {
    let bpm = element.bpm;

    if (tempo != null) {
      bpm =
        this.editorPreferences.getDefaultTempo(tempo) ??
        TempoElement.getDefaultBpm(tempo);
    }

    this.updateMartyria(element, {
      tempo,
      bpm,
      tempoLeft: null,
      tempoRight: null,
    });
  }

  updateMartyriaTempoRight(
    element: MartyriaElement,
    tempoRight: TempoSign | null,
  ) {
    let bpm = element.bpm;

    if (tempoRight != null) {
      bpm =
        this.editorPreferences.getDefaultTempo(tempoRight) ??
        TempoElement.getDefaultBpm(tempoRight);
    }

    this.updateMartyria(element, {
      tempoRight,
      bpm,
      tempoLeft: null,
      tempo: null,
    });
  }

  updateMartyriaBpm(element: MartyriaElement, bpm: number) {
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

  updateMartyriaVerticalOffset(
    element: MartyriaElement,
    verticalOffset: number,
  ) {
    this.updateMartyria(element, { verticalOffset });
    this.save();
  }

  updateMartyriaRootSignOverride(
    element: MartyriaElement,
    rootSignOverride: RootSign,
  ) {
    rootSignOverride = rootSignOverride || null;
    this.updateMartyria(element, { rootSignOverride });
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
    this.updateTempo(element, { bpm });
    this.save();
  }

  updateDropCap(element: DropCapElement, newValues: Partial<DropCapElement>) {
    this.commandService.execute(
      this.dropCapCommandFactory.create('update-properties', {
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

      this.refreshStaffLyrics();
    }

    this.save();
  }

  updateDropCapUseDefaultStyle(
    element: DropCapElement,
    useDefaultStyle: boolean,
  ) {
    this.updateDropCap(element, { useDefaultStyle });
  }

  updateDropCapFontSize(element: DropCapElement, fontSize: number) {
    this.updateDropCap(element, { fontSize });
  }

  updateDropCapFontFamily(element: DropCapElement, fontFamily: string) {
    this.updateDropCap(element, { fontFamily });
  }

  updateDropCapStrokeWidth(element: DropCapElement, strokeWidth: number) {
    this.updateDropCap(element, { strokeWidth });
  }

  updateDropCapColor(element: DropCapElement, color: string) {
    this.updateDropCap(element, { color });
  }

  updateDropCapFontWeight(element: DropCapElement, bold: boolean) {
    this.updateDropCap(element, { fontWeight: bold ? '700' : '400' });
  }

  updateDropCapFontStyle(element: DropCapElement, italic: boolean) {
    this.updateDropCap(element, { fontStyle: italic ? 'italic' : 'normal' });
  }

  updateDropCapLineHeight(element: DropCapElement, lineHeight: number | null) {
    this.updateDropCap(element, { lineHeight });
  }

  updateDropCapLineSpan(element: DropCapElement, lineSpan: number) {
    this.updateDropCap(element, { lineSpan });
  }

  updateDropCapWidth(element: DropCapElement, customWidth: number | null) {
    this.updateDropCap(element, { customWidth });
  }

  updateImageBox(
    element: ImageBoxElement,
    newValues: Partial<ImageBoxElement>,
  ) {
    this.commandService.execute(
      this.imageBoxCommandFactory.create('update-properties', {
        target: element,
        newValues: newValues,
      }),
    );

    this.save();
  }

  updateImageBoxInline(element: ImageBoxElement, inline: boolean) {
    this.updateImageBox(element, { inline });
  }

  updateImageBoxLockAspectRatio(
    element: ImageBoxElement,
    lockAspectRatio: boolean,
  ) {
    this.updateImageBox(element, { lockAspectRatio });
  }

  updateImageBoxAlignment(
    element: ImageBoxElement,
    alignment: TextBoxAlignment,
  ) {
    this.updateImageBox(element, { alignment });
  }

  updateImageBoxSize(
    element: ImageBoxElement,
    imageWidth: number,
    imageHeight: number,
  ) {
    this.updateImageBox(element, { imageWidth, imageHeight });
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

      this.refreshStaffLyrics();

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
    const needToRecalcRichTextBoxes =
      pageSetup.textBoxDefaultFontFamily !=
        this.score.pageSetup.textBoxDefaultFontFamily ||
      pageSetup.textBoxDefaultFontSize !=
        this.score.pageSetup.textBoxDefaultFontSize;

    const updateCommands: Command[] = [
      this.pageSetupCommandFactory.create('update-properties', {
        target: this.score.pageSetup,
        newValues: pageSetup,
      }),
    ];

    if (pageSetup.richHeaderFooter && !this.score.pageSetup.richHeaderFooter) {
      updateCommands.push(
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.headers.default.elements,
            element: this.createRichHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.headers.even.elements,
            element: this.createRichHeaderFooter('$p', 'Title', ''),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.headers.firstPage.elements,
            element: this.createRichHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.headers.odd.elements,
            element: this.createRichHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.footers.default.elements,
            element: this.createRichHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.footers.even.elements,
            element: this.createRichHeaderFooter('$p', 'Footer', ''),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.footers.firstPage.elements,
            element: this.createRichHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.footers.odd.elements,
            element: this.createRichHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          },
        ),
      );
    } else if (
      !pageSetup.richHeaderFooter &&
      this.score.pageSetup.richHeaderFooter
    ) {
      updateCommands.push(
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.headers.default.elements,
            element: this.createRegularHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.headers.even.elements,
            element: this.createRegularHeaderFooter('$p', 'Title', ''),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.headers.firstPage.elements,
            element: this.createRegularHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.headers.odd.elements,
            element: this.createRegularHeaderFooter('', 'Title', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.footers.default.elements,
            element: this.createRegularHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.footers.even.elements,
            element: this.createRegularHeaderFooter('$p', 'Footer', ''),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.footers.firstPage.elements,
            element: this.createRegularHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          },
        ),
        this.scoreElementCommandFactory.create(
          'replace-element-in-collection',
          {
            collection: this.score.footers.odd.elements,
            element: this.createRegularHeaderFooter('', 'Footer', '$p'),
            replaceAtIndex: 0,
          },
        ),
      );
    }

    this.commandService.executeAsBatch(updateCommands);

    if (needToRecalcRichTextBoxes) {
      this.recalculateRichTextBoxHeights();
    }

    this.save();
  }

  updatePageSetupUseOptionalDiatonicFthoras(
    useOptionalDiatonicFthoras: boolean,
  ) {
    this.commandService.execute(
      this.pageSetupCommandFactory.create('update-properties', {
        target: this.score.pageSetup,
        newValues: { useOptionalDiatonicFthoras },
      }),
    );

    this.save();
  }

  createRegularHeaderFooter(left: string, center: string, right: string) {
    const textbox = new TextBoxElement();
    textbox.multipanel = true;
    textbox.contentLeft = left;
    textbox.contentCenter = center;
    textbox.contentRight = right;
    return textbox;
  }

  createRichHeaderFooter(left: string, center: string, right: string) {
    const textbox = new RichTextBoxElement();
    textbox.multipanel = true;
    textbox.contentLeft = `${left}`;
    textbox.contentCenter = `<p style="text-align:center;">${center}</p>`;
    textbox.contentRight = `<p style="text-align:right;">${right}</p>`;
    return textbox;
  }

  updateEntryMode(mode: EntryMode) {
    this.entryMode = mode;
  }

  updateZoom(zoom: number) {
    if (zoom < 0.5 || zoom > 5) {
      if (this.ipcService.isShowMessageBoxSupported()) {
        this.ipcService.showMessageBox({
          type: 'error',
          title: 'Range overflow',
          message: this.$t('toolbar:main:invalidZoom'),
        });
      } else {
        alert(this.$t('toolbar:main:invalidZoom'));
      }
    } else {
      this.zoom = zoom;
      this.zoomToFit = false;
    }
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
          this.score.pageSetup.chrysanthineAccidentals,
        );

        if (this.playbackEvents.length === 0) {
          return;
        }

        const startAt = this.playbackEvents.find(
          (x) => x.elementIndex >= this.selectedElementIndex,
        );

        this.audioService.play(this.playbackEvents, this.audioOptions, startAt);

        if (startAt) {
          this.selectedWorkspace.playbackTime = startAt.absoluteTime;
        }

        this.startPlaybackClock();
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

      this.stopPlaybackClock();
    } catch (error) {
      console.error(error);
    }
  }

  pauseAudio() {
    try {
      this.audioService.togglePause();

      if (this.audioService.state === AudioState.Paused) {
        this.audioElement = null;
        this.stopPlaybackClock();
      } else {
        this.startPlaybackClock();
      }
    } catch (error) {
      console.error(error);
    }
  }

  startPlaybackClock() {
    this.stopPlaybackClock();

    this.playbackTimeInterval = setInterval(() => {
      this.selectedWorkspace.playbackTime += 0.1;
    }, 100);
  }

  stopPlaybackClock() {
    if (this.playbackTimeInterval != null) {
      clearInterval(this.playbackTimeInterval);
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

    this.selectedWorkspace.playbackBpm /= this.audioOptions.speed;
    this.selectedWorkspace.playbackBpm *= speed;

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
      this.selectedWorkspace.playbackTime = event.absoluteTime;
      this.selectedWorkspace.playbackBpm = event.bpm;

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

  onAudioServiceStop() {
    this.audioElement = null;

    this.stopPlaybackClock();
  }

  recalculateRichTextBoxHeights() {
    if (this.richTextBoxCalculation) {
      this.richTextBoxCalculation = false;
    }

    nextTick(async () => {
      const expectedCount = this.richTextBoxElements.length;
      this.richTextBoxCalculationCount = 0;
      this.richTextBoxCalculation = true;

      const maxTries = 4 * 30; // 30 seconds
      let tries = 1;
      let lastCount = 0;

      // Wait until all rich text boxes have updated
      const poll = (resolve: (value: unknown) => void) => {
        if (
          this.richTextBoxCalculationCount === expectedCount ||
          tries >= maxTries ||
          this.richTextBoxCalculationCount < lastCount
        ) {
          resolve(true);
        } else {
          tries++;
          lastCount = this.richTextBoxCalculationCount;
          setTimeout(() => poll(resolve), 250);
        }
      };

      await new Promise(poll);

      this.richTextBoxCalculation = false;
      this.saveDebounced();
    });
  }

  onFileMenuNewScore() {
    const workspace = new Workspace();
    workspace.tempFileName = this.getTempFilename();
    workspace.score = this.createDefaultScore();

    this.addWorkspace(workspace);

    this.selectedWorkspace = workspace;

    this.selectedElement =
      this.score.staff.elements[this.score.staff.elements.length - 1];
    this.save(false);
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

    nextTick(async () => {
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

    await nextTick();
    await this.ipcService.exportWorkspaceAsPdf(this.selectedWorkspace);
    this.printMode = false;

    // Re-focus the active element
    this.focusElement(activeElement);
  }

  async onFileMenuExportAsImage() {
    this.exportFormat = ExportFormat.PNG;
    this.exportDialogIsOpen = true;
  }

  async exportAsPng(args: ExportAsPngSettings) {
    let reply: ExportWorkspaceAsImageReplyArgs;

    try {
      reply = await this.ipcService.exportWorkspaceAsImage(
        this.selectedWorkspace,
        'png',
      );

      if (!reply.success) {
        return;
      }
    } catch (error) {
      console.error(error);
      return;
    }

    this.printMode = true;
    this.exportInProgress = true;

    // Blur the active element so that focus outlines and
    // blinking cursors don't show up in the printed page
    const activeElement = this.blurActiveElement();

    nextTick(async () => {
      try {
        const pages = this.$refs.pages as HTMLElement[];

        if (pages.length > 0) {
          const fontEmbedCSS = await getFontEmbedCSS(pages[0]);

          let pageNumber = 1;

          for (const page of pages) {
            const options = {
              fontEmbedCSS,
              pixelRatio: args.dpi / 96,
              style: { margin: '0' },
            } as any;

            if (args.transparentBackground) {
              options.style = {
                backgroundColor: 'transparent',
              };
            }

            let data = await toPng(page, options);

            if (data != null) {
              const fileName = reply.filePath.replace(
                /\.png$/,
                `-${pageNumber++}.png`,
              );

              data = data.replace(/^data:image\/png;base64,/, '');

              if (!(await this.ipcService.exportPageAsImage(fileName, data))) {
                break;
              }
            }
          }
        }

        if (args.openFolder) {
          await this.ipcService.showItemInFolder(
            reply.filePath.replace(/\.png$/, '-1.png'),
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        this.printMode = false;
        this.exportInProgress = false;
        this.closeExportDialog();
        // Re-focus the active element
        this.focusElement(activeElement);
      }
    });
  }

  // async exportAsSvg(openFolder: boolean) {
  //   let reply: ExportWorkspaceAsImageReplyArgs;

  //   try {
  //     reply = await this.ipcService.exportWorkspaceAsImage(
  //       this.selectedWorkspace,
  //       'svg',
  //     );

  //     if (!reply.success) {
  //       return;
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     return;
  //   }

  //   this.printMode = true;
  //   this.exportInProgress = true;

  //   // Blur the active element so that focus outlines and
  //   // blinking cursors don't show up in the printed page
  //   const activeElement = this.blurActiveElement();

  //   nextTick(async () => {
  //     try {
  //       const pages = this.$refs.pages as HTMLElement[];

  //       if (pages.length > 0) {
  //         const fontEmbedCSS = await getFontEmbedCSS(pages[0]);

  //         let pageNumber = 1;

  //         for (let page of pages) {
  //           const data = await toSvg(page, {
  //             fontEmbedCSS,
  //           });

  //           if (data != null) {
  //             const fileName = reply.filePath.replace(
  //               /.svg$/,
  //               `-${pageNumber++}.svg`,
  //             );

  //             if (!(await this.ipcService.exportPageAsImage(fileName, data))) {
  //               break;
  //             }
  //           }
  //         }
  //       }

  //       if (openFolder) {
  //         await this.ipcService.showItemInFolder(
  //           reply.filePath.replace(/\.svg$/, '-1.svg'),
  //         );
  //       }
  //     } catch (error) {
  //       console.error(error);
  //     } finally {
  //       this.printMode = false;
  //       this.exportInProgress = false;
  //       this.closeExportDialog();
  //       // Re-focus the active element
  //       this.focusElement(activeElement);
  //     }
  //   });
  // }

  async onFileMenuExportAsHtml() {
    await this.ipcService.exportWorkspaceAsHtml(
      this.selectedWorkspace,
      this.byzHtmlExporter.exportScore(this.score),
    );
  }

  onFileMenuExportAsMusicXml() {
    this.exportFormat = ExportFormat.MusicXml;
    this.exportDialogIsOpen = true;
  }

  onFileMenuExportAsLatex() {
    this.exportFormat = ExportFormat.Latex;
    this.exportDialogIsOpen = true;
  }

  async exportAsMusicXml(args: ExportAsMusicXmlSettings) {
    await this.ipcService.exportWorkspaceAsMusicXml(
      this.selectedWorkspace,
      this.musicXmlExporter.export(this.score, args.options),
      args.compressed,
      args.openFolder,
    );

    this.closeExportDialog();
  }

  async exportAsLatex(args: ExportAsLatexSettings) {
    await this.ipcService.exportWorkspaceAsLatex(
      this.selectedWorkspace,
      JSON.stringify(
        this.latexExporter.export(
          this.pages,
          this.score.pageSetup,
          args.options,
        ),
        null,
        2,
      ),
    );

    this.closeExportDialog();
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

  onFileMenuInsertTextBox(args?: FileMenuInsertTextboxArgs) {
    const element = new TextBoxElement();
    element.inline = args?.inline ?? false;

    if (element.inline) {
      element.color = this.score.pageSetup.lyricsDefaultColor;
      element.fontFamily = this.score.pageSetup.lyricsDefaultFontFamily;
      element.fontSize = this.score.pageSetup.lyricsDefaultFontSize;
      element.strokeWidth = this.score.pageSetup.lyricsDefaultStrokeWidth;
      element.bold = this.score.pageSetup.lyricsDefaultFontWeight === '700';
      element.italic = this.score.pageSetup.lyricsDefaultFontStyle === 'italic';
    } else {
      element.color = this.score.pageSetup.textBoxDefaultColor;
      element.fontFamily = this.score.pageSetup.textBoxDefaultFontFamily;
      element.fontSize = this.score.pageSetup.textBoxDefaultFontSize;
      element.strokeWidth = this.score.pageSetup.textBoxDefaultStrokeWidth;
      element.lineHeight = this.score.pageSetup.textBoxDefaultLineHeight;
      element.bold = this.score.pageSetup.textBoxDefaultFontWeight === '700';
      element.italic =
        this.score.pageSetup.textBoxDefaultFontStyle === 'italic';
    }

    this.addScoreElement(element, this.selectedElementIndex);

    this.selectedElement = element;

    this.save();

    nextTick(() => {
      const index = this.elements.indexOf(element);

      (this.$refs[`element-${index}`] as any)[0].focus();
    });
  }

  onFileMenuInsertRichTextBox() {
    const element = new RichTextBoxElement();
    element.rtl = this.score.pageSetup.melkiteRtl;

    this.addScoreElement(element, this.selectedElementIndex);

    this.selectedElement = element;

    this.save();

    nextTick(() => {
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

  onFileMenuInsertImage(args: FileMenuOpenImageArgs) {
    const element = new ImageBoxElement();

    element.data = args.data;
    element.imageWidth = args.imageWidth;
    element.imageHeight = args.imageHeight;

    this.addScoreElement(element, this.selectedElementIndex);

    this.selectedElement = element;

    this.save();
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

  onFileMenuToolsCopyElementLink() {
    if (this.selectedElement?.id != null) {
      navigator.clipboard.writeText(
        '#element-' + this.selectedElement.id.toString(),
      );
    }
  }

  async onFileMenuSave() {
    const workspace = this.selectedWorkspace;

    if (workspace.filePath != null) {
      const result = await this.saveWorkspace(workspace);
      if (result.success) {
        workspace.hasUnsavedChanges = false;
      }
    } else {
      const result = await this.saveWorkspaceAs(workspace);
      if (result.success) {
        workspace.filePath = result.filePath;
        workspace.hasUnsavedChanges = false;
      }
    }
  }

  async onFileMenuSaveAs() {
    const workspace = this.selectedWorkspace;

    const result = await this.saveWorkspaceAs(workspace);
    if (result.success) {
      workspace.filePath = result.filePath;
      workspace.hasUnsavedChanges = false;
    }
  }

  onFileMenuUndo() {
    const currentIndex = this.selectedElementIndex;

    const textBoxDefaultFontFamilyPrevious =
      this.score.pageSetup.textBoxDefaultFontFamily;
    const textBoxDefaultFontSizePrevious =
      this.score.pageSetup.textBoxDefaultFontSize;

    this.commandService.undo();

    // TODO this may be overkill, but the alternative is putting in place
    // an event system to only refresh on certain undo actions
    this.refreshStaffLyrics();

    if (currentIndex > -1) {
      // If the selected element was removed during the undo process, choose a new one
      this.selectedElement =
        this.elements[Math.min(currentIndex, this.elements.length - 1)];

      // Undo/redo could affect the note display in the neume toolbar (among other things),
      // so we force a refresh here
      this.selectedElement.keyHelper++;
    }

    if (
      textBoxDefaultFontFamilyPrevious !=
        this.score.pageSetup.textBoxDefaultFontFamily ||
      textBoxDefaultFontSizePrevious !=
        this.score.pageSetup.textBoxDefaultFontSize
    ) {
      this.recalculateRichTextBoxHeights();
    }

    this.save();
  }

  onFileMenuRedo() {
    const currentIndex = this.selectedElementIndex;

    const textBoxDefaultFontFamilyPrevious =
      this.score.pageSetup.textBoxDefaultFontFamily;
    const textBoxDefaultFontSizePrevious =
      this.score.pageSetup.textBoxDefaultFontSize;

    this.commandService.redo();

    // TODO this may be overkill, but the alternative is putting in place
    // an event system to only refresh on certain undo actions
    this.refreshStaffLyrics();

    if (currentIndex > -1) {
      // If the selected element was removed during the redo process, choose a new one
      this.selectedElement =
        this.elements[Math.min(currentIndex, this.elements.length - 1)];

      // Undo/redo could affect the note display in the neume toolbar (among other things),
      // so we force a refresh here
      this.selectedElement.keyHelper++;
    }

    if (
      textBoxDefaultFontFamilyPrevious !=
        this.score.pageSetup.textBoxDefaultFontFamily ||
      textBoxDefaultFontSizePrevious !=
        this.score.pageSetup.textBoxDefaultFontSize
    ) {
      this.recalculateRichTextBoxHeights();
    }

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

  onFileMenuCopyFormat() {
    if (this.selectedElement == null) {
      return;
    }

    if (this.selectedElement.elementType === ElementType.TextBox) {
      this.textBoxFormat = (
        this.selectedElement as TextBoxElement
      ).cloneFormat();
    }
  }

  onFileMenuCopyAsHtml() {
    let elements: ScoreElement[] = [];

    if (this.selectionRange != null) {
      elements = this.elements.filter(
        (x) => x.elementType != ElementType.Empty && this.isSelected(x),
      );
    } else if (this.selectedElement != null) {
      elements = [this.selectedElement];
    } else if (this.selectedLyrics != null) {
      elements = [this.selectedLyrics];
    }

    const html = this.byzHtmlExporter.exportElements(
      elements,
      this.score.pageSetup,
      0,
      true,
    );

    navigator.clipboard.writeText(html);
  }

  onFileMenuPaste() {
    if (!this.isTextInputFocused() && !this.dialogOpen) {
      this.onPasteScoreElements(false);
    } else {
      this.ipcService.paste();
    }
  }

  onFileMenuPasteWithLyrics() {
    if (!this.isTextInputFocused() && !this.dialogOpen) {
      this.onPasteScoreElements(true);
    } else {
      this.ipcService.paste();
    }
  }

  onFileMenuPasteFormat() {
    if (this.selectedElement == null || this.textBoxFormat == null) {
      return;
    }

    if (this.selectedElement.elementType === ElementType.TextBox) {
      this.updateTextBox(
        this.selectedElement as TextBoxElement,
        this.textBoxFormat,
      );
    }
  }

  onFileMenuFind() {
    if (this.searchTextPanelIsOpen) {
      (this.$refs.searchText as SearchText).focus();
    } else {
      this.searchTextPanelIsOpen = true;
    }
  }

  onFileMenuLyrics() {
    if (!this.dialogOpen) {
      if (this.lyricManagerIsOpen) {
        this.closeLyricManager();
      } else {
        this.openLyricManager();
      }
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

    this.addWorkspace(workspace);

    this.selectedWorkspace = workspace;

    this.currentFilePath = null;
    this.score.staff.elements.unshift(
      ...(TestFileGenerator.generateTestFile(testFileType, this.fonts) || []),
    );
    this.save();
  }

  onSearchText(args: { query: string; reverse?: boolean }) {
    const result = this.textSearchService.findTextInElements(
      args.query,
      this.elements,
      this.selectedElementIndex,
      args.reverse ?? false,
    );

    if (result != null) {
      this.selectedElement = result;

      (this.$refs.pages as HTMLElement[])[
        this.selectedElement.page - 1
      ].scrollIntoView();

      this.pages[this.selectedElement.page - 1].isVisible = true;

      nextTick(() => {
        if (this.selectedElement?.elementType === ElementType.Note) {
          (
            this.$refs[`element-${this.selectedElementIndex}`] as HTMLElement[]
          )[0].scrollIntoView();
        } else if (this.selectedElement?.elementType === ElementType.DropCap) {
          (
            this.$refs[`element-${this.selectedElementIndex}`] as DropCap[]
          )[0].$el.scrollIntoView();
        } else if (this.selectedElement?.elementType === ElementType.TextBox) {
          (
            this.$refs[`element-${this.selectedElementIndex}`] as TextBox[]
          )[0].$el.scrollIntoView();
        }
      });
    }
  }

  createDefaultModeKey(pageSetup: PageSetup) {
    const defaultTemplate = ModeKeyElement.createFromTemplate(
      modeKeyTemplates[0],
      this.score.pageSetup.useOptionalDiatonicFthoras,
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
    title.alignment = TextBoxAlignment.Center;
    title.color = score.pageSetup.textBoxDefaultColor;
    title.fontFamily = score.pageSetup.textBoxDefaultFontFamily;
    title.fontSize = score.pageSetup.textBoxDefaultFontSize;
    title.strokeWidth = score.pageSetup.textBoxDefaultStrokeWidth;
    title.lineHeight = score.pageSetup.textBoxDefaultLineHeight;
    title.bold = score.pageSetup.textBoxDefaultFontWeight === '700';
    title.italic = score.pageSetup.textBoxDefaultFontStyle === 'italic';

    score.staff.elements.unshift(
      title,
      this.createDefaultModeKey(score.pageSetup),
    );

    for (const element of score.headersAndFooters) {
      if (element.elementType === ElementType.TextBox) {
        (element as TextBoxElement).fontFamily =
          score.pageSetup.lyricsDefaultFontFamily;
        (element as TextBoxElement).strokeWidth =
          score.pageSetup.lyricsDefaultStrokeWidth;
      }
    }

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

      this.addWorkspace(workspace);

      this.selectedWorkspace = workspace;

      this.selectedElement = null;

      this.save(false);
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

  addWorkspace(workspace: Workspace) {
    this.workspaces.push(workspace);

    (this.$refs.tabs as Vue3TabsChromeComponent).addTab({
      label: this.getFileName(workspace),
      key: workspace.id,
    });
  }

  removeWorkspace(workspace: Workspace) {
    const index = this.workspaces.indexOf(workspace);

    this.workspaces.splice(index, 1);

    (this.$refs.tabs as Vue3TabsChromeComponent).removeTab(workspace.id);

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

  onTabClosed(tab: Tab) {
    const workspace = this.workspaces.find((x) => x.id === tab.key);

    if (workspace) {
      // If the workspace is still in our list, then call closeWorkspace.
      // closeWorkspace will decide whether to remove the tab and will
      // explicitly call removeTab. Returning false tells the tab component
      // to not close the tab, so that we can take care of it manually.
      this.closeWorkspace(workspace);
      return false;
    } else {
      // If we got here, the workspace was already removed by closeWorkspace.
      // We allow the tab component to close the tab by returning true.
      return true;
    }
  }

  openContextMenuForTab(event: PointerEvent, tab: Tab) {
    // TODO for browser version, show a custom (non-native) context menu.
    if (!this.isBrowser) {
      this.ipcService.openContextMenuForTab({ workspaceId: tab.key });
    }
  }

  renderTabLabel(tab: Tab) {
    const workspace = this.workspaces.find((x) => x.id === tab.key);

    return workspace ? this.getFileName(workspace) : '';
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
@media print {
  body * {
    visibility: hidden;
    overflow: visible !important;
  }
}
</style>
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

.lyrics:focus {
  outline: none;
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

.header-footer-hr {
  position: absolute;
  border-top-style: solid;
}

.red {
  color: #ed0000;
}

.neume-box .selected {
  background-color: rgb(238, 232, 170, 0.7);
}

.neume-box .audio-selected {
  background-color: rgba(152, 251, 152, 0.5);
}

.selectedTextbox {
  outline: 1px solid goldenrod;
}

.selectedTextbox:deep(.handle) {
  display: inline;
}

.selectedImagebox {
  border: 1px solid goldenrod;
}

.selectedLyrics {
  border: 1px solid goldenrod;
}

.selectedMelisma {
  display: none;
}

.richTextBoxCalculation {
  position: absolute;
  left: -99999999px;
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

.page-container {
  display: flex;
  flex-direction: column;
  overflow: auto;
  flex: 1;
}

:deep(.vue3-tabs-chrome) {
  padding: 0;
}

:deep(.vue3-tabs-chrome .tabs-background) {
  display: none;
}

:deep(.vue3-tabs-chrome .tabs-main) {
  border-radius: 0;
  background-color: silver;
  margin: 0;
  padding: 0.5rem 0.5rem 0.5rem 1rem;
}

:deep(.vue3-tabs-chrome .tabs-item) {
  border-right: 1px solid black;
}

:deep(.vue3-tabs-chrome .tabs-item:last-of-type) {
  border-right: none;
}

:deep(.vue3-tabs-chrome .tabs-item.active .tabs-main) {
  background-color: lightgray;
}

:deep(.vue3-tabs-chrome .tabs-item.active .tabs-close) {
  background-color: inherit;
}

:deep(.vue3-tabs-chrome .tabs-close) {
  right: 0.5rem;
}

:deep(.vue3-tabs-chrome .tabs-after) {
  height: 100%;
}

.workspace-tab-container {
  background-color: #b5b5b5;
}

.workspace-tab-new-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;

  font-size: 1.25rem;
  font-weight: bold;

  background-color: darkgray;

  border: none;

  cursor: default;
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
  overflow: hidden !important;
  white-space: pre;
}

.melisma-underscore {
  position: absolute;
  display: inline;
  white-space: pre;
}

.melisma.full {
  left: 0;
}

.melisma-underscore.full {
  left: 0;
}

.melisma.fullRtl {
  right: 0;
}

.melisma-hyphen {
  position: absolute;
}

.melisma-inner {
  height: 100%;
  position: relative;
  box-sizing: border-box;
}

.melisma-text {
  opacity: 0.5;
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

.section-name {
  position: absolute;
  top: calc(-20px * var(--zoom, 1));
  height: 100%;
  font-weight: bold;
}

.section-name-2 {
  position: absolute;
  font-weight: bold;
  left: calc(-22px * var(--zoom, 1));
  height: 100%;
  display: flex;
  align-items: center;
}

.print-only {
  display: none;
}

.page.print .empty-neume-box {
  visibility: hidden;
}

.page.print .text-box-container,
.page.print .rich-text-box-container,
.page.print .drop-cap-container,
.page.print .mode-key-container,
.page.print .image-box-container,
.page.print :deep(.text-box.multipanel) {
  border: none;
  outline: none;
}

.page.print .page-break,
.page.print .line-break,
.page.print .page-break-2,
.page.print .line-break-2,
.page.print :deep(.handle),
.page.print :deep(.ck-widget__type-around) {
  display: none !important;
}

.page.print :deep(.ck-widget) {
  outline: none !important;
}

.page.print .neume-box .selected {
  background-color: initial;
}

.page.print .melisma-text {
  opacity: 1;
}

.page.print :deep(.rich-text-editor) {
  overflow: hidden !important;
}

@media print {
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
    break-after: page;
  }

  .empty-neume-box {
    visibility: hidden;
  }

  .text-box-container {
    border: none;
    outline: none;
  }

  .drop-cap-container {
    border: none;
    outline: none;
  }

  .mode-key-container {
    border: none;
    outline: none;
  }

  .image-box-container {
    border: none;
    outline: none;
  }

  .selectedLyrics {
    border: none;
    outline: none;
  }

  .melisma-text {
    opacity: 1;
  }

  .file-menu-bar,
  .neume-selector-panel,
  .workspace-tab-container,
  .lyrics-toolbar,
  .lyric-manager-toolbar,
  .main-toolbar,
  .martyria-toolbar,
  .mode-key-toolbar,
  .neume-toolbar,
  .drop-cap-toolbar,
  .tempo-toolbar,
  .text-box-toolbar,
  .image-box-toolbar,
  .search-text-container,
  .section-name,
  .section-name-2,
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
