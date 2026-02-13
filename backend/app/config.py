from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Единорог Тамагочи API"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 1440

    database_url: str = "postgresql+psycopg2://user:pass@db:5432/tamagotchi"
    redis_url: str = "redis://redis:6379/0"
    celery_broker_url: str = "redis://redis:6379/0"
    celery_result_backend: str = "redis://redis:6379/1"

    telegram_bot_token: str = ""
    telegram_auth_max_age_seconds: int = 86400
    allow_dev_auth: bool = False
    dev_auth_user_id: int = 10001

    decay_cap_seconds: int = 21600
    cors_allow_origins: str = (
        "http://localhost,http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,http://localhost:4280,http://127.0.0.1:4280,"
        "https://t.me,https://web.telegram.org"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
