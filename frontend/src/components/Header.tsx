"use client";

import { useTranslation } from "@/i18n";
import { APP_VERSION } from "@/lib/version";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useTranslation();

  return (
    <header
      className="border-b sticky top-0 z-10 backdrop-blur-sm"
      style={{
        borderColor: "var(--color-rule)",
        background: "color-mix(in oklab, var(--color-bg) 92%, transparent)",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-6">
        {/* Wordmark: строгий инструментальный signature. */}
        <div className="flex items-baseline gap-3">
          <span
            className="text-base font-bold tracking-tight"
            style={{ color: "var(--color-amber)" }}
          >
            BTU
          </span>
          <span
            className="hidden sm:inline text-[13px]"
            style={{ color: "var(--color-text-mute)" }}
          >
            {t.header.title}
          </span>
        </div>

        <div className="flex-1" />

        <span
          className="label hidden md:inline"
          title="Application version"
        >
          v{APP_VERSION}
        </span>

        <a
          href="https://github.com/smartHomeHub/SmartIR/tree/master/codes"
          target="_blank"
          rel="noopener noreferrer"
          className="label hover:!text-[color:var(--color-text)] transition-colors"
        >
          SmartIR
        </a>
        <a
          href="https://github.com/dzerik/Broadlink-UFO-R11"
          target="_blank"
          rel="noopener noreferrer"
          className="label hover:!text-[color:var(--color-text)] transition-colors"
        >
          GitHub
        </a>

        <span
          className="hidden sm:inline h-4 w-px"
          style={{ background: "var(--color-rule)" }}
        />

        <LanguageSwitcher />
      </div>
    </header>
  );
}
