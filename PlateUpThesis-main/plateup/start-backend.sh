#!/bin/sh
cd "$(dirname "$0")"
echo "==== PlateUP backend starter ===="
if ! docker --version >/dev/null 2>&1; then
  echo "Docker is not installed or not running. Install Docker Desktop, open it, then run this again."
  exit 1
fi
if [ ! -f .env ]; then
  printf "GEMINI_API_KEY=\nGEMINI_MODEL=gemini-3.8-flash\nDB_PASS=change-this-password\nMYSQL_ROOT_PASSWORD=change-this-too\nAPP_TIMEZONE=Asia/Manila\nAI_DAILY_LIMIT=60\n" > .env
  printf "Paste your Gemini API key and press Enter (or just press Enter to skip): "
  read KEY
  if [ -n "$KEY" ]; then
    sed -i.bak "s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=$KEY|" .env && rm -f .env.bak
  fi
fi
docker compose up -d --build || { echo "Something went wrong. Is Docker Desktop running?"; exit 1; }
sleep 8
echo "DONE. Open http://localhost:8000/api/health - it should show ok: true"
echo "Next: open the android folder in Android Studio and press the green Run button."
echo "To stop later: docker compose down"
