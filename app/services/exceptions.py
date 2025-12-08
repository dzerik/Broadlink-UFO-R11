"""Исключения для конвертера IR кодов."""


class BTUError(Exception):
    """Базовое исключение для всех ошибок конвертера."""
    pass


class FileValidationError(BTUError):
    """Ошибка валидации файла."""
    pass


class JSONValidationError(BTUError):
    """Ошибка валидации структуры JSON."""
    pass


class IRCodeError(BTUError):
    """Ошибка обработки IR кода."""
    pass


class CompressionError(BTUError):
    """Ошибка сжатия данных."""
    pass
