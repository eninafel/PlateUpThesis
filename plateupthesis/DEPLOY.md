# From project to real app

Nothing here has been run yet. Treat each step as something to test.

## 1. Add your icon (Android Studio)

1. Open the `android/` folder in Android Studio and let Gradle sync.
2. Right-click `app/src/main/res` → New → Image Asset.
3. Icon type: *Launcher Icons (Adaptive and Legacy)*. Under *Foreground Layer*, choose your image (PNG or SVG, ideally 512×512 or larger).
4. Pick a background color or image, check the preview, then Finish. This replaces the green plate placeholder.
5. Change the app's name in `app/src/main/res/values/strings.xml` (`app_name`).
6. Change `applicationId` in `app/build.gradle.kts` to your own (for example `com.yourname.plateup`). It can't be changed after you publish.

Google Play also wants a 512×512 PNG store icon. You upload it in the Play Console listing.

## 2. Which program for which part

| Part | Use | Notes |
|---|---|---|
| `android/` (Kotlin) | **Android Studio** | The only supported way to build and run the Android app |
| `backend/` (PHP), `database/` (SQL) | **Visual Studio Code** | Open the project's root folder. Install the recommended extensions when asked. Run tasks from Terminal → Run Task |
| Running database + API | **Docker Desktop** | One command, no PHP or MySQL install |

Visual Studio (the purple Windows IDE) can open the files as plain text, but it can't build this Kotlin Android app.

## 3. Run the database and API on your computer

```
cp .env.example .env        (put your GEMINI_API_KEY in it)
docker compose up --build
```

Check http://localhost:8000/api/health. Then run the Android app in Android Studio on an emulator (debug builds already point at `http://10.0.2.2:8000/`). For a real phone on the same Wi-Fi, change the debug `API_BASE_URL` in `android/app/build.gradle.kts` to your computer's address, for example `http://192.168.1.20:8000/`.

## 4. Put the backend online

A phone can't reach your laptop once the app is released, so the PHP API and MySQL need a public home with **https**.

- Any PHP 8.1+ hosting with MySQL works (shared hosting with cPanel, or a VPS). Upload `backend/`, make `backend/public` the web root, import `database/schema.sql`, create `backend/.env`.
- Or deploy `backend/Dockerfile` to a container host and use a managed MySQL database.
- Needs PHP extensions `pdo_mysql` and `curl`.

Then set the release address in `android/app/build.gradle.kts` (`release` → `API_BASE_URL`).

Before real users arrive:

- AI requests (chat, photo scan, recipes) are capped per user per day by `AI_DAILY_LIMIT` in `.env` (default 60). Lower it if cost worries you, and check Google's current Gemini pricing and quotas.
- Add login rate limiting. Keep `.env` and keystores out of Git.
- Scanned photos are sent to Google's Gemini API and are not stored by this backend. Say that in your privacy policy.

## 5. Build the release

1. Create a signing key: Android Studio → Build → Generate Signed App Bundle / APK → Create new key store. Back it up somewhere safe.
2. Copy `android/keystore.properties.example` to `android/keystore.properties` and fill it in.
3. Build:
   - `./gradlew bundleRelease` makes `app/build/outputs/bundle/release/app-release.aab` (for Google Play)
   - `./gradlew assembleRelease` makes an `.apk` (for direct download)

## 6. Where to release it

| Where | Cost and rules | Good for |
|---|---|---|
| **Google Play Store** | $25 one-time developer fee. A new *personal* account (created after 13 Nov 2023) must run a closed test with at least 12 testers for 14 days before production, so plan roughly 3 weeks. Organization accounts skip the testing rule. | The normal public release |
| **Your own website or GitHub Releases** | Free. Upload the `.apk`. Users must allow "install unknown apps". Google is rolling out developer verification for apps installed outside Play, so check the current rules first. | Quick sharing, demos, your thesis panel |
| **Firebase App Distribution** | Free tester links | Your closed-test group before Play |
| Samsung Galaxy Store, Amazon Appstore, Huawei AppGallery, F-Droid | Each has its own sign-up and rules | Extra reach later |

The app is Android only. An iPhone version would be a separate build.

For Google Play you'll need: a privacy policy web page, the Data safety form, a content rating, screenshots, the 512×512 icon, and a 1024×500 feature graphic. Because the app has accounts and uses AI, say so in the listing. Google also expects apps with accounts to offer account deletion. This project doesn't have that yet, so check Play's current policy and add it.
