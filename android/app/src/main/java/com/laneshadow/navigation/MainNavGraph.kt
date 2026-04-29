package com.laneshadow.navigation

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import androidx.navigation.compose.rememberNavController
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.sandbox.host.AndroidSandboxHost

@Composable
fun MainNavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel,
) {
    NavHost(
        navController = navController,
        startDestination = Route.Home,
    ) {
        navigation<Route.Home>(startDestination = Route.Home) {
            composable<Route.Home> {
                HomeRoute(
                    onOpenSessions = { navController.navigate(Route.Sessions) },
                    onOpenRouteResults = { navController.navigate(Route.RouteResults) },
                    onOpenSavedRoutes = { navController.navigate(Route.SavedRoutes) },
                    onOpenSettings = { navController.navigate(Route.Settings) },
                    onSignOut = authViewModel::signOut,
                )
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
                HomeLeafRoute(title = "Settings", onBack = { navController.popBackStack() })
            }
            composable<Route.Sandbox> {
                AndroidSandboxHost()
            }
        }
    }
}

@Composable
private fun HomeRoute(
    onOpenSessions: () -> Unit,
    onOpenRouteResults: () -> Unit,
    onOpenSavedRoutes: () -> Unit,
    onOpenSettings: () -> Unit,
    onSignOut: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(text = "LaneShadow", style = MaterialTheme.typography.headlineSmall)
        Button(onClick = onOpenSessions) { Text("Sessions") }
        Button(onClick = onOpenRouteResults) { Text("Route Results") }
        Button(onClick = onOpenSavedRoutes) { Text("Saved Routes") }
        Button(onClick = onOpenSettings) { Text("Settings") }
        Button(onClick = onSignOut) { Text("Sign out") }
    }
}

@Composable
private fun HomeLeafRoute(
    title: String,
    onBack: () -> Unit,
    onNext: (() -> Unit)? = null,
    nextLabel: String = "",
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(text = title, style = MaterialTheme.typography.headlineSmall)
        Button(onClick = onBack) { Text("Back") }
        if (onNext != null) {
            Button(onClick = onNext) { Text(nextLabel) }
        }
    }
}
