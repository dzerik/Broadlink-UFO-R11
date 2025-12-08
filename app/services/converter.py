"""Конвертер IR кодов между форматами Broadlink и UFO-R11."""

import json
import logging
from typing import Any

from .constants import CompressionLevel
from .broadlink import BroadlinkDecoder
from .encoder import TuyaEncoder

logger = logging.getLogger(__name__)


class IRConverter:
    """Конвертер IR кодов между форматами Broadlink и UFO-R11.

    Фасад, объединяющий функциональность декодера Broadlink и
    кодировщика Tuya для удобного преобразования IR кодов.

    Attributes:
        compression_level: Уровень сжатия для выходных данных.

    Example:
        >>> converter = IRConverter()
        >>> result = converter.convert("JgDKAJKQEzQT...")
        >>> print(result)
        'DF8RIhFDAjAG...'

    Note:
        Для работы требуется Python 3.8+ из-за использования
        walrus operator (:=).
    """

    def __init__(self, compression_level: CompressionLevel = CompressionLevel.BALANCED):
        """Инициализирует конвертер."""
        self._decoder = BroadlinkDecoder()
        self._encoder = TuyaEncoder(compression_level)
        logger.debug(f"IRConverter initialized with compression_level={compression_level.name}")

    @property
    def compression_level(self) -> CompressionLevel:
        """Текущий уровень сжатия."""
        return self._encoder.compression_level

    def convert(self, broadlink_code: str) -> str:
        """Конвертирует Broadlink код в формат UFO-R11."""
        logger.debug("Converting Broadlink code to UFO-R11")
        timings = self._decoder.decode(broadlink_code)
        return self._encoder.encode(timings)

    def convert_to_mqtt_payload(self, broadlink_code: str) -> str:
        """Конвертирует и оборачивает в MQTT JSON payload."""
        ir_code = self.convert(broadlink_code)
        return json.dumps({"ir_code_to_send": ir_code})

    def process_smartir_data(
        self,
        data: dict[str, Any],
        wrap_with_ir_code: bool = True
    ) -> dict[str, Any]:
        """Обрабатывает данные SmartIR JSON.

        Args:
            data: Словарь с данными SmartIR.
            wrap_with_ir_code: Оборачивать ли IR код в {"ir_code_to_send": "..."}.

        Returns:
            Обработанный словарь с конвертированными командами.
        """
        result = data.copy()
        result['commands'] = self._process_commands(
            data.get('commands', {}),
            wrap_with_ir_code=wrap_with_ir_code
        )
        result['supportedController'] = 'MQTT'
        result['commandsEncoding'] = 'Raw'
        return result

    def _process_commands(
        self,
        commands: dict,
        path: str = "",
        wrap_with_ir_code: bool = True
    ) -> dict:
        """Рекурсивно обрабатывает команды."""
        processed = {}
        for key, value in commands.items():
            current_path = f"{path}/{key}" if path else key

            if isinstance(value, str):
                logger.debug(f"Processing command: {current_path}")
                ir_code = self.convert(value)
                if wrap_with_ir_code:
                    processed[key] = f'{{"ir_code_to_send": "{ir_code}"}}'
                else:
                    processed[key] = ir_code
            elif isinstance(value, list):
                # Сохраняем списки как есть (operationModes, fanModes и т.д.)
                logger.debug(f"Preserving list: {current_path}")
                processed[key] = value
            elif isinstance(value, dict):
                logger.debug(f"Processing group: {current_path}")
                processed[key] = self._process_commands(
                    value, current_path, wrap_with_ir_code
                )
            else:
                # Числа, boolean и другие примитивы
                processed[key] = value

        return processed
