import { describe, it, expect } from 'vitest';
import { IRConverter, IRCodeError } from '../../lib/converter';
import { TuyaEncoder } from '../../lib/converter/tuya-encoder';

/**
 * Строит валидный Broadlink Base64 из массива таймингов (в единицах ~unit).
 * Все значения приводятся к байту напрямую (>0 и <256), 0xFFFF используется
 * для проверки фильтрации.
 */
function buildBroadlink(timings: number[]): string {
  const bytes: number[] = [0x26, 0x00, timings.length & 0xff, (timings.length >> 8) & 0xff];
  for (const t of timings) {
    if (t >= 256) {
      // extended: 0x00, hi, lo (big-endian)
      bytes.push(0x00, (t >> 8) & 0xff, t & 0xff);
    } else {
      bytes.push(t);
    }
  }
  const bin = String.fromCharCode(...bytes);
  return btoa(bin);
}

describe('TuyaEncoder — фильтрация и граничные случаи', () => {
  const converter = new IRConverter();

  it('тайминги ≥ 65535 (MAX_SIGNAL_VALUE) отсеиваются', () => {
    // Строим вход с 3 таймингами: два больших, но валидных для конвертации.
    // Даже если все отфильтрованы, ожидаем внятную ошибку, а не молчаливый краш.
    const input = buildBroadlink([0xffff, 0xffff, 0xffff]);
    expect(() => converter.convert(input)).toThrow(IRCodeError);
    expect(() => converter.convert(input)).toThrow(/All timings filtered/);
  });

  it('пустая последовательность таймингов → IRCodeError "Empty timings list"', () => {
    // Заголовок с length=0, никаких данных: JgAAAA==
    expect(() => converter.convert('JgAAAA==')).toThrow(IRCodeError);
    expect(() => converter.convert('JgAAAA==')).toThrow(/Empty timings/);
  });

  it('микс из валидных и отсеиваемых таймингов сохраняет валидные', () => {
    const input = buildBroadlink([100, 0xffff, 200, 0xffff, 150]);
    const result = converter.convert(input);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('тайминг ровно 65535 (max uint16) НЕ отсеивается', () => {
    // Тестирую границу напрямую в encoder'е: [500, 65535, 500] должен
    // упаковать все три сэмпла, а не два.
    const encoder = new TuyaEncoder();
    const result = encoder.encode([500, 65535, 500]);
    expect(result.length).toBeGreaterThan(0);
    // Обратный маркер: если бы 65535 отбрасывался, вход [500, 500] дал
    // бы КОРОЧЕ результат. Сравним.
    const shorter = encoder.encode([500, 500]);
    expect(result.length).toBeGreaterThan(shorter.length);
  });

  it('тайминги > 65535 отсеиваются', () => {
    const encoder = new TuyaEncoder();
    expect(() => encoder.encode([70000, 80000])).toThrow(IRCodeError);
    expect(() => encoder.encode([70000, 80000])).toThrow(/All timings filtered/);
  });
});
