import { CompressionLevel } from './constants';
import { BroadlinkDecoder } from './broadlink-decoder';
import { TuyaEncoder } from './tuya-encoder';
import { processSmartIRData, type SmartIRData } from './smartir';

export { CompressionLevel } from './constants';
export { BTUError, IRCodeError, CompressionError, JSONValidationError } from './errors';
export type { SmartIRData } from './smartir';

export class IRConverter {
  private readonly decoder = new BroadlinkDecoder();
  private readonly encoder: TuyaEncoder;

  constructor(
    compressionLevel: CompressionLevel = CompressionLevel.BALANCED
  ) {
    this.encoder = new TuyaEncoder(compressionLevel);
  }

  convert(broadlinkCode: string): string {
    const timings = this.decoder.decode(broadlinkCode);
    return this.encoder.encode(timings);
  }

  convertToMqttPayload(broadlinkCode: string): string {
    const irCode = this.convert(broadlinkCode);
    return JSON.stringify({ ir_code_to_send: irCode });
  }

  processSmartIRData(
    data: SmartIRData,
    wrapWithIrCode: boolean = true
  ): SmartIRData {
    return processSmartIRData(data, this, wrapWithIrCode);
  }
}
