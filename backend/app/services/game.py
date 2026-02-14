from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import DailyProgress, EventLog, Inventory, NotificationSettings, PetState, Reward
from app.services.daily_tasks import (
    DailyReward,
    all_tasks_completed,
    claim_daily_chest,
    claim_login_bonus,
    ensure_today_progress,
    increment_task,
    read_tasks,
)
from app.services.economy import apply_progress, stage_title, опыт_до_следующего_уровня
from app.services.pet_ai import is_absent_more_than_24h, определить_состояние_питомца
from app.services.shop import CATALOG, find_item, price_for_level
from app.services.simulation import ActionResult, apply_action, apply_time_decay


settings = get_settings()

ACTION_REWARDS: dict[str, dict[str, int]] = {
    "feed": {"xp": 5, "coins": 2, "intelligence": 0, "crystals": 0},
    "wash": {"xp": 5, "coins": 2, "intelligence": 0, "crystals": 0},
    "play": {"xp": 10, "coins": 5, "intelligence": 0, "crystals": 0},
    "heal": {"xp": 7, "coins": 3, "intelligence": 0, "crystals": 0},
    "chat": {"xp": 4, "coins": 1, "intelligence": 0, "crystals": 0},
    "sleep": {"xp": 10, "coins": 100, "intelligence": 0, "crystals": 0},  # Большая награда за полноценный сон
    "clean": {"xp": 3, "coins": 5, "intelligence": 0, "crystals": 0},  # Награда за уборку
}

TASK_BY_ACTION = {
    "feed": "feed_count",
    "play": "play_count",
}


@dataclass
class ServiceReward:
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


@dataclass
class ActionExecution:
    pet: PetState
    event: EventLog
    reward: ServiceReward
    notifications: list[str]


@dataclass
class DailyExecution:
    pet: PetState
    event: EventLog
    reward: ServiceReward
    daily: dict[str, Any]
    notifications: list[str]


@dataclass
class ShopExecution:
    pet: PetState
    event: EventLog
    item_key: str
    price: int


def _now() -> datetime:
    return datetime.now(UTC)


def _clamp_stat(value: int) -> int:
    return max(0, min(100, int(value)))


def ensure_pet_state(db: Session, user_id: int) -> PetState:
    pet = db.execute(select(PetState).where(PetState.user_id == user_id)).scalar_one_or_none()
    if pet:
        return pet

    pet = PetState(
        user_id=user_id,
        name="Единорог",
        stage="baby",
        level=1,
        xp=0,
        coins=1000,  # Много монет для тестирования
        intelligence=0,
        crystals=0,
        behavior_state="Спокойный",
    )
    db.add(pet)
    # Стартовые предметы - базовый набор для начала игры
    db.add(Inventory(user_id=user_id, item_key="food_apple", quantity=8))
    db.add(Inventory(user_id=user_id, item_key="food_carrot", quantity=5))
    db.add(Inventory(user_id=user_id, item_key="wash_soap", quantity=5))
    db.add(Inventory(user_id=user_id, item_key="medicine_bandage", quantity=3))
    db.add(Inventory(user_id=user_id, item_key="toy_ball", quantity=3))
    db.add(NotificationSettings(user_id=user_id))
    db.commit()
    db.refresh(pet)
    return pet


def _upsert_inventory(db: Session, user_id: int, item_key: str, qty_delta: int) -> None:
    row = db.execute(
        select(Inventory).where(Inventory.user_id == user_id, Inventory.item_key == item_key)
    ).scalar_one_or_none()
    if row is None:
        row = Inventory(user_id=user_id, item_key=item_key, quantity=max(0, qty_delta))
        db.add(row)
    else:
        row.quantity = max(0, row.quantity + qty_delta)
    db.flush()


def _build_daily_payload(progress: DailyProgress) -> dict[str, Any]:
    tasks = read_tasks(progress)
    return {
        "tasks": tasks,
        "login_bonus_claimed": progress.login_bonus_claimed,
        "chest_claimed": progress.chest_claimed,
        "all_completed": all_tasks_completed(tasks),
    }


def _record_event(db: Session, user_id: int, action: str, payload: dict[str, Any]) -> EventLog:
    row = EventLog(user_id=user_id, action=action, payload=payload)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def _update_behavior_state(pet: PetState) -> None:
    pet.behavior_state = определить_состояние_питомца(
        hunger=pet.hunger,
        hygiene=pet.hygiene,
        happiness=pet.happiness,
        health=pet.health,
        energy=pet.energy,
    )


