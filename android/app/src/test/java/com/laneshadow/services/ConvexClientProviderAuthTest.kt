package com.laneshadow.services

import android.content.Context
import com.google.common.truth.Truth.assertThat
import com.laneshadow.data.model.AuthState
import com.laneshadow.data.model.ClerkUser
import com.laneshadow.data.route.RoutePlan
import com.laneshadow.data.session.PlanningSession
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.ui.organisms.Session
import com.laneshadow.ui.atoms.LatLng
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json
import org.junit.Test

class ConvexClientProviderAuthTest {
    @Test
    fun successfulConvexLogoutResultDoesNotThrowForNullVoidValue() {
        val result = successfulConvexLogoutResult()

        assertThat(result.isSuccess).isTrue()
    }

    @Test
    fun getCurrentUserBindsClerkJwtBeforeQueryingConvex() = runTest {
        val convexGateway = RecordingConvexGateway(
            currentUser = ConvexCurrentUser(id = "user_1", displayName = "Elena Ride"),
        )
        val provider = ConvexClientProvider(
            authRepository = FakeAuthRepository(jwt = "clerk_jwt"),
            appContext = android.app.Application(),
            convexGateway = convexGateway,
        )

        val user = provider.getCurrentUser().getOrThrow()

        assertThat(convexGateway.boundTokens).containsExactly("clerk_jwt")
        assertThat(convexGateway.queryNames).containsExactly("db/users:getCurrentUser")
        assertThat(user.displayName).isEqualTo("Elena Ride")
    }

    @Test
    fun unauthenticatedConvexErrorClearsConvexAuthAndRedirectsToAuthStateError() = runTest {
        val authRepository = FakeAuthRepository(jwt = "expired_jwt")
        val convexGateway = RecordingConvexGateway(
            currentUserFailure = IllegalStateException("UNAUTHENTICATED: token expired"),
        )
        val provider = ConvexClientProvider(
            authRepository = authRepository,
            appContext = android.app.Application(),
            convexGateway = convexGateway,
        )

        val result = provider.getCurrentUser()

        assertThat(result.isFailure).isTrue()
        assertThat(convexGateway.logoutCount).isEqualTo(1)
        assertThat(authRepository.observeAuthState().value).isEqualTo(
            AuthState.Error("Your session expired. Please sign in again."),
        )
    }

    @Test
    fun signOutClearsRepositoryAuthAndConvexAuth() = runTest {
        val authRepository = FakeAuthRepository(jwt = "session_jwt")
        val convexGateway = RecordingConvexGateway()
        val provider = ConvexClientProvider(
            authRepository = authRepository,
            appContext = android.app.Application(),
            convexGateway = convexGateway,
        )

        val result = provider.signOut()

        assertThat(result.isSuccess).isTrue()
        assertThat(authRepository.signOutCount).isEqualTo(1)
        assertThat(authRepository.observeAuthState().value).isEqualTo(AuthState.SignedOut)
        assertThat(convexGateway.logoutCount).isEqualTo(1)
    }

    @Test
    fun sendMessageResponseDto_decodesAttachmentsBearingResponseShape() {
        val payload = """
            {
              "response": "Route plan generated",
              "messageId": "message_42",
              "attachments": [
                {
                  "type": "route_plan",
                  "routePlanId": "plan_7"
                }
              ]
            }
        """.trimIndent()

        val decoded = Json.decodeFromString<ConvexSendMessageResponseDto>(payload)

        assertThat(decoded.response).isEqualTo("Route plan generated")
        assertThat(decoded.messageId).isEqualTo("message_42")
        assertThat(decoded.attachments).isNotNull()
        assertThat(decoded.attachments!!).containsExactly(
            ConvexSendMessageAttachmentDto(
                type = "route_plan",
                routePlanId = "plan_7",
            ),
        )
    }
}

private class RecordingConvexGateway(
    private val currentUser: ConvexCurrentUser? = null,
    private val currentUserFailure: Throwable? = null,
) : ConvexGateway {
    val boundTokens = mutableListOf<String>()
    val queryNames = mutableListOf<String>()
    var logoutCount = 0

    override suspend fun bindAuthToken(token: String): Result<Unit> {
        boundTokens += token
        return Result.success(Unit)
    }

    override suspend fun clearAuth(context: Context): Result<Unit> {
        logoutCount += 1
        return Result.success(Unit)
    }

    override suspend fun getCurrentUser(): ConvexCurrentUser? {
        queryNames += "db/users:getCurrentUser"
        currentUserFailure?.let { throw it }
        return currentUser
    }

    override fun observeCurrentUser() = emptyFlow<ConvexCurrentUser?>()

    override fun observePlanningSessions() = emptyFlow<List<PlanningSession>>()

    override fun observeSessionMessages(sessionId: String) = emptyFlow<List<com.laneshadow.data.chat.SessionMessage>>()

    override fun observeActiveRoutePlans(sessionId: String) = emptyFlow<List<RoutePlan>>()

    override fun observeSessions() = emptyFlow<List<Session>>()

    override suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLng?,
    ): Result<ConvexSendMessageResponseDto> =
        Result.failure(UnsupportedOperationException("not needed in this test"))

    override suspend fun createSession(firstMessage: String): Result<String> =
        Result.failure(UnsupportedOperationException("not needed in this test"))

    override suspend fun cancelPlan(routePlanId: String): Result<Unit> =
        Result.failure(UnsupportedOperationException("not needed in this test"))
}

private class FakeAuthRepository(
    private val jwt: String,
) : AuthRepository {
    var signOutCount = 0
        private set

    private val authState = MutableStateFlow<AuthState>(
        AuthState.SignedIn(ClerkUser("id", "rider@example.com", "Rider", "password")),
    )

    override suspend fun signIn(email: String, password: String): Result<ClerkUser> =
        Result.success(ClerkUser("id", email, "Rider", "password"))

    override suspend fun signUp(email: String, password: String, name: String): Result<ClerkUser> =
        Result.success(ClerkUser("id", email, name, "password"))

    override suspend fun completeSignUpVerification(code: String): Result<ClerkUser> =
        Result.success(ClerkUser("id", "rider@example.com", "Rider", "password"))

    override suspend fun signOut(): Result<Unit> {
        signOutCount += 1
        authState.value = AuthState.SignedOut
        return Result.success(Unit)
    }

    override suspend fun handleUnauthenticated(message: String): Result<Unit> {
        authState.value = AuthState.Error(message)
        return Result.success(Unit)
    }

    override suspend fun signInWithGoogle(): Result<ClerkUser> =
        Result.success(ClerkUser("id", "rider@example.com", "Rider", "google"))

    override suspend fun signInWithApple(): Result<ClerkUser> =
        Result.success(ClerkUser("id", "rider@example.com", "Rider", "apple"))

    override suspend fun handleOAuthCallback(uri: android.net.Uri): Result<ClerkUser> =
        Result.success(ClerkUser("id", "rider@example.com", "Rider", "oauth"))

    override suspend fun getJwtForConvex(): String = jwt
    override suspend fun bypassForTesting(): Result<ClerkUser> =
        Result.failure(UnsupportedOperationException("not needed in this test"))
    override fun observeAuthState(): StateFlow<AuthState> = authState
}
