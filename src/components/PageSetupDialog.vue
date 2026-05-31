<template>
  <ModalDialog>
    <div class="outer-container">
      <div class="container">
        <div class="header">
          {{ $t(($) => $.dialog.pageSetup.root, { ns: 'dialog' }) }}
        </div>
        <div class="pane-container">
          <div class="left-pane">
            <div
              class="nav-item"
              :class="{ active: currentSection === 'pageSizeRef' }"
              @click="scrollTo(pageSizeRef)"
            >
              {{ $t(($) => $.dialog.pageSetup.pageSize, { ns: 'dialog' }) }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'marginsRef' }"
              @click="scrollTo(marginsRef)"
            >
              {{ $t(($) => $.dialog.pageSetup.margins, { ns: 'dialog' }) }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'spacingRef' }"
              @click="scrollTo(spacingRef)"
            >
              {{ $t(($) => $.dialog.pageSetup.spacing, { ns: 'dialog' }) }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'headersFootersRef' }"
              @click="scrollTo(headersFootersRef)"
            >
              {{
                $t(($) => $.dialog.pageSetup.headersAndFooters, {
                  ns: 'dialog',
                })
              }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'miscellaneousRef' }"
              @click="scrollTo(miscellaneousRef)"
            >
              {{
                $t(($) => $.dialog.pageSetup.miscellaneous, { ns: 'dialog' })
              }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'dropCapsRef' }"
              @click="scrollTo(dropCapsRef)"
            >
              {{ $t(($) => $.dialog.pageSetup.dropCaps, { ns: 'dialog' }) }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'lyricsRef' }"
              @click="scrollTo(lyricsRef)"
            >
              {{ $t(($) => $.dialog.pageSetup.lyrics, { ns: 'dialog' }) }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'textBoxesRef' }"
              @click="scrollTo(textBoxesRef)"
            >
              {{ $t(($) => $.dialog.pageSetup.textBoxes, { ns: 'dialog' }) }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'modeKeysRef' }"
              @click="scrollTo(modeKeysRef)"
            >
              {{ $t(($) => $.dialog.pageSetup.modeKeys, { ns: 'dialog' }) }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'neumesRef' }"
              @click="scrollTo(neumesRef)"
            >
              {{ $t(($) => $.dialog.pageSetup.neumes, { ns: 'dialog' }) }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'neumeStylesRef' }"
              @click="scrollTo(neumeStylesRef)"
            >
              {{ $t(($) => $.dialog.pageSetup.neumeStyles, { ns: 'dialog' }) }}
            </div>
          </div>
          <div
            ref="rightPaneRef"
            class="right-pane"
            @scroll="updateCurrentSectionThrottled"
          >
            <div ref="pageSizeRef" class="subheader">
              {{ $t(($) => $.dialog.pageSetup.pageSize, { ns: 'dialog' }) }}
            </div>
            <div class="form-group full">
              <div class="name">
                {{ $t(($) => $.dialog.pageSetup.paperSize, { ns: 'dialog' }) }}
              </div>
              <select v-model="pageSize" class="standard-select">
                <!-- TODO localize -->
                <option v-for="size in pageSizes" :key="size.name">
                  {{ size.name }}
                </option>
              </select>
            </div>
            <template v-if="form.pageSize === 'Custom'">
              <div class="form-group">
                <label class="custom-page-size-label name">{{
                  $t(($) => $.dialog.pageSetup.width, { ns: 'dialog' })
                }}</label>
                <InputUnit
                  v-model="form.pageWidthCustom"
                  class="unit-input"
                  type="number"
                  :unit="form.pageSizeUnit"
                  :min="1"
                  :max="10000"
                  :step="marginStep"
                  :precision="2"
                  @change="updatePageSize"
                />
                <span class="units">{{
                  $t(marginUnitLabel!, { ns: 'dialog' })
                }}</span>
              </div>
              <div class="form-group">
                <label class="custom-page-size-label name">{{
                  $t(($) => $.dialog.pageSetup.height, { ns: 'dialog' })
                }}</label>
                <InputUnit
                  v-model="form.pageHeightCustom"
                  class="unit-input"
                  type="number"
                  :unit="form.pageSizeUnit"
                  :min="1"
                  :max="10000"
                  :step="marginStep"
                  :precision="2"
                  @change="updatePageSize"
                />
                <span class="units">{{
                  $t(marginUnitLabel!, { ns: 'dialog' })
                }}</span>
              </div>
            </template>
            <div class="form-group full">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.orientation, { ns: 'dialog' })
                }}
              </div>
              <div class="row">
                <div
                  class="radio-button page-orientation-button"
                  :class="{ selected: !landscape }"
                  @click="landscape = false"
                >
                  {{ $t(($) => $.dialog.pageSetup.portrait, { ns: 'dialog' }) }}
                </div>
                <div
                  class="radio-button page-orientation-button"
                  :class="{ selected: landscape }"
                  @click="landscape = true"
                >
                  {{
                    $t(($) => $.dialog.pageSetup.landscape, { ns: 'dialog' })
                  }}
                </div>
              </div>
            </div>
            <div class="form-group full">
              <div class="name">
                {{ $t(($) => $.dialog.pageSetup.unit, { ns: 'dialog' }) }}
              </div>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.unitDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <select v-model="form.pageSizeUnit" class="standard-select">
                <option value="in">
                  {{ $t(($) => $.dialog.pageSetup.in, { ns: 'dialog' }) }}
                </option>
                <option value="cm">
                  {{ $t(($) => $.dialog.pageSetup.cm, { ns: 'dialog' }) }}
                </option>
                <option value="mm">
                  {{ $t(($) => $.dialog.pageSetup.mm, { ns: 'dialog' }) }}
                </option>
                <option value="pt">
                  {{ $t(($) => $.dialog.pageSetup.pt, { ns: 'dialog' }) }}
                </option>
                <option value="pc">
                  {{ $t(($) => $.dialog.pageSetup.pc, { ns: 'dialog' }) }}
                </option>
              </select>
            </div>
            <div ref="marginsRef" class="subheader">
              {{ $t(($) => $.dialog.pageSetup.margins, { ns: 'dialog' }) }}
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t(($) => $.dialog.common.top, { ns: 'dialog' })
              }}</label>
              <input
                class="margin-input"
                type="number"
                min="0"
                :step="marginStep"
                :value="topMargin"
                @change="
                  updateTopMargin(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t(($) => $.dialog.common.bottom, { ns: 'dialog' })
              }}</label>
              <input
                class="margin-input"
                type="number"
                min="0"
                :step="marginStep"
                :value="bottomMargin"
                @change="
                  updateBottomMargin(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t(($) => $.dialog.common.left, { ns: 'dialog' })
              }}</label>
              <input
                class="margin-input"
                type="number"
                min="0"
                :step="marginStep"
                :value="leftMargin"
                @change="
                  updateLeftMargin(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t(($) => $.dialog.common.right, { ns: 'dialog' })
              }}</label>
              <input
                class="margin-input"
                type="number"
                min="0"
                :step="marginStep"
                :value="rightMargin"
                @change="
                  updateRightMargin(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t(($) => $.dialog.pageSetup.header, { ns: 'dialog' })
              }}</label>
              <input
                class="margin-input"
                type="number"
                min="0"
                :step="marginStep"
                :value="headerMargin"
                @change="
                  updateHeaderMargin(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t(($) => $.dialog.pageSetup.footer, { ns: 'dialog' })
              }}</label>
              <input
                class="margin-input"
                type="number"
                min="0"
                :step="marginStep"
                :value="footerMargin"
                @change="
                  updateFooterMargin(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div ref="spacingRef" class="subheader">
              {{ $t(($) => $.dialog.pageSetup.spacing, { ns: 'dialog' }) }}
            </div>
            <div class="form-group full">
              <label class="name">{{
                $t(($) => $.dialog.pageSetup.neumeSpacing, { ns: 'dialog' })
              }}</label>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.neumeSpacingDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <InputUnit
                v-model="form.neumeDefaultSpacing"
                class="unit-input"
                type="number"
                :unit="form.pageSizeUnit"
                :min="-neumeSpacingMax"
                :max="neumeSpacingMax"
                :step="spacingStep"
                :precision="3"
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{
                $t(($) => $.dialog.pageSetup.martyriaVerticalOffset, {
                  ns: 'dialog',
                })
              }}</label>
              <div class="description">
                {{
                  $t(
                    ($) => $.dialog.pageSetup.martyriaVerticalOffsetDescription,
                    {
                      ns: 'dialog',
                    },
                  )
                }}
              </div>
              <InputUnit
                v-model="form.martyriaVerticalOffset"
                class="unit-input"
                type="number"
                :unit="form.pageSizeUnit"
                :min="-neumeSpacingMax"
                :max="neumeSpacingMax"
                :step="spacingStep"
                :precision="3"
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{
                $t(($) => $.dialog.pageSetup.lyricsV, { ns: 'dialog' })
              }}</label>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.lyricsVDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                class="unit-input"
                type="number"
                :step="spacingStep"
                :value="lyricsVerticalOffset"
                @change="
                  updateLyricsVerticalOffset(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{
                $t(($) => $.dialog.pageSetup.lyricsH, { ns: 'dialog' })
              }}</label>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.lyricsHDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                class="unit-input"
                type="number"
                :step="spacingStep"
                :value="lyricsMinimumSpacing"
                @change="
                  updateLyricsMinimumSpacing(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              />
              <span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{
                $t(($) => $.dialog.pageSetup.line, { ns: 'dialog' })
              }}</label>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.lineSpacingDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                class="unit-input"
                type="number"
                min="0"
                :step="spacingStep"
                :value="lineHeight"
                @change="
                  updateLineHeight(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{
                $t(($) => $.dialog.pageSetup.hyphens, { ns: 'dialog' })
              }}</label>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.hyphenSpacingDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                class="unit-input"
                type="number"
                min="0"
                :step="spacingStep"
                :value="hyphenSpacing"
                @change="
                  updateHyphenSpacing(
                    Number(($event.target as HTMLInputElement).value),
                  )
                "
              /><span class="units">{{
                $t(marginUnitLabel!, { ns: 'dialog' })
              }}</span>
            </div>
            <div ref="headersFootersRef" class="subheader">
              {{
                $t(($) => $.dialog.pageSetup.headersAndFooters, {
                  ns: 'dialog',
                })
              }}
            </div>

            <div class="form-group">
              <input
                id="page-setup-dialog-show-header"
                v-model="form.showHeader"
                type="checkbox"
              />
              <label for="page-setup-dialog-show-header">{{
                $t(($) => $.dialog.pageSetup.includeHeader, { ns: 'dialog' })
              }}</label>
            </div>

            <div class="form-group">
              <input
                id="page-setup-dialog-show-footer"
                v-model="form.showFooter"
                type="checkbox"
              />
              <label for="page-setup-dialog-show-footer">{{
                $t(($) => $.dialog.pageSetup.includeFooter, { ns: 'dialog' })
              }}</label>
            </div>

            <div class="form-group">
              <input
                id="page-setup-dialog-different-first-page"
                v-model="form.headerDifferentFirstPage"
                type="checkbox"
              />
              <label for="page-setup-dialog-different-first-page">{{
                $t(($) => $.dialog.pageSetup.differentFirstPage, {
                  ns: 'dialog',
                })
              }}</label>
            </div>
            <div class="form-group">
              <input
                id="page-setup-dialog-different-odd-even"
                v-model="form.headerDifferentOddEven"
                type="checkbox"
              />
              <label for="page-setup-dialog-different-odd-even">{{
                $t(($) => $.dialog.pageSetup.differentOddAndEven, {
                  ns: 'dialog',
                })
              }}</label>
            </div>
            <div class="form-group">
              <input
                id="page-setup-dialog-rich-header-footer"
                v-model="form.richHeaderFooter"
                type="checkbox"
              />
              <label for="page-setup-dialog-rich-header-footer">{{
                $t(($) => $.dialog.pageSetup.richHeaderFooter, { ns: 'dialog' })
              }}</label>
            </div>

            <div class="form-group full">
              <label class="name">{{
                $t(($) => $.dialog.pageSetup.firstPageNumber, { ns: 'dialog' })
              }}</label>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.firstPageNumberDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <InputUnit
                v-model="form.firstPageNumber"
                class="unit-input"
                unit="unitless"
                :step="1"
                :precision="0"
                :default-value="1"
              />
            </div>

            <div class="form-group full">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.headerHorizontalRule, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                id="page-setup-dialog-header-hr"
                v-model="form.showHeaderHorizontalRule"
                type="checkbox"
              />
              <label for="page-setup-dialog-header-hr">
                {{
                  $t(
                    ($) =>
                      $.dialog.pageSetup.showHeaderHorizontalRuleDescription,
                    {
                      ns: 'dialog',
                    },
                  )
                }}
              </label>

              <template v-if="form.showHeaderHorizontalRule">
                <div class="form-group row">
                  <label class="header-rule-label name">{{
                    $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
                  }}</label>
                  <ColorPicker
                    v-model="form.headerHorizontalRuleColor"
                    class="neume-colors-input"
                  />
                </div>

                <div class="form-group">
                  <label class="header-rule-label name">{{
                    $t(($) => $.dialog.pageSetup.thickness, { ns: 'dialog' })
                  }}</label>
                  <InputUnit
                    v-model="form.headerHorizontalRuleThickness"
                    class="margin-input"
                    unit="pt"
                    :min="0"
                    :max="100"
                    :step="0.5"
                    :precision="1"
                  />
                </div>

                <div class="form-group">
                  <label class="header-rule-label name">{{
                    $t(($) => $.dialog.pageSetup.marginTop, { ns: 'dialog' })
                  }}</label>
                  <InputUnit
                    v-model="form.headerHorizontalRuleMarginTop"
                    class="margin-input"
                    unit="pt"
                    :min="0"
                    :max="1000"
                    :step="0.5"
                    :precision="1"
                  />
                </div>

                <div class="form-group">
                  <label class="header-rule-label name">{{
                    $t(($) => $.dialog.pageSetup.marginBottom, { ns: 'dialog' })
                  }}</label>
                  <InputUnit
                    v-model="form.headerHorizontalRuleMarginBottom"
                    class="margin-input"
                    unit="pt"
                    :min="0"
                    :max="1000"
                    :step="0.5"
                    :precision="1"
                  />
                </div>

                <template v-if="form.headerDifferentFirstPage">
                  <div class="form-group">
                    <input
                      id="page-setup-dialog-header-excludeHeaderHorizontalRuleFirstPage"
                      v-model="form.excludeHeaderHorizontalRuleFirstPage"
                      class="header-rule-checkbox"
                      type="checkbox"
                    />
                    <label
                      for="page-setup-dialog-header-excludeHeaderHorizontalRuleFirstPage"
                    >
                      {{
                        $t(
                          ($) =>
                            $.dialog.pageSetup
                              .excludeHorizontalRuleFirstPageDescription,
                          { ns: 'dialog' },
                        )
                      }}
                    </label>
                  </div>
                </template>
                <template v-if="form.headerDifferentOddEven">
                  <div class="form-group">
                    <input
                      id="page-setup-dialog-header-excludeHeaderHorizontalRuleOddPage"
                      v-model="form.excludeHeaderHorizontalRuleOddPage"
                      class="header-rule-checkbox"
                      type="checkbox"
                    />
                    <label
                      for="page-setup-dialog-header-excludeHeaderHorizontalRuleOddPage"
                    >
                      {{
                        $t(
                          ($) =>
                            $.dialog.pageSetup
                              .excludeHorizontalRuleOddPageDescription,
                          { ns: 'dialog' },
                        )
                      }}
                    </label>
                  </div>
                  <div class="form-group">
                    <input
                      id="page-setup-dialog-header-excludeHeaderHorizontalRuleEvenPage"
                      v-model="form.excludeHeaderHorizontalRuleEvenPage"
                      class="header-rule-checkbox"
                      type="checkbox"
                    />
                    <label
                      for="page-setup-dialog-header-excludeHeaderHorizontalRuleEvenPage"
                    >
                      {{
                        $t(
                          ($) =>
                            $.dialog.pageSetup
                              .excludeHorizontalRuleEvenPageDescription,
                          { ns: 'dialog' },
                        )
                      }}
                    </label>
                  </div>
                </template>
              </template>
            </div>

            <div class="form-group full">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.footerHorizontalRule, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                id="page-setup-dialog-footer-hr"
                v-model="form.showFooterHorizontalRule"
                type="checkbox"
              />
              <label for="page-setup-dialog-footer-hr">{{
                $t(
                  ($) => $.dialog.pageSetup.showFooterHorizontalRuleDescription,
                  {
                    ns: 'dialog',
                  },
                )
              }}</label>

              <template v-if="form.showFooterHorizontalRule">
                <div class="form-group row">
                  <label class="header-rule-label name">{{
                    $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
                  }}</label>
                  <ColorPicker
                    v-model="form.footerHorizontalRuleColor"
                    class="neume-colors-input"
                  />
                </div>

                <div class="form-group">
                  <label class="header-rule-label name">{{
                    $t(($) => $.dialog.pageSetup.thickness, { ns: 'dialog' })
                  }}</label>
                  <InputUnit
                    v-model="form.footerHorizontalRuleThickness"
                    class="margin-input"
                    unit="pt"
                    :min="0"
                    :max="100"
                    :step="0.5"
                    :precision="1"
                  />
                </div>

                <div class="form-group">
                  <label class="header-rule-label name">{{
                    $t(($) => $.dialog.pageSetup.marginTop, { ns: 'dialog' })
                  }}</label>
                  <InputUnit
                    v-model="form.footerHorizontalRuleMarginTop"
                    class="margin-input"
                    unit="pt"
                    :min="0"
                    :max="1000"
                    :step="0.5"
                    :precision="1"
                  />
                </div>

                <div class="form-group">
                  <label class="header-rule-label name">{{
                    $t(($) => $.dialog.pageSetup.marginBottom, { ns: 'dialog' })
                  }}</label>
                  <InputUnit
                    v-model="form.footerHorizontalRuleMarginBottom"
                    class="margin-input"
                    unit="pt"
                    :min="0"
                    :max="1000"
                    :step="0.5"
                    :precision="1"
                  />
                </div>
                <template v-if="form.headerDifferentFirstPage">
                  <div class="form-group">
                    <input
                      id="page-setup-dialog-header-excludeFooterHorizontalRuleFirstPage"
                      v-model="form.excludeFooterHorizontalRuleFirstPage"
                      class="header-rule-checkbox"
                      type="checkbox"
                    />
                    <label
                      for="page-setup-dialog-header-excludeFooterHorizontalRuleFirstPage"
                    >
                      {{
                        $t(
                          ($) =>
                            $.dialog.pageSetup
                              .excludeHorizontalRuleFirstPageDescription,
                          { ns: 'dialog' },
                        )
                      }}
                    </label>
                  </div>
                </template>
                <template v-if="form.headerDifferentOddEven">
                  <div class="form-group">
                    <input
                      id="page-setup-dialog-footer-excludeFooterHorizontalRuleOddPage"
                      v-model="form.excludeFooterHorizontalRuleOddPage"
                      class="header-rule-checkbox"
                      type="checkbox"
                    />
                    <label
                      for="page-setup-dialog-footer-excludeFooterHorizontalRuleOddPage"
                    >
                      {{
                        $t(
                          ($) =>
                            $.dialog.pageSetup
                              .excludeHorizontalRuleOddPageDescription,
                          { ns: 'dialog' },
                        )
                      }}
                    </label>
                  </div>
                  <div class="form-group">
                    <input
                      id="page-setup-dialog-footer-excludeFooterHorizontalRuleEvenPage"
                      v-model="form.excludeFooterHorizontalRuleEvenPage"
                      class="header-rule-checkbox"
                      type="checkbox"
                    />
                    <label
                      for="page-setup-dialog-footer-excludeFooterHorizontalRuleEvenPage"
                    >
                      {{
                        $t(
                          ($) =>
                            $.dialog.pageSetup
                              .excludeHorizontalRuleEvenPageDescription,
                          { ns: 'dialog' },
                        )
                      }}
                    </label>
                  </div>
                </template>
              </template>
            </div>

            <div ref="miscellaneousRef" class="subheader">
              {{
                $t(($) => $.dialog.pageSetup.miscellaneous, { ns: 'dialog' })
              }}
            </div>

            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.useChrysanthineAccidentals, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                id="page-setup-dialog-chrysanthine-accidentals"
                v-model="form.chrysanthineAccidentals"
                type="checkbox"
              />
              <label for="page-setup-dialog-chrysanthine-accidentals">{{
                $t(
                  ($) =>
                    $.dialog.pageSetup.useChrysanthineAccidentalsDescription,
                  {
                    ns: 'dialog',
                  },
                )
              }}</label>
            </div>

            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.disableFthoraRestrictions, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                id="page-setup-dialog-no-fthora-restrictions"
                v-model="form.noFthoraRestrictions"
                type="checkbox"
              />
              <label for="page-setup-dialog-no-fthora-restrictions">{{
                $t(
                  ($) =>
                    $.dialog.pageSetup.disableFthoraRestrictionsDescription,
                  {
                    ns: 'dialog',
                  },
                )
              }}</label>
            </div>

            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.alignIsonIndicators, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                id="page-setup-dialog-align-ison-indicators"
                v-model="form.alignIsonIndicators"
                type="checkbox"
              />
              <label for="page-setup-dialog-align-ison-indicators">{{
                $t(($) => $.dialog.pageSetup.alignIsonIndicatorsDescription, {
                  ns: 'dialog',
                })
              }}</label>
            </div>

            <div class="form-group">
              <div class="name">
                {{ $t(($) => $.dialog.pageSetup.melkiteRtl, { ns: 'dialog' }) }}
              </div>
              <input
                id="page-setup-dialog-melkite-rtl"
                v-model="form.melkiteRtl"
                type="checkbox"
                @change="onChangeMelkiteRtl"
              />
              <label for="page-setup-dialog-melkite-rtl">{{
                $t(($) => $.dialog.pageSetup.melkiteRtlDescription, {
                  ns: 'dialog',
                })
              }}</label>
            </div>
            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.disableGreekMelismata, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <input
                id="page-setup-dialog-disable-melismata"
                v-model="form.disableGreekMelismata"
                type="checkbox"
              />
              <label for="page-setup-dialog-disable-melismata">{{
                $t(($) => $.dialog.pageSetup.disableGreekMelismataDescription, {
                  ns: 'dialog',
                })
              }}</label>
            </div>
            <div ref="dropCapsRef" class="subheader">
              {{ $t(($) => $.dialog.pageSetup.dropCaps, { ns: 'dialog' }) }}
            </div>
            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.defaultStyling, { ns: 'dialog' })
                }}
              </div>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.dropCapsDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>

              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
                }}</label>
                <ColorPicker v-model="form.dropCapDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' })
                }}</label>
                <InputFontSize
                  v-model="form.dropCapDefaultFontSize"
                  class="drop-caps-input"
                  :max="500"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.lineSpan, { ns: 'dialog' })
                }}</label>
                <InputUnit
                  v-model="form.dropCapDefaultLineSpan"
                  class="drop-caps-input"
                  unit="unitless"
                  :min="1"
                  :max="10"
                  :step="1"
                  :precision="0"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.lineHeight, { ns: 'dialog' })
                }}</label>
                <InputUnit
                  v-model="form.dropCapDefaultLineHeight"
                  class="drop-caps-input"
                  :min="0"
                  :step="0.1"
                  unit="unitless"
                  :precision="2"
                  placeholder="normal"
                  :nullable="true"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
                }}</label>
                <select
                  v-model="form.dropCapDefaultFontFamily"
                  class="drop-caps-select"
                >
                  <option v-for="family in dropCapFontFamilies" :key="family">
                    {{ family }}
                  </option>
                </select>
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
                }}</label>
                <input
                  id="page-setup-dialog-drop-cap-bold"
                  v-model="form.dropCapDefaultFontWeight"
                  type="checkbox"
                  true-value="700"
                  false-value="400"
                />
                <label for="page-setup-dialog-drop-cap-bold">{{
                  $t(($) => $.dialog.pageSetup.bold, { ns: 'dialog' })
                }}</label>
                <span class="checkbox-spacer"></span>
                <input
                  id="page-setup-dialog-drop-cap-italic"
                  v-model="form.dropCapDefaultFontStyle"
                  type="checkbox"
                  true-value="italic"
                  false-value="normal"
                />
                <label for="page-setup-dialog-drop-cap-italic">{{
                  $t(($) => $.dialog.pageSetup.italic, { ns: 'dialog' })
                }}</label>
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' })
                }}</label>

                <InputStrokeWidth
                  v-model="form.dropCapDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
            </div>

            <div ref="lyricsRef" class="subheader">
              {{ $t(($) => $.dialog.pageSetup.lyrics, { ns: 'dialog' }) }}
            </div>
            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.defaultStyling, { ns: 'dialog' })
                }}
              </div>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.lyricsDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
                }}</label>
                <ColorPicker v-model="form.lyricsDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' })
                }}</label>
                <InputFontSize
                  v-model="form.lyricsDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>

              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
                }}</label>
                <select
                  v-model="form.lyricsDefaultFontFamily"
                  class="drop-caps-select"
                >
                  <option v-for="family in lyricsFontFamilies" :key="family">
                    {{ family }}
                  </option>
                </select>
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
                }}</label>
                <input
                  id="page-setup-dialog-lyrics-bold"
                  v-model="form.lyricsDefaultFontWeight"
                  type="checkbox"
                  true-value="700"
                  false-value="400"
                />
                <label for="page-setup-dialog-lyrics-bold">{{
                  $t(($) => $.dialog.pageSetup.bold, { ns: 'dialog' })
                }}</label>
                <span class="checkbox-spacer"></span>

                <input
                  id="page-setup-dialog-lyrics-italic"
                  v-model="form.lyricsDefaultFontStyle"
                  type="checkbox"
                  true-value="italic"
                  false-value="normal"
                />
                <label for="page-setup-dialog-lyrics-italic">{{
                  $t(($) => $.dialog.pageSetup.italic, { ns: 'dialog' })
                }}</label>
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' })
                }}</label>
                <InputStrokeWidth
                  v-model="form.lyricsDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
            </div>
            <div class="form-group">
              <label class="name">{{
                $t(($) => $.dialog.pageSetup.lyricsMelismaCutoffWidth, {
                  ns: 'dialog',
                })
              }}</label>
              <div class="description">
                {{
                  $t(
                    ($) =>
                      $.dialog.pageSetup.lyricsMelismaCutoffWidthDescription,
                    {
                      ns: 'dialog',
                    },
                  )
                }}
              </div>
              <InputUnit
                v-model="form.lyricsMelismaCutoffWidth"
                class="unit-input"
                unit="pt"
                :min="0"
                :step="1"
                :precision="0"
              />
            </div>
            <div class="form-group">
              <div class="name">
                {{
                  $t(
                    ($) =>
                      $.dialog.pageSetup.ignorePunctuationWhenPositioningLyrics,
                    {
                      ns: 'dialog',
                    },
                  )
                }}
              </div>
              <input
                id="page-setup-dialog-ignore-punctuation-when-positioning-lyrics"
                v-model="form.ignorePunctuationWhenPositioningLyrics"
                type="checkbox"
              />
              <label
                for="page-setup-dialog-ignore-punctuation-when-positioning-lyrics"
                >{{
                  $t(
                    ($) =>
                      $.dialog.pageSetup
                        .ignorePunctuationWhenPositioningLyricsDescription,
                    { ns: 'dialog' },
                  )
                }}</label
              >
            </div>
            <div ref="textBoxesRef" class="subheader">
              {{ $t(($) => $.dialog.pageSetup.textBoxes, { ns: 'dialog' }) }}
            </div>
            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.defaultStyling, { ns: 'dialog' })
                }}
              </div>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.textBoxesDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
                }}</label>
                <ColorPicker v-model="form.textBoxDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' })
                }}</label>
                <InputFontSize
                  v-model="form.textBoxDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.lineHeight, { ns: 'dialog' })
                }}</label>
                <InputUnit
                  v-model="form.textBoxDefaultLineHeight"
                  class="drop-caps-input"
                  :min="0"
                  :step="0.1"
                  unit="unitless"
                  :precision="2"
                  placeholder="normal"
                  :nullable="true"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
                }}</label>
                <select
                  v-model="form.textBoxDefaultFontFamily"
                  class="drop-caps-select"
                >
                  <option v-for="family in lyricsFontFamilies" :key="family">
                    {{ family }}
                  </option>
                </select>
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.style, { ns: 'dialog' })
                }}</label>
                <input
                  id="page-setup-dialog-text-box-bold"
                  v-model="form.textBoxDefaultFontWeight"
                  type="checkbox"
                  true-value="700"
                  false-value="400"
                />
                <label for="page-setup-dialog-text-box-bold">{{
                  $t(($) => $.dialog.pageSetup.bold, { ns: 'dialog' })
                }}</label>
                <span class="checkbox-spacer"></span>

                <input
                  id="page-setup-dialog-text-box-italic"
                  v-model="form.textBoxDefaultFontStyle"
                  type="checkbox"
                  true-value="italic"
                  false-value="normal"
                />
                <label for="page-setup-dialog-text-box-italic">{{
                  $t(($) => $.dialog.pageSetup.italic, { ns: 'dialog' })
                }}</label>
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' })
                }}</label>

                <InputStrokeWidth
                  v-model="form.textBoxDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
            </div>

            <div ref="modeKeysRef" class="subheader">
              {{ $t(($) => $.dialog.pageSetup.modeKeys, { ns: 'dialog' }) }}
            </div>
            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.defaultStyling, { ns: 'dialog' })
                }}
              </div>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.modeKeysDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
                }}</label>
                <ColorPicker v-model="form.modeKeyDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' })
                }}</label>
                <InputFontSize
                  v-model="form.modeKeyDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' })
                }}</label>
                <InputStrokeWidth
                  v-model="form.modeKeyDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.heightAdjust, { ns: 'dialog' })
                }}</label>

                <InputUnit
                  v-model="form.modeKeyDefaultHeightAdjustment"
                  class="drop-caps-input"
                  unit="pt"
                  :min="heightAdjustmentMin"
                  :max="heightAdjustmentMax"
                  :step="0.5"
                  :precision="2"
                />
              </div>
            </div>
            <div ref="neumesRef" class="subheader">
              {{ $t(($) => $.dialog.pageSetup.neumes, { ns: 'dialog' }) }}
            </div>
            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.defaultStyling, { ns: 'dialog' })
                }}
              </div>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.neumesDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
                }}</label>
                <ColorPicker v-model="form.neumeDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' })
                }}</label>
                <InputFontSize
                  v-model="form.neumeDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.font, { ns: 'dialog' })
                }}</label>
                <select
                  v-model="form.neumeDefaultFontFamily"
                  class="drop-caps-select"
                  :disabled="form.melkiteRtl"
                >
                  <option
                    v-for="family in neumeFontFamilies"
                    :key="family.value"
                    :value="family.value"
                  >
                    {{ family.displayName }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' })
                }}</label>
                <InputStrokeWidth
                  v-model="form.neumeDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
            </div>

            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.alternateLineStyling, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.alternateLineDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
                }}</label>
                <ColorPicker v-model="form.alternateLineDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t(($) => $.dialog.pageSetup.size, { ns: 'dialog' })
                }}</label>
                <InputFontSize
                  v-model="form.alternateLineDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>
            </div>

            <div ref="neumeStylesRef" class="subheader">
              {{ $t(($) => $.dialog.pageSetup.neumeStyles, { ns: 'dialog' }) }}
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container"></div>
              <label class="neume-colors-label small-header">{{
                $t(($) => $.dialog.pageSetup.type, { ns: 'dialog' })
              }}</label>
              <label class="neume-colors-input small-header">{{
                $t(($) => $.dialog.pageSetup.color, { ns: 'dialog' })
              }}</label>
              <label class="small-header">{{
                $t(($) => $.dialog.pageSetup.outline, { ns: 'dialog' })
              }}</label>
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Accidentals"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.accidentals, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.accidentalDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.accidentalDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Breath"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.breath, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.breathDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.breathDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Cross"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.cross, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.crossDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.crossDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Fthoras"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.fthoras, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.fthoraDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.fthoraDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Gorgons"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.gorgons, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.gorgonDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.gorgonDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Heterons"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.heterons, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.heteronDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.heteronDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Ison"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.ison, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.isonDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.isonDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Koronis"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.koronis, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.koronisDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.koronisDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Martyria"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.martyriae, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.martyriaDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.martyriaDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.MeasureBars"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.measureBars, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.measureBarDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.measureBarDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.MeasureNumbers"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.measureNo, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.measureNumberDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.measureNumberDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.NoteIndicators"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.noteIndicators, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.noteIndicatorDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.noteIndicatorDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container">
                <input
                  v-model="selectedNeumeColorOptions"
                  type="checkbox"
                  class="neume-colors-checkbox"
                  :value="NeumeColorOptions.Tempos"
                />
              </div>
              <label class="neume-colors-label">{{
                $t(($) => $.dialog.pageSetup.tempos, { ns: 'dialog' })
              }}</label>
              <ColorPicker
                v-model="form.tempoDefaultColor"
                class="neume-colors-input"
              />
              <InputStrokeWidth
                v-model="form.tempoDefaultStrokeWidth"
                class="drop-caps-input"
              />
            </div>
            <div class="form-group">
              <div class="name">
                {{
                  $t(($) => $.dialog.pageSetup.neumeBulkColor, { ns: 'dialog' })
                }}
              </div>
              <div class="description">
                {{
                  $t(($) => $.dialog.pageSetup.neumeBulkColorDescription, {
                    ns: 'dialog',
                  })
                }}
              </div>
              <div class="row">
                <ColorPicker
                  v-model="neumeBulkColor"
                  class="neume-colors-input"
                />
                <button @click="changeNeumeColorInBulk">Apply Color</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="preview-container">
        <div class="small-header">
          {{ $t(($) => $.dialog.pageSetup.preview, { ns: 'dialog' }) }}
        </div>
        <div class="preview-elements">
          <template v-for="(element, index) in previewNeumes">
            <template v-if="isSyllableElement(element.elementType)">
              <NeumeBoxSyllable
                :key="index"
                class="syllable-box"
                :note="element as NoteElement"
                :page-setup="form"
              />
            </template>
            <template v-if="isMartyriaElement(element.elementType)">
              <NeumeBoxMartyria
                :key="index"
                class="marytria-neume-box"
                :neume="element as MartyriaElement"
                :page-setup="form"
              />
            </template>
            <template v-if="isTempoElement(element.elementType)">
              <NeumeBoxTempo
                :key="index"
                class="tempo-neume-box"
                :neume="element as TempoElement"
                :page-setup="form"
              />
            </template>
          </template>
        </div>
        <div class="button-container">
          <button class="ok-btn" @click="updatePageSetup">
            {{ $t(($) => $.dialog.common.update, { ns: 'dialog' }) }}
          </button>
          <button class="reset-btn neutral-btn" @click="saveAsDefault">
            {{ $t(($) => $.dialog.common.setAsDefault, { ns: 'dialog' }) }}
          </button>
          <button class="reset-btn neutral-btn" @click="resetToSystemDefaults">
            {{ $t(($) => $.dialog.common.useSystemDefault, { ns: 'dialog' }) }}
          </button>
          <button class="cancel-btn" @click="$emit('close')">
            {{ $t(($) => $.dialog.common.cancel, { ns: 'dialog' }) }}
          </button>
        </div>
      </div>
    </div>
  </ModalDialog>
