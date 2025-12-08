"use client";

import { useState, useEffect } from "react";
import { checkHealth } from "@/lib/api";
import { useTranslation } from "@/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"loading" | "online" | "offline">(
    "loading"
  );
  const [version, setVersion] = useState<string>("");

  useEffect(() => {
    const check = async () => {
      try {
        const health = await checkHealth();
        setStatus("online");
        setVersion(health.version);
      } catch (err) {
        console.error("Health check failed:", err);
        setStatus("offline");
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="w-full px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white">{t.header.title}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{t.header.subtitle}</p>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                status === "online"
                  ? "bg-green-500"
                  : status === "offline"
                    ? "bg-red-500"
                    : "bg-yellow-500 animate-pulse"
              }`}
            />
            <span className="text-sm text-gray-400">
              {status === "online"
                ? `API v${version}`
                : status === "offline"
                  ? t.header.offline
                  : t.header.connecting}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
