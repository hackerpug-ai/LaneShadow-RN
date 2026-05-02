package com.laneshadow.data.dto

import com.laneshadow.data.session.PlanningSession
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PlanningSessionDto(
    @SerialName("_id") val id: String = "",
    val title: String = "",
    val status: String = "active",
    val createdAt: Long = 0L,
    val updatedAt: Long = 0L,
) {
    fun toDomain(): PlanningSession =
        PlanningSession(
            id = id,
            title = title,
            status = status,
            createdAt = createdAt,
            updatedAt = updatedAt,
        )
}
