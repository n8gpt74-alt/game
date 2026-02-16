from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AchievementProgress, EventProgress, LiveEvent, StreakState


@dataclass(frozen=True)
class StreakUpdate:
    current_streak: int
    best_streak: int
    bonus_coins: int
    bonus_xp: int
    milestone_reached: int | None


@dataclass(frozen=True)
class ActiveEventState:
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


@dataclass(frozen=True)
class AchievementState:
    achievement_key: str
    title: str
    description: str
    target: int
    progress: int
    reward_coins: int
    reward_xp: int
    completed: bool
    claimed: bool


@dataclass(frozen=True)
class EventPointUpdate:
    completed_now: bool
    state: ActiveEventState


ACHIEVEMENT_DEFINITIONS: dict[str, dict[str, int | str]] = {
    "feed_count_25": {
        "title": "Заботливый кормилец",
        "description": "Покормить питомца 25 раз",
        "target": 25,
        "reward_coins": 120,
        "reward_xp": 50,
    },
    "play_count_25": {
        "title": "Друг по играм",
        "description": "Поиграть с питомцем 25 раз",
        "target": 25,
        "reward_coins": 140,
        "reward_xp": 60,
    },
    "minigame_count_20": {
        "title": "Мини-игроман",
        "description": "Пройти 20 мини-игр",
        "target": 20,
        "reward_coins": 180,
        "reward_xp": 80,
    },
    "coins_earned_1000": {
        "title": "Копилка",
        "description": "Заработать 1000 монет",
        "target": 1000,
        "reward_coins": 250,
        "reward_xp": 90,
    },
    "streak_best_7": {
        "title": "Неделя вместе",
        "description": "Поддерживать серию входов 7 дней",
        "target": 7,
        "reward_coins": 220,
        "reward_xp": 100,
    },
    "streak_best_30": {
        "title": "Легенда заботы",
        "description": "Поддерживать серию входов 30 дней",
        "target": 30,
        "reward_coins": 700,
        "reward_xp": 250,
    },
}


def _now() -> datetime:
    return datetime.now(UTC)


def _parse_date_key(date_key: str) -> datetime:
    return datetime.strptime(date_key, "%Y-%m-%d").replace(tzinfo=UTC)


def _default_event_rows() -> list[dict[str, object]]:
    return [
        {
            "event_key": "spring_festival_2026",
            "title": "Весенний фестиваль",
            "description": "Наберите очки активности и получите редкую награду",
            "starts_at": datetime(2026, 1, 1, tzinfo=UTC),
            "ends_at": datetime(2027, 1, 1, tzinfo=UTC),
            "target_points": 40,
            "reward_coins": 300,
            "reward_xp": 120,
            "is_enabled": True,
        }
    ]


def ensure_default_events(db: Session) -> None:
    existing = {
        row.event_key: row
        for row in db.execute(select(LiveEvent)).scalars()
    }
    changed = False

    for payload in _default_event_rows():
        key = str(payload["event_key"])
        if key in existing:
            continue
        db.add(
            LiveEvent(
                event_key=key,
                title=str(payload["title"]),
                description=str(payload["description"]),
                starts_at=payload["starts_at"],
                ends_at=payload["ends_at"],
                target_points=int(payload["target_points"]),
                reward_coins=int(payload["reward_coins"]),
                reward_xp=int(payload["reward_xp"]),
                is_enabled=bool(payload["is_enabled"]),
            )
        )
        changed = True

    if changed:
        db.flush()


def get_or_create_streak_state(db: Session, user_id: int) -> StreakState:
    row = db.execute(select(StreakState).where(StreakState.user_id == user_id)).scalar_one_or_none()
    if row is not None:
        return row

    row = StreakState(user_id=user_id, current_streak=0, best_streak=0, last_claim_date=None)
    db.add(row)
    db.flush()
    return row


def serialize_streak_state(row: StreakState) -> dict[str, int | str | None]:
    return {
        "current": row.current_streak,
        "best": row.best_streak,
        "last_claim_date": row.last_claim_date,
    }


