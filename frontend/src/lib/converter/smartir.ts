import { IRConverter } from './index';

export interface SmartIRData {
  [key: string]: unknown;
  commands?: Record<string, unknown>;
  supportedController?: string;
  commandsEncoding?: string;
}

export function processSmartIRData(
  data: SmartIRData,
  converter: IRConverter,
  wrapWithIrCode: boolean = true
): SmartIRData {
  const result = { ...data };
  result.commands = processCommands(
    (data.commands ?? {}) as Record<string, unknown>,
    converter,
    wrapWithIrCode
  );
  result.supportedController = 'MQTT';
  result.commandsEncoding = 'Raw';
  return result;
}

function processCommands(
  commands: Record<string, unknown>,
  converter: IRConverter,
  wrapWithIrCode: boolean
): Record<string, unknown> {
  const processed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(commands)) {
    if (typeof value === 'string') {
      const irCode = converter.convert(value);
      processed[key] = wrapWithIrCode
        ? `{"ir_code_to_send": "${irCode}"}`
        : irCode;
    } else if (Array.isArray(value)) {
      processed[key] = value;
    } else if (value !== null && typeof value === 'object') {
      processed[key] = processCommands(
        value as Record<string, unknown>,
        converter,
        wrapWithIrCode
      );
    } else {
      processed[key] = value;
    }
  }

  return processed;
}
