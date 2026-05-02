package com.laneshadow.navigation

import com.google.common.truth.Truth.assertThat
import java.io.File
import org.junit.Test

class AuthRootNavigationContractTest {
    @Test
    fun mainGraphRoutesHomeThroughIdleRouteWithoutMockDrivenIdleScreen() {
        val source = File("src/main/java/com/laneshadow/navigation/MainNavGraph.kt").readText()

        assertThat(source).contains("composable<Route.Home>")
        assertThat(source).contains("HomeRoute(")
        assertThat(source).contains("IdleRoute(")
        assertThat(source).contains("auth_landing_root")
        assertThat(source).contains("auth_landing_logout")
        assertThat(source).doesNotContain("IdleMockProvider")
        assertThat(source).doesNotContain("IdleScreen(")
    }

    @Test
    fun unauthenticatedConvexErrorsRedirectThroughAuthScreenRouteState() {
        val providerSource = File("src/main/java/com/laneshadow/services/ConvexClientProvider.kt").readText()
        val authGraphSource = File("src/main/java/com/laneshadow/navigation/AuthNavGraph.kt").readText()

        assertThat(providerSource).contains("UNAUTHENTICATED")
        assertThat(providerSource).contains("handleUnauthenticated")
        assertThat(authGraphSource).contains("Route.SignIn")
        assertThat(authGraphSource).contains("AuthScreen")
    }

    @Test
    fun verificationRequiredAuthStateNavigatesToVerifyRoute() {
        val authGraphSource = File("src/main/java/com/laneshadow/navigation/AuthNavGraph.kt").readText()

        assertThat(authGraphSource).contains("AuthState.VerificationRequired")
        assertThat(authGraphSource).contains("navController.navigate(Route.Verify)")
        assertThat(authGraphSource).contains("auth_verify_root")
        assertThat(authGraphSource).contains("auth_verify_code_input")
        assertThat(authGraphSource).contains("auth_verify_submit")
    }
}
