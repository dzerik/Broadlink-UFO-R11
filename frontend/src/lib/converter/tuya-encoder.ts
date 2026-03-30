import { CompressionLevel, MAX_SIGNAL_VALUE } from './constants';
import { IRCodeError } from './errors';
import { base64Encode } from './base64';
import { TuyaCompressor } from './tuya-compressor';

export class TuyaEncoder {
  private readonly compressor: TuyaCompressor;

  constructor(compressionLevel: CompressionLevel = CompressionLevel.BALANCED) {
    this.compressor = new TuyaCompressor(compressionLevel);
  }

  encode(timings: number[]): string {
    if (!timings.length) {
      throw new IRCodeError('Empty timings list');
    }

    const filtered = timings.filter(t => t < MAX_SIGNAL_VALUE);
    if (!filtered.length) {
      throw new IRCodeError('All timings filtered out');
    }

    // Pack as uint16 little-endian
    const buffer = new ArrayBuffer(filtered.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < filtered.length; i++) {
      view.setUint16(i * 2, filtered[i], true); // true = little-endian
    }

    const payload = new Uint8Array(buffer);
    const compressed = this.compressor.compress(payload);
    return base64Encode(compressed);
  }
}
