export function getFontFamilyWithFallback(
  family: string,
  fallback: string = 'Omega',
) {
  return family === fallback ? `"${family}"` : `"${family}", "${fallback}"`;
}
