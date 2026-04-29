package com.laneshadow.data.repository

import android.net.Uri
import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.store.TokenStore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.runTest
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [30], manifest = Config.NONE)
class AuthRepositoryTddTest {

    @Test
    fun ac1_authRepositoryDefinesRequiredMethods() {
        val methods = AuthRepository::class.java.methods.map { it.name }
        assertThat(methods.any { it.startsWith("signIn") }).isTrue()
        assertThat(methods.any { it.startsWith("signUp") }).isTrue()
        assertThat(methods.any { it.startsWith("signOut") }).isTrue()
        assertThat(methods.any { it.startsWith("getJwtForConvex") }).isTrue()
        assertThat(methods).contains("observeAuthState")
    }

    @Test
    fun ac2_authStateContainsRequiredVariants() {
        val signedOut: AuthState = AuthState.SignedOut
        val loading: AuthState = AuthState.Loading
        val signedIn: AuthState = AuthState.SignedIn(ClerkUser("u1", "user@example.com", "Test User", "password"))
        val error: AuthState = AuthState.Error("boom")

        assertThat(signedOut).isEqualTo(AuthState.SignedOut)
        assertThat(loading).isEqualTo(AuthState.Loading)
        assertThat((signedIn as AuthState.SignedIn).user.id).isEqualTo("u1")
        assertThat((error as AuthState.Error).message).isEqualTo("boom")
    }

    @Test
    fun ac3_clerkAuthRepositoryImplementsAuthRepository() {
        val repo: AuthRepository = ClerkAuthRepository(
            tokenStore = InMemoryTokenStore(),
            clerkGateway = FakeClerkGateway(),
            oauthGateway = FakeOAuthGateway()
        )
        assertThat(repo).isInstanceOf(AuthRepository::class.java)
    }

    @Test
    fun ac4_customTabsAuthRepositoryFallbackExists() = runTest {
        val repo = CustomTabsAuthRepository(InMemoryTokenStore())
        val result = repo.handleOAuthCallback(Uri.parse("laneshadow://oauth-callback?token=jwt-123&provider=google"))
        assertThat(result.isSuccess).isTrue()
    }

    @Test
    fun ac5_encryptedTokenStoreContractPersistsJwt() = runTest {
        val store = InMemoryTokenStore()
        store.saveJwt("jwt-token")
        assertThat(store.readJwt()).isEqualTo("jwt-token")
        store.clear()
        assertThat(store.readJwt()).isNull()
    }

    @Test
    fun ac8_emailPasswordSignInTransitionsToSignedInAndStoresToken() = runTest {
        val stateFlow = MutableStateFlow<AuthState>(AuthState.SignedOut)
        val store = InMemoryTokenStore()
        val clerk = FakeClerkGateway(
            signInResult = Result.success(ClerkUser("u1", "user@example.com", "User", "password")),
            jwtResult = Result.success("jwt-email")
        )
        val repo = ClerkAuthRepository(store, clerk, FakeOAuthGateway(), stateFlow)

        val result = repo.signIn("user@example.com", "password")

        assertThat(result.isSuccess).isTrue()
        assertThat(stateFlow.value).isEqualTo(AuthState.SignedIn(ClerkUser("u1", "user@example.com", "User", "password")))
        assertThat(store.readJwt()).isEqualTo("jwt-email")
    }

    @Test
    fun ac9_googleOAuthTransitionsToSignedIn() = runTest {
        val store = InMemoryTokenStore()
        val repo = ClerkAuthRepository(
            tokenStore = store,
            clerkGateway = FakeClerkGateway(),
            oauthGateway = FakeOAuthGateway(
                googleResult = Result.success(ClerkUser("g1", "g@example.com", "Google User", "google")),
                googleJwt = "jwt-google"
            )
        )

        val result = repo.signInWithGoogle()

        assertThat(result.isSuccess).isTrue()
        assertThat(repo.observeAuthState().value).isEqualTo(AuthState.SignedIn(ClerkUser("g1", "g@example.com", "Google User", "google")))
        assertThat(store.readJwt()).isEqualTo("jwt-google")
    }

