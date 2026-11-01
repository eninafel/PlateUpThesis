# Android app (Kotlin + Jetpack Compose)

Only Kotlin lives here. The app has no database and no AI key. It starts with an empty pantry. It only calls the PHP backend.

## Open and run

1. Install Android Studio and open this `android/` folder. Let it sync Gradle (it downloads the dependencies and creates the Gradle wrapper files).
2. Start the PHP backend (see `../backend/README.md`) on port 8000.
3. Run the app on an emulator. The address `http://10.0.2.2:8000/` in `app/build.gradle.kts` (`API_BASE_URL`) is how the emulator reaches your computer.
   On a real phone, change it to your computer's LAN address, for example `http://192.168.1.20:8000/`.

## Structure

| File | Role |
|---|---|
| `data/ApiModels.kt` | Data classes that match the backend's JSON |
| `data/ApiService.kt` | One function per backend endpoint (Retrofit) |
| `data/ImageUtils.kt` | Shrinks and rotates a photo, encodes it for the upload |
| `data/ApiClient.kt` | Retrofit setup, login-token storage, readable error messages |
| `ui/PlateUpViewModel.kt` | All app state and every call to the backend |
| `ui/PlateUpApp.kt` | Login gate and the 5 bottom tabs |
| `ui/AuthScreen.kt` | Log in / create account |
| `ui/ScanScreen.kt` | Photo scan (camera or gallery), results with calories, health benefits and warnings, recipe ideas |
| `ui/PantryScreen.kt` | Ingredients and the "use soon" warning. The tab only appears once the user has added or scanned an ingredient |
| `ui/MealsScreen.kt` | Daily calories and meal log |
| `ui/ChatScreen.kt` | AI Chatbot |
| `ui/RecipesScreen.kt` | AI recipes from your pantry |
| `ui/ProfileScreen.kt` | Calorie goal, diet, allergies, log out |

The app allows plain `http` for local development only (`usesCleartextTraffic` in the manifest). Use https for anything real.

## Editing it yourself

This is an ordinary Android Studio / Gradle project. You can open, edit and run every file, add screens, and change colors (`ui/Theme.kt`).
When the backend changes, update the matching class in `data/ApiModels.kt` and the call in `data/ApiService.kt`.
