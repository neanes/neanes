<template>
  <ModalDialog>
    <div class="container">
      <div class="header">Neume Positioning</div>
      <div class="pane-container" :style="paneContainerStyle">
        <div class="top-pane" :style="topPaneStyle">
          <template v-if="hasPreviousElement">
            <NeumeBoxSyllable
              v-if="previousElement.elementType === ElementType.Note"
              class="other-neume"
              :note="previousElement"
              :pageSetup="pageSetup"
              :style="previousElementStyle"
            />

            <NeumeBoxMartyria
              v-if="previousElement.elementType === ElementType.Martyria"
              class="other-neume"
              :neume="previousElement"
              :pageSetup="pageSetup"
              :style="previousElementStyle"
            />

            <NeumeBoxTempo
              v-if="previousElement.elementType === ElementType.Tempo"
              class="other-neume"
              :neume="previousElement"
              :pageSetup="pageSetup"
              :style="previousElementStyle"
            />
          </template>

          <div class="neume-container" :style="mainStyle">
            <NeumeBoxSyllable :note="form" :pageSetup="pageSetup" />
            <DragHandle
              v-if="hasAccidental"
              :note="form"
              :mark="form.accidental"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.accidentalOffsetX"
              :y="form.accidentalOffsetY"
              @update="updateAccidentalOffset($event)"
            />
            <!-- <DragHandle
              v-if="hasMeasureBarLeft"
              :note="form"
              :mark="form.measureBarLeft"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.measureBarLeftOffsetX"
              :y="form.measureBarLeftOffsetY"
              @update="updateMeasureBarLeftOffset($event)"
            />
            <DragHandle
              v-if="hasMeasureBarRight"
              :note="form"
              :mark="form.measureBarRight"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.measureBarRightOffsetX"
              :y="form.measureBarRightOffsetY"
              @update="updateMeasureBarRightOffset($event)"
            /> -->
            <DragHandle
              v-if="hasFthora"
              :note="form"
              :mark="form.fthora"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.fthoraOffsetX"
              :y="form.fthoraOffsetY"
              @update="updateFthoraOffset($event)"
            />
            <DragHandle
              v-if="hasGorgonNeume"
              :note="form"
              :mark="form.gorgonNeume"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.gorgonNeumeOffsetX"
              :y="form.gorgonNeumeOffsetY"
              @update="updateGorgonOffset($event)"
            />
            <DragHandle
              v-if="hasSecondaryGorgonNeume"
              :note="form"
              :mark="form.secondaryGorgonNeume"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.secondaryGorgonNeumeOffsetX"
              :y="form.secondaryGorgonNeumeOffsetY"
              @update="updateGorgon2Offset($event)"
            />
            <DragHandle
              v-if="hasIson"
              :note="form"
              :mark="form.ison"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.isonOffsetX"
              :y="form.isonOffsetY"
              @update="updateIsonOffset($event)"
            />
            <DragHandle
              v-if="form.koronis"
              :note="form"
              :mark="TimeNeume.Koronis"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.koronisOffsetX"
              :y="form.koronisOffsetY"
              @update="updateKoronisOffset($event)"
            />
            <DragHandle
              v-if="hasMeasureNumber"
              :note="form"
              :mark="form.measureNumber"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.measureNumberOffsetX"
              :y="form.measureNumberOffsetY"
              @update="updateMeasureNumberOffset($event)"
            />
            <DragHandle
              v-if="form.noteIndicator"
              :note="form"
              :mark="form.noteIndicatorNeume"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.noteIndicatorOffsetX"
              :y="form.noteIndicatorOffsetY"
              @update="updateNoteIndicatorOffset($event)"
            />
            <DragHandle
              v-if="hasTie"
              :note="form"
              :mark="form.tie"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.tieOffsetX"
              :y="form.tieOffsetY"
              @update="updateTieOffset($event)"
            />
            <DragHandle
              v-if="hasTimeNeume"
              :note="form"
              :mark="form.timeNeume"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.timeNeumeOffsetX"
              :y="form.timeNeumeOffsetY"
              @update="updateTimeOffset($event)"
            />
            <!-- <DragHandle
              v-if="form.vareia"
              :note="form"
              :mark="VocalExpressionNeume.Vareia"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.vareiaOffsetX"
              :y="form.vareiaOffsetY"
              @update="updateVareiaOffset($event)"
            /> -->
            <DragHandle
              v-if="hasVocalExpressionNeume"
              :note="form"
              :mark="form.vocalExpressionNeume"
              :fontSize="pageSetup.neumeDefaultFontSize"
              :zoom="zoom"
              :x="form.vocalExpressionNeumeOffsetX"
              :y="form.vocalExpressionNeumeOffsetY"
              @update="updateQualityOffset($event)"
            />
          </div>
          <template v-if="hasNextElement">
            <NeumeBoxSyllable
              v-if="nextElement.elementType === ElementType.Note"
              class="other-neume"
              :note="nextElement"
              :pageSetup="pageSetup"
              :style="nextElementStyle"
            />

            <NeumeBoxMartyria
              v-if="nextElement.elementType === ElementType.Martyria"
              class="other-neume"
              :neume="nextElement"
              :pageSetup="pageSetup"
              :style="nextElementStyle"
            />

            <NeumeBoxTempo
              v-if="nextElement.elementType === ElementType.Tempo"
              class="other-neume"
              :neume="nextElement"
              :pageSetup="pageSetup"
              :style="nextElementStyle"
            />
          </template>
        </div>
        <div class="bottom-pane">
          <div class="form-group">
            <label />
            <span class="table-header">Left</span>
            <span class="table-header">Top</span>
          </div>
          <div class="form-group">
            <label>Accidental</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.accidentalOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.accidentalOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Bar Line L</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureBarLeftOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureBarLeftOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Bar Line R</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureBarRightOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureBarRightOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Fthora</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.fthoraOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.fthoraOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Gorgon</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.gorgonNeumeOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.gorgonNeumeOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Gorgon 2</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.secondaryGorgonNeumeOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.secondaryGorgonNeumeOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Ison</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.isonOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.isonOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Koronis</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.koronisOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.koronisOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Measure No.</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureNumberOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.measureNumberOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Note</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.noteIndicatorOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.noteIndicatorOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Tie</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.tieOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.tieOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Time</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.timeNeumeOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.timeNeumeOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Vareia</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.vareiaOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.vareiaOffsetY"
            />
          </div>
          <div class="form-group">
            <label>Quality</label>
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.vocalExpressionNeumeOffsetX"
            />
            <InputUnit
              :unit="unit"
              :min="min"
              :max="max"
              :step="stepSize"
              :precision="precision"
              v-model="form.vocalExpressionNeumeOffsetY"
            />
          </div>
        </div>
      </div>
      <div class="button-container">
        <button class="ok-btn" @click="update">Update</button>
        <button class="cancel-btn" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </ModalDialog>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ElementType, NoteElement, ScoreElementOffset } from '@/models/Element';