def _streak_bonus_for(streak: int) -> tuple[int, int, int | None]:
    if streak >= 30:
        return 80, 30, 30
    if streak >= 14:
        return 45, 18, 14
    if streak >= 7:
        return 25, 10, 7
    if streak >= 3:
        return 10, 4, 3
    return 0, 0, None


def update_login_streak(db: Session, user_id: int, date_key: str) -> StreakUpdate:
    row = get_or_create_streak_state(db, user_id)
    current_claim_date = _parse_date_key(date_key)

    if row.last_claim_date == date_key:
        bonus_coins, bonus_xp, milestone = _streak_bonus_for(row.current_streak)
        return StreakUpdate(
            current_streak=row.current_streak,
            best_streak=row.best_streak,
            bonus_coins=bonus_coins,
            bonus_xp=bonus_xp,
            milestone_reached=milestone,
        )

    if row.last_claim_date:
        previous_claim_date = _parse_date_key(row.last_claim_date)
        expected = previous_claim_date + timedelta(days=1)
        if expected.date() == current_claim_date.date():
            row.current_streak += 1
        else:
            row.current_streak = 1
    else:
        row.current_streak = 1

    row.best_streak = max(row.best_streak, row.current_streak)
    row.last_claim_date = date_key
    db.add(row)
    db.flush()

    bonus_coins, bonus_xp, milestone = _streak_bonus_for(row.current_streak)
    return StreakUpdate(
        current_streak=row.current_streak,
        best_streak=row.best_streak,
        bonus_coins=bonus_coins,
        bonus_xp=bonus_xp,
        milestone_reached=milestone,
    )


