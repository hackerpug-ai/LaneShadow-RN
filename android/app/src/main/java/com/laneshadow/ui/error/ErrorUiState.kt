package com.laneshadow.ui.error

import androidx.annotation.StringRes
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
    @param:StringRes val labelResId: Int,
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
