"""
Migration script to add dragon growth system fields to existing database.
Run this once to update existing pet_states table.
"""
import os
from sqlalchemy import text

# Use SQLite for local development
os.environ["DATABASE_URL"] = "sqlite:///./local_run.db"

from app.database import engine


def migrate():
    """Add growth system fields to pet_states table"""
    print(f"Using database: {engine.url}")
    
    with engine.connect() as conn:
        # Check if table exists
        if "sqlite" in str(engine.url):
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='pet_states'"))
            if not result.fetchone():
                print("⚠️  Table pet_states does not exist. It will be created on next server start.")
                return
            
            # Check existing columns
            result = conn.execute(text("PRAGMA table_info(pet_states)"))
            existing_columns = {row[1] for row in result}
        else:
            # PostgreSQL
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name='pet_states'"
            ))
            existing_columns = {row[0] for row in result}
        
        migrations = []
        
        # Character System fields
        if "character_courage" not in existing_columns:
            migrations.append("ALTER TABLE pet_states ADD COLUMN character_courage INTEGER NOT NULL DEFAULT 50")
        if "character_friendliness" not in existing_columns:
            migrations.append("ALTER TABLE pet_states ADD COLUMN character_friendliness INTEGER NOT NULL DEFAULT 50")
        if "character_energy" not in existing_columns:
            migrations.append("ALTER TABLE pet_states ADD COLUMN character_energy INTEGER NOT NULL DEFAULT 50")
        if "character_curiosity" not in existing_columns:
            migrations.append("ALTER TABLE pet_states ADD COLUMN character_curiosity INTEGER NOT NULL DEFAULT 50")
        if "character_tidiness" not in existing_columns:
            migrations.append("ALTER TABLE pet_states ADD COLUMN character_tidiness INTEGER NOT NULL DEFAULT 50")
        
        # Mood System fields
        if "current_mood" not in existing_columns:
            migrations.append("ALTER TABLE pet_states ADD COLUMN current_mood VARCHAR(16) NOT NULL DEFAULT 'normal'")
        if "last_mood_update" not in existing_columns:
            if "sqlite" in str(engine.url):
                # SQLite doesn't support CURRENT_TIMESTAMP in ALTER TABLE, use datetime string
                migrations.append("ALTER TABLE pet_states ADD COLUMN last_mood_update TIMESTAMP")
                migrations.append("UPDATE pet_states SET last_mood_update = CURRENT_TIMESTAMP WHERE last_mood_update IS NULL")
            else:
                migrations.append("ALTER TABLE pet_states ADD COLUMN last_mood_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
        
        # Age System fields
        if "birth_date" not in existing_columns:
            if "sqlite" in str(engine.url):
                migrations.append("ALTER TABLE pet_states ADD COLUMN birth_date TIMESTAMP")
                migrations.append("UPDATE pet_states SET birth_date = CURRENT_TIMESTAMP WHERE birth_date IS NULL")
            else:
                migrations.append("ALTER TABLE pet_states ADD COLUMN birth_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
        if "age_days" not in existing_columns:
            migrations.append("ALTER TABLE pet_states ADD COLUMN age_days INTEGER NOT NULL DEFAULT 0")
        
        # Events System fields
        if "last_event_check" not in existing_columns:
            if "sqlite" in str(engine.url):
                migrations.append("ALTER TABLE pet_states ADD COLUMN last_event_check TIMESTAMP")
                migrations.append("UPDATE pet_states SET last_event_check = CURRENT_TIMESTAMP WHERE last_event_check IS NULL")
            else:
                migrations.append("ALTER TABLE pet_states ADD COLUMN last_event_check TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP")
        if "event_history" not in existing_columns:
            if "sqlite" in str(engine.url):
                migrations.append("ALTER TABLE pet_states ADD COLUMN event_history TEXT NOT NULL DEFAULT '{}'")
            else:
                migrations.append("ALTER TABLE pet_states ADD COLUMN event_history JSONB NOT NULL DEFAULT '{}'")
        
        # Execute migrations
        if migrations:
            print(f"Applying {len(migrations)} migrations...")
            for migration in migrations:
                print(f"  - {migration}")
                conn.execute(text(migration))
            conn.commit()
            print("✅ Migration completed successfully!")
        else:
            print("✅ All columns already exist, no migration needed.")


if __name__ == "__main__":
    migrate()
