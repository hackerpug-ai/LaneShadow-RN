package com.laneshadow.ui.error

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import com.laneshadow.navigation.Route
import com.laneshadow.sandbox.mockproviders.ErrorScreenState
import com.laneshadow.sandbox.mockproviders.NavigatorError
import com.laneshadow.sandbox.mockproviders.SuggestionChip as MockSuggestionChip
import com.laneshadow.services.LaneShadowError
import com.laneshadow.services.toLaneShadowError
import com.laneshadow.ui.templates.ErrorScreen

internal const val ErrorRouteCodeArg = "code"
internal const val ErrorRoutePath = "error?code={$ErrorRouteCodeArg}"

@Composable
fun ErrorRoute(
    navController: NavHostController,
    errorCode: String? = null,
    viewModel: ErrorViewModel = hiltViewModel(),
) {
    LaunchedEffect(errorCode) {
        errorCode
            ?.takeIf { it.isNotBlank() }
            ?.let { code ->
                viewModel.handle(toLaneShadowError(IllegalStateException(code)))
            }
    }

    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val suggestions by viewModel.suggestions.collectAsStateWithLifecycle()

    when (val state = uiState) {
        ErrorUiState.Hidden -> Box(modifier = Modifier.fillMaxSize())
        is ErrorUiState.Visible -> {
            val error = state.error
            ErrorScreen(
                state = ErrorScreenState(
                    error = NavigatorError(
                        body = stringResource(error.messageResId),
                        detail = error.detailMessage(),
                    ),
                    suggestions = suggestions.map { suggestion ->
                        MockSuggestionChip(
                            id = suggestion.id,
                            label = suggestion.label,
                            isPrimary = suggestion.isPrimary,
                        )
                    },
                    isRecovered = false,
                    isOffline = error is LaneShadowError.NetworkTimeout,
                    isStormGate = false,
                ),
                onMenuTap = { navController.navigate(Route.Settings) },
                onSuggestionTap = { chip ->
                    suggestions.firstOrNull { it.id == chip.id || it.label == chip.label }?.let { suggestion ->
                        viewModel.handle(suggestion)
                        when (suggestion.action) {
                            ErrorSuggestionAction.Retry -> navController.popBackStack()
                            ErrorSuggestionAction.Reset -> navController.navigate(Route.Home) {
                                popUpTo(Route.Home) { inclusive = true }
                                launchSingleTop = true
                            }
                            ErrorSuggestionAction.SignIn -> Unit
                        }
                    }
                },
                onSend = { _ -> navController.popBackStack() },
                onCollapse = { navController.popBackStack() },
                onFilter = { navController.navigate(Route.Sessions) },
                onValueChange = {},
            )
        }
    }
}

private fun LaneShadowError.detailMessage(): String? =
    when (this) {
        is LaneShadowError.NetworkTimeout -> originalCause.message?.takeIf { it.isNotBlank() }
        is LaneShadowError.Unknown -> originalMessage?.takeIf { it.isNotBlank() }
        else -> null
    }
