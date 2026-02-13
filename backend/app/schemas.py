from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TelegramAuthRequest(BaseModel):
    init_data: str = Field(default="")


class TelegramAuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PetStateOut(BaseModel):
    user_id: int
    name: str
    stage: Literal["baby", "child", "teen", "adult"]
    stage_title: str
    level: int
    xp: int
    xp_to_next_level: int
    coins: int
    intelligence: int
    crystals: int
    hunger: int
    hygiene: int
    happiness: int
    health: int
    energy: int
    behavior_state: str
    is_lonely: bool
    last_tick_at: datetime


class EventLogOut(BaseModel):
    id: int
    action: str
    payload: dict
    created_at: datetime


class RewardOut(BaseModel):
    xp: int
    coins: int
    intelligence: int
    crystals: int
    level_up: bool
    levels: list[int]
    stage_changed: bool
    stage_before: str
    stage_after: str
    unlocks: list[str]


class DailyTaskOut(BaseModel):
    task_key: str
    title: str
    target: int
    progress: int
    completed: bool


class DailyStateOut(BaseModel):
    tasks: list[DailyTaskOut]
    login_bonus_claimed: bool
    chest_claimed: bool
    all_completed: bool


class ActionResponse(BaseModel):
    state: PetStateOut
    event: EventLogOut
    reward: RewardOut
    daily: DailyStateOut
    notifications: list[str]


class InventoryOut(BaseModel):
    item_key: str
    quantity: int


class MinigameResultRequest(BaseModel):
    game_type: Literal["count_2_4", "sum_4_6", "compare", "fast_count_6_8"]
    score: int = Field(ge=0, le=5)
    elapsed_ms: int = Field(ge=500, le=120000)
    source: Literal["math", "3d"] = "math"


class MinigameResultResponse(BaseModel):
    state: PetStateOut
    event: EventLogOut
    reward: RewardOut
    daily: DailyStateOut
    notifications: list[str]


class ShopItemOut(BaseModel):
    item_key: str
    title: str
    section: str
    base_price: int
    price: int
    level_required: int
    owned: bool


class ShopCatalogOut(BaseModel):
    items: list[ShopItemOut]


class ShopBuyRequest(BaseModel):
    item_key: str


class ShopBuyResponse(BaseModel):
    state: PetStateOut
    event: EventLogOut
    item_key: str
    price: int
