package com.laneshadow.services

import com.laneshadow.BuildConfig
import com.laneshadow.ui.organisms.Session
import dev.convex.android.ConvexClient
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

interface AuthRepository {
    suspend fun getJwtForConvex(): String?
}

@Singleton
class ConvexClientProvider
@Inject
constructor(
    private val authRepository: AuthRepository,
) {
    private val convexClient: ConvexClient = ConvexClient(BuildConfig.CONVEX_DEPLOYMENT)

    private val authTokenProvider: suspend () -> String? = {
        authRepository.getJwtForConvex()
    }

    init {
        bindAuthCallbackIfSupported()
    }

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
        convexClient.action<Unit>(
            name = "actions/agent/sendMessage:sendMessage",
            args = mapOf(
                "sessionId" to sessionId,
                "content" to content,
            ),
        )
    }

    suspend fun createSession(
        firstMessage: String = "",
    ): Result<String> = runCatching {
        convexClient.mutation<String>(
            name = "db/planningSessions:create",
            args = mapOf("firstMessage" to firstMessage),
        )
    }

    @Suppress("TooGenericExceptionCaught")
    private fun bindAuthCallbackIfSupported() {
        try {
            val setAuth = convexClient.javaClass.methods.firstOrNull { method ->
                method.name == "setAuth"
            }
            if (setAuth != null) {
                setAuth.invoke(convexClient, authTokenProvider)
            }
        } catch (_: Throwable) {
            // Current Convex SDK versions may not expose setAuth directly.
            // Keep callback wiring intent colocated with provider for forward compatibility.
        }
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