</template>

<script setup lang="ts">
import { SelectorParam } from 'i18next';
import { throttle } from 'throttle-debounce';
import {
  computed,
  getCurrentInstance,
  onBeforeUnmount,
  PropType,
  ref,
  useTemplateRef,
} from 'vue';

import ColorPicker from '@/components/ColorPicker.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import ModalDialog from '@/components/ModalDialog.vue';
import NeumeBoxMartyria from '@/components/NeumeBoxMartyria.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import NeumeBoxTempo from '@/components/NeumeBoxTempo.vue';
import {
  ElementType,
  MartyriaElement,
  NoteElement,
  TempoElement,
} from '@/models/Element';
import { PageSetup, PageSize, pageSizes } from '@/models/PageSetup';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import { SaveService } from '@/services/SaveService';
import { Unit } from '@/utils/Unit';

enum NeumeColorOptions {
  Accidentals = 'Accidentals',
  Breath = 'Breath',
  Cross = 'Cross',
  Fthoras = 'Fthoras',
  Gorgons = 'Gorgons',
  Heterons = 'Heterons',
  Ison = 'Ison',
  Koronis = 'Koronis',
  Martyria = 'Martyria',
  MeasureBars = 'MeasureBars',
  MeasureNumbers = 'MeasureNumbers',
  NoteIndicators = 'NoteIndicators',
  Tempos = 'Tempos',
}

