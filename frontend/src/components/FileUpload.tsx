"use client";

import { useState, useRef } from "react";
import {
  IRConverter,
  BTUError,
  isSmartIRData,
  countSmartIRCommands,
  MAX_FILE_SIZE,
} from "@/lib/converter";
import { downloadTextFile } from "@/lib/download";
import { useTranslation } from "@/i18n";
import ConversionOptions, {
  defaultSettings,
  type ConversionSettings,
} from "./ConversionOptions";
import type { FileConvertResult } from "@/types";

export default function FileUpload() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FileConvertResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptFile = (candidate: File) => {
    if (!candidate.name.endsWith(".json")) {
      setError(t.fileUpload.selectJsonFile);
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setError(t.fileUpload.fileTooLarge);
      return;
    }
    setFile(candidate);
    setError(null);
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (selected) acceptFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) acceptFile(dropped);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isSmartIRData(parsed)) {
        setError(t.validation.mustBeObject);
        return;
      }
      const converter = new IRConverter(settings.compressionLevel);
      const converted = converter.processSmartIRData(
        parsed,
        settings.wrapWithIrCode
      );
      setResult({
        content: converted as Record<string, unknown>,
        commands_processed: countSmartIRCommands(parsed.commands),
      });
    } catch (err) {
      if (err instanceof BTUError) setError(err.message);
      else if (err instanceof SyntaxError) setError(t.fileUpload.invalidJson);
      else setError(t.validation.unknownError);
    } finally {
      setLoading(false);
    }
  };

  const download = () => {
    if (!result) return;
    const content = settings.formatOutput
      ? JSON.stringify(result.content, null, 2)
      : JSON.stringify(result.content);
    const name = file
      ? file.name.replace(/\.json$/, "_converted.json")
      : "converted.json";
    downloadTextFile(content, name);
  };

  const previewContent = result
    ? (() => {
        const s = settings.formatOutput
          ? JSON.stringify(result.content, null, 2)
          : JSON.stringify(result.content);
        return s.length > 2000 ? s.slice(0, 2000) + "…" : s;
      })()
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ConversionOptions
        settings={settings}
        onChange={setSettings}
        disabled={loading}
        showWrapOption
        showFormatOption
      />

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <span className="label">Source · SmartIR .json</span>
          <span className="label">{t.fileUpload.onlyJson}</span>
        </div>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          className="p-8 text-center cursor-pointer transition-colors border border-dashed"
          style={{
            borderColor: dragging
              ? "var(--color-amber)"
              : "var(--color-rule)",
            background: dragging
              ? "color-mix(in oklab, var(--color-amber) 6%, transparent)"
              : "transparent",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="space-y-1">
              <p className="text-[13px]" style={{ color: "var(--color-text)" }}>
                {file.name}
              </p>
              <p className="label">
                {(file.size / 1024).toFixed(1)} KB · click to replace
              </p>
            </div>
          ) : (
            <p className="label">
              {t.fileUpload.dropzone} {t.fileUpload.clickToSelect}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !file}
        className="w-full py-3 text-[13px] tracking-[0.2em] uppercase font-medium border transition-colors disabled:cursor-not-allowed"
        style={{
          background:
            loading || !file
              ? "transparent"
              : "color-mix(in oklab, var(--color-amber) 12%, transparent)",
          borderColor:
            loading || !file ? "var(--color-rule)" : "var(--color-amber)",
          color:
            loading || !file ? "var(--color-text-dim)" : "var(--color-amber)",
        }}
      >
        {loading ? "Encoding…" : t.fileUpload.convertFile}
      </button>

      {error && (
        <div
          className="border-l-2 px-4 py-2 text-[13px]"
          style={{
            borderColor: "var(--color-danger)",
            color: "var(--color-danger)",
          }}
        >
          <span className="label mr-2" style={{ color: "var(--color-danger)" }}>
            Error
          </span>
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <div
            className="flex items-baseline justify-between pt-4 border-t"
            style={{ borderColor: "var(--color-rule)" }}
          >
            <div className="flex items-baseline gap-6">
              <span className="label" style={{ color: "var(--color-ok)" }}>
                {t.fileUpload.conversionComplete}
              </span>
              <span className="flex items-baseline gap-2">
                <span className="label">{t.fileUpload.commandsProcessed}</span>
                <span
                  className="text-[13px] tabular-nums"
                  style={{ color: "var(--color-amber)" }}
                >
                  {result.commands_processed}
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={download}
              className="label transition-colors"
              style={{ color: "var(--color-amber)" }}
            >
              {t.fileUpload.downloadJson} ↓
            </button>
          </div>

          <div>
            <div className="label mb-1">{t.fileUpload.previewTitle}</div>
            <pre
              className="p-3 text-[12px] leading-relaxed border max-h-72 overflow-auto whitespace-pre"
              style={{
                background: "var(--color-panel)",
                borderColor: "var(--color-rule)",
              }}
            >
              {previewContent}
            </pre>
          </div>
        </div>
      )}
    </form>
  );
}
