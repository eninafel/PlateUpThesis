# Database (MySQL)

Only SQL lives here. No PHP and no Kotlin.

```
mysql -u root -p < schema.sql
```

| Table | Purpose |
|---|---|
| `users` | Accounts, calorie goal, diet, allergies (passwords stored as hashes) |
| `api_tokens` | Login sessions for the Android app (token hashes only) |
| `pantry_items` | Ingredients at home, with expiry date |
| `meals` | Meal log with calories and macros |
| `chat_messages` | AI Chatbot history |
| `ai_usage` | Daily count of AI calls per user (limits cost) |

Every table except `users` has a `user_id` foreign key, so each person only sees their own rows
(the PHP backend always filters by the logged-in user).

After importing, uncomment and run the `CREATE USER` / `GRANT` lines at the bottom of `schema.sql`
so the backend does not connect as `root`.

Already imported an older version? Run `schema.sql` again. Every table uses `IF NOT EXISTS`, so it only adds `ai_usage`.
With Docker, the schema only loads on a fresh volume: run `docker compose down -v` first (this erases the local database).
