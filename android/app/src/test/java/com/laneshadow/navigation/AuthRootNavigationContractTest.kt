package com.laneshadow.navigation

import com.google.common.truth.Truth.assertThat
import java.io.File
import org.junit.Test

class AuthRootNavigationContractTest {
    @Test
    fun mainGraphRoutesHomeThroughIdleRouteWithoutMockDrivenIdleScreen() {
        val mainGraphSource = File("src/main/java/com/laneshadow/navigation/MainNavGraph.kt").readText()
        val idleRouteSource = File("src/main/java/com/laneshadow/ui/idle/IdleRoute.kt").readText()
        val planningRouteSource = File("src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt").readText()

        assertThat(mainGraphSource).contains("startDestination = Route.Home")
        assertThat(mainGraphSource).contains("composable<Route.Home>")
        assertThat(mainGraphSource).contains("HomeRoute(")
        assertThat(mainGraphSource).contains("auth_landing_root")
        assertThat(mainGraphSource).contains("auth_landing_logout")
        assertThat(mainGraphSource).doesNotContain("IdleRoutePath")
        assertThat(mainGraphSource).doesNotContain("IdleMockProvider")
        assertThat(mainGraphSource).doesNotContain("IdleScreen(")

        assertThat(idleRouteSource).doesNotContain("onCollapse = {}")
        assertThat(idleRouteSource).doesNotContain("onFilter = {}")
        assertThat(idleRouteSource).contains("viewModel.onInputChange(\"\")")
        assertThat(idleRouteSource).contains("navController.navigate(Route.Sessions)")

        assertThat(planningRouteSource).contains("mapAppViewModel.goToPlanning(sessionId)")
        assertThat(planningRouteSource).contains("MapApp(")
        assertThat(planningRouteSource).contains("onPlanningReturnToIdle = mapAppViewModel::goToIdle")
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
