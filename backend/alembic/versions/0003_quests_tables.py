"""quests tables

Revision ID: 0003_quests_tables
Revises: 0002_gamification_tables
Create Date: 2026-02-16 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0003_quests_tables"
down_revision: Union[str, None] = "0002_gamification_tables"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "quest_progress",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("quest_key", sa.String(length=64), nullable=False),
        sa.Column("current_step_index", sa.Integer(), nullable=False),
        sa.Column("step_progress", sa.Integer(), nullable=False),
        sa.Column("step_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("step_claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("quest_completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "quest_key", name="uq_quest_progress_user_key"),
    )
    op.create_index("ix_quest_progress_user_id", "quest_progress", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_quest_progress_user_id", table_name="quest_progress")
    op.drop_table("quest_progress")
