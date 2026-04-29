package com.laneshadow.appshell

import com.google.common.truth.Truth.assertThat
import java.io.File
import org.junit.Test

class MainActivityShellContractTest {
    private fun root(): File = File(System.getProperty("user.dir")).resolve("..").normalize()
    private fun read(path: String): String = root().resolve(path).readText()

    @Test
    fun ac1_applicationClassAnnotatedAndManifestRegistered() {
        val appFile = root().resolve("app/src/main/java/com/laneshadow/LaneShadowApplication.kt")
        assertThat(appFile.exists()).isTrue()
        val app = appFile.readText()
        assertThat(app).contains("@HiltAndroidApp")
        assertThat(app).contains("class LaneShadowApplication")

        val manifest = read("app/src/main/AndroidManifest.xml")
        assertThat(manifest).contains("android:name=\".LaneShadowApplication\"")
    }

    @Test
    fun ac2_mainActivityAndroidEntryPointAndSetsLaneShadowApp() {
        val activity = read("app/src/main/java/com/laneshadow/MainActivity.kt")
        assertThat(activity).contains("@AndroidEntryPoint")
        assertThat(activity).contains("LaneShadowApp(")
    }

    @Test
    fun ac3_laneShadowAppObservesAuthViewModelAuthState() {
        val shell = read("app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt")
        assertThat(shell).contains("AuthViewModel")
        assertThat(shell).contains("authState")
    }

    @Test
    fun ac4_loadingShowsSplashScreen() {
        val shell = read("app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt")
        assertThat(shell).contains("AuthState.Loading")
        assertThat(shell).contains("SplashScreen(")
    }

    @Test
    fun ac5_signedOutRoutesToAuthNavGraph() {
        val shell = read("app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt")
        assertThat(shell).contains("AuthState.SignedOut")
        assertThat(shell).contains("AuthNavGraph(")
    }

    @Test
    fun ac6_signedInRoutesToMainNavGraph() {
        val shell = read("app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt")
        assertThat(shell).contains("AuthState.SignedIn")
        assertThat(shell).contains("MainNavGraph(")
    }

    @Test
    fun ac7_navigationComposeDependencyAdded() {
        val gradle = read("app/build.gradle.kts")
        assertThat(gradle).contains("androidx.navigation:navigation-compose")
    }

    @Test
    fun ac8_deepLinkBusPublishesOAuthEvents() {
        val bus = read("app/src/main/java/com/laneshadow/navigation/DeepLinkBus.kt")
        assertThat(bus).contains("object DeepLinkBus")
        assertThat(bus).contains("MutableSharedFlow")

        val activity = read("app/src/main/java/com/laneshadow/MainActivity.kt")
        assertThat(activity).contains("DeepLinkBus.publish")
    }

    @Test
    fun ac9_typedRoutesAndDebugSandboxPreserved() {
        val routes = read("app/src/main/java/com/laneshadow/navigation/Route.kt")
        assertThat("@Serializable".toRegex().findAll(routes).count()).isAtLeast(12)

        val activity = read("app/src/main/java/com/laneshadow/MainActivity.kt")
        assertThat(activity).contains("BuildConfig.DEBUG")
        assertThat(activity).contains("SandboxChecker")
    }
}
