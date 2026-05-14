package com.laneshadow.data.chat

import com.laneshadow.ui.atoms.LatLng
import com.laneshadow.services.ConvexClientProvider
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow

data class SessionMessage(
    val id: String = "",
    val sessionId: String = "",
    val role: String = "rider",
    val content: String = "",
    val status: String? = null,
    val kind: String? = null,
    val phase: String? = null,
    val thinkingSteps: List<SessionThinkingStep>? = null,
    val createdAt: Long = 0L,
)

data class SessionThinkingStep(
    val type: String,
    val toolName: String? = null,
    val summary: String,
    val detail: String? = null,
    val timestamp: Long,
)

interface ChatRepository {
    fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>>

    suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLng? = null,
    ): Result<Unit>
}

@Singleton
class ChatRepositoryImpl @Inject constructor(
    private val convexClientProvider: ConvexClientProvider,
) : ChatRepository {
    override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> =
        convexClientProvider.observeSessionMessages(sessionId)

    override suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLng?,
    ): Result<Unit> =
        convexClientProvider.sendMessage(sessionId, content, currentLocation)
}
