package com.laneshadow.navigation

import com.google.common.truth.Truth.assertThat
import java.io.File
import org.junit.Test

class AuthRootNavigationContractTest {
    @Test
    fun mainGraphWaitsForConvexCurrentUserBeforeRenderingIdleScreenGreeting() {
        val source = File("src/main/java/com/laneshadow/navigation/MainNavGraph.kt").readText()

        assertThat(source).contains("getCurrentUser")
        assertThat(source).contains("displayName")
        assertThat(source).contains("IdleScreen(")
        assertThat(source).contains("Where are we riding today")
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
}
