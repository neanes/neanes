<template>
  <div class="text-box-toolbar">
    <div class="form-group">
      <input
        id="toolbar-text-box-inline"
        type="checkbox"
        :checked="element.inline"
        @change="
          $emit('update', {
            inline: ($event.target as HTMLInputElement).checked,
          } as Partial<RichTextBoxElement>)
        "
      />
      <label for="toolbar-text-box-inline">{{
        $t('toolbar:common.inline')
      }}</label>
    </div>
    <template v-if="element.inline">
      <span class="space" />
      <div class="form-group">
        <label class="right-space">{{ $t('toolbar:common.width') }}</label>
        <InputUnit
          class="text-box-input-width"
          unit="pt"
          :nullable="true"
          :min="0.5"
          :max="maxWidth"
          :step="0.5"
          :modelValue="element.customWidth"
          :precision="1"
          placeholder="fill"
          @update:modelValue="
            $emit('update', {
              customWidth: $event,
            } as Partial<RichTextBoxElement>)
          "
        />
      </div>
      <span class="space" />
      <div class="form-group">
        <label class="right-space">{{
          $t('toolbar:textbox.offsetYTop')
        }}</label>
        <InputUnit
          class="text-box-input-width"
          unit="pt"
          :min="-maxHeight"
          :max="maxHeight"
          :step="0.5"
          :modelValue="element.offsetYTop"
          :precision="1"
          @update:modelValue="
            $emit('update', {
              offsetYTop: $event,
            } as Partial<RichTextBoxElement>)
          "
        />
      </div>
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t('toolbar:textbox.offsetYBottom')
        }}</label>
        <InputUnit
          class="text-box-input-width"
          unit="pt"
          :min="-maxHeight"
          :max="maxHeight"
          :step="0.5"
          :modelValue="element.offsetYBottom"
          :precision="1"
          @update:modelValue="
            $emit('update', {
              offsetYBottom: $event,
            } as Partial<RichTextBoxElement>)
          "
        />
      </div>
      <span class="space" />
      <div class="form-group">
        <input
          id="toolbar-text-box-center-on-page"
          type="checkbox"
          :checked="element.centerOnPage"
          @change="
            $emit('update', {
              centerOnPage: ($event.target as HTMLInputElement).checked,
            } as Partial<RichTextBoxElement>)
          "
        />
        <label for="toolbar-text-box-center-on-page">{{
          $t('toolbar:textbox.centerOnPage')
        }}</label>
      </div>
    </template>
    <span class="divider" />
    <div class="form-group">
      <label class="right-space">{{ $t('toolbar:common.marginTop') }}</label>
      <InputUnit
        class="text-box-input-width"
        unit="pt"
        :min="0"
        :max="maxHeight"
        :step="0.5"
        :modelValue="element.marginTop"
        :precision="1"
        @update:modelValue="
          $emit('update', { marginTop: $event } as Partial<RichTextBoxElement>)
        "
      />
    </div>
    <span class="space"></span>
    <div class="form-group">
      <label class="right-space">{{ $t('toolbar:common.marginBottom') }}</label>
      <InputUnit
        class="text-box-input-width"
        unit="pt"
        :min="0"
        :max="maxHeight"
        :step="0.5"
        :modelValue="element.marginBottom"
        :precision="1"
        @update:modelValue="
          $emit('update', {
            marginBottom: $event,
          } as Partial<RichTextBoxElement>)
        "
      />
    </div>
    <span class="divider"></span>
    <div class="form-group">
      <input
        id="toolbar-text-box-mode-change"
        type="checkbox"
        :checked="element.modeChange"
        @change="
          $emit('update', {
            modeChange: ($event.target as HTMLInputElement).checked,
          } as Partial<RichTextBoxElement>)
        "
      />
      <label for="toolbar-text-box-mode-change">{{
        $t('toolbar:textbox.modeChange')
      }}</label>
    </div>
    <template v-if="element.modeChange">
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{ $t('toolbar:martyria.note') }}</label>
        <select
          :value="element.modeChangePhysicalNote"
          @change="
            $emit('update', {
              modeChangePhysicalNote: ($event.target as HTMLInputElement).value,
            } as Partial<RichTextBoxElement>)
          "
        >
          <option v-for="note in notes" :key="note.key" :value="note.key">
            {{ $t(note.displayName) }}
          </option>
        </select>
      </div>
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{ $t('toolbar:martyria.scale') }}</label>
        <select
          :value="element.modeChangeScale"
          @change="
            $emit('update', {
              modeChangeScale: ($event.target as HTMLInputElement).value,
            } as Partial<RichTextBoxElement>)
          "
        >
          <option v-for="scale in scales" :key="scale.key" :value="scale.key">
            {{ $t(scale.displayName) }}
          </option>
        </select>
      </div>
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{
          $t('toolbar:textbox.virtualNote')
        }}</label>
        <select
          :value="element.modeChangeVirtualNote"
          @change="
            $emit('update', {
              modeChangeVirtualNote: ($event.target as HTMLInputElement).value,
            } as Partial<RichTextBoxElement>)
          "
        >
          <option value="">{{ $t('toolbar:common.none') }}</option>
          <option v-for="note in notes" :key="note.key" :value="note.key">
            {{ $t(note.displayName) }}
          </option>
        </select>
      </div>
      <span class="space"></span>
      <div class="form-group">
        <label class="right-space">{{ $t('toolbar:common.bpm') }}</label>
        <InputBpm
          :modelValue="element.modeChangeBpm"
          @update:modelValue="
            $emit('update', {
              modeChangeBpm: $event,
            } as Partial<RichTextBoxElement>)
          "
        />
      </div>
      <span class="space"></span>
      <div class="form-group">
        <input
          id="toolbar-rich-text-box-ignore-attractions"
          type="checkbox"
          :checked="element.modeChangeIgnoreAttractions"
          @change="
            $emit('update', {
              modeChangeIgnoreAttractions: ($event.target as HTMLInputElement)
                .checked,
            } as Partial<RichTextBoxElement>)
          "
        />
        <label for="toolbar-rich-text-box-ignore-attractions">{{
          $t('toolbar:common.ignoreAttractions')
        }}</label>
      </div>
      <span class="space"></span>
      <div class="form-group">
        <input
          id="toolbar-rich-text-box-permanent-enharmonic-zo"
          type="checkbox"
          :checked="element.modeChangePermanentEnharmonicZo"
          @change="
            $emit('update', {
              modeChangePermanentEnharmonicZo: (
                $event.target as HTMLInputElement
              ).checked,
            } as Partial<RichTextBoxElement>)
          "
        />
        <label for="toolbar-rich-text-box-permanent-enharmonic-zo">{{
          $t('toolbar:modeKey.permanentEnharmonicZo')
        }}</label>
      </div>
    </template>
    <span class="divider"></span>
    <div class="form-group">
      <input
        id="toolbar-text-box-rtl"
        type="checkbox"
        :checked="element.rtl"
        @change="
          $emit('update', {
            rtl: ($event.target as HTMLInputElement).checked,
          } as Partial<RichTextBoxElement>)
        "
      />
      <label for="toolbar-text-box-rtl">{{ $t('toolbar:textbox.rtl') }}</label>
    </div>
    <span class="divider"></span>
    <div class="form-group">
      <input
        id="toolbar-text-box-scrollable"
        type="checkbox"
        :checked="element.scrollable"
        @change="
          $emit('update', {
            scrollable: ($event.target as HTMLInputElement).checked,
          } as Partial<RichTextBoxElement>)
        "
      />
      <label for="toolbar-text-box-scrollable">{{
        $t('toolbar:textbox.scrollable')
      }}</label>
    </div>
    <span class="divider"></span>
    <div class="form-group">
      <label class="right-space">{{ $t('toolbar:common.sectionName') }}</label>
      <input
        type="text"
        :value="element.sectionName"
        @change="
          $emit('update:sectionName', ($event.target as HTMLInputElement).value)
        "
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import InputBpm from '@/components/InputBpm.vue';
import InputUnit from '@/components/InputUnit.vue';
import { RichTextBoxElement } from '@/models/Element';
import { PageSetup } from '@/models/PageSetup';
import { Scale, ScaleNote } from '@/models/Scales';
import { Unit } from '@/utils/Unit';

