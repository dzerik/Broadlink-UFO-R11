"""Кодировщик IR сигналов в формат UFO-R11 (Tuya)."""

import base64
import io
import logging
from struct import pack

from .constants import CompressionLevel, MAX_SIGNAL_VALUE
from .exceptions import BTUError, IRCodeError
from .tuya import TuyaCompressor

logger = logging.getLogger(__name__)


class TuyaEncoder:
    """Кодировщик IR сигналов в формат UFO-R11 (Tuya).

    Преобразует список таймингов IR сигнала в Base64-кодированный
    формат, совместимый с устройствами MOES UFO-R11.

    Attributes:
        compressor: Компрессор Tuya Stream.

    Example:
        >>> encoder = TuyaEncoder()
        >>> result = encoder.encode([100, 200, 100, 200])
        >>> print(result)
        'AwBkAMgAZADIAA=='
    """

    def __init__(self, compression_level: CompressionLevel = CompressionLevel.BALANCED):
        """Инициализирует кодировщик."""
        self._compressor = TuyaCompressor(compression_level)
        logger.debug(f"TuyaEncoder initialized with compression_level={compression_level.name}")

    @property
    def compression_level(self) -> CompressionLevel:
        """Текущий уровень сжатия."""
        return self._compressor.level

    def encode(self, timings: list[int]) -> str:
        """Кодирует тайминги в формат UFO-R11 Base64."""
        logger.debug(f"Encoding {len(timings)} timings to UFO-R11 format")

        if not timings:
            raise IRCodeError("Пустой список таймингов")

        filtered = [t for t in timings if t < MAX_SIGNAL_VALUE]
        filtered_count = len(timings) - len(filtered)
        if filtered_count > 0:
            logger.debug(f"Filtered out {filtered_count} timings > {MAX_SIGNAL_VALUE}")

        if not filtered:
            raise IRCodeError("Все тайминги отфильтрованы")

        try:
            payload = b''.join(pack('<H', t) for t in filtered)
            logger.debug(f"Packed payload: {len(payload)} bytes")

            out = io.BytesIO()
            self._compressor.compress(out, payload)

            result = base64.encodebytes(out.getvalue()).decode('ascii').replace('\n', '')
            logger.debug(f"Encoded result: {len(result)} chars")

            return result
        except BTUError:
            raise
        except Exception as e:
            raise IRCodeError(f"Ошибка кодирования: {e}")
