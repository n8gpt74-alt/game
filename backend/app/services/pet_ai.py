from datetime import UTC, datetime


def определить_состояние_питомца(
    *,
    hunger: int,
    hygiene: int,
    happiness: int,
    health: int,
    energy: int,
) -> str:
    if hunger < 30:
        return "Голодный"
    if energy < 20:
        return "Уставший"
    if hygiene < 30:
        return "Грязный"
    if health < 40:
        return "Больной"
    if happiness > 80:
        return "Радостный"
    if happiness < 35:
        return "Грустный"
    if happiness > 65 and energy > 60:
        return "Игривый"
    if energy > 55 and health > 60:
        return "Любопытный"
    return "Спокойный"


def is_absent_more_than_24h(last_active_at: datetime | None, now: datetime) -> bool:
    if last_active_at is None:
        return False
    left = last_active_at if last_active_at.tzinfo else last_active_at.replace(tzinfo=UTC)
    right = now if now.tzinfo else now.replace(tzinfo=UTC)
    return (right - left).total_seconds() >= 24 * 3600
