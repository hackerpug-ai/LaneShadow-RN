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

rootProject.name = "LaneShadowAndroid"
include(":app")
include(":theme")
project(":theme").projectDir = file("../tokens/platforms/kotlin")

// Composite build: bring in ~/Projects/native-theme's :primitives module so
// :theme can depend on "dev.nativetheme:primitives" with automatic substitution.
includeBuild("../../native-theme/platforms/kotlin")
