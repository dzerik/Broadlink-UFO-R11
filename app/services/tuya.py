"""Компрессор данных в формат Tuya Stream."""

import io
import logging
import time
from bisect import bisect

from .constants import CompressionLevel
from .exceptions import CompressionError

logger = logging.getLogger(__name__)


class TuyaCompressor:
    """Компрессор данных в формат Tuya Stream.

    Реализует LZ77-подобный алгоритм сжатия с четырьмя уровнями
    компрессии для оптимального баланса между скоростью и размером.

    Attributes:
        level: Уровень сжатия (CompressionLevel).

    Example:
        >>> compressor = TuyaCompressor(CompressionLevel.BALANCED)
        >>> output = io.BytesIO()
        >>> compressor.compress(output, b'data to compress')
        >>> compressed = output.getvalue()
    """

    WINDOW_SIZE = 2**13  # 8192 bytes
    MAX_LENGTH = 255 + 9  # 264 bytes

    def __init__(self, level: CompressionLevel = CompressionLevel.BALANCED):
        """Инициализирует компрессор."""
        self._level = level
        logger.debug(f"TuyaCompressor initialized with level={level.name}")

    @property
    def level(self) -> CompressionLevel:
        """Текущий уровень сжатия."""
        return self._level

    def compress(self, out: io.BytesIO, data: bytes) -> None:
        """Сжимает данные в формат Tuya Stream."""
        input_size = len(data)
        logger.debug(f"Compression started: input_size={input_size} bytes, level={self._level.name}")
        start_time = time.perf_counter()

        if self._level == CompressionLevel.NONE:
            self._emit_literal_blocks(out, data)
        elif self._level <= CompressionLevel.BALANCED:
            self._compress_greedy(out, data)
        else:
            self._compress_optimal(out, data)

        elapsed = time.perf_counter() - start_time
        output_size = out.tell()
        ratio = output_size / input_size if input_size > 0 else 0
        logger.debug(
            f"Compression finished: output_size={output_size} bytes, "
            f"ratio={ratio:.2%}, elapsed={elapsed:.3f}s"
        )

    def _emit_literal_blocks(self, out: io.BytesIO, data: bytes) -> None:
        """Разбивает данные на литеральные блоки по 32 байта."""
        for i in range(0, len(data), 32):
            self._emit_literal_block(out, data[i:i+32])

    def _emit_literal_block(self, out: io.BytesIO, data: bytes) -> None:
        """Записывает один литеральный блок."""
        length = len(data) - 1
        if not (0 <= length < (1 << 5)):
            raise CompressionError(f"Невалидная длина литерального блока: {length + 1}")
        out.write(bytes([length]))
        out.write(data)

    def _emit_distance_block(self, out: io.BytesIO, length: int, distance: int) -> None:
        """Записывает блок с ссылкой на повторяющиеся данные."""
        distance -= 1
        if not (0 <= distance < (1 << 13)):
            raise CompressionError(f"Невалидная дистанция: {distance + 1}")
        length -= 2
        if length <= 0:
            raise CompressionError(f"Невалидная длина: {length + 2}")

        block = bytearray()
        if length >= 7:
            if length - 7 >= (1 << 8):
                raise CompressionError(f"Длина блока превышает максимум: {length + 2}")
            block.append(length - 7)
            length = 7
        block.insert(0, length << 5 | distance >> 8)
        block.append(distance & 0xFF)
        out.write(block)

    def _compress_greedy(self, out: io.BytesIO, data: bytes) -> None:
        """Жадный алгоритм сжатия (уровни 1-2)."""
        W = self.WINDOW_SIZE
        L = self.MAX_LENGTH
        pos = 0

        distance_candidates = lambda: range(1, min(pos, W) + 1)

        def find_length_for_distance(start: int) -> int:
            length = 0
            limit = min(L, len(data) - pos)
            while length < limit and data[pos + length] == data[start + length]:
                length += 1
            return length

        find_length_candidates = lambda: \
            ((find_length_for_distance(pos - d), d) for d in distance_candidates())
        find_length_cheap = lambda: \
            next((c for c in find_length_candidates() if c[0] >= 3), None)
        find_length_max = lambda: \
            max(find_length_candidates(), key=lambda c: (c[0], -c[1]), default=None)

        if self._level >= CompressionLevel.BALANCED:
            suffixes = []
            next_pos = 0
            key = lambda n: data[n:]
            find_idx = lambda n: bisect(suffixes, key(n), key=key)

            def distance_candidates():
                nonlocal next_pos
                while next_pos <= pos:
                    if len(suffixes) == W:
                        suffixes.pop(find_idx(next_pos - W))
                    suffixes.insert(idx := find_idx(next_pos), next_pos)
                    next_pos += 1
                idxs = (idx+i for i in (+1, -1))
                return (pos - suffixes[i] for i in idxs if 0 <= i < len(suffixes))

        find_length = find_length_cheap if self._level == CompressionLevel.FAST else find_length_max
        block_start = pos = 0

        while pos < len(data):
            if (c := find_length()) and c[0] >= 3:
                self._emit_literal_blocks(out, data[block_start:pos])
                self._emit_distance_block(out, c[0], c[1])
                pos += c[0]
                block_start = pos
            else:
                pos += 1

        self._emit_literal_blocks(out, data[block_start:pos])

    def _compress_optimal(self, out: io.BytesIO, data: bytes) -> None:
        """Оптимальный алгоритм сжатия (уровень 3)."""
        W = self.WINDOW_SIZE
        L = self.MAX_LENGTH

        distance_candidates = lambda: range(1, min(pos, W) + 1)

        def find_length_for_distance(start: int) -> int:
            length = 0
            limit = min(L, len(data) - pos)
            while length < limit and data[pos + length] == data[start + length]:
                length += 1
            return length

        find_length_candidates = lambda: \
            ((find_length_for_distance(pos - d), d) for d in distance_candidates())
        find_length_max = lambda: \
            max(find_length_candidates(), key=lambda c: (c[0], -c[1]), default=None)

        suffixes = []
        next_pos = 0
        key = lambda n: data[n:]
        find_idx = lambda n: bisect(suffixes, key(n), key=key)

        def distance_candidates():
            nonlocal next_pos
            while next_pos <= pos:
                if len(suffixes) == W:
                    suffixes.pop(find_idx(next_pos - W))
                suffixes.insert(idx := find_idx(next_pos), next_pos)
                next_pos += 1
            idxs = (idx+i for i in (+1, -1))
            return (pos - suffixes[i] for i in idxs if 0 <= i < len(suffixes))

        predecessors = [(0, None, None)] + [None] * len(data)

        def put_edge(cost, length, distance):
            npos = pos + length
            cost += predecessors[pos][0]
            current = predecessors[npos]
            if not current or cost < current[0]:
                predecessors[npos] = cost, length, distance

        for pos in range(len(data)):
            if c := find_length_max():
                for l in range(3, c[0] + 1):
                    put_edge(2 if l < 9 else 3, l, c[1])
            for l in range(1, min(32, len(data) - pos) + 1):
                put_edge(1 + l, l, 0)

        blocks = []
        pos = len(data)
        while pos > 0:
            _, length, distance = predecessors[pos]
            pos -= length
            blocks.append((pos, length, distance))

        for pos, length, distance in reversed(blocks):
            if not distance:
                self._emit_literal_block(out, data[pos:pos + length])
            else:
                self._emit_distance_block(out, length, distance)
