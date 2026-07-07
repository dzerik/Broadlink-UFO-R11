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
