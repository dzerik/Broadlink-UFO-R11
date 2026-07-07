import { CompressionLevel } from './constants';
import { BroadlinkDecoder } from './broadlink-decoder';
import { TuyaEncoder } from './tuya-encoder';
import { processSmartIRData, type SmartIRData } from './smartir';

export { CompressionLevel, MAX_FILE_SIZE } from './constants';
export { BTUError, IRCodeError, CompressionError } from './errors';
export { isSmartIRData, countSmartIRCommands } from './smartir';
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

  processSmartIRData(
    data: SmartIRData,
    wrapWithIrCode: boolean = true
  ): SmartIRData {
    return processSmartIRData(data, this, wrapWithIrCode);
  }
}
