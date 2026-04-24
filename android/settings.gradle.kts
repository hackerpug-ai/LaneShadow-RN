import java.io.File

fun readMapboxCredential(vararg keys: String): String {
    val envFiles = listOf(
        File(rootDir, "../.env.local"),
        File(rootDir, "../server/.env.local"),
        File(rootDir, ".env.local"),
    )

    fun readFromFile(file: File, key: String): String? =
        file.takeIf { it.exists() }
            ?.readLines()
            ?.map { it.trim() }
            ?.firstOrNull { line ->
                line.startsWith("$key=") && !line.startsWith("#")
            }
            ?.substringAfter("=")
            ?.substringBefore("#")
            ?.trim()
            ?.takeIf { it.isNotEmpty() }

    for (key in keys) {
        val gradleValue = providers.gradleProperty(key).orNull
        if (!gradleValue.isNullOrBlank()) {
            return gradleValue
        }

        val envValue = System.getenv(key)
        if (!envValue.isNullOrBlank()) {
            return envValue
        }

        val fileValue = envFiles.firstNotNullOfOrNull { readFromFile(it, key) }
        if (!fileValue.isNullOrBlank()) {
            return fileValue
        }
    }

    return ""
}

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
        maven {
            url = uri("https://api.mapbox.com/downloads/v2/releases/maven")
            credentials {
                username = "mapbox"
                // Prefer a dedicated downloads token, but allow the configured
                // access token as a fallback when the account token has both scopes.
                password = readMapboxCredential(
                    "MAPBOX_DOWNLOADS_TOKEN",
                    "MAPBOX_ACCESS_TOKEN",
                    "MAPBOX_PUBLIC_TOKEN"
                )
            }
        }
    }
}

rootProject.name = "LaneShadowAndroid"
include(":app")
include(":theme")
project(":theme").projectDir = file("../tokens/platforms/kotlin")

// Composite build: bring in ~/Projects/native-theme's :primitives module so
// :theme can depend on "dev.nativetheme:primitives" with automatic substitution.
includeBuild("../../native-theme/platforms/kotlin")

// Composite build: bring in ~/Projects/native-sandbox's :library module so
// :app (debug) can depend on "com.nativesandbox:library" with automatic substitution.
includeBuild("../../native-sandbox/android")
