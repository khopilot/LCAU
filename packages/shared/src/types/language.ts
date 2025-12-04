export type SupportedLanguage = 'fr' | 'km' | 'en';

export interface LanguageConfig {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
  },
  km: {
    code: 'km',
    name: 'Khmer',
    nativeName: 'ភាសាខ្មែរ',
    direction: 'ltr',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
  },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'fr';
