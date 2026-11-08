# PlateUP (standalone Android app)

Everything runs inside the app. No XAMPP, Docker, PHP or MySQL.

## Run it
1. Android Studio -> File -> Open -> choose THIS folder (the one that contains `app/` and `settings.gradle.kts`).
2. Wait for Gradle sync to finish (first time needs internet).
3. Pick an emulator (Tools -> Device Manager -> Create Device) or plug in a phone, then press the green Run button.

Create an account in the app. Accounts, pantry, meals and chat history are saved in a SQLite
database file (`plateup.db`) on the device. Uninstalling the app or clearing its storage deletes it.

## Optional: switch on the AI features
Chat, photo scan and AI recipes call Google Gemini. Get a free key at https://aistudio.google.com/apikey, then add to
`local.properties` (in this folder, created by Android Studio):

    GEMINI_API_KEY=your-key-here

Sync/rebuild and run again. Without a key everything else still works and the AI buttons show a short message.
The AI features need internet on the phone/emulator.

## Look at the database
View -> Tool Windows -> App Inspection -> Database Inspector (while the app runs on an emulator or a
phone with Android 8+), choose `plateup.db`.

## What changed from the PHP version
| Before | Now |
|---|---|
| PHP API + MySQL | `data/LocalApi.kt` + `data/PlateUpDb.kt` (SQLite on the phone) |
| Gemini key on the server | `data/Gemini.kt` calls Gemini from the app, key from `local.properties` |
| Retrofit | removed |

The old server code is kept in `_old_server_version/` for reference only. The app does not use it.
