from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.auth import verify_access_token


bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user_id(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> int:
    return verify_access_token(credentials.credentials)
