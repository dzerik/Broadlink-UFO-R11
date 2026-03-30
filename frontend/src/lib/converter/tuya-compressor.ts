import { CompressionLevel } from './constants';
import { CompressionError } from './errors';

/** Growable byte buffer (replacement for Python's BytesIO). */
class ByteWriter {
  private chunks: number[] = [];

  write(data: Uint8Array | number[]): void {
    for (let i = 0; i < data.length; i++) {
      this.chunks.push(data[i]);
    }
  }

  writeByte(b: number): void {
    this.chunks.push(b & 0xff);
  }

  toUint8Array(): Uint8Array {
    return new Uint8Array(this.chunks);
  }

  get length(): number {
    return this.chunks.length;
  }
}

/** Compare two Uint8Array slices lexicographically. */
function compareSlices(
  data: Uint8Array,
  a: number,
  b: number,
  len: number
): number {
  for (let i = 0; i < len; i++) {
    const ai = a + i < data.length ? data[a + i] : -1;
    const bi = b + i < data.length ? data[b + i] : -1;
    if (ai !== bi) return ai - bi;
  }
  return 0;
}

/**
 * Binary search for insertion point (equivalent to Python's bisect.bisect).
 * Uses suffix comparison via `key` function pattern from the Python code:
 * `key = lambda n: data[n:]` — compares suffixes starting at position n.
 */
function bisectSuffix(
  suffixes: number[],
  target: number,
  data: Uint8Array
): number {
  let lo = 0;
  let hi = suffixes.length;
  const maxCmp = data.length;

  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    // Compare data[suffixes[mid]:] with data[target:]
    const cmp = compareSlices(data, suffixes[mid], target, maxCmp);
    if (cmp < 0) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  return lo;
}

export class TuyaCompressor {
  static readonly WINDOW_SIZE = 1 << 13; // 8192
  static readonly MAX_LENGTH = 255 + 9;  // 264

  private readonly level: CompressionLevel;

  constructor(level: CompressionLevel = CompressionLevel.BALANCED) {
    this.level = level;
  }

  compress(data: Uint8Array): Uint8Array {
    const out = new ByteWriter();

    if (this.level === CompressionLevel.NONE) {
      this.emitLiteralBlocks(out, data, 0, data.length);
    } else if (this.level <= CompressionLevel.BALANCED) {
      this.compressGreedy(out, data);
    } else {
      this.compressOptimal(out, data);
    }

    return out.toUint8Array();
  }

  private emitLiteralBlocks(
    out: ByteWriter,
    data: Uint8Array,
    start: number,
    end: number
  ): void {
    for (let i = start; i < end; i += 32) {
      this.emitLiteralBlock(out, data, i, Math.min(i + 32, end));
    }
  }

  private emitLiteralBlock(
    out: ByteWriter,
    data: Uint8Array,
    start: number,
    end: number
  ): void {
    const len = end - start;
    if (len === 0) return;
    const lengthField = len - 1;
    if (lengthField < 0 || lengthField >= (1 << 5)) {
      throw new CompressionError(`Invalid literal block length: ${len}`);
    }
    out.writeByte(lengthField);
    out.write(data.subarray(start, end));
  }

  private emitDistanceBlock(
    out: ByteWriter,
    length: number,
    distance: number
  ): void {
    distance -= 1;
    if (distance < 0 || distance >= (1 << 13)) {
      throw new CompressionError(`Invalid distance: ${distance + 1}`);
    }
    length -= 2;
    if (length <= 0) {
      throw new CompressionError(`Invalid length: ${length + 2}`);
    }

    // Build block bytes in the same order as Python:
    // Python builds bytearray, optionally appends extra length, then inserts header at [0], then appends low distance
    const block: number[] = [];
    let encodedLength = length;
    if (encodedLength >= 7) {
      if (encodedLength - 7 >= (1 << 8)) {
        throw new CompressionError(`Block length exceeds maximum: ${length + 2}`);
      }
      block.push(encodedLength - 7);  // extra length byte
      encodedLength = 7;
    }
    // Insert header at position 0
    block.unshift((encodedLength << 5) | (distance >> 8));
    // Append low byte of distance
    block.push(distance & 0xff);
    out.write(block);
  }

  private findLengthForDistance(
    data: Uint8Array,
    pos: number,
    start: number
  ): number {
    let length = 0;
    const limit = Math.min(TuyaCompressor.MAX_LENGTH, data.length - pos);
    while (length < limit && data[pos + length] === data[start + length]) {
      length++;
    }
    return length;
  }

