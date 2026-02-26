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
    stage: Literal["egg", "baby", "child", "teen", "adult", "gold_adult", "dark_adult", "fun_adult", "fire_adult"]
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
    character_courage: int
    character_friendliness: int
    character_energy: int
    character_curiosity: int
    character_tidiness: int


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


class StreakStateOut(BaseModel):
    current: int
    best: int
    last_claim_date: str | None = None


class LiveEventStateOut(BaseModel):
    event_key: str
    title: str
    description: str
    target_points: int
    progress_points: int
    reward_coins: int
    reward_xp: int
    started_at: datetime
    ends_at: datetime
    completed: bool
    claimed: bool


class AchievementStateOut(BaseModel):
    achievement_key: str
    title: str
    description: str
    target: int
    progress: int
    reward_coins: int
    reward_xp: int
    completed: bool
    claimed: bool


class AchievementClaimRequest(BaseModel):
    achievement_key: str


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
    game_type: Literal[
        "count_2_4",
        "sum_4_6",
        "compare",
        "fast_count_6_8",
        "sub_1_5",
        "sequence_next",
        "shape_count",
        "word_problem_lite",
        "ru_letter_sound_pick",
        "ru_first_letter_word",
        "ru_vowel_consonant",
        "ru_missing_letter",
        "memory_pairs",
        "pixel_pattern",
        "food_catcher",
    ]
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


class QuestStepOut(BaseModel):
    index: int
    title: str
    description: str
    target: int
    reward_coins: int
    reward_xp: int
    progress: int
    completed: bool
    claimed: bool
    locked: bool


class QuestOut(BaseModel):
    quest_key: str
    title: str
    description: str
    steps: list[QuestStepOut]
    completed: bool
    claimed: bool


class LeaderboardEntryOut(BaseModel):
    user_id: int
    name: str
    level: int
    coins: int
    rank: int


class QuestClaimRequest(BaseModel):
    quest_key: str
