"""Конфигурация приложения."""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Настройки приложения.

    Attributes:
        app_name: Название приложения.
        version: Версия приложения.
        debug: Режим отладки.
        cors_origins: Разрешённые источники для CORS.
    """
    app_name: str = "Broadlink to UFO-R11 Converter"
    version: str = "1.0.0"
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    model_config = {
        "env_prefix": "BTU_",
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()