// TODO use actual class instances
const previewNeumes = [
  {
    elementType: ElementType.Tempo,
    neume: 'Moderate',
  },
  {
    elementType: ElementType.Note,
    quantitativeNeume: 'Ison',
    gorgonNeume: 'Gorgon_Bottom',
    ison: 'Ison.Ga',
  },
  {
    elementType: ElementType.Note,
    quantitativeNeume: 'Ison',
    timeNeume: 'Dipli',
    measureBarLeft: 'MeasureBarRight',
    measureBarRight: 'MeasureBarRight',
    measureNumber: 'Three',
  },
  {
    elementType: ElementType.Note,
    quantitativeNeume: 'Oligon',
    vocalExpressionNeume: 'Antikenoma',
    ison: 'Ison.Ni',
  },
  {
    elementType: ElementType.Note,
    quantitativeNeume: 'Apostrophos',
  },
  {
    elementType: ElementType.Note,
    quantitativeNeume: 'Oligon',
    timeNeume: 'Klasma_Top',
  },
  {
    elementType: ElementType.Note,
    quantitativeNeume: 'Oligon',
    gorgonNeume: 'Gorgon_Top',
    vocalExpressionNeume: 'Psifiston',
    accidental: 'Flat_2_Right',
  },
  {
    elementType: ElementType.Note,
    quantitativeNeume: 'Apostrophos',
  },
  {
    elementType: ElementType.Martyria,
    auto: true,
    note: 'Thi',
    rootSign: 'DeltaDotted',
    scale: 'Diatonic',
    fthora: 'HardChromaticPa_Top',
    verticalOffset: 0,
  },
] as any;

