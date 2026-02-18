from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.routers.game import state as state_endpoint
from app.services.game import claim_login_bonus_for_pet, ensure_pet_state
from app.services.gamification import list_achievements


def _make_db() -> Session:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def _achievement_progress(states: list, key: str) -> int:
    row = next(item for item in states if item.achievement_key == key)
    return int(row.progress)


def test_login_bonus_is_100_coins_and_updates_achievements() -> None:
    db = _make_db()
    pet = ensure_pet_state(db, user_id=1)
    before_coins = pet.coins

    result = claim_login_bonus_for_pet(db, pet)

    assert result is not None
    assert result.reward.coins >= 100
    assert result.daily["login_bonus_claimed"] is True
    assert result.event.action == "бонус_входа"
    assert pet.coins >= before_coins + 100

    achievements = list_achievements(db, user_id=1)
    assert _achievement_progress(achievements, "streak_best_7") == 1
    assert _achievement_progress(achievements, "coins_earned_1000") >= 100

    assert claim_login_bonus_for_pet(db, pet) is None


def test_state_endpoint_auto_claims_daily_bonus_once() -> None:
    db = _make_db()
    pet = ensure_pet_state(db, user_id=1)
    before_coins = pet.coins

    _ = state_endpoint(db, user_id=1)
    db.refresh(pet)
    after_first = pet.coins

    _ = state_endpoint(db, user_id=1)
    db.refresh(pet)
    after_second = pet.coins

    assert after_first >= before_coins + 100
    assert after_second == after_first
