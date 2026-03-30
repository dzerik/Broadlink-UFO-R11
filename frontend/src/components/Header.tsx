"use client";

import { useTranslation } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="w-full px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">{t.header.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t.header.subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/smartHomeHub/SmartIR/tree/master/codes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            SmartIR Codes
          </a>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}
