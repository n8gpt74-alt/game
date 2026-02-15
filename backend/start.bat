@echo off
set DATABASE_URL=sqlite:///./local_run.db
set ALLOW_DEV_AUTH=true
set SECRET_KEY=dev-secret-not-for-prod
set DEV_AUTH_USER_ID=10001
set DECAY_CAP_SECONDS=21600
python -m app.migrations && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
