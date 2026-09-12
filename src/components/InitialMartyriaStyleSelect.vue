<template>
  <Select :model-value="selectValue" @update:model-value="onUpdate">
    <SelectTrigger :id="id" :class="cn('bg-background', triggerClass)">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem :value="DOCUMENT_DEFAULT_VALUE">
        {{
          $t(($) => $.dialog.initialMartyriaStyles.documentDefault, {
            ns: 'dialog',
          })
        }}
      </SelectItem>
      <SelectGroup v-for="group in styleGroups" :key="group.key">
        <SelectLabel>{{ group.label }}</SelectLabel>
        <SelectItem
          v-for="style in group.styles"
          :key="style.id"
          :value="style.id"
        >
          {{ getInitialMartyriaStyleDisplayName(style, t) }}
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang="ts">
import { useTranslation } from 'i18next-vue';
import type { AcceptableValue } from 'reka-ui';
import type { PropType } from 'vue';
import { computed } from 'vue';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  builtInInitialMartyriaStyles,
  getInitialMartyriaStyleDisplayName,
} from '@/models/InitialMartyriaBuiltInStyles';
import {
  initialMartyriaLanguageIds,
  type InitialMartyriaStyle,
} from '@/models/InitialMartyriaStyle';
import { getInitialMartyriaLanguageName } from '@/utils/initialMartyriaLabels';

const props = defineProps({
  id: {
    type: String,
    default: undefined,
  },
  /** The element's own style; null follows the score's style. */
  modelValue: {
    type: String as PropType<string | null>,
    default: null,
  },
  /** The score's own styles; built-in styles are always available. */
  initialMartyriaStyles: {
    type: Array as PropType<InitialMartyriaStyle[]>,
    required: true,
  },
  triggerClass: {
    type: String,
    default: 'w-full',
  },
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const { t } = useTranslation();

const DOCUMENT_DEFAULT_VALUE = '__document-default__';

const selectValue = computed(() => props.modelValue ?? DOCUMENT_DEFAULT_VALUE);

// Grouped as the styles dialog lists them: the score's own styles, then the
// built-in styles of each language.
const styleGroups = computed(() => {
  const groups: {
    key: string;
    label: string;
    styles: InitialMartyriaStyle[];
  }[] = [];
  if (props.initialMartyriaStyles.length > 0) {
    groups.push({
      key: 'custom',
      label: t(($) => $.dialog.initialMartyriaStyles.custom, { ns: 'dialog' }),
      styles: props.initialMartyriaStyles,
    });
  }
  for (const languageId of initialMartyriaLanguageIds) {
    groups.push({
      key: languageId,
      label: t(($) => $.dialog.initialMartyriaStyles.builtInLanguage, {
        ns: 'dialog',
        language: getInitialMartyriaLanguageName(t, languageId),
      }),
      styles: builtInInitialMartyriaStyles.filter(
        (style) => style.structure.languageId === languageId,
      ),
    });
  }
  return groups;
});

function onUpdate(value: AcceptableValue) {
  if (typeof value === 'string') {
    emit('update:modelValue', value === DOCUMENT_DEFAULT_VALUE ? null : value);
  }
}
</script>
