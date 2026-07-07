"use client";

import { useTranslation, type Language } from "@/i18n";

const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  return (
    <div className="flex items-center gap-2 label">
      {LANGS.map((lang, i) => (
        <span key={lang.code} className="flex items-center gap-2">
          {i > 0 && (
            <span style={{ color: "var(--color-text-dim)" }} aria-hidden="true">
              |
            </span>
          )}
          <button
            onClick={() => setLanguage(lang.code)}
            aria-pressed={language === lang.code}
            className="tracking-[0.15em] transition-colors"
            style={{
              color:
                language === lang.code
                  ? "var(--color-amber)"
                  : "var(--color-text-mute)",
            }}
          >
            {lang.label}
          </button>
        </span>
      ))}
    </div>
  );
}
