import type { CSSProperties } from 'vue';

const uppercase = /[A-Z]/g;

/**
 * Serializes an inline style object to CSS text, omitting unset values.
 *
 * Vue rewrites every property of an object style on each patch, but skips a
 * string style that has not changed, so per-element styles in large score
 * renders are bound as text. Keys are camelCase property names; a vendor
 * prefix is written with a leading capital (`WebkitTextStrokeWidth`).
 */
export function toCssText(style: CSSProperties): string {
  let text = '';

  for (const [key, value] of Object.entries(style)) {
    if (value == null || value === '') {
      continue;
    }
    const property = key.startsWith('--')
      ? key
      : key.replace(uppercase, (letter) => `-${letter.toLowerCase()}`);
    text += `${property}:${value};`;
  }

  return text;
}
