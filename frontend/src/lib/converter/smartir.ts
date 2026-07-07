import { IRConverter } from './index';
import { IRCodeError } from './errors';

export interface SmartIRData {
  [key: string]: unknown;
  commands?: Record<string, unknown>;
  supportedController?: string;
  commandsEncoding?: string;
}

/**
 * Runtime-guard: результат JSON.parse является plain-object'ом с опциональным
 * commands-объектом (не массивом, не примитивом).
 */
export function isSmartIRData(value: unknown): value is SmartIRData {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const commands = (value as { commands?: unknown }).commands;
  if (commands === undefined) return true;
  return (
    typeof commands === 'object' &&
    commands !== null &&
    !Array.isArray(commands)
  );
}

/**
 * Рекурсивно считает количество листьев-строк в commands-дереве SmartIR.
 * Массивы не разворачиваются (SmartIR не хранит команды в массивах).
 */
export function countSmartIRCommands(
  commands: Record<string, unknown> | undefined
): number {
  if (!commands) return 0;
  let count = 0;
  for (const value of Object.values(commands)) {
    if (typeof value === 'string') {
      count++;
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      count += countSmartIRCommands(value as Record<string, unknown>);
    }
  }
  return count;
}

export function processSmartIRData(
  data: SmartIRData,
  converter: IRConverter,
  wrapWithIrCode: boolean = true
): SmartIRData {
  const result = { ...data };
  const commands = data.commands;
  result.commands =
    typeof commands === 'object' && commands !== null && !Array.isArray(commands)
      ? processCommands(commands as Record<string, unknown>, converter, wrapWithIrCode)
      : {};
  result.supportedController = 'MQTT';
  result.commandsEncoding = 'Raw';
  return result;
}

function processCommands(
  commands: Record<string, unknown>,
  converter: IRConverter,
  wrapWithIrCode: boolean
): Record<string, unknown> {
  // Object.create(null) — защита от prototype pollution: bracket-set
  // с ключом "__proto__" из пользовательского JSON становится обычным
  // own-property, а не подменяет [[Prototype]].
  const processed: Record<string, unknown> = Object.create(null);

  for (const [key, value] of Object.entries(commands)) {
    if (typeof value === 'string') {
      const irCode = converter.convert(value);
      processed[key] = wrapWithIrCode
        ? `{"ir_code_to_send": "${irCode}"}`
        : irCode;
    } else if (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value)
    ) {
      processed[key] = processCommands(
        value as Record<string, unknown>,
        converter,
        wrapWithIrCode
      );
    } else {
      // Массивы, числа, boolean, null — не поддерживаются как значения
      // команд. Молчаливый passthrough давал внешне валидный JSON, но
      // MOES UFO-R11 не смог бы его обработать. Явная ошибка лучше.
      const kind = value === null
        ? 'null'
        : Array.isArray(value)
          ? 'array'
          : typeof value;
      throw new IRCodeError(
        `Unsupported command value type at "${key}": ${kind} (expected string or nested object)`
      );
    }
  }

  return processed;
}
