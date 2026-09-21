export function getFontFamilyWithFallback(
  family: string,
  fallback: string = 'Source Serif',
) {
  return family === fallback ? `"${family}"` : `"${family}", "${fallback}"`;
}

// Bundled neume fonts are also registered under a <family>Legacy name in
// App.vue; neume widgets use that name.
export function getLegacyNeumeFontFamily(family: string) {
  return family + 'Legacy';
}
