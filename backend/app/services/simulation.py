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

CHARACTER_EFFECTS = {
    "feed": {"character_friendliness": 1, "character_energy": 1},
    "wash": {"character_tidiness": 2},
    "play": {"character_energy": 2, "character_friendliness": 1},
    "heal": {"character_friendliness": 2},
    "chat": {"character_curiosity": 2, "character_friendliness": 1},
    "sleep": {"character_energy": 1},
    "clean": {"character_tidiness": 2},
}


class PetLike(Protocol):
    hunger: int
    hygiene: int
    happiness: int
    health: int
    energy: int
    last_tick_at: datetime
    character_courage: int
    character_friendliness: int
    character_energy: int
    character_curiosity: int
    character_tidiness: int


@dataclass
class ActionResult:
    action: str
    deltas: dict[str, int]
    character_deltas: dict[str, int]


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

    # Более активная деградация: питомцу нужен регулярный уход
    ticks = effective_seconds / 600.0

    # Базовая деградация основных статов
    state.hunger = clamp(state.hunger - (1.0 * ticks))
    state.energy = clamp(state.energy - (0.95 * ticks))
    state.hygiene = clamp(state.hygiene - (0.9 * ticks))

    # Настроение падает быстрее при запущенных базовых потребностях
    happiness_drop = 0.3 * ticks
    if state.hunger < 55:
        happiness_drop += 0.35 * ticks
    if state.energy < 45:
        happiness_drop += 0.3 * ticks
    if state.hygiene < 50:
        happiness_drop += 0.4 * ticks
    if lonely:
        happiness_drop *= 1.4

    state.happiness = clamp(state.happiness - happiness_drop)

    # Здоровье начинает проседать, если долго игнорировать базовый уход
    health_drop = 0.0
    if state.hunger < 45:
        health_drop += 0.45 * ticks
    if state.hygiene < 40:
        health_drop += 0.55 * ticks
    if state.energy < 25:
        health_drop += 0.35 * ticks
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

    character_deltas: dict[str, int] = {}
    if action in CHARACTER_EFFECTS:
        for stat, delta in CHARACTER_EFFECTS[action].items():
            before = getattr(state, stat)
            after = clamp(before + delta)
            setattr(state, stat, after)
            character_deltas[stat] = after - before

    return ActionResult(action=action, deltas=deltas, character_deltas=character_deltas)
