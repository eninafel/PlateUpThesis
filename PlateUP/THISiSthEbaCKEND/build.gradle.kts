import java.util.Properties

plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
}

// Optional AI key: add GEMINI_API_KEY=... (and optionally GEMINI_MODEL=...) to local.properties in the project root.
// Without it the app still works; only chat, photo scan and AI recipes are switched off.
val localProps = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}
val geminiKey: String = localProps.getProperty("GEMINI_API_KEY", "").trim()
val geminiModel: String = localProps.getProperty("GEMINI_MODEL", "gemini-3.8-flash").trim()

android {
    namespace = "com.plateup.backend"
    compileSdk = 35

    defaultConfig {
        minSdk = 26
        buildConfigField("String", "GEMINI_API_KEY", "\"$geminiKey\"")
        buildConfigField("String", "GEMINI_MODEL", "\"$geminiModel\"")
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        buildConfig = true
    }
}

dependencies {
    implementation(project(":AHHDATABASE"))

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.exifinterface)
    implementation(libs.okhttp)

    // The frontend uses these through the backend's classes.
    api(libs.gson)
    api(libs.kotlinx.coroutines.android)
}
