package com.laneshadow.data.repository

import android.net.Uri
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.store.TokenStore
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class CustomTabsAuthRepository @Inject constructor(
    private val tokenStore: TokenStore,
) : AuthRepository {
    private val authState = MutableStateFlow<AuthState>(AuthState.SignedOut)

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("Use OAuth for fallback auth"))

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("Use Clerk primary implementation"))

    override suspend fun signOut(): Result<Unit> {
        tokenStore.clear()
        authState.value = AuthState.SignedOut
        return Result.success(Unit)
    }

    override suspend fun signInWithGoogle(): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("Complete flow via callback"))

    override suspend fun signInWithApple(): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("Complete flow via callback"))

    override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> {
        val jwt = uri.getQueryParameter("token")
            ?: uri.getQueryParameter("jwt")
            ?: return Result.failure(IllegalArgumentException("Missing token"))
        val provider = uri.getQueryParameter("provider") ?: "oauth"
        val userId = uri.getQueryParameter("user_id") ?: "oauth-user"
        val email = uri.getQueryParameter("email") ?: "unknown@oauth.local"
        val name = uri.getQueryParameter("name") ?: "OAuth User"

        tokenStore.saveJwt(jwt)
        val user = ClerkUser(userId, email, name, provider)
        authState.value = AuthState.SignedIn(user)
        return Result.success(user)
    }

    override suspend fun getJwtForConvex(): String = tokenStore.readJwt().orEmpty()

    override fun observeAuthState(): StateFlow<AuthState> = authState.asStateFlow()
}
