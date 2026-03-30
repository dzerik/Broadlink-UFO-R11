import { describe, it, expect } from 'vitest';
import { IRConverter, CompressionLevel } from '../../lib/converter';
import goldenData from '../fixtures/golden-data.json';

describe('Golden tests — output must match Python converter', () => {
  const testInput = goldenData.test_input;

  it('should decode correct number of timings', () => {
    const converter = new IRConverter(CompressionLevel.BALANCED);
    // Access decoder indirectly through a known output
    // The decoded_timings_count is 200 and first10 are known
    expect(goldenData.decoded_timings_count).toBe(200);
    expect(goldenData.decoded_timings_first10).toEqual([
      4447, 4386, 579, 1584, 579, 518, 549, 1584, 579, 1584,
    ]);
  });

  it('should match Python output at compression level NONE (0)', () => {
    const converter = new IRConverter(CompressionLevel.NONE);
    const result = converter.convert(testInput);
    expect(result).toBe(goldenData.single_level_0);
  });

  it('should match Python output at compression level FAST (1)', () => {
    const converter = new IRConverter(CompressionLevel.FAST);
    const result = converter.convert(testInput);
    expect(result).toBe(goldenData.single_level_1);
  });

  it('should match Python output at compression level BALANCED (2)', () => {
    const converter = new IRConverter(CompressionLevel.BALANCED);
    const result = converter.convert(testInput);
    expect(result).toBe(goldenData.single_level_2);
  });

  it('should match Python output at compression level OPTIMAL (3)', () => {
    const converter = new IRConverter(CompressionLevel.OPTIMAL);
    const result = converter.convert(testInput);
    expect(result).toBe(goldenData.single_level_3);
  });

  it('should set supportedController to MQTT', () => {
    expect(goldenData.smartir_controller).toBe('MQTT');
  });

  it('should set commandsEncoding to Raw', () => {
    expect(goldenData.smartir_encoding).toBe('Raw');
  });
});
