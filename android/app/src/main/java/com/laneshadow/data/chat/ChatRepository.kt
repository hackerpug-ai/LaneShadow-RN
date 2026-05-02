package com.laneshadow.data.chat

import com.laneshadow.data.dto.SessionMessageDto
import com.laneshadow.ui.atoms.LatLng
import dev.convex.android.ConvexClient
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable

data class SessionMessage(
    val id: String = "",
    val sessionId: String = "",
    val role: String = "rider",
    val content: String = "",
    val status: String? = null,
    val kind: String? = null,
    val createdAt: Long = 0L,
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
    private val convexClient: ConvexClient,
) : ChatRepository {
    override fun subscribeToMessages(sessionId: String): Flow<List<SessionMessage>> =
        convexClient.subscribe<List<SessionMessageDto>>(
            name = "db/sessionMessages:list",
            args = mapOf("sessionId" to sessionId),
        ).map { result ->
            result.getOrDefault(emptyList()).map { it.toDomain() }
        }.catch {
            emit(emptyList())
        }

    override suspend fun sendMessage(
        sessionId: String,
        content: String,
        currentLocation: LatLng?,
    ): Result<Unit> = runCatching {
        convexClient.action<SendMessageResponseDto>(
            name = "actions/agent/sendMessage:sendMessage",
            args = buildMap {
                put("sessionId", sessionId)
                put("content", content)
                currentLocation?.let {
                    put(
                        "currentLocation",
                        mapOf(
                            "lat" to it.lat,
                            "lng" to it.lon,
                        ),
                    )
                }
            },
        )
        Unit
    }
}

@Serializable
private data class SendMessageResponseDto(
    val response: String = "",
    val messageId: String = "",
    val attachments: List<SendMessageAttachmentDto>? = null,
)

@Serializable
private data class SendMessageAttachmentDto(
    val type: String = "",
    val routePlanId: String? = null,
)