def _apply_progress_for_pet(
    db: Session,
    pet: PetState,
    *,
    base_xp: int,
    base_coins: int,
    base_intelligence: int = 0,
    base_crystals: int = 0,
) -> ServiceReward:
    next_xp, next_level, next_stage, coins_gain, intelligence_gain, progress = apply_progress(
        xp=pet.xp,
        level=pet.level,
        stage=pet.stage,
        intelligence=pet.intelligence,
        base_xp=base_xp,
        base_coins=base_coins,
        base_intelligence=base_intelligence,
        base_crystals=base_crystals,
    )
    pet.xp = next_xp
    pet.level = next_level
    pet.stage = next_stage
    pet.coins += coins_gain
    pet.intelligence += intelligence_gain
    pet.crystals += progress.crystals_gained

    unlocks: list[str] = []
    for level_gained in progress.levels_gained:
        bonus_coins = 12 + level_gained * 2
        pet.coins += bonus_coins
        decor_key = f"украшение_уровень_{level_gained}"
        _upsert_inventory(db, pet.user_id, decor_key, 1)
        unlocks.append(decor_key)

    return ServiceReward(
        xp=progress.xp_gained,
        coins=progress.coins_gained,
        intelligence=progress.intelligence_gained,
        crystals=progress.crystals_gained,
        level_up=len(progress.levels_gained) > 0,
        levels=progress.levels_gained,
        stage_changed=progress.stage_changed,
        stage_before=progress.previous_stage,
        stage_after=progress.new_stage,
        unlocks=unlocks,
    )


def serialize_pet_state(pet: PetState) -> dict[str, Any]:
    now = _now()
    lonely = is_absent_more_than_24h(pet.last_active_at, now)
    return {
        "user_id": pet.user_id,
        "name": pet.name,
        "stage": pet.stage,
        "stage_title": stage_title(pet.stage),
        "level": pet.level,
        "xp": pet.xp,
        "xp_to_next_level": опыт_до_следующего_уровня(pet.level),
        "coins": pet.coins,
        "intelligence": pet.intelligence,
        "crystals": pet.crystals,
        "hunger": pet.hunger,
        "hygiene": pet.hygiene,
        "happiness": pet.happiness,
        "health": pet.health,
        "energy": pet.energy,
        "behavior_state": pet.behavior_state,
        "is_lonely": lonely,
        "last_tick_at": pet.last_tick_at,
    }


def serialize_pet_state_for_event(pet: PetState) -> dict[str, Any]:
    payload = serialize_pet_state(pet)
    payload["last_tick_at"] = pet.last_tick_at.isoformat()
    return payload


def _update_daily_progress_for_action(db: Session, pet: PetState, action: str) -> tuple[dict[str, Any], list[str]]:
    progress = ensure_today_progress(db, pet.user_id)
    before = read_tasks(progress)
    task_key = TASK_BY_ACTION.get(action)
    if task_key:
        increment_task(progress, task_key, 1)
    after = read_tasks(progress)

    notifications: list[str] = []
    for i, task in enumerate(after):
        prev_done = bool(before[i].get("completed")) if i < len(before) else False
        if not prev_done and bool(task.get("completed")):
            notifications.append("Задание выполнено")
    db.add(progress)
    db.flush()
    return _build_daily_payload(progress), notifications


def run_decay(db: Session, pet: PetState) -> int:
    now = _now()
    lonely = is_absent_more_than_24h(pet.last_active_at, now)
    applied = apply_time_decay(pet, now=now, cap_seconds=settings.decay_cap_seconds, lonely=lonely)
    _update_behavior_state(pet)
    db.add(pet)
    db.commit()
    return applied


def execute_action(db: Session, pet: PetState, action: str) -> ActionExecution:
    now = _now()
    lonely = is_absent_more_than_24h(pet.last_active_at, now)
    apply_time_decay(pet, now=now, cap_seconds=settings.decay_cap_seconds, lonely=lonely)

    result: ActionResult = apply_action(pet, action)
    
    # Специальная логика для уборки какашек
    if action == "clean":
        pet.hunger = 50  # Снижаем сытость до 50%
    
    action_reward = ACTION_REWARDS[action]
    reward = _apply_progress_for_pet(
        db,
        pet,
        base_xp=action_reward["xp"],
        base_coins=action_reward["coins"],
        base_intelligence=action_reward["intelligence"],
        base_crystals=action_reward["crystals"],
    )

    pet.last_active_at = now
    _update_behavior_state(pet)
    daily_payload, notifications = _update_daily_progress_for_action(db, pet, action)

    if pet.hunger < 30:
        notifications.append("Единорог проголодался")
    if reward.level_up:
        notifications.append("Новый уровень!")
    if lonely:
        notifications.append("Питомец скучает")

    db.add(pet)
    db.commit()
    db.refresh(pet)

    event = _record_event(
        db,
        pet.user_id,
        action,
        {
            "deltas": result.deltas,
            "reward": reward.__dict__,
            "daily": daily_payload,
            "notifications": notifications,
            "stats": serialize_pet_state_for_event(pet),
        },
    )
    return ActionExecution(pet=pet, event=event, reward=reward, notifications=notifications)


