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
    suspend fun signOut(): Result<Unit>
    suspend fun getJwt(): Result<String>
}

data class OAuthResult(
    val userResult: Result<ClerkUser>,
    val jwt: String,
)

interface OAuthGateway {
    suspend fun signInWithGoogle(): OAuthResult
    suspend fun signInWithApple(): OAuthResult
}

class ClerkAuthRepository @Inject constructor(
    private val tokenStore: TokenStore,
    private val clerkGateway: ClerkGateway,
    private val oauthGateway: OAuthGateway,
    private val authState: MutableStateFlow<AuthState> = MutableStateFlow(AuthState.SignedOut),
) : AuthRepository {

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> {
        authState.value = AuthState.Loading
        return handlePrimaryResult(clerkGateway.signIn(email, password))
    }

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> {
        authState.value = AuthState.Loading
        return handlePrimaryResult(clerkGateway.signUp(email, password, name))
    }

    override suspend fun signOut(): Result<Unit> {
        val result = clerkGateway.signOut()
        tokenStore.clear()
        authState.value = AuthState.SignedOut
        return result
    }

    override suspend fun signInWithGoogle(): Result<ClerkUser> {
        authState.value = AuthState.Loading
        return handleOAuthResult(oauthGateway.signInWithGoogle())
    }

    override suspend fun signInWithApple(): Result<ClerkUser> {
        authState.value = AuthState.Loading
        return handleOAuthResult(oauthGateway.signInWithApple())
    }

    override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> {
        val jwt = uri.getQueryParameter("token")
            ?: uri.getQueryParameter("jwt")
            ?: return Result.failure(IllegalArgumentException("Missing token"))

        val user = ClerkUser(
            id = uri.getQueryParameter("user_id") ?: "oauth-user",
            email = uri.getQueryParameter("email") ?: "unknown@oauth.local",
            name = uri.getQueryParameter("name") ?: "OAuth User",
            provider = uri.getQueryParameter("provider") ?: "oauth",
        )

        tokenStore.saveJwt(jwt)
        authState.value = AuthState.SignedIn(user)
        return Result.success(user)
    }

    override suspend fun getJwtForConvex(): String = tokenStore.readJwt().orEmpty()

    override fun observeAuthState(): StateFlow<AuthState> = authState.asStateFlow()

    private suspend fun handlePrimaryResult(result: Result<ClerkUser>): Result<ClerkUser> = result.fold(
        onSuccess = { user ->
            val jwt = clerkGateway.getJwt().getOrElse { "" }
            if (jwt.isNotBlank()) {
                tokenStore.saveJwt(jwt)
            }
            authState.value = AuthState.SignedIn(user)
            Result.success(user)
        },
        onFailure = { error ->
            authState.value = AuthState.Error(error.message ?: "Authentication failed")
            Result.failure(error)
        },
    )

    private suspend fun handleOAuthResult(oauth: OAuthResult): Result<ClerkUser> = oauth.userResult.fold(
        onSuccess = { user ->
            if (oauth.jwt.isNotBlank()) {
                tokenStore.saveJwt(oauth.jwt)
            }
            authState.value = AuthState.SignedIn(user)
            Result.success(user)
        },
        onFailure = { error ->
            authState.value = AuthState.Error(error.message ?: "OAuth failed")
            Result.failure(error)
        },
    )
}
