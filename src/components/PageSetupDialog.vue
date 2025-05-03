<template>
  <ModalDialog>
    <div class="container">
      <div class="header">{{ $t('dialog:pageSetup.root') }}</div>
      <div class="pane-container">
        <div class="left-pane">
          <div class="subheader">
            {{ $t('dialog:pageSetup.root') }}
            <span class="units">({{ $t(marginUnitLabel!) }})</span>
          </div>
          <div class="form-group">
            <label class="margin-label">{{ $t('dialog:common.top') }}</label>
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
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{ $t('dialog:common.bottom') }}</label>
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
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{ $t('dialog:common.left') }}</label>
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
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{ $t('dialog:common.right') }}</label>
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
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{
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
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{
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
            />
          </div>
          <div class="form-group">
            <div class="subheader">
              {{ $t('dialog:pageSetup.orientation') }}
            </div>
            <input
              id="page-setup-dialog-landscape-false"
              type="radio"
              name="landscape"
              v-model="landscape"
              :value="false"
              :checked="!landscape"
            />
            <label for="page-setup-dialog-landscape-false">{{
              $t('dialog:pageSetup.portrait')
            }}</label>
            <input
              id="page-setup-dialog-landscape-true"
              type="radio"
              name="landscape"
              v-model="landscape"
              :value="true"
              :checked="landscape"
            />
            <label for="page-setup-dialog-landscape-true">{{
              $t('dialog:pageSetup.landscape')
            }}</label>
          </div>
          <div class="form-group">
            <div class="subheader">{{ $t('dialog:pageSetup.paperSize') }}</div>
            <select class="paper-size-select" v-model="pageSize">
              <!-- TODO localize -->
              <option v-for="size in pageSizes" :key="size.name">
                {{ size.name }}
              </option>
            </select>
          </div>
          <template v-if="form.pageSize === 'Custom'">
            <div class="form-group">
              <label class="margin-label">{{
                $t('dialog:pageSetup.width')
              }}</label>
              <InputUnit
                class="margin-input"
                type="number"
                :unit="form.pageSizeUnit"
                :min="1"
                :max="10000"
                :step="marginStep"
                :precision="2"
                v-model="form.pageWidthCustom"
                @change="updatePageSize"
              />
            </div>
            <div class="form-group">
              <label class="margin-label">{{
                $t('dialog:pageSetup.height')
              }}</label>
              <InputUnit
                class="margin-input"
                type="number"
                :unit="form.pageSizeUnit"
                :min="1"
                :max="10000"
                :step="marginStep"
                :precision="2"
                v-model="form.pageHeightCustom"
                @change="updatePageSize"
              />
            </div>
          </template>
          <div class="form-group">
            <div class="subheader">{{ $t('dialog:pageSetup.unit') }}</div>
            <input
              id="page-setup-dialog-unit-in"
              type="radio"
              name="pageSizeUnit"
              v-model="form.pageSizeUnit"
              value="in"
              :checked="form.pageSizeUnit === 'in'"
            />
            <label for="page-setup-dialog-unit-in">{{
              $t('dialog:pageSetup.in')
            }}</label>
            <input
              id="page-setup-dialog-unit-cm"
              type="radio"
              name="pageSizeUnit"
              v-model="form.pageSizeUnit"
              value="cm"
              :checked="form.pageSizeUnit === 'cm'"
            />
            <label for="page-setup-dialog-unit-cm">{{
              $t('dialog:pageSetup.cm')
            }}</label>
            <input
              id="page-setup-dialog-unit-mm"
              type="radio"
              name="pageSizeUnit"
              v-model="form.pageSizeUnit"
              value="mm"
              :checked="form.pageSizeUnit === 'mm'"
            />
            <label for="page-setup-dialog-unit-mm">{{
              $t('dialog:pageSetup.mm')
            }}</label>
            <input
              id="page-setup-dialog-unit-pt"
              type="radio"
              name="pageSizeUnit"
              v-model="form.pageSizeUnit"
              value="pt"
              :checked="form.pageSizeUnit === 'pt'"
            />
            <label for="page-setup-dialog-unit-pt">{{
              $t('dialog:pageSetup.pt')
            }}</label>
            <input
              id="page-setup-dialog-unit-pc"
              type="radio"
              name="pageSizeUnit"
              v-model="form.pageSizeUnit"
              value="pc"
              :checked="form.pageSizeUnit === 'pc'"
            />
            <label for="page-setup-dialog-unit-pc">{{
              $t('dialog:pageSetup.pc')
            }}</label>
          </div>
          <div class="subheader">
            {{ $t('dialog:pageSetup.spacing') }}
            <span class="units">({{ $t(marginUnitLabel!) }})</span>
          </div>
          <div class="form-group">
            <label class="margin-label">{{
              $t('dialog:pageSetup.neumes')
            }}</label>
            <InputUnit
              class="margin-input"
              type="number"
              :unit="form.pageSizeUnit"
              :min="-neumeSpacingMax"
              :max="neumeSpacingMax"
              :step="spacingStep"
              :precision="3"
              v-model="form.neumeDefaultSpacing"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{
              $t('dialog:pageSetup.martyriaVerticalOffset')
            }}</label>
            <InputUnit
              class="margin-input"
              type="number"
              :unit="form.pageSizeUnit"
              :min="-neumeSpacingMax"
              :max="neumeSpacingMax"
              :step="spacingStep"
              :precision="3"
              v-model="form.martyriaVerticalOffset"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{
              $t('dialog:pageSetup.lyricsV')
            }}</label>
            <input
              class="margin-input"
              type="number"
              :step="spacingStep"
              :value="lyricsVerticalOffset"
              @change="
                updateLyricsVerticalOffset(
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{
              $t('dialog:pageSetup.lyricsH')
            }}</label>
            <input
              class="margin-input"
              type="number"
              :step="spacingStep"
              :value="lyricsMinimumSpacing"
              @change="
                updateLyricsMinimumSpacing(
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{
              $t('dialog:pageSetup.line')
            }}</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="spacingStep"
              :value="lineHeight"
              @change="
                updateLineHeight(
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <div class="form-group">
            <label class="margin-label">{{
              $t('dialog:pageSetup.hyphens')
            }}</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="spacingStep"
              :value="hyphenSpacing"
              @change="
                updateHyphenSpacing(
                  Number(($event.target as HTMLInputElement).value),
                )
              "
            />
          </div>
          <div class="subheader">
            {{ $t('dialog:pageSetup.headersAndFooters') }}
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-show-header"
              type="checkbox"
              v-model="form.showHeader"
            />
            <label for="page-setup-dialog-show-header">{{
              $t('dialog:pageSetup.includeHeader')
            }}</label>
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-show-footer"
              type="checkbox"
              v-model="form.showFooter"
            />
            <label for="page-setup-dialog-show-footer">{{
              $t('dialog:pageSetup.includeFooter')
            }}</label>
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-different-first-page"
              type="checkbox"
              v-model="form.headerDifferentFirstPage"
            />
            <label for="page-setup-dialog-different-first-page">{{
              $t('dialog:pageSetup.differentFirstPage')
            }}</label>
          </div>
          <div class="form-group">
            <input
              id="page-setup-dialog-different-odd-even"
              type="checkbox"
              v-model="form.headerDifferentOddEven"
            />
            <label for="page-setup-dialog-different-odd-even">{{
              $t('dialog:pageSetup.differentOddAndEven')
            }}</label>
          </div>
          <div class="form-group">
            <input
              id="page-setup-dialog-rich-header-footer"
              type="checkbox"
              v-model="form.richHeaderFooter"
            />
            <label for="page-setup-dialog-rich-header-footer">{{
              $t('dialog:pageSetup.richHeaderFooter')
            }}</label>
          </div>

          <div class="form-group">
            <label>{{ $t('dialog:pageSetup.firstPageNumber') }}</label>

            <InputUnit
              style="width: 3rem; margin-left: 0.5rem"
              unit="unitless"
              :step="1"
              :precision="0"
              :defaultValue="1"
              v-model="form.firstPageNumber"
            />
          </div>

          <div class="subheader">
            {{ $t('dialog:pageSetup.headerHorizontalRule') }}
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-header-hr"
              type="checkbox"
              v-model="form.showHeaderHorizontalRule"
            />
            <label for="page-setup-dialog-header-hr">{{
              $t('dialog:pageSetup.visible')
            }}</label>
          </div>

          <div class="form-group row">
            <label class="header-rule-label">{{
              $t('dialog:pageSetup.color')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.headerHorizontalRuleColor"
            />
          </div>

          <div class="form-group">
            <label class="header-rule-label">{{
              $t('dialog:pageSetup.thickness')
            }}</label>
            <InputUnit
              class="margin-input"
              unit="pt"
              :min="0"
              :max="100"
              :step="0.5"
              v-model="form.headerHorizontalRuleThickness"
              :precision="1"
            />
          </div>

          <div class="form-group">
            <label class="header-rule-label">{{
              $t('dialog:pageSetup.marginTop')
            }}</label>
            <InputUnit
              class="margin-input"
              unit="pt"
              :min="0"
              :max="1000"
              :step="0.5"
              v-model="form.headerHorizontalRuleMarginTop"
              :precision="1"
            />
          </div>

          <div class="form-group">
            <label class="header-rule-label">{{
              $t('dialog:pageSetup.marginBottom')
            }}</label>
            <InputUnit
              class="margin-input"
              unit="pt"
              :min="0"
              :max="1000"
              :step="0.5"
              v-model="form.headerHorizontalRuleMarginBottom"
              :precision="1"
            />
          </div>

          <div class="subheader">
            {{ $t('dialog:pageSetup.footerHorizontalRule') }}
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-header-hr"
              type="checkbox"
              v-model="form.showFooterHorizontalRule"
            />
            <label for="page-setup-dialog-header-hr">{{
              $t('dialog:pageSetup.visible')
            }}</label>
          </div>

          <div class="form-group row">
            <label class="header-rule-label">{{
              $t('dialog:pageSetup.color')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.footerHorizontalRuleColor"
            />
          </div>

          <div class="form-group">
            <label class="header-rule-label">{{
              $t('dialog:pageSetup.thickness')
            }}</label>
            <InputUnit
              class="margin-input"
              unit="pt"
              :min="0"
              :max="100"
              :step="0.5"
              v-model="form.footerHorizontalRuleThickness"
              :precision="1"
            />
          </div>

          <div class="form-group">
            <label class="header-rule-label">{{
              $t('dialog:pageSetup.marginTop')
            }}</label>
            <InputUnit
              class="margin-input"
              unit="pt"
              :min="0"
              :max="1000"
              :step="0.5"
              v-model="form.footerHorizontalRuleMarginTop"
              :precision="1"
            />
          </div>

          <div class="form-group">
            <label class="header-rule-label">{{
              $t('dialog:pageSetup.marginBottom')
            }}</label>
            <InputUnit
              class="margin-input"
              unit="pt"
              :min="0"
              :max="1000"
              :step="0.5"
              v-model="form.footerHorizontalRuleMarginBottom"
              :precision="1"
            />
          </div>

          <div class="subheader">
            {{ $t('dialog:pageSetup.miscellaneous') }}
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-chrysanthine-accidentals"
              type="checkbox"
              v-model="form.chrysanthineAccidentals"
            />
            <label for="page-setup-dialog-chrysanthine-accidentals">{{
              $t('dialog:pageSetup.useChrysanthineAccidentals')
            }}</label>
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-no-fthora-restrictions"
              type="checkbox"
              v-model="form.noFthoraRestrictions"
            />
            <label for="page-setup-dialog-no-fthora-restrictions">{{
              $t('dialog:pageSetup.disableFthoraRestrictions')
            }}</label>
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-melkite-rtl"
              type="checkbox"
              v-model="form.melkiteRtl"
              @change="onChangeMelkiteRtl"
            />
            <label for="page-setup-dialog-melkite-rtl">{{
              $t('dialog:pageSetup.melkiteRtl')
            }}</label>
          </div>
          <div class="form-group">
            <input
              id="page-setup-dialog-disable-melismata"
              type="checkbox"
              v-model="form.disableGreekMelismata"
            />
            <label for="page-setup-dialog-disable-melismata">{{
              $t('dialog:pageSetup.disableGreekMelismata')
            }}</label>
          </div>
          <div class="form-group">
            <label class="melisma-label">{{
              $t('dialog:pageSetup.lyricsMelismaCutoffWidth')
            }}</label>
            <InputUnit
              class="melisma-input"
              unit="pt"
              :min="0"
              :step="1"
              :precision="0"
              v-model="form.lyricsMelismaCutoffWidth"
            />
          </div>
        </div>
        <div class="right-pane">
          <div class="subheader">{{ $t('dialog:pageSetup.dropCaps') }}</div>
          <div class="form-group row">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.color')
            }}</label>
            <ColorPicker v-model="form.dropCapDefaultColor" />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.size')
            }}</label>
            <InputFontSize
              class="drop-caps-input"
              :max="500"
              v-model="form.dropCapDefaultFontSize"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.lineSpan')
            }}</label>
            <InputUnit
              class="drop-caps-input"
              unit="unitless"
              :min="1"
              :max="10"
              :step="1"
              :precision="0"
              v-model="form.dropCapDefaultLineSpan"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.lineHeight')
            }}</label>
            <InputUnit
              class="drop-caps-input"
              :min="0"
              :step="0.1"
              unit="unitless"
              :precision="2"
              placeholder="normal"
              :nullable="true"
              v-model="form.dropCapDefaultLineHeight"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.font')
            }}</label>
            <select
              class="drop-caps-select"
              v-model="form.dropCapDefaultFontFamily"
            >
              <option v-for="family in dropCapFontFamilies" :key="family">
                {{ family }}
              </option>
            </select>
          </div>
          <div class="form-group row">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.style')
            }}</label>
            <input
              id="page-setup-dialog-drop-cap-bold"
              type="checkbox"
              v-model="form.dropCapDefaultFontWeight"
              true-value="700"
              false-value="400"
            />
            <label for="page-setup-dialog-drop-cap-bold">{{
              $t('dialog:pageSetup.bold')
            }}</label>

            <input
              id="page-setup-dialog-drop-cap-italic"
              type="checkbox"
              v-model="form.dropCapDefaultFontStyle"
              true-value="italic"
              false-value="normal"
            />
            <label for="page-setup-dialog-drop-cap-italic">{{
              $t('dialog:pageSetup.italic')
            }}</label>
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.outline')
            }}</label>

            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.dropCapDefaultStrokeWidth"
            />
          </div>
          <div class="subheader">{{ $t('dialog:pageSetup.lyrics') }}</div>
          <div class="form-group row">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.color')
            }}</label>
            <ColorPicker v-model="form.lyricsDefaultColor" />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.size')
            }}</label>
            <InputFontSize
              class="drop-caps-input"
              v-model="form.lyricsDefaultFontSize"
            />
          </div>

          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.font')
            }}</label>
            <select
              class="drop-caps-select"
              v-model="form.lyricsDefaultFontFamily"
            >
              <option v-for="family in lyricsFontFamilies" :key="family">
                {{ family }}
              </option>
            </select>
          </div>
          <div class="form-group row">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.style')
            }}</label>
            <input
              id="page-setup-dialog-lyrics-bold"
              type="checkbox"
              v-model="form.lyricsDefaultFontWeight"
              true-value="700"
              false-value="400"
            />
            <label for="page-setup-dialog-lyrics-bold">{{
              $t('dialog:pageSetup.bold')
            }}</label>

            <input
              id="page-setup-dialog-lyrics-italic"
              type="checkbox"
              v-model="form.lyricsDefaultFontStyle"
              true-value="italic"
              false-value="normal"
            />
            <label for="page-setup-dialog-lyrics-italic">{{
              $t('dialog:pageSetup.italic')
            }}</label>
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.outline')
            }}</label>
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.lyricsDefaultStrokeWidth"
            />
          </div>
          <div class="subheader">{{ $t('dialog:pageSetup.textBoxes') }}</div>
          <div class="form-group row">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.color')
            }}</label>
            <ColorPicker v-model="form.textBoxDefaultColor" />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.size')
            }}</label>
            <InputFontSize
              class="drop-caps-input"
              v-model="form.textBoxDefaultFontSize"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.lineHeight')
            }}</label>
            <InputUnit
              class="drop-caps-input"
              :min="0"
              :step="0.1"
              unit="unitless"
              :precision="2"
              placeholder="normal"
              :nullable="true"
              v-model="form.textBoxDefaultLineHeight"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.font')
            }}</label>
            <select
              class="drop-caps-select"
              v-model="form.textBoxDefaultFontFamily"
            >
              <option v-for="family in lyricsFontFamilies" :key="family">
                {{ family }}
              </option>
            </select>
          </div>
          <div class="form-group row">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.style')
            }}</label>
            <input
              id="page-setup-dialog-text-box-bold"
              type="checkbox"
              v-model="form.textBoxDefaultFontWeight"
              true-value="700"
              false-value="400"
            />
            <label for="page-setup-dialog-text-box-bold">{{
              $t('dialog:pageSetup.bold')
            }}</label>

            <input
              id="page-setup-dialog-text-box-italic"
              type="checkbox"
              v-model="form.textBoxDefaultFontStyle"
              true-value="italic"
              false-value="normal"
            />
            <label for="page-setup-dialog-text-box-italic">{{
              $t('dialog:pageSetup.italic')
            }}</label>
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.outline')
            }}</label>

            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.textBoxDefaultStrokeWidth"
            />
          </div>
          <div class="subheader">{{ $t('dialog:pageSetup.modeKeys') }}</div>
          <div class="form-group row">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.color')
            }}</label>
            <ColorPicker v-model="form.modeKeyDefaultColor" />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.size')
            }}</label>
            <InputFontSize
              class="drop-caps-input"
              v-model="form.modeKeyDefaultFontSize"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.outline')
            }}</label>
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.modeKeyDefaultStrokeWidth"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.heightAdjust')
            }}</label>

            <InputUnit
              class="drop-caps-input"
              unit="pt"
              :min="heightAdjustmentMin"
              :max="heightAdjustmentMax"
              :step="0.5"
              :precision="2"
              v-model="form.modeKeyDefaultHeightAdjustment"
            />
          </div>
          <div class="subheader">{{ $t('dialog:pageSetup.neumes') }}</div>
          <div class="form-group row">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.color')
            }}</label>
            <ColorPicker v-model="form.neumeDefaultColor" />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.size')
            }}</label>
            <InputFontSize
              class="drop-caps-input"
              v-model="form.neumeDefaultFontSize"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.font')
            }}</label>
            <select
              class="drop-caps-select"
              v-model="form.neumeDefaultFontFamily"
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
            <label class="drop-caps-label">{{
              $t('dialog:pageSetup.outline')
            }}</label>
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.neumeDefaultStrokeWidth"
            />
          </div>
          <div class="subheader">{{ $t('dialog:pageSetup.neumeStyles') }}</div>
          <div class="form-group row">
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
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.accidentals')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.accidentalDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.accidentalDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.fthoras')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.fthoraDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.fthoraDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.gorgons')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.gorgonDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.gorgonDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.heterons')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.heteronDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.heteronDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.ison')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.isonDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.isonDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.koronis')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.koronisDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.koronisDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.martyriae')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.martyriaDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.martyriaDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.measureBars')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.measureBarDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.measureBarDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.measureNo')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.measureNumberDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.measureNumberDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.noteIndicators')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.noteIndicatorDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.noteIndicatorDefaultStrokeWidth"
            />
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">{{
              $t('dialog:pageSetup.tempos')
            }}</label>
            <ColorPicker
              class="neume-colors-input"
              v-model="form.tempoDefaultColor"
            />
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.tempoDefaultStrokeWidth"
            />
          </div>
        </div>
      </div>
      <div class="preview-container">
        <div class="small-header">{{ $t('dialog:pageSetup.preview') }}</div>
        <div class="preview-elements">
          <template v-for="(element, index) in previewNeumes">
            <template v-if="isSyllableElement(element.elementType)">
              <NeumeBoxSyllable
                class="syllable-box"
                :key="index"
                :note="element"
                :pageSetup="form"
              />
            </template>
            <template v-if="isMartyriaElement(element.elementType)">
              <NeumeBoxMartyria
                class="marytria-neume-box"
                :key="index"
                :neume="element"
                :pageSetup="form"
              />
            </template>
            <template v-if="isTempoElement(element.elementType)">
              <NeumeBoxTempo
                class="tempo-neume-box"
                :key="index"
                :neume="element"
                :pageSetup="form"
              />
            </template>
          </template>
        </div>
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
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';

