from __future__ import annotations

from collections.abc import Iterable
import pytest

from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.database import Base
from app.schemas import MinigameResultRequest
from app.services.game import ensure_pet_state, execute_minigame
from app.services.gamification import list_achievements
from app.services.quests import list_quests


def _make_db() -> Session:
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)()


def _tasks_by_key(tasks: Iterable[dict]) -> dict[str, dict]:
    return {str(task["task_key"]): task for task in tasks}


def _achievement_progress(states: Iterable[object], key: str) -> int:
    state = next(row for row in states if getattr(row, "achievement_key") == key)
    return int(getattr(state, "progress"))


def _quest_step_progress(quests: list[dict], quest_key: str, index: int = 0) -> int:
    quest = next(row for row in quests if row["quest_key"] == quest_key)
    step = next(step for step in quest["steps"] if step["index"] == index)
    return int(step["progress"])


def test_minigame_schema_accepts_new_game_types() -> None:
    payload = MinigameResultRequest(game_type="ru_letter_sound_pick", score=3, elapsed_ms=1500, source="math")
    assert payload.game_type == "ru_letter_sound_pick"

    payload = MinigameResultRequest(game_type="word_problem_lite", score=5, elapsed_ms=2500, source="math")
    assert payload.game_type == "word_problem_lite"

    with pytest.raises(ValidationError):
        MinigameResultRequest(game_type="unknown_game", score=3, elapsed_ms=1500, source="math")


def test_letters_minigame_updates_letters_progress_and_payload_category() -> None:
    db = _make_db()
    pet = ensure_pet_state(db, user_id=1)

    result = execute_minigame(db, pet, "ru_letter_sound_pick", score=4, elapsed_ms=1800, source="math")

    assert result.event.payload["category"] == "letters"
    daily_tasks = _tasks_by_key(result.event.payload["daily"]["tasks"])
    assert daily_tasks["minigame_count"]["progress"] == 1
    assert daily_tasks["letters_game_count"]["progress"] == 1
    assert daily_tasks["math_minigame_count"]["progress"] == 0

    achievements = list_achievements(db, user_id=1)
    assert _achievement_progress(achievements, "minigame_count_20") == 1
    assert _achievement_progress(achievements, "letters_game_count_20") == 1
    assert _achievement_progress(achievements, "math_minigame_count_20") == 0

    quests = list_quests(db, user_id=1)
    assert _quest_step_progress(quests, "minigames") == 1
    assert _quest_step_progress(quests, "letters_training") == 1
    assert _quest_step_progress(quests, "math_training") == 0


def test_math_minigame_updates_math_progress_and_payload_category() -> None:
    db = _make_db()
    pet = ensure_pet_state(db, user_id=1)

    result = execute_minigame(db, pet, "sub_1_5", score=5, elapsed_ms=2200, source="math")

    assert result.event.payload["category"] == "math"
    daily_tasks = _tasks_by_key(result.event.payload["daily"]["tasks"])
    assert daily_tasks["minigame_count"]["progress"] == 1
    assert daily_tasks["math_minigame_count"]["progress"] == 1
    assert daily_tasks["letters_game_count"]["progress"] == 0

    achievements = list_achievements(db, user_id=1)
    assert _achievement_progress(achievements, "minigame_count_20") == 1
    assert _achievement_progress(achievements, "math_minigame_count_20") == 1
    assert _achievement_progress(achievements, "letters_game_count_20") == 0

    quests = list_quests(db, user_id=1)
    assert _quest_step_progress(quests, "minigames") == 1
    assert _quest_step_progress(quests, "math_training") == 1
    assert _quest_step_progress(quests, "letters_training") == 0


def test_3d_minigame_keeps_split_progress_unchanged() -> None:
    db = _make_db()
    pet = ensure_pet_state(db, user_id=1)

    result = execute_minigame(db, pet, "count_2_4", score=4, elapsed_ms=2000, source="3d")

    assert result.event.payload["category"] == "3d"
    daily_tasks = _tasks_by_key(result.event.payload["daily"]["tasks"])
    assert daily_tasks["minigame_count"]["progress"] == 1
    assert daily_tasks["math_minigame_count"]["progress"] == 0
    assert daily_tasks["letters_game_count"]["progress"] == 0

    achievements = list_achievements(db, user_id=1)
    assert _achievement_progress(achievements, "minigame_count_20") == 1
    assert _achievement_progress(achievements, "math_minigame_count_20") == 0
    assert _achievement_progress(achievements, "letters_game_count_20") == 0

    quests = list_quests(db, user_id=1)
    assert _quest_step_progress(quests, "minigames") == 1
    assert _quest_step_progress(quests, "math_training") == 0
    assert _quest_step_progress(quests, "letters_training") == 0
