"""Декодер IR кодов из формата Broadlink."""

import base64
import logging
from math import ceil

from .constants import BRDLNK_UNIT
from .exceptions import IRCodeError

logger = logging.getLogger(__name__)


class BroadlinkDecoder:
    """Декодер IR кодов из формата Broadlink.

    Преобразует Base64-кодированные IR коды Broadlink в список
    таймингов сигнала для дальнейшей обработки.

    Example:
        >>> decoder = BroadlinkDecoder()
        >>> timings = decoder.decode("JgDKAJKQEzQT...")
        >>> print(len(timings))
        150
    """

    UNIT = BRDLNK_UNIT  # 32.84ms units

    def decode(self, command: str) -> list[int]:
        """Декодирует Broadlink Base64 в список таймингов."""
        logger.debug(f"Decoding Broadlink command: length={len(command)} chars")

        decoded_bytes = self._validate_and_decode_base64(command)
        logger.debug(f"Base64 decoded: {len(decoded_bytes)} bytes")

        hex_data = decoded_bytes.hex()
        self._validate_hex_data(hex_data)

        timings = self._parse_timings(hex_data)
        logger.debug(f"Parsed {len(timings)} timings from Broadlink data")

        return timings

    def _validate_and_decode_base64(self, value: str) -> bytes:
        """Валидирует и декодирует Base64.

        Args:
            value: Строка в формате Base64.

        Returns:
            Декодированные байты.

        Raises:
            IRCodeError: Если строка не является валидным Base64.
        """
        if not value:
            raise IRCodeError("Пустая строка Base64")
        try:
            padded = value + "=" * ((4 - len(value) % 4) % 4)
            return base64.b64decode(padded, validate=True)
        except Exception as e:
            raise IRCodeError(f"Невалидный Base64: {e}")

    def _validate_hex_data(self, hex_string: str) -> None:
        """Валидирует hex-строку Broadlink данных."""
        if len(hex_string) < 8:
            raise IRCodeError(
                f"Данные Broadlink слишком короткие: {len(hex_string)} символов"
            )
        try:
            int(hex_string[:8], 16)
        except ValueError:
            raise IRCodeError("Невалидный hex формат в заголовке Broadlink")

    def _parse_timings(self, hex_string: str) -> list[int]:
        """Парсит hex-строку в список таймингов."""
        dec = []

        try:
            length = int(hex_string[6:8] + hex_string[4:6], 16)
        except ValueError:
            raise IRCodeError("Невозможно прочитать длину payload")

        i = 8
        while i < length * 2 + 8:
            if i + 2 > len(hex_string):
                break

            hex_value = hex_string[i:i+2]
            if hex_value == "00":
                if i + 6 > len(hex_string):
                    raise IRCodeError("Неполные данные при чтении extended value")
                hex_value = hex_string[i+2:i+4] + hex_string[i+4:i+6]
                i += 4

            try:
                dec.append(ceil(int(hex_value, 16) / self.UNIT))
            except ValueError:
                raise IRCodeError(f"Невалидный hex value: {hex_value}")
            i += 2

        return dec
