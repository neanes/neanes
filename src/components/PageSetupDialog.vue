<template>
  <ModalDialog>
    <div class="outer-container">
      <div class="container">
        <div class="header">{{ $t('dialog:pageSetup.root') }}</div>
        <div class="pane-container">
          <div class="left-pane">
            <div
              class="nav-item"
              :class="{ active: currentSection === 'pageSizeRef' }"
              @click="scrollTo($refs.pageSizeRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.pageSize') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'marginsRef' }"
              @click="scrollTo($refs.marginsRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.margins') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'spacingRef' }"
              @click="scrollTo($refs.spacingRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.spacing') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'headersFootersRef' }"
              @click="scrollTo($refs.headersFootersRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.headersAndFooters') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'miscellaneousRef' }"
              @click="scrollTo($refs.miscellaneousRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.miscellaneous') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'dropCapsRef' }"
              @click="scrollTo($refs.dropCapsRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.dropCaps') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'lyricsRef' }"
              @click="scrollTo($refs.lyricsRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.lyrics') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'textBoxesRef' }"
              @click="scrollTo($refs.textBoxesRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.textBoxes') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'modeKeysRef' }"
              @click="scrollTo($refs.modeKeysRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.modeKeys') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'neumesRef' }"
              @click="scrollTo($refs.neumesRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.neumes') }}
            </div>
            <div
              class="nav-item"
              :class="{ active: currentSection === 'neumeStylesRef' }"
              @click="scrollTo($refs.neumeStylesRef as HTMLElement)"
            >
              {{ $t('dialog:pageSetup.neumeStyles') }}
            </div>
          </div>
          <div
            ref="rightPaneRef"
            class="right-pane"
            @scroll="updateCurrentSectionThrottled!"
          >
            <div ref="pageSizeRef" class="subheader">
              {{ $t('dialog:pageSetup.pageSize') }}
            </div>
            <div class="form-group full">
              <div class="name">
                {{ $t('dialog:pageSetup.paperSize') }}
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
                  $t('dialog:pageSetup.width')
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
                <span class="units">{{ $t(marginUnitLabel!) }}</span>
              </div>
              <div class="form-group">
                <label class="custom-page-size-label name">{{
                  $t('dialog:pageSetup.height')
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
                <span class="units">{{ $t(marginUnitLabel!) }}</span>
              </div>
            </template>
            <div class="form-group full">
              <div class="name">
                {{ $t('dialog:pageSetup.orientation') }}
              </div>
              <div class="row">
                <div
                  class="radio-button page-orientation-button"
                  :class="{ selected: !landscape }"
                  @click="landscape = false"
                >
                  {{ $t('dialog:pageSetup.portrait') }}
                </div>
                <div
                  class="radio-button page-orientation-button"
                  :class="{ selected: landscape }"
                  @click="landscape = true"
                >
                  {{ $t('dialog:pageSetup.landscape') }}
                </div>
              </div>
            </div>
            <div class="form-group full">
              <div class="name">{{ $t('dialog:pageSetup.unit') }}</div>
              <div class="description">
                {{ $t('dialog:pageSetup.unitDescription') }}
              </div>
              <select v-model="form.pageSizeUnit" class="standard-select">
                <option value="in">
                  {{ $t('dialog:pageSetup.in') }}
                </option>
                <option value="cm">
                  {{ $t('dialog:pageSetup.cm') }}
                </option>
                <option value="mm">
                  {{ $t('dialog:pageSetup.mm') }}
                </option>
                <option value="pt">
                  {{ $t('dialog:pageSetup.pt') }}
                </option>
                <option value="pc">
                  {{ $t('dialog:pageSetup.pc') }}
                </option>
              </select>
            </div>
            <div ref="marginsRef" class="subheader">
              {{ $t('dialog:pageSetup.margins') }}
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t('dialog:common.top')
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t('dialog:common.bottom')
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t('dialog:common.left')
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t('dialog:common.right')
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t('dialog:pageSetup.header')
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group">
              <label class="margin-label name">{{
                $t('dialog:pageSetup.footer')
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div ref="spacingRef" class="subheader">
              {{ $t('dialog:pageSetup.spacing') }}
            </div>
            <div class="form-group full">
              <label class="name">{{
                $t('dialog:pageSetup.neumeSpacing')
              }}</label>
              <div class="description">
                {{ $t('dialog:pageSetup.neumeSpacingDescription') }}
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{
                $t('dialog:pageSetup.martyriaVerticalOffset')
              }}</label>
              <div class="description">
                {{ $t('dialog:pageSetup.martyriaVerticalOffsetDescription') }}
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{ $t('dialog:pageSetup.lyricsV') }}</label>
              <div class="description">
                {{ $t('dialog:pageSetup.lyricsVDescription') }}
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{ $t('dialog:pageSetup.lyricsH') }}</label>
              <div class="description">
                {{ $t('dialog:pageSetup.lyricsHDescription') }}
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
              <span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{ $t('dialog:pageSetup.line') }}</label>
              <div class="description">
                {{ $t('dialog:pageSetup.lineSpacingDescription') }}
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div class="form-group full">
              <label class="name">{{ $t('dialog:pageSetup.hyphens') }}</label>
              <div class="description">
                {{ $t('dialog:pageSetup.hyphenSpacingDescription') }}
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
              /><span class="units">{{ $t(marginUnitLabel!) }}</span>
            </div>
            <div ref="headersFootersRef" class="subheader">
              {{ $t('dialog:pageSetup.headersAndFooters') }}
            </div>

            <div class="form-group">
              <input
                id="page-setup-dialog-show-header"
                v-model="form.showHeader"
                type="checkbox"
              />
              <label for="page-setup-dialog-show-header">{{
                $t('dialog:pageSetup.includeHeader')
              }}</label>
            </div>

            <div class="form-group">
              <input
                id="page-setup-dialog-show-footer"
                v-model="form.showFooter"
                type="checkbox"
              />
              <label for="page-setup-dialog-show-footer">{{
                $t('dialog:pageSetup.includeFooter')
              }}</label>
            </div>

            <div class="form-group">
              <input
                id="page-setup-dialog-different-first-page"
                v-model="form.headerDifferentFirstPage"
                type="checkbox"
              />
              <label for="page-setup-dialog-different-first-page">{{
                $t('dialog:pageSetup.differentFirstPage')
              }}</label>
            </div>
            <div class="form-group">
              <input
                id="page-setup-dialog-different-odd-even"
                v-model="form.headerDifferentOddEven"
                type="checkbox"
              />
              <label for="page-setup-dialog-different-odd-even">{{
                $t('dialog:pageSetup.differentOddAndEven')
              }}</label>
            </div>
            <div class="form-group">
              <input
                id="page-setup-dialog-rich-header-footer"
                v-model="form.richHeaderFooter"
                type="checkbox"
              />
              <label for="page-setup-dialog-rich-header-footer">{{
                $t('dialog:pageSetup.richHeaderFooter')
              }}</label>
            </div>

            <div class="form-group full">
              <label class="name">{{
                $t('dialog:pageSetup.firstPageNumber')
              }}</label>
              <div class="description">
                {{ $t('dialog:pageSetup.firstPageNumberDescription') }}
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
                {{ $t('dialog:pageSetup.headerHorizontalRule') }}
              </div>
              <input
                id="page-setup-dialog-header-hr"
                v-model="form.showHeaderHorizontalRule"
                type="checkbox"
              />
              <label for="page-setup-dialog-header-hr">
                {{ $t('dialog:pageSetup.showHeaderHorizontalRuleDescription') }}
              </label>

              <template v-if="form.showHeaderHorizontalRule">
                <div class="form-group row">
                  <label class="header-rule-label name">{{
                    $t('dialog:pageSetup.color')
                  }}</label>
                  <ColorPicker
                    v-model="form.headerHorizontalRuleColor"
                    class="neume-colors-input"
                  />
                </div>

                <div class="form-group">
                  <label class="header-rule-label name">{{
                    $t('dialog:pageSetup.thickness')
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
                    $t('dialog:pageSetup.marginTop')
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
                    $t('dialog:pageSetup.marginBottom')
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
                          'dialog:pageSetup.excludeHorizontalRuleFirstPageDescription',
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
                          'dialog:pageSetup.excludeHorizontalRuleOddPageDescription',
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
                          'dialog:pageSetup.excludeHorizontalRuleEvenPageDescription',
                        )
                      }}
                    </label>
                  </div>
                </template>
              </template>
            </div>

            <div class="form-group full">
              <div class="name">
                {{ $t('dialog:pageSetup.footerHorizontalRule') }}
              </div>
              <input
                id="page-setup-dialog-footer-hr"
                v-model="form.showFooterHorizontalRule"
                type="checkbox"
              />
              <label for="page-setup-dialog-footer-hr">{{
                $t('dialog:pageSetup.showFooterHorizontalRuleDescription')
              }}</label>

              <template v-if="form.showFooterHorizontalRule">
                <div class="form-group row">
                  <label class="header-rule-label name">{{
                    $t('dialog:pageSetup.color')
                  }}</label>
                  <ColorPicker
                    v-model="form.footerHorizontalRuleColor"
                    class="neume-colors-input"
                  />
                </div>

                <div class="form-group">
                  <label class="header-rule-label name">{{
                    $t('dialog:pageSetup.thickness')
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
                    $t('dialog:pageSetup.marginTop')
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
                    $t('dialog:pageSetup.marginBottom')
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
                          'dialog:pageSetup.excludeHorizontalRuleFirstPageDescription',
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
                          'dialog:pageSetup.excludeHorizontalRuleOddPageDescription',
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
                          'dialog:pageSetup.excludeHorizontalRuleEvenPageDescription',
                        )
                      }}
                    </label>
                  </div>
                </template>
              </template>
            </div>

            <div ref="miscellaneousRef" class="subheader">
              {{ $t('dialog:pageSetup.miscellaneous') }}
            </div>

            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.useChrysanthineAccidentals') }}
              </div>
              <input
                id="page-setup-dialog-chrysanthine-accidentals"
                v-model="form.chrysanthineAccidentals"
                type="checkbox"
              />
              <label for="page-setup-dialog-chrysanthine-accidentals">{{
                $t('dialog:pageSetup.useChrysanthineAccidentalsDescription')
              }}</label>
            </div>

            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.disableFthoraRestrictions') }}
              </div>
              <input
                id="page-setup-dialog-no-fthora-restrictions"
                v-model="form.noFthoraRestrictions"
                type="checkbox"
              />
              <label for="page-setup-dialog-no-fthora-restrictions">{{
                $t('dialog:pageSetup.disableFthoraRestrictionsDescription')
              }}</label>
            </div>

            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.alignIsonIndicators') }}
              </div>
              <input
                id="page-setup-dialog-align-ison-indicators"
                v-model="form.alignIsonIndicators"
                type="checkbox"
              />
              <label for="page-setup-dialog-align-ison-indicators">{{
                $t('dialog:pageSetup.alignIsonIndicatorsDescription')
              }}</label>
            </div>

            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.melkiteRtl') }}
              </div>
              <input
                id="page-setup-dialog-melkite-rtl"
                v-model="form.melkiteRtl"
                type="checkbox"
                @change="onChangeMelkiteRtl"
              />
              <label for="page-setup-dialog-melkite-rtl">{{
                $t('dialog:pageSetup.melkiteRtlDescription')
              }}</label>
            </div>
            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.disableGreekMelismata') }}
              </div>
              <input
                id="page-setup-dialog-disable-melismata"
                v-model="form.disableGreekMelismata"
                type="checkbox"
              />
              <label for="page-setup-dialog-disable-melismata">{{
                $t('dialog:pageSetup.disableGreekMelismataDescription')
              }}</label>
            </div>
            <div class="form-group">
              <label class="name">{{
                $t('dialog:pageSetup.lyricsMelismaCutoffWidth')
              }}</label>
              <div class="description">
                {{ $t('dialog:pageSetup.lyricsMelismaCutoffWidthDescription') }}
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

            <div ref="dropCapsRef" class="subheader">
              {{ $t('dialog:pageSetup.dropCaps') }}
            </div>
            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.defaultStyling') }}
              </div>
              <div class="description">
                {{ $t('dialog:pageSetup.dropCapsDescription') }}
              </div>

              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.color')
                }}</label>
                <ColorPicker v-model="form.dropCapDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.size')
                }}</label>
                <InputFontSize
                  v-model="form.dropCapDefaultFontSize"
                  class="drop-caps-input"
                  :max="500"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.lineSpan')
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
                  $t('dialog:pageSetup.lineHeight')
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
                  $t('dialog:pageSetup.font')
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
                  $t('dialog:pageSetup.style')
                }}</label>
                <input
                  id="page-setup-dialog-drop-cap-bold"
                  v-model="form.dropCapDefaultFontWeight"
                  type="checkbox"
                  true-value="700"
                  false-value="400"
                />
                <label for="page-setup-dialog-drop-cap-bold">{{
                  $t('dialog:pageSetup.bold')
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
                  $t('dialog:pageSetup.italic')
                }}</label>
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.outline')
                }}</label>

                <InputStrokeWidth
                  v-model="form.dropCapDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
            </div>

            <div ref="lyricsRef" class="subheader">
              {{ $t('dialog:pageSetup.lyrics') }}
            </div>
            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.defaultStyling') }}
              </div>
              <div class="description">
                {{ $t('dialog:pageSetup.lyricsDescription') }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.color')
                }}</label>
                <ColorPicker v-model="form.lyricsDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.size')
                }}</label>
                <InputFontSize
                  v-model="form.lyricsDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>

              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.font')
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
                  $t('dialog:pageSetup.style')
                }}</label>
                <input
                  id="page-setup-dialog-lyrics-bold"
                  v-model="form.lyricsDefaultFontWeight"
                  type="checkbox"
                  true-value="700"
                  false-value="400"
                />
                <label for="page-setup-dialog-lyrics-bold">{{
                  $t('dialog:pageSetup.bold')
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
                  $t('dialog:pageSetup.italic')
                }}</label>
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.outline')
                }}</label>
                <InputStrokeWidth
                  v-model="form.lyricsDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
            </div>
            <div ref="textBoxesRef" class="subheader">
              {{ $t('dialog:pageSetup.textBoxes') }}
            </div>
            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.defaultStyling') }}
              </div>
              <div class="description">
                {{ $t('dialog:pageSetup.textBoxesDescription') }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.color')
                }}</label>
                <ColorPicker v-model="form.textBoxDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.size')
                }}</label>
                <InputFontSize
                  v-model="form.textBoxDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.lineHeight')
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
                  $t('dialog:pageSetup.font')
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
                  $t('dialog:pageSetup.style')
                }}</label>
                <input
                  id="page-setup-dialog-text-box-bold"
                  v-model="form.textBoxDefaultFontWeight"
                  type="checkbox"
                  true-value="700"
                  false-value="400"
                />
                <label for="page-setup-dialog-text-box-bold">{{
                  $t('dialog:pageSetup.bold')
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
                  $t('dialog:pageSetup.italic')
                }}</label>
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.outline')
                }}</label>

                <InputStrokeWidth
                  v-model="form.textBoxDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
            </div>

            <div ref="modeKeysRef" class="subheader">
              {{ $t('dialog:pageSetup.modeKeys') }}
            </div>
            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.defaultStyling') }}
              </div>
              <div class="description">
                {{ $t('dialog:pageSetup.modeKeysDescription') }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.color')
                }}</label>
                <ColorPicker v-model="form.modeKeyDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.size')
                }}</label>
                <InputFontSize
                  v-model="form.modeKeyDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.outline')
                }}</label>
                <InputStrokeWidth
                  v-model="form.modeKeyDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.heightAdjust')
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
              {{ $t('dialog:pageSetup.neumes') }}
            </div>
            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.defaultStyling') }}
              </div>
              <div class="description">
                {{ $t('dialog:pageSetup.neumesDescription') }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.color')
                }}</label>
                <ColorPicker v-model="form.neumeDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.size')
                }}</label>
                <InputFontSize
                  v-model="form.neumeDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.font')
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
                  $t('dialog:pageSetup.outline')
                }}</label>
                <InputStrokeWidth
                  v-model="form.neumeDefaultStrokeWidth"
                  class="drop-caps-input"
                />
              </div>
            </div>

            <div class="form-group">
              <div class="name">
                {{ $t('dialog:pageSetup.alternateLineStyling') }}
              </div>
              <div class="description">
                {{ $t('dialog:pageSetup.alternateLineDescription') }}
              </div>
              <div class="form-group row">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.color')
                }}</label>
                <ColorPicker v-model="form.alternateLineDefaultColor" />
              </div>
              <div class="form-group">
                <label class="drop-caps-label name">{{
                  $t('dialog:pageSetup.size')
                }}</label>
                <InputFontSize
                  v-model="form.alternateLineDefaultFontSize"
                  class="drop-caps-input"
                />
              </div>
            </div>

            <div ref="neumeStylesRef" class="subheader">
              {{ $t('dialog:pageSetup.neumeStyles') }}
            </div>
            <div class="form-group row">
              <div class="neume-colors-checkbox-container"></div>
              <label class="neume-colors-label small-header">{{
                $t('dialog:pageSetup.type')
              }}</label>
              <label class="neume-colors-input small-header">{{
                $t('dialog:pageSetup.color')
              }}</label>
              <label class="small-header">{{
                $t('dialog:pageSetup.outline')
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
                $t('dialog:pageSetup.accidentals')
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
                $t('dialog:pageSetup.breath')
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
                $t('dialog:pageSetup.cross')
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
                $t('dialog:pageSetup.fthoras')
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
                $t('dialog:pageSetup.gorgons')
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
                $t('dialog:pageSetup.heterons')
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
                $t('dialog:pageSetup.ison')
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
                $t('dialog:pageSetup.koronis')
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
                $t('dialog:pageSetup.martyriae')
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
                $t('dialog:pageSetup.measureBars')
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
                $t('dialog:pageSetup.measureNo')
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
                $t('dialog:pageSetup.noteIndicators')
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
                $t('dialog:pageSetup.tempos')
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
                {{ $t('dialog:pageSetup.neumeBulkColor') }}
              </div>
              <div class="description">
                {{ $t('dialog:pageSetup.neumeBulkColorDescription') }}
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
        <div class="small-header">{{ $t('dialog:pageSetup.preview') }}</div>
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
            {{ $t('dialog:common.update') }}
          </button>
          <button class="reset-btn neutral-btn" @click="saveAsDefault">
            {{ $t('dialog:common.setAsDefault') }}
          </button>
          <button class="reset-btn neutral-btn" @click="resetToSystemDefaults">
            {{ $t('dialog:common.useSystemDefault') }}
          </button>
          <button class="cancel-btn" @click="$emit('close')">
            {{ $t('dialog:common.cancel') }}
          </button>
        </div>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { throttle } from 'throttle-debounce';
import { defineComponent, PropType } from 'vue';

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
import { Accidental, QuantitativeNeume } from '@/models/Neumes';
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

export default defineComponent({
  components: {
    ModalDialog,
    ColorPicker,
    InputUnit,
    InputStrokeWidth,
    InputFontSize,
    NeumeBoxSyllable,
    NeumeBoxMartyria,
    NeumeBoxTempo,
  },
  props: {
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
    fonts: {
      type: Array as PropType<string[]>,
      required: true,
    },
  },
  emits: ['close', 'update'],

  data() {
    return {
      form: new PageSetup(),
      currentSection: 'pageSizeRef',
      neumeBulkColor: '#000000',

      QuantitativeNeume,
      Accidental,
      NeumeColorOptions,

      MartyriaElement,
      NoteElement,
      TempoElement,

      previewNeumes,

      selectedNeumeColorOptions: [] as NeumeColorOptions[],

      updateCurrentSectionThrottled: null as (() => void) | null,
    };
  },

  computed: {
    topMargin() {
      return this.toDisplayUnit(this.form.topMargin).toFixed(2);
    },

    bottomMargin() {
      return this.toDisplayUnit(this.form.bottomMargin).toFixed(2);
    },

    leftMargin() {
      return this.toDisplayUnit(this.form.leftMargin).toFixed(2);
    },

    rightMargin() {
      return this.toDisplayUnit(this.form.rightMargin).toFixed(2);
    },

    headerMargin() {
      return this.toDisplayUnit(this.form.headerMargin).toFixed(2);
    },

    footerMargin() {
      return this.toDisplayUnit(this.form.footerMargin).toFixed(2);
    },

    lyricsVerticalOffset() {
      return this.toDisplayUnit(this.form.lyricsVerticalOffset).toFixed(3);
    },

    lyricsMinimumSpacing() {
      return this.toDisplayUnit(this.form.lyricsMinimumSpacing).toFixed(3);
    },

    lineHeight() {
      return this.toDisplayUnit(this.form.lineHeight).toFixed(3);
    },

    hyphenSpacing() {
      return this.toDisplayUnit(this.form.hyphenSpacing).toFixed(3);
    },
    dropCapFontFamilies() {
      return [
        'Source Serif',
        'GFS Didot',
        'Noto Naskh Arabic',
        'Old Standard',
        ...this.fonts,
      ];
    },

    lyricsFontFamilies() {
      return [
        'Source Serif',
        'GFS Didot',
        'Noto Naskh Arabic',
        'Old Standard',
        ...this.fonts,
      ];
    },

    neumeFontFamilies() {
      if (this.form.melkiteRtl) {
        return [{ displayName: 'EZ Psaltica RTL', value: 'NeanesRTL' }];
      } else {
        return [
          { displayName: 'EZ Psaltica', value: 'Neanes' },
          { displayName: 'Stathis Series', value: 'NeanesStathisSeries' },
          { displayName: 'Almouzios', value: 'Almouzios' },
        ];
      }
    },

    neumeSpacingMax() {
      return Math.round(this.toDisplayUnit(this.form.pageWidth));
    },

    heightAdjustmentMin() {
      return -Math.round(Unit.fromPt(this.pageSetup.pageHeight));
    },

    heightAdjustmentMax() {
      return Unit.toPt(this.pageSetup.pageHeight);
    },

    pageSizes() {
      return pageSizes;
    },

    pageSize: {
      get() {
        return this.form.pageSize;
      },
      set(value: PageSize) {
        this.form.pageSize = value;

        this.updatePageSize();
      },
    },

    landscape: {
      get() {
        return this.form.landscape;
      },
      set(value: boolean) {
        this.form.landscape = value;

        this.updatePageSize();
      },
    },

    marginUnitLabel() {
      switch (this.form.pageSizeUnit) {
        case 'pc':
          return 'dialog:pageSetup.pc';
        case 'pt':
          return 'dialog:pageSetup.pt';
        case 'cm':
          return 'dialog:pageSetup.cm';
        case 'mm':
          return 'dialog:pageSetup.mm';
        case 'in':
          return 'dialog:pageSetup.in';
        default:
          console.warn(`Unknown page size unit: ${this.form.pageSizeUnit}`);
          return null;
      }
    },

    marginStep() {
      switch (this.form.pageSizeUnit) {
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
          console.warn(`Unknown page size unit: ${this.form.pageSizeUnit}`);
          return 1;
      }
    },

    spacingStep() {
      switch (this.form.pageSizeUnit) {
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
          console.warn(`Unknown page size unit: ${this.form.pageSizeUnit}`);
          return 1;
      }
    },
  },

  created() {
    Object.assign(this.form, this.pageSetup);

    window.addEventListener('keydown', this.onKeyDown);

    this.updateCurrentSectionThrottled = throttle(
      50,
      this.updateCurrentSection,
    );
  },

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  },

  methods: {
    toDisplayUnit(value: number) {
      switch (this.form.pageSizeUnit) {
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
          console.warn(`Unknown page size unit: ${this.form.pageSizeUnit}`);
          return 0;
      }
    },

    toStorageUnit(value: number) {
      switch (this.form.pageSizeUnit) {
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
          console.warn(`Unknown page size unit: ${this.form.pageSizeUnit}`);
          return 0;
      }
    },
    updateCurrentSection() {
      const scrollParentTop = (
        this.$refs.rightPaneRef as HTMLElement
      ).getBoundingClientRect().top;

      let closest: string | null = null;
      let closestDistance = Infinity;

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
      ];

      for (const id of sectionIds) {
        const el = this.$refs[id] as HTMLElement;

        const top = Math.abs(el.getBoundingClientRect().top - scrollParentTop);

        if (top < closestDistance) {
          closest = id;
          closestDistance = top;
        }
      }

      if (closest !== null) {
        this.currentSection = closest;
      }
    },

    changeNeumeColorInBulk() {
      for (const neume of this.selectedNeumeColorOptions) {
        switch (neume) {
          case NeumeColorOptions.Accidentals:
            this.form.accidentalDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.Fthoras:
            this.form.fthoraDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.Gorgons:
            this.form.gorgonDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.Heterons:
            this.form.heteronDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.Ison:
            this.form.isonDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.Koronis:
            this.form.koronisDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.Martyria:
            this.form.martyriaDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.MeasureBars:
            this.form.measureBarDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.MeasureNumbers:
            this.form.accidentalDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.NoteIndicators:
            this.form.noteIndicatorDefaultColor = this.neumeBulkColor;
            break;
          case NeumeColorOptions.Tempos:
            this.form.tempoDefaultColor = this.neumeBulkColor;
            break;
        }
      }
    },
    updateTopMargin(value: number) {
      this.form.topMargin = Math.min(
        Math.max(this.toStorageUnit(value), 0),
        this.form.pageHeight - this.form.bottomMargin - Unit.fromInch(0.5),
      );

      this.$forceUpdate();
    },

    updateBottomMargin(value: number) {
      this.form.bottomMargin = Math.min(
        Math.max(this.toStorageUnit(value), 0),
        this.form.pageHeight - this.form.topMargin - Unit.fromInch(0.5),
      );

      this.$forceUpdate();
    },

    updateLeftMargin(value: number) {
      this.form.leftMargin = Math.min(
        Math.max(this.toStorageUnit(value), 0),
        this.form.pageWidth - this.form.rightMargin - Unit.fromInch(0.5),
      );

      this.$forceUpdate();
    },

    updateRightMargin(value: number) {
      this.form.rightMargin = Math.min(
        Math.max(this.toStorageUnit(value), 0),
        this.form.pageWidth - this.form.leftMargin - Unit.fromInch(0.5),
      );

      this.$forceUpdate();
    },

    updateHeaderMargin(value: number) {
      this.form.headerMargin = Math.min(
        Math.max(this.toStorageUnit(value), 0),
        this.form.innerPageHeight,
      );

      this.$forceUpdate();
    },

    updateFooterMargin(value: number) {
      this.form.footerMargin = Math.min(
        Math.max(this.toStorageUnit(value), 0),
        this.form.innerPageHeight,
      );

      this.$forceUpdate();
    },

    updateLyricsVerticalOffset(value: number) {
      this.form.lyricsVerticalOffset = Math.min(
        this.toStorageUnit(value),
        this.form.innerPageHeight -
          this.form.lyricsDefaultFontSize -
          this.form.neumeDefaultFontSize,
      );

      this.$forceUpdate();
    },

    updateLyricsMinimumSpacing(value: number) {
      this.form.lyricsMinimumSpacing = Math.min(
        this.toStorageUnit(value),
        this.form.innerPageWidth,
      );

      this.$forceUpdate();
    },

    updateLineHeight(value: number) {
      this.form.lineHeight = Math.min(
        Math.max(this.toStorageUnit(value), 0),
        this.form.innerPageHeight,
      );

      this.$forceUpdate();
    },

    updateHyphenSpacing(value: number) {
      this.form.hyphenSpacing = Math.min(
        Math.max(this.toStorageUnit(value), 0),
        this.form.innerPageWidth,
      );

      this.$forceUpdate();
    },

    onChangeMelkiteRtl() {
      this.form.neumeDefaultFontFamily = this.form.melkiteRtl
        ? 'NeanesRTL'
        : 'Neanes';
    },

    isSyllableElement(elementType: ElementType) {
      return elementType == ElementType.Note;
    },

    isMartyriaElement(elementType: ElementType) {
      return elementType == ElementType.Martyria;
    },

    isTempoElement(elementType: ElementType) {
      return elementType == ElementType.Tempo;
    },

    onKeyDown(event: KeyboardEvent) {
      if (event.code === 'Escape') {
        this.$emit('close');
      }
    },

    updatePageSize() {
      if (this.form.pageSize === 'Custom') {
        if (this.form.landscape) {
          this.form.pageWidth = this.form.pageHeightCustom;
          this.form.pageHeight = this.form.pageWidthCustom;
        } else {
          this.form.pageWidth = this.form.pageWidthCustom;
          this.form.pageHeight = this.form.pageHeightCustom;
        }
        return;
      }

      const pageSize = pageSizes.find((x) => x.name === this.form.pageSize);
      if (pageSize) {
        if (this.form.landscape) {
          this.form.pageWidth = pageSize.height;
          this.form.pageHeight = pageSize.width;
        } else {
          this.form.pageWidth = pageSize.width;
          this.form.pageHeight = pageSize.height;
        }
      }
    },

    updatePageSetup() {
      this.$emit('update', this.form);
      this.$emit('close');
    },

    saveAsDefault() {
      const defaults = new PageSetup_v1();
      SaveService.SavePageSetup(defaults, this.form);

      localStorage.setItem('pageSetupDefault', JSON.stringify(defaults));
    },

    resetToSystemDefaults() {
      this.form = new PageSetup();
    },

    scrollTo(el: HTMLElement) {
      el.scrollIntoView({ behavior: 'instant', block: 'start' });
    },
  },
});
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
