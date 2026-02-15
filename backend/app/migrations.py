from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import inspect

from app.database import engine


BASELINE_REVISION = "0001_initial_schema"
APP_TABLES = {
    "pet_states",
    "event_logs",
    "inventories",
    "rewards",
    "daily_progress",
    "notification_settings",
}


def _get_alembic_config() -> Config:
    backend_root = Path(__file__).resolve().parent.parent
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", str(backend_root / "alembic"))
    return config


def run_migrations() -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    config = _get_alembic_config()

    if "alembic_version" in existing_tables:
        command.upgrade(config, "head")
        return

    app_tables_present = APP_TABLES & existing_tables

    if not app_tables_present:
        command.upgrade(config, "head")
        return

    if app_tables_present != APP_TABLES:
        missing_tables = sorted(APP_TABLES - existing_tables)
        present_tables = sorted(app_tables_present)
        raise RuntimeError(
            "Detected partially initialized schema without alembic_version table. "
            f"Present: {present_tables}. Missing: {missing_tables}. "
            "Fix schema state manually, then run migrations."
        )

    command.stamp(config, BASELINE_REVISION)
    command.upgrade(config, "head")


if __name__ == "__main__":
    run_migrations()
