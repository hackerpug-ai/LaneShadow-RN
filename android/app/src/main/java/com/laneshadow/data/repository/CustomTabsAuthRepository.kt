package com.laneshadow.data.repository

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.laneshadow.BuildConfig
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.store.TokenStore
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.UUID
import javax.inject.Inject
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class CustomTabsAuthRepository @Inject constructor(
    private val tokenStore: TokenStore,
    @ApplicationContext private val context: Context,
) : AuthRepository {
    private val authState = MutableStateFlow<AuthState>(AuthState.SignedOut)
    private var pendingState: String? = null
    private var pendingProvider: String? = null
    private val pendingResultMutex = Mutex()
    private var pendingResult: CompletableDeferred<Result<ClerkUser>>? = null

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
        Result.failure(IllegalStateException("Email/password auth is handled by ClerkAuthRepository"))

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
        Result.failure(IllegalStateException("Sign-up is handled by ClerkAuthRepository"))

    override suspend fun signOut(): Result<Unit> {
        tokenStore.clear()
        authState.value = AuthState.SignedOut
        return Result.success(Unit)
    }

    override suspend fun signInWithGoogle(): Result<ClerkUser> = launchOAuth(provider = "google")

    override suspend fun signInWithApple(): Result<ClerkUser> = launchOAuth(provider = "apple")

    override suspend fun handleOAuthCallback(uri: Uri): Result<ClerkUser> {
        val expectedState = pendingState
        val callbackState = uri.getQueryParameter("state")
        if (expectedState.isNullOrBlank() || callbackState != expectedState) {
            val error = IllegalArgumentException("OAuth callback state mismatch")
            authState.value = AuthState.Error(error.message ?: "OAuth failed")
            val result: Result<ClerkUser> = Result.failure(error)
            pendingResult?.complete(result)
            return result
        }

        val jwt = uri.getQueryParameter("token") ?: uri.getQueryParameter("jwt")
        if (jwt.isNullOrBlank()) {
            val error = IllegalArgumentException("OAuth callback missing token/jwt parameter")
            authState.value = AuthState.Error(error.message ?: "OAuth failed")
            val result: Result<ClerkUser> = Result.failure(error)
            pendingResult?.complete(result)
            return result
        }

        val userId = uri.getQueryParameter("user_id")
        val email = uri.getQueryParameter("email")
        val name = uri.getQueryParameter("name")
        if (userId.isNullOrBlank() || email.isNullOrBlank() || name.isNullOrBlank()) {
            val error = IllegalArgumentException("OAuth callback missing required user fields")
            authState.value = AuthState.Error(error.message ?: "OAuth failed")
            val result: Result<ClerkUser> = Result.failure(error)
            pendingResult?.complete(result)
            return result
        }

        val provider = uri.getQueryParameter("provider") ?: pendingProvider ?: "oauth"
        tokenStore.saveJwt(jwt)
        val user = ClerkUser(userId, email, name, provider)
        authState.value = AuthState.SignedIn(user)
        pendingState = null
        pendingProvider = null
        val result = Result.success(user)
        pendingResult?.complete(result)
        return result
    }

    override suspend fun getJwtForConvex(): String {
        val jwt = tokenStore.readJwt()
        require(!jwt.isNullOrBlank()) { "Missing JWT for Convex" }
        return jwt
    }

    override fun observeAuthState(): StateFlow<AuthState> = authState.asStateFlow()

    private suspend fun launchOAuth(provider: String): Result<ClerkUser> {
        val startUrl = BuildConfig.CLERK_OAUTH_START_URL
        if (startUrl.isBlank()) {
            val error = IllegalStateException("CLERK_OAUTH_START_URL is required for Custom Tabs OAuth fallback")
            authState.value = AuthState.Error(error.message ?: "OAuth failed")
            return Result.failure(error)
        }

        val state = UUID.randomUUID().toString()
        pendingState = state
        pendingProvider = provider
        authState.value = AuthState.OAuthPending(provider)

        val launchUri = Uri.parse(startUrl).buildUpon()
            .appendQueryParameter("provider", provider)
            .appendQueryParameter("state", state)
            .appendQueryParameter("redirect_uri", BuildConfig.CLERK_OAUTH_REDIRECT_URI)
            .build()

        val customTabsIntent = CustomTabsIntent.Builder().build()
        customTabsIntent.intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        customTabsIntent.launchUrl(context, launchUri)

        val deferred = pendingResultMutex.withLock {
            pendingResult?.cancel()
            CompletableDeferred<Result<ClerkUser>>().also { pendingResult = it }
        }
        return deferred.await()
    }
}
