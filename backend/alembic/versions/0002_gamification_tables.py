"""gamification tables

Revision ID: 0002_gamification_tables
Revises: 0001_initial_schema
Create Date: 2026-02-15 00:00:00.000000

"""

from datetime import datetime, timezone

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0002_gamification_tables"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "streak_states",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("current_streak", sa.Integer(), nullable=False),
        sa.Column("best_streak", sa.Integer(), nullable=False),
        sa.Column("last_claim_date", sa.String(length=16), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_streak_states_user_id", "streak_states", ["user_id"], unique=True)

    op.create_table(
        "live_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_key", sa.String(length=64), nullable=False),
        sa.Column("title", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=256), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("target_points", sa.Integer(), nullable=False),
        sa.Column("reward_coins", sa.Integer(), nullable=False),
        sa.Column("reward_xp", sa.Integer(), nullable=False),
        sa.Column("is_enabled", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_live_events_event_key", "live_events", ["event_key"], unique=True)

    live_events_table = sa.table(
        "live_events",
        sa.column("event_key", sa.String),
        sa.column("title", sa.String),
        sa.column("description", sa.String),
        sa.column("starts_at", sa.DateTime(timezone=True)),
        sa.column("ends_at", sa.DateTime(timezone=True)),
        sa.column("target_points", sa.Integer),
        sa.column("reward_coins", sa.Integer),
        sa.column("reward_xp", sa.Integer),
        sa.column("is_enabled", sa.Boolean),
        sa.column("created_at", sa.DateTime(timezone=True)),
        sa.column("updated_at", sa.DateTime(timezone=True)),
    )

    now = datetime.now(timezone.utc)
    op.bulk_insert(
        live_events_table,
        [
            {
                "event_key": "spring_festival_2026",
                "title": "Весенний фестиваль",
                "description": "Наберите очки активности и получите редкую награду",
                "starts_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
                "ends_at": datetime(2027, 1, 1, tzinfo=timezone.utc),
                "target_points": 40,
                "reward_coins": 300,
                "reward_xp": 120,
                "is_enabled": True,
                "created_at": now,
                "updated_at": now,
            }
        ],
    )

    op.create_table(
        "event_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("event_key", sa.String(length=64), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "event_key", name="uq_event_progress_user_event"),
    )
    op.create_index("ix_event_progress_user_id", "event_progress", ["user_id"], unique=False)

    op.create_table(
        "achievement_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("achievement_key", sa.String(length=64), nullable=False),
        sa.Column("progress", sa.Integer(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "achievement_key", name="uq_achievement_progress_user_key"),
    )
    op.create_index("ix_achievement_progress_user_id", "achievement_progress", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_achievement_progress_user_id", table_name="achievement_progress")
    op.drop_table("achievement_progress")

    op.drop_index("ix_event_progress_user_id", table_name="event_progress")
    op.drop_table("event_progress")

    op.drop_index("ix_live_events_event_key", table_name="live_events")
    op.drop_table("live_events")

    op.drop_index("ix_streak_states_user_id", table_name="streak_states")
    op.drop_table("streak_states")
