package com.laneshadow.ui.error

import androidx.compose.runtime.Immutable
import com.laneshadow.services.LaneShadowError

sealed interface ErrorUiState {
    data object Hidden : ErrorUiState

    data class Visible(
        val error: LaneShadowError,
    ) : ErrorUiState
}

@Immutable
data class ErrorSuggestion(
    val id: String,
    val label: String,
    val isPrimary: Boolean = false,
    val action: ErrorSuggestionAction,
)

sealed interface ErrorSuggestionAction {
    data object Retry : ErrorSuggestionAction
    data object Reset : ErrorSuggestionAction
    data object SignIn : ErrorSuggestionAction
}

sealed interface ErrorRecoveryEvent {
    data object Retry : ErrorRecoveryEvent
    data object StartOver : ErrorRecoveryEvent
}
