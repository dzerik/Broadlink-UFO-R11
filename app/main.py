"""FastAPI приложение для конвертера IR кодов."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router
from .core.config import settings

# Настройка логирования
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%H:%M:%S"
)

logger = logging.getLogger(__name__)

# Создание приложения
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="""
## Broadlink to UFO-R11 IR Code Converter

Конвертер ИК-кодов из формата Broadlink Base64 в формат MQTT UFO-R11
для устройств MOES UFO-R11, используемых с SmartIR в Home Assistant.

### Возможности

* **Конвертация одного IR кода** - преобразование отдельных команд
* **Конвертация SmartIR JSON** - пакетная обработка файлов конфигурации
* **Настраиваемое сжатие** - 4 уровня компрессии Tuya Stream

### Уровни сжатия

| Уровень | Описание |
|---------|----------|
| 0 (NONE) | Без сжатия |
| 1 (FAST) | Быстрое сжатие |
| 2 (BALANCED) | Оптимальный баланс (по умолчанию) |
| 3 (OPTIMAL) | Максимальное сжатие |
    """,
    openapi_tags=[
        {"name": "Health", "description": "Проверка состояния сервиса"},
        {"name": "Convert", "description": "Операции конвертации IR кодов"},
    ]
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключение роутов
app.include_router(router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Событие запуска приложения."""
    logger.info(f"Starting {settings.app_name} v{settings.version}")
    logger.info(f"CORS origins: {settings.cors_origins}")
    logger.info(f"Debug mode: {settings.debug}")


@app.on_event("shutdown")
async def shutdown_event():
    """Событие остановки приложения."""
    logger.info("Shutting down application")


# Для запуска через uvicorn напрямую
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )
