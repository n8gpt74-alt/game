from datetime import UTC, datetime, timedelta
import hashlib
import hmac
import json
from typing import Any
from urllib.parse import parse_qsl

import jwt
from fastapi import HTTPException, status

from app.config import get_settings


settings = get_settings()


def create_access_token(user_id: int) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def verify_access_token(token: str) -> int:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        sub = payload.get("sub")
        if sub is None:
            raise ValueError("Missing subject")
        return int(sub)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Невалидный токен") from exc


def _build_data_check_string(params: dict[str, str]) -> str:
    pairs = [f"{key}={value}" for key, value in sorted(params.items()) if key != "hash"]
    return "\n".join(pairs)


def validate_telegram_init_data(init_data: str) -> dict[str, Any]:
    if not init_data:
        raise HTTPException(status_code=400, detail="initData обязателен")

    params = dict(parse_qsl(init_data, keep_blank_values=True))
    received_hash = params.get("hash")
    if not received_hash:
        raise HTTPException(status_code=401, detail="Отсутствует hash в initData")
    if not settings.telegram_bot_token:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN не настроен")

    data_check_string = _build_data_check_string(params)
    secret_key = hmac.new(
        b"WebAppData", settings.telegram_bot_token.encode("utf-8"), hashlib.sha256
    ).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calculated_hash, received_hash):
        raise HTTPException(status_code=401, detail="Невалидная подпись initData")

    auth_date_raw = params.get("auth_date")
    if not auth_date_raw:
        raise HTTPException(status_code=401, detail="В initData отсутствует auth_date")

    try:
        auth_date = datetime.fromtimestamp(int(auth_date_raw), tz=UTC)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Некорректный auth_date") from exc

    if datetime.now(UTC) - auth_date > timedelta(seconds=settings.telegram_auth_max_age_seconds):
        raise HTTPException(status_code=401, detail="initData устарел")

    user_raw = params.get("user")
    if not user_raw:
        raise HTTPException(status_code=401, detail="В initData отсутствует user")
    try:
        user_data = json.loads(user_raw)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=401, detail="Не удалось разобрать user в initData") from exc
    if "id" not in user_data:
        raise HTTPException(status_code=401, detail="В user отсутствует id")
    return user_data


def resolve_user_from_init_data(init_data: str) -> int:
    if settings.allow_dev_auth and (not init_data or init_data.startswith("dev_user_id=")):
        if init_data.startswith("dev_user_id="):
            try:
                return int(init_data.split("=", 1)[1])
            except ValueError:
                pass
        return settings.dev_auth_user_id

    user_data = validate_telegram_init_data(init_data)
    return int(user_data["id"])
