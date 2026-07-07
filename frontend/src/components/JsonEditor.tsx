"use client";

import { useCallback, useMemo } from "react";

const HIGHLIGHT_MAX_CHARS = 200_000;

interface JsonEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  label?: string;
  error?: string | null;
  className?: string;
  maxLines?: number;
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Одноходовой JSON-aware токенизатор для подсветки. Скобки внутри
 * строковых литералов не окрашиваются как структурные — trace-aware
 * подсветка в signal-scope палитре: amber для ключей, cyan для значений,
 * muted для чисел, приглушённый цвет для скобок.
 */
function highlightJson(json: string): string {
  if (!json) return "";
  const out: string[] = [];
  const n = json.length;
  let i = 0;

  while (i < n) {
    const ch = json[i];

    if (ch === '"') {
      let j = i + 1;
      while (j < n) {
        const c = json[j];
        if (c === "\\") {
          j += 2;
          continue;
        }
        if (c === '"') {
          j++;
          break;
        }
        j++;
      }
      let k = j;
      while (k < n && (json[k] === " " || json[k] === "\t")) k++;
      const color = json[k] === ":" ? "var(--color-amber)" : "var(--color-cyan)";
      out.push(
        `<span style="color:${color}">${escapeHtml(json.slice(i, j))}</span>`
      );
      i = j;
      continue;
    }

    if (ch === "{" || ch === "}" || ch === "[" || ch === "]") {
      out.push(
        `<span style="color:var(--color-text-mute)">${ch}</span>`
      );
      i++;
      continue;
    }

    if (ch === "-" || (ch >= "0" && ch <= "9")) {
      let j = i;
      if (json[j] === "-") j++;
      while (j < n && json[j] >= "0" && json[j] <= "9") j++;
      if (json[j] === ".") {
        j++;
        while (j < n && json[j] >= "0" && json[j] <= "9") j++;
      }
      if (json[j] === "e" || json[j] === "E") {
        j++;
        if (json[j] === "+" || json[j] === "-") j++;
        while (j < n && json[j] >= "0" && json[j] <= "9") j++;
      }
      out.push(
        `<span style="color:var(--color-text)">${json.slice(i, j)}</span>`
      );
      i = j;
      continue;
    }

    if (json.startsWith("true", i) || json.startsWith("null", i)) {
      out.push(
        `<span style="color:var(--color-ok)">${json.substr(i, 4)}</span>`
      );
      i += 4;
      continue;
    }
    if (json.startsWith("false", i)) {
      out.push(`<span style="color:var(--color-danger)">false</span>`);
      i += 5;
      continue;
    }

    out.push(escapeHtml(ch));
    i++;
  }

  return out.join("");
}

export default function JsonEditor({
  value,
  onChange,
  readOnly = false,
  placeholder = "Paste JSON here…",
  label,
  error,
  className = "",
  maxLines = 80,
}: JsonEditorProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e.target.value);
    },
    [onChange]
  );

  const highlightedHtml = useMemo(
    () => (value.length > HIGHLIGHT_MAX_CHARS ? "" : highlightJson(value)),
    [value]
  );

  const lineCount = useMemo(() => value.split("\n").length, [value]);
  const needsScroll = lineCount > maxLines;
  const maxHeight = `${maxLines * 20}px`;
  const scrollStyle = needsScroll
    ? { maxHeight, overflowY: "auto" as const }
    : undefined;

  const baseStyle = {
    background: "var(--color-panel)",
    borderColor: error ? "var(--color-danger)" : "var(--color-rule)",
    color: error ? "var(--color-danger)" : "var(--color-text)",
  };

  if (readOnly) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {label && <span className="label mb-1">{label}</span>}
        <div className="relative flex-1 min-h-0">
          <pre
            className="w-full h-full p-3 text-[12px] leading-relaxed overflow-auto whitespace-pre-wrap break-all border"
            style={{ ...baseStyle, ...scrollStyle }}
            dangerouslySetInnerHTML={{
              __html:
                value.length === 0
                  ? `<span style="color:var(--color-text-dim)">${escapeHtml(placeholder)}</span>`
                  : highlightedHtml || escapeHtml(value),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {label && <span className="label mb-1">{label}</span>}
      <div className="relative flex-1 min-h-0">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          spellCheck={false}
          style={{ ...baseStyle, ...scrollStyle }}
          className="w-full h-full p-3 text-[12px] leading-relaxed resize-none border focus:outline-none focus:border-[color:var(--color-amber-dim)]"
        />
      </div>
      {error && (
        <p
          className="mt-2 text-[12px]"
          style={{ color: "var(--color-danger)" }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
