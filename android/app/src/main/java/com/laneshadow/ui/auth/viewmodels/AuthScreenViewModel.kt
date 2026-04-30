package com.laneshadow.ui.auth.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.laneshadow.ui.auth.models.AuthScreenStep
import com.laneshadow.ui.auth.models.AuthScreenUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AuthScreenViewModel(
    private val emailBranchResolver: AuthEmailBranchResolver = ExistingUserAuthEmailBranchResolver,
) : ViewModel() {
    private val _uiState = MutableStateFlow(AuthScreenUiState())
    val uiState: StateFlow<AuthScreenUiState> = _uiState.asStateFlow()

    fun onEmailChanged(email: String) {
        _uiState.value = _uiState.value.copy(
            email = email,
            emailError = null,
            authError = null,
        )
    }

    fun onPasswordChanged(password: String) {
        _uiState.value = _uiState.value.copy(password = password, authError = null)
    }

    fun onDisplayNameChanged(displayName: String) {
        _uiState.value = _uiState.value.copy(displayName = displayName, authError = null)
    }

    fun continueFromEmail() {
        val state = _uiState.value
        if (state.isSubmitting) {
            return
        }

        if (!state.isEmailValid) {
            _uiState.value = state.copy(
                step = AuthScreenStep.EmailEntry,
                emailError = "That doesn't look like a complete email address.",
            )
            return
        }

        _uiState.value = state.copy(
            isSubmitting = true,
            emailError = null,
            authError = null,
        )

        viewModelScope.launch {
            val result = emailBranchResolver.resolve(state.email.trim())
            _uiState.value = when (result) {
                AuthEmailBranchResult.ExistingUser -> _uiState.value.copy(
                    step = AuthScreenStep.ExistingUser,
                    isSubmitting = false,
                    authError = null,
                )
                AuthEmailBranchResult.NewUser -> _uiState.value.copy(
                    step = AuthScreenStep.NewUser,
                    isSubmitting = false,
                    authError = null,
                )
                is AuthEmailBranchResult.Unavailable -> _uiState.value.copy(
                    step = AuthScreenStep.EmailEntry,
                    isSubmitting = false,
                    authError = result.message,
                )
            }
        }
    }

    fun backToEmail() {
        _uiState.value = _uiState.value.copy(
            step = AuthScreenStep.EmailEntry,
            password = "",
            emailError = null,
            authError = null,
        )
    }

    fun setSubmitting(isSubmitting: Boolean) {
        _uiState.value = _uiState.value.copy(isSubmitting = isSubmitting)
    }

    fun setAuthError(message: String?) {
        _uiState.value = _uiState.value.copy(authError = message, isSubmitting = false)
    }

    fun setPreviewState(state: AuthScreenUiState) {
        _uiState.value = state
    }

}

interface AuthEmailBranchResolver {
    suspend fun resolve(email: String): AuthEmailBranchResult
}

sealed interface AuthEmailBranchResult {
    data object ExistingUser : AuthEmailBranchResult
    data object NewUser : AuthEmailBranchResult
    data class Unavailable(val message: String) : AuthEmailBranchResult
}

object ExistingUserAuthEmailBranchResolver : AuthEmailBranchResolver {
    override suspend fun resolve(email: String): AuthEmailBranchResult =
        AuthEmailBranchResult.ExistingUser
}
