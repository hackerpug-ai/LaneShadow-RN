package com.laneshadow.navigation

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.navigation
import androidx.navigation.compose.rememberNavController
import com.laneshadow.sandbox.mockproviders.Greeting
import com.laneshadow.sandbox.mockproviders.IdleMockProvider
import com.laneshadow.services.ConvexClientProvider
import com.laneshadow.services.ConvexCurrentUser
import com.laneshadow.theme.LocalLaneShadowTheme
import com.laneshadow.ui.AuthViewModel
import com.laneshadow.ui.atoms.ContentColor
import com.laneshadow.ui.atoms.LSSpinner
import com.laneshadow.ui.atoms.LSText
import com.laneshadow.ui.atoms.SpinnerSize
import com.laneshadow.ui.atoms.TypographyVariant
import com.laneshadow.ui.sandbox.host.AndroidSandboxHost
import com.laneshadow.ui.templates.IdleScreen
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class MainNavViewModel @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : ViewModel() {
    private val _routeState = MutableStateFlow(MainRouteState())
    val routeState: StateFlow<MainRouteState> = _routeState.asStateFlow()

    init {
        refreshCurrentUser()
    }

    fun refreshCurrentUser() {
        _routeState.value = _routeState.value.copy(isLoadingCurrentUser = true, errorMessage = null)
        viewModelScope.launch {
            convexClientProvider.getCurrentUser().fold(
                onSuccess = { user ->
                    _routeState.value = _routeState.value.copy(
                        currentUser = user,
                        isLoadingCurrentUser = false,
                        errorMessage = null,
                    )
                },
                onFailure = { error ->
                    _routeState.value = _routeState.value.copy(
                        isLoadingCurrentUser = false,
                        errorMessage = error.message ?: "Unable to load rider profile.",
                    )
                },
            )
        }
    }

    fun signOut() {
        _routeState.value = MainRouteState(
            lastSessionId = null,
            cameraState = null,
        )
        viewModelScope.launch {
            convexClientProvider.signOut()
        }
    }
}

data class MainRouteState(
    val currentUser: ConvexCurrentUser? = null,
    val isLoadingCurrentUser: Boolean = true,
    val errorMessage: String? = null,
    val lastSessionId: String? = null,
    val cameraState: String? = null,
)

@Composable
fun MainNavGraph(
    navController: NavHostController = rememberNavController(),
    authViewModel: AuthViewModel,
    mainNavViewModel: MainNavViewModel = hiltViewModel(),
) {
    val routeState by mainNavViewModel.routeState.collectAsStateWithLifecycle()

    NavHost(
        navController = navController,
        startDestination = Route.Home,
    ) {
        navigation<Route.Home>(startDestination = Route.Home) {
            composable<Route.Home> {
                val currentUser = routeState.currentUser
                when {
                    routeState.isLoadingCurrentUser -> CurrentUserLoadingRoute()
                    currentUser != null -> HomeRoute(
                        displayName = currentUser.displayName,
                        onOpenSessions = { navController.navigate(Route.Sessions) },
                        onOpenRouteResults = { navController.navigate(Route.RouteResults) },
                        onOpenSettings = { navController.navigate(Route.Settings) },
                    )
                    else -> CurrentUserErrorRoute(
                        message = routeState.errorMessage ?: "Unable to load rider profile.",
                        onRetry = mainNavViewModel::refreshCurrentUser,
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
}

@Composable
private fun CurrentUserLoadingRoute() {
    val theme = LocalLaneShadowTheme.current
    Column(
        modifier = Modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(theme.space.md, Alignment.CenterVertically),
    ) {
        LSSpinner(size = SpinnerSize.Md)
        LSText(
            text = "Loading rider profile",
            variant = TypographyVariant.Ui.Body.Md,
            color = ContentColor.Primary,
        )
    }
}

@Composable
private fun CurrentUserErrorRoute(
    message: String,
    onRetry: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize()) {
        Text(text = message, style = MaterialTheme.typography.bodyLarge)
        Button(onClick = onRetry) { Text("Retry") }
    }
}

@Composable
private fun HomeRoute(
    displayName: String,
    onOpenSessions: () -> Unit,
    onOpenRouteResults: () -> Unit,
    onOpenSettings: () -> Unit,
) {
    val idleState = IdleMockProvider.value("default").copy(
        greeting = Greeting(
            meta = "READY TO RIDE",
            headline = "Where are we riding today, $displayName?",
            emphasis = "today",
        ),
    )

    IdleScreen(
        state = idleState,
        onMenuTap = onOpenSessions,
        onSuggestionTap = { },
        onSend = { onOpenRouteResults() },
        onCollapse = { },
        onFilter = onOpenSettings,
        onValueChange = { },
    )
}

@Composable
private fun HomeLeafRoute(
    title: String,
    onBack: () -> Unit,
    onNext: (() -> Unit)? = null,
    nextLabel: String = "",
) {
    Column(modifier = Modifier.fillMaxSize().padding(LocalLaneShadowTheme.current.space.md)) {
        Text(text = title, style = MaterialTheme.typography.headlineSmall)
        Button(onClick = onBack) { Text("Back") }
        if (onNext != null) {
            Button(onClick = onNext) { Text(nextLabel) }
        }
    }
}
