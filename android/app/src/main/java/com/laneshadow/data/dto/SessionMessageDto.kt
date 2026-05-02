package com.laneshadow.data.dto

import com.laneshadow.data.chat.SessionMessage
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SessionMessageDto(
    @SerialName("_id") val id: String = "",
    val sessionId: String = "",
    val role: String = "rider",
    val content: String = "",
    val status: String? = null,
    val kind: String? = null,
    val createdAt: Long = 0L,
) {
    fun toDomain(): SessionMessage =
        SessionMessage(
            id = id,
            sessionId = sessionId,
            role = role,
            content = content,
            status = status,
            kind = kind,
            createdAt = createdAt,
        )
}
