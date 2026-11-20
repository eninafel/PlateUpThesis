# THISiSthEbaCKEND
The app's backend logic (it runs inside the app, no separate server).
- `LocalApi.kt`: register/login, profile, pantry, meals, chat history, photo scan, recipes. Talks to `AHHDATABASE`.
- `Gemini.kt`: calls Google Gemini for chat, scan and recipes. Key comes from `local.properties` (GEMINI_API_KEY).
- `ApiService.kt`, `ApiModels.kt`, `ApiClient.kt`: the list of calls, their data classes, and the shared instance.
- `ImageUtils.kt`: shrinks a photo before it is sent to Gemini.