const sectionIds = [
  'dropCapsRef',
  'headersFootersRef',
  'lyricsRef',
  'marginsRef',
  'miscellaneousRef',
  'modeKeysRef',
  'neumesRef',
  'neumeStylesRef',
  'pageSizeRef',
  'textBoxesRef',
  'spacingRef',
] as const;

type SectionRefName = (typeof sectionIds)[number];

const emit = defineEmits<{
  close: [];
  update: [pageSetup: PageSetup];
}>();
const instance = getCurrentInstance();

const props = defineProps({
  pageSetup: {
    type: Object as PropType<PageSetup>,
    required: true,
  },
  fonts: {
    type: Array as PropType<string[]>,
    required: true,
  },
});

const form = ref(new PageSetup());
const currentSection = ref<SectionRefName>('pageSizeRef');
const neumeBulkColor = ref('#000000');
const selectedNeumeColorOptions = ref<NeumeColorOptions[]>([]);

const rightPaneRef = useTemplateRef<HTMLElement>('rightPaneRef');
const pageSizeRef = useTemplateRef<HTMLElement>('pageSizeRef');
const marginsRef = useTemplateRef<HTMLElement>('marginsRef');
const spacingRef = useTemplateRef<HTMLElement>('spacingRef');
const headersFootersRef = useTemplateRef<HTMLElement>('headersFootersRef');
const miscellaneousRef = useTemplateRef<HTMLElement>('miscellaneousRef');
const dropCapsRef = useTemplateRef<HTMLElement>('dropCapsRef');
const lyricsRef = useTemplateRef<HTMLElement>('lyricsRef');
const textBoxesRef = useTemplateRef<HTMLElement>('textBoxesRef');
const modeKeysRef = useTemplateRef<HTMLElement>('modeKeysRef');
const neumesRef = useTemplateRef<HTMLElement>('neumesRef');
const neumeStylesRef = useTemplateRef<HTMLElement>('neumeStylesRef');