import ModalDialog from '@/components/ModalDialog.vue';
import NeumeBoxSyllable from '@/components/NeumeBoxSyllable.vue';
import NeumeBoxMartyria from '@/components/NeumeBoxMartyria.vue';
import NeumeBoxTempo from '@/components/NeumeBoxTempo.vue';
import InputUnit from '@/components/InputUnit.vue';
import DragHandle from '@/components/DragHandle.vue';
import { PageSetup } from '@/models/PageSetup';
import { VocalExpressionNeume } from '@/models/Neumes';
import { TimeNeume } from '@/models/save/v1/Neumes';

@Component({
  components: {
    ModalDialog,
    NeumeBoxSyllable,
    NeumeBoxMartyria,
    NeumeBoxTempo,
    InputUnit,
    DragHandle,
  },
})
export default class SyllablePositioningDialog extends Vue {
  @Prop() element!: NoteElement;
  @Prop() previousElement!: NoteElement;
  @Prop() nextElement!: NoteElement;
  @Prop() pageSetup!: PageSetup;

  TimeNeume = TimeNeume;
  VocalExpressionNeume = VocalExpressionNeume;
  ElementType = ElementType;

  form: NoteElement = new NoteElement();
  stepSize: number = 0.01;
  min: number = -10;
  max: number = 10;
  precision: number = 2;
  unit: string = 'unitless';

  paneContainerWidthPx = 420;

  zoom = 2;

  get hasNextElement() {
    return (
      this.nextElement?.elementType === ElementType.Note ||
      this.nextElement?.elementType === ElementType.Martyria ||
      this.nextElement?.elementType === ElementType.Tempo
    );
  }

  get hasPreviousElement() {
    return (
      this.previousElement?.elementType === ElementType.Note ||
      this.previousElement?.elementType === ElementType.Martyria ||
      this.previousElement?.elementType === ElementType.Tempo
    );
  }

  get hasVocalExpressionNeume() {
    return this.form.vocalExpressionNeume != null;
  }

  get hasTimeNeume() {
    return this.form.timeNeume != null;
  }

  get hasGorgonNeume() {
    return this.form.gorgonNeume != null;
  }

  get hasSecondaryGorgonNeume() {
    return this.form.secondaryGorgonNeume != null;
  }

  get hasFthora() {
    return this.form.fthora != null;
  }

  get hasAccidental() {
    return this.form.accidental != null;
  }

  get hasMeasureBarLeft() {
    return this.form.measureBarLeft != null;
  }

  get hasMeasureBarRight() {
    return this.form.measureBarRight != null;
  }

