# AHHDATABASE
SQLite database for PlateUP.
- `src/main/assets/plateup_schema.sql`: all tables (users, pantry_items, chat_messages, ai_usage). Edit this file to change the database.
- `src/main/java/com/plateup/database/PlateUpDb.kt`: reads the schema and creates `plateup.db` on the phone the first time the app starts.
If you change the schema after the app was already installed, uninstall the app (or clear its storage) so the database is created again.
