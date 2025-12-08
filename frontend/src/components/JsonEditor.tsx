"use client";

import { useCallback, useMemo } from "react";

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

// Подсветка синтаксиса JSON
function highlightJson(json: string): string {
  if (!json) return "";

  // Escape HTML
  const escaped = json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Подсветка различных элементов JSON
  return escaped
    // Строки (ключи и значения)
    .replace(
      /("(?:[^"\\]|\\.)*")\s*:/g,
      '<span class="text-purple-400">$1</span>:'
    )
    .replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      ': <span class="text-green-400">$1</span>'
    )
    // Числа
    .replace(
      /:\s*(-?\d+\.?\d*)/g,
      ': <span class="text-amber-400">$1</span>'
    )
    // Boolean и null
    .replace(
      /:\s*(true|false|null)/g,
      ': <span class="text-blue-400">$1</span>'
    )
    // Скобки
    .replace(/([{}\[\]])/g, '<span class="text-gray-500">$1</span>');
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

  const highlightedHtml = useMemo(() => highlightJson(value), [value]);

  // Вычисляем количество строк и нужен ли скролл
  const lineCount = useMemo(() => value.split("\n").length, [value]);
  const needsScroll = lineCount > maxLines;

  // Высота строки ~20px, максимальная высота = maxLines * 20px
  const maxHeight = `${maxLines * 20}px`;

  // Для readOnly режима используем div с подсветкой
  if (readOnly && value) {
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
            style={needsScroll ? { maxHeight, overflowY: "auto" } : undefined}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
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
          readOnly={readOnly}
          spellCheck={false}
          style={needsScroll ? { maxHeight, overflowY: "auto" } : undefined}
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