  get hasMeasureNumber() {
    return this.form.measureNumber != null;
  }

  get hasIson() {
    return this.form.ison != null;
  }

  get hasTie() {
    return this.form.tie != null;
  }

  get centerLeft() {
    return this.paneContainerWidthPx / 2;
  }

  get previousElementStyle() {
    return {
      left: `calc(${this.centerLeft}px - ${
        this.element.x - this.previousElement.x
      }px * var(--zoom, 1))`,
    } as CSSStyleDeclaration;
  }

  get nextElementStyle() {
    return {
      left: `calc(${this.centerLeft}px + ${
        this.nextElement.x - this.element.x
      }px * var(--zoom, 1))`,
    } as CSSStyleDeclaration;
  }

  get mainStyle() {
    return {
      left: this.centerLeft + 'px',
    } as CSSStyleDeclaration;
  }

  get topPaneStyle() {
    return {
      height: this.pageSetup.lineHeight * this.zoom + 'px',
    } as CSSStyleDeclaration;
  }

  get paneContainerStyle() {
    return {
      width: this.paneContainerWidthPx + 'px',
    } as CSSStyleDeclaration;
  }

  created() {
    Object.assign(this.form, this.element);

    window.addEventListener('keydown', this.onKeyDown);
  }

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeyDown);
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      this.$emit('close');
    }
  }

  update() {
    this.$emit('update', this.form);
    this.$emit('close');
  }

  updateAccidentalOffset(args: ScoreElementOffset) {
    this.form.accidentalOffsetX = args.x;
    this.form.accidentalOffsetY = args.y;
  }

  updateMeasureBarLeftOffset(args: ScoreElementOffset) {
    this.form.measureBarLeftOffsetX = args.x;
    this.form.measureBarLeftOffsetY = args.y;
  }

  updateMeasureBarRightOffset(args: ScoreElementOffset) {
    this.form.measureBarRightOffsetX = args.x;
    this.form.measureBarRightOffsetY = args.y;
  }

  updateFthoraOffset(args: ScoreElementOffset) {
    this.form.fthoraOffsetX = args.x;
    this.form.fthoraOffsetY = args.y;
  }

  updateGorgonOffset(args: ScoreElementOffset) {
    this.form.gorgonNeumeOffsetX = args.x;
    this.form.gorgonNeumeOffsetY = args.y;
  }

  updateGorgon2Offset(args: ScoreElementOffset) {
    this.form.secondaryGorgonNeumeOffsetX = args.x;
    this.form.secondaryGorgonNeumeOffsetY = args.y;
  }

  updateIsonOffset(args: ScoreElementOffset) {
    this.form.isonOffsetX = args.x;
    this.form.isonOffsetY = args.y;
  }

  updateKoronisOffset(args: ScoreElementOffset) {
    this.form.koronisOffsetX = args.x;
    this.form.koronisOffsetY = args.y;
  }

  updateMeasureNumberOffset(args: ScoreElementOffset) {
    this.form.measureNumberOffsetX = args.x;
    this.form.measureNumberOffsetY = args.y;
  }

  updateNoteIndicatorOffset(args: ScoreElementOffset) {
    this.form.noteIndicatorOffsetX = args.x;
    this.form.noteIndicatorOffsetY = args.y;
  }

  updateTieOffset(args: ScoreElementOffset) {
    this.form.tieOffsetX = args.x;
    this.form.tieOffsetY = args.y;
  }

  updateTimeOffset(args: ScoreElementOffset) {
    this.form.timeNeumeOffsetX = args.x;
    this.form.timeNeumeOffsetY = args.y;
  }

  updateVareiaOffset(args: ScoreElementOffset) {
    this.form.vareiaOffsetX = args.x;
    this.form.vareiaOffsetY = args.y;
  }

  updateQualityOffset(args: ScoreElementOffset) {
    this.form.vocalExpressionNeumeOffsetX = args.x;
    this.form.vocalExpressionNeumeOffsetY = args.y;
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

.pane-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
  overflow: auto;
  flex: 1;
}

.form-group label {
  display: inline-block;
  width: 6.75rem;
}

.form-group input {
  width: 3rem;
}

.form-group .table-header {
  display: inline-block;
  width: 3.5rem;
}

.top-pane {
  display: flex;
  align-items: center;
  justify-content: center;
}

.bottom-pane {
  overflow: auto;
  flex: 1;
}

.header {
  font-size: 1.5rem;
  text-align: center;
}

.button-container {
  display: flex;
  justify-content: center;
}

.ok-btn {
  margin-right: 2rem;
}

.neume-container {
  position: absolute;
}

.other-neume {
  position: absolute;
  opacity: 0.5;
}

.neume {
  --zoom: 2;
}

.handle {
  --zoom: 2;
}
</style>
