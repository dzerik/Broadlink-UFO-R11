"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "@/i18n";
import JsonEditor from "./JsonEditor";
import ConversionOptions, {
  defaultSettings,
  type ConversionSettings,
} from "./ConversionOptions";
import type { SmartIRData } from "@/types";

interface TwoPanelEditorProps {
  onConvert?: (
    input: SmartIRData,
    settings: ConversionSettings
  ) => Promise<SmartIRData>;
}

export default function TwoPanelEditor({ onConvert }: TwoPanelEditorProps) {
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

  const validateJson = useCallback(
    (json: string): SmartIRData | null => {
      if (!json.trim()) {
        setInputError(null);
        return null;
      }
      try {
        const parsed = JSON.parse(json);
        if (typeof parsed !== "object" || parsed === null) {
          setInputError(t.validation.mustBeObject);
          return null;
        }
        setInputError(null);
        return parsed as SmartIRData;
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
      validateJson(value);
    },
    [validateJson]
  );

  const handleConvert = async () => {
    const parsed = validateJson(inputJson);
    if (!parsed) return;

    setLoading(true);
    setOutputJson("");
    setStats(null);

    try {
      const response = await fetch("/api/convert/file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: parsed,
          compression_level: settings.compressionLevel,
          wrap_with_ir_code: settings.wrapWithIrCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setInputError(error.detail || t.validation.conversionError);
        return;
      }

      const result = await response.json();
      let outputContent = result.content;

      // If wrap_with_ir_code is disabled, unwrap
      if (!settings.wrapWithIrCode) {
        outputContent = unwrapIrCodes(outputContent);
      }

      const formattedOutput = settings.formatOutput
        ? JSON.stringify(outputContent, null, 2)
        : JSON.stringify(outputContent);
      setOutputJson(formattedOutput);
      setStats({
        commands: result.commands_processed,
        inputSize: inputJson.length,
        outputSize: formattedOutput.length,
      });
    } catch (e) {
      setInputError(
        `${t.errors.error}: ${e instanceof Error ? e.message : t.validation.unknownError}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormat = () => {
    const parsed = validateJson(inputJson);
    if (parsed) {
      setInputJson(JSON.stringify(parsed, null, 2));
    }
  };

  const handleClear = () => {
    setInputJson("");
    setOutputJson("");
    setInputError(null);
    setStats(null);
  };

  const handleCopyOutput = () => {
    if (outputJson) {
      navigator.clipboard.writeText(outputJson);
    }
  };

  const handleDownload = () => {
    if (!outputJson) return;
    const blob = new Blob([outputJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <ConversionOptions
          settings={settings}
          onChange={setSettings}
          disabled={loading}
          compact
          showWrapOption
          showFormatOption
        />
        <button
          onClick={handleConvert}
          disabled={loading || !inputJson.trim() || !!inputError}
          className="flex-1 lg:flex-none lg:min-w-[200px] py-3 px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t.convertForm.converting}
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              {t.editor.convert}
            </>
          )}
        </button>
        <div className="flex-1" />

        <div className="flex gap-2">
          <button
            onClick={handleFormat}
            disabled={loading || !inputJson.trim()}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
          >
            {t.editor.format}
          </button>
          <button
            onClick={handleClear}
            disabled={loading}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
          >
            {t.editor.clear}
          </button>
        </div>
      </div>

      {/* Two panels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* Input panel */}
        <div className="flex flex-col min-h-[500px] lg:min-h-[600px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">
              {t.editor.inputLabel}
            </span>
            <span className="text-xs text-gray-500">
              {inputJson.length.toLocaleString()} {t.editor.chars}
            </span>
          </div>
          <div className="flex-1 min-h-0">
            <JsonEditor
              value={inputJson}
              onChange={handleInputChange}
              error={inputError}
              placeholder={t.editor.placeholder}
              className="h-full"
            />
          </div>
        </div>

        {/* Output panel */}
        <div className="flex flex-col min-h-[500px] lg:min-h-[600px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">
              {t.editor.outputLabel}
            </span>
            <div className="flex items-center gap-2">
              {stats && (
                <span className="text-xs text-gray-500">
                  {stats.commands} {t.editor.commands} ·{" "}
                  {stats.outputSize.toLocaleString()} {t.editor.chars}
                </span>
              )}
              {outputJson && (
                <>
                  <button
                    onClick={handleCopyOutput}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    {t.editor.copyOutput}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    {t.editor.download}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <JsonEditor
              value={outputJson}
              readOnly
              placeholder={t.editor.resultPlaceholder}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4">
        {stats && (
          <div className="hidden lg:flex items-center gap-4 text-sm text-gray-400">
            <span>
              {t.editor.sizeRatio}{" "}
              <span className="text-white">
                {((stats.outputSize / stats.inputSize) * 100).toFixed(1)}%
              </span>{" "}
              {t.editor.ofOriginal}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Function to unwrap ir_code_to_send
function unwrapIrCodes(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      // Try to parse JSON and extract ir_code_to_send
      try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed.ir_code_to_send === "string") {
          result[key] = parsed.ir_code_to_send;
        } else {
          result[key] = value;
        }
      } catch {
        result[key] = value;
      }
    } else if (typeof value === "object" && value !== null) {
      result[key] = unwrapIrCodes(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result;
}
