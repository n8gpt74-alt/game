from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.models import LiveEvent, StreakState
from app.services.gamification import (
    achievement_reward,
    add_achievement_progress,
    add_event_points,
    claim_achievement,
    claim_active_event,
    get_active_event_state,
    list_achievements,
    update_login_streak,
)


def _make_db() -> Session:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def test_login_streak_increments_and_resets() -> None:
    db = _make_db()

    update_login_streak(db, user_id=1, date_key="2026-02-10")
    db.commit()

    row = db.execute(select(StreakState).where(StreakState.user_id == 1)).scalar_one()
    assert row.current_streak == 1
    assert row.best_streak == 1

    update_login_streak(db, user_id=1, date_key="2026-02-11")
    db.commit()
    assert row.current_streak == 2
    assert row.best_streak == 2

    update_login_streak(db, user_id=1, date_key="2026-02-13")
    db.commit()
    assert row.current_streak == 1
    assert row.best_streak == 2


def test_login_streak_bonus_milestone() -> None:
    db = _make_db()

    update_login_streak(db, user_id=1, date_key="2026-02-10")
    update_login_streak(db, user_id=1, date_key="2026-02-11")
    update = update_login_streak(db, user_id=1, date_key="2026-02-12")

    assert update.current_streak == 3
    assert update.bonus_coins > 0
    assert update.bonus_xp > 0
    assert update.milestone_reached == 3


def test_live_event_progress_and_claim() -> None:
    db = _make_db()

    now = datetime.now(UTC)
    db.add(
        LiveEvent(
            event_key="test_event",
            title="Тестовое событие",
            description="Описание",
            starts_at=now - timedelta(days=1),
            ends_at=now + timedelta(days=1),
            target_points=5,
            reward_coins=30,
            reward_xp=12,
            is_enabled=True,
        )
    )
    db.commit()

    state = get_active_event_state(db, user_id=1)
    assert state is not None
    assert state.event_key == "test_event"
    assert state.progress_points == 0

    update = add_event_points(db, user_id=1, points=3)
    assert update is not None
    assert update.state.progress_points == 3
    db.commit()

    with pytest.raises(ValueError):
        claim_active_event(db, user_id=1)

    add_event_points(db, user_id=1, points=3)
    db.commit()

    claimed = claim_active_event(db, user_id=1)
    db.commit()
    assert claimed.completed is True
    assert claimed.claimed is True


def test_achievements_progress_list_and_claim() -> None:
    db = _make_db()

    states = list_achievements(db, user_id=1)
    assert len(states) > 0

    state = add_achievement_progress(db, user_id=1, achievement_key="feed_count_25", delta=25)
    db.commit()
    assert state.completed is True

    reward_xp, reward_coins = achievement_reward("feed_count_25")
    assert reward_xp > 0
    assert reward_coins > 0

    claimed = claim_achievement(db, user_id=1, achievement_key="feed_count_25")
    db.commit()
    assert claimed.claimed is True
