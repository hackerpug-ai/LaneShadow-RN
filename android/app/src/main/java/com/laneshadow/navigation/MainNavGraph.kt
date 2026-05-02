package com.laneshadow.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.laneshadow.services.ConvexClientProvider
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.idle.IdleRoute
import com.laneshadow.ui.sandbox.host.AndroidSandboxHost
import com.laneshadow.ui.planning.PlanningRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

@HiltViewModel
class MainNavViewModel @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : ViewModel() {
    fun signOut() {
        viewModelScope.launch {
            convexClientProvider.signOut()
        }
    }
}

@Composable
fun MainNavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel,
    mainNavViewModel: MainNavViewModel = hiltViewModel(),
) {
    NavHost(
        navController = navController,
        startDestination = Route.Home,
    ) {
        composable<Route.Home> {
            HomeRoute(
                navController = navController,
                onLogout = mainNavViewModel::signOut,
            )
        }
        composable(
            route = PlanningRoutePath,
            arguments = listOf(navArgument(PlanningSessionIdArg) { type = NavType.StringType }),
        ) { backStackEntry ->
            backStackEntry.arguments?.getString(PlanningSessionIdArg)?.let { sessionId ->
                PlanningRoute(
                    sessionId = sessionId,
                    navController = navController,
                )
            }
        }
        composable<Route.Sessions> {
            HomeLeafRoute(title = "Sessions", onBack = { navController.popBackStack() })
        }
        composable<Route.RouteResults> {
            HomeLeafRoute(
                title = "Route Results",
                onBack = { navController.popBackStack() },
                onNext = { navController.navigate(Route.RouteDetails) },
                nextLabel = "Open route details",
            )
        }
        composable<Route.RouteDetails> {
            HomeLeafRoute(title = "Route Details", onBack = { navController.popBackStack() })
        }
        composable<Route.SavedRoutes> {
            HomeLeafRoute(
                title = "Saved Routes",
                onBack = { navController.popBackStack() },
                onNext = { navController.navigate(Route.SavedRouteDetail) },
                nextLabel = "Open saved route",
            )
        }
        composable<Route.SavedRouteDetail> {
            HomeLeafRoute(title = "Saved Route Detail", onBack = { navController.popBackStack() })
        }
        composable<Route.Settings> {
            HomeLeafRoute(
                title = "Settings",
                onBack = { navController.popBackStack() },
                onNext = mainNavViewModel::signOut,
                nextLabel = "Sign out",
            )
        }
        composable<Route.Sandbox> {
            AndroidSandboxHost()
        }
    }
}

internal const val PlanningSessionIdArg = "sessionId"
internal const val PlanningRoutePath = "planning/{$PlanningSessionIdArg}"

internal fun planningRoute(sessionId: String): String = "planning/$sessionId"

@Composable
private fun HomeRoute(
    navController: NavHostController,
    onLogout: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .testTag("auth_landing_root"),
    ) {
        IdleRoute(navController = navController)

        Button(
            onClick = onLogout,
            modifier = Modifier
                .align(Alignment.TopStart)
                .padding(LocalLaneShadowTheme.current.space.md)
                .testTag("auth_landing_logout"),
        ) {
            Text(
                text = "Log out",
                style = MaterialTheme.typography.labelLarge,
            )
        }
    }
}

@Composable
private fun HomeLeafRoute(
    title: String,
    onBack: () -> Unit,
    onNext: (() -> Unit)? = null,
    nextLabel: String = "",
) {
    androidx.compose.foundation.layout.Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(LocalLaneShadowTheme.current.space.md),
    ) {
        Text(text = title, style = MaterialTheme.typography.headlineSmall)
        Button(onClick = onBack) { Text("Back") }
        if (onNext != null) {
            Button(onClick = onNext) { Text(nextLabel) }
        }
    }
}
