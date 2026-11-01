# PlateUP: Recipe Finder & Meal Planner

Three separate codebases that work together. Each folder uses one language and can be read, tested and graded on its own.

| Folder | Language | Role |
|---|---|---|
| `database/` | **SQL (MySQL)** | Tables for users, pantry, meals and AI Chatbot history |
| `backend/` | **PHP 8.1+** | REST API: login, pantry, meals, profile, AI Chatbot, recipes |
| `android/` | **Kotlin (Jetpack Compose)** | The mobile app: photo scan, meals, AI Chatbot, recipes. Talks only to the PHP API |
| `DEPLOY.md` | n/a | Icon, release build, hosting and store publishing steps |

```
Android app (Kotlin)  --HTTP/JSON-->  PHP REST API  --SQL-->  MySQL
                                          |
                                          +--HTTPS-->  Google Gemini API  (AI Chatbot, recipes)
```

The AI key lives only on the PHP server, never in the phone app.

**Photo scan:** the app shrinks the photo, sends it to `POST /api/scan`, and the backend asks Gemini (vision) what food is in it. The result lists each item with estimated calories, health benefits, things to watch out for and storage tips, plus recipe ideas. The user can then get full recipes or save the items to the pantry. The Pantry tab only appears once the user has ingredients.

## Run order

**Easiest (Docker):** `cp .env.example .env`, put your `GEMINI_API_KEY` in it, then `docker compose up --build`. This starts MySQL and the PHP API together. Check http://localhost:8000/api/health

**Without Docker:**
1. Database: `mysql -u root -p < database/schema.sql`, then create the app user (see the bottom of `schema.sql`).
2. Backend: `cd backend && cp .env.example .env`, fill in `DB_*` and `GEMINI_API_KEY`, then `php -S 0.0.0.0:8000 -t public public/index.php`.

**Then Android:** open `android/` in Android Studio and run on an emulator.

Use **Visual Studio Code** for `backend/` and `database/` (open this root folder, then Terminal → Run Task). The Kotlin app needs **Android Studio**.

To add your icon, publish, and host the backend, read `DEPLOY.md`.

## AI Chatbot API

The PHP backend (`backend/src/Gemini.php`) calls Google's Gemini API:

`POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent`

Get a key at https://aistudio.google.com/apikey. Model docs: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash

## Status

Written but **not yet run or compiled**: the build environment had no PHP, MySQL, Android SDK or internet. Expect to fix small
errors on the first run (for example Gradle dependency versions that Android Studio offers to update).

## Authorship and AI use

AI tools were used to help write this project. Record here, in your own words, how AI was used, as your school or employer requires.
