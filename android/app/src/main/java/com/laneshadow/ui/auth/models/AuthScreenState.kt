package com.laneshadow.ui.auth.models

enum class AuthScreenStep {
    EmailEntry,
    ExistingUser,
    NewUser,
}

data class AuthScreenUiState(
    val step: AuthScreenStep = AuthScreenStep.EmailEntry,
    val email: String = "",
    val password: String = "",
    val displayName: String = "",
    val isSubmitting: Boolean = false,
    val emailError: String? = null,
    val authError: String? = null,
) {
    val isEmailValid: Boolean
        get() = email.contains('@') && email.substringAfter('@', "").contains('.')

    val canContinueFromEmail: Boolean
        get() = email.isNotBlank() && !isSubmitting

    val canSignIn: Boolean
        get() = password.length >= 8 && !isSubmitting

    val canCreateAccount: Boolean
        get() = displayName.isNotBlank() && password.length >= 10 && !isSubmitting
}
