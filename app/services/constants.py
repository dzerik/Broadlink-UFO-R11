"""Константы и перечисления для конвертера."""

from enum import IntEnum


class CompressionLevel(IntEnum):
    """Уровни сжатия Tuya Stream.

    Attributes:
        NONE: Без сжатия (3.1% overhead).
        FAST: Жадный алгоритм, первая найденная пара (линейный).
        BALANCED: Жадный алгоритм, лучшая пара (по умолчанию).
        OPTIMAL: Оптимальное сжатие (O(n³)).
    """
    NONE = 0
    FAST = 1
    BALANCED = 2
    OPTIMAL = 3


# Единица времени Broadlink (~0.0328 мс)
BRDLNK_UNIT = 269 / 8192

# Максимальный размер файла (50 MB)
MAX_FILE_SIZE = 50 * 1024 * 1024

# Поддерживаемые расширения файлов
SUPPORTED_EXTENSIONS = {'.json'}

# Максимальное значение сигнала (uint16)
MAX_SIGNAL_VALUE = 65535
