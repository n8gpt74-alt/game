$env:VITE_API_BASE='http://127.0.0.1:8000'
$env:VITE_DEV_AUTH_USER_ID='10001'

Set-Location frontend
npm run dev -- --host 127.0.0.1 --port 5173
