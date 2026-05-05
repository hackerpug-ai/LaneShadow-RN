import java.io.File

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
    id("com.google.dagger.hilt.android")
    id("kotlin-kapt")
    id("com.dropbox.dropshots") version "0.6.0"
}

fun readEnvValue(vararg keys: String): String {
    val envFiles = listOf(
        File(rootDir, "../.env.local"),
        File(rootDir, "../server/.env.local"),
        File(rootDir, ".env.local"),
    )

    fun stripShellQuoting(raw: String): String {
        var value = raw.substringBefore("#").trim()
        if (value.length >= 2) {
            val first = value.first()
            val last = value.last()
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                value = value.substring(1, value.length - 1)
            }
        }
        return value
    }

    fun readFromFile(file: File, key: String): String? {
        if (!file.exists()) {
            return null
        }
        val line = file.readLines()
            .map { it.trim() }
            .firstOrNull { it.startsWith("$key=") && !it.startsWith("#") }
            ?: return null
        val value = stripShellQuoting(line.substringAfter("="))
        return value.takeIf { it.isNotEmpty() }
    }

    fun resolveReference(raw: String): String? {
        // Handles simple shell-style references like "$OTHER_KEY" so that
        // .env.local entries like CLERK_PUBLISHABLE_KEY="$EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"
        // resolve to the underlying value rather than passing the literal back.
        val match = Regex("^\\$\\{?([A-Za-z_][A-Za-z0-9_]*)\\}?$").find(raw) ?: return null
        val referenced = match.groupValues[1]
        val systemValue = System.getenv(referenced)
        if (!systemValue.isNullOrBlank()) {
            return systemValue
        }
        return envFiles.firstNotNullOfOrNull { readFromFile(it, referenced) }
    }

    for (key in keys) {
        val envValue = System.getenv(key)
        if (!envValue.isNullOrBlank()) {
            return envValue
        }

        val fileValue = envFiles.firstNotNullOfOrNull { readFromFile(it, key) }
        if (!fileValue.isNullOrBlank()) {
            return resolveReference(fileValue) ?: fileValue
        }
    }

    return ""
}

fun asBuildConfigString(raw: String): String =
    raw
        .replace("\\", "\\\\")
        .replace("\"", "\\\"")

// Generate secrets.xml from environment variables before build
val generateSecretsXml by tasks.registering {
    val outputFile = file("src/main/res/values/secrets.xml")
    outputs.file(outputFile)
    doLast {
        val token = readEnvValue("MAPBOX_ACCESS_TOKEN", "MAPBOX_PUBLIC_TOKEN")
        outputFile.parentFile.mkdirs()
        outputFile.writeText("""
            <?xml version="1.0" encoding="utf-8"?>
            <resources>
                <string name="mapbox_access_token">$token</string>
            </resources>
        """.trimIndent())
    }
}
tasks.named("preBuild") { dependsOn(generateSecretsXml) }

fun readConvexDeployment(): String {
    val envFile = listOf(
        File(rootDir, "../server/.env.local"),
        File(rootDir, "../../server/.env.local"),
        File(rootDir, "../../../server/.env.local")
    ).firstOrNull { it.exists() } ?: return ""

    return envFile.readLines()
        .map { it.trim() }
        .firstOrNull {
            it.startsWith("CONVEX_DEPLOYMENT=") &&
                !it.startsWith("#")
        }
        ?.substringAfter("=")
        ?.substringBefore("#")
        ?.substringBefore(" ")
        ?.trim()
        .orEmpty()
}

android {
    namespace = "com.laneshadow"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.laneshadow.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "CONVEX_DEPLOYMENT", "\"${asBuildConfigString(readConvexDeployment())}\"")
        buildConfigField("String", "CLERK_PUBLISHABLE_KEY", "\"${asBuildConfigString(readEnvValue("CLERK_PUBLISHABLE_KEY", "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY"))}\"")
        buildConfigField("String", "CLERK_OAUTH_START_URL", "\"${asBuildConfigString(readEnvValue("CLERK_OAUTH_START_URL"))}\"")
        buildConfigField("String", "CLERK_OAUTH_REDIRECT_URI", "\"laneshadow://oauth-callback\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    testOptions {
        unitTests {
            isIncludeAndroidResources = true
        }
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(project(":theme"))
    implementation(platform("androidx.compose:compose-bom:2024.06.00"))
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.3")
    implementation("androidx.activity:activity-compose:1.9.0")
    implementation("androidx.navigation:navigation-compose:2.8.0")
    implementation("androidx.hilt:hilt-navigation-compose:1.2.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("dev.chrisbanes.haze:haze:1.7.1")
    implementation("com.google.android.material:material:1.12.0")

    // Coil 3 for image loading
    implementation("io.coil-kt.coil3:coil-compose:3.0.4")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.0.4")

    // Coroutines for async operations
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-play-services:1.8.1")

    // Kotlinx Serialization for JSON parsing
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    implementation("com.mapbox.maps:android:11.22.0")
    implementation("dev.convex:android-convexmobile:0.8.0")
    implementation("com.clerk:clerk-android-api:1.0.13")
    implementation("androidx.security:security-crypto:1.1.0-alpha06")
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.browser:browser:1.8.0")
    implementation("com.google.android.gms:play-services-location:21.3.0")
    implementation("com.google.dagger:hilt-android:2.58")
    kapt("com.google.dagger:hilt-android-compiler:2.58")

    testImplementation("junit:junit:4.13.2")
    testImplementation(project(":theme"))
    testImplementation("androidx.compose.ui:ui-test-junit4")
    testImplementation("com.google.truth:truth:1.4.4")
    testImplementation("androidx.test.ext:junit:1.2.1")
    testImplementation("androidx.test:core:1.5.0")
    testImplementation("androidx.test:runner:1.5.2")
    testImplementation("org.robolectric:robolectric:4.11.1")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    testImplementation("org.mockito:mockito-core:5.7.0")
    testImplementation("org.mockito:mockito-inline:5.2.0")

    androidTestImplementation(platform("androidx.compose:compose-bom:2024.06.00"))
    androidTestImplementation("androidx.test:core:1.6.1")
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("com.dropbox.dropshots:dropshots:0.6.0")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    debugImplementation("com.nativesandbox:library")
}
