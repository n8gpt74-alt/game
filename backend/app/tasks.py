from datetime import UTC, datetime

from celery.utils.log import get_task_logger
from sqlalchemy import select

from app.celery_app import celery_app
from app.database import SessionLocal
from app.models import EventLog, NotificationSettings, PetState
from app.services.game import run_decay, serialize_pet_state


logger = get_task_logger(__name__)


@celery_app.task
def decay_all_pets() -> int:
    updated = 0
    with SessionLocal() as db:
        pets = db.execute(select(PetState)).scalars().all()
        for pet in pets:
            seconds = run_decay(db, pet)
            if seconds > 0:
                updated += 1
    logger.info("decay_all_pets updated=%s", updated)
    return updated


@celery_app.task
def soft_push_notifications() -> int:
    created = 0
    now_iso = datetime.now(UTC).isoformat()
    with SessionLocal() as db:
        pets = db.execute(select(PetState)).scalars().all()
        for pet in pets:
            settings = db.execute(
                select(NotificationSettings).where(NotificationSettings.user_id == pet.user_id)
            ).scalar_one_or_none()
            if not settings or not settings.soft_push_enabled:
                continue

            messages: list[str] = []
            if pet.hunger < 30:
                messages.append("Единорог проголодался")
            if pet.energy < 20:
                messages.append("Единорог устал")
            if pet.hygiene < 30:
                messages.append("Единорогу нужна ванна")
            if pet.health < 40:
                messages.append("Единорогу нужно лечение")

            if not messages:
                continue
            db.add(
                EventLog(
                    user_id=pet.user_id,
                    action="мягкое_уведомление",
                    payload={"messages": messages, "created_by": "beat", "time": now_iso},
                )
            )
            created += 1
        db.commit()
    logger.info("soft_push_notifications created=%s", created)
    return created


@celery_app.task
def daily_report() -> int:
    created = 0
    with SessionLocal() as db:
        pets = db.execute(select(PetState)).scalars().all()
        for pet in pets:
            settings = db.execute(
                select(NotificationSettings).where(NotificationSettings.user_id == pet.user_id)
            ).scalar_one_or_none()
            if not settings or not settings.daily_report_enabled:
                continue
            db.add(
                EventLog(
                    user_id=pet.user_id,
                    action="ежедневный_отчёт",
                    payload={"summary": serialize_pet_state(pet), "created_by": "beat"},
                )
            )
            created += 1
        db.commit()
    logger.info("daily_report created=%s", created)
    return created