const sectionRefs = {
  dropCapsRef,
  headersFootersRef,
  lyricsRef,
  marginsRef,
  miscellaneousRef,
  modeKeysRef,
  neumesRef,
  neumeStylesRef,
  pageSizeRef,
  textBoxesRef,
  spacingRef,
};

const topMargin = computed(() =>
  toDisplayUnit(form.value.topMargin).toFixed(2),
);
const bottomMargin = computed(() =>
  toDisplayUnit(form.value.bottomMargin).toFixed(2),
);
const leftMargin = computed(() =>
  toDisplayUnit(form.value.leftMargin).toFixed(2),
);
const rightMargin = computed(() =>
  toDisplayUnit(form.value.rightMargin).toFixed(2),
);
const headerMargin = computed(() =>
  toDisplayUnit(form.value.headerMargin).toFixed(2),
);
const footerMargin = computed(() =>
  toDisplayUnit(form.value.footerMargin).toFixed(2),
);
const lyricsVerticalOffset = computed(() =>
  toDisplayUnit(form.value.lyricsVerticalOffset).toFixed(3),
);
const lyricsMinimumSpacing = computed(() =>
  toDisplayUnit(form.value.lyricsMinimumSpacing).toFixed(3),
);
const lineHeight = computed(() =>
  toDisplayUnit(form.value.lineHeight).toFixed(3),
);
const hyphenSpacing = computed(() =>
  toDisplayUnit(form.value.hyphenSpacing).toFixed(3),
);
const dropCapFontFamilies = computed(() => [
  'Source Serif',
  'GFS Didot',
  'Noto Naskh Arabic',
  'Old Standard',
  ...props.fonts,
]);
const lyricsFontFamilies = computed(() => [
  'Source Serif',
  'GFS Didot',
  'Noto Naskh Arabic',
  'Old Standard',
  ...props.fonts,
]);
const neumeFontFamilies = computed(() => {
  if (form.value.melkiteRtl) {
    return [{ displayName: 'EZ Psaltica RTL', value: 'NeanesRTL' }];
  } else {
    return [
      { displayName: 'EZ Psaltica', value: 'Neanes' },
      { displayName: 'Stathis Series', value: 'NeanesStathisSeries' },
    ];
  }
});
const neumeSpacingMax = computed(() =>
  Math.round(toDisplayUnit(form.value.pageWidth)),
);
const heightAdjustmentMin = computed(
  () => -Math.round(Unit.fromPt(props.pageSetup.pageHeight)),
);
const heightAdjustmentMax = computed(() =>
  Unit.toPt(props.pageSetup.pageHeight),
);
const pageSize = computed({
  get: () => form.value.pageSize,
  set: (value: PageSize) => {
    form.value.pageSize = value;
    updatePageSize();
  },
});
const landscape = computed({
  get: () => form.value.landscape,
  set: (value: boolean) => {
    form.value.landscape = value;
    updatePageSize();
  },
});
const marginUnitLabel = computed<SelectorParam<'dialog'> | undefined>(() => {
  switch (form.value.pageSizeUnit) {
    case 'pc':
      return ($) => $.dialog.pageSetup.pc;
    case 'pt':
      return ($) => $.dialog.pageSetup.pt;
    case 'cm':
      return ($) => $.dialog.pageSetup.cm;
    case 'mm':
      return ($) => $.dialog.pageSetup.mm;
    case 'in':
      return ($) => $.dialog.pageSetup.in;
    default:
      console.warn(`Unknown page size unit: ${form.value.pageSizeUnit}`);
      return undefined;
  }
});
const marginStep = computed(() => {
  switch (form.value.pageSizeUnit) {
    case 'pc':
      return 1;
    case 'pt':
      return 1;
    case 'cm':
      return 0.1;
    case 'mm':
      return 1;
    case 'in':
      return 0.1;
    default:
      console.warn(`Unknown page size unit: ${form.value.pageSizeUnit}`);
      return 1;
  }
});
const spacingStep = computed(() => {
  switch (form.value.pageSizeUnit) {
    case 'pc':
      return 0.05;
    case 'pt':
      return 0.5;
    case 'cm':
      return 0.01;
    case 'mm':
      return 0.1;
    case 'in':
      return 0.005;
    default:
      console.warn(`Unknown page size unit: ${form.value.pageSizeUnit}`);
      return 1;
  }
});

