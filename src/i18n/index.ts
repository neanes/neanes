import el from './el';
import en from './en';
import id from './id';
import ro from './ro';

export const supportedLngs = ['el', 'en', 'id', 'ro'] as const;
export type SupportedLanguage = (typeof supportedLngs)[number];

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
