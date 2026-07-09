export function getFontFamilyWithFallback(
  family: string,
  fallback: string = 'Source Serif',
) {
  return family === fallback ? `"${family}"` : `"${family}", "${fallback}"`;
}

export function getLegacyNeumeFontFamily(family: string) {
  return family === 'Neanes' || family === 'NeanesStathisSeries'
    ? family + 'Legacy'
    : family;
}

// The bundled neume fonts are registered a second time under a
// "<family>Legacy" face (see the font-face declarations in App.vue), so rich
// text falls back to it to keep legacy-encoded neume glyphs rendering inside
// styled text.
export function getFontFamilyWithNeumeFallback(
  family: string,
  neumeDefaultFontFamily: string,
) {
  return getFontFamilyWithFallback(
    family,
    getLegacyNeumeFontFamily(neumeDefaultFontFamily),
  );
}
