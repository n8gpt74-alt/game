from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import QuestProgress


@dataclass(frozen=True)
class QuestStepDefinition:
    metric: str
    title: str
    description: str
    target: int
    reward_coins: int
    reward_xp: int


@dataclass(frozen=True)
class QuestDefinition:
    quest_key: str
    title: str
    description: str
    steps: list[QuestStepDefinition]


@dataclass(frozen=True)
class QuestClaim:
    quest_key: str
    step_index: int
    step_title: str
    reward_coins: int
    reward_xp: int
    quest_completed_now: bool


def _now() -> datetime:
    return datetime.now(UTC)


def _metric_matches(step_metric: str, event_metric: str) -> bool:
    if step_metric == event_metric:
        return True
    if step_metric.endswith(":any"):
        prefix = step_metric[: -len(":any")]
        return event_metric.startswith(prefix)
    return False


QUEST_DEFINITIONS: dict[str, QuestDefinition] = {
    "first_steps": QuestDefinition(
        quest_key="first_steps",
        title="Первые шаги",
        description="Познакомьтесь с базовыми действиями ухода",
        steps=[
            QuestStepDefinition(
                metric="action:feed",
                title="Покормить 2 раза",
                description="Накормите питомца дважды",
                target=2,
                reward_coins=30,
                reward_xp=12,
            ),
            QuestStepDefinition(
                metric="action:wash",
                title="Помыть 1 раз",
                description="Сделайте питомца чистым",
                target=1,
                reward_coins=20,
                reward_xp=10,
            ),
            QuestStepDefinition(
                metric="action:play",
                title="Поиграть 1 раз",
                description="Порадуйте питомца игрой",
                target=1,
                reward_coins=35,
                reward_xp=14,
            ),
        ],
    ),
    "stockpile": QuestDefinition(
        quest_key="stockpile",
        title="Запасливый",
        description="Научитесь пользоваться магазином и предметами",
        steps=[
            QuestStepDefinition(
                metric="shop_buy",
                title="Купить 2 предмета",
                description="Сделайте две покупки в магазине",
                target=2,
                reward_coins=25,
                reward_xp=10,
            ),
            QuestStepDefinition(
                metric="use_item",
                title="Использовать 2 предмета",
                description="Примените два предмета из инвентаря",
                target=2,
                reward_coins=30,
                reward_xp=12,
            ),
            QuestStepDefinition(
                metric="action:heal",
                title="Вылечить 1 раз",
                description="Позаботьтесь о здоровье питомца",
                target=1,
                reward_coins=40,
                reward_xp=16,
            ),
        ],
    ),
    "minigames": QuestDefinition(
        quest_key="minigames",
        title="Игрок",
        description="Тренируйтесь в мини-играх",
        steps=[
            QuestStepDefinition(
                metric="minigame",
                title="Сыграть 1 мини-игру",
                description="Пройдите любую мини-игру",
                target=1,
                reward_coins=25,
                reward_xp=10,
            ),
            QuestStepDefinition(
                metric="minigame",
                title="Сыграть 3 мини-игры",
                description="Пройдите ещё две мини-игры",
                target=3,
                reward_coins=45,
                reward_xp=18,
            ),
            QuestStepDefinition(
                metric="minigame",
                title="Сыграть 5 мини-игр",
                description="Станьте настоящим игроманом",
                target=5,
                reward_coins=70,
                reward_xp=25,
            ),
        ],
    ),
    "festival": QuestDefinition(
        quest_key="festival",
        title="Праздник",
        description="Набирайте очки активности для события",
        steps=[
            QuestStepDefinition(
                metric="event_points",
                title="Набрать 5 очков события",
                description="Очки начисляются за действия и мини-игры",
                target=5,
                reward_coins=35,
                reward_xp=14,
            ),
            QuestStepDefinition(
                metric="event_points",
                title="Набрать 15 очков события",
                description="Продолжайте заботиться о питомце",
                target=15,
                reward_coins=75,
                reward_xp=28,
            ),
            QuestStepDefinition(
                metric="event_points",
                title="Набрать 30 очков события",
                description="Дожмите прогресс до рубежа",
                target=30,
                reward_coins=120,
                reward_xp=45,
            ),
        ],
    ),
}


def get_quest_definition(quest_key: str) -> QuestDefinition:
    quest = QUEST_DEFINITIONS.get(quest_key)
    if quest is None:
        raise ValueError("Квест не найден")
    return quest


