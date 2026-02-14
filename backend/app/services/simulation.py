from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol


ACTION_EFFECTS = {
    "feed": {"hunger": 18, "happiness": 3, "hygiene": -1},
    "wash": {"hygiene": 28, "health": 3, "happiness": 2},
    "play": {"happiness": 20, "energy": -10, "hunger": -4, "hygiene": -2},
    "heal": {"health": 24, "happiness": 4, "energy": -2},
    "chat": {"happiness": 10, "health": 2, "energy": -1},
    "sleep": {"energy": 25, "happiness": 5},  # Хорошее восстановление энергии
    "clean": {"hygiene": 15, "happiness": 5},  # Убрать какашки
}


class PetLike(Protocol):
    hunger: int
    hygiene: int
    happiness: int
    health: int
    energy: int
    last_tick_at: datetime


@dataclass
class ActionResult:
    action: str
    deltas: dict[str, int]


def clamp(value: int | float, min_value: int = 0, max_value: int = 100) -> int:
    return int(max(min_value, min(max_value, round(value))))


def apply_time_decay(state: PetLike, now: datetime, cap_seconds: int, lonely: bool = False) -> int:
    if state.last_tick_at.tzinfo is None:
        last_tick = state.last_tick_at.replace(tzinfo=UTC)
    else:
        last_tick = state.last_tick_at.astimezone(UTC)

    now_utc = now if now.tzinfo else now.replace(tzinfo=UTC)
    elapsed_seconds = max(0, int((now_utc - last_tick).total_seconds()))
    
    # Не применяем деградацию, если прошло меньше 30 секунд
    if elapsed_seconds < 30:
        return 0
    
    effective_seconds = min(elapsed_seconds, cap_seconds)
    if effective_seconds <= 0:
        state.last_tick_at = now_utc
        return 0

    # Мягкая деградация: замедляем со временем
    hours_elapsed = elapsed_seconds / 3600.0
    
    # Коэффициент замедления деградации
    if hours_elapsed <= 6:
        decay_multiplier = 1.0  # Нормальная скорость до 6 часов
    elif hours_elapsed <= 24:
        decay_multiplier = 0.5  # 50% скорости от 6 до 24 часов
    else:
        decay_multiplier = 0.25  # 25% скорости после 24 часов
    
    ticks = (effective_seconds / 600.0) * decay_multiplier

    # Базовая деградация (медленнее)
    state.hunger = clamp(state.hunger - (0.8 * ticks))
    state.energy = clamp(state.energy - (0.8 * ticks))
    state.hygiene = clamp(state.hygiene - (0.8 * ticks))

    # Настроение падает медленнее
    happiness_drop = 0.25 * ticks
    if state.hunger < 40:
        happiness_drop += 0.4 * ticks
    if state.energy < 35:
        happiness_drop += 0.4 * ticks
    if state.hygiene < 40:
        happiness_drop += 0.45 * ticks
    if lonely:
        happiness_drop *= 1.5  # Меньший штраф за одиночество

    state.happiness = clamp(state.happiness - happiness_drop)

    # Здоровье падает только при критических значениях
    health_drop = 0.0
    if state.hunger < 25:  # Более низкий порог
        health_drop += 0.6 * ticks
    if state.hygiene < 25:  # Более низкий порог
        health_drop += 0.7 * ticks
    if health_drop > 0:
        state.health = clamp(state.health - health_drop)

    state.last_tick_at = now_utc
    return effective_seconds


def apply_action(state: PetLike, action: str) -> ActionResult:
    if action not in ACTION_EFFECTS:
        raise ValueError(f"Unknown action: {action}")
    deltas: dict[str, int] = {}
    for stat, delta in ACTION_EFFECTS[action].items():
        before = getattr(state, stat)
        after = clamp(before + delta)
        setattr(state, stat, after)
        deltas[stat] = after - before

    return ActionResult(action=action, deltas=deltas)
