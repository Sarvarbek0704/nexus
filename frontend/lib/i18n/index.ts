'use client';

import { createContext, useContext, useState, useEffect, ReactNode, createElement } from 'react';
import { en } from './translations/en';
import { uz } from './translations/uz';
import { ru } from './translations/ru';

export type Language = 'en' | 'uz' | 'ru';

// Use en as the canonical shape; uz and ru are cast to the same type
export type Translations = typeof en;

const translations: Record<Language, Translations> = {
  en,
  uz: uz as unknown as Translations,
  ru: ru as unknown as Translations,
};

export const LANGUAGE_LABELS: Record<Language, { label: string; flag: string }> = {
  en: { label: 'English', flag: '🇬🇧' },
  uz: { label: "O'zbek", flag: '🇺🇿' },
  ru: { label: 'Русский', flag: '🇷🇺' },
};

const STORAGE_KEY = 'nexus_lang';

interface I18nContext {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const Context = createContext<I18nContext>({
  lang: 'en',
  setLang: () => {},
  t: en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as Language | null;
    if (saved && saved in translations) setLangState(saved);
  }, []);

  const setLang = (l: Language) => {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, l);
  };

  return createElement(Context.Provider, { value: { lang, setLang, t: translations[lang] } }, children);
}

export function useI18n() {
  return useContext(Context);
}

/** Shorthand – just the translation object */
export function useT() {
  return useContext(Context).t;
}
