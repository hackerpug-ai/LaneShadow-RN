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

    /**
     * Synthesises an authenticated session for E2E testing without contacting
     * Clerk or Convex. Implementations must refuse to operate in release
     * builds. Behaviour is undefined when called from production code paths.
     */
    suspend fun bypassForTesting(): Result<ClerkUser>

    /**
     * Performs real silent authentication with Clerk using provided credentials,
     * returning a real Convex JWT suitable for E2E testing that exercises full
     * auth flow and Convex integration (no stub token, no synthetic user).
     *
     * Implementations must refuse to operate in release builds.
     * If credentials are blank or unavailable, throws IllegalStateException.
     *
     * @param email Test account email (from BuildConfig.CLERK_TEST_EMAIL)
     * @param password Test account password (from BuildConfig.CLERK_TEST_PASSWORD)
     */
    suspend fun e2eBypassWithCredentials(email: String, password: String): Result<ClerkUser>

    fun observeAuthState(): StateFlow<AuthState>
}