import ColorPicker from '@/components/ColorPicker.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputUnit from '@/components/InputUnit.vue';
import ModalDialog from '@/components/ModalDialog.vue';
import NeumeVue from '@/components/Neume.vue';
import NeumeBoxMartyria from '@/components/NeumeBoxMartyria.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import NeumeBoxTempo from '@/components/NeumeBoxTempo.vue';
import { ElementType } from '@/models/Element';
import { Accidental, QuantitativeNeume } from '@/models/Neumes';
import { PageSetup, PageSize, pageSizes } from '@/models/PageSetup';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import { SaveService } from '@/services/SaveService';
import { Unit } from '@/utils/Unit';

@Component({
  components: {
    ModalDialog,
    ColorPicker,
    InputUnit,
    InputStrokeWidth,
    InputFontSize,
    Neume: NeumeVue,
    NeumeBoxSyllable,
    NeumeBoxMartyria,
    NeumeBoxTempo,
  },
  emits: ['close', 'update'],
})
export default class PageSetupDialog extends Vue {
  @Prop() pageSetup!: PageSetup;
  @Prop() fonts!: string[];
  form: PageSetup = new PageSetup();

  QuantitativeNeume = QuantitativeNeume;
  Accidental = Accidental;

  previewNeumes = [
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
  ];

