/**
 * Типы для API конвертера IR кодов.
 */

export enum CompressionLevel {
  NONE = 0,
  FAST = 1,
  BALANCED = 2,
  OPTIMAL = 3,
}

export interface ConvertRequest {
  command: string;
  compression_level?: CompressionLevel;
}

export interface ConvertResponse {
  ir_code: string;
  mqtt_payload: string;
  original_length: number;
  result_length: number;
}

export interface FileConvertRequest {
  content: Record<string, unknown>;
  compression_level?: CompressionLevel;
  wrap_with_ir_code?: boolean;
}

export interface FileConvertResponse {
  content: Record<string, unknown>;
  commands_processed: number;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface ErrorResponse {
  detail: string;
  error_type?: string;
}

export interface SmartIRData {
  manufacturer?: string;
  supportedModels?: string[];
  supportedController?: string;
  commandsEncoding?: string;
  commands: Record<string, unknown>;
  [key: string]: unknown;
}
