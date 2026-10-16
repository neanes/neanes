import type { Score } from '@/models/save/v1/Score';
import { fontCatalog } from '@/services/FontCatalog';
import { resolveFontStyle } from '@/utils/fontStyle';

function createFontLoadDescriptor(
  fontFamily: string,
  fontStyle: string | null = null,
) {
  const resolved = resolveFontStyle(fontFamily, fontStyle);
  const cssFontFamily = `"${resolved.cssFontFamily.replace(/["\\]/g, '\\$&')}"`;

  return [
    resolved.cssFontStyle,
    'normal',
    resolved.cssFontWeight,
    '1rem',
    cssFontFamily,
  ].join(' ');
}

export function getBundledFontLoadDescriptors() {
  const descriptors = new Set<string>();

  for (const family of fontCatalog.bundledFamilies()) {
    for (const style of fontCatalog.getStyles(family)) {
      descriptors.add(createFontLoadDescriptor(family, style));
    }
  }

  descriptors.add(createFontLoadDescriptor('NeanesRTL'));
  descriptors.add(createFontLoadDescriptor('NeanesRTLLegacy'));

  return [...descriptors];
}

// Load every referenced family before canvas layout can cache fallback metrics.
// Include all available faces so inherited and per-element styles are covered.
export function getScoreFontLoadDescriptors(score: Score) {
  const families = new Set<string>();
  function visit(value: unknown) {
    if (value == null || typeof value !== 'object') {
      return;
    }
    for (const [key, child] of Object.entries(value)) {
      if (/fontFamily$/i.test(key) && typeof child === 'string') {
        families.add(child);
      } else {
        visit(child);
      }
    }
  }
  visit(score);
  return [...families].flatMap((family) =>
    fontCatalog
      .getStyles(family)
      .map((style) => createFontLoadDescriptor(family, style)),
  );
}
