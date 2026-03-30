/**
 * Типы для конвертера IR кодов.
 */

export { CompressionLevel } from '@/lib/converter';
export type { SmartIRData } from '@/lib/converter';

export interface ConvertResult {
  ir_code: string;
  mqtt_payload: string;
  original_length: number;
  result_length: number;
}

export interface FileConvertResult {
  content: Record<string, unknown>;
  commands_processed: number;
}
