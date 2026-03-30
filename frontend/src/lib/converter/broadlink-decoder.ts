import { BRDLNK_UNIT } from './constants';
import { IRCodeError } from './errors';
import { base64Decode } from './base64';

export class BroadlinkDecoder {
  private readonly unit = BRDLNK_UNIT;

  decode(command: string): number[] {
    const bytes = this.validateAndDecodeBase64(command);
    const hex = this.bytesToHex(bytes);
    this.validateHexData(hex);
    return this.parseTimings(hex);
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

  private bytesToHex(bytes: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  private validateHexData(hex: string): void {
    if (hex.length < 8) {
      throw new IRCodeError(`Broadlink data too short: ${hex.length} chars`);
    }
    if (isNaN(parseInt(hex.substring(0, 8), 16))) {
      throw new IRCodeError('Invalid hex format in Broadlink header');
    }
  }

  private parseTimings(hex: string): number[] {
    const dec: number[] = [];

    const length = parseInt(hex.substring(6, 8) + hex.substring(4, 6), 16);

    let i = 8;
    while (i < length * 2 + 8) {
      if (i + 2 > hex.length) break;

      let hexValue = hex.substring(i, i + 2);
      if (hexValue === '00') {
        if (i + 6 > hex.length) {
          throw new IRCodeError('Incomplete data reading extended value');
        }
        hexValue = hex.substring(i + 2, i + 4) + hex.substring(i + 4, i + 6);
        i += 4;
      }

      const parsed = parseInt(hexValue, 16);
      if (isNaN(parsed)) {
        throw new IRCodeError(`Invalid hex value: ${hexValue}`);
      }
      dec.push(Math.ceil(parsed / this.unit));
      i += 2;
    }

    return dec;
  }
}
