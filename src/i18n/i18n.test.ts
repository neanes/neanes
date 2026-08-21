import { describe, expect, it } from 'vitest';

import { resources, supportedLngs } from './index';

type ResourceTree = { [key: string]: string | ResourceTree };

/**
 * Collects the dotted path of every leaf (translatable string) in a resource
 * tree. Objects are descended into; everything else is treated as a leaf so a
 * key that is an object in one locale and a string in another is still flagged.
 */
function flattenKeys(tree: ResourceTree, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, path));
    } else {
      keys.push(path);
    }
  }

  return keys;
}

// English is the source catalog; every other locale is checked against it.
const referenceLng = 'en';

const catalogs = resources as unknown as Record<
  string,
  Record<string, ResourceTree>
>;

const namespaces = Object.keys(catalogs[referenceLng]);
const otherLngs = supportedLngs.filter((lng) => lng !== referenceLng);

describe('i18n catalog parity', () => {
  it('exposes English as a supported language to use as the reference', () => {
    expect(supportedLngs).toContain(referenceLng);
    expect(namespaces.length).toBeGreaterThan(0);
  });

  describe.each(otherLngs)('locale "%s"', (lng) => {
    it.each(namespaces)(
      'has exactly the English keys in the "%s" namespace',
      (namespace) => {
        const referenceKeys = flattenKeys(catalogs[referenceLng][namespace]);
        const referenceKeySet = new Set(referenceKeys);
        const localeKeySet = new Set(flattenKeys(catalogs[lng][namespace]));

        const missing = referenceKeys.filter((key) => !localeKeySet.has(key));
        const extra = [...localeKeySet].filter(
          (key) => !referenceKeySet.has(key),
        );

        expect(
          { missing, extra },
          `Locale "${lng}" namespace "${namespace}" is out of sync with English.\n` +
            `  Missing keys (present in English, absent here): ${
              missing.join(', ') || '(none)'
            }\n` +
            `  Extra keys (absent in English, present here): ${
              extra.join(', ') || '(none)'
            }`,
        ).toEqual({ missing: [], extra: [] });
      },
    );
  });
});
