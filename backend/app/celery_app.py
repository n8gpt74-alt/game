from celery import Celery
from celery.schedules import crontab

from app.config import get_settings
from app.database import Base, engine


settings = get_settings()
Base.metadata.create_all(bind=engine)

celery_app = Celery(
    "tamagotchi",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

celery_app.conf.timezone = "UTC"
celery_app.conf.beat_schedule = {
    "decay-tick-every-10-min": {
        "task": "app.tasks.decay_all_pets",
        "schedule": 600.0,
    },
    "soft-push-every-20-min": {
        "task": "app.tasks.soft_push_notifications",
        "schedule": 1200.0,
    },
    "daily-report-at-7-utc": {
        "task": "app.tasks.daily_report",
        "schedule": crontab(hour=7, minute=0),
    },
}

celery_app.autodiscover_tasks(["app"])
