package com.laneshadow.services

import android.content.Context
import com.laneshadow.BuildConfig
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.ui.organisms.Session
import dagger.hilt.android.qualifiers.ApplicationContext
import dev.convex.android.AuthProvider
import dev.convex.android.ConvexClientWithAuth
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

data class ConvexCurrentUser(
    val id: String,
    val displayName: String,
)

internal interface ConvexGateway {
    suspend fun bindAuthToken(token: String): Result<Unit>
    suspend fun clearAuth(context: Context): Result<Unit>
    suspend fun getCurrentUser(): ConvexCurrentUser?
    fun observeSessions(): Flow<List<Session>> = emptyFlow()
    suspend fun sendMessage(sessionId: String, content: String): Result<Unit> =
        Result.failure(UnsupportedOperationException("sendMessage is not implemented by this gateway"))
    suspend fun createSession(firstMessage: String): Result<String> =
        Result.failure(UnsupportedOperationException("createSession is not implemented by this gateway"))
}

@Singleton
class ConvexClientProvider private constructor(
    @ApplicationContext private val appContext: Context,
    private val authRepository: AuthRepository,
    private val activeGateway: ConvexGateway,
) {
    @Inject
    constructor(
        @ApplicationContext appContext: Context,
        authRepository: AuthRepository,
    ) : this(
        appContext = appContext,
        authRepository = authRepository,
        activeGateway = RealConvexGateway(authRepository),
    )

    internal constructor(
        authRepository: AuthRepository,
        appContext: Context,
        convexGateway: ConvexGateway,
    ) : this(appContext, authRepository, convexGateway)

    fun observeSessions(): Flow<List<Session>> = flow {
        bindClerkJwtBeforeAuthenticatedQuery().getOrThrow()
        activeGateway.observeSessions()
            .catch { error ->
                handleConvexError(error)
                throw error
            }
            .collect { emit(it) }
    }

    suspend fun getCurrentUser(): Result<ConvexCurrentUser> = runAuthenticated {
        val currentUser = activeGateway.getCurrentUser()
            ?: throw IllegalStateException("Current rider profile unavailable")
        currentUser
    }

    suspend fun sendMessage(
        sessionId: String,
        content: String,
    ): Result<Unit> = runAuthenticated {
        activeGateway.sendMessage(sessionId, content).getOrThrow()
    }

    suspend fun createSession(
        firstMessage: String = "",
    ): Result<String> = runAuthenticated {
        activeGateway.createSession(firstMessage).getOrThrow()
    }

    suspend fun signOut(): Result<Unit> {
        val authResult = authRepository.signOut()
        activeGateway.clearAuth(appContext)
        return authResult
    }

    private suspend fun bindClerkJwtBeforeAuthenticatedQuery(): Result<Unit> = runCatching {
        val token = authRepository.getJwtForConvex()
        activeGateway.bindAuthToken(token).getOrThrow()
    }

    private suspend fun <T> runAuthenticated(block: suspend () -> T): Result<T> {
        val bindResult = bindClerkJwtBeforeAuthenticatedQuery()
        if (bindResult.isFailure) {
            return Result.failure(bindResult.exceptionOrNull() ?: IllegalStateException("Convex auth binding failed"))
        }

        return runCatching { block() }.recoverCatching { error ->
            handleConvexError(error)
            throw error
        }
    }

    private suspend fun handleConvexError(error: Throwable) {
        if (!error.isUnauthenticatedConvexError()) {
            return
        }
        activeGateway.clearAuth(appContext)
        authRepository.handleUnauthenticated(SessionExpiredMessage)
    }

    private fun Throwable.isUnauthenticatedConvexError(): Boolean =
        message?.contains(UnauthenticatedCode) == true ||
            cause?.message?.contains(UnauthenticatedCode) == true ||
            toString().contains(UnauthenticatedCode)

    private companion object {
        const val UnauthenticatedCode = "UNAUTHENTICATED"
        const val SessionExpiredMessage = "Your session expired. Please sign in again."
    }
}

private class RealConvexGateway(
    private val authRepository: AuthRepository,
) : ConvexGateway {
    private val convexAuthProvider = object : AuthProvider<String> {
        override suspend fun login(context: Context, onIdToken: (String?) -> Unit): Result<String> =
            loginFromCache(onIdToken)

        override suspend fun loginFromCache(onIdToken: (String?) -> Unit): Result<String> =
            runCatching {
                val token = authRepository.getJwtForConvex()
                onIdToken(token)
                token
            }

        override suspend fun logout(context: Context): Result<Void> =
            authRepository.signOut().fold(
                onSuccess = { Result.success(null as Void) },
                onFailure = { error -> Result.failure(error) },
            )

        override fun extractIdToken(authResult: String): String = authResult
    }

    private val convexClient = ConvexClientWithAuth(
        BuildConfig.CONVEX_DEPLOYMENT,
        convexAuthProvider,
        CoroutineScope(SupervisorJob() + Dispatchers.IO),
    )

    override suspend fun bindAuthToken(token: String): Result<Unit> =
        convexClient.loginFromCache().map { Unit }

    override suspend fun clearAuth(context: Context): Result<Unit> =
        convexClient.logout(context).map { Unit }

    override suspend fun getCurrentUser(): ConvexCurrentUser? {
        val currentUser = convexClient.subscribe<CurrentUserDto?>(
            name = "db/users:getCurrentUser",
        ).first().getOrThrow()
        return currentUser?.toCurrentUser()
    }

    override fun observeSessions(): Flow<List<Session>> {
        return convexClient.subscribe<List<PlanningSessionDto>>(
            name = "db/planningSessions:list",
        ).map { result ->
            result.getOrThrow().map { it.toSession() }
        }
    }

    override suspend fun sendMessage(sessionId: String, content: String): Result<Unit> = runCatching {
        convexClient.mutation<Map<String, String>>(
            name = "db/sessionMessages:send",
            args = mapOf(
                "sessionId" to sessionId,
                "content" to content,
            ),
        )
        Unit
    }

    override suspend fun createSession(firstMessage: String): Result<String> = runCatching {
        val result = convexClient.mutation<CreateSessionResponse>(
            name = "db/planningSessions:createSession",
            args = mapOf("firstMessage" to firstMessage),
        )
        result.sessionId
    }
}

@Serializable
private data class CurrentUserDto(
    @SerialName("_id") val id: String = "",
    val name: String = "",
    val email: String = "",
) {
    fun toCurrentUser(): ConvexCurrentUser =
        ConvexCurrentUser(
            id = id,
            displayName = name.ifBlank { "Rider" },
        )
}

@Serializable
private data class PlanningSessionDto(
    val id: String,
    val title: String,
    @SerialName("preview") val previewText: String = "",
    val meta: String = "",
    @SerialName("when") val whenLabel: String = "",
    val active: Boolean = false,
    val routeIds: List<String> = emptyList(),
    val createdAt: String = "",
) {
    fun toSession(): Session {
        return Session(
            id = id,
            title = title,
            preview = previewText,
            meta = meta,
            whenLabel = whenLabel,
            isActive = active,
            routeIds = routeIds,
            createdAt = createdAt,
        )
    }
}

@Serializable
private data class CreateSessionResponse(
    val sessionId: String,
)
