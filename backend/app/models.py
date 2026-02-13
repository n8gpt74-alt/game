from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, DateTime, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class PetState(Base):
    __tablename__ = "pet_states"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)

    name: Mapped[str] = mapped_column(String(64), default="Единорог", nullable=False)
    stage: Mapped[str] = mapped_column(String(16), default="baby", nullable=False)
    level: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    xp: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    coins: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    intelligence: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    crystals: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    hunger: Mapped[int] = mapped_column(Integer, default=80, nullable=False)
    hygiene: Mapped[int] = mapped_column(Integer, default=80, nullable=False)
    happiness: Mapped[int] = mapped_column(Integer, default=80, nullable=False)
    health: Mapped[int] = mapped_column(Integer, default=85, nullable=False)
    energy: Mapped[int] = mapped_column(Integer, default=85, nullable=False)

    behavior_state: Mapped[str] = mapped_column(String(32), default="Спокойный", nullable=False)

    last_active_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    last_tick_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


class EventLog(Base):
    __tablename__ = "event_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    action: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class Inventory(Base):
    __tablename__ = "inventories"
    __table_args__ = (UniqueConstraint("user_id", "item_key", name="uq_inventory_user_item"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    item_key: Mapped[str] = mapped_column(String(64), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


class Reward(Base):
    __tablename__ = "rewards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    xp_gained: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    coins_gained: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    intelligence_gained: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    crystals_gained: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    item_key: Mapped[str | None] = mapped_column(String(64), nullable=True)
    item_qty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    payload: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)


class DailyProgress(Base):
    __tablename__ = "daily_progress"
    __table_args__ = (UniqueConstraint("user_id", "date_key", name="uq_daily_user_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    date_key: Mapped[str] = mapped_column(String(16), nullable=False)
    tasks_json: Mapped[str] = mapped_column(String(4000), nullable=False)
    login_bonus_claimed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    chest_claimed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )


class NotificationSettings(Base):
    __tablename__ = "notification_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, unique=True, index=True, nullable=False)
    soft_push_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    daily_report_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
