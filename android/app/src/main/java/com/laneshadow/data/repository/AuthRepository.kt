package com.laneshadow.data.repository

import android.net.Uri
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import kotlinx.coroutines.flow.StateFlow

interface AuthRepository {
    suspend fun signIn(email: String, password: String): Result<ClerkUser>
    suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser>
    suspend fun completeSignUpVerification(code: String): Result<ClerkUser>
    suspend fun signOut(): Result<Unit>
    suspend fun handleUnauthenticated(message: String): Result<Unit>
    suspend fun signInWithGoogle(): Result<ClerkUser>
    suspend fun signInWithApple(): Result<ClerkUser>
    suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser>
    suspend fun getJwtForConvex(): String
    fun observeAuthState(): StateFlow<AuthState>
}
