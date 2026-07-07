import { BRDLNK_UNIT } from './constants';
import { IRCodeError } from './errors';
import { base64Decode } from './base64';

export class BroadlinkDecoder {
  private readonly unit = BRDLNK_UNIT;

  decode(command: string): number[] {
    const bytes = this.validateAndDecodeBase64(command);
    this.validateHeader(bytes);
    return this.parseTimings(bytes);
  }

  private validateAndDecodeBase64(value: string): Uint8Array {
    if (!value) {
      throw new IRCodeError('Empty Base64 string');
    }
    try {
      return base64Decode(value);
    } catch {
      throw new IRCodeError('Invalid Base64');
    }
  }

  private validateHeader(bytes: Uint8Array): void {
    // Заголовок Broadlink: [type, repeat, len_lo, len_hi], минимум 4 байта.
    if (bytes.length < 4) {
      throw new IRCodeError(`Broadlink data too short: ${bytes.length} bytes`);
    }
  }

  private parseTimings(bytes: Uint8Array): number[] {
    const dec: number[] = [];
    // Длина данных в байтах — uint16 little-endian на позициях [2..4].
    const length = bytes[2] | (bytes[3] << 8);
    const end = Math.min(4 + length, bytes.length);

    let i = 4;
    while (i < end) {
      let value: number;
      if (bytes[i] === 0) {
        // Extended-маркер: 0x00, затем uint16 big-endian.
        if (i + 3 > bytes.length) {
          throw new IRCodeError('Incomplete data reading extended value');
        }
        value = (bytes[i + 1] << 8) | bytes[i + 2];
        i += 3;
      } else {
        value = bytes[i];
        i += 1;
      }
      dec.push(Math.ceil(value / this.unit));
    }

    return dec;
  }
}
