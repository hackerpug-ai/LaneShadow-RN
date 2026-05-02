package com.laneshadow.ui.error

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
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
import com.laneshadow.services.laneShadowErrorForCode
import com.laneshadow.ui.templates.ErrorScreen
import kotlinx.coroutines.flow.collect
import java.net.URLEncoder

internal const val ErrorRouteCodeArg = "code"
internal const val ErrorRouteMessageArg = "message"
internal const val ErrorRoutePath = "error?code={$ErrorRouteCodeArg}&message={$ErrorRouteMessageArg}"

internal fun errorRoute(error: LaneShadowError): String =
    errorRoute(
        errorCode = error.originalCode,
        errorMessage = error.detailMessage(),
    )

internal fun errorRoute(
    errorCode: String?,
    errorMessage: String? = null,
): String = buildString {
    append("error")
    append('?')
    append(ErrorRouteCodeArg)
    append('=')
    append(encodeRouteComponent(errorCode.orEmpty()))
    append('&')
    append(ErrorRouteMessageArg)
    append('=')
    append(encodeRouteComponent(errorMessage.orEmpty()))
}

@Composable
fun ErrorRoute(
    navController: NavHostController,
    onRetry: () -> Unit,
    onStartOver: () -> Unit,
    errorCode: String? = null,
    errorMessage: String? = null,
    viewModel: ErrorViewModel = hiltViewModel(),
) {
    val latestOnRetry by rememberUpdatedState(onRetry)
    val latestOnStartOver by rememberUpdatedState(onStartOver)

    LaunchedEffect(errorCode, errorMessage) {
        routeError(errorCode, errorMessage)?.let(viewModel::handle)
    }

    LaunchedEffect(viewModel) {
        viewModel.recoveryEvents.collect { event ->
            when (event) {
                ErrorRecoveryEvent.Retry -> latestOnRetry()
                ErrorRecoveryEvent.StartOver -> latestOnStartOver()
            }
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

private fun encodeRouteComponent(value: String): String =
    URLEncoder.encode(value, Charsets.UTF_8.name())
        .replace("+", "%20")

private fun routeError(
    errorCode: String?,
    errorMessage: String?,
): LaneShadowError? {
    val normalizedCode = errorCode?.trim()?.takeIf { it.isNotBlank() }
    val normalizedMessage = errorMessage?.trim()?.takeIf { it.isNotBlank() }

    if (normalizedCode == null && normalizedMessage == null) {
        return null
    }

    return when (normalizedCode) {
        null -> LaneShadowError.Unknown(
            originalMessage = normalizedMessage,
            originalCode = null,
        )

        "NETWORK_TIMEOUT" -> LaneShadowError.NetworkTimeout(
            java.io.IOException(normalizedMessage.orEmpty()),
        )

        else -> laneShadowErrorForCode(normalizedCode) ?: LaneShadowError.Unknown(
            originalMessage = normalizedMessage,
            originalCode = normalizedCode,
        )
    }
}