  get dropCapFontFamilies() {
    return [
      'Source Serif',
      'Athonite',
      'GFS Didot',
      'Noto Naskh Arabic',
      'Omega',
      'PFGoudyInitials',
      ...this.fonts,
    ];
  }

  get lyricsFontFamilies() {
    return [
      'Source Serif',
      'GFS Didot',
      'Noto Naskh Arabic',
      'Omega',
      ...this.fonts,
    ];
  }

  get neumeFontFamilies() {
    if (this.form.melkiteRtl) {
      return [{ displayName: 'EZ Psaltica RTL', value: 'NeanesRTL' }];
    } else {
      return [
        { displayName: 'EZ Psaltica', value: 'Neanes' },
        { displayName: 'Stathis Series', value: 'NeanesStathisSeries' },
      ];
    }
  }

  get neumeSpacingMax() {
    return Math.round(this.toDisplayUnit(this.form.pageWidth));
  }

  get heightAdjustmentMin() {
    return -Math.round(Unit.fromPt(this.pageSetup.pageHeight));
  }

  get heightAdjustmentMax() {
    return Unit.toPt(this.pageSetup.pageHeight);
  }

  created() {
    Object.assign(this.form, this.pageSetup);

    window.addEventListener('keydown', this.onKeyDown);
  }

  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  get pageSizes() {
    return pageSizes;
  }

