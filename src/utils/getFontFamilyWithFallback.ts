export function getFontFamilyWithFallback(
  family: string,
  fallback: string = 'Source Serif',
) {
  return family === fallback ? `"${family}"` : `"${family}", "${fallback}"`;
}

export function getLegacyNeumeFontFamily(family: string) {
  return family + 'Legacy';
}
