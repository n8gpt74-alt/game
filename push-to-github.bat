@echo off
echo ========================================
echo   Push to GitHub
echo ========================================
echo.

cd /d "%~dp0"

echo Checking git status...
git status

echo.
echo Pushing to GitHub...
git push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   SUCCESS! Push completed!
    echo   Vercel will start deploying now...
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   ERROR! Push failed.
    echo   Please check your GitHub credentials.
    echo ========================================
)

echo.
pause
