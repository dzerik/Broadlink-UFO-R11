"use client";

import { useMemo, useState } from "react";
import { IRConverter, BTUError } from "@/lib/converter";
import { BroadlinkDecoder } from "@/lib/converter/broadlink-decoder";
import { useTranslation } from "@/i18n";
import ConversionOptions, {
  defaultSettings,
  type ConversionSettings,
} from "./ConversionOptions";
import WaveformTrace from "./WaveformTrace";
import type { ConvertResult } from "@/types";

const TRACE_MAX_INPUT_CHARS = 8_000;

export default function ConvertForm({
  onResult,
}: {
  onResult?: (result: ConvertResult) => void;
}) {
  const { t } = useTranslation();
  const [command, setCommand] = useState("");
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [copied, setCopied] = useState<"ir" | "mqtt" | null>(null);

  // Живая осциллограмма — пытаемся декодировать; при ошибке молчим.
  const decodedTimings = useMemo<number[] | null>(() => {
    const trimmed = command.trim();
    if (!trimmed || trimmed.length > TRACE_MAX_INPUT_CHARS) return null;
    try {
      return new BroadlinkDecoder().decode(trimmed);
    } catch {
      return null;
    }
  }, [command]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    try {
      const converter = new IRConverter(settings.compressionLevel);
      const irCode = converter.convert(command.trim());
      const mqttPayload = JSON.stringify({ ir_code_to_send: irCode });
      const response: ConvertResult = {
        ir_code: irCode,
        mqtt_payload: mqttPayload,
        original_length: command.trim().length,
        result_length: irCode.length,
      };
      setResult(response);
      onResult?.(response);
    } catch (err) {
      setError(
        err instanceof BTUError ? err.message : t.validation.unknownError
      );
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string, which: "ir" | "mqtt") => {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied((c) => (c === which ? null : c)), 1400);
  };

  const formatMqtt = (payload: string) =>
    settings.formatOutput
      ? (() => {
          try {
            return JSON.stringify(JSON.parse(payload), null, 2);
          } catch {
            return payload;
          }
        })()
      : payload;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label htmlFor="command" className="label">
            Input · Broadlink base64
          </label>
          <span className="label">{command.length.toLocaleString()} c</span>
        </div>
        <textarea
          id="command"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder={t.convertForm.inputPlaceholder}
          className="w-full h-32 p-4 text-[13px] leading-relaxed resize-none border focus:outline-none focus:border-[color:var(--color-amber-dim)]"
          style={{
            background: "var(--color-panel)",
            borderColor: "var(--color-rule)",
            color: "var(--color-text)",
          }}
          disabled={loading}
        />
      </div>

      <WaveformTrace timings={decodedTimings} />

      <ConversionOptions
        settings={settings}
        onChange={setSettings}
        disabled={loading}
        showWrapOption={false}
        showFormatOption
      />

      <button
        type="submit"
        disabled={loading || !command.trim()}
        className="w-full py-3 text-[13px] tracking-[0.2em] uppercase font-medium border transition-colors disabled:cursor-not-allowed"
        style={{
          background:
            loading || !command.trim()
              ? "transparent"
              : "color-mix(in oklab, var(--color-amber) 12%, transparent)",
          borderColor:
            loading || !command.trim()
              ? "var(--color-rule)"
              : "var(--color-amber)",
          color:
            loading || !command.trim()
              ? "var(--color-text-dim)"
              : "var(--color-amber)",
        }}
      >
        {loading ? "Encoding…" : "Encode →"}
      </button>

      {error && (
        <div
          className="border-l-2 px-4 py-2 text-[13px]"
          style={{ borderColor: "var(--color-danger)", color: "var(--color-danger)" }}
        >
          <span className="label mr-2" style={{ color: "var(--color-danger)" }}>
            Error
          </span>
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <ResultBlock
            label="Output · UFO-R11 base64"
            value={result.ir_code}
            onCopy={() => copy(result.ir_code, "ir")}
            copied={copied === "ir"}
          />
          <ResultBlock
            label="MQTT payload"
            value={formatMqtt(result.mqtt_payload)}
            onCopy={() => copy(result.mqtt_payload, "mqtt")}
            copied={copied === "mqtt"}
          />

          <div className="flex flex-wrap gap-x-6 gap-y-1 pt-2 border-t"
            style={{ borderColor: "var(--color-rule)" }}>
            <Stat label="in" value={`${result.original_length} c`} />
            <Stat label="out" value={`${result.result_length} c`} />
            <Stat
              label="ratio"
              value={`${(
                (1 - result.result_length / result.original_length) *
                100
              ).toFixed(1)}%`}
              accent
            />
          </div>
        </div>
      )}
    </form>
  );
}

function ResultBlock({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="label">{label}</span>
        <button
          type="button"
          onClick={onCopy}
          className="label transition-colors"
          style={{
            color: copied ? "var(--color-ok)" : "var(--color-text-mute)",
          }}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre
        className="p-3 text-[12px] leading-relaxed break-all whitespace-pre-wrap border max-h-64 overflow-auto"
        style={{
          background: "var(--color-panel)",
          borderColor: "var(--color-rule)",
        }}
      >
        {value}
      </pre>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span className="label">{label}</span>
      <span
        className="text-[13px] tabular-nums"
        style={{
          color: accent ? "var(--color-amber)" : "var(--color-text)",
        }}
      >
        {value}
      </span>
    </span>
  );
}