    @Test
    fun ac10_appleOAuthTransitionsToSignedIn() = runTest {
        val store = InMemoryTokenStore()
        val repo = ClerkAuthRepository(
            tokenStore = store,
            clerkGateway = FakeClerkGateway(),
            oauthGateway = FakeOAuthGateway(
                appleResult = Result.success(ClerkUser("a1", "a@example.com", "Apple User", "apple")),
                appleJwt = "jwt-apple"
            )
        )

        val result = repo.signInWithApple()

        assertThat(result.isSuccess).isTrue()
        assertThat(repo.observeAuthState().value).isEqualTo(AuthState.SignedIn(ClerkUser("a1", "a@example.com", "Apple User", "apple")))
        assertThat(store.readJwt()).isEqualTo("jwt-apple")
    }

    @Test
    fun ac11_oauthCallbackParsesDeepLinkTokens() = runTest {
        val repo = CustomTabsAuthRepository(InMemoryTokenStore())
        val result = repo.handleOAuthCallback(Uri.parse("laneshadow://oauth-callback?token=jwt-123&provider=google&user_id=u123"))

        assertThat(result.getOrThrow().id).isEqualTo("u123")
        assertThat(repo.getJwtForConvex()).isEqualTo("jwt-123")
    }

    @Test
    fun ac12_getJwtForConvexReturnsJwt() = runTest {
        val store = InMemoryTokenStore()
        store.saveJwt("convex-jwt")
        val repo = ClerkAuthRepository(store, FakeClerkGateway(), FakeOAuthGateway())

        assertThat(repo.getJwtForConvex()).isEqualTo("convex-jwt")
    }

    @Test
    fun ac13_signOutClearsStateAndStorage() = runTest {
        val stateFlow = MutableStateFlow<AuthState>(AuthState.SignedIn(ClerkUser("u1", "u@example.com", "User", "password")))
        val store = InMemoryTokenStore()
        store.saveJwt("jwt-existing")
        val repo = ClerkAuthRepository(store, FakeClerkGateway(signOutResult = Result.success(Unit)), FakeOAuthGateway(), stateFlow)

        repo.signOut()

        assertThat(stateFlow.value).isEqualTo(AuthState.SignedOut)
        assertThat(store.readJwt()).isNull()
    }

    @Test
    fun ac14_signUpCreatesUserAndTransitionsToSignedIn() = runTest {
        val stateFlow = MutableStateFlow<AuthState>(AuthState.SignedOut)
        val store = InMemoryTokenStore()
        val clerk = FakeClerkGateway(
            signUpResult = Result.success(ClerkUser("n1", "new@example.com", "New User", "password")),
            jwtResult = Result.success("jwt-signup")
        )
        val repo = ClerkAuthRepository(store, clerk, FakeOAuthGateway(), stateFlow)

        val result = repo.signUp("new@example.com", "password", "New User")

        assertThat(result.isSuccess).isTrue()
        assertThat(stateFlow.value).isEqualTo(AuthState.SignedIn(ClerkUser("n1", "new@example.com", "New User", "password")))
        assertThat(store.readJwt()).isEqualTo("jwt-signup")
    }
}

private class InMemoryTokenStore : TokenStore {
    private var jwt: String? = null

    override suspend fun saveJwt(token: String) { jwt = token }
    override suspend fun readJwt(): String? = jwt
    override suspend fun clear() { jwt = null }
}

private class FakeClerkGateway(
    private val signInResult: Result<ClerkUser> = Result.failure(IllegalStateException("not configured")),
    private val signUpResult: Result<ClerkUser> = Result.failure(IllegalStateException("not configured")),
    private val signOutResult: Result<Unit> = Result.success(Unit),
    private val jwtResult: Result<String> = Result.success("jwt-default")
) : ClerkGateway {
    override suspend fun signIn(email: String, password: String): Result<ClerkUser> = signInResult
    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> = signUpResult
    override suspend fun signOut(): Result<Unit> = signOutResult
    override suspend fun getJwt(): Result<String> = jwtResult
}

private class FakeOAuthGateway(
    private val googleResult: Result<ClerkUser> = Result.failure(IllegalStateException("not configured")),
    private val appleResult: Result<ClerkUser> = Result.failure(IllegalStateException("not configured")),
    private val googleJwt: String = "",
    private val appleJwt: String = ""
) : OAuthGateway {
    override suspend fun signInWithGoogle(): OAuthResult = OAuthResult(googleResult, googleJwt)
    override suspend fun signInWithApple(): OAuthResult = OAuthResult(appleResult, appleJwt)
}
