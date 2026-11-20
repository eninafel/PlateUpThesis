pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PlateUP"

// The three parts of the project:
include(":AHHDATABASE")         // database: schema + code that opens it
include(":THISiSthEbaCKEND")    // backend: login, pantry, chat, scan, recipes (+ Gemini)
include(":ANDROIDAHHFRONTEND")  // frontend: the screens (Jetpack Compose)
