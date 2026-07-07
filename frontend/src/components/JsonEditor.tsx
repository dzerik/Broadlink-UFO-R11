"use client";

import { useCallback, useMemo } from "react";

// Порог, выше которого пропускаем подсветку — на очень больших значениях
// проход по всем токенам блокирует main-thread.
const HIGHLIGHT_MAX_CHARS = 200_000;

interface JsonEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  label?: string;
  error?: string | null;
  className?: string;
  /** Максимальное количество строк до включения скролла */
  maxLines?: number;
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * Одноходовой JSON-aware токенизатор для подсветки. В отличие от
 * regex-каскада, корректно обрабатывает скобки внутри строковых литералов —
 * `"[on]"` целиком помечается как строка, а `[` не окрашивается как скобка.
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
      // Ключ vs значение — по следующему не-пробельному символу.
      let k = j;
      while (k < n && (json[k] === " " || json[k] === "\t")) k++;
      const cls = json[k] === ":" ? "text-purple-400" : "text-green-400";
      out.push(`<span class="${cls}">${escapeHtml(json.slice(i, j))}</span>`);
      i = j;
      continue;
    }

    if (ch === "{" || ch === "}" || ch === "[" || ch === "]") {
      out.push(`<span class="text-gray-500">${ch}</span>`);
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
      out.push(`<span class="text-amber-400">${json.slice(i, j)}</span>`);
      i = j;
      continue;
    }

    if (json.startsWith("true", i)) {
      out.push('<span class="text-blue-400">true</span>');
      i += 4;
      continue;
    }
    if (json.startsWith("null", i)) {
      out.push('<span class="text-blue-400">null</span>');
      i += 4;
      continue;
    }
    if (json.startsWith("false", i)) {
      out.push('<span class="text-blue-400">false</span>');
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
  placeholder = "Вставьте JSON здесь...",
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
  const scrollStyle = needsScroll ? { maxHeight, overflowY: "auto" as const } : undefined;

  // readOnly-режим: всегда рендерим одну DOM-структуру (<pre>) — переход
  // между пустым и непустым значением не вызывает unmount/remount.
  if (readOnly) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative flex-1 min-h-0">
          <pre
            className="w-full h-full p-4 bg-gray-900 border border-gray-700 rounded-lg text-sm font-mono overflow-auto whitespace-pre-wrap break-all"
            style={scrollStyle}
            dangerouslySetInnerHTML={{
              __html:
                value.length === 0
                  ? `<span class="text-gray-600">${escapeHtml(placeholder)}</span>`
                  : highlightedHtml || escapeHtml(value),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative flex-1 min-h-0">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          spellCheck={false}
          style={scrollStyle}
          className={`w-full h-full p-4 bg-gray-900 border rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            error
              ? "border-red-500 text-red-300"
              : "border-gray-700 text-gray-300"
          }`}
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