def list_quests(db: Session, user_id: int) -> list[dict[str, object]]:
    rows = {
        row.quest_key: row
        for row in db.execute(select(QuestProgress).where(QuestProgress.user_id == user_id)).scalars()
    }

    payload: list[dict[str, object]] = []
    for quest_key, quest in QUEST_DEFINITIONS.items():
        row = rows.get(quest_key)
        current_step_index = int(row.current_step_index) if row is not None else 0
        step_progress = int(row.step_progress) if row is not None else 0
        step_completed_at = row.step_completed_at if row is not None else None
        step_claimed_at = row.step_claimed_at if row is not None else None
        quest_completed_at = row.quest_completed_at if row is not None else None

        steps_payload: list[dict[str, object]] = []
        for idx, step in enumerate(quest.steps):
            if quest_completed_at is not None:
                steps_payload.append(
                    {
                        "index": idx,
                        "title": step.title,
                        "description": step.description,
                        "target": step.target,
                        "reward_coins": step.reward_coins,
                        "reward_xp": step.reward_xp,
                        "progress": step.target,
                        "completed": True,
                        "claimed": True,
                        "locked": False,
                    }
                )
                continue

            if idx < current_step_index:
                steps_payload.append(
                    {
                        "index": idx,
                        "title": step.title,
                        "description": step.description,
                        "target": step.target,
                        "reward_coins": step.reward_coins,
                        "reward_xp": step.reward_xp,
                        "progress": step.target,
                        "completed": True,
                        "claimed": True,
                        "locked": False,
                    }
                )
                continue

            if idx == current_step_index:
                progress = max(0, min(step.target, step_progress))
                completed = step_completed_at is not None or progress >= step.target
                claimed = step_claimed_at is not None
                steps_payload.append(
                    {
                        "index": idx,
                        "title": step.title,
                        "description": step.description,
                        "target": step.target,
                        "reward_coins": step.reward_coins,
                        "reward_xp": step.reward_xp,
                        "progress": progress,
                        "completed": completed,
                        "claimed": claimed,
                        "locked": False,
                    }
                )
                continue

            steps_payload.append(
                {
                    "index": idx,
                    "title": step.title,
                    "description": step.description,
                    "target": step.target,
                    "reward_coins": step.reward_coins,
                    "reward_xp": step.reward_xp,
                    "progress": 0,
                    "completed": False,
                    "claimed": False,
                    "locked": True,
                }
            )

        payload.append(
            {
                "quest_key": quest.quest_key,
                "title": quest.title,
                "description": quest.description,
                "completed": quest_completed_at is not None,
                "steps": steps_payload,
            }
        )

    return payload


def _get_or_create_quest_progress(db: Session, user_id: int, quest_key: str) -> QuestProgress:
    row = db.execute(
        select(QuestProgress).where(QuestProgress.user_id == user_id, QuestProgress.quest_key == quest_key)
    ).scalar_one_or_none()
    if row is not None:
        return row

    row = QuestProgress(
        user_id=user_id,
        quest_key=quest_key,
        current_step_index=0,
        step_progress=0,
        step_completed_at=None,
        step_claimed_at=None,
        quest_completed_at=None,
    )
    db.add(row)
    db.flush()
    return row


def apply_quest_metric(db: Session, user_id: int, event_metric: str, delta: int = 1) -> list[str]:
    if delta <= 0:
        return []

    notifications: list[str] = []
    for quest in QUEST_DEFINITIONS.values():
        row = _get_or_create_quest_progress(db, user_id, quest.quest_key)
        if row.quest_completed_at is not None:
            continue
        if row.current_step_index >= len(quest.steps):
            continue

        step = quest.steps[row.current_step_index]
        if not _metric_matches(step.metric, event_metric):
            continue

        if row.step_claimed_at is not None:
            continue

        if row.step_completed_at is not None:
            continue

        before = int(row.step_progress)
        after = max(0, min(step.target, before + delta))
        row.step_progress = after
        if after >= step.target:
            row.step_completed_at = _now()
            notifications.append(f"Квест: {quest.title} — шаг выполнен: {step.title}")
        db.add(row)

    db.flush()
    return notifications


def claim_current_step(db: Session, user_id: int, quest_key: str) -> QuestClaim:
    quest = get_quest_definition(quest_key)
    row = _get_or_create_quest_progress(db, user_id, quest_key)

    if row.quest_completed_at is not None:
        raise ValueError("Квест уже завершён")

    if row.current_step_index >= len(quest.steps):
        raise ValueError("Квест уже завершён")

    step = quest.steps[row.current_step_index]
    if (row.step_completed_at is None) and (int(row.step_progress) < step.target):
        raise ValueError("Награда квеста ещё недоступна")

    if row.step_claimed_at is not None:
        raise ValueError("Награда квеста уже получена")

    now = _now()
    row.step_completed_at = row.step_completed_at or now
    row.step_claimed_at = now

    step_index = int(row.current_step_index)
    quest_completed_now = False

    if step_index >= (len(quest.steps) - 1):
        row.quest_completed_at = now
        row.current_step_index = len(quest.steps)
        row.step_progress = step.target
        quest_completed_now = True
    else:
        row.current_step_index = step_index + 1
        row.step_progress = 0
        row.step_completed_at = None
        row.step_claimed_at = None

    db.add(row)
    db.flush()

    return QuestClaim(
        quest_key=quest_key,
        step_index=step_index,
        step_title=step.title,
        reward_coins=step.reward_coins,
        reward_xp=step.reward_xp,
        quest_completed_now=quest_completed_now,
    )
