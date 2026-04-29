package com.laneshadow.services

import android.content.Context
import com.laneshadow.BuildConfig
import com.laneshadow.data.repository.AuthRepository
import com.laneshadow.ui.organisms.Session
import dev.convex.android.AuthProvider
import dev.convex.android.ConvexClientWithAuth
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Singleton
class ConvexClientProvider
@Inject
constructor(
    private val authRepository: AuthRepository,
) {
    private val convexAuthProvider = object : AuthProvider<String> {
        override suspend fun login(context: Context, onIdToken: (String?) -> Unit): Result<String> =
            runCatching {
                val token = authRepository.getJwtForConvex()
                onIdToken(token)
                token
            }

        override suspend fun loginFromCache(onIdToken: (String?) -> Unit): Result<String> =
            runCatching {
                val token = authRepository.getJwtForConvex()
                onIdToken(token)
                token
            }

        @Suppress("UNCHECKED_CAST")
        override suspend fun logout(context: Context): Result<Void> = Result.success(null) as Result<Void>

        override fun extractIdToken(authData: String): String {
            return authData
        }
    }

    private val convexClient = ConvexClientWithAuth(
        BuildConfig.CONVEX_DEPLOYMENT,
        convexAuthProvider,
        CoroutineScope(SupervisorJob() + Dispatchers.IO),
    )

    fun observeSessions(): Flow<List<Session>> {
        return convexClient.subscribe<List<PlanningSessionDto>>(
            name = "db/planningSessions:list",
        ).map { result ->
            result.getOrThrow().map { it.toSession() }
        }
    }

    suspend fun sendMessage(
        sessionId: String,
        content: String,
    ): Result<Unit> = runCatching {
        convexClient.mutation<Map<String, String>>(
            name = "db/sessionMessages:send",
            args = mapOf(
                "sessionId" to sessionId,
                "content" to content,
            ),
        )
        Unit
    }

    suspend fun createSession(
        firstMessage: String = "",
    ): Result<String> = runCatching {
        val result = convexClient.mutation<CreateSessionResponse>(
            name = "db/planningSessions:createSession",
            args = mapOf("firstMessage" to firstMessage),
        )
        result.sessionId
    }
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