Object.assign(form.value, props.pageSetup);

window.addEventListener('keydown', onKeyDown);

const updateCurrentSectionThrottled = throttle(50, updateCurrentSection);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
});

function toDisplayUnit(value: number) {
  switch (form.value.pageSizeUnit) {
    case 'pc':
      return Unit.toPc(value);
    case 'pt':
      return Unit.toPt(value);
    case 'cm':
      return Unit.toCm(value);
    case 'mm':
      return Unit.toMm(value);
    case 'in':
      return Unit.toInch(value);
    default:
      console.warn(`Unknown page size unit: ${form.value.pageSizeUnit}`);
      return 0;
  }
}

function toStorageUnit(value: number) {
  switch (form.value.pageSizeUnit) {
    case 'pc':
      return Unit.fromPc(value);
    case 'pt':
      return Unit.fromPt(value);
    case 'cm':
      return Unit.fromCm(value);
    case 'mm':
      return Unit.fromMm(value);
    case 'in':
      return Unit.fromInch(value);
    default:
      console.warn(`Unknown page size unit: ${form.value.pageSizeUnit}`);
      return 0;
  }
}

function forceUpdate() {
  instance?.proxy?.$forceUpdate();
}

function updateCurrentSection() {
  const rightPane = rightPaneRef.value;

  if (!rightPane) {
    return;
  }

  const scrollParentTop = rightPane.getBoundingClientRect().top;

  let closest: SectionRefName | null = null;
  let closestDistance = Infinity;

  for (const id of sectionIds) {
    const el = sectionRefs[id].value;

    if (!el) {
      continue;
    }

    const top = Math.abs(el.getBoundingClientRect().top - scrollParentTop);

    if (top < closestDistance) {
      closest = id;
      closestDistance = top;
    }
  }

  if (closest !== null) {
    currentSection.value = closest;
  }
}

