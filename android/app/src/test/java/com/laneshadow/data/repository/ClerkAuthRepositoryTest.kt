package com.laneshadow.data.repository

import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.store.TokenStore
import kotlinx.coroutines.CompletableDeferred
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.runTest
import org.junit.Test
import org.mockito.Mockito.mock

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

    @Test
    fun signIn_success_setsSignedIn_andPersistsNonBlankJwt() = runTest {
        val tokenStore = FakeTokenStore()
        val repository = ClerkAuthRepository(
            tokenStore = tokenStore,
            clerkGateway = FakeClerkGateway(jwt = "jwt_123"),
            oauthGateway = PendingOAuthGateway(),
        )

        val result = repository.signIn("rider@example.com", "password")

        assertThat(result.isSuccess).isTrue()
        assertThat(repository.observeAuthState().value).isEqualTo(
            AuthState.SignedIn(ClerkUser("id", "rider@example.com", "Name", "password")),
        )
        assertThat(tokenStore.readJwt()).isEqualTo("jwt_123")
    }

    @Test
    fun handleOAuthCallback_whenOAuthPending_transitionsToSignedIn_andPersistsJwt() = runTest {
        val tokenStore = FakeTokenStore()
        val oauthGateway = CallbackCompletingOAuthGateway()
        val repository = ClerkAuthRepository(
            tokenStore = tokenStore,
            clerkGateway = FakeClerkGateway(),
            oauthGateway = oauthGateway,
        )

        val pendingSignIn = async { repository.signInWithGoogle() }
        delay(10)
        val result = repository.handleOAuthCallback(mock(android.net.Uri::class.java))
        assertThat(pendingSignIn.await().isSuccess).isTrue()

        assertThat(result.isSuccess).isTrue()
        assertThat(repository.observeAuthState().value).isEqualTo(
            AuthState.SignedIn(ClerkUser("oauth-id", "oauth@example.com", "OAuth User", "google")),
        )
        assertThat(tokenStore.readJwt()).isEqualTo("oauth_jwt")
    }

    @Test
    fun completeSignUpVerification_success_transitionsToSignedIn_andPersistsJwt() = runTest {
        val tokenStore = FakeTokenStore()
        val repository = ClerkAuthRepository(
            tokenStore = tokenStore,
            clerkGateway = FakeClerkGateway(signUpError = IllegalStateException("verification required"), verificationJwt = "verify_jwt"),
            oauthGateway = PendingOAuthGateway(),
        )

        repository.signUp("rider@example.com", "password", "Rider One")
        val completion = repository.completeSignUpVerification("123456")

        assertThat(completion.isSuccess).isTrue()
        assertThat(repository.observeAuthState().value).isEqualTo(
            AuthState.SignedIn(ClerkUser("id", "rider@example.com", "Rider One", "password")),
        )
        assertThat(tokenStore.readJwt()).isEqualTo("verify_jwt")
    }

    @Test
    fun completeSignUpVerification_whenNoResolvedUser_transitionsToError() = runTest {
        val repository = ClerkAuthRepository(
            tokenStore = FakeTokenStore(),
            clerkGateway = FakeClerkGateway(
                signUpError = IllegalStateException("verification required"),
                verificationError = IllegalStateException("Verification completed but no authenticated user was available"),
            ),
            oauthGateway = PendingOAuthGateway(),
        )

        repository.signUp("rider@example.com", "password", "Rider One")
        val completion = repository.completeSignUpVerification("123456")

        assertThat(completion.isFailure).isTrue()
        assertThat(repository.observeAuthState().value).isEqualTo(
            AuthState.Error("Verification completed but no authenticated user was available"),
        )
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

private class CallbackCompletingOAuthGateway : OAuthGateway {
    private var pending: CompletableDeferred<OAuthResult>? = null

    override suspend fun signInWithGoogle(): OAuthResult {
        val deferred = CompletableDeferred<OAuthResult>()
        pending = deferred
        return deferred.await()
    }

    override suspend fun signInWithApple(): OAuthResult = signInWithGoogle()

    override suspend fun completeOAuthCallback(uri: android.net.Uri): OAuthResult {
        val completed = OAuthResult(
            userResult = Result.success(ClerkUser("oauth-id", "oauth@example.com", "OAuth User", "google")),
            jwt = "oauth_jwt",
        )
        pending?.complete(completed)
        return completed
    }
}

private class FakeClerkGateway(
    private val signUpError: Throwable? = null,
    private val jwt: String = "jwt",
    private val verificationJwt: String = "jwt",
    private val verificationError: Throwable? = null,
) : ClerkGateway {
    private var signedUpUser: ClerkUser? = null

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
        Result.success(ClerkUser("id", email, "Name", "password"))

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> {
        val user = ClerkUser("id", email, name, "password")
        signedUpUser = user
        return signUpError?.let { Result.failure(it) } ?: Result.success(user)
    }

    override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> {
        verificationError?.let { return Result.failure(it) }
        return Result.success(signedUpUser ?: ClerkUser("id", "rider@example.com", "Rider One", "password"))
    }

    override suspend fun signOut(): Result<Unit> = Result.success(Unit)

    override suspend fun getJwt(): Result<String> = Result.success(jwt)

    override suspend fun getVerificationJwt(): Result<String> = Result.success(verificationJwt)
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
