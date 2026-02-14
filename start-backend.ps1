$env:DATABASE_URL='sqlite:///./local_run.db'
$env:ALLOW_DEV_AUTH='true'
$env:SECRET_KEY='dev-secret-not-for-prod'
$env:DEV_AUTH_USER_ID='10001'
$env:DECAY_CAP_SECONDS='21600'

Set-Location backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