  private compressGreedy(out: ByteWriter, data: Uint8Array): void {
    const W = TuyaCompressor.WINDOW_SIZE;
    let pos = 0;
    let blockStart = 0;

    // Suffix array state for BALANCED level
    const suffixes: number[] = [];
    let nextPos = 0;

    const findIdx = (n: number): number => bisectSuffix(suffixes, n, data);

    const updateSuffixes = (currentPos: number): number => {
      while (nextPos <= currentPos) {
        if (suffixes.length === W) {
          suffixes.splice(findIdx(nextPos - W), 1);
        }
        const idx = findIdx(nextPos);
        suffixes.splice(idx, 1, ...[]); // placeholder
        suffixes.splice(idx, 0, nextPos);
        nextPos++;
      }
      // Return the index where currentPos was just inserted
      return findIdx(currentPos) - 1; // idx of currentPos in suffixes
    };

    while (pos < data.length) {
      let bestLength = 0;
      let bestDistance = 0;

      if (this.level === CompressionLevel.FAST) {
        // Linear scan, first match >= 3
        const maxDist = Math.min(pos, W);
        for (let d = 1; d <= maxDist; d++) {
          const len = this.findLengthForDistance(data, pos, pos - d);
          if (len >= 3) {
            bestLength = len;
            bestDistance = d;
            break;
          }
        }
      } else {
        // BALANCED: suffix array, check two nearest neighbors
        // Update suffix array up to current position
        while (nextPos <= pos) {
          if (suffixes.length === W) {
            suffixes.splice(findIdx(nextPos - W), 1);
          }
          const idx = findIdx(nextPos);
          suffixes.splice(idx, 0, nextPos);
          nextPos++;
        }

        // Find the index of `pos` in suffixes
        const posIdx = suffixes.indexOf(pos);
        // Check neighbors at posIdx+1 and posIdx-1
        const neighbors = [posIdx + 1, posIdx - 1];
        for (const ni of neighbors) {
          if (ni >= 0 && ni < suffixes.length) {
            const d = pos - suffixes[ni];
            if (d > 0 && d <= W) {
              const len = this.findLengthForDistance(data, pos, pos - d);
              if (len > bestLength || (len === bestLength && d < bestDistance)) {
                bestLength = len;
                bestDistance = d;
              }
            }
          }
        }
      }

      if (bestLength >= 3) {
        this.emitLiteralBlocks(out, data, blockStart, pos);
        this.emitDistanceBlock(out, bestLength, bestDistance);
        pos += bestLength;
        blockStart = pos;
      } else {
        pos++;
      }
    }

    this.emitLiteralBlocks(out, data, blockStart, pos);
  }

  private compressOptimal(out: ByteWriter, data: Uint8Array): void {
    const W = TuyaCompressor.WINDOW_SIZE;

    // Suffix array for distance candidates
    const suffixes: number[] = [];
    let nextPos = 0;
    const findIdx = (n: number): number => bisectSuffix(suffixes, n, data);

    // DP: predecessors[i] = [cost, length, distance] or null
    const predecessors: (readonly [number, number, number] | null)[] =
      new Array(data.length + 1).fill(null);
    predecessors[0] = [0, 0, 0] as const;

    const putEdge = (pos: number, cost: number, length: number, distance: number): void => {
      const npos = pos + length;
      const totalCost = cost + predecessors[pos]![0];
      const current = predecessors[npos];
      if (!current || totalCost < current[0]) {
        predecessors[npos] = [totalCost, length, distance] as const;
      }
    };

    for (let pos = 0; pos < data.length; pos++) {
      if (predecessors[pos] === null) continue;

      // Update suffix array
      while (nextPos <= pos) {
        if (suffixes.length === W) {
          suffixes.splice(findIdx(nextPos - W), 1);
        }
        const idx = findIdx(nextPos);
        suffixes.splice(idx, 0, nextPos);
        nextPos++;
      }

      // Find best match via suffix array neighbors
      const posIdx = suffixes.indexOf(pos);
      let bestLen = 0;
      let bestDist = 0;
      const neighbors = [posIdx + 1, posIdx - 1];
      for (const ni of neighbors) {
        if (ni >= 0 && ni < suffixes.length) {
          const d = pos - suffixes[ni];
          if (d > 0 && d <= W) {
            const len = this.findLengthForDistance(data, pos, pos - d);
            if (len > bestLen || (len === bestLen && d < bestDist)) {
              bestLen = len;
              bestDist = d;
            }
          }
        }
      }

      // Distance edges
      if (bestLen >= 3 && bestDist > 0) {
        for (let l = 3; l <= bestLen; l++) {
          putEdge(pos, l < 9 ? 2 : 3, l, bestDist);
        }
      }

      // Literal edges
      const maxLit = Math.min(32, data.length - pos);
      for (let l = 1; l <= maxLit; l++) {
        putEdge(pos, 1 + l, l, 0);
      }
    }

    // Backtrack
    const blocks: [number, number, number][] = [];
    let pos = data.length;
    while (pos > 0) {
      const pred = predecessors[pos]!;
      const length = pred[1];
      const distance = pred[2];
      pos -= length;
      blocks.push([pos, length, distance]);
    }

    // Emit blocks in forward order
    for (let i = blocks.length - 1; i >= 0; i--) {
      const [bpos, length, distance] = blocks[i];
      if (!distance) {
        this.emitLiteralBlock(out, data, bpos, bpos + length);
      } else {
        this.emitDistanceBlock(out, length, distance);
      }
    }
  }
}
