"use client";

import { useTranslation } from "@/i18n";
import type { CompressionLevel } from "@/types";

export interface ConversionSettings {
  compressionLevel: CompressionLevel;
  wrapWithIrCode: boolean;
  formatOutput: boolean;
}

interface ConversionOptionsProps {
  settings: ConversionSettings;
  onChange: (settings: ConversionSettings) => void;
  disabled?: boolean;
  showWrapOption?: boolean;
  showFormatOption?: boolean;
}

export const defaultSettings: ConversionSettings = {
  compressionLevel: 2,
  wrapWithIrCode: true,
  formatOutput: true,
};

const LEVELS: { value: CompressionLevel; short: string }[] = [
  { value: 0, short: "0" },
  { value: 1, short: "1" },
  { value: 2, short: "2" },
  { value: 3, short: "3" },
];

export default function ConversionOptions({
  settings,
  onChange,
  disabled = false,
  showWrapOption = true,
  showFormatOption = true,
}: ConversionOptionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 items-center">
      {/* Compression as radio-strip — быстрее и понятнее select'a */}
      <div className="flex items-center gap-3">
        <span className="label">Compression</span>
        <div
          className="flex border"
          style={{ borderColor: "var(--color-rule)" }}
          role="radiogroup"
          aria-label="Compression level"
        >
          {LEVELS.map((lvl) => {
            const active = settings.compressionLevel === lvl.value;
            return (
              <button
                key={lvl.value}
                type="button"
                onClick={() =>
                  onChange({ ...settings, compressionLevel: lvl.value })
                }
                disabled={disabled}
                role="radio"
                aria-checked={active}
                title={t.options[`level${lvl.value}` as keyof typeof t.options]}
                className="px-3 py-1.5 text-[13px] tabular-nums transition-colors disabled:cursor-not-allowed"
                style={{
                  background: active
                    ? "color-mix(in oklab, var(--color-amber) 15%, transparent)"
                    : "transparent",
                  color: active
                    ? "var(--color-amber)"
                    : "var(--color-text-mute)",
                  borderLeft:
                    lvl.value !== 0
                      ? "1px solid var(--color-rule)"
                      : undefined,
                }}
              >
                {lvl.short}
              </button>
            );
          })}
        </div>
      </div>

      {showWrapOption && (
        <Check
          label={t.options.wrapWithIrCode}
          checked={settings.wrapWithIrCode}
          onChange={(v) => onChange({ ...settings, wrapWithIrCode: v })}
          disabled={disabled}
        />
      )}

      {showFormatOption && (
        <Check
          label={t.options.formatJson}
          checked={settings.formatOutput}
          onChange={(v) => onChange({ ...settings, formatOutput: v })}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-3.5 h-3.5"
      />
      <span
        className="label"
        style={{
          color: checked ? "var(--color-text)" : "var(--color-text-mute)",
        }}
      >
        {label}
      </span>
    </label>
  );
}
