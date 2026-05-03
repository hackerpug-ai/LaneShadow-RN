package com.laneshadow.data.dto

import com.laneshadow.data.route.RoutePlan
import com.laneshadow.services.RouteOption
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class RoutePlanDto(
    @SerialName("_id") val id: String = "",
    val status: String = "pending",
    val statusMessage: String? = null,
    val errorCode: String? = null,
    val errorMessage: String? = null,
    val result: RoutePlanResultDto? = null,
) {
    fun toDomain(): RoutePlan =
        RoutePlan(
            id = id,
            status = status,
            options = result?.options?.map { it.toDomain() }.orEmpty(),
            statusMessage = statusMessage,
            errorCode = errorCode,
            errorMessage = errorMessage,
        )
}

@Serializable
data class RoutePlanResultDto(
    val options: List<RouteOptionDto> = emptyList(),
)

@Serializable
data class RouteOptionDto(
    val routeOptionId: String = "",
    val label: String? = null,
    val rationale: String? = null,
) {
    fun toDomain(): RouteOption =
        RouteOption(routeOptionId = routeOptionId)
}
