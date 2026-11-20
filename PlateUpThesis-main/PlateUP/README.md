# PlateUP

Three folders, one Android Studio project. No XAMPP, Docker, PHP or MySQL needed.

| Folder | What it is |
|---|---|
| `AHHDATABASE` | The database. `src/main/assets/plateup_schema.sql` holds the tables; `PlateUpDb.kt` creates/opens the SQLite file on the phone. |
| `THISiSthEbaCKEND` | The backend. Login, profile, pantry, meals, chat history, photo scan and recipes (`LocalApi.kt`), plus the Gemini AI calls (`Gemini.kt`). |
| `ANDROIDAHHFRONTEND` | The frontend. All screens (Jetpack Compose) and the ViewModel. This is the app you run. |

How they connect: `ANDROIDAHHFRONTEND` -> `THISiSthEbaCKEND` -> `AHHDATABASE`

## Run it
1. Android Studio -> File -> Open -> choose THIS folder (the one with `settings.gradle.kts`).
2. Wait for Gradle sync to finish (first time needs internet).
3. Make sure the run configuration at the top says `ANDROIDAHHFRONTEND`, pick an emulator or a phone, press Run.

## Optional: switch on the AI features
Chat, photo scan and AI recipes use Google Gemini (needs internet). Get a free key at https://aistudio.google.com/apikey and add this line to `local.properties` in this folder (Android Studio creates the file):

    GEMINI_API_KEY=your-key-here

Sync and run again. Without a key the rest of the app still works.

## See the database
While the app runs: View -> Tool Windows -> App Inspection -> Database Inspector -> `plateup.db`.
