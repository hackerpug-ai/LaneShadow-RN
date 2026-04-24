import java.io.File

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.plugin.serialization")
}

// Generate secrets.xml from environment variables before build
val generateSecretsXml by tasks.registering {
    val outputFile = file("src/main/res/values/secrets.xml")
    outputs.file(outputFile)
    doLast {
        val token = System.getenv("MAPBOX_ACCESS_TOKEN") ?: ""
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
        buildConfigField("String", "CONVEX_DEPLOYMENT", "\"${readConvexDeployment()}\"")
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
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("dev.chrisbanes.haze:haze:1.7.1")
    implementation("com.google.android.material:material:1.12.0")

    // Coil 3 for image loading
    implementation("io.coil-kt.coil3:coil-compose:3.0.4")
    implementation("io.coil-kt.coil3:coil-network-okhttp:3.0.4")

    // Coroutines for async operations
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.8.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.8.1")

    // Kotlinx Serialization for JSON parsing
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.3")

    // Mapbox Maps SDK for Android (commented out - requires MAPBOX_DOWNLOADS_TOKEN)
    // implementation("com.mapbox.maps:android:2.14.0")

    testImplementation("junit:junit:4.13.2")
    testImplementation(project(":theme"))
    testImplementation("androidx.compose.ui:ui-test-junit4")
    testImplementation("androidx.test.ext:junit:1.2.1")
    testImplementation("androidx.test:core:1.5.0")
    testImplementation("androidx.test:runner:1.5.2")
    testImplementation("org.robolectric:robolectric:4.11.1")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
    testImplementation("org.mockito:mockito-core:5.7.0")
    testImplementation("org.mockito:mockito-inline:5.2.0")

    androidTestImplementation(platform("androidx.compose:compose-bom:2024.06.00"))
    androidTestImplementation("androidx.test.ext:junit:1.2.1")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")

    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
    debugImplementation("com.nativesandbox:library")
}