  get pageSize() {
    return this.form.pageSize;
  }

  set pageSize(value: PageSize) {
    this.form.pageSize = value;

    this.updatePageSize();
  }

  get landscape() {
    return this.form.landscape;
  }

  set landscape(value: boolean) {
    this.form.landscape = value;
    this.updatePageSize();
  }

  get marginUnitLabel() {
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
  }

  get marginStep() {
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
  }

  get spacingStep() {
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
  }

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
  }

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
  }

  get topMargin() {
    return this.toDisplayUnit(this.form.topMargin).toFixed(2);
  }

  updateTopMargin(value: number) {
    this.form.topMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form.pageHeight - this.form.bottomMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get bottomMargin() {
    return this.toDisplayUnit(this.form.bottomMargin).toFixed(2);
  }

  updateBottomMargin(value: number) {
    this.form.bottomMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form.pageHeight - this.form.topMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get leftMargin() {
    return this.toDisplayUnit(this.form.leftMargin).toFixed(2);
  }

  updateLeftMargin(value: number) {
    this.form.leftMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form.pageWidth - this.form.rightMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get rightMargin() {
    return this.toDisplayUnit(this.form.rightMargin).toFixed(2);
  }

  updateRightMargin(value: number) {
    this.form.rightMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form.pageWidth - this.form.leftMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get headerMargin() {
    return this.toDisplayUnit(this.form.headerMargin).toFixed(2);
  }

  updateHeaderMargin(value: number) {
    this.form.headerMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form.innerPageHeight,
    );

    this.$forceUpdate();
  }

  get footerMargin() {
    return this.toDisplayUnit(this.form.footerMargin).toFixed(2);
  }

  updateFooterMargin(value: number) {
    this.form.footerMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form.innerPageHeight,
    );

    this.$forceUpdate();
  }

  get lyricsVerticalOffset() {
    return this.toDisplayUnit(this.form.lyricsVerticalOffset).toFixed(3);
  }

  updateLyricsVerticalOffset(value: number) {
    this.form.lyricsVerticalOffset = Math.min(
      this.toStorageUnit(value),
      this.form.innerPageHeight -
        this.form.lyricsDefaultFontSize -
        this.form.neumeDefaultFontSize,
    );

    this.$forceUpdate();
  }

  get lyricsMinimumSpacing() {
    return this.toDisplayUnit(this.form.lyricsMinimumSpacing).toFixed(3);
  }

  updateLyricsMinimumSpacing(value: number) {
    this.form.lyricsMinimumSpacing = Math.min(
      this.toStorageUnit(value),
      this.form.innerPageWidth,
    );

    this.$forceUpdate();
  }

  get lineHeight() {
    return this.toDisplayUnit(this.form.lineHeight).toFixed(3);
  }

  get hyphenSpacing() {
    return this.toDisplayUnit(this.form.hyphenSpacing).toFixed(3);
  }

  updateLineHeight(value: number) {
    this.form.lineHeight = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form.innerPageHeight,
    );

    this.$forceUpdate();
  }

  updateHyphenSpacing(value: number) {
    this.form.hyphenSpacing = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form.innerPageWidth,
    );

    this.$forceUpdate();
  }

  onChangeMelkiteRtl() {
    this.form.neumeDefaultFontFamily = this.form.melkiteRtl
      ? 'NeanesRTL'
      : 'Neanes';
  }

  isSyllableElement(elementType: ElementType) {
    return elementType == ElementType.Note;
  }

  isMartyriaElement(elementType: ElementType) {
    return elementType == ElementType.Martyria;
  }

  isTempoElement(elementType: ElementType) {
    return elementType == ElementType.Tempo;
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.$emit('close');
    }
  }

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
  }

  updatePageSetup() {
    this.$emit('update', this.form);
    this.$emit('close');
  }

  saveAsDefault() {
    const defaults = new PageSetup_v1();
    SaveService.SavePageSetup(defaults, this.form);

    localStorage.setItem('pageSetupDefault', JSON.stringify(defaults));
  }

  resetToSystemDefaults() {
    this.form = new PageSetup();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.dialog-content {
  display: flex;
}

.container {
  display: flex;
  flex-direction: column;
  height: 80vh;
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
}

.pane-container {
  display: flex;
  min-width: 500px;
  max-width: 95vw;
  margin-bottom: 1.5rem;
  overflow: auto;
}

.right-pane {
  flex: 1;
}

.header {
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 0.5rem;
}

.subheader {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.small-header {
  font-weight: bold;
  font-size: 0.9rem;
}

.units {
  font-weight: normal;
  color: gray;
}

.form-group {
  margin: 0.5rem 0;
}

.row {
  display: flex;
}

.margin-label {
  display: inline-block;
  width: 4.75rem;
}

.margin-input {
  width: 3.5rem;
}

.left-pane {
  margin-right: 2rem;
}

.header-rule-label {
  display: inline-block;
  width: 6rem;
}

.drop-caps-label {
  display: inline-block;
  width: 4rem;
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
</style>