function changeNeumeColorInBulk() {
  for (const neume of selectedNeumeColorOptions.value) {
    switch (neume) {
      case NeumeColorOptions.Accidentals:
        form.value.accidentalDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.Fthoras:
        form.value.fthoraDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.Gorgons:
        form.value.gorgonDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.Heterons:
        form.value.heteronDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.Ison:
        form.value.isonDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.Koronis:
        form.value.koronisDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.Martyria:
        form.value.martyriaDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.MeasureBars:
        form.value.measureBarDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.MeasureNumbers:
        form.value.accidentalDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.NoteIndicators:
        form.value.noteIndicatorDefaultColor = neumeBulkColor.value;
        break;
      case NeumeColorOptions.Tempos:
        form.value.tempoDefaultColor = neumeBulkColor.value;
        break;
    }
  }
}

function updateTopMargin(value: number) {
  form.value.topMargin = Math.min(
    Math.max(toStorageUnit(value), 0),
    form.value.pageHeight - form.value.bottomMargin - Unit.fromInch(0.5),
  );

  forceUpdate();
}

function updateBottomMargin(value: number) {
  form.value.bottomMargin = Math.min(
    Math.max(toStorageUnit(value), 0),
    form.value.pageHeight - form.value.topMargin - Unit.fromInch(0.5),
  );

  forceUpdate();
}

