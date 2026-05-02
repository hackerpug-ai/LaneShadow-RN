package com.laneshadow.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavBackStackEntry
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import androidx.navigation.toRoute
import com.laneshadow.services.NavEvent
import com.laneshadow.services.SignOutFlow
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.error.ErrorRouteCodeArg
import com.laneshadow.ui.error.ErrorRouteMessageArg
import com.laneshadow.ui.error.ErrorRoutePath
import com.laneshadow.ui.error.ErrorRoute
import com.laneshadow.ui.idle.IdleRoute
import com.laneshadow.ui.routedetails.RouteDetailsRoute
import com.laneshadow.ui.routeresults.RouteResultsRoute
import com.laneshadow.ui.sandbox.host.AndroidSandboxHost
import com.laneshadow.ui.planning.PlanningRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

@HiltViewModel
class MainNavViewModel @Inject constructor(
    private val signOutFlow: SignOutFlow,
) : ViewModel() {
    val navEvents: SharedFlow<NavEvent> = signOutFlow.events

    fun signOut() {
        viewModelScope.launch {
            signOutFlow.signOut()
        }
    }
}

@Composable
fun MainNavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel,
    mainNavViewModel: MainNavViewModel = hiltViewModel(),
) {
    LaunchedEffect(mainNavViewModel) {
        mainNavViewModel.navEvents.collect { event ->
            when (event) {
                is NavEvent.Navigate -> {
                    when (event.route) {
                        Route.SignIn -> {
                            navController.navigate(Route.SignIn) {
                                popUpTo(Route.Home) { inclusive = true }
                                launchSingleTop = true
                            }
                        }

                        else -> Unit
                    }
                }
            }
        }
    }

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
        composable<Route.RouteResults> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.RouteResults>()
            RouteResultsRoute(
                navController = navController,
                sessionId = route.sessionId,
            )
        }
        composable<Route.RouteDetails> { backStackEntry ->
            val route = backStackEntry.toRoute<Route.RouteDetails>()
            RouteDetailsRoute(
                navController = navController,
                sessionId = route.sessionId,
                routeOptionId = route.routeOptionId,
            )
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
        composable<Route.SignIn> {
            Box(
                modifier = Modifier.fillMaxSize(),
            )
        }
        composable(
            route = ErrorRoutePath,
            arguments = listOf(navArgument(ErrorRouteCodeArg) {
                type = NavType.StringType
                defaultValue = ""
            }, navArgument(ErrorRouteMessageArg) {
                type = NavType.StringType
                defaultValue = ""
            }),
        ) { backStackEntry: NavBackStackEntry ->
            val retrySessionId = navController.previousBackStackEntry
                ?.arguments
                ?.getString(PlanningSessionIdArg)
                ?.takeIf { it.isNotBlank() }

            ErrorRoute(
                navController = navController,
                errorCode = backStackEntry.arguments?.getString(ErrorRouteCodeArg)
                    ?.takeIf { it.isNotBlank() },
                errorMessage = backStackEntry.arguments?.getString(ErrorRouteMessageArg)
                    ?.takeIf { it.isNotBlank() },
                onRetry = {
                    if (retrySessionId != null) {
                        navController.navigate(planningRoute(retrySessionId)) {
                            popUpTo(PlanningRoutePath) { inclusive = true }
                            launchSingleTop = true
                        }
                    } else {
                        navController.popBackStack()
                    }
                },
                onStartOver = {
                    navController.navigate(Route.Home) {
                        popUpTo(Route.Home) { inclusive = true }
                        launchSingleTop = true
                    }
                },
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
