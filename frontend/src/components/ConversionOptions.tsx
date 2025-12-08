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
  /** Compact mode for embedding in toolbar */
  compact?: boolean;
  /** Show wrap_with_ir_code option (not needed for single code) */
  showWrapOption?: boolean;
  /** Show format option */
  showFormatOption?: boolean;
}

export const defaultSettings: ConversionSettings = {
  compressionLevel: 2,
  wrapWithIrCode: true,
  formatOutput: true,
};

export default function ConversionOptions({
  settings,
  onChange,
  disabled = false,
  compact = false,
  showWrapOption = true,
  showFormatOption = true,
}: ConversionOptionsProps) {
  const { t } = useTranslation();

  const handleCompressionChange = (level: CompressionLevel) => {
    onChange({ ...settings, compressionLevel: level });
  };

  const handleWrapChange = (wrap: boolean) => {
    onChange({ ...settings, wrapWithIrCode: wrap });
  };

  const handleFormatChange = (format: boolean) => {
    onChange({ ...settings, formatOutput: format });
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-4 items-center">
        {/* Compression Level */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-400">{t.options.compression}</label>
          <select
            value={settings.compressionLevel}
            onChange={(e) =>
              handleCompressionChange(Number(e.target.value) as CompressionLevel)
            }
            className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          >
            <option value={0}>{t.options.level0}</option>
            <option value={1}>{t.options.level1}</option>
            <option value={2}>{t.options.level2}</option>
            <option value={3}>{t.options.level3}</option>
          </select>
        </div>

        {/* Wrap Option */}
        {showWrapOption && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.wrapWithIrCode}
              onChange={(e) => handleWrapChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              disabled={disabled}
            />
            <span className="text-sm text-gray-300">
              {t.options.wrapWithIrCode}{" "}
              <code className="text-blue-400 bg-gray-800 px-1 rounded">
                ir_code_to_send
              </code>
            </span>
          </label>
        )}

        {/* Format Option */}
        {showFormatOption && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.formatOutput}
              onChange={(e) => handleFormatChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              disabled={disabled}
            />
            <span className="text-sm text-gray-300">{t.options.formatJson}</span>
          </label>
        )}
      </div>
    );
  }

  // Full mode (vertical layout)
  return (
    <div className="space-y-4">
      {/* Compression Level */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {t.options.compressionLabel}
        </label>
        <select
          value={settings.compressionLevel}
          onChange={(e) =>
            handleCompressionChange(Number(e.target.value) as CompressionLevel)
          }
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={disabled}
        >
          <option value={0}>{t.options.level0}</option>
          <option value={1}>{t.options.level1}</option>
          <option value={2}>{t.options.level2Recommended}</option>
          <option value={3}>{t.options.level3}</option>
        </select>
      </div>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {showWrapOption && (
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
            <input
              type="checkbox"
              checked={settings.wrapWithIrCode}
              onChange={(e) => handleWrapChange(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              disabled={disabled}
            />
            <div>
              <span className="text-sm text-gray-200">
                {t.options.wrapWithIrCode} ir_code_to_send
              </span>
              <p className="text-xs text-gray-500 mt-0.5">
                {t.options.wrapDescription}
              </p>
            </div>
          </label>
        )}

        {showFormatOption && (
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
            <input
              type="checkbox"
              checked={settings.formatOutput}
              onChange={(e) => handleFormatChange(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900"
              disabled={disabled}
            />
            <div>
              <span className="text-sm text-gray-200">{t.options.formatJson}</span>
              <p className="text-xs text-gray-500 mt-0.5">
                {t.options.formatDescription}
              </p>
            </div>
          </label>
        )}
      </div>
    </div>
  );
}
