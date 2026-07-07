import { describe, it, expect } from 'vitest';
import { IRConverter, IRCodeError } from '../../lib/converter';

describe('BroadlinkDecoder — негативные пути', () => {
  const converter = new IRConverter();

  it('пустая строка → IRCodeError "Empty Base64"', () => {
    expect(() => converter.convert('')).toThrow(IRCodeError);
    expect(() => converter.convert('')).toThrow(/Empty Base64/);
  });

  it('невалидный Base64 → IRCodeError "Invalid Base64"', () => {
    expect(() => converter.convert('!!!not_base64@@@')).toThrow(IRCodeError);
    expect(() => converter.convert('!!!not_base64@@@')).toThrow(/Invalid Base64/);
  });

  it('слишком короткий Broadlink header (<4 bytes) → IRCodeError', () => {
    // "AAA=" decodes to 2 bytes — header требует минимум 4.
    expect(() => converter.convert('AAA=')).toThrow(IRCodeError);
    expect(() => converter.convert('AAA=')).toThrow(/too short/);
  });

  it('обрезанная extended-последовательность (00 без 2 байт следом) → IRCodeError', () => {
    // Заголовок [0x26, 0x00, 0x02, 0x00] (length=2) + [0x00, 0xAA] —
    // за 0x00 должно идти 2 байта, а тут только 1. Base64 = "JgACAACq".
    const truncated = 'JgACAACq';
    expect(() => converter.convert(truncated)).toThrow(IRCodeError);
    expect(() => converter.convert(truncated)).toThrow(/Incomplete data/);
  });

  it('одиночный timing декодируется без ошибки', () => {
    // Заголовок [0x26, 0x00, 0x01, 0x00] + [0x40] (1 timing) = "JgABAEA=".
    expect(() => converter.convert('JgABAEA=')).not.toThrow();
  });
});
