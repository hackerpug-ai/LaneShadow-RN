package com.laneshadow.ui.error

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.laneshadow.services.LaneShadowError
import com.laneshadow.services.SignOutFlow
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

@HiltViewModel
class ErrorViewModel @Inject constructor(
    private val signOutFlow: SignOutFlow,
) : ViewModel() {
    private val _uiState = MutableStateFlow<ErrorUiState>(ErrorUiState.Hidden)
    private val _recoveryEvents = MutableSharedFlow<ErrorRecoveryEvent>(
        replay = 0,
        extraBufferCapacity = 1,
    )

    val uiState: StateFlow<ErrorUiState> = _uiState.asStateFlow()
    val recoveryEvents: SharedFlow<ErrorRecoveryEvent> = _recoveryEvents.asSharedFlow()

    val suggestions: StateFlow<List<ErrorSuggestion>> = uiState
        .map(::suggestionsForState)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.Eagerly,
            initialValue = emptyList(),
        )

    fun handle(error: LaneShadowError) {
        when (error) {
            LaneShadowError.Unauthenticated -> {
                _uiState.value = ErrorUiState.Hidden
                viewModelScope.launch {
                    signOutFlow.signOut()
                }
            }
            else -> {
                _uiState.value = ErrorUiState.Visible(error)
            }
        }
    }

    fun handle(suggestion: ErrorSuggestion) {
        when (suggestion.action) {
            ErrorSuggestionAction.SignIn -> {
                _uiState.value = ErrorUiState.Hidden
                viewModelScope.launch {
                    signOutFlow.signOut()
                }
            }
            ErrorSuggestionAction.Retry -> {
                viewModelScope.launch {
                    _recoveryEvents.emit(ErrorRecoveryEvent.Retry)
                }
            }
            ErrorSuggestionAction.Reset -> {
                viewModelScope.launch {
                    _recoveryEvents.emit(ErrorRecoveryEvent.StartOver)
                }
            }
        }
    }

    private fun suggestionsForState(state: ErrorUiState): List<ErrorSuggestion> =
        when (state) {
            ErrorUiState.Hidden -> emptyList()
            is ErrorUiState.Visible -> suggestionsFor(state.error)
        }

    private fun suggestionsFor(error: LaneShadowError): List<ErrorSuggestion> =
        when (error) {
            LaneShadowError.Unauthenticated -> emptyList()
            LaneShadowError.AuthRequired -> listOf(signInSuggestion())
            LaneShadowError.SessionNotFound -> listOf(startOverSuggestion(), signInSuggestion())
            LaneShadowError.RateLimitExceeded -> listOf(startOverSuggestion())
            LaneShadowError.PlanLimitExceeded -> listOf(startOverSuggestion())
            LaneShadowError.PlanAlreadyActive -> listOf(startOverSuggestion())
            LaneShadowError.AgentTimeout -> listOf(tryAgainSuggestion(), startOverSuggestion())
            is LaneShadowError.NetworkTimeout -> listOf(tryAgainSuggestion(), startOverSuggestion())
            LaneShadowError.NotFound -> listOf(startOverSuggestion())
            LaneShadowError.InvalidInput -> listOf(tryAgainSuggestion(), startOverSuggestion())
            is LaneShadowError.Unknown -> listOf(tryAgainSuggestion(), startOverSuggestion())
        }

    private fun tryAgainSuggestion(): ErrorSuggestion =
        ErrorSuggestion(
            id = TRY_AGAIN_ID,
            label = "Try again",
            isPrimary = true,
            action = ErrorSuggestionAction.Retry,
        )

    private fun startOverSuggestion(): ErrorSuggestion =
        ErrorSuggestion(
            id = START_OVER_ID,
            label = "Start over",
            isPrimary = false,
            action = ErrorSuggestionAction.Reset,
        )

    private fun signInSuggestion(): ErrorSuggestion =
        ErrorSuggestion(
            id = SIGN_IN_ID,
            label = "Sign in",
            isPrimary = true,
            action = ErrorSuggestionAction.SignIn,
        )

    private companion object {
        const val TRY_AGAIN_ID = "try_again"
        const val START_OVER_ID = "start_over"
        const val SIGN_IN_ID = "sign_in"
    }
}
