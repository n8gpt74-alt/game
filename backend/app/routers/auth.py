from fastapi import APIRouter

from app.auth import create_access_token, resolve_user_from_init_data
from app.schemas import TelegramAuthRequest, TelegramAuthResponse


router = APIRouter(tags=["auth"])


@router.post("/auth/telegram", response_model=TelegramAuthResponse)
def auth_telegram(payload: TelegramAuthRequest) -> TelegramAuthResponse:
    user_id = resolve_user_from_init_data(payload.init_data)
    token = create_access_token(user_id=user_id)
    return TelegramAuthResponse(access_token=token)
