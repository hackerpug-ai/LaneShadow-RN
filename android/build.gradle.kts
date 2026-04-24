plugins {
    id("com.android.application") version "8.12.2" apply false
    id("com.android.library") version "8.12.2" apply false
    id("org.jetbrains.kotlin.android") version "2.2.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.2.21" apply false
    id("org.jetbrains.kotlin.plugin.serialization") version "2.2.21" apply false
}

tasks.register("detekt") {
    group = "verification"
    description = "Compatibility wrapper for Android lint validation in kb-run lanes."
    dependsOn(":app:lint", ":theme:lint")
}
