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
            <input
              class="margin-input"
              type="number"
              min="0"
              :step="spacingStep"
              :value="neumeSpacing"
              @change="updateNeumeSpacing($event.target.value)"
            />
          </div>
          <div class="form-group">
            <label class="margin-label">Lyrics</label>
            <input
              class="margin-input"
              type="number"
              :step="spacingStep"
              :value="lyricsVerticalOffset"
              @change="updateLyricsVerticalOffset($event.target.value)"
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
        </div>
        <div class="right-pane">
          <div class="subheader">Drop Caps</div>
          <div class="form-group">
            <label class="drop-caps-label">Color</label>
            <input
              class="drop-caps-input"
              type="color"
              list="presetDropCapsColors"
              v-model.lazy="form.dropCapDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Size</label>
            <input
              class="drop-caps-input"
              type="number"
              min="4"
              max="100"
              step="1"
              v-model.lazy="dropCapDefaultFontSize"
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
          <div class="subheader">Lyrics</div>
          <div class="form-group">
            <label class="drop-caps-label">Color</label>
            <input
              class="drop-caps-input"
              type="color"
              list="presetLyricsColors"
              v-model.lazy="form.lyricsDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Size</label>
            <input
              class="drop-caps-input"
              type="number"
              min="4"
              max="100"
              step="1"
              v-model.lazy="lyricsDefaultFontSize"
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
          <div class="subheader">Neumes</div>
          <div class="form-group">
            <label class="drop-caps-label">Color</label>
            <input
              class="drop-caps-input"
              type="color"
              list="presetLyricsColors"
              v-model.lazy="form.neumeDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="drop-caps-label">Size</label>
            <input
              class="drop-caps-input"
              type="number"
              min="4"
              max="100"
              step="1"
              v-model.lazy="neumeDefaultFontSize"
            />
          </div>
          <div class="subheader">Neume Colors</div>
          <div class="form-group">
            <label class="neume-colors-label">Accidentals</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.accidentalDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Fthoras</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.fthoraDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Gorgons</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.gorgonDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Heterons</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.heteronDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Ison</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.isonDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Martyrias</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.martyriaDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Measure Bars</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.measureBarDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Measure No.</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.measureNumberDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Note Indicators</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.noteIndicatorDefaultColor"
            />
          </div>
          <div class="form-group">
            <label class="neume-colors-label">Tempos</label>
            <input
              class="neume-colors-input"
              type="color"
              list="presetNeumeColors"
              v-model.lazy="form.tempoDefaultColor"
            />
          </div>
        </div>
      </div>
      <div class="button-container">
        <button class="ok-btn" @click="updatePageSetup">Update</button>
        <button class="reset-btn neutral-btn" @click="resetToDefaults">
          Reset to Defaults
        </button>
        <button class="cancel-btn" @click="$emit('close')">Cancel</button>
      </div>
      <datalist id="presetDropCapsColors">
        <option>#000000</option>
        <option>#ED0000</option>
        <option>#0000FF</option>
      </datalist>
      <datalist id="presetNeumeColors">
        <option>#000000</option>
        <option>#ED0000</option>
      </datalist>
      <datalist id="presetLyricsColors">
        <option>#000000</option>
      </datalist>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import ModalDialog from '@/components/ModalDialog.vue';
import { PageSetup, PageSize, pageSizes } from '@/models/PageSetup';
import { Unit } from '@/utils/Unit';

@Component({
  components: { ModalDialog },
})
export default class PageSetupDialog extends Vue {
  @Prop() pageSetup!: PageSetup;
  private form: PageSetup = new PageSetup();
  private dropCapFontFamilies: string[] = [
    'Athonite',
    'Omega',
    'PFGoudyInitials',
  ];
  private lyricsFontFamilies: string[] = ['Omega'];

  created() {
    Object.assign(this.form, this.pageSetup);

    window.addEventListener('keydown', this.onKeyDown);
  }

  beforeDestroy() {
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

  get neumeSpacing() {
    return this.toDisplayUnit(this.form!.neumeDefaultSpacing).toFixed(3);
  }

  updateNeumeSpacing(value: number) {
    this.form!.neumeDefaultSpacing = Math.min(
      Math.max(this.toStorageUnit(value), 0),
      this.form!.pageWidth,
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

  private get dropCapDefaultFontSize() {
    return Unit.toPt(this.form!.dropCapDefaultFontSize);
  }

  private set dropCapDefaultFontSize(value: number) {
    // Round to nearest 0.5
    const valueRounded = Math.round(value * 2) / 2;

    this.form!.dropCapDefaultFontSize = Math.min(
      Math.max(Unit.fromPt(valueRounded), Unit.fromPt(4)),
      Unit.fromPt(100),
    );

    this.$forceUpdate();
  }

  private get lyricsDefaultFontSize() {
    return Unit.toPt(this.form!.lyricsDefaultFontSize);
  }

  private set lyricsDefaultFontSize(value: number) {
    // Round to nearest 0.5
    const valueRounded = Math.round(value * 2) / 2;

    this.form!.lyricsDefaultFontSize = Math.min(
      Math.max(Unit.fromPt(valueRounded), Unit.fromPt(4)),
      Unit.fromPt(100),
    );

    this.$forceUpdate();
  }

  private get neumeDefaultFontSize() {
    return Unit.toPt(this.form!.neumeDefaultFontSize);
  }

  private set neumeDefaultFontSize(value: number) {
    // Round to nearest 0.5
    const valueRounded = Math.round(value * 2) / 2;

    this.form!.neumeDefaultFontSize = Math.min(
      Math.max(Unit.fromPt(valueRounded), Unit.fromPt(4)),
      Unit.fromPt(100),
    );

    this.$forceUpdate();
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

  resetToDefaults() {
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
  font-family: Arial, Helvetica, sans-serif;
  display: flex;
  flex-direction: column;
  height: 80vh;
}

.pane-container {
  display: flex;
  width: 500px;
  margin-bottom: 1.5rem;
  overflow: auto;
}

.left-pane {
  flex: 1;
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

.units {
  font-weight: normal;
  color: gray;
}

.form-group {
  margin: 0.5rem 0;
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
  width: 4rem;
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
