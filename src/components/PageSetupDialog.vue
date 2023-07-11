<template>
  <ModalDialog>
    <div class="container">
      <div class="header">Page Setup</div>
      <div class="pane-container">
        <div class="left-pane">
          <div class="subheader">
            Margins <span class="units">({{ marginUnitLabel }})</span>
          </div>
          <div class="form-group">
            <label class="margin-label">Top</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="marginStep"
              :value="topMargin"
              @change="updateTopMargin($event.target.value)"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Bottom</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="marginStep"
              :value="bottomMargin"
              @change="updateBottomMargin($event.target.value)"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Left</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="marginStep"
              :value="leftMargin"
              @change="updateLeftMargin($event.target.value)"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Right</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="marginStep"
              :value="rightMargin"
              @change="updateRightMargin($event.target.value)"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Header</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="marginStep"
              :value="headerMargin"
              @change="updateHeaderMargin($event.target.value)"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Footer</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="marginStep"
              :value="footerMargin"
              @change="updateFooterMargin($event.target.value)"
            />
          </div>
          <div class="form-group">
            <div class="subheader">Orientation</div>
            <input
              id="page-setup-dialog-landscape-false"
              type="radio"
              name="landscape"
              v-model="landscape"
              :value="false"
              :checked="!landscape"
            />
            <label for="page-setup-dialog-landscape-false">Portrait</label>
            <input
              id="page-setup-dialog-landscape-true"
              type="radio"
              name="landscape"
              v-model="landscape"
              :value="true"
              :checked="landscape"
            />
            <label for="page-setup-dialog-landscape-true">Landscape</label>
          </div>
          <div class="form-group">
            <div class="subheader">Paper Size</div>
            <select class="paper-size-select" v-model="pageSize">
              <option v-for="size in pageSizes" :key="size.name">
                {{ size.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <div class="subheader">Unit</div>
            <input
              id="page-setup-dialog-unit-in"
              type="radio"
              name="pageSizeUnit"
              v-model="form.pageSizeUnit"
              value="in"
              :checked="form.pageSizeUnit === 'in'"
            />
            <label for="page-setup-dialog-unit-in">inch</label>
            <input
              id="page-setup-dialog-unit-mm"
              type="radio"
              name="pageSizeUnit"
              v-model="form.pageSizeUnit"
              value="mm"
              :checked="form.pageSizeUnit === 'mm'"
            />
            <label for="page-setup-dialog-unit-mm">mm</label>
          </div>
          <div class="subheader">
            Spacing <span class="units">({{ marginUnitLabel }})</span>
          </div>
          <div class="form-group">
            <label class="margin-label">Neumes</label>
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
            <label class="margin-label">Lyrics V</label>
            <input
              class="margin-input"
              type="number"
              :step="spacingStep"
              :value="lyricsVerticalOffset"
              @change="updateLyricsVerticalOffset($event.target.value)"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Lyrics H</label>
            <input
              class="margin-input"
              type="number"
              :step="spacingStep"
              :value="lyricsMinimumSpacing"
              @change="updateLyricsMinimumSpacing($event.target.value)"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Line</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="spacingStep"
              :value="lineHeight"
              @change="updateLineHeight($event.target.value)"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Hyphens</label>
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="spacingStep"
              :value="hyphenSpacing"
              @change="updateHyphenSpacing($event.target.value)"
            />
          </div>
          <div class="subheader">Headers &amp; Footers</div>

          <div class="form-group">
            <input
              id="page-setup-dialog-show-header"
              type="checkbox"
              v-model="form.showHeader"
            />
            <label for="page-setup-dialog-show-header">Include Header</label>
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-show-footer"
              type="checkbox"
              v-model="form.showFooter"
            />
            <label for="page-setup-dialog-show-footer">Include Footer</label>
          </div>

          <div class="form-group">
            <input
              id="page-setup-dialog-different-first-page"
              type="checkbox"
              v-model="form.headerDifferentFirstPage"
            />
            <label for="page-setup-dialog-different-first-page"
              >Different First Page</label
            >
          </div>
          <div class="form-group">
            <input
              id="page-setup-dialog-different-odd-even"
              type="checkbox"
              v-model="form.headerDifferentOddEven"
            />
            <label for="page-setup-dialog-different-odd-even"
              >Different Odd &amp; Even</label
            >
          </div>

          <div class="form-group">
            <label>First Page No.</label>

            <InputUnit
              style="width: 3rem; margin-left: 0.5rem"
              unit="unitless"
              :step="1"
              :precision="0"
              :defaultValue="1"
              v-model="form.firstPageNumber"
            />
          </div>

          <div class="subheader">Misc.</div>

          <div class="form-group">
            <input
              id="page-setup-dialog-no-fthora-restrictions"
              type="checkbox"
              v-model="form.noFthoraRestrictions"
            />
            <label for="page-setup-dialog-no-fthora-restrictions"
              >Disable Fthora Restrictions</label
            >
          </div>
        </div>
        <div class="right-pane">
          <div class="subheader">Drop Caps</div>
          <div class="form-group row">
            <label class="drop-caps-label">Color</label>
            <ColorPicker v-model="form.dropCapDefaultColor" />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Size</label>
            <InputFontSize
              class="drop-caps-input"
              v-model="form.dropCapDefaultFontSize"
            />
          </div>

          <div class="form-group">
            <label class="drop-caps-label">Font</label>
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
            <label class="drop-caps-label">Style</label>
            <input
              id="page-setup-dialog-drop-cap-bold"
              type="checkbox"
              v-model="form.dropCapDefaultFontWeight"
              true-value="700"
              false-value="400"
            />
            <label for="page-setup-dialog-drop-cap-bold">Bold</label>

            <input
              id="page-setup-dialog-drop-cap-italic"
              type="checkbox"
              v-model="form.dropCapDefaultFontStyle"
              true-value="italic"
              false-value="normal"
            />
            <label for="page-setup-dialog-drop-cap-italic">Italic</label>
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Outline</label>

            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.dropCapDefaultStrokeWidth"
            />
          </div>
          <div class="subheader">Lyrics</div>
          <div class="form-group row">
            <label class="drop-caps-label">Color</label>
            <ColorPicker v-model="form.lyricsDefaultColor" />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Size</label>
            <InputFontSize
              class="drop-caps-input"
              v-model="form.lyricsDefaultFontSize"
            />
          </div>

          <div class="form-group">
            <label class="drop-caps-label">Font</label>
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
            <label class="drop-caps-label">Style</label>
            <input
              id="page-setup-dialog-lyrics-bold"
              type="checkbox"
              v-model="form.lyricsDefaultFontWeight"
              true-value="700"
              false-value="400"
            />
            <label for="page-setup-dialog-lyrics-bold">Bold</label>

            <input
              id="page-setup-dialog-lyrics-italic"
              type="checkbox"
              v-model="form.lyricsDefaultFontStyle"
              true-value="italic"
              false-value="normal"
            />
            <label for="page-setup-dialog-lyrics-italic">Italic</label>
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Outline</label>
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.lyricsDefaultStrokeWidth"
            />
          </div>
          <div class="subheader">Mode Key</div>
          <div class="form-group row">
            <label class="drop-caps-label">Color</label>
            <ColorPicker v-model="form.modeKeyDefaultColor" />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Size</label>
            <InputFontSize
              class="drop-caps-input"
              v-model="form.modeKeyDefaultFontSize"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Outline</label>
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.modeKeyDefaultStrokeWidth"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Height Adjust</label>

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
          <div class="subheader">Neumes</div>
          <div class="form-group row">
            <label class="drop-caps-label">Color</label>
            <ColorPicker v-model="form.neumeDefaultColor" />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Size</label>
            <InputFontSize
              class="drop-caps-input"
              v-model="form.neumeDefaultFontSize"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Outline</label>
            <InputStrokeWidth
              class="drop-caps-input"
              v-model="form.neumeDefaultStrokeWidth"
            />
          </div>
          <div class="subheader">Neume Styles</div>
          <div class="form-group row">
            <label class="neume-colors-label small-header">Type</label>
            <label class="neume-colors-input small-header">Color</label>
            <label class="small-header">Outline</label>
          </div>
          <div class="form-group row">
            <label class="neume-colors-label">Accidentals</label>
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
            <label class="neume-colors-label">Fthoras</label>
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
            <label class="neume-colors-label">Gorgons</label>
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
            <label class="neume-colors-label">Heterons</label>
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
            <label class="neume-colors-label">Ison</label>
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
            <label class="neume-colors-label">Koronis</label>
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
            <label class="neume-colors-label">Martyrias</label>
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
            <label class="neume-colors-label">Measure Bars</label>
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
            <label class="neume-colors-label">Measure No.</label>
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
            <label class="neume-colors-label">Note Indicators</label>
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
            <label class="neume-colors-label">Tempos</label>
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
        <div class="small-header">Preview</div>
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
        <button class="ok-btn" @click="updatePageSetup">Update</button>
        <button class="reset-btn neutral-btn" @click="saveAsDefault">
          Set as Default
        </button>
        <button class="reset-btn neutral-btn" @click="resetToSystemDefaults">
          Use System Default
        </button>
        <button class="cancel-btn" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-facing-decorator';
import ModalDialog from '@/components/ModalDialog.vue';
import NeumeVue from '@/components/Neume.vue';
import { PageSetup, PageSize, pageSizes } from '@/models/PageSetup';
import { PageSetup as PageSetup_v1 } from '@/models/save/v1/PageSetup';
import { Unit } from '@/utils/Unit';
import ColorPicker from '@/components/ColorPicker.vue';
import InputUnit from '@/components/InputUnit.vue';
import InputStrokeWidth from '@/components/InputStrokeWidth.vue';
import InputFontSize from '@/components/InputFontSize.vue';
import { QuantitativeNeume, Accidental } from '@/models/Neumes';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import NeumeBoxMartyria from '@/components/NeumeBoxMartyria.vue';
import NeumeBoxTempo from '@/components/NeumeBoxTempo.vue';
import { ElementType } from '@/models/Element';
import { SaveService } from '@/services/SaveService';

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
    },
  ];

  get dropCapFontFamilies() {
    return ['Athonite', 'Omega', 'PFGoudyInitials', ...this.fonts];
  }

  get lyricsFontFamilies() {
    return ['Omega', ...this.fonts];
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
      case 'mm':
        return 'mm';
      case 'in':
        return 'inches';
      default:
        console.warn(`Unknown page size unit: ${this.form.pageSizeUnit}`);
        return null;
    }
  }

  get marginStep() {
    switch (this.form.pageSizeUnit) {
      case 'mm':
        return 1;
      case 'in':
        return 0.5;
      default:
        console.warn(`Unknown page size unit: ${this.form.pageSizeUnit}`);
        return 1;
    }
  }

  get spacingStep() {
    switch (this.form.pageSizeUnit) {
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
    return this.toDisplayUnit(this.form!.topMargin).toFixed(2);
  }

  updateTopMargin(value: number) {
    this.form!.topMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form!.pageHeight - this.form!.bottomMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get bottomMargin() {
    return this.toDisplayUnit(this.form!.bottomMargin).toFixed(2);
  }

  updateBottomMargin(value: number) {
    this.form!.bottomMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form!.pageHeight - this.form!.topMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get leftMargin() {
    return this.toDisplayUnit(this.form!.leftMargin).toFixed(2);
  }

  updateLeftMargin(value: number) {
    this.form!.leftMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form!.pageWidth - this.form!.rightMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get rightMargin() {
    return this.toDisplayUnit(this.form!.rightMargin).toFixed(2);
  }

  updateRightMargin(value: number) {
    this.form!.rightMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form!.pageWidth - this.form!.leftMargin - Unit.fromInch(0.5),
    );

    this.$forceUpdate();
  }

  get headerMargin() {
    return this.toDisplayUnit(this.form!.headerMargin).toFixed(2);
  }

  updateHeaderMargin(value: number) {
    this.form!.headerMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form!.innerPageHeight,
    );

    this.$forceUpdate();
  }

  get footerMargin() {
    return this.toDisplayUnit(this.form!.footerMargin).toFixed(2);
  }

  updateFooterMargin(value: number) {
    this.form!.footerMargin = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form!.innerPageHeight,
    );

    this.$forceUpdate();
  }

  get lyricsVerticalOffset() {
    return this.toDisplayUnit(this.form!.lyricsVerticalOffset).toFixed(3);
  }

  updateLyricsVerticalOffset(value: number) {
    this.form!.lyricsVerticalOffset = Math.min(
      this.toStorageUnit(value),
      this.form!.innerPageHeight -
        this.form.lyricsDefaultFontSize -
        this.form.neumeDefaultFontSize,
    );

    this.$forceUpdate();
  }

  get lyricsMinimumSpacing() {
    return this.toDisplayUnit(this.form!.lyricsMinimumSpacing).toFixed(3);
  }

  updateLyricsMinimumSpacing(value: number) {
    this.form!.lyricsMinimumSpacing = Math.min(
      this.toStorageUnit(value),
      this.form!.innerPageWidth,
    );

    this.$forceUpdate();
  }

  get lineHeight() {
    return this.toDisplayUnit(this.form!.lineHeight).toFixed(3);
  }

  get hyphenSpacing() {
    return this.toDisplayUnit(this.form!.hyphenSpacing).toFixed(3);
  }

  updateLineHeight(value: number) {
    this.form!.lineHeight = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form!.innerPageHeight,
    );

    this.$forceUpdate();
  }

  updateHyphenSpacing(value: number) {
    this.form!.hyphenSpacing = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form!.innerPageWidth,
    );

    this.$forceUpdate();
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
  width: 4rem;
}

.margin-input {
  width: 3.5rem;
}

.left-pane {
  margin-right: 2rem;
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
</style>
