"""Pydantic модели для API."""

from enum import IntEnum
from typing import Any, Optional

from pydantic import BaseModel, Field


class CompressionLevelEnum(IntEnum):
    """Уровни сжатия для API."""
    NONE = 0
    FAST = 1
    BALANCED = 2
    OPTIMAL = 3


class ConvertRequest(BaseModel):
    """Запрос на конвертацию одного IR кода.

    Attributes:
        command: IR код в формате Broadlink Base64.
        compression_level: Уровень сжатия (по умолчанию BALANCED).

    Example:
        >>> request = ConvertRequest(command="JgDKAJKQEzQT...")
    """
    command: str = Field(
        ...,
        description="IR код в формате Broadlink Base64",
        min_length=1,
        examples=["JgDKAJKQEzQTERI0EzQTERI0EzQT"]
    )
    compression_level: CompressionLevelEnum = Field(
        default=CompressionLevelEnum.BALANCED,
        description="Уровень сжатия Tuya Stream"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "command": "JgDKAJKQEzQTERI0EzQTERI0EzQT",
                    "compression_level": 2
                }
            ]
        }
    }


class ConvertResponse(BaseModel):
    """Ответ с конвертированным IR кодом.

    Attributes:
        ir_code: Конвертированный IR код в формате UFO-R11 Base64.
        mqtt_payload: JSON payload для MQTT.
        original_length: Длина оригинального кода.
        result_length: Длина результата.
    """
    ir_code: str = Field(..., description="IR код в формате UFO-R11 Base64")
    mqtt_payload: str = Field(..., description="JSON payload для MQTT")
    original_length: int = Field(..., description="Длина оригинального кода")
    result_length: int = Field(..., description="Длина результата")


class FileConvertRequest(BaseModel):
    """Запрос на конвертацию SmartIR JSON.

    Attributes:
        content: JSON данные SmartIR.
        compression_level: Уровень сжатия.
        wrap_with_ir_code: Оборачивать ли результат в {"ir_code_to_send": "..."}.
    """
    content: dict[str, Any] = Field(
        ...,
        description="JSON данные SmartIR"
    )
    compression_level: CompressionLevelEnum = Field(
        default=CompressionLevelEnum.BALANCED,
        description="Уровень сжатия Tuya Stream"
    )
    wrap_with_ir_code: bool = Field(
        default=True,
        description="Оборачивать результат в JSON с ключом ir_code_to_send"
    )


class FileConvertResponse(BaseModel):
    """Ответ с конвертированным SmartIR JSON.

    Attributes:
        content: Конвертированные JSON данные.
        commands_processed: Количество обработанных команд.
    """
    content: dict[str, Any] = Field(..., description="Конвертированные JSON данные")
    commands_processed: int = Field(..., description="Количество обработанных команд")


class HealthResponse(BaseModel):
    """Ответ проверки здоровья сервиса."""
    status: str = Field(default="ok", description="Статус сервиса")
    version: str = Field(..., description="Версия приложения")


class ErrorResponse(BaseModel):
    """Ответ с ошибкой.

    Attributes:
        detail: Описание ошибки.
        error_type: Тип ошибки.
    """
    detail: str = Field(..., description="Описание ошибки")
    error_type: Optional[str] = Field(None, description="Тип ошибки")

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "detail": "Невалидный Base64",
                    "error_type": "IRCodeError"
                }
            ]
        }
    }
