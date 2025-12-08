"""API endpoints для конвертера IR кодов."""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, status

from ..core.config import settings
from ..models.schemas import (
    ConvertRequest,
    ConvertResponse,
    FileConvertRequest,
    FileConvertResponse,
    HealthResponse,
    ErrorResponse,
)
from ..services import IRConverter, CompressionLevel, BTUError, IRCodeError

logger = logging.getLogger(__name__)

router = APIRouter()


def _get_compression_level(level: int) -> CompressionLevel:
    """Преобразует int в CompressionLevel."""
    return CompressionLevel(level)


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Проверка здоровья сервиса",
    tags=["Health"]
)
async def health_check() -> HealthResponse:
    """Проверяет работоспособность сервиса."""
    return HealthResponse(status="ok", version=settings.version)


@router.post(
    "/convert",
    response_model=ConvertResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Ошибка валидации"},
        422: {"model": ErrorResponse, "description": "Ошибка конвертации"}
    },
    summary="Конвертация одного IR кода",
    tags=["Convert"]
)
async def convert_single(request: ConvertRequest) -> ConvertResponse:
    """Конвертирует один IR код из формата Broadlink в UFO-R11.

    Args:
        request: Запрос с IR кодом и параметрами.

    Returns:
        Конвертированный IR код и MQTT payload.

    Raises:
        HTTPException: При ошибке конвертации.
    """
    try:
        compression_level = _get_compression_level(request.compression_level)
        converter = IRConverter(compression_level)

        ir_code = converter.convert(request.command)
        mqtt_payload = converter.convert_to_mqtt_payload(request.command)

        logger.info(f"Converted IR code: {len(request.command)} -> {len(ir_code)} chars")

        return ConvertResponse(
            ir_code=ir_code,
            mqtt_payload=mqtt_payload,
            original_length=len(request.command),
            result_length=len(ir_code)
        )
    except IRCodeError as e:
        logger.warning(f"IR code error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except BTUError as e:
        logger.error(f"BTU error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


@router.post(
    "/convert/file",
    response_model=FileConvertResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Ошибка валидации"},
        422: {"model": ErrorResponse, "description": "Ошибка конвертации"}
    },
    summary="Конвертация SmartIR JSON файла",
    tags=["Convert"]
)
async def convert_file(request: FileConvertRequest) -> FileConvertResponse:
    """Конвертирует SmartIR JSON с IR кодами.

    Args:
        request: Запрос с JSON данными SmartIR.

    Returns:
        Конвертированные JSON данные.

    Raises:
        HTTPException: При ошибке конвертации.
    """
    try:
        compression_level = _get_compression_level(request.compression_level)
        converter = IRConverter(compression_level)

        result = converter.process_smartir_data(
            request.content,
            wrap_with_ir_code=request.wrap_with_ir_code
        )
        commands_count = _count_commands(result.get('commands', {}))

        logger.info(f"Converted SmartIR file: {commands_count} commands processed")

        return FileConvertResponse(
            content=result,
            commands_processed=commands_count
        )
    except IRCodeError as e:
        logger.warning(f"IR code error: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except BTUError as e:
        logger.error(f"BTU error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.exception(f"Unexpected error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )


def _count_commands(commands: dict[str, Any], count: int = 0) -> int:
    """Рекурсивно подсчитывает количество команд."""
    for value in commands.values():
        if isinstance(value, str):
            count += 1
        elif isinstance(value, dict):
            count = _count_commands(value, count)
    return count
