"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { en, ru, type TranslationKeys } from "./translations";

export type Language = "en" | "ru";

const translations: Record<Language, TranslationKeys> = { en, ru };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const STORAGE_KEY = "btu-language";
const DEFAULT_LANGUAGE: Language = "en";

function readSavedLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "ru") return saved;
  } catch {
    // localStorage may be blocked (Safari private mode etc.) — fall through.
  }
  return DEFAULT_LANGUAGE;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Ленивый инициализатор: читаем localStorage в первом же render'e.
  // Static HTML отрисован с DEFAULT_LANGUAGE — SSR-mismatch подавляется
  // suppressHydrationWarning на <html> в layout.tsx.
  const [language, setLanguageState] = useState<Language>(readSavedLanguage);

  // Синхронизируем <html lang> при смене языка (initial значение уже
  // выставлено inline-скриптом в layout, здесь только при switch).
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore write errors
    }
  }, []);

  const value = useMemo<LanguageContextType>(
    () => ({ language, setLanguage, t: translations[language] }),
    [language, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
