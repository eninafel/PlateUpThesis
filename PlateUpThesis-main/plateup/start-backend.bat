@echo off
cd /d "%~dp0"
echo ==== PlateUP backend starter ====
echo.

docker --version >nul 2>&1
if errorlevel 1 (
  echo Docker is not installed or not running.
  echo Install Docker Desktop from https://www.docker.com/products/docker-desktop/
  echo then open it, wait for "Engine running", and double-click this file again.
  pause
  exit /b 1
)

if not exist ".env" (
  (
  echo GEMINI_API_KEY=
  echo GEMINI_MODEL=gemini-3.8-flash
  echo DB_PASS=change-this-password
  echo MYSQL_ROOT_PASSWORD=change-this-too
  echo APP_TIMEZONE=Asia/Manila
  echo AI_DAILY_LIMIT=60
  ) > ".env"
  echo First run: created the settings file.
  set /p KEY=Paste your Gemini API key and press Enter ^(or just press Enter to skip^): 
  if defined KEY powershell -NoProfile -Command "(Get-Content '.env') -replace '^GEMINI_API_KEY=.*','GEMINI_API_KEY=%KEY%' | Set-Content '.env'"
  echo.
)

echo Starting the database and the PHP backend. The first time takes a few minutes...
docker compose up -d --build
if errorlevel 1 (
  echo.
  echo Something went wrong. Make sure Docker Desktop shows "Engine running", then try again.
  pause
  exit /b 1
)

timeout /t 8 /nobreak >nul
start "" http://localhost:8000/api/health
echo.
echo DONE. The backend is running. Your browser should show "ok": true.
echo.
echo Next: open the "android" folder in Android Studio and press the green Run button.
echo To stop the backend later, double-click stop-backend.bat
pause
