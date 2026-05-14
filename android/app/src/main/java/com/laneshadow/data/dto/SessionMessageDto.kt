package com.laneshadow.data.dto

import com.laneshadow.data.chat.SessionMessage
import com.laneshadow.data.chat.SessionThinkingStep
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
    val phase: String? = null,
    val thinkingSteps: List<SessionThinkingStepDto>? = null,
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
            phase = phase,
            thinkingSteps = thinkingSteps?.map { it.toDomain() },
            createdAt = createdAt,
        )
}

@Serializable
data class SessionThinkingStepDto(
    val type: String,
    val toolName: String? = null,
    val summary: String,
    val detail: String? = null,
    val timestamp: Long,
) {
    fun toDomain(): SessionThinkingStep =
        SessionThinkingStep(
            type = type,
            toolName = toolName,
            summary = summary,
            detail = detail,
            timestamp = timestamp,
        )
}
