export function getFontFamilyWithFallback(
  family: string,
  fallback: string = 'Source Serif',
) {
  return family === fallback ? `"${family}"` : `"${family}", "${fallback}"`;
}
