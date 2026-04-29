package com.laneshadow.data.repository

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.store.TokenStore
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.runTest
import org.junit.Test

class ClerkAuthRepositoryTest {

    @Test
    fun signInWithGoogle_whenLaunchStarts_doesNotTransitionToError() = runTest {
        val repository = ClerkAuthRepository(
            tokenStore = FakeTokenStore(),
            clerkGateway = FakeClerkGateway(),
            oauthGateway = PendingOAuthGateway(),
        )

        val job = async { repository.signInWithGoogle() }
        delay(10)

        assertThat(repository.observeAuthState().value).isEqualTo(AuthState.OAuthPending("google"))
        assertThat(job.isCompleted).isFalse()

        job.cancel()
    }

    @Test
    fun signUp_whenVerificationRequired_setsVerificationPendingState() = runTest {
        val repository = ClerkAuthRepository(
            tokenStore = FakeTokenStore(),
            clerkGateway = FakeClerkGateway(signUpError = IllegalStateException("verification required")),
            oauthGateway = PendingOAuthGateway(),
        )

        repository.signUp("rider@example.com", "password", "Rider One")

        assertThat(repository.observeAuthState().value).isEqualTo(AuthState.VerificationRequired)
    }
}

private class PendingOAuthGateway : OAuthGateway {
    override suspend fun signInWithGoogle(): OAuthResult {
        delay(Long.MAX_VALUE)
        error("unreachable")
    }

    override suspend fun signInWithApple(): OAuthResult = signInWithGoogle()

    override suspend fun completeOAuthCallback(uri: android.net.Uri): OAuthResult {
        error("unused")
    }
}

private class FakeClerkGateway(
    private val signUpError: Throwable? = null,
) : ClerkGateway {
    override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
        Result.success(ClerkUser("id", email, "Name", "password"))

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
        signUpError?.let { Result.failure(it) } ?: Result.success(ClerkUser("id", email, name, "password"))

    override suspend fun signOut(): Result<Unit> = Result.success(Unit)

    override suspend fun getJwt(): Result<String> = Result.success("jwt")
}

private class FakeTokenStore : TokenStore {
    private var jwt: String? = null

    override suspend fun saveJwt(token: String) {
        jwt = token
    }

    override suspend fun readJwt(): String? = jwt

    override suspend fun clear() {
        jwt = null
    }
}
