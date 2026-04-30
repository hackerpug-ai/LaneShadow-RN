package com.laneshadow.ui.auth.viewmodels

import androidx.lifecycle.ViewModel
import com.laneshadow.ui.auth.models.AuthScreenStep
import com.laneshadow.ui.auth.models.AuthScreenUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AuthScreenViewModel : ViewModel() {
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
        if (!state.isEmailValid) {
            _uiState.value = state.copy(
                step = AuthScreenStep.EmailEntry,
                emailError = "That doesn't look like a complete email address.",
            )
            return
        }

        _uiState.value = state.copy(
            step = resolveBranchForEmail(state.email),
            emailError = null,
            authError = null,
        )
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

    private fun resolveBranchForEmail(email: String): AuthScreenStep {
        val normalized = email.trim().lowercase()
        return if (normalized.startsWith("new.") || normalized.contains("jamie")) {
            AuthScreenStep.NewUser
        } else {
            AuthScreenStep.ExistingUser
        }
    }
}
