@echo off
cd /d "%~dp0"
set "XAMPP=C:\xampp"
echo ==== PlateUP backend starter (XAMPP, no Docker) ====
echo.

if not exist "%XAMPP%\php\php.exe" (
  echo XAMPP was not found in %XAMPP%.
  echo Install it from https://www.apachefriends.org with the default folder, then run this again.
  pause
  exit /b 1
)

"%XAMPP%\mysql\bin\mysql.exe" -uroot -e "SELECT 1" >nul 2>&1
if not errorlevel 1 goto dbready
echo Starting MySQL...
start "PlateUP MySQL" /min "%XAMPP%\mysql\bin\mysqld.exe" --defaults-file="%XAMPP%\mysql\bin\my.ini" --console
set TRIES=0
:waitdb
timeout /t 2 /nobreak >nul
set /a TRIES+=1
"%XAMPP%\mysql\bin\mysql.exe" -uroot -e "SELECT 1" >nul 2>&1
if not errorlevel 1 goto dbready
if %TRIES% GEQ 15 goto dbfail
goto waitdb

:dbfail
echo MySQL did not start. Open the XAMPP Control Panel, click Start next to MySQL, then run this again.
pause
exit /b 1

:dbready
echo MySQL is running. Setting up the database...
"%XAMPP%\mysql\bin\mysql.exe" -uroot < "database\schema.sql"
"%XAMPP%\mysql\bin\mysql.exe" -uroot -e "CREATE USER IF NOT EXISTS 'plateup_app'@'localhost' IDENTIFIED BY 'change-this-password'; CREATE USER IF NOT EXISTS 'plateup_app'@'127.0.0.1' IDENTIFIED BY 'change-this-password'; GRANT SELECT, INSERT, UPDATE, DELETE ON plateup.* TO 'plateup_app'@'localhost'; GRANT SELECT, INSERT, UPDATE, DELETE ON plateup.* TO 'plateup_app'@'127.0.0.1'; FLUSH PRIVILEGES;"
if errorlevel 1 (
  echo Could not set up the database user. Send this window's text to your helper.
  pause
  exit /b 1
)

if not exist "backend\.env" (
  (
  echo DB_HOST=127.0.0.1
  echo DB_PORT=3306
  echo DB_NAME=plateup
  echo DB_USER=plateup_app
  echo DB_PASS=change-this-password
  echo GEMINI_API_KEY=
  echo GEMINI_MODEL=gemini-3.8-flash
  echo APP_TIMEZONE=Asia/Manila
  echo AI_DAILY_LIMIT=60
  ) > "backend\.env"
  echo First run: created the settings file.
  set /p KEY=Paste your Gemini API key and press Enter ^(or just press Enter to skip^): 
  if defined KEY powershell -NoProfile -Command "(Get-Content 'backend\.env') -replace '^GEMINI_API_KEY=.*','GEMINI_API_KEY=%KEY%' | Set-Content 'backend\.env'"
  echo.
)

echo.
echo Starting the PHP backend on port 8000.
echo KEEP THIS WINDOW OPEN while you use the app. Close it to stop the backend.
echo Next: open the "android" folder in Android Studio and press the green Run button.
echo.
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:8000/api/health"
cd backend
"%XAMPP%\php\php.exe" -S 0.0.0.0:8000 -t public public/index.php
pause
