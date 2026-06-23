<template>
  <!-- eslint-disable vue/no-v-html -->
  <span
    v-if="rawMultitoneSvg"
    class="neume-icon multitone"
    :style="style"
    v-html="rawMultitoneSvg"
  />
  <span v-else class="neume-icon" :class="tone" :style="style" />
  <!-- eslint-enable vue/no-v-html -->
</template>

<script setup lang="ts">
import type { StyleValue } from 'vue';
import { computed } from 'vue';

import qualityHeteronSvg from '@/assets/icons/quality-heteron.svg?raw';
import qualityHeteronConnectingSvg from '@/assets/icons/quality-heteron-connecting.svg?raw';
import qualityHeteronConnectingLongSvg from '@/assets/icons/quality-heteron-connecting-long.svg?raw';

// The toolbar glyph icons. An <img>-loaded SVG bakes its own fill and can't be
// recolored by CSS, so each glyph is rendered as a CSS mask on this span and
// painted with a theme token (see <style>). The eager glob keeps the SVGs
// bundled and gives us stable URLs for masks.
const iconUrls = import.meta.glob('../assets/icons/*.svg', {
  query: '?url',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const urlByName: Partial<Record<string, string>> = {};
for (const [path, url] of Object.entries(iconUrls)) {
  const name = path
    .split('/')
    .pop()!
    .replace(/\.svg$/, '');
  urlByName[name] = url;
}

// Black-fill glyphs use the flipping button foreground; every other masked
// glyph uses the app's destructive red.
const FOREGROUND_ICONS = new Set([
  'letterGorthmikon',
  'letterPelastikon',
  'measure-number-2',
  'measure-number-3',
  'measure-number-4',
  'measure-number-5',
  'measure-number-6',
  'measure-number-7',
  'measure-number-8',
  'quality-antikenoma',
  'quality-omalon',
  'quality-omalon-connecting',
  'quality-psifiston',
  'quality-psifiston-slanted',
  'quality-vareia',
  'tie-yfen-below',
  'time-apli',
  'time-dipli',
  'time-klasma',
  'time-stavros',
  'time-tetrapli',
  'time-tripli',
]);

const RAW_MULTITONE_SVG_BY_NAME: Record<string, string> = {
  'quality-heteron': qualityHeteronSvg,
  'quality-heteron-connecting': qualityHeteronConnectingSvg,
  'quality-heteron-connecting-long': qualityHeteronConnectingLongSvg,
};

const props = defineProps<{
  // Icon basename, without the .svg extension (e.g. "martyria").
  name: string;
  // Optional square size override (any CSS length); defaults to the chrome button size.
  size?: string;
}>();

const tone = computed(() =>
  FOREGROUND_ICONS.has(props.name) ? 'foreground' : 'destructive',
);

const rawMultitoneSvg = computed(() => getRawMultitoneSvg(props.name));

function getIconUrl(name: string) {
  const url = urlByName[name];

  if (!url) {
    throw new Error(`Unknown neume icon "${name}".`);
  }

  return url;
}

function getRawMultitoneSvg(name: string) {
  const svg = RAW_MULTITONE_SVG_BY_NAME[name];

  if (typeof svg !== 'string') {
    return null;
  }

  return svg
    .replace(/<\?xml[^>]*>\s*/, '')
    .replace(/<!--[\s\S]*?-->\s*/, '')
    .replace('<svg ', '<svg aria-hidden="true" focusable="false" ')
    .replaceAll('fill="#f00"', 'class="neume-icon-accent"');
}

const style = computed(
  () =>
    ({
      ...(rawMultitoneSvg.value
        ? {}
        : { '--neume-icon-url': `url("${getIconUrl(props.name)}")` }),
      ...(props.size ? { height: props.size, width: props.size } : {}),
    }) as StyleValue,
);
</script>

<style scoped>
.neume-icon {
  display: inline-block;
  height: var(--chrome-button-size);
  width: var(--chrome-button-size);
  background-color: var(--neume-icon-color, var(--destructive));
  -webkit-mask: var(--neume-icon-url) center / contain no-repeat;
  mask: var(--neume-icon-url) center / contain no-repeat;
}

.neume-icon.destructive {
  --neume-icon-color: var(--destructive);
}

.neume-icon.foreground {
  --neume-icon-color: var(--chrome-button-foreground);
}

.neume-icon.multitone {
  background-color: transparent;
  color: var(--chrome-button-foreground);
  -webkit-mask: none;
  mask: none;
}

.neume-icon.multitone :deep(svg) {
  display: block;
  height: 100%;
  width: 100%;
  fill: currentColor;
}

.neume-icon.multitone :deep(.neume-icon-accent) {
  fill: var(--destructive);
}
</style>
