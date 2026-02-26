@echo off
echo Starting Backend...
start powershell -ExecutionPolicy Bypass -File start-backend.ps1

echo Starting Frontend...
start powershell -ExecutionPolicy Bypass -File start-frontend.ps1

echo Both servers are starting up in separate windows!
echo Backend will be available at http://127.0.0.1:8000
echo Frontend will be available at http://127.0.0.1:5173 
pause
