# Backend (PHP 8.1+ REST API)

Only PHP lives here. It sits between the Android app and the MySQL database, and it is the only part that knows the AI key.

```
cp .env.example .env        # fill in DB_* and GEMINI_API_KEY
php -S 0.0.0.0:8000 -t public public/index.php
```

Needs PHP 8.1+ with the `pdo_mysql` and `curl` extensions. Create the database first (`../database/schema.sql`).

## Endpoints

All except `health`, `register` and `login` need the header `Authorization: Bearer <token>`.

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Server up? Is the AI key set? |
| POST | `/api/auth/register` | `{name, email, password}` → `{token, user}` |
| POST | `/api/auth/login` | `{email, password}` → `{token, user}` |
| GET / PUT | `/api/profile` | Read / update name, calorie goal, diet, allergies |
| GET / POST | `/api/pantry` | List / add ingredients (`expiry_days` sets the expiry date) |
| DELETE | `/api/pantry/{id}` | Remove an ingredient |
| GET / POST | `/api/meals` | List meals for `?date=YYYY-MM-DD` with total calories / log a meal |
| DELETE | `/api/meals/{id}` | Remove a meal |
| POST | `/api/chat` | `{message}` → `{reply}` (AI Chatbot, remembers history) |
| GET / DELETE | `/api/chat/history` | Read / clear chat history |
| POST | `/api/scan` | `{image_base64}` (JPEG/PNG/WebP; the server detects the type) → ingredients seen in the photo (calories, health benefits, health concerns, storage tips) plus up to 3 recommended dishes built from them, ranked by how many of the scanned ingredients they use |
| POST | `/api/recipes/recommend` | AI recipes from `{ingredients:[...]}` if sent, otherwise from the saved pantry |

## AI Chatbot API

The backend calls Google's Gemini API (`src/Gemini.php`):

`POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`

Key: https://aistudio.google.com/apikey. Change the model with `GEMINI_MODEL` in `.env`.

## AI limits

Chat, photo scans and recipes each count as one AI request. `AI_DAILY_LIMIT` in `.env` (default 60) caps requests per user per day. The server answers with HTTP 429 after that.
Photos are checked (real JPEG/PNG/WebP, under about 5 MB) and are **not stored**. They are only forwarded to Gemini for that request.

## Security notes

- Passwords are stored with `password_hash`. Login tokens are stored only as SHA-256 hashes and expire after 30 days.
- Every query uses prepared statements and filters by the logged-in user's id.
- There is no login rate limiting and no HTTPS here. Put it behind HTTPS and add rate limiting before any real deployment.
