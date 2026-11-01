# PlateUP web demo (browser preview of the app inside an Android-style phone)

This is a separate TypeScript demo. It does **not** use the PHP backend, MySQL or Kotlin. The real three-part project is in `../database`, `../backend` and `../android`.

One project that combines the two uploads:

- **Android emulator** (Pixel-style phone, lock screen, home launcher, 3-button nav, power/volume keys). It opens straight to the home screen, and **tapping the PlateUP icon launches the app**.
- **PlateUP app** inside the phone: Home/Discover, **AI Chatbot** (AI chatbot), Camera scanner, Recipes, Pantry (with Waste Prevention panel) and Meal History.

## Run it

```bash
npm install
cp .env.example .env      # then paste your key into GEMINI_API_KEY
npm run dev               # http://localhost:3000
```

Without a key everything still opens, but AI Chatbot says it is offline and scan/recipes show clearly labelled sample data.

## AI Chatbot API

AI Chatbot talks to **Google's Gemini API** through this project's own server. The key never reaches the browser.

| Step | URL |
|---|---|
| App → your server | `POST /api/chat` (`server.ts`) |
| Server → Google | `POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent` |
| Get a key | https://aistudio.google.com/apikey |
| Model docs | https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash |

The model is `gemini-3.8-flash` by default. Change it with `GEMINI_MODEL` in `.env`. `GET /api/health` shows whether the key was detected.

Other AI endpoints (same key and model): `/api/scan-ingredients`, `/api/recommend-recipes`, `/api/analyze-meal`.
