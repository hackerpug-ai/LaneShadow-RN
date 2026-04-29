package com.laneshadow.ui.auth.viewmodels

import androidx.lifecycle.ViewModel
import com.laneshadow.ui.auth.models.SignInStep
import com.laneshadow.ui.auth.models.SignInUiState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SignInViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(SignInUiState())
    val uiState: StateFlow<SignInUiState> = _uiState.asStateFlow()

    fun onEmailChanged(email: String) {
        _uiState.value = _uiState.value.copy(email = email, error = null)
    }

    fun onPasswordChanged(password: String) {
        _uiState.value = _uiState.value.copy(password = password, error = null)
    }

    fun continueToPassword() {
        val state = _uiState.value
        _uiState.value = if (state.canContinueFromEmail) {
            state.copy(step = SignInStep.Password, error = null)
        } else {
            state.copy(error = "Please enter a valid email address.")
        }
    }

    fun backToEmail() {
        _uiState.value = _uiState.value.copy(step = SignInStep.Email, error = null)
    }

    fun setLoading(isLoading: Boolean) {
        _uiState.value = _uiState.value.copy(isLoading = isLoading)
    }

    fun setError(message: String?) {
        _uiState.value = _uiState.value.copy(error = message, isLoading = false)
    }
}
