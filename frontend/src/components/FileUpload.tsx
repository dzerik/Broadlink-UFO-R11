"use client";

import { useState, useRef } from "react";
import { convertFile, ApiError } from "@/lib/api";
import { useTranslation } from "@/i18n";
import ConversionOptions, {
  defaultSettings,
  type ConversionSettings,
} from "./ConversionOptions";
import type { FileConvertResponse, SmartIRData } from "@/types";

export default function FileUpload() {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<ConversionSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FileConvertResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".json")) {
        setError(t.fileUpload.selectJsonFile);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.endsWith(".json")) {
        setError(t.fileUpload.selectJsonFile);
        return;
      }
      setFile(droppedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const content: SmartIRData = JSON.parse(text);

      const response = await convertFile({
        content,
        compression_level: settings.compressionLevel,
        wrap_with_ir_code: settings.wrapWithIrCode,
      });
      setResult(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else if (err instanceof SyntaxError) {
        setError(t.fileUpload.invalidJson);
      } else {
        setError(t.validation.unknownError);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;

    const jsonContent = settings.formatOutput
      ? JSON.stringify(result.content, null, 2)
      : JSON.stringify(result.content);

    const blob = new Blob([jsonContent], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file
      ? file.name.replace(".json", "_converted.json")
      : "converted.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPreviewContent = (): string => {
    if (!result) return "";
    const content = settings.formatOutput
      ? JSON.stringify(result.content, null, 2)
      : JSON.stringify(result.content);
    return content.length > 2000 ? content.slice(0, 2000) + "..." : content;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <ConversionOptions
          settings={settings}
          onChange={setSettings}
          disabled={loading}
          compact
          showWrapOption
          showFormatOption
        />
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-600 hover:border-gray-500 rounded-lg p-8 text-center cursor-pointer transition-colors duration-200"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-400">
              {file ? (
                <span className="text-white font-medium">{file.name}</span>
              ) : (
                <>
                  {t.fileUpload.dropzone}{" "}
                  <span className="text-blue-400">{t.fileUpload.clickToSelect}</span>
                </>
              )}
            </p>
            <p className="text-xs text-gray-500">{t.fileUpload.onlyJson}</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
        >
          {loading ? t.convertForm.converting : t.fileUpload.convertFile}
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
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-sm font-medium text-green-300">
                  {t.fileUpload.conversionComplete}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t.fileUpload.commandsProcessed} {result.commands_processed}
                </p>
              </div>
              <button
                onClick={downloadResult}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                {t.fileUpload.downloadJson}
              </button>
            </div>
          </div>

          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-300 mb-2">
              {t.fileUpload.previewTitle}
            </p>
            <pre className="text-xs text-gray-400 overflow-auto max-h-64 bg-gray-900 p-3 rounded">
              {getPreviewContent()}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
