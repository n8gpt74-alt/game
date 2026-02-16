from datetime import UTC, datetime, timedelta

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.models import LiveEvent, QuestProgress
from app.services.game import claim_quest_step_for_pet, ensure_pet_state, execute_action
from app.services.quests import list_quests


def _make_db() -> Session:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def _ensure_active_event(db: Session) -> None:
    now = datetime.now(UTC)
    db.add(
        LiveEvent(
            event_key="test_event",
            title="Тестовое событие",
            description="Описание",
            starts_at=now - timedelta(days=1),
            ends_at=now + timedelta(days=365),
            target_points=10_000,
            reward_coins=0,
            reward_xp=0,
            is_enabled=True,
        )
    )
    db.commit()


def _quest_step(quests: list[dict], quest_key: str, index: int) -> dict:
    quest = next(row for row in quests if row["quest_key"] == quest_key)
    return next(step for step in quest["steps"] if step["index"] == index)


def test_quests_progress_and_claim_is_single_use() -> None:
    db = _make_db()
    _ensure_active_event(db)

    pet = ensure_pet_state(db, user_id=1)

    execute_action(db, pet, "feed")
    execute_action(db, pet, "feed")

    quests = list_quests(db, user_id=1)
    first_step = _quest_step(quests, "first_steps", 0)
    assert first_step["progress"] == 2
    assert first_step["completed"] is True
    assert first_step["claimed"] is False

    before_coins = pet.coins
    claim_result = claim_quest_step_for_pet(db, pet, "first_steps")

    assert claim_result.event.action == "награда_квеста"
    assert claim_result.reward.coins == 30
    assert claim_result.reward.xp == 12
    assert pet.coins >= before_coins + claim_result.reward.coins

    with pytest.raises(ValueError):
        claim_quest_step_for_pet(db, pet, "first_steps")


def test_quest_progress_does_not_overflow_after_completion() -> None:
    db = _make_db()
    _ensure_active_event(db)

    pet = ensure_pet_state(db, user_id=1)

    execute_action(db, pet, "feed")
    execute_action(db, pet, "feed")
    execute_action(db, pet, "feed")

    row = db.execute(
        select(QuestProgress).where(QuestProgress.user_id == 1, QuestProgress.quest_key == "first_steps")
    ).scalar_one()
    assert row.step_progress == 2
