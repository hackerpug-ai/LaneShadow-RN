package com.laneshadow.data.repository

import android.net.Uri
import com.laneshadow.BuildConfig
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.store.TokenStore
import javax.inject.Inject
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

interface ClerkGateway {
    suspend fun signIn(email: String, password: String): Result<ClerkUser>
    suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser>
    suspend fun completeSignUpVerification(code: String): Result<ClerkUser>
    suspend fun signOut(): Result<Unit>
    suspend fun getJwt(): Result<String>
    suspend fun getVerificationJwt(): Result<String>
}

data class OAuthResult(
    val userResult: Result<ClerkUser>,
    val jwt: String,
)

interface OAuthGateway {
    suspend fun signInWithGoogle(): OAuthResult
    suspend fun signInWithApple(): OAuthResult
    suspend fun completeOAuthCallback(uri: Uri): OAuthResult
}

class ClerkAuthRepository @Inject constructor(
    private val tokenStore: TokenStore,
    private val clerkGateway: ClerkGateway,
    private val oauthGateway: OAuthGateway,
) : AuthRepository {
    private val repositoryScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val authState = MutableStateFlow<AuthState>(AuthState.Loading)
    private val restoreJob = repositoryScope.launch {
        restorePersistedSession()
    }

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> {
        restoreJob.join()
        authState.value = AuthState.Loading
        return handlePrimaryResult(clerkGateway.signIn(email, password))
    }

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> {
        restoreJob.join()
        authState.value = AuthState.Loading
        return handlePrimaryResult(clerkGateway.signUp(email, password, name))
    }

    override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> {
        restoreJob.join()
        authState.value = AuthState.Loading
        return clerkGateway.completeSignUpVerification(code).fold(
            onSuccess = { user ->
                val jwt = clerkGateway.getVerificationJwt().getOrElse { "" }
                if (jwt.isBlank()) {
                    val error = IllegalStateException("Verification completed without JWT")
                    authState.value = AuthState.Error(error.message ?: "Verification failed")
                    Result.failure(error)
                } else {
                    tokenStore.saveJwt(jwt)
                    authState.value = AuthState.SignedIn(user)
                    Result.success(user)
                }
            },
            onFailure = { error ->
                authState.value = AuthState.Error(error.message ?: "Verification failed")
                Result.failure(error)
            },
        )
    }

    override suspend fun signOut(): Result<Unit> {
        restoreJob.join()
        val result = clerkGateway.signOut()
        tokenStore.clear()
        authState.value = AuthState.SignedOut
        return result
    }

    override suspend fun handleUnauthenticated(message: String): Result<Unit> {
        restoreJob.join()
        val result = clerkGateway.signOut()
        tokenStore.clear()
        authState.value = AuthState.Error(message)
        return result
    }

    override suspend fun signInWithGoogle(): Result<ClerkUser> {
        restoreJob.join()
        authState.value = AuthState.OAuthPending("google")
        return handleOAuthResult(oauthGateway.signInWithGoogle())
    }

    override suspend fun signInWithApple(): Result<ClerkUser> {
        restoreJob.join()
        authState.value = AuthState.OAuthPending("apple")
        return handleOAuthResult(oauthGateway.signInWithApple())
    }

    override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> {
        restoreJob.join()
        return handleOAuthResult(oauthGateway.completeOAuthCallback(uri))
    }

    override suspend fun getJwtForConvex(): String {
        restoreJob.join()
        val jwt = tokenStore.readJwt()
        require(!jwt.isNullOrBlank()) { "Missing JWT for Convex" }
        return jwt
    }

    override suspend fun bypassForTesting(): Result<ClerkUser> {
        if (!BuildConfig.DEBUG) {
            return Result.failure(IllegalStateException("bypassForTesting is debug-only"))
        }
        restoreJob.join()
        authState.value = AuthState.Loading
        val syntheticUser = ClerkUser(
            id = "ui-test-user",
            email = "uitest@laneshadow.local",
            name = "UI Test",
            provider = "ui-test-bypass",
        )
        // Stub JWT keeps `getJwtForConvex` from blowing up if any downstream
        // code path hits an authenticated query during the test. Convex itself
        // will 401 the synthetic token; suites that rely on Convex data must
        // inject their own fake transport.
        tokenStore.saveJwt("ui-test-jwt")
        authState.value = AuthState.SignedIn(syntheticUser)
        return Result.success(syntheticUser)
    }

    override fun observeAuthState(): StateFlow<AuthState> = authState.asStateFlow()

    private suspend fun restorePersistedSession() {
        val jwt = tokenStore.readJwt()
        authState.value = if (jwt.isNullOrBlank()) {
            AuthState.SignedOut
        } else {
            AuthState.SignedIn(
                ClerkUser(
                    id = RESTORED_SESSION_USER_ID,
                    email = "",
                    name = "",
                    provider = "clerk",
                ),
            )
        }
    }

    private suspend fun handlePrimaryResult(result: Result<ClerkUser>): Result<ClerkUser> = result.fold(
        onSuccess = { user ->
            val jwt = clerkGateway.getJwt().getOrElse { "" }
            if (jwt.isBlank()) {
                val error = IllegalStateException("Clerk session token unavailable after auth")
                authState.value = AuthState.Error(error.message ?: "Authentication failed")
                Result.failure(error)
            } else {
                tokenStore.saveJwt(jwt)
                authState.value = AuthState.SignedIn(user)
                Result.success(user)
            }
        },
        onFailure = { error ->
            if (error.message?.contains("verification", ignoreCase = true) == true) {
                authState.value = AuthState.VerificationRequired
                return@fold Result.failure(error)
            }
            authState.value = AuthState.Error(error.message ?: "Authentication failed")
            Result.failure(error)
        },
    )

    private suspend fun handleOAuthResult(oauth: OAuthResult): Result<ClerkUser> = oauth.userResult.fold(
        onSuccess = { user ->
            if (oauth.jwt.isBlank()) {
                val error = IllegalStateException("OAuth callback completed without JWT")
                authState.value = AuthState.Error(error.message ?: "OAuth failed")
                Result.failure(error)
            } else {
                tokenStore.saveJwt(oauth.jwt)
                authState.value = AuthState.SignedIn(user)
                Result.success(user)
            }
        },
        onFailure = { error ->
            authState.value = AuthState.Error(error.message ?: "OAuth failed")
            Result.failure(error)
        },
    )

    private companion object {
        const val RESTORED_SESSION_USER_ID = "restored-clerk-session"
    }
}
