package com.laneshadow.data.model

sealed interface AuthState {
    data object SignedOut : AuthState
    data class SignedIn(val user: ClerkUser) : AuthState
    data object Loading : AuthState
    data class OAuthPending(val provider: String) : AuthState
    data object VerificationRequired : AuthState
    data class Error(val message: String) : AuthState
}

data class ClerkUser(
    val id: String,
    val email: String,
    val name: String,
    val provider: String,
)
