import type { InitOptions, Module, Newable, NewableModule } from 'i18next';
import i18next from 'i18next';
import Pseudo from 'i18next-pseudo';

import el from './el';
import en from './en';
import id from './id';
import ro from './ro';

export const supportedLngs = ['el', 'en', 'id', 'ro'] as const;
export type SupportedLanguage = (typeof supportedLngs)[number];

const supportedLanguageNames: Record<SupportedLanguage, string> = {
  el: 'Ελληνικά',
  en: 'English',
  id: 'Bahasa Indonesia',
  ro: 'Română',
};

// Language names are shown in their native script so users can find their
// language even when the surrounding UI is in a language they don't read.
export const supportedLocales = supportedLngs.map((code) => ({
  code,
  name: supportedLanguageNames[code],
}));

const supportedLanguageSet = new Set<string>(supportedLngs);

export const defaultNS = 'model';
export const resources = {
  el,
  en,
  id,
  ro,
} as const;

function resolveSupportedLanguage(language: string | null | undefined) {
  const normalized = language?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (supportedLanguageSet.has(normalized)) {
    return normalized as SupportedLanguage;
  }

  const baseLanguage = normalized.replace('_', '-').split('-')[0];

  if (supportedLanguageSet.has(baseLanguage)) {
    return baseLanguage as SupportedLanguage;
  }

  return undefined;
}

export function resolveLanguagePreference(
  languagePreference: string | null | undefined,
  systemLanguage?: string | null,
) {
  return (
    resolveSupportedLanguage(languagePreference) ??
    resolveSupportedLanguage(systemLanguage)
  );
}

type I18nPlugin = Module | NewableModule<Module> | Newable<Module>;

type InitializeI18nOptions = {
  lng?: string;
  plugins?: I18nPlugin[];
  detection?: InitOptions['detection'];
};

function isPseudoLocalizationEnabled() {
  return (
    'VITE_PSEUDOLOCALIZATION' in import.meta.env &&
    import.meta.env['VITE_PSEUDOLOCALIZATION'] === 'true'
  );
}

export function initializeI18n({
  lng,
  plugins = [],
  detection,
}: InitializeI18nOptions = {}) {
  const pseudoLocalizationEnabled = isPseudoLocalizationEnabled();

  for (const plugin of plugins) {
    i18next.use(plugin);
  }

  return i18next
    .use(
      new Pseudo({
        enabled: pseudoLocalizationEnabled,
        languageToPseudo: 'en-US',
      }),
    )
    .init({
      debug: pseudoLocalizationEnabled,
      lng,
      detection,
      fallbackLng: 'en',
      supportedLngs,
      nonExplicitSupportedLngs: true,
      interpolation: {
        escapeValue: false,
      },
      ns: Object.keys(resources['en']),
      postProcess: ['pseudo'],
      defaultNS,
      enableSelector: 'strict',
      resources,
    });
}
