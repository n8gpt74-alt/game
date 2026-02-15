"""initial schema

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-02-15 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pet_states",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=64), nullable=False),
        sa.Column("stage", sa.String(length=16), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("xp", sa.Integer(), nullable=False),
        sa.Column("coins", sa.Integer(), nullable=False),
        sa.Column("intelligence", sa.Integer(), nullable=False),
        sa.Column("crystals", sa.Integer(), nullable=False),
        sa.Column("hunger", sa.Integer(), nullable=False),
        sa.Column("hygiene", sa.Integer(), nullable=False),
        sa.Column("happiness", sa.Integer(), nullable=False),
        sa.Column("health", sa.Integer(), nullable=False),
        sa.Column("energy", sa.Integer(), nullable=False),
        sa.Column("behavior_state", sa.String(length=32), nullable=False),
        sa.Column("character_courage", sa.Integer(), nullable=False),
        sa.Column("character_friendliness", sa.Integer(), nullable=False),
        sa.Column("character_energy", sa.Integer(), nullable=False),
        sa.Column("character_curiosity", sa.Integer(), nullable=False),
        sa.Column("character_tidiness", sa.Integer(), nullable=False),
        sa.Column("current_mood", sa.String(length=16), nullable=False),
        sa.Column("last_mood_update", sa.DateTime(timezone=True), nullable=False),
        sa.Column("birth_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("age_days", sa.Integer(), nullable=False),
        sa.Column("last_event_check", sa.DateTime(timezone=True), nullable=False),
        sa.Column("event_history", sa.JSON(), nullable=False),
        sa.Column("last_active_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_tick_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pet_states_user_id", "pet_states", ["user_id"], unique=True)

    op.create_table(
        "event_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("action", sa.String(length=64), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_event_logs_user_id", "event_logs", ["user_id"], unique=False)

    op.create_table(
        "inventories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("item_key", sa.String(length=64), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "item_key", name="uq_inventory_user_item"),
    )
    op.create_index("ix_inventories_user_id", "inventories", ["user_id"], unique=False)

    op.create_table(
        "rewards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=False),
        sa.Column("xp_gained", sa.Integer(), nullable=False),
        sa.Column("coins_gained", sa.Integer(), nullable=False),
        sa.Column("intelligence_gained", sa.Integer(), nullable=False),
        sa.Column("crystals_gained", sa.Integer(), nullable=False),
        sa.Column("item_key", sa.String(length=64), nullable=True),
        sa.Column("item_qty", sa.Integer(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rewards_user_id", "rewards", ["user_id"], unique=False)

    op.create_table(
        "daily_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("date_key", sa.String(length=16), nullable=False),
        sa.Column("tasks_json", sa.String(length=4000), nullable=False),
        sa.Column("login_bonus_claimed", sa.Boolean(), nullable=False),
        sa.Column("chest_claimed", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "date_key", name="uq_daily_user_date"),
    )
    op.create_index("ix_daily_progress_user_id", "daily_progress", ["user_id"], unique=False)

    op.create_table(
        "notification_settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("soft_push_enabled", sa.Boolean(), nullable=False),
        sa.Column("daily_report_enabled", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notification_settings_user_id", "notification_settings", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_notification_settings_user_id", table_name="notification_settings")
    op.drop_table("notification_settings")

    op.drop_index("ix_daily_progress_user_id", table_name="daily_progress")
    op.drop_table("daily_progress")

    op.drop_index("ix_rewards_user_id", table_name="rewards")
    op.drop_table("rewards")

    op.drop_index("ix_inventories_user_id", table_name="inventories")
    op.drop_table("inventories")

    op.drop_index("ix_event_logs_user_id", table_name="event_logs")
    op.drop_table("event_logs")

    op.drop_index("ix_pet_states_user_id", table_name="pet_states")
    op.drop_table("pet_states")