def _get_active_event_row(db: Session, now: datetime | None = None) -> LiveEvent | None:
    point = now or _now()
    ensure_default_events(db)
    return (
        db.execute(
            select(LiveEvent)
            .where(
                LiveEvent.is_enabled.is_(True),
                LiveEvent.starts_at <= point,
                LiveEvent.ends_at >= point,
            )
            .order_by(LiveEvent.starts_at.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )


def _get_or_create_event_progress(db: Session, user_id: int, event_key: str) -> EventProgress:
    row = db.execute(
        select(EventProgress).where(EventProgress.user_id == user_id, EventProgress.event_key == event_key)
    ).scalar_one_or_none()
    if row is not None:
        return row

    row = EventProgress(user_id=user_id, event_key=event_key, points=0, completed_at=None, claimed_at=None)
    db.add(row)
    db.flush()
    return row


def _serialize_event(event: LiveEvent, progress: EventProgress) -> ActiveEventState:
    return ActiveEventState(
        event_key=event.event_key,
        title=event.title,
        description=event.description,
        target_points=event.target_points,
        progress_points=progress.points,
        reward_coins=event.reward_coins,
        reward_xp=event.reward_xp,
        started_at=event.starts_at,
        ends_at=event.ends_at,
        completed=progress.completed_at is not None,
        claimed=progress.claimed_at is not None,
    )


def get_active_event_state(db: Session, user_id: int) -> ActiveEventState | None:
    event = _get_active_event_row(db)
    if event is None:
        return None
    progress = _get_or_create_event_progress(db, user_id, event.event_key)
    return _serialize_event(event, progress)


def add_event_points(db: Session, user_id: int, points: int) -> EventPointUpdate | None:
    if points <= 0:
        return None

    event = _get_active_event_row(db)
    if event is None:
        return None

    progress = _get_or_create_event_progress(db, user_id, event.event_key)
    if progress.claimed_at is not None:
        return EventPointUpdate(completed_now=False, state=_serialize_event(event, progress))

    completed_before = progress.completed_at is not None
    progress.points = max(0, progress.points + points)
    if progress.points >= event.target_points and progress.completed_at is None:
        progress.completed_at = _now()

    db.add(progress)
    db.flush()

    return EventPointUpdate(
        completed_now=(not completed_before and progress.completed_at is not None),
        state=_serialize_event(event, progress),
    )


def claim_active_event(db: Session, user_id: int) -> ActiveEventState:
    event = _get_active_event_row(db)
    if event is None:
        raise ValueError("Сейчас нет активных событий")

    progress = _get_or_create_event_progress(db, user_id, event.event_key)
    if progress.completed_at is None or progress.points < event.target_points:
        raise ValueError("Награда события ещё недоступна")
    if progress.claimed_at is not None:
        raise ValueError("Награда события уже получена")

    progress.claimed_at = _now()
    db.add(progress)
    db.flush()

    return _serialize_event(event, progress)


def _get_or_create_achievement_progress(db: Session, user_id: int, achievement_key: str) -> AchievementProgress:
    row = db.execute(
        select(AchievementProgress).where(
            AchievementProgress.user_id == user_id,
            AchievementProgress.achievement_key == achievement_key,
        )
    ).scalar_one_or_none()
    if row is not None:
        return row

    row = AchievementProgress(
        user_id=user_id,
        achievement_key=achievement_key,
        progress=0,
        completed_at=None,
        claimed_at=None,
    )
    db.add(row)
    db.flush()
    return row


def _serialize_achievement(achievement_key: str, row: AchievementProgress) -> AchievementState:
    definition = ACHIEVEMENT_DEFINITIONS[achievement_key]
    target = int(definition["target"])
    return AchievementState(
        achievement_key=achievement_key,
        title=str(definition["title"]),
        description=str(definition["description"]),
        target=target,
        progress=row.progress,
        reward_coins=int(definition["reward_coins"]),
        reward_xp=int(definition["reward_xp"]),
        completed=row.completed_at is not None or row.progress >= target,
        claimed=row.claimed_at is not None,
    )


def list_achievements(db: Session, user_id: int) -> list[AchievementState]:
    rows = {
        row.achievement_key: row
        for row in db.execute(select(AchievementProgress).where(AchievementProgress.user_id == user_id)).scalars()
    }
    result: list[AchievementState] = []
    for achievement_key in ACHIEVEMENT_DEFINITIONS:
        row = rows.get(achievement_key)
        if row is None:
            row = _get_or_create_achievement_progress(db, user_id, achievement_key)
        result.append(_serialize_achievement(achievement_key, row))
    return result


def add_achievement_progress(db: Session, user_id: int, achievement_key: str, delta: int) -> AchievementState:
    if achievement_key not in ACHIEVEMENT_DEFINITIONS:
        raise ValueError("Unknown achievement")

    row = _get_or_create_achievement_progress(db, user_id, achievement_key)
    if delta > 0:
        row.progress = max(0, row.progress + delta)

    target = int(ACHIEVEMENT_DEFINITIONS[achievement_key]["target"])
    if row.progress >= target and row.completed_at is None:
        row.completed_at = _now()

    db.add(row)
    db.flush()
    return _serialize_achievement(achievement_key, row)


def set_achievement_progress_max(db: Session, user_id: int, achievement_key: str, value: int) -> AchievementState:
    if achievement_key not in ACHIEVEMENT_DEFINITIONS:
        raise ValueError("Unknown achievement")

    row = _get_or_create_achievement_progress(db, user_id, achievement_key)
    row.progress = max(row.progress, value)

    target = int(ACHIEVEMENT_DEFINITIONS[achievement_key]["target"])
    if row.progress >= target and row.completed_at is None:
        row.completed_at = _now()

    db.add(row)
    db.flush()
    return _serialize_achievement(achievement_key, row)


def claim_achievement(db: Session, user_id: int, achievement_key: str) -> AchievementState:
    if achievement_key not in ACHIEVEMENT_DEFINITIONS:
        raise ValueError("Достижение не найдено")

    row = _get_or_create_achievement_progress(db, user_id, achievement_key)
    target = int(ACHIEVEMENT_DEFINITIONS[achievement_key]["target"])

    if row.progress < target or row.completed_at is None:
        raise ValueError("Награда достижения ещё недоступна")
    if row.claimed_at is not None:
        raise ValueError("Награда достижения уже получена")

    row.claimed_at = _now()
    db.add(row)
    db.flush()

    return _serialize_achievement(achievement_key, row)


def achievement_reward(achievement_key: str) -> tuple[int, int]:
    definition = ACHIEVEMENT_DEFINITIONS.get(achievement_key)
    if definition is None:
        return 0, 0
    return int(definition["reward_xp"]), int(definition["reward_coins"])
