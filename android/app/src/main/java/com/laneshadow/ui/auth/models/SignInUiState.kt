package com.laneshadow.ui.auth.models

data class SignInUiState(
    val step: SignInStep = SignInStep.Email,
    val email: String = "",
    val password: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
) {
    val canContinueFromEmail: Boolean
        get() = email.contains('@') && email.contains('.')

    val canSubmitPassword: Boolean
        get() = password.isNotBlank() && password.length >= 8
}
