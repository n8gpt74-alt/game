from dataclasses import dataclass
from datetime import UTC, datetime
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DailyProgress


@dataclass
class DailyReward:
    coins: int
    xp: int
    message: str


def today_key(now: datetime | None = None) -> str:
    point = now or datetime.now(UTC)
    utc = point if point.tzinfo else point.replace(tzinfo=UTC)
    return utc.strftime("%Y-%m-%d")


def default_tasks() -> list[dict]:
    return [
        {"task_key": "feed_count", "title": "Покормить 2 раза", "target": 2, "progress": 0, "completed": False},
        {"task_key": "minigame_count", "title": "Пройти 1 мини-игру", "target": 1, "progress": 0, "completed": False},
        {"task_key": "play_count", "title": "Поиграть 1 раз", "target": 1, "progress": 0, "completed": False},
    ]


def _parse_tasks(raw: str) -> list[dict]:
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return data
    except Exception:  # noqa: BLE001
        pass
    return default_tasks()


def _dump_tasks(tasks: list[dict]) -> str:
    return json.dumps(tasks, ensure_ascii=False)


def ensure_today_progress(db: Session, user_id: int) -> DailyProgress:
    key = today_key()
    row = db.execute(
        select(DailyProgress).where(DailyProgress.user_id == user_id, DailyProgress.date_key == key)
    ).scalar_one_or_none()
    if row is not None:
        return row

    row = DailyProgress(
        user_id=user_id,
        date_key=key,
        tasks_json=_dump_tasks(default_tasks()),
        login_bonus_claimed=False,
        chest_claimed=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def read_tasks(progress: DailyProgress) -> list[dict]:
    return _parse_tasks(progress.tasks_json)


def save_tasks(progress: DailyProgress, tasks: list[dict]) -> None:
    progress.tasks_json = _dump_tasks(tasks)


def all_tasks_completed(tasks: list[dict]) -> bool:
    return all(bool(task.get("completed")) for task in tasks)


def increment_task(progress: DailyProgress, task_key: str, amount: int = 1) -> bool:
    tasks = read_tasks(progress)
    changed = False
    for task in tasks:
        if task.get("task_key") != task_key:
            continue
        task["progress"] = int(task.get("progress", 0)) + amount
        task["completed"] = task["progress"] >= int(task.get("target", 1))
        changed = True
    if changed:
        save_tasks(progress, tasks)
    return changed


def claim_login_bonus(progress: DailyProgress) -> DailyReward | None:
    if progress.login_bonus_claimed:
        return None
    progress.login_bonus_claimed = True
    return DailyReward(coins=20, xp=12, message="Бонус за вход получен")


def claim_daily_chest(progress: DailyProgress) -> DailyReward | None:
    tasks = read_tasks(progress)
    if progress.chest_claimed or not all_tasks_completed(tasks):
        return None
    progress.chest_claimed = True
    return DailyReward(coins=50, xp=30, message="Сундук заданий открыт")