def execute_minigame(
    db: Session, pet: PetState, game_type: str, score: int, elapsed_ms: int, source: str = "math"
) -> ActionExecution:
    now = _now()
    lonely = is_absent_more_than_24h(pet.last_active_at, now)
    apply_time_decay(pet, now=now, cap_seconds=settings.decay_cap_seconds, lonely=lonely)

    success = score >= 3
    base_xp = 15 if success else 6
    base_coins = 10 if success else 3
    base_intelligence = 2 if success else 0

    reward = _apply_progress_for_pet(
        db,
        pet,
        base_xp=base_xp,
        base_coins=base_coins,
        base_intelligence=base_intelligence,
    )
    energy_recovered = 0
    if source == "math":
        energy_recovered = 12 if success else 6
        pet.energy = _clamp_stat(pet.energy + energy_recovered)
        pet.happiness = _clamp_stat(pet.happiness + (4 if success else 2))
    pet.last_active_at = now
    _update_behavior_state(pet)

    progress = ensure_today_progress(db, pet.user_id)
    before = read_tasks(progress)
    increment_task(progress, "minigame_count", 1)
    after = read_tasks(progress)
    completed_notice = any(
        (not bool(before[i].get("completed")) and bool(after[i].get("completed"))) for i in range(min(len(before), len(after)))
    )
    db.add(progress)

    reward_row = Reward(
        user_id=pet.user_id,
        source="мини_игра",
        xp_gained=reward.xp,
        coins_gained=reward.coins,
        intelligence_gained=reward.intelligence,
        crystals_gained=reward.crystals,
        item_key=None,
        item_qty=0,
        payload={
            "game_type": game_type,
            "score": score,
            "elapsed_ms": elapsed_ms,
            "source": source,
            "energy_recovered": energy_recovered,
        },
    )
    db.add(reward_row)
    db.add(pet)
    db.commit()
    db.refresh(pet)
    db.refresh(reward_row)

    notifications = []
    if energy_recovered > 0:
        notifications.append(f"Энергия восстановлена: +{energy_recovered}")
    if completed_notice:
        notifications.append("Задание выполнено")
    if reward.level_up:
        notifications.append("Новый уровень!")

    event = _record_event(
        db,
        pet.user_id,
        "мини_игра",
        {
            "game_type": game_type,
            "score": score,
            "elapsed_ms": elapsed_ms,
            "source": source,
            "energy_recovered": energy_recovered,
            "success": success,
            "reward": {**reward.__dict__, "reward_id": reward_row.id},
            "daily": _build_daily_payload(progress),
            "notifications": notifications,
            "stats": serialize_pet_state_for_event(pet),
        },
    )
    return ActionExecution(pet=pet, event=event, reward=reward, notifications=notifications)


def get_inventory(db: Session, user_id: int) -> list[Inventory]:
    return list(db.execute(select(Inventory).where(Inventory.user_id == user_id)).scalars())


def get_daily_state(db: Session, user_id: int) -> dict[str, Any]:
    progress = ensure_today_progress(db, user_id)
    return _build_daily_payload(progress)


def claim_login_bonus_for_pet(db: Session, pet: PetState) -> DailyExecution | None:
    progress = ensure_today_progress(db, pet.user_id)
    grant = claim_login_bonus(progress)
    if grant is None:
        return None
    return _apply_daily_grant(db, pet, progress, grant, action_name="бонус_входа")


def claim_daily_chest_for_pet(db: Session, pet: PetState) -> DailyExecution | None:
    progress = ensure_today_progress(db, pet.user_id)
    grant = claim_daily_chest(progress)
    if grant is None:
        return None
    return _apply_daily_grant(db, pet, progress, grant, action_name="сундук_дня")


def _apply_daily_grant(
    db: Session, pet: PetState, progress: DailyProgress, grant: DailyReward, action_name: str
) -> DailyExecution:
    reward = _apply_progress_for_pet(db, pet, base_xp=grant.xp, base_coins=grant.coins)
    notifications = [grant.message]
    if reward.level_up:
        notifications.append("Новый уровень!")
    pet.last_active_at = _now()
    _update_behavior_state(pet)
    db.add(progress)
    db.add(pet)
    db.commit()
    db.refresh(pet)

    event = _record_event(
        db,
        pet.user_id,
        action_name,
        {
            "reward": reward.__dict__,
            "daily": _build_daily_payload(progress),
            "notifications": notifications,
            "stats": serialize_pet_state_for_event(pet),
        },
    )
    return DailyExecution(
        pet=pet,
        event=event,
        reward=reward,
        daily=_build_daily_payload(progress),
        notifications=notifications,
    )


