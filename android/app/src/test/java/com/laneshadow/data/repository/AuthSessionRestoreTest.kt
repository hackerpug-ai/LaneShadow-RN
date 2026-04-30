package com.laneshadow.data.repository

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.store.TokenStore
import kotlinx.coroutines.flow.filterNot
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.runTest
import org.junit.Test

class AuthSessionRestoreTest {
    @Test
    fun repositoryRestoresPersistedJwtIntoNavigationObservedAuthFlow() = runTest {
        val tokenStore = MemoryTokenStore(initialJwt = "restored_jwt")
        val repository = ClerkAuthRepository(
            tokenStore = tokenStore,
            clerkGateway = FakeRestoreClerkGateway(jwt = "new_jwt"),
            oauthGateway = NeverOAuthGateway,
        )

        val restoredState = repository.observeAuthState()
            .filterNot { it is AuthState.Loading }
            .first()

        assertThat(restoredState).isInstanceOf(AuthState.SignedIn::class.java)
        assertThat(repository.getJwtForConvex()).isEqualTo("restored_jwt")
    }

    @Test
    fun signOutClearsTokenAndNavigationObservedAuthFlow() = runTest {
        val tokenStore = MemoryTokenStore(initialJwt = "session_jwt")
        val repository = ClerkAuthRepository(
            tokenStore = tokenStore,
            clerkGateway = FakeRestoreClerkGateway(jwt = "session_jwt"),
            oauthGateway = NeverOAuthGateway,
        )
        repository.observeAuthState().filterNot { it is AuthState.Loading }.first()

        repository.signOut()

        assertThat(tokenStore.readJwt()).isNull()
        assertThat(repository.observeAuthState().value).isEqualTo(AuthState.SignedOut)
    }
}

private object NeverOAuthGateway : OAuthGateway {
    override suspend fun signInWithGoogle(): OAuthResult = error("OAuth is not used in this test")
    override suspend fun signInWithApple(): OAuthResult = error("OAuth is not used in this test")
    override suspend fun completeOAuthCallback(uri: android.net.Uri): OAuthResult = error("OAuth is not used in this test")
}

private class FakeRestoreClerkGateway(
    private val jwt: String,
) : ClerkGateway {
    override suspend fun signIn(email: String, password: String) =
        Result.success(com.laneshadow.data.model.ClerkUser("id", email, "Rider", "password"))

    override suspend fun signUp(email: String, password: String, name: String) =
        Result.success(com.laneshadow.data.model.ClerkUser("id", email, name, "password"))

    override suspend fun completeSignUpVerification(code: String) =
        Result.success(com.laneshadow.data.model.ClerkUser("id", "rider@example.com", "Rider", "password"))

    override suspend fun signOut(): Result<Unit> = Result.success(Unit)
    override suspend fun getJwt(): Result<String> = Result.success(jwt)
    override suspend fun getVerificationJwt(): Result<String> = Result.success(jwt)
}

private class MemoryTokenStore(
    private var jwt: String? = null,
    initialJwt: String? = jwt,
) : TokenStore {
    init {
        jwt = initialJwt
    }

    override suspend fun saveJwt(token: String) {
        jwt = token
    }

    override suspend fun readJwt(): String? = jwt

    override suspend fun clear() {
        jwt = null
    }
}