function updateLeftMargin(value: number) {
  form.value.leftMargin = Math.min(
    Math.max(toStorageUnit(value), 0),
    form.value.pageWidth - form.value.rightMargin - Unit.fromInch(0.5),
  );

  forceUpdate();
}

function updateRightMargin(value: number) {
  form.value.rightMargin = Math.min(
    Math.max(toStorageUnit(value), 0),
    form.value.pageWidth - form.value.leftMargin - Unit.fromInch(0.5),
  );

  forceUpdate();
}

function updateHeaderMargin(value: number) {
  form.value.headerMargin = Math.min(
    Math.max(toStorageUnit(value), 0),
    form.value.innerPageHeight,
  );

  forceUpdate();
}

function updateFooterMargin(value: number) {
  form.value.footerMargin = Math.min(
    Math.max(toStorageUnit(value), 0),
    form.value.innerPageHeight,
  );

  forceUpdate();
}

function updateLyricsVerticalOffset(value: number) {
  form.value.lyricsVerticalOffset = Math.min(
    toStorageUnit(value),
    form.value.innerPageHeight -
      form.value.lyricsDefaultFontSize -
      form.value.neumeDefaultFontSize,
  );

  forceUpdate();
}

function updateLyricsMinimumSpacing(value: number) {
  form.value.lyricsMinimumSpacing = Math.min(
    toStorageUnit(value),
    form.value.innerPageWidth,
  );

  forceUpdate();
}

function updateLineHeight(value: number) {
  form.value.lineHeight = Math.min(
    Math.max(toStorageUnit(value), 0),
    form.value.innerPageHeight,
  );

  forceUpdate();
}

function updateHyphenSpacing(value: number) {
  form.value.hyphenSpacing = Math.min(
    Math.max(toStorageUnit(value), 0),
    form.value.innerPageWidth,
  );

  forceUpdate();
}

function onChangeMelkiteRtl() {
  form.value.neumeDefaultFontFamily = form.value.melkiteRtl
    ? 'NeanesRTL'
    : 'Neanes';
}

function isSyllableElement(elementType: ElementType) {
  return elementType == ElementType.Note;
}

function isMartyriaElement(elementType: ElementType) {
  return elementType == ElementType.Martyria;
}

function isTempoElement(elementType: ElementType) {
  return elementType == ElementType.Tempo;
}

function onKeyDown(event: KeyboardEvent) {
  if (event.code === 'Escape') {
    emit('close');
  }
}

function updatePageSize() {
  if (form.value.pageSize === 'Custom') {
    if (form.value.landscape) {
      form.value.pageWidth = form.value.pageHeightCustom;
      form.value.pageHeight = form.value.pageWidthCustom;
    } else {
      form.value.pageWidth = form.value.pageWidthCustom;
      form.value.pageHeight = form.value.pageHeightCustom;
    }
    return;
  }

  const pageSize = pageSizes.find((x) => x.name === form.value.pageSize);
  if (pageSize) {
    if (form.value.landscape) {
      form.value.pageWidth = pageSize.height;
      form.value.pageHeight = pageSize.width;
    } else {
      form.value.pageWidth = pageSize.width;
      form.value.pageHeight = pageSize.height;
    }
  }
}

function updatePageSetup() {
  emit('update', form.value);
  emit('close');
}

function saveAsDefault() {
  const defaults = new PageSetup_v1();
  SaveService.SavePageSetup(defaults, form.value);

  localStorage.setItem('pageSetupDefault', JSON.stringify(defaults));
}

function resetToSystemDefaults() {
  form.value = new PageSetup();
}

function scrollTo(el: HTMLElement | null) {
  el?.scrollIntoView({ behavior: 'instant', block: 'start' });
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.outer-container {
  display: flex;
  flex-direction: column;
  width: 60vw;
  height: 80vh;
}

.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  border-top: 1px solid lightgray;
  border-bottom: 1px solid lightgray;
  padding-bottom: 0.5rem;
  margin-bottom: 1rem;
  --zoom: 1;
}

.preview-elements {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.pane-container {
  display: flex;
  min-width: 250px;
  max-width: 95vw;
  margin-bottom: 1.5rem;
  overflow: hidden;
}

.right-pane {
  flex: 1;
  overflow: auto;
}

.header {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.subheader {
  font-weight: bold;
  padding: 0.5rem;
  font-size: 1.2rem;
}

.subheader:hover {
  background-color: #f0f0f0;
}

.form-group.full {
  padding: 1rem 0.5rem;
  margin: 0;
}

.form-group:hover {
  background-color: #f0f0f0;
}

.form-group .name,
.subsubheader {
  font-weight: bold;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.form-group .description {
  margin-bottom: 0.5rem;
}

.form-group .unit-input {
  width: 5rem;
}

.form-group .standard-select {
  width: 6.5rem;
}

.form-group input[type='checkbox'] {
  margin: 0 0.5rem 0 0;
}

.small-header {
  font-weight: bold;
  font-size: 0.9rem;
}

.units {
  font-weight: normal;
  color: gray;
  margin-left: 0.5rem;
  font-size: 0.9rem;
}

.form-group {
  padding: 0.5rem;
}

.row {
  display: flex;
}

.margin-label {
  display: inline-block;
  text-align: right;
  margin-right: 0.5rem;
  width: 3.5rem;
}

.custom-page-size-label {
  display: inline-block;
  text-align: right;
  margin-right: 0.5rem;
  width: 3rem;
}

.margin-input {
  width: 3.5rem;
}

.left-pane {
  width: 175px;
  margin-right: 2rem;
  border-right: 1px solid lightgray;
  overflow: auto;
}

.nav-item {
  cursor: default;
  padding: 0.25rem;
}

.nav-item.active {
  font-weight: bold;
}

.header-rule-label {
  display: inline-block;
  width: 6rem;
  padding-left: 2rem;
}

.header-rule-checkbox {
  margin-left: 2rem !important;
}

.checkbox-spacer {
  width: 1rem;
}

.drop-caps-label {
  display: inline-block;
  text-align: right;
  margin-right: 0.5rem;
  margin-bottom: 0 !important;
  width: 6rem;
}

.drop-caps-input {
  width: 4rem;
}

.drop-caps-select {
  width: auto;
}

.neume-colors-label {
  display: inline-block;
  width: 7rem;
}

.neume-colors-input {
  width: 2.85rem;
  height: 1.5rem;
  margin-right: 2rem;
}

.neume-colors-checkbox-container {
  width: 2rem;
}

.button-container {
  display: flex;
  justify-content: center;
}

.ok-btn,
.reset-btn {
  margin-right: 2rem;
}

.melisma-label {
  margin-right: 0.5rem;
}

.melisma-input {
  width: 2rem;
}

.radio-button {
  padding: 0.25rem 0.5rem;
  background-color: white;
  border: 1px solid rgb(66, 139, 202);
  text-align: center;
  cursor: default;
}

.radio-button.selected {
  background-color: rgb(66, 139, 202);
  color: white;
}

.page-orientation-button {
  width: 5rem;
}
</style>
