"use client";

import { useState } from "react";
import { convertSingle, ApiError } from "@/lib/api";
import { useTranslation } from "@/i18n";
import ConversionOptions, {
  defaultSettings,
  type ConversionSettings,
} from "./ConversionOptions";
import type { ConvertResponse } from "@/types";

interface ConvertFormProps {
  onResult?: (result: ConvertResponse) => void;
}

export default function ConvertForm({ onResult }: ConvertFormProps) {
  const { t } = useTranslation();
  const [command, setCommand] = useState("");
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await convertSingle({
        command: command.trim(),
        compression_level: settings.compressionLevel,
      });
      setResult(response);
      onResult?.(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError(t.validation.unknownError);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Format MQTT payload if needed
  const formatMqttPayload = (payload: string): string => {
    if (!settings.formatOutput) return payload;
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ConversionOptions
        settings={settings}
        onChange={setSettings}
        disabled={loading}
        compact
        showWrapOption={false}
        showFormatOption
      />
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div>
          <label
            htmlFor="command"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            {t.convertForm.inputLabel}
          </label>
          <textarea
            id="command"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={t.convertForm.inputPlaceholder}
            className="w-full h-32 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !command.trim()}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
        >
          {loading ? t.convertForm.converting : t.convertForm.convertButton}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
          <p className="font-medium">{t.errors.error}</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-green-300">
                {t.convertForm.resultTitle}
              </p>
              <button
                onClick={() => copyToClipboard(result.ir_code)}
                className="text-xs px-2 py-1 bg-green-800 hover:bg-green-700 rounded transition-colors"
              >
                {t.convertForm.copy}
              </button>
            </div>
            <p className="font-mono text-xs text-gray-300 break-all bg-gray-900 p-2 rounded">
              {result.ir_code}
            </p>
          </div>

          <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-blue-300">
                {t.convertForm.mqttPayload}
              </p>
              <button
                onClick={() => copyToClipboard(result.mqtt_payload)}
                className="text-xs px-2 py-1 bg-blue-800 hover:bg-blue-700 rounded transition-colors"
              >
                {t.convertForm.copy}
              </button>
            </div>
            <pre className="font-mono text-xs text-gray-300 break-all bg-gray-900 p-2 rounded whitespace-pre-wrap">
              {formatMqttPayload(result.mqtt_payload)}
            </pre>
          </div>

          <div className="flex gap-4 text-sm text-gray-400">
            <p>
              {t.convertForm.originalSize} {result.original_length}{" "}
              {t.convertForm.chars}
            </p>
            <p>
              {t.convertForm.resultSize} {result.result_length}{" "}
              {t.convertForm.chars}
            </p>
            <p>
              {t.convertForm.efficiency}{" "}
              {(
                (1 - result.result_length / result.original_length) *
                100
              ).toFixed(1)}
              %
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