def get_shop_catalog(db: Session, pet: PetState) -> list[dict[str, Any]]:
    inventory = {row.item_key: row.quantity for row in get_inventory(db, pet.user_id)}
    items: list[dict[str, Any]] = []
    for item in CATALOG:
        price = price_for_level(item.base_price, pet.level)
        items.append(
            {
                "item_key": item.item_key,
                "title": item.title,
                "section": item.section,
                "base_price": item.base_price,
                "price": price,
                "level_required": item.level_required,
                "owned": inventory.get(item.item_key, 0) > 0,
            }
        )
    return items


def buy_shop_item(db: Session, pet: PetState, item_key: str) -> ShopExecution:
    item = find_item(item_key)
    if item is None:
        raise ValueError("Товар не найден")
    if pet.level < item.level_required:
        raise ValueError("Недостаточный уровень")

    price = price_for_level(item.base_price, pet.level)
    if pet.coins < price:
        raise ValueError("Недостаточно монет")

    pet.coins -= price
    _upsert_inventory(db, pet.user_id, item.item_key, 1)
    pet.last_active_at = _now()
    _update_behavior_state(pet)
    db.add(pet)
    db.commit()
    db.refresh(pet)

    event = _record_event(
        db,
        pet.user_id,
        "покупка",
        {"item_key": item.item_key, "title": item.title, "section": item.section, "price": price},
    )
    return ShopExecution(pet=pet, event=event, item_key=item.item_key, price=price)



def use_item(db: Session, pet: PetState, item_key: str) -> ActionExecution:
    """Использовать предмет из инвентаря"""
    from app.services.shop import get_item_category, get_item_effects, is_consumable, find_item
    
    # Проверяем, что предмет расходный
    if not is_consumable(item_key):
        raise ValueError("Этот предмет нельзя использовать")
    
    # Проверяем наличие в инвентаре
    inventory_item = db.execute(
        select(Inventory).where(Inventory.user_id == pet.user_id, Inventory.item_key == item_key)
    ).scalar_one_or_none()
    
    if not inventory_item or inventory_item.quantity <= 0:
        raise ValueError("У вас нет этого предмета")
    
    # Применяем деградацию
    now = _now()
    lonely = is_absent_more_than_24h(pet.last_active_at, now)
    apply_time_decay(pet, now=now, cap_seconds=settings.decay_cap_seconds, lonely=lonely)
    
    # Получаем эффекты предмета
    effects = get_item_effects(item_key)
    deltas: dict[str, int] = {}
    
    # Применяем эффекты
    for stat, delta in effects.items():
        if stat == "intelligence":
            # Интеллект не ограничен 100
            pet.intelligence += delta
            deltas[stat] = delta
        else:
            before = getattr(pet, stat)
            after = _clamp_stat(before + delta)
            setattr(pet, stat, after)
            deltas[stat] = after - before
    
    # Уменьшаем количество предмета
    inventory_item.quantity -= 1
    if inventory_item.quantity <= 0:
        db.delete(inventory_item)
    
    # Определяем награды в зависимости от категории
    category = get_item_category(item_key)
    if category == "food":
        base_xp, base_coins = 5, 2
    elif category == "medicine":
        base_xp, base_coins = 7, 3
    elif category == "wash":
        base_xp, base_coins = 5, 2
    elif category == "toy":
        base_xp, base_coins = 10, 5
    else:
        base_xp, base_coins = 3, 1
    
    # Применяем прогресс
    reward = _apply_progress_for_pet(
        db,
        pet,
        base_xp=base_xp,
        base_coins=base_coins,
        base_intelligence=effects.get("intelligence", 0),
    )
    
    pet.last_active_at = now
    _update_behavior_state(pet)
    
    # Обновляем ежедневные задания
    daily_payload, notifications = _update_daily_progress_for_action(db, pet, category)
    
    if reward.level_up:
        notifications.append("Новый уровень!")
    if lonely:
        notifications.append("Питомец скучает")
    
    # Получаем название предмета
    shop_item = find_item(item_key)
    item_title = shop_item.title if shop_item else item_key
    notifications.insert(0, f"Использован: {item_title}")
    
    db.add(pet)
    db.commit()
    db.refresh(pet)
    
    event = _record_event(
        db,
        pet.user_id,
        f"use_item_{category}",
        {
            "item_key": item_key,
            "item_title": item_title,
            "deltas": deltas,
            "reward": reward.__dict__,
            "daily": daily_payload,
            "notifications": notifications,
            "stats": serialize_pet_state_for_event(pet),
        },
    )
    return ActionExecution(pet=pet, event=event, reward=reward, notifications=notifications)