const notes = Object.values(ScaleNote).map((x) => ({
  key: x,
  displayName: getNoteDisplayName(x),
}));

const scales = Object.values(Scale).map((x) => ({
  key: x,
  displayName: getScaleDisplayName(x),
}));

function getNoteDisplayName(note: ScaleNote) {
  switch (note) {
    case ScaleNote.ZoLow:
      return 'model:note.zoLow';
    case ScaleNote.NiLow:
      return 'model:note.niLow';
    case ScaleNote.PaLow:
      return 'model:note.paLow';
    case ScaleNote.VouLow:
      return 'model:note.vouLow';
    case ScaleNote.GaLow:
      return 'model:note.gaLow';
    case ScaleNote.ThiLow:
      return 'model:note.diLow';
    case ScaleNote.KeLow:
      return 'model:note.keLow';
    case ScaleNote.Zo:
      return 'model:note.zo';
    case ScaleNote.Ni:
      return 'model:note.ni';
    case ScaleNote.Pa:
      return 'model:note.pa';
    case ScaleNote.Vou:
      return 'model:note.vou';
    case ScaleNote.Ga:
      return 'model:note.ga';
    case ScaleNote.Thi:
      return 'model:note.di';
    case ScaleNote.Ke:
      return 'model:note.ke';
    case ScaleNote.ZoHigh:
      return 'model:note.zoHigh';
    case ScaleNote.NiHigh:
      return 'model:note.niHigh';
    case ScaleNote.PaHigh:
      return 'model:note.paHigh';
    case ScaleNote.VouHigh:
      return 'model:note.vouHigh';
    case ScaleNote.GaHigh:
      return 'model:note.gaHigh';
    case ScaleNote.ThiHigh:
      return 'model:note.diHigh';
    case ScaleNote.KeHigh:
      return 'model:note.keHigh';
    default:
      return note;
  }
}

