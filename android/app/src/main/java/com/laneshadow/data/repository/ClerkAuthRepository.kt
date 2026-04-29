package com.laneshadow.data.repository

import android.net.Uri
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.store.TokenStore
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

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
    private val authState = MutableStateFlow<AuthState>(AuthState.SignedOut)

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> {
        authState.value = AuthState.Loading
        return handlePrimaryResult(clerkGateway.signIn(email, password))
    }

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> {
        authState.value = AuthState.Loading
        return handlePrimaryResult(clerkGateway.signUp(email, password, name))
    }

    override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> {
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
        val result = clerkGateway.signOut()
        tokenStore.clear()
        authState.value = AuthState.SignedOut
        return result
    }

    override suspend fun signInWithGoogle(): Result<ClerkUser> {
        authState.value = AuthState.OAuthPending("google")
        return handleOAuthResult(oauthGateway.signInWithGoogle())
    }

    override suspend fun signInWithApple(): Result<ClerkUser> {
        authState.value = AuthState.OAuthPending("apple")
        return handleOAuthResult(oauthGateway.signInWithApple())
    }

    override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> =
        handleOAuthResult(oauthGateway.completeOAuthCallback(uri))

    override suspend fun getJwtForConvex(): String {
        val jwt = tokenStore.readJwt()
        require(!jwt.isNullOrBlank()) { "Missing JWT for Convex" }
        return jwt
    }

    override fun observeAuthState(): StateFlow<AuthState> = authState.asStateFlow()

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
}
