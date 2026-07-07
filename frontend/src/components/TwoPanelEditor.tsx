"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "@/i18n";
import {
  IRConverter,
  BTUError,
  isSmartIRData,
  countSmartIRCommands,
} from "@/lib/converter";
import { downloadTextFile } from "@/lib/download";
import JsonEditor from "./JsonEditor";
import ConversionOptions, {
  defaultSettings,
  type ConversionSettings,
} from "./ConversionOptions";
import type { SmartIRData } from "@/types";

const LIVE_VALIDATION_MAX_CHARS = 500_000;

export default function TwoPanelEditor() {
  const { t } = useTranslation();
  const [inputJson, setInputJson] = useState("");
  const [outputJson, setOutputJson] = useState("");
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    commands: number;
    inputSize: number;
    outputSize: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const validateJson = useCallback(
    (json: string): SmartIRData | null => {
      if (!json.trim()) {
        setInputError(null);
        return null;
      }
      try {
        const parsed: unknown = JSON.parse(json);
        if (!isSmartIRData(parsed)) {
          setInputError(t.validation.mustBeObject);
          return null;
        }
        setInputError(null);
        return parsed;
      } catch (e) {
        setInputError(
          `${t.validation.invalidJson} ${e instanceof Error ? e.message : t.validation.parseError}`
        );
        return null;
      }
    },
    [t]
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInputJson(value);
      if (value.length <= LIVE_VALIDATION_MAX_CHARS) validateJson(value);
      else setInputError(null);
    },
    [validateJson]
  );

  const handleConvert = async () => {
    const parsed = validateJson(inputJson);
    if (!parsed) return;
    setLoading(true);
    setOutputJson("");
    setStats(null);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    try {
      const converter = new IRConverter(settings.compressionLevel);
      const result = converter.processSmartIRData(parsed, settings.wrapWithIrCode);
      let content = result as Record<string, unknown>;
      if (!settings.wrapWithIrCode) content = unwrapIrCodes(content);
      const formatted = settings.formatOutput
        ? JSON.stringify(content, null, 2)
        : JSON.stringify(content);
      setOutputJson(formatted);
      setStats({
        commands: countSmartIRCommands(parsed.commands),
        inputSize: inputJson.length,
        outputSize: formatted.length,
      });
    } catch (e) {
      setInputError(
        e instanceof BTUError
          ? e.message
          : `${t.errors.error}: ${e instanceof Error ? e.message : t.validation.unknownError}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormat = () => {
    const parsed = validateJson(inputJson);
    if (parsed) setInputJson(JSON.stringify(parsed, null, 2));
  };

  const handleClear = () => {
    setInputJson("");
    setOutputJson("");
    setInputError(null);
    setStats(null);
  };

  const handleCopy = async () => {
    if (!outputJson) return;
    await navigator.clipboard.writeText(outputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const handleDownload = () => {
    if (!outputJson) return;
    downloadTextFile(outputJson, "converted.json");
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <ConversionOptions
          settings={settings}
          onChange={setSettings}
          disabled={loading}
          showWrapOption
          showFormatOption
        />
        <div className="flex-1" />
        <button
          onClick={handleFormat}
          disabled={loading || !inputJson.trim()}
          className="label transition-colors disabled:cursor-not-allowed"
          style={{ color: "var(--color-text-mute)" }}
        >
          {t.editor.format}
        </button>
        <button
          onClick={handleClear}
          disabled={loading}
          className="label transition-colors disabled:cursor-not-allowed"
          style={{ color: "var(--color-text-mute)" }}
        >
          {t.editor.clear}
        </button>
        <button
          onClick={handleConvert}
          disabled={loading || !inputJson.trim() || !!inputError}
          className="px-4 py-2 text-[12px] tracking-[0.2em] uppercase font-medium border transition-colors disabled:cursor-not-allowed"
          style={{
            background:
              loading || !inputJson.trim() || !!inputError
                ? "transparent"
                : "color-mix(in oklab, var(--color-amber) 15%, transparent)",
            borderColor:
              loading || !inputJson.trim() || !!inputError
                ? "var(--color-rule)"
                : "var(--color-amber)",
            color:
              loading || !inputJson.trim() || !!inputError
                ? "var(--color-text-dim)"
                : "var(--color-amber)",
          }}
        >
          {loading ? "Encoding…" : `${t.editor.convert} →`}
        </button>
      </div>

      {/* Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[560px]">
        <PanelFrame
          label={t.editor.inputLabel}
          meta={`${inputJson.length.toLocaleString()} c`}
        >
          <JsonEditor
            value={inputJson}
            onChange={handleInputChange}
            error={inputError}
            placeholder={t.editor.placeholder}
            className="h-full"
          />
        </PanelFrame>

        <PanelFrame
          label={t.editor.outputLabel}
          meta={
            stats
              ? `${stats.commands} ${t.editor.commands} · ${stats.outputSize.toLocaleString()} c`
              : undefined
          }
          actions={
            outputJson && (
              <>
                <button
                  onClick={handleCopy}
                  className="label transition-colors"
                  style={{
                    color: copied
                      ? "var(--color-ok)"
                      : "var(--color-text-mute)",
                  }}
                >
                  {copied ? "Copied ✓" : t.editor.copyOutput}
                </button>
                <button
                  onClick={handleDownload}
                  className="label transition-colors"
                  style={{ color: "var(--color-amber)" }}
                >
                  {t.editor.download} ↓
                </button>
              </>
            )
          }
        >
          <JsonEditor
            value={outputJson}
            readOnly
            placeholder={t.editor.resultPlaceholder}
            className="h-full"
          />
        </PanelFrame>
      </div>

      {stats && (
        <div
          className="flex flex-wrap gap-x-8 gap-y-1 pt-3 border-t"
          style={{ borderColor: "var(--color-rule)" }}
        >
          <span className="flex items-baseline gap-2">
            <span className="label">{t.editor.sizeRatio}</span>
            <span
              className="text-[13px] tabular-nums"
              style={{ color: "var(--color-amber)" }}
            >
              {((stats.outputSize / stats.inputSize) * 100).toFixed(1)}%
            </span>
            <span className="label">{t.editor.ofOriginal}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function PanelFrame({
  label,
  meta,
  actions,
  children,
}: {
  label: string;
  meta?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-0">
      <div
        className="flex items-center justify-between pb-1 mb-2 border-b"
        style={{ borderColor: "var(--color-rule)" }}
      >
        <div className="flex items-baseline gap-3">
          <span className="label">{label}</span>
          {meta && <span className="label">{meta}</span>}
        </div>
        {actions && <div className="flex items-baseline gap-3">{actions}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

function unwrapIrCodes(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = Object.create(null);
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      try {
        const parsed: unknown = JSON.parse(value);
        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed) &&
          typeof (parsed as { ir_code_to_send?: unknown }).ir_code_to_send ===
            "string"
        ) {
          result[key] = (parsed as { ir_code_to_send: string }).ir_code_to_send;
        } else {
          result[key] = value;
        }
      } catch {
        result[key] = value;
      }
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      result[key] = unwrapIrCodes(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}
