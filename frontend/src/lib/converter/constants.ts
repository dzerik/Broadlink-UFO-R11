export enum CompressionLevel {
  NONE = 0,
  FAST = 1,
  BALANCED = 2,
  OPTIMAL = 3,
}

/** Broadlink timing unit (~0.0328 ms) */
export const BRDLNK_UNIT = 269 / 8192;

/** Maximum signal value (uint16 max) */
export const MAX_SIGNAL_VALUE = 65535;

/** Maximum file size (50 MB) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;