function getScaleDisplayName(scale: Scale) {
  switch (scale) {
    case Scale.Diatonic:
      return 'model:scale.diatonic';
    case Scale.SoftChromatic:
      return 'model:scale.softChromatic';
    case Scale.HardChromatic:
      return 'model:scale.hardChromatic';
    case Scale.EnharmonicGa:
      return 'model:scale.enharmonicGa';
    case Scale.EnharmonicZoHigh:
      return 'model:scale.enharmonicZoHigh';
    case Scale.EnharmonicVou:
      return 'model:scale.enharmonicVou';
    case Scale.EnharmonicZo:
      return 'model:scale.enharmonicZo';
    case Scale.EnharmonicVouHigh:
      return 'model:scale.enharmonicVouHigh';
    case Scale.Zygos:
      return 'model:scale.zygos';
    case Scale.Spathi:
      return 'model:scale.spathi';
    case Scale.SpathiGa:
      return 'model:scale.spathiGa';
    case Scale.Kliton:
      return 'model:scale.kliton';
    default:
      return scale;
  }
}

export default defineComponent({
  components: { InputBpm, InputUnit },
  emits: ['update', 'update:sectionName'],
  props: {
    element: {
      type: Object as PropType<RichTextBoxElement>,
      required: true,
    },
    pageSetup: {
      type: Object as PropType<PageSetup>,
      required: true,
    },
  },

  data() {
    return {
      notes,
      scales,
    };
  },

  computed: {
    maxWidth() {
      return Unit.toPt(this.pageSetup.innerPageWidth);
    },

    maxHeight() {
      return Unit.toPt(this.pageSetup.innerPageHeight);
    },
  },

  methods: {},
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.text-box-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  background-color: lightgray;

  padding: 0.25rem;
}

.icon-btn {
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn.selected {
  background-color: var(--btn-color-selected);
}

label.right-space {
  margin-right: 0.5rem;
}

.divider {
  height: 32px;
  border-right: 1px solid #666;
  margin: 0 0.5rem;
}

.space {
  width: 16px;
}

.text-box-input-width {
  width: 8ch;
}
</style>
